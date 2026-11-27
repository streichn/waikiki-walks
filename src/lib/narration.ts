import * as Network from 'expo-network';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
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

/**
 * Android's Google voices come in two kinds, told apart only by the end of their name:
 * "...-local" voices are installed on the phone, "...-network" voices stream from Google and
 * fail without signal. Android has Voice.isNetworkConnectionRequired(), but expo-speech
 * does not pass it on, so we read the name. iPhone voices are always on the phone.
 */
export function needsInternet(v: Pick<Speech.Voice, 'identifier'>): boolean {
  return Platform.OS === 'android' && /-network$/i.test(v.identifier);
}

const REGION: Record<string, string> = { US: 'US', GB: 'UK', AU: 'Australian', IN: 'Indian', NG: 'Nigerian', CA: 'Canadian', IE: 'Irish', ZA: 'South African', NZ: 'New Zealand' };

/** Android names voices like "en-us-x-iol-local"; show "US English, voice IOL" instead. */
export function voiceLabel(v: Pick<Speech.Voice, 'identifier' | 'name' | 'language'>): string {
  if (Platform.OS !== 'android') return v.name;
  const m = /^[a-z]{2,3}-([a-z]{2})-x-([a-z0-9]+)-(?:local|network)$/i.exec(v.identifier);
  if (!m) return v.name;
  const region = REGION[m[1].toUpperCase()];
  return `${region ? `${region} English` : 'English'}, voice ${m[2].toUpperCase()}`;
}

let lastOnline = true;
/** Offline right now? Unknown counts as online, as in lib/network. */
async function offline(): Promise<boolean> {
  try {
    const s = await Network.getNetworkStateAsync();
    lastOnline = !(s.isConnected === false || s.isInternetReachable === false);
  } catch {
    // keep the last answer
  }
  return !lastOnline;
}

/** The chosen voice, unless it streams from the internet and there is none: then the phone's default. */
let voiceToUse: string | undefined;
async function pickVoice() {
  const { voiceId } = useSettings.getState();
  voiceToUse = voiceId && needsInternet({ identifier: voiceId }) && (await offline()) ? undefined : voiceId;
}

function speakNext(stopId: string, myToken: number, index: number) {
  if (myToken !== token) return;
  const text = queue[index];
  if (text === undefined) {
    useNarration.setState({ speakingStopId: undefined, paragraph: -1, paused: false });
    return;
  }
  const { speechRate } = useSettings.getState();
  useNarration.setState({ speakingStopId: stopId, paragraph: index - 1 });
  Speech.speak(text, {
    rate: speechRate,
    voice: voiceToUse,
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
  await pickVoice();
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
  const { speechRate } = useSettings.getState();
  await pickVoice();
  Speech.speak(prepare(text), { rate: speechRate, voice: voiceToUse, language: 'en-US', useApplicationAudioSession: false });
}

export async function englishVoices() {
  const v = await Speech.getAvailableVoicesAsync();
  // Voices on the phone first (they work with no signal), then Enhanced, then by name.
  const rank = (x: Speech.Voice) => (needsInternet(x) ? 2 : 0) + (x.quality === 'Enhanced' ? 0 : 1);
  return v
    .filter((x) => x.language.toLowerCase().startsWith('en'))
    .sort((a, b) => rank(a) - rank(b) || voiceLabel(a).localeCompare(voiceLabel(b)));
}
