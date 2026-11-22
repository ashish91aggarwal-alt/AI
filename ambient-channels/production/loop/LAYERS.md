# Layer plan for cozy-room loop videos (owner feedback 17 Nov, 21:45 IST)

Draft 1 failed: it was effects added on top with no layer plan. Snow showed inside the room, the fire only glowed, lamps and candles were still, and the steam was weak.
Method: the "4 Secrets to Immersive Ambience Videos" tutorial (Visual Laurence, CapCut):
- real looping overlay footage in **Screen** blend, masked and scaled to place;
- a night version of the same picture cross-faded over time;
- candles lit one by one;
- fire and weather that grow and calm over the timeline;
- sound layers that change with the picture.
We do the same in code (ffmpeg/numpy), so it is exact and repeatable.

## Rules
1. **Every light source is alive.** Fire burns (real flames moving up), each candle and lantern flame flickers on its own clock, tree bulbs twinkle one by one, the electric lamp's halo breathes slowly, and every hot drink has rising fog.
2. **Nothing crosses its boundary.**
   - Snow lives only inside the traced glass panes. Flakes enter behind the top bar and leave behind the sill, so no flake ever pops in or out in view.
   - Flames stay inside the firebox opening, behind the grate and logs.
   - Steam starts at the cup rim.
3. **Real loop points, checked.**
   - Each looping layer has its own length (fire 10 s, candles 4–7 s with different offsets, snow 20 s, steam 8 s, breathing 2.4/1.7 s). The whole picture never repeats in a short cycle.
   - Each footage loop is closed with a 1 s crossfade. The jump at its loop point must be no bigger than 1.2× a normal frame step, measured.
4. **The video evolves (no repetitive content).**
   - Opening: dusk version of the picture with 2 candles lit and a small fire.
   - Over minutes 0:40–3:00: fade to night, candles light one by one, and a second, bigger fire fades in.
   - Snow goes light → heavy (minutes 15–25) → light.
   - The sound follows: fire crackle layers and wind crossfade with the picture.
5. **Animals:** natural breathing only (their own body rises and falls). Nothing slides or wobbles.

## Layers, back to front (scene c2 shown; c1 is the same set minus the tree)
| # | Layer | Source | Mask / place | Changes over time |
|---|-------|--------|--------------|-------------------|
| 0 | Night plate | ChatGPT picture | full frame | — |
| 0b | Dusk plate | same picture edited by ChatGPT (bluer sky, lamps off, fewer candles) | full frame, opacity 100→0 over 0:40–3:00 | one-time transition |
| 1 | Far snow | snow footage (or code particles), small, slow, soft | traced glass panes only | light → heavy → light |
| 2 | Near snow | bigger, faster flakes | traced glass panes only | follows layer 1 |
| 3 | Fire glow on glass | the fire's brightness drives a faint warm reflection on the panes | panes | follows the fire |
| 4 | Fire A | real fireplace loop footage, Screen blend | firebox opening; grate and logs cut out and laid back on top | always on |
| 4b | Fire B (roaring) | second, bigger fire footage | same | fades in 1:30–3:00 |
| 5 | Firelight on room | per-frame brightness of 4+4b drives a warm light falloff over the hearth, rug, chair and cats | radial falloff from the fire | follows the fire |
| 6 | Candle and lantern flames | candle-flame footage, Screen blend, one per wick, each with its own time offset and size | each wick | lit one by one in the opening |
| 7 | Candle halos | each flame's brightness drives its own halo | radius per candle | follows layer 6 |
| 8 | Tree bulbs | each detected bulb fades up and down slowly on its own clock | bulb blobs in the tree | constant |
| 9 | Electric lamp | halo breathes ±3 % slowly (no flicker) | lamp shade and pool of light | constant |
| 10 | Drink fog | steam footage (Screen, low opacity) or code wisps rising from the rim and fading | rising plume above the cup | constant |
| 11 | Breathing | local warp on each animal's body only | body ellipse | constant |
| 12 | Grade | soft vignette | full frame | — |

## Checks before anything goes to the owner
- Snow pixels outside the pane mask: **0** (measured).
- Each light in the list (fire, every candle, lantern, bulbs, lamp, steam) shows brightness change over its loop (measured). None is still.
- Loop-point jump ≤ 1.2× normal frame step for every layer and for the final file.
- Contact sheet of 8 frames plus a crop of every light source at 4 moments, looked at before sending.
- Then a 2-minute preview to the owner, including the dusk-to-night opening.

## Footage
CapCut users buy or download overlay packs. We need about 6 clips on black backgrounds:
- 2 fireplace fires
- 1 candle flame
- 1 lantern flame
- 1 snowfall
- 1 steam

They come from free stock sites whose licence allows commercial use without credit (Pexels, Pixabay), downloaded once and kept with their licence notes. Code-made versions remain the fallback.

## Scene c4 (owner's cat cabin, 18 Nov): what changed after drafts 1-2 failed
- Light-source inventory made twice, independently (me + a fresh reviewer, `scenes/c4_inventory_reviewer.md`); the union is the list the gate checks (`scenes/c4_lights_for_gate.json`).
- Moving parts come from the owner's own picture, animated by Wan2.2 I2V on 5 crops (fire, mantel candle+lantern, shelf candle, windows, cocoa), pasted back only inside reviewed masks. Fire/candles/snow/steam are therefore in the picture's drawn style.
- Window mask = traced pane polygons minus things in front (lampshade, sofa, throw, log wall). A colour test alone had put snow on the moonlit jamb strips and the sofa's top edge (that was the "snow inside" bug).
- Gate (`compose_c4.py --gate`): motion map; moving pixels outside allowed masks must be 0; moving non-glass pixels in the window area must be 0; every inventoried light must move; loop point exact. Then an independent reviewer on frames and strips before the owner sees anything.
