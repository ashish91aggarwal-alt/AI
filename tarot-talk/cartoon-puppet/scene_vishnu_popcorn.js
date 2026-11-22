// Vishnu ji enjoying the show: a magic popcorn bucket floats beside him; kernels jump out one by one on arcs straight into his mouth.
const E = require('./engine'), V = require('./char_vishnu'), SC = require('./scene_vishnu_seated');
const DUR = 4, MOUTH = [546, 832], FLIGHT = 0.55, EVERY = 0.42;
const armL0 = { S: [392, 950], E: [318, 1075], W: [292, 1192] }, armR0 = { S: [690, 945], E: [770, 1050], W: [700, 1150], hand: 'rest' };
armR0.handAng = Math.atan2(armR0.W[1] - armR0.E[1], armR0.W[0] - armR0.E[0]) - Math.PI / 2;
function pose(t) {
  const bob = Math.sin(t * 3.2) * 8, bucket = { x: 320, y: 1000 + bob };
  const flying = []; let catchNear = 9;
  for (let k = 0; k * EVERY < DUR + 1; k++) {
    const t0 = k * EVERY, u = (t - t0) / FLIGHT;
    const arr = t0 + FLIGHT; if (Math.abs(t - arr) < catchNear) catchNear = Math.abs(t - arr);
    if (u < 0 || u > 1) continue;
    const sx = bucket.x + ((k * 37) % 50) - 25, sy = bucket.y - 120, ex = MOUTH[0], ey = MOUTH[1];
    const peak = 70 + (k % 3) * 25; // each kernel a different hop height
    const x = sx + (ex - sx) * u, y = sy + (ey - sy) * u - peak * 4 * u * (1 - u);
    const vx = (ex - sx) / FLIGHT, vy = ((ey - sy) - peak * 4 * (1 - 2 * u)) / FLIGHT;
    flying.push({ x, y, vx, vy, spin: t * 9 + k, sc: 1.7 - 0.6 * u }); // shrinks a little as it enters the mouth
  }
  const open = catchNear < 0.12; // mouth opens wide just as a kernel arrives, then chomps
  return { head: [540, 690], breath: Math.sin(t * 2), tilt: 3 + Math.sin(t * 6) * 2, lid: 0.3, lookX: -8, browL: 0.3, browR: 0.3, viseme: 'X', earSwing: 0,
    armL: armL0, armR: armR0, t, blushHatch: true, fx: ['sparkle'], eyeMode: open ? null : 'happy',
    mouthShape: open ? 'smileBig' : 'chomp',
    float: { kind: 'popcorn', x: bucket.x, y: bucket.y, s: 1.5, flying } };
}
function svg(t) {
  const p = pose(t), scene = SC.svg(0);
  const o = scene.indexOf('<g transform="translate(540 1000)'), start = scene.indexOf('>', o) + 1, end = scene.indexOf('</g>\n  <image', start);
  return scene.slice(0, start) + V.drawSeated(p) + scene.slice(end);
}
module.exports = { DUR, svg, pose };
