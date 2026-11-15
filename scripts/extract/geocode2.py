"""Second pass: try Photon (OSM fuzzy search) for stops Nominatim missed or placed far away."""
import json, re, statistics, time, urllib.parse, urllib.request

P = '/root/book/out/geo.json'
d = json.load(open(P))
BBOX = '-157.865,21.255,-157.775,21.345'


def photon(q):
    url = 'https://photon.komoot.io/api/?' + urllib.parse.urlencode({'q': q, 'limit': 3, 'bbox': BBOX, 'lang': 'en'})
    req = urllib.request.Request(url, headers={'User-Agent': 'WaikikiWalksDraft/0.1'})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=20))
    except Exception:
        return None
    finally:
        time.sleep(1.0)
    feats = r.get('features') or []
    return feats[0] if feats else None


def clean(t):
    t = re.sub(r'\(.*?\)', '', t)
    t = t.split('/')[0].split(':')[0]
    t = re.sub(r'[“”"*]', '', t)
    t = re.sub(r'^(The|Former|Site of the|Site of)\s+', '', t, flags=re.I)
    return t.strip(' ,.-–')


fixed = 0
for w in d['walks']:
    pts = [(s['geo']['lat'], s['geo']['lng']) for s in w['stops'] if s.get('geo')]
    clat = statistics.median(p[0] for p in pts) if pts else 21.28
    clng = statistics.median(p[1] for p in pts) if pts else -157.82
    for s in w['stops']:
        g = s.get('geo')
        far = g and (((g['lat'] - clat) * 111000) ** 2 + ((g['lng'] - clng) * 103000) ** 2) ** 0.5 > 1800
        if g and not far:
            continue
        name = clean(s['title'])
        for q in (name + ' Honolulu', name + ' Waikiki', (s.get('subtitle') or '') + ' Honolulu'):
            if len(q.strip()) < 10:
                continue
            f = photon(q)
            if not f:
                continue
            lng, lat = f['geometry']['coordinates']
            dist = (((lat - clat) * 111000) ** 2 + ((lng - clng) * 103000) ** 2) ** 0.5
            if dist > 1800:
                continue
            p = f.get('properties', {})
            s['geo'] = {'lat': lat, 'lng': lng, 'query': q, 'osm': f"{p.get('name', '')}, {p.get('street', '')} (photon)", 'type': f"{p.get('osm_key', '')}/{p.get('osm_value', '')}",
                        'confidence': 'low' if p.get('osm_key') == 'highway' else 'medium'}
            fixed += 1
            print(w['roman'], s['n'], name, '->', p.get('name'), round(dist), flush=True)
            break
json.dump(d, open(P, 'w'), ensure_ascii=False, indent=1)
print('fixed', fixed)
