// Rule-based mileage maintenance intervals — the industry-standard mileage bands
// for a Class 8 truck. Deterministic and always available, no AI/network dependency.

export type MaintenanceStatus = 'ok' | 'due-soon' | 'overdue';

export interface MaintenanceSuggestion {
  item: string;
  intervalMiles: number;
  milesUntilDue: number;
  status: MaintenanceStatus;
}

const DUE_SOON_WINDOW_MILES = 1500;

const MAINTENANCE_INTERVALS: { item: string; intervalMiles: number }[] = [
  { item: 'Oil & Filter Change', intervalMiles: 20000 },
  { item: 'Tire Rotation & Inspection', intervalMiles: 25000 },
  { item: 'Air Filter Replacement', intervalMiles: 30000 },
  { item: 'Brake Inspection', intervalMiles: 40000 },
  { item: 'Coolant System Flush', intervalMiles: 100000 },
];

export const getMaintenanceSuggestions = (mileage: number): MaintenanceSuggestion[] => {
  if (!Number.isFinite(mileage) || mileage <= 0) return [];

  return MAINTENANCE_INTERVALS.map(({ item, intervalMiles }) => {
    const milesSinceService = mileage % intervalMiles;
    const milesUntilDue = intervalMiles - milesSinceService;
    const status: MaintenanceStatus =
      milesUntilDue > DUE_SOON_WINDOW_MILES ? 'ok' : milesUntilDue > 0 ? 'due-soon' : 'overdue';
    return { item, intervalMiles, milesUntilDue, status };
  }).sort((a, b) => a.milesUntilDue - b.milesUntilDue);
};
