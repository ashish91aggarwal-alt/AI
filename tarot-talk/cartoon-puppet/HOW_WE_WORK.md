# How we work (keep this exactly; it is what got the animation to "good")

## Talking to the owner (Ashish; Sakshi runs the channel)

- **Writing:** plain, short wording; little formatting; all times in IST.
- **Show, don't describe:**
  - Every step sends pictures or a clip: a cast sheet plus a face close-up for a character, a contact sheet or short clips for a cut, the full mp4 at the end.
  - Send a short clip of exactly what changed, together with the full video.
- **One character or batch at a time:** wait for "ok" or "next" before moving on. When the owner says "redraw" or "looks AI", start again from research, not from small tweaks.
- **Paid credits:** before any voice test, ask how many voices, how many versions and what credit cap to use. Everything else costs nothing (code, local audio).
- **Owner sign-off:** a finished reel needs it before posting. Raise risks plainly (film or song clips may get muted, a comedian's line in a deity's mouth, the CTA product must exist).

## Where files go (stay in this tight place)

| What | Where |
|---|---|
| A video's script package, `video.json`, `captions.json`, `sfx_cues.json` | `tarot-talk/videos/<slug>/` |
| Its film (shot list + its own graphics) | `tarot-talk/cartoon-puppet/cuts/<slug>.js` |
| A new character | `tarot-talk/cartoon-puppet/char_<id>.js` + `cast_<id>.js`, plus a row in `CHARACTERS.md` |
| A new location | a function in `tarot-talk/cartoon-puppet/loc.js` |
| Meme lines and trending sounds (shared, reusable) | `tarot-talk/assets/audio/memes/` + a row in its `catalog.json`; the video's `video.json` lists the ones it uses |
| Scratch, renders, check stills | `cartoon-puppet/work/`, `out/`, `cast/` (git-ignored; never commit them) |

Write nothing anywhere else in the repo. Other folders belong to other roles (`team/roles.json`); message that role instead.

## The batches and gates

1. **Batch 1, cast:** sheet and close-up per character, then owner ok, then independent review of 8/10 or better.
2. **Batch 2, locations and rough cut:** the full cut on the real voice track, `prop_gate.js` PASS, a contact sheet of about 20 stills to the reviewer, then the owner.
3. **Viral audio:** original meme lines and trending sounds, each clip transcribed before use.
4. **Batch 3, acting and final:** faces from `act.js`, body business in the shots, music bed, -14 LUFS, final review, owner sign-off.

**Independent reviewer:** a fresh agent that did not make the work. Give it the PNG paths, what the beat is, and the rules below. Ask for scores out of 10, then blocking fixes, then ranked polish, in under 350 words. Fix, then re-score; the target is 8/10 or better with nothing blocking. Do not count owner-approved choices against the score; tell the reviewer what they are.

Reviewer prompt that worked:
> You are an independent art director reviewing <what>. You have NOT seen how it was made. Be strict and specific.
> Style target: #MythologyWithHumor chibi deity reels (thick dark ink, flat fills, one soft shade, big heads, readable at phone size); reference image /path/ref.png.
> Look at: <png paths + what each shows>. Owner rules: <the rules below>. Owner decisions not to count against the score: <list>.
> Give a score out of 10 for each item and overall, then a ranked list of concrete problems (which picture, which tile, what is wrong, how to fix). Under 350 words. Do not edit files.

## Owner rules (all are standing)

**Drawing**
- **Code only.** No image or video model, no GPU, no frames through chat (render stills and check them). Never generate one picture and cut it up.
- **Joints only.** Characters move through their own joints, never by sliding, hopping, rotating or stretching the whole picture, and never by warping. Shoulders melt into the torso; no bolted SVG joints.
- **Hands never grip props.** Props float by magic with a glow, or are fused into a closed fist. Fingers are short, chubby and cute, never spidery or symmetric.
- **Research real objects before drawing them** (search what they look like). No real brand logos (use a TT badge).
- **Indian look**, never East-Asian. Avoid the "AI look": anime sparkle eyes, perfect symmetry, generic stock vector style. Match the reference style instead.

**Deities**
- **Respect.** Shani dev never looks into the lens, never mocked, no feet toward the camera, trishul upright and never pointed. Vishnu ji is never the butt of the joke. Meme sounds land on the comic lead.

**Acting**
- **Faces must be active and catchy:** lip-sync on every line, blinks, eye darts, brow pops, head nods, talking gestures, a small punch on every cut.
- **Change the expression on the phrase** (owner, 23 Nov 2026: "very least expressive"). Each beat gets its own face and changes with what is being said: Monty reacts while listening; Sakshi teaches with different cute faces line by line. Default poses for a whole beat are not enough.
- **Sakshi never jerks her head on syllables** (owner: "just twitching her head"). act.js gives her a slow small sway only; the emotion is carried by brows, lids, blush and mouth, with a happy-eye smile in the pauses.

**Layout**
- **Instagram safe zones:** captions at about 72–75% of the height; the right 12% and bottom 20% stay free of key items; one full-width card per beat.

**Proportions**
- Consistent between characters in a shot (`prop_gate.js`).

**Audio**
- **Meme lines always use the original voice clip, never re-voiced by our cast** (owner, 23 Nov 2026). Normal lines stay our cast. Add trending meme sounds in gaps. Look in `assets/audio/memes/catalog.json` first.
- **Prefer creator meme clips over film dialogue.** The owner dropped the Vivah "Jal lijiye" and SRK "Picture abhi baaki hai" clips (23 Nov 2026).
- **Deities never lip-sync a meme clip.** If a clip in someone else's voice plays, keep the deity off screen in that beat (a woman's film line with Vishnu ji on screen reads as his voice).
- Clips are saved once in `tarot-talk/assets/audio/memes/` (with `catalog.json`) and reused. Check the catalog before searching the web.
- Our own SFX and music are synthesised (no paid music).

## Lessons that cost us time (don't repeat)

- **Hands and props:** gripping hands looked blobby or scary every time; floating props fixed it.
- **Monty:** spikes all the time killed his fear face; spikes only in shock.
- **Shani's eyes and mouth:** blobby eyelids and a round "blob" mouth were rejected. Thin crisp lash lines, an angular trapezoid mouth with teeth.
- **Brahma:** looked Chinese. Rebuilt on the approved Vishnu body with an Indian look.
- **Sakshi:**
  - Anime eyes read as "AI": matched the reference style instead.
  - The braid was disliked, so she has a ponytail.
  - The lehenga was disliked: a modern outfit.
  - Fairer skin.
- **PVR tub:** drawn without research, rejected. Always search first.
- **Small graphics:** small cards and text in the bottom zone failed the review; one big card per beat.
- **Meme clips:** many meme buttons online are mislabelled. Always transcribe. `find_phrase.py` now decodes with ffmpeg (the installed PyAV broke on mp3).
- **Generic reels:** for a single standalone reel the owner wants a general example (unnamed "WOH / TUM" cards), not named side cast, and a CTA of "send it to someone who needs it + the guide link".
