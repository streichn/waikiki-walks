"""Bring in the walk-map pages beyond each walk's first map (Walk VIII page 2, Walk X pages 2 to 4,
Walk XI) so every stop number Veneeta printed gets its pin from her own map.

These pages are vector drawings, so her stop numbers and street names are real text with positions.
For each page we:
  1. render the page to assets/book/<file> at the same 110 dpi as the first maps,
  2. read every stop number and street label with its position,
  3. fit the page to real streets: start from an affine fit, then repeatedly slide each street
     label onto the nearest point of that street in OpenStreetMap and refit (iterative closest point),
     dropping labels that disagree,
  4. write the fit to georef_extra.json and each printed number's pixel to map_stops_extra.json.
build.py turns those into pins exactly where the numbers are printed, like the first maps.

Run: python3 -I scripts/georef/extra_maps.py
"""
import json, math, os, re, sys
import numpy as np
import pymupdf
from shapely.geometry import LineString, Point
from shapely.ops import unary_union, nearest_points

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from intersect import street, crossing  # noqa: E402

LAT0, LNG0 = 21.28, -157.83
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574  # same as fit.py and build.py
DPI = 110
S = DPI / 72.0

# walk, part, page, image file, which stop numbers this page is the source for
PAGES = [
    ('VIII', 2, 50, 'map-VIII-2.jpg'),
    ('X', 3, 3, 'map-X-2.jpg'),
    ('X', 3, 6, 'map-X-3.jpg'),
    ('X', 3, 5, 'map-X-4.jpg'),
    ('XI', 3, 37, 'map-XI.jpg'),
]
# Known places printed on a page, for pages with too few labeled street crossings to start the fit.
# (pixel on the page, lat, lng, what it is). Coordinates from OpenStreetMap (Nominatim).
LANDMARKS = {
    'map-X-4.jpg': [((440, 478), 21.3187338, -157.8021850, 'Mānoa Chinese Cemetery (gray lot)'),
                    ((706, 430), 21.3130451, -157.8055873, 'Kahaloa Drive at East Mānoa Road'),
                    ((497, 530), 21.3184519, -157.8040098, 'Pakanu Street at Pāwaina Street'),
                    ((305, 652), 21.3187517, -157.8071211, 'Pāwaina Street at Mānoa Road')],
}
SUFFIX = {'St.': 'Street', 'St': 'Street', 'Ave.': 'Avenue', 'Ave': 'Avenue', 'Rd.': 'Road', 'Rd': 'Road', 'Blvd.': 'Boulevard',
          'Dr.': 'Drive', 'Dr': 'Drive', 'Pl.': 'Place', 'Ln.': 'Lane', 'Way': 'Way', 'Hwy': 'Highway'}


def to_m(lat, lng): return ((lng - LNG0) * KX, (lat - LAT0) * KY)
def to_ll(x, y): return (LAT0 + y / KY, LNG0 + x / KX)


def osm_name(label):
    t = re.sub(r'\s+', ' ', label.replace('‘', 'ʻ').replace('’', 'ʻ')).strip()
    t = re.sub(r'^S\. ', 'South ', t)
    t = re.sub(r'^E\.? ', 'East ', t)
    words = t.split(' ')
    if words[-1] in SUFFIX:
        words[-1] = SUFFIX[words[-1]]
        return ' '.join(words)
    return None


def read_page(part, pg):
    pdf = sorted(f for f in os.listdir(os.path.join(ROOT, 'book')) if f.startswith(f'part{part}'))[0]
    page = pymupdf.open(os.path.join(ROOT, 'book', pdf))[pg - 1]
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


def fit_affine(P, T):
    """P: meters (n,2), T: pixels (n,2) -> A (3,2) with [x, y, 1] @ A = px."""
    X = np.hstack([P, np.ones((len(P), 1))])
    A, *_ = np.linalg.lstsq(X, T, rcond=None)
    return A


def inv_affine(A, px):
    M = A[:2].T  # px = M @ m + t
    t = A[2]
    return np.linalg.solve(M, (np.asarray(px) - t).T).T


def crossing_seed(labels):
    """Where two labeled streets meet on her map, and where they meet in OpenStreetMap.
    Each street label lies along its street, so a line through the label in its reading direction
    approximates the street; two such lines with different directions cross at the intersection."""
    pairs = []
    for i in range(len(labels)):
        for j in range(i + 1, len(labels)):
            a, b = labels[i], labels[j]
            if a['name'] == b['name']:
                continue
            da, db = np.array(a['dir'], float), np.array(b['dir'], float)
            if abs(float(np.dot(da, db))) > 0.75:
                continue  # nearly parallel
            pa, pb = np.array(a['px']), np.array(b['px'])
            M = np.array([da, -db]).T
            try:
                t = np.linalg.solve(M, pb - pa)
            except np.linalg.LinAlgError:
                continue
            x = pa + t[0] * da
            if np.linalg.norm(x - pa) > 160 or np.linalg.norm(x - pb) > 160:
                continue  # labels too far from where their lines meet
            c = crossing(a['name'], b['name'])
            if not c or c[2] > 20:
                continue
            pairs.append((x.tolist(), to_m(c[0], c[1]), f"{a['text']} x {b['text']}"))
    return pairs


def ransac_seed(pairs, iters=4000, tol_px=25):
    rng = np.random.default_rng(1)
    best = []
    if len(pairs) < 3:
        return pairs
    P = np.array([m for _, m, _ in pairs]); T = np.array([p for p, _, _ in pairs])
    for _ in range(iters):
        idx = rng.choice(len(pairs), 3, replace=False)
        try:
            A = fit_affine(P[idx], T[idx])
        except Exception:
            continue
        sc = math.sqrt(abs(np.linalg.det(A[:2])))
        if not (0.15 < sc < 1.5):  # px per meter: maps run about 0.3 to 0.6
            continue
        pred = np.hstack([P, np.ones((len(P), 1))]) @ A
        inl = [k for k in range(len(P)) if np.linalg.norm(pred[k] - T[k]) < tol_px]
        if len(inl) > len(best):
            best = inl
    return [pairs[k] for k in best]


def georef(labels, seed):
    """seed: [(px, meters)] rough correspondences to start from."""
    geoms = {}
    for lab in labels:
        if lab['name'] not in geoms:
            try:
                segs = [LineString([to_m(c[1], c[0]) for c in seg]) for seg in street(lab['name']) if len(seg) > 1]
            except Exception as e:
                print('   street lookup failed', lab['name'], e)
                segs = []
            geoms[lab['name']] = unary_union(segs) if segs else None
    labs = [l for l in labels if geoms.get(l['name']) is not None]
    A = fit_affine(np.array([m for _, m in seed]), np.array([p for p, _ in seed]))
    keep = list(range(len(labs)))
    for it in range(12):
        Pm, Tp = [], []
        res = []
        for i in keep:
            lab = labs[i]
            m = inv_affine(A, [lab['px']])[0]
            q = nearest_points(geoms[lab['name']], Point(*m))[0]
            Pm.append([q.x, q.y]); Tp.append(lab['px'])
            res.append(math.hypot(q.x - m[0], q.y - m[1]))
        # keep the seed in early rounds so the fit can't drift, then let the streets decide
        w = max(0, 3 - it)
        P = np.array(Pm + [m for _, m in seed] * w) if w else np.array(Pm)
        T = np.array(Tp + [p for p, _ in seed] * w) if w else np.array(Tp)
        A = fit_affine(P, T)
        if it >= 3:
            worst = int(np.argmax(res))
            if res[worst] > 60 and len(keep) > 8:
                keep.pop(worst)
    scale = math.sqrt(abs(np.linalg.det(A[:2])))
    rms = math.sqrt(sum(r * r for r in res) / len(res))
    used = [labs[i]['text'] for i in keep]
    return A, rms, 1 / scale, used, [l['text'] for l in labels if geoms.get(l['name']) is None]


def main():
    walks = {w['id']: w for w in json.load(open(os.path.join(ROOT, 'src/data/walks.json')))}
    main_stops = json.load(open(os.path.join(HERE, 'map_stops.json')))
    out_g = {}
    out_s = {}
    for wid, part, pg, fname in PAGES:
        page, nums, labels = read_page(part, pg)
        page.get_pixmap(dpi=DPI).save(os.path.join(ROOT, 'assets/book', fname), jpg_quality=80)
        stops = {str(s['n']): s for s in walks[wid]['stops']}
        # seed with stops whose location we already trust a little (geocoded addresses or book pins)
        cross = ransac_seed(crossing_seed(labels)) + [(list(px), to_m(la, ln), note) for px, la, ln, note in LANDMARKS.get(fname, [])]
        if len(cross) >= 3:
            seed = [(p, m) for p, m, _ in cross]
        else:
            seed = [(p, m) for p, m, _ in cross] + [(nums[n], to_m(stops[n]['lat'], stops[n]['lng'])) for n in nums if n in stops]
        print(f'   {fname}: {len(cross)} street crossings agree: {[c[2] for c in cross]}')
        if fname in LANDMARKS:
            # Few labeled crossings on this page: trust the hand-checked landmarks alone.
            lm = [(list(px), to_m(la, ln)) for px, la, ln, _ in LANDMARKS[fname]]
            A = fit_affine(np.array([m for _, m in lm]), np.array([p for p, _ in lm]))
            mpp = 1 / math.sqrt(abs(np.linalg.det(A[:2])))
            pred = np.hstack([np.array([m for _, m in lm]), np.ones((len(lm), 1))]) @ A
            rms = math.sqrt(float(np.mean(np.sum((pred - np.array([p for p, _ in lm])) ** 2, 1)))) * mpp
            used, missing = [n for *_, n in LANDMARKS[fname]], []
        else:
            A, rms, mpp, used, missing = georef(labels, seed)
        key = f'{wid}:{fname}'
        out_g[key] = {'walk': wid, 'file': fname, 'part': part, 'page': pg, 'affine': A.tolist(), 'rms_m': round(rms, 1),
                      **({'skip_pins': True} if rms > 40 else {}),  # too loose to place pins; see pin_overrides.json
                      'm_per_px': round(mpp, 2), 'labels_used': used, 'labels_unmatched': missing}
        # A stop number belongs to this page unless the walk's first map already prints it.
        out_s[key] = {n: xy for n, xy in nums.items() if n in stops and n not in main_stops.get(wid, {})}
        print(f'{wid} p{pg} {fname}: {len(nums)} numbers, {len(out_s[key])} new pins, {len(used)}/{len(labels)} street labels used, '
              f'RMS {rms:.0f} m, {mpp:.2f} m/px, seed {len(seed)}; unmatched {missing}')
    json.dump(out_g, open(os.path.join(HERE, 'georef_extra.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(out_s, open(os.path.join(HERE, 'map_stops_extra.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
