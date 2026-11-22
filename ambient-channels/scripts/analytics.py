#!/usr/bin/env python3
"""Own-channel analytics via YouTube Analytics API (Level 3 in docs/apis.md).

Needs secrets YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN (from scripts/oauth_setup.py).
Skips quietly (exit 0) when they are missing, so the workflow stays green before setup.
Writes data/own/daily.csv (per channel per day) and data/own/videos.csv (per video, last 28 days).
"""
import csv, datetime as dt, json, os, sys, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "own"


def token():
    body = urllib.parse.urlencode({"client_id": os.environ["YT_CLIENT_ID"], "client_secret": os.environ["YT_CLIENT_SECRET"],
                                   "refresh_token": os.environ["YT_REFRESH_TOKEN"], "grant_type": "refresh_token"}).encode()
    with urllib.request.urlopen("https://oauth2.googleapis.com/token", body, timeout=30) as r:
        return json.loads(r.read())["access_token"]


def call(tok, url, **params):
    req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params), headers={"Authorization": f"Bearer {tok}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def report(tok, channel_id, start, end, metrics, dimensions, **extra):
    d = call(tok, "https://youtubeanalytics.googleapis.com/v2/reports", ids=f"channel=={channel_id}",
             startDate=start, endDate=end, metrics=metrics, dimensions=dimensions, **extra)
    cols = [h["name"] for h in d.get("columnHeaders", [])]
    return [dict(zip(cols, row)) for row in d.get("rows", [])]


def main():
    if not all(os.environ.get(k) for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN")):
        print("analytics: OAuth secrets not set — skipping (see docs/apis.md Level 3)")
        return
    chans = [c for c in json.loads((ROOT / "config" / "channels.json").read_text())["channels"] if c.get("channel_id")]
    if not chans:
        print("analytics: no own channel_id in config/channels.json yet — skipping")
        return
    tok = token()
    end = dt.date.today() - dt.timedelta(days=1)
    start = end - dt.timedelta(days=90)
    OUT.mkdir(parents=True, exist_ok=True)
    daily_rows, video_rows = [], []
    m_daily = "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments"
    for c in chans:
        try:
            for r in report(tok, c["channel_id"], start.isoformat(), end.isoformat(), m_daily, "day"):
                daily_rows.append({"channel": c["slug"], **r})
            for r in report(tok, c["channel_id"], (end - dt.timedelta(days=27)).isoformat(), end.isoformat(),
                            "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,subscribersGained",
                            "video", sort="-views", maxResults=200):
                video_rows.append({"channel": c["slug"], **r})
        except Exception as e:
            print(f"analytics: {c['slug']} failed: {e}", file=sys.stderr)
    for name, rows in (("daily.csv", daily_rows), ("videos.csv", video_rows)):
        if rows:
            keys = list(dict.fromkeys(k for r in rows for k in r))
            with (OUT / name).open("w", newline="") as f:
                w = csv.DictWriter(f, fieldnames=keys)
                w.writeheader()
                w.writerows(rows)
    print(f"analytics: {len(daily_rows)} daily rows, {len(video_rows)} video rows")


if __name__ == "__main__":
    main()
