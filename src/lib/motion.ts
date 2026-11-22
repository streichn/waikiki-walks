import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * The phone's Reduce Motion setting (iPhone: Settings > Accessibility > Motion;
 * Android: Remove animations). When it is on, the app swaps slides, springs and
 * map flights for instant changes or a plain fade, as Apple's Reduced Motion
 * criteria ask. Follows the setting live if it changes while the app is open.
 */
export function useReduceMotion(): boolean {
  return useA11yFlag(AccessibilityInfo.isReduceMotionEnabled, 'reduceMotionChanged');
}

/** True while VoiceOver or TalkBack is running. */
export function useScreenReader(): boolean {
  return useA11yFlag(AccessibilityInfo.isScreenReaderEnabled, 'screenReaderChanged');
}

function useA11yFlag(read: () => Promise<boolean>, event: 'reduceMotionChanged' | 'screenReaderChanged'): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let live = true;
    read()
      .then((v) => live && setOn(v))
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener(event, (v: boolean) => setOn(v));
    return () => {
      live = false;
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return on;
}

/**
 * How long a message that hides itself should stay up. Android returns the
 * user's "Time to take action" setting (Accessibility); iPhone returns the
 * value given. Screen reader users get at least 10 seconds.
 */
export async function messageTimeout(ms: number, screenReader: boolean): Promise<number> {
  let v = ms;
  try {
    v = await AccessibilityInfo.getRecommendedTimeoutMillis(ms);
  } catch {
    v = ms;
  }
  return screenReader ? Math.max(v, 10000) : v;
}
