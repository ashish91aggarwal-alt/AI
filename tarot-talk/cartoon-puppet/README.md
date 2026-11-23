# Cartoon puppet: code-drawn #MythologyWithHumor reels

Turns a script package (script + cast sheet + voice lines) into a finished 1080x1920 reel. The cartoon is drawn entirely in code: no image model, no video model, no GPU, and no AI tokens spent per frame. The only paid step is voices (ElevenLabs), which come in with the script. Ask the owner for a credit cap before any voice test.

The first reel made this way is Tarot Talk By Sakshi's "2027 warm-up, Mulank 8" (86 s, `../videos/2027-warmup-mulank8/`).

**New session? Read `START.md` first**, then `HOW_WE_WORK.md` (method and owner rules) and `CHARACTERS.md` (reusable cast).

## Quick start

```bash
cd tarot-talk/cartoon-puppet && npm install
bash make_reel.sh 2027-warmup-mulank8        # ~3 min on 2 CPU cores -> out/2027-warmup-mulank8.mp4 (identical to the approved v7)
python3 tools/new_video.py <slug>            # new video from videos/<slug>/ script package
bash make_reel.sh <slug>
```

Needs node 18+ (`@resvg/resvg-js`, `perfect-freehand`), python3 with numpy and scipy, and ffmpeg. `faster-whisper` is optional (for checking clips).

## Layout

| Path | Job |
|---|---|
| `engine.js` | Drawing engine: variable-width ink, line boil, hard shading, bending limbs, melted shoulders, hands, mouths |
| `render.js` | Worker pool: 12 drawings/s, 24 fps, ffmpeg. `--stills=` writes PNG check pictures |
| `char_*.js` / `cast_*.js` | The characters and their approved poses (see `CHARACTERS.md`) |
| `loc.js` | Locations: Diwali rooftop, cosmic office, Shani's court, plus props (sutli bomb, diyas, clouds) |
| `act.js` | Acting layer: lip-sync, blinks, eye darts, brow pops, head nods, talking gestures, fear shiver |
| `kit.js` | Everything a film file needs: placed characters, scenes, camera, text, captions, the voice clock, `film()` |
| `cuts/<slug>.js` | One film per video: its shot list (script clock) and its own graphics |
| `tools/new_video.py` | Scaffolds a new video (config, captions, cue file, shot list) |
| `tools/fetch_clips.py` | Downloads that video's meme clips from their links (never committed) |
| `tools/build_voice.py` | Splices original meme lines into the voice track (edit list) -> `work/<slug>/voice.wav` + `timeline.json` |
| `tools/lipsync_prep.py` | Drive data for the acting layer -> `work/<slug>/lipsync.json` |
| `tools/mix_sfx.py`, `tools/make_music.py`, `tools/final_mix.py` | SFX and meme sounds; original tabla, santoor and tanpura bed ducked under speech; -14 LUFS |
| `prop_gate.js`, `style_gate.py`, `find_phrase.py` | Proportions gate, style check, clip transcription |
| `../videos/<slug>/` | Script package + `video.json` (speakers, meme lines, sounds, music plan) + `captions.json` + `sfx_cues.json` |
| `../viral-hooks/` | Meme lines, trending sounds, sources, placement rules, our SFX generator |

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
