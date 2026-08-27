// Fleet Maintenance sub-task: monitor Diesel Exhaust Fluid (DEF) consumption so a
// driver doesn't get caught with an empty tank — modern SCR engines derate power
// sharply and can eventually refuse to start once DEF runs dry. DEF consumption is
// typically 2-3% of diesel volume for a modern engine; this is a real, commonly cited
// industry ratio, but actual consumption varies by engine and duty cycle, so this is
// framed as an estimate to plan around, not a precise gauge reading.

export interface DEFStatus {
  tankCapacityGallons: number;
  milesSinceFill: number;
  estimatedGallonsRemaining: number;
  estimatedPercentRemaining: number;
  estimatedMilesUntilEmpty: number;
  refillSoon: boolean;
}

const DEF_CONSUMPTION_RATIO = 0.025; // ~2.5% of diesel gallons burned, typical for modern SCR systems
const REFILL_SOON_THRESHOLD_PERCENT = 20;

export const estimateDEFStatus = (
  tankCapacityGallons: number,
  milesSinceFill: number,
  truckMPG: number,
): DEFStatus => {
  if (tankCapacityGallons <= 0) throw new Error('Tank capacity must be greater than zero.');
  if (truckMPG <= 0) throw new Error('Truck MPG must be greater than zero.');

  const dieselGallonsBurned = milesSinceFill / truckMPG;
  const defGallonsUsed = dieselGallonsBurned * DEF_CONSUMPTION_RATIO;
  const estimatedGallonsRemaining = Number(Math.max(0, tankCapacityGallons - defGallonsUsed).toFixed(2));
  const estimatedPercentRemaining = Number(((estimatedGallonsRemaining / tankCapacityGallons) * 100).toFixed(1));

  const totalDieselRangeForFullTank = (tankCapacityGallons / DEF_CONSUMPTION_RATIO) * truckMPG;
  const estimatedMilesUntilEmpty = Math.max(0, Math.round(totalDieselRangeForFullTank - milesSinceFill));

  return {
    tankCapacityGallons,
    milesSinceFill,
    estimatedGallonsRemaining,
    estimatedPercentRemaining,
    estimatedMilesUntilEmpty,
    refillSoon: estimatedPercentRemaining <= REFILL_SOON_THRESHOLD_PERCENT,
  };
};
