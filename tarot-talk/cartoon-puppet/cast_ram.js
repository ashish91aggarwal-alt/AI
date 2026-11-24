// Approved-pose sheet for the Mesh ram (char_ram.js). node render.js cast_ram.js cast/ram --stills=0,1,2,3
const R = require('./char_ram');
const POSES = [
  { name: 'stand, happy', run: 0, speed: 0, look: 'happy' },
  { name: 'gallop (no brakes)', run: 0.3, speed: 1, look: 'determined' },
  { name: 'brake! (front hooves braced)', run: 0, speed: 0, brake: 1, look: 'shock' },
  { name: 'stopped, relieved', run: 0, speed: 0, brake: 0.3, look: 'happy', tilt: 3 },
];
const DUR = POSES.length;
function svg(t) { const p = POSES[Math.min(POSES.length - 1, Math.floor(t))];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#d9d4e6"/><ellipse cx="560" cy="1150" rx="300" ry="30" fill="#b9b2cc"/>${R.draw({ ...p, x: 540, y: 1000, s: 1.8 })}<text x="540" y="1400" font-family="Arial" font-size="48" text-anchor="middle" fill="#1b1422">${p.name}</text></svg>`; }
module.exports = { DUR, svg, POSES };
