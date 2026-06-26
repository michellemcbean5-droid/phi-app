import { getWorkerLimit, UserTier } from '../utils/subscriptionGating';

export type SubscriptionTier = UserTier;

export const updateSubscriptionTier = async (
  userId: string,
  tier: SubscriptionTier,
): Promise<{
  userId: string;
  tier: SubscriptionTier;
  workerLimit: number;
  unlockedWorkers: number;
  updatedAt: string;
}> => {
  if (!userId.trim()) {
    throw new Error('User ID is required to update subscription tier.');
  }

  const workerLimit = getWorkerLimit(tier);

  return {
    userId,
    tier,
    workerLimit,
    unlockedWorkers: workerLimit,
    updatedAt: new Date().toISOString(),
  };
};
