// Shani dev performance test (6 s): idle -> "haazri" (arm raise, trishul lifts and THUMPS, eyes flare)
// -> half-nod -> crow KAA -> "Hisaab" (register rises glowing, halo brightens). Moves only through joints; props move by his power.
const E = require('./engine'), S = require('./char_shani');
const { track, lerp, clamp } = E;
const DUR = 6;
const sm = x => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));
function armAt(k, hand) { // k: 0 = hanging, 1 = raised palm
  const E0 = [752, 1130], W0 = [770, 1265], E1 = [805, 1000], W1 = [860, 885];
  const dip = Math.sin(Math.PI * clamp(k * 3)) * (k < 0.33 ? 14 : 0); // tiny anticipation drop
  return { E: [lerp(E0[0], E1[0], k), lerp(E0[1], E1[1], k) + dip], W: [lerp(W0[0], W1[0], sm(k)), lerp(W0[1], W1[1], k) + dip], hand: k > 0.25 ? hand : 'relax' };
}
function pose(t) {
  const breath = Math.sin(t * 2.2);
  // arm raise for "haazri" (0.7-1.3), lower (2.3-2.8); raise again for "Hisaab" (4.0-4.6)
  const ka = Math.max(track([[0, 0], [0.7, 0], [1.3, 1], [2.3, 1], [2.8, 0], [6, 0]], t, sm), track([[0, 0], [4.0, 0], [4.6, 1], [6, 1]], t, sm));
  // trishul: rises with the arm, hangs, then slams down at 1.45
  const lift = t < 1.45 ? track([[0, 0], [0.8, 0], [1.35, 150], [1.45, 150]], t, sm) : track([[1.45, 150], [1.52, -8], [1.62, 4], [1.75, 0], [6, 0]], t);
  const thump = t >= 1.5 ? Math.exp(-(t - 1.5) * 9) : 0;
  const shake = thump * 10 * Math.sin(t * 90);
  const stern = track([[0, 0], [1.2, 0], [1.45, 1], [2.3, 1], [2.7, 0], [6, 0]], t);
  const nod = t > 2.7 && t < 3.5 ? Math.sin((t - 2.7) / 0.8 * Math.PI) : 0;
  const kaa = t > 3.55 && t < 3.95 ? Math.sin((t - 3.55) / 0.4 * Math.PI) : 0;
  const hisaab = track([[0, 0], [4.0, 0], [4.8, 1], [6, 1]], t, sm);
  const talkWin = (t > 0.9 && t < 1.7) || (t > 4.4 && t < 5.8);
  return {
    standing: true, breath, shake, tilt: nod * 6 + Math.sin(t * 1.3) * 1.2, head: [540, 640 + nod * 10 - breath * 2],
    eyeMood: hisaab > 0.4 ? 'hisaab' : stern > 0.5 ? 'stern' : nod > 0.25 ? 'warm' : (t > 3.5 && t < 4.1) ? 'deadpan' : 'calm', lid: 0.5 - hisaab * 0.12, stern, lookX: -24 - hisaab * 4, lookY: 8 - hisaab * 20 + nod * 6,
    mouth: nod > 0.3 ? 'smile' : 'closed', talk: talkWin ? 0.25 + 0.35 * Math.abs(Math.sin(t * 17)) : 0,
    crowTilt: -14 * nod + 10 * kaa + Math.sin(t * 3) * 4, kaa,
    glow: hisaab + thump * 0.6,
    armR: armAt(ka, 'palm'),
    trishul: { x: 880, y: 1600 - lift, ang: 0, glow: Math.max(thump, clamp(lift / 150) * 0.6) },
    register: { x: lerp(190, 250, hisaab), y: lerp(1150, 560, hisaab) + Math.sin(t * 2.5) * 8, s: lerp(0.9, 1.1, hisaab), ang: lerp(-8, 0, hisaab) + Math.sin(t * 2) * 2, glow: hisaab },
  };
}
function svg(t) {
  const p = pose(t);
  const dust = Math.abs(p.shake) > 0.6 ? [0, 1, 2, 3, 4].map(k => { const a = Math.PI * (0.1 + 0.2 * k), r = 60 + (1 - Math.abs(p.shake) / 10) * 60;
    return `<circle cx="${880 + Math.cos(a) * r * (k % 2 ? 1 : -1)}" cy="${1600 - Math.sin(a) * 26}" r="${16 - k}" fill="#c9cfe6" opacity="0.45"/>`; }).join('') : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><radialGradient id="shaniHalo"><stop offset="0" stop-color="#ffe9a8"/><stop offset="0.55" stop-color="#e9b934" stop-opacity="0.5"/><stop offset="1" stop-color="#e9b934" stop-opacity="0"/></radialGradient>
  <linearGradient id="court" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1330"/><stop offset="1" stop-color="#1a2650"/></linearGradient></defs>
  <g transform="translate(${p.shake.toFixed(1)} ${(p.shake * 0.4).toFixed(1)})">
  <rect x="-20" y="-20" width="1120" height="1960" fill="url(#court)"/>
  ${S.saturn(t, 800, 250, 82)}
  ${S.spotlight(t, 1 + p.glow * 0.4)}
  <rect x="-20" y="1700" width="1120" height="240" fill="#10183a"/>
  <g transform="translate(540 1000) scale(0.98) translate(-540 -1000)">${S.draw(p)}${dust}</g></g></svg>`;
}
module.exports = { DUR, svg, pose };
