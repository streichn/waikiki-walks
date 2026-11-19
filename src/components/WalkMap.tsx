import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { onMap, routeLeg, walkPath } from '../data';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import type { Walk } from '../data/types';
import { useTheme } from '../theme';

export type WalkMapHandle = { focusStop: (i: number) => void; fitAll: () => void; recenter: (lat: number, lng: number) => void; follow: (lat: number, lng: number, heading?: number) => void };

type Props = {
  walk: Walk;
  current?: number;
  visited?: number[];
  isLocked?: (i: number) => boolean;
  onSelect?: (i: number) => void;
  showsUser?: boolean;
  style?: ViewStyle;
  bottomInset?: number;
  mapType?: 'standard' | 'satellite' | 'hybrid';
  onUserPan?: () => void;
};

/** Numbered pins in walking order with her book-map route drawn between them. */
export const WalkMap = forwardRef<WalkMapHandle, Props>(function WalkMap({ walk, current = -1, visited = [], isLocked, onSelect, showsUser = true, style, bottomInset = 0, mapType = 'standard', onUserPan }, ref) {
  const t = useTheme();
  const map = useRef<MapView>(null);
  const coords = useMemo(() => walk.stops.map((s) => ({ latitude: s.lat, longitude: s.lng })), [walk]);
  // Only stops her book map prints get a pin, so this map shows what her map shows.
  const mapCoords = useMemo(() => {
    const c = walk.stops.filter(onMap).map((s) => ({ latitude: s.lat, longitude: s.lng }));
    return c.length ? c : [{ latitude: 21.29, longitude: -157.82 }];
  }, [walk]);
  // Her red path from the book maps, so the line follows the streets she walks instead of cutting across blocks.
  const path = useMemo(() => (mapCoords.length > 1 ? walkPath(walk) : mapCoords), [walk, mapCoords]);
  const nextLeg = useMemo(() => {
    const a = walk.stops[current];
    const b = walk.stops[current + 1];
    if (!a || !b || !onMap(a) || !onMap(b)) return null;
    return routeLeg(walk.id, a, b) ?? [coords[current], coords[current + 1]];
  }, [walk, current, coords]);
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
      <Polyline coordinates={path} strokeColor={t.dark ? '#7FD1C7' : '#0E6E74'} strokeWidth={4} lineDashPattern={[8, 6]} />
      {nextLeg ? <Polyline coordinates={nextLeg} strokeColor={t.accent} strokeWidth={6} /> : null}
      {walk.stops.map((s, i) => {
        if (!onMap(s)) return null;
        const isCur = i === current;
        const done = visited.includes(i);
        const locked = isLocked?.(i);
        const bg = isCur ? t.accent : done ? t.leaf : locked ? '#8A9A9B' : walk.color;
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
