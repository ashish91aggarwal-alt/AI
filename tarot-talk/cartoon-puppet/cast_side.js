// Cast sheet: Bunty (cheeky grin, laugh) and Khanna sir (stern, nervous with sweat on "Boss bhi?!").
const S = require('./char_side');
const DUR = 4;
function svg(t) {
  const i = Math.round(t) % 4;
  const fig = [
    S.bunty({ y: 900, lookX: 6, mouth: 'grin' }),
    S.bunty({ y: 900, mouth: 'laugh', wink: 1, tilt: -6, brow: 22 }),
    S.khanna({ y: 900, frown: 1, mouth: 'flat', lid: 0.2, t }),
    S.khanna({ y: 900, frown: -0.6, browUp: 1, mouth: 'nervous', small: 1, sweat: 1, lookX: -8, t }),
  ][i];
  const name = ['BUNTY · cheeky grin', 'BUNTY · laugh + wink', 'KHANNA SIR · boss face', 'KHANNA SIR · "Boss bhi?!" sweat'][i];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><radialGradient id="halo"><stop offset="0" stop-color="#e8fbff"/><stop offset="0.6" stop-color="#9ad8ff" stop-opacity="0.5"/><stop offset="1" stop-color="#9ad8ff" stop-opacity="0"/></radialGradient></defs>
  <rect width="1080" height="1920" fill="#f3ead9"/>${fig}
  <text x="540" y="1500" font-family="sans-serif" font-size="48" text-anchor="middle" fill="#333">${name}</text></svg>`;
}
module.exports = { DUR, svg };
