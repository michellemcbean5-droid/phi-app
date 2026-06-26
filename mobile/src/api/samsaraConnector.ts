export interface DriverAvailability {
  driverId: string;
  availableDriveHours: number;
  availableOnDutyHours: number;
  cycleHoursRemaining: number;
  status: 'available' | 'limited' | 'out-of-hours';
  lastUpdated: string;
}

export const fetchHOSData = async (driverId: string): Promise<DriverAvailability> => {
  if (!driverId.trim()) {
    throw new Error('Driver ID is required to fetch HOS data.');
  }

  const availableDriveHours = 8.5;
  const availableOnDutyHours = 10.25;
  const cycleHoursRemaining = 32.75;

  return {
    driverId,
    availableDriveHours,
    availableOnDutyHours,
    cycleHoursRemaining,
    status: availableDriveHours < 2 ? 'out-of-hours' : availableDriveHours < 5 ? 'limited' : 'available',
    lastUpdated: new Date().toISOString(),
  };
};
