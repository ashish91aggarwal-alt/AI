#!/usr/bin/env bash
# One-shot setup for a new session: tools installed, pipeline proven, briefing printed. Run from the repo root:
#   bash tarot-talk/cartoon-puppet/tools/bootstrap.sh
# Safe to run again. Takes about 1 minute (no full render).
set -e
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel); CP=$ROOT/tarot-talk/cartoon-puppet; cd "$ROOT"
say(){ printf '\n== %s\n' "$1"; }
say "1/5 repo up to date"
git pull -q --rebase 2>/dev/null || git pull -q --rebase https://github.com/ashish91aggarwal-alt/AI.git main || true
git log --oneline -1
say "2/5 team: production"
python3 tarot-talk/team/team.py start --role production | tail -25 || true
python3 tarot-talk/team/team.py inbox >/dev/null 2>&1 || true
say "3/5 tools"
command -v ffmpeg >/dev/null || { (apt-get install -y -qq ffmpeg >/dev/null 2>&1 || sudo apt-get install -y -qq ffmpeg >/dev/null 2>&1) || echo "ffmpeg MISSING"; }
python3 -c "import numpy, scipy" 2>/dev/null || pip install -q --break-system-packages numpy scipy
python3 -c "import faster_whisper" 2>/dev/null || (pip install -q --break-system-packages faster-whisper >/dev/null 2>&1 && echo "faster-whisper installed") || echo "faster-whisper not installed (only needed to check meme clips)"
cd "$CP"; mkdir -p cast out work; [ -d node_modules ] || npm install --silent
echo "node $(node -v), $(ffmpeg -version | head -1 | cut -d' ' -f1-3), python $(python3 -V | cut -d' ' -f2)"
say "4/5 pipeline check (Mulank 8 example, audio + 2 stills)"
export VIDEO=2027-warmup-mulank8
python3 tools/fetch_clips.py $VIDEO >/dev/null && python3 ../viral-hooks/make_sfx.py >/dev/null && python3 tools/build_voice.py $VIDEO && python3 tools/lipsync_prep.py $VIDEO
node prop_gate.js | grep -c PASS | xargs -I{} echo "proportions gate: {} PASS"
rm -f cast/health_*.png; node render.js cuts/$VIDEO.js cast/health --stills=5,45 | tail -1
if [ -s cast/health_0.png ] && [ -s cast/health_1.png ]; then echo "render OK (cast/health_0.png, cast/health_1.png)"; else echo "RENDER FAILED: fix before working"; exit 1; fi
say "5/5 briefing"
echo "videos in repo:"; for d in ../videos/*/; do s=$(basename "$d"); printf "  %-28s %s\n" "$s" "$( [ -f "$d/video.json" ] && echo ready || echo 'package only (run tools/new_video.py)')"; done
echo "approved characters: monty, vishnu, shani, brahma, sakshi (+ busts bunty, khanna). See CHARACTERS.md"
echo "read next: START.md, HOW_WE_WORK.md, CHARACTERS.md"
echo "READY"
