"""One-off lookup of YouTube videos for benchmark study (run in GitHub Actions, which can reach YouTube).
Usage: VIDEO_IDS="id1,id2" python3 scripts/video_lookup.py <name>
Writes data/lookups/<name>/videos.json (snippet, statistics, contentDetails, channel stats),
thumb_<id>.jpg (maxres or high), and transcript_<id>.txt when captions are available.
API reads never count as views."""
import json, os, sys, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
name = sys.argv[1] if len(sys.argv) > 1 else "lookup"
OUT = ROOT / "data" / "lookups" / name
OUT.mkdir(parents=True, exist_ok=True)
key = os.environ["YOUTUBE_API_KEY"]
ids = [i.strip() for i in os.environ["VIDEO_IDS"].split(",") if i.strip()]


def get(url, binary=False):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r:
        b = r.read()
    return b if binary else json.loads(b)


api = "https://www.googleapis.com/youtube/v3/"
vids = get(api + "videos?" + urllib.parse.urlencode({"part": "snippet,statistics,contentDetails,topicDetails", "id": ",".join(ids), "key": key}))["items"]
chans = {c["id"]: c for c in get(api + "channels?" + urllib.parse.urlencode(
    {"part": "snippet,statistics", "id": ",".join({v["snippet"]["channelId"] for v in vids}), "key": key}))["items"]}
for v in vids:
    v["channel"] = {"title": chans[v["snippet"]["channelId"]]["snippet"]["title"],
                    "subs": chans[v["snippet"]["channelId"]]["statistics"].get("subscriberCount"),
                    "videos": chans[v["snippet"]["channelId"]]["statistics"].get("videoCount"),
                    "created": chans[v["snippet"]["channelId"]]["snippet"].get("publishedAt")}
    th = v["snippet"]["thumbnails"]
    url = (th.get("maxres") or th.get("standard") or th.get("high"))["url"]
    (OUT / f"thumb_{v['id']}.jpg").write_bytes(get(url, True))
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        t = YouTubeTranscriptApi().fetch(v["id"])
        (OUT / f"transcript_{v['id']}.txt").write_text("\n".join(f"{int(s.start)//60:02d}:{int(s.start)%60:02d} {s.text}" for s in t))
    except Exception as e:
        print("no transcript", v["id"], type(e).__name__)
(OUT / "videos.json").write_text(json.dumps(vids, indent=1))
print(f"lookup {name}: {len(vids)} videos")
