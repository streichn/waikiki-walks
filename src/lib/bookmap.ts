import bookmapsJson from '../data/bookmaps.json';

type Fit = { ctrl: number[][]; w: number[][]; a: number[][] };
type BookMap = { file: string; w: number; h: number; origin: [number, number]; k: [number, number]; scale: number; fwd: Fit; rms_m: number };
const maps = bookmapsJson as unknown as Record<string, BookMap>;

export const hasBookGeo = (walkId: string) => Boolean(maps[walkId]);

/**
 * Where a latitude/longitude falls on Veneeta's map for a walk, as fractions (0 to 1) of the image width and height.
 * Each map was fitted to real street intersections (scripts/georef): an affine fit plus a thin-plate spline.
 */
export function bookXY(walkId: string, lat: number, lng: number): { x: number; y: number } | null {
  const g = maps[walkId];
  if (!g) return null;
  const x = ((lng - g.origin[1]) * g.k[0]) / g.scale;
  const y = ((lat - g.origin[0]) * g.k[1]) / g.scale;
  const f = g.fwd;
  let px = f.a[0][0] + x * f.a[1][0] + y * f.a[2][0];
  let py = f.a[0][1] + x * f.a[1][1] + y * f.a[2][1];
  f.ctrl.forEach((c, i) => {
    const d = Math.hypot(x - c[0], y - c[1]);
    if (d > 0) {
      const u = d * d * Math.log(d);
      px += u * f.w[i][0];
      py += u * f.w[i][1];
    }
  });
  return { x: px / g.w, y: py / g.h };
}
