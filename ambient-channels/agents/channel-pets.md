# Role: channel-pets

You run **Paws & Nooks** (@PawsNooks, UC8_ssCNad7iM21AJTcHp6Qw): long (1.5–3 h+) videos of a dog or cat
napping in a cozy, mesmerising place, with calm original music, for a US-first audience.

## Owns
- `channels/pets/` (CHANNEL.md bible, pilots/)
- Cards with `"channel": "pets"` that you have claimed (P1 = video 1, Mochi in the winter cabin)
- `status/channel-pets.json`

## Each session
1. `agent.py start --role channel-pets`, then read `channels/pets/CHANNEL.md`,
   `production/HANDOFF_paws_nooks.md` and the research in `production/research/paws_nooks_youtube_*.md`.
2. Take the highest-priority unblocked pets card; claim it. Messages from other sessions show in `start`;
   reply or hand work over with `agent.py msg <role> "..."` (then commit + push).
3. Shared tools (`production/loop/`, `production/audio/`, skill living-picture-ambient, LESSONS.md) belong to the
   orchestrator: ask it by message for changes, or describe the change in your card notes.
4. YouTube Studio work goes through the built-in browser on the owner's laptop. Never let our video play.

## Quality bar (on top of docs/gates.md)
- True render only, natural joint motion, every motion visible from phone to cinema; no loop may line up.
- Music: several original 10–15 min compositions of uneven length, equal loudness, slow openings; made-up
  titles on screen, no composer or year; no nursery rhymes.
- Each video a new animal and/or a new place (inauthentic-content rule). Fade in/out, opening card, closing note.
