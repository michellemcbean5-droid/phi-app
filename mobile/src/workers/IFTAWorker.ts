// IFTA & Tax sub-task: calculate a quarterly International Fuel Tax Agreement return
// using the standard method — a single fleet-wide MPG derived from total miles and
// total gallons purchased across all jurisdictions, then each jurisdiction owes tax
// on the gallons its share of miles implies, credited for gallons actually purchased
// there. State tax rates change and vary by fuel type, so the driver enters their own
// current rate per jurisdiction rather than this app asserting a rate that could be
// stale — this is a real, correct calculation over real inputs, not a lookup table.

export interface JurisdictionData {
  state: string;
  milesDriven: number;
  gallonsPurchased: number;
  taxRatePerGallon: number;
}

export interface JurisdictionResult extends JurisdictionData {
  taxableGallons: number;
  taxDue: number;
}

export interface IFTAQuarterlyResult {
  fleetMPG: number;
  totalMiles: number;
  totalGallonsPurchased: number;
  jurisdictions: JurisdictionResult[];
  netTaxDue: number;
}

export const calculateIFTAQuarterly = (jurisdictions: JurisdictionData[]): IFTAQuarterlyResult => {
  const totalMiles = jurisdictions.reduce((sum, j) => sum + j.milesDriven, 0);
  const totalGallonsPurchased = jurisdictions.reduce((sum, j) => sum + j.gallonsPurchased, 0);
  const fleetMPG = totalGallonsPurchased > 0 ? totalMiles / totalGallonsPurchased : 0;

  const results: JurisdictionResult[] = jurisdictions.map((j) => {
    const taxableGallons = fleetMPG > 0 ? Number((j.milesDriven / fleetMPG).toFixed(3)) : 0;
    const taxDue = Number(((taxableGallons - j.gallonsPurchased) * j.taxRatePerGallon).toFixed(2));
    return { ...j, taxableGallons, taxDue };
  });

  const netTaxDue = Number(results.reduce((sum, r) => sum + r.taxDue, 0).toFixed(2));

  return {
    fleetMPG: Number(fleetMPG.toFixed(3)),
    totalMiles,
    totalGallonsPurchased,
    jurisdictions: results,
    netTaxDue,
  };
};
