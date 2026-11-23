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
const counting = { ...mp(0), mouthShape: 'o', brow: 0.4, browUp: 0.5, lookX: -20, lookY: -12, tilt: 5, armR: mp(1).armR };
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
const sProud = { ...kp(4), blush: 0.7, mouth: 'grin' };
const sOoh = { ...kp(2), browUp: 1, lid: 0, blush: 0.7, lookX: -14 };
const sPress = { ...kp(2), browUp: 0.6, blush: 0.6, lookX: -6, lookY: -18, armR: { E: [790, 1000], W: [840, 880], hand: 'point' } };   // switches the big screen on
// Vishnu ji: no winks (owner: too much one-eye shutting); teacher pointer, laugh, raised brows
const vPointer = { ...vp(4), wink: 0, lid: 0.2, browL: 0.6, browR: 1, mouthShape: 'smileBig' };
const vPoint = { ...vp(1), wink: 0, lid: 0.18, browL: 0.9, browR: 0.6 };
const vTalk = { ...vp(2) };
const vLaugh = { ...vp(5) };
const vWarm = { ...vp(0), lid: 0.12, mouthShape: 'cat', browL: 0.3, browR: 0.3 };

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
function calcRow(t, t0, y, who, bday, parts, total, col = '#ffd24a') {
  // e.g. WOH · 12 APRIL  →  [1+2] + [4] + [1] = 8, each part with a small tag (date / month / saal)
  if (t < t0) return ''; const step = 0.55, n = Math.min(parts.length, 1 + Math.floor((t - t0) / step)), done = t > t0 + parts.length * step;
  let o = W(480, y, 1, `${who} · ${bday}`, '#ffffff', 40); const x0 = 210, dx = 175;
  parts.slice(0, n).forEach(([v, lab], k) => { const x = x0 + k * dx; o += (k ? W(x - dx / 2, y + 78, 1, '+', '#ffffff', 52) : '') + W(x, y + 78, 1, v, '#ffffff', 56) + W(x, y + 118, 1, lab, '#b9a7ff', 26); });
  if (done) o += W(x0 + parts.length * dx - 40, y + 78, 1, `= ${total}`, col, 64);
  return o;
}
const YEAR = t => (t < at('FLIP', 0.55) ? '2026' : '2027');
function screenBody(t) {
  if (t < at('V07')) return profiles(t, at('V06', 0.05), 3, 3, '#b9a7ff', '#b9a7ff').replace(/translate\((\d+) 480\)/g, 'translate($1 450)') + (t > at('V06', 0.45) ? `<rect x="110" y="640" width="740" height="110" rx="16" fill="#0b1230"/>` + W(480, 690, 1, 'DATE + MONTH + SAAL', '#ffd24a', 46) + W(480, 738, 1, '2026 → 2+0+2+6 = 10 → 1', '#ffffff', 36) : '');
  if (t < at('V08')) return calcRow(t, at('V07', 0.02), 390, 'WOH', '12 APRIL', [['1+2', 'date 12'], ['4', 'April'], ['1', '2026 → 1']], 8) + calcRow(t, at('V07', 0.42), 590, 'TUM', '3 MARCH', [['3', 'date 3'], ['3', 'March'], ['1', '2026 → 1']], 7, '#7fb4ea');
  if (t < at('FLIP')) return W(480, 400, 1, 'IN NUMEROLOGY', '#b9a7ff', 46) + W(480, 520, 1, '8 = RESULT KA SAAL', '#ffd24a', 60) + (t > at('V08', 0.48) ? W(480, 650, 1, '7 = KHUD PE KAAM', '#7fb4ea', 60) : '');
  if (t < at('V11')) { const u = clamp((t - at('FLIP', 0.25)) / 0.6);
    return W(480, 640, 1, '2027', '#7dff8a', 220) + `<g transform="translate(${(60 * u).toFixed(1)} ${(900 * u * u).toFixed(1)}) rotate(${(-25 * u).toFixed(1)} 480 300)" opacity="${(1 - u).toFixed(2)}"><rect x="110" y="300" width="740" height="460" rx="10" fill="#fff8e8" stroke="#1b1422" stroke-width="7"/>${W(480, 640, 1, '2026', '#c62b34', 220)}</g>`; }
  if (t < at('V12')) return calcRow(t, at('V11', 0.2), 410, 'TUM', '3 MARCH', [['3', 'date 3'], ['3', 'March'], ['2', '2027 → 2']], 8) + calcRow(t, at('V11', 0.55), 590, 'WOH', '12 APRIL', [['1+2', 'date 12'], ['4', 'April'], ['2', '2027 → 2']], 9, '#7fb4ea');
  if (t < at('V14')) return W(480, 400, 1, 'IN NUMEROLOGY', '#b9a7ff', 46) + W(480, 510, 1, '9 = SAFAI KA SAAL', '#7fb4ea', 58) + (t > at('V12', 0.45) ? W(480, 630, 1, '8 = MEHNAT KA RESULT', '#ffd24a', 56) : '') + (t > at('V12', 0.8) ? W(480, 730, 1, 'Lottery nahi!', '#ff7a9a', 46) : '');
  if (t < at('K15')) return W(480, 480, 1, 'MULANK = TUM KAUN HO', '#ffd24a', 54) + (t > at('V14', 0.45) ? W(480, 630, 1, 'PERSONAL YEAR = MAUSAM', '#7dff8a', 52) : '');
  return W(480, 470, 1, 'MULANK KA KEEDA?', '#ffd24a', 64) + W(480, 560, 1, 'USKO BHEJO!', '#ffffff', 60) + (t > at('K15', 0.5) ? `<g transform="translate(480 680) scale(${pop(t, at('K15', 0.5))})"><rect x="-330" y="-50" width="660" height="90" rx="45" fill="#ffd24a" stroke="#1b1422" stroke-width="6"/><text x="0" y="16" font-family="Arial" font-weight="700" font-size="42" text-anchor="middle" fill="#1b1422">COMPLETE GUIDE → LINK</text></g>` : '');
}
// the year header is ALWAYS on the board (owner): PERSONAL YEAR 2026 until the flip, 2027 after
const screenAt = t => t < at('V06', 0.05) ? '' : `<rect x="88" y="288" width="784" height="62" rx="14" fill="#2a1f5c"/>` + W(480, 334, 1, `PERSONAL YEAR ${YEAR(t)}`, YEAR(t) === '2026' ? '#ffd24a' : '#7dff8a', 40) + screenBody(t);
const SCR = t => screen(t, screenAt(t), (t - at('V06')) / 0.15);

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
  [at('V03'), at('M04'), t => terraceScene(t, push(vishnu(seq(t, [[at('V03'), vLaugh], [at('V03', 0.25), vTalk], [at('V03', 0.7), vPointer]]), 540, 1080, 0.9, t), t, at('V03')))],
  [at('M04'), at('V06'), t => terraceScene(t, cam(monty(seq(t, [[at('M04'), shrug], [at('M04', 0.5), { ...shrug, mouthShape: 'nervous', tilt: -8 }]]), 540, 1120, 0.95, t), 540, 900, 1.06))],
  [at('V06'), at('V07'), t => room(t, seq(t, [[at('V06'), vPointer], [at('V06', 0.45), vTalk]]), seq(t, [[at('V06'), sPress], [at('V06', 0.3), sFriendly]]), seq(t, [[at('V06'), listen], [at('V06', 0.5), counting]]))],
  [at('V07'), at('V08'), t => room(t, seq(t, [[at('V07'), vPoint], [at('V07', 0.3), vTalk], [at('V07', 0.72), vLaugh]]), seq(t, [[at('V07'), sFriendly], [at('V07', 0.3), sOoh], [at('V07', 0.72), sAww]]), seq(t, [[at('V07'), counting], [at('V07', 0.3), jealous], [at('V07', 0.55), tremble], [at('V07', 0.72), damage]]))],
  [at('V08'), at('M09'), t => room(t, seq(t, [[at('V08'), { ...vTalk, browL: 0.9 }], [at('V08', 0.5), vWarm]]), seq(t, [[at('V08'), sOoh], [at('V08', 0.5), sAww]]), seq(t, [[at('V08'), jealous], [at('V08', 0.5), tremble]]))],
  [at('M09'), at('FLIP'), t => ({ ...terraceScene(t, cam(monty(mp(6), 540, 1120, 0.95, t), 540, 900, 1.05)), over: rainCloud(t, 540, 330) })],
  [at('FLIP'), at('V11'), t => room(t, vPointer, sOoh, hopeful)],
  [at('V11'), at('V12'), t => room(t, seq(t, [[at('V11'), vTalk], [at('V11', 0.6), vPoint]]), seq(t, [[at('V11'), sFriendly], [at('V11', 0.55), sOoh]]), seq(t, [[at('V11'), hopeful], [at('V11', 0.55), mp(5)]]))],
  [at('V12'), at('M13'), t => ({ ...room(t, seq(t, [[at('V12'), vTalk], [at('V12', 0.8), vLaugh]]), seq(t, [[at('V12'), sFriendly], [at('V12', 0.8), sGiggle]]), seq(t, [[at('V12'), mp(5)], [at('V12', 0.55), listen]])), over: t > at('V12', 0.55) ? bricks(t, at('V12', 0.55)) : '' })],
  [at('M13'), at('MEME3'), t => terraceScene(t, cam(monty(mp(1), 540, 1120, 0.95, t), 540, 800, 1.1 + 0.25 * ease(clamp((t - at('M13')) / 0.25))))],
  [at('MEME3'), at('V14'), t => terraceScene(t, push(vishnu(vPoint, 330, 1150, 0.66, t) + monty({ ...mp(2), fx: [] }, 790, 1220, 0.7, t), t, at('MEME3'), 0.04))],
  [at('V14'), at('K15'), t => terraceScene(t, SCR(t) + push(vishnu(vWarm, 480, 1250, 0.72, t), t, at('V14')))],
  [at('K15'), B('endcard').start, t => terraceScene(t, SCR(t) + sakshi(seq(t, [[at('K15'), sFriendly], [at('K15', 0.5), sProud]]), 480, 1270, 0.66, t))],
  [B('endcard').start, DUR, t => ({ ...terraceScene(t, sakshi(sProud, 330, 1230, 0.66, t) + monty({ ...mp(5), armR: mp(0).armR }, 730, 1230, 0.66, t)), over: `<rect x="70" y="270" width="830" height="190" rx="24" fill="#1b1422" opacity="0.88"/>` + txt(485, 345, 1, 'Mulank ka keeda? Usko bhejo!', '#ffffff', 44) + txt(485, 420, 1, 'Complete guide: link', '#ffd24a', 50) })],
];
// close the gaps between beats: each shot holds until the next one starts
SHOTS.forEach((s, i) => { if (SHOTS[i + 1]) s[1] = SHOTS[i + 1][0]; });
module.exports = K.film(SHOTS, DUR);
