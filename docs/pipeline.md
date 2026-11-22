# Production pipeline (shared by all channels)

Goal: 2–3 hour videos that look like a crafted, living place — produced with code and
open-weight models, no tokens spent on frames, every GPU job budget-bounded.

## 1. Still image (G1)
- **Base plate** (empty scene, no living elements): owner generates in ChatGPT from the
  card's `image_prompt`, or an open-weight model (FLUX on a pod) if ChatGPT refuses or
  the look drifts.
- **Living elements** (cat, owl, deer…) generated **separately** on a plain background
  with the same light direction, then composited. Never cut from a full-cast image.
- Upscale to 4K with an open-weight upscaler only if the base is < 4K.

## 2. Motion (G2)
Two layers of motion, both produced without spending tokens on frames:

**a) Living elements — image-to-video on a pod.** Open-weight image-to-video model
(e.g. Wan 2.x I2V) generates a 5–10 s clip of the element doing one natural action
(breathing, tail curl, ear flick, page turn). We make it loop with a ping-pong-free
method: generate with first frame = last frame conditioning, or crossfade the last
0.5 s into the first. Cheapest GPU that fits the model; pod has idle auto-kill
(10 min) and a hard cap (`budget_usd` on the card).

**b) Ambient layers — local code.** `scripts/` will hold a Python/ffmpeg compositor
that adds: fire flicker (light-map modulation from a noise curve), embers and dust
(particle sim), rain/snow on glass (alpha sprite layers from CC0 footage), mist drift
(slow noise-displaced fog plate), candle flicker, gentle foliage sway (mesh warp
limited to masked foliage only — never the whole frame). Output: one seamless
**60–120 s visual loop** at 1080p or 4K.

## 3. Music & ambience (G3)
- **Fantasy:** ACE-Step 1.5 (open-weight, commercial use allowed), instrumental mode,
  prompts in the card. 10–14 candidates → keep the best 8–10 (≈ 50 min). Run on the
  cheapest pod that fits, or locally if the owner's GPU has ≥ 12 GB VRAM.
- **Worship:** piano + strings + pads rendered **locally** from MIDI with real sampled
  instruments (Salamander Grand Piano, CC-BY; free string/pad libraries) — public-domain
  hymn melodies arranged by our code, plus original "soaking" improvisations. ACE-Step
  only for pad textures if needed.
- Ambience beds: CC0 field recordings (rain, fire, wind, birds), looped with
  crossfades, mixed 10–14 dB under music.
- Mastering: loudness/peak targets in `docs/gates.md` (G3), checked by measurement.

## 4. Render (G4)
- Audio: concatenate tracks with 4–6 s crossfades to a 2–3 h master (ffmpeg).
- Video: `ffmpeg -stream_loop -1 -i loop.mp4 -i master.m4a -shortest -c:v copy` —
  the visual loop is encoded once, so a 3 h render takes minutes on a laptop.
- Encode the loop with `-preset veryfast` unless the owner asks for best quality.

## 5. Package & publish (G5, G6)
Title/description/thumbnail per CHANNEL.md, then upload (YouTube Studio or the
youtube-agent skill via Chrome). Record the video id in the card → tracker picks it up.

## Budget guard
Every pod job: `budget_usd` on the card, idle auto-kill 10 min, `max_runtime` set,
results pushed to the repo (or fable-transfer) before the pod is deleted.
Log actual spend in the card's `spend` list.
