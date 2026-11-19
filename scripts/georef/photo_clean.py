"""Turn Veneeta's phone photo of a book map page into a clean, straight page image (assets/book/<file>).

Steps: rotate upright; undo the camera's tilt and keystone with a homography fitted so the printed map key
comes out as a true rectangle (its size taken from the same key on the PDF's Walk XII page) and the page's
right edge comes out vertical; crop to the printed map; even out lighting; map the photo's colors onto the
book's palette using three anchors shared with the PDF page (beige blocks, white streets, black text);
light denoise; resize to 1200 px wide; mild sharpen. Nothing is drawn or invented: every mark is the photo's.

Usage: python3 -I scripts/georef/photo_clean.py"""
import os
import cv2, numpy as np
from PIL import Image, ImageOps
from scipy.optimize import least_squares
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def clean_xii_2():
    im = np.array(ImageOps.exif_transpose(Image.open(f'{ROOT}/book/photos/IMG_4708.jpg')).convert('RGB'))[:, :, ::-1]
    im = cv2.rotate(np.ascontiguousarray(im), cv2.ROTATE_90_CLOCKWISE)
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY); W = g.shape[1]
    # map key corners in the photo (inner box top, title rule, top of the black foot strip), read off a zoomed grid
    src = np.float64([[357, 1866], [927, 1834], [945, 2737], [400, 2799], [362, 1964], [929, 1930]])
    kw, kt, kd, s = 126.1, 21.8, 215.1, 4.5  # key size in points from the PDF (part 3, page index 60)
    dst = np.float64([[0, 0], [kw, 0], [kw, kd], [0, kd], [0, kt], [kw, kt]]) * s + [357, 1866]
    edge = []
    for y in range(150, 2650, 50):
        idx = np.where(g[y, int(W * 0.85):] > 170)[0]
        if len(idx): edge.append([int(W * 0.85) + idx.max(), y])
    edge = np.float64(edge)
    def proj(h, p):
        Hm = np.append(h[:8], 1).reshape(3, 3); q = np.c_[p, np.ones(len(p))] @ Hm.T; return q[:, :2] / q[:, 2:]
    H0 = cv2.findHomography(src.astype(np.float32), dst.astype(np.float32), 0)[0]
    x0 = np.r_[(H0 / H0[2, 2]).ravel()[:8], 2150]
    sol = least_squares(lambda x: np.r_[(proj(x[:8], src) - dst).ravel(), (proj(x[:8], edge)[:, 0] - x[8]) * 0.7], x0)
    Hm = np.append(sol.x[:8], 1).reshape(3, 3)
    out = cv2.warpPerspective(im, Hm, (2320, 3150), flags=cv2.INTER_LANCZOS4, borderValue=(255, 255, 255))
    crop = out[110:2830, 140:2110].copy()
    ref = cv2.imread(f'{ROOT}/assets/book/map-XII.jpg')
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
    cv2.imwrite(f'{ROOT}/assets/book/map-XII-2.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('map-XII-2.jpg', img.shape[1], 'x', img.shape[0])

if __name__ == '__main__':
    clean_xii_2()
