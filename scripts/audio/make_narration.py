"""Record narration with Gemini TTS: one MP3 per paragraph, matching src/lib/narration.ts stopScript().
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

if __name__ == '__main__':
    out_dir, voice, ids = sys.argv[1], sys.argv[2], sys.argv[3:]
    walks = json.load(open(os.path.join(ROOT, 'src/data/walks.json'))); walks = walks if isinstance(walks, list) else walks['walks']
    mpath = os.path.join(out_dir, 'manifest.json')
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {"voice": voice, "model": MODEL, "stops": {}}
    jobs = []
    for w in walks:
        if w['id'] not in ids: continue
        for s in w['stops']:
            entry = []
            for i, text in enumerate(parts(s)):
                rel = f"{w['id']}/{s['id']}/{i:02d}.mp3"; h = hashlib.sha1((voice + MODEL + text).encode()).hexdigest()[:12]
                prev = {e['file']: e for e in manifest['stops'].get(s['id'], [])}.get(rel)
                path = os.path.join(out_dir, rel); os.makedirs(os.path.dirname(path), exist_ok=True)
                if not (os.path.exists(path) and (prev is None or prev.get('hash') == h)): jobs.append((text, path))
                entry.append({"file": rel, "hash": h})
            manifest['stops'][s['id']] = entry
    print(len(jobs), 'paragraphs to record', flush=True)
    done = [0]
    def run(job):
        speak(job[0], voice, job[1]); done[0] += 1
        if done[0] % 20 == 0: print(done[0], '/', len(jobs), flush=True)
    with ThreadPoolExecutor(int(os.environ.get('TTS_WORKERS', '8'))) as ex: list(ex.map(run, jobs))
    total = 0
    for sid, entry in manifest['stops'].items():
        for e in entry:
            p = os.path.join(out_dir, e['file'])
            if os.path.exists(p): e['sec'] = duration(p); total += e['sec']
    json.dump(manifest, open(mpath, 'w'), indent=1)
    print('done; total audio minutes', round(total / 60, 1))
