"""Download a small set of CARTO Voyager basemap tiles for the offline web preview."""
import math, os, time, urllib.request

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'preview', 'tiles')
UA = {'User-Agent': 'WaikikiWalksPreview/0.1 (one-time private preview)'}


def tile(lon, lat, z):
    n = 2 ** z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)
    return x, y


def grab(bbox, zooms, style='voyager'):
    got = 0
    for z in zooms:
        x0, y0 = tile(bbox[0], bbox[3], z)
        x1, y1 = tile(bbox[2], bbox[1], z)
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                p = f'{OUT}/{style}/{z}/{x}/{y}.png'
                if os.path.exists(p):
                    continue
                os.makedirs(os.path.dirname(p), exist_ok=True)
                url = f'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                if style == 'dark':
                    url = f'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
                try:
                    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20).read()
                    open(p, 'wb').write(data)
                    got += 1
                except Exception as e:
                    print('fail', url, e)
                time.sleep(0.4)
    return got


WIDE = (-157.862, 21.255, -157.79, 21.335)
CORE = (-157.845, 21.262, -157.812, 21.296)
CAMPUS = (-157.826, 21.288, -157.806, 21.306)  # Walk XI and XII pins from the photo map pages
for style in ('osm',):
    print(style, grab(WIDE, [14, 15], style), grab(CORE, [16], style), grab(CAMPUS, [16], style))
