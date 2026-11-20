#!/usr/bin/env python3
"""Instagram scout: command-line step, run on the owner's own computer.

What it does for each reel in input/cli-queue.json:
  1. fetches the reel's sound track to a temporary folder (yt-dlp)
  2. writes a timed transcript of the speech (faster-whisper)
  3. measures the soundtrack: loudness and silences (ffmpeg)
  4. saves only text and numbers to output/<handle>/cli/<id>.json and deletes the fetched file

It never logs in and never uses cookies. It stops at the first refusal from Instagram and will not
start again for 24 hours. Fetching reels with a script is against Instagram's terms; the owner runs
this on their own computer by their own choice, at a slow pace.
The dashboard shows what this step has and has not done, from output/cli-status.json.

  tt-scout check            which tools are installed
  tt-scout queue pagetkagy  choose reels worth a transcript (pinned and 3x-median reels)
  tt-scout run              process the queue (at most 10 per run, 20 s apart)
  tt-scout push             commit and push the results so the dashboard can show them

Install once (this also installs yt-dlp and faster-whisper):
  python -m pip install "git+https://github.com/ashish91aggarwal-alt/AI.git#subdirectory=instagram-scouting"
and ffmpeg:  winget install Gyan.FFmpeg

Run it from inside a clone of the AI repo (anywhere under it), or set TT_SCOUT_HOME to the
instagram-scouting folder.
"""
import argparse, datetime, json, pathlib, re, shutil, subprocess, sys, tempfile, time

import os


def find_root():
    """The instagram-scouting project folder: TT_SCOUT_HOME, or found by walking up from where the command is run."""
    env = os.environ.get("TT_SCOUT_HOME")
    if env:
        return pathlib.Path(env).resolve()
    here = pathlib.Path.cwd().resolve()
    for p in [here, *here.parents]:
        for cand in (p, p / "instagram-scouting"):
            if (cand / "input").is_dir() and (cand / "output").is_dir() and (cand / "pyproject.toml").exists():
                return cand
    dev = pathlib.Path(__file__).resolve().parent.parent
    if (dev / "input").is_dir():
        return dev
    sys.exit("Could not find the instagram-scouting folder. Run this inside your clone of the AI repo, or set TT_SCOUT_HOME.")


ROOT = OUT = QUEUE = STATUS = None


def locate():
    global ROOT, OUT, QUEUE, STATUS
    ROOT = find_root()
    OUT, QUEUE, STATUS = ROOT / "output", ROOT / "input" / "cli-queue.json", ROOT / "output" / "cli-status.json"
MAX_PER_RUN, PAUSE, COOL_OFF_H = 10, 20, 24


def now():
    return datetime.datetime.now().astimezone().strftime("%Y-%m-%d %H:%M %z")


def have(mod):
    try:
        m = __import__(mod); return getattr(getattr(m, "version", None), "__version__", None) or getattr(m, "__version__", True)
    except Exception:
        return False


def tools():
    ff = shutil.which("ffmpeg")
    return {"ytdlp": have("yt_dlp"), "whisper": have("faster_whisper"), "ffmpeg": bool(ff)}


def load_status():
    if STATUS.exists():
        return json.loads(STATUS.read_text(encoding="utf-8"))
    return {"machine": "the owner's PC", "tools": {}, "checked": None, "runs": []}


def save_status(s):
    STATUS.parent.mkdir(parents=True, exist_ok=True)
    STATUS.write_text(json.dumps(s, indent=1, ensure_ascii=False), encoding="utf-8")


def cmd_check(_):
    s = load_status(); s["tools"] = tools(); s["checked"] = now(); save_status(s)
    for k, v in s["tools"].items():
        print(f"  {k:8} {'installed ' + (v if isinstance(v, str) else '') if v else 'MISSING'}")
    missing = [k for k, v in s["tools"].items() if not v]
    print("Project folder: " + str(ROOT))
    print("All tools found." if not missing else "Missing: " + ", ".join(missing) + ". yt-dlp and faster-whisper come with the package (reinstall it); ffmpeg: winget install Gyan.FFmpeg")
    return 0 if not missing else 1


def cmd_queue(a):
    page = json.loads((OUT / a.handle / "page.json").read_text(encoding="utf-8"))
    done = {p.stem for p in (OUT / a.handle / "cli").glob("*.json")} if (OUT / a.handle / "cli").exists() else set()
    pick = [r for r in page["reels"] if (r["pinned"] or (r.get("multiple") or 0) >= 3) and r["id"] not in done]
    old = json.loads(QUEUE.read_text(encoding="utf-8")) if QUEUE.exists() else []
    q = [x for x in old if x["handle"] != a.handle] + [{"handle": a.handle, "id": r["id"]} for r in pick]
    QUEUE.write_text(json.dumps(q, indent=1), encoding="utf-8")
    print(f"Queued {len(pick)} reels for {a.handle}: " + " ".join(r["id"] for r in pick))
    return 0


def run(cmd, **kw):
    if os.name == "nt": kw.setdefault("creationflags", 0x08000000)      # no console window flashing
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)


def safe_handle(v):
    """A folder name taken from fetched data must never be able to leave the output folder."""
    v = str(v or "")
    return v if re.fullmatch(r"[A-Za-z0-9_][A-Za-z0-9_.]{0,29}", v) and ".." not in v else "_unknown"


def read_wav(path):
    """The 16 kHz mono WAV that ffmpeg wrote, as float samples between -1 and 1."""
    import wave
    import numpy as np
    with wave.open(str(path), "rb") as w:
        if w.getframerate() != 16000 or w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise RuntimeError("unexpected sound format from ffmpeg")
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0


def audio_stats(wav):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(wav), "-af", "volumedetect,silencedetect=noise=-35dB:d=0.4", "-f", "null", "-"])
    t = r.stderr
    num = lambda pat: (lambda m: float(m.group(1)) if m else None)(re.search(pat, t))
    sil = [(float(a), float(b)) for a, b in zip(re.findall(r"silence_start: (-?[\d.]+)", t), re.findall(r"silence_end: (-?[\d.]+)", t))]
    return {"mean_db": num(r"mean_volume: (-?[\d.]+) dB"), "peak_db": num(r"max_volume: (-?[\d.]+) dB"),
            "silences": [{"from": max(0.0, round(a, 1)), "to": round(b, 1)} for a, b in sil][:40]}


def process(item, model):
    import yt_dlp
    url = f"https://www.instagram.com/reel/{item['id']}/"
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="scout_"))
    try:
        opts = {"outtmpl": str(tmp / "v.%(ext)s"), "quiet": True, "no_warnings": True, "format": "bestaudio/best", "noplaylist": True,
                "retries": 0, "extractor_retries": 0, "fragment_retries": 0}
        with yt_dlp.YoutubeDL(opts) as y:
            info = y.extract_info(url, download=True)
        video = next(tmp.glob("v.*"), None)
        if video is None:
            raise RuntimeError("no video or sound found in this post (it may be pictures only)")
        wav = tmp / "a.wav"
        r = run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(wav)])
        if r.returncode or not wav.exists():
            raise RuntimeError("ffmpeg could not read the audio: " + r.stderr[-200:])
        segs, meta = model.transcribe(read_wav(wav), vad_filter=True)   # samples are passed in directly: the model's own file reader is skipped
        transcript = [{"from": round(s.start, 1), "to": round(s.end, 1), "text": s.text.strip()} for s in segs]
        handle = safe_handle(item.get("handle") or info.get("channel") or info.get("uploader"))
        facts = {k: info.get(k) for k in ("like_count", "comment_count", "view_count", "upload_date", "description") if info.get(k) is not None}
        if "description" in facts: facts["description"] = str(facts["description"])[:1200]
        res = {"id": item["id"], "handle": handle, "done": now(), "seconds": info.get("duration"), "facts": facts,
               "language": meta.language, "transcript": transcript, "audio": audio_stats(wav),
               }
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
        if tmp.exists():
            time.sleep(1); shutil.rmtree(tmp, ignore_errors=True)
    res["media_deleted"] = not tmp.exists()
    res["note"] = "Text and numbers only." + ("" if res["media_deleted"] else f" WARNING: could not delete {tmp}; delete it by hand.")
    d = OUT / res["handle"] / "cli"; d.mkdir(parents=True, exist_ok=True)
    (d / f"{item['id']}.json").write_text(json.dumps(res, indent=1, ensure_ascii=False), encoding="utf-8")
    return res


def sweep():
    """Remove fetched files left behind by an earlier run that was interrupted."""
    for p in pathlib.Path(tempfile.gettempdir()).glob("scout_*"):
        shutil.rmtree(p, ignore_errors=True)


def cmd_run(a):
    t = tools()
    if not all(t.values()):
        print("Tools missing. Run:  tt-scout check"); return 1
    s0 = load_status(); ref = s0.get("refused_at")
    if ref and not a.force:
        hours = (datetime.datetime.now() - datetime.datetime.fromisoformat(ref)).total_seconds() / 3600
        if hours < COOL_OFF_H:
            print(f"Instagram refused {hours:.0f} h ago. Waiting until {COOL_OFF_H} h have passed. Nothing was tried."); return 2
    sweep()
    q = json.loads(QUEUE.read_text(encoding="utf-8")) if QUEUE.exists() else []
    if not q:
        print("Queue is empty. Run:  tt-scout queue <handle>"); return 0
    from yt_dlp.utils import DownloadError
    from faster_whisper import WhisperModel
    print(f"Loading speech model '{a.model}' (first time downloads it) ...")
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    s = load_status(); s["tools"] = t; s["checked"] = now()
    runlog = {"started": now(), "done": [], "failed": None}
    left = list(q)
    for i, item in enumerate(q[:MAX_PER_RUN]):
        print(f"[{i + 1}/{min(len(q), MAX_PER_RUN)}] {item['id']} ...", flush=True)
        try:
            res = process(item, model)
            runlog["done"].append(item["id"]); left.remove(item)
            print(f"    transcript: {len(res['transcript'])} lines, language {res['language']}")
        except DownloadError as e:  # Instagram said no: stop, record it, and do not start again for a day
            msg = str(e).replace("\n", " ")[:300]
            runlog["failed"] = {"id": item["id"], "kind": "refused", "why": msg}
            s["refused_at"] = datetime.datetime.now().isoformat(timespec="minutes")
            print("    STOPPED, Instagram refused: " + msg)
            print("    This script does not log in or work around it. Nothing more was tried.")
            break
        except Exception as e:  # a fault in a tool on this computer, not a refusal
            msg = (type(e).__name__ + ": " + str(e)).replace("\n", " ")[:300]
            runlog["failed"] = {"id": item["id"], "kind": "tool error", "why": msg}
            print("    STOPPED, tool error on this computer: " + msg)
            break
        if i + 1 < min(len(q), MAX_PER_RUN):
            time.sleep(PAUSE)
    runlog["finished"] = now()
    s["runs"] = (s.get("runs") or [])[-9:] + [runlog]
    save_status(s)
    QUEUE.write_text(json.dumps(left, indent=1), encoding="utf-8")
    print(f"Done: {len(runlog['done'])}. Left in queue: {len(left)}. Now run:  tt-scout push")
    return 0 if not runlog["failed"] else 2


def cmd_push(_):
    repo = ROOT.parent
    paths = [str(p) for p in (OUT, QUEUE) if p.exists()]
    ident = [] if run(["git", "config", "user.email"], cwd=repo).stdout.strip() else ["-c", "user.name=tarot-talk-desk", "-c", "user.email=tarot-talk-desk@users.noreply.github.com"]
    for c in (["git", "add", "--"] + paths, ["git", *ident, "commit", "-m", "Scout: command-line results", "--"] + paths, ["git", "push"]):
        r = run(c, cwd=repo)
        last = ((r.stdout or "") + (r.stderr or "")).strip().splitlines()[-1:] or ["ok"]
        print(" ".join(c[:2]), "->", last[0])
        if r.returncode and not (c[1] == "commit" and "nothing to commit" in (r.stdout or "") + (r.stderr or "")):
            print("Stopped: git reported a problem. Nothing further was done."); return 1
    return 0


def main():
    p = argparse.ArgumentParser(prog="tt-scout", description="Tarot Talk Instagram scout, command-line step")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check").set_defaults(f=cmd_check)
    q = sub.add_parser("queue"); q.add_argument("handle"); q.set_defaults(f=cmd_queue)
    r = sub.add_parser("run"); r.add_argument("--model", default="small"); r.add_argument("--force", action="store_true", help="ignore the 24 h wait after a refusal"); r.set_defaults(f=cmd_run)
    sub.add_parser("push").set_defaults(f=cmd_push)
    a = p.parse_args(); locate(); sys.exit(a.f(a))


if __name__ == "__main__":
    main()
