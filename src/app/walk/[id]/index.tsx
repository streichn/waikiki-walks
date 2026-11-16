import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hibiscus } from '../../../components/Flora';
import { FunFacts } from '../../../components/FunFacts';
import { StopText } from '../../../components/StopText';
import { BookMapPane, LayersButton, type Layer, MapStyleSwitch } from '../../../components/MapControls';
import { Button, Chip, IconButton, Segmented, T, tap } from '../../../components/ui';
import { WalkMap, type WalkMapHandle } from '../../../components/WalkMap';
import { TRIAL } from '../../../config';
import { getWalk, photo, walkNo } from '../../../data';
import type { Stop } from '../../../data/types';
import { canOpenStop, canStartWalk, useIsPro } from '../../../lib/access';
import { stop as stopSpeech } from '../../../lib/narration';
import { useProgress } from '../../../store';
import { useTheme } from '../../../theme';

type Mode = 'read' | 'map';

export default function WalkOverview() {
  const { id, stop: stopParam, mode: modeParam } = useLocalSearchParams<{ id: string; stop?: string; mode?: string }>();
  const walk = getWalk(id)!;
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isPro = useIsPro();
  const prog = useProgress((s) => s.progress[walk.id]);
  const activeId = useProgress((s) => s.activeWalkId);
  const [mode, setMode] = useState<Mode>(modeParam === 'map' ? 'map' : 'read');
  const [focus, setFocus] = useState(stopParam ? Number(stopParam) : 0);
  const [layer, setLayer] = useState<Layer>('standard');
  const [bookMap, setBookMap] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const mapRef = useRef<WalkMapHandle>(null);
  const cards = useRef<FlatList<Stop>>(null);
  const locked = (i: number) => !canOpenStop(walk.id, i, isPro);

  // A link to a specific stop (map pin, notification, camera match) opens that stop's page, or the map.
  useEffect(() => {
    if (stopParam === undefined) return;
    const i = Number(stopParam);
    if (modeParam === 'map') showOnMap(i);
    else router.push(`/walk/${walk.id}/stop/${i}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopParam, modeParam]);

  // Text and map are linked: choosing a stop in one jumps to it in the other.
  const showOnMap = (i: number) => {
    setFocus(i);
    setMode('map');
    setTimeout(() => {
      mapRef.current?.focusStop(i);
      cards.current?.scrollToIndex({ index: i, animated: true });
    }, 250);
  };
  const readStop = (i: number) => {
    setFocus(i);
    router.push(`/walk/${walk.id}/stop/${i}`);
  };

  const begin = () => {
    if (!canStartWalk(walk.id, isPro)) return router.push('/paywall');
    router.push(`/walk/${walk.id}/go`);
  };
  const resuming = prog && !prog.finishedAt && prog.visited.length > 0;
  const isActive = activeId === walk.id;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {mode === 'read' ? (
        <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 130 }}>
          <View style={styles.hero}>
            {walk.cover ? <Image source={photo(walk.cover)} style={StyleSheet.absoluteFill} contentFit="cover" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: walk.color }]} />}
            <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', t.bg]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
            <View style={styles.heroFlower}>
              <Hibiscus size={110} rotate={25} opacity={0.9} color={t.palette.hibiscus} />
            </View>
          </View>
          <View style={{ paddingHorizontal: 20, marginTop: -70, gap: 12 }}>
            <View style={[styles.roman, { backgroundColor: walk.color }]}>
              <T style={{ color: '#fff', fontFamily: t.font.display, fontSize: 16 }}>Walk {walkNo(walk.id)}</T>
            </View>
            <T variant="display">{walk.title}</T>
            {walk.theme ? (
              <T variant="italic" style={{ color: t.leaf, fontSize: 19 }}>
                {walk.theme}
              </T>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {walk.facts.distance ? <Chip icon="footsteps" label={walk.facts.distance} /> : null}
              {walk.facts.duration ? <Chip icon="time" label={walk.facts.duration} /> : null}
              <Chip icon="location" label={`${walk.stops.length} stops`} />
              {walk.id === TRIAL.walkId && !isPro ? <Chip icon="gift" color={t.gold} label={`First ${TRIAL.freeStops} free`} /> : null}
            </View>
            <StopText blocks={walk.intro} stopId={`${walk.id}-intro`} />
            {walk.info.map((x, i) => (
              <View key={i} style={[styles.info, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
                <Ionicons name="bus" size={18} color={t.gold} />
                <T variant="small" style={{ flex: 1, color: t.text }}>
                  {x}
                </T>
              </View>
            ))}
            <FunFacts walkId={walk.id} />
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 26, gap: 8 }}>
            <T variant="title" style={{ fontSize: 22 }}>The stops</T>
            <T variant="small">Tap a stop to read it, then swipe or use Next to go through them one at a time.</T>
            {walk.stops.map((s, i) => {
              const seen = prog?.visited.includes(i);
              return (
                <Pressable key={s.id} onPress={() => readStop(i)} accessibilityRole="button" accessibilityLabel={`Stop ${s.n}, ${s.title}${locked(i) ? ', locked' : ''}`} style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={[styles.num, { backgroundColor: locked(i) ? '#8A9A9B' : walk.color }]}>
                    <T style={{ color: '#fff', fontFamily: t.font.bodyBold }}>{s.n}</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontFamily: t.font.bodyBold, fontSize: 16 }} numberOfLines={2}>{s.title}</T>
                    {s.subtitle ? <T variant="small" style={{ fontStyle: 'italic' }} numberOfLines={1}>{s.subtitle}</T> : null}
                  </View>
                  <Ionicons name={locked(i) ? 'lock-closed' : seen ? 'checkmark-circle' : 'chevron-forward'} size={20} color={locked(i) ? t.textMuted : seen ? t.leaf : t.primary} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {bookMap && walk.bookMap ? (
            <BookMapPane walk={walk} current={focus} visited={prog?.visited} isLocked={locked} onSelect={(i) => { setFocus(i); cards.current?.scrollToIndex({ index: i, animated: true }); }} topInset={insets.top + 110} bottomInset={230} />
          ) : (
            <WalkMap ref={mapRef} walk={walk} current={focus} visited={prog?.visited} isLocked={locked} onSelect={(i) => { setFocus(i); cards.current?.scrollToIndex({ index: i, animated: true }); }} bottomInset={230} mapType={layer} />
          )}
          {walk.bookMap ? (
            <View style={{ position: 'absolute', left: 14, top: insets.top + 64 }}>
              <MapStyleSwitch book={bookMap} onChange={setBookMap} />
            </View>
          ) : null}
          <View style={{ position: 'absolute', right: 14, top: insets.top + 64, gap: 10 }}>
            <LayersButton layer={layer} onChange={(l) => { setBookMap(false); setLayer(l); }} bookMap={walk.bookMap} bookActive={bookMap} onBook={() => setBookMap(true)} />
          </View>
          <FlatList
            ref={cards}
            data={walk.stops}
            horizontal
            pagingEnabled={false}
            snapToInterval={width * 0.78 + 12}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            style={[styles.cardRail, { bottom: insets.bottom + 96 }]}
            contentContainerStyle={{ paddingHorizontal: width * 0.11, gap: 12 }}
            getItemLayout={(_, i) => ({ length: width * 0.78 + 12, offset: (width * 0.78 + 12) * i, index: i })}
            initialScrollIndex={focus}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / (width * 0.78 + 12));
              setFocus(i);
              mapRef.current?.focusStop(i);
            }}
            keyExtractor={(s) => s.id}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => (locked(index) ? router.push('/paywall') : readStop(index))} style={[styles.mapCard, { width: width * 0.78, backgroundColor: t.card, borderColor: index === focus ? t.accent : t.border }]}>
                {item.photos[0] && !locked(index) ? <Image source={photo(item.photos[0].file)} style={styles.mapCardImg} contentFit="cover" /> : <View style={[styles.mapCardImg, { backgroundColor: walk.color, alignItems: 'center', justifyContent: 'center' }]}>{locked(index) ? <Ionicons name="lock-closed" size={22} color="#fff" /> : <Hibiscus size={40} color="#fff" opacity={0.7} />}</View>}
                <View style={{ flex: 1 }}>
                  <T variant="label">Stop {item.n}</T>
                  <T variant="h2" numberOfLines={2}>
                    {item.title}
                  </T>
                  <T variant="small" style={{ color: t.primary, marginTop: 4 }}>
                    {locked(index) ? 'Unlock to read' : 'Read this stop'}
                  </T>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      <View style={[styles.topBar, { top: insets.top + 6 }]}>
        <IconButton icon="chevron-back" label="Back" onPress={() => { stopSpeech(); router.back(); }} />
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Segmented<Mode>
            value={mode}
            onChange={(m) => (m === 'map' ? showOnMap(focus) : readStop(focus))}
            options={[
              { value: 'read', label: 'Read', icon: 'book' },
              { value: 'map', label: 'Map', icon: 'map' },
            ]}
          />
        </View>
        {mode === 'map' ? <IconButton icon="scan-outline" label="Show all stops" onPress={() => mapRef.current?.fitAll()} /> : <IconButton icon="share-outline" label="Share" onPress={() => {}} />}
      </View>

      <View style={[styles.cta, { paddingBottom: insets.bottom + 12, backgroundColor: mode === 'read' ? t.bg : 'transparent' }]}>
        <Button
          kind={canStartWalk(walk.id, isPro) ? 'primary' : 'accent'}
          icon={canStartWalk(walk.id, isPro) ? 'navigate' : 'lock-open'}
          label={!canStartWalk(walk.id, isPro) ? 'Unlock this walk' : isActive ? 'Return to walk' : resuming ? 'Continue walk' : 'Start walk'}
          onPress={begin}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 330 },
  heroFlower: { position: 'absolute', right: -24, bottom: 40 },
  roman: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  info: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  topBar: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center' },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  num: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  cardRail: { position: 'absolute', left: 0, right: 0 },
  mapCard: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 20, borderWidth: 2, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  mapCardImg: { width: 76, height: 76, borderRadius: 14 },
});
