"""Turn the fitted control points into transforms the app uses, and place stops from the book maps.

1. For each book map, fit lat/lng -> pixel (for drawing pins and the walker's dot on Veneeta's map)
   and pixel -> lat/lng (for placing a stop where her map prints its number). Each is an affine fit
   plus a smoothed thin-plate spline through the street intersections in georef.json.
2. For stops listed in map_stops.json (the pixel where her map prints each number), snap the point
   to her red route line and convert it to lat/lng. Writes scripts/extract/book_pins.json.
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
    im = np.asarray(Image.open(os.path.join(ROOT, 'assets/book', file)).convert('RGB')).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    m = (r > 150) & (g < 80) & (b < 110) & (r - g > 110)  # the red dotted walk path
    ys, xs = np.nonzero(m)
    return np.stack([xs, ys], 1)

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
            # The pin goes exactly where her map prints the number, so the two always agree.
            # How far the number sits from her route line widens the arrival circle, so walkers on the route still arrive.
            off = float(np.min(np.linalg.norm(route - pt, axis=1))) if route.size else 0.0
            xm, ym = tps_eval(inv, pt / 100.0)
            lat, lng = to_ll(xm, ym)
            pins[wid][n] = {'lat': round(lat, 6), 'lng': round(lng, 6), 'px': [lx, ly], 'route_offset_m': round(off * mpp)}

json.dump(out_maps, open(os.path.join(ROOT, 'src/data/bookmaps.json'), 'w'))
json.dump(pins, open(os.path.join(ROOT, 'scripts/extract/book_pins.json'), 'w'), indent=1)
print('maps', len(out_maps), 'walks with book pins', {k: len(v) for k, v in pins.items()})
