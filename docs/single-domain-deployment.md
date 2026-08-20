# PHI Single-Domain Deployment

PHI now operates as **one website and one public domain**. Customers visit the same PHI address to learn about the platform, request an assessment, receive a consent-based follow-up, complete onboarding, and use the product. The private Operations workspace and the limited delivery bridge also sit behind that same address; the customer never needs to see a separate backend or a second domain.

## Public route map

| Route | Audience | Purpose | Public visibility |
| --- | --- | --- | --- |
| `/` | Drivers, owner-operators, and fleet operators | PHI marketing, assessment, and onboarding entry point | Public |
| `/api/lead` | Website assessment form | Receives a consented assessment and relays it to the private customer lifecycle service | Public, but accepts only assessment submissions |
| `/operations` | PHI CEO and approved operators | Private free sales workspace for leads, drafts, consultation requests, and verified MRR | Protected by the PHI operations access key |
| `/api/operations/*` | The private Operations workspace | Server-side gateway to the customer lifecycle service | Protected; never exposes the PHI admin token to the browser |
| `/api/automation/followups` and `/api/automation/followups/{id}` | PHI’s approved free Google delivery bridge | Retrieves ready follow-ups and writes verified Gmail delivery receipts | Protected by a separate limited automation key |

> **Customer-facing rule:** The backend may run as an internal service, but it is not a second customer domain. The Next.js PHI site owns the public URL. All private service traffic is handled server-side through the same PHI domain.

## Deployment configuration

Set the following values in the secure environment settings of the existing PHI website deployment. Do not place any of these values in browser code, the public repository, or the Google Apps Script source.

| Environment | Variable | Role |
| --- | --- | --- |
| PHI website | `PHI_CUSTOMER_API_URL` | Internal/private base URL for the FastAPI customer lifecycle service. This can be an internal service address rather than a public domain. |
| PHI website | `PHI_ADMIN_TOKEN` | Server-only credential used by the Operations and automation gateways when they talk to the FastAPI service. |
| PHI website | `PHI_OPERATIONS_ACCESS_KEY` | Separate key required to open the private `/operations` workspace. |
| PHI website | `PHI_AUTOMATION_ACCESS_KEY` | Separate, limited key used only by the Google delivery bridge at `/api/automation`. |
| PHI customer lifecycle service | `PHI_ADMIN_TOKEN` | Must match the server-only website credential. |
| PHI customer lifecycle service | `PHI_BUSINESS_MAILING_ADDRESS` | `1642 McCulloch Blvd, Unit 466, Lake Havasu City, Arizona`. Inserted into prepared consented-email follow-ups. |
| Google Apps Script properties | `PHI_SITE_URL` | The same public PHI website URL—for example, `https://your-phi-site.example`. |
| Google Apps Script properties | `PHI_AUTOMATION_ACCESS_KEY` | Must match the website automation key. The script never receives the PHI admin token. |

## Free Google delivery bridge

The Google Apps Script bridge calls `https://<PHI-SITE>/api/automation/...`, not a separate backend URL. Its default `DRAFT_ONLY` mode produces a Gmail draft for a real consented lead and moves the related PHI queue record to held review. The lead is not emailed in this mode.

After PHI reviews the first real draft, setting `PHI_DELIVERY_MODE` to `SEND_CONSENTED` allows the bridge to send only existing `ready` follow-ups that originated in the PHI consented assessment path. It includes a PHI reference, recovers the Gmail message ID, and only then allows the lifecycle API to record the follow-up as sent. The bridge cannot query leads, move deal stages, start onboarding, record revenue, or create appointments because the single-domain automation route does not expose those operations.

## Why this is one project instead of multiple projects

The original PHI website, customer assessment, lead qualification, follow-up queue, Operations dashboard, onboarding gates, and revenue controls remain in the single `phi-app` repository. The website is the public shell. The customer lifecycle service is an internal component of the same application, and the Google script is a delivery adapter for the approved Gmail account rather than a second site or paid CRM.

## Production launch sequence

First, deploy the current `main` branch to the existing PHI website environment and set the website and backend variables above. Second, verify that `/api/lead` accepts an assessment on the public PHI address and that `/operations` requires the private access key. Third, add the **same PHI site URL** and limited automation key to the Google Apps Script properties. Run the script once in `DRAFT_ONLY` mode when the first real consented lead appears. Finally, review that draft and only then intentionally enable live consented delivery.

The one-domain setup does not require a second domain, a paid CRM, a separate booking platform, or a public backend URL. It does require the existing PHI site to be deployed on a host that can run the Next.js website and access the internal FastAPI customer service.
