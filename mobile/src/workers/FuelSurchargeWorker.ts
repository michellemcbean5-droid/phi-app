// Freight Procurement sub-task: verify a broker's quoted fuel surcharge (FSC) is fair.
// Standard industry formula: FSC per mile = (current diesel price - baseline price) /
// truck MPG. The baseline is whatever reference price the FSC table was built against
// (commonly $1.20-1.25/gal historically) — configurable here since brokers vary.

export interface FSCVerificationInput {
  currentDieselPricePerGallon: number;
  baselineDieselPricePerGallon: number;
  truckMPG: number;
  tripMiles: number;
  quotedFSC: number;
}

export interface FSCVerificationResult {
  fairFSCPerMile: number;
  fairFSCTotal: number;
  quotedFSC: number;
  shortfall: number;
  isFair: boolean;
}

const FAIRNESS_TOLERANCE_PERCENT = 5;

export const verifyFuelSurcharge = (input: FSCVerificationInput): FSCVerificationResult => {
  if (input.truckMPG <= 0) {
    throw new Error('Truck MPG must be greater than zero.');
  }

  const priceDelta = Math.max(0, input.currentDieselPricePerGallon - input.baselineDieselPricePerGallon);
  const fairFSCPerMile = Number((priceDelta / input.truckMPG).toFixed(3));
  const fairFSCTotal = Number((fairFSCPerMile * input.tripMiles).toFixed(2));
  const shortfall = Number((fairFSCTotal - input.quotedFSC).toFixed(2));
  const tolerance = fairFSCTotal * (FAIRNESS_TOLERANCE_PERCENT / 100);
  const isFair = shortfall <= tolerance;

  return { fairFSCPerMile, fairFSCTotal, quotedFSC: input.quotedFSC, shortfall, isFair };
};
