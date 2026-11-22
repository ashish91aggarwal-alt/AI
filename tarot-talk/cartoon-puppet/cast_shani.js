// Cast sheet: Shani dev in his court, five expressions for his beats.
const S = require('./char_shani');
const DUR = 9;
const tri = { x: 880, y: 1600, ang: 0 };
const reg = { x: 190, y: 1150, s: 0.9, ang: -8 };
const POSES = [
  { name: 'calm (default)', eyeMood: 'calm', lid: 0.42, lookX: -40, trishul: tri, register: reg },
  { name: 'Mulank aath... haazri.', eyeMood: 'stern', lid: 0.25, stern: 1, lookX: -42, lookY: 10, talk: 0.7, trishul: { ...tri, y: 1620, glow: 1 }, register: reg, armR: { E: [800, 1030], W: [860, 940], hand: 'palm' } },
  { name: 'Baccha hai tu mera (half-nod)', eyeMood: 'warm', lid: 0.55, lookX: -38, lookY: 12, tilt: 5, mouth: 'smile', trishul: tri, register: reg, crowTilt: -18 },
  { name: 'Ye kehta hai... nahi (crow KAA)', eyeMood: 'deadpan', lid: 0.5, lookX: -42, kaa: 1, trishul: tri, register: reg, crowTilt: 10 },
  { name: 'Hisaab deta hoon (warm authority)', eyeMood: 'hisaab', lid: 0.35, lookX: -44, lookY: -12, glow: 1, talk: 0.6, trishul: tri, register: { x: 250, y: 560, s: 1.1, ang: 0, glow: 1 }, armR: { E: [800, 1010], W: [850, 900], hand: 'palm' } },
  { name: 'calm talking', eyeMood: 'calm', talk: 0.55, trishul: tri, register: reg },
  { name: 'stern (no talk)', eyeMood: 'stern', stern: 1, trishul: tri, register: reg },
  { name: 'warm talking', eyeMood: 'warm', talk: 0.5, trishul: tri, register: reg },
  { name: 'Hisaab (closed)', eyeMood: 'hisaab', lid: 0.48, lookY: 14, glow: 1, trishul: tri, register: { x: 250, y: 560, s: 1.1, ang: 0, glow: 1 } },
];
function svg(t) {
  const p = { breath: 0, standing: true, ...POSES[Math.round(t) % POSES.length] };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><radialGradient id="shaniHalo"><stop offset="0" stop-color="#ffe9a8"/><stop offset="0.55" stop-color="#e9b934" stop-opacity="0.5"/><stop offset="1" stop-color="#e9b934" stop-opacity="0"/></radialGradient>
  <linearGradient id="court" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1330"/><stop offset="1" stop-color="#1a2650"/></linearGradient></defs>
  <rect width="1080" height="1920" fill="url(#court)"/>
  ${S.saturn(0, 800, 250, 82)}
  ${S.spotlight(0, 1)}
  <rect y="1700" width="1080" height="220" fill="#10183a"/>
  <g transform="translate(540 1000) scale(0.98) translate(-540 -1000)">${S.draw(p)}</g>
  <text x="540" y="1860" font-family="sans-serif" font-size="46" text-anchor="middle" fill="#fff">SHANI DEV · ${p.name}</text></svg>`;
}
module.exports = { DUR, svg, POSES };
