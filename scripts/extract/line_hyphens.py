"""Find hyphens that the book prints at the end of a line and that belong to the word.

The PDF text joins a word broken across two lines by dropping the hyphen ("well-" / "known"
becomes "wellknown", "(1890-" / "1968)" becomes "(18901968)"). Most line-end hyphens are only
there to split a word ("pre-" / "sented"), so the hyphen can't simply be kept. This script keeps
it only when the book itself shows the hyphen is part of the word:

  - digits on both sides (a year range such as 1890-1968), or
  - the word after the hyphen starts with a capital (Mānoa-Pālolo, mauka-Koko Head), or
  - the same hyphenated word is printed in the middle of a line somewhere in the book.

Pairs that pass a rule but are only split words go in SKIP. Output:
scripts/extract/line_hyphens.json, read by scripts/build_data.py.

Run: python3 -I scripts/extract/line_hyphens.py
"""
import json
import os
import re

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDFS = ['part1_walks_I-IV.pdf', 'part2_walks_V-IX.pdf', 'part3_walks_X-XII.pdf']
WORD = r'[\w‘’]+'
# Pass a rule but are not one word: a letter-spaced heading, or two lines from different
# columns or captions that the PDF reads one after the other.
SKIP = {'ALO-HA', 'Hi-Queen', 'Val-According', 'commis-Prince', 'dedi-As', 'un-Stop',
        'Wai-Canal',  # "Ala Wai-" / "Canal.": the canal's name, written "Ala Wai Canal" everywhere else
        'near-by'}  # the joined form "nearby" is a word in its own right, used throughout the book
# Fail the rules but are compound words, checked against the page text.
ALSO = {'Hawai‘i-born', 'mid-1890s', 'non-sacrificial', 'three-block', 'burnt-out', 'well-maintained'}


def page_lines(page):
    for b in page.get_text('dict')['blocks']:
        for line in b.get('lines', []):
            yield ''.join(s['text'] for s in line['spans']).strip()


def main():
    pairs, midline = {}, set()
    for f in PDFS:
        for pno, page in enumerate(pymupdf.open(f'{ROOT}/book/{f}'), 1):
            lines = list(page_lines(page))
            for ln in lines:
                midline.update(re.findall(rf'(?<![\w‘’]){WORD}-{WORD}', ln))
            for a, b in zip(lines, lines[1:]):
                m, n = re.search(rf'({WORD})-$', a), re.match(WORD, b)
                if m and n:
                    pairs.setdefault(f'{m.group(1)}-{n.group(0)}', f"p{PDFS.index(f) + 1}-{pno}")
    keep = {}
    for hy, page in sorted(pairs.items()):
        left, right = hy.split('-', 1)
        why = None
        if hy in ALSO:
            why = 'compound word, checked on the page'
        elif left.isdigit() and right.isdigit():
            why = 'year range'
        elif right[:1].isupper() and not left.isupper():
            why = 'capital after the hyphen'
        elif hy in midline:
            why = 'printed with the hyphen mid-line elsewhere in the book'
        if why and hy not in SKIP:
            keep[hy] = {'page': page, 'why': why}
    out = f'{ROOT}/scripts/extract/line_hyphens.json'
    json.dump({'_note': __doc__.strip().split('\n\n')[0], 'keep': keep}, open(out, 'w'), ensure_ascii=False, indent=1)
    print(len(keep), 'hyphenated words kept;', out)


if __name__ == '__main__':
    main()
