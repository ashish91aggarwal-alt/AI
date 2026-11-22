# Independent review — Tarot Talk Desk app and queue flow (20 Nov 2026)

Reviewer: separate fresh agent. Read the code and ran the parser on Linux; nothing was run on Windows.

Verdict: not ready to hand over. No way for a stranger to run anything (no shell strings, the login check is sound, reel ids are regex-bound, the dashboard builds text nodes only). But git handling could wedge or wipe the queue, page requests never arrived, and the dashboard promised more than was true.

Must fix: 1 page links never matched when title and body were joined. 2 a read error rebuilt the queue from scratch; no lock; no atomic write. 3 failed rebase left the repo mid-rebase; no branch check; no git timeout. 4 built page committed by both desk and agent: guaranteed conflicts; failed push not retried; broad git add. 5 items stuck in "working"; no single-instance guard. 6 console windows flashing; no stdout under pythonw. 7 UI calls from the worker thread. 8 handle could contain ".."; every download error treated as a refusal with a 24 h lockout; picture posts crashed; desktop results not shown. 9 honesty: "picked up if the PC is on" needs the window open and an allowed account; nothing triggers the agent; page requests go to the agent; issues never closed.
Optional: escape "<" in the built page; source.py executed on the PC; editable install; Store python stub; daily cap counted successes only; loop could exceed GitHub's hourly limit; yt-dlp field notes.

Author's note (to be verified by the next reviewer):
- 1, 2, 3, 5, 6, 7, 8: fixed in desk.py and cli.py. Parser and handle check re-tested.
- 4: the built page is no longer committed; a GitHub Action builds and publishes it. The app commits only its own files and retries a failed push. This also removes running source.py on the PC.
- 9: dashboard and README text corrected. Issues are closed only if the GitHub command line (gh) is installed and signed in. Sakshi needs her GitHub account added to allowed_users, or sends from the owner's account.
- Optional: all taken except the yt-dlp field notes (view counts are usually absent; noted).
- Not re-reviewed. Still never run on Windows.
