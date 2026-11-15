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
    volume: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
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
    settings: load('settings', { theme: 'system', autoNarrate: false, arrival: 35, rate: 1, textScale: 1, alerts: true }),
    isPro: load('pro', false), profile: load('profile', null), favs: load('favs', []), progress: load('progress', {}), active: load('active', null),
    layout: 'split', sim: false, me: null, heading: 0, arrivedBanner: null, follow: 'follow',
  };
  const persist = () => { save('settings', S.settings); save('pro', S.isPro); save('profile', S.profile); save('favs', S.favs); save('progress', S.progress); save('active', S.active); };
  const walk = (id) => D.walks.find((w) => w.id === id);
  const canOpen = (wid, i) => S.isPro || (wid === TRIAL.walkId ? i < TRIAL.freeStops : i < 1);
  const canStart = (wid) => S.isPro || wid === TRIAL.walkId;
  const applyTheme = () => {
    const t = S.settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.setProperty('--ts', S.settings.textScale);
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
  const rich = (t) => esc(t).replace(/([A-Za-zĀāĒēĪīŌōŪū‘ʻ’']{3,})/g, (m) => { const g = gloss.get(norm(m)); return g ? `<span class="gw" role="button" tabindex="0" data-word="${esc(g.word)}">${m}</span>` : m; });

  // ---------- speech ----------
  const synth = window.speechSynthesis;
  let speakTok = 0;
  const prep = (t) => t.replace(/\bSt\./g, 'Street').replace(/\bAve\./g, 'Avenue').replace(/\bBlvd\./g, 'Boulevard').replace(/\bRd\./g, 'Road').replace(/[*•]/g, '');
  const speaking = { stopId: null, para: -1 };
  function speakStop(stop) {
    if (!synth) return toast('Read aloud is not available in this browser. It uses the phone voice in the app.');
    synth.cancel(); const tok = ++speakTok;
    const parts = [`Stop ${stop.n}. ${stop.title}.`, ...stop.blocks.filter((b) => ['p', 'direction', 'tagline'].includes(b.kind)).map((b) => prep(b.text))];
    let i = 0;
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
  function stopSpeak() { speakTok++; if (synth) synth.cancel(); speaking.stopId = null; speaking.para = -1; markReading(); }
  function markReading() {
    document.querySelectorAll('[data-para]').forEach((el) => { el.classList.toggle('reading', el.dataset.stop === speaking.stopId && Number(el.dataset.para) === speaking.para); });
    document.querySelectorAll('[data-listen]').forEach((el) => { const on = el.dataset.listen === speaking.stopId; el.innerHTML = on ? `${ic('stop')} Stop` : `${ic('volume')} Listen`; });
    const pb = document.getElementById('playbtn'); if (pb) pb.innerHTML = ic(speaking.stopId ? 'stop' : 'headset');
    const mb = document.querySelector('.minibar'); if (mb && !speaking.stopId) { const h = mb.querySelector('.hush'); if (h) h.outerHTML = ic('down', 'width="22" height="22" style="transform:rotate(180deg)"'); }
  }

  // ---------- rendering helpers ----------
  function blocksHtml(blocks, stopId) {
    let r = -1;
    return blocks.map((b) => {
      const readable = ['p', 'direction', 'tagline'].includes(b.kind); if (readable) r++;
      const attrs = readable ? `data-stop="${stopId}" data-para="${r}"` : '';
      if (b.kind === 'direction') return `<div class="dir" ${attrs}>${ic('walk')}<div>${rich(b.text)}</div></div>`;
      if (b.kind === 'info') return `<div class="info"><span style="color:var(--gold)">${ic('bus', 'width="18" height="18"')}</span><div>${esc(b.text)}</div></div>`;
      if (b.kind === 'tagline' || b.kind === 'heading') return `<p class="p italic" style="color:var(--leaf);font-size:18px" ${attrs}>${esc(b.text)}</p>`;
      if (b.kind === 'caption') return `<p class="small italic">${esc(b.text)}</p>`;
      return `<p class="p" ${attrs}>${rich(b.text)}</p>`;
    }).join('');
  }
  const photosHtml = (ph) => (ph.length ? `<div class="photos">${ph.map((p, i) => img(p.file, '', p.caption || 'Photograph from the book').replace('<img ', `<img data-ph="${i}" `)).join('')}</div>` : '');

  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $app.appendChild(t); setTimeout(() => t.remove(), 2600); }

  // ---------- screens ----------
  const GROUPS = [['Along the beach', ['II', 'III', 'IV', 'VII']], ['Royal Waikīkī and the park', ['V', 'VI']], ['Around the canal', ['I']], ['Into the ahupuaʻa', ['VIII', 'IX', 'X']], ['University of Hawaiʻi', ['XI', 'XII']]];

  function walkCard(w, wide) {
    const locked = !S.isPro && w.id !== TRIAL.walkId;
    const pill = w.id === TRIAL.walkId && !S.isPro ? `<span class="pill" style="background:var(--gold);color:#3a2200">FREE PREVIEW</span>` : locked ? `<span class="pill" style="background:rgba(0,0,0,.45);color:#fff">${ic('lock', 'width="11" height="11"')}</span>` : '';
    const stats = [w.facts.distance, w.facts.duration, `${w.stops.length} stops`].filter(Boolean).join('  ·  ');
    return `<button class="wcard ${wide ? 'wide' : ''}" data-walk="${w.id}" aria-label="Walk ${w.id}, ${esc(w.title)}">${img(w.cover)}<span class="shade"></span><span class="badge" style="background:${w.color}">${w.id}</span>${pill}<span class="meta"><h3>${esc(w.title)}</h3><div class="theme">${esc(w.theme || '')}</div><div class="stats">${esc(stats)}</div></span></button>`;
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
        <button class="iconbtn" style="position:absolute;right:16px;top:calc(env(safe-area-inset-top) + 14px)" data-act="lens" aria-label="What am I looking at?">${ic('scan')}</button>
        <div class="txt"><div class="italic" style="font-size:18px">${greet}${name}</div><h1>Waikīkī</h1><div class="sub">TWELVE WALKS THROUGH TIME</div><div class="small" style="margin-top:4px">by Veneeta Acson, Ph.D.</div></div></div>
      <div class="pad stack" style="gap:20px">
        ${smartCard()}
        <button class="small" data-act="pretend" style="align-self:center;margin-top:-10px">${S.pretendHere ? 'Preview: stop pretending I’m in Waikīkī' : 'Preview: pretend I’m standing in Waikīkī'}</button>
        <button class="fact" id="fact" aria-label="Show another fact"><div class="flower" style="right:-8px;top:-8px">${hib(58, 'var(--accent)', -12)}</div><div class="row label" style="color:var(--leaf);margin-bottom:6px">${ic('sparkles', 'width="14" height="14"')} Did you know?</div><div class="ftxt" id="ftxt"></div><div class="small" id="fsrc" style="margin-top:6px"></div></button>
        ${GROUPS.map(([t, ids]) => `<section class="group stack" style="gap:10px"><div><h2>${t}</h2>${wave(90, 'var(--primary)')}</div>${ids.length === 1 ? walkCard(walk(ids[0]), true) : `<div class="rail">${ids.map((i) => walkCard(walk(i))).join('')}</div>`}</section>`).join('')}
        <button class="card" data-act="about" style="text-align:left;background:var(--card2)"><h3 style="font-family:var(--body);font-weight:800;font-size:17px">About the book and the author</h3><div class="small" style="color:var(--text);margin-top:4px">How to read the directions (mauka, makai, ʻEwa, Diamond Head), and the story behind these walks.</div></button>
        <div style="text-align:center"><div class="italic" style="color:var(--leaf)">For Alice and Ezra</div><button class="small" data-act="credits" style="margin-top:4px">© 2026 Veneeta Acson · Credits</button></div>
      </div></div>`;
  }

  let factTimer, factIdx = 0;
  const factPool = [...D.facts].sort(() => Math.random() - 0.5);
  function showFact() {
    const el = document.getElementById('ftxt'); if (!el) return;
    const f = factPool[factIdx % factPool.length]; el.style.opacity = 0;
    setTimeout(() => { el.textContent = f.text; document.getElementById('fsrc').textContent = `From Walk ${f.walkId}, ${walk(f.walkId).title}`; el.style.opacity = 1; }, 220);
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
    const startLabel = !canStart(w.id) ? 'Unlock this walk' : S.active === w.id ? 'Return to walk' : prog && prog.visited.length && !prog.finishedAt ? 'Continue walk' : 'Start walk';
    const chips = [w.facts.distance && `<span class="chip">${ic('steps', 'width="14" height="14"')} ${esc(w.facts.distance)}</span>`, w.facts.duration && `<span class="chip">${ic('time', 'width="14" height="14"')} ${esc(w.facts.duration)}</span>`, `<span class="chip">${ic('pin', 'width="14" height="14"')} ${w.stops.length} stops</span>`, w.id === TRIAL.walkId && !S.isPro ? `<span class="chip" style="color:var(--gold)">${ic('gift', 'width="14" height="14"')} First ${TRIAL.freeStops} free</span>` : ''].filter(Boolean).join('');
    const stops = w.stops.map((s, i) => {
      const locked = !canOpen(w.id, i), fav = S.favs.includes(s.id);
      return `<section class="stop pad stack" id="stop-${i}" data-i="${i}" style="gap:12px">
        <div class="stophead"><span class="num" style="background:${locked ? '#8A9A9B' : w.color}">${s.n}</span><div><h2>${esc(s.title)}</h2>${s.subtitle ? `<div class="italic small">${esc(s.subtitle)}</div>` : ''}</div></div>${wave(70, w.color)}
        ${locked ? teaser(s) : `
        <div class="actions"><button class="action" data-listen="${s.id}" data-i="${i}">${ic('volume')} Listen</button><button class="action" data-onmap="${i}">${ic('map')} On map</button><button class="action" data-fav="${s.id}" aria-label="${fav ? 'Remove from saved' : 'Save stop'}" style="color:var(--accent)">${ic(fav ? 'heartFill' : 'heart')}</button></div>
        ${photosHtml(s.photos)}${blocksHtml(s.blocks, s.id)}`}
      </section>`;
    }).join('');
    return `<div class="screen" id="walk" style="padding-bottom:120px">
      <div id="readview" class="${S.mode === 'read' ? '' : 'hidden'}">
        <div class="whero">${img(w.cover) || `<div style="height:100%;background:${w.color}"></div>`}<div class="fade"></div><div class="flower" style="right:-24px;bottom:40px">${hib(110, '#D6336C', 25)}</div></div>
        <div class="pad stack wtitle"><span class="romanchip" style="background:${w.color}">Walk ${w.id}</span><h1>${esc(w.title)}</h1><div class="italic" style="color:var(--leaf);font-size:19px">${esc(w.theme)}</div><div class="chips">${chips}</div>
          ${blocksHtml(w.intro, w.id + '-intro')}${w.info.map((x) => `<div class="info"><span style="color:var(--gold)">${ic('bus', 'width="18" height="18"')}</span><div>${esc(x)}</div></div>`).join('')}</div>
        ${stops}
      </div>
    </div>
    <div id="mapview" class="${S.mode === 'map' ? '' : 'hidden'}" style="position:absolute;inset:0"><div class="map" id="wmap"></div><div class="maprail" id="rail">${w.stops.map((s, i) => `<button class="mcard ${i === S.focus ? 'on' : ''}" data-card="${i}">${!canOpen(w.id, i) ? `<span class="ph" style="background:#8A9A9B;color:#fff">${ic('lock')}</span>` : s.photos[0] && IMG[s.photos[0].file] ? img(s.photos[0].file) : `<span class="ph" style="background:${w.color}">${hib(40, '#fff')}</span>`}<div style="min-width:0"><div class="label">Stop ${s.n}</div><div style="font-weight:800;line-height:1.25">${esc(s.title)}</div><div class="small" style="color:var(--primary);margin-top:3px">${canOpen(w.id, i) ? 'Read this stop' : 'Unlock to read'}</div></div></button>`).join('')}</div><div class="attrib">© OpenStreetMap contributors</div><div style="position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 66px);z-index:900"><button class="mapbtn" data-act="layers" aria-label="Map style">${ic('layers')}</button></div></div>
    <div class="topbar"><button class="iconbtn" data-act="back" aria-label="Back">${ic('back')}</button><div class="seg" role="tablist"><button role="tab" aria-selected="${S.mode === 'read'}" data-mode="read">${ic('book')} Read</button><button role="tab" aria-selected="${S.mode === 'map'}" data-mode="map">${ic('map')} Map</button></div><button class="iconbtn" data-act="fit" aria-label="Show all stops">${ic('scan')}</button></div>
    <div class="cta ${S.mode === 'read' ? 'solid' : ''}"><button class="btn block ${canStart(w.id) ? '' : 'accent'}" data-act="start">${ic(canStart(w.id) ? 'navigate' : 'unlock')} ${startLabel}</button></div>`;
  }

  // Shared Leaflet map builder with offline tiles.
  function makeMap(el, w, opts) {
    const T = window.WWTILES || {};
    const Layer = L.GridLayer.extend({ createTile(c) { const t = document.createElement('img'); const k = `${c.z}/${c.x}/${c.y}`; if (T[k]) t.src = T[k]; else { t.style.background = '#e9e5dc'; } t.alt = ''; return t; } });
    const map = L.map(el, { zoomControl: false, attributionControl: false, minZoom: 14, maxZoom: 18 });
    new Layer({ maxNativeZoom: 16, minNativeZoom: 14, tileSize: 256 }).addTo(map);
    map.on('dragstart', () => { if (S.follow !== 'off') { S.follow = 'off'; el.style.transform = ''; const b = document.querySelector('[data-act="locate"]'); if (b) { b.classList.remove('on'); b.innerHTML = ic('navigate'); } } });
    const pts = w.stops.map((s) => [s.lat, s.lng]);
    L.polyline(pts, { color: isDark() ? '#7FD1C7' : '#0E6E74', weight: 4, dashArray: '8 6' }).addTo(map);
    const markers = w.stops.map((s, i) => {
      const m = L.marker([s.lat, s.lng], { icon: L.divIcon({ className: '', html: '', iconSize: [28, 28] }) }).addTo(map);
      m.on('click', () => opts.onSelect && opts.onSelect(i));
      return m;
    });
    const seg = L.polyline([], { color: '#D6336C', weight: 6 }).addTo(map);
    const me = L.marker([0, 0], { icon: L.divIcon({ className: '', html: '<div class="me"><span class="cone"></span></div>', iconSize: [18, 18] }), interactive: false, zIndexOffset: 2000 });
    const api = {
      map,
      paint(cur, visited) {
        markers.forEach((m, i) => {
          const s = w.stops[i], locked = !canOpen(w.id, i), done = visited.includes(i), isCur = i === cur;
          const bg = isCur ? '#D6336C' : done ? '#3A7D44' : locked ? '#8A9A9B' : w.color;
          m.setIcon(L.divIcon({ className: '', html: `<div class="pin ${isCur ? 'cur' : ''}" style="background:${bg}">${locked ? ic('lock', 'width="11" height="11"') : s.n}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }));
          m.setZIndexOffset(isCur ? 1000 : 0);
        });
        seg.setLatLngs(cur >= 0 && cur < pts.length - 1 && opts.showSeg ? [pts[cur], pts[cur + 1]] : []);
      },
      fit() { map.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [40, 80], paddingBottomRight: [40, opts.bottom || 40] }); },
      focus(i) { map.setView(pts[i], 17, { animate: true }); },
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
    if (!wmap) {
      wmap = makeMap(document.getElementById('wmap'), w, { bottom: 200, onSelect: (i) => { S.focus = i; syncRail(true); wmap.paint(S.focus, (S.progress[w.id] || { visited: [] }).visited); } });
    }
    setTimeout(() => { wmap.map.invalidateSize(); wmap.paint(S.focus, (S.progress[w.id] || { visited: [] }).visited); wmap.focus(S.focus); syncRail(false); }, 50);
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
    let navLine = 'Turn on “Simulate walking” to move along the route, or tap “I’m here”.';
    let rot = 0;
    if (here) navLine = 'Read or listen below, then tap Next.';
    else if (S.me) { const d = dist(S.me, stop), b = bearing(S.me, stop); rot = b - S.heading; navLine = `${fmt(d)} · about ${Math.max(1, Math.round(d / 67))} min · head ${hawaiianDir(b)}`; }
    return `<div id="go" class="l-${S.layout}" style="position:absolute;inset:0">
      <div class="mapwrap"><div class="map" id="gmap"></div><div class="attrib">© OpenStreetMap contributors</div></div>
      <div class="gohead"><button class="iconbtn" data-act="minimize" aria-label="Minimize walk">${ic('down')}</button><div class="gopill"><div class="label">Walk ${w.id} · ${visited.length}/${w.stops.length}</div><div>${esc(w.title)}</div></div><button class="iconbtn" data-act="end" aria-label="End walk">${ic('close')}</button></div>
      ${S.layout !== 'read' ? `<button class="simtoggle" data-act="sim" aria-pressed="${S.sim}" style="position:absolute;left:12px;z-index:1000;top:calc(${S.layout === 'map' ? '100% - 260px' : '46% - 70px'})">${S.sim ? '⏸ Demo walk: moving' : '▶ Demo walk'}</button><div class="simbar"><button class="mapbtn ${S.follow !== 'off' ? 'on' : ''}" data-act="locate" aria-label="Center on me">${ic(S.follow === 'heading' ? 'compass' : 'navigate')}</button><button class="mapbtn" data-act="layers" aria-label="Map style">${ic('layers')}</button><button class="mapbtn" data-act="whole" aria-label="Show whole walk">${ic('map')}</button></div>` : ''}
      ${S.arrivedBanner !== null ? `<div class="arrived" role="status">${hib(26, '#fff')}<span>You’ve arrived: ${esc(w.stops[S.arrivedBanner].title)}</span></div>` : ''}
      <div class="sheet">
        <div class="layouts">${['map', 'split', 'read'].map((l) => `<button data-layout="${l}" aria-pressed="${S.layout === l}" aria-label="${l} view">${ic(l === 'map' ? 'map' : l === 'split' ? 'split' : 'reader')}</button>`).join('')}</div>
        <div class="nav ${here ? 'here' : ''}">${here ? `<span style="color:var(--leaf)">${ic('check', 'width="34" height="34"')}</span>` : `<span class="arrow" style="transform:rotate(${rot}deg)">${ic('navigate', 'width="30" height="30"')}</span>`}
          <div style="flex:1;min-width:0"><div class="label">${here ? `You’re at stop ${stop.n}` : `Heading to stop ${stop.n}`}</div><h3>${esc(stop.title)}</h3><div class="small">${navLine}</div></div>
          ${!here ? `<button class="iconbtn" style="background:var(--primary);color:var(--onprimary);border:0" data-act="directions" aria-label="Walking directions">${ic('directions')}</button>` : ''}</div>
        <div class="gobody" id="gobody">${photosHtml(stop.photos)}${blocksHtml(stop.blocks, stop.id)}${stop.geo !== 'verified' ? `<p class="small italic">Pin location is a draft (${stop.geo}). Use “I’m here” if the alert doesn’t fire.</p>` : ''}</div>
        <div class="controls"><button class="iconbtn" data-act="prev" aria-label="Previous stop">${ic('prev')}</button><button class="play" id="playbtn" data-act="play" aria-label="Read aloud or stop">${ic(speaking.stopId ? 'stop' : 'headset')}</button>
          ${here ? `<button class="btn block ${nextLocked ? 'accent' : ''}" data-act="next">${ic(nextLocked ? 'unlock' : 'fwd')} ${cur + 1 >= w.stops.length ? 'Finish' : nextLocked ? 'Unlock next stop' : 'Next stop'}</button>` : `<button class="btn block" data-act="here">${ic('flag')} I’m here</button>`}</div>
      </div></div>`;
  }
  function mountGoMap() {
    const w = walk(S.walkId), prog = S.progress[w.id];
    const el = document.getElementById('gmap'); if (!el || S.layout === 'read') { gmap = null; return; }
    gmap = makeMap(el, w, { showSeg: true, bottom: S.layout === 'map' ? 220 : 30, onSelect: (i) => goTo(i) });
    gmap.paint(prog.current, prog.visited); gmap.me(S.me, S.heading);
    setTimeout(() => { gmap.map.invalidateSize(); if (S.me) gmap.map.setView([S.me.lat, S.me.lng], 17); else gmap.focus(prog.current); }, 60);
  }
  function arrive(i) {
    const w = walk(S.walkId), prog = S.progress[w.id];
    if (!prog.visited.includes(i)) prog.visited.push(i);
    prog.current = i; persist();
    S.arrivedBanner = i; setTimeout(() => { S.arrivedBanner = null; const b = document.querySelector('.arrived'); b && b.remove(); }, 4200);
    if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) {}
    render();
    if (S.settings.autoNarrate) speakStop(w.stops[i]);
  }
  function goTo(i) {
    const w = walk(S.walkId), prog = S.progress[w.id];
    if (i < 0) return;
    if (i >= w.stops.length) { finishWalk(); return; }
    if (!canOpen(w.id, i)) { stopSim(); openPaywall(); return; }
    stopSpeak(); prog.current = i; persist(); render();
  }
  function tickSim() {
    const w = walk(S.walkId), prog = S.progress[w.id], target = w.stops[prog.current];
    if (!S.me) { const prev = w.stops[Math.max(0, prog.current - 1)]; S.me = { lat: prev.lat - 0.0012, lng: prev.lng - 0.0009 }; }
    const d = dist(S.me, target);
    S.heading = bearing(S.me, target);
    const step = 18; // meters per tick (a brisk, sped-up walk)
    if (d > 2) { const f = Math.min(1, step / d); S.me = { lat: S.me.lat + (target.lat - S.me.lat) * f, lng: S.me.lng + (target.lng - S.me.lng) * f }; }
    if (gmap) { gmap.me(S.me, S.heading); if (S.follow === 'off') {} }
    // Arrival check, same rule as the app: within the arrival radius plus a GPS allowance.
    if (dist(S.me, target) <= S.settings.arrival && !prog.visited.includes(prog.current)) { arrive(prog.current); return; }
    const nav = document.querySelector('.nav .small'); if (nav && !prog.visited.includes(prog.current)) { const dd = dist(S.me, target); nav.textContent = `${fmt(dd)} · about ${Math.max(1, Math.round(dd / 67))} min · head ${hawaiianDir(S.heading)}`; }
    const ar = document.querySelector('.nav .arrow'); if (ar) ar.style.transform = 'rotate(0deg)';
  }
  function startSim() { S.sim = true; clearInterval(simTimer); simTimer = setInterval(() => { const prog = S.progress[S.walkId]; if (prog && prog.visited.includes(prog.current)) return; tickSim(); }, 700); }
  function stopSim() { S.sim = false; clearInterval(simTimer); }
  function finishWalk() { const prog = S.progress[S.walkId]; prog.finishedAt = Date.now(); S.active = null; stopSim(); stopSpeak(); persist(); toast(`Mahalo for walking ${walk(S.walkId).title}!`); S.view = 'walk'; render(); }

  function renderSaved() {
    const items = D.walks.flatMap((w) => w.stops.map((s, i) => ({ w, s, i }))).filter((x) => S.favs.includes(x.s.id));
    return `<div class="screen pad" style="padding-top:calc(env(safe-area-inset-top) + 20px)"><h1 style="font-size:32px;margin-bottom:14px">Saved stops</h1>
      ${items.length ? `<div class="stack" style="gap:10px">${items.map((x) => `<button class="card row" data-open="${x.w.id}:${x.i}" style="text-align:left;padding:10px"><span class="num" style="background:${x.w.color}">${x.s.n}</span><div style="flex:1"><div class="label">Walk ${x.w.id}</div><div style="font-weight:800">${esc(x.s.title)}</div></div></button>`).join('')}</div>` : `<div class="stack" style="align-items:center;margin-top:60px">${plum(80)}<p class="small" style="text-align:center">Tap the heart on any stop to keep it here.</p></div>`}</div>`;
  }

  function renderProfile() {
    const fin = Object.values(S.progress).filter((p) => p.finishedAt).length, vis = Object.values(S.progress).reduce((a, p) => a + p.visited.length, 0), tot = D.walks.reduce((a, w) => a + w.stops.length, 0);
    const signed = S.profile && S.profile.provider !== 'guest';
    const row = (icn, label, act) => `<button class="setrow" data-act="${act}" style="width:100%;text-align:left;border-bottom:1px solid var(--line)"><span style="color:var(--primary)">${ic(icn, 'width="22" height="22"')}</span><span style="flex:1">${label}</span></button>`;
    return `<div class="screen pad" style="padding-top:calc(env(safe-area-inset-top) + 20px)"><div class="stack">
      <div class="row" style="gap:14px"><div style="width:68px;height:68px;border-radius:34px;background:var(--accentsoft);display:flex;align-items:center;justify-content:center">${hib(52, 'var(--accent)')}</div><div><h1 style="font-size:26px">${signed ? esc(S.profile.name || 'Walker') : 'Guest walker'}</h1><div class="small">${signed ? esc(S.profile.email || S.profile.provider) : 'Sign in to save your progress across devices'}</div></div></div>
      ${signed ? '' : `<button class="btn block" data-act="auth">${ic('person')} Sign in or create account</button>`}
      <div class="card row" style="justify-content:space-around;text-align:center">${[[fin, 'Walks finished'], [vis, 'Stops visited'], [Math.round((vis / tot) * 100), '% of the book']].map(([n, l]) => `<div><div style="font-family:var(--display);font-size:28px;color:var(--primary)">${n}</div><div class="small">${l}</div></div>`).join('')}</div>
      <div class="card stack" style="gap:10px"><div class="row" style="font-weight:800">${ic(S.isPro ? 'sparkles' : 'unlock', 'width="20" height="20"')} ${S.isPro ? 'All twelve walks unlocked' : 'Free preview'}</div><div class="small">${S.isPro ? 'Mahalo for supporting the book.' : 'Unlock every walk, every stop, read-aloud narration, and offline maps.'}</div>${S.isPro ? `<button class="btn outline" data-act="unpro">Reset preview purchase</button>` : `<button class="btn accent" data-act="paywall">${ic('sparkles')} Unlock all walks</button>`}</div>
      <div class="card" style="padding:4px 16px">${row('settings', 'Settings', 'settings')}${row('scan', 'What am I looking at?', 'lens')}${row('book', 'About the book', 'about')}${row('sparkles', 'Credits and copyright', 'credits')}${signed ? row('back', 'Sign out', 'signout') : ''}</div>
      <p class="small" style="text-align:center">Web preview of the iPhone and Android app. Purchases and sign-in are simulated here.</p></div></div>`;
  }

  function tabs() {
    const t = [['home', 'flower', 'Walks'], ['explore', 'map', 'Map'], ['saved', 'heart', 'Saved'], ['profile', 'person', 'Profile']];
    return `<nav class="tabs" role="tablist">${t.map(([k, i, l]) => `<button role="tab" aria-selected="${S.tab === k}" data-tab="${k}">${ic(i)}${l}</button>`).join('')}</nav>`;
  }
  function minibar() {
    if (!S.active || S.view === 'go') return '';
    const w = walk(S.active), p = S.progress[w.id], s = w.stops[p.current];
    return `<button class="minibar" data-act="resume"><span class="dot">${ic('walk', 'width="18" height="18"')}</span><span style="flex:1;min-width:0"><b>Stop ${s.n}: ${esc(s.title)}</b><span>Walk ${w.id} · ${esc(w.title)} · ${p.visited.length}/${w.stops.length} visited</span></span>${speaking.stopId ? `<span class="hush" data-hush role="button" aria-label="Stop reading">${ic('stop', 'width="20" height="20"')}</span>` : ic('down', 'width="22" height="22" style="transform:rotate(180deg)"')}</button>`;
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
    const map = L.map(el, { zoomControl: false, attributionControl: false, minZoom: 14, maxZoom: 18 }).setView([21.283, -157.825], 14);
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
      const pts = w.stops.map((s) => [s.lat, s.lng]);
      L.polyline(pts, { color: w.color, weight: 4, dashArray: '8 6' }).addTo(group);
      w.stops.forEach((s, i) => L.marker([s.lat, s.lng], { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${canOpen(w.id, i) ? w.color : '#8A9A9B'}">${canOpen(w.id, i) ? s.n : ic('lock', 'width="11" height="11"')}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(group).on('click', () => openWalk(w.id, i)));
      map.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [30, 70], paddingBottomRight: [30, 200] });
      const h = document.getElementById('ehint'); h.innerHTML = `${ic('back', 'width="14" height="14"')} All walks`; h.setAttribute('role', 'button'); h.onclick = showAll;
      const c = document.getElementById('ecard'); c.classList.remove('hidden');
      c.innerHTML = `<div class="label">Walk ${w.id}</div><h2 style="font-size:22px">${esc(w.title)}</h2><div class="small">${esc(w.theme)}</div><button class="btn block" style="margin-top:10px" data-walk="${w.id}">Open walk ${ic('fwd')}</button>`;
    };
    showAll();
  }

  // Modals
  function modal(html, center) { const m = document.createElement('div'); m.className = 'modal' + (center ? ' center' : ''); m.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${html}<button class="iconbtn close" data-close aria-label="Close">${ic('close')}</button></div>`; m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); }); $app.appendChild(m); return m; }
  function openPaywall() {
    let sel = 'forever';
    const plans = [['week', '7-day pass', '$9.99', 'All 12 walks for your trip. Never renews.', false], ['forever', 'Yours forever', '$34.99', 'All 12 walks, every visit, one payment', true]];
    const priceOf = (id) => plans.find((p) => p[0] === id)[2];
    const perks = [['map', 'All 12 walks and every stop, from Kālia to Mānoa Falls'], ['headset', 'Read-aloud narration, hands free with headphones'], ['pin', 'Arrival alerts, even with your phone in your pocket'], ['book', 'Historic photographs from the book'], ['scan', '“What am I looking at?” for landmarks along the way']];
    const m = modal(`<div class="stack"><div class="row">${hib(64, '#D6336C', -15)}${plum(40, 20)}</div><h1 style="font-size:30px">Walk all of Waikīkī</h1><div class="italic" style="color:var(--leaf)">Twelve walks through a thousand years, in Veneeta’s own words.</div>
      ${perks.map(([i, t]) => `<div class="perk"><i>${ic(i)}</i><span>${t}</span></div>`).join('')}
      <div class="stack" role="radiogroup" style="gap:12px;margin-top:6px">${plans.map(([id, t, p, n, b]) => `<button class="plan" role="radio" aria-checked="${id === sel}" data-plan="${id}"><span style="flex:1"><b>${t}</b><div class="small">${n}</div></span><b>${p}</b>${b ? '<span class="best">BEST VALUE</span>' : ''}</button>`).join('')}</div>
      <button class="btn accent block" data-buy>${ic('sparkles')} <span id="buylabel">Unlock for ${priceOf(sel)}</span></button><p class="small" style="text-align:center">One-time purchase. Nothing renews or charges you again. Preview only: no real payment.</p></div>`);
    m.addEventListener('click', (e) => { const p = e.target.closest('[data-plan]'); if (p) { sel = p.dataset.plan; m.querySelectorAll('[data-plan]').forEach((x) => x.setAttribute('aria-checked', x.dataset.plan === sel)); m.querySelector('#buylabel').textContent = `Unlock for ${priceOf(sel)}`; } if (e.target.closest('[data-buy]')) { S.isPro = true; persist(); m.remove(); toast('Mahalo nui loa! All twelve walks are open (preview).'); render(); } });
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
        <label class="small" for="ts">Text size</label><input id="ts" type="range" min="0.9" max="1.4" step="0.05" value="${st.textScale}"></div>
      <div class="label">Walking</div><div class="card">${sw('alerts', 'Arrival alerts', 'Tell me when I reach a stop')}<label class="small" for="ar">Arrival distance: <span id="arv">${st.arrival}</span> m</label><input id="ar" type="range" min="15" max="80" step="5" value="${st.arrival}"></div>
      <div class="label">Read aloud</div><div class="card">${sw('autoNarrate', 'Read each stop on arrival', 'Great with headphones')}<label class="small" for="rt">Speed: <span id="rtv">${st.rate.toFixed(2)}</span>×</label><input id="rt" type="range" min="0.7" max="1.3" step="0.05" value="${st.rate}"><p class="small">The app uses the phone’s own voices (Siri on iPhone, Google on Android). Recorded narration can replace them later.</p></div>
      <div class="label">Privacy</div><div class="card small">Your location is used on your phone to place you on the map and detect arrivals. It is not sent to a server.</div>
      <button class="btn outline" data-reset>Reset walk progress</button></div>`);
    m.addEventListener('click', (e) => {
      const s = e.target.closest('[data-sw]'); if (s) { st[s.dataset.sw] = !st[s.dataset.sw]; s.setAttribute('aria-checked', st[s.dataset.sw]); persist(); }
      const t = e.target.closest('[data-theme-set]'); if (t) { st.theme = t.dataset.themeSet; m.querySelectorAll('[data-theme-set]').forEach((x) => x.setAttribute('aria-selected', x.dataset.themeSet === st.theme)); persist(); applyTheme(); }
      if (e.target.closest('[data-reset]')) { S.progress = {}; S.active = null; persist(); toast('Progress reset'); m.remove(); render(); }
    });
    m.addEventListener('input', (e) => { if (e.target.id === 'ts') { st.textScale = Number(e.target.value); applyTheme(); } if (e.target.id === 'ar') { st.arrival = Number(e.target.value); m.querySelector('#arv').textContent = st.arrival; } if (e.target.id === 'rt') { st.rate = Number(e.target.value); m.querySelector('#rtv').textContent = st.rate.toFixed(2); } persist(); });
  }
  function openAbout() {
    modal(`<div class="stack" style="align-items:stretch"><div style="text-align:center">${hib(64, 'var(--accent)')}<h1 style="font-size:32px">Waikīkī</h1><div style="font-family:var(--display);letter-spacing:.15em">TWELVE WALKS THROUGH TIME</div><div class="italic">Veneeta Acson, Ph.D.</div></div>
      ${D.about.map((s) => `<div class="card stack" style="gap:10px"><h2 style="font-size:21px">${esc(s.title)}</h2>${s.paragraphs.map((p) => `<p class="p" style="font-size:16px">${rich(p)}</p>`).join('')}</div>`).join('')}<p class="small" style="text-align:center">Text and photographs © 2023 Island Heritage. All rights reserved.</p></div>`);
  }
  function openLayers(w) {
    const m = modal(`<div class="stack"><div class="label">Map style</div>
      <button class="plan" aria-checked="true" data-layer="street">${ic('map')}<span style="flex:1"><b>Street map</b></span></button>
      <button class="plan" data-layer="sat">${ic('earth')}<span style="flex:1"><b>Satellite</b><div class="small">In the iPhone and Android app (Apple and Google satellite imagery)</div></span></button>
      ${w.bookMap ? `<button class="plan" data-layer="book">${ic('book')}<span style="flex:1"><b>Veneeta’s map from the book</b><div class="small">The original walk map, pinch to zoom</div></span></button>` : ''}</div>`);
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-layer]'); if (!b) return;
      if (b.dataset.layer === 'sat') return toast('Satellite view is built into the phone app.');
      if (b.dataset.layer === 'book') { m.remove(); modal(`<div class="stack"><div class="label">Walk ${w.id} map from the book</div><div style="overflow:auto;max-height:75vh;border-radius:14px;background:#FBF6EC">${img(w.bookMap).replace('<img ', '<img style="width:180%;max-width:none" ')}</div><p class="small">Scroll to pan. In the app you can pinch to zoom.</p></div>`); return; }
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
    D.walks.forEach((w) => w.stops.forEach((s, i) => { const d = dist(here, s); if (d > 350) return; const off = Math.abs(((bearing(here, s) - heading + 540) % 360) - 180); if (d > 25 && off > 35) return; c.push({ w, s, i, d, score: (1 - d / 350) * 0.6 + (1 - Math.min(off, 90) / 90) * 0.4 }); }));
    c.sort((a, b) => b.score - a.score);
    const top = c[0];
    const m = modal(`<div class="stack"><div class="label">What am I looking at?</div><div style="position:relative;height:200px;border-radius:18px;overflow:hidden;background:#123">${top && top.s.photos[0] ? img(top.s.photos[0].file, '', '').replace('<img ', '<img style="width:100%;height:100%;object-fit:cover;opacity:.75" ') : ''}<div class="reticle" style="top:20px;width:160px;height:160px;margin-left:-80px"></div></div>
      <p class="small">In the app you point the camera at a building, statue or sign. GPS and the compass narrow it to the book’s stops in front of you, and the photo confirms which one. This preview stands you on Kalākaua Avenue facing Diamond Head.</p>
      ${top ? `<div class="card row"><div style="flex:1"><div class="label">Probably in view · ${fmt(top.d)}</div><div style="font-weight:800">${esc(top.s.title)}</div><div class="small">Walk ${top.w.id}, stop ${top.s.n}</div></div><button class="btn" data-lensopen="${top.w.id}:${top.i}">Read</button></div>` : '<p>Nothing from the book in view.</p>'}
      ${c.length > 1 ? `<p class="small">Also nearby: ${c.slice(1, 4).map((x) => esc(x.s.title)).join(', ')}</p>` : ''}</div>`);
    m.addEventListener('click', (e) => { const b = e.target.closest('[data-lensopen]'); if (b) { m.remove(); const [wid, i] = b.dataset.lensopen.split(':'); openWalk(wid, Number(i)); } });
  }
  function openGloss(word) {
    const g = D.glossary.find((x) => x.word === word); if (!g) return;
    const m = modal(`<div class="stack"><h1 style="font-size:30px">${esc(g.word)}</h1><p class="p">${esc(g.meaning)}</p><div class="row"><button class="btn outline" style="flex:1" data-say>${ic('volume')} Hear it</button><button class="btn" style="flex:1" data-close>Mahalo</button></div><p class="small">As defined in the book.</p></div>`, true);
    m.addEventListener('click', (e) => { if (e.target.closest('[data-say]') && synth) { synth.cancel(); const u = new SpeechSynthesisUtterance(g.word); u.rate = 0.85; synth.speak(u); } });
  }
  function openPhotos(stop, idx) {
    const p = stop.photos[idx]; if (!p) return;
    modal(`<div class="stack">${img(p.file).replace('<img ', '<img style="width:100%;border-radius:14px" ')}${p.caption ? `<p class="italic">${esc(p.caption)}</p>` : ''}<p class="small">Photo ${idx + 1} of ${stop.photos.length} · ${esc(stop.title)}</p></div>`, true);
  }

  // ---------- navigation ----------
  async function openWalk(id, stopIdx) {
    S.walkId = id; S.view = 'walk'; S.mode = 'read'; S.focus = stopIdx || 0; wmap = null;
    await needImages(id); render();
    if (stopIdx) setTimeout(() => { const el = document.getElementById('stop-' + stopIdx); el && el.scrollIntoView({ block: 'start' }); }, 60);
  }
  async function startWalk() {
    const w = walk(S.walkId);
    if (!canStart(w.id)) return openPaywall();
    const p = S.progress[w.id];
    if (!p || p.finishedAt) S.progress[w.id] = { current: 0, visited: [], startedAt: Date.now() };
    S.active = w.id; S.view = 'go'; S.me = null; S.follow = 'follow'; persist(); await needImages(w.id); render();
    // The preview can't read real GPS, so it walks the route for you; tap the demo button to pause.
    startSim(); const b = document.querySelector('[data-act="sim"]'); if (b) { b.setAttribute('aria-pressed', true); b.textContent = '⏸ Demo walk: moving'; }
  }

  function render() {
    stopSpeakIfLeaving();
    applyTheme();
    let html = '';
    if (S.view === 'walk') html = renderWalk();
    else if (S.view === 'go') html = renderGo();
    else html = (S.tab === 'home' ? renderHome() : S.tab === 'explore' ? renderExplore() : S.tab === 'saved' ? renderSaved() : renderProfile()) + minibar() + tabs();
    $app.innerHTML = html;
    if (S.view === 'walk' && S.mode === 'map') mountWalkMap();
    if (S.view === 'go') mountGoMap();
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
    if ((el = q('[data-hush]'))) { stopSpeak(); return render(); }
    if ((el = q('.gw'))) return openGloss(el.dataset.word);
    if ((el = q('[data-tab]'))) { S.tab = el.dataset.tab; S.view = null; return render(); }
    if ((el = q('[data-walk]'))) return openWalk(el.dataset.walk);
    if ((el = q('[data-open]'))) { const [w, i] = el.dataset.open.split(':'); return openWalk(w, Number(i)); }
    if ((el = q('#fact'))) { factIdx++; return showFact(); }
    if ((el = q('[data-mode]'))) { S.mode = el.dataset.mode; document.getElementById('readview').classList.toggle('hidden', S.mode !== 'read'); document.getElementById('mapview').classList.toggle('hidden', S.mode !== 'map'); document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', b.dataset.mode === S.mode)); document.querySelector('.cta').classList.toggle('solid', S.mode === 'read'); if (S.mode === 'map') mountWalkMap(); else setTimeout(() => { const s = document.getElementById('stop-' + S.focus); s && S.focus && s.scrollIntoView({ block: 'start' }); }, 30); return; }
    if ((el = q('[data-onmap]'))) { S.focus = Number(el.dataset.onmap); el = document.querySelector('[data-mode="map"]'); return el.click(); }
    if ((el = q('[data-card]'))) { const i = Number(el.dataset.card); const w = walk(S.walkId); if (!canOpen(w.id, i)) return openPaywall(); if (S.focus !== i) { S.focus = i; syncRail(true); wmap.paint(i, (S.progress[w.id] || { visited: [] }).visited); wmap.focus(i); return; } S.focus = i; return document.querySelector('[data-mode="read"]').click(); }
    if ((el = q('[data-listen]'))) { const w = walk(S.walkId); const s = w.stops[Number(el.dataset.i)]; return speaking.stopId === s.id ? stopSpeak() : speakStop(s); }
    if ((el = q('[data-fav]'))) { const id = el.dataset.fav; S.favs = S.favs.includes(id) ? S.favs.filter((x) => x !== id) : [...S.favs, id]; persist(); el.innerHTML = ic(S.favs.includes(id) ? 'heartFill' : 'heart'); return; }
    if ((el = q('[data-ph]'))) { const sec = el.closest('[data-i]'); const w = walk(S.walkId); const stop = sec ? w.stops[Number(sec.dataset.i)] : w.stops[S.progress[w.id].current]; return openPhotos(stop, Number(el.dataset.ph)); }
    if ((el = q('[data-layout]'))) { S.layout = el.dataset.layout; return render(); }
    if ((el = q('[data-act]'))) {
      const a = el.dataset.act, w = S.walkId && walk(S.walkId);
      if (a === 'back') { S.view = null; return render(); }
      if (a === 'fit') { if (S.mode === 'map' && wmap) wmap.fit(); else document.querySelector('[data-mode="map"]').click(); return; }
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
      if (a === 'end') { stopSim(); stopSpeak(); S.active = null; persist(); S.view = 'walk'; toast('Walk ended. Your place is saved.'); return render(); }
      if (a === 'sim') { if (S.sim) stopSim(); else startSim(); el.setAttribute('aria-pressed', S.sim); el.textContent = S.sim ? '⏸ Demo walk: moving' : '▶ Demo walk'; return; }
      if (a === 'whole') { S.follow = 'off'; return gmap && gmap.fit(); }
      if (a === 'locate') {
        if (!S.me) { const p = S.progress[w.id]; const prev = w.stops[Math.max(0, p.current - 1)]; S.me = { lat: prev.lat - 0.0006, lng: prev.lng - 0.0004 }; }
        S.follow = S.follow === 'off' ? 'follow' : S.follow === 'follow' ? 'heading' : 'off';
        el.classList.toggle('on', S.follow !== 'off'); el.innerHTML = ic(S.follow === 'heading' ? 'compass' : 'navigate');
        if (gmap) { gmap.me(S.me, S.heading); if (S.follow === 'off') { document.getElementById('gmap').style.transform = ''; } }
        return toast(S.follow === 'off' ? 'Free map' : S.follow === 'follow' ? 'Following you' : 'Map turns with you');
      }
      if (a === 'layers') return openLayers(w);
      if (a === 'here') { stopSim(); const p = S.progress[w.id]; S.me = { lat: w.stops[p.current].lat, lng: w.stops[p.current].lng }; return arrive(p.current); }
      if (a === 'next') return goTo(S.progress[w.id].current + 1);
      if (a === 'prev') return goTo(S.progress[w.id].current - 1);
      if (a === 'play') { const s = w.stops[S.progress[w.id].current]; return speaking.stopId ? stopSpeak() : speakStop(s); }
      if (a === 'directions') return toast('In the app this opens Apple Maps or Google Maps walking directions to the next stop.');
    }
  });
  $app.addEventListener('scroll', (e) => {
    if (e.target.id !== 'walk' || S.mode !== 'read') return;
    let best = S.focus; document.querySelectorAll('.stop').forEach((s) => { if (s.getBoundingClientRect().top < 160) best = Number(s.dataset.i); }); S.focus = best;
  }, true);
  $app.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('gw')) openGloss(e.target.dataset.word); });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => S.settings.theme === 'system' && render());

  render();
  if (!S.profile) setTimeout(openAuth, 700);
})();
