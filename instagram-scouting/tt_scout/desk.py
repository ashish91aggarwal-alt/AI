"""Tarot Talk Desk: the desktop side of the scouting pipeline.

It does everything that needs this computer and no thinking:
  - watches the scout queue (GitHub issues titled "scout: <link>" from allowed users, plus links added here)
  - for a reel: fetches its sound, writes the transcript, audio numbers and public counters (text only; the file is deleted)
  - records every step in input/queue.json and output/desk-status.json, rebuilds the dashboard, commits and pushes
  - leaves anything that needs judgement marked "ready for agent" or "needs agent" for a Claude session

Run:  pythonw -m tt_scout.desk     (the app: its own window, every control, the full dashboard)
      python -m tt_scout.desk --once   (one round in the console, no window)
"""
import datetime, json, os, pathlib, re, shutil, socket, subprocess, sys, tempfile, threading, time, urllib.request, webbrowser

from . import cli

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
REEL = re.compile(r"https?://(?:www\.)?instagram\.com/(?:[A-Za-z0-9_.]+/)?(reel|reels|p)/([A-Za-z0-9_-]{5,40})")
PAGE = re.compile(r"https?://(?:www\.)?instagram\.com/([A-Za-z0-9_.]{2,30})/?(?:[?#\s]|$)")
STATES = {"queued": "Queued", "working": "Working", "ready-for-agent": "Ready for agent", "needs-agent": "Needs agent",
          "refused": "Refused by Instagram", "failed": "Failed", "done": "Done"}


def now_ist():
    return datetime.datetime.now(IST).strftime("%Y-%m-%d %H:%M IST")


def rd(p, default):
    try:
        return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))
    except Exception:
        return default


def wr(p, data):
    """Write through a temporary file so a crash never leaves half a file behind."""
    p = pathlib.Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, p)


NOWIN = {"creationflags": 0x08000000} if os.name == "nt" else {}     # no console window flashing under pythonw
LOCK = threading.RLock()                                              # the queue file is touched by the window and the worker


class QueueBroken(Exception):
    pass


def merge_queues(theirs, mine):
    """One queue from GitHub's copy and this computer's copy. Same item: the more recently updated one is kept."""
    out, at = [], {}
    for x in list(theirs) + list(mine):
        k = str(x.get("n"))
        if k not in at:
            at[k] = len(out); out.append(x)
        elif str(x.get("updated", "")) > str(out[at[k]].get("updated", "")):
            out[at[k]] = x
    return out


def parse_request(text):
    """Find what is being asked for in free text. Only Instagram links and plain handles are accepted; nothing is ever run from it."""
    text = text or ""
    m = REEL.search(text)
    if m:
        kind = "post" if m.group(1) == "p" else "reel"
        return {"kind": kind, "target": m.group(2), "url": f"https://www.instagram.com/{'p' if kind == 'post' else 'reel'}/{m.group(2)}/"}
    m = PAGE.search(text)
    if m and m.group(1) not in ("reel", "reels", "p", "explore", "accounts", "stories"):
        return {"kind": "page", "target": m.group(1), "url": f"https://www.instagram.com/{m.group(1)}/"}
    m = re.fullmatch(r"\s*@([A-Za-z0-9_.]{2,30})\s*", text)
    if m:
        return {"kind": "page", "target": m.group(1), "url": f"https://www.instagram.com/{m.group(1)}/"}
    return None


def field(body, name, default=""):
    m = re.search(rf"^\s*{name}\s*:\s*(.+?)\s*$", body or "", re.I | re.M)
    return m.group(1)[:300] if m else default


class Desk:
    def __init__(self, log=print):
        cli.locate()
        self.root = cli.ROOT                       # .../instagram-scouting
        self.repo = self.root.parent               # the AI repo
        self.cfg = rd(self.root / "desk-config.json", {})
        self.qfile = self.root / "input" / "queue.json"
        self.sfile = self.root / "output" / "desk-status.json"
        self.log = log
        self.paused = False
        self.model = None
        self.unpushed = False
        self.last_fetch = 0.0
        self.synced = False
        self.sync_note = ""
        # git refuses to commit on a computer where no name was ever set; use the GitHub account's public no-reply address then
        self.ident, self.ident_note = [], ""
        try:
            has = subprocess.run(["git", "config", "user.email"], cwd=self.repo, capture_output=True, text=True, timeout=20, **NOWIN).stdout.strip()
        except Exception:
            has = "?"
        if not has:
            u = (self.cfg.get("allowed_users") or ["tarot-talk-desk"])[0]
            self.ident = ["-c", f"user.name={u}", "-c", f"user.email={u}@users.noreply.github.com"]
            self.ident_note = f"Commits from this computer are made in the name of {u} (no git name was set here)."
        with LOCK:                                   # anything left "working" by a closed window goes back in line
            q = self.load_queue()
            if any(x.get("state") == "working" for x in q):
                for x in q:
                    if x.get("state") == "working": x["state"] = "queued"
                wr(self.qfile, q)

    # ---- tools
    def tools(self):
        out = []
        for t in rd(self.root / "tools.json", []):
            kind, val = t["check"]
            ok = bool(shutil.which(val)) if kind == "exe" else bool(cli.have(val))
            out.append({**t, "ok": ok})
        return out

    # ---- git (argument lists only; never a shell string)
    def git(self, *args):
        env = {**os.environ, "GIT_TERMINAL_PROMPT": "0"}
        try:
            return subprocess.run(["git", *self.ident, *args], cwd=self.repo, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120, env=env, **NOWIN)
        except subprocess.TimeoutExpired:
            return subprocess.CompletedProcess(args, 1, "", "git did not answer in 2 minutes (is it waiting for a sign-in?)")

    OWN = ["instagram-scouting/input/queue.json", "instagram-scouting/output/desk-status.json", "instagram-scouting/output/cli-status.json", "instagram-scouting/input/cli-queue.json"]

    def own_paths(self):
        return self.OWN + [str(p.relative_to(self.repo)).replace("\\", "/") for p in (self.root / "output").glob("*/cli/*.json")]

    def is_own(self, path):
        return path in self.OWN or bool(re.fullmatch(r"instagram-scouting/output/[^/]+/cli/[^/]+\.json", path))

    def pull(self):
        """Bring in what others pushed without ever mixing files by guesswork.
        This app only ever changes its own files (the queue, its status files, its result files). When GitHub has moved on,
        those are kept in memory, the copy here is set to GitHub's state, and they are put back, with the queue merged item by item."""
        with LOCK:
            self.sync_note = ""
            b = self.git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
            if b != "main":
                self.sync_note = f"This copy is on branch '{b}', not main."; self.log(self.sync_note + " Nothing was done."); return False
            dirty = [l[3:].strip().strip('"') for l in self.git("status", "--porcelain", "-uno").stdout.splitlines() if l.strip()]
            other = [p for p in dirty if not self.is_own(p)]
            if other:
                self.sync_note = "Files were changed by hand in the project folder: " + ", ".join(other[:3]); self.log(self.sync_note + ". Syncing waits until they are committed or undone."); return False
            local_q = self.load_queue()
            f = self.git("fetch", "origin", "main")
            if f.returncode:
                self.sync_note = "Could not reach GitHub: " + ((f.stderr or f.stdout).strip().splitlines() or ["no message"])[-1][:160]; self.log(self.sync_note); return False
            head, remote = self.git("rev-parse", "HEAD").stdout.strip(), self.git("rev-parse", "origin/main").stdout.strip()
            if not remote:
                self.sync_note = "GitHub's main branch was not found."; self.log(self.sync_note); return False
            if head == remote or self.git("merge-base", "--is-ancestor", "origin/main", "HEAD").returncode == 0:
                return True                                   # nothing new on GitHub
            mine = [p for p in self.git("log", "origin/main..HEAD", "--name-only", "--format=").stdout.split("\n") if p.strip()]
            if any(not self.is_own(p.strip()) for p in mine):
                self.sync_note = "This copy has its own commits to other files; sync it by hand once."; self.log(self.sync_note); return False
            keep = {p: (self.repo / p).read_bytes() for p in self.own_paths() if (self.repo / p).exists()}
            r = self.git("reset", "--hard", "origin/main")
            if r.returncode:
                self.sync_note = "Could not update from GitHub: " + (r.stderr or r.stdout).strip()[:160]; self.log(self.sync_note); return False
            for p, data in keep.items():                      # this computer's status and result files win
                if p != self.OWN[0]:
                    (self.repo / p).parent.mkdir(parents=True, exist_ok=True); (self.repo / p).write_bytes(data)
            try:
                theirs = self.load_queue()
            except QueueBroken:
                theirs = []
            wr(self.qfile, merge_queues(theirs, local_q))
            return True

    def publish(self, message):
        """Commit and push only this app's own files."""
        with LOCK:
            paths = self.own_paths()
            self.git("add", "--", *paths)
            if self.git("diff", "--cached", "--quiet", "--", *paths).returncode:          # something of ours is staged
                c = self.git("commit", "-m", message, "--", *paths)
                if c.returncode:
                    self.sync_note = "Could not save a commit: " + (c.stderr or c.stdout).strip()[:160]; self.log(self.sync_note); return False
            ahead = self.git("rev-list", "--count", "origin/main..HEAD").stdout.strip() not in ("", "0")
            if not ahead:
                self.unpushed = False; return True
            if not self.cfg.get("autopush", True):
                self.unpushed = True; self.sync_note = "Sending to GitHub is switched off in desk-config.json (autopush)."; return True
            p = self.git("push", "origin", "HEAD:main")
            self.unpushed = bool(p.returncode)
            if p.returncode:
                self.sync_note = "GitHub did not take the upload (will try again next round): " + ((p.stderr or p.stdout).strip().splitlines() or ["no message"])[-1][:160]; self.log(self.sync_note)
            return p.returncode == 0

    # ---- queue
    def load_queue(self):
        if not self.qfile.exists():
            return []
        try:
            q = json.loads(self.qfile.read_text(encoding="utf-8"))
            if not isinstance(q, list): raise ValueError("not a list")
            return q
        except Exception as e:                       # never rebuild the queue from scratch: that would redo everything
            raise QueueBroken(f"input/queue.json cannot be read ({e}). Fix or restore the file; nothing was changed.")

    def fetch_issues(self):
        """Open GitHub issues titled 'scout: ...' from allowed users. Public read; no token is used or stored."""
        repo = self.cfg.get("repo", "")
        if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
            return []
        req = urllib.request.Request(f"https://api.github.com/repos/{repo}/issues?state=open&per_page=50", headers={"Accept": "application/vnd.github+json", "User-Agent": "tt-desk"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                data = json.loads(r.read().decode("utf-8"))
        except Exception as e:
            self.log("Could not read the GitHub queue: " + str(e)[:160]); return []
        allowed = {u.lower() for u in self.cfg.get("allowed_users", [])}
        found = []
        for it in data:
            if "pull_request" in it or not str(it.get("title", "")).lower().startswith("scout"):
                continue
            who = str((it.get("user") or {}).get("login", "")).lower()
            if who not in allowed:
                continue                                    # a public repo: strangers' issues are ignored
            body = str(it.get("body") or "")
            req_ = parse_request(it["title"] + "\n" + body)
            if not req_:
                continue
            found.append({**req_, "n": int(it["number"]), "purpose": "process" if field(body, "purpose").lower().startswith("process") else "content",
                          "scoutProfile": field(body, "profile", "yes").lower().startswith("y") and req_["kind"] != "page",
                          "by": field(body, "by", who)[:40], "note": field(body, "note")[:300], "asked": str(it.get("created_at", ""))[:16].replace("T", " ") + " UTC"})
        return found

    def merge(self, found):
        with LOCK:
            q = self.load_queue(); have = {x.get("n") for x in q}; added = 0
            for f in found:
                if f["n"] not in have:
                    q.append({**f, "state": "queued", "result": "", "updated": now_ist()}); added += 1
            if added:
                wr(self.qfile, q); self.log(f"{added} new request(s) from the dashboard queue.")
        return added

    def add_local(self, text, purpose="content", by="desktop", note="", profile=None):
        """Returns "added", "duplicate" or None (not an Instagram link)."""
        r = parse_request(text)
        if not r:
            return None
        with LOCK:
            q = self.load_queue()
            if any(x.get("target") == r["target"] and x.get("state") in ("queued", "working") for x in q):
                return "duplicate"
            q.append({**r, "n": "L" + datetime.datetime.now().strftime("%m%d%H%M%S") + os.urandom(2).hex(), "purpose": purpose,
                      "scoutProfile": r["kind"] != "page" and (profile if profile is not None else True), "by": by, "note": str(note)[:300],
                      "asked": now_ist(), "state": "queued", "result": "", "updated": now_ist()})
            wr(self.qfile, q)
        return "added"

    def set(self, n, **kw):
        with LOCK:
            q = self.load_queue()
            for x in q:
                if x.get("n") == n:
                    x.update(kw); x["updated"] = now_ist()
            wr(self.qfile, q)

    # ---- status
    def status(self, note=""):
        s = rd(self.sfile, {})
        today = datetime.datetime.now(IST).strftime("%Y-%m-%d")
        if s.get("day") != today:
            s.update(day=today, reels_today=0)
        s.update(seen=now_ist(), tools=[{k: t[k] for k in ("key", "name", "ok", "used_for")} for t in self.tools()],
                 queue={k: sum(1 for x in self.load_queue() if x.get("state") == k) for k in STATES}, note=note or s.get("note", ""))
        wr(self.sfile, s)
        cs = cli.load_status(); cs["tools"] = cli.tools(); cs["checked"] = cli.now(); cli.save_status(cs)   # the dashboard's pipeline page reads this
        return s

    # ---- work: no judgement here, only fetching and measuring
    def work_one(self):
        q = self.load_queue()
        item = next((x for x in q if x.get("state") == "queued"), None)
        if not item:
            return False
        n = item["n"]
        if item["kind"] in ("page", "topic"):
            self.set(n, state="needs-agent", result="A page look is done by the agent's browser, not by this app."); self.close_issue(n, "Passed to the agent: a page look needs its browser."); self.log(f"#{n}: page request passed to the agent."); return True
        s = self.status()
        if s.get("reels_today", 0) >= int(self.cfg.get("max_reels_per_day", 20)):
            self.log("Daily limit reached; the rest waits until tomorrow."); return False
        cs = cli.load_status(); ref = cs.get("refused_at")
        if ref and (datetime.datetime.now() - datetime.datetime.fromisoformat(ref)).total_seconds() < cli.COOL_OFF_H * 3600:
            self.log("Instagram refused recently; waiting out the 24 hours."); return False
        if not all(cli.tools().values()):
            self.log("A tool is missing; see the Desk tab."); return False
        self.set(n, state="working"); self.log(f"#{n}: reading {item['kind']} {item['target']} ...")
        s = rd(self.sfile, {}); s["reels_today"] = s.get("reels_today", 0) + 1; wr(self.sfile, s)      # every attempt counts toward the daily limit
        try:
            from yt_dlp.utils import DownloadError
            if self.model is None:
                from faster_whisper import WhisperModel
                self.log("Loading the speech model (the first time downloads it) ...")
                self.model = WhisperModel("small", device="cpu", compute_type="int8")
            res = cli.process({"id": item["target"], "handle": None}, self.model)
            f = res.get("facts", {})
            bits = [f"@{res['handle']}", f"{round(res['seconds'])} s" if res.get("seconds") else None, f"{len(res['transcript'])} transcript lines ({res['language']})" if res["transcript"] else "no speech found",
                    f"{f['like_count']:,} likes" if f.get("like_count") else None, f"{f['comment_count']:,} comments" if f.get("comment_count") else None]
            extra = " Its profile still needs the agent's browser look." if item.get("scoutProfile") else ""
            self.set(n, state="ready-for-agent", handle=res["handle"], result="Read on the desktop: " + ", ".join(b for b in bits if b) + "." + extra)
            self.close_issue(n, "Read on the desktop. Waiting for the agent to study it.")
            self.log(f"#{n}: done.")
        except Exception as e:
            msg = str(e).replace("\n", " ")[:240]
            # only a real "no" from Instagram starts the 24-hour wait; a dropped connection or a deleted reel does not
            refused = e.__class__.__name__ == "DownloadError" and bool(re.search(r"login|log in|rate.?limit|429|401|403|not available to|restricted|checkpoint|challenge", msg, re.I))
            if refused:
                cs = cli.load_status(); cs["refused_at"] = datetime.datetime.now().isoformat(timespec="minutes"); cli.save_status(cs)
            self.set(n, state="refused" if refused else "failed", result=("Instagram refused: " if refused else "Tool error on this computer: ") + msg)
            self.log(f"#{n}: stopped. " + msg)
        return True

    def close_issue(self, n, comment):
        """Tidy the GitHub queue when the GitHub command line (gh) is installed and signed in. Without it the issue just stays open."""
        if isinstance(n, int) and shutil.which("gh"):
            try:
                subprocess.run(["gh", "issue", "close", str(n), "--repo", self.cfg.get("repo", ""), "--comment", comment], cwd=self.repo, capture_output=True, timeout=60, **NOWIN)
            except Exception:
                pass

    def cycle(self):
        """One round: sync, take in new requests, do at most one job, publish if anything changed."""
        cli.sweep()
        self.synced = self.pull()
        if not self.synced:
            return False
        before = json.dumps(self.load_queue(), sort_keys=True) + json.dumps([t["ok"] for t in self.tools()])
        if time.time() - self.last_fetch >= max(60, int(self.cfg.get("poll_seconds", 180))):       # stays far under GitHub's hourly limit
            self.last_fetch = time.time(); self.merge(self.fetch_issues())
        worked = False if self.paused else self.work_one()
        self.status()
        after = json.dumps(self.load_queue(), sort_keys=True) + json.dumps([t["ok"] for t in self.tools()])
        loose = bool(self.git("status", "--porcelain", "--", "instagram-scouting/input/queue.json", "instagram-scouting/output/*/cli/*.json").stdout.strip())   # links added here, or results written earlier, that were never sent
        if before != after or self.unpushed or loose:
            self.publish("Desk: queue and results")
        return worked


# ------------------------------------------------------------------ the app: a local page with every control, plus the background worker
PORT = 47654
MODULE_PKG = {"ytdlp": "yt-dlp", "whisper": "faster-whisper"}        # the only things the Fix button may install


class App:
    def __init__(self, desk):
        import collections, secrets
        self.desk = desk
        self.token = secrets.token_urlsafe(24)       # the page gets it when served; every command must send it back
        self.logs = collections.deque(maxlen=300)
        self.wake, self.stop = threading.Event(), threading.Event()
        self.busy = False
        self.rev = 0                                 # goes up whenever the page's data may have changed
        self.build_lock, self.cache = threading.Lock(), None
        self.started = time.time()
        self.last_ok = None                          # last round that synced with GitHub
        self.last_sync_failed = False
        desk.log = self.say

    def say(self, m):
        self.logs.append(datetime.datetime.now(IST).strftime("%H:%M  ") + str(m))

    # ---- the page: the same dashboard GitHub shows, built here from the files on this computer
    def page(self):
        with self.build_lock:                         # one build at a time, and not more often than the data changes
            if self.cache is None or self.cache[0] != self.rev or time.time() - self.cache[1] > 300:
                dash = self.desk.repo / "tarot-talk" / "dashboard"
                r = subprocess.run([sys.executable, str(dash / "build.py")], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120, **NOWIN)
                f = dash / "index.html"
                if r.returncode or not f.exists():
                    return "<!doctype html><meta charset=utf-8><title>Tarot Talk Desk</title><pre>The dashboard could not be built on this computer:\n\n" + (r.stderr or r.stdout)[-1500:].replace("<", "&lt;") + "</pre>"
                self.cache = (self.rev, time.time(), f.read_text(encoding="utf-8"))
            boot = "<script>window.TT_LOCAL=" + json.dumps({"token": self.token, "rev": self.rev}) + "</script>"
            return self.cache[2].replace("<head>", "<head>" + boot, 1)

    def state(self):
        d = self.desk
        try:
            q = d.load_queue(); broken = ""
        except QueueBroken as e:
            q, broken = [], str(e)
        s = rd(d.sfile, {})
        code_changed = any(p.stat().st_mtime > self.started for p in pathlib.Path(__file__).parent.glob("*.py"))
        return {"rev": self.rev, "busy": self.busy, "paused": d.paused, "broken": broken, "logs": list(self.logs)[-150:], "folder": str(d.root),
                "tools": [{**{k: t[k] for k in ("key", "name", "ok", "used_for", "install")}, "fixable": t["key"] in MODULE_PKG} for t in d.tools()],
                "queue": list(reversed(q[-200:])), "seen": s.get("seen"), "reels_today": s.get("reels_today", 0), "max_reels": d.cfg.get("max_reels_per_day", 20),
                "poll_min": max(1, int(d.cfg.get("poll_seconds", 180)) // 60), "allowed": d.cfg.get("allowed_users", []), "unpushed": d.unpushed,
                "last_ok": self.last_ok, "sync_failed": self.last_sync_failed, "sync_note": d.sync_note, "ident": d.ident_note, "restart": code_changed, "public": d.cfg.get("dashboard_url", "")}

    # ---- commands from the page. Fixed list; nothing typed in the page is ever run as a command.
    def act(self, name, a):
        d = self.desk
        if name == "check":
            self.wake.set(); return "Checking now."
        if name == "pause":
            d.paused = not d.paused; self.say("Paused." if d.paused else "Resumed."); self.wake.set(); return "Paused." if d.paused else "Resumed."
        if name == "add":
            got = d.add_local(str(a.get("text", ""))[:400], purpose="process" if a.get("purpose") == "process" else "content", by=str(a.get("by", "desktop"))[:40],
                              note=str(a.get("note", "")), profile=bool(a["profile"]) if "profile" in a else None)
            if not got: return "!That is not an Instagram reel, post or page link."
            if got == "duplicate": return "That link is already waiting in the queue. Nothing was added."
            self.say("Added from the desktop."); self.rev += 1; self.wake.set()
            return "Added to the queue." + (" The app is paused, so it waits." if d.paused else "")
        if name == "hits":                            # the strongest reels of a scouted page: pinned ones and those at 3x its median
            handle = cli.safe_handle(a.get("handle"))
            page = rd(d.root / "output" / handle / "page.json", None)
            if not page: return "!That profile has not been scouted yet."
            done = {p.stem for p in (d.root / "output" / handle / "cli").glob("*.json")}
            with LOCK:
                inq = {x.get("target") for x in d.load_queue() if x.get("state") in ("queued", "working")}
            pick = [r["id"] for r in page.get("reels", []) if (r.get("pinned") or (r.get("multiple") or 0) >= 3) and r["id"] not in done and r["id"] not in inq]
            for rid in pick:
                d.add_local(f"https://www.instagram.com/reel/{rid}/", by="desktop", profile=False)
            self.rev += 1; self.wake.set()
            return f"Added {len(pick)} reel(s) of @{handle}." if pick else f"Nothing new to read for @{handle}: its top reels are already done or waiting."
        if name == "retry":
            with LOCK:
                q = d.load_queue(); hit = [x for x in q if str(x.get("n")) == str(a.get("n")) and x.get("state") in ("failed", "refused")]
                for x in hit: x.update(state="queued", result="", updated=now_ist())
                if hit: wr(d.qfile, q)
            if hit and a.get("force"):                # the owner chose to try again before the 24 hours are over
                cs = cli.load_status(); cs.pop("refused_at", None); cli.save_status(cs)
            self.rev += 1; self.wake.set(); return "Back in the queue." if hit else "!Nothing to retry."
        if name == "fix":
            pkg = MODULE_PKG.get(str(a.get("key")))
            if not pkg: return "!This one is installed by hand; the command is shown on its card."
            self.say(f"Installing {pkg} ...")
            r = subprocess.run([sys.executable, "-m", "pip", "install", "-U", pkg], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900, **NOWIN)
            self.say(f"{pkg}: " + ("installed." if r.returncode == 0 else "install failed: " + (r.stderr or r.stdout).strip()[-200:])); self.rev += 1
            return "Installed." if r.returncode == 0 else "!Install failed; see the work log."
        if name == "folder":
            if hasattr(os, "startfile"): os.startfile(d.root)
            return "Opened."
        if name == "quit":
            self.say("Closing."); self.stop.set(); self.wake.set()
            threading.Thread(target=lambda: (time.sleep(0.5), self.httpd.shutdown()), daemon=True).start(); return "Closed. You can close this window."
        return "!Unknown command."

    # ---- the worker: same rounds as before, whether or not a window is open
    def loop(self):
        d = self.desk
        while not self.stop.is_set():
            again = False; self.busy = True
            try:
                before = self.sig()
                again = d.cycle()
                self.last_sync_failed = bool(d.sync_note) or not d.synced or d.unpushed
                if not self.last_sync_failed: self.last_ok = now_ist()
                if self.sig() != before: self.rev += 1
            except QueueBroken as e:
                self.say(str(e))
            except Exception as e:
                self.say("Round stopped by an error: " + str(e)[:200])
            self.busy = False
            self.wake.wait(cli.PAUSE if again else max(60, int(d.cfg.get("poll_seconds", 180)))); self.wake.clear()

    def sig(self):
        try:
            return json.dumps(self.desk.load_queue(), sort_keys=True) + self.desk.git("rev-parse", "HEAD").stdout
        except Exception:
            return ""

    def serve(self):
        import http.server
        app = self

        class H(http.server.BaseHTTPRequestHandler):
            def log_message(self, *a): pass

            def send(self, code, body, kind="application/json"):
                b = body.encode("utf-8") if isinstance(body, str) else body
                self.send_response(code); self.send_header("Content-Type", kind + "; charset=utf-8"); self.send_header("Content-Length", str(len(b)))
                self.send_header("Cache-Control", "no-store"); self.send_header("X-Content-Type-Options", "nosniff")
                self.send_header("X-Frame-Options", "DENY"); self.send_header("Content-Security-Policy", "frame-ancestors 'none'"); self.end_headers(); self.wfile.write(b)

            def mine(self):                            # only this computer's own page may talk to the app
                return self.headers.get("Host", "") in (f"127.0.0.1:{PORT}", f"localhost:{PORT}")

            def do_GET(self):
                if not self.mine(): return self.send(403, "{}")
                if self.path.split("?")[0] in ("/", "/index.html"):
                    return self.send(200, app.page(), "text/html")
                if self.path == "/api/state" and self.headers.get("X-TT-Token") == app.token:
                    return self.send(200, json.dumps(app.state(), ensure_ascii=False))
                self.send(404, "{}")

            def do_POST(self):
                if not self.mine() or self.headers.get("X-TT-Token") != app.token: return self.send(403, "{}")
                try:
                    n = min(int(self.headers.get("Content-Length") or 0), 20000)
                    a = json.loads(self.rfile.read(n).decode("utf-8") or "{}")
                    if not isinstance(a, dict): a = {}
                    msg = app.act(self.path.rsplit("/", 1)[-1], a)
                except QueueBroken as e:
                    msg = "!" + str(e)
                except Exception as e:
                    msg = "!" + str(e)[:200]
                self.send(200, json.dumps({"ok": not msg.startswith("!"), "msg": msg.lstrip("!")}, ensure_ascii=False))

        class Server(http.server.ThreadingHTTPServer):
            allow_reuse_address = False                # a second copy of the app must fail to start, not share the port

        self.httpd = Server(("127.0.0.1", PORT), H)      # reachable from this computer only
        self.httpd.daemon_threads = True
        return self.httpd


def open_window():
    """Show the app in its own window (Edge or Chrome in app mode: no address bar). Falls back to the normal browser."""
    url = f"http://127.0.0.1:{PORT}/"
    cands = [os.path.join(os.environ.get(v, ""), p) for v in ("ProgramFiles(x86)", "ProgramFiles", "LocalAppData")
             for p in (r"Microsoft\Edge\Application\msedge.exe", r"Google\Chrome\Application\chrome.exe")]
    cands += [shutil.which(x) or "" for x in ("msedge", "chrome", "google-chrome", "chromium")]
    for exe in cands:
        if exe and os.path.isfile(exe):
            try:
                subprocess.Popen([exe, "--app=" + url, "--window-size=1320,900"], **NOWIN); return
            except Exception:
                pass
    webbrowser.open(url)


def run_app(desk):
    app = App(desk)
    try:
        httpd = app.serve()
    except OSError:                                    # already running: just bring up its window
        open_window(); return 0
    app.say("Tarot Talk Desk started.")
    threading.Thread(target=app.loop, daemon=True).start()
    threading.Timer(0.6, open_window).start()
    httpd.serve_forever()
    return 0


def main():
    if sys.stdout is None or sys.stderr is None:      # started without a console: keep a log file so nothing crashes on print
        lp = pathlib.Path(tempfile.gettempdir()) / "tt-desk.log"
        logf = open(lp, "w" if lp.exists() and lp.stat().st_size > 1_000_000 else "a", encoding="utf-8", buffering=1)
        sys.stdout = sys.stdout or logf; sys.stderr = sys.stderr or logf
    if "--once" not in sys.argv:
        try:                                          # already running: show its window and leave
            probe = socket.create_connection(("127.0.0.1", PORT), timeout=0.5); probe.close()
            open_window(); return 0
        except OSError:
            pass
    try:
        desk = Desk()
    except SystemExit as e:
        try:
            import tkinter as tk
            from tkinter import messagebox
            r = tk.Tk(); r.withdraw(); messagebox.showerror("Tarot Talk Desk", str(e) + "\n\nSet TT_SCOUT_HOME to the instagram-scouting folder, or start the app from its desktop shortcut."); r.destroy()
        except Exception:
            print(e)
        return 1
    if "--once" in sys.argv:
        try: desk.cycle()
        except QueueBroken as e: print(e); return 1
        print(json.dumps(rd(desk.sfile, {}), indent=1)); return 0
    return run_app(desk)


if __name__ == "__main__":
    sys.exit(main())
