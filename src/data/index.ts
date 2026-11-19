import walksJson from './walks.json';
import factsJson from './facts.json';
import glossaryJson from './glossary.json';
import routesJson from './routes.json';
import { images } from './images';
import type { FunFact, GlossaryEntry, Walk } from './types';

export const walks = walksJson as Walk[];
export const facts = factsJson as FunFact[];
export const glossary = glossaryJson as GlossaryEntry[];

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

/** The book numbers walks with Roman numerals; the app shows plain numbers (Walk IV is shown as Walk 4). */
/** A stop gets a pin, and an arrival alert, only if Veneeta's book map prints its number. */
export function onMap(s: { geo: string }): boolean {
  return s.geo === 'book';
}

type LatLng = { latitude: number; longitude: number };
const routes = routesJson as unknown as Record<string, Record<string, [number, number][]>>;
const metres = (a: LatLng, b: LatLng) => {
  const k = Math.PI / 180, x = (b.longitude - a.longitude) * k * Math.cos(((a.latitude + b.latitude) / 2) * k), y = (b.latitude - a.latitude) * k;
  return 6371000 * Math.hypot(x, y);
};

/** The walking line from stop i to the next stop: Veneeta's red route traced from her map where we have it, otherwise a straight line. */
export function legPath(walk: Walk, i: number): LatLng[] {
  const a = walk.stops[i], b = walk.stops[i + 1];
  if (!a || !b) return [];
  const A = { latitude: a.lat, longitude: a.lng }, B = { latitude: b.lat, longitude: b.lng };
  const leg = (routes[walk.id] || {})[String(a.n)];
  if (!leg || leg.length < 2) return [A, B];
  const pts = leg.map(([latitude, longitude]) => ({ latitude, longitude }));
  let len = 0;
  for (let k = 1; k < pts.length; k++) len += metres(pts[k - 1], pts[k]);
  // Use the traced line only when it starts and ends at these two stops and is not a wild detour.
  if (metres(A, pts[0]) > 120 || metres(B, pts[pts.length - 1]) > 120 || len > 3 * metres(A, B) + 150) return [A, B];
  return [A, ...pts, B];
}

/** The whole walk as one line through the stops her map prints. */
export function walkPath(walk: Walk): LatLng[] {
  const out: LatLng[] = [];
  walk.stops.forEach((s, i) => {
    if (!onMap(s)) return;
    const next = walk.stops[i + 1];
    if (next && onMap(next)) out.push(...legPath(walk, i).slice(0, -1));
    else out.push({ latitude: s.lat, longitude: s.lng });
  });
  return out;
}

export function walkNo(id: string): number | string {
  return ROMAN[id] ?? id;
}

export function getWalk(id: string): Walk | undefined {
  return walks.find((w) => w.id === id);
}

export function photo(file?: string) {
  return file ? images[file] : undefined;
}

const glossaryMap = new Map(glossary.map((g) => [normalize(g.word), g]));

export function normalize(w: string) {
  return w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʻ'`]/g, '')
    .replace(/[^a-z]/g, '');
}

export function lookupWord(w: string): GlossaryEntry | undefined {
  return glossaryMap.get(normalize(w));
}
