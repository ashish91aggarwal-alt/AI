// Rashi ki file: Aries 2026 → 2027 mol-bhaav. Script v13.2 (owner, 24 Nov 2026). Free Kokoro voices.
// ONE locked scene for Aries (owner: "No theme scene change for aries. Lock per rashi"): the silkscreen hill road (poster.js).
// Vishnu ji comes out of the spark portal when Sakshi calls "Prabhu", stays for the bargain, and goes back after his last line.
// Sakshi (the wakeel) stands grounded on the right verge. The folk ram is her client: walks in on the road, waits, then gets
// impatient and trots to the APRIL stone, braking on "jo ruk gaya". One poster card per beat in the top-right card area.
// Acting rule (owner + Gate 3): motivated and calm, no gesture only to show movement.
const K = require('../kit'), R = require('../char_ram'), P = require('../poster');
const { vp, kp, vishnu, sakshi, clamp, ease } = K;
const { INK, sm, lerp, L2, T, TS, plateAries, portal, armKF, fixV, VA, kArms, flight, card, stamp, CX0, CW, CY0 } = P;
const S = require(require('path').join(K.VID, 'script.json')).beats, B = id => S.find(b => b.id === id);
const at = (id, f) => { const b = B(id); return b.start + (b.end - b.start) * f; };   // a point inside a line (fraction of its length)
const DUR = Math.max(...S.map(b => b.end)) + 0.9;
const CLOCK = K.film([[0, 9999, () => ({ defs: '', body: '' })]], 9999);   // sets kit's acting clock (lip-sync, blinks)

// ---------- portal + Vishnu ji's stay ----------
const PX = 310, PY = 545, PR = 245, F = flight(PX, PY);
const OPEN = [0.7, 1.4], FLY_IN = [1.3, 2.3];
const VEND = B('V16').end, FLY_OUT = [VEND + 0.3, VEND + 1.1], CLOSE = [VEND + 1.15, VEND + 1.65];
const pr = t => t < OPEN[0] ? 0 : t < OPEN[1] ? PR * K.backOut(clamp((t - OPEN[0]) / (OPEN[1] - OPEN[0]))) : t < CLOSE[0] ? PR : PR * (1 - ease(clamp((t - CLOSE[0]) / (CLOSE[1] - CLOSE[0]))));
function vState(t) {
  let u; if (t < FLY_IN[1]) u = sm(clamp((t - FLY_IN[0]) / (FLY_IN[1] - FLY_IN[0]))); else if (t < FLY_OUT[0]) u = 1; else u = 1 - sm(clamp((t - FLY_OUT[0]) / (FLY_OUT[1] - FLY_OUT[0])));
  const [x, y] = F.bez(u), arrive = t > FLY_IN[1] && t < FLY_OUT[0] ? 30 * Math.exp(-(t - FLY_IN[1]) * 3.0) * Math.sin((t - FLY_IN[1]) * 9) : 0;
  return { u, x, y: y + arrive + 6 * Math.sin(t * 2.2), s: 0.14 + 0.32 * u };
}
function trail(t, st) {
  if (!((t > FLY_IN[0] && t < FLY_IN[1] + 0.5) || (t > FLY_OUT[0] - 0.1 && t < FLY_OUT[1]))) return '';
  let o = ''; for (let k = 1; k <= 8; k++) { const [x, y] = F.bez(Math.max(0, st.u - k * 0.06)), a = 0.75 * (1 - k / 9); o += `<circle cx="${x.toFixed(1)}" cy="${(y + 40 * st.s).toFixed(1)}" r="${(60 * st.s * (1 - k / 7) + 6).toFixed(1)}" fill="#ffffff" opacity="${a.toFixed(2)}"/>`; }
  return o;
}
// kind face (owner rule): open eyes, level raised brows, gentle smile; teasing from head tilt, not narrowed eyes
const kind = { ...vp(2), lid: 0, browL: 0.6, browR: 0.6, browSoft: 1, mouthShape: undefined, viseme: 'A', lookX: 8, tilt: 0, wink: 0 };
// right arm per line: [time, pose] (motivated gestures only; rest while listening)
const vR = [[0, 'rest'],
  [at('V02', 0) - 0.3, 'finger'], [B('V02').end + 0.5, 'rest'],                                   // chakra twirling on one finger, like a keychain
  [at('V04', 0.05), 'palm'], [at('V04', 0.45), 'point'], [B('V04').end + 0.2, 'rest'],          // points at the Shani card
  [at('V06', 0.02), 'bless'], [at('V06', 0.5), 'palm'], [B('V06').end + 0.2, 'rest'],           // calming palm, then "bolo kya chahiye"
  [at('V08', 0.05), 'finger'], [at('V08', 0.62), 'palm'], [B('V08').end + 0.2, 'rest'],         // Mangal; "April tak roko" (stop palm)
  [at('V10', 0.02), 'bless'], [at('V10', 0.3), 'finger'], [at('V10', 0.52), 'bless'], [B('V10').end + 0.4, 'rest'],
  [at('V12', 0.05), 'palm'], [at('V12', 0.3), 'point'], [at('V12', 0.72), 'palm'], [B('V12').end + 0.2, 'rest'],
  [at('V14', 0.4), 'point'], [B('V14').end + 0.2, 'rest'],
  [at('V16', 0.12), 'palm'], [at('V16', 0.38), 'point'], [at('V16', 0.72), 'bless'], [VEND - 0.1, 'wave']];
const vL = [[0, 'Ltrail'], [FLY_IN[1], 'L0'], [at('V10', 0.5), 'Lram'], [at('V10', 0.8), 'L0'], [FLY_OUT[0] - 0.1, 'Ltrail']];
const laughs = [[B('V02').end - 0.1, B('V02').end + 0.45], [at('V14', 0), at('V14', 0.22)], [B('V10').end, B('V10').end + 0.35]];
const nods = [at('V10', 0.86), at('V06', 0.3)];
function vishnuNow(t) {
  const st = vState(t); if (!(st.u > 0.001 || (t > FLY_IN[0] && t < FLY_OUT[1]))) return '';
  let armR = fixV(armKF(t, vR.map(([a, k]) => [a, VA[k]]), 0.4));
  if (t > VEND + 0.2 && t < VEND + 0.8) armR = { ...armR, W: [armR.W[0] + 26 * Math.sin((t - VEND - 0.2) / 0.6 * Math.PI * 2), armR.W[1]] };   // one goodbye wave
  const armL = armKF(t, vL.map(([a, k]) => [a, VA[k]]));
  const spin = (t > at('V02', 0) - 0.1 && t < B('V02').end + 0.5) ? { x: 0, y: 0 } : null;
  const nod = nods.reduce((s, n) => s + 3.5 * Math.exp(-Math.pow((t - n) * 5, 2)), 0);
  const shake = t > at('V16', 0) && t < at('V16', 0.18) ? 3 * Math.sin((t - at('V16', 0)) * 14) : 0;   // "wahan sifaarish nahi chalti"
  const lean = t < FLY_IN[1] ? 7 * Math.sin(Math.PI * st.u) : t < FLY_IN[1] + 0.8 ? -5 * Math.sin(Math.PI * (t - FLY_IN[1]) / 0.8) : t > FLY_OUT[0] ? -7 * Math.sin(Math.PI * st.u) : 0;
  const tilt = (t < FLY_IN[1] ? 4 : t > FLY_OUT[0] ? -4 : 0) * Math.sin(Math.PI * st.u) + nod + shake;
  const atRam = t > at('V10', 0.52) && t < at('V10', 0.75), laugh = laughs.some(([a, b]) => t > a && t < b);
  const pose = { ...kind, lean, tilt: Math.max(-4, Math.min(4, tilt)), armR, armL, lookX: atRam ? -20 : 8, lookY: atRam ? 15 : 0, eyeMode: laugh ? 'happy' : null, mouthShape: laugh ? 'smileBig' : undefined };
  if (spin) { const W = armR.W, a = Math.atan2(W[1] - armR.E[1], W[0] - armR.E[0]), fx = W[0] + Math.cos(a) * 95, fy = W[1] + Math.sin(a) * 95; pose.chakra = { x: fx + 30 * Math.cos(t * 8), y: fy - 10 + 18 * Math.sin(t * 8), spin: t * 9, scale: 0.8 }; }   // twirls round the fingertip like a keychain
  const vj = `<g transform="translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) scale(${(st.s / 0.46).toFixed(4)}) translate(${-PX} ${-(PY + 230)})">${vishnu(pose, PX, PY + 230, 0.46, t)}</g>`;
  const r = pr(t), cr = Math.max(1, r) + sm(clamp((st.u - 0.25) / 0.55)) * 1500;
  let o = `<defs><clipPath id="pd"><circle cx="${PX}" cy="${PY}" r="${cr.toFixed(1)}"/></clipPath></defs>`;
  if (st.u > 0.5) o += `<ellipse cx="${st.x.toFixed(1)}" cy="1120" rx="${(150 * st.s / 0.46).toFixed(1)}" ry="16" fill="#7a4e1c" opacity="${(0.25 * (st.u - 0.5) * 2).toFixed(2)}"/>`;
  return o + `<g clip-path="url(#pd)">${trail(t, st)}${vj}</g>`;
}

// ---------- the ram (Sakshi's client) ----------
const R_IN = [0.2, 3.4], R_GO = at('V10', 0) - 1.6, R_BRAKE = at('V10', 0.55);
const RA = [-90, 1088], RB = [90, 1094], RC = [228, 1183];
function ramNow(t) {
  let x, y, s, speed = 0, brake = 0, look = 'happy', lookX = 0;
  if (t < R_GO) { const u = clamp((t - R_IN[0]) / (R_IN[1] - R_IN[0])), uu = 1 - (1 - u) * (1 - u); [x, y] = L2(RA, RB, uu); s = 0.32 + 0.12 * uu; speed = u < 1 ? 1 - 0.7 * u : 0; }
  else { const u = clamp((t - R_GO) / (R_BRAKE - R_GO)), uu = u * (0.8 + 0.2 * u); [x, y] = L2(RB, RC, uu); s = 0.44 + 0.16 * uu;
    const bk = clamp((t - R_BRAKE + 0.2) / 0.4); speed = (1 - bk) * (u < 1 ? 1 : 0.3); brake = bk < 1 ? bk : Math.max(0, 1 - (t - R_BRAKE - 0.2) / 0.6);
    if (bk > 0.3 && t < R_BRAKE + 1.2) look = 'shock'; }
  const faaah = B('K03').end - 0.15; if (t > faaah && t < faaah + 2.2) look = 'shock';
  if (t > at('V08', 0.6) && t < R_GO) lookX = -6;                    // glances at the road ahead: wants to go now
  const blink = ((t * 10) % 37) < 1.5 ? 1 : 0;
  return `<ellipse cx="${(x + 20 * s).toFixed(1)}" cy="${(y + 182 * s).toFixed(1)}" rx="${(170 * s).toFixed(1)}" ry="${(18 * s).toFixed(1)}" fill="#3a2e3a" opacity="0.28"/>` +
    R.drawFolk({ x, y, s, run: t * 2.8, speed, brake, look, tilt: 0, lookX, blink });
}

// ---------- Sakshi ----------
const C = p => ({ ...p, lawyer: 1 });
const kF = {   // faces (talking mouths come from act.js)
  listen: C({ ...kp(0), mouth: 'smile', blush: 0.4, tilt: -2 }),
  earnest: C({ ...kp(0), mouth: 'smile', blush: 0.4, browUp: 0.3 }),
  sad: C({ ...kp(0), browSad: 1, blush: 0.3, mouth: 'smile' }),
  shock: C({ ...kp(0), browUp: 0.9, mouth: 'o', blush: 0.4 }),
  smug: C({ ...kp(0), mouth: 'smirk', browLift: 1, blush: 0.6, tilt: 3 }),
  indignant: C({ ...kp(0), browUp: 0.7, blush: 0.5, tilt: -3 }),
  proud: C({ ...kp(0), happy: 1, mouth: 'smile', blush: 0.7, tilt: 3 }),
  friendly: C({ ...kp(0), mouth: 'smile', blush: 0.5 }),
};
const kFace = [[0, 'earnest'], [B('K01').end, 'listen'], [B('K03').start, 'sad'], [B('K03').end, 'listen'], [B('gadbad').start - 0.05, 'shock'], [B('K05').start, 'sad'],
  [B('V06').start, 'listen'], [B('abhi_maza').start, 'smug'], [B('K07').end, 'listen'], [B('lekin_ek_second').start, 'indignant'], [B('K09').end, 'listen'],
  [R_BRAKE + 0.2, 'smug'], [R_BRAKE + 1.4, 'listen'], [B('K11').start, 'earnest'], [B('K11').end, 'listen'], [B('K13').start, 'sad'], [B('hey_bhagwan').end + 0.2, 'listen'],
  [B('K15').start, 'sad'], [B('K15').end, 'listen'], [B('K17').start, 'proud'], [B('K18').start, 'friendly']];
const kArmKeys = [[0, 'rest'], [at('K01', 0.25), 'present'], [B('K01').end + 0.2, 'hold'],
  [at('K03', 0.1), 'present'], [B('K03').end + 0.2, 'hold'],
  [B('K05').start, 'chest'], [B('K05').end + 0.2, 'hold'],
  [at('K07', 0.05), 'one'], [B('K07').end + 0.2, 'hold'],
  [at('K09', 0.1), 'present'], [B('K09').end + 0.2, 'hold'],
  [at('K13', 0.55), 'shrug'], [B('hey_bhagwan').end, 'hold'],
  [at('K15', 0.1), 'present'], [B('K15').end + 0.2, 'hold'],
  [at('K18', 0.25), 'cta'], [at('K18', 0.85), 'hold']];
function sakshiNow(t) {
  const lab = kFace.reduce((a, [tt, l]) => t >= tt ? l : a, 'listen'), face = kF[lab];
  const alone = t > FLY_OUT[0];
  const look = alone ? { lookX: 0, lookY: 0 } : t < FLY_IN[1] ? { lookX: -22, lookY: -14 } : (t > R_BRAKE - 0.2 && t < R_BRAKE + 1.4) || (t > B('K03').end - 0.1 && t < B('K03').end + 1.6) ? { lookX: -26, lookY: 6 } : { lookX: -16, lookY: -10 };
  if (t > FLY_OUT[0] - 0.3 && t < CLOSE[1]) { look.lookX = -24; look.lookY = -18; }   // watches him go
  const baap = B('gadbad'); if (t > baap.start && t < baap.end) CLOCK.svg(baap.start - 0.3);
  const out = `<ellipse cx="730" cy="1352" rx="95" ry="14" fill="#a8742c" opacity="0.45"/>` + sakshi({ ...face, ...look, armL: null, ...(() => { const a = kArms(t, kArmKeys); return { armL: a.L, armR: a.R }; })() }, 730, 1065, 0.5, t);
  CLOCK.svg(t); return out;
}

// ---------- props and cards ----------
const ROWS = ['Kharcha zyada', 'Neend kam', 'Share −40%', 'EMI ki tension', 'Gym 3 din chala', 'Diet "Monday se"', 'Boss ka mood', 'Weekend gayab', 'Plans cancel', 'Traffic, traffic', 'Maasi ke sawaal', '…aur 27 aur'];
function fatFile(t) {   // the client's 2026 file: a fat rolled scroll floating by magic (glow), beside the wakeel; rises to the card area and opens on "Itni moti file?"
  const t0 = at('K01', 0.35), t1 = B('V02').start; if (t < t0 || t > t1 + 0.4) return '';
  const u = sm(clamp((t - t1 + 0.6) / 0.6)), x = lerp(650, CX0 + CW / 2, u), y = lerp(700, CY0 + 30, u) + 6 * Math.sin(t * 3), k = clamp((t - t0) / 0.3) * (1 - clamp((t - t1 - 0.1) / 0.3));
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(2)})"><circle r="70" fill="url(#halo)" opacity="0.8"/><rect x="-60" y="-26" width="120" height="52" rx="26" fill="#fbf3e2" stroke="${INK}" stroke-width="5"/><rect x="-70" y="-30" width="18" height="60" rx="6" fill="#b5502a" stroke="${INK}" stroke-width="4"/><rect x="52" y="-30" width="18" height="60" rx="6" fill="#b5502a" stroke="${INK}" stroke-width="4"/><path d="M-40 -8 H40 M-40 8 H30" stroke="#a89a88" stroke-width="5"/></g>`;
}
function complaintScroll(t) {   // the long list, fully filled (owner: "list was long but not filled completely, take care")
  const t0 = B('V02').start, t1 = at('K03', 0.66); if (t < t0 || t > t1 + 0.3) return '';
  const u = ease(clamp((t - t0) / 1.1)), H = 470 * u, out = 1 - clamp((t - t1) / 0.3);
  let o = `<g opacity="${out.toFixed(2)}"><defs><clipPath id="scr"><rect x="${CX0}" y="${CY0}" width="${CW}" height="${H.toFixed(1)}"/></clipPath></defs>`;
  o += `<rect x="${CX0 + 8}" y="${CY0 + 10}" width="${CW}" height="${H.toFixed(1)}" fill="#2a1418" opacity="0.2"/><g clip-path="url(#scr)"><rect x="${CX0}" y="${CY0}" width="${CW}" height="470" fill="#fbf3e2" stroke="${INK}" stroke-width="6"/>`;
  o += TS(CX0 + CW / 2, CY0 + 50, 'ARIES 2026', 34, '#8e1b2c');
  const hot = [at('K03', 0.12), at('K03', 0.36), at('K03', 0.6)];
  ROWS.forEach((r, i) => { const y = CY0 + 96 + i * 31, h = i < 3 && t > hot[i];
    o += `<circle cx="${CX0 + 28}" cy="${y - 8}" r="5" fill="${h ? '#b3262e' : INK}"/>` + TS(CX0 + 44, y, r, 26, h ? '#b3262e' : INK, 'start') + (h ? `<path d="M${CX0 + 40} ${y + 6} q90 ${-4} ${r.length * 12} 0" stroke="#b3262e" stroke-width="4" fill="none"/>` : ''); });
  o += `</g><rect x="${CX0 - 6}" y="${CY0 - 14}" width="${CW + 12}" height="26" rx="12" fill="#b5502a" stroke="${INK}" stroke-width="5"/><rect x="${CX0 - 6}" y="${(CY0 + H - 12).toFixed(1)}" width="${CW + 12}" height="26" rx="12" fill="#b5502a" stroke="${INK}" stroke-width="5"/></g>`;
  return o;
}
const icon = {
  chartDown: (t, t0) => { const u = ease(clamp((t - t0) / 0.7)); const pts = [[0, 0], [60, -30], [110, -10], [170, -60], [230, 40 * u + 20], [300, 140 * u]].map(([x, y]) => `${CX0 + 30 + x * 0.88},${CY0 + 230 + y}`).join(' ');
    return `<path d="M${CX0 + 30} ${CY0 + 120} V${CY0 + 390} H${CX0 + CW - 30}" stroke="${INK}" stroke-width="5" fill="none"/><polyline points="${pts}" fill="none" stroke="#b3262e" stroke-width="9" stroke-linejoin="round"/>` + (u > 0.6 ? TS(CX0 + CW / 2 + 40, CY0 + 160, '−40%', 56, '#b3262e') : ''); },
  saturn: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="92" ry="22" fill="none" stroke="#c9a86a" stroke-width="12" transform="rotate(-14)"/><circle r="52" fill="#3b4fa8" stroke="${INK}" stroke-width="5"/><path d="M-90 8 Q0 34 90 -16" stroke="#c9a86a" stroke-width="12" fill="none" transform="rotate(-6)"/></g>`,
  mars: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="44" fill="#d2462a" stroke="${INK}" stroke-width="5"/><circle cx="-12" cy="-10" r="9" fill="#b03a22"/><circle cx="14" cy="12" r="6" fill="#b03a22"/></g>`,
  house: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-90 0 L0 -80 L90 0 Z" fill="#b5502a" stroke="${INK}" stroke-width="5"/><rect x="-70" y="0" width="140" height="100" fill="#fbf7ee" stroke="${INK}" stroke-width="5"/><rect x="-20" y="40" width="40" height="60" fill="#8a5a3a" stroke="${INK}" stroke-width="4"/></g>`,
  guru: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="60" fill="url(#halo)"/><circle r="36" fill="#f2b84b" stroke="${INK}" stroke-width="5"/><path d="M-26 -8 H26 M-30 8 H30" stroke="#c98f3a" stroke-width="6"/></g>`,
  ketu: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="26" fill="#8f8aa0" stroke="${INK}" stroke-width="5"/><path d="M20 -16 Q60 -30 70 10" stroke="#8f8aa0" stroke-width="10" fill="none" stroke-linecap="round"/></g>`,
  heart: (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 40 C-80 -10 -50 -70 0 -30 C50 -70 80 -10 0 40 Z" fill="#e0475f" stroke="${INK}" stroke-width="5"/></g>`,
  door: (t, t0, x, y) => { let o = `<rect x="${x - 60}" y="${y - 100}" width="120" height="200" rx="10" fill="#5a3a5c" stroke="${INK}" stroke-width="5"/><circle cx="${x + 34}" cy="${y + 6}" r="8" fill="#f2b84b"/>`;
    for (let i = 0; i < 3; i++) { const ph = ((t - t0) * 0.9 - i * 0.33); if (ph < 0) continue; const q = ph % 1; o += `<circle cx="${x}" cy="${y}" r="${(40 + 90 * q).toFixed(1)}" fill="none" stroke="#3b4fa8" stroke-width="5" opacity="${(0.7 * (1 - q)).toFixed(2)}"/>`; } return o; },
  scale: (t, x, y) => { const a = 6 * Math.sin(t * 2.4); return `<g transform="translate(${x} ${y})"><path d="M0 -70 V70 M-50 70 H50" stroke="${INK}" stroke-width="7"/><g transform="rotate(${a.toFixed(1)})"><path d="M-110 -60 H110" stroke="${INK}" stroke-width="7"/><path d="M-110 -60 L-140 0 H-80 Z M110 -60 L80 0 H140 Z" fill="#f2b84b" stroke="${INK}" stroke-width="5"/></g></g>`; },
  link: (x, y) => `<g transform="translate(${x} ${y})"><rect x="-70" y="-26" width="90" height="52" rx="26" fill="none" stroke="${INK}" stroke-width="10"/><rect x="-20" y="-26" width="90" height="52" rx="26" fill="none" stroke="#b5502a" stroke-width="10"/></g>`,
  send: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-40 10 L40 -30 L10 40 L2 14 Z" fill="#3b4fa8" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/></g>`,
};
const VED = 'Chandra rashi · Vedic maanyata';
function cards(t) {
  const mid = CX0 + CW / 2; let o = '';
  // hook (first 2.4 s): works on mute
  o += card(t, 0.05, 2.4, 'RASHI KI FILE: ARIES', TS(mid, CY0 + 150, '2026 ka dard', 40, '#8e1b2c') + TS(mid, CY0 + 215, '2027 ka', 34) + TS(mid, CY0 + 275, 'MOL-BHAAV', 50, '#3b4fa8'), 320);
  // FAAAH beat: the share falls 40 %
  o += card(t, at('K03', 0.66), at('V04', 0.42), 'SHARE', icon.chartDown(t, at('K03', 0.7)), 430);
  // Shani in the 12th, all 2026
  o += card(t, at('V04', 0.45), B('V06').start - 0.1, 'SHANI · 2026', icon.saturn(mid, CY0 + 175, 0.9) + TS(mid, CY0 + 290, '12th ghar', 40) + TS(mid, CY0 + 340, 'kharcha + neend', 30, '#8e1b2c'), 420, { foot: VED });
  // mol-bhaav starts
  o += card(t, at('V06', 0.45), B('K07').start + 0.4, 'MOL-BHAAV SHURU', icon.scale(t, mid, CY0 + 230), 380, { head: '#9fd0a8' });
  // demand 1 → Mangal vakri → tareekh pe tareekh (same card; month tiles get stamped)
  const m0 = at('K07', 0.05), m1 = at('V08', 0.15), mEnd = at('V10', 0.25);
  if (t < m1) o += card(t, m0, m1, 'DEMAND 1', TS(mid, CY0 + 170, 'Naya kaam', 44) + TS(mid, CY0 + 230, 'January se!', 40, '#3b4fa8'), 300, { head: '#9fd0a8' });
  else { const tiles = ['JAN', 'FEB', 'MAR', 'APR'].map((m, i) => { const x = CX0 + 22 + i * 80, y = CY0 + 250, ok = i === 3;
      return `<rect x="${x}" y="${y}" width="70" height="80" rx="8" fill="${ok ? '#9fd0a8' : '#e9dfcf'}" stroke="${INK}" stroke-width="4"/>` + TS(x + 35, y + 50, m, 22, ok ? '#1f5a35' : INK) + (i < 3 ? stamp(t, at('K09', [0.27, 0.37, 0.47][i]), x + 35, y + 46, 'TAREEKH', '#b3262e', 13, -18) : ''); }).join('');
    o += card(t, m1, mEnd, 'MANGAL VAKRI', icon.mars(CX0 + 80, CY0 + 160, 0.9) + TS(CX0 + 130, CY0 + 150, '10 Jan → 1 Apr', 26, INK, 'start') + TS(CX0 + 135, CY0 + 190, '2027', 30, '#8e1b2c', 'start') + tiles, 380, { foot: VED }); }
  // demand 2: ghar → Guru + Ketu in the 4th
  o += card(t, B('K11').start, at('V12', 0.08), 'DEMAND 2', TS(mid, CY0 + 170, 'Ghar mein', 44) + TS(mid, CY0 + 230, 'sukoon', 44, '#3b4fa8'), 300, { head: '#9fd0a8' });
  o += card(t, at('V12', 0.1), B('K13').start - 0.05, '4th GHAR · 2027', icon.house(mid, CY0 + 220, 0.95) + icon.guru(mid - 110, CY0 + 140, 0.8) + icon.ketu(mid + 115, CY0 + 150, 0.8) + TS(mid - 110, CY0 + 210, 'Guru', 22) + TS(mid + 110, CY0 + 210, 'Ketu', 22) + TS(mid, CY0 + 360, 'Jan end – Jun', 30, '#8e1b2c'), 420, { foot: VED });
  // demand 3: maasi's questions (doodle bubbles, no extra character)
  const bub = (t0, x, y, str) => t < t0 ? '' : `<g transform="translate(${x} ${y}) scale(${(0.92 * K.backOut(clamp((t - t0) / 0.25))).toFixed(3)})"><path d="M-150 -40 Q-150 -70 -120 -70 H120 Q150 -70 150 -40 V20 Q150 50 120 50 H-60 L-90 80 L-80 50 H-120 Q-150 50 -150 20 Z" fill="#ffffff" stroke="${INK}" stroke-width="5"/>${TS(0, 0, str, 30)}</g>`;
  o += card(t, B('K13').start, at('V14', 0.3), 'DEMAND 3: MAASI', bub(at('K13', 0.1), mid, CY0 + 180, 'Shaadi kab?') + bub(at('K13', 0.62), mid, CY0 + 320, 'Good news kab?'), 420, { head: '#9fd0a8' });
  o += card(t, at('V14', 0.32), B('K15').start - 0.05, '5th GHAR · PYAAR', icon.heart(mid, CY0 + 180, 1.2) + icon.guru(mid + 95, CY0 + 140, 0.6) + TS(mid, CY0 + 300, 'Guru aa rahe hain', 32) + TS(mid, CY0 + 345, 'June 2027 ke aakhir se', 23, '#8e1b2c'), 420, { foot: VED });
  // demand 4: Sade Sati → Shani's department
  o += card(t, B('K15').start, at('V16', 0.35), 'DEMAND 4', TS(mid, CY0 + 170, 'Sade Sati', 44) + TS(mid, CY0 + 230, 'cancel?', 44, '#b3262e'), 300, { head: '#9fd0a8' });
  o += card(t, at('V16', 0.37), B('K17').start - 0.05, 'SADE SATI', icon.door(t, at('V16', 0.45), mid - 95, CY0 + 220) + TS(mid + 75, CY0 + 160, 'beech ka', 28) + TS(mid + 75, CY0 + 196, 'charan', 28) + TS(mid + 75, CY0 + 260, 'pehli', 28, '#3b4fa8') + TS(mid + 75, CY0 + 296, 'dastak', 28, '#3b4fa8') + TS(mid, CY0 + 375, 'Jun – Oct 2027', 30, '#8e1b2c'), 440, { foot: VED });
  // the wakeel's verdict: every row filled, each appears on its word
  const rows = [['KAAM', 'April ki tareekh', 0.2], ['GHAR', 'aadha sukoon', 0.34], ['RISHTA', 'Guru ka saath', 0.48], ['SADE SATI', 'mehnat ka raasta', 0.64]];
  o += card(t, B('K17').start, B('K18').start + 0.1, 'FAISLA', rows.map(([a, b, f], i) => TS(CX0 + 26, CY0 + 135 + i * 66, a, 26, '#8e1b2c', 'start') + (t < at('K17', f) ? `<path d="M${CX0 + 26} ${CY0 + 171 + i * 66} H${CX0 + 300}" stroke="#c9b9a2" stroke-width="4" stroke-dasharray="10 8"/>` : TS(CX0 + 26, CY0 + 169 + i * 66, b, 30, INK, 'start'))).join('') + stamp(t, at('K17', 0.84), mid, CY0 + 410, 'ARIES JEET GAYE', '#1f5a35', 24, -5), 450, { head: '#f2b84b' });
  // CTA: link-based (owner rule)
  o += card(t, B('K18').start + 0.1, DUR, 'MANIFEST 2027', icon.link(mid, CY0 + 150) + TS(mid, CY0 + 235, 'Link pe click', 38, '#3b4fa8') + icon.send(mid - 135, CY0 + 300) + TS(mid + 35, CY0 + 312, 'Dost ko bhejo', 28), 360, { head: '#9fd0a8' });
  return o;
}

// ---------- frame ----------
function frame(t) {
  CLOCK.svg(t);
  let body = plateAries();
  body += portal(t, PX, PY, pr(t));
  body += vishnuNow(t);
  body += ramNow(t);
  body += sakshiNow(t);
  body += fatFile(t) + complaintScroll(t) + cards(t);
  const cap = K.caption(t);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><radialGradient id="halo"><stop offset="0" stop-color="#fff4c4"/><stop offset="1" stop-color="#ffe07a" stop-opacity="0"/></radialGradient></defs>${body}${cap}</svg>`;
}
module.exports = { DUR, svg: frame };
