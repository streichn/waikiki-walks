"""Trace Veneeta's red dotted walk path between consecutive stops on each book map, and convert it to
latitude/longitude with the map's fit. Writes src/data/routes.json: {walk: {"<from n>": [[lat, lng], ...]}}.
Used to draw her path on the street map and by the preview's demo walk. Gaps fall back to a straight line.
Author pin overrides (pin_overrides.json, pixel entries) are traced from the spot she chose, like build.py.
The extra map pages (Walk VIII page 2, Walk X pages 2 and 3, Walk XI) are traced by routes_extra.py."""
import json, math, os
from collections import deque
import numpy as np
from PIL import Image
from scipy import ndimage
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
G = json.load(open(os.path.join(HERE, 'georef.json')))
STOPS = json.load(open(os.path.join(HERE, 'map_stops.json')))
OV = {k: v for k, v in json.load(open(os.path.join(HERE, 'pin_overrides.json'))).items() if not k.startswith('_')}
LAT0, LNG0 = 21.28, -157.83
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574

def tps_fit(src, dst, lam):
    n = len(src); d = np.linalg.norm(src[:, None] - src[None], axis=2)
    K = np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) + np.diag(lam)
    P = np.hstack([np.ones((n, 1)), src]); L = np.zeros((n + 3, n + 3)); L[:n, :n] = K; L[:n, n:] = P; L[n:, :n] = P.T
    rhs = np.zeros((n + 3, 2)); rhs[:n] = dst; sol = np.linalg.solve(L, rhs)
    return src, sol[:n], sol[n:]
def tps_many(fit, pts):
    c, w, a = fit; d = np.linalg.norm(pts[:, None, :] - c[None], axis=2)
    return a[0] + pts @ a[1:] + np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) @ w

def path(mask, a, b):
    """Breadth-first shortest path over mask pixels from a to b (8-neighbour)."""
    H, W = mask.shape
    prev = np.full(mask.shape, -1, np.int64); seen = np.zeros(mask.shape, bool)
    q = deque([a]); seen[a[1], a[0]] = True
    while q:
        x, y = q.popleft()
        if (x, y) == b: break
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; prev[ny, nx] = y * W + x; q.append((nx, ny))
    if not seen[b[1], b[0]]: return None
    out = [b]; cur = b[1] * W + b[0]
    while prev[cur // W, cur % W] >= 0:
        cur = prev[cur // W, cur % W]; out.append((cur % W, cur // W))
    return out[::-1]

def simplify(pts, step=6):
    return pts[::step] + [pts[-1]]

walks = {w['id']: w for w in json.load(open(os.path.join(ROOT, 'src/data/walks.json')))}
out = {}
for wid, labels in STOPS.items():
    w = walks.get(wid); f = w and w.get('bookMap')
    if not f or wid not in G: continue
    a = np.asarray(Image.open(os.path.join(ROOT, 'assets/book', f)).convert('RGB')).astype(int)
    red = (a[..., 0] > 150) & (a[..., 1] < 90) & (a[..., 2] < 120) & (a[..., 0] - a[..., 1] > 100)
    mask = ndimage.binary_dilation(red, iterations=4)  # join the dots of her dotted line
    ys, xs = np.nonzero(mask); pool = np.stack([xs, ys], 1)
    ctl = G[wid]['controls']
    px = np.array([[c['px'], c['py']] for c in ctl], float)
    m = np.array([[(c['lng'] - LNG0) * KX, (c['lat'] - LAT0) * KY] for c in ctl])
    lam = np.array([2.0 if c.get('kind') else 0.05 for c in ctl])
    inv = tps_fit(px / 100.0, m, lam)
    snap = {}
    for n, v in labels.items():
        o = OV.get(wid, {}).get(n)
        v = o if isinstance(o, list) else v  # the author's chosen spot
        d = np.linalg.norm(pool - np.array(v[:2]), axis=1); i = int(np.argmin(d))
        if d[i] < 40: snap[int(n)] = tuple(int(t) for t in pool[i])
    segs = {}; ok = 0
    nums = sorted(snap)
    for s0, s1 in zip(nums[:-1], nums[1:]):
        if s1 != s0 + 1: continue
        p = path(mask, snap[s0], snap[s1])
        if not p or len(p) > 6 * (abs(snap[s0][0] - snap[s1][0]) + abs(snap[s0][1] - snap[s1][1]) + 40): continue
        pts = np.array(simplify(p), float)
        mm = tps_many(inv, pts / 100.0)
        segs[str(s0)] = [[round(LAT0 + y / KY, 6), round(LNG0 + x / KX, 6)] for x, y in mm]
        ok += 1
    out[wid] = segs
    print(wid, f'{ok} of {len(labels) - 1} legs traced')
import sys; sys.path.insert(0, HERE)
import routes_extra  # noqa: E402
for wid, segs in routes_extra.trace_all(path, simplify).items():
    for n, leg in segs.items():
        out.setdefault(wid, {}).setdefault(n, leg)  # a first map's tracing wins where both print the leg
json.dump(out, open(os.path.join(ROOT, 'src/data/routes.json'), 'w'))
