/**
 * PHI Managed AI Proxy — Cloudflare Worker.
 *
 * Purpose: lets Enterprise-tier drivers use PHI's AI features without setting up
 * their own Anthropic API key. The app owner pays Anthropic for these calls out of
 * Enterprise subscription revenue (that's the whole point of the "Managed AI" tier).
 *
 * NOT YET WIRED FOR ENTITLEMENT VERIFICATION. `ENTITLEMENT_MODE` below is a
 * placeholder shared-secret check — anyone with the shared secret can use it. Before
 * relying on this in production, replace `verifyEntitlement()` with a real check
 * against the Google Play Developer API (voided purchases + subscription status)
 * using a Google Cloud service account. Until then, treat this as a working
 * prototype, not a production billing gate.
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const MODEL = 'claude-haiku-4-5-20251001';

function verifyEntitlement(request, env) {
  const sharedSecret = request.headers.get('x-phi-shared-secret');
  return Boolean(env.PHI_SHARED_SECRET) && sharedSecret === env.PHI_SHARED_SECRET;
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!verifyEntitlement(request, env)) {
      return new Response(JSON.stringify({ error: 'Not entitled to Managed AI.' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), { status: 400 });
    }

    const { prompt, systemPrompt, maxTokens } = body;
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'A prompt is required.' }), { status: 400 });
    }

    const anthropicResponse = await fetch(`${ANTHROPIC_BASE}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: typeof maxTokens === 'number' ? maxTokens : 512,
        messages: [{ role: 'user', content: prompt }],
        ...(systemPrompt ? { system: systemPrompt } : {}),
      }),
    });

    const text = await anthropicResponse.text();
    return new Response(text, {
      status: anthropicResponse.status,
      headers: { 'content-type': 'application/json' },
    });
  },
};
