# Review: profile picture + banner — brand / Prayer Pastures (worship) — 2026-11-17
Reviewer: reviewer sub-agent (session 064fbb08), did not create this asset: yes
Brief: channels/worship/CHANNEL.md (pastoral image: field, sheep, dawn light, so "Pastures" is not heard as "pastors"), channels/worship/brand/about.md  ·  Assets: production/brand/candidates/pp_avatar_s1..6.jpg, pp_banner_s1..6.jpg (+ .sizes.png, .desktop.jpg, .phone.jpg); source art origin/gpu/session1 production/gpu/session1/out/img/pp_*  ·  Benchmark: data/competitors/worship (9 channels). Top 3 by subscribers: Prayer Pray (1.07M), Central Record (141K), Perfect Harmony of Heaven (62.9K); Piano and Peace (46.7K) also checked as the closest in style (misty golden landscape + light text). Avatars compared as circles at 48 px and 32 px on YouTube dark grey (#0f0f0f) and on white, among all 9 competitors. Banners compared as phone crops (centre 1546 × 423, at 390 px wide = real phone size, and at 2x) and desktop bands.

## 1. Profile picture

Chosen seed: **s3** (alternate: s6).

| Dimension | Score | Note |
|---|---|---|
| Reads at 32 px | 8 | At 32 px it is clearly a white sheep lying in green grass under dawn light. Reads better than Perfect Harmony (small gold text) and Central Record, about as fast as Prayer Pray's bold logo. Small minus: the white head sits against a pale cream sky, so the ears blur into the sky at 32 px. |
| Distinct from lane competitors | 9 | Every competitor is a dark logo, cross, piano keys or text badge. A light, natural pastoral picture stands out at once, and it answers the "pastors" risk: the sheep says "pasture". |
| On-brand colour | 8 | Cream, gold and soft green: matches the channel palette (cream, gold, dusk blue) and the dawn-meadow banner. Holds its edge on both dark and white backgrounds (blue sky at the top of the circle). |
| Crafted look | 8 | Soft gouache style, gentle light, calm closed eyes (fits prayer and rest). Sheep anatomy checked at 1:1: head, ears, four legs, folded front leg with the hoof pointing back and hind leg tucked forward are all correct for a lying sheep; no extra or melted legs. Slight "cute stock" look (a small smile), not a fault for this audience. No painter-signature in the corners (checked all 4 corners at 1:1). |

Average: 8.25  ·  Lowest: 8  ·  VERDICT: **PASS** (s3)

Notes (not required): s6 has the clearest legs and also passes on the same scores; s1's pose (leg stretched back at the rump end) is the least clear. Re-compose from the PNG master with the same settings (`--zoom 1.15`, dy 0) and re-check the .sizes.png before upload.

## 2. Banner

Best of the six: **s4** (the only seed with two whole grazing sheep inside the desktop band; text contrast in the middle of the group).

| Dimension | Score | Note |
|---|---|---|
| Mood | 9 | Misty dawn over green hills and a still river: very peaceful, exactly "a quiet place to pray". The best mood in the benchmark (Piano and Peace is the closest and is darker and busier). |
| Clarity of promise | 7 | Name and tagline "Quiet instrumental worship for prayer and rest" are clear. But on the phone crop no sheep is visible in any seed: the flock sits at the far right (x ≈ 2150–2560), outside the phone crop (x 507–2053). On desktop the sheep are tiny and cut by the band edge in s1, s2, s3, s5, s6. The brief asks for sheep in the banner; on phone (most views) there is only hills and mist. |
| Legibility on phone crop | 5 | Cream text on pale cream mist and sky. Measured contrast (see below): name about 4 : 1, tagline about 3 : 1, worst 10 % of pixels about 2.5 : 1. On a 390 px phone the tagline is about 10 px tall, so at 3 : 1 it is hard to read. Perfect Harmony (dark script on bright) and Central Record (black on light grey) are much easier to read. |
| Crafted look | 7 | Lovely painterly landscape, believable light and water. But: sheep cut by the band edge or the right edge in 5 of 6 seeds; the art is a 1664 px image upscaled 2x by the browser, so sheep and grass look soft at 1:1 (TV, retina desktop); s5 has two overlapping sheep that read as one sheep with two bodies (an AI tell). |

Average: 7.0  ·  Lowest: 5  ·  VERDICT: **FAIL**

Zoom check: sheep at 1:1 in all six seeds: s1–s4 and s6 have normal grazing sheep (head down, four legs); s5 has the fused pair described above. No painter-signature scribbles in the visible 2560 × 1440 (the 1.3 zoom crops the source corners off). No duplicated or melted objects found otherwise.

Required fixes:
1. Contrast: darken the area behind the text, or pick/generate art with darker green hillside (not bright mist or sun) behind the text. Target, measured the same way as below: name median ≥ 4.5 : 1 and tagline ≥ 4.5 : 1 on at least 90 % of its pixels. Roughly, the background behind the text must be brought from luminance ≈ 0.20 down to ≤ 0.13 (for example a stronger warm shade such as rgba(40,30,10,.55) in the band, or a soft dark glow behind the letters). Keep it soft so the dawn mood stays.
2. Sheep on phone: at least 2 whole sheep (each ≥ 60 px tall at 2560 width) fully inside x 507–2053, y 508–931, not behind the letters (free space is about x 507–850 and x 1700–2053). The current art cannot do this with --zoom/--focus, because compose.py only moves the art up and down and the flock is at the far right. Either add a horizontal focus to compose.py and test, or generate a new plate with the flock at the left or right third of the middle band.
3. No sheep cut by any band edge on desktop or phone.
4. Upscale the master 2x with a real upscaler before compose (not browser scaling).
5. Make the tagline at least 48 px (about 12 px on phone).
6. Resubmit with desktop + phone previews, the contrast numbers and the same benchmark sheet.

## Measured checks

- Sizes (PIL): all avatars 800 × 800 RGB JPEG, 126–137 KB (limit 15 MB): pass. All banners 2560 × 1440 RGB JPEG, 406–420 KB (limit 6 MB): pass. Final banner from the PNG master: export as JPEG quality ≥ 92 and re-check ≤ 6 MB.
- Text safe area: background rebuilt from the source art with compose.py's zoom 1.3 / focus 72 / shade (matches the real banner to within 0.6–0.9 / 255 outside the text), then diffed: text spans x 862–1691, y 644–818 for every seed, inside the 1235 × 338 box (x 662–1897, y 551–889): pass.
- Text contrast (WCAG formula, text #FFF8EA vs shaded background): name median 3.4–4.1 : 1 (worst 10 % 2.2–3.0); tagline median 2.8–3.8 : 1 (worst 10 % 2.5–2.9). s4: name 4.03, tagline 3.06. Fails the 4.5 : 1 target for small text in every seed.
- Circle safety: sheep head and ears inside the circle in all six avatars: pass.
- Tools: PIL contact sheets and benchmark sheets in /tmp (not committed); scripts bench2.py, bban.py, contrast.py, avtest.py.

Outside (ChatGPT) review is still needed for the branding set (the avatar too) before anything is uploaded.
