# Tarot Talk shared assets

Reusable files any session can take without downloading again.

- `audio/memes/`: meme voice lines and trending meme sounds, each one checked by transcription. `catalog.json` lists what each clip says, who says it, the useful in/out seconds, what it fits, its source link and which videos used it.
- To add a clip: download it from its free source (see `../viral-hooks/HOOKS.md`), transcribe it with `cartoon-puppet/find_phrase.py`, save it here, add a row to `catalog.json`, and commit with `[tt:production]`.
- The cartoon pipeline (`cartoon-puppet/tools/fetch_clips.py`) reads from here first and only downloads a file that is missing. Anything it downloads is saved here for the next session.

These clips belong to their original creators, and the repo is public. Use short pieces in comedy reels only. Instagram may mute or flag film or song audio (moye moye is the highest risk).
