import { addNetworkStateListener } from 'expo-network';
import { type WalkProgress, useAccount, useProgress, useSettings } from '../store';
import { supabase } from './auth';

/**
 * Keeps walk progress and saved stops in the cloud for signed-in walkers, so a new phone
 * picks up where the old one left off. Guests stay on-device only.
 * Tables and security rules: server/schema.sql.
 */

let timer: ReturnType<typeof setTimeout> | undefined;
let started = false;
/** True when a push failed (usually no signal). It is retried as soon as the phone is back online. */
let pending = false;
/** True until the first pull after sign-in succeeds. Until then we don't push, so an offline
 * start can't overwrite progress saved from another phone. */
let pullPending = false;

function userId(): string | null {
  const p = useAccount.getState().profile;
  return p && p.provider !== 'guest' ? p.id : null;
}

/** Merge the cloud copy into this device after sign-in. The furthest progress wins. */
export async function pullFromCloud() {
  const uid = userId();
  if (!supabase || !uid) return;
  const [{ data: rows, error: e1 }, { data: favs, error: e2 }] = await Promise.all([
    supabase.from('walk_progress').select('*').eq('user_id', uid),
    supabase.from('favorites').select('stop_id').eq('user_id', uid),
  ]);
  if (e1 || e2) throw e1 ?? e2;
  const local = useProgress.getState();
  const merged: Record<string, WalkProgress> = { ...local.progress };
  for (const r of rows ?? []) {
    const mine = merged[r.walk_id];
    const visited = Array.from(new Set([...(mine?.visited ?? []), ...(r.visited ?? [])])).sort((a, b) => a - b);
    merged[r.walk_id] = {
      current: Math.max(mine?.current ?? 0, r.current_stop ?? 0),
      visited,
      startedAt: Math.min(mine?.startedAt ?? Date.now(), r.started_at ? Date.parse(r.started_at) : Date.now()),
      finishedAt: mine?.finishedAt ?? (r.finished_at ? Date.parse(r.finished_at) : undefined),
    };
  }
  const { data: prof, error: e3 } = await supabase.from('profiles').select('settings').eq('id', uid).maybeSingle();
  if (e3) throw e3;
  const cloud = (prof?.settings ?? {}) as Record<string, unknown>;
  if (Object.keys(cloud).length) useSettings.getState().set(pickSettings(cloud));
  const favorites = Array.from(new Set([...local.favorites, ...(favs ?? []).map((f) => f.stop_id as string)]));
  useProgress.setState({ progress: merged, favorites });
  pullPending = false;
  await pushToCloud();
}

export async function pushToCloud() {
  const uid = userId();
  if (!supabase || !uid) return;
  const { progress, favorites } = useProgress.getState();
  const rows = Object.entries(progress).map(([walk_id, p]) => ({
    user_id: uid,
    walk_id,
    current_stop: p.current,
    visited: p.visited,
    started_at: new Date(p.startedAt).toISOString(),
    finished_at: p.finishedAt ? new Date(p.finishedAt).toISOString() : null,
    updated_at: new Date().toISOString(),
  }));
  // Supabase reports failures (including no signal) as { error } rather than throwing; turn them into throws
  // so the caller knows to retry.
  const check = ({ error }: { error: unknown }) => {
    if (error) throw error;
  };
  if (rows.length) check(await supabase.from('walk_progress').upsert(rows));
  check(await supabase.from('profiles').update({ settings: pickSettings(useSettings.getState() as unknown as Record<string, unknown>), updated_at: new Date().toISOString() }).eq('id', uid));
  check(await supabase.from('favorites').delete().eq('user_id', uid).not('stop_id', 'in', `(${favorites.map((f) => `"${f}"`).join(',') || '""'})`));
  if (favorites.length) check(await supabase.from('favorites').upsert(favorites.map((stop_id) => ({ user_id: uid, stop_id }))));
}

const SYNCED = ['themeMode', 'autoNarrate', 'arrivalAlerts', 'arrivalRadius', 'speechRate', 'haptics', 'textScale', 'textMargin', 'lineSpacing', 'units'] as const;

/** Only these preferences travel between phones; the voice choice stays per device. */
function pickSettings(src: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of SYNCED) if (src[k] !== undefined) out[k] = src[k];
  return out;
}

async function pushNow() {
  if (pullPending) return syncFromCloud();
  try {
    await pushToCloud();
    pending = false;
  } catch {
    pending = true;
  }
}

async function syncFromCloud() {
  pullPending = true;
  try {
    await pullFromCloud();
    pending = false;
  } catch {
    pending = true;
  }
}

function schedulePush() {
  if (!userId()) return;
  clearTimeout(timer);
  timer = setTimeout(pushNow, 3000);
}

/** Start syncing: pull once, then push a few seconds after any change. */
export function startSync() {
  if (started) return;
  started = true;
  syncFromCloud();
  useProgress.subscribe(schedulePush);
  useSettings.subscribe(schedulePush);
  // Walks often happen with patchy signal. Progress is always saved on the phone first;
  // this only catches the cloud copy up once the connection returns.
  addNetworkStateListener((n) => {
    if (pending && n.isConnected && n.isInternetReachable !== false) pushNow();
  });
  useAccount.subscribe((s, prev) => {
    if (s.profile?.id !== prev.profile?.id && userId()) syncFromCloud();
  });
}
