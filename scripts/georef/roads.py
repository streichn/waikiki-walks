"""Check and refine each book map against major roads. Her streets are drawn white; for each major road from
OpenStreetMap we sample points every 8 m, project them onto her map, and measure how many land on a white street.
Refinement: pair each projected point with the nearest white street pixel (when close) and refit, keeping the
intersections firm. Prints the before/after share of road points that fall on her streets."""
import json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from intersect import street
LAT0, LNG0 = 21.28, -157.83
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574
MAJOR = ['Kalākaua Avenue', 'Kūhiō Avenue', 'Ala Wai Boulevard', 'Kapahulu Avenue', 'Date Street', 'McCully Street',
         'Kapiʻolani Boulevard', 'Ala Moana Boulevard', 'Monsarrat Avenue', 'Pākī Avenue', 'Kālia Road', 'Saratoga Road',
         'Lewers Street', 'Seaside Avenue', 'Liliʻuokalani Avenue', 'Kaʻiulani Avenue', 'Royal Hawaiian Avenue',
         'South King Street', 'South Beretania Street', 'Waiʻalae Avenue', 'Harding Avenue', 'University Avenue', 'Diamond Head Road']

# Streets used only for one map (upper Mānoa; Punahou and College Hills), so refits of the other maps are unchanged.
LOCAL = {'X-p6': ['Oʻahu Avenue', 'East Mānoa Road', 'Mānoa Road', 'Woodlawn Drive', 'Lowrey Avenue', 'Kamehameha Avenue',
                  'Kaʻala Street', 'Hunnewell Street', 'Maile Way', 'Kaʻaipu Avenue', 'Ānuenue Street', 'Alaula Way'],
         'X-p3': ['Wilder Avenue', 'Punahou Street', 'Mānoa Road', 'Metcalf Street', 'Dole Street', 'Kamehameha Avenue',
                  'Oʻahu Avenue', 'Nehoa Street', 'Kaʻala Street', 'Alexander Street', 'Lanihuli Drive']}

def tps_fit(src, dst, lam):
    n = len(src); d = np.linalg.norm(src[:, None] - src[None], axis=2)
    K = np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) + np.diag(lam)
    P = np.hstack([np.ones((n, 1)), src]); L = np.zeros((n + 3, n + 3)); L[:n, :n] = K; L[:n, n:] = P; L[n:, :n] = P.T
    rhs = np.zeros((n + 3, 2)); rhs[:n] = dst; sol = np.linalg.solve(L, rhs)
    return src, sol[:n], sol[n:]
def tps_many(fit, pts):
    c, w, a = fit; d = np.linalg.norm(pts[:, None, :] - c[None], axis=2)
    return a[0] + pts @ a[1:] + np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) @ w

def road_points(names):
    out = {}
    for name in names:
        pts = []
        for line in street(name):
            for (x0, y0), (x1, y1) in zip(line[:-1], line[1:]):
                a = np.array([(x0 - LNG0) * KX, (y0 - LAT0) * KY]); b = np.array([(x1 - LNG0) * KX, (y1 - LAT0) * KY])
                k = max(1, int(np.linalg.norm(b - a) / 8))
                pts += [a + (b - a) * t for t in np.linspace(0, 1, k, endpoint=False)]
        if pts: out[name] = np.array(pts)
    return out

def score(fwd, roads, dist, W, H):
    tot = hit = 0; per = {}
    for name, pts in roads.items():
        p = tps_many(fwd, pts / 100)
        ok = (p[:, 0] > 5) & (p[:, 0] < W - 5) & (p[:, 1] > 5) & (p[:, 1] < H - 5)
        if ok.sum() < 15: continue
        ix, iy = p[ok, 0].astype(int), p[ok, 1].astype(int)
        h = (dist[iy, ix] <= 4).mean(); per[name] = round(100 * h); tot += ok.sum(); hit += (dist[iy, ix] <= 4).sum()
    return (100 * hit / tot if tot else 0), per

if __name__ == '__main__':
    G = json.load(open(os.path.join(HERE, 'georef.json')))
    walks = {w['id']: w for w in json.load(open(os.path.join(ROOT, 'src/data/walks.json')))}
    roads_all = road_points(MAJOR); local = road_points(sorted({n for v in LOCAL.values() for n in v}))
    PAGES = {k: v for k, v in json.load(open(os.path.join(HERE, 'pages.json'))).items() if not k.startswith('_')}
    for wid in (sys.argv[1:] or list(G)):
        f = walks.get(wid, {}).get('bookMap')
        path = os.path.join(ROOT, 'assets/book', f) if f else os.path.join(HERE, 'pages', f'map-{wid}.jpg') if wid in PAGES else None
        if not path: continue
        roads = {**roads_all, **{n: p for n, p in local.items() if n in LOCAL.get(wid, [])}}
        a = np.asarray(Image.open(path).convert('RGB')).astype(int)
        white = (a.min(axis=2) > 232)
        dist, (iy_n, ix_n) = ndimage.distance_transform_edt(~white, return_indices=True)
        H, W = white.shape
        base = [c for c in G[wid]['controls'] if c.get('kind') != 'road']
        def fit_from(ctl):
            px = np.array([[c['px'], c['py']] for c in ctl], float)
            m = np.array([[(c['lng'] - LNG0) * KX, (c['lat'] - LAT0) * KY] for c in ctl])
            lam = np.array([0.05 if not c.get('kind') else 2.0 for c in ctl])
            return tps_fit(m / 100, px, lam)
        fwd = fit_from(base); s0, per0 = score(fwd, roads, dist, W, H)
        ctl = list(base)
        for rnd in range(3):
            extra = []
            for name, pts in roads.items():
                p = tps_many(fwd, pts / 100)
                ok = (p[:, 0] > 5) & (p[:, 0] < W - 5) & (p[:, 1] > 5) & (p[:, 1] < H - 5)
                idx = np.nonzero(ok)[0][::6]
                for i in idx:
                    x, y = int(p[i, 0]), int(p[i, 1])
                    if 1 < dist[y, x] <= 14:
                        bx, by = ix_n[y, x], iy_n[y, x]
                        extra.append({'px': float(bx), 'py': float(by), 'lat': LAT0 + pts[i, 1] / KY, 'lng': LNG0 + pts[i, 0] / KX, 'name': name, 'kind': 'road'})
            ctl = base + extra[::max(1, len(extra) // 80)]
            fwd = fit_from(ctl)
        s1, per1 = score(fwd, roads, dist, W, H)
        worst = sorted(per1.items(), key=lambda kv: kv[1])[:3]
        print(f'Walk {wid}: road points on her streets {s0:.0f}% -> {s1:.0f}%   weakest: {worst}')
        if s1 > s0: G[wid]['controls'] = ctl
        G[wid]['road_fit_pct'] = round(max(s0, s1))
    json.dump(G, open(os.path.join(HERE, 'georef.json'), 'w'), indent=1)
