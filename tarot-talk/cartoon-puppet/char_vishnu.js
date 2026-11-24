// Vishnu ji: chubby chibi proportions (head ~55% of frame width), blue skin, gold mukut.
const E = require('./engine');
const { WT, catmull, mirror, ink, inkLoop, fill, clipped, part, tube, hand, arm, mouth, rot, clamp } = E;


const C = {
  skin: '#5884dc', skinSh: '#3d5db3', skinHi: '#86a7ee', blush: '#f06fa0',
  gold: '#f3c33a', goldSh: '#c98a17', goldHi: '#ffe9a0', red: '#d22f48', redHi: '#ff96a8',
  hair: '#1d1424', skinLine: '#20316e', hairHi: '#3b2a55', white: '#fbfaf4', iris: '#1a100e',
  mouth: '#5a1626', tongue: '#e86a80', teeth: '#fffaf0',
  cloth: '#f7c531', clothSh: '#d4911a', goldLine: '#8b5a0c', green: '#2f9e6b', greenSh: '#1f6e4a', leaf: '#5fa35a', leafSh: '#3f7a3e', mari: '#f39a2b', mariSh: '#d06d12', pink: '#f39bbb', pinkSh: '#d4648c', flower: '#fdf6ee',
};
const HS = 1.25; // head scale
// faceted gem in a gold bezel
function gem(x, y, r, col, w) {
  const bez = catmull([[0, -r * 1.35], [r * 1.35, 0], [0, r * 1.35], [-r * 1.35, 0]].map(([a, b]) => [x + a, y + b]), 5, true);
  const st = catmull([[0, -r], [r, 0], [0, r], [-r, 0]].map(([a, b]) => [x + a, y + b]), 5, true);
  return fill(bez, C.gold) + inkLoop(bez, w * 0.8) + fill(st, col) + `<path d="M${x - r * 0.5} ${y - r * 0.2} L${x} ${y - r * 0.7} L${x + r * 0.15} ${y - r * 0.1} Z" fill="#fff" opacity="0.7"/>` + inkLoop(st, w * 0.6);
}
const pearl = (x, y, r, w) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fffaf2" stroke="${E.INK}" stroke-width="${w}"/><circle cx="${(x - r * 0.35).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${r * 0.3}" fill="#fff"/>`;

function eye(cx, cy, lid, lx, brow, side, soft = 0, low = 0, ly = 0) {   // low: lower lid rises (smile squint); ly: gaze up/down   // soft: lifts the inner brow end so the brows read level and kind
  const rx = 52, ry = 50;
  const shape = catmull([[cx - rx, cy + 6], [cx - rx * 0.55, cy - ry], [cx + rx * 0.5, cy - ry * 1.04], [cx + rx, cy - 4], [cx + rx * 0.45, cy + ry * (0.92 - 0.6 * low)], [cx - rx * 0.5, cy + ry * (0.88 - 0.6 * low)]], 8, true);
  const lidY = cy - ry + (2 * ry + 8) * lid;
  const outer = side > 0 ? 1 : -1; // outer corner direction
  const lidLine = catmull([[cx - outer * (rx + 4), lidY + 8], [cx - outer * 10, lidY - 10], [cx + outer * (rx + 6), lidY + 2], [cx + outer * (rx + 14), lidY - 4]], 8, false);
  const browY = cy - 92 - brow * 26;
  const inner = '<circle cx="' + (cx + lx) + '" cy="' + (cy + 10 + ly) + '" r="25" fill="' + C.iris + '"/>' +
    '<circle cx="' + (cx + lx + 9) + '" cy="' + (cy + 2 + ly) + '" r="8" fill="#fff"/><circle cx="' + (cx + lx - 10) + '" cy="' + (cy + 22 + ly) + '" r="4.5" fill="#fff" opacity="0.85"/>' +
    `<path d="${E.poly(lidLine.concat([[lidLine[lidLine.length - 1][0], cy - 140], [lidLine[0][0], cy - 140]]))}" fill="${C.skin}"/>` +
    `<path d="${E.poly(lidLine.concat(lidLine.slice().reverse().map(([x, y]) => [x, y - 14])))}" fill="${C.skinSh}"/>`;
  const rimTop = shape.slice(0, Math.floor(shape.length * 0.55));
  return fill(shape, C.white) + clipped(shape, inner) + (lid > 0.15 ? `<path d="M${rimTop.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L')}" fill="none" stroke="${C.skin}" stroke-width="5"/>` : '') +
    ink(lidLine, 9.5, { prof: u => 0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, 0.2 + u)), taper: [0.15, 0.2] }) + // heavy lash line with outer flick
    ink(shape.slice(Math.floor(shape.length * 0.58), Math.floor(shape.length * 0.92)), WT.fine, { taper: [0.35, 0.35] }) +
    ink(catmull([[cx - outer * 50, browY + 14 - soft * 20], [cx - outer * 4, browY - 14 - soft * 6], [cx + outer * 54, browY + 4 - brow * 10]], 8, false), 11.5, { prof: u => 0.35 + 0.65 * Math.sin(Math.PI * (0.2 + 0.65 * u)), taper: [0.2, 0.5], color: C.brow || E.INK });
}

// back layer: halo + long hair behind shoulders (drawn before the body)
function back(p) {
  const HS = p.hs || 1.25;
  const hb = catmull(mirror([[0, -300], [200, -250], [262, -80], [280, 60], [262, 120], [298, 200], [280, 260], [318, 340], [300, 380], [334, 440], [270, 410], [230, 440], [150, 380]]), 8, true);
  const strands = [-1, 1].map(s => ink(catmull([[s * 215, 40], [s * 245, 200], [s * 290, 400]], 6, false), WT.fine * 1.5, { color: C.hairHi }) + ink(catmull([[s * 240, 120], [s * 262, 250], [s * 270, 370]], 6, false), WT.fine * 1.2, { color: C.hairHi }) +
    ink(catmull([[s * 236, -150], [s * 258, -60], [s * 262, 40]], 6, false), 10, { color: '#4b4f7a', taper: [0.4, 0.4], amp: 0.5 })).join('');
  return `<g transform="translate(${p.head[0].toFixed(1)} ${p.head[1].toFixed(1)}) rotate(${p.tilt.toFixed(2)}) scale(${HS})">
    <circle cx="0" cy="-90" r="400" fill="url(#halo)"/>${fill(hb, C.hair)}${inkLoop(hb, WT.sil / HS)}${strands}</g>`;
}

function head(p) {
  const HS = p.hs || 1.25;
  const g = [];
  const face = catmull(mirror([[0, -212], [152, -182], [216, -66], [222, 36], [192, 128], [112, 192], [0, 214]]), 10, true);
  for (const s of [-1, 1]) { // ears + round kundals
    const ear = catmull([[s * 212, -30], [s * 258, -22], [s * 262, 48], [s * 226, 86]], 6, true);
    g.push(part(ear, s > 0 ? C.skinSh : C.skin, { w: WT.mid / HS }));
    const sw = p.earSwing * s;
    const kx = s * 244 + sw, ky = 128, ros = [];
    for (let k = 0; k < 16; k++) { const a = Math.PI * k / 8, rr = k % 2 ? 33 : 42; ros.push([kx + Math.cos(a) * rr, ky + Math.sin(a) * rr]); }
    g.push(ink(catmull([[s * 240, 80], [s * 242 + sw * 0.5, 96]], 3, false), WT.fine / HS));
    g.push(part(catmull(ros, 2, true), C.gold, { sh: C.goldSh, shPts: ros.map(([x, y]) => [x + 10, y + 10]), w: WT.mid / HS }));
    g.push(ink(catmull([[0, -24], [24, 0], [0, 24], [-24, 0]].map(([a, b]) => [kx + a, ky + b]), 6, true), WT.fine / HS, { color: C.goldLine }));
    g.push(gem(kx, ky, 12, C.red, WT.mid / HS));
    g.push(ink([[kx, ky + 40], [kx + sw * 0.4, ky + 56]], WT.fine / HS) + gem(kx + sw * 0.45, ky + 64, 7, C.green, WT.mid / HS) + ink([[kx + sw * 0.45, ky + 74], [kx + sw * 0.55, ky + 84]], WT.fine / HS) + pearl(kx + sw * 0.6, ky + 92, 9, 2.4));
  }
  const shade = catmull([[128, -240], [182, -70], [178, 90], [70, 250], [320, 260], [320, -240]], 8, true);
  g.push(fill(face, C.skin) + clipped(face, fill(shade, C.skinSh) +
    `<ellipse cx="-122" cy="92" rx="32" ry="17" fill="${C.blush}" opacity="0.42"/><ellipse cx="126" cy="92" rx="29" ry="15" fill="${C.blush}" opacity="0.36"/>` +
''));
  g.push(ink(face.slice(Math.floor(face.length * 0.06), Math.floor(face.length * 0.6)), WT.sil / HS * 1.1, { prof: u => 0.35 + 0.65 * Math.sin(Math.PI * u), taper: [0.3, 0.2] }));
  g.push(ink(face.slice(Math.floor(face.length * 0.55)).concat(face.slice(0, Math.floor(face.length * 0.1))), WT.sil / HS * 0.8, { taper: [0.2, 0.35] }));
  for (const s of [-1, 1]) { // side locks over the face edge
    const lock = catmull([[s * 118, -196], [s * 210, -128], [s * 238, 10], [s * 214, 76], [s * 200, -30], [s * 150, -128]], 8, true);
    g.push(fill(lock, C.hair) + inkLoop(lock, WT.mid / HS) + ink(catmull([[s * 160, -150], [s * 205, -60], [s * 212, 20]], 5, false), WT.fine / HS, { color: C.hairHi }));
  }
  if (!p.noTilak) g.push(ink(catmull([[-20, -150], [-10, -98], [0, -90], [10, -98], [20, -150]], 6, false), 10, { color: '#fff3d6', prof: () => 0.85, taper: [0.08, 0.08] }));
  if (!p.noTilak) g.push(ink(catmull([[0, -142], [0, -100]], 4, false), 8, { color: C.red, prof: () => 0.9, taper: [0.1, 0.2] }));
  const happyEye = (cx, side) => ink(catmull([[cx - 44, 6], [cx, -34], [cx + 44, 6]], 6, false), 12, { taper: [0.3, 0.3] }) + ink(catmull([[cx + side * 44, 2], [cx + side * 58, -8]], 2, false), 6, { taper: [0.1, 0.5] });
  for (const side of [-1, 1]) {
    const cx = side * 90, mode = p.eyeMode === 'happy' || (p.wink === side) ? 'happy' : null;
    if (mode) { g.push(happyEye(cx, side)); g.push(ink(catmull([[cx - side * 48, -96 - (side < 0 ? p.browL : p.browR) * 22], [cx, -110 - (side < 0 ? p.browL : p.browR) * 22], [cx + side * 50, -96]], 6, false), 11.5, { taper: [0.2, 0.5] })); }
    else g.push(eye(cx, -6, p.lid, p.lookX, side < 0 ? p.browL : p.browR, side, p.browSoft || 0, p.lidLow || 0, p.lookY || 0));
  }
  if (p.blushHatch) for (const k of [-1, 1]) g.push([-14, 0, 14].map(dx => `<line x1="${k * 126 + dx - 6}" y1="100" x2="${k * 126 + dx + 6}" y2="84" stroke="#e0457a" stroke-width="3.2" stroke-linecap="round" opacity="0.7"/>`).join(''));
  g.push(ink(catmull([[-4, 42], [-16, 70], [4, 76]], 6, false), WT.fine * 1.6, { taper: [0.3, 0.3], color: C.skinLine }));
  const mx = 6, my = 128, ML = (pts, w = WT.mid * 1.2) => ink(catmull(pts.map(([x, y]) => [mx + x, my + y]), 6, false), w, { taper: [0.2, 0.2] });
  if (p.mouthShape === 'cat') g.push(ML([[-34, -4], [-17, 8], [0, -2], [17, 8], [34, -6]]));
  else if (p.mouthShape === 'smileBig') { const m = catmull([[-46, -6], [0, -1], [46, -8], [30, 32], [0, 42], [-30, 32]].map(([x, y]) => [mx + x, my + y]), 6, true); g.push(fill(m, C.mouth) + clipped(m, fill(catmull([[-24, 30], [0, 16], [24, 30], [0, 46]].map(([x, y]) => [mx + x, my + y]), 5, true), C.tongue) + fill(catmull([[-46, -10], [46, -10], [46, 4], [-46, 4]].map(([x, y]) => [mx + x, my + y]), 3, true), C.teeth)) + inkLoop(m, WT.mid)); }
  else if (p.mouthShape === 'sly') g.push(ML([[-30, 6], [0, 10], [26, -4], [40, -16]]) + ML([[34, -10], [42, -2]], WT.fine));
  else if (p.mouthShape === 'munch') { g.push(ML([[-24, 2], [-8, 10], [10, 4], [26, 10]]) + `<ellipse cx="128" cy="90" rx="44" ry="34" fill="${C.skinSh}" opacity="0.35"/>` + ink(catmull([[100, 60], [150, 74], [168, 108]], 4, false), WT.fine * 1.4, { color: C.skinLine })); }
  else if (p.mouthShape === 'lick') { const t2 = catmull([[-4, 0], [22, -4], [30, 22], [14, 34], [-2, 22]].map(([x, y]) => [mx + x, my + y]), 5, true); g.push(ML([[-34, -2], [0, 6], [34, -4]]) + fill(t2, C.tongue) + inkLoop(t2, WT.fine * 1.5)); }
  else if (p.mouthShape === 'lickBig') { // wide open mouth, tongue stretched out sideways, wiggling every drawing
    const t = p.t || 0, wig = Math.sin(t * 22) * 0.35, len = 62 + Math.sin(t * 11) * 12, dir = p.lickDir || -1;
    const m = catmull([[-40, -8], [0, -14], [40, -8], [32, 34], [0, 46], [-32, 34]].map(([x, y]) => [mx + x, my + y]), 6, true);
    g.push(fill(m, C.mouth) + inkLoop(m, WT.mid));
    const base = [mx + dir * 10, my + 22], a = (dir < 0 ? Math.PI : 0) + wig * dir + 0.35 * dir;
    const tip = [base[0] + Math.cos(a) * len, base[1] + Math.sin(a) * len * 0.7 + 10];
    const n = [-Math.sin(a), Math.cos(a)], w = 17;
    const tg = catmull([[base[0] + n[0] * w, base[1] + n[1] * w], [(base[0] + tip[0]) / 2 + n[0] * w * 1.05, (base[1] + tip[1]) / 2 + n[1] * w * 1.05], [tip[0] + n[0] * w * 0.6, tip[1] + n[1] * w * 0.6],
      [tip[0] + Math.cos(a) * 10, tip[1] + Math.sin(a) * 8], [tip[0] - n[0] * w * 0.6, tip[1] - n[1] * w * 0.6], [(base[0] + tip[0]) / 2 - n[0] * w, (base[1] + tip[1]) / 2 - n[1] * w], [base[0] - n[0] * w, base[1] - n[1] * w]], 6, true);
    g.push(fill(tg, C.tongue) + inkLoop(tg, WT.mid * 0.9) + ink([[base[0] + Math.cos(a) * 8, base[1] + Math.sin(a) * 6], [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2]], WT.fine * 1.4, { color: '#c94a64' }));
    for (const k of [0, 1]) { const ph = t * 9 + k * 2; g.push(ink([[tip[0] + dir * (18 + k * 12), tip[1] - 30 + k * 8], [tip[0] + dir * (26 + k * 12), tip[1] - 40 + k * 8 + Math.sin(ph) * 4]], 4, { taper: [0.3, 0.3] })); } // "lick" motion marks
  }
  else if (p.mouthShape === 'sipBig') { // lips pushed out into a slurping O, cheeks sucked in, slurp lines
    const t = p.t || 0, pul = 1 + Math.sin(t * 16) * 0.12;
    const m = catmull([[0, -12 * pul], [16 * pul, 0], [0, 14 * pul], [-16 * pul, 0]].map(([x, y]) => [mx + 14 + x, my + 4 + y]), 6, true);
    g.push(fill(m, C.mouth) + ink(catmull([[0, -20], [26, 0], [0, 22], [-26, 0]].map(([x, y]) => [mx + 14 + x * pul, my + 4 + y * pul]), 6, true), WT.mid * 1.6, { taper: [0.05, 0.05] }));
    for (const sgn of [-1, 1]) g.push(ink(catmull([[sgn * 110, 50], [sgn * 98, 76], [sgn * 104, 100]], 4, false), WT.fine * 1.6, { color: C.skinLine }));
    for (let k = 0; k < 3; k++) g.push(ink([[mx + 40 + k * 10, my - 30 - k * 14], [mx + 54 + k * 10, my - 36 - k * 14 + Math.sin(t * 12 + k) * 4]], 4, { taper: [0.3, 0.3] }));
  }
  else if (p.mouthShape === 'chomp') { // big chewing mouth: snaps open and shut every few drawings
    const t = p.t || 0, op = Math.max(0, Math.sin(t * 13));
    if (op < 0.25) g.push(ML([[-34, 2], [-12, 12], [12, 4], [34, 12]]) + `<ellipse cx="130" cy="90" rx="48" ry="36" fill="${C.skinSh}" opacity="0.35"/>`);
    else { const h = 20 + op * 34, m = catmull([[-38, -6], [0, -10], [38, -6], [30, h * 0.7], [0, h], [-30, h * 0.7]].map(([x, y]) => [mx + x, my + y]), 6, true);
      g.push(fill(m, C.mouth) + clipped(m, fill(catmull([[-24, h * 0.7], [0, h * 0.4], [24, h * 0.7], [0, h + 6]].map(([x, y]) => [mx + x, my + y]), 5, true), C.tongue) + fill(catmull([[-38, -12], [38, -12], [38, 2], [-38, 2]].map(([x, y]) => [mx + x, my + y]), 3, true), C.teeth)) + inkLoop(m, WT.mid));
      const k = catmull([[-10, -9], [9, -10], [11, 8], [-9, 10]].map(([x, y]) => [mx + 4 + x, my + h * 0.45 + y]), 3, true); g.push(fill(k, '#fff4c8') + inkLoop(k, WT.fine)); }
    for (const k of [0, 1]) g.push(ink([[mx - 70 - k * 14, my - 10 + k * 18], [mx - 86 - k * 14, my - 16 + k * 18]], 4, { taper: [0.3, 0.3] }));
  }
  else if (p.mouthShape === 'o') { const m = catmull([[0, -9], [11, 0], [0, 13], [-11, 0]].map(([x, y]) => [mx + x, my + y]), 5, true); g.push(fill(m, C.mouth) + inkLoop(m, WT.mid)); }
  else if (p.mouthShape !== 'hidden') g.push(mouth(p.viseme, mx, my, 0.9, C));
  if ((p.fx || []).includes('sparkle')) for (const [x, y, r] of [[-250, -140, 22], [256, -70, 18], [236, -230, 14]]) g.push(`<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="#ffe680" stroke="${E.INK}" stroke-width="2.5"/>`);
  if ((p.fx || []).includes('sweat')) { const d = catmull([[200, -150], [214, -120], [200, -106], [186, -120]], 5, true); g.push(fill(d, '#9fd8ff') + inkLoop(d, WT.fine * 1.5)); }
  // mukut: rounded tall crown, centre jewel, pearl row, side flanges
  const CY = y => -170 + (y + 170) * 0.7; // crown compressed toward the band
  const crown = catmull(mirror([[0, -505], [30, -478], [48, -432], [112, -396], [152, -332], [180, -252], [190, -168], [0, -198]].map(([x, y]) => [x, CY(y)])), 6, true);
  g.push(part(crown, C.gold, { sh: C.goldSh, shPts: [[50, -520], [200, -360], [200, -150], [70, -190], [60, -380]].map(([x, y]) => [x, CY(y)]), w: WT.sil / HS }));
  const gl = (pts, w = WT.fine / HS * 1.3) => ink(catmull(pts, 6, false), w, { color: C.goldLine, taper: [0.25, 0.25], amp: 0.4 });
  let eng = '';
  eng += fill(crown.map(([x, y]) => [x * 0.9, CY(-170) + (y - CY(-170)) * 0.9 - 2]).length ? [] : [], C.gold);
  eng += gl([[-178, -205], [0, -238], [178, -205]], WT.fine / HS * 1.6) + gl([[-150, -276], [0, -304], [150, -276]], WT.fine / HS * 1.6); // two clean tier lines
  for (let k = -4; k <= 4; k++) { // lotus petal row on the middle tier
    const x = k * 36, y0 = -216 - 30 * (1 - (x / 190) ** 2), pt = catmull([[x - 14, y0], [x - 9, y0 - 24], [x, y0 - 36], [x + 9, y0 - 24], [x + 14, y0]], 5, false);
    eng += fill(pt.concat([[x, y0 + 4]]), C.goldSh) + fill(pt.map(([a, b]) => [x + (a - x) * 0.55, y0 + (b - y0) * 0.6]).concat([[x, y0 + 2]]), C.goldHi) + ink(pt, WT.fine / HS * 1.3, { color: C.goldLine, taper: [0.1, 0.1], amp: 0.3 });
  }
  eng += ink(catmull([[-100, -228], [-84, -268], [-56, -300]], 6, false), 6, { color: C.goldHi, taper: [0.4, 0.4], amp: 0.3 });
  g.push(clipped(crown, eng + ink(crown.slice(Math.floor(crown.length * 0.75)).concat(crown.slice(0, Math.floor(crown.length * 0.25))), 10, { color: C.goldSh, taper: [0.2, 0.2], amp: 0.3 })));
  for (const sg of [-1, 1]) {
    const wing = catmull([[sg * 150, -170], [sg * 205, -220], [sg * 230, -170], [sg * 210, -130], [sg * 175, -140]], 6, true);
    g.push(part(wing, C.gold, { sh: C.goldSh, shPts: wing.map(([x, y]) => [x + 10, y + 14]), w: WT.mid / HS }) + gl([[sg * 168, -152], [sg * 200, -190], [sg * 214, -168], [sg * 200, -156]]) + gem(sg * 196, -168, 7, C.green, WT.mid / HS));
    g.push(gem(sg * 78, -288, 8, C.green, WT.mid / HS));
  }
  const band = catmull([[-182, -150], [0, -210], [182, -150], [172, -116], [0, -174], [-172, -116]], 8, true);
  g.push(part(band, C.goldSh, { w: WT.mid / HS }));
  g.push(gl([[-176, -134], [0, -192], [176, -134]], WT.fine / HS));
  for (const [x, col] of [[-132, C.red], [-66, C.green], [66, C.green], [132, C.red]]) g.push(gem(x, -150 - (Math.abs(x) < 100 ? 22 : 6), 7, col, WT.mid / HS));
  for (let k = -7; k <= 7; k++) { const x = k * 23, y = -118 - 58 * (1 - (x / 180) ** 2) + 6; if (Math.abs(k) > 1) g.push(pearl(x, y + 10, 5.5, 2)); } // pearl fringe under the band
  for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) g.push(pearl(sg * (168 + k * 3), -100 + k * 16, 5.5, 2)); // side pearl strings
  g.push(gem(0, -272, 22, C.red, WT.mid / HS));
  for (const [yy, ww] of [[CY(-470), 46], [CY(-488), 36], [CY(-503), 26]]) { const ring = catmull([[-ww, yy + 7], [-ww, yy - 5], [ww, yy - 5], [ww, yy + 7]], 3, true); g.push(part(ring, C.goldSh, { w: WT.fine / HS * 1.6 })); } // stacked rings
  const fin = catmull([[0, CY(-575)], [16, CY(-535)], [12, CY(-512)], [-12, CY(-512)], [-16, CY(-535)]], 5, true);
  g.push(part(fin, C.gold, { w: WT.mid / HS }) + gem(0, CY(-528), 9, C.red, WT.mid / HS));
  return `<g transform="translate(${p.head[0].toFixed(1)} ${p.head[1].toFixed(1)}) rotate(${p.tilt.toFixed(2)}) scale(${HS})">${g.join('')}</g>`;
}

function torso(p) {
  const b = p.breath, T = q => [540 + (q[0] - 540) * (1 + b * 0.012), 1920 - (1920 - q[1]) * (1 + b * 0.006)];
  const shape = catmull([[440, 1080], [330, 1120], [225, 1215], [185, 1430], [170, 1960], [910, 1960], [895, 1430], [855, 1215], [750, 1120], [640, 1080]].map(T), 10, true);
  const shadow = catmull([[700, 1100], [835, 1190], [890, 1430], [905, 1960], [790, 1960], [780, 1500], [740, 1270], [650, 1140]].map(T), 8, true);
  const sash = catmull([[630, 1100], [700, 1140], [430, 1820], [350, 1960], [270, 1960], [370, 1740]].map(T), 8, true);
  const sashSh = catmull([[690, 1130], [705, 1150], [440, 1820], [370, 1960], [340, 1960], [420, 1780]].map(T), 6, true);
  let o = fill(shape, C.skin) + clipped(shape, fill(shadow, C.skinSh) + fill(sash, C.cloth) + fill(sashSh, C.clothSh) +
    ink(catmull([[630, 1100], [700, 1140], [430, 1820], [350, 1960]].map(T), 10, false), WT.mid));
  o += ink(shape.slice(0, Math.floor(shape.length * 0.5)), WT.sil, { taper: [0.25, 0.05] }) + ink(shape.slice(Math.floor(shape.length * 0.5)), WT.sil, { taper: [0.05, 0.25] });
  o += ink(catmull([[420, 1370], [480, 1395], [535, 1385]].map(T), 6, false), WT.fine * 1.4, { color: C.skinLine });
  const collar = catmull([[395, 1110], [470, 1230], [540, 1255], [610, 1230], [685, 1110], [650, 1098], [540, 1205], [430, 1098]].map(T), 6, true);
  o += part(collar, C.gold, { sh: C.goldSh, shPts: [[540, 1150], [700, 1100], [700, 1300], [540, 1300]].map(T), w: WT.mid });
  o += part(catmull([[520, 1232], [540, 1214], [560, 1232], [540, 1272]].map(T), 4, true), C.red, { w: WT.fine });
  // chunky vaijayanti mala: overlapping flower clusters
  for (let i = 0; i <= 26; i++) {
    const a = Math.PI * (0.07 + 0.86 * i / 26), q = T([540 - Math.cos(a) * 255, 1090 + Math.sin(a) * 440]);
    const f = catmull([[0, -27], [24, -10], [18, 22], [-18, 22], [-24, -10]].map(z => [q[0] + z[0], q[1] + z[1]]), 4, true);
    o += part(f, i % 3 === 0 ? C.pink : C.flower, { sh: i % 3 === 0 ? C.pinkSh : '#e9d9d6', shPts: f.map(([x, y]) => [x + 8, y + 9]), w: WT.fine + 0.6 });
  }
  return o;
}

// draw the whole character for one pose
function draw(p) {
  return back(p) + torso(p) +
    tube([p.armL.S, p.armL.E, p.armL.W], [50, 40, 34], { col: C.skin, sh: C.skinSh, capStart: true }) +
    hand('rest', p.armL.W, Math.atan2(p.armL.W[1] - p.armL.E[1], p.armL.W[0] - p.armL.E[0]) - Math.PI / 2, 0.95, C.skin, C.skinSh, C.gold) +
    armband(p.armL.S, p.armL.E, 50) +
    head(p) +
    tube([p.armR.S, p.armR.E, p.armR.W], [54, 42, 34], { col: C.skin, sh: C.skinSh, capStart: true }) +
    armband(p.armR.S, p.armR.E, 54) +
    hand(p.armR.hand, p.armR.W, p.armR.handAng, 1.0, C.skin, C.skinSh, C.gold) +
    (p.chakra ? chakra(p.chakra) : '');
}
// gold bajuband a little down the upper arm: hides where the arm leaves the shoulder
function armband(S, El, r) {
  const t = 0.34, c = [S[0] + (El[0] - S[0]) * t, S[1] + (El[1] - S[1]) * t], a = Math.atan2(El[1] - S[1], El[0] - S[0]);
  const P = q => { const z = rot(q, a); return [z[0] + c[0], z[1] + c[1]]; };
  const band = catmull([[-12, -r - 3], [-4, 0], [-12, r + 3], [12, r + 3], [20, 0], [12, -r - 3]].map(P), 5, true); // edges bow along the arm = wraps round it
  const nx = El[0] > S[0] ? -1 : 1; // peak points away from the body
  const peak = catmull([[-10, -r * 0.2 * nx], [4, -r * 0.2 * nx - 26 * nx], [18, -r * 0.2 * nx]].map(([x, y]) => [x, y - r * 0.8 * nx]).map(P), 4, true);
  return part(band, C.gold, { sh: C.goldSh, shPts: [[-20, r * 0.2], [30, r * 0.2], [30, r + 8], [-20, r + 8]].map(P), w: WT.mid }) +
    ink(catmull([[-6, -r], [0, 0], [-6, r]].map(P), 4, false), WT.fine, { color: C.goldLine }) + part(peak, C.gold, { w: WT.fine + 1 }) + gem(...P([6, 0]), 6.5, C.red, WT.mid);
}
// Sudarshan chakra spinning on the fingertip
function chakra({ x, y, spin, scale }) {
  let o = '';
  const R = 70 * scale, teeth = 12;
  const rim = []; for (let k = 0; k < teeth * 2; k++) { const a = spin + Math.PI * k / teeth, rr = k % 2 ? R : R * 1.22; rim.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  o += `<circle cx="${x}" cy="${y}" r="${R * 1.5}" fill="url(#halo)" opacity="0.8"/>`;
  o += part(rim, C.gold, { sh: C.goldSh, shPts: rim.map(([a, b]) => [a + 8 * scale, b + 10 * scale]), w: WT.mid });
  const inner = catmull([[0, -R * 0.62], [R * 0.62, 0], [0, R * 0.62], [-R * 0.62, 0]].map(([a, b]) => [x + a, y + b]), 8, true);
  o += part(inner, C.goldSh, { w: WT.fine });
  for (let k = 0; k < 6; k++) { const a = spin * 1 + Math.PI * k / 3; o += ink([[x + Math.cos(a) * R * 0.2, y + Math.sin(a) * R * 0.2], [x + Math.cos(a) * R * 0.6, y + Math.sin(a) * R * 0.6]], WT.fine * 1.6, { taper: [0.1, 0.1], amp: 0.3 }); }
  return o + `<circle cx="${x}" cy="${y}" r="${12 * scale}" fill="${C.red}" stroke="${E.INK}" stroke-width="3"/>` +
    [0.6, 2.7, 4.8].map(a => ink([[x + Math.cos(spin + a) * R * 1.45, y + Math.sin(spin + a) * R * 1.45], [x + Math.cos(spin + a + 0.7) * R * 1.45, y + Math.sin(spin + a + 0.7) * R * 1.45]], 5, { color: '#fff6c8', taper: [0.5, 0.5], amp: 0 })).join('');
}


// ---------- seated, full-body variant (floating cross-legged, like the reference) ----------
const FOLD = '#a9690c';
const lerpP = (a, b, t) => a + (b - a) * t;
function torsoSeated(p) {
  // slimmer tummy: chest keeps its width, the waist tapers in below the chest
  const slim = y => 1 - 0.3 * Math.min(1, Math.max(0, (y - 940) / 140));
  const b = p.breath, T = q => [540 + (q[0] - 540) * slim(q[1]) * (1 + b * 0.015), 1185 - (1185 - q[1]) * (1 + b * 0.01)];
  const shape = catmull([[478, 888], [405, 900], [352, 950], [344, 1030], [352, 1100], [362, 1190], [718, 1190], [728, 1100], [736, 1030], [728, 950], [675, 900], [602, 888]].map(T), 10, true);
  const sh = catmull([[660, 1000], [730, 1010], [740, 1060], [728, 1200], [650, 1200], [668, 1090], [656, 1030]].map(T), 8, true); // starts below the shoulder so the arm melts into lit skin
  const sash = catmull([[625, 896], [690, 920], [420, 1192], [350, 1192]].map(T), 8, true);
  let o = fill(shape, C.skin) + clipped(shape, fill(sh, C.skinSh) + fill(sash, C.cloth) + fill(catmull([[675, 914], [690, 924], [430, 1192], [400, 1192]].map(T), 6, true), C.clothSh) +
    ink(catmull([[690, 920], [420, 1192]].map(T), 10, false), WT.mid) + ink(catmull([[625, 896], [350, 1192]].map(T), 10, false), WT.mid));
  o += ink(shape.slice(0, Math.floor(shape.length * 0.5)), WT.sil, { taper: [0.3, 0.05] }) + ink(shape.slice(Math.floor(shape.length * 0.5)), WT.sil, { taper: [0.05, 0.3] });
  o += ink(catmull([[420, 1000], [460, 1018], [505, 1010]].map(T), 6, false), WT.fine * 1.4, { color: C.skinLine }) + ink(catmull([[525, 1120], [532, 1132]].map(T), 3, false), WT.fine * 1.6, { color: C.skinLine });
  const collar = catmull([[425, 902], [480, 975], [540, 992], [600, 975], [655, 902], [628, 894], [540, 955], [452, 894]].map(T), 6, true);
  o += part(collar, C.gold, { sh: C.goldSh, shPts: [[540, 930], [680, 890], [680, 1010], [540, 1010]].map(T), w: WT.mid });
  for (let k = 1; k < 8; k++) { const u = k / 8, q = T([lerpP(452, 628, u), 0]); const x = q[0], y = 912 + 66 * Math.sin(Math.PI * u) * 0.95; if (k !== 4) o += gem(x, y, 5, k % 2 ? C.red : C.green, WT.mid); }
  o += ink(catmull([[440, 902], [540, 978], [640, 902]].map(T), 8, false), WT.fine, { color: C.goldLine });
  const pend = catmull([[540, 968], [566, 996], [540, 1040], [514, 996]].map(T), 5, true);
  o += part(pend, C.gold, { sh: C.goldSh, shPts: [[540, 960], [580, 960], [580, 1050], [540, 1050]].map(T), w: WT.mid }) + gem(...T([540, 1000]), 11, C.red, WT.mid);
  for (const dx of [-14, 0, 14]) { const q = T([540 + dx, 1050 + (dx ? 0 : 8)]); o += pearl(q[0], q[1], 5.5, 2); }
  return o;
}
function lap(p) {
  const shape = catmull([[330, 1172], [540, 1160], [750, 1172], [868, 1262], [880, 1372], [760, 1440], [540, 1418], [320, 1440], [200, 1372], [212, 1262]], 10, true);
  const sh = catmull([[540, 1300], [880, 1280], [900, 1460], [540, 1460]], 6, true);
  let o = fill(shape, C.cloth) + clipped(shape, fill(sh, C.clothSh) +
    [[[540, 1185], [470, 1290], [430, 1410]], [[560, 1185], [640, 1300], [690, 1420]], [[470, 1190], [360, 1280], [270, 1360]], [[610, 1190], [740, 1280], [830, 1350]], [[520, 1300], [540, 1360], [530, 1415]]]
      .map(f => ink(catmull(f, 6, false), WT.fine * 1.5, { color: FOLD, taper: [0.5, 0.3] })).join(''));
  o += inkLoop(shape, WT.sil);
  const band = catmull([[345, 1168], [540, 1150], [735, 1168], [735, 1202], [540, 1188], [345, 1202]], 8, true);
  o += part(band, C.red, { sh: '#a51f36', shPts: [[540, 1150], [760, 1150], [760, 1210], [540, 1210]], w: WT.mid });
  o += part(catmull([[528, 1158], [552, 1158], [560, 1196], [520, 1196]], 4, true), C.gold, { w: WT.fine });
  // padmasana: each foot rests on the opposite thigh, sole up, heel toward the navel, toes outward
  for (const [hx, hy, dir, ang] of [[488, 1300, -1, 0.10], [596, 1308, 1, -0.10]]) {
    const T = ([x, y]) => { const q = rot([x * dir, y], ang * dir); return [hx + q[0], hy + q[1]]; };
    const FP = [[-4, -38], [-40, -20], [-44, 10], [-24, 36], [16, 34], [58, 24], [110, 36], [136, 30], [150, 12], [150, -10], [140, -28], [110, -38], [58, -30], [20, -36]];
    const foot = catmull(FP.map(T), 7, true);
    const sole = catmull(FP.map(([x, y]) => [70 + (x - 70) * 0.86, y * 0.8 + 6]).map(T), 7, true); // sole faces up: pink almost everywhere, blue rim on top
    o += fill(foot, C.skin) + clipped(foot, fill(sole, '#f2a7c0') + fill(catmull([[0, 4], [60, 10], [120, 6], [120, 40], [0, 40]].map(T), 4, true), '#e48fae'));
    [[150, -22, 14], [158, -2, 9.5], [156, 12, 8.5], [149, 24, 7.5], [137, 32, 6.5]].forEach(([x, y, rr]) => {
      const toe = catmull([[x - rr, y - rr * 0.8], [x + rr * 0.6, y - rr], [x + rr * 1.1, y], [x + rr * 0.6, y + rr], [x - rr, y + rr * 0.8]].map(T), 4, true);
      o += fill(toe, '#f2a7c0') + ink(toe.slice(1, -1), WT.fine * 1.1, { taper: [0.3, 0.3] });
    });
    o += inkLoop(foot, WT.mid * 1.1);
    o += ink(catmull([[50, -4], [86, 4], [112, -2]].map(T), 5, false), WT.fine, { color: '#c7708d', taper: [0.4, 0.4] }); // sole crease
  }
  // front pleats of the dhoti fall between the heels and hide where the legs cross
  const pleat = catmull([[506, 1196], [578, 1196], [594, 1280], [602, 1366], [542, 1384], [482, 1366], [490, 1280]], 7, true);
  o += part(pleat, C.cloth, { sh: C.clothSh, shPts: [[560, 1240], [640, 1240], [640, 1390], [560, 1390]], w: WT.mid });
  o += [[[520, 1206], [510, 1300], [506, 1368]], [[542, 1206], [542, 1300], [542, 1378]], [[564, 1206], [574, 1300], [578, 1368]]].map(f => ink(catmull(f, 5, false), WT.fine * 1.4, { color: FOLD, taper: [0.3, 0.3] })).join('');
  return o;
}
function vanamala(p) {
  const by = p.breath * 2;
  const path = catmull([[478, 922], [452, 990], [442, 1080], [456, 1176], [492, 1250], [540, 1280], [588, 1250], [624, 1176], [638, 1080], [628, 990], [602, 922]].map(([x, y]) => [x, y + by * (y - 900) / 390]), 12, false);
  const acc = [0]; for (let i = 1; i < path.length; i++) acc.push(acc[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const at = d => { let i = 1; while (i < acc.length - 1 && acc[i] < d) i++; const u = (d - acc[i - 1]) / (acc[i] - acc[i - 1] || 1); const a = path[i - 1], b = path[i]; return { q: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], ang: Math.atan2(b[1] - a[1], b[0] - a[0]) }; };
  const L = acc[acc.length - 1], step = 25, F = 1.55;
  let leaves = '', flowers = '';
  for (let d = 10, k = 0; d < L - 6; d += step, k++) {
    const { q, ang } = at(d), [x, y] = q;
    for (const sd of [-1, 1]) if (true) { // tulsi leaves flare out on both sides
      const lf = catmull([[0, 0], [10, -6 * sd], [26, -14 * sd], [14, -2 * sd]].map(([a, b]) => { const z = rot([a, b], ang + sd * 1.25); return [x + z[0] * F, y + z[1] * F]; }), 4, true);
      leaves += fill(lf, C.leaf) + ink(lf.slice(0, 7), WT.fine * 0.9, { taper: [0.3, 0.3] });
    }
    const kind = [0, 2, 1, 2][k % 4]; // lotus, marigold, jasmine, marigold
    if (kind === 0) { // pink lotus: five petals + gold centre
      for (let j = 0; j < 5; j++) { const pa = ang + j * Math.PI * 2 / 5; const pt = catmull([[0, 0], [6, -7], [17, 0], [6, 7]].map(([a, b]) => { const z = rot([a, b], pa); return [x + z[0] * F, y + z[1] * F]; }), 4, true); flowers += fill(pt, C.pink) + ink(pt.slice(2, 12), WT.fine * 0.9, { taper: [0.3, 0.3] }); }
      flowers += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${5 * F}" fill="${C.gold}" stroke="${E.INK}" stroke-width="1.8"/>`;
    } else if (kind === 2) { // marigold: round ruffled pom, two petal rings, darker heart
      for (const [R, col, n] of [[16, C.mariSh, 18], [12, C.mari, 14], [7.5, '#ffb347', 10]]) {
        const m = []; for (let j = 0; j < n * 2; j++) { const a = Math.PI * j / n + R, rr = (j % 2 ? R * 0.82 : R) * F; m.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
        flowers += fill(catmull(m, 2, true), col) + (R === 16 ? ink(catmull(m, 2, true).slice(0, -2), WT.fine * 0.9, { taper: [0.1, 0.1] }) : '');
      }
      flowers += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${3.2 * F}" fill="#a8480c"/>`;
    } else { // jasmine buds
      for (let j = 0; j < 4; j++) { const pa = ang + j * Math.PI / 2 + 0.4; const pt = catmull([[0, 0], [5, -5], [12, 0], [5, 5]].map(([a, b]) => { const z = rot([a, b], pa); return [x + z[0] * F, y + z[1] * F]; }), 3, true); flowers += fill(pt, C.flower) + ink(pt.slice(2, 9), WT.fine * 0.8, { taper: [0.3, 0.3] }); }
    }
  }
  // tassel cluster where the garland meets at the lap
  const { q } = at(L / 2), tx = q[0], ty = q[1];
  let tas = ''; for (const dx of [-10, 0, 10]) tas += ink([[tx + dx * 0.4, ty + 8], [tx + dx, ty + 34]], WT.fine * 1.4, { color: C.goldSh }) + pearl(tx + dx, ty + 38, 5, 1.8);
  return leaves + flowers;
}
function conch(x, y, ang, s) {
  const T = q => rot([q[0] * s, q[1] * s], ang).map((v, i) => v + [x, y][i]);
  const body = catmull([[-60, -10], [-30, -46], [30, -50], [72, -20], [96, 6], [60, 30], [0, 40], [-50, 26]].map(T), 8, true);
  let o = part(body, '#fbf4ea', { sh: '#e3d3c4', shPts: [[-60, 10], [90, 10], [90, 60], [-60, 60]].map(T), w: WT.mid });
  o += ink(catmull([[-40, -8], [-10, -26], [30, -24], [60, -4]].map(T), 6, false), WT.fine, { color: '#9b7f6a' }) + ink(catmull([[-30, 14], [10, 20], [56, 14]].map(T), 6, false), WT.fine, { color: '#9b7f6a' });
  o += ink(catmull([[20, 0], [30, -12], [44, -8], [46, 6], [32, 14], [14, 8], [10, -10], [26, -26], [52, -22], [62, 2]].map(T), 4, false), WT.fine * 1.4, { color: '#8a6a55', taper: [0.1, 0.3] });
  o += ink(catmull([[66, -20], [92, 4], [62, 30]].map(T), 6, false), WT.mid, { color: '#c98a6a' });
  const tip = catmull([[-60, -10], [-86, -16], [-96, 4], [-74, 18], [-50, 26]].map(T), 5, true);
  return o + part(tip, '#f4e6d6', { w: WT.fine + 0.5 }) + part(catmull([[60, -16], [78, -26], [84, -6], [66, 0]].map(T), 4, true), C.gold, { w: WT.fine });
}
function drawSeated(p) {
  const pr = { ...p, hs: 1.0 };
  // floating snacks: no hands touch them; they hover by magic with a soft glow and sparkles
  const floatItem = p.float ? magicFloat(p.float) : '';
  const L = p.armL, held = p.float ? null : (p.snack || (p.kulhad ? { kind: 'kulhad', x: p.kulhad[0], y: p.kulhad[1], ang: p.kulhad[2], s: p.kulhad[3], steam: p.kulhad[4] } : null));
  let heldBits = '';
  if (held) {
    // the grip point sits on the object; the forearm points from the elbow to it
    // fingers run ACROSS the object (perpendicular to its axis); the palm sits on the side the arm comes from
    const G = gripPoint(held), side = L.E[0] < G[0] ? 0 : Math.PI, fa = (held.ang || 0) + side;
    const gh = E.gripHand(G, fa, 1.2, GRIPW[held.kind] * (held.s || 1), C.skin, C.skinSh);
    // rubber-hose arm: one smooth tube from shoulder straight into the hand, no elbow corner, no wrist seam
    const mid = [(L.S[0] + gh.wrist[0]) / 2 + (L.E[0] - (L.S[0] + gh.wrist[0]) / 2) * 0.7, (L.S[1] + gh.wrist[1]) / 2 + (L.E[1] - (L.S[1] + gh.wrist[1]) / 2) * 0.7];
    const tip = rot([-30 * GRIPW[held.kind] / 70 * (held.s || 1), 20 * GRIPW[held.kind] / 70 * (held.s || 1)], fa).map((v, i) => v + G[i]);
    heldBits = E.limb([L.S, mid, gh.wrist, tip], 28, { col: C.skin, sh: C.skinSh }) + armband(L.S, mid, 34) + snack(held) + gh.front;
  }
  const armLeft = held ? '' : arm(L.S, L.E, L.W, { r: [36, 30, 25], handPose: 'rest', handAng: Math.atan2(L.W[1] - L.E[1], L.W[0] - L.E[0]) - Math.PI / 2, hs: 0.9, handScale: 0.85, skin: C.skin, skinSh: C.skinSh, gold: C.gold, line: C.skinLine, outward: -1 }) + armband(L.S, L.E, 36);
  // waist joint: p.lean bends the whole upper body (torso, garland, arms, head, hair) over the seated lap
  const up0 = p.lean ? `<g transform="rotate(${p.lean.toFixed(2)} 540 1185)">` : '', up1 = p.lean ? '</g>' : '';
  return up0 + back(pr) + up1 + lap(p) + up0 + torsoSeated(p) + vanamala(p) + (held ? '' : (p.noConch ? '' : conch(L.W[0] + 4, L.W[1] + 70, -0.35, 0.9)) + armLeft) +
    head(pr) + heldBits +
    arm(p.armR.S, p.armR.E, p.armR.W, { r: [38, 31, 26], handPose: p.armR.hand, handAng: p.armR.handAng, hs: 0.9, handScale: 0.85, skin: C.skin, skinSh: C.skinSh, gold: C.gold, line: C.skinLine, outward: 1 }) +
    armband(p.armR.S, p.armR.E, 38) +
    (p.chakra ? chakra(p.chakra) : '') + up1 + floatItem;
}
// where the hand closes on each object (object-local), and how wide the object is there
const GRIP = { kulhad: [-4, 22], icecream: [-2, 44], lollipop: [0, 76], popcorn: [-34, 34] };
const GRIPW = { kulhad: 50, icecream: 44, lollipop: 30, popcorn: 56 };
function gripPoint(h) { const q = rot(GRIP[h.kind].map(v => v * (h.s || 1)), h.ang || 0); return [h.x + q[0], h.y + q[1]]; }
function bracelet(W, a) { // gold bead row across the wrist
  let o = ''; const n = [-Math.sin(a), Math.cos(a)];
  for (let k = 0; k < 5; k++) { const u = -1 + k / 2, x = W[0] + n[0] * 28 * u, y = W[1] + n[1] * 28 * u, r = 9 + (k % 2) * 1.5;
    o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${C.gold}" stroke="${E.INK}" stroke-width="2.6"/><circle cx="${(x - 3).toFixed(1)}" cy="${(y - 3).toFixed(1)}" r="2.6" fill="#fff3c4"/>`; }
  return o;
}

function magicFloat(f) {
  let o = `<ellipse cx="${f.x}" cy="${f.y + 6}" rx="${70 * (f.s || 1)}" ry="${70 * (f.s || 1)}" fill="url(#halo)" opacity="0.55"/>`;
  o += snack(f);
  for (const [dx, dy, r] of [[-60, -40, 11], [62, -10, 9], [-40, 50, 8], [50, 56, 10]]) { const x = f.x + dx * (f.s || 1), y = f.y + dy * (f.s || 1);
    o += `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="#fff4b0" stroke="${E.INK}" stroke-width="2"/>`; }
  for (const k of (f.flying || [])) { // kernels in flight: each spins along its own arc
    const pc = []; for (let j = 0; j < 9; j++) { const a = Math.PI * 2 * j / 9 + k.spin, rr = 14 * k.sc * (j % 2 ? 0.78 : 1); pc.push([k.x + Math.cos(a) * rr, k.y + Math.sin(a) * rr]); }
    o += fill(catmull(pc, 2, true), '#eebc52') + inkLoop(catmull(pc, 2, true), WT.fine * 1.1) + `<circle cx="${(k.x + 3).toFixed(1)}" cy="${(k.y + 2).toFixed(1)}" r="${3 * k.sc}" fill="#f0c04a"/>`;
    o += ink([[k.x - k.vx * 0.05, k.y - k.vy * 0.05], [k.x - k.vx * 0.12, k.y - k.vy * 0.12]], 4, { color: '#fff6c8', taper: [0.4, 0.4], amp: 0 }); // speed trail
  }
  return o;
}
function snack({ kind, x, y, ang = 0, s = 1, bite = 0 }) {
  const T = q => rot([q[0] * s, q[1] * s], ang).map((v, i) => v + [x, y][i]);
  let o = '';
  if (kind === 'popcorn') { // premium multiplex tub as researched: wide white tub, gentle taper, gold caramel splash art,
                            // dark square badge with gold lettering, gold "FRESH FLAVORED POPCORN", heaped golden caramel popcorn
    const tub = E.catmull([[-80, -54], [-40, -54], [0, -54], [40, -54], [80, -54], [76, -20], [72, 12], [68, 42], [64, 70], [32, 71], [0, 71], [-32, 71], [-64, 70], [-68, 42], [-72, 12], [-76, -20]].map(T), 2, true);
    o += fill(tub, '#fbfaf6');
    let art = fill(catmull([[30, -60], [90, -60], [72, 80], [20, 80]].map(T), 2, true), '#000').replace('fill="#000"', 'fill="#000" opacity="0.07"');
    for (const [cx, cy, r] of [[-56, -26, 15], [52, -8, 13], [-46, 44, 12], [44, 50, 11]]) { // splashes of caramel corn + drips
      const bl = []; for (let j = 0; j < 12; j++) { const a2 = Math.PI * 2 * j / 12, rr = r * (j % 2 ? 0.7 : 1.05); bl.push([cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr]); }
      art += fill(catmull(bl.map(T), 2, true), '#e7b24a') + ink(catmull([[cx - 4, cy + r], [cx - 8, cy + r + 18]].map(T), 3, false), 5, { color: '#d79a2c', taper: [0.2, 0.6], amp: 0.3 });
    }
    art += ink(catmull([[-70, 64], [-30, 54], [10, 62], [50, 52], [70, 60]].map(T), 6, false), 7, { color: '#e7b24a', taper: [0.3, 0.3], amp: 0.4 });
    o += E.clipped(tub, art);
    const badge = catmull([[-20, -36], [20, -36], [20, 4], [-20, 4]].map(T), 1, true);
    o += fill(badge, '#2b1d16') + inkLoop(badge, WT.fine * 1.2);
    const bc = T([0, -14]), rotDeg = (ang * 180 / Math.PI).toFixed(1);
    o += `<text x="${bc[0].toFixed(1)}" y="${(bc[1] + 7 * s).toFixed(1)}" transform="rotate(${rotDeg} ${bc[0].toFixed(1)} ${bc[1].toFixed(1)})" font-family="Georgia, serif" font-weight="700" font-size="${(19 * s).toFixed(1)}" text-anchor="middle" fill="#e2b75a">TT</text>`;
    for (const [i, word] of ['FRESH', 'FLAVORED', 'POPCORN'].entries()) { const q = T([0, 18 + i * 13]);
      o += `<text x="${q[0].toFixed(1)}" y="${q[1].toFixed(1)}" transform="rotate(${rotDeg} ${q[0].toFixed(1)} ${q[1].toFixed(1)})" font-family="Arial, sans-serif" font-weight="700" font-size="${(10.5 * s).toFixed(1)}" letter-spacing="0.5" text-anchor="middle" fill="#c99a3c">${word}</text>`; }
    o += inkLoop(tub, WT.mid);
    const rim = catmull([[-84, -60], [84, -60], [82, -50], [-82, -50]].map(T), 3, true);
    o += part(rim, '#fbfaf6', { w: WT.mid });
    for (const [kx, ky, r] of [[-66, -62, 16], [-40, -72, 18], [-14, -78, 18], [14, -78, 18], [40, -72, 17], [66, -62, 15], [-52, -88, 15], [-26, -100, 17], [2, -106, 17], [28, -98, 16], [52, -86, 14], [-36, -118, 14], [-8, -126, 15], [20, -120, 14], [-20, -142, 12], [8, -146, 12]]) {
      const pc = []; for (let j = 0; j < 9; j++) { const a2 = Math.PI * 2 * j / 9 + kx, rr = r * (j % 2 ? 0.76 : 1); pc.push([kx + Math.cos(a2) * rr, ky + Math.sin(a2) * rr]); }
      const pts = catmull(pc.map(T), 2, true), col = (Math.abs(kx + ky) % 3 === 0) ? '#f6d27a' : '#eebc52';
      o += fill(pts, col) + ink(pts.slice(0, -2), WT.fine * 1.1, { taper: [0.2, 0.2] }) + `<circle cx="${T([kx - 4, ky - 4])[0].toFixed(1)}" cy="${T([kx - 4, ky - 4])[1].toFixed(1)}" r="${3.5 * s}" fill="#fff3c8"/>`;
    }
  } else if (kind === 'kulhad') { return kulhad(x, y, ang, s, arguments[0].steam || 0);
  } else if (kind === 'lollipop') { // swirl candy on a stick
    o += ink([[0, 0], [0, 120]].map(T), 9, { color: '#ffffff', taper: [0.02, 0.02] }) + ink([[4, 0], [4, 120]].map(T), 2.5, { color: '#bbb', taper: [0.02, 0.02] });
    const R = 46, c = T([0, -40]); o += `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${R * s}" fill="#ffe14d"/>`;
    const sw = []; for (let j = 0; j < 60; j++) { const a = j * 0.42, rr = R * s * (j / 60); sw.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); }
    o += ink(sw, 9 * s, { color: '#ff4f8b', taper: [0.1, 0.02], amp: 0.2 }) + ink(catmull([[0, -R], [R, 0], [0, R], [-R, 0]].map(([a, b2]) => [a, b2 - 40]).map(T), 8, true), WT.mid, { taper: [0.05, 0.05] });
    if (bite) o += fill(catmull([[R * 0.4, -40 - R * 0.9], [R * 1.1, -40 - R * 0.2], [R * 0.6, -40 - R * 0.4]].map(T), 3, true), '#a8d8ff');
  } else if (kind === 'icecream') { // waffle cone, two scoops, a cherry and a drip
    const cone = catmull([[-40, -10], [40, -10], [0, 110]].map(T), 2, true);
    o += part(cone, '#e8a85a', { sh: '#c07f36', shPts: [[0, -20], [60, -20], [0, 120]].map(T), w: WT.mid });
    for (let k = -2; k <= 2; k++) o += E.clipped(cone, ink([[k * 20 - 40, -10], [k * 20 + 40, 110]].map(T), 3, { color: '#a96a2a', amp: 0.2 }) + ink([[k * 20 + 40, -10], [k * 20 - 40, 110]].map(T), 3, { color: '#a96a2a', amp: 0.2 }));
    for (const [cy2, col, sh2] of [[-30, '#ffb7d0', '#f08cb0'], [-80, '#fff2d6', '#e8d2a8']]) {
      const sc = catmull([[-46, cy2 + 16], [-48, cy2 - 18], [-20, cy2 - 40], [20, cy2 - 40], [48, cy2 - 18], [46, cy2 + 16], [24, cy2 + 26], [0, cy2 + 14], [-24, cy2 + 26]].map(T), 4, true);
      o += part(sc, col, { sh: sh2, shPts: [[10, cy2 - 40], [60, cy2 - 40], [60, cy2 + 30], [10, cy2 + 30]].map(T), w: WT.mid });
    }
    const drip = catmull([[30, -16], [44, -14], [42, 30], [36, 36], [30, 26]].map(T), 4, true); o += fill(drip, '#ffb7d0') + inkLoop(drip, WT.fine * 1.2);
    const ch = T([4, -128]); o += `<circle cx="${ch[0].toFixed(1)}" cy="${ch[1].toFixed(1)}" r="${13 * s}" fill="#e3203a" stroke="${E.INK}" stroke-width="3"/>` + ink([T([4, -140]), T([16, -166])], 3, { color: '#3a7a2a' });
    for (const [sx, sy, col] of [[-24, -96, '#4fc3f7'], [18, -100, '#ff7043'], [-6, -60, '#66bb6a'], [24, -50, '#ab47bc']]) { const q = T([sx, sy]); o += `<rect x="${q[0] - 6}" y="${q[1] - 2}" width="12" height="4" rx="2" fill="${col}" transform="rotate(${sx * 2} ${q[0]} ${q[1]})"/>`; }
  }
  return o;
}
function kulhad(x, y, ang, s, steam = 0) {
  const T = q => rot([q[0] * s, q[1] * s], ang).map((v, i) => v + [x, y][i]);
  const cup = catmull([[-34, -40], [34, -40], [26, 36], [-26, 36]].map(T), 4, true);
  let o = part(cup, '#c0643a', { sh: '#93451f', shPts: [[8, -50], [50, -50], [40, 50], [4, 50]].map(T), w: WT.mid });
  o += fill(catmull([[-32, -40], [32, -40], [30, -30], [-30, -30]].map(T), 3, true), '#d8a06a') + ink([[-34, -40], [34, -40]].map(T), WT.mid, { taper: [0.1, 0.1] });
  for (let k = 0; k < 3 && steam; k++) o += ink(catmull([[-14 + k * 14, -50], [-20 + k * 14, -74], [-8 + k * 14, -96], [-16 + k * 14, -118]].map(T), 5, false), 5, { color: '#ffffff', taper: [0.3, 0.6], amp: 2.2 });
  return o;
}
function lotus(x, y, s) {
  let o = '';
  for (const [a, r, col] of [[-1.1, 1, '#f4a6c4'], [1.1, 1, '#f4a6c4'], [-0.55, 1.1, '#f78fb5'], [0.55, 1.1, '#f78fb5'], [0, 1.2, '#ff7fae']]) {
    const pt = catmull([[0, 0], [12, -14], [0, -44 * r], [-12, -14]].map(q => rot([q[0] * s, q[1] * s], a)).map(([a2, b2]) => [x + a2, y + b2]), 5, true);
    o += fill(pt, col) + inkLoop(pt, WT.fine * 1.3);
  }
  return o + `<circle cx="${x}" cy="${y - 4 * s}" r="${7 * s}" fill="#ffd34d" stroke="${E.INK}" stroke-width="2"/>`;
}
function plasticChair(sway = 0) { // red monobloc chair: slotted back, seat, splayed legs
  const R = '#d8323c', RS = '#a81f2b';
  const backr = catmull([[330, 820], [750, 820], [770, 1180], [310, 1180]], 4, true);
  let o = part(backr, R, { sh: RS, shPts: [[600, 830], [740, 830], [740, 1200], [620, 1200]], w: WT.sil * 0.9 });
  for (let k = 0; k < 5; k++) o += part(catmull([[380 + k * 72, 870], [410 + k * 72, 870], [410 + k * 72, 1040], [380 + k * 72, 1040]], 3, true), RS, { w: WT.fine * 1.4 });
  for (const [x0, x1] of [[400, 360], [680, 720]]) o += tube([[x0, 1220], [x1, 1600]], [16, 14], { col: R, sh: RS, capEnd: true });
  for (const sgn of [-1, 1]) { // armrests curving down to the seat
    const ar = catmull([[540 + sgn * 210, 1010], [540 + sgn * 300, 1000], [540 + sgn * 318, 1040], [540 + sgn * 300, 1190], [540 + sgn * 268, 1190], [540 + sgn * 276, 1050], [540 + sgn * 210, 1046]], 5, true);
    o += part(ar, R, { sh: RS, shPts: ar.map(([x, y]) => [x + sgn * 10, y + 14]), w: WT.mid * 1.3 });
  }
  const seat = catmull([[320, 1180], [760, 1180], [776, 1236], [304, 1236]], 4, true);
  return o + part(seat, R, { sh: RS, shPts: [[336, 1214], [744, 1214], [744, 1240], [336, 1240]], w: WT.sil * 0.9 });
}
// four arms: back pair (chakra, conch) drawn behind the body; front pair (kulhad, lotus / talking) in front
function drawChair(p) {
  const pr = { ...p, hs: 1.0 };
  const ah = (A, pose) => Math.atan2(A.W[1] - A.E[1], A.W[0] - A.E[0]) + (pose === 'rest' || pose === 'relax' ? -Math.PI / 2 : Math.PI / 2);
  const armO = (A, out) => arm(A.S, A.E, A.W, { r: [34, 28, 24], handPose: A.hand, handAng: A.ang ?? ah(A, A.hand), hs: 0.78, skin: C.skin, skinSh: C.skinSh, gold: C.gold, line: C.skinLine, outward: out });
  let o = plasticChair();
  o += armO(p.backL, -1) + armO(p.backR, 1);
  if (p.chakra) o += chakra(p.chakra);
  o += conch(p.backR.W[0] + 10, p.backR.W[1] - 52, -0.6, 1.0);
  o += back(pr);
  // short chibi legs dangling from the seat, dhoti over the thighs; feet swing (p.swing)
  for (const [kx, dir, ph] of [[478, -1, 0], [602, 1, 1.4]]) {
    const sw = Math.sin((p.t || 0) * 4 + ph) * (p.swing || 0);
    const knee = [kx, 1236], ankle = [kx + dir * 6 + sw * 26, 1400];
    o += tube([knee, ankle], [34, 28], { col: C.skin, sh: C.skinSh, capStart: true, capEnd: false });
    const foot = catmull([[-30, -10], [22, -14], [64, 4], [60, 26], [-30, 26]].map(([x, y]) => [ankle[0] + x * dir, ankle[1] + y]), 5, true);
    o += part(foot, C.skin, { sh: C.skinSh, shPts: foot.map(([x, y]) => [x, y + 12]), w: WT.mid }) + `<rect x="${ankle[0] - 28}" y="${ankle[1] - 18}" width="56" height="10" rx="5" fill="${C.gold}" stroke="${E.INK}" stroke-width="2.5"/>`;
  }
  const lapS = catmull([[360, 1120], [540, 1108], [720, 1120], [748, 1210], [690, 1262], [540, 1250], [390, 1262], [332, 1210]], 8, true);
  o += part(lapS, C.cloth, { sh: C.clothSh, shPts: [[560, 1100], [760, 1100], [760, 1280], [560, 1280]], w: WT.sil });
  o += [[[470, 1130], [440, 1250]], [[540, 1128], [540, 1252]], [[610, 1130], [640, 1250]]].map(f => ink(catmull(f, 4, false), WT.fine * 1.5, { color: FOLD, taper: [0.3, 0.3] })).join('');
  o += torsoSeated(p) + vanamala(p);
  o += head(pr);
  o += armO(p.frontL, -1);
  if (p.kulhad) o += kulhad(...p.kulhad);
  o += armO(p.frontR, 1);
  if (p.lotus) o += lotus(...p.lotus);
  return o;
}
module.exports = { C, HS, draw, drawSeated, drawChair, magicFloat };
