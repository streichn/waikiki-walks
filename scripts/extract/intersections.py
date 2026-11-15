"""Snap street-name stops to where that street crosses the walk's main street(s).

The book's street stops ("Lewers Street", "Seaside Avenue") mean the corner where the walker
meets that street, not the middle of the street. Nominatim returns every OSM way of a street
when dedupe=0 and polygon_geojson=1, so we can intersect the two street geometries.
"""
import json, math, re, time, urllib.parse, urllib.request

P = '/root/book/out/geo.json'
d = json.load(open(P))
VB = '-157.865,21.345,-157.775,21.255'
MAIN = {
    'I': ['Ala Wai Boulevard', 'Date Street', 'Kapahulu Avenue', 'McCully Street'],
    'II': ['Kālia Road', 'Ala Moana Boulevard', 'Hobron Lane'],
    'III': ['Kalākaua Avenue', 'Kālia Road', 'Helumoa Road'],
    'IV': ['Kalākaua Avenue'],
    'V': ['Kūhiō Avenue', 'Kapahulu Avenue', 'Ala Wai Boulevard'],
    'VI': ['Kalākaua Avenue', 'Monsarrat Avenue', 'Kapahulu Avenue', 'Paki Avenue'],
    'VII': ['Kalākaua Avenue', 'Diamond Head Road'],
    'VIII': ['Waiʻalae Avenue', 'Kapahulu Avenue', 'Koko Head Avenue'],
    'IX': ['South King Street', 'University Avenue', 'Date Street', 'Kapiʻolani Boulevard'],
    'X': ['Oʻahu Avenue', 'East Mānoa Road', 'Mānoa Road', 'University Avenue'],
}
cache = {}


def ways(name):
    if name in cache:
        return cache[name]
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
        {'q': name + ', Honolulu', 'format': 'jsonv2', 'limit': 40, 'viewbox': VB, 'bounded': 1, 'dedupe': 0, 'polygon_geojson': 1})
    try:
        r = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'WaikikiWalksDraft/0.1'}), timeout=30))
    except Exception:
        r = []
    time.sleep(1.1)
    lines = []
    for h in r:
        g = h.get('geojson', {})
        if h.get('category') != 'highway':
            continue
        if g.get('type') == 'LineString':
            lines.append(g['coordinates'])
        elif g.get('type') == 'MultiLineString':
            lines.extend(g['coordinates'])
    cache[name] = lines
    return lines


def dist(a, b):
    return math.hypot((a[1] - b[1]) * 111000, (a[0] - b[0]) * 103000)


def closest(l1, l2):
    best = (1e9, None)
    for line1 in l1:
        for p in line1:
            for line2 in l2:
                for q in line2:
                    dd = dist(p, q)
                    if dd < best[0]:
                        best = (dd, ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2))
    return best


def street_name(title):
    t = re.sub(r'\(.*?\)', '', title).split('/')[0].split('–')[0].split(':')[0].strip(' “”"')
    if re.search(r'\b(Street|Avenue|Road|Lane|Boulevard|Way|Place|Drive)\b', t) and len(t.split()) <= 4:
        return t
    return None


snapped = 0
for w in d['walks']:
    mains = MAIN.get(w['roman'])
    if not mains:
        continue
    for i, s in enumerate(w['stops']):
        name = street_name(s['title'])
        if not name or any(name.lower().startswith(m.lower().split()[0]) for m in mains if name.lower() == m.lower()):
            continue
        cross = ways(name)
        if not cross:
            continue
        # Choose the main street whose crossing is nearest to the neighbouring stops.
        nb = [x['geo'] for x in (w['stops'][i - 1] if i else None, w['stops'][i + 1] if i + 1 < len(w['stops']) else None) if x and x.get('geo') and x['geo'].get('confidence') == 'medium']
        cands = []
        for m in mains:
            if m.lower() == name.lower():
                continue
            dd, pt = closest(ways(m), cross)
            if pt and dd < 40:
                score = sum(dist(pt, (g['lng'], g['lat'])) for g in nb) if nb else 0
                cands.append((score, pt, m))
        if cands:
            cands.sort()
            _, pt, m = cands[0]
            s['geo'] = {'lat': pt[1], 'lng': pt[0], 'confidence': 'medium', 'query': f'{name} at {m}', 'osm': f'intersection of {name} and {m}', 'type': 'intersection'}
            snapped += 1
            print(w['roman'], s['n'], name, '@', m, flush=True)
json.dump(d, open(P, 'w'), ensure_ascii=False, indent=1)
print('snapped', snapped)
