"""Builds the app's data files from the parsed book.

Inputs: scripts/extract/geo.json (stops with coordinates), assets/book/*.jpg (photos), book/*.pdf (map pages)
Outputs: src/data/walks.json, facts.json, glossary.json, about.json, images.ts, assets/book/*.jpg,
         and review/stops_review.csv for Veneeta to check every pin.
"""
from PIL import Image
import csv, glob, json, os, re, shutil, statistics, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOK = os.environ.get('BOOK_DIR', f'{ROOT}/book')
SRC = json.load(open(os.environ.get('GEO_JSON', f'{ROOT}/scripts/extract/geo.json')))
IMG_DIR = os.environ.get('IMG_DIR', f'{ROOT}/assets/book')
OUT = f'{ROOT}/src/data'
ASSETS = f'{ROOT}/assets/book'
os.makedirs(ASSETS, exist_ok=True)
os.makedirs(f'{ROOT}/review', exist_ok=True)

TITLES = {
    'I': ('Ala Wai Canal', 'Once upon a time there were three streams'),
    'II': ('Kālia', 'Early Hawaiian life: taro fields and fish ponds'),
    'III': ('Helumoa', 'Residence and recreation of the early royals'),
    'IV': ('Kalākaua Avenue', 'King Kalākaua welcomes you to his “Great Street”'),
    'V': ('‘Āinahau and Hamohamo', 'Princess Ka‘iulani welcomes you to her ‘āina'),
    'VI': ('Kāneloa', 'Queen Kapi‘olani welcomes you to her park!'),
    'VII': ('Kapua', 'Diamond Head greets all visitors to Waikīkī!'),
    'VIII': ('Kaimukī', 'Walk into a crater and the pu‘u'),
    'IX': ('Mō‘ili‘ili', 'Watch out for the mo‘o, the giant lizard!'),
    'X': ('Mānoa Valley', 'Chasing rainbows!'),
    'XI': ('University of Hawai‘i', 'The main campus in Mānoa'),
    'XII': ('Lower Campus', 'The Hawaiian center at Kānewai and the old quarry'),
}
COLORS = ['#0E6E74', '#3A7D44', '#B5446E', '#D1495B', '#8E5572', '#2E86AB', '#E07A5F', '#6A4C93', '#4F772D', '#1B998B', '#C1666B', '#5C6F68']
MAP_PAGES = {'I': (1, 22), 'II': (1, 40), 'III': (1, 58), 'IV': (1, 72), 'V': (2, 1), 'VI': (2, 17), 'VII': (2, 29), 'VIII': (2, 49), 'IX': (2, 65), 'X': (3, 4), 'XI': (3, 37), 'XII': (3, 61)}
# Lengths and times as printed in each walk's information box.
FACTS = {
    'I': {'distance': '3 mi round trip', 'duration': '1.5 hr', 'steps': '6,000'},
    'II': {'distance': '2.5 to 3 mi', 'duration': '2 to 2.5 hr', 'steps': '7,000 to 10,000'},
    'III': {'distance': '1 mi', 'duration': '0.5 to 2 hr', 'steps': '2,000 to 4,000'},
    'IV': {'distance': '2 mi', 'duration': '45 min to 1 hr', 'steps': '6,000'},
    'V': {'distance': '2 mi', 'duration': '1 hr', 'steps': '6,000'},
    'VI': {'duration': 'Wander at your own pace'},
    'VII': {'distance': '2 mi one way', 'duration': '1.5 hr', 'steps': '7,000'},
    'IX': {'distance': '2.5 mi', 'duration': '2 hr', 'steps': '6,000'},
    'XII': {'distance': '3 mi', 'duration': '2 hr', 'steps': '5,000'},
}
# Whole stops that are purple-line side trips on her map, off the main red route (Veneeta, 19 Nov 2026).
SIDE_STOPS = {'II': {13}}
# Word-level corrections from the author's own marked-up copy of the book.
TEXT_FIXES = {'I-36': [('kahuna nui', 'kuhina nui', "Veneeta's printed copy, page 16, corrected by hand (photo 19 Nov 2026)")],
              'II-16': [('Afong and the Chinese in Hawai‘i.', 'Afong and the Chinese in Hawai‘i. Bob Magoon, who we “met” at stop 7, was the great-grandson of Chun Afong!',
                         "Veneeta's addition by email, 21 Nov 2026: end of the paragraph that starts 'In the late-1800s'")],
              'II-04': [('Sandalewood', 'Sandalwood', "the book hyphenates 'Sandale- wood' across a line; joining it left a stray e")]}
# Typos in the printed book that Veneeta confirmed by email, 22 Nov 2026 ("typos..."), applied everywhere
# (stop text, titles, photo captions, facts). Each must still be found, or the build stops.
BOOK_CORRECTIONS = [('Makiki Sream', 'Makiki Stream'), ('Chung Afong', 'Chun Afong'), ('Planation style', 'Plantation style'),
                    ('Lili‘uokanlani', 'Lili‘uokalani'), ('McCulley', 'McCully'), ('Kauwla‘a', 'Kauwala‘a'),
                    ('Backman Hall', 'Bachman Hall'), ('Kana‘ina Stret', 'Kana‘ina Street'), ('Sherriff Center', 'Sheriff Center'),
                    ('Archeology of O‘ahu', 'Archaeology of O‘ahu')]
BOOK_CORRECTIONS_USED = set()


def book_fix(o):
    if isinstance(o, str):
        for a, b in BOOK_CORRECTIONS:
            if a in o:
                BOOK_CORRECTIONS_USED.add(a)
                o = o.replace(a, b)
        return o
    if isinstance(o, list):
        return [book_fix(x) for x in o]
    if isinstance(o, dict):
        return {k: book_fix(v) for k, v in o.items()}
    return o


# Typos and extraction slips checked against the printed page (scripts/extract/text_fixes.json).
if os.path.exists(f'{ROOT}/scripts/extract/text_fixes.json'):
    for _sid, _fx in json.load(open(f'{ROOT}/scripts/extract/text_fixes.json')).items():
        if not _sid.startswith('_'):
            TEXT_FIXES.setdefault(_sid, []).extend((f['from'], f['to'], f['why']) for f in _fx)
# Book pictures that are not photos once the page text is removed (scripts/extract/rerender_images.py).
PHOTO_DROP = set(json.load(open(f'{ROOT}/scripts/extract/photo_fixes.json'))['drop']) if os.path.exists(f'{ROOT}/scripts/extract/photo_fixes.json') else set()
# Each walk's information box with the book's own paragraphs and labels (scripts/extract/info_boxes.py).
INFO_BOXES = json.load(open(f'{ROOT}/scripts/extract/info_boxes.json')) if os.path.exists(f'{ROOT}/scripts/extract/info_boxes.json') else {}
CARRY = {}  # blocks the parser put under the wrong walk, keyed by the walk they belong to
# A stop whose tail is really the next walk's opening: cut at 'at' and move the rest to that walk's intro.
TAIL_CUTS = {'I-38': {'at': 'This walk covers part of a much larger district once known as K', 'carry_to': 'II', 'keep': 1, 'strip': ' Kahanamoku St.',
                      # Book page 17 is missing from the PDF; text transcribed from Veneeta's photo of it (19 Nov 2026).
                      'continue': 'plant throughout the Pacific, brought to Hawai‘i by the early Polynesians. There is also a Coconut Avenue at the foot of Lē‘ahi. There are no coconut trees native to Hawai‘i; they were brought by the early Polynesians, and, therefore, referred to as a canoe plant. Be sure to eat some coconut! If you are adventurous, try the local dessert of coconut, haupia – it has the consistency of jello, but is much more delicious!',
                      'append': [{'kind': 'p', 'text': 'The only Palm tree that is native to Hawai‘i-only is the Loulu Palm.'},
                                 {'kind': 'direction', 'text': 'You are back at McCully Street and have reached the end of your tour around the Ala Wai Canal!'},
                                 {'kind': 'p', 'text': 'The canal continues for another ¼ mile to the Ala Wai Harbor, which you can follow in Kālia, Walk II.'},
                                 {'kind': 'info', 'text': 'Bus routes and times www.thebus.org or call 808-848-5555 - option 2 for a live operator.'}],
                      '_why': 'Veneeta 19 Nov 2026: Kalia text at the end of Walk I belongs to Walk II (book p40)'}}
STOP_FIXES = json.load(open(f'{ROOT}/scripts/extract/stop_fixes.json')) if os.path.exists(f'{ROOT}/scripts/extract/stop_fixes.json') else {}
BOOK_PINS = json.load(open(f'{ROOT}/scripts/extract/book_pins.json')) if os.path.exists(f'{ROOT}/scripts/extract/book_pins.json') else {}
OVERLAY = json.load(open(f'{ROOT}/scripts/extract/overlay.json')) if os.path.exists(f'{ROOT}/scripts/extract/overlay.json') else {}
HAWAII = re.compile(r'[āēīōūĀĒĪŌŪ‘ʻ]')


def walk_facts(info_texts):
    blob = ' '.join(info_texts)
    f = {}
    m = re.search(r'(\d+(?:\.\d+)?)\s*miles?', blob)
    if m: f['distance'] = f"{m.group(1)} mi"
    m = re.search(r'(\d+(?:\.\d+)?\s*(?:to\s*\d+(?:\.\d+)?\s*)?hours?|\d+\s*minutes(?:\s*to\s*\d+\s*hours?)?)', blob)
    if m: f['duration'] = m.group(1).replace('hour', 'hr').replace('minutes', 'min')
    m = re.search(r'([\d,]+)\s*steps', blob)
    if m: f['steps'] = m.group(1)
    return f


def clean_blocks(blocks):
    out = []
    for b in blocks or []:
        txt = b['text'].strip()
        # The PDF puts a space before punctuation after some words, mostly ones with a kahakō or ‘okina ("Waikīkī .").
        txt = re.sub(r'(?<=[^\s(]) +([.,;:])(?=\s|$)', r'\1', txt)
        if len(txt) < 2 or re.fullmatch(r'[\d\s.]+', txt):
            continue
        toks = txt.split(' ')
        if len(toks) > 6 and sum(len(x) == 1 for x in toks) / len(toks) > 0.6:
            continue  # letter-spaced decorative subtitle; the walk theme already says it
        out.append({'kind': b['kind'], 'text': txt})
    return out


SENT_END = re.compile(r'[.!?:”"’)\]]\s*$')
PREP_END = re.compile(r'\b(along|to|the|of|and|at|on|in|for|a|or|by|from|is|are|named|means|obviously)\s*$', re.I)


def join_text(a, b):
    a = a.rstrip()
    if a.endswith('-') and b[:1].islower():
        return a[:-1] + b
    return a + ' ' + b


def repair_blocks(blocks):
    """The parser cuts a paragraph where the book's bold lead-in line ends, so a bold first line
    ("Cross Date Street at Lā‘au Street. On the") becomes its own block and the sentence continues
    in the next one. Keep the complete bold sentences as the direction and rejoin the rest.
    Short bold lines with no sentence ending are sub-headings in the book, not directions."""
    out = []
    i = 0
    while i < len(blocks):
        b = dict(blocks[i])
        nxt = blocks[i + 1] if i + 1 < len(blocks) else None
        if (b['kind'] == 'direction' and nxt and nxt['kind'] == 'p' and not SENT_END.search(b['text'])
                and (nxt['text'][:1].islower() or b['text'].rstrip().endswith(('-', ',')))):
            t = b['text']
            cut = max((m.end() for m in re.finditer(r'[.!?]["”’)]?\s+(?=[A-Z‘“])', t)), default=0)
            if cut:
                out.append({'kind': 'direction', 'text': t[:cut].strip()})
                rest = t[cut:].strip()
            else:
                rest = t
            out.append({'kind': 'p', 'text': join_text(rest, nxt['text'])})
            i += 2
            continue
        t = b['text']
        if (b['kind'] == 'direction' and len(t) < 45 and not SENT_END.search(t) and not PREP_END.search(t)
                and not t.endswith(',') and (t[:1].isupper() or t[:1].isdigit() or t[:1] in '‘“')
                and 'www' not in t and '.com' not in t and not t.startswith('•')):
            b['kind'] = 'heading'
        out.append(b)
        i += 1
    return out


def _cap(t):
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'(\w)- ([a-z])', r'\1\2', t)  # undo line-end hyphenation
    return t


CAPTIONS = sorted({_cap(c['text']) for c in json.load(open(f'{ROOT}/scripts/extract/captions.json'))}, key=len, reverse=True) if os.path.exists(f'{ROOT}/scripts/extract/captions.json') else []


def pull_captions(blocks):
    """Photo captions in the book sit beside the photos in small Arial type. The PDF parser sometimes
    reads them as body text, even in the middle of a sentence. Move each one out into a caption block."""
    out = []
    for b in blocks:
        if b['kind'] not in ('p', 'direction'):
            out.append(b)
            continue
        t, found = re.sub(r'\s+', ' ', b['text']).strip(), []
        for c in CAPTIONS:
            if len(c) >= 12 and c in t:
                t = re.sub(r'\s+', ' ', t.replace(c, ' ')).strip()
                found.append(c)
        if re.fullmatch(r'\((Hawai‘i State|University) Archives\)', t):
            found.append(t)
            t = ''
        if t and not re.fullmatch(r'[\W\d]*', t):
            prev = next((o for o in reversed(out) if o['kind'] in ('p', 'direction')), None)
            if found and prev and t[:1].islower() and not SENT_END.search(prev['text']):
                prev['text'] = join_text(prev['text'], t)  # a caption had split this sentence
            else:
                out.append({**b, 'text': t})
        out.extend({'kind': 'caption', 'text': re.sub(r'^Caption:\s*', '', c)} for c in found)
    return out


MAP_MARK = re.compile(r'\b(Mauka Makai|Map Key|BEGIN WALK)\b|ʻEwa Diamond Head|‘Ewa Diamond Head')
STREET_LABEL = re.compile(r'^[\w‘’ʻ\'.\- ]{0,60}\b(Ave|St|Rd|Blvd|Dr|Pl)\.$')


def is_map_junk(t):
    """Text lifted off the book's map pages: street labels, stop numbers, compass words."""
    toks = t.split()
    if not toks:
        return True
    if re.search(r'(?:(?<!\S)\.?\w\.?\s+){5,}', t + ' '):
        return True  # rotated street labels come out as runs of scattered letters
    if re.search(r'\b(St|Ave|Rd|Blvd|Dr|Pl|Ln)\.', t) and sum(1 for x in toks if len(x) <= 2) / len(toks) > 0.45:
        return True
    return bool(STREET_LABEL.match(t)) and not re.search(r'\b(the|is|was|of|to|and)\b', t)


def drop_map_text(blocks):
    out = []
    for b in blocks:
        t = b['text']
        if b['kind'] in ('p', 'direction', 'heading', 'tagline'):
            if MAP_MARK.search(t):
                # Keep a real sentence printed on the map page (a map note), drop the labels.
                m = re.search(r'([A-Z‘][^.!?]{30,}[.!?]?)\s*$', t)
                tail = m.group(1).strip() if m else ''
                if tail and not MAP_MARK.search(tail) and not is_map_junk(tail):
                    out.append({**b, 'text': tail})
                continue
            if is_map_junk(t):
                continue
        out.append(b)
    return out


def join_page_breaks(blocks):
    """A sentence cut at the bottom of a column ("...413 Seaside Avenue, with the") continues in the
    next text block, sometimes with a photo caption in between. Rejoin it and keep the caption after."""
    out = []
    i = 0
    while i < len(blocks):
        b = dict(blocks[i])
        if b['kind'] in ('p', 'direction') and PREP_END.search(b['text']) and not SENT_END.search(b['text']):
            j = i + 1
            caps = []
            while j < len(blocks) and blocks[j]['kind'] == 'caption':
                caps.append(blocks[j]); j += 1
            if j < len(blocks) and blocks[j]['kind'] in ('p', 'direction') and not re.match(r'^(\d+[A-D]?\s|•)', blocks[j]['text']):
                b['text'] = join_text(b['text'], blocks[j]['text'])
                out.append(b)
                out.extend(caps)
                i = j + 1
                continue
        out.append(b)
        i += 1
    return out


ASIDE_START = re.compile(r'purple line|side trip|side stroll|detour', re.I)
ASIDE_END = re.compile(r'^(Return|Come back|Back |Continue|Walk back|From here|From this point)')
# Lettered sub-stops (13A, 36B, 21A) are the places on a side trip.
LETTERED = re.compile(r'^\d+[A-D]\s')


def mark_asides(blocks):
    """The book sends walkers off the main route on purple-line side trips. Mark the side-trip text
    so the app can show it as a highlighted box beside the main walk."""
    out = [dict(b) for b in blocks]
    i = 0
    while i < len(out):
        b = out[i]
        if b['kind'] in ('p', 'direction') and ASIDE_START.search(b['text'][:140]):
            b['aside'] = True
            n = 0
            j = i + 1
            while j < len(out) and n < 6:
                nb = out[j]
                if nb['kind'] == 'caption':
                    j += 1; continue
                if nb['kind'] == 'direction' and ASIDE_END.match(nb['text']):
                    break
                if nb['kind'] in ('heading', 'tagline') and not re.match(r'^\d+[A-D]\b', nb['text']):
                    break
                if nb['kind'] not in ('p', 'direction', 'heading'):
                    break
                if re.match(r'^If you would (rather|like to walk along)', nb['text']):  # the book offering the main route instead
                    break
                # Only bullets, "Name:" items, sub-stops and short follow-ons stay in the box.
                if not (nb['text'].startswith('•') or re.match(r'^[A-Z0-9‘][\w‘’ʻ .\-]{1,40}:', nb['text'])
                        or re.match(r'^\d+[A-D]\b', nb['text']) or n == 0):
                    break
                nb['aside'] = True
                n += 1
                j += 1
            i = j
            continue
        i += 1
    # Second pass: a lettered sub-stop opens or belongs to a side trip (Veneeta, 19 Nov 2026: "Stop 13 is
    # actually a side trip, a purple line, 13A through 13D"). It runs through the side-trip box that follows it;
    # with no box after it, it runs until the book returns to the main route or the stop ends.
    i = 0
    while i < len(out):
        b = out[i]
        if b['kind'] in ('heading', 'direction', 'p') and LETTERED.match(b['text']):
            if b['kind'] == 'direction' and len(b['text']) < 90 and not b['text'].rstrip().endswith('.'):
                b['kind'] = 'heading'
            b['aside'] = True
            j = i + 1
            if j < len(out) and out[j].get('aside'):
                while j < len(out) and (out[j].get('aside') or out[j]['kind'] == 'caption'):
                    j += 1
            else:
                while j < len(out) and not (out[j]['kind'] == 'direction' and ASIDE_END.match(out[j]['text'])):
                    out[j]['aside'] = True
                    j += 1
            i = j
            continue
        i += 1
    return out


HEADING_FIXES = json.load(open(f'{ROOT}/scripts/extract/heading_fixes.json')) if os.path.exists(f'{ROOT}/scripts/extract/heading_fixes.json') else {}


def apply_heading_fix(sid, title, sub, blocks):
    fx = HEADING_FIXES.get(sid)
    if not fx:
        return title, sub, blocks
    title = fx.get('title', title)
    sub = fx['subtitle'] if 'subtitle' in fx else sub
    if fx.get('first_prefix') and blocks:
        blocks = [{**blocks[0], 'text': fx['first_prefix'] + blocks[0]['text']}] + blocks[1:]
    if fx.get('drop_first'):
        blocks = blocks[1:]
    blocks = list(fx.get('prepend', [])) + blocks  # in the order listed
    for ins in fx.get('insert', []):
        k = next((j for j, bb in enumerate(blocks) if bb['text'].startswith(ins['before'])), None)
        if k is not None:
            blocks = blocks[:k] + [{'kind': ins['kind'], 'text': ins['text']}] + blocks[k:]
    return title, sub, blocks


WALK_ENDS = json.load(open(f'{ROOT}/scripts/extract/walk_ends.json')) if os.path.exists(f'{ROOT}/scripts/extract/walk_ends.json') else {}
LETTER_SPACED = re.compile(r'^(?:\S ){6,}(?=\S{2,})')  # a decorative letter-spaced walk subtitle at the start of an info box


def _page_key(p):
    m = re.match(r'p(\d+)-(\d+)', p or '')
    return (int(m.group(1)), int(m.group(2))) if m else (0, 0)


def _find(blocks, marker, start=0):
    return next((i for i in range(start, len(blocks)) if blocks[i].get('text', '').startswith(marker)), None)


def apply_walk_ends(src):
    """Give each walk back the opening text, photos and stop 1 that the parser filed under the previous walk's last
    stop (scripts/extract/walk_ends.json), drop the map labels in between, and drop the back matter after Walk XII."""
    ws = src['walks']
    for w in ws:
        drop = WALK_ENDS.get(w['roman'], {}).get('intro_drop')
        intro = w.get('blocks') or []
        if drop:
            a = _find(intro, drop[0])
            b = _find(intro, drop[1], a or 0)
            if a is not None and b is not None:
                del intro[a:b + 1]
            else:
                print('walk_ends: intro_drop not found', w['roman'], file=sys.stderr)
    # The next walk's stop 1, printed on its title page, arrives as a stray stop 1 after this walk's last stop.
    strays = {}
    for k, w in enumerate(ws[:-1]):
        st = w['stops']
        if w['roman'] in WALK_ENDS and len(st) > 1 and st[-1]['n'] < st[-2]['n']:
            strays[k] = st.pop()
    for k, w in enumerate(ws):
        cfg = WALK_ENDS.get(w['roman'])
        if not cfg:
            continue
        nxt = ws[k + 1] if k + 1 < len(ws) else None
        stray = strays.get(k)
        last = w['stops'][-1]
        blocks = last.get('blocks') or []
        cut = _find(blocks, cfg['drop_from'])
        if cut is None:
            # The marker can sit at the end of a photo caption; split the block there.
            j = next((i for i, b in enumerate(blocks) if ' ' + cfg['drop_from'] in b.get('text', '')), None)
            if j is not None:
                head, tail = blocks[j]['text'].split(' ' + cfg['drop_from'], 1)
                blocks[j:j + 1] = [{**blocks[j], 'text': head}, {**blocks[j], 'text': cfg['drop_from'] + tail}]
                cut = j + 1
        if cut is None:
            print('walk_ends: drop_from not found', w['roman'], file=sys.stderr)
            continue
        mv = _find(blocks, cfg['move_from'], cut) if cfg.get('move_from') else None
        if cfg.get('move_from') and mv is None:
            print('walk_ends: move_from not found', w['roman'], file=sys.stderr)
        moved = blocks[mv:] if mv is not None else []
        last['blocks'] = blocks[:cut]
        lim = _page_key(cfg['page_from'])
        later = [im for im in last.get('images', []) if _page_key(im['page']) >= lim]
        last['images'] = [im for im in last.get('images', []) if _page_key(im['page']) < lim]
        if nxt is None:
            continue  # Walk XII: the rest is the book's back matter
        nxt_intro = nxt.get('blocks') or []
        if stray is None and nxt['stops'] and nxt['stops'][0]['n'] == 1:
            # Photos on the next walk's title page go with its stop 1, with their captions from the dropped part.
            caps = [b for b in blocks[cut:mv if mv is not None else len(blocks)] if _cap(b['text']) in CAPTIONS]
            s1 = nxt['stops'][0]
            s1['images'] = later + (s1.get('images') or [])
            s1['blocks'] = [{'kind': 'caption', 'text': _cap(b['text'])} for b in caps] + (s1.get('blocks') or [])
            later = []
        nxt['images'] = later + nxt.get('images', [])
        if stray is not None and not any(s['n'] == stray['n'] for s in nxt['stops']):
            # Everything after the next walk's title until its next stop heading continues that stop 1;
            # the sidebar boxes (walk length, parking, buses) stay with the walk.
            head = [dict(b) for b in stray.get('blocks') or []]
            rest = [b for b in nxt_intro if b['kind'] != 'info']
            if head and rest and not SENT_END.search(head[-1]['text']):
                # The sentence runs on from the title page to the next page ("...is perfect. McCully | Street is named").
                head[-1]['text'] = join_text(head[-1]['text'], rest[0]['text'])
                nxt_intro = [b for b in nxt_intro if b is not rest[0]]
            body = head + nxt_intro
            stray['blocks'] = [b for b in body if b['kind'] != 'info']
            nxt_intro = [b for b in body if b['kind'] == 'info']
            stray['images'] = (stray.get('images') or []) + nxt.get('images', [])
            nxt['images'] = []
            nxt['stops'].insert(0, stray)
            # Its stop_fixes entry rebuilt this stop from the introduction; the whole stop is now here.
            STOP_FIXES[nxt['roman']] = [fx for fx in STOP_FIXES.get(nxt['roman'], []) if fx['n'] != stray['n']]
        nxt['blocks'] = moved + nxt_intro
    for w in ws:
        for b in w.get('blocks') or []:
            if b['kind'] == 'info':
                b['text'] = LETTER_SPACED.sub('', b['text'])


apply_walk_ends(SRC)

images_used = set()
walks = []
review = []
for k, w in enumerate(SRC['walks']):
    wid = w['roman']
    title, theme = TITLES[wid]
    intro_blocks = clean_blocks(w.get('blocks'))
    info = [b['text'] for b in intro_blocks if b['kind'] == 'info' and len(b['text']) > 20]
    intro = [b for b in drop_map_text(pull_captions(intro_blocks)) if b['kind'] not in ('info', 'caption')]
    intro = clean_blocks(CARRY.pop(wid, [])) + intro
    stops_in = w['stops']
    # Drop duplicate numbers that are cross-references (keep first occurrence in order).
    seen, stops_src = set(), []
    for s in stops_in:
        if s['n'] in seen:
            continue
        seen.add(s['n'])
        stops_src.append(s)

    # Some stop headings ("21 ‘Āpuakēhau Stream") were read as a line inside the previous stop.
    # Split them back out into their own stops, carrying the text that follows.
    split = []
    for s in stops_src:
        have = {x['n'] for x in stops_src}
        cur = dict(s); cur['blocks'] = []
        for b in s.get('blocks') or []:
            m = re.match(r'^(\d{1,2})\s+(\S.{0,60})$', b.get('text', '').strip())
            if m and int(m.group(1)) not in have and int(m.group(1)) > s['n'] and len(b['text']) < 70:
                split.append(cur)
                cur = {'n': int(m.group(1)), 'title': m.group(2), 'page': s['page'], 'geo': None, 'images': [], 'blocks': []}
                have.add(cur['n'])
                continue
            cur['blocks'].append(b)
        split.append(cur)
    stops_src = sorted(split, key=lambda x: x['n'])

    # Stops whose headings the parser missed entirely (scripts/extract/stop_fixes.json, titles from the book's bold headings).
    for fx in STOP_FIXES.get(wid, []):
        bad = next((x for x in stops_src if x['n'] == fx['n'] and fx.get('replace_page') and x.get('page') == fx['replace_page']), None)
        if bad:
            # The parser gave this number to text from another walk's opening; send it back there.
            stops_src.remove(bad)
            CARRY.setdefault(fx['carry_to'], []).extend(b for b in (bad.get('blocks') or []) if b.get('kind') != 'info')
        if any(x['n'] == fx['n'] for x in stops_src):
            continue
        src_blocks = intro if fx['from'] == 'intro' else next((x.get('blocks') or [] for x in stops_src if x['n'] == fx['from']), [])
        k = next((i for i, b in enumerate(src_blocks) if b.get('text', '').startswith(fx['start'])), None)
        if k is None:
            continue
        end = next((i for i in range(k, len(src_blocks)) if src_blocks[i].get('kind') == 'info'), len(src_blocks))
        moved = src_blocks[k:end]
        del src_blocks[k:end]
        if fx.get('drop'):
            src_blocks[:] = [b for b in src_blocks if b.get('text') != fx['drop']]
        if moved and moved[0]['text'].startswith(f"{fx['n']} "):
            moved[0] = {**moved[0], 'text': moved[0]['text'][len(str(fx['n'])) + 1:]}
        stops_src.append({'n': fx['n'], 'title': fx['title'], 'page': fx['page'], 'geo': None, 'images': [], 'blocks': moved})
    stops_src.sort(key=lambda x: x['n'])

    # Pins placed from Veneeta's own book maps (scripts/georef) take priority over place-name lookups.
    for s in stops_src:
        bp = BOOK_PINS.get(wid, {}).get(str(s['n']))
        if bp:
            s['geo'] = {'lat': bp['lat'], 'lng': bp['lng'], 'confidence': 'book', 'query': 'placed from the book map'}
            if bp.get('route_offset_m', 0) > 10:
                s['radius'] = min(90, bp['route_offset_m'] + 30)

    # Geo sanity check: discard hits far from the walk's centre, then interpolate gaps.
    pts = [(s['geo']['lat'], s['geo']['lng']) for s in stops_src if s.get('geo')]
    if pts:
        clat = statistics.median(p[0] for p in pts)
        clng = statistics.median(p[1] for p in pts)
    for s in stops_src:
        g = s.get('geo')
        if g and g.get('confidence') != 'book':  # her own map is trusted even far from the walk's middle
            dlat = (g['lat'] - clat) * 111000
            dlng = (g['lng'] - clng) * 103000
            if (dlat ** 2 + dlng ** 2) ** 0.5 > 1800:
                s['geo_rejected'] = g
                s['geo'] = None
    idx = [i for i, s in enumerate(stops_src) if s.get('geo')]
    for i, s in enumerate(stops_src):
        if s.get('geo'):
            continue
        before = [j for j in idx if j < i]
        after = [j for j in idx if j > i]
        if before and after:
            a, b = stops_src[before[-1]]['geo'], stops_src[after[0]]['geo']
            f = (i - before[-1]) / (after[0] - before[-1])
            s['geo'] = {'lat': a['lat'] + (b['lat'] - a['lat']) * f, 'lng': a['lng'] + (b['lng'] - a['lng']) * f, 'confidence': 'estimated', 'query': 'interpolated between neighbours'}
        elif before or after:
            a = stops_src[(before or after)[-1 if before else 0]]['geo']
            s['geo'] = {'lat': a['lat'] + 0.0003, 'lng': a['lng'] + 0.0003, 'confidence': 'estimated', 'query': 'placed beside nearest stop'}
        else:
            s['geo'] = {'lat': 21.2793, 'lng': -157.8292, 'confidence': 'estimated', 'query': 'no location found'}

    stops = []
    cover = None
    for s in stops_src:
        photos = []
        for im in s.get('images', []):
            if im['file'] in PHOTO_DROP:
                continue
            if os.path.exists(f'{ASSETS}/{im["file"]}'):  # crops change the size
                im['w'], im['h'] = Image.open(f'{ASSETS}/{im["file"]}').size
            if im['w'] < 260 or im['h'] < 180:
                continue
            im['overlay'] = OVERLAY.get(im['file'], 0)
            photos.append({'file': im['file'], 'w': im['w'], 'h': im['h']})
            images_used.add(im['file'])
        blocks = clean_blocks(s.get('blocks'))
        tc = TAIL_CUTS.get(f"{wid}-{s['n']:02d}")
        if tc:
            cut = next((j for j, b in enumerate(blocks) if b.get('text', '').startswith(tc['at'])), None)
            if cut is not None:
                CARRY.setdefault(tc['carry_to'], []).extend(b for b in blocks[cut:] if b.get('kind') != 'info')
                blocks = blocks[:cut]
            # Street labels from the Walk II map page (p1-39) that follow the stop's last line.
            if tc.get('keep'):
                blocks = blocks[:tc['keep']]
            if tc.get('strip') and blocks and blocks[-1]['text'].endswith(tc['strip']):
                blocks[-1] = {**blocks[-1], 'text': blocks[-1]['text'][:-len(tc['strip'])]}
            if tc.get('continue') and blocks:
                blocks[-1] = {**blocks[-1], 'text': blocks[-1]['text'].rstrip() + ' ' + tc['continue']}
            blocks = blocks + [dict(b) for b in tc.get('append', [])]
        # Captions in the book are short sentences next to photos; attach them to photos when we can.
        blocks = pull_captions(blocks)
        blocks = join_page_breaks(drop_map_text(blocks))
        caps = [b for b in blocks if b['kind'] == 'caption']
        for p, c in zip(photos, caps):
            p['caption'] = c['text']
        blocks = [b for b in blocks if b['kind'] != 'caption' or len(photos) < len(caps)]
        g = s['geo']
        stitle, sub = re.sub(r'[\x00-\x1f]', '', s['title']).strip(' |-–.'), s.get('subtitle')
        if sub and (stitle.endswith((' of', ' the', ' and', ' at', ' a')) or s['title'].rstrip().endswith(('-', '–', '|')) or sub[:1].islower()):
            stitle, sub = f"{stitle} {sub}".replace('  ', ' '), None
        blocks = repair_blocks(blocks)
        if sub:
            sub = re.sub(r'\s+', ' ', re.sub(r'[\x00-\x1f]', '', sub)).strip() or None
        stitle, sub, blocks = apply_heading_fix(f"{wid}-{s['n']:02d}", stitle, sub, blocks)
        blocks = mark_asides(blocks)
        # Inside a side-trip box, a bulleted place is a description, not a walking instruction.
        blocks = [{**b, 'kind': 'p'} if b.get('aside') and b['kind'] == 'direction' and b['text'].startswith('•') else b for b in blocks]
        blocks = [{**b, 'text': re.sub(r'\s{2,}', ' ', re.sub(r'[\x00-\x08\x0b-\x1f\x7f]', '', b['text'])).strip()} for b in blocks]
        for a, b, _why in TEXT_FIXES.get(f"{wid}-{s['n']:02d}", []):
            if not any(a in x['text'] for x in blocks):
                raise SystemExit(f"text fix {wid}-{s['n']:02d}: '{a}' not found")
            blocks = [{**x, 'text': x['text'].replace(a, b)} for x in blocks]
        # A paragraph that stops mid-sentence and one that goes on in lower case are one paragraph
        # the PDF split at a column or photo (Walk XI stop 6: "Notice" / "the older homes").
        joined = []
        for b in blocks:
            a = joined[-1] if joined else None
            if (a and a['kind'] == b['kind'] == 'p' and a.get('aside') == b.get('aside') and not a.get('box') and not b.get('box')
                    and b['text'][:1].islower() and not a['text'].rstrip().endswith(('.', '!', '?', ':', '”', '’', ')', '"'))):
                joined[-1] = {**a, 'text': join_text(a['text'], b['text'])}
            else:
                joined.append(b)
        blocks = joined
        s['title'], s['subtitle'] = stitle, sub
        if s['n'] in SIDE_STOPS.get(wid, ()):
            s['side'] = True
        stops.append({
            'id': f"{wid}-{s['n']:02d}", 'n': s['n'], 'title': s['title'].rstrip(' .:'),
            **({'subtitle': sub} if sub else {}),
            'blocks': blocks, 'photos': photos,
            'lat': round(g['lat'], 6), 'lng': round(g['lng'], 6), 'geo': g.get('confidence', 'medium'), 'page': s['page'],
            **({'radius': s['radius']} if s.get('radius') else {}),
            **({'side': True} if s.get('side') else {}),
        })
        if not cover:
            for p in photos:
                if p['w'] >= p['h'] * 1.15 and p['w'] >= 500 and OVERLAY.get(p["file"], 0) < 0.003:
                    cover = p['file']
                    break
        review.append({'walk': wid, 'stop': s['n'], 'title': s['title'], 'lat': round(g['lat'], 6), 'lng': round(g['lng'], 6),
                       'confidence': g.get('confidence', 'medium'), 'matched': g.get('osm', g.get('query', '')),
                       'map_link': f"https://www.google.com/maps?q={round(g['lat'], 6)},{round(g['lng'], 6)}", 'book_page': s['page']})
    for im in w.get('images', []):
        if im['w'] >= 260 and im['file'] not in PHOTO_DROP:
            images_used.add(im['file'])
            if not cover and im['w'] >= im['h'] * 1.15 and im['w'] >= 500 and OVERLAY.get(im["file"], 0) < 0.003:
                cover = im['file']
    if not cover:
        land = [p for st in stops for p in st['photos'] if p['w'] >= p['h'] * 1.1 and p['w'] >= 400]
        land.sort(key=lambda p: OVERLAY.get(p['file'], 0))
        if land:
            cover = land[0]['file']
    # Hand-picked covers where the automatic pick was a sliver or a photo with its book caption printed on it.
    cover = {'I': 'p1-26-65.jpg', 'III': 'p1-71-122.jpg'}.get(wid, cover)
    # Book map page rendered as an image for the "book map" view.
    book_map = None
    if wid in MAP_PAGES:
        part, pg = MAP_PAGES[wid]
        try:
            import pymupdf
            pdf = sorted(glob.glob(f'{BOOK}/part{part}*.pdf'))[0]
            pix = pymupdf.open(pdf)[pg - 1].get_pixmap(dpi=110)
            book_map = f'map-{wid}.jpg'
            pix.save(f'{ASSETS}/{book_map}', jpg_quality=80)
        except Exception as e:
            print('map render failed', wid, e, file=sys.stderr)
    # The cartographer's full-walk map replaces the book page where we have it (scripts/georef/carto_maps.py).
    _carto = f'{ROOT}/scripts/georef/georef_carto.json'
    if os.path.exists(_carto):
        book_map = next((g['file'] for g in json.load(open(_carto)).values() if g['walk'] == wid and g['first']), book_map)
    if wid in INFO_BOXES:
        info = INFO_BOXES[wid]['rows']
        # The parser filed some boxes (Walks I and IV) as an 'info' paragraph in stop 1; the box is shown once, on the walk page.
        texts = [r['text'] for r in info if r['kind'] != 'heading']
        norm = lambda x: re.sub(r'[^\w]', '', x)
        for st in stops:
            st['blocks'] = [b for b in st['blocks'] if not (b['kind'] == 'info' and sum(norm(t) in norm(b['text']) for t in texts) >= 2)]
    else:
        info = [{'kind': 'note', 'text': x} for x in info]
    walks.append({'id': wid, 'num': k + 1, 'title': title, 'theme': theme, 'facts': FACTS.get(wid, {}), 'intro': intro, 'info': info,
                  **({'cover': cover} if cover else {}), **({'bookMap': book_map} if book_map else {}), 'color': COLORS[k % len(COLORS)], 'stops': stops})

# Boxed plaques, signs and quotations (scripts/extract/box_fixes.json): lift each out of the sentence it
# interrupts and put it where the book prints it, marked box: true so the app shows it framed.
BOX_FIXES = json.load(open(f'{ROOT}/scripts/extract/box_fixes.json'))['fixes'] if os.path.exists(f'{ROOT}/scripts/extract/box_fixes.json') else []
BOX_MARK = re.compile(r'\s*\s*(?:‘?Ena Rd\.)?\s*|\s*‘Ena Rd\.\s*')


def apply_box_fixes(walks):
    by_id = {s['id']: s for w in walks for s in w['stops']}
    for fx in BOX_FIXES:
        s = by_id.get(fx['stop'])
        if not s:
            print('box fix: no stop', fx['stop'], file=sys.stderr); continue
        bl = s['blocks']
        m = next((i for i, b in enumerate(bl) if BOX_MARK.search(b['text'])), None)
        if m is None:
            print('box fix: no box marker in', fx['stop'], file=sys.stderr); continue
        mt = BOX_MARK.search(bl[m]['text'])
        head, rest = bl[m]['text'][:mt.start()].rstrip(), bl[m]['text'][mt.end():].strip()
        if fx.get('drop_only'):
            if head:
                bl[m] = {**bl[m], 'text': head}
            else:
                del bl[m]
            continue
        pieces = [rest] if rest else []
        j, tail = m + 1, ''
        while True:
            if pieces and fx['box_to'] in pieces[-1]:
                k = pieces[-1].index(fx['box_to']) + len(fx['box_to'])
                pieces[-1], tail = pieces[-1][:k].strip(), pieces[-1][k:].strip()
                break
            if j >= len(bl):
                raise SystemExit(f"box fix {fx['stop']}: end '{fx['box_to']}' not found")
            pieces.append(bl[j]['text']); j += 1
        box = [{'kind': 'p', 'text': t, 'box': True} for t in pieces if t] + ([{'kind': 'p', 'text': fx['box_add'], 'box': True}] if fx.get('box_add') else [])
        after = bl[j:]
        if head:
            h = dict(bl[m]); h['text'] = head
            before = bl[:m] + [h]
        else:
            before = bl[:m]
        joiner = fx.get('join', ' ')
        if tail and (head or fx.get('rejoin') == 'prev') and before:
            before[-1] = {**before[-1], 'text': before[-1]['text'].rstrip() + joiner + tail}
        elif tail:
            before.append({'kind': 'p', 'text': tail})
        elif fx.get('rejoin') == 'next' and before and after:
            before[-1] = {**before[-1], 'text': before[-1]['text'].rstrip() + joiner + after[0]['text']}
            after = after[1:]
        if before and (tail or fx.get('rejoin')) or fx.get('fix') or fx.get('kind'):
            last = dict(before[-1])
            for a, b in fx.get('fix', []):
                if a not in last['text']:
                    raise SystemExit(f"box fix {fx['stop']}: '{a}' not found")
                last['text'] = last['text'].replace(a, b)
            if fx.get('kind'):
                last['kind'] = fx['kind']
            parts = last['text'].split('\n\n')
            before = before[:-1] + [{**last, 'text': parts[0]}] + [{'kind': 'p', 'text': t} for t in parts[1:]]
        s['blocks'] = before + after
        pl = fx.get('place')
        if not pl:
            s['blocks'] = before + box + after
            continue
        tgt = by_id[pl['stop']]['blocks']
        key = pl.get('after') or pl.get('before')
        a = next((i for i, b in enumerate(tgt) if b['text'].startswith(key)), None)
        if a is None:
            raise SystemExit(f"box fix {fx['stop']}: anchor '{key}' not in {pl['stop']}")
        a += 1 if pl.get('after') else 0
        tgt[a:a] = box


apply_box_fixes(walks)

# Hyphens the book prints at a line end that belong to the word (1890-1968, well-known,
# mauka-Koko Head). The PDF text drops them; scripts/extract/line_hyphens.py lists them.
_LH = json.load(open(f'{ROOT}/scripts/extract/line_hyphens.json'))['keep'] if os.path.exists(f'{ROOT}/scripts/extract/line_hyphens.json') else {}
_LH_RE = re.compile(r'(?<![\w‘’])(' + '|'.join(sorted((re.escape(h.replace('-', '')) for h in _LH), key=len, reverse=True)) + r')(?![\w‘’])') if _LH else None
_LH_MAP = {h.replace('-', ''): h for h in _LH}
_LH_SKIP_KEYS = {'id', 'geo', 'page', 'cover', 'bookMap', 'file', 'image', 'src', 'color'}


def restore_line_hyphens(x):
    if isinstance(x, str):
        return _LH_RE.sub(lambda m: _LH_MAP[m.group(1)], x)
    if isinstance(x, list):
        return [restore_line_hyphens(v) for v in x]
    if isinstance(x, dict):
        return {k: (v if k in _LH_SKIP_KEYS else restore_line_hyphens(v)) for k, v in x.items()}
    return x


if _LH_RE:
    walks = restore_line_hyphens(walks)

# Copy referenced images into the app and write the require() map.
for f in images_used:
    if os.path.abspath(IMG_DIR) != os.path.abspath(ASSETS):
        shutil.copy(f'{IMG_DIR}/{f}', f'{ASSETS}/{f}')
lines = ['/* eslint-disable */', '// Generated by scripts/build_data.py. Do not edit by hand.', 'export const images: Record<string, number> = {']
_bm = json.load(open(f'{ROOT}/src/data/bookmaps.json')) if os.path.exists(f'{ROOT}/src/data/bookmaps.json') else {}
extra_pages = {p['file'] for g in _bm.values() for p in g.get('pages', [])}  # Walk VIII and X map pages beyond the first
for f in sorted(images_used | {w['bookMap'] for w in walks if w.get('bookMap')} | extra_pages):
    lines.append(f"  '{f}': require('../../assets/book/{f}'),")
lines.append('};')
open(f'{OUT}/images.ts', 'w').write('\n'.join(lines) + '\n')

# Fun facts: self-contained sentences from the book that carry a date, number, or meaning.
facts = []
for w in walks:
    cands = []
    for s in w['stops']:
        for b in s['blocks']:
            if b['kind'] != 'p':
                continue
            for sent in re.split(r'(?<=[.!])\s+(?=[A-Z‘“])', b['text']):
                sent = sent.strip()
                if not (70 <= len(sent) <= 210) or sent.endswith(':'):
                    continue
                if re.match(r'^(It|This|These|They|He|She|Its|Here|There|Then|Also|But|And|Turn|Walk|Continue|Cross|Look|Stop|You)\b', sent):
                    continue
                score = 0
                if re.search(r'\b1[789]\d\d\b|\b20[0-2]\d\b', sent): score += 2
                if re.search(r"means|meaning|named|known as|‘[a-z ,]+’", sent): score += 3
                if HAWAII.search(sent): score += 1
                if re.search(r'first|oldest|only|largest|tallest|original', sent, re.I): score += 2
                if score >= 3:
                    cands.append((score, sent, s['id']))
    cands.sort(key=lambda x: -x[0])
    for sc, sent, sid in cands[:8]:
        facts.append({'id': f'f{len(facts) + 1}', 'text': sent, 'walkId': w['id'], 'stopId': sid})
facts = book_fix(facts)
json.dump(facts, open(f'{OUT}/facts.json', 'w'), ensure_ascii=False, indent=1)

# Glossary: definitions the book gives inline, e.g. "mo‘olelo (legend)" or "kapu ‘taboo,’".
gloss = {}
ENGLISH = {'hill', 'hope', 'home', 'lane', 'mile', 'pine', 'wine', 'line', 'mall', 'hall', 'helen', 'hawaii', 'imin', 'nuuanu'}
pat1 = re.compile(r"\b([A-Za-zāēīōūĀĒĪŌŪ‘ʻ]{3,}(?:\s[a-zāēīōū‘ʻ]{2,})?)\s*\(([a-z][a-z ,;'-]{2,40})\)")
pat2 = re.compile(r"\b([A-Za-zāēīōūĀĒĪŌŪ‘ʻ]{3,})\s*[‘']([a-z][a-z ,'-]{2,40})[,.]?[’']")
pat3 = re.compile(r"([A-Z][A-Za-zāēīōūĀĒĪŌŪ‘ʻ]+(?:\s[A-Z][A-Za-zāēīōū‘ʻ]+)?) means\s*[‘“']([^’”']{3,50})[’”']")
texts = [b['text'] for w in walks for s in w['stops'] for b in s['blocks']] + [b['text'] for w in walks for b in w['intro']]
for txt in texts:
    for pat in (pat1, pat2, pat3):
        for m in pat.finditer(txt):
            word, mean = m.group(1).strip(), m.group(2).strip(' ,;')
            word = re.sub(r'^Hawaiian\s+', '', word)
            plain = re.sub(r'[‘ʻ\s]', '', word.lower().translate(str.maketrans('āēīōū', 'aeiou')))
            if not re.fullmatch(r'[aeiouhklmnpw]+', plain):
                continue  # not spelled with the Hawaiian alphabet
            if not HAWAII.search(word) and (len(plain) < 5 or plain in ENGLISH):
                continue
            if mean.startswith(('means', 'i or', 'a block', 'variant', 'the deity')) or len(mean) < 3:
                continue
            if word in ('Hawai', 'Kamakawiwo', 'nalu heiau', 'one mo‘olelo', 'naupaka kahakai', 'naupaka kuahiwi'):
                continue
            gloss.setdefault(word, mean.rstrip('.'))
for word, mean in [('Mauka', 'toward the mountains'), ('Makai', 'toward the sea'), ('‘Ewa', 'toward the former plantation town of ‘Ewa (westward)'), ('Lē‘ahi', 'Diamond Head crater')]:
    gloss[word] = mean
json.dump([{'word': k, 'meaning': v} for k, v in sorted(gloss.items())], open(f'{OUT}/glossary.json', 'w'), ensure_ascii=False, indent=1)

# About: the book's foreword and directional guide from the front matter.
front = SRC['front']
about, cur = [], None
for b in front:
    if b.get('kind') == 'heading' and b['text'].strip().upper() in ('FOREWORD', 'DEDICATIONS'):
        cur = {'title': b['text'].strip().title(), 'paragraphs': []}
        about.append(cur)
        continue
    if cur and b.get('kind') in ('p', 'direction') and len(b.get('text', '')) > 25:
        if len(cur['paragraphs']) < 14:
            cur['paragraphs'].append(b['text'])
for sec in about:
    if sec['title'] == 'Dedications':
        sec['paragraphs'] = [x for x in sec['paragraphs'] if x.startswith(('To my', 'This book is dedicated', 'In memory'))]
    if sec['title'] == 'Foreword':
        sec['paragraphs'] = [('T' + x if x.startswith('he history') else x) for x in sec['paragraphs']]
for sec in about:
    sec['blocks'] = [{'k': 'p', 't': x} for x in sec['paragraphs']]


# The rest of the book's front matter (pages viii to xix): Introduction, the Hawaiian
# language and pronunciation guide, the Monarchy table and dates, and Wahi Pana.
# Text is the book's own; we only rejoin paragraphs that a photo split across a page
# and drop photo captions, since the photos are not shown here.
def front_section(title, start_heading, end_heading, captions=()):
    i = next(k for k, b in enumerate(front) if b.get('kind') == 'heading' and b['text'].strip().upper() == start_heading)
    blocks, photo = [], False
    for b in front[i + 1:]:
        txt = (b.get('text') or '').replace('\x07', '').replace('\x08', '').strip()
        if b.get('kind') == 'image' or txt in captions:
            photo = True
            continue
        if b.get('kind') == 'heading':
            if txt.upper() == end_heading:
                break
            continue
        if b.get('kind') not in ('p', 'direction', 'tagline') or not txt or txt in captions:
            continue
        kind = 'h' if b['kind'] == 'direction' else 'p'
        # A paragraph that stops mid-sentence and resumes after a photo is one paragraph in the book.
        if kind == 'p' and photo and blocks and blocks[-1]['k'] == 'p' and not blocks[-1]['t'].endswith(('.', '!', ':', '?', '”', '’', ';')) and blocks[-1]['t'][-1:].isalpha():
            blocks[-1]['t'] += ' ' + txt
            photo = False
            continue
        photo = False
        blocks.append({'k': kind, 't': txt})
    return {'title': title, 'blocks': blocks}


intro = front_section('Introduction', 'INTRODUCTION', 'HAWAIIAN LANGUAGE AND GUIDE TO PRONUNCIATION', captions=(
    'The signs along Ke‘eaumoku Street delineate the ‘Ewa-most boundary of the Waikīkī ahupua‘a.',
    '‘Āpuakēhau Stream in the times before the Ala Wai Canal (Hawai‘i State Archives)',
    'The ahupua‘a of Waikīkī is outlined in red.'))
for b in intro['blocks']:
    if b['k'] == 'h':
        t = b['t'].title().replace('‘A', '‘a')
        for small in (' Of ', ' And ', ' The '):
            t = t.replace(small, small.lower())
        b['t'] = t
intro['blocks'][0]['k'] = 'lead'  # the book's tagline under the title

lang = front_section('Hawaiian Language and Guide to Pronunciation', 'HAWAIIAN LANGUAGE AND GUIDE TO PRONUNCIATION', 'HAWAIIAN MONARCHY AND')
# The alphabet chart at the foot of the section (page xv) is laid out as a table in the book.
k = next(i for i, b in enumerate(lang['blocks']) if b['t'].startswith('‘Ōlelo Hawai‘i Pī‘āpā'))
lang['blocks'] = lang['blocks'][:k] + [
    {'k': 'h', 't': '‘Ōlelo Hawai‘i Pī‘āpā (Hawaiian Language Alphabet)'},
    {'k': 'li', 't': 'Vowels: A, Ā, E, Ē, I, Ī, O, Ō, U, Ū'},
    {'k': 'li', 't': 'Consonants: H (hē), K (kē), L (lā), M (mū), N (nū), P (pī), W (wē), ‘ (‘okina)'},
]
lang['id'] = 'pronunciation'

# Monarchy table, transcribed from the book's page xvi (columns: royalty, lived, ruled, consorts).
ROYALTY = [
    ('Kamehameha I', 'Kamehameha the Great', '1758-1819', '1810-1819', 'Ka‘ahumanu, Keōpūolani'),
    ('Kamehameha II', 'Liholiho', '1798-1824', '1819-1824', 'Kamāmalu'),
    ('Kamehameha III', 'Kauikeaouli', '1814-1854', '1825-1854', 'Nāhi‘ena‘ena, Kalama'),
    ('Kamehameha IV', 'Alexander Liholiho', '1834-1863', '1854-1863', 'Emma Na‘ea'),
    ('Kamehameha V', 'Lot Kapuāiwa', '1830-1872', '1863-1872', 'Victoria Kamāmalu'),
    ('Lunalilo', 'William Charles Lunalilo', '1835-1874', '1873-1874', 'Eliza Meek'),
    ('King Kalākaua', 'David Kalākaua', '1836-1891', '1874-1891', 'Kapi‘olani'),
    ('Queen Lili‘uokalani', 'Lydia Dominis', '1838-1917', '1891-1893', 'Gov. John Owen Dominis Holt'),
    ('Princess Bernice Pauahi Bishop', '', '1831-1899', '', 'Charles Reed Bishop'),
    ('Princess Likelike', '', '1851-1887', '', 'Gov. Archibald Scott Cleghorn'),
    ('Princess Ka‘iulani', '', '1875-1899', '', '(never married)'),
    ('Prince Kūhiō', '', '1871-1922', '', 'Elizabeth Kahanu Kalaniana‘ole'),
]
monarchy = front_section('Hawaiian Monarchy and Some Historic Dates', 'SOME HISTORIC DATES', 'WAHI PANA',
                         captions=('Our last reigning monarch: Queen Lili‘uokalani (Hawai‘i State Archives)',))
# Keep only the notes and dates that follow the table; the table itself comes from ROYALTY.
k = next(i for i, b in enumerate(monarchy['blocks']) if 'King Kalākaua, Queen' in b['t'])
end = next(i for i, b in enumerate(monarchy['blocks']) if 'Statehood' in b['t'])
dates = monarchy['blocks'][k:end + 1]
dates[0] = {'k': 'p', 't': dates[0]['t'][dates[0]['t'].index('King Kalākaua, Queen'):]}
for b in dates:
    if 'Statehood' in b['t']:
        b['k'] = 'p'
    m = re.match(r'^((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:\d{1,2},\s+)?\d{4})\s+(.*)$', b['t'])
    if b['k'] == 'p' and m:
        b.update({'k': 'date', 'd': re.sub(r'\s+', ' ', m.group(1)), 't': m.group(2)})
monarchy['blocks'] = [{'k': 'royal', 'name': n, 'alt': a, 'lived': l, 'ruled': r, 'consorts': c} for n, a, l, r, c in ROYALTY] + dates

# Wahi Pana (pages xviii and xix): an introduction, then sacred places walk by walk.
w = next(i for i, b in enumerate(front) if b.get('kind') == 'heading' and b['text'].strip().upper() == 'WAHI PANA')
pana = {'title': 'Wahi Pana', 'blocks': []}
for b in front[w + 1:w + 4]:
    pana['blocks'].append({'k': 'p', 't': b['text'].strip()})
WALK_HEAD = re.compile(r'^(XII|XI|IX|X|VIII|VII|VI|IV|V|III|II|I)\s?(\S.*)$')
first = next(i for i, b in enumerate(front) if b.get('kind') == 'direction' and b['text'].strip() == 'I Ala Wai Canal')
lists = [b for b in front[first:w] + front[w + 4:] if b.get('kind') in ('p', 'direction')]
started = False
for b in lists:
    txt = b['text'].strip()
    m = WALK_HEAD.match(txt) if b['kind'] == 'direction' else None
    if m:
        started = True
        # Walk III's heading is three lines in the book.
        head = m.group(2).replace('Kāneloa Queen', 'Kāneloa\nQueen').replace('Park Honolulu', 'Park\nHonolulu')
        pana['blocks'].append({'k': 'h', 't': f'{m.group(1)} {head}'})
        continue
    if not started or b['kind'] != 'p':
        continue
    if txt.startswith('Kūka‘ō‘ō Heiau at Mānoa Heritage Center. Photograph'):
        continue  # photo caption
    if txt.startswith('…and all the street names'):
        pana['blocks'].append({'k': 'p', 't': txt})
        break
    for item in re.split(r'\s+-\s+', re.sub(r'^-\s*', '', txt).replace('‘ Ā', '‘Ā')):
        pana['blocks'].append({'k': 'p' if item.endswith(':') or item[:1].isdigit() or item.startswith('The 3 streams') else 'li', 't': item})

about += [intro, lang, monarchy, pana]
for sec in about:
    sec.pop('paragraphs', None)
json.dump(about, open(f'{OUT}/about.json', 'w'), ensure_ascii=False, indent=1)

walks = book_fix(walks)
_missing = [a for a, _ in BOOK_CORRECTIONS if a not in BOOK_CORRECTIONS_USED]
if _missing:
    raise SystemExit(f'book corrections not found: {_missing}')
json.dump(walks, open(f'{OUT}/walks.json', 'w'), ensure_ascii=False, indent=1)
with open(f'{ROOT}/review/stops_review.csv', 'w', newline='') as fh:
    wr = csv.DictWriter(fh, fieldnames=list(review[0].keys()))
    wr.writeheader()
    wr.writerows(review)

conf = {}
for r in review:
    conf[r['confidence']] = conf.get(r['confidence'], 0) + 1
print('walks', len(walks), 'stops', sum(len(w['stops']) for w in walks), 'images', len(images_used), 'facts', len(facts), 'glossary', len(gloss))
print('pin confidence', conf)
