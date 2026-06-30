"""
Bridges CrewAI's synchronous task_callback hooks to the persistence layer
and the live WebSocket broadcast — invoked once per completed Task inside
each Crew built in tasks.py.

CrewAI runs callbacks on a worker thread with no running event loop, so the
broadcast hops onto the main event loop via run_coroutine_threadsafe; see
ConnectionManager.broadcast_to_driver_sync in websocket_manager.py.
"""

from __future__ import annotations

import logging
from typing import Any, Callable

from app.database import SessionLocal, log_agent_action, clear_invoice
from app.websocket_manager import manager as ws_manager

logger = logging.getLogger("phi.agent_events")

# Maps a CrewAI agent's `role` string (see agents.py) to the action_type
# values backend/db/schema.sql's ai_action_logs.action_type check constraint
# allows: scan, negotiate, dispatch, route, fuel, invoice, compliance,
# maintenance, alert, briefing.
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


def make_task_callback(driver_id: str | None, load_id: str | None = None) -> Callable[[Any], None]:
    """Build a `task_callback` for a Crew tied to a specific driver/load.

    Persists each completed Task's output to ai_action_logs and broadcasts
    it to that driver's live WebSocket connection, if one is open. Pass to
    `Crew(..., task_callback=make_task_callback(driver_id))`.
    """

    def _callback(task_output: Any) -> None:
        agent_role = getattr(task_output, "agent", None) or "Unknown Agent"
        action_type = AGENT_ACTION_TYPES.get(agent_role, "alert")
        raw = getattr(task_output, "raw", None) or str(task_output)
        summary = raw[:500]

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

        if driver_id:
            ws_manager.broadcast_to_driver_sync(driver_id, event)

    return _callback


FINANCE_SPECIALIST_ROLE = "Automated Invoicing & Factoring Clerk"
DEFAULT_FACTORING_FEE_PCT = 0.03  # standard same-day factoring fee, used until
                                   # the agent's free-text output is parsed into
                                   # structured fields


def make_post_delivery_callback(
    driver_id: str | None, load_id: str | None, delivery: dict
) -> Callable[[Any], None]:
    """task_callback for build_post_delivery_crew.

    Does everything make_task_callback does, plus: when the finance
    specialist's invoice task completes, writes the cleared invoice to
    financial_vault and broadcasts `invoice_cleared` — the event the mobile
    dashboard's gold-coin animation listens for.
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

    return _callback
