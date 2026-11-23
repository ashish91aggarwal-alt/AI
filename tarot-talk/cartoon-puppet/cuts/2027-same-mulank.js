// Film: Same Mulank, alag saal — 2026 → 2027 (v7.2, about 64 s).
// Sakshi's feedback (23 Nov): Vishnu ji leads and explains, Sakshi is his assistant (+ CTA), Monty has the gags.
// Owner (17:40 IST): the personal-year maths runs on a BIG SCREEN on the rooftop; no "climax" meme.
// Beat times are read from videos/<slug>/script.json, so a re-voiced line re-times the cut by itself.
const path = require('path');
const K = require('../kit');
const { E, L, M, SD, clamp, ease, backOut, vp, mp, kp, vishnu, monty, sakshi, cam, txt, tag, pill, rainCloud, bricks, terraceScene } = K;
const S = require(path.join(K.VID, 'script.json')).beats;
const B = id => S.find(b => b.id === id), at = (id, f = 0) => { const b = B(id); return b.start + (b.end - b.start) * f; };
const DUR = S[S.length - 1].end;

const seq = (t, list) => { let p = list[0][1]; for (const [t0, q] of list) if (t >= t0) p = q; return p; };
const push = (body, t, t0, k = 0.02, cx = 540, cy = 900) => cam(body, cx, cy, 1 + k * Math.max(0, t - t0));
const pop = (t, t0, d = 0.3) => backOut(clamp((t - t0) / d));

// ---------- Monty faces (face fields + arms reused from his approved poses) ----------
const relaxL = mp(0).armL, chestR = mp(7).armR, buckle = { legL: mp(2).legL, legR: mp(2).legR };
const arm = (S0, E2, W, hand) => ({ S: S0, E: E2, W, hand, handAng: M.along(E2, W) + (hand === 'relax' ? -Math.PI / 2 : Math.PI / 2) });
const shrug = { ...mp(0), mouthShape: 'o', brow: 0.9, browUp: 0.8, tilt: 8, lookX: 10, sweat: 0, armL: arm([425, 925], [360, 1060], [300, 1010], 'palm'), armR: arm([655, 925], [720, 1060], [780, 1010], 'palm') };
const jealous = { ...mp(0), mouthShape: 'pout', brow: 1.25, browUp: 0, lookX: -24, lookY: 10, tilt: -7, blush: 0.35, eye: { irisR: 28, pupil: 13, lid: 0.32, lidTilt: -0.25, hl: 2 } };
const hurt = { ...mp(6), mouthShape: 'wavy', eye: { irisR: 26, pupil: 11, hl: 2, watery: 1, shake: 0.6 }, tears: 0, armL: relaxL, armR: chestR, ...buckle };
const damage = { ...mp(6), armL: relaxL, armR: chestR, ...buckle };
const tremble = { ...mp(0), mouthShape: 'wavy', brow: 1.4, eye: { irisR: 26, pupil: 11, hl: 2, watery: 1, shake: 0.5 }, lookX: -20, sweat: 0.3 };
const listen = { ...mp(0), mouthShape: 'o', brow: 0.3, browUp: 0.5, lookX: -22, lookY: -10, tilt: 5, sweat: 0 };
const hopeful = { ...mp(4), fx: [], lookX: -18, lookY: -14 };

// ---------- Sakshi faces (assistant) ----------
const sReady = { ...kp(2), browUp: 0.6, blush: 0.6, lookX: -10 };
const sAww = { ...kp(2), browSad: 1, mouth: 'pout', tilt: 8, lookX: 22, blush: 0.4 };
const sGiggle = { ...kp(4), blush: 0.8, tilt: -5 };
const sFriendly = { ...kp(2), browUp: 0.4, blush: 0.5 };
const sWink = { ...kp(3), blush: 0.7 };

// ---------- the big screen (rooftop LED screen, code-drawn) ----------
function screen(t, inner, on = 1) {
  const k = clamp(on);
  return `<g><rect x="96" y="262" width="22" height="620" fill="#2a2338" stroke="#1b1422" stroke-width="6"/><rect x="842" y="262" width="22" height="620" fill="#2a2338" stroke="#1b1422" stroke-width="6"/>` +
    `<rect x="70" y="270" width="820" height="520" rx="22" fill="#1b1422"/><rect x="88" y="288" width="784" height="484" rx="14" fill="${k > 0.5 ? '#14204a' : '#0b0d18'}"/>` +
    `<rect x="88" y="288" width="784" height="484" rx="14" fill="#5aa7ff" opacity="${(0.12 * k).toFixed(2)}"/>` +
    (k > 0.5 ? `<g>${inner}</g>` : '') + `<circle cx="480" cy="760" r="6" fill="${k > 0.5 ? '#7dff8a' : '#444'}"/></g>`;
}
const W = (x, y, s, str, col = '#ffffff', size = 60) => txt(x, y, s, str, col, size);
function profiles(t, t0, nWoh = '', nTum = '', colW = '#ffd24a', colT = '#ffd24a') { // two profile tiles with silhouette faces
  const tile = (x, name, date, n, col, k) => `<g transform="translate(${x} 480) scale(${k})"><rect x="-170" y="-150" width="340" height="300" rx="20" fill="#fff8e8" stroke="#1b1422" stroke-width="7"/>` +
    `<circle cx="0" cy="-70" r="46" fill="#7a6a8c"/><path d="M-80 10 Q0 -40 80 10 L80 20 L-80 20 Z" fill="#7a6a8c"/>` +
    `<text x="0" y="68" font-family="Arial Black,Arial" font-weight="900" font-size="40" text-anchor="middle" fill="#1b1422">${name}</text>` +
    `<text x="0" y="114" font-family="Arial Black,Arial" font-weight="900" font-size="34" text-anchor="middle" fill="#c62b34">${date}</text>` +
    (n ? `<g transform="translate(120 -110) scale(${pop(t, t0 + 0.2)})"><circle r="46" fill="${col}" stroke="#1b1422" stroke-width="6"/><text y="17" font-family="Arial Black,Arial" font-weight="900" font-size="50" text-anchor="middle" fill="#1b1422">${n}</text></g>` : '') + '</g>';
  return tile(290, 'WOH', '12 APRIL', nWoh, colW, pop(t, t0)) + tile(670, 'TUM', '3 MARCH', nTum, colT, pop(t, t0 + 0.15));
}
function sumLine(t, t0, y, label, parts, total, col = '#ffd24a') { // builds "1+2+4+1 = 8" piece by piece
  if (t < t0) return ''; const shown = parts.slice(0, Math.min(parts.length, 1 + Math.floor((t - t0) / 0.45)));
  const done = t > t0 + parts.length * 0.45;
  return W(250, y, 1, label, '#ffffff', 44) + W(620, y, 1, shown.join('+') + (done ? ` = ${total}` : ''), done ? col : '#ffffff', 60);
}
function screenAt(t) { // what the big screen shows over the whole film
  if (t < at('K05', 0.25)) return '';
  if (t < at('V06')) return profiles(t, at('K05', 0.25), 3, 3, '#b9a7ff', '#b9a7ff') + W(480, 728, 1, 'DONO KA MULANK 3', '#b9a7ff', 46);
  if (t < at('V07')) return W(480, 420, 1, 'DATE + MONTH + SAAL', '#ffd24a', 66) + (t > at('V06', 0.5) ? W(480, 560, 1, '2026 = 2+0+2+6 = 10 → 1', '#ffffff', 56) : '') + (t > at('V06', 0.75) ? W(480, 680, 1, 'Single digit tak jodo!', '#7dff8a', 46) : '');
  if (t < at('V08')) return W(480, 360, 1, 'PERSONAL YEAR 2026', '#b9a7ff', 44) + sumLine(t, at('V07', 0.03), 500, 'WOH 12/4', ['1', '2', '4', '1'], 8) + sumLine(t, at('V07', 0.42), 650, 'TUM 3/3', ['3', '3', '1'], 7, '#7fb4ea');
  if (t < at('FLIP')) return W(480, 360, 1, 'IN NUMEROLOGY', '#b9a7ff', 46) + W(480, 500, 1, '8 = RESULT KA SAAL', '#ffd24a', 60) + (t > at('V08', 0.48) ? W(480, 640, 1, '7 = KHUD PE KAAM', '#7fb4ea', 60) : '');
  if (t < at('V11')) { const u = clamp((t - at('FLIP', 0.25)) / 0.6); // the 2026 page tears off and falls away, 2027 underneath
    return W(480, 600, 1, '2027', '#7dff8a', 220) + `<g transform="translate(${(60 * u).toFixed(1)} ${(900 * u * u).toFixed(1)}) rotate(${(-25 * u).toFixed(1)} 480 300)" opacity="${(1 - u).toFixed(2)}"><rect x="110" y="300" width="740" height="460" rx="10" fill="#fff8e8" stroke="#1b1422" stroke-width="7"/>${W(480, 600, 1, '2026', '#c62b34', 220)}</g>`; }
  if (t < at('V12')) return W(480, 380, 1, '2027 = 2+0+2+7 = 11 → 2', '#ffffff', 50) + sumLine(t, at('V11', 0.15), 530, 'TUM 3/3', ['3', '3', '2'], 8) + sumLine(t, at('V11', 0.45), 670, 'WOH 12/4', ['1', '2', '4', '2'], 9, '#7fb4ea');
  if (t < at('V14')) return W(480, 360, 1, 'IN NUMEROLOGY', '#b9a7ff', 46) + W(480, 500, 1, '9 = SAFAI KA SAAL', '#7fb4ea', 58) + (t > at('V12', 0.45) ? W(480, 640, 1, '8 = MEHNAT KA RESULT', '#ffd24a', 56) : '') + (t > at('V12', 0.8) ? W(480, 740, 1, 'Lottery nahi!', '#ff7a9a', 44) : '');
  if (t < at('K15')) return W(480, 470, 1, 'MULANK = TUM KAUN HO', '#ffd24a', 54) + (t > at('V14', 0.45) ? W(480, 620, 1, 'PERSONAL YEAR = MAUSAM', '#7dff8a', 52) : '');
  return W(480, 470, 1, 'SEND IT TO SOMEONE', '#ffffff', 60) + W(480, 560, 1, 'WHO NEEDS IT', '#ffffff', 60) + (t > at('K15', 0.5) ? `<g transform="translate(480 680) scale(${pop(t, at('K15', 0.5))})"><rect x="-330" y="-50" width="660" height="90" rx="45" fill="#ffd24a" stroke="#1b1422" stroke-width="6"/><text x="0" y="16" font-family="Arial" font-weight="700" font-size="42" text-anchor="middle" fill="#1b1422">COMPLETE GUIDE → LINK</text></g>` : '');
}
const SCR = t => screen(t, screenAt(t), (t - at('K05', 0.1)) / 0.15);

// classroom wide: screen above; Vishnu ji left, Sakshi middle under the screen, Monty right
const room = (t, vpose, kpose, mpose) => terraceScene(t, SCR(t) + (vpose ? vishnu(vpose, 230, 1260, 0.55, t) : '') + (kpose ? sakshi(kpose, 545, 1300, 0.58, t) : '') + (mpose ? monty(mpose, 805, 1300, 0.58, t) : ''));
// the friend's story on Monty's phone (hook)
const phone = (t, t0) => `<g transform="translate(790 640) scale(${pop(t, t0)}) rotate(8)"><rect x="-120" y="-210" width="240" height="420" rx="34" fill="#22222c" stroke="#1b1422" stroke-width="9"/><rect x="-100" y="-180" width="200" height="350" rx="16" fill="#ffd7e6"/>` +
  `<path d="M-70 40 L-50 0 L40 0 L64 40 Z" fill="#d22f48" stroke="#1b1422" stroke-width="5"/><rect x="-80" y="38" width="160" height="40" rx="12" fill="#d22f48" stroke="#1b1422" stroke-width="5"/><circle cx="-46" cy="84" r="16" fill="#1b1422"/><circle cx="46" cy="84" r="16" fill="#1b1422"/>` +
  `<text x="0" y="-100" font-family="Arial Black,Arial" font-weight="900" font-size="40" text-anchor="middle" fill="#1b1422">2026 ✓</text><text x="0" y="140" font-family="Arial" font-size="26" text-anchor="middle" fill="#1b1422">new car!</text></g>`;
const hook = () => `<rect x="70" y="270" width="790" height="120" rx="24" fill="#1b1422" opacity="0.88"/>` + txt(465, 352, 1, 'SAME MULANK, ALAG KISMAT?', '#ffd24a', 52);

const SHOTS = [
  [0, at('MEME1'), t => ({ ...terraceScene(t, push(monty(seq(t, [[0, jealous], [at('M01', 0.55), mp(4)]]), 400, 1120, 0.9, t), t, 0) + phone(t, 0)), over: hook() })],
  [at('MEME1'), at('V03'), t => terraceScene(t, cam(monty(seq(t, [[at('MEME1'), hurt], [at('MEME1', 0.55), damage]]), 540, 1120, 0.95, t), 540, 820, 1.12))],
  [at('V03'), at('M04'), t => terraceScene(t, push(vishnu(seq(t, [[at('V03'), vp(5)], [at('V03', 0.25), vp(2)], [at('V03', 0.75), vp(4)]]), 540, 1080, 0.9, t), t, at('V03')))],
  [at('M04'), at('K05'), t => terraceScene(t, cam(monty(seq(t, [[at('M04'), shrug], [at('M04', 0.5), { ...shrug, mouthShape: 'nervous', tilt: -8 }]]), 540, 1120, 0.95, t), 540, 900, 1.06))],
  [at('K05'), at('V06'), t => room(t, vp(0), sReady, listen)],
  [at('V06'), at('V07'), t => room(t, seq(t, [[at('V06'), vp(4)], [at('V06', 0.45), vp(2)]]), sFriendly, listen)],
  [at('V07'), at('V08'), t => room(t, seq(t, [[at('V07'), vp(2)], [at('V07', 0.72), vp(4)]]), seq(t, [[at('V07'), sFriendly], [at('V07', 0.72), sAww]]), seq(t, [[at('V07'), listen], [at('V07', 0.3), jealous], [at('V07', 0.55), tremble]]))],
  [at('V08'), at('M09'), t => room(t, vp(2), seq(t, [[at('V08'), sFriendly], [at('V08', 0.5), sAww]]), seq(t, [[at('V08'), jealous], [at('V08', 0.5), tremble]]))],
  [at('M09'), at('FLIP'), t => ({ ...terraceScene(t, cam(monty(mp(6), 540, 1120, 0.95, t), 540, 900, 1.05)), over: rainCloud(t, 540, 330) })],
  [at('FLIP'), at('V11'), t => room(t, vp(4), sReady, hopeful)],
  [at('V11'), at('V12'), t => room(t, seq(t, [[at('V11'), vp(2)], [at('V11', 0.6), vp(5)]]), sFriendly, seq(t, [[at('V11'), hopeful], [at('V11', 0.55), mp(5)]]))],
  [at('V12'), at('M13'), t => ({ ...room(t, vp(2), sFriendly, seq(t, [[at('V12'), mp(5)], [at('V12', 0.55), listen]])), over: t > at('V12', 0.55) ? bricks(t, at('V12', 0.55)) : '' })],
  [at('M13'), at('MEME3'), t => terraceScene(t, cam(monty(mp(1), 540, 1120, 0.95, t), 540, 800, 1.1 + 0.25 * ease(clamp((t - at('M13')) / 0.25))))],
  [at('MEME3'), at('V14'), t => terraceScene(t, push(vishnu(vp(1), 330, 1150, 0.66, t) + monty({ ...mp(2), fx: [] }, 790, 1220, 0.7, t), t, at('MEME3'), 0.04))],
  [at('V14'), at('K15'), t => terraceScene(t, SCR(t) + push(vishnu({ ...vp(0), lid: 0.12, mouthShape: 'cat', browL: 0.3, browR: 0.3 }, 480, 1250, 0.72, t), t, at('V14')))],
  [at('K15'), B('endcard').start, t => terraceScene(t, SCR(t) + sakshi(seq(t, [[at('K15'), sFriendly], [at('K15', 0.55), sWink]]), 480, 1270, 0.66, t))],
  [B('endcard').start, DUR, t => ({ ...terraceScene(t, sakshi(sWink, 330, 1230, 0.66, t) + monty({ ...mp(5), armR: mp(0).armR }, 730, 1230, 0.66, t)), over: `<rect x="70" y="270" width="830" height="190" rx="24" fill="#1b1422" opacity="0.88"/>` + txt(485, 345, 1, 'Send to someone who needs it', '#ffffff', 44) + txt(485, 420, 1, 'Complete guide: link', '#ffd24a', 50) })],
];
// close the gaps between beats: each shot holds until the next one starts
SHOTS.forEach((s, i) => { if (SHOTS[i + 1]) s[1] = SHOTS[i + 1][0]; });
module.exports = K.film(SHOTS, DUR);
