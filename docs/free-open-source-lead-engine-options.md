# PHI Free and Open-Source Lead Engine Options

**Decision context:** PHI needs a durable inbound engine for consented assessments, lead qualification, sales stages, appointment routing, customer onboarding, and reporting—without relying on a paid CRM trial. “Free” can mean either no additional software subscription or open-source software that the business hosts itself. Neither definition eliminates the need for a reliable website, a verified sending identity, and secure data storage.

## Comparison

| Approach | What it includes | Strengths | Tradeoffs | Direct software cost |
| --- | --- | --- | --- | --- |
| **PHI Native + free connected tools** | Existing PHI assessment, database, lifecycle API, and dashboard extensions, with a connected free email/calendar account for approved follow-up and booking. | Fastest launch, no CRM subscription, one codebase, and PHI owns the customer lifecycle data. | Requires a secure deployment of the PHI backend and a small custom operations dashboard; email/calendar still need user authorization. | No additional CRM software cost. |
| **Self-hosted EspoCRM + PHI** | EspoCRM holds contacts, accounts, leads, opportunities, and sales activity; PHI sends approved events to it by REST API and receives signed webhooks. | Mature free CRM surface, role-scoped API access, custom fields, sales pipeline, and webhook support. | Needs an always-on server with Docker and a database, routine security updates, backups, HTTPS, and an email sender configuration. | Open-source software; hosting/domain/email infrastructure are separate. |
| **Self-hosted EspoCRM + Mautic + Cal.com + PHI** | Adds campaign automation (Mautic) and appointment scheduling (Cal.com) around the CRM and PHI’s lead intelligence. | Most complete no-license-fee replacement for a paid all-in-one sales platform. | Highest operating complexity: multiple applications, Docker services, databases, a scheduler for Mautic campaign work, backup monitoring, and sender-domain setup. | Open-source software; persistent hosting and email delivery remain separate. |

## Verified Capability Fit

EspoCRM exposes a REST API for its UI-level operations and supports scoped API users, allowing PHI to create and update lead records without giving an integration unrestricted administrator access.[1] Its webhooks can notify an external system of create/update events and provide a signature mechanism to validate the sender, allowing PHI’s operational record to remain synchronized without continuous polling.[2]

Mautic is a free and open-source marketing-automation platform and can send real-time or queued webhooks for contact activity. However, its campaigns, contact updates, and email processing require scheduled server jobs, so it is not a zero-maintenance service simply because the software license is free.[3] Cal.com can emit signed booking and routing events, including booking creation, reschedules, cancellation, no-shows, and form submissions, which makes it appropriate for a self-hosted consultation handoff.[4]

> **Recommendation:** Start with the **PHI Native + free connected tools** approach. It uses the working lead-capture and lifecycle system already built in PHI, eliminates a new CRM subscription, and lets the business prove demand before taking on the operations burden of a multi-application self-hosted stack. Add self-hosted EspoCRM once PHI needs a separate sales workspace, multiple commercial users, or richer opportunity reporting. Add Mautic and self-hosted Cal.com only after the funnel is producing enough leads to justify campaign and scheduling operations.

## Minimum Free Inbound Architecture

| Layer | Initial free implementation | What PHI automates | Human-control boundary |
| --- | --- | --- | --- |
| Website conversion | PHI assessment form and guided business/dispatch plan | Captures consent, source, prospect path, equipment context, and top challenge. | No form can accept contracts, grant financing, or claim a revenue outcome. |
| Lead record | Existing PHI customer lifecycle tables and event ledger | Scores the assessment, assigns a recommended offer, deduplicates email records, and creates an audit trail. | Commercial stage changes remain protected by PHI admin policy. |
| Follow-up | Connected business email only after user authorization | Prepares the tailored welcome and next-step message for consented leads; records send outcome and opt-out. | No bulk outreach, SMS, pricing commitment, or contract acceptance without a written policy and authorized sender. |
| Booking | Connected calendar or a self-hosted booking page | Creates a qualified-consultation handoff and records booking/cancellation outcomes. | Availability, host, and meeting terms are controlled by the business owner. |
| Measurement | PHI dashboard plus daily/weekly internal reports | Tracks source, lead, qualified lead, booking, opportunity, won customer, and activation milestones. | Revenue is reported from verified payments, not projections or agent estimates. |

## What Is Still Required

A free system does not mean an unattended system with no business inputs at all. PHI still needs a domain-backed business email identity, a physical business mailing address for commercial-email disclosures, an approved follow-up/opt-out policy, a secure production deployment, and a human-approved terms-and-pricing policy. If PHI later uses a self-hosted CRM, it also needs a reliable always-on machine or managed server, scheduled backups, software patches, and an email-delivery configuration.

## References

[1]: https://docs.espocrm.com/development/api/ "EspoCRM Documentation — API Overview"
[2]: https://docs.espocrm.com/administration/webhooks/ "EspoCRM Documentation — Webhooks"
[3]: https://devdocs.mautic.org/en/5.x/webhooks/getting_started.html "Mautic Developer Documentation — Getting Started with Webhooks"
[4]: https://cal.com/docs/developing/guides/automation/webhooks "Cal.com Documentation — Webhooks"
[5]: https://docs.mautic.org/en/7.1/configuration/cron_jobs.html "Mautic Documentation — Cron Jobs"
[6]: https://docs.espocrm.com/administration/docker/installation/ "EspoCRM Documentation — Installation with Docker"
