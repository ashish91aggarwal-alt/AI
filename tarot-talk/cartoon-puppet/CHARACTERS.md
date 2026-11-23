# Character library (reuse these; they are owner-approved)

Voices: `../assets/voices.json` has each character's ElevenLabs voice id, speed and effects. Reuse them so the cast always sounds the same.

Every character is code: `char_<id>.js` draws it from a pose object, and `cast_<id>.js` holds the approved poses as `POSES` (render the sheet with `node render.js cast_<id>.js cast/<id> --stills=0,1,2,...`).

In a cut file, place a character with the kit helper. It runs the acting layer automatically: lip-sync when it is that character's line, blinks, eye darts, brow pops, head nods, and a talking-arm gesture.

| Kind | Helper in `kit.js` | Poses (index: name) | Anchor and scale | Notes and rules |
|---|---|---|---|---|
| `monty` | `monty(mp(i), x, y, s, t)` | 0 worried, 1 shock, 2 fear, 3 evil, 4 puppy, 5 cheer, 6 cry, 7 flatter | (x, y) = mid-body; s 0.95 for a solo close shot, 0.66–0.72 next to others | Comic lead, Mulank 8. Fair skin, teeka. Hair spikes only in shock. `shiver: 1` makes the knees knock. Meme sounds land on him |
| `vishnu` | `vishnu(vp(i), x, y, s, t)` | 0 serene, 1 Ab tu gaya beta, 2 motor-mouth, 3 hiding behind popcorn, 4 chakra flick, 5 popcorn | seated on his cloud; s 0.9 solo, 0.62 in a two-shot | Never on a chair, always flying. Popcorn flies into his mouth (`float`). Never the butt of a joke |
| `shani` | `shani(sp(i), x, y, s, t)` | 0 calm, 1 haazri (trishul), 2 half-nod, 3 crow KAA, 4 Hisaab warm, 5 calm talking, 6 stern, 7 warm talking, 8 Hisaab closed | standing, s 0.98 solo | **Never looks into the lens** (gaze stays off-axis), no feet toward the camera, trishul upright and never pointed at anyone, never mocked. Props: `trishul {x, y}`, `register {x, y, glow}`, crow `kaa`. Moods: calm, stern, warm, deadpan, hisaab |
| `brahma` | `brahma(bp(i), t, side)` | 0 busy stamping, 1 Ek-ek karke aao, 2 Aath?, 3 Next!, 4 tired sigh | comes with the token counter and desk; `side = 1` puts him left and smaller so Monty can stand beside the desk | Built on the Vishnu chibi body, cloud beard, four arms; stamp fused into the fist |
| `sakshi` | `sakshi(kp(i), x, y, s, t)` | 0 rest smile, 1 Notes chahiye (cards fanned), 2 explaining, 3 Comment karo REPORT (wink), 4 proud | s 0.82 solo, 0.72 next to Monty | The host who sells (CTA). Cute modern girl: ponytail, star dress, denim jacket. Tarot cards float by her hand. Extra face fields: `browUp` (0-1, both brows), `browSad` (sympathy), `browLift: ±1` + `browLiftAmt`, `blush` (0-1), `mouth: 'o' / 'grin' / 'pout' / 'smirk'`, `lid`, `happy`, `wink`. No syllable head nods |
| `bunty`, `khanna` | `SD.bunty({x, y, s})`, `SD.khanna({...})` | flags: `wink, happy, mouth, sweat, small, browUp, frown` | busts for intro cards | Side cast only |

**Pose overrides:** take any pose and change fields, e.g. `{ ...mp(0), lookX: 20, tilt: 6 }`.
- **Arms:** `armL` / `armR` with `E` (elbow) and `W` (wrist) points and a `hand` ('relax', 'palm', 'point', 'fist').
- **Mouth shapes:**
  - Monty: `cat, wavy, o, pout, grinBig, smileBig, wail, nervous`
  - Vishnu: `sly, smileBig, cat, o, hidden, munch`
  - When a character speaks, the acting layer replaces these with lip-sync, except for big emotional shapes on quiet syllables.

**Proportions** (enforced by `prop_gate.js`): Monty 1.0, Sakshi 0.9, Shani 1.15; seated deities count at 0.8 of standing. Add every new two-shot to the gate.

## Adding a new character

1. Write `char_<id>.js` with the engine helpers (`part`, `limb`, `arm`, `ink`, `fill`, `clipped`), following `DRAWING_NOTES.md`. Start from the closest existing character file.
2. Write `cast_<id>.js` with 4–8 poses for the beats it plays, then render the sheet and a face close-up.
3. Owner approval, then an independent review (8/10 or better, no rule broken).
4. Add a placement helper in `kit.js`, map its face controls in `act.js` (`perform`), give its speaker name in `video.json` `speakers`, and add its height to `prop_gate.js`.
