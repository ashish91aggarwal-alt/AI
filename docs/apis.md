# Tracking & APIs

Tracking runs on **GitHub Actions** (`.github/workflows/track.yml`) every 6 hours,
free, no machine of yours needs to be on. It works in three levels — each level
adds data, nothing breaks if a level isn't set up.

## Level 1 — no setup (works now)
- YouTube public RSS feed per channel → latest 15 videos: views, likes, publish time.
- Public channel page → subscriber and video counts.
- Covers every competitor in `config/competitors.json` and your own channels once their
  `channel_id` is filled in `config/channels.json`.

## Level 2 — YouTube Data API key (free, 5 min, recommended)
More accurate counts, comment counts, durations, and stats beyond the latest 15 videos.
1. console.cloud.google.com → new project "ambient-channels".
2. APIs & Services → Library → enable **YouTube Data API v3**.
3. Credentials → Create credentials → API key. Restrict it to YouTube Data API v3.
4. GitHub repo → Settings → Secrets and variables → Actions → New secret
   `YOUTUBE_API_KEY`.
Free quota is 10,000 units/day; our run uses ~60 units → ~240/day at 4 runs.

**Status (17 Nov 2026):** key `tracker-youtube-data` created in Google Cloud project
`ambient-channels-515010`, restricted to YouTube Data API v3. It goes live once the owner adds
it as the GitHub secret `YOUTUBE_API_KEY`.

### Own-channel mirror (`scripts/mirror.py`, same key)
Copies our own channel pages (header, every video, stats, every comment and reply) into
`data/mirror/<slug>/` every 6 hours; the dashboard's "Our channels" tab shows it laid out like
YouTube. API reads are not views. Each run replaces the comment snapshot, so a comment its
author deleted disappears here too (YouTube API policy: keep API data fresh, drop what is gone).

## Level 3 — YouTube Analytics for your own channels (after channels exist)
Watch time, average view duration, CTR-adjacent metrics, subscribers gained, and
(with monetisation) estimated revenue. Needs a one-time OAuth consent by you.
1. Same Google Cloud project → enable **YouTube Analytics API** and **YouTube Data API v3**.
2. OAuth consent screen → External → add yourself as test user.
3. Credentials → OAuth client ID → **Desktop app**. Download the JSON.
4. On your computer: `python3 scripts/oauth_setup.py client_secret.json` → it opens
   the browser, you approve, it prints a refresh token.
5. Add secrets `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN` (one set per
   Google account; if channels are Brand Accounts under one login, one set covers them).

## Optional later
- vidIQ (already connected in Claude) for keyword volume — credits refill monthly.
- Google Analytics only matters if we add a website; not needed for YouTube.
