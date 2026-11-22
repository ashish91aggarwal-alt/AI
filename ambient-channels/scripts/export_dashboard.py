#!/usr/bin/env python3
"""Turn repo state into the CSV files the dashboard reads (dashboard/export/).

channels.csv   one row per tracked channel (latest snapshot)
videos.csv     recent videos of every tracked channel, with views/day and outlier score
growth.csv     subscriber history (last reading per channel per day)
board.csv      production cards
sessions.csv   one row per role (status files)
own_daily.csv  own-channel daily analytics (empty until OAuth is set up)
insights.csv   research findings and content links per channel (config/insights/*.json)
Standard library only.
"""
import base64, csv, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dashboard" / "export"
GATES = ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7"]
GATE_NAMES = {"G0": "Concept", "G1": "Still image", "G2": "Motion", "G3": "Music & sound",
              "G4": "Render QA", "G5": "Package", "G6": "Publish", "G7": "21-day review"}
STAGES = ["idea", "concept", "assets", "render", "package", "ready", "published", "measured"]


def load(p, d=None):
    try:
        return json.loads(Path(p).read_text())
    except FileNotFoundError:
        return d


def write(name, header, rows):
    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / name).open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)
    return len(rows)


def main():
    latest = load(ROOT / "data" / "latest.json", {"channels": [], "generated_at": None})
    gen = latest.get("generated_at") or ""
    ch_rows, v_rows = [], []
    for c in latest["channels"]:
        vids = c.get("videos", [])
        med = c.get("median_views_per_day") or 0
        ch_rows.append([c["lane"], c["name"], c["channel_id"], int(c.get("own", False)), c.get("subs") or "",
                        c.get("video_count") or "", c.get("median_like_rate") if c.get("median_like_rate") is not None else "",
                        c.get("median_views_per_day") or "", c.get("uploads_per_week") or "", (c.get("last_upload") or "")[:10],
                        sum(v["views"] for v in vids), int(bool(c.get("paid_views_suspect"))), gen[:16].replace("T", " "),
                        f"https://www.youtube.com/channel/{c['channel_id']}"])
        for v in vids:
            v_rows.append([c["lane"], c["name"], int(c.get("own", False)), v["id"], v["title"], (v.get("published") or "")[:10],
                           v.get("age_days"), v["views"], v["likes"], v.get("like_rate") if v.get("like_rate") is not None else "",
                           v.get("views_per_day"), round(v["views_per_day"] / med, 2) if med else "",
                           f"https://www.youtube.com/watch?v={v['id']}"])
    n1 = write("channels.csv", ["lane", "channel", "channel_id", "own", "subs", "videos", "median_like_rate",
                                "median_views_per_day", "uploads_per_week", "last_upload", "recent_views", "paid_views_suspect",
                                "snapshot_utc", "url"], ch_rows)
    v_rows.sort(key=lambda r: -(r[10] or 0))
    n2 = write("videos.csv", ["lane", "channel", "own", "video_id", "title", "published", "age_days", "views", "likes",
                              "like_rate", "views_per_day", "outlier_x", "url"], v_rows)

    # growth: last reading per channel per day
    g = {}
    hist = ROOT / "data" / "history" / "channels.csv"
    if hist.exists():
        for r in csv.DictReader(hist.open()):
            if r["subs"]:
                g[(r["ts"][:10], r["channel_id"])] = [r["ts"][:10], r["name"], r["lane"], r["subs"]]
    n3 = write("growth.csv", ["date", "channel", "lane", "subs"], sorted(g.values()))

    # views over time per recent video (one point per tracker run) — for line charts
    meta = {v[3]: (v[1], v[0], v[4]) for v in v_rows}  # video_id -> (channel, lane, title)
    vh = []
    vhist = ROOT / "data" / "history" / "videos.csv"
    if vhist.exists():
        for r in csv.DictReader(vhist.open()):
            if r["video_id"] in meta:
                ch, lane, title = meta[r["video_id"]]
                vh.append([r["ts"][:16].replace("T", " "), r["video_id"], ch, lane, title, r["views"], r["likes"]])
    write("video_history.csv", ["ts", "video_id", "channel", "lane", "title", "views", "likes"], vh)

    board = []
    for p in sorted((ROOT / "production" / "cards").glob("*.json")):
        c = load(p)
        pend = [x for x in GATES if c["gates"].get(x, {}).get("state") != "pass"]
        passed = sum(1 for x in GATES if c["gates"].get(x, {}).get("state") == "pass")
        review = ",".join(x for x in GATES if c["gates"].get(x, {}).get("state") == "review")
        board.append([c["id"], c["channel"], c["title"], c["stage"],
                      STAGES.index(c["stage"]) if c["stage"] in STAGES else "", c.get("priority", ""), c.get("owner") or "",
                      (c.get("lease_until") or "")[:16].replace("T", " "), pend[0] if pend else "",
                      GATE_NAMES.get(pend[0], "") if pend else "", passed, review, c.get("publish_target") or "",
                      c.get("budget_usd", ""), round(sum(s.get("usd", 0) for s in c.get("spend", [])), 2),
                      c.get("youtube_id") or "", c.get("keyword") or "", c.get("duration_h", "")])
    n4 = write("board.csv", ["card", "channel", "title", "stage", "stage_index", "priority", "owner", "lease_until",
                             "next_gate", "next_gate_name", "gates_passed", "in_review", "publish_target", "budget_usd",
                             "spent_usd", "youtube_id", "keyword", "duration_h"], board)

    cfg = load(ROOT / "config" / "channels.json", {"channels": []})
    roles = list(dict.fromkeys(["orchestrator", "reviewer"] + [c["role"] for c in cfg["channels"]]))
    sess = []
    for r in roles:
        s = load(ROOT / "status" / f"{r}.json", {})
        sess.append([r, (s.get("updated_at") or "")[:16].replace("T", " "), s.get("doing") or "", s.get("next") or "",
                     s.get("blocked") or "", s.get("session") or ""])
    n5 = write("sessions.csv", ["role", "updated_utc", "doing", "next", "blocked", "session"], sess)

    own = ROOT / "data" / "own" / "daily.csv"
    if own.exists():
        rows = list(csv.reader(own.open()))
        n6 = write("own_daily.csv", rows[0], rows[1:])
    else:
        n6 = write("own_daily.csv", ["channel", "day", "views", "estimatedMinutesWatched", "averageViewDuration",
                                     "subscribersGained", "subscribersLost", "likes", "comments"], [])
    n7 = export_mirror(cfg)
    ins = live_insights(cfg, latest)
    for p in sorted((ROOT / "config" / "insights").glob("*.json")):
        for r in load(p, {}).get("insights", []):
            ins.append([r.get("channel", ""), r.get("kind", ""), r.get("title", ""), flat(r.get("detail")),
                        r.get("metric", ""), r.get("link", ""), r.get("date", ""), r.get("source", "")])
    write("insights.csv", ["channel", "kind", "title", "detail", "metric", "link", "date", "source"], ins)
    print(f"export: channels {n1}, videos {n2}, growth {n3}, board {n4}, sessions {n5}, own_daily {n6}, mirror {n7}, insights {len(ins)}")


def live_insights(cfg, latest):
    """Insight rows worked out from the tracker and mirror data, so they change at every run (kind "live").
    For each of our channels: our public videos' numbers, then the lane's hottest competitor upload,
    the usual length of the lane's recent uploads, and the fastest small channel."""
    gen = (latest.get("generated_at") or "")[:16].replace("T", " ")
    src = f"tracker {gen} UTC" if gen else "tracker"
    rows = []
    for c in cfg["channels"]:
        slug = c["slug"]
        d = ROOT / "data" / "mirror" / slug
        ch = load(d / "channel.json") or {}
        for v in load(d / "videos.json", []) or []:
            if v.get("privacy") not in (None, "public"):
                continue
            age = None
            try:
                from datetime import datetime, timezone
                age = (datetime.now(timezone.utc) - datetime.fromisoformat(v["published"].replace("Z", "+00:00"))).total_seconds() / 86400
            except Exception:
                pass
            vpd = f" · {v['views'] / max(age, 0.25):,.0f} views/day" if age else ""
            rows.append(dict(channel=slug, kind="content", title=v["title"], link=f"https://youtu.be/{v['id']}",
                             metric=f"{v['views']:,} views",
                             detail=f"Live: {v['views']:,} views, {v['likes']:,} likes, {v.get('comments') or 0} comments{vpd}. "
                                    f"Channel: {ch.get('subs') if ch.get('subs') is not None else '—'} subscribers.",
                             date=(ch.get("fetched_at") or "")[:10], source="mirror " + (ch.get("fetched_at") or "")[:16].replace("T", " ") + " UTC"))
        comp = [x for x in latest.get("channels", []) if x.get("lane") == slug and not x.get("own")]
        vids = [(x, v) for x in comp for v in x.get("videos", [])]
        if not vids:
            continue
        x, v = max(vids, key=lambda p: p[1].get("views_per_day") or 0)
        rows.append(dict(channel=slug, kind="live", title=f"Hottest upload in the niche: {v['title']}",
                         link=f"https://www.youtube.com/watch?v={v['id']}", metric=f"{v['views_per_day']:,.0f} views/day",
                         detail=f"{x['name']} ({(x.get('subs') or 0):,} subs): {v['views']:,} views in {v.get('age_days')} days, "
                                f"{round((v.get('duration_s') or 0) / 3600, 1)} h long.",
                         date=gen[:10], source=src))
        lens = sorted(v["duration_s"] for _, v in vids if v.get("duration_s"))
        if lens:
            med = lens[len(lens) // 2] / 3600
            long3 = sum(1 for s in lens if s >= 2.9 * 3600)
            rows.append(dict(channel=slug, kind="live", title=f"Usual length right now: {med:.1f} h",
                             metric=f"median {med:.1f} h", link="",
                             detail=f"Median length of {len(lens)} recent uploads from {len(comp)} tracked channels; "
                                    f"{long3} of them are 3 h or longer.", date=gen[:10], source=src))
        small = [x for x in comp if (x.get("subs") or 0) < 50000 and x.get("median_views_per_day")]
        if small:
            s = max(small, key=lambda x: x["median_views_per_day"])
            rows.append(dict(channel=slug, kind="live", title=f"Fastest small channel: {s['name']}",
                             link=f"https://www.youtube.com/channel/{s['channel_id']}", metric=f"{s['median_views_per_day']:,.0f} views/day",
                             detail=f"{(s.get('subs') or 0):,} subscribers, median {s['median_views_per_day']:,.0f} views/day on recent uploads, "
                                    f"{s.get('uploads_per_week') or 0} uploads a week.", date=gen[:10], source=src))
    return [[r["channel"], r["kind"], r["title"], flat(r["detail"]), r["metric"], r["link"], r["date"], r["source"]] for r in rows]


def flat(s):
    """Dashboard CSVs keep one record per line: newlines become a literal \\n the page turns back."""
    return (s or "").replace("\r\n", "\n").replace("\n", "\\n")


def data_uri(d, name):
    """Local mirror image -> data: URI (the dashboard page may not load remote images)."""
    f = d / "img" / name if name else None
    if not f or not f.exists():
        return ""
    return "data:image/jpeg;base64," + base64.b64encode(f.read_bytes()).decode()


def export_mirror(cfg):
    """own_channel / own_videos / own_comments / own_video_history from data/mirror (scripts/mirror.py)."""
    ch_rows, v_rows, c_rows, h_rows = [], [], [], []
    for c in cfg["channels"]:
        d = ROOT / "data" / "mirror" / c["slug"]
        ch = load(d / "channel.json")
        if not ch:
            ch_rows.append([c["slug"], c.get("channel_id") or "", c["working_name"], c.get("handle", ""), "", "", "",
                            "", "", "", "", "", "not created yet" if not c.get("channel_id") else "waiting for first mirror run"])
            continue
        ch_rows.append([c["slug"], ch["channel_id"], ch["title"], ch.get("handle", ""), flat(ch.get("description")),
                        data_uri(d, ch.get("avatar_file")), data_uri(d, ch.get("banner_file")), "" if ch.get("subs") is None else ch["subs"],
                        "" if ch.get("views") is None else ch["views"], "" if ch.get("video_count") is None else ch["video_count"],
                        (ch.get("created") or "")[:10], (ch.get("fetched_at") or "")[:16].replace("T", " "), ch.get("source", "")])
        for v in load(d / "videos.json", []):
            v_rows.append([c["slug"], v["id"], v["title"], (v.get("published") or "")[:16].replace("T", " "),
                           v.get("duration_s") or "", v["views"], v["likes"], "" if v.get("comments") is None else v["comments"],
                           data_uri(d, v.get("thumb_file")), flat(v.get("description")), " · ".join(v.get("tags") or []), v.get("privacy") or ""])
        for vid, threads in (load(d / "comments.json", {}) or {}).items():
            for t in threads:
                for x in [t] + t.get("replies", []):
                    c_rows.append([c["slug"], vid, x["id"], x.get("parent_id") or "", x["author"], data_uri(d, x.get("avatar_file")),
                                   x.get("author_url", ""), int(bool(x.get("is_owner"))), flat(x["text"]), x["likes"],
                                   (x.get("published") or "")[:16].replace("T", " "), int(x.get("updated") != x.get("published")),
                                   t.get("reply_count", 0) if x is t else ""])
        hist = d / "video_stats.csv"
        if hist.exists():
            for r in csv.DictReader(hist.open()):
                h_rows.append([c["slug"], r["ts"][:16].replace("T", " "), r["video_id"], r["views"], r["likes"], r["comments"]])
    write("own_channel.csv", ["channel", "channel_id", "title", "handle", "description", "avatar", "banner", "subs",
                              "views", "video_count", "created", "fetched_utc", "source"], ch_rows)
    write("own_videos.csv", ["channel", "video_id", "title", "published_utc", "duration_s", "views", "likes", "comments",
                             "thumb", "description", "tags", "privacy"], v_rows)
    write("own_comments.csv", ["channel", "video_id", "comment_id", "parent_id", "author", "author_avatar", "author_url",
                               "is_owner", "text", "likes", "published_utc", "edited", "reply_count"], c_rows)
    write("own_video_history.csv", ["channel", "ts", "video_id", "views", "likes", "comments"], h_rows)
    return f"{len(ch_rows)} channels, {len(v_rows)} videos, {len(c_rows)} comments"


if __name__ == "__main__":
    main()
