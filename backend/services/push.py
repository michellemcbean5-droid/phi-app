"""
services/push.py — Firebase Cloud Messaging push notifications for the PHI driver app.

Sends real-time push alerts to the driver's mobile device for three critical events:
  1. Freight Negotiator locked in a high-paying load         → notify_load_locked()
  2. Compliance Officer detected an upcoming HOS violation   → notify_hos_violation()
  3. Emergency Crisis Controller triggered a breakdown alert → notify_emergency()

Configuration (set exactly one of the following):
  FIREBASE_SERVICE_ACCOUNT_B64   base64-encoded service-account JSON blob.
                                  Cloud-secret-friendly (no file needed on the server).
                                  Generate with: base64 -i service-account.json
  FIREBASE_SERVICE_ACCOUNT_JSON  Absolute path to the service-account JSON file.
                                  Useful for local development.

The driver's FCM device token is stored in the `users.fcm_device_token` column
(see backend/db/schema.sql) and looked up by driver_id before every send.
If neither env var is set, all send functions return "skipped" without raising.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import threading
from typing import Optional

logger = logging.getLogger("phi.push")


class PushNotificationError(RuntimeError):
    """Raised when an FCM message delivery attempt fails."""


_app_lock = threading.Lock()
_firebase_app = None  # module-level singleton; set once, read many times


def _get_app():
    """
    Lazy-initialize and return the Firebase Admin App.
    Thread-safe via double-checked locking.
    Returns None if no credentials are configured.
    """
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    with _app_lock:
        if _firebase_app is not None:
            return _firebase_app

        b64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_B64", "")
        json_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")

        if not b64 and not json_path:
            logger.warning(
                "Firebase not configured — set FIREBASE_SERVICE_ACCOUNT_B64 "
                "or FIREBASE_SERVICE_ACCOUNT_JSON to enable push notifications"
            )
            return None

        try:
            import firebase_admin
            from firebase_admin import credentials

            if b64:
                sa_dict = json.loads(base64.b64decode(b64).decode("utf-8"))
                cred = credentials.Certificate(sa_dict)
            else:
                cred = credentials.Certificate(json_path)

            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully")
            return _firebase_app

        except Exception as exc:
            logger.error("Firebase Admin initialization failed: %s", exc)
            return None


def _send(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    *,
    priority: str = "high",
) -> str:
    """
    Send a single FCM push notification.
    Returns the FCM message ID, or "skipped" if Firebase is not configured.
    Raises PushNotificationError on FCM API failure.
    """
    app = _get_app()
    if app is None:
        logger.warning("Firebase not available — push skipped (title=%r)", title)
        return "skipped"

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            android=messaging.AndroidConfig(priority=priority),
            apns=messaging.APNSConfig(
                headers={"apns-priority": "10" if priority == "high" else "5"}
            ),
            token=token,
        )
        msg_id = messaging.send(message)
        logger.info("FCM push sent → %s (title=%r)", msg_id, title)
        return msg_id

    except Exception as exc:
        logger.error("FCM send failed (title=%r): %s", title, exc)
        raise PushNotificationError(str(exc)) from exc


def notify_load_locked(
    device_token: str,
    *,
    load_id: str,
    origin: str,
    destination: str,
    rpm: float,
) -> str:
    """
    Alert the driver that the Freight Negotiator successfully booked a high-paying load.
    Fired automatically from agent_events.py when the negotiate_task completes
    with a confirmed booking, and also available as POST /api/v1/notifications/load-locked.
    """
    return _send(
        device_token,
        title="Load Locked In!",
        body=f"{origin} to {destination} at ${rpm:.2f}/mile — open PHI to review.",
        data={
            "event": "load_locked",
            "load_id": load_id,
            "origin": origin,
            "destination": destination,
            "rpm": str(rpm),
        },
    )


def notify_hos_violation(
    device_token: str,
    *,
    hours_remaining: float,
    violation_type: str,
) -> str:
    """
    Alert the driver that the Compliance Officer detected an impending HOS violation.
    Fired automatically from agent_events.py when the compliance_officer task
    output contains a compliance hold keyword.
    """
    return _send(
        device_token,
        title="HOS Alert — Action Required",
        body=(
            f"{violation_type}: {hours_remaining:.1f} hrs remaining. "
            "Compliance hold active — open PHI for details."
        ),
        data={
            "event": "hos_violation",
            "violation_type": violation_type,
            "hours_remaining": str(hours_remaining),
        },
    )


def notify_emergency(
    device_token: str,
    *,
    load_id: str,
    summary: str,
) -> str:
    """
    Fire a breakdown/crisis alert from the Emergency Crisis Controller.
    Fired from POST /api/v1/emergency or automatically from agent_events.py
    when the emergency_controller task completes.
    """
    return _send(
        device_token,
        title="Emergency Alert",
        body=summary,
        data={"event": "emergency", "load_id": load_id},
        priority="high",
    )
