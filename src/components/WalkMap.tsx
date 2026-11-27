import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { legPath, onMap, PIN, PIN_HERE, ROUTE_DOTS, SIDE_TRIP, sidePaths, TRAIL, walkPath } from '../data';
import { alongLine, lineUpTo } from '../lib/polyline';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import type { Walk } from '../data/types';
import { useTheme } from '../theme';
import { MAX_PIN_SCALE } from './ui';

export type WalkMapHandle = { focusStop: (i: number) => void; fitAll: () => void; recenter: (lat: number, lng: number) => void; follow: (lat: number, lng: number, heading?: number) => void; zoomBy: (dir: 1 | -1) => void };

type Props = {
  walk: Walk;
  current?: number;
  visited?: number[];
  finished?: boolean; // a completed walk: the whole route shows as walked
  isLocked?: (i: number) => boolean;
  onSelect?: (i: number) => void;
  showsUser?: boolean;
  style?: ViewStyle;
  bottomInset?: number;
  mapType?: 'standard' | 'satellite' | 'hybrid';
  onUserPan?: () => void;
  me?: { lat: number; lng: number } | null; // the walker, for filling in the leg being walked
  limitTo?: number; // last stop index to show (before unlocking, only the stops you can open)
};

/** Numbered pins in walking order with the route drawn between them. */
export const WalkMap = forwardRef<WalkMapHandle, Props>(function WalkMap({ walk, current = -1, visited = [], finished = false, isLocked, onSelect, showsUser = true, style, bottomInset = 0, mapType = 'standard', onUserPan, me, limitTo }, ref) {
  const t = useTheme();
  const map = useRef<MapView>(null);
  const coords = useMemo(() => walk.stops.map((s) => ({ latitude: s.lat, longitude: s.lng })), [walk]);
  // Only stops her book map prints get a pin, so this map shows what her map shows.
  const lim = limitTo ?? walk.stops.length - 1;
  const mapCoords = useMemo(() => {
    const c = walk.stops.filter((s, i) => onMap(s) && i <= lim).map((s) => ({ latitude: s.lat, longitude: s.lng }));
    return c.length ? c : [{ latitude: 21.29, longitude: -157.82 }];
  }, [walk, lim]);
  const reached = finished ? walk.stops.length - 1 : Math.max(-1, ...visited);
  const trail = useMemo(() => (reached > 0 ? walkPath(walk, reached) : []), [walk, reached]);
  // The leg toward the current stop fills in along her route up to the walker's nearest point on it, never shrinking.
  const legDone = useRef<Record<string, number>>({});
  let part: { latitude: number; longitude: number }[] = [];
  if (current >= 1 && !visited.includes(current)) {
    const leg = legPath(walk, current - 1);
    if (leg.length > 1) {
      const k = Math.cos((21.3 * Math.PI) / 180);
      const xy = leg.map((c) => ({ x: c.longitude * 111320 * k, y: c.latitude * 110574 }));
      const key = `${walk.id}:${current - 1}`;
      if (me) {
        const r = alongLine(xy, me.lng * 111320 * k, me.lat * 110574);
        if (r.d <= 40 && r.s > (legDone.current[key] ?? 0)) legDone.current[key] = r.s;
      }
      const sd = legDone.current[key] ?? 0;
      if (sd > 0) part = lineUpTo(xy, sd).map((q) => ({ latitude: q.y / 110574, longitude: q.x / (111320 * k) }));
    }
  }
  // Her red route between stops where it was traced, so the line follows streets rather than cutting across.
  const routeCoords = useMemo(() => {
    const p = lim >= walk.stops.length - 1 ? walkPath(walk) : lim > 0 ? walkPath(walk, lim) : [];
    return p.length > 1 ? p : mapCoords;
  }, [walk, mapCoords, lim]);
  const initial: Region = useMemo(() => {
    const lats = mapCoords.map((c) => c.latitude);
    const lngs = mapCoords.map((c) => c.longitude);
    const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    return { latitude: lat, longitude: lng, latitudeDelta: Math.max(0.006, (Math.max(...lats) - Math.min(...lats)) * 1.5), longitudeDelta: Math.max(0.006, (Math.max(...lngs) - Math.min(...lngs)) * 1.5) };
  }, [mapCoords]);

  const padding = { top: 80, right: 50, bottom: 60 + bottomInset, left: 50 };
  useImperativeHandle(ref, () => ({
    focusStop: (i) => {
      const c = walk.stops[i] && onMap(walk.stops[i]) ? coords[i] : undefined;
      if (c) map.current?.animateCamera({ center: c, zoom: 17 }, { duration: 600 });
    },
    // Apple Maps cameras use altitude, Google Maps cameras use zoom.
    zoomBy: async (dir) => {
      const c = await map.current?.getCamera();
      if (!c) return;
      if (c.altitude) map.current?.animateCamera({ altitude: c.altitude * (dir > 0 ? 0.5 : 2) }, { duration: 250 });
      else if (c.zoom !== undefined) map.current?.animateCamera({ zoom: c.zoom + dir }, { duration: 250 });
    },
    fitAll: () => map.current?.fitToCoordinates(mapCoords, { edgePadding: padding, animated: true }),
    recenter: (lat, lng) => map.current?.animateCamera({ center: { latitude: lat, longitude: lng }, zoom: 17, heading: 0 }, { duration: 500 }),
    // Follow mode keeps the blue dot centered; with a heading the map rotates to face where you face.
    follow: (lat, lng, heading) =>
      map.current?.animateCamera({ center: { latitude: lat, longitude: lng }, zoom: 18, ...(heading !== undefined ? { heading, pitch: 35 } : { heading: 0, pitch: 0 }) }, { duration: 400 }),
  }));

  return (
    <MapView
      ref={map}
      style={[StyleSheet.absoluteFill, style]}
      initialRegion={initial}
      showsUserLocation={showsUser}
      mapType={mapType}
      onPanDrag={onUserPan}
      showsMyLocationButton={false}
      showsCompass
      showsPointsOfInterests={false}
      userInterfaceStyle={t.dark ? 'dark' : 'light'}
      mapPadding={{ top: 0, left: 0, right: 0, bottom: bottomInset }}
      onMapReady={() => map.current?.fitToCoordinates(mapCoords, { edgePadding: padding, animated: false })}
    >
      {/* Her route as on her map, a dotted yellow line; the part walked fills in solid blue over it (Nick, 21 Nov 2026) */}
      <Polyline coordinates={routeCoords} strokeColor={ROUTE_DOTS} strokeWidth={5} lineDashPattern={[1, 9]} lineCap="round" />
      {/* The part already walked, solid and bright over the dashed route, so the circuit fills in as you go. */}
      {trail.length > 1 ? <Polyline coordinates={trail} strokeColor={TRAIL} strokeWidth={6} /> : null}
      {sidePaths(walk).filter((_p, k) => walk.stops.indexOf(walk.stops.filter((s) => s.side && onMap(s))[k]) <= lim).map((p, k) => <Polyline key={`side${k}`} coordinates={p} strokeColor={SIDE_TRIP} strokeWidth={3} lineDashPattern={[4, 6]} />)}
      {part.length > 1 ? <Polyline coordinates={part} strokeColor={TRAIL} strokeWidth={6} /> : null}
      {walk.stops.map((s, i) => {
        if (!onMap(s) || i > lim) return null;
        const isCur = i === current;
        const done = visited.includes(i);
        const locked = isLocked?.(i);
        // One color for every stop, red for the current one, purple for her side trips (Nick, 21 Nov 2026).
        const bg = isCur ? PIN_HERE : s.side ? SIDE_TRIP : PIN;
        return (
          <Marker key={s.id} coordinate={coords[i]} onPress={() => onSelect?.(i)} tracksViewChanges={false} zIndex={isCur ? 10 : 1} accessibilityLabel={`Stop ${s.n}, ${s.title}`}>
            <View style={[styles.pin, { backgroundColor: bg }]}>
              {locked ? <Ionicons name="lock-closed" size={11} color="#fff" /> : <Text maxFontSizeMultiplier={MAX_PIN_SCALE} style={styles.pinText}>{s.n}</Text>}
            </View>
            <View style={[styles.tail, { borderTopColor: bg }]} />
          </Marker>
        );
      })}
    </MapView>
  );
});

const styles = StyleSheet.create({
  pin: { minWidth: 28, height: 28, borderRadius: 14, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  pinText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  tail: { alignSelf: 'center', width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
});
