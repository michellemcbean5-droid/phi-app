export interface DATLaneRate {
  originMarket: string;
  destinationMarket: string;
  averageRate: number;
  averageRpm: number;
  confidence: 'Low' | 'Medium' | 'High';
}

export interface DATSearchParams {
  origin: string;
  destination: string;
  equipmentType: 'Dry Van' | 'Reefer' | 'Flatbed';
}

const mockRateData: DATLaneRate[] = [
  {
    originMarket: 'Dallas, TX',
    destinationMarket: 'Atlanta, GA',
    averageRate: 2845,
    averageRpm: 3.64,
    confidence: 'High',
  },
  {
    originMarket: 'Memphis, TN',
    destinationMarket: 'Chicago, IL',
    averageRate: 1645,
    averageRpm: 3.1,
    confidence: 'Medium',
  },
  {
    originMarket: 'Houston, TX',
    destinationMarket: 'Phoenix, AZ',
    averageRate: 2320,
    averageRpm: 2.42,
    confidence: 'Medium',
  },
];

export const fetch15DayAverage = async (params: DATSearchParams): Promise<DATLaneRate> => {
  const matchedLane = mockRateData.find(
    (lane) =>
      lane.originMarket === params.origin &&
      lane.destinationMarket === params.destination &&
      params.equipmentType === 'Dry Van',
  );

  return matchedLane ?? {
    originMarket: params.origin,
    destinationMarket: params.destination,
    averageRate: 2100,
    averageRpm: 2.75,
    confidence: 'Low',
  };
};
