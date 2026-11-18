"""Check the app's color pairs against WCAG 2 contrast minimums, in light and dark mode.

Run: python3 -I scripts/check_contrast.py
Text needs 4.5:1; icons and other non-text marks need 3:1 (WCAG 1.4.3 and 1.4.11).
Reads hex colors straight from src/theme.ts so it stays in sync with the theme.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = (ROOT / 'src/theme.ts').read_text()


def block(name):
    body = re.search(r'export const %s: Theme = \{(.*?)\n\};' % name, SRC, re.S).group(1)
    pal = dict(re.findall(r"(\w+): '(#[0-9A-Fa-f]{6})'", re.search(r'const palette = \{(.*?)\};', SRC, re.S).group(1)))
    out = {}
    for k, v in re.findall(r'^\s+(\w+): ([^,\n]+),', body, re.M):
        v = v.strip()
        if v.startswith("'#"):
            out[k] = v.strip("'")
        elif v.startswith('palette.'):
            out[k] = pal[v.split('.')[1]]
    return out


def lum(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def ratio(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True)
    return (x + 0.05) / (y + 0.05)


INK = '#1D2B2E'

# (foreground, background, minimum, what it is)
PAIRS = [
    ('text', 'bg', 4.5, 'body text'),
    ('text', 'card', 4.5, 'text on cards'),
    ('textMuted', 'bg', 4.5, 'secondary text'),
    ('textMuted', 'card', 4.5, 'secondary text on cards'),
    ('textMuted', 'cardAlt', 4.5, 'secondary text on chips'),
    ('primaryText', 'primary', 4.5, 'primary buttons, walk bar'),
    ('accentText', 'accent', 4.5, 'unlock buttons, continue card'),
    ('accentTextMuted', 'accent', 4.5, 'unlock subtitle'),
    ('leafText', 'leaf', 4.5, 'nearby card, done badges'),
    ('danger', 'bg', 4.5, 'Delete account'),
    ('danger', 'card', 4.5, 'Delete account on cards'),
    ('primary', 'bg', 3.0, 'icons, links'),
    ('accent', 'card', 3.0, 'tab bar active icon'),
    ('goldInk', 'bg', 3.0, 'info and bus icons'),
    ('goldInk', 'cardAlt', 3.0, 'gift icon on chips'),
]


def main():
    fails = 0
    for mode in ('lightTheme', 'darkTheme'):
        t = block(mode)
        for fg, bg, need, what in PAIRS:
            r = ratio(t[fg], t[bg])
            ok = r >= need
            fails += not ok
            print('%-5s %-10s %-16s on %-8s %5.2f (need %.1f) %s' % ('ok' if ok else 'FAIL', mode[:-5], fg, bg, r, need, what))
        r = ratio('#FFFFFF', t['lockedFill'])
        fails += r < 4.5
        print('%-5s %-10s white on lockedFill %5.2f (need 4.5) locked stop numbers' % ('ok' if r >= 4.5 else 'FAIL', mode[:-5], r))
    # Walk badge colors: readableOn() picks white or ink, whichever is higher. Badge numbers are bold,
    # so 3:1 is the floor; under 4.5:1 is printed as a warning (walk colors are a design choice for Nick).
    walks = json.loads((ROOT / 'src/data/walks.json').read_text())
    walks = walks if isinstance(walks, list) else walks.get('walks', walks)
    for w in walks:
        best = max(ratio('#FFFFFF', w['color']), ratio(INK, w['color']))
        tag = 'ok' if best >= 4.5 else 'warn' if best >= 3.0 else 'FAIL'
        fails += tag == 'FAIL'
        print('%-5s walk %-4s %s number badge %5.2f (aim 4.5, floor 3.0)' % (tag, w['id'], w['color'], best))
    print('\n%d failing pair(s)' % fails)
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
