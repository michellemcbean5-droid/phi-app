# PHI Unified Platform Architecture

**Status:** Implementation blueprint  
**Prepared:** 2026-08-19  
**Product name:** Prince Haul Intelligence (PHI)

## Product Position

PHI is a single platform that takes a customer from **new CDL holder** to **operating a profitable owner-operator or small-fleet business**. It combines the first shared project’s launch journey with the second shared project’s automated dispatch proposition. The platform is not a new load board, ELD, insurer, factoring company, or legal/compliance service. It orchestrates customer-authorized tools and data through a driver-first operating system.

The front door must branch immediately into two journeys:

| Journey | Customer | Primary promise | First conversion |
| --- | --- | --- | --- |
| **Launch My Trucking Business** | New CDL holder or aspiring owner-operator | Build a launch plan, choose an equipment route, complete business readiness, then run dispatch from one place. | Free business-readiness assessment |
| **Automate My Dispatch** | Existing owner-operator, dispatcher, or fleet owner | Score freight, coordinate dispatch, manage documents, and keep the business moving with AI assistance. | Free operations assessment |

## Unified Customer Lifecycle

| Stage | Customer outcome | Website product module | Current repository support |
| --- | --- | --- | --- |
| 1. Discover | Understand the right starting path | Persona selector and plain-English assessment | New web implementation |
| 2. Launch plan | Know the sequence to operate legally and economically | Business Launch Roadmap, authority/readiness checklist, milestone tracker | New web implementation; official registration links only |
| 3. Equipment | Compare rent, lease, and buy pathways without forced recommendations | Equipment Pathway Hub and partner disclosure pattern | Mobile equipment marketplace provides a starting reference |
| 4. Connect | Bring approved accounts and operational data into PHI | Integration hub for load boards, ELDs, communication, billing, and accounting | API keys screen and connector abstractions exist, but production credentials are pending |
| 5. Dispatch | Find, evaluate, negotiate, and schedule the next best load | Load command center, profit/risk explainer, decision controls | Backend exposes acquisition, transit, and post-delivery workflows |
| 6. Run | Move freight with visibility and fewer manual calls | Route/fuel plan, milestones, compliance alerts, document glovebox | Mobile app has route, fuel, documents, compliance, messages, and truck-stop modules |
| 7. Close | Turn proof of delivery into a clean financial record | One-Tap Payday closeout, invoice packet, earnings view | Backend post-delivery workflow and mobile document module |
| 8. Grow | Improve profit, marketing, and fleet readiness | CEO workspace, agent roster, performance scorecard | Agent registry and mobile command center exist; production worker controls must be added |

## Hands-Off Mode: Safe Operating Model

The site will frame autonomy as **configurable automation**, not as an unbounded promise. The customer selects a control level and can change it per truck and workflow.

| Control level | PHI may do automatically | Required customer policy / approval |
| --- | --- | --- |
| **Assist** | Analyze, rank, draft messages, create checklists, prepare documents, send non-binding alerts. | Customer makes all binding decisions. |
| **Supervised** | Send approved template updates, build dispatch plans, request clarification, and queue actions. | Customer approves every booking, financial, contract, and critical safety action. |
| **Policy-controlled** | Execute a pre-authorized workflow only inside explicit customer thresholds, audit logs, connector permissions, and reversible actions. | Customer sets rate floor, lane/equipment rules, accessorial limits, broker allow/block rules, and escalation contacts. Binding external actions must remain provider-policy compliant. |

> **Compliance and safety boundary:** PHI can monitor data, surface missing records, and prepare filings or documents. It must not represent itself as a legal or tax professional, certify regulatory compliance, override a driver’s safety judgment, or autonomously resolve a crash, medical emergency, fraud signal, or contractual dispute.

## 100-Agent Workforce Design

The requested workforce is a logical operating model, not 100 unsupervised browser bots. It consists of 10 domain pods of 10 narrowly scoped agents, each run through a queue with budgets, tool permissions, audit logs, quality checks, and human exception routing.

| Pod | Agent count | Mission | Autonomy limit |
| --- | ---: | --- | --- |
| Customer acquisition | 10 | Lead qualification, education, lifecycle messaging, attribution | No deceptive outreach; no unsolicited account actions |
| Launch concierge | 10 | Readiness assessment, checklist routing, education, equipment-pathway intake | No legal, insurance, credit, or equipment purchase decision |
| Freight intelligence | 10 | Load ingestion, scoring, lane analysis, broker context, rate research | No booking beyond customer policy and provider permission |
| Dispatch execution | 10 | Dispatch plans, appointment coordination, status updates, exception triage | No external contract acceptance without authorized workflow |
| Trip optimization | 10 | Routing, fuel, parking, weather and dwell-time planning | Driver retains final safety decision |
| Documents and cash flow | 10 | OCR prep, document classification, invoice-packet preparation, expense categorization | No transfer of funds or tax filing |
| Safety and compliance | 10 | Deadline monitoring, HOS/ELD event interpretation, inspection readiness, maintenance flags | Escalate all violations and safety incidents |
| Customer support | 10 | 24/7 first response, self-service resolution, knowledge retrieval, ticket routing | Escalate sensitive, legal, billing, and safety issues |
| Growth partnerships | 10 | Affiliate tracking, partner referrals, content briefing, CRM hygiene | No publishing, purchase, or partner commitment without approval |
| Executive control | 10 | KPI monitoring, quality assurance, cost control, agent governance, incident response | May pause automation; cannot hide failures or create fake activity |

Every agent action must carry a **customer/account scope**, **intent**, **source data reference**, **policy decision**, **confidence score**, **idempotency key**, and **audit event**. The UI will show the workforce as an operational map rather than implying that all 100 agents are live or autonomous before external integrations are connected.

## Technical Implementation Route

The existing repository uses Next.js for the public web app, FastAPI/CrewAI for agent workflows, and Expo for the mobile app. The website merge should retain this repository and add a unified Next.js experience, using the FastAPI API as its operations boundary.

| Component | Implementation now | Production hardening before autonomous actions |
| --- | --- | --- |
| Public website | Unified responsive landing page and conversion paths | SEO metadata, analytics consent, accessible forms, abuse prevention |
| Customer onboarding | Client-side interactive readiness/dispatch assessment | Authenticated profile, durable database, consent record, role-based access |
| Dispatch workflows | Existing FastAPI async workflows; labelled as connectable product modules | Persistent job queue, idempotent action ledger, broker/load-board contracts, retry and replay controls |
| ELD triggers | Connector cards and event-driven design | Customer-authorized provider apps, OAuth/token vault, signed-webhook validation, replay protection |
| Agent workforce | Agent pod registry and governance model | Queue, policy engine, tool-scoped credentials, observability, cost guardrails, incident playbooks |
| Revenue tracking | A transparent target model and progress reporting | Stripe-linked recognized revenue, churn/refund handling, accounting reconciliation |

## $35,000 Monthly Revenue Target: Transparent Scenario

The following is a **product revenue planning scenario**, not a forecast or guarantee. It uses the PHI subscription tiers in the knowledge base and excludes partner referral revenue, one-time service fees, refunds, payment processing costs, churn, discounts, sales tax, and direct costs.

| Plan | Monthly price | Illustrative active accounts | Monthly recurring revenue |
| --- | ---: | ---: | ---: |
| Solo | $49 | 300 | $14,700 |
| Fleet | $149 | 100 | $14,900 |
| Enterprise | $499 | 10 | $4,990 |
| White-label | $999 | 1 | $999 |
| **Total** | — | **411** | **$35,589** |

This scenario demonstrates the scale of a subscription mix that exceeds the target; it is not a claim about current customers or an expected result. The revenue dashboard must display actual recognized revenue separately from target progress.

## Competition-Driven Priorities

Numeo demonstrates the importance of supervised AI search, transparent market context, cross-board workflows, and a clear status model. Truckbase demonstrates that small carriers expect document capture, dispatch scheduling, communication, ELD/GPS connections, and customer visibility. DAT and 123Loadboard establish the baseline for rate, broker-credit, route, fuel, parking, backhaul, and factoring support. PHI differentiates by joining these operating capabilities to a structured **business-launch journey** and explainable automation controls.[1] [2] [3] [4]

## References

[1]: https://numeo.ai/ "Numeo — AI Dispatch Platform"
[2]: https://www.truckbase.com/trucking-dispatch-software "Truckbase — Trucking Dispatch Software"
[3]: https://www.dat.com/load-boards "DAT — Load Boards"
[4]: https://www.123loadboard.com/ "123Loadboard — Carrier Load Board"
[5]: https://www.fmcsa.dot.gov/registration/getting-started "FMCSA — Getting Started with Registration"
[6]: https://developers.samsara.com/docs/webhooks "Samsara Developers — What are Webhooks?"
[7]: https://developer.gomotive.com/ "Motive Developer Portal — Open API"

## Implementation Validation

The unified website was visually tested locally on 2026-08-19. The desktop experience renders the two-path hero, integrated command-center visual, customer planning controls, equipment pathway hub, dispatch control model, workforce expansion control, document-closeout story, and final conversion paths. The first-time operator call-to-action correctly scrolls the visitor to the personalized planning section. The web project passes `npm run lint`, `npm run typecheck`, and `npm run build` after isolating the root web TypeScript scope from the separately managed Expo mobile workspace.

The interactive planning flow was also verified locally. Switching to **Policy-controlled mode** updates the hero command center, the recommended-start description, and the dispatch-control explanation. Selecting **Build my plan** renders the tailored first-30-days roadmap. This confirms the website behaves as a unified customer journey rather than a static marketing page.
