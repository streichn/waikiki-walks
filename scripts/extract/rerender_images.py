"""Re-render the book's pictures without the page text printed over them.

parse_overlay.py rendered each picture's box straight from the page, so body text, captions and page numbers
that overlap the box were baked into the "photo" (Veneeta, 19 Nov 2026: page 215 "cropped wrong").
This walks the PDFs in exactly the same order, with the same skip rules, so every file keeps its name, and
renders each box from a copy of the page whose text has been removed (pictures and line art kept).
Writes to OUT_DIR (default /tmp/rerender); review, then copy into assets/book.
Usage: python3 -I scripts/extract/rerender_images.py"""
import os, sys, glob
import pymupdf as fitz
from PIL import Image, ImageStat
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.environ.get('OUT_DIR', '/tmp/rerender'); os.makedirs(OUT, exist_ok=True)
files = [glob.glob(f'{ROOT}/book/part{i}*.pdf')[0] for i in (1, 2, 3)]

def to_im(pix):
    return Image.frombytes('RGB', (pix.width, pix.height), pix.samples) if pix.n == 3 else Image.frombytes('RGBA', (pix.width, pix.height), pix.samples).convert('RGB')

imgcount = 0; made = []
for fi, f in enumerate(files):
    d = fitz.open(f); clean = fitz.open(f)
    for pno, pg in enumerate(d):
        cp = clean[pno]
        cp.add_redact_annot(cp.rect)
        cp.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE, text=fitz.PDF_REDACT_TEXT_REMOVE)
        page_ref = f'p{fi+1}-{pno+1}'
        for b in pg.get_text('dict')['blocks']:
            if b['type'] != 1: continue
            if b['bbox'][2] - b['bbox'][0] < 80: continue
            imgcount += 1
            name = f'{page_ref}-{imgcount}.jpg'
            clip = fitz.Rect(b['bbox']) & pg.rect
            if clip.width < 80 or clip.height < 60: imgcount -= 1; continue
            im = to_im(pg.get_pixmap(clip=clip, dpi=150))  # same tests as the original pass, so names line up
            if ImageStat.Stat(im.convert('L')).stddev[0] < 18: imgcount -= 1; continue
            if clip.width > pg.rect.width * 0.95 and clip.height > pg.rect.height * 0.9: imgcount -= 1; continue
            out = to_im(cp.get_pixmap(clip=clip, dpi=150))
            out.thumbnail((1200, 1200)); out.save(f'{OUT}/{name}', quality=82)
            made.append(name)
print('rendered', len(made))

# Apply the reviewed decisions (scripts/extract/photo_fixes.json) and write the photos the app uses.
if '--apply' in sys.argv:
    import json
    fx = json.load(open(f'{ROOT}/scripts/extract/photo_fixes.json'))
    n = 0
    for name in made:
        if name in fx['drop'] or not os.path.exists(f'{ROOT}/assets/book/{name}'):
            continue
        im = Image.open(f'{OUT}/{name}')
        if name in fx['crop']:
            x, y, w, h = fx['crop'][name]; im = im.crop((x, y, x + w, y + h))
        im.save(f'{ROOT}/assets/book/{name}', quality=85); n += 1
    print('wrote', n, 'photos to assets/book')
