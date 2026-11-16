"""Builds walking paths between consecutive stops: src/data/routes.json.

Run after scripts/build_data.py:  python3 -I scripts/build_routes.py

Each leg is routed on foot over OpenStreetMap data by the public FOSSGIS OSRM server
(routing.openstreetmap.de, foot profile). Rules from its usage policy: at most 1 request per second,
an honest User-Agent, no heavy use. Only the two stop coordinates are sent; nothing about any person.
Results are cached in scripts/extract/routes_cache.json keyed by the rounded coordinates, so a re-run
only asks for legs whose pins moved.

A leg keeps the drawn path only if it looks sane. The app falls back to a straight dashed line when:
  - the router had to snap a stop more than SNAP_MAX_M meters to reach a path, or
  - the path is far longer than the straight line (likely a detour around a fence or a missing footway).
Each leg stores its endpoints so the app can ignore a path whose pins have since moved.
"""
import json, math, os, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WALKS = f'{ROOT}/src/data/walks.json'
OUT = f'{ROOT}/src/data/routes.json'
CACHE = f'{ROOT}/scripts/extract/routes_cache.json'
SERVER = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot/'
UA = 'waikiki-walks-data-build/1.0 (book walking tour app; offline route precompute)'
SNAP_MAX_M = 60
DETOUR_MAX = 3.0  # path may be at most 3x the straight line, plus DETOUR_SLACK_M
DETOUR_SLACK_M = 250
SIMPLIFY_M = 3  # drop points that bend the line by less than this


def dist(a, b):
    R = 6371000
    la1, la2 = math.radians(a[0]), math.radians(b[0])
    dla, dlo = la2 - la1, math.radians(b[1] - a[1])
    h = math.sin(dla / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dlo / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def simplify(pts, tol):
    """Douglas-Peucker in local meters."""
    if len(pts) < 3:
        return pts
    lat0 = math.radians(pts[0][0])
    xy = [((p[1]) * 111320 * math.cos(lat0), p[0] * 110540) for p in pts]

    def seg_d(p, a, b):
        ax, ay = a; bx, by = b; px, py = p
        dx, dy = bx - ax, by - ay
        if dx == dy == 0:
            return math.hypot(px - ax, py - ay)
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - ax - t * dx, py - ay - t * dy)

    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        best, k = 0, -1
        for m in range(i + 1, j):
            d = seg_d(xy[m], xy[i], xy[j])
            if d > best:
                best, k = d, m
        if best > tol:
            keep[k] = True
            stack += [(i, k), (k, j)]
    return [p for p, f in zip(pts, keep) if f]


def key(a, b):
    return f'{a[0]:.6f},{a[1]:.6f};{b[0]:.6f},{b[1]:.6f}'


_last = [0.0]


def fetch(a, b):
    wait = 1.05 - (time.time() - _last[0])
    if wait > 0:
        time.sleep(wait)
    url = f'{SERVER}{a[1]:.6f},{a[0]:.6f};{b[1]:.6f},{b[0]:.6f}?overview=full&geometries=geojson'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                _last[0] = time.time()
                return json.load(r)
        except Exception as e:  # network hiccup: back off and retry
            _last[0] = time.time()
            print(f'  retry {attempt + 1}: {e}', file=sys.stderr)
            time.sleep(3 * (attempt + 1))
    return None


def main():
    walks = json.load(open(WALKS))
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    out, n_path, n_straight, n_same = {}, 0, 0, 0
    for w in walks:
        legs = []
        for s0, s1 in zip(w['stops'], w['stops'][1:]):
            a, b = (s0['lat'], s0['lng']), (s1['lat'], s1['lng'])
            straight = dist(a, b)
            leg = {'from': s0['id'], 'to': s1['id'], 'a': [round(a[0], 6), round(a[1], 6)], 'b': [round(b[0], 6), round(b[1], 6)]}
            if straight < 15:
                leg.update(m=round(straight), kind='same')  # same spot, nothing to draw
                n_same += 1
                legs.append(leg)
                continue
            k = key(a, b)
            if k not in cache:
                print(f'{w["id"]} {s0["id"]} -> {s1["id"]}', file=sys.stderr)
                cache[k] = fetch(a, b)
                json.dump(cache, open(CACHE, 'w'))
            res = cache[k]
            ok = res and res.get('code') == 'Ok' and res.get('routes')
            if ok:
                r = res['routes'][0]
                snaps = [wp.get('distance', 0) for wp in res.get('waypoints', [])]
                path = [[c[1], c[0]] for c in r['geometry']['coordinates']]
                good = max(snaps or [0]) <= SNAP_MAX_M and r['distance'] <= straight * DETOUR_MAX + DETOUR_SLACK_M
            else:
                good = False
            if good:
                path = [list(a)] + path + [list(b)]  # join the line to the pins themselves
                path = simplify(path, SIMPLIFY_M)
                leg.update(m=round(r['distance'] + max(snaps)), kind='path', path=[[round(p[0], 6), round(p[1], 6)] for p in path])
                n_path += 1
            else:
                leg.update(m=round(straight), kind='straight')
                n_straight += 1
            legs.append(leg)
        out[w['id']] = legs
    json.dump(out, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'routes.json: {n_path} walking paths, {n_straight} straight fallbacks, {n_same} same-spot legs', file=sys.stderr)


if __name__ == '__main__':
    main()
