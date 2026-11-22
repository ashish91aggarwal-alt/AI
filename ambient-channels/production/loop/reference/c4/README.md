# Reference pictures: c4 "sleepy cat cabin" (18 Nov 2026)

Look at these before starting a new living picture. Files marked BAD show mistakes the owner caught or a
reviewer found. Do not repeat them.

| File | What it shows |
|---|---|
| 01_picture.jpg | The owner's still picture. Everything starts from this frame. |
| 02_light_sources_map.jpg | Which source lights which area: fire orange, mantel candle yellow, lantern green, shelf candle blue, lamp magenta. Make this map for every new picture and check each lit area has a source. |
| 03_glass_mask_good.jpg | Glass mask: traced pane polygons minus everything in front (lampshade, sofa, throw, log wall). Snow is allowed only here. |
| 04_moonlit_surfaces_snow_shadows_only_here.jpg | Yellow = moonlit wood and sofa rim. These are the only places snow shadows may fall. A colour-only "window" mask once included these strips and caused "snow inside the room". |
| 05_cat_cut_grabcut_good.jpg | Cat outline from GrabCut seeded with a rough polygon. It follows ears, back fur and tail, and stops at the quilt edge. |
| 06_cat_paste_mask_body_plus_pillow.jpg | Area taken from the cat clips: body plus the pillow under the chin only. Anything wider let a model-made glow blob onto the sofa. |
| 07_candle_needle_BAD_model_vs_picture.jpg | Picture, then model frames, then the mask. The model stretched the teardrop candle flame into a needle. Small flames are now animated in code from the picture's own flame. |
| 08_steam_crop_and_old_box_mask_BAD.jpg | Steam crop and the old square mask. Replacing a box of the picture left a darker patch with straight edges. Now only the moving wisps are added onto the untouched picture. |
| 09_cat_paw_blooper_BAD.jpg | Kneading clip: the paw comes out and the mouth opens wide. The owner called the paws AI bloopers. Cat moves are limited to eyes squeezing, whiskers, ear twitch, lip lick and a small mouth open; no paws. |
| 10_flf_glow_blob_and_motion_BAD.jpg | Motion maps of the first-and-last-frame cat clips. The whole crop brightens (by up to +40%), and a glow blob appears on the sofa. Fix: per-frame gain from a ring around the cat, plus a tight paste mask. |
| 11_fire_light_flicker_on_room_good.jpg | Four frames: hearth, tools and armchair brighten and darken with the fire (8–10% swing near the fire). |
| 12_candle_flame_in_code_good.jpg | Picture, then the code-animated candle: teardrop kept, height ±7%, warmer (never grey) when dim. |
| 13_steam_on_untouched_picture_good.jpg | Picture, then steam frames: no patch, stays left of the lampshade, starts above the marshmallows, no specks. |
| 15_fire_first_last_frame_clip_good.jpg | Fire clip made with first frame = last frame = the picture. The flames keep moving at a normal pace up to the last frame, with no slowdown, and land on the picture: exact joins work for fire. |
| 16_cat_lip_lick_good.jpg | Allowed cat move: small mouth open and tongue lick, head and paws still. |
| 14_motion_map_gate.jpg | Gate motion map (geometry, light model off). Bright = allowed motion inside masks; green = motion outside the masks, which must be 0. |

Problems that have no picture here:
- **Doubled flames:** converting 16 fps clips to 24 fps by cross-fading neighbour frames made the tongues look doubled and see-through. Use optical-flow in-betweens.
- **Keyframe pops and colour shift:** x264 crf 16 with default settings ticked every 10 s and used the BT.601 colour matrix. Encode with crf 14, slow preset, tune animation, the BT.709 conversion and tags, as one continuous encode.
- **Seams:** the owner can see any blend between two different frames. Every join must pass through one identical frame, so all layers use first-and-last-frame clips chained whole (`living.FlfStream`).
- **Sharpness flash:** the picture is sharper than model frames, so joining through it flashes crisp. Use `living.match_sharpness`.
- **Light faults (reviewer, round 1 of the light model):**
  - the lantern pulsed at a steady 1.35 Hz;
  - the shelf-candle wax dimmed when the niche brightened;
  - the whole sky brightened with every blend between snow clips;
  - the mantel area was over target.
  All four are fixed in compose_c4.py.
- **Speed:** 0.2 s per frame (10 h for 2 hours of video) came from optical-flow in-betweens being recomputed every frame. Now clips are cached at 24 fps once, light is computed at half size, frames are made in parallel with one encoder, and a 10-minute exact-loop block is copied ×12.

## Final review round 1 of the 10-minute demo (18 Nov): findings and the fixes now in the code
- **All layers joined at the same moment every 6 s:** fixed per-layer phase (fire 0, left snow 29, mug 58, cat 87, right snow 116 frames).
- **Doubled tongues next to a join:** the 3-frame cross-fade onto the picture was replaced. Each layer now lands on a **shared join frame** (median of its clips' own first/last frames) along the optical flow. Landing on the picture itself snapped, because the picture is sharper and has different colours.
- **Snow-clip moon blurred and dimmed, then snapped back:** the picture's own moon is kept (disc r 45 at 1541,99), and the snow mask is eroded 2 px off the jambs.
- **Cat face drifted grey-blue, then snapped back:** per-frame colour lock on the cat body. Clip earonly_1 is banned (face redraw: stripes fade, face goes pale).
- **Shelf flame blue and lantern on a 12-s repeat** (2 clips each, about 50 plays): both are now animated in code from the picture's flames. The lantern is brightness-only, in two halves, because warping would bend the lattice.
- **Fire lemon-yellow:** per-clip hue lock to the picture's fire.
- **Snow, 4 clips at about 25 plays each:** two independent walks (left / right panes).
- **Keyframe twinkle every 10 s:** one keyframe per block. A keyframe always changes the codec noise pattern (about 0.7 mean level at crf 12), which shows once per block; YouTube re-encodes anyway.
- **Memory (8 GB sandbox):** spawned workers each rebuilt about 3.3 GB and got killed; a queue of finished frames with no limit also ran out of memory. Now the clips are prepared once in the parent, workers are forked (shared memory), and at most 2 batches of 24 frames are in flight per worker. Never run a reviewer's full-resolution decoding at the same time as a render.
- **Timing:** 10-minute block = about 25 min on 2 cores (setup 2.5 min). Full GPU set of 28 clips = 35 min of generation, about $1.95.
| 17_candle_code_warp_bends_planks_BAD.jpg | The shelf candle flame was warped in code (height and sway), which breaks the owner's no-wobble rule. It also bent the lit plank and a knot behind it by up to 4 px. Candles need true first-and-last-frame clips. |
| 18_fire_no_wood_redraw_good.jpg | Fire with the logs, grate and back wall taken from the picture and the clip used only where it differs (flames, coal glow, sparks): no redraw at joins. |

## Status of the 10-minute demo (c4_demo10_v6.mp4, sent to the owner 18 Nov)
The final review, round 5, passed lights, cat, no degradation, repetition and snow-only-on-glass. Still open:
- fire stutter of about 0.1 s at each join (next: settle=0 for fire and skip the join frame);
- snow step of about 0.5–1 % at the join frame (next: smooth the final left/right streams across joins);
- one patched snow frame;
- the code-warped mantel and shelf candles (rule breach). The owner chose "not now" for the candle clips (about 18 clips, about $1.30).
