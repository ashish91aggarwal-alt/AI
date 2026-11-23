#!/usr/bin/env bash
# One command: video package -> finished reel.   bash make_reel.sh <slug>   (default: 2027-warmup-mulank8)
# Needs node 18+, python3 (numpy, scipy), ffmpeg. No GPU, no image/video models, no tokens per frame. ~3 min on 2 cores.
set -e; cd "$(dirname "$0")"; SLUG=${1:-2027-warmup-mulank8}; export VIDEO=$SLUG
CUT=$(python3 -c "import json;print(json.load(open('../videos/$SLUG/video.json'))['cut'])")
mkdir -p out work/$SLUG cast; [ -d node_modules ] || npm install --silent
python3 tools/fetch_clips.py $SLUG          # original meme lines + meme sounds (urls in video.json; never committed)
python3 ../viral-hooks/make_sfx.py >/dev/null   # our own synthesised SFX
python3 tools/build_voice.py $SLUG          # splice meme lines -> work/<slug>/voice.wav + timeline.json
python3 tools/lipsync_prep.py $SLUG         # lip-sync / blink / gesture drive -> work/<slug>/lipsync.json
python3 tools/mix_sfx.py $SLUG              # voice + sfx + meme sounds -> mix_raw.wav
python3 tools/make_music.py $SLUG           # original tabla/santoor/tanpura bed, ducked under speech -> music.wav
python3 tools/final_mix.py $SLUG            # + music, -14 LUFS, -1.5 dBTP -> mix.wav
node prop_gate.js                           # proportions gate (blocking)
node render.js $CUT out/$SLUG.silent.mp4
ffmpeg -loglevel error -y -i out/$SLUG.silent.mp4 -i work/$SLUG/mix.wav -c:v copy -c:a aac -b:a 192k -shortest out/$SLUG.mp4
echo "done: out/$SLUG.mp4"
