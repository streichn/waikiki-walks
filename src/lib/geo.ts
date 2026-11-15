const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

export type LatLng = { lat: number; lng: number };

/** Great-circle distance in meters. */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Initial bearing from a to b in degrees, 0 = north. */
export function bearingDeg(a: LatLng, b: LatLng): number {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Smallest signed difference between two headings, in degrees (-180..180). */
export function headingDelta(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}

export function formatDistance(m: number, units: 'imperial' | 'metric'): string {
  if (units === 'metric') return m < 1000 ? `${Math.round(m / 5) * 5} m` : `${(m / 1000).toFixed(1)} km`;
  const ft = m * 3.28084;
  return ft < 1000 ? `${Math.round(ft / 10) * 10} ft` : `${(m / 1609.34).toFixed(1)} mi`;
}

/** Walking time at an easy sightseeing pace (about 4 km/h). */
export function walkMinutes(m: number): number {
  return Math.max(1, Math.round(m / 67));
}

export function routeLength(points: LatLng[]): number {
  let t = 0;
  for (let i = 1; i < points.length; i++) t += distanceM(points[i - 1], points[i]);
  return t;
}

/** Hawaiian directionals used in the book, mapped to compass headings around Waikīkī. */
export function hawaiianDirection(bearing: number): string {
  // Around Waikīkī: mauka is roughly north-northeast, makai south-southwest,
  // Diamond Head east-southeast, ʻEwa west-northwest.
  const dirs: [number, string][] = [
    [20, 'mauka'],
    [110, 'Diamond Head'],
    [200, 'makai'],
    [290, 'ʻEwa'],
  ];
  let best = dirs[0];
  for (const d of dirs) if (Math.abs(headingDelta(bearing, d[0])) < Math.abs(headingDelta(bearing, best[0]))) best = d;
  return best[1];
}
