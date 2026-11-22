# Cartoon puppet: code-drawn #MythologyWithHumor reels

Turns a script package (script + cast sheet + voice lines) into a finished 1080x1920 reel. The cartoon is drawn entirely in code: no image model, no video model, no GPU, and no AI tokens spent per frame. The only paid step is voices (ElevenLabs), which come in with the script. Ask the owner for a credit cap before any voice test.

The first reel made this way is Tarot Talk By Sakshi's "2027 warm-up, Mulank 8" (86 s, `../videos/2027-warmup-mulank8/`).

## Quick start (any agent)

```bash
cd tarot-talk/cartoon-puppet
bash make_reel.sh          # about 3 min on 2 CPU cores -> out/mulank8.mp4
```

Needs node 18+ (with `@resvg/resvg-js` and `perfect-freehand` from `npm install`), python3 with numpy and scipy, and ffmpeg. `faster-whisper` is optional; `find_phrase.py` uses it to check meme clips.

Pictures to check one moment: `node render.js roughcut.js cast/chk --stills=12.5,45.2` writes `cast/chk_0.png`, `cast/chk_1.png`, and so on. Look at stills; never read frames into chat to make them.

## Tools and what each file does

| File | Job |
|---|---|
| `engine.js` | Drawing engine: variable-width ink (perfect-freehand), line boil, one-tone hard shading, `limb()` bending arms and legs, `arm()` with shoulders melted into the torso, hands (palm, point, fist, relax), Rhubarb mouths A–F/X, catmull curves |
| `render.js` | Worker pool. Draws 12 drawings per second, pipes them to ffmpeg at 24 fps, CRF 18, with a light grain blur. `--stills=` writes PNGs. A scene module exports `DUR` and `svg(t)` |
| `char_monty.js` | Monty (Mulank 8 guy, comic lead): eye system (iris, lids, watery, happy, squeeze, blink), cute mouths, manpu (sweat, gloom, sparkle, shock lines) |
| `char_vishnu.js` | Vishnu ji seated on his cloud: popcorn floating into his mouth by magic, chakra, conch, four arms |
| `char_shani.js` | Shani dev standing: trishul, KARMA register, crow (KAA), spotlight, spinning Saturn. Moods: calm, stern, warm, deadpan, hisaab |
| `char_brahma.js` | Brahma ji: the Vishnu body re-dressed, cloud beard, four arms, Vedas and kamandalu floating, stamp fused into the fist, token counter |
| `char_sakshi.js` | Sakshi as a cute modern girl: ponytail, star dress, denim jacket, floating tarot cards |
| `char_side.js` | Bunty and Khanna sir busts for the Mulank intro cards |
| `cast_*.js` | Cast sheets: every approved pose, exported as `POSES` (`node render.js cast_monty.js cast/monty --stills=0,1,2,...`) |
| `loc.js` | Locations: Diwali rooftop at night, cosmic office in the clouds, Shani's court. Also the sutli bomb, diyas and clouds |
| `act.js` | Acting layer: lip-sync from the voice track, irregular blinks, eye darts, brow pops and head nods on syllables, calmer deities, nervous Monty |
| `roughcut.js` | The film: every shot (location, actors, poses, camera, graphics, captions), timed on the script clock and mapped to the final voice clock |
| `build_voice.py` | Splices original meme lines into the voice track through an edit list. Writes `audio/voice_track_v3.wav` and `audio/timeline_v3.json` |
| `lipsync_prep.py` | 100 Hz loudness, brightness, syllable onsets and speaker windows -> `audio/lipsync.json` |
| `audio/mix.py` | Voice + our SFX (`../viral-hooks/sfx`) + trending meme sounds, mapped to the new clock |
| `fetch_clips.sh` | Downloads the original meme clips. They are not kept in git |
| `make_captions.py` | Captions from the script's `**Captions:**` lines |
| `prop_gate.js` | Proportions gate: on-screen height ratios against the cast sheet (blocking) |
| `style_gate.py` | Line width and ink colour against the reference frame (unreliable on dark scenes) |
| `find_phrase.py` | Transcribes a clip with word times, to check that a meme clip really says the line |
| `scene_*.js` | Single-character test scenes (Vishnu popcorn, Shani moves, Sakshi moves) |

## Workflow (batches, each one reviewed before the next)

1. **Script package in.** `SCRIPT.md` (beats with times, captions, picture, sound), `cast.json`, `voices/lines/*.wav`, `voices/cue_sheet.csv` and `voice_track_timed.wav`. Copy the folder shape of `../videos/2027-warmup-mulank8/`.
2. **Batch 1: cast.**
   - Write `char_<id>.js` and `cast_<id>.js` for each character, then render the sheet and a face close-up.
   - Show the owner one character at a time and fix until they say ok.
   - Then send it to an independent reviewer (a fresh agent with the cast PNGs and the rules). It must score 8/10 or higher and break no rule. The first pass scored 6.5; fixes brought it to 8.
3. **Batch 2: locations and rough cut.**
   - Build the locations in `loc.js` and the shots in `roughcut.js`, timed to the voice track, with captions and graphics.
   - Run `prop_gate.js`, review a contact sheet of about 20 stills with the reviewer, then the owner.
4. **Viral audio.**
   - Find the original meme lines and trending sounds (method in `../viral-hooks/HOOKS.md`).
   - Check each one with `find_phrase.py`, add it to `fetch_clips.sh`, splice it with `build_voice.py`, and place it with `audio/mix.py`.
5. **Batch 3: acting and final.**
   - The `act.js` faces are on.
   - Still to do for full polish: arm gestures on the beat, Monty's knee shiver, Shani's trishul thump, a music bed with ducking, and -14 LUFS.
   - Then the final independent review and the owner's sign-off.

## Decisions made (owner, Nov 2026); keep them

**Drawing and motion**
- **Everything is drawn in code.** No image or video model, no GPU, no frames through chat. Style target: the #MythologyWithHumor chibi deity reels (thick dark ink, flat fills, one shade, big heads).
- **Joints only.** Characters move through their own joints. No whole-picture slide, hop, rotate or stretch, and no warping. Shoulders melt into the torso; there are no bolted ball joints.
- **No gripping hands.** Props float by magic, with a glow, or are fused into a closed fist (Shani's trishul, Brahma's stamp). Fingers are short and chubby, never spidery.
- **Research real objects before drawing them**, for example what a PVR popcorn tub looks like. No real brand logos: the tub carries a TT badge.

**Characters**
- **Indian look**, never East-Asian-looking.
- **Monty:** fair skin, teeka, cute puffy hair; spikes only in shock; very expressive, cute eyes.
- **Vishnu ji:** never on a chair, always seated on his cloud, slim tummy, enjoying popcorn that flies into his mouth. The chai beats became popcorn.
- **Shani dev:** standing, intense but dignified. Never looks into the lens, never mocked, no feet toward the camera, the trishul never pointed at anyone. Gaze sits 15–20° off-axis in every pose.
- **Brahma ji:** built on the approved Vishnu chibi body, with the mouth clear of the beard.
- **Sakshi:** a cute little girl, matched to the reference style (simple almond eyes, no anime sparkle), modern outfit (star dress and denim jacket), high ponytail. Fairer skin.

**Proportions**
- Fixed by `prop_gate.js`: Monty 1.0, Sakshi 0.9, Shani 1.15; seated deities count at 0.8 of standing height.

**Audio**
- **Original meme voices beat our re-voices.**
  - These lines play as the original clips: "Ab tu gaya beta" (Puneet Superstar), "Aayein?!", "Ruko zara sabar karo" (Hindustani Bhau) and "Baccha hai tu mera" (Rakesh Bedi, Dhurandhar 2).
  - These trending sounds are in the mix: FAAAH, vine boom, moye moye, anime wow and the oh-no-no-no laugh.
  - Meme sounds land on Monty, never as mockery of a deity, and sit in gaps or low under reactions.
  - Clips stay out of git (public repo); only their links are stored.
  - Risk accepted by the owner: Instagram may mute or flag film or song audio.
- **Faces must be active and catchy:** lip-sync on every line, blinks, eye darts, brow pops, and a small punch on every cut.

**Format**
- **Instagram safe zones:**
  - Captions sit at about 72–75% of the height.
  - Keep the right 12% and the bottom 20% free of key items.
  - Use one full-width card per beat, not small cards.

## Starting a new video

1. Make `../videos/<slug>/` with the same package files.
2. Reuse the characters, or write new `char_*.js` files with the engine helpers.
3. Copy `roughcut.js` to `<slug>_cut.js` and rewrite `SHOTS` from the new script.
4. Update `build_voice.py` `CLIPS` with the new meme lines, and the cue list in `audio/mix.py`.
5. Point `make_reel.sh` at the new files.
6. Gate every batch with an independent reviewer, then the owner.
