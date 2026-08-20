# PHI Customer Growth Model

**Reference date:** 2026-08-19 MST  
**Purpose:** Translate the PHI product into an accountable, measurable customer-acquisition and delivery journey.  
**Data basis:** Product-tier prices stated in the PHI knowledge base, existing product capabilities, and external market context. No historical PHI funnel, customer, revenue, or advertising data was supplied.

## Ideal Customer Profiles

PHI should begin with two focused, high-intent customer paths rather than one undifferentiated trucking audience. The first path serves drivers moving from CDL or company-driver work into owner-operator status. The second serves active owner-operators and very small fleets that already feel the cost of disconnected freight, dispatch, documents, and compliance work.

| Segment | Trigger | First offer | Qualification outcome | First product milestone |
| --- | --- | --- | --- | --- |
| **Launch-ready operator** | Wants to start but lacks a clear equipment, authority, operating-cost, or workflow plan | Free *Business Readiness & Equipment Path* assessment | Readiness stage, equipment pathway, likely operating start window, and preferred support format | Complete account and launch plan |
| **Active owner-operator** | Has a truck or authority and wants more profitable, organized, or less stressful operations | Free *Dispatch & Profit Diagnostic* | Equipment, lanes, minimum rate, tool stack, top pain point, and service urgency | Configure dispatch policy and connect first approved tool |
| **Small fleet leader** | Has two to ten trucks and needs better visibility, workflow discipline, and fewer manual handoffs | Free *Fleet Operations Snapshot* | Truck count, dispatch process, document workflow, team role, and integration readiness | Create operating workspace and onboard first truck |

Transflo cites ATA data indicating more than 750,000 registered U.S. motor carriers as of April 2023 and that 95.8% operate ten or fewer trucks.[1] This validates PHI’s small-carrier focus but does not constitute a forecast of addressable, reachable, or paying customers. FleetOwner’s report of a Truckstop survey highlights cost pressure and load/routing changes among surveyed owner-operators, which supports messaging around informed, profit-aware operating decisions rather than generic “AI” claims.[2]

## Core Offer Ladder

PHI should sell a visible outcome, not an undefined workforce of agents. The website and future outreach should state what happens in the customer’s first week, what PHI needs from the customer, and what stays under customer control.

| Stage | Offer | Customer receives | Conversion event |
| --- | --- | --- | --- |
| Attract | Free assessment | A tailored readiness, dispatch, or fleet-operations path | Explicit consent and lead submission |
| Qualify | PHI Game Plan | Prioritized next steps, fit explanation, and a recommended product path | Customer reviews plan or books a consultation |
| Activate | 14-day guided activation | Profile, operating policy, document workspace, first integration checklist, and first workflow | Customer starts a paid subscription or explicitly chooses a free/managed path |
| Deliver | Operating milestones | Freight evaluation, dispatch support, trip workflow, documents, and post-delivery closeout | First meaningful customer outcome is recorded |
| Retain | Weekly operating review | Profit signals, exceptions, work completed, blockers, and next actions | Customer renewal, expansion, or advocacy action |

## Revenue Target Model

The target is treated as **monthly recurring subscription revenue**, before refunds, payment processing fees, taxes, discounts, partner commissions, bad debt, churn, support costs, and sales/marketing spend. The selected mix below is an illustrative scale target using the product-tier prices stated in the PHI knowledge base; it is not a projection or an assertion of existing revenue.

| Tier | Price / month | Illustrative active accounts | Monthly recurring revenue |
| --- | ---: | ---: | ---: |
| Solo | $49 | 300 | $14,700 |
| Fleet | $149 | 90 | $13,410 |
| Enterprise | $499 | 12 | $5,988 |
| White-label | $999 | 1 | $999 |
| **Illustrative total** | — | **403** | **$35,097** |

The weighted subscription revenue in this mix is **$87 per active account per month** ($35,097 ÷ 403, rounded to the nearest dollar). Because PHI has not supplied baseline conversion or churn data, the system must report raw counts and observed conversion rates by source rather than assume a particular number of visitors, consultations, or close rates.

## Funnel Events and Ownership

Every customer record should move through a finite, observable lifecycle. The business must distinguish a visitor from a consented lead, a sales-qualified opportunity, a paid customer, an activated operator, and a customer with a verified service milestone.

| Stage | Entry condition | Required event | Owner / automation rule | Exit condition |
| --- | --- | --- | --- | --- |
| Visitor | Lands on a PHI product page | Source and campaign context captured, subject to privacy choices | Website analytics only | Starts assessment or leaves |
| Lead | Submits an assessment with explicit consent | `lead.created` | Acquisition agent acknowledges and scores; no external outreach without allowed channel and consent basis | Ready for follow-up or disqualified |
| Qualified | Meets transparent fit rules | `lead.qualified` | Sales agent creates plan and recommended journey | Consultation, self-serve activation, or nurture |
| Opportunity | Expresses buying intent or begins checkout | `opportunity.opened` | Deal owner schedules next action; price/terms remain customer-approved | Won, lost, or nurture |
| Customer | Authorized payment and account creation complete | `customer.activated` | Onboarding agent starts time-bound checklist | Setup complete or support escalation |
| Operating | Has an activated profile and first operating workflow | `onboarding.completed` | Existing PHI dispatch/transit/delivery workflows apply | Outcome or exception is recorded |
| Outcome | First identified benefit/closeout milestone completes | `service.outcome.recorded` | Customer success agent creates review and retention task | Renewal, expansion, or recovery workflow |

## Operating Options for Real-Channel Activation

| Approach | Tradeoffs | Cost | Setup complexity |
| --- | --- | --- | --- |
| **PHI-owned conversion engine + one connected CRM** | Fastest way to turn website assessments into an accountable pipeline. The CRM handles contacts, deal stages, and reminders; the website/PHI backend owns qualification and onboarding. Initial outbound volume is lower until a sender/calendar is connected. | Software-account costs vary by provider; no ad spend is required to begin. | Moderate: choose one CRM, connect it, set the PHI stages, and approve sender/calendar policies. |
| **Full multi-channel growth engine** | Adds prospect research, approved email nurture, appointment scheduling, billing, and analytics. It can create a stronger growth loop but requires more integrations, deliverability controls, tracking, and ongoing commercial governance. | Provider costs plus any paid-media budget; cannot be estimated without chosen providers and budget. | Higher: connect CRM, sender, calendar, billing, and one acquisition source; approve the policies before activation. |

No channel is selected automatically. A PHI operator must choose the account to connect for CRM, sender, calendar, and billing, and must approve any public outreach or advertising before it is sent or published.

## Customer Promise and Safeguards

> “PHI gives owner-operators a clear business-launch or dispatch path, explains the next move, and helps keep the operating workflow organized. You keep control of your business rules and binding decisions.”

PHI must not promise specific earnings, load availability, legal compliance, insurance approval, equipment financing, contract acceptance, or automatic booking results. The customer remains responsible for regulated, contractual, safety, financial, and driving decisions.

## References

[1]: https://www.transflo.com/blog/how-transportation-software-benefits-small-to-midsize-carriers/ "Transflo — How Transportation Software Benefits Small-to-Midsize Carriers"
[2]: https://www.fleetowner.com/for-the-driver/article/21264117/owner-operators-express-their-most-common-pain-points "FleetOwner — Owner-operators express their most common pain points"
