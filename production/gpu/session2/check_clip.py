"""Automatic checks for one I2V clip (runs on the pod, no person in the loop).

check(frames, motion_mask, subject_mask, fps, window) -> dict with:
  drift_px      max outline movement of the subject outside the motion mask (edge-map shift)
  drift_ok      drift_px <= 1.0
  stable_ok     last third keeps sharpness and colour within 10% of the first third, no spike
  breaths       usable rest-to-rest breaths [(start_frame, end_frame, seconds)]
frames: uint8 array (T, H, W, 3). masks: bool (H, W).
window: (min_s, max_s) native breath length allowed by the +-15% retime rule.
"""
import json, sys
import numpy as np
import cv2


def _gray(f):
    return cv2.cvtColor(f, cv2.COLOR_RGB2GRAY)


def drift_px(frames, subject_mask, motion_mask):
    """Largest shift (px) of the subject's still part vs frame 0, via phase correlation on edges."""
    keep = subject_mask & ~cv2.dilate(motion_mask.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    if keep.sum() < 50:
        return 0.0
    ys, xs = np.nonzero(keep)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    win = cv2.createHanningWindow((x1 - x0, y1 - y0), cv2.CV_32F)
    def edges(f):
        e = cv2.Canny(_gray(f), 40, 120).astype(np.float32)
        e = cv2.GaussianBlur(e, (0, 0), 1.0)
        return (e * keep)[y0:y1, x0:x1]
    ref = edges(frames[0])
    worst = 0.0
    for f in frames[1:]:
        (dx, dy), _ = cv2.phaseCorrelate(ref, edges(f), win)
        worst = max(worst, float(np.hypot(dx, dy)))
    return worst


def stability(frames):
    T = len(frames)
    sharp = np.array([cv2.Laplacian(_gray(f), cv2.CV_64F).var() for f in frames])
    colour = np.array([f.reshape(-1, 3).mean(0) for f in frames])
    a, b = slice(0, T // 3), slice(2 * T // 3, T)
    s_ok = abs(sharp[b].mean() / max(sharp[a].mean(), 1e-6) - 1) <= 0.10
    c_ok = np.all(np.abs(colour[b].mean(0) / np.maximum(colour[a].mean(0), 1e-6) - 1) <= 0.10)
    diff = np.array([np.abs(frames[i].astype(np.int16) - frames[i - 1]).mean() for i in range(1, T)])
    # a flash or a snap back to the start image is a frame step far above the clip's normal motion
    base = max(np.percentile(diff, 90), 0.5)
    spike_ok = diff.max() <= 3 * base
    return bool(s_ok and c_ok and spike_ok), dict(sharp_ratio=float(sharp[b].mean() / max(sharp[a].mean(), 1e-6)),
                                                    max_step_over_p90=float(diff.max() / base))


def motion_signal(frames, motion_mask):
    """Mean optical-flow magnitude inside the motion mask, per frame step."""
    sig = []
    prev = _gray(frames[0])
    for f in frames[1:]:
        g = _gray(f)
        flow = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        mag = np.hypot(flow[..., 0], flow[..., 1])
        sig.append(mag[motion_mask].mean())
        prev = g
    return np.array(sig)


def breaths(sig, fps, window, rest_frac=0.20, rest_min=None, tail_s=0.25):
    """Rest points = runs of >= rest_min steps with motion < rest_frac * peak.
    A usable breath = from the end of one rest run's start... measured rest-centre to rest-centre,
    length inside window, with >= tail_s of rest available after its end inside the clip."""
    rest_min = rest_min or max(3, int(round(0.25 * fps)))   # end-of-exhale pause; the pause at the top of an inhale is shorter
    sm = np.convolve(sig, np.ones(3) / 3, mode="same")
    peak = np.percentile(sm, 95)
    low = sm < rest_frac * peak
    runs, i = [], 0
    while i < len(low):
        if low[i]:
            j = i
            while j < len(low) and low[j]:
                j += 1
            if j - i >= rest_min:
                runs.append((i, j))          # [i, j) in step indices
            i = j
        else:
            i += 1
    out = []
    tail = int(round(tail_s * fps))
    for (a0, a1), (b0, b1) in zip(runs, runs[1:]):
        s = (a0 + a1) // 2
        e = (b0 + b1) // 2
        L = (e - s) / fps
        if window[0] <= L <= window[1] and e + tail <= len(sig):
            out.append((int(s), int(e), round(L, 3)))
    return out


def check(frames, motion_mask, subject_mask, fps=16, window=(3.48, 4.71)):
    d = drift_px(frames, subject_mask, motion_mask)
    st_ok, st = stability(frames)
    br = breaths(motion_signal(frames, motion_mask), fps, window)
    return dict(drift_px=round(d, 3), drift_ok=d <= 1.0, stable_ok=st_ok, stability=st, breaths=br)


# ------------------------------------------------------------ synthetic test clips
def synth(T=129, fps=16, period=4.0, phase=0.0, drift=0.0, flash_at=None, size=(240, 320), seed=0, amp=6.0):
    """A textured 'animal': ellipse body whose flank rises and falls with a breath curve that
    rests (holds still) at the end of each exhale, like a real sleeping animal. Drawn at 4x and
    downscaled, so motion is sub-pixel smooth."""
    rng = np.random.default_rng(seed)
    H, W = size
    S = 4
    bg = (rng.random((H, W, 3)) * 40 + 30).astype(np.uint8)
    tex = cv2.resize((rng.random((H // 4, W // 4)) * 60).astype(np.uint8), (W * S, H * S), interpolation=cv2.INTER_CUBIC)
    frames = []
    cy, cx = H // 2, W // 2
    for t in range(T):
        ts = t / fps + phase
        u = (ts % period) / period
        b = np.sin(np.pi * min(u / 0.7, 1.0)) ** 2 if u < 0.7 else 0.0     # last 30% = rest
        ox = drift * t / T
        big = np.zeros((H * S, W * S), np.uint8)
        cv2.ellipse(big, (int((cx + ox) * S), cy * S), (80 * S, int((40 + amp * b) * S)), 0, 0, 360, 255, -1)
        M = np.float32([[1, 0, ox * S], [0, 1, 0]])
        tx = cv2.warpAffine(tex, M, (W * S, H * S))
        a_small = cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None] / 255
        t_small = cv2.resize(tx, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None]
        body = np.concatenate([150 + t_small, 90 + t_small / 2, 60 + t_small / 3], 2)
        f = bg * (1 - a_small) + body * a_small
        f = f.clip(0, 255).astype(np.uint8)
        cv2.circle(f, (int(round(cx - 95 + ox)), cy - 10), 14, (200, 120, 70), -1, lineType=cv2.LINE_AA)
        if flash_at is not None and t >= flash_at:
            f = np.clip(f.astype(np.int16) + 80, 0, 255).astype(np.uint8)
        frames.append(f)
    subject = np.zeros((H, W), np.uint8)
    cv2.ellipse(subject, (cx, cy), (100, 60), 0, 0, 360, 1, -1)
    subject[cy - 30:cy + 10, cx - 115:cx - 75] = 1
    motion = np.zeros((H, W), bool)
    motion[cy - 60:cy - 25, cx - 60:cx + 60] = True      # top of the flank
    motion[cy + 25:cy + 60, cx - 60:cx + 60] = True
    return np.array(frames), motion, subject.astype(bool)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        ok = True
        f, mm, sm = synth(period=4.0)
        r = check(f, mm, sm)
        print("clean 4.0 s:", json.dumps(r))
        ok &= r["drift_ok"] and r["stable_ok"] and len(r["breaths"]) >= 1 and all(abs(b[2] - 4.0) < 0.2 for b in r["breaths"])
        f, mm, sm = synth(period=4.0, drift=6.0)
        r = check(f, mm, sm); print("drifting 6 px:", r["drift_px"], r["drift_ok"])
        ok &= not r["drift_ok"]
        f, mm, sm = synth(period=4.0, flash_at=100)
        r = check(f, mm, sm); print("flash at 100:", r["stable_ok"])
        ok &= not r["stable_ok"]
        f, mm, sm = synth(period=3.0)
        r = check(f, mm, sm, window=(2.61, 3.53)); print("fox 3.0 s:", r["breaths"])
        ok &= len(r["breaths"]) >= 1
        f, mm, sm = synth(period=6.0)
        r = check(f, mm, sm); print("too slow 6.0 s:", r["breaths"])
        ok &= len(r["breaths"]) == 0
        print("SELFTEST", "PASS" if ok else "FAIL")
        sys.exit(0 if ok else 1)
