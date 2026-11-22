# c5 "wanderer by the mountain lake" - inventory and layer plan (18 Nov 2026)
Union of two independent inventories (compositor's and a fresh reviewer's). Picture: scenes/c5/picture.png, 1672x941.

## Lights
Only sky sources: moon (disc 557,186 r22, halo to r50), stars + Milky Way (dense 1080,0-1672,230), painted shooting star
(788,30-932,102). Everything lit is lit by the moon. No warm source: never add a warm pulse. No moon reflection on the
lake (its mirror point is below the frame): do not add one.

## Wind
Right to left, light. Evidence: coat hem flares left; lake has fine ripples only. Every drifting thing uses this.

## Layer plan
| Element | Source | Mask | Movement and limits |
|---|---|---|---|
| Stars | code | mask_sky (traced ridge, minus tree polygon, minus cloud/moon by darkness, minus figure) | brightness only, each on its own clock; never position |
| Meteors | code | open sky; cut by mask_sky so they pass behind cloud, tree, ridge | painted one is inpainted out; rare (45-150 s), under 1 s, down-slope |
| Lake | code | mask_lake (traced, minus firs, eroded) | ripples travel left and toward viewer, 0.35 px far to 1.85 px near; zero at shores |
| Clouds, valley mist | AI clip (batch 2) | cloud crops, behind tree and ridge | slow drift right to left; mist stays below ridges; moon only thinly veiled |
| Coat hem | AI clip (batch 2) | belt down only (217,575-350,650) | cloth ripple leftward, pinned at belt; body, hood, arms, boots never move; no breathing (sub-pixel) |
| Tree leaves, twig ends | AI clip (batch 2) | canopy; trunk and limbs fixed | flutter a few px; leaves never cross the moon disc |
| Grass, flowers, fir tips | AI clip or code (batch 3) | foreground | tip sway 1-2 px leftward, roots fixed |
| Moon halo | code (batch 2, with clouds) | halo ring | dims slightly only when cirrus passes |

## Must stay still
Mountains, snow, far hills, both shores and their forests, trunk and limbs, all rocks, moon disc and position, Milky
Way position, the whole figure above the belt and its boots.

## Traps
Stars vs flowers/seed heads, vs gold leaf flecks, vs snow speckle; clouds vs snow (800,300-1000,360 and
1380,250-1672,330); mist vs snowfields; sky vs lake reflections (same blue); coat vs bark/moss; a colour-only sky
mask leaked onto the mountains and a colour-only lake mask dropped the cloud reflections (both seen on 18 Nov).

## Artwork notes
Source is 1672x941: needs a careful upscale for 1080p/4K. Lake reflections do not mirror the peaks (ripples hide it;
never add a mirror-accurate effect). Figure's right hand is a blob: keep it still.

## Batch 1 result (18 Nov, code layers only)
Gate: 0 moving pixels outside masks, loop exact. Independent review: round 1 FAIL (cloud flicker from an area sky
mask, lake leaks on rock and fir, one 0.54 Hz wave swaying in place, tadpole meteors); round 2 PASS.
Touch-ups still open (none blocking): add a small 1-5 Hz twinkle component and raise the floor to 8-10 levels; wake
dead bright stars; stars left of x800 with a tree guard; extend the lake outline to the real shoreline in the five
still rims and cut the small fir tip at source (1110,866); glints 2-3x stronger or near-water p95 about 1.2 px;
detail restore down (lake Laplacian variance target 264, now 326); faint meteors 2x brighter; speed (0.39 s/frame:
restrict the warp to the lake box).
