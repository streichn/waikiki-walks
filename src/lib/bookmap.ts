import bookmapsJson from '../data/bookmaps.json';

type Fit = { ctrl: number[][]; w: number[][]; a: number[][] };
type BookPage = { file: string; w: number; h: number; fwd: Fit; labels?: Record<string, number[]>; legs?: Record<string, number[][]> };
type BookMap = BookPage & { origin: [number, number]; k: [number, number]; scale: number; rms_m: number; pages?: BookPage[] };
const maps = bookmapsJson as unknown as Record<string, BookMap>;

export const hasBookGeo = (walkId: string) => Boolean(maps[walkId]);

/**
 * Where a latitude/longitude falls on Veneeta's map for a walk, as fractions (0 to 1) of the image width and height.
 * Each map was fitted to real street intersections (scripts/georef): an affine fit plus a thin-plate spline.
 */
export function bookXY(walkId: string, lat: number, lng: number, page = 0): { x: number; y: number } | null {
  const g = maps[walkId];
  const p = bookPages(walkId)[page];
  if (!g || !p) return null;
  const x = ((lng - g.origin[1]) * g.k[0]) / g.scale;
  const y = ((lat - g.origin[0]) * g.k[1]) / g.scale;
  const f = p.fwd;
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
  return { x: px / p.w, y: py / p.h };
}

/** Where her map prints a stop's number, as fractions of the image, if it has been read off the map. */
export function bookLabel(walkId: string, n: number, page = 0): { x: number; y: number } | null {
  const g = bookPages(walkId)[page];
  const L = g?.labels?.[String(n)];
  return g && L ? { x: L[0] / g.w, y: L[1] / g.h } : null;
}

/** Some walks span several map pages in the book (Walk VIII has 2, Walk X has 4). Page 0 is the first. */
export function bookPages(walkId: string): BookPage[] {
  const g = maps[walkId];
  return g ? [g, ...(g.pages ?? [])] : [];
}

/** The map page that prints a stop's number, so the book map opens on the right page. */
export function pageFor(walkId: string, n: number | undefined): number {
  if (n === undefined) return 0;
  const k = bookPages(walkId).findIndex((p) => p.labels?.[String(n)]);
  return k >= 0 ? k : 0;
}

/** Her dotted line from stop n to n + 1 on a map page, as fractions of the image, for every leg traced on that page. */
export function bookLegs(walkId: string, page = 0): { n: number; pts: { x: number; y: number }[] }[] {
  const g = bookPages(walkId)[page];
  if (!g?.legs) return [];
  return Object.entries(g.legs).map(([n, pts]) => ({ n: Number(n), pts: pts.map(([x, y]) => ({ x: x / g.w, y: y / g.h })) }));
}
