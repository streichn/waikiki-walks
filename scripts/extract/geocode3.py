"""Third pass: re-geocode "estimated" and "low" pins using place names and street corners the book gives.

Each target below says what to search for and why (the book's own words). Two kinds:
  poi:    a named place (statue, park, school). Accepted only if OpenStreetMap returns a result whose
          name contains every key word of the search, and it lies within MAX_M of a neighbouring stop
          that is already pinned with medium confidence. Street results (a driveway, a lane) get "low".
  near:   like poi, but the book places the stop beside a landmark, so the pin gets "low".
  corner: the book says the stop is at the corner of two streets. We fetch both street geometries
          from Nominatim and take the point where they meet.

Rules from the OSM Foundation Nominatim policy: at most 1 request per second, an identifying
User-Agent, results cached on disk so a re-run sends no repeat queries. No personal data is sent.

Run:  python3 -I scripts/extract/geocode3.py           (writes scripts/extract/geo.json and review/geocode3_report.csv)
Then: python3 -I scripts/build_data.py
"""
import csv, json, math, os, re, sys, time, unicodedata, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GEO = f'{ROOT}/scripts/extract/geo.json'
CACHE = f'{ROOT}/scripts/extract/geocode3_cache.json'
REPORT = f'{ROOT}/review/geocode3_report.csv'
UA = 'waikiki-walks-geocoder/1.0'
VB = '-157.865,21.345,-157.775,21.255'
MAX_M = 900

# (walk, stop): (kind, queries or streets, book basis)
TARGETS = {
    ('II', 8): ('corner', ['Hobron Lane', 'Ala Moana Boulevard'], 'Discovery Bay, the twin-tower condominium on the mauka-Diamond Head corner of Hobron Lane and Ala Moana Boulevard'),
    ('II', 17): ('poi', ['U.S. Army Museum of Hawaii', 'Battery Randolph'], 'Battery Randolph, U.S. Army Museum of Hawaiʻi, Saratoga Road'),
    ('II', 18): ('poi', ['Kuroda Field'], 'Kuroda Field'),
    ('III', 11): ('near', ['Kapaemahu', 'Wizard Stones', 'Waikiki Beach Center'], 'located on the sand near the Waikīkī Beach Center pavilion (Walk IV, Stop 25)'),
    ('IV', 6): ('corner', ['Kalakaua Avenue', 'Kalaimoku Street'], 'On the mauka corner of Kalākaua Avenue and Kālaimoku Street'),
    ('IV', 13): ('poi', ['Princess Bernice Pauahi Bishop statue', 'Bernice Pauahi Bishop'], 'Princess Bernice Pauahi Bishop statue'),
    ('IV', 25): ('near', ['Kapaemahu', 'Wizard Stones', 'Waikiki Beach Center'], 'These stones are located on the sand near the Waikīkī Beach Center pavilion'),
    ('IV', 28): ('poi', ['Prince Kuhio statue', 'Prince Jonah Kuhio Kalanianaole statue'], 'Prince Kūhiō Statue'),
    ('VI', 2): ('poi', ['Gandhi statue, Honolulu', 'Mahatma Gandhi'], 'Mohandas K. Gandhi Statue'),
    ('VII', 4): ('poi', ['Kapiolani Park Beach Center'], 'Kapiʻolani Park Beach Center'),
    ('VII', 7): ('poi', ['Sans Souci Beach', 'Kaimana Beach'], 'The beach ... in front of the Kaimana Hotel and neighboring Sans Souci Apartments, is known as Sans Souci Beach'),
    ('VII', 21): ('poi', ['La Pietra Hawaii School for Girls', 'La Pietra'], 'La Pietra Hawaiʻi School for Girls'),
    ('VIII', 20): ('corner', ['Waialae Avenue', 'Center Street'], 'on the mauka side of the avenue on the corner of one of the place-named streets, Center Street'),
    ('VIII', 28): ('poi', ['Leahi Hospital'], 'Lēʻahi Hospital'),
    ('VIII', 31): ('poi', ['Fort Ruger'], 'Fort Ruger'),
    ('VIII', 22): ('poi', ['Liliuokalani Elementary School'], 'Queen Lydia Liliʻuokalani Elementary School ... as you turn makai on Koko Head Avenue'),
    ('IX', 3): ('poi', ['Honolulu Fire Department Station 7', 'Waikiki Fire Station'], 'Waikīkī Fire Station: Station No. 7'),
    ('IX', 14): ('poi', ['Kuhio Elementary School', 'Prince Jonah Kuhio Elementary'], 'Prince Jonah Kūhiō Elementary'),
    ('IX', 18): ('poi', ['Honolulu Fire Department Station 29', 'McCully Fire Station'], 'McCully-Moʻiliʻili Fire Station 29'),
    ('IX', 20): ('poi', ['Triangle Park, Moiliili', 'Triangle Park, Honolulu'], 'Torii at Triangle Park'),
    ('X', 2): ('poi', ['Ala Wai Community Park'], 'Ala Wai Community Park'),
    ('X', 32): ('corner', ['Oahu Avenue', 'University Avenue'], 'graces the ʻEwa side of the intersection of Oʻahu and University avenues'),
    ('X', 36): ('poi', ['Manoa Heritage Center'], 'Mānoa Heritage Center at 2856 Oʻahu Avenue'),
    ('X', 41): ('poi', ['Manoa Chinese Cemetery'], 'Mānoa Chinese Cemetery'),
    ('X', 43): ('poi', ['Lyon Arboretum'], 'Lyon Arboretum'),
    ('XI', 28): ('poi', ['Kennedy Theatre', 'John F. Kennedy Theatre'], 'John F. Kennedy Theater'),
    ('XI', 45): ('poi', ['School of Law, University of Hawaii', 'Music Building, University of Hawaii'], 'Music Building and Law School'),
    ('XII', 2): ('poi', ['Jefferson Elementary School, Honolulu', 'Thomas Jefferson Elementary'], 'Thomas Jefferson'),
    ('XII', 3): ('poi', ['Honolulu Fire Department Station 7', 'Waikiki Fire Station'], 'Waikīkī Fire Station'),
    ('XII', 4): ('poi', ['Waikiki-Kapahulu Public Library', 'Waikiki Kapahulu Library'], 'Waikīkī-Kapahulu Public Library'),
}

# Pins the first pass already found by exact name, but which build_data.py threw away for being more
# than 1.8 km from the middle of a long walk. Checked by hand: the OSM name is the place the book names.
KEEP = {
    ('X', 2): 'Ala Wai Community Park',
    ('X', 41): 'Manoa Chinese Cemetery',
    ('X', 43): 'Lyon Arboretum',
    ('XII', 2): 'President Thomas Jefferson Elementary School',
    ('XII', 3): 'Waikiki-Kapahulu Fire Station',
    ('XII', 4): 'Waikiki-Kapahulu Public Library',
}

# First-pass pins that are wrong or too exact. 'drop' clears the pin so a target below can replace it or
# build_data.py interpolates it; 'low' keeps the point but marks it as rough.
DEMOTE = {
    ('VIII', 22): ('drop', 'first pass matched Jefferson Elementary on Kapahulu; the book says Liliʻuokalani Elementary, seen when you turn makai on Koko Head Avenue'),
    ('IX', 1): ('low', 'pin is where Kapahulu meets Date Street, but the stop covers the walk up Kapahulu from the beach'),
}

STOP_WORDS = {'the', 'of', 'and', 'honolulu', 'hawaii', 'school', 'park', 'street', 'avenue', 'station', 'center',
              'statue', 'department', 'public', 'building', 'university', 'beach', 'elementary', 'fire'}

cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
_last = [0.0]


def fetch(url):
    if url in cache:
        return cache[url]
    wait = 1.1 - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    _last[0] = time.time()
    try:
        r = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30))
    except Exception as e:
        print('  request failed:', e, file=sys.stderr)
        return None
    cache[url] = r
    json.dump(cache, open(CACHE, 'w'), ensure_ascii=False)
    return r


def fold(t):
    t = unicodedata.normalize('NFKD', t or '')
    t = ''.join(c for c in t if not unicodedata.combining(c)).replace('ʻ', '').replace('‘', '').replace('’', '').replace("'", '')
    return t.lower()


def keywords(q):
    return {w for w in re.findall(r'[a-z0-9]+', fold(q)) if w not in STOP_WORDS and len(w) > 2}


def dist(lat1, lng1, lat2, lng2):
    return math.hypot((lat1 - lat2) * 111000, (lng1 - lng2) * 103000)


def nominatim(q):
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
        {'q': q, 'format': 'jsonv2', 'limit': 5, 'viewbox': VB, 'bounded': 1})
    out = []
    for h in fetch(url) or []:
        out.append({'lat': float(h['lat']), 'lng': float(h['lon']), 'name': h.get('name') or h.get('display_name', '').split(',')[0],
                    'type': f"{h.get('category')}/{h.get('type')}", 'src': 'nominatim', 'display': h.get('display_name', '')})
    return out


def photon(q):
    url = 'https://photon.komoot.io/api/?' + urllib.parse.urlencode({'q': q, 'limit': 5, 'bbox': '-157.865,21.255,-157.775,21.345', 'lang': 'en'})
    out = []
    for f in (fetch(url) or {}).get('features', []):
        p = f.get('properties', {})
        lng, lat = f['geometry']['coordinates']
        out.append({'lat': lat, 'lng': lng, 'name': p.get('name', ''), 'type': f"{p.get('osm_key')}/{p.get('osm_value')}", 'src': 'photon',
                    'display': ', '.join(x for x in (p.get('name'), p.get('street'), p.get('city')) if x)})
    return out


def street_lines(name):
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
        {'q': name + ', Honolulu', 'format': 'jsonv2', 'limit': 40, 'viewbox': VB, 'bounded': 1, 'dedupe': 0, 'polygon_geojson': 1})
    lines = []
    for h in fetch(url) or []:
        g = h.get('geojson', {})
        if h.get('category') != 'highway':
            continue
        if g.get('type') == 'LineString':
            lines.append(g['coordinates'])
        elif g.get('type') == 'MultiLineString':
            lines.extend(g['coordinates'])
    return lines


def corner(a, b):
    best = (1e9, None)
    for l1 in street_lines(a):
        for p in l1:
            for l2 in street_lines(b):
                for q in l2:
                    dd = dist(p[1], p[0], q[1], q[0])
                    if dd < best[0]:
                        best = (dd, ((p[1] + q[1]) / 2, (p[0] + q[0]) / 2))
    return best


def neighbours(stops, i):
    """Medium-confidence pins just before and after stop i, in walk order."""
    out = []
    for rng in (range(i - 1, -1, -1), range(i + 1, len(stops))):
        for j in rng:
            g = stops[j].get('geo')
            if g and g.get('confidence') == 'medium':
                out.append((stops[j]['n'], g['lat'], g['lng']))
                break
    return out


def main():
    d = json.load(open(GEO))
    rows = []
    for w in d['walks']:
        stops = w['stops']
        for i, s in enumerate(stops):
            dm = DEMOTE.get((w['roman'], s['n']))
            if dm and s.get('geo'):
                g = s['geo']
                rows.append({'walk': w['roman'], 'stop': s['n'], 'title': s['title'], 'status': 'demoted', 'confidence': 'estimated' if dm[0] == 'drop' else 'low',
                             'book_basis': dm[1], 'result': f"was medium: {g.get('osm', '')[:60]}", 'lat': '', 'lng': '', 'map_link': ''})
                print(w['roman'], s['n'], s['title'][:40], '-> demoted', dm[0], flush=True)
                if dm[0] == 'drop':
                    s['geo_rejected'] = g
                    s['geo'] = None
                else:
                    g['confidence'] = 'low'
                    g['note'] = dm[1]
            k = KEEP.get((w['roman'], s['n']))
            if k and s.get('geo') and fold(s['geo'].get('osm', '')).startswith(fold(k)):
                s['geo']['keep'] = True
                g = s['geo']
                print(w['roman'], s['n'], s['title'][:40], '-> kept', k, flush=True)
                rows.append({'walk': w['roman'], 'stop': s['n'], 'title': s['title'], 'status': 'kept', 'confidence': g['confidence'],
                             'book_basis': s['title'], 'result': f'{k} (first pass, was discarded as far from walk centre)',
                             'lat': round(g['lat'], 6), 'lng': round(g['lng'], 6),
                             'map_link': f"https://www.openstreetmap.org/?mlat={g['lat']:.6f}&mlon={g['lng']:.6f}#map=19/{g['lat']:.6f}/{g['lng']:.6f}"})
                continue
            t = TARGETS.get((w['roman'], s['n']))
            if not t or (s.get('geo') or {}).get('confidence') == 'medium':
                continue
            kind, qs, basis = t
            nb = neighbours(stops, i)
            old = s.get('geo')
            hit, note = None, ''
            if kind == 'corner':
                gap, pt = corner(*qs)
                if pt and gap < 40:
                    hit = {'lat': pt[0], 'lng': pt[1], 'name': f'{qs[0]} at {qs[1]}', 'type': 'intersection', 'src': 'nominatim',
                           'display': f'intersection of {qs[0]} and {qs[1]}'}
                else:
                    note = f'streets not found meeting (gap {round(gap)} m)'
            else:
                for q in qs:
                    want = keywords(q)
                    if not want:
                        continue
                    for c in nominatim(q) + photon(q):
                        if not want <= keywords(c['name']) or (kind == 'near' and fold(q) not in fold(c['name'])):
                            continue
                        hit = c
                        break
                    if hit:
                        break
                if not hit:
                    note = 'no OSM result with a matching name'
            if hit and nb:
                near = min(dist(hit['lat'], hit['lng'], la, ln) for _, la, ln in nb)
                if near > MAX_M:
                    note = f"found {hit['name']} but {round(near)} m from neighbouring stops; rejected"
                    hit = None
            status = 'updated' if hit else 'unchanged'
            conf = 'low' if hit and (kind == 'near' or hit['type'].startswith('highway/')) else 'medium'
            if hit:
                s['geo'] = {'lat': hit['lat'], 'lng': hit['lng'], 'query': ' / '.join(qs), 'osm': f"{hit['display']} ({hit['src']})",
                            'type': hit['type'], 'confidence': conf, 'basis': basis, 'pass': 'geocode3'}
                moved = round(dist(hit['lat'], hit['lng'], old['lat'], old['lng'])) if old else ''
                note = f"{hit['name']} [{hit['type']}]" + (f', moved {moved} m' if moved != '' else '')
            print(w['roman'], s['n'], s['title'][:40], '->', status, note, flush=True)
            rows.append({'walk': w['roman'], 'stop': s['n'], 'title': s['title'], 'status': status, 'confidence': conf if hit else (old or {}).get('confidence', 'estimated'), 'book_basis': basis, 'result': note,
                         'lat': round(hit['lat'], 6) if hit else '', 'lng': round(hit['lng'], 6) if hit else '',
                         'map_link': f"https://www.openstreetmap.org/?mlat={hit['lat']:.6f}&mlon={hit['lng']:.6f}#map=19/{hit['lat']:.6f}/{hit['lng']:.6f}" if hit else ''})
    json.dump(d, open(GEO, 'w'), ensure_ascii=False, indent=1)
    with open(REPORT, 'w', newline='') as f:
        wr = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        wr.writeheader()
        wr.writerows(rows)
    print('updated', sum(r['status'] == 'updated' for r in rows), 'of', len(rows))


if __name__ == '__main__':
    main()
