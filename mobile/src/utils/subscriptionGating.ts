export type UserTier = 'Solo' | 'Fleet' | 'Enterprise';

const FEATURE_ACCESS: Record<string, UserTier[]> = {
  basicDashboard: ['Solo', 'Fleet', 'Enterprise'],
  advancedLoads: ['Solo', 'Fleet', 'Enterprise'],
  aiCommandCenter: ['Fleet', 'Enterprise'],
  complianceAutomation: ['Fleet', 'Enterprise'],
  documentAutomation: ['Fleet', 'Enterprise'],
  unlimitedNotifications: ['Enterprise'],
  enterpriseAnalytics: ['Enterprise'],
};

export const checkFeatureAccess = (userTier: UserTier, feature: string): boolean => {
  const supportedTiers = FEATURE_ACCESS[feature];
  if (!supportedTiers) {
    return false;
  }

  return supportedTiers.includes(userTier);
};

export const getWorkerLimit = (tier: UserTier): number => {
  switch (tier) {
    case 'Solo':
      return 5;
    case 'Fleet':
      return 10;
    case 'Enterprise':
      return 15;
    default: {
      const exhaustiveCheck: never = tier;
      return exhaustiveCheck;
    }
  }
};
