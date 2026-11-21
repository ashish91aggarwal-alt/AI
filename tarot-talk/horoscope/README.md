# Horoscope videos

Daily horoscope videos for Tarot Talk By Sakshi, made in code: no GPU, no paid service, and no AI tokens spent on frames. The method lives in the `daily-horoscope-video` skill; this folder holds the scripts and sample files.

Status (21 Nov 2026): the one-video-per-sign format has been built and shown for Aries only (English, Global). It is not yet approved by the owner. The voice is a free stand-in, not Sakshi's.

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

## How a run works

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

- `frames.js` has the workspace paths for `puppeteer-core` and Chrome written in; change them for the PC.
- Only Aries has its real constellation shape in `sign_video.py` (`CONST`).
- Hinglish and Hindi need a Hindi-capable voice.
- The scheduler and dashboard connection is not built; nothing here touches the dashboard.
