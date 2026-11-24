// Mesh (Aries) ram, code-drawn chibi, side view facing right. Owner 24 Nov 2026: "Draw better ram".
// Researched anatomy: a ram's horn curls from the top of the head, back, down around the ear and forward again (a full
// curl in a mature ram), thick at the base and tapering, with growth-ring ridges; compact muscular body; thin legs with
// cloven hooves; Roman-nosed face. Domestic Indian sheep carry a woolly fleece, so the body is a cream fleece with curls.
// Moves only through joints: shoulder-knee-hoof (front) and hip-hock-hoof (hind), neck/head pivot, ear and tail swing.
const INK = '#1b1422';
const C = { wool: '#f6efe0', woolSh: '#dccfb6', woolCurl: '#cbbd9f', face: '#8a5a3c', faceSh: '#6e452c', faceLt: '#a8714c',
  horn: '#d9b27a', hornSh: '#b48a52', hornRing: '#9a7440', hoof: '#3a2a24', eyeW: '#ffffff', pupil: '#1b1422', blush: '#e98a8a', nose: '#5a3524', inner: '#e8a7a0' };
const f = n => (+n).toFixed(1);
const P = pts => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L') + ' Z';
const S = (w = 7) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
// smooth closed blob through points (Catmull-Rom -> cubic)
function smooth(pts, closed = true) {
  const n = pts.length, g = i => pts[(i + n) % n]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) { const p0 = closed ? g(i - 1) : pts[Math.max(0, i - 1)], p1 = g(i), p2 = closed ? g(i + 1) : pts[Math.min(n - 1, i + 1)], p3 = closed ? g(i + 2) : pts[Math.min(n - 1, i + 2)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; }
  return d + (closed ? ' Z' : '');
}
// fleece outline: scallops along an ellipse
function fleece(cx, cy, rx, ry, n, bump, seed = 0) {
  const pts = []; for (let i = 0; i < n * 3; i++) { const a = i / (n * 3) * Math.PI * 2, k = (i % 3 === 1) ? 1 + bump : 1 - bump * 0.15 + 0.04 * Math.sin(i * 1.7 + seed);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return smooth(pts);
}
// spiral horn as a tapering band; ridges across it (growth rings)
function horn(cx, cy, s, side = 1) {
  const N = 40, outer = [], inner = [], ridges = [];
  for (let i = 0; i <= N; i++) { const u = i / N, a = -1.9 + u * 4.9 * side, r = (58 - 30 * u) * s, w = (26 - 16 * u) * s;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.92, nx = Math.cos(a), ny = Math.sin(a);
    outer.push([x + nx * w / 2, y + ny * w / 2]); inner.push([x - nx * w / 2, y - ny * w / 2]);
    if (i % 4 === 2 && i < N - 2) ridges.push([[x + nx * w / 2, y + ny * w / 2], [x - nx * w / 2, y - ny * w / 2]]); }
  const band = outer.concat(inner.reverse());
  let o = `<path d="${P(band)}" fill="${C.horn}" ${S(6)}/>`;
  o += `<path d="${P(outer.slice(0, 30).concat(outer.slice(0, 30).reverse().map(([x, y]) => [x - (x - cx) * 0.12, y - (y - cy) * 0.12])))}" fill="${C.hornSh}" opacity="0.6"/>`;
  for (const [a, b] of ridges) o += `<path d="M${f(a[0])} ${f(a[1])} Q${f((a[0] + b[0]) / 2 + 3)} ${f((a[1] + b[1]) / 2 + 3)} ${f(b[0])} ${f(b[1])}" fill="none" stroke="${C.hornRing}" stroke-width="3.5" stroke-linecap="round"/>`;
  return o;
}
// two-bone leg: from joint A, knee bends by angle, ends in a cloven hoof
function leg(ax, ay, l1, l2, a1, a2, front, s) {
  const kx = ax + Math.sin(a1) * l1, ky = ay + Math.cos(a1) * l1, hx = kx + Math.sin(a2) * l2, hy = ky + Math.cos(a2) * l2;
  const path = `M${f(ax)} ${f(ay)} L${f(kx)} ${f(ky)} L${f(hx)} ${f(hy)}`;
  let o = `<path d="${path}" fill="none" stroke="${INK}" stroke-width="${f(26 * s)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="${front ? C.face : C.faceSh}" stroke-width="${f(15 * s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  o += `<g transform="translate(${f(hx)} ${f(hy)}) rotate(${f(-a2 * 57.3 * 0.5)})"><path d="M${f(-11 * s)} ${f(-4 * s)} L${f(13 * s)} ${f(-4 * s)} L${f(15 * s)} ${f(10 * s)} L${f(-13 * s)} ${f(10 * s)} Z" fill="${C.hoof}" ${S(4)}/><path d="M${f(1 * s)} ${f(-2 * s)} L${f(1 * s)} ${f(10 * s)}" stroke="#6a5a52" stroke-width="2"/></g>`;
  return o;
}
// p: { x, y, s, run (cycle phase), speed 0..1, brake 0..1, look 'happy'|'determined'|'shock'|'relief', blink, tilt }
function draw(p) {
  if (p.pal) { const keep = { ...C }; Object.assign(C, p.pal); try { return drawInner(p); } finally { Object.assign(C, keep); } }
  return drawInner(p);
}
function drawInner(p) {
  const s = p.s || 1, ph = (p.run || 0) * Math.PI * 2, sp = p.speed ?? 1, br = p.brake || 0;
  const bob = Math.abs(Math.sin(ph)) * 10 * sp * (1 - br), lean = -br * 10 + (p.tilt || 0);
  let o = `<g transform="translate(${f(p.x)} ${f(p.y - bob)}) scale(${s}) rotate(${f(lean)})">`;
  // legs (back pair first, darker). Gallop: front pair and hind pair swing in counter-phase; brake: fronts braced forward, hinds tucked
  const sw = a => Math.sin(ph + a) * 0.75 * sp * (1 - br);
  const legs = [
    [-70, 20, false, sw(Math.PI) + br * 0.7, sw(Math.PI) * 0.4 - br * 1.3], [52, 22, false, sw(0.5) + br * 0.75, -0.15 + br * 0.25],
    [-50, 24, true, sw(0) + br * 0.55, sw(0) * 0.4 - br * 1.1], [72, 24, true, sw(Math.PI + 0.5) + br * 0.9, -0.1 + br * 0.3]];
  for (const [lx, ly, front, a1, a2] of legs.slice(0, 2)) o += leg(lx, ly, 52, 50, a1, (lx < 0 ? 0.35 : -0.25) + a2, front, 1);
  // tail
  o += `<path d="${smooth([[-118, -24], [-150, -30 + 6 * Math.sin(ph * 2)], [-148, -8], [-122, -4]])}" fill="${C.wool}" ${S(6)}/>`;
  // fleece body + shade + curls
  o += `<path d="${fleece(0, -10, 120, 74, 9, 0.12, 1)}" fill="${C.wool}" ${S(7)}/>`;
  o += `<path d="${fleece(18, 26, 96, 34, 7, 0.1, 2)}" fill="${C.woolSh}" opacity="0.75"/>`;
  if (p.dots) { for (let r = 0; r < 3; r++) for (let k = 0; k < 5 - (r % 2); k++) { const cx = -78 + k * 38 + (r % 2) * 19, cy = -44 + r * 30; o += `<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="${p.dots}" stroke-width="5"/>`; } }
  else for (const [cx, cy, r] of [[-60, -40, 14], [-20, -56, 12], [24, -44, 15], [-80, 0, 12], [-34, -8, 13], [12, 4, 11], [56, -12, 13], [-6, -30, 9]])
    o += `<path d="M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r * 0.6} ${cy + r * 0.6}" fill="none" stroke="${C.woolCurl}" stroke-width="5" stroke-linecap="round"/>`;
  for (const [lx, ly, front, a1, a2] of legs.slice(2)) o += leg(lx, ly, 52, 50, a1, (lx < 0 ? 0.35 : -0.25) + a2, front, 1);
  // neck + head (pivot at the neck: nods with the gallop, pulls back on the brake)
  const nod = Math.sin(ph * 2) * 4 * sp * (1 - br) - br * 14;
  o += `<g transform="translate(112 -58) rotate(${f(nod)}) scale(1.45)">`;
  o += `<path d="${fleece(-14, 0, 40, 46, 5, 0.14, 3)}" fill="${C.wool}" ${S(7)}/>`;   // woolly neck ruff
  // face: Roman-nosed profile, muzzle forward
  o += `<path d="${smooth([[-6, -40], [34, -46], [70, -26], [92, 4], [96, 26], [80, 42], [48, 44], [14, 30], [-8, 4]])}" fill="${C.face}" ${S(7)}/>`;
  o += `<path d="${smooth([[50, 30], [82, 30], [90, 40], [70, 46], [48, 42]])}" fill="${C.faceSh}" opacity="0.7"/>`;
  o += `<path d="M78 24 Q86 22 90 28" fill="none" stroke="${C.nose}" stroke-width="5" stroke-linecap="round"/>`;                              // nostril
  const look = p.look || 'happy';
  o += look === 'shock' ? `<ellipse cx="72" cy="40" rx="9" ry="11" fill="${C.nose}" ${S(4)}/>` : look === 'determined' ? `<path d="M58 38 Q70 36 80 38" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` : `<path d="M56 36 Q70 46 82 36" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  o += `<ellipse cx="44" cy="22" rx="9" ry="6" fill="${C.blush}" opacity="0.6"/>`;
  // eye (big, friendly, white with a dark pupil; blinks)
  const bl = p.blink ? 1 : 0, er = look === 'shock' ? 17 : 14;
  o += bl ? `<path d="M22 -8 Q34 0 46 -8" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` : `<ellipse cx="34" cy="-10" rx="${er}" ry="${er + 2}" fill="${C.eyeW}" ${S(5)}/><circle cx="${38 + (p.lookX || 0)}" cy="-8" r="${look === 'shock' ? 5 : 7}" fill="${C.pupil}"/><circle cx="${41 + (p.lookX || 0)}" cy="-12" r="2.5" fill="#fff"/>`;
  o += look === 'determined' ? `<path d="M18 -30 L50 -24" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` : look === 'shock' ? `<path d="M20 -36 Q34 -44 48 -36" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` : '';
  // ear (under the horn) swings
  o += `<g transform="translate(-14 14) rotate(${f(35 + 10 * Math.sin(ph * 2 + 1) * sp)})"><path d="${smooth([[0, 0], [-26, 6], [-36, 16], [-20, 18], [2, 10]])}" fill="${C.faceSh}" ${S(5)}/></g>`;
  // the curled horn around the ear, plus the far horn's tip peeking behind
  o += horn(-24, -14, 0.82, 1);
  o += `<path d="${smooth([[-2, -50], [22, -64], [42, -54], [26, -42]])}" fill="${C.wool}" ${S(5)}/>`;   // wool tuft on the crown
  o += `</g>`;
  if (br > 0.05) for (let i = 0; i < 4; i++) o += `<circle cx="${f(90 + i * 26)}" cy="${f(78 - i * 6)}" r="${f((10 + i * 4) * br)}" fill="#e8dcc6" opacity="${f(0.8 * br)}" ${S(3)}/>`;   // dust puffs at the braced front hooves
  return o + '</g>';
}
module.exports = { draw, C };

// ---- Folk ram matched to the owner's Lemo-made Mesh card (24 Nov 2026): round scalloped cream fleece with three rows of
// rust ring-dots and a pale belly crescent, brown Roman-nosed face, navy spiral horn with a teal coil and a cream dotted
// spiral, a white topknot puff, four straight brown legs with dark hooves; thin warm-brown outline, flat colour.
const FK = { line: '#3a1a14', wool: '#fbf2dc', crescent: '#eadbb6', dot: '#b5502a', face: '#c4743a', muzzle: '#a85a2a', horn: '#23485a', hornIn: '#3d7f8a', leg: '#b8622c', hoof: '#3a1a14' };
function drawFolk(p) {
  const s = p.s || 1, ph = (p.run || 0) * Math.PI * 2, sp = p.speed ?? 0, br = p.brake || 0, L = `stroke="${FK.line}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"`;
  const bob = Math.abs(Math.sin(ph)) * 8 * sp * (1 - br), tilt = -5 * br + (p.tilt || 0);
  let o = `<g transform="translate(${f(p.x)} ${f(p.y - bob)}) scale(${s}) rotate(${f(tilt)})">`;
  // legs rotate at their top joint (shoulder/hip); hooves stay attached
  const legA = (i) => { const pair = i < 2 ? 0 : 1, sw = Math.sin(ph + (i % 2 ? Math.PI : 0) + pair * 0.6) * 0.38 * sp * (1 - br);
    return (pair ? 0.5 : -0.17) * br + sw; };
  const LEGS = [[-93, false], [-53, true], [63, false], [105, true]];
  const legSvg = ([x, near], i) => `<g transform="translate(${x} 110) rotate(${f(-legA(i) * 57.3)})"><rect x="-11" y="0" width="22" height="72" fill="${near ? FK.leg : '#9c5226'}" ${L}/><rect x="-12" y="66" width="24" height="17" rx="5" fill="${FK.hoof}" ${L}/></g>`;
  o += legSvg(LEGS[0], 0) + legSvg(LEGS[2], 2);
  // fleece: scalloped round cloud
  const pts = []; const N = 15; for (let i = 0; i < N; i++) { const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2; pts.push([Math.cos(a0) * 185, Math.sin(a0) * 128, Math.cos(a1) * 185, Math.sin(a1) * 128]); }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`; for (const [x0, y0, x1, y1] of pts) { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, k = 1.18; d += ` Q${f(mx * k)} ${f(my * k)} ${f(x1)} ${f(y1)}`; }
  o += `<path d="${d} Z" fill="${FK.wool}" ${L}/>`;
  o += `<path d="M-110 45 Q0 95 115 45" fill="none" stroke="${FK.crescent}" stroke-width="7" stroke-linecap="round"/>`;
  for (const [row, xs] of [[-45, [-98, -51, -4, 43]], [-3, [-75, -28, 19, 66, 113]], [40, [-98, -51, -4, 43]]]) for (const x of xs) o += `<circle cx="${x}" cy="${row}" r="10" fill="${FK.dot}"/><circle cx="${x}" cy="${row}" r="4" fill="${FK.wool}"/>`;
  o += legSvg(LEGS[1], 1) + legSvg(LEGS[3], 3);
  // head pivots at the neck (nods back on the brake)
  o += `<g transform="translate(127 -40) rotate(${f(-8 * br + Math.sin(ph * 2) * 3 * sp)}) scale(1.15) translate(-127 40)">`;
  o += `<path d="${smooth([[115, -105], [145, -122], [180, -112], [210, -77], [225, -34], [216, -6], [187, 1], [155, -14], [127, -40]])}" fill="${FK.face}" ${L}/>`;
  o += `<ellipse cx="205" cy="-24" rx="22" ry="16" fill="${FK.muzzle}"/>`;
  o += p.look === 'shock' ? `<ellipse cx="207" cy="-12" rx="7" ry="8" fill="${FK.line}"/>` : `<path d="M188 -12 Q200 -4 214 -12" fill="none" ${L}/>`;
  const er = p.look === 'shock' ? 12 : 9;
  o += p.blink ? `<path d="M168 -73 Q177 -67 186 -73" fill="none" ${L}/>` : `<circle cx="177" cy="-73" r="${er}" fill="#fff" ${L}/><circle cx="${180 + (p.lookX || 0)}" cy="-72" r="4.5" fill="${FK.line}"/><circle cx="${181.5 + (p.lookX || 0)}" cy="-74" r="1.6" fill="#fff"/>`;
  if (p.look === 'shock') o += `<path d="M166 -92 Q177 -100 188 -92" fill="none" ${L}/>`;
  // horn: root from the crown, then a navy coil with a teal inner spiral and a cream dotted spiral
  o += `<path d="M118 -128 Q90 -142 74 -112" fill="none" stroke="${FK.line}" stroke-width="26" stroke-linecap="round"/><path d="M118 -128 Q90 -142 74 -112" fill="none" stroke="${FK.horn}" stroke-width="17" stroke-linecap="round"/>`;
  // spiral horn band (snail coil, ~1.7 turns), tapering, with teal ridge segments across it (as in the card)
  o += `<circle cx="110" cy="-85" r="50" fill="${FK.horn}" ${L}/>`;
  { const N = 70, out = [], inn = [], rid = []; for (let i = 0; i <= N; i++) { const u = i / N, a = -1.4 + u * Math.PI * 3.4, r = 44 - 38 * u, w = 14 - 9 * u;
      const cx = 110 + Math.cos(a) * r, cy = -85 + Math.sin(a) * r, nx = Math.cos(a), ny = Math.sin(a);
      out.push([cx + nx * w / 2, cy + ny * w / 2]); inn.push([cx - nx * w / 2, cy - ny * w / 2]); if (i % 4 === 1 && i < N - 3) rid.push([cx + nx * w * 0.42, cy + ny * w * 0.42, cx - nx * w * 0.42, cy - ny * w * 0.42]); }
    o += `<path d="M${out.concat(inn.reverse()).map(q => f(q[0]) + ' ' + f(q[1])).join(' L')} Z" fill="${FK.horn}" stroke="#16303c" stroke-width="3"/>`;
    for (const [x0, y0, x1, y1] of rid) o += `<path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)}" stroke="#4f8f99" stroke-width="4" stroke-linecap="round"/>`; }
  o += `<path d="${smooth([[130, -152], [146, -166], [166, -160], [170, -140], [154, -128], [136, -134]])}" fill="${FK.wool}" ${L}/>`;
  o += `</g>`;
  if (br > 0.05) for (let i = 0; i < 4; i++) o += `<circle cx="${f(150 + i * 26)}" cy="${f(172 - i * 8)}" r="${f((9 + i * 4) * br)}" fill="#f1e3c4" opacity="${f(0.85 * br)}" ${L}/>`;
  return o + '</g>';
}
module.exports.drawFolk = drawFolk;
