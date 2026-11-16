"""Find where two named Honolulu streets cross, from OpenStreetMap geometry (Nominatim), with a cache.
Used to georeference Veneeta's book maps: each control point is an intersection she labels on the map."""
import json, os, sys, time, urllib.parse, urllib.request
from shapely.geometry import LineString, MultiLineString, Point
from shapely.ops import unary_union, nearest_points

CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'streets_cache.json')
_cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
UA = {'User-Agent': 'WaikikiWalksGeocoder/1.0'}

def street(name):
    """Every OpenStreetMap segment of a named street near Waikīkī (pages past Nominatim's 50-result limit)."""
    if name in _cache: return _cache[name]
    lines, seen = [], []
    for _ in range(8):
        q = {'street': name, 'city': 'Honolulu', 'format': 'json', 'polygon_geojson': 1, 'dedupe': 0, 'limit': 50,
             'viewbox': '-157.86,21.34,-157.79,21.25', 'bounded': 1}
        if seen: q['exclude_place_ids'] = ','.join(seen)
        d = json.load(urllib.request.urlopen(urllib.request.Request('https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(q), headers=UA), timeout=40))
        time.sleep(1.1)
        new = [x for x in d if str(x['place_id']) not in seen]
        if not new: break
        seen += [str(x['place_id']) for x in new]
        lines += [x['geojson']['coordinates'] for x in new if x.get('geojson', {}).get('type') == 'LineString']
        if len(d) < 50: break
    _cache[name] = lines; json.dump(_cache, open(CACHE, 'w'))
    return lines

def crossing(a, b, near=None):
    """Return (lat, lng, gap_m) where streets a and b meet; gap_m > 0 when they only come close."""
    A = unary_union([LineString(c) for c in street(a) if len(c) > 1]); B = unary_union([LineString(c) for c in street(b) if len(c) > 1])
    if A.is_empty or B.is_empty: return None
    x = A.intersection(B)
    pts = [g for g in getattr(x, 'geoms', [x]) if g.geom_type == 'Point'] if not x.is_empty else []
    if pts:
        if near: pts.sort(key=lambda p: p.distance(Point(near[1], near[0])))
        return (pts[0].y, pts[0].x, 0.0)
    p, q = nearest_points(A, B)
    gap = p.distance(q) * 111000
    return ((p.y + q.y) / 2, (p.x + q.x) / 2, round(gap))

if __name__ == '__main__':
    print(crossing(sys.argv[1], sys.argv[2]))
