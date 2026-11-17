"""Lift the waterways off each of Veneeta's book maps and lay them on real coordinates, so the street and
satellite maps can show her canal and streams (Veneeta, 16 Nov 2026: "The maps needs the water ways overlays").

Her maps draw "Current Waterways" in one green-teal (the key swatch, about RGB 90,185,145) and fainter streams
and former ponds in a pale tint of it. Each pixel is matched to the nearest colour of her palette; text, roads,
grass, pins and the red route drop out. The ink layer is then warped with the same fit as warp.py and saved as a transparent PNG.

Writes assets/waterways/<walk>.png, src/data/waterways.ts, and src/data/waterways.json ({walk: [[N, E], [S, W]]}, the order
react-native-maps' Overlay expects: top-right corner, then bottom-left).
Usage: python3 -I scripts/georef/waterways.py"""
import json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
G = json.load(open(os.path.join(HERE, 'georef.json')))
LAT0, LNG0 = 21.28, -157.83
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574
# Her map palette. Strength is how much waterway each colour stands for: the "Current Waterways" ink of her
# key (about RGB 90,185,145) is full strength; the pale stream tint is the same ink printed at about 40%.
PALETTE = np.array([[90, 182, 140], [170, 203, 158],                                 # waterway ink, pale stream tint
                    [226, 226, 196], [250, 250, 250], [170, 209, 130], [88, 190, 234],  # paper, street, grass, ocean
                    [0, 0, 0], [250, 200, 0], [120, 184, 104], [205, 10, 45]], float)    # text, highway, dark grass, route
STRENGTH = np.array([1.0, 0.45, 0, 0, 0, 0, 0, 0, 0, 0])
RES = 2.0                                                    # meters per output pixel

def tps_fit(src, dst, lam):
    n = len(src); d = np.linalg.norm(src[:, None] - src[None], axis=2)
    K = np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) + np.diag(np.broadcast_to(lam, (n,)).astype(float))
    P = np.hstack([np.ones((n, 1)), src]); L = np.zeros((n + 3, n + 3)); L[:n, :n] = K; L[:n, n:] = P; L[n:, :n] = P.T
    rhs = np.zeros((n + 3, 2)); rhs[:n] = dst; sol = np.linalg.solve(L, rhs)
    return src, sol[:n], sol[n:]

def tps_many(fit, pts):
    c, w, a = fit
    d = np.linalg.norm(pts[:, None, :] - c[None], axis=2)
    return a[0] + pts @ a[1:] + np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) @ w

def ink_alpha(rgb):
    """Per pixel, how much waterway ink it carries (0..1). Each pixel goes to the nearest colour of her map's
    palette; strong waterway ink counts fully, the faint stream tint counts at its printed strength."""
    px = rgb.reshape(-1, 3).astype(float)
    d = np.linalg.norm(px[:, None, :] - PALETTE[None], axis=2)
    k = d.argmin(1); near = d.min(1) < 24
    alpha = np.where(near, STRENGTH[k], 0.0).reshape(rgb.shape[:2])
    alpha = ndimage.median_filter(alpha, size=3)
    # drop specks (anti-aliased text edges, JPEG noise): keep connected pieces of a useful size
    lab, n = ndimage.label(alpha > 0)
    if n:
        sizes = ndimage.sum(np.ones_like(alpha), lab, index=np.arange(1, n + 1))
        keep = np.zeros(n + 1, bool); keep[1:] = sizes >= 60
        alpha[~keep[lab]] = 0
    return alpha

def key_box(rgb):
    """Her map key is a white panel; blank it so its swatches are not lifted as water."""
    white = (rgb.min(axis=2) > 240)
    lab, n = ndimage.label(white)
    if not n: return None
    sizes = ndimage.sum(white, lab, index=np.arange(1, n + 1))
    i = int(np.argmax(sizes)) + 1
    if sizes[i - 1] < 20000: return None
    ys, xs = np.nonzero(lab == i)
    return xs.min(), ys.min(), xs.max(), ys.max()

if __name__ == '__main__':
    out_dir = os.path.join(ROOT, 'assets', 'waterways'); os.makedirs(out_dir, exist_ok=True)
    walks = json.load(open(os.path.join(ROOT, 'src/data/walks.json')))
    bounds = {}
    for w in walks:
        wid, f = w['id'], w.get('bookMap')
        if not f or wid not in G: continue
        rgb = np.asarray(Image.open(os.path.join(ROOT, 'assets/book', f)).convert('RGB'))
        H, W = rgb.shape[:2]
        alpha = ink_alpha(rgb)
        kb = key_box(rgb)
        if kb:
            x0k, y0k, x1k, y1k = kb; alpha[max(0, y0k - 4):y1k + 5, max(0, x0k - 4):x1k + 5] = 0
        if alpha.sum() < 200: print(wid, 'no waterways found'); continue
        ctl = G[wid]['controls']
        px = np.array([[c['px'], c['py']] for c in ctl], float)
        m = np.array([[(c['lng'] - LNG0) * KX, (c['lat'] - LAT0) * KY] for c in ctl])
        lam = np.array([2.0 if c.get('kind') else 0.05 for c in ctl])
        fwd = tps_fit(m / 100.0, px, lam); inv = tps_fit(px / 100.0, m, lam)
        # only warp the area that carries ink
        ys, xs = np.nonzero(alpha > 0)
        corners = np.array([[x, y] for x in (xs.min(), xs.max()) for y in (ys.min(), ys.max())]
                           + [[x, y] for x in np.linspace(xs.min(), xs.max(), 12) for y in (ys.min(), ys.max())]
                           + [[x, y] for y in np.linspace(ys.min(), ys.max(), 12) for x in (xs.min(), xs.max())], float)
        em = tps_many(inv, corners / 100.0)
        x0, x1, y0, y1 = em[:, 0].min(), em[:, 0].max(), em[:, 1].min(), em[:, 1].max()
        nx, ny = int((x1 - x0) / RES) + 1, int((y1 - y0) / RES) + 1
        gx, gy = np.meshgrid(x0 + (np.arange(nx) + 0.5) * RES, y1 - (np.arange(ny) + 0.5) * RES)
        pts = np.stack([gx.ravel(), gy.ravel()], 1) / 100.0
        a = np.zeros(len(pts))
        for i in range(0, len(pts), 200000):
            p = tps_many(fwd, pts[i:i + 200000])
            # bilinear sample of the ink layer for smooth edges
            fx, fy = p[:, 0], p[:, 1]
            ix, iy = np.floor(fx).astype(int), np.floor(fy).astype(int)
            ok = (ix >= 0) & (ix < W - 1) & (iy >= 0) & (iy < H - 1)
            tx, ty = fx[ok] - ix[ok], fy[ok] - iy[ok]
            j, k = iy[ok], ix[ok]
            v = (alpha[j, k] * (1 - tx) * (1 - ty) + alpha[j, k + 1] * tx * (1 - ty)
                 + alpha[j + 1, k] * (1 - tx) * ty + alpha[j + 1, k + 1] * tx * ty)
            seg = a[i:i + 200000]; seg[ok] = v; a[i:i + 200000] = seg
        out = np.zeros((ny * nx, 4), np.uint8)
        out[:, 0], out[:, 1], out[:, 2] = 40, 150, 160              # a clear water teal that reads on light and dark maps
        out[:, 3] = np.round(np.clip(a, 0, 1) * 200).astype(np.uint8)  # never fully opaque, so streets show through
        Image.fromarray(out.reshape(ny, nx, 4), 'RGBA').save(os.path.join(out_dir, f'{wid}.png'), optimize=True)
        n, s, e, wst = LAT0 + y1 / KY, LAT0 + y0 / KY, LNG0 + x1 / KX, LNG0 + x0 / KX
        bounds[wid] = [[round(n, 6), round(e, 6)], [round(s, 6), round(wst, 6)]]
        print(wid, nx, 'x', ny, os.path.getsize(os.path.join(out_dir, f'{wid}.png')) // 1024, 'KB')
    json.dump(bounds, open(os.path.join(ROOT, 'src/data/waterways.json'), 'w'), indent=1)
    # The app needs a static require() per image, so write the lookup module too (generated; do not hand-edit).
    lines = ["// Generated by scripts/georef/waterways.py. Do not edit by hand.",
             "import type { ImageRequireSource } from 'react-native';",
             "import bounds from './waterways.json';", "",
             "const images: Record<string, ImageRequireSource> = {"]
    lines += [f"  {wid}: require('../../assets/waterways/{wid}.png')," for wid in bounds]
    lines += ["};", "",
              "type LatLng = [number, number];",
              "/** Veneeta's waterways for a walk: a transparent image and its [top-right, bottom-left] corners. */",
              "export function waterwaysFor(walkId: string): { image: ImageRequireSource; bounds: [LatLng, LatLng] } | undefined {",
              "  const b = (bounds as Record<string, number[][]>)[walkId];",
              "  const image = images[walkId];",
              "  return b && image ? { image, bounds: [[b[0][0], b[0][1]], [b[1][0], b[1][1]]] } : undefined;",
              "}", ""]
    open(os.path.join(ROOT, 'src/data/waterways.ts'), 'w').write('\n'.join(lines))
