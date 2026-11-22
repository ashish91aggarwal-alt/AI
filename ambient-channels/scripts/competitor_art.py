"""Keep local copies of the lane competitors' channel avatars and banners, for the brand gate's
side-by-side benchmark (docs/quality-bar.md step 2). Runs in the tracker workflow; refreshes a
channel's files at most once a week. Needs $YOUTUBE_API_KEY; skips quietly without it.

Writes data/competitors/<lane>/<channel_id>_avatar.jpg (176 px), _banner.jpg (1280 wide),
and data/competitors/index.json (name, lane, subs, files).
"""
import json, os, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "competitors"
WEEK = 7 * 86400
UA = "Mozilla/5.0 (ambient-channels tracker)"


def fetch(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        b = r.read()
    return b if binary else json.loads(b)


def main():
    key = os.environ.get("YOUTUBE_API_KEY")
    if not key:
        print("competitor_art: no API key, skipped")
        return
    latest = json.loads((ROOT / "data" / "latest.json").read_text())
    chans = [c for c in latest["channels"] if not c.get("own") and c.get("channel_id")]
    idx_path = OUT / "index.json"
    idx = json.loads(idx_path.read_text()) if idx_path.exists() else {}
    due = [c for c in chans if time.time() - idx.get(c["channel_id"], {}).get("fetched", 0) > WEEK]
    for i in range(0, len(due), 50):
        batch = due[i:i + 50]
        q = urllib.parse.urlencode({"part": "snippet,statistics,brandingSettings",
                                    "id": ",".join(c["channel_id"] for c in batch), "key": key})
        items = {it["id"]: it for it in fetch("https://www.googleapis.com/youtube/v3/channels?" + q).get("items", [])}
        for c in batch:
            it = items.get(c["channel_id"])
            if not it:
                continue
            d = OUT / c["lane"]
            d.mkdir(parents=True, exist_ok=True)
            th = it["snippet"].get("thumbnails", {})
            av = (th.get("medium") or th.get("default") or {}).get("url", "")
            bn = it.get("brandingSettings", {}).get("image", {}).get("bannerExternalUrl", "")
            files = {}
            for kind, url in (("avatar", av), ("banner", bn + "=w1280-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj" if bn else "")):
                if not url:
                    continue
                try:
                    f = d / f"{c['channel_id']}_{kind}.jpg"
                    f.write_bytes(fetch(url, binary=True))
                    files[kind] = str(f.relative_to(ROOT))
                except Exception as e:
                    print("competitor_art:", c["name"], kind, e)
            idx[c["channel_id"]] = {"name": c["name"], "lane": c["lane"],
                                    "subs": int(it.get("statistics", {}).get("subscriberCount", 0) or 0),
                                    "files": files, "fetched": int(time.time())}
    OUT.mkdir(parents=True, exist_ok=True)
    idx_path.write_text(json.dumps(idx, indent=1))
    print(f"competitor_art: {len(due)} refreshed, {len(idx)} channels on file")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:          # never break the tracker run
        print("competitor_art failed:", e)
