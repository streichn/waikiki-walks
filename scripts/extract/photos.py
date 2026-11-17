"""Where each book photo sits on its page, and which caption the book prints next to it.

parse.py names photos in the order the PDF draws them (p1-23-12.jpg) and files each one under the stop
that was current at that point in the PDF's reading order. On many pages the PDF draws the photos before
the text, so a photo printed beside stop 5 can land under stop 4, and build_data then paired captions
with photos by order inside a stop, which mismatches too.

This script repeats parse.py's photo walk (same filters, same names) to recover each photo's box on the
page, reads the caption lines (small Arial type, as in captions.py) with their boxes, and pairs each photo
with the caption printed closest to it. It also records where each stop heading sits on the page, so a
photo can be placed with the stop it is printed beside.

Writes scripts/extract/photos.json:
  {"photos": {file: {"page", "bbox", "caption" or "dup_of" or "page_slice"}}, "headings": {page: [[n, title, y], ...]}}
Run: python3 -I scripts/extract/photos.py
"""
import json, re, os
import pymupdf as fitz
from PIL import Image, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FILES = [f'{ROOT}/book/part1_walks_I-IV.pdf', f'{ROOT}/book/part2_walks_V-IX.pdf', f'{ROOT}/book/part3_walks_X-XII.pdf']


def caption_blocks(page):
    """Caption lines (Arial 6.5 to 8.5 pt), grouped into blocks the way captions.py groups them, with boxes."""
    lines = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            s = l['spans'][0]
            if s['font'].startswith('Arial') and 6.5 <= s['size'] <= 8.5:
                t = ''.join(x['text'] for x in l['spans']).replace('\x07', '').strip()
                if t:
                    lines.append((l['bbox'], t))
    lines.sort(key=lambda x: (round(x[0][0]) // 40, x[0][1]))
    out, cur, last = [], [], None
    for bb, t in lines:
        if cur and (round(bb[0]) // 40 != round(last[0]) // 40 or bb[1] - last[1] > 14):
            out.append(cur)
            cur = []
        cur.append((bb, t))
        last = bb
    if cur:
        out.append(cur)
    res = []
    for grp in out:
        text = re.sub(r'\s+', ' ', ' '.join(t for _, t in grp)).strip()
        if len(text) < 12:
            continue
        x0 = min(b[0] for b, _ in grp); y0 = min(b[1] for b, _ in grp)
        x1 = max(b[2] for b, _ in grp); y1 = max(b[3] for b, _ in grp)
        res.append({'text': text, 'bbox': [x0, y0, x1, y1]})
    return res


def gap(a, b):
    """Distance between two boxes (0 when they touch or overlap)."""
    dx = max(0, b[0] - a[2], a[0] - b[2])
    dy = max(0, b[1] - a[3], a[1] - b[3])
    return (dx * dx + dy * dy) ** 0.5


def area(a):
    return (a[2] - a[0]) * (a[3] - a[1])


def inside(a, b, tol=3):
    """Box a lies within box b."""
    return a[0] >= b[0] - tol and a[1] >= b[1] - tol and a[2] <= b[2] + tol and a[3] <= b[3] + tol


def overlap_x(a, b):
    return max(0, min(a[2], b[2]) - max(a[0], b[0])) / max(1, min(a[2] - a[0], b[2] - b[0]))


# Checked by eye: a real photo whose box runs under the body text beside it (Walk II, the Hobron Lane and
# Līpe‘epe‘e Street signs). Every other box with body text on it is a page slice or a boxed quote whose words
# are already in the stop's text.
REAL_PHOTOS = {'p1-45-90.jpg'}

photos, headings = {}, {}
imgcount = 0
for fi, f in enumerate(FILES):
    d = fitz.open(f)
    for pno, pg in enumerate(d):
        page_ref = f'p{fi + 1}-{pno + 1}'
        dct = pg.get_text('dict')
        here = []
        for b in dct['blocks']:
            if b['type'] == 1:
                bw = b['bbox'][2] - b['bbox'][0]
                if bw < 80:
                    continue
                imgcount += 1
                name = f'{page_ref}-{imgcount}.jpg'
                clip = fitz.Rect(b['bbox']) & pg.rect
                if clip.width < 80 or clip.height < 60:
                    imgcount -= 1
                    continue
                pix = pg.get_pixmap(clip=clip, dpi=150)
                im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples) if pix.n == 3 else \
                    Image.frombytes('RGBA', (pix.width, pix.height), pix.samples).convert('RGB')
                if ImageStat.Stat(im.convert('L')).stddev[0] < 18:
                    imgcount -= 1
                    continue
                if clip.width > pg.rect.width * 0.95 and clip.height > pg.rect.height * 0.9:
                    imgcount -= 1
                    continue
                here.append((name, [round(v, 1) for v in clip]))
                continue
            for l in b.get('lines', []):
                txt = ''.join(s['text'] for s in l['spans'])
                s = max(l['spans'], key=lambda s: len(s['text'].strip()))
                if 'Bold' in s['font'] and not s['font'].startswith('Helvetica') and 'Italic' not in s['font'] \
                        and 10.5 <= round(s['size'], 1) <= 13 and re.match(r'^\s*\d{1,2}\s+\S', txt):
                    m = re.match(r'^\s*(\d{1,2})\s+(.*)$', txt)
                    headings.setdefault(page_ref, []).append([int(m.group(1)), m.group(2).strip(), round(l['bbox'][1], 1), round(l['bbox'][0], 1)])
        # Some boxes are a faint background graphic behind the bottom of the page. Cut out, they show the body
        # text printed over them, not a photo. Real photos never have body text on them (only a caption).
        body = [(sp['bbox'], len(sp['text'].strip())) for b in dct['blocks'] if b['type'] == 0 for l in b['lines'] for sp in l['spans']
                if not sp['font'].startswith('Arial') and sp['text'].strip()]
        slices = set()
        for name, bb in here:
            on = sum(n for sb, n in body if bb[0] <= (sb[0] + sb[2]) / 2 <= bb[2] and bb[1] <= (sb[1] + sb[3]) / 2 <= bb[3])
            if on >= 40 and name not in REAL_PHOTOS:
                slices.add(name)
        sliced = [(n, b) for n, b in here if n in slices]
        here = [(n, b) for n, b in here if n not in slices]
        # The book draws some photos twice in the same spot: once with its white frame and drop shadow (or a
        # slice of the page around it), and once as the plain photo inside. Keep the inner photo only.
        dup_of = {}
        for i, (name, bb) in enumerate(here):
            for j, (other, ob) in enumerate(here):
                if i != j and other not in dup_of and inside(ob, bb) and area(ob) < area(bb) * 0.98:
                    dup_of[name] = other
                    break
        keep = [(n, b) for n, b in here if n not in dup_of]
        # Pair photos and captions: closest first, each used once. A caption must share some of the photo's
        # width or height. The book prints captions under or beside a photo, so one above it counts as
        # farther away. A second, looser pass catches captions set a little apart from their photo.
        caps = caption_blocks(pg)
        cap_of, used_j = {}, set()
        for limit in (40, 60):
            pairs = []
            for i, (name, bb) in enumerate(keep):
                if i in cap_of:
                    continue
                for j, c in enumerate(caps):
                    if j in used_j:
                        continue
                    g = gap(bb, c['bbox'])
                    if c['bbox'][3] <= bb[1] + 2:
                        g += 25
                    side = overlap_x(bb, c['bbox']) > 0.2 or (min(bb[3], c['bbox'][3]) - max(bb[1], c['bbox'][1])) > 0
                    if g <= limit and side:
                        pairs.append((g, i, j))
            pairs.sort()
            for g, i, j in pairs:
                if i in cap_of or j in used_j:
                    continue
                used_j.add(j)
                cap_of[i] = caps[j]['text']
        for i, (name, bb) in enumerate(keep):
            photos[name] = {'page': page_ref, 'bbox': bb, **({'caption': cap_of[i]} if i in cap_of else {})}
        for name, bb in sliced:
            photos[name] = {'page': page_ref, 'bbox': bb, 'page_slice': True}
        for name, bb in here:
            if name in dup_of:
                photos[name] = {'page': page_ref, 'bbox': bb, 'dup_of': dup_of[name]}

json.dump({'photos': photos, 'headings': headings}, open(f'{ROOT}/scripts/extract/photos.json', 'w'), ensure_ascii=False, indent=1)
print('photos', len(photos), 'with caption', sum(1 for p in photos.values() if 'caption' in p))
