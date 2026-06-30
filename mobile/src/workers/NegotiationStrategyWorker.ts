// Negotiation intelligence powered by Claude AI.
// Falls back to template-based email when Claude is not configured.

import { askClaude, askClaudeJSON, isClaudeConfigured } from '../api/claudeClient';
import { Load } from './workers-15x';

export type MarketCapacity = 'Tight' | 'Balanced' | 'Loose';
export type LaneDesirability = 'High' | 'Medium' | 'Low';

const NEGOTIATION_SYSTEM = `You are a freight dispatch negotiation expert for Prince Haul Intelligence (PHI).
Write professional, concise broker outreach emails that secure the best rate for the carrier.
Be direct, confident, and specific. Max 120 words in the email body.`;

const templateEmail = (
  load: Pick<Load, 'id' | 'origin' | 'destination' | 'rate' | 'rpm'>,
  marketCapacity: MarketCapacity,
  laneDesirability: LaneDesirability,
): string => {
  const targetRate = laneDesirability === 'High' ? load.rate * 1.06 : laneDesirability === 'Medium' ? load.rate * 1.03 : load.rate;
  const capacityNote =
    marketCapacity === 'Tight'
      ? 'capacity is especially constrained on this lane'
      : marketCapacity === 'Balanced'
        ? 'capacity is balanced but dependable execution still matters'
        : 'capacity is available, and we can move fast with clean communication';

  return [
    `Subject: PHI Capacity Available — Load ${load.id}`,
    '',
    'Hello,',
    '',
    `Prince Haul Intelligence is reviewing load ${load.id} from ${load.origin.city}, ${load.origin.state} to ${load.destination.city}, ${load.destination.state}. Based on current conditions, ${capacityNote}.`,
    `Our target all-in rate is $${targetRate.toFixed(2)} (${load.rpm.toFixed(2)} RPM baseline). We provide proactive updates and on-time execution.`,
    '',
    `Lane desirability is currently ${laneDesirability.toLowerCase()}. We can confirm immediately if rates align.`,
    '',
    'Best regards,',
    'Prince Haul Intelligence Dispatch',
  ].join('\n');
};

export const generateOutreachEmail = (
  load: Pick<Load, 'id' | 'origin' | 'destination' | 'rate' | 'rpm'>,
  marketCapacity: MarketCapacity,
  laneDesirability: LaneDesirability,
): string => {
  return templateEmail(load, marketCapacity, laneDesirability);
};

export const generateAIOutreachEmail = async (
  load: Pick<Load, 'id' | 'origin' | 'destination' | 'rate' | 'rpm'>,
  marketCapacity: MarketCapacity,
  laneDesirability: LaneDesirability,
): Promise<string> => {
  if (!isClaudeConfigured()) {
    return templateEmail(load, marketCapacity, laneDesirability);
  }

  try {
    const targetRate = laneDesirability === 'High' ? load.rate * 1.06 : laneDesirability === 'Medium' ? load.rate * 1.03 : load.rate;
    return await askClaude(
      `Write a broker outreach email for this freight load:
      Load ID: ${load.id}
      Route: ${load.origin.city}, ${load.origin.state} → ${load.destination.city}, ${load.destination.state}
      Posted Rate: $${load.rate.toFixed(0)} | RPM: ${load.rpm.toFixed(2)}
      Target Rate: $${targetRate.toFixed(0)}
      Market Capacity: ${marketCapacity}
      Lane Desirability: ${laneDesirability}

      Write the full email including subject line. Keep it under 120 words. Professional, confident, specific.`,
      NEGOTIATION_SYSTEM,
      300,
    );
  } catch {
    return templateEmail(load, marketCapacity, laneDesirability);
  }
};

export const generateNegotiationStrategy = async (
  load: Pick<Load, 'id' | 'rate' | 'rpm' | 'brokerRating'>,
  marketCapacity: MarketCapacity,
): Promise<{
  recommendedRate: number;
  walkAwayRate: number;
  tactic: string;
  confidence: number;
}> => {
  if (!isClaudeConfigured()) {
    const recommended = Number((load.rate * (marketCapacity === 'Tight' ? 1.08 : marketCapacity === 'Balanced' ? 1.04 : 1.01)).toFixed(0));
    return {
      recommendedRate: recommended,
      walkAwayRate: Number((load.rate * 0.95).toFixed(0)),
      tactic: marketCapacity === 'Tight' ? 'Hold firm — capacity is short. Counter at 8% above posted.' : 'Negotiate professionally. Offer value through reliability.',
      confidence: marketCapacity === 'Tight' ? 85 : 65,
    };
  }

  try {
    return await askClaudeJSON(
      `Generate a negotiation strategy for this load:
      Load ${load.id}: Posted rate $${load.rate}, RPM ${load.rpm.toFixed(2)}, Broker rating ${load.brokerRating}/5.0
      Market: ${marketCapacity}
      Return JSON: { "recommendedRate": number, "walkAwayRate": number, "tactic": "one sentence strategy", "confidence": 0-100 }`,
      NEGOTIATION_SYSTEM,
      200,
    );
  } catch {
    const recommended = Number((load.rate * 1.04).toFixed(0));
    return {
      recommendedRate: recommended,
      walkAwayRate: Number((load.rate * 0.95).toFixed(0)),
      tactic: 'Negotiate professionally. Offer value through reliability and on-time history.',
      confidence: 65,
    };
  }
};
