import useAPIKeyStore from '../store/apiKeyStore';

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const PHI_MODEL = 'claude-haiku-4-5-20251001';

const getApiKey = (): string => {
  try {
    const customerKey = useAPIKeyStore.getState().getEffectiveKey(
      'anthropicKey',
      process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
    );
    return customerKey;
  } catch {
    return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
  }
};

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const askClaude = async (
  userPrompt: string,
  systemPrompt?: string,
  maxTokens = 512,
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not configured.');
  }

  const response = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: PHI_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: userPrompt }],
      ...(systemPrompt ? { system: systemPrompt } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };

  const block = data.content.find((b) => b.type === 'text');
  if (!block) throw new Error('No text content in Claude response.');
  return block.text.trim();
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

export const isClaudeConfigured = (): boolean => Boolean(getApiKey());
