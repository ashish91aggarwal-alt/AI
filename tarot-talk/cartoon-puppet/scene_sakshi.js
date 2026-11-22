// Sakshi test performance (8 s): idle, wave + talk, cards appear by magic, point + wink, proud.
// Every move is through her own joints: shoulder/elbow/wrist arms, head tilt on the neck, breathing torso, swinging ponytail.
const E = require('./engine'), S = require('./char_sakshi');
const { clamp, ease, backOut, track } = E;
const DUR = 8;
const ARM = {
  Lrest: { E: [384, 1080], W: [400, 1210], hand: 'relax' }, Lwave: { E: [300, 1030], W: [250, 930], hand: 'palm' }, Lproud: { E: [330, 1020], W: [440, 1080], hand: 'relax' },
  Rrest: { E: [696, 1080], W: [680, 1210], hand: 'relax' }, Rcards: { E: [770, 1010], W: [820, 900], hand: 'palm' }, Rpoint: { E: [790, 1000], W: [840, 880], hand: 'point' }, Rproud: { E: [750, 1020], W: [640, 1080], hand: 'relax' },
};
// keys: [startTime, poseName]; each change takes MOVE s, with a small overshoot on the way up and a little lag on the wrist
const MOVE = 0.42;
function armAt(keys, t) {
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const cur = ARM[keys[i][1]], prev = i > 0 ? ARM[keys[i - 1][1]] : cur;
  const u = clamp((t - keys[i][0]) / MOVE), ue = backOut(u), uw = backOut(clamp((t - keys[i][0] - 0.06) / MOVE)); // wrist follows the elbow (overlap)
  const L = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  return { E: L(prev.E, cur.E, ue), W: L(prev.W, cur.W, uw), hand: u > 0.5 ? cur.hand : prev.hand };
}
const LK = [[0, 'Lrest'], [1.4, 'Lwave'], [2.9, 'Lrest'], [6.4, 'Lproud']];
const RK = [[0, 'Rrest'], [3.0, 'Rcards'], [5.0, 'Rpoint'], [6.4, 'Rproud']];
function talkAt(t) { // mouth flaps only inside speech windows
  const on = (t > 1.55 && t < 2.85) || (t > 5.15 && t < 6.3);
  return on ? clamp(0.15 + 0.55 * Math.abs(Math.sin(t * 9.3) * Math.sin(t * 4.1 + 1))) : 0;
}
const tiltK = [[0, 0], [1.3, 0], [1.6, -5], [2.8, 4], [3.1, 4], [3.4, -6], [4.9, -6], [5.2, 6], [6.3, -5], [6.6, 5], [8, 4]];
function pose(t) {
  const tilt = track(tiltK, t) + Math.sin(t * 1.7) * 1.2, vel = (track(tiltK, t) - track(tiltK, t - 0.12)) / 0.12;
  const L = armAt(LK, t), R = armAt(RK, t);
  if (t > 1.4 + MOVE && t < 2.9) { const w = Math.sin((t - 1.4) * 13); L.W = [L.W[0] + w * 34, L.W[1] + Math.abs(w) * 6]; } // the wave: forearm swings about the elbow
  const blink = [0.9, 4.4, 7.2].some(b => t > b && t < b + 0.12);
  const p = { t, breath: Math.sin(t * 2.2), tilt, armL: L, armR: R, talk: talkAt(t), mouth: 'smile', lookX: 0, braidSwing: Math.sin(t * 2.4) * 0.35 - vel * 0.04, jhumka: Math.sin(t * 5) * 4 - vel * 0.6 };
  if (t > 3.0 && t < 5.0) { p.browLift = 1; p.mouth = 'smirk'; p.lookX = 14; p.lid = 0.25; }
  if (t > 5.05 && t < 6.4) { p.wink = 1; p.browLift = -1; }
  if (t > 6.5) { p.happy = 1; p.mouth = 'smile'; }
  if (blink && !p.wink && !p.happy) p.blink = 1;
  // cards: pop in by magic near the open palm, bob, then fade out as she switches to the point
  const ci = backOut(clamp((t - 3.15) / 0.35)), co = 1 - ease(clamp((t - 4.85) / 0.25));
  if (t > 3.15 && t < 5.1) p.cards = { x: 760 + Math.sin(t * 3) * 6, y: 1000 + Math.sin(t * 2.4) * 10, s: 0.8 * ci * co, glow: 0.6 + 0.4 * Math.sin(t * 6), spread: 0.6 + 0.4 * ci, ang: Math.sin(t * 2) * 0.05 };
  return p;
}
function svg(t) {
  const p = pose(t);
  let sp = ''; for (let i = 0; i < 18; i++) { const x = (i * 211) % 1080, y = 120 + (i * 137) % 1200, a = 0.25 + 0.25 * Math.sin(t * 2 + i); sp += `<circle cx="${x}" cy="${y}" r="${3 + (i % 3)}" fill="#fff" opacity="${a.toFixed(2)}"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><radialGradient id="halo"><stop offset="0" stop-color="#f6e0ff"/><stop offset="0.6" stop-color="#c79af0" stop-opacity="0.5"/><stop offset="1" stop-color="#c79af0" stop-opacity="0"/></radialGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9dcf7"/><stop offset="1" stop-color="#f6eefb"/></linearGradient></defs>
  <rect width="1080" height="1920" fill="url(#wall)"/>${sp}<rect y="1680" width="1080" height="240" fill="#d9cbe9"/>
  <ellipse cx="540" cy="1684" rx="${170 + Math.sin(t * 2.2) * 2}" ry="18" fill="#000" opacity="0.08"/>
  ${S.draw(p)}</svg>`;
}
module.exports = { DUR, svg, pose };
