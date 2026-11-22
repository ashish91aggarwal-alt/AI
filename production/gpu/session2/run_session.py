"""Session-2 driver on the pod: real generator + checks around runner.run().

Wall-clock charging: every item is charged the real time from the moment it starts until its
checks finish (generation, frame writing, clip checks). Setup is charged the real time since
boot. The worker process keeps models loaded; if an item passes its allowance the worker is
killed (charged in full) and a fresh one is started for the next item (its reload time is part
of that next item's wall time, so it is charged too).

Inputs prepared after G1 (committed to the repo before launch):
  inputs/<subject>.png              1:1 crop of the 4K composite, <= 832x480, multiple of 16
  inputs/<subject>_motion.png       white = the part allowed to move (flank/chest/ear, flames)
  inputs/<subject>_subject.png      white = the whole subject (for the drift check)
  prompts.json "motion": {subject: prompt}
"""
import argparse, json, os, select, subprocess, sys, time
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import runner, check_clip  # noqa: E402

MASTERS = os.environ.get("MASTERS", "/workspace/masters")
INPUTS = os.environ.get("INPUTS", os.path.join(HERE, "inputs"))
WINDOWS = {"fox": (2.61, 3.53), "sheep": (3.48, 4.71)}


class Worker:
    def __init__(self):
        self.p = None

    def start(self):
        self.p = subprocess.Popen([sys.executable, os.path.join(HERE, "worker.py")], stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE, text=True, bufsize=1)

    def call(self, job, timeout_s):
        if self.p is None or self.p.poll() is not None:
            self.start()
        self.p.stdin.write(json.dumps(job) + "\n")
        self.p.stdin.flush()
        r, _, _ = select.select([self.p.stdout], [], [], max(1.0, timeout_s))
        if not r:
            self.p.kill()
            self.p.wait()
            self.p = None
            return None
        line = self.p.stdout.readline()
        if not line:                      # worker died: report a failed item, restart next time
            self.p = None
            return {"ok": False, "error": "worker exited"}
        return json.loads(line)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--phase", required=True)
    ap.add_argument("--cap-min", type=float, required=True)
    ap.add_argument("--boot", type=float, required=True)
    ap.add_argument("--left-f1", type=float, default=0.0)
    ap.add_argument("--left-w3", type=float, default=0.0)
    ap.add_argument("--left-c4", type=float, default=0.0)
    ap.add_argument("--progress", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    P = json.load(open(os.path.join(HERE, "prompts.json")))
    images = {i["id"]: i for i in P["images"]}
    motion = dict(P.get("motion", {}))
    crops_json = os.path.join(INPUTS, "crops.json")
    if os.path.exists(crops_json):
        motion.update(json.load(open(crops_json))["motion"])
    regen = [r for r in os.environ.get("REGEN", "f1_plate,w3_plate,f1_fox,w3_sheep,pl_banner2,pp_banner2").split(",") if r]
    only = [x for x in os.environ.get("ONLY", "").split(",") if x]
    flf = set(json.load(open(crops_json)).get("flf", [])) if os.path.exists(crops_json) else set()
    negx = json.load(open(crops_json)).get("neg", {}) if os.path.exists(crops_json) else {}
    if a.phase in ("2c", "2d", "2e", "2f", "2g", "2h", "2i"):
        queue = {"2c": runner.queue_2c, "2d": runner.queue_2d, "2e": runner.queue_2e, "2f": runner.queue_2f, "2g": runner.queue_2g, "2h": runner.queue_2h, "2i": runner.queue_2i}[a.phase]()
        if only:                                   # small review batch first (owner: test 1-2 movements before spending)
            queue = [it for it in queue if it.kind == "setup"] + sorted([it for it in queue if it.id in only], key=lambda it: only.index(it.id))
        card = "C5" if a.phase in ("2e", "2f", "2g", "2h", "2i") else "C4"
        ledger = runner.Ledger(a.cap_min / 60 * runner.RATE, {card: a.left_c4}, spent={card: 0.0})
    else:
        queue = runner.queue_2a(tuple(regen)) if a.phase == "2a" else runner.queue_2b()
        ledger = runner.Ledger(a.cap_min / 60 * runner.RATE, {"F1": a.left_f1, "W3": a.left_w3})
    w = Worker()
    results = {}
    os.makedirs(a.out, exist_ok=True)

    def progress(msg):
        with open(a.progress, "a") as f:
            f.write(time.strftime("%H:%M:%S ", time.gmtime()) + msg + "\n")

    def load_mask(name):
        import cv2
        m = cv2.imread(os.path.join(INPUTS, name), cv2.IMREAD_GRAYSCALE)
        return m > 127

    def generate(it, allow_min):
        t0 = time.time()
        if it.kind == "setup":
            return (time.time() - a.boot) / 60, None, True
        if it.kind == "load":
            r = w.call({"kind": "load", "model": "image"}, allow_min * 60)
        elif it.kind == "image":
            base, seed = it.id.rsplit("_s", 1)
            j = images[base]
            r = w.call({"kind": "image", "id": it.id, "prompt": j["prompt"], "neg": j["neg"], "w": j["w"], "h": j["h"],
                        "seed": j["seed0"] + int(seed) - 1, "out": os.path.join(MASTERS, "img", it.id + ".png"),
                        "review": os.path.join(a.out, "img", it.id + ".jpg")}, allow_min * 60)
        else:
            subj = it.subject or it.id.rstrip("0123456789")
            r = w.call({"kind": "i2v", "id": it.id, "image": os.path.join(INPUTS, subj + ".png"),
                        "prompt": motion.get(it.id.rsplit("_", 1)[0], motion.get(subj)), "frames": it.frames,
                        "seed": abs(hash(it.id)) % 10000, "last_same": subj in flf,
                        "neg_extra": negx.get(subj, ""),
                        "out_dir": os.path.join(MASTERS, "clips", it.id)}, allow_min * 60)
            if r and r.get("ok"):
                import imageio.v3 as iio, glob
                fr = np.stack([iio.imread(f) for f in sorted(glob.glob(os.path.join(r["out_dir"], "*.png")))])
                win = WINDOWS.get(subj, (0, 99))
                try:
                    res = check_clip.check(fr, load_mask(subj + "_motion.png"), load_mask(subj + "_subject.png"), 16, win)
                except Exception as e:                     # a check error must never stop a paid session
                    res = {"drift_ok": None, "stable_ok": None, "breaths": [], "check_error": repr(e)[:200]}
                if it.kind != "breath":
                    res["breaths"] = res.get("breaths") or []
                results[it.id] = res
                os.makedirs(os.path.join(a.out, "clips"), exist_ok=True)   # small MP4 preview for git
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "16", "-i",
                                os.path.join(r["out_dir"], "%04d.png"), "-c:v", "libx264", "-crf", "20",
                                "-pix_fmt", "yuv420p", os.path.join(a.out, "clips", it.id + ".mp4")])
        minutes = (time.time() - t0) / 60
        ok = bool(r and r.get("ok"))
        progress(f"{it.id} {'ok' if ok else 'FAILED' if r else 'KILLED'} {minutes:.1f} min" + ("" if ok or not r else f" error={r.get('error', '')[:300]}"))
        return minutes, ("clip" if ok else None), r is not None

    def check(it, clip):
        return results.get(it.id, {"drift_ok": True, "stable_ok": True, "breaths": []})

    out = runner.run(queue, ledger, generate, check, log=progress)
    json.dump(out, open(os.path.join(a.out, "cost.json"), "w"), indent=1)
    json.dump(results, open(os.path.join(a.out, "checks.json"), "w"), indent=1)
    json.dump(out["remaining_must"], open(os.path.join(a.out, "remaining.json"), "w"), indent=1)
    progress(f"done ${out['usd']} {out['spent']}")


if __name__ == "__main__":
    main()
