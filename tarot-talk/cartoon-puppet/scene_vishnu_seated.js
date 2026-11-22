// Scene (full body, seated on a cloud): Vishnu ji raises his finger — "Ab tu gaya beta!" — then smirks. 4 s.
const E = require('./engine');
const V = require('./char_vishnu');
const { track, backOut, lerp, rad, rot, clamp, catmull, poly } = E;

const DUR = 4;
const VIS = [[0, 'X'], [1.6, 'C'], [1.7, 'A'], [1.78, 'B'], [1.87, 'F'], [2.01, 'B'], [2.09, 'D'], [2.25, 'B'], [2.35, 'C'], [2.47, 'D'], [2.75, 'X']];

function pose(t) {
  const breath = Math.sin(t * Math.PI * 2 / 3);
  const tilt = track([[0, 0], [0.5, 0], [1.0, -8], [1.6, -5], [2.3, -6], [2.7, 3], [3.0, 1], [4, 1]], t, backOut) + (t > 1.2 && t < 2.6 ? Math.sin((t - 1.2) * Math.PI * 2 * 1.6) * 2.2 : 0);
  const smug = track([[0, 0.45], [0.6, 0.45], [0.9, 0.2], [2.6, 0.2], [3.0, 0.5], [4, 0.5]], t);
  let blink = 0; for (const b of [0.3, 2.75]) { const d = t - b; if (d >= 0 && d < 0.17) blink = Math.sin(Math.PI * d / 0.17); }
  const brow = track([[0, 0], [0.6, 0], [0.95, 1], [2.6, 0.8], [3.0, 0.15], [4, 0.15]], t, backOut);
  const raise = track([[0, 0], [0.3, 0], [0.45, -0.08], [1.75, 1.02], [1.9, 1]], t, x => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x))) - track([[0, 0], [3.2, 0], [3.9, 0.2], [4, 0.2]], t);
  const wag = t > 1.75 && t < 2.85 ? Math.sin((t - 1.75) * Math.PI * 2 * 2.2) * 9 : 0;
  const neck = [540, 905 - breath * 3];
  const head = rot([540, 690 - breath * 3], rad(tilt * 0.4), neck);
  const S = [690, 945 - breath * 3];
  const ra = clamp(raise, -0.12, 1.04); // small settle only: a big overshoot swung the hand across the face
  const lead = clamp(ra * 1.3), follow = clamp(ra, -0.12, 1.04); // upper arm leads, forearm swings up through the whole move
  const a1 = rad(lerp(80, -14, lead)), bend = lerp(70, -82, clamp(ra)), a2 = a1 + rad(bend) + rad(wag * ra); // elbow bends evenly through the whole move
  const El = [S[0] + Math.cos(a1) * 150, S[1] + Math.sin(a1) * 150], Wr = [El[0] + Math.cos(a2) * 125, El[1] + Math.sin(a2) * 125];
  let vis = 'X'; for (const [k, s] of VIS) if (t >= k) vis = s;
  return {
    breath, tilt, head, viseme: vis, lookX: track([[0, 14], [0.5, 14], [0.75, -4], [4, -4]], t),
    lid: clamp(smug + blink * (1 - smug)), browL: brow * 0.5, browR: brow,
    earSwing: Math.sin(t * 5) * 3 - tilt * 0.9,
    armL: { S: [392, 950 - breath * 3], E: [318, 1075 - breath * 2], W: [292, 1192] },
    chakra: t > 1.5 ? (() => { const tip = rot([18 * 0.72, -196 * 0.72], a2 + Math.PI / 2); const pop = clamp((t - 1.5) / 0.5); return { x: Wr[0] + tip[0] + 2, y: Wr[1] + tip[1] - 62 * pop, spin: t * 9, scale: 0.04 + 0.81 * E.backOut(pop) }; })() : null,
    armR: { S, E: El, W: Wr, hand: raise > 0.8 ? 'point' : raise > 0.55 ? 'fist' : 'relax', handAng: raise > 0.45 ? a2 + Math.PI / 2 : a2 - Math.PI / 2 },
  };
}

const CL = { sky1: '#5e9dcb', sky2: '#a9d2ec', cloud: '#f7f6f1', cloudSh: '#b9c8d8' };
function cloud(x, y, s) {
  const pts = catmull([[-170, 40], [-160, -30], [-90, -62], [-30, -115], [60, -100], [120, -46], [195, -26], [210, 46]].map(p => [x + p[0] * s, y + p[1] * s]), 10, true);
  const id = 'k' + Math.round(x) + Math.round(y);
  return `<path d="${poly(pts)}" fill="${CL.cloud}"/><clipPath id="${id}"><path d="${poly(pts)}"/></clipPath><path clip-path="url(#${id})" d="${poly(pts.map(p => [p[0] + 10 * s, p[1] + 22 * s]))}" fill="${CL.cloudSh}" opacity="0.7"/>`;
}
// Blurred layers are pre-rendered ONCE as images and just moved per frame (blur filters were 85% of render time).
const { Resvg } = require('@resvg/resvg-js');
const DEFS = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CL.sky1}"/><stop offset="0.7" stop-color="${CL.sky2}"/><stop offset="1" stop-color="#e9e4d4"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
  <filter id="dof" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="24"/></filter>`;
const png = (w, h, body) => 'data:image/png;base64,' + Buffer.from(new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${DEFS}</defs>${body}</svg>`).render().asPng()).toString('base64');
let BG, FG;
function layers() {
  if (BG) return;
  BG = png(1400, 1920, `<rect width="1400" height="1920" fill="url(#sky)"/><g filter="url(#soft)">${cloud(330, 1380, 1.7)}${cloud(1080, 1520, 1.5)}${cloud(1050, 300, 1.1)}${cloud(300, 540, 1.0)}</g>`);
  FG = png(700, 700, `<path d="${poly(catmull([[60, 290], [250, 160], [450, 210], [550, 330], [510, 560], [60, 560]], 8, true))}" fill="#f2efe6" opacity="0.85" filter="url(#dof)"/>`);
}
function seat() { // soft cloud the deity sits on (unlined, like the reference clouds)
  return `<g transform="translate(540 1000) scale(1.14) translate(-540 -1000)">${cloud(330, 1520, 1.5)}${cloud(740, 1540, 1.6)}${cloud(540, 1580, 1.9)}</g>`;
}
function svg(t) {
  layers();
  const cam = 1 + 0.035 * E.ease(t / DUR); // slow push-in
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs><radialGradient id="halo"><stop offset="0" stop-color="#fff4c4"/><stop offset="0.6" stop-color="#ffe07a" stop-opacity="0.6"/><stop offset="1" stop-color="#ffe07a" stop-opacity="0"/></radialGradient></defs>
  <g transform="translate(540 960) scale(${cam * 1.02}) translate(-540 -960)"><image href="${BG}" x="${(-160 + t * 6).toFixed(1)}" y="0" width="1400" height="1920"/></g>
  ${seat()}<g transform="translate(540 1000) scale(${cam * 1.14}) translate(-540 -1000)">${V.drawSeated(pose(t))}</g>
  <image href="${FG}" x="${(-260 - t * 14).toFixed(1)}" y="1480" width="700" height="700"/>
  </svg>`;
}
module.exports = { DUR, svg };
