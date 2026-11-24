// Ink-and-bend cartoon engine (shared by every character and scene).
// Style targets measured from the reference reel: warm near-black ink, silhouette lines thick,
// inner detail lines thin, one hard cel-shadow tone per colour, lines boil on twos.
const { getStroke } = require('perfect-freehand');

const INK = '#161017';
const WT = { sil: 7.2, mid: 3.0, fine: 1.7 }; // line weight classes (ref: p10 2.7, median 4.6, p90 15 px)

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const backOut = x => { x = clamp(x); const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const rad = d => d * Math.PI / 180;
function track(keys, t, fn = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) { const [t1, v1] = keys[i]; if (t <= t1) { const [t0, v0] = keys[i - 1]; return v0 + (v1 - v0) * fn((t - t0) / (t1 - t0)); } }
  return keys[keys.length - 1][1];
}
function catmull(pts, n, closed) {
  const out = [], N = pts.length, segs = closed ? N : N - 1;
  const P = i => closed ? pts[(i + N) % N] : pts[clamp(i, 0, N - 1)];
  for (let s = 0; s < segs; s++) {
    const p0 = P(s - 1), p1 = P(s), p2 = P(s + 1), p3 = P(s + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  if (!closed) out.push(pts[N - 1].slice());
  return out;
}
const rot = ([x, y], a, [cx, cy] = [0, 0]) => { const c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
const poly = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z';
const mirror = pts => pts.concat(pts.slice(1, -1).reverse().map(([x, y]) => [-x, y])); // half outline -> full

// per-drawing state: boil seed changes on twos; stroke ids keep each line's wobble stable within a drawing
const S = { boil: 0, sid: 0, uid: 0 };
function boil(pts, amp) {
  const s = S.boil * 12.9898 + (S.sid++) * 78.233;
  const ph = [Math.sin(s) * 43758.5453 % 6.28, Math.cos(s * 1.3) * 24634.6345 % 6.28, Math.sin(s * 0.7) * 13579.1 % 6.28];
  return pts.map(([x, y], i) => [x + amp * Math.sin(i * 0.21 + ph[0]) + amp * 0.5 * Math.sin(i * 0.53 + ph[2]), y + amp * Math.cos(i * 0.19 + ph[1])]);
}
function strokePath(o) {
  if (o.length < 2) return '';
  const d = ['M', o[0][0].toFixed(1), o[0][1].toFixed(1), 'Q'];
  for (let i = 0; i < o.length; i++) { const [x0, y0] = o[i], [x1, y1] = o[(i + 1) % o.length]; d.push(x0.toFixed(1), y0.toFixed(1), ((x0 + x1) / 2).toFixed(1), ((y0 + y1) / 2).toFixed(1)); }
  return d.join(' ') + ' Z';
}
const swell = u => 0.5 + 0.5 * Math.sin(Math.PI * u);
function ink(pts, size, { prof = swell, taper = [0.2, 0.25], color = INK, amp = 1.0 } = {}) {
  const b = boil(pts, amp);
  let L = 0; const acc = [0];
  for (let i = 1; i < b.length; i++) { L += Math.hypot(b[i][0] - b[i - 1][0], b[i][1] - b[i - 1][1]); acc.push(L); }
  const o = getStroke(b.map((p, i) => [p[0], p[1], clamp(prof(acc[i] / (L || 1)), 0.05, 1)]),
    { size, thinning: 0.72, smoothing: 0.6, streamline: 0.2, simulatePressure: false, last: true, start: { taper: L * taper[0], cap: true }, end: { taper: L * taper[1], cap: true } });
  return `<path d="${strokePath(o)}" fill="${color}"/>`;
}
// closed outline inked as two overlapping strokes, heavier on the shadow (right/bottom) side
function inkLoop(pts, size) {
  const n = pts.length, h = Math.floor(n / 2);
  return ink(pts.slice(0, h + 3), size, { prof: u => 0.45 + 0.55 * swell(u) }) +
         ink(pts.slice(h - 2).concat(pts.slice(0, 3)), size * 0.85, { prof: u => 0.45 + 0.55 * swell(u) });
}
const fill = (pts, col, amp = 0.6) => `<path d="${poly(boil(pts, amp))}" fill="${col}"/>`;
const clipId = () => 'c' + (S.uid++);
function clipped(shapePts, inner) { const id = clipId(); return `<clipPath id="${id}"><path d="${poly(shapePts)}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; }
// a filled, cel-shaded, inked shape in one call
function part(pts, col, { sh, shPts, w = WT.mid, hi } = {}) {
  return fill(pts, col) + (sh && shPts ? clipped(pts, fill(shPts, sh) + (hi || '')) : '') + inkLoop(pts, w);
}

// bending tube, rebuilt each drawing from its joint chain (arms, neck, legs)
const LIGHT = [-0.55, -0.83];
function tube(chain, radii, { col, sh, w = WT.sil * 0.85, capStart = false, capEnd = true, endTaper = 0.15 }) {
  const c = catmull(chain, 14, false), n = c.length;
  const r = c.map((_, i) => { const u = i / (n - 1) * (radii.length - 1), k = Math.min(radii.length - 2, Math.floor(u)); return lerp(radii[k], radii[k + 1], u - k); });
  // bend radius at each point (window of +-3) -> how far the inner side may be offset before it folds over
  const rIn = c.map((p, i) => {
    const a = c[Math.max(0, i - 3)], b = c[Math.min(n - 1, i + 3)];
    const t1 = Math.atan2(p[1] - a[1], p[0] - a[0]), t2 = Math.atan2(b[1] - p[1], b[0] - p[0]);
    let d = t2 - t1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const ds = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2 || 1;
    return { side: Math.sign(d), lim: Math.abs(d) > 1e-3 ? 0.8 * ds / Math.abs(d) : 1e9 };
  });
  const L = [], R = [], SH = [];
  let vote = 0; for (let i = 1; i < n; i++) { const tx = c[i][0] - c[i - 1][0], ty = c[i][1] - c[i - 1][1]; vote += (-ty * LIGHT[0] + tx * LIGHT[1]) < 0 ? 1 : -1; }
  const s = vote >= 0 ? 1 : -1; // one shadow side for the whole limb
  for (let i = 0; i < n; i++) {
    const p = c[i], q = c[Math.min(n - 1, i + 1)], o = c[Math.max(0, i - 1)];
    let tx = q[0] - o[0], ty = q[1] - o[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty, ny = tx;
    // turning toward +normal side (d>0 in screen coords means turning toward L side)
    const rl = rIn[i].side > 0 ? Math.min(r[i], rIn[i].lim) : r[i], rr = rIn[i].side < 0 ? Math.min(r[i], rIn[i].lim) : r[i];
    L.push([p[0] + nx * rl, p[1] + ny * rl]); R.push([p[0] - nx * rr, p[1] - ny * rr]);
    SH.push([[p[0] + s * nx * r[i], p[1] + s * ny * r[i]], [p[0] + s * nx * r[i] * 0.15, p[1] + s * ny * r[i] * 0.15]]);
  }
  const end = c[n - 1], er = r[n - 1], cap = [], ang = Math.atan2(L[n - 1][1] - end[1], L[n - 1][0] - end[0]);
  for (let k = 0; k <= 8; k++) { const a = ang - Math.PI * k / 8; cap.push([end[0] + Math.cos(a) * er, end[1] + Math.sin(a) * er]); }
  let body = L.concat(capEnd ? cap : [], R.slice().reverse());
  if (capStart) { const st = c[0], sr = r[0], a0 = Math.atan2(R[0][1] - st[1], R[0][0] - st[0]), sc = []; for (let k = 1; k < 8; k++) { const a = a0 - Math.PI * k / 8; sc.push([st[0] + Math.cos(a) * sr, st[1] + Math.sin(a) * sr]); } body = body.concat(sc); }
  const sh0 = capStart ? Math.floor(n * 0.18) : 0, SHs = SH.slice(sh0);
  const shadow = SHs.map(x => x[0]).concat(SHs.map(x => x[1]).reverse());
  return fill(body, col) + fill(shadow, sh) +
    ink(L.concat(capEnd ? cap.slice(0, 5) : []), w, { taper: [capStart ? 0.5 : 0.35, capEnd ? 0.15 : endTaper] }) +
    ink((capEnd ? cap.slice(4) : []).concat(R.slice().reverse()), w, { taper: [capEnd ? 0.15 : endTaper, capStart ? 0.5 : 0.35] });
}

function limb(chain, r, { col, sh, w = WT.sil * 0.85 }) {
  const c = catmull(chain, 12, false), d = 'M' + c.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const id = 'm' + (S.uid++), off = [-LIGHT[0] * r * 0.55, -LIGHT[1] * r * 0.55];
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${(2 * r + 2 * w * 0.55).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${(2 * r).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920"><path d="${d}" fill="none" stroke="#fff" stroke-width="${(2 * r).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/></mask>` +
    `<path mask="url(#${id})" d="${d}" transform="translate(${off[0].toFixed(1)} ${off[1].toFixed(1)})" fill="none" stroke="${sh}" stroke-width="${(2 * r * 0.55).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function arm(S, E, W, { r, handPose, handAng, hs, skin, skinSh, gold, line, outward, bracelet = 'beads', palmMid = null, sleeve = null, handScale = 1.1, handStyle = 'slender', palmSide = 1 }) {   // palmSide -1: open palm faces the viewer with the thumb toward the body (Sakshi)
  const ux = W[0] - E[0], uy = W[1] - E[1], ul = Math.hypot(ux, uy) || 1, d = [ux / ul, uy / ul];
  const tail = 40 * hs, P = [W[0] + d[0] * tail, W[1] + d[1] * tail];
  let o = '';
  // shoulder: a round deltoid, inked only on its outer arc so it melts into the torso
  const sr = r[0] * 1.15, ball = [];
  for (let k = 0; k < 16; k++) { const a = Math.PI * 2 * k / 16; ball.push([S[0] + Math.cos(a) * sr, S[1] + Math.sin(a) * sr]); }
  const arc = []; for (let k = 0; k <= 10; k++) { const a = rad(outward > 0 ? -115 + 13 * k : -65 - 13 * k); arc.push([S[0] + Math.cos(a) * sr, S[1] + Math.sin(a) * sr]); }
  const armR = (r[0] + r[1] + r[2]) / 3;
  // soft elbow: replace the sharp S-E-W corner with a rounded bend (no 'robot joint')
  const E1 = [E[0] + (S[0] - E[0]) * 0.28, E[1] + (S[1] - E[1]) * 0.28], E2 = [E[0] + (W[0] - E[0]) * 0.28, E[1] + (W[1] - E[1]) * 0.28];
  const Em = [E[0] * 0.4 + (E1[0] + E2[0]) * 0.3, E[1] * 0.4 + (E1[1] + E2[1]) * 0.3], soft = [S, E1, Em, E2, W];
  o += limb(soft, armR, { col: skin, sh: skinSh });
  // shoulder melt: paint body colour over the limb's start cap and the torso outline under it (no seam, no ball joint),
  // then one smooth outer contour from the trapezius over the shoulder into the arm's outer edge
  const sx = E[0] - S[0], sy = E[1] - S[1], sl = Math.hypot(sx, sy) || 1, u = [sx / sl, sy / sl];
  const blob = []; for (let k = 0; k < 20; k++) { const a = Math.PI * 2 * k / 20; blob.push([S[0] + Math.cos(a) * armR * (sleeve ? 1.5 : 1.25) - outward * armR * (sleeve ? 0.45 : 0.25), S[1] + Math.sin(a) * armR * (sleeve ? 1.35 : 1.1)]); }
  const meltPatch = `<path d="${poly(blob)}" fill="${sleeve ? sleeve.col : skin}"/>`;
  if (!sleeve) o += meltPatch;
  const nrm = [-u[1] * outward, u[0] * outward]; // outer side of the arm
  const outer = catmull([[S[0] - outward * armR * 1.6, S[1] - armR * 1.05], [S[0] + outward * armR * 0.2, S[1] - armR * 1.15], [S[0] + nrm[0] * armR * 1.02 + u[0] * armR * 0.6, S[1] + nrm[1] * armR * 1.02 + u[1] * armR * 0.6],
    [S[0] + nrm[0] * armR + u[0] * armR * 1.8, S[1] + nrm[1] * armR + u[1] * armR * 1.8]], 8, false);
  if (!sleeve) o += ink(outer, WT.sil * 0.85, { taper: [0.6, 0.05] }); // clothes: the torso silhouette already draws the shoulder
  if (sleeve) { // cloth sleeve over the upper arm and part of the forearm, with a cuff
    const k = sleeve.len ?? 0.55, C2 = [E[0] + (W[0] - E[0]) * k, E[1] + (W[1] - E[1]) * k];
    o += limb(k > 0.3 ? [S, E1, Em, E2, C2] : [S, E1, Em, C2], (r[0] + r[1]) / 2 * (sleeve.fat || 1.32), { col: sleeve.col, sh: sleeve.sh });
    const n2 = [-d[1], d[0]], cw = r[2] * 1.45; o += ink([[C2[0] + n2[0] * cw, C2[1] + n2[1] * cw], [C2[0] - n2[0] * cw, C2[1] - n2[1] * cw]], WT.mid, { taper: [0.1, 0.1] });
    if (sleeve.trim) o += ink([[C2[0] + n2[0] * cw - d[0] * 8, C2[1] + n2[1] * cw - d[1] * 8], [C2[0] - n2[0] * cw - d[0] * 8, C2[1] - n2[1] * cw - d[1] * 8]], 7, { color: sleeve.trim, taper: [0.05, 0.05], amp: 0.4 });
    o += meltPatch; // after the sleeve, so the sleeve's start cap and the kurta outline under it vanish
  }
  o += handStyle === 'chubby' && FINGERS[handPose] !== undefined ? toonHand(handPose, W, d, handScale, handPose === 'palm' ? outward * palmSide : -outward, skin, skinSh, r[2])
    : FINGERS[handPose] !== undefined ? slenderHand(handPose, W, d, handScale, handPose === 'palm' ? outward * palmSide : -outward, skin, skinSh, r[2]) : hand(handPose, W, handAng, hs, skin, skinSh, gold, false, r[2], palmMid);
  if (bracelet === 'kada') { const nb = [-d[1], d[0]], bw = r[2] * 1.2, bc = [W[0] - d[0] * 6 * hs, W[1] - d[1] * 6 * hs];
    const k = [[bc[0] + nb[0] * bw - d[0] * 7, bc[1] + nb[1] * bw - d[1] * 7], [bc[0] + nb[0] * bw + d[0] * 7, bc[1] + nb[1] * bw + d[1] * 7], [bc[0] - nb[0] * bw + d[0] * 7, bc[1] - nb[1] * bw + d[1] * 7], [bc[0] - nb[0] * bw - d[0] * 7, bc[1] - nb[1] * bw - d[1] * 7]];
    return o + fill(k, gold) + inkLoop(catmull(k, 3, true), WT.fine + 1); }
  if (bracelet === 'none') return o;
  // chunky bead bracelet across the wrist (the reference wraps every wrist in big beads)
  const nb = [-d[1], d[0]], bw = r[2] * 1.25, bc = [W[0] - d[0] * 2 * hs, W[1] - d[1] * 2 * hs];
  for (let k = 0; k < 5; k++) { const u = -1 + k / 2, bend = (1 - u * u) * 7 * hs, x = bc[0] + nb[0] * bw * u + d[0] * bend, y = bc[1] + nb[1] * bw * u + d[1] * bend; const br = 11 * hs + (k % 2) * 1.5; // the row bows round the wrist
    o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${br.toFixed(1)}" fill="${gold}"/><circle cx="${(x - br * 0.35).toFixed(1)}" cy="${(y - br * 0.35).toFixed(1)}" r="${(br * 0.3).toFixed(1)}" fill="#fff3c4"/>` + inkLoop(catmull([[0, -br], [br, 0], [0, br], [-br, 0]].map(([a, b2]) => [x + a, y + b2]), 4, true), WT.fine + 0.8); }
  return o;
}
const PALM = '#cf5a74', PALM_SH = '#a9405c', PALM_MID = '#9a6fb4'; // PALM_MID blends blue skin into the red palm // the reference's dusty red palms
// Wrap-around grip, drawn in two layers so the object sits INSIDE the hand:
//   back  = palm heel + far side of the hand (drawn before the object)
//   front = four curled fingers crossing the object's front, stacked, pinky shortest, plus the thumb hooked over the top (drawn after)
// local frame: +x = forearm direction (wrist -> grip), +y = down the object; grip centre at G, object width w.
// Grip as ONE designed key drawing (like the peepal-farm bird hold), not assembled parts.
// Designed on a 70-wide object centred at (0,0) (object axis = local y). Palm cradles the object from underneath,
// fingers curl up over its front as one soft group (two tip creases only), thumb hooks over the near top edge.
// Slim grip, no thumb: thin palm edge behind, a slim finger band across the front with three small rounded tips
// poking past the far edge. Less mass = less blob.
const GRIP_KEY = {
  back: [[-96, 6], [-62, -4], [-40, 0], [-36, 26], [-44, 48], [-70, 50], [-98, 36]],
  front: [[-44, -2], [-12, -6], [22, -4], [40, 2], [50, 8], [48, 15], [53, 20], [50, 28], [53, 33], [49, 41], [40, 47], [22, 50], [-12, 49], [-44, 46]],
};
function gripHand(G, ang, s, w, skin, skinSh, palm) {
  const k = (w / 70);
  const T = q => rot([q[0] * k, q[1] * k], ang).map((v, i) => v + G[i]);
  const P = pts => catmull(pts.map(T), 7, true);
  const L = pts => catmull(pts.map(T), 6, false);
  const backS = P(GRIP_KEY.back), frontS = P(GRIP_KEY.front);
  const back = fill(backS, skin) + inkLoop(backS, WT.mid * 0.9);
  let front = `<path d="${poly(P([[-35, -10], [35, -6], [35, 0], [-35, -2]]))}" fill="#000" opacity="0.14"/>`;
  front += fill(frontS, skin) + clipped(frontS, fill(P([[-50, 36], [60, 36], [60, 60], [-50, 60]]), skinSh)) + inkLoop(frontS, WT.mid * 0.9);
  front += ink(L([[38, 15], [49, 16]]), WT.fine * 1.4, { taper: [0.3, 0.3] }) + ink(L([[38, 29], [50, 30]]), WT.fine * 1.4, { taper: [0.3, 0.3] });
  const wrist = T([-94, 20]);
  return { back, front, wrist };
}
function E_clip(shape, inner) { return clipped(shape, inner); }
// ---------- slender cartoon hands (rules learned from the peepal-farm reference) ----------
// Hand flares from the wrist and is big vs. the forearm; fingers are slender tapered tubes with round tips,
// each with its own curl and gaps between them; plain skin palm, almost no inner lines.
// Local frame: wrist at (0,0), +y = along the forearm away from the wrist, +x = little-finger side (mirror flips it).
const FINGERS = { // short, chubby, close together, gentle curls: cute not spidery
  relax: { th: [[-24, 30], [[-18, 20], [-8, 14]]], f: [[[-18, 60], [[-4, 18], [10, 14]]], [[-4, 63], [[0, 21], [8, 15]]], [[10, 62], [[4, 19], [10, 13]]], [[23, 58], [[8, 15], [10, 10]]]] },
  rest:  null,
  palm:  { th: [[-26, 26], [[-48, 20], [-10, 14]]], f: [[[-18, 60], [[-16, 22], [-4, 14]]], [[-4, 63], [[-5, 25], [0, 16]]], [[10, 62], [[6, 23], [2, 14]]], [[23, 58], [[18, 18], [4, 11]]]] },
  point: { th: [[-22, 36], [[44, 16], [70, 12]]], f: [[[-14, 60], [[-2, 30], [0, 20]]], [[2, 58], [[150, 16]]], [[14, 56], [[156, 15]]], [[25, 52], [[162, 13]]]] },
  fist:  { th: [[-22, 36], [[44, 16], [70, 12]]], f: [[[-12, 56], [[146, 16]]], [[2, 58], [[150, 16]]], [[14, 56], [[156, 15]]], [[25, 52], [[162, 13]]]] },
};
const FR = [10.5, 11, 10.5, 9]; // fingers thicker
// cute cartoon fingers (owner 23 Nov 2026: not blobby, not spidery): short, plump, touching, each one readable
const FINGERS_CUTE = {
  relax: { th: [[-26, 26], [[-30, 16], [-10, 12]]], f: [[[-19, 54], [[-4, 16], [14, 12]]], [[-6, 57], [[0, 18], [12, 13]]], [[7, 56], [[4, 17], [12, 12]]], [[19, 52], [[8, 14], [12, 10]]]] },
  palm:  { th: [[-28, 22], [[-52, 18], [-12, 13]]], f: [[[-19, 54], [[-10, 20], [-2, 13]]], [[-6, 57], [[-3, 22], [0, 14]]], [[7, 56], [[3, 21], [2, 13]]], [[19, 52], [[12, 17], [4, 11]]]] },
  point: { th: [[-22, 32], [[44, 15], [70, 11]]], f: [[[-14, 56], [[-2, 26], [0, 18]]], [[0, 54], [[150, 14]]], [[12, 52], [[156, 13]]], [[23, 48], [[162, 12]]]] },
  fist:  { th: [[-22, 32], [[44, 15], [70, 11]]], f: [[[-13, 52], [[146, 14]]], [[0, 54], [[150, 14]]], [[12, 52], [[156, 13]]], [[23, 48], [[162, 12]]]] },
};
const FR_CUTE = [13.5, 14, 13.5, 12];
function fingerChain(T, base, segs) {
  const pts = [base]; let a = 0, cur = base;
  for (const [da, len] of segs) { a += da * Math.PI / 180; cur = [cur[0] + Math.sin(a) * len, cur[1] + Math.cos(a) * len]; pts.push(cur); }
  return pts.map(T);
}
function slenderHand(pose, W, d, s, mirror, skin, skinSh, wr, cute = false) {
  const FS = cute ? FINGERS_CUTE : FINGERS, FRk = cute ? FR_CUTE : FR, spec = FS[pose] || FS.relax, n = [-d[1] * mirror, d[0] * mirror];
  const T = ([x, y]) => [W[0] + (n[0] * x + d[0] * y) * s, W[1] + (n[1] * x + d[1] * y) * s];
  const R = r => r * s;
  let o = '';
  // fingers first (their bases tuck under the palm), pinky -> index so the index overlaps
  for (let k = 3; k >= 0; k--) { const [b, segs] = spec.f[k]; o += tube(fingerChain(T, b, segs), [R(FRk[k]), R(FRk[k] * 0.98), R(FRk[k] * 0.95)], { col: skin, sh: skinSh, w: WT.mid * (cute ? 0.85 : 0.7), capStart: false, capEnd: true, endTaper: 0.3 }); }
  // palm: flares from the wrist width to the knuckles; inked only on its two outer sides so fingers and wrist melt in
  const w0 = wr / s;
  const palmL = cute ? [[-w0, -6], [-30, 24], [-32, 56]] : [[-w0, -6], [-26, 26], [-30, 60]], palmR = cute ? [[30, 56], [32, 24], [w0, -6]] : [[32, 60], [30, 26], [w0, -6]];
  const palm = catmull(palmL.concat([[-10, 66], [12, 64]], palmR).map(T), 6, true);
  o += fill(palm, skin) + clipped(palm, fill(catmull([[14, -10], [50, -10], [50, 80], [18, 80]].map(T), 3, true), skinSh));
  o += ink(catmull(palmL.map(T), 6, false), WT.mid, { taper: [0.4, 0.2] }) + ink(catmull(palmR.map(T), 6, false), WT.mid, { taper: [0.2, 0.4] });
  // thumb on top
  const [tb, tsegs] = spec.th;
  o += tube(fingerChain(T, tb, tsegs), cute ? [R(15), R(14), R(13)] : [R(12), R(11), R(10)], { col: skin, sh: skinSh, w: WT.mid * (cute ? 0.85 : 0.7), capStart: false, capEnd: true, endTaper: 0.3 });
  return o;
}
// Chubby cartoon "mitten" hand (owner, 23 Nov 2026: Monty's hands looked faulty/spidery). Fingers are one soft block
// with short division lines, a chunky thumb, round tips: the peepal-farm style the owner likes. Same local frame as
// slenderHand: wrist at (0,0), +y along the forearm away from the wrist, +x = little-finger side (mirror flips it).
function chubbyHand(pose, W, d, s, mirror, skin, skinSh, wr) {
  const n = [-d[1] * mirror, d[0] * mirror];
  const T = ([x, y]) => [W[0] + (n[0] * x + d[0] * y) * s, W[1] + (n[1] * x + d[1] * y) * s];
  const w0 = Math.max(18, wr / s);
  const shape = pts => catmull(pts.map(T), 8, true), line = (pts, w = WT.mid) => ink(catmull(pts.map(T), 5, false), w, { taper: [0.3, 0.3] });
  const shade = sh => clipped(sh, fill(catmull([[8, -10], [60, -10], [60, 110], [8, 110]].map(T), 3, true), skinSh));
  let o = '';
  if (pose === 'fist' || pose === 'point') {
    const ball = shape([[-w0, -4], [-34, 18], [-36, 44], [-24, 66], [0, 72], [24, 66], [36, 44], [34, 18], [w0, -4]]);
    if (pose === 'point') { const fin = shape([[-30, 50], [-34, 90], [-30, 118], [-20, 126], [-10, 118], [-8, 88], [-10, 54]]); o += fill(fin, skin) + inkLoop(fin, WT.mid); }
    o += fill(ball, skin) + shade(ball) + inkLoop(ball, WT.mid);
    o += line([[-6, 60], [-4, 70]], WT.fine + 1) + line([[12, 58], [14, 68]], WT.fine + 1) + (pose === 'fist' ? line([[-22, 56], [-20, 66]], WT.fine + 1) : '');
    o += line([[-30, 30], [-8, 40], [14, 38]], WT.mid);                           // thumb wrapped across the front
    return o;
  }
  const open = pose === 'palm';
  const hand = open
    ? shape([[-w0, -4], [-30, 20], [-34, 50], [-34, 80], [-26, 96], [-12, 100], [2, 102], [16, 100], [28, 94], [34, 76], [34, 46], [30, 20], [w0, -4]])
    : shape([[-w0, -4], [-28, 22], [-30, 52], [-26, 78], [-12, 88], [6, 90], [22, 82], [30, 58], [30, 26], [w0, -4]]);
  const thumb = open ? shape([[-26, 14], [-50, 24], [-60, 40], [-54, 50], [-36, 44], [-24, 34]])
                     : shape([[-24, 18], [-40, 30], [-44, 48], [-34, 56], [-22, 46]]);
  o += fill(thumb, skin) + inkLoop(thumb, WT.mid) + fill(hand, skin) + shade(hand) + inkLoop(hand, WT.mid);
  // finger divisions: short soft lines at the tip end only (3 lines = 4 chubby fingers)
  const tip = open ? 100 : 88, base = open ? 66 : 62;
  for (const x of [-14, 2, 18]) o += ink(catmull([[x, tip - 22], [x, tip - 6]].map(T), 3, false), WT.fine, { color: '#9a5a3c', taper: [0.4, 0.4] });
  return o;
}
// Toon hand (owner + review 23 Nov 2026): palm and three short fingers in ONE clean outline with scalloped tips, plus a
// smooth thumb; no knuckle bumps, no spread spidery fingers, not a shapeless mitten. Local frame as slenderHand.
function toonHand(pose, W, d, s, mirror, skin, skinSh, wr) {
  const n = [-d[1] * mirror, d[0] * mirror];
  const T = ([x, y]) => [W[0] + (n[0] * x + d[0] * y) * s, W[1] + (n[1] * x + d[1] * y) * s];
  const w0 = Math.max(17, Math.min(22, wr / s)), sm = pts => catmull(pts.map(T), 7, true);
  const shade = sh => clipped(sh, fill(catmull([[10, -10], [70, -10], [70, 130], [10, 130]].map(T), 3, true), skinSh));
  const draw = sh => fill(sh, skin) + shade(sh) + inkLoop(sh, WT.mid * 1.15);
  const crease = pts => ink(catmull(pts.map(T), 4, false), WT.fine + 0.6, { color: '#9a5a3c', taper: [0.5, 0.5] });
  if (pose === 'fist' || pose === 'point') {
    let o = '';
    if (pose === 'point') o += draw(sm([[-30, 46], [-34, 80], [-32, 110], [-22, 118], [-12, 110], [-10, 78], [-12, 48]]));
    o += draw(sm([[-w0, -4], [-32, 16], [-34, 46], [-26, 66], [-8, 72], [12, 72], [28, 64], [34, 42], [32, 16], [w0, -4]]));
    o += crease([[-4, 52], [-2, 68]]) + crease([[14, 50], [16, 66]]);
    o += ink(catmull([[-30, 24], [-10, 36], [12, 34]].map(T), 4, false), WT.mid, { taper: [0.3, 0.3] });   // thumb across the fist
    return o;
  }
  const open = pose === 'palm';
  const hand = open
    ? sm([[-w0, -4], [-28, 24], [-30, 60], [-26, 86], [-17, 93], [-10, 84], [-8, 70], [-5, 90], [3, 97], [10, 88], [10, 70], [14, 86], [22, 88], [28, 76], [30, 50], [27, 22], [w0, -4]])
    : sm([[-w0, -4], [-28, 22], [-30, 52], [-26, 74], [-18, 80], [-10, 72], [-8, 62], [-4, 78], [4, 84], [12, 76], [12, 62], [16, 74], [24, 76], [30, 62], [30, 34], [26, 14], [w0, -4]]);
  const thumb = open ? sm([[-24, 16], [-42, 22], [-56, 36], [-54, 48], [-40, 46], [-26, 34]]) : sm([[-22, 16], [-36, 28], [-40, 46], [-30, 52], [-22, 40]]);
  return draw(thumb) + draw(hand);
}
// drawn hand key-poses (swapped, not transformed into each other)
function hand(pose, wrist, angle, s, skin, skinSh, gold, band = true, wr = 0, palmMid = null) {
  const w = wr ? wr / s : 0; // wrist half-width in hand units: the hand narrows into the forearm's exact width
  const T = p => rot([p[0] * s, p[1] * s], angle).map((v, i) => v + wrist[i]);
  const shp = (pts, n = 8) => catmull(pts.map(T), n, true);
  const line = (pts, w, opt = {}) => ink(catmull(pts.map(T), 6, false), w, opt);
  let o = '';
  if (pose === 'point') { // built like the reference: palm toward us in dusty red, long round-tipped index, lumpy curled-finger cluster, one thumb crease
    const HP = [[-w, 40], [-w, 8], [-44, -4], [-50, -32], [-46, -60], [-34, -72], [-24, -80], [-24, -112], [-20, -146], [-12, -166], [0, -170], [8, -160], [8, -126], [10, -96],
      [18, -98], [28, -104], [38, -98], [46, -102], [56, -92], [60, -80], [70, -74], [72, -60], [66, -50], [72, -40], [66, -26], [58, -20], [54, -6], [44, 4], [w, 8], [w, 40]];
    const H = shp(HP, 7), Hopen = catmull(HP.map(T), 7, false);
    const palm = shp([[-36, -62], [-20, -146], [-10, -162], [0, -154], [2, -98], [16, -82], [40, -56], [46, -26], [36, -2], [-34, -2], [-42, -30]], 7);
    o += fill(H, skin) + fill(palm, PALM) + clipped(palm, fill(shp([[-40, -60], [-24, -150], [-30, -170], [-60, -60]]), PALM_SH));
    o += ink(Hopen, WT.mid, { amp: 1.5, prof: u => 0.55 + 0.45 * Math.sin(Math.PI * u * 3) ** 2, taper: [0.25, 0.25] });
    o += line([[-46, -40], [-16, -58], [14, -60], [26, -50]], WT.fine * 1.6, { amp: 1.4 }); // thumb crease
  } else if (pose === 'palm') { // raised open palm toward us (stop / arms up): grouped short fingers up, thumb out, rim + red palm
    const HP = [[-w, 40], [-w, 6], [-44, -8], [-52, -24], [-62, -32], [-64, -46], [-54, -52], [-44, -46],
      [-44, -58], [-44, -78], [-36, -88], [-26, -86], [-22, -74], [-19, -76], [-18, -92], [-9, -100], [1, -97], [3, -82],
      [6, -82], [9, -94], [18, -98], [26, -92], [25, -78], [28, -74], [34, -84], [42, -84], [44, -72], [44, -36], [w, 6], [w, 40]];
    const H = shp(HP, 6), Hopen = catmull(HP.map(T), 6, false);
    const cy = -50, rim = shp(HP.slice(2, -2).map(([x, y]) => [x * 0.86, cy + (y - cy) * 0.88]), 6), inner = shp(HP.slice(2, -2).map(([x, y]) => [x * 0.72, cy + (y - cy) * 0.76]), 6);
    o += fill(H, skin) + fill(rim, palmMid || PALM_MID) + fill(inner, PALM) + clipped(inner, fill(shp([[14, 0], [60, 0], [60, -120], [10, -120]]), PALM_SH));
    o += ink(Hopen, WT.mid, { amp: 1.3, prof: u => 0.6 + 0.4 * Math.sin(Math.PI * u * 4) ** 2, taper: [0.25, 0.25] });
    o += line([[-22, -74], [-21, -66]], WT.fine) + line([[3, -82], [2, -74]], WT.fine) + line([[25, -78], [24, -70]], WT.fine * 0.9);
  } else if (pose === 'fist') { // cheering fist: round knuckle lumps on top, thumb wrapped across
    const HP = [[-w, 40], [-w, 6], [-44, -6], [-50, -34], [-44, -60], [-30, -70], [-18, -66], [-6, -74], [8, -70], [20, -76], [34, -68], [46, -56], [50, -30], [44, -6], [w, 6], [w, 40]];
    const H = shp(HP, 6), Hopen = catmull(HP.map(T), 6, false);
    o += fill(H, skin) + clipped(H, fill(shp([[20, -90], [70, -80], [70, 20], [16, 20]]), skinSh));
    o += ink(Hopen, WT.mid, { amp: 1.3, taper: [0.25, 0.25] });
    o += line([[-18, -64], [-16, -52]], WT.fine) + line([[8, -68], [8, -56]], WT.fine) + line([[-46, -36], [-20, -40], [6, -34], [14, -24]], WT.fine * 1.5);
  } else { // varada-style open hand, palm toward us like the reference: skin rim all round, dusty red palm and finger fronts,
          // four fingers of different lengths with small notches between them, thumb out to the side, one crease
    // soft mitten: short fingers grouped together (shallow notches), round tips, chubby thumb
    const HP = [[-w, -40], [-w, -6], [-44, 8], [-52, 24], [-62, 32], [-64, 46], [-54, 52], [-44, 46],
      [-44, 58], [-44, 78], [-36, 88], [-26, 86], [-22, 74],
      [-19, 76], [-18, 92], [-9, 100], [1, 97], [3, 82],
      [6, 82], [9, 94], [18, 98], [26, 92], [25, 78],
      [28, 74], [34, 84], [42, 84], [44, 72], [44, 36], [w, -6], [w, -40]];
    const H = shp(HP, 6), Hopen = catmull(HP.map(T), 6, false);
    const cx = 0, cy = 50, rim = shp(HP.slice(2, -2).map(([x, y]) => [cx + (x - cx) * 0.86, cy + (y - cy) * 0.88]), 6), inner = shp(HP.slice(2, -2).map(([x, y]) => [cx + (x - cx) * 0.72, cy + (y - cy) * 0.76]), 6);
    if (pose === 'relax') o += fill(H, skin) + clipped(H, fill(shp([[14, 0], [60, 0], [60, 120], [10, 120]]), skinSh));
    else o += fill(H, skin) + fill(rim, palmMid || PALM_MID) + fill(inner, PALM) + clipped(inner, fill(shp([[14, 0], [60, 0], [60, 120], [10, 120]]), PALM_SH)); // skin -> blend tone -> palm: no hard split
    o += ink(Hopen, WT.mid, { amp: 1.3, prof: u => 0.6 + 0.4 * Math.sin(Math.PI * u * 4) ** 2, taper: [0.25, 0.25] });
    o += line([[-22, 74], [-21, 66]], WT.fine) + line([[3, 82], [2, 74]], WT.fine) + line([[25, 78], [24, 70]], WT.fine * 0.9); // short finger splits only
    o += line([[-46, 30], [-28, 40], [-14, 56]], WT.fine * 1.6, { amp: 1.2 }); // thumb crease
  }
  if (!band) return o;
  const b = shp([[-50, 10], [-48, -12], [50, -12], [52, 10], [0, 18]], 6);
  return o + fill(b, gold) + inkLoop(b, WT.fine + 1.5);
}

// Rhubarb mouth set (A-F + X rest smirk), drawn at (x,y)
function mouth(v, x, y, s, col) {
  const P = pts => pts.map(p => [x + p[0] * s, y + p[1] * s]);
  const shape = pts => catmull(P(pts), 7, true);
  const tongue = pts => fill(catmull(P(pts), 6, true), col.tongue);
  const teeth = pts => fill(catmull(P(pts), 6, true), col.teeth);
  let m;
  switch (v) {
    case 'A': return ink(catmull(P([[-32, 2], [0, 10], [34, -2]]), 8, false), WT.mid);
    case 'B': m = shape([[-34, -2], [0, 5], [34, -5], [22, 18], [-20, 18]]); return fill(m, col.mouth) + teeth([[-26, 2], [0, 7], [26, -2], [22, 8], [-22, 9]]) + inkLoop(m, WT.mid);
    case 'C': m = shape([[-36, -4], [0, 2], [36, -6], [26, 32], [0, 40], [-26, 32]]); return fill(m, col.mouth) + tongue([[-18, 30], [0, 22], [18, 30], [0, 37]]) + teeth([[-28, 0], [0, 5], [28, -3], [24, 8], [-24, 9]]) + inkLoop(m, WT.mid);
    case 'D': m = shape([[-40, -6], [0, -1], [40, -9], [32, 46], [0, 60], [-32, 46]]); return fill(m, col.mouth) + tongue([[-22, 46], [0, 32], [22, 46], [0, 57]]) + teeth([[-30, -3], [0, 2], [30, -6], [27, 7], [-27, 8]]) + inkLoop(m, WT.mid);
    case 'E': m = shape([[-22, 0], [0, -6], [22, 0], [16, 26], [-16, 26]]); return fill(m, col.mouth) + tongue([[-12, 20], [0, 15], [12, 20], [0, 25]]) + inkLoop(m, WT.mid);
    case 'F': m = shape([[-12, 0], [0, -6], [12, 0], [8, 16], [-8, 16]]); return fill(m, col.mouth) + inkLoop(m, WT.mid);
    default: return ink(catmull(P([[-30, 4], [-2, 11], [24, -4], [38, -18]]), 8, false), WT.mid, { taper: [0.3, 0.1] }) + ink(catmull(P([[30, -10], [38, -2], [36, 8]]), 6, false), WT.fine);
  }
}

module.exports = { limb, gripHand, INK, WT, S, lerp, clamp, ease, backOut, rad, track, catmull, rot, poly, mirror, ink, inkLoop, fill, clipped, part, tube, hand, arm, mouth };
