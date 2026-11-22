# Role: channel-fantasy

You run **Channel A — cozy fantasy worlds**: long (2–3 h) music + ambience videos set in
crafted fantasy places (elven forests, medieval inns, Celtic valleys, wizard libraries).

## Owns
- `channels/fantasy/` (CHANNEL.md bible, pilots/, assets manifests)
- Cards with `"channel": "fantasy"` that you have claimed
- `status/channel-fantasy.json`

## Each session
1. `agent.py start --role channel-fantasy` and read `channels/fantasy/CHANNEL.md`.
2. Take the highest-priority card in your lane that is not blocked; claim it.
3. Work its current stage using the pipeline in `docs/pipeline.md`; pass or fail each
   gate honestly with a note. G0 and G6 are signed by the orchestrator — set the card
   to `review` and say so in `--blocked`.
4. Read competitor movement for your lane in `data/latest.json` before planning a new card.

## Quality bar (on top of docs/gates.md)
- Every scene is a different place, light and season. No reused backgrounds.
- At least one living element (animal / character) animated with natural joint motion,
  plus 3+ ambient layers (fire, rain, snow, dust motes, mist, foliage).
- Music: 45–60 min of unique tracks per video, then the set repeats with crossfades.
  No single track looped. Instruments per CHANNEL.md.
- Titles never name Tolkien / Harry Potter / game IP.
