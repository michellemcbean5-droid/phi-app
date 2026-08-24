"""
Test suite for security utilities.

Tests JWT authentication, input sanitization, and security headers.
"""

import pytest
import os
from datetime import datetime, timedelta
from unittest.mock import patch

# Import security module
from app.security import (
    JWTAuth,
    jwt_auth,
    sanitize_input,
    sanitize_filename,
    sanitize_sql,
    require_admin_token,
    RateLimitConfig,
    rate_limits,
    generate_request_id,
)


class TestJWTAuth:
    """Tests for JWT authentication."""
    
    @pytest.fixture
    def auth(self):
        """Create a JWTAuth instance for testing."""
        return JWTAuth(
            secret_key="test-secret-key",
            algorithm="HS256",
            access_token_expire_minutes=30,
        )
    
    def test_create_access_token(self, auth):
        """Test creating an access token."""
        token = auth.create_access_token({"user_id": "123", "role": "driver"})
        
        assert token is not None
        assert isinstance(token, str)
        assert "." in token  # JWT tokens have dots
    
    def test_verify_valid_token(self, auth):
        """Test verifying a valid token."""
        payload = {"user_id": "123", "role": "driver"}
        token = auth.create_access_token(payload)
        
        verified = auth.verify_token(token)
        
        assert verified["user_id"] == "123"
        assert verified["role"] == "driver"
        assert "exp" in verified
    
    def test_verify_expired_token(self, auth):
        """Test verifying an expired token."""
        payload = {"user_id": "123"}
        # Create token with very short expiration
        auth.access_token_expire_minutes = 0
        token = auth.create_access_token(payload, expires_delta=timedelta(seconds=-1))
        
        with pytest.raises(Exception) as exc_info:
            auth.verify_token(token)
        
        assert "expired" in str(exc_info.value).lower() or "Expired" in str(exc_info.value)
    
    def test_verify_invalid_token(self, auth):
        """Test verifying an invalid token."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(Exception) as exc_info:
            auth.verify_token(invalid_token)
        
        assert "Invalid" in str(exc_info.value)
    
    def test_hash_password(self, auth):
        """Test password hashing."""
        password = "test-password-123"
        hash = auth.hash_password(password)
        
        assert hash is not None
        assert hash != password
        assert len(hash) > len(password)
    
    def test_verify_password(self, auth):
        """Test password verification."""
        password = "test-password-123"
        hash = auth.hash_password(password)
        
        assert auth.verify_password(password, hash) == True
        assert auth.verify_password("wrong-password", hash) == False


class TestInputSanitization:
    """Tests for input sanitization functions."""
    
    def test_sanitize_input_empty(self):
        """Test sanitizing empty input."""
        assert sanitize_input(None) == ""
        assert sanitize_input("") == ""
        assert sanitize_input("   ") == ""
    
    def test_sanitize_input_html(self):
        """Test sanitizing HTML input."""
        html = "<script>alert('xss')</script>"
        sanitized = sanitize_input(html)
        
        assert "<script>" not in sanitized
        assert ">" not in sanitized
        assert "alert" not in sanitized
    
    def test_sanitize_input_with_html_allowed(self):
        """Test sanitizing with HTML allowed."""
        html = "<b>Bold</b> and <i>italic</i>"
        sanitized = sanitize_input(html, allow_html=True)
        
        # Basic tags should be allowed
        assert "<b>" in sanitized or "Bold" in sanitized
    
    def test_sanitize_input_max_length(self):
        """Test sanitizing with max length."""
        long_text = "a" * 10000
        sanitized = sanitize_input(long_text, max_length=100)
        
        assert len(sanitized) <= 100
    
    def test_sanitize_filename(self):
        """Test filename sanitization."""
        # Test path traversal
        filename = "../../../etc/passwd"
        sanitized = sanitize_filename(filename)
        
        assert ".." not in sanitized
        assert "/" not in sanitized
        assert "\\" not in sanitized
        
        # Test null bytes
        filename = "test\x00file.txt"
        sanitized = sanitize_filename(filename)
        
        assert "\x00" not in sanitized
        
        # Test control characters
        filename = "test\x1bfile.txt"
        sanitized = sanitize_filename(filename)
        
        assert "\x1b" not in sanitized
    
    def test_sanitize_filename_max_length(self):
        """Test filename sanitization with max length."""
        long_filename = "a" * 1000 + ".txt"
        sanitized = sanitize_filename(long_filename, max_length=100)
        
        assert len(sanitized) <= 100
    
    def test_sanitize_sql(self):
        """Test SQL injection prevention."""
        malicious = "'; DROP TABLE users; --"
        sanitized = sanitize_sql(malicious)
        
        assert "'" not in sanitized or sanitized.count("'") % 2 == 0  # Escaped quotes
        assert ";" not in sanitized or "\\;" in sanitized


class TestAdminToken:
    """Tests for admin token verification."""
    
    def test_require_admin_token_valid(self):
        """Test admin token verification with valid token."""
        with patch.dict(os.environ, {'PHI_ADMIN_TOKEN': 'test-admin-token'}, clear=False):
            # Should not raise
            require_admin_token('test-admin-token')
    
    def test_require_admin_token_invalid(self):
        """Test admin token verification with invalid token."""
        with patch.dict(os.environ, {'PHI_ADMIN_TOKEN': 'test-admin-token'}, clear=False):
            with pytest.raises(Exception) as exc_info:
                require_admin_token('wrong-token')
            
            assert "Invalid" in str(exc_info.value)
    
    def test_require_admin_token_missing_config(self):
        """Test admin token verification with missing config."""
        with patch.dict(os.environ, {}, clear=False):
            # Remove PHI_ADMIN_TOKEN if it exists
            if 'PHI_ADMIN_TOKEN' in os.environ:
                del os.environ['PHI_ADMIN_TOKEN']
            
            with pytest.raises(Exception) as exc_info:
                require_admin_token('any-token')
            
            assert "503" in str(exc_info.value) or "required" in str(exc_info.value).lower()
    
    def test_require_admin_token_missing_header(self):
        """Test admin token verification with missing header."""
        with patch.dict(os.environ, {'PHI_ADMIN_TOKEN': 'test-admin-token'}, clear=False):
            with pytest.raises(Exception) as exc_info:
                require_admin_token(None)
            
            assert "Invalid" in str(exc_info.value) or "401" in str(exc_info.value)


class TestRateLimitConfig:
    """Tests for rate limit configuration."""
    
    def test_rate_limit_config(self):
        """Test rate limit configuration."""
        config = RateLimitConfig()
        
        assert config.limits is not None
        assert "public" in config.limits
        assert "api_default" in config.limits
        assert "workflow" in config.limits
    
    def test_get_limit(self):
        """Test getting rate limits."""
        config = RateLimitConfig()
        
        limit = config.get_limit("public")
        assert limit is not None
        assert len(limit) == 2  # (requests, period)
        
        limit = config.get_limit("nonexistent")
        assert limit is not None  # Should return default
    
    def test_global_rate_limits(self):
        """Test global rate limits instance."""
        assert rate_limits is not None
        assert rate_limits.limits is not None


class TestRequestID:
    """Tests for request ID generation."""
    
    def test_generate_request_id(self):
        """Test generating request IDs."""
        request_id_1 = generate_request_id()
        request_id_2 = generate_request_id()
        
        assert request_id_1 is not None
        assert request_id_2 is not None
        assert request_id_1 != request_id_2
        assert len(request_id_1) == 36  # UUID format


class TestGlobalJWTAuth:
    """Tests for global JWT auth instance."""
    
    def test_global_jwt_auth(self):
        """Test global JWT auth instance."""
        assert jwt_auth is not None
        assert isinstance(jwt_auth, JWTAuth)
    
    def test_global_jwt_auth_create_token(self):
        """Test creating token with global instance."""
        token = jwt_auth.create_access_token({"user_id": "test"})
        
        assert token is not None
        assert isinstance(token, str)


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
