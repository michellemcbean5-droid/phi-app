"""
Test suite for the persistent job queue.

Tests the JobQueue class with both in-memory and Redis backends.
"""

import os
import pytest
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch

# Mock redis package before importing job_queue
import sys
from unittest.mock import MagicMock

# Create mock redis module
mock_redis = MagicMock()
mock_redis.Redis = MagicMock()
mock_redis_instance = MagicMock()
mock_redis.Redis.from_url.return_value = mock_redis_instance
mock_redis_instance.ping.return_value = True
mock_redis_instance.hset.return_value = True
mock_redis_instance.sadd.return_value = True
mock_redis_instance.expire.return_value = True
mock_redis_instance.hgetall.return_value = {}
mock_redis_instance.smembers.return_value = set()
mock_redis_instance.scard.return_value = 0
mock_redis_instance.srem.return_value = True

sys.modules['redis'] = mock_redis

# Now import the job queue module
from app.job_queue import JobQueue, JobStatus, JobRecord


@pytest.fixture
def in_memory_queue():
    """Create an in-memory job queue for testing."""
    # Force in-memory mode
    with patch.dict(os.environ, {'REDIS_URL': ''}, clear=False):
        queue = JobQueue(redis_url=None)
        yield queue


@pytest.fixture
def redis_queue():
    """Create a Redis-backed job queue for testing."""
    # Reset mocks
    mock_redis_instance.reset_mock()
    mock_redis_instance.ping.return_value = True
    
    with patch.dict(os.environ, {'REDIS_URL': 'redis://localhost:6379'}, clear=False):
        queue = JobQueue(redis_url='redis://localhost:6379')
        yield queue


class TestJobRecord:
    """Tests for JobRecord class."""
    
    def test_job_record_creation(self):
        """Test creating a job record."""
        job = JobRecord(
            job_id="test-123",
            workflow="autonomous-booking",
            status=JobStatus.PENDING,
            data={"driver_id": "driver-1"},
        )
        
        assert job.job_id == "test-123"
        assert job.workflow == "autonomous-booking"
        assert job.status == JobStatus.PENDING
        assert job.data == {"driver_id": "driver-1"}
        assert job.created_at is not None
        assert job.updated_at is not None
    
    def test_job_record_to_dict(self):
        """Test converting job record to dictionary."""
        job = JobRecord(
            job_id="test-123",
            workflow="test-workflow",
            status=JobStatus.RUNNING,
            data={"key": "value"},
        )
        
        result = job.to_dict()
        
        assert result["job_id"] == "test-123"
        assert result["workflow"] == "test-workflow"
        assert result["status"] == "running"
        assert result["data"] == {"key": "value"}
        assert "created_at" in result
        assert "updated_at" in result
    
    def test_job_record_from_dict(self):
        """Test creating job record from dictionary."""
        data = {
            "job_id": "test-456",
            "workflow": "test-workflow",
            "status": "completed",
            "data": '{"key": "value"}',
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        job = JobRecord.from_dict(data)
        
        assert job.job_id == "test-456"
        assert job.workflow == "test-workflow"
        assert job.status == JobStatus.COMPLETED


class TestInMemoryJobQueue:
    """Tests for in-memory job queue."""
    
    def test_create_job(self, in_memory_queue):
        """Test creating a job in memory queue."""
        job_id = in_memory_queue.create_job("test-workflow", {"test": "data"})
        
        assert job_id is not None
        assert len(job_id) == 36  # UUID format
        
        job = in_memory_queue.get_job(job_id)
        assert job is not None
        assert job.workflow == "test-workflow"
        assert job.status == JobStatus.PENDING
        assert job.data == {"test": "data"}
    
    def test_start_job(self, in_memory_queue):
        """Test starting a job."""
        job_id = in_memory_queue.create_job("test-workflow")
        
        job = in_memory_queue.start_job(job_id)
        
        assert job is not None
        assert job.status == JobStatus.RUNNING
        assert job.started_at is not None
    
    def test_complete_job(self, in_memory_queue):
        """Test completing a job."""
        job_id = in_memory_queue.create_job("test-workflow")
        in_memory_queue.start_job(job_id)
        
        result = {"output": "success"}
        job = in_memory_queue.complete_job(job_id, result)
        
        assert job is not None
        assert job.status == JobStatus.COMPLETED
        assert job.result == result
        assert job.completed_at is not None
        assert job.duration_seconds is not None
        assert job.duration_seconds >= 0
    
    def test_fail_job(self, in_memory_queue):
        """Test failing a job."""
        job_id = in_memory_queue.create_job("test-workflow")
        
        error = "Test error"
        job = in_memory_queue.fail_job(job_id, error)
        
        assert job is not None
        assert job.status == JobStatus.FAILED
        assert job.error == error
    
    def test_list_jobs(self, in_memory_queue):
        """Test listing jobs."""
        # Create multiple jobs
        job_ids = [
            in_memory_queue.create_job("workflow-1"),
            in_memory_queue.create_job("workflow-2"),
            in_memory_queue.create_job("workflow-1"),
        ]
        
        # List all jobs
        jobs = in_memory_queue.list_jobs()
        assert len(jobs) == 3
        
        # Filter by workflow
        jobs = in_memory_queue.list_jobs(workflow="workflow-1")
        assert len(jobs) == 2
        
        # Filter by status
        in_memory_queue.start_job(job_ids[0])
        jobs = in_memory_queue.list_jobs(status=JobStatus.RUNNING)
        assert len(jobs) == 1
    
    def test_count_jobs(self, in_memory_queue):
        """Test counting jobs."""
        in_memory_queue.create_job("workflow-1")
        in_memory_queue.create_job("workflow-2")
        
        assert in_memory_queue.count_jobs() == 2
        assert in_memory_queue.count_jobs(JobStatus.PENDING) == 2
        assert in_memory_queue.count_jobs(JobStatus.RUNNING) == 0
    
    def test_get_stats(self, in_memory_queue):
        """Test getting queue statistics."""
        in_memory_queue.create_job("workflow-1")
        job_id_2 = in_memory_queue.create_job("workflow-2")
        in_memory_queue.start_job(job_id_2)
        in_memory_queue.complete_job(job_id_2, {})
        
        stats = in_memory_queue.get_stats()
        
        assert stats["total"] == 2
        assert stats["pending"] == 1
        assert stats["running"] == 0
        assert stats["completed"] == 1
        assert stats["failed"] == 0
        assert stats["cancelled"] == 0
        assert stats["backend"] == "memory"
    
    def test_get_nonexistent_job(self, in_memory_queue):
        """Test getting a non-existent job."""
        job = in_memory_queue.get_job("nonexistent")
        assert job is None
    
    def test_update_nonexistent_job(self, in_memory_queue):
        """Test updating a non-existent job."""
        job = in_memory_queue.update_job("nonexistent", JobStatus.RUNNING)
        assert job is None


class TestRedisJobQueue:
    """Tests for Redis-backed job queue."""
    
    def test_create_job_redis(self, redis_queue):
        """Test creating a job in Redis queue."""
        job_id = redis_queue.create_job("test-workflow", {"test": "data"})
        
        assert job_id is not None
        
        # Check that Redis methods were called
        assert mock_redis_instance.hset.called
        assert mock_redis_instance.sadd.called
        assert mock_redis_instance.expire.called
    
    def test_redis_fallback_to_memory(self):
        """Test that Redis falls back to in-memory when connection fails."""
        # Make Redis connection fail
        mock_redis_instance.ping.side_effect = Exception("Connection failed")
        
        with patch.dict(os.environ, {'REDIS_URL': 'redis://localhost:6379'}, clear=False):
            queue = JobQueue(redis_url='redis://localhost:6379')
            
            # Should fall back to in-memory
            assert queue.use_redis == False
            
            # Should still work
            job_id = queue.create_job("test-workflow")
            assert job_id is not None
            
            job = queue.get_job(job_id)
            assert job is not None


class TestJobStatusTransitions:
    """Tests for job status transitions."""
    
    def test_pending_to_running(self, in_memory_queue):
        """Test transition from PENDING to RUNNING."""
        job_id = in_memory_queue.create_job("test")
        assert in_memory_queue.get_job(job_id).status == JobStatus.PENDING
        
        in_memory_queue.start_job(job_id)
        assert in_memory_queue.get_job(job_id).status == JobStatus.RUNNING
    
    def test_running_to_completed(self, in_memory_queue):
        """Test transition from RUNNING to COMPLETED."""
        job_id = in_memory_queue.create_job("test")
        in_memory_queue.start_job(job_id)
        in_memory_queue.complete_job(job_id, {})
        assert in_memory_queue.get_job(job_id).status == JobStatus.COMPLETED
    
    def test_running_to_failed(self, in_memory_queue):
        """Test transition from RUNNING to FAILED."""
        job_id = in_memory_queue.create_job("test")
        in_memory_queue.start_job(job_id)
        in_memory_queue.fail_job(job_id, "Error")
        assert in_memory_queue.get_job(job_id).status == JobStatus.FAILED
    
    def test_pending_to_failed(self, in_memory_queue):
        """Test transition from PENDING to FAILED."""
        job_id = in_memory_queue.create_job("test")
        in_memory_queue.fail_job(job_id, "Error")
        assert in_memory_queue.get_job(job_id).status == JobStatus.FAILED
    
    def test_failed_with_retry(self, in_memory_queue):
        """Test retrying a failed job."""
        job_id = in_memory_queue.create_job("test", max_retries=3)
        
        # Fail the job
        in_memory_queue.fail_job(job_id, "Error", retry=True)
        job = in_memory_queue.get_job(job_id)
        
        assert job.status == JobStatus.PENDING
        assert job.retries == 1
        
        # Fail again
        in_memory_queue.fail_job(job_id, "Error", retry=True)
        job = in_memory_queue.get_job(job_id)
        
        assert job.status == JobStatus.PENDING
        assert job.retries == 2
        
        # Fail one more time (should exhaust retries)
        in_memory_queue.fail_job(job_id, "Error", retry=True)
        job = in_memory_queue.get_job(job_id)
        
        assert job.status == JobStatus.PENDING
        assert job.retries == 3
        
        # Next failure should not retry
        in_memory_queue.fail_job(job_id, "Error", retry=True)
        job = in_memory_queue.get_job(job_id)
        
        assert job.status == JobStatus.FAILED
        assert job.retries == 4  # Retries exceeded max_retries


class TestJobQueuePersistence:
    """Tests for job persistence."""
    
    def test_job_data_persisted(self, in_memory_queue):
        """Test that job data is persisted."""
        data = {"driver_id": "driver-1", "load_id": "load-1"}
        job_id = in_memory_queue.create_job("test", data)
        
        # Get the job back
        job = in_memory_queue.get_job(job_id)
        
        assert job.data == data
    
    def test_job_result_persisted(self, in_memory_queue):
        """Test that job result is persisted."""
        job_id = in_memory_queue.create_job("test")
        result = {"output": "success", "details": {"load_id": "123"}}
        in_memory_queue.complete_job(job_id, result)
        
        job = in_memory_queue.get_job(job_id)
        
        assert job.result == result
    
    def test_job_error_persisted(self, in_memory_queue):
        """Test that job error is persisted."""
        job_id = in_memory_queue.create_job("test")
        error = "Test error message"
        in_memory_queue.fail_job(job_id, error)
        
        job = in_memory_queue.get_job(job_id)
        
        assert job.error == error


class TestJobQueueCleanup:
    """Tests for job cleanup."""
    
    def test_cleanup_expired_jobs(self, in_memory_queue):
        """Test cleaning up expired jobs."""
        # Create old jobs
        for i in range(5):
            in_memory_queue.create_job(f"old-workflow-{i}")
        
        # Cleanup jobs older than 7 days
        removed = in_memory_queue.cleanup_expired(max_age_days=7)
        
        # In-memory cleanup should remove all jobs
        assert removed == 5
        assert in_memory_queue.count_jobs() == 0


class TestGlobalJobQueue:
    """Tests for global job queue instance."""
    
    def test_init_job_queue(self):
        """Test initializing global job queue."""
        from app.job_queue import init_job_queue, get_job_queue
        
        queue = init_job_queue()
        
        assert queue is not None
        
        # Get the global instance
        global_queue = get_job_queue()
        assert global_queue is queue
    
    def test_job_queue_singleton(self):
        """Test that job queue is a singleton."""
        from app.job_queue import init_job_queue, get_job_queue
        
        queue1 = init_job_queue()
        queue2 = get_job_queue()
        
        assert queue1 is queue2


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
