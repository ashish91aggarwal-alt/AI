"""Seamless endless loop from one still picture (the CapCut "ambience" method, done in code).

Every moving thing is periodic in the loop length T: noise uses whole cycles per loop,
particles wrap a whole number of times, breathing fits a whole number of breaths.
So frame N == frame 0 and the clip can be repeated forever with no seam.

Layers (each optional, set in the scene JSON, coordinates as fractions of width/height):
  fire     - flames shimmer upward (warp on the bright flame pixels only), flicker, warm room glow, rising embers
  window   - falling snow (or rain) drawn only on the glass, not on the wooden bars
  steam    - soft wisps rising from a mug
  breathe  - a sleeping animal's body rises and falls (local warp of the torso, nothing else moves)
  glow     - extra small light sources (lamp, candles) with gentle shimmer

Usage: python3 loop.py scene.json out.mp4 [--w 1920] [--seconds 12] [--fps 30] [--check]
"""
import json, sys, argparse, subprocess, math
import numpy as np, cv2

TAU = 2 * math.pi


def poly_mask(h, w, poly, blur=0):
    m = np.zeros((h, w), np.float32)
    pts = np.array([[x * w, y * h] for x, y in poly], np.int32)
    cv2.fillPoly(m, [pts], 1.0)
    if blur:
        k = int(blur * w) | 1
        m = cv2.GaussianBlur(m, (k, k), 0)
    return m


def box(h, w, b, blur=0):
    x0, y0, x1, y1 = b
    return poly_mask(h, w, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], blur)


class PNoise:
    """Smooth 2-D noise field that is exactly periodic in time (whole cycles per loop)."""
    def __init__(self, rng, n, kmin, kmax, cycles, drift=(0, 0)):
        self.c = []
        for _ in range(n):
            k = rng.uniform(kmin, kmax); a = rng.uniform(0, TAU)
            self.c.append((k * math.cos(a), k * math.sin(a), int(rng.integers(cycles[0], cycles[1] + 1)), rng.uniform(0, TAU), rng.uniform(.5, 1)))
        self.drift = drift

    def __call__(self, X, Y, ph):
        out = np.zeros_like(X)
        for kx, ky, m, p, a in self.c:
            out += a * np.sin(kx * X + ky * Y + m * ph + p)
        return out / len(self.c)


def tnoise(rng, n=6, cmax=9):
    """Scalar flicker, periodic in the loop."""
    terms = [(int(rng.integers(1, cmax + 1)), rng.uniform(0, TAU), rng.uniform(.3, 1)) for _ in range(n)]
    s = sum(a for _, _, a in terms)
    return lambda ph: sum(a * math.sin(m * ph + p) for m, p, a in terms) / s


class Scene:
    def __init__(self, cfg, W, T, fps):
        img = cv2.imread(cfg["image"], cv2.IMREAD_COLOR)
        H = round(W * img.shape[0] / img.shape[1] / 2) * 2
        self.img = cv2.resize(img, (W, H), interpolation=cv2.INTER_LANCZOS4 if W > img.shape[1] else cv2.INTER_AREA).astype(np.float32) / 255
        self.H, self.W, self.T, self.fps, self.N = H, W, T, fps, int(round(T * fps))
        self.cfg = cfg
        rng = np.random.default_rng(cfg.get("seed", 7))
        self.rng = rng
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.X, self.Y = xx, yy
        s = W / 1920
        self.s = s
        f = cfg.get("fire")
        if f:
            area = box(H, W, f["box"])
            hsv = cv2.cvtColor((self.img * 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
            bright = np.clip((hsv[..., 2] - f.get("v_min", 170)) / 60, 0, 1) * (hsv[..., 0] < 35)  # warm and bright = flame
            flame = cv2.GaussianBlur(bright * area, (0, 0), 6 * s)
            flame = np.clip(flame * 2.0, 0, 1)
            self.flame = flame
            # stronger shimmer toward the flame tips: weight by height inside the box
            y0, y1 = f["box"][1] * H, f["box"][3] * H
            self.tip = np.clip((y1 - yy) / max(1, y1 - y0), 0, 1) ** 0.7
            self.fire_noise = PNoise(rng, 10, 0.02 / s, 0.06 / s, (3, 7))
            self.fire_noise2 = PNoise(rng, 10, 0.02 / s, 0.06 / s, (3, 7))
            cx, cy = f.get("center", [(f["box"][0] + f["box"][2]) / 2, (f["box"][1] + f["box"][3]) / 2])
            d = np.hypot((xx - cx * W) / W, (yy - cy * H) / W)
            self.fire_light = np.exp(-(d / f.get("light_radius", 0.35)) ** 2)
            self.flick = tnoise(rng, 8, 14)
            self.flick_slow = tnoise(rng, 4, 3)
            ne = f.get("embers", 14)
            self.embers = [dict(x=rng.uniform(f["box"][0] + .2 * (f["box"][2] - f["box"][0]), f["box"][2] - .2 * (f["box"][2] - f["box"][0])),
                                start=rng.uniform(0, 1), life=rng.uniform(.10, .22), cycles=int(rng.integers(3, 7)),
                                wob=rng.uniform(.004, .012), p=rng.uniform(0, TAU)) for _ in range(ne)]
        w = cfg.get("window")
        if w:
            area = np.zeros((H, W), np.float32)
            for b in w["boxes"]:
                area = np.maximum(area, box(H, W, b))
            b, g, r = self.img[..., 0], self.img[..., 1], self.img[..., 2]
            glass = np.clip(((b - r) - w.get("blue_min", 0.02)) / 0.08, 0, 1)  # cool pixels = glass; warm wood bars stay clear
            glass = cv2.GaussianBlur(glass * area, (0, 0), 1.5 * s)
            self.glass = np.clip(glass * 1.3, 0, 1)
            self.flakes = []
            for _ in range(w.get("count", 420)):
                z = rng.uniform(0, 1)  # depth: 0 far, 1 near
                self.flakes.append(dict(x=rng.uniform(0, 1), y=rng.uniform(0, 1), z=z,
                                        wraps=int(1 + round(z * w.get("max_wraps", 3))) if w.get("kind", "snow") == "snow" else int(6 + z * 6),
                                        sway=rng.uniform(.002, .01) * (0.5 + z), sc=int(rng.integers(1, 4)), p=rng.uniform(0, TAU)))
            self.win_box = [min(bb[0] for bb in w["boxes"]), min(bb[1] for bb in w["boxes"]), max(bb[2] for bb in w["boxes"]), max(bb[3] for bb in w["boxes"])]
        st = cfg.get("steam")
        if st:
            self.steam_noise = PNoise(rng, 8, 0.02 / s, 0.05 / s, (2, 4))
        brs = cfg.get("breathe") or []
        if isinstance(brs, dict):
            brs = [brs]
        self.breaths = []
        for br in brs:
            cx, cy = br["center"]; rx, ry = br["radius"]
            d2 = ((xx - cx * W) / (rx * W)) ** 2 + ((yy - cy * H) / (ry * H)) ** 2
            bw = (np.exp(-d2 * 1.6) * (d2 < 1.8)).astype(np.float32)
            bw = cv2.GaussianBlur(bw, (0, 0), 4 * s)
            self.breaths.append((br, bw, (cx * W, cy * H)))
        self.glows = cfg.get("glow", [])
        for g in self.glows:
            g["_f"] = tnoise(rng, 5, 10)
            d = np.hypot(xx - g["at"][0] * W, yy - g["at"][1] * H) / W
            g["_m"] = np.exp(-(d / g.get("radius", .05)) ** 2).astype(np.float32)

    def frame(self, i):
        H, W, s = self.H, self.W, self.s
        ph = TAU * i / self.N
        img = self.img
        mx = self.X.copy(); my = self.Y.copy()
        cfg = self.cfg
        for br, bw, (cx, cy) in self.breaths:
            n_b = br.get("breaths", 3)
            # slow rise and fall, then a short rest: a natural sleeping breath
            u = (i / self.N * n_b + br.get("offset", 0)) % 1
            amp = 0.5 - 0.5 * math.cos(TAU * min(u / 0.85, 1.0))
            a = br.get("amp", 0.004) * W * amp
            mx -= (self.X - cx) * (a / W) * 0.6 * bw
            my -= (self.Y - cy) * (a / W) * 1.0 * bw - a * 0.35 * bw
        if cfg.get("fire"):
            f = cfg["fire"]
            amp = f.get("warp", 3.0) * s
            nx = self.fire_noise(self.X, self.Y + 0, ph)
            ny = self.fire_noise2(self.X, self.Y, ph)
            wgt = self.flame * (0.35 + 0.65 * self.tip)
            mx += amp * 0.6 * nx * wgt
            my += amp * (0.8 + ny) * wgt  # sample from below: flames lick upward
        out = cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        if cfg.get("fire"):
            f = cfg["fire"]
            fl = 0.65 * self.flick(ph) + 0.35 * self.flick_slow(ph)
            k = 1 + f.get("flicker", 0.10) * fl
            warm = np.array([0.55, 0.8, 1.0], np.float32)  # BGR tint of firelight
            lm = (self.fire_light * f.get("room_glow", 0.10) * fl)[..., None]
            out = out * (1 + lm * warm)
            out = out * (1 + (k - 1) * self.flame[..., None] * 1.5)
            self._embers(out, ph, f)
        if cfg.get("window"):
            self._snow(out, i)
        if cfg.get("steam"):
            self._steam(out, ph, cfg["steam"])
        for g in self.glows:
            out = out * (1 + (g.get("amount", .05) * (0.5 + 0.5 * g["_f"](ph))) * g["_m"][..., None] * np.array([0.6, 0.85, 1.0], np.float32))
        return np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)

    def _embers(self, out, ph, f):
        H, W, s = self.H, self.W, self.s
        x0, y0, x1, y1 = f["box"]
        layer = np.zeros((H, W), np.float32)
        t = ph / TAU
        for e in self.embers:
            for c in range(e["cycles"]):
                u = (t * e["cycles"] - c / e["cycles"] * 0 - e["start"] * e["cycles"]) % 1  # whole cycles per loop
                if u > e["life"] * e["cycles"]:
                    continue
                v = u / (e["life"] * e["cycles"])
                x = (e["x"] + e["wob"] * math.sin(TAU * v * 2 + e["p"])) * W
                y = (y1 - 0.25 * (y1 - y0) - v * (y1 - y0) * 1.1) * H
                a = math.sin(math.pi * v) * 0.9
                cv2.circle(layer, (int(x), int(y)), max(1, int(1.6 * s)), a, -1, cv2.LINE_AA)
                break
        layer = cv2.GaussianBlur(layer, (0, 0), 1.2 * s)
        col = np.array([0.25, 0.65, 1.0], np.float32)
        out += layer[..., None] * col

    def _snow(self, out, i):
        H, W, s = self.H, self.W, self.s
        w = self.cfg["window"]
        bx0, by0, bx1, by1 = self.win_box
        t = i / self.N
        layer = np.zeros((H, W), np.float32)
        rain = w.get("kind", "snow") == "rain"
        for fl in self.flakes:
            y = (fl["y"] + t * fl["wraps"]) % 1
            x = (fl["x"] + fl["sway"] * math.sin(TAU * fl["sc"] * t + fl["p"]) / max(1e-3, bx1 - bx0)) % 1
            px = (bx0 + x * (bx1 - bx0)) * W
            py = (by0 + y * (by1 - by0)) * H
            z = fl["z"]
            if rain:
                L = (6 + 14 * z) * s
                cv2.line(layer, (int(px), int(py)), (int(px - 0.15 * L), int(py - L)), 0.25 + 0.35 * z, max(1, int(s)), cv2.LINE_AA)
            else:
                r = (0.8 + 2.4 * z) * s
                cv2.circle(layer, (int(px), int(py)), max(1, int(round(r))), 0.35 + 0.6 * z, -1, cv2.LINE_AA)
        layer = cv2.GaussianBlur(layer, (0, 0), 0.8 * s)
        a = (layer * self.glass * w.get("opacity", 0.85))[..., None]
        snow = np.array(w.get("color_bgr", [1.0, 0.97, 0.92]), np.float32)
        out[:] = out * (1 - a) + snow * a

    def _steam(self, out, ph, st):
        H, W, s = self.H, self.W, self.s
        cx, cy = st["at"][0] * W, st["at"][1] * H
        hgt = st.get("height", 0.08) * H
        wid = st.get("width", 0.02) * W
        n = self.steam_noise(self.X, self.Y, ph)
        rel = (cy - self.Y) / hgt  # 0 at the mug, 1 at the top of the wisp
        sway = wid * 0.8 * n * rel
        dx = (self.X - cx - sway) / (wid * (0.5 + rel))
        m = np.exp(-dx ** 2) * np.clip(rel, 0, 1) ** 0.5 * np.clip(1 - rel, 0, 1) ** 1.5 * (rel > 0)
        bands = 0.5 + 0.5 * np.sin(rel * 9 - ph * st.get("cycles", 4) + n * 2.5)
        a = (m * bands * st.get("opacity", 0.22)).astype(np.float32)[..., None]
        out[:] = out * (1 - a) + np.array([0.92, 0.93, 0.95], np.float32) * a


def render(cfg, out, W=1920, seconds=12, fps=30, crf=18):
    sc = Scene(cfg, W, seconds, fps)
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{sc.W}x{sc.H}", "-r", str(fps), "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    for i in range(sc.N):
        p.stdin.write(sc.frame(i).tobytes())
    p.stdin.close(); p.wait()
    return sc


def seam_check(cfg, W=960, seconds=12, fps=30):
    """Frame N (one past the end) must equal frame 0, and the jump last->first must look like any other step."""
    sc = Scene(cfg, W, seconds, fps)
    f0, f1, fl, fN = sc.frame(0), sc.frame(1), sc.frame(sc.N - 1), sc.frame(sc.N)
    d = lambda a, b: float(np.abs(a.astype(np.int16) - b.astype(np.int16)).mean())
    return {"N_vs_0": d(fN, f0), "seam_step": d(fl, f0), "normal_step": d(f0, f1)}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("scene"); ap.add_argument("out", nargs="?")
    ap.add_argument("--w", type=int, default=1920); ap.add_argument("--seconds", type=float, default=12); ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--check", action="store_true"); ap.add_argument("--still", type=int, default=None)
    a = ap.parse_args()
    cfg = json.load(open(a.scene))
    if a.check:
        print(json.dumps(seam_check(cfg, seconds=a.seconds, fps=a.fps)))
    elif a.still is not None:
        sc = Scene(cfg, a.w, a.seconds, a.fps); cv2.imwrite(a.out, sc.frame(a.still))
    else:
        render(cfg, a.out, a.w, a.seconds, a.fps)
