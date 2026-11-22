// Locations for the Mulank 8 reel. Each returns { defs, back, front } SVG fragments for a 1080x1920 frame at time t.
// Flat fills, thick ink on near objects, softer (no ink) far layers, gentle ambient motion only (twinkle, flicker, drift).
const E = require('./engine');
const { WT, catmull, ink, inkLoop, fill, part, poly } = E;
const INK = E.INK;
const rnd = i => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };

// ---------------- TERRACE: Indian city rooftop at night, Diwali ----------------
function firework(cx, cy, t0, t, col, n = 14, R = 150) {
  const u = (t - t0) % 3.4; if (u < 0 || u > 1.3) return '';
  const k = Math.min(1, u / 0.5), fade = u < 0.5 ? 1 : Math.max(0, 1 - (u - 0.5) / 0.8);
  let o = '';
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + t0, r = R * E.ease(k), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r + u * u * 30;
    o += `<line x1="${(cx + Math.cos(a) * r * 0.55).toFixed(1)}" y1="${(cy + Math.sin(a) * r * 0.55 + u * u * 20).toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${col}" stroke-width="5" stroke-linecap="round" opacity="${fade.toFixed(2)}"/>`;
    o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#fff" opacity="${(fade * 0.9).toFixed(2)}"/>`; }
  return o + `<circle cx="${cx}" cy="${cy}" r="${R * 0.6 * k}" fill="${col}" opacity="${(0.12 * fade).toFixed(2)}"/>`;
}
function diya(x, y, t, i, s = 1) {
  const fl = 1 + 0.12 * Math.sin(t * 17 + i * 3) + 0.06 * Math.sin(t * 29 + i);
  const bowl = catmull([[-34, 0], [34, 0], [26, 22], [0, 30], [-26, 22]].map(([a, b]) => [x + a * s, y + b * s]), 5, true);
  const flame = catmull([[0, -46 * fl], [12, -14], [0, 0], [-12, -14]].map(([a, b]) => [x + 4 * s + a * s + Math.sin(t * 9 + i) * 2, y - 2 * s + b * s]), 6, true);
  return `<circle cx="${x}" cy="${y - 20 * s}" r="${46 * s * fl}" fill="#ffcf6a" opacity="0.28"/>` + fill(flame, '#ffd24a') + fill(catmull([[0, -26 * fl], [6, -8], [0, 0], [-6, -8]].map(([a, b]) => [x + 4 * s + a * s, y - 2 * s + b * s]), 5, true), '#fff6c8') +
    part(bowl, '#c4622d', { sh: '#8e3f19', shPts: bowl.map(([a, b]) => [a, b + 10 * s]), w: WT.mid }) + ink([[x - 30 * s, y + 6 * s], [x + 30 * s, y + 6 * s]], 4, { color: '#f0b04a', taper: [0.1, 0.1] });
}
function sutliBomb(x, y, s = 1, t = 0, fuse = 0) { // old Diwali sutli bomb: twine-wrapped ball, "2026" painted, fuse
  const ball = catmull([[0, -60], [56, -30], [60, 26], [26, 60], [-30, 58], [-62, 20], [-52, -36]].map(([a, b]) => [x + a * s, y + b * s]), 8, true);
  let tw = ''; for (let k = -4; k <= 4; k++) tw += ink(catmull([[-60, k * 12 - 10], [0, k * 14 - 4], [60, k * 12 + 4]].map(([a, b]) => [x + a * s, y + b * s]), 4, false), 3, { color: '#9a7440', taper: [0.1, 0.1] });
  let o = fill(ball, '#c9a46a') + E.clipped(ball, tw + fill(catmull([[20, -70], [80, -10], [60, 80], [0, 80]].map(([a, b]) => [x + a * s, y + b * s]), 4, true), '#a8844c')) + inkLoop(ball, WT.sil);
  o += `<text x="${x}" y="${y + 14 * s}" font-family="Arial Black,Arial" font-weight="900" font-size="${34 * s}" text-anchor="middle" fill="#d22f2f" stroke="${INK}" stroke-width="${2 * s}" transform="rotate(-8 ${x} ${y})">2026</text>`;
  o += ink(catmull([[0, -60], [10, -96], [34, -110]].map(([a, b]) => [x + a * s, y + b * s]), 5, false), 6 * s, { color: '#4a3a2a', taper: [0.1, 0.1] });
  if (fuse > 0) { const sx = x + 34 * s, sy = y - 110 * s; for (let i = 0; i < 10; i++) { const a = rnd(i + Math.floor(t * 24)) * 6.28, r = (18 + rnd(i * 3 + Math.floor(t * 24)) * 40) * s * fuse;
    o += `<line x1="${sx}" y1="${sy}" x2="${(sx + Math.cos(a) * r).toFixed(1)}" y2="${(sy + Math.sin(a) * r).toFixed(1)}" stroke="${i % 2 ? '#ffe070' : '#ff8a2a'}" stroke-width="${3 * s}" stroke-linecap="round"/>`; }
    o += `<circle cx="${sx}" cy="${sy}" r="${12 * s * fuse}" fill="#fff4c0"/>`; }
  return o;
}
function terrace(t = 0, o = {}) {
  const dim = o.dim || 0;
  const defs = `<linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1238"/><stop offset="0.55" stop-color="#2b2462"/><stop offset="1" stop-color="#5a3a78"/></linearGradient>
    <radialGradient id="moonGlow"><stop offset="0" stop-color="#fff6d8" stop-opacity="0.6"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#fff4c4"/><stop offset="0.6" stop-color="#ffe07a" stop-opacity="0.6"/><stop offset="1" stop-color="#ffe07a" stop-opacity="0"/></radialGradient>`;
  let b = `<rect width="1080" height="1920" fill="url(#nightSky)"/>`;
  for (let i = 0; i < 60; i++) { const x = rnd(i) * 1080, y = rnd(i + 99) * 900, a = 0.35 + 0.5 * Math.abs(Math.sin(t * (1 + rnd(i + 7) * 2) + i)); b += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.5 + rnd(i + 3) * 2).toFixed(1)}" fill="#fff" opacity="${a.toFixed(2)}"/>`; }
  b += `<circle cx="830" cy="260" r="200" fill="url(#moonGlow)"/><circle cx="830" cy="260" r="70" fill="#fff3cf"/><circle cx="805" cy="245" r="14" fill="#efe0b0"/><circle cx="850" cy="285" r="9" fill="#efe0b0"/>`;
  b += firework(260, 360, 0.2, t, '#ff5c8a') + firework(760, 520, 1.5, t, '#6ae0ff', 12, 120) + firework(480, 230, 2.6, t, '#ffd24a', 16, 170);
  // far skyline (no ink), mid skyline (ink), lit windows flicker rarely
  const far = [[0, 1080], [0, 900], [90, 900], [90, 860], [170, 860], [170, 940], [260, 940], [260, 820], [330, 820], [330, 880], [430, 880], [430, 780], [470, 760], [510, 780], [510, 900], [620, 900], [620, 840], [720, 840], [720, 920], [820, 920], [820, 800], [900, 800], [900, 900], [1080, 900], [1080, 1080]];
  b += `<path d="${poly(far)}" fill="#33295f"/>`;
  const mid = [[0, 1200], [0, 1000], [140, 1000], [140, 950], [250, 950], [250, 1040], [380, 1040], [380, 920], [500, 920], [500, 1010], [640, 1010], [640, 960], [780, 960], [780, 1050], [900, 1050], [900, 980], [1080, 980], [1080, 1200]];
  b += `<path d="${poly(mid)}" fill="#241d4a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  for (let i = 0; i < 46; i++) { const x = 20 + rnd(i + 200) * 1040, y = 970 + rnd(i + 300) * 190, on = rnd(i + Math.floor(t / 1.7) * 0.01 + 400) > 0.25; if (on) b += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="16" height="20" fill="${rnd(i + 500) > 0.5 ? '#ffd77a' : '#ffb85a'}" opacity="0.85"/>`; }
  // string lights across the top of the terrace (sagging wires, twinkling bulbs)
  const wires = [[[-20, 1150], [540, 1250], [1100, 1150]], [[-20, 1060], [300, 1130], [700, 1110], [1100, 1050]]];
  const cols = ['#ff5c5c', '#ffd24a', '#6ae0ff', '#7dff8a', '#ff7ae0'];
  wires.forEach((w, wi) => { const pts = catmull(w, 20, false); b += ink(pts, 4, { color: '#0c0a14', taper: [0, 0] });
    for (let k = 3; k < pts.length - 2; k += 4) { const [x, y] = pts[k], c = cols[(k + wi) % 5], tw = 0.55 + 0.45 * Math.sin(t * 4 + k * 1.3 + wi);
      b += `<circle cx="${x.toFixed(1)}" cy="${(y + 12).toFixed(1)}" r="20" fill="${c}" opacity="${(0.25 * tw).toFixed(2)}"/><ellipse cx="${x.toFixed(1)}" cy="${(y + 12).toFixed(1)}" rx="8" ry="11" fill="${c}" opacity="${(0.6 + 0.4 * tw).toFixed(2)}" stroke="${INK}" stroke-width="2.5"/>`; } });
  // brick parapet with diyas on top
  const par = [[0, 1290], [1080, 1290], [1080, 1450], [0, 1450]];
  b += `<path d="${poly(par)}" fill="#a8523a"/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) { const x = c * 120 - (r % 2) * 60, y = 1300 + r * 38; b += `<rect x="${x + 4}" y="${y}" width="112" height="32" rx="3" fill="${rnd(r * 13 + c) > 0.5 ? '#b85d42' : '#9c4a33'}" stroke="#6e2e1e" stroke-width="3"/>`; }
  b += `<rect x="-10" y="1272" width="1100" height="30" fill="#c9b9a0" stroke="${INK}" stroke-width="${WT.sil}"/>`;
  [80, 250, 830, 1000].forEach((x, i) => { b += diya(x, 1266, t, i, 0.9); });
  // floor
  b += `<rect y="1450" width="1080" height="470" fill="#8a6f6a"/><ellipse cx="540" cy="1560" rx="620" ry="120" fill="#ffcf8a" opacity="0.14"/>`;
  for (let i = 0; i < 6; i++) b += diya(120 + i * 168 + (i % 2) * 20, 1880, t, i + 7, 0.8);
  for (let k = 0; k < 7; k++) b += ink([[0, 1470 + k * 70], [1080, 1470 + k * 70]], 3, { color: '#6a5966', taper: [0, 0] });
  for (let k = -6; k < 14; k++) b += ink([[540 + k * 60, 1450], [540 + k * 160, 1920]], 3, { color: '#6a5966', taper: [0, 0] });
  b += ink([[0, 1450], [1080, 1450]], WT.sil, { taper: [0, 0] });
  if (dim) b += `<rect width="1080" height="1920" fill="#05040c" opacity="${dim}"/>`;
  return { defs, back: b, front: '' };
}

// ---------------- OFFICE: cosmic head office in the clouds ----------------
function softCloud(x, y, s, col = '#ffffff', op = 0.95) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}"><path d="M-160 40 C-170 -10 -110 -40 -70 -20 C-50 -80 40 -80 60 -25 C100 -55 170 -30 160 30 C200 40 190 80 150 80 L-140 80 C-190 80 -200 45 -160 40 Z" fill="${col}"/></g>`;
}
function planet(x, y, r, c1, c2, ring) {
  let o = `<circle cx="${x}" cy="${y}" r="${r}" fill="${c1}" stroke="${INK}" stroke-width="5"/><path d="M${x - r * 0.9} ${y + r * 0.2} Q${x} ${y + r * 0.45} ${x + r * 0.9} ${y + r * 0.2}" fill="none" stroke="${c2}" stroke-width="${r * 0.18}" opacity="0.8"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.18}" fill="#fff" opacity="0.5"/>`;
  if (ring) o += `<ellipse cx="${x}" cy="${y}" rx="${r * 1.8}" ry="${r * 0.4}" fill="none" stroke="${c2}" stroke-width="8" transform="rotate(-15 ${x} ${y})"/>`;
  return o;
}
function flyingFile(i, t) {
  const sp = 120 + rnd(i) * 140, x = ((rnd(i + 3) * 1400 + t * sp) % 1400) - 160, y = 300 + rnd(i + 9) * 700 + Math.sin(t * 2 + i) * 30, a = Math.sin(t * 3 + i) * 12;
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})"><rect x="-44" y="-30" width="88" height="60" rx="4" fill="#f3e2b0" stroke="${INK}" stroke-width="4"/><rect x="-44" y="-30" width="34" height="12" rx="3" fill="#e0c47a" stroke="${INK}" stroke-width="3"/>` +
    [0, 1, 2].map(k => `<line x1="-30" y1="${-6 + k * 12}" x2="30" y2="${-6 + k * 12}" stroke="#b39a60" stroke-width="3"/>`).join('') + `</g>`;
}
function office(t = 0) {
  const defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb4ea"/><stop offset="0.6" stop-color="#c3dcf2"/><stop offset="1" stop-color="#f6e6c4"/></linearGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#fff4c4"/><stop offset="0.6" stop-color="#ffe07a" stop-opacity="0.6"/><stop offset="1" stop-color="#ffe07a" stop-opacity="0"/></radialGradient>
    <radialGradient id="sunGlow"><stop offset="0" stop-color="#fff8d0"/><stop offset="1" stop-color="#fff8d0" stop-opacity="0"/></radialGradient>`;
  let b = `<rect width="1080" height="1920" fill="url(#sky)"/><circle cx="540" cy="600" r="520" fill="url(#sunGlow)" opacity="0.7"/>`;
  b += planet(170 + Math.sin(t * 0.4) * 6, 520, 46, '#f0a35a', '#c8703a', false) + planet(930, 620 + Math.sin(t * 0.5) * 6, 36, '#8fd1c0', '#4f9f8c', true) + planet(120, 980, 24, '#c9a2f0', '#8d64c0', false);
  // far cloud bank + pillars of a sky-office (columns, no ink = far)
  for (const [x, s] of [[120, 1.6], [420, 1.9], [760, 1.7], [1000, 1.5]]) b += softCloud(x, 1240, s, '#eef3fa', 0.85);
  for (const x of [90, 990]) b += `<rect x="${x - 34}" y="260" width="68" height="1000" fill="#f3ead6" opacity="0.8"/><rect x="${x - 50}" y="240" width="100" height="34" fill="#e8dcc0" opacity="0.8"/>`;
  b += `<path d="M40 240 L540 80 L1040 240 Z" fill="#f3ead6" opacity="0.6"/>`;
  for (let i = 0; i < 7; i++) b += flyingFile(i, t);
  b += softCloud(160, 300 + Math.sin(t) * 4, 1.1) + softCloud(900, 1650, 1.4) + softCloud(150, 1720, 1.3);
  const front = softCloud(980 - t * 8, 1780, 1.6, '#ffffff', 0.9);
  return { defs, back: b, front };
}

// ---------------- COURT: Shani dev's court ----------------
function clock(x, y, R, t) {
  let o = `<circle cx="${x}" cy="${y}" r="${R + 18}" fill="#c9a24a" stroke="${INK}" stroke-width="${WT.sil}"/><circle cx="${x}" cy="${y}" r="${R}" fill="#f1e6c8" stroke="#7a5a1c" stroke-width="5"/>`;
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; o += `<line x1="${x + Math.sin(a) * R * 0.82}" y1="${y - Math.cos(a) * R * 0.82}" x2="${x + Math.sin(a) * R * 0.94}" y2="${y - Math.cos(a) * R * 0.94}" stroke="#3a2a10" stroke-width="${k % 3 ? 4 : 8}"/>`; }
  const sec = Math.floor(t) / 60 * Math.PI * 2, mn = (10 + t / 60) / 60 * Math.PI * 2, hr = 0.33 * Math.PI * 2; // ticking second hand
  o += `<line x1="${x}" y1="${y}" x2="${x + Math.sin(hr) * R * 0.5}" y2="${y - Math.cos(hr) * R * 0.5}" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>`;
  o += `<line x1="${x}" y1="${y}" x2="${x + Math.sin(mn) * R * 0.75}" y2="${y - Math.cos(mn) * R * 0.75}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`;
  o += `<line x1="${x}" y1="${y}" x2="${x + Math.sin(sec) * R * 0.85}" y2="${y - Math.cos(sec) * R * 0.85}" stroke="#c62b34" stroke-width="4" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="10" fill="${INK}"/>`;
  return o;
}
function court(t = 0, o = {}) {
  const S = require('./char_shani');
  const glow = o.glow || 0;
  const defs = `<radialGradient id="shaniHalo"><stop offset="0" stop-color="#ffe9a8"/><stop offset="0.55" stop-color="#e9b934" stop-opacity="0.5"/><stop offset="1" stop-color="#e9b934" stop-opacity="0"/></radialGradient>
    <linearGradient id="court" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1330"/><stop offset="1" stop-color="#1a2650"/></linearGradient>`;
  let b = `<rect width="1080" height="1920" fill="url(#court)"/>`;
  for (let i = 0; i < 40; i++) b += `<circle cx="${(rnd(i + 40) * 1080).toFixed(0)}" cy="${(rnd(i + 80) * 1200).toFixed(0)}" r="${(1 + rnd(i) * 2).toFixed(1)}" fill="#cfd8ff" opacity="${(0.2 + 0.3 * Math.abs(Math.sin(t + i))).toFixed(2)}"/>`;
  // pillars with gold bands
  for (const x of [110, 970]) { b += `<rect x="${x - 60}" y="200" width="120" height="1520" fill="#16204a" stroke="${INK}" stroke-width="${WT.sil}"/>`; for (const y of [260, 1660]) b += `<rect x="${x - 76}" y="${y - 30}" width="152" height="60" fill="#c9a24a" stroke="${INK}" stroke-width="${WT.mid}"/>`; }
  b += clock(220, 330, 92, t);
  b += S.saturn(t, 820, 250, 82);
  b += S.spotlight(t, 1 + glow * 0.3);
  b += `<rect y="1700" width="1080" height="220" fill="#10183a"/>` + ink([[0, 1700], [1080, 1700]], WT.sil, { taper: [0, 0] });
  for (let k = 0; k < 6; k++) b += ink([[k * 200 - 60, 1700], [k * 260 - 240, 1920]], 3, { color: '#1e2a5a', taper: [0, 0] });
  return { defs, back: b, front: '' };
}
module.exports = { terrace, office, court, sutliBomb, diya, softCloud };
