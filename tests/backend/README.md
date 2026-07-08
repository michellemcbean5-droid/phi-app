# Backend Tests

This directory contains tests for the **Python FastAPI backend**.

## Structure

```
tests/backend/
├── README.md          # This file
├── conftest.py        # Shared pytest fixtures
├── test_health.py     # Health endpoint tests
├── test_agents.py     # Agent listing endpoint tests
├── test_workflows.py  # Async workflow endpoint tests
└── test_models.py     # Pydantic / SQLAlchemy model tests
```

## Tech Stack

- **Framework:** pytest
- **HTTP Client:** `httpx` (AsyncClient) or `TestClient` from FastAPI
- **Fixtures:** `pytest-asyncio` for async tests

## Running Tests

```bash
# From backend directory
cd backend
pytest tests/backend/ -v

# Or from project root
pytest backend/tests/ -v
```

## Writing a Backend Test

```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

## Coverage Goals

| Area | Target Coverage |
|------|-----------------|
| Endpoints | 80% |
| Pydantic Models | 90% |
| Agent Logic | 60% |

---

*See `docs/getting-started.md` for full project setup.*
