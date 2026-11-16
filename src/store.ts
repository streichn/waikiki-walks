import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

type SettingsState = {
  themeMode: ThemeMode;
  autoNarrate: boolean; // read each stop aloud on arrival
  arrivalAlerts: boolean; // GPS arrival detection
  arrivalRadius: number; // meters
  speechRate: number; // 0.7 to 1.3
  voiceId?: string;
  haptics: boolean;
  textScale: number; // 0.9 to 1.4
  units: 'imperial' | 'metric';
  onboarded: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      autoNarrate: false,
      arrivalAlerts: true,
      arrivalRadius: 35,
      speechRate: 1.0,
      voiceId: undefined,
      haptics: true,
      textScale: 1,
      units: 'imperial',
      onboarded: false,
      set: (patch) => set(patch),
    }),
    { name: 'settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export type WalkProgress = {
  current: number; // index into stops
  visited: number[]; // stop indexes the walker has reached
  startedAt: number;
  finishedAt?: number;
};

type ProgressState = {
  activeWalkId?: string;
  progress: Record<string, WalkProgress>;
  favorites: string[]; // stop ids
  startWalk: (walkId: string, at?: number) => void;
  goTo: (walkId: string, index: number) => void;
  markVisited: (walkId: string, index: number) => void;
  /** End the active walk. `discard` clears its progress so it starts at stop 1 next time. */
  endWalk: (finished: boolean, discard?: boolean) => void;
  toggleFavorite: (stopId: string) => void;
  reset: () => void;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      activeWalkId: undefined,
      progress: {},
      favorites: [],
      startWalk: (walkId, at = 0) => {
        const existing = get().progress[walkId];
        set({
          activeWalkId: walkId,
          progress: {
            ...get().progress,
            [walkId]: existing && !existing.finishedAt
              ? { ...existing, current: at || existing.current }
              : { current: at, visited: [], startedAt: Date.now() },
          },
        });
      },
      goTo: (walkId, index) => {
        const p = get().progress[walkId];
        if (!p) return;
        set({ progress: { ...get().progress, [walkId]: { ...p, current: index } } });
      },
      markVisited: (walkId, index) => {
        const p = get().progress[walkId];
        if (!p || p.visited.includes(index)) return;
        set({ progress: { ...get().progress, [walkId]: { ...p, visited: [...p.visited, index] } } });
      },
      endWalk: (finished, discard) => {
        const id = get().activeWalkId;
        if (!id) return;
        const p = get().progress[id];
        if (discard) {
          const { [id]: _drop, ...rest } = get().progress;
          set({ activeWalkId: undefined, progress: rest });
          return;
        }
        set({
          activeWalkId: undefined,
          progress: finished && p ? { ...get().progress, [id]: { ...p, finishedAt: Date.now() } } : get().progress,
        });
      },
      toggleFavorite: (stopId) => {
        const f = get().favorites;
        set({ favorites: f.includes(stopId) ? f.filter((x) => x !== stopId) : [...f, stopId] });
      },
      reset: () => set({ activeWalkId: undefined, progress: {}, favorites: [] }),
    }),
    { name: 'progress', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export type Profile = {
  id: string;
  name?: string | null;
  email?: string | null;
  provider: 'apple' | 'google' | 'email' | 'guest';
  avatarUrl?: string | null;
};

type AccountState = {
  profile?: Profile;
  isPro: boolean; // mirrors the RevenueCat entitlement; RevenueCat stays the source of truth
  passExpiry?: number; // week pass end time (ms), if a pass is active
  setProfile: (p?: Profile) => void;
  setPro: (v: boolean) => void;
  setPassExpiry: (t?: number) => void;
};

export const useAccount = create<AccountState>()(
  persist(
    (set) => ({
      profile: undefined,
      isPro: false,
      setProfile: (profile) => set({ profile }),
      setPro: (isPro) => set({ isPro }),
      passExpiry: undefined,
      setPassExpiry: (passExpiry) => set({ passExpiry }),
    }),
    { name: 'account', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
