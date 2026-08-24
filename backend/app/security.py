"""
security.py - Security utilities for PHI backend.

This module provides security-related utilities including:
- JWT authentication
- Input sanitization
- Rate limiting configuration
- Security headers
"""

import os
import re
from datetime import datetime, timedelta
from typing import Optional, Any, Dict
import logging

from fastapi import HTTPException, status, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from passlib.context import CryptContext

logger = logging.getLogger("phi.security")

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================

class JWTAuth:
    """
    JWT Authentication utilities for PHI API.
    
    Usage:
        auth = JWTAuth()
        
        # Create token
        token = auth.create_token({"user_id": "123", "role": "driver"})
        
        # Verify token
        payload = auth.verify_token(token)
        
        # Protect endpoint
        @app.get("/protected")
        async def protected_endpoint(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
            payload = auth.verify_token(credentials.credentials)
            return {"user_id": payload.user_id}
    """
    
    def __init__(
        self,
        secret_key: Optional[str] = None,
        algorithm: str = "HS256",
        access_token_expire_minutes: int = 30,
    ):
        """
        Initialize JWT authentication.
        
        Args:
            secret_key: JWT secret key. If None, uses JWT_SECRET_KEY env var.
            algorithm: JWT algorithm (default: HS256)
            access_token_expire_minutes: Token expiration in minutes
        """
        self.secret_key = secret_key or os.getenv("JWT_SECRET_KEY", "change-me-in-production")
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.bearer = HTTPBearer()
    
    def create_access_token(
        self,
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: Payload data to include in the token
            expires_delta: Optional custom expiration delta
            
        Returns:
            JWT token string
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=self.access_token_expire_minutes
            )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode a JWT token.
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded payload
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Expired token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return self.pwd_context.verify(plain_password, hashed_password)


# Global JWT auth instance
jwt_auth = JWTAuth()


# =============================================================================
# INPUT SANITIZATION
# =============================================================================

def sanitize_input(
    text: Optional[str],
    max_length: int = 1000,
    allow_html: bool = False,
) -> str:
    """
    Sanitize user input to prevent XSS and injection attacks.
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length
        allow_html: Whether to allow HTML tags
        
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Trim and normalize
    text = text.strip()
    
    try:
        import bleach
        if allow_html:
            # Allow basic formatting
            cleaned = bleach.clean(
                text,
                tags=["b", "i", "em", "strong", "p", "br", "a"],
                attributes={"a": ["href", "title"]},
                strip=False,
            )
        else:
            # Remove all HTML tags
            cleaned = bleach.clean(text, tags=[], attributes={}, strip=True)
        
        # Limit length
        return cleaned[:max_length]
    except ImportError:
        # Fallback: remove HTML manually and limit length
        if not allow_html:
            # Remove HTML tags using regex (not perfect but better than nothing)
            text = re.sub(r'<[^>]*>', '', text)
        return text[:max_length]


def sanitize_filename(filename: str, max_length: int = 255) -> str:
    """
    Sanitize a filename to prevent path traversal attacks.
    
    Args:
        filename: Original filename
        max_length: Maximum allowed length
        
    Returns:
        Sanitized filename
    """
    # Remove path separators and null bytes
    filename = filename.replace('/', '').replace('\\', '').replace('\x00', '')
    # Remove control characters
    filename = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', filename)
    # Limit length
    return filename[:max_length]


def sanitize_sql(text: str) -> str:
    """
    Basic SQL injection prevention by escaping quotes.
    Note: This is NOT a substitute for parameterized queries!
    
    Args:
        text: Input text
        
    Returns:
        Text with escaped quotes
    """
    if not text:
        return ""
    return text.replace("'", "''").replace('"', '""')


# =============================================================================
# ADMIN TOKEN VERIFICATION
# =============================================================================

def require_admin_token(
    x_phi_admin_token: Optional[str] = Header(default=None),
) -> None:
    """
    Verify the PHI_ADMIN_TOKEN header for admin operations.
    
    Args:
        x_phi_admin_token: Admin token from header
        
    Raises:
        HTTPException: If token is missing or invalid
    """
    configured_token = os.getenv("PHI_ADMIN_TOKEN")
    if not configured_token:
        raise HTTPException(
            status_code=503,
            detail="Customer operations require PHI_ADMIN_TOKEN to be configured.",
        )
    if x_phi_admin_token != configured_token:
        raise HTTPException(status_code=401, detail="Invalid customer operations token.")


# =============================================================================
# RATE LIMIT CONFIGURATION
# =============================================================================

class RateLimitConfig:
    """
    Rate limit configuration for different endpoint types.
    
    Usage:
        from fastapi import Request
        from .security import rate_limits
        
        @app.get("/api/endpoint")
        @rate_limits.limit("api_default")
        async def endpoint(request: Request):
            ...
    """
    
    def __init__(self):
        # Rate limits: (requests, period in seconds)
        self.limits = {
            # Public endpoints
            "public": (10, 60),      # 10 requests/minute
            "auth": (5, 60),         # 5 requests/minute
            
            # Authenticated endpoints
            "api_default": (60, 60), # 60 requests/minute
            "workflow": (5, 60),     # 5 requests/minute for workflows
            "heavy": (2, 60),        # 2 requests/minute for heavy operations
            
            # Admin endpoints
            "admin": (30, 60),       # 30 requests/minute
        }
    
    def get_limit(self, key: str) -> tuple:
        """Get rate limit for a given key."""
        return self.limits.get(key, self.limits["api_default"])


rate_limits = RateLimitConfig()


# =============================================================================
# REQUEST ID GENERATION
# =============================================================================

import uuid as uuid_module

def generate_request_id() -> str:
    """Generate a unique request ID."""
    return str(uuid_module.uuid4())


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "JWTAuth",
    "jwt_auth",
    "sanitize_input",
    "sanitize_filename",
    "sanitize_sql",
    "require_admin_token",
    "RateLimitConfig",
    "rate_limits",
    "generate_request_id",
]
