// Freight Procurement sub-task: file and collect on valid TONU (Truck Order Not Used)
// claims when a load cancels at the dock. Industry standard: a broker owes a flat TONU
// fee once the driver has already committed — physically checked in at pickup — and the
// load falls through anyway. A cancellation before the driver ever arrived isn't a valid
// TONU claim; that's just a cancelled load, no cost was actually incurred.

export interface TONUEligibilityInput {
  bookingState: string;
  pickupCheckInISO: string | null | undefined;
  standardTONURate: number;
}

export interface TONUEligibility {
  eligible: boolean;
  claimAmount: number;
  reason: string;
}

export const evaluateTONUEligibility = (input: TONUEligibilityInput): TONUEligibility => {
  if (input.bookingState !== 'cancelled') {
    return { eligible: false, claimAmount: 0, reason: 'Load has not been cancelled.' };
  }

  if (!input.pickupCheckInISO) {
    return {
      eligible: false,
      claimAmount: 0,
      reason: 'No TONU claim — you had not checked in at pickup yet when this was cancelled.',
    };
  }

  return {
    eligible: true,
    claimAmount: input.standardTONURate,
    reason: `You checked in at pickup before the broker cancelled this load — eligible for a $${input.standardTONURate.toFixed(0)} TONU fee.`,
  };
};
