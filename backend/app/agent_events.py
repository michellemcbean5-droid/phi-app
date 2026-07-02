"""
Bridges CrewAI's synchronous task_callback hooks to the persistence layer,
the live WebSocket broadcast, and the live communication services (SMS + push).

Callback chain on each completed Task:
  1. Persist the output to ai_action_logs (SQLAlchemy → Postgres/SQLite)
  2. Broadcast an agent_action event over the driver's WebSocket (if connected)
  3. Fire service-specific side effects:
       Track & Trace Liaison    → SMS the broker/shipper with a tracking update
       Freight Negotiator       → FCM push "Load locked in" (negotiate task only)
       DOT Compliance Auditor   → FCM push HOS violation alert (if hold detected)
       24/7 Crisis Controller   → FCM push breakdown/emergency alert
       Finance Specialist       → Email invoice + BOL to factoring company

CrewAI runs callbacks on a worker thread with no running event loop. The
broadcast hops onto the main event loop via run_coroutine_threadsafe;
see ConnectionManager.broadcast_to_driver_sync in websocket_manager.py.
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Optional

from app.database import SessionLocal, log_agent_action, clear_invoice, get_fcm_token
from app.websocket_manager import manager as ws_manager

logger = logging.getLogger("phi.agent_events")

# Graceful degradation: if the communication packages aren't installed yet, the
# service still starts — SMS and push are silently skipped.
try:
    from services.communication import sms_client, send_invoice_email
    from services.push import notify_load_locked, notify_hos_violation, notify_emergency
    _COMMS_AVAILABLE = True
except ImportError:
    _COMMS_AVAILABLE = False
    logger.warning(
        "services.communication or services.push not importable — "
        "SMS, email, and push notifications are disabled. "
        "Run: pip install twilio sendgrid firebase-admin"
    )

# ─── Agent → action_type mapping ─────────────────────────────────────────────
# Maps each agent's `role` string (defined in agents.py) to one of the action_type
# values allowed by backend/db/schema.sql's ai_action_logs.action_type check constraint:
#   scan, negotiate, dispatch, route, fuel, invoice, compliance, maintenance, alert, briefing

AGENT_ACTION_TYPES: dict[str, str] = {
    "Automated Fleet Dispatcher": "dispatch",
    "Predictive Route Navigator": "route",
    "Fuel Procurement Strategist": "fuel",
    "Automated Track & Trace Liaison": "alert",
    "Autonomous Freight Rate Negotiator": "negotiate",
    "Automated Invoicing & Factoring Clerk": "invoice",
    "Autonomous Tax & Expense Auditor": "invoice",
    "B2B Direct Shipper Acquisition Specialist": "scan",
    "DOT Compliance & Safety Auditor": "compliance",
    "Corporate Contract & Legal Auditor": "compliance",
    "Risk & Liability Assessment Specialist": "scan",
    "Predictive Fleet Maintenance Monitor": "maintenance",
    "In-Cab Virtual Driver Assistant": "briefing",
    "24/7 Crisis Response Controller": "alert",
    "Business Intelligence Executive": "briefing",
}

# Keywords in compliance_officer output that trigger an HOS push alert.
_HOS_HOLD_KEYWORDS = ("HOLD", "violation", "hours of service", "HOS", "exceed")

FINANCE_SPECIALIST_ROLE = "Automated Invoicing & Factoring Clerk"
TRACK_TRACE_ROLE = "Automated Track & Trace Liaison"
FREIGHT_NEGOTIATOR_ROLE = "Autonomous Freight Rate Negotiator"
COMPLIANCE_OFFICER_ROLE = "DOT Compliance & Safety Auditor"
EMERGENCY_CONTROLLER_ROLE = "24/7 Crisis Response Controller"

DEFAULT_FACTORING_FEE_PCT = 0.03  # 3% same-day factoring rate until parsed from output


def make_task_callback(
    driver_id: str | None,
    load_id: str | None = None,
    load_info: Optional[dict] = None,
) -> Callable[[Any], None]:
    """
    Build a `task_callback` for a Crew tied to a specific driver/load.

    On every completed Task:
      - Persists output to ai_action_logs
      - Broadcasts to the driver's WebSocket
      - For Track & Trace Liaison: SMS the broker with a tracking confirmation
      - For Freight Negotiator (negotiate task): FCM push "load locked" to driver
      - For DOT Compliance Auditor: FCM push HOS alert if a hold is detected
      - For 24/7 Crisis Controller: FCM push emergency/breakdown alert

    Args:
        driver_id:  Driver's user ID (used for DB write + WebSocket routing).
        load_id:    Active load ID to attach to the log entry (optional).
        load_info:  Full load dict from DispatchRequest (used to extract
                    broker_contact for Track & Trace SMS alerts).
    """

    def _callback(task_output: Any) -> None:
        agent_role: str = getattr(task_output, "agent", None) or "Unknown Agent"
        action_type: str = AGENT_ACTION_TYPES.get(agent_role, "alert")
        raw: str = getattr(task_output, "raw", None) or str(task_output)
        summary: str = raw[:500]

        # ── 1. Persist to database ───────────────────────────────────────────
        db = SessionLocal()
        try:
            entry = log_agent_action(
                db,
                agent_name=agent_role,
                action_type=action_type,
                summary=summary,
                driver_id=driver_id,
                load_id=load_id,
            )
            event = {
                "type": "agent_action",
                "id": entry.id,
                "agent_name": entry.agent_name,
                "action_type": entry.action_type,
                "summary": entry.summary,
                "created_at": entry.created_at.isoformat(),
            }
        except Exception:
            logger.exception("Failed to persist agent action for driver %s", driver_id)
            return
        finally:
            db.close()

        # ── 2. Broadcast over WebSocket ──────────────────────────────────────
        if driver_id:
            ws_manager.broadcast_to_driver_sync(driver_id, event)

        if not _COMMS_AVAILABLE:
            return

        # ── 3. Track & Trace → SMS the broker/shipper ────────────────────────
        if agent_role == TRACK_TRACE_ROLE and load_info:
            broker_contact = (load_info.get("broker_contact") or "").strip()
            # broker_contact may be an email; only SMS if it looks like a phone number
            if broker_contact and (broker_contact.startswith("+") or broker_contact.lstrip("+").isdigit()):
                try:
                    sms_client.send_tracking_update(
                        broker_contact,
                        load_id=load_info.get("id", load_id or ""),
                        milestone="Tracking Active",
                        location=load_info.get("origin", "En route"),
                    )
                except Exception as exc:
                    logger.warning("SMS to broker failed: %s", exc)

        # ── 4. Freight Negotiator negotiate task → FCM "load locked" push ────
        if agent_role == FREIGHT_NEGOTIATOR_ROLE and driver_id:
            task_desc: str = getattr(task_output, "description", "") or ""
            # The negotiate_task description starts with "Negotiate the rate".
            # The scan_task description starts with "Scan the top 5 load boards".
            if "Negotiate the rate" in task_desc and "no_qualifying_load_report" not in raw:
                _fire_load_locked_push(driver_id, load_id or "", raw)

        # ── 5. Compliance Officer → FCM HOS violation push ───────────────────
        if agent_role == COMPLIANCE_OFFICER_ROLE and driver_id:
            if any(kw in raw for kw in _HOS_HOLD_KEYWORDS):
                _fire_hos_push(driver_id, raw)

        # ── 6. Emergency Controller → FCM breakdown push ─────────────────────
        if agent_role == EMERGENCY_CONTROLLER_ROLE and driver_id:
            _fire_emergency_push(driver_id, load_id or "", summary)

    return _callback


def _fire_load_locked_push(driver_id: str, load_id: str, raw: str) -> None:
    """Look up the driver's FCM token and send a 'load locked' push notification."""
    db = SessionLocal()
    try:
        token = get_fcm_token(db, driver_id)
    finally:
        db.close()

    if not token:
        logger.debug("No FCM token for driver %s — load-locked push skipped", driver_id)
        return

    try:
        notify_load_locked(
            token,
            load_id=load_id,
            # Best-effort extraction — the negotiate_task expected_output names these fields
            origin=_extract_field(raw, "origin") or "New Load",
            destination=_extract_field(raw, "destination") or "See App",
            rpm=_extract_rpm(raw),
        )
    except Exception as exc:
        logger.warning("FCM load-locked push failed for driver %s: %s", driver_id, exc)


def _fire_hos_push(driver_id: str, raw: str) -> None:
    """Look up FCM token and send an HOS violation push alert."""
    db = SessionLocal()
    try:
        token = get_fcm_token(db, driver_id)
    finally:
        db.close()

    if not token:
        return

    try:
        notify_hos_violation(
            token,
            hours_remaining=_extract_hours_remaining(raw),
            violation_type="Hours of Service",
        )
    except Exception as exc:
        logger.warning("FCM HOS push failed for driver %s: %s", driver_id, exc)


def _fire_emergency_push(driver_id: str, load_id: str, summary: str) -> None:
    """Look up FCM token and send an emergency/breakdown push alert."""
    db = SessionLocal()
    try:
        token = get_fcm_token(db, driver_id)
    finally:
        db.close()

    if not token:
        return

    try:
        notify_emergency(token, load_id=load_id, summary=summary)
    except Exception as exc:
        logger.warning("FCM emergency push failed for driver %s: %s", driver_id, exc)


# ─── Best-effort field extraction helpers ────────────────────────────────────
# These parse LLM free-text output. They are intentionally lenient — return
# sensible defaults rather than crashing, because the push notification is
# supplemental; the driver will see the full details in the app.

def _extract_field(text: str, field: str) -> str:
    """Return the value after 'field: value' in the agent's raw output, if present."""
    import re
    match = re.search(rf"\b{field}[:\s]+([^\n,}}]+)", text, re.IGNORECASE)
    return match.group(1).strip() if match else ""


def _extract_rpm(text: str) -> float:
    """Return the first RPM-like decimal found in the text, defaulting to 0.0."""
    import re
    match = re.search(r"(\d+\.\d{2})\s*(?:/mi|rpm|per mile)", text, re.IGNORECASE)
    return float(match.group(1)) if match else 0.0


def _extract_hours_remaining(text: str) -> float:
    """Return the first 'X hours' number found in the text, defaulting to 0.0."""
    import re
    match = re.search(r"(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)", text, re.IGNORECASE)
    return float(match.group(1)) if match else 0.0


# ─── Post-delivery callback ───────────────────────────────────────────────────

def make_post_delivery_callback(
    driver_id: str | None, load_id: str | None, delivery: dict
) -> Callable[[Any], None]:
    """
    task_callback for build_post_delivery_crew.

    Wraps make_task_callback and adds two finance-specific side effects when
    the Finance Specialist's invoice_task completes:
      1. Writes a cleared invoice record to financial_vault
      2. Broadcasts `invoice_cleared` → triggers the mobile gold-coin animation
      3. Emails the invoice + signed BOL to the factoring company (if configured)
    """
    log_callback = make_task_callback(driver_id, load_id)

    def _callback(task_output: Any) -> None:
        log_callback(task_output)

        agent_role = getattr(task_output, "agent", None)
        if agent_role != FINANCE_SPECIALIST_ROLE:
            return

        gross_amount = float(delivery.get("agreed_rate") or 0)
        if gross_amount <= 0:
            return
        factoring_fee = round(gross_amount * DEFAULT_FACTORING_FEE_PCT, 2)

        db = SessionLocal()
        try:
            entry = clear_invoice(
                db,
                driver_id=driver_id,
                load_id=load_id,
                gross_amount=gross_amount,
                factoring_fee=factoring_fee,
                factoring_company=delivery.get("factoring_company"),
                tax_deductions={
                    "fuel": delivery.get("fuel_cost") or 0,
                    "tolls": delivery.get("toll_cost") or 0,
                },
            )
            event = {
                "type": "invoice_cleared",
                "id": entry.id,
                "gross_amount": entry.gross_amount,
                "net_amount": entry.net_amount,
                "factoring_status": entry.factoring_status,
                "cleared_at": entry.cleared_at.isoformat() if entry.cleared_at else None,
            }
        except Exception:
            logger.exception("Failed to clear invoice for driver %s", driver_id)
            return
        finally:
            db.close()

        if driver_id:
            ws_manager.broadcast_to_driver_sync(driver_id, event)

        # ── Email invoice + BOL to factoring company ──────────────────────────
        factoring_email = delivery.get("factoring_email", "")
        if _COMMS_AVAILABLE and factoring_email:
            try:
                send_invoice_email(
                    to_email=factoring_email,
                    load_id=delivery.get("load_id") or load_id or "",
                    invoice_number=entry.invoice_number or f"INV-{entry.id}",
                    gross_amount=entry.gross_amount,
                    net_amount=entry.net_amount,
                    factoring_company=delivery.get("factoring_company") or "",
                    bol_text=delivery.get("bol_text") or "",
                )
            except Exception as exc:
                logger.warning("Invoice email failed for driver %s: %s", driver_id, exc)

    return _callback
