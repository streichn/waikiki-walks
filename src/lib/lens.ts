import { LENS_ENDPOINT } from '../config';
import { walks, onMap } from '../data';
import type { Stop, Walk } from '../data/types';
import { bearingDeg, distanceM, headingDelta, type LatLng } from './geo';

export type LensCandidate = { walk: Walk; stop: Stop; distance: number; offAxis: number; score: number };

/**
 * "What am I looking at?"
 * Step 1 works offline and needs no server: combine GPS position and compass heading,
 * and rank the book's stops that sit in front of the camera and close by.
 * Step 2 (optional) sends the photo plus those candidates to a vision model on our
 * server, which picks the best match or says none match. The server only chooses among
 * the book's own stops, so the answer always links back to the book's text.
 */
export function candidatesInView(pos: LatLng, heading: number, maxDistance = 350, fov = 70): LensCandidate[] {
  const out: LensCandidate[] = [];
  for (const walk of walks) {
    for (const stop of walk.stops) {
      if (!onMap(stop)) continue; // only stops her map places
      const d = distanceM(pos, stop);
      if (d > maxDistance) continue;
      const off = Math.abs(headingDelta(heading, bearingDeg(pos, stop)));
      if (d > 25 && off > fov / 2) continue; // behind or beside the walker
      const score = (1 - d / maxDistance) * 0.6 + (1 - Math.min(off, 90) / 90) * 0.4;
      out.push({ walk, stop, distance: d, offAxis: off, score });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}

export const visionAvailable = Boolean(LENS_ENDPOINT);

export async function identifyPhoto(base64Jpeg: string, candidates: LensCandidate[]): Promise<{ stopId: string | null; reason: string }> {
  if (!LENS_ENDPOINT) return { stopId: candidates[0]?.stop.id ?? null, reason: 'Matched by location and direction.' };
  const res = await fetch(LENS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Jpeg,
      candidates: candidates.map((c) => ({ id: c.stop.id, title: c.stop.title, distance: Math.round(c.distance), summary: c.stop.blocks.find((b) => b.kind === 'p')?.text.slice(0, 400) })),
    }),
  });
  if (!res.ok) throw new Error('Could not identify the photo');
  return res.json();
}
