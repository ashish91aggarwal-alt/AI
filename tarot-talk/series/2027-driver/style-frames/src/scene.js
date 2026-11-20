// Shared geometry for the key shot: the 2027 engine with a hidden saarthi in the cab,
// and two friends with the same mulank on tracks that split. 1080 x 1920.
// Every style renderer paints the same shapes with its own material.
(function () {
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const ell = (cx, cy, rx, ry, n = 56, a0 = 0, a1 = Math.PI * 2) => {
    const p = [];
    for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / (a1 - a0 >= Math.PI * 2 ? n : n - 1); p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return p;
  };
  const circ = (cx, cy, r, n) => ell(cx, cy, r, r, n);
  const rrect = (x, y, w, h, r) => {
    const p = [], q = 8, add = (cx, cy, a0) => { for (let i = 0; i <= q; i++) { const a = a0 + Math.PI / 2 * i / q; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    add(x + w - r, y + r, -Math.PI / 2); add(x + w - r, y + h - r, 0); add(x + r, y + h - r, Math.PI / 2); add(x + r, y + r, Math.PI);
    return p;
  };
  const band = (a, b, w) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * w / 2, ny = dx / l * w / 2; return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]; };
  const shift = (pts, dx, dy = 0) => pts.map(([x, y]) => [x + dx, y + dy]);

  const S = [];
  const add = (role, pts, o = {}) => { S.push(Object.assign({ role, pts }, o)); return pts; };

  // --- upper half: sky things
  add('disc', circ(850, 440, 105));
  add('hill', [[0, 1004], [0, 930], [110, 890], [250, 935], [420, 900], [560, 945], [700, 905], [860, 940], [980, 895], [1080, 925], [1080, 1004]]);
  // steam behind the engine, drifting back toward the cab
  [[822, 585, 46], [770, 520, 62], [680, 478, 74], [570, 470, 80], [455, 492, 84]].forEach(([x, y, r]) => add('steam', circ(x, y, r, 40)));

  // --- rail
  for (let x = 20; x < 1080; x += 62) add('sleeper', rect(x, 1012, 34, 16));
  add('rail', rect(0, 998, 1080, 14));

  // --- engine (faces right)
  add('beam', [[952, 722], [1080, 668], [1080, 812], [952, 758]]);
  add('trim', [[935, 885], [1012, 998], [935, 998]]);                 // cowcatcher
  add('frame', rect(150, 878, 790, 30));
  add('boiler', rrect(335, 715, 550, 165, 62));
  add('gold', rect(452, 716, 14, 163)); add('gold', rect(742, 716, 14, 163));
  add('trim', rrect(858, 703, 74, 184, 22));                          // smokebox
  add('trim', [[797, 716], [806, 642], [788, 614], [868, 614], [850, 642], [859, 716]]); // chimney
  add('gold', ell(600, 716, 50, 44, 40, Math.PI, Math.PI * 2));       // dome
  add('plate', rrect(515, 762, 180, 66, 12), { text: '2027', tsize: 50 });
  add('cab', rrect(150, 620, 200, 268, 14));
  add('roof', rrect(122, 590, 256, 38, 14));
  const win = add('window', rrect(182, 660, 132, 134, 12), { id: 'cabwin' });
  // the saarthi: only a backlit outline, turban and shawl, one hand on the lever
  add('saarthi', [[190, 800], [200, 758], [228, 740], [268, 740], [298, 760], [306, 800]], { clip: 'cabwin' });
  add('saarthi', circ(247, 716, 25, 32), { clip: 'cabwin' });
  add('saarthi', ell(247, 697, 36, 21, 32), { clip: 'cabwin' });
  add('saarthi', [[272, 692], [297, 676], [291, 704]], { clip: 'cabwin' });
  add('saarthi', band([286, 800], [300, 742], 9), { clip: 'cabwin' });   // lever
  add('lamp', circ(936, 740, 22, 28));
  [[430, 925, 76], [600, 925, 76], [770, 925, 76], [250, 942, 58], [892, 952, 46]].forEach(([x, y, r]) => { add('wheel', circ(x, y, r, 48), { wheel: [x, y, r] }); add('gold', circ(x, y, r * 0.28, 24)); });
  add('gold', rect(430, 917, 340, 16));                               // coupling rod
  // steam in front: veils the cab window so the driver stays half hidden
  [[345, 548, 86], [228, 606, 78], [128, 660, 62]].forEach(([x, y, r]) => add('steam', circ(x, y, r, 40), { veil: true }));

  // --- lower half: the split
  const trackTo = (a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
    for (let d = 24; d < l; d += 46) { const c = [a[0] + ux * d, a[1] + uy * d]; add('sleeper', band([c[0] - nx * 40, c[1] - ny * 40], [c[0] + nx * 40, c[1] + ny * 40], 13), { low: true }); }
    for (let d = 0; d < l; d += 46) [-24, 24].forEach(o => add('track', band([a[0] + ux * d + nx * o, a[1] + uy * d + ny * o], [a[0] + ux * Math.min(l, d + 47) + nx * o, a[1] + uy * Math.min(l, d + 47) + ny * o], 9), { low: true }));
  };
  trackTo([540, 1040], [50, 1930]); trackTo([540, 1040], [1030, 1930]);
  add('post', rect(531, 1108, 18, 650));
  add('boardA', [[527, 1128], [392, 1128], [352, 1164], [392, 1200], [527, 1200]], { text: 'Driver 1', tsize: 36, tx: 447, ty: 1164 });
  add('boardB', [[553, 1206], [688, 1206], [728, 1242], [688, 1278], [553, 1278]], { text: 'Driver 5', tsize: 36, tx: 633, ty: 1242 });

  const coach = (dx, k, month) => {
    [[150, 1702, 40], [390, 1702, 40]].forEach(([x, y, r]) => { add('wheel', circ(x + dx, y, r, 36), { wheel: [x + dx, y, r] }); add('gold', circ(x + dx, y, r * 0.3, 20)); });
    add('coach' + k, rrect(60 + dx, 1300, 420, 384, 38));
    add('roof', rrect(48 + dx, 1284, 444, 42, 18));
    add('window2', rrect(108 + dx, 1352, 324, 218, 24), { id: 'cw' + k });
    const c = 'cw' + k;
    add('shirt' + k, [[150 + dx, 1575], [176 + dx, 1528], [236 + dx, 1510], [304 + dx, 1510], [364 + dx, 1528], [390 + dx, 1575]], { clip: c });
    add('skin', rect(252 + dx, 1486, 36, 34), { clip: c });
    add('skin', circ(270 + dx, 1452, 55, 40), { clip: c });
    if (k === 'A') add('hairA', [[212 + dx, 1452], [214 + dx, 1412], [240 + dx, 1388], [282 + dx, 1384], [318 + dx, 1400], [330 + dx, 1440], [316 + dx, 1428], [290 + dx, 1414], [246 + dx, 1418], [224 + dx, 1436]], { clip: c });
    else add('hairB', [[206 + dx, 1500], [208 + dx, 1420], [236 + dx, 1386], [280 + dx, 1380], [322 + dx, 1398], [336 + dx, 1440], [334 + dx, 1500], [316 + dx, 1500], [320 + dx, 1436], [296 + dx, 1414], [246 + dx, 1416], [226 + dx, 1440], [226 + dx, 1500]], { clip: c });
    add('ink', circ(252 + dx, 1456, 6, 12), { clip: c }); add('ink', circ(290 + dx, 1456, 6, 12), { clip: c });
    add('ink', ell(271 + dx, 1474, 17, 11, 14, 0.15 * Math.PI, 0.85 * Math.PI), { clip: c, line: true });
    add('badge', circ(136 + dx, 1628, 38, 32), { text: '5', tsize: 50 });
    S.push({ role: 'label', text: 'Mulank 5 · ' + month, tx: 190 + dx, ty: 1630, tsize: 34, align: 'left' });
  };
  coach(0, 'A', 'March'); coach(540, 'B', 'July');

  const TEXT = [
    { text: 'Mulank same.', x: 70, y: 175, size: 104, role: 'title' },
    { text: 'Saal alag?', x: 70, y: 290, size: 104, role: 'title2' },
    { text: '2027 ka driver kaun?', x: 540, y: 1856, size: 66, role: 'caption', align: 'center' },
  ];
  window.SCENE = { shapes: S, text: TEXT, W: 1080, H: 1920, horizon: 1030 };
})();
