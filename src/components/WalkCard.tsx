import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { TRIAL } from '../config';
import { photo, walkNo } from '../data';
import type { Walk } from '../data/types';
import { useIsPro } from '../lib/access';
import { useProgress } from '../store';
import { useTheme } from '../theme';
import { T, tap } from './ui';

export function WalkCard({ walk, wide }: { walk: Walk; wide?: boolean }) {
  const t = useTheme();
  const isPro = useIsPro();
  const prog = useProgress((s) => s.progress[walk.id]);
  const active = useProgress((s) => s.activeWalkId);
  const locked = !isPro && walk.id !== TRIAL.walkId;
  const done = prog?.finishedAt;
  const pct = prog ? Math.round((prog.visited.length / Math.max(1, walk.stops.length)) * 100) : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Walk ${walk.id}, ${walk.title}`}
      onPress={() => {
        tap();
        router.push(`/walk/${walk.id}`);
      }}
      style={({ pressed }) => [styles.card, wide ? styles.wide : styles.narrow, { opacity: pressed ? 0.9 : 1, backgroundColor: t.card }]}
    >
      {walk.cover ? <Image source={photo(walk.cover)} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: walk.color }]} />}
      <LinearGradient colors={['transparent', 'rgba(5,25,28,0.25)', 'rgba(5,25,28,0.88)']} style={StyleSheet.absoluteFill} />
      <View style={styles.badgeRow}>
        <View style={[styles.roman, { backgroundColor: walk.color }]}>
          <T style={{ color: '#fff', fontFamily: t.font.display, fontSize: 15 }}>{walkNo(walk.id)}</T>
        </View>
        {walk.id === TRIAL.walkId && !isPro ? (
          <View style={[styles.pill, { backgroundColor: t.gold }]}>
            <T style={{ color: '#3a2200', fontFamily: t.font.bodyBold, fontSize: 11 }}>FREE PREVIEW</T>
          </View>
        ) : locked ? (
          <View style={[styles.pill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
            <Ionicons name="lock-closed" size={11} color="#fff" />
          </View>
        ) : done ? (
          <View style={[styles.pill, { backgroundColor: t.leaf }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        ) : null}
      </View>
      <View style={styles.text}>
        <T style={{ color: '#fff', fontFamily: t.font.display, fontSize: wide ? 26 : 20, lineHeight: wide ? 31 : 24 }} numberOfLines={2}>
          {walk.title}
        </T>
        {walk.theme ? (
          <T style={{ color: '#E9F4F2', fontFamily: t.font.displayItalic, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
            {walk.theme}
          </T>
        ) : null}
        <T style={{ color: '#CFE3E0', fontFamily: t.font.bodySemi, fontSize: 12, marginTop: 6 }}>
          {[walk.facts.distance, walk.facts.duration, `${walk.stops.length} stops`].filter(Boolean).join('  ·  ')}
        </T>
        {/* Not started, stopped at stop N of M with a bar, or finished. */}
        <T style={{ color: '#fff', fontFamily: t.font.bodyBold, fontSize: 12, marginTop: 8 }}>
          {done ? 'Finished' : prog && prog.visited.length ? `${active === walk.id ? 'In progress' : 'Stopped'} · stop ${walk.stops[prog.current]?.n ?? 1} of ${walk.stops.length}` : 'Not started'}
        </T>
        {prog && prog.visited.length ? (
          <View style={[styles.bar, { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <View style={{ width: `${done ? 100 : pct}%`, height: 5, backgroundColor: '#fff', borderRadius: 3 }} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  wide: { height: 230 },
  narrow: { width: 220, height: 270, marginRight: 14 },
  badgeRow: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  roman: { minWidth: 38, height: 30, paddingHorizontal: 8, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 24, borderRadius: 12, justifyContent: 'center' },
  text: { padding: 16 },
  bar: { height: 3, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, marginTop: 10 },
});
