"""Turn Veneeta's phone photo of a book map page into a clean, straight page image (assets/book/<file>).

Steps: rotate upright; undo the camera's tilt and keystone with a homography fitted so the printed map key
comes out as a true rectangle (its size taken from the same key on the PDF's Walk XII page) and the page's
right edge comes out vertical; crop to the printed map; even out lighting; map the photo's colors onto the
book's palette using three anchors shared with the PDF page (beige blocks, white streets, black text);
light denoise; resize to 1200 px wide; mild sharpen. Nothing is drawn or invented: every mark is the photo's.

Usage: python3 -I scripts/georef/photo_clean.py"""
import os, sys
import cv2, numpy as np
from PIL import Image, ImageOps
from scipy.optimize import least_squares
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

PAGES = {
    # rotate: quarter turns clockwise after EXIF; key: photo pixels of the map key's inner box
    # [top-left, top-right, foot-strip right, foot-strip left, title-rule left, title-rule right];
    # edge_x: x range to search for the page's right edge; crop: x0, y0, x1, y1 after warping; ref: PDF page to match colors to
    'map-XII-2.jpg': {'photo': 'IMG_4708.jpg', 'rotate': 1, 'key': [[357, 1866], [927, 1834], [945, 2737], [400, 2799], [362, 1964], [929, 1930]],
                      'edge': 'bright', 'canvas': (2320, 3150), 'crop': (140, 110, 2110, 2830), 'ref': 'map-XII.jpg'},
    'map-XI-2.jpg': {'photo': 'IMG_4706.jpg', 'rotate': 0, 'key': [[372.5, 1913.5], [930, 1886.5], [947, 2791], [400, 2835], [375, 2007], [931, 1979]],
                     'edge': 'margin', 'canvas': (2300, 3000), 'crop': (60, 20, 2130, 2860), 'ref': 'map-XI.jpg'},
}

def page_edge(g, kind):
    """Points along the page's right edge."""
    H, W = g.shape; pts = []
    if kind == 'bright':
        for y in range(150, 2650, 50):
            idx = np.where(g[y, int(W * 0.85):] > 170)[0]
            if len(idx): pts.append([int(W * 0.85) + idx.max(), y])
    else:  # pale page margin against a dark background
        gb = cv2.GaussianBlur(g, (5, 5), 0)
        for y in range(150, H - 150, 100):
            row = gb[y, int(W * 0.88):].astype(int)
            c = [x for x in range(len(row) - 12) if row[x] > 155 and row[x + 10] < row[x] - 50]
            if c: pts.append([int(W * 0.88) + c[-1], y])
    return np.float64(pts)

def clean(out_name):
    cfg = PAGES[out_name]
    im = np.ascontiguousarray(np.array(ImageOps.exif_transpose(Image.open(f'{ROOT}/book/photos/{cfg["photo"]}')).convert('RGB'))[:, :, ::-1])
    for _ in range(cfg['rotate']): im = cv2.rotate(im, cv2.ROTATE_90_CLOCKWISE)
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    src = np.float64(cfg['key'])
    kw, kt, kd, s = 126.1, 21.8, 215.1, 4.5  # key size in points, from the same key on the PDF's Walk XII page (part 3, page index 60)
    dst = np.float64([[0, 0], [kw, 0], [kw, kd], [0, kd], [0, kt], [kw, kt]]) * s + src[0]
    edge = page_edge(g, cfg['edge'])
    def proj(h, p):
        Hm = np.append(h[:8], 1).reshape(3, 3); q = np.c_[p, np.ones(len(p))] @ Hm.T; return q[:, :2] / q[:, 2:]
    H0 = cv2.findHomography(src.astype(np.float32), dst.astype(np.float32), 0)[0]
    x0 = np.r_[(H0 / H0[2, 2]).ravel()[:8], 2150]
    sol = least_squares(lambda x: np.r_[(proj(x[:8], src) - dst).ravel(), (proj(x[:8], edge)[:, 0] - x[8]) * 0.7], x0)
    Hm = np.append(sol.x[:8], 1).reshape(3, 3)
    out = cv2.warpPerspective(im, Hm, cfg['canvas'], flags=cv2.INTER_LANCZOS4, borderValue=(255, 255, 255))
    x0_, y0_, x1_, y1_ = cfg['crop']; crop = out[y0_:y1_, x0_:x1_].copy()
    ref = cv2.imread(f'{ROOT}/assets/book/{cfg["ref"]}')
    lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB).astype(np.float32); L = lab[:, :, 0]
    bg = cv2.GaussianBlur(cv2.dilate(L, np.ones((71, 71), np.uint8)), (0, 0), 200)
    lab[:, :, 0] = np.clip(L * (1 + 0.7 * (bg.mean() / bg - 1)), 0, 255)
    flat = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
    def mode(img):
        v, c = np.unique((img // 8).reshape(-1, 3), axis=0, return_counts=True); return v[c.argmax()] * 8 + 4
    hs, hr = cv2.cvtColor(flat, cv2.COLOR_BGR2HSV), cv2.cvtColor(ref, cv2.COLOR_BGR2HSV)
    anchors_p = [np.median(flat[hs[:, :, 2] < np.percentile(hs[:, :, 2], 0.5)], axis=0), mode(flat),
                 np.median(flat[(hs[:, :, 1] < 30) & (hs[:, :, 2] > np.percentile(hs[:, :, 2], 92))], axis=0)]
    anchors_r = [np.array([30, 30, 30.]), mode(ref), np.median(ref[(hr[:, :, 1] < 20) & (hr[:, :, 2] > 235)], axis=0)]
    img = flat.astype(np.float32)
    for c in range(3):
        a, b = np.polyfit([p[c] for p in anchors_p], [r[c] for r in anchors_r], 1); img[:, :, c] = img[:, :, c] * a + b
    img = cv2.fastNlMeansDenoisingColored(np.clip(img, 0, 255).astype(np.uint8), None, 4, 4, 7, 21)
    w = 1200; h = round(img.shape[0] * w / img.shape[1]); img = cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA)
    img = cv2.addWeighted(img, 1.5, cv2.GaussianBlur(img, (0, 0), 1.2), -0.5, 0)
    cv2.imwrite(f'{ROOT}/assets/book/{out_name}', img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(out_name, img.shape[1], 'x', img.shape[0])

if __name__ == '__main__':
    for name in (sys.argv[1:] or PAGES):
        clean(name)
