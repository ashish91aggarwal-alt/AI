# Review: transcript research + strategy funnel (20 Nov 2026)

1. BLOCKER. strategies.json:438 (return-date, Trends India `done:true`). Read for "manifestation", which its own text says is not our topic. It adds 10 points, so the score rose 45 to 48 while evidence was cut 25 to 18. Fix: `done:false`.
2. BLOCKER. strategies.json:736 (do-along). "While watching" holds for 2 of 7 reels (Df15, Df67). DZ98 is done at bedtime, DflQ on a date. Same three reels as return-date, so not separate. Fix: "a script to carry out, now or later; 2 during the reel; overlaps return-date".
3. Should-fix. findings.json:7 "The 4 skits read closely have no spoken ask": only 2 have transcripts.
4. Should-fix. findings.json:156, research-plan.json done[0] "all 7, whole premise within 3.5 s": knife named at 7.9 s, "a sign" at 7.6 s, 11:11 claim ends 5.3 s. Fix: "no greeting in 7; premise by 3.5 s in 4". findings.json:12 "last line is a turn": false for DfiP.
5. Should-fix. research-plan.json:55,60: two NOT DONE items sit in `done`, shown under "Done (5)". Move to `next`. hub.js:93 `slice(0,5)` hides the sixth next item.
6. Should-fix. build.py:27-31. Dropping "does not apply" gives rejected ideas 29, equal to adopted pilot-first, above discovered (5); keyword-dm shows 88, not 70. Fix: no score for rejected/parked; total stays 100. `cycles:1` after one review, all "not re-reviewed": count only fix plus re-review.
7. Should-fix, stages. pilot-first: adopted, 0 cycles, no review file. level-2, every-viewer: "testing" with no series running; set early-review. return-date, named-character: one review, Reviewer `done:false`; set early-review.
8. Should-fix, history files (all exist). keyword-dm, free-paid cite framework-review: "not ready", neither assessed (free/paid is in driver-concept-review). series cites review-2: idea list only. every-viewer cites ideas-review-1: absent there (framework-review item 1). Repoint or set Reviewer `done:false`.
9. Should-fix. workspace.json:26-32,62 still awaits transcripts. Skills tab shows return-date and named-character "In trial" against "Optimise and review". "Strategies being tested" holds only plans; rename "Planned tests".
10. Minor. page.json Df67: 40.7K comments, 2.39%; findings: 42.1K, 2.5%. base.html prints whole transcripts (SKILL.md:30).
11. Minor. hub.js:163 Enter on a funnel step drops focus to body. hub.js:15-19 Tab leaves the open sheet.

Fine: no JS errors or page overflow at 1200 and 400; folds and cards work by keyboard; medians, comment rates, pitch timings, ask counts match; no reel quote over 15 words in findings or strategies; Trends entry has date and URL (not re-read).
