// Film: Rashi ki file — Aries 2026 ka dard, 2027 ka mol-bhaav (script v11). Only Vishnu ji and Sakshi (owner, 24 Nov 2026).
// Free Kokoro voices (no credits). Original meme clips are baked into the voice track on Sakshi's beats.
// Helpers, faces, places and props are carried over from the approved Aries 2027 cut (cuts/2027-aries-draft.js).
// Beat times come from videos/<slug>/script.json (the voice cut), so re-timing a line re-times the film.
const path = require('path');
const K = require('../kit');
const { E, L, clamp, ease, backOut, vp, kp, sakshi, cam, txt, pill } = K;
// Kind faces for Vishnu ji everywhere in this reel (owner rule + art review 24 Nov): open eyes, level soft brows, a real smile,
// never the half-closed 'sly' default, never a wink or a one-brow smirk.
const kindV = p => { const b = Math.max(0.65, ((p.browL ?? 0) + (p.browR ?? 0)) / 2);
  return { ...p, wink: 0, lid: p.eyeMode === 'happy' ? p.lid : 0, browL: b, browR: b, lookX: Math.min(8, Math.max(0, p.lookX ?? 0)), tilt: Math.max(-4, Math.min(4, p.tilt ?? 0)),
    mouthShape: ['sly', 'cat'].includes(p.mouthShape) ? 'smileBig' : p.mouthShape }; };
const vishnu = (p, ...a) => K.vishnu(kindV(p), ...a);
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
const vAmused = { ...V2, lid: 0, browL: 0.55, browR: 0.55, mouthShape: 'smileBig', lookX: 10, tilt: -4 };   // kind: open eyes, level brows (owner rule)                // eyebrow up at the wakeel
const vTease = { ...V2, lid: 0, browL: 0.6, browR: 0.6, lookX: 8, tilt: 8, mouthShape: 'smileBig', blushHatch: true };
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
const C = p => ({ ...p, lawyer: 1 });   // owner 24 Nov 16:09: complete vakil costume (BCI rules for women advocates)
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
function homeGag(t, t0, people = true) {
  let o = `<rect x="100" y="300" width="820" height="640" fill="#2a2058"/>` + glow(510, 640, 380, 0.7);
  o += `<path d="M280 620 L510 430 L740 620 Z" fill="#c2463a" stroke="${INK}" stroke-width="8"/><rect x="310" y="610" width="400" height="250" fill="#f3d9a8" stroke="${INK}" stroke-width="8"/><rect x="470" y="720" width="80" height="140" rx="6" fill="#8a5a3a" stroke="${INK}" stroke-width="6"/>`;
  for (const wx of [350, 590]) o += `<rect x="${wx}" y="660" width="80" height="70" fill="#ffd56a" stroke="${INK}" stroke-width="6"/>`;
  o += `<path d="M310 612 ${[0,1,2,3,4,5,6,7].map(k => `Q${335 + k * 50} 650 ${360 + k * 50} 612`).join(' ')}" fill="none" stroke="#2f8a3a" stroke-width="6"/>` + [0,1,2,3,4,5,6,7].map(k => `<path d="M${335 + k * 50} 628 l-10 22 l20 0 Z" fill="${k % 2 ? '#ff9a2a' : '#2f8a3a'}" stroke="${INK}" stroke-width="3"/>`).join('');
  o += `<g transform="translate(510 905)"><ellipse rx="120" ry="32" fill="#ff5c8a" stroke="${INK}" stroke-width="5"/><ellipse rx="80" ry="20" fill="#ffd24a"/><ellipse rx="40" ry="10" fill="#2fb3a0"/></g>`;
  if (people) for (const [x, h, c] of [[380, 120, '#c2463a'], [440, 150, '#7a2f5a'], [600, 140, '#3a4a7a'], [650, 100, '#e0a030']]) o += `<g transform="translate(${x} 860)"><circle cx="0" cy="${-h}" r="22" fill="#d9a77e" stroke="${INK}" stroke-width="5"/><path d="M-26 ${-h + 24} Q0 ${-h + 10} 26 ${-h + 24} L30 0 L-30 0 Z" fill="${c}" stroke="${INK}" stroke-width="5"/></g>`;
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
// one place per topic (owner rule: no single repeated scene); a cloud-wipe 'flight' between places
const PLACES = [['K01', 'study'], ['V04', 'cosmos'], ['abhi_maza', 'cityNight'], ['K11', 'indiaDusk'], ['K13', 'taj'], ['K16', 'cosmos'], ['K19', 'study']];
const placeAt = t => { let k = 0; PLACES.forEach(([id], i) => { if (t >= at(id) - 0.05) k = i; }); return k; };
let DX = 0;   // close-ups set this so the landmark sits beside the character instead of behind
const study = (t, actors, o = {}) => {
  const k = placeAt(t), name = PLACES[k][1], S0 = name === 'study' ? L.cloudStudy(t, o) : W[name](t, o), dx = DX; DX = 0;
  const sc = 1.03 + Math.abs(dx) / 540, back = dx ? `<g transform="translate(${540 + dx} 960) scale(${sc.toFixed(3)}) translate(-540 -960)">${S0.back}</g>` : S0.back;
  return { defs: S0.defs, body: back + actors + S0.front + (k > 0 ? W.cloudWipe(t, at(PLACES[k][0]) - 0.2) : '') };
};
const VX = 300, VY = 1250, VS = 0.6, KX = 790, KY = 1240, KS = 0.64;         // two-shot: Vishnu ji left on his cloud, Sakshi right on a small cloud
const two = (t, vpose, kpose, extra = '', dOpt = {}) => vishnu(vpose, VX, VY, VS, t) + smallCloud(KX - 40, KY + 380, 1.1) + sakshi(kpose, KX, KY, KS, t) + diary(t, dOpt.x ?? 600, dOpt.y ?? 1170, dOpt.s ?? 0.55, dOpt.mode ?? 'idle', dOpt.page ?? '') + extra;
const twoV = (body, t, t0) => cam(body, 470, 1000, 1.12 + 0.02 * Math.max(0, t - t0));   // favour Vishnu ji, Sakshi stays fully in frame   // favour Vishnu ji
const twoK = (body, t, t0) => cam(body, 790, 1000, 1.3 + 0.03 * Math.max(0, t - t0));   // favour Sakshi
const vClose = (t, pose) => { DX = 190; return vishnu(pose, 400, 1090, 0.9, t); };
const kClose = (t, pose, dmode = 'idle', page = '') => { DX = -190; return smallCloud(620, 1720, 1.5) + sakshi(pose, 660, 1150, 0.82, t) + diary(t, 330, 1430, 0.62, dmode, page); };   // diary on her left, clear of the right/bottom safe zones
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
const COVER_HOLD = 0.4;   // frame 0 is the cover (Instagram grid); it gives way to the hook shot within 0.4 s

// ---------- new faces for this reel (Sakshi bargains and lip-syncs the memes; Vishnu ji stays kind and in charge) ----------
const sCheek = C({ ...k0, browUp: 1.2, lid: 0, mouth: 'o', blush: 0.5, lookY: -4, armL: { E: [300, 1010], W: [235, 895], hand: 'palm' }, armR: { E: [780, 1010], W: [845, 895], hand: 'palm' } });   // palms flung up beside the face (hands drawn over the head get hidden)
const sPanic = C({ ...k2, browSad: 1, browUp: 0.8, mouth: 'o', blush: 0.4, lookX: -10, tilt: 6, ...armsOut });
const sRub = (t) => C({ ...k2, browUp: 0.7, lid: 0, mouth: 'grin', blush: 0.6, tilt: -4 + 4 * Math.sin(t * 6), armL: { E: [290, 990], W: [230, 860 - 30 * Math.abs(Math.sin(t * 7))], hand: 'fist' }, armR: { E: [790, 990], W: [850, 860 - 30 * Math.abs(Math.sin(t * 7 + 1))], hand: 'fist' } });   // 'let's go' fist pumps
const sDealer = C({ ...k2, ...pointUp, browLift: 1, browLiftAmt: 1.2, lid: 0.3, mouth: 'smirk', blush: 0.3, lookX: -12, tilt: -6 });
const sCount = C({ ...k2, armR: { E: [770, 1005], W: [810, 890], hand: 'point' }, browUp: 0.7, browSad: 0.4, mouth: 'grin', blush: 0.7, lookX: -14, tilt: 7 });
const sSky = C({ ...k2, armL: { E: [290, 980], W: [220, 840], hand: 'palm' }, armR: { E: [790, 980], W: [860, 840], hand: 'palm' }, browSad: 1.2, browUp: 0.4, mouth: 'o', lookY: -22, tilt: -5 });
const sJoin = C({ ...k0, happy: 1, mouth: 'smile', blush: 0.8, armL: { E: [430, 1065], W: [527, 960], hand: 'palm' }, armR: { E: [650, 1065], W: [553, 960], hand: 'palm' }, tilt: 6 });
const sGlare = C({ ...k0, browLift: -1, browLiftAmt: 1, browSad: 0.3, mouth: 'pout', lookX: 22, lookY: 12, tilt: -4 });
const sFreeze = C({ ...k0, browUp: 1.1, lid: 0, mouth: 'o', blush: 0.9, lookX: -18, tilt: 0 });
const vShrug = { ...vWarm, tilt: -6, lookX: 8 };
const vInvite = { ...vPoint, wink: 0, lid: 0, browL: 0.5, browR: 0.5, mouthShape: 'smileBig', lookX: 14, tilt: -3 };
const vAdvise = { ...V2, lid: 0, browL: 0.75, browR: 0.75, mouthShape: 'smileBig', lookX: 4, tilt: 0 };   // advice face (art review): open, level, even smile
const vListen = { ...V0, lid: 0, browL: 0.55, browR: 0.55, mouthShape: 'smileBig', lookX: 14, tilt: 6 };

// ---------- props for this reel ----------
// the ARIES 2026 complaint scroll that keeps unrolling down off the cloud (the running prop)
const ROWS = ['Salary gayab', 'Neend gayab', 'Share -40%', 'Boss: Sunday', 'Maasi: kab?'];
function longScroll(t, t0, x, y0, s = 1, maxLen = 1250) {
  if (t < t0) return '';
  const len = Math.min(maxLen, 120 + 520 * Math.max(0, t - t0)), w = 360;
  let o = `<g transform="translate(${x} ${y0 + Math.sin(t * 1.2) * 5}) scale(${s})">` + glow(0, 0, 220, 0.35);
  o += `<rect x="${-w / 2}" y="0" width="${w}" height="${len}" fill="#f6e7c4" stroke="${INK}" stroke-width="7"/>`;
  o += T(0, 70, 1, 'ARIES 2026', '#8a2238', 50);
  ROWS.forEach((r, i) => { const y = 160 + i * 170; if (y + 30 < len) o += T(0, y, 1, r, '#3a2a2a', 46); });
  o += `<rect x="${-w / 2 - 22}" y="-22" width="${w + 44}" height="44" rx="22" fill="#e2c88f" stroke="${INK}" stroke-width="7"/>`;
  o += `<g transform="translate(0 ${len})"><rect x="${-w / 2 - 22}" y="-26" width="${w + 44}" height="52" rx="26" fill="#e2c88f" stroke="${INK}" stroke-width="7"/><path d="M${-w / 2 - 10} 0 h${w + 20}" stroke="#c99a3c" stroke-width="6" transform="rotate(${(t * 400) % 360 > 180 ? 0 : 0})"/></g>`;
  return o + '</g>';
}
// 2026 pain doodles, each pops in on its spoken words: wallet + moth, 3 AM phone, crashing share chart
function painPanel(t, t0, tPhone, tChart) {
  let o = `<rect x="100" y="300" width="820" height="640" fill="#f3ecff"/>` + T(510, 400, 1, '2026 KA DARD', '#8a2238', 64);
  const k1 = 1.35 * pop(t, t0 + 0.1), mx = 260 + 40 * Math.sin(t * 5), my = 500 + 24 * Math.sin(t * 7);
  o += `<g transform="translate(260 680) scale(${k1})"><rect x="-110" y="-70" width="220" height="140" rx="22" fill="#8a5a3a" stroke="${INK}" stroke-width="7"/><path d="M-110 -20 h220" stroke="${INK}" stroke-width="5"/><rect x="40" y="-24" width="70" height="44" rx="12" fill="#a0683a" stroke="${INK}" stroke-width="5"/>${T(0, 120, 1, '₹0', '#d22f48', 50)}</g>`;
  if (t > t0 + 0.5) o += `<g transform="translate(${mx} ${my})"><ellipse cx="-16" cy="0" rx="20" ry="12" fill="#c9b9a0" stroke="${INK}" stroke-width="4" transform="rotate(${-20 + 30 * Math.sin(t * 30)})"/><ellipse cx="16" cy="0" rx="20" ry="12" fill="#c9b9a0" stroke="${INK}" stroke-width="4" transform="rotate(${20 - 30 * Math.sin(t * 30)})"/><ellipse rx="7" ry="14" fill="#7a6a5a"/></g>`;
  if (t > tPhone) { const k2 = 1.35 * pop(t, tPhone); o += `<g transform="translate(510 660) scale(${k2})"><rect x="-70" y="-120" width="140" height="240" rx="24" fill="#1b1422" stroke="${INK}" stroke-width="6"/><rect x="-58" y="-100" width="116" height="190" rx="10" fill="#6ad0ff" opacity="${0.7 + 0.3 * Math.sin(t * 9)}"/>${T(0, -20, 1, '3:00', '#ffffff', 40)}${T(0, 30, 1, 'AM', '#ffffff', 30)}<circle cx="0" cy="104" r="8" fill="#555"/></g>`; }
  if (t > tChart) { const u = clamp((t - tChart) / 0.5), k3 = 1.1 * pop(t, tChart);
    let d = 'M-120 -60 L-70 -80 L-30 -50 L10 -90'; d += ` L${10 + 110 * u} ${-90 + 210 * ease(u)}`;
    o += `<g transform="translate(770 660) scale(${k3})"><rect x="-140" y="-130" width="280" height="260" rx="16" fill="#ffffff" stroke="${INK}" stroke-width="6"/><path d="${d}" fill="none" stroke="#d22f48" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>${u > 0.9 ? T(30, 100, 1, '-40%', '#d22f48', 44) : ''}</g>`; }
  return panel(t, t0, o, '#f3ecff');
}
const fallingChart = (t, t0) => { const u = clamp((t - t0) / 0.8); return `<g transform="translate(${280 - 30 * u} ${430 + 330 * ease(u)}) scale(1.5) rotate(${-25 * u})">${glow(0, 0, 90, 0.4)}<rect x="-90" y="-70" width="180" height="140" rx="12" fill="#ffffff" stroke="${INK}" stroke-width="6"/><path d="M-70 -40 L-20 -50 L10 -20 L60 50" fill="none" stroke="#d22f48" stroke-width="10" stroke-linecap="round"/></g>`; };
// floating phone with the boss's Sunday message; o.block shows a BLOCK button, o.mute slashes the bell
function bossPhone(t, x, y, s, o = {}) {
  const buzz = o.buzz ? Math.sin(t * 50) * 5 : 0;
  let g = `<g transform="translate(${x + buzz} ${y + Math.sin(t * 1.6) * 6}) scale(${s}) rotate(${o.rot ?? -6})">` + glow(0, 0, 230, 0.45);
  g += `<rect x="-150" y="-260" width="300" height="520" rx="44" fill="#1b1422" stroke="${INK}" stroke-width="8"/><rect x="-130" y="-230" width="260" height="440" rx="20" fill="#eef3ff"/>`;
  if (!o.notext) g += `<rect x="-115" y="-200" width="230" height="140" rx="18" fill="#ffffff" stroke="#bcd" stroke-width="4"/>` + T(0, -150, 1, 'BOSS', '#1b1422', 40) + T(0, -95, 1, 'SUNDAY 🙂', '#d22f48', 34);
  g += `<g transform="translate(0 40)"><path d="M-40 30 Q-40 -40 0 -44 Q40 -40 40 30 L52 44 L-52 44 Z" fill="#ffd24a" stroke="${INK}" stroke-width="6"/><circle cx="0" cy="56" r="10" fill="${INK}"/>${o.mute ? `<path d="M-60 -50 L60 70" stroke="#d22f48" stroke-width="12" stroke-linecap="round" opacity="${clamp(o.mute)}"/>` : ''}</g>`;
  if (o.block) g += `<g transform="translate(0 170) scale(${o.block})"><rect x="-90" y="-30" width="180" height="60" rx="30" fill="#d22f48" stroke="${INK}" stroke-width="5"/>${T(0, 12, 1, 'BLOCK', '#ffffff', 32)}</g>`;
  return g + '</g>';
}
const dhaniya = (t, t0, x, y) => { if (t < t0) return ''; let o = `<g transform="translate(${x} ${y - 60 * ease(clamp((t - t0) / 0.6))}) scale(${1.5 * pop(t, t0)}) rotate(${8 * Math.sin(t * 3)})">${glow(0, -40, 120, 0.5)}`;
  // coriander bunch: thin stems tied with a band, many small lobed leaves (researched look: flat, scalloped, bright green)
  for (let i = 0; i < 9; i++) { const a = -50 + i * 12.5, ex = a * 1.2, ey = -90 - 20 * Math.cos(i); o += `<path d="M0 50 Q${a * 0.3} -10 ${ex} ${ey}" fill="none" stroke="#3d8a3a" stroke-width="4"/>`;
    for (let j = 0; j < 3; j++) { const lx = ex + (j - 1) * 16, ly = ey - (j === 1 ? 14 : 0), rot = (j - 1) * 30 + a * 0.4; o += `<g transform="translate(${lx} ${ly}) rotate(${rot})"><path d="M0 0 C-14 -6 -16 -22 -6 -26 C-4 -34 8 -34 8 -24 C18 -22 16 -6 0 0 Z" fill="#4fae4a" stroke="${INK}" stroke-width="3"/><path d="M0 0 L1 -22" stroke="#2f7a3a" stroke-width="2"/></g>`; } }
  return o + `<rect x="-16" y="30" width="32" height="18" rx="6" fill="#d22f48" stroke="${INK}" stroke-width="4"/></g>`; };
// wedding hall cut-in: marigold garlands, string lights, an aunty (generic, Indian saree) whose bubble grows SHAADI KAB? -> GOOD NEWS KAB?
function weddingPanel(t, t0, tGood) {
  let o = `<rect x="100" y="300" width="820" height="640" fill="#5a1f3a"/>` + glow(510, 600, 420, 0.5);
  for (let r = 0; r < 2; r++) o += `<path d="M100 ${360 + r * 70} ${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `Q${150 + k * 102} ${410 + r * 70} ${202 + k * 102} ${360 + r * 70}`).join(' ')}" fill="none" stroke="#ff9a1a" stroke-width="16" stroke-dasharray="2 14" stroke-linecap="round"/>`;
  for (let i = 0; i < 14; i++) o += `<circle cx="${130 + i * 58}" cy="${470 + 18 * Math.sin(i)}" r="7" fill="${['#ffd24a', '#ff5c8a', '#6ad0ff'][i % 3]}" opacity="${0.5 + 0.5 * Math.abs(Math.sin(t * 3 + i))}"/>`;
  o += `<rect x="100" y="860" width="820" height="80" fill="#8a2f4a"/>`;
  // no third character (two-character rule): stage, mandap pillars and a garland; the bubble comes from someone off-screen
  o += `<rect x="180" y="560" width="40" height="300" fill="#ffd24a" stroke="${INK}" stroke-width="6"/><rect x="800" y="560" width="40" height="300" fill="#ffd24a" stroke="${INK}" stroke-width="6"/><path d="M160 560 Q510 470 860 560" fill="none" stroke="#ff5c8a" stroke-width="18" stroke-dasharray="2 16" stroke-linecap="round"/><rect x="300" y="760" width="420" height="100" rx="20" fill="#c2463a" stroke="${INK}" stroke-width="7"/>` + [360, 660].map(x => `<g transform="translate(${x} 740)"><rect x="-50" y="-60" width="100" height="80" rx="14" fill="#ffd24a" stroke="${INK}" stroke-width="6"/><rect x="-40" y="20" width="10" height="40" fill="${INK}"/><rect x="30" y="20" width="10" height="40" fill="${INK}"/></g>`).join('');
  const good = t > tGood, k = good ? pop(t, tGood) : pop(t, t0 + 0.2), sc = good ? 1.15 + 0.1 * ease(clamp((t - tGood) / 0.5)) : 1;
  o += `<g transform="translate(560 600) scale(${(k * sc).toFixed(3)})"><path d="M-220 -110 h440 a30 30 0 0 1 30 30 v150 a30 30 0 0 1 -30 30 h-300 l-160 40 l100 -40 h-80 a30 30 0 0 1 -30 -30 v-150 a30 30 0 0 1 30 -30 Z" fill="#ffffff" stroke="${INK}" stroke-width="8"/>${T(0, 10, 1, good ? 'GOOD NEWS' : 'SHAADI', good ? '#c62b6a' : '#8a2238', 62)}${T(0, 82, 1, 'KAB?', '#1b1422', 62)}</g>`;
  return panel(t, t0, o, '#5a1f3a');
}
const memeTag = (t, t0, l1, l2, col = '#ffd24a') => t < t0 ? '' : `<g transform="translate(520 ${l2 ? 380 : 420}) scale(${pop(t, t0, 0.22)}) rotate(-4)"><rect x="-450" y="-86" width="900" height="${l2 ? 220 : 130}" rx="28" fill="#1b1422" opacity="0.92" stroke="${col}" stroke-width="8"/>${txt(0, 6, 1, l1, col, 70)}${l2 ? txt(0, 100, 1, l2, '#ffffff', 64) : ''}</g>`;
const hookCard2 = (t) => t > 2.4 ? '' : `<g opacity="${(1 - fade(t, 2.15, 0.25)).toFixed(2)}"><rect x="90" y="272" width="830" height="200" rx="26" fill="#1b1422" opacity="0.9" stroke="#ffd24a" stroke-width="6"/>` + txt(505, 352, 1, 'MESH / ARIES 2027:', '#ffd24a', 58) + txt(505, 432, 1, 'BHAGWAN SE MOL-BHAAV', '#ffffff', 56) + '</g>';
const tally = (t, t0) => card(t, t0, 'FINAL HISAAB', [['PAISA ✓  MAUKE ✓  RISHTE ✓', t0 + 0.35, '#1b8a3a', 50], ['SADE SATI CANCEL ✗', t0 + 0.45, '#d22f48', 52]], { h: 330 });
const linkChip2 = (t, t0) => t < t0 ? '' : `<g transform="translate(500 400) scale(${pop(t, t0)})"><rect x="-440" y="-110" width="880" height="220" rx="60" fill="#ffd24a" stroke="${INK}" stroke-width="10"/>${T(0, -14, 1, 'POORI ARIES 2027 GUIDE', '#1b1422', 56)}${T(0, 66, 1, 'BIO KE LINK MEIN →', '#8a2238', 56)}</g>` + `<g transform="translate(${760 + 30 * Math.sin(t * 6)} 650) rotate(-20)"><path d="M-70 -26 L30 -26 L30 -60 L90 0 L30 60 L30 26 L-70 26 Z" fill="#ff5c8a" stroke="${INK}" stroke-width="8"/></g>`;
const kC = (t, pose, dmode, page) => kClose(t, pose, dmode, page);
const END = DUR - 1.0;

// ---------- v12.1 props: Mangal vakri, home with Guru and Ketu, Shani's first knock ----------
function marsRetro(t, t0) {   // red Mangal loops backwards along a dotted path; a calendar reads 10 JAN → 1 APR
  const u = clamp((t - t0) / 2.2), a = Math.PI * (0.2 + 1.2 * ease(u)), x = 540 + 230 * Math.cos(a), y = 640 - 120 * Math.sin(a) * (u < 0.5 ? 1 : -0.4);
  let o = `<rect x="100" y="300" width="820" height="640" fill="#140f2e"/>` + `<path d="M310 640 A230 120 0 1 1 770 640" fill="none" stroke="#8f7fd8" stroke-width="5" stroke-dasharray="10 12"/>`;
  o += `<g transform="translate(${x} ${y})">${glow(0, 0, 110, 0.5)}<circle r="58" fill="#d8452f" stroke="${INK}" stroke-width="7"/><circle cx="-16" cy="-14" r="12" fill="#b8341f"/><circle cx="18" cy="16" r="9" fill="#b8341f"/></g>`;
  o += `<g transform="translate(${x - 90} ${y - 10}) rotate(180)"><path d="M0 0 L40 -22 L40 22 Z" fill="#ffd24a" stroke="${INK}" stroke-width="4"/></g>`;
  o += T(510, 400, 1, 'MANGAL VAKRI', '#ff8a6a', 60) + `<g transform="translate(510 860) scale(${pop(t, t0 + 0.6)})"><rect x="-260" y="-50" width="520" height="100" rx="20" fill="#fffaf0" stroke="${INK}" stroke-width="6"/>${T(0, 18, 1, '10 JAN → 1 APR', '#d22f48', 54)}</g>`;
  return panel(t, t0, o, '#140f2e');
}
function homeGuruKetu(t, t0, tKetu) {   // the warm home (from the approved cut) with Guru's golden glow; Ketu's grey shadow drifts in
  let extra = ''; if (t > tKetu) { const k = fade(t, tKetu, 0.6); extra += `<g opacity="${(0.75 * k).toFixed(2)}"><circle cx="760" cy="460" r="70" fill="#5a5a72"/><path d="M700 480 Q600 520 520 470" fill="none" stroke="#5a5a72" stroke-width="22" stroke-linecap="round"/>${T(760, 470, 1, 'KETU', '#eceaf6', 30)}</g>`; }
  return homeGag(t, t0, false) + `<g transform="translate(250 450)">${glow(0, 0, 120, 0.7)}<circle r="54" fill="#e8b84a" stroke="${INK}" stroke-width="6"/>${T(0, 12, 1, 'GURU', '#5a3a0a', 30)}</g>` + extra;
}
function dastak(t, t0) {   // a closed door with a calm blue glow; three soft knock rings (no figure shown)
  let o = `<rect x="380" y="430" width="260" height="440" rx="16" fill="#3a2a5a" stroke="${INK}" stroke-width="8"/><rect x="410" y="460" width="200" height="380" rx="10" fill="#4b3a72" stroke="${INK}" stroke-width="5"/><circle cx="590" cy="660" r="12" fill="#ffd24a" stroke="${INK}" stroke-width="4"/>`;
  o = glow(510, 650, 300, 0.25) + o;
  for (let i = 0; i < 3; i++) { const ti = t0 + 0.3 + i * 0.5; if (t < ti) continue; const k = clamp((t - ti) / 0.6); o += `<circle cx="510" cy="650" r="${150 + 300 * k}" fill="none" stroke="#c9d6ff" stroke-width="${18 * (1 - k) + 2}" opacity="${(1 - 0.8 * k).toFixed(2)}"/>`; }
  return `<g transform="translate(0 260)">${o}</g>` + saturn(820, 760, 0.8);
}
const tally2 = (t, t0) => card(t, t0, 'FINAL HISAAB', [['PYAAR ✓   GHAR ½', t0 + 0.3, '#1b8a3a', 60], ['KAAM: APRIL KE BAAD', t0 + 0.7, '#d22f48', 58]], { h: 360 });

const SHOTS = [
  // 1 K01 hook: cover, then the wakeel arrives; the 2026 scroll drops and keeps unrolling
  [0, at('V02'), t => t < COVER_HOLD ? coverFrame(t) : ({ ...study(t, snapIn(longScroll(t, Math.max(2.6, at('K01', 0.55)), 560, 760, 0.75) + two(t, seq(t, [[0, vWrite], [at('K01', 0.6), vAmused]]), seq(t, [[0, sObject], [at('K01', 0.5), sLawyer]]), '', { mode: 'idle' }), t, 0, 1.12, 1.0, 540, 900)), over: hookCard2(t) })],
  // 2 V02 "itni lambi list… shaadi ka menu?": he watches it unroll, then laughs
  [at('V02'), at('K03'), t => study(t, push(vClose(t, seq(t, [[at('V02'), vAmused], [at('V02', 0.55), vTease], [at('V02', 0.85), vLaugh]])) + longScroll(t, Math.max(2.6, at('K01', 0.55)), 770, 430, 0.62, 2000), t, at('V02'), 0.03))],
  // 3 K03 2026 pain: doodles pop on the words (kharcha, neend, share)
  [at('K03'), at('K03', 0.8), t => study(t, sakshi(seq(t, [[at('K03'), sPout], [at('K03', 0.3), sDespair], [at('K03', 0.6), sShock]]), 790, 1220, 0.45, t) + painPanel(t, at('K03'), at('K03', 0.3), at('K03', 0.65)))],
  // FAAAH on the crash
  [at('K03', 0.8), at('V04'), t => study(t, snapIn(kC(t, seq(t, [[at('K03', 0.8), C({ ...k0, browUp: 1.3, lid: 0, mouth: 'o', blush: 0.2, lookX: -20, lookY: 10, tilt: 3 })], [at('K03', 0.97), sShock]]), 'shiver') + fallingChart(t, at('K03', 0.82)), t, at('K03', 0.8), 1.25, 1.05, 540, 900))],
  // 4 V04 why 2026 hurt: Shani dev in the 12th (expenses); calm, kind; card fades before the meme
  [at('V04'), at('arey_baap_re'), t => ({ ...study(t, push(vishnu(seq(t, [[at('V04'), vAdvise], [at('V04', 0.5), vWarm]]), 540, 1180, 0.78, t) + saturn(800, 700, 0.9), t, at('V04'), 0.03), { dim: 0.3 * fade(t, at('V04'), 0.8) }),
    over: t < at('V04', 0.94) ? card(t, at('V04', 0.15), '2026: SHANI 12TH BHAAV', [['kharcha + neend', at('V04', 0.4), '#3b4fa8', 52]], { h: 300, col: '#3b4fa8', label: 'Chandra rashi · Vedic maanyata', labelAt: at('V04', 0.3) }) : '' })],
  // 5 MEME "Arey baap re" -> K05 "Toh kya 2027 bhi aisa hi jayega?"
  [at('arey_baap_re'), at('V06'), t => ({ ...study(t, snapIn(kC(t, seq(t, [[at('arey_baap_re'), sCheek], [at('K05'), sPlead]]), t < at('K05') ? 'shiver' : 'idle'), t, at('arey_baap_re'), 1.3, 1.08, 540, 860), { dim: 0.3 }),
    over: t < at('K05') ? memeTag(t, at('arey_baap_re'), 'AREY BAAP RE!') : '' })],
  // 6 V06 "Ghabrao mat, isiliye toh mol-bhaav ho raha hai, bolo kya chahiye?": warm laugh, gold clears the gloom
  [at('V06'), at('abhi_maza'), t => ({ ...study(t, jupiterGlow(t, at('V06', 0.1)) + push(two(t, seq(t, [[at('V06'), vLaugh], [at('V06', 0.35), vWarm], [at('V06', 0.7), vInvite]]), seq(t, [[at('V06'), sPlead], [at('V06', 0.35), sRelief], [at('V06', 0.75), sExcited]])), t, at('V06'), 0.015), { dim: 0.3 * (1 - fade(t, at('V06', 0.1), 1)), gold: fade(t, at('V06', 0.1), 1) }) })],
  // 7 MEME "Abhi maza aayega na bhidu" (fist pumps) -> K07 "January se hi naya kaam"
  [at('abhi_maza'), at('V08'), t => ({ ...study(t, snapIn(kC(t, t < at('K07') ? sRub(t) : C({ ...sExcited, blush: 1, browUp: 1.2, tilt: -8 })), t, at('abhi_maza'), 1.25, 1.05, 540, 900)),
    over: t < at('K07') ? memeTag(t, at('abhi_maza'), 'ABHI MAZA AAYEGA', 'NA BHIDU!') : card(t, at('K07', 0.35), 'JANUARY: NAYA KAAM!', [], { h: 170, y: 320, size: 64 }) })],
  // 8 V08 Mangal vakri 10 Jan – 1 Apr: the backwards-looping Mars cut-in, then his advice face
  [at('V08'), at('V08', 0.55), t => study(t, marsRetro(t, at('V08')))],
  [at('V08', 0.55), at('lekin_ek_second'), t => ({ ...study(t, push(vClose(t, seq(t, [[at('V08', 0.55), vAdvise], [at('V08', 0.85), vPleased]])), t, at('V08', 0.55), 0.04)), over: card(t, at('V08', 0.6), 'BADE FAISLE: APRIL KE BAAD', [], { h: 170, y: 320, size: 52, label: '' }) })],
  // 9 MEME "Lekin ek second" -> K09 "Aries wale teen mahine rukenge?"
  [at('lekin_ek_second'), at('V10'), t => ({ ...study(t, snapIn(kC(t, seq(t, [[at('lekin_ek_second'), sDealer], [at('K09'), sLoophole], [at('K09', 0.6), sGiggle]])), t, at('lekin_ek_second'), 1.25, 1.05, 540, 880)),
    over: t < at('K09') ? memeTag(t, at('lekin_ek_second'), 'LEKIN EK SECOND!') : '' })],
  // 10 V10 "Yahi toh asli pariksha hai, jo ruk gaya wahi jeetega": the ram brakes at the STOP sign (from the approved cut)
  [at('V10'), at('V10', 0.45), t => study(t, push(vClose(t, seq(t, [[at('V10'), vKnowing], [at('V10', 0.3), vPleased]])), t, at('V10'), 0.04))],
  [at('V10', 0.45), at('K11'), t => study(t, vishnu(seq(t, [[at('V10', 0.45), vPleased], [at('V10', 0.8), vLaugh]]), 280, 1210, 0.42, t) + ramGag(t, at('V10', 0.45) - 0.2, true))],
  // 11 K11 home: Varanasi dusk; she asks for full peace at home for Aries
  [at('K11'), at('V12'), t => study(t, push(kC(t, seq(t, [[at('K11'), sJoin], [at('K11', 0.5), sDemand]])), t, at('K11'), 0.03))],
  // 12 V12 Guru in the home house till June, Ketu there too -> make family time yourself
  [at('V12'), at('V12', 0.55), t => study(t, homeGuruKetu(t, at('V12'), at('V12', 0.3)))],
  [at('V12', 0.55), at('K13'), t => ({ ...study(t, twoV(two(t, seq(t, [[at('V12', 0.55), vAdvise], [at('V12', 0.85), vWarm]]), seq(t, [[at('V12', 0.55), sNote], [at('V12', 0.85), sRelief]]), '', { mode: 'write' }), t, at('V12', 0.55))),
    over: card(t, at('V12', 0.6), 'GHAR: JUNE TAK GURU', [['family time khud nikaalo', at('V12', 0.75), '#3b4fa8', 46]], { h: 300, label: 'Chandra rashi · Vedic maanyata', labelAt: at('V12', 0.75) }) })],
  // 13 K13 maasi: the hall (no third character), bubble SHAADI KAB? -> GOOD NEWS KAB?
  [at('K13'), at('hey_bhagwan'), t => study(t, weddingPanel(t, at('K13'), at('K13', 0.62)))],
  // MEME "Hey Bhagwan, kya karun main" (palms up to the sky)
  [at('hey_bhagwan'), at('V14'), t => ({ ...study(t, snapIn(kC(t, sSky), t, at('hey_bhagwan'), 1.2, 1.02, 540, 860)), over: memeTag(t, at('hey_bhagwan'), 'HEY BHAGWAN!') })],
  // 14 V14 "Haan, sun raha hun.": gentle blessing hand; she freezes, then giggles
  [at('V14'), at('V15'), t => study(t, cam(two(t, seq(t, [[at('V14'), vListen], [at('V14', 0.5), vBless]]), seq(t, [[at('V14'), sFreeze], [at('V14', 0.7), sGiggle]])), 420, 1050, 1.15))],
  // 15 V15 Ketu leaves love/kids, Guru arrives after June: Taj, hearts
  [at('V15'), at('K16'), t => ({ ...study(t, hearts(t, at('V15', 0.4)) + two(t, seq(t, [[at('V15'), vAdvise], [at('V15', 0.55), vPleased]]), seq(t, [[at('V15'), sNote], [at('V15', 0.5), sBlush]]), '', { mode: 'idle' }), { gold: 0.6 }),
    over: card(t, at('V15', 0.35), 'PYAAR + BACHCHE ✓', [['June ke baad Guru', at('V15', 0.55), '#c62b6a', 50]], { h: 300, label: 'Chandra rashi · Vedic maanyata', labelAt: at('V15', 0.55) }) })],
  // 16 K16 "Sade Sati hi cancel kar dijiye na." (no meme from here to the tally)
  [at('K16'), at('V17'), t => study(t, push(kC(t, seq(t, [[at('K16'), sJoin], [at('K16', 0.5), { ...sPlead, armL: sJoin.armL, armR: sJoin.armR }]])), t, at('K16'), 0.03))],
  // 17 V17 "pehli dastak Jun–Oct… mehnat ka phal, darr ka nahi": calm; the door with soft knock rings
  [at('V17'), at('V17', 0.45), t => ({ ...study(t, push(vishnu(seq(t, [[at('V17'), vAdvise], [at('V17', 0.3), vWarm]]), 540, 1180, 0.78, t), t, at('V17'), 0.02), { dim: 0.25 }),
    over: card(t, at('V17', 0.1), 'SADE SATI: CANCEL ✗', [], { h: 170, y: 320, col: '#3b4fa8', size: 56 }) })],
  [at('V17', 0.45), at('V18'), t => ({ ...study(t, dastak(t, at('V17', 0.45)), { dim: 0.2 }), over: card(t, at('V17', 0.5), 'PEHLI DASTAK: JUN–OCT', [['mehnat ka phal, darr ka nahi', at('V17', 0.75), '#3b4fa8', 44]], { h: 300, col: '#3b4fa8', label: 'Vedic maanyata', labelAt: at('V17', 0.75) }) })],
  // 18 V18 "neend aur sehat… Guru saath hain": golden glow, blessing
  [at('V18'), at('K19'), t => ({ ...study(t, jupiterGlow(t, at('V18')) + push(two(t, vBless, seq(t, [[at('V18'), sRelief], [at('V18', 0.6), sJoin]])), t, at('V18'), 0.02), { gold: fade(t, at('V18'), 0.8) }) })],
  // 19 K19 tally: "ek haan, ek aadha haan, ek mein intezaar, ek pehli dastak… record!"
  [at('K19'), at('K20'), t => ({ ...study(t, push(two(t, vLaugh, seq(t, [[at('K19'), sNote], [at('K19', 0.7), sProud]]), '', { mode: 'write' }), t, at('K19'), 0.02)), over: tally2(t, at('K19', 0.05)) })],
  // 20 K20 CTA: Sakshi alone, link chip; end card
  [at('K20'), END, t => ({ ...study(t, push(kC(t, seq(t, [[at('K20'), sWin], [at('K20', 0.5), sDemand]])), t, at('K20'), 0.02)), over: linkChip2(t, at('K20', 0.05)) })],
  [END, DUR, t => ({ ...study(t, kC(t, sProud, 'idle', T(-60, 10, 1, 'ARIES ✓', '#1b8a3a', 40))), over: `<rect x="90" y="270" width="830" height="200" rx="24" fill="#1b1422" opacity="0.9"/>` + txt(505, 345, 1, 'Guide: BIO KE LINK MEIN', '#ffd24a', 50) + txt(505, 430, 1, 'Agli file: TAURUS', '#ffffff', 58) })],
];
SHOTS.forEach((s, i) => { if (SHOTS[i + 1]) s[1] = SHOTS[i + 1][0]; });
module.exports = { ...K.film(SHOTS, DUR), coverFrame };
