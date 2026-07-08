// Real route hazards from two free, keyless sources:
// - National Weather Service active alerts (api.weather.gov) — US government, no key
// - OpenStreetMap Overpass — same free data source truckStopFinder.ts already uses
// No paid traffic-incident API is wired up; this covers weather and weigh stations,
// which is what "hazard" concretely means without a paid data partnership.

import { Coordinates } from './googleMapsConnector';

export type HazardKind = 'Weather' | 'Weigh Station';
export type HazardSeverity = 'info' | 'warning' | 'severe';

export interface RouteHazard {
  id: string;
  kind: HazardKind;
  title: string;
  detail: string;
  latitude: number;
  longitude: number;
  severity: HazardSeverity;
}

const NWS_ALERTS_ENDPOINT = 'https://api.weather.gov/alerts/active';
const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const WEIGH_STATION_RADIUS_METERS = 8046; // ~5 miles

const severityFromNWS = (severity: string): HazardSeverity => {
  if (severity === 'Extreme' || severity === 'Severe') return 'severe';
  if (severity === 'Moderate') return 'warning';
  return 'info';
};

const fetchWeatherAlertsNear = async (point: Coordinates): Promise<RouteHazard[]> => {
  try {
    const url = `${NWS_ALERTS_ENDPOINT}?point=${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PHI Trucking App (support@princehaulintelligence.com)', Accept: 'application/geo+json' },
    });
    if (!response.ok) return [];

    const data = await response.json() as {
      features: Array<{ id: string; properties: { event: string; headline: string; severity: string } }>;
    };

    return data.features.map((f) => ({
      id: `wx-${f.id}`,
      kind: 'Weather' as const,
      title: f.properties.event,
      detail: f.properties.headline,
      latitude: point.latitude,
      longitude: point.longitude,
      severity: severityFromNWS(f.properties.severity),
    }));
  } catch {
    return [];
  }
};

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const fetchWeighStationsAlongRoute = async (coordinates: Coordinates[]): Promise<RouteHazard[]> => {
  if (coordinates.length === 0) return [];

  const sampleCount = Math.min(6, coordinates.length);
  const step = Math.max(1, Math.floor(coordinates.length / sampleCount));
  const samples = coordinates.filter((_, i) => i % step === 0);

  const clauses = samples
    .map((p) => `node["amenity"="weighbridge"](around:${WEIGH_STATION_RADIUS_METERS},${p.latitude},${p.longitude});`)
    .join('\n');
  const query = `[out:json][timeout:20];(${clauses});out center;`;

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) return [];

    const data = await response.json() as { elements: OverpassElement[] };
    const seen = new Set<number>();
    const results: RouteHazard[] = [];

    for (const el of data.elements) {
      if (seen.has(el.id)) continue;
      seen.add(el.id);
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) continue;

      results.push({
        id: `weigh-${el.id}`,
        kind: 'Weigh Station',
        title: el.tags?.name ?? 'Weigh Station',
        detail: 'CDL weigh station along this route.',
        latitude: lat,
        longitude: lon,
        severity: 'info',
      });
    }

    return results;
  } catch {
    return [];
  }
};

/** Real hazards along a route: active NWS weather alerts + weigh stations from OSM. */
export const findRouteHazards = async (coordinates: Coordinates[]): Promise<RouteHazard[]> => {
  if (coordinates.length === 0) return [];

  const weatherSampleCount = Math.min(3, coordinates.length);
  const weatherStep = Math.max(1, Math.floor(coordinates.length / weatherSampleCount));
  const weatherSamples = coordinates.filter((_, i) => i % weatherStep === 0);

  const [weatherResults, weighResults] = await Promise.all([
    Promise.all(weatherSamples.map(fetchWeatherAlertsNear)).then((arr) => arr.flat()),
    fetchWeighStationsAlongRoute(coordinates),
  ]);

  const seenWeather = new Set<string>();
  const dedupedWeather = weatherResults.filter((h) => {
    if (seenWeather.has(h.id)) return false;
    seenWeather.add(h.id);
    return true;
  });

  return [...dedupedWeather, ...weighResults];
};
