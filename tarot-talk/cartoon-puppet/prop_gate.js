// Proportions gate: on-screen height ratio of every pair of characters sharing a shot, against the cast sheet.
// Standing heights (Monty = 1.0): Sakshi 0.9 (little girl), Shani 1.15; seated deities count at 0.8 of standing (Vishnu 1.05, Brahma 0.95).
// Measured unscaled drawing heights (px): monty 1339, sakshi 1210, vishnu(seated) 1212, brahma(seated) 1265, shani 1565 (incl. trishul tip ~ -100).
const H = { monty: 1339, sakshi: 1210, vishnu: 1212, brahma: 1265, shani: 1460 }, T = { monty: 1, sakshi: 0.9, vishnu: 1.05 * 0.8, brahma: 0.95 * 0.8, shani: 1.15 };
const SHOTS = [ // [label, [char, scale], ...]  (two-shots in the rough cut; portal/foreground shots get a depth note)
  ['terrace two-shot', ['vishnu', 0.62], ['monty', 0.66]], ['V01 open', ['vishnu', 0.72], ['monty', 0.68]],
  ['office (Monty beside the desk)', ['brahma', 0.95 * 0.95 * 0.84], ['monty', 0.72], 'fg'], ['Sakshi entry', ['sakshi', 0.72], ['monty', 0.7]], ['formula', ['sakshi', 0.72], ['monty', 0.7]],
  ['Shani portal (magic window)', ['shani', 0.62], ['monty', 0.55], 'portal'],
];
let fail = 0;
for (const [label, a, b, note] of SHOTS) { const want = T[a[0]] / T[b[0]], got = (H[a[0]] * a[1]) / (H[b[0]] * b[1]), off = got / want - 1;
  const tol = note ? 0.35 : 0.15, ok = Math.abs(off) <= tol; if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(30)} ${a[0]}/${b[0]} on screen ${got.toFixed(2)} vs sheet ${want.toFixed(2)} (${(off * 100).toFixed(0)}%${note ? ', ' + note + ' tolerance 35%' : ''})`); }
process.exit(fail ? 1 : 0);
