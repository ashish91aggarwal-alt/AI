"""Offline test for scripts/mirror.py with a fake YouTube Data API.
Response shapes copied from a real API call on 2026-11-17 (Grove of Stillness)."""
import json, os, sys, tempfile, unittest, urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import mirror  # noqa: E402

OWNER = "UCiMbdDO1u-07S42etpig2ig"


def c(cid, author, text, likes, ts, parent=None, owner=False):
    s = {"authorChannelId": {"value": OWNER if owner else "UCx" + author}, "authorDisplayName": "@" + author,
         "authorProfileImageUrl": "https://yt3.ggpht.com/a=s48", "authorChannelUrl": "http://www.youtube.com/@" + author,
         "likeCount": likes, "publishedAt": ts, "updatedAt": ts, "textDisplay": text, "textOriginal": text,
         "videoId": "vid1"}
    if parent:
        s["parentId"] = parent
    return {"kind": "youtube#comment", "id": cid, "snippet": s}


class FakeAPI:
    def __init__(self, new_channel=False):
        self.calls = []
        self.new_channel = new_channel

    def __call__(self, url):
        u = urllib.parse.urlparse(url)
        path = u.path.rsplit("/", 1)[1]
        q = dict(urllib.parse.parse_qsl(u.query))
        assert q["key"] == "test-key"
        self.calls.append((path, q))
        if path == "channels":
            return json.dumps({"items": [{"id": OWNER, "snippet": {
                "title": "Page & Lantern", "customUrl": "@pageandlantern", "description": "Cozy fantasy music",
                "publishedAt": "2026-11-17T10:38:00Z",
                "thumbnails": {"high": {"url": "https://yt3.ggpht.com/av=s800"}}},
                "statistics": {"hiddenSubscriberCount": False, "subscriberCount": "12", "videoCount": "2", "viewCount": "345"},
                "brandingSettings": {"image": {"bannerExternalUrl": "https://yt3.googleusercontent.com/bn"}},
                "contentDetails": {"relatedPlaylists": {"uploads": "UUiMbdDO1u-07S42etpig2ig"}}}]})
        if path == "playlistItems":
            if self.new_channel:
                raise Exception("HTTP Error 404: Not Found")
            if "pageToken" not in q:
                return json.dumps({"items": [{"contentDetails": {"videoId": "vid1"}}], "nextPageToken": "P2"})
            return json.dumps({"items": [{"contentDetails": {"videoId": "vid2"}}]})
        if path == "videos":
            assert q["id"] == "vid1,vid2"
            mk = lambda vid, t, cm: {"id": vid, "snippet": {"title": "Snowy Elven Inn " + vid, "description": "d", "tags": ["fantasy"],
                                                             "publishedAt": t, "thumbnails": {"maxres": {"url": f"https://i.ytimg.com/vi/{vid}/maxresdefault.jpg"}},
                                                             "liveBroadcastContent": "none"},
                                     "statistics": {"viewCount": "100", "likeCount": "7", "commentCount": cm},
                                     "contentDetails": {"duration": "PT2H5M19S"},
                                     "status": {"privacyStatus": "public", "madeForKids": False}}
            return json.dumps({"items": [mk("vid1", "2026-11-26T14:00:00Z", "3"), mk("vid2", "2026-11-27T14:00:00Z", "0")]})
        if path == "commentThreads":
            assert q["videoId"] == "vid1", "vid2 has 0 comments and must not be fetched"
            if "pageToken" not in q:
                return json.dumps({"items": [{"snippet": {"topLevelComment": c("T1", "reader", "Perfect for my D&D night", 4,
                                                                               "2026-11-26T20:00:00Z"), "totalReplyCount": 6},
                                              "replies": {"comments": [c("T1.r1", "x", "same", 0, "2026-11-26T21:00:00Z", "T1")]}}],
                                   "nextPageToken": "C2"})
            return json.dumps({"items": [{"snippet": {"topLevelComment": c("T2", "sleepy", "Fell asleep in minutes", 1,
                                                                           "2026-11-27T01:00:00Z"), "totalReplyCount": 0}}]})
        if path == "comments":
            assert q["parentId"] == "T1"
            if "pageToken" not in q:
                return json.dumps({"items": [c(f"T1.r{i}", "x", f"r{i}", 0, f"2026-11-26T2{i}:00:00Z", "T1") for i in (3, 2, 1)],
                                   "nextPageToken": "R2"})
            return json.dumps({"items": [c("T1.r4", "pl", "Thank you!", 2, "2026-11-26T23:30:00Z", "T1", owner=True),
                                         c("T1.r5", "x", "r5", 0, "2026-11-26T23:40:00Z", "T1"),
                                         c("T1.r6", "x", "r6", 0, "2026-11-26T23:50:00Z", "T1")]})
        raise AssertionError(path)


class MirrorTest(unittest.TestCase):
    def run_mirror(self, fake):
        tmp = Path(tempfile.mkdtemp())
        (tmp / "config").mkdir()
        (tmp / "config" / "channels.json").write_text(json.dumps({"channels": [
            {"slug": "fantasy", "working_name": "Page & Lantern", "channel_id": OWNER, "handle": "@PageAndLantern"},
            {"slug": "worship", "working_name": "Prayer Pastures", "channel_id": None}]}))
        mirror.ROOT, mirror.OUT, mirror.FETCH = tmp, tmp / "data" / "mirror", fake
        self.images = []
        mirror.FETCH_BYTES = lambda url: self.images.append(url) or b"\xff\xd8jpeg" + url.encode()
        os.environ["YOUTUBE_API_KEY"] = "test-key"
        self.assertEqual(mirror.main(), 0)
        return tmp / "data" / "mirror" / "fantasy"

    def test_full_mirror(self):
        d = self.run_mirror(FakeAPI())
        ch = json.loads((d / "channel.json").read_text())
        self.assertEqual((ch["title"], ch["subs"], ch["video_count"], ch["source"]), ("Page & Lantern", 12, 2, "youtube-data-api"))
        self.assertTrue(ch["banner"].startswith("https://yt3.googleusercontent.com/bn=w2560"))
        vids = json.loads((d / "videos.json").read_text())
        self.assertEqual([v["id"] for v in vids], ["vid2", "vid1"])          # newest first
        self.assertEqual(vids[1]["duration_s"], 2 * 3600 + 5 * 60 + 19)
        com = json.loads((d / "comments.json").read_text())
        self.assertEqual(com["vid2"], [])
        t1 = com["vid1"][0]
        self.assertEqual(len(com["vid1"]), 2)                                 # both pages of threads
        self.assertEqual([r["id"] for r in t1["replies"]], [f"T1.r{i}" for i in range(1, 7)])  # all 6, oldest first
        self.assertTrue(next(r for r in t1["replies"] if r["id"] == "T1.r4")["is_owner"])
        self.assertEqual(len((d / "video_stats.csv").read_text().strip().splitlines()), 3)
        self.assertTrue((d / "img" / "v_vid1.jpg").exists() and (d / "img" / "channel_avatar.jpg").exists())
        self.assertEqual(vids[1]["thumb_file"], "v_vid1.jpg")
        self.assertTrue(all(x["avatar_file"].startswith("a_") for x in [t1] + t1["replies"]))
        self.assertIn("https://yt3.ggpht.com/av=s240-c-k-c0x00ffffff-no-rj", self.images)

    def test_new_channel_without_uploads(self):
        d = self.run_mirror(FakeAPI(new_channel=True))
        self.assertEqual(json.loads((d / "videos.json").read_text()), [])
        self.assertEqual(json.loads((d / "comments.json").read_text()), {})

    def test_deleted_comment_disappears(self):
        fake = FakeAPI()
        d = self.run_mirror(fake)
        orig = fake.__call__

        def without_t2(url):
            out = orig(url)
            return out.replace('"T2"', '"T2-gone"') if "pageToken=C2" in url else out
        mirror.FETCH = without_t2
        mirror.main()
        ids = [t["id"] for t in json.loads((d / "comments.json").read_text())["vid1"]]
        self.assertNotIn("T2", ids)


if __name__ == "__main__":
    unittest.main()
