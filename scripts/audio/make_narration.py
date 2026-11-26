"""Record narration with Gemini TTS: one MP3 per paragraph, matching src/lib/narration.ts stopScript().
One request per paragraph by default. WW_STOP_MODE=1 records a whole stop in one request and splits at pauses; that placed some cuts wrongly in testing, so it is off.
The clip hash is voice + text only, so switching TTS_MODEL does not re-record. Progress is saved when the daily request limit is hit. STOP_LIMIT=N caps stops per run.
Usage: python3 -I scripts/audio/make_narration.py OUT_DIR VOICE WALK_ID [WALK_ID ...]
Key: ~/.config/waikiki/gemini.key (never committed). Re-runs skip files whose text is unchanged."""
import base64, hashlib, json, os, re, subprocess, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KEY = open(os.path.expanduser('~/.config/waikiki/gemini.key')).read().strip()
MODEL = os.environ.get('TTS_MODEL', 'gemini-3.8-flash-tts')

def prepare(t):  # mirror of narration.ts prepare()
    t = re.sub(r'\bSt\.', 'Street', t); t = re.sub(r'\bAve\.', 'Avenue', t); t = re.sub(r'\bBlvd\.', 'Boulevard', t)
    t = re.sub(r'\bRd\.', 'Road', t); t = re.sub(r'\bft\b', 'feet', t); t = re.sub(r'[*•]', '', t)
    t = t.replace(' – ', ', ').replace(' - ', ', ')
    return re.sub(r'\s+', ' ', t).strip()

def parts(stop):
    p = [f"Stop {stop['n']}. {stop['title']}."]
    p += [prepare(b['text']) for b in stop['blocks'] if b['kind'] in ('p', 'direction', 'tagline')]
    return p

def speak(text, voice, out):
    body = {"contents": [{"role": "user", "parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    for attempt in range(6):
        try:
            req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                data=json.dumps(body).encode(), headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
            d = json.load(urllib.request.urlopen(req, timeout=240))
            inl = d['candidates'][0]['content']['parts'][0]['inlineData']
            rate = 24000
            for t in inl.get('mimeType', '').split(';'):
                if t.strip().startswith('rate='): rate = int(t.split('=')[1])
            tmp = out + '.tmp.mp3'
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', '-', '-b:a', '64k', tmp],
                           input=clean_tail(base64.b64decode(inl['data']), rate), check=True)
            os.replace(tmp, out); return
        except (urllib.error.HTTPError, urllib.error.URLError, KeyError, TimeoutError) as e:
            code = getattr(e, 'code', None)
            if code in (400, 401, 403): raise
            time.sleep(min(60, 5 * 2 ** attempt))
    raise RuntimeError('failed: ' + out)

def clean_tail(pcm, rate):
    """Gemini TTS clips can end with a short burst of static after the speech. Cut at the last quiet gap
    in the final 1.5 seconds and fade out, so clips end cleanly."""
    import numpy as np
    a = np.frombuffer(pcm, np.int16).astype(float)
    w = rate // 50  # 20 ms windows
    n = len(a) // w
    r = [np.sqrt((a[i * w:(i + 1) * w] ** 2).mean()) for i in range(n)]
    cut = len(a)
    for i in range(n - 3, max(0, n - 75), -1):
        if r[i] < 150 and r[i + 1] < 150 and r[i + 2] < 150:
            if max(r[i + 3:] or [0]) > 2000:  # loud noise after the final quiet gap
                cut = (i + 3) * w
            break
    a = a[:cut]
    f = min(len(a), rate * 3 // 100)
    a[-f:] *= np.linspace(1, 0, f)
    return a.astype(np.int16).tobytes()

def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return round(float(r.stdout.strip()), 2)

def request_pcm(text, voice):
    """One TTS request; returns (pcm, rate). Raises QuotaError when the daily limit is hit."""
    body = {"contents": [{"role": "user", "parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    for attempt in range(6):
        try:
            req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                data=json.dumps(body).encode(), headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
            d = json.load(urllib.request.urlopen(req, timeout=300))
            inl = d['candidates'][0]['content']['parts'][0]['inlineData']
            rate = 24000
            for t in inl.get('mimeType', '').split(';'):
                if t.strip().startswith('rate='): rate = int(t.split('=')[1])
            return base64.b64decode(inl['data']), rate
        except urllib.error.HTTPError as e:
            if e.code == 429 and 'per_day' in (e.read().decode() if hasattr(e, 'read') else ''): raise QuotaError()
            if e.code in (400, 401, 403): raise
            time.sleep(min(60, 5 * 2 ** attempt))
        except (urllib.error.URLError, KeyError, TimeoutError):
            time.sleep(min(60, 5 * 2 ** attempt))
    raise RuntimeError('request failed')

class QuotaError(Exception): pass

def write_mp3(pcm, rate, out):
    tmp = out + '.tmp.mp3'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', '-', '-b:a', '64k', tmp],
                   input=clean_tail(pcm, rate), check=True)
    os.replace(tmp, out)

def split_pcm(pcm, rate, texts):
    """Cut one stop's audio into len(texts) clips at the longest interior pauses. Returns None if it does not look right."""
    import numpy as np
    n = len(texts)
    a = np.frombuffer(pcm, np.int16)
    if n == 1: return [a]
    w = rate // 50
    k = len(a) // w
    r = np.array([np.sqrt((a[i * w:(i + 1) * w].astype(float) ** 2).mean()) for i in range(k)])
    runs, i = [], 0
    while i < k:
        if r[i] < 200:
            j = i
            while j < k and r[j] < 200: j += 1
            if i > 15 and j < k - 15 and j - i >= 10: runs.append((j - i, (i + j) // 2))  # >= 200 ms, not at the very ends
            i = j
        else: i += 1
    total = len(a) / rate; nchar = sum(len(t) for t in texts); cuts, cum, last = [], 0, 0
    for t in texts[:-1]:  # expected boundary time from character share, snapped to the best nearby pause
        cum += len(t); exp = total * cum / nchar; tol = max(2.5, 0.08 * total)
        best = None
        for ln, c in runs:
            tc = c * w / rate
            if abs(tc - exp) <= tol and c > last:
                score = ln * 0.02 - 0.15 * abs(tc - exp)
                if best is None or score > best[0]: best = (score, c)
        if best is None: return None
        cuts.append(best[1]); last = best[1]
    bounds = [0] + [c * w for c in cuts] + [len(a)]
    clips = [a[bounds[x]:bounds[x + 1]] for x in range(n)]
    cps = sum(len(t) for t in texts) / (len(a) / rate)  # characters per second overall
    for c, t in zip(clips, texts):
        sec = len(c) / rate
        if sec < 0.5 or not (0.4 < (len(t) / sec) / cps < 2.5): return None
    return clips

def record_stop(texts, outs, voice):
    pcm, rate = request_pcm('\n\n'.join(texts), voice)
    clips = split_pcm(pcm, rate, texts)
    if clips is None: return False
    for c, o in zip(clips, outs): write_mp3(c.tobytes(), rate, o)
    return True

def record_par(text, out, voice):
    pcm, rate = request_pcm(text, voice); write_mp3(pcm, rate, out)

def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return round(float(r.stdout.strip()), 2)

if __name__ == '__main__':
    out_dir, voice, ids = sys.argv[1], sys.argv[2], sys.argv[3:]
    walks = json.load(open(os.path.join(ROOT, 'src/data/walks.json'))); walks = walks if isinstance(walks, list) else walks['walks']
    mpath = os.path.join(out_dir, 'manifest.json')
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {"voice": voice, "model": MODEL, "stops": {}}
    limit = int(os.environ.get('STOP_LIMIT', '0')); jobs = []  # job = (stop_id, [(text, path, hash, idx)], whole_stop)
    for w in walks:
        if w['id'] not in ids: continue
        for s in w['stops']:
            if limit and len(jobs) >= limit: break
            todo, hashes = [], []
            for i, text in enumerate(parts(s)):
                rel = f"{w['id']}/{s['id']}/{i:02d}.mp3"; h = hashlib.sha1((voice + text).encode()).hexdigest()[:12]
                prev = {e['file']: e for e in manifest['stops'].get(s['id'], [])}.get(rel)
                path = os.path.join(out_dir, rel); os.makedirs(os.path.dirname(path), exist_ok=True)
                hashes.append({"file": rel, "hash": h})
                have = os.path.exists(path) and (prev is None or prev.get('hash') == h)
                if prev is None and os.path.exists(path): prev = {}  # legacy file without a hash: keep, record hash
                if not have or (prev is not None and prev.get('hash') != h and not os.path.exists(path)): todo.append((text, path, i))
            if todo: jobs.append((s['id'], hashes, todo, os.environ.get('WW_STOP_MODE') == '1' and len(todo) == len(hashes) and len(hashes) > 1))
            else: manifest['stops'][s['id']] = hashes
    print(len(jobs), 'stops to record', flush=True)
    stopped = [False]; done = [0]
    def run(job):
        sid, hashes, todo, whole = job
        if stopped[0]: return
        try:
            ok = False
            if whole: ok = record_stop([t for t, _, _ in todo], [p for _, p, _ in todo], voice)
            if not ok:
                for t, p, _ in todo:
                    if stopped[0]: return
                    record_par(t, p, voice)
            manifest['stops'][sid] = hashes; done[0] += 1
        except QuotaError:
            stopped[0] = True
        except Exception as e: print('failed', sid, repr(e)[:120], flush=True)
    try:
        with ThreadPoolExecutor(int(os.environ.get('TTS_WORKERS', '3'))) as ex: list(ex.map(run, jobs))
    finally:
        total = 0
        for sid, entry in manifest['stops'].items():
            for e in entry:
                pth = os.path.join(out_dir, e['file'])
                if os.path.exists(pth): e['sec'] = duration(pth); total += e['sec']
        manifest['voice'], manifest['model'] = voice, MODEL
        json.dump(manifest, open(mpath, 'w'), indent=1)
        print('stops done this run', done[0], '; daily limit hit' if stopped[0] else '', '; total audio minutes', round(total / 60, 1))
