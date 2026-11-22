#!/usr/bin/env bash
# One command, script package -> finished reel (Mulank 8 example). Needs node 18+, python3 (numpy, scipy), ffmpeg.
# Zero image/video models, zero GPU, zero tokens per frame. Takes about 3 minutes on 2 CPU cores.
set -e; cd "$(dirname "$0")"; mkdir -p out cast
[ -d node_modules ] || npm install --silent
bash fetch_clips.sh                       # original meme clips (see ../viral-hooks/HOOKS.md)
python3 ../viral-hooks/make_sfx.py        # our own synthesised SFX library
python3 build_voice.py                    # splice original meme lines into the voice track -> audio/voice_track_v3.wav + timeline_v3.json
python3 lipsync_prep.py                   # mouth/blink/brow drive data -> audio/lipsync.json
python3 audio/mix.py                      # voice + SFX + meme sounds -> out/mix_raw.wav
python3 audio/make_music.py               # original tabla/santoor/tanpura bed, ducked 8 dB under speech -> out/music.wav
python3 audio/final_mix.py                # voice mix + music at -13 dB, two-pass loudnorm to -14 LUFS / -1.5 dBTP -> out/mix.wav
node prop_gate.js                         # proportions gate (blocking)
node render.js roughcut.js out/silent.mp4 # 12 drawings/s, 24 fps, all code
ffmpeg -loglevel error -y -i out/silent.mp4 -i out/mix.wav -c:v copy -c:a aac -b:a 192k -shortest out/mulank8.mp4
echo "done: out/mulank8.mp4"
