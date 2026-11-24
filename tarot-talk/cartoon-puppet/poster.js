// Silkscreen travel-poster theme (owner-approved 24 Nov 2026, HOW_WE_WORK Gate 1). Shared by every mol-bhaav rashi reel.
// One locked scene per rashi (owner: "No theme scene change for aries. Lock per rashi").
// Pieces: the hill-road plate, the spark portal, Vishnu ji's portal flight, keyframed arms, poster cards.
const E = require('./engine');
const { clamp, ease, backOut } = E;
const INK = '#2a1418';
const sm = u => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u, L2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const T = (x, y, str, size, fill = INK, anchor = 'middle', font = 'DejaVu Serif, Georgia, serif') =>
  `<text x="${x}" y="${y}" font-family="${font}" font-weight="700" font-size="${size}" text-anchor="${anchor}" fill="${fill}">${str}</text>`;
const TS = (x, y, str, size, fill = INK, anchor = 'middle') => T(x, y, str, size, fill, anchor, 'DejaVu Sans, Arial, sans-serif');

// ---------- the Aries plate: silkscreen hill road (flat inks, stepped sky bands, sun rings, lit/shade faces) ----------
function plateAries(o = {}) {
  let w = ['#e8873a', '#ee9a45', '#f2ad52', '#f4c066', '#f6d27e', '#f8dc92'].map((c, i) => `<rect y="${i * 140}" width="1080" height="${i === 5 ? 400 : 142}" fill="${c}"/>`).join('');
  if (o.sun !== false) w += [170, 134, 100].map((r, i) => `<circle cx="790" cy="560" r="${r}" fill="${['#f6d27e', '#f9e2a2', '#fdf0c8'][i]}"/>`).join('');
  w += `<path d="M0 900 L150 760 L250 830 L400 650 L520 780 L660 640 L780 760 L900 670 L1080 800 L1080 1060 L0 1060 Z" fill="#6f5a8a"/><path d="M400 650 L450 720 L520 780 L400 720 Z M660 640 L700 690 L780 760 L660 700 Z" fill="#f4e6c8"/>`;
  w += `<path d="M0 990 Q300 900 560 970 T1080 950 L1080 1200 L0 1200 Z" fill="#2f7a5a"/><path d="M0 1060 Q330 990 640 1060 T1080 1030 L1080 1220 L0 1220 Z" fill="#245f47"/>`;
  w += `<path d="M0 1150 Q450 1080 1080 1140 L1080 1920 L0 1920 Z" fill="#e0a64a"/><path d="M0 1560 Q500 1500 1080 1570 L1080 1920 L0 1920 Z" fill="#c98f3a"/>`;
  // road: comes in from the left behind the trees and turns down toward the viewer on the left half (grass verge on the right)
  w += `<path d="M-20 1100 Q180 1108 300 1168 Q385 1220 400 1400 L470 1920 L40 1920 L160 1400 Q150 1290 80 1240 Q30 1200 -20 1180 Z" fill="#8a7f86"/>`;
  w += `<path d="M0 1140 Q160 1148 240 1200 Q288 1245 283 1330 L272 1500 L262 1700 L255 1900" fill="none" stroke="#f4e6c8" stroke-width="10" stroke-dasharray="40 34"/>`;
  for (const [x, y, k] of [[70, 1028, 1.0], [175, 1046, 0.75], [960, 1110, 1.3]]) w += `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-8" y="0" width="16" height="44" fill="#5a3020"/>${[0, 1, 2, 3].map(i => `<path d="M0 ${-150 + i * 38} L${-34 - i * 12} ${-96 + i * 38} L${34 + i * 12} ${-96 + i * 38} Z" fill="${i % 2 ? '#1f4a3a' : '#2f6b50'}"/><path d="M0 ${-150 + i * 38} L${34 + i * 12} ${-96 + i * 38} L0 ${-96 + i * 38} Z" fill="#183a2d"/>`).join('')}</g>`;
  w += `<g transform="translate(820 930) scale(1.2)"><path d="M-34 60 L-22 0 L0 -50 L22 0 L34 60 Z" fill="#fbf3e2" stroke="${INK}" stroke-width="3"/><path d="M0 -50 L22 0 L34 60 L0 60 Z" fill="#e6d7ba"/><path d="M0 -50 L0 -86" stroke="${INK}" stroke-width="3"/><path d="M0 -86 L34 -78 L0 -68 Z" fill="#ff8a1a"/></g>`;
  // km-stone on the verge, right where the ram stops (APRIL: Mangal vakri ends 1 Apr 2027)
  w += `<g transform="translate(500 1205)"><path d="M-70 110 L-70 -20 Q-70 -84 0 -90 Q70 -84 70 -20 L70 110 Z" fill="#fbf7ee" stroke="${INK}" stroke-width="6"/><path d="M-70 -20 Q-70 -84 0 -90 Q70 -84 70 -20 Z" fill="#f2b84b" stroke="${INK}" stroke-width="6"/>${T(0, 30, 'APRIL', 36)}${T(0, 78, '90 din', 30, '#8e1b2c')}</g>`;
  return w;
}

// ---------- spark-ring portal ----------
function portal(t, cx, cy, r) {
  if (r < 2) return '';
  let o = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1d2f7a"/>`;
  for (let i = 0; i < 26; i++) { const a = i * 2.4, rr = (i * 37) % 100 / 100 * r * 0.85; o += `<circle cx="${(cx + Math.cos(a) * rr).toFixed(1)}" cy="${(cy + Math.sin(a) * rr).toFixed(1)}" r="${2 + (i % 3)}" fill="#fff0b0" opacity="${(0.5 + 0.5 * Math.sin(t * 4 + i)).toFixed(2)}"/>`; }
  o += `<circle cx="${cx}" cy="${cy}" r="${r * 0.9}" fill="url(#halo)" opacity="0.45"/>`;
  for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2 + t * 3.2 * (i % 2 ? 1 : 0.8), rr = r * (0.97 + 0.06 * Math.sin(i * 7.3 + t * 9)), L = 20 + 18 * ((i * 13) % 7) / 7;
    const x0 = cx + Math.cos(a) * rr, y0 = cy + Math.sin(a) * rr, x1 = cx + Math.cos(a + L / rr) * rr, y1 = cy + Math.sin(a + L / rr) * rr;
    o += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${i % 3 ? '#ffb02e' : '#ffe27a'}" stroke-width="${i % 4 ? 6 : 9}" stroke-linecap="round"/>`; }
  for (let i = 0; i < 14; i++) { const ph = (t * 1.6 + i / 14) % 1, a = i * 1.37 + t * 3, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, tx = -Math.sin(a), ty = Math.cos(a), d = 30 + 120 * ph;
    o += `<circle cx="${(x + tx * d).toFixed(1)}" cy="${(y + ty * d + 60 * ph * ph).toFixed(1)}" r="${(5 * (1 - ph)).toFixed(1)}" fill="#ffd25a"/>`; }
  return o + `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="#ff8a1a" stroke-width="3" opacity="0.6"/>`;
}

// ---------- keyframed arms: elbow leads, wrist follows 0.08 s later; hand shape switches mid-blend ----------
function armKF(t, keys, blend = 0.35) {
  const at = tt => { let i = 0; for (let k = 1; k < keys.length; k++) if (tt >= keys[k][0]) i = k; const u = i ? sm(clamp((tt - keys[i][0]) / blend)) : 1; return [keys[Math.max(0, i - 1)][1], keys[i][1], u]; };
  const [a, b, u] = at(t), [aw, bw, uw] = at(t - 0.08);
  const o = { ...b, E: L2(a.E, b.E, u), W: L2(aw.W, bw.W, uw), hand: u < 0.5 ? a.hand : b.hand }; if (a.S && b.S) o.S = L2(a.S, b.S, u); return o;
}
const along = (A, k) => Math.atan2(A.W[1] - A.E[1], A.W[0] - A.E[0]) + k * Math.PI / 2;
const fixV = A => ({ ...A, handAng: along(A, A.hand === 'rest' ? -1 : 1) });

// Vishnu ji's arms (seated rig, body coords)
const VS = [690, 945], LS = [392, 950];
const VA = {
  rest: { S: VS, E: [770, 1050], W: [700, 1150], hand: 'rest' }, wave: { S: VS, E: [835, 925], W: [890, 795], hand: 'palm' },
  palm: { S: VS, E: [830, 1010], W: [905, 905], hand: 'palm' }, finger: { S: VS, E: [830, 905], W: [852, 772], hand: 'point' },
  bless: { S: VS, E: [820, 950], W: [880, 860], hand: 'palm' }, point: { S: VS, E: [820, 920], W: [890, 820], hand: 'point' },
  L0: { S: LS, E: [318, 1075], W: [292, 1192] }, Ltrail: { S: LS, E: [300, 1050], W: [250, 1140] }, Lram: { S: LS, E: [268, 1092], W: [172, 1188] },
};
// Sakshi's arms (body coords). Listening = hands loosely joined at the waist; gestures only where the line asks for one.
const KA = {
  rest: { L: { E: [372, 1080], W: [385, 1205], hand: 'relax' }, R: { E: [708, 1080], W: [695, 1205], hand: 'relax' } },
  hold: { L: { E: [415, 1090], W: [515, 1170], hand: 'relax' }, R: { E: [665, 1090], W: [565, 1170], hand: 'relax' } },   // relaxed hands resting together, backs to the viewer
  present: { L: { E: [318, 1040], W: [240, 975], hand: 'palm' }, R: { E: [665, 1090], W: [565, 1170], hand: 'relax' } },   // open palm out (toward Prabhu / the file)
  chest: { L: { E: [415, 1090], W: [515, 1170], hand: 'relax' }, R: { E: [705, 1070], W: [585, 1000], hand: 'palm' } },   // worried hand on chest
  one: { L: { E: [300, 1030], W: [195, 950], hand: 'point' }, R: { E: [665, 1090], W: [565, 1170], hand: 'relax' } },      // "pehli demand": one finger, clear of the face
  shrug: { L: { E: [335, 1070], W: [262, 1015], hand: 'palm' }, R: { E: [745, 1070], W: [818, 1015], hand: 'palm' } },
  cta: { L: { E: [415, 1090], W: [515, 1170], hand: 'relax' }, R: { E: [800, 1010], W: [990, 875], hand: 'point' } },     // points up at the link card above her
};
const kArms = (t, keys) => ({ L: armKF(t, keys.map(([a, k]) => [a, KA[k].L])), R: armKF(t, keys.map(([a, k]) => [a, KA[k].R])) });

// ---------- Vishnu ji's portal entry/exit along a curve (clipped to the ring while still inside it) ----------
function flight(PX, PY) {
  const P0 = [PX, PY + 40], PC = [PX + 150, PY + 130], P1 = [PX + 30, PY + 205];
  const bez = u => [lerp(lerp(P0[0], PC[0], u), lerp(PC[0], P1[0], u), u), lerp(lerp(P0[1], PC[1], u), lerp(PC[1], P1[1], u), u)];
  return { P1, bez };
}

// ---------- poster card (cream paper, ink border, saffron header), pops from its top edge ----------
const CX0 = 590, CW = 352, CY0 = 270;
function card(t, t0, t1, title, inner, h = 420, o = {}) {
  if (t < t0 - 0.01 || t > t1 + 0.15) return '';
  const k = t < t0 + 0.3 ? backOut(clamp((t - t0) / 0.3)) : 1, out = 1 - clamp((t - t1) / 0.15);
  const head = o.head || '#f2b84b', foot = o.foot;
  return `<g opacity="${out.toFixed(2)}" transform="translate(${CX0 + CW / 2} ${CY0}) scale(${k.toFixed(3)}) translate(${-(CX0 + CW / 2)} ${-CY0})">` +
    `<rect x="${CX0 + 8}" y="${CY0 + 10}" width="${CW}" height="${h}" rx="22" fill="#2a1418" opacity="0.25"/>` +
    `<rect x="${CX0}" y="${CY0}" width="${CW}" height="${h}" rx="22" fill="#fbf3e2" stroke="${INK}" stroke-width="6"/>` +
    `<path d="M${CX0} ${CY0 + 22} Q${CX0} ${CY0} ${CX0 + 22} ${CY0} L${CX0 + CW - 22} ${CY0} Q${CX0 + CW} ${CY0} ${CX0 + CW} ${CY0 + 22} L${CX0 + CW} ${CY0 + 74} L${CX0} ${CY0 + 74} Z" fill="${head}" stroke="${INK}" stroke-width="6"/>` +
    TS(CX0 + CW / 2, CY0 + 50, title, Math.min(34, Math.floor((CW - 40) / (title.length * 0.68)))) + inner +
    (foot ? TS(CX0 + CW / 2, CY0 + h - 18, foot, 17, '#6b4a3a') : '') + `</g>`;
}
const stamp = (t, t0, x, y, str, col = '#b3262e', size = 30, rot = -12) => t < t0 ? '' :
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${(1.6 - 0.6 * ease(clamp((t - t0) / 0.18))).toFixed(3)})" opacity="${clamp((t - t0) / 0.08).toFixed(2)}"><rect x="${-str.length * size * 0.36 - 12}" y="${-size * 0.85}" width="${str.length * size * 0.72 + 24}" height="${size * 1.25}" rx="6" fill="none" stroke="${col}" stroke-width="5"/>${TS(0, size * 0.18, str, size, col)}</g>`;


// ---------- Taurus plate (owner, 24 Nov 2026 23:56 IST, Jaipur A "Yes"): HAWA MAHAL across Sireh Deori Bazaar, morning ----------
// Silkscreen technique from Lemo (our own code): stepped sky stripes, off-register ink layers, paper grain/mottle (PAPER_DEFS + paper()).
// Researched: five storeys of pink sandstone, honeycomb of jharokhas with jali, white lime trim, crown profile with small domes and
// golden finials, street-level shop arcade. Crown centred at x 800; the poster card covers the upper storeys only while a card is up.
const { noise2D } = require('@remotion/noise');
const sky = (cols, ys) => { let o = `<rect width="1080" height="1920" fill="${cols[0]}"/>`; for (let i = 1; i < cols.length; i++) o += steps(ys[i] - 90, ys[i], cols[i], 4) + `<rect y="${ys[i]}" width="1080" height="${1920 - ys[i]}" fill="${cols[i]}"/>`; return o; };
// one ink layer, printed off-register by (dx, dy)
const ink = (body, dx = 0, dy = 0) => `<g transform="translate(${dx} ${dy})">${body}</g>`;
// stepped transition from colour a (above) to colour b (below): b stripes that get thicker toward the bottom (Lemo bandSteps idea)
function steps(y0, y1, b, n = 5) {
  let o = ''; const H = y1 - y0, cell = H / n;
  for (let i = 0; i < n; i++) { const th = cell * ((i + 0.6) / n) * 0.95 + 1.5, top = y0 + cell * (i + 1) - th; o += `<rect x="0" y="${top.toFixed(1)}" width="1080" height="${th.toFixed(1)}" fill="${b}"/>`; }
  return o;
}
const ringsT = (x, y, cols, r = [170, 134, 100]) => r.map((rr, i) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${cols[i]}"/>`).join('');
// paper: grain + mottle on top of everything (multiply), plus a few pinholes in paper colour
const PAPER_DEFS = `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.55 -0.12"/></filter>` +
  `<filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 0.35 -0.08"/></filter>`;
function paper() {
  let o = `<rect width="1080" height="1920" filter="url(#mottle)" opacity="0.5" style="mix-blend-mode:multiply"/><rect width="1080" height="1920" filter="url(#grain)" opacity="0.45" style="mix-blend-mode:multiply"/>`;
  for (let i = 0; i < 46; i++) { const x = (i * 211) % 1080, y = (i * 389) % 1920; o += `<circle cx="${x}" cy="${y}" r="${1.2 + (i % 3) * 0.7}" fill="#fbf1dc" opacity="0.7"/>`; }
  return o;
}
const C = { pink: '#e48f7a', lit: '#f2a68e', shade: '#c86f5e', deep: '#9a4a46', jali: '#7e3a3a', white: '#fbf1dc', gold: '#e0b040', cream: '#f7e6cf' };
const f = n => (+n).toFixed(1);

// one projecting semi-octagonal jharokha: lit front face, shaded side faces, latticed arched window, chhajja ledge, curved domed canopy, finial
function jharokha(cx, by, w, h, cap = 'dome') {
  const fw = w * 0.56, sw = (w - fw) / 2, top = by - h, archT = top + h * 0.28;
  let o = '';
  o += `<path d="M${f(cx - w / 2)} ${f(by)} L${f(cx - fw / 2)} ${f(by + 6)} L${f(cx + fw / 2)} ${f(by + 6)} L${f(cx + w / 2)} ${f(by)} L${f(cx + w / 2)} ${f(top)} L${f(cx - w / 2)} ${f(top)} Z" fill="${C.shade}"/>`;
  o += `<rect x="${f(cx - fw / 2)}" y="${f(top)}" width="${f(fw)}" height="${f(h + 6)}" fill="${C.lit}"/>`;
  // arched window with jali: white frame, dark lattice field, white grid
  const wx0 = cx - fw / 2 + 5, wx1 = cx + fw / 2 - 5, wy1 = by - 8;
  o += `<path d="M${f(wx0)} ${f(wy1)} V${f(archT + 8)} Q${f(wx0)} ${f(archT - 4)} ${f(cx)} ${f(archT - 8)} Q${f(wx1)} ${f(archT - 4)} ${f(wx1)} ${f(archT + 8)} V${f(wy1)} Z" fill="${C.jali}" stroke="${C.white}" stroke-width="3"/>`;
  for (let gx = wx0 + 6; gx < wx1 - 2; gx += 7) o += `<path d="M${f(gx)} ${f(archT + 2)} V${f(wy1 - 1)}" stroke="${C.white}" stroke-width="1.3" opacity="0.8"/>`;
  for (let gy = archT + 6; gy < wy1 - 1; gy += 7) o += `<path d="M${f(wx0 + 1)} ${f(gy)} H${f(wx1 - 1)}" stroke="${C.white}" stroke-width="1.3" opacity="0.8"/>`;
  // side windows (narrow, shaded)
  for (const s of [-1, 1]) { const x0 = cx + s * (fw / 2 + sw / 2); o += `<rect x="${f(x0 - sw * 0.28)}" y="${f(archT + 6)}" width="${f(sw * 0.56)}" height="${f(wy1 - archT - 10)}" rx="3" fill="${C.deep}" stroke="${C.white}" stroke-width="2"/>`; }
  // chhajja (sunshade ledge) with its shadow, and the base band
  o += `<path d="M${f(cx - w / 2 - 4)} ${f(top + 2)} H${f(cx + w / 2 + 4)} L${f(cx + w / 2 - 2)} ${f(top + 10)} H${f(cx - w / 2 + 2)} Z" fill="${C.white}"/><rect x="${f(cx - w / 2)}" y="${f(top + 10)}" width="${f(w)}" height="4" fill="${C.deep}" opacity="0.5"/>`;
  o += `<rect x="${f(cx - w / 2)}" y="${f(by - 2)}" width="${f(w)}" height="5" fill="${C.white}"/>`;
  // canopy: small dome (or curved bangla roof) with a golden finial
  if (cap === 'dome') o += `<path d="M${f(cx - w * 0.34)} ${f(top + 2)} Q${f(cx - w * 0.34)} ${f(top - w * 0.42)} ${f(cx)} ${f(top - w * 0.5)} Q${f(cx + w * 0.34)} ${f(top - w * 0.42)} ${f(cx + w * 0.34)} ${f(top + 2)} Z" fill="${C.pink}" stroke="${C.white}" stroke-width="2.5"/><path d="M${f(cx)} ${f(top - w * 0.5)} Q${f(cx + w * 0.34)} ${f(top - w * 0.42)} ${f(cx + w * 0.34)} ${f(top + 2)} L${f(cx)} ${f(top + 2)} Z" fill="${C.shade}"/><path d="M${f(cx)} ${f(top - w * 0.5)} V${f(top - w * 0.5 - 12)}" stroke="${C.gold}" stroke-width="3"/><circle cx="${f(cx)}" cy="${f(top - w * 0.5 - 14)}" r="3.4" fill="${C.gold}"/>`;
  else o += `<path d="M${f(cx - w * 0.5)} ${f(top + 2)} Q${f(cx)} ${f(top - w * 0.28)} ${f(cx + w * 0.5)} ${f(top + 2)} Z" fill="${C.pink}" stroke="${C.white}" stroke-width="2.5"/>`;
  return o;
}
// tiny standing person in Indian clothes (far across the street), and a cycle-rickshaw
const person = (x, y, k, top, bottom, head = '#8a5a3c', turban) => `<g transform="translate(${f(x)} ${f(y)}) scale(${k})"><path d="M-9 0 L-7 -26 H7 L9 0 Z" fill="${bottom}"/><path d="M-10 -26 L-8 -54 H8 L10 -26 Z" fill="${top}"/><circle cx="0" cy="-62" r="8" fill="${head}"/>${turban ? `<path d="M-10 -64 Q0 -80 10 -64 Z" fill="${turban}"/>` : `<path d="M-8 -64 Q0 -74 8 -64 L8 -58 Q0 -62 -8 -58 Z" fill="#2a1a14"/>`}</g>`;
const rickshaw = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><circle cx="-40" cy="0" r="18" fill="none" stroke="${INK}" stroke-width="4"/><circle cx="40" cy="0" r="18" fill="none" stroke="${INK}" stroke-width="4"/><path d="M-40 0 L0 -10 L40 0 M0 -10 L10 -40" stroke="${INK}" stroke-width="4" fill="none"/><path d="M-62 -10 H-18 V-54 Q-40 -74 -62 -54 Z" fill="#2f6b8a" stroke="${INK}" stroke-width="3"/><rect x="-60" y="-26" width="40" height="14" fill="#e0475f"/>${person(12, -18, 0.8, '#f4e6c8', '#6a5a4a', '#6a4028', '#e0b040')}</g>`;

function plateTaurus(t = 0) {
  // morning sky, stepped bands, pale sun upper-left of the facade (between Vishnu ji's portal and the card area)
  let w = ink(sky(['#7fb8d2', '#a3cdd8', '#cfe2d8', '#f1e8c8'], [0, 300, 560, 800]));
  w += ink(ringsT(1010, 470, ['#f4ecc6', '#f8f2da', '#fcf8ea'], [110, 86, 64]), 2, -1);
  // far city line (old city roofs and a temple shikhara) behind everything, in the far ink
  w += ink(`<path d="M0 1010 V960 H60 V930 H130 V970 H200 V940 L230 900 L260 940 H330 V960 H420 V1010 Z" fill="#d9a898"/><path d="M226 900 L230 870 L234 900 Z" fill="#d9a898"/>`, -1, 1);

  // ===== HAWA MAHAL: set across the street, base y 1180, crown centred x 800 =====
  const X0 = 800, BW = 56, BASE = 1180, ST = 108;                 // bay width, base line, storey height
  // which bays exist on each storey (offset from centre in bay units): pyramid / crown profile
  const rows = [[-7, 7], [-7, 7], [-6, 6], [-2, 2], [-1, 1]];     // storeys 1..5
  let hm = '';
  // back wall mass (shade) behind the bays, stepped like the facade
  rows.forEach(([a, b], s) => { const y1 = BASE - 120 - s * ST, y0 = y1 - ST; hm += `<rect x="${f(X0 + a * BW - BW / 2 - 6)}" y="${f(y0 - 4)}" width="${f((b - a + 1) * BW + 12)}" height="${f(ST + 8)}" fill="${C.pink}"/>`; });
  // ground-floor arcade (shops) with white-trimmed arches
  hm += `<rect x="${f(X0 - 7.5 * BW - 6)}" y="${BASE - 120}" width="${f(15 * BW + 12)}" height="120" fill="${C.pink}"/><rect x="${f(X0 - 7.5 * BW - 6)}" y="${BASE - 124}" width="${f(15 * BW + 12)}" height="8" fill="${C.white}"/>`;
  for (let i = -7; i <= 7; i++) { const x = X0 + i * BW; hm += i === 0 ? `<path d="M${x - 24} ${BASE} V${BASE - 70} Q${x - 24} ${BASE - 104} ${x} ${BASE - 108} Q${x + 24} ${BASE - 104} ${x + 24} ${BASE - 70} V${BASE} Z" fill="${C.deep}" stroke="${C.white}" stroke-width="4"/>` :
    `<path d="M${x - 20} ${BASE} V${BASE - 56} Q${x - 20} ${BASE - 84} ${x} ${BASE - 88} Q${x + 20} ${BASE - 84} ${x + 20} ${BASE - 56} V${BASE} Z" fill="#6e3434" stroke="${C.white}" stroke-width="3"/><rect x="${x - 18}" y="${BASE - 40}" width="36" height="10" fill="${['#f2b84b', '#3f8a7a', '#e0475f', '#f4e6c8'][(i + 7) % 4]}"/>`; }
  // storeys of jharokhas, bottom to top; alternate bays project (lit) or recess (flat with a small window)
  rows.forEach(([a, b], s) => {
    const by = BASE - 120 - s * ST;
    for (let i = a; i <= b; i++) {
      const x = X0 + i * BW;
      if ((i + s) % 2 === 0 || s >= 3) hm += jharokha(x, by - 4, BW - 4, ST - 30, s >= 3 || Math.abs(i) % 3 === 0 ? 'dome' : 'bangla');
      else hm += `<rect x="${x - BW / 2 + 4}" y="${by - ST + 18}" width="${BW - 8}" height="${ST - 22}" fill="${C.pink}"/><path d="M${x - 12} ${by - 12} V${by - ST + 46} Q${x} ${by - ST + 32} ${x + 12} ${by - ST + 46} V${by - 12} Z" fill="${C.jali}" stroke="${C.white}" stroke-width="2.5"/><path d="M${x - BW / 2 + 4} ${by - 2} H${x + BW / 2 - 4}" stroke="${C.white}" stroke-width="4"/>`;
    }
    // white storey band
    hm += `<rect x="${f(X0 + a * BW - BW / 2 - 6)}" y="${f(by - 2)}" width="${f((b - a + 1) * BW + 12)}" height="5" fill="${C.white}"/>`;
  });
  // the crown: a row of small domed canopies on the top storey and a central taller cupola
  const topY = BASE - 120 - 5 * ST;
  hm += `<rect x="${f(X0 - 1.5 * BW - 6)}" y="${f(topY - 6)}" width="${f(3 * BW + 12)}" height="10" fill="${C.white}"/>`;
  hm += `<path d="M${X0 - 30} ${topY - 6} Q${X0 - 30} ${topY - 60} ${X0} ${topY - 70} Q${X0 + 30} ${topY - 60} ${X0 + 30} ${topY - 6} Z" fill="${C.pink}" stroke="${C.white}" stroke-width="3"/><path d="M${X0} ${topY - 70} V${topY - 90}" stroke="${C.gold}" stroke-width="4"/><circle cx="${X0}" cy="${topY - 93}" r="5" fill="${C.gold}"/>`;
  // white floral trim dots along the storey bands (lime decoration)
  rows.forEach(([a, b], s) => { const by = BASE - 120 - s * ST; for (let i = a; i <= b; i++) hm += `<circle cx="${X0 + i * BW}" cy="${by - ST + 12}" r="2.4" fill="${C.white}"/>`; });
  w += ink(hm, 1, 1);
  // a light ink pull: the lit right edge of the crown (sun from the left = lit left faces already; slight registration slip)
  w += ink(`<rect x="${f(X0 + 7.5 * BW + 6)}" y="${BASE - 3 * ST - 120}" width="6" height="${3 * ST + 120}" fill="${C.shade}"/>`, -2, 0);

  // ===== left: Badi Chaupar side, pink old-city row with arches (behind and below Vishnu ji's cloud) =====
  let row = `<rect x="0" y="1040" width="${f(X0 - 7.5 * BW - 14)}" height="140" fill="#dc8a78"/><rect x="0" y="1034" width="${f(X0 - 7.5 * BW - 14)}" height="8" fill="${C.white}"/>`;
  for (let x = 30; x < X0 - 7.5 * BW - 30; x += 64) row += `<path d="M${x - 22} 1180 V1120 Q${x - 22} 1090 ${x} 1086 Q${x + 22} 1090 ${x + 22} 1120 V1180 Z" fill="#7a3a38" stroke="${C.white}" stroke-width="3"/>` + jharokha(x, 1076, 40, 34, 'bangla') + `<path d="M${x - 32} 1034 q16 -14 32 0 q16 -14 32 0" fill="#dc8a78" stroke="${C.white}" stroke-width="2"/>`;
  w += ink(row, -1, 0);

  // ===== street (Sireh Deori Bazaar), far kerb, people and a rickshaw on the far side =====
  w += ink(`<rect y="1180" width="1080" height="740" fill="#8f858a"/><rect y="1180" width="1080" height="12" fill="#c9b9a6"/><rect y="1192" width="1080" height="8" fill="#6f666c"/>`);
  w += ink(`<path d="M0 1262 H1080" stroke="#f4e6c8" stroke-width="7" stroke-dasharray="44 38"/>`, 1, 0);
  w += person(500, 1188, 0.75, '#e0475f', '#f2b84b', '#8a5a3c') + person(528, 1188, 0.72, '#f4e6c8', '#f4e6c8', '#7a4a30', '#e0475f') + person(1040, 1188, 0.75, '#2f6b8a', '#f4e6c8', '#8a5a3c');
  w += rickshaw(150 + 14 * Math.sin(t * 0.3), 1226, 0.9);
  // marigold cart parked at the far kerb, left of the facade
  w += `<g transform="translate(330 1210)"><rect x="-46" y="-28" width="92" height="20" fill="#7a4a2a" stroke="${INK}" stroke-width="3"/>${[-34, -18, -2, 14, 30].map((x, i) => `<circle cx="${x}" cy="-34" r="${9 + (i % 2) * 2}" fill="${i % 2 ? '#f29a1a' : '#f2c21a'}"/>`).join('')}<circle cx="-30" cy="0" r="10" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="30" cy="0" r="10" fill="none" stroke="${INK}" stroke-width="3"/></g>`;

  // ===== near footpath (where Sakshi stands): sandstone slabs with a pink-and-white Jaipur border at the kerb =====
  w += ink(`<path d="M0 1300 H1080 V1920 H0 Z" fill="#dcc6a2"/><rect y="1300" width="1080" height="16" fill="#b8a07c"/>`);
  let bord = ''; for (let x = 0; x < 1080; x += 36) bord += `<path d="M${x} 1330 l18 -10 l18 10 l-18 10 Z" fill="${(x / 36) % 2 ? C.pink : C.white}"/>`;
  w += ink(`<rect y="1318" width="1080" height="24" fill="#c9705e"/>` + bord, 1, 0);
  let slabs = ''; for (let r = 0; r < 5; r++) { const y = 1400 + r * r * 22 + r * 40; slabs += `<path d="M0 ${y} H1080" stroke="#c8b08a" stroke-width="${3 + r}"/>`; for (let c = 0; c < 8; c++) { const x = c * 150 + (r % 2) * 75; slabs += `<path d="M${x} ${y} L${x + (x - 540) * 0.08} ${y + 40 + r * 30}" stroke="#c8b08a" stroke-width="3"/>`; } }
  w += ink(slabs, 1, 1);

  w += ink(`<g transform="translate(70 1350)"><rect x="-20" y="-14" width="40" height="16" fill="#2e2a34"/><path d="M-8 -14 L-6 -380 H6 L8 -14 Z" fill="#2e2a34"/><path d="M-40 -380 H40" stroke="#2e2a34" stroke-width="6"/>${[-34, 34].map(x => `<path d="M${x - 14} -380 L${x - 10} -420 H${x + 10} L${x + 14} -380 Z" fill="#ffe6a8" stroke="#2e2a34" stroke-width="4"/><path d="M${x - 16} -420 L${x} -436 L${x + 16} -420 Z" fill="#2e2a34"/>`).join('')}</g>`);
  let pots = ''; for (const [x, y, k] of [[70, 1790, 1], [190, 1830, 0.85]]) pots += `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-46 0 L-36 70 H36 L46 0 Z" fill="#b0482e"/><path d="M-46 0 H46" stroke="${C.white}" stroke-width="6"/>${[[-40, -30], [-10, -54], [24, -40], [0, -20], [40, -12], [-30, -6]].map(([a, b], i) => `<circle cx="${a + 3 * noise2D('bo' + i, t * 0.5, x)}" cy="${b}" r="22" fill="${i % 2 ? '#d6337a' : '#e8569a'}"/>`).join('')}${[[-20, -40], [14, -22]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="12" fill="#3f7a3a"/>`).join('')}</g>`;
  w += ink(pots);
  // ===== small life: pigeons wheeling over the street (noise paths), two kites high =====
  let birds = ''; for (let i = 0; i < 7; i++) { const bx = 430 + 60 * i + 30 * noise2D('pb' + i, t * 0.35, 0), by = 820 + 40 * noise2D('pb' + i, 0, t * 0.35) + (i % 3) * 18, fl = Math.sin(t * 9 + i) * 5; birds += `<path d="M${f(bx - 9)} ${f(by - fl)} Q${f(bx - 4)} ${f(by - 6)} ${f(bx)} ${f(by)} Q${f(bx + 4)} ${f(by - 6)} ${f(bx + 9)} ${f(by - fl)}" stroke="#5a5a6a" stroke-width="3" fill="none"/>`; }
  w += birds;
  const kite = (x, y, c, i) => { const dx = 10 * noise2D('k' + i, t * 0.4, 0), dy = 8 * noise2D('k' + i, 0, t * 0.4); return `<g transform="translate(${f(x + dx)} ${f(y + dy)}) rotate(${f(8 * noise2D('r' + i, t * 0.5, 1))})"><path d="M0 -24 L18 0 L0 24 L-18 0 Z" fill="${c}"/><path d="M0 -24 V24 M-18 0 H18" stroke="${C.white}" stroke-width="2"/><path d="M0 24 q-6 14 4 24" stroke="${c}" stroke-width="3" fill="none"/></g>`; };
  w += ink(kite(80, 880, '#e0475f', 0) + kite(1020, 300 + 40, '#3fa0a0', 1));
  return w;
}

module.exports = { plateTaurus, PAPER_DEFS, paper, INK, sm, lerp, L2, T, TS, plateAries, portal, armKF, fixV, VA, KA, kArms, flight, card, stamp, CX0, CW, CY0 };
