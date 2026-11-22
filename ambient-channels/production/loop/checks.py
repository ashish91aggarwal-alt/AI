"""checks.py - every visible-quality gate for a living-picture render, at PHONE size (640x360), in one pass.
Run it on a 20-s test block BEFORE any long render (each failure found late cost a 26-min render + review).

  python3 checks.py video.mp4 scene_checks.json [--picture plate.png]

scene_checks.json (boxes in 640x360 pixels, x0,y0,x1,y1):
{
 "sources":  {"fire": [80,135,170,250], ...},                 # where each light's own brightness is read
 "lit":      {"hearth": {"box": [...], "source": "fire", "swing": [6, 16]}, ...},   # % p95-p5 of the box mean
 "dark":     {"far ceiling": {"box": [...], "max_vs_picture": 85, "max_swing": 3}},  # far from every light
 "moving":   {"snow": {"box": [...], "min_motion": 0.8}, "cat": {...}},             # mean |frame diff| (levels)
 "steady":   {"cat+pillow": {"box": [...], "max_jump": 1.5}},                         # no flicker on subjects (%/frame)
 "still":    [[x0,y0,x1,y1], ...]                                                      # must not move at all
}
Prints one compact JSON line per check and a final PASS/FAIL. Exit code 1 on FAIL.
"""
import json, subprocess, sys
import numpy as np


def load(video, start=0, seconds=20):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(start), "-t", str(seconds), "-i", video,
                          "-vf", "scale=640:360:flags=area,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 360, 640).astype(np.float32)


def box(V, b):
    x0, y0, x1, y1 = b
    return V[:, y0:y1, x0:x1]


def main():
    video, spec = sys.argv[1], json.load(open(sys.argv[2]))
    pic = None
    if "--picture" in sys.argv:
        import cv2
        pic = cv2.resize(cv2.imread(sys.argv[sys.argv.index("--picture") + 1]), (640, 360), interpolation=cv2.INTER_AREA).mean(2)
    V = load(video)
    ok = True
    def out(name, passed, **kw):
        nonlocal ok
        ok &= bool(passed)
        print(json.dumps({"check": name, "pass": bool(passed), **{k: (round(v, 2) if isinstance(v, float) else v) for k, v in kw.items()}}))
    src = {k: box(V, b).mean((1, 2)) for k, b in spec.get("sources", {}).items()}
    for name, c in spec.get("lit", {}).items():           # lit areas follow THEIR source, with a visible swing
        b = box(V, c["box"]).mean((1, 2)); sw = float((np.percentile(b, 95) - np.percentile(b, 5)) / b.mean() * 100)
        corr = float(np.corrcoef(b, src[c["source"]])[0, 1]) if c.get("source") in src else 1.0
        lo, hi = c.get("swing", [3, 15])
        out("lit:" + name, lo <= sw <= hi and corr >= c.get("min_corr", 0.6), swing=sw, corr=corr, want=[lo, hi])
    for name, c in spec.get("apart", {}).items():         # sides of one big source must not flicker as one (review v7)
        a_ = box(V, c["boxes"][0]).mean((1, 2)); b_ = box(V, c["boxes"][1]).mean((1, 2))
        corr = float(np.corrcoef(a_, b_)[0, 1])
        out("apart:" + name, corr <= c.get("max_corr", 0.85), corr=corr)
    for name, c in spec.get("dark", {}).items():          # far areas: no brighter than the light allows, calm
        b = box(V, c["box"]).mean((1, 2)); sw = float((np.percentile(b, 95) - np.percentile(b, 5)) / b.mean() * 100)
        vs = float(b.mean() / box(pic[None], c["box"]).mean() * 100) if pic is not None else 0.0
        out("dark:" + name, vs <= c.get("max_vs_picture", 100) and sw <= c.get("max_swing", 3), vs_picture=vs, swing=sw)
    d = np.abs(np.diff(V, axis=0))
    for name, c in spec.get("moving", {}).items():        # visible at phone size
        m = float(box(d, c["box"]).mean())
        out("moving:" + name, m >= c["min_motion"], motion=m, want=c["min_motion"])
    for name, c in spec.get("steady", {}).items():        # no flicker jumps on subjects
        b = box(V, c["box"]).mean((1, 2))
        if "ref" in c:     # 19 Nov: with strong room light the cat may flicker WITH the room, never more than it
            r = box(V, c["ref"]).mean((1, 2)); b = b / r * r.mean()
        j = float((np.abs(np.diff(b)) / b.mean() * 100).max())
        out("steady:" + name, j <= c.get("max_jump", 1.5), max_jump_pct=j)
    for b in spec.get("still", []):       # motion only (optical flow): light may flicker there, nothing may move
        bb = box(V, b).astype(np.uint8); ms = []
        for i in range(12, len(bb), 12):
            fl = cv2.calcOpticalFlowFarneback(cv2.equalizeHist(bb[0]), cv2.equalizeHist(bb[i]), None, .5, 3, 9, 3, 5, 1.2, 0)
            ms.append(np.percentile(np.linalg.norm(fl, axis=2), 95))
        m = float(np.median(ms)) if ms else 0.0
        out("still:" + ",".join(map(str, b)), m <= 0.3, flow_p95_phone_px=m)
    import subprocess
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
                               capture_output=True, text=True).stdout.strip() or 0)
    full = load(video, 0, 2); tail = load(video, max(0.0, dur - 0.2), 1)   # the real end (was block_seconds: wrong on 10-min files)
    def cells(a, b):              # content step: per-cell change minus the uniform codec-grain change (keyframe at the loop)
        g = np.abs(a - b)[: a.shape[0] // 8 * 8, : a.shape[1] // 8 * 8]
        g = g.reshape(8, g.shape[0] // 8, 8, g.shape[1] // 8).mean((1, 3))
        return float((g - np.median(g)).max())
    if len(tail):                                          # loop point ~ a normal step
        s = cells(full[0], tail[-1]); n = float(np.percentile([cells(V[i + 1], V[i]) for i in range(0, len(V) - 1, 3)], 99))
        out("loop_point", s <= 1.5 * n, step=s, normal_p99=n, video_seconds=dur)
    print(json.dumps({"RESULT": "PASS" if ok else "FAIL"}))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
