// Film: Same Mulank, alag saal — 2026 → 2027 (59 s). Shots on the script clock (= voice clock; meme clips are baked into the voice track).
// v2 (owner, 23 Nov 16:30 IST): every beat has a real expression, expressions change on the phrase, Sakshi gets cute
// happy-eye smiles instead of head twitches (act.js). Graphics (cards, calendar, phone) come in the Batch 2 rough cut.
const K = require('../kit');
const { E, L, M, SD, clamp, ease, backOut, vp, mp, bp, sp, kp, vishnu, monty, shani, brahma, sakshi, cam, focus, txt, tag, pill, rainCloud, commentBox, bricks, terraceScene, officeScene, courtScene } = K;

// pick the key pose for this moment: list of [time, pose], last one whose time has passed wins
const seq = (t, list) => { let p = list[0][1]; for (const [t0, q] of list) if (t >= t0) p = q; return p; };
const push = (body, t, t0, k = 0.025, cx = 540, cy = 900) => cam(body, cx, cy, 1 + k * Math.max(0, t - t0));

// extra Monty expressions built from his approved poses (face fields + arms only; arms reused from his approved poses)
const relaxL = mp(0).armL, relaxR = mp(0).armR, palmUpR = mp(1).armR, chestR = mp(7).armR, chestL = mp(7).armL;
const buckle = { legL: mp(2).legL, legR: mp(2).legR };
const jealous = { ...mp(0), mouthShape: 'pout', brow: 1.25, browUp: 0, lookX: -24, lookY: 10, tilt: -7, blush: 0.35, eye: { irisR: 28, pupil: 13, lid: 0.32, lidTilt: -0.25, hl: 2 } };
const hurt = { ...mp(6), mouthShape: 'wavy', eye: { irisR: 26, pupil: 11, hl: 2, watery: 1, shake: 0.6 }, tears: 0, armL: relaxL, armR: chestR, ...buckle };   // hand on heart, lip wobbles
const damage = { ...mp(6), armL: relaxL, armR: chestR, ...buckle };                                                                   // full wail on "DAMAGE"
const listen = { ...mp(0), mouthShape: 'o', brow: 0.3, browUp: 0.5, lookX: -22, tilt: 5, sweat: 0 };                                      // listening to Sakshi
const counting = { ...mp(0), mouthShape: 'o', brow: 0.4, browUp: 0.5, lookX: -20, lookY: -6, tilt: 5, armR: palmUpR };
const stopE = [730, 1070], stopW = [770, 960];   // forearm forward at chest height, palm to camera, fingers up ('ruko')
const stopR = { S: [655, 925], E: stopE, W: stopW, hand: 'palm', handAng: M.along(stopE, stopW) + Math.PI / 2 };
const ruko = { ...mp(0), mouthShape: 'pout', brow: -0.7, browUp: 0, lookX: 0, tilt: -3, sweat: 0, eye: { irisR: 30, pupil: 12, lid: 0.18, hl: 2 }, armL: relaxL, armR: stopR };
const scheme = { ...mp(3), armL: { ...chestL, W: [534, 985] }, armR: { ...chestR, W: [546, 975] }, tilt: -10 };                                                                    // evil grin, rubbing hands

// Sakshi faces (owner: cute expressions; head steady, emotion in brows, lids, mouth)
const kPoint = { E: [790, 1000], W: [840, 880], hand: 'point' };
const sMaanLo = { ...kp(1), blush: 0.4 };
const sCount = { ...kp(2), browLift: -1, browLiftAmt: 1.6, armR: kPoint, blush: 0.3 };                       // one brow up, finger counting
const sOoh = { ...kp(2), browUp: 1, lid: 0, blush: 0.7, lookX: 6 };                         // excited about the 8
const sAww = { ...kp(2), browSad: 1, mouth: 'pout', tilt: 8, lookX: 22, blush: 0.4 };        // sympathy for the 7, toward Monty
const sProud = { ...kp(4), blush: 0.6 };
const sReassure = { ...kp(4), browUp: 0.5, blush: 0.5, tilt: 5 };
const sTease = { ...kp(1), lid: 0.38, browLift: -1, mouth: 'smirk', blush: 0.5 };            // "lottery nahi" with a half-shut eye
const sFriendly = { ...kp(2), browUp: 0.4, blush: 0.5 };
const sWink = { ...kp(3), blush: 0.7 };
// two-shot: Sakshi left, Monty right (prop_gate 'formula' scales)
const duo = (t, kpose, mpose) => sakshi(kpose, 360, 1180, 0.72, t) + monty(mpose, 780, 1180, 0.7, t);

const SHOTS = [
  // M01 hook: jealous side-eye at the friend's story, then the puppy wail on "mera nahi?!"
  [0.0, 3.28, t => terraceScene(t, push(monty(seq(t, [[0, jealous], [1.75, mp(4)]]), 540, 1120, 0.95, t), t, 0))],
  // MEME1 "Emotional damage": hands to chest, then full cry with tears
  [3.28, 6.59, t => terraceScene(t, cam(monty(seq(t, [[3.28, hurt], [5.35, damage]]), 540, 1120, 0.95, t), 540, 820, 1.12))],
  // V03 Vishnu ji: enjoying popcorn, then the amused explanation, ends on the cute chakra wink
  [6.59, 9.46, t => terraceScene(t, push(vishnu(seq(t, [[6.59, vp(5)], [7.3, vp(2)], [8.85, vp(4)], [9.2, vp(5)]]), 540, 1080, 0.9, t), t, 6.59, 0.02))],
  // M04 "Saal ka kya lena-dena?!": full shock
  [9.46, 10.99, t => terraceScene(t, cam(monty(mp(1), 540, 1120, 0.95, t), 540, 900, 1.08))],
  // K05 Sakshi with fanned cards (smirk), Monty curious
  [10.99, 13.81, t => terraceScene(t, duo(t, sMaanLo, listen))],
  // K06 Sakshi explains the method, proud smile at the end
  [13.81, 17.95, t => terraceScene(t, push(sakshi(seq(t, [[13.81, sFriendly], [15.9, sCount], [17.1, sProud]]), 540, 1150, 0.82, t), t, 13.81, 0.015))],
  // K07 the sums: Monty counts along; pouts at "uska… 8", worried at "tumhara… 7"
  [17.95, 24.64, t => terraceScene(t, duo(t, seq(t, [[17.95, sCount], [20.6, sOoh], [21.5, sCount], [23.6, sAww]]), seq(t, [[17.95, counting], [20.6, jealous], [22.4, listen]])))],
  // K08 meanings: Monty jealous at "8 = result", then slumps and cries at "7 = ruk ke"
  [24.64, 30.65, t => ({ ...terraceScene(t, duo(t, seq(t, [[24.64, sOoh], [27.4, sAww]]), seq(t, [[24.64, jealous], [27.4, mp(6)]]))), over: t > 27.4 ? rainCloud(t, 780, 330) : '' })],
  // MEME2 "Aur bhai ruko… climax abhi baaki hai": cheeky stop, then the cheer
  [30.65, 34.09, t => terraceScene(t, push(monty(seq(t, [[30.65, ruko], [32.1, mp(5)]]), 540, 1120, 0.95, t), t, 30.65, 0.03))],
  // K10 the flip: Monty hopeful, then cheers at "ab tumhara 8"
  [34.09, 38.03, t => terraceScene(t, duo(t, seq(t, [[34.09, { ...kp(1), browUp: 0.6, blush: 0.4 }], [35.9, sOoh]]), seq(t, [[34.09, listen], [35.9, mp(5)]])))],
  // MEME3 "Ab tu gaya beta": evil grin, crash zoom
  [38.03, 39.37, t => terraceScene(t, cam(monty(scheme, 540, 1120, 0.95, t), 540, 800, 1.1 + 0.3 * ease(clamp((t - 38.03) / 0.3))))],
  // K12 "Arre, 9 bura nahi": Sakshi explaining, then her proud happy smile
  [39.37, 43.31, t => terraceScene(t, push(sakshi(seq(t, [[39.37, sReassure], [41.0, { ...kp(2), browUp: 0.3, blush: 0.6, tilt: 4, mouth: 'grin' }]]), 540, 1150, 0.82, t), t, 39.37, 0.015))],
  // K13 "mehnat ka result… lottery nahi": Monty cheers, then the pout on "lottery nahi"
  [43.31, 46.81, t => terraceScene(t, duo(t, seq(t, [[43.31, sFriendly], [45.4, sTease]]), seq(t, [[43.31, mp(5)], [45.4, { ...jealous, mouthShape: 'pout', lookX: -10 }]])))],
  // V14 takeaway: Vishnu ji serene, slow push-in
  [46.81, 50.84, t => terraceScene(t, push(vishnu({ ...vp(0), lid: 0.12, mouthShape: 'cat', browL: 0.3, browR: 0.3 }, 540, 1080, 0.9, t), t, 46.81, 0.02))],
  // K15 CTA: Sakshi explains, then the wink on "link pe click karo"
  [50.84, 57.08, t => terraceScene(t, push(sakshi(seq(t, [[50.84, sFriendly], [54.3, sWink]]), 540, 1150, 0.82, t), t, 50.84, 0.012))],
  // end: Monty cheers, Vishnu ji enjoys his popcorn
  [57.08, 59.08, t => terraceScene(t, vishnu(vp(5), 340, 1110, 0.62, t) + monty(mp(5), 760, 1180, 0.66, t))],
];
module.exports = K.film(SHOTS, 59.08);
