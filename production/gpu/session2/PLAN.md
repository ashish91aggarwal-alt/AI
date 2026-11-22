# GPU session 2 — 2a regens (17–18 Nov), 2b Wan I2V (19 Nov), for F1 and W3

The queues and numbers below come from `runner.py` (`python3 runner.py --plan`); the tables must
match the code. `python3 runner.py --selftest` and `python3 check_clip.py --selftest` must pass
before launch.

## Hardware, model, settings
- GPU: RTX PRO 6000 Blackwell 96 GB, secure cloud, **$2.69/h** (the rate paid in session 1). Before launch the A100 80 GB is compared on **cost per clip** (rate × minutes per clip), not on $/h; the cheaper per clip wins.
- Video model: **Wan2.2-I2V-A14B** (Apache-2.0) with the **LightX2V 4-step distill** weights (Apache-2.0, lightx2v/Wan2.2-Distill-Models). **4 sampling steps in total**: Wan2.2-A14B has two experts, so 2 steps on the high-noise expert + 2 on the low-noise expert, as the LightX2V card specifies. Guidance 1.0.
- Image model (regens): Qwen-Image (Apache-2.0), 40 steps, as in session 1.
- I2V input: a **1:1 pixel crop of the 4K composite** (no downscale), at most 832×480, multiple of 16. Working rate 16 fps. Every prompt includes "static locked-off camera, no camera movement".

## From I2V to 4K (no upscaling of animal frames)
- Subject sizes in the 3840×2160 frame: fox composited at ≈ 460×260 px; foreground sheep ≈ 640×380 px; F1 hearth opening ≈ 620×460 px; W3 campfire ≈ 360×300 px. Each fits inside an 832×480 crop at full resolution, so **the I2V output is already at final pixel size**.
- Only the moving part is taken back: the flank/chest (and ear) through a soft mask, or the flames through a soft mask. Everything else stays the still 4K plate.
- Backup if the G2 check shows the I2V detail is softer than the plate: **motion transfer**. Optical flow from the I2V frames (relative to frame 0) is applied to the full-resolution still subject, so the pixels are always the plate's own. Per-frame GAN upscaling of animated frames is not allowed (it shimmers).
- **G2 check:** inside the subject mask, Laplacian sharpness of the animated frames ≥ 90% of the still's, and frame-to-frame difference during the rest pause ≤ the clip's own noise (no shimmer).
- Plate upscaler (stills only): **Real-ESRGAN, RealESRGAN_x4plus** (BSD-3-Clause, xinntao), ×4 then Lanczos down to height 2160 and centre-crop to 3840. Community ESRGAN models with non-commercial licences are not used.
- Frame interpolation (RIFE, MIT) runs on the I2V layers only, **before** compositing, to 30 fps.

## Time per item (estimates; the runner replaces them with measurements)
Source of the 1.5 min base figure: a public Hugging Face model card (Leon1000/Wan2.2_I2V_LightX2V_2Step) reports ≈ 89 s for an 81-frame 512×848 clip with **8** LightX2V steps (4+4) on unstated hardware. We run 4 steps, so 1.5 min for 81 frames at ≤ 832×480 is on the safe side. Longer clips scale with (frames × pixels)^1.5. Qwen-Image measured in session 1: 37–41 s per image.
| Item | Est. minutes |
|---|---|
| Setup (pod start, ≈ 60 GB weights, load) | 12 |
| Qwen-Image load | 4 |
| One image | 0.68 |
| 81 / 89 / 97 / 113 / 129 frames | 1.5 / 1.7 / 1.95 / 2.5 / 3.0 |

## Queues (priority order; F1 and W3 items alternate so a slow day hurts both equally)
**Session 2a — images + F1 music retry, cap $2.69 (MAX_MIN 60), run 17 Nov after session 1 was stopped.**
The fire crops must come from the plate that G1 picks out of these regens, so all video moved to 2b.
G1 pre-screen of session 1 (17 Nov) showed: every F1 plate has a dog-like animal on the rug (the prompt's "empty space for a sleeping animal" invited one); W3 plates have bare dirt circles, tents, and one has a person; the sheep elements lie on their side with legs out and flames in frame. So 2a regenerates all four with the corrected prompts in `prompts.json` (per-item negatives); any item the G1 reviewer passes from session 1 is dropped before launch. Only Qwen-Image is downloaded.
| Order | Items | Card |
|---|---|---|
| 1 | Setup 8 + Qwen load 4 | shared |
| 2 | Images, interleaved: F1 plate 8, W3 plate 8, fox 6, sheep 6, new Page & Lantern banner art 6, new Prayer Pastures banner art 6 (brand gate: lantern/sheep must sit inside the phone band) | F1 / W3 |
| | **Images total 39.2 min = $1.76** (F1 19.6, W3 19.6; the banner art is reported on the brand line) | |
| 3 | F1 music retry with ACE-Step 1.5 (weights pre-downloaded with huggingface-cli + hf_transfer; session 1's own downloader crawled), limited to the minutes left under the cap; FLAC masters go to a GitHub release | F1 |

Then G1 picks plate, fox and sheep; the composites and the 1:1 I2V input crops and masks are made locally and committed to `inputs/`.

**Session 2b — video, cap $2.80 (62 min; MAX_MIN 62), 19 Nov after G1.**
| Order | Items | Card |
|---|---|---|
| 1 | Setup 12 (Wan2.2 + Lightning LoRAs) | shared |
| 2 | Fire, 89 frames: hearth1, campfire1, hearth2, campfire2, hearth3, campfire3 | F1 / W3 |
| 3 | sheep_test (129-frame length test) | W3 |
| 4 | fox1, sheep1, fox2, sheep2, fox3, sheep3, fox4, sheep4 | F1 / W3 |
| 5 | fox_ear1 | F1 |
| 6 | Spares: hearth4, campfire4, fox_ear2 | F1 / W3 |
| 7 | Automatic top-ups when short of usable breaths: up to 2 sheep, 1 fox (jump the queue) | W3 / F1 |
| | **Total 55.6 min = $2.49** (F1 27.8, W3 27.8); with all top-ups 64.6 min, so the cap trims the spares first | |

## Card totals against budgets (worst case: all regens, all top-ups)
| Card | Session 1 share (by job time) | Session 2a | Session 2b | Total | Budget |
|---|---|---|---|---|---|
| F1 | $1.45 (images 9 min + the 23 min music download that never finished) | ≤ $0.88 images + ≤ $0.85 music | $1.38 | ≤ $4.56 | $5 |
| W3 | $0.40 (plate, sheep) | $0.88 | $1.52 | ≈ $2.80 | $3 |
Setup and the Qwen load are shared items, always split 50/50 between the cards. The runner is given each card's real remaining budget at launch, so the totals can never pass $5 / $3.

## Hard limits (enforced by code, tested)
1. Before each item the runner computes the minutes still allowed by **both** the session cap (minus a 3-minute push reserve) and the item's card budget, and starts the item only if its scaled estimate fits.
2. Each item runs in a subprocess with **that allowance as its timeout**; at the timeout it is killed and charged. So spend can never pass the session cap or a card budget, whatever the real speed.
3. Estimates are scaled by the **slowest** measured/estimated ratio seen so far (never optimistic).
4. `start.sh` sets `MAX_MIN` = the session cap in minutes (backstop), plus the 10-minute idle kill and stop at the end, as in session 1.
5. `runner.py --selftest`: at 1×, 2×, 3× and 4× slower than estimated, 2a stays ≤ $2.40 (images) and 2b ≤ $2.80 and each card ≤ its limit; a W3 limit of $0.60 stops W3 at $0.54 while F1 continues.
6. Must-have items that could not run go to `out/remaining.json`; a follow-up session needs the owner's OK (new spend).

## Automatic checks on the pod (`check_clip.py`, no person in the loop)
1. **Drift:** phase correlation of the subject's edges outside the motion mask; ≤ 1 px over the clip, else discard.
2. **Stability:** last third vs first third: sharpness and colour within 10%; no frame step above 3× the clip's 90th-percentile step (no flash, no snap back to the start image).
3. **Breath yield:** optical-flow motion inside the flank mask; rest = ≥ 0.25 s below 20% of peak motion (the end-of-exhale pause; the pause at the top of an inhale is shorter); usable breath = rest-centre to rest-centre inside the retime window (fox 2.61–3.53 s, sheep 3.48–4.71 s) with 0.25 s of rest after it inside the clip. Known limit: a breath whose rest is cut by the clip end is measured short and dropped (safe side).
4. **Length test:** the first breathing clip at each length; failing stability steps the length down 129 → 113 → 97 frames and adds 2 extra clips per subject.

## Breath yields per clip (chance a clip holds at least one usable breath)
| Length | Fox (3.0 s; window to 3.53 s) | Sheep (4.0 s; slowest 4.71 s) | Plan |
|---|---|---|---|
| 129 (8.06 s) | 1.00 (guaranteed) | ≈ 0.95; 0.66 at 4.71 s | 4 fox, 5 sheep → P(sheep ≥ 2) ≥ 0.95 |
| 113 (7.06 s) | ≈ 1.0 at 3.0 s; ≈ 0.93 at 3.53 s | 0.45–0.70 | + 2 clips each → P(sheep ≥ 2 of 7) ≥ 0.89 |
| 97 (6.06 s) | ≈ 0.9 | 0.23–0.45 | + 2 clips each → P(sheep ≥ 2 of 7) 0.51–0.90 |
**Floor that needs no new session:** if a subject ends with only 1 usable breath, its loop becomes a one-breath ring (fox 3.0 s × 30 = 90 s; sheep 4.0 s × 30 = 120 s). The runner reports it; G2 judges whether it reads as natural. If G2 fails it, a new clip set needs the owner's OK.

Both scripts pass `--selftest` (synthetic breathing clips at 3.0, 4.0 and 6.0 s; a 6 px drift; a flash; the money and fallback tests above). Still to build before 19 Nov: the Wan generation subprocess, the BiRefNet per-frame matte, the motion-transfer backup, `start.sh` for session 2, and `prompts.json` with the corrected regen prompts.

## Before the session-2 pod is created (from the W3 G0 round-7 review)
1. **Setup timeout:** setup gets its own 20-minute limit and a download-rate floor (abort if < 20 MB/s over 2 minutes); all weights are fetched with the system `huggingface-cli` + hf_transfer (HF_TOKEN set as a Runpod secret if needed) before any GPU work; container disk sized for Wan2.2 (~60 GB) + Qwen-Image (~58 GB) + 20 GB headroom. (Session 1's ACE-Step download ran at 1.6–4.9 MB/s and its progress bar kept the idle kill from firing.)
2. **start.sh for session 2:** MAX_MIN = 60 for 2a ($2.69, images + music) and 62 for 2b ($2.80), 10-minute idle kill that ignores progress-bar-only log changes, stop at the end.
3. **Wall-clock charging:** the runner times every call itself and charges real time including checks, matting, pushes and reloads; Wan stays loaded in one `worker.py` process; a killed worker's reload is charged as setup.
4. **Build and run once before launch:** worker.py's Wan path, the per-frame matte, the motion-transfer backup.

## Outputs
Clips as lossless PNG frames + an MP4 preview, `breaths.json`, `checks.json`, `cost.json` (minutes and $ per card), `remaining.json`, pushed to branch `gpu/session2` every 5 minutes.
