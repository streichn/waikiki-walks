import routesJson from '../data/routes.json';
import type { GeoConfidence, RouteLeg, Stop, Walk } from '../data/types';
import { distanceM } from './geo';

const routes = routesJson as unknown as Record<string, RouteLeg[]>;

export type Coord = { latitude: number; longitude: number };

/** Pins we trust enough to draw a street-level path to. Others keep a dashed straight line. */
const CONFIDENT: GeoConfidence[] = ['verified', 'medium'];
/** If a pin has moved more than this since the path was built, ignore the stale path. */
const MOVED_M = 20;

export type Leg = { coords: Coord[]; onStreets: boolean; meters: number | null };

const toCoord = (p: [number, number]): Coord => ({ latitude: p[0], longitude: p[1] });

/**
 * The line to draw from stop i to stop i + 1.
 * A walking path along real footways when both pins are confident and unchanged,
 * otherwise a straight line that the map draws dashed to show it is only the general direction.
 */
export function legBetween(walk: Walk, i: number): Leg | null {
  const s0: Stop | undefined = walk.stops[i];
  const s1: Stop | undefined = walk.stops[i + 1];
  if (!s0 || !s1) return null;
  const straight: Leg = { coords: [{ latitude: s0.lat, longitude: s0.lng }, { latitude: s1.lat, longitude: s1.lng }], onStreets: false, meters: null };
  const leg = routes[walk.id]?.find((l) => l.from === s0.id && l.to === s1.id);
  if (!leg || leg.kind !== 'path' || !leg.path) return straight;
  if (!CONFIDENT.includes(s0.geo) || !CONFIDENT.includes(s1.geo)) return straight;
  const moved = distanceM(s0, { lat: leg.a[0], lng: leg.a[1] }) > MOVED_M || distanceM(s1, { lat: leg.b[0], lng: leg.b[1] }) > MOVED_M;
  if (moved) return straight;
  return { coords: leg.path.map(toCoord), onStreets: true, meters: leg.m };
}

/** All legs of a walk, for drawing. */
export function walkLegs(walk: Walk): Leg[] {
  const out: Leg[] = [];
  for (let i = 0; i < walk.stops.length - 1; i++) {
    const l = legBetween(walk, i);
    if (l) out.push(l);
  }
  return out;
}
