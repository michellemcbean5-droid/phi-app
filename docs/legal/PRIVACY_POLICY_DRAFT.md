# Prince Haul Intelligence Privacy Policy

> **Draft — legal review required before publication.** This working draft is based on the application behavior implemented in the release candidate dated August 20, 2026. It is not legal advice. A qualified attorney must review it, confirm the business contact details, and approve it before it is hosted at the public HTTPS URL used in the app and Google Play listing.

**Effective date:** [TO BE CONFIRMED]  
**Operator:** Prince Haul Intelligence / [LEGAL ENTITY TO BE CONFIRMED]  
**Privacy contact:** [PRIVACY CONTACT EMAIL TO BE CONFIRMED]

Prince Haul Intelligence (“**PHI**,” “**we**,” “**us**,” or “**our**”) provides tools intended to help owner-operators organize independent-carrier setup tasks, review load-planning metrics, track invoices and reserves, and use optional operational features. This Privacy Policy explains how the PHI mobile application handles information.

## 1. Summary of Current Release Behavior

The current release candidate keeps the new **Business Blueprint**, **Driver’s Circle testing preview**, **Independent Dispatch Hub**, and **Cash Flow & Factoring** planning records on the device using local application storage. The current release candidate does not transmit those new feature records to a PHI community server, financial institution, factoring provider, broker, or shipper.

| Feature | Information handled | Current handling |
|---|---|---|
| Business Blueprint | Completion state for business and authority preparation steps | Stored locally on the device. |
| Driver’s Circle testing preview | Locally created posts, replies, reported-post markers, and blocked names | Stored locally on the device. No live public community server is connected in this release candidate. |
| Independent Dispatch Hub | Saved load-plan details, RPM/deadhead/fuel assumptions, and verification check state | Stored locally on the device. |
| Cash Flow & Factoring | Reserve targets, broker/shipper names entered by the user, invoice numbers, invoice amounts, payment method, payment timing, and fee assumptions | Stored locally on the device for planning. PHI does not verify payment, credit, or factoring terms. |
| Virtual Glovebox | Documents the user chooses to scan using the camera | Stored on the device in the app’s document workflow unless and until the user chooses a separately disclosed upload or sharing function. |

## 2. Device Permissions

PHI requests permissions only when a corresponding feature is used.

| Permission or feature | Why PHI uses it | User choice |
|---|---|---|
| Foreground location | To provide user-requested route, deadhead, nearby-load, or hours-of-service features. This release is not designed for continuous background location tracking. | You may deny or revoke the permission in device settings. Some location-based functions will not work without it. |
| Camera | To scan a bill of lading, proof of delivery, or other freight document when you choose to scan it. | You may deny or revoke the permission in device settings. Document scanning will not work without it. |
| Notifications, if enabled in a future configured build | To deliver load, operational, and compliance alerts. | You may control notifications in device settings. |

## 3. Optional Integrations and Third-Party Services

Certain operational, analytics, subscription, advertising, mapping, routing, fuel-price, error-reporting, and notification libraries are included in PHI’s application architecture. Whether a specific service operates depends on whether PHI configures and enables its credentials in the deployed build.

Before enabling any of the following in production, PHI will update this policy, its in-app disclosures, and its Google Play Data safety declaration as necessary: analytics, crash reporting, push notifications, ad delivery, subscription or payment processing, external load-board connectivity, mapping/routing, or a hosted Driver’s Circle community. When an enabled integration receives information, its own privacy documentation may also apply.

## 4. How Information Is Used

PHI uses locally stored feature data to provide the user-requested checklist, planning, calculator, document, and preference functionality. We do not represent the Cash Flow & Factoring calculator as a lender, factoring provider, broker-verification, credit, payment, tax, insurance, legal, or financial advisory service. The results are planning estimates only.

If PHI later enables server-based functionality, we will use information only for the disclosed operational purpose, such as providing an authenticated community, synchronizing user preferences, processing a subscription, responding to support requests, preventing abuse, or improving reliability. We will update this policy before materially changing those practices.

## 5. Community and User-Generated Content

The present Driver’s Circle is a local testing preview. If PHI launches a hosted community, messages and posts may be visible to other participants as described in the feature at that time. Users should never post banking information, passwords, payment handles, exact live location, government identification numbers, MC/USDOT credentials, rate confirmations, or other sensitive business information to a community feed.

## 6. Data Retention and Deletion

For the current release candidate, locally stored planning information remains on the device until the user clears application storage, removes the app, or uses a feature-specific reset/delete control. Locally scanned documents remain subject to the device and app storage controls.

Before enabling an account-based production service, PHI will provide a current method for users to request deletion of personal information held by PHI and will describe that method in this policy and in the Google Play Data safety declaration.

## 7. Security

PHI uses reasonable technical and organizational measures appropriate to the release stage to protect information. No system can guarantee absolute security. Users should protect their device with an operating-system passcode and should not store unnecessary sensitive information in the app.

## 8. Children

PHI is intended for adult commercial-trucking professionals and is not directed to children. PHI does not knowingly collect personal information from children through the current release candidate.

## 9. Changes to This Policy

PHI may revise this Privacy Policy when features or data practices change. The updated version will display a revised effective date. Where required, PHI will provide additional notice or seek consent before a material change takes effect.

## 10. Contact

For privacy questions or requests, contact: **[PRIVACY CONTACT EMAIL TO BE CONFIRMED]**.

## Google Play Publication Note

Google Play requires an active privacy-policy URL for apps that request sensitive permissions or data, and the policy must be linked in both the store listing and the app.[1] The policy URL and the final document must be publicly accessible by HTTPS before the production Android build is created.

## References

[1]: https://support.google.com/googleplay/android-developer/answer/9859455?hl=en "Google Play Console Help: Prepare your app for review"
