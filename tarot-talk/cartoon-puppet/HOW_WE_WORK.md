# How we work (keep this exactly; it is what got the animation to "good")

## Talking to the owner (Ashish; Sakshi runs the channel)

- **Writing:** plain, short wording; little formatting; all times in IST.
- **Show, don't describe:**
  - Every step sends pictures or a clip: a cast sheet plus a face close-up for a character, a contact sheet or short clips for a cut, the full mp4 at the end.
  - Send a short clip of exactly what changed, together with the full video.
- **One character or batch at a time:** wait for "ok" or "next" before moving on. When the owner says "redraw" or "looks AI", start again from research, not from small tweaks.
- **Paid credits:** before any voice test, ask how many voices, how many versions and what credit cap to use. Everything else costs nothing (code, local audio).
- **Spend less on ElevenLabs** (owner, 23 Nov 2026): 1 take per line by default, reuse every good line already made, and re-take or splice only the part that changed.
- **CTA is always link-based** (owner, 23 Nov 2026: "No cta shall have comments. All link based"). Never "comment karo <keyword>"; use "send to someone + guide on the link".
- **Script first, credits later** (owner, 23 Nov 2026): get the script strong and reviewed before asking about or spending voice credits. Each script needs a comic engine (a running situation such as Sakshi bargaining with Bhagwan), not a list of facts with jokes on top.
- **No "AI slop" rhythm in dialogue** (owner, 23 Nov 2026: the start-pause-continue tempo of each line felt like AI slop). Write lines as people really talk: full flowing sentences, no "Topic: fact. X? Y." bulletin pattern, no "…" pauses inside lines, no one-word rhetorical openers on every line. Let characters ask and interrupt each other. Voices: no pause tags, no ellipses in the voice text, gaps between lines about 0.05–0.1 s, and interruptions may overlap slightly.
- **Voices: one take per speaker** (owner approved the Aries 2027 track, 23 Nov 2026: "works well"). Each character reads all of their lines in one eleven_v4 call (Hindi script, one emotion tag per line, `[pause]` between lines), 1 take. Split on silences, check with a transcript, gentle atempo (about 1.12–1.15) so the pace is about 3 words/s, squeeze pauses inside a line to about 0.16 s, gaps between lines 0.08 s, and a 0.3–0.4 s laugh beat only after punchlines. Example: `videos/2027-aries-draft/build_voices.py`. Cheaper and far more natural than one call per line.
- **Owner sign-off:** a finished reel needs it before posting. Raise risks plainly (film or song clips may get muted, a comedian's line in a deity's mouth, the CTA product must exist).

## HARD RULES: the three gates (owner, 24 Nov 2026, "add this as restriction and hard rule")

Nothing moves past a gate until it passes. No exceptions, no "small" changes that skip a gate.

**Gate 1: Theme (look of scenes)**
- Work out the theme from the repos we have before drawing: Lemo-Opuscar styles (`/home/claude/ext/lemo-opuscar`, MIT code; never copy its guides into our repo), p5.brush plates (`/home/claude/ext/p5plates`), and our own engine (`loc.js`, `loc_hd.js`, `engine.js`). Compare them, then pick per scene type.
- **Anything new = show several options first.** At least 3 rendered examples of a new theme or a new scene type, side by side at phone size, then wait for the owner's pick. Only then build forward.
- Approved theme (owner, 24 Nov 2026: "scene is very nice, the colour combination outstands both the cast; make new scenes like this"): **Silkscreen travel poster**. Flat inks, stepped sky bands, sun rings, lit and shade faces on hills, simple deodar trees and a roadside milestone. Reference scene: `cuts/ref_poster_portal.js` (render `out/test_portal_v9.mp4`). Gilded touches are allowed on deity moments. Shared code: `poster.js` (plate, portal, Vishnu ji's portal flight, keyframed arms, poster cards).
- **One locked scene per rashi** (owner, 24 Nov 2026: "No theme scene change for aries. Lock per rashi"). Aries = the hill road with the APRIL km-stone. Each new rashi gets its own plate in `poster.js`, shown as 3 options first (Gate 1).

**Gate 2: Cast (every new character, animal or prop that acts)**
- Build it from the repos we have and from the owner's reference art first (e.g. the folk ram `char_ram.js drawFolk` was matched to the owner's Lemo card). Research the real object or animal first.
- **Anything new = show several options first.** At least 3 rendered versions (sheet + face close-up), then the owner's pick, then build.
- It must sit in the approved theme: same ink weight, flat fills, palette that holds next to the scene.

**Gate 3: Review (every cut, every version, before it goes to the owner)**
- A fresh, strict reviewer agent that did not make the work, with the full checklist below. It extracts its own full-resolution frames (24+ across the clip) and 12 fps path grids of every moving thing. Contact sheets alone are not enough.
- Pass = 8/10 or more AND no fault in A (practicality). Fix, then re-review with the same reviewer. Never send the owner a version the reviewer has not seen, and say plainly when a polish tweak was added after the last review.
- Checklist (owner faults the old reviewer missed: a tree in the middle of the road, the ram walking through a milestone, Sakshi over-smiling and over-gesturing):
  - **A. Practicality and layout.** Everything stands on a surface it really could (trees on grass, stones on the verge, feet on the ground). Depth order is right. Nothing intersects or passes through anything. Scale fits the distance. Keep a 25 px or larger gap between separate things.
  - **B. Entrances and exits.** Nothing pops, teleports or starts mid-air. Every path makes sense (enter from off-frame, from behind something, or through a portal).
  - **C. Acting.** Proportional and motivated, judged like a film director. No gesture or expression just to show movement. Under-acting (a frozen, stiff body) also fails. Gestures point at what the line is about. A listener listens: hands at rest or loosely joined, a few small reactions only.
  - **D. Joints only.** No whole-picture slide, rotation or stretch (flying on a cloud is fine). Arms never pass through the body or head.
  - **E. Instagram.** Keep the top 250 px, the right 12% and the bottom 20% clear. At most 2 text items, readable on a phone. Captions only during real lines, and no half-sentences at a clip's edges.
  - **F. Polish.** Would it pass as a professional animated short?

## Where files go (stay in this tight place)

| What | Where |
|---|---|
| A video's script package, `video.json`, `captions.json`, `sfx_cues.json` | `tarot-talk/videos/<slug>/` |
| Its film (shot list + its own graphics) | `tarot-talk/cartoon-puppet/cuts/<slug>.js` |
| A new character | `tarot-talk/cartoon-puppet/char_<id>.js` + `cast_<id>.js`, plus a row in `CHARACTERS.md` |
| A new location | a function in `tarot-talk/cartoon-puppet/loc.js` (terrace, office, court, park, cloud study) or `loc_world.js` (world tour: space, Alps, city, Dubai, Taj Mahal, Eiffel Tower, Indian temple town) |
| Meme lines and trending sounds (shared, reusable) | `tarot-talk/assets/audio/memes/` + a row in its `catalog.json`; the video's `video.json` lists the ones it uses |
| Scratch, renders, check stills | `cartoon-puppet/work/`, `out/`, `cast/` (git-ignored; never commit them) |

Write nothing anywhere else in the repo. Other folders belong to other roles (`team/roles.json`); message that role instead.

## The batches and gates

1. **Batch 1, cast:** sheet and close-up per character, then owner ok, then independent review of 8/10 or better.
2. **Batch 2, locations and rough cut:** the full cut on the real voice track, `prop_gate.js` PASS, a contact sheet of about 20 stills to the reviewer, then the owner.
3. **Viral audio:** original meme lines and trending sounds, each clip transcribed before use.
4. **Batch 3, acting and final:** faces from `act.js`, body business in the shots, music bed, -14 LUFS, final review, owner sign-off.

**Independent reviewer:** see HARD RULES Gate 3 above; it overrides this paragraph where they differ. A fresh agent that did not make the work. Give it the PNG paths, what the beat is, and the rules below. Ask for scores out of 10, then blocking fixes, then ranked polish, in under 350 words. Fix, then re-score; the target is 8/10 or better with nothing blocking. Do not count owner-approved choices against the score; tell the reviewer what they are.

Reviewer prompt that worked:
> You are an independent art director reviewing <what>. You have NOT seen how it was made. Be strict and specific.
> Style target: #MythologyWithHumor chibi deity reels (thick dark ink, flat fills, one soft shade, big heads, readable at phone size); reference image /path/ref.png.
> Look at: <png paths + what each shows>. Owner rules: <the rules below>. Owner decisions not to count against the score: <list>.
> Give a score out of 10 for each item and overall, then a ranked list of concrete problems (which picture, which tile, what is wrong, how to fix). Under 350 words. Do not edit files.

## Owner rules (all are standing)

**Drawing**
- **Code only.** No image or video model, no GPU, no frames through chat (render stills and check them). Never generate one picture and cut it up.
- **Joints only.** Characters move through their own joints, never by sliding, hopping, rotating or stretching the whole picture, and never by warping. Shoulders melt into the torso; no bolted SVG joints.
- **Toon hands** (owner, 23 Nov 2026: Monty's hands looked faulty, then 'why blobby'). The palm and three short fingers form one clean outline with scalloped tips, plus a smooth thumb (engine `handStyle: 'chubby'` → `toonHand`). No knuckle bumps, no spread spidery fingers, no shapeless mitten.
- **No robotic motion** (owner: 'why robotic joints? blend them, animate them better'). Elbows are rounded bends in the engine. Key poses blend through the joints (`seq` in the cut: starts 0.15 s early, eases over 0.45 s, with a blink through face changes). Never snap a pose; check a 1/24 s strip of a transition before showing.
- **Hands never grip props.** Props float by magic with a glow, or are fused into a closed fist. Fingers are short, chubby and cute, never spidery or symmetric.
- **Research real objects before drawing them** (search what they look like). No real brand logos (use a TT badge).
- **Indian look**, never East-Asian. Avoid the "AI look": anime sparkle eyes, perfect symmetry, generic stock vector style. Match the reference style instead.

**Deities**
- **Kind faces for deities** (owner, 23 Nov 2026: Vishnu ji's cover face "looks evil smiling"). Never half-closed lids with a side glance, never one brow up with a sly smirk: together they read as smug or evil. Use open eyes with level brows and a big smile, or the happy closed-eye smile; teasing comes from the head tilt and a raised pair of brows, not narrowed eyes.
- **Respect.** Shani dev never looks into the lens, never mocked, no feet toward the camera, trishul upright and never pointed. Vishnu ji is never the butt of the joke. Meme sounds land on the comic lead.

**Acting**
- **Faces must be active and catchy:** lip-sync on every line, blinks, eye darts, brow pops, head nods, talking gestures, a small punch on every cut.
- **Change the expression on the phrase** (owner, 23 Nov 2026: "very least expressive"). Each beat gets its own face and changes with what is being said: Monty reacts while listening; Sakshi teaches with different cute faces line by line. Default poses for a whole beat are not enough.
- **Few winks** (owner: "too much one eye shutting"): at most one wink per reel; use raised brows, laughs, pointing and posture instead.
- **Numbers on screen:** show the maths from the birthdate itself (date → digits, month → number, year → digit, each labelled underneath), so viewers can work out their own. Keep the "PERSONAL YEAR 2026/2027" header on the board the whole time, switching at the year flip.
- **Board timing:** sync every number on the board to the spoken word (transcribe the line with find_phrase.py and use its word times), so viewers see each number as it is said.
- **No repeated lines:** check that the end of one voice line doesn't repeat the start of the next (e.g. "Uska 9. Uska 9."). Trim the take instead of re-generating.
- **Music must be strong:** use the beat kit in make_music.py (`beat` / `sadpad` / `drop`, levelled by `music_rms_db`). The bed should sit about 5 dB under the voice and duck about 9 dB under speech. The old tabla groove alone read as weak.
- **Sakshi never jerks her head on syllables** (owner: "just twitching her head"). act.js gives her a slow small sway only; the emotion is carried by brows, lids, blush and mouth, with a happy-eye smile in the pauses.

**Staging (owner, 23 Nov 2026)**
- **Mol-bhaav rashi series is the exception: ONE locked scene per rashi** (owner, 24 Nov 2026: "No theme scene change for aries. Lock per rashi"). See Gate 1. Everything else: **no repeated single scene.** The owner rejected one location for a whole reel. Give each topic its own place (e.g. the Aries world tour, with a cloud-wipe 'flight' between places) and change the framing every beat.
- **Detailed, true-to-life backgrounds** (owner, 23 Nov 2026: "true copy of the desired location… give attention to minute objects too"; chose code-only over an image model). Research each landmark's real parts and draw them all (`loc_hd.js`), then add small life: people in Indian clothes, lamps, benches, birds, flowers, inlay work, boats, cabs, fountains, plus a few moving bits.
- **Show the deity's supremacy:** the deity floats on his cloud bigger than the world landmark behind him, calm and smiling. In close-ups the landmark sits beside him, not hidden behind.

**Layout**
- **Instagram safe zones:** captions at about 72–75% of the height; the right 12% and bottom 20% stay free of key items; one full-width card per beat.

**Proportions**
- Consistent between characters in a shot (`prop_gate.js`).

**Audio**
- **Meme lines always use the original voice clip, never re-voiced by our cast** (owner, 23 Nov 2026). Normal lines stay our cast. Add trending meme sounds in gaps. Look in `assets/audio/memes/catalog.json` first.
- **Prefer creator meme clips over film dialogue.** The owner dropped the Vivah "Jal lijiye" and SRK "Picture abhi baaki hai" clips (23 Nov 2026). A film clip goes in only when the owner asks for it (24 Nov 2026: Paresh Rawal's "Arey Deva, ye gadbad hai baba"; the whole line is his, so never split it into clip + our voice). Flag the Instagram mute risk once.
- **Deities may lip-sync a playful male meme line** ("Ab tu gaya beta", Sakshi's ask, 23 Nov 2026), aimed at Monty. Never a woman's line or a film *clip* on a deity. A famous film line *re-worded in our own voice* is fine when the moment needs it (owner, 24 Nov 2026: Vishnu ji's "Tension lene ka nahi, wakeel saahiba", Munna Bhai).
- **The deity leads, the girl assists** (Sakshi, 23 Nov 2026: "God wali zyada achhi lagti thi"). Vishnu ji explains and carries the expressions and jokes. Sakshi is the assistant who brings cards and reacts, and she does only the CTA (deities never sell). Every reel needs real gags for Monty, not a lesson with jokes on top.
- **Mol-bhaav content comes from the real planet shifts** (owner, 24 Nov 2026: v11 was "too job centric" and "scripted"). Each bargain = one real 2026→2027 change for that rashi (Shani, Guru, Rahu-Ketu, the rashi lord's retrograde), checked on Lahiri sources, with a practical takeaway. No invented month windows.
- **Complete clear sentences** (owner, 24 Nov 2026: "Script shall not be play pause"). Every line is one or two full sentences; no clipped lists or one-word answers.
- **Mol-bhaav rashi series cast** (owner, 24 Nov 2026: "Remove Monty and Shani ji, keep it just God and Sakshi"). Only Vishnu ji and Sakshi on screen. Sakshi is the rashi's wakeel and haggles; Vishnu ji decides with one advice line per round. Shani dev is named with respect, not shown. Complaints are acted by small doodles, not extra characters. Script and template: `videos/molbhav-aries/SCRIPT.md`.
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

## Free voices when the owner says "no credits" (24 Nov 2026)
- Kokoro-82M (Apache-2.0, local CPU, no account): Vishnu ji `hm_psi` (tempo 1.06, −0.6 st), Sakshi `hf_beta` (tempo 1.10). Feed the lines in Devanagari. A 92 s reel builds in about a minute. Script: `videos/molbhav-aries/build_voices.py` (model files: kokoro-onnx releases, model-files-v1.0, kept in `work/tts/`, never committed).
- Piper Hindi voices (pratham, priyamvada, rohan) are non-commercial licences: do not use them for the channel.
- Meme clips can be baked straight into the voice track by the voice script (cue-sheet rows `meme:<file>`, who = the character who lip-syncs). `meme_lines` then stays empty.
- Every Vishnu ji pose in a cut goes through a kind-face filter (open lids, level raised brows, no 'sly'/'cat' mouth, no wink, small glance). See `kindV` in `cuts/molbhav-aries.js`.

## Mol-bhaav rashi series: what the owner taught us (24 Nov 2026, Aries reel final = `out/molbhav-aries_v10.mp4`, commit 42ab96f)
### Status (updated 26 Nov 2026, 15:30 IST)
| Rashi | Scene (locked) | Script | Cut | Next |
|---|---|---|---|---|
| Aries (Mesh) | hill road, `plateAries` | v13.2 | final `out/molbhav-aries_v10.mp4` (ElevenLabs, 1,915 credits) | posted/owner's call |
| Taurus (Vrishabh) | Jaipur, Hawa Mahal across the bazaar, `plateTaurus` | **v4** `videos/molbhav-taurus/SCRIPT.md` (90 s: 2027 catches + report/healing pitch; v3.1 kept as `SCRIPT_v3.1.md`) | `out/molbhav-taurus_v4.mp4` (88.7 s, ElevenLabs Samar/Lalita, 1,583 credits), Gate 3 PASS 8/10 | owner sign-off; polish left: Sakshi's body movement |
| Gemini onward | not started | | | follow the procedure below |

Not in git on purpose: `out/`, `work/`, `cast/` (renders, option sheets) and voice tracks that contain original meme audio. Rebuild a voice track with the video's `build_voices.py`.

### Procedure for the next rashi (what worked on Taurus, in order, each step gated)
1. **Facts first.** Search Lahiri dates for the rashi's Moon sign: Shani, Guru (incl. retro hops), Rahu-Ketu (5 Dec 2026 change), the rashi lord's vakri periods, Sade Sati / dhaiya. Count houses from the Moon sign. Report them to the owner with a script plan before building anything.
2. **Script** with the script-to-video skill, saved as `videos/<slug>/SCRIPT.md` (facts, engine, film lines with their need, memes, numbered lines, cards, risks, review log). Shape since 25 Nov: 2026 complaint → bargains where every "yes" carries the honest 2027 **catch** (problem) → Vishnu ji's calm remedy → verdict → **Sakshi's pitch** ("ye poori rashi ka hisaab hai; aapki kundli mein kitna asar, wo personal 2027 report batayegi; healing se taiyari abhi") → owner's CTA. Fresh script reviewer (script doctor + facts + sensitivity + urgency), 8/10 to pass, then the owner's ok. Length: the owner wants **90 s max** (26 Nov 2026 14:45 IST): about 270–280 spoken words at ~3.4 words/s with ElevenLabs, 2 memes.
3. **Scene: 3 options** in the silkscreen poster theme at a location never used before in the series (Aries hill road, Taurus Jaipur Hawa Mahal; no crop fields). Render each with the portal, Vishnu ji and Sakshi in place at phone size. Owner picks; then redraw the pick in detail (real landmark research, small life, Lemo technique) and move it into `poster.js` as `plate<Rashi>`.
4. **Cast:** none to build (Vishnu ji + Sakshi). Ask before adding any animal.
5. **Voices (free first):** copy `videos/molbhav-taurus/build_voices.py`, replace `SCRIPT` (id, who, roman text, Devanagari text, gap; meme rows from the catalog). Kokoro models: `work/tts/` (download `kokoro-v1.0.onnx` + `voices-v1.0.bin` from github.com/thewh1teagle/kokoro-onnx releases, `pip install kokoro-onnx soundfile --break-system-packages`). Run it, then `python3 tools/new_video.py <slug>`. Transcribe every line (faster-whisper small, pad 0.5–1 s) before building on it.
6. **Cut:** copy `cuts/molbhav-taurus.js` (no ram, Jaipur plate, soft-pop verdict card). Rewrite `vR`, `VF`, `laughs`, `KFK`, `kArmKeys`, `ROWS`, memes/doodles and `cards()` for the new beat ids. Contact sheet of ~22 stills at key beats first (`--stills=`), fix, then `bash make_reel.sh <slug>` (~19 min with the paper-grain plate; run it in the background with a 40 min timeout).
7. **Gate 3** with a fresh reviewer (prompt pattern in this file), resume the same reviewer for re-checks. Fix only what changed with `tools/seg_render.js` + `tools/splice.sh` (about 3 min instead of 19).
8. Send the mp4 to the owner, commit (`[tt:production] …`), `team.py status` + `team.py sync`, and log reviews in `videos/<slug>/reviews/`.

**Script**
- Vishnu ji "maze leta hai" like Akshay Kumar's Krishna in OMG: calm, smiling, cheeky, always one step ahead, chakra twirled on a fingertip like a keychain on his first line. Vibe only, no likeness or voice. He teases habits and drama, never anyone's pain or loss.
- Bollywood lines only where the moment needs them ("Don't push dialogues. Make safe space and logical need"); mould the script around them. Never a line over a fact; the fact is always said plainly first. Aries used 3: Munna Bhai (calming her panic), Damini "tareekh pe tareekh" (a wakeel told to wait till April), Dabangg twist on Sade Sati.
- Fact care: Sade Sati phases (Aries Sade Sati began Mar 2025; Jun 2027 is the first knock of the heavy middle phase), say a planet's window from today's position ("January ke aakhir se June tak"), dates as "10 January" in captions.
- Meme placement the owner fixed: FAAAH right after the share falls (−40% card), "Arey Deva, ye gadbad hai baba" right after the Shani explanation, "Abhi maza aayega na bhidu" right after "Isiliye toh mol-bhaav ho raha hai".
- **Create urgency for a consultation** (owner, 25 Nov 2026 06:06 IST: Taurus v2 "did not create urgency… We need some problems too, so we can pitch them solution with reports and healing"). Every bargain names the real 2027 catch for that rashi; Sakshi alone pitches the personal 2027 report + healing before the deadline month (Taurus: June, Sade Sati). Honest and calm: effects as "Vedic maanyata mein… asar daal sakte hain", healing as "taiyari", never a promised result or a health claim, no fear words. Vishnu ji never sells. The link must really offer the report and healing booking.
- Ending: a wakeel's verdict that maps every demand truthfully (KAAM / GHAR / RISHTA / SADE SATI rows + a stamp on the last words). "Ek haan, ek aadha haan" did not work.
- CTA (Sakshi alone): "2027 ko manifest karna hai toh link pe click karo, aur ye video us dost ko bhejo jo isse relate karega."
- CTA from Taurus on (owner, 24 Nov 2026 23:22 IST): "2027 ko manifest karna hai toh link pe click karo, aur ye video usko bhejo jisse apna 2027 jaanna hai." Verdict ends "Touchwood to <rashi>!" (not "<rashi> jeet gaye").

**Staging and look**
- **Taurus = typical Jaipur** (owner, 24 Nov 2026 23:48 IST: "Add a typical Jaipur Rajasthan theme"). Options v4 in `work/taurus/plates4.js`: Hawa Mahal street, Amer Fort over Maota Lake, Jal Mahal at dusk. Aries layout kept (portal 310/545/245, Sakshi 730/1352).
- **Every rashi gets a different location** (owner, 24 Nov 2026 23:22 IST: "different location than other molbhav scenes"; 23:40: "Leave fields"). Aries = hill road. No crop fields or rural grass for Taurus; options v3: haveli courtyard, Yamuna ghat, Pichola lakeside (`work/taurus/plates3.js`).
- **The rashi animal is life-size** (owner, 24 Nov 2026 23:40 IST: bull "too small to be realistic, at least size of Sakshi"). A full side-on bull and Sakshi do not fit side by side in 1080 px, so use depth: the animal in front (feet y 1515, s 0.96, tail end touching the left edge), Sakshi a few steps back (feet y 1330, s 0.42, x 768), portal higher and smaller (PX 300, PY 440, r 190). Measured: bull 515 px tall vs Sakshi 509 px, 30 px gap, Sakshi inside x 949. No fact stone at this size; dates go on the cards. Check gaps with `work/taurus/bbox.js` (pixel bounding boxes).
- **Theme sources, checked 24 Nov:** Lemo-Opuscar silkscreen-poster (technique only, never its guides in our repo): stepped skies with thinning stripes, layers a few px off register, paper grain + mottle (multiply), accent ink kept rare. Remotion: `@remotion/noise` (installed in cartoon-puppet) drives small living bits so they never loop visibly. p5.brush: WebGL browser-only and its pencil/watercolour look does not suit silkscreen, so it is not used. Option code: `work/taurus/plates2.js` (moves into `poster.js` once picked).
- **No rashi animal by default** (owner, 24 Nov 2026 23:48 IST: "Do we really need a bull?", then dropped it). Only Vishnu ji and Sakshi; her "client" is the rashi's people. Ask before adding an animal. If one is ever used, the two rules below apply.
- **The rashi animal is natural, not funny** (owner, 24 Nov 2026 23:22 IST: "keep him natural, natural joints, realistic, not funny"). Real anatomy and real movement: `char_bull.js` (Kankrej / Gir / Ongole zebu; walk LH-LF-RH-RF; lies down front knees first, rises hind first; body speed equals hoof stance speed so hooves never skate). Comedy stays in the dialogue, never in the animal's face or body.
- One locked silkscreen-poster scene per rashi; Vishnu ji comes out of the spark portal when Sakshi says "Prabhu" (curved flight, waist lean, clipped to the ring while inside) and goes back after his last line. Sakshi grounded on the right verge with a shadow. The rashi animal is her client and acts physically (Aries ram trots to the APRIL km-stone and brakes on "jo ruk gaya").
- One poster card per beat in the top-right card area (x 590–942, y 270–~730). Any list on screen must be completely filled (owner: "the list was long but not filled completely").
- Practicality first: nothing stands on a road, nothing passes through anything, real sizes for distance, 25 px gaps.

**Acting**
- No overacting, no gesture just to show movement; a listener's hands rest loosely together at the waist. Under-acting (frozen) also fails.
- Faces are keyframed and blended per beat (`blendF` + `VF` / `KFK` in the cut) using BOTH lids (`lid`, `lidLow`), brows, gaze and tilt (owner: "eyes always wide open, unrealistic"). Vishnu ji: brows always level, lid ≤ 0.2 except laughs (happy closed eyes), so he never reads smug.
- Meme lines are Sakshi's thoughts: a thought cloud with our own doodle pops up on her right, her eyes go up into it, she does NOT lip-sync (cue-sheet `who = Meme`), cards hide meanwhile (owner voice note).
- Sakshi's hands: chubby toon hands; on a raised open palm the thumb is on the upper, body side. Check with a close-up render (`work/palm_test2.js` pattern) before trusting it.

**Voices with ElevenLabs (when the owner allows credits)**
- Taurus v4 (26 Nov): `videos/molbhav-taurus/build_voices_el.py` is the current template. Price first with `creative_generate_speech(estimate_only=true)`, one flow (`creative_create_flow`), `generations_count: 1`, download from `creative_get_generations` → `full_res_url`. Cut points from faster-whisper word times (silences inside lines are as long as between lines); verify every line by transcript and fix edges that leak a word into the next line. Tempo 1.17–1.19 gave 3.4 words/s and 88.7 s.
- Ask the cap first. Cost is about 1 credit per character INCLUDING tags. Use paragraph breaks instead of `[pause]` tags between lines to save credits.
- One `eleven_v4` take per speaker for all their lines (Samar `KWuQEGxZQtpWhRutt6g6` = Vishnu ji, Lalita `hHyd5z9VxRT4YKoDwPRl` = Sakshi), one emotion tag where the delivery changes, Devanagari text. Aries cost 1,915 credits.
- `videos/molbhav-aries/build_voices_el.py` cuts the takes per line (word timestamps, snapped to the quietest point), sets per-line tempo (target 2.8–3.5 words/s), inserts a 0.4–0.5 s beat before punchlines, then splices memes and writes the usual cue sheet / script.json / captions.
- Whisper can drop a word's first consonant when a clip has no lead-in silence; pad 0.5 s before judging.

**Bugs that cost time**
- ffmpeg `atrim` keeps the source timestamps, so a later `afade=out` fires early and mutes the clip. Always `atrim=…,asetpts=PTS-STARTPTS,afade…`.
- A face param that act.js also drives (mouth while talking, happy-eye in pauses) overrides the cut; mark meme rows as `Meme` instead of freezing the clock.

**Taurus craft notes (25 Nov 2026)**
- A card that pops near Sakshi's head must use `{ soft: true }` in `card()` (no overshoot); the overshoot of the default pop crossed her bow by 3 px.
- Check gaps by pixels, not by eye: render each element alone with a transparent background and compare bounding boxes (`work/taurus/bbox.js` pattern).
- Bigger text on a card pushes into icons: re-check every card after any font change. Card footers are 18 px.
- `tools/new_video.py` KEEPS existing `captions.json`, `video.json`, `sfx_cues.json`: after re-voicing, delete `captions.json` first or the captions stay on the old lines (cost us a contact sheet on 26 Nov). `video.json` music times use beat ids: recompute them after a re-voice.
- Kokoro can stutter on "aap abhi" (heard as "aap aap aap hi"); reword ("aap aaj hi").
- Kokoro mispronunciations are invisible to the reviewer; Whisper often misses fast "do hazaar sattaais"; check energy instead of trusting a missing transcript.

**Reviewing**
- Resume the same Gate-3 reviewer for re-checks (it remembers its own measurements). The reviewer cannot hear tone: ask the owner to listen once.

