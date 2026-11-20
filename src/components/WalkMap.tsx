import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { legPath, onMap, SIDE_TRIP, sidePaths, walkPath } from '../data';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import type { Walk } from '../data/types';
import { useTheme } from '../theme';

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
};

/** Numbered pins in walking order with the route drawn between them. */
export const WalkMap = forwardRef<WalkMapHandle, Props>(function WalkMap({ walk, current = -1, visited = [], finished = false, isLocked, onSelect, showsUser = true, style, bottomInset = 0, mapType = 'standard', onUserPan }, ref) {
  const t = useTheme();
  const map = useRef<MapView>(null);
  const coords = useMemo(() => walk.stops.map((s) => ({ latitude: s.lat, longitude: s.lng })), [walk]);
  // Only stops her book map prints get a pin, so this map shows what her map shows.
  const mapCoords = useMemo(() => {
    const c = walk.stops.filter(onMap).map((s) => ({ latitude: s.lat, longitude: s.lng }));
    return c.length ? c : [{ latitude: 21.29, longitude: -157.82 }];
  }, [walk]);
  const reached = finished ? walk.stops.length - 1 : Math.max(-1, ...visited);
  const trail = useMemo(() => (reached > 0 ? walkPath(walk, reached) : []), [walk, reached]);
  // Her red route between stops where it was traced, so the line follows streets rather than cutting across.
  const routeCoords = useMemo(() => { const p = walkPath(walk); return p.length > 1 ? p : mapCoords; }, [walk, mapCoords]);
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
      <Polyline coordinates={routeCoords} strokeColor={t.dark ? '#7FD1C7' : '#0E6E74'} strokeWidth={4} lineDashPattern={[8, 6]} />
      {/* The part already walked, solid and bright over the dashed route, so the circuit fills in as you go. */}
      {trail.length > 1 ? <Polyline coordinates={trail} strokeColor="#3E8E5A" strokeWidth={6} /> : null}
      {sidePaths(walk).map((p, k) => <Polyline key={`side${k}`} coordinates={p} strokeColor={SIDE_TRIP} strokeWidth={3} lineDashPattern={[4, 6]} />)}
      {current >= 0 && current < coords.length - 1 && onMap(walk.stops[current]) && onMap(walk.stops[current + 1]) ? <Polyline coordinates={legPath(walk, current)} strokeColor={t.accent} strokeWidth={6} /> : null}
      {walk.stops.map((s, i) => {
        if (!onMap(s)) return null;
        const isCur = i === current;
        const done = visited.includes(i);
        const locked = isLocked?.(i);
        const bg = isCur ? t.accent : done ? t.leaf : locked ? '#8A9A9B' : s.side ? SIDE_TRIP : walk.color;
        return (
          <Marker key={s.id} coordinate={coords[i]} onPress={() => onSelect?.(i)} tracksViewChanges={false} zIndex={isCur ? 10 : 1} accessibilityLabel={`Stop ${s.n}, ${s.title}`}>
            <View style={[styles.pin, { backgroundColor: bg, transform: [{ scale: isCur ? 1.25 : 1 }] }]}>
              {locked ? <Ionicons name="lock-closed" size={11} color="#fff" /> : <Text style={styles.pinText}>{s.n}</Text>}
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
