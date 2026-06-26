import { sendLoadBookedSMS } from '../api/twilioConnector';
import { Load } from './workers-15x';

export interface BookingConfirmation {
  booked: boolean;
  confirmationId: string | null;
  brokerCreditScore: number;
  bookedAt: string | null;
  message: string;
}

export const executeBooking = async (
  load: Pick<Load, 'id' | 'origin' | 'destination' | 'rate'>,
  brokerCreditScore: number,
): Promise<BookingConfirmation> => {
  if (!Number.isFinite(brokerCreditScore) || brokerCreditScore < 0 || brokerCreditScore > 100) {
    throw new Error('Broker credit score must be between 0 and 100.');
  }

  if (brokerCreditScore < 70) {
    return {
      booked: false,
      confirmationId: null,
      brokerCreditScore,
      bookedAt: null,
      message: 'Broker credit score below PHI booking threshold.',
    };
  }

  const confirmationId = `PHI-${load.id}-${Date.now()}`;
  await sendLoadBookedSMS('+15550100111', {
    loadId: load.id,
    origin: `${load.origin.city}, ${load.origin.state}`,
    destination: `${load.destination.city}, ${load.destination.state}`,
    rate: load.rate,
  });

  return {
    booked: true,
    confirmationId,
    brokerCreditScore,
    bookedAt: new Date().toISOString(),
    message: `Load ${load.id} booked successfully.`,
  };
};
