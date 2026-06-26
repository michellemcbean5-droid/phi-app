export interface LoadBookedSMSDetails {
  loadId: string;
  origin: string;
  destination: string;
  rate: number;
}

export const sendLoadBookedSMS = async (
  driverPhone: string,
  loadDetails: LoadBookedSMSDetails,
): Promise<{ success: boolean; sid: string; message: string }> => {
  if (!driverPhone.trim()) {
    throw new Error('Driver phone number is required.');
  }

  return {
    success: true,
    sid: `SM-${loadDetails.loadId}-${Date.now()}`,
    message: `PHI booked load ${loadDetails.loadId} from ${loadDetails.origin} to ${loadDetails.destination} for $${loadDetails.rate.toFixed(2)}.`,
  };
};
