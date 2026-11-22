// Location plates for approval: terrace (with Vishnu ji floating on his cloud + Monty), office (Brahma ji), court (Shani dev).
const L = require('./loc'), V = require('./char_vishnu'), M = require('./char_monty'), B = require('./char_brahma'), S = require('./char_shani');
const CM = require('./cast_monty'), CV = require('./cast_vishnu'), CS = require('./cast_shani'), CB = require('./cast_brahma');
const DUR = 3;
const wrap = (L0, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs>${L0.defs}</defs>${L0.back}${body}${L0.front}</svg>`;
function cloudSeat(x, y, s) { return `<g transform="translate(${x} ${y}) scale(${s})">${L.softCloud(-120, 0, 1.3, '#f7f6f1')}${L.softCloud(120, 10, 1.4, '#f7f6f1')}${L.softCloud(0, 40, 1.7, '#ffffff')}</g>`; }
function svg(t) {
  const i = Math.round(t) % 3;
  if (i === 0) { const T = L.terrace(1.2);
    const vp = { ...CV.base, ...CV.POSES[5] };
    return wrap(T, `<g transform="translate(300 1150) scale(0.62) translate(-540 -1000)">${cloudSeat(540, 1440, 1)}${V.drawSeated(vp)}</g>` +
      `<g transform="translate(790 1260) scale(0.6) translate(-540 -1100)">${M.draw(CM.POSES[0])}</g>` + L.sutliBomb(560, 1700, 0.9, 1.2, 0)); }
  if (i === 1) { const O = L.office(1.2);
    return wrap(O, `${B.tokenDisplay(8)}<g transform="translate(540 1000) scale(0.95) translate(-540 -1000)">${B.draw({ ...CB.POSES[0], t: 1.2 })}</g>${B.desk()}`); }
  const C = L.court(1.2);
  return wrap(C, `<g transform="translate(540 1000) scale(0.98) translate(-540 -1000)">${S.draw({ breath: 0, standing: true, ...CS.POSES[0] })}</g>`);
}
module.exports = { DUR, svg };
