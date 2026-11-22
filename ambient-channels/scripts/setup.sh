#!/bin/sh
# One-time per clone: install the commit hooks that keep the status trail.
# ambient-channels lives in the AI repo; the hooks only act on commits that touch this folder.
cd "$(dirname "$0")/.." || exit 1
git config core.hooksPath "$(git rev-parse --show-prefix).githooks"
chmod +x .githooks/* scripts/*.py 2>/dev/null
git config pull.rebase true
git config rebase.autoStash true
echo "Hooks installed. Now: export AGENT_ROLE=<orchestrator|channel-pets|channel-fantasy|channel-worship|reviewer>"
