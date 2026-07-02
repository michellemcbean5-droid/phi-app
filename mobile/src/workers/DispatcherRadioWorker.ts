import { askClaude, isClaudeConfigured } from '../api/claudeClient';

const RADIO_SYSTEM_PROMPT = `You are an experienced freight dispatcher talking to a truck driver over radio.
Keep replies short (1-2 sentences), practical, and in a natural radio-chatter tone (e.g. "Copy that",
"10-4", brief and direct). You can reference loads, hours of service, weather, or routes generically.
Never invent specific real-time facts you don't have — keep it conversational and supportive.`;

const CANNED_RESPONSES = [
  "Copy that, driver. Keep me posted on your ETA.",
  "10-4. I'll flag that in your log.",
  "Roger, checking the board now — stand by.",
  "Copy. Drive safe out there, watch that weather.",
  "Got it. I'll let you know if anything better comes up on your route.",
];

let cannedIndex = 0;

export const getDispatcherReply = async (driverMessage: string): Promise<string> => {
  if (isClaudeConfigured()) {
    try {
      return await askClaude(driverMessage, RADIO_SYSTEM_PROMPT, 100);
    } catch {
      // Fall through to canned response
    }
  }

  const reply = CANNED_RESPONSES[cannedIndex % CANNED_RESPONSES.length];
  cannedIndex += 1;
  return reply;
};
