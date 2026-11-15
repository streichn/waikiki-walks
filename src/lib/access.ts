import { BROWSE_PREVIEW_STOPS, TRIAL } from '../config';
import { useAccount } from '../store';

/** Returns true when the walker may open this stop. Index is 0-based. */
export function canOpenStop(walkId: string, index: number, isPro: boolean): boolean {
  if (isPro) return true;
  if (walkId === TRIAL.walkId) return index < TRIAL.freeStops;
  return index < BROWSE_PREVIEW_STOPS;
}

/** Whether the walker can start the guided (GPS) mode for a walk. */
export function canStartWalk(walkId: string, isPro: boolean): boolean {
  return isPro || walkId === TRIAL.walkId;
}

export function useIsPro() {
  return useAccount((s) => s.isPro);
}
