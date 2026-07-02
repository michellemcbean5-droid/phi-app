"""
services/communication.py — Live carrier-to-market communication layer.

Two subsystems:
  1. TwilioSMSClient — used by the Track & Trace Agent to send automated
     freight tracking updates and ETA alerts directly to broker/shipper phones.
  2. send_invoice_email — used by the Finance Specialist to email the finalized
     invoice + signed BOL to the factoring company as soon as delivery is confirmed.

Required environment variables:
  TWILIO_ACCOUNT_SID     Twilio account SID (AC...)
  TWILIO_AUTH_TOKEN      Twilio secret token
  TWILIO_FROM_NUMBER     Twilio phone number in E.164 format (e.g. +15005550006)

  SENDGRID_API_KEY       SendGrid API key (SG....)
  SENDGRID_FROM_EMAIL    Verified sender email address

All functions degrade gracefully (log a warning, return "skipped") when the
relevant env vars are not set, so the app starts cleanly without credentials.
"""

from __future__ import annotations

import base64
import logging
import os
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger("phi.communication")


class CommunicationError(RuntimeError):
    """Raised when an SMS or email delivery attempt fails after all retries."""


@dataclass
class SMSResult:
    sid: str
    to: str
    status: str


class TwilioSMSClient:
    """
    Thin Twilio REST wrapper.
    Use the module-level `sms_client` singleton — don't instantiate this directly.
    """

    def __init__(self) -> None:
        self._account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self._auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self._from_number = os.getenv("TWILIO_FROM_NUMBER", "")
        self._client = None  # lazy-initialized on first send

    @property
    def is_configured(self) -> bool:
        return bool(self._account_sid and self._auth_token and self._from_number)

    def _get_client(self):
        if self._client is None:
            from twilio.rest import Client
            self._client = Client(self._account_sid, self._auth_token)
        return self._client

    def send_sms(self, to_phone: str, message: str) -> SMSResult:
        """
        Send a raw SMS message. Returns SMSResult with status='skipped' when
        Twilio is not configured. Raises CommunicationError on Twilio API failure.
        """
        if not self.is_configured:
            logger.warning("Twilio not configured — SMS to %s skipped", to_phone)
            return SMSResult(sid="", to=to_phone, status="skipped")

        try:
            client = self._get_client()
            msg = client.messages.create(
                body=message,
                from_=self._from_number,
                to=to_phone,
            )
            logger.info("SMS sent to %s — SID %s status %s", to_phone, msg.sid, msg.status)
            return SMSResult(sid=msg.sid, to=to_phone, status=msg.status)
        except Exception as exc:
            logger.error("Twilio send failed for %s: %s", to_phone, exc)
            raise CommunicationError(str(exc)) from exc

    def send_tracking_update(
        self,
        to_phone: str,
        *,
        load_id: str,
        milestone: str,
        location: str,
        eta: Optional[str] = None,
    ) -> SMSResult:
        """Send a structured tracking milestone to the broker/shipper."""
        eta_line = f"\nETA: {eta}" if eta else ""
        body = (
            f"PHI TRACKING UPDATE\n"
            f"Load #{load_id} — {milestone}\n"
            f"Current: {location}{eta_line}\n"
            f"Automated update · Prince Haul Intelligence"
        )
        return self.send_sms(to_phone, body)

    def send_eta_change(
        self,
        to_phone: str,
        *,
        load_id: str,
        new_eta: str,
        reason: str,
    ) -> SMSResult:
        """Notify broker/shipper of a revised delivery ETA."""
        body = (
            f"PHI ETA CHANGE\n"
            f"Load #{load_id}\n"
            f"New ETA: {new_eta}\n"
            f"Reason: {reason}\n"
            f"Automated update · Prince Haul Intelligence"
        )
        return self.send_sms(to_phone, body)


# One instance per process — import `sms_client`, don't instantiate TwilioSMSClient.
sms_client = TwilioSMSClient()


def send_invoice_email(
    *,
    to_email: str,
    load_id: str,
    invoice_number: str,
    gross_amount: float,
    net_amount: float,
    factoring_company: str,
    bol_text: str,
    from_email: Optional[str] = None,
) -> str:
    """
    Email the finalized invoice summary and signed BOL to the factoring company.

    The BOL OCR text is attached as a plain-text file. For production, swap the
    BOL text attachment for a generated PDF by passing `bol_pdf_bytes` and
    using FileType("application/pdf").

    Returns the SendGrid X-Message-Id header value, or "skipped" if SendGrid
    is not configured. Raises CommunicationError on API failure.
    """
    api_key = os.getenv("SENDGRID_API_KEY", "")
    sender = from_email or os.getenv("SENDGRID_FROM_EMAIL", "")

    if not api_key or not sender:
        logger.warning(
            "SendGrid not configured — invoice email to %s skipped", to_email
        )
        return "skipped"

    try:
        import sendgrid
        from sendgrid.helpers.mail import (
            Attachment,
            Disposition,
            FileContent,
            FileName,
            FileType,
            Mail,
        )

        html_body = f"""
        <h2 style="color:#003087">Invoice Submission — {factoring_company}</h2>
        <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif">
          <tr style="background:#f5f7fa">
            <td><strong>Load ID</strong></td>
            <td>{load_id}</td>
          </tr>
          <tr>
            <td><strong>Invoice #</strong></td>
            <td>{invoice_number}</td>
          </tr>
          <tr style="background:#f5f7fa">
            <td><strong>Gross Amount</strong></td>
            <td>${gross_amount:,.2f}</td>
          </tr>
          <tr>
            <td><strong>Net (after factoring fee)</strong></td>
            <td><strong>${net_amount:,.2f}</strong></td>
          </tr>
        </table>
        <p style="margin-top:16px">
          The signed Bill of Lading is attached as a text file.<br>
          Submitted automatically by <strong>Prince Haul Intelligence</strong>.
        </p>
        """

        message = Mail(
            from_email=sender,
            to_emails=to_email,
            subject=f"Invoice {invoice_number} — Load {load_id} [{factoring_company}]",
            html_content=html_body,
        )

        bol_b64 = base64.b64encode(bol_text.encode("utf-8")).decode()
        bol_attachment = Attachment(
            FileContent(bol_b64),
            FileName(f"BOL_{load_id}.txt"),
            FileType("text/plain"),
            Disposition("attachment"),
        )
        message.add_attachment(bol_attachment)

        sg = sendgrid.SendGridAPIClient(api_key=api_key)
        response = sg.send(message)
        msg_id = response.headers.get("X-Message-Id", "sent")
        logger.info(
            "Invoice email sent to %s for load %s — %s (HTTP %s)",
            to_email, load_id, msg_id, response.status_code,
        )
        return str(msg_id)

    except Exception as exc:
        logger.error("SendGrid invoice email failed for %s: %s", to_email, exc)
        raise CommunicationError(str(exc)) from exc
