import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import type { Walk } from '../data/types';
import { useTheme } from '../theme';

export type WalkMapHandle = { focusStop: (i: number) => void; fitAll: () => void; recenter: (lat: number, lng: number) => void };

type Props = {
  walk: Walk;
  current?: number;
  visited?: number[];
  isLocked?: (i: number) => boolean;
  onSelect?: (i: number) => void;
  showsUser?: boolean;
  style?: ViewStyle;
  bottomInset?: number;
};

/** Numbered pins in walking order with the route drawn between them. */
export const WalkMap = forwardRef<WalkMapHandle, Props>(function WalkMap({ walk, current = -1, visited = [], isLocked, onSelect, showsUser = true, style, bottomInset = 0 }, ref) {
  const t = useTheme();
  const map = useRef<MapView>(null);
  const coords = useMemo(() => walk.stops.map((s) => ({ latitude: s.lat, longitude: s.lng })), [walk]);
  const initial: Region = useMemo(() => {
    const lats = coords.map((c) => c.latitude);
    const lngs = coords.map((c) => c.longitude);
    const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    return { latitude: lat, longitude: lng, latitudeDelta: Math.max(0.006, (Math.max(...lats) - Math.min(...lats)) * 1.5), longitudeDelta: Math.max(0.006, (Math.max(...lngs) - Math.min(...lngs)) * 1.5) };
  }, [coords]);

  const padding = { top: 80, right: 50, bottom: 60 + bottomInset, left: 50 };
  useImperativeHandle(ref, () => ({
    focusStop: (i) => {
      const c = coords[i];
      if (c) map.current?.animateCamera({ center: c, zoom: 17 }, { duration: 600 });
    },
    fitAll: () => map.current?.fitToCoordinates(coords, { edgePadding: padding, animated: true }),
    recenter: (lat, lng) => map.current?.animateCamera({ center: { latitude: lat, longitude: lng }, zoom: 17 }, { duration: 500 }),
  }));

  return (
    <MapView
      ref={map}
      style={[StyleSheet.absoluteFill, style]}
      initialRegion={initial}
      showsUserLocation={showsUser}
      showsMyLocationButton={false}
      showsCompass
      showsPointsOfInterests={false}
      userInterfaceStyle={t.dark ? 'dark' : 'light'}
      mapPadding={{ top: 0, left: 0, right: 0, bottom: bottomInset }}
      onMapReady={() => map.current?.fitToCoordinates(coords, { edgePadding: padding, animated: false })}
    >
      <Polyline coordinates={coords} strokeColor={t.dark ? '#7FD1C7' : '#0E6E74'} strokeWidth={4} lineDashPattern={[8, 6]} />
      {current >= 0 && current < coords.length - 1 ? <Polyline coordinates={[coords[current], coords[current + 1]]} strokeColor={t.accent} strokeWidth={6} /> : null}
      {walk.stops.map((s, i) => {
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
