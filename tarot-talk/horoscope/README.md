# Horoscope videos

Daily horoscope videos for Tarot Talk By Sakshi, made in code: no GPU, no paid service, and no AI tokens spent on frames. The method lives in the `daily-horoscope-video` skill; this folder holds the scripts and sample files.

Status (21 Nov 2026): the owner approved v2 of the one-video-per-sign format (Tula, Hindi, 21 Nov): everyday Hindi, seven life areas with 3D scenes, a remedy, an ElevenLabs Hindi voice. `sign2_video.py` is the current look; `sign_video.py` is the older v1 look.

## Folders

- `pipeline/` - the scripts
  - `sign_audio.py`, `sign_video.py` - one vertical video per sign (about 26 s). `sign_audio.py` needs `daily_audio.py` beside it.
  - `daily_audio.py`, `daily_video.py` - one combined video for all 12 signs (about 62 s).
  - `frames.js` - captures frames from the page with headless Chrome.
- `samples/`
  - `request.sample.json` - what the scheduler or dashboard sends (dates, target country, language, output type).
  - `result.sample.json` - what a finished job writes back for the dashboard to read.
  - `sign_reading.sample.json` - the script for one sign (Aries, 22 Nov 2026).
  - `daily_reading.sample.json` - the script for the combined 12-sign video.

## Weekly run (current format, Sakshi's choice)

Same three steps as below, with a week:
1. `python3 pipeline/sky.py 2026-11-23 2026-11-29` adds Moon by day and good/care/stop days per rashi (Moon gochar from the rashi: good 1,3,6,7,10,11; stop 4,8,12).
2. `week.json` (see `samples/week.sample.json`): `date_from`, `date_to`, and per sign the daily fields plus `hooks`: 4 to 5 mood hooks `[after, tone, voice, line1, line2, picture]`; `after` is hook, meters, days, an area key or remedy; `tone` is serious, fun, encouraging, happy or sad; `picture` (optional) is a name from `assets/fe/NAMES.txt`. Lucky third value is the best day.
3. `XI_API_KEY=... python3 pipeline/make.py week.json out` (`--dry` shows new voice characters; `XI_MAX_CHARS` caps a run, default 1500).

Generated for the week: the days shot (7 coloured day chips, voice naming the good and careful days), "इस हफ्ते" labels, weekly cover (date range, day strip), CTA for next week. About 85 s per rashi, about 950 voice characters (about 380 credits) for a fresh sign.

## Daily run (current, least tokens)

1. `python3 pipeline/sky.py 2026-11-22` prints about 20 lines: planet signs, Moon change, coming sign changes, and the house of every planet from each rashi. No web search needed.
2. The agent writes one short `day.json` for all signs (see `samples/day.sample.json`): per sign a hook, 4 scores, 7 life areas (voice line, screen line, stamp, mood), a remedy and lucky colour/number/time. Score, lucky and CTA voice lines, word landing points, date and rashi labels are generated. Force a landing word with `text|3` only if needed.
3. `XI_API_KEY=... python3 pipeline/make.py day.json out` does everything else per sign: voice (shared cache in `~/.cache/horoscope-voice`, so a repeated sentence is never paid twice), timeline, page, frames in 3 parallel parts, `<date>_<sign>.mp4`, `_voice-only.mp4`, `_cover.jpg` (first frame: date, rashi, caution, scores, good areas), loudness and duration checks, `result.json`. One line printed per sign. `--only=tula,mesh` for some signs, `--sheet` for a contact sheet when the look changes.

About 150 s per sign on the workspace; 0 credits when every sentence is cached, about 230 credits for a fresh sign.

## How a run works (v1)

1. An AI session writes one `reading.json` per sign (hook, reason, scores, do and don't, lucky, call to action). This is the only step that needs AI.
2. `python3 sign_audio.py <folder> <piper voice .onnx>` makes the voice, `timeline.json`, music, sound effects, `audio.wav` and `audio_nomusic.wav`.
3. `python3 sign_video.py <folder>` makes `sign.html`.
4. `node frames.js <folder>/sign.html <out> 30 1080 1920` captures the frames.
5. ffmpeg joins the frames with `audio.wav` (and again with `audio_nomusic.wav`, for adding an Instagram library track when posting).

Steps 2 to 5 are plain scripts and can run on the PC without an AI session.

## Needs

- Python 3 with `piper-tts`, `numpy`, `scipy` (and `pyswisseph` for the sky calculation)
- A Piper voice file (the test used `en-us-lessac-medium` from the Piper GitHub release v0.0.2)
- Node with `puppeteer-core`, Google Chrome, ffmpeg
- Fonts: Anton, Poppins, DejaVu Sans

## Known gaps

- `frames.js` loads `puppeteer-core` from this folder's `node_modules` (run `npm install` here); the Chrome path is still the Linux one, change it for the PC.
- Only Aries has its real constellation shape in `sign_video.py` (`CONST`).
- Hindi uses the ElevenLabs shared voice Anika (Sweet, Lively and Warm). Sakshi's own voice is still the target.
- The scheduler and dashboard connection is not built; nothing here touches the dashboard.
