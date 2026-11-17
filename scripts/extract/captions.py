"""Collect the book's photo captions (small Arial lines next to photos) so build_data can
pull them out of body text where the PDF parser mixed them in. Writes scripts/extract/captions.json."""
import json, re, pymupdf
FILES = {'p1': 'book/part1_walks_I-IV.pdf', 'p2': 'book/part2_walks_V-IX.pdf', 'p3': 'book/part3_walks_X-XII.pdf'}
out = []
for tag, path in FILES.items():
    doc = pymupdf.open(path)
    for pi, page in enumerate(doc):
        lines = []
        for b in page.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                s = l['spans'][0]
                if s['font'].startswith('Arial') and 6.0 <= s['size'] <= 8.5:
                    t = ''.join(x['text'] for x in l['spans']).replace('\x07', '').strip()
                    if t:
                        lines.append((round(l['bbox'][0]), round(l['bbox'][1]), t))
        lines.sort(key=lambda x: (x[0] // 40, x[1]))
        cur, last = [], None
        for x, y, t in lines:
            if cur and (x // 40 != last[0] // 40 or y - last[1] > 14):
                out.append({'page': f'{tag}-{pi + 1}', 'text': re.sub(r'\s+', ' ', ' '.join(cur)).strip()})
                cur = []
            cur.append(t); last = (x, y)
        if cur:
            out.append({'page': f'{tag}-{pi + 1}', 'text': re.sub(r'\s+', ' ', ' '.join(cur)).strip()})
out = [c for c in out if len(c['text']) >= 12]
json.dump(out, open('scripts/extract/captions.json', 'w'), ensure_ascii=False, indent=1)
print(len(out))
