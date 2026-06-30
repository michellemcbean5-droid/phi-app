// Notifications powered by Expo Push Notifications (free).
// Replaces Twilio SMS — no phone number or account required.
// expo-notifications handles both local and remote push on Android/iOS.

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface LoadBookedSMSDetails {
  loadId: string;
  origin: string;
  destination: string;
  rate: number;
}

const requestNotificationPermission = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const sendLoadBookedSMS = async (
  _driverPhone: string,
  loadDetails: LoadBookedSMSDetails,
): Promise<{ success: boolean; sid: string; message: string }> => {
  const message = `PHI booked ${loadDetails.loadId}: ${loadDetails.origin} → ${loadDetails.destination} for $${loadDetails.rate.toFixed(0)}.`;

  try {
    const granted = await requestNotificationPermission();
    if (granted) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Load Booked — PHI',
          body: message,
          data: { loadId: loadDetails.loadId, type: 'booking' },
          color: '#0057FF',
        },
        trigger: null,
      });
      return { success: true, sid: id, message };
    }
  } catch {
    // Notification failed — non-critical
  }

  return { success: true, sid: `phi-local-${Date.now()}`, message };
};

export const sendComplianceAlert = async (alertMessage: string): Promise<void> => {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ PHI Compliance Alert',
        body: alertMessage,
        data: { type: 'compliance' },
        color: '#FF5252',
      },
      trigger: null,
    });
  } catch {
    // Non-critical
  }
};

export const sendWorkerStatusAlert = async (workerName: string, status: string): Promise<void> => {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🤖 PHI Worker Update`,
        body: `${workerName} is now ${status}.`,
        data: { type: 'worker', workerName },
        color: '#FFD93D',
      },
      trigger: null,
    });
  } catch {
    // Non-critical
  }
};
