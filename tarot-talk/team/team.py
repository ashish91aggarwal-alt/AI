#!/usr/bin/env python3
"""Session tool for every AI session working on Tarot Talk (see tarot-talk/AGENTS.md). Standard library only.

  start   --role R [--about ".."] [--link URL]   register this session (a new role is created if R is new) and print the briefing
  status  [--doing ..] [--next ..] [--blocked ..] [--compactions N]
  msg     <role|all> "text"                      leave a message for another session
  inbox                                          show messages for you and mark them read
  task    new --title T --lane R [--detail ..]   add a task to the board
  claim   ID   |  release ID  |  done ID --result ".."
  build                                          rewrite STATUS.md and board.json from the files
  sync    [-m "what changed"]                    pull, build, commit the team files and push

Every command that changes something pulls first and pushes at once, so other sessions see it within minutes.
--offline (before the command) changes the files here only.

Role comes from --role, $AGENT_ROLE or `git config agent.role`. Times are stored in UTC and shown in IST.
"""
import argparse, datetime as dt, json, os, re, subprocess, sys
from pathlib import Path

TEAM = Path(__file__).resolve().parent
ROOT = TEAM.parent                      # tarot-talk/
REPO = ROOT.parent
STATUS, TASKS = TEAM / "status", TEAM / "tasks"
LEASE_HOURS = 6
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))


def now(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
def iso(t): return t.isoformat().replace("+00:00", "Z")
def parse(s): return dt.datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None
def ist(s): t = parse(s); return t.astimezone(IST).strftime("%d %b %H:%M IST") if t else "never"
def load(p, default=None):
    try: return json.loads(Path(p).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError): return default
def save(p, obj):
    p = Path(p); p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp"); tmp.write_text(json.dumps(obj, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"); os.replace(tmp, p)
def git(*a): return subprocess.run(["git", *a], cwd=REPO, capture_output=True, text=True)
def slug(s): return re.sub(r"[^a-z0-9-]+", "-", str(s).lower()).strip("-")[:40]


def role_of(a):
    r = getattr(a, "role", None) or os.environ.get("AGENT_ROLE") or git("config", "agent.role").stdout.strip()
    if not r: sys.exit("No role. Run: python3 tarot-talk/team/team.py start --role <role>   (roles are listed in tarot-talk/AGENTS.md; a new name creates a new role)")
    return slug(r)
def roles(): return load(TEAM / "roles.json", {})
def st(role): return load(STATUS / f"{role}.json") or {"role": role, "doing": "", "next": "", "blocked": "", "outbox": [], "read_at": None, "compactions": 0}
def put(s): s["updated_at"] = iso(now()); save(STATUS / f"{s['role']}.json", s)
def tasks(): return sorted((t for t in (load(p) for p in TASKS.glob("*.json")) if t), key=lambda t: (t.get("state") == "done", t.get("created", "")))
def lease_ok(t): return bool(t.get("owner")) and t.get("lease_until") and parse(t["lease_until"]) > now()


OFFLINE = False


def fresh():
    """Get what other sessions pushed before reading or changing anything."""
    if OFFLINE: return
    r = git("pull", "--rebase", "--autostash", "origin", "main")
    if r.returncode:
        git("rebase", "--abort")
        sys.exit("Could not get the latest from GitHub; nothing was changed:\n" + (r.stderr or r.stdout)[-400:])


def publish(role, msg):
    """Commit the team files and push at once, so other sessions see the change within minutes."""
    cmd_build(None)
    if OFFLINE: return
    git("add", "--", "tarot-talk/team")
    if git("diff", "--cached", "--quiet", "--", "tarot-talk/team").returncode:
        c = git("commit", "-m", f"[tt:{role}] {msg}", "--", "tarot-talk/team")
        if c.returncode: sys.exit("commit failed:\n" + (c.stderr or c.stdout)[-300:])
    for _ in range(4):
        if git("push", "origin", "HEAD:main").returncode == 0: return
        r = git("pull", "--rebase", "--autostash", "origin", "main")
        if r.returncode:
            git("rebase", "--abort"); git("reset", "--hard", "origin/main")
            sys.exit("Another session changed the same task at the same moment. Your change was dropped; run the command again.")
    sys.exit("Could not push to GitHub after 4 tries. Your change is saved here; run `sync` later.")


def inbox_for(role, since=None):
    out = []
    for p in STATUS.glob("*.json"):
        s = load(p) or {}
        for m in s.get("outbox", []):
            if s.get("role") != role and m.get("to") in (role, "all") and (since is None or m["at"] > since):
                out.append({**m, "from": s.get("role")})
    return sorted(out, key=lambda m: m["at"])


def cmd_start(a):
    fresh()
    role = slug(a.role or os.environ.get("AGENT_ROLE") or "")
    if not role: sys.exit("Give a role: start --role <role>")
    R = roles()
    if role not in R:
        R[role] = {"about": a.about or "New role, created by a session. Describe your lane with: start --role %s --about \"..\"" % role, "owns": [], "created": iso(now())}
        save(TEAM / "roles.json", R); print(f"New role '{role}' created.")
    elif a.about: R[role]["about"] = a.about; save(TEAM / "roles.json", R)
    git("config", "agent.role", role)
    s = st(role); s["session"] = {"link": a.link or (s.get("session") or {}).get("link"), "started": iso(now())}; put(s)
    print(f"\n=== Tarot Talk By Sakshi: briefing for '{role}' ===\nYour lane: {R[role]['about']}")
    if R[role].get("owns"): print("You own: " + ", ".join(R[role]["owns"]))
    if s.get("doing") or s.get("next"): print(f"Your last status ({ist(s.get('updated_at'))}): doing: {s.get('doing') or '-'} | next: {s.get('next') or '-'} | blocked: {s.get('blocked') or '-'}")
    ms = inbox_for(role, s.get("read_at"))
    print(f"\nMessages for you: {len(ms)} new" + ("" if ms else " (none)"))
    for m in ms[-12:]: print(f"  [{ist(m['at'])}] {m['from']} -> {m['to']}: {m['text']}")
    T = [t for t in tasks() if t.get("state") != "done"]
    mine = [t for t in T if t.get("owner") == role and lease_ok(t)]; free = [t for t in T if not lease_ok(t) and t.get("lane") in (role, "any")]
    print("\nTasks you hold:" + ("" if mine else " none"))
    for t in mine: print(f"  {t['id']}  {t['title']}  (lease until {ist(t['lease_until'])})")
    print("Free tasks in your lane:" + ("" if free else " none"))
    for t in free: print(f"  {t['id']}  {t['title']}")
    print("\nOther sessions:")
    for p in sorted(STATUS.glob("*.json")):
        o = load(p) or {}
        if o.get("role") != role: print(f"  {o.get('role')}: {o.get('doing') or '-'}  (updated {ist(o.get('updated_at'))})")
    w = (load(ROOT / "dashboard" / "workspace.json") or {}).get("waiting", [])
    if w: print("\nWaiting on the owner:"); [print("  - " + str(x)[:160]) for x in w[:8]]
    publish(role, "joined")
    print("\nNow: read tarot-talk/AGENTS.md if you have not, run `inbox` to mark messages read, set your status, then work. Team commands share themselves at once; run `sync` after other work.")


def cmd_status(a):
    fresh()
    s = st(role_of(a))
    for k in ("doing", "next", "blocked"):
        v = getattr(a, k)
        if v is not None: s[k] = v
    if a.compactions is not None: s["compactions"] = a.compactions
    put(s); publish(s["role"], "status: " + (s.get("doing") or "")[:60]); print("status saved and shared")


def cmd_msg(a):
    fresh()
    s = st(role_of(a)); to = slug(a.to)
    if to != "all" and to not in roles(): sys.exit(f"No role '{to}'. Roles: {', '.join(roles())}")
    s.setdefault("outbox", []).append({"to": to, "text": a.text[:1000], "at": iso(now())}); s["outbox"] = s["outbox"][-60:]; put(s); publish(s["role"], "message to " + to); print(f"message sent to {to}")


def cmd_inbox(a):
    fresh()
    role = role_of(a); s = st(role); ms = inbox_for(role)
    new = [m for m in ms if s.get("read_at") is None or m["at"] > s["read_at"]]
    for m in ms[-20:]: print(("NEW " if m in new else "    ") + f"[{ist(m['at'])}] {m['from']} -> {m['to']}: {m['text']}")
    if not ms: print("no messages")
    s["read_at"] = iso(now()); put(s); publish(role, "read messages")


def cmd_task(a):
    fresh()
    n = max([int(t["id"][1:]) for t in tasks() if re.fullmatch(r"T\d+", t.get("id", ""))] + [0]) + 1
    t = {"id": f"T{n}", "title": a.title, "detail": a.detail or "", "lane": slug(a.lane), "state": "open", "owner": None, "lease_until": None, "created": iso(now()), "by": role_of(a), "log": []}
    save(TASKS / f"{t['id']}.json", t); publish(t["by"], "new task " + t["id"]); print(f"task {t['id']} added")


def _task(tid):
    t = load(TASKS / f"{tid.upper()}.json")
    if not t: sys.exit(f"no task {tid}")
    return t


def cmd_claim(a):
    fresh()
    role = role_of(a); t = _task(a.id)
    if lease_ok(t) and t["owner"] != role: sys.exit(f"{t['id']} is held by {t['owner']} until {ist(t['lease_until'])}. Message them, or wait.")
    t.update(owner=role, state="claimed", lease_until=iso(now() + dt.timedelta(hours=LEASE_HOURS))); t["log"].append({"at": iso(now()), "who": role, "what": "claimed"}); save(TASKS / f"{t['id']}.json", t); publish(role, "claim " + t["id"]); print(f"{t['id']} is yours for {LEASE_HOURS} hours; claim again to renew")


def cmd_release(a):
    fresh()
    role = role_of(a); t = _task(a.id)
    if t.get("owner") != role: sys.exit("not yours")
    t.update(owner=None, state="open", lease_until=None); t["log"].append({"at": iso(now()), "who": role, "what": "released"}); save(TASKS / f"{t['id']}.json", t); publish(role, "release " + t["id"]); print("released")


def cmd_done(a):
    fresh()
    role = role_of(a); t = _task(a.id)
    t.update(state="done", owner=role, lease_until=None, result=a.result or ""); t["log"].append({"at": iso(now()), "who": role, "what": "done"}); save(TASKS / f"{t['id']}.json", t); publish(role, "done " + t["id"]); print("done")


def cmd_build(a=None):
    R, S, T = roles(), [load(p) for p in sorted(STATUS.glob("*.json"))], tasks()
    msgs = sorted(({**m, "from": s["role"]} for s in S for m in s.get("outbox", [])), key=lambda m: m["at"], reverse=True)[:40]
    board = {"built": iso(now()), "roles": R, "sessions": [{k: s.get(k) for k in ("role", "doing", "next", "blocked", "updated_at", "compactions", "session")} for s in S],
             "tasks": [{**{k: t.get(k) for k in ("id", "title", "detail", "lane", "state", "owner", "lease_until", "result", "by")}, "held": lease_ok(t)} for t in T], "messages": msgs}
    save(TEAM / "board.json", board)
    L = ["# Tarot Talk team status", "", "_Built by `team/team.py build`. Do not edit by hand._", "", "## Sessions", "", "| Role | Updated | Doing | Next | Blocked |", "|---|---|---|---|---|"]
    L += [f"| `{s['role']}` | {ist(s.get('updated_at'))} | {s.get('doing') or '-'} | {s.get('next') or '-'} | {s.get('blocked') or '-'} |" for s in S]
    L += ["", "## Tasks", "", "| Id | Lane | State | Owner | Title |", "|---|---|---|---|---|"]
    L += [f"| {t['id']} | {t.get('lane')} | {t.get('state')} | {t.get('owner') if lease_ok(t) or t.get('state') == 'done' else 'free'} | {t['title']} |" for t in T if t.get("state") != "done"]
    L += ["", "## Latest messages", ""] + [f"- {ist(m['at'])} **{m['from']}** to **{m['to']}**: {m['text']}" for m in msgs[:15]]
    (TEAM / "STATUS.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    if a is not None: print("built")


def cmd_sync(a):
    role = role_of(a)
    r = git("pull", "--rebase", "--autostash", "origin", "main")
    if r.returncode: sys.exit("git pull failed; fix that first:\n" + (r.stderr or r.stdout)[-400:])
    cmd_build(None); git("add", "--", "tarot-talk/team")
    if git("diff", "--cached", "--quiet", "--", "tarot-talk/team").returncode:
        c = git("commit", "-m", f"[tt:{role}] {a.m or 'status'}", "--", "tarot-talk/team")
        if c.returncode: sys.exit("commit failed:\n" + (c.stderr or c.stdout)[-300:])
    for _ in range(3):
        p = git("push", "origin", "HEAD:main")
        if p.returncode == 0: print("synced"); return
        git("pull", "--rebase", "--autostash", "origin", "main")
    sys.exit("push failed after 3 tries:\n" + (p.stderr or p.stdout)[-300:])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sub = ap.add_subparsers(dest="cmd", required=True)
    def P(name, f, *args):
        s = sub.add_parser(name); s.add_argument("--role"); s.set_defaults(f=f)
        for x in args: x(s)
        return s
    P("start", cmd_start, lambda s: s.add_argument("--about"), lambda s: s.add_argument("--link"))
    P("status", cmd_status, lambda s: s.add_argument("--doing"), lambda s: s.add_argument("--next"), lambda s: s.add_argument("--blocked"), lambda s: s.add_argument("--compactions", type=int))
    P("msg", cmd_msg, lambda s: s.add_argument("to"), lambda s: s.add_argument("text"))
    P("inbox", cmd_inbox)
    t = P("task", cmd_task, lambda s: s.add_argument("verb", choices=["new"]), lambda s: s.add_argument("--title", required=True), lambda s: s.add_argument("--lane", required=True), lambda s: s.add_argument("--detail"))
    P("claim", cmd_claim, lambda s: s.add_argument("id")); P("release", cmd_release, lambda s: s.add_argument("id")); P("done", cmd_done, lambda s: s.add_argument("id"), lambda s: s.add_argument("--result"))
    P("build", cmd_build); P("sync", cmd_sync, lambda s: s.add_argument("-m"))
    ap.add_argument("--offline", action="store_true", help="change the files here only; do not pull or push")
    a = ap.parse_args()
    global OFFLINE; OFFLINE = a.offline
    a.f(a)


if __name__ == "__main__":
    main()
