#!/usr/bin/env python3
"""Mirror of OUR OWN channels: everything a visitor sees on the channel and video pages,
fetched through the YouTube Data API so nobody has to open YouTube (API reads never count
as views or watch time).

For each channel in config/channels.json that has a channel_id:
  channel   title, handle, description, avatar, banner, subscribers, views, video count
  videos    every upload: title, description, tags, thumbnail, duration, privacy,
            views, likes, comment count
  comments  every public comment thread with all replies (author, avatar, text, likes, time)

Writes (latest snapshot REPLACES the previous one, so a comment its author deleted
disappears here too, as YouTube's API policies require):
  data/mirror/<slug>/channel.json
  data/mirror/<slug>/videos.json
  data/mirror/<slug>/comments.json      {video_id: [thread, ...]}
and appends numbers to history:
  data/mirror/<slug>/video_stats.csv    ts, video_id, views, likes, comments

Needs $YOUTUBE_API_KEY (docs/apis.md Level 2). Without it, falls back to the public RSS feed
and channel page (latest 15 videos, no comments) and says so in channel.json.
Quota: ~1 unit per call; a 100-video channel with comments costs ~150 units of 10,000/day.
Standard library only.
"""
import base64, csv, hashlib, json, os, sys, urllib.parse, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import track  # reuse get(), iso_dur(), rss_videos(), page_counts(), now(), iso()

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "mirror"
MAX_VIDEOS = 500
MAX_THREAD_PAGES = 20          # 100 threads per page
FETCH = track.get              # swapped out in tests


def fetch_bytes(url):
    req = urllib.request.Request(url, headers={"User-Agent": track.UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


FETCH_BYTES = fetch_bytes     # swapped out in tests


def cache_images(d, ch, vids, comments):
    """The dashboard page may not load remote images, so keep small local copies:
    video thumbnails (480x360), channel avatar (240), banner (1280 wide), commenter avatars (48).
    Files live in data/mirror/<slug>/img/; export_dashboard.py inlines them as data: URIs."""
    img = d / "img"
    img.mkdir(parents=True, exist_ok=True)
    keep = set()

    def get(url, name, refresh=False):
        if not url:
            return ""
        f = img / name
        keep.add(name)
        if f.exists() and not refresh:
            return name
        try:
            b = FETCH_BYTES(url)
            if b and (not f.exists() or f.read_bytes() != b):
                f.write_bytes(b)
            return name
        except Exception as e:
            print(f"mirror: image skipped ({e}): {url[:60]}", file=sys.stderr)
            return name if f.exists() else ""

    sized = lambda u, spec: u.split("=")[0] + "=" + spec if "ggpht.com" in u or "googleusercontent" in u else u
    ch["avatar_file"] = get(sized(ch.get("avatar", ""), "s240-c-k-c0x00ffffff-no-rj"), "channel_avatar.jpg", refresh=True)
    ch["banner_file"] = get(sized(ch.get("banner", ""), "w1280-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj"),
                            "channel_banner.jpg", refresh=True)
    for v in vids:          # re-fetched each run so a changed custom thumbnail shows up
        v["thumb_file"] = get(f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg", f"v_{v['id']}.jpg", refresh=True)
    for threads in comments.values():
        for t in threads:
            for x in [t] + t.get("replies", []):
                u = sized(x.get("author_avatar", ""), "s48-c-k-c0x00ffffff-no-rj")
                x["avatar_file"] = get(u, "a_" + hashlib.sha1(u.encode()).hexdigest()[:16] + ".jpg") if u else ""
    for f in img.iterdir():  # drop images nothing points at any more (deleted videos/comments)
        if f.name not in keep:
            f.unlink()


def api(path, **params):
    params["key"] = os.environ["YOUTUBE_API_KEY"]
    return json.loads(FETCH(f"https://www.googleapis.com/youtube/v3/{path}?" + urllib.parse.urlencode(params)))


def pick_thumb(th):
    for k in ("maxres", "standard", "high", "medium", "default"):
        if th.get(k):
            return th[k]["url"]
    return ""


def comment(c, owner_id):
    s = c["snippet"]
    return {"id": c["id"], "parent_id": s.get("parentId"),
            "author": s.get("authorDisplayName", ""), "author_avatar": s.get("authorProfileImageUrl", ""),
            "author_url": s.get("authorChannelUrl", ""),
            "is_owner": (s.get("authorChannelId") or {}).get("value") == owner_id,
            "text": s.get("textOriginal") or s.get("textDisplay", ""), "likes": int(s.get("likeCount", 0)),
            "published": s.get("publishedAt"), "updated": s.get("updatedAt")}


def fetch_channel(channel_id):
    it = api("channels", part="snippet,statistics,brandingSettings,contentDetails", id=channel_id)["items"][0]
    sn, st, br = it["snippet"], it["statistics"], it.get("brandingSettings", {})
    banner = (br.get("image") or {}).get("bannerExternalUrl", "")
    return {"channel_id": channel_id, "title": sn["title"], "handle": sn.get("customUrl", ""),
            "description": sn.get("description", ""), "avatar": pick_thumb(sn.get("thumbnails", {})),
            "banner": banner + "=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj" if banner else "",
            "country": sn.get("country", ""), "created": sn.get("publishedAt"),
            "subs": None if st.get("hiddenSubscriberCount") else int(st.get("subscriberCount", 0)),
            "views": int(st.get("viewCount", 0)), "video_count": int(st.get("videoCount", 0)),
            "keywords": (br.get("channel") or {}).get("keywords", ""),
            "uploads": it["contentDetails"]["relatedPlaylists"]["uploads"]}


def fetch_videos(uploads):
    ids, token = [], None
    while len(ids) < MAX_VIDEOS:
        p = {"part": "contentDetails", "playlistId": uploads, "maxResults": 50}
        if token:
            p["pageToken"] = token
        try:
            d = api("playlistItems", **p)
        except Exception as e:           # a brand-new channel has no uploads playlist yet (404)
            if "404" in str(e):
                break
            raise
        ids += [i["contentDetails"]["videoId"] for i in d.get("items", [])]
        token = d.get("nextPageToken")
        if not token:
            break
    vids = []
    for i in range(0, len(ids), 50):
        for it in api("videos", part="snippet,statistics,contentDetails,status", id=",".join(ids[i:i + 50]))["items"]:
            sn, st, cd, ss = it["snippet"], it.get("statistics", {}), it["contentDetails"], it.get("status", {})
            vids.append({"id": it["id"], "title": sn["title"], "description": sn.get("description", ""),
                         "tags": sn.get("tags", []), "published": sn.get("publishedAt"),
                         "thumb": pick_thumb(sn.get("thumbnails", {})), "duration_s": track.iso_dur(cd.get("duration")),
                         "privacy": ss.get("privacyStatus"), "made_for_kids": ss.get("madeForKids"),
                         "views": int(st.get("viewCount", 0)), "likes": int(st.get("likeCount", 0) or 0),
                         "comments": int(st.get("commentCount", 0) or 0), "live": sn.get("liveBroadcastContent")})
    vids.sort(key=lambda v: v["published"] or "", reverse=True)
    return vids


def fetch_comments(video_id, owner_id):
    threads, token = [], None
    for _ in range(MAX_THREAD_PAGES):
        p = {"part": "snippet,replies", "videoId": video_id, "maxResults": 100, "order": "time", "textFormat": "plainText"}
        if token:
            p["pageToken"] = token
        try:
            d = api("commentThreads", **p)
        except Exception as e:           # comments turned off, or video not public yet
            if "403" in str(e) or "404" in str(e):
                return threads
            raise
        for t in d.get("items", []):
            top = comment(t["snippet"]["topLevelComment"], owner_id)
            replies = [comment(r, owner_id) for r in (t.get("replies") or {}).get("comments", [])]
            total = t["snippet"].get("totalReplyCount", 0)
            if total > len(replies):     # the thread only carries up to 5 replies; fetch the rest
                replies, rt = [], None
                while True:
                    q = {"part": "snippet", "parentId": top["id"], "maxResults": 100, "textFormat": "plainText"}
                    if rt:
                        q["pageToken"] = rt
                    rd = api("comments", **q)
                    replies += [comment(r, owner_id) for r in rd.get("items", [])]
                    rt = rd.get("nextPageToken")
                    if not rt:
                        break
            replies.sort(key=lambda r: r["published"] or "")
            top["replies"] = replies
            top["reply_count"] = total
            threads.append(top)
        token = d.get("nextPageToken")
        if not token:
            break
    return threads


def fallback(cfg_channel):
    """No API key: RSS (latest 15) + channel page counts. No comments."""
    cid = cfg_channel["channel_id"]
    try:
        subs, vc = track.page_counts(cid)
    except Exception:
        subs = vc = None
    try:
        rss = track.rss_videos(cid)
    except Exception:            # a channel with no uploads has no feed yet
        rss = []
    vids = [{"id": v["id"], "title": v["title"], "description": "", "tags": [], "published": v["published"],
             "thumb": f"https://i.ytimg.com/vi/{v['id']}/hqdefault.jpg", "duration_s": None, "privacy": "public",
             "views": v["views"], "likes": v["likes"], "comments": None} for v in rss]
    ch = {"channel_id": cid, "title": cfg_channel["working_name"], "handle": cfg_channel.get("handle", ""),
          "description": "", "avatar": "", "banner": "", "subs": subs, "views": None, "video_count": vc}
    return ch, vids


def write_json(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=1, ensure_ascii=False) + "\n")


def main():
    cfg = json.loads((ROOT / "config" / "channels.json").read_text())
    chans = [c for c in cfg["channels"] if c.get("channel_id")]
    if not chans:
        print("mirror: no own channel_id in config/channels.json yet — skipping")
        return 0
    t = track.iso(track.now())
    has_key = bool(os.environ.get("YOUTUBE_API_KEY"))
    failures = 0
    for c in chans:
        d = OUT / c["slug"]
        try:
            if has_key:
                ch = fetch_channel(c["channel_id"])
                vids = fetch_videos(ch.pop("uploads"))
                prev = {}
                if (d / "comments.json").exists():
                    prev = json.loads((d / "comments.json").read_text())
                comments = {}
                for v in vids:
                    if v["comments"] == 0 and v["privacy"] == "public":
                        comments[v["id"]] = []
                    else:
                        comments[v["id"]] = fetch_comments(v["id"], c["channel_id"])
                source = "youtube-data-api"
            else:
                ch, vids = fallback(c)
                comments = {}
                source = "rss+page (no API key: add YOUTUBE_API_KEY for comments and full stats)"
        except Exception as e:
            failures += 1
            print(f"mirror: {c['slug']} failed: {e}", file=sys.stderr)
            continue
        ch.update({"slug": c["slug"], "lane": c.get("lane", c["slug"]), "fetched_at": t, "source": source})
        cache_images(d, ch, vids, comments)
        write_json(d / "channel.json", ch)
        write_json(d / "videos.json", vids)
        write_json(d / "comments.json", comments)
        hist = d / "video_stats.csv"
        new = not hist.exists()
        with hist.open("a", newline="") as f:
            w = csv.writer(f)
            if new:
                w.writerow(["ts", "video_id", "views", "likes", "comments"])
            for v in vids:
                w.writerow([t, v["id"], v["views"], v["likes"], "" if v["comments"] is None else v["comments"]])
        n_com = sum(1 + len(x["replies"]) for th in comments.values() for x in th)
        print(f"mirror: {c['slug']} — {len(vids)} videos, {n_com} comments ({source.split(' ')[0]})")
    return 1 if failures == len(chans) else 0


if __name__ == "__main__":
    sys.exit(main())
