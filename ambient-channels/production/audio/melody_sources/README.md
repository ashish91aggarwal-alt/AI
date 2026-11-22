# Carol melody sources (work in progress, 17 Nov)

Goal (production/audio/README.md): every carol melody comes from a public-domain printed edition and is
cross-checked note by note against two independent transcriptions before arranging.

Step 1 done: `hits.txt` = ABC transcriptions found by GitHub code search (82 hits, 78 downloadable via
raw.githubusercontent.com; the raw files are not kept in the repo). `parse.py` extracts the top-line melody
with music21; `consensus.json` = the transcription that agrees most with the others, per carol, and which
others agree with it (interval sequence, first 40 intervals).

First result: agreement is weak for several carols (many files are harmonised arrangements where the first
voice is not the tune, or use other verses/keys). Copies of the same dataset (AlexKetelaars ↔ 2U1/NN) are not
independent. Next: restrict to melody-only files, compare full interval + rhythm sequences after transposing to
one key, then check the winner against the printed PD source (hymnary.org / IMSLP scans: Oxford Book of Carols
1928, Hymnal Noted 1856, Adam 1847, Redner 1868) and write the verified melody to `melodies/<carol>.abc` with its
provenance. Needed before G3 (19–21 Nov).
