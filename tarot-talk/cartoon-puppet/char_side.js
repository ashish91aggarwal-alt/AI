// Side cast busts for the Mulank intro cards: Cousin Bunty and Boss Khanna sir.
// Same look as the main cast: thick ink, flat fills, one far-side shade, simple almond eyes, no anime sparkle.
const E = require('./engine');
const { WT, catmull, mirror, ink, inkLoop, fill, clipped, part } = E;

function eyes(p, o) { // o: {sep, cy, rx, ry, iris}
  let g = '';
  for (const s of [-1, 1]) {
    const cx = s * o.sep, cy = o.cy, rx = o.rx, ry = o.ry;
    if (p.wink === s || p.happy) { g += ink(catmull([[cx - rx, cy + 8], [cx, cy - ry * 0.6], [cx + rx, cy + 8]], 6, false), 10, { taper: [0.3, 0.3] }); continue; }
    const lid = (p.lid || 0) + (p.lidS && p.lidS[s] || 0), top = cy - ry + 2 * ry * lid;
    const ey = catmull([[cx - s * rx, cy + 4], [cx - s * rx * 0.4, top - 2], [cx + s * rx * 0.5, top + 2], [cx + s * rx, cy - 2], [cx + s * rx * 0.4, cy + ry * 0.85], [cx - s * rx * 0.5, cy + ry * 0.8]], 8, true);
    const px = cx + (p.lookX || 0), py = cy + 4 + (p.lookY || 0), R = o.iris * (p.small ? 0.65 : 1);
    g += fill(ey, '#fbfaf4', 0) + clipped(ey, `<ellipse cx="${px}" cy="${py}" rx="${R * 0.86}" ry="${R}" fill="#24120a"/><ellipse cx="${px}" cy="${py + R * 0.42}" rx="${R * 0.5}" ry="${R * 0.32}" fill="#6b3a1a"/><circle cx="${px + R * 0.32}" cy="${py - R * 0.38}" r="${R * 0.26}" fill="#fff"/>`);
    g += ink(catmull([[cx - s * (rx + 4), cy + 6], [cx - s * rx * 0.4, top - 3], [cx + s * rx * 0.5, top - 1], [cx + s * (rx + 4), cy - 2]], 8, false), 8, { taper: [0.3, 0.2], amp: 0.4 });
    g += ink([[cx - s * rx * 0.3, cy + ry * 0.8], [cx + s * rx * 0.5, cy + ry * 0.7]], 2.5, { taper: [0.5, 0.5] });
  }
  return g;
}
function sweat(x, y, s = 1) {
  const d = catmull([[x, y - 34 * s], [x + 16 * s, y], [x, y + 16 * s], [x - 16 * s, y]], 6, true);
  return fill(d, '#9fd8ff') + inkLoop(d, WT.mid) + `<ellipse cx="${x - 5 * s}" cy="${y}" rx="${4 * s}" ry="${7 * s}" fill="#fff"/>`;
}

// ---------- Cousin Bunty: young, red cap (brim forward, tilted), green tee, cheeky grin, a phone floating by his cheek
const B = { skin: '#e6ac80', sh: '#c98d62', line: '#8e5636', hair: '#1d1416', cap: '#d8333a', capSh: '#a6232b', tee: '#3fae5a', teeSh: '#2d8644', mouth: '#5a1626', tongue: '#e06a80', teeth: '#fffaf0' };
function bunty(p) {
  const g = [];
  // shoulders + green tee (crew neck), a little slouch
  const tee = catmull([[-90, 190], [-210, 236], [-260, 330], [-266, 420], [266, 420], [260, 330], [214, 240], [90, 190]], 8, true);
  g.push(fill(tee, B.tee) + clipped(tee, fill(catmull([[80, 190], [280, 250], [290, 430], [100, 430]], 6, true), B.teeSh) + ink(catmull([[-140, 300], [-120, 380]], 4, false), 4, { color: B.teeSh })) + inkLoop(tee, WT.sil));
  const neck = catmull([[-56, 120], [56, 120], [60, 210], [-60, 210]], 4, true); g.push(fill(neck, B.sh) + inkLoop(neck, WT.mid));
  g.push(ink(catmull([[-80, 196], [0, 236], [80, 196]], 6, false), 12, { color: B.teeSh, taper: [0.05, 0.05] }));
  // ears, face
  for (const s of [-1, 1]) g.push(part(catmull([[s * 164, -10], [s * 200, -6], [s * 204, 50], [s * 170, 74]], 6, true), B.skin, { sh: B.sh, shPts: [[s * 160, 40], [s * 214, 40], [s * 214, 90], [s * 160, 90]], w: WT.mid }));
  const face = catmull([[-4, -170], [110, -160], [172, -80], [180, 20], [160, 100], [96, 168], [10, 190], [-80, 172], [-150, 104], [-176, 14], [-168, -84], [-104, -156]], 10, true);
  g.push(fill(face, B.skin) + clipped(face, fill(catmull([[100, -200], [156, -40], [150, 90], [60, 220], [260, 230], [260, -200]], 8, true), B.sh) + [-1, 1].map(k => `<ellipse cx="${k * 110}" cy="70" rx="30" ry="14" fill="#e8708a" opacity="0.32"/>`).join('')) + inkLoop(face, WT.sil));
  // hair tufts poking out under the cap
  for (const s of [-1, 1]) { const t = catmull([[s * 150, -110], [s * 186, -80], [s * 176, -20], [s * 160, -50], [s * 150, 0], [s * 136, -70]], 6, true); g.push(fill(t, B.hair) + inkLoop(t, WT.mid)); }
  // red cap, tilted, brim forward to his right
  const tilt = p.capTilt ?? -8;
  const crown = catmull([[-180, -80], [-170, -190], [-80, -258], [60, -262], [160, -200], [186, -90]], 8, true);
  const brim = catmull([[-40, -96], [120, -110], [270, -84], [280, -60], [140, -64], [-20, -70]], 6, true);
  g.push(`<g transform="rotate(${tilt} 0 -120)">` + fill(crown, B.cap) + clipped(crown, fill(catmull([[60, -280], [200, -200], [200, -60], [80, -60]], 6, true), B.capSh) +
    ink(catmull([[0, -262], [10, -170], [0, -90]], 5, false), 4, { color: B.capSh }) + `<circle cx="10" cy="-262" r="10" fill="${B.capSh}"/>`) + inkLoop(crown, WT.sil) +
    `<circle cx="-70" cy="-170" r="34" fill="#fff" stroke="${E.INK}" stroke-width="4"/><text x="-70" y="-156" font-family="Arial Black,Arial" font-weight="900" font-size="40" text-anchor="middle" fill="${B.cap}">8</text>` +
    part(brim, B.cap, { sh: B.capSh, shPts: brim.map(([x, y]) => [x, y + 10]), w: WT.sil * 0.85 }) + '</g>');
  // brows: one cocked up (cheeky)
  for (const s of [-1, 1]) { const up = s === 1 ? (p.brow ?? 14) : 0, cx = s * 70;
    g.push(ink(catmull([[cx - s * 34, -66 - up * 0.3], [cx, -80 - up], [cx + s * 34, -70 - up * 0.6]], 6, false), 9, { taper: [0.3, 0.3] })); }
  g.push(eyes(p, { sep: 70, cy: -16, rx: 38, ry: 30, iris: 24 }));
  g.push(ink(catmull([[0, 20], [-12, 58], [6, 62]], 5, false), 5, { color: B.line, taper: [0.2, 0.3] }));
  // cheeky lopsided grin, teeth showing on one side
  const my = 106;
  if (p.mouth === 'laugh') { const m = catmull([[-56, my - 6], [0, my + 2], [60, my - 14], [34, my + 50], [-30, my + 46]], 6, true);
    g.push(fill(m, B.mouth) + clipped(m, `<rect x="-60" y="${my - 20}" width="124" height="22" fill="${B.teeth}"/><ellipse cx="0" cy="${my + 46}" rx="30" ry="14" fill="${B.tongue}"/>`) + inkLoop(m, WT.mid)); }
  else { const m = catmull([[-46, my], [0, my + 6], [56, my - 18], [36, my + 22], [-20, my + 22]], 6, true);
    g.push(fill(m, B.mouth) + clipped(m, `<rect x="-50" y="${my - 24}" width="110" height="${p.mouth === 'smirk' ? 0 : 18}" fill="${B.teeth}"/>`) + inkLoop(m, WT.mid) + ink([[54, my - 16], [64, my - 8]], 4, { taper: [0.2, 0.2] })); }
  // floating phone (magic, no grip) with a glowing screen
  if (p.phone !== false) { const fx = 250, fy = 120 + (p.bob || 0);
    g.push(`<circle cx="${fx}" cy="${fy}" r="90" fill="url(#halo)" opacity="0.6"/>`);
    const ph = [[fx - 44, fy - 80], [fx + 44, fy - 80], [fx + 44, fy + 80], [fx - 44, fy + 80]];
    g.push(`<g transform="rotate(12 ${fx} ${fy})"><rect x="${fx - 46}" y="${fy - 82}" width="92" height="164" rx="16" fill="#2a2a34" stroke="${E.INK}" stroke-width="${WT.mid}"/><rect x="${fx - 36}" y="${fy - 68}" width="72" height="134" rx="8" fill="#8fd6ff"/><circle cx="${fx}" cy="${fy + 74}" r="4" fill="#555"/>` +
      `<rect x="${fx - 28}" y="${fy - 52}" width="44" height="18" rx="8" fill="#fff"/><rect x="${fx - 14}" y="${fy - 24}" width="44" height="18" rx="8" fill="#5ee08a"/><rect x="${fx - 28}" y="${fy + 4}" width="36" height="18" rx="8" fill="#fff"/><text x="${fx + 6}" y="${fy + 58}" font-family="Arial Black,Arial" font-size="30" font-weight="900" text-anchor="middle" fill="#ff4d6d">♥ 8</text></g>`); }
  if (p.sweat) g.push(sweat(150, -150));
  return `<g transform="translate(${p.x ?? 540} ${p.y ?? 900}) rotate(${p.tilt || 0}) scale(${p.s ?? 1})">${g.join('')}</g>`;
}

// ---------- Boss Khanna sir: older, bald top with grey side puffs, thick specs, grey moustache, dark suit, red tie, BOSS mug
const K = { skin: '#dfa274', sh: '#c08158', line: '#87502f', grey: '#c9c6c2', greySh: '#9d9893', suit: '#2c3550', suitSh: '#1e2539', shirt: '#f4f2ee', tie: '#c62b34', tieSh: '#94202a', mug: '#fbfbf7' };
function khanna(p) {
  const g = [];
  // suit shoulders, white shirt V, red tie
  const suit = catmull([[-110, 180], [-250, 230], [-300, 330], [-306, 430], [306, 430], [300, 330], [250, 230], [110, 180]], 8, true);
  g.push(fill(suit, K.suit) + clipped(suit, fill(catmull([[90, 180], [320, 250], [320, 440], [120, 440]], 6, true), K.suitSh)) + inkLoop(suit, WT.sil));
  const shirt = catmull([[-90, 180], [90, 180], [40, 430], [-40, 430]], 4, true); g.push(fill(shirt, K.shirt) + inkLoop(shirt, WT.mid));
  for (const s of [-1, 1]) { const lap = catmull([[s * 92, 180], [s * 130, 220], [s * 70, 300], [s * 40, 430], [s * 30, 300]], 5, true); g.push(part(lap, K.suit, { sh: K.suitSh, shPts: lap.map(([x, y]) => [x + s * 8, y + 8]), w: WT.mid })); }
  const tie = catmull([[-20, 200], [20, 200], [30, 240], [16, 400], [0, 430], [-16, 400], [-30, 240]], 5, true); g.push(part(tie, K.tie, { sh: K.tieSh, shPts: [[0, 190], [40, 190], [40, 440], [0, 440]], w: WT.mid }));
  const knot = catmull([[-26, 186], [26, 186], [20, 220], [-20, 220]], 4, true); g.push(part(knot, K.tie, { sh: K.tieSh, shPts: [[0, 180], [30, 180], [30, 230], [0, 230]], w: WT.mid }));
  for (const s of [-1, 1]) g.push(ink(catmull([[s * 86, 178], [s * 40, 206], [s * 26, 196]], 4, false), 5, { taper: [0.1, 0.1] })); // collar points
  // ears, broad face with jowls
  for (const s of [-1, 1]) g.push(part(catmull([[s * 178, -6], [s * 220, 0], [s * 222, 60], [s * 184, 84]], 6, true), K.skin, { sh: K.sh, shPts: [[s * 176, 40], [s * 232, 40], [s * 232, 100], [s * 176, 100]], w: WT.mid }));
  const face = catmull([[0, -196], [120, -186], [186, -100], [198, 20], [196, 110], [150, 176], [60, 200], [-60, 200], [-150, 176], [-196, 110], [-198, 20], [-186, -100], [-120, -186]], 10, true);
  g.push(fill(face, K.skin) + clipped(face, fill(catmull([[110, -220], [170, -40], [164, 120], [80, 240], [280, 250], [280, -220]], 8, true), K.sh) +
    `<ellipse cx="-60" cy="-150" rx="46" ry="20" fill="#fff" opacity="0.55" transform="rotate(-16 -60 -150)"/>` + [-1, 1].map(k => `<ellipse cx="${k * 130}" cy="74" rx="32" ry="14" fill="#e8708a" opacity="0.28"/>`).join('')) + inkLoop(face, WT.sil));
  g.push(ink(catmull([[-90, 176], [0, 192], [90, 176]], 6, false), 4, { color: K.line, taper: [0.3, 0.3] })); // double chin
  // grey side puffs (bald on top)
  for (const s of [-1, 1]) { const puff = catmull([[s * 150, -150], [s * 206, -120], [s * 220, -50], [s * 200, 0], [s * 176, -24], [s * 170, -80], [s * 150, -110]], 6, true); g.push(part(puff, K.grey, { sh: K.greySh, shPts: puff.map(([x, y]) => [x + s * 10, y + 10]), w: WT.mid })); }
  // bushy grey brows, frowny by default
  const fr = p.frown ?? 1;
  for (const s of [-1, 1]) { const cx = s * 76; g.push(part(catmull([[cx - s * 46, -64 + fr * 4], [cx - s * 6, -86 - fr * 6 + (p.browUp || 0) * -16], [cx + s * 46, -78 + fr * -6 + (p.browUp || 0) * -10], [cx + s * 40, -62], [cx - s * 40, -52 + fr * 4]], 6, true), K.grey, { sh: K.greySh, shPts: [[cx - 60, -60], [cx + 60, -60], [cx + 60, -40], [cx - 60, -40]], w: WT.mid })); }
  g.push(eyes(p, { sep: 76, cy: -12, rx: 32, ry: 26, iris: 18 }));
  // thick rectangular specs
  for (const s of [-1, 1]) g.push(`<rect x="${s * 76 - 58}" y="-52" width="116" height="80" rx="20" fill="#bfe4ff" fill-opacity="0.18" stroke="${E.INK}" stroke-width="10"/>`);
  g.push(ink([[-18, -20], [18, -20]], 8) + ink([[-134, -24], [-184, -14]], 8) + ink([[134, -24], [184, -14]], 8));
  // nose (bigger), moustache, mouth
  g.push(ink(catmull([[-6, 24], [-24, 76], [-4, 86], [16, 80]], 5, false), 6, { color: K.line, taper: [0.2, 0.3] }));
  const ms = catmull([[0, 96], [60, 92], [116, 120], [86, 132], [40, 120], [0, 124], [-40, 120], [-86, 132], [-116, 120], [-60, 92]], 6, true);
  g.push(part(ms, K.grey, { sh: K.greySh, shPts: [[-120, 118], [120, 118], [120, 140], [-120, 140]], w: WT.mid }));
  if (p.mouth === 'nervous') g.push(ink(catmull([[-40, 154], [-20, 146], [0, 156], [20, 146], [40, 154]], 4, false), 6, { taper: [0.2, 0.2] }));
  else g.push(ink(catmull([[-34, 156], [0, 150], [34, 156]], 4, false), 6, { taper: [0.3, 0.3] }));
  // floating BOSS mug with steam
  if (p.mug !== false) { const mx = -270, my = 250 + (p.bob || 0);
    const mug = catmull([[mx - 56, my - 60], [mx + 56, my - 60], [mx + 50, my + 60], [mx - 50, my + 60]], 4, true);
    g.push(`<path d="M${mx + 52} ${my - 30} C${mx + 100} ${my - 30} ${mx + 100} ${my + 30} ${mx + 48} ${my + 30}" fill="none" stroke="${E.INK}" stroke-width="22" stroke-linecap="round"/><path d="M${mx + 52} ${my - 30} C${mx + 100} ${my - 30} ${mx + 100} ${my + 30} ${mx + 48} ${my + 30}" fill="none" stroke="${K.mug}" stroke-width="10" stroke-linecap="round"/>`);
    g.push(part(mug, K.mug, { sh: '#dcdcd4', shPts: [[mx + 10, my - 70], [mx + 70, my - 70], [mx + 70, my + 70], [mx + 10, my + 70]], w: WT.sil * 0.8 }));
    g.push(`<text x="${mx}" y="${my + 14}" font-family="Arial Black,Arial" font-weight="900" font-size="38" text-anchor="middle" fill="${K.tie}">BOSS</text>`);
    for (const k of [-1, 1]) { const ph = (p.t || 0) * 2 + k; g.push(ink(catmull([[mx + k * 18, my - 70], [mx + k * 18 + Math.sin(ph) * 12, my - 110], [mx + k * 18 - Math.sin(ph) * 10, my - 150]], 6, false), 6, { color: '#ffffff', taper: [0.3, 0.8] })); } }
  if (p.sweat) g.push(sweat(176, -150, 1.3));
  return `<g transform="translate(${p.x ?? 540} ${p.y ?? 900}) rotate(${p.tilt || 0}) scale(${p.s ?? 1})">${g.join('')}</g>`;
}
module.exports = { bunty, khanna, sweat };
