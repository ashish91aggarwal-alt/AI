// Three canvas-2D materials for the same scene: toon, shadow, gilded.
(function () {
  const { shapes, text, W, H, horizon } = window.SCENE;
  const rng = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const P = (c, pts, close = true) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if (close) c.closePath(); };
  const byId = Object.fromEntries(shapes.filter(s => s.id).map(s => [s.id, s]));
  const withClip = (c, s, fn) => { c.save(); if (s.clip) { P(c, byId[s.clip].pts); c.clip(); } fn(); c.restore(); };
  const bbox = (pts) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
  const center = (pts) => { const b = bbox(pts); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; };
  const grain = (c, amt, seed) => { const r = rng(seed), id = c.getImageData(0, 0, W, H), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; } c.putImageData(id, 0, 0); };
  const label = (c, s, font, col) => { const [cx, cy] = s.tx ? [s.tx, s.ty] : center(s.pts || [[0, 0]]); c.font = `${s.tsize}px ${font}`; c.textAlign = s.align || 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s.text, cx, cy + s.tsize * 0.06); };
  const spokes = (c, [x, y, r], n, col, w) => { c.strokeStyle = col; c.lineWidth = w; for (let i = 0; i < n; i++) { const a = i * Math.PI * 2 / n + 0.3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); c.stroke(); } };

  // ---------------------------------------------------------------- TOON
  function toon(c) {
    const ink = '#2b211c', col = { disc: '#fbf4e4', hill: '#6fa79c', steam: '#fbf4e4', sleeper: '#7a5a3a', rail: ink, beam: '#ffe59a', trim: '#3a2c28', frame: '#3a2c28', boiler: '#d9482b', gold: '#f0c04a', plate: '#fbf4e4', cab: '#2f6f73', roof: '#3a2c28', window: '#ffd76a', saarthi: ink, lamp: '#ffe59a', wheel: '#3a2c28', track: '#7a5a3a', post: ink, boardA: '#fbf4e4', boardB: '#fbf4e4', coachA: '#f08a5d', coachB: '#4f86b8', window2: '#fbf4e4', shirtA: '#f0c04a', shirtB: '#3fa7a0', skin: '#e8b48a', hairA: ink, hairB: '#5a2d1e', ink, badge: '#d9482b' };
    c.fillStyle = '#a9cfd6'; c.fillRect(0, 0, W, horizon); c.fillStyle = '#e9bd55'; c.fillRect(0, horizon, W, H - horizon);
    // sunburst behind the disc
    c.save(); c.translate(850, 440); c.fillStyle = 'rgba(251,244,228,.35)'; for (let i = 0; i < 30; i += 2) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 330, i * Math.PI / 15, (i + 1) * Math.PI / 15); c.fill(); } c.restore();
    const r = rng(7), wob = (pts, a) => pts.map(([x, y]) => [x + (r() - .5) * a, y + (r() - .5) * a]);
    const star = (x, y, s) => { c.fillStyle = '#fbf4e4'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? s * 0.22 : s; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.fill(); };
    [[640, 130, 22], [960, 215, 16], [560, 330, 14], [80, 430, 18], [1000, 600, 14], [60, 760, 14]].forEach(a => star(...a));
    for (const s of shapes) {
      if (!s.pts) { label(c, s, '"Baloo 2"', ink); continue; }
      const f = col[s.role] || '#ccc';
      withClip(c, s, () => {
        if (s.line) { c.strokeStyle = ink; c.lineWidth = 5; c.lineCap = 'round'; P(c, s.pts, false); c.stroke(); return; }
        c.globalAlpha = s.role === 'beam' ? 0.55 : s.veil ? 0.93 : 1;
        c.save(); c.translate(5, 5); c.fillStyle = f; P(c, s.pts); c.fill(); c.restore();   // off-register fill
        c.globalAlpha = 1;
        if (s.role !== 'beam' && s.role !== 'saarthi' && s.role !== 'ink') { c.strokeStyle = ink; c.lineWidth = s.role === 'steam' ? 4 : 5; c.lineJoin = 'round'; P(c, wob(s.pts, 1.6)); c.stroke(); }
        if (s.wheel) spokes(c, s.wheel, 6, '#f0c04a', 5);
      });
      if (s.text) label(c, s, '"Baloo 2"', s.role === 'badge' ? '#fbf4e4' : ink);
    }
    for (const t of text) { c.font = `800 ${t.size}px "Baloo 2"`; c.textAlign = t.align || 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = t.role === 'title2' ? '#d9482b' : ink; c.fillText(t.text, t.x + 4, t.y + 4); c.fillStyle = t.role === 'title2' ? '#fbf4e4' : ink; if (t.role === 'title2') { c.strokeStyle = ink; c.lineWidth = 5; c.lineJoin = 'round'; c.strokeText(t.text, t.x, t.y); c.fillStyle = '#d9482b'; } c.fillText(t.text, t.x, t.y); }
    grain(c, 14, 3);
  }

  // ---------------------------------------------------------------- SHADOW
  function shadow(c) {
    const ink = '#2a1a10', dye = { disc: '#d9a441', steam: '#e6cf9c', rail: ink, sleeper: ink, trim: '#3b2416', frame: '#3b2416', boiler: '#c8321f', gold: '#d9a441', plate: '#e9cf9a', cab: '#2c3f8f', roof: '#3b2416', saarthi: '#1c0f08', lamp: '#d9a441', wheel: '#3b2416', track: '#3b2416', post: '#3b2416', boardA: '#e6cf9c', boardB: '#e6cf9c', coachA: '#2f8f6b', coachB: '#d9a441', shirtA: '#c8321f', shirtB: '#2c3f8f', skin: '#e3c08a', hairA: ink, hairB: ink, ink, badge: '#c8321f' };
    const t = document.createElement('canvas'); t.width = W; t.height = H; const x = t.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    const piece = document.createElement('canvas'); piece.width = W; piece.height = H; const p = piece.getContext('2d');
    const carve = (s) => {              // carving is density: rows of crescents / coin holes cut out of big pieces
      const [x0, y0, x1, y1] = bbox(s.pts); p.globalCompositeOperation = 'destination-out';
      if (/boiler|coach|cab/.test(s.role)) { const st = s.role === 'boiler' ? 34 : 40; for (let y = y0 + 26, j = 0; y < y1 - 14; y += st, j++) for (let xx = x0 + 26 + (j % 2) * st / 2; xx < x1 - 14; xx += st) { p.beginPath(); p.arc(xx, y, st * 0.3, Math.PI * 1.05, Math.PI * 1.95); p.arc(xx, y + st * 0.16, st * 0.3, Math.PI * 1.8, Math.PI * 1.2, true); p.fill(); } }
      if (s.role === 'steam') { const [cx, cy] = center(s.pts), R = (x1 - x0) / 2; p.lineWidth = 7; for (let k = 0; k < 3; k++) { p.beginPath(); p.arc(cx, cy, R * (0.3 + k * 0.22), 0.4 + k, 0.4 + k + Math.PI * 1.2); p.stroke(); } }
      if (s.role === 'disc') { const [cx, cy] = center(s.pts); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; p.beginPath(); p.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); p.lineTo(cx + Math.cos(a + .12) * 92, cy + Math.sin(a + .12) * 92); p.lineTo(cx + Math.cos(a - .12) * 92, cy + Math.sin(a - .12) * 92); p.fill(); } }
      if (s.wheel) { const [cx, cy, R] = s.wheel; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.beginPath(); p.moveTo(cx + Math.cos(a + .1) * R * .36, cy + Math.sin(a + .1) * R * .36); p.arc(cx, cy, R * .8, a + .1, a + Math.PI / 4 - .1); p.lineTo(cx + Math.cos(a + Math.PI / 4 - .1) * R * .36, cy + Math.sin(a + Math.PI / 4 - .1) * R * .36); p.fill(); } }
      if (s.role === 'hill') { }
      p.globalCompositeOperation = 'source-over';
    };
    for (const s of shapes) {
      if (!s.pts) { continue; }
      if (s.role === 'hill' || s.role === 'beam' || (s.role === 'skin' && s.pts.length === 4)) continue;                       // scenery is mostly empty lit cloth
      if (s.role === 'window' || s.role === 'window2') { x.save(); x.fillStyle = '#fff'; P(x, s.pts); x.fill(); x.strokeStyle = ink; x.lineWidth = 5; x.stroke(); x.restore(); continue; }   // a hole: brightest value
      p.clearRect(0, 0, W, H);
      if (s.line) { p.strokeStyle = ink; p.lineWidth = 5; P(p, s.pts, false); p.stroke(); }
      else { p.fillStyle = dye[s.role] || '#999'; P(p, s.pts); p.fill(); carve(s); p.strokeStyle = 'rgba(42,26,16,.9)'; p.lineWidth = 3; P(p, s.pts); p.stroke(); }
      x.save(); if (s.clip) { P(x, byId[s.clip].pts); x.clip(); }
      if (s.low) { x.beginPath(); x.rect(0, 0, W, H); x.rect(40, 1280, 460, 470); x.rect(580, 1280, 460, 470); x.rect(340, 1120, 400, 165); x.clip('evenodd'); }   // pieces never cross: overlap is darkness
      x.globalCompositeOperation = 'multiply'; x.globalAlpha = s.veil ? 0.6 : 0.92; x.drawImage(piece, 0, 0); x.restore();
    }
    // rods
    x.strokeStyle = 'rgba(60,45,35,.45)'; x.lineWidth = 4; [[247, 800, 247, 1000], [270, 1575, 250, 1920], [810, 1575, 830, 1920]].forEach(([a, b, d, e]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(d, e); x.stroke(); });
    // labels as dark ink on the hide / cloth
    for (const s of shapes) if (s.text) label(x, s, '"Rozha One"', s.role === 'badge' ? '#fff3d6' : ink);
    for (const tt of text) { x.font = `${tt.size * 0.95}px "Rozha One"`; x.textAlign = tt.align || 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = tt.role === 'title2' ? '#8f1f12' : ink; x.fillText(tt.text, tt.x, tt.y); }
    // cloth x lamp x transmission
    c.fillStyle = '#f6e3b4'; c.fillRect(0, 0, W, H);
    const r = rng(5); c.globalAlpha = 0.05; for (let i = 0; i < 2600; i++) { c.fillStyle = r() > .5 ? '#fff' : '#7a5a2a'; const yy = r() * H; c.fillRect(r() * W, yy, 30 + r() * 60, 1); c.fillRect(r() * W, r() * H, 1, 30 + r() * 60); } c.globalAlpha = 1;
    c.filter = 'blur(0.7px)'; c.globalCompositeOperation = 'multiply'; c.drawImage(t, 0, 0); c.filter = 'none';
    const lamp = (lx, ly, R, a) => { const g = c.createRadialGradient(lx, ly, 0, lx, ly, R); g.addColorStop(0, `rgba(255,236,170,${a})`); g.addColorStop(1, 'rgba(255,236,170,0)'); c.globalCompositeOperation = 'screen'; c.fillStyle = g; c.fillRect(0, 0, W, H); };
    lamp(300, 720, 520, 0.42); lamp(540, 1480, 760, 0.25);
    const v = c.createRadialGradient(540, 960, 520, 540, 960, 1250); v.addColorStop(0, 'rgba(90,40,10,0)'); v.addColorStop(1, 'rgba(60,25,5,.82)'); c.globalCompositeOperation = 'multiply'; c.fillStyle = v; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#2a120a'; c.lineWidth = 44; c.strokeRect(0, 0, W, H); c.strokeStyle = '#7a2a14'; c.lineWidth = 6; c.strokeRect(26, 26, W - 52, H - 52);
    grain(c, 12, 9);
  }

  // ---------------------------------------------------------------- GILDED
  function gilded(c) {
    const ink = '#2a1a10';
    const pig = { hill: ['#2f7a68', '#1f5a4c'], steam: ['#f3efe6', '#b9b3cf'], sleeper: ['#6b4a2c', '#4a321c'], rail: ['#8d86a8', '#5d5780'], trim: ['#6c6690', '#474266'], frame: ['#6c6690', '#474266'], boiler: ['#c8321f', '#8f1f12'], plate: ['#efe2c4', '#c9b78c'], cab: ['#d97a8a', '#a94f60'], saarthi: ['#1c0f08', '#1c0f08'], wheel: ['#6c6690', '#474266'], track: ['#6b4a2c', '#4a321c'], post: ['#6b4a2c', '#4a321c'], boardA: ['#efe2c4', '#c9b78c'], boardB: ['#efe2c4', '#c9b78c'], coachA: ['#c8321f', '#8f1f12'], coachB: ['#3d6fc4', '#274c93'], window2: ['#efe2c4', '#c9b78c'], shirtA: ['#d97a8a', '#a94f60'], shirtB: ['#f3efe6', '#b9b3cf'], skin: ['#e3b08a', '#b9825c'], hairA: [ink, ink], hairB: [ink, ink], ink: [ink, ink] };
    const goldRoles = { disc: 1, gold: 1, roof: 1, window: 1, lamp: 1, badge: 1, beam: 1 };
    const r = rng(11);
    // gold leaf: squares with their own tone, seams, red bole specks
    const leaf = document.createElement('canvas'); leaf.width = leaf.height = 168; const l = leaf.getContext('2d');
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const k = r(); l.fillStyle = `rgb(${200 + k * 45 | 0},${150 + k * 50 | 0},${50 + k * 40 | 0})`; l.fillRect(i * 28, j * 28, 28, 28); l.fillStyle = 'rgba(90,50,10,.55)'; l.fillRect(i * 28, j * 28, 28, 1.4); l.fillRect(i * 28, j * 28, 1.4, 28); l.fillStyle = 'rgba(255,240,180,.6)'; l.fillRect(i * 28 + 1.4, j * 28 + 1.4, 26, 1.2); if (r() > .7) { l.fillStyle = '#a3311c'; l.fillRect(i * 28 + r() * 24, j * 28 + r() * 24, 2.5, 2.5); } }
    const gold = c.createPattern(leaf, 'repeat');
    // grounds: granular ultramarine sky, verdigris below
    const ground = (y0, y1, a, b, seed) => { const q = rng(seed); c.fillStyle = a; c.fillRect(0, y0, W, y1 - y0); c.fillStyle = b; for (let i = 0; i < (y1 - y0) * 9; i++) c.fillRect(q() * W, y0 + q() * (y1 - y0), 2 + q() * 3, 2 + q() * 3); };
    ground(0, horizon, '#22379a', '#2f49b8', 1); ground(horizon, H, '#2f7a68', '#3f8f7a', 2);
    const dot = (x, y, s, col = '#f3efe6') => { c.fillStyle = col; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill(); };
    for (let i = 0; i < 70; i++) { const x = 50 + r() * 980, y = 50 + r() * 540; c.save(); c.translate(x, y); c.fillStyle = gold; c.beginPath(); for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, q = k % 2 ? 3 : 9; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.fill(); c.strokeStyle = ink; c.lineWidth = 1; c.stroke(); c.restore(); }
    for (let i = 0; i < 60; i++) { const x = 40 + r() * 1000, y = horizon + 60 + r() * 780; dot(x, y, 3); dot(x + 7, y + 3, 3); dot(x + 3, y - 6, 3); }   // white-lead triads on the green
    for (const s of shapes) {
      if (!s.pts) { label(c, s, '"Rozha One"', '#fff6dc'); continue; }
      withClip(c, s, () => {
        if (s.line) { c.strokeStyle = ink; c.lineWidth = 5; c.lineCap = 'round'; P(c, s.pts, false); c.stroke(); return; }
        const isGold = goldRoles[s.role];
        c.globalAlpha = s.role === 'beam' ? 0.45 : s.veil ? 0.88 : 1;
        P(c, s.pts); c.fillStyle = isGold ? gold : (pig[s.role] || ['#888'])[0]; c.fill();
        c.save(); P(c, s.pts); c.clip(); c.strokeStyle = isGold ? 'rgba(110,60,10,.55)' : (pig[s.role] || ['#888', '#555'])[1]; c.lineWidth = s.role === 'steam' ? 22 : 14; P(c, s.pts); c.stroke(); c.restore();     // rim shade
        c.globalAlpha = 1;
        if (s.role !== 'beam') { c.strokeStyle = ink; c.lineWidth = 3.4; c.lineJoin = 'round'; P(c, s.pts); c.stroke(); }
        // white-lead highlight on edges that face the light (upper left)
        if (!isGold && !/saarthi|ink|hair|sleeper|rail|track|post/.test(s.role)) { c.save(); P(c, s.pts); c.clip(); c.translate(7, 8); c.strokeStyle = 'rgba(243,239,230,.85)'; c.lineWidth = 2.6; const b = bbox(s.pts); c.beginPath(); s.pts.forEach(([x, y], i) => { const [cx, cy] = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; if (x < cx + (b[2] - b[0]) * .2 && y < cy) i && c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke(); c.restore(); }
        if (/boiler|coach/.test(s.role)) { const b = bbox(s.pts); for (let x = b[0] + 40; x < b[2] - 30; x += 22) dot(x, b[3] - 20, 3.4); }      // row of pearls
        if (s.wheel) { spokes(c, s.wheel, 8, ink, 3); }
      });
      if (s.text) label(c, s, '"Rozha One"', ink);
    }
    for (const t of text) { c.font = `${t.size * 0.95}px "Rozha One"`; c.textAlign = t.align || 'left'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round'; c.strokeStyle = ink; c.lineWidth = 9; c.strokeText(t.text, t.x, t.y); c.fillStyle = t.role === 'title' ? '#f3efe6' : gold; c.fillText(t.text, t.x, t.y); }
    // frame: vermilion band, gold fillet, pearls
    c.strokeStyle = '#c8321f'; c.lineWidth = 36; c.strokeRect(18, 18, W - 36, H - 36); c.strokeStyle = gold; c.lineWidth = 8; c.strokeRect(38, 38, W - 76, H - 76); c.strokeStyle = ink; c.lineWidth = 2; c.strokeRect(34, 34, W - 68, H - 68); c.strokeRect(42, 42, W - 84, H - 84);
    for (let x = 60; x < W - 40; x += 40) { dot(x, 18, 4); dot(x, H - 18, 4); } for (let y = 60; y < H - 40; y += 40) { dot(18, y, 4); dot(W - 18, y, 4); }
    grain(c, 10, 4);
  }

  window.STYLES = { toon, shadow, gilded };
})();
