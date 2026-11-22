"""Read each walk's information box (time, distance, buses, parking, websites) from the book PDFs.

The book prints this box in bold Helvetica in a shaded panel on the walk's opening page, one short
paragraph per item, with labels such as "Parking:" or "Useful websites:" on their own line. The general
parser (parse.py) joined the whole box into one run-on line and, for Walks I and IV, filed it under
stop 1. This script keeps the book's paragraphs and labels so the app can show one row per item.

Output: scripts/extract/info_boxes.json
  { "I": {"page": "p1-23", "rows": [{"kind": "bus", "text": "..."}, {"kind": "parking", "label": "Parking", "text": "..."}]}, ... }
kind is only for the row icon in the app: time, route, bus, parking, web, contact.
Every word comes from the book; the only changes are joining wrapped lines and splitting off a
printed label. Run:  python3 -I scripts/extract/info_boxes.py   (needs pymupdf)
"""
import glob
import json
import os
import re

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Walk -> (PDF part, page) of its opening page with the box. Walk VIII prints no box.
PAGES = {'I': (1, 23), 'II': (1, 41), 'III': (1, 59), 'IV': (1, 73), 'V': (2, 2), 'VI': (2, 18), 'VII': (2, 30),
         'IX': (2, 66), 'X': (3, 2), 'XI': (3, 38), 'XII': (3, 62)}
LABEL = re.compile(r'(PARKING|Parking lots?|Parking|Useful websites|Walking times)\s*:?\s*', re.I)


def box_paragraphs(page):
    """Bold Helvetica text blocks in the shaded panel, top to bottom, each as one paragraph of lines."""
    out = []
    for b in page.get_text('dict')['blocks']:
        x0, y0, _, y1 = b['bbox']
        # The panel sits on the right, below the letter-spaced subtitle and above the page number.
        if b['type'] != 0 or x0 < page.rect.width * 0.55 or y0 < 200 or y1 > 600:
            continue
        lines = []
        for ln in b['lines']:
            spans = [s for s in ln['spans'] if s['text'].strip()]
            if spans and all(s['font'].startswith('Helvetica') and 'Bold' in s['font'] and s['size'] > 8.5 for s in spans):
                lines.append(re.sub(r'\s+', ' ', ''.join(s['text'] for s in ln['spans'])).strip())
        if lines:
            out.append((y0, lines))
    return [ls for _, ls in sorted(out)]


def clean_label(t):
    t = t.rstrip(':').strip()
    return t[0] + t[1:].lower() if t.isupper() else t


def kind_of(text, context):
    t = text.lower()
    if t.startswith('from '):
        return 'route'
    if 'bus' in t:
        return 'bus'
    if 'park' in t:
        return 'parking'
    if re.search(r'\b(hours?|half-hour|minutes|miles?|steps)\b', t):
        return 'time'
    if re.search(r'www\.|\.org|\.com', t) and context != 'contact':
        return 'web'
    if re.search(r'\(\d{3}\)|eventbrite', t):
        return 'contact'
    return context or 'note'


def context_of(heading):
    h = heading.lower()
    for key, kind in (('park', 'parking'), ('website', 'web'), ('walking', 'time'), ('bus', 'bus'), ('contact', 'contact')):
        if key in h:
            return kind
    return None


def rows_for(paragraphs):
    """One row per printed paragraph. A paragraph that is only a label ("Parking:") becomes a heading row,
    except a bare name ("Lyon Arboretum:"), which labels the next row. A short first line ending in a colon
    ("Honolulu Zoo:") becomes the row's label, as does a place name heading a contact paragraph."""
    rows, context, pending = [], None, None
    for lines in paragraphs:
        lines = [BACKTICK_OKINA(x) for x in lines]
        text = re.sub(r'\s+', ' ', ' '.join(lines)).strip()
        first = lines[0].strip()
        if text.endswith(':') or (len(lines) == 1 and LABEL.fullmatch(text)):
            heading = clean_label(text)
            if context_of(heading) or 'contact' in text.lower() or len(heading) > 30:
                rows.append({'kind': 'heading', 'text': heading})
                context = context_of(heading) or ('contact' if 'contact' in text.lower() else context)
            else:
                pending = heading
            continue
        row = {}
        if pending:
            row['label'], pending = pending, None
        elif len(lines) > 1 and len(first) < 30 and (first.endswith(':') or LABEL.fullmatch(first)
                                                     or (context == 'contact' and not re.search(r'[\d.]', first))):
            row['label'] = clean_label(first)
            text = re.sub(r'\s+', ' ', ' '.join(lines[1:])).strip()
            context = context_of(row['label']) or context
        rows.append({'kind': kind_of(text, context), **row, 'text': text})
    return rows


def BACKTICK_OKINA(t):
    # Walk IX's box prints Mō`ili`ili with a backtick where the book elsewhere has the ‘okina.
    return t.replace('`', '‘')


def main():
    pdfs = {i: sorted(glob.glob(f'{ROOT}/book/part{i}*.pdf'))[0] for i in (1, 2, 3)}
    docs = {i: pymupdf.open(p) for i, p in pdfs.items()}
    out = {'_about': 'Each walk\'s information box as printed on its opening page (scripts/extract/info_boxes.py). Walk VIII has none.'}
    for wid, (part, pg) in PAGES.items():
        paras = box_paragraphs(docs[part][pg - 1])
        if not paras:
            raise SystemExit(f'Walk {wid}: no information box found on part {part} page {pg}')
        out[wid] = {'page': f'p{part}-{pg}', 'rows': rows_for(paras)}
    path = f'{ROOT}/scripts/extract/info_boxes.json'
    json.dump(out, open(path, 'w'), ensure_ascii=False, indent=1)
    for wid, v in out.items():
        if wid.startswith('_'):
            continue
        print(f"== {wid} ({v['page']})")
        for r in v['rows']:
            print(f"   {r['kind']:8} {('[' + r['label'] + '] ') if 'label' in r else ''}{r['text']}")


if __name__ == '__main__':
    main()
