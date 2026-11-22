// Cast sheet: Sakshi (host / tarot reader), five poses for her beats.
const S = require('./char_sakshi');
const DUR = 5;
const POSES = [
  { name: 'rest smile', mouth: 'smile' },
  { name: 'Notes chahiye? (cards fanned)', lid: 0.3, browLift: 1, mouth: 'smirk', tilt: -5, lookX: -10,
    armR: { E: [770, 1010], W: [820, 900], hand: 'palm' }, cards: { x: 880, y: 980, s: 0.8, glow: 1 } },
  { name: 'explaining (palm open)', talk: 0.5, lookX: 8, tilt: 3, armL: { E: [300, 1030], W: [250, 930], hand: 'palm' } },
  { name: 'Comment karo REPORT (wink)', wink: 1, browLift: -1, talk: 0.35, tilt: -6, armR: { E: [790, 1000], W: [840, 880], hand: 'point' } },
  { name: 'proud (4 = neev ka saal)', happy: 1, mouth: 'smile', tilt: 6, armL: { E: [330, 1020], W: [440, 1080], hand: 'relax' }, armR: { E: [750, 1020], W: [640, 1080], hand: 'relax' } },
];
function svg(t) {
  const p = { breath: 0, ...POSES[Math.round(t) % POSES.length] };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><radialGradient id="halo"><stop offset="0" stop-color="#f6e0ff"/><stop offset="0.6" stop-color="#c79af0" stop-opacity="0.5"/><stop offset="1" stop-color="#c79af0" stop-opacity="0"/></radialGradient></defs>
  <rect width="1080" height="1920" fill="#efe7f6"/><rect y="1680" width="1080" height="240" fill="#ddd0ea"/>
  ${S.draw(p)}
  <text x="540" y="1850" font-family="sans-serif" font-size="44" text-anchor="middle" fill="#333">SAKSHI · ${p.name}</text></svg>`;
}
module.exports = { DUR, svg, POSES };
