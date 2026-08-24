"""
job_queue.py - Persistent job queue using Redis/Celery for production.

This module provides a drop-in replacement for the in-memory _job_store
with proper persistence, scalability, and production-ready features.

Usage:
    from app.job_queue import JobQueue, JobStatus
    
    # Initialize (called from main.py startup)
    job_queue = JobQueue()
    
    # Create a job
    job_id = job_queue.create_job("autonomous-booking", {"driver_id": "123"})
    
    # Update job status
    job_queue.update_job(job_id, JobStatus.RUNNING, result="processing")
    
    # Complete job
    job_queue.complete_job(job_id, result={"load_id": "456"})
    
    # Fail job
    job_queue.fail_job(job_id, error="Something went wrong")
    
    # Get job
    job = job_queue.get_job(job_id)
    
    # List jobs
    jobs = job_queue.list_jobs(status=JobStatus.COMPLETED, limit=10)
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
    """Job status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobRecord:
    """Represents a job record in the queue."""
    
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
        """Convert job record to dictionary for API responses."""
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
        """Create job record from dictionary (from Redis)."""
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
    """
    Persistent job queue implementation.
    
    Uses Redis in production for persistence and scalability.
    Falls back to in-memory storage for development when Redis is not available.
    """
    
    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize the job queue.
        
        Args:
            redis_url: Redis connection URL. If None, uses REDIS_URL env var or falls back to in-memory.
        """
        self.redis_url = redis_url or os.getenv("REDIS_URL", os.getenv("REDIS_URL"))
        self.use_redis = self.redis_url is not None
        
        # In-memory fallback for development
        self._memory_store: Dict[str, JobRecord] = {}
        
        # Redis connection (lazy initialized)
        self._redis = None
        
        if self.use_redis:
            self._init_redis()
        else:
            logger.warning(
                "REDIS_URL not configured. Using in-memory job store. "
                "This is NOT suitable for production!"
            )
    
    def _init_redis(self):
        """Initialize Redis connection."""
        try:
            import redis
            self._redis = redis.Redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
            # Test connection
            self._redis.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except ImportError:
            logger.error("redis package not installed. Falling back to in-memory store.")
            self.use_redis = False
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}. Falling back to in-memory store.")
            self.use_redis = False
    
    def _get_redis_key(self, job_id: str) -> str:
        """Get Redis key for a job."""
        return f"phi:jobs:{job_id}"
    
    def _get_redis_index_key(self, status: Optional[JobStatus] = None) -> str:
        """Get Redis key for job index."""
        if status:
            return f"phi:jobs:index:{status.value}"
        return "phi:jobs:index:all"
    
    def create_job(
        self,
        workflow: str,
        data: Optional[Dict[str, Any]] = None,
        max_retries: int = 3,
    ) -> str:
        """
        Create a new job and return its ID.
        
        Args:
            workflow: Name of the workflow (e.g., "autonomous-booking")
            data: Initial job data
            max_retries: Maximum number of retry attempts
            
        Returns:
            job_id: Unique job identifier
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        job = JobRecord(
            job_id=job_id,
            workflow=workflow,
            status=JobStatus.PENDING,
            data=data or {},
            created_at=now,
            updated_at=now,
            max_retries=max_retries,
        )
        
        if self.use_redis:
            self._store_in_redis(job)
        else:
            self._memory_store[job_id] = job
        
        logger.info(f"Created job {job_id} for workflow {workflow}")
        return job_id
    
    def _store_in_redis(self, job: JobRecord):
        """Store job in Redis."""
        key = self._get_redis_key(job.job_id)
        data = job.to_dict()
        
        # Store job data with expiration (7 days)
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
        
        # Add to index
        self._redis.sadd(self._get_redis_index_key(job.status), job.job_id)
        self._redis.sadd(self._get_redis_index_key(), job.job_id)
        
        # Set expiration (7 days)
        self._redis.expire(key, 7 * 24 * 60 * 60)
    
    def start_job(self, job_id: str) -> Optional[JobRecord]:
        """
        Mark a job as started/running.
        
        Args:
            job_id: Job identifier
            
        Returns:
            Updated job record or None if not found
        """
        job = self.get_job(job_id)
        if job is None:
            logger.warning(f"Job {job_id} not found for starting")
            return None
        
        job.status = JobStatus.RUNNING
        job.started_at = datetime.now(timezone.utc)
        job.updated_at = datetime.now(timezone.utc)
        
        if self.use_redis:
            # Remove from old index
            self._redis.srem(self._get_redis_index_key(JobStatus.PENDING), job_id)
            # Add to new index
            self._redis.sadd(self._get_redis_index_key(JobStatus.RUNNING), job_id)
            self._store_in_redis(job)
        else:
            self._memory_store[job_id] = job
        
        logger.info(f"Started job {job_id}")
        return job
    
    def update_job(
        self,
        job_id: str,
        status: JobStatus,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> Optional[JobRecord]:
        """
        Update a job's status.
        
        Args:
            job_id: Job identifier
            status: New status
            result: Job result data (for completed jobs)
            error: Error message (for failed jobs)
            
        Returns:
            Updated job record or None if not found
        """
        job = self.get_job(job_id)
        if job is None:
            logger.warning(f"Job {job_id} not found for update")
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
            # Remove from old index
            self._redis.srem(self._get_redis_index_key(old_status), job_id)
            # Add to new index
            self._redis.sadd(self._get_redis_index_key(status), job_id)
            self._store_in_redis(job)
        else:
            self._memory_store[job_id] = job
        
        logger.info(f"Updated job {job_id}")
        return job
    
    def delete_job(self, job_id: str) -> bool:
        """
        Delete a job from the queue.
        """
        if self.use_redis:
            if self._redis.exists(self._get_redis_key(job_id)):
                self._redis.delete(self._get_redis_key(job_id))
                # Remove from index
                job_data = self.get_job(job_id)
                if job_data:
                    status = job_data.get("status", "unknown")
                    self._redis.srem(self._get_redis_index_key(status), job_id)
                logger.info(f"Deleted job {job_id}")
                return True
            return False
        else:
            if job_id in self._memory_store:
                del self._memory_store[job_id]
                logger.info(f"Deleted job {job_id}")
                return True
            return False

    def complete_job(
        self,
        job_id: str,
        result: Optional[Dict[str, Any]] = None,
    ) -> Optional[JobRecord]:
        """
        Mark a job as successfully completed.
        
        Args:
            job_id: Job identifier
            result: Job result data
            
        Returns:
            Updated job record or None if not found
        """
        return self.update_job(job_id, JobStatus.COMPLETED, result=result)
    
    def fail_job(
        self,
        job_id: str,
        error: str,
        retry: bool = False,
    ) -> Optional[JobRecord]:
        """
        Mark a job as failed.
        
        Args:
            job_id: Job identifier
            error: Error message
            retry: Whether to retry the job
            
        Returns:
            Updated job record or None if not found
        """
        job = self.get_job(job_id)
        if job is None:
            return None
        
        job.retries += 1
        
        if retry and job.retries < job.max_retries:
            # Reset to pending for retry
            return self.update_job(job_id, JobStatus.PENDING, error=error)
        else:
            return self.update_job(job_id, JobStatus.FAILED, error=error)
    
    def cancel_job(self, job_id: str, reason: str = "Cancelled by user") -> Optional[JobRecord]:
        """
        Cancel a job.
        
        Args:
            job_id: Job identifier
            reason: Reason for cancellation
            
        Returns:
            Updated job record or None if not found
        """
        return self.update_job(job_id, JobStatus.CANCELLED, error=reason)
    
    def get_job(self, job_id: str) -> Optional[JobRecord]:
        """
        Get a job by ID.
        
        Args:
            job_id: Job identifier
            
        Returns:
            Job record or None if not found
        """
        if self.use_redis:
            key = self._get_redis_key(job_id)
            data = self._redis.hgetall(key)
            if not data:
                return None
            
            # Convert Redis data to JobRecord
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
    
    def list_jobs(
        self,
        status: Optional[JobStatus] = None,
        workflow: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[JobRecord]:
        """
        List jobs with optional filtering.
        
        Args:
            status: Filter by job status
            workflow: Filter by workflow name
            limit: Maximum number of jobs to return
            offset: Number of jobs to skip
            
        Returns:
            List of job records matching the filters
        """
        if self.use_redis:
            # Get job IDs from index
            if status:
                job_ids = self._redis.smembers(self._get_redis_index_key(status.value))
            else:
                # Get all job IDs (union of all status indices)
                all_statuses = [s.value for s in JobStatus]
                job_ids = set()
                for s in all_statuses:
                    job_ids.update(self._redis.smembers(self._get_redis_index_key(s)))
            
            # Get job data for the IDs
            jobs = []
            for job_id in list(job_ids)[offset:offset + limit]:
                job_data = self._get_from_redis(job_id)
                if job_data:
                    jobs.append(JobRecord.from_dict(job_data))
            return jobs
        else:
            jobs = list(self._memory_store.values())
            
            # Apply filters
            if status:
                jobs = [j for j in jobs if j.status == status]
            if workflow:
                jobs = [j for j in jobs if j.workflow == workflow]
            
            return jobs[offset:offset + limit]

    def count_active_jobs(self) -> int:
        """
        Count the number of active (running) jobs.
        """
        if self.use_redis:
            return len(self._redis.smembers(self._get_redis_index_key(JobStatus.RUNNING)))
        else:
            return sum(1 for job in self._memory_store.values() if job.status == JobStatus.RUNNING)
        if self.use_redis:
            # Get job IDs from index
            if status:
                job_ids = self._redis.smembers(self._get_redis_index_key(status))
            else:
                job_ids = self._redis.smembers(self._get_redis_index_key())
            
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
        """
        Count jobs by status.
        
        Args:
            status: Filter by status (None for all)
            
        Returns:
            Number of jobs
        """
        if self.use_redis:
            if status:
                return self._redis.scard(self._get_redis_index_key(status))
            return self._redis.scard(self._get_redis_index_key())
        else:
            if status:
                return sum(1 for j in self._memory_store.values() if j.status == status)
            return len(self._memory_store)
    
    def cleanup_expired(self, max_age_days: int = 7) -> int:
        """
        Clean up expired jobs.
        
        Args:
            max_age_days: Maximum age in days for jobs to keep
            
        Returns:
            Number of jobs cleaned up
        """
        if not self.use_redis:
            # In-memory cleanup
            cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
            old_jobs = [
                job_id for job_id, job in self._memory_store.items()
                if job.created_at and job.created_at < cutoff
            ]
            for job_id in old_jobs:
                del self._memory_store[job_id]
            return len(old_jobs)
        
        # Redis cleanup is handled by TTL, but we can also clean up indexes
        return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get job queue statistics.
        
        Returns:
            Dictionary with queue statistics
        """
        return {
            "total": self.count_jobs(),
            "pending": self.count_jobs(JobStatus.PENDING),
            "running": self.count_jobs(JobStatus.RUNNING),
            "completed": self.count_jobs(JobStatus.COMPLETED),
            "failed": self.count_jobs(JobStatus.FAILED),
            "cancelled": self.count_jobs(JobStatus.CANCELLED),
            "backend": "redis" if self.use_redis else "memory",
        }


# Global job queue instance
job_queue: Optional[JobQueue] = None

# Backward compatibility: expose _memory_store for legacy code
_memory_store: Dict[str, JobRecord] = {}


def get_job_queue() -> JobQueue:
    """Get the global job queue instance."""
    return job_queue


def init_job_queue() -> JobQueue:
    """
    Initialize and return the job queue.
    
    Call this during application startup.
    """
    global job_queue
    job_queue = JobQueue()
    logger.info(f"Job queue initialized with backend: {'redis' if job_queue.use_redis else 'memory'}")
    return job_queue
