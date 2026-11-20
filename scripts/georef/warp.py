"""Warp each book map onto a north-up lat/lng grid so it can be laid over the street map (alignment check,
and an optional 'book map over streets' layer). Writes preview/warped/<walk>.webp and src/data/bookwarp.json bounds."""
import json, math, os
import numpy as np
from PIL import Image
import importlib.util

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
spec = importlib.util.spec_from_file_location('b', os.path.join(HERE, 'build.py'))
G = json.load(open(os.path.join(HERE, 'georef.json')))
_c = os.path.join(HERE, 'georef_carto.json')
if os.path.exists(_c):  # the cartographer's first map replaces the book page for these walks
    G.update({g['walk']: g for g in json.load(open(_c)).values() if g['first']})
LAT0, LNG0 = 21.28, -157.83
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574

def tps_fit(src, dst, lam):
    n = len(src); d = np.linalg.norm(src[:, None] - src[None], axis=2)
    K = np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) + np.diag(np.broadcast_to(lam, (n,)).astype(float))
    P = np.hstack([np.ones((n, 1)), src]); L = np.zeros((n + 3, n + 3)); L[:n, :n] = K; L[:n, n:] = P; L[n:, :n] = P.T
    rhs = np.zeros((n + 3, 2)); rhs[:n] = dst; sol = np.linalg.solve(L, rhs)
    return src, sol[:n], sol[n:]

def tps_many(fit, pts):
    c, w, a = fit
    d = np.linalg.norm(pts[:, None, :] - c[None], axis=2)
    u = np.where(d > 0, d * d * np.log(d + 1e-12), 0.0)
    return a[0] + pts @ a[1:] + u @ w

out_dir = os.path.join(ROOT, 'preview', 'warped'); os.makedirs(out_dir, exist_ok=True)
bounds = {}
walks = json.load(open(os.path.join(ROOT, 'src/data/walks.json'))); walks = walks if isinstance(walks, list) else walks['walks']
for w in walks:
    wid, f = w['id'], w.get('bookMap')
    if not f or wid not in G: continue
    ctl = G[wid]['controls']
    px = np.array([[c['px'], c['py']] for c in ctl], float)
    m = np.array([[(c['lng'] - LNG0) * KX, (c['lat'] - LAT0) * KY] for c in ctl])
    lam = np.array([2.0 if c.get('kind') else 0.05 for c in ctl])
    fwd = tps_fit(m / 100.0, px, lam); inv = tps_fit(px / 100.0, m, lam)
    src = Image.open(os.path.join(ROOT, 'assets/book', f)).convert('RGB'); W, H = src.size
    edge = np.array([[x, y] for x in np.linspace(0, W, 30) for y in (0, H)] + [[x, y] for y in np.linspace(0, H, 30) for x in (0, W)], float)
    em = tps_many(inv, edge / 100.0)
    x0, x1, y0, y1 = em[:, 0].min(), em[:, 0].max(), em[:, 1].min(), em[:, 1].max()
    res = 1.5  # meters per output pixel
    nx, ny = int((x1 - x0) / res), int((y1 - y0) / res)
    xs = x0 + (np.arange(nx) + 0.5) * res; ys = y1 - (np.arange(ny) + 0.5) * res
    gx, gy = np.meshgrid(xs, ys)
    pts = np.stack([gx.ravel(), gy.ravel()], 1) / 100.0
    out = np.zeros((ny * nx, 4), np.uint8); arr = np.asarray(src)
    for i in range(0, len(pts), 200000):
        p = tps_many(fwd, pts[i:i + 200000]); ix, iy = np.round(p[:, 0]).astype(int), np.round(p[:, 1]).astype(int)
        ok = (ix >= 0) & (ix < W) & (iy >= 0) & (iy < H)
        out[i:i + 200000][ok, :3] = arr[iy[ok], ix[ok]]; out[i:i + 200000][ok, 3] = 255
    Image.fromarray(out.reshape(ny, nx, 4), 'RGBA').save(os.path.join(out_dir, f'{wid}.webp'), quality=70)
    bounds[wid] = [[LAT0 + y0 / KY, LNG0 + x0 / KX], [LAT0 + y1 / KY, LNG0 + x1 / KX]]
    print(wid, nx, ny, os.path.getsize(os.path.join(out_dir, f'{wid}.webp')) // 1024, 'KB')
json.dump(bounds, open(os.path.join(ROOT, 'src/data/bookwarp.json'), 'w'))
