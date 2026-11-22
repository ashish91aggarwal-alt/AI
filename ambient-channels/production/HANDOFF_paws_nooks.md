# Paws & Nooks - handoff (22 Nov 2026, 15:20 IST)

Times are IST. Replies to the owner: simple text, short, no heavy formatting.

## Where things stand
- Channel: Paws & Nooks, @PawsNooks, id UC8_ssCNad7iM21AJTcHp6Qw (brand channel under the owner's Google account).
  Banner, profile picture, description, keywords, country India, not made for kids, phone verified.
  Home tab on, with video 1 as the channel trailer for non-subscribers.
- Video 1: "This is Mochi. He sleeps for hours 😴 Cozy Winter Cabin, Crackling Fireplace & Soft Piano for Sleep"
  https://youtu.be/nEMfFKdtlnc - 1:38:08, 4K, PUBLIC since Sun 22 Nov 05:30 IST (Sat 7 pm ET).
  Category Music, 23 tags, 8 chapters (composition names), language English, AI use = Yes (shows an "AI" label),
  custom thumbnail (no text), pinned channel comment, end screen = Subscribe + playlist.
- Playlist: "Sleeping Cats & Cozy Cabins | 4K Fireplace & Soft Piano Sleep Music" (public). Add every new video.
- Numbers (YouTube Data API via the tracker): 2 views 09:54, 3 at 11:39, 4 at 15:12 IST; 0 likes, 0 subs.
  Studio at 11:40: 14 impressions, CTR 0%, watch time 0.0 h - normal slow start for a 0-subscriber channel.
- First real read: Tue 24 Nov morning IST (impressions, CTR, average view duration in Studio > Analytics).

## Where things live
- Repo: github.com/ashish91aggarwal-alt/AI, folder ambient-channels/ (moved there 22 Nov 2026; the old private repo
  ashish91aggarwal-alt/ambient-channels keeps the full history). Roles per AGENTS.md; Paws & Nooks = channel-pets.
  - production/research/paws_nooks_youtube_2026-11-20.md - niche research + everything applied to video 1.
  - production/loop/LESSONS.md + skill living-picture-ambient - the full making method and every fix.
  - production/cards/P1.json - board card (GPU spend about $7.27 of $8.75 approved).
  - config/channels.json (slug "pets"), config/competitors.json (8 pets-lane competitors),
    config/insights/pets.json (hand-written findings).
  - data/mirror/pets/ - our channel and video stats from the API every 6 h (video_stats.csv = history).
- Dashboard: Claude artifact 2d604a01-f6fd-43a7-9fb6-a56ed894a958 (tab "Insights" has live rows: our video
  numbers, hottest niche upload, usual length, fastest small channel). Refreshed by the scheduled task
  "Ambient dashboard refresh (every 6 h)" - it had not saved anything between 17 and 21 Nov; check its last run.
- Tracker: GitHub Actions "track" every 6 h (cron 17 */6 UTC; GitHub sometimes skips a run). Run it now with:
  gh api -X POST repos/ashish91aggarwal-alt/AI/actions/workflows/ambient-track.yml/dispatches -f ref=main
  then git pull and read data/mirror/pets/videos.json.
- Master video: owner's laptop Downloads\PawsNooks_4K_v2\PawsNooks_SleepyCat_4K_v2.mp4 (the cloud workspace
  copy does not carry over to a new chat). Art: Downloads\PawsNooks_4K\art\.
- Browser: built-in browser on the owner's laptop, Studio already signed in on Paws & Nooks.
  Never let the video play (it adds views): if a watch page must be opened, pause it at once.

## Watch time through an API
Only the read-only Data API key is set up (views, likes, comments). Watch time / retention / CTR need YouTube
Analytics OAuth (docs/apis.md, Level 3) - needs a one-time Google sign-in by the owner. Until then read Studio.

## Next steps
1. Tue 24 Nov: first 48 h read (impressions, CTR, AVD, traffic sources). Decide on thumbnail/title tweaks only then.
2. Plan video 2: 3 h ("3 Hours" in title), optional soft purr layer, story caption + keyword tail, a new animal
   and a new place (e.g. a dog by the fireplace or a cat in a rainy window nook), uneven 10-15 min original
   compositions, no loops that line up. Ask before any paid GPU spend; every pod budget-bounded with auto-kill.
3. Optional: set up YouTube Analytics OAuth so watch time fills the dashboard daily.

## Starter prompt for a new chat (in the "PawsNook - YT" project)
"Read the project docs, then clone github.com/ashish91aggarwal-alt/AI and work in ambient-channels/ (role:
orchestrator) and read production/HANDOFF_paws_nooks.md. Then: <what you want next>."
