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

module.exports = { INK, sm, lerp, L2, T, TS, plateAries, portal, armKF, fixV, VA, KA, kArms, flight, card, stamp, CX0, CW, CY0 };
