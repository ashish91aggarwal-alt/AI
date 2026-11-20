#!/usr/bin/env python3
"""Builds the Tarot Talk workspace dashboard (one self-contained file).
Reads workspace.json here and the scouting results in ../../instagram-scouting/.   Usage: python3 tarot-talk/dashboard/build.py"""
import base64, datetime, json, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
SCOUT = HERE.parent.parent / "instagram-scouting"

def main():
    subprocess.run([sys.executable, str(SCOUT / "dashboard" / "build.py")], check=True, capture_output=True)
    rd = lambda p: json.loads(p.read_text(encoding="utf-8"))
    pages = {p.parent.name: rd(p) for p in sorted((SCOUT / "output").glob("*/page.json"))}
    status = rd(SCOUT / "output" / "status.json")
    cli = SCOUT / "output" / "cli-status.json"
    status["cli"] = rd(cli) if cli.exists() else None
    b64 = lambda p: "data:image/jpeg;base64," + base64.b64encode(p.read_bytes()).decode()
    images = {p.stem: b64(p) for p in sorted((HERE / "img").glob("*.jpg"))}
    images.update({"styles/" + p.stem: b64(p) for p in sorted((HERE / "img" / "styles").glob("*.jpg"))})
    ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    data = dict(built=datetime.datetime.now(ist).strftime("%d %b %Y, %H:%M IST"), workspace=rd(HERE / "workspace.json"), pages=pages, status=status,
                requests=rd(SCOUT / "input" / "requests.json"), agent=rd(HERE / "agent.json"), styles=rd(HERE / "styles.json"), images=images,
                repo="ashish91aggarwal-alt/AI", sessions=rd(s) if (s := HERE / "sessions.json").exists() else None, queue=rd(q) if (q := SCOUT / "input" / "queue.json").exists() else [],
                desk=rd(d) if (d := SCOUT / "output" / "desk-status.json").exists() else None)
    tx = lambda n: (HERE / "parts" / n).read_text(encoding="utf-8")
    template = tx("base.html").replace("/*__HUBCSS__*/", tx("hub.css")) + tx("hub.js")   # base: shell + profile views; hub: workspace views
    for item in data["queue"]:                    # what the desktop app read for a forwarded reel, shown on its queue card
        f = SCOUT / "output" / str(item.get("handle", "")) / "cli" / (str(item.get("target", "")) + ".json")
        if item.get("handle") and f.exists():
            r = rd(f); item["transcript"] = " ".join(t["text"] for t in r.get("transcript", []))[:700]; item["facts"] = r.get("facts", {})
    html = template.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False).replace("<", "\\u003c"))
    (HERE / "index.html").write_text(html, encoding="utf-8")
    print("built", len(html) // 1024, "KB;", len(pages), "profile(s)")

if __name__ == "__main__":
    main()
