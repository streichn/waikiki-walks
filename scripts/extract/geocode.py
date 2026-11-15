import json, time, urllib.parse, urllib.request, re

d = json.load(open('/root/book/out/clean.json'))
cache_f = '/root/book/out/geocache.json'
try:
    cache = json.load(open(cache_f))
except Exception:
    cache = {}
VB = '-157.865,21.345,-157.775,21.255'  # Ala Moana to Kaimuki/Manoa


def q(s):
    if s in cache:
        return cache[s]
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
        {'q': s, 'format': 'jsonv2', 'limit': 3, 'viewbox': VB, 'bounded': 1})
    req = urllib.request.Request(url, headers={'User-Agent': 'WaikikiWalksDraft/0.1'})
    r = None
    for _ in range(3):
        try:
            r = json.load(urllib.request.urlopen(req, timeout=20))
            break
        except Exception:
            time.sleep(3)
    time.sleep(1.1)
    cache[s] = r
    json.dump(cache, open(cache_f, 'w'))
    return r


def clean(t):
    t = re.sub(r'\(.*?\)', '', t)
    t = t.split('/')[0]
    t = re.sub(r'[“”"*]', '', t)
    return t.strip(' ,.-–')


for w in d['walks']:
    for st in w['stops']:
        name = clean(st['title'])
        cands = [name + ', Honolulu', name]
        if st.get('subtitle'):
            cands.append(clean(st['subtitle']) + ', Honolulu')
        hit = None
        for c in cands:
            r = q(c)
            if r:
                hit = (c, r[0])
                break
        if hit:
            c, h = hit
            st['geo'] = {
                'lat': float(h['lat']), 'lng': float(h['lon']), 'query': c,
                'osm': h.get('display_name', '')[:120],
                'type': h.get('category', '') + '/' + h.get('type', ''),
                'confidence': 'low' if h.get('category') == 'highway' else 'medium'}
        else:
            st['geo'] = None
        print(w['roman'], st['n'], name, '->', st['geo'] and (st['geo']['type'], st['geo']['lat'], st['geo']['lng']), flush=True)
json.dump(d, open('/root/book/out/geo.json', 'w'), ensure_ascii=False, indent=1)
print('DONE')
