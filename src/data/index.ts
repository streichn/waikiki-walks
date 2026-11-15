import walksJson from './walks.json';
import factsJson from './facts.json';
import glossaryJson from './glossary.json';
import { images } from './images';
import type { FunFact, GlossaryEntry, Walk } from './types';

export const walks = walksJson as Walk[];
export const facts = factsJson as FunFact[];
export const glossary = glossaryJson as GlossaryEntry[];

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
