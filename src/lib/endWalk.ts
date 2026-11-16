import { Alert } from 'react-native';
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
