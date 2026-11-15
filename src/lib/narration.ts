import * as Speech from 'expo-speech';
import { create } from 'zustand';
import type { Stop } from '../data/types';
import { useSettings } from '../store';

/**
 * Read-aloud uses the phone's own voice (Siri voices on iPhone, Google voices on Android).
 * Swapping in recorded audio later only changes `play()`: keep a per-stop audio file
 * and fall back to speech when none exists.
 */

type NarrationState = {
  speakingStopId?: string;
  paragraph: number; // which paragraph is being read, for highlighting
  paused: boolean;
};

export const useNarration = create<NarrationState>(() => ({ speakingStopId: undefined, paragraph: -1, paused: false }));

let queue: string[] = [];
let token = 0;

// Expand directionals and abbreviations so the voice reads them naturally.
function prepare(text: string): string {
  return text
    .replace(/\bSt\./g, 'Street')
    .replace(/\bAve\./g, 'Avenue')
    .replace(/\bBlvd\./g, 'Boulevard')
    .replace(/\bRd\./g, 'Road')
    .replace(/\bft\b/g, 'feet')
    .replace(/[*•]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopScript(stop: Stop): string[] {
  const parts = [`Stop ${stop.n}. ${stop.title}.`];
  for (const b of stop.blocks) {
    if (b.kind === 'p' || b.kind === 'direction' || b.kind === 'tagline') parts.push(prepare(b.text));
  }
  return parts;
}

function speakNext(stopId: string, myToken: number, index: number) {
  if (myToken !== token) return;
  const text = queue[index];
  if (text === undefined) {
    useNarration.setState({ speakingStopId: undefined, paragraph: -1, paused: false });
    return;
  }
  const { speechRate, voiceId } = useSettings.getState();
  useNarration.setState({ speakingStopId: stopId, paragraph: index - 1 });
  Speech.speak(text, {
    rate: speechRate,
    voice: voiceId,
    language: 'en-US',
    useApplicationAudioSession: false, // let the system duck music and handle interruptions
    onDone: () => speakNext(stopId, myToken, index + 1),
    onError: () => speakNext(stopId, myToken, index + 1),
  });
}

export async function play(stop: Stop, fromParagraph = 0) {
  await Speech.stop();
  token += 1;
  queue = stopScript(stop);
  speakNext(stop.id, token, fromParagraph);
}

export async function stop() {
  token += 1;
  queue = [];
  await Speech.stop();
  useNarration.setState({ speakingStopId: undefined, paragraph: -1, paused: false });
}

export async function togglePause() {
  const s = useNarration.getState();
  if (!s.speakingStopId) return;
  // pause/resume exist on iOS; on Android we stop instead.
  try {
    if (s.paused) {
      await Speech.resume();
      useNarration.setState({ paused: false });
    } else {
      await Speech.pause();
      useNarration.setState({ paused: true });
    }
  } catch {
    await stop();
  }
}

export async function speakShort(text: string) {
  const { speechRate, voiceId } = useSettings.getState();
  Speech.speak(prepare(text), { rate: speechRate, voice: voiceId, language: 'en-US', useApplicationAudioSession: false });
}

export async function englishVoices() {
  const v = await Speech.getAvailableVoicesAsync();
  return v.filter((x) => x.language.startsWith('en')).sort((a, b) => (a.quality === b.quality ? a.name.localeCompare(b.name) : a.quality === 'Enhanced' ? -1 : 1));
}
