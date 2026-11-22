# Code-drawn cartoon reels — final workflow (Tarot Talk By Sakshi)

> **Full pipeline (updated 23 Nov 2026):** the complete toolchain, all owner decisions and the one-command build now live in the AI repo at `tarot-talk/cartoon-puppet/` (README.md). `bash make_reel.sh` makes the Mulank 8 reel from `tarot-talk/videos/2027-warmup-mulank8/`. Meme lines and trending sounds are in `tarot-talk/viral-hooks/HOOKS.md`. The notes below are the drawing craft for the characters.

How the chibi Vishnu ji character and animation is made: 100% code, no image model, no video model, no GPU. Only voices are paid (ElevenLabs, ask for a credit cap first).

Result of the final gate: all 9 gates PASS, independent score 8/10 against the #MythologyWithHumor reference.

## Files (project folder claude/cartoon-puppet/)
- engine.js — the drawing engine: ink lines, shading, bending limbs, hands, mouths, line boil.
- char_vishnu.js — the character: head, crown, jewellery, garland, dhoti, feet, conch, chakra.
- scene_vishnu_seated.js — one scene: timing of every move, lip shapes, camera.
- render.js — renders the clip (about 12 s for a 4 s clip on 2 CPU cores, zero tokens per frame).
- style_gate.py — measures a frame against the reference.

Run: `node render.js scene_vishnu_seated.js out.mp4` (add `--stills=0.2,2.0` for check pictures).

## Step 1 — Study the reference first (never guess the style)
- Capture frames of the reference reel, plus close crops of the parts that matter (face, hands, wrists, feet, jewellery).
- Measure with style_gate.py: outline thickness (thin inner lines about 2-4 px, thick outer lines about 11 px), ink colour (warm near-black #161017), one hard shadow tone per colour.
- Write down how each part is BUILT before drawing it. Example from the reference hands: palm faces the viewer in dusty red, thin skin-coloured rim, short grouped fingers, one thumb crease, chunky beads on the wrist.

## Step 2 — Build the character in code
- Every line is drawn as ink with changing thickness (perfect-freehand): thicker on the shadow side, tapered ends.
- Shading: base colour + one darker tone, hard edge, light from the top left.
- Chibi proportions: head about half the figure; short body.
- Limbs are bending tubes rebuilt every drawing from shoulder, elbow and wrist points. The inner side of a bend is limited so it never pinches or spikes.
- Shoulder: a round shoulder shape inked only on its outer edge, so the arm melts into the body.
- Wrist: the arm is drawn first, the hand on top; the hand narrows into exactly the arm's width; beads sit on the join and wrap round it.
- Hands are drawn poses, swapped like an animator's key drawings: point (index from the thumb side, lumpy curled fingers, red palm), open mitten (short grouped fingers, skin rim, blend tone, red palm).
- Jewellery uses shared helpers: gem (stone in a gold setting with a shine), pearl. Crown in clean tiers: gem band with pearl fringe, lotus-petal row, centre ruby, stacked rings, top jewel.
- Garland: hangs from the collar down the middle of the chest to the lap, drawn under the arms, never under the shoulders. Lotus, marigold, jasmine and tulsi leaves, packed so they overlap.
- Lotus-pose feet: soles up with heel, arch and toes; dhoti pleats fall between the heels.

## Step 3 — Animate (natural movement through joints only)
- Characters are drawn on twos: 12 new drawings a second, video at 24 fps; every line wobbles slightly per drawing (hand-drawn feel).
- Every action has a small anticipation, then an arc: e.g. arm raise = small dip, out, then up, spread over at least 1 second (about 12 drawings). The upper arm leads, the forearm follows.
- No big overshoot on arms; a moving hand never crosses the face.
- Props appear by growing in over about 6 drawings (chakra), never at full size in one drawing.
- Mouth shapes follow the Rhubarb set (A-F + X rest); with real audio the timing comes from the voice track.
- Secondary motion: breathing, earrings swing after the head moves, slow camera push-in, drifting clouds.
- Blur layers (sky, foreground cloud) are drawn once and moved, not blurred every frame.

## Step 4 — Quality gates (in this order; a FAIL stops the line)
- G1 Style: style_gate.py must PASS all 4 checks.
- G2 Close-up sheet: crops of face, crown, hands, wrists, feet, garland put next to the reference crops. Check by eye.
- G3 Motion sheet: every drawing of each fast action laid side by side. No one-drawing jumps, no part crossing the face, nothing popping, crown locked to the head.
- G4 Gesture safety: a raised single finger must read as the INDEX finger (thumb side, other fingers visibly curled). A lone centred finger reads as a rude gesture — never ship that.
- G5 Respect: deities are never mocked or shown indecently; follow the script's sensitivity notes (e.g. Shani dev always wins calmly and never looks into the lens).
- G6 Independent review: a fresh reviewer that did not make the work scores it against the reference (face, crown and jewellery, garland, hands, feet and dhoti, joints, motion, respect). Target 8/10 or higher, every gate PASS. Fix, then re-check only the failed gates.
- G7 Owner review (Ashish / Sakshi). Only after that: voices and the next character.

## Known limits
- Hands are the hardest part to draw in code. Always build them from a close study of the reference hand, never from a generic idea of a hand.
- Remaining small fixes from the last review: move the raised hand a little away from the earring, add a few dhoti fold lines, clean a tiny notch at the right armpit.
