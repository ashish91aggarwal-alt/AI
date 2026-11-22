"""Draft-2 compositor: planned layers (see LAYERS.md), real flame/steam footage, exact masks.

All scene coordinates are pixels in a 1920x1080 frame of the plate.
Time: an opening (lights come on, fire grows), then a steady state that is exactly
periodic with LOOP seconds, so the steady part can be repeated for hours.

Usage:
  python3 compose2.py scene.json --masks out.jpg          # draw every mask/placement for checking
  python3 compose2.py scene.json --frame t out.png        # one frame at time t (s)
  python3 compose2.py scene.json --render out.mp4 [--from 0 --to 100]
  python3 compose2.py scene.json --checks                 # measured checks (snow outside panes, lights alive, seam)
"""
import json, sys, math, argparse, subprocess, os
import numpy as np, cv2

TAU = 2 * math.pi
HERE = os.path.dirname(os.path.abspath(__file__))
OVERLAYS = os.environ.get("OVERLAYS", "/home/claude/overlays")


def smoothstep(a, b, x):
    if b <= a: return 1.0 if x >= b else 0.0
    u = min(1.0, max(0.0, (x - a) / (b - a)))
    return u * u * (3 - 2 * u)


class PNoise1:
    """Scalar noise in [-1, 1], exactly periodic over `loop` seconds (whole cycles only)."""
    def __init__(self, rng, loop, cmin, cmax, n=6):
        self.loop = loop
        self.t = [(int(rng.integers(cmin, cmax + 1)), rng.uniform(0, TAU), rng.uniform(.4, 1)) for _ in range(n)]
        self.s = sum(a for _, _, a in self.t)

    def __call__(self, t):
        ph = TAU * t / self.loop
        return sum(a * math.sin(c * ph + p) for c, p, a in self.t) / self.s


def screen(base, layer):
    return 1 - (1 - base) * (1 - layer)


class Clip:
    """Overlay footage on black: cropped, scaled, closed into a seamless loop of `loop` seconds."""
    def __init__(self, file, crop, size, loop, fps, flip=False, feather=None):
        x0, y0, x1, y1 = crop
        w, h = size
        vf = f"crop={x1 - x0}:{y1 - y0}:{x0}:{y0},scale={w}:{h}:flags=lanczos,fps={fps}"
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(OVERLAYS, file), "-vf", vf, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                             capture_output=True, check=True).stdout
        fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32) / 255
        nL = int(round(loop * fps)); nD = len(fr); c = nD - nL
        assert c >= int(0.5 * fps), f"{file}: clip {nD} frames too short for a {nL}-frame loop with crossfade"
        out = fr[:nL].copy()
        for k in range(c):
            a = (k + 0.5) / c
            out[k] = fr[k + nL] * (1 - a) + fr[k] * a
        if flip:
            out = out[:, :, ::-1]
        if feather:
            top, bot, side = feather
            v = np.linspace(0, 1, h)[:, None]; u = np.abs(np.linspace(-1, 1, w))[None, :]
            m = np.clip(v / max(top, 1e-3), 0, 1) ** 1.5 * np.clip((1 - v) / max(bot, 1e-3), 0, 1) * np.clip((1 - u) / max(side, 1e-3), 0, 1)
            out = out * m.astype(np.float32)[None, ..., None]
        self.f = out.astype(np.float16); self.n = nL; self.fps = fps
        self.mean = float(self.f.astype(np.float32).mean())

    def at(self, t):
        return self.f[int(round(t * self.fps)) % self.n].astype(np.float32)


def poly(h, w, pts, s, feather=0):
    m = np.zeros((h, w), np.float32)
    cv2.fillPoly(m, [np.array([[x * s, y * s] for x, y in pts], np.int32)], 1.0)
    if feather:
        m = cv2.GaussianBlur(m, (0, 0), feather * s)
    return m


class Scene:
    def __init__(self, cfg, W=1920):
        self.cfg = cfg
        self.fps = cfg.get("fps", 24)
        self.L = cfg.get("loop_seconds", 60)
        self.T0 = cfg.get("opening_seconds", 40)
        img = cv2.imread(os.path.join(HERE, cfg["image"]))
        H = round(W * img.shape[0] / img.shape[1] / 2) * 2
        self.W, self.H, self.s = W, H, W / 1920
        s = self.s
        plate = cv2.resize(img, (W, H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32) / 255
        self.orig = plate.copy()
        rng = np.random.default_rng(cfg.get("seed", 5))
        self.rng = rng
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.X, self.Y = xx, yy
        hsv = cv2.cvtColor((plate * 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
        V, S, Hh = hsv[..., 2], hsv[..., 1], hsv[..., 0]
        kill = np.zeros((H, W), np.uint8)

        # ---------- fire ----------
        f = cfg["fire"]
        self.fire_open = poly(H, W, f["opening"], s, feather=6)
        kb = [int(v * s) for v in f["kill_box"]]
        # drawn flames: very bright yellow / white only (the orange-lit logs stay)
        sub = ((V > f.get("kill_v", 236)) & (Hh >= 15) & (Hh <= 40)) | ((V > 247) & (S < 140))
        dim = np.zeros((H, W), np.float32)
        dim[kb[1]:kb[3], kb[0]:kb[2]] = sub[kb[1]:kb[3], kb[0]:kb[2]]
        dim = cv2.GaussianBlur(cv2.dilate(dim, np.ones((3, 3), np.uint8)), (0, 0), 2.0 * s) * self.fire_open
        self.fire_dim = np.clip(dim * 1.5, 0, 1)
        gb = [int(v * s) for v in f["grate_box"]]
        grate = np.zeros((H, W), np.float32)
        grate[gb[1]:gb[3], gb[0]:gb[2]] = (V[gb[1]:gb[3], gb[0]:gb[2]] < f.get("grate_v", 80)).astype(np.float32)
        self.grate_front = cv2.GaussianBlur(grate, (0, 0), 1.0 * s)
        self.fire_clips = []
        for c in f["clips"]:
            w = int(c["width"] * s); h = int(round(w * (c["crop"][3] - c["crop"][1]) / (c["crop"][2] - c["crop"][0])))
            clip = Clip(c["file"], c["crop"], (w, h), c["loop"], self.fps, flip=c.get("flip", False), feather=c.get("feather", [0.35, 0.05, 0.12]))
            x0 = int(c["center_x"] * s - w / 2); y0 = int(c["base_y"] * s - h)
            self.fire_clips.append(dict(clip=clip, x0=x0, y0=y0, w=w, h=h, gain=c.get("gain", 1.0), sat=c.get("sat", 1.15),
                                        group=c.get("group", "B"), offset=c.get("offset", 0.0)))
        fc = f["light"]["center"]
        d = np.hypot(xx - fc[0] * s, yy - fc[1] * s) / (f["light"]["radius"] * s)
        self.fire_light = (np.exp(-d ** 2) * f["light"]["amount"]).astype(np.float32)[..., None] * np.array([0.55, 0.8, 1.0], np.float32)
        self.fire_back = f.get("back_wall", 0.55)

        # ---------- candles / small flames ----------
        self.flames = []
        for i, c in enumerate(cfg.get("candles", [])):
            cx, cy = c["at"]; r = c.get("search", 22)
            x0, x1 = max(0, int((cx - r) * s)), int((cx + r) * s); y0, y1 = max(0, int((cy - 2 * r) * s)), int((cy + r) * s)
            box = ((V[y0:y1, x0:x1] > c.get("v", 230)) & (Hh[y0:y1, x0:x1] >= 12) & (Hh[y0:y1, x0:x1] <= 38)) | ((V[y0:y1, x0:x1] > 248) & (S[y0:y1, x0:x1] < 90))
            nb, lb, stb, cb = cv2.connectedComponentsWithStats(box.astype(np.uint8), 8)
            if nb < 2:
                print("no flame found near", c["at"], file=sys.stderr); continue
            dists = [np.hypot(cb[k][0] + x0 - cx * s, cb[k][1] + y0 - cy * s) - 0.3 * stb[k, 4] for k in range(1, nb)]
            k = 1 + int(np.argmin(dists))
            box = lb == k
            ys, xs = np.nonzero(box)
            fx, ftop, fbot = xs.mean() + x0, ys.min() + y0, ys.max() + y0
            fh = max(6 * s, (fbot - ftop) * 1.1) * c.get("scale", 1.0); fw = min(max(3 * s, (xs.max() - xs.min() + 1) * 1.0), fh * c.get("aspect", 0.36))
            m = np.zeros((H, W), np.uint8); m[y0:y1, x0:x1] = box
            kill |= cv2.dilate(m, np.ones((3, 3), np.uint8))
            self.flames.append(dict(x=fx, base=fbot + 1, h=fh, w=fw, lit=c.get("lit", 0.0), halo=c.get("halo", 3.0), glow=c.get("glow", 0.18),
                                    n1=PNoise1(rng, self.L, 3, 14), n2=PNoise1(rng, self.L, 60, 180), n3=PNoise1(rng, self.L, 4, 20),
                                    glass=c.get("glass")))
        # glows without a visible flame (jar candles, lit lantern glass)
        self.glows = []
        for g in cfg.get("glows", []):
            cx, cy = g["at"]; r = g["radius"]
            d = np.hypot(xx - cx * s, yy - cy * s) / (r * s)
            m = np.exp(-d ** 2).astype(np.float32)
            self.glows.append(dict(m=m[..., None] * np.array([0.6, 0.85, 1.0], np.float32), amount=g.get("amount", 0.12), lit=g.get("lit", 0.0),
                                   n1=PNoise1(rng, self.L, 4, 16), n2=PNoise1(rng, self.L, 50, 140), kind=g.get("kind", "flame")))

        # ---------- drawn steam removed (we add live steam) ----------
        st = cfg.get("steam")
        if st and st.get("kill_box"):
            b = [int(v * s) for v in st["kill_box"]]
            reg = plate[b[1]:b[3], b[0]:b[2]]
            bg = cv2.medianBlur((reg * 255).astype(np.uint8), int(25 * s) | 1).astype(np.float32) / 255
            light = (reg.mean(2) - bg.mean(2) > st.get("kill_delta", 0.08)) & (S[b[1]:b[3], b[0]:b[2]] < 110)
            m = np.zeros((H, W), np.float32); m[b[1]:b[3], b[0]:b[2]] = light
            m = cv2.GaussianBlur(cv2.dilate(m, np.ones((int(7 * s) | 1,) * 2, np.uint8)), (0, 0), 3 * s)[..., None]
            bgf = np.zeros_like(plate); bgf[b[1]:b[3], b[0]:b[2]] = cv2.medianBlur((reg * 255).astype(np.uint8), int(41 * s) | 1).astype(np.float32) / 255
            self.steam_soft = (np.clip(m * 1.5, 0, 1), bgf)
            self.steam_kill = None

        # ---------- inpaint everything that was drawn as a light we now animate ----------
        self.kill = kill
        p8 = cv2.inpaint((plate * 255).astype(np.uint8), kill, int(6 * s), cv2.INPAINT_TELEA)
        if getattr(self, "steam_soft", None) is not None:
            m, bgf = self.steam_soft
            p8 = ((p8.astype(np.float32) / 255 * (1 - m) + bgf * m) * 255).astype(np.uint8)
        plate = p8.astype(np.float32) / 255
        # the empty firebox: darker, lit back by the live fire
        # behind the old drawn flames: rebuild brick from the surroundings, then keep it sooty-dark
        fk = (self.fire_dim > 0.25).astype(np.uint8)
        pf = cv2.inpaint((plate * 255).astype(np.uint8), fk, int(9 * s), cv2.INPAINT_TELEA).astype(np.float32) / 255
        plate = plate * (1 - self.fire_dim[..., None]) + pf * 0.75 * self.fire_dim[..., None]
        self.plate = plate * (1 - self.fire_open[..., None] * (1 - self.fire_back))

        # ---------- window panes ----------
        w = cfg["window"]
        rx0, ry0, rx1, ry1 = [int(v * s) for v in w["region"]]
        b, g_, r_ = self.orig[..., 0] * 255, self.orig[..., 1] * 255, self.orig[..., 2] * 255
        wood = ((r_ - b) > w.get("wood_rb", 25)) & (V < w.get("wood_v", 195))
        wood |= (S > 120) & (r_ > b + 40) & (V > 195) & (Hh > 12) & (Hh < 30) & (w.get("brass", True))  # brass lamp in front
        cand = np.zeros((H, W), np.uint8)
        cand[ry0:ry1, rx0:rx1] = (~wood[ry0:ry1, rx0:rx1]).astype(np.uint8)
        cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        n, lab, stats, _ = cv2.connectedComponentsWithStats(cand, 4)
        panes = np.zeros((H, W), np.uint8)
        self.pane_boxes = []
        for i in range(1, n):
            x, y, ww, hh, area = stats[i]
            if area < w.get("min_area", 2500) * s * s: continue
            if y + hh >= ry1 - 2 or x <= rx0 + 1 and w.get("drop_left_touch", False): continue  # touches the room below -> not glass
            comp = (lab == i).astype(np.uint8)
            cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
            cv2.drawContours(panes, cnts, -1, 1, -1)  # fills lit cottage windows inside a pane
            self.pane_boxes.append((x, y, ww, hh))
        panes = cv2.erode(panes, np.ones((3, 3), np.uint8))
        self.panes = cv2.GaussianBlur(panes.astype(np.float32), (0, 0), 0.7 * s)
        self.win_region = (rx0, ry0, rx1, ry1)
        lp = w.get("loop", 20)
        self.flakes = []
        for layer, count, rmin, rmax, amin, amax, wmin, wmax in (("far", w.get("far", 520), 0.7, 1.4, .45, .7, 1, 2), ("near", w.get("near", 150), 1.6, 3.0, .75, .95, 2, 4)):
            for _ in range(count):
                self.flakes.append(dict(x=rng.uniform(rx0, rx1), y=rng.uniform(ry0 - 20, ry1), r=rng.uniform(rmin, rmax) * s, a=rng.uniform(amin, amax),
                                        wraps=int(rng.integers(wmin, wmax + 1)) * (self.L // lp), sway=rng.uniform(2, 9) * s, sc=int(rng.integers(1, 4)) * (self.L // lp), p=rng.uniform(0, TAU)))
        # distant warm lights inside the panes (cottage windows, street lamps)
        warm = (self.panes > 0.5) & (V > 200) & (Hh < 35) & (S > 60)
        n2, lab2, st2, cen2 = cv2.connectedComponentsWithStats(warm.astype(np.uint8), 8)
        self.far_lights = []
        for i in range(1, n2):
            if st2[i, 4] < 6 * s * s: continue
            m = cv2.GaussianBlur((lab2 == i).astype(np.float32), (0, 0), 3 * s)
            x, y, ww, hh = st2[i, :4]
            self.far_lights.append(dict(box=(max(0, x - 12), max(0, y - 12), x + ww + 12, y + hh + 12), m=m, n=PNoise1(rng, self.L, 4, 15)))

        # ---------- tree bulbs ----------
        tb = cfg.get("bulbs")
        self.bulbs = []
        if tb:
            m = poly(H, W, tb["region"], s)
            v = cv2.GaussianBlur(V, (0, 0), 1.2 * s) * m
            peaks = (v == cv2.dilate(v, np.ones((int(9 * s) | 1,) * 2, np.uint8))) & (v > tb.get("v", 225))
            ys, xs = np.nonzero(peaks)
            order = np.argsort(-v[ys, xs])[: tb.get("max", 80)]
            for k in order:
                self.bulbs.append(dict(x=xs[k], y=ys[k], c=int(rng.integers(5, 21)), p=rng.uniform(0, TAU), depth=rng.uniform(.12, .28)))
            self.bulb_r = tb.get("radius", 5) * s

        # ---------- electric lamps: slow breathing halo ----------
        self.lamps = []
        for lp_ in cfg.get("lamps", []):
            d = np.hypot(xx - lp_["at"][0] * s, yy - lp_["at"][1] * s) / (lp_["radius"] * s)
            self.lamps.append(dict(m=np.exp(-d ** 2).astype(np.float32)[..., None] * np.array([0.65, 0.88, 1.0], np.float32), amount=lp_.get("amount", 0.05), n=PNoise1(rng, self.L, 4, 8, n=3)))

        # ---------- steam footage ----------
        self.steam = None
        if st:
            w_, h_ = int(st["width"] * s), int(st["height"] * s)
            clip = Clip(st["file"], st["crop"], (w_, h_), st["loop"], self.fps)
            vv = np.linspace(1, 0, h_)[:, None]  # 1 at the rim, 0 at the top
            fade = (np.clip(vv / 0.12, 0, 1) * np.clip((1 - vv) / 0.25, 0, 1)) ** 1.0  # starts at the rim, fades to nothing at the top... see below
            fade = np.clip((1 - vv) / 0.10, 0, 1) * np.clip(vv / 0.45, 0, 1)  # appear just above the rim, thin out higher up
            uu = np.linspace(-1, 1, w_)[None, :]
            side = np.exp(-(uu / 0.8) ** 4)
            self.steam = dict(clip=clip, x0=int(st["rim"][0] * s - w_ / 2), y0=int(st["rim"][1] * s - h_), w=w_, h=h_,
                              m=(fade * side).astype(np.float32)[..., None], op=st.get("opacity", 0.6), gain=st.get("gain", 2.5))

        # ---------- breathing ----------
        self.breaths = []
        for br in cfg.get("breathe", []):
            cx, cy = br["center"]; rx, ry = br["radius"]
            d2 = ((xx - cx * s) / (rx * s)) ** 2 + ((yy - cy * s) / (ry * s)) ** 2
            bw = cv2.GaussianBlur((np.exp(-d2 * 1.6) * (d2 < 1.8)).astype(np.float32), (0, 0), 4 * s)
            self.breaths.append((br, bw, (cx * s, cy * s)))
        if self.breaths:
            allm = sum(b[1] for b in self.breaths) > 1e-3
            ys, xs = np.nonzero(allm)
            self.bbox = (max(0, xs.min() - 8), max(0, ys.min() - 8), min(W, xs.max() + 8), min(H, ys.max() + 8))
        self.timeline = cfg.get("timeline", {})

    # ---------------------------------------------------------------------------------
    def fire_mix(self, t):
        cross = self.timeline.get("fire_cross", [0, 0])
        b = smoothstep(cross[0], cross[1], t)
        return [(1 - b) if fc["group"] == "A" else (b if fc["group"] == "B" else 1.0) for fc in self.fire_clips]

    def _fire_mean(self, t):
        tot = 0.0
        for wgt, fc in zip(self.fire_mix(t), self.fire_clips):
            if wgt <= 0.001: continue
            fr = fc["clip"].at(t + fc["offset"]) * fc["gain"] * wgt
            x0, y0, w, h = fc["x0"], fc["y0"], fc["w"], fc["h"]
            ya, yb = max(0, y0), min(self.H, y0 + h); xa, xb = max(0, x0), min(self.W, x0 + w)
            m = (self.fire_open[ya:yb, xa:xb] * (1 - 0.92 * self.grate_front[ya:yb, xa:xb]))[..., None]
            tot += float((fr[ya - y0:yb - y0, xa - x0:xb - x0] * m).mean())
        return tot

    def lit(self, when, t):
        """0 before `when`, a quick ignite flare, 1 after."""
        if when <= 0: return 1.0
        u = (t - when) / 0.7
        if u <= 0: return 0.0
        if u >= 1: return 1.0
        return min(1.15, u * 1.6) if u < 0.6 else 1.0 + 0.15 * (1 - (u - 0.6) / 0.4)

    def frame(self, t):
        s, W, H = self.s, self.W, self.H
        out = self.plate.copy()
        # breathing (warp only around the animals)
        if self.breaths:
            x0, y0, x1, y1 = self.bbox
            mx = self.X[y0:y1, x0:x1].copy(); my = self.Y[y0:y1, x0:x1].copy()
            for br, bw, (cx, cy) in self.breaths:
                u = (t / self.L * br["breaths"] + br.get("offset", 0)) % 1
                amp = 0.5 - 0.5 * math.cos(TAU * min(u / 0.85, 1.0))
                a = br.get("amp", 0.004) * W * amp
                w_ = bw[y0:y1, x0:x1]
                mx -= (mx - cx) * (a / W) * 0.6 * w_
                my -= (my - cy) * (a / W) * 1.0 * w_ - a * 0.35 * w_
            out[y0:y1, x0:x1] = cv2.remap(out, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        # fire footage (behind the grate), firelight from its own brightness
        layer_mean = 0.0; ref = 0.0
        for wgt, fc in zip(self.fire_mix(t), self.fire_clips):
            if wgt <= 0.001: continue
            fr = fc["clip"].at(t + fc["offset"]) * fc["gain"] * wgt
            g = fr.mean(2, keepdims=True); fr = np.clip(g + (fr - g) * fc["sat"], 0, 1)
            x0, y0, w, h = fc["x0"], fc["y0"], fc["w"], fc["h"]
            ya, yb = max(0, y0), min(H, y0 + h); xa, xb = max(0, x0), min(W, x0 + w)
            fr = fr[ya - y0:yb - y0, xa - x0:xb - x0]
            m = (self.fire_open[ya:yb, xa:xb] * (1 - 0.92 * self.grate_front[ya:yb, xa:xb]))[..., None]
            out[ya:yb, xa:xb] = screen(out[ya:yb, xa:xb], fr * m)
            layer_mean += float((fr * m).mean()) ; ref += fc["clip"].mean * wgt * fc["gain"]
        if not hasattr(self, "_fire_ref"):
            self._fire_ref = 1.0
            self._fire_ref = max(1e-6, float(np.mean([self._fire_mean(self.T0 + k * 1.37) for k in range(12)])))
        inten = layer_mean / self._fire_ref  # ~1 on average at full fire, lower while the fire is small
        out *= 1 + self.fire_light * (inten - 0.8)
        out *= 1 + self.fire_open[..., None] * (inten - 0.8) * 0.6 * np.array([0.5, 0.8, 1.0], np.float32)
        # snow behind the glass only
        rx0, ry0, rx1, ry1 = self.win_region
        snow = np.zeros((ry1 - ry0 + 40, rx1 - rx0), np.float32)
        u = t / self.L
        span = ry1 - ry0 + 40
        for fk in self.flakes:
            y = (fk["y"] - ry0 + 20 + u * fk["wraps"] * span) % span
            x = fk["x"] - rx0 + fk["sway"] * math.sin(TAU * fk["sc"] * u + fk["p"])
            cv2.circle(snow, (int(x * 4), int(y * 4)), max(1, int(fk["r"] * 4)), fk["a"], -1, cv2.LINE_AA, 2)
        snow = cv2.GaussianBlur(snow[20:20 + ry1 - ry0], (0, 0), 0.6 * s)
        a = (snow * self.panes[ry0:ry1, rx0:rx1])[..., None]
        reg = out[ry0:ry1, rx0:rx1]
        out[ry0:ry1, rx0:rx1] = reg * (1 - a) + np.array([0.98, 0.96, 0.93], np.float32) * a
        for fl_ in self.far_lights:
            x0, y0, x1, y1 = fl_["box"]
            k = 0.10 * fl_["n"](t)
            out[y0:y1, x0:x1] *= 1 + k * fl_["m"][y0:y1, x0:x1, None]
        # tree bulbs twinkle
        for bl in self.bulbs:
            f = 0.5 + 0.5 * math.sin(TAU * bl["c"] * t / self.L + bl["p"])
            k = bl["depth"] * (f - 0.5) * 2  # -depth .. +depth
            r = int(self.bulb_r * 3)
            x0, y0 = max(0, bl["x"] - r), max(0, bl["y"] - r); x1, y1 = min(W, bl["x"] + r + 1), min(H, bl["y"] + r + 1)
            yy, xx = np.mgrid[y0:y1, x0:x1]
            g = np.exp(-((xx - bl["x"]) ** 2 + (yy - bl["y"]) ** 2) / (2 * self.bulb_r ** 2)).astype(np.float32)[..., None]
            out[y0:y1, x0:x1] *= 1 + k * g
        # electric lamps: slow, calm breathing
        for lm in self.lamps:
            out *= 1 + lm["amount"] * lm["n"](t) * lm["m"]
        # glows (jar candle, lantern glass)
        for gl in self.glows:
            on = self.lit(gl["lit"], t)
            k = gl["amount"] * (0.6 * gl["n1"](t) + 0.4 * gl["n2"](t)) + (on - 1) * 0.6
            out *= 1 + k * gl["m"]
        # candle flames (procedural, each on its own clock)
        for fl_ in self.flames:
            on = self.lit(fl_["lit"], t)
            if on <= 0: continue
            self._candle(out, fl_, t, on)
        # live steam
        if self.steam:
            sm = self.steam
            fr = sm["clip"].at(t)
            g = fr.mean(2, keepdims=True) * np.array([1.0, 1.0, 1.0], np.float32)
            a = np.clip(g * sm["gain"], 0, 1) * sm["m"] * sm["op"]
            x0, y0, w, h = sm["x0"], sm["y0"], sm["w"], sm["h"]
            out[y0:y0 + h, x0:x0 + w] = out[y0:y0 + h, x0:x0 + w] * (1 - a) + np.array([0.93, 0.94, 0.96], np.float32) * a
        return np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)

    def _candle(self, out, fl, t, on):
        s = self.s
        hgt = fl["h"] * (1 + 0.07 * fl["n1"](t) + 0.045 * fl["n2"](t)) * on
        wid = fl["w"] * (1 + 0.04 * fl["n2"](t))
        sway = 0.12 * fl["n3"](t) + 0.05 * fl["n2"](t)
        bright = (1 + 0.10 * fl["n1"](t) + 0.06 * fl["n2"](t)) * min(on, 1.1)
        SS = 4
        ph = int(hgt * 1.4) + 6; pw = int(max(wid * 3, hgt * 0.8)) + 6
        cx = fl["x"]; by = fl["base"]
        x0 = int(cx - pw / 2); y0 = int(by - ph + 3)
        hh, ww = ph * SS, pw * SS
        yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
        v = (by - (y0 + (yy + 0.5) / SS)) / max(hgt, 1e-3)          # 0 at the wick, 1 at the tip
        xc = cx + sway * hgt * np.clip(v, 0, 1) ** 2
        hw = np.sin(np.pi * np.clip(v, 0, 1) ** 0.62) ** 1.1 * (wid / 2)
        u = np.abs((x0 + (xx + 0.5) / SS) - xc) / np.maximum(hw, 1e-3)   # 0 centre, 1 edge
        valid = (v > 0) & (v < 1)
        d = np.clip(1 - u, 0, 1) * valid                                   # depth inside the flame
        alpha = np.clip(d / 0.10, 0, 1)                                    # crisp inked edge
        rim = np.clip(1 - d / 0.22, 0, 1)                                  # outer band
        core = np.clip((d - 0.35) / 0.4, 0, 1) * np.clip(1 - v / 0.75, 0, 1)
        body = np.array([0.22, 0.72, 1.0], np.float32)
        col = body[None, None, :] * (1 - rim[..., None]) + np.array([0.08, 0.38, 0.92], np.float32) * rim[..., None]
        col = col * (1 - core[..., None]) + np.array([0.78, 0.96, 1.0], np.float32) * core[..., None]
        blue = (np.clip(1 - v / 0.13, 0, 1) * rim)[..., None]
        col = col * (1 - 0.6 * blue) + np.array([0.85, 0.45, 0.25], np.float32) * 0.6 * blue
        line = (np.clip(1 - np.abs(d - 0.05) / 0.05, 0, 1) * valid)[..., None]  # thin darker ink outline
        col = col * (1 - 0.45 * line) + np.array([0.05, 0.2, 0.55], np.float32) * 0.45 * line
        rgba = np.concatenate([col * alpha[..., None], alpha[..., None]], 2)
        rgba = cv2.resize(rgba, (pw, ph), interpolation=cv2.INTER_AREA)
        H, W = out.shape[:2]
        ya, yb = max(0, y0), min(H, y0 + ph); xa, xb = max(0, x0), min(W, x0 + pw)
        r_ = rgba[ya - y0:yb - y0, xa - x0:xb - x0]
        A = np.clip(r_[..., 3:4], 0, 1)
        out[ya:yb, xa:xb] = out[ya:yb, xa:xb] * (1 - A) + np.clip(r_[..., :3] * bright, 0, 1.2)
        # halo on the surroundings, follows the flame
        R = int(fl["halo"] * fl["h"]) + 2
        hy = by - 0.45 * fl["h"]
        ya, yb = max(0, int(hy - R * 2)), min(H, int(hy + R * 2)); xa, xb = max(0, int(cx - R * 2)), min(W, int(cx + R * 2))
        yy, xx = np.mgrid[ya:yb, xa:xb]
        g = np.exp(-((xx - cx) ** 2 + (yy - hy) ** 2) / (2 * R * R)).astype(np.float32)[..., None]
        out[ya:yb, xa:xb] *= 1 + fl["glow"] * bright * g * np.array([0.5, 0.8, 1.0], np.float32)


def render(sc, out, t0, t1, crf=16):
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{sc.W}x{sc.H}", "-r", str(sc.fps), "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    n0, n1 = int(round(t0 * sc.fps)), int(round(t1 * sc.fps))
    for i in range(n0, n1):
        p.stdin.write(sc.frame(i / sc.fps).tobytes())
        if (i - n0) % 240 == 0:
            print(f"frame {i - n0}/{n1 - n0}", file=sys.stderr, flush=True)
    p.stdin.close(); p.wait()


def masks_sheet(sc, path):
    vis = (sc.orig * 255).astype(np.uint8).copy()
    ov = np.zeros_like(vis)
    ov[..., 0] = (sc.panes * 255).astype(np.uint8)
    ov[..., 2] = np.maximum((sc.fire_dim * 255).astype(np.uint8), sc.kill * 255)
    ov[..., 1] = (sc.grate_front * 255).astype(np.uint8)
    img = cv2.addWeighted(vis, 0.55, ov, 0.7, 0)
    for fc in sc.fire_clips:
        cv2.rectangle(img, (fc["x0"], fc["y0"]), (fc["x0"] + fc["w"], fc["y0"] + fc["h"]), (0, 255, 255), 1)
    for fl in sc.flames:
        cv2.rectangle(img, (int(fl["x"] - fl["w"]), int(fl["base"] - fl["h"])), (int(fl["x"] + fl["w"]), int(fl["base"])), (255, 0, 255), 1)
    for bl in sc.bulbs:
        cv2.circle(img, (int(bl["x"]), int(bl["y"])), 4, (255, 255, 0), 1)
    for fl in sc.far_lights:
        x0, y0, x1, y1 = fl["box"]; cv2.rectangle(img, (x0, y0), (x1, y1), (0, 128, 255), 1)
    if sc.steam:
        st = sc.steam; cv2.rectangle(img, (st["x0"], st["y0"]), (st["x0"] + st["w"], st["y0"] + st["h"]), (255, 255, 255), 1)
    cv2.imwrite(path, img)
    plate = (np.clip(sc.plate, 0, 1) * 255).astype(np.uint8)
    cv2.imwrite(path.replace(".jpg", "_plate.jpg"), plate)
    print(json.dumps({"panes": len(sc.pane_boxes), "flames": len(sc.flames), "bulbs": len(sc.bulbs), "far_lights": len(sc.far_lights), "fire_clips": len(sc.fire_clips)}))


def checks(sc):
    """Measured checks from LAYERS.md."""
    res = {}
    # 1. snow never outside the panes: draw a frame's snow alone and measure outside the mask
    f0 = sc.frame(sc.T0 + 1.0).astype(np.float32); f1 = sc.frame(sc.T0 + 1.5).astype(np.float32)
    diff = np.abs(f0 - f1).mean(2)
    rx0, ry0, rx1, ry1 = sc.win_region
    room = np.ones(diff.shape, bool); room[ry0:ry1, rx0:rx1] = sc.panes[ry0:ry1, rx0:rx1] < 0.05
    reg = np.zeros(diff.shape, bool); reg[ry0:ry1, rx0:rx1] = True
    res["window_region_change_outside_glass_px"] = int(((diff > 12) & reg & room).sum())
    # 2. every light alive: brightness range over the loop at each light
    ts = [sc.T0 + k * 0.5 for k in range(24)]
    frames = [sc.frame(t).astype(np.float32).mean(2) for t in ts]
    def rng_at(x, y, r):
        x, y, r = int(x), int(y), int(r)
        vals = [f[max(0, y - r):y + r, max(0, x - r):x + r].mean() for f in frames]
        return round(float(max(vals) - min(vals)), 1)
    res["candles"] = [rng_at(f["x"], f["base"] - f["h"] / 2, max(3, f["h"] / 2)) for f in sc.flames]
    fo = sc.cfg["fire"]["light"]["center"]
    res["fire"] = rng_at(fo[0] * sc.s, fo[1] * sc.s - 60 * sc.s, 40 * sc.s)
    res["bulbs_mean_range"] = round(float(np.mean([rng_at(b["x"], b["y"], 3) for b in sc.bulbs])) if sc.bulbs else 0, 1)
    res["lamps"] = [rng_at(l["at"][0] * sc.s, l["at"][1] * sc.s, 30 * sc.s) for l in sc.cfg.get("lamps", [])]
    res["glows"] = [rng_at(g["at"][0] * sc.s, g["at"][1] * sc.s, 10 * sc.s) for g in sc.cfg.get("glows", [])]
    if sc.steam:
        st = sc.steam; res["steam"] = rng_at(st["x0"] + st["w"] / 2, st["y0"] + st["h"] * 0.6, st["w"] / 3)
    # 3. seam of the steady loop: frame at T0+L must equal frame at T0
    a = sc.frame(sc.T0).astype(np.int16); b = sc.frame(sc.T0 + sc.L).astype(np.int16)
    c = sc.frame(sc.T0 + sc.L - 1 / sc.fps).astype(np.int16); d = sc.frame(sc.T0 + 1 / sc.fps).astype(np.int16)
    res["seam_equal"] = float(np.abs(a - b).mean())
    res["seam_step"] = float(np.abs(c - a).mean()); res["normal_step"] = float(np.abs(d - a).mean())
    print(json.dumps(res, default=float))
    return res


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("scene"); ap.add_argument("--w", type=int, default=1920)
    ap.add_argument("--masks"); ap.add_argument("--frame", nargs=2); ap.add_argument("--render")
    ap.add_argument("--from", dest="t0", type=float, default=0); ap.add_argument("--to", dest="t1", type=float, default=None)
    ap.add_argument("--checks", action="store_true")
    a = ap.parse_args()
    cfg = json.load(open(a.scene))
    sc = Scene(cfg, a.w)
    if a.masks: masks_sheet(sc, a.masks)
    if a.frame: cv2.imwrite(a.frame[1], sc.frame(float(a.frame[0])))
    if a.checks: checks(sc)
    if a.render: render(sc, a.render, a.t0, a.t1 if a.t1 is not None else sc.T0 + sc.L)
