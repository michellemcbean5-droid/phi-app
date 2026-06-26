import { calculateGPSDeadhead, Coordinates } from '../api/googleMapsConnector';

export interface RouteAnalysisResult {
  deadheadMiles: number;
  deadheadPercentage: number;
  estimatedTripHours: number;
  hosCompliant: boolean;
  rejected: boolean;
  rejectionReason: string | null;
}

export const calculateDeadhead = async (
  currentLocation: Coordinates,
  pickupLocation: Coordinates,
  totalMiles: number,
): Promise<RouteAnalysisResult> => {
  if (!Number.isFinite(totalMiles) || totalMiles <= 0) {
    throw new Error('Total trip miles must be a positive number.');
  }

  const deadheadMiles = await calculateGPSDeadhead(currentLocation, pickupLocation);
  const deadheadPercentage = Number(((deadheadMiles / totalMiles) * 100).toFixed(2));
  const estimatedTripHours = Number(((deadheadMiles + totalMiles) / 55).toFixed(2));
  const hosCompliant = estimatedTripHours <= 11;
  const rejected = deadheadPercentage > 15 || !hosCompliant;

  return {
    deadheadMiles: Number(deadheadMiles.toFixed(2)),
    deadheadPercentage,
    estimatedTripHours,
    hosCompliant,
    rejected,
    rejectionReason: deadheadPercentage > 15
      ? 'Deadhead exceeds 15% of total trip distance.'
      : !hosCompliant
        ? 'Projected trip would violate HOS drive-time limits.'
        : null,
  };
};
