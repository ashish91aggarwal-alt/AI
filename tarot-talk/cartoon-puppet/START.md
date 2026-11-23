# START HERE: make a new cartoon reel

For any new session. Read this file, then `HOW_WE_WORK.md` (the method and the owner's rules) and `CHARACTERS.md` (the reusable cast). `README.md` lists every file.

## 0. Session setup (2 minutes)

```bash
git pull --rebase
python3 tarot-talk/team/team.py start --role production
cd tarot-talk/cartoon-puppet && npm install
bash make_reel.sh 2027-warmup-mulank8      # proves the machine works: ~3 min, gives out/2027-warmup-mulank8.mp4
```

## 1. Put the new script package in place

Make `tarot-talk/videos/<slug>/` in the same shape as `videos/2027-warmup-mulank8/`:
- `script.json`: one entry per beat (`id, type, start, end, who, line, caption_chunks, picture, camera, sound`)
- `cast.json`: who is in it (reuse the ids `monty`, `vishnu`, `shani`, `brahma`, `sakshi` for existing characters)
- `voices/cue_sheet.csv` (`id, who, start_s, end_s, file`), `voices/lines/*.wav` and `voices/voice_track_timed.wav`

If the owner hands over a zip, unzip it into that folder. If there are no voices yet, ask how many voices, how many versions and what credit cap to use before generating any (ElevenLabs).

## 2. Scaffold (1 command)

```bash
python3 tools/new_video.py <slug>
```

This writes `videos/<slug>/video.json`, `captions.json`, `sfx_cues.json` and `cuts/<slug>.js`. The cut has one shot per beat with the speaking character already talking and lip-synced. It also says which speakers already exist in the library and which need a new character.

```bash
bash make_reel.sh <slug>        # first watchable skeleton on the real voice track
```

## 3. Make it good, batch by batch (each gated; see HOW_WE_WORK.md)

1. **Cast (Batch 1).** Only for characters not in the library: write `char_<id>.js` and `cast_<id>.js`, render the sheet and a face close-up, and get the owner's ok on each one. Then an independent review of 8/10 or better. Hook a new character into `kit.js` (a placement helper like `monty(...)`) and into `act.js` (its face controls).
2. **Locations and rough cut (Batch 2).**
   - Reuse `loc.js` (rooftop, office, court) or add new locations in the same style.
   - Turn every shot in `cuts/<slug>.js` into a real shot, following that beat's picture, camera and sound notes: location, pose index, placement and scale, camera (`cam` / `focus`), and graphics (`tag`, `pill`, `commentBox`, `rainCloud`, `bricks`, or your own).
   - `node prop_gate.js` must pass.
   - Review a contact sheet of about 20 stills with a fresh reviewer, then show the owner.
3. **Viral audio.**
   - Find original meme lines for any viral phrase in the script, and trending sounds for the reaction beats (`../viral-hooks/HOOKS.md`).
   - Check each clip with `python3 find_phrase.py <file> small`.
   - Add meme lines to `video.json` `meme_lines` (url, in, out, script-clock window they replace), sounds to `sound_files`, and placements to `sfx_cues.json`.
4. **Acting and final (Batch 3).**
   - Faces act automatically (`act.js`).
   - Add body business in the shots: prop lifts, slams, glows, shivers.
   - Set the music plan in `video.json` `music` (groove / pad / swell windows on the script clock).
   - Final independent review, then the owner signs off.

Check pictures any time without spending tokens on frames: `VIDEO=<slug> node render.js cuts/<slug>.js cast/chk --stills=12.5,40`, then look at `cast/chk_*.png`.

## 4. Deliver and save

- Send the mp4, plus short clips of anything that changed.
- Commit code and `videos/<slug>/` with a message starting `[tt:production]`. Never commit meme clips (`audio/memes/` is ignored).
- Run `python3 tarot-talk/team/team.py status ...` and then `sync`.
