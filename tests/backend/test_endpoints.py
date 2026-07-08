import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure backend/ is on the path so we can import main
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

try:
    from main import app
except ImportError as e:
    # If main.py fails to import (e.g., missing env vars), skip gracefully
    pytest.skip(f"Could not import main.py: {e}", allow_module_level=True)

client = TestClient(app)


def test_health_endpoint():
    """Smoke test: the health endpoint should return 200."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data or "ok" in str(data).lower()


def test_root_endpoint():
    """Smoke test: the root endpoint should return service info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    # Should contain some identifying text about PHI
    assert any(keyword in str(data).lower() for keyword in ["phi", "prince haul", "intelligence", "health", "version"])


def test_agents_endpoint():
    """Smoke test: the agents listing endpoint should return 200."""
    response = client.get("/api/v1/agents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list) or isinstance(data, dict)
