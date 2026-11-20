#!/usr/bin/env python3
"""Builds output/<handle>/page.json from source.py + findings.json + command-line results.
The dashboard that shows them is built by tarot-talk/dashboard/build.py, which calls this script."""
import json, importlib.util, pathlib, statistics, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "output"

def load_source(handle):
    spec = importlib.util.spec_from_file_location("src", OUT / handle / "source.py")
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def build_page(handle):
    s = load_source(handle)
    latest = {}
    for snap in s.SNAPSHOTS:
        latest.update(snap["views"])
    cli_dir = OUT / handle / "cli"
    reels = []
    for rid, pinned, cover, fmt, concept, theme in s.REELS:
        r = dict(id=rid, pinned=bool(pinned), cover=cover, format=fmt, concept=concept, theme=theme, views=latest.get(rid))
        r["fresh"] = r["views"] is not None and r["views"] < 20000 and not pinned  # posted minutes before the look
        f = s.FACTS.get(rid)
        if f:
            sec, likes, com, rep, sh, ask = f
            v = r["views"]
            r.update(seconds=sec, likes=likes, comments=com, reposts=rep, shares=sh, ask=ask,
                     like_rate=round(100 * likes / v, 2), comment_rate=round(100 * com / v, 3), share_rate=round(100 * sh / v, 2))
        cli = cli_dir / f"{rid}.json"
        clid = json.loads(cli.read_text(encoding="utf-8")) if cli.exists() else None
        r["stages"] = dict(list=True, cover=cover is not None, facts=bool(f), stills=s.STILLS.get(rid),
                           transcript=("no speech found" if clid and clid.get("transcript") == [] else bool(clid and clid.get("transcript"))),
                           audio=bool(clid and (clid.get("audio") or {}).get("mean_db") is not None))
        if clid: r["cli"] = clid
        reels.append(r)
    base = [r["views"] for r in reels if not r["pinned"] and not r["fresh"] and r["views"]]
    median = int(statistics.median(base))
    for r in reels:
        r["multiple"] = round(r["views"] / median, 1) if r["views"] else None
    concepts = []
    for key, label in s.CONCEPTS.items():
        rs = [r for r in reels if r["concept"] == key]
        counted = [r["views"] for r in rs if not r["pinned"] and not r["fresh"]]
        concepts.append(dict(key=key, label=label, n=len(rs), counted=len(counted),
                             median=int(statistics.median(counted)) if counted else None,
                             best=max((r["views"] for r in rs), default=None),
                             hits=sum(1 for r in rs if not r["pinned"] and (r["multiple"] or 0) >= 3),
                             pinned=sum(1 for r in rs if r["pinned"])))
    growth = []
    first, last = s.SNAPSHOTS[0], s.SNAPSHOTS[-1]
    for rid, v in last["views"].items():
        if rid in first["views"] and v != first["views"][rid]:
            growth.append(dict(id=rid, frm=first["views"][rid], to=v))
    page = dict(profile=s.PROFILE, median=median, counted=len(base), reels=reels, concepts=concepts,
                snapshots=[dict(at=x["at"], approx=x["approx"], n=len(x["views"])) for x in s.SNAPSHOTS], growth=growth,
                findings=json.loads((OUT / handle / "findings.json").read_text(encoding="utf-8")))
    (OUT / handle / "page.json").write_text(json.dumps(page, indent=1, ensure_ascii=False), encoding="utf-8", newline="\n")
    return page

def main():
    pages = {p.parent.name: build_page(p.parent.name) for p in sorted(OUT.glob("*/source.py"))}
    status = json.loads((OUT / "status.json").read_text(encoding="utf-8"))
    cli_status = OUT / "cli-status.json"
    status["cli"] = json.loads(cli_status.read_text(encoding="utf-8")) if cli_status.exists() else None
    status["updated"] = "with this build"
    requests = json.loads((ROOT / "input" / "requests.json").read_text(encoding="utf-8"))
    data = dict(built=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).strftime("%d %b %Y, %H:%M IST"),
                pages=pages, status=status, requests=requests)
    # The dashboard itself lives in tarot-talk/dashboard/ (the Tarot Talk workspace); this script only builds page.json.
    for h, p in pages.items():
        print(h, "median", p["median"], "counted", p["counted"])
        for c in p["concepts"]: print("  ", c["key"], c["n"], c["counted"], c["median"], "hits", c["hits"])
        for r in p["reels"]:
            if r.get("likes"): print("  ", r["id"], r["views"], r["multiple"], r["like_rate"], r["comment_rate"], r["share_rate"])

if __name__ == "__main__":
    main()
