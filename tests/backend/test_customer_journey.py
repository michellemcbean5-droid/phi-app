import os
import sys
import uuid

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

try:
    from app.database import init_db
    from main import app
except ImportError as exc:
    pytest.skip(f"Could not import customer journey API: {exc}", allow_module_level=True)


client = TestClient(app)
ADMIN_TOKEN = "phi-customer-journey-test-token"


def make_lead_payload() -> dict:
    unique = uuid.uuid4().hex
    return {
        "full_name": "Taylor Owner Operator",
        "email": f"taylor.{unique}@example.com",
        "phone": "+1 555 010 1234",
        "company_name": "Taylor Transport LLC",
        "journey": "dispatch",
        "equipment_type": "Dry Van",
        "truck_count": 1,
        "home_state": "tx",
        "top_challenge": "I need a clearer load, document, and profit workflow.",
        "preferred_contact": "email",
        "consent_marketing": True,
        "lead_source": "website",
        "source_detail": "customer-journey-test",
    }


def test_customer_lead_lifecycle_requires_consent_and_admin_controls(monkeypatch):
    """A lead is captured publicly, while commercial and onboarding updates are protected."""
    init_db()
    monkeypatch.setenv("PHI_ADMIN_TOKEN", ADMIN_TOKEN)

    no_consent = make_lead_payload()
    no_consent["consent_marketing"] = False
    rejected = client.post("/api/v1/customer-journey/leads", json=no_consent)
    assert rejected.status_code == 422

    created = client.post("/api/v1/customer-journey/leads", json=make_lead_payload())
    assert created.status_code == 201
    lead = created.json()
    assert lead["stage"] == "qualified"
    assert lead["recommended_offer"] == "Dispatch & Profit Diagnostic"
    lead_id = lead["id"]

    unauthenticated = client.patch(
        f"/api/v1/customer-journey/leads/{lead_id}/stage",
        json={"stage": "opportunity", "reason": "Requested a plan review."},
    )
    assert unauthenticated.status_code == 401

    updated = client.patch(
        f"/api/v1/customer-journey/leads/{lead_id}/stage",
        headers={"X-PHI-Admin-Token": ADMIN_TOKEN},
        json={
            "stage": "opportunity",
            "reason": "Requested a plan review.",
            "owner": "PHI Sales Pod",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["stage"] == "opportunity"

    blocked = client.patch(
        f"/api/v1/customer-journey/leads/{lead_id}/onboarding",
        headers={"X-PHI-Admin-Token": ADMIN_TOKEN},
        json={"status": "in_progress", "reason": "Trying to begin early."},
    )
    assert blocked.status_code == 409

    won = client.patch(
        f"/api/v1/customer-journey/leads/{lead_id}/stage",
        headers={"X-PHI-Admin-Token": ADMIN_TOKEN},
        json={"stage": "won", "reason": "Commercial acceptance verified by staff."},
    )
    assert won.status_code == 200

    onboarding = client.patch(
        f"/api/v1/customer-journey/leads/{lead_id}/onboarding",
        headers={"X-PHI-Admin-Token": ADMIN_TOKEN},
        json={"status": "in_progress", "reason": "Begin account and policy setup."},
    )
    assert onboarding.status_code == 200
    assert onboarding.json()["onboarding_status"] == "in_progress"

    events = client.get(
        f"/api/v1/customer-journey/leads/{lead_id}/events",
        headers={"X-PHI-Admin-Token": ADMIN_TOKEN},
    )
    assert events.status_code == 200
    event_types = {event["event_type"] for event in events.json()}
    assert "lead.created" in event_types
    assert "lead.stage_changed" in event_types
    assert "onboarding.in_progress" in event_types
