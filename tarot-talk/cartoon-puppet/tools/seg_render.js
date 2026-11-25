// Re-render only part of a cut (a full render with the paper-grain plate takes ~19 min).
// Usage: VIDEO=<slug> CUT=cuts/<slug>.js T0=47 T1=56 node render.js tools/seg_render.js out/seg_a.mp4
// Pick T0/T1 on whole seconds, then splice with tools/splice.sh. Audio is untouched (same mix.wav).
const path = require('path');
const C = require(path.resolve(__dirname, '..', process.env.CUT));
const T0 = +process.env.T0, T1 = +process.env.T1;
module.exports = { DUR: T1 - T0, svg: t => C.svg(t + T0) };
