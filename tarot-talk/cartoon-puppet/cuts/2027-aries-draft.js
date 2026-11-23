// Film: Aries 2027 — Vishnu ji drafts, Sakshi (Aries ki wakeel) bargains. Script v7, voices approved 23 Nov 2026 21:50 IST.
// Owner after the skeleton (22:02 IST): "Very rough. No expression. No movement. Same old scene." ->
//  new location (cloud study), a face change on every phrase (seq), camera moves on every shot, cut-in gags, diary cards.
// Beat times come from videos/<slug>/script.json (the voice cut), so re-timing a line re-times the film.
const path = require('path');
const K = require('../kit');
const { E, L, clamp, ease, backOut, vp, kp, vishnu, sakshi, cam, txt } = K;
const S = require(path.join(K.VID, 'script.json')).beats;
const B = id => S.find(b => b.id === id), at = (id, f = 0) => { const b = B(id); return b.start + (b.end - b.start) * f; };
const DUR = S[S.length - 1].end;

// ---------- pose blending (as in the approved same-mulank cut: joints ease between key poses, blink through face changes)
const ZERO_OK = new Set(['tilt', 'lookX', 'lookY', 'browUp', 'browL', 'browR', 'blush', 'lid', 'browSad', 'browLiftAmt']);
function mix(a, b, u, key) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * u;
  if (a === undefined && typeof b === 'number' && ZERO_OK.has(key)) return b * u;
  if (b === undefined && typeof a === 'number' && ZERO_OK.has(key)) return a * (1 - u);
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(x => typeof x === 'number')) return a.map((x, i) => x + (b[i] - x) * u);
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = mix(a[k], b[k], u, k); return o; }
  return u < 0.5 ? a : b;
}
const PRE = 0.15, BLEND = 0.4, smooth = u => u * u * (3 - 2 * u);
const faceDiff = (a, b) => a.mouthShape !== b.mouthShape || a.mouth !== b.mouth || a.happy !== b.happy || a.eyeMode !== b.eyeMode;
const seq = (t, list) => {
  let i = 0; for (let k = 1; k < list.length; k++) if (t >= list[k][0] - PRE) i = k;
  const u = clamp((t - (list[i][0] - PRE)) / BLEND);
  if (i === 0 || u >= 1) return list[i][1];
  const a = list[i - 1][1], b = list[i][1], p = mix(a, b, smooth(u));
  if (faceDiff(a, b) && u > 0.38 && u < 0.62) { p.blink = 1; p.lid = Math.max(p.lid || 0, 1); }
  return p;
};
const pop = (t, t0, d = 0.3) => backOut(clamp((t - t0) / d));
const fade = (t, t0, d = 0.25) => clamp((t - t0) / d);
// camera: slow push from t0, with an optional snap-zoom in the first 0.2 s
const push = (body, t, t0, k = 0.025, cx = 540, cy = 1000, snap = 0) => cam(body, cx, cy, 1 + k * Math.max(0, t - t0) + snap * (1 - ease(clamp((t - t0) / 0.22))));
const snapIn = (body, t, t0, z0, z1, cx = 540, cy = 1000) => cam(body, cx, cy, z0 + (z1 - z0) * ease(clamp((t - t0) / 0.25)));

// ---------- Vishnu ji faces (all from his approved pose set; arms from his poses) ----------
const V0 = vp(0), V1 = vp(1), V2 = vp(2), V4 = vp(4), V5 = vp(5);
const vWrite = { ...V0, lid: 0.2, mouthShape: 'cat', lookX: 10, tilt: 3 };                                        // busy writing, calm
const vAmused = { ...V2, lid: 0.25, browL: 0.7, browR: 0.5, mouthShape: 'smileBig', lookX: 14, tilt: -4 };                // eyebrow up at the wakeel
const vTease = { ...V2, lid: 0.05, browL: 0.7, browR: 0.7, lookX: 10, tilt: 8, mouthShape: 'smileBig', blushHatch: true };
const vSerious = { ...V0, lid: 0.32, browL: -0.3, browR: -0.3, mouthShape: 'cat', lookX: 0, tilt: 0 };             // Sade Sati, calm and respectful
const vWarm = { ...V2, lid: 0.12, browL: 0.35, browR: 0.35, mouthShape: 'smileBig', lookX: 14, tilt: -3 };
const vShakeL = { ...vWarm, tilt: -7 }, vShakeR = { ...vWarm, tilt: 6 };
const vTalk = { ...V2, lookX: 10, tilt: 3 };
const vPoint = { ...V1, wink: 0, lid: 0.22, browL: 0.55, browR: 0.5, lookX: 14 };
const vFinger = { ...V4, wink: 0, lid: 0.25, browL: 0.55, browR: 0.45, mouthShape: 'smileBig', lookX: 14, tilt: -5, fx: [] };                 // finger up, chakra glows
const vDeadpan = { ...V0, lid: 0.4, browL: 0.3, browR: 0.3, mouthShape: 'cat', lookX: 0, tilt: 3 };                   // "jaana bhi padega" / "FD."
const vKnowing = { ...V0, lid: 0.1, browL: 0.6, browR: 0.6, mouthShape: 'smileBig', lookX: 0, tilt: -5 };
const vLaugh = { ...V5, float: undefined, eyeMode: 'happy', mouthShape: 'smileBig', tilt: 6 };
const vPleased = { ...V2, lid: 0.15, browL: 0.6, browR: 0.6, mouthShape: 'smileBig', tilt: 4 };
const vBless = { ...V2, eyeMode: 'happy', mouthShape: 'smileBig', tilt: -3, blushHatch: true };

// ---------- Sakshi faces (with the wakeel coat) ----------
const C = p => ({ ...p, coat: 1 });
const k0 = kp(0), k2 = kp(2);
const armsUp = { armL: { E: [330, 990], W: [300, 870], hand: 'palm' }, armR: { E: [750, 990], W: [780, 870], hand: 'palm' } };
const armsOut = { armL: { E: [300, 1060], W: [220, 1000], hand: 'palm' }, armR: { E: [780, 1060], W: [860, 1000], hand: 'palm' } };
const clap = { armL: { E: [390, 1080], W: [500, 1010], hand: 'palm' }, armR: { E: [690, 1080], W: [580, 1010], hand: 'palm' } };
const handUp = { armR: { E: [770, 1000], W: [800, 880], hand: 'palm' } };
const pointUp = { armR: { E: [790, 1000], W: [840, 880], hand: 'point' } };
const pointV = { armL: { E: [320, 1010], W: [230, 950], hand: 'point' } };          // points toward Vishnu ji (screen left)
const sObject = C({ ...k2, ...handUp, browUp: 0.8, blush: 0.5, lookX: -16, tilt: -4 });   // "Ek minute, Prabhu!"
const sLawyer = C({ ...k2, ...pointUp, browLift: 1, browLiftAmt: 1, lid: 0.15, mouth: 'smirk', lookX: -10, tilt: 5 });
const sShock = C({ ...k0, browUp: 1.2, lid: 0, mouth: 'o', blush: 0.3, lookX: -8, tilt: -2, ...armsOut });
const sPlead = C({ ...k2, browSad: 1, browUp: 0.3, mouth: 'pout', blush: 0.7, lookX: -14, tilt: 8, ...handUp });
const sRelief = C({ ...k0, happy: 1, mouth: 'smile', blush: 0.5, tilt: -6 });
const sNote = C({ ...k0, lid: 0.25, lookX: -20, lookY: 16, mouth: 'smile', tilt: 6 });            // writing in the diary
const sExcited = C({ ...k2, browUp: 1, mouth: 'grin', blush: 0.6, ...armsUp, tilt: -5 });
const sSheepish = C({ ...k0, browSad: 0.8, mouth: 'pout', blush: 1, lookX: 18, lookY: 10, tilt: 9 });
const sCunning = C({ ...k2, lid: 0.4, browLift: -1, browLiftAmt: 1.2, mouth: 'smirk', lookX: -18, tilt: -6, ...pointUp });
const sWow = C({ ...k0, browUp: 1, lid: 0, mouth: 'o', blush: 0.6, lookX: -6 });
const sSneaky = C({ ...k0, lid: 0.45, mouth: 'smirk', lookX: -26, lookY: 4, tilt: -8, blush: 0.3 });
const sPout = C({ ...k0, browSad: 0.6, mouth: 'pout', blush: 0.6, lookX: -16, tilt: 6 });
const sBlush = C({ ...k0, happy: 1, mouth: 'smile', blush: 1, tilt: 8, ...clap });
const sClap = C({ ...k2, browUp: 0.8, mouth: 'grin', blush: 0.8, ...clap, tilt: -4 });
const sDespair = C({ ...k2, browSad: 1.2, browUp: 0.6, mouth: 'o', ...armsOut, lookX: -14, tilt: -7 });
const sDemand = C({ ...k2, browUp: 0.6, mouth: 'grin', blush: 0.6, ...pointV, tilt: 5 });
const sLoophole = C({ ...k2, browLift: 1, browLiftAmt: 1.3, mouth: 'smirk', lookX: -18, lookY: -10, tilt: -8 });
const sGiggle = C({ ...k0, happy: 1, mouth: 'grin', blush: 0.9, tilt: 10 });
const sWin = C({ ...k2, browUp: 0.8, mouth: 'grin', blush: 0.7, ...pointUp, tilt: -5 });
const sWink = C({ ...k2, wink: 1, mouth: 'grin', blush: 0.7, ...pointUp, tilt: 6 });
const sProud = C({ ...kp(4), blush: 0.7, mouth: 'grin' });

// ---------- props (all float by magic; no gripping hands) ----------
const INK = '#1b1422';
const T = (x, y, s, str, col = '#1b1422', size = 54, anchor = 'middle', w = 900) => `<text x="${x}" y="${y}" font-family="Arial Black,Arial" font-weight="900" font-size="${size * s}" text-anchor="${anchor}" fill="${col}">${str}</text>`;
const glow = (x, y, r, op = 0.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#halo)" opacity="${op}"/>`;
// the big floating scroll with a self-writing quill
function scroll(t, x, y, s, title, writeFrom, rows = 4, extra = '') {
  const prog = clamp((t - writeFrom) / 4.5);
  let o = `<g transform="translate(${x} ${y + Math.sin(t * 1.1) * 6}) scale(${s})">` + glow(0, 0, 330, 0.35);
  o += `<rect x="-250" y="-170" width="500" height="340" rx="10" fill="#f6e7c4" stroke="${INK}" stroke-width="7"/>`;
  for (const yy of [-170, 170]) o += `<rect x="-270" y="${yy - 22}" width="540" height="44" rx="22" fill="#e2c88f" stroke="${INK}" stroke-width="7"/><circle cx="-270" cy="${yy}" r="16" fill="#c99a3c" stroke="${INK}" stroke-width="5"/><circle cx="270" cy="${yy}" r="16" fill="#c99a3c" stroke="${INK}" stroke-width="5"/>`;
  o += T(0, -95, 1, title, '#8a2238', 54);
  let qx = -190, qy = -30;
  for (let r = 0; r < rows; r++) { const len = clamp(prog * rows - r); if (len <= 0) break; const y0 = -30 + r * 50, x1 = -190 + 380 * len;
    let d = `M-190 ${y0}`; for (let x = -190; x < x1; x += 16) d += ` Q${x + 4} ${y0 - 9 * Math.sin(x)} ${x + 8} ${y0} T${x + 16} ${y0}`;
    o += `<path d="${d}" fill="none" stroke="#5a3a2a" stroke-width="5" stroke-linecap="round"/>`; qx = x1; qy = y0; }
  o += extra;
  // quill (feather) floating at the writing point, bobbing as it writes
  const wob = prog < 1 && t > writeFrom ? Math.sin(t * 22) * 6 : 0;
  o += `<g transform="translate(${qx + 10} ${qy - 10 + wob}) rotate(-35)">${glow(0, -60, 70, 0.5)}<path d="M0 0 C-30 -60 -26 -150 6 -200 C30 -150 34 -60 0 0 Z" fill="#fbfaf4" stroke="${INK}" stroke-width="5"/><path d="M0 0 L4 -190" stroke="#c99a3c" stroke-width="4"/><path d="M-4 6 L0 22 L4 6 Z" fill="${INK}"/></g>`;
  return o + '</g>';
}
// Sakshi's diary floating by her hand, pen floats and scribbles (or shivers in fear)
function diary(t, x, y, s, mode = 'write', page = '') {
  const shiver = mode === 'shiver' ? Math.sin(t * 60) * 7 : 0, wr = mode === 'write' ? Math.sin(t * 16) * 10 : 0;
  let o = `<g transform="translate(${x} ${y + Math.sin(t * 1.4 + 1) * 5}) scale(${s})">` + glow(0, 0, 170, 0.4);
  o += `<rect x="-130" y="-95" width="260" height="190" rx="10" fill="#7a2f5a" stroke="${INK}" stroke-width="6"/><rect x="-118" y="-84" width="236" height="168" rx="6" fill="#fffaf0" stroke="${INK}" stroke-width="4"/>`;
  o += `<line x1="0" y1="-84" x2="0" y2="84" stroke="#c9b9a0" stroke-width="4"/>`;
  for (let k = 0; k < 4; k++) o += `<line x1="-104" y1="${-50 + k * 30}" x2="-16" y2="${-50 + k * 30}" stroke="#bcd" stroke-width="3"/><line x1="16" y1="${-50 + k * 30}" x2="104" y2="${-50 + k * 30}" stroke="#bcd" stroke-width="3"/>`;
  o += page;
  if (mode === 'shiver') o += `<path d="M20 -40 L40 -10 L55 -45 L70 -5 L85 -40" fill="none" stroke="#c62b34" stroke-width="5"/>`;
  o += `<g transform="translate(${90 + wr + shiver} ${-30 + shiver * 0.6}) rotate(${-30 + shiver * 2})">${glow(0, -40, 50, 0.45)}<rect x="-7" y="-90" width="14" height="80" rx="5" fill="#ffd24a" stroke="${INK}" stroke-width="4"/><path d="M-7 -10 L0 8 L7 -10 Z" fill="#f1d3a8" stroke="${INK}" stroke-width="3"/></g>`;
  return o + '</g>';
}
const smallCloud = (x, y, s = 1) => L.softCloud(x, y, s, '#f4f0ff', 0.98) + L.softCloud(x + 40 * s, y + 18 * s, s * 0.8, '#ffffff', 1);
// full-width diary-page card (the one card per beat): title + up to 2 rows, rows pop in at their times
function card(t, t0, title, rows = [], opt = {}) {
  if (t < t0) return ''; const k = pop(t, t0, 0.32), y0 = opt.y || 300, h = opt.h || 360;
  let o = `<g transform="translate(510 ${y0 + h / 2}) scale(${k}) rotate(${opt.rot ?? -1.5}) translate(-510 ${-(y0 + h / 2)})">`;
  o += `<rect x="58" y="${y0 + 10}" width="880" height="${h}" rx="18" fill="#0b0d18" opacity="0.35"/><rect x="50" y="${y0}" width="880" height="${h}" rx="18" fill="#fffaf0" stroke="${INK}" stroke-width="8"/>`;
  o += `<line x1="110" y1="${y0 + 8}" x2="150" y2="${y0 + h - 8}" stroke="#e8798e" stroke-width="4"/>`;
  for (let i = 0; i < 9; i++) o += `<circle cx="${190 + i * 85}" cy="${y0 + 2}" r="11" fill="#c9b9a0" stroke="${INK}" stroke-width="4"/>`;
  o += T(500, y0 + 96, 1, title, opt.col || '#8a2238', opt.size || 64);
  rows.forEach(([str, ti, col, size], i) => { if (t < ti) return; o += `<g transform="translate(500 ${y0 + 186 + i * 86}) scale(${pop(t, ti, 0.25)})">${T(0, 0, 1, str, col || '#1b1422', size || 52)}</g>`; });
  if (opt.label && t > (opt.labelAt ?? t0)) o += T(500, y0 + h - 26, 1, opt.label, '#7a6a8c', 48);
  return o + (opt.extra ? opt.extra(t) : '') + '</g>';
}
const hookCard = () => `<rect x="90" y="272" width="830" height="190" rx="26" fill="#1b1422" opacity="0.9" stroke="#ffd24a" stroke-width="6"/>` + txt(505, 352, 1, 'ARIES 2027:', '#ffd24a', 60) + txt(505, 430, 1, 'BHAGWAN SE MOL-BHAAV?', '#ffffff', 56);
// a comic cut-in panel (rounded frame) for the gags
const panel = (t, t0, inner, bg = '#bfe3ff') => { const k = pop(t, t0, 0.28);
  return `<g transform="translate(510 620) scale(${k}) translate(-510 -620)"><rect x="100" y="300" width="820" height="640" rx="30" fill="${bg}" stroke="${INK}" stroke-width="10"/><clipPath id="pc"><rect x="105" y="305" width="810" height="630" rx="26"/></clipPath><g clip-path="url(#pc)">${inner}</g></g>`; };
// the ram (Mesh): woolly body, curled horns, four legs that swing at the hips (joint motion), skid pose
function ram(x, y, s, run, skid = 0, steam = 0) {
  const ph = run * Math.PI * 2, leg = (hx, a) => { const kx = hx + Math.sin(a) * 26 - skid * 30, ky = 70, fx = hx + Math.sin(a) * 40 - skid * 50, fy = 122;
    return `<path d="M${hx} 40 Q${kx} ${ky} ${fx} ${fy}" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M${hx} 40 Q${kx} ${ky} ${fx} ${fy}" fill="none" stroke="#5a4038" stroke-width="12" stroke-linecap="round"/>`; };
  let o = `<g transform="translate(${x} ${y}) scale(${s}) rotate(${-skid * 8})">`;
  o += leg(-60, ph) + leg(-30, ph + Math.PI) + leg(40, ph + Math.PI * 0.9) + leg(70, ph + Math.PI * 0.1);
  o += `<path d="M-110 10 C-130 -40 -80 -80 -40 -64 C-20 -100 40 -100 60 -66 C100 -84 140 -40 120 10 C140 40 100 70 60 56 C30 80 -30 80 -60 56 C-100 70 -140 40 -110 10 Z" fill="#fbfaf4" stroke="${INK}" stroke-width="7"/>`;
  o += `<g transform="translate(128 -30)"><ellipse cx="0" cy="0" rx="40" ry="34" fill="#c9a27a" stroke="${INK}" stroke-width="6"/><circle cx="12" cy="-6" r="6" fill="${INK}"/><path d="M-6 -28 C-40 -78 -96 -40 -78 6 C-66 38 -26 34 -26 6 C-26 -12 -46 -16 -50 -2" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M-6 -28 C-40 -78 -96 -40 -78 6 C-66 38 -26 34 -26 6 C-26 -12 -46 -16 -50 -2" fill="none" stroke="#b07a44" stroke-width="12" stroke-linecap="round"/><path d="M24 18 Q34 24 40 16" fill="none" stroke="${INK}" stroke-width="4"/></g>`;
  if (steam) for (let i = 0; i < 3; i++) o += `<circle cx="${150 + i * 18}" cy="${-80 - i * 26 - steam * 20}" r="${10 + i * 5}" fill="#ffffff" opacity="${0.7 - i * 0.18}"/>`;
  if (skid) for (let i = 0; i < 4; i++) o += `<line x1="${-140 - i * 40}" y1="${118 - i * 4}" x2="${-180 - i * 40}" y2="${118 - i * 4}" stroke="#7a6a8c" stroke-width="6" stroke-linecap="round"/>`;
  return o + '</g>';
}
const stopSign = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="0" width="12" height="160" fill="#7a6a8c" stroke="${INK}" stroke-width="4"/><path d="M-30 -72 L30 -72 L72 -30 L72 30 L30 72 L-30 72 L-72 30 L-72 -30 Z" transform="translate(0 -60)" fill="#d22f48" stroke="${INK}" stroke-width="6"/><text x="0" y="-46" font-family="Arial Black,Arial" font-weight="900" font-size="38" text-anchor="middle" fill="#fff">STOP</text></g>`;
function ramGag(t, t0, brake = false) {
  const u = clamp((t - t0) / 1.4), x = brake ? 160 + 380 * ease(u) : -200 + 1100 * u, sk = brake ? clamp((u - 0.55) / 0.3) : clamp((u - 0.45) / 0.2) * (1 - clamp((u - 0.75) / 0.2));
  return panel(t, t0, `<rect x="100" y="760" width="820" height="200" fill="#8fcf7a"/>` + stopSign(640, 700, 1) + ram(x, 700, 1.2, t * (brake ? 2.2 * (1 - sk) : 3.2), sk) + (brake ? T(510, 400, 1, sk > 0.9 ? 'BRAKE ✓' : 'BRAKE LAGAO!', '#1b8a3a', 64) : T(510, 400, 1, 'NO BRAKES!', '#d22f48', 64)));
}
// office cut-in: boss with a big ear, a faceless colleague whispering (silhouettes, nobody real)
function officeGag(t, t0) {
  const lean = Math.sin(t * 6) * 4;
  let o = `<rect x="100" y="300" width="820" height="640" fill="#e9e2d0"/><rect x="100" y="800" width="820" height="140" fill="#b89a74"/><rect x="560" y="620" width="300" height="190" rx="10" fill="#8a6a4a" stroke="${INK}" stroke-width="7"/>`;
  o += `<g transform="translate(700 560)"><circle cx="0" cy="0" r="70" fill="#d9a77e" stroke="${INK}" stroke-width="7"/><ellipse cx="-74" cy="6" rx="${44 + 6 * Math.sin(t * 8)}" ry="58" fill="#e0b08a" stroke="${INK}" stroke-width="7"/><ellipse cx="-74" cy="6" rx="22" ry="32" fill="#c98e68"/><rect x="-60" y="66" width="120" height="120" rx="24" fill="#3a4a7a" stroke="${INK}" stroke-width="7"/><path d="M0 70 L-14 110 L0 160 L14 110 Z" fill="#d22f48" stroke="${INK}" stroke-width="4"/></g>`;
  o += `<g transform="translate(${430 + lean} 600) rotate(12)"><circle cx="0" cy="0" r="60" fill="#7a6a8c" stroke="${INK}" stroke-width="7"/><rect x="-55" y="58" width="110" height="200" rx="26" fill="#5a4a6c" stroke="${INK}" stroke-width="7"/></g>`;
  for (let i = 0; i < 3; i++) { const k = ((t * 1.5 + i / 3) % 1); o += `<path d="M${500 + k * 80} ${560 - 20} q14 20 0 40" fill="none" stroke="${INK}" stroke-width="6" opacity="${1 - k}"/>`; }
  return panel(t, t0, o, '#e9e2d0');
}
// family cut-in: a warm home with diyas
function homeGag(t, t0) {
  let o = `<rect x="100" y="300" width="820" height="640" fill="#2a2058"/>` + glow(510, 640, 380, 0.7);
  o += `<path d="M280 620 L510 430 L740 620 Z" fill="#c2463a" stroke="${INK}" stroke-width="8"/><rect x="310" y="610" width="400" height="250" fill="#f3d9a8" stroke="${INK}" stroke-width="8"/><rect x="470" y="720" width="80" height="140" rx="6" fill="#8a5a3a" stroke="${INK}" stroke-width="6"/>`;
  for (const wx of [350, 590]) o += `<rect x="${wx}" y="660" width="80" height="70" fill="#ffd56a" stroke="${INK}" stroke-width="6"/>`;
  o += `<path d="M310 612 ${[0,1,2,3,4,5,6,7].map(k => `Q${335 + k * 50} 650 ${360 + k * 50} 612`).join(' ')}" fill="none" stroke="#2f8a3a" stroke-width="6"/>` + [0,1,2,3,4,5,6,7].map(k => `<path d="M${335 + k * 50} 628 l-10 22 l20 0 Z" fill="${k % 2 ? '#ff9a2a' : '#2f8a3a'}" stroke="${INK}" stroke-width="3"/>`).join('');
  o += `<g transform="translate(510 905)"><ellipse rx="120" ry="32" fill="#ff5c8a" stroke="${INK}" stroke-width="5"/><ellipse rx="80" ry="20" fill="#ffd24a"/><ellipse rx="40" ry="10" fill="#2fb3a0"/></g>`;
  for (const [x, h, c] of [[380, 120, '#c2463a'], [440, 150, '#7a2f5a'], [600, 140, '#3a4a7a'], [650, 100, '#e0a030']]) o += `<g transform="translate(${x} 860)"><circle cx="0" cy="${-h}" r="22" fill="#d9a77e" stroke="${INK}" stroke-width="5"/><path d="M-26 ${-h + 24} Q0 ${-h + 10} 26 ${-h + 24} L30 0 L-30 0 Z" fill="${c}" stroke="${INK}" stroke-width="5"/></g>`;
  [170, 270, 750, 850].forEach((x, i) => { o += L.diya(x, 900, t, i + 40, 0.8); });
  return panel(t, t0, o, '#2a2058');
}
const coins = (t, t0) => { let o = ''; for (let i = 0; i < 9; i++) { const u = (t - t0) * 0.7 + i * 0.13; if (u < 0) continue; const k = u % 1, x = 260 + ((i * 97) % 520), y = 1000 - k * 650;
  o += `<g transform="translate(${x} ${y}) scale(${Math.abs(Math.cos(t * 3 + i))} 1)"><circle r="34" fill="#ffd24a" stroke="${INK}" stroke-width="6"/><text y="13" font-family="Arial Black" font-size="34" text-anchor="middle" fill="#c08a1a">₹</text></g>`; } return o; };
const hearts = (t, t0) => { let o = ''; for (let i = 0; i < 8; i++) { const u = (t - t0) * 0.5 + i * 0.12; if (u < 0) continue; const k = u % 1, x = 240 + ((i * 131) % 600), y = 1050 - k * 650, s = 0.7 + 0.3 * Math.sin(t * 4 + i);
  o += `<path transform="translate(${x} ${y}) scale(${s})" d="M0 18 C-40 -10 -26 -44 0 -26 C26 -44 40 -10 0 18 Z" fill="#ff5c8a" stroke="${INK}" stroke-width="5" opacity="${(1 - k).toFixed(2)}"/>`; } return o; };
const stormCloud = (t, x, y) => L.softCloud(x, y, 0.8, '#8f97a8') + (Math.sin(t * 9) > 0.6 ? `<path d="M${x} ${y + 60} l-20 50 h24 l-16 50" fill="none" stroke="#ffd24a" stroke-width="8"/>` : '');
const saturn = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${glow(0, 0, 90, 0.5)}<circle r="34" fill="#3b4fa8" stroke="${INK}" stroke-width="5"/><ellipse rx="64" ry="14" fill="none" stroke="#8fa8ff" stroke-width="7" transform="rotate(-18)"/></g>`;
const jupiterGlow = (t, t0) => t < t0 ? '' : `<circle cx="540" cy="760" r="${120 + 520 * ease(clamp((t - t0) / 1.2))}" fill="url(#halo)" opacity="${(0.65 * (1 - clamp((t - t0 - 1.2) / 3))).toFixed(2)}"/>`;
function legalNotice(t, t0, t1, nx = 560, ny = 900) { // page floats up, then folds into a paper plane and flies off
  if (t < t0) return ''; const u = clamp((t - t1) / 0.9);
  if (t < t1) return `<g transform="translate(${nx} ${ny - 120 * ease(clamp((t - t0) / 0.6))}) rotate(-6) scale(${pop(t, t0)})">${glow(0, 0, 160, 0.4)}<rect x="-120" y="-150" width="240" height="300" fill="#fffaf0" stroke="${INK}" stroke-width="6"/>${T(0, -90, 1, 'LEGAL', '#d22f48', 48)}${T(0, -36, 1, 'NOTICE', '#d22f48', 48)}${[0, 1, 2, 3].map(k => `<line x1="-90" y1="${20 + k * 30}" x2="90" y2="${20 + k * 30}" stroke="#aab" stroke-width="5"/>`).join('')}</g>`;
  return u >= 1 ? '' : `<g transform="translate(${560 - 500 * u} ${780 - 380 * u}) rotate(-20)"><path d="M0 0 L90 -30 L20 10 Z M0 0 L20 10 L10 40 Z" fill="#fffaf0" stroke="${INK}" stroke-width="5"/></g>`;
}
function gavel(t, x, y, s) { const tap = Math.max(0, Math.sin(t * 10)); return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${-30 + 30 * tap})">${glow(0, 0, 90, 0.5)}<rect x="-14" y="-10" width="28" height="140" rx="10" fill="#8a5a3a" stroke="${INK}" stroke-width="6"/><rect x="-60" y="-50" width="120" height="56" rx="14" fill="#a0683a" stroke="${INK}" stroke-width="6"/></g>`; }
const linkChip = (t, t0) => t < t0 ? '' : `<g transform="translate(500 390) scale(${pop(t, t0)})"><rect x="-440" y="-110" width="880" height="220" rx="60" fill="#ffd24a" stroke="${INK}" stroke-width="10"/>${T(0, -14, 1, 'POORI ARIES 2027 GUIDE', '#1b1422', 56)}${T(0, 66, 1, 'LINK MEIN →', '#8a2238', 60)}</g>` + `<g transform="translate(${760 + 30 * Math.sin(t * 6)} 640) rotate(-20)"><path d="M-70 -26 L30 -26 L30 -60 L90 0 L30 60 L30 26 L-70 26 Z" fill="#ff5c8a" stroke="${INK}" stroke-width="8"/></g>`;

// ---------- scene builders ----------
// owner (22:42 IST): world tour — each topic in its own place, Vishnu ji floating bigger than the landmark (supremacy)
const W = require('../loc_world');
// owner (23:28 IST): detailed, true-copy places with minute objects -> loc_hd.js plates
const HD = require('../loc_hd');
Object.assign(W, { alps: HD.alps, cityNight: HD.nyc, dubai: HD.dubai, taj: HD.taj, eiffel: HD.eiffel, indiaDusk: HD.varanasi });
const PLACES = [['K01', 'cosmos'], ['V02', 'alps'], ['V03', 'cosmos'], ['V06', 'alps'], ['V09', 'cityNight'], ['V12', 'dubai'], ['V15', 'taj'], ['V17', 'eiffel'], ['V19', 'indiaDusk'], ['V23', 'cosmos'], ['K24', 'study']];
const placeAt = t => { let k = 0; PLACES.forEach(([id], i) => { if (t >= at(id) - 0.05) k = i; }); return k; };
let DX = 0;   // close-ups set this so the landmark sits beside the character instead of behind
const study = (t, actors, o = {}) => {
  const k = placeAt(t), name = PLACES[k][1], S0 = name === 'study' ? L.cloudStudy(t, o) : W[name](t, o), dx = DX; DX = 0;
  const sc = 1.03 + Math.abs(dx) / 540, back = dx ? `<g transform="translate(${540 + dx} 960) scale(${sc.toFixed(3)}) translate(-540 -960)">${S0.back}</g>` : S0.back;
  return { defs: S0.defs, body: back + actors + S0.front + (k > 0 ? W.cloudWipe(t, at(PLACES[k][0]) - 0.2) : '') };
};
const VX = 300, VY = 1250, VS = 0.6, KX = 790, KY = 1240, KS = 0.64;         // two-shot: Vishnu ji left on his cloud, Sakshi right on a small cloud
const two = (t, vpose, kpose, extra = '', dOpt = {}) => vishnu(vpose, VX, VY, VS, t) + smallCloud(KX - 40, KY + 380, 1.1) + sakshi(kpose, KX, KY, KS, t) + diary(t, dOpt.x ?? 600, dOpt.y ?? 1170, dOpt.s ?? 0.55, dOpt.mode ?? 'idle', dOpt.page ?? '') + extra;
const twoV = (body, t, t0) => cam(body, 330, 1000, 1.28 + 0.03 * Math.max(0, t - t0));   // favour Vishnu ji
const twoK = (body, t, t0) => cam(body, 790, 1000, 1.3 + 0.03 * Math.max(0, t - t0));   // favour Sakshi
const vClose = (t, pose) => { DX = 190; return vishnu(pose, 400, 1090, 0.9, t); };
const kClose = (t, pose, dmode = 'idle', page = '') => { DX = -190; return smallCloud(620, 1720, 1.5) + sakshi(pose, 660, 1150, 0.82, t) + diary(t, 860, 1500, 0.7, dmode, page); };
const SCROLL = (t, title = 'ARIES 2027', from = 0, extra = '', y = 600) => scroll(t, 560, y, 0.85, title, from, 4, extra);

// ---------- COVER / first frame (owner 22:56 IST: "a first frame which clearly shows what it is. Gets clicks. Big big.")
// Frame 0 of the reel and the Instagram cover: huge ARIES 2027, Vishnu ji large in space with gold rays and planets,
// Sakshi the lawyer objecting. Two text blocks only. Key items inside the 4:5 grid crop (y 285-1635) and clear of the
// right 12% and bottom 20%.
function rays(t, cx, cy) { let o = ''; for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 + t * 0.15;
  o += `<path d="M${cx} ${cy} L${(cx + Math.cos(a - 0.06) * 1400).toFixed(0)} ${(cy + Math.sin(a - 0.06) * 1400).toFixed(0)} L${(cx + Math.cos(a + 0.06) * 1400).toFixed(0)} ${(cy + Math.sin(a + 0.06) * 1400).toFixed(0)} Z" fill="#ffd24a" opacity="${i % 2 ? 0.10 : 0.18}"/>`; } return o; }
function coverText() {
  const big = (x, y, str, size, fill, sw = 22) => `<text x="${x}" y="${y}" font-family="Arial Black,Arial" font-weight="900" font-size="${size}" text-anchor="middle" fill="${fill}" stroke="#1b1422" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round">${str}</text>`;
  let o = `<g transform="rotate(-4 500 420)">` + big(500, 470, 'ARIES 2027', 156, '#ffd24a', 24) + `</g>`;
  // ram horns badge on the left of the title
  o += `<g transform="translate(130 290) scale(0.95)"><circle r="62" fill="#d22f48" stroke="#1b1422" stroke-width="9"/><path d="M-6 -6 C-40 -60 -96 -20 -76 18 C-62 44 -26 38 -28 10" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/><path d="M6 -6 C40 -60 96 -20 76 18 C62 44 26 38 28 10" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/></g>`;
  o += `<g transform="rotate(3 500 640)"><rect x="150" y="530" width="700" height="215" rx="40" fill="#d22f48" stroke="#1b1422" stroke-width="10"/>` + big(500, 620, 'BHAGWAN SE', 80, '#ffffff', 14) + big(500, 715, 'MOL-BHAAV!', 92, '#ffd24a', 14) + `</g>`;
  return o;
}
function coverFrame(t) {
  const S0 = W.cosmos(t, { gold: 1, noPlanets: 1 });
  const body = S0.back + rays(t, 330, 900) + `<circle cx="330" cy="900" r="420" fill="url(#halo)" opacity="0.8"/>` +
    vishnu({ ...V2, wink: 0, eyeMode: 'happy', mouthShape: 'smileBig', lid: 0, browL: 0.5, browR: 0.5, lookX: 0, tilt: -4, blushHatch: true, fx: ['sparkle'] }, 320, 1290, 0.74, t) + scroll(t, 330, 1430, 0.5, 'ARIES 2027', -3) +
    smallCloud(700, 1660, 1.2) + sakshi(C({ ...k2, ...pointUp, browLift: 1, browLiftAmt: 1.3, lid: 0.2, mouth: 'grin', blush: 0.7, lookX: -22, tilt: -6 }), 740, 1320, 0.76, t) + gavel(0.3, 575, 1470, 0.75) +
    coverText();
  return { defs: S0.defs, body };
}
const COVER_HOLD = 0.4;   // frame 0 is the cover; it gives way to the hook shot within 0.4 s

const SHOTS = [
  // K01 hook: quill already writing; Sakshi floats in, objects, then plays the lawyer
  [0, at('V02'), t => t < COVER_HOLD ? coverFrame(t) : ({ ...study(t, snapIn(SCROLL(t, '', -2, '', 700) + two(t, seq(t, [[0, vWrite], [at('K01', 0.45), vAmused]]), seq(t, [[0, sObject], [at('K01', 0.55), sLawyer]]), '', { mode: 'idle' }), t, 0, 1.12, 1.0, 540, 900)), over: hookCard() })],
  // V02 Mesh = no brakes: Vishnu ji close, amused; the ram gag cut-in
  [at('V02'), at('V02', 0.45), t => study(t, push(vClose(t, seq(t, [[at('V02'), vAmused], [at('V02', 0.25), vTease]])), t, at('V02'), 0.04))],
  [at('V02', 0.45), at('V03'), t => study(t, ramGag(t, at('V02', 0.45)))],
  // V03 Sade Sati: calm, serious, light dims; the scroll writes SADE SATI with a respectful Saturn sign
  [at('V03'), at('K04'), t => ({ ...study(t, push(vishnu(seq(t, [[at('V03'), vWrite], [at('V03', 0.3), vSerious]]), 540, 1180, 0.78, t), t, at('V03'), 0.03), { dim: 0.35 * fade(t, at('V03'), 0.8) }),
    over: card(t, at('V03', 0.35), 'SHANI SADE SATI', [], { h: 250, col: '#3b4fa8', label: 'Vedic maanyata', labelAt: at('V03', 0.35), extra: () => saturn(820, 380, 0.7) }) })],
  // K04 "Saade saat saal? teen kar dijiye!": snap zoom on Sakshi, pen shivers; then she bargains
  [at('K04'), at('V05'), t => ({ ...study(t, snapIn(kClose(t, seq(t, [[at('K04'), sShock], [at('K04', 0.35), sGiggle]]), t < at('K04', 0.35) ? 'shiver' : 'idle'), t, at('K04'), 1.25, 1.05, 540, 900), { dim: 0.25 }),
    over: t > at('K04', 0.45) ? `<g transform="translate(760 520) scale(${pop(t, at('K04', 0.45))}) rotate(8)"><circle r="110" fill="#ffffff" stroke="${INK}" stroke-width="8"/><path d="M0 0 L0 -90 A90 90 0 ${clamp((t - at('K04', 0.45)) / 1.2) > 0.5 ? 1 : 0} 1 ${(90 * Math.sin(2 * Math.PI * Math.min(0.999, clamp((t - at('K04', 0.45)) / 1.2)))).toFixed(1)} ${(-90 * Math.cos(2 * Math.PI * Math.min(0.999, clamp((t - at('K04', 0.45)) / 1.2)))).toFixed(1)} Z" fill="#ff5c8a"/>${T(0, 30, 1, '7 MIN', '#1b1422', 58)}</g>` : '' })],
  // V05 Shani dev mol-bhaav nahi karte… Guru saath hain: gentle head shake, warm smile, golden glow clears the gloom
  [at('V05'), at('V06'), t => ({ ...study(t, jupiterGlow(t, at('V05', 0.55)) + push(two(t, seq(t, [[at('V05'), vShakeL], [at('V05', 0.12), vShakeR], [at('V05', 0.24), vShakeL], [at('V05', 0.36), vWarm], [at('V05', 0.6), { ...vPoint, mouthShape: 'smileBig' }]]),
      seq(t, [[at('V05'), sPlead], [at('V05', 0.6), sRelief]])), t, at('V05'), 0.012), { dim: 0.25 * (1 - fade(t, at('V05', 0.55), 1)), gold: fade(t, at('V05', 0.55), 1) }),
    over: card(t, at('V05', 0.5), 'SHANI DEV = SABAR KI SEEKH', [['GURU = KRIPA', at('V05', 0.75), '#c08a1a', 56]], { size: 50, h: 300, label: 'Vedic maanyata', labelAt: at('V05', 0.75) }) })],
  // V06 health: the diary card fills on the spoken dates; Sakshi writes
  [at('V06'), at('K07'), t => ({ ...study(t, twoV(two(t, seq(t, [[at('V06'), vTalk], [at('V06', 0.62), vPleased]]), sNote, '', { mode: 'write' }), t, at('V06'))),
    over: card(t, at('V06', 0.02), 'HEALTH ⚠', [['9 Mar–26 Apr', at('V06', 0.12), '#d22f48'], ['24 Aug–8 Oct', at('V06', 0.3), '#d22f48'], ['JULY: FIT 💪', at('V06', 0.68), '#1b8a3a']], { h: 440, label: 'Doctor ki salah zaroor lein', labelAt: at('V06', 0.5) }) })],
  // K07 gym join: excited, arms up
  [at('K07'), at('V08'), t => study(t, snapIn(kClose(t, sExcited, 'idle', `<g transform="translate(-60 0) scale(${pop(t, at('K07', 0.3))})"><rect x="-40" y="-8" width="80" height="16" fill="${INK}"/><rect x="-56" y="-26" width="18" height="52" rx="6" fill="#d22f48" stroke="${INK}" stroke-width="3"/><rect x="38" y="-26" width="18" height="52" rx="6" fill="#d22f48" stroke="${INK}" stroke-width="3"/></g>`), t, at('K07'), 1.1, 1.0, 540, 950))],
  // V08 deadpan: "Join toh har saal karte hain, is baar jaana bhi padega" -> Sakshi caught out
  [at('V08'), at('V09'), t => study(t, cam(two(t, seq(t, [[at('V08'), vDeadpan], [at('V08', 0.75), { ...vDeadpan, lid: 0.75 }], [at('V08', 0.9), vDeadpan]]), seq(t, [[at('V08'), sExcited], [at('V08', 0.55), sSheepish]])), 380, 1050, 1.15 + 0.05 * fade(t, at('V08'), 2)))],
  // V09 office: cut-in gag, then Vishnu ji knowing look
  [at('V09'), at('V09', 0.62), t => study(t, officeGag(t, at('V09')))],
  [at('V09', 0.62), at('K10'), t => study(t, push(vClose(t, vKnowing), t, at('V09', 0.62), 0.05))],
  // K10 "Naam bataiye, notice bhejti hun!": the lawyer rolls up; legal notice floats up
  [at('K10'), at('V11'), t => ({ ...study(t, push(kClose(t, sCunning), t, at('K10'), 0.03)), over: legalNotice(t, at('K10', 0.35), 99, 800, 700) })],
  // V11 "Notice-votice chhodo…": he laughs, the notice folds into a plane; JOB card
  [at('V11'), at('V12'), t => ({ ...study(t, twoK(two(t, seq(t, [[at('V11'), vLaugh], [at('V11', 0.25), vTalk], [at('V11', 0.7), vPoint]]), seq(t, [[at('V11'), sCunning], [at('V11', 0.3), sPout], [at('V11', 0.6), sNote]]), legalNotice(t, at('V11') - 1, at('V11', 0.02)), { mode: 'write' }), t, at('V11'))),
    over: card(t, at('V11', 0.3), 'JOB: NO RISKS', [['5 Apr–6 May', at('V11', 0.45), '#d22f48'], ['21 Sep–21 Oct', at('V11', 0.62), '#d22f48']], { h: 360 }) })],
  // V12 money: coins rise, Sakshi wide-eyed
  [at('V12'), at('K13'), t => ({ ...study(t, coins(t, at('V12')) + twoV(two(t, seq(t, [[at('V12'), vPleased], [at('V12', 0.5), vTalk]]), seq(t, [[at('V12'), sWow], [at('V12', 0.5), sNote]]), '', { mode: 'write' }), t, at('V12'))),
    over: card(t, at('V12', 0.35), 'MONEY ✓', [['21 Mar–15 Apr', at('V12', 0.45), '#1b8a3a'], ['4–28 Jun', at('V12', 0.75), '#1b8a3a']], { h: 360 }) })],
  // K13 "Toh Ferrari?": sneaky side-eye, red car doodle in the diary
  [at('K13'), at('V14'), t => study(t, cam(kClose(t, sSneaky, 'write', `<g transform="translate(-60 10) scale(${pop(t, at('K13', 0.2))})"><path d="M-50 10 L-34 -14 L30 -14 L50 10 Z" fill="#d22f48" stroke="${INK}" stroke-width="4"/><rect x="-60" y="8" width="120" height="22" rx="8" fill="#d22f48" stroke="${INK}" stroke-width="4"/><circle cx="-34" cy="32" r="10" fill="${INK}"/><circle cx="34" cy="32" r="10" fill="${INK}"/></g>`), 300, 1000, 1.25))],
  // V14 "FD.": one-word deadpan, punch-in; the car turns into an FD stamp
  [at('V14'), at('V15'), t => ({ ...study(t, snapIn(vClose(t, vDeadpan), t, at('V14'), 1.0, 1.18, 540, 760)),
    over: `<g transform="translate(760 330) scale(${0.62 * pop(t, at('V14', 0.2))}) rotate(-8)"><rect x="-230" y="-100" width="460" height="200" rx="20" fill="#fffaf0" stroke="#1b8a3a" stroke-width="12"/>${T(0, 44, 1, 'FD ✓', '#1b8a3a', 120)}</g>` })],
  // V15 love: hearts float, warm; LOVE card
  [at('V15'), at('K16'), t => ({ ...study(t, hearts(t, at('V15')) + two(t, seq(t, [[at('V15'), vWarm], [at('V15', 0.5), vPleased]]), seq(t, [[at('V15'), sWow], [at('V15', 0.45), sBlush]]), '', { mode: 'idle' }), { gold: 0.6 }),
    over: card(t, at('V15', 0.2), 'LOVE + SHAADI ✓', [['26 Jun–26 Nov', at('V15', 0.4), '#c62b6a']], { h: 300, label: 'Vedic maanyata', labelAt: at('V15', 0.4) }) })],
  // K16 "Waah!": claps
  [at('K16'), at('V17'), t => study(t, hearts(t, at('V15')) + snapIn(kClose(t, sClap), t, at('K16'), 1.15, 1.0, 540, 950), { gold: 0.6 })],
  // V17 "Bas August-October behas mat karna. Wakeel sahiba, ab iska bhi discount chahiye?" — he teases first
  [at('V17'), at('V19'), t => ({ ...study(t, push(two(t, seq(t, [[at('V17'), vFinger], [at('V17', 0.7), vWarm]]), seq(t, [[at('V17'), sBlush], [at('V17', 0.5), sSheepish]]),
      stormCloud(t, 790, 760)), t, at('V17'), 0.02, 420, 1050)),
    over: card(t, at('V17', 0.05), 'CAREFUL', [['24 Aug–8 Oct', at('V17', 0.2), '#d22f48']], { h: 260, y: 300 }) })],
  // V19 family: home cut-in, then calm
  [at('V19'), at('K20'), t => ({ ...study(t, homeGag(t, at('V19'))), over: card(t, at('V19', 0.55), 'FAMILY: BADON KA SAMMAN', [['PROPERTY: sirf saaf deal', at('V19', 0.75), '#3b4fa8', 48]], { h: 290, y: 970, size: 52 }) })],
  // K20 "Mummy ki daant bhi?": loophole face
  [at('K20'), at('V21'), t => study(t, cam(kClose(t, sLoophole), 540, 900, 1.12))],
  // V21 "Wo daant nahi, prasad hai, sar aankhon pe.": he laughs softly; Sakshi giggles
  [at('V21'), at('V21', 0.55), t => study(t, push(vClose(t, seq(t, [[at('V21'), vTease], [at('V21', 0.3), vLaugh]])), t, at('V21'), 0.04))],
  [at('V21', 0.55), at('V22'), t => study(t, twoK(two(t, vBless, sGiggle), t, at('V21')))],
  // V22 remedies: one card, three words appear on the spoken words
  [at('V22'), at('V23'), t => ({ ...study(t, twoV(two(t, seq(t, [[at('V22'), vTalk], [at('V22', 0.5), { ...vTalk, tilt: -3 }], [at('V22', 0.8), vWarm]]), sNote, '', { mode: 'write' }), t, at('V22')), { gold: 0.4 }),
    over: card(t, at('V22', 0.05), 'UPAY', [['Sundarkand (Mangal)', at('V22', 0.25), '#8a2238', 50], ['Chaandi · Bhojan seva', at('V22', 0.55), '#3b4fa8', 50]], { h: 380, label: 'Vedic maanyata', labelAt: at('V22', 0.1) }) })],
  // V23 "Aur is saal brake bhi lagana, aur gym bhi jaana.": the ram brakes this time; scroll glows
  [at('V23'), at('V23', 0.45), t => study(t, ramGag(t, at('V23') - 0.2, true), { gold: 0.6 })],
  [at('V23', 0.45), at('K24'), t => ({ ...study(t, push(two(t, vBless, sProud), t, at('V23', 0.45), 0.02), { gold: 0.8 }),
    over: card(t, at('V23', 0.5), 'GUSSA KAM, MEHNAT ZYADA', [], { h: 170, y: 320, size: 46 }) })],
  // K24 CTA: Sakshi alone (no deity in the selling part); gavel taps, one wink, link chip
  [at('K24'), B('endcard').start, t => ({ ...study(t, push(kClose(t, seq(t, [[at('K24'), sWin], [at('K24', 0.35), sWink], [at('K24', 0.55), sWin]])), t, at('K24'), 0.02)), over: linkChip(t, at('K24', 0.45)) })],
  [B('endcard').start, DUR, t => ({ ...study(t, kClose(t, sProud, 'idle', T(-60, 10, 1, 'ARIES ✓', '#1b8a3a', 40))), over: `<rect x="90" y="270" width="830" height="200" rx="24" fill="#1b1422" opacity="0.9"/>` + txt(505, 350, 1, 'Aries dost ko bhejo', '#ffffff', 54) + txt(505, 430, 1, 'Poori guide: LINK', '#ffd24a', 56) })],
];
SHOTS.forEach((s, i) => { if (SHOTS[i + 1]) s[1] = SHOTS[i + 1][0]; });
module.exports = { ...K.film(SHOTS, DUR), coverFrame, FACES: { vWrite, vAmused, vTease, vSerious, vWarm, vTalk, vPoint, vFinger, vDeadpan, vKnowing, vLaugh, vPleased, vBless } };
