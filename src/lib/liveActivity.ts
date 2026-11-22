import { Platform } from 'react-native';
import type { Walk } from '../data/types';
import { useProgress } from '../store';

/**
 * iOS Live Activity: the walk shows on the Lock Screen and in the Dynamic Island,
 * like Google Maps navigation. Android gets the equivalent from the location
 * foreground-service notification started in tracking.ts.
 */

let activityId: string | undefined;
let activityWalkId: string | undefined;
let lastShown = ''; // Apple: update a Live Activity only when its content changes

function mod() {
  if (Platform.OS !== 'ios') return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-live-activity') as typeof import('expo-live-activity');
  } catch {
    return undefined;
  }
}

function state(walk: Walk, index: number) {
  const stop = walk.stops[index];
  // Once the walker has reached the stop, say so; before that it is the stop they are heading to.
  const here = useProgress.getState().progress[walk.id]?.visited.includes(index);
  return {
    title: stop ? `${here ? 'You are at' : 'Next'}: ${stop.title}` : walk.title,
    subtitle: `Walk ${walk.id} · ${walk.title} · Stop ${Math.min(index + 1, walk.stops.length)} of ${walk.stops.length}`,
    progressBar: { progress: walk.stops.length ? index / walk.stops.length : 0 },
  };
}

export function start(walk: Walk, index: number) {
  const m = mod();
  if (!m) return;
  try {
    // Reopening the walk screen must not start a second Live Activity for the same walk.
    if (activityId && activityWalkId === walk.id) return update(walk, index);
    if (activityId) end(); // switched to a different walk
    const st = state(walk, index);
    const id = m.startActivity(st, {
      backgroundColor: '#0E6E74',
      titleColor: '#FFF6E9',
      subtitleColor: '#BFE7E3',
      progressViewTint: '#F29E4C',
      deepLinkUrl: `/walk/${walk.id}/go`,
    });
    if (id) {
      activityId = id;
      activityWalkId = walk.id;
      lastShown = JSON.stringify(st);
    }
  } catch {
    // Live Activities disabled by the user or unsupported device; the walk still works.
  }
}

export function update(walk: Walk, index: number) {
  const m = mod();
  if (!m || !activityId || activityWalkId !== walk.id) return;
  const st = state(walk, index);
  const key = JSON.stringify(st);
  if (key === lastShown) return;
  try {
    m.updateActivity(activityId, st);
    lastShown = key;
  } catch {}
}

export function end(walk?: Walk) {
  const m = mod();
  if (!m || !activityId) return;
  try {
    m.stopActivity(activityId, { title: walk ? `Finished ${walk.title}` : 'Walk ended', subtitle: 'Mahalo for walking with us' });
  } catch {}
  activityId = undefined;
  activityWalkId = undefined;
  lastShown = '';
}
