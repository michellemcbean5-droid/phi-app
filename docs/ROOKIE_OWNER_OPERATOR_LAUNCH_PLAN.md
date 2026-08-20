# Prince Hall Intelligence: Rookie Owner-Operator Launch Plan

**Purpose.** This execution plan turns Prince Hall Intelligence into a practical first-six-month operating companion for newly independent CDL holders. It scopes the work into **five phases with fifteen tasks each**. The in-app authority guide will provide educational workflow support and authoritative links; it will not replace legal, tax, insurance, or regulatory advice. Federal authority requirements depend on the carrier’s operation, cargo, and business classification, and FMCSA directs applicants to use its registration process and maintain current registration information.[1] [2]

| Phase | Outcome | Task count |
|---|---|---:|
| 1 | Audited scope and implementation foundation | 15 |
| 2 | Business Blueprint and Driver’s Circle | 15 |
| 3 | Independent Dispatch Hub and Cash Flow tools | 15 |
| 4 | Privacy, quality, and Android release candidate | 15 |
| 5 | Google Play listing and final handoff | 15 |

## Phase 1 — Audit and Foundation

| # | Task | Completion evidence |
|---:|---|---|
| 1.1 | Clone the selected `michellemcbean5-droid/phi-app` repository. | Local `main` branch is present and clean. |
| 1.2 | Inventory the web, backend, and Expo mobile layers. | Architecture and entry points are documented. |
| 1.3 | Review mobile navigation, dashboards, stores, and feature modules. | Extension points are identified without duplicate flows. |
| 1.4 | Inspect backend routes and data models. | Existing dispatch and financial models are mapped. |
| 1.5 | Review Android, Expo, and EAS configuration. | Current package ID, permissions, and build profiles are recorded. |
| 1.6 | Install mobile dependencies from the lockfile. | Reproducible local dependency installation succeeds. |
| 1.7 | Run the baseline mobile type check. | TypeScript reports no errors. |
| 1.8 | Run the baseline mobile test suite. | Existing unit tests pass before changes. |
| 1.9 | Record known dependency and security findings. | Release-risk register includes unresolved audit findings. |
| 1.10 | Research official FMCSA registration and New Entrant resources. | Guide content is linked to source-of-truth material. |
| 1.11 | Define the rookie-driver feature information architecture. | Blueprint, Circle, Dispatch, and Cash Flow paths are specified. |
| 1.12 | Define the mobile data contracts and persisted client state. | Strongly typed store interfaces are ready for implementation. |
| 1.13 | Define user-facing safety and anti-scam rules. | Reporting, disclosure, and external-link handling are designed. |
| 1.14 | Create the five-phase, 75-task launch backlog. | This document is committed to the repository. |
| 1.15 | Establish acceptance criteria for test and release readiness. | Validation matrix covers core functionality and release assets. |

## Phase 2 — Business Blueprint and Driver’s Circle

| # | Task | Completion evidence |
|---:|---|---|
| 2.1 | Create a persistent Business Blueprint store. | Progress survives an app restart. |
| 2.2 | Model milestones from readiness through active authority and launch operations. | Each milestone has a clear status and owner action. |
| 2.3 | Add EIN and company-formation preparation guidance. | Educational steps include an official external-resource handoff. |
| 2.4 | Add USDOT and operating-authority decision guidance. | Content explains that requirements vary by operation. |
| 2.5 | Add insurance, BOC-3, and activation readiness placeholders. | Sensitive details are not collected or claimed as verified. |
| 2.6 | Add New Entrant safety and records preparation. | The initial 18-month monitoring period and safety-audit readiness are surfaced.[3] |
| 2.7 | Build a guided Blueprint screen with progress scoring. | Driver can check, uncheck, and review every step. |
| 2.8 | Add milestone filtering and “next best step” logic. | Incomplete required work is prioritized in the UI. |
| 2.9 | Add official resource links with educational disclaimers. | Links are routed through user-initiated external actions. |
| 2.10 | Create a persistent Driver’s Circle community store. | Posts, replies, reactions, and reports are locally retained. |
| 2.11 | Build a community feed with topic and mentorship filters. | Driver can browse authority, dispatch, cash-flow, and road-condition topics. |
| 2.12 | Build a post composer and safe reply flow. | Users can share a question without publishing protected credentials. |
| 2.13 | Add mentorship and team-driving discovery cards. | Drivers can declare interest without exposing phone or location by default. |
| 2.14 | Add reporting, block-list, and scam-warning actions. | Harmful content has a clear user-facing mitigation path. |
| 2.15 | Add navigation and dashboard entry points for the Blueprint and Circle. | The launch features are reachable within one tap from the dashboard. |

## Phase 3 — Dispatch, Earnings, and Cash Flow

| # | Task | Completion evidence |
|---:|---|---|
| 3.1 | Create a persistent dispatch-preferences store. | Minimum RPM, maximum deadhead, and fuel assumptions are retained. |
| 3.2 | Create a dispatch planning store for selected opportunities. | Drivers can save or remove a load plan. |
| 3.3 | Calculate loaded RPM, all-in RPM, and estimated net after fuel. | Formulas have unit coverage. |
| 3.4 | Calculate deadhead percentage and highlight excessive repositioning. | Dispatch risk is visible before a booking decision. |
| 3.5 | Add broker-check prompts and anti-fraud verification reminders. | The app avoids representing unverified brokers as safe. |
| 3.6 | Build the Independent Dispatch Hub summary screen. | Drivers can see saved opportunities and decision metrics. |
| 3.7 | Add a configurable pre-booking checklist. | Bookings require the driver to acknowledge key checks. |
| 3.8 | Add workflow links from existing load cards to the Dispatch Hub. | The hub augments rather than replaces load sourcing. |
| 3.9 | Add unit tests for profit, deadhead, and minimum-rate formulas. | Normal and edge cases pass. |
| 3.10 | Create a persistent cash-flow ledger store. | Invoices, reserves, and operating balances persist. |
| 3.11 | Add invoice aging and expected-payment-date tracking. | Drivers can see 30–45-day timing scenarios. |
| 3.12 | Build a factoring versus standard-pay scenario calculator. | Fee, advance, retained amount, and timing are transparent. |
| 3.13 | Add maintenance and fuel reserve planning. | Cash allocation is separated from gross revenue. |
| 3.14 | Build the Cash Flow screen and integrate it with earnings. | Drivers can add an invoice and inspect forecasted liquidity. |
| 3.15 | Add contextual financial-risk alerts and educational quick-pay guidance. | Alerts are explanatory, not financial recommendations. |

## Phase 4 — Privacy, Quality, and Android Release Candidate

| # | Task | Completion evidence |
|---:|---|---|
| 4.1 | Add a privacy center that explains feature-level data handling. | Users can open privacy and terms links in-app. |
| 4.2 | Replace placeholder public policy URLs with configurable production URLs. | Release configuration rejects placeholder URLs. |
| 4.3 | Review Android permissions against implemented functionality. | Unnecessary permissions are removed or release-blocked. |
| 4.4 | Add visible location, community, and financial-data disclosures. | Consent is understandable before optional feature use. |
| 4.5 | Remove hard-coded identity and demo-only user claims from launch paths. | Generic driver-facing workflows are retained. |
| 4.6 | Add empty, loading, and error states to new launch screens. | UI does not silently fail. |
| 4.7 | Improve offline persistence and recovery behavior. | Core planning data survives transient connectivity loss. |
| 4.8 | Add accessibility labels and adequate touch targets. | Core flows are assistive-technology navigable. |
| 4.9 | Run mobile unit tests after feature implementation. | New and existing tests pass. |
| 4.10 | Run a strict TypeScript check. | Release code has no type errors. |
| 4.11 | Run Expo configuration validation. | Android configuration resolves without invalid fields. |
| 4.12 | Validate Android app metadata, version, package, and signing prerequisites. | Release settings are documented and coherent. |
| 4.13 | Generate a local Android release-readiness report. | Build and testing prerequisites are explicit. |
| 4.14 | Produce an internal-distribution Android build when release credentials are available. | A testable APK or internal-track artifact is generated. |
| 4.15 | Perform device smoke tests for the dashboard, blueprint, Circle, dispatch, and cash flow. | Test record identifies tested flows and outstanding limits. |

## Phase 5 — Google Play Store Preparation and Handoff

| # | Task | Completion evidence |
|---:|---|---|
| 5.1 | Verify current Google Play policy requirements from official sources. | Store checklist references current policy documentation. |
| 5.2 | Prepare a public Privacy Policy draft for legal review and hosting. | Draft accurately reflects implemented data handling. |
| 5.3 | Prepare Terms of Use draft for legal review and hosting. | Community, content, and liability rules are represented. |
| 5.4 | Produce Play Store title and short description. | Copy fits Google Play field constraints. |
| 5.5 | Produce long description and feature highlights. | Claims are accurate and not misleading. |
| 5.6 | Prepare a content-rating response worksheet. | Answers are ready for console entry, pending owner confirmation. |
| 5.7 | Prepare a Data safety declaration worksheet. | Data collection, sharing, encryption, and deletion items are traceable. |
| 5.8 | Prepare an app-access worksheet for reviewer login needs. | Reviewers receive a viable test path. |
| 5.9 | Prepare a target-audience and ads declaration worksheet. | Audience and monetization are explicitly selected. |
| 5.10 | Capture or generate compliant phone screenshots of key app flows. | Dashboard, community, dispatch, and cash-flow visuals are ready. |
| 5.11 | Verify high-resolution icon, feature graphic, and screenshot dimensions. | Assets meet the chosen store-listing requirements. |
| 5.12 | Review the production `.aab` generation and upload procedure. | Owner actions and credential boundaries are explicit. |
| 5.13 | Create an internal-testing release checklist. | First testers can install and provide structured feedback. |
| 5.14 | Create a production-submission checklist. | Console forms and release gates are accounted for. |
| 5.15 | Commit work, package test instructions, and hand off the release bundle. | Repository branch, commit, artifacts, and known limitations are delivered. |

## Acceptance Criteria

The implementation is ready for internal Android testing when the Blueprint, Driver’s Circle, Dispatch Hub, Cash Flow tools, privacy center, navigation, and supporting unit tests are complete; TypeScript and test checks pass; app configuration validates; and all production URLs and signing credentials are identified. A Google Play production submission remains an account-holder action because the developer account, payment, identity verification, signing, and console declarations require the owner’s authenticated confirmation.

## References

[1]: https://www.fmcsa.dot.gov/registration/getting-started "FMCSA: Getting Started with Registration"
[2]: https://www.fmcsa.dot.gov/registration/get-mc-number-authority-operate "FMCSA: Get Operating Authority (Docket Number)"
[3]: https://www.fmcsa.dot.gov/safety/new-entrant-safety-assurance-program "FMCSA: New Entrant Safety Assurance Program"
