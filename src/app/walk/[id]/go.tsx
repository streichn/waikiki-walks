import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Linking, PanResponder, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookMapPane, type FollowMode, LayersButton, type Layer, LocateButton, MapStyleSwitch, nextFollow } from '../../../components/MapControls';
import { PhotoStrip } from '../../../components/Photos';
import { StopText } from '../../../components/StopText';
import { Button, IconButton, T, tap } from '../../../components/ui';
import { WalkMap, type WalkMapHandle } from '../../../components/WalkMap';
import { getWalk, walkNo } from '../../../data';
import { canOpenStop, useIsPro } from '../../../lib/access';
import { bearingDeg, distanceM, formatDistance, hawaiianDirection, headingDelta, walkMinutes } from '../../../lib/geo';
import { confirmEndWalk, endWalkNow } from '../../../lib/endWalk';
import * as LiveActivity from '../../../lib/liveActivity';
import { play, stop as stopSpeech, useNarration } from '../../../lib/narration';
import { advanceBackground, requestPermissions, startBackground, stopBackground, watchForeground } from '../../../lib/tracking';
import { useProgress, useSettings } from '../../../store';
import { useTheme } from '../../../theme';

/** Resting heights of the stop sheet, as in Apple Maps: a peek over the map, half, or full. */
type Detent = 'peek' | 'half' | 'full';

export default function ActiveWalk() {
  const { id, stop: stopParam } = useLocalSearchParams<{ id: string; stop?: string }>();
  const walk = getWalk(id)!;
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isPro = useIsPro();
  const settings = useSettings();
  const startWalk = useProgress((s) => s.startWalk);
  const goTo = useProgress((s) => s.goTo);
  const markVisited = useProgress((s) => s.markVisited);
  const endWalk = useProgress((s) => s.endWalk);
  const prog = useProgress((s) => s.progress[walk.id]);
  const speakingId = useNarration((s) => s.speakingStopId);

  const [follow, setFollow] = useState<FollowMode>('follow');
  const [layer, setLayer] = useState<Layer>('standard');
  const [bookMap, setBookMap] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [gps, setGps] = useState<'pending' | 'on' | 'off'>('pending');
  const [justArrived, setJustArrived] = useState<number | null>(null);
  const mapRef = useRef<WalkMapHandle>(null);
  const textRef = useRef<ScrollViewInstance>(null);
  const banner = useRef(new Animated.Value(0)).current;

  // Bottom sheet: the map always fills the screen and the stop text slides up over it.
  const headerBottom = insets.top + 62;
  const [topBlockH, setTopBlockH] = useState(170);
  const [controlsH, setControlsH] = useState(80);
  const snaps = useMemo(() => {
    const peek = topBlockH + controlsH;
    return { peek, half: Math.max(peek + 60, Math.round(height * 0.56)), full: height - headerBottom };
  }, [topBlockH, controlsH, height, headerBottom]);
  const snapsRef = useRef(snaps);
  snapsRef.current = snaps;
  const [detent, setDetent] = useState<Detent>('half');
  const sheetH = useRef(new Animated.Value(Math.round(height * 0.56))).current;
  const hNow = useRef(Math.round(height * 0.56));
  const dragStart = useRef(0);
  useEffect(() => {
    const sub = sheetH.addListener(({ value }) => (hNow.current = value));
    return () => sheetH.removeListener(sub);
  }, [sheetH]);
  const snapTo = (d: Detent) => {
    setDetent(d);
    Animated.spring(sheetH, { toValue: snapsRef.current[d], useNativeDriver: false, bounciness: 0, speed: 16 }).start();
  };
  useEffect(() => {
    sheetH.setValue(snaps[detent]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snaps]);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: () => {
          dragStart.current = hNow.current;
        },
        onPanResponderMove: (_, g) => {
          const s = snapsRef.current;
          sheetH.setValue(Math.max(s.peek - 30, Math.min(s.full, dragStart.current - g.dy)));
        },
        onPanResponderRelease: (_, g) => {
          const s = snapsRef.current;
          const h = dragStart.current - g.dy;
          let pick: Detent = (['peek', 'half', 'full'] as Detent[]).reduce((a, k) => (Math.abs(s[k] - h) < Math.abs(s[a] - h) ? k : a), 'half');
          if (g.vy > 0.6) pick = h > s.half ? 'half' : 'peek';
          else if (g.vy < -0.6) pick = h < s.half ? 'half' : 'full';
          snapTo(pick);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const cycleSheet = () => {
    tap();
    snapTo(detent === 'peek' ? 'half' : detent === 'half' ? 'full' : 'peek');
  };

  const current = prog?.current ?? 0;
  const stop = walk.stops[current];
  const visited = prog?.visited ?? [];
  const arrivedHere = visited.includes(current);

  // Start or resume the walk, then switch on location, background alerts, and the Live Activity.
  useEffect(() => {
    startWalk(walk.id, stopParam ? Number(stopParam) : undefined);
    let watch: Location.LocationSubscription | undefined;
    let headSub: Location.LocationSubscription | undefined;
    (async () => {
      const perm = await requestPermissions();
      if (!perm.foreground) return setGps('off');
      setGps('on');
      const idx = useProgress.getState().progress[walk.id]?.current ?? 0;
      await startBackground(walk, idx).catch(() => undefined);
      LiveActivity.start(walk, idx);
      watch = await watchForeground((p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy ?? 50 }));
      headSub = await Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading));
    })();
    return () => {
      watch?.remove();
      headSub?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walk.id]);

  // Follow mode, as in Apple Maps: keep the walker centered (and turn the map with them).
  useEffect(() => {
    if (!pos || follow === 'off') return;
    mapRef.current?.follow(pos.lat, pos.lng, follow === 'heading' && heading !== null ? heading : undefined);
  }, [pos, heading, follow]);

  // Arrival detection in the foreground.
  useEffect(() => {
    if (!pos || !settings.arrivalAlerts) return;
    const radius = (stop?.radius ?? settings.arrivalRadius) + Math.min(pos.acc, 30) * 0.5;
    // Check the target stop first, then the next few, in case the walker skipped ahead.
    for (let i = current; i < Math.min(walk.stops.length, current + 4); i++) {
      if (visited.includes(i)) continue;
      if (!canOpenStop(walk.id, i, isPro)) break;
      if (distanceM(pos, walk.stops[i]) <= radius) {
        arrive(i);
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  const arrive = (i: number) => {
    markVisited(walk.id, i);
    goTo(walk.id, i);
    setJustArrived(i);
    if (detent === 'peek') snapTo('half');
    LiveActivity.update(walk, i);
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Animated.sequence([Animated.spring(banner, { toValue: 1, useNativeDriver: true }), Animated.delay(4200), Animated.timing(banner, { toValue: 0, duration: 300, useNativeDriver: true })]).start(() => setJustArrived(null));
    textRef.current?.scrollTo({ y: 0, animated: true });
    if (settings.autoNarrate) play(walk.stops[i]);
  };

  const go = (i: number) => {
    if (i < 0) return;
    if (i >= walk.stops.length) return finish();
    if (!canOpenStop(walk.id, i, isPro)) return router.push('/paywall');
    tap();
    stopSpeech();
    goTo(walk.id, i);
    LiveActivity.update(walk, i);
    advanceBackground(walk, i).catch(() => undefined);
    mapRef.current?.focusStop(i);
    textRef.current?.scrollTo({ y: 0, animated: false });
  };

  // "I'm here" covers weak GPS between tall buildings.
  const manualArrive = () => arrive(current);

  const finish = () => {
    Alert.alert('Walk complete', `Mahalo for walking ${walk.title}!`, [{ text: 'Done', onPress: () => end(true) }]);
  };

  const end = async (finished = false) => {
    await endWalkNow(walk, false, finished);
    router.back();
  };

  // Ending asks whether to keep the walker's place or start fresh next time.
  const confirmEnd = () => confirmEndWalk(walk, () => router.back());

  const openDirections = () => {
    if (!stop) return;
    const q = `${stop.lat},${stop.lng}`;
    const url = Platform.OS === 'ios' ? `http://maps.apple.com/?daddr=${q}&dirflg=w` : `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=walking`;
    Linking.openURL(url);
  };

  const dist = pos && stop ? distanceM(pos, stop) : null;
  const brg = pos && stop ? bearingDeg(pos, stop) : null;
  const rel = brg !== null && heading !== null ? headingDelta(heading, brg) : null;
  const nextLocked = !canOpenStop(walk.id, current + 1, isPro) && current + 1 < walk.stops.length;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={StyleSheet.absoluteFill}>
        {bookMap && walk.bookMap ? (
          <BookMapPane walk={walk} current={current} visited={visited} isLocked={(i) => !canOpenStop(walk.id, i, isPro)} me={pos} onSelect={(i) => go(i)} topInset={insets.top + 110} bottomInset={snaps[detent]} />
        ) : (
        <WalkMap ref={mapRef} walk={walk} current={current} visited={visited} isLocked={(i) => !canOpenStop(walk.id, i, isPro)} onSelect={(i) => go(i)} bottomInset={snaps[detent]} mapType={layer} onUserPan={() => setFollow('off')} />
        )}
      </View>
      {detent !== 'full' && walk.bookMap ? (
        <View style={{ position: 'absolute', left: 14, top: insets.top + 64 }}>
          <MapStyleSwitch book={bookMap} onChange={setBookMap} />
        </View>
      ) : null}
      {detent !== 'full' ? (
        <View style={[styles.mapBtns, { top: insets.top + 64 }]}>
          <LocateButton
            mode={follow}
            disabled={!pos}
            onPress={() => {
              const m = nextFollow(follow);
              setFollow(m);
              if (m === 'off' && pos) mapRef.current?.recenter(pos.lat, pos.lng);
            }}
          />
          <LayersButton layer={layer} onChange={(l) => { setBookMap(false); setLayer(l); }} bookMap={walk.bookMap} bookActive={bookMap} onBook={() => setBookMap(true)} />
          <IconButton icon="git-network-outline" label="Show whole walk" onPress={() => { setFollow('off'); mapRef.current?.fitAll(); }} />
        </View>
      ) : null}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <IconButton icon="chevron-down" label="Minimize walk" onPress={() => router.back()} />
        <View style={[styles.headerPill, { backgroundColor: t.card }]}>
          <T variant="label" numberOfLines={1}>
            Walk {walkNo(walk.id)} · {visited.length}/{walk.stops.length}
          </T>
          <T style={{ fontFamily: t.font.display, fontSize: 15 }} numberOfLines={1}>
            {walk.title}
          </T>
        </View>
        <IconButton icon="close" label="End walk" onPress={confirmEnd} />
      </View>

      {/* Arrival banner */}
      {justArrived !== null ? (
        <Animated.View style={[styles.arrived, { top: insets.top + 64, backgroundColor: t.leaf, opacity: banner, transform: [{ translateY: banner.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] }]}>
          <Ionicons name="flower" size={22} color="#fff" />
          <T style={{ color: '#fff', fontFamily: t.font.bodyBold, flex: 1 }}>You've arrived: {walk.stops[justArrived]?.title}</T>
        </Animated.View>
      ) : null}

      {/* Stop sheet: drag the top part, or tap the handle, to resize. The text scrolls on its own. */}
      {stop ? (
        <Animated.View style={[styles.sheet, { backgroundColor: t.bg, height: sheetH }]}>
          <View {...pan.panHandlers} onLayout={(e) => setTopBlockH(Math.round(e.nativeEvent.layout.height))}>
            <Pressable onPress={cycleSheet} accessibilityRole="adjustable" accessibilityLabel="Resize the stop panel" style={styles.grab}>
              <View style={[styles.handle, { backgroundColor: t.textMuted, opacity: 0.4 }]} />
            </Pressable>
            <View style={[styles.viewSwitch, { backgroundColor: t.cardAlt }]} accessibilityRole="tablist">
              {([['peek', 'map', 'Map'], ['half', 'albums', 'Both'], ['full', 'reader', 'Text']] as const).map(([d, icon, label]) => (
                <Pressable key={d} accessibilityRole="tab" accessibilityState={{ selected: detent === d }} onPress={() => { tap(); snapTo(d); }} style={[styles.viewBtn, detent === d && { backgroundColor: t.card }]}>
                  <Ionicons name={icon} size={15} color={detent === d ? t.primary : t.textMuted} />
                  <T style={{ fontFamily: t.font.bodyBold, fontSize: 14, color: detent === d ? t.primary : t.textMuted }}>{label}</T>
                </Pressable>
              ))}
            </View>
            <View style={styles.pagerRow}>
              <PagerButton label="Previous" icon="chevron-back" disabled={current === 0} onPress={() => go(current - 1)} />
              <T style={{ fontFamily: t.font.bodyBold, color: t.textMuted, fontSize: 14 }}>
                Stop {stop.n} of {walk.stops.length}
              </T>
              <PagerButton label="Next" icon="chevron-forward" iconRight disabled={current >= walk.stops.length - 1} onPress={() => go(current + 1)} />
            </View>

            {/* Heading to / at the stop */}
            <View style={[styles.nav, { backgroundColor: arrivedHere ? (t.dark ? '#163D27' : '#E6F4E8') : t.card, borderColor: t.border }]}>
              {arrivedHere ? (
                <Ionicons name="checkmark-circle" size={34} color={t.leaf} />
              ) : (
                <View style={{ transform: [{ rotate: `${rel ?? 0}deg` }] }}>
                  <Ionicons name="navigate" size={30} color={rel === null ? t.textMuted : t.accent} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <T variant="label">{arrivedHere ? `You're at stop ${stop.n}` : `Heading to stop ${stop.n}`}</T>
                <T variant="h2" numberOfLines={2}>
                  {stop.title}
                </T>
                <T variant="small">
                  {gps === 'off'
                    ? 'Location is off. Use Next when you reach each stop.'
                    : arrivedHere
                      ? 'Read or listen below, then tap Next.'
                      : dist !== null
                        ? `${formatDistance(dist, settings.units)} · about ${walkMinutes(dist)} min${brg !== null ? ` · head ${hawaiianDirection(brg)}` : ''}`
                        : 'Finding your location…'}
                </T>
              </View>
              {!arrivedHere ? (
                <Pressable onPress={openDirections} accessibilityLabel="Walking directions" style={[styles.dirBtn, { backgroundColor: t.primary }]}>
                  <Ionicons name="arrow-redo" size={18} color={t.primaryText} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView ref={textRef} style={{ flex: 1, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 14 }}>
            <PhotoStrip photos={stop.photos} height={170} />
            <StopText blocks={stop.blocks} stopId={stop.id} />
            {stop.geo !== 'verified' && stop.geo !== 'book' ? (
              <T variant="small" style={{ fontStyle: 'italic' }}>
                Pin location is a draft ({stop.geo}). Use "I'm here" if the alert doesn't fire.
              </T>
            ) : null}
          </ScrollView>

          {/* Controls */}
          <View onLayout={(e) => setControlsH(Math.round(e.nativeEvent.layout.height))} style={[styles.controls, { paddingBottom: insets.bottom + 10, backgroundColor: t.bg, borderTopColor: t.border }]}>
            <Pressable
              accessibilityLabel={speakingId === stop.id ? 'Stop reading' : 'Read aloud'}
              onPress={() => {
                tap();
                if (speakingId === stop.id) stopSpeech();
                else play(stop);
              }}
              style={[styles.playBtn, { backgroundColor: t.accent }]}
            >
              <Ionicons name={speakingId === stop.id ? 'stop' : 'headset'} size={24} color="#fff" />
            </Pressable>
            {arrivedHere ? (
              <Button
                label={current + 1 >= walk.stops.length ? 'Finish' : nextLocked ? 'Unlock next stop' : 'Next stop'}
                icon={nextLocked ? 'lock-open' : 'arrow-forward'}
                kind={nextLocked ? 'accent' : 'primary'}
                onPress={() => go(current + 1)}
                style={{ flex: 1 }}
              />
            ) : (
              <Button label="I'm here" icon="flag" onPress={manualArrive} style={{ flex: 1 }} />
            )}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function PagerButton({ label, icon, iconRight, disabled, onPress }: { label: string; icon: 'chevron-back' | 'chevron-forward'; iconRight?: boolean; disabled?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} stop`} disabled={disabled} onPress={onPress} hitSlop={6} style={[styles.pbtn, { backgroundColor: t.cardAlt, opacity: disabled ? 0.35 : 1 }]}>
      {!iconRight ? <Ionicons name={icon} size={18} color={t.primary} /> : null}
      <T style={{ fontFamily: t.font.bodyBold, color: t.primary, fontSize: 15 }}>{label}</T>
      {iconRight ? <Ionicons name={icon} size={18} color={t.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 6, zIndex: 5 },
  headerPill: { flex: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  mapBtns: { position: 'absolute', right: 14, gap: 10 },
  arrived: { position: 'absolute', left: 14, right: 14, zIndex: 6, flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 18 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: -4 }, elevation: 10, overflow: 'hidden', zIndex: 4 },
  grab: { alignItems: 'center', paddingTop: 9, paddingBottom: 7 },
  handle: { width: 40, height: 5, borderRadius: 3 },
  viewSwitch: { flexDirection: 'row', gap: 4, marginHorizontal: 14, marginBottom: 10, padding: 3, borderRadius: 14 },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 11 },
  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8 },
  pbtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, padding: 12, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  dirBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  playBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
