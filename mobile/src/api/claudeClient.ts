// Generic AI client — the exported names (askClaude/askClaudeJSON/isClaudeConfigured)
// stay as-is since ~10 other files import them, but the model behind them is now
// selectable: Anthropic Claude, Moonshot Kimi, or a free Hugging Face-hosted open model,
// whichever the driver has configured (see apiKeyStore's preferredProvider). Provider
// identity is intentionally kept out of user-facing copy elsewhere in the app — this
// file is where it's allowed to matter.

import useAPIKeyStore, { AIProvider } from '../store/apiKeyStore';
import usePromoStore from '../store/promoStore';
import { hasManagedAI } from '../utils/subscriptionGating';

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

const KIMI_BASE = 'https://api.moonshot.ai/v1';
const KIMI_MODEL = 'kimi-k2-0711-preview';

// Hugging Face's OpenAI-compatible router — free tier, a few hundred requests/hour,
// routed to whichever backend is fastest for this open model. No cost, but the
// weakest quota of the three providers, so it's meant as a genuinely-free fallback,
// not the default for heavy use.
const HUGGINGFACE_BASE = 'https://router.huggingface.co/v1';
const HUGGINGFACE_MODEL = 'openai/gpt-oss-20b:fastest';

const MANAGED_AI_PROXY_URL = process.env.EXPO_PUBLIC_MANAGED_AI_PROXY_URL ?? '';
const MANAGED_AI_SHARED_SECRET = process.env.EXPO_PUBLIC_MANAGED_AI_SHARED_SECRET ?? '';

interface ActiveKey {
  provider: AIProvider;
  key: string;
}

/** Picks the driver's preferred provider if its key is set, otherwise falls back to whichever one is. */
const getActiveKey = (): ActiveKey | null => {
  try {
    const store = useAPIKeyStore.getState();
    const anthropicKey = store.getEffectiveKey('anthropicKey', process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '');
    const kimiKey = store.getEffectiveKey('kimiKey', process.env.EXPO_PUBLIC_KIMI_API_KEY ?? '');
    const huggingfaceKey = store.getEffectiveKey('huggingfaceKey', process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY ?? '');
    const byProvider: Record<AIProvider, string> = { anthropic: anthropicKey, kimi: kimiKey, huggingface: huggingfaceKey };

    if (byProvider[store.preferredProvider]) {
      return { provider: store.preferredProvider, key: byProvider[store.preferredProvider] };
    }
    if (anthropicKey) return { provider: 'anthropic', key: anthropicKey };
    if (kimiKey) return { provider: 'kimi', key: kimiKey };
    if (huggingfaceKey) return { provider: 'huggingface', key: huggingfaceKey };
    return null;
  } catch {
    const fallback = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
    return fallback ? { provider: 'anthropic', key: fallback } : null;
  }
};

/** True once the app owner has deployed backend/managed-ai-proxy and set the env vars. */
const managedAIAvailable = (): boolean => {
  if (!MANAGED_AI_PROXY_URL || !MANAGED_AI_SHARED_SECRET) return false;
  try {
    return hasManagedAI(usePromoStore.getState().getEffectiveTier());
  } catch {
    return false;
  }
};

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

const askViaManagedProxy = async (userPrompt: string, systemPrompt?: string, maxTokens = 512): Promise<string> => {
  const response = await fetch(MANAGED_AI_PROXY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-phi-shared-secret': MANAGED_AI_SHARED_SECRET },
    body: JSON.stringify({ prompt: userPrompt, systemPrompt, maxTokens }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Managed AI ${response.status}: ${errorText}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content.find((b) => b.type === 'text');
  if (!block) throw new Error('No text content in Managed AI response.');
  return block.text.trim();
};

const askAnthropic = async (apiKey: string, userPrompt: string, systemPrompt?: string, maxTokens = 512): Promise<string> => {
  const response = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: userPrompt }],
      ...(systemPrompt ? { system: systemPrompt } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI provider error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content.find((b) => b.type === 'text');
  if (!block) throw new Error('No text content in AI response.');
  return block.text.trim();
};

/** Kimi K2 via Moonshot's OpenAI-compatible chat completions endpoint. */
const askKimi = async (apiKey: string, userPrompt: string, systemPrompt?: string, maxTokens = 512): Promise<string> => {
  const response = await fetch(`${KIMI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      max_tokens: maxTokens,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI provider error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No text content in AI response.');
  return content.trim();
};

/** Free open-weight model via Hugging Face's OpenAI-compatible Inference Providers router. */
const askHuggingFace = async (apiKey: string, userPrompt: string, systemPrompt?: string, maxTokens = 512): Promise<string> => {
  const response = await fetch(`${HUGGINGFACE_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: HUGGINGFACE_MODEL,
      max_tokens: maxTokens,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI provider error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No text content in AI response.');
  return content.trim();
};

export const askClaude = async (
  userPrompt: string,
  systemPrompt?: string,
  maxTokens = 512,
): Promise<string> => {
  const active = getActiveKey();

  if (!active) {
    if (managedAIAvailable()) {
      return askViaManagedProxy(userPrompt, systemPrompt, maxTokens);
    }
    throw new Error('No AI key set. Add your free API key in Settings to unlock AI features.');
  }

  if (active.provider === 'kimi') return askKimi(active.key, userPrompt, systemPrompt, maxTokens);
  if (active.provider === 'huggingface') return askHuggingFace(active.key, userPrompt, systemPrompt, maxTokens);
  return askAnthropic(active.key, userPrompt, systemPrompt, maxTokens);
};

export const askClaudeJSON = async <T>(
  userPrompt: string,
  systemPrompt?: string,
  maxTokens = 1024,
): Promise<T> => {
  const raw = await askClaude(userPrompt, systemPrompt, maxTokens);
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) ?? raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1] ?? jsonMatch[0] : raw;
  return JSON.parse(jsonStr) as T;
};

export const isClaudeConfigured = (): boolean => Boolean(getActiveKey()) || managedAIAvailable();
