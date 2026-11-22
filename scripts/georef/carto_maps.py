"""Use the cartographer's own map files for every walk (Jason Nakano, Fruits Media, 2022; shared by
Veneeta 19 Nov 2026 from Google Drive, saved in book/cartographer/). They are full vector maps, one per walk
(Walk X in two), with nearly every stop number printed, so they replace the book page renders and Veneeta's photos.

For each map:
  1. render it to assets/book/<file>,
  2. read every stop number and street label with its position (real text in the PDF),
  3. fit the map to real streets with the same iterative closest point fit as extra_maps.py,
  4. turn the matched street labels into control points for the thin-plate spline build.py uses,
  5. trace the walk path (the dotted line, drawn as vector strokes) between consecutive stops and convert it
     to lat/lng.
Writes georef_carto.json (fit and controls per map), map_stops_carto.json (pixel of each printed number),
routes_carto.json (traced legs in lat/lng) and routes_carto_px.json (the same legs in map pixels, for the book map trail). build.py, routes.py and warp.py use these for the walks listed here.

Run: python3 -I scripts/georef/carto_maps.py
"""
import json, math, os, re, sys
from collections import deque
import numpy as np
import pymupdf
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.spatial import cKDTree
from shapely.geometry import Point
from shapely.ops import nearest_points

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from extra_maps import osm_name, crossing_seed, ransac_seed, georef, fit_affine, inv_affine, to_m, to_ll  # noqa: E402
from intersect import street  # noqa: E402
from shapely.geometry import LineString  # noqa: E402
from shapely.ops import unary_union  # noqa: E402

PIN_PX = json.load(open(os.path.join(HERE, 'pin_overrides.json')))  # pixel pins on a walk's map, author-placed
S = 2.2  # fitting scale (pixels per PDF point): the fit's thresholds are tuned for maps at this scale
MIN_W = 1300  # small maps are rendered larger so they stay sharp; their fit is scaled to match
# walk, source PDF, image file, is this the walk's first map
MAPS = [
    ('I', 'W01.pdf', 'map-I-c.jpg', True),
    ('II', 'W02.pdf', 'map-II-c.jpg', True),
    ('III', 'W03.pdf', 'map-III-c.jpg', True),
    ('IV', 'W04.pdf', 'map-IV-c.jpg', True),
    ('V', 'W05.pdf', 'map-V-c.jpg', True),
    ('VI', 'W06.pdf', 'map-VI-c.jpg', True),
    ('VII', 'W07.pdf', 'map-VII-c.jpg', True),
    ('VIII', 'W08.pdf', 'map-VIII-c.jpg', True),
    ('IX', 'W09.pdf', 'map-IX-c.jpg', True),
    ('X', 'W10-1.pdf', 'map-X-c1.jpg', True),
    ('X', 'W10-2.pdf', 'map-X-c2.jpg', False),
    ('XI', 'W11.pdf', 'map-XI-c.jpg', True),
    ('XII', 'W12.pdf', 'map-XII-c.jpg', True),
]
ROUTE_COLORS = [(0.99, 0.77, 0.6), (0.86, 0.62, 0.78)]  # main walk path (dotted), alternate route (dotted)


def read(pdf, S=S):
    page = pymupdf.open(os.path.join(ROOT, 'book/cartographer', pdf))[0]
    nums = {}
    for x0, y0, x1, y1, w, *_ in page.get_text('words'):
        if re.fullmatch(r'\d{1,2}[A-D]?', w):
            nums.setdefault(w, [round((x0 + x1) / 2 * S), round((y0 + y1) / 2 * S)])
    labels = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            t = ''.join(s['text'] for s in l['spans']).strip()
            n = osm_name(t)
            if n:
                x0, y0, x1, y1 = l['bbox']
                labels.append({'text': t, 'name': n, 'px': [(x0 + x1) / 2 * S, (y0 + y1) / 2 * S], 'dir': l['dir']})
    return page, nums, labels


def route_mask(page, S):
    """Draw only the dotted walk-path strokes, as solid lines, on a blank canvas the size of the render."""
    W, H = round(page.rect.width * S), round(page.rect.height * S)
    im = Image.new('L', (W, H), 0)
    dr = ImageDraw.Draw(im)
    for d in page.get_drawings():
        col = d.get('color')
        if not col or (d.get('width') or 0) > 4:  # the path is a thin stroke, dashed or (on some maps) solid
            continue
        if min(sum(abs(a - b) for a, b in zip(col, c)) for c in ROUTE_COLORS) > 0.06:
            continue
        for it in d['items']:
            if it[0] == 'l':
                pts = [it[1], it[2]]
            elif it[0] == 'c':
                p0, c1, c2, p1 = it[1:5]
                pts = [(p0.x * (1 - t) ** 3 + 3 * c1.x * t * (1 - t) ** 2 + 3 * c2.x * t * t * (1 - t) + p1.x * t ** 3,
                        p0.y * (1 - t) ** 3 + 3 * c1.y * t * (1 - t) ** 2 + 3 * c2.y * t * t * (1 - t) + p1.y * t ** 3) for t in np.linspace(0, 1, 12)]
                pts = [pymupdf.Point(*p) for p in pts]
            else:
                continue
            dr.line([(p.x * S, p.y * S) for p in pts], fill=255, width=3)
    return np.asarray(im) > 0


def bfs(mask, a, b):
    H, W = mask.shape
    prev = np.full(mask.shape, -1, np.int64); seen = np.zeros(mask.shape, bool)
    q = deque([a]); seen[a[1], a[0]] = True
    while q:
        x, y = q.popleft()
        if (x, y) == b:
            break
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; prev[ny, nx] = y * W + x; q.append((nx, ny))
    if not seen[b[1], b[0]]:
        return None
    out = [b]; cur = b[1] * W + b[0]
    while prev[cur // W, cur % W] >= 0:
        cur = prev[cur // W, cur % W]; out.append((cur % W, cur // W))
    return out[::-1]


def tps_fit(src, dst, lam):
    n = len(src); d = np.linalg.norm(src[:, None] - src[None], axis=2)
    K = np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) + np.diag(np.broadcast_to(lam, (n,)).astype(float))
    P = np.hstack([np.ones((n, 1)), src]); L = np.zeros((n + 3, n + 3)); L[:n, :n] = K; L[:n, n:] = P; L[n:, :n] = P.T
    rhs = np.zeros((n + 3, 2)); rhs[:n] = dst; sol = np.linalg.solve(L, rhs)
    return src, sol[:n], sol[n:]


def tps_many(fit, pts):
    c, w, a = fit; d = np.linalg.norm(pts[:, None, :] - c[None], axis=2)
    return a[0] + pts @ a[1:] + np.where(d > 0, d * d * np.log(d + 1e-12), 0.0) @ w


def controls_from_fit(A, labels, used):
    """Each street label kept by the fit, paired with the nearest point of its street under the fit."""
    out = []
    for lab in labels:
        if lab['text'] not in used:
            continue
        try:
            segs = [LineString([to_m(c[1], c[0]) for c in seg]) for seg in street(lab['name']) if len(seg) > 1]
        except Exception:
            continue
        if not segs:
            continue
        m = inv_affine(A, [lab['px']])[0]
        q = nearest_points(unary_union(segs), Point(*m))[0]
        lat, lng = to_ll(q.x, q.y)
        out.append({'px': round(lab['px'][0], 1), 'py': round(lab['px'][1], 1), 'lat': round(lat, 7), 'lng': round(lng, 7),
                    'name': lab['text'], 'kind': 'street-label'})
    return out


def main():
    walks = {w['id']: w for w in json.load(open(os.path.join(ROOT, 'src/data/walks.json')))}
    out_g, out_s, out_r, out_px = {}, {}, {}, {}
    for wid, pdf, fname, first in MAPS:
        page, _, labels = read(pdf)
        SR = max(S, MIN_W / page.rect.width); k = SR / S  # render scale, and its ratio to the fitting scale
        _, nums, _ = read(pdf, SR)
        page.get_pixmap(matrix=pymupdf.Matrix(SR, SR)).save(os.path.join(ROOT, 'assets/book', fname), jpg_quality=85)
        cross = ransac_seed(crossing_seed(labels), tol_px=25 * S / (110 / 72))
        seed = [(p, m) for p, m, _ in cross]
        if len(seed) < 3:
            stops = {str(s['n']): s for s in walks[wid]['stops']}
            seed += [([v / k for v in nums[n]], to_m(stops[n]['lat'], stops[n]['lng'])) for n in nums if n in stops]
        A, rms, mpp, used, missing = georef(labels, seed)
        ctl = controls_from_fit(A, labels, used)
        A = A * k; mpp = mpp / k  # from the fitting scale to the rendered image
        for c in ctl:
            c['px'], c['py'] = round(c['px'] * k, 1), round(c['py'] * k, 1)
        # how far each control sits from the affine fit, to see whether bending is needed at all
        P = np.array([to_m(c['lat'], c['lng']) for c in ctl]); T = np.array([[c['px'], c['py']] for c in ctl])
        aff_px = np.hstack([P, np.ones((len(P), 1))]) @ A
        aff_rms = math.sqrt(float(np.mean(np.sum((aff_px - T) ** 2, 1)))) * mpp
        key = f'{wid}:{fname}'
        out_g[key] = {'walk': wid, 'file': fname, 'source': f'book/cartographer/{pdf}', 'first': first, 'affine': A.tolist(),
                      'origin': [21.28, -157.83], 'rms_m': round(rms, 1), 'affine_rms_m': round(aff_rms, 1), 'm_per_px': round(mpp, 2),
                      'controls': ctl, 'labels_used': used, 'labels_unmatched': missing,
                      'crossings': [c[2] for c in cross]}
        stop_ids = {str(s['n']) for s in walks[wid]['stops']}
        out_s[key] = {n: xy for n, xy in nums.items() if n in stop_ids}
        # trace the dotted path between consecutive stops printed on this map
        raw = route_mask(page, SR)
        rpts = np.argwhere(raw)[:, ::-1].astype(float)
        tree = cKDTree(rpts) if len(rpts) else None
        mask = ndimage.binary_dilation(raw, iterations=6)  # bridges the small gaps where dashes meet at corners
        ys, xs = np.nonzero(mask); pool = np.stack([xs, ys], 1)
        lam = np.full(len(ctl), 2.0)
        inv = tps_fit(T / 100.0, P, lam)
        snap = {}
        for n, v in out_s[key].items():
            ov = PIN_PX.get(wid, {}).get(n) if first and len([m for m in MAPS if m[0] == wid]) == 1 else None
            if isinstance(ov, list) and len(rpts):  # an author-placed pin on her line: start or end the leg exactly there
                j = int(np.argmin(np.linalg.norm(rpts - np.array(ov[:2], float), axis=1)))
                snap[int(n)] = tuple(int(t) for t in rpts[j]); continue
            d = np.linalg.norm(pool - np.array(v), axis=1); i = int(np.argmin(d))
            if d[i] < 40 * SR / 1.5:
                snap[int(n)] = tuple(int(t) for t in pool[i])
        legs = {}
        for s0 in sorted(snap):
            s1 = s0 + 1
            if s1 not in snap:
                continue
            p = bfs(mask, snap[s0], snap[s1])
            if not p or len(p) > 6 * (abs(snap[s0][0] - snap[s1][0]) + abs(snap[s0][1] - snap[s1][1]) + 40):
                continue
            # The search runs through a widened band, so its path wobbles. Pull every point back onto her drawn line,
            # then straighten it: the result sits exactly on her dots, with straight runs along streets.
            on = rpts[tree.query(np.array(p, float))[1]] if tree is not None else np.array(p, float)
            line = LineString(on).simplify(1.5 * SR / S, preserve_topology=False)
            pts = np.array(line.coords, float)
            mm = tps_many(inv, pts / 100.0)
            # the same leg in map pixels, so the book map can fill in exactly her dotted line as stops are reached
            out_px.setdefault(key, {})[str(s0)] = [[round(x, 1), round(y, 1)] for x, y in pts]
            legs[str(s0)] = [[round(21.28 + y / 110574, 6), round(-157.83 + x / (111320 * math.cos(math.radians(21.28))), 6)] for x, y in mm]
        out_r.setdefault(wid, {}).update(legs)
        print(f'{wid} {fname}: {len(out_s[key])} numbers, {len(used)}/{len(labels)} labels, {len(cross)} crossings, '
              f'ICP RMS {rms:.0f} m, affine RMS on controls {aff_rms:.0f} m, {mpp:.2f} m/px, {len(snap)} on path, {len(legs)} legs traced; '
              f'unmatched {missing}')
    json.dump(out_g, open(os.path.join(HERE, 'georef_carto.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(out_s, open(os.path.join(HERE, 'map_stops_carto.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(out_r, open(os.path.join(HERE, 'routes_carto.json'), 'w'), ensure_ascii=False)
    json.dump(out_px, open(os.path.join(HERE, 'routes_carto_px.json'), 'w'))


if __name__ == '__main__':
    main()
