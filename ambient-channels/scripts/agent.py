#!/usr/bin/env python3
"""Session tool for every agent working in this repo (see AGENTS.md).

Commands
  start   --role R                 register this session and print the briefing
  status  [--doing ..] [--next ..] [--blocked ..]   update your status file
  claim   CARD                     take (or renew) a 6 h lease on a card
  release CARD                     give a card back
  gate    CARD G# pass|fail|pending --note ".."
  move    CARD STAGE               move a card (refused if required gates not passed)
  new-card --id ID --channel C --title T [--priority N] [--stage idea]
  build                            regenerate STATUS.md and data/board.json
  report                           print a weekly summary for the orchestrator
  check   [--range A..B]           CI: verify commits carry status trail (used by status-guard)
  hook-pre-commit / hook-commit-msg FILE   (called by .githooks)

Role comes from --role, $AGENT_ROLE or `git config agent.role`.
Standard library only.
"""
import argparse, datetime as dt, json, os, re, subprocess, sys, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARDS = ROOT / "production" / "cards"
STATUS_DIR = ROOT / "status"
LEASE_HOURS = 6
STAGES = ["idea", "concept", "assets", "render", "package", "ready", "published", "measured"]
GATES = ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7"]
GATE_NAMES = {"G0": "Concept", "G1": "Still image", "G2": "Motion", "G3": "Music & sound",
              "G4": "Render QA", "G5": "Package", "G6": "Publish", "G7": "21-day review"}
NEEDS = {"assets": ["G0"], "render": ["G1", "G2", "G3"], "package": ["G4"],
         "ready": ["G5"], "published": ["G6"], "measured": ["G7"]}
ORCH_ONLY_GATES = {"G0", "G6"}
REVIEW_GATES = {"G1", "G2", "G3", "G4", "G5"}  # need an independent reviewer (docs/quality-bar.md)
BOT_ROLES = {"bot", "tracker"}


# ---------- helpers ----------
def now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0)

def iso(t):
    return t.isoformat().replace("+00:00", "Z")

def parse(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None

def ago(s):
    t = parse(s)
    if not t:
        return "never"
    m = int((now() - t).total_seconds() // 60)
    return f"{m}m ago" if m < 60 else f"{m // 60}h ago" if m < 2880 else f"{m // 1440}d ago"

def load(p, default=None):
    try:
        return json.loads(Path(p).read_text())
    except FileNotFoundError:
        return default

def save(p, obj):
    Path(p).parent.mkdir(parents=True, exist_ok=True)
    Path(p).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")

def git(*args, check=True):
    r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode:
        raise SystemExit(r.stderr.strip())
    return r.stdout.strip()

def roles():
    cfg = load(ROOT / "config" / "channels.json", {"channels": []})
    return ["orchestrator", "reviewer"] + [c["role"] for c in cfg["channels"]]

def role_of(args=None):
    r = (getattr(args, "role", None) if args else None) or os.environ.get("AGENT_ROLE") \
        or git("config", "--get", "agent.role", check=False)
    if not r:
        sys.exit("No role. Set AGENT_ROLE (e.g. export AGENT_ROLE=channel-fantasy) or pass --role.")
    if r not in roles() and r not in BOT_ROLES:
        sys.exit(f"Unknown role '{r}'. Known: {', '.join(roles())}")
    return r

def status_path(role):
    return STATUS_DIR / f"{role}.json"

def get_status(role):
    return load(status_path(role), {"role": role, "session": None, "updated_at": None,
                                    "doing": "", "next": "", "blocked": "", "files_last_commit": [],
                                    "sessions": []})

def card_path(cid):
    return CARDS / f"{cid}.json"

def get_card(cid):
    c = load(card_path(cid))
    if not c:
        sys.exit(f"No card {cid}")
    return c

def all_cards():
    return sorted((load(p) for p in CARDS.glob("*.json")), key=lambda c: (c.get("priority", 9), c["id"]))

def lane_of(role):
    return role.replace("channel-", "") if role.startswith("channel-") else None

def lease_ok(c):
    t = parse(c.get("lease_until"))
    return bool(c.get("owner")) and t and t > now()

def log(c, who, event):
    c.setdefault("history", []).append({"at": iso(now()), "by": who, "event": event})


# ---------- commands ----------
def cmd_start(a):
    role = role_of(a)
    st = get_status(role)
    sid = os.environ.get("AGENT_SESSION") or uuid.uuid4().hex[:8]
    st["session"] = sid
    st["updated_at"] = iso(now())
    st.setdefault("sessions", []).append({"id": sid, "started_at": iso(now())})
    st["sessions"] = st["sessions"][-10:]
    if not st.get("doing"):
        st["doing"] = "session started"
    save(status_path(role), st)
    print(f"== {role} | session {sid} ==")
    print(f"Role file: agents/{role}.md")
    print(f"Last status: doing='{st.get('doing')}' next='{st.get('next')}' blocked='{st.get('blocked')}'")
    lane = lane_of(role)
    cards = all_cards()
    mine = [c for c in cards if c.get("owner") == role and lease_ok(c)]
    free = [c for c in cards if (lane is None or c["channel"] == lane) and not lease_ok(c)
            and c["stage"] not in ("published", "measured")]
    print("\nYour claimed cards:" if mine else "\nYou hold no cards.")
    for c in mine:
        print(f"  {c['id']:6} {c['stage']:9} lease {c['lease_until']}  {c['title']}")
    print("\nFree cards (claim one):")
    for c in free[:10]:
        pend = [g for g in GATES if c["gates"].get(g, {}).get("state") != "pass"]
        print(f"  {c['id']:6} p{c.get('priority', 9)} {c['stage']:9} next gate {pend[0] if pend else '-':3} {c['title']}")
    if role == "orchestrator":
        q = [c for c in cards if c["stage"] == "review" or any(
            c["gates"].get(g, {}).get("state") == "review" for g in ORCH_ONLY_GATES)]
        print("\nWaiting for your sign-off:" if q else "\nNothing waiting for sign-off.")
        for c in q:
            print(f"  {c['id']:6} {c['title']}")
    others = [r for r in roles() if r != role]
    print("\nOther sessions:")
    for r in others:
        s = get_status(r)
        print(f"  {r:16} {ago(s.get('updated_at')):>9}  doing: {s.get('doing') or '-'}")
    ms = messages_for(role)
    print("\nMessages for you:" if ms else "\nNo messages for you.")
    for m in ms[:10]:
        print(f"  {ago(m['at']):>9}  from {m['from']:16} {m['text']}")
    latest = load(ROOT / "data" / "latest.json")
    if latest:
        print(f"\nTracker last run: {latest.get('generated_at')} ({ago(latest.get('generated_at'))})")
    print("\nNext: claim a card, then `agent.py status --doing ... --next ...`.")


def messages_for(role, days=7):
    """Messages other sessions left for `role` (or for "all") in their own status files."""
    out = []
    for r in roles():
        if r == role:
            continue
        for m in get_status(r).get("outbox", []):
            if m.get("to") in (role, "all") and (now() - parse(m["at"])).days < days:
                out.append({**m, "from": r})
    return sorted(out, key=lambda m: m["at"], reverse=True)


def cmd_msg(a):
    """Leave a message for another session (or "all"). It lives in your own status file, so no write conflicts."""
    role = role_of(a)
    if a.to not in roles() + ["all"]:
        sys.exit(f"Unknown recipient '{a.to}'. Known: all, {', '.join(roles())}")
    st = get_status(role)
    st["outbox"] = (st.get("outbox", []) + [{"to": a.to, "text": a.text, "at": iso(now())}])[-30:]
    st["updated_at"] = iso(now())
    save(status_path(role), st)
    print(f"Message for {a.to} saved in status/{role}.json. Commit and push so they see it.")


def cmd_inbox(a):
    role = role_of(a)
    ms = messages_for(role)
    if not ms:
        print("No messages for you in the last 7 days.")
    for m in ms:
        print(f"  {ago(m['at']):>9}  from {m['from']:16} to {m['to']:8} {m['text']}")


def cmd_status(a):
    role = role_of(a)
    st = get_status(role)
    for k in ("doing", "next", "blocked"):
        v = getattr(a, k)
        if v is not None:
            st[k] = v
    st["updated_at"] = iso(now())
    save(status_path(role), st)
    print(json.dumps(st, indent=2))


def cmd_claim(a):
    role = role_of(a)
    c = get_card(a.card)
    lane = lane_of(role)
    if lane and c["channel"] != lane:
        sys.exit(f"{a.card} is in lane '{c['channel']}', you are {role}.")
    if lease_ok(c) and c["owner"] != role:
        sys.exit(f"{a.card} is leased by {c['owner']} until {c['lease_until']}.")
    renew = c.get("owner") == role and lease_ok(c)
    c["owner"] = role
    c["lease_until"] = iso(now() + dt.timedelta(hours=LEASE_HOURS))
    log(c, role, "lease renewed" if renew else "claimed")
    save(card_path(a.card), c)
    print(f"{a.card} leased to {role} until {c['lease_until']}")


def cmd_release(a):
    role = role_of(a)
    c = get_card(a.card)
    if c.get("owner") not in (role, None) and lease_ok(c):
        sys.exit(f"{a.card} belongs to {c['owner']}.")
    c["owner"], c["lease_until"] = None, None
    log(c, role, "released")
    save(card_path(a.card), c)
    print(f"{a.card} released")


def cmd_gate(a):
    role = role_of(a)
    c = get_card(a.card)
    g = a.gate.upper()
    if g not in GATES:
        sys.exit(f"Gate must be one of {GATES}")
    state = a.state
    if g in ORCH_ONLY_GATES and state == "pass" and role != "orchestrator":
        state = "review"
        print(f"{g} is signed by the orchestrator — set to 'review' instead.")
    if g in REVIEW_GATES and state == "pass" and role not in ("reviewer", "orchestrator"):
        state = "review"
        print(f"{g} needs an independent reviewer (docs/quality-bar.md) — set to 'review' instead.")
    if state == "pass" and g in REVIEW_GATES | ORCH_ONLY_GATES:
        ref = (a.note or "").split()[0] if a.note else ""
        if g in REVIEW_GATES and not (ref.startswith("reviews/") and (ROOT / ref).exists()):
            sys.exit(f"Refused: passing {g} needs --note starting with an existing review file, e.g. reviews/{a.card}/{g}-<date>.md")
        if g == "G6" and any(c["gates"][x]["state"] != "pass" for x in REVIEW_GATES):
            sys.exit("Refused: G6 needs G1–G5 passed by the reviewer first.")
    if role not in ("orchestrator", "reviewer") and not (c.get("owner") == role and lease_ok(c)):
        sys.exit(f"Claim {a.card} first.")
    c["gates"][g] = {"state": state, "note": a.note or "", "at": iso(now()), "by": role}
    log(c, role, f"{g} {state}: {a.note or ''}".strip())
    save(card_path(a.card), c)
    print(f"{a.card} {g} = {state}")


def cmd_move(a):
    role = role_of(a)
    c = get_card(a.card)
    if a.stage not in STAGES + ["review", "blocked"]:
        sys.exit(f"Stage must be one of {STAGES + ['review', 'blocked']}")
    if role != "orchestrator" and not (c.get("owner") == role and lease_ok(c)):
        sys.exit(f"Claim {a.card} first.")
    missing = [g for g in NEEDS.get(a.stage, []) if c["gates"].get(g, {}).get("state") != "pass"]
    if missing and not a.force:
        sys.exit(f"Refused: {a.stage} needs {', '.join(missing)} passed.")
    old = c["stage"]
    c["stage"] = a.stage
    log(c, role, f"stage {old} -> {a.stage}" + (" (forced)" if missing else ""))
    save(card_path(a.card), c)
    print(f"{a.card}: {old} -> {a.stage}")


def new_card_obj(cid, channel, title, priority=5, stage="idea"):
    return {"id": cid, "channel": channel, "title": title, "stage": stage, "priority": priority,
            "owner": None, "lease_until": None,
            "gates": {g: {"state": "pending", "note": "", "at": None, "by": None} for g in GATES},
            "duration_h": 3, "budget_usd": 5, "spend": [], "youtube_id": None,
            "publish_target": None, "plan": None, "keyword": None, "notes": "", "licenses": [],
            "history": []}

def cmd_new_card(a):
    role = role_of(a)
    if card_path(a.id).exists():
        sys.exit(f"{a.id} exists")
    c = new_card_obj(a.id, a.channel, a.title, a.priority, a.stage)
    log(c, role, "created")
    save(card_path(a.id), c)
    print(f"created {a.id}")


def last_commit_by_role():
    out = {}
    raw = git("log", "-n", "300", "--pretty=%H%x09%cI%x09%s", "--", ".", check=False)
    for line in raw.splitlines():
        h, t, s = line.split("\t", 2)
        m = re.match(r"\[([\w-]+)\]", s)
        if m and m.group(1) not in out:
            out[m.group(1)] = {"hash": h[:7], "at": t, "subject": s}
    return out


def cmd_build(a=None):
    cards = all_cards()
    commits = last_commit_by_role()
    latest = load(ROOT / "data" / "latest.json", {})
    L = ["# STATUS", "", f"_Generated {iso(now())} by `scripts/agent.py build`. Do not edit._", ""]
    L += ["## Sessions", "", "| Role | Updated | Doing | Next | Blocked | Last commit |", "|---|---|---|---|---|---|"]
    for r in roles():
        s = get_status(r)
        lc = commits.get(r)
        L.append(f"| `{r}` | {ago(s.get('updated_at'))} | {s.get('doing') or '-'} | {s.get('next') or '-'} | "
                 f"{s.get('blocked') or '-'} | {(lc['hash'] + ' ' + lc['subject'][:50]) if lc else '-'} |")
    L += ["", "## Production board", "", "| Card | Channel | Stage | Pri | Owner | Next gate | Target | Title |",
          "|---|---|---|---|---|---|---|---|"]
    for c in cards:
        pend = [g for g in GATES if c["gates"].get(g, {}).get("state") != "pass"]
        owner = f"{c['owner']} (until {c['lease_until'][5:16].replace('T', ' ')})" if lease_ok(c) else "free"
        L.append(f"| {c['id']} | {c['channel']} | {c['stage']} | {c.get('priority', '-')} | {owner} | "
                 f"{(pend[0] + ' ' + GATE_NAMES[pend[0]]) if pend else 'done'} | {c.get('publish_target') or '-'} | {c['title']} |")
    review = [c for c in cards if any(c['gates'][g]['state'] == 'review' for g in GATES)]
    L += ["", "## Waiting for orchestrator", ""]
    L += [f"- {c['id']}: " + ", ".join(g for g in GATES if c['gates'][g]['state'] == 'review') for c in review] or ["- nothing"]
    stale = [c for c in cards if c.get("owner") and not lease_ok(c)]
    if stale:
        L += ["", "## Expired leases (free to take)", ""] + [f"- {c['id']} was {c['owner']}" for c in stale]
    L += ["", "## Tracking", "", f"- Last tracker run: {latest.get('generated_at', 'never')} ({ago(latest.get('generated_at'))})",
          f"- Channels tracked: {len(latest.get('channels', []))}", ""]
    (ROOT / "STATUS.md").write_text("\n".join(L) + "\n")
    board = {"generated_at": iso(now()), "cards": cards,
             "sessions": {r: get_status(r) for r in roles()}, "last_commits": commits}
    save(ROOT / "data" / "board.json", board)
    print("STATUS.md and data/board.json rebuilt")


def cmd_report(a):
    latest = load(ROOT / "data" / "latest.json", {})
    for ch in latest.get("channels", []):
        vids = ch.get("videos", [])
        if not vids:
            continue
        vpd = sorted(v.get("views_per_day", 0) for v in vids)
        med = vpd[len(vpd) // 2] or 1
        hot = [v for v in vids if v.get("views_per_day", 0) >= 3 * med]
        for v in hot:
            print(f"OUTLIER {ch['lane']:8} {ch['name'][:24]:24} {v['views_per_day']:>8.0f}/day  {v['title'][:70]}")


def staged_files():
    # --relative: only files inside this folder (the repo may hold other projects), paths relative to ROOT
    return [f for f in git("diff", "--cached", "--name-only", "--relative", check=False).splitlines() if f]


OWNERSHIP = {
    "orchestrator": ["config/", "AGENTS.md", "CLAUDE.md", "agents/", "docs/", "dashboard/", "scripts/",
                     ".github/", ".githooks/", "production/cards/", "channels/", "README.md", "status/orchestrator.json"],
}

def allowed(role, f):
    if f.startswith("status/"):
        return f == f"status/{role}.json"
    if f == "STATUS.md" or f.startswith("data/") or f.startswith("dashboard/export/"):
        return False  # generated by CI/tracker only — committing them causes merge conflicts
    if role == "orchestrator":
        return True
    if role == "reviewer":
        return f.startswith("reviews/") or f.startswith("production/cards/") or f == "docs/quality-bar.md"
    lane = lane_of(role)
    if f.startswith("production/cards/"):
        c = load(ROOT / f)
        return c is None or c.get("channel") == lane
    return f.startswith(f"channels/{lane}/")


def cmd_hook_pre_commit(a):
    files = staged_files()
    if not files:
        return  # commit touches nothing in ambient-channels/: not ours to police
    role = role_of(None)
    bad = []
    for f in files:
        if f.endswith(".json") and (ROOT / f).exists():
            try:
                json.loads((ROOT / f).read_text())
            except Exception as e:
                bad.append(f"{f}: invalid JSON ({e})")
        if role not in BOT_ROLES and not allowed(role, f):
            bad.append(f"{f}: not owned by {role} (see AGENTS.md 'Write only what you own')")
    if bad and not os.environ.get("AGENT_OVERRIDE"):
        print("pre-commit refused:\n  " + "\n  ".join(bad) +
              "\n(Unstage those files, or set AGENT_OVERRIDE=1 if the owner asked for it.)")
        sys.exit(1)
    if role in BOT_ROLES:
        return
    st = get_status(role)
    if not st.get("doing"):
        sys.exit(f"pre-commit refused: status/{role}.json has no 'doing'. Run: agent.py status --doing '...' --next '...'")
    st["updated_at"] = iso(now())
    st["files_last_commit"] = [f for f in files if f != f"status/{role}.json"][:40]
    save(status_path(role), st)
    git("add", f"status/{role}.json")


def cmd_hook_commit_msg(a):
    if not staged_files():
        return
    role = role_of(None)
    msg = Path(a.file).read_text()
    if role in BOT_ROLES or msg.startswith("Merge") or msg.startswith("fixup!"):
        return
    if not msg.startswith(f"[{role}] "):
        sys.exit(f"commit-msg refused: message must start with '[{role}] '")


def cmd_check(a):
    """CI: every non-bot commit in the range must be prefixed and touch its role's status file."""
    rng = a.range or "HEAD~20..HEAD"
    raw = git("log", "--no-merges", "--pretty=%H%x09%an%x09%s", rng, "--", ".", check=False)
    problems = []
    for line in raw.splitlines():
        h, author, subj = line.split("\t", 2)
        if author in ("github-actions[bot]", "tracker-bot") or subj.startswith("[bot]") or subj.startswith("[tracker]") \
                or subj.startswith("Squashed '"):
            continue
        m = re.match(r"\[([\w-]+)\] ", subj)
        if not m:
            problems.append(f"{h[:7]} missing [role] prefix: {subj}")
            continue
        files = git("show", "--pretty=", "--name-only", "--relative", h, check=False).splitlines()
        if f"status/{m.group(1)}.json" not in files:
            problems.append(f"{h[:7]} by {m.group(1)} did not update status/{m.group(1)}.json (hooks not installed?)")
    if problems:
        print("STATUS GUARD FAILED:\n  " + "\n  ".join(problems))
        sys.exit(1)
    print("status guard ok")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--role")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("start"); s.add_argument("--role")
    s = sub.add_parser("status"); s.add_argument("--role"); s.add_argument("--doing"); s.add_argument("--next"); s.add_argument("--blocked")
    s = sub.add_parser("claim"); s.add_argument("card"); s.add_argument("--role")
    s = sub.add_parser("release"); s.add_argument("card"); s.add_argument("--role")
    s = sub.add_parser("gate"); s.add_argument("card"); s.add_argument("gate"); s.add_argument("state", choices=["pass", "fail", "pending", "review"]); s.add_argument("--note"); s.add_argument("--role")
    s = sub.add_parser("move"); s.add_argument("card"); s.add_argument("stage"); s.add_argument("--force", action="store_true"); s.add_argument("--role")
    s = sub.add_parser("new-card"); s.add_argument("--id", required=True); s.add_argument("--channel", required=True); s.add_argument("--title", required=True); s.add_argument("--priority", type=int, default=5); s.add_argument("--stage", default="idea"); s.add_argument("--role")
    s = sub.add_parser("msg"); s.add_argument("to"); s.add_argument("text"); s.add_argument("--role")
    s = sub.add_parser("inbox"); s.add_argument("--role")
    sub.add_parser("build"); sub.add_parser("report")
    s = sub.add_parser("check"); s.add_argument("--range")
    sub.add_parser("hook-pre-commit")
    s = sub.add_parser("hook-commit-msg"); s.add_argument("file")
    a = p.parse_args()
    {"start": cmd_start, "status": cmd_status, "msg": cmd_msg, "inbox": cmd_inbox, "claim": cmd_claim, "release": cmd_release, "gate": cmd_gate,
     "move": cmd_move, "new-card": cmd_new_card, "build": cmd_build, "report": cmd_report, "check": cmd_check,
     "hook-pre-commit": cmd_hook_pre_commit, "hook-commit-msg": cmd_hook_commit_msg}[a.cmd](a)


if __name__ == "__main__":
    main()
