"""Builds the web preview (preview/site/) from the app's data. Publish site/ as the artifact.
Usage: python3 -I preview/build_preview.py   (run from the repo root; needs Pillow)"""
import base64, glob, io, json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = f'{ROOT}/preview'
SITE = f'{P}/site'
os.makedirs(SITE, exist_ok=True)
D = f'{ROOT}/src/data'
walks = json.load(open(f'{D}/walks.json'))
data = {'walks': walks, 'facts': json.load(open(f'{D}/facts.json')), 'glossary': json.load(open(f'{D}/glossary.json')),
        'about': json.load(open(f'{D}/about.json')), 'bookmaps': json.load(open(f'{D}/bookmaps.json')) if os.path.exists(f'{D}/bookmaps.json') else {}, 'bookwarp': json.load(open(f'{D}/bookwarp.json')) if os.path.exists(f'{D}/bookwarp.json') else {}, 'trial': {'walkId': 'IV', 'freeStops': 5}}
open(f'{SITE}/data.js', 'w').write('window.WW=' + json.dumps(data, ensure_ascii=False) + ';')


def enc(f, mx, q):
    im = Image.open(f'{ROOT}/assets/book/{f}').convert('RGB')
    im.thumbnail((mx, mx))
    b = io.BytesIO()
    im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


head = 'window.WWIMG=window.WWIMG||{};Object.assign(window.WWIMG,'
for w in walks:
    files = {p['file'] for s in w['stops'] for p in s['photos']}
    open(f"{SITE}/img-{w['id']}.js", 'w').write(head + json.dumps({f: enc(f, 560, 68) for f in files}) + ');')
open(f'{SITE}/covers.js', 'w').write(head + json.dumps({w['cover']: enc(w['cover'], 800, 72) for w in walks if w.get('cover')}) + ');')
open(f'{SITE}/bookmaps.js', 'w').write(head + json.dumps({w['bookMap']: enc(w['bookMap'], 1300, 72) for w in walks if w.get('bookMap')}) + ');')
tiles = {}
for p in glob.glob(f'{P}/tiles/osm/*/*/*.png'):
    z, x, y = p.split('/')[-3:]
    tiles[f'{z}/{x}/{y[:-4]}'] = 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
open(f'{SITE}/tiles.js', 'w').write('window.WWTILES=' + json.dumps(tiles) + ';')
# Book maps warped onto real coordinates (scripts/georef/warp.py), for the street-map overlay.
warp = {}
for f in glob.glob(f'{P}/warped/*.webp'):
    warp[os.path.basename(f)[:-5]] = 'data:image/webp;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
open(f'{SITE}/warped.js', 'w').write('window.WWWARP=' + json.dumps(warp) + ';')
# Recorded narration: copy every stop whose paragraphs are all recorded (see scripts/audio/make_narration.py).
AUD = os.environ.get('WW_AUDIO_DIR', '/home/claude/waikiki-audio')
audio = {}
if os.path.isdir(AUD):
    import shutil
    for w in walks:
        for st in w['stops']:
            need = 1 + sum(1 for b in st['blocks'] if b['kind'] in ('p', 'direction', 'tagline'))
            src = f"{AUD}/{w['id']}/{st['id']}"
            if all(os.path.exists(f'{src}/{i:02d}.mp3') for i in range(need)):
                os.makedirs(f"{SITE}/audio/{w['id']}/{st['id']}", exist_ok=True)
                for i in range(need): shutil.copyfile(f'{src}/{i:02d}.mp3', f"{SITE}/audio/{w['id']}/{st['id']}/{i:02d}.mp3")
                audio[st['id']] = need
open(f'{SITE}/audio.js', 'w').write('window.WWAUDIO=' + json.dumps(audio) + ';')
html = open(f'{P}/template.html').read().replace('/*LEAFLET_CSS*/', open(f'{P}/leaflet.css').read())
open(f'{SITE}/index.html', 'w').write(html)
open(f'{SITE}/app.js', 'w').write(open(f'{P}/app.js').read())
print('built', len(os.listdir(SITE)), 'files')
