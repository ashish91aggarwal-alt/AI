#!/bin/sh
# One-time per clone: install the commit hooks that keep the status trail.
cd "$(git rev-parse --show-toplevel)" || exit 1
git config core.hooksPath .githooks
chmod +x .githooks/* scripts/*.py 2>/dev/null
git config pull.rebase true
git config rebase.autoStash true
echo "Hooks installed. Now: export AGENT_ROLE=<orchestrator|channel-fantasy|channel-worship>"
