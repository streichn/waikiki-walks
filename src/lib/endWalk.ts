import { Alert } from 'react-native';
import { getWalk } from '../data';
import type { Walk } from '../data/types';
import { useProgress } from '../store';
import * as LiveActivity from './liveActivity';
import { stop as stopSpeech } from './narration';
import { stopBackground } from './tracking';

/** Stop narration, location tracking and the Live Activity, then end the walk (keeping or clearing progress). */
export async function endWalkNow(walk: Walk, discard: boolean, finished = false) {
  stopSpeech();
  LiveActivity.end(walk);
  await stopBackground().catch(() => undefined);
  useProgress.getState().endWalk(finished, discard);
}

/** Ask how to end the walk: keep the walker's place, or clear it to start at stop 1 next time. */
export function confirmEndWalk(walk: Walk, onEnded?: () => void) {
  Alert.alert('End this walk?', 'Keep your place to pick up where you left off, or clear it to start this walk from stop 1 next time.', [
    { text: 'End and save my place', onPress: () => endWalkNow(walk, false).then(onEnded) },
    { text: 'End and start over next time', style: 'destructive', onPress: () => endWalkNow(walk, true).then(onEnded) },
    { text: 'Keep walking', style: 'cancel' },
  ]);
}

/**
 * Only one walk is active at a time. Starting a different walk while one is under way asks first,
 * keeping the current walk's place so the walker can come back to it.
 */
export function beginWalkOrSwitch(nextId: string, go: () => void) {
  const activeId = useProgress.getState().activeWalkId;
  const current = activeId && activeId !== nextId ? getWalk(activeId) : undefined;
  if (!current) return go();
  Alert.alert(`Switch from ${current.title}?`, 'Only one walk can be active at a time. Your place in this walk is saved.', [
    { text: 'Save my place and switch', onPress: () => endWalkNow(current, false).then(go) },
    { text: 'Keep walking', style: 'cancel' },
  ]);
}
