// PHI is free to use — AI features run on the driver's own API key (BYOK), so every
// tier gets the full 10-worker AI stack at no extra cost. Paid tiers unlock non-AI
// extras (fleet size, document storage, faster load-proximity refresh) plus, at the
// top tier, PHI-managed AI access for drivers who don't want to set up their own key.

export type UserTier = 'Free' | 'Solo' | 'Fleet' | 'Enterprise';

const FEATURE_ACCESS: Record<string, UserTier[]> = {
  basicDashboard: ['Free', 'Solo', 'Fleet', 'Enterprise'],
  advancedLoads: ['Free', 'Solo', 'Fleet', 'Enterprise'],
  aiCommandCenter: ['Free', 'Solo', 'Fleet', 'Enterprise'],
  complianceAutomation: ['Free', 'Solo', 'Fleet', 'Enterprise'],
  documentAutomation: ['Free', 'Solo', 'Fleet', 'Enterprise'],
  multiTruckFleet: ['Fleet', 'Enterprise'],
  managedAI: ['Enterprise'],
  enterpriseAnalytics: ['Enterprise'],
};

export const checkFeatureAccess = (userTier: UserTier, feature: string): boolean => {
  const supportedTiers = FEATURE_ACCESS[feature];
  if (!supportedTiers) {
    return false;
  }

  return supportedTiers.includes(userTier);
};

/** Every tier gets all 10 AI workers — they run on the driver's own API key. */
export const getWorkerLimit = (_tier: UserTier): number => 10;

export const getTruckLimit = (tier: UserTier): number => {
  switch (tier) {
    case 'Free':
    case 'Solo':
      return 1;
    case 'Fleet':
      return 5;
    case 'Enterprise':
      return Number.POSITIVE_INFINITY;
    default: {
      const exhaustiveCheck: never = tier;
      return exhaustiveCheck;
    }
  }
};

export const getDocumentLimit = (tier: UserTier): number => {
  return tier === 'Free' ? 20 : Number.POSITIVE_INFINITY;
};

export const getProximityRefreshMinutes = (tier: UserTier): number => {
  return tier === 'Free' ? 5 : 1;
};

export const hasManagedAI = (tier: UserTier): boolean => checkFeatureAccess(tier, 'managedAI');
