# PHI Managed AI Proxy

This is the backend piece needed to make the Enterprise plan's "Managed AI — no API
key needed" promise real. Without deploying this, Enterprise subscribers get no AI
benefit beyond the free BYOK tiers — the app will just tell them to add their own key.

## What it does

A tiny server that holds **your** Anthropic API key as a secret and forwards AI
requests to Claude on behalf of Enterprise subscribers, so they never see or need
their own key. You pay Anthropic for the usage; Enterprise subscription revenue is
meant to cover it.

## Current state: prototype, not production-ready

`verifyEntitlement()` in `worker.js` only checks a shared secret header right now —
it does **not** verify that the caller actually has an active Enterprise subscription.
Before relying on this for real revenue, replace it with a real check against the
[Google Play Developer API](https://developers.google.com/android-publisher) (requires
a Google Cloud service account with access to your Play Console app). Until then,
anyone who obtains the shared secret can use your Anthropic quota for free.

## Deploying (Cloudflare Workers — generous free tier, no server to manage)

```bash
cd backend/managed-ai-proxy
npm install -g wrangler   # one-time
wrangler login
wrangler secret put ANTHROPIC_API_KEY     # your Anthropic key, paid usage tier recommended
wrangler secret put PHI_SHARED_SECRET     # any long random string
wrangler deploy
```

This prints a URL like `https://phi-managed-ai-proxy.<you>.workers.dev`.

## Wiring it into the app

In the mobile app's environment config, set:

```
EXPO_PUBLIC_MANAGED_AI_PROXY_URL=https://phi-managed-ai-proxy.<you>.workers.dev
EXPO_PUBLIC_MANAGED_AI_SHARED_SECRET=<the same random string you set above>
```

Once both are set and rebuilt, Enterprise-tier drivers with no personal API key
configured will automatically route AI requests through this proxy instead of seeing
a "no API key set" error.

## Ongoing cost

- Cloudflare Workers free tier: 100,000 requests/day, no cost.
- Anthropic API usage: billed per request/token to whatever Anthropic account owns
  `ANTHROPIC_API_KEY` — this is the real, variable cost this tier needs to cover.
  Estimate your usage before pricing the Enterprise plan to make sure the margin holds.
