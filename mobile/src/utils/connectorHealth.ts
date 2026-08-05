// Connector health monitoring — tracks fetch success/failure for each load board
// and exposes a health summary for the UI to display.

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface ConnectorHealth {
  name: string;
  status: HealthStatus;
  lastChecked: string;
  successCount: number;
  failureCount: number;
  lastError?: string;
}

const registry: Map<string, ConnectorHealth> = new Map();

const CONNECTORS = ['DAT', 'Truckstop', 'AmazonRelay', 'Coyote', 'Loadsmart'];

CONNECTORS.forEach((name) => {
  registry.set(name, {
    name,
    status: 'unknown',
    lastChecked: '',
    successCount: 0,
    failureCount: 0,
  });
});

export const recordSuccess = (connector: string): void => {
  const current = registry.get(connector);
  if (!current) return;
  registry.set(connector, {
    ...current,
    status: 'healthy',
    lastChecked: new Date().toISOString(),
    successCount: current.successCount + 1,
  });
};

export const recordFailure = (connector: string, error: string): void => {
  const current = registry.get(connector);
  if (!current) return;
  const failures = current.failureCount + 1;
  registry.set(connector, {
    ...current,
    status: failures >= 3 ? 'down' : 'degraded',
    lastChecked: new Date().toISOString(),
    failureCount: failures,
    lastError: error,
  });
};

export const getHealth = (): ConnectorHealth[] => Array.from(registry.values());

export const getConnectorStatus = (name: string): HealthStatus =>
  registry.get(name)?.status ?? 'unknown';

export const isAnyConnectorHealthy = (): boolean =>
  Array.from(registry.values()).some((c) => c.status === 'healthy');
