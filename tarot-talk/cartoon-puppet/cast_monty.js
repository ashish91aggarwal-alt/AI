// Cast sheet stills for Monty: t=0 worried (default), t=1 shock "Aayein?!", t=2 fear "P-p-present sir", t=3 evil grin "Boss bhi?!"
const M = require('./char_monty');
const DUR = 4;
const hAng = (E2, W, pose) => M.along(E2, W) + (pose === 'rest' || pose === 'relax' ? -Math.PI / 2 : Math.PI / 2);
function armP(S, E2, W, hand) { return { S, E: E2, W, hand, handAng: hAng(E2, W, hand) }; }
const legsStand = { legL: { hip: [490, 1330], knee: [482, 1470], ankle: [472, 1600], dir: -1 }, legR: { hip: [590, 1330], knee: [598, 1470], ankle: [608, 1600], dir: 1 } };
const legsBuckle = { legL: { hip: [494, 1340], knee: [514, 1476], ankle: [472, 1600], dir: -1 }, legR: { hip: [586, 1340], knee: [566, 1476], ankle: [608, 1600], dir: 1 } };
const POSES = [
  { name: 'worried', brow: 0.9, mouthShape: 'wavy', tilt: 4, lookX: -8, lookY: 6, sweat: 0.2, eye: { irisR: 30, pupil: 14, lid: 0.1, hl: 2 }, ...legsStand,
    armL: armP([425, 925], [398, 1060], [404, 1185], 'relax'), armR: armP([655, 925], [682, 1060], [676, 1185], 'relax') },
  { name: 'shock', pop: 1, spike: 1, viseme: 'D', brow: 0.2, browUp: 1, fx: ['shockLines'], eye: { irisR: 0, pupil: 7, hl: 1, shake: 0.4 }, ...legsStand,
    armL: armP([425, 925], [330, 820], [300, 690], 'palm'), armR: armP([655, 925], [750, 820], [780, 690], 'palm') },
  { name: 'fear', brow: 1.4, mouthShape: 'wavy', chatter: true, sweat: 0.4, tilt: -4, shiver: 1, lookY: 6, fx: ['gloom'], eye: { irisR: 22, pupil: 9, hl: 2, shake: 1, watery: 0.9 }, ...legsBuckle,
    armL: armP([425, 925], [430, 1060], [505, 905], 'fist'), armR: armP([655, 925], [650, 1060], [575, 905], 'fist') },
  { name: 'evil', mouthShape: 'grinBig', brow: -1.2, lookX: 14, tilt: -7, evilShade: 1, blush: 0.6, eye: { irisR: 26, pupil: 7, iris: '#d6202e', irisHi: '#ff7a6a', lid: 0.26, lidTilt: 0.55, lower: 0.3, glint: 1, hl: 1 }, ...legsStand,
    armL: armP([425, 925], [380, 1040], [470, 1080], 'fist'), armR: armP([655, 925], [700, 1040], [610, 1080], 'fist') },
  { name: 'puppy (koi shortcut?)', brow: 1.0, browUp: 0.6, mouthShape: 'pout', tilt: 9, lookY: -8, blush: 1, fx: ['sparkle'], ...legsStand, eye: { irisR: 40, pupil: 22, hl: 3, watery: 1 },
    armL: armP([425, 925], [430, 1060], [505, 905], 'rest'), armR: armP([655, 925], [650, 1060], [575, 905], 'rest') },
  { name: 'cheer (mera 4!)', mouthShape: 'smileBig', brow: -0.2, browUp: 0.6, blush: 1, tilt: -5, fx: ['sparkle'], ...legsStand, eye: { mode: 'happy' },
    armL: armP([425, 925], [330, 840], [340, 700], 'fist'), armR: armP([655, 925], [750, 840], [740, 700], 'fist') },
  { name: 'cry (ye dukh...)', mouthShape: 'wail', brow: 1.5, tears: 1, tilt: 6, fx: ['gloom'], ...legsBuckle, eye: { mode: 'squeeze' },
    armL: armP([425, 925], [400, 1070], [420, 1195], 'relax'), armR: armP([655, 925], [680, 1070], [660, 1195], 'relax') },
  { name: 'flatter (prabhu...)', mouthShape: 'nervous', brow: 0.9, sweat: 0.6, blush: 0.8, tilt: -8, ...legsStand, eye: { mode: 'happy' },
    armL: armP([425, 925], [400, 1060], [526, 980], 'palm'), armR: armP([655, 925], [680, 1060], [554, 980], 'palm') },
];
function svg(t) {
  const p = POSES[Math.round(t) % POSES.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="#e9eef3"/><rect y="1640" width="1080" height="280" fill="#d9dfe6"/>
  <g transform="translate(540 1100) scale(1.05) translate(-540 -1100)">${M.draw(p)}</g>
  <text x="540" y="1800" font-family="sans-serif" font-size="56" text-anchor="middle" fill="#333">MONTY · ${p.name}</text></svg>`;
}
module.exports = { DUR, svg, POSES };
