"""Make sample narration for one stop with Gemini TTS. Key is read from ~/.config/waikiki/gemini.key (never committed)."""
import base64, json, os, subprocess, sys, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KEY = open(os.path.expanduser('~/.config/waikiki/gemini.key')).read().strip()
MODEL = os.environ.get('TTS_MODEL', 'gemini-3.8-flash-tts')

def script(stop, max_paras=3):
    parts = [f"Stop {stop['n']}. {stop['title']}."]
    for b in stop['blocks']:
        if b['kind'] == 'p' and len(parts) <= max_paras:
            parts.append(b['text'].replace('–', ',').replace(' - ', ', '))
    return '\n\n'.join(parts)

def speak(text, voice, out):
    body = {"contents": [{"role": "user", "parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                 data=json.dumps(body).encode(), headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=180))
    part = d['candidates'][0]['content']['parts'][0]['inlineData']
    pcm = base64.b64decode(part['data'])
    rate = 24000
    for t in part.get('mimeType', '').split(';'):
        if t.strip().startswith('rate='): rate = int(t.split('=')[1])
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', '-', '-b:a', '64k', out], input=pcm, check=True)

if __name__ == '__main__':
    walks = json.load(open(os.path.join(ROOT, 'src/data/walks.json')))
    walks = walks if isinstance(walks, list) else walks['walks']
    stop = [w for w in walks if w['id'] == 'IV'][0]['stops'][0]
    text = script(stop)
    print(text[:300], '...')
    for v in sys.argv[2:]:
        out = os.path.join(sys.argv[1], f'stop1-{v}.mp3'); speak(text, v, out); print('ok', out)
