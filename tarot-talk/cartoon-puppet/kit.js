// Cut kit: everything a film file (cuts/<slug>.js) needs, shared by every video.
// Characters with the acting layer on, locations, camera, on-screen text, captions, and the clock that maps the final
// voice track (with original meme clips spliced in) back to the script clock. Pick the video with VIDEO=<slug>.
const path = require('path'), fs = require('fs');
const E = require('./engine'), L = require('./loc');
const V = require('./char_vishnu'), M = require('./char_monty'), B = require('./char_brahma'), SH = require('./char_shani'), SK = require('./char_sakshi'), SD = require('./char_side');
const CV = require('./cast_vishnu'), CM = require('./cast_monty'), CB = require('./cast_brahma'), CS = require('./cast_shani'), CK = require('./cast_sakshi');
const { clamp, ease, backOut } = E;
const SLUG = process.env.VIDEO || '2027-warmup-mulank8';
const VID = path.join(__dirname, '..', 'videos', SLUG), WORK = path.join(__dirname, 'work', SLUG);
const readJ = (p, d) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : d;
const CAPS = readJ(path.join(VID, 'captions.json'), []);
const TL = readJ(path.join(WORK, 'timeline.json'), { pieces: [{ kind: 'copy', a: 0, b: 1e9, A: 0, B: 1e9 }] }).pieces;
const A = require('./act');
const orig = tv => { const p = TL.find(p => tv >= p.A && tv < p.B) || TL[TL.length - 1]; return p.a + (Math.min(tv, p.B) - p.A) * (p.b - p.a) / Math.max(1e-6, p.B - p.A); };
const toVideo = to => { const p = TL.find(p => to >= p.a && to <= p.b) || TL[TL.length - 1]; return p.A + (to - p.a) * (p.B - p.A) / Math.max(1e-6, p.b - p.a); };
let TV = 0; // current video time, read by the acting layer

const vp = i => ({ ...CV.base, ...CV.POSES[i] }), mp = i => CM.POSES[i], bp = i => CB.POSES[i], sp = i => ({ standing: true, ...CS.POSES[i] }), kp = i => CK.POSES[i];
const cloudSeat = () => `${L.softCloud(420, 1440, 1.3, '#f7f6f1')}${L.softCloud(660, 1450, 1.4, '#f7f6f1')}${L.softCloud(540, 1480, 1.7, '#ffffff')}`;
const vishnu = (p, x, y, s, t) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-540 -1000)">${cloudSeat()}${V.drawSeated(A.perform('vishnu', { ...p, breath: Math.sin(t * 2), t }, TV))}</g>`;
const monty = (p, x, y, s, t) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-540 -1100)">${M.draw(A.perform('monty', { ...p, t, breath: Math.sin(t * 2.6) }, TV))}</g>`;
const shani = (p, x, y, s, t) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-540 -1000)">${SH.draw(A.perform('shani', { ...p, breath: Math.sin(t * 1.4) }, TV))}</g>`;
const brahma = (p, t, side) => side ? `${B.tokenDisplay(8)}<g transform="translate(380 950) scale(0.84) translate(-540 -1080)"><g transform="translate(540 1000) scale(0.95) translate(-540 -1000)">${B.draw(A.perform('brahma', { ...p, t }, TV))}</g>${B.desk()}</g>` : `${B.tokenDisplay(8)}<g transform="translate(540 1000) scale(0.95) translate(-540 -1000)">${B.draw(A.perform('brahma', { ...p, t }, TV))}</g>${B.desk()}`;
const sakshi = (p, x, y, s, t) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-540 -1100)">${SK.draw(A.perform('sakshi', { ...p, t, breath: Math.sin(t * 2.2), braidSwing: Math.sin(t * 2.4) * 0.35 }, TV))}</g>`;
const cam = (body, cx, cy, z) => `<g transform="translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})">${body}</g>`;
const txt = (x, y, s, str, fill = '#fff', size = 64, extra = '') => `<text x="${x}" y="${y}" font-family="Arial Black,Arial" font-weight="900" font-size="${size * s}" text-anchor="middle" fill="${fill}" stroke="#1b1422" stroke-width="${10 * s}" paint-order="stroke" ${extra}>${str}</text>`;
function caption(tv) {
  const t = orig(tv); const c = CAPS.find(c => t >= c[1] && t < c[2]); if (!c) return '';
  const w = Math.min(930, 40 + c[0].length * 30);
  return `<rect x="${540 - w / 2}" y="1372" width="${w}" height="96" rx="20" fill="#1b1422" opacity="0.78"/>` + txt(540, 1439, 1, c[0].replace(/&/g, '&amp;'), '#ffffff', 50);
}
function tag(t, t0, str, x = 540, y = 330, col = '#ffd24a', size = 76) { if (t < t0) return ''; const k = backOut(clamp((t - t0) / 0.3)); return `<g transform="translate(${x} ${y}) scale(${k}) rotate(-4)">` + txt(0, 0, 1, str, col, size) + '</g>'; }
function pill(t, t0, str, x, y, col = '#ffd24a', size = 50) { if (t < t0) return ''; const k = backOut(clamp((t - t0) / 0.3)), w = 60 + str.length * size * 0.66;
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="${-w / 2}" y="${-size * 0.95}" width="${w}" height="${size * 1.6}" rx="${size * 0.8}" fill="#1b1422" opacity="0.9" stroke="${col}" stroke-width="5"/>` + txt(0, size * 0.2, 1, str, col, size) + '</g>'; }
function rainCloud(t, x, y) { let o = L.softCloud(x, y, 0.9, '#8f97a8'); for (let i = 0; i < 9; i++) { const u = (t * 1.6 + i * 0.13) % 1; o += `<line x1="${x - 110 + i * 26}" y1="${y + 70 + u * 260}" x2="${x - 116 + i * 26}" y2="${y + 100 + u * 260}" stroke="#7fb4ea" stroke-width="6" stroke-linecap="round"/>`; } return o; }
function commentBox(t, t0) { if (t < t0) return ''; const n = Math.min(6, Math.floor((t - t0) / 0.12)), k = backOut(clamp((t - t0) / 0.3));
  return `<g transform="translate(540 1270) scale(${k * 0.9})"><rect x="-380" y="-70" width="760" height="140" rx="70" fill="#fff" stroke="#1b1422" stroke-width="8"/><text x="-300" y="22" font-family="Arial Black,Arial" font-weight="900" font-size="62" fill="#1b1422">${'REPORT'.slice(0, n)}${(t * 2) % 1 < 0.5 ? '|' : ''}</text><circle cx="300" cy="0" r="46" fill="#ff3d6e"/><path d="M285 -20 L322 0 L285 20 Z" fill="#fff"/></g>`; }
function bricks(t, t0) { let o = ''; for (let i = 0; i < 8; i++) { const ti = t0 + i * 0.25; if (t < ti) break; const k = backOut(clamp((t - ti) / 0.25)); const x = 360 + (i % 4) * 120 - (Math.floor(i / 4) % 2) * 60, y = 1530 - Math.floor(i / 4) * 52;
  o += `<rect x="${x}" y="${y - (1 - k) * 200}" width="112" height="46" rx="4" fill="#b85d42" stroke="#1b1422" stroke-width="5"/>`; } return o; }
function terraceScene(t, actors, o = {}) { const T = L.terrace(t, o); return { defs: T.defs, body: T.back + actors + T.front }; }
function officeScene(t, actors) { const O = L.office(t); return { defs: O.defs, body: O.back + actors + O.front }; }
function courtScene(t, actors, o = {}) { const C = L.court(t, o); return { defs: C.defs, body: C.back + actors + C.front }; }
const focus = (body, fx, fy, z) => `<g transform="translate(540 900) scale(${z}) translate(${-fx} ${-fy})">${body}</g>`;

// Turn a shot list into a film module. Each shot: [start, end, t => { defs, body, over }] on the SCRIPT clock.
function film(SHOTS, scriptDur) {
  const DUR = toVideo(scriptDur);
  function svg(tv) {
    const t = orig(tv); TV = tv;
    const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
    const r = sh[2](t), since = t - sh[0], pop = 1 + 0.04 * Math.max(0, 1 - since / 0.18);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs>${r.defs}</defs><g transform="translate(540 960) scale(${pop.toFixed(4)}) translate(-540 -960)">${r.body}${r.over || ''}</g>${caption(tv)}</svg>`;
  }
  return { DUR, svg, SHOTS };
}
module.exports = { E, L, V, M, B, SH, SK, SD, CV, CM, CB, CS, CK, clamp, ease, backOut, A, orig, toVideo, film, vp, mp, bp, sp, kp,
  cloudSeat, vishnu, monty, shani, brahma, sakshi, cam, focus, txt, caption, tag, pill, rainCloud, commentBox, bricks, terraceScene, officeScene, courtScene, SLUG, VID, WORK };
