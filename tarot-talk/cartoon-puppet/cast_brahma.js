// Cast sheet: chibi Brahma ji (same body language as the approved Vishnu ji) at his cosmic token counter.
const B = require('./char_brahma');
const DUR = 5;
const stampUp = { armR: { S: [690, 945], E: [820, 1000], W: [790, 1120], hand: 'fist' }, stampAt: [790, 1150] };
const stampDown = { armR: { S: [690, 945], E: [800, 1080], W: [760, 1230], hand: 'fist' }, stampAt: [760, 1260] };
const POSES = [
  { name: 'busy (stamping)', lid: 0.35, browL: 0.5, browR: 0.5, mouthShape: 'sly', ...stampDown },
  { name: 'Ek-ek karke aao!', viseme: 'D', lid: 0.2, browL: 0.9, browR: 0.9, tilt: -5, fx: ['sweat'], ...stampUp },
  { name: 'Aath?', mouthShape: 'o', lid: 0.05, browL: 1, browR: 0.4, lookX: 14, tilt: 6 },
  { name: 'Next!', viseme: 'C', wink: 1, browL: 0.6, tilt: 4, ...stampDown },
  { name: 'tired sigh', lid: 0.62, lookY: 14, mouthShape: 'o', tilt: -8, blushHatch: true, fx: ['sweat'] },
];
function svg(t) {
  const p = { ...POSES[Math.round(t) % POSES.length] };
  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-160 40 C-170 -10 -110 -40 -70 -20 C-50 -80 40 -80 60 -25 C100 -55 170 -30 160 30 C200 40 190 80 150 80 L-140 80 C-190 80 -200 45 -160 40 Z" fill="#fff" opacity="0.9"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><radialGradient id="halo"><stop offset="0" stop-color="#fff4c4"/><stop offset="0.6" stop-color="#ffe07a" stop-opacity="0.6"/><stop offset="1" stop-color="#ffe07a" stop-opacity="0"/></radialGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ec5ef"/><stop offset="1" stop-color="#f6e6c4"/></linearGradient></defs>
  <rect width="1080" height="1920" fill="url(#sky)"/>${cloud(160, 260, 1.1)}${cloud(920, 1650, 1.4)}${cloud(150, 1700, 1.3)}
  ${B.tokenDisplay(8)}<g transform="translate(540 1000) scale(0.95) translate(-540 -1000)">${B.draw(p)}</g>${B.desk()}
  <text x="540" y="1860" font-family="sans-serif" font-size="46" text-anchor="middle" fill="#333">BRAHMA JI · ${p.name}</text></svg>`;
}
module.exports = { DUR, svg, POSES };
