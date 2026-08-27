import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined),
  },
}));

import {
  BUSINESS_BLUEPRINT_STEPS,
} from '../store/businessBlueprintStore';
import useBusinessBlueprintStore from '../store/businessBlueprintStore';
import useDriverCircleStore from '../store/driverCircleStore';

describe('rookie owner-operator feature state', () => {
  beforeEach(() => {
    useBusinessBlueprintStore.setState({ completedStepIds: [], lastUpdatedAt: undefined });
  });

  it('includes a required, official-resource-backed authority path', () => {
    const required = BUSINESS_BLUEPRINT_STEPS.filter((step) => step.isRequired);
    expect(required.length).toBeGreaterThan(8);
    expect(BUSINESS_BLUEPRINT_STEPS.some((step) => step.id === 'usdot-number' && step.resourceUrl?.includes('fmcsa.dot.gov'))).toBe(true);
    expect(BUSINESS_BLUEPRINT_STEPS.some((step) => step.id === 'new-entrant-audit' && step.resourceUrl?.includes('fmcsa.dot.gov'))).toBe(true);
  });

  it('toggles a Blueprint item without duplication', () => {
    const firstStepId = BUSINESS_BLUEPRINT_STEPS[0].id;
    useBusinessBlueprintStore.getState().toggleStep(firstStepId);
    expect(useBusinessBlueprintStore.getState().completedStepIds).toEqual([firstStepId]);

    useBusinessBlueprintStore.getState().toggleStep(firstStepId);
    expect(useBusinessBlueprintStore.getState().completedStepIds).toEqual([]);
  });

  it('creates a Circle post, reply, and report marker', () => {
    const store = useDriverCircleStore.getState();
    store.createPost({
      body: 'What recordkeeping routine helped you prepare for your first safety audit?',
      topic: 'Authority',
      seekingMentor: true,
      seekingTeamDriver: false,
    });

    const post = useDriverCircleStore.getState().posts[0];
    expect(post.topic).toBe('Authority');
    expect(post.seekingMentor).toBe(true);

    useDriverCircleStore.getState().addReply(post.id, 'Start with inspections, maintenance, and HOS files.', 'Mentor Driver');
    useDriverCircleStore.getState().reportPost(post.id);

    const updated = useDriverCircleStore.getState().posts.find((item) => item.id === post.id);
    expect(updated?.replyCount).toBe(1);
    expect(updated?.replies).toHaveLength(1);
    expect(updated?.isReported).toBe(true);
  });
});
