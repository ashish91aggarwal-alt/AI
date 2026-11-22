#!/bin/bash
# GPU session 2 boot script (runs on the pod). Env: AMBIENT_GH (Runpod secret), PHASE=2a|2b,
# MAX_MIN (= session cap in minutes: 60 for 2a = $2.69, 62 for 2b = $2.80 at $2.69/h), CARD_LEFT_F1, CARD_LEFT_W3 (dollars).
# Budget guards:
#   - hard cap: MAX_MIN minutes after boot -> push, stop the pod
#   - setup limit: weights must be on disk within SETUP_MIN (20) minutes, and the download must
#     average >= 20 MB/s over every 2-minute window, else push + stop (session 1 lesson)
#   - idle kill: no new line in the PROGRESS file for IDLE_MIN (10) minutes -> push, stop
#     (progress-bar redraws do not count, only runner/setup steps write to it)
#   - stop at the end of the queue
exec > >(tee -a /workspace/run.log) 2>&1
BOOT=$(date +%s)
MAX_MIN=${MAX_MIN:-60}; SETUP_MIN=${SETUP_MIN:-20}; IDLE_MIN=${IDLE_MIN:-10}; PHASE=${PHASE:-2a}
R=/workspace/repo; S=$R/production/gpu/session2; P=/workspace/progress.log
note() { echo "$(date -u +%H:%M:%S) $*" | tee -a $P; }
stop_pod() { runpodctl stop pod "$RUNPOD_POD_ID" || runpodctl pod stop "$RUNPOD_POD_ID" || \
  curl -s -X POST "https://rest.runpod.io/v1/pods/$RUNPOD_POD_ID/stop" -H "Authorization: Bearer $RUNPOD_API_KEY"; }
push() {
  cd $R || return
  mkdir -p $S/out; cp /workspace/run.log $P $S/out/ 2>/dev/null
  git add -A production/gpu/session2/out
  git diff --cached --quiet || git commit -qm "[orchestrator] gpu session2 $PHASE outputs $(date -u +%H:%M)"
  for i in 1 2 3; do git push -q -f origin HEAD:gpu/session2-$PHASE && return; sleep 5; done
}
finish() { note "STOP: $*"; touch /workspace/session.done; push; stop_pod; sleep 60; exit 0; }
[ -f /workspace/session.done ] && { echo "already done -> stop"; stop_pod; sleep 600; exit 0; }
note "boot phase=$PHASE cap=${MAX_MIN}min"
( sleep $((MAX_MIN*60)); finish "hard cap ${MAX_MIN} min" ) &
( sleep 180; while true; do sleep 60; age=$(( $(date +%s) - $(stat -c %Y $P) ));
  [ $age -gt $((IDLE_MIN*60)) ] && finish "idle ${IDLE_MIN} min"; done ) &

git clone -q "https://x-access-token:${AMBIENT_GH}@github.com/ashish91aggarwal-alt/ambient-channels.git" $R
cd $R && git config user.name "gpu-session2" && git config user.email "gpu@ambient.local"
git checkout -q -B gpu/session2-$PHASE; mkdir -p $S/out
( while true; do sleep 300; push; done ) &

note "setup"
nvidia-smi --query-gpu=name,memory.total --format=csv
export HF_HOME=/hf HF_HUB_ENABLE_HF_TRANSFER=1
pip install -q --break-system-packages -U "git+https://github.com/huggingface/diffusers" transformers accelerate \
  safetensors hf_transfer hf_xet sentencepiece peft opencv-python-headless imageio ftfy regex 2>&1 | tail -1
MODELS="Wan-AI/Wan2.2-I2V-A14B-Diffusers lightx2v/Wan2.2-Lightning"
[ "$PHASE" = "2a" ] && MODELS="Qwen/Qwen-Image"
# download with a rate floor: >= 20 MB/s per 2-minute window, all done within SETUP_MIN
# safety net only; stalls are handled per download below (2d: two pods hung at 88 of ~121 GB)
( prev=0; slow=0; while sleep 120; do now=$(du -sb /hf 2>/dev/null | cut -f1); rate=$(( (now-prev)/120/1000000 ));
  [ -f /workspace/dl.done ] && exit 0; note "download ${rate} MB/s, total $((now/1000000000)) GB"
  if [ $rate -lt 20 ] && [ $prev -gt 0 ]; then slow=$((slow+1)); else slow=0; fi
  [ $slow -ge 3 ] && finish "download too slow (${rate} MB/s 3x)"; prev=$now; done ) &
# only the files we use: the Lightning repo also holds many T2V folders (session 2c lesson: 140 GB disk filled up)
pattern() { case "$1" in lightx2v/Wan2.2-Lightning) echo "Wan2.2-I2V-A14B-4steps-lora-rank64-Seko-V1/*.safetensors";; *) echo "*";; esac; }
# one download try; returns 2 if nothing arrives for 80 s (hung), and logs the downloader's last lines
dl_try() {  # $1 model, $2 pattern, $3 log
  python3 -c "import sys; from huggingface_hub import snapshot_download; snapshot_download(sys.argv[1], allow_patterns=[sys.argv[2]])" "$1" "$2" > "$3" 2>&1 &
  local pid=$! last=-1 still=0 now
  while kill -0 $pid 2>/dev/null; do
    # whole-disk bytes (the downloader may write outside /hf); < 20 MB in 20 s counts as no progress
    sleep 20; now=$(df -B1 --output=used / | tail -1 | tr -d ' ')
    if [ $last -ge 0 ] && [ $((now-last)) -lt 20000000 ]; then still=$((still+20)); else still=0; fi; last=$now
    if [ $still -ge 80 ]; then kill $pid 2>/dev/null; sleep 2; kill -9 $pid 2>/dev/null
      note "hung at $((now/1000000000)) GB: $(tail -c 300 "$3" | tr '\n\r' '  ')"; return 2; fi
  done
  wait $pid
}
for m in $MODELS; do
  L=/workspace/dl_$(basename $m).log; ok=0
  for attempt in 1 2 3; do
    if [ $attempt -gt 1 ]; then export HF_HUB_DISABLE_XET=1; note "retry $attempt for $m without xet"; fi
    dl_try "$m" "$(pattern $m)" "$L.$attempt" && { ok=1; break; }
  done
  unset HF_HUB_DISABLE_XET
  [ $ok = 1 ] || { tail -5 $L.* >> $P; df -h /hf / >> $P 2>&1; finish "download failed: $m"; }
done
df -h / | tail -1 | tee -a $P
touch /workspace/dl.done; note "weights ready"

# masters (PNG frames/images, FLAC music) go to a GitHub release, not into git history
release_upload() {  # $1 = file
  local api=https://api.github.com/repos/ashish91aggarwal-alt/ambient-channels tag="gpu-session2-$PHASE"
  local id=$(curl -s -H "Authorization: Bearer $AMBIENT_GH" $api/releases/tags/$tag | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))")
  [ -z "$id" ] && id=$(curl -s -H "Authorization: Bearer $AMBIENT_GH" -d "{\"tag_name\":\"$tag\",\"name\":\"$tag\",\"prerelease\":true,\"target_commitish\":\"main\"}" $api/releases | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))")
  curl -s -o /dev/null -H "Authorization: Bearer $AMBIENT_GH" -H "Content-Type: application/octet-stream" \
    --data-binary @"$1" "https://uploads.github.com/repos/ashish91aggarwal-alt/ambient-channels/releases/$id/assets?name=$(basename "$1")"
}
left_min() { echo $(( MAX_MIN - ( $(date +%s) - BOOT ) / 60 - 4 )); }

{ [ "$PHASE" = "2c" ] || [ "$PHASE" = "2d" ]; } && export INPUTS=$S/inputs_c4
{ [ "$PHASE" = "2e" ] || [ "$PHASE" = "2f" ] || [ "$PHASE" = "2g" ] || [ "$PHASE" = "2h" ] || [ "$PHASE" = "2i" ]; } && export INPUTS=$S/inputs_c5
note "runner start"
cd $S && python3 run_session.py --phase "$PHASE" --cap-min "$MAX_MIN" --boot "$BOOT" \
  --left-f1 "${CARD_LEFT_F1:-0}" --left-w3 "${CARD_LEFT_W3:-0}" --left-c4 "${CARD_LEFT_C4:-0}" --progress $P --out $S/out
push
if [ "$PHASE" = "2a" ]; then
  for f in /workspace/masters/img/*.png; do release_upload "$f"; done
  # F1 music retry (lowest priority, charged to F1; limited by the time left under the cap)
  if [ "$(left_min)" -gt 12 ] && [ "${MUSIC:-1}" = "1" ]; then
    note "ace-step setup"
    curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null 2>&1; export PATH=$HOME/.local/bin:$PATH
    git clone -q https://github.com/ACE-Step/ACE-Step-1.5.git /opt/ACE-Step-1.5
    ( cd /opt/ACE-Step-1.5 && uv sync -q 2>&1 | tail -2 )
    timeout $(( $(left_min) * 60 )) python3 -c "from huggingface_hub import snapshot_download; snapshot_download('ACE-Step/Ace-Step1.5', local_dir='/opt/ACE-Step-1.5/checkpoints')" >/dev/null 2>&1 \
      && note "ace weights ready" || note "ace download failed or timed out"
    apt-get install -y -qq ffmpeg >/dev/null 2>&1
    cd /opt/ACE-Step-1.5 && PROGRESS=$P timeout $(( $(left_min) * 60 )) uv run python $S/music.py; cd $S
    push
    for f in /workspace/masters/music/*.flac; do [ -f "$f" ] && release_upload "$f"; done
  fi
fi
if [ "$PHASE" = "2b" ] || [ "$PHASE" = "2c" ] || [ "$PHASE" = "2d" ] || [ "$PHASE" = "2e" ] || [ "$PHASE" = "2f" ] || [ "$PHASE" = "2g" ] || [ "$PHASE" = "2h" ] || [ "$PHASE" = "2i" ]; then
  for d in /workspace/masters/clips/*/; do n=$(basename $d); tar -cf /workspace/$n.tar -C /workspace/masters/clips $n && release_upload /workspace/$n.tar; done
fi
finish "queue done"
