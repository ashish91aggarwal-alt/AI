#!/bin/bash
# GPU session 1 boot script (runs on the pod). Budget guard:
#   - hard cap: MAX_MIN minutes after boot -> push results, stop the pod
#   - when the job ends (done or failed) -> push results, stop the pod
#   - idle kill: run log unchanged for IDLE_MIN (10) minutes -> push results, stop the pod
#   - pushes progress + log every 5 minutes, so a stall is visible from outside
# Results go to branch gpu/session1 of ambient-channels (main stays clean).
exec > >(tee -a /workspace/run.log) 2>&1
MAX_MIN=${MAX_MIN:-120}
R=/workspace/repo
S=$R/production/gpu/session1
stop_pod() { runpodctl stop pod "$RUNPOD_POD_ID" || runpodctl pod stop "$RUNPOD_POD_ID"; }
push() {
  cd $R || return
  cp /workspace/run.log $S/out/run.log 2>/dev/null
  git add -A production/gpu/session1/out
  git diff --cached --quiet || git commit -qm "[orchestrator] gpu session1 outputs $(date -u +%H:%M)"
  for i in 1 2 3; do git push -q origin HEAD:gpu/session1 && echo PUSHED && return; sleep 5; done
}
( sleep $((MAX_MIN*60)); echo "HARD CAP ${MAX_MIN} min reached"; push; stop_pod ) &
# idle kill: if the run log has not changed for IDLE_MIN minutes, the job is stuck -> push, stop
IDLE_MIN=${IDLE_MIN:-10}
( sleep 120; while true; do sleep 60; age=$(( $(date +%s) - $(stat -c %Y /workspace/run.log) ));
  if [ $age -gt $((IDLE_MIN*60)) ]; then echo "IDLE ${IDLE_MIN} min -> stopping"; push; stop_pod; fi; done ) &

git clone -q "https://x-access-token:${AMBIENT_GH}@github.com/ashish91aggarwal-alt/ambient-channels.git" $R
cd $R && git config user.name "gpu-session1" && git config user.email "gpu@ambient.local"
git checkout -q -B gpu/session1
mkdir -p $S/out
( while true; do sleep 300; push; done ) &

echo "== setup $(date -u)"; nvidia-smi --query-gpu=name,memory.total --format=csv
apt-get update -qq && apt-get install -y -qq ffmpeg >/dev/null
export HF_HOME=/hf HF_HUB_ENABLE_HF_TRANSFER=1
pip install -q --break-system-packages -U "git+https://github.com/huggingface/diffusers" transformers accelerate safetensors hf_transfer sentencepiece 2>&1 | tail -2

echo "== images $(date -u)"
python3 $S/gen.py images
push

echo "== ace-step setup $(date -u)"
curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null 2>&1; export PATH=$HOME/.local/bin:$PATH
git clone -q https://github.com/ACE-Step/ACE-Step-1.5.git /opt/ACE-Step-1.5
cd /opt/ACE-Step-1.5 && uv sync -q 2>&1 | tail -3
echo "== music $(date -u)"
uv run python $S/gen.py music

echo "== JOBDONE $(date -u)"
push; push
sleep 20; stop_pod
