// World-tour locations for the Aries 2027 reel (owner, 23 Nov 2026 22:42 IST: "Position Vishnu ji at different places,
// like near Eiffel Tower, Taj Mahal, Switzerland… show his supremacy"). Landmarks sit small and far behind, so Vishnu ji
// on his cloud is bigger than the landmark. Shapes researched before drawing:
//  - Taj Mahal: white onion double dome on a drum with a lotus top and finial, four smaller chhatris at the corners,
//    pishtaq (tall arch) on each face, high square plinth, four free-standing minarets, long reflecting pool in front.
//  - Eiffel Tower: four lattice legs curving inward (near-parabolic), decorative semicircular arches at the base,
//    two platform levels, slim tapering top with an antenna.
//  - Burj Khalifa: Y-plan tower with stepped setbacks spiralling upward, central core rising into a long needle spire.
//  - Matterhorn: a lone hooked pyramid peak, snow on top, green alpine meadow and a lake below.
// Each returns { defs, back, front } like loc.js. Flat fills, thick ink, one soft shade.
const E = require('./engine'), L = require('./loc');
const INK = E.INK || '#1b1422';
const r = i => { const v = Math.sin(i * 127.1) * 43758.5453; return v - Math.floor(v); };
const HALO = `<radialGradient id="halo"><stop offset="0" stop-color="#fff4c4"/><stop offset="0.6" stop-color="#ffe07a" stop-opacity="0.6"/><stop offset="1" stop-color="#ffe07a" stop-opacity="0"/></radialGradient>`;
const grad = (id, a, b, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="0.55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
const stars = (t, n, ymax, seed = 0) => { let o = ''; for (let i = 0; i < n; i++) { const x = r(i + seed) * 1080, y = r(i + 99 + seed) * ymax, a = 0.3 + 0.6 * Math.abs(Math.sin(t * (0.8 + r(i + 7) * 2) + i));
  o += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.3 + r(i + 3) * 2.2).toFixed(1)}" fill="#fff8e0" opacity="${a.toFixed(2)}"/>`; } return o; };
const drift = (t, sp, w) => ((t * sp) % w + w) % w;
const cloudsBand = (t, y, col, s, n = 6, sp = 8, op = 0.9) => { let o = ''; for (let i = 0; i < n; i++) o += L.softCloud(((i * 230 + drift(t, sp, 1380)) % 1380) - 150, y + (i % 2) * 30, s, col, op); return o; };
const dimRect = d => d ? `<rect width="1080" height="1920" fill="#05040c" opacity="${d.toFixed(2)}"/>` : '';

// ---------- deep space: planets small around him (supremacy); Saturn far off; Jupiter glows when o.gold ----------
function cosmos(t = 0, o = {}) {
  const defs = HALO + grad('cosSky', '#05061a', '#1a1450', '#3a1f6a') + `<radialGradient id="neb"><stop offset="0" stop-color="#b06ad8" stop-opacity="0.45"/><stop offset="1" stop-color="#b06ad8" stop-opacity="0"/></radialGradient>
    <radialGradient id="jup"><stop offset="0" stop-color="#ffe9a8" stop-opacity="0.8"/><stop offset="1" stop-color="#ffd24a" stop-opacity="0"/></radialGradient>`;
  let b = `<rect width="1080" height="1920" fill="url(#cosSky)"/><ellipse cx="300" cy="700" rx="520" ry="300" fill="url(#neb)"/><ellipse cx="820" cy="1250" rx="460" ry="260" fill="url(#neb)" opacity="0.7"/>` + stars(t, 140, 1920, 11);
  // a slow orbit ring of small planets around the frame centre (he sits at the centre of it)
  const cx = 540, cy = 1080;
  b += `<ellipse cx="${cx}" cy="${cy}" rx="470" ry="150" fill="none" stroke="#8f7fd8" stroke-width="3" opacity="0.45" stroke-dasharray="10 14"/>`;
  const P = [['#e0573a', 26], ['#4fa8e0', 30], ['#c9a27a', 22], ['#7dd8a0', 20], ['#e0b450', 24]];
  P.forEach(([c, R], i) => { const a = t * 0.35 + i * 1.26, x = cx + Math.cos(a) * 470, y = cy + Math.sin(a) * 150, front = Math.sin(a) > 0;
    if (!front) b += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${R}" fill="${c}" stroke="${INK}" stroke-width="4" opacity="0.85"/>`; });
  // Saturn far off (top left), Jupiter (top right) with its stripes; Jupiter glows on 'gold'
  b += `<g transform="translate(200 470)"><circle r="58" fill="#3b4fa8" stroke="${INK}" stroke-width="5"/><path d="M-56 -8 Q0 6 56 -8" stroke="#5b6fc8" stroke-width="10" fill="none"/><ellipse rx="112" ry="24" fill="none" stroke="#8fa8ff" stroke-width="9" transform="rotate(-18)"/></g>`;
  const g = o.gold || 0;
  b += `<circle cx="860" cy="430" r="${150 + 60 * g}" fill="url(#jup)" opacity="${(0.35 + 0.6 * g).toFixed(2)}"/><g transform="translate(860 430)"><circle r="74" fill="#e0b070" stroke="${INK}" stroke-width="5"/>` +
    [-34, -10, 14, 36].map((y, k) => `<path d="M${-Math.sqrt(74 * 74 - y * y)} ${y} Q0 ${y + 8} ${Math.sqrt(74 * 74 - y * y)} ${y}" stroke="${k % 2 ? '#c98a4a' : '#f3d2a0'}" stroke-width="10" fill="none"/>`).join('') + `<ellipse cx="22" cy="20" rx="16" ry="9" fill="#c2463a"/></g>`;
  let f = '';
  P.forEach(([c, R], i) => { const a = t * 0.35 + i * 1.26, x = cx + Math.cos(a) * 470, y = cy + Math.sin(a) * 150, front = Math.sin(a) > 0;
    if (front) f += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${R * 1.15}" fill="${c}" stroke="${INK}" stroke-width="4"/><path d="M${x - R * 0.5} ${y - R * 0.4} a${R * 0.6} ${R * 0.6} 0 0 1 ${R * 0.7} -${R * 0.2}" stroke="#fff" stroke-width="4" fill="none" opacity="0.6"/>`; });
  b += `<rect y="1700" width="1080" height="220" fill="#2a1a5a" opacity="0.0"/>`;
  return { defs, back: b + dimRect(o.dim), front: f };
}

// ---------- Swiss Alps: Matterhorn, meadow, lake, a chalet ----------
function alps(t = 0, o = {}) {
  const defs = HALO + grad('alpSky', '#5aa7e8', '#9fd0f5', '#e6f4ff');
  let b = `<rect width="1080" height="1920" fill="url(#alpSky)"/><circle cx="880" cy="330" r="80" fill="#fff6c8"/><circle cx="880" cy="330" r="140" fill="#fff6c8" opacity="0.25"/>`;
  b += cloudsBand(t, 420, '#ffffff', 0.9, 5, 10, 0.85);
  // far range
  b += `<path d="M0 1080 L120 860 L220 960 L330 800 L440 930 L600 820 L720 950 L860 840 L1000 960 L1080 900 L1080 1200 L0 1200 Z" fill="#9fb4d8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  // Matterhorn: hooked pyramid with snow
  b += `<path d="M300 1150 L520 620 L548 600 L572 640 L800 1150 Z" fill="#7d8aa8" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="M548 600 L572 640 L800 1150 L660 1150 Z" fill="#5f6a88"/>` +
    `<path d="M520 620 L548 600 L572 640 L600 720 L570 700 L548 740 L520 700 L490 730 Z" fill="#ffffff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  // meadow, lake, pines, chalet
  b += `<path d="M0 1120 Q300 1060 540 1110 T1080 1100 L1080 1920 L0 1920 Z" fill="#7cc46a" stroke="${INK}" stroke-width="7"/><path d="M0 1260 Q400 1200 1080 1250 L1080 1920 L0 1920 Z" fill="#5fae55"/>`;
  b += `<ellipse cx="540" cy="1230" rx="360" ry="54" fill="#4fa8e0" stroke="${INK}" stroke-width="6"/><path d="M380 1225 Q540 1210 700 1225" stroke="#bfe3ff" stroke-width="6" fill="none" opacity="${(0.6 + 0.3 * Math.sin(t * 2)).toFixed(2)}"/>`;
  for (const [x, s] of [[90, 1], [160, 0.8], [960, 1.1], [1030, 0.8], [880, 0.7]]) b += `<g transform="translate(${x} 1180) scale(${s})"><path d="M0 -170 L50 -60 L24 -60 L64 20 L-64 20 L-24 -60 L-50 -60 Z" fill="#2f7a3a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><rect x="-10" y="20" width="20" height="30" fill="#7a4a2a"/></g>`;
  b += `<g transform="translate(820 1150)"><rect x="-70" y="-50" width="140" height="90" fill="#c98a4a" stroke="${INK}" stroke-width="6"/><path d="M-90 -40 L0 -110 L90 -40 Z" fill="#a0503a" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><rect x="-20" y="-10" width="40" height="50" fill="#7a4a2a" stroke="${INK}" stroke-width="4"/><rect x="-55" y="-30" width="26" height="24" fill="#ffe9a0" stroke="${INK}" stroke-width="3"/><rect x="29" y="-30" width="26" height="24" fill="#ffe9a0" stroke="${INK}" stroke-width="3"/></g>`;
  for (let i = 0; i < 30; i++) b += `<circle cx="${(r(i + 500) * 1080).toFixed(0)}" cy="${(1300 + r(i + 600) * 600).toFixed(0)}" r="6" fill="${['#fff', '#ffd24a', '#ff7aa8'][i % 3]}"/>`;
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// ---------- generic big-city night skyline (office beat) ----------
function cityNight(t = 0, o = {}) {
  const defs = HALO + grad('citySky', '#0c1030', '#262a6a', '#5a3a7a');
  let b = `<rect width="1080" height="1920" fill="url(#citySky)"/>` + stars(t, 50, 700, 31) + `<circle cx="820" cy="360" r="70" fill="#fff3cf"/>`;
  const towers = [[40, 120, 520], [170, 90, 680], [270, 130, 600], [410, 110, 760], [530, 150, 640], [690, 100, 820], [800, 140, 560], [950, 110, 700]];
  for (const [x, w, h] of towers) { const y = 1300 - h; b += `<rect x="${x}" y="${y}" width="${w}" height="${h + 700}" fill="#2a2a5a" stroke="${INK}" stroke-width="6"/>`;
    for (let yy = y + 30; yy < 1300; yy += 46) for (let xx = x + 16; xx < x + w - 20; xx += 30) if (r(xx * 7 + yy + Math.floor(t / 2)) > 0.35) b += `<rect x="${xx}" y="${yy}" width="16" height="22" fill="#ffe08a" opacity="0.85"/>`; }
  b += `<rect x="0" y="1300" width="1080" height="620" fill="#1c1c3a"/>`;
  for (let i = 0; i < 12; i++) { const x = ((i * 120 + t * 160) % 1300) - 110; b += `<rect x="${x}" y="1330" width="60" height="10" rx="5" fill="${i % 2 ? '#ff5c5c' : '#fff3cf'}" opacity="0.8"/>`; }
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// ---------- Dubai: Burj Khalifa, gold evening ----------
function dubai(t = 0, o = {}) {
  const defs = HALO + grad('dubSky', '#2a1a5a', '#c2507a', '#ffb860');
  let b = `<rect width="1080" height="1920" fill="url(#dubSky)"/>` + stars(t, 30, 500, 61) + `<circle cx="240" cy="560" r="90" fill="#ffd98a" opacity="0.9"/>`;
  // side towers
  for (const [x, w, h] of [[60, 120, 380], [200, 90, 460], [780, 110, 420], [920, 130, 340], [680, 80, 300]]) b += `<rect x="${x}" y="${1300 - h}" width="${w}" height="${h + 600}" fill="#3a2a5a" stroke="${INK}" stroke-width="5"/>`;
  // Burj: stepped setbacks + core + spire
  const cx = 520; let w = 210, y = 1300; const steps = [[210, 150], [180, 140], [150, 130], [120, 120], [92, 110], [66, 100], [44, 90]];
  for (const [ww, hh] of steps) { b += `<path d="M${cx - ww / 2} ${y} L${cx - ww / 2 + 6} ${y - hh} L${cx + ww / 2 - 6} ${y - hh} L${cx + ww / 2} ${y} Z" fill="#9ab0c8" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M${cx + 6} ${y} L${cx + 6} ${y - hh} L${cx + ww / 2 - 6} ${y - hh} L${cx + ww / 2} ${y} Z" fill="#7890aa"/>`; y -= hh; }
  b += `<path d="M${cx - 10} ${y} L${cx - 3} ${y - 230} L${cx + 3} ${y - 230} L${cx + 10} ${y} Z" fill="#c8d6e6" stroke="${INK}" stroke-width="4"/>`;
  b += `<circle cx="${cx}" cy="${y - 230}" r="8" fill="#ff5c5c" opacity="${(0.5 + 0.5 * Math.sin(t * 4)).toFixed(2)}"/>`;
  b += `<rect x="0" y="1300" width="1080" height="620" fill="#e0b070"/><path d="M0 1300 Q540 1260 1080 1300" fill="none" stroke="${INK}" stroke-width="6"/>`;
  for (let i = 0; i < 14; i++) b += `<circle cx="${(r(i + 70) * 1080).toFixed(0)}" cy="${(1000 + r(i + 80) * 300).toFixed(0)}" r="4" fill="#ffe08a" opacity="${(0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i))).toFixed(2)}"/>`;
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// ---------- Taj Mahal at moonrise with the reflecting pool ----------
function taj(t = 0, o = {}) {
  const defs = HALO + grad('tajSky', '#121a4a', '#3a3a8a', '#e0a0b8');
  let b = `<rect width="1080" height="1920" fill="url(#tajSky)"/>` + stars(t, 60, 800, 77) + `<circle cx="820" cy="380" r="86" fill="#fff6dc"/><circle cx="820" cy="380" r="170" fill="#fff6dc" opacity="0.18"/>`;
  const W = '#f6f2ea', SH = '#d8d0e0', base = 1180, cx = 540;
  const onion = (x, y, s) => `<path d="M${x - 60 * s} ${y} C${x - 80 * s} ${y - 70 * s} ${x - 30 * s} ${y - 120 * s} ${x} ${y - 150 * s} C${x + 30 * s} ${y - 120 * s} ${x + 80 * s} ${y - 70 * s} ${x + 60 * s} ${y} Z" fill="${W}" stroke="${INK}" stroke-width="${6 * Math.max(0.6, s)}" stroke-linejoin="round"/>` +
    `<path d="M${x} ${y - 150 * s} C${x + 30 * s} ${y - 120 * s} ${x + 80 * s} ${y - 70 * s} ${x + 60 * s} ${y} L${x + 14 * s} ${y} C${x + 30 * s} ${y - 60 * s} ${x + 20 * s} ${y - 110 * s} ${x} ${y - 150 * s} Z" fill="${SH}"/>` +
    `<line x1="${x}" y1="${y - 150 * s}" x2="${x}" y2="${y - 190 * s}" stroke="#d9b24a" stroke-width="${5 * s}"/><circle cx="${x}" cy="${y - 194 * s}" r="${6 * s}" fill="#d9b24a"/>`;
  // minarets (free-standing, at the plinth corners)
  for (const mx of [270, 810]) b += `<rect x="${mx - 16}" y="${base - 330}" width="32" height="330" fill="${W}" stroke="${INK}" stroke-width="5"/>` + [80, 170, 260].map(k => `<rect x="${mx - 24}" y="${base - k}" width="48" height="10" fill="${SH}" stroke="${INK}" stroke-width="4"/>`).join('') + onion(mx, base - 330, 0.32);
  // plinth, main block with pishtaq, chhatris, drum and the big onion dome
  b += `<rect x="230" y="${base}" width="620" height="40" fill="${SH}" stroke="${INK}" stroke-width="6"/>`;
  b += `<rect x="360" y="${base - 210}" width="360" height="210" fill="${W}" stroke="${INK}" stroke-width="6"/><path d="M500 ${base} L500 ${base - 130} Q540 ${base - 190} 580 ${base - 130} L580 ${base} Z" fill="#c8c0d8" stroke="${INK}" stroke-width="5"/>`;
  for (const ax of [400, 655]) b += `<path d="M${ax} ${base - 20} L${ax} ${base - 80} Q${ax + 12} ${base - 100} ${ax + 24} ${base - 80} L${ax + 24} ${base - 20} Z" fill="#c8c0d8" stroke="${INK}" stroke-width="4"/><path d="M${ax} ${base - 110} L${ax} ${base - 160} Q${ax + 12} ${base - 180} ${ax + 24} ${base - 160} L${ax + 24} ${base - 110} Z" fill="#c8c0d8" stroke="${INK}" stroke-width="4"/>`;
  for (const hx of [390, 690]) b += `<rect x="${hx - 22}" y="${base - 250}" width="44" height="40" fill="${W}" stroke="${INK}" stroke-width="4"/>` + onion(hx, base - 250, 0.36);
  b += `<rect x="470" y="${base - 260}" width="140" height="50" fill="${W}" stroke="${INK}" stroke-width="5"/>` + onion(cx, base - 258, 1.25);
  // garden and reflecting pool (the reflection shimmers)
  b += `<rect x="0" y="${base + 40}" width="1080" height="${1920 - base}" fill="#2f6a4a"/><rect x="470" y="${base + 40}" width="140" height="700" fill="#3a5a9a" stroke="${INK}" stroke-width="5"/>`;
  b += `<g opacity="${(0.35 + 0.1 * Math.sin(t * 2)).toFixed(2)}" transform="translate(0 ${2 * base + 80}) scale(1 -1)"><path d="M${cx - 30} ${base - 258} C${cx - 40} ${base - 300} ${cx - 15} ${base - 330} ${cx} ${base - 345} C${cx + 15} ${base - 330} ${cx + 40} ${base - 300} ${cx + 30} ${base - 258} Z" fill="#dfe6ff"/></g>`;
  for (const tx of [120, 330, 750, 960]) b += `<path d="M${tx} ${base + 300} L${tx - 30} ${base + 120} Q${tx} ${base + 40} ${tx + 30} ${base + 120} Z" fill="#1f5a3a" stroke="${INK}" stroke-width="5"/>`;
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// ---------- Paris: Eiffel Tower at night, sparkling ----------
function eiffel(t = 0, o = {}) {
  const defs = HALO + grad('parSky', '#0e1238', '#2b2462', '#6a3a78');
  let b = `<rect width="1080" height="1920" fill="url(#parSky)"/>` + stars(t, 50, 800, 91);
  // Paris roofs
  b += `<path d="M0 1260 L0 1150 L80 1150 L110 1110 L180 1110 L200 1150 L330 1150 L350 1120 L430 1120 L460 1160 L620 1160 L650 1110 L760 1110 L780 1150 L900 1150 L930 1100 L1080 1100 L1080 1260 Z" fill="#2a2450" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  const cx = 540, base = 1250, top = 560, H = base - top, half = 230;
  const xAt = (y, s) => cx + s * half * Math.pow((y - top) / H, 1.7);   // leg profile, near-parabolic, curving in
  const leg = s => { const pts = []; for (let k = 0; k <= 20; k++) { const y = top + 60 + (H - 60) * k / 20; pts.push([xAt(y, s), y]); } return pts; };
  const L1 = leg(-1), R1 = leg(1);
  const body = [...L1, [cx - 150, base], [cx - 90, base], ...L1.map(([x, y]) => [cx - (cx - x) * 0.45, y]).reverse()];
  const bodyR = [...R1, [cx + 150, base], [cx + 90, base], ...R1.map(([x, y]) => [cx + (x - cx) * 0.45, y]).reverse()];
  b += `<path d="${E.poly(body)}" fill="#8a5a3a" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="${E.poly(bodyR)}" fill="#7a4a2e" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
  // base arch, two platforms, lattice cross-hatching, top and antenna
  b += `<path d="M${cx - 150} ${base} Q${cx} ${base - 200} ${cx + 150} ${base}" fill="none" stroke="${INK}" stroke-width="10"/><path d="M${cx - 150} ${base} Q${cx} ${base - 200} ${cx + 150} ${base}" fill="none" stroke="#8a5a3a" stroke-width="5"/>`;
  for (const [py, w] of [[base - 210, 1], [top + 330, 0.6]]) { const xl = xAt(py, -1) - 20 * w, xr = xAt(py, 1) + 20 * w; b += `<rect x="${xl}" y="${py - 22}" width="${xr - xl}" height="28" fill="#9a6a44" stroke="${INK}" stroke-width="5"/>`; }
  for (let y = top + 80; y < base - 40; y += 34) { const a = xAt(y, -1), c = xAt(y, 1), a2 = xAt(y + 34, -1), c2 = xAt(y + 34, 1);
    b += `<path d="M${a} ${y} L${cx - (cx - a2) * 0.45} ${y + 34} M${cx - (cx - a) * 0.45} ${y} L${a2} ${y + 34} M${c} ${y} L${cx + (c2 - cx) * 0.45} ${y + 34} M${cx + (c - cx) * 0.45} ${y} L${c2} ${y + 34}" stroke="#3a2416" stroke-width="2.5" opacity="0.8"/>`; }
  b += `<path d="M${cx - 12} ${top + 60} L${cx - 6} ${top - 40} L${cx + 6} ${top - 40} L${cx + 12} ${top + 60} Z" fill="#9a6a44" stroke="${INK}" stroke-width="5"/><line x1="${cx}" y1="${top - 40}" x2="${cx}" y2="${top - 120}" stroke="${INK}" stroke-width="5"/>`;
  // the night sparkle: random twinkles over the tower
  for (let i = 0; i < 26; i++) { const yy = top + r(i + 300) * H, s = r(i + 310) * 2 - 1, xx = cx + s * (xAt(yy, 1) - cx) * 0.8, on = Math.sin(t * 9 + i * 2.1) > 0.55;
    if (on) b += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="5" fill="#fffbe0"/><circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="12" fill="#fffbe0" opacity="0.35"/>`; }
  b += `<rect x="0" y="${base}" width="1080" height="${1920 - base}" fill="#2f5a3a"/><path d="M0 ${base} L1080 ${base}" stroke="${INK}" stroke-width="6"/>`;
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// ---------- India at dusk: temple shikhara with a saffron flag, rooftops, diyas, rangoli (family + remedies) ----------
function indiaDusk(t = 0, o = {}) {
  const defs = HALO + grad('indSky', '#2a1f5c', '#8a3a6a', '#ff9a5a');
  let b = `<rect width="1080" height="1920" fill="url(#indSky)"/>` + stars(t, 30, 500, 121) + `<circle cx="540" cy="900" r="${440 + 80 * (o.gold || 0)}" fill="url(#halo)" opacity="${(0.35 + 0.4 * (o.gold || 0)).toFixed(2)}"/>`;
  // temple shikhara (nagara style, curvilinear tower with an amalaka and kalash) and a saffron flag
  const cx = 540, base = 1180;
  b += `<path d="M${cx - 170} ${base} C${cx - 160} ${base - 260} ${cx - 70} ${base - 460} ${cx} ${base - 520} C${cx + 70} ${base - 460} ${cx + 160} ${base - 260} ${cx + 170} ${base} Z" fill="#e0a070" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`;
  for (let k = 1; k < 7; k++) { const y = base - k * 70, w = 170 * Math.pow(1 - k / 7.4, 0.7); b += `<path d="M${cx - w} ${y} Q${cx} ${y - 14} ${cx + w} ${y}" stroke="#b8704a" stroke-width="5" fill="none"/>`; }
  b += `<ellipse cx="${cx}" cy="${base - 530}" rx="40" ry="16" fill="#e0b450" stroke="${INK}" stroke-width="5"/><path d="M${cx - 14} ${base - 546} Q${cx} ${base - 600} ${cx + 14} ${base - 546} Z" fill="#e0b450" stroke="${INK}" stroke-width="4"/>`;
  const wave = Math.sin(t * 5) * 10; b += `<line x1="${cx}" y1="${base - 600}" x2="${cx}" y2="${base - 700}" stroke="${INK}" stroke-width="5"/><path d="M${cx} ${base - 700} Q${cx + 50} ${base - 690 + wave} ${cx + 100} ${base - 680} L${cx} ${base - 650} Z" fill="#ff8a1a" stroke="${INK}" stroke-width="4"/>`;
  b += `<rect x="${cx - 220}" y="${base}" width="440" height="80" fill="#c98a5a" stroke="${INK}" stroke-width="6"/><path d="M${cx - 40} ${base + 80} L${cx - 40} ${base + 20} Q${cx} ${base - 20} ${cx + 40} ${base + 20} L${cx + 40} ${base + 80} Z" fill="#ffd56a" stroke="${INK}" stroke-width="5"/>`;
  // rooftops left and right
  for (const [x, w, h, c] of [[0, 160, 260, '#c2463a'], [150, 140, 200, '#e0a030'], [790, 150, 230, '#3a8a7a'], [930, 150, 290, '#a04a8a']]) b += `<rect x="${x}" y="${base + 80 - h}" width="${w}" height="${h}" fill="${c}" stroke="${INK}" stroke-width="6"/><rect x="${x + 30}" y="${base + 120 - h}" width="34" height="40" fill="#ffd56a" stroke="${INK}" stroke-width="4"/>`;
  b += `<rect x="0" y="${base + 80}" width="1080" height="${1920 - base}" fill="#7a4a3a"/>`;
  b += `<g transform="translate(540 ${base + 260})"><ellipse rx="230" ry="60" fill="#ff5c8a" stroke="${INK}" stroke-width="6"/><ellipse rx="160" ry="40" fill="#ffd24a"/><ellipse rx="90" ry="22" fill="#2fb3a0"/><ellipse rx="30" ry="8" fill="#fff"/></g>`;
  for (let i = 0; i < 7; i++) b += L.diya(90 + i * 150, base + 100, t, i + 60, 0.85);
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// cloud wipe: white clouds sweep across for 0.35 s when the place changes (the "flight" between places)
function cloudWipe(t, t0, d = 0.45) {
  const u = (t - t0) / d; if (u < -0.5 || u > 1) return '';
  const k = 1 - Math.abs(u * 2 - 1); if (k <= 0.02) return '';
  let o = `<rect width="1080" height="1920" fill="#ffffff" opacity="${(0.55 * k).toFixed(2)}"/>`;
  // (a group with opacity lying fully off the canvas crashes resvg, so off-screen clouds are skipped)
  for (let i = 0; i < 9; i++) { const x = Math.round(-500 + (u + i * 0.08) * 2100); if (x < -600 || x > 1680) continue; o += L.softCloud(x, 200 + i * 200, 3.2, i % 2 ? '#ffffff' : '#ece6fa', +k.toFixed(2)); }
  return o;
}
module.exports = { cosmos, alps, cityNight, dubai, taj, eiffel, indiaDusk, cloudWipe };
