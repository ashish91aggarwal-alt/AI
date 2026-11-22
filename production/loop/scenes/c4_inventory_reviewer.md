# c4_owner_cat_cabin.png - independent motion inventory (reviewer)

Image: production/gpt/img/c4_owner_cat_cabin.png, 1672x941. All coordinates are pixels in that image,
boxes are [x0, y0, x1, y1] (x1/y1 exclusive), polygons are [[x,y],...] clockwise from top-left.
Measured from 3x-8x gridded crops and a blue-glass pixel mask, not from the thumbnail. Expect +-2 px.

```json
{
  "image": "../gpt/img/c4_owner_cat_cabin.png",
  "size": [1672, 941],

  "light_sources": [
    {
      "id": "fire_flames",
      "what": "open wood fire, flame tongues above and around the logs",
      "box": [245, 378, 378, 578],
      "core_white_hot": [270, 470, 340, 560],
      "tallest_tip": [315, 380],
      "motion": "real flame flicker: tongues waver and lick upward (vertical-biased warp), height jitter, brightness flicker 8-15 percent, irregular timing (several noise frequencies). Warp only flame pixels, not logs, grate or bricks."
    },
    {
      "id": "fire_coal_bed",
      "what": "glowing coals and ember chunks under and between the logs / under the grate",
      "box": [258, 560, 405, 642],
      "motion": "slow ember pulse, patchy (different chunks brighten at different times), 1-3 s cycles, no displacement."
    },
    {
      "id": "fire_log_ember_cracks",
      "what": "glowing orange cracks / burning faces on the logs",
      "box": [253, 520, 400, 600],
      "motion": "subtle glow pulse in sync with coal bed; the log shapes themselves never move."
    },
    {
      "id": "fire_sparks_optional",
      "what": "not painted; optional added sparks",
      "allowed_box": [250, 378, 400, 600],
      "motion": "few small sparks rising and dying inside the firebox only; must disappear before y 378 (firebox top arch). Never over the mantel, stone or room."
    },
    {
      "id": "mantel_candle",
      "what": "white pillar candle on brass holder, right part of the mantel",
      "flame_box": [339, 124, 351, 156],
      "candle_body_box": [329, 152, 362, 188],
      "holder_box": [322, 185, 371, 215],
      "motion": "small candle flicker: flame sways 1-2 px at the tip, slight height change, brightness 5-10 percent; body and holder static; soft halo radius ~25 px around (345,140)."
    },
    {
      "id": "mantel_lantern",
      "what": "black metal lantern with lit amber glass panes (candle/oil inside, flame not directly visible)",
      "whole_box": [368, 77, 459, 223],
      "lit_glass_box": [378, 136, 449, 206],
      "brightest_core": [395, 158, 440, 198],
      "motion": "gentle flicker of the glass glow (5-8 percent, slower and softer than an open flame, since glass diffuses it); metal frame and handle static."
    },
    {
      "id": "shelf_candle",
      "what": "small white candle in a dish on the right bookcase, middle shelf (easy to miss)",
      "flame_box": [842, 337, 851, 355],
      "candle_body_box": [836, 353, 856, 370],
      "dish_box": [828, 368, 863, 378],
      "motion": "small candle flicker like the mantel candle (independent phase); its glow lights the shelf niche."
    },
    {
      "id": "table_lamp_shade",
      "what": "electric table lamp, glowing cream fabric shade on brass base",
      "shade_polygon": [[1403, 288], [1500, 287], [1549, 410], [1355, 412]],
      "shade_box": [1355, 276, 1550, 422],
      "finial_box": [1442, 276, 1457, 292],
      "bottom_rim_bright_box": [1355, 398, 1550, 422],
      "brass_base_box": [1417, 404, 1502, 548],
      "motion": "electric: steady. At most a very faint, slow breathing glow (<=1-2 percent, 6-10 s) on shade and its spill. No flicker, no warp."
    },
    {
      "id": "moon",
      "what": "full moon in window W3 right column, row 2; right edge partly hidden by the window frame at x 1351",
      "disc_box": [1318, 59, 1352, 99],
      "center": [1336, 79],
      "radius": 19,
      "halo_box": [1292, 35, 1351, 118],
      "motion": "static disc. Optional very faint halo shimmer (<=2 percent). Falling snow passes in front of it."
    },
    {
      "id": "painting_cottage_windows",
      "what": "lit windows of the cottage INSIDE the framed painting (painted light, not a real source)",
      "box": [805, 222, 870, 262],
      "motion": "NONE. It is a picture on the wall."
    }
  ],

  "light_spill_on_surfaces": [
    {"source": "fire", "where": "firebox back bricks", "box": [240, 368, 416, 632], "motion": "flicker in sync with fire, 5-10 percent"},
    {"source": "fire", "where": "stone surround and arch", "box": [100, 290, 480, 700], "motion": "fire-synced flicker, fading with distance, 3-6 percent"},
    {"source": "fire", "where": "hearth stones", "box": [180, 595, 560, 720], "motion": "fire-synced, 5 percent"},
    {"source": "fire", "where": "floorboards warm patch in front of hearth", "box": [400, 640, 720, 790], "motion": "fire-synced, 3-5 percent"},
    {"source": "fire", "where": "fire-tool set brass handles and stand", "box": [145, 425, 262, 690], "motion": "fire-synced highlight flicker only, tools never move"},
    {"source": "fire", "where": "wingback chair lit rim and white throw on its arm", "box": [0, 380, 420, 940], "motion": "fire-synced, 2-4 percent, strongest on the rim facing the fire"},
    {"source": "fire", "where": "mantel beam and garland underside", "box": [60, 180, 485, 330], "motion": "fire-synced, 2-3 percent"},
    {"source": "fire", "where": "log basket and kindling", "box": [455, 470, 590, 630], "motion": "fire-synced, 2-3 percent"},
    {"source": "mantel_candle", "where": "stone and jars behind/around candle", "box": [290, 95, 385, 230], "motion": "candle-synced, 3-5 percent"},
    {"source": "mantel_lantern", "where": "wall/beam behind lantern and mantel top", "box": [355, 60, 485, 235], "motion": "lantern-synced, 3-5 percent"},
    {"source": "shelf_candle", "where": "lit back panel of the shelf niche and nearby book spines", "box": [818, 318, 880, 380], "motion": "candle-synced, 4-6 percent"},
    {"source": "table_lamp", "where": "log wall right of the lamp (orange lit logs)", "box": [1530, 0, 1672, 600], "motion": "steady (or same <=1-2 percent breathing as the shade)"},
    {"source": "table_lamp", "where": "end-table top, books, mug, vase", "box": [1200, 500, 1665, 650], "motion": "steady"},
    {"source": "table_lamp", "where": "floor light patch under table (bottom middle-right)", "box": [1240, 860, 1420, 941], "motion": "steady"}
  ],

  "other_motion": [
    {
      "id": "snow_outside",
      "what": "falling snow, visible ONLY through the glass panes listed under windows",
      "motion": "small flakes drifting down with slight sideways sway, varied sizes/speeds, far flakes smaller and slower. Composite strictly inside pane polygons minus occluders. Flakes are outside, so they pass behind every mullion, muntin, frame, the sofa, the throw, the lampshade and the log wall. Painted flakes already on the glass stay static."
    },
    {
      "id": "mug_steam",
      "what": "painted steam wisps rising from the hot-chocolate mug on the end table",
      "source_point": [1325, 500],
      "painted_steam_box": [1295, 405, 1362, 502],
      "allowed_box": [1288, 392, 1352, 502],
      "mug_box": [1286, 494, 1386, 584],
      "motion": "slow upward drift and curling, fading out by ~y 400; keep left of x 1352 so it never crosses the lampshade rim; mug, marshmallows and coaster never move."
    },
    {
      "id": "cat_breathing",
      "what": "sleeping tabby-and-white cat on the sofa, head on the floral pillow, body under the patchwork quilt",
      "cat_visible_box": [885, 436, 1072, 548],
      "head_box": [885, 436, 990, 532],
      "breathing_area_box": [965, 450, 1070, 545],
      "breathing_center": [1015, 495],
      "breathing_radius": [55, 42],
      "motion": "breathing only: slow rise and fall of the back/flank (and the quilt edge right over it), 1-1.5 px max, ~4-5 s per breath, smooth local warp falling to zero at the edges. Head, ears, face, whiskers stay still (at most 0.3 px follow). No blinking, no whole-image shift."
    }
  ],

  "windows": {
    "note": "Four windows, left to right W1..W4, each 2 columns (L, R). Mullions/muntins slope slightly up to the right (perspective). Polygons are the GLASS area between wood members; painted snow piles on the muntins sit outside and are included in the glass (they are static paint). Visible glass = pane polygon minus occluders.",
    "W1": {
      "outer_box": [940, 95, 1040, 376],
      "panes": {
        "L1": [[966, 118], [998, 111], [998, 168], [966, 172]],
        "R1": [[1005, 108], [1031, 98], [1031, 163], [1005, 167]],
        "L2": [[970, 180], [997, 177], [996, 254], [963, 257]],
        "R2": [[1007, 175], [1031, 172], [1031, 250], [1003, 253]],
        "L3": [[967, 265], [998, 262], [997, 341], [963, 342]],
        "R3": [[1006, 261], [1031, 258], [1029, 340], [1003, 340]],
        "L4_partial": [[964, 347], [998, 346], [998, 372], [963, 373]],
        "R4_partial": [[1004, 347], [1031, 346], [1031, 375], [1003, 375]]
      },
      "wood_not_glass": {
        "left_jamb_moonlit_bluish": [940, 100, 963, 376],
        "header_slanted": "above the R1/L1 top edges (y 95-118)",
        "vertical_mullion": [998, 100, 1005, 376],
        "row_muntins_y": ["~168-180", "~252-262", "~340-347"],
        "right_frame": [1031, 95, 1040, 376]
      }
    },
    "wall_post_W1_W2": {"box": [1036, 60, 1090, 376], "note": "includes pale bluish jamb strip x 1065-1090 that looks like glass in a colour test - NOT glass"},
    "W2": {
      "outer_box": [1088, 15, 1198, 376],
      "panes": {
        "L1_sliver": [[1098, 52], [1141, 42], [1141, 64], [1098, 70]],
        "R1": [[1150, 36], [1189, 19], [1189, 47], [1150, 55]],
        "L2": [[1098, 78], [1141, 69], [1140, 146], [1094, 153]],
        "R2": [[1150, 66], [1189, 58], [1189, 138], [1147, 144]],
        "L3": [[1098, 162], [1140, 156], [1140, 241], [1094, 245]],
        "R3": [[1149, 154], [1189, 148], [1189, 236], [1147, 240]],
        "L4": [[1097, 255], [1140, 250], [1141, 336], [1093, 338]],
        "R4": [[1152, 248], [1189, 245], [1189, 334], [1147, 336]],
        "L5_partial": [[1094, 345], [1141, 344], [1141, 368], [1094, 374]],
        "R5_partial": [[1150, 344], [1189, 343], [1190, 362], [1174, 372], [1148, 372]]
      },
      "wood_not_glass": {
        "left_frame": [1086, 40, 1095, 376],
        "vertical_mullion": [1141, 20, 1149, 376],
        "right_frame": [1189, 10, 1198, 376],
        "row_muntins_y": ["L ~64-77 / R ~50-62", "L ~146-160 / R ~138-152", "L ~238-253 / R ~234-246", "~336-345"]
      }
    },
    "wall_post_W2_W3": {"box": [1192, 0, 1232, 376], "note": "dark post plus pale jamb strip - NOT glass"},
    "W3": {
      "outer_box": [1226, 0, 1360, 372],
      "panes": {
        "L1_partial_top": [[1233, 10], [1260, 0], [1288, 0], [1287, 28], [1233, 40]],
        "R1_partial_top": [[1298, 0], [1351, 0], [1350, 12], [1298, 24]],
        "L2": [[1237, 48], [1288, 37], [1287, 122], [1233, 130]],
        "R2_moon_pane": [[1298, 34], [1351, 22], [1350, 111], [1295, 120]],
        "L3": [[1237, 140], [1288, 132], [1287, 226], [1232, 231]],
        "R3": [[1298, 130], [1351, 122], [1350, 219], [1295, 225]],
        "L4": [[1238, 240], [1288, 235], [1288, 331], [1233, 333]],
        "R4": [[1298, 234], [1351, 230], [1351, 329], [1295, 331]],
        "L5_partial": [[1237, 341], [1288, 340], [1288, 356], [1250, 356], [1233, 364]],
        "R5_partial": [[1298, 339], [1351, 338], [1350, 366], [1298, 368]]
      },
      "wood_not_glass": {
        "left_frame": [1226, 0, 1233, 372],
        "vertical_mullion": [1288, 0, 1296, 372],
        "right_frame": [1351, 0, 1360, 372],
        "row_muntins_y": ["L ~28-46 / R ~12-32", "L ~122-140 / R ~111-130", "L ~226-240 / R ~219-234", "~331-341"]
      }
    },
    "wall_post_W3_W4": {"box": [1352, 0, 1390, 380], "note": "dark post and jamb - NOT glass"},
    "W4": {
      "outer_box": [1380, 0, 1545, 420],
      "panes": {
        "L1": [[1394, 0], [1466, 0], [1466, 91], [1390, 104]],
        "R1": [[1477, 0], [1535, 0], [1540, 78], [1475, 89]],
        "L2": [[1394, 115], [1466, 109], [1466, 208], [1390, 215]],
        "R2": [[1479, 100], [1534, 92], [1542, 171], [1533, 201], [1475, 206]],
        "L3_mostly_behind_shade": [[1391, 229], [1466, 219], [1466, 322], [1391, 328]],
        "R3_partly_behind_shade": [[1478, 218], [1534, 214], [1543, 264], [1535, 322], [1474, 325]],
        "R4_visible_sliver": [[1505, 333], [1535, 330], [1538, 400], [1520, 402]],
        "L4": "fully hidden behind the lampshade - no snow"
      },
      "wood_not_glass": {
        "left_frame": [1380, 0, 1391, 420],
        "vertical_mullion": [1466, 0, 1475, 420],
        "right_edge": "log wall overlaps the right column, irregular boundary x ~1530-1545",
        "row_muntins_y": ["L ~91-112 / R ~78-100", "L ~208-224 / R ~201-218", "~322-333"]
      }
    },
    "occluders_in_front_of_glass": [
      {"what": "lampshade + finial + bottom rim", "polygon": [[1442, 276], [1457, 276], [1457, 288], [1500, 287], [1549, 410], [1550, 422], [1355, 422], [1355, 412], [1403, 288], [1442, 288]]},
      {"what": "sofa back top edge (W1, W2 left)", "rule": "nothing below y ~372 for x 940-1110 (sofa top undulates 368-376)"},
      {"what": "beige plaid throw on sofa back", "rule": "top edge from (1110,372) rising to (1240,357), flat to (1290,355), down to (1300,366)"},
      {"what": "sofa back (W3 right, post)", "rule": "nothing below y ~368 for x 1295-1390"},
      {"what": "log wall right of W4", "rule": "nothing right of x ~1532 (irregular log edge 1530-1545)"}
    ],
    "sills": "No window sill is visible: the sofa and throw hide the bottom of every window. There is NO snow inside the room anywhere. All visible snow piles are on the outside of the muntins, inside the glass areas, and are static paint.",
    "snow_mask_recipe": "visible_glass = union(pane polygons) minus occluders. A colour test (B > R+18 and B > 1.4*G) finds the dark-blue glass well, but also fires on: the moonlit bluish jambs (x 940-963, 1065-1090, 1200-1228), blue sheen strokes on the teal sofa (y 368-410) and the painting canvas; and it misses the white snow piles. So use the polygons, not a colour test."
  },

  "never_move": [
    {"what": "framed winter painting incl. its painted snow, trees, cottage and lit windows", "box": [775, 168, 892, 293], "canvas_box": [792, 187, 876, 281], "note": "TRAP: looks like a window with snow - no snow, no glow animation here"},
    {"what": "all window wood: frames, mullions, muntins, posts, jambs, header", "box": [940, 0, 1560, 380]},
    {"what": "painted snow piles on muntins and painted flakes on the glass", "note": "static paint"},
    {"what": "stone chimney/fireplace surround, mantel beam, pine garland, berries, pinecones", "box": [0, 0, 490, 700]},
    {"what": "mantel jars (tree jar, red jar, nut jar)", "box": [130, 60, 325, 200]},
    {"what": "logs (as shapes), andiron grate, fire tools and stand, broom", "boxes": [[245, 515, 412, 640], [145, 425, 262, 690]]},
    {"what": "wingback chair, its white snowflake throw (snowflake motif is knitted, not snow), dark foreground plant silhouette bottom-left", "boxes": [[0, 380, 520, 941], [0, 680, 135, 941]]},
    {"what": "bookcases, books, ivy plant (no wind indoors), pot, box, globe, blue-white ginger jar, chest", "box": [460, 90, 910, 470]},
    {"what": "log basket with kindling", "box": [455, 470, 590, 630]},
    {"what": "sofa, cushions (plaid, red, floral), throw on back, patchwork quilt (except tiny breathing lift over the cat's flank)", "box": [650, 360, 1420, 800]},
    {"what": "cat head, ears, face, whiskers, paws", "box": [885, 436, 990, 532]},
    {"what": "footstool", "box": [590, 635, 795, 770]},
    {"what": "braided rug and floorboards (only fire-light flicker on the warm floor patch)", "box": [400, 640, 1672, 941]},
    {"what": "end table, drawer, knob, books, small basket, mug body, coaster, lamp base, berry vase", "box": [1195, 400, 1665, 920]},
    {"what": "big quilt basket bottom right", "box": [1450, 680, 1672, 941]},
    {"what": "coat hooks and red/cream scarf (white snowflake motifs are knitted, not snow)", "box": [1555, 80, 1665, 470]},
    {"what": "ceiling beams and log walls", "box": [0, 0, 1672, 140]}
  ]
}
```

## Notes

- Light sources to animate (5 real + 1 sky): fire (flames, coal bed, log cracks), mantel candle, mantel lantern, the small shelf candle on the right bookcase at (846,346) (easy to miss), the electric table lamp (steady, at most a faint breath) and the moon (static, optional faint halo). The glowing cottage windows are inside the wall painting and must not move.
- Every light's spill on nearby surfaces should follow its source (fire spill on stone, hearth, floor, tools and chair; candle and lantern spill on the mantel and shelf niche). The lamp spill on the right log wall and table stays steady.
- Snow risk areas: (1) the wall painting at [792,187,876,281], which has painted snow and dark-blue sky; (2) the pale bluish moonlit jambs between windows; (3) blue sheen strokes on the teal sofa just under the windows; (4) the knitted snowflake patterns on the chair throw, the scarf, the cushion and the quilt. Snow belongs only inside the pane polygons, minus the lampshade, sofa/throw and log wall.
- The lampshade covers most of W4's lower panes. Snow can only show above the shade top (y < ~288), in the strip left of the shade, and in the narrow sliver at x ~1505-1538 between the shade and the log wall.
- Cat: breathing only, a local warp on the flank/back under the quilt edge. The head stays still.
- Steam: it rises from (1325,500) and must fade before reaching the lampshade rim at x >= 1355, y ~400-420.
- Pane polygons came from a blue-glass component analysis plus visual checks at 4x. Muntins tilt up to the right by about 8-12 px across a column, so axis-aligned rectangles would let snow show on the wood. Use the polygons.
