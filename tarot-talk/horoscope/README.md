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

## v2 run (current)

1. Write `<folder>/reading.json` (see `samples/sign_reading_v2_tula_hindi.sample.json`).
2. `XI_API_KEY=... python3 pipeline/sign_audio.py <folder> eleven:RABOvaPec1ymXz02oDQi` makes the voice through ElevenLabs (word times come from its timestamps; clips are cached and never paid for twice), the music and `audio.wav` / `audio_nomusic.wav`.
3. `python3 pipeline/sign2_video.py <folder>` makes `sign.html`.
4. `node pipeline/frames.js <abs folder>/sign.html <folder>/frames 30 1080 1920 <start> <end>` in two or three parallel parts, then ffmpeg with both audio files.

Never commit the ElevenLabs key; pass it as `XI_API_KEY`.

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
