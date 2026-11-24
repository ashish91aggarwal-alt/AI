// Vrishabh (Taurus) bull: a real Indian zebu, natural and dignified, NOT a funny cartoon (owner, 24 Nov 2026 23:22 IST:
// "keep him natural, natural joints, realistic, not funny"). Silkscreen-poster inks (flat fills, one shade, one lit tone, ink edge).
// Researched: zebu hump over the withers, pendulous dewlap, long whip tail with a black switch, cloven hooves.
//   Kankrej: silver-grey, darker on hump / fore- and hindquarters, lyre horns, large ears.  Gir: deep red with white patches,
//   domed forehead, long drooping curled ears, horns curving back and down.  Ongole: white, stumpy thick horns, big fan dewlap.
// Moves only through joints: shoulder/elbow-knee-fetlock-hoof (front), stifle-hock-fetlock-hoof (hind), neck, poll, jaw, ear, tail.
// Walk = lateral sequence LH, LF, RH, RF (cattle gait). Lying = sternal, legs folded under; rises knees first, then hind, then fore.
const INK = '#1e1612';
const f = n => (+n).toFixed(1);
const BREED = {
  kankrej: { base: '#b9b4ab', shade: '#7f7a74', lit: '#dcd7cd', dark: '#5f5b57', muzzle: '#2a2420', horn: '#3a332c', hornTip: '#1e1612', hump: 1.0, dewlap: 0.7, ear: 'large', horns: 'lyre', head: 'long', patches: false },
  gir:     { base: '#a54a2a', shade: '#7a3420', lit: '#c4683e', dark: '#5e2818', muzzle: '#3a2420', horn: '#4a3a2c', hornTip: '#2a1e16', hump: 0.85, dewlap: 0.8, ear: 'gir', horns: 'gir', head: 'dome', patches: true },
  ongole:  { base: '#eee8dd', shade: '#c7bdae', lit: '#fbf8f1', dark: '#9e9384', muzzle: '#3a3430', horn: '#5a4c3c', hornTip: '#2e2620', hump: 1.1, dewlap: 1.15, ear: 'small', horns: 'stump', head: 'coffin', patches: false },
};
// Catmull-Rom smooth path
function smooth(pts, closed = true) {
  const n = pts.length, g = i => pts[(i + n) % n]; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = closed ? g(i - 1) : pts[Math.max(0, i - 1)], p1 = g(i), p2 = closed ? g(i + 1) : pts[Math.min(n - 1, i + 1)], p3 = closed ? g(i + 2) : pts[Math.min(n - 1, i + 2)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (closed ? ' Z' : '');
}
const rot = (p, a, o = [0, 0]) => [o[0] + p[0] * Math.cos(a) - p[1] * Math.sin(a), o[1] + p[0] * Math.sin(a) + p[1] * Math.cos(a)];
// two-bone IK: from A, bones L1, L2 to reach T; bend = +1 puts the middle joint forward (+x), -1 backward
function ik(A, T, L1, L2, bend) {
  let dx = T[0] - A[0], dy = T[1] - A[1], d = Math.hypot(dx, dy); const dm = Math.min(d, L1 + L2 - 0.01); const ux = dx / d, uy = dy / d;
  const a = (L1 * L1 - L2 * L2 + dm * dm) / (2 * dm), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  // perpendicular pointing forward(+x) for a downward leg is (-uy, ux) rotated; choose sign by bend
  let px = -uy, py = ux; if (px * bend < 0) { px = -px; py = -py; }
  const M = [A[0] + ux * a + px * h, A[1] + uy * a + py * h], E = [A[0] + ux * dm, A[1] + uy * dm];
  return [M, E];
}
// tapered limb segment polygon from P to Q with widths w0 -> w1
function seg(P, Q, w0, w1) {
  const dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return [[P[0] + nx * w0 / 2, P[1] + ny * w0 / 2], [Q[0] + nx * w1 / 2, Q[1] + ny * w1 / 2], [Q[0] - nx * w1 / 2, Q[1] - ny * w1 / 2], [P[0] - nx * w0 / 2, P[1] - ny * w0 / 2]];
}
function legSVG(pts, widths, fill, shade, isFar, hoofCol) {
  // pts: [attach, mid, fetlock, hoof]; drawn as ink outline (wider) then fill, joints are round so bends melt
  const [A, M, F, H] = pts, [wA, wM, wF] = widths;
  const outline = (extra, col) => {
    let o = '';
    o += `<path d="${smooth([...seg(A, M, wA + extra, wM + extra)], true)}" fill="${col}"/>`;
    o += `<path d="${smooth([...seg(M, F, wM + extra, wF + extra)], true)}" fill="${col}"/>`;
    o += `<circle cx="${f(M[0])}" cy="${f(M[1])}" r="${f((wM + extra) / 2)}" fill="${col}"/><circle cx="${f(F[0])}" cy="${f(F[1])}" r="${f((wF + extra) / 2 + 1)}" fill="${col}"/>`;
    o += `<path d="${smooth([...seg(F, H, wF + extra - 2, wF + extra - 4)], true)}" fill="${col}"/>`;
    return o;
  };
  let o = outline(9, INK) + outline(0, isFar ? shade : fill);
  // a shade stripe down the back edge of the near leg (one flat shade)
  if (!isFar) o += `<path d="${smooth(seg([A[0] - wA * 0.25, A[1]], [M[0] - wM * 0.28, M[1]], wA * 0.3, wM * 0.25))}" fill="${shade}" opacity="0.9"/>`;
  // hoof: cloven, follows the pastern direction
  const a = Math.atan2(H[1] - F[1], H[0] - F[0]) - Math.PI / 2, hw = wF * 0.62;
  const hp = [[-hw, -4], [hw, -4], [hw + 5, 18], [-hw + 2, 18]].map(p => rot(p, a, H));
  o += `<path d="M${hp.map(p => f(p[0]) + ' ' + f(p[1])).join(' L')} Z" fill="${hoofCol}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  const c1 = rot([0.6, -2], a, H), c2 = rot([1.5, 17], a, H); o += `<path d="M${f(c1[0])} ${f(c1[1])} L${f(c2[0])} ${f(c2[1])}" stroke="${INK}" stroke-width="3"/>`;
  return o;
}

// gait: legs LH, LF, RH, RF with phase offsets 0, .25, .5, .75 (lateral sequence); stance 65 % of the cycle
const OFF = { LH: 0, LF: 0.25, RH: 0.5, RF: 0.75 };
function hoofTarget(base, ph, stride, lift) {
  const DUTY = 0.65; let x, y = 0;
  if (ph < DUTY) { const u = ph / DUTY; x = stride / 2 - stride * u; }
  else { const u = (ph - DUTY) / (1 - DUTY), s = u * u * (3 - 2 * u); x = -stride / 2 + stride * s; y = -lift * Math.sin(Math.PI * u); }
  return [base + x, y];
}

// o: { breed, x, y, s, flip, walk (cycle phase, in cycles), walking 0..1, down 0..1 (lying), headA (rad, + = down), chew, earA, tail, blink }
function draw(o = {}) {
  const B = BREED[o.breed || 'kankrej'], s = o.s || 1, wk = o.walking || 0, down = o.down || 0, t = o.t || 0;
  const cyc = o.walk || 0, bob = wk * 4 * Math.sin(cyc * Math.PI * 4);
  // lying down: front kneels first, then the hind end drops (rising is the exact reverse: hind up first, then front)
  const cl = v => Math.max(0, Math.min(1, v)), sm = u => u * u * (3 - 2 * u);
  const dF = sm(cl(down * 1.7)), dH = sm(cl(down * 1.7 - 0.7)), DROP = 186;
  const P = (x, y) => [x, y - bob + DROP * (dH + (dF - dH) * cl((x + 330) / 480))];
  const by = -bob + DROP * (dH + dF) / 2;
  // ---- legs ----
  const legs = {};
  const front = { attach: [114, -214], L1: 106, L2: 86, past: 24 }, hind = { attach: [-268, -236], L1: 124, L2: 100, past: 24 };
  for (const k of ['LH', 'LF', 'RH', 'RF']) {
    const isF = k[1] === 'F', isNear = k[0] === 'L', g = isF ? front : hind;
    const A = P(g.attach[0] + (isNear ? 0 : -16), g.attach[1]);
    const baseX = (isF ? 126 : -300) + (isNear ? 0 : -18);
    let T;
    if (wk) { const ph = ((cyc + OFF[k]) % 1 + 1) % 1; T = hoofTarget(baseX, ph, 130 * wk, 46 * wk); } else T = [baseX, 0];
    // folded (sternal lying): front fetlock tucked back under the chest (knee forward on the ground), hind fetlock forward under the belly (hock back)
    const fold = isF ? [g.attach[0] - 50 + (isNear ? 0 : -14), -10] : [g.attach[0] + 100 + (isNear ? 0 : -14), -12];
    const dn = isF ? dF : dH;
    T = [T[0] + (fold[0] - T[0]) * dn, T[1] + (fold[1] - T[1]) * dn];
    const pastU = 1 - 0.7 * dn, Fet = [T[0] - (isF ? 3 : 5) * pastU, T[1] - g.past * pastU];
    const [M, E] = ik(A, Fet, g.L1, g.L2, isF ? 1 : -1);
    legs[k] = { pts: [A, M, E, [E[0] + (isF ? 3 : 5) * pastU + (isF ? -12 : 12) * dn, E[1] + g.past * pastU]], isF, isNear };
  }
  const W = { F: [58, 34, 27], H: [62, 36, 27] };
  let far = '', near = '';
  for (const k of ['RH', 'RF']) far += legSVG(legs[k].pts, W[legs[k].isF ? 'F' : 'H'], B.base, B.shade, true, '#2a2420');
  let nearF = '';
  for (const k of ['LH', 'LF']) { const l = legSVG(legs[k].pts, W[legs[k].isF ? 'F' : 'H'], B.base, B.shade, false, '#2a2420'); if (k === 'LF') nearF = l; else near += l; }
  // ---- neck + head pose: neck root at the front of the hump, poll forward and a little down; head angled down from the poll ----
  const nod = wk * 0.06 * Math.sin(cyc * Math.PI * 4 + 1.2);
  const nA = -0.06 + (o.neckA || 0) + nod * 0.5 - 0.35 * down, root = P(0.29 * 380, -0.95 * 380), poll = [root[0] + 120 * Math.cos(nA), root[1] + 120 * Math.sin(nA)];
  const hA = 0.98 + (o.headA || 0) + nod - 0.55 * down;          // radians below horizontal (about 57 deg standing)
  const H = pt => rot([pt[0] * 1.14, pt[1] * 1.14], hA, poll);
  const hump = B.hump, dl = B.dewlap;
  // ---- body silhouette: one path including neck and dewlap, so the shoulder and neck melt into the torso ----
  const throat = H([22, 74]), jawBack = H([-10, 48]);
  const U = 380, Q = (x, y) => P(x * U, -y * U);
  const body = [
    Q(-0.88, 0.975), Q(-0.70, 1.020), Q(-0.50, 0.985), Q(-0.25, 0.975), Q(-0.02, 0.995), Q(0.07, 1.045 + 0.05 * hump), Q(0.16, 1.105 + 0.08 * hump), Q(0.25, 1.075 + 0.05 * hump), Q(0.31, 1.005),
    [poll[0] - 34, poll[1] - 10], [poll[0] + 2, poll[1] + 6], jawBack, throat,
    [throat[0] + 4 * dl, throat[1] + 50 + 30 * dl], Q(0.47 + 0.02 * dl, 0.62 - 0.04 * dl), Q(0.40, 0.535), Q(0.26, 0.515),
    Q(0.0, 0.505), Q(-0.30, 0.515), Q(-0.52, 0.575), Q(-0.62, 0.545), Q(-0.76, 0.555), Q(-0.89, 0.605), Q(-0.96, 0.775), Q(-0.94, 0.915),
  ];
  const bodyD = smooth(body);
  const uid = 'b' + Math.abs(Math.round((o.x || 0) * 7 + (o.y || 0) * 13 + (o.s || 1) * 100 + down * 31));
  let shade = `<path d="M-420 ${f(-243 + by)} Q-60 ${f(-260 + by)} 320 ${f(-240 + by)} L320 ${f(40 + by)} L-300 ${f(40 + by)} Z" fill="${B.shade}"/>`;
  if ((o.breed || 'kankrej') === 'kankrej') shade += `<path d="${smooth([P(-10, -398), P(60, -468), P(150, -388), P(200, -198), P(90, -178), P(40, -318)])}" fill="${B.dark}" opacity="0.7"/><path d="${smooth([P(-300, -398), P(-230, -368), P(-240, -218), P(-350, -218), P(-380, -328)])}" fill="${B.dark}" opacity="0.5"/>`;
  if (B.patches) shade += `<path d="${smooth([P(-170, -358), P(-90, -364), P(-80, -298), P(-120, -254), P(-190, -278)])}" fill="#efe4d2"/><path d="${smooth([P(-330, -348), P(-280, -368), P(-268, -304), P(-326, -284)])}" fill="#efe4d2"/>`;
  const lit = `<path d="${smooth([P(-330, -368), P(-266, -384), P(-190, -372), P(-90, -368), P(-190, -358), P(-266, -368)])}" fill="${B.lit}"/>`;
  // ---- tail: from the tail-head, hangs along the buttock to near the hock, black switch; lies back along the ground when lying ----
  const ta = (o.tail || 0) + wk * 0.12 * Math.sin(cyc * Math.PI * 2) + 0.05 * Math.sin(t * 1.3) + 0.55 * down;
  const t0 = P(-0.88 * 380, -0.965 * 380), clampY = p => [p[0], Math.min(p[1], -4)];
  const tp = [[0, 0], [-18, 60], [-22, 130], [-16, 200], [-10, 240]].map(p => clampY(rot(p, ta * (0.5 + 0.5 * (p[1] / 205)), t0)));
  const tailD = smooth(tp, false), tEnd = tp[4], tPrev = tp[3], tDir = Math.atan2(tEnd[1] - tPrev[1], tEnd[0] - tPrev[0]) - Math.PI / 2;
  const tail = `<path d="${tailD}" stroke="${INK}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="${tailD}" stroke="${B.shade}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
    `<path d="${smooth([[-12, -24], [12, -24], [14, 30], [0, 48], [-14, 30]].map(p => clampY(rot(p, tDir, tEnd))))}" fill="#1e1612"/>`;
  // ---- head (local: poll at 0,0, +x toward the muzzle, +y = underside) ----
  const domed = B.head === 'dome';
  const headD = smooth([[-14, -16], [28, domed ? -42 : -32], [78, -26], [116, -18], [138, -8], [148, 20], [142, 52], [112, 62], [70, 70], [28, 74], [-12, 46]].map(H));
  const muzzle = smooth([[112, -16], [138, -8], [148, 20], [142, 52], [114, 58], [104, 20]].map(H));
  const chew = (o.chew || 0) * (0.5 + 0.5 * Math.sin(t * 7));
  const jaw = smooth([[40, 58], [110, 54 + 5 * chew], [106, 70 + 7 * chew], [60, 80 + 3 * chew], [14, 66]].map(H));
  const eyeC = H([42, 4]), blink = o.blink || 0;
  const eye = `<g transform="translate(${f(eyeC[0])} ${f(eyeC[1])}) rotate(${f(hA * 57.3 - 40)})"><path d="M-10 0 Q0 ${f(-7 * (1 - blink))} 10 0 Q0 ${f(5 * (1 - blink))} -10 0 Z" fill="#2a1a12" stroke="${INK}" stroke-width="3"/>${blink < 0.5 ? '<circle cx="2" cy="-1" r="2" fill="#e8dccb"/>' : ''}<path d="M-12 -5 Q0 -12 12 -5" stroke="${INK}" stroke-width="3" fill="none"/></g>`;
  const nost = H([134, 12]);
  const ea = (o.earA || 0) + 0.12 * Math.sin(t * 0.9 + 2), eb = H([14, 6]);
  let earPts;   // ear shapes in world directions (ears hang from the head side behind the eye)
  if (B.ear === 'gir') earPts = [[-6, -10], [-14, 30], [-6, 76], [8, 100], [20, 84], [14, 40], [10, -8]];
  else if (B.ear === 'large') earPts = [[0, -10], [-44, 4], [-80, 18], [-64, 30], [-22, 22], [4, 10]];
  else earPts = [[0, -8], [-34, 0], [-54, 8], [-36, 16], [4, 8]];
  const earD = smooth(earPts.map(p => rot(p, ea + (B.ear === 'gir' ? 0.35 : 0.1), eb)));
  const hb = H([6, -14]);
  let hornPts;  // in world directions from the poll (horns go up whatever the head angle)
  if (B.horns === 'lyre') hornPts = [[-10, 0], [-24, -34], [-20, -78], [-4, -112], [8, -118], [4, -100], [-4, -70], [4, -34], [10, 0]];
  else if (B.horns === 'gir') hornPts = [[-10, 0], [-30, -20], [-58, -18], [-74, 2], [-66, 14], [-56, -2], [-34, -2], [8, 4]];
  else hornPts = [[-12, 0], [-16, -22], [-8, -44], [4, -48], [10, -28], [12, 0]];
  const hornD = smooth(hornPts.map(p => rot(p, (hA - 1.0) * 0.4, hb)));
  const hornFar = smooth(hornPts.map(p => rot([p[0] * 0.9 + 16, p[1] * 0.92 + 2], (hA - 1.0) * 0.4, hb)));
  const head = `<path d="${hornFar}" fill="${B.horn}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="${headD}" fill="${B.base}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    (B.patches ? `<path d="${smooth([[24, -24], [74, -16], [92, 6], [44, 6]].map(H))}" fill="#efe4d2"/>` : '') +
    ((o.breed || 'kankrej') === 'kankrej' ? `<path d="${smooth([[20, -10], [90, -14], [120, 0], [80, 20], [20, 30]].map(H))}" fill="${B.dark}" opacity="0.45"/>` : '') +
    `<path d="${jaw}" fill="${B.shade}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="${muzzle}" fill="${B.muzzle}"/><ellipse cx="${f(nost[0])}" cy="${f(nost[1])}" rx="6" ry="4" fill="#0e0a08"/>` + eye +
    `<path d="${earD}" fill="${B.shade}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="${hornD}" fill="${B.horn}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  const bodySVG = `<defs><clipPath id="${uid}"><path d="${bodyD}"/></clipPath></defs><path d="${bodyD}" fill="${INK}" transform="translate(0 0)" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/><path d="${bodyD}" fill="${B.base}"/><g clip-path="url(#${uid})">${shade}${lit}</g>`;
  const shadow = `<ellipse cx="-80" cy="6" rx="${f(230 - 10 * down)}" ry="18" fill="#1e1612" opacity="0.22"/>`;
  const flip = o.flip ? -1 : 1;
  return `<g transform="translate(${f(o.x || 0)} ${f(o.y || 0)}) scale(${f(s * flip)} ${f(s)})">${shadow}<defs><clipPath id="g${uid}"><rect x="-400" y="-700" width="900" height="704"/></clipPath></defs><g clip-path="url(#g${uid})">${far}${tail}${near}${dF > 0.6 ? '' : nearF}${bodySVG}${dF > 0.6 ? nearF : ''}${head}</g></g>`;
}
module.exports = { draw, BREED };
