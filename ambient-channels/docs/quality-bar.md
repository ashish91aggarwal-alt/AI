# Quality bar — every public thing passes this, no exceptions

**Owner's requirement (2026-11-17):** the owner is not from these audiences and does not judge
taste. Claude sessions own quality end to end. Anything that will be public — a name, a handle,
a picture, a banner, a thumbnail, a title, a description, a scene, motion, music, ambience, the
mix, the feel — passes a high-grade gate before it goes out. Take as long as the review needs.
The owner gives only the final "go" to publish, based on the review report.

## Three layers, all required

1. **Measured checks** (objective, scripted where possible): sizes, loudness, peaks, loop seams,
   artefact scans, character limits, policy rules. Pass/fail, no opinion.
2. **Benchmark** against the 3 strongest competitors in that lane (from `data/latest.json`):
   ours and theirs side by side at the size the viewer sees it (thumbnail at 360 px wide and at
   160 px, banner on desktop and phone crop, first 30 s of audio level-matched). Ours must be
   at least as good on every dimension in the rubric, and better on at least one.
3. **Independent review** by the `reviewer` role (agents/reviewer.md): a session or sub-agent
   that did not make the asset and is given only the asset, the brief, the benchmark and this
   rubric. It scores 1–10 per dimension.
   **Pass = average ≥ 8 and no dimension below 7.** Anything less goes back with fixes.
   High-stakes items (each channel's branding set, each channel's first 3 videos) also get a
   second, outside review: a review package in the `fable-transfer` repo `reviews/` folder for
   ChatGPT, as the owner already does. Both reviews must pass.

Every review is saved as `reviews/<card-or-brand>/<asset>-<YYYY-MM-DD>.md` (template below)
and linked in the gate note. No review file = the gate is not passed.

## Rubric by asset

| Asset | Dimensions scored by the reviewer | Measured checks |
|---|---|---|
| Channel name + handle | audience fit, clarity of promise, memorability, spoken spelling, distinctiveness, expectation match, crafted (not AI-generic) feel, extensibility, owner's Chaldean rule (must reduce to 6 or 5) | handle free; no trademark/brand conflict found; no bad meanings in US/UK English |
| Profile picture | reads at 32 px, distinct from 10 lane competitors, on-brand colour, crafted look | 800 × 800, circle-safe, ≤ 15 MB |
| Banner | mood, clarity of promise, legibility on phone crop, crafted look | 2560 × 1440, text inside 1235 × 338, ≤ 6 MB |
| Watermark | legible, unobtrusive | 150 × 150, < 1 MB, transparent |
| Channel description / About | first line says what + for whom, honest AI note, tone | ≤ 1,000 chars, no keyword stuffing |
| Still image (scene) | composition, light, mood, story, believability of the world, no AI tells | 4K, zoom-check hands/faces/text/architecture/duplicated objects |
| Motion | natural joint motion of living things, calm pace, ambient layers convincing | loop seam invisible ×10, no whole-image slide/rotate/stretch |
| Music set | beauty, fit to scene, variety without jolts, sleep/focus safety, no AI tells (warble, smear, metallic hiss) | LUFS + true peak per docs/gates.md G3, no track > 10% louder than median, no repeated section inside 45 min |
| Ambience + mix | realism, balance under music, no fatigue over 30 min | real CC0 recordings logged, no loop pops |
| Thumbnail | stops the scroll at 160 px, promise matches video, distinct from competitors | 1280 × 720 min (3840 × 2160 preferred), ≤ 3 words |
| Title + description | clarity, search words first, honest, tone | title ≤ 100 (≤ 70 visible), 3 hashtags, chapters valid |
| Whole video (final) | feel after 10 min of real watching/listening, would a fan bookmark it | full render QA per G4 |
| Channel trailer | hooks in 5 s, shows variety, ends on promise | 60–90 s |

## Review file template

```
# Review: <asset> — <card/brand> — <date>
Reviewer: <session id / sub-agent>, did not create this asset: yes
Brief: <link>  ·  Asset: <path or link>  ·  Benchmark: <3 competitors + what was compared>
| Dimension | Score | Note |
|---|---|---|
Average: x.x  ·  Lowest: x  ·  VERDICT: PASS / FAIL
Required fixes (if FAIL): …
Measured checks: <command + output summary>
```

## Brand asset log

| Channel | Asset | Status | Review file |
|---|---|---|---|
| fantasy | name + handle | PASS (2 reviewers, 8.06): Page & Lantern, @PageAndLantern. Outside review pending, done with the branding set | reviews/brand/fantasy-name-2026-11-17.md |
| worship | name + handle | PASS (2 reviewers, 8.0): Prayer Pastures, @PrayerPastures. Outside review pending, done with the branding set | reviews/brand/worship-name-2026-11-17.md |
| fantasy | About | PASS 8.43 (internal); outside review pending | reviews/brand/fantasy-about-2026-11-17.md |
| worship | About | PASS 8.50 (internal); outside review pending | reviews/brand/worship-about-2026-11-17.md |
| fantasy | profile picture | FAIL 7.75 (s3); re-composed from s5 at zoom 1.5 (production/brand/candidates/pl_avatar_s5_z15.jpg), re-review pending | reviews/brand/fantasy-art-2026-11-17.md |
| fantasy | banner | FAIL 7.75 (lantern/book below the visible band); new banner art in GPU session 2a | reviews/brand/fantasy-art-2026-11-17.md |
| worship | profile picture | PASS 8.25 (s3); outside review pending | reviews/brand/worship-art-2026-11-17.md |
| worship | banner | FAIL 7.0 (text contrast, no sheep in phone crop); new banner art in GPU session 2a, stronger scrim | reviews/brand/worship-art-2026-11-17.md |
| both | watermark | not started | — |
