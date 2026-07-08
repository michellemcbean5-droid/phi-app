// "Michelle" — PHI's built-in support assistant. Answers questions about how the app
// works, billing/subscription policy, privacy, and general how-to. Uses the driver's
// configured AI provider when an API key is set; otherwise falls back to a rule-based
// FAQ so support still works for the exact non-technical drivers who haven't set one up yet.

import { askClaude, isClaudeConfigured } from '../api/claudeClient';

const MICHELLE_SYSTEM_PROMPT = `You are Michelle, the friendly built-in support assistant for PHI (Prince Haul Intelligence),
a trucking app for owner-operators. Speak plainly — many drivers are not tech-savvy. Keep answers short (2-4 sentences).

Key facts about PHI:
- The app itself is free. AI features (load discovery, dispatcher radio, negotiation emails, compliance checks) run on
  the driver's own free AI API key, entered in Settings > My API Keys. Getting a key takes about 2 minutes and has
  its own free usage tier.
- Paid plans (Solo, Fleet, Enterprise) are optional upgrades for unlimited document storage, faster load alerts,
  multiple trucks/vans, and — on Enterprise — Managed AI, where PHI runs the AI for you with no key setup needed.
- Subscriptions are billed and managed through Google Play (Settings > Subscription & Billing), and can be cancelled
  anytime from the driver's Google Play account — PHI does not directly charge cards.
- Driver data (loads, documents, earnings) stays on the driver's own phone. AI features send only the specific
  request (e.g. "find loads near Dallas") to the driver's chosen AI provider using their own key — never sold or shared.
- The app has 10 AI workers (Dispatch Coordinator, Freight Negotiator, Route Optimizer, Compliance & Safety,
  Invoice Specialist, Fuel Optimizer, Fleet Maintenance, Track & Trace, Driver Liaison, Business Intelligence) that
  work automatically as the driver uses the app — booking loads, scanning documents, etc.
- For anything you can't answer (legal, account-specific billing disputes, bugs), tell the driver to use the
  "Contact a human" option in the Ask Michelle screen.`;

interface FaqEntry {
  keywords: string[];
  answer: string;
}

const FAQ_ENTRIES: FaqEntry[] = [
  {
    keywords: ['api key', 'apikey', 'set up ai', 'anthropic', 'claude key', 'kimi key', 'hugging face', 'add my key'],
    answer: 'To turn on AI features, go to Settings > My API Keys and paste in a free AI API key (Claude, Kimi, or Hugging Face — your choice). All three have a free tier that takes about 2 minutes to sign up for — no credit card needed.',
  },
  {
    keywords: ['free', 'cost', 'price', 'pricing', 'how much'],
    answer: 'PHI itself is completely free. AI features run on your own free API key at no cost to you. Paid plans (Solo/Fleet/Enterprise) are optional — they add things like unlimited document storage, multiple trucks, and (Enterprise) AI with no key setup at all.',
  },
  {
    keywords: ['cancel', 'refund', 'unsubscribe', 'billing dispute'],
    answer: 'Subscriptions are billed through Google Play, so you can cancel anytime from your Google Play account (Settings > Subscription & Billing has a shortcut). Refunds follow Google Play\'s own refund policy since they process the payment, not PHI directly.',
  },
  {
    keywords: ['privacy', 'my data', 'data policy', 'sell my data'],
    answer: 'Your loads, documents, and earnings stay on your own phone — PHI has no backend server collecting them. When you use an AI feature, only that specific request goes to your chosen AI provider using your own API key. Nothing is sold.',
  },
  {
    keywords: ['book a load', 'find loads', 'find freight', 'how do i book'],
    answer: 'Open the Loads tab — PHI shows available freight automatically. Tap "Book Load" on any load, and PHI\'s Dispatch Coordinator and Freight Negotiator workers handle the confirmation for you.',
  },
  {
    keywords: ['ai worker', 'how does the ai', 'workers work', 'what do the workers do'],
    answer: 'PHI has 10 AI workers that run automatically as you use the app — for example, the Freight Negotiator logs revenue when you book a load, and the Driver Liaison files documents when you scan them. Check the "What do the AI workers do?" button on the AI tab for the full breakdown.',
  },
  {
    keywords: ['truck', 'van', 'lease', 'buy a truck', 'own my own'],
    answer: 'Check out the Truck & Van Marketplace (Settings > Truck & Van Marketplace) — it lists real partners for buying or leasing a semi-tractor, box truck, or cargo van depending on the freight you run.',
  },
  {
    keywords: ['human', 'real person', 'contact support', 'talk to someone'],
    answer: 'For anything I can\'t help with, use the "Contact a human" button below to email PHI support directly.',
  },
];

const findFaqAnswer = (message: string): string | null => {
  const lower = message.toLowerCase();
  const match = FAQ_ENTRIES.find((entry) => entry.keywords.some((kw) => lower.includes(kw)));
  return match?.answer ?? null;
};

const GENERIC_FALLBACK =
  "I'm running in offline mode right now since no AI key is set up yet — add one free in Settings > My API Keys and I can answer anything about the app. In the meantime, try asking about: your API key, pricing, cancelling a subscription, privacy, booking a load, or how the AI workers work.";

export const getMichelleReply = async (message: string, customInstructions?: string): Promise<string> => {
  if (isClaudeConfigured()) {
    try {
      const systemPrompt = customInstructions?.trim()
        ? `${MICHELLE_SYSTEM_PROMPT}\n\nThe driver has customized how you should behave — follow this as long as it doesn't conflict with the facts above: "${customInstructions.trim()}"`
        : MICHELLE_SYSTEM_PROMPT;
      return await askClaude(message, systemPrompt, 400);
    } catch {
      // Fall through to the FAQ so support still works if the API call fails.
    }
  }

  return findFaqAnswer(message) ?? GENERIC_FALLBACK;
};
