# Independent review — instagram-scouting skill v1 (20 Nov 2026)

Reviewer: separate fresh agent; read the code, ran nothing against Instagram.

Verdict: not ready as "proper". Good skeleton and honest test note, but reels only, "watch" is stills, transcript effectively undelivered, three bugs.

Must fix:
1. reel-facts cut the text at 700 characters, losing counters after a long caption; counters read by position; no post date.
2. Median included pinned reels; even counts took the upper middle value.
3. The first note broke its own 3x rule, lacked views for the owner's reel, and stated things inferred from stills as fact.
4. Contact sheet: no guard for unknown duration, wrong times for short reels, forced 9:16, overlay could be left on the page.
5. Over-promise: "posts", comments, niche search, dates and transcripts not covered.
6. Local tools section contradicted "never download", nudged toward throwaway accounts, and its setup script had faults.
7. Safety gaps: confirm the signed-in account; say plainly this is automated access against Instagram's terms; views register; name the one allowed click; daily cap and pause.
8. Token estimates too low; realistic 3-4K per reel.
Optional: label rules of thumb; English-only number parsing; one canonical copy of snippets; vidIQ tools could fill gaps.

Author's note (to be verified by the next reviewer):
- 1, 2, 4: snippets rewritten and re-run once on the same profile and reel; pinned detection, counters list and the 12-frame sheet returned correctly. Post date is not shown on the reel view, so it is listed as not covered.
- 3: note rewritten into numbers / seen / opinion.
- 5, 7, 8: skill text changed as asked.
- 6: local tools section and the setup script removed entirely.
- Optional items taken, except non-English number formats (stated as a limit).
- v2 not re-reviewed.
