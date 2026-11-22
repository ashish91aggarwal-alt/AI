# Dashboard

**Live dashboard:** https://claude.ai/artifact/6bzHxBKmyJjgW18DDj7g6j
(Claude "Data" artifact, slug `2d604a01-f6fd-43a7-9fb6-a56ed894a958`, private to the owner)

Tabs: Overview · Production · Competitors · Live videos · Our channels · Insights · Sessions.
Look: ambient hero with drifting embers, lane colours (ember = fantasy, tide = worship,
rose = pets / Paws & Nooks, violet = watch list), chips, KPI cards, competitor cards with sparklines, line charts
(weekly momentum, subscriber growth, views over time, our daily analytics).

## How data gets there
1. GitHub Actions `track` (every 6 h) and `status-guard` (every push) run
   `scripts/export_dashboard.py`, which writes `dashboard/export/*.csv`.
2. A daily Claude scheduled task ("Ambient dashboard refresh") uploads those CSVs to the
   artifact and points each dataset at the new upload. Any session can do the same by hand:

```
for each file F in dashboard/export/{channels,videos,growth,board,sessions,own_daily,video_history,own_channel,own_videos,own_comments,own_video_history,insights}.csv:
  upload_asset(slug, files=[{name: F, path: <abs path>}])         -> url /_blob/<id>
  db_get(slug, "datasets/<F without .csv>")                        -> version
  db_write(slug, [{op: "update", path: "datasets/<id>", ifVersion: version,
                   data: {source: {kind: "file", url, name: F, format: "csv"},
                          updated: {at: <now ISO>, by: "refresh: repo commit <short sha>"}}}])
```

Never rewrite `files/*` during a refresh. `dashboard/index.html`, `core.js` (helpers, calcs,
tabs) and `draw.js` (all drawings) in this repo are the reference copies of the page files; change the page only on purpose, then write it to
`files/index.html` in the artifact store (read the live one first — the owner may have
edited text with the pencil).

## Datasets
| id | file | from |
|---|---|---|
| channels | channels.csv | data/latest.json |
| videos | videos.csv | data/latest.json |
| growth | growth.csv | data/history/channels.csv |
| board | board.csv | production/cards/*.json |
| sessions | sessions.csv | status/*.json |
| own_daily | own_daily.csv | data/own/daily.csv (YouTube Analytics, Level 3) |
| video_history | video_history.csv | data/history/videos.csv (views per video at every tracker run) |
| own_channel | own_channel.csv | data/mirror/<slug>/channel.json (scripts/mirror.py) |
| own_videos | own_videos.csv | data/mirror/<slug>/videos.json |
| own_comments | own_comments.csv | data/mirror/<slug>/comments.json (newlines stored as a literal \\n) |
| own_video_history | own_video_history.csv | data/mirror/<slug>/video_stats.csv |
| insights | insights.csv | live rows from data/latest.json + data/mirror (our public videos' numbers, hottest niche upload, usual length, fastest small channel; rebuilt every tracker run) + config/insights/*.json (hand-written research findings) |

Page files: `index.html`, `core.js`, `draw.js`, `yt.js` (the YouTube-style "Our channels" mirror).
