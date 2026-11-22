---
name: living-picture-ambient
description: Use when turning a still picture into a long ambient YouTube video (cozy room, fireplace, candles, steam, snow or rain, a sleeping pet) with non-repeating motion and original ambient music.
---

# Living picture + ambient music

Turns one still picture into a long ambient video where every light and moving thing is alive, nothing else moves, no loop can be spotted, and the music is original. Built and proven on c4, "sleepy cat cabin", Nov 2026. The code lives in the ambient-channels repo:
- `production/loop/living.py` is the engine.
- `production/loop/compose_c4.py` is the example compositor.
- `production/gpu/session2/` holds the GPU session.
- `production/audio/` holds the music.

## Owner rules (always)
- Ask before spending any paid credit or GPU money. Give the count of clips, the minutes and the dollar cap.
- Start with a review batch of 1–2 clips. Only then run the full batch.
- Every GPU job has a hard cap, an idle kill, a download-rate floor and a self-stop, plus a watchdog check scheduled with send_later. Terminate the pod after downloading the results. Never touch pods this conversation did not create.
- Make music locally; never use a pod for music.
- Only natural movement. Animals and people move through their own joints. Never slide, scale or rotate a cut-out.
- Nothing reaches the owner before both the automatic gate and an independent reviewer pass it.
- Reports are in simple text with IST times.

## 1. Inventory (before any work)
1. Make two independent inventories of the picture, yours and a fresh reviewer subagent's, and work from the union. List:
   - every light source: fire, coals, candles, lantern, lamps, screens, moon;
   - every moving thing: flames, steam from any mug, snow or rain, smoke, pets, curtains;
   - everything that must stay still;
   - look-alike traps: moonlit wood strips, pale sofa sheen, painted snowflakes on fabric.
2. Write the layer plan, one line per element (see `production/loop/LAYERS.md`):
   - source: AI clip, or code (small flames, lamp breath, light spill);
   - mask;
   - how its light reaches the room;
   - movement limits;
   - the end points: where steam starts and stops, which edge the snow stops at.

## 2. Masks (review every overlay image)
- **Glass:** hand-trace the pane polygons, then subtract everything in front (lampshade, sofa, throw, walls) and erode by 3 px. Never use a colour-only mask: one put "snow inside the room" on moonlit wood and on the sofa top.
- **Subjects (cat etc.):** trace a rough polygon, refine it with GrabCut at 2× scale, then check the overlay by eye.
- **Moonlit surfaces:** these are the only places snow shadows may fall. Find bluish pixels near the windows that are not glass.

## 3. AI clips (GPU)
- **Model:** Wan2.2-I2V-A14B-Diffusers with the lightx2v Wan2.2-Lightning I2V Seko-V1 4-step LoRAs. Settings: guidance 1.0, 97 frames at 16 fps, CPU offload plus VAE tiling, ftfy installed. About 2 min per clip on an RTX PRO 6000 ($2.69/h).
- **Crops:** one crop per element, upscaled so it is at most 832×480 pixels, in multiples of 16.
- **Prompts:** say what moves, then "everything else stays completely still, hand-drawn storybook illustration style". Add the static-camera wording.
- **Characters:** use first-and-last-frame clips (`last_image` = the still). Every clip then starts and ends in the resting pose, so clips can be joined in any order. Make a bank:
  - resting breathing clips;
  - small events: ear twitch, whisker twitch, nuzzle, tail flick, paw knead.
- **Session code:** `production/gpu/session2/start.sh` with PHASE, MAX_MIN, CARD_LEFT and ONLY (the review batch).
  - Data centres EUR-IS-2 or US-NC-2, which download fast.
  - 300 GB disk; download only the Lightning I2V folder.
  - The model download can hang partway (seen 4 times on 18 Nov, at 83–128 of ~121–136 GB). The per-download hang detector kills it after 80 s with no disk growth and retries without xet (`HF_HUB_DISABLE_XET=1`). Keep it.
  - Start command: fetch start.sh from the repo, and stop the pod if the fetch fails. Never paste an encoded script by hand.
  - Masters go to a GitHub release.
- **Clip review:** measure camera drift by phase correlation on the still parts and reject clips over about 0.5 px. Skip the first 8 frames (frame 0 is the sharp still).

## 4. Composite (`living.py` + a scene compositor)
- **Banks, not loops:** each layer plays a random walk over its clips. It plays 1.6–4 s, then jumps to the most similar frame in another clip, joined by a 10-frame optical-flow morph. Layers use different seeds, so the full picture never repeats. Each render closes exactly (frame T = frame 0), so a unique block, e.g. 10 min, can be repeated for long videos.
- **Frame rate:** go from 16 to 24 fps with flow in-betweens. Never cross-fade neighbouring drawings; that doubles the flames.
- **Steam:** add only the moving wisps onto the untouched picture. Swap the painted wisp for the clip's background inside a soft shape. Keep the steam inside its end points (left of the lampshade, above the rim). Remove floating specks under 320 px.
- **Sparks:** tint pale sparks ember orange so they can't read as snow.
- **Small flames** the model distorts (a candle stretched into a needle): animate the picture's own flame in code. Use looping noise; height ±7% (max ±12%), sway under 1 px, and a dim flame goes warmer, never grey.
- **Light spill:** each light's spill follows its own layer's brightness, normalised to a 3–5% swing on nearby surfaces. Fire spill is wide. The lamp breathes 1.5% slowly. Spill never falls on the glass.
- **Snow shadows:** soft darkening specks from the real falling flakes, only on moonlit surfaces, at most 35% darker, never white.
- **Characters:** paste their clips inside the reviewed subject mask, plus only the areas the movement really needs (e.g. the pillow under the chin for a paw). First-and-last-frame clips pump the brightness by up to 40% mid-clip: correct every frame with a per-channel gain measured on a ring just outside the subject. Never let the mask reach background where the model invents things (a glow blob appeared on the sofa above the cat).
- **Character timing:** resting-breath clips form the base bank. Small events (ear, whiskers, nuzzle, tail, paw) come at random, every 40–120 s, never on a schedule. See `production/loop/cat_test_preview.py`.

## 5. Gates
1. **Automatic gate** (`compose_*.py --gate`):
   - moving pixels outside the masks = 0;
   - moving non-glass pixels in the window area = 0;
   - every inventoried light moves (p95 std);
   - loop point equal;
   - longest repeated stretch per layer is reported.
   - "Moving" means a change over 4 levels AND over 5% of the pixel's brightness, so light spill doesn't count.
2. **Decoded-file check** (`/tmp/c4check.py`-style, streaming). Decode with BT.709 and the accurate flags. Checks:
   - colour vs the picture within 1 level;
   - largest frame-to-frame jump in still areas under 0.5 (keyframe pops);
   - spill swing 3–5%.
3. **Independent reviewer subagent** with the 8-point checklist:
   1. all lights alive;
   2. fire really burns;
   3. snow only on glass;
   4. nothing else moves, no boxes or shimmer;
   5. steam end points;
   6. character moves naturally only;
   7. no loop or seam visible;
   8. nothing degraded vs the picture.
   Fix and re-review until PASS.

## 6. Encode
- Use `scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int`, yuv420p, BT.709 tags, x264 crf 14, slow preset, tune animation.
- Long videos are ONE continuous encode, not copies of a file joined together.
- For the YouTube upload, consider upscaling to 4K. YouTube gives 4K a better codec and bitrate, which keeps line art and colour edges sharp.

## 7. Music (local)
- **Composition:** write it yourself in code (see `production/audio/c4_piano.py`). Slow tempo (around 58 bpm), soft touch, a clear melody within the first 30 s. Form: intro, A, A′, B, A″, outro.
- **Rendering:** Salamander piano samples via `render.py`. Use ONE mic of the spaced pair (the two channels cancel on some notes) and let the reverb give the width.
- **Mastering:** about −20/−21 LUFS, peak −2 dBFS. Darken the highs gently and dip 200–420 Hz.
- **Beds:** fire crackle at −8 dB and wind at −17 dB under the piano.
- **Check:** run listen-by-measurement (`listen.py`) on loudness, balance, stereo correlation (0.6–0.8) and gaps. Say that the measurements stand in for hearing it.
- **Long videos:** sequence several different pieces with crossfades so nothing repeats within the hour.

## 8. Package
- Thumbnails with no text (like the niche winners): one full scene, one closer on the subject.
- Three title options.
- Send the owner a 2-minute preview with sound before any long render.
