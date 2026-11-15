import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, T, tap } from '../../components/ui';
import { walks } from '../../data';
import type { Walk } from '../../data/types';
import { useTheme } from '../../theme';

/** Every walk's starting point on one map. Tap a walk to see its stops. */
export default function Explore() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [sel, setSel] = useState<Walk | null>(null);
  const shown = sel ? [sel] : walks;
  const region = useMemo(() => ({ latitude: 21.285, longitude: -157.82, latitudeDelta: 0.065, longitudeDelta: 0.05 }), []);

  return (
    <View style={{ flex: 1 }}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} showsUserLocation userInterfaceStyle={t.dark ? 'dark' : 'light'} showsPointsOfInterests={false}>
        {shown.flatMap((w) =>
          (sel ? w.stops : w.stops.slice(0, 1)).map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.lat, longitude: s.lng }}
              onPress={() => {
                tap();
                setSel(w);
              }}
              tracksViewChanges={false}
            >
              <View style={[styles.pin, { backgroundColor: w.color }]}>
                <Text style={styles.pinText}>{sel ? s.n : w.id}</Text>
              </View>
            </Marker>
          )),
        )}
      </MapView>

      <View style={[styles.top, { top: insets.top + 8, alignItems: 'center' }]}>
        {sel ? (
          <Pressable onPress={() => setSel(null)} style={[styles.chip, { backgroundColor: t.card, flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
            <Ionicons name="chevron-back" size={16} color={t.primary} />
            <T style={{ color: t.text, fontFamily: t.font.bodyBold, fontSize: 13 }}>All walks</T>
          </Pressable>
        ) : (
          <View style={[styles.chip, { backgroundColor: t.card }]}>
            <T style={{ color: t.text, fontFamily: t.font.bodySemi, fontSize: 13 }}>Tap a walk to see its stops</T>
          </View>
        )}
      </View>

      {sel ? (
        <Card style={[styles.sheet, { bottom: insets.bottom + 150 }]}>
          <T variant="label">Walk {sel.id}</T>
          <T variant="title" style={{ fontSize: 22 }}>
            {sel.title}
          </T>
          {sel.theme ? <T variant="small">{sel.theme}</T> : null}
          <Pressable onPress={() => router.push(`/walk/${sel.id}`)} style={[styles.open, { backgroundColor: t.primary }]}>
            <T style={{ color: t.primaryText, fontFamily: t.font.bodyBold }}>Open walk</T>
            <Ionicons name="arrow-forward" size={18} color={t.primaryText} />
          </Pressable>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  pin: { minWidth: 30, height: 30, borderRadius: 15, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  pinText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  sheet: { position: 'absolute', left: 14, right: 14, gap: 4 },
  open: { marginTop: 10, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 22 },
});
