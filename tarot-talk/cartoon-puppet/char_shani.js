// Shani dev: judge of karma. Majestic, calm, fatherly. Never looks into the lens. Seated on his throne (feet hidden).
// Props (trishul, KARMA register) float beside him by his power — no hand grips. Crow (vahana) on his left shoulder.
const E = require('./engine');
const { WT, catmull, mirror, ink, inkLoop, fill, clipped, part, arm, rot, clamp } = E;

const C = {
  skin: '#2f4f8f', skinSh: '#22386a', skinLine: '#152447', blush: '#6a5ab0',
  hair: '#101018', hairHi: '#33354a', white: '#f4f2ea', iris: '#111', mouth: '#3a1220', tongue: '#c75a70', teeth: '#f6f1e4',
  gold: '#e9b934', goldSh: '#b9861a', goldHi: '#ffe7a0', goldLine: '#7a4f0c', sapphire: '#2f6bff', sapphireHi: '#9fc0ff',
  dhoti: '#1b1b22', dhotiSh: '#0e0e14', band: '#e9b934', throne: '#3b3550', throneSh: '#2a2540', crow: '#17161c', crowSh: '#2c2b36',
};
const gem = (x, y, r, col, w) => { const b = catmull([[0, -r * 1.35], [r * 1.35, 0], [0, r * 1.35], [-r * 1.35, 0]].map(([a, c]) => [x + a, y + c]), 5, true), st = catmull([[0, -r], [r, 0], [0, r], [-r, 0]].map(([a, c]) => [x + a, y + c]), 5, true);
  return fill(b, C.gold) + inkLoop(b, w * 0.8) + fill(st, col) + `<path d="M${x - r * 0.5} ${y - r * 0.2} L${x} ${y - r * 0.7} L${x + r * 0.15} ${y - r * 0.1} Z" fill="#fff" opacity="0.75"/>` + inkLoop(st, w * 0.6); };

function halo(p) { const [x, y] = p.head, g = p.glow || 0;
  return `<circle cx="${x}" cy="${y - 60}" r="${330 + g * 40}" fill="url(#shaniHalo)" opacity="${0.45 + g * 0.5}"/>` +
    `<circle cx="${x}" cy="${y - 60}" r="290" fill="none" stroke="${C.gold}" stroke-width="${12 + g * 6}" opacity="0.95"/>` +
    `<circle cx="${x}" cy="${y - 60}" r="290" fill="none" stroke="${C.goldHi}" stroke-width="3" opacity="${0.4 + g * 0.6}"/>`; }

function head(p) {
  const g = [];
  const face = catmull(mirror([[0, -205], [150, -176], [214, -64], [220, 40], [196, 132], [118, 196], [0, 214]]), 10, true);
  const hb = catmull(mirror([[0, -290], [196, -236], [250, -80], [262, 120], [282, 300], [150, 280]]), 8, true);
  g.push(fill(hb, C.hair) + inkLoop(hb, WT.sil));
  for (const s of [-1, 1]) { const ear = catmull([[s * 206, -24], [s * 250, -16], [s * 254, 52], [s * 216, 86]], 6, true); g.push(part(ear, C.skinSh, { w: WT.mid })); g.push(gem(s * 236, 118, 11, C.sapphire, WT.mid)); }
  g.push(fill(face, C.skin) + clipped(face, `<rect x="-230" y="-70" width="460" height="50" fill="${C.skinSh}" opacity="0.35"/>` + fill(catmull([[110, -240], [178, -60], [176, 90], [60, 240], [320, 260], [320, -240]], 8, true), C.skinSh)));
  g.push(ink(face.slice(Math.floor(face.length * 0.06), Math.floor(face.length * 0.6)), WT.sil * 1.1, { prof: u => 0.35 + 0.65 * Math.sin(Math.PI * u), taper: [0.3, 0.2] }));
  g.push(ink(face.slice(Math.floor(face.length * 0.55)).concat(face.slice(0, Math.floor(face.length * 0.1))), WT.sil * 0.8, { taper: [0.2, 0.35] }));
  // tilak: three horizontal ash lines with a dot (tripundra)
  for (const y of [-142, -126, -110]) g.push(ink([[-54, y], [0, y - 4], [54, y]], 7, { color: '#d9d4c8', taper: [0.3, 0.3], amp: 0.4 }));
  g.push(`<circle cx="0" cy="-124" r="8" fill="#d22f48"/>`);
  // ---- eyes: almond shape, layered iris (streaks, limbal ring, inner ring), pupil, catchlights, upper lid with tilt,
  //      lower lid, mood glow. Moods: calm, stern, warm, deadpan, hisaab.
  const MOODS = {
    calm:    { lid: 0.46, tilt: 0.12, lower: 0.34, pupil: 8.5, iris: '#c7891f', irisHi: '#f3c35a', glow: 0, hl: 1, brow: 0.55 },
    stern:   { lid: 0.52, tilt: 0.55, lower: 0.42, pupil: 5,   iris: '#e2661a', irisHi: '#ffd067', glow: 1, hl: 1, brow: 1.25, rays: 1 },
    warm:    { lid: 0.40, tilt: -0.05, lower: 0.45, pupil: 11,  iris: '#b98325', irisHi: '#f6d27a', glow: 0, hl: 2, brow: 0.35 },
    deadpan: { lid: 0.55, tilt: 0,    lower: 0.3, pupil: 7.5, iris: '#a8781f', irisHi: '#e8b85a', glow: 0, hl: 1, brow: 0.5, flat: 1 },
    hisaab:  { lid: 0.24, tilt: 0.05, lower: 0.22, pupil: 8,   iris: '#e0a628', irisHi: '#fff0a6', glow: 0.8, hl: 2, brow: 0.6, rays: 0.6, gold: 1 },
  };
  const mo0 = MOODS[p.eyeMood || (p.stern > 0.5 ? 'stern' : 'calm')], mo1 = { ...mo0, lid: p.blink ? 0.9 : (p.lid ?? mo0.lid) };
  const look = p.lookX ?? -40, ly = p.lookY ?? 6, seed = E.S.boil * 3.7;
  for (const s of [-1, 1]) {
    const cx = s * 86, cy = -8, rx = 52, ry = 42;
    const lb = 1 - mo1.lower * 0.55; // squint lifts the bottom edge
    const ey = catmull([[cx - rx, cy + 6], [cx - rx * 0.55, cy - ry], [cx + rx * 0.45, cy - ry * 1.02], [cx + rx, cy - 2], [cx + rx * 0.5, cy + ry * 0.92 * lb], [cx - rx * 0.5, cy + ry * 0.9 * lb]], 8, true);
    const px = cx + look, py = cy + ly, IR = 24, PR = mo1.pupil;
    let inner = '';
    if (mo1.glow) inner += `<circle cx="${px}" cy="${py}" r="${IR + 16}" fill="${mo1.gold ? '#ffe9a0' : '#ff9a3a'}" opacity="${0.45 * mo1.glow}"/>`;
    inner += `<circle cx="${px}" cy="${py}" r="${IR}" fill="${mo1.iris}"/>`;
    inner += `<circle cx="${px}" cy="${py + 6}" r="${IR * 0.78}" fill="${mo1.irisHi}" opacity="0.55"/>`; // lighter lower iris
    for (let k = 0; k < 14; k++) { const a2 = Math.PI * 2 * k / 14 + 0.2; inner += `<line x1="${(px + Math.cos(a2) * (PR + 3)).toFixed(1)}" y1="${(py + Math.sin(a2) * (PR + 3)).toFixed(1)}" x2="${(px + Math.cos(a2) * IR * 0.86).toFixed(1)}" y2="${(py + Math.sin(a2) * IR * 0.86).toFixed(1)}" stroke="#5a3108" stroke-width="1.6" opacity="0.55"/>`; }
    if (mo1.rays) for (let k = 0; k < 8; k++) { const a2 = Math.PI * 2 * k / 8 + seed; inner += `<line x1="${(px + Math.cos(a2) * (PR + 4)).toFixed(1)}" y1="${(py + Math.sin(a2) * (PR + 4)).toFixed(1)}" x2="${(px + Math.cos(a2) * IR).toFixed(1)}" y2="${(py + Math.sin(a2) * IR).toFixed(1)}" stroke="#fff3b0" stroke-width="2.4" opacity="${0.7 * mo1.rays}"/>`; }
    inner += `<circle cx="${px}" cy="${py}" r="${IR}" fill="none" stroke="#2a1404" stroke-width="4.5"/>`; // limbal ring
    inner += `<circle cx="${px}" cy="${py}" r="${PR + 3}" fill="none" stroke="#6b3a0a" stroke-width="2.2" opacity="0.7"/>`; // collarette
    inner += `<circle cx="${px}" cy="${py}" r="${PR}" fill="#0b0705"/>`;
    inner += `<ellipse cx="${px + 8}" cy="${py - 9}" rx="6.5" ry="5" fill="#fff" transform="rotate(-25 ${px + 8} ${py - 9})"/>`;
    if (mo1.hl > 1) inner += `<circle cx="${px - 9}" cy="${py + 8}" r="3" fill="#fff" opacity="0.9"/><circle cx="${px + 13}" cy="${py + 4}" r="1.8" fill="#fff" opacity="0.8"/>`;
    // upper lid: closes to mo1.lid, slanted toward the nose by tilt (intensity)
    const ul = x => cy - ry + 2 * ry * mo1.lid + mo1.tilt * s * (x - cx) * -0.42;
    const lidPath = [[cx - rx - 8, ul(cx - rx - 8)], [cx - rx * 0.3, ul(cx - rx * 0.3) - (mo1.flat ? 0 : 5)], [cx + rx * 0.3, ul(cx + rx * 0.3) - (mo1.flat ? 0 : 5)], [cx + rx + 8, ul(cx + rx + 8)]];
    inner += `<path d="${E.poly(lidPath.concat([[cx + rx + 8, cy - ry - 60], [cx - rx - 8, cy - ry - 60]]))}" fill="${C.skin}"/>`;
    // lower lid pushing up
    const lyy = cy + ry - 2 * ry * mo1.lower * 0.55;
    g.push(fill(ey, C.white, 0) + clipped(ey, `<rect x="${cx - rx}" y="${cy - ry}" width="${2 * rx}" height="${ry * 0.5}" fill="#c9c2b0" opacity="0.5"/>` + inner) + ink(catmull([[cx - rx, cy + 6], [cx - rx * 0.5, cy + ry * 0.9 * lb], [cx + rx * 0.5, cy + ry * 0.92 * lb], [cx + rx, cy - 2]], 6, false), WT.fine * 1.8, { taper: [0.4, 0.4] }));
    g.push(`<path d="M${ey.slice(0, Math.floor(ey.length * 0.55)).map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L')}" fill="none" stroke="${C.skin}" stroke-width="5"/>`); // hide the antialias seam above the lid
    g.push(ink(catmull(s > 0 ? lidPath : lidPath.slice().reverse(), 8, false), 11, { prof: u => 0.25 + 0.75 * Math.pow(u, 0.7), taper: [0.35, 0.02], amp: 0.3 })); // crisp lash line, thin at the nose, heavy at the outer corner
    g.push(ink([[cx + s * (rx + 2), ul(cx + s * (rx + 2)) + 1], [cx + s * (rx + 20), ul(cx + s * (rx + 2)) - 9]], 8, { taper: [0.05, 0.9], amp: 0.2 })); // sharp outer flick
    // the lid as a real flap of skin: thickness band above the lash line, and the fold crease that follows the lid
    const fold = lidPath.map(([x, y], i) => [x, y - 16 - (i === 1 || i === 2 ? 6 : 0) - (1 - mo1.lid) * 8]);
    g.push(ink(catmull([[cx - s * rx * 0.15, fold[1][1] + 2], [cx + s * rx * 0.4, fold[2][1] - 2], [cx + s * rx * 0.95, ul(cx + s * rx) - 14]], 6, false), 4.5, { color: C.skinLine, taper: [0.5, 0.4], amp: 0.3 }));

    // brows: thick, inner end pulled down by mood
    const bw = mo1.brow + (p.stern || 0) * 0.2, by = cy - ry - 20;
    g.push(ink(catmull([[cx - s * 60, by + bw * 24], [cx - s * 12, by - 10 + bw * 6], [cx + s * 60, by - bw * 6]], 6, false), 22, { prof: u => 0.55 + 0.45 * Math.sin(Math.PI * (0.15 + 0.7 * u)), taper: [0.15, 0.4] }));
    if (bw > 1) g.push(ink([[s * 14, by - 4], [s * 20, by + 22]], 4, { color: C.skinLine, taper: [0.3, 0.3] })); // furrow line
  }
  g.push(ink(catmull([[-6, 42], [-18, 72], [4, 78]], 5, false), WT.fine * 1.6, { color: C.skinLine, taper: [0.3, 0.3] }));
  // thick moustache (curled tips) and mouth
  const ms = catmull([[0, 104], [40, 96], [86, 104], [112, 92], [124, 74], [118, 98], [92, 122], [46, 120], [0, 112], [-46, 120], [-92, 122], [-118, 98], [-124, 74], [-112, 92], [-86, 104], [-40, 96]], 5, true);
  // ---- mouth: angular cartoon shapes tucked under the moustache, chin crease, mood-driven ----
  // mood: calm | stern | warm | deadpan | hisaab ; talk 0..1 opens the current mood's talking shape
  const mood = p.eyeMood || (p.stern > 0.5 ? 'stern' : 'calm'), talk = p.talk || 0, my = 132;
  const L = (pts, w = WT.mid * 1.25, o = {}) => ink(catmull(pts, 4, false), w, { taper: [0.25, 0.25], amp: 0.3, ...o });
  const openShape = (top, bot, wTop, wBot, skew = 0) => [[-wTop, my + top], [wTop, my + top + skew], [wBot, my + bot], [-wBot * 0.9, my + bot - skew * 0.5]];
  const mouthOpen = (pts, teeth = true, tongue = true) => { // flat-topped trapezoid, sharp corners (no blob)
    const P = pts.map(q => q.slice()); let o = `<path d="${E.poly(P)}" fill="${C.mouth}"/>`;
    const id = 'mc' + (E.S.uid++); o += `<clipPath id="${id}"><path d="${E.poly(P)}"/></clipPath><g clip-path="url(#${id})">`;
    if (teeth) o += `<rect x="-60" y="${P[0][1] - 2}" width="120" height="9" fill="${C.teeth}"/>`;
    if (tongue) o += `<ellipse cx="4" cy="${Math.max(P[2][1], P[3][1]) + 4}" rx="22" ry="12" fill="${C.tongue}"/>`;
    o += '</g>' + `<path d="M${P.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L')} Z" fill="none" stroke="${E.INK}" stroke-width="${WT.mid}" stroke-linejoin="miter"/>`;
    return o; };
  if (talk > 0.08) { // talking: shape per mood, opening by 'talk'
    const h = 18 + talk * 40;
    if (mood === 'stern') g.push(mouthOpen(openShape(0, h * 0.7, 52, 42, -5), true, false) + L([[-42, my + h * 0.7 - 4], [42, my + h * 0.7 - 5]], WT.fine * 1.4)); // barked, teeth bared, wide and short
    else if (mood === 'hisaab') g.push(mouthOpen(openShape(0, h, 46, 30, 0), true, true)); // declaring: square-ish, steady
    else g.push(mouthOpen(openShape(2, h * 0.85, 36, 24, 4), true, true)); // calm speech: small, slightly lopsided
  } else if (mood === 'stern') { // set jaw: gritted teeth line
    g.push(mouthOpen(openShape(0, 16, 46, 46, 0), true, false) + L([[-46, my + 8], [46, my + 8]], WT.fine) + [-24, 0, 24].map(x => L([[x, my + 1], [x, my + 15]], WT.fine * 0.9)).join(''));
  } else if (mood === 'warm') { // one-sided knowing smirk (fatherly)
    g.push(L([[-40, my + 14], [-6, my + 18], [28, my + 10], [50, my - 4]]) + L([[44, my], [54, my + 8]], WT.fine * 1.4));
  } else if (mood === 'deadpan') { // dead straight, tiny corner tick
    g.push(L([[-42, my + 12], [42, my + 12]]) + L([[-42, my + 12], [-50, my + 18]], WT.fine * 1.3));
  } else if (mood === 'hisaab') { // closed resolve: firm line, corners down a touch
    g.push(L([[-44, my + 18], [0, my + 11], [44, my + 18]]));
  } else { // calm: slight frown, judging
    g.push(L([[-42, my + 18], [-14, my + 11], [16, my + 11], [42, my + 19]]));
  }
  g.push(L([[-16, my + 58], [0, my + 62], [16, my + 58]], WT.fine * 1.3, { color: C.skinLine })); // chin crease
  const lift = -talk * 6; g.push(`<g transform="translate(0 ${lift.toFixed(1)})">` + fill(ms, C.hair) + inkLoop(ms, WT.mid) + ink(catmull([[-60, 102], [-20, 106]], 3, false), 4, { color: C.hairHi }) + ink(catmull([[20, 106], [60, 102]], 3, false), 4, { color: C.hairHi }) + '</g>');
  // crown: tall dark-gold mukut with a blue neelam
  const CY = y => -170 + (y + 170) * 0.72;
  const crown = catmull(mirror([[0, CY(-520)], [34, CY(-486)], [56, CY(-430)], [120, CY(-394)], [160, CY(-330)], [186, CY(-250)], [192, -168], [0, -196]]), 6, true);
  g.push(part(crown, C.gold, { sh: C.goldSh, shPts: [[50, -540], [210, -360], [210, -150], [70, -190], [60, -380]].map(([x, y]) => [x, CY(y)]), w: WT.sil }));
  g.push(clipped(crown, ink(catmull([[-170, -214], [0, -246], [170, -214]], 6, false), 3.2, { color: C.goldLine }) + ink(catmull([[-130, -282], [0, -310], [130, -282]], 6, false), 3.2, { color: C.goldLine })));
  const band = catmull([[-182, -150], [0, -206], [182, -150], [172, -116], [0, -170], [-172, -116]], 8, true);
  g.push(part(band, C.goldSh, { w: WT.mid }));
  g.push(gem(0, -262, 24, C.sapphire, WT.mid));
  for (const x of [-110, 110]) g.push(gem(x, -158, 8, C.sapphire, WT.mid));
  g.push(gem(0, CY(-525), 10, C.sapphire, WT.mid));
  return `<g transform="translate(${p.head[0].toFixed(1)} ${p.head[1].toFixed(1)}) rotate(${(p.tilt || 0).toFixed(2)})">${g.join('')}</g>`;
}

function throne() {
  const backS = catmull([[300, 700], [780, 700], [800, 1340], [280, 1340]], 3, true);
  let o = part(backS, C.throne, { sh: C.throneSh, shPts: [[620, 690], [810, 690], [810, 1350], [640, 1350]], w: WT.sil });
  o += ink(catmull([[330, 740], [540, 690], [750, 740]], 6, false), 10, { color: C.gold, taper: [0.1, 0.1], amp: 0.3 });
  for (const sgn of [-1, 1]) { const arm2 = catmull([[540 + sgn * 230, 1080], [540 + sgn * 330, 1070], [540 + sgn * 340, 1120], [540 + sgn * 330, 1360], [540 + sgn * 270, 1360], [540 + sgn * 262, 1120]], 5, true);
    o += part(arm2, C.throne, { sh: C.throneSh, shPts: arm2.map(([x, y]) => [x + sgn * 12, y + 16]), w: WT.mid * 1.3 }) + gem(540 + sgn * 300, 1096, 12, C.sapphire, WT.mid); }
  return o;
}
function torso(p) {
  const b = p.breath || 0, T = q => [540 + (q[0] - 540) * (1 + b * 0.012), q[1] - b * 3 * (1240 - q[1]) / 360];
  const sh = catmull([[470, 900], [400, 910], [348, 940], [326, 990], [338, 1060], [362, 1150], [376, 1240], [704, 1240], [718, 1150], [742, 1060], [754, 990], [732, 940], [680, 910], [610, 900]].map(T), 10, true); // deltoids are part of the body outline
  let o = fill(sh, C.skin) + clipped(sh, fill(catmull([[660, 1010], [740, 1010], [740, 1250], [650, 1250]].map(T), 6, true), C.skinSh) +
    fill(catmull([[620, 906], [690, 930], [430, 1240], [360, 1240]].map(T), 6, true), '#16161c') + ink(catmull([[620, 906], [360, 1240]].map(T), 4, false), 5, { color: C.gold, taper: [0.05, 0.05] }) + ink(catmull([[690, 930], [430, 1240]].map(T), 4, false), 5, { color: C.gold, taper: [0.05, 0.05] }));
  o += inkLoop(sh, WT.sil);
  const collar = catmull([[430, 912], [490, 990], [540, 1004], [590, 990], [650, 912], [624, 904], [540, 968], [456, 904]].map(T), 6, true);
  o += part(collar, C.gold, { sh: C.goldSh, shPts: [[540, 940], [680, 900], [680, 1010], [540, 1010]].map(T), w: WT.mid });
  const pend = T([540, 1030]); o += gem(pend[0], pend[1], 15, C.sapphire, WT.mid);
  return o;
}
function dhotiStanding(p) {
  const b = p.breath || 0;
  const D = catmull([[352, 1200], [540, 1188], [728, 1200], [760, 1420], [800, 1700], [690, 1730], [540, 1716], [390, 1730], [280, 1700], [320, 1420]], 8, true);
  let o = part(D, C.dhoti, { sh: C.dhotiSh, shPts: [[560, 1200], [820, 1200], [820, 1740], [560, 1740]], w: WT.sil });
  o += ink(catmull([[290, 1680], [400, 1708], [540, 1696], [690, 1708], [790, 1680]], 6, false), 10, { color: C.band, taper: [0.05, 0.05], amp: 0.3 });
  for (const f of [[[470, 1230], [440, 1700]], [[540, 1226], [540, 1700]], [[610, 1230], [650, 1700]], [[400, 1300], [340, 1680]], [[680, 1300], [740, 1680]]]) o += ink(catmull(f, 4, false), WT.fine * 1.6, { color: '#3a3a48', taper: [0.3, 0.3] });
  const wb = catmull([[352, 1190], [540, 1176], [728, 1190], [728, 1222], [540, 1208], [352, 1222]], 6, true);
  o += part(wb, C.gold, { sh: C.goldSh, shPts: [[540, 1170], [740, 1170], [740, 1230], [540, 1230]], w: WT.mid });
  return `<ellipse cx="540" cy="1730" rx="330" ry="34" fill="#000" opacity="0.35"/>` + o;
}
function lap() {
  const L = catmull([[350, 1210], [540, 1196], [730, 1210], [820, 1300], [800, 1400], [540, 1420], [280, 1400], [260, 1300]], 8, true);
  let o = part(L, C.dhoti, { sh: C.dhotiSh, shPts: [[560, 1300], [840, 1290], [840, 1430], [560, 1430]], w: WT.sil });
  o += ink(catmull([[300, 1380], [540, 1398], [780, 1380]], 6, false), 9, { color: C.band, taper: [0.05, 0.05], amp: 0.3 });
  const wb = catmull([[352, 1200], [540, 1186], [728, 1200], [728, 1230], [540, 1218], [352, 1230]], 6, true);
  o += part(wb, C.gold, { sh: C.goldSh, shPts: [[540, 1180], [740, 1180], [740, 1240], [540, 1240]], w: WT.mid });
  for (const f of [[[460, 1240], [430, 1390]], [[540, 1236], [540, 1396]], [[620, 1240], [650, 1390]]]) o += ink(catmull(f, 4, false), WT.fine * 1.5, { color: '#3a3a48', taper: [0.3, 0.3] });
  return o;
}
function crow(p) { // perched on his left shoulder; KAA opens the beak
  const x = p.crowAt ? p.crowAt[0] : 262, y = p.crowAt ? p.crowAt[1] : 930, tl = p.crowTilt || 0, ka = p.kaa || 0;
  const T = q => rot([q[0] * 1.5, q[1] * 1.5], tl * Math.PI / 180).map((v, i) => v + [x, y][i]);
  const body = catmull([[-50, 0], [-30, -40], [10, -50], [48, -30], [60, 10], [40, 40], [-10, 46], [-60, 30]].map(T), 6, true);
  let o = part(body, C.crow, { sh: C.crowSh, shPts: [[-60, 10], [60, 10], [60, 60], [-60, 60]].map(T), w: WT.mid });
  o += part(catmull([[-56, 10], [-110, 34], [-104, 50], [-50, 36]].map(T), 4, true), C.crow, { w: WT.mid }); // tail
  o += ink(catmull([[-30, -8], [10, 6], [40, 0]].map(T), 4, false), WT.fine * 1.5, { color: '#5a5a6c' }) + ink(catmull([[-40, -24], [-10, -44], [30, -46]].map(T), 4, false), 6, { color: '#6d7fb8', taper: [0.3, 0.3] }); // wing + blue rim light
  const hd = catmull([[20, -40], [40, -84], [74, -92], [96, -70], [88, -40], [56, -26]].map(T), 6, true);
  o += part(hd, C.crow, { w: WT.mid });
  const bk1 = catmull([[90, -74], [134, -68 - ka * 10], [92, -60]].map(T), 3, true), bk2 = catmull([[90, -60], [128, -54 + ka * 18], [88, -48]].map(T), 3, true);
  o += part(bk2, '#6c6f78', { w: WT.fine * 1.5 }) + part(bk1, '#8d9099', { w: WT.fine * 1.5 });
  const ey = T([72, -70]); o += `<circle cx="${ey[0].toFixed(1)}" cy="${ey[1].toFixed(1)}" r="9" fill="#d82a2a" stroke="${E.INK}" stroke-width="2.5"/><circle cx="${ey[0] + 2}" cy="${ey[1] - 2}" r="3" fill="#fff"/>`;
  for (const fx of [-10, 14]) o += ink([T([fx, 44]), T([fx, 62])], 5, { color: '#8d9099', taper: [0.1, 0.1] });
  return o;
}
function trishul(t) { // floats upright at his right, held by his power; thump = drop to the floor line
  const x = t.x, y = t.y, a = (t.ang || 0) * Math.PI / 180, T = q => rot(q, a).map((v, i) => v + [x, y][i]);
  const up = -380, U = q => T([q[0], q[1] + (q[1] < -300 ? up : 0)]);
  let o = ink([T([0, 120]), T([0, -360 + up])], 14, { color: '#6b4a2a', taper: [0.02, 0.02], amp: 0.2 }) + ink([T([-4, 120]), T([-4, -360 + up])], 4, { color: '#a07a4a', taper: [0.02, 0.02], amp: 0.2 });
  const head2 = catmull([[-70, -360], [-80, -440], [-60, -470], [-56, -420], [-16, -386], [-14, -500], [0, -540], [14, -500], [16, -386], [56, -420], [60, -470], [80, -440], [70, -360], [0, -340]].map(U), 3, true);
  o += part(head2, '#c8ccd6', { sh: '#8f95a6', shPts: [[0, -560], [90, -560], [90, -330], [0, -330]].map(U), w: WT.mid });
  o += fill(catmull([[-22, -360], [22, -360], [22, -340], [-22, -340]].map(U), 2, true), C.gold);
  o += `<circle cx="${T([0, -300 + up])[0].toFixed(1)}" cy="${T([0, -300 + up])[1].toFixed(1)}" r="20" fill="#7b5634" stroke="${E.INK}" stroke-width="3"/>`; // damaru knot
  if (t.glow) o += `<circle cx="${x}" cy="${y - 420 + up}" r="120" fill="url(#shaniHalo)" opacity="${0.5 * t.glow}"/>`;
  return o;
}
function register(r) { // brown KARMA ledger floating; open = pages fan
  const T = q => rot([q[0] * r.s, q[1] * r.s], (r.ang || 0) * Math.PI / 180).map((v, i) => v + [r.x, r.y][i]);
  const cover = catmull([[-90, -60], [90, -60], [90, 60], [-90, 60]].map(T), 1, true);
  let o = part(cover, '#7a4a2a', { sh: '#5a3218', shPts: [[0, -70], [100, -70], [100, 70], [0, 70]].map(T), w: WT.mid });
  o += ink([T([-90, -48]), T([90, -48])], 3, { color: '#d9b26a', taper: [0.05, 0.05] }) + ink([T([-90, 48]), T([90, 48])], 3, { color: '#d9b26a', taper: [0.05, 0.05] });
  const c = T([0, 4]); o += `<text x="${c[0].toFixed(1)}" y="${(c[1] + 10 * r.s).toFixed(1)}" transform="rotate(${r.ang || 0} ${c[0].toFixed(1)} ${c[1].toFixed(1)})" font-family="Georgia, serif" font-weight="700" font-size="${(30 * r.s).toFixed(1)}" text-anchor="middle" fill="#f3d27a" letter-spacing="2">KARMA</text>`;
  if (r.glow) o += `<circle cx="${r.x}" cy="${r.y}" r="${150 * r.s}" fill="url(#shaniHalo)" opacity="${0.6 * r.glow}"/>`;
  return o;
}
// Saturn: banded globe that spins (bands drift across a clipped sphere), tilted rings split into a back half
// (behind the globe) and front half (over it), ring gaps, terminator shadow, ring shadow on the globe, soft glow.
function saturn(t = 0, cx = 860, cy = 300, R = 105, tiltDeg = -18) {
  const id = 'sat' + (E.S.uid++), ry = 0.26;
  const ring = (rOut, rIn, half, col, op) => { // half: 'back' (top arc) or 'front' (bottom arc), as ellipse band
    const a0 = half === 'back' ? Math.PI : 0, pts = [];
    for (let k = 0; k <= 40; k++) { const a = a0 + Math.PI * k / 40; pts.push([cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut * ry]); }
    for (let k = 40; k >= 0; k--) { const a = a0 + Math.PI * k / 40; pts.push([cx + Math.cos(a) * rIn, cy + Math.sin(a) * rIn * ry]); }
    return `<path d="${E.poly(pts)}" fill="${col}" opacity="${op}"/>`; };
  const rings = half => ring(R * 2.25, R * 1.95, half, '#c9a873', 0.85) + ring(R * 1.9, R * 1.55, half, '#e8d29c', 0.95) + ring(R * 1.5, R * 1.25, half, '#b89a68', 0.7);
  const rimLine = half => { const a0 = half === 'back' ? Math.PI : 0, pts = []; for (let k = 0; k <= 40; k++) { const a = a0 + Math.PI * k / 40; pts.push([cx + Math.cos(a) * R * 2.25, cy + Math.sin(a) * R * 2.25 * ry]); }
    return ink(pts, 4, { color: '#5a4320', taper: [0.3, 0.3], amp: 0 }); };
  // spinning bands: horizontal stripes whose wobble phase scrolls with t
  let bands = '';
  const cols = ['#e7c98a', '#cfa565', '#efd8a2', '#b98b4e', '#e3c286', '#c9995b', '#f0dcae'];
  for (let k = 0; k < 7; k++) { const y0 = cy - R + (k + 0.5) * (2 * R / 7), h = 2 * R / 7 + 2, pts = [];
    for (let j = 0; j <= 24; j++) { const x = cx - R + j * (2 * R / 24); pts.push([x, y0 - h / 2 + Math.sin(x * 0.045 + t * 2.2 + k) * 3]); }
    for (let j = 24; j >= 0; j--) { const x = cx - R + j * (2 * R / 24); pts.push([x, y0 + h / 2 + Math.sin(x * 0.045 + t * 2.2 + k + 1) * 3]); }
    bands += `<path d="${E.poly(pts)}" fill="${cols[k]}"/>`; }
  // storm spot drifting across = visible spin
  const sx = cx - R * 1.2 + ((t * 40) % (R * 2.4)); bands += `<ellipse cx="${sx}" cy="${cy + R * 0.32}" rx="${R * 0.16}" ry="${R * 0.07}" fill="#a8743e" opacity="0.85"/>`;
  const shade = `<circle cx="${cx + R * 0.45}" cy="${cy + R * 0.2}" r="${R * 1.05}" fill="#1a1430" opacity="0.38"/>` + // terminator
    `<ellipse cx="${cx}" cy="${cy + R * 0.12}" rx="${R * 1.2}" ry="${R * 0.1}" fill="#2a1d10" opacity="0.35"/>` + // ring shadow on globe
    `<ellipse cx="${cx - R * 0.35}" cy="${cy - R * 0.4}" rx="${R * 0.35}" ry="${R * 0.22}" fill="#fff6dc" opacity="0.35"/>`; // highlight
  return `<g transform="rotate(${tiltDeg} ${cx} ${cy})"><circle cx="${cx}" cy="${cy}" r="${R * 1.6}" fill="url(#shaniHalo)" opacity="0.25"/>` + rings('back') + rimLine('back') +
    `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath><g clip-path="url(#${id})">${bands}${shade}</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${E.INK}" stroke-width="6"/>` + rings('front') + rimLine('front') + '</g>';
}
// overhead court spotlight: brass lamp at the top, soft layered beam, pool of light on the floor, drifting dust
function spotlight(t = 0, power = 1) {
  const top = [540, 70], wTop = 70, wBot = 430, bot = 1730;
  let o = `<defs><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity="${0.42 * power}"/><stop offset="0.65" stop-color="#ffe9b0" stop-opacity="${0.12 * power}"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="${0.04 * power}"/></linearGradient>
    <radialGradient id="pool"><stop offset="0" stop-color="#ffefc0" stop-opacity="${0.55 * power}"/><stop offset="1" stop-color="#ffefc0" stop-opacity="0"/></radialGradient></defs>`;
  for (const [k, op] of [[1.25, 0.35], [1.0, 0.6], [0.72, 1]]) // three widths fake a soft edge
    o += `<path d="M${top[0] - wTop * k} ${top[1]} L${top[0] + wTop * k} ${top[1]} L${top[0] + wBot * k} ${bot} L${top[0] - wBot * k} ${bot} Z" fill="url(#beam)" opacity="${op}"/>`;
  o += `<ellipse cx="540" cy="${bot}" rx="${wBot * 1.05}" ry="70" fill="url(#pool)"/>`;
  for (let i = 0; i < 14; i++) { const u = ((i * 0.137 + t * 0.06) % 1), y = top[1] + u * (bot - top[1]), half = wTop + (wBot - wTop) * u, x = 540 + Math.sin(i * 7.1 + t * 0.7) * half * 0.8;
    o += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.6 + (i % 3)).toFixed(1)}" fill="#fff6d8" opacity="${(0.25 + 0.35 * Math.sin(i + t * 2) ** 2) * power}"/>`; }
  o += `<path d="M450 0 L630 0 L610 40 Q540 86 470 40 Z" fill="#2a2a38" stroke="#161017" stroke-width="5"/><path d="M462 30 Q540 72 618 30" fill="none" stroke="#c9a24a" stroke-width="6"/>`;
  o += `<ellipse cx="540" cy="66" rx="66" ry="12" fill="#fff8dc"/>`;
  return o;
}
function draw(p) {
  const head_ = p.head || [540, 640];
  const armL = p.standing ? arm([370, 1000], [318, 1124], [356, 1258], { r: [40, 34, 28], handPose: 'relax', handAng: 0, hs: 0.9, handScale: 0.9, skin: C.skin, skinSh: C.skinSh, gold: C.gold, line: C.skinLine, outward: -1 }) : arm([392, 945], [318, 1080], [330, 1205], { r: [36, 30, 26], handPose: 'relax', handAng: 0, hs: 0.9, handScale: 0.9, skin: C.skin, skinSh: C.skinSh, gold: C.gold, line: C.skinLine, outward: -1 });
  const R = p.armR || (p.standing ? { E: [764, 1124], W: [726, 1258], hand: 'relax' } : { E: [770, 1070], W: [760, 1205], hand: 'relax' });
  const armR = arm(R.hand === 'relax' ? [710, 1000] : [700, 960], R.E, R.W, { r: [40, 34, 28], handPose: R.hand, handAng: 0, hs: 0.9, handScale: 0.9, skin: C.skin, skinSh: C.skinSh, gold: C.gold, line: C.skinLine, outward: 1 });
  const rBehind = R.hand === 'relax';
  return (p.standing ? '' : throne()) + halo({ ...p, head: head_ }) + (p.standing ? dhotiStanding(p) : lap()) + armL + (rBehind ? armR : '') + torso(p) + head({ ...p, head: head_ }) + crow(p) + (rBehind ? '' : armR) +
    (p.trishul ? trishul(p.trishul) : '') + (p.register ? register(p.register) : '');
}
module.exports = { C, draw, spotlight, saturn };
