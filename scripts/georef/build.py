"""Turn the fitted control points into transforms the app uses, and place stops from the book maps.

1. For each book map, fit lat/lng -> pixel (for drawing pins and the walker's dot on Veneeta's map)
   and pixel -> lat/lng (for placing a stop where her map prints its number). Each is an affine fit
   plus a smoothed thin-plate spline through the street intersections in georef.json.
2. For stops listed in map_stops.json (the pixel where her map prints each number), snap the point
   to her red route line and convert it to lat/lng. Writes scripts/extract/book_pins.json.
   Walks whose route continues onto more map pages (pages.json) get pins from those pages too.
3. Writes src/data/bookmaps.json: per walk, image size and the forward transform for the app.
"""
import json, math, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
G = json.load(open(os.path.join(HERE, 'georef.json')))
STOPS = json.load(open(os.path.join(HERE, 'map_stops.json'))) if os.path.exists(os.path.join(HERE, 'map_stops.json')) else {}
LAT0, LNG0 = 21.28, -157.83
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574

def to_m(lat, lng): return np.array([(lng - LNG0) * KX, (lat - LAT0) * KY])
def to_ll(x, y): return (LAT0 + y / KY, LNG0 + x / KX)

def tps_fit(src, dst, lam):
    """Affine + thin-plate spline from src (n,2) to dst (n,2). Returns params for tps_eval."""
    n = len(src)
    d = np.linalg.norm(src[:, None] - src[None], axis=2)
    K = np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) + np.diag(np.broadcast_to(lam, (n,)).astype(float))
    P = np.hstack([np.ones((n, 1)), src])
    L = np.zeros((n + 3, n + 3)); L[:n, :n] = K; L[:n, n:] = P; L[n:, :n] = P.T
    rhs = np.zeros((n + 3, 2)); rhs[:n] = dst
    sol = np.linalg.solve(L, rhs)
    return {'ctrl': src.tolist(), 'w': sol[:n].tolist(), 'a': sol[n:].tolist()}

def tps_eval(p, pt):
    c = np.array(p['ctrl']); w = np.array(p['w']); a = np.array(p['a'])
    d = np.linalg.norm(c - pt, axis=1)
    u = np.where(d > 0, d * d * np.log(d + 1e-12), 0.0)
    return a[0] + pt[0] * a[1] + pt[1] * a[2] + u @ w

def route_mask(file):
    path = file if os.path.isabs(file) else os.path.join(ROOT, 'assets/book', file)
    im = np.asarray(Image.open(path).convert('RGB')).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    m = (r > 150) & (g < 80) & (b < 110) & (r - g > 110)  # the red dotted walk path
    ys, xs = np.nonzero(m)
    return np.stack([xs, ys], 1)

FIXES = json.load(open(os.path.join(HERE, 'author_fixes.json'))) if os.path.exists(os.path.join(HERE, 'author_fixes.json')) else {}

_canal = None
def canal_bank():
    """Edges of wide water (canal, ocean) in meters, from the bundled OpenStreetMap z16 tiles, with streams
    narrower than about 20 m removed, so a pin beside the Ala Wai snaps to the canal itself."""
    global _canal
    if _canal is not None: return _canal
    from scipy import ndimage
    z, tiles = 16, os.path.join(ROOT, 'preview/tiles/osm/16')
    xs = sorted(int(x) for x in os.listdir(tiles)); ys = sorted({int(f[:-4]) for x in xs for f in os.listdir(os.path.join(tiles, str(x)))})
    mosaic = np.zeros(((ys[-1] - ys[0] + 1) * 256, (xs[-1] - xs[0] + 1) * 256), bool)
    for x in xs:
        for f in os.listdir(os.path.join(tiles, str(x))):
            a = np.asarray(Image.open(os.path.join(tiles, str(x), f)).convert('RGB')).astype(int)
            m = (abs(a[..., 0] - 170) < 12) & (abs(a[..., 1] - 211) < 12) & (abs(a[..., 2] - 223) < 12)
            y = int(f[:-4]); mosaic[(y - ys[0]) * 256:(y - ys[0] + 1) * 256, (x - xs[0]) * 256:(x - xs[0] + 1) * 256] = m
    body = ndimage.binary_opening(mosaic, iterations=4)  # drops streams narrower than ~20 m
    N = 2 ** z
    edge = body & ~ndimage.binary_erosion(body)
    py, px = np.nonzero(edge)
    lng = (xs[0] + px / 256) / N * 360 - 180
    lat = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * (ys[0] + py / 256) / N))))
    _canal = np.stack([(lng - LNG0) * KX, (lat - LAT0) * KY], 1)
    return _canal

def snap_to_canal(xm, ym, inland=10.0):
    """Nearest point on the canal's edge, then `inland` meters back toward where the pin was (the bank walkway)."""
    bank = canal_bank(); p = np.array([xm, ym])
    dist = np.linalg.norm(bank - p, axis=1); i = np.argmin(dist)
    assert dist[i] < 150, f'no canal within 150 m of the pin ({dist[i]:.0f} m)'
    b = bank[i]
    v = p - b; d = np.linalg.norm(v)
    return (b + v / d * inland) if d > 1e-6 else b

def route_between(route, prev_px, next_px):
    """The point on her red route halfway (by distance) between the stops before and after, within the corridor
    joining them, so a stop whose number sits away from the path is placed where the walker reads it."""
    a, b = np.array(prev_px, float), np.array(next_px, float); ab = b - a; L = np.linalg.norm(ab)
    t = np.clip(((route - a) @ ab) / (L * L), 0, 1); seg = np.linalg.norm(route - (a + t[:, None] * ab), axis=1)
    cand = route[seg < max(20.0, 0.35 * L)]
    if not len(cand): return (a + b) / 2
    da, db = np.linalg.norm(cand - a, axis=1), np.linalg.norm(cand - b, axis=1)
    return cand[np.argmin(abs(da - db) + 0.2 * seg[seg < max(20.0, 0.35 * L)])].astype(float)

out_maps, pins = {}, {}
walks = json.load(open(os.path.join(ROOT, 'src/data/walks.json')))
walks = walks if isinstance(walks, list) else walks['walks']
for w in walks:
    wid, f = w['id'], w.get('bookMap')
    if not f or wid not in G: continue
    ctl = G[wid]['controls']
    px = np.array([[c['px'], c['py']] for c in ctl], float)
    m = np.array([to_m(c['lat'], c['lng']) for c in ctl])
    # meters are ~2 px each, so smooth a little in both spaces to absorb hand-read positions
    lam = np.array([2.0 if c.get('kind') else 0.05 for c in ctl])  # streets firm, shoreline soft
    fwd = tps_fit(m / 100.0, px, lam=lam)
    inv = tps_fit(px / 100.0, m, lam=lam)
    W, H = Image.open(os.path.join(ROOT, 'assets/book', f)).size
    out_maps[wid] = {'file': f, 'w': W, 'h': H, 'origin': [LAT0, LNG0], 'k': [KX, KY], 'scale': 100.0, 'fwd': fwd, 'rms_m': G[wid]['rms_m'],
                     # where her map prints each stop number, so the app can make her own numbers tappable
                     'labels': {n: [v[0], v[1]] for n, v in STOPS.get(wid, {}).items()}}
    if wid in STOPS:
        route = route_mask(f)
        pins[wid] = {}
        mpp = 1 / math.sqrt(abs(np.linalg.det(np.array(G[wid]['affine'])[:2])))  # meters per map pixel
        for n, (lx, ly, *flag) in STOPS[wid].items():
            pt = np.array([lx, ly], float)
            fix = FIXES.get(wid, {}).get(n)
            extra = {}
            if fix and fix['on'] == 'route':
                prev_n, next_n = str(int(n) - 1), str(int(n) + 1)
                if prev_n in STOPS[wid] and next_n in STOPS[wid]:
                    pt = route_between(route, STOPS[wid][prev_n][:2], STOPS[wid][next_n][:2])
                    extra = {'confidence': 'estimated', 'fix': fix['source']}
            # The pin goes where her map prints the number, so the two agree (unless she corrected it, above).
            # How far the number sits from her route line widens the arrival circle, so walkers on the route still arrive.
            off = float(np.min(np.linalg.norm(route - pt, axis=1))) if route.size else 0.0
            xm, ym = tps_eval(inv, pt / 100.0)
            if fix and fix['on'] == 'canal':
                xm, ym = snap_to_canal(xm, ym); off = 0.0; extra = {'fix': fix['source']}
            lat, lng = to_ll(xm, ym)
            pins[wid][n] = {'lat': round(lat, 6), 'lng': round(lng, 6), 'px': [lx, ly], 'route_offset_m': round(off * mpp), **extra}

# Extra map pages (pages.json): walks whose route runs on past the first map. Same method, pins only.
# A stop already placed from the walk's first map keeps that pin.
PAGES = {k: v for k, v in json.load(open(os.path.join(HERE, 'pages.json'))).items() if not k.startswith('_')} if os.path.exists(os.path.join(HERE, 'pages.json')) else {}
for pid, pg in PAGES.items():
    if pid not in G or pid not in STOPS: continue
    wid, f = pg['walk'], os.path.join(HERE, 'pages', f'map-{pid}.jpg')
    ctl = G[pid]['controls']
    px = np.array([[c['px'], c['py']] for c in ctl], float)
    m = np.array([to_m(c['lat'], c['lng']) for c in ctl])
    lam = np.array([2.0 if c.get('kind') else 0.05 for c in ctl])
    inv = tps_fit(px / 100.0, m, lam=lam)
    route = route_mask(f)
    mpp = 1 / math.sqrt(abs(np.linalg.det(np.array(G[pid]['affine'])[:2])))
    for n, (lx, ly, *flag) in STOPS[pid].items():
        if n in pins.get(wid, {}): continue
        pt = np.array([lx, ly], float)
        off = float(np.min(np.linalg.norm(route - pt, axis=1))) if route.size else 0.0
        lat, lng = to_ll(*tps_eval(inv, pt / 100.0))
        pins.setdefault(wid, {})[n] = {'lat': round(lat, 6), 'lng': round(lng, 6), 'px': [lx, ly], 'map_page': pid,
                                       'route_offset_m': round(off * mpp), **({'confidence': pg['confidence']} if pg.get('confidence') else {})}

json.dump(out_maps, open(os.path.join(ROOT, 'src/data/bookmaps.json'), 'w'))
json.dump(pins, open(os.path.join(ROOT, 'scripts/extract/book_pins.json'), 'w'), indent=1)
print('maps', len(out_maps), 'walks with book pins', {k: len(v) for k, v in pins.items()})
