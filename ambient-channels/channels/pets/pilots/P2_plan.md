# P2 - video 2 plan (channel-pets, 22 Nov 2026, times IST)

## Concept (G0 draft, for orchestrator sign-off)
A new cat in a new place: a fluffy grey (blue) long-haired cat, curled asleep on a cushioned window seat in an old
cottage reading nook on a rainy evening. Rain streams down the leaded panes, dark wet garden and a far street lamp
outside, two candles on the sill, a warm brass reading lamp, stacked books, a cup of tea with steam, a knit throw.
No fireplace, no snow, no cabin: every element differs from P1 (tabby-and-white cat on a sofa, winter cabin,
fireplace, falling snow, moonlit night).

Name and caption (draft, G5 decides): "This is Juniper. She naps through every storm 🌧️ 3 Hours Rainy Window
Nook, Soft Rain & Piano for Sleep"

## Why this one (live YouTube search, US, last 12 months, 22 Nov 2026)
Numbers read from the watch-page data in the built-in browser (video not played). API lookup failed (key 403, see
below).

Cat + rainy cozy window - passes G0 (>= 2 channels < 100K subs, >= 100K views, like-rate >= 1%):
- Storybook Jazz (6.7K subs) "Rainy Autumn 1940s Jazz & Cozy Window | Cat, Candles & Fireplace" - 556K, 1.07%, 2 Sep 2026
- Vintage Ambience Cafe (3.5K subs) "Rainy 1950s Jazz & Cozy Window | Cat, Candles" - 495K, 1.53%, 16 May 2026
- Sleepy Vintage Room (7.6K subs) "Cozy Vintage Paris Night | Fireplace, Snowy Window & Sleeping Cat" - 1.24M, 1.84%, Feb 2026
- Velvet Cat Nook (1.6K subs) rain + black cat - 137K in 3 weeks (like-rate 0.50%, not counted)
- Gap: the winners use jazz. Soft-piano rainy-window cat videos from small channels are many and get almost
  nothing (tens to hundreds of views), so our edge has to be the picture quality, true motion and the music.

Dog by the fireplace - does NOT pass G0 yet: only one small channel wins (Cozy Relax Corner, 13.4K subs: 397K at
0.66%, 243K at 0.83%, 127K at 0.97%); Autumn Jazz Room 48K at 0.31%. Keep it as the P3 candidate and re-test.

Falsifier note: Winter Snow Serenity (2.2K subs) 830K in 13 days at 0.42% likes - looks like paid or ad traffic,
not counted.

## What we make
- Length 3 h ("3 Hours" in title). 4K.
- Picture: one scene still, 3840x2160, from ChatGPT (owner runs the prompts below) - the whole scene with the cat in it
  (as P1). The cat's motion is rendered in a tight crop, not cut out and re-pasted from a group picture.
- Motion (true render, Wan2.2 I2V / first-last-frame on crops, like P1):
  - cat: slow breathing through the flank, one ear flick, a slow paw stretch or tail-tip curl now and then;
  - rain on the glass: rendered droplets and runnels on each pane crop (at least 3 clips per crop, no warp);
  - rain falling outside behind the glass (code particles masked behind leading and frames, per LESSONS glass rules);
  - two candle flames, tea steam, a slight sway of the wet garden branches outside.
  - Every event timer uneven and co-prime with the music lengths; nothing lines up over 3 h.
- Sound: real CC0 rain-on-window bed (Freesound CC0, licence in the card), low; optional very soft CC0 purr layer
  (test it at -10 dB under the music, keep only if the reviewer passes it). No thunder (channel promise: no sudden
  sounds).
- Music: a new set, never P1's pieces: about 15 original compositions, 10.2-14.8 min, uneven, made by
  audio/sleep_suites.py with a new seed and a softer "rainy evening" voicing (felt piano, warm pad, rare celesta),
  major keys, 44-52 bpm, each mastered alone, equal loudness. Made-up titles on screen, no composer, no year.
  The jazz signal is noted; a soft brushed-jazz piano colour is a later test, not for P2.
- Opening card + closing note (credits file like c4_credits.json), fade in and out.

## Picture prompts (for the owner to run in ChatGPT, landscape 16:9, then upscale to 3840x2160)
1. Scene: "A cozy old cottage reading nook at dusk on a rainy autumn evening, painted in a soft, detailed, warm
   storybook-realistic style. A deep window seat with a thick cream cushion and a grey knit throw. A fluffy
   blue-grey long-haired cat sleeps curled on the cushion, chin on its front paws, eyes closed, tail wrapped around
   its body. Tall leaded-glass window behind it with rain streaming down the panes; outside, a dark wet garden,
   bare branches and one far warm street lamp glowing in the rain. Two lit cream candles on the sill, a brass
   reading lamp with a warm glow, a stack of old books, a cup of tea with a faint wisp of steam on a small wooden
   tray. Warm amber light inside, cool blue-grey outside. Calm, quiet, no people, no text, no logos."
   Negatives: no extra cats, no animal outside, no open eyes, no people, no text, no watermark, no melted objects.
2. Two more variants of the same prompt (different camera height / cat colour stays blue-grey) so the reviewer can
   pick the best still at G1.

## Budget and steps
1. G0: orchestrator signs the concept (this file).
2. Owner runs the picture prompts (3 variants). Reviewer passes G1 at 100% zoom.
3. Music, sound and the motion test are made locally where possible; GPU only for the rendered clips.
   GPU estimate: about 25-35 clips -> about $3.50, cap $4.50, idle kill 10 min, MAX_MIN set, cheapest GPU that runs
   Wan2.2 A14B with CPU offload (price read from list-gpu-types on the day). Owner approves the cap first.
4. 60 s motion test -> reviewer G2. Music set -> G3 (listen-by-measurement). Full 3 h render (about 8-9 h at 4K
   on two workers) -> G4. Package -> G5. Orchestrator G6, owner's "go".
5. Target publish: Sun 6 Dec 2026, 05:30 IST (Sat 7 pm ET). Earlier (Sun 29 Nov) only if every gate passes in time.
   P1's 48 h read on Tue 24 Nov may change the title or thumbnail pattern; fold that in at G5.

## Open items
- YouTube Data API key gives 403 in the AI repo (ambient-lookup run 45033709677, videos.list). Orchestrator to check
  the YOUTUBE_API_KEY secret after the move.
- vidIQ connector has no credits left; research used direct YouTube search pages instead.
- Delivery: a 3 h 4K file is about 8-10 GB, about 25 parts of 390 MB. Plan the hand-over with the orchestrator.
