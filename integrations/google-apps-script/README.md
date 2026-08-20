# PHI Free Google Delivery Bridge

This bridge allows the PHI customer-acquisition system to use the approved Gmail account as a **free follow-up channel** without a paid CRM. The PHI website captures an explicit-consent assessment, the FastAPI service creates a prepared follow-up, and this Google Apps Script reads the protected queue, sends only when live delivery is explicitly enabled, and records the Gmail message ID back in PHI.

> **Operating boundary:** The bridge is set to `DRAFT_ONLY` by default. In that mode it creates a Gmail draft and changes the PHI queue record to **held**; it does not send a customer message. Moving to `SEND_CONSENTED` is an intentional customer-contact decision and should be used only for leads that supplied explicit consent through the PHI assessment.

## What this free bridge does

| Customer moment | PHI responsibility | Google responsibility | Safety control |
| --- | --- | --- | --- |
| A visitor requests an assessment | Stores consent, qualification, recommended offer, and source | None | No email is sent by the website form. |
| PHI prepares a follow-up | Creates a `ready` queue record with the approved PHI identity and mailing address | None | The message is not represented as delivered. |
| Safe review mode | Makes one Gmail draft and moves the record to `held` | Uses Gmail draft creation | The trigger cannot create endless drafts. |
| Authorized live follow-up | Sends one prepared email and stores a Gmail receipt | Sends from the account that installed the script | A PHI reference is included in the email and the queue becomes `sent` only after a Gmail message ID is recovered. |
| Consultation request | Keeps the request in PHI | Calendar scheduling stays a separate, approved action | The bridge does not invent availability or create appointments automatically. |

Google’s installable time-driven triggers can run automatically at intervals and execute under the account that created them.[1] Gmail’s Apps Script service supports both draft creation and sending, and it requires Gmail authorization.[2] Google documents daily service quotas and notes that a consumer Gmail account has a daily recipient limit; treat the current published limit as a ceiling, not a marketing-volume target.[3]

## One-time installation

Create a new standalone project at [script.google.com](https://script.google.com) while signed in to the approved PHI Gmail account. Replace the default code with [`Code.gs`](./Code.gs). In **Project Settings → Script properties**, add the following values. Do not place the PHI admin token in the script source code.

| Property | Required value | Purpose |
| --- | --- | --- |
| `PHI_SITE_URL` | `https://<your-existing-PHI-site>` | The one public PHI website address. The bridge uses its restricted same-domain automation route. |
| `PHI_AUTOMATION_ACCESS_KEY` | The restricted website automation key | Gives access only to prepared follow-up retrieval and delivery receipts; it does not expose the PHI admin token. |
| `PHI_DELIVERY_MODE` | `DRAFT_ONLY` initially | Keeps the first activation in non-sending review mode. |
| `PHI_SENDER_NAME` | `Prince Haul Intelligence` | The displayed sender name. |
| `PHI_BATCH_LIMIT` | `10` initially | Caps any one run at 10 ready records; the script caps this value at 20. |

Run `installPhiLeadEngine` once from the Apps Script editor and approve Google’s permission request. The function creates one five-minute time trigger. Google states that time-driven triggers can run as frequently as every minute, but the exact timing can be slightly randomized; PHI deliberately uses five minutes to reduce unnecessary API calls and leave room for review.[1]

## Controlled activation sequence

Keep `PHI_DELIVERY_MODE` as `DRAFT_ONLY` for the first live website lead. The script will create a Gmail draft, place the matching PHI follow-up on hold, and leave a visible audit entry. Review that first draft, including the recipient, offer, mailing address, and opt-out language. Only after that review should the responsible PHI operator change the property to `SEND_CONSENTED`.

In live mode, the script retrieves only PHI follow-ups with the `ready` status. It sends the prepared message through the approved Gmail account, locates the resulting sent-mail message using the embedded PHI reference, and writes the returned Gmail message ID to PHI. If Gmail delivery cannot be positively identified, PHI does not claim the message was sent. The next scheduled run attempts receipt recovery before considering a new send.

The existing customer message contains the approved PHI identity:

> Prince Haul Intelligence  
> 1642 McCulloch Blvd, Unit 466, Lake Havasu City, Arizona  
> You received this follow-up after requesting a PHI assessment. To stop future PHI follow-up emails, reply UNSUBSCRIBE.

## Ongoing operating controls

The script uses `MailApp.getRemainingDailyQuota()` before processing the queue and caps every batch. Google’s published quotas are per user, reset on a rolling basis, and may change, so PHI should inspect the Apps Script execution dashboard if delivery slows or throws a quota exception.[3] A stopped or failed trigger should be investigated in the Apps Script execution history before it is re-enabled.[1]

A customer reply of **UNSUBSCRIBE** must be handled promptly by moving the related PHI follow-up to `suppressed`; that change also removes marketing consent on the lead record. The bridge does not scrape public contacts, send cold email, mark a sale as won, create payment obligations, or create calendar events on a prospect’s behalf.

## Production deployment prerequisites

The Apps Script bridge can only contact the **public HTTPS PHI website**. A local development address such as `localhost` will not work from Google. Before installation, deploy the current PHI project, set `PHI_ADMIN_TOKEN` and `PHI_BUSINESS_MAILING_ADDRESS` in the customer lifecycle environment, and set `PHI_CUSTOMER_API_URL`, `PHI_ADMIN_TOKEN`, `PHI_OPERATIONS_ACCESS_KEY`, and `PHI_AUTOMATION_ACCESS_KEY` in the website environment. The bridge calls `https://<your-existing-PHI-site>/api/automation/...`, so no second domain or public backend URL is needed. Keep all secrets in the deployment provider’s secret manager. See the [single-domain deployment guide](../../docs/single-domain-deployment.md) for the complete route and secret map.

## References

[1]: https://developers.google.com/apps-script/guides/triggers/installable "Google Apps Script: Installable Triggers"
[2]: https://developers.google.com/apps-script/reference/gmail/gmail-app "Google Apps Script: GmailApp"
[3]: https://developers.google.com/apps-script/guides/services/quotas "Google Apps Script: Quotas for Google Services"
