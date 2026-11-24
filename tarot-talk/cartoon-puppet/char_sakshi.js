// Sakshi: host / tarot reader, the only one who sells. Late-20s Indian woman, warm brown skin, long dark braid over the
// shoulder, red bindi, gold jhumkas, confident half-lidded eyes with one lifting brow. Plum A-line kurta with gold stars
// and trim, gold dupatta across the chest, cream churidar, gold juttis, bangles. Tarot cards float in a fan by her hand.
const E = require('./engine');
const { WT, catmull, mirror, ink, inkLoop, fill, clipped, part, arm, rot, clamp } = E;
const C = {
  skin: '#e8b48a', skinSh: '#cc916a', skinLine: '#94583a', blush: '#e8708a', lip: '#b8344e', lipSh: '#8a2238',
  hair: '#1d1216', hairHi: '#4a3240', white: '#fbfaf4', iris: '#3a2010', mouth: '#5a1626', tongue: '#e06a80', teeth: '#fffaf0',
  kurta: '#5e2a6e', kurtaSh: '#431c50', gold: '#efbd3a', goldSh: '#c08a1a', cream: '#f4e9d0', creamSh: '#d9c8a2',
  card: '#4b2a7a', choli: '#c2306a', choliSh: '#962250', skirt: '#6a3aa8', skirtSh: '#4e2a82', denim: '#5f8fd0', denimSh: '#44709f', denimLt: '#86aee0', stitch: '#f0c060', skirtHi: '#5d3088', pink: '#ff7aa8', dup: '#f6a77c', dupSh: '#e07f58', cardEdge: '#efbd3a',
};
function star(x, y, r, col) { const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + Math.PI * k / 5, rr = k % 2 ? r * 0.45 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return `<path d="${E.poly(pts)}" fill="${col}"/>`; }

function head(p) {
  // Style matched to the #MythologyWithHumor reference: flat colour, organic slightly uneven shapes, simple almond eyes,
  // small hooked nose, small mouth, no anime sparkle, no hatching.
  const g = [];
  const face = catmull([[-6, -200], [120, -184], [192, -96], [204, 20], [180, 118], [118, 190], [30, 222], [-40, 214], [-118, 180], [-180, 110], [-200, 10], [-186, -100], [-118, -180]], 10, true);
  const sw = p.braidSwing || 0;
  // high ponytail with a pink scrunchie, swinging out behind the head (p.braidSwing sways it)
  { const sw2 = sw * 30;
    const pt = catmull([[120, -250], [230, -300], [320, -250], [350 + sw2 * 0.4, -120], [330 + sw2, 20], [300 + sw2, 120], [270 + sw2, 60], [280 + sw2 * 0.6, -60], [250, -170], [170, -200]], 8, true);
    g.push(fill(pt, C.hair) + inkLoop(pt, WT.sil));
    g.push(ink(catmull([[240, -270], [310, -220], [320 + sw2 * 0.5, -100]], 5, false), 7, { color: C.hairHi, taper: [0.3, 0.6], amp: 0.3 }));
    g.push(ink(catmull([[290 + sw2 * 0.6, -40], [300 + sw2 * 0.9, 40]], 4, false), 4, { color: C.hairHi, taper: [0.3, 0.6] }));
  }
  const hb = catmull([[-10, -250], [150, -236], [226, -130], [222, -10], [206, 40], [-200, 40], [-222, -20], [-226, -120], [-160, -224]], 8, true);
  g.push(fill(hb, C.hair) + inkLoop(hb, WT.sil));
  for (const s of [-1, 1]) g.push(part(catmull([[s * 190, 0], [s * 226, 6], [s * 230, 58], [s * 196, 84]], 6, true), C.skin, { sh: C.skinSh, shPts: [[s * 190, 50], [s * 240, 50], [s * 240, 100], [s * 190, 100]], w: WT.mid }));
  g.push(fill(face, C.skin) + clipped(face, fill(catmull([[110, -240], [176, -60], [170, 100], [80, 240], [300, 260], [300, -240]], 8, true), C.skinSh) +
    [-1, 1].map(k => `<ellipse cx="${k * 118}" cy="96" rx="34" ry="16" fill="${C.blush}" opacity="${(0.32 + 0.4 * (p.blush || 0)).toFixed(2)}"/>`).join('')));
  g.push(ink(face.slice(Math.floor(face.length * 0.04), Math.floor(face.length * 0.66)), WT.sil, { taper: [0.3, 0.2] }));
  const big = catmull([[-40, -244], [80, -246], [180, -190], [216, -70], [204, 30], [182, -40], [150, -120], [80, -160], [-20, -150], [-60, -196]], 7, true);
  const small = catmull([[-60, -240], [-150, -220], [-212, -130], [-214, -10], [-190, -60], [-150, -140], [-84, -176]], 7, true);
  g.push(fill(small, C.hair) + inkLoop(small, WT.mid) + fill(big, C.hair) + inkLoop(big, WT.mid));
  g.push(ink(catmull([[-10, -212], [70, -222], [150, -180]], 5, false), 8, { color: C.hairHi, taper: [0.4, 0.4], amp: 0.3 }));
  for (const [x, y, r] of [[176, -246, 30], [206, -216, 26], [150, -222, 22]]) g.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${C.pink}" stroke="${E.INK}" stroke-width="5"/>`);
  g.push(ink(catmull([[156, -256], [190, -270]], 3, false), 4, { color: '#ffc0d6', taper: [0.3, 0.3] }));
  g.push(ink(catmull([[-70, -180], [-96, -130], [-90, -84]], 5, false), 4.5, { taper: [0.2, 0.7] }));
  g.push(`<circle cx="-8" cy="-74" r="8" fill="#d22f48" stroke="${E.INK}" stroke-width="2.5"/>`);
  const lid = p.lid ?? 0, low = p.lidLow ?? 0, look = p.lookX ?? 0, ly = p.lookY ?? 0;   // lidLow: lower lid rises (smile squint, suspicion)
  for (const s of [-1, 1]) {
    const cx = s * 82 - 6, cy = 20, rx = 44, ry = 36;
    if (p.blink) { g.push(ink(catmull([[cx - 42, cy + 2], [cx, cy + 12], [cx + 42, cy + 2]], 6, false), 9, { taper: [0.3, 0.3] }) + ink([[cx + s * 40, cy + 2], [cx + s * 54, cy - 6]], 5, { taper: [0.1, 0.8] })); }
    else if (p.wink === s || p.happy) { g.push(ink(catmull([[cx - 40, cy + 8], [cx, cy - 18], [cx + 40, cy + 8]], 6, false), 10, { taper: [0.3, 0.3] }) + ink([[cx + s * 38, cy + 4], [cx + s * 54, cy - 8]], 6, { taper: [0.1, 0.8] })); }
    else {
      const top = cy - ry + 2 * ry * lid;
      const ey = catmull([[cx - s * rx, cy + 4], [cx - s * rx * 0.4, top - (1 - lid) * 4], [cx + s * rx * 0.5, top + 2], [cx + s * rx, cy - 2], [cx + s * rx * 0.4, cy + ry * (0.85 - 0.55 * low)], [cx - s * rx * 0.5, cy + ry * (0.75 - 0.5 * low)]], 8, true);
      const px = cx + look, py = cy + 6 + ly;
      g.push(fill(ey, C.white, 0) + clipped(ey, `<ellipse cx="${px}" cy="${py}" rx="24" ry="28" fill="#2a1408"/><ellipse cx="${px}" cy="${py + 12}" rx="15" ry="10" fill="#6b3a1a"/><circle cx="${px + 9}" cy="${py - 11}" r="7" fill="#fff"/>`));
      const tl = catmull([[cx - s * (rx + 4), cy + 6], [cx - s * rx * 0.4, top - 2], [cx + s * rx * 0.5, top], [cx + s * (rx + 4), cy - 4], [cx + s * (rx + 18), cy - 14]], 8, false);
      g.push(ink(s > 0 ? tl : tl.slice().reverse(), 9, { prof: u => 0.35 + 0.65 * Math.sin(Math.PI * u * 0.9), taper: [0.25, 0.05], amp: 0.4 }));
      g.push(ink([[cx - s * rx * 0.3, cy + ry * (0.8 - 0.55 * low)], [cx + s * rx * 0.5, cy + ry * (0.68 - 0.5 * low)]], 2.5 + 3 * low, { taper: [0.5, 0.5] }));
    }
    // expression extras (optional, default = approved look): browUp lifts both brows, browSad raises the inner ends
    const lift = (p.browLift === s ? (p.browLiftAmt || 1) : 0) + (p.browUp || 0), sad = p.browSad || 0, by = cy - ry - 30 - lift * 16;
    g.push(ink(catmull([[cx - s * 34, by + 8 - sad * 16], [cx - s * 4, by - 4 - lift * 8 - sad * 6], [cx + s * 34, by + 2 + sad * 8]], 6, false), 6.5, { taper: [0.5, 0.3], amp: 0.4 }));
  }
  g.push(ink(catmull([[-4, 52], [-16, 86], [2, 92]], 5, false), 4.5, { color: C.skinLine, taper: [0.2, 0.3] }));
  const my = 140, M = p.mouth || 'smile', talk = p.talk || 0;
  if (talk > 0.08) { const h = 8 + talk * 28, m = catmull([[-20, my], [0, my - 2], [22, my - 1], [12, my + h], [-2, my + h + 4], [-14, my + h]], 6, true);
    g.push(fill(m, C.mouth) + clipped(m, `<ellipse cx="0" cy="${my + h + 2}" rx="12" ry="7" fill="${C.tongue}"/>`) + inkLoop(m, WT.mid)); }
  else if (M === 'o') { const m = catmull([[-12, my - 2], [0, my - 8], [12, my - 2], [10, my + 14], [0, my + 18], [-10, my + 14]], 6, true); g.push(fill(m, C.mouth) + inkLoop(m, WT.mid)); }
  else if (M === 'grin') { const m = catmull([[-34, my - 6], [0, my - 2], [34, my - 6], [20, my + 22], [0, my + 28], [-20, my + 22]], 6, true);
    g.push(fill(m, C.mouth) + clipped(m, `<rect x="-40" y="${my - 10}" width="80" height="12" fill="${C.teeth}"/><ellipse cx="0" cy="${my + 26}" rx="16" ry="8" fill="${C.tongue}"/>`) + inkLoop(m, WT.mid)); }
  else if (M === 'pout') g.push(ink(catmull([[-16, my + 6], [0, my - 2], [16, my + 6]], 5, false), 5.5, { taper: [0.4, 0.4] }));
  else if (M === 'smirk') g.push(ink(catmull([[-14, my + 4], [6, my + 4], [22, my - 6]], 5, false), 5.5, { taper: [0.4, 0.2] }));
  else g.push(ink(catmull([[-22, my - 2], [-4, my + 10], [20, my - 2]], 5, false), 5.5, { taper: [0.4, 0.4] }));
  for (const s of [-1, 1]) { const jx = s * 212 + (p.jhumka || 0) * s, jy = 104;
    g.push(ink([[s * 210, 78], [jx, jy - 12]], 3, { color: C.gold }));
    const dome = catmull([[jx - 16, jy + 12], [jx - 13, jy - 4], [jx, jy - 12], [jx + 13, jy - 4], [jx + 16, jy + 12]], 6, true);
    g.push(part(dome, C.gold, { sh: C.goldSh, shPts: [[jx, jy - 20], [jx + 30, jy - 20], [jx + 30, jy + 24], [jx, jy + 24]], w: WT.mid }));
    for (let k = -1; k <= 1; k++) g.push(`<circle cx="${jx + k * 9}" cy="${jy + 20}" r="4" fill="${C.gold}" stroke="${E.INK}" stroke-width="2"/>`); }
  return `<g transform="translate(${p.head[0].toFixed(1)} ${p.head[1].toFixed(1)}) rotate(${(p.tilt || 0).toFixed(2)}) scale(1.2)">${g.join('')}</g>`;
}
function body(p) {
  if (p.lawyer) return lawyerBody(p);
  // Modern look: purple skater dress with a tiny star print, cropped denim jacket with rolled sleeves and a moon pin,
  // white ankle socks and chunky white sneakers with pink laces.
  const b = p.breath || 0, T = ([x, y]) => [540 + (x - 540) * (1 + b * 0.01), y - b * 3 * (1500 - y) / 600];
  const sw = p.skirtSwing || 0;
  let o = '';
  // legs, socks, sneakers
  for (const [hx, ax, dir] of [[500, 490, -1], [580, 590, 1]]) {
    o += E.limb([[hx, 1380], [ax, 1520], [ax, 1620]], 31, { col: C.skin, sh: C.skinSh });
    const sock = catmull([[ax - 27, 1580], [ax + 27, 1580], [ax + 28, 1632], [ax - 28, 1632]], 4, true);
    o += part(sock, '#ffffff', { sh: '#dcdce6', shPts: sock.map(([x, y]) => [x + 10, y]), w: WT.mid });
    o += ink([[ax - 26, 1592], [ax + 26, 1592]], 4, { color: C.pink });
    const sh = catmull([[ax - 36 * dir, 1676], [ax - 38 * dir, 1640], [ax - 8 * dir, 1622], [ax + 34 * dir, 1630], [ax + 72 * dir, 1648], [ax + 78 * dir, 1676]], 6, true);
    o += part(sh, '#fbfbff', { sh: '#d8d8e8', shPts: sh.map(([x, y]) => [x, y + 12]), w: WT.sil * 0.8 });
    o += ink([[ax - 38 * dir, 1674], [ax + 80 * dir, 1674]], 9, { color: '#c9c9d8', taper: [0.05, 0.05] }); // chunky sole
    for (let k = 0; k < 3; k++) o += ink([[ax - 4 + k * 12 * dir, 1630 + k * 4], [ax + 10 + k * 12 * dir, 1642 + k * 4]], 4, { color: C.pink, taper: [0.1, 0.1] });
  }
  // skater dress: fitted top, flared short skirt with a soft wavy hem and a star print
  const hem = []; for (let k = 0; k <= 10; k++) hem.push([300 + k * 48 + sw * 10, 1420 + (k % 2 ? 12 : -2)]);
  const dr = catmull([[470, 884], [410, 905], [390, 980], [400, 1080], [380, 1140], [300, 1410]].concat(hem.slice(1, -1)).concat([[780, 1410], [700, 1140], [680, 1080], [690, 980], [670, 905], [610, 884]]).map(T), 6, true);
  let deco = fill(catmull([[600, 900], [720, 920], [800, 1440], [620, 1440]].map(T), 6, true), C.skirtSh);
  for (const [x0, x1] of [[470, 380], [520, 500], [570, 620], [610, 720]]) deco += ink(catmull([[x0, 1160], [(x0 + x1) / 2, 1290], [x1, 1410]].map(T), 4, false), 4, { color: C.skirtSh, taper: [0.6, 0.1] });
  for (let i = 0; i < 26; i++) { const r1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, r2 = Math.abs(Math.sin(i * 78.233) * 12543.17) % 1; const x = 340 + r1 * 400, y = 950 + r2 * 450; const [bx, by] = T([x, y]);
    deco += i % 3 ? `<circle cx="${bx}" cy="${by}" r="4" fill="#fff4c8"/>` : star(bx, by, 10, '#fff4c8'); }
  deco += ink(catmull([[386, 1140], [540, 1156], [694, 1140]].map(T), 5, false), 10, { color: C.skirtSh, taper: [0.02, 0.02] }); // waist seam
  o += fill(dr, C.skirt) + clipped(dr, deco) + inkLoop(dr, WT.sil);
  o += ink(catmull([[480, 888], [540, 924], [600, 888]].map(T), 6, false), 6, { color: C.skirtSh, taper: [0.1, 0.1] });
  // cropped denim jacket, open at the front: two panels with a collar, pocket flaps and contrast stitching
  for (const s of [-1, 1]) {
    const X = x => 540 + s * x;
    const pn = catmull([[X(70), 884], [X(130), 896], [X(158), 960], [X(152), 1080], [X(150), 1110], [X(70), 1116], [X(60), 1000], [X(44), 926]].map(T), 7, true);
    o += part(pn, C.denim, { sh: C.denimSh, shPts: (s > 0 ? [[560, 880], [720, 880], [720, 1130], [560, 1130]] : [[380, 1060], [470, 1060], [470, 1130], [380, 1130]]).map(T), w: WT.sil * 0.85 });
    o += ink(catmull([[X(68), 1092], [X(150), 1092]].map(T), 3, false), 9, { color: C.denimSh, taper: [0.02, 0.02] }); // waistband
    o += ink(catmull([[X(62), 1000], [X(70), 1090]].map(T), 3, false), 2.5, { color: C.stitch, taper: [0.1, 0.1] });
    const fl = catmull([[X(88), 970], [X(140), 966], [X(138), 994], [X(112), 1004], [X(90), 994]].map(T), 5, true);
    o += part(fl, C.denim, { sh: C.denimSh, shPts: fl.map(([x, y]) => [x, y + 8]), w: WT.mid }) + `<circle cx="${T([X(114), 990])[0]}" cy="${T([X(114), 990])[1]}" r="4" fill="${C.gold}" stroke="${E.INK}" stroke-width="1.5"/>`;
    const col = catmull([[X(30), 884], [X(96), 880], [X(92), 930], [X(56), 960]].map(T), 5, true);
    o += part(col, C.denimLt, { sh: C.denim, shPts: col.map(([x, y]) => [x + s * 10, y + 10]), w: WT.mid });
  }
  // moon pin on the jacket
  { const [bx, by] = T([600, 940]); o += `<circle cx="${bx}" cy="${by}" r="15" fill="${C.pink}" stroke="${E.INK}" stroke-width="3"/><path d="M${bx - 3} ${by - 9} A10 10 0 1 0 ${bx - 3} ${by + 9} A7 7 0 1 1 ${bx - 3} ${by - 9}Z" fill="#fff4c8"/>`; }
  return o;
}

// Full advocate's costume (owner, 24 Nov 2026: "complete Vakil costume"). Researched from the Bar Council of India rules for
// women advocates: black open-breasted coat, white shirt/blouse with a white collar, white bands, advocate's gown, and a long
// black skirt (no print); formal black shoes instead of sneakers.
function lawyerBody(p) {
  const b = p.breath || 0, T = ([x, y]) => [540 + (x - 540) * (1 + b * 0.01), y - b * 3 * (1500 - y) / 600], sw = p.skirtSwing || 0;
  const BLK = '#1b1822', BLKsh = '#0f0d14', GOWN = '#4a4360', GOWNsh = '#363049', WH = '#fbfaf4', WHsh = '#dcd9cc';
  let o = '';
  // advocate's gown behind everything: falls from the shoulders, gathered yoke, open front, wide hem
  const gown = catmull([[440, 880], [360, 930], [300, 1180], [262, 1560], [400, 1585], [470, 1300], [610, 1300], [680, 1585], [818, 1560], [780, 1180], [720, 930], [640, 880]].map(T), 6, true);
  o += `<path d="${E.poly(gown)}" fill="none" stroke="#b9b0e0" stroke-width="26" stroke-linejoin="round" opacity="0.55"/>`;   // soft light rim so she reads on night scenes (art review)
  o += part(gown, GOWN, { sh: GOWNsh, shPts: [[560, 900], [820, 900], [820, 1600], [560, 1600]].map(T), w: WT.sil });
  for (const x of [330, 370, 710, 750]) o += ink(catmull([[x + (x < 540 ? 30 : -30), 960], [x, 1250], [x - (x < 540 ? 20 : -20), 1550]].map(T), 4, false), 4, { color: GOWNsh, taper: [0.3, 0.2] });
  // legs end in formal black shoes (the long skirt covers the rest)
  for (const [ax, dir] of [[500, -1], [580, 1]]) {
    o += E.limb([[ax, 1560], [ax, 1625]], 26, { col: C.skin, sh: C.skinSh });
    const sh = catmull([[ax - 30 * dir, 1676], [ax - 32 * dir, 1640], [ax - 6 * dir, 1628], [ax + 30 * dir, 1636], [ax + 58 * dir, 1652], [ax + 62 * dir, 1676]], 6, true);
    o += part(sh, BLK, { sh: '#000', shPts: sh.map(([x, y]) => [x, y + 10]), w: WT.sil * 0.8 }) + ink([[ax - 20 * dir, 1638], [ax + 20 * dir, 1640]], 3, { color: '#5a566a' });
  }
  // long black skirt to the ankle, gentle A-line with soft pleats
  const sk = catmull([[420, 1110], [660, 1110], [700, 1300], [722 + sw * 8, 1600], [540, 1612], [358 + sw * 8, 1600], [380, 1300]].map(T), 6, true);
  let pl = ''; for (const x of [450, 500, 580, 630]) pl += ink(catmull([[x, 1180], [x + (x - 540) * 0.25, 1590]].map(T), 3, false), 4, { color: BLKsh, taper: [0.4, 0.1] });
  o += fill(sk, '#26232e') + clipped(sk, pl) + inkLoop(sk, WT.sil);
  // white shirt front with a pointed white collar
  const shirt = catmull([[470, 884], [610, 884], [640, 1000], [630, 1125], [450, 1125], [440, 1000]].map(T), 6, true);
  o += part(shirt, WH, { sh: WHsh, shPts: [[560, 900], [640, 900], [640, 1125], [560, 1125]].map(T), w: WT.mid });
  for (let y = 960; y < 1110; y += 45) { const [bx, by] = T([540, y]); o += `<circle cx="${bx}" cy="${by}" r="5" fill="#e8e4d8" stroke="${E.INK}" stroke-width="1.5"/>`; }
  for (const s of [-1, 1]) { const X = x => 540 + s * x;
    const col = catmull([[X(6), 880], [X(70), 872], [X(64), 916], [X(18), 908]].map(T), 4, true); o += part(col, WH, { sh: WHsh, shPts: col.map(([x, y]) => [x, y + 6]), w: WT.mid }); }
  // black open-breasted coat, hip length, notched lapels, two buttons
  for (const s of [-1, 1]) {
    const X = x => 540 + s * x;
    const pn = catmull([[X(40), 884], [X(130), 896], [X(160), 960], [X(160), 1120], [X(168), 1210], [X(60), 1220], [X(58), 1060], [X(34), 960]].map(T), 7, true);
    o += part(pn, BLK, { sh: BLKsh, shPts: (s > 0 ? [[560, 880], [720, 880], [720, 1230], [560, 1230]] : [[380, 1120], [480, 1120], [480, 1230], [380, 1230]]).map(T), w: WT.sil * 0.85 });
    const lap = catmull([[X(38), 890], [X(92), 900], [X(84), 950], [X(58), 1040], [X(46), 1000]].map(T), 5, true);
    o += part(lap, '#34303f', { sh: BLKsh, shPts: lap.map(([x, y]) => [x + s * 8, y + 8]), w: WT.mid });
    o += ink(catmull([[X(92), 1150], [X(150), 1150]].map(T), 3, false), 4, { color: '#3a3646', taper: [0.1, 0.1] }); // pocket welt
    if (s < 0) for (const y of [1080, 1150]) { const [bx, by] = T([X(66), y]); o += `<circle cx="${bx}" cy="${by}" r="7" fill="#3a3646" stroke="${E.INK}" stroke-width="2"/>`; }
  }
  return o;
}
function puffs(p) { return ''; }
function cards(c) { // fan of purple tarot cards floating by her hand (magic, no grip)
  let o = `<circle cx="${c.x}" cy="${c.y}" r="${140 * c.s}" fill="url(#halo)" opacity="${0.5 + (c.glow || 0) * 0.4}"/>`;
  const n = 5, spread = c.spread ?? 1;
  for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.22 * spread + (c.ang || 0);
    const T = q => rot([q[0] * c.s, q[1] * c.s], a).map((v, j) => v + [c.x, c.y + 60 * c.s][j]);
    const cd = [[-46, -150], [46, -150], [46, -10], [-46, -10]].map(T);
    o += `<path d="${E.poly(cd)}" fill="${C.card}" stroke="${E.INK}" stroke-width="${WT.mid}" stroke-linejoin="round"/>`;
    o += `<path d="${E.poly([[-38, -142], [38, -142], [38, -18], [-38, -18]].map(T))}" fill="none" stroke="${C.cardEdge}" stroke-width="3"/>`;
    const m = T([0, -80]); o += star(m[0], m[1], 16 * c.s, C.cardEdge) + `<circle cx="${T([0, -122])[0].toFixed(1)}" cy="${T([0, -122])[1].toFixed(1)}" r="${6 * c.s}" fill="${C.cardEdge}"/>`; }
  return o;
}
const COAT = { denim: '#24212c', denimSh: '#15131b', denimLt: '#34303f', stitch: '#3c3848' };
function bands(p) { // advocate's white neck bands under the chin (only with the coat)
  return p.lawyer ? `<g><path d="M528 866 L512 990 L537 994 L540 870 Z" fill="#ffffff" stroke="${E.INK}" stroke-width="4" stroke-linejoin="round"/><path d="M552 866 L568 990 L543 994 L540 870 Z" fill="#ffffff" stroke="${E.INK}" stroke-width="4" stroke-linejoin="round"/></g>` : `<g><path d="M524 868 L506 960 L536 966 Z" fill="#fbfaf4" stroke="${E.INK}" stroke-width="4" stroke-linejoin="round"/><path d="M556 868 L574 960 L544 966 Z" fill="#fbfaf4" stroke="${E.INK}" stroke-width="4" stroke-linejoin="round"/></g>`;
}
function draw(p) {
  if (p.lawyer) p = { ...p, coat: 1 };
  if (p.coat) { // owner script (Aries 2027): 'Aries ki wakeel' -> black advocate coat over her outfit + white bands
    const keep = {}; for (const k in COAT) { keep[k] = C[k]; C[k] = COAT[k]; }
    try { return drawInner(p) ; } finally { for (const k in keep) C[k] = keep[k]; }
  }
  return drawInner(p);
}
function drawInner(p) {
  const sk = { skin: C.skin, skinSh: C.skinSh, gold: C.gold, line: C.skinLine, bracelet: 'kada', sleeve: p.lawyer ? { col: '#5a5276', sh: '#3c3550', len: 1.0, trim: '#d8d2f0' } : { col: C.denim, sh: C.denimSh, len: p.coat ? 0.8 : 0.45, trim: C.denimLt } };
  const L = p.armL || { E: [380, 1080], W: [400, 1210], hand: 'relax' }, R = p.armR || { E: [700, 1080], W: [680, 1210], hand: 'relax' };
  const A = (S, X, out) => arm(S, X.E, X.W, { r: [36, 31, 26], handPose: X.hand, handAng: 0, hs: 1, handScale: 1.05, outward: out, palmSide: 1, handStyle: 'chubby', ...sk });
  // short chibi body: drawn at the old scale, shrunk toward the feet
  const W0 = { ...WT }; for (const q in WT) WT[q] = W0[q] / 0.72; // keep the outline weight the same as the rest of the cast after shrinking
  const bodyInner = body(p) + (p.coat || p.lawyer ? bands(p) : '') + A([400, 935], L, -1) + A([680, 935], R, 1) + puffs(p); for (const q in WT) WT[q] = W0[q];
  const bodyG = `<g transform="translate(540 1676) scale(0.72) translate(-540 -1676)">${bodyInner}</g>`;
  return bodyG + head({ ...p, head: p.head || [540, 840] }) + (p.cards ? cards(p.cards) : '');
}
module.exports = { C, draw };
