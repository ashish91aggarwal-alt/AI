// Cast sheet: Vishnu ji always flying — seated cross-legged on his cloud (approved v12 body) with the cute expression set.
const E = require('./engine');
const V = require('./char_vishnu');
const SC = require('./scene_vishnu_seated'); // reuse its sky + cloud seat exactly
const DUR = 6;
const along = (A, k) => Math.atan2(A.W[1] - A.E[1], A.W[0] - A.E[0]) + k * Math.PI / 2;
const armL0 = { S: [392, 950], E: [318, 1075], W: [292, 1192] };                         // resting on the knee
const armLsip = { S: [392, 950], E: [318, 1040], W: [470, 880] };                        // kulhad raised to the lips
const armR0 = { S: [690, 945], E: [770, 1050], W: [700, 1150], hand: 'rest' };          // relaxed
const armRpt = { S: [690, 945], E: [820, 920], W: [890, 820], hand: 'point' };          // pointing at Monty
const armRup = { S: [690, 945], E: [830, 900], W: [850, 770], hand: 'point' };          // finger up (chakra)
const armRtalk = { S: [690, 945], E: [830, 1010], W: [905, 905], hand: 'palm' };        // talking palm
const fix = A => ({ ...A, handAng: along(A, A.hand === 'rest' ? -1 : 1) });
const chakraOn = (A, sc = 0.85) => { const q = E.rot([18 * 1.15, -196 * 1.15], along(A, 1)); return { x: A.W[0] + q[0], y: A.W[1] + q[1] - 62, spin: 1.1, scale: sc }; };
const base = { head: [540, 690], tilt: 0, breath: 0, lid: 0.42, lookX: 0, browL: 0, browR: 0, viseme: 'X', earSwing: 0, armL: armL0, armR: fix(armR0) };
const POSES = [
  { name: 'serene', mouthShape: 'sly' },
  { name: 'Ab tu gaya beta!', mouthShape: 'smileBig', wink: 1, browL: 0.8, lid: 0.25, tilt: -6, fx: ['sparkle'], blushHatch: true, armR: fix(armRpt) },
  { name: 'motor-mouth', viseme: 'D', lid: 0.15, browL: 0.7, browR: 0.9, lookX: 10, tilt: 4, armR: fix(armRtalk) },
  { name: 'Main kuch nahi bola', mouthShape: 'hidden', lid: 0.1, lookX: 18, browL: 0.6, browR: 0.6, fx: ['sweat'], tilt: 3, float: { kind: 'popcorn', x: 548, y: 880, s: 1.25 } },
  { name: 'chakra flick', mouthShape: 'cat', wink: -1, browR: 0.9, lid: 0.3, tilt: -4, fx: ['sparkle'], blushHatch: true, armR: fix(armRup), chakra: chakraOn(fix(armRup)) },
  { name: 'popcorn (enjoying the show)', eyeMode: 'happy', mouthShape: 'munch', tilt: 6, blushHatch: true, fx: ['sparkle'], float: require('./scene_vishnu_popcorn').pose(0.5).float, mouthShape: 'smileBig', eyeMode: null },
];
function svg(t) {
  const p = { ...base, ...POSES[Math.round(t) % POSES.length] };
  // take the approved scene's background + cloud seat, swap in this pose
  const scene = SC.svg(0.0);
  const open = scene.indexOf('<g transform="translate(540 1000)'), close = scene.indexOf('</g>', scene.indexOf('${', open) > 0 ? open : open) ;
  const start = scene.indexOf('>', open) + 1, end = scene.indexOf('</g>\n  <image', start);
  return scene.slice(0, start) + V.drawSeated(p) + scene.slice(end).replace('</svg>', `<text x="540" y="1860" font-family="sans-serif" font-size="50" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="2">VISHNU JI · ${p.name}</text></svg>`);
}
module.exports = { DUR, svg, POSES, base };
