# Gates

G1–G5 are passed only by the independent `reviewer` role with a saved review file
(docs/quality-bar.md: measured checks + 3-competitor benchmark + rubric, average ≥ 8, none < 7).
The owner never judges taste; the owner gives only the final publish "go" after G6.

Every video card moves through stages. A stage can only be entered when the gates
before it have **passed** (`agent.py move` enforces this).

| Stage → | Needs gates passed |
|---|---|
| `idea` | — |
| `concept` | — |
| `assets` | G0 |
| `render` | G1, G2, G3 |
| `package` | G4 |
| `ready` | G5 |
| `published` | G6 |
| `measured` | G7 |

## G0 — Concept (signed by orchestrator)
- Scene is a different place / light / season from every published video of the channel.
- Keyword checked against live YouTube results (≥ 2 videos from channels < 100K subs
  with ≥ 100K views in the last 12 months, like-rate ≥ 1%).
- No IP names. No medical or "healing" claims in the title.

## G1 — Still image
- 3840×2160 (or 1920×1080 minimum, upscaled cleanly). No AI artefacts: hands, faces,
  text, warped architecture, melted objects. Checked at 100% zoom by the reviewer.
- Elements that will move (animal, fire, window) are generated as **separate layers**
  or have clean masks — never cut from one composite.

## G2 — Motion
- 60 s test loop reviewed by the reviewer. Living elements move through their joints
  (breathing, ear flick, page turn) — no whole-picture slide / rotate / stretch.
- Seamless loop: no visible jump at the seam (play seam 10× back to back).
- 3+ ambient layers. Motion is slow: nothing that would wake a sleeper.

## G3 — Music & sound
- 45–60 min of unique music, ≥ 8 distinct tracks, crossfaded; set then repeats.
- Measured with the listen-by-measurement skill: integrated loudness −18 to −16 LUFS
  (fantasy) / −20 to −18 LUFS (worship), true peak ≤ −1 dBTP, no clipping, no
  track > 10% louder than the set median, no harsh 2–5 kHz peaks.
- Ambience beds are real CC0 recordings (Freesound CC0 or own), never synthesised
  crackle/rain. Licences recorded in the card's `licenses`.
- Music licence recorded (ACE-Step 1.5 output: MIT/Apache, commercial use allowed;
  local piano renders: own work; public-domain hymn melodies: name + year).

## G4 — Render QA
- Full-length render plays start→end; spot checks at 0:00, 25%, 50%, 75%, end.
- A/V sync, no silent gaps > 1 s, no loop seam pops. File ≤ 1080p60 or 4K30, H.264 high,
  AAC 320k.

## G5 — Package
- Title ≤ 70 chars, pattern per CHANNEL.md, scored against 3 competitor titles.
- Thumbnail 1280×720, readable at 160 px wide, no tiny text, matches the video's scene.
- Description with chapters, credits/licences, AI-use note. "Altered or synthetic
  content" disclosure ticked whenever a scene could be mistaken for real footage.

## G6 — Publish (signed by orchestrator, then owner's one-line "go")
- G1–G5 passed by the reviewer, each with a review file. Upload slot respects pacing (≤ 1 per 2 days during pilots).
- Made-for-kids: **No**. Category: Music. Language: English.

## G7 — 21-day review
- Record at day 7 and day 21: views, like-rate, average view duration, returning
  viewers, subs gained, CTR. Decide: double down / adjust / drop the theme.
