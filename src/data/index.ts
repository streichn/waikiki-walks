import walksJson from './walks.json';
import factsJson from './facts.json';
import glossaryJson from './glossary.json';
import { images } from './images';
import type { FunFact, GlossaryEntry, Walk } from './types';

export const walks = walksJson as Walk[];
export const facts = factsJson as FunFact[];
export const glossary = glossaryJson as GlossaryEntry[];

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

/** The book numbers walks with Roman numerals; the app shows plain numbers (Walk IV is shown as Walk 4). */
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
