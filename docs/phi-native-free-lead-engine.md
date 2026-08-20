# PHI Native Free Lead Engine Architecture

## Purpose

This design turns PHI’s existing website assessment and customer-lifecycle API into the company’s first free sales operating system. It uses PHI as the system of record rather than adding a paid CRM. The engine is designed to capture inbound visitors, preserve their consent and source, score fit, queue a tailored follow-up, hand qualified prospects into a requested consultation, and show the CEO which sources create customers.

> **Operating promise:** PHI automates data capture, preparation, routing, reminders, and measurement. It does not promise a lead will buy, contact people who have not opted in, send messages through an unverified channel, accept a contract, collect a payment, or certify a customer’s legal/compliance status.

## Data and Workflow

| Event | Automatic PHI action | Record created or updated | Escalation / approval point |
| --- | --- | --- | --- |
| Website assessment submitted with consent | Capture source parameters, normalize the contact, score the journey, and choose the relevant offer. | `customer_leads`; `customer_journey_events` | None; the customer requested the assessment. |
| Lead is qualified | Create a tailored follow-up draft and a seven-day next-action window. | `customer_followups`; `customer_journey_events` | External delivery stays queued until a verified free sender is connected. |
| Lead requests a consultation | Create a booking-handoff task and stage the lead as an opportunity only when staff/policy records a reason. | `customer_appointments`; `customer_journey_events` | Calendar availability and meeting host are controlled by PHI leadership. |
| Follow-up is delivered | Store the provider delivery ID and sent timestamp. | `customer_followups`; `customer_journey_events` | Suppression/opt-out rules take priority over all delivery attempts. |
| Booking is completed/cancelled/no-show | Update the appointment status and queue the correct next action. | `customer_appointments`; `customer_journey_events` | Any commercial promise, pricing exception, or customer agreement remains human approved. |
| Opportunity is won | Require a recorded commercial acceptance before onboarding may begin. | `customer_leads`; `customer_journey_events` | Protected stage transition and onboarding gate. |

## Free Conversion Dashboard

The internal `/operations` workspace should show a complete, truthful view of the funnel without exposing the API administration secret to the browser. Its primary panels are the following.

| Panel | Question answered | Primary measure |
| --- | --- | --- |
| Inbound signal | Are people arriving and completing the assessment? | New leads and conversion by source/journey |
| Qualification queue | Who needs the next meaningful action? | Qualified leads, follow-up status, due actions |
| Consultation handoff | Are interested prospects moving into a real conversation? | Requested, scheduled, completed, cancelled, and no-show appointments |
| Revenue path | Where do prospects fall out before activation? | Lead → qualified → opportunity → won → onboarding completion |
| Governance monitor | Is automation operating inside its limits? | Consented leads, queued/held messages, suppressed contacts, exception events |
| Agent pods | Which PHI agents are responsible for the next action? | Acquisition, qualification, sales orchestration, and onboarding tasks |

## Lead Source Capture

PHI will record organic visits, referrals, and standard campaign parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `ref`). These fields do not create leads by themselves. They let PHI identify which content or referral path produced a submitted, consented assessment.

The initial acquisition loop is intentionally simple:

1. A driver or small-fleet owner reaches the PHI site from a referral, shared link, search result, social content, or direct visit.
2. The visitor selects the business-launch, dispatch, or fleet journey and receives clear free planning value before submitting the consented assessment.
3. PHI stores the lead, qualification outcome, recommended offer, and traffic source.
4. The lead enters a tailored follow-up queue. Until PHI has an authorized free sender, the dashboard labels the message **Ready—not sent**.
5. A free calendar connection or business-owned booking page turns qualified interest into an appointment request; PHI records the outcome and routes the lead to the correct stage.
6. Only an approved commercial outcome allows the existing onboarding flow to start.

## Follow-Up Policy

The starting sequence is a **single requested-assessment response** and two behavior-based reminders. Each message must be linked to the requested PHI plan, state who is writing, avoid profit guarantees, honor opt-outs, and be suppressed if the lead asks not to be contacted. SMS and automated calls are out of scope until channel-specific consent controls and a verified sender are configured.

| Sequence step | Trigger | Draft purpose | Max action |
| --- | --- | --- | --- |
| 1. Assessment response | Consented lead created | Deliver the tailored PHI plan and offer the relevant next step. | One email through verified sender. |
| 2. Practical follow-up | No booking/action after 3 business days | Share one relevant operating insight and invite a clear next step. | One email; stop if opted out. |
| 3. Close-the-loop | No booking/action after 7 business days | Offer to keep the plan on file and leave the door open. | One email; then move to nurture or hold. |
| Consultation reminder | Appointment scheduled | Confirm time and what PHI will review. | Calendar/email confirmed event only. |

## Measurement Toward the Revenue Goal

The dashboard reports verified counts and revenue; it never estimates customer revenue from intent alone. The 35,000 monthly target is treated as a commercial target and a measurement boundary, not as a promised outcome.

| Metric | Formula | Action when weak |
| --- | --- | --- |
| Assessment conversion | Submitted assessments ÷ tracked landing-page visits | Simplify page, strengthen free planning value, test source messaging. |
| Qualification rate | Qualified leads ÷ consented leads | Clarify the visitor path and require less irrelevant information. |
| Booking rate | Scheduled consultations ÷ qualified leads | Improve the offer, availability, and call-to-action. |
| Win rate | Verified wins ÷ opportunities | Improve discovery, pricing clarity, proof, and customer fit. |
| Activation rate | Completed onboarding ÷ verified wins | Reduce onboarding blockers and prioritize the first operating milestone. |
| Verified MRR | Sum of active, paid subscription records | Use billing-confirmed records only. |

## Activation Prerequisites

To make the queue send real follow-up automatically, PHI still needs a free email or calendar authorization, an approved sender identity, business mailing address for commercial email disclosures, and a production deployment with `PHI_ADMIN_TOKEN` stored securely. Until those are in place, PHI can prepare and queue every action but should not claim that it sent it.
