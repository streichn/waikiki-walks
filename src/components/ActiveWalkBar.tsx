import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { getWalk } from '../data';
import { togglePause, useNarration } from '../lib/narration';
import { useProgress } from '../store';
import { useTheme } from '../theme';
import { T, tap } from './ui';

/**
 * Persistent "walk in progress" bar that floats above the tab bar while the walker
 * browses elsewhere in the app, the way Google Maps keeps navigation pinned.
 */
export function ActiveWalkBar({ bottom }: { bottom: number }) {
  const t = useTheme();
  const id = useProgress((s) => s.activeWalkId);
  const prog = useProgress((s) => (id ? s.progress[id] : undefined));
  const speaking = useNarration((s) => s.speakingStopId);
  const paused = useNarration((s) => s.paused);
  const walk = id ? getWalk(id) : undefined;
  if (!walk || !prog) return null;
  const stop = walk.stops[prog.current];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Return to walk ${walk.title}`}
      onPress={() => {
        tap();
        router.push(`/walk/${walk.id}/go`);
      }}
      style={[styles.bar, { bottom, backgroundColor: t.primary }]}
    >
      <View style={[styles.dot, { backgroundColor: t.gold }]}>
        <Ionicons name="walk" size={18} color="#2a1800" />
      </View>
      <View style={{ flex: 1 }}>
        <T style={{ color: t.primaryText, fontFamily: t.font.bodyBold, fontSize: 14 }} numberOfLines={1}>
          {stop ? `Stop ${stop.n}: ${stop.title}` : walk.title}
        </T>
        <T style={{ color: t.dark ? '#073036' : '#CDEBE8', fontSize: 12, fontFamily: t.font.body }} numberOfLines={1}>
          Walk {walk.id} · {walk.title} · {prog.visited.length}/{walk.stops.length} visited
        </T>
      </View>
      {speaking ? (
        <Pressable accessibilityLabel={paused ? 'Resume reading' : 'Pause reading'} hitSlop={10} onPress={togglePause}>
          <Ionicons name={paused ? 'play-circle' : 'pause-circle'} size={32} color={t.primaryText} />
        </Pressable>
      ) : (
        <Ionicons name="chevron-up" size={22} color={t.primaryText} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, paddingRight: 14, borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
