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

/**
 * Phone compasses wobble by several degrees. Blend each new reading into the last one
 * (on the circle, so 359 and 1 average to 0, not 180) so the answer does not flicker
 * between two stops while the walker holds still.
 */
export function smoothHeading(prev: number | null, next: number, alpha = 0.25): number {
  if (prev === null) return next;
  return (prev + headingDelta(prev, next) * alpha + 360) % 360;
}

/**
 * Expo reports compass calibration as 0 to 3. On iOS, 1 means up to 50 degrees of
 * uncertainty and 0 means more than 50, which is wider than our 70 degree view cone.
 */
export function compassUnsure(accuracy: number | null | undefined): boolean {
  return accuracy !== null && accuracy !== undefined && accuracy <= 1;
}

export const visionAvailable = Boolean(LENS_ENDPOINT);

export type LensAnswer = { stopId: string | null; reason: string };

/**
 * Ask the vision service which candidate is in the photo. Only ids from `candidates`
 * are accepted back, so the answer can never point outside the book.
 * Gives up after 12 seconds, since walkers are often on weak signal.
 */
export async function identifyPhoto(base64Jpeg: string, candidates: LensCandidate[]): Promise<LensAnswer> {
  if (!LENS_ENDPOINT || !base64Jpeg || !candidates.length) return { stopId: null, reason: '' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(LENS_ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Jpeg,
        candidates: candidates.map((c) => ({ id: c.stop.id, title: c.stop.title, distance: Math.round(c.distance), summary: c.stop.blocks.find((b) => b.kind === 'p')?.text.slice(0, 400) })),
      }),
    });
    if (!res.ok) throw new Error('Could not identify the photo');
    const out = (await res.json()) as Partial<LensAnswer>;
    const ok = candidates.some((c) => c.stop.id === out.stopId);
    return { stopId: ok ? (out.stopId as string) : null, reason: typeof out.reason === 'string' ? out.reason.slice(0, 200) : '' };
  } finally {
    clearTimeout(timer);
  }
}
