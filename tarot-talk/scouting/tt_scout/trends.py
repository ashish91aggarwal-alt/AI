"""Trend catcher: runs inside the desktop app on a timer, with no AI and no tokens.

Three free sources, none of them scraped:
  1. Google's own "Trending now" RSS feed for India (the feed Google offers on that page).
  2. A calendar it works out itself: new and full moons, number dates (11/11, 1/1 ...), the New Year countdown.
  3. Extra dates the research agent adds to trend-words.json, each with where it was read.

It writes output/trends.json. It only matches words; deciding what a trend is worth is the agent's job.
"""
import datetime, json, math, pathlib, re, urllib.request
import xml.etree.ElementTree as ET

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
FEED = "https://trends.google.com/trending/rss?geo=IN"
SYNODIC = 29.530588853
NEW_MOON_0 = datetime.datetime(2000, 1, 6, 18, 14, tzinfo=datetime.timezone.utc)      # a known new moon


def fetch_feed():
    """Today's trending searches in India. Returns (items, error)."""
    try:
        req = urllib.request.Request(FEED, headers={"User-Agent": "tt-scout trend reader"})
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read(2_000_000)
        if b"<!DOCTYPE" in raw or b"<!ENTITY" in raw:
            return [], "the feed was not plain RSS"
        root = ET.fromstring(raw)
    except Exception as e:
        return [], str(e)[:160]
    out = []
    for it in root.iter("item"):
        d = {"title": (it.findtext("title") or "").strip()[:120], "when": (it.findtext("pubDate") or "")[:40], "traffic": "", "news": []}
        for ch in it.iter():
            tag = ch.tag.rsplit("}", 1)[-1]
            if tag == "approx_traffic": d["traffic"] = (ch.text or "").strip()[:20]
            elif tag == "news_item_title" and len(d["news"]) < 2: d["news"].append((ch.text or "").strip()[:160])
        if d["title"]: out.append(d)
    return out[:100], ""


def moons(day, ahead):
    """New and full moons in the next `ahead` days. Worked out from the average cycle, so right to within about a day."""
    out = []
    start = datetime.datetime(day.year, day.month, day.day, tzinfo=IST)
    k0 = math.floor((start - NEW_MOON_0).total_seconds() / 86400 / SYNODIC) - 1
    for k in range(k0, k0 + 4):
        for half, name in ((0, "New moon (Amavasya)"), (0.5, "Full moon (Purnima)")):
            t = (NEW_MOON_0 + datetime.timedelta(days=(k + half) * SYNODIC)).astimezone(IST).date()
            if 0 <= (t - day).days <= ahead:
                out.append({"date": t.isoformat(), "in_days": (t - day).days, "what": name, "source": "worked out from the moon's average cycle; about a day either way"})
    return out


def number_dates(day, ahead):
    out = []
    for n in range(ahead + 1):
        t = day + datetime.timedelta(days=n)
        if t.day == t.month and not (t.month == 1):
            out.append({"date": t.isoformat(), "in_days": n, "what": f"{t.day}/{t.month}: a repeating-number date", "source": "calendar"})
        if t.month == 1 and t.day == 1:
            out.append({"date": t.isoformat(), "in_days": n, "what": f"New Year {t.year}", "source": "calendar"})
    return out


def run(root):
    """Build output/trends.json. Returns a one-line summary for the work log."""
    root = pathlib.Path(root)
    cfg = {}
    try: cfg = json.loads((root / "trend-words.json").read_text(encoding="utf-8"))
    except Exception: pass
    words = [str(w).lower() for w in cfg.get("words", []) if str(w).strip()]
    today = datetime.datetime.now(IST).date()
    items, err = fetch_feed()
    pat = re.compile("|".join(re.escape(w) for w in words), re.I) if words else None
    hits = []
    for it in items:
        text = it["title"] + " " + " ".join(it["news"])
        m = pat.search(text) if pat else None
        if m: hits.append({**it, "matched": m.group(0).lower()})
    ahead = int(cfg.get("days_ahead", 21))
    cal = moons(today, ahead) + number_dates(today, ahead)
    for x in cfg.get("dates", []):                     # added by the research agent, each with its source
        try:
            t = datetime.date.fromisoformat(str(x["date"]))
            if 0 <= (t - today).days <= ahead:
                cal.append({"date": t.isoformat(), "in_days": (t - today).days, "what": str(x["what"])[:120], "source": str(x.get("source", "added by the research agent"))[:160]})
        except Exception:
            pass
    cal.sort(key=lambda c: c["date"])
    out = root / "output" / "trends.json"
    old = {}
    try: old = json.loads(out.read_text(encoding="utf-8"))
    except Exception: pass
    seen = {h["title"]: h for h in old.get("matches_log", [])}
    stamp = datetime.datetime.now(IST).strftime("%Y-%m-%d %H:%M IST")
    for h in hits:
        seen.setdefault(h["title"], {**h, "first_seen": stamp})
    log = sorted(seen.values(), key=lambda h: h.get("first_seen", ""), reverse=True)[:60]
    data = {"checked": stamp, "feed_error": err, "feed_count": len(items), "top": [{"title": i["title"], "traffic": i["traffic"]} for i in items[:12]],
            "matches": hits, "matches_log": log, "calendar": cal, "words": len(words)}
    tmp = out.with_suffix(".json.tmp"); tmp.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8", newline="\n"); tmp.replace(out)
    return (f"Trends: could not read Google's feed ({err}); calendar updated." if err else
            f"Trends: {len(items)} trending searches in India read, {len(hits)} match our words; {len(cal)} dates coming up.")
