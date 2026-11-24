// REFERENCE SCENE for the approved silkscreen poster theme (owner, 24 Nov 2026). Gate-3 reviewed (v8 8/10 PASS, v9 polish).
// V10 "Yahi toh is saal ki asli pariksha hai, jo ruk gaya wahi jeetega": portal entry/exit, calm listening, practical layout.
// Vishnu ji appears through a spark-ring portal high in the sky, speaks, and vanishes back through it. Sakshi stands on the
// ground (no cloud). The folk ram gallops up the road and brakes at the APRIL milestone on "jo ruk gaya".
const K = require('../kit'), R = require('../char_ram');
const { vp, kp, vishnu, sakshi, clamp, ease, backOut } = K;
const S = require(require('path').join(K.VID, 'script.json')).beats, B = id => S.find(b => b.id === id);
const V = B('V10'), T0 = V.start - 1.4, LEN = (V.end - V.start) + 3.0;
const INK = '#2a1418';
const kind = { ...vp(2), lid: 0, browL: 0.7, browR: 0.7, mouthShape: 'smileBig', lookX: 10, tilt: 0, wink: 0 };
const C = p => ({ ...p, lawyer: 1 });
const kWatch = C({ ...kp(0), browUp: 0.6, mouth: 'o', blush: 0.4, lookX: -18, lookY: -6, tilt: -4 });
const kListen = C({ ...kp(0), mouth: 'smile', blush: 0.4, tilt: -2 }), kAmused = C({ ...kp(0), mouth: 'smirk', blush: 0.6, tilt: 3 });
const kGiggle = C({ ...kp(0), happy: 1, mouth: 'grin', blush: 0.9, tilt: 8, lookX: -10 });
const T = (x, y, str, size, fill) => `<text x="${x}" y="${y}" font-family="DejaVu Serif, Georgia, serif" font-weight="700" font-size="${size}" text-anchor="middle" fill="${fill}">${str}</text>`;

// silkscreen hill road, full bleed (flat inks, stepped sky bands, sun rings, lit/shade faces)
function plate() {
  let w = ['#e8873a', '#ee9a45', '#f2ad52', '#f4c066', '#f6d27e', '#f8dc92'].map((c, i) => `<rect y="${i * 140}" width="1080" height="${i === 5 ? 400 : 142}" fill="${c}"/>`).join('');
  w += [170, 134, 100].map((r, i) => `<circle cx="790" cy="560" r="${r}" fill="${['#f6d27e', '#f9e2a2', '#fdf0c8'][i]}"/>`).join('');
  w += `<path d="M0 900 L150 760 L250 830 L400 650 L520 780 L660 640 L780 760 L900 670 L1080 800 L1080 1060 L0 1060 Z" fill="#6f5a8a"/><path d="M400 650 L450 720 L520 780 L400 720 Z M660 640 L700 690 L780 760 L660 700 Z" fill="#f4e6c8"/>`;
  w += `<path d="M0 990 Q300 900 560 970 T1080 950 L1080 1200 L0 1200 Z" fill="#2f7a5a"/><path d="M0 1060 Q330 990 640 1060 T1080 1030 L1080 1220 L0 1220 Z" fill="#245f47"/>`;
  w += `<path d="M0 1150 Q450 1080 1080 1140 L1080 1920 L0 1920 Z" fill="#e0a64a"/><path d="M0 1560 Q500 1500 1080 1570 L1080 1920 L0 1920 Z" fill="#c98f3a"/>`;
  // road: enters from behind the left trees, curves across and comes down toward the viewer
  w += `<path d="M-20 1100 Q180 1108 300 1168 Q385 1220 400 1400 L470 1920 L40 1920 L160 1400 Q150 1290 80 1240 Q30 1200 -20 1180 Z" fill="#8a7f86"/>`;
  w += `<path d="M0 1140 Q160 1148 240 1200 Q288 1245 283 1330 L272 1500 L262 1700 L255 1900" fill="none" stroke="#f4e6c8" stroke-width="10" stroke-dasharray="40 34"/>`;
  for (const [x, y, k] of [[70, 1028, 1.0], [175, 1046, 0.75], [960, 1110, 1.3]]) w += `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-8" y="0" width="16" height="44" fill="#5a3020"/>${[0, 1, 2, 3].map(i => `<path d="M0 ${-150 + i * 38} L${-34 - i * 12} ${-96 + i * 38} L${34 + i * 12} ${-96 + i * 38} Z" fill="${i % 2 ? '#1f4a3a' : '#2f6b50'}"/><path d="M0 ${-150 + i * 38} L${34 + i * 12} ${-96 + i * 38} L0 ${-96 + i * 38} Z" fill="#183a2d"/>`).join('')}</g>`;
  w += `<g transform="translate(820 930) scale(1.2)"><path d="M-34 60 L-22 0 L0 -50 L22 0 L34 60 Z" fill="#fbf3e2" stroke="${INK}" stroke-width="3"/><path d="M0 -50 L22 0 L34 60 L0 60 Z" fill="#e6d7ba"/><path d="M0 -50 L0 -86" stroke="${INK}" stroke-width="3"/><path d="M0 -86 L34 -78 L0 -68 Z" fill="#ff8a1a"/></g>`;
  // milestone at the roadside
  w += `<g transform="translate(500 1205) scale(1.0)"><path d="M-70 110 L-70 -20 Q-70 -84 0 -90 Q70 -84 70 -20 L70 110 Z" fill="#fbf7ee" stroke="${INK}" stroke-width="6"/><path d="M-70 -20 Q-70 -84 0 -90 Q70 -84 70 -20 Z" fill="#f2b84b" stroke="${INK}" stroke-width="6"/>${T(0, 30, 'APRIL', 36, INK)}${T(0, 78, '90 din', 30, '#8e1b2c')}</g>`;
  return w;
}
// spark-ring portal (generic): rotating ring of gold-orange spark streaks, sparks flung off tangentially, a glimpse of the sky-realm inside
function portal(t, cx, cy, r) {
  if (r < 2) return '';
  let o = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1d2f7a"/>`;
  for (let i = 0; i < 26; i++) { const a = i * 2.4, rr = (i * 37) % 100 / 100 * r * 0.85; o += `<circle cx="${cx + Math.cos(a) * rr}" cy="${cy + Math.sin(a) * rr}" r="${2 + (i % 3)}" fill="#fff0b0" opacity="${0.5 + 0.5 * Math.sin(t * 4 + i)}"/>`; }
  o += `<circle cx="${cx}" cy="${cy}" r="${r * 0.9}" fill="url(#halo)" opacity="0.45"/>`;
  for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2 + t * 3.2 * (i % 2 ? 1 : 0.8), rr = r * (0.97 + 0.06 * Math.sin(i * 7.3 + t * 9)), L = 20 + 18 * ((i * 13) % 7) / 7;
    const x0 = cx + Math.cos(a) * rr, y0 = cy + Math.sin(a) * rr, x1 = cx + Math.cos(a + L / rr) * rr, y1 = cy + Math.sin(a + L / rr) * rr;
    o += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${i % 3 ? '#ffb02e' : '#ffe27a'}" stroke-width="${i % 4 ? 6 : 9}" stroke-linecap="round"/>`; }
  for (let i = 0; i < 14; i++) { const ph = (t * 1.6 + i / 14) % 1, a = i * 1.37 + t * 3, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, tx = -Math.sin(a), ty = Math.cos(a), d = 30 + 120 * ph;
    o += `<circle cx="${(x + tx * d).toFixed(1)}" cy="${(y + ty * d + 60 * ph * ph).toFixed(1)}" r="${(5 * (1 - ph)).toFixed(1)}" fill="#ffd25a"/>`; }
  return o + `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="#ff8a1a" stroke-width="3" opacity="0.6"/>`;
}
const PX = 330, PY = 545, PR = 245;
const openAt = 0.15, openEnd = 0.85, closeAt = 1.4 + (V.end - V.start) + 1.05, closeEnd = closeAt + 0.5;
const pr = lt => lt < openAt ? 0 : lt < openEnd ? PR * backOut(clamp((lt - openAt) / (openEnd - openAt))) : lt < closeAt ? PR : PR * (1 - ease(clamp((lt - closeAt) / (closeEnd - closeAt))));
const CLOCK = K.film([[0, 9999, () => ({ defs: '', body: '' })]], 9999);   // sets kit's acting clock (lip-sync, blinks)
const sm = u => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u, L2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
// keyframed arm: elbow leads, wrist follows ~0.08 s later (overlapping action); hand shape switches mid-blend
function armKF(t, keys, blend = 0.35) {
  const at = tt => { let i = 0; for (let k = 1; k < keys.length; k++) if (tt >= keys[k][0]) i = k; const u = i ? sm(clamp((tt - keys[i][0]) / blend)) : 1; return [keys[Math.max(0, i - 1)][1], keys[i][1], u]; };
  const [a, b, u] = at(t), [aw, bw, uw] = at(t - 0.08);
  const o = { ...b, E: L2(a.E, b.E, u), W: L2(aw.W, bw.W, uw), hand: u < 0.5 ? a.hand : b.hand }; if (a.S && b.S) o.S = L2(a.S, b.S, u); return o;
}
const along = (A, k) => Math.atan2(A.W[1] - A.E[1], A.W[0] - A.E[0]) + k * Math.PI / 2;
const fixV = A => ({ ...A, handAng: along(A, A.hand === 'rest' ? -1 : 1) });
const VS = [690, 945];
const vRest = { S: VS, E: [770, 1050], W: [700, 1150], hand: 'rest' }, vWave = { S: VS, E: [835, 925], W: [890, 795], hand: 'palm' };
const vPalm = { S: VS, E: [830, 1010], W: [905, 905], hand: 'palm' }, vFinger = { S: VS, E: [830, 905], W: [852, 772], hand: 'point' };
const vBless = { S: VS, E: [820, 950], W: [880, 860], hand: 'palm' }, vDown = { S: VS, E: [860, 1040], W: [985, 1060], hand: 'palm' };
const LS = [392, 950], vL0 = { S: LS, E: [318, 1075], W: [292, 1192] }, vLopen = { S: LS, E: [290, 1040], W: [190, 1005] }, vLtrail = { S: LS, E: [300, 1050], W: [250, 1140] }, vLram = { S: LS, E: [268, 1092], W: [172, 1188] };
// Sakshi's arms (body coords): clasped / pointing up at the portal / pointing at the ram / clapping
const kRest = { L: { E: [372, 1080], W: [385, 1205], hand: 'relax' }, R: { E: [708, 1080], W: [695, 1205], hand: 'relax' } };
const kChest = { L: kRest.L, R: { E: [705, 1070], W: [585, 1000], hand: 'palm' } };
const kWait = { L: { E: [318, 1040], W: [240, 975], hand: 'palm' }, R: kRest.R };
const kShrug = { L: { E: [335, 1070], W: [262, 1015], hand: 'palm' }, R: { E: [745, 1070], W: [818, 1015], hand: 'palm' } };
const kClasp = kRest, kBye = { L: kRest.L, R: { E: [880, 985], W: [1010, 790], hand: 'palm' } };
const kUp = { L: { E: [290, 960], W: [150, 860], hand: 'point' }, R: kRest.R };
const kHold = { L: { E: [410, 1085], W: [522, 1165], hand: 'palm' }, R: { E: [670, 1085], W: [558, 1165], hand: 'palm' } };   // hands loosely joined at the waist, listening
const kRam = { L: { E: [312, 1040], W: [214, 1070], hand: 'point' }, R: { E: [700, 1060], W: [640, 1110], hand: 'relax' } };
const kClap = { L: { E: [410, 1050], W: [515, 945], hand: 'palm' }, R: { E: [670, 1050], W: [565, 945], hand: 'palm' } };
// Vishnu ji's flight: out of the portal along a curve, growing as he comes toward us; settles with a small damped bob
const SPEAK0 = 1.4, SPEAK1 = 1.4 + (V.end - V.start);
const FLY_IN = [openEnd - 0.1, openEnd + 0.9], FLY_OUT = [SPEAK1 + 0.15, SPEAK1 + 0.95];
const P0 = [PX, PY + 40], PC = [PX + 150, PY + 130], P1 = [PX + 30, PY + 205];
const bez = u => [lerp(lerp(P0[0], PC[0], u), lerp(PC[0], P1[0], u), u), lerp(lerp(P0[1], PC[1], u), lerp(PC[1], P1[1], u), u)];
function vState(lt) {
  let u; if (lt < FLY_IN[1]) u = sm(clamp((lt - FLY_IN[0]) / (FLY_IN[1] - FLY_IN[0]))); else if (lt < FLY_OUT[0]) u = 1; else u = 1 - sm(clamp((lt - FLY_OUT[0]) / (FLY_OUT[1] - FLY_OUT[0])));
  const [x, y] = bez(u), arrive = lt > FLY_IN[1] && lt < FLY_OUT[0] ? 30 * Math.exp(-(lt - FLY_IN[1]) * 3.0) * Math.sin((lt - FLY_IN[1]) * 9) : 0;
  return { u, x, y: y + arrive + 6 * Math.sin(lt * 2.2), s: 0.14 + 0.32 * u, tilt: (lt < FLY_IN[1] ? 4 : lt > FLY_OUT[0] ? -4 : 0) * Math.sin(Math.PI * u) };
}
function trail(lt, st) {   // cloud wisps left along the path while flying
  if (!((lt > FLY_IN[0] && lt < FLY_IN[1] + 0.5) || (lt > FLY_OUT[0] - 0.1 && lt < FLY_OUT[1]))) return '';
  let o = ''; for (let k = 1; k <= 8; k++) { const [x, y] = bez(Math.max(0, st.u - k * 0.06)), a = 0.75 * (1 - k / 9); o += `<circle cx="${x.toFixed(1)}" cy="${(y + 40 * st.s).toFixed(1)}" r="${(60 * st.s * (1 - k / 7) + 6).toFixed(1)}" fill="#ffffff" opacity="${a.toFixed(2)}"/>`; }
  return o;
}
function frame(lt) {
  const t = T0 + lt, r = pr(lt); CLOCK.svg(t);
  let body = plate();
  // portal, and Vishnu ji flying out of it (clipped to the ring only while he is still small and inside it)
  body += `<defs><clipPath id="pc"><circle cx="${PX}" cy="${PY}" r="${Math.max(1, r)}"/></clipPath></defs>` + portal(t, PX, PY, r);
  const st = vState(lt);
  if (lt > openAt + 0.2 && lt < FLY_IN[0] + 0.3) { const a = clamp((lt - openAt - 0.2) / 0.3); body += `<circle cx="${PX}" cy="${PY + 40}" r="${(30 + 20 * Math.sin(lt * 20) + 45 * Math.exp(-Math.pow((lt - FLY_IN[0]) * 7, 2))).toFixed(1)}" fill="#fff4c4" opacity="${(0.8 * a).toFixed(2)}"/>`; }
  if (st.u > 0.001 || (lt > FLY_IN[0] && lt < FLY_OUT[1])) {
    // two motivated gestures only: finger up on 'asli pariksha', palm down on 'jo ruk gaya'; calm blessing palm otherwise; one wave sweep on exit
    const armR = fixV(armKF(lt, [[0, vBless], [SPEAK0 + (V.end - V.start) * 0.3, vFinger], [SPEAK0 + (V.end - V.start) * 0.52, vBless], [SPEAK1 + 0.15, vWave]], 0.4));
    const wave = lt > SPEAK1 + 0.3 && lt < SPEAK1 + 0.9 ? { ...armR, W: [armR.W[0] + 26 * Math.sin((lt - SPEAK1 - 0.3) / 0.6 * Math.PI * 2), armR.W[1]] } : armR;
    const armL = armKF(lt, [[0, vLtrail], [SPEAK0, vL0], [SPEAK0 + (V.end - V.start) * 0.5, vLram], [SPEAK0 + (V.end - V.start) * 0.8, vL0], [SPEAK1 + 0.1, vLtrail]]);   // conch hand opens down toward the ram on 'jo ruk gaya'
    const nod = 3.5 * Math.exp(-Math.pow((lt - SPEAK0 - (V.end - V.start) * 0.86) * 5, 2));   // one nod on 'jeetega'
    const lean = lt < FLY_IN[1] ? 7 * Math.sin(Math.PI * st.u) : lt < FLY_IN[1] + 0.8 ? -5 * Math.sin(Math.PI * (lt - FLY_IN[1]) / 0.8) : lt > FLY_OUT[0] ? -7 * Math.sin(Math.PI * st.u) : 0;
    const atRam = lt > SPEAK0 + (V.end - V.start) * 0.52 && lt < SPEAK0 + (V.end - V.start) * 0.75;
    const pose = { ...kind, mouthShape: undefined, viseme: 'A', lean, tilt: Math.max(-4, Math.min(4, st.tilt + nod)), armR: fixV(wave), armL, lookX: atRam ? -20 : 4, lookY: atRam ? 15 : 0 };
    const vj = `<g transform="translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) scale(${(st.s / 0.46).toFixed(4)}) translate(${-PX} ${-(PY + 230)})">${vishnu(pose, PX, PY + 230, 0.46, t)}</g>`;
    const grow = sm(clamp((st.u - 0.25) / 0.55)), cr = Math.max(1, r) + grow * 1500;
    body += `<defs><clipPath id="pd"><circle cx="${PX}" cy="${PY}" r="${cr.toFixed(1)}"/></clipPath></defs>`;
    if (st.u > 0.5) body += `<ellipse cx="${st.x.toFixed(1)}" cy="1120" rx="${(150 * st.s / 0.46).toFixed(1)}" ry="16" fill="#7a4e1c" opacity="${(0.25 * (st.u - 0.5) * 2).toFixed(2)}"/>`;
    body += `<g clip-path="url(#pd)">${trail(lt, st)}${vj}</g>`;
  }
  // ram: comes out from behind the left trees along the road, growing with distance, then brakes at the milestone
  const brakeAt = SPEAK0 + (V.end - V.start) * 0.55, u = clamp(lt / brakeAt), uu = u * (0.8 + 0.2 * u), bk = clamp((lt - brakeAt + 0.2) / 0.4);
  const RP = q => q < 0.5 ? L2([-90, 1088], [140, 1098], q / 0.5) : L2([140, 1098], [262, 1183], (q - 0.5) / 0.5);
  const [rx, ry] = RP(uu), rs = 0.32 + 0.28 * uu;
  body += `<ellipse cx="${(rx + 20 * rs).toFixed(1)}" cy="${(ry + 182 * rs).toFixed(1)}" rx="${(170 * rs).toFixed(1)}" ry="${(18 * rs).toFixed(1)}" fill="#3a2e3a" opacity="0.28"/>`;
  body += R.drawFolk({ x: rx, y: ry, s: rs, run: lt * 2.8, speed: (1 - bk) * (u < 1 ? 1 : 0.3), brake: bk < 1 ? bk : Math.max(0, 1 - (lt - brakeAt - 0.2) / 0.6), look: bk > 0.3 && lt < brakeAt + 1.2 ? 'shock' : 'happy', tilt: 0, lookX: bk >= 1 && lt > brakeAt + 1.2 ? -6 : 0, blink: ((lt * 10) % 31) < 1.5 ? 1 : 0 });
  // Sakshi on the ground: watches the portal, points up as it opens, listens with hands clasped, points at the ram, claps
  const KK0 = [[0, kRest], [0.35, kUp], [1.3, kChest], [SPEAK0 + (V.end - V.start) * 0.12, kRest], [SPEAK0 + (V.end - V.start) * 0.3, kWait], [SPEAK0 + (V.end - V.start) * 0.45, kShrug], [brakeAt + 0.1, kRam], [brakeAt + 0.9, kClap], [brakeAt + 1.6, kRest], [SPEAK1 + 0.1, kBye], [FLY_OUT[1] + 0.1, kRest]];
  const KK = [[0, kRest], [2.3, kHold]];   // no pointing: she looks up at the portal; hands join at the waist as she settles to listen
  const arms = { L: armKF(lt, KK.map(([a, k]) => [a, k.L])), R: armKF(lt, KK.map(([a, k]) => [a, k.R])) };
  if (false) { const b = 34 * Math.abs(Math.sin(lt * 8)) * clamp((lt - brakeAt - 0.9) / 0.2) * clamp((brakeAt + 1.6 - lt) / 0.25); arms.L.W = [arms.L.W[0] - b, arms.L.W[1]]; arms.R.W = [arms.R.W[0] + b, arms.R.W[1]]; }
  if (false) arms.R.W = [arms.R.W[0] + 32 * Math.sin(lt * 9), arms.R.W[1]];
  const nodK = Math.exp(-Math.pow((lt - SPEAK0 - (V.end - V.start) * 0.9) * 4, 2)), bow = clamp((lt - SPEAK1 - 0.9) / 0.4);
  const face = lt < 0.8 ? kWatch : lt < 1.6 ? { ...kWatch, mouth: 'smile' } : (lt > brakeAt + 0.2 && lt < brakeAt + 1.4) ? kAmused : kListen, look = lt < 1.5 ? { lookX: -22, lookY: -14 } : lt < brakeAt ? { lookX: -16, lookY: -10 } : lt < brakeAt + 1.4 ? { lookX: -26, lookY: 6 } : lt < SPEAK1 ? { lookX: -16, lookY: -10 + 10 * nodK } : { lookX: -24, lookY: -18 + 16 * bow };
  body += `<ellipse cx="730" cy="1352" rx="95" ry="14" fill="#a8742c" opacity="0.45"/>` + (CLOCK.svg(Math.min(Math.max(t, V.start + 0.05), V.end - 0.05)), '') + sakshi({ ...face, ...look, armL: arms.L, armR: arms.R }, 730, 1065, 0.5, t);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><radialGradient id="halo"><stop offset="0" stop-color="#fff4c4"/><stop offset="1" stop-color="#ffe07a" stop-opacity="0"/></radialGradient></defs>${body}${lt > SPEAK0 - 0.05 && lt < SPEAK1 + 0.05 ? K.caption(t) : ''}</svg>`;
}
module.exports = { DUR: LEN, svg: frame, T0 };
