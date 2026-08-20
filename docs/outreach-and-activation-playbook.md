# PHI Outreach and Activation Playbook

**Purpose:** Operate an accountable, consent-aware customer journey from website assessment through paid activation and first verified operating outcome.  
**Status:** The owned lead-capture and lifecycle API are implemented. External sending, CRM sync, billing, and appointment booking remain inactive until the PHI operator connects and authorizes the chosen services.

## Customer Journey Operating Rules

| Stage | System action | Customer-facing action | Required control |
| --- | --- | --- | --- |
| Visitor | Capture approved campaign/source context and present the assessment. | Chooses launch, dispatch, or fleet path. | Respect privacy choices; do not collect sensitive data not needed for the assessment. |
| Consented lead | Store assessment, consent timestamp, source, recommended offer, and audit event. | Receives an on-page confirmation and tailored next steps. | Do not represent that email/SMS has been sent unless a confirmed channel has delivered it. |
| Qualified lead | Assign an owner and next action based on the transparent qualification score. | Can review a PHI Game Plan or choose a consultation/self-serve route. | Lead qualification is advisory; it does not create a customer obligation. |
| Opportunity | Record interest, consultation, pricing discussion, or checkout initiation. | Receives accurate offer and terms. | A human-approved policy or verified self-serve payment must determine a commercial win. |
| Won customer | Start onboarding only after an authorized commercial decision. | Creates profile, operating policy, document workspace, and connection checklist. | Never mark a customer as won based only on an AI recommendation or form submission. |
| Activated operator | Route the customer into the existing freight, transit, documents, and closeout workflows. | Completes the first operating milestone. | Customer retains safety, regulatory, driving, contract, and financial decisions. |
| Outcome and retention | Record the delivered milestone and prepare a weekly review. | Reviews work completed, blockers, and next actions. | Do not claim earnings, compliance certification, or load outcomes that were not verified. |

## Follow-up Automations to Activate

PHI should prioritize **inbound and consented follow-up** before any outbound prospecting. The first message must be delivered only through the lead’s selected channel, must name PHI accurately, must reflect the assessment requested, and must include a direct opt-out route where the message is marketing.

| Trigger | Eligible contact | Intended action | Guardrail |
| --- | --- | --- | --- |
| `lead.created` | Explicitly consented assessment lead | Create a CRM record, queue the relevant PHI Game Plan, and schedule a human/policy-approved follow-up. | No automatic external message until a sender/channel policy is active. |
| `lead.qualified` | Lead with recorded consent | Prepare the segment-specific follow-up draft and a clear next step. | Do not present a diagnostic as a guarantee of profitability or business approval. |
| `lead.reengaged` | Previously consented lead | Refresh source and consent record; suppress duplicates. | Keep the highest existing stage; do not reset a customer or closed opportunity. |
| `lead.stage_changed` | Authorized customer-operations user only | Add an audit event and update external CRM only after it is connected. | Every manual/automated stage change requires a recorded reason. |
| `onboarding.in_progress` | Verified won customer | Start account, preference, document, and integration checklist. | Cannot begin before the commercial win gate. |
| `onboarding.complete` | Activated customer | Route to the first operating workflow and weekly success review. | Escalate missing safety/compliance data rather than auto-certifying it. |

## Sales Conversation Structure

PHI’s initial conversation should resolve the prospect’s operating state, next measurable objective, and correct entry point. It should not pressure the prospect with earnings promises or hide the customer’s responsibilities.

| Segment | Open with | Discovery focus | Appropriate next step |
| --- | --- | --- | --- |
| Launch-ready operator | “You are not choosing a truck today; you are choosing the operating plan that makes the truck decision work.” | Authority/readiness stage, equipment route, timeline, cash-flow planning needs, preferred operating model | Business Readiness & Equipment Path |
| Active owner-operator | “Let’s find the handoff that is costing you the most time or clarity: freight, dispatch, documents, or closeout.” | Current equipment, lanes, rate floor, tools, document pain, operational urgency | Dispatch & Profit Diagnostic |
| Small fleet leader | “Before adding automation, we need to see where information breaks between truck, dispatcher, document, and customer.” | Truck count, team roles, dispatch process, operational systems, visibility gaps | Fleet Operations Snapshot |

## Commercial Email and Text Controls

The FTC states that CAN-SPAM covers commercial email, including business-to-business messages, and requires accurate routing information, non-deceptive subject lines, identification as an ad, a valid physical postal address, a clear opt-out path, and prompt processing of opt-outs.[1] The follow-up system must therefore record sender identity, message version, delivery outcome, unsubscribe status, and suppression timestamp before it sends a marketing email. PHI should require a qualified legal review before using automated marketing texts or calls because applicable consent rules may differ by channel and recipient.[2]

| Control | Email | Text / call | Owner |
| --- | --- | --- | --- |
| Accurate sender identity | Required | Required | Channel configuration agent |
| Marketing-consent record | Required for PHI’s initial opt-in program | Required before automated marketing use | Consent and compliance agent |
| Opt-out / suppression | Required; honored promptly | Required channel-specific handling | Customer operations agent |
| Physical address / identification | Required for commercial email | N/A in the same form; confirm channel rules before launch | Brand/compliance agent |
| Message approval | Required for a new campaign or material claim | Required before each new campaign | Commercial policy owner |
| External action audit | Delivery, template, campaign, and suppression event | Delivery, template, campaign, and suppression event | Audit and governance agent |

## 100-Agent Sales and Customer-Success Allocation

PHI’s 100-agent workforce should operate as scoped pods, not independent outreach bots. The 30 agents below constitute the commercial path; the remaining pods provide fulfillment, compliance, document, routing, and executive oversight described in the unified platform architecture.

| Pod | Agent count | Permitted work | Prohibited work |
| --- | ---: | --- | --- |
| Acquisition intelligence | 10 | Analyze approved sources, segment consented leads, prepare content briefs, track attribution | Scrape or contact people in breach of platform rules; fabricate testimonials or results |
| Customer qualification | 10 | Score assessment information, select offer path, identify missing onboarding facts, create task queues | Declare creditworthiness, legal eligibility, or safety approval |
| Sales orchestration | 10 | Draft approved follow-up, maintain pipeline tasks, summarize conversations, route escalations | Commit pricing/terms, send unapproved outreach, accept contracts, or create payment obligations |
| Onboarding and success | 10 | Create account checklist, request integrations, prepare training, track first milestone | Mark onboarding complete without evidence or override safety/compliance exceptions |
| Delivery operations | 40 | Work through freight intelligence, dispatch, trip, documents, closeout, and customer-support pods | Override driver safety judgment or sign/accept external contracts without authorized policy |
| Governance and executive control | 20 | Audit actions, enforce policies, track quality/cost/revenue, pause malfunctioning workflows | Conceal errors, manipulate metrics, or manufacture agent activity |

## Activation Checklist

A real external acquisition loop becomes active only after these prerequisites are complete.

| Prerequisite | Why it matters | Evidence of completion |
| --- | --- | --- |
| Choose one CRM | Provides a durable contact, deal, task, and audit system. | Connected account and mapped PHI stages. |
| Choose one sender and a verified sending identity | Makes consented follow-up deliverable and traceable. | Connected sender, verified domain/address, unsubscribe configuration. |
| Choose one booking path | Makes qualified conversation routing actionable. | Connected calendar or documented self-serve checkout flow. |
| Connect billing only when products and refund policy are final | Converts an opportunity to a customer with a verifiable commercial event. | Live product/price IDs, terms, refund policy, and webhook tests. |
| Set PHI admin secret and production database | Protects staff operations and preserves the customer audit trail. | Server secrets configured, database schema applied, protected endpoints tested. |
| Approve communication policy | Defines audience, source, claims, frequency, human escalation, and opt-out procedures. | Signed/recorded policy in customer operations. |
| Deploy web and API services | Makes the form and lifecycle durable beyond local testing. | Public HTTPS deployment with `PHI_CUSTOMER_API_URL` configured. |

## References

[1]: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business "Federal Trade Commission — CAN-SPAM Act: A Compliance Guide for Business"
[2]: https://www.fcc.gov/document/faqs-one-one-consent-rule-tcpa-prior-express-written-consent "Federal Communications Commission — One-to-One Consent Rule for TCPA Prior Express Written Consent"
