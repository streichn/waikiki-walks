"""Georeference map pages that exist only as Veneeta's iPhone photos (missing from the book PDFs).

The photo is straightened and color-matched by scripts/georef/photo_clean.py into assets/book/<file>.
Here, control points are street crossings read off the cleaned image, matched to OpenStreetMap crossings
(intersect.crossing). A similarity fit (scale, rotation, shift) is used: the page is a flat print, and the
other half of the same foldout (from the PDF) gives the same scale and rotation within a few percent.
Writes georef_photo.json and map_stops_photo.json, which build.py reads like the extra PDF pages."""
import json, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import intersect

LAT0, LNG0 = 21.28, -157.83
KX, KY = 103729.97635592039, 110574

PAGES = {
    'XII:map-XII-2.jpg': {
        'walk': 'XII', 'file': 'map-XII-2.jpg', 'source': 'Veneeta photo IMG_4708, 19 Nov 2026 (foldout page 2 of Walk XII)',
        # pixel on the cleaned 1200x1657 image, and the two streets that cross there
        'controls': [
            [497, 375, 'Dole Street', 'East-West Road'],          # where her route turns at stop 20
            [853, 1418, 'Date Street', 'Kapiʻolani Boulevard'],   # the big junction below the key
            [1182, 262, 'Dole Street', 'Saint Louis Drive'],      # at stop 16
        ],
        # centers of her printed stop numbers on the cleaned image
        'labels': {'16': [1154, 260], '17': [1068, 238], '18': [705, 188], '19': [600, 186], '20': [512, 384],
                   '21': [606, 340], '22': [720, 575], '23': [592, 603], '24': [505, 740], '25': [637, 700],
                   '26': [410, 715], '27': [300, 700], '28': [237, 792]},
    },
}

def to_m(lat, lng): return np.array([(lng - LNG0) * KX, (lat - LAT0) * KY])

def main():
    G, S = {}, {}
    for key, p in PAGES.items():
        P, M = [], []
        for x, y, a, b in p['controls']:
            c = intersect.crossing(a, b, near=(21.293, -157.815))
            P.append([x, y]); M.append(to_m(c[0], c[1]))
        P, M = np.array(P, float), np.array(M, float)
        # similarity px -> meters, with y flipped (image y runs down, north runs up)
        zp = P[:, 0] - 1j * P[:, 1]; zm = M[:, 0] + 1j * M[:, 1]
        A = np.c_[zp, np.ones(len(zp))]
        (a, b), *_ = np.linalg.lstsq(A, zm, rcond=None)
        res = np.abs(a * zp + b - zm); rms = float(np.sqrt(np.mean(res ** 2)))
        # convert to the build's affine form: [x_m, y_m, 1] @ Aff = [px, py]
        inv_a = 1 / a
        Lm = np.array([[inv_a.real, -inv_a.imag], [-inv_a.imag, -inv_a.real]])  # rows: d(px,py)/dx_m, d(px,py)/dy_m
        t0 = -b * inv_a; t = np.array([t0.real, -t0.imag])
        aff = np.vstack([Lm, t])
        # check: controls map back to their pixels
        back = np.c_[M, np.ones(len(M))] @ aff
        print(key, 'm/px', round(abs(a), 3), 'rotation', round(float(np.degrees(np.angle(a))), 1), 'rms m', round(rms, 1), 'px err', np.round(back - P, 1).tolist())
        G[key] = {'walk': p['walk'], 'file': p['file'], 'affine': aff.tolist(), 'rms_m': round(rms, 1), 'm_per_px': round(abs(a), 3), 'source': p['source']}
        S[key] = p['labels']
    json.dump(G, open(os.path.join(HERE, 'georef_photo.json'), 'w'), indent=1, ensure_ascii=False)
    json.dump(S, open(os.path.join(HERE, 'map_stops_photo.json'), 'w'), indent=1)

if __name__ == '__main__':
    main()
