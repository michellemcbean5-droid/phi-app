"""
Test suite for PHI API endpoints.

Tests all API endpoints with proper authentication and validation.
"""

import pytest
import os
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock, AsyncMock
from contextlib import contextmanager

# Mock missing packages before imports
import sys
import types

# Mock crewai
_crew_mod = types.ModuleType("crewai")
_crew_mod.Crew = MagicMock()
_crew_mod.Task = MagicMock()
_crew_mod.Process = MagicMock()
_crew_mod.Process.sequential = "sequential"
_crew_mod.Agent = MagicMock()
sys.modules["crewai"] = _crew_mod
sys.modules["crewai.tools"] = types.ModuleType("crewai.tools")
sys.modules["crewai_tools"] = types.ModuleType("crewai_tools")

# Mock LangChain / OpenAI
for _mod in ["langchain_openai", "langchain", "openai"]:
    sys.modules[_mod] = types.ModuleType(_mod)
sys.modules["langchain_openai"].ChatOpenAI = MagicMock()

# Mock firebase_admin
_fb = types.ModuleType("firebase_admin")
_fb.initialize_app = MagicMock(return_value=MagicMock(name="firebase_app"))
_fb.App = MagicMock
_fb_creds = types.ModuleType("firebase_admin.credentials")
_fb_creds.Certificate = MagicMock(return_value=MagicMock(name="cred"))
_fb_msg = types.ModuleType("firebase_admin.messaging")
_fb_msg.Message = MagicMock()
_fb_msg.Notification = MagicMock()
_fb_msg.AndroidConfig = MagicMock()
_fb_msg.APNSConfig = MagicMock()
_fb_msg.send = MagicMock(return_value="projects/phi/messages/msg-stub")
sys.modules["firebase_admin"] = _fb
sys.modules["firebase_admin.credentials"] = _fb_creds
sys.modules["firebase_admin.messaging"] = _fb_msg

# Set up environment
os.environ["DATABASE_URL"] = "sqlite:///./test_phi.db"
os.environ["OPENAI_API_KEY"] = "sk-test-fake"
os.environ["PHI_ADMIN_TOKEN"] = "test-admin-token"
for _k in ("FIREBASE_SERVICE_ACCOUNT_B64", "FIREBASE_SERVICE_ACCOUNT_JSON",
           "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER",
           "SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"):
    os.environ.pop(_k, None)

# Import app modules
from app.database import Base, engine, SessionLocal, init_db, get_db
from fastapi.testclient import TestClient

# Fresh schema for each test run
Base.metadata.drop_all(bind=engine)
init_db()

# Import main app
import main
app = main.app

# Create test client
client = TestClient(app, raise_server_exceptions=True)


# Test fixtures
@pytest.fixture
def test_db():
    """Create a test database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_headers():
    """Get admin headers for authenticated requests."""
    return {"X-PHI-Admin-Token": "test-admin-token"}


# =============================================================================
# SYSTEM ENDPOINTS
# =============================================================================

class TestSystemEndpoints:
    """Tests for system endpoints."""
    
    def test_root_endpoint(self):
        """Test the root endpoint."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "service" in data
        assert data["service"] == "Prince Haul Intelligence API"
        assert "version" in data
        assert "total_agents" in data
        assert data["total_agents"] == 15
    
    def test_health_check(self):
        """Test the health check endpoint."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert data["status"] == "ok"
        assert "timestamp" in data
    
    def test_liveness_check(self):
        """Test the liveness check endpoint."""
        response = client.get("/health/live")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert data["status"] == "alive"
    
    def test_readiness_check(self):
        """Test the readiness check endpoint."""
        response = client.get("/health/ready")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert data["status"] == "ready"


# =============================================================================
# AGENT ENDPOINTS
# =============================================================================

class TestAgentEndpoints:
    """Tests for agent endpoints."""
    
    def test_list_agents(self):
        """Test listing all agents."""
        response = client.get("/api/v1/agents")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        # Should return 15 agents
        assert len(data) == 15
        
        # Check first agent structure
        if len(data) > 0:
            agent = data[0]
            assert "number" in agent
            assert "name" in agent
            assert "role" in agent
            assert "group" in agent
            assert "goal_preview" in agent
    
    def test_list_agents_by_group(self):
        """Test listing agents by group."""
        response = client.get("/api/v1/agents/groups")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, dict)
        # Should have multiple groups
        assert len(data) > 0


# =============================================================================
# JOB ENDPOINTS
# =============================================================================

class TestJobEndpoints:
    """Tests for job endpoints."""
    
    def test_list_jobs_empty(self):
        """Test listing jobs when none exist."""
        response = client.get("/api/v1/jobs")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
    
    def test_list_jobs_with_filter(self):
        """Test listing jobs with filters."""
        # Test with status filter
        response = client.get("/api/v1/jobs?status=completed")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        
        # Test with workflow filter
        response = client.get("/api/v1/jobs?workflow=autonomous-booking")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
    
    def test_get_nonexistent_job(self):
        """Test getting a non-existent job."""
        response = client.get("/api/v1/jobs/nonexistent-job-id")
        
        assert response.status_code == 404
        data = response.json()
        
        assert "detail" in data
        assert "not found" in data["detail"].lower()


# =============================================================================
# CUSTOMER JOURNEY ENDPOINTS
# =============================================================================

class TestCustomerJourneyEndpoints:
    """Tests for customer journey endpoints."""
    
    def test_capture_lead_without_consent(self):
        """Test capturing a lead without consent."""
        lead_data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "journey": "launch",
            "consent_marketing": False,  # No consent
            "top_challenge": "Finding loads",
        }
        
        response = client.post("/api/v1/customer-journey/leads", json=lead_data)
        
        assert response.status_code == 422
        data = response.json()
        
        assert "detail" in data
        assert "consent" in data["detail"].lower()
    
    def test_capture_lead_with_consent(self):
        """Test capturing a lead with consent."""
        lead_data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "journey": "launch",
            "consent_marketing": True,  # Has consent
            "top_challenge": "Finding loads",
            "lead_source": "website",
        }
        
        response = client.post("/api/v1/customer-journey/leads", json=lead_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert "id" in data
        assert data["full_name"] == "Test User"
        assert data["email"] == "test@example.com"
        assert "qualification_score" in data
        assert "recommended_offer" in data
    
    def test_capture_lead_invalid_email(self):
        """Test capturing a lead with invalid email."""
        lead_data = {
            "full_name": "Test User",
            "email": "invalid-email",
            "journey": "launch",
            "consent_marketing": True,
            "top_challenge": "Finding loads",
        }
        
        response = client.post("/api/v1/customer-journey/leads", json=lead_data)
        
        assert response.status_code == 422
    
    def test_list_leads_without_auth(self):
        """Test listing leads without authentication."""
        response = client.get("/api/v1/customer-journey/leads")
        
        # Should require admin token
        assert response.status_code == 401 or response.status_code == 503
    
    def test_list_leads_with_auth(self, admin_headers):
        """Test listing leads with authentication."""
        response = client.get("/api/v1/customer-journey/leads", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
    
    def test_list_lead_events(self, admin_headers):
        """Test listing lead events."""
        # First create a lead
        lead_data = {
            "full_name": "Test User",
            "email": "test-events@example.com",
            "journey": "launch",
            "consent_marketing": True,
            "top_challenge": "Finding loads",
        }
        create_response = client.post("/api/v1/customer-journey/leads", json=lead_data)
        lead_id = create_response.json()["id"]
        
        # List events for the lead
        response = client.get(
            f"/api/v1/customer-journey/leads/{lead_id}/events",
            headers=admin_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        # Should have at least the creation event
        assert len(data) >= 1


# =============================================================================
# WORKFLOW ENDPOINTS
# =============================================================================

class TestWorkflowEndpoints:
    """Tests for workflow endpoints."""
    
    def test_autonomous_booking_endpoint(self):
        """Test the autonomous booking workflow endpoint."""
        request_data = {
            "driver_id": "driver-123",
            "equipment_type": "Dry Van",
            "min_rpm": 3.00,
            "preferred_states": ["TX", "FL"],
            "avoid_states": [],
            "home_city": "Dallas",
            "home_state": "TX",
            "available_date": "2024-01-01",
            "max_deadhead_miles": 150,
            "subscription_tier": "Solo",
        }
        
        response = client.post("/api/v1/autonomous-booking", json=request_data)
        
        # Should return 202 Accepted with job_id
        assert response.status_code == 202
        data = response.json()
        
        assert "job_id" in data
        assert "workflow" in data
        assert data["workflow"] == "autonomous-booking"
        assert "poll_url" in data
    
    def test_autonomous_booking_sync_endpoint(self):
        """Test the synchronous autonomous booking endpoint."""
        request_data = {
            "driver_id": "driver-123",
            "equipment_type": "Dry Van",
            "min_rpm": 3.00,
            "preferred_states": ["TX"],
            "avoid_states": [],
            "home_city": "Dallas",
            "home_state": "TX",
            "available_date": "2024-01-01",
            "max_deadhead_miles": 150,
            "subscription_tier": "Solo",
        }
        
        response = client.post("/api/v1/autonomous-booking/sync", json=request_data)
        
        # Should return 200 OK with result
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "workflow" in data
    
    def test_active_transit_endpoint(self):
        """Test the active transit workflow endpoint."""
        request_data = {
            "load": {
                "id": "load-123",
                "origin_city": "Dallas",
                "origin_state": "TX",
                "destination_city": "Houston",
                "destination_state": "TX",
                "rate": 2000.00,
                "miles": 250,
                "pickup_date": "2024-01-01",
                "delivery_date": "2024-01-02",
                "broker_name": "Test Broker",
                "broker_contact": "555-1234",
                "equipment_type": "Dry Van",
                "special_requirements": "",
            },
            "driver": {
                "driver_id": "driver-123",
                "current_city": "Dallas",
                "current_state": "TX",
                "current_lat": 32.7767,
                "current_lng": -96.7970,
                "hos_remaining_drive": 11.0,
                "hos_remaining_duty": 14.0,
                "odometer": 50000,
            },
        }
        
        response = client.post("/api/v1/active-transit", json=request_data)
        
        assert response.status_code == 202
        data = response.json()
        
        assert "job_id" in data
        assert "workflow" in data
        assert data["workflow"] == "active-transit"
    
    def test_post_delivery_endpoint(self):
        """Test the post-delivery workflow endpoint."""
        request_data = {
            "load_id": "load-123",
            "driver_id": "driver-123",
            "bol_text": "BOL text here",
            "agreed_rate": 2000.00,
            "miles": 250,
            "fuel_cost": 300.00,
            "toll_cost": 50.00,
            "origin": "Dallas, TX",
            "destination": "Houston, TX",
            "delivery_date": "2024-01-02",
            "broker_name": "Test Broker",
            "factoring_company": "OTR Capital",
            "factoring_email": "invoices@otrcapital.com",
            "days_on_road": 1,
            "states_driven": ["TX"],
        }
        
        response = client.post("/api/v1/post-delivery", json=request_data)
        
        assert response.status_code == 202
        data = response.json()
        
        assert "job_id" in data
        assert "workflow" in data
        assert data["workflow"] == "post-delivery"


# =============================================================================
# ERROR HANDLING
# =============================================================================

class TestErrorHandling:
    """Tests for error handling."""
    
    def test_404_not_found(self):
        """Test 404 for non-existent endpoint."""
        response = client.get("/api/v1/nonexistent")
        
        assert response.status_code == 404
    
    def test_validation_error(self):
        """Test validation error for invalid input."""
        # Missing required field
        request_data = {
            # Missing driver_id
            "equipment_type": "Dry Van",
        }
        
        response = client.post("/api/v1/autonomous-booking", json=request_data)
        
        assert response.status_code == 422
        data = response.json()
        
        assert "error" in data
        assert "detail" in data
    
    def test_invalid_admin_token(self):
        """Test with invalid admin token."""
        headers = {"X-PHI-Admin-Token": "invalid-token"}
        response = client.get("/api/v1/customer-journey/leads", headers=headers)
        
        assert response.status_code == 401
    
    def test_missing_admin_token(self):
        """Test with missing admin token."""
        response = client.get("/api/v1/customer-journey/leads")
        
        # Should fail without token
        assert response.status_code == 401 or response.status_code == 503


# =============================================================================
# EDGE CASES
# =============================================================================

class TestEdgeCases:
    """Tests for edge cases."""
    
    def test_empty_request_body(self):
        """Test with empty request body."""
        response = client.post("/api/v1/autonomous-booking", json={})
        
        assert response.status_code == 422
    
    def test_invalid_json(self):
        """Test with invalid JSON."""
        response = client.post(
            "/api/v1/autonomous-booking",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422 or response.status_code == 400
    
    def test_duplicate_lead(self):
        """Test creating duplicate lead with same email."""
        lead_data = {
            "full_name": "Test User",
            "email": "duplicate@example.com",
            "journey": "launch",
            "consent_marketing": True,
            "top_challenge": "Finding loads",
        }
        
        # First creation
        response1 = client.post("/api/v1/customer-journey/leads", json=lead_data)
        assert response1.status_code == 201
        
        # Second creation with same email
        response2 = client.post("/api/v1/customer-journey/leads", json=lead_data)
        assert response2.status_code == 201
        
        # Should update existing lead
        data1 = response1.json()
        data2 = response2.json()
        assert data1["email"] == data2["email"]


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
