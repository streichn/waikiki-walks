import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, T } from '../components/ui';
import { photo, walkNo } from '../data';
import { canOpenStop, useIsPro } from '../lib/access';
import { formatDistance, headingDelta } from '../lib/geo';
import { candidatesInView, compassUnsure, identifyPhoto, type LensCandidate, smoothHeading, visionAvailable } from '../lib/lens';
import { speakShort } from '../lib/narration';
import { useSettings } from '../store';
import { useTheme } from '../theme';

type Access = { granted: boolean; canAskAgain: boolean } | null;
type Result = { stopId: string | null; reason: string; heading: number };

/**
 * Point the phone at something. The live overlay lists the book's stops in front of you
 * using GPS + compass. When the vision service is configured, the shutter sends one photo
 * to confirm which of those stops it shows.
 *
 * Permissions follow Apple's and Google's guidance: ask in context (the walker just tapped
 * "What am I looking at?"), and if they say no, keep as much working as possible and say
 * exactly what is missing. Without the camera, the location and compass list still works.
 */
export default function Lens() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const units = useSettings((s) => s.units);
  const isPro = useIsPro();
  const [camPerm, requestCam] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [loc, setLoc] = useState<Access>(null);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [compassAcc, setCompassAcc] = useState<number | null>(null);
  const [cands, setCands] = useState<LensCandidate[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const smoothed = useRef<number | null>(null);
  const subs = useRef<Location.LocationSubscription[]>([]);
  const lastTop = useRef<string | null>(null);

  const startLocation = async (ask: boolean) => {
    const p = ask ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
    setLoc({ granted: p.granted, canAskAgain: p.canAskAgain });
    if (!p.granted || subs.current.length) return;
    subs.current.push(await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 3 }, (q) => setPos({ lat: q.coords.latitude, lng: q.coords.longitude })));
    subs.current.push(
      await Location.watchHeadingAsync((h) => {
        const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        const next = smoothHeading(smoothed.current, raw);
        setCompassAcc(h.accuracy);
        // Re-rank only when the smoothed heading moves a few degrees, so the list holds still.
        if (smoothed.current === null || Math.abs(headingDelta(smoothed.current, next)) >= 3) setHeading(next);
        smoothed.current = next;
      }),
    );
  };

  useEffect(() => {
    (async () => {
      // Ask for the camera first, then location, one system prompt at a time.
      // The system shows its prompt only the first time; later calls just report the answer.
      await requestCam();
      await startLocation(true);
    })();
    return () => {
      subs.current.forEach((s) => s.remove());
      subs.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pos && heading !== null) setCands(candidatesInView(pos, heading));
  }, [pos, heading]);

  // A photo answer belongs to the direction it was taken in. Turn away and it clears.
  useEffect(() => {
    if (result && heading !== null && Math.abs(headingDelta(result.heading, heading)) > 30) setResult(null);
  }, [heading, result]);

  // Tell screen reader users when the best guess changes, without them having to hunt for it.
  useEffect(() => {
    const id = cands[0]?.stop.id ?? null;
    if (id && id !== lastTop.current && !result) AccessibilityInfo.announceForAccessibility(`Probably in view: ${cands[0].stop.title}`);
    lastTop.current = id;
  }, [cands, result]);

  const shoot = async () => {
    if (!cam.current || heading === null) return;
    setBusy(true);
    let uri: string | undefined;
    try {
      // Small, upright JPEG with no EXIF (no GPS tags), used once and then deleted.
      const pic = await cam.current.takePictureAsync({ base64: true, quality: 0.4, exif: false, skipProcessing: false });
      uri = pic?.uri;
      const r = await identifyPhoto(pic?.base64 ?? '', cands);
      const hit = cands.find((c) => c.stop.id === r.stopId);
      setResult({ stopId: r.stopId, reason: r.reason, heading });
      AccessibilityInfo.announceForAccessibility(hit ? `You are looking at ${hit.stop.title}` : 'Not sure from the photo. Showing the best guess from where you are facing.');
    } catch {
      setResult({ stopId: null, reason: 'Could not check the photo just now.', heading });
    } finally {
      if (uri) {
        try {
          new File(uri).delete();
        } catch {
          // The system clears its cache folder anyway.
        }
      }
      setBusy(false);
    }
  };

  const open = (c: LensCandidate) => {
    const idx = c.walk.stops.findIndex((s) => s.id === c.stop.id);
    if (!canOpenStop(c.walk.id, idx, isPro)) return router.replace('/paywall');
    router.replace(`/walk/${c.walk.id}?stop=${idx}`);
  };

  const camOn = Boolean(camPerm?.granted);
  const confirmed = result?.stopId ? cands.find((c) => c.stop.id === result.stopId) ?? null : null;
  const top = confirmed ?? cands[0];
  const label = confirmed ? 'You are looking at' : 'Probably in view';
  const summary = top ? top.stop.blocks.find((b) => b.kind === 'p')?.text ?? '' : '';

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {camOn ? (
        <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" mute animateShutter />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.camOff]}>
          <Ionicons name="compass-outline" size={56} color="rgba(255,255,255,0.85)" />
          <T style={{ color: '#fff', textAlign: 'center', marginTop: 12 }}>The camera is off, so this uses only your location and the compass.</T>
          {camPerm && !camPerm.granted ? (
            <Pressable accessibilityRole="button" onPress={() => (camPerm.canAskAgain ? requestCam() : Linking.openSettings())} style={{ marginTop: 14 }} hitSlop={8}>
              <T style={{ color: '#fff', textDecorationLine: 'underline' }}>{camPerm.canAskAgain ? 'Use the camera' : 'Turn on the camera in Settings'}</T>
            </Pressable>
          ) : null}
        </View>
      )}
      {camOn ? <View style={styles.reticle} pointerEvents="none" /> : null}
      <View style={[styles.topRow, { top: insets.top + 8 }]}>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
        <View style={styles.hint}>
          <T style={{ color: '#fff', fontFamily: t.font.bodySemi, fontSize: 13 }}>{camOn ? 'Point at a building, statue, or sign' : 'Face a building, statue, or sign'}</T>
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16, backgroundColor: t.bg }]}>
        {loc && !loc.granted ? (
          <View>
            <T>To know what is in front of you, the app needs your location while you use it. Nothing else on this screen works without it.</T>
            <Button label={loc.canAskAgain ? 'Try again' : 'Open Settings'} kind="outline" onPress={() => (loc.canAskAgain ? startLocation(true) : Linking.openSettings())} style={{ marginTop: 12 }} />
          </View>
        ) : !pos || heading === null ? (
          <T variant="small">Finding your location and direction…</T>
        ) : !top ? (
          <T variant="small">Nothing from the book in this direction within a few blocks. Try turning slowly.</T>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${top.stop.title}, ${formatDistance(top.distance, units)} away. Walk ${walkNo(top.walk.id)}, stop ${top.stop.n}. Opens the stop.`} onPress={() => open(top)} style={styles.hit}>
            {top.stop.photos[0] ? <Image source={photo(top.stop.photos[0].file)} style={styles.thumb} contentFit="cover" accessible={false} /> : <View style={[styles.thumb, { backgroundColor: top.walk.color }]} />}
            <View style={{ flex: 1 }}>
              <T variant="label">
                {label} · {formatDistance(top.distance, units)}
              </T>
              <T variant="h2" numberOfLines={2}>
                {top.stop.title}
              </T>
              <T variant="small">
                Walk {walkNo(top.walk.id)}, stop {top.stop.n}
                {confirmed && result?.reason ? ` · ${result.reason}` : ''}
              </T>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Read aloud: ${top.stop.title}`} hitSlop={8} onPress={() => speakShort(`${top.stop.title}. ${summary}`)}>
              <Ionicons name="volume-high" size={24} color={t.primary} />
            </Pressable>
          </Pressable>
        )}
        {result && !confirmed ? (
          <T variant="small" style={{ marginTop: 6 }}>
            {result.reason && result.reason.startsWith('Could not') ? result.reason : 'Not sure from the photo.'} This is the best guess from where you are facing.
          </T>
        ) : null}
        {pos && compassUnsure(compassAcc) ? (
          <T variant="small" style={{ marginTop: 6, color: t.accent }}>
            The compass is unsure of your direction. Move your phone in a figure 8, away from cars and metal railings.
          </T>
        ) : null}
        {cands.length > 1 && !confirmed ? (
          <T variant="small" style={{ marginTop: 6 }}>
            Also nearby: {cands.slice(1, 4).map((c) => c.stop.title).join(', ')}
          </T>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {visionAvailable && camOn ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Check with a photo"
              accessibilityHint="Takes one photo to confirm which stop you are facing. The photo is not saved."
              accessibilityState={{ disabled: busy || !cands.length, busy }}
              onPress={shoot}
              disabled={busy || !cands.length}
              style={[styles.shutter, { borderColor: t.primary, opacity: cands.length ? 1 : 0.5 }]}
            >
              {busy ? <ActivityIndicator color={t.primary} /> : <Ionicons name="scan" size={26} color={t.primary} />}
            </Pressable>
          ) : null}
          {top ? <Button label="Read about it" icon="book" onPress={() => open(top)} style={{ flex: 1 }} /> : null}
        </View>
        {visionAvailable && camOn && cands.length ? (
          <T variant="small" style={{ marginTop: 8 }}>
            Tap the scan button to check with a photo. It is sent once to match it to the book, and the app does not keep it.
          </T>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camOff: { alignItems: 'center', justifyContent: 'center', padding: 30, paddingBottom: 220, backgroundColor: '#0b2a2c' },
  reticle: { position: 'absolute', alignSelf: 'center', top: '28%', width: 220, height: 220, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)' },
  topRow: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hint: { backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  hit: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  shutter: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
