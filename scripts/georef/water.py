"""Refine a book map's fit by matching water: the ocean shoreline and the Ala Wai Canal banks on her map
against OpenStreetMap water (the bundled z16 tiles). Iterative closest point: each round pairs her water
edge with the nearest real water edge and refits, keeping the street intersections fixed.
Adds the matched shoreline points to georef.json as extra controls (kind 'water')."""
import glob, json, math, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
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

def edges(mask):
    e = mask & ~(np.roll(mask, 1, 0) & np.roll(mask, -1, 0) & np.roll(mask, 1, 1) & np.roll(mask, -1, 1))
    e[0, :] = e[-1, :] = e[:, 0] = e[:, -1] = False
    ys, xs = np.nonzero(e); return np.stack([xs, ys], 1).astype(float)

def osm_water_edges():
    pts = []
    for f in glob.glob(os.path.join(ROOT, 'preview/tiles/osm/16/*/*.png')):
        x, y = int(f.split('/')[-2]), int(f.split('/')[-1][:-4])
        a = np.asarray(Image.open(f).convert('RGB')).astype(int)
        m = (abs(a[..., 0] - 170) < 12) & (abs(a[..., 1] - 211) < 12) & (abs(a[..., 2] - 223) < 12)
        for px, py in edges(m):
            n = 2 ** 16; lng = (x + px / 256) / n * 360 - 180
            lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + py / 256) / n))))
            pts.append(((lng - LNG0) * KX, (lat - LAT0) * KY))
    return np.array(pts)

def book_water_edges(file):
    a = np.asarray(Image.open(os.path.join(ROOT, 'assets/book', file)).convert('RGB')).astype(int)
    ocean = (abs(a[..., 0] - 88) < 30) & (abs(a[..., 1] - 191) < 30) & (abs(a[..., 2] - 232) < 30)
    canal = (a[..., 0] < 130) & (a[..., 1] > 140) & (a[..., 2] > 100) & (a[..., 2] < 190) & (a[..., 1] - a[..., 0] > 60)
    e = edges(ocean | canal)
    return e[::max(1, len(e) // 400)]

if __name__ == '__main__':
    G = json.load(open(os.path.join(HERE, 'georef.json')))
    osm = osm_water_edges()
    from scipy.spatial import cKDTree
    tree = cKDTree(osm)
    walks = {w['id']: w for w in json.load(open(os.path.join(ROOT, 'src/data/walks.json')))}
    for wid in (sys.argv[1:] or [k for k in G]):
        if wid not in walks or not walks[wid].get('bookMap'): continue
        ctl = [c for c in G[wid]['controls'] if c.get('kind') != 'water']
        spx = np.array([[c['px'], c['py']] for c in ctl], float)
        sm = np.array([[(c['lng'] - LNG0) * KX, (c['lat'] - LAT0) * KY] for c in ctl])
        bw = book_water_edges(walks[wid]['bookMap'])
        if len(bw) < 20: print(wid, 'little water on map'); continue
        inv = tps_fit(spx / 100, sm, np.full(len(spx), 0.05))
        before = None
        for rnd in range(5):
            m = tps_many(inv, bw / 100)
            d, j = tree.query(m)
            if before is None: before = np.median(d)
            ok = d < 60
            sel = np.nonzero(ok)[0][::max(1, ok.sum() // 60)]
            src = np.vstack([spx, bw[sel]]); dst = np.vstack([sm, osm[j[sel]]])
            lam = np.concatenate([np.full(len(spx), 0.05), np.full(len(sel), 2.0)])  # streets firm, shoreline soft
            inv = tps_fit(src / 100, dst, lam)
        d_after, j = tree.query(tps_many(inv, bw / 100))
        print(f'{wid}: water edge median gap {before:.0f} m -> {np.median(d_after):.0f} m ({len(sel)} shoreline points)')
        if np.median(d_after) < before:
            lat = LAT0 + osm[j[sel]][:, 1] / KY; lng = LNG0 + osm[j[sel]][:, 0] / KX
            G[wid]['controls'] = ctl + [{'px': float(p[0]), 'py': float(p[1]), 'lat': float(a), 'lng': float(b), 'name': 'water edge', 'kind': 'water'} for p, a, b in zip(bw[sel], lat, lng)]
    json.dump(G, open(os.path.join(HERE, 'georef.json'), 'w'), indent=1)
