#!/usr/bin/env bash
# Splice re-rendered segments into an existing silent render and re-mux the audio.
# Usage: bash tools/splice.sh <slug> <out.mp4> T0:T1:seg.mp4 [T0:T1:seg.mp4 ...]   (segments in time order, paths relative to out/)
# Example: bash tools/splice.sh molbhav-taurus molbhav-taurus_v2.mp4 47:56:seg_a.mp4 113:123:seg_b.mp4
# Cuts the base into parts one at a time (a single filter graph ran out of memory), concatenates, then adds work/<slug>/mix.wav.
set -euo pipefail
slug=$1; outname=$2; shift 2
cd "$(dirname "$0")/../out"
enc="-c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -r 24"
: > parts.txt; prev=0; i=0
for s in "$@"; do IFS=: read a b f <<< "$s"
  ffmpeg -loglevel error -y -ss $prev -i $slug.silent.mp4 -t $(echo "$a - $prev" | bc) $enc part$i.mp4; echo "file part$i.mp4" >> parts.txt; echo "file $f" >> parts.txt; prev=$b; i=$((i+1)); done
ffmpeg -loglevel error -y -ss $prev -i $slug.silent.mp4 $enc part$i.mp4; echo "file part$i.mp4" >> parts.txt
ffmpeg -loglevel error -y -f concat -i parts.txt -c copy $slug.spliced.silent.mp4
ffmpeg -loglevel error -y -i $slug.spliced.silent.mp4 -i ../work/$slug/mix.wav -c:v copy -c:a aac -b:a 192k -shortest $outname
echo "base $(ffprobe -v error -show_entries format=duration -of csv=p=0 $slug.silent.mp4) s, spliced $(ffprobe -v error -show_entries format=duration -of csv=p=0 $outname) s"
