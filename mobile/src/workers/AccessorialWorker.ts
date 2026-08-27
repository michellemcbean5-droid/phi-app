// Freight Procurement sub-task: enforce collection of accessorial charges (driver
// assist, extra stops, tarp fees, lumper fees) — the driver logs what they actually
// did, and this becomes part of what's billed, instead of being quietly absorbed as
// unpaid extra work.

export type AccessorialType = 'Extra Stop' | 'Driver Assist' | 'Tarping' | 'Lumper Fee' | 'Pallet Jack';

export const STANDARD_ACCESSORIAL_RATES: Record<AccessorialType, number> = {
  'Extra Stop': 75,
  'Driver Assist': 50,
  'Tarping': 100,
  'Lumper Fee': 65,
  'Pallet Jack': 25,
};

export interface AccessorialCharge {
  type: AccessorialType;
  amount: number;
  loggedAt: string;
}

export const totalAccessorialCharges = (charges: AccessorialCharge[]): number =>
  Number(charges.reduce((sum, c) => sum + c.amount, 0).toFixed(2));
