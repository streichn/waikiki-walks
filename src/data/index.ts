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

/** The purple used for her map's side-trip (alternate route) lines. */
export const SIDE_TRIP = '#8E6BB8';

function between(walk: Walk, i: number, j: number): LatLng[] {
  const a = walk.stops[i], b = walk.stops[j];
  if (!a || !b) return [];
  const A = { latitude: a.lat, longitude: a.lng }, B = { latitude: b.lat, longitude: b.lng };
  const key = j === i + 1 ? String(a.n) : `${a.n}>${b.n}`;
  const leg = (routes[walk.id] || {})[key];
  if (!leg || leg.length < 2) return [A, B];
  const pts = leg.map(([latitude, longitude]) => ({ latitude, longitude }));
  let len = 0;
  for (let k = 1; k < pts.length; k++) len += metres(pts[k - 1], pts[k]);
  // Use the traced or street line only when it starts and ends at these two stops and is not a wild detour.
  if (metres(A, pts[0]) > 120 || metres(B, pts[pts.length - 1]) > 120 || len > 3 * metres(A, B) + 150) return [A, B];
  return [A, ...pts, B];
}

const onMain = (s: { geo: string; side?: boolean }) => onMap(s) && !s.side;

/** The walking line from stop i to the next stop: her red route where it was traced, else a walking route along
 * the streets, else a straight line. Into or out of a side-trip stop it is a straight connector. */
export function legPath(walk: Walk, i: number): LatLng[] {
  const a = walk.stops[i], b = walk.stops[i + 1];
  if (!a || !b) return [];
  if (a.side || b.side) return [{ latitude: a.lat, longitude: a.lng }, { latitude: b.lat, longitude: b.lng }];
  return between(walk, i, i + 1);
}

/** The main route as one line through the stops her map prints, skipping side-trip stops; up to a stop if given. */
export function walkPath(walk: Walk, upto?: number): LatLng[] {
  const idx = walk.stops.map((s, i) => (onMain(s) && (upto === undefined || i <= upto) ? i : -1)).filter((i) => i >= 0);
  const out: LatLng[] = [];
  idx.forEach((i, k) => {
    const j = idx[k + 1];
    if (j === undefined) out.push({ latitude: walk.stops[i].lat, longitude: walk.stops[i].lng });
    else out.push(...between(walk, i, j).slice(0, -1));
  });
  return out;
}

/** Purple connectors for side-trip stops: from the main stop before, to the side stop, to the main stop after. */
export function sidePaths(walk: Walk): LatLng[][] {
  return walk.stops.flatMap((s, i) => {
    if (!s.side || !onMap(s)) return [];
    const before = [...walk.stops.slice(0, i)].reverse().find(onMain), after = walk.stops.slice(i + 1).find(onMain);
    return [[before, s, after].filter(Boolean).map((x) => ({ latitude: x!.lat, longitude: x!.lng }))];
  });
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
