import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hibiscus, WaveRule } from '../../../components/Flora';
import { FunFacts } from '../../../components/FunFacts';
import { PhotoStrip } from '../../../components/Photos';
import { StopText } from '../../../components/StopText';
import { Button, Chip, IconButton, Segmented, T, tap } from '../../../components/ui';
import { WalkMap, type WalkMapHandle } from '../../../components/WalkMap';
import { TRIAL } from '../../../config';
import { getWalk, photo } from '../../../data';
import type { Stop } from '../../../data/types';
import { canOpenStop, canStartWalk, useIsPro } from '../../../lib/access';
import { play, stop as stopSpeech, useNarration } from '../../../lib/narration';
import { useProgress } from '../../../store';
import { useTheme } from '../../../theme';

type Mode = 'read' | 'map';

export default function WalkOverview() {
  const { id, stop: stopParam } = useLocalSearchParams<{ id: string; stop?: string }>();
  const walk = getWalk(id)!;
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isPro = useIsPro();
  const prog = useProgress((s) => s.progress[walk.id]);
  const activeId = useProgress((s) => s.activeWalkId);
  const [mode, setMode] = useState<Mode>('read');
  const [focus, setFocus] = useState(stopParam ? Number(stopParam) : 0);
  const scroll = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Record<number, number>>({});
  const mapRef = useRef<WalkMapHandle>(null);
  const cards = useRef<FlatList<Stop>>(null);
  const locked = (i: number) => !canOpenStop(walk.id, i, isPro);

  useEffect(() => {
    if (stopParam) setTimeout(() => scrollToStop(Number(stopParam)), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopParam]);

  const scrollToStop = (i: number) => {
    const y = offsets.current[i];
    if (y !== undefined) scroll.current?.scrollTo({ y: y - insets.top - 70, animated: true });
  };

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
    setMode('read');
    setTimeout(() => scrollToStop(i), 250);
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
              <T style={{ color: '#fff', fontFamily: t.font.display, fontSize: 16 }}>Walk {walk.id}</T>
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

          {walk.stops.map((s, i) => (
            <View key={s.id} onLayout={(e) => (offsets.current[i] = e.nativeEvent.layout.y)} style={{ paddingHorizontal: 20, paddingTop: 28 }}>
              <StopSection stop={s} index={i} locked={locked(i)} walkColor={walk.color} onMap={() => showOnMap(i)} width={width} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <WalkMap ref={mapRef} walk={walk} current={focus} visited={prog?.visited} isLocked={locked} onSelect={(i) => { setFocus(i); cards.current?.scrollToIndex({ index: i, animated: true }); }} bottomInset={230} />
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

function StopSection({ stop, index, locked, walkColor, onMap, width }: { stop: Stop; index: number; locked: boolean; walkColor: string; onMap: () => void; width: number }) {
  const t = useTheme();
  const fav = useProgress((s) => s.favorites.includes(stop.id));
  const toggleFav = useProgress((s) => s.toggleFavorite);
  const speaking = useNarration((s) => s.speakingStopId === stop.id);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.num, { backgroundColor: locked ? '#8A9A9B' : walkColor }]}>
          <T style={{ color: '#fff', fontFamily: t.font.bodyBold }}>{stop.n}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T variant="title" style={{ fontSize: 22, lineHeight: 27 }}>
            {stop.title}
          </T>
          {stop.subtitle ? (
            <T variant="italic" style={{ color: t.textMuted }}>
              {stop.subtitle}
            </T>
          ) : null}
        </View>
      </View>
      <WaveRule width={70} color={walkColor} />
      {locked ? (
        <Pressable onPress={() => router.push('/paywall')} style={[styles.lock, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
          <Ionicons name="lock-closed" size={20} color={t.accent} />
          <View style={{ flex: 1 }}>
            <T variant="h2">Keep walking with Veneeta</T>
            <T variant="small">Unlock all twelve walks to read and hear this stop.</T>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
        </Pressable>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => { tap(); speaking ? stopSpeech() : play(stop); }} style={[styles.action, { backgroundColor: t.cardAlt }]}>
              <Ionicons name={speaking ? 'stop-circle' : 'volume-high'} size={18} color={t.primary} />
              <T style={{ fontFamily: t.font.bodySemi, fontSize: 14 }}>{speaking ? 'Stop' : 'Listen'}</T>
            </Pressable>
            <Pressable onPress={() => { tap(); onMap(); }} style={[styles.action, { backgroundColor: t.cardAlt }]}>
              <Ionicons name="map" size={18} color={t.primary} />
              <T style={{ fontFamily: t.font.bodySemi, fontSize: 14 }}>On map</T>
            </Pressable>
            <Pressable accessibilityLabel={fav ? 'Remove from saved' : 'Save stop'} onPress={() => { tap(); toggleFav(stop.id); }} style={[styles.action, { backgroundColor: t.cardAlt }]}>
              <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={t.accent} />
            </Pressable>
          </View>
          <PhotoStrip photos={stop.photos} height={width > 400 ? 200 : 170} />
          <StopText blocks={stop.blocks} stopId={stop.id} />
        </>
      )}
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
  num: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  cardRail: { position: 'absolute', left: 0, right: 0 },
  mapCard: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 20, borderWidth: 2, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  mapCardImg: { width: 76, height: 76, borderRadius: 14 },
});
