// Batch 2 rough cut (animatic) of the Mulank 8 reel: every shot in its location with the approved cast poses, timed to
// voice_track_timed.wav. Poses are held keys (breathing, ambient motion, camera pushes); lip-sync and full acting come in Batch 3.
const E = require('./engine'), L = require('./loc');
const V = require('./char_vishnu'), M = require('./char_monty'), B = require('./char_brahma'), SH = require('./char_shani'), SK = require('./char_sakshi'), SD = require('./char_side');
const CV = require('./cast_vishnu'), CM = require('./cast_monty'), CB = require('./cast_brahma'), CS = require('./cast_shani'), CK = require('./cast_sakshi');
const CAPS = require('./captions.json');
const { clamp, ease, backOut } = E;
const TL = require('./audio/timeline_v3.json').pieces, A = require('./act');
const orig = tv => { const p = TL.find(p => tv >= p.A && tv < p.B) || TL[TL.length - 1]; return p.a + (Math.min(tv, p.B) - p.A) * (p.b - p.a) / Math.max(1e-6, p.B - p.A); };
const DUR = (() => { const p = TL.find(p => 85.67 >= p.a && 85.67 <= p.b); return p.A + (85.67 - p.a) * (p.B - p.A) / (p.b - p.a); })();
let TV = 0; // current video time (new clock) for the acting layer
const vp = i => ({ ...CV.base, ...CV.POSES[i] }), mp = i => CM.POSES[i], bp = i => CB.POSES[i], sp = i => ({ standing: true, ...CS.POSES[i] }), kp = i => CK.POSES[i];

// ---- actor placement helpers (x,y = where the character's anchor lands; s = scale) ----
const cloudSeat = () => `${L.softCloud(420, 1440, 1.3, '#f7f6f1')}${L.softCloud(660, 1450, 1.4, '#f7f6f1')}${L.softCloud(540, 1480, 1.7, '#ffffff')}`;
const vishnu = (p, x, y, s, t) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-540 -1000)">${cloudSeat()}${V.drawSeated(A.perform('vishnu', { ...p, breath: Math.sin(t * 2), t }, TV))}</g>`;
const monty = (p, x, y, s, t) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-540 -1100)">${M.draw(A.perform('monty', { ...p, t, breath: Math.sin(t * 2.6) }, TV))}</g>`;
const shani = (p, x, y, s, t) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-540 -1000)">${SH.draw(A.perform('shani', { ...p, breath: Math.sin(t * 1.4) }, TV))}</g>`;
const brahma = (p, t, side) => side ? `${B.tokenDisplay(8)}<g transform="translate(380 950) scale(0.84) translate(-540 -1080)"><g transform="translate(540 1000) scale(0.95) translate(-540 -1000)">${B.draw(A.perform('brahma', { ...p, t }, TV))}</g>${B.desk()}</g>` : `${B.tokenDisplay(8)}<g transform="translate(540 1000) scale(0.95) translate(-540 -1000)">${B.draw(A.perform('brahma', { ...p, t }, TV))}</g>${B.desk()}`;
const sakshi = (p, x, y, s, t) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-540 -1100)">${SK.draw(A.perform('sakshi', { ...p, t, breath: Math.sin(t * 2.2), braidSwing: Math.sin(t * 2.4) * 0.35 }, TV))}</g>`;
const cam = (body, cx, cy, z) => `<g transform="translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})">${body}</g>`;

// ---- graphics ----
const txt = (x, y, s, str, fill = '#fff', size = 64, extra = '') => `<text x="${x}" y="${y}" font-family="Arial Black,Arial" font-weight="900" font-size="${size * s}" text-anchor="middle" fill="${fill}" stroke="#1b1422" stroke-width="${10 * s}" paint-order="stroke" ${extra}>${str}</text>`;
function caption(tv) {
  const t = orig(tv); const c = CAPS.find(c => t >= c[1] && t < c[2]); if (!c) return '';
  const w = Math.min(930, 40 + c[0].length * 30);
  return `<rect x="${540 - w / 2}" y="1372" width="${w}" height="96" rx="20" fill="#1b1422" opacity="0.78"/>` + txt(540, 1439, 1, c[0].replace(/&/g, '&amp;'), '#ffffff', 50);
}
function tag(t, t0, str, x = 540, y = 330, col = '#ffd24a', size = 76) { if (t < t0) return ''; const k = backOut(clamp((t - t0) / 0.3)); return `<g transform="translate(${x} ${y}) scale(${k}) rotate(-4)">` + txt(0, 0, 1, str, col, size) + '</g>'; }
function pill(t, t0, str, x, y, col = '#ffd24a', size = 50) { if (t < t0) return ''; const k = backOut(clamp((t - t0) / 0.3)), w = 60 + str.length * size * 0.66;
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="${-w / 2}" y="${-size * 0.95}" width="${w}" height="${size * 1.6}" rx="${size * 0.8}" fill="#1b1422" opacity="0.9" stroke="${col}" stroke-width="5"/>` + txt(0, size * 0.2, 1, str, col, size) + '</g>'; }
function mulankCard(t, t0, x, i) {
  if (t < t0) return ''; const k = backOut(clamp((t - t0) / 0.35));
  const H = [['TU — MONTY', '17 MAR → 1+7 = 8'], ['COUSIN BUNTY', '8 AUG → 8'], ['BOSS — KHANNA SIR', '26 JUL → 2+6 = 8']][i];
  const id = 'mc' + i;
  let face = i === 0 ? `<g transform="translate(0 -60) scale(0.42) translate(-540 -700)">${M.draw({ ...mp(0), t })}</g>` :
    i === 1 ? SD.bunty({ x: 0, y: -60, s: 0.42 }) : SD.khanna({ x: 0, y: -60, s: 0.42, t, sweat: t > 15.07 ? 1 : 0, mouth: t > 15.07 ? 'nervous' : 'flat', small: t > 15.07 ? 1 : 0, browUp: t > 15.07 ? 1 : 0, frown: t > 15.07 ? -0.6 : 1 });
  return `<g transform="translate(${x} 900) scale(${k * 0.98})"><rect x="-165" y="-300" width="330" height="520" rx="26" fill="#fff8e8" stroke="#1b1422" stroke-width="9"/>` +
    `<clipPath id="${id}"><rect x="-150" y="-286" width="300" height="300" rx="18"/></clipPath><rect x="-150" y="-286" width="300" height="300" rx="18" fill="#f3d9a8"/><g clip-path="url(#${id})">${face}</g>` +
    `<text x="0" y="70" font-family="Arial Black,Arial" font-weight="900" font-size="${i === 2 ? 30 : 36}" text-anchor="middle" fill="#1b1422">${H[0]}</text>` +
    `<text x="0" y="122" font-family="Arial Black,Arial" font-weight="900" font-size="34" text-anchor="middle" fill="#c62b34">${H[1]}</text>` +
    `<circle cx="0" cy="180" r="34" fill="#efbd3a" stroke="#1b1422" stroke-width="6"/><text x="0" y="194" font-family="Arial Black,Arial" font-weight="900" font-size="40" text-anchor="middle" fill="#1b1422">8</text></g>`;
}
function phoneIncognito(t, t0) { if (t < t0) return ''; const k = backOut(clamp((t - t0) / 0.3));
  return `<g transform="translate(800 560) scale(${k}) rotate(8)"><rect x="-120" y="-210" width="240" height="420" rx="34" fill="#22222c" stroke="#1b1422" stroke-width="9"/><rect x="-100" y="-180" width="200" height="350" rx="16" fill="#3a3a4a"/>` +
    `<circle cx="-36" cy="-40" r="26" fill="none" stroke="#fff" stroke-width="9"/><circle cx="36" cy="-40" r="26" fill="none" stroke="#fff" stroke-width="9"/><line x1="-10" y1="-40" x2="10" y2="-40" stroke="#fff" stroke-width="9"/><path d="M-70 -80 L70 -80 L50 -120 L-50 -120 Z" fill="#fff"/>` +
    `<rect x="-86" y="40" width="172" height="40" rx="10" fill="#fff"/><text x="0" y="68" font-family="Arial" font-size="18" text-anchor="middle" fill="#333">7 din mein ameer kaise bane</text></g>`; }
function rainCloud(t, x, y) { let o = L.softCloud(x, y, 0.9, '#8f97a8'); for (let i = 0; i < 9; i++) { const u = (t * 1.6 + i * 0.13) % 1; o += `<line x1="${x - 110 + i * 26}" y1="${y + 70 + u * 260}" x2="${x - 116 + i * 26}" y2="${y + 100 + u * 260}" stroke="#7fb4ea" stroke-width="6" stroke-linecap="round"/>`; } return o; }
function commentBox(t, t0) { if (t < t0) return ''; const n = Math.min(6, Math.floor((t - t0) / 0.12)), k = backOut(clamp((t - t0) / 0.3));
  return `<g transform="translate(540 1270) scale(${k * 0.9})"><rect x="-380" y="-70" width="760" height="140" rx="70" fill="#fff" stroke="#1b1422" stroke-width="8"/><text x="-300" y="22" font-family="Arial Black,Arial" font-weight="900" font-size="62" fill="#1b1422">${'REPORT'.slice(0, n)}${(t * 2) % 1 < 0.5 ? '|' : ''}</text><circle cx="300" cy="0" r="46" fill="#ff3d6e"/><path d="M285 -20 L322 0 L285 20 Z" fill="#fff"/></g>`; }
function bricks(t, t0) { let o = ''; for (let i = 0; i < 8; i++) { const ti = t0 + i * 0.25; if (t < ti) break; const k = backOut(clamp((t - ti) / 0.25)); const x = 360 + (i % 4) * 120 - (Math.floor(i / 4) % 2) * 60, y = 1530 - Math.floor(i / 4) * 52;
  o += `<rect x="${x}" y="${y - (1 - k) * 200}" width="112" height="46" rx="4" fill="#b85d42" stroke="#1b1422" stroke-width="5"/>`; } return o; }
function hookBanner() { return `<rect x="70" y="150" width="940" height="230" rx="26" fill="#1b1422" opacity="0.85"/>` + txt(540, 260, 1, 'MULANK 8 WALO, SUNO!', '#ffd24a', 76) + txt(540, 340, 1, 'born on 8 • 17 • 26', '#ffffff', 48); }

// ---- scene builders: return { defs, body } ----
function terraceScene(t, actors, o = {}) { const T = L.terrace(t, o); return { defs: T.defs, body: T.back + actors + T.front }; }
function officeScene(t, actors) { const O = L.office(t); return { defs: O.defs, body: O.back + actors + O.front }; }
function courtScene(t, actors, o = {}) { const C = L.court(t, o); return { defs: C.defs, body: C.back + actors + C.front }; }
const bombCU = (t, fuse) => terraceScene(t, cam(L.sutliBomb(540, 1500, 1, t, fuse), 540, 1450, 3.2));
const twoActors = (t, vpose, mpose) => vishnu(vpose, 300, 1150, 0.62, t) + monty(mpose, 740, 1180, 0.66, t) + L.sutliBomb(540, 1660, 0.9, t, 0);
const twoShot = (t, vpose, mpose) => terraceScene(t, twoActors(t, vpose, mpose));
const focus = (body, fx, fy, z) => `<g transform="translate(540 900) scale(${z}) translate(${-fx} ${-fy})">${body}</g>`;

// shot list: [start, end, fn(t, u) -> {defs, body, over}]
const SHOTS = [
  [0, 0.55, t => ({ ...bombCU(t, 1 - t / 0.6), over: hookBanner() + monty(mp(1), 730, 1000, 0.62, t) })],
  [0.55, 3.38, t => terraceScene(t, cam(vishnu(vp(1), 380, 1080, 0.72, t), 540, 1000, 1 + 0.03 * t) + monty(mp(0), 770, 1180, 0.68, t))],
  [3.38, 4.01, t => terraceScene(t, cam(monty(mp(1), 540, 1120, 0.95, t), 540, 900, 1.1))],
  [4.01, 8.96, t => ({ ...terraceScene(t, vishnu(vp(2), 380, 1100, 0.8, t)), over: phoneIncognito(t, 5.39) })],
  [8.96, 11.15, t => terraceScene(t, cam(monty(mp(0), 540, 1120, 0.95, t), 540, 900, 1.05))],
  [11.15, 15.07, t => { const big = (t0, t1, i) => t >= t0 && t < t1 ? `<g transform="translate(540 820) scale(1.7) translate(-540 -900)">${mulankCard(t, t0, 540, i)}</g>` : '';
    const row = t >= 14.2 ? mulankCard(t, 14.2, 210, 0) + mulankCard(t, 14.25, 540, 1) + mulankCard(t, 14.3, 870, 2) + `<g transform="translate(540 1250) scale(${backOut(clamp((t - 14.5) / 0.4))})"><circle r="110" fill="#efbd3a" stroke="#1b1422" stroke-width="10"/>${txt(0, 52, 1, '8', '#1b1422', 160)}</g>` : '';
    return { ...terraceScene(t, twoActors(t, vp(0), mp(0)) + '<rect width="1080" height="1920" fill="#05040c" opacity="0.6"/>'), over: big(11.15, 12.44, 0) + big(12.44, 13.63, 1) + big(13.63, 14.2, 2) + row }; }],
  [15.07, 16.07, t => ({ ...terraceScene(t, cam(monty(mp(3), 540, 1120, 0.95, t), 540, 800, 1.1 + (t - 15.07) * 0.25)), })],
  [16.07, 18.6, t => terraceScene(t, cam(monty(mp(7), 540, 1120, 0.95, t), 540, 900, 1.05))],
  [18.6, 20.48, t => { const p = vp(4), g = backOut(clamp((t - 18.6) / 0.4)); p.chakra = { ...p.chakra, scale: p.chakra.scale * g, spin: t * (4 + 10 * clamp((t - 19.4) / 0.8)) }; return terraceScene(t, cam(vishnu(p, 540, 1080, 0.9, t), 540, 900, 1.05)); }],
  [20.48, 21.78, t => { const u = clamp((t - 20.48) / 1.1), A = terraceScene(t, vishnu(vp(4), 540, 1080, 0.9, t)), Bs = officeScene(t, brahma(bp(0), t));
    const r = 1300 * ease(u); return { defs: A.defs + Bs.defs + `<clipPath id="iris"><circle cx="540" cy="900" r="${r}"/></clipPath>`, body: A.body + `<g clip-path="url(#iris)">${Bs.body}</g>` +
      `<circle cx="540" cy="900" r="${r}" fill="none" stroke="#efbd3a" stroke-width="22" stroke-dasharray="60 30" transform="rotate(${t * 400} 540 900)"/>` }; }],
  [21.78, 24.31, t => officeScene(t, brahma(bp(1), t, 1) + monty(mp(0), 790, 1330, 0.72, t))],
  [24.31, 25.6, t => officeScene(t, brahma(bp(2), t, 1) + monty(mp(0), 790, 1330, 0.72, t))],
  [25.6, 26.66, t => ({ ...officeScene(t, brahma(bp(3), t, 1) + monty(mp(1), 790, 1330, 0.72, t)), over: pill(t, 25.75, '8 = SHANI DEV', 560, 380, '#ff6a5a', 54) })],
  [26.66, 27.26, t => { const C = courtScene(t, ''); return { defs: C.defs, body: C.body + `<rect width="1080" height="1920" fill="#000" opacity="${1 - clamp((t - 26.66) / 0.6)}"/>` }; }],
  [27.26, 29.77, t => { const p = sp(1), up = 90 * ease(clamp((t - 27.7) / 0.6)) * (t < 28.5 ? 1 : 0), hit = t >= 28.5 ? Math.exp(-(t - 28.5) / 0.18) : 0;
    p.trishul = { ...p.trishul, y: p.trishul.y - up };
    const shake = hit * 14 * Math.sin(t * 90), dust = t >= 28.5 && t < 29.3 ? `<g opacity="${(1 - (t - 28.5) / 0.8).toFixed(2)}">${[-1, 1].map(k => `<ellipse cx="${862 + k * (40 + (t - 28.5) * 160)}" cy="1660" rx="${50 + (t - 28.5) * 80}" ry="22" fill="#c9b9a0"/>`).join('')}</g>` : '';
    const C = courtScene(t, shani(p, 540, 1000, 0.98, t) + dust, { glow: hit }); return { defs: C.defs, body: `<g transform="translate(${shake.toFixed(1)} ${(shake * 0.4).toFixed(1)})">${C.body}</g>` }; }],
  [29.77, 31.85, t => courtScene(t, cam(monty(mp(2), 540, 1180, 0.9, t), 540, 1000, 1))],
  [31.85, 38.56, t => ({ ...courtScene(t, shani(sp(5), 640, 1000, 0.86, t)), over: pill(t, 33.93, 'DIET: MONDAY SE', 236, 560, '#ffd24a', 40) + pill(t, 35.58, 'SAVINGS: 0', 236, 670, '#7dff8a', 40) + pill(t, 36.74, 'NEEND: 3 AM', 236, 780, '#6ae0ff', 40) })],
  [38.56, 41.67, t => courtScene(t, cam(shani(sp(7), 540, 1000, 0.98, t), 540, 700, 1.25))],
  [41.67, 44.3, t => courtScene(t, cam(monty(mp(7), 540, 1180, 0.9, t), 540, 1000, 1))],
  [44.3, 45.88, t => ({ ...courtScene(t, cam(shani(sp(2), 540, 1000, 0.98, t), 540, 640, 1 + 0.35 * ease(clamp((t - 44.3) / 0.25)))) })],
  [45.88, 47.21, t => courtScene(t, cam(monty(mp(4), 540, 1180, 0.9, t), 540, 900, 1.05))],
  [47.21, 47.81, t => ({ ...courtScene(t, focus(`<circle cx="268" cy="900" r="150" fill="#8fa6ff" opacity="0.35"/>` + shani(sp(3), 540, 1000, 0.98, t), 280, 1080, 2.6)), over: tag(t, 47.25, 'KAA!', 300, 420, '#ffffff', 130) })],
  [47.81, 50.06, t => courtScene(t, shani(sp(3), 540, 1000, 0.98, t))],
  [50.06, 55.97, t => { const p = sp(4), u = backOut(clamp((t - 51.2) / 0.6)); p.register = { ...p.register, y: 1000 - (1000 - p.register.y) * u, glow: u };
    return courtScene(t, cam(shani(p, 540, 1000, 0.98, t), 540, 900, 1 + 0.03 * (t - 50)), { glow: 0.3 + 0.7 * u }); }],
  [55.97, 56.62, t => { const u = clamp((t - 55.97) / 0.6), A = courtScene(t, shani(sp(8), 540, 1000, 0.98, t)), Bs = terraceScene(t, monty(mp(6), 540, 1120, 0.95, t)); const r = 1300 * ease(u);
    return { defs: A.defs + Bs.defs + `<clipPath id="iris2"><circle cx="540" cy="900" r="${r}"/></clipPath>`, body: A.body + `<g clip-path="url(#iris2)">${Bs.body}</g>` }; }],
  [56.62, 59.47, t => ({ ...terraceScene(t, monty(mp(6), 540, 1120, 0.95, t)), over: rainCloud(t, 540, 330) })],
  [59.47, 60.57, t => ({ ...terraceScene(t, sakshi(kp(0), 420 + 260 * (1 - ease(clamp((t - 59.47) / 0.6))), 1180, 0.72, t) + monty(mp(6), 790, 1180, 0.7, t)), over: tag(t, 59.7, 'TOPPER ENTRY', 540, 300, '#ff7ae0') })],
  [60.57, 62.52, t => terraceScene(t, sakshi(kp(1), 540, 1150, 0.82, t))],
  [62.52, 63.69, t => terraceScene(t, cam(vishnu(vp(3), 540, 1080, 0.9, t), 540, 800, 1.15))],
  [63.69, 69.58, t => ({ ...terraceScene(t, sakshi(kp(2), 360, 1180, 0.72, t) + monty(mp(0), 780, 1180, 0.7, t)), over: tag(t, 64.3, 'DATE + MONTH + 2', 450, 330, '#ffd24a', 70) + tag(t, 66.2, '17 Mar → 1+7+3+2 = 13 → 4', 500, 440, '#fff', 50) })],
  [69.58, 71.21, t => ({ ...terraceScene(t, cam(monty(mp(5), 540, 1120, 0.95, t), 540, 900, 1)), over: tag(t, 69.8, '4', 860, 420, '#ffd24a', 260) })],
  [71.21, 73.8, t => ({ ...terraceScene(t, sakshi(kp(4), 540, 1150, 0.82, t)), over: tag(t, 71.4, '4 = NEEV KA SAAL', 540, 330, '#ffd24a', 66) + bricks(t, 71.6) })],
  [73.8, 78.47, t => ({ ...terraceScene(t, sakshi(kp(3), 540, 860, 0.66, t)), over: commentBox(t, 74.0) + txt(540, 330, 1, 'Comment karo', '#ffd24a', 92) })],
  [78.47, 79.52, t => { const u = clamp((t - 78.47) / 0.5), S0 = terraceScene(t, vishnu(vp(5), 300, 1150, 0.62, t) + monty(mp(1), 740, 1180, 0.66, t) + (u < 0.3 ? L.sutliBomb(540, 1440, 2.4, t, 1) : '')); return { ...S0, over: `<circle cx="540" cy="1440" r="${1300 * ease(u)}" fill="#fff4c0" opacity="${(1 - u) * 0.95}"/><circle cx="540" cy="1440" r="${500 * ease(u)}" fill="#ff8a2a" opacity="${(1 - u) * 0.7}"/>` + tag(t, 78.5, 'BOOM!', 540, 380, '#ff4a3a', 170) }; }],
  [79.52, 81.68, t => { const T = L.terrace(t, { dim: 0.6 }), C = L.court(t);
    return { defs: T.defs + C.defs + `<clipPath id="port"><circle cx="540" cy="720" r="420"/></clipPath>`, body: T.back + `<g clip-path="url(#port)">${C.back}${shani(sp(6), 540, 860, 0.62, t)}</g><circle cx="540" cy="720" r="420" fill="none" stroke="#efbd3a" stroke-width="26"/>` + monty(mp(2), 800, 1460, 0.55, t) }; }],
  [81.68, 83.07, t => terraceScene(t, cam(vishnu(vp(5), 540, 1080, 0.9, t), 540, 1000, 1))],
  [83.07, 85.67, t => ({ ...bombCU(t, 1), over: hookBanner() + `<rect x="190" y="440" width="700" height="130" rx="65" fill="#ff3d6e" stroke="#1b1422" stroke-width="8"/>` + txt(540, 528, 1, 'Comment REPORT', '#fff', 60) })],
];
function svg(tv) {
  const t = orig(tv); TV = tv;
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
  const r = sh[2](t), since = t - sh[0], pop = 1 + 0.04 * Math.max(0, 1 - since / 0.18);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs>${r.defs}</defs><g transform="translate(540 960) scale(${pop.toFixed(4)}) translate(-540 -960)">${r.body}${r.over || ''}</g>${caption(tv)}</svg>`;
}
module.exports = { DUR, svg, SHOTS };
