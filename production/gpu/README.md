# GPU sessions (Runpod)

Each session is a folder with `prompts.json`, `gen.py` and `start.sh`. The pod is created with
`START_B64` = base64 of `start.sh`, plus env `AMBIENT_GH={{ RUNPOD_SECRET_ambient_github_token }}`
(a fine-grained token with Contents read/write on this repo only) and `MAX_MIN`.

Budget guard, required for every session (owner rule):
- **Hard cap** `MAX_MIN`: push the results, then stop the pod.
- **Idle kill:** if the run log is unchanged for 10 min, push and stop.
- **Stop at the end** of the job. Model weights live on the container disk; only masters go on a
  small persistent volume (20 GB, about $0.13/day while stopped). Terminate the pod once the
  masters are pulled.
- Quote the hourly price from `list-gpu-types` before creating. Log the actual spend in the card `spend` list.

Results are pushed to branch `gpu/<session>`, never to main.

| Session | Pod | GPU | $/h | Cap | Purpose | Status |
|---|---|---|---|---|---|---|
| session1 | gkx67998rd5cyu | RTX PRO 6000 96 GB (secure, US-NC-1) | 2.69 | 100 min (≤ $4.48) | brand art, F1/W3 plates, fox/sheep, F1 music candidates | running since 2026-11-17 11:37 UTC (started before the idle kill was added; stops at end or cap) |

## Lessons from session 1 (17 Nov)
- Qwen-Image weights came down fast (system Python with hf_transfer). ACE-Step's own `uv` venv has no
  hf_transfer, so its ≈ 8 GB of weights crawled at 1.7–4.9 MB/s (≈ 35 min of paid idle GPU). Next time:
  download every model with the system `huggingface-cli download` (hf_transfer on) **before** the GPU
  work starts, into the same HF_HOME, and point the tool at the local folder.
- Prompts that name an empty place for an element ("an empty space for a sleeping animal", "one empty
  grassy spot") make the model fill it (a dog on the rug; a dirt circle). Say what is there instead
  ("a plain bare rug with nothing on it") and add a negative.
- "lit by firelight" in an isolated-element prompt draws flames into the element picture.

## Session 1 result (17 Nov, pod gkx67998rd5cyu, stopped by the orchestrator at 12:35 UTC)
- 57.6 min billed at $2.69/h ≈ **$2.58** (cap was $4.48). Images: 52 of 52 done (brand 24, F1 14, W3 14). Music: 0 of 24
  (ACE-Step's downloader ran 23 min at 1.5–5 MB/s; stopped because the remaining download would have used most of the
  remaining cap with little chance of finishing; music moved to session 2a with a proper pre-download).
- Split by job time: brand $0.70, F1 $1.45 (9 min images + 23 min music download), W3 $0.40, setup $0.03.
- Pre-screen: F1 plates all contain a dog; W3 plates have dirt circles/tents/a person; sheep side-lying. All regenerated in 2a.
- The pod is stopped (volume kept, 20 GB, a few cents a day) until the brand masters are confirmed not needed, then terminated.

## Session 2a (17 Nov): pod nhts18hnoeysm2, RTX PRO 6000 Blackwell, US-MO-2, $2.69/h, created 12:39:41 UTC, MAX_MIN 60 (≤ $2.69). Card allowances given to the runner: F1 $1.90, W3 $1.00. External watchdog check scheduled 13:44 UTC.
- 2a result: 40/40 images ($1.33 at 13:09 UTC), 24/24 music tracks (ACE-Step, ≈46 s each), stopped itself at 13:36 UTC (first proof that self-stop works). ≈ 57 min ≈ $2.55. Masters: release gpu-session2-2a (40 PNG + 24 FLAC).
- Owner decision 17 Nov: pictures from now on come from ChatGPT (better detail, no pod cost); pods only for motion/music if needed.
- Owner correction 17 Nov: music must be made locally (standing rule). The ACE-Step music runs were a mistake (~$2.20); no music on pods from now on.

## Session 2c (18 Nov): owner's cat-cabin picture (c4), Wan2.2 I2V on 5 crops (fire, mantel candle+lantern, shelf candle, windows, mug steam)
- Owner approved up to $2.80 (18 Nov 11:00 IST). RTX PRO 6000 secure $2.69/h, MAX_MIN 62 (≤ $2.78), card C4 $2.78.
- Plan 37.4 min ≈ $1.67 (`runner.py --plan`); selftest: ≤ $2.63 even at 4× slower, first clip of every crop always made.
- Inputs: `session2/inputs_c4/` (crops at 2-3.75× so the model sees enough pixels; masks from the independent inventory `loop/scenes/c4_inventory_reviewer.md`).
- Outputs: branch `gpu/session2-2c` (previews, checks, cost), release `gpu-session2-2c` (PNG frame tars).
- 2c try 1: pod lf3gxz7pguj4jc (EUR-IS-2) 05:45-05:48 UTC, ≈ $0.14. Stopped itself: "download failed: lightx2v/Wan2.2-Lightning". Cause: the 140 GB container disk filled (Wan2.2-I2V-A14B-Diffusers has two 57 GB transformers plus encoders; the whole Lightning repo was being pulled). Fix: 300 GB disk, Lightning limited to the I2V Seko-V1 folder (two 1.2 GB LoRAs), download errors and df now go to progress.log. Pod terminated.
- 2c try 2: pod uy35x5ycsd2j6z (US-NC-2, 300 GB) 05:51:40-05:54:45 UTC, ≈ $0.14. Weights in 1 min (121 GB). Pipeline loaded in 50 s with the Seko-V1 LoRAs, then every item FAILED with no error text logged. Found: the fire crop (576×704) broke the worker's 832×480 pixel limit; the rest most likely ran out of GPU memory (both 14B experts + T5 on the GPU). Fix: fire crop 560×704, enable_model_cpu_offload + VAE tiling, errors written to progress.log with a traceback in run.log, a 33-frame smoke clip first. Pod terminated.
- 2c try 3: pod eg714usltcg3j5 (EUR-IS-2) 06:02:33-≈06:06:30 UTC, ≈ $0.18. The new error logging showed the real cause: `NameError: name 'ftfy' is not defined` (the Wan pipeline cleans prompts with ftfy, an optional package not in the image). Fix: pip install ftfy regex. Running total for 2c ≈ $0.46. Pod terminated.
- 2c try 4: pod 2a2n0030og1xpx (US-NE-1) 06:10:07-≈06:15:30 UTC, ≈ $0.24. Download only 11-18 MB/s there; the rate-floor guard stopped it as designed. Next try pinned to data centres that downloaded at >1 GB/s (EUR-IS-2, US-NC-2). Running total ≈ $0.70.
- 2c try 5: pod 68cnttvost8pam (EUR-IS-2) 06:19:06-≈06:51 UTC, ≈ $1.45 (runner: 30.0 min, $1.35 + upload). Weights in 2 min; all 14 items ok (~2 min per 97-frame clip with CPU offload). Masters: release gpu-session2-2c (14 tars). Stopped itself; terminated after download.
- **2c total ≈ $2.15 of the $2.80 the owner approved.**
- Review of the clips: fire 1-4, window 1-2, mug 2-3, mantel 1, shelf 1-2 used. Rejected for camera drift (phase correlation on the still parts): mantel_2 (1.9 px), mug_1 (0.75 px). First 8 frames of each clip skipped (frame 0 is the sharp still; later frames are the model's rendering).

## Session 2d (18 Nov): cat first-last-frame clips, review batch of 2 (owner cap $2.20 for cat clips)
- Pod 1 (dnx4bjuo11nhpa) created without its start script by mistake; terminated within a minute (≈ $0.02). Start command now fetches start.sh from the repo and stops the pod if the fetch fails.
- 37vdj2d8am15u9, tthqmhh0w4fnzq, 87f0bdbf35zfth (US-NC-2): the Wan download hung at 83-88 GB of ~121 GB each time (xet). Guards stopped them (≈ $0.22 + $0.29 + $0.38). No new hf-xet/huggingface-hub release; likely Hugging Face side. Fix: per-download hang detector (whole-disk growth < 20 MB in 20 s for 80 s -> kill, retry with HF_HUB_DISABLE_XET=1), downloader's last lines go to progress.log.
- uxaqq59v3ukijl (US-NC-2) 08:14:40-≈08:23:30 UTC, ≈ $0.40: xet hung at 128 GB (45/50 files), the retry without xet finished in 40 s. c4_cat_breathe_1 1.7 min, c4_cat_knead_1 1.1 min. Terminated after download.
- **2d so far ≈ $1.31 of $2.20.** Review: both clips natural (breathing; paw slides out under the chin, small sleepy mouth-open, tucks back), drift 0.23/0.36 px. Defects fixed in compositing: whole-crop brightness pumps up to +40 % mid-clip (first-last-frame mode) -> per-frame gain from a ring around the cat; a glow blob appears on the sofa -> paste mask = cat body + pillow under the chin only (scenes/c4_mask_cat.png).
- FLF test pod kbhhv2ns9at915 (EUR-IS-2) 08:44:42-08:55 UTC, ≈ $0.47, no clips: 4 min from boot to setup, then the download ran at 26 MB/s (3 GB in 2 min); stopped by hand before the 15-min cap. **2d total ≈ $1.78.**
- Lesson: downloading 121 GB every session is the weak point (3 hangs + 1 slow data centre today). Proposal to the owner: keep the weights on a network volume in US-NC-2.
- FLF test pod 4j7xyp4i7xz53y (US-NC-2) 09:20-09:32 UTC, ≈ $0.54: xet hung at 52 GB, the retry finished; c4_cat_squeeze_1, c4_cat_lick_1, c4_fire_flf_1 (fire FLF keeps full motion up to the last frame).
- **Full set pod uh9e91a8xva56x (US-NC-2) 11:02-≈11:45 UTC, ≈ $1.95 (owner OK'd ≈ $2.40, cap $2.60):** xet hung at 83 GB, the retry finished in 2 min; all 28 clips ok in 35 min (fire 8, mug 6, window 4, mantel 2, shelf 2, cat breathe 3 + ear 2 + whisker 1 + squeeze 2 + lick 2). Review: drift under 0.5 px at 1080p for all; no paws in any new cat clip; brightness pumps 10-56 % mid-clip (fixed in compositing). Terminated after download.

## Session 2e (18 Nov): owner's wanderer picture (c5), first-last-frame review batch (owner cap $4, 22:14 IST)
- Owner rule (18 Nov): no warping of solid things; coat, tree and water must be true renders looped by frame continuation.
- Pod 7o860j22irqk1g (US-NC-2, RTX PRO 6000 $2.69/h, MAX_MIN 40) 16:45:47-16:55:48 UTC, about $0.46. Weights in 2 min (no hang).
  5/5 clips ok: c5_coat_1 2.1 min, c5_branch_1 1.3, c5_water_1 1.0, c5_coat_2 1.4, c5_tree_1 1.4. Stopped itself; masters
  downloaded from release gpu-session2-2e (5 tars) and the pod terminated.
- Start command used: fetch start.sh from the repo with the token (GitHub contents API, raw), check it, run it, stop the pod on failure.
- Measured: every clip is 16-32 % brighter than the still mid-clip and the last frame differs from the still by 8-11 levels
  (first-last-frame pump, as on c4): needs the per-frame gain fix and the ease onto the picture frame. Coat drift 1.1-1.3 px
  (over the 0.5 px limit; the crop is 2.5x, so about 0.5 px at source). No MP4 previews were pushed (ffmpeg missing on the image).

## Session 2d-faces (19 Nov 01:23 IST): 12 cat clips, owner cap $1.35
- Pod r738vb71xt313d (US-NC-2, RTX PRO 6000 $2.69/h, MAX_MIN 30) 19:52:59-20:11:34 UTC, about $0.85. Weights in 2 min, no hang.
  12/12 ok, 1.1-2.3 min each. Stopped itself; tars from release gpu-session2-2d; pod terminated.
- Phone-size motion (clip_motion.py): earflick 4.4-5.3 px (all good), deepbreath 1.5-2.5 px (3 of 4), face_2 1.6, whiskers 0.6-1.0 (invisible).

## Session 2f (19 Nov): c5 batch 3 (owner go 01:47 IST, cap $2)
- Pod z36awqo5e0hfvt (EUR-IS-2, $2.69/h, MAX_MIN 30) 20:18:55-20:41 UTC, about 22.5 min, about $1.01. Weights 4 min, clips 1.5-2.8 min
  each (slower than US-NC-2 the day before). 9/9 ok. Stopped itself; 9 masters downloaded from release gpu-session2-2f; pod terminated.
- Stronger tree prompt worked: leaf areas moving 50 % of the motion mask (first batch 14 %), mean step 3.7 vs 1.75.
- "Never stopping" prompts made some clips rush back to the last frame: end steps 2.2x (c5_coatw_3, banned), 2.6x (waterl), 4.6x (waterr).
  A longer landing (6-8 frames) passes the join gate for the water ends.
- c5 total so far: about $1.47 of the owner's $4.

## Session 2g (19 Nov): c5 batch 4 (owner go 02:38 IST, cap $1)
- Pod he73hhrfre2l1d (EUR-IS-2, $2.69/h, MAX_MIN 22) 21:08:50-21:25:46 UTC, about 17 min, about $0.76. 6/6 clips ok; stopped itself;
  masters downloaded from release gpu-session2-2g; pod terminated.
- "Clearly visible ripples and wavelets" did not make the lake-end clips stronger than the first ones (mean step 0.6-0.9 at
  render size against 1.6 for the centre crop), and one rushes back to its last frame (c5_waterrs_2: end steps 7.6x).
- c5 total so far: about $2.23 of the owner's $4.

## Session 2h (19 Nov): c5 batch 5 (owner 10:48 IST: fix every known fault; inside the $4 cap)
- Pod jp418umo4rvu1j (US-NC-2, $2.69/h, MAX_MIN 30) 05:19:44-05:34 UTC, about 14.5 min, about $0.65. Weights 2 min, clips 1.0-1.7 min.
  10/10 ok; stopped itself; masters downloaded from release gpu-session2-2h; pod terminated.
- Lake ends re-rendered as full-width 832x288 crops at 1.0: mean step 1.2-1.6, same as the centre (the 2x / 1.5x end crops gave 0.6-0.9).
  Lesson: render water at the same scale as its neighbours; an upscaled crop gives ripples that shrink when scaled back.
- c5 total: about $2.88 of the owner's $4.

## Session 2i (19 Nov): c5 batch 6 (inside the owner's $4 cap)
- Pod etpmnlq4pvmlmr (EUR-IS-2, $2.69/h, MAX_MIN 22) 06:12:24-06:28:56 UTC, about 16.5 min, about $0.74. 6 of 7 clips (the runner
  skipped c5_waterc_6 to stay inside the cap); stopped itself; masters downloaded from release gpu-session2-2i; pod terminated.
- The dedicated 4x crop of the far-right water pocket moves at render size (step 0.8-0.9) but is invisible once scaled back 4x.
- c5 total: about $3.62 of the owner's $4. No further GPU spend without a new go.
