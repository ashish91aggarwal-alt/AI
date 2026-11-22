// Brahma ji — built on the approved chibi Vishnu body (same proportions, eyes, mouths, shoulders) and re-dressed:
// golden skin, long white hair, fluffy cloud beard + curled moustache, red-dot tilak, saffron/red dhoti, pink lotus seat,
// four arms: back pair raise open palms with the Vedas and kamandalu floating above them; front right stamps (stamp fused
// into the fist), front left rests. Props float or are fused into fists — no finger grips.
const E = require('./engine'), V = require('./char_vishnu');
const { WT, catmull, ink, inkLoop, fill, part, arm, rot } = E;
const LOOK = { skin: '#f3c189', skinSh: '#d99a62', skinHi: '#ffe0b8', skinLine: '#9a5a32', blush: '#f2788c',
  hair: '#f4f2ec', hairHi: '#c9c5bb', cloth: '#e2472f', clothSh: '#b02e1f', red: '#d22f48', palmMid: '#e9a48a', brow: '#f4f2ec' };
const C = { ...V.C, ...LOOK, beard: '#fbfaf6', beardSh: '#dcd8ce', stampWood: '#a06a3a', ink: '#3b4fb8' };
function withLook(fn) { const save = {}; for (const k in LOOK) { save[k] = V.C[k]; V.C[k] = LOOK[k]; } try { return fn(); } finally { Object.assign(V.C, save); } }
const puff = (pts, r) => { let o = ''; for (const [x, y, k] of pts) o += `<circle cx="${x}" cy="${y}" r="${r * (k || 1)}" fill="${C.beard}"/>`; return o; };
function beard(p) { // fluffy cloud beard under the mouth + curled moustache, in head space
  const [hx, hy] = p.head, t = p.tilt || 0, talk = p.talk || 0, drop = talk * 14;
  const lobes = [[-150, 120], [-120, 190], [-70, 240], [0, 262], [70, 240], [120, 190], [150, 120], [-90, 170], [0, 200], [90, 170]].map(([x, y]) => [x, y + (y > 160 ? drop : 0)]);
  let back = ''; for (const [x, y] of lobes) back += `<circle cx="${x}" cy="${y}" r="62" fill="${E.INK}"/>`;
  let o = `<g>${back}</g>` + puff(lobes, 56);
  for (const [x, y] of [[-120, 200], [-40, 250], [40, 250], [120, 200]]) o += ink(catmull([[x - 18, y], [x, y + 14], [x + 18, y]], 4, false), WT.fine * 1.5, { color: C.beardSh });
  // cut a mouth window: beard sits below the mouth; cheeks puffs at the sides
  const ms = catmull([[0, 104], [46, 96], [92, 104], [124, 86], [134, 60], [124, 92], [96, 120], [50, 122], [0, 116], [-50, 122], [-96, 120], [-124, 92], [-134, 60], [-124, 86], [-92, 104], [-46, 96]], 5, true);
  const mo = part(ms, C.beard, { sh: C.beardSh, shPts: [[0, 116], [140, 116], [140, 130], [0, 130]], w: WT.mid });
  return `<g transform="translate(${hx} ${hy}) rotate(${t})"><g transform="translate(0 64)">${o}</g>${mo}<circle cx="0" cy="-124" r="10" fill="${C.red}" stroke="${E.INK}" stroke-width="2.5"/></g>`;
}
function lotusSeat(x = 540, y = 1400) {
  let o = '';
  for (const [a, r, col] of [[-1.25, 1, '#f7a8c6'], [1.25, 1, '#f7a8c6'], [-0.8, 1.05, '#f48fb8'], [0.8, 1.05, '#f48fb8'], [-0.35, 1.1, '#ff7fae'], [0.35, 1.1, '#ff7fae'], [0, 1.12, '#ff6fa4']]) {
    const pt = catmull([[0, 0], [70, -40], [0, -230 * r], [-70, -40]].map(q => rot(q, a)).map(([a2, b2]) => [x + a2 * 1.6, y + 60 + b2 * 0.7]), 6, true);
    o += part(pt, col, { sh: '#e05c92', shPts: pt.map(([a2, b2]) => [a2 + 18, b2 + 10]), w: WT.mid });
  }
  return o;
}
function stamp(W) {
  const [x, y] = W; let o = part(catmull([[x - 16, y - 80], [x + 16, y - 80], [x + 14, y - 44], [x - 14, y - 44]], 3, true), C.stampWood, { w: WT.mid });
  o += `<circle cx="${x}" cy="${y - 92}" r="20" fill="${C.stampWood}" stroke="${E.INK}" stroke-width="${WT.mid}"/>`;
  o += part(catmull([[x - 44, y + 40], [x + 44, y + 40], [x + 44, y + 64], [x - 44, y + 64]], 2, true), C.stampWood, { w: WT.mid }) + `<rect x="${x - 42}" y="${y + 64}" width="84" height="10" fill="${C.ink}"/>`;
  return o;
}
function floatProp(kind, x, y, t = 0) {
  const by = Math.sin(t * 3 + x) * 6; let o = `<circle cx="${x}" cy="${y + by}" r="80" fill="url(#halo)" opacity="0.7"/>`;
  if (kind === 'vedas') { for (let k = 0; k < 3; k++) o += part(catmull([[x - 72, y + by - 16 + k * 18], [x + 72, y + by - 20 + k * 18], [x + 74, y + by - 4 + k * 18], [x - 70, y + by + k * 18]], 2, true), k % 2 ? '#ecd394' : '#dcbc72', { w: WT.mid * 0.9 });
    o += ink([[x - 10, y + by - 24], [x - 8, y + by + 40]], 7, { color: C.red, taper: [0.1, 0.1] }); }
  else { const pot = catmull([[x - 46, y + by], [x - 42, y + by - 34], [x, y + by - 48], [x + 42, y + by - 34], [x + 46, y + by], [x + 32, y + by + 36], [x - 32, y + by + 36]], 6, true);
    o += part(pot, C.gold, { sh: C.goldSh, shPts: [[x, y + by - 52], [x + 52, y + by - 52], [x + 52, y + by + 40], [x, y + by + 40]], w: WT.mid });
    o += ink(catmull([[x + 42, y + by - 14], [x + 72, y + by - 30], [x + 84, y + by - 46]], 4, false), 10, { color: C.goldSh, taper: [0.1, 0.3] }) + ink(catmull([[x - 30, y + by - 42], [x, y + by - 84], [x + 30, y + by - 42]], 6, false), 6, { taper: [0.1, 0.1] }); }
  return o;
}
function draw(p) {
  const t = p.t || 0, sk = { skin: LOOK.skin, skinSh: LOOK.skinSh, gold: C.gold, line: LOOK.skinLine };
  const BL = p.backL || { E: [250, 900], W: [210, 770] }, BR = p.backR || { E: [830, 900], W: [870, 770] };
  const backArms = arm([420, 960], BL.E, BL.W, { r: [32, 27, 23], handPose: 'palm', handAng: 0, hs: 0.9, handScale: 0.85, outward: -1, ...sk }) +
                   arm([660, 960], BR.E, BR.W, { r: [32, 27, 23], handPose: 'palm', handAng: 0, hs: 0.9, handScale: 0.85, outward: 1, ...sk });
  const pp = { head: [540, 690], tilt: 0, breath: 0, lid: 0.3, lookX: 0, browL: 0, browR: 0, viseme: 'X', earSwing: 0, noTilak: true, noConch: true,
    armL: { S: [392, 950], E: [318, 1075], W: [292, 1192] }, armR: { S: [690, 945], E: [770, 1050], W: [700, 1150], hand: 'rest' }, ...p };
  if (!pp.armR.handAng) pp.armR = { ...pp.armR, handAng: Math.atan2(pp.armR.W[1] - pp.armR.E[1], pp.armR.W[0] - pp.armR.E[0]) + (pp.armR.hand === 'rest' ? -Math.PI / 2 : Math.PI / 2) };
  const body = withLook(() => V.drawSeated(pp));
  return lotusSeat() + backArms + floatProp('vedas', BL.W[0], BL.W[1] - 110, t) + floatProp('kamandalu', BR.W[0], BR.W[1] - 110, t) + body + beard(pp) + (p.stampAt ? stamp(p.stampAt) : '');
}
function tokenDisplay(n = 8) {
  return `<line x1="905" y1="0" x2="905" y2="120" stroke="#555" stroke-width="8"/><rect x="790" y="120" width="230" height="170" rx="14" fill="#1c1c26" stroke="${E.INK}" stroke-width="${WT.sil}"/>` +
    `<text x="905" y="160" font-family="Arial" font-weight="700" font-size="28" text-anchor="middle" fill="#fff">NOW SERVING</text><text x="905" y="272" font-family="Courier New, monospace" font-weight="700" font-size="120" text-anchor="middle" fill="#ff4a3a">${n}</text>`;
}
function desk() { // small floating cloud-desk with files, in front of the lotus
  return `<rect x="150" y="1330" width="780" height="70" rx="20" fill="#9b7650" stroke="${E.INK}" stroke-width="${WT.sil}"/><rect x="190" y="1400" width="700" height="150" fill="#7b5a3c" stroke="${E.INK}" stroke-width="${WT.mid}"/>` +
    `<text x="540" y="1495" font-family="Arial Black, Arial" font-weight="900" font-size="54" text-anchor="middle" fill="#f3d27a" stroke="${E.INK}" stroke-width="2.5">TOKEN COUNTER</text>` +
    `<rect x="210" y="1296" width="150" height="40" fill="#fbfaf4" stroke="${E.INK}" stroke-width="4"/><rect x="216" y="1284" width="150" height="40" fill="#fbfaf4" stroke="${E.INK}" stroke-width="4"/>`;
}
module.exports = { C, draw, tokenDisplay, desk };
