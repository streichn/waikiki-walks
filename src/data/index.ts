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
// Veneeta's red walk path traced from her book maps (scripts/georef/routes.py): walk -> "<from n>" -> [[lat, lng], ...].
const routes = routesJson as Record<string, Record<string, number[][]>>;

/** Her traced path from stop a to stop b, or null where her map doesn't join them (the map then draws a straight line). */
export function routeLeg(walkId: string, a: { n: number }, b: { n: number }): LatLng[] | null {
  if (b.n !== a.n + 1) return null;
  const leg = routes[walkId]?.[String(a.n)];
  return leg && leg.length > 1 ? leg.map(([latitude, longitude]) => ({ latitude, longitude })) : null;
}

/** The line drawn on the street map: her red path between the stops her map prints, straight where it isn't traced. */
export function walkPath(walk: Walk): LatLng[] {
  const stops = walk.stops.filter(onMap);
  const out: LatLng[] = [];
  stops.forEach((s, i) => {
    const next = stops[i + 1];
    if (!next) {
      out.push({ latitude: s.lat, longitude: s.lng });
      return;
    }
    out.push(...(routeLeg(walk.id, s, next) ?? [{ latitude: s.lat, longitude: s.lng }, { latitude: next.lat, longitude: next.lng }]));
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
