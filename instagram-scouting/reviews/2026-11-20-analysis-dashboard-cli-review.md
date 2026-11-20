# Independent review — page analysis, dashboard and command-line script (20 Nov 2026)

Reviewer: separate fresh agent. Recomputed the numbers from source.py, rendered the dashboard, read the script. Ran nothing against Instagram.

Verdict:
- Analysis: arithmetic right (median 304K of 24, group medians, 3 of 4 hits, rates, 10 of 25 money covers). Several readings over-claimed.
- Dashboard: no script errors; transcript and audio shown as waiting everywhere; status moved only for reels with real result files. One visible bug, two wrong states after a run.
- Command line: not safe to hand over as written.

Must fix (16): 1 "bold claims ask nothing" asserted without reading captions. 2 "money does better" not supported (303K vs 328K; 3 of 4 hits not money). 3 "vague wish" contradicted by two near-identical skits at 186K and 1.3M. 4 "timed promise" cherry-picked. 5 "all-time best" from 28 of 2,252 posts. 6 ritual median hides two clusters; top one uses a secrecy hook. 7 "this video found you" and "send it to yourself" not ruled on. 8 copy box visible before submit. 9 wrong tool states after a refused run; transcripts tile always "waiting". 10 tabs and matrix cut off on a phone. 11 "will be picked up" unproven; footer "no wording copied" false. 12 silence regex misses negatives. 13 push commits anything staged, returns 0 on failure, publishes hostname. 14 every error reported as a refusal; instant retry; yt-dlp retries on. 15 deletion not verified. 16 no encoding in build.py; empty transcript shows waiting forever; audio done with null numbers.
Optional: audio-only format; queue overwrote other handles; say plainly that scripted fetching is against Instagram's terms; status time mismatch; link inside a button; request date in UTC; add reel age, daily growth chart, sample-size badges.

Author's note (to be verified by the next reviewer):
- 1 to 7: findings.json rewritten. Two claims moved to a new "checked, and not supported" list. Two shapes added as do-not-use.
- 8 to 11: template fixed; tabs now wrap; matrix fits a phone; messages and footer reworded. The skill now tells Claude to read the queue at the start of a scouting session.
- 12 to 16: script and build fixed; refusal now starts a 24-hour wait; audio-only fetch; deletion checked; hostname no longer written.
- Optional: taken, except reel age (not shown on the page), the daily growth chart (needs more days of data) and self-hosted fonts.
- Not re-reviewed after the fixes. The command-line script has still never been run against Instagram.
