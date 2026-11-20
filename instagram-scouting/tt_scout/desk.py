"""Tarot Talk Desk: the desktop side of the scouting pipeline.

It does everything that needs this computer and no thinking:
  - watches the scout queue (GitHub issues titled "scout: <link>" from allowed users, plus links added here)
  - for a reel: fetches its sound, writes the transcript, audio numbers and public counters (text only; the file is deleted)
  - records every step in input/queue.json and output/desk-status.json, rebuilds the dashboard, commits and pushes
  - leaves anything that needs judgement marked "ready for agent" or "needs agent" for a Claude session

Run:  tt-desk            (window)      tt-desk --once   (one cycle in the console, no window)
"""
import datetime, json, os, pathlib, queue as pyqueue, re, shutil, socket, subprocess, sys, tempfile, threading, time, urllib.request, webbrowser

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
            return subprocess.run(["git", *args], cwd=self.repo, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120, env=env, **NOWIN)
        except subprocess.TimeoutExpired:
            return subprocess.CompletedProcess(args, 1, "", "git did not answer in 2 minutes (is it waiting for a sign-in?)")

    def pull(self):
        """Bring in what others pushed. On any trouble, undo and skip this round rather than work on a broken copy."""
        b = self.git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
        if b != "main":
            self.log(f"This clone is on branch '{b}', not main. Switch to main; nothing was done."); return False
        r = self.git("pull", "--rebase", "--autostash")
        if r.returncode:
            self.git("rebase", "--abort")
            self.log("Could not sync with GitHub, so this round is skipped: " + ((r.stderr or r.stdout).strip().splitlines() or ["no message"])[-1][:200])
        return r.returncode == 0

    def publish(self, message):
        """Commit and push only this app's own files. The dashboard page is built on GitHub, never here."""
        paths = ["instagram-scouting/input/queue.json", "instagram-scouting/output/desk-status.json", "instagram-scouting/output/cli-status.json"]
        paths += [str(p.relative_to(self.repo)).replace("\\", "/") for p in (self.root / "output").glob("*/cli/*.json")]
        self.git("add", "--", *paths)
        c = self.git("commit", "-m", message, "--", *paths)
        if c.returncode and "nothing to commit" not in (c.stdout + c.stderr) and "no changes added" not in (c.stdout + c.stderr):
            self.log("Commit failed: " + (c.stderr or c.stdout).strip()[:200]); return False
        if not self.cfg.get("autopush", True):
            return True
        p = self.git("push")
        self.unpushed = bool(p.returncode)
        if p.returncode:
            self.log("Push failed (will try again next round): " + ((p.stderr or p.stdout).strip().splitlines() or ["no message"])[-1][:200])
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

    def add_local(self, text, purpose="content", by="desktop"):
        r = parse_request(text)
        if not r:
            return False
        with LOCK:
            q = self.load_queue()
            q.append({**r, "n": "L" + datetime.datetime.now().strftime("%m%d%H%M%S"), "purpose": purpose, "scoutProfile": r["kind"] != "page", "by": by, "note": "",
                      "asked": now_ist(), "state": "queued", "result": "", "updated": now_ist()})
            wr(self.qfile, q)
        return True

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
            self.log("A tool is missing; see the Status tab."); return False
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
        if not self.pull():
            return False
        before = json.dumps(self.load_queue(), sort_keys=True) + json.dumps([t["ok"] for t in self.tools()])
        if time.time() - self.last_fetch >= max(60, int(self.cfg.get("poll_seconds", 180))):       # stays far under GitHub's hourly limit
            self.last_fetch = time.time(); self.merge(self.fetch_issues())
        worked = False if self.paused else self.work_one()
        self.status()
        after = json.dumps(self.load_queue(), sort_keys=True) + json.dumps([t["ok"] for t in self.tools()])
        if before != after or self.unpushed:
            self.publish("Desk: queue and results")
        return worked


# ------------------------------------------------------------------ window
def run_gui(desk):
    import tkinter as tk
    from tkinter import ttk, simpledialog, messagebox
    BG, CARD, INK, MUTED, ACC, GOOD, BAD = "#0b0613", "#1a0f2b", "#fbf7ff", "#b8a8cf", "#ff8a3d", "#3ddc97", "#ff5d73"
    root = tk.Tk(); root.title("Tarot Talk Desk"); root.geometry("760x560"); root.configure(bg=BG)
    try:
        root.iconbitmap(str(pathlib.Path(__file__).with_name("desk.ico")))
    except Exception:
        pass
    st = ttk.Style(); st.theme_use("clam")
    st.configure(".", background=BG, foreground=INK, fieldbackground=CARD, font=("Segoe UI", 10))
    st.configure("TNotebook", background=BG, borderwidth=0); st.configure("TNotebook.Tab", background=CARD, foreground=MUTED, padding=(16, 8))
    st.map("TNotebook.Tab", background=[("selected", ACC)], foreground=[("selected", "#1a0b22")])
    st.configure("Treeview", background=CARD, foreground=INK, fieldbackground=CARD, rowheight=28, borderwidth=0)
    st.configure("Treeview.Heading", background=BG, foreground=MUTED, font=("Segoe UI", 9, "bold"))
    st.configure("TButton", background=CARD, foreground=INK, padding=(12, 6), borderwidth=0); st.map("TButton", background=[("active", ACC)], foreground=[("active", "#1a0b22")])

    head = tk.Frame(root, bg=BG); head.pack(fill="x", padx=16, pady=(14, 6))
    tk.Label(head, text="Tarot Talk Desk", bg=BG, fg=ACC, font=("Segoe UI", 18, "bold")).pack(side="left")
    light = tk.Label(head, text="●  starting", bg=BG, fg=MUTED, font=("Segoe UI", 10)); light.pack(side="right")
    nb = ttk.Notebook(root); nb.pack(fill="both", expand=True, padx=16, pady=6)

    t_status = tk.Frame(nb, bg=BG); nb.add(t_status, text="Status")
    tools = ttk.Treeview(t_status, columns=("ok", "name", "use", "fix"), show="headings", height=6)
    for c, w, tx in (("ok", 70, "State"), ("name", 130, "Tool"), ("use", 290, "Used for"), ("fix", 230, "If missing, run")):
        tools.heading(c, text=tx); tools.column(c, width=w, anchor="w")
    tools.pack(fill="x", pady=(10, 8))
    info = tk.Label(t_status, text="", bg=BG, fg=MUTED, justify="left", anchor="w", font=("Segoe UI", 10)); info.pack(fill="x")

    t_queue = tk.Frame(nb, bg=BG); nb.add(t_queue, text="Queue")
    qv = ttk.Treeview(t_queue, columns=("n", "what", "for", "by", "state", "result"), show="headings")
    for c, w, tx in (("n", 60, "#"), ("what", 190, "Link"), ("for", 70, "For"), ("by", 80, "From"), ("state", 130, "State"), ("result", 320, "Result")):
        qv.heading(c, text=tx); qv.column(c, width=w, anchor="w")
    qv.pack(fill="both", expand=True, pady=(10, 8))

    t_log = tk.Frame(nb, bg=BG); nb.add(t_log, text="Work log")
    logbox = tk.Text(t_log, bg=CARD, fg=INK, relief="flat", wrap="word", font=("Consolas", 10), state="disabled"); logbox.pack(fill="both", expand=True, pady=10)

    msgs = pyqueue.Queue(); wake = threading.Event(); stop = threading.Event()
    desk.log = lambda m: msgs.put(str(m))

    def refresh():
        for row in tools.get_children(): tools.delete(row)
        for t in desk.tools():
            tools.insert("", "end", values=("OK" if t["ok"] else "MISSING", t["name"], t["used_for"], "" if t["ok"] else t["install"]))
        for row in qv.get_children(): qv.delete(row)
        q = desk.load_queue()
        for x in reversed(q[-200:]):
            qv.insert("", "end", values=(x.get("n"), ("@" if x["kind"] == "page" else x["kind"] + " ") + x["target"], x.get("purpose", ""), x.get("by", ""), STATES.get(x.get("state"), x.get("state")), x.get("result", "")))
        s = rd(desk.sfile, {})
        waiting = sum(1 for x in q if x.get("state") == "queued"); ready = sum(1 for x in q if x.get("state") in ("ready-for-agent", "needs-agent"))
        info.config(text=f"Project folder: {desk.root}\nLast check: {s.get('seen', 'not yet')}     Reels read today: {s.get('reels_today', 0)} of {desk.cfg.get('max_reels_per_day', 20)}\n"
                         f"Waiting here: {waiting}     Waiting for the agent: {ready}\nChecks GitHub every {int(desk.cfg.get('poll_seconds', 180)) // 60} minutes while this window is open.\n"
                         f"Requests are accepted from these GitHub accounts: {', '.join(desk.cfg.get('allowed_users', [])) or 'none set'}")
        light.config(text="●  paused" if desk.paused else "●  watching the queue", fg=MUTED if desk.paused else GOOD)

    def pump():
        try:
            while True:
                m = msgs.get_nowait()
                if m == "\x00refresh":
                    try: refresh()
                    except QueueBroken as e: msgs.put(str(e))
                    continue
                logbox.config(state="normal"); logbox.insert("end", datetime.datetime.now().strftime("%H:%M  ") + m + "\n"); logbox.see("end"); logbox.config(state="disabled")
        except pyqueue.Empty:
            pass
        root.after(500, pump)

    def loop():
        while not stop.is_set():
            try:
                again = desk.cycle()
            except Exception as e:
                msgs.put("Cycle error: " + str(e)[:200]); again = False
            msgs.put("\x00refresh")
            wake.wait(cli.PAUSE if again else max(60, int(desk.cfg.get("poll_seconds", 180)))); wake.clear()

    def add_link():
        v = simpledialog.askstring("Add a link", "Paste a reel link, a page link or an @handle:", parent=root)
        if v is None: return
        try: ok = desk.add_local(v)
        except QueueBroken as e: messagebox.showerror("Tarot Talk Desk", str(e)); return
        if ok: desk.log("Added from the desktop."); refresh(); wake.set()
        else: messagebox.showinfo("Add a link", "That is not an Instagram reel, post or page link.")

    def toggle():
        desk.paused = not desk.paused; pause_btn.config(text="Resume" if desk.paused else "Pause"); refresh()

    bar = tk.Frame(root, bg=BG); bar.pack(fill="x", padx=16, pady=(4, 14))
    ttk.Button(bar, text="Check now", command=wake.set).pack(side="left", padx=(0, 8))
    ttk.Button(bar, text="Add a link", command=add_link).pack(side="left", padx=(0, 8))
    pause_btn = ttk.Button(bar, text="Pause", command=toggle); pause_btn.pack(side="left", padx=(0, 8))
    ttk.Button(bar, text="Open dashboard", command=lambda: webbrowser.open(desk.cfg.get("dashboard_url", "https://github.com/" + desk.cfg.get("repo", "")))).pack(side="right")
    ttk.Button(bar, text="Open project folder", command=lambda: os.startfile(desk.root) if hasattr(os, "startfile") else None).pack(side="right", padx=(0, 8))

    refresh(); pump()
    threading.Thread(target=loop, daemon=True).start()
    root.protocol("WM_DELETE_WINDOW", lambda: (stop.set(), wake.set(), root.destroy()))
    root.mainloop()


def main():
    if sys.stdout is None or sys.stderr is None:      # started without a console: keep a log file so nothing crashes on print
        logf = open(pathlib.Path(tempfile.gettempdir()) / "tt-desk.log", "a", encoding="utf-8", buffering=1)
        sys.stdout = sys.stdout or logf; sys.stderr = sys.stderr or logf
    if "--once" not in sys.argv:
        try:                                          # one window only: a second start just exits
            guard = socket.socket(); guard.bind(("127.0.0.1", 47653)); main._guard = guard
        except OSError:
            return 0
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
    run_gui(desk); return 0


if __name__ == "__main__":
    sys.exit(main())
