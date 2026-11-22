// Acting layer: makes every face alive on top of the held key poses.
// - Lip-sync from the final voice track (loudness -> mouth opening, brightness -> ee/oo shapes), per speaker.
// - Blinks on a seeded, irregular clock; eye saccades (quick darts that hold); speakers get brow pops and head nods
//   on syllable onsets; listeners react (Monty darts nervously, deities stay calm and slow).
// All of it moves through face parts and the neck joint only.
const L = require('./audio/lipsync.json');
const FPS = L.fps;
const WHO = { monty: 'Monty', vishnu: 'Vishnu ji', brahma: 'Brahma ji', shani: 'Shani dev', sakshi: 'Sakshi' };
const H = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) / 13.7;
const rnd = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const at = (arr, t) => { const i = Math.max(0, Math.min(arr.length - 1, Math.round(t * FPS))); return arr[i] || 0; };
function speaking(kind, t) { const w = WHO[kind]; return L.spk.some(([a, b, who]) => who === w && t >= a - 0.03 && t <= b + 0.05); }
function amp(t) { return at(L.amp, t); }
function onsetPulse(t, decay = 0.22) { // 1 right after a syllable onset, decaying
  for (let k = 0; k < Math.round(decay * FPS); k++) if (at(L.onset, t - k / FPS)) return Math.exp(-k / FPS / (decay * 0.45));
  return 0;
}
function blinkAt(kind, t) { // irregular blink clock per character (2.0-4.2 s apart, 0.13 s long, sometimes a double blink)
  const seed = H(kind) * 7.3; let tt = rnd(seed) * 2;
  for (let i = 0; tt < t + 1 && i < 200; i++) { if (t >= tt && t < tt + 0.13) return 1; if (rnd(seed, i) > 0.8 && t >= tt + 0.22 && t < tt + 0.33) return 1; tt += 2.0 + rnd(seed + 1, i) * 2.2; }
  return 0;
}
function saccade(kind, t, size) { // eyes hold, then dart to a new spot in ~60 ms
  const seed = H(kind) * 3.1, step = 0.55 + rnd(seed, Math.floor(t / 0.9)) * 0.9, i = Math.floor(t / step), u = Math.min(1, (t - i * step) / 0.06);
  const p = rnd(seed, i - 1) - 0.5, q = rnd(seed, i) - 0.5; return [(p + (q - p) * u) * size, ((rnd(seed + 9, i - 1) - 0.5) + ((rnd(seed + 9, i) - rnd(seed + 9, i - 1)) * u)) * size * 0.45];
}
function viseme(t) {
  const a = amp(t), z = at(L.zcr, t);
  if (a < 0.12) return 'X'; if (z > 0.3 && a < 0.7) return 'E'; if (a < 0.3) return 'B'; if (a < 0.62) return 'C'; return 'D';
}
function gestureArm(arm, t, g, side, calm) { // speaker's talking hand rises and opens on stressed syllables (elbow leads, wrist follows)
  if (!arm || !arm.E || !arm.W) return arm;
  const k = calm ? 0.6 : 1, sway = Math.sin(t * 3.1 + side) * 0.35 + 0.65;
  const dE = [side * 6 * g * k, -10 * g * k], dW = [side * 18 * g * k * sway, -34 * g * k];
  const E = [arm.E[0] + dE[0], arm.E[1] + dE[1]], W = [arm.W[0] + dW[0], arm.W[1] + dW[1]], out = { ...arm, E, W };
  if (arm.handAng !== undefined) { const a0 = Math.atan2(arm.W[1] - arm.E[1], arm.W[0] - arm.E[0]), a1 = Math.atan2(W[1] - E[1], W[0] - E[0]); out.handAng = arm.handAng + (a1 - a0); }
  return out;
}
function talkGesture(t) { // smooth 0..1: syllable accents plus a slower phrase swell
  let g = 0; for (let k = 0; k < 35; k++) if (at(L.onset, t - k / FPS)) g = Math.max(g, Math.exp(-k / FPS / 0.16) * (1 - Math.exp(-(k + 1) / FPS / 0.05)));
  return Math.min(1, g * 1.4 + amp(t) * 0.25);
}
function perform(kind, pose, t) {
  const p = { ...pose }, talk = speaking(kind, t), a = talk ? amp(t) : 0, on = talk ? onsetPulse(t) : 0, blink = blinkAt(kind, t);
  const calm = kind === 'shani' || kind === 'vishnu' || kind === 'brahma';
  const [sx, sy] = saccade(kind, t, kind === 'monty' && !talk ? 26 : calm ? 10 : 16);
  p.tilt = (p.tilt || 0) + on * (calm ? 1.5 : 3.5) + Math.sin(t * (calm ? 1.1 : 1.9) + kind.length) * (calm ? 0.8 : 1.6);
  if (talk) { const g = talkGesture(t), calm2 = kind === 'shani' || kind === 'brahma';
    if (p.armR && !(kind === 'shani' && (!p.armR || p.armR.hand === 'relax'))) p.armR = gestureArm(p.armR, t, g, 1, calm2);
    if (kind === 'monty' || kind === 'sakshi') p.armL = gestureArm(p.armL, t + 0.4, g * 0.5, -1, false); }
  if (kind === 'monty' && p.shiver) { // fear: knees knock and the body trembles through the legs, feet planted
    const s = Math.sin(t * 2 * Math.PI * 6) * (0.6 + 0.4 * Math.sin(t * 9));
    if (p.legL) p.legL = { ...p.legL, knee: [p.legL.knee[0] + 7 * s, p.legL.knee[1]] };
    if (p.legR) p.legR = { ...p.legR, knee: [p.legR.knee[0] - 7 * s, p.legR.knee[1]] };
    p.shiver = 1 + 0.8 * s; p.tilt = (p.tilt || 0) + 1.2 * s; }
  if (kind === 'monty') {
    p.lookX = (p.lookX || 0) + sx; p.lookY = (p.lookY || 0) + sy;
    p.browUp = (p.browUp || 0) + on * 0.6; p.brow = (p.brow || 0) + (talk ? Math.sin(t * 7) * 0.15 : 0);
    const e = { ...(p.eye || {}) }; if (blink && !e.mode) e.mode = 'blink'; if (talk && !blink) e.irisR = (e.irisR ?? 32) * (1 + on * 0.08); p.eye = e;
    if (talk) { const big = p.mouthShape === 'wail' || p.mouthShape === 'grinBig' || p.mouthShape === 'smileBig';
      if (big) { if (a < 0.4) { delete p.mouthShape; p.viseme = 'B'; } } else if (p.mouthShape !== 'wavy' || a > 0.3) { delete p.mouthShape; p.viseme = viseme(t); } }
  } else if (kind === 'vishnu' || kind === 'brahma') {
    p.lookX = (p.lookX || 0) + sx;
    p.browL = (p.browL || 0) + on * 0.5; p.browR = (p.browR || 0) + on * 0.5;
    if (blink && !p.eyeMode && !p.wink) p.lid = 1;
    if (talk && p.mouthShape !== 'hidden') { delete p.mouthShape; p.viseme = viseme(t); }
  } else if (kind === 'shani') {
    p.lookX = (p.lookX ?? -40) + sx * 0.6; p.lookY = (p.lookY ?? 6) + sy * 0.6;   // gaze stays off-lens: small darts around the side look
    if (blink) p.blink = 1;
    p.talk = talk ? Math.min(1, a * 0.95) : 0;
  } else if (kind === 'sakshi') {
    p.lookX = (p.lookX || 0) + sx; p.lookY = (p.lookY || 0) + sy;
    if (blink && !p.wink && !p.happy) p.blink = 1;
    p.talk = talk ? Math.min(1, a * 0.85) : 0;
    if (talk && on > 0.5 && !p.browLift) p.browLift = 1;
  }
  return p;
}
module.exports = { perform, speaking, amp, onsetPulse };
