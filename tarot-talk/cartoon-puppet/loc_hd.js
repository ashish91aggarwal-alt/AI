// HD world-tour backgrounds, code-drawn (owner 23 Nov 2026 23:23 IST: "detailed backgrounds, high definition, true copy
// of the desired location" -> chose code-only with more detail over an image model). Each plate is drawn from the real
// building's parts, in our ink style: thick outer ink, thin inner detail lines, flat fills with one shade + light.
// Researched parts:
//  TAJ MAHAL (from the garden axis): high square marble plinth with a row of small arches; tomb with chamfered corners;
//   central pishtaq = tall rectangular frame with a calligraphy border around a pointed-arch iwan (recessed half-dome
//   with muqarnas hint); on each side of the pishtaq two stacked arched niches; at the chamfers more stacked niches;
//   slim guldasta pinnacles at the pishtaq edges; a high cylindrical drum, the onion double dome with a lotus crown,
//   metal finial with crescent; four chhatris (octagonal kiosks with small onion domes) around the drum; four free-standing
//   minarets in three stages with balconies (chhajjas) and a chhatri on top, slightly tilted outward; red-sandstone
//   mosque (left) and jawab (right) with three white domes; charbagh garden with cypress rows, a central raised marble
//   tank, and a long water channel with fountains; reflection in the channel.
//  EIFFEL TOWER (Champ de Mars side): four lattice legs on masonry piers with four big decorative base arches; first
//   platform (~57 m) with its arcade band; legs curving in to the second platform (~115 m); single tapering shaft to the
//   top platform (~276 m) with the small campanile and antenna; X-bracing lattice in every panel; at night it is lit gold
//   with the hourly white sparkle and a rotating beacon on top; Champ de Mars lawns with tree rows in front, beige stone
//   Haussmann buildings with blue-grey zinc mansard roofs and chimney pots on both sides.
const E = require('./engine'), L = require('./loc');
const INK = E.INK, poly = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z';
const r = i => { const v = Math.sin(i * 127.1) * 43758.5453; return v - Math.floor(v); };
const HALO = `<radialGradient id="halo"><stop offset="0" stop-color="#fff4c4"/><stop offset="0.6" stop-color="#ffe07a" stop-opacity="0.6"/><stop offset="1" stop-color="#ffe07a" stop-opacity="0"/></radialGradient>`;
const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const stars = (t, n, ymax, seed) => { let o = ''; for (let i = 0; i < n; i++) { const a = 0.3 + 0.6 * Math.abs(Math.sin(t * (0.7 + r(i + seed + 7) * 2) + i));
  o += `<circle cx="${(r(i + seed) * 1080).toFixed(0)}" cy="${(r(i + seed + 99) * ymax).toFixed(0)}" r="${(1.1 + r(i + seed + 3) * 2).toFixed(1)}" fill="#fff8e0" opacity="${a.toFixed(2)}"/>`; } return o; };
const S = (w = 5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"`;
const thin = (c = '#8f86a8', w = 2) => `stroke="${c}" stroke-width="${w}" fill="none"`;
const dimRect = d => d ? `<rect width="1080" height="1920" fill="#05040c" opacity="${d.toFixed(2)}"/>` : '';

// pointed (Mughal) arch path, base at y, width w, springing height h, apex extra a
const parch = (x, y, w, h, a = w * 0.45) => `M${x - w / 2} ${y} L${x - w / 2} ${y - h} Q${x - w / 2} ${y - h - a * 0.7} ${x} ${y - h - a} Q${x + w / 2} ${y - h - a * 0.7} ${x + w / 2} ${y - h} L${x + w / 2} ${y} Z`;
// onion dome on a neck, with lotus crown and finial
function onion(x, y, s, col = '#f7f3ec', sh = '#d9d2e6', w = 6, crescent = true) {
  const p = `M${x - 70 * s} ${y} C${x - 98 * s} ${y - 70 * s} ${x - 62 * s} ${y - 150 * s} ${x} ${y - 182 * s} C${x + 62 * s} ${y - 150 * s} ${x + 98 * s} ${y - 70 * s} ${x + 70 * s} ${y} Z`;
  let o = `<path d="${p}" fill="${col}" ${S(w * Math.max(0.55, s))}/>`;
  o += `<path d="M${x + 8 * s} ${y - 178 * s} C${x + 62 * s} ${y - 146 * s} ${x + 96 * s} ${y - 70 * s} ${x + 70 * s} ${y} L${x + 24 * s} ${y} C${x + 50 * s} ${y - 70 * s} ${x + 34 * s} ${y - 140 * s} ${x + 8 * s} ${y - 178 * s} Z" fill="${sh}"/>`;
  o += `<path d="M${x - 66 * s} ${y - 40 * s} Q${x - 92 * s} ${y - 100 * s} ${x - 40 * s} ${y - 150 * s}" stroke="#ffffff" stroke-width="${5 * s}" fill="none" opacity="0.7"/>`;
  for (let k = -2; k <= 2; k++) o += `<path d="M${x + k * 16 * s} ${y - 172 * s} q${8 * s} ${-14 * s} ${16 * s} 0" stroke="${INK}" stroke-width="${2.5 * s}" fill="none"/>`;   // lotus crown
  o += `<line x1="${x}" y1="${y - 182 * s}" x2="${x}" y2="${y - 250 * s}" stroke="#c9a23a" stroke-width="${6 * s}"/>` + [0.2, 0.45, 0.7].map(k => `<circle cx="${x}" cy="${y - 182 * s - 68 * s * k}" r="${7 * s}" fill="#d9b24a" ${S(2 * s)}/>`).join('');
  if (crescent) o += `<path d="M${x - 10 * s} ${y - 262 * s} a${10 * s} ${10 * s} 0 1 0 ${20 * s} 0" stroke="#d9b24a" stroke-width="${4 * s}" fill="none"/>`;
  return o;
}
function chhatri(x, y, s) { // octagonal kiosk: 3 visible arches on columns + chhajja + small onion
  let o = `<rect x="${x - 46 * s}" y="${y - 70 * s}" width="${92 * s}" height="${70 * s}" fill="#f7f3ec" ${S(4 * s)}/>`;
  for (const k of [-1, 0, 1]) o += `<path d="${parch(x + k * 30 * s, y - 6 * s, 18 * s, 34 * s, 10 * s)}" fill="#c9c0da" ${S(2.5 * s)}/>`;
  o += `<path d="M${x - 58 * s} ${y - 70 * s} L${x + 58 * s} ${y - 70 * s} L${x + 48 * s} ${y - 82 * s} L${x - 48 * s} ${y - 82 * s} Z" fill="#e6dfee" ${S(3 * s)}/>`;
  return o + onion(x, y - 82 * s, 0.52 * s, '#f7f3ec', '#d9d2e6', 6, false);
}

// ======================= TAJ MAHAL =======================
function taj(t = 0, o = {}) {
  const defs = HALO + lin('tajSky2', [[0, '#0d1440'], [0.45, '#2c2f7a'], [0.8, '#7a5a9a'], [1, '#e3a6b6']]) +
    `<radialGradient id="moonG"><stop offset="0" stop-color="#fff7dc" stop-opacity="0.65"/><stop offset="1" stop-color="#fff7dc" stop-opacity="0"/></radialGradient>` +
    lin('marble', [[0, '#fbf8f2'], [1, '#e4ddeb']]) + lin('waterT', [[0, '#3d4f9a'], [1, '#1f2a60']]);
  const M = 'url(#marble)', SH = '#d6cfe2', LT = '#ffffff', base = 1120, cx = 540;
  let b = `<rect width="1080" height="1920" fill="url(#tajSky2)"/>` + stars(t, 90, 900, 700);
  b += `<circle cx="850" cy="330" r="230" fill="url(#moonG)"/><circle cx="850" cy="330" r="78" fill="#fff6dc"/><circle cx="828" cy="312" r="13" fill="#efe3bf"/><circle cx="872" cy="350" r="9" fill="#efe3bf"/>`;
  // distant Yamuna haze + far trees
  b += `<rect x="0" y="${base - 40}" width="1080" height="60" fill="#5a4a7a" opacity="0.5"/>`;
  // red-sandstone mosque (left) and jawab (right), partly hidden by the minarets: arcade + 3 white domes
  for (const [x0, flip] of [[0, 1], [860, -1]]) {
    b += `<rect x="${x0}" y="${base - 160}" width="220" height="170" fill="#b2533e" ${S(5)}/>`;
    for (let k = 0; k < 4; k++) b += `<path d="${parch(x0 + 30 + k * 54, base, 30, 70, 16)}" fill="#7a3426" ${S(3)}/>`;
    b += `<rect x="${x0}" y="${base - 172}" width="220" height="14" fill="#c86a52" ${S(3)}/>`;
    for (const [dx, s] of [[60, 0.36], [110, 0.46], [160, 0.36]]) b += onion(x0 + dx, base - 172, s, '#f2ede6', '#d6cfe2', 6, false);
  }
  // plinth with its row of small arches
  b += `<rect x="215" y="${base - 10}" width="650" height="64" fill="${M}" ${S(6)}/><rect x="215" y="${base - 10}" width="650" height="10" fill="${SH}"/>`;
  for (let k = 0; k < 15; k++) b += `<path d="${parch(250 + k * 41.5, base + 46, 20, 18, 9)}" fill="#cfc6dc" ${S(2)}/>`;
  // minarets: free-standing, three stages, chhajja balconies, chhatri on top, very slight outward tilt
  for (const [mx, tilt] of [[250, -1.2], [830, 1.2]]) {
    let m = `<path d="M${mx - 22} ${base - 10} L${mx - 17} ${base - 430} L${mx + 17} ${base - 430} L${mx + 22} ${base - 10} Z" fill="${M}" ${S(5)}/><path d="M${mx + 4} ${base - 10} L${mx + 4} ${base - 430} L${mx + 17} ${base - 430} L${mx + 22} ${base - 10} Z" fill="${SH}"/>`;
    for (let y = base - 30; y > base - 420; y -= 22) m += `<line x1="${mx - 18}" y1="${y}" x2="${mx + 18}" y2="${y}" stroke="#cfc6dc" stroke-width="1.5"/>`;
    for (const y of [base - 150, base - 290, base - 430]) m += `<rect x="${mx - 32}" y="${y - 10}" width="64" height="12" fill="${M}" ${S(3.5)}/>` + [-24, -8, 8, 24].map(dx => `<line x1="${mx + dx}" y1="${y + 2}" x2="${mx + dx - 3}" y2="${y + 14}" stroke="${INK}" stroke-width="2"/>`).join('');
    m += chhatri(mx, base - 440, 0.55);
    b += `<g transform="rotate(${tilt} ${mx} ${base})">${m}</g>`;
  }
  // main tomb: chamfered block (front face + two chamfer faces)
  const top = base - 300, fw = 360, cw = 70;
  b += `<path d="M${cx - fw / 2 - cw} ${base - 10} L${cx - fw / 2 - cw} ${top + 30} L${cx - fw / 2} ${top} L${cx + fw / 2} ${top} L${cx + fw / 2 + cw} ${top + 30} L${cx + fw / 2 + cw} ${base - 10} Z" fill="${M}" ${S(6)}/>`;
  b += `<path d="M${cx + fw / 2} ${top} L${cx + fw / 2 + cw} ${top + 30} L${cx + fw / 2 + cw} ${base - 10} L${cx + fw / 2} ${base - 10} Z" fill="${SH}"/><line x1="${cx - fw / 2}" y1="${top}" x2="${cx - fw / 2}" y2="${base - 10}" stroke="${INK}" stroke-width="3"/><line x1="${cx + fw / 2}" y1="${top}" x2="${cx + fw / 2}" y2="${base - 10}" stroke="${INK}" stroke-width="3"/>`;
  // stacked niches on the side bays and chamfers (two storeys each)
  for (const bx of [cx - fw / 2 + 32, cx + fw / 2 - 32, cx - fw / 2 - cw / 2, cx + fw / 2 + cw / 2]) for (const [y, h] of [[base - 22, 90], [base - 150, 80]]) {
    const ww = Math.abs(bx - cx) > fw / 2 ? 38 : 48;
    b += `<rect x="${bx - ww / 2 - 6}" y="${y - h - 36}" width="${ww + 12}" height="${h + 40}" ${thin('#bdb3cc', 2.5)}/><path d="${parch(bx, y, ww, h, ww * 0.5)}" fill="#c4bbd6" ${S(3)}/><path d="${parch(bx, y, ww * 0.6, h * 0.8, ww * 0.3)}" fill="#a99ec2"/>`; }
  // central pishtaq: tall frame with calligraphy border, iwan with recessed half-dome, guldasta pinnacles
  const pw = 200, ph = 290, py = base - 10;
  b += `<rect x="${cx - pw / 2}" y="${py - ph}" width="${pw}" height="${ph}" fill="${M}" ${S(5)}/><rect x="${cx - pw / 2 + 10}" y="${py - ph + 10}" width="${pw - 20}" height="${ph - 10}" fill="none" stroke="#3a3040" stroke-width="5" stroke-dasharray="7 4"/>`;
  b += `<path d="${parch(cx, py, 130, 170, 70)}" fill="#bfb4d4" ${S(5)}/><path d="${parch(cx, py, 98, 150, 52)}" fill="#9a8fba"/>`;
  for (let k = 0; k < 5; k++) b += `<path d="M${cx - 44 + k * 22} ${py - 160} q11 -16 22 0" ${thin('#6f6590', 2.5)}/>`;     // muqarnas hint
  b += `<rect x="${cx - 26}" y="${py - 110}" width="52" height="100" fill="#6f6590" ${S(3)}/>` + `<path d="${parch(cx, py - 10, 40, 70, 18)}" fill="#4a4270"/>`;
  for (const gx of [cx - pw / 2, cx + pw / 2]) b += `<rect x="${gx - 7}" y="${py - ph - 40}" width="14" height="40" fill="${M}" ${S(3)}/><path d="M${gx - 10} ${py - ph - 40} Q${gx} ${py - ph - 62} ${gx + 10} ${py - ph - 40} Z" fill="${M}" ${S(3)}/>`;
  // chhatris around the drum, the drum, the great dome
  b += chhatri(cx - 175, top - 2, 0.75) + chhatri(cx + 175, top - 2, 0.75);
  b += `<rect x="${cx - 120}" y="${top - 70}" width="240" height="72" fill="${M}" ${S(5)}/><rect x="${cx + 30}" y="${top - 70}" width="90" height="72" fill="${SH}"/><path d="M${cx - 120} ${top - 70} L${cx + 120} ${top - 70}" stroke="${INK}" stroke-width="4"/>`;
  for (let k = 0; k < 7; k++) b += `<path d="${parch(cx - 90 + k * 30, top - 8, 14, 36, 8)}" fill="#cfc6dc" ${S(2)}/>`;
  b += `<path d="M${cx - 122} ${top - 74} q8 -10 16 0 ${Array.from({ length: 14 }, () => 'q8 -10 16 0').join(' ')}" stroke="${INK}" stroke-width="2.5" fill="none"/>`;   // rope moulding
  b += onion(cx, top - 76, 1.6, M, SH, 7, true);
  // moonlight rim on the right of the dome
  b += `<path d="M${cx + 100} ${top - 140} C${cx + 150} ${top - 220} ${cx + 110} ${top - 300} ${cx + 40} ${top - 340}" stroke="${LT}" stroke-width="6" fill="none" opacity="0.8"/>`;
  // charbagh: lawns, cypress rows, raised tank, water channel with fountains and the reflection
  b += `<rect x="0" y="${base + 54}" width="1080" height="${1920 - base}" fill="#2c5f44"/><path d="M0 ${base + 54} L1080 ${base + 54}" stroke="${INK}" stroke-width="5"/>`;
  b += `<path d="M450 ${base + 54} L630 ${base + 54} L760 1920 L320 1920 Z" fill="#d9d2e2" ${S(5)}/><path d="M490 ${base + 54} L590 ${base + 54} L670 1920 L410 1920 Z" fill="url(#waterT)" ${S(4)}/>`;
  // reflection of the dome + pishtaq in the channel (soft, rippling)
  const rip = Math.sin(t * 2) * 3;
  b += `<g opacity="0.32" transform="translate(${rip} ${2 * (base + 54)}) scale(1 -1)"><path d="M${cx - 60} ${base + 54} L${cx - 60} ${base - 120} L${cx + 60} ${base - 120} L${cx + 60} ${base + 54} Z" fill="#e8e2f2"/><path d="M${cx - 70} ${top - 76} C${cx - 98} ${top - 146} ${cx - 62} ${top - 226} ${cx} ${top - 258} C${cx + 62} ${top - 226} ${cx + 98} ${top - 146} ${cx + 70} ${top - 76} Z" fill="#e8e2f2" transform="translate(0 ${0}) scale(1 1)"/></g>`;
  for (let k = 0; k < 5; k++) { const y = base + 160 + k * 150, w = 50 + k * 14, ph2 = (t * 3 + k) % 1; b += `<ellipse cx="540" cy="${y}" rx="${w * 0.25}" ry="6" fill="#bcd4ff" opacity="0.6"/><path d="M540 ${y} q-6 ${-30 - 10 * ph2} -14 ${-12} M540 ${y} q6 ${-30 - 10 * ph2} 14 ${-12}" stroke="#dfeaff" stroke-width="3" fill="none" opacity="0.8"/>`; }
  b += `<rect x="470" y="${base + 420}" width="140" height="60" fill="#e6e0ee" ${S(4)}/>`;                                        // central raised tank
  for (const side of [-1, 1]) for (let k = 0; k < 6; k++) { const d = k / 5, x = 540 + side * (150 + 260 * d), y = base + 120 + 640 * d, h = 90 + 160 * d, w = 22 + 30 * d;
    b += `<path d="M${x} ${y - h} Q${x + w} ${y - h * 0.4} ${x} ${y} Q${x - w} ${y - h * 0.4} ${x} ${y - h} Z" fill="#163f2c" ${S(3 + 2 * d)}/><path d="M${x} ${y - h} Q${x + w * 0.8} ${y - h * 0.4} ${x + 2} ${y}" fill="#1f5038"/>`; }
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// ======================= EIFFEL TOWER =======================
function eiffel(t = 0, o = {}) {
  const defs = HALO + lin('parSky2', [[0, '#0b1033'], [0.55, '#283070'], [1, '#6a4a86']]) + lin('ironG', [[0, '#e0a24a'], [1, '#a8662a']], 1, 0);
  let b = `<rect width="1080" height="1920" fill="url(#parSky2)"/>` + stars(t, 70, 900, 900);
  const cx = 540, base = 1240, top = 300, H = base - top;
  // rotating beacon beams from the top
  const ang = t * 0.9; for (const k of [0, Math.PI]) { const a = ang + k, x2 = cx + Math.cos(a) * 1400, y2 = top - 60 + Math.sin(a) * 120;
    b += `<path d="M${cx} ${top - 60} L${x2.toFixed(0)} ${(y2 - 40).toFixed(0)} L${x2.toFixed(0)} ${(y2 + 40).toFixed(0)} Z" fill="#fff6c8" opacity="0.12"/>`; }
  // Haussmann blocks left and right: beige stone, rows of tall windows with balconies, zinc mansard roofs, chimney pots
  const block = (x, w, h, seed) => { const y = base + 40 - h; let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#d8c3a0" ${S(5)}/>`;
    s += `<path d="M${x - 8} ${y} L${x + 18} ${y - 70} L${x + w - 18} ${y - 70} L${x + w + 8} ${y} Z" fill="#5e6e8a" ${S(5)}/>`;
    for (let k = 0; k < Math.floor(w / 60); k++) { const wx = x + 22 + k * 60; s += `<path d="M${wx} ${y - 8} L${wx} ${y - 44} Q${wx + 13} ${y - 58} ${wx + 26} ${y - 44} L${wx + 26} ${y - 8} Z" fill="#ffe2a0" ${S(2.5)}/>`; }
    for (let k = 0; k < 3; k++) s += `<rect x="${x + 20 + k * (w - 40) / 2}" y="${y - 96}" width="16" height="28" fill="#b06a4a" ${S(3)}/>`;
    for (let row = 0; row < Math.floor((h - 40) / 70); row++) for (let k = 0; k < Math.floor(w / 60); k++) { const wx = x + 20 + k * 60, wy = y + 24 + row * 70, lit = r(seed + row * 9 + k) > 0.35;
      s += `<rect x="${wx}" y="${wy}" width="26" height="44" fill="${lit ? '#ffd98a' : '#3a3a5a'}" ${S(2.5)}/>` + (row === 1 || row === 4 ? `<rect x="${wx - 6}" y="${wy + 40}" width="38" height="8" fill="#2a2a3a"/>` : ''); }
    return s; };
  b += block(-20, 250, 430, 1) + block(840, 260, 470, 7);
  // tower geometry: leg outer/inner profiles, near-exponential curve
  const xo = (y, s) => cx + s * (360 * Math.pow((y - top) / H, 2.1) + 14), xi = (y, s) => cx + s * (360 * Math.pow((y - top) / H, 2.1) * 0.55 + 6);
  const p1 = top + H * 0.79, p2 = top + H * 0.58, p3 = top + 26;   // first, second and top platform heights
  const legPath = (s, y0, y1) => { const a = [], c = []; for (let k = 0; k <= 24; k++) { const y = y0 + (y1 - y0) * k / 24; a.push([xo(y, s), y]); c.push([xi(y, s), y]); } return [...a, ...c.reverse()]; };
  for (const s of [-1, 1]) {
    b += `<path d="${poly(legPath(s, top + 40, base))}" fill="url(#ironG)" ${S(6)}/>`;
    // X lattice in each panel of the leg
    for (let y = top + 50; y < base - 10; y += 26) { const a1 = xo(y, s), b1 = xi(y, s), a2 = xo(y + 26, s), b2 = xi(y + 26, s);
      b += `<path d="M${a1.toFixed(1)} ${y} L${b2.toFixed(1)} ${y + 26} M${b1.toFixed(1)} ${y} L${a2.toFixed(1)} ${y + 26} M${a1.toFixed(1)} ${y} L${b1.toFixed(1)} ${y}" stroke="#5a3214" stroke-width="2" opacity="0.85"/>`; }
    // masonry pier
    b += `<rect x="${(xo(base, s) + (s < 0 ? -10 : -xo(base, s) + xi(base, s) - 10)).toFixed(0)}" y="${base - 6}" width="${(Math.abs(xo(base, s) - xi(base, s)) + 20).toFixed(0)}" height="34" fill="#b8a888" ${S(4)}/>`;
  }
  // the big decorative base arch between the legs
  const ax = xi(base, 1) - cx + 4; b += `<path d="M${cx - ax} ${base} L${cx - ax} ${p1 + 150} Q${cx} ${p1 - 30} ${cx + ax} ${p1 + 150} L${cx + ax} ${base}" fill="none" stroke="${INK}" stroke-width="16"/><path d="M${cx - ax} ${base} L${cx - ax} ${p1 + 150} Q${cx} ${p1 - 30} ${cx + ax} ${p1 + 150} L${cx + ax} ${base}" fill="none" stroke="#c98a3a" stroke-width="8"/>`;
  for (let k = 1; k < 10; k++) { const u = k / 10, x = cx - ax + 2 * ax * u, y = p1 + 150 - 90 * (1 - Math.pow(2 * u - 1, 2)); b += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 26}" stroke="#5a3214" stroke-width="2.5"/>`; }
  // platforms: first (with arcade band), second
  const plat = (y, extra, hgt) => { const xl = xo(y, -1) - extra, xr = xo(y, 1) + extra; let s = `<rect x="${xl}" y="${y - hgt}" width="${xr - xl}" height="${hgt}" fill="#c98a3a" ${S(5)}/>`;
    for (let x = xl + 10; x < xr - 14; x += 20) s += `<path d="M${x} ${y - 4} L${x} ${y - hgt + 12} Q${x + 7} ${y - hgt + 4} ${x + 14} ${y - hgt + 12} L${x + 14} ${y - 4}" fill="#ffd98a" stroke="#5a3214" stroke-width="1.5"/>`;
    return s + `<rect x="${xl - 8}" y="${y - hgt - 8}" width="${xr - xl + 16}" height="10" fill="#e0a24a" ${S(3)}/>`; };
  b += plat(p1, 26, 56) + plat(p2, 14, 30);
  // top: platform box, campanile, antenna
  b += `<rect x="${cx - 26}" y="${p3 - 40}" width="52" height="40" fill="#c98a3a" ${S(4)}/><path d="M${cx - 16} ${p3 - 40} L${cx - 8} ${p3 - 92} L${cx + 8} ${p3 - 92} L${cx + 16} ${p3 - 40} Z" fill="#e0a24a" ${S(4)}/><line x1="${cx}" y1="${p3 - 92}" x2="${cx}" y2="${p3 - 200}" stroke="${INK}" stroke-width="6"/><line x1="${cx}" y1="${p3 - 92}" x2="${cx}" y2="${p3 - 200}" stroke="#d8d0e0" stroke-width="3"/>`;
  b += `<circle cx="${cx}" cy="${p3 - 70}" r="${10 + 4 * Math.sin(t * 6)}" fill="#fff6c8" opacity="0.9"/>`;
  // the sparkle: white twinkles all over the iron (first 5 minutes of every hour in real life)
  for (let i = 0; i < 90; i++) { const yy = top + 50 + r(i + 300) * (H - 60), s = r(i + 310) > 0.5 ? 1 : -1, u = r(i + 320), xx = xi(yy, s) + (xo(yy, s) - xi(yy, s)) * u;
    if (Math.sin(t * 11 + i * 2.7) > 0.7) b += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="4" fill="#ffffff"/><circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="11" fill="#ffffff" opacity="0.35"/>`; }
  // Champ de Mars: lawn, gravel walks, tree rows, lamp posts
  b += `<rect x="0" y="${base + 28}" width="1080" height="${1920 - base}" fill="#2f6a3e"/><path d="M0 ${base + 28} L1080 ${base + 28}" stroke="${INK}" stroke-width="6"/>`;
  b += `<path d="M380 ${base + 28} L700 ${base + 28} L1000 1920 L80 1920 Z" fill="#cdbb94" ${S(4)}/><path d="M440 ${base + 28} L640 ${base + 28} L780 1920 L300 1920 Z" fill="#3f8a4a" ${S(4)}/>`;
  for (const side of [-1, 1]) for (let k = 0; k < 6; k++) { const d = k / 5, x = 540 + side * (300 + 300 * d), y = base + 90 + 560 * d, R = 34 + 46 * d;
    b += `<rect x="${x - 5}" y="${y}" width="10" height="${30 + 40 * d}" fill="#5a3a2a" ${S(2)}/><circle cx="${x}" cy="${y - R * 0.3}" r="${R}" fill="#1f5a2e" ${S(3 + 2 * d)}/><circle cx="${x - R * 0.3}" cy="${y - R * 0.5}" r="${R * 0.45}" fill="#2a7038"/>`; }
  for (const side of [-1, 1]) for (let k = 0; k < 4; k++) { const d = k / 3, x = 540 + side * (175 + 200 * d), y = base + 100 + 520 * d, h = 60 + 80 * d;
    b += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="${INK}" stroke-width="${3 + 2 * d}"/><circle cx="${x}" cy="${y - h}" r="${6 + 6 * d}" fill="#fff0b0"/><circle cx="${x}" cy="${y - h}" r="${18 + 14 * d}" fill="#fff0b0" opacity="0.25"/>`; }
  return { defs, back: b + dimRect(o.dim), front: '' };
}


// ======================= small-object helpers (minute details) =======================
const PAL_IN = ['#d22f48', '#ff9a1a', '#2f8a7a', '#7a2f8a', '#e0b030', '#3a5aa8', '#ff5c8a', '#1f8a3a'];
function person(x, y, s, seed, pal = PAL_IN, kind) { // tiny walker: head, hair, clothes (saree drape / kurta / jacket), legs; seed picks clothes
  const c = pal[Math.floor(r(seed) * pal.length)], c2 = pal[Math.floor(r(seed + 1) * pal.length)], k = kind ?? Math.floor(r(seed + 2) * 3), skin = ['#c98e68', '#b27a56', '#d9a77e'][Math.floor(r(seed + 3) * 3)];
  let o = `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})">`;
  o += `<line x1="-4" y1="-14" x2="-5" y2="0" stroke="${INK}" stroke-width="3.5"/><line x1="4" y1="-14" x2="5" y2="0" stroke="${INK}" stroke-width="3.5"/>`;
  if (k === 0) o += `<path d="M-9 -40 L9 -40 L13 -10 L-13 -10 Z" fill="${c}" ${S(2)}/><path d="M-9 -40 L9 -24 L9 -40 Z" fill="${c2}"/>`;            // saree with pallu
  else if (k === 1) o += `<path d="M-8 -40 L8 -40 L10 -14 L-10 -14 Z" fill="${c}" ${S(2)}/><rect x="-7" y="-15" width="14" height="4" fill="#f2ead8"/>`;  // kurta
  else o += `<rect x="-8" y="-40" width="16" height="22" rx="3" fill="${c}" ${S(2)}/><rect x="-7" y="-18" width="14" height="6" fill="#2a3a6a"/>`;       // jacket + jeans
  o += `<circle cx="0" cy="-47" r="7" fill="${skin}" ${S(2)}/><path d="M-7 -49 Q0 -58 7 -49 Q4 -53 0 -53 Q-4 -53 -7 -49 Z" fill="#1d1216"/>`;
  return o + '</g>';
}
const crowd = (pts, s, seed, pal, kind) => pts.map(([x, y], i) => person(x, y, s * (0.85 + 0.3 * r(seed + i)), seed + i * 7, pal, kind)).join('');
function birds(t, n, x0, y0, w, h, seed, col = '#1d1216') { let o = ''; for (let i = 0; i < n; i++) { const x = x0 + ((r(seed + i) * w + t * (20 + 20 * r(seed + i + 3))) % w), y = y0 + r(seed + i + 9) * h + Math.sin(t * 2 + i) * 6, f = Math.sin(t * 9 + i * 2) * 4;
  o += `<path d="M${x - 9} ${y - f} Q${x - 4} ${y - 4} ${x} ${y} Q${x + 4} ${y - 4} ${x + 9} ${y - f}" stroke="${col}" stroke-width="2.5" fill="none"/>`; } return o; }
function lampParis(x, y, s) { return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-6" width="18" height="8" fill="#1d1d26"/><path d="M-4 -6 L-3 -150 L3 -150 L4 -6 Z" fill="#2a2a36" ${S(2)}/><path d="M-14 -150 L14 -150 L9 -178 L-9 -178 Z" fill="#ffe7a0" ${S(2.5)}/><path d="M-12 -178 L12 -178 L0 -190 Z" fill="#2a2a36"/><circle cx="0" cy="-164" r="30" fill="#fff0b0" opacity="0.28"/><path d="M-3 -120 q-16 0 -16 -14 M3 -120 q16 0 16 -14" stroke="#2a2a36" stroke-width="3" fill="none"/></g>`; }
function bench(x, y, s, col = '#5a3a2a') { return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-40" y="-26" width="80" height="8" fill="${col}" ${S(2)}/><rect x="-40" y="-14" width="80" height="7" fill="${col}" ${S(2)}/><line x1="-34" y1="-7" x2="-34" y2="0" stroke="${INK}" stroke-width="4"/><line x1="34" y1="-7" x2="34" y2="0" stroke="${INK}" stroke-width="4"/></g>`; }
function flowerBed(x0, y0, x1, y1, n, seed, cols = ['#ff3d5a', '#ffd24a', '#ff8a1a', '#ffffff']) { let o = ''; for (let i = 0; i < n; i++) { const u = r(seed + i), x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + (r(seed + i + 50) - 0.5) * 10;
  o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2.5 + r(seed + i + 9) * 2.5).toFixed(1)}" fill="${cols[i % cols.length]}"/>`; } return o; }
function grass(x0, x1, y, n, seed, col = '#1f5a2e') { let o = ''; for (let i = 0; i < n; i++) { const x = x0 + r(seed + i) * (x1 - x0), yy = y + r(seed + i + 7) * 30, h = 8 + r(seed + i + 3) * 10;
  o += `<path d="M${x.toFixed(1)} ${yy.toFixed(1)} l-3 ${-h} M${x.toFixed(1)} ${yy.toFixed(1)} l3 ${-h * 0.8}" stroke="${col}" stroke-width="2"/>`; } return o; }
function inlayFlower(x, y, s) { return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 L0 -18" stroke="#3a7a4a" stroke-width="2"/><circle cx="0" cy="-20" r="4" fill="#c23a4a"/><circle cx="-5" cy="-14" r="3" fill="#e0a030"/><circle cx="5" cy="-14" r="3" fill="#3a6ab0"/><path d="M0 -8 q-7 -2 -8 -8 M0 -8 q7 -2 8 -8" stroke="#3a7a4a" stroke-width="2" fill="none"/></g>`; }
function jali(x, y, w, h) { let o = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#d9d2e6" ${S(2)}/>`; for (let i = 6; i < w; i += 8) for (let j = 6; j < h; j += 8) o += `<circle cx="${x + i}" cy="${y + j}" r="2.2" fill="#8a80a8"/>`; return o; }
function calligraphyBand(x, y, w, h) { let o = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f4efe6" ${S(1.5)}/>`; for (let i = 4; i < w - 4; i += 9) o += `<path d="M${x + i} ${y + h - 3} q2 ${-h * 0.6} 4 0 q1 ${-h * 0.4} 3 ${-h * 0.2}" stroke="#2a2030" stroke-width="1.3" fill="none"/>`; return o; }
function cloudShaded(x, y, s, top = '#ffffff', bot = '#d8d0ec', op = 1) { return `<g opacity="${op}">${L.softCloud(x, y, s, bot)}${L.softCloud(x - 6 * s, y - 10 * s, s * 0.92, top)}</g>`; }

// ======================= TAJ MAHAL: minute details layered on the base plate =======================
function tajHD(t = 0, o = {}) {
  const B = taj(t, {}), base = 1120, cx = 540, top = base - 300;
  let d = '';
  // calligraphy band around the pishtaq frame (replaces the plain dashes visually) and inlay flowers in the spandrels
  d += calligraphyBand(cx - 92, base - 300, 184, 12) + calligraphyBand(cx - 100, base - 288, 10, 270) + calligraphyBand(cx + 90, base - 288, 10, 270);
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) d += inlayFlower(cx + sx * (44 + k * 14), base - 186 - k * 22, 0.7);
  // jali screens in the lower side niches, inlay rosettes above them
  for (const bx of [cx - 148, cx + 148]) { d += jali(bx - 14, base - 90, 28, 52); d += `<circle cx="${bx}" cy="${base - 140}" r="7" fill="#e8e0f0" ${S(1.5)}/><circle cx="${bx}" cy="${base - 140}" r="3" fill="#c23a4a"/>`; }
  // chevron inlay bands on the minaret shafts + lit balcony lamps
  for (const mx of [250, 830]) for (let y = base - 140; y > base - 420; y -= 14) d += `<path d="M${mx - 14} ${y} L${mx} ${y - 6} L${mx + 14} ${y}" stroke="#b9afcc" stroke-width="1.6" fill="none"/>`;
  // marble steps up to the plinth, the 'Diana bench' in front of the raised tank, flower beds along the walks
  for (let k = 0; k < 4; k++) d += `<rect x="${470 - k * 6}" y="${base + 54 + k * 7}" width="${140 + k * 12}" height="7" fill="#e6e0ee" ${S(1.5)}/>`;
  d += bench(540, base + 512, 0.9, '#efe9f4');
  d += flowerBed(440, base + 90, 300, 1900, 70, 5) + flowerBed(640, base + 90, 780, 1900, 70, 9);
  // tourists (Indian families, sarees and kurtas) on the walks, smaller with distance
  const walk = []; for (let i = 0; i < 16; i++) { const dd = r(i + 40), side = i % 2 ? 1 : -1; walk.push([540 + side * (80 + 80 * dd + r(i + 60) * 30), base + 120 + dd * 700]); }
  walk.sort((a, b) => a[1] - b[1]).forEach(([x, y], i) => { d += person(x, y, 0.5 + (y - base) / 700 * 0.9, 300 + i * 7); });
  // grass texture, birds crossing the moon, light mist on the river line, fireflies
  d += grass(0, 440, base + 70, 120, 11, '#24563c') + grass(640, 1080, base + 70, 120, 31, '#24563c');
  d += birds(t, 7, 640, 250, 400, 200, 77, '#1a1430');
  d += `<rect x="0" y="${base - 30}" width="1080" height="40" fill="#e8e0f6" opacity="${(0.12 + 0.05 * Math.sin(t)).toFixed(2)}"/>`;
  for (let i = 0; i < 14; i++) { const x = r(i + 500) * 1080, y = base + 80 + r(i + 510) * 500, a = Math.max(0, Math.sin(t * 3 + i * 1.7)); d += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="3" fill="#fff6a0" opacity="${(0.8 * a).toFixed(2)}"/>`; }
  return { defs: B.defs, back: B.back + d + dimRect(o.dim), front: '' };
}

// ======================= EIFFEL: minute details =======================
function eiffelHD(t = 0, o = {}) {
  const B = eiffel(t, {}), base = 1240, cx = 540;
  let d = '';
  // cafe awnings, tables and chairs on the ground floor of both blocks, flower boxes on balconies
  for (const [x0, w] of [[-20, 250], [840, 260]]) {
    d += `<rect x="${x0}" y="${base - 70}" width="${w}" height="110" fill="#3a2a2a" ${S(4)}/>`;
    for (let k = 0; k < Math.floor(w / 30); k++) d += `<path d="M${x0 + k * 30} ${base - 70} L${x0 + k * 30 + 30} ${base - 70} L${x0 + k * 30 + 34} ${base - 40} L${x0 + k * 30 + 4} ${base - 40} Z" fill="${k % 2 ? '#c2303a' : '#f6efe0'}" ${S(1.5)}/>`;
    for (let k = 0; k < 3; k++) { const tx = x0 + 40 + k * 75; d += `<ellipse cx="${tx}" cy="${base + 8}" rx="16" ry="5" fill="#f2ead8" ${S(2)}/><line x1="${tx}" y1="${base + 8}" x2="${tx}" y2="${base + 34}" stroke="${INK}" stroke-width="2.5"/>` + `<path d="M${tx - 26} ${base + 34} L${tx - 26} ${base + 6} L${tx - 18} ${base + 6} M${tx + 26} ${base + 34} L${tx + 26} ${base + 6} L${tx + 18} ${base + 6}" stroke="${INK}" stroke-width="2.5" fill="none"/>`; }
    for (let row = 0; row < 5; row++) for (let k = 0; k < Math.floor(w / 60); k++) if (row === 1 || row === 4) d += flowerBed(x0 + 18 + k * 60, base + 40 - 470 + 24 + row * 70 + 46, x0 + 50 + k * 60, base + 40 - 470 + 24 + row * 70 + 46, 5, row * 13 + k, ['#ff3d5a', '#ff8ab0', '#ffffff']);
  }
  // elevators climbing the legs, restaurant glow on the second floor, rivet dots, French flag on top
  const up = (t * 0.08) % 1; for (const s of [-1, 1]) { const y = base - 60 - up * 380, x = cx + s * (360 * Math.pow((y - 300) / 940, 2.1) * 0.78 + 10); d += `<rect x="${x - 9}" y="${y - 14}" width="18" height="22" rx="3" fill="#ffe7a0" ${S(2.5)}/>`; }
  d += `<path d="M${cx + 2} 132 L${cx + 2} 112 L${cx + 26} 116 L${cx + 2} 122" fill="none"/><rect x="${cx + 2}" y="104" width="8" height="12" fill="#2a50a8"/><rect x="${cx + 10}" y="104" width="8" height="12" fill="#fff"/><rect x="${cx + 18}" y="104" width="8" height="12" fill="#d22f48"/>`;
  // Paris lamps along the walk, benches, people strolling (Indian tourists too), a pigeon pair, a crepe cart
  for (const side of [-1, 1]) for (let k = 0; k < 4; k++) { const dd = k / 3; d += lampParis(540 + side * (175 + 200 * dd), base + 100 + 520 * dd, 0.5 + 0.6 * dd); }
  d += bench(300, base + 330, 0.8) + bench(790, base + 420, 0.9);
  const walkers = []; for (let i = 0; i < 18; i++) { const dd = r(i + 70), side = r(i + 71) > 0.5 ? 1 : -1; walkers.push([540 + side * (60 + 200 * dd) * (0.6 + 0.6 * dd), base + 60 + dd * 620]); }
  walkers.sort((a, b) => a[1] - b[1]).forEach(([x, y], i) => { d += person(x, y, 0.5 + (y - base) / 620 * 0.9, 500 + i * 5, ['#d22f48', '#2a3a6a', '#f2ead8', '#ff9a1a', '#3a8a7a', '#7a2f5a']); });
  d += `<g transform="translate(860 ${base + 300})"><rect x="-50" y="-40" width="100" height="44" rx="6" fill="#f6efe0" ${S(3)}/><path d="M-60 -40 L60 -40 L48 -70 L-48 -70 Z" fill="#2a6a9a" ${S(3)}/><circle cx="-30" cy="10" r="10" fill="#3a3a3a" ${S(2)}/><circle cx="30" cy="10" r="10" fill="#3a3a3a" ${S(2)}/></g>`;
  for (const [x, y] of [[620, base + 520], [650, base + 530]]) d += `<g transform="translate(${x} ${y})"><ellipse rx="12" ry="8" fill="#9aa0b0" ${S(2)}/><circle cx="10" cy="-6" r="5" fill="#9aa0b0" ${S(2)}/><path d="M14 -6 l5 1 l-5 1" fill="#e0a030"/></g>`;
  d += grass(0, 420, base + 40, 90, 51, '#215a30') + grass(660, 1080, base + 40, 90, 61, '#215a30') + birds(t, 5, 120, 220, 800, 260, 88, '#d8d0f0');
  return { defs: B.defs, back: B.back + d + dimRect(o.dim), front: '' };
}

// ======================= SWISS ALPS: Matterhorn from the Riffelsee side, Zermatt below =======================
// Matterhorn: a lone hooked pyramid, the Hörnli ridge facing us (left), the Zmutt/Lion ridges to the sides, a summit that
// hooks east, dark rock with snow bands and a glacier skirt; Riffelsee reflection; Zermatt chalets (dark larch wood, stone
// roofs, red geraniums) and the white church steeple; the Gornergrat cog train; a cable-car gondola; cows with bells.
function alpsHD(t = 0, o = {}) {
  const defs = HALO + lin('alpSky2', [[0, '#3f86d8'], [0.5, '#8cc4f2'], [1, '#e8f5ff']]) + lin('rock', [[0, '#6a7088'], [1, '#4a4f66']], 1, 0) + lin('lake2', [[0, '#3d86c8'], [1, '#2a5a98']]);
  let b = `<rect width="1080" height="1920" fill="url(#alpSky2)"/><circle cx="900" cy="300" r="70" fill="#fff8d0"/><circle cx="900" cy="300" r="150" fill="#fff8d0" opacity="0.22"/>`;
  b += cloudShaded(180 + (t * 8) % 300, 380, 1.1) + cloudShaded(760 - (t * 5) % 200, 470, 0.8);
  // far ranges with snow caps
  b += `<path d="M0 900 L110 720 L190 800 L300 660 L380 760 L470 700 L540 780 L640 690 L760 790 L860 700 L980 800 L1080 740 L1080 1060 L0 1060 Z" fill="#a9bde0" ${S(4)}/>`;
  for (const [x, y] of [[110, 720], [300, 660], [640, 690], [860, 700]]) b += `<path d="M${x - 36} ${y + 46} L${x} ${y} L${x + 36} ${y + 46} L${x + 18} ${y + 36} L${x} ${y + 50} L${x - 16} ${y + 34} Z" fill="#ffffff"/>`;
  // MATTERHORN
  const m = [[230, 1080], [400, 840], [470, 700], [515, 560], [548, 470], [584, 418], [612, 424], [616, 462], [640, 540], [690, 680], [760, 840], [880, 1080]];   // leaning, hooked summit
  b += `<path d="${poly(m)}" fill="url(#rock)" ${S(7)}/>`;
  b += `<path d="M612 424 L616 462 L640 540 L690 680 L760 840 L880 1080 L650 1080 L600 760 L590 560 Z" fill="#3e4258" opacity="0.75"/>`;       // shaded east face
  b += `<path d="M540 470 L520 560 L490 700 L430 860 L330 1080" ${thin('#2a2d40', 3)}/><path d="M566 448 L572 600 L590 760 L640 1080" ${thin('#2a2d40', 3)}/>`;   // Hörnli + east ridge
  for (let k = 0; k < 26; k++) { const y = 520 + k * 21, w = (y - 448) * 0.62; b += `<path d="M${566 - w * 0.8 + r(k) * 20} ${y} l${30 + r(k + 1) * 40} ${-6 + r(k + 2) * 10}" stroke="#2f3346" stroke-width="2"/>`; }   // rock strata
  for (const [x, y, w] of [[548, 470, 26], [520, 560, 40], [600, 540, 34], [480, 660, 60], [640, 670, 44], [440, 780, 80], [700, 800, 60]]) b += `<path d="M${x - w / 2} ${y} q${w / 2} -14 ${w} 0 q${-w * 0.3} 10 ${-w * 0.5} 4 q${-w * 0.2} 8 ${-w * 0.5} -4 Z" fill="#ffffff" ${S(2)}/>`;   // snow bands
  b += `<path d="M260 1080 Q400 980 520 1010 Q640 980 860 1080 Z" fill="#eef4ff" ${S(4)}/>`;                                          // glacier skirt
  // meadow, Riffelsee lake with the Matterhorn reflection (ripples move)
  b += `<path d="M0 1060 Q300 1020 540 1060 T1080 1050 L1080 1920 L0 1920 Z" fill="#6cbc5a" ${S(6)}/><path d="M0 1220 Q500 1170 1080 1210 L1080 1920 L0 1920 Z" fill="#58a84c"/>`;
  b += `<ellipse cx="540" cy="1230" rx="400" ry="92" fill="url(#lake2)" ${S(6)}/>`;
  b += `<g opacity="0.45"><path d="M380 1170 L540 1290 L566 1300 L580 1290 L720 1170 Z" fill="#5a6078"/><path d="M520 1268 L546 1292 L572 1270 Z" fill="#ffffff"/></g>`;
  for (let k = 0; k < 6; k++) b += `<path d="M${330 + k * 70 + (t * 20 + k * 13) % 30} ${1180 + k * 16} l40 0" stroke="#cfe6ff" stroke-width="3" opacity="0.7"/>`;
  // boulders, wooden fence, wildflowers, grass
  for (const [x, y, s] of [[150, 1300, 1], [930, 1320, 1.2], [260, 1420, 0.8]]) b += `<path d="M${x - 40 * s} ${y} Q${x - 30 * s} ${y - 40 * s} ${x} ${y - 44 * s} Q${x + 40 * s} ${y - 36 * s} ${x + 46 * s} ${y} Z" fill="#8a8f9e" ${S(4)}/>`;
  for (let k = 0; k < 9; k++) { const x = 40 + k * 70; b += `<rect x="${x}" y="1480" width="10" height="70" fill="#8a5a3a" ${S(2.5)}/>`; } b += `<path d="M30 1500 L640 1500 M30 1530 L640 1530" stroke="#8a5a3a" stroke-width="7"/><path d="M30 1500 L640 1500 M30 1530 L640 1530" stroke="${INK}" stroke-width="1"/>`;
  for (let i = 0; i < 220; i++) { const x = r(i + 2100) * 1080, y = 1340 + Math.pow(r(i + 2200), 0.8) * 560, c = ['#ffffff', '#ffd24a', '#c070ff', '#ff5c8a', '#5aa0ff'][i % 5]; b += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + (y - 1340) / 140).toFixed(1)}" fill="${c}"/>`; }
  b += grass(0, 1080, 1340, 260, 33, '#3f8a3a');
  // Zermatt village on the right slope: dark larch chalets, stone roofs, geraniums, church with white steeple
  const chalet = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-50" y="-60" width="100" height="70" fill="#6a3f22" ${S(4)}/><rect x="-50" y="-10" width="100" height="20" fill="#cfc7b8" ${S(3)}/><path d="M-64 -56 L0 -100 L64 -56 Z" fill="#7d8291" ${S(4)}/>` +
    [-28, 4].map(wx => `<rect x="${wx}" y="-48" width="22" height="20" fill="#ffe9a0" ${S(2)}/><rect x="${wx - 3}" y="-28" width="28" height="7" fill="#7a3a22"/>` + flowerBed(wx - 2, -30, wx + 24, -30, 6, wx + 80, ['#e02a3a', '#ff4a5a'])).join('') + `</g>`;
  b += chalet(780, 1150, 0.9) + chalet(900, 1110, 0.75) + chalet(990, 1170, 0.85) + chalet(860, 1220, 1);
  b += `<g transform="translate(700 1140)"><rect x="-26" y="-70" width="52" height="80" fill="#f2efe8" ${S(4)}/><rect x="-14" y="-150" width="28" height="80" fill="#f2efe8" ${S(4)}/><path d="M-18 -150 L0 -210 L18 -150 Z" fill="#5a5f70" ${S(3)}/><circle cx="0" cy="-118" r="8" fill="#ffd24a" ${S(2)}/></g>`;
  // Gornergrat cog train on its line (moves), cable-car gondola on its wire (moves)
  const u = (t * 0.06) % 1; b += `<path d="M120 1060 Q420 980 760 1000" ${thin('#4a3a2a', 4)}/><g transform="translate(${120 + 640 * u} ${1060 - 70 * Math.sin(Math.PI * u) - 20 * u})"><rect x="-44" y="-26" width="88" height="28" rx="6" fill="#d22f48" ${S(3)}/><rect x="-36" y="-20" width="20" height="12" fill="#cfe6ff"/><rect x="-8" y="-20" width="20" height="12" fill="#cfe6ff"/><rect x="20" y="-20" width="14" height="12" fill="#cfe6ff"/></g>`;
  const g = (t * 0.05) % 1; b += `<line x1="0" y1="560" x2="1080" y2="760" stroke="${INK}" stroke-width="2.5"/><g transform="translate(${1080 * g} ${560 + 200 * g})"><line x1="0" y1="0" x2="0" y2="26" stroke="${INK}" stroke-width="3"/><rect x="-24" y="26" width="48" height="36" rx="8" fill="#e8c23a" ${S(3)}/><rect x="-18" y="32" width="36" height="14" fill="#cfe6ff"/></g>`;
  // cows with bells, a hiker couple, a paraglider, birds
  const cow = (x, y, s, f) => `<g transform="translate(${x} ${y}) scale(${s * f} ${s})"><ellipse rx="40" ry="22" fill="#fbfaf4" ${S(3)}/><ellipse cx="-10" cy="-4" rx="14" ry="10" fill="#5a3a2a"/><ellipse cx="44" cy="-12" rx="14" ry="12" fill="#fbfaf4" ${S(3)}/><circle cx="48" cy="-12" r="2.5" fill="${INK}"/>` + [-26, -10, 14, 28].map(lx => `<line x1="${lx}" y1="18" x2="${lx}" y2="40" stroke="${INK}" stroke-width="5"/>`).join('') + `<circle cx="40" cy="6" r="5" fill="#e0b030" ${S(1.5)}/></g>`;
  b += cow(200, 1620, 1, 1) + cow(820, 1700, 1.15, -1) + cow(560, 1560, 0.7, 1);
  b += crowd([[380, 1600], [410, 1605]], 1.1, 900, ['#d22f48', '#3a5aa8', '#ff9a1a']);
  const pg = t * 25 % 1200; b += `<g transform="translate(${-80 + pg} ${560 + Math.sin(t) * 20})"><path d="M-50 0 Q0 -30 50 0 Q0 -14 -50 0 Z" fill="#ff5c8a" ${S(2.5)}/><line x1="-40" y1="0" x2="0" y2="40" stroke="${INK}" stroke-width="1.5"/><line x1="40" y1="0" x2="0" y2="40" stroke="${INK}" stroke-width="1.5"/><circle cx="0" cy="44" r="5" fill="#3a5aa8"/></g>`;
  b += birds(t, 5, 100, 520, 600, 150, 55);
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// ======================= DUBAI: Burj Khalifa over the Dubai Fountain, evening =======================
// Burj: Y-plan, stepped setbacks spiralling up (we draw the facade tiers with alternating wing setbacks), silver glass
// with vertical fins, a long needle spire; at its foot the Burj Lake with the Dubai Fountain jets (animated), the
// Souk Al Bahar arabesque arcade, the Address hotel-style tower, palm trees, boardwalk with lanterns and people.
function dubaiHD(t = 0, o = {}) {
  const defs = HALO + lin('dubSky2', [[0, '#1c1450'], [0.45, '#6a2f7a'], [0.75, '#d2577a'], [1, '#ffb36a']]) + lin('glass', [[0, '#c9d8ea'], [1, '#7f97b8']], 1, 0) + lin('lakeD', [[0, '#2a3a7a'], [1, '#141c48']]);
  let b = `<rect width="1080" height="1920" fill="url(#dubSky2)"/>` + stars(t, 40, 560, 61) + `<circle cx="200" cy="1020" r="110" fill="#ffd38a" opacity="0.9"/><circle cx="200" cy="1020" r="200" fill="#ffd38a" opacity="0.2"/>`;
  // skyline left and right with lit windows and rooftop aircraft lights
  const tower = (x, w, h, col, seed, crown) => { let s = `<rect x="${x}" y="${1220 - h}" width="${w}" height="${h}" fill="${col}" ${S(4)}/>`; for (let y = 1220 - h + 16; y < 1210; y += 18) for (let xx = x + 8; xx < x + w - 8; xx += 14) if (r(seed + xx * 3 + y) > 0.45) s += `<rect x="${xx}" y="${y}" width="7" height="9" fill="#ffd98a" opacity="0.85"/>`;
    if (crown) s += `<path d="M${x} ${1220 - h} L${x + w / 2} ${1220 - h - 60} L${x + w} ${1220 - h} Z" fill="${col}" ${S(4)}/>`; return s + `<circle cx="${x + w / 2}" cy="${1220 - h - (crown ? 64 : 6)}" r="4" fill="#ff4a4a" opacity="${(0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + x))).toFixed(2)}"/>`; };
  b += tower(10, 110, 420, '#3a2f5c', 1, 1) + tower(130, 80, 330, '#4a3a6a', 2) + tower(220, 70, 500, '#2f2a50', 3) + tower(780, 90, 460, '#3a2f5c', 4, 1) + tower(880, 120, 380, '#4a3a6a', 5) + tower(1000, 80, 520, '#2f2a50', 6);
  // BURJ KHALIFA: tiers, wings, fins, spire
  const cx = 540; let y = 1220, w = 230;
  const tiers = [[230, 150], [204, 140], [180, 132], [158, 124], [136, 116], [116, 108], [96, 100], [78, 92], [60, 86], [44, 80]];
  tiers.forEach(([ww, hh], i) => { const off = (i % 3 - 1) * 6;
    b += `<path d="M${cx - ww / 2 + off} ${y} L${cx - ww / 2 + off + 4} ${y - hh} L${cx + ww / 2 + off - 4} ${y - hh} L${cx + ww / 2 + off} ${y} Z" fill="url(#glass)" ${S(4)}/>`;
    b += `<path d="M${cx + off + 8} ${y} L${cx + off + 8} ${y - hh} L${cx + ww / 2 + off - 4} ${y - hh} L${cx + ww / 2 + off} ${y} Z" fill="#6f86a8" opacity="0.7"/>`;
    for (let fx = cx - ww / 2 + off + 10; fx < cx + ww / 2 + off - 6; fx += 12) b += `<line x1="${fx}" y1="${y - 4}" x2="${fx}" y2="${y - hh + 4}" stroke="#e6eef8" stroke-width="1.4" opacity="0.8"/>`;
    for (let yy = y - 14; yy > y - hh; yy -= 16) if (r(i * 31 + yy) > 0.55) b += `<rect x="${cx - ww / 2 + off + 12 + r(yy + i) * (ww - 40)}" y="${yy}" width="10" height="7" fill="#fff2b0" opacity="0.9"/>`;
    b += `<rect x="${cx - ww / 2 + off - 4}" y="${y - hh - 6}" width="${ww + 8}" height="8" fill="#e6eef8" ${S(2)}/>`; y -= hh; });
  b += `<path d="M${cx - 16} ${y} L${cx - 5} ${y - 300} L${cx + 5} ${y - 300} L${cx + 16} ${y} Z" fill="#dbe6f2" ${S(4)}/>` + [60, 140, 220].map(k => `<line x1="${cx - 12 + k * 0.03}" y1="${y - k}" x2="${cx + 12 - k * 0.03}" y2="${y - k}" stroke="${INK}" stroke-width="2"/>`).join('');
  b += `<circle cx="${cx}" cy="${y - 300}" r="7" fill="#ff4a4a" opacity="${(0.5 + 0.5 * Math.sin(t * 4)).toFixed(2)}"/>`;
  // Souk Al Bahar style arcade (left) and boardwalk with lanterns
  b += `<rect x="0" y="1170" width="400" height="80" fill="#d9a870" ${S(5)}/>`; for (let k = 0; k < 9; k++) b += `<path d="M${18 + k * 42} 1250 L${18 + k * 42} 1205 Q${36 + k * 42} 1180 ${54 + k * 42} 1205 L${54 + k * 42} 1250 Z" fill="#7a4a2a" ${S(2.5)}/><circle cx="${36 + k * 42}" cy="1222" r="5" fill="#ffd56a"/>`;
  b += `<path d="M0 1170 ${Array.from({ length: 20 }, (_, k) => `L${k * 20 + 10} 1160 L${k * 20 + 20} 1170`).join(' ')}" fill="#e8c08a" ${S(2)}/>`;
  // Burj Lake with the Dubai Fountain (jets rise and fall, swaying)
  b += `<rect x="0" y="1250" width="1080" height="330" fill="url(#lakeD)" ${S(5)}/>`;
  for (let k = 0; k < 13; k++) { const x = 120 + k * 70, h = 120 + 260 * Math.abs(Math.sin(t * 1.6 + k * 0.5)), sw = Math.sin(t * 1.2 + k) * 30;
    b += `<path d="M${x} 1330 Q${x + sw * 0.5} ${1330 - h * 0.6} ${x + sw} ${1330 - h}" stroke="#eaf4ff" stroke-width="${7 + 3 * Math.sin(k)}" fill="none" opacity="0.85" stroke-linecap="round"/><circle cx="${x + sw}" cy="${1330 - h}" r="12" fill="#ffffff" opacity="0.5"/>`; }
  for (let k = 0; k < 10; k++) b += `<path d="M${60 + k * 100 + (t * 15) % 40} ${1380 + (k % 3) * 50} l50 0" stroke="#6a7ac8" stroke-width="3" opacity="0.6"/>`;
  // reflection of the Burj in the lake
  for (let k = 0; k < 12; k++) b += `<rect x="${cx - 30 + Math.sin(t * 3 + k) * 6}" y="${1262 + k * 22}" width="60" height="8" rx="4" fill="#c9d8ea" opacity="${(0.3 - k * 0.02).toFixed(2)}"/>`;   // broken reflection
  // promenade: date palms, lanterns, people, an abra boat
  b += `<rect x="0" y="1580" width="1080" height="340" fill="#e2c08a"/><path d="M0 1580 L1080 1580" stroke="${INK}" stroke-width="5"/>`;
  for (let k = 0; k < 12; k++) b += `<rect x="${k * 92}" y="1580" width="92" height="340" fill="none" stroke="#c9a46e" stroke-width="2"/>`;
  const palm = (x, y, s) => { let p = `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 0 Q-12 -110 0 -200 L8 -200 Q-2 -110 6 0 Z" fill="#8a5a3a" ${S(3)}/>`; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.45, sway = Math.sin(t * 1.5 + k) * 0.05;
      p += `<path d="M2 -200 Q${Math.cos(a + sway) * 70} ${-200 + Math.sin(a + sway) * 50 - 20} ${Math.cos(a + sway) * 120} ${-200 + Math.sin(a + sway) * 40 + 40}" stroke="#2a7a3a" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M2 -200 Q${Math.cos(a + sway) * 70} ${-200 + Math.sin(a + sway) * 50 - 20} ${Math.cos(a + sway) * 120} ${-200 + Math.sin(a + sway) * 40 + 40}" stroke="#3a9a4a" stroke-width="8" fill="none" stroke-linecap="round"/>`; }
    return p + '</g>'; };
  b += palm(80, 1640, 1.1) + palm(1000, 1660, 1.2) + palm(300, 1600, 0.7) + palm(780, 1600, 0.75);
  for (let k = 0; k < 6; k++) { const x = 150 + k * 160; b += `<line x1="${x}" y1="1600" x2="${x}" y2="1520" stroke="${INK}" stroke-width="4"/><path d="M${x - 12} 1520 L${x + 12} 1520 L${x + 8} 1490 L${x - 8} 1490 Z" fill="#ffcf6a" ${S(2.5)}/><circle cx="${x}" cy="1505" r="22" fill="#ffcf6a" opacity="0.3"/>`; }
  b += crowd([[220, 1700], [250, 1705], [460, 1680], [480, 1690], [640, 1720], [700, 1700], [860, 1740]], 1.5, 1200);
  const ab = (t * 30) % 1300 - 110; b += `<g transform="translate(${ab} 1500)"><path d="M-60 0 L60 0 L48 18 L-48 18 Z" fill="#8a5a3a" ${S(3)}/><rect x="-40" y="-26" width="80" height="6" fill="#d9a870" ${S(2)}/><line x1="-36" y1="-20" x2="-36" y2="0" stroke="${INK}" stroke-width="3"/><line x1="36" y1="-20" x2="36" y2="0" stroke="${INK}" stroke-width="3"/></g>`;
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// ======================= NEW YORK (office beat): Midtown at night =======================
// Empire State Building: setback tiers, the mooring mast and needle, lit top bands; Chrysler Building: stacked stainless
// sunburst arches with triangular windows and a spire; brick buildings with fire escapes and water towers; yellow cabs,
// a hot-dog cart, steam from a street vent, traffic lights, pedestrians.
function nycHD(t = 0, o = {}) {
  const defs = HALO + lin('nySky', [[0, '#0b0f2e'], [0.6, '#27306a'], [1, '#5a3f7a']]);
  let b = `<rect width="1080" height="1920" fill="url(#nySky)"/>` + stars(t, 50, 600, 41) + `<circle cx="160" cy="300" r="56" fill="#fff3cf"/>`;
  // far skyline silhouettes
  for (let k = 0; k < 18; k++) { const x = k * 62, h = 300 + r(k + 5) * 380; b += `<rect x="${x}" y="${1150 - h}" width="56" height="${h}" fill="#20234a"/>`; for (let yy = 1150 - h + 14; yy < 1140; yy += 22) if (r(k * 17 + yy) > 0.5) b += `<rect x="${x + 10 + r(yy + k) * 30}" y="${yy}" width="6" height="8" fill="#ffd98a" opacity="0.6"/>`; }
  // Chrysler Building (left of centre): body, terraced crown of sunburst arches, spire
  { const x = 300, w = 120, bt = 1180, h = 560, tp = bt - h; b += `<rect x="${x - w / 2}" y="${tp}" width="${w}" height="${h}" fill="#5a6488" ${S(5)}/>`;
    for (let yy = tp + 20; yy < bt - 10; yy += 20) for (let xx = x - w / 2 + 10; xx < x + w / 2 - 10; xx += 14) if (r(xx + yy) > 0.4) b += `<rect x="${xx}" y="${yy}" width="7" height="10" fill="#ffd98a" opacity="0.8"/>`;
    for (let k = 0; k < 6; k++) { const ww = 100 - k * 15, yy = tp - k * 34; b += `<path d="M${x - ww / 2} ${yy} Q${x} ${yy - 46} ${x + ww / 2} ${yy} Z" fill="#c9d2e2" ${S(4)}/>` + [-1, 0, 1].map(j => `<path d="M${x + j * ww * 0.25 - 5} ${yy - 4} L${x + j * ww * 0.25} ${yy - 18} L${x + j * ww * 0.25 + 5} ${yy - 4} Z" fill="#fff2b0"/>`).join(''); }
    b += `<path d="M${x - 6} ${tp - 200} L${x} ${tp - 330} L${x + 6} ${tp - 200} Z" fill="#dbe2ee" ${S(3)}/>`; }
  // Empire State Building (right of centre): setbacks, lit top bands, mast, antenna
  { const x = 760; let y = 1180; const tiers = [[220, 260], [170, 220], [130, 160], [96, 80], [70, 60]]; tiers.forEach(([w, h], i) => { b += `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="#8a8aa0" ${S(5)}/><rect x="${x + 6}" y="${y - h}" width="${w / 2 - 6}" height="${h}" fill="#6f6f88"/>`;
      for (let xx = x - w / 2 + 8; xx < x + w / 2 - 6; xx += 10) b += `<line x1="${xx}" y1="${y - 4}" x2="${xx}" y2="${y - h + 4}" stroke="#4a4a62" stroke-width="1.5"/>`; for (let yy = y - 12; yy > y - h; yy -= 14) if (r(i * 7 + yy) > 0.5) b += `<rect x="${x - w / 2 + 10 + r(yy) * (w - 30)}" y="${yy}" width="7" height="8" fill="#ffd98a"/>`;
      if (i >= 3) b += `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="${['#ff5c8a', '#ffffff', '#5aa0ff'][Math.floor(t / 2) % 3]}" opacity="0.35"/>`; y -= h; });
    b += `<rect x="${x - 18}" y="${y - 90}" width="36" height="90" fill="#c9d2e2" ${S(4)}/><path d="M${x - 24} ${y - 90} L${x} ${y - 140} L${x + 24} ${y - 90} Z" fill="#c9d2e2" ${S(4)}/><line x1="${x}" y1="${y - 140}" x2="${x}" y2="${y - 300}" stroke="${INK}" stroke-width="5"/><circle cx="${x}" cy="${y - 300}" r="6" fill="#ff4a4a" opacity="${(0.5 + 0.5 * Math.sin(t * 4)).toFixed(2)}"/>`; }
  // near brick buildings with fire escapes and water towers on both edges
  for (const [x, w] of [[-10, 200], [890, 200]]) { b += `<rect x="${x}" y="880" width="${w}" height="420" fill="#8a4a3a" ${S(5)}/>`;
    for (let row = 0; row < 5; row++) for (let k = 0; k < 3; k++) { const wx = x + 24 + k * 58, wy = 910 + row * 76; b += `<rect x="${wx}" y="${wy}" width="34" height="46" fill="${r(row * 3 + k + x) > 0.4 ? '#ffd98a' : '#2a2a3a'}" ${S(2.5)}/>`; }
    for (let row = 0; row < 5; row++) b += `<rect x="${x + 20}" y="${950 + row * 76}" width="${w - 40}" height="6" fill="#2a2a2a"/>` + Array.from({ length: 6 }, (_, k) => `<line x1="${x + 24 + k * 30}" y1="${950 + row * 76}" x2="${x + 24 + k * 30}" y2="${936 + row * 76}" stroke="#2a2a2a" stroke-width="2"/>`).join('') + `<line x1="${x + 30}" y1="${956 + row * 76}" x2="${x + 60}" y2="${1026 + row * 76}" stroke="#2a2a2a" stroke-width="3"/>`;
    b += `<g transform="translate(${x + w / 2} 880)"><rect x="-30" y="-70" width="60" height="56" fill="#8a5a3a" ${S(3)}/><path d="M-34 -70 L0 -100 L34 -70 Z" fill="#6a4a3a" ${S(3)}/>${[-24, 24].map(lx => `<line x1="${lx}" y1="-14" x2="${lx}" y2="0" stroke="${INK}" stroke-width="3"/>`).join('')}</g>`; }
  // street: sidewalk, road with lane marks, yellow cabs (move), hot-dog cart with umbrella, steam vent, traffic light, people
  b += `<rect x="0" y="1300" width="1080" height="80" fill="#8a8a98" ${S(4)}/><rect x="0" y="1380" width="1080" height="540" fill="#2a2a36"/>`;
  for (let k = 0; k < 9; k++) b += `<rect x="${k * 130 + 20}" y="1560" width="70" height="10" fill="#e0c050"/>`;
  for (let k = 0; k < 8; k++) b += `<rect x="${280 + k * 60}" y="1390" width="40" height="150" fill="#e8e8f0" opacity="0.85"/>`;   // zebra crossing
  const cab = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-80 0 L-80 -30 L-50 -34 L-30 -60 L40 -60 L60 -34 L80 -30 L80 0 Z" fill="#f2c21a" ${S(4)}/><rect x="-24" y="-54" width="28" height="18" fill="#cfe6ff"/><rect x="10" y="-54" width="28" height="18" fill="#cfe6ff"/><rect x="-10" y="-74" width="24" height="12" fill="#ffffff" ${S(2)}/><circle cx="-48" cy="2" r="16" fill="${INK}"/><circle cx="48" cy="2" r="16" fill="${INK}"/><rect x="-80" y="-22" width="160" height="6" fill="${INK}"/><circle cx="78" cy="-20" r="6" fill="#fff6c0"/></g>`;
  b += cab(((t * 220) % 1500) - 200, 1660, 1.2) + cab(1300 - ((t * 160 + 600) % 1500), 1800, 1.5);
  b += `<g transform="translate(860 1360)"><rect x="-60" y="-50" width="120" height="50" fill="#d9d9e2" ${S(3)}/><path d="M-90 -110 Q0 -150 90 -110 Z" fill="#2a6ab0" ${S(3)}/><line x1="0" y1="-110" x2="0" y2="-50" stroke="${INK}" stroke-width="3"/><circle cx="-36" cy="6" r="10" fill="${INK}"/><circle cx="36" cy="6" r="10" fill="${INK}"/></g>`;
  for (let k = 0; k < 4; k++) { const u = (t * 0.6 + k / 4) % 1; b += `<circle cx="${560 + Math.sin(u * 6 + k) * 20}" cy="${1600 - u * 260}" r="${20 + u * 40}" fill="#e8e6f0" opacity="${(0.5 * (1 - u)).toFixed(2)}"/>`; }
  b += `<g transform="translate(150 1300)"><rect x="-4" y="-200" width="8" height="200" fill="#2a3a2a"/><rect x="-16" y="-260" width="32" height="70" rx="6" fill="#2a3a2a" ${S(3)}/><circle cx="0" cy="-246" r="8" fill="${t % 4 < 2 ? '#ff3a3a' : '#552020'}"/><circle cx="0" cy="-224" r="8" fill="#553a10"/><circle cx="0" cy="-202" r="8" fill="${t % 4 >= 2 ? '#3aff6a' : '#103a20'}"/></g>`;
  b += crowd([[230, 1345], [330, 1350], [420, 1340], [610, 1352], [700, 1346], [980, 1350]], 1.2, 1400, ['#d22f48', '#2a3a6a', '#f2ead8', '#ff9a1a', '#3a8a7a'], 2);
  return { defs, back: b + dimRect(o.dim), front: '' };
}

// ======================= VARANASI GHATS at dusk (family + remedies) =======================
// Dashashwamedh-style ghat: wide stone steps down to the Ganga, ghat buildings with chhatri balconies, temple shikharas
// with saffron flags, big cane umbrellas over wooden platforms, priests' aarti platforms with brass lamps, bells,
// marigold garlands, wooden boats with boatmen, floating leaf-diyas on the river, pigeons, a cow, people.
function varanasiHD(t = 0, o = {}) {
  const g = o.gold || 0;
  const defs = HALO + lin('vSky', [[0, '#26185a'], [0.5, '#8a3a6a'], [0.85, '#ff8a4a'], [1, '#ffc07a']]) + lin('ganga', [[0, '#5a3a6a'], [1, '#1f1a40']]);
  let b = `<rect width="1080" height="1920" fill="url(#vSky)"/>` + stars(t, 25, 420, 121) + `<circle cx="820" cy="760" r="90" fill="#ffd27a" opacity="0.9"/><circle cx="540" cy="900" r="${460 + 80 * g}" fill="url(#halo)" opacity="${(0.25 + 0.35 * g).toFixed(2)}"/>`;
  // ghat buildings: tall facades with arched windows, jharokha balconies, chhatris, and two temple shikharas with flags
  const fac = [[0, 180, 470, '#d9a070'], [170, 150, 390, '#e0b080'], [320, 160, 520, '#c98a5a'], [600, 170, 440, '#e3b48a'], [760, 150, 560, '#d29a6a'], [900, 180, 420, '#e0a878']];
  for (const [x, w, h, c] of fac) { const y = 1180 - h; b += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" ${S(5)}/><rect x="${x + w * 0.55}" y="${y}" width="${w * 0.45}" height="${h}" fill="#000" opacity="0.08"/>`;
    for (let row = 0; row < Math.floor(h / 90); row++) for (let k = 0; k < Math.floor(w / 50); k++) { const wx = x + 14 + k * 50, wy = y + 30 + row * 90; b += `<path d="M${wx} ${wy + 50} L${wx} ${wy + 16} Q${wx + 15} ${wy} ${wx + 30} ${wy + 16} L${wx + 30} ${wy + 50} Z" fill="${r(x + row * 5 + k) > 0.5 ? '#ffd56a' : '#5a3a2a'}" ${S(2.5)}/>`; }
    b += `<rect x="${x + w / 2 - 34}" y="${y + 120}" width="68" height="40" fill="${c}" ${S(3)}/><path d="M${x + w / 2 - 40} ${y + 120} Q${x + w / 2} ${y + 94} ${x + w / 2 + 40} ${y + 120} Z" fill="#b8704a" ${S(3)}/>`;   // jharokha
    b += `<g transform="translate(${x + w - 30} ${y})"><rect x="-18" y="-40" width="36" height="40" fill="${c}" ${S(3)}/><path d="M-24 -40 Q0 -70 24 -40 Z" fill="#e0b450" ${S(3)}/></g>`; }
  for (const [x, h] of [[480, 560], [860, 470]]) { const y = 1180 - h; b += `<path d="M${x - 70} ${y + 80} C${x - 64} ${y - 40} ${x - 30} ${y - 120} ${x} ${y - 150} C${x + 30} ${y - 120} ${x + 64} ${y - 40} ${x + 70} ${y + 80} Z" fill="#e8b070" ${S(5)}/>`;
    for (let k = 1; k < 6; k++) b += `<path d="M${x - 70 + k * 6} ${y + 80 - k * 40} Q${x} ${y + 70 - k * 40} ${x + 70 - k * 6} ${y + 80 - k * 40}" ${thin('#b8704a', 3)}/>`;
    const wv = Math.sin(t * 5 + x) * 8; b += `<line x1="${x}" y1="${y - 150}" x2="${x}" y2="${y - 240}" stroke="${INK}" stroke-width="4"/><path d="M${x} ${y - 240} Q${x + 40} ${y - 230 + wv} ${x + 80} ${y - 220} L${x} ${y - 200} Z" fill="#ff8a1a" ${S(3)}/>`; }
  // marigold garlands strung across, small bells
  for (const [x0, x1, y0] of [[60, 420, 820], [620, 1020, 760]]) { let d = `M${x0} ${y0}`; for (let k = 0; k <= 10; k++) d += ` L${x0 + (x1 - x0) * k / 10} ${y0 + 40 * Math.sin(Math.PI * k / 10)}`; b += `<path d="${d}" stroke="#ff9a1a" stroke-width="10" fill="none" stroke-dasharray="6 3"/>`; }
  // the steps (ghat) descending to the river, cane umbrellas over wooden platforms, aarti priests with lamps
  for (let k = 0; k < 10; k++) b += `<rect x="0" y="${1180 + k * 26}" width="1080" height="26" fill="${k % 2 ? '#c9a07a' : '#b88c66'}" stroke="#7a5a40" stroke-width="2"/>`;
  const umb = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><line x1="0" y1="0" x2="0" y2="-120" stroke="#6a4a2a" stroke-width="6"/><path d="M-110 -110 Q0 -190 110 -110 Z" fill="#e0c088" ${S(4)}/>${[-80, -40, 0, 40, 80].map(k => `<line x1="0" y1="-160" x2="${k * 1.3}" y2="-112" stroke="#a07a4a" stroke-width="2.5"/>`).join('')}<rect x="-90" y="0" width="180" height="20" fill="#8a5a3a" ${S(3)}/></g>`;
  b += umb(150, 1300, 0.9) + umb(930, 1310, 0.95) + umb(520, 1260, 0.6);
  for (const x of [330, 690]) { b += `<rect x="${x - 60}" y="1330" width="120" height="30" fill="#7a4a2a" ${S(3)}/>`; const sw = Math.sin(t * 2.2 + x) * 40;
    b += person(x, 1330, 1.6, x, ['#ff8a1a'], 1) + `<g transform="translate(${x + 18 + sw * 0.3} ${1268 + Math.cos(t * 2.2 + x) * 10})"><path d="M-14 0 L14 0 L10 10 L-10 10 Z" fill="#e0b030" ${S(2)}/>${[-10, -4, 2, 8].map(k => `<path d="M${k} 0 q-3 -10 2 -16 q4 8 0 16" fill="#ffd24a"/>`).join('')}<circle cx="0" cy="-8" r="${20 + 4 * Math.sin(t * 9)}" fill="#ffd27a" opacity="0.35"/></g>`; }
  // brass bells on a pole
  b += `<line x1="430" y1="1300" x2="430" y2="1180" stroke="#6a4a2a" stroke-width="5"/>` + [0, 1, 2].map(k => `<path d="M${420 + k * 10} ${1196 + k * 14} q6 -14 12 0 Z" fill="#e0b030" ${S(1.5)}/>`).join('');
  // pilgrims sitting on the steps, a cow, pigeons
  b += crowd([[60, 1260], [100, 1262], [230, 1290], [600, 1240], [780, 1270], [820, 1272], [1010, 1250], [470, 1340]], 1.2, 1600, ['#ff8a1a', '#d22f48', '#ffd24a', '#7a2f8a', '#2f8a7a', '#f2ead8']);
  b += `<g transform="translate(250 1240) scale(-0.9 0.9)"><ellipse rx="40" ry="22" fill="#f6efe2" ${S(3)}/><ellipse cx="44" cy="-12" rx="14" ry="12" fill="#f6efe2" ${S(3)}/><path d="M50 -24 q8 -8 14 -2" stroke="${INK}" stroke-width="3" fill="none"/>${[-26, -10, 14, 28].map(lx => `<line x1="${lx}" y1="18" x2="${lx}" y2="38" stroke="${INK}" stroke-width="5"/>`).join('')}<circle cx="40" cy="6" r="4" fill="#e0b030"/></g>`;
  b += birds(t, 9, 100, 880, 880, 160, 99, '#3a2a4a');
  // the Ganga: water, reflected lamp glow, wooden boats with boatmen (drift), floating leaf diyas (drift, flicker)
  b += `<rect x="0" y="1440" width="1080" height="480" fill="url(#ganga)"/><path d="M0 1440 L1080 1440" stroke="${INK}" stroke-width="5"/>`;
  for (let k = 0; k < 14; k++) b += `<path d="M${(k * 83 + t * 12) % 1100 - 20} ${1470 + (k % 5) * 80} l60 0" stroke="#ffb35a" stroke-width="3" opacity="0.45"/>`;
  const boat = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-120 0 Q0 30 120 0 L100 -24 L-100 -24 Z" fill="#7a4a2a" ${S(4)}/><rect x="-100" y="-30" width="200" height="8" fill="#a06a3a" ${S(2)}/>${person(60, -26, 1.3, 77, ['#f2ead8'], 1)}<line x1="80" y1="-60" x2="140" y2="20" stroke="#6a4a2a" stroke-width="5"/></g>`;
  b += boat(((t * 18) % 1400) - 200, 1560, 0.9) + boat(1200 - ((t * 12 + 500) % 1400), 1760, 1.15);
  for (let i = 0; i < 18; i++) { const x = ((r(i + 700) * 1080 + t * (6 + 6 * r(i))) % 1100) - 10, y = 1480 + r(i + 710) * 420, f = 0.6 + 0.4 * Math.sin(t * 8 + i);
    b += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="12" ry="5" fill="#3a8a3a" ${S(1.5)}/><path d="M${x.toFixed(0)} ${y - 2} q-3 -8 0 -13 q3 5 0 13" fill="#ffd24a" opacity="${f.toFixed(2)}"/><circle cx="${x.toFixed(0)}" cy="${y - 8}" r="${10 * f}" fill="#ffd27a" opacity="0.3"/>`; }
  return { defs, back: b + dimRect(o.dim), front: '' };
}
module.exports = { taj: tajHD, eiffel: eiffelHD, alps: alpsHD, dubai: dubaiHD, nyc: nycHD, varanasi: varanasiHD, tajBase: taj, eiffelBase: eiffel };
