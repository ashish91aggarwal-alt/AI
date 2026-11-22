# AGENTS.md — read this first, every session

This repo runs a small network of long-form ambient music YouTube channels for
top-tier viewers (US, UK, Canada, Australia). Several Claude sessions work in it at
the same time. This file is the contract between them. Any agent, any session, any
time must be able to pick up from what is in git, and nothing else.

## Roles (one session = one role)

| Role id            | Owns                                                  | Role file                     |
|--------------------|-------------------------------------------------------|-------------------------------|
| `orchestrator`     | Strategy, priorities, gates sign-off, budget, dashboard, cross-channel decisions | `agents/orchestrator.md` |
| `channel-fantasy`  | Channel A: cozy fantasy worlds (medieval/elven/Celtic) | `agents/channel-fantasy.md`  |
| `channel-worship`  | Channel B: soaking worship / Christian instrumental   | `agents/channel-worship.md`   |
| `channel-pets`     | Paws & Nooks: dogs and cats napping in cozy places, original calm music | `agents/channel-pets.md` |
| `reviewer`         | Independent quality gate for everything public (G1–G5, brand assets) | `agents/reviewer.md` |

New channel = new role file `agents/channel-<slug>.md` + `channels/<slug>/` +
an entry in `config/channels.json`. The orchestrator creates them.

## Start-of-session protocol (do these in order)

This project lives in the folder `ambient-channels/` of the GitHub repo `ashish91aggarwal-alt/AI` (the AI repo
also holds other projects; our hooks and CI only act on this folder). Run everything from `ambient-channels/`.

```bash
git pull --rebase
bash scripts/setup.sh                 # once per clone: installs the commit hooks
export AGENT_ROLE=<your role id>      # e.g. channel-fantasy
python3 scripts/agent.py start --role $AGENT_ROLE
```

`start` prints your briefing: your last status, the cards you own, free cards in your
lane, blocked gates, and the latest tracking numbers. Then read your role file.

## While working

- **Claim before you touch a card:** `python3 scripts/agent.py claim <card-id>`.
  A claim is a 6-hour lease. Renew it with `claim` again. An expired lease means the
  card is free — another session may take it.
- **Talk to other sessions:** `agent.py msg <role|all> "text"` leaves a message in your own status file;
  `agent.py inbox` (and `start`) shows messages for you. Commit + push right after, and `git pull` often
  (at least before each new step) so you see theirs.
- **Update status whenever your plan changes:**
  `python3 scripts/agent.py status --doing "..." --next "..." [--blocked "..."]`
- **Move cards through stages with gates:** `agent.py gate <card> <gate> pass|fail --note "..."`
  and `agent.py move <card> <stage>`. The tool refuses a move whose gates aren't passed.
- **Write only what you own:** your `status/<role>.json`, cards you have claimed,
  your `channels/<slug>/` folder. The orchestrator also owns `config/`, `AGENTS.md`,
  `agents/`, `docs/`. Never edit another role's status file.
- **Never edit generated files:** `STATUS.md`, `data/**` are written by CI and the
  tracker. Edits there are overwritten.

## Commits

- The pre-commit hook stamps `status/<role>.json` (time, files touched, last commit
  subject) and refuses the commit if `AGENT_ROLE` is unset or your status has no
  `doing`. So every commit leaves a status trail automatically.
- The commit-msg hook requires the prefix `[<role>] `, e.g. `[channel-fantasy] F1 still image approved`.
- Push often: `git pull --rebase && git push`. Conflicts are rare because each
  session writes its own files; if one happens in a file you don't own, take theirs.
- CI (`status-guard`) re-checks every pushed commit and rebuilds `STATUS.md`.

## End-of-session protocol

```bash
python3 scripts/agent.py status --doing "idle" --next "<exact next step for whoever picks this up>"
python3 scripts/agent.py release <card-id>      # for every card you are not continuing
git add -A && git commit -m "[$AGENT_ROLE] handoff: <one line>" && git pull --rebase && git push
```

`--next` must be concrete enough that a fresh session with zero memory can do it.

## Standing rules from the owner (non-negotiable)

1. **Natural motion only.** Characters and animals move through their own joints, the
   way the real creature moves. Never a picture hopping, sliding, rotating or
   stretching as a whole. Ambient motion (rain, embers, mist, light flicker) is fine.
2. **No tokens spent on frames.** Claude writes code; frames are produced by that code
   or by models on a pod — never generated or inspected frame-by-frame in chat.
3. **Runpod: every deploy has an idle auto-kill and a budget cap.** Cheapest GPU
   that does the job. Don't rent a GPU for work that runs locally.
4. **Paid credits (ElevenLabs etc.): ask first** — how many items, how many
   versions, what credit cap. Open-weight models are preferred; closed tools are
   allowed when cheap and they fit.
5. **Professional quality, strict gates.** No casual experiments. Every video passes
   the gates in `docs/gates.md` before it is published.
6. **Research is tested with real tools**, with a falsifier (e.g. like-rate check for
   bought views), never opinion alone.
7. **Monetization safety:** each video must look like a different, crafted place
   (YouTube's inauthentic-content policy judges whole channels). No IP names
   (Tolkien, Harry Potter, Ghibli…) in titles, tags or visuals. No medical claims.
9. **The owner does not judge taste.** Every public asset (name, picture, sound, music, feel, look)
   passes docs/quality-bar.md: measured checks, a 3-competitor benchmark and an independent reviewer
   (average ≥ 8, nothing below 7). Take the time it needs. Never ask the owner whether something looks or sounds good.
8. Image generation: ChatGPT (owner runs prompts) or an open-weight model on a pod.
   Don't cut one full-cast image into pieces — generate elements separately.

## Where things are

```
AGENTS.md            this contract            STATUS.md        generated live summary
agents/              role files               status/          one JSON per role
production/cards/    one JSON per video card  channels/<slug>/ channel bible + pilot plans
config/              channels, competitors    data/            tracker output (generated)
scripts/             agent.py, track.py, analytics.py, export_dashboard.py
docs/                gates, pipeline, apis    dashboard/       dashboard notes + export
.github/workflows/   tracker cron, status guard
```
