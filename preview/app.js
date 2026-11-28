/* Waikīkī Walks web preview: same data, flows and paywall rules as the mobile app. */
(function () {
  'use strict';
  const D = window.WW;
  const IMG = window.WWIMG = window.WWIMG || {};
  const TRIAL = D.trial;
  const $app = document.getElementById('app');

  // ---------- icons (stroke icons, 24px grid) ----------
  const P = {
    flower: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C9 4 15 4 12 9.5M14.4 11.2c4.6-3.8 6.4 2 0 1.6M13.5 14.2c3.3 5 -2.5 6.3 -1.5 0M10.5 14.2c-3.3 5 2.5 6.3 1.5 0M9.6 11.2C5 7.4 3.2 13.2 9.6 12.8"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    heartFill: '<path fill="currentColor" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    headset: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
    volume: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 17V9a4 4 0 0 1 4-4h6M6 13c0 3 5 3 9 6"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="M10 21l2-6-3-3 2-5 4 3 3 1M9 12l-3 2M12 15l3 6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    navigate: '<path fill="currentColor" stroke="none" d="M12 2 20 21 12 17 4 21z"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    fwd: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    prev: '<path d="M18 6 9 12l9 6V6zM6 6v12"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    sparkles: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M19 15l.8 1.7 1.7.8-1.7.8L19 20l-.8-1.7-1.7-.8 1.7-.8z"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5H5z"/><path d="M5 11h14"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3"/>',
    gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8C10 4 7 5 8 8M12 8c2-4 5-3 4 0"/>',
    time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    steps: '<path d="M7 16c-2 0-3-2-3-5s1-6 3-6 3 3 3 6-1 5-3 5zM17 21c-2 0-3-2-3-5s1-6 3-6 3 3 3 6-1 5-3 5z"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    reader: '<path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"/>',
    split: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16"/>',
    directions: '<path d="M12 2 22 12 12 22 2 12z"/><path d="M9 14v-3h5M12 8l2 3-2 3"/>',
    google: '<path fill="#4285F4" stroke="none" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" stroke="none" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" stroke="none" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z"/><path fill="#EA4335" stroke="none" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"/>',
    apple: '<path fill="currentColor" stroke="none" d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.7zM14.2 5.6c.6-.8 1.1-1.8 1-2.9-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.7-1.3z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    play: '<circle cx="12" cy="12" r="9"/><path fill="currentColor" d="M10 8.5v7l6-3.5z"/>',
    layers: '<path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M2 13l10 5 10-5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path fill="currentColor" d="M15.5 8.5 13 13l-4.5 2.5L11 11z"/>',
    earth: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  };
  const ic = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n] || ''}</svg>`;
  const hib = (size, color = '#D6336C', rot = 0) => {
    let s = '';
    for (const a of [0, 72, 144, 216, 288]) s += `<path d="M50 50 C 36 34, 30 12, 50 6 C 70 12, 64 34, 50 50 Z" fill="${color}" opacity=".93" transform="rotate(${a} 50 50)"/>`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)" aria-hidden="true">${s}<circle cx="50" cy="50" r="7" fill="#7A1636"/><path d="M50 50 L66 30" stroke="#F7B733" stroke-width="2.6" stroke-linecap="round"/><circle cx="67" cy="28" r="3.2" fill="#F7B733"/><circle cx="63" cy="25.5" r="2" fill="#F7B733"/><circle cx="70.5" cy="32" r="2" fill="#F7B733"/></svg>`;
  };
  const plum = (size, rot = 0) => {
    let s = '';
    for (const a of [0, 72, 144, 216, 288]) s += `<ellipse cx="50" cy="27" rx="15" ry="24" fill="#FFFDF7" stroke="#EADBC0" transform="rotate(${a} 50 50) rotate(18 50 27)"/>`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)" aria-hidden="true">${s}<circle cx="50" cy="50" r="11" fill="#FFD25E"/><circle cx="50" cy="50" r="5" fill="#F7B733"/></svg>`;
  };
  const wave = (w, c) => `<svg class="wave" width="${w}" height="10" viewBox="0 0 120 10" aria-hidden="true"><path d="M0 5 Q 10 0 20 5 T 40 5 T 60 5 T 80 5 T 100 5 T 120 5" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- state ----------
  const store = (() => { try { return window.localStorage; } catch (e) { return null; } })();
  const load = (k, d) => { try { const v = store && store.getItem('ww.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const save = (k, v) => { try { store && store.setItem('ww.' + k, JSON.stringify(v)); } catch (e) {} };
  const S = {
    tab: 'home', view: null, walkId: null, mode: 'read', focus: 0,
    settings: (() => { const st = load('settings', { theme: 'system', autoNarrate: false, arrival: 35, rate: 1, textScale: 1, margin: 20, spacing: 1, alerts: true }); if (st.margin == null) { st.margin = 20; st.spacing = 1; } if (!st.v2) { st.autoNarrate = false; st.v2 = true; } if (!st.audioMode) st.audioMode = st.autoNarrate ? 'gps' : 'off'; return st; })(),
    isPro: load('pro', false), demo: load('demo', false), realPro: load('realPro', false), profile: load('profile', null), favs: load('favs', []), progress: load('progress', {}), active: load('active', null),
    layout: 'split', detent: 'half', stopIdx: 0, pageAnim: '', sim: false, me: null, heading: 0, arrivedBanner: null, follow: 'follow',
  };
  const persist = () => { save('settings', S.settings); save('pro', S.isPro); save('demo', S.demo); save('realPro', S.realPro); save('profile', S.profile); save('favs', S.favs); save('progress', S.progress); save('active', S.active); };
  const walk = (id) => D.walks.find((w) => w.id === id);
  // The book numbers its walks with Roman numerals; the app shows plain numbers.
  const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
  const wn = (id) => ROMAN[id] || id;
  const canOpen = (wid, i) => S.isPro || (wid === TRIAL.walkId ? i < TRIAL.freeStops : i < 1);
  // Before unlocking, the maps show only the stops you can open (the trial's first stops, or a locked walk's first stop),
  // and her book maps appear only once unlocked (Nick, 21 Nov 2026).
  const lastOpen = (w) => { if (S.isPro) return w.stops.length - 1; let k = -1; w.stops.forEach((_, i) => { if (canOpen(w.id, i)) k = i; }); return k; };
  const bookOk = (w) => !!w.bookMap && S.isPro;
  const onMap = (s) => s.geo === 'book'; // a stop gets a pin only if her book map prints it
  const canStart = (wid) => S.isPro || wid === TRIAL.walkId;
  const applyTheme = () => {
    const t = S.settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.setProperty('--ts', S.settings.textScale);
    document.documentElement.style.setProperty('--mg', S.settings.margin + 'px');
    document.documentElement.style.setProperty('--ls', S.settings.spacing);
  };
  const isDark = () => S.settings.theme === 'dark' || (S.settings.theme === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);

  // Images for a walk load on demand from that walk's file.
  const loaded = {};
  const needImages = (wid) => new Promise((res) => {
    if (loaded[wid]) return res();
    const s = document.createElement('script');
    s.src = `img-${wid}.js`; s.onload = () => { loaded[wid] = true; res(); }; s.onerror = () => res();
    document.head.appendChild(s);
  });
  const img = (f, cls = '', alt = '') => (f && IMG[f] ? `<img src="${IMG[f]}" class="${cls}" alt="${esc(alt)}" loading="lazy">` : '');

  // ---------- geo ----------
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dist = (a, b) => { const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  const bearing = (a, b) => { const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat)); const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng)); return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360; };
  const hawaiianDir = (b) => { const d = [[20, 'mauka'], [110, 'Diamond Head'], [200, 'makai'], [290, 'ʻEwa']]; let best = d[0]; for (const x of d) { const dd = Math.abs(((b - x[0] + 540) % 360) - 180); if (dd < Math.abs(((b - best[0] + 540) % 360) - 180)) best = x; } return best[1]; };
  const fmt = (m) => { const ft = m * 3.28084; return ft < 1000 ? `${Math.round(ft / 10) * 10} ft` : `${(m / 1609.34).toFixed(1)} mi`; };

  // ---------- glossary ----------
  const norm = (w) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’ʻ'`]/g, '').replace(/[^a-z]/g, '');
  const gloss = new Map(D.glossary.map((g) => [norm(g.word), g]));
  let richSeen = null; // when set, glossary words are underlined only on first appearance
  const rich = (t) => esc(t).replace(/([A-Za-zĀāĒēĪīŌōŪū‘ʻ’']{3,})/g, (m) => { const g = gloss.get(norm(m)); if (g && richSeen) { if (richSeen.has(g.word)) return m; richSeen.add(g.word); } return g ? `<span class="gw" role="button" tabindex="0" data-word="${esc(g.word)}">${m}</span>` : m; });

  // ---------- speech ----------
  const synth = window.speechSynthesis;
  let speakTok = 0;
  const prep = (t) => t.replace(/\bSt\./g, 'Street').replace(/\bAve\./g, 'Avenue').replace(/\bBlvd\./g, 'Boulevard').replace(/\bRd\./g, 'Road').replace(/[*•]/g, '');
  const speaking = { stopId: null, para: -1 };
  function speakStop(stop) {
    if (speaking.audio) { speaking.audio.pause(); speaking.audio = null; }
    const tok = ++speakTok; if (synth) synth.cancel();
    const parts = [`Stop ${stop.n}. ${stop.title}.`, ...stop.blocks.filter((b) => ['p', 'direction', 'tagline'].includes(b.kind)).map((b) => prep(b.text))];
    let i = 0;
    // Recorded narration when this stop has it; the browser voice otherwise.
    const starts = (window.WWAUDIO || {})[stop.id], rec = Array.isArray(starts) && starts.length === parts.length;
    if (!rec) { speaking.stopId = null; speaking.para = -1; markReading(); return toast('Narration for this stop is still being recorded.'); }
    {
      // One recorded file per stop; the part being read follows the playback time.
      const a = new Audio(`audio/${stop.id.split('-')[0]}/${stop.id}.mp3`); speaking.audio = a;
      a.playbackRate = Math.max(0.8, Math.min(1.5, S.settings.rate || 1));
      speaking.stopId = stop.id; speaking.para = -1; markReading();
      a.ontimeupdate = () => {
        if (tok !== speakTok) return;
        let k = 0; while (k + 1 < starts.length && a.currentTime >= starts[k + 1]) k++;
        if (speaking.para !== k - 1) { speaking.para = k - 1; markReading(); }
      };
      const done = () => { if (tok !== speakTok) return; speaking.stopId = null; speaking.para = -1; speaking.audio = null; markReading(); };
      a.onended = done; a.onerror = done;
      a.play().catch(done);
      return;
    }
    const next = () => {
      if (tok !== speakTok) return;
      if (i >= parts.length) { speaking.stopId = null; speaking.para = -1; markReading(); return; }
      speaking.stopId = stop.id; speaking.para = i - 1; markReading();
      const u = new SpeechSynthesisUtterance(parts[i]); u.rate = S.settings.rate; u.lang = 'en-US';
      u.onend = () => { i++; next(); }; u.onerror = () => { i++; next(); };
      synth.speak(u);
    };
    next();
  }
  function stopSpeak() { speaking.paused = false; speakTok++; if (synth) { synth.resume(); synth.cancel(); setTimeout(() => synth.cancel(), 120); } if (speaking.audio) { speaking.audio.pause(); speaking.audio = null; } speaking.stopId = null; speaking.para = -1; markReading(); }
  // Read, Pause and Resume for the stop on screen (Nick, 21 Nov 2026: a read button up by the text instead of the headphones).
  function readLabel() { return speaking.stopId ? (speaking.paused ? `${ic('play')} Resume` : `${ic('pause')} Pause`) : `${ic('volume')} Read`; }
  function pauseSpeak() { speaking.paused = true; if (speaking.audio) speaking.audio.pause(); else if (synth) synth.pause(); markReading(); }
  function resumeSpeak() { speaking.paused = false; if (speaking.audio) speaking.audio.play().catch(() => {}); else if (synth) synth.resume(); markReading(); }
  // True whenever anything is actually being read, even if speaking.stopId was lost.
  function isReading() {
    return !!(speaking.stopId || (synth && (synth.speaking || synth.pending)) || (speaking.audio && !speaking.audio.paused && !speaking.audio.ended));
  }
  function markReading() {
    document.querySelectorAll('[data-para]').forEach((el) => { el.classList.toggle('reading', el.dataset.stop === speaking.stopId && Number(el.dataset.para) === speaking.para); });
    document.querySelectorAll('[data-listen]').forEach((el) => { const on = el.dataset.listen === speaking.stopId; el.innerHTML = on ? `${ic('stop')} Stop` : `${ic('volume')} Listen`; });
    const pb = document.getElementById('playbtn'); if (pb) pb.innerHTML = readLabel();
    const sb = document.getElementById('stopbtn'); if (sb) sb.hidden = !isReading();
    // A Stop button that shows on every screen whenever anything is being read aloud (Nick, 25 Nov 2026).
    let fab = document.getElementById('stopfab');
    if (!fab) { fab = document.createElement('button'); fab.id = 'stopfab'; fab.setAttribute('aria-label', 'Stop reading aloud'); fab.addEventListener('click', stopSpeak); document.body.appendChild(fab); }
    fab.hidden = !isReading(); fab.innerHTML = `${ic('stop')} Stop reading`;
    const mb = document.querySelector('.minibar'); if (mb && !speaking.stopId) { const h = mb.querySelector('.hush'); if (h) h.outerHTML = ic('down', 'width="22" height="22" style="transform:rotate(180deg)"'); }
  }

  // ---------- rendering helpers ----------
  // Web addresses and phone numbers as the book prints them, made tappable (tel: for phones).
const LINK_RE = /(www\.[\w.-]+\.[a-z]{2,}|\b[\w-]+\.(?:org|com)\b|\(\d{3}\) ?\d{3}-\d{4}|\b\d{3}-\d{3}-\d{4}\b)/g;
function linked(text) {
  return text.split(LINK_RE).map((p, i) => {
    if (i % 2 === 0) return esc(p);
    const href = /^[\d(]/.test(p) ? 'tel:' + p.replace(/\D/g, '') : 'https://' + p;
    return `<a href="${href}" target="_blank" rel="noopener">${esc(p)}</a>`;
  }).join('');
}
const INFO_ICON = { time: 'time', route: 'flag', bus: 'bus', parking: 'car', web: 'globe', contact: 'call', note: 'info' };
// The walk's information box from the book, one row per printed paragraph with its own labels.
function infoBox(rows) {
  if (!rows || !rows.length) return '';
  return `<section class="infobox" aria-label="Before you go"><div class="lbl">Before you go</div>${rows.map((r) => r.kind === 'heading'
    ? `<h3>${esc(r.text)}</h3>`
    : `<div class="irow"><span aria-hidden="true">${ic(INFO_ICON[r.kind] || 'info', 'width="18" height="18"')}</span><div>${r.label ? `<b>${esc(r.label)}</b><br>` : ''}${linked(r.text)}</div></div>`).join('')}</section>`;
}
function blocksHtml(blocks, stopId) {
    let r = -1;
    richSeen = new Set();
    const one = (b) => {
      const readable = ['p', 'direction', 'tagline'].includes(b.kind); if (readable) r++;
      const attrs = readable ? `data-stop="${stopId}" data-para="${r}"` : '';
      if (b.kind === 'direction') return `<div class="dir" aria-label="Walking direction" role="group" ${attrs}>${ic('walk')}<div>${rich(b.text)}</div></div>`;
      if (b.kind === 'info') return `<div class="info"><span style="color:var(--gold)">${ic('bus', 'width="18" height="18"')}</span><div>${linked(b.text)}</div></div>`;
      if (b.kind === 'tagline' || b.kind === 'heading') return `<p class="p italic" role="heading" aria-level="3" style="color:var(--leaf);font-size:18px" ${attrs}>${esc(b.text)}</p>`;
      if (b.kind === 'caption') return `<p class="small italic">${esc(b.text)}</p>`;
      return `<p class="p" ${attrs}>${rich(b.text)}</p>`;
    };
    // Side trips from the book (its purple-line detours) sit in one highlighted box beside the main walk.
    let html = '';
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].box && !blocks[i].aside) {
        // A plaque, sign or quotation the book prints in a shaded box: framed, between paragraphs.
        let inner = '';
        const start = i;
        while (i < blocks.length && blocks[i].box) {
          const b = blocks[i];
          if (i === start && b.text.length < 90 && b.text.trim().endsWith(':')) { r++; inner += `<h4 class="box-h" data-stop="${stopId}" data-para="${r}">${esc(b.text)}</h4>`; }
          else inner += one(b);
          i++;
        }
        i--;
        html += `<aside class="bookbox">${inner}</aside>`;
        continue;
      }
      if (!blocks[i].aside) { html += one(blocks[i]); continue; }
      let inner = '';
      while (i < blocks.length && blocks[i].aside) inner += one(blocks[i++]);
      i--;
      html += `<div class="aside"><div class="aside-h" role="heading" aria-level="3" aria-label="Side trip">${ic('route', 'width="15" height="15"')}SIDE TRIP</div>${inner}</div>`;
    }
    // The stop's Hawaiian words as plain buttons: easier to reach with a screen reader than words inside a paragraph.
    if (richSeen.size) html += `<div class="gwords"><div class="label" role="heading" aria-level="3">Hawaiian words on this stop</div><div class="gwrow">${[...richSeen].map((w) => `<button class="gwchip gw" data-word="${esc(w)}">${esc(w)}</button>`).join('')}</div></div>`;
    richSeen = null;
    return html;
  }
  const photosHtml = (ph) => (ph.length ? `<div class="photos">${ph.map((p, i) => img(p.file, '', p.caption || 'Photograph from the book').replace('<img ', `<img data-ph="${i}" `)).join('')}</div>` : '');

  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $app.appendChild(t); setTimeout(() => t.remove(), 2600); }

  // ---------- screens ----------

  function walkCard(w, wide) {
    const locked = !S.isPro && w.id !== TRIAL.walkId;
    const pill = w.id === TRIAL.walkId && !S.isPro ? `<span class="pill" style="background:var(--gold);color:#3a2200">FREE PREVIEW</span>` : locked ? `<span class="pill" style="background:rgba(0,0,0,.45);color:#fff">${ic('lock', 'width="11" height="11"')}</span>` : '';
    const stats = [w.facts.distance, w.facts.duration, `${w.stops.length} stops`].filter(Boolean).join('  ·  ');
    return `<button class="wcard ${wide ? 'wide' : ''}" data-walk="${w.id}" aria-label="Walk ${wn(w.id)}, ${esc(w.title)}">${img(w.cover)}<span class="shade"></span><span class="badge" style="background:${w.color}">${wn(w.id)}</span>${pill}<span class="meta"><h3>${esc(w.title)}</h3><div class="theme">${esc(w.theme || '')}</div><div class="stats">${esc(stats)}</div>${progressLine(w).tag}</span>${progressLine(w).bar}</button>`;
  }
  // Under each walk: not started, stop N of M with a bar, or finished.
  function progressLine(w) {
    // Quiet when not started; a colored tag plus a full-width bar along the card's bottom edge once started.
    const p = S.progress[w.id], n = w.stops.length;
    if (!p || !p.visited.length) return { tag: '', bar: '' };
    const done = p.finishedAt || p.visited.length >= n, pct = done ? 100 : Math.round(100 * p.visited.length / n);
    const cls = done ? 'done' : S.active === w.id ? 'live' : 'paused';
    const txt = done ? 'Completed' : `${S.active === w.id ? 'Walking now' : 'Paused'} · ${p.visited.length} of ${n} stops`;
    return { tag: `<span class="wtag ${cls}">${txt}</span>`, bar: `<span class="wbar ${cls}"><i style="width:${pct}%"></i></span>` };
  }

  // Home screen top card, same order as the app: in progress, near you, unfinished, free walk, next walk.
  function smartCard() {
    const card = (kind, wid, label, title, body, href) => ({ kind, wid, label, title, body, href });
    let c = null;
    if (S.active) {
      const w = walk(S.active), p = S.progress[w.id], st = w.stops[p.current];
      c = card('continue', w.id, 'Walk in progress', `Continue ${w.title}`, `Stop ${st.n} of ${w.stops.length}: ${st.title}`, 'resume');
    } else if (S.pretendHere) {
      const here = { lat: 21.2775, lng: -157.8290 }; // Royal Hawaiian Center, for the preview
      let best = null; D.walks.forEach((w) => { const d = dist(here, w.stops[0]); if (!best || d < best.d) best = { w, d }; });
      const free = best.w.id === TRIAL.walkId && !S.isPro;
      c = card('nearby', best.w.id, free ? 'Near you, and free' : 'Near you', best.w.title, `The start is ${fmt(best.d)} away, about ${Math.max(1, Math.round(best.d / 67))} min on foot.`, 'walk');
    } else {
      const un = D.walks.find((w) => S.progress[w.id] && !S.progress[w.id].finishedAt && S.progress[w.id].visited.length);
      if (un) c = card('resume', un.id, 'Pick up where you left off', un.title, `${S.progress[un.id].visited.length} of ${un.stops.length} stops visited`, 'walk');
      else if (!S.isPro) { const w = walk(TRIAL.walkId); c = card('free', w.id, 'Start here, free', w.title, `The first ${TRIAL.freeStops} stops are on us. ${w.theme}`, 'walk'); }
      else { const w = D.walks.find((x) => !(S.progress[x.id] || {}).finishedAt); if (w) c = card('next', w.id, 'Your next walk', w.title, w.theme, 'walk'); }
    }
    if (!c) return '';
    const bg = c.kind === 'continue' ? 'var(--accent)' : c.kind === 'nearby' ? 'var(--leaf)' : 'var(--primary)';
    const attr = c.href === 'resume' ? 'data-act="resume"' : `data-walk="${c.wid}"`;
    return `<button class="startcard" ${attr} style="background:${bg};color:#fff"><div style="flex:1"><div class="label" style="color:inherit;opacity:.85">${esc(c.label)}</div><h3>${esc(c.title)}</h3><div style="font-size:14px;opacity:.92">${esc(c.body)}</div></div><span style="color:var(--gold)">${ic(c.kind === 'continue' ? 'play' : c.kind === 'nearby' ? 'navigate' : 'fwd', 'width="34" height="34"')}</span></button>`;
  }

  function renderHome() {
    const trial = walk(TRIAL.walkId), hero = walk('III').cover;
    const h = new Date().getHours(), greet = h < 12 ? 'Aloha kakahiaka' : h < 17 ? 'Aloha ʻauinalā' : 'Aloha ahiahi';
    const name = S.profile && S.profile.name ? `, ${esc(S.profile.name.split(' ')[0])}` : '';
    return `<div class="screen" id="home">
      <div class="hero">${img(hero, '', 'Waikīkī in the early twentieth century')}<div class="fade"></div>
        <div class="flower" style="left:-26px;top:70px">${hib(92, '#D6336C', -20)}</div><div class="flower" style="right:70px;top:120px">${plum(54, 14)}</div>

        <div class="txt"><div class="italic" style="font-size:18px">${greet}${name}</div><h1>Waikīkī</h1><div class="sub">TWELVE WALKS THROUGH TIME</div><div class="small" style="margin-top:4px">by Veneeta Acson, Ph.D.</div></div></div>
      <div class="pad stack" style="gap:20px">
        ${smartCard()}
        <button class="small" data-act="pretend" style="align-self:center;margin-top:-10px">${S.pretendHere ? 'Preview: stop pretending I’m in Waikīkī' : 'Preview: pretend I’m standing in Waikīkī'}</button>
        <button class="fact" id="fact" aria-label="Show another fact"><div class="flower" style="right:-8px;top:-8px">${hib(58, 'var(--accent)', -12)}</div><div class="row label" style="color:var(--leaf);margin-bottom:6px">${ic('sparkles', 'width="14" height="14"')} Did you know?</div><div class="ftxt" id="ftxt"></div><div class="small" id="fsrc" style="margin-top:6px"></div></button>
        <section class="group stack" style="gap:12px"><div><h2>The twelve walks</h2>${wave(90, 'var(--primary)')}</div>${D.walks.map((w) => walkCard(w, true)).join('')}</section>
        <button class="card" data-act="about" style="text-align:left;background:var(--card2)"><h3 style="font-family:var(--body);font-weight:800;font-size:17px">About the book and the author</h3><div class="small" style="color:var(--text);margin-top:4px">How to read the directions (mauka, makai, ʻEwa, Diamond Head), and the story behind these walks.</div></button>
        <div style="text-align:center"><div class="italic" style="color:var(--leaf)">For Alice and Ezra</div><button class="small" data-act="credits" style="margin-top:4px">© 2026 Veneeta Acson · Credits</button></div>
      </div></div>`;
  }

  let factTimer, factIdx = 0;
  const factPool = [...D.facts].sort(() => Math.random() - 0.5);
  function showFact() {
    const el = document.getElementById('ftxt'); if (!el) return;
    const f = factPool[factIdx % factPool.length]; el.style.opacity = 0;
    setTimeout(() => { const src = document.getElementById('fsrc'); if (!src || !el.isConnected) return; el.textContent = f.text; src.textContent = `From Walk ${wn(f.walkId)}, ${walk(f.walkId).title}`; el.style.opacity = 1; }, 220);
  }

  // Locked stops show the first photo and opening lines, fading out, with a one-tap unlock.
  function teaser(s) {
    const first = s.photos[0], second = s.photos[1];
    const p = (s.blocks.find((b) => b.kind === 'p') || {}).text || '';
    const lines = p.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
    return `<button data-act="paywall" style="text-align:left;display:flex;flex-direction:column;gap:10px;width:100%">
      ${first && IMG[first.file] ? `<div style="display:flex;gap:8px;width:100%"><img src="${IMG[first.file]}" alt="" style="flex:2;min-width:0;height:170px;object-fit:cover;border-radius:16px">${second && IMG[second.file] ? `<span style="flex:1;position:relative;border-radius:16px;overflow:hidden"><img src="${IMG[second.file]}" alt="" style="width:100%;height:170px;object-fit:cover;filter:blur(14px);transform:scale(1.2)"><span style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.25);color:#fff;font-weight:800;font-size:13px">${ic('lock', 'width="22" height="22"')}+${s.photos.length - 1} photos</span></span>` : ''}</div>` : ''}
      ${lines ? `<div style="position:relative"><p class="p">${esc(lines)}</p><span style="position:absolute;left:0;right:0;bottom:0;height:44px;background:linear-gradient(transparent,var(--bg))"></span></div>` : ''}
      <span class="lock" style="background:var(--accent);border-color:var(--accent);color:#fff">${ic('unlock', 'width="22" height="22"')}<span style="flex:1"><span style="display:block;font-weight:800">Keep reading with Veneeta</span><span style="font-size:13px;opacity:.9">Unlock every walk, stop, and photo</span></span></span>
    </button>`;
  }

  function renderWalk() {
    const w = walk(S.walkId), prog = S.progress[w.id];
    const startLabel = !canStart(w.id) ? 'Unlock this walk' : S.active === w.id ? 'Return to walk' : prog && prog.finishedAt ? 'Walk it again' : prog && prog.visited.length ? 'Continue walk' : 'Start walk';
    const chips = [w.facts.distance && `<span class="chip">${ic('steps', 'width="14" height="14"')} ${esc(w.facts.distance)}</span>`, w.facts.duration && `<span class="chip">${ic('time', 'width="14" height="14"')} ${esc(w.facts.duration)}</span>`, `<span class="chip">${ic('pin', 'width="14" height="14"')} ${w.stops.length} stops</span>`, w.id === TRIAL.walkId && !S.isPro ? `<span class="chip" style="color:var(--gold)">${ic('gift', 'width="14" height="14"')} First ${TRIAL.freeStops} free</span>` : ''].filter(Boolean).join('');
    const stops = `<div class="pad stack" style="gap:8px;margin-top:22px"><h2 style="font-size:22px">The stops</h2><p class="small" style="margin:0 0 4px">Tap a stop to read it, then swipe or use Next to go through them one at a time.</p>${w.stops.map((s, i) => {
      const locked = !canOpen(w.id, i), seen = prog && prog.visited.includes(i);
      return `<button class="stoprow" data-read="${i}"><span class="num" style="background:${locked ? '#8A9A9B' : w.color}">${s.n}</span><div style="flex:1;min-width:0"><div class="srt">${esc(s.title)}</div>${s.subtitle ? `<div class="small italic">${esc(s.subtitle)}</div>` : ''}</div><span class="srmark" style="color:${locked ? 'var(--muted)' : seen ? 'var(--leaf)' : 'var(--primary)'}">${ic(locked ? 'lock' : seen ? 'check' : 'fwd', 'width="18" height="18"')}</span></button>`;
    }).join('')}</div>`;
    return `<div class="screen" id="walk" style="padding-bottom:120px">
      <div id="readview" class="${S.mode === 'read' ? '' : 'hidden'}">
        <div class="whero">${img(w.cover) || `<div style="height:100%;background:${w.color}"></div>`}<div class="fade"></div><div class="flower" style="right:-24px;bottom:40px">${hib(110, '#D6336C', 25)}</div></div>
        <div class="pad stack wtitle"><span class="romanchip" style="background:${w.color}">Walk ${wn(w.id)}</span><h1>${esc(w.title)}</h1><div class="italic" style="color:var(--leaf);font-size:19px">${esc(w.theme)}</div><div class="chips">${chips}</div>
          ${blocksHtml(w.intro, w.id + '-intro')}${infoBox(w.info)}</div>
        ${stops}
      </div>
    </div>
    <div id="mapview" class="${S.mode === 'map' ? '' : 'hidden'}" style="position:absolute;inset:0">${S.mapStyle === 'book' && bookOk(w) ? bookPane(w) : '<div class="map" id="wmap"></div>' + zoomBtns()}${styleSwitch(w)}${overlayCtl(w)}<div class="maprail" id="rail">${w.stops.map((s, i) => `<button class="mcard ${i === S.focus ? 'on' : ''}" data-card="${i}">${!canOpen(w.id, i) ? `<span class="ph" style="background:#8A9A9B;color:#fff">${ic('lock')}</span>` : s.photos[0] && IMG[s.photos[0].file] ? img(s.photos[0].file) : `<span class="ph" style="background:${w.color}">${hib(40, '#fff')}</span>`}<div style="min-width:0"><div class="label">Stop ${s.n}</div><div style="font-weight:800;line-height:1.25">${esc(s.title)}</div><div class="small" style="color:var(--primary);margin-top:3px">${canOpen(w.id, i) ? 'Read this stop' : 'Unlock to read'}</div></div></button>`).join('')}</div><div class="attrib">© OpenStreetMap contributors</div></div>
    <div class="topbar"><button class="iconbtn" data-act="back" aria-label="Back">${ic('back')}</button><div class="seg" role="tablist"><button role="tab" aria-selected="${S.mode === 'read'}" data-mode="read">${ic('book')} Read</button><button role="tab" aria-selected="${S.mode === 'map'}" data-mode="map">${ic('map')} Map</button></div><button class="iconbtn" data-act="fit" aria-label="Show all stops">${ic('scan')}</button></div>
    <div class="cta ${S.mode === 'read' ? 'solid' : ''}"><button class="btn block ${canStart(w.id) ? '' : 'accent'}" data-act="start">${ic(canStart(w.id) ? 'navigate' : 'unlock')} ${startLabel}</button>${S.progress[w.id] && S.progress[w.id].visited.length ? `<button class="resetw" data-act="resetwalk">Start this walk over</button>` : ''}</div>`;
  }

  // Veneeta's own map from the book, as a full map view (zoom with + and -, drag or scroll to pan).
  // Where a lat/lng falls on Veneeta's map, as percentages of the image (scripts/georef fits each map to real streets).
  // Some walks span several map pages in the book (Walk 8 has 2, Walk 10 has 4). Show one page at a time,
  // the one that prints the stop you're on, with buttons to switch.
  function bmPages(w) {
    const g = (D.bookmaps || {})[w.id]; if (!g) return [];
    return [{ ...g, file: w.bookMap || g.file }, ...(g.pages || []).map((p) => ({ ...p, origin: g.origin, k: g.k, scale: g.scale }))];
  }
  function pageFor(w, i) {
    const ps = bmPages(w), n = w.stops[i] && String(w.stops[i].n);
    const k = ps.findIndex((p) => n && (p.labels || {})[n]);
    return k >= 0 ? k : 0;
  }
  function bm(w) {
    const ps = bmPages(w); if (!ps.length) return null;
    S.bookPage = S.bookPage || {};
    const k = Math.min(S.bookPage[w.id] || 0, ps.length - 1);
    return ps[k];
  }
  function bookXY(w, lat, lng) {
    const g = bm(w); if (!g) return null;
    const x = (lng - g.origin[1]) * g.k[0] / g.scale, y = (lat - g.origin[0]) * g.k[1] / g.scale, f = g.fwd;
    let px = f.a[0][0] + x * f.a[1][0] + y * f.a[2][0], py = f.a[0][1] + x * f.a[1][1] + y * f.a[2][1];
    f.ctrl.forEach((c, i) => { const d = Math.hypot(x - c[0], y - c[1]); if (d > 0) { const u = d * d * Math.log(d); px += u * f.w[i][0]; py += u * f.w[i][1]; } });
    return [px / g.w * 100, py / g.h * 100];
  }
  // Her own printed stop numbers are the pins: invisible tap areas over them, a ring on the current stop, and the walker's dot.
  function bookPins(w) {
    const g = bm(w); if (!g) return '';
    const prog = S.progress[w.id] || { visited: [], current: -1 }, cur = S.view === 'go' ? prog.current : S.focus;
    const hits = w.stops.map((s, i) => { const L = (g.labels || {})[String(s.n)]; if (!L) return '';
      return `<button class="bhit ${i === cur ? 'on' : ''}" data-bpin="${i}" style="left:${L[0] / g.w * 100}%;top:${L[1] / g.h * 100}%" aria-label="Stop ${s.n}, ${esc(s.title)}"></button>`; }).join('');
    // Testing aid: where the app's own pins land on her map, to check they sit on her numbers.
    const chk = S.showPins ? w.stops.map((s, i) => { const p = bookXY(w, s.lat, s.lng); return p ? `<span class="bchk" style="left:${p[0]}%;top:${p[1]}%">${s.n}</span>` : ''; }).join('') : '';
    const me = S.view === 'go' && S.me ? bookXY(w, S.me.lat, S.me.lng) : null;
    // Her own dotted line between stops, filled in as each stop is reached (the intended route, never the walker's track),
    // in a see-through blue so her map shows through (Nick, 19 Nov 2026).
    const reachedN = prog.finishedAt ? Infinity : Math.max(0, ...(prog.visited || []).map((i) => w.stops[i] ? w.stops[i].n : 0));
    const legs = Object.entries(g.legs || {}).filter(([n]) => Number(n) + 1 <= reachedN);
    const line = (pts, id) => `<polyline ${id ? `id="${id}" ` : ''}points="${pts.map((q) => q[0] + ',' + q[1]).join(' ')}" fill="none" stroke="${BOOK_TRAIL}" stroke-width="11" stroke-opacity=".45" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    const trail = `<svg class="btrail" id="btrail" viewBox="0 0 ${g.w} ${g.h}" preserveAspectRatio="none" aria-hidden="true">${legs.map(([, pts]) => line(pts)).join('')}${line(legPart(w, g), 'btrail-cur')}</svg>`;
    return trail + hits + chk + `<span class="bme" id="bme" style="${me ? `left:${me[0]}%;top:${me[1]}%` : 'display:none'}"><span class="bcone" id="bcone" style="transform:rotate(${bookHeading(w)}deg)"></span></span>`;
  }
  // While walking toward a stop, her dotted line from the previous stop fills in as far as the walker has come along it.
  // The walker's position is projected onto her line (so the fill always lies on the intended route), and it never
  // shrinks when someone doubles back. Only near the line counts, so a detour elsewhere draws nothing.
  // Distance along a polyline to the point nearest (x, y), and how far off the line that point is.
  function alongLine(pts, x, y) {
    let best = { d: Infinity, s: 0 }, acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (L * L))), d = Math.hypot(ax + t * dx - x, ay + t * dy - y);
      if (d < best.d) best = { d, s: acc + t * L };
      acc += L;
    }
    return best;
  }
  // The first `s` of a polyline's length, ending exactly at that point.
  function lineUpTo(pts, s) {
    const out = [pts[0]]; let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay);
      if (acc + L >= s) { const t = L ? (s - acc) / L : 0; out.push([ax + t * (bx - ax), ay + t * (by - ay)]); return out; }
      out.push(pts[i]); acc += L;
    }
    return out;
  }
  function legPart(w, g) {
    const prog = S.progress[w.id]; if (!prog || prog.current < 1 || !g || !g.legs) return [];
    const from = w.stops[prog.current - 1], pts = from && g.legs[String(from.n)]; if (!pts) return [];
    const key = w.id + ':' + from.n; S.legProg = S.legProg || {};
    if (prog.visited.includes(prog.current)) return pts;
    if (S.me) {
      const p = bookXY(w, S.me.lat, S.me.lng);
      if (p) {
        const r = alongLine(pts, p[0] / 100 * g.w, p[1] / 100 * g.h);
        if (r.d <= Math.max(g.w, g.h) * 0.03 && r.s > (S.legProg[key] || 0)) S.legProg[key] = r.s;
      }
    }
    return S.legProg[key] > 0 ? lineUpTo(pts, S.legProg[key]) : [];
  }
  function paintLegPart(w) {
    const el = document.getElementById('btrail-cur'), g = bm(w); if (!el || !g) return;
    el.setAttribute('points', legPart(w, g).map((q) => q[0] + ',' + q[1]).join(' '));
  }
  // Which way is north on this map page, in degrees clockwise from straight up. Her maps are drawn mauka-up, not north-up.
  function bookNorth(w) {
    const g = bm(w); if (!g) return 0;
    const c = w.stops.find(onMap) || { lat: 21.28, lng: -157.83 }, a = bookXY(w, c.lat, c.lng), b = bookXY(w, c.lat + 0.002, c.lng);
    if (!a || !b) return 0;
    return Math.atan2((b[0] - a[0]) * g.w, -(b[1] - a[1]) * g.h) * 180 / Math.PI;
  }
  const bookHeading = (w) => ((S.heading || 0) + bookNorth(w)) % 360;
  function paintBookDot(w) {
    const bme = document.getElementById('bme'); if (!bme || !S.me) return;
    const p = bookXY(w, S.me.lat, S.me.lng); if (!p) return;
    bme.style.display = ''; bme.style.left = p[0] + '%'; bme.style.top = p[1] + '%';
    const c = document.getElementById('bcone'); if (c) c.style.transform = `rotate(${bookHeading(w)}deg)`;
    if (S.bookFollow) centerBookOnMe(true);
  }
  // Scroll her map so the walker's dot is in the middle of the visible part (above the sheet).
  function centerBookOnMe(smooth) { centerBookOn(document.getElementById('bme'), smooth); }
  // Same, for the ring on the current stop's printed number (after Next, Previous or a tap on a stop).
  function centerBookOnStop(smooth) { centerBookOn(document.querySelector('.bhit.on'), smooth); }
  function centerBookOn(dot, smooth) {
    const pane = document.getElementById('bookpane'); if (!pane || !dot || dot.style.display === 'none') return;
    const wrap = dot.parentElement, visibleH = pane.clientHeight - (S.view === 'go' ? sheetPx() : 0);
    const x = wrap.offsetLeft + dot.offsetLeft, y = wrap.offsetTop + dot.offsetTop; // bookwrap is positioned inside the scrolling pane
    S.bookAuto = Date.now();
    pane.scrollTo({ left: x - pane.clientWidth / 2, top: y - visibleH / 2, behavior: smooth ? 'smooth' : 'auto' });
  }
  // + and - for both maps, at the bottom right of the map (Nick, 19 Nov 2026)
  function zoomBtns() {
    const book = S.mapStyle === 'book';
    return `<div class="zoombtns"><button class="mapbtn" data-zoom="1" aria-label="Zoom in">+</button><button class="mapbtn" data-zoom="-1" aria-label="Zoom out">&minus;</button></div>`;
  }
  function bookPane(w) {
    // Open the page that prints the current stop; a tap on "Map 2" etc. sticks until the stop changes.
    const prog = S.progress[w.id] || { current: -1 }, cur = S.view === 'go' ? prog.current : S.focus;
    S.bookPage = S.bookPage || {}; S.bookPageStop = S.bookPageStop || {};
    if (S.bookPageStop[w.id] !== cur) { S.bookPage[w.id] = pageFor(w, Math.max(0, cur)); S.bookPageStop[w.id] = cur; }
    const ps = bmPages(w), g = bm(w), k = Math.min((S.bookPage || {})[w.id] || 0, Math.max(0, ps.length - 1));
    const tabs = ps.length > 1 ? `<div class="bookpages" role="tablist">${ps.map((p, j) => `<button role="tab" aria-selected="${j === k}" data-bookpage="${j}">Map ${j + 1}</button>`).join('')}</div>` : '';
    // Open zoomed so her map fills the height between the header and the sheet (no empty band below it), until the walker zooms.
    if (!S.bookZoomUser && g) {
      const W = $app.clientWidth || 390, H = $app.clientHeight || 800, vis = H - 110;
      S.bookZoom = Math.max(1, Math.min(5, vis / (W * g.h / g.w)));
    }
    return `<div class="bookpane" id="bookpane"><div class="bookimg" style="width:${(S.bookZoom || 1.6) * 100}%"><div class="bookwrap">${img(g ? g.file : w.bookMap, '', 'Walk ' + wn(w.id) + ' map ' + (k + 1) + ' from the book')}${bookPins(w)}</div></div></div>${tabs}
      <button class="pinchk" data-act="pinchk" aria-pressed="${!!S.showPins}">${S.showPins ? 'Hide' : 'Check:'} app pins</button>
      ${zoomBtns()}`;
  }
  // Testing aid: lay her map (warped onto real coordinates) over the street map and fade between them.
  function overlayCtl(w) {
    if (!S.demo || S.mapStyle === 'book' || !S.isPro || !(window.WWWARP || {})[w.id]) return '';
    return `<label class="overlayctl">Street<input type="range" min="0" max="100" value="${S.overlay || 0}" data-overlay aria-label="Book map overlay strength">Book map</label>`;
  }
  function addOverlay(mapObj, w) {
    const url = (window.WWWARP || {})[w.id], b = (D.bookwarp || {})[w.id]; if (!url || !b || !mapObj) return null;
    const o = L.imageOverlay(url, b, { opacity: (S.overlay || 0) / 100, interactive: false }).addTo(mapObj);
    return o;
  }
  function styleSwitch(w) {
    if (!bookOk(w)) return '';
    return `<div class="mapstyle" role="tablist" aria-label="Map style"><button role="tab" data-mapstyle="street" aria-selected="${S.mapStyle !== 'book'}">Street map</button><button role="tab" data-mapstyle="book" aria-selected="${S.mapStyle === 'book'}">${ic('book', 'width="14" height="14"')} Book map</button></div>`;
  }

  // One stop per page, like turning pages in the book.
  function renderStop() {
    const w = walk(S.walkId), i = S.stopIdx, s = w.stops[i], locked = !canOpen(w.id, i), fav = S.favs.includes(s.id);
    return `<div class="screen" id="stopread" style="padding-bottom:150px"><div class="pad stack page ${S.pageAnim || ''}" style="gap:14px;padding-top:calc(env(safe-area-inset-top) + 76px)">
      <div class="stophead"><span class="num" style="background:${locked ? '#8A9A9B' : w.color}">${s.n}</span><div><div class="label">Stop ${s.n} of ${w.stops.length}</div><h2>${esc(s.title)}</h2>${s.subtitle ? `<div class="italic small">${esc(s.subtitle)}</div>` : ''}</div></div>${wave(70, w.color)}
      ${locked ? teaser(s) : `<div class="actions"><button class="action" data-listen="${s.id}" data-i="${i}">${ic('volume')} Listen</button><button class="action" data-onmap="${i}">${ic('map')} On map</button><button class="action" data-fav="${s.id}" aria-label="${fav ? 'Remove from saved' : 'Save stop'}" style="color:var(--accent)">${ic(fav ? 'heartFill' : 'heart')}</button></div>
      ${photosHtml(s.photos)}${blocksHtml(s.blocks, s.id)}`}
    </div></div>
    <div class="topbar"><button class="iconbtn" data-act="stopback" aria-label="All stops">${ic('back')}</button><div class="gopill"><div class="label">Walk ${wn(w.id)}</div><div>${esc(w.title)}</div></div><span style="width:44px;flex:none"></span></div>
    <div class="pager"><button class="pbtn" data-step="-1" ${i === 0 ? 'disabled' : ''} aria-label="Previous stop">${ic('prev')} Previous</button><span class="pcount">${s.n} / ${w.stops.length}</span><button class="pbtn" data-step="1" ${i === w.stops.length - 1 ? 'disabled' : ''} aria-label="Next stop">Next ${ic('fwd')}</button></div>`;
  }
  function stepStop(d) {
    const w = walk(S.walkId), n = S.stopIdx + d;
    if (n < 0 || n >= w.stops.length) return;
    stopSpeak(); S.stopIdx = n; S.focus = n; S.pageAnim = d > 0 ? 'from-r' : 'from-l'; render(); S.pageAnim = '';
    const sc = document.getElementById('stopread'); if (sc) sc.scrollTop = 0;
  }
  function bindSwipe(el) {
    let x0 = null, y0 = 0, t0 = 0, skip = false;
    el.addEventListener('touchstart', (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); skip = !!e.target.closest('.photos, .maprail'); }, { passive: true });
    el.addEventListener('touchend', (e) => { if (skip || x0 === null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8 && Date.now() - t0 < 700) stepStop(dx < 0 ? 1 : -1); }, { passive: true });
  }

  // The walking line from stop i to the next: her red route traced from the book map where we have it, else straight.
  const SIDE_TRIP = '#8E6BB8';  // her map's purple side-trip line
  const TRAIL = '#1A73E8';  // blue for the walked trail and the leg ahead, on the street map and the book map (Nick, 19 Nov 2026)
  const BOOK_TRAIL = '#1A73E8';
  const ROUTE_DOTS = '#F0A04B';
  const PIN = '#1A73E8', PIN_HERE = '#D6336C';  // stop pins: blue, and red for the current stop  // her dotted route, in a yellow-orange that reads on the street map  // the walked part of her dotted line on the book map, see-through blue
  const onMain = (s) => onMap(s) && !s.side;
  function between(w, i, j) {
    const a = w.stops[i], b = w.stops[j]; if (!a || !b) return [];
    const key = j === i + 1 ? String(a.n) : `${a.n}>${b.n}`;
    const A = [a.lat, a.lng], B = [b.lat, b.lng], leg = ((D.routes || {})[w.id] || {})[key];
    if (!leg || leg.length < 2) return [A, B];
    return leg; // her dotted line as traced, exactly: no jog out to a pin printed beside it (22 Nov 2026)
  }
  // The walking line from stop i to the next: her traced red route, else a walking route along streets, else straight.
  function legPath(w, i) {
    const a = w.stops[i], b = w.stops[i + 1]; if (!a || !b) return [];
    if (a.side || b.side) return [[a.lat, a.lng], [b.lat, b.lng]];
    return between(w, i, i + 1);
  }
  // The main route through the stops her map prints, skipping side-trip stops.
  // A stop's spot on her line: where a perpendicular from the printed number meets her dotted line (Nick, 27 Nov 2026).
  // Walkers stand there, the blue trail ends there, and the line stops there at a lock, so nobody is put in the water.
  function nearestOn(path, lat, lng) {
    const k = Math.cos(21.3 * Math.PI / 180), xy = ([la, ln]) => [ln * 111320 * k, la * 110574], P = xy([lat, lng]); let best = null;
    for (let i = 0; i < path.length - 1; i++) {
      const A = xy(path[i]), B = xy(path[i + 1]), dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy;
      const t = L2 ? Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / L2)) : 0;
      const d = Math.hypot(A[0] + t * dx - P[0], A[1] + t * dy - P[1]);
      if (!best || d < best.d - 1e-6) best = { d, i, pt: [path[i][0] + t * (path[i + 1][0] - path[i][0]), path[i][1] + t * (path[i + 1][1] - path[i][1])] };
    }
    return best;
  }
  const mainIdx = (w) => w.stops.map((s, i) => (onMain(s) ? i : -1)).filter((i) => i >= 0);
  // Her line from the start to stop `upto`'s spot on it (the whole line when upto is omitted).
  function walkPath(w, upto) {
    const all = mainIdx(w), idx = all.filter((i) => upto == null || i <= upto), out = [];
    if (!idx.length) return out;
    const last = idx[idx.length - 1], next = all[all.indexOf(last) + 1];
    idx.slice(0, -1).forEach((i, k) => { const seg = between(w, i, idx[k + 1]); out.push(...(k < idx.length - 2 ? seg.slice(0, -1) : [])); });
    const into = idx.length > 1 ? between(w, idx[idx.length - 2], last) : [], outof = next !== undefined && upto != null ? between(w, last, next) : [];
    if (upto == null || next === undefined) { if (into.length) out.push(...into); else out.push([w.stops[last].lat, w.stops[last].lng]); return out; }
    const cand = into.length ? into.slice(0, -1).concat(outof) : outof;
    const f = cand.length > 1 && nearestOn(cand, w.stops[last].lat, w.stops[last].lng);
    if (!f) { out.push(...into); return out; }
    out.push(...cand.slice(0, f.i + 1), f.pt);
    return out;
  }
  function footAt(w, i) {
    const s = w.stops[i]; if (!onMain(s)) return { lat: s.lat, lng: s.lng };
    const p = walkPath(w, i), q = p[p.length - 1]; return q ? { lat: q[0], lng: q[1] } : { lat: s.lat, lng: s.lng };
  }
  function sidePaths(w) {
    return w.stops.flatMap((s, i) => {
      if (!s.side || !onMap(s)) return [];
      const before = w.stops.slice(0, i).reverse().find(onMain), after = w.stops.slice(i + 1).find(onMain);
      return [[before, s, after].filter(Boolean).map((x) => [x.lat, x.lng])];
    });
  }
  // Shared Leaflet map builder with offline tiles.
  function makeMap(el, w, opts) {
    const T = window.WWTILES || {};
    const Layer = L.GridLayer.extend({ createTile(c) { const t = document.createElement('img'); const k = `${c.z}/${c.x}/${c.y}`; if (T[k]) t.src = T[k]; else { t.style.background = '#e9e5dc'; } t.alt = ''; return t; } });
    const map = L.map(el, { zoomControl: false, attributionControl: false, minZoom: 13, maxZoom: 18, touchZoom: true, bounceAtZoomLimits: false });
    new Layer({ maxNativeZoom: 16, minNativeZoom: 14, tileSize: 256 }).addTo(map);
    map.on('dragstart', () => { if (S.follow !== 'off') { S.follow = 'off'; el.style.transform = ''; const b = document.querySelector('[data-act="locate"]'); if (b) { b.classList.remove('on'); b.innerHTML = ic('navigate'); } } });
    const pts = w.stops.map((s) => [s.lat, s.lng]);
    // Only stops her book map prints get a pin, so this map shows what her map shows.
    const lim = lastOpen(w);
    const lockIdx = w.stops.findIndex((st, i) => i > lim && onMap(st));  // the first stop still locked shows as a lock; nothing past it
    const mapPts = w.stops.filter((st, i) => onMap(st) && (i <= lim || i === lockIdx)).map((st) => [st.lat, st.lng]);
    // Her route as on her map: a dotted yellow line. The part walked fills in solid blue over it (Nick, 21 Nov 2026).
    // Free trial: the line runs the whole walk, open stops show numbers, the next one shows a lock.
    const route = lockIdx >= 0 ? walkPath(w, lockIdx) : walkPath(w);  // her dotted line, cut at the lock when the walk is not fully open (Nick, 26 Nov 2026)
    L.polyline(route.length > 1 ? route : mapPts, { color: ROUTE_DOTS, weight: 4, dashArray: '9 7', lineCap: 'butt' }).addTo(map);
    const sideStops = w.stops.filter((st) => st.side && onMap(st));
    sidePaths(w).forEach((p, k) => { if (w.stops.indexOf(sideStops[k]) <= lim) L.polyline(p, { color: SIDE_TRIP, weight: 3, dashArray: '4 6' }).addTo(map); });
    const markers = w.stops.map((s, i) => {
      if (!onMap(s) || (i > lim && i !== lockIdx)) return null;
      const m = L.marker([s.lat, s.lng], { icon: L.divIcon({ className: '', html: '', iconSize: [28, 28] }) }).addTo(map);
      m.on('click', () => opts.onSelect && opts.onSelect(i));
      return m;
    });
    // The part already walked, solid and bright over the dashed route, so the circuit fills in as you go.
    const trail = L.polyline([], { color: TRAIL, weight: 10, opacity: .4, lineCap: 'round' }).addTo(map);  // solid, so it covers the orange dots under it (Nick, 26 Nov 2026)
    const part = L.polyline([], { color: TRAIL, weight: 10, opacity: .4, lineCap: 'round' }).addTo(map);  // the leg being walked, as far as the walker has come
    const me = L.marker([0, 0], { icon: L.divIcon({ className: '', html: '<div class="me"><span class="cone"></span></div>', iconSize: [18, 18] }), interactive: false, zIndexOffset: 2000 });
    const api = {
      zoomIn() { map.zoomIn(); }, zoomOut() { map.zoomOut(); },
      map,
      paint(cur, visited) {
        markers.forEach((m, i) => {
          if (!m) return;
          const s = w.stops[i], locked = !canOpen(w.id, i), done = visited.includes(i), isCur = i === cur;
          // One color for every stop, red for the one you're heading to or at, purple for her side trips (Nick, 21 Nov 2026).
          const bg = isCur ? PIN_HERE : s.side ? SIDE_TRIP : PIN;
          m.setIcon(L.divIcon({ className: '', html: `<div class="pin ${isCur ? 'cur' : ''}" style="background:${bg}">${locked ? ic('lock', 'width="11" height="11"') : s.n}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }));
          m.setZIndexOffset(isCur ? 1000 : 0);
        });
        const p = S.progress[w.id], reached = p && p.finishedAt ? w.stops.length - 1 : Math.max(-1, ...visited);
        trail.setLatLngs(reached > 0 ? walkPath(w, reached) : []);
        api.part();
      },
      // The leg toward the current stop fills in along her route up to the walker's nearest point on it.
      part() {
        const p = S.progress[w.id]; if (!p || p.current < 1 || p.visited.includes(p.current) || !opts.showSeg) return part.setLatLngs([]);
        const leg = legPath(w, p.current - 1); if (!leg || leg.length < 2) return part.setLatLngs([]);
        const k = Math.cos(21.3 * Math.PI / 180), xy = leg.map(([la, ln]) => [ln * 111320 * k, la * 110574]);
        const key = 'st:' + w.id + ':' + (p.current - 1); S.legProg = S.legProg || {};
        if (S.me) { const r = alongLine(xy, S.me.lng * 111320 * k, S.me.lat * 110574); if (r.d <= 40 && r.s > (S.legProg[key] || 0)) S.legProg[key] = r.s; }
        const sDone = S.legProg[key] || 0;
        part.setLatLngs(sDone > 0 ? lineUpTo(xy, sDone).map(([x, y]) => [y / 110574, x / (111320 * k)]) : []);
      },
      fit() { if (!mapPts.length) { map.setView([21.2900, -157.8200], 14); return; } map.fitBounds(L.latLngBounds(mapPts), { paddingTopLeft: [40, 80], paddingBottomRight: [40, opts.bottom || 40] }); },
      focus(i) { if (!onMap(w.stops[i])) return; const c = map.project(pts[i], 17).add([0, (opts.bottom || 0) / 2]); map.setView(map.unproject(c, 17), 17, { animate: true }); }, // centered in the part above the sheet
      me(p, heading) {
        if (!p) return;
        if (!map.hasLayer(me)) me.addTo(map);
        me.setLatLng([p.lat, p.lng]);
        const c = me.getElement() && me.getElement().querySelector('.cone'); if (c) c.style.transform = `rotate(${heading || 0}deg)`;
        // Follow mode keeps the walker centered, as in Apple Maps.
        if (S.follow !== 'off') map.setView([p.lat, p.lng], Math.max(map.getZoom(), 17), { animate: true });
        if (S.follow === 'heading') { el.style.transform = `rotate(${-(heading || 0)}deg) scale(1.45)`; el.style.transformOrigin = '50% 50%'; } else { el.style.transform = ''; }
      },
    };
    api.fit();
    return api;
  }

  let wmap = null;
  function mountWalkMap() {
    const w = walk(S.walkId);
    if (!document.getElementById('wmap')) { wmap = null; return; }
    if (!wmap) {
      setTimeout(() => { if (wmap) wmap.overlay = addOverlay(wmap.map, w); }, 0);
      wmap = makeMap(document.getElementById('wmap'), w, { bottom: 200, onSelect: (i) => { S.focus = i; syncRail(true); wmap.paint(S.focus, (S.progress[w.id] || { visited: [] }).visited); } });
    }
    const whole = S.showWhole; S.showWhole = false;
    setTimeout(() => { wmap.map.invalidateSize(); wmap.paint(whole ? -1 : S.focus, (S.progress[w.id] || { visited: [] }).visited); if (whole) wmap.fit(); else wmap.focus(S.focus); syncRail(false); }, 50);
  }
  function syncRail(scroll) {
    document.querySelectorAll('.mcard').forEach((c) => c.classList.toggle('on', Number(c.dataset.card) === S.focus));
    if (scroll) { const c = document.querySelector(`.mcard[data-card="${S.focus}"]`); c && c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }
  }

  // Active walk
  let gmap = null, simTimer = null;
  function renderGo() {
    const w = walk(S.walkId), prog = S.progress[w.id], cur = prog.current, stop = w.stops[cur], visited = prog.visited, here = visited.includes(cur);
    const nextLocked = cur + 1 < w.stops.length && !canOpen(w.id, cur + 1);
    let navLine = 'Allow location to walk for real, switch on Demo mode at the top, or tap “I’m here”.';
    let rot = 0;
    if (stop.look) navLine = 'Look around as you walk on. Tap Next when you are ready.';
    else if (here) navLine = 'Read or listen below, then tap Next.';
    else if (S.me) { const d = dist(S.me, stop), b = bearing(S.me, stop); rot = b - S.heading; navLine = `${fmt(d)} · about ${Math.max(1, Math.round(d / 67))} min · head ${hawaiianDir(b)}`; }
    return `<div id="go" style="position:absolute;inset:0">
      <div class="mapwrap">${S.mapStyle === 'book' && bookOk(w) ? bookPane(w) : '<div class="map" id="gmap"></div><div class="attrib">© OpenStreetMap contributors</div>' + zoomBtns()}${styleSwitch(w)}${overlayCtl(w)}</div>
      <div class="gohead"><button class="iconbtn" data-act="minimize" aria-label="Minimize walk">${ic('down')}</button><div class="gopill"><div class="label">Walk ${wn(w.id)} · ${visited.length}/${w.stops.length}</div><div>${esc(w.title)}</div></div><button class="iconbtn" data-act="end" aria-label="End walk">${ic('close')}</button></div>
      ${S.demo ? `<button class="simtoggle" data-act="sim" aria-pressed="${S.sim}">${S.sim ? '⏸ Pause demo walk' : '▶ Resume demo walk'}</button>` : ''}${true ? `<div class="simbar"><button class="mapbtn ${S.follow !== 'off' ? 'on' : ''}" data-act="locate" aria-label="Center on me">${ic(S.follow === 'heading' ? 'compass' : 'navigate')}</button><button class="mapbtn" data-act="whole" aria-label="Show whole walk">${ic('map')}</button></div>` : ''}
      ${S.arrivedBanner !== null ? `<div class="arrived" role="status">${hib(26, '#fff')}<span>You’ve arrived: ${esc(w.stops[S.arrivedBanner].title)}</span></div>` : ''}
      <div class="sheet" id="sheet">
        <div class="grab" id="grab" role="button" aria-label="Drag or tap to resize"><span class="handle"></span></div>
        <div class="viewsw" role="tablist" aria-label="Show map, both, or text">${[['peek', 'map', 'Map'], ['half', 'split', 'Both'], ['full', 'reader', 'Text']].map(([d, icn, t]) => `<button role="tab" data-detent="${d}" aria-selected="${S.detent === d}">${ic(icn, 'width="15" height="15"')} ${t}</button>`).join('')}</div>
        <div class="pager inline"><button class="pbtn" data-act="prev" ${cur === 0 ? 'disabled' : ''} aria-label="Previous stop">${ic('prev')} Previous</button><span class="pcount">Stop ${stop.n} of ${w.stops.length}</span><button class="pbtn" data-act="skip" ${cur >= w.stops.length - 1 ? 'disabled' : ''} aria-label="Skip to next stop">Next ${ic('fwd')}</button></div>
        <div class="nav ${here ? 'here' : ''}">${here ? `<span style="color:var(--leaf)">${ic('check', 'width="34" height="34"')}</span>` : `<span class="arrow" style="transform:rotate(${rot}deg)">${ic('navigate', 'width="30" height="30"')}</span>`}
          <div style="flex:1;min-width:0"><div class="label">${stop.look ? `Look from here: stop ${stop.n}` : here ? `You’re at stop ${stop.n}` : `Heading to stop ${stop.n}`}</div><h3>${esc(stop.title)}</h3><div class="small">${navLine}</div></div>
          ${!here ? `<button class="iconbtn" style="background:var(--primary);color:var(--onprimary);border:0" data-act="directions" aria-label="Walking directions">${ic('directions')}</button>` : ''}</div>
        <div class="gobody" id="gobody">${photosHtml(stop.photos)}${blocksHtml(stop.blocks, stop.id)}${stop.geo !== 'verified' ? `<p class="small italic">Pin location is a draft (${stop.geo}). Use “I’m here” if the alert doesn’t fire.</p>` : ''}</div>
        <div class="audiobar"><div class="modeseg" role="radiogroup" aria-label="Audio mode">${[['read', 'Read aloud'], ['gps', 'GPS linked'], ['off', 'Off']].map(([m, t]) => `<button role="radio" aria-checked="${S.settings.audioMode === m}" data-act="audiomode" data-mode="${m}">${t}</button>`).join('')}</div><button class="stopread" id="stopbtn" data-act="stopread" ${isReading() ? '' : 'hidden'}>${ic('stop')} Stop reading</button></div>
        <div class="controls">
          ${here ? `<button class="btn block ${nextLocked ? 'accent' : ''}" data-act="next">${ic(nextLocked ? 'unlock' : 'fwd')} ${cur + 1 >= w.stops.length ? 'Finish' : nextLocked ? 'Unlock next stop' : 'Next stop'}</button>` : `<button class="btn block" data-act="here">${ic('flag')} I’m here</button>`}</div>
      </div></div>`;
  }
  function mountGoMap() {
    const w = walk(S.walkId), prog = S.progress[w.id];
    const el = document.getElementById('gmap'); if (!el) { gmap = null; return; }
    gmap = makeMap(el, w, { showSeg: true, bottom: sheetPx() + 10, onSelect: (i) => showStop(i) });
    gmap.overlay = addOverlay(gmap.map, w);
    gmap.paint(prog.current, prog.visited); gmap.me(S.me, S.heading);
    const toStop = S.stopFocus;
    setTimeout(() => { gmap.map.invalidateSize(); if (S.me && !toStop && S.follow !== 'off') gmap.map.setView([S.me.lat, S.me.lng], 17); else gmap.focus(prog.current); }, 60);
  }
  // Bottom sheet with three resting heights, like Apple Maps: peek, half, full.
  function detents() {
    const go = document.getElementById('go'), H = go ? go.clientHeight : 800;
    const part = (sel) => { const e = document.querySelector('#sheet ' + sel); return e ? e.offsetHeight : 0; };
    const nav = document.querySelector('#sheet .nav');
    // Map view: just the handle, the Map/Both/Text switch, where you are, and the buttons; no stop text.
    const peek = part('.grab') + part('.viewsw') + part('.pager') + (nav ? nav.offsetHeight + 14 : 0) + part('.controls');
    const full = H - (document.querySelector('.gohead') ? document.querySelector('.gohead').getBoundingClientRect().bottom - go.getBoundingClientRect().top + 8 : 70);
    return { peek, half: Math.max(peek + 60, Math.round(H * 0.56)), full };
  }
  function markDetent() { document.querySelectorAll('[data-detent]').forEach((b) => b.setAttribute('aria-selected', b.dataset.detent === S.detent)); }
  function sheetPx() { const d = detents(); return d[S.detent] || d.half; }
  function setSheet(px, animate) {
    const sh = document.getElementById('sheet'), go = document.getElementById('go'); if (!sh || !go) return;
    sh.classList.toggle('anim', !!animate); sh.style.height = px + 'px'; go.style.setProperty('--sh', px + 'px');
    const d = detents();
    go.classList.toggle('sheet-full', px >= d.full - 4);
    go.classList.toggle('sheet-peek', px <= d.peek + 24);
  }
  function mountSheet() {
    setSheet(sheetPx(), false);
    const sh = document.getElementById('sheet'); if (!sh) return;
    let y0 = null, h0 = 0, moved = false, fromBody = false, lastY = 0, lastT = 0, vel = 0;
    const handles = sh.querySelectorAll('.grab, .pager, .nav');
    const down = (e) => { if (e.target.closest('button') && !e.target.closest('.grab')) { y0 = e.clientY; h0 = sh.offsetHeight; moved = false; fromBody = false; lastY = e.clientY; lastT = Date.now(); return; } y0 = e.clientY; h0 = sh.offsetHeight; moved = false; fromBody = false; lastY = e.clientY; lastT = Date.now(); };
    handles.forEach((hd) => hd.addEventListener('pointerdown', down));
    const body = sh.querySelector('.gobody');
    // At full height, pulling down from the top of the text collapses the sheet, as in Maps.
    body.addEventListener('pointerdown', (e) => { if (body.scrollTop <= 0 && S.detent === 'full' && e.pointerType !== 'mouse') { y0 = e.clientY; h0 = sh.offsetHeight; moved = false; fromBody = true; lastY = e.clientY; lastT = Date.now(); } });
    const move = (e) => {
      if (y0 === null) return; const dy = e.clientY - y0;
      if (fromBody && dy < 0) { y0 = null; return; }
      if (!moved && Math.abs(dy) < 7) return;
      moved = true; const d = detents(); const now = Date.now(); vel = (e.clientY - lastY) / Math.max(1, now - lastT); lastY = e.clientY; lastT = now;
      setSheet(Math.max(d.peek - 30, Math.min(d.full, h0 - dy)), false);
    };
    const up = (e) => {
      if (y0 === null) return; const wasMoved = moved; y0 = null;
      const d = detents(), h = sh.offsetHeight;
      if (!wasMoved) { if (e.target.closest('.grab')) { S.detent = S.detent === 'peek' ? 'half' : S.detent === 'half' ? 'full' : 'peek'; setSheet(d[S.detent], true); markDetent(); } return; }
      let pick = ['peek', 'half', 'full'].reduce((a, k) => (Math.abs(d[k] - h) < Math.abs(d[a] - h) ? k : a), 'half');
      if (vel > 0.6) pick = h > d.half ? 'half' : 'peek'; else if (vel < -0.6) pick = h < d.half ? 'half' : 'full';
      S.detent = pick; setSheet(d[pick], true); markDetent();
      if (gmap) setTimeout(() => gmap.map.invalidateSize(), 260);
    };
    window.onpointermove = move; window.onpointerup = up; window.onpointercancel = up;
  }

  function arrive(i) {
    const w = walk(S.walkId), prog = S.progress[w.id];
    if (!prog.visited.includes(i)) prog.visited.push(i);
    prog.current = i; persist();
    S.arrivedBanner = i; setTimeout(() => { S.arrivedBanner = null; const b = document.querySelector('.arrived'); b && b.remove(); }, 4200);
    if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) {}
    render();
    if (S.settings.audioMode !== 'off') speakStop(w.stops[i]);
  }
  // Next, Previous, or a tap on a pin: stop following the walker and show that stop on the map.
  function showStop(i) { S.follow = 'off'; S.bookFollow = false; S.stopFocus = true; goTo(i); }
  function goTo(i) {
    const w = walk(S.walkId), prog = S.progress[w.id];
    if (i < 0) return;
    if (i >= w.stops.length) { finishWalk(); return; }
    if (!canOpen(w.id, i)) { stopSim(); openPaywall(); return; }
    stopSpeak(); prog.current = i;
    if (w.stops[i].look && !prog.visited.includes(i)) prog.visited.push(i); // looked at from her line: nothing to walk to
    persist(); render();
    if (S.settings.audioMode === 'read') speakStop(w.stops[i]);
  }
  // The demo follows Veneeta's red route line between stops (scripts/georef/routes.py), straight where it isn't traced.
  let simPath = null, simFor = null;
  // Where the walker stands for a stop: the end of her line into it (a look-at stop is seen from the line), else its pin.
  function standAt(w, i) { return footAt(w, i); }
  function tickSim() {
    const w = walk(S.walkId), prog = S.progress[w.id], target = w.stops[prog.current];
    // A stop her map doesn't print has no spot to walk to: the demo reads it and moves on.
    if (!onMap(target)) { if (!prog.visited.includes(prog.current)) { prog.visited.push(prog.current); persist(); } return; }
    if (!S.me) { const f = prog.current > 0 ? standAt(w, prog.current - 1) : null, prev = w.stops[Math.max(0, prog.current - 1)]; S.me = f || { lat: prev.lat - 0.0012, lng: prev.lng - 0.0009 }; }
    if (simFor !== w.id + ':' + prog.current) {
      simFor = w.id + ':' + prog.current;
      // Walk along her line from the previous stop's spot to this one's.
      const full = walkPath(w, prog.current), pre = prog.current > 0 ? walkPath(w, prog.current - 1) : [];
      const tail = full.slice(Math.max(0, pre.length - 1)).map(([lat, lng]) => ({ lat, lng }));
      simPath = (pre.length && dist(S.me, { lat: pre[pre.length - 1][0], lng: pre[pre.length - 1][1] }) < 80 ? tail : []).concat([standAt(w, prog.current)]);
    }
    if (!simPath || !simPath.length) simPath = [standAt(w, prog.current)];
    let budget = 18; // meters per tick (a brisk, sped-up walk)
    while (budget > 0 && simPath.length) {
      const nxt = simPath[0], d = dist(S.me, nxt);
      if (d <= budget) { S.me = { ...nxt }; budget -= d; if (simPath.length > 1) simPath.shift(); else break; }
      else { S.heading = bearing(S.me, nxt); const f = budget / d; S.me = { lat: S.me.lat + (nxt.lat - S.me.lat) * f, lng: S.me.lng + (nxt.lng - S.me.lng) * f }; budget = 0; }
    }
    // A look-at stop has no arrival: the demo counts it seen once it reaches that point on her line.
    if (target.look && !prog.visited.includes(prog.current) && dist(S.me, standAt(w, prog.current)) <= 3) { prog.visited.push(prog.current); persist(); render(); return; }
    afterMove(w, prog, target);
  }
  // After the walker's position changes (demo or real GPS): move the dot on both maps, check arrival, update the distance line.
  function afterMove(w, prog, target) {
    if (gmap) { gmap.me(S.me, S.heading); gmap.part(); }
    paintLegPart(w);
    paintBookDot(w);
    // Arrival check, same rule as the app: within the arrival radius plus a GPS allowance.
    if (onMap(target) && !target.look && dist(S.me, target) <= S.settings.arrival + (S.gpsAcc ? Math.min(S.gpsAcc, 30) * 0.5 : 0) && !prog.visited.includes(prog.current)) { arrive(prog.current); return; }
    const nav = document.querySelector('.nav .small'); if (nav && !prog.visited.includes(prog.current)) { const dd = dist(S.me, target); nav.textContent = `${fmt(dd)} · about ${Math.max(1, Math.round(dd / 67))} min · head ${hawaiianDir(bearing(S.me, target))}`; }
    const ar = document.querySelector('.nav .arrow'); if (ar) ar.style.transform = `rotate(${S.sim ? 0 : bearing(S.me, target) - S.heading}deg)`;
  }
  // Real GPS (Nick, 19 Nov 2026): while a walk is open and the demo is off, the phone's location moves the dot and triggers arrivals.
  let gpsWatch = null;
  function startGps() {
    if (gpsWatch !== null || !navigator.geolocation) return;
    gpsWatch = navigator.geolocation.watchPosition((p) => {
      S.gpsAcc = p.coords.accuracy;
      if (S.sim || S.view !== 'go') return;
      S.me = { lat: p.coords.latitude, lng: p.coords.longitude };
      if (p.coords.heading != null && !isNaN(p.coords.heading)) S.heading = p.coords.heading;
      const w = walk(S.walkId), prog = S.progress[w.id]; if (!prog) return;
      afterMove(w, prog, w.stops[prog.current]);
    }, (e) => { gpsWatch = null; if (e.code === 1 && !S.sim && !S.gpsToasted) { S.gpsToasted = true; toast('Location is off for this page. Allow location to walk for real, or switch on Demo mode at the top.'); } }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 });
  }
  function stopGps() { if (gpsWatch !== null) { navigator.geolocation.clearWatch(gpsWatch); gpsWatch = null; } }
  // Demo walk: the dot walks to each stop, pauses there a few seconds, then carries on to the next one by itself.
  let simPause = 0;
  function startSim() {
    S.sim = true; clearInterval(simTimer); simPause = 0;
    simTimer = setInterval(() => {
      const w = walk(S.walkId), prog = S.progress[S.walkId]; if (!prog) return;
      if (prog.visited.includes(prog.current)) {
        const t = w.stops[prog.current];
        if (S.me && dist(S.me, standAt(w, prog.current)) > 3) { tickSim(); return; }
        if (++simPause < 6) return;
        simPause = 0;
        const next = prog.current + 1;
        if (next >= w.stops.length) { stopSim(); toast('Demo walk finished.'); return; }
        if (!canOpen(w.id, next)) { stopSim(); toast('Demo walk stopped at the end of the free stops.'); render(); return; }
        stopSpeak(); prog.current = next; persist(); render(); return;
      }
      tickSim();
    }, 700);
  }
  function stopSim() { S.sim = false; clearInterval(simTimer); }
  function finishWalk() {
    const w = walk(S.walkId), prog = S.progress[w.id];
    prog.finishedAt = Date.now();
    S.active = null; stopSim(); stopSpeak(); persist();
    // Land on the whole walk, route lit up from start to end.
    S.view = 'walk'; S.mode = 'map'; S.mapStyle = 'street'; S.showWhole = true; wmap = null; render();
    const m = modal(`<div class="stack" style="gap:12px;text-align:center">${hib(56, '#D6336C', -15)}<h2 style="font-size:24px">Walk complete</h2><p class="small" style="margin:0">Mahalo for walking ${esc(w.title)}. Your whole route is lit up on the map, from where you started to where you ended.</p>
      <button class="btn" data-close>${ic('map')} See my route</button>
      <button class="btn" data-done="home" style="background:transparent;color:var(--primary)">Back to all walks</button></div>`, true);
    m.addEventListener('click', (e) => { if (e.target.closest('[data-done="home"]')) { m.remove(); S.view = null; render(); } });
  }
  // A finished walk: walk it again from stop 1, or just look at it without losing the finished route.
  function completedDialog(id) {
    const w = walk(id);
    const m = modal(`<div class="stack" style="gap:12px"><h2 style="font-size:22px">Walk it again?</h2><p class="small" style="margin:0">You finished ${esc(w.title)}. Start over from stop 1, or just look through it again.</p>
      <button class="btn" data-again="start">${ic('navigate')} Start over</button>
      <button class="btn" data-again="look" style="background:transparent;color:var(--accent);border:2px solid var(--accent)">${ic('map')} Just look</button>
      <button class="btn" data-close style="background:transparent;color:var(--primary)">Cancel</button></div>`, true);
    m.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-again]'); if (!b) return;
      m.remove();
      if (b.dataset.again === 'start') { S.walkId = id; delete S.progress[id]; persist(); await needImages(id); startWalk(); }
      else { await openWalk(id); S.mode = 'map'; S.showWhole = true; wmap = null; render(); }
    });
  }

  function renderSaved() {
    const items = D.walks.flatMap((w) => w.stops.map((s, i) => ({ w, s, i }))).filter((x) => S.favs.includes(x.s.id));
    return `<div class="screen pad" style="padding-top:calc(env(safe-area-inset-top) + 20px)"><h1 style="font-size:32px;margin-bottom:14px">Saved stops</h1>
      ${items.length ? `<div class="stack" style="gap:10px">${items.map((x) => `<button class="card row" data-open="${x.w.id}:${x.i}" style="text-align:left;padding:10px"><span class="num" style="background:${x.w.color}">${x.s.n}</span><div style="flex:1"><div class="label">Walk ${wn(x.w.id)}</div><div style="font-weight:800">${esc(x.s.title)}</div></div></button>`).join('')}</div>` : `<div class="stack" style="align-items:center;margin-top:60px">${plum(80)}<p class="small" style="text-align:center">Tap the heart on any stop to keep it here.</p></div>`}</div>`;
  }

  function renderProfile() {
    const fin = Object.values(S.progress).filter((p) => p.finishedAt).length, vis = Object.values(S.progress).reduce((a, p) => a + p.visited.length, 0), tot = D.walks.reduce((a, w) => a + w.stops.length, 0);
    const signed = S.profile && S.profile.provider !== 'guest';
    const row = (icn, label, act) => `<button class="setrow" data-act="${act}" style="width:100%;text-align:left;border-bottom:1px solid var(--line)"><span style="color:var(--primary)">${ic(icn, 'width="22" height="22"')}</span><span style="flex:1">${label}</span></button>`;
    return `<div class="screen pad" style="padding-top:calc(env(safe-area-inset-top) + 20px)"><div class="stack">
      <div class="row" style="gap:14px"><div style="width:68px;height:68px;border-radius:34px;background:var(--accentsoft);display:flex;align-items:center;justify-content:center">${hib(52, 'var(--accent)')}</div><div><h1 style="font-size:26px">${signed ? esc(S.profile.name || 'Walker') : 'Guest walker'}</h1><div class="small">${signed ? esc(S.profile.email || S.profile.provider) : 'Sign in to save your progress across devices'}</div></div></div>
      ${signed ? '' : `<button class="btn block" data-act="auth">${ic('person')} Sign in or create account</button>`}
      <div class="card row" style="justify-content:space-around;text-align:center">${[[fin, 'Walks finished'], [vis, 'Stops visited'], [Math.round((vis / tot) * 100), '% of the book']].map(([n, l]) => `<div><div style="font-family:var(--display);font-size:28px;color:var(--primary)">${n}</div><div class="small">${l}</div></div>`).join('')}</div>
      <div class="card stack" style="gap:10px"><div class="row" style="font-weight:800">${ic(S.isPro ? 'sparkles' : 'unlock', 'width="20" height="20"')} ${S.isPro ? 'All twelve walks unlocked' : 'Free preview'}</div><div class="small">${S.isPro ? 'All twelve walks are yours for good. Mahalo for supporting the book.' : 'Walk IV, stops 1 to 5, is free. Unlock every walk and every stop with a one-time purchase.'}</div>${S.isPro ? `<button class="btn outline" data-act="unpro">Reset preview purchase</button>` : `<button class="btn accent" data-act="paywall">${ic('sparkles')} Unlock all walks</button>`}</div>
      <div class="card" style="padding:4px 16px">${row('settings', 'Settings', 'settings')}<div class="setrow" aria-disabled="true" style="width:100%;border-bottom:1px solid var(--line);opacity:.55"><span>${ic('scan', 'width="22" height="22"')}</span><span style="flex:1">What am I looking at?</span><span class="small">Coming soon</span></div>${row('book', 'About the book', 'about')}${row('sparkles', 'Credits and copyright', 'credits')}${signed ? row('back', 'Sign out', 'signout') : ''}</div>
      <p class="small" style="text-align:center">Web preview of the iPhone and Android app. Purchases and sign-in are simulated here.</p></div></div>`;
  }

  function tabs() {
    const t = [['home', 'flower', 'Walks'], ['explore', 'map', 'Map'], ['saved', 'heart', 'Saved'], ['profile', 'person', 'Profile']];
    return `<nav class="tabs" role="tablist">${t.map(([k, i, l]) => `<button role="tab" aria-selected="${S.tab === k}" data-tab="${k}">${ic(i)}${l}</button>`).join('')}</nav>`;
  }
  // Ending a walk asks whether to keep the walker's place or start over next time.
  function endDialog(w) {
    const m = modal(`<div class="stack" style="gap:12px"><h2 style="font-size:22px">End this walk?</h2><p class="small" style="margin:0">You can keep your place and pick up where you left off, or clear it and start this walk fresh next time.</p>
      <button class="btn" data-endas="save">${ic('check')} End and save my place</button>
      <button class="btn" data-endas="discard" style="background:transparent;color:var(--accent);border:2px solid var(--accent)">End and start over next time</button>
      <button class="btn" data-close style="background:transparent;color:var(--primary)">Keep walking</button></div>`, true);
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-endas]'); if (!b) return;
      m.remove(); stopSim(); stopSpeak(); S.active = null;
      if (b.dataset.endas === 'discard') { delete S.progress[w.id]; toast('Walk ended. It will start from stop 1 next time.'); }
      else toast('Walk ended. Your place is saved.');
      persist(); if (S.view === 'go') S.view = 'walk'; render();
    });
  }
  function minibar() {
    if (!S.active || S.view === 'go') return '';
    const w = walk(S.active), p = S.progress[w.id], s = w.stops[p.current];
    return `<button class="minibar" data-act="resume"><span class="dot">${ic('walk', 'width="18" height="18"')}</span><span style="flex:1;min-width:0"><b>Stop ${s.n}: ${esc(s.title)}</b><span>Walk ${wn(w.id)} · ${esc(w.title)} · ${p.visited.length}/${w.stops.length} visited</span></span>${speaking.stopId ? `<span class="hush" data-hush role="button" aria-label="Stop reading">${ic('stop', 'width="20" height="20"')}</span>` : ic('down', 'width="22" height="22" style="transform:rotate(180deg)"')}<span class="endx" data-endbar role="button" aria-label="End walk">${ic('close', 'width="18" height="18"')}</span></button>`;
  }

  function renderExplore() {
    return `<div class="screen" style="padding:0"><div class="map" id="emap"></div><div class="attrib" style="bottom:70px">© OpenStreetMap contributors</div>
      <div style="position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top) + 10px);z-index:900;display:flex;justify-content:center"><div id="ehint" class="chip" style="background:var(--card);box-shadow:0 2px 4px rgba(0,0,0,.15);padding:8px 14px">Tap a walk to see its stops</div></div>
      <div id="ecard" class="card hidden" style="position:absolute;left:14px;right:14px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:900"></div></div>`;
  }
  function mountExplore() {
    const el = document.getElementById('emap'); if (!el) return;
    const T = window.WWTILES || {};
    const Layer = L.GridLayer.extend({ createTile(c) { const t = document.createElement('img'); const k = `${c.z}/${c.x}/${c.y}`; if (T[k]) t.src = T[k]; else t.style.background = '#e9e5dc'; return t; } });
    const map = L.map(el, { zoomControl: false, attributionControl: false, minZoom: 13, maxZoom: 18, touchZoom: true, bounceAtZoomLimits: false }).setView([21.283, -157.825], 14);
    new Layer({ maxNativeZoom: 16, minNativeZoom: 14 }).addTo(map);
    const group = L.layerGroup().addTo(map);
    const showAll = () => {
      group.clearLayers();
      D.walks.forEach((w) => { const s = w.stops[0]; L.marker([s.lat, s.lng], { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${w.color};min-width:32px;height:32px">${w.id}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] }) }).addTo(group).on('click', () => showWalk(w)); });
      document.getElementById('ehint').innerHTML = 'Tap a walk to see its stops';
      document.getElementById('ecard').classList.add('hidden');
      map.setView([21.283, -157.825], 14);
    };
    const showWalk = (w) => {
      group.clearLayers();
      const pts = w.stops.filter(onMap).map((s) => [s.lat, s.lng]);
      L.polyline(walkPath(w).length > 1 ? walkPath(w) : pts, { color: w.color, weight: 4, dashArray: '8 6' }).addTo(group);
      w.stops.forEach((s, i) => onMap(s) && L.marker([s.lat, s.lng], { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${canOpen(w.id, i) ? w.color : '#8A9A9B'}">${canOpen(w.id, i) ? s.n : ic('lock', 'width="11" height="11"')}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(group).on('click', () => openWalk(w.id, i)));
      map.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [30, 70], paddingBottomRight: [30, 200] });
      const h = document.getElementById('ehint'); h.innerHTML = `${ic('back', 'width="14" height="14"')} All walks`; h.setAttribute('role', 'button'); h.onclick = showAll;
      const c = document.getElementById('ecard'); c.classList.remove('hidden');
      c.innerHTML = `<div class="label">Walk ${wn(w.id)}</div><h2 style="font-size:22px">${esc(w.title)}</h2><div class="small">${esc(w.theme)}</div><button class="btn block" style="margin-top:10px" data-walk="${w.id}">Open walk ${ic('fwd')}</button>`;
    };
    showAll();
  }

  // Modals
  document.addEventListener('input', (e) => {
    if (!e.target.matches('[data-overlay]')) return;
    S.overlay = Number(e.target.value);
    [wmap, gmap].forEach((m) => m && m.overlay && m.overlay.setOpacity(S.overlay / 100));
  });
  function modal(html, center) { const m = document.createElement('div'); m.className = 'modal' + (center ? ' center' : ''); m.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${html}<button class="iconbtn close" data-close aria-label="Close">${ic('close')}</button></div>`; m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); }); $app.appendChild(m); return m; }
  function openPaywall() {
    let sel = 'forever';
    const plans = [['week', '7-day pass', '$9.99', 'All 12 walks for 7 days from purchase. Never renews.', ''], ['forever', 'Yours forever', '$34.99', 'All 12 walks, on this trip and every visit after. One payment.', 'NEVER EXPIRES']];
    const endStr = () => new Date(Date.now() + 7 * 86400000).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const fine = (id) => id === 'week' ? `One charge of ${priceOf(id)}. Your pass would run until ${endStr()}. It never renews.` : `One charge of ${priceOf(id)}. All walks stay open for good. Nothing renews.`;
    const priceOf = (id) => plans.find((p) => p[0] === id)[2];
    const perks = [['map', 'All 12 walks and every stop, from Kālia to Mānoa Falls'], ['headset', 'Read-aloud narration, hands free with headphones'], ['pin', 'Arrival alerts, even with your phone in your pocket'], ['book', 'Historic photographs from the book'], ['scan', '“What am I looking at?” for landmarks along the way (coming soon)'], ['book', 'Stories, photos and the book maps are stored on your phone, so they work without signal']];
    const m = modal(`<div class="stack"><div class="row">${hib(64, '#D6336C', -15)}${plum(40, 20)}</div><h1 style="font-size:30px">Walk all of Waikīkī</h1><div class="italic" style="color:var(--leaf)">Twelve walks through a thousand years, in Veneeta’s own words.</div><div class="small">Free without paying: Walk IV, stops 1 to 5, plus the overview, map and first stop of every walk.</div>
      ${perks.map(([i, t]) => `<div class="perk"><i>${ic(i)}</i><span>${t}</span></div>`).join('')}
      <div class="stack" role="radiogroup" aria-label="Choose a plan" style="gap:12px;margin-top:6px">${plans.map(([id, t, p, n, b]) => `<button class="plan" role="radio" aria-checked="${id === sel}" data-plan="${id}" aria-label="${t}, ${p}. ${n}"><span style="flex:1"><b>${t}</b><div class="small">${n}</div></span><b>${p}</b>${b ? `<span class="best" aria-hidden="true">${b}</span>` : ''}</button>`).join('')}</div>
      <button class="btn accent block" data-buy>${ic('sparkles')} <span id="buylabel">Unlock for ${priceOf(sel)}</span></button><p class="small" style="text-align:center"><span id="fineprint">${fine(sel)}</span> Preview only: no real payment.</p></div>`);
    m.addEventListener('click', (e) => { const p = e.target.closest('[data-plan]'); if (p) { sel = p.dataset.plan; m.querySelectorAll('[data-plan]').forEach((x) => x.setAttribute('aria-checked', x.dataset.plan === sel)); m.querySelector('#buylabel').textContent = `Unlock for ${priceOf(sel)}`; m.querySelector('#fineprint').textContent = fine(sel); } if (e.target.closest('[data-buy]')) { S.isPro = true; persist(); m.remove(); toast('Mahalo nui loa! All twelve walks are open (preview).'); render(); } });
  }
  function openAuth() {
    const m = modal(`<div class="stack">${hib(64, 'var(--accent)')}<h1 style="font-size:30px">E komo mai</h1><p class="small" style="color:var(--text)">Welcome. Sign in to keep your progress, saved stops, and purchases on every device.</p>
      <button class="authbtn apple" data-sign="apple">${ic('apple', 'width="20" height="20"')} Continue with Apple</button><button class="authbtn" data-sign="google">${ic('google', 'width="20" height="20"')} Continue with Google</button>
      <div class="row small" style="justify-content:center">or use email</div><input type="email" id="authemail" placeholder="you@example.com" autocomplete="email" aria-label="Email"><button class="btn outline" data-sign="email">${ic('mail')} Email me a sign-in code</button>
      <button class="small" data-sign="guest" style="color:var(--primary);font-weight:800;margin-top:8px">Continue as a guest</button></div>`);
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-sign]'); if (!b) return; const k = b.dataset.sign; const email = (m.querySelector('#authemail') || {}).value; S.profile = k === 'guest' ? { provider: 'guest', name: 'Guest' } : { provider: k, name: k === 'apple' ? 'Walker (Apple ID)' : k === 'google' ? 'Walker (Google)' : (email || 'Email user').split('@')[0], email: k === 'email' ? email : null }; persist(); m.remove(); toast(k === 'guest' ? 'Browsing as a guest' : `Signed in with ${k} (preview)`); render(); });
  }
  function openSettings() {
    const st = S.settings; const sw = (k, label, hint) => `<div class="setrow"><div style="flex:1"><div>${label}</div><div class="small">${hint}</div></div><button class="switch" role="switch" aria-checked="${st[k]}" data-sw="${k}" aria-label="${label}"></button></div>`;
    const m = modal(`<div class="stack"><h1 style="font-size:28px">Settings</h1>
      <div class="label">Appearance</div><div class="card stack" style="gap:10px"><div class="seg" role="tablist">${[['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button role="tab" aria-selected="${st.theme === v}" data-theme-set="${v}">${l}</button>`).join('')}</div>
        </div>
      <div class="label">Reading</div><div class="card stack" style="gap:10px"><div class="seg" role="tablist">${[['comfortable', 'Comfortable'], ['compact', 'More words per screen']].map(([v, l]) => `<button role="tab" aria-selected="${(st.textScale <= 0.95 && st.margin <= 10 && st.spacing <= 0.95 ? 'compact' : 'comfortable') === v}" data-read-set="${v}">${l}</button>`).join('')}</div>
        <label class="small" for="ts">Text size</label><input id="ts" type="range" min="0.85" max="1.6" step="0.05" value="${st.textScale}">
        <label class="small" for="mg">Side margins</label><input id="mg" type="range" min="6" max="28" step="2" value="${st.margin}">
        <label class="small" for="ls">Line spacing</label><input id="ls" type="range" min="0.9" max="1.4" step="0.05" value="${st.spacing}"></div>
      <div class="label">Walking</div><div class="card">${sw('alerts', 'Arrival alerts', 'Tell me when I reach a stop')}<label class="small" for="ar">Arrival distance: <span id="arv">${st.arrival}</span> m</label><input id="ar" type="range" min="15" max="80" step="5" value="${st.arrival}"></div>
      <div class="label">Read aloud</div><div class="card"><label class="small" for="rt">Speed: <span id="rtv">${st.rate.toFixed(2)}</span>×</label><input id="rt" type="range" min="0.7" max="1.3" step="0.05" value="${st.rate}"><p class="small">Narration is recorded from the book. Choose Read aloud, GPS linked, or Off on the walk screen.</p></div>
      <div class="label">Privacy</div><div class="card small">Your location is used on your phone to place you on the map and detect arrivals. It is not sent to a server.</div>
      <button class="btn outline" data-reset>Reset walk progress</button></div>`);
    m.addEventListener('click', (e) => {
      const s = e.target.closest('[data-sw]'); if (s) { st[s.dataset.sw] = !st[s.dataset.sw]; s.setAttribute('aria-checked', st[s.dataset.sw]); persist(); }
      const t = e.target.closest('[data-theme-set]'); if (t) { st.theme = t.dataset.themeSet; m.querySelectorAll('[data-theme-set]').forEach((x) => x.setAttribute('aria-selected', x.dataset.themeSet === st.theme)); persist(); applyTheme(); }
      const rd = e.target.closest('[data-read-set]'); if (rd) { const c = rd.dataset.readSet === 'compact'; st.textScale = c ? 0.95 : 1; st.margin = c ? 10 : 20; st.spacing = c ? 0.92 : 1; persist(); applyTheme(); m.querySelectorAll('[data-read-set]').forEach((x) => x.setAttribute('aria-selected', x === rd)); m.querySelector('#ts').value = st.textScale; m.querySelector('#mg').value = st.margin; m.querySelector('#ls').value = st.spacing; }
      if (e.target.closest('[data-reset]')) { S.progress = {}; S.active = null; persist(); toast('Progress reset'); m.remove(); render(); }
    });
    m.addEventListener('input', (e) => { if (e.target.id === 'ts') { st.textScale = Number(e.target.value); applyTheme(); } if (e.target.id === 'mg') { st.margin = Number(e.target.value); applyTheme(); } if (e.target.id === 'ls') { st.spacing = Number(e.target.value); applyTheme(); } if (e.target.id === 'ar') { st.arrival = Number(e.target.value); m.querySelector('#arv').textContent = st.arrival; } if (e.target.id === 'rt') { st.rate = Number(e.target.value); m.querySelector('#rtv').textContent = st.rate.toFixed(2); } persist(); });
  }
  function aboutBlock(b) {
    if (b.k === 'lead') return `<p class="italic" style="font-size:16px">${esc(b.t)}</p>`;
    if (b.k === 'h') return `<h3 style="font-family:var(--body);font-weight:800;font-size:17px;color:var(--primary);margin-top:6px;white-space:pre-line">${esc(b.t)}</h3>`;
    if (b.k === 'li') return `<div class="row" style="gap:8px;align-items:flex-start;padding-left:4px"><span style="color:var(--accent)">•</span><p class="p" style="font-size:16px;flex:1;margin:0">${rich(b.t)}</p></div>`;
    if (b.k === 'date') return `<p class="p" style="font-size:16px"><b>${esc(b.d)}</b> ${rich(b.t)}</p>`;
    if (b.k === 'royal') return `<div style="border-top:1px solid var(--line);padding-top:8px"><div style="font-weight:800;color:var(--primary)">${esc(b.name)}${b.alt ? ` <span class="small">(${esc(b.alt)})</span>` : ''}</div><div class="small">Lived ${esc(b.lived)}${b.ruled ? ` · Ruled ${esc(b.ruled)}` : ''}</div><div class="small">Consorts: ${esc(b.consorts)}</div></div>`;
    return `<p class="p" style="font-size:16px">${rich(b.t)}</p>`;
  }
  function openAbout(section) {
    const m = modal(`<div class="stack" style="align-items:stretch"><div style="text-align:center">${hib(64, 'var(--accent)')}<h1 style="font-size:32px">Waikīkī</h1><div style="font-family:var(--display);letter-spacing:.15em">TWELVE WALKS THROUGH TIME</div><div class="italic">Veneeta Acson, Ph.D.</div></div>
      <div class="card stack" style="gap:2px"><div class="label">In this section</div>${D.about.map((s, i) => `<button class="row" data-aboutjump="${i}" style="min-height:44px;text-align:left;background:none;border:0;color:var(--primary);font-weight:700;font-size:16px;padding:0">${esc(s.title)}</button>`).join('')}</div>
      ${D.about.map((s, i) => `<div class="card stack" id="about-${i}" data-aboutid="${esc(s.id || '')}" style="gap:10px"><h2 style="font-size:21px">${esc(s.title)}</h2>${s.blocks.map(aboutBlock).join('')}</div>`).join('')}<p class="small" style="text-align:center">Text and photographs © 2023 Island Heritage. All rights reserved.</p></div>`);
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-aboutjump]'); if (b) m.querySelector(`#about-${b.dataset.aboutjump}`).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    if (section) { const el = m.querySelector(`[data-aboutid="${section}"]`); if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 0); }
  }
  function openLayers(w) {
    const m = modal(`<div class="stack"><div class="label">Map style</div>
      <button class="plan" aria-checked="${S.mapStyle !== 'book'}" data-layer="street">${ic('map')}<span style="flex:1"><b>Street map</b></span></button>
      <button class="plan" data-layer="sat">${ic('earth')}<span style="flex:1"><b>Satellite</b><div class="small">In the iPhone and Android app (Apple and Google satellite imagery)</div></span></button>
      ${w.bookMap ? `<button class="plan" aria-checked="${S.mapStyle === 'book'}" data-layer="book">${ic('book')}<span style="flex:1"><b>Veneeta’s map from the book</b><div class="small">The original walk map with every stop numbered</div></span></button>` : ''}</div>`);
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-layer]'); if (!b) return;
      if (b.dataset.layer === 'sat') return toast('Satellite view is built into the phone app.');
      if (b.dataset.layer === 'book' || b.dataset.layer === 'street') { m.remove(); S.mapStyle = b.dataset.layer; wmap = null; gmap = null; return render(); }
      if (false) { modal(`<div class="stack"><div class="label">Walk ${wn(w.id)} map from the book</div><div style="overflow:auto;max-height:75vh;border-radius:14px;background:#FBF6EC">${img(w.bookMap).replace('<img ', '<img style="width:180%;max-width:none" ')}</div><p class="small">Scroll to pan. In the app you can pinch to zoom.</p></div>`); return; }
      m.remove();
    });
  }
  function openCredits() {
    const sec = (t, lines) => `<div class="card stack" style="gap:6px"><div class="label">${t}</div>${lines.map((l) => `<div style="font-size:15px;line-height:1.45">${l}</div>`).join('')}</div>`;
    modal(`<div class="stack"><div style="text-align:center">${hib(56, 'var(--accent)')}<h1 style="font-size:28px">Waikīkī Walks</h1><div class="italic">by Veneeta Acson, Ph.D.</div><div class="italic" style="color:var(--leaf)">For Alice and Ezra</div></div>
      ${sec('Author', ['Text by Veneeta Acson, Ph.D.', 'Adapted from her book “Waikīkī: Twelve Walks Through Time” (First Edition, 2023).'])}
      ${sec('Dedication', ['To my grandchildren, Alice and Ezra, who have learned to love walking in the ahupuaʻa of Waikīkī.', 'In memory of my mother, Alice Acson, who loved walking in Waikīkī.'])}
      ${sec('The book', ['“Waikīkī: Twelve Walks Through Time” © 2023 Island Heritage. All rights reserved.', 'Published and distributed by Island Heritage, Mililani, Hawaiʻi.'])}
      ${sec('Photographs', ['Contributing photography: Merina Vo and Joel Bradshaw.', 'Book cover: Cameron Brooks.', 'Historic photographs are credited in their captions, including the Hawaiʻi State Archives.'])}
      ${sec('Maps', ['Map data © OpenStreetMap contributors, Open Database License.'])}
      ${sec('Fonts', ['Libre Caslon Text and Nunito, SIL Open Font License.'])}
      <p class="small" style="text-align:center">© 2026 Veneeta Acson. All rights reserved.</p></div>`);
  }
  function openLens() {
    // The real app uses the camera, GPS and compass. Here we stand the walker on Kalākaua Avenue.
    const here = { lat: 21.2762, lng: -157.8262 }, heading = 120;
    const c = [];
    D.walks.forEach((w) => w.stops.forEach((s, i) => { if (!onMap(s)) return; const d = dist(here, s); if (d > 350) return; const off = Math.abs(((bearing(here, s) - heading + 540) % 360) - 180); if (d > 25 && off > 35) return; c.push({ w, s, i, d, score: (1 - d / 350) * 0.6 + (1 - Math.min(off, 90) / 90) * 0.4 }); }));
    c.sort((a, b) => b.score - a.score);
    const top = c[0];
    const m = modal(`<div class="stack"><div class="label">What am I looking at?</div><div style="position:relative;height:200px;border-radius:18px;overflow:hidden;background:#123">${top && top.s.photos[0] ? img(top.s.photos[0].file, '', '').replace('<img ', '<img style="width:100%;height:100%;object-fit:cover;opacity:.75" ') : ''}<div class="reticle" style="top:20px;width:160px;height:160px;margin-left:-80px"></div></div>
      <p class="small">In the app you point the camera at a building, statue or sign. GPS and the compass narrow it to the book’s stops in front of you, and the photo confirms which one. This preview stands you on Kalākaua Avenue facing Diamond Head.</p>
      ${top ? `<div class="card row"><div style="flex:1"><div class="label">Probably in view · ${fmt(top.d)}</div><div style="font-weight:800">${esc(top.s.title)}</div><div class="small">Walk ${wn(top.w.id)}, stop ${top.s.n}</div></div><button class="btn" data-lensopen="${top.w.id}:${top.i}">Read</button></div>` : '<p>Nothing from the book in view.</p>'}
      ${c.length > 1 ? `<p class="small">Also nearby: ${c.slice(1, 4).map((x) => esc(x.s.title)).join(', ')}</p>` : ''}</div>`);
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-lensopen]'); if (b) { m.remove(); const [wid, i] = b.dataset.lensopen.split(':'); openWalk(wid, Number(i)); } });
  }
  function openGloss(word) {
    const g = D.glossary.find((x) => x.word === word); if (!g) return;
    const m = modal(`<div class="stack"><h1 style="font-size:30px">${esc(g.word)}</h1><p class="p">${esc(g.meaning)}</p><div class="row"><button class="btn outline" style="flex:1" data-say>${ic('volume')} Hear it</button><button class="btn" style="flex:1" data-close>Mahalo</button></div><p class="small">As defined in the book.</p><button class="btn ghost" data-howtosay style="color:var(--primary);background:none;min-height:44px">How to say Hawaiian words</button></div>`, true);
    m.addEventListener('click', (e) => { if (e.target.closest('[data-howtosay]')) { m.remove(); openAbout('pronunciation'); return; } if (e.target.closest('[data-say]') && synth) { synth.cancel(); const u = new SpeechSynthesisUtterance(g.word); u.rate = 0.85; synth.speak(u); } });
  }
  function openPhotos(stop, idx) {
    const p = stop.photos[idx]; if (!p) return;
    modal(`<div class="stack">${img(p.file).replace('<img ', '<img style="width:100%;border-radius:14px" ')}${p.caption ? `<p class="italic">${esc(p.caption)}</p>` : ''}<p class="small">Photo ${idx + 1} of ${stop.photos.length} · ${esc(stop.title)}</p></div>`, true);
  }

  // ---------- navigation ----------
  async function openWalk(id, stopIdx) {
    S.walkId = id; S.mode = 'read'; S.focus = stopIdx || 0; wmap = null;
    if (stopIdx != null && !Number.isNaN(stopIdx)) { S.view = 'stop'; S.stopIdx = stopIdx; } else S.view = 'walk';
    await needImages(id); render();
  }
  let compassOn = false;
  function startCompass() {
    if (compassOn || typeof DeviceOrientationEvent === 'undefined') return;
    const listen = () => {
      compassOn = true;
      window.addEventListener('deviceorientation', (e) => {
        if (S.sim || S.view !== 'go') return;
        const h = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute && e.alpha != null ? 360 - e.alpha : null);
        if (h == null || isNaN(h)) return;
        S.heading = h;
        const w = walk(S.walkId); if (!w) return;
        const c = document.getElementById('bcone'); if (c) c.style.transform = `rotate(${bookHeading(w)}deg)`;
        if (gmap && S.me) gmap.me(S.me, S.heading);
        const prog = S.progress[w.id], t = prog && w.stops[prog.current], ar = document.querySelector('.nav .arrow');
        if (ar && t && S.me) ar.style.transform = `rotate(${bearing(S.me, t) - h}deg)`;
      });
    };
    if (typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then((r) => { if (r === 'granted') listen(); }).catch(() => {});
    else listen();
  }
  async function startWalk() {
    startCompass();
    const w = walk(S.walkId);
    if (!canStart(w.id)) return openPaywall();
    const p = S.progress[w.id];
    if (!p || p.finishedAt) S.progress[w.id] = { current: 0, visited: [], startedAt: Date.now() };
    S.active = w.id; S.view = 'go'; S.me = null; S.follow = 'follow'; S.bookZoomUser = false; S.simSession = null; persist(); await needImages(w.id); render();
    // Real mode first: the phone's GPS moves the dot (startGps runs with the walking screen). The demo walk is only
    // for trying the app away from Waikīkī; it starts by itself only when this browser has no location at all.
    if (!navigator.geolocation || S.demo) { startSim(); const b = document.querySelector('[data-act="sim"]'); if (b) { b.setAttribute('aria-pressed', true); b.textContent = '⏸ Pause demo walk'; } }
  }

  // Fill the pane's full height under the header with her map, measured on the real pane once it is on screen
  // (and again when the image or the window size changes), until the walker zooms by hand.
  function fitBook(bp) {
    const bi = bp.querySelector('.bookimg'), im = bi && bi.querySelector('img'); if (!im) return;
    const fit = () => {
      if (S.bookZoomUser || !bp.isConnected) return;
      const ratio = (im.naturalHeight && im.naturalWidth) ? im.naturalHeight / im.naturalWidth : (im.offsetHeight / Math.max(1, im.offsetWidth));
      if (!ratio || !bp.clientWidth) return;
      const z = Math.max(1, Math.min(5, (bp.clientHeight - 110) / (bp.clientWidth * ratio)));
      if (Math.abs(z - (S.bookZoom || 0)) > 0.01) { S.bookZoom = z; bi.style.width = z * 100 + '%'; }
    };
    fit(); if (!im.complete) im.addEventListener('load', fit, { once: true });
    if (!window._bookFitResize) { window._bookFitResize = true; window.addEventListener('resize', () => { const p = document.getElementById('bookpane'); if (p) fitBook(p); }); }
  }
  // Pinch to zoom on the book map: two fingers scale the page around their midpoint (the browser would otherwise zoom the whole page).
  function bindBookPinch(pane) {
    let p0 = null;
    const span = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    pane.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 2) return;
      const r = pane.getBoundingClientRect(), mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
      const bi = pane.querySelector('.bookimg');
      p0 = { d: span(e.touches), z: S.bookZoom || 1.6, mx, my, cx: (pane.scrollLeft + mx) / bi.offsetWidth, cy: (pane.scrollTop + my - bi.offsetTop) / bi.offsetHeight };
    }, { passive: true });
    pane.addEventListener('touchmove', (e) => {
      if (!p0 || e.touches.length !== 2) return;
      e.preventDefault();
      const z = Math.max(1, Math.min(5, p0.z * span(e.touches) / p0.d)), bi = pane.querySelector('.bookimg');
      S.bookZoom = z; S.bookZoomUser = true; bi.style.width = z * 100 + '%';
      S.bookAuto = Date.now(); S.bookFollow = false;
      pane.scrollLeft = p0.cx * bi.offsetWidth - p0.mx; pane.scrollTop = p0.cy * bi.offsetHeight + bi.offsetTop - p0.my;
    }, { passive: false });
    pane.addEventListener('touchend', (e) => { if (e.touches.length < 2) p0 = null; }, { passive: true });
  }

  function render() {
    if (!S.isPro && S.mapStyle === 'book') S.mapStyle = 'street';
    const oldPane = document.getElementById('bookpane');
    const keep = oldPane ? { top: oldPane.scrollTop, left: oldPane.scrollLeft, view: S.view, walk: S.walkId } : null;
    stopSpeakIfLeaving();
    applyTheme();
    let html = '';
    if (S.view === 'walk') html = renderWalk();
    else if (S.view === 'go') html = renderGo();
    else if (S.view === 'stop') html = renderStop() + minibar();
    else html = (S.tab === 'home' ? renderHome() : S.tab === 'explore' ? renderExplore() : S.tab === 'saved' ? renderSaved() : renderProfile()) + minibar() + tabs();
    $app.innerHTML = html;
    if (S.view === 'walk' && S.mode === 'map') mountWalkMap();
    if (S.view === 'go') { mountSheet(); mountGoMap(); startGps(); } else stopGps();
    const bp = document.getElementById('bookpane');
    if (bp && keep && keep.view === S.view && keep.walk === S.walkId) { S.bookAuto = Date.now(); bp.scrollTop = keep.top; bp.scrollLeft = keep.left; }
    if (bp) {
      bp.addEventListener('scroll', () => { if (Date.now() - (S.bookAuto || 0) > 900) S.bookFollow = false; }, { passive: true });
      bindBookPinch(bp); fitBook(bp);
      if (S.view === 'go' && S.stopFocus) setTimeout(() => centerBookOnStop(false), 60);
      else if (S.view === 'go' && S.bookFollow !== false && !(keep && keep.view === 'go')) { S.bookFollow = true; setTimeout(() => centerBookOnMe(false), 60); }
    }
    S.stopFocus = false;
    if (S.view === 'stop') bindSwipe(document.getElementById('stopread'));
    if (!S.view && S.tab === 'explore') mountExplore();
    if (!S.view && S.tab === 'home') { showFact(); clearInterval(factTimer); factTimer = setInterval(() => { factIdx++; showFact(); }, 9000); }
    markReading();
  }
  let lastView = null;
  function stopSpeakIfLeaving() { const key = S.view + S.walkId; if (lastView && lastView !== key && S.view !== 'go' && !S.active) stopSpeak(); lastView = key; }

  $app.addEventListener('click', (e) => {
    const t = e.target;
    const q = (sel) => t.closest(sel);
    let el;
    if ((el = q('[data-endbar]'))) return endDialog(walk(S.active));
    if ((el = q('[data-hush]'))) { stopSpeak(); return render(); }
    if ((el = q('.gw'))) return openGloss(el.dataset.word);
    if ((el = q('[data-tab]'))) { S.tab = el.dataset.tab; S.view = null; return render(); }
    if ((el = q('[data-walk]'))) return (S.progress[el.dataset.walk] || {}).finishedAt ? completedDialog(el.dataset.walk) : openWalk(el.dataset.walk);
    if ((el = q('[data-open]'))) { const [w, i] = el.dataset.open.split(':'); return openWalk(w, Number(i)); }
    if ((el = q('#fact'))) { factIdx++; return showFact(); }
    if ((el = q('[data-mode]'))) { S.mode = el.dataset.mode; document.getElementById('readview').classList.toggle('hidden', S.mode !== 'read'); document.getElementById('mapview').classList.toggle('hidden', S.mode !== 'map'); document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', b.dataset.mode === S.mode)); document.querySelector('.cta').classList.toggle('solid', S.mode === 'read'); if (S.mode === 'map') mountWalkMap(); else setTimeout(() => { const s = document.getElementById('stop-' + S.focus); s && S.focus && s.scrollIntoView({ block: 'start' }); }, 30); return; }
    if ((el = q('[data-onmap]'))) { S.focus = Number(el.dataset.onmap); stopSpeak(); S.view = 'walk'; S.mode = 'map'; wmap = null; return render(); }
    if ((el = q('[data-read]'))) { const i = Number(el.dataset.read); S.stopIdx = i; S.focus = i; S.view = 'stop'; return render(); }
    if ((el = q('[data-step]'))) return stepStop(Number(el.dataset.step));
    if ((el = q('[data-detent]'))) { S.detent = el.dataset.detent; setSheet(detents()[S.detent], true); markDetent(); if (gmap) setTimeout(() => gmap.map.invalidateSize(), 300); return; }
    if ((el = q('[data-bpin]'))) { const i = Number(el.dataset.bpin); if (S.view === 'go') return showStop(i); S.focus = i; S.stopIdx = i; S.view = 'stop'; return render(); }
    if ((el = q('[data-mapstyle]'))) { S.mapStyle = el.dataset.mapstyle; wmap = null; gmap = null; render(); return; }
    if ((el = q('[data-bookpage]'))) { const w = walk(S.walkId); S.bookPage = S.bookPage || {}; S.bookPage[w.id] = Number(el.dataset.bookpage); return render(); }
    if ((el = q('[data-zoom]')) && S.mapStyle !== 'book') { const m = S.view === 'go' ? gmap : wmap; if (m) (Number(el.dataset.zoom) > 0 ? m.zoomIn() : m.zoomOut()); return; }
    if ((el = q('[data-zoom]'))) { S.bookZoomUser = true; S.bookZoom = Math.max(1, Math.min(5, (S.bookZoom || 1.6) + Number(el.dataset.zoom) * 0.5)); const bi = document.querySelector('.bookimg'); if (bi) bi.style.width = S.bookZoom * 100 + '%'; return; }
    if ((el = q('[data-card]'))) { const i = Number(el.dataset.card); const w = walk(S.walkId); if (!canOpen(w.id, i)) return openPaywall(); if (S.focus !== i) { S.focus = i; syncRail(true); wmap.paint(i, (S.progress[w.id] || { visited: [] }).visited); wmap.focus(i); return; } S.focus = i; S.stopIdx = i; S.view = 'stop'; return render(); }
    if ((el = q('[data-listen]'))) { const w = walk(S.walkId); const s = w.stops[Number(el.dataset.i)]; return speaking.stopId === s.id ? stopSpeak() : speakStop(s); }
    if ((el = q('[data-fav]'))) { const id = el.dataset.fav; S.favs = S.favs.includes(id) ? S.favs.filter((x) => x !== id) : [...S.favs, id]; persist(); el.innerHTML = ic(S.favs.includes(id) ? 'heartFill' : 'heart'); return; }
    if ((el = q('[data-ph]'))) { const sec = el.closest('[data-i]'); const w = walk(S.walkId); const stop = sec ? w.stops[Number(sec.dataset.i)] : w.stops[S.progress[w.id].current]; return openPhotos(stop, Number(el.dataset.ph)); }
    if ((el = q('[data-layout]'))) { S.layout = el.dataset.layout; return render(); }
    if ((el = q('[data-act]'))) {
      const a = el.dataset.act, w = S.walkId && walk(S.walkId);
      if (a === 'back') { S.view = null; return render(); }
      if (a === 'stopback') { stopSpeak(); S.view = 'walk'; S.mode = 'read'; render(); const r = document.querySelector(`[data-read="${S.stopIdx}"]`); r && r.scrollIntoView({ block: 'center' }); return; }
      if (a === 'skip') return showStop(S.progress[w.id].current + 1);
      if (a === 'fit') { if (S.mode === 'map' && wmap) wmap.fit(); else document.querySelector('[data-mode="map"]').click(); return; }
      if (a === 'resetwalk') {
        const m = modal(`<div class="stack" style="gap:12px"><h2 style="font-size:22px">Start this walk over?</h2><p class="small" style="margin:0">This clears the stops you've visited on this walk. Your saved stops stay saved.</p>
          <button class="btn" data-reset="yes" style="background:var(--accent)">Start over</button><button class="btn" data-close style="background:transparent;color:var(--primary)">Cancel</button></div>`, true);
        m.addEventListener('click', (e) => { if (!e.target.closest('[data-reset]')) return; m.remove(); if (S.active === w.id) { stopSim(); stopSpeak(); S.active = null; } delete S.progress[w.id]; persist(); toast('Walk reset. It will start from stop 1.'); render(); });
        return;
      }
      if (a === 'audiomode') { S.settings.audioMode = el.dataset.mode; if (el.dataset.mode === 'off') stopSpeak(); persist(); toast({ read: 'Read aloud: each stop is read as you open it.', gps: 'GPS linked: each stop is read when you arrive.', off: 'Audio off.' }[el.dataset.mode]); return render(); }
      if (a === 'stopread') return stopSpeak();
      if (a === 'start') { if (S.active === S.walkId) { S.view = 'go'; return render(); } return startWalk(); }
      if (a === 'paywall') return openPaywall();
      if (a === 'auth') return openAuth();
      if (a === 'settings') return openSettings();
      if (a === 'about') return openAbout();
      if (a === 'credits') return openCredits();
      if (a === 'lens') return openLens();
      if (a === 'pretend') { S.pretendHere = !S.pretendHere; return render(); }
      if (a === 'unpro') { S.isPro = false; persist(); return render(); }
      if (a === 'signout') { S.profile = null; persist(); return render(); }
      if (a === 'resume') { S.walkId = S.active; S.view = 'go'; return needImages(S.active).then(render); }
      if (a === 'minimize') { stopSim(); S.view = null; S.tab = 'home'; return render(); }
      if (a === 'end') return endDialog(w);
      if (a === 'sim') {
        if (S.sim) { stopSim(); el.setAttribute('aria-pressed', false); el.textContent = '▶ Resume demo walk'; return; }
        // A demo begins at stop 1 and walks the whole route, with both maps following the dot. Pausing and
        // tapping again carries on from where it paused (Nick, 19 Nov 2026).
        if (S.simSession !== S.walkId) {
          S.simSession = S.walkId; S.progress[S.walkId] = { current: 0, visited: [], startedAt: Date.now() };
          S.me = null; S.legProg = {}; S.stopFocus = false; persist();
        }
        S.follow = 'follow'; S.bookFollow = true; render(); startSim();
        const b = document.querySelector('[data-act="sim"]'); if (b) { b.setAttribute('aria-pressed', true); b.textContent = '⏸ Pause demo walk'; }
        return;
      }
      if (a === 'whole') {
        S.follow = 'off';
        if (S.mapStyle === 'book') { // the whole page of her map, fitted to the screen width
          const bp = document.getElementById('bookpane'), bi = bp && bp.querySelector('.bookimg'); if (!bi) return;
          S.bookFollow = false; S.bookZoomUser = true; S.bookZoom = 1; bi.style.width = '100%'; S.bookAuto = Date.now(); bp.scrollTo({ left: 0, top: 0, behavior: 'smooth' }); return;
        }
        return gmap && gmap.fit();
      }
      if (a === 'locate') {
        if (!S.me) return toast(S.sim ? 'Starting the demo walk…' : 'Waiting for your location…');
        S.follow = S.follow === 'off' ? 'follow' : S.follow === 'follow' ? 'heading' : 'off';
        el.classList.toggle('on', S.follow !== 'off'); el.innerHTML = ic(S.follow === 'heading' ? 'compass' : 'navigate');
        if (S.mapStyle === 'book') { S.bookFollow = S.follow !== 'off'; if (S.bookFollow) centerBookOnMe(true); return toast(S.bookFollow ? 'Following you' : 'Free map'); }
        if (gmap) { gmap.me(S.me, S.heading); if (S.follow === 'off') { document.getElementById('gmap').style.transform = ''; } }
        return toast(S.follow === 'off' ? 'Free map' : S.follow === 'follow' ? 'Following you' : 'Map turns with you');
      }
      if (a === 'layers') return openLayers(w);
      if (a === 'pinchk') { S.showPins = !S.showPins; const sc = document.getElementById('bookpane').scrollTop; render(); const bp = document.getElementById('bookpane'); if (bp) { S.bookAuto = Date.now(); bp.scrollTop = sc; } return; }
      if (a === 'bookme') { S.bookFollow = true; return centerBookOnMe(true); }
      if (a === 'here') { const p = S.progress[w.id]; simPath = null; S.me = standAt(w, p.current); return arrive(p.current); }
      if (a === 'next') return showStop(S.progress[w.id].current + 1);
      if (a === 'prev') return showStop(S.progress[w.id].current - 1);
      if (a === 'stopread') return stopSpeak();
      if (a === 'play') {
        const s = w.stops[S.progress[w.id].current];
        if (speaking.stopId === s.id) return speaking.paused ? resumeSpeak() : pauseSpeak();
        speaking.paused = false; return speakStop(s);
      }
      if (a === 'directions') {
        const p = S.progress[w.id], t = w.stops[p ? p.current : 0]; if (!t) return;
        const ios = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
        const url = ios ? `https://maps.apple.com/?daddr=${t.lat},${t.lng}&dirflg=w` : `https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}&travelmode=walking`;
        const link = Object.assign(document.createElement('a'), { href: url, target: '_blank', rel: 'noopener' }); document.body.appendChild(link); link.click(); link.remove(); return;
      }
    }
  });
  $app.addEventListener('scroll', (e) => {
    if (e.target.id !== 'walk' || S.mode !== 'read') return;
    let best = S.focus; document.querySelectorAll('.stop').forEach((s) => { if (s.getBoundingClientRect().top < 160) best = Number(s.dataset.i); }); S.focus = best;
  }, true);
  $app.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('gw')) openGloss(e.target.dataset.word); });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => S.settings.theme === 'system' && render());

  // Demo bar: demo mode unlocks every walk and the book-map overlay and walks by itself; off is the real app
  // (free trial, the phone's GPS). Reset clears everything this preview saved in the browser (Nick, 25 Nov 2026).
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isReading()) stopSpeak(); });
  // Keep the Stop button in step with real playback on every screen.
  setInterval(() => { const fab = document.getElementById('stopfab'); if (!fab || fab.hidden === isReading()) markReading(); }, 400);
  const demoBar = document.createElement('div');
  demoBar.id = 'demobar';
  document.body.insertBefore(demoBar, $app);
  let resetArmed = 0;
  const drawBar = () => {
    demoBar.innerHTML = `<span class="dmtag">Preview</span><button class="dmsw" role="switch" aria-checked="${S.demo}" data-dm="demo"><i></i>Demo mode</button><button class="dmreset" data-dm="reset">${resetArmed ? 'Tap again to reset' : 'Reset'}</button>`;
  };
  demoBar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dm]'); if (!b) return;
    if (b.dataset.dm === 'demo') {
      S.demo = !S.demo;
      if (S.demo) { S.realPro = S.isPro; S.isPro = true; toast('Demo mode on: every walk is open and the walk moves by itself.'); }
      else { S.isPro = S.realPro; stopSim(); if (S.view === 'go' && !canOpen(S.walkId, S.progress[S.walkId] ? S.progress[S.walkId].current : 0)) { S.view = null; S.active = null; } toast('Demo mode off: the free trial and your phone\u2019s GPS.'); }
      persist(); drawBar(); return render();
    }
    if (!resetArmed) { resetArmed = setTimeout(() => { resetArmed = 0; drawBar(); }, 3000); return drawBar(); }
    clearTimeout(resetArmed); stopSim(); stopSpeak();
    try { Object.keys(store).filter((k) => k.indexOf('ww.') === 0).forEach((k) => store.removeItem(k)); } catch (err) {}
    location.reload();
  });
  drawBar();

  render();
  // Guest first: no sign-in wall on launch. Sign-in lives in Profile and the purchase sheet.
})();
