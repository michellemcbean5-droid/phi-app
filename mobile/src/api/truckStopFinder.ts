// Real truck parking, fuel stop, rest area, and weigh station data — powered by the
// free, keyless OpenStreetMap Overpass API. No paid data partnership required, unlike
// DAT/Truckstop load data — this is genuinely open data anyone can query.

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const EARTH_RADIUS_MILES = 3958.8;

export type TruckStopKind = 'Fuel / Truck Stop' | 'Truck Parking' | 'Rest Area' | 'Weigh Station';

export interface TruckStopPOI {
  id: string;
  name: string;
  kind: TruckStopKind;
  latitude: number;
  longitude: number;
  distanceMiles: number;
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const haversineMiles = (aLat: number, aLon: number, bLat: number, bLon: number): number => {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const classify = (tags: Record<string, string>): TruckStopKind | null => {
  if (tags.amenity === 'weighbridge') return 'Weigh Station';
  if (tags.highway === 'rest_area' || tags.highway === 'services') return 'Rest Area';
  if (tags.amenity === 'fuel' && (tags.hgv === 'yes' || tags.truck === 'yes')) return 'Fuel / Truck Stop';
  if (tags.amenity === 'fuel' && tags.brand) return 'Fuel / Truck Stop';
  if (tags.amenity === 'parking' && (tags.hgv === 'designated' || tags.hgv === 'yes')) return 'Truck Parking';
  return null;
};

export const findNearbyTruckStops = async (
  location: { latitude: number; longitude: number },
  radiusMiles = 30,
): Promise<TruckStopPOI[]> => {
  const radiusMeters = Math.round(radiusMiles * 1609.34);
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="fuel"](around:${radiusMeters},${location.latitude},${location.longitude});
      node["amenity"="parking"]["hgv"](around:${radiusMeters},${location.latitude},${location.longitude});
      node["highway"~"rest_area|services"](around:${radiusMeters},${location.latitude},${location.longitude});
      way["highway"~"rest_area|services"](around:${radiusMeters},${location.latitude},${location.longitude});
      node["amenity"="weighbridge"](around:${radiusMeters},${location.latitude},${location.longitude});
    );
    out center;
  `.trim();

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) throw new Error(`Overpass API ${response.status}`);

    const data = await response.json() as { elements: OverpassElement[] };

    const results: TruckStopPOI[] = [];
    for (const el of data.elements) {
      const tags = el.tags ?? {};
      const kind = classify(tags);
      if (!kind) continue;

      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) continue;

      results.push({
        id: `osm-${el.id}`,
        name: tags.name ?? tags.brand ?? kind,
        kind,
        latitude: lat,
        longitude: lon,
        distanceMiles: Number(haversineMiles(location.latitude, location.longitude, lat, lon).toFixed(1)),
      });
    }

    return results.sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 40);
  } catch {
    return [];
  }
};
