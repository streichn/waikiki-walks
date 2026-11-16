"""Render the extra book map pages listed in pages.json to scripts/georef/pages/map-<id>.jpg (110 dpi, like the
main maps), and print where the PDF prints each stop number, for map_stops.json."""
import json, os, re
import pymupdf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
P = {k: v for k, v in json.load(open(os.path.join(HERE, 'pages.json'))).items() if not k.startswith('_')}
os.makedirs(os.path.join(HERE, 'pages'), exist_ok=True)
for pid, p in P.items():
    pg = pymupdf.open(os.path.join(ROOT, p['pdf']))[p['page'] - 1]
    pg.get_pixmap(dpi=110).save(os.path.join(HERE, 'pages', f'map-{pid}.jpg'), jpg_quality=80)
    s = 110 / 72
    nums = {w[4]: [round((w[0] + w[2]) / 2 * s), round((w[1] + w[3]) / 2 * s)] for w in pg.get_text('words') if re.fullmatch(r'\d{1,2}[AB]?', w[4])}
    print(pid, nums)
