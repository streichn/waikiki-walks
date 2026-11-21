"""Check the app's pins against Veneeta's maps (Nick's rule, 17 Nov 2026).

Read-only. Run after build.py and scripts/build_data.py:

    python3 -I scripts/georef/audit_pins.py            # writes docs/PIN_AUDIT.md
    python3 -I scripts/georef/audit_pins.py --strict   # also exits 1 if a rule is broken

What it checks, per walk:
1. Rule: a stop has a pin ("book" geo) only if one of her map pages prints its number.
   A pinned stop with no printed number anywhere is a rule break.
2. Every number her maps print belongs to a stop in the app (catches numbers read wrongly off a map).
3. The pin, drawn back onto her map with the app's own transform (the same math as src/lib/bookmap.ts),
   lands on her printed number. A gap means the data is stale or a fit drifted. Stops the author
   asked to move (pin_overrides.json) are listed with her reason instead of being flagged.
4. Pin order: each pin's distance to the next, so a pin far out of line with its neighbours stands out.
"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
MAPS = json.load(open(os.path.join(ROOT, 'src/data/bookmaps.json')))
WALKS = json.load(open(os.path.join(ROOT, 'src/data/walks.json')))
WALKS = WALKS if isinstance(WALKS, list) else WALKS['walks']
_ov = json.load(open(os.path.join(HERE, 'pin_overrides.json')))
OVERRIDES = {k: v for k, v in _ov.items() if not k.startswith('_')}

# Numbers read off the book's own map pages (before the cartographer's maps replaced them in the app).
BOOK_PAGES = {}
for _f in ('map_stops.json', 'map_stops_extra.json', 'map_stops_photo.json'):
    _p = os.path.join(HERE, _f)
    if os.path.exists(_p):
        for _k, _v in json.load(open(_p)).items():
            if not _k.startswith('_'):
                BOOK_PAGES.setdefault(_k.split(':')[0], set()).update(_v)

GAP_PX = 6      # a pin drawn more than this many map pixels from her number is flagged
JUMP_M = 900    # consecutive pins further apart than this are listed for a look


def to_px(m, page, lat, lng):
    """Same as bookXY() in src/lib/bookmap.ts, in pixels."""
    x = (lng - m['origin'][1]) * m['k'][0] / m['scale']
    y = (lat - m['origin'][0]) * m['k'][1] / m['scale']
    f = page['fwd']
    px = f['a'][0][0] + x * f['a'][1][0] + y * f['a'][2][0]
    py = f['a'][0][1] + x * f['a'][1][1] + y * f['a'][2][1]
    for c, w in zip(f['ctrl'], f['w']):
        d = math.hypot(x - c[0], y - c[1])
        if d > 0:
            u = d * d * math.log(d)
            px += u * w[0]; py += u * w[1]
    return px, py


def metres(a, b):
    k = math.pi / 180
    x = (b[1] - a[1]) * k * math.cos((a[0] + b[0]) / 2 * k); y = (b[0] - a[0]) * k
    return 6371000 * math.hypot(x, y)


def audit():
    lines, breaks = [], 0
    totals = {'pinned': 0, 'printed': 0, 'override': 0, 'gap': 0, 'bookonly': 0, 'same': 0}
    for w in WALKS:
        wid = w['id'] if '-' not in w['id'] else w['id'].split('-')[0]
        m = MAPS.get(wid)
        pages = [m] + m.get('pages', []) if m else []
        printed = {}
        for i, p in enumerate(pages):
            for n, xy in (p.get('labels') or {}).items():
                printed.setdefault(n, (i, p, xy))
        ov = OVERRIDES.get(wid, {})
        rows, notes = [], []
        pinned = [s for s in w['stops'] if s.get('geo') == 'book' and s.get('lat') is not None]
        nums = {str(s['n']) for s in w['stops']}
        for s in pinned:
            n = str(s['n']); totals['pinned'] += 1
            if n not in printed and n in BOOK_PAGES.get(wid, set()):
                why = ov.get(n, {}).get('why', '') if isinstance(ov.get(n), dict) else ''
                notes.append(f"- Stop {n}: printed on the book's map page but not on the cartographer's map, so the app's book map has no number to tap. Pin kept from the book page. {why}")
                totals['bookonly'] += 1
                continue
            if n not in printed:
                breaks += 1
                rows.append(f"| {n} | **no printed number on any map page** | rule break: remove the pin or find her number |")
                continue
            i, p, (lx, ly) = printed[n]
            px, py = to_px(m, p, s['lat'], s['lng'])
            gap = math.hypot(px - lx, py - ly)
            if n in ov:
                totals['override'] += 1
                why = ov[n].get('why', '') if isinstance(ov[n], dict) else 'author-chosen pixel'
                notes.append(f"- Stop {n}: moved {gap:.0f} px from her number on purpose. {why}")
            elif gap > GAP_PX:
                totals['gap'] += 1
                rows.append(f"| {n} | {gap:.0f} px from her number on {p['file']} | check: data may be stale, rerun build.py and build_data.py |")
        for n in sorted(set(printed) - nums, key=lambda x: (len(x), x)):
            rows.append(f"| {n} | printed on {printed[n][1]['file']} but no such stop in the app | check the number read off the map |")
        unpinned = [str(s['n']) for s in w['stops'] if s.get('geo') != 'book']
        totals['printed'] += len(printed)
        same = {}
        for s in pinned:
            same.setdefault((round(s['lat'], 5), round(s['lng'], 5)), []).append(str(s['n']))
        for group in (g for g in same.values() if len(g) > 1):
            totals['same'] += 1
            notes.append(f"- Stops {' and '.join(group)} share one pin spot: the two pins overlap, and both arrival alerts can come at the same moment.")
        jumps = []
        for a, b in zip(pinned, pinned[1:]):
            d = metres((a['lat'], a['lng']), (b['lat'], b['lng']))
            if d > JUMP_M:
                jumps.append(f"{a['n']} to {b['n']}: {d:.0f} m")
        lines.append(f"## Walk {wid}\n")
        lines.append(f"{len(w['stops'])} stops, {len(pinned)} pinned, {len(printed)} numbers printed on "
                     f"{len(pages)} map page{'s' if len(pages) != 1 else ''} ({', '.join(p['file'] for p in pages) or 'none'}).\n")
        if unpinned:
            lines.append(f"Without a pin (not printed on her maps): {', '.join(unpinned)}.\n")
        if rows:
            lines.append("| Stop | Finding | What to do |\n|---|---|---|")
            lines.extend(rows); lines.append('')
        else:
            lines.append("Every pin sits on her printed number, and every printed number has a stop.\n")
        if notes:
            lines.append("Notes:\n"); lines.extend(notes); lines.append('')
        if jumps:
            lines.append(f"Long gaps between consecutive pins (over {JUMP_M} m), worth a glance on the map: {'; '.join(jumps)}.\n")
    head = ["# Pin audit", "",
            "Generated by `python3 -I scripts/georef/audit_pins.py`. Do not edit by hand.", "",
            "Nick's rule (17 Nov 2026): a stop gets a pin, an arrival alert and a distance only if one of "
            "Veneeta's map pages prints its number, and the pin sits on that number unless she asked for it to move.", "",
            f"Summary: {totals['pinned']} pins, {totals['printed']} printed numbers, "
            f"{totals['override']} moved at the author's request, {totals['bookonly']} printed only on the book's own page, "
            f"{totals['same']} shared pin spots, {totals['gap']} off her number, {breaks} rule breaks.", ""]
    return '\n'.join(head + lines) + '\n', breaks + totals['gap']


if __name__ == '__main__':
    text, problems = audit()
    out = os.path.join(ROOT, 'docs/PIN_AUDIT.md')
    open(out, 'w').write(text)
    print(text.splitlines()[6])
    if '--strict' in sys.argv and problems:
        sys.exit(1)
