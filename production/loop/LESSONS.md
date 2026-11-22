# Living picture: lessons by workflow step (read only the step you are on)

Every line here cost a render, a review round or GPU money. The skill `living-picture-ambient` lists the steps;
this file holds the detail and the numbers. Reference pictures: `reference/c4/` (good and BAD examples).

## S1 Inventory and light map
- Make two independent inventories (yours and a fresh reviewer's) and use the union: lights, moving things,
  things that must stay still, and look-alikes (moonlit wood strips, sofa sheen, painted snowflakes).
- Light map = the painted light in the picture (brightness above the local shadow floor, warm), assigned to
  sources by distance (reference 02). Show it to the owner before any render. The c4 owner judged "most lit
  areas not consistent with any light source" from what he saw, not from numbers.
- Real firelight (research, 19 Nov):
  - steep falloff (about inverse-square) lets the rest of the room die;
  - two parts: a steady red coal base plus a warmer flame flicker on top;
  - the flicker spectrum falls like 1/f, mostly 0.5–3 Hz, with weaker energy up to about 8 Hz;
  - several flame tongues flicker independently, so the light shifts side to side;
  - not every light flickers: fill light and electric lamps stay mostly steady.
  A painted room is usually brighter than its lights allow, so darken it with an exposure map:
  ambient 0.62 + falloff from each source (c4: the far ceiling and corners came out at 64–66% of the picture).

- Owner 19 Nov ("cover a light with your hand and watch its area: the light, shadow and flicker barely match"):
  make the reach map `python3 reach.py` (scenes/c4_reach.jpg): each source's colour where its flicker lands, brightness
  = p95-p5 swing. Check it against the light map BEFORE rendering; every painted lit area needs its own source colour.
- A small flame standing on a board (mantel candle, shelf candle) cannot light below that board: hard shadow line
  (`Lights3.OCC`, y of the board). Without it the shelf candle flickered the cat (cat+pillow jump 1.74%).
- Candle light was far too weak (std 1.6-1.8%): candles are the biggest shadow-makers in a cosy room. Now std 9% (mantel)
  and 15% (shelf), reach r0 95-110 px: wall by the candle swings about 10%, books by the shelf candle about 7%.
- Shadows must follow the flame: a flame swaying right moves its light pattern (and so the painted shadow edges) left,
  more with distance (remap of each source's light field by sway x min(dist/r0, 2.5)). Fire sway = 30 x (right third -
  left third); candle sway = 6 x the real flame's centroid shift (parallax: nearby objects throw long shadows).
## S2 Masks
- Glass: hand-traced panes minus everything in front, eroded 3 px; never colour-only (that made "snow inside").
- Subject: rough polygon, then GrabCut at 2×; check the overlay by eye.
- Paste masks: only what moves, plus what the movement needs (the cat's pillow under the chin). Never extend a
  mask into background where the model invents things (a glow blob on the sofa).
- Keep things the model degrades as the picture's own: the moon disc (r 24 at 1534,91 on c4).
- Static parts inside a moving crop come from the picture (logs, grate, back wall in the fire crop); use the
  clip only where it differs from the picture (`fire_alpha`).

- Moonlit surfaces (the only places snow shadows may fall): bluish pixels near the windows that are not glass.
## S3 Clips (GPU)
- Wan2.2-I2V-A14B with the Lightning Seko-V1 4-step LoRAs, guidance 1, 97 frames at 16 fps, CPU offload, VAE
  tiling, ftfy. Crops at most 832×480 pixels, multiples of 16. About 1.1–2.5 min per clip on an RTX PRO 6000
  ($2.69/h); 28 clips took 35 min, about $1.95.
- First-and-last-frame (`last_image` = still) makes exact joins possible, but:
  - snow FLF clips barely fell (14× less motion at phone size), so snow is code particles now;
  - FLF pumps brightness up to 40–56% mid-clip, which colour locks fix;
  - the last 3–5 frames may freeze, then redraw.
- Cat: face-level moves only. Paws, stretches and head turns become bloopers. Give the cat a negative prompt.
  Face micro-moves are hard to see at phone size; ask for clearly visible slow breathing.
- Phone-size motion gate: `clip_motion.py <clips> --box <face box>` (>= 1.5 phone px = visible). 19 Nov: the old
  ear/whisker/squeeze prompts moved 0.4-0.9 px (invisible). "its ear flicks sharply backward and twitches two quick
  times, then springs upright again" gave 4.4-5.3 px on all 3 seeds, natural (ear folds back, springs up). Whisker
  prompts stay under 1 px: whiskers are too thin in this art to read at phone size; don't spend on them. "Deep
  breathing" prompts: 3 of 4 visible (1.5-2.5 px). 12 clips in one session: 19 min, about $0.85.
- Download: model weights about 121–136 GB. The xet backend hung 4 times on 18 Nov; the hang detector
  (80 s with no growth, then retry with HF_HUB_DISABLE_XET=1) fixed it every time. EUR-IS-2 once ran at
  26 MB/s: stop such a pod by hand. Fetch start.sh from the repo, and stop the pod if the fetch fails.
- Results come back as GitHub release tars, fetched with `gh api` (REST).
- Clip review: drift under 0.5 px at 1080p (phase correlation). Find bloopers by stripe contrast on the face
  and motion in the paw area. Ban list in compose (c4: knead_1, earonly_1).

- Prompt: say what moves, then "everything else stays completely still, hand-drawn storybook illustration style",
  plus the static-camera wording. Per-subject negatives in crops.json `neg` (cat: paws, legs, stretching, waking,
  open eyes, head turning, extra limbs); FLF subjects in crops.json `flf`.
- Cat bank: resting-breath clips as the base, plus face events (eyes squeeze, whiskers, ear twitch, lip lick, small
  mouth open).
- Session: `gpu/session2/start.sh` with PHASE, MAX_MIN, CARD_LEFT, ONLY (priority order). US-NC-2 or EUR-IS-2,
  300 GB disk, download only the Lightning I2V folder. Hard cap, idle kill, rate floor, self-stop, plus a
  send_later watchdog. `gh release download` is blocked (GraphQL); use `gh api`.
- A network volume (US-NC-2, about 140 GB) would avoid the 121 GB download each session; it is a monthly cost, so
  it needs the owner's OK.
- Drift check: skip the first 8 frames (frame 0 is the sharp still).
- 19 Nov batch (18 clips, about $0.90): candle crops must be tight and upscaled (128 px at 3.75x); the flames came out
  clean, stretching and swaying. Ban flames that barely move (< 1 phone px: shelf_flf_2, _4).
- "Quick ear flick" prompt ("one quick sharp flick, a sudden fast twitch that is over in an instant") gave real fast
  flicks on 3 of 6 seeds; one drew a white curl above the ear (blooper), one drew the ear back see-through, one too
  small. Check every event clip on a contact sheet of its active frames, not just its motion number.
- The runner stopped the pod after the last affordable clip WITHOUT uploading (persistent /workspace kept the clips):
  recovery = patch the pod command to tar + upload only, start it, terminate after. Fix later: upload before stop.
## S4 Composite
- Joins (`living.FlfStream`):
  - one shared join frame per layer: the median of the clips' own first and last frames (landing on the
    picture itself snapped);
  - land on it along the optical flow, never by cross-fade (that doubled the flames): 3 frames, snow 6;
  - a 6-frame landing paused the fire every 6 s, and even 3 frames stutters for about 0.1 s; next fix:
    settle=0 for fire, skipping the join frame;
  - fixed phase per layer so joins never coincide (c4: 0, 29, 58, 87, 116 of 144).
- Colour locks (each missing lock caused a visible reset every 6 s):
  - fire: hue per clip, constant over the clip;
  - cat: local mean AND contrast (blurred stats);
  - glass: mean + p97 per frame, smoothed over time.
- Fire: even out the per-position mean on flame pixels only, since every clip flared after its join.
- 16 → 24 fps with flow in-betweens, never cross-fades.
- Never sharpen the steam: per-frame sharpening of its whole crop made the table and lamp base flicker.
- Steam: add only the moving wisps onto the untouched picture; end points left of the lampshade and above
  the rim; remove specks smaller than 320 px.
- Sparks: tint them ember orange.
- Snow (`SnowFall`): code particles in 4 depths, each wrapping a whole number of times per block, so the
  loop is exact. Remove the painted flakes from the panes first. Snow shadows go on moonlit surfaces only,
  as darkening.
- Small flames: warping the picture's flame breaks the no-wobble rule and bent the planks behind it by up
  to 4 px. Use true FLF clips (at least 6 per candle, colour- and height-gated), or brightness-only flicker.
- Light model v3 (`Lights3`):
  - exposure map as in S1;
  - flicker = falloff × (0.35 + 0.65 × painted highlight); painted shadows stay;
  - fire = 3 sub-sources (left, centre, right) driven by the real flames' thirds, std 5%, asymmetric
    smoothing (up 0.65, down 0.45);
  - lamp: slow ±3.5% plus a quick flicker; the room follows the shade (0.7 of the quick part);
  - never share light out over sources by normalising: the cat, far from every light, got the lamp's full
    flicker (6% jumps). Use absolute falloff.
- Review v7 (19 Nov) fixes:
  - ghost ears: the local stats lock pulled a flattened ear back toward the painted upright ear. Exclude the parts
    a clip really moves (per-clip max change > 0.12, dilated) from the local lock; they get only the global gain.
    Plus a difference-alpha zone around the head so moving ears are never cut by the soft body mask.
  - fire froze 2-3 frames at every join: not the settle, but `fire_alpha` (near a join the clip is close to the
    picture, so the per-frame alpha fell to 0 and the static picture showed). Fix: wherever the bank moves (std
    over frames), always use the clip. Settle 0 or raw ends made jumps (6.4-8 vs p95 3.8); keep settle 3.
  - fire thirds rose and fell together (corr 0.98): use 0.5 x common + 1.8 x (third - common), std 8.5% each;
    hearth left/right corr 0.68. New check `apart` in checks.py.
- Review v8: a per-frame difference alpha around the ears let the head show through a folded ear. Use the union
  of the zones any cat clip moves as a fixed paste zone instead. Flow in-betweens (16->24 fps) of a fast ear fold
  doubled it: the cat uses nearest frames (interp=False); slow breathing hides the cadence. Ban clips that flap
  (many motion peaks: earflick_3) and clips that draw a turned ear's back with the head stripes through it (earflick_2).
- Code-light noise: spread frequencies by ±15% per block (`cycles`); rounded/prime counts near multiples of 30
  repeated every 20 s.

- Character events drop in at random every 25–70 s between breathing clips (never on a schedule); never the same
  clip twice in a row. The block is a whole number of clips, so frame N = frame 0.
- Frozen tails: cut them and land on the clip's own last frame along the flow (`fix_tail`).
- Sharpness: model frames are softer than the picture (detail energy about 3500 vs 4900 on the cat): run
  `living.match_sharpness` on every bank except steam.
- Fallback only: `living.Stream` (random walk with 10-frame flow morphs) for clips without a fixed last frame; the
  owner can see the morphs, so don't ship them.
- Steam: swap the painted wisp for the clip's background inside a soft shape.
- Characters: FLF clips pump brightness mid-clip; correct per frame with a gain measured on a ring just outside
  the subject, then the local stats lock.
- Lantern behind a lattice: brightness only, in two halves (a warp bends the bars); drive it with slow
  non-repeating noise, not the clip loop (a steady 1.35 Hz beat read as an effect).
- Candle: drive its room light from its flame pixels only; keep the wax out of its paste mask so the wax is lit
  by the flame.
- Hard shadows: firelight comes from a small source, so its shadows are sharp and sway with the flame. Lights v2
  warped the shading about the source (at most 3 px); v3 keeps the painted shadows still and only modulates the
  light. Moving shadow edges are still open work.
- Older light targets (v2, before the exposure map): hearth 8–10%, rug and mantel 6–7%, lantern and shelf 4–5%,
  far wall about 2.5%, lamp about 3%.
- Snow repeated: each flake came back at the same x on every wrap, so the snow and its shadow on the sofa repeated every
  few seconds (owner: "same repeated shadow on sofa"). A new x per wrap (hash of flake and wrap index modulo its whole
  number of wraps) keeps the exact loop and never repeats within the block.
- Cat colour lock: exclude ONLY the ears (head box above the chin) from the local lock. Excluding every moving pixel
  let deep breaths unlock the body, which then pumped 3% per frame together with the pillow (v10 cat body jump 3.3%,
  after the fix 0.7%). checks.py `steady` boxes: cat body without the head, and pillow away from the chin (ear flicks
  and licks are real motion, not flicker).
- Review v11: a base clip (breathe_1) drew a blue-grey smudge on the sofa above the back every time it played; find
  such clips with a blue-minus-red change test around the subject (58 vs < 20 for clean clips), not by event timing.
  Keep the move zone inside the cat silhouette grown by 12 px (it had pasted a model glint on the pillow).
- Cat cadence: flow in-betweens for the slow base clips, nearest frames only for fast events (all-nearest juddered).
- Steam anchor: the median of different curls is a two-curl ghost at every join and at the loop; use the real end
  frame closest to the median (medoid).
- Moving shadow edges: shifting the picture's broad dark areas with the flame's sway moved the fireplace arch edges, not
  cast shadows, and measured < 0.1 px edge shift. Candle sway measured per frame jitters (shadow flicker). Real moving
  cast shadows need silhouettes of the objects (tools, basket, armchair, stool, jars, books) projected away from each
  flame onto the floor/wall as code darkening (light only, no object pixels move). Next step.
- Cast shadows (owner 19 Nov: "all furniture, stool and sofa shadows shall flicker, visible on mobile"; "the lamp
  stand is lit by its flickering lamp but hardly flickers"): `CastShadows` + scenes/c4_casters.json + GrabCut masks in
  scenes/c4_casters/ (check the overlay sheet). Each object's silhouette is swept away from its light (anchored at
  the object: a moved copy pulled in when shorter and darkened lit areas), soft by source size, never on the object.
  The source moves with the flame's sway (fire 3 x, candles 2.5 x), flames shorten their shadows when brighter, the
  lamp keeps lengths. In the shadow the light is base x (1 - depth S) x (1 + kF(1 - S)): the lit side pulses and the
  shadow side stays, so the shadow's contrast flickers. (A first version removed k F S outright and made shadowed
  areas anti-correlated with their light: lamp table corr -0.93.) Split casters that sit on both sides of a light.
- Review v14: shadows landed on nearer furniture (armchair, sofa arm and seat pulsed 31%): every other caster's area
  is cut from a shadow's landing zone. Lamp shadows need some movement too: the lamp flame wanders +-5 px (slow noise).
  Small-flame shadows use a smoothed brightness (the raw one snapped 17 times in 26 s).
- Lamp dims from a noise threshold came ~17 a minute, evenly spaced: "faulty bulb". Rare random dims (12-32 s apart,
  0.3-0.9 s, random depth). The shade sends light down: lamp falloff is cut to 35% above the shade (the ceiling corner
  had swung 7%). Lamp: std 7% + 5.5% flutter, r0 280, gain 1.4 -> stand/wall 18-20%, table 8%, drawer 8%.
- Owner 19 Nov evening: "stool shadow sways too much and fast". Shadows follow a SLOW version of the fire's lean and
  brightness (two-pass EMA a=0.05, ~0.3 Hz and below), fire source shift 1.6 x (was 3 x), shortening 0.8 x brightness
  (was 2 x). Light flicker stays fast; only shadow geometry is slow - a big fire's shadows drift, they don't jitter.
- Base breathing clips can carry their own head/ear twitches (deepbreath_1: 5 per clip) -> count head-area motion
  peaks per base clip and keep the calm ones as the base; ear moves belong to the events.
- Cat face events every 18-45 s (10-30 s read as twitchy for a sleeping cat).
- checks.py `still` now uses optical flow (light may flicker there, nothing may move): p95 <= 0.3 phone px.
- Small-flame light brightness: measure what the viewer sees (the composited flame after fire_alpha), per frame;
  the clip's raw flame brightness correlated 0.25 with the visible flame. Sway: a smoothed per-block series.
- Lamp: oil-lamp-like flicker std 7% + 5.5% flutter + rare dips, reach r0 260: stand 13%, lamp wall 13%, table front
  5-7%. r0 300 lit the bottom-right corner (dark-area check failed).
- checks.py: `steady` boxes are measured against a nearby reference box (the cat may flicker WITH the room, not more);
  `still` boxes remove smooth light changes before measuring motion.
- Candle and shelf flames: FLF layers pasted with `fire_alpha` (flame zone from the bank's motion + per-frame
  difference); wax, jar and lantern stay the picture's. Their light and shadow sway are measured from the clip.
## S5 Check (scripted, phone size) - `checks.py video scene_checks.json --picture plate.png`
- lit areas: swing inside the target and correlation with their own source of at least 0.6. Read the source
  from a part that is not saturated (lamp base, not the white shade);
- dark areas: at most 85% of the picture and at most 3% swing;
- moving layers: visible motion at 640 px (snow ≥ 0.8, fire ≥ 1.5, steam ≥ 0.3, cat ≥ 0.35);
- steady subjects: frame jump ≤ 1.5% (catches lights flickering on the cat);
- still areas: no motion;
- loop point within 2× the normal p99 step.
c4 targets: hearth 6–16%, armchair 5–16%, rug near the fire 3–10%, lamp table 1.5–6%.

- Geometry gate (`compose_*.py --gate`, light model OFF): moving pixels outside the masks = 0; no moving non-glass
  pixels in the window; every inventoried light moves; loop point equal. "Moving" = change over 4 levels AND over
  5% of the pixel's brightness.
- Joins: `FlfStream.join_steps()`: the largest change at a join must not exceed the p95 of normal steps (c4 cat 2.16
  vs 3.75); detail energy at a join within about 10% of the clip frames.
- Decoded file (BT.709, accurate flags): colour vs the picture within 1 level; largest jump in still areas under 0.5.
## S6 Review
- Brief the reviewer with the intended motions, the previous failures to confirm or deny, a 640 px
  visibility check, a memory cap (under 2 GB, the sandbox has 8 GB) and a disk cap.
- Never run a review at the same time as a render (out-of-memory kills).

- Reviewer checklist, PASS/FAIL per point with pixel boxes and times: 1 all lights alive; 2 fire really burns;
  3 snow only on glass; 4 nothing else moves, no boxes or shimmer; 5 steam end points; 6 character moves naturally
  only; 7 no loop, seam or twitch at any join; 8 nothing degraded vs the picture; 9 every lit area follows its
  source and nothing is brighter than its lights allow; 10 everything visible at 640 px.
- Viewer check, phone to cinema (added after c5: the owner saw nothing in a version that had passed the gate and the
  reviewer). List every added movement, one line each. For each movement on each screen: can the viewer SEE it within a
  few seconds without being told where to look, and does it look CLEAN there?
  - Phone: frame at 640 px wide; each movement changes by at least 6 levels over a noticeable area within 2 s. Failures
    caught here: stars at 8-15% depth, a 2-4 px leaf sway, a meteor 18 px long for 4 frames, ripples of 0.3 px, tree
    clips whose leaves barely moved, candles that barely moved.
  - Laptop and TV: full frame at 1920 px, normal speed. Failures: every star changing at once (shimmer), a fixed rhythm
    (a 1.6 s coat cycle, a 0.54 Hz water sway), all layers joining at the same moment.
  - Cinema or 4K: 2x enlarged crops of every moving area and its edges. Failures: soft-then-sharp pulse at a join,
    brightness drifting across a clip, a halo or cut-out around a tree, a paste rectangle, see-through legs behind a
    moved coat, straight scratch-like light lines, a frozen strip of water beside moving water, flat mist hiding ripples.
  - Invisible on the phone is a FAIL even when the motion is correct; visible with any artefact on the big screen is a
    FAIL. Too subtle and too strong both fail. The reviewer builds time strips (same crop every 0.25-0.5 s) per movement
    and size, and says where it is unsure. The owner's viewing is final: ask which device they watched on.
  - List anything left still on purpose with the reason, so a frozen thing is never passed off as finished.
## S7 Render and deliver
- `compose_c4.py --seconds 600 --block out.mp4 --workers 2 --audio mix.wav [--repeat 12]`:
  - prepare the clips once in the parent and fork the workers;
  - at most 2 batches of 24 frames in flight per worker;
  - one encoder: crf 12, medium preset, tune animation, `keyint=infinite:scenecut=0`, BT.709 accurate flags.
  A 10-min block takes about 26 min on 2 cores; the 2-hour file is a stream copy. A keyframe changes the codec
  noise pattern by about 0.7 level, which is accepted at the loop point.
- Music: `audio/c4_music.py` (3 original pieces + reprise, Salamander one-mic, −20.6 LUFS, fire and wind beds),
  checked with `listen.py`.
- Package: thumbnails without text (full scene and closer), 3 titles.

- Speed history: one frame cost 0.2 s on 2 cores (10 h per 2 hours of video): flow in-betweens 44%, light 27%, snow
  shadows 9%. Fixes: cache clips at 24 fps once (lookup per frame), precompute per-block drivers, light at half
  resolution, parallel frames into one encoder, a 10-min unique block repeated by stream copy. Spawned workers
  each rebuilt about 3.3 GB and were killed; an unlimited queue also ran out of memory. Keep about 5 GB disk free.
- Separate encodes per part made a visible step at each part join: always one encoder.
- For upload, consider 4K: YouTube gives it a better codec and bitrate.
- Music detail: compose in code; slow (52–58 bpm), soft, a clear melody within 30 s; form intro, A, A', B, A'',
  outro. Salamander samples via `render.py`, ONE mic of the spaced pair (the pair cancels on some notes), reverb
  for width. Master about −20/−21 LUFS, peak −2 dBFS, gentle high cut, dip 200–420 Hz. Fire bed −8 dB, wind
  −17 dB. Check with `listen.py`: loudness, balance, stereo correlation 0.6–0.8, gaps; say it was measured, not
  heard. Long videos: several pieces with crossfades so nothing repeats within the hour.
- Send the owner a 20-s phone-size test first, then the 10-min block; never a long render unannounced.
- Music sets (owner 19 Nov): several different 10-15 min sets, never one track. Old music (1500s-1900s) is free to
  use as COMPOSITIONS; render our own performances from scores (music21 corpus) - never use someone's recording.
  `production/audio/pd_sets.py`: hymns (Bach chorales, felt piano, q=46, long fermatas), airs (O'Neill/Aird slow
  airs on folk harp + soft cello root, each twice), record (Corelli, Handel, Schumann, Beach, Mozart slow pieces on
  strings + piano, then our own old-78 sound: 170-5200 Hz band, warm saturation, slight wow, soft crackle).
  Original piano set (c4_music.py) stays as set 1. Rotate sets across the video so nothing repeats within 45 min.
- Speed (owner 19 Nov: "still taking too much time to render"): measured per 10-min block on 2 cores: frames 0.078 s
  each (light 33%, cast shadows ~12%, snow shadow 12%), encoder x264 medium only 18 fps = the biggest cost (13 min).
  x264 veryfast crf 11 runs 59 fps at PSNR 49 dB vs the source (invisible) -> default. Flame series sampled every 2nd
  frame. Expected block time about 13-15 min (was 27). Rendering the music and the video together runs out of memory.
- Music taste: the sampled harp + guessed chords set ("airs") was "not nice". The Salamander piano is our most natural
  instrument: the replacement set "nocturnes" plays slow old pieces (Bach WTC Prelude in C, Schumann, Amy Beach,
  Handel, Corelli, Haydn, Mozart) as soft solo-piano arrangements of their full scores.
- Programme (owner 19 Nov: "the video mentions the new music; each new music opens slowly; slow fade-in and fade-out
  of the video"): `production/audio/playlist.py out --sets nocturnes hymns original` cuts each set into its pieces
  (exact score timing for pd_sets sets; silence gaps for the original), gives every piece an 8 s raised-cosine
  opening and 6 s close, 3 s apart, lays ONE continuous fire + wind bed made in 5-min chunks with their own seeds and
  10 s crossfades (a 35-min bed in one go was OOM-killed), fades the whole mix in 10 s / out 12 s, -21 LUFS, and
  writes playlist_cues.json. `compose_c4.py --cues playlist_cues.json --fade-in 6 --fade-out 8` draws a title card
  (Lora italic 54 px + composer 32 px, soft shadow, lower left; readable on a phone) 4 s into every piece for ~11 s,
  and fades the picture from/to black. Titles and fades need ONE whole-programme render (no block repeat).
- Owner 19 Nov night: "your music sounds suspicious sometimes, which alerts the mind; choose soothing, calming,
  snoozing melodies". Old pieces in minor keys or with chromatic/suspended dissonance (Corelli Grave, Handel lament,
  Schumann, minor chorales) alert. `production/audio/lullabies.py` composes by rule: major keys only, chords I/IV/vi
  with add9/maj7 colour, V only as a soft sus, plagal endings; melody on the major pentatonic, never a half step
  against the sounding chord, mostly stepwise, nothing above C6; 46-54 bpm, 3/4 or 4/4; intro-A-A(8va)-B-A-outro,
  2.5-4 min each, every seed different. A 76-min programme = 20 lullabies + the 3 original pieces between them.
- Titles never hint at the sources (competitors): made-up gentle names (playlist.NAMES), no composer, no year.
- The long programme: `playlist.py out --programme --predict` writes the cue sheet from the scores BEFORE the music
  is rendered, so the video (titles need the cue times) and the music render run at the same time; then
  `playlist.py out --programme` builds the real mix and the final cue sheet (check the drift vs the predicted one).
- A 76-min 1080p file is 2-3 GB: more than the 400 MB chat limit -> GitHub release (2 GB per file) + a 10-min
  phone copy in chat.
- Never run the fire-ambience bed while a video render runs: it was OOM-killed (8 GB sandbox), twice.
- Equal loudness (owner: "the last set is too loud; same loudness so only the composition changes"): every set's final
  mix is set to exactly -21 LUFS by linear gain (`match_loudness`, no dynamic loudnorm), and the gramophone effect is
  gentle (110-7500 Hz, light saturation). Each set has its own fire and wind bed seeds, so no two beds share a loop.
- Loudness range too: after equal LUFS the record set still had LRA 9.1 vs 6.4-7.6 -> gentle compression (ratio 1.35)
  to LRA 6.6. All four sets: -21.0 LUFS, LRA 6.4-7.6.
- Loops must never line up: the music playlist (~48 min) is unrelated to the 10-min video block, and every set,
  bed and layer has its own length/seed.
- Measure every set with `listen.py` before use. First pass: hymns an octave down = 70% energy under 250 Hz (muddy);
  folk-harp samples are stereo anti-phase (correlation -0.01) -> use one channel of every sampled instrument and let
  the reverb give width; harp roots at C2 were boomy (now G2-F#3). VSCO strings stop at B5: fold higher notes down.
  VSCO-2-CE strings need `git checkout HEAD -- "Strings/<Section>/susvib"` in ~/samples (blobless clone).
## Outdoor night scenes (c5, wanderer by the mountain lake) - from the c5 session
- One wind direction, read from the picture, for everything that drifts.
- Stars: single-star sparkle events (0.5–0.9 s, every 5–16 s, fewer in the Milky Way), applied only to each
  star's excess over the sky. Area masks made the cirrus flicker. Remove stars by opening, blur and a
  luminance threshold (open sky ≤ 40, cirrus ≥ 45).
- Inpaint painted shooting stars. Code meteors every 14–34 s: 2 px wide, 0.45–0.6 s long, masked to open sky.
- Mist: 2–3 tiling noise sheets drifting downwind, only on the hand-traced lake, never cut around trees
  (that leaves halos).
- Water: trace the outline by hand and fade 10 px inside. Straight light lines read as scratches. A ripple
  done by displacement is a warp: ask the owner first, or render it.
- Cut-outs: keep what stood behind as its own still layer (the legs under the coat).
- Code: compose_c5.py, c5work/masks.py, scenes/c5/inventory.md.
- Water ripple by displacement is a warp: the owner asked for rendered water. A first-and-last-frame water clip (crop
  at most 832 px wide, so a wide lake needs several crops) gave natural ripples; lock each final frame's brightness and
  detail energy to the picture inside the lake, or the water pulses soft-sharp-soft and drifts darker at every join.
  One clip repeating every 6 s shows; render at least 3 per crop.
- Coat (owner approved the rendered clip): crop the whole figure at 2.5x, prompt that only the lower coat blows in the
  wind, paste only below the belt with a soft mask wide enough for the hem's travel.
- Tree: "sway gently, rustle softly" gave leaves that barely moved and the owner saw nothing. Ask for clearly visible
  movement and use a tight, upscaled crop on the leaves.
## Long-form programme (c4, 20 Nov: Paws & Nooks, 95-100 min, 4K)
- Music: original compositions only. No real old records (Content ID claim risk) and no nursery lullabies or rhymes
  (Brahms Lullaby, Twinkle and the like belong to the owner's kids project). Minor keys, chromatic or suspended
  dissonance, lament basses and dominant pull "alert the mind": keep major keys, I / IV / vi with add9 / maj7, soft
  Vsus only, plagal endings, pentatonic melody never a half step against the chord, 44-52 bpm.
- Owner 20 Nov: several long compositions, each 10-15 min, uneven lengths, never on a grid with any visual loop.
  `audio/sleep_suites.py`: 8 compositions (lengths drawn 10.2-14.8 min, >= 18 s apart, never near a whole minute),
  each a journey of 8-bar sections: theme returns in new textures, B and C ideas, octave-up verses, "rest" sections,
  a soft viola-section pad on some sections, dynamics drifting softer. ~0.8x real time per composition on one core:
  run two `--only K` processes side by side. Master each composition alone to -21 LUFS (a 95-min master in one go
  needs ~9 GB of memory).
- `playlist.py out --suites DIR [--predict]`: one title card per composition (made-up names, no composer, no year),
  8 s raised-cosine opening and 6 s close per composition, fire and wind beds in uneven 230-370 s chunks.
- Credits: `--credits scenes/c4_credits.json` draws centred opening credits while the picture fades up and closing
  notes while it dims, at 35% height (above the cat) on a soft dark scrim, drawn after the dim. The first music
  title waits until 3 s after the opening credits. Closing notes start 14 s before the end with a 20 s picture fade.
- 4K: `--uhd` lanczos-upscales the 1080p frames inside the encoder (x264 veryfast crf 18: ~11 Mbps, ~8 GB per
  100 min). YouTube gives 4K uploads its VP9/AV1 ladder, so phones get a sharper picture too.
- Long renders with audio go straight to the final file in one ffmpeg pass (audio as the encoder's second input,
  no faststart): the old block -> concat -> mux path kept three copies of an 8 GB file on disk.
- Render time at 4K, 98 min: setup 8.3 min + 230 min of frames (2 workers at 100%; the compositor, not the encoder,
  is the limit). Real size at crf 18 was 5.3 GB (7.2 Mbps), smaller than the 20-s test predicted.
- Delivery of a big file to the owner's laptop: GitHub releases are blocked for this session type (403), and chat
  files must be under 400 MiB. Split with `split -b 390M`, send all parts with one SendUserFile call, then
  `device_commit_files` ONE call at a time, at most 2 parts each (parallel calls or 3+ parts hit the wall-clock timeout; just retry the rejected ones), into a new Downloads subfolder,
  plus a CRLF `.bat` that joins with `copy /b` and checks the SHA-256 with certutil.
- Seeking in a `keyint=infinite` file decodes from the start: check a long render in ONE decode pass that pulls the
  check frames (select) and the phone copy (trim) together.
- Owner 20 Nov: "snow falling outside is seen crossing the snow collected at the window, and a little over the
  vertical frames". The pane mask held the painted snow piles on the bars and touched the frame edges. `glass_fix()`
  now cuts out the wooden frames (brown, not blue, grown 2 px) and the piles (blue-white pixels starting 1-4 px above
  a bar and >25 brighter than the sky 12 px higher, grown upward). Check: a 12-s max-minus-median "flake track" map
  of the window box must leave every pile and frame clean. Particles behind glass must also stay behind anything
  painted on or in front of the glass (piles, frames, frost).
- Owner 20 Nov 13:51: "some flakes disappear even before the snow on the window". The first cut was grown 2 px
  and blurred (stood 2-3 px above every pile), missed the long pile under the moon (the moon disc spoiled the sky
  reference) and treated a shaded dark pane as wood. Now: piles traced per column from the bar up to the pile's
  sharp top edge (+20 over the pixel 3 px higher; candidate groups >= 8 px wide), cut exactly (0.5 px feather);
  wood only within 3 px of a pane edge, grown 1 px. Check at 3-4x zoom with the cut outline drawn on the picture,
  pane by pane, before any render.
- Owner 20 Nov 14:06: "the lamp tip is a square, easily visible on a big screen ... trace the cutout to the
  thinnest level; far flakes are always smaller - small ones must not come in front of trees while big ones hide".
  Viewers gaze at these videos for a long time, so any mask fault is seen. Now `glass_v3()` decides glass per pixel
  from colour: night-blue scene, pale moon/snow, dark unlit pixels and shaded panes are glass; lit warm things,
  saturated dark wood and a 1-2 px dark rim on them are in front. The rough pane polygon only says where to look
  (2 px around it, freely around the lamp). `near_trees()` traces the near pines (snow layers + needles between);
  the two small far flake layers pass behind them, the two big near layers fall in front. Flakes also fall in
  front of the moon (the old moon cut made them pop at its rim). Review at 3-4x with the glass tinted, quadrant by
  quadrant, plus a 4x close-up video of every object that touches the glass.
- Owner 20 Nov 14:26 ("some trees still interfere with the window"): (1) the moonlit bevel strips on the frames'
  inner edges are blue-grey like the sky: the hand pane polygon is the outer limit again (it leaves them out); it
  is only loosened around the lamp and, for clearly night-blue pixels, in the lowest panes behind the sofa.
  (2) Tree snow standing right behind a sill pile was cut as part of the pile: only the LOWEST top-edge run above a
  bar is the pile. (3) Dark red-brown wood the polygons took in at pane edges (outer 6 px) and near-black frame
  shadow lines there are in front. Erode masks with borderValue=0, or the image edge counts as "deep inside".
- Start long renders with `setsid nohup ... < /dev/null & disown`: a plain background job died when the owner pressed
  stop; the setsid one survived an interruption and finished (98 min 4K: 9.8 min setup + 268 min, 5.0 GB).
