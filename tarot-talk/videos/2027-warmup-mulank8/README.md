# Mulank 8 reel — hand-off package (v8 final cut)

What is inside
- SCRIPT.md — detailed beat-by-beat script, 34 beats: time, speaker, line, captions, delivery, picture, camera, sound, voice file.
- script.json — the same script in JSON, for a design or animation tool.
- cast.json — text cast sheet: look, wardrobe, colours, props, arms, expressions, movement, voice and FX, sensitivity rules; side cast and locations.
- voices/lines/*.wav — the final processed voice line for each beat (file name = beat id, e.g. S17.wav). Each starts at its beat's start time.
- voices/sfx/crow_one_caw.wav — the crow, at beat "kaa".
- voices/voice_track_timed.wav — all lines placed on the 85.67 s timeline (voice only), for lip-sync and timing tests.
- voices/full_mix_reference.wav — the final mix (voice + music + SFX) before loudness normalisation, for reference.
- voices/cue_sheet.csv — line id, speaker, start, end, file, text.

Timing: 1080x1920, 24 fps, 85.67 s. Everything in the script lines up with voice_track_timed.wav.
