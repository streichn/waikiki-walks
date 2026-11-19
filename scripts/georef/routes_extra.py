"""Trace Veneeta's red walk path on the extra map pages (Walk VIII page 2, Walk X pages 2 and 3, Walk XI).

These pages are vector drawings, so her red dotted path is real line geometry in the PDF, not pixels.
For each page that extra_maps.py could fit to real streets (skip_pins pages are left out):
  1. read every red stroke from the page (dashed or solid; purple side-trip lines are not red),
  2. draw it as a continuous line into a mask at the same 110 dpi as the page image,
  3. snap each printed stop number (or the author's override pixel) to the nearest point of the path,
  4. follow the path from stop n to stop n+1 when both are printed on this page,
  5. convert the path to latitude/longitude with the page's fit.
Legs that cross from one page to another, or that the path does not join, are left out; the app then
draws a straight line between those two pins.

Called by routes.py, which writes src/data/routes.json.
"""
import json, math, os
import numpy as np
import pymupdf
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
LAT0, LNG0 = 21.28, -157.83
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574
DPI = 110
S = DPI / 72.0


def is_red(c):
    """Her walk path red, about (0.81, 0, 0.16) or (0.9, 0, 0.37). Purple side trips (0.68, 0.43, 0.67) are not."""
    return c is not None and c[0] > 0.7 and c[1] < 0.15 and c[2] < 0.45


def bezier(p0, p1, p2, p3, n=12):
    t = np.linspace(0, 1, n)[:, None]
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3


def red_mask(page, size):
    """Draw every red stroke on the page into a boolean mask the size of the page image."""
    im = Image.new('L', size, 0)
    dr = ImageDraw.Draw(im)
    for d in page.get_drawings():
        if not is_red(d.get('color')):
            continue
        for it in d['items']:
            if it[0] == 'l':
                pts = [(it[1].x * S, it[1].y * S), (it[2].x * S, it[2].y * S)]
            elif it[0] == 'c':
                pts = [tuple(p) for p in bezier(*[np.array([q.x * S, q.y * S]) for q in it[1:5]])]
            else:
                continue
            dr.line(pts, fill=255, width=3)
    # close the small gaps where separate strokes meet at a corner
    return ndimage.binary_dilation(np.asarray(im) > 0, iterations=2)


def trace_page(g, labels, overrides, path, simplify):
    """g: one georef_extra.json entry. labels: {n: [px, py]} printed on this page. Returns {"n": [[lat, lng], ...]}."""
    pdf = sorted(f for f in os.listdir(os.path.join(ROOT, 'book')) if f.startswith(f"part{g['part']}"))[0]
    page = pymupdf.open(os.path.join(ROOT, 'book', pdf))[g['page'] - 1]
    size = Image.open(os.path.join(ROOT, 'assets/book', g['file'])).size
    mask = red_mask(page, size)
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return {}, mask, {}
    pool = np.stack([xs, ys], 1)
    A = np.array(g['affine'])
    M, t = A[:2].T, A[2]
    snap = {}
    for n, v in labels.items():
        ov = overrides.get(n)
        p = np.array(ov[:2] if isinstance(ov, list) else v[:2], float)
        d = np.linalg.norm(pool - p, axis=1)
        i = int(np.argmin(d))
        if d[i] < 40:
            snap[n] = tuple(int(q) for q in pool[i])
    segs = {}
    for n in snap:
        if not n.isdigit() or str(int(n) + 1) not in snap:
            continue
        a, b = snap[n], snap[str(int(n) + 1)]
        p = path(mask, a, b)
        if not p or len(p) > 6 * (abs(a[0] - b[0]) + abs(a[1] - b[1]) + 40):
            continue
        pts = np.array(simplify(p), float)
        mm = np.linalg.solve(M, (pts - t).T).T
        segs[n] = [[round(LAT0 + y / KY, 6), round(LNG0 + x / KX, 6)] for x, y in mm]
    return segs, mask, snap


def trace_all(path, simplify, debug_dir=None):
    gx = json.load(open(os.path.join(HERE, 'georef_extra.json')))
    sx = json.load(open(os.path.join(HERE, 'map_stops_extra.json')))
    ov = json.load(open(os.path.join(HERE, 'pin_overrides.json')))
    out = {}
    for key, g in gx.items():
        if g.get('skip_pins'):
            print(f"{key}: fit too loose ({g['rms_m']} m), no route traced")
            continue
        labels = sx.get(key, {})
        segs, mask, snap = trace_page(g, labels, ov.get(g['walk'], {}), path, simplify)
        out.setdefault(g['walk'], {}).update(segs)
        pairs = sum(1 for n in labels if n.isdigit() and str(int(n) + 1) in labels)
        print(f"{key}: {len(segs)} of {pairs} legs on this page traced; {len(snap)}/{len(labels)} numbers on the path")
        if debug_dir:
            im = Image.open(os.path.join(ROOT, 'assets/book', g['file'])).convert('RGB')
            a = np.asarray(im).copy()
            a[mask] = [0, 200, 255]
            im = Image.fromarray(a)
            dr = ImageDraw.Draw(im)
            for n, (x, y) in snap.items():
                dr.ellipse([x - 5, y - 5, x + 5, y + 5], outline=(0, 0, 0), width=2)
                dr.text((x + 6, y - 6), n, fill=(0, 0, 0))
            im.save(os.path.join(debug_dir, g['file'].replace('.jpg', '-route.png')))
    return out
