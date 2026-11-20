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

## Command line (the `tt-scout` package)

Install once on the PC (also installs yt-dlp and faster-whisper):

```
python -m pip install "git+https://github.com/ashish91aggarwal-alt/AI.git#subdirectory=instagram-scouting"
winget install Gyan.FFmpeg
```

Then, from anywhere inside your clone of the AI repo:

```
tt-scout check
tt-scout queue pagetkagy
tt-scout run
tt-scout push
python tarot-talk/dashboard/build.py      (rebuilds the workspace dashboard with the new results)
```

Written on 20 Nov 2026. `check` and `queue` have been run; `run` has not yet been run against Instagram.
