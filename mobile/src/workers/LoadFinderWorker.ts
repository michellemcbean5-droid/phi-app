import { generateOutreachEmail } from './NegotiationStrategyWorker';
import { scoreLoad } from './LoadScoringWorker';
import { Load } from './workers-15x';

interface AxiosStyleResponse<T> {
  data: T;
}

interface AxiosStyleClient {
  get: <T>(url: string) => Promise<AxiosStyleResponse<T>>;
}

const datLoads: Load[] = [
  {
    id: 'DAT-101',
    source: 'DAT',
    equipmentType: 'Dry Van',
    brokerName: 'Blue Star Logistics',
    brokerRating: 4.7,
    origin: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797 },
    destination: { city: 'Atlanta', state: 'GA', latitude: 33.749, longitude: -84.388 },
    pickupDate: '2025-06-26',
    deliveryDate: '2025-06-27',
    rate: 2925,
    miles: 805,
    rpm: 3.63,
    totalMiles: 805,
    weightLbs: 41250,
  },
  {
    id: 'DAT-102',
    source: 'DAT',
    equipmentType: 'Reefer',
    brokerName: 'Cold Mile Freight',
    brokerRating: 4.8,
    origin: { city: 'Houston', state: 'TX', latitude: 29.7604, longitude: -95.3698 },
    destination: { city: 'El Paso', state: 'TX', latitude: 31.7619, longitude: -106.485 },
    pickupDate: '2025-06-26',
    deliveryDate: '2025-06-27',
    rate: 2100,
    miles: 744,
    rpm: 2.82,
    totalMiles: 744,
    weightLbs: 36000,
  },
];

const truckstopLoads: Load[] = [
  {
    id: 'TS-301',
    source: 'Truckstop',
    equipmentType: 'Dry Van',
    brokerName: 'Sunlane Brokerage',
    brokerRating: 4.2,
    origin: { city: 'Memphis', state: 'TN', latitude: 35.1495, longitude: -90.049 },
    destination: { city: 'Chicago', state: 'IL', latitude: 41.8781, longitude: -87.6298 },
    pickupDate: '2025-06-26',
    deliveryDate: '2025-06-27',
    rate: 1765,
    miles: 545,
    rpm: 3.24,
    totalMiles: 545,
    weightLbs: 39200,
  },
  {
    id: 'TS-302',
    source: 'Truckstop',
    equipmentType: 'Dry Van',
    brokerName: 'Budget Lane Carriers',
    brokerRating: 3.8,
    origin: { city: 'Nashville', state: 'TN', latitude: 36.1627, longitude: -86.7816 },
    destination: { city: 'Charlotte', state: 'NC', latitude: 35.2271, longitude: -80.8431 },
    pickupDate: '2025-06-26',
    deliveryDate: '2025-06-27',
    rate: 1350,
    miles: 410,
    rpm: 3.29,
    totalMiles: 410,
    weightLbs: 28500,
  },
];

const mockClient: AxiosStyleClient = {
  get: async <T,>(url: string): Promise<AxiosStyleResponse<T>> => {
    if (url.includes('dat')) {
      return { data: datLoads as T };
    }

    return { data: truckstopLoads as T };
  },
};

export const aggregateLoads = async (client: AxiosStyleClient = mockClient): Promise<Load[]> => {
  const [datResponse, truckstopResponse] = await Promise.all([
    client.get<Load[]>('https://mock.dat.com/loads'),
    client.get<Load[]>('https://mock.truckstop.com/loads'),
  ]);

  const filteredLoads = [...datResponse.data, ...truckstopResponse.data].filter(
    (load) => load.equipmentType === 'Dry Van' && load.brokerRating >= 4,
  );

  filteredLoads.forEach((load) => {
    const score = scoreLoad(load);
    if (score === 'Diamond' || score === 'Gold') {
      generateOutreachEmail(load, 'Balanced', score === 'Diamond' ? 'High' : 'Medium');
    }
  });

  return filteredLoads;
};
