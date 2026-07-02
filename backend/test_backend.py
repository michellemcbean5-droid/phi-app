"""
End-to-end test suite for the PHI backend.
Runs against SQLite (no Postgres needed) with crewai and comms packages mocked.
"""
import sys
import types
import os
import unittest
from unittest.mock import MagicMock, patch

# ─── Stub missing packages BEFORE any app modules are imported ────────────────

# crewai
_crew_mod = types.ModuleType("crewai")
_crew_mod.Crew = MagicMock()
_crew_mod.Task = MagicMock()
_crew_mod.Process = MagicMock()
_crew_mod.Process.sequential = "sequential"
_crew_mod.Agent = MagicMock()
sys.modules["crewai"] = _crew_mod
sys.modules["crewai.tools"] = types.ModuleType("crewai.tools")
sys.modules["crewai_tools"] = types.ModuleType("crewai_tools")

# LangChain / OpenAI
for _mod in ["langchain_openai", "langchain", "openai"]:
    sys.modules[_mod] = types.ModuleType(_mod)
sys.modules["langchain_openai"].ChatOpenAI = MagicMock()

# firebase_admin — stub the whole package so push.py can import it cleanly
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

# ─── Environment ──────────────────────────────────────────────────────────────
os.environ["DATABASE_URL"] = "sqlite:///./test_phi.db"
os.environ["OPENAI_API_KEY"] = "sk-test-fake"
# Ensure no real Firebase / Twilio / SendGrid creds leak in from .env
for _k in ("FIREBASE_SERVICE_ACCOUNT_B64", "FIREBASE_SERVICE_ACCOUNT_JSON",
           "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER",
           "SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"):
    os.environ.pop(_k, None)

# ─── App imports (after all stubs are in place) ────────────────────────────────
from app.database import (
    Base, engine, SessionLocal, User, AIActionLog, FinancialVault,
    init_db, log_agent_action, clear_invoice, get_fcm_token, set_fcm_token,
)

# Fresh schema for each test run
Base.metadata.drop_all(bind=engine)
init_db()

from fastapi.testclient import TestClient

with patch.dict(sys.modules, {
    "agents": MagicMock(ALL_AGENTS=[], AGENT_GROUPS={}),
    "tasks": MagicMock(),
}):
    import main
    app = main.app

client = TestClient(app, raise_server_exceptions=True)


def _make_user(db, suffix: str) -> User:
    """Create and commit a unique test user; return it."""
    u = User(
        id=f"driver-{suffix}",
        email=f"{suffix}@test.phi",
        full_name=f"Driver {suffix}",
    )
    db.add(u)
    db.commit()
    return u


# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE LAYER
# ═══════════════════════════════════════════════════════════════════════════════
class TestDatabase(unittest.TestCase):

    def setUp(self):
        self.db = SessionLocal()
        self.uid = f"db-{id(self)}"
        _make_user(self.db, self.uid)

    def tearDown(self):
        self.db.close()

    def test_user_defaults(self):
        u = self.db.query(User).filter_by(id=f"driver-{self.uid}").first()
        self.assertIsNotNone(u)
        self.assertEqual(u.subscription_tier, "Solo")
        self.assertEqual(u.role, "driver")
        self.assertIsNone(u.fcm_device_token)

    def test_fcm_token_roundtrip(self):
        ok = set_fcm_token(self.db, f"driver-{self.uid}", "token-abc123")
        self.assertTrue(ok)
        self.assertEqual(get_fcm_token(self.db, f"driver-{self.uid}"), "token-abc123")

    def test_get_fcm_token_unknown_driver(self):
        self.assertIsNone(get_fcm_token(self.db, "nonexistent-00000"))

    def test_set_fcm_token_unknown_driver(self):
        ok = set_fcm_token(self.db, "nonexistent-00000", "some-token")
        self.assertFalse(ok)

    def test_log_agent_action(self):
        entry = log_agent_action(
            self.db,
            agent_name="Automated Track & Trace Liaison",
            action_type="alert",
            summary="Pickup confirmed at Chicago, IL",
            driver_id=f"driver-{self.uid}",
        )
        self.assertIsNotNone(entry.id)
        self.assertEqual(entry.action_type, "alert")
        self.assertIn("Chicago", entry.summary)

    def test_clear_invoice(self):
        entry = clear_invoice(
            self.db,
            driver_id=f"driver-{self.uid}",
            gross_amount=3500.00,
            factoring_fee=105.00,
            factoring_company="OTR Capital",
            tax_deductions={"fuel": 280.00, "tolls": 42.00},
        )
        self.assertIsNotNone(entry.id)
        self.assertAlmostEqual(entry.net_amount, 3395.00)
        self.assertEqual(entry.factoring_status, "paid")


# ═══════════════════════════════════════════════════════════════════════════════
# COMMUNICATION SERVICES
# ═══════════════════════════════════════════════════════════════════════════════
class TestCommunicationServices(unittest.TestCase):

    def test_sms_skipped_when_unconfigured(self):
        from services.communication import sms_client
        # env vars cleared above → is_configured is False
        result = sms_client.send_sms("+15005550006", "test")
        self.assertEqual(result.status, "skipped")

    def test_tracking_update_skipped_unconfigured(self):
        from services.communication import sms_client
        result = sms_client.send_tracking_update(
            "+15005550006",
            load_id="LOAD-001",
            milestone="Pickup Confirmed",
            location="Chicago, IL",
            eta="14:00 CDT",
        )
        self.assertEqual(result.status, "skipped")

    def test_invoice_email_skipped_unconfigured(self):
        from services.communication import send_invoice_email
        result = send_invoice_email(
            to_email="invoices@otrcapital.com",
            load_id="LOAD-001",
            invoice_number="INV-2026-001",
            gross_amount=3500.00,
            net_amount=3395.00,
            factoring_company="OTR Capital",
            bol_text="SIGNED BOL TEXT",
        )
        self.assertEqual(result, "skipped")

    def test_sms_send_with_mocked_twilio(self):
        from services.communication import TwilioSMSClient
        c = TwilioSMSClient()
        c._account_sid = "ACtest"
        c._auth_token = "authtest"
        c._from_number = "+15005550001"
        mock_msg = MagicMock(sid="SMtest123", status="queued")
        c._client = MagicMock()
        c._client.messages.create.return_value = mock_msg

        result = c.send_sms("+15005550006", "Hello broker")
        self.assertEqual(result.sid, "SMtest123")
        self.assertEqual(result.status, "queued")
        c._client.messages.create.assert_called_once()

    def test_sms_eta_change(self):
        from services.communication import TwilioSMSClient
        c = TwilioSMSClient()
        c._account_sid = "AC"
        c._auth_token = "auth"
        c._from_number = "+1"
        mock_msg = MagicMock(sid="SM2", status="sent")
        c._client = MagicMock()
        c._client.messages.create.return_value = mock_msg

        result = c.send_eta_change("+15005550007", load_id="L-42",
                                   new_eta="07/02 09:00 CDT", reason="Traffic delay I-90")
        self.assertEqual(result.sid, "SM2")
        # Verify the message body mentions the load and ETA
        call_kwargs = c._client.messages.create.call_args.kwargs
        self.assertIn("L-42", call_kwargs["body"])
        self.assertIn("07/02 09:00 CDT", call_kwargs["body"])


# ═══════════════════════════════════════════════════════════════════════════════
# PUSH NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════════
class TestPushNotifications(unittest.TestCase):

    def setUp(self):
        # Ensure each test starts with a clean (unconfigured) Firebase state
        import services.push as push_mod
        push_mod._firebase_app = None

    def test_notify_skipped_when_unconfigured(self):
        """All three notify functions return 'skipped' when no Firebase creds set."""
        from services.push import notify_load_locked, notify_hos_violation, notify_emergency

        self.assertEqual(
            notify_load_locked("tok", load_id="L1", origin="CHI", destination="DAL", rpm=3.45),
            "skipped",
        )
        self.assertEqual(
            notify_hos_violation("tok", hours_remaining=0.5, violation_type="11-Hour Rule"),
            "skipped",
        )
        self.assertEqual(
            notify_emergency("tok", load_id="L1", summary="Engine warning"),
            "skipped",
        )

    def test_fcm_send_with_mocked_app(self):
        """_send() works end-to-end when the Firebase app is already initialized."""
        import services.push as push_mod

        # Inject a fake initialized app so _get_app() skips re-init
        push_mod._firebase_app = MagicMock(name="fake_firebase_app")

        # The firebase_admin.messaging stub is already in sys.modules from setUp block above
        _fb_msg.send.return_value = "projects/phi/messages/msg-real-123"

        result = push_mod._send("device-token-xyz", "Test Push", "Body text")
        self.assertEqual(result, "projects/phi/messages/msg-real-123")
        _fb_msg.send.assert_called_once()

    def test_notify_load_locked_fires_correct_data(self):
        import services.push as push_mod
        push_mod._firebase_app = MagicMock(name="app")
        _fb_msg.send.reset_mock()

        from services.push import notify_load_locked
        notify_load_locked("tok", load_id="LOAD-42", origin="Chicago, IL",
                           destination="Dallas, TX", rpm=3.45)

        called_msg = _fb_msg.Message.call_args
        self.assertIsNotNone(called_msg)

    def test_notify_emergency_uses_high_priority(self):
        import services.push as push_mod
        push_mod._firebase_app = MagicMock(name="app")
        _fb_msg.send.reset_mock()
        _fb_msg.AndroidConfig.reset_mock()

        from services.push import notify_emergency
        notify_emergency("tok", load_id="L-999", summary="Tire blowout I-40 mm142")

        _fb_msg.AndroidConfig.assert_called_once_with(priority="high")


# ═══════════════════════════════════════════════════════════════════════════════
# FASTAPI ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════
class TestAPIEndpoints(unittest.TestCase):

    def test_health(self):
        resp = client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("timestamp", data)
        self.assertIn("active_jobs", data)

    def test_root(self):
        resp = client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["service"], "Prince Haul Intelligence API")
        self.assertEqual(data["version"], "2.0.0")
        self.assertIn("total_agents", data)

    def test_list_agents(self):
        resp = client.get("/api/v1/agents")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    def test_list_jobs_empty(self):
        resp = client.get("/api/v1/jobs")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    def test_get_nonexistent_job(self):
        resp = client.get("/api/v1/jobs/nonexistent-id")
        self.assertEqual(resp.status_code, 404)

    def test_register_fcm_token_driver_not_found(self):
        resp = client.put("/api/v1/drivers/ghost-driver/fcm-token",
                          json={"token": "tok-xyz"})
        self.assertEqual(resp.status_code, 404)

    def test_register_fcm_token_success(self):
        # Create driver in DB
        db = SessionLocal()
        try:
            _make_user(db, "fcm-api-test")
        finally:
            db.close()

        resp = client.put("/api/v1/drivers/driver-fcm-api-test/fcm-token",
                          json={"token": "real-device-token"})
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body["token_registered"])
        self.assertEqual(body["driver_id"], "driver-fcm-api-test")

    def test_push_endpoints_no_token_registered(self):
        """Push endpoints return 404 when driver has no FCM token on file."""
        # Firebase IS available (stubbed), so 404 (no token) not 503
        for path, payload in [
            ("/api/v1/notifications/load-locked", {
                "driver_id": "no-token-driver", "load_id": "L1",
                "origin": "CHI", "destination": "DAL", "rpm": 3.0,
            }),
            ("/api/v1/notifications/hos-alert", {
                "driver_id": "no-token-driver",
                "hours_remaining": 0.5, "violation_type": "11-Hour",
            }),
            ("/api/v1/notifications/emergency", {
                "driver_id": "no-token-driver",
                "load_id": "L1", "summary": "Breakdown",
            }),
        ]:
            with self.subTest(path=path):
                resp = client.post(path, json=payload)
                self.assertEqual(resp.status_code, 404, f"{path} should 404 without token")

    def test_push_load_locked_sends_when_token_present(self):
        """
        Endpoint returns HTTP 200 and the expected response shape when the driver
        has a registered FCM token. FCM message_id is 'skipped' in this test env
        (no Firebase credentials) — the unit tests in TestPushNotifications verify
        the actual FCM send path with a mocked Firebase SDK.
        """
        db = SessionLocal()
        try:
            _make_user(db, "push-test-ll")
            set_fcm_token(db, "driver-push-test-ll", "device-token-push")
        finally:
            db.close()

        resp = client.post("/api/v1/notifications/load-locked", json={
            "driver_id": "driver-push-test-ll",
            "load_id": "LOAD-99",
            "origin": "Chicago, IL",
            "destination": "Dallas, TX",
            "rpm": 3.45,
        })

        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["status"], "sent")
        self.assertEqual(body["driver_id"], "driver-push-test-ll")
        self.assertIn("fcm_message_id", body)  # "skipped" without creds; real ID in production

    def test_push_emergency_sends(self):
        """Endpoint returns HTTP 200 with correct response shape for a driver with a token."""
        db = SessionLocal()
        try:
            _make_user(db, "push-test-em")
            set_fcm_token(db, "driver-push-test-em", "device-token-emergency")
        finally:
            db.close()

        resp = client.post("/api/v1/notifications/emergency", json={
            "driver_id": "driver-push-test-em",
            "load_id": "LOAD-42",
            "summary": "Engine fire on I-40 — pulling over",
        })

        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["status"], "sent")
        self.assertIn("fcm_message_id", body)

    def test_invalid_state_code_rejected(self):
        resp = client.post("/api/v1/autonomous-booking/sync", json={
            "driver_id": "d-001",
            "preferred_states": ["ZZ"],
        })
        self.assertEqual(resp.status_code, 422)

    def test_factoring_email_field_accepted(self):
        with patch("main.build_post_delivery_crew") as mock_crew:
            mock_crew.return_value.kickoff.return_value = "done"
            resp = client.post("/api/v1/post-delivery/sync", json={
                "load_id": "L-001", "driver_id": "d-001",
                "bol_text": "SIGNED BOL", "agreed_rate": 3500.0,
                "miles": 1100, "origin": "Chicago, IL",
                "destination": "Dallas, TX", "delivery_date": "2026-07-01",
                "broker_name": "XPO",
                "factoring_email": "invoices@otrcapital.com",
            })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "completed")


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT EVENTS / CALLBACKS
# ═══════════════════════════════════════════════════════════════════════════════
class TestAgentEvents(unittest.TestCase):

    def setUp(self):
        self.db = SessionLocal()
        self.uid = f"ev-{id(self)}"
        _make_user(self.db, self.uid)
        self.db.close()

    def test_callback_persists_route_action(self):
        from app.agent_events import make_task_callback
        cb = make_task_callback(f"driver-{self.uid}")
        mock_output = MagicMock()
        mock_output.agent = "Predictive Route Navigator"
        mock_output.raw = "Route: I-90 W → I-80 W → I-35 S. Total: 1,082 miles."
        mock_output.description = "Plot the truck-legal route..."
        cb(mock_output)

        db = SessionLocal()
        try:
            log = db.query(AIActionLog).filter_by(
                driver_id=f"driver-{self.uid}", action_type="route"
            ).first()
            self.assertIsNotNone(log)
            self.assertIn("Route:", log.summary)
        finally:
            db.close()

    def test_callback_persists_compliance_action(self):
        from app.agent_events import make_task_callback
        cb = make_task_callback(f"driver-{self.uid}")
        mock_output = MagicMock()
        mock_output.agent = "DOT Compliance & Safety Auditor"
        mock_output.raw = "HOS clearance passed. 7.5 hours drive time remaining."
        mock_output.description = "Verify HOS..."
        cb(mock_output)

        db = SessionLocal()
        try:
            log = db.query(AIActionLog).filter_by(
                driver_id=f"driver-{self.uid}", action_type="compliance"
            ).first()
            self.assertIsNotNone(log)
        finally:
            db.close()

    def test_post_delivery_callback_clears_invoice(self):
        from app.agent_events import make_post_delivery_callback
        delivery = {
            "agreed_rate": 3500.0,
            "factoring_company": "OTR Capital",
            "factoring_email": "",
            "fuel_cost": 280.0,
            "toll_cost": 42.0,
            "load_id": None,
            "bol_text": "BOL text",
        }
        cb = make_post_delivery_callback(f"driver-{self.uid}", None, delivery)
        mock_output = MagicMock()
        mock_output.agent = "Automated Invoicing & Factoring Clerk"
        mock_output.raw = "Invoice #INV-2026-001 submitted. Net: $3,395.00"
        mock_output.description = "Generate invoice..."
        cb(mock_output)

        db = SessionLocal()
        try:
            vault = db.query(FinancialVault).filter_by(
                driver_id=f"driver-{self.uid}"
            ).first()
            self.assertIsNotNone(vault)
            self.assertAlmostEqual(vault.gross_amount, 3500.0)
            self.assertAlmostEqual(vault.net_amount, 3395.0)
            self.assertEqual(vault.factoring_status, "paid")
        finally:
            db.close()

    def test_track_trace_callback_sms_phone(self):
        """SMS fires when broker_contact looks like a phone number."""
        mock_twilio_result = MagicMock(sid="SM-track", status="queued")
        mock_send = MagicMock(return_value=mock_twilio_result)

        # agent_events.py uses `from services.communication import sms_client`
        # so we must patch the name IN agent_events's namespace, not in communication's.
        import app.agent_events as ae_mod
        from services.communication import SMSResult
        mock_send_sms = MagicMock(return_value=SMSResult(sid="SM-track", to="+15005550006", status="queued"))

        with patch.object(ae_mod.sms_client, "send_tracking_update", mock_send_sms):
            from app.agent_events import make_task_callback
            load_info = {"id": "L-55", "broker_contact": "+15005550006",
                         "origin": "Chicago, IL"}
            cb = make_task_callback(f"driver-{self.uid}", load_info=load_info)
            mock_output = MagicMock()
            mock_output.agent = "Automated Track & Trace Liaison"
            mock_output.raw = "Tracking armed. ETA: 07/01 14:00."
            mock_output.description = "Monitor load L-55..."
            cb(mock_output)

        mock_send_sms.assert_called_once()
        call_kwargs = mock_send_sms.call_args
        self.assertIn("+15005550006", str(call_kwargs))

    def test_track_trace_callback_no_sms_for_email_contact(self):
        """SMS is skipped when broker_contact is an email address, not a phone."""
        mock_send_sms = MagicMock()

        import app.agent_events as ae_mod
        with patch.object(ae_mod.sms_client, "send_tracking_update", mock_send_sms):
            from app.agent_events import make_task_callback
            load_info = {"id": "L-66", "broker_contact": "dispatch@broker.com",
                         "origin": "Dallas, TX"}
            cb = make_task_callback(f"driver-{self.uid}", load_info=load_info)
            mock_output = MagicMock()
            mock_output.agent = "Automated Track & Trace Liaison"
            mock_output.raw = "Tracking armed."
            mock_output.description = "Monitor..."
            cb(mock_output)

        mock_send_sms.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)
