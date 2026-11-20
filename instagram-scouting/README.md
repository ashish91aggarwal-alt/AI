# Instagram scouting

Studies public Instagram pages as references and shows the findings on a dashboard. Shared by all projects in this repo.

```
instagram-scouting/
  SKILL.md              copy of the instagram-scouting skill (the skill is the canonical copy)
  input/requests.json   pages, competitors and topics asked for, with their state
  input/cli-queue.json  reels waiting for the command-line step (made by the script)
  output/<handle>/      source.py  raw observations typed in from the browser look
                        findings.json  what works, what is weak, concepts, usable shapes (opinion, labelled)
                        page.json  built from the two above plus command-line results
                        cli/<reel>.json  transcript and audio numbers from the command-line step
  output/status.json    which tool has done what
  output/cli-status.json  written by the command-line script on the PC
  tt_scout/ + pyproject.toml   the tt-scout command-line package, run on the owner's PC
  dashboard/build.py    builds page.json (the dashboard itself is the Tarot Talk workspace: tarot-talk/dashboard/)
  snippets/             page snippets the skill runs in the built-in browser
  reviews/              independent reviews
```

## Two ways of reading a page

1. Built-in browser on the PC, driven by Claude: lists reels, reads views, covers, captions and counters, pulls still frames. View only, slow pace.
2. Command-line step on the PC, run by the owner: transcript and audio numbers. Text and numbers are kept; the video is deleted after reading. It never logs in and stops at the first refusal.

Until step 2 has run and pushed, the dashboard marks transcripts and audio as "waiting for command line".

## Desktop app (Tarot Talk Desk) and command line

One package, two commands: `tt-desk` (the window) and `tt-scout` (the command line).

Install on the PC, from inside your clone of the AI repo:

```
powershell -ExecutionPolicy Bypass -File .\instagram-scouting\install-desk.ps1
```

It installs the package (with yt-dlp and faster-whisper), and puts a "Tarot Talk Desk" shortcut on the Desktop. Add `-Startup` to start it with Windows. ffmpeg is separate: `winget install Gyan.FFmpeg`.

How the three parts talk, with no agent carrying data:

1. Dashboard: "Forward a link" opens a prefilled GitHub issue titled `scout: <link>`.
2. Desk (window open on the PC): every 3 minutes it pulls the repo and reads open issues from the accounts in `desk-config.json` (`allowed_users`). For a reel it fetches the sound, writes transcript, audio numbers and public counters, deletes the file, updates `input/queue.json` and `output/`, commits and pushes. A page request is marked "needs agent".
3. GitHub Action (`.github/workflows/dashboard.yml`): rebuilds the dashboard page and publishes it with GitHub Pages on every push.
4. Agent (a Claude session, when asked): pulls the repo, studies what is "ready for agent" or "needs agent", updates findings, sets the request to `done`.

Add a tool to the Status tab by adding an entry to `tools.json`. Add a GitHub account that may send requests in `desk-config.json`.

Written on 20 Nov 2026 and reviewed once. Not yet run on Windows; fetching has not been run against Instagram.
