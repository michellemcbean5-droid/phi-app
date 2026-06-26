import { Load } from './workers-15x';

export type LoadScore = 'Diamond' | 'Gold' | 'Standard';

const assertValidLoad = (load: Pick<Load, 'rpm' | 'id'>): void => {
  if (!load.id.trim()) {
    throw new Error('Load ID is required for scoring.');
  }

  if (!Number.isFinite(load.rpm) || load.rpm <= 0) {
    throw new Error('Load RPM must be a positive number.');
  }
};

export const scoreLoad = (load: Pick<Load, 'rpm' | 'id'>): LoadScore => {
  assertValidLoad(load);

  if (load.rpm > 3.5) {
    return 'Diamond';
  }

  if (load.rpm >= 2.5) {
    return 'Gold';
  }

  return 'Standard';
};
