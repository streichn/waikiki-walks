export type Pt = { x: number; y: number };
/** Distance along a polyline to the point nearest (x, y), and how far off the line that point is. */
export function alongLine(pts: Pt[], x: number, y: number): { d: number; s: number } {
  let best = { d: Infinity, s: 0 }, acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (L * L))), d = Math.hypot(a.x + t * dx - x, a.y + t * dy - y);
    if (d < best.d) best = { d, s: acc + t * L };
    acc += L;
  }
  return best;
}
/** The first `s` of a polyline's length, ending exactly at that point. */
export function lineUpTo(pts: Pt[], s: number): Pt[] {
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.y - a.y);
    if (acc + L >= s) { const t = L ? (s - acc) / L : 0; out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }); return out; }
    out.push(b); acc += L;
  }
  return out;
}

