#!/usr/bin/env python3
"""Competitor + own-channel tracker. Runs in GitHub Actions every 6 h (track.yml).

Level 1 (no setup): YouTube RSS (latest 15 videos: views, likes) + public channel page
(subscribers, video count).  Level 2: if $YOUTUBE_API_KEY is set, the Data API replaces
both with exact numbers and adds comments + duration.

Writes:
  data/latest.json                 full current picture (read by dashboard + agents)
  data/snapshots/YYYY-MM-DD.json   last run of each day
  data/history/channels.csv        append: ts, channel_id, name, lane, subs, video_count
  data/history/videos.csv          append: ts, video_id, channel_id, views, likes, comments
Usage: track.py [--seed FILE]   (--seed builds from a browser-captured seed instead of fetching)
Standard library only.
"""
import argparse, csv, datetime as dt, json, os, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36")


def now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0)

def iso(t):
    return t.isoformat().replace("+00:00", "Z")

def get(url, tries=3):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9",
                                               "Cookie": "SOCS=CAI; CONSENT=YES+1"})
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            if i == tries - 1:
                raise
            time.sleep(2 + 3 * i)

def num(s):
    """'23.1K' -> 23100, '1.2M' -> 1200000, '1,234' -> 1234."""
    if s in (None, ""):
        return None
    s = str(s).replace(",", "").strip()
    mult = 1
    if s[-1:] in "KMB":
        mult = {"K": 1e3, "M": 1e6, "B": 1e9}[s[-1]]
        s = s[:-1]
    try:
        return int(round(float(s) * mult))
    except ValueError:
        return None

def unescape(s):
    return (s.replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'")
             .replace("&lt;", "<").replace("&gt;", ">"))


# ---------- Level 1 ----------
def rss_videos(channel_id):
    x = get(f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}")
    out = []
    for e in x.split("<entry>")[1:]:
        g = lambda pat: (re.search(pat, e, re.S) or [None, None])[1]
        out.append({"id": g(r"<yt:videoId>(.*?)<"), "title": unescape(g(r"<title>(.*?)</title>") or ""),
                    "published": g(r"<published>(.*?)<"), "views": int(g(r'views="(\d+)"') or 0),
                    "likes": int(g(r'starRating count="(\d+)"') or 0), "comments": None, "duration_s": None})
    return out

def page_counts(channel_id):
    s = get(f"https://www.youtube.com/channel/{channel_id}?hl=en&gl=US")
    subs = (re.search(r'"content":"([\d.,]+[KMB]?) subscribers?"', s) or [None, None])[1]
    vids = (re.search(r'"content":"([\d,]+) videos?"', s) or [None, None])[1]
    return num(subs), num(vids)


# ---------- Level 2 ----------
def api(path, **params):
    params["key"] = os.environ["YOUTUBE_API_KEY"]
    return json.loads(get(f"https://www.googleapis.com/youtube/v3/{path}?" + urllib.parse.urlencode(params)))

def iso_dur(s):
    m = re.match(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", s or "")
    if not m:
        return None
    d, h, mi, se = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + se

def api_enrich(channels):
    ids = [c["channel_id"] for c in channels]
    stats = {}
    for i in range(0, len(ids), 50):
        for it in api("channels", part="statistics", id=",".join(ids[i:i + 50]), maxResults=50).get("items", []):
            st = it["statistics"]
            stats[it["id"]] = (None if st.get("hiddenSubscriberCount") else int(st.get("subscriberCount", 0)),
                               int(st.get("videoCount", 0)), int(st.get("viewCount", 0)))
    vids = [v for c in channels for v in c["videos"]]
    vmap = {}
    for i in range(0, len(vids), 50):
        chunk = ",".join(v["id"] for v in vids[i:i + 50])
        for it in api("videos", part="statistics,contentDetails", id=chunk, maxResults=50).get("items", []):
            vmap[it["id"]] = it
    for c in channels:
        if c["channel_id"] in stats:
            c["subs"], c["video_count"], c["total_views"] = stats[c["channel_id"]]
        for v in c["videos"]:
            it = vmap.get(v["id"])
            if it:
                st = it["statistics"]
                v["views"] = int(st.get("viewCount", v["views"]))
                v["likes"] = int(st.get("likeCount", v["likes"]) or 0)
                v["comments"] = int(st.get("commentCount", 0) or 0)
                v["duration_s"] = iso_dur(it["contentDetails"].get("duration"))


# ---------- derived ----------
def derive(c, t):
    for v in c["videos"]:
        pub = dt.datetime.fromisoformat(v["published"].replace("Z", "+00:00")) if v.get("published") else t
        age = max((t - pub).total_seconds() / 86400, 0.25)
        v["age_days"] = round(age, 2)
        v["views_per_day"] = round(v["views"] / age, 1)
        v["like_rate"] = round(v["likes"] / v["views"], 4) if v["views"] else None
    vs = [v for v in c["videos"] if v["views"] >= 500]
    rates = sorted(v["like_rate"] for v in vs if v["like_rate"] is not None)
    vpd = sorted(v["views_per_day"] for v in c["videos"])
    c["median_like_rate"] = rates[len(rates) // 2] if rates else None
    c["median_views_per_day"] = vpd[len(vpd) // 2] if vpd else None
    pubs = sorted(v["published"] for v in c["videos"] if v.get("published"))
    if len(pubs) >= 2:
        span = (dt.datetime.fromisoformat(pubs[-1].replace("Z", "+00:00")) -
                dt.datetime.fromisoformat(pubs[0].replace("Z", "+00:00"))).total_seconds() / 86400
        c["uploads_per_week"] = round((len(pubs) - 1) / max(span, 1) * 7, 2)
    else:
        c["uploads_per_week"] = None
    c["last_upload"] = pubs[-1] if pubs else None
    # bought-views flag: big views with a like-rate far below a real audience
    c["paid_views_suspect"] = bool(c["median_like_rate"] is not None and c["median_like_rate"] < 0.004)


def targets():
    comp = json.loads((ROOT / "config" / "competitors.json").read_text())["competitors"]
    own = json.loads((ROOT / "config" / "channels.json").read_text())["channels"]
    rows = [dict(lane=c["lane"], name=c["name"], channel_id=c["channel_id"], own=False) for c in comp]
    rows += [dict(lane=o["slug"], name=o["working_name"], channel_id=o["channel_id"], own=True)
             for o in own if o.get("channel_id")]
    return rows


def write_outputs(channels, t, source):
    latest = {"generated_at": iso(t), "source": source, "channels": channels}
    (DATA / "snapshots").mkdir(parents=True, exist_ok=True)
    (DATA / "history").mkdir(parents=True, exist_ok=True)
    (DATA / "latest.json").write_text(json.dumps(latest, indent=1, ensure_ascii=False))
    (DATA / "snapshots" / f"{t.date()}.json").write_text(json.dumps(latest, ensure_ascii=False))
    ch_csv, v_csv = DATA / "history" / "channels.csv", DATA / "history" / "videos.csv"
    new_ch, new_v = not ch_csv.exists(), not v_csv.exists()
    with ch_csv.open("a", newline="") as f:
        w = csv.writer(f)
        if new_ch:
            w.writerow(["ts", "channel_id", "name", "lane", "own", "subs", "video_count"])
        for c in channels:
            if c.get("fetched_ok"):
                w.writerow([iso(t), c["channel_id"], c["name"], c["lane"], int(c["own"]), c.get("subs"), c.get("video_count")])
    with v_csv.open("a", newline="") as f:
        w = csv.writer(f)
        if new_v:
            w.writerow(["ts", "video_id", "channel_id", "views", "likes", "comments"])
        for c in channels:
            for v in c["videos"]:
                w.writerow([iso(t), v["id"], c["channel_id"], v["views"], v["likes"], v.get("comments")])
    ok = sum(1 for c in channels if c.get("fetched_ok"))
    print(f"tracked {ok}/{len(channels)} channels, {sum(len(c['videos']) for c in channels)} videos ({source})")
    return ok


def run_live():
    t = now()
    out = []
    for c in targets():
        c = dict(c, videos=[], subs=None, video_count=None, fetched_ok=False, error=None)
        try:
            c["videos"] = rss_videos(c["channel_id"])
            try:
                c["subs"], c["video_count"] = page_counts(c["channel_id"])
            except Exception as e:
                c["error"] = f"page: {e}"
            c["fetched_ok"] = True
        except Exception as e:
            c["error"] = f"rss: {e}"
        out.append(c)
        time.sleep(1)
    source = "rss+page"
    if os.environ.get("YOUTUBE_API_KEY"):
        try:
            api_enrich([c for c in out if c["fetched_ok"]])
            source = "youtube-data-api"
        except Exception as e:
            print(f"Data API failed, keeping RSS numbers: {e}", file=sys.stderr)
    for c in out:
        derive(c, t)
    if write_outputs(out, t, source) == 0:
        sys.exit("No channel fetched — failing so the workflow shows red.")


def run_seed(path):
    seed = json.loads(Path(path).read_text())
    t = dt.datetime.fromisoformat(seed["captured_at"].replace("Z", "+00:00"))
    lanes = {c["channel_id"]: c for c in targets()}
    out = []
    for s in seed["channels"]:
        meta = lanes.get(s["id"], {"lane": s.get("niche", "?"), "name": s["name"], "own": False})
        vids = [{"id": v[0], "title": v[1], "published": v[2] + "T12:00:00Z", "views": v[3], "likes": v[4],
                 "comments": None, "duration_s": None} for v in s["v"]]
        c = dict(lane=meta["lane"], name=meta["name"], channel_id=s["id"], own=meta.get("own", False),
                 subs=num(s.get("subs")), video_count=num(s.get("vids")), videos=vids, fetched_ok=True, error=None)
        derive(c, t)
        out.append(c)
    write_outputs(out, t, "browser-seed")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed")
    a = ap.parse_args()
    run_seed(a.seed) if a.seed else run_live()
