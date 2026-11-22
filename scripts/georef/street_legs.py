"""Walking routes along real streets for legs her map's red line could not be traced for.

The app draws Veneeta's traced red route between stops (src/data/routes.json, from routes.py). Where a leg is
missing, or the traced line does not fit the two stops, the app used to draw a straight line, which cuts
through golf courses and blocks (Veneeta, 19 Nov 2026: Walk I 12 to 13, Walk II 1 to 2 and 2 to 4).
This asks the FOSSGIS OSRM foot router for a walking route and keeps it only if it is a sensible walk between
the two stops: not much longer than the straight line and never far from it. Results are cached in
street_legs.json and merged into src/data/routes.json. Run after routes.py.
Usage: python3 -I scripts/georef/street_legs.py"""
import json, math, os, time, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CACHE = os.path.join(HERE, 'street_legs.json')
URL = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot/{},{};{},{}?overview=full&geometries=geojson'

def metres(a, b):
    k = math.pi / 180
    return 6371000 * math.hypot((b[1] - a[1]) * k * math.cos((a[0] + b[0]) / 2 * k), (b[0] - a[0]) * k)

def off_line(p, a, b):
    """Distance in metres from p to the segment a-b."""
    k = math.pi / 180; c = math.cos(a[0] * k)
    ax, ay, bx, by, px, py = 0, 0, (b[1] - a[1]) * c, b[0] - a[0], (p[1] - a[1]) * c, p[0] - a[0]
    L = bx * bx + by * by or 1e-12; t = max(0, min(1, (px * bx + py * by) / L))
    return 6371000 * k * math.hypot(px - t * bx, py - t * by)

def traced_ok(leg, A, B):
    if not leg or len(leg) < 2: return False
    L = sum(metres(leg[i - 1], leg[i]) for i in range(1, len(leg)))
    return metres(A, leg[0]) <= 120 and metres(B, leg[-1]) <= 120 and L <= 3 * metres(A, B) + 150

def main():
    walks = json.load(open(f'{ROOT}/src/data/walks.json'))
    routes = json.load(open(f'{ROOT}/src/data/routes.json'))
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    kept = skipped = 0
    # Walks on the cartographer's maps follow her dotted line only; never a route of our own (Nick and Veneeta, 22 Nov 2026).
    carto = set(json.load(open(os.path.join(HERE, 'routes_carto.json'))))
    for w in walks:
        if w['id'] in carto:
            continue
        main_stops = [s for s in w['stops'] if s['geo'] == 'book' and not s.get('side')]
        for a, b in zip(main_stops, main_stops[1:]):
            adjacent = w['stops'].index(b) == w['stops'].index(a) + 1
            key = str(a['n']) if adjacent else f"{a['n']}>{b['n']}"
            A, B = (a['lat'], a['lng']), (b['lat'], b['lng'])
            if adjacent and traced_ok(routes.get(w['id'], {}).get(key), A, B):
                continue
            ck = f"{w['id']}:{key}:{A[0]:.6f},{A[1]:.6f}:{B[0]:.6f},{B[1]:.6f}"
            if ck not in cache:
                try:
                    r = json.load(urllib.request.urlopen(URL.format(A[1], A[0], B[1], B[0]), timeout=30))
                    cache[ck] = [[c[1], c[0]] for c in r['routes'][0]['geometry']['coordinates']]
                except Exception as e:
                    print('route failed', ck, e); continue
                time.sleep(1)
            path = cache[ck]
            straight = metres(A, B)
            L = sum(metres(path[i - 1], path[i]) for i in range(1, len(path)))
            dev = max(off_line(p, A, B) for p in path)
            if L <= 1.8 * straight + 120 and dev <= max(120, 0.45 * straight):
                routes.setdefault(w['id'], {})[key] = path; kept += 1
            else:
                skipped += 1; print(f"kept straight {w['id']} {key}: route {L:.0f} m vs {straight:.0f} m, strays {dev:.0f} m")
    json.dump(cache, open(CACHE, 'w'))
    json.dump(routes, open(f'{ROOT}/src/data/routes.json', 'w'))
    print('street legs used', kept, 'kept straight', skipped)

if __name__ == '__main__':
    main()
