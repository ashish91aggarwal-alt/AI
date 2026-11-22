# Review: profile picture + banner — brand / Page & Lantern (fantasy) — 2026-11-17
Reviewer: reviewer sub-agent (session 064fbb08), did not create this asset: yes
Brief: channels/fantasy/CHANNEL.md, channels/fantasy/brand/about.md  ·  Assets: production/brand/candidates/pl_avatar_s1..6.jpg, pl_banner_s1..6.jpg (+ .sizes.png, .desktop.jpg, .phone.jpg); source art origin/gpu/session1 production/gpu/session1/out/img/pl_*  ·  Benchmark: data/competitors/fantasy (8 channels). Top 3 by subscribers: Ambient Worlds (1.2M), ASMR Weekly (457K), Strings of Eternity (47.6K); Echoes of Alba (46.9K) and Escape Somewhere (3K) also checked as the closest in style. Avatars compared as circles at 48 px and 32 px on YouTube dark grey (#0f0f0f) and on white, among all 8 competitors. Banners compared as phone crops (centre 1546 × 423, shown at 390 px wide = real phone size, and at 2x), and as desktop bands.

## 1. Profile picture

Best as-is: **s3** (largest lantern). Seed to resubmit: **s5** (see fixes; s3 cannot be zoomed because its handle already touches the top edge).

| Dimension | Score | Note |
|---|---|---|
| Reads at 32 px | 7 | At 32 px all six are a warm dot on blue with a pale wedge (the book) under it. The lantern is only about 8 px wide, so you see "a light", not clearly "a lantern". Ambient Worlds (AW monogram), ASMR Weekly (W badge) and even Strings of Eternity (a face) read faster at 32 px. Ours is weaker than all 3 strongest competitors here. |
| Distinct from lane competitors | 8 | No other channel in the lane uses a lantern or a book. Navy + amber is close only to Escape Somewhere (navy with warm lights), which is a text badge, so ours still stands apart. |
| On-brand colour | 8 | Night blue + one warm light matches the thumbnail rule ("one warm focal light") and the banner palette. It shows the name literally: page + lantern. |
| Crafted look | 8 | Painterly brushwork, consistent light, good brass reflections. Small AI tells at 800 px only: a candle sits inside an oil hurricane lantern (it also has an oil filler cap); page text is pseudo-text scribble; the lantern balances on the book's centre fold. None of these show at 98/48/32 px. No painter-signature in any avatar corner (checked all 4 corners of all 6 at 1:1). |

Average: 7.75  ·  Lowest: 7  ·  VERDICT: **FAIL** (average below 8)

Required fixes:
1. Recompose seed s5 so the lantern fills the circle: `compose.py avatar <pl_avatar_s5 master> <out> --zoom 1.5 --dy -60`. My geometry check on the review JPEG (not a submission) shows the lantern then fills about 40 % of the width, the handle stays inside the circle, the top of the open book stays in view, and at 32 px it reads as a lantern. Source is 1328 px, so a 885 px crop is not upscaled.
2. Check the handle has a margin of at least 4 % of the width from the circle edge at 98 px; if it touches, use --zoom 1.45.
3. Resubmit with a new .sizes.png and the same 48/32 px benchmark sheet. Expected result if done: reads at 32 px 8, average 8.0.

## 2. Banner

Best of the six: **s5** (the only one where no part of the lantern sits in the phone crop; just a thin wire of its handle touches the bottom-right of the desktop band, outside the phone crop).

| Dimension | Score | Note |
|---|---|---|
| Mood | 8 | Snowy night, castle with warm windows, deep blue. Calm and magical. A little cold: the warm, cosy part of the picture (lantern and open book on the sill) lies below the band, so no viewer on phone or desktop ever sees it. |
| Clarity of promise | 8 | Tagline "Fantasy music & ambience for reading, rest and sleep" says exactly what the channel is. The picture says "fantasy". The "reading" and "Page & Lantern" link (book + lantern) is lost because those objects are cropped out. |
| Legibility on phone crop | 8 | Name: 32 px tall on a 390 px wide phone, contrast about 12.6 : 1 (measured, see below). Tagline: only about 10 px on the phone, readable but small; Ambient Worlds' tagline is about twice that size. In s5 the castle's lit windows sit right behind "LANT" and a stone window post sits behind "&", which makes the letters busier. |
| Crafted look | 7 | Polished painting, but a common AI scene ("castle seen through a gothic window"). In 5 of 6 seeds the top of the lantern is cut by the band edge (s1, s2, s3, s4, s6); in s1 it is inside the phone crop. The art is a 1664 px image upscaled 1.77x by the browser, so at 1:1 (TV, retina desktop) trees, posts and castle look soft. ASMR Weekly's engraved banner looks more designed and more its own. |

Average: 7.75  ·  Lowest: 7  ·  VERDICT: **FAIL** (average below 8; also not "at least as good on every dimension" than the top 3: weaker than ASMR Weekly on crafted look)

Zoom check (1:1 crops of the band, all four banner corners of all 6 seeds): no painter-signature scribbles in the visible 2560 × 1440 (the 1.15 zoom crops the source corners off); castle architecture holds together, no melted towers; no duplicated objects; no IP look-alike found (generic gothic castle).

Required fixes (needs new art; zoom/focus alone cannot do it, because the lantern and book sit at the bottom right of the source and leave the phone crop when you zoom):
1. Generate a new banner plate made for the band: the lantern and open book on the sill must sit in the vertical middle (y 508–931 of 2560 × 1440) and inside the phone crop (x 507–2053), on one side of the text (free strips about x 507–680 and x 1880–2053, so a narrower name or left-aligned text may be needed), with no lit windows or window posts directly behind the letters (calm dark sky or plain stone behind the text).
2. Nothing may be cut by the band edges (no half lantern, no handle sliver).
3. Upscale the master 2x with a real upscaler before compose (not browser scaling), so the band is sharp on retina and TV.
4. Make the tagline at least 48 px (about 12 px on phone).
5. Resubmit with desktop + phone previews and the same benchmark sheet.

## Measured checks

- Sizes (PIL): all avatars 800 × 800 RGB JPEG, 144–154 KB (limit 15 MB): pass. All banners 2560 × 1440 RGB JPEG, 515–529 KB (limit 6 MB): pass. Note: README says the final upload uses the PNG master re-composed; a 2560 × 1440 PNG can pass 6 MB, so export the final banner as JPEG quality ≥ 92 and re-check size.
- Text safe area: rebuilt each banner's background from the source art with the same zoom/focus/shade as compose.py (matches the real banner to within 0.6–1.5 / 255 outside the text), then diffed: text pixels span x 682–1869, y 629–820 for every seed, inside the 1235 × 338 box (x 662–1897, y 551–889): pass (20 px spare on the left, 28 px on the right; do not make the name bigger).
- Text contrast (WCAG formula, text #FFF8EA vs the shaded background behind it): name median 11.6–13.2 : 1, worst 10 % of pixels 8.3–10.0 : 1; tagline median 11.2–12.6 : 1, worst 10 % 7.0–9.5 : 1: pass.
- Circle safety: subject inside the circle in all six avatars (.sizes.png): pass.
- Tools: PIL contact sheets and benchmark sheets in /tmp (not committed); scripts bench2.py, bban.py, contrast.py, avtest.py.

Outside (ChatGPT) review is still needed for the branding set after these pass.
