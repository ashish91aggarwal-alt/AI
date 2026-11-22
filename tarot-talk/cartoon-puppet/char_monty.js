// Monty: mid-20s Indian guy, chibi, maroon kurta with gold buttons + zigzag hem, cream pyjama, brown chappals, steel kada.
// Everything moves through joints: head on the neck, arms (shoulder/elbow/wrist), legs (hip/knee/ankle) with feet planted.
const E = require('./engine');
const { WT, catmull, mirror, ink, inkLoop, fill, clipped, part, tube, arm, mouth, rot, clamp, lerp } = E;

const C = {
  skin: '#efbf98', skinSh: '#d69a73', skinLine: '#9a5a3c', blush: '#f2788c',
  hair: '#261922', hairHi: '#4e3d52', white: '#fbfaf4', iris: '#1a100e',
  kurta: '#8c2038', kurtaSh: '#62142a', gold: '#f0bf3a', goldSh: '#c4891a',
  pyj: '#efe3c6', pyjSh: '#cdb98f', chappal: '#7a4a2a', chappalSh: '#5a341c', steel: '#c9d0da',
  mouth: '#5a1626', tongue: '#e86a80', teeth: '#fffaf0', tilak: '#d22f48', sweat: '#9fd8ff', palmMid: '#e9958f',
};

// ---------- head (local: face centre at 0,0) ----------
function head(p) {
  const g = [];
  const face = catmull(mirror([[0, -210], [150, -186], [214, -90], [226, 20], [204, 120], [130, 190], [0, 214]]), 10, true);
  // back hair mass
  const hb = catmull(mirror([[0, -250], [170, -226], [236, -120], [240, 0], [214, 60]]).concat([]), 8, true);
  g.push(fill(hb, C.hair) + inkLoop(hb, WT.sil));
  for (const s of [-1, 1]) { const ear = catmull([[s * 208, -10], [s * 250, -2], [s * 254, 62], [s * 214, 92]], 6, true); g.push(part(ear, s > 0 ? C.skinSh : C.skin, { w: WT.mid })); g.push(ink(catmull([[s * 222, 20], [s * 236, 40], [s * 228, 64]], 4, false), WT.fine * 1.4, { color: C.skinLine })); }
  g.push(fill(face, C.skin) + clipped(face, fill(catmull([[120, -240], [190, -60], [180, 100], [60, 240], [320, 260], [320, -240]], 8, true), C.skinSh) +
    [-1, 1].map(k => `<ellipse cx="${k * 132}" cy="104" rx="${34 + (p.blush || 0) * 8}" ry="${17 + (p.blush || 0) * 4}" fill="${C.blush}" opacity="${0.35 + (p.blush || 0) * 0.25}"/>` +
      [-14, 0, 14].map(dx => `<line x1="${k * 132 + dx - 6}" y1="112" x2="${k * 132 + dx + 6}" y2="96" stroke="#d24a64" stroke-width="3.4" stroke-linecap="round" opacity="${0.5 + (p.blush || 0) * 0.3}"/>`).join('')).join('')));
  g.push(ink(face.slice(Math.floor(face.length * 0.06), Math.floor(face.length * 0.6)), WT.sil * 1.1, { prof: u => 0.35 + 0.65 * Math.sin(Math.PI * u), taper: [0.3, 0.2] }));
  g.push(ink(face.slice(Math.floor(face.length * 0.55)).concat(face.slice(0, Math.floor(face.length * 0.1))), WT.sil * 0.8, { taper: [0.2, 0.35] }));
  // natural short hair: soft volume, side-swept fringe, a few strands. It only stands up in shock (p.spike).
  const sp = p.spike || 0;
  if (sp > 0.02) { // hair standing on end, grows up from behind the normal hair
    const up = [[-210, -100]]; [[-190, -170, -230, -250], [-120, -220, -140, -320], [-40, -246, -40, -350], [40, -248, 52, -352], [120, -226, 150, -318], [190, -170, 240, -240]]
      .forEach(([bx, by, tx, ty]) => { up.push([bx, by]); up.push([bx + (tx - bx) * sp, by + (ty - by) * sp]); });
    up.push([210, -100]); const us = catmull(up, 3, true); g.push(fill(us, C.hair) + inkLoop(us, WT.mid));
  }
  // cute hair: puffy rounded volume (soft lobes), side-swept comma-shaped fringe clumps, a bouncy ahoge curl, glossy shine arc
  const puff = catmull([[-236, -20], [-250, -110], [-216, -200], [-150, -262], [-60, -290], [30, -294], [120, -276], [196, -228], [240, -150], [248, -60], [236, -10],
    [214, -80], [196, -130], [150, -150], [-150, -150], [-200, -120], [-218, -70]], 7, true);
  g.push(fill(puff, C.hair) + inkLoop(puff, WT.mid * 1.1));
  // ahoge: a single springy curl on top that lags the head (p.ahoge = sway)
  const aw = p.ahoge || 0;
  g.push(ink(catmull([[10, -286], [24 + aw * 18, -330], [60 + aw * 26, -350], [70 + aw * 22, -326], [50 + aw * 14, -316]], 6, false), 14, { prof: u => 0.9 - 0.75 * u, taper: [0.05, 0.6] }));
  // fringe clumps sweep toward the viewer's left, each a rounded comma
  for (const [x0, y0, x1, y1, w] of [[170, -222, 180, -104, 46], [110, -250, 66, -126, 60], [30, -262, -46, -128, 62], [-60, -254, -134, -124, 62], [-140, -230, -206, -108, 50]]) {
    const cl = catmull([[x0 - w * 0.6, y0], [x0 + w * 0.6, y0 + 6], [x1 + w * 0.42, y1 - 18], [x1 + w * 0.08, y1 + 6], [x1 - w * 0.16, y1 - 4], [x1 - w * 0.36, y1 - 40]], 6, true);
    g.push(fill(cl, C.hair) + ink(cl.slice(Math.floor(cl.length * 0.25), Math.floor(cl.length * 0.95)), WT.mid, { taper: [0.3, 0.3] }));
  }
  // anime shine: a soft arc of short glossy dashes across the crown
  for (const [x, y, len] of [[-130, -238, 30], [-70, -262, 38], [0, -270, 40], [70, -262, 34], [128, -240, 26]]) g.push(ink([[x - len / 2, y + Math.abs(x) * 0.04], [x + len / 2, y - 4 + Math.abs(x) * 0.04]], 9, { color: '#6a5a78', taper: [0.4, 0.4], amp: 0.3 }));
  g.push(ink([[0, -112], [1, -86], [0, -62]], 13, { color: C.tilak, prof: u => 0.55 + 0.45 * Math.sin(Math.PI * u), taper: [0.35, 0.45], amp: 0.5 }));
  g.push(`<ellipse cx="-3" cy="-92" rx="3.4" ry="5.5" fill="#fff6e0" transform="rotate(-15 -3 -92)"/><ellipse cx="4" cy="-78" rx="3" ry="5" fill="#fff6e0" transform="rotate(20 4 -78)"/>`);
  // ---- expressive eyes: white, iris ring, pupil, highlights, upper lid (with tilt), lower lid, tear pool, glint ----
  const pop = 1 + (p.pop || 0) * 0.28;
  const e = { irisR: 32, pupil: 15, iris: '#5b3a22', lid: 0, lidTilt: 0, lower: 0, watery: 0, shake: 0, hl: 1, glint: 0, ...(p.eye || {}) };
  const seed = E.S.boil * 7.31; // per-drawing jitter for trembling pupils
  for (const s of [-1, 1]) {
    const cx = s * 90, cy = 14, rx = 56 * pop, ry = 62 * pop;
    const ey = catmull([[cx - rx, cy], [cx - rx * 0.7, cy - ry * 0.72], [cx, cy - ry], [cx + rx * 0.7, cy - ry * 0.72], [cx + rx, cy], [cx + rx * 0.7, cy + ry * 0.72], [cx, cy + ry], [cx - rx * 0.7, cy + ry * 0.72]], 6, true);
    const jx = e.shake * 3.2 * Math.sin(seed + s * 1.7), jy = e.shake * 2.4 * Math.cos(seed * 1.3 + s);
    const px = cx + (p.lookX || 0) + jx, py = cy + 6 + (p.lookY || 0) + jy;
    let inner = '';
    if (e.irisR > 0) inner += `<circle cx="${px}" cy="${py}" r="${e.irisR}" fill="${e.iris}"/><circle cx="${px}" cy="${py}" r="${e.irisR}" fill="none" stroke="#1a100e" stroke-width="3"/>` +
      `<path d="M${px - e.irisR * 0.8} ${py + e.irisR * 0.3} A${e.irisR} ${e.irisR} 0 0 0 ${px + e.irisR * 0.8} ${py + e.irisR * 0.3}" fill="none" stroke="${e.irisHi || '#8a5a32'}" stroke-width="5" opacity="0.8"/>`;
    inner += `<circle cx="${px}" cy="${py}" r="${e.pupil}" fill="${C.iris}"/>`;
    const H = [[0.42, -0.42, 0.42], [-0.35, 0.38, 0.2], [0.1, 0.55, 0.13]].slice(0, e.hl);
    for (const [hx, hy, hr] of H) inner += `<circle cx="${px + hx * (e.irisR || e.pupil * 1.6)}" cy="${py + hy * (e.irisR || e.pupil * 1.6)}" r="${Math.max(2.5, hr * (e.irisR || e.pupil * 1.6))}" fill="#fff"/>`;
    if (e.watery) { // tear pool shining along the lower lid + glossy wobble line
      inner += `<path d="M${cx - rx} ${cy + ry * 0.45} Q${cx} ${cy + ry * (0.75 + 0.1 * Math.sin(seed))} ${cx + rx} ${cy + ry * 0.45} L${cx + rx} ${cy + ry + 6} L${cx - rx} ${cy + ry + 6} Z" fill="#9fd4ff" opacity="${0.55 * e.watery}"/>` +
        `<path d="M${cx - rx * 0.6} ${cy + ry * 0.58} Q${cx} ${cy + ry * (0.8 + 0.08 * Math.sin(seed * 1.7))} ${cx + rx * 0.6} ${cy + ry * 0.58}" fill="none" stroke="#fff" stroke-width="4" opacity="${0.9 * e.watery}"/>`;
    }
    // upper lid: closes by e.lid, tilted toward the nose by e.lidTilt (evil / angry)
    const t1 = e.lidTilt * s; // positive tilt = inner corner lower
    const ulY = x => cy - ry + 2 * ry * e.lid + t1 * (x - cx) * -0.45;
    if (e.lid > 0.02 || Math.abs(e.lidTilt) > 0.02) {
      const top = [[cx - rx - 6, ulY(cx - rx - 6)], [cx, ulY(cx) - 6], [cx + rx + 6, ulY(cx + rx + 6)]];
      inner += `<path d="${E.poly(top.concat([[cx + rx + 6, cy - ry - 40], [cx - rx - 6, cy - ry - 40]]))}" fill="${e.lidCol || C.skin}"/>`;
    }
    if (e.lower > 0.02) { // lower lid pushes up (squint / smug / evil)
      const ly = cy + ry - 2 * ry * e.lower * 0.6;
      inner += `<path d="M${cx - rx - 6} ${cy + ry + 10} L${cx - rx - 6} ${ly + 10} Q${cx} ${ly - 14} ${cx + rx + 6} ${ly + 10} L${cx + rx + 6} ${cy + ry + 10} Z" fill="${C.skin}"/>`;
      inner += `<path d="M${cx - rx * 0.8} ${ly + 6} Q${cx} ${ly - 12} ${cx + rx * 0.8} ${ly + 6}" fill="none" stroke="${C.skinLine}" stroke-width="3.5"/>`;
    }
    if (e.mode === 'blink') { g.push(ink(catmull([[cx - rx * 0.85, cy - 4], [cx, cy + ry * 0.3], [cx + rx * 0.85, cy - 4]], 6, false), 12, { taper: [0.3, 0.3] }) + ink([[cx + s * rx * 0.8, cy - 6], [cx + s * rx * 1.05, cy - 18]], 6, { taper: [0.1, 0.8] })); }
    else if (e.mode === 'happy') { g.push(ink(catmull([[cx - rx * 0.8, cy + 10], [cx, cy - ry * 0.55], [cx + rx * 0.8, cy + 10]], 6, false), 13, { taper: [0.3, 0.3] })); }
    else if (e.mode === 'squeeze') { g.push(ink([[cx - s * rx * 0.75, cy - ry * 0.45], [cx + s * rx * 0.55, cy], [cx - s * rx * 0.75, cy + ry * 0.45]], 12, { taper: [0.3, 0.3] })); }
    else g.push(fill(ey, C.white) + clipped(ey, inner) + inkLoop(ey, WT.mid * 0.85));
    if (!e.mode && (e.lid > 0.02 || Math.abs(e.lidTilt) > 0.02)) g.push(ink([[cx - rx - 4, ulY(cx - rx - 4)], [cx, ulY(cx) - 6], [cx + rx + 4, ulY(cx + rx + 4)]], WT.mid * 1.5, { taper: [0.15, 0.15] }));
    if (e.glint) { const gx = px + e.irisR * 0.5, gy = py - e.irisR * 0.5, r = 12 * e.glint; // evil sparkle star
      g.push(`<path d="M${gx} ${gy - r} L${gx + r * 0.25} ${gy - r * 0.25} L${gx + r} ${gy} L${gx + r * 0.25} ${gy + r * 0.25} L${gx} ${gy + r} L${gx - r * 0.25} ${gy + r * 0.25} L${gx - r} ${gy} L${gx - r * 0.25} ${gy - r * 0.25} Z" fill="#fff"/>`); }
    if (e.watery > 0.5) g.push(ink(catmull([[cx - rx * 0.7, cy + ry + 8], [cx, cy + ry + 16], [cx + rx * 0.7, cy + ry + 8]], 4, false), WT.fine * 1.4, { color: '#4aa3e8' }));
    if (e.bags) g.push(ink(catmull([[cx - rx * 0.6, cy + ry + 14], [cx, cy + ry + 24], [cx + rx * 0.6, cy + ry + 14]], 4, false), WT.fine * 1.2, { color: C.skinLine }));
    if (e.shake > 0.3) for (const k of [-1, 1]) g.push(ink([[cx + k * (rx + 18), cy - 20], [cx + k * (rx + 26), cy], [cx + k * (rx + 18), cy + 20]], WT.fine * 1.2, { taper: [0.3, 0.3] })); // tremble marks
    const bt = p.brow || 0, by = cy - ry - 30 - (p.browUp || 0) * 20;
    g.push(ink(catmull([[cx - s * 46, by - bt * 18], [cx, by - 10], [cx + s * 46, by + bt * 14]], 6, false), 11, { prof: u => 0.4 + 0.6 * Math.sin(Math.PI * u), taper: [0.25, 0.4] }));
  }
  if (p.evilShade) for (const s of [-1, 1]) g.push(`<ellipse cx="${s * 92}" cy="-30" rx="86" ry="70" fill="#3a0d1c" opacity="${0.12 * p.evilShade}"/>`); // soft dark socket around each eye
  g.push(ink(catmull([[-6, 56], [-14, 78], [6, 80]], 5, false), WT.fine * 1.6, { color: C.skinLine, taper: [0.3, 0.3] }));
  const mx = 4, my = 132, M = p.mouthShape;
  const mline = (pts, w = WT.mid * 1.2) => ink(catmull(pts.map(([x, y]) => [mx + x, my + y]), 6, false), w, { taper: [0.2, 0.2] });
  if (M === 'cat') { // smug :3 with a tiny fang
    g.push(mline([[-36, -4], [-18, 8], [0, -2], [18, 8], [36, -4]]));
    const f = catmull([[10, 4], [20, 6], [15, 20]].map(([x, y]) => [mx + x, my + y]), 3, true); g.push(fill(f, C.teeth) + inkLoop(f, WT.fine * 1.2));
  } else if (M === 'wavy') { // nervous wobble mouth, with chattering teeth showing when p.chatter
    if (p.chatter) { const m = catmull([[-34, -6], [-12, -12], [12, -6], [34, -12], [30, 12], [-30, 14]].map(([x, y]) => [mx + x, my + y]), 5, true); g.push(fill(m, C.teeth) + inkLoop(m, WT.mid) + mline([[-30, 2], [30, 0]], WT.fine)); }
    else g.push(mline([[-38, 4], [-24, -6], [-10, 4], [4, -6], [18, 4], [32, -6], [42, 2]]));
  } else if (M === 'o') { const m = catmull([[0, -10], [12, 0], [0, 14], [-12, 0]].map(([x, y]) => [mx + x, my + y]), 5, true); g.push(fill(m, C.mouth) + inkLoop(m, WT.mid));
  } else if (M === 'pout') { g.push(mline([[-14, 4], [0, -6], [14, 4]]) + mline([[-8, 12], [8, 12]], WT.fine * 1.2));
  } else if (M === 'grinBig') { // happy-evil open grin with a fang and tongue
    const m = catmull([[-62, -6], [0, 6], [62, -10], [44, 36], [0, 50], [-44, 36]].map(([x, y]) => [mx + x, my + y]), 6, true);
    g.push(fill(m, C.mouth) + clipped(m, fill(catmull([[-30, 30], [0, 18], [30, 30], [0, 54]].map(([x, y]) => [mx + x, my + y]), 5, true), C.tongue)) + inkLoop(m, WT.mid));
    for (const fx of [-30, 26]) { const f = catmull([[fx - 7, -2], [fx + 7, -3], [fx, 14]].map(([x, y]) => [mx + x, my + y]), 3, true); g.push(fill(f, C.teeth) + inkLoop(f, WT.fine)); }
  } else if (M === 'smileBig') { // big happy open smile
    const m = catmull([[-50, -6], [0, -2], [50, -6], [34, 34], [0, 46], [-34, 34]].map(([x, y]) => [mx + x, my + y]), 6, true);
    g.push(fill(m, C.mouth) + clipped(m, fill(catmull([[-26, 32], [0, 18], [26, 32], [0, 50]].map(([x, y]) => [mx + x, my + y]), 5, true), C.tongue) + fill(catmull([[-50, -10], [50, -10], [50, 6], [-50, 6]].map(([x, y]) => [mx + x, my + y]), 3, true), C.teeth)) + inkLoop(m, WT.mid));
  } else if (M === 'wail') { // over-the-top crying mouth, wobbly edge
    const m = catmull([[-46, -10], [-16, -16], [16, -10], [46, -16], [40, 50], [0, 62], [-40, 50]].map(([x, y]) => [mx + x, my + y + 6]), 6, true);
    g.push(fill(m, C.mouth) + clipped(m, fill(catmull([[-28, 46], [0, 30], [28, 46], [0, 64]].map(([x, y]) => [mx + x, my + y + 6]), 5, true), C.tongue)) + inkLoop(m, WT.mid));
  } else if (M === 'nervous') { // flattering too-wide smile with teeth
    const m = catmull([[-56, -2], [0, 10], [56, -4], [44, 18], [0, 26], [-44, 18]].map(([x, y]) => [mx + x, my + y]), 6, true);
    g.push(fill(m, C.teeth) + inkLoop(m, WT.mid) + mline([[-44, 10], [0, 16], [44, 9]], WT.fine) + mline([[-60, -8], [-54, 2]], WT.fine) + mline([[60, -10], [54, 0]], WT.fine));
  } else g.push(mouth(p.viseme || 'X', mx, my, 0.9, C));
  // manpu: cartoon emotion symbols
  const fx = p.fx || [];
  if (fx.includes('gloom')) for (let k = 0; k < 6; k++) g.push(ink([[-120 + k * 44, -150], [-120 + k * 44, -60 - (k % 2) * 20]], 7, { color: '#6b7fd6', taper: [0.1, 0.6], amp: 0.6 }));
  if (fx.includes('vein')) { const vx = 150, vy = -160; g.push(['M-14 -4 Q-4 -4 -4 -14', 'M4 -14 Q4 -4 14 -4', 'M14 4 Q4 4 4 14', 'M-4 14 Q-4 4 -14 4'].map(d => `<path d="${d}" transform="translate(${vx} ${vy}) scale(1.8)" fill="none" stroke="#d9233a" stroke-width="3.2" stroke-linecap="round"/>`).join('')); }
  if (fx.includes('sparkle')) for (const [x, y, r] of [[-250, -120, 22], [250, -60, 18], [230, -210, 14], [-220, 60, 12]]) g.push(`<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="#ffe680" stroke="${E.INK}" stroke-width="2.5"/>`);
  if (fx.includes('shockLines')) for (let k = 0; k < 7; k++) { const a = -Math.PI * (0.15 + 0.7 * k / 6); g.push(ink([[Math.cos(a) * 300, -40 + Math.sin(a) * 300], [Math.cos(a) * 360, -40 + Math.sin(a) * 360]], 9, { taper: [0.5, 0.1] })); }
  if (p.sweat) { const sx = 196, sy = -120 + p.sweat * 30; const d = catmull([[sx, sy - 26], [sx + 14, sy], [sx, sy + 14], [sx - 14, sy]], 5, true); g.push(fill(d, C.sweat) + inkLoop(d, WT.fine * 1.5)); }
  if (p.tears) for (const s of [-1, 1]) { const st = catmull([[s * 70, 40], [s * 92, 90], [s * 110, 150 + 40 * p.tears], [s * 130, 210 + 60 * p.tears]], 6, false); g.push(ink(st, 30, { color: '#8fd3ff', prof: u => 0.6 + 0.4 * u, taper: [0.05, 0.15], amp: 1.2 }) + ink(st.map(([x, y]) => [x - s * 4, y]), 6, { color: '#fff', taper: [0.2, 0.4], amp: 1.2 })); }
  return `<g transform="translate(${p.head[0].toFixed(1)} ${p.head[1].toFixed(1)}) rotate(${(p.tilt || 0).toFixed(2)}) scale(${p.hs || 1})">${g.join('')}</g>`;
}

// ---------- body ----------
function legs(p) {
  let o = '';
  for (const L of [p.legL, p.legR]) {
    o += E.limb([L.hip, L.knee, L.ankle], 38, { col: C.pyj, sh: C.pyjSh });
    // chappal + foot, planted
    const [ax, ay] = L.ankle, dir = L.dir;
    const sole = catmull([[ax - 46 * dir, ay + 20], [ax + 76 * dir, ay + 18], [ax + 92 * dir, ay + 32], [ax + 70 * dir, ay + 44], [ax - 44 * dir, ay + 44]], 5, true);
    o += part(sole, C.chappal, { sh: C.chappalSh, shPts: sole.map(([x, y]) => [x, y + 10]), w: WT.mid });
    const foot = catmull([[ax - 32 * dir, ay - 8], [ax + 30 * dir, ay - 2], [ax + 74 * dir, ay + 14], [ax + 76 * dir, ay + 26], [ax - 36 * dir, ay + 26]], 5, true);
    o += part(foot, C.skin, { sh: C.skinSh, shPts: foot.map(([x, y]) => [x, y + 12]), w: WT.mid });
    o += ink([[ax + 10 * dir, ay + 4], [ax + 30 * dir, ay + 24]], 8, { color: C.chappal, taper: [0.1, 0.1] }); // strap
    o += ink(catmull([[ax - 40, ay - 26], [ax, ay - 20], [ax + 40, ay - 26]], 4, false), WT.mid); // pyjama hem
  }
  return o;
}
function kurta(p) {
  const b = p.breath || 0, sh = p.shiver || 0;
  const T = ([x, y]) => [x + sh * Math.sin(y * 0.05) * 0.6, y - b * 3 * (1340 - y) / 450];
  const body = catmull([[470, 880], [400, 905], [370, 980], [360, 1120], [348, 1300], [366, 1350], [714, 1350], [732, 1300], [720, 1120], [710, 980], [680, 905], [610, 880]].map(T), 8, true);
  let o = fill(body, C.kurta) + clipped(body, fill(catmull([[620, 880], [740, 900], [760, 1360], [640, 1360], [660, 1100]].map(T), 6, true), C.kurtaSh));
  o += inkLoop(body, WT.sil);
  // zigzag gold hem
  const zz = []; for (let k = 0; k <= 18; k++) zz.push(T([366 + k * 19.3, k % 2 ? 1318 : 1336]));
  o += ink(zz, 6, { color: C.gold, taper: [0.02, 0.02], amp: 0.4 }) + ink(zz.map(([x, y]) => [x, y - 14]), 3, { color: C.goldSh, taper: [0.02, 0.02], amp: 0.4 });
  // placket + gold buttons
  o += ink(catmull([[540, 900], [542, 1010], [540, 1100]].map(T), 5, false), WT.mid);
  for (const y of [940, 990, 1040]) { const q = T([552, y]); o += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="8" fill="${C.gold}" stroke="${E.INK}" stroke-width="2.6"/>`; }
  // collar
  const col = catmull([[470, 880], [540, 912], [610, 880], [600, 868], [540, 892], [480, 868]].map(T), 5, true);
  o += part(col, C.kurtaSh, { w: WT.mid });
  return o;
}
function arms(p) {
  let o = '';
  for (const [A, out] of [[p.armL, -1], [p.armR, 1]]) {
    o += arm(A.S, A.E, A.W, { r: [30, 26, 22], handPose: A.hand, handAng: A.handAng, hs: A.hs || 0.78, skin: C.skin, skinSh: C.skinSh, gold: C.steel, line: C.skinLine, outward: out, handScale: 1.0,
      bracelet: out < 0 ? 'kada' : 'none', palmMid: C.palmMid, sleeve: { col: C.kurta, sh: C.kurtaSh, len: 0.6, trim: C.gold } });
  }
  return o;
}
// handAng helper: hand continues along the forearm
const along = (E2, W) => Math.atan2(W[1] - E2[1], W[0] - E2[0]);

function draw(p) {
  const neck = [540, 880 + (p.breath || 0) * -3];
  const hd = { ...p, head: p.headPos || rot([540, 660], E.rad((p.tilt || 0) * 0.4), neck) };
  // neck stub
  const nk = tube([neck, [neck[0], neck[1] - 60]], [34, 32], { col: C.skin, sh: C.skinSh, capEnd: false });
  const front = p.armsFront !== false;
  return legs(p) + (front ? '' : arms(p)) + kurta(p) + nk + head(hd) + (front ? arms(p) : '') + (p.extra || '');
}
module.exports = { C, draw, along };
