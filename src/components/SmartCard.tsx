import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TRIAL } from '../config';
import { getWalk, walks } from '../data';
import type { Walk } from '../data/types';
import { useIsPro } from '../lib/access';
import { distanceM, formatDistance, walkMinutes } from '../lib/geo';
import { useProgress, useSettings } from '../store';
import { useTheme } from '../theme';
import { T, tap } from './ui';

const NEARBY_M = 2500; // "near" = within about a 30-minute walk of a starting point

type Card = { kind: 'continue' | 'resume' | 'nearby' | 'free' | 'next'; walk: Walk; label: string; title: string; body: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; href: string };

/**
 * The top card on the home screen changes with the walker's situation:
 * 1. a walk in progress → continue it
 * 2. near a walk's start (only if location was already allowed; we never ask on launch) → nearest walk
 * 3. a walk started earlier and not finished → pick it up
 * 4. not purchased → the free Walk IV
 * 5. otherwise → the next walk they haven't finished
 */
export function SmartCard() {
  const t = useTheme();
  const isPro = useIsPro();
  const units = useSettings((s) => s.units);
  const activeId = useProgress((s) => s.activeWalkId);
  const progress = useProgress((s) => s.progress);
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;
      const p = (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null));
      if (p) setHere({ lat: p.coords.latitude, lng: p.coords.longitude });
    })().catch(() => undefined);
  }, []);

  const card = pick();
  if (!card) return null;

  function pick(): Card | null {
    const active = activeId ? getWalk(activeId) : undefined;
    if (active) {
      const p = progress[active.id];
      const s = active.stops[p?.current ?? 0];
      return { kind: 'continue', walk: active, label: 'Walk in progress', title: `Continue ${active.title}`, body: `Stop ${s?.n ?? 1} of ${active.stops.length}: ${s?.title ?? ''}`, icon: 'play-circle', href: `/walk/${active.id}/go` };
    }
    if (here) {
      let best: { w: Walk; d: number } | null = null;
      for (const w of walks) {
        const d = distanceM(here, w.stops[0]);
        if (!best || d < best.d) best = { w, d };
      }
      if (best && best.d < NEARBY_M) {
        const free = best.w.id === TRIAL.walkId && !isPro;
        return { kind: 'nearby', walk: best.w, label: free ? 'Near you, and free' : 'Near you', title: best.w.title, body: `The start is ${formatDistance(best.d, units)} away, about ${walkMinutes(best.d)} min on foot.`, icon: 'navigate-circle', href: `/walk/${best.w.id}` };
      }
    }
    const unfinished = walks.find((w) => progress[w.id] && !progress[w.id].finishedAt && progress[w.id].visited.length > 0);
    if (unfinished) {
      const p = progress[unfinished.id];
      return { kind: 'resume', walk: unfinished, label: 'Pick up where you left off', title: unfinished.title, body: `${p.visited.length} of ${unfinished.stops.length} stops visited`, icon: 'refresh-circle', href: `/walk/${unfinished.id}` };
    }
    if (!isPro) {
      const w = getWalk(TRIAL.walkId)!;
      return { kind: 'free', walk: w, label: 'Start here, free', title: w.title, body: `The first ${TRIAL.freeStops} stops are on us. ${w.theme ?? ''}`, icon: 'arrow-forward-circle', href: `/walk/${w.id}` };
    }
    const next = walks.find((w) => !progress[w.id]?.finishedAt);
    return next ? { kind: 'next', walk: next, label: 'Your next walk', title: next.title, body: next.theme ?? '', icon: 'arrow-forward-circle', href: `/walk/${next.id}` } : null;
  }

  const bg = card.kind === 'continue' ? t.accent : card.kind === 'nearby' ? t.leaf : t.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.label}: ${card.title}`}
      onPress={() => {
        tap();
        router.push(card.href as never);
      }}
      style={[styles.card, { backgroundColor: bg }]}
    >
      <View style={{ flex: 1 }}>
        <T variant="label" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {card.label}
        </T>
        <T style={{ color: '#fff', fontFamily: t.font.display, fontSize: 22, marginTop: 2 }}>{card.title}</T>
        <T style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14, marginTop: 2 }}>{card.body}</T>
      </View>
      <Ionicons name={card.icon} size={42} color={t.gold} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 18 },
});
