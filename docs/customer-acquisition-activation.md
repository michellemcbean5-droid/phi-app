# PHI Customer Acquisition Activation

**Status:** Foundation review  
**Prepared:** 2026-08-19  
**Objective:** Build a measurable, policy-governed path from qualified prospect to onboarding, active dispatch, delivery closeout, and retained subscriber.

## What Can Be Made Live Now

The repository already contains the operational half of PHI’s customer lifecycle. Its FastAPI backend provides workflows for freight acquisition, active transit, and post-delivery closeout. The mobile product includes driver preferences, documents, compliance, vehicle information, and subscription views. The public website now presents both the business-launch and existing-operator paths.

| Lifecycle stage | Current status | Required addition |
| --- | --- | --- |
| Website visit and product discovery | Live front-end foundation | Lead form with consent, source capture, and explicit call-to-action |
| Qualification | Not implemented | Durable prospect record, readiness scoring, route to the right offer |
| Deal management | Not implemented | Pipeline stages, owner, follow-up policy, activity ledger, and outcome reporting |
| Payment / subscription | Product positioning exists | Authorized billing integration, checkout, payment-status webhooks, refund policy execution |
| Onboarding | Partly represented in web and mobile | Customer-account creation, policy configuration, integration checklist, go-live gate |
| Service delivery | Existing FastAPI and mobile workflows | Link each subscribed customer to the existing acquisition → transit → closeout workflows |
| Retention / expansion | Not implemented | Health signals, renewal plays, support escalation, and expansion policy |

## Channel Readiness

The current session has no enabled CRM, prospecting, email, calendar, advertising, social publishing, or billing connection. This means PHI can create and validate the owned conversion experience immediately, but it cannot truthfully claim that it is contacting prospects, accepting payment, or booking calls through external systems yet.

| Capability | Examples available but currently unconnected | What activation needs |
| --- | --- | --- |
| CRM and pipeline | HubSpot, Close, HighLevel, ActiveCampaign | User chooses one account and approves the connection |
| Prospect research | Apollo, Hunter | User chooses a provider, buyer definition, and outreach policy |
| Email follow-up | Gmail, AgentMail, AWeber, ActiveCampaign | Sender identity, domain setup, consent/unsubscribe rules, and approval policy |
| Calls / consultations | Calendly, Google Calendar | Owner calendar, booking availability, and lead-routing policy |
| Paid acquisition | Google Ads | Budget, account connection, conversion event, and approval before publishing campaigns |
| Social distribution | Instagram and other publishing services | Connected business account and approval policy before posts are published |
| Billing | Stripe | Connected account, products/prices, tax/refund choices, and explicit activation approval |

> **Activation boundary:** PHI can discover public business information, evaluate opt-in leads, draft communications, nurture consented leads, and route qualified prospects. It must not send deceptive or unlawful outreach, create billing obligations, accept a customer contract, publish paid ads, or promise regulated services outside the customer-approved rules and connected services.

## Architecture Assessment

This system is both customer-facing and event-driven. Its durable core should run behind the PHI website and API, with database-backed records, webhook/event handlers for form submissions and customer lifecycle events, and scheduled follow-up tasks. The single-session environment is appropriate for implementation and test; it is not suitable as the always-on operating environment.

The lightest viable launch uses a database-backed PHI conversion engine with manual export or one connected CRM. A full growth engine adds a connected CRM, billing, appointment scheduling, approved outbound channel, and auditable follow-up rules. Both retain human approval for commercial commitments and safety-critical exceptions.

## Local Validation Checkpoint

The PHI website was run locally with its customer API relay configured. The assessment form rendered with full-name, email, optional phone/company, truck count, home state, top-priority, preferred-contact, and explicit-consent inputs. A local test profile was entered in preparation for validating browser-to-API lead creation; no real customer information or external outreach was used.

The local browser assessment was configured as a three-truck fleet, routed to the small-fleet operations priority, and supplied with explicit follow-up consent. This verifies that PHI captures the information needed to select the fleet path without treating a form submission as a commercial acceptance.

The local browser-to-API test completed successfully. The consented three-truck test profile was stored as a **fleet** lead, returned the **Fleet Operations Snapshot** offer, displayed a success acknowledgment in the website, and generated the associated personalized plan. This was a local validation record only; it did not send email, charge a card, create a customer contract, or contact a real prospect.

## Free PHI Operations Workspace Validation

The new `/operations` route rendered as a private CEO command center with a separate operations access key gate. The user interface does not expose the customer API administration secret; the browser supplies only the operations access key to the server-side gateway. A local test access key was entered before the workspace data-load validation.

The protected local dashboard then loaded successfully with live records from the PHI API. It rendered the verified-MRR progress card, inbound-assessment and qualified-lead counts, follow-ups that were explicitly marked as prepared rather than sent, consultation-handoff counts, a multi-stage pipeline, source-awareness placeholder, and autonomy guardrails. The dashboard correctly kept external email and calendar actions labeled as awaiting an authorized connection.

The follow-up queue was exercised in the local browser. A **Ready** assessment-response record opened a personalized PHI draft with the prospect’s recommended offer and journey context. The interface explicitly stated that no external delivery was available and required a real sender-provided delivery identifier before any record can be marked sent. The only available operator control without a connected sender was to hold the draft for review.

A qualified local lead was converted into a consultation handoff from the pipeline. The action created only an internal PHI appointment request and explicitly did not send a message or publish a calendar booking; this confirms the booking-control boundary is preserved before a free calendar account is authorized.

During the local post-handoff refresh, the server-side operations gateway encountered an empty/non-JSON upstream response and the browser displayed a parsing error. The gateway was hardened to parse upstream text defensively and return a controlled JSON availability message rather than an HTML error page. The web project rebuilt successfully after this correction; final browser retesting continues against the refreshed development process.

The local preview was restarted after the production-build artifact conflict. The private Operations access gate then rendered normally again with the branded PHI CEO command-center design and no stale styling or module errors.

Final clean-preview validation succeeded. The private PHI Operations dashboard loaded from the protected gateway with live customer lifecycle data; the consultation-handoff count increased from two to three after the local pipeline action, confirming that the browser workspace persisted and reread the appointment request through the API. No real prospect was contacted, no payment was collected, and no external calendar event was created during validation.
