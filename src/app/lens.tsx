import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, T } from '../components/ui';
import { photo } from '../data';
import { canOpenStop, useIsPro } from '../lib/access';
import { formatDistance } from '../lib/geo';
import { candidatesInView, identifyPhoto, type LensCandidate, visionAvailable } from '../lib/lens';
import { speakShort } from '../lib/narration';
import { useSettings } from '../store';
import { useTheme } from '../theme';

/**
 * Point the phone at something. The live overlay lists the book's stops in front of you
 * using GPS + compass. Tapping the shutter asks the vision service (when configured) to
 * confirm which one is in the photo.
 */
export default function Lens() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const units = useSettings((s) => s.units);
  const isPro = useIsPro();
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [cands, setCands] = useState<LensCandidate[]>([]);
  const [result, setResult] = useState<{ c: LensCandidate | null; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let a: Location.LocationSubscription | undefined;
    let b: Location.LocationSubscription | undefined;
    (async () => {
      if (!perm?.granted) await requestPerm();
      const lp = await Location.requestForegroundPermissionsAsync();
      if (lp.status !== 'granted') return;
      a = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 3 }, (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }));
      b = await Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading));
    })();
    return () => {
      a?.remove();
      b?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pos) setCands(candidatesInView(pos, heading));
  }, [pos, heading]);

  const shoot = async () => {
    if (!cam.current) return;
    setBusy(true);
    try {
      const pic = await cam.current.takePictureAsync({ base64: visionAvailable, quality: 0.5, skipProcessing: true });
      const r = await identifyPhoto(pic?.base64 ?? '', cands);
      setResult({ c: cands.find((c) => c.stop.id === r.stopId) ?? null, reason: r.reason });
    } catch (e) {
      setResult({ c: cands[0] ?? null, reason: 'Matched by location and direction.' });
    } finally {
      setBusy(false);
    }
  };

  const open = (c: LensCandidate) => {
    const idx = c.walk.stops.findIndex((s) => s.id === c.stop.id);
    if (!canOpenStop(c.walk.id, idx, isPro)) return router.replace('/paywall');
    router.replace(`/walk/${c.walk.id}?stop=${idx}`);
  };

  if (!perm?.granted) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <Ionicons name="camera" size={48} color={t.primary} />
        <T style={{ textAlign: 'center', marginVertical: 12 }}>Allow the camera so you can point it at a landmark.</T>
        <Button label="Allow camera" onPress={requestPerm} />
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <T style={{ color: t.primary }}>Not now</T>
        </Pressable>
      </View>
    );
  }

  const top = result?.c ?? cands[0];
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" />
      <View style={[styles.reticle]} pointerEvents="none" />
      <View style={[styles.topRow, { top: insets.top + 8 }]}>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
        <View style={styles.hint}>
          <T style={{ color: '#fff', fontFamily: t.font.bodySemi, fontSize: 13 }}>Point at a building, statue, or sign</T>
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16, backgroundColor: t.bg }]}>
        {!pos ? (
          <T variant="small">Finding your location…</T>
        ) : !top ? (
          <T variant="small">Nothing from the book in this direction within a few blocks. Try turning slowly.</T>
        ) : (
          <Pressable onPress={() => open(top)} style={styles.hit}>
            {top.stop.photos[0] ? <Image source={photo(top.stop.photos[0].file)} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: top.walk.color }]} />}
            <View style={{ flex: 1 }}>
              <T variant="label">
                {result ? 'You are looking at' : 'Probably in view'} · {formatDistance(top.distance, units)}
              </T>
              <T variant="h2" numberOfLines={2}>
                {top.stop.title}
              </T>
              <T variant="small">
                Walk {top.walk.id}, stop {top.stop.n}
                {result ? ` · ${result.reason}` : ''}
              </T>
            </View>
            <Pressable hitSlop={8} onPress={() => speakShort(`${top.stop.title}. ${top.stop.blocks.find((b) => b.kind === 'p')?.text ?? ''}`)}>
              <Ionicons name="volume-high" size={24} color={t.primary} />
            </Pressable>
          </Pressable>
        )}
        {cands.length > 1 && !result ? (
          <T variant="small" style={{ marginTop: 6 }}>
            Also nearby: {cands.slice(1, 4).map((c) => c.stop.title).join(', ')}
          </T>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Pressable onPress={shoot} disabled={busy || !cands.length} style={[styles.shutter, { borderColor: t.primary, opacity: cands.length ? 1 : 0.5 }]}>
            {busy ? <ActivityIndicator color={t.primary} /> : <Ionicons name="scan" size={26} color={t.primary} />}
          </Pressable>
          {top ? <Button label="Read about it" icon="book" onPress={() => open(top)} style={{ flex: 1 }} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  reticle: { position: 'absolute', alignSelf: 'center', top: '28%', width: 220, height: 220, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  topRow: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hint: { backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  hit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  shutter: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
