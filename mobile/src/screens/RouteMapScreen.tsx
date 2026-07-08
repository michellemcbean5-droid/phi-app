// Real route map — free OpenStreetMap tiles rendered via Leaflet inside a WebView (no
// Google Maps API key required). Shows the actual route geometry, real hazards along it
// (active NWS weather alerts + weigh stations from OpenStreetMap), and — if a hazard sits
// on the primary route and a safer alternate exists — a one-tap reroute suggestion.
// Rerouting always requires the driver's confirmation; a truck's route should never
// silently change while someone may be driving.

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Coordinates, fetchRouteGeometry, RouteOption } from '../api/googleMapsConnector';
import { findRouteHazards, RouteHazard } from '../api/hazardFinder';

type RouteMapRouteProp = RouteProp<RootStackParamList, 'RouteMap'>;

const SEVERITY_COLOR: Record<RouteHazard['severity'], string> = {
  info: '#7EA5FF',
  warning: PHI_COLORS.sunshineYellow,
  severe: '#FF5252',
};

const buildMapHtml = (routes: RouteOption[], selectedIndex: number, hazards: RouteHazard[], origin: Coordinates, destination: Coordinates): string => {
  const routesJson = JSON.stringify(routes.map((r) => r.coordinates.map((c) => [c.latitude, c.longitude])));
  const hazardsJson = JSON.stringify(hazards.map((h) => ({ lat: h.latitude, lon: h.longitude, color: SEVERITY_COLOR[h.severity], title: h.title, detail: h.detail })));
  const originJson = JSON.stringify([origin.latitude, origin.longitude]);
  const destJson = JSON.stringify([destination.latitude, destination.longitude]);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html,body,#map{height:100%;margin:0;padding:0;background:#0B1A33;}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const routes = ${routesJson};
    const hazards = ${hazardsJson};
    const origin = ${originJson};
    const dest = ${destJson};
    const selectedIndex = ${selectedIndex};

    const map = L.map('map', { zoomControl: true }).setView(origin, 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const bounds = [];
    routes.forEach((coords, i) => {
      const isSelected = i === selectedIndex;
      const line = L.polyline(coords, {
        color: isSelected ? '#0057FF' : '#7F8FB3',
        weight: isSelected ? 5 : 3,
        opacity: isSelected ? 0.95 : 0.55,
        dashArray: isSelected ? null : '6 8',
      }).addTo(map);
      coords.forEach((p) => bounds.push(p));
    });

    L.marker(origin, { title: 'Origin' }).addTo(map).bindPopup('Origin');
    L.marker(dest, { title: 'Destination' }).addTo(map).bindPopup('Destination');

    hazards.forEach((h) => {
      L.circleMarker([h.lat, h.lon], {
        radius: 8,
        color: h.color,
        fillColor: h.color,
        fillOpacity: 0.85,
        weight: 2,
      }).addTo(map).bindPopup('<b>' + h.title + '</b><br/>' + h.detail);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  </script>
</body>
</html>`;
};

export default function RouteMapScreen() {
  const { params } = useRoute<RouteMapRouteProp>();
  const origin: Coordinates = { latitude: params.originLat, longitude: params.originLon };
  const destination: Coordinates = { latitude: params.destLat, longitude: params.destLon };

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [hazardsByRoute, setHazardsByRoute] = useState<RouteHazard[][]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rerouteOffered, setRerouteOffered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      setLoading(true);
      const fetchedRoutes = await fetchRouteGeometry(origin, destination);

      if (fetchedRoutes.length === 0) {
        if (!cancelled) setLoading(false);
        return;
      }

      const hazardsPerRoute = await Promise.all(fetchedRoutes.map((r) => findRouteHazards(r.coordinates)));
      if (cancelled) return;

      setRoutes(fetchedRoutes);
      setHazardsByRoute(hazardsPerRoute);

      const primaryHazardScore = hazardsPerRoute[0]?.filter((h) => h.severity !== 'info').length ?? 0;
      if (primaryHazardScore > 0 && fetchedRoutes.length > 1) {
        const altScores = hazardsPerRoute.slice(1).map((h) => h.filter((x) => x.severity !== 'info').length);
        const bestAltIndex = altScores.indexOf(Math.min(...altScores));
        if (altScores[bestAltIndex] < primaryHazardScore) {
          setRerouteOffered(true);
        }
      }

      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.originLat, params.originLon, params.destLat, params.destLon]);

  const selectedHazards = useMemo(() => hazardsByRoute[selectedIndex] ?? [], [hazardsByRoute, selectedIndex]);
  const selectedRoute = routes[selectedIndex];
  const safestIndex = useMemo(() => {
    if (hazardsByRoute.length === 0) return 0;
    const scores = hazardsByRoute.map((hz) => hz.filter((h) => h.severity !== 'info').length);
    return scores.indexOf(Math.min(...scores));
  }, [hazardsByRoute]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.loadingText}>Loading route and checking for hazards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (routes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <Ionicons name="map-outline" size={40} color="#7F8FB3" />
          <Text style={styles.loadingText}>
            Route map needs a free OpenRouteService key set up in Settings → My API Keys to draw real route geometry.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.mapWrap}>
        <WebView
          originWhitelist={['*']}
          source={{ html: buildMapHtml(routes, selectedIndex, selectedHazards, origin, destination) }}
          style={styles.map}
        />
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        {rerouteOffered && safestIndex !== selectedIndex && (
          <View style={styles.rerouteBanner}>
            <Ionicons name="alert-circle" size={20} color={PHI_COLORS.charcoalBlack} />
            <Text style={styles.rerouteText}>
              A safer route is available with fewer hazards ({hazardsByRoute[safestIndex]?.filter((h) => h.severity !== 'info').length ?? 0} vs {selectedHazards.filter((h) => h.severity !== 'info').length}).
            </Text>
            <TouchableOpacity style={styles.rerouteButton} onPress={() => setSelectedIndex(safestIndex)}>
              <Text style={styles.rerouteButtonText}>Switch Route</Text>
            </TouchableOpacity>
          </View>
        )}

        {routes.length > 1 && (
          <View style={styles.routeSwitchRow}>
            {routes.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.routeChip, i === selectedIndex && styles.routeChipActive]}
                onPress={() => setSelectedIndex(i)}
              >
                <Text style={[styles.routeChipText, i === selectedIndex && styles.routeChipTextActive]}>
                  Route {i + 1}: {r.distanceMiles} mi
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedRoute && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {selectedRoute.distanceMiles} miles • {Math.round(selectedRoute.durationMinutes / 60)}h {selectedRoute.durationMinutes % 60}m
            </Text>
          </View>
        )}

        <Text style={styles.hazardsTitle}>
          {selectedHazards.length === 0 ? 'No hazards detected on this route' : `${selectedHazards.length} hazard${selectedHazards.length === 1 ? '' : 's'} along this route`}
        </Text>
        {selectedHazards.map((h) => (
          <View key={h.id} style={styles.hazardRow}>
            <View style={[styles.hazardDot, { backgroundColor: SEVERITY_COLOR[h.severity] }]} />
            <View style={styles.hazardTextWrap}>
              <Text style={styles.hazardTitle}>{h.title}</Text>
              <Text style={styles.hazardDetail}>{h.detail}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText: { color: '#A8B7D8', textAlign: 'center', fontSize: 13, lineHeight: 20 },
  mapWrap: { height: '45%', backgroundColor: '#0B1A33' },
  map: { flex: 1 },
  panel: { flex: 1 },
  panelContent: { padding: 16, gap: 12 },
  rerouteBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 14, padding: 14, flexWrap: 'wrap' },
  rerouteText: { flex: 1, flexShrink: 1, color: PHI_COLORS.charcoalBlack, fontSize: 12, fontWeight: '700' },
  rerouteButton: { backgroundColor: PHI_COLORS.charcoalBlack, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  rerouteButtonText: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 12 },
  routeSwitchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  routeChip: { backgroundColor: PHI_COLORS.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#29508C' },
  routeChipActive: { backgroundColor: PHI_COLORS.sunshineYellow, borderColor: PHI_COLORS.sunshineYellow },
  routeChipText: { color: '#D7E3FF', fontSize: 12, fontWeight: '700' },
  routeChipTextActive: { color: PHI_COLORS.charcoalBlack },
  summaryCard: { backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14 },
  summaryText: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15 },
  hazardsTitle: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 14, marginTop: 4 },
  hazardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: PHI_COLORS.card, borderRadius: 12, padding: 12 },
  hazardDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  hazardTextWrap: { flex: 1, flexShrink: 1 },
  hazardTitle: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 13 },
  hazardDetail: { color: '#A8B7D8', fontSize: 12, marginTop: 2, lineHeight: 16 },
});
