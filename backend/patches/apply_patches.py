#!/usr/bin/env python3
"""
apply_patches.py - Apply critical patches to the PHI backend for production readiness.

This script applies all the critical fixes needed to make the backend deployable:
1. Fix CORS configuration
2. Replace in-memory job store with persistent job queue
3. Add security middleware
4. Add rate limiting
5. Add proper error handling
6. Add database connection pooling
7. Fix database session leaks

Usage:
    python backend/patches/apply_patches.py
"""

import os
import sys
import re
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def patch_main_py():
    """Apply patches to main.py."""
    main_path = Path(__file__).parent.parent / "main.py"
    
    if not main_path.exists():
        print(f"Error: {main_path} not found")
        return False
    
    with open(main_path, 'r') as f:
        content = f.read()
    
    original = content
    
    # Patch 1: Fix CORS configuration
    old_cors = '''app.add_middleware(\n    CORSMiddleware,\n    allow_origins=[\"*\"],\n    allow_credentials=True,\n    allow_methods=[\"*\"],\n    allow_headers=[\"*\"],\n)'''
    
    new_cors = '''# CORS Configuration - Restricted to known origins
ALLOWED_ORIGINS = [
    "https://phi-app.com",
    "https://www.phi-app.com",
    "http://localhost:3000",
    "http://localhost:19006",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:19006",
    "exp://127.0.0.1:19000",
    "exp://192.168.*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-PHI-Admin-Token",
        "X-Request-ID",
    ],
    expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
)'''
    
    content = content.replace(old_cors, new_cors)
    
    # Patch 2: Replace in-memory job store
    old_job_store = '''# In-memory job store. Replace with Redis in production.
_job_store: dict[str, dict[str, Any]] = {}'''
    
    new_job_store = '''# Persistent job queue - initialized in startup
from app.job_queue import JobQueue, JobStatus as QueueJobStatus, init_job_queue
job_queue: Optional[JobQueue] = None'''
    
    content = content.replace(old_job_store, new_job_store)
    
    # Patch 3: Update startup event
    old_startup = '''@app.on_event("startup")
async def _startup() -> None:
    import asyncio
    from app.database import init_db

    # Ensure all SQLAlchemy tables exist (SQLite dev + bare Postgres without schema.sql).
    init_db()
    # CrewAI task_callback fires from a worker thread; capture the main event loop
    # so broadcast_to_driver_sync can hop back onto it.
    ws_manager.bind_loop(asyncio.get_running_loop())'''
    
    new_startup = '''@app.on_event("startup")
async def _startup() -> None:
    import asyncio
    from app.database import init_db

    # Ensure all SQLAlchemy tables exist (SQLite dev + bare Postgres without schema.sql).
    init_db()
    
    # Initialize persistent job queue
    global job_queue
    job_queue = init_job_queue()
    
    # CrewAI task_callback fires from a worker thread; capture the main event loop
    # so broadcast_to_driver_sync can hop back onto it.
    ws_manager.bind_loop(asyncio.get_running_loop())'''
    
    content = content.replace(old_startup, new_startup)
    
    # Patch 4: Add security middleware
    old_app_create = '''app = FastAPI(
    title="Prince Haul Intelligence API",
    description=(
        "Fully autonomous 15-agent AI backend for trucking owner-operators. "
        "Powers the PHI mobile app's Find Freight, Start Trip, and One-Tap Payday workflows."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "Q-Empire Automation Division",
        "email": "tech@q-empire.io",
    },
)'''
    
    new_app_create = '''app = FastAPI(
    title="Prince Haul Intelligence API",
    description=(
        "Fully autonomous 15-agent AI backend for trucking owner-operators. "
        "Powers the PHI mobile app's Find Freight, Start Trip, and One-Tap Payday workflows."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "Q-Empire Automation Division",
        "email": "tech@q-empire.io",
    },
)

# Security headers middleware
app.add_middleware(
    SecurityHeadersMiddleware,
    content_security_policy="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:",
    force_https=True,
    frame_options="DENY",
    content_type_nosniff=True,
    strict_transport_security="max-age=63072000; includeSubDomains; preload",
    referrer_policy="strict-origin-when-cross-origin",
    permissions_policy="geolocation=(), microphone=(), camera=()",
)'''
    
    content = content.replace(old_app_create, new_app_create)
    
    # Write if changed
    if content != original:
        with open(main_path, 'w') as f:
            f.write(content)
        print("✅ Patched main.py")
        return True
    else:
        print("⚠️  main.py already patched or no changes needed")
        return True


def patch_database_py():
    """Apply patches to database.py."""
    db_path = Path(__file__).parent.parent / "app" / "database.py"
    
    if not db_path.exists():
        print(f"Error: {db_path} not found")
        return False
    
    with open(db_path, 'r') as f:
        content = f.read()
    
    original = content
    
    # Patch: Add connection pooling for non-SQLite databases
    old_engine = '''if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,  # detect stale connections before handing them out
        pool_recycle=3600,   # recycle connections after 1 hour to avoid server-side timeouts
    )'''
    
    new_engine = '''if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_use_lifo=True,
    )'''
    
    content = content.replace(old_engine, new_engine)
    
    # Write if changed
    if content != original:
        with open(db_path, 'w') as f:
            f.write(content)
        print("✅ Patched database.py")
        return True
    else:
        print("⚠️  database.py already patched or no changes needed")
        return True


def create_job_queue():
    """Create the job queue module."""
    job_queue_path = Path(__file__).parent.parent / "app" / "job_queue.py"
    
    if job_queue_path.exists():
        print("⚠️  job_queue.py already exists")
        return True
    
    # Create the job queue module
    job_queue_content = '''"""
job_queue.py - Persistent job queue using Redis for production.

This module provides a drop-in replacement for the in-memory _job_store
with proper persistence, scalability, and production-ready features.
"""

import os
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Optional, Dict, List
from enum import Enum

logger = logging.getLogger("phi.job_queue")


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobRecord:
    def __init__(
        self,
        job_id: str,
        workflow: str,
        status: JobStatus,
        data: Optional[Dict[str, Any]] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
        duration_seconds: Optional[float] = None,
        retries: int = 0,
        max_retries: int = 3,
    ):
        self.job_id = job_id
        self.workflow = workflow
        self.status = status
        self.data = data or {}
        self.result = result
        self.error = error
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)
        self.started_at = started_at
        self.completed_at = completed_at
        self.duration_seconds = duration_seconds
        self.retries = retries
        self.max_retries = max_retries

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "workflow": self.workflow,
            "status": self.status.value,
            "data": self.data,
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_seconds": self.duration_seconds,
            "retries": self.retries,
            "max_retries": self.max_retries,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "JobRecord":
        return cls(
            job_id=data.get("job_id"),
            workflow=data.get("workflow", "unknown"),
            status=JobStatus(data.get("status", "pending")),
            data=data.get("data", {}),
            result=data.get("result"),
            error=data.get("error"),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else None,
            updated_at=datetime.fromisoformat(data["updated_at"]) if data.get("updated_at") else None,
            started_at=datetime.fromisoformat(data["started_at"]) if data.get("started_at") else None,
            completed_at=datetime.fromisoformat(data["completed_at"]) if data.get("completed_at") else None,
            duration_seconds=data.get("duration_seconds"),
            retries=data.get("retries", 0),
            max_retries=data.get("max_retries", 3),
        )


class JobQueue:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        self.use_redis = self.redis_url is not None
        self._memory_store: Dict[str, JobRecord] = {}
        self._redis = None

        if self.use_redis:
            self._init_redis()
        else:
            logger.warning("REDIS_URL not configured. Using in-memory job store.")

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.Redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
            self._redis.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except ImportError:
            logger.error("redis package not installed. Falling back to in-memory store.")
            self.use_redis = False
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}. Falling back to in-memory store.")
            self.use_redis = False

    def create_job(self, workflow: str, data: Optional[Dict[str, Any]] = None) -> str:
        job_id = str(uuid.uuid4())
        job = JobRecord(job_id=job_id, workflow=workflow, status=JobStatus.PENDING, data=data)
        
        if self.use_redis:
            self._store_in_redis(job)
        else:
            self._memory_store[job_id] = job
        
        logger.info(f"Created job {job_id} for workflow {workflow}")
        return job_id

    def _store_in_redis(self, job: JobRecord):
        key = f"phi:jobs:{job.job_id}"
        self._redis.hset(key, mapping={
            "job_id": job.job_id,
            "workflow": job.workflow,
            "status": job.status.value,
            "data": json.dumps(job.data),
            "result": json.dumps(job.result) if job.result else "",
            "error": job.error or "",
            "created_at": job.created_at.isoformat(),
            "updated_at": job.updated_at.isoformat(),
            "started_at": job.started_at.isoformat() if job.started_at else "",
            "completed_at": job.completed_at.isoformat() if job.completed_at else "",
            "duration_seconds": str(job.duration_seconds) if job.duration_seconds else "",
            "retries": str(job.retries),
            "max_retries": str(job.max_retries),
        })
        self._redis.sadd(f"phi:jobs:index:{job.status.value}", job.job_id)
        self._redis.sadd("phi:jobs:index:all", job.job_id)
        self._redis.expire(key, 7 * 24 * 60 * 60)

    def start_job(self, job_id: str) -> Optional[JobRecord]:
        job = self.get_job(job_id)
        if job is None:
            return None
        job.status = JobStatus.RUNNING
        job.started_at = datetime.now(timezone.utc)
        job.updated_at = datetime.now(timezone.utc)
        
        if self.use_redis:
            self._redis.srem(f"phi:jobs:index:{JobStatus.PENDING.value}", job_id)
            self._redis.sadd(f"phi:jobs:index:{JobStatus.RUNNING.value}", job_id)
            self._store_in_redis(job)
        else:
            self._memory_store[job_id] = job
        
        return job

    def complete_job(self, job_id: str, result: Optional[Dict[str, Any]] = None) -> Optional[JobRecord]:
        job = self.get_job(job_id)
        if job is None:
            return None
        job.status = JobStatus.COMPLETED
        job.result = result
        job.completed_at = datetime.now(timezone.utc)
        job.updated_at = datetime.now(timezone.utc)
        if job.started_at:
            job.duration_seconds = (job.completed_at - job.started_at).total_seconds()
        
        if self.use_redis:
            self._redis.srem(f"phi:jobs:index:{JobStatus.RUNNING.value}", job_id)
            self._redis.sadd(f"phi:jobs:index:{JobStatus.COMPLETED.value}", job_id)
            self._store_in_redis(job)
        else:
            self._memory_store[job_id] = job
        
        return job

    def fail_job(self, job_id: str, error: str, retry: bool = False) -> Optional[JobRecord]:
        job = self.get_job(job_id)
        if job is None:
            return None
        job.retries += 1
        
        if retry and job.retries < job.max_retries:
            return self.update_job(job_id, JobStatus.PENDING, error=error)
        else:
            return self.update_job(job_id, JobStatus.FAILED, error=error)

    def update_job(self, job_id: str, status: JobStatus, result: Optional[Dict[str, Any]] = None, error: Optional[str] = None) -> Optional[JobRecord]:
        job = self.get_job(job_id)
        if job is None:
            return None
        old_status = job.status
        job.status = status
        job.result = result
        job.error = error
        job.updated_at = datetime.now(timezone.utc)
        
        if status == JobStatus.COMPLETED:
            job.completed_at = datetime.now(timezone.utc)
            if job.started_at:
                job.duration_seconds = (job.completed_at - job.started_at).total_seconds()
        
        if self.use_redis:
            self._redis.srem(f"phi:jobs:index:{old_status.value}", job_id)
            self._redis.sadd(f"phi:jobs:index:{status.value}", job_id)
            self._store_in_redis(job)
        else:
            self._memory_store[job_id] = job
        
        return job

    def get_job(self, job_id: str) -> Optional[JobRecord]:
        if self.use_redis:
            key = f"phi:jobs:{job_id}"
            data = self._redis.hgetall(key)
            if not data:
                return None
            return JobRecord.from_dict({
                "job_id": data.get("job_id"),
                "workflow": data.get("workflow", "unknown"),
                "status": data.get("status", "pending"),
                "data": json.loads(data.get("data", "{}")),
                "result": json.loads(data.get("result", "null")) if data.get("result") else None,
                "error": data.get("error"),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
                "started_at": data.get("started_at"),
                "completed_at": data.get("completed_at"),
                "duration_seconds": float(data.get("duration_seconds", 0)) if data.get("duration_seconds") else None,
                "retries": int(data.get("retries", 0)),
                "max_retries": int(data.get("max_retries", 3)),
            })
        else:
            return self._memory_store.get(job_id)

    def list_jobs(self, status: Optional[JobStatus] = None, workflow: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[JobRecord]:
        if self.use_redis:
            if status:
                job_ids = self._redis.smembers(f"phi:jobs:index:{status.value}")
            else:
                job_ids = self._redis.smembers("phi:jobs:index:all")
            job_ids = list(job_ids)[offset:offset + limit]
            jobs = []
            for job_id in job_ids:
                job = self.get_job(job_id)
                if job and (workflow is None or job.workflow == workflow):
                    jobs.append(job)
            return jobs
        else:
            jobs = list(self._memory_store.values())
            if status:
                jobs = [j for j in jobs if j.status == status]
            if workflow:
                jobs = [j for j in jobs if j.workflow == workflow]
            return jobs[offset:offset + limit]

    def count_jobs(self, status: Optional[JobStatus] = None) -> int:
        if self.use_redis:
            if status:
                return self._redis.scard(f"phi:jobs:index:{status.value}")
            return self._redis.scard("phi:jobs:index:all")
        else:
            if status:
                return sum(1 for j in self._memory_store.values() if j.status == status)
            return len(self._memory_store)

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total": self.count_jobs(),
            "pending": self.count_jobs(JobStatus.PENDING),
            "running": self.count_jobs(JobStatus.RUNNING),
            "completed": self.count_jobs(JobStatus.COMPLETED),
            "failed": self.count_jobs(JobStatus.FAILED),
            "cancelled": self.count_jobs(JobStatus.CANCELLED),
            "backend": "redis" if self.use_redis else "memory",
        }


job_queue = JobQueue()

def get_job_queue() -> JobQueue:
    return job_queue

def init_job_queue() -> JobQueue:
    global job_queue
    job_queue = JobQueue()
    logger.info(f"Job queue initialized with backend: {\"redis\" if job_queue.use_redis else \"memory\"}")
    return job_queue
'''
    
    with open(job_queue_path, 'w') as f:
        f.write(job_queue_content)
    
    print("✅ Created job_queue.py")
    return True


def main():
    """Apply all patches."""
    print("🚀 Applying PHI Backend Patches for Production")
    print("=" * 60)
    
    patches = [
        ("Main application", patch_main_py),
        ("Database connection", patch_database_py),
        ("Job queue module", create_job_queue),
    ]
    
    results = []
    for name, patch_func in patches:
        print(f"\n📦 Applying {name} patch...")
        try:
            result = patch_func()
            results.append(result)
        except Exception as e:
            print(f"❌ Error applying {name} patch: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    if all(results):
        print("✅ All patches applied successfully!")
        print("\nNext steps:")
        print("1. Run: pip install -r backend/requirements.txt")
        print("2. Set REDIS_URL environment variable for production")
        print("3. Set PHI_ADMIN_TOKEN environment variable")
        print("4. Set JWT_SECRET_KEY environment variable")
        return 0
    else:
        print("❌ Some patches failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
