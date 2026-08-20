# Prince Haul Intelligence — Google Play Listing and App Content Worksheet

> **Release-preparation worksheet — complete all “Owner confirmation” fields before submission.** This file converts the implemented release candidate into a Play Console-ready checklist. Google Play requires a title of 30 characters or fewer, a short description of 80 characters or fewer, and an accurate full description.[1]

## 1. Listing Identity and Copy

The requested listing title, “Prince Hall Intelligence: Trucking & Business Hub,” exceeds Google Play’s 30-character title limit. The current Android application name and repository use **Prince Haul Intelligence**, so this worksheet preserves that product name to avoid a mismatch. If “Prince Hall” is the intended final legal brand, change the app display name, all artwork, support addresses, legal documents, and listing copy together before building the production bundle.

| Play Console field | Proposed value | Owner confirmation |
|---|---|---|
| App title | **Prince Haul Intelligence** | Confirm the final brand spelling. |
| Short description | **Plan authority, loads, cash flow, and support for your trucking business.** | Confirm. |
| Full description | See the approved draft below. | Review for accuracy before publishing. |
| App or game | App | Confirm. |
| Suggested category | Business | Confirm; Google Play category selection is the developer’s responsibility. |
| Contact email | `[SUPPORT EMAIL TO BE CONFIRMED]` | Required. |
| Privacy policy URL | `[PUBLIC HTTPS PRIVACY POLICY URL TO BE CONFIRMED]` | Required before production submission. |
| Terms URL | `[PUBLIC HTTPS TERMS URL TO BE CONFIRMED]` | Recommended; use the same final domain. |

### Full Description Draft

Prince Haul Intelligence helps new and independent owner-operators organize the business side of trucking from one practical workspace.

Use the Business Blueprint to work through early independent-carrier setup steps, including operating-plan organization, business basics, federal-registration research, authority activation checks, safety foundations, and launch operations. The checklist links drivers to official resources and makes clear that requirements depend on the operation, cargo, and jurisdiction.

Use the Independent Dispatch Hub to set your minimum all-in rate per mile, deadhead limit, and fuel-cost assumptions before you plan a load. Review full-trip profitability and a pre-booking verification routine before you accept freight.

Use Cash Flow & Factoring to track invoice timing, protected fuel and maintenance reserves, and the estimated tradeoffs among standard pay, quick pay, and factoring. The calculator is for planning; it does not verify a broker, payment term, factoring provider, or tax treatment.

Driver’s Circle is built for practical peer support. Ask general questions, explore mentoring and team-driving interest, and use safety reminders designed to discourage sharing sensitive business information, exact live location, or unverified freight details.

Prince Haul Intelligence is an operational planning tool. It is not a carrier authority service, freight broker, lender, insurer, legal adviser, tax adviser, or safety consultant. Always verify broker identity, freight terms, government filings, insurance, authority status, and payment arrangements directly with the appropriate provider or qualified professional.

## 2. Store Asset Package

| Asset | Status | File or action | Play requirement / release note |
|---|---|---|---|
| Store icon | Pending final export | Re-export the approved launcher icon as a 512×512 32-bit PNG with alpha. | Required. [2] |
| Feature graphic | Prepared | `docs/store-assets/play-feature-graphic-1024x500.jpg` | 1024×500 JPEG, no alpha. [2] |
| Dashboard capture | Preview candidate only | `docs/store-assets/dashboard-preview.webp` | Re-capture from a 1080×1920 Android device/emulator as PNG or JPEG. |
| Business Blueprint capture | Preview candidate only | `docs/store-assets/business-blueprint-preview.webp` | Re-capture from a 1080×1920 Android device/emulator as PNG or JPEG. |
| Driver’s Circle capture | Preview candidate only | `docs/store-assets/drivers-circle-preview.webp` | Re-capture from a 1080×1920 Android device/emulator as PNG or JPEG. |
| Cash Flow capture | Preview candidate only | `docs/store-assets/cash-flow-preview.webp` | Re-capture from a 1080×1920 Android device/emulator as PNG or JPEG. |

The four preview captures accurately show the implemented screens but are WebP files at browser-preview dimensions, so they are **not final upload assets**. Google Play requires at least two screenshots; four 1080px-or-larger screenshots are recommended for broader promotional eligibility.[2] Capture the final approved Android build without browser/debug overlays or sample tester data before upload.

Suggested screenshot order and alt text:

| Order | Screen | Proposed alt text (under 140 characters) |
|---|---|---|
| 1 | Dashboard | PHI dashboard with shortcuts for business setup, peer support, dispatch, cash flow, and earnings. |
| 2 | Business Blueprint | Business Blueprint checklist for carrier setup, authority research, safety preparation, and launch steps. |
| 3 | Independent Dispatch Hub | Dispatch Hub where drivers set rate-per-mile, deadhead, and fuel targets before planning a load. |
| 4 | Cash Flow & Factoring | Cash Flow screen for invoice timing, fuel and maintenance reserves, and factoring scenarios. |
| 5 | Driver’s Circle | Driver’s Circle community preview with safety guidance, topic filters, and mentorship interest controls. |

## 3. App Content Worksheet

| Play Console declaration | Release-candidate answer | Owner confirmation required before submission |
|---|---|---|
| Privacy policy | Provide the public HTTPS link to the attorney-approved policy. The app includes a Privacy Center entry point. | Confirm final URL and legal approval. |
| Ads | **No**, only if advertising remains disabled and no production ad SDK is initialized. | Confirm with release owner. If any banner, native, interstitial, rewarded, or third-party ad appears, answer **Yes**. |
| App access / sign-in details | The tested preview completes onboarding without a reviewer login. | Confirm this remains true for the uploaded bundle. If any feature is gated, add working reviewer credentials and precise steps. |
| Target audience | Intended for adult commercial-trucking professionals; do not target children. | Confirm chosen age groups in Console. |
| Content rating | Complete the IARC questionnaire based on the final bundle. | Complete in Play Console. |
| Data safety | Draft analysis below; submit only after owner verifies every enabled SDK, server endpoint, and data flow. | Required for closed, open, and production tracks. |
| Sensitive permissions | The release candidate requests foreground precise/approximate location and camera. It blocks contacts, call log, background location, foreground-service, boot, and microphone permissions. | Verify the submitted AAB manifest and complete any Console prompt truthfully. |
| Financial features | The app contains planning calculations but does not present itself as a lender, broker, insurer, or investment product. | Confirm no new regulated feature is enabled. |

## 4. Data Safety Pre-Submission Audit

Google requires developers to declare both their own and third-party SDK data handling accurately. The form is required for closed, open, and production releases, even if the app collects no data; an internal-test-only app is exempt.[3]

The implemented rookie-owner-operator features store their current test records locally on-device. Their current behavior is not, by itself, a basis to claim that the entire app collects no data. The final declaration must include every enabled feature and SDK in the actual AAB.

| Data type or practice | Candidate status in this release | Required pre-submission verification |
|---|---|---|
| Approximate / precise location | Requested for user-initiated route, deadhead, nearby-load, and HOS features. | Determine whether any enabled code or SDK transmits location off device, the purpose, and whether it is encrypted in transit. |
| Camera / documents | Requested for user-initiated document scanning. | Determine whether documents or images remain only on device or upload to a server or third party. |
| Driver’s Circle posts and reports | Local testing preview only; no live community service is connected for the new feature. | If a hosted feed is enabled, disclose user-generated content and any identifiers, moderation records, and sharing. |
| Invoice and business-planning data | New Cash Flow and Dispatch Hub state is local in this candidate. | Verify whether any account sync, backup, analytics, support, or financial integration receives it. |
| Device identifiers, diagnostics, analytics | Sentry/Firebase configuration values are blank in this candidate. | If crash reporting or analytics is enabled, obtain the SDK disclosure and include every applicable data type and purpose. |
| Ads | AdMob configuration values are blank in this candidate. | If ads are enabled, disclose ad-related data collection/sharing and answer “Contains ads” accurately. |
| Purchases and subscriptions | Payment/subscription code exists but no production release credential is configured in this candidate. | If monetization is enabled, verify data handling by the applicable store/payment SDK. |

## 5. Test and Production Path

1. Create the app in Play Console with package name **`com.princehaulintelligence.app`**. Package names are unique and permanent.[4]
2. Upload the signed AAB to **Internal testing** and invite the first quality-assurance group. Internal testing supports up to 100 testers.[5]
3. Complete functional testing on Android phones and tablets. Use the Play pre-launch report and resolve all crash, login, policy, and permission findings.
4. Complete the App content declarations, store listing, privacy-policy URL, Data safety form, content rating, support contact, and reviewer access instructions.
5. If the developer account is a personal account created after November 13, 2023, run a **closed test with at least 12 testers continuously opted in for 14 days** before applying for production access.[6]
6. Submit the completed release for review only after the required testing path and every declaration is accurate.

## References

[1]: https://support.google.com/googleplay/android-developer/answer/13393723?hl=en "Google Play Console Help: Best practices for your store listing"
[2]: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en "Google Play Console Help: Add preview assets to showcase your app"
[3]: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en "Google Play Console Help: Provide information for Google Play's Data safety section"
[4]: https://support.google.com/googleplay/android-developer/answer/9859152?hl=en "Google Play Console Help: Create and set up your app"
[5]: https://support.google.com/googleplay/android-developer/answer/9845334?hl=en "Google Play Console Help: Set up an open, closed, or internal test"
[6]: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en "Google Play Console Help: App testing requirements for new personal developer accounts"
