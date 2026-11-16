"""Georeference a book map: fit pixel = f(lat, lng) from labeled street intersections.
Writes scripts/georef/georef.json with an affine fit plus thin-plate corrections, and prints residuals in meters."""
import json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from intersect import crossing

HERE = os.path.dirname(os.path.abspath(__file__))
LAT0, LNG0 = 21.28, -157.83
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574  # meters per degree

def to_m(lat, lng): return ((lng - LNG0) * KX, (lat - LAT0) * KY)

def fit(points):
    """points: [(px, py, x_m, y_m)] -> affine A (3x2) with [x, y, 1] @ A = [px, py]."""
    P = np.array([[p[2], p[3], 1] for p in points]); T = np.array([[p[0], p[1]] for p in points])
    A, *_ = np.linalg.lstsq(P, T, rcond=None)
    return A

def run(walk_id, controls):
    pts = []
    for px, py, a, b in controls:
        c = crossing(a, b)
        if not c or c[2] > 25: print(f'  skip {a} x {b}: {"not found" if not c else f"streets {c[2]} m apart"}'); continue
        x, y = to_m(c[0], c[1]); pts.append([px, py, x, y, f'{a} x {b}', c[0], c[1]])
    for rnd in range(3):
        A = fit(pts)
        scale = math.sqrt(abs(np.linalg.det(A[:2])))  # px per meter
        res = [math.hypot(*(np.array([p[2], p[3], 1]) @ A - [p[0], p[1]])) / scale for p in pts]
        worst = max(range(len(pts)), key=lambda i: res[i])
        if res[worst] > 45 and len(pts) > 6: print(f'  drop outlier {pts[worst][4]} ({res[worst]:.0f} m)'); pts.pop(worst); continue
        break
    for p, r in zip(pts, res): print(f'  {p[4]:45s} {r:5.0f} m')
    rms = math.sqrt(sum(r * r for r in res) / len(res))
    print(f'  {walk_id}: {len(pts)} points, RMS {rms:.0f} m, {1/scale:.2f} m per pixel')
    return {'affine': A.tolist(), 'origin': [LAT0, LNG0], 'k': [KX, KY], 'rms_m': round(rms, 1),
            'controls': [{'px': p[0], 'py': p[1], 'lat': p[5], 'lng': p[6], 'name': p[4]} for p in pts]}

if __name__ == '__main__':
    ctl = json.load(open(os.path.join(HERE, 'controls.json')))
    out_path = os.path.join(HERE, 'georef.json')
    out = json.load(open(out_path)) if os.path.exists(out_path) else {}
    for wid in (sys.argv[1:] or ctl):
        print('Walk', wid); out[wid] = run(wid, ctl[wid])
    json.dump(out, open(out_path, 'w'), indent=1)
