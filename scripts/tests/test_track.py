"""Offline tests for the tracker parsers. Run: python3 scripts/tests/test_track.py"""
import sys, datetime as dt
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import track

FEED = (Path(__file__).parent / "fixture_feed.xml").read_text()
PAGE = '..."metadataParts":[{"text":{"content":"35.7K subscribers"}},{"text":{"content":"30 videos"}}]...'

track.get = lambda url, tries=3: FEED if "feeds/videos.xml" in url else PAGE
v = track.rss_videos("UCL2pjCRWsaRrLks12WJ3Zxg")
assert len(v) == 2, v
assert v[0]["id"] == "8tuPQxbvyrU" and v[0]["views"] == 54191 and v[0]["likes"] == 1284, v[0]
assert v[1]["title"].startswith("Vintage Christmas Manor 🎄 Cozy Christmas Jazz & Crackling"), v[1]["title"]
assert track.page_counts("x") == (35700, 30)
assert track.num("1.2M") == 1200000 and track.num("934") == 934 and track.num("1,234") == 1234 and track.num(None) is None
c = {"videos": v}
track.derive(c, dt.datetime(2026, 11, 17, 9, tzinfo=dt.timezone.utc))
assert abs(c["videos"][1]["views_per_day"] / (241660 / c["videos"][1]["age_days"]) - 1) < 0.01
assert c["paid_views_suspect"] is False
print("track parser tests passed")
