"""c5 "wanderer by the mountain lake" - batch 1: code-only layers (no GPU).
  stars   each star twinkles on its own clock (only its own excess light over the sky changes)
  meteors the painted shooting star is removed; rare short meteors cross open sky, behind clouds and tree
  water   the lake surface ripples (sub-2px travelling waves, bigger near the viewer) + faint glint shimmer
Everything is a pure function of the frame number and loops exactly over the block.
  python3 compose_c5.py --seconds 24 --out /tmp/c5/b1.mp4 [--gate]
"""
import cv2, numpy as np, json, argparse, subprocess, math
FPS = 24
S = 'scenes/c5/'
P = cv2.imread(S + 'picture.png'); H, W = P.shape[:2]
M = lambda n: cv2.imread(S + f'mask_{n}.png', 0) > 0
sky, lake, shoot = M('sky'), M('lake'), M('shooting_star')
PLATE = cv2.inpaint(P, shoot.astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
Pf = PLATE.astype(np.float32)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

def loop_noise(n, T, rnd, f_lo, f_hi, K=10):
    """Per-item smooth noise that repeats exactly after T seconds: K components with whole cycles per block, random
    frequencies, 1/f weights. Returns (freqs, phases, weights) for value(t) = sum w*sin(2pi f t + ph), about unit range.
    Review round 1: 3 clean sines per star read as a metronome."""
    f = np.round(np.exp(rnd.uniform(np.log(f_lo), np.log(f_hi), (K, n))) * T) / T
    f[f == 0] = 1. / T
    w = 1 / np.sqrt(f); w /= np.sqrt((w ** 2).sum(0)) * 1.2
    return f, rnd.uniform(0, 2 * np.pi, (K, n)), w

class Stars:
    """Twinkle, not shimmer (owner, round 3: every star wobbling at once read as shimmer). The sky is steady with a
    slight slow breath per star; a star twinkles as its own short event: a quick dip, a bright flash, a settle,
    0.35-0.7 s, every 5-16 s, each star on its own schedule, so at any moment only a few percent of stars are
    twinkling. Only detected star points change, and only their own excess light over the sky behind them."""
    def __init__(self, T, seed=5):
        rnd = np.random.RandomState(seed); self.T = T
        core = M('stars').astype(np.uint8)
        n, lab = cv2.connectedComponents(core)
        lab = cv2.dilate(lab.astype(np.uint16), np.ones((3, 3), np.uint8)); lab[~sky] = 0
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        bg = np.stack([cv2.morphologyEx(Pf[..., c], cv2.MORPH_OPEN, k) for c in range(3)], -1)
        self.lab, self.n, self.mask = lab, n, lab > 0
        self.excess = np.clip(Pf - bg, 0, None) * self.mask[..., None]
        peak = np.zeros(n); np.maximum.at(peak, lab[self.mask], self.excess.max(-1)[self.mask])
        rank = np.argsort(np.argsort(peak)) / max(1, n - 1)
        self.f, self.ph, self.w = loop_noise(n, T, rnd, .05, .4, K=4)
        ev = []
        cx = np.zeros(n); cyy = np.zeros(n); np.maximum.at(cx, lab[self.mask], xx[self.mask]); np.maximum.at(cyy, lab[self.mask], yy[self.mask])
        for sidx in range(1, n):
            if rank[sidx] < .35: continue
            slow = 2.2 if (cx[sidx] > 1040 and cyy[sidx] < 200) else 1.            # dense Milky Way band: fewer events, or it glitters                                       # the faintest third only breathe
            t = rnd.uniform(-16 * slow, 0)                                       # already running at t=0: even rate over the loop
            while t < T:
                big = rank[sidx] > .93 and rnd.rand() < .5
                ev.append((sidx, t, rnd.uniform(1.1, 1.4) if big else rnd.uniform(.5, .9), rnd.uniform(1.2, 1.7) if big else rnd.uniform(.7, 1.3)))
                t += rnd.uniform(5, 16) * slow
        self.ev = np.array(ev, np.float32) if ev else np.zeros((0, 4), np.float32)
    def apply(self, out, t):
        gain = (.07 * (self.w * np.sin(2 * np.pi * self.f * t + self.ph)).sum(0)).astype(np.float32); gain[0] = 0
        if len(self.ev):
            d = (t - self.ev[:, 1]) % self.T
            act = d < self.ev[:, 2]
            u = d[act] / self.ev[act, 2]
            shape = np.sin(np.pi * u) ** 2 * np.where(u < .5, 1., .8) - .35 * np.sin(np.pi * np.clip(u * 4, 0, 1)) * (u < .25)
            np.add.at(gain, self.ev[act, 0].astype(int), (self.ev[act, 3] * shape).astype(np.float32))
        add = gain[self.lab][..., None] * self.excess
        pos = np.clip(add, 0, None)
        out += add + .9 * cv2.GaussianBlur(pos, (0, 0), 1.6) + 2.2 * cv2.GaussianBlur(pos * np.clip((pos - 35) / 70., 0, 1), (0, 0), 3.4)   # wide glow only on the strongest flashes        # a soft glow on a flash: a 1 px blip vanished on a phone

class Water:
    """Ripples are travelling waves: phase advances along a perspective-compressed y (bands get closer toward the far
    shore) and along x so every band drifts right -> left (the wind). Five components with unrelated periods and
    slants, each gated by its own slow gust patch, so nothing sways in place (round 1: one 0.54 Hz wave dominated).
    Amplitude is zero at the traced outline and reaches full strength 10 px inside."""
    def __init__(self, T, seed=3):
        rnd = np.random.RandomState(seed); self.T = T
        d = cv2.distanceTransform(lake.astype(np.uint8), cv2.DIST_L2, 5)
        a = np.clip(d / 10., 0, 1); self.a = (a * a * (3 - 2 * a)).astype(np.float32)
        y0, y1 = 626., 880.
        dep = np.clip((np.arange(H) - y0) / (y1 - y0), 0, 1)
        self.depth = dep[:, None].astype(np.float32) * np.ones((1, W), np.float32)
        self.amp = (0.7 + 3.0 * self.depth) * self.a
        self.py = (np.cumsum(2 * np.pi / (4 + 24 * dep))[:, None] * np.ones((1, W))).astype(np.float32)
        self.persp = (1 / (0.35 + 1.0 * self.depth)).astype(np.float32)        # x frequencies compress with distance
        # (y-scale, x wavenumber rad/px at the near edge, cycles/s, weight)
        self.comp = [(1.0, .030, .23, 1.0), (.61, .047, .37, .8), (1.7, .021, .52, .55), (.37, .064, .17, .7), (2.6, .09, .81, .3)]
        self.gust = []
        for c in self.comp:                                                     # slow moving amplitude patches
            g = cv2.resize(rnd.randn(6, 14).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
            self.gust.append((g, rnd.uniform(0, 6.28), round(rnd.uniform(.02, .05) * T) / T))
        g = cv2.cvtColor(PLATE, cv2.COLOR_BGR2GRAY).astype(np.float32)
        self.plate_g = g
        p = cv2.resize(rnd.rand(9, 16).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
        p = np.clip((p - .45) / .3, 0, 1); self.patch = (p + p[:, ::-1]) / 2                     # mirror-blend: seamless when rolled
    def waves(self, t):
        dx = np.zeros((H, W), np.float32); dy = np.zeros((H, W), np.float32); fine = None
        for (ys, kx, cyc, wt), (g, gph, gf) in zip(self.comp, self.gust):
            w = 2 * np.pi * round(cyc * self.T) / self.T * t
            p = self.py * ys + xx * kx * self.persp + w                         # +w t with +kx x  => travels toward -x (left)
            gate = .65 + .35 * np.sin(g * 1.6 + 2 * np.pi * gf * t + gph)
            dx += wt * gate * np.sin(p); dy += wt * gate * .4 * np.cos(p); fine = p if fine is None else fine
        return dx * self.amp / 1.6, dy * self.amp / 1.6, dx
    def apply(self, out, t):
        dx, dy, raw = self.waves(t)
        sl = (slice(600, 900), slice(330, W)); warped = out.copy()
        warped[sl] = cv2.remap(out, (xx + dx)[sl], (yy + dy)[sl], cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        warped += .12 * (warped - cv2.GaussianBlur(warped, (0, 0), 1.0))        # resampling softens: restore the picture's detail energy
        a = self.a[..., None]
        res = out * (1 - a) + warped * a
        # moonlit glints: wave crests catch a little light, so dark water is alive too (at most ~5 levels)
        crest = np.clip(raw / 1.8, 0, 1) ** 2 * self.a * (7.0 + 16.0 * self.depth)
        res -= (np.clip(-raw / 1.8, 0, 1) ** 2 * self.a * (3.0 + 7.0 * self.depth))[..., None]      # troughs darken a little
        res += crest[..., None] * np.array([1.0, .92, .8], np.float32)
        # travelling light: thin bright ripple lines that visibly run right -> left (about 25-45 px/s near the viewer),
        # in patches that drift with them. Review round 4: the warp alone only wobbled the reflections in place.
        c = lambda cyc: 2 * np.pi * round(cyc * self.T) / self.T * t
        shift = (round(.022 * self.T) / self.T * t * W) % W                      # patch texture drifts left, wraps exactly
        patch = np.roll(self.patch, -int(shift), 1)
        g1 = np.sin(self.py * 1.25 + xx * .055 * self.persp + c(.55) + self.gust[0][0] * 2.5)   # bent by the gust field: straight lines read as scratches
        g2 = np.sin(self.py * 2.1 + xx * .03 * self.persp + c(.9) + self.gust[1][0] * 3.0)
        lines = (np.clip((g1 - .55) / .45, 0, 1) ** 2 + .5 * np.clip((g2 - .65) / .35, 0, 1) ** 2) * patch * self.a * (6.0 + 15.0 * self.depth)
        out[:] = res + lines[..., None] * np.array([1.0, .95, .86], np.float32)

class Meteors:
    """Thin, fast streaks at random times and places; each differs in angle, length, speed and brightness. Drawn
    additively and multiplied by the open-sky mask, so they pass behind cloud, tree and mountains."""
    def __init__(self, T, every=(40, 90), seed=9, force=None):   # viewer check: 4 in 24 s read as an effect; one per 40-90 s
        rnd = np.random.RandomState(seed); self.ev = []
        ys, xs = np.nonzero(cv2.erode(sky.astype(np.uint8), np.ones((31, 31), np.uint8)))
        times = list(force) if force is not None else []
        if force is None:
            t = rnd.uniform(*every)
            while t < T - 2: times.append(t); t += rnd.uniform(*every)
        for t0 in times:
            for _try in range(200):                                              # the whole path must stay in open sky
                i = rnd.randint(len(xs)); ang = math.radians(rnd.uniform(18, 62)); sgn = rnd.choice([-1, 1])
                Lt = 360.
                pts = [(int(xs[i] + sgn * math.cos(ang) * Lt * q), int(ys[i] + math.sin(ang) * Lt * q)) for q in np.linspace(0, 1, 30)]
                if all(0 <= px < W and 0 <= py < H and sky[py, px] for px, py in pts): break
            L = rnd.uniform(300, 420); dur = rnd.uniform(.6, .8)
            self.ev.append((t0, dur, xs[i], ys[i], sgn * math.cos(ang) * L, math.sin(ang) * L, rnd.uniform(.9, 1.3), rnd.uniform(.5, .65)))
        self.soft = cv2.GaussianBlur(sky.astype(np.float32), (0, 0), 1.5) * sky
    def apply(self, out, t):
        for t0, dur, x0, y0, vx, vy, br, tl in self.ev:
            u = (t - t0) / dur
            if not 0 <= u <= 1 + tl: continue
            lay = np.zeros((H, W), np.float32)
            head = min(u, 1.); tail = max(0., u - tl); n = 48
            life = math.sin(math.pi * min(u, 1.)) ** .5 if u <= 1 else 1.
            for k in range(n - 1):
                q0 = tail + (head - tail) * k / (n - 1); q1 = tail + (head - tail) * (k + 1) / (n - 1)
                inten = br * ((k + 1) / n) ** 2.4 * (.25 + .75 * math.sin(math.pi * q1) ** .7) * life * (1.6 if k >= n - 4 else 1.)   # fading tail, bright head
                cv2.line(lay, (int(round((x0 + vx * q0) * 8)), int(round((y0 + vy * q0) * 8))), (int(round((x0 + vx * q1) * 8)), int(round((y0 + vy * q1) * 8))),
                         float(inten), 1, cv2.LINE_AA, 3)
            lay = (lay * .6 + cv2.GaussianBlur(lay, (0, 0), 1.1) * 1.2) * self.soft
            out += lay[..., None] * np.array([255, 242, 228], np.float32)
    def region(self):
        m = np.zeros((H, W), np.uint8)
        for t0, dur, x0, y0, vx, vy, br, tl in self.ev: cv2.line(m, (int(x0), int(y0)), (int(x0 + vx), int(y0 + vy)), 255, 9)
        return m > 0

def smooth(u): u = np.clip(u, 0, 1); return u * u * (3 - 2 * u)

class Tree:
    """The big tree only (owner: leave the other trees). Leaves and twig ends sway toward the left on gusts and
    flutter; trunk and thick limbs stay fixed. A smooth displacement field weighted by leafiness, so a leaf cluster
    moves as one piece of foliage and nothing is cut out or slid."""
    BOX = (0, 0, 800, 540)
    def __init__(self, T, seed=11):
        rnd = np.random.RandomState(seed); self.T = T
        x0, y0, x1, y1 = self.BOX; sl = (slice(y0, y1), slice(x0, x1)); self.sl = sl
        hsv = cv2.cvtColor(PLATE, cv2.COLOR_BGR2HSV).astype(np.float32); b, g, r = [Pf[..., i] for i in range(3)]
        tree = M('tree_guard')
        leafy = (hsv[..., 0] > 15) & (hsv[..., 0] < 95) & (hsv[..., 1] > 70) & (g >= b - 5) & tree
        wood = ((b - r) < 30) & tree
        limbs = cv2.morphologyEx(wood.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
        limbs = cv2.dilate(limbs, np.ones((5, 5), np.uint8)) > 0
        trunk = np.zeros((H, W), np.uint8)
        cv2.fillPoly(trunk, [np.array([(0,330),(40,290),(95,235),(150,215),(190,250),(160,330),(125,430),(105,560),(115,680),(0,700)], np.int32)], 255)
        w = cv2.dilate((leafy & ~(trunk > 0)).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
        w = cv2.GaussianBlur(w, (0, 0), 4)
        w *= 1 - .75 * cv2.GaussianBlur(limbs.astype(np.float32), (0, 0), 3)                 # thick wood barely moves
        w *= np.clip(np.hypot(xx - 60, yy - 400) / 420., .3, 1.)                              # tips more than the base
        w *= smooth((np.hypot(xx - 557, yy - 186) - 60) / 40.)                                # nothing near the moon moves
        self.w = w[sl]; self.xx, self.yy = xx[sl], yy[sl]
        self.gust = cv2.resize(rnd.randn(5, 7).astype(np.float32), (x1 - x0, y1 - y0), interpolation=cv2.INTER_CUBIC)
        self.fl = [cv2.resize(rnd.randn(30, 44).astype(np.float32), (x1 - x0, y1 - y0), interpolation=cv2.INTER_CUBIC) for _ in range(2)]
        self.mask = cv2.dilate((w > .01).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    def field(self, t):
        c = lambda cyc: 2 * np.pi * round(cyc * self.T) / self.T * t
        # gusts roll through the crown from right to left: lean left, spring back
        g1 = np.sin(self.xx * .011 + self.yy * .004 + c(.21) + self.gust * 1.2)
        g2 = np.sin(self.xx * .023 - self.yy * .009 + c(.37) + 1.3)
        lean = .55 + .45 * np.sin(c(.08) + self.gust)                                         # gust strength comes and goes
        dx = self.w * (lean * (5.5 * g1 + 2.4 * g2 - 2.0) + 1.1 * np.sin(self.fl[0] * 3 + c(1.3)))   # leans left (the wind) and springs back
        dy = self.w * (lean * (1.8 * np.cos(self.xx * .011 + c(.21) + self.gust * 1.2)) + .7 * np.sin(self.fl[1] * 3 + c(1.7)))
        return dx.astype(np.float32), dy.astype(np.float32)
    def apply(self, out, t):
        dx, dy = self.field(t); x0, y0, x1, y1 = self.BOX
        out[self.sl] = cv2.remap(out, self.xx + dx, self.yy + dy, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)

class Coat:
    """Only the coat below the belt moves (wind right -> left): a cloth wave runs down and out along the skirt, pinned
    at the belt, biggest at the flared left tail. The coat is lifted as its own layer (reviewed cut-out) and drawn
    over a background with the coat painted out, so no ghost edge appears. Body, hood, arms and boots never move."""
    BOX = (195, 520, 380, 672)
    def __init__(self, T, seed=13):
        self.T = T; x0, y0, x1, y1 = self.BOX; sl = (slice(y0, y1), slice(x0, x1)); self.sl = sl
        fig = cv2.imread(S + 'mask_figure.png', 0).astype(np.float32) / 255
        lower = fig * smooth((yy - 536) / 10.) * (1 - smooth((yy - 652) / 6.) * (xx > 268))   # belt down; not the boots
        hole = cv2.dilate((lower > .05).astype(np.uint8), np.ones((7, 7), np.uint8))
        hole[:532] = 0
        self.bg = cv2.inpaint(PLATE, hole * 255, 7, cv2.INPAINT_TELEA).astype(np.float32)[sl]
        legs = fig * smooth((yy - 644) / 5.) * (xx > 262)                                        # legs and boots: never move, never see-through
        self.bg = self.bg * (1 - legs[sl][..., None]) + Pf[sl] * legs[sl][..., None]
        self.rgba = np.dstack([Pf, lower])[sl]
        self.xx, self.yy = xx[sl], yy[sl]
        down = smooth((self.yy - 540) / 105.)                                                   # 0 at the belt, 1 at the hem
        tail = .45 + .55 * smooth((330 - self.xx) / 95.)                                        # the flared left tail moves most
        self.amp = down ** 1.3 * tail
        self.keep = 1 - smooth((self.yy - 536) / 10.)[..., None]                                 # above the belt: original pixels
        self.mask = cv2.dilate((lower > .02).astype(np.uint8), np.ones((13, 13), np.uint8)) > 0
    def apply(self, out, t):
        c = lambda cyc: 2 * np.pi * round(cyc * self.T) / self.T * t
        gust = .62 + .2 * np.sin(c(.13) + .8) + .14 * np.sin(c(.29) + 2.1) + .1 * np.sin(c(.47))
        p = self.yy * .085 - self.xx * .045
        dx = self.amp * gust * (4.2 * np.sin(p - c(.62)) + 2.2 * np.sin(p * 1.7 - c(.41) + 1.0) + 1.4 * np.sin(p * 2.6 - c(1.07) + 2.3)) + self.amp * 3.0 * (gust - .6)
        dy = self.amp * gust * (1.7 * np.cos(p - c(.62)))
        w = cv2.remap(self.rgba, (self.xx - self.BOX[0] + dx).astype(np.float32), (self.yy - self.BOX[1] + dy).astype(np.float32),
                      cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        a = np.clip(w[..., 3:4], 0, 1)
        comp = self.bg * (1 - a) + w[..., :3] * a
        out[self.sl] = out[self.sl] * self.keep + comp * (1 - self.keep)

def tile_noise(h, w, beta, rnd):
    """Smooth noise that tiles in x and y (shaped random spectrum), 0..1."""
    fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.fftfreq(w)[None, :]
    f = np.hypot(fy * 9.0, fx); f[0, 0] = 1                                    # stretched sideways: long low wisps, 3-4x wider than tall
    spec = (rnd.randn(h, w) + 1j * rnd.randn(h, w)) / f ** beta; spec[0, 0] = 0
    # band-limit: patches 150-300 px wide with gaps as wide. Without this the lowest wave (one cycle across the whole
    # sheet) dominated: a front crossed the lake once and then the mist sat as one even band (viewer check, preview 8).
    spec *= ((np.abs(fx) > 1 / 900.) & (np.abs(fx) < 1 / 180.) & (np.abs(fy) < 1 / 28.)) * np.ones_like(f)
    n = np.real(np.fft.ifft2(spec)); n = (n - n.min()) / (n.max() - n.min())
    return n.astype(np.float32)

class Fog:
    """A little mist lying on the lake, flowing right -> left with the wind (owner request, round 5). Two noise sheets
    at different speeds that slowly trade places, so banks form and thin out instead of a texture sliding by.
    Thickest along the far shore, gone before the near water. Lives only on the traced lake (plus a low band over the
    far waterline), cut around the firs, so it stays behind every foreground thing. Moonlit: cool white, no glow."""
    def __init__(self, T, seed=21):
        rnd = np.random.RandomState(seed); self.T = T
        self.y0, self.y1 = 596, 830; hh = self.y1 - self.y0; self.TW = 2 * W
        self.tex = [tile_noise(hh, self.TW, 1.35, rnd) for _ in range(3)]
        g = cv2.cvtColor(PLATE, cv2.COLOR_BGR2GRAY).astype(np.float32); b, gr = Pf[..., 0], Pf[..., 1]
        firs = cv2.dilate(((gr > b + 4) & (g < 80) & (yy > 640)).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        area = cv2.dilate(lake.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
        band = np.zeros((H, W), np.uint8)                                       # low over the far waterline, clear of figure and big fir
        cv2.fillPoly(band, [np.array([(372,612),(772,612),(792,600),(1108,600),(1130,616),(1505,616),(1505,650),(372,650)], np.int32)], 255)
        # Review of preview 2: the band above the waterline climbed the far shore, the colour rule let dark
        # reflections punch through, and the mist was a flat wash that hid the ripples. Lake only, thinner, more texture.
        # Viewer check, preview 4: too heavy (+45 levels read as water brightening), too slow for a phone, and a hard
        # straight top at the waterline. Now: peak about 14 levels, a soft top that rises ~16 px over the far shore,
        # and a faster fine sheet so wisps visibly travel.
        grow = cv2.dilate(lake.astype(np.uint8), np.ones((49, 1), np.uint8), anchor=(0, 0))       # upward only (anchor at the kernel top): 20-30 px over the shore
        grow[:, :372] = 0; grow[:, 1500:] = lake.astype(np.uint8)[:, 1500:]
        m = cv2.GaussianBlur(grow.astype(np.float32), (0, 0), 6)
        yv = yy[self.y0:self.y1]
        prof = smooth((yv - 590) / 26.) * (1 - smooth((yv - 664) / 100.))        # rises off the far water, fades toward the viewer
        xv = xx[self.y0:self.y1]
        self.m = m[self.y0:self.y1] * prof * (1 - smooth((xv - 1430) / 70.)) * smooth((xv - 365) / 110.)       # stops before the big right fir: a cut-out around it showed as a halo
        self.sp = [round(s_ * T / self.TW) * self.TW / T if T >= 300 else s_ for s_ in (18., 26., 11.)]   # exact wraps only for real blocks   # px/s; whole wraps per block when long enough
        self.mask = cv2.dilate((np.pad(self.m, ((self.y0, H - self.y1), (0, 0))) > .02).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    def sheet(self, k, t):
        sh = (self.sp[k] * t) % self.TW; i = int(sh); f = sh - i
        a = np.roll(self.tex[k], -i, 1)[:, :W]; b = np.roll(self.tex[k], -(i + 1), 1)[:, :W]
        return a * (1 - f) + b * f
    def apply(self, out, t):
        c = lambda cyc: 2 * np.pi * max(1, round(cyc * self.T)) / self.T * t
        w0 = .5 + .5 * np.sin(c(.011)); w1 = .5 + .5 * np.sin(c(.017) + 2.1)
        k0, k1 = .55 + .45 * w0, .55 + .45 * w1
        d = (self.sheet(0, t) * k0 + self.sheet(1, t) * k1 + .5 * self.sheet(2, t)) / (k0 + k1 + .5)   # weighted MEAN, about .5
        d = smooth((d - .46) / .16)                                # soft-edged wisps with holes between (hard patch edges showed at 2x)                           # banks with clear gaps between
        a = (d * self.m)[..., None]
        sl = slice(self.y0, self.y1)
        out[sl] += a * np.array([19., 17.5, 15.5], np.float32)       # additive lift (peak about +16): ripples under it keep their contrast

import glob, living
MASTERS = '/tmp/c5/masters'
INP = '../gpu/session2/inputs_c5/'

class ClipLayer:
    """A truly rendered layer (owner rule: solid things move only as rendered clips, looped by frame continuation).
    First-and-last-frame clips of one crop are colour-locked to the picture on the parts that do not move (the
    render mode pumps brightness 16-32 % mid-clip), matched in sharpness, then chained by living.FlfStream: every
    join passes through the picture's own frame."""
    def __init__(self, name, ids, T, paste, seed=1, phase=0, settle=3, lock_mean=False, matte=False):
        d = json.load(open(INP + 'crops.json'))['crops'][name]
        x0, y0, x1, y1 = d['box']; self.sl = (slice(y0, y1), slice(x0, x1)); w, h = x1 - x0, y1 - y0
        anchor = PLATE[self.sl].copy()
        still = cv2.resize(cv2.imread(INP + name + '_motion.png', 0), (w, h), interpolation=cv2.INTER_AREA) < 10
        still = cv2.erode(still.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        af = anchor.astype(np.float32); clips = []
        for cid in ids:
            fr = []
            for f in sorted(glob.glob(f'{MASTERS}/{cid}/*.png')):
                im = cv2.resize(cv2.imread(f), (w, h), interpolation=cv2.INTER_AREA).astype(np.float32)
                for c in range(3):                          # gain + offset per channel from the still parts
                    g, o = np.polyfit(im[..., c][still][::7], af[..., c][still][::7], 1)
                    im[..., c] = im[..., c] * g + o
                fr.append(np.clip(im + .5, 0, 255).astype(np.uint8))
            clips.append(np.stack(fr))
        clips = living.match_sharpness(clips, anchor, paste[self.sl] > .5)
        # Shared join frame (skill S4, learned on c4): all clips of the layer join through ONE frame, the median of
        # their own first and last frames. Landing on the picture itself snapped (sharper, different colours): on c5
        # that was the soft-sharp-soft pulse on the water at every join.
        ends = np.stack([cc[0] for cc in clips] + [cc[-1] for cc in clips])
        self.join = np.median(ends, axis=0).astype(np.uint8)
        self.st = living.FlfStream(clips, self.join, T, seed=seed, phase=phase, settle=settle)
        # Clip order: the engine only avoids the same clip twice in a row, so with 3 clips A-B-A came up and the layer
        # repeated exactly 12 s later (viewer check). Here a clip never returns within the next n-1 slots where
        # possible: shuffled rounds, re-drawn until the round's first clips differ from the previous round's last ones.
        import random as _r
        rr = _r.Random(seed); n = len(self.st.base); L = len(self.st.base[0]); slots = self.st.N // L
        gap = n - 1 if n <= 4 else 3            # few clips: longest possible spacing (a fixed cycle); 5+: shuffled, never back within 24 s
        if n >= 5:      # shuffled full rounds: every clip once per round, a new order each round, never back within 18 s
            order, prev = [], None
            while len(order) < slots:
                for _ in range(200):
                    rnd_ = list(range(n)); rr.shuffle(rnd_)
                    if prev is None or (not set(rnd_[:2]) & set(prev[-2:]) and rnd_ != prev): break
                order += rnd_; prev = rnd_
            order = order[:slots]
        else:           # few clips: a fixed cycle is the longest possible spacing
            first = list(range(n)); rr.shuffle(first); order = [first[i % n] for i in range(slots)]
        seq = [(("b", k), i) for k in order for i in range(L)]
        off = phase % len(seq); self.st.seq = seq[off:] + seq[:off]
        # Review of preview 2: the ease onto the picture frame and the 16->24 fps in-betweens soften frames, so the
        # water pulsed soft-sharp-soft at every join and drifted ~6 levels darker over a clip. Lock every FINAL frame:
        # detail energy and per-channel mean inside the pasted area both equal the picture's.
        m = paste[self.sl] > .5
        lap = lambda f: float(cv2.Laplacian(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), cv2.CV_32F)[m].var())
        target = lap(anchor); amean = af[m].mean(0)
        for clip in self.st.base:
            for i in range(len(clip)):
                f = clip[i].astype(np.float32)
                f += (amean - f[m].mean(0)) * (1.0 if lock_mean else 0.0)
                r = np.sqrt(target / max(lap(clip[i]), 1.0))
                if abs(r - 1) > .02: f += (r - 1) * 1.35 * (f - cv2.GaussianBlur(f, (0, 0), 1.0))
                clip[i] = np.clip(f + .5, 0, 255).astype(np.uint8)
        self.a = paste[self.sl].astype(np.float32)[..., None]
        self.matte = None
        self.kind = matte
        if matte == 'leaf':
            # leaves only (viewer check, preview 7: bark went orange-brown and stars in the gaps vanished because sky and
            # limbs came from the clip). The still's own leaves are covered; everything else keeps the picture's pixels.
            hsv0 = cv2.cvtColor(anchor, cv2.COLOR_BGR2HSV).astype(np.float32)
            leaf0 = (hsv0[..., 0] > 15) & (hsv0[..., 0] < 95) & (hsv0[..., 1] > 70) & (af[..., 1] >= af[..., 0] - 5)
            self.matte = cv2.dilate(leaf0.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
            # bark stays the still's (viewer check, preview 9: warm-lit bark has a leaf-like hue, so it was re-rendered and
            # flickered). Bark = not sky, not leaf, away from the leaves by 3 px.
            notsky = (af[..., 0] - af[..., 2]) < 30
            self.bark = cv2.GaussianBlur((notsky & ~(cv2.dilate(leaf0.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0)).astype(np.float32), (0, 0), 1.0)
            self.matte *= 1 - self.bark
            lapm = lambda im, mm: float(cv2.Laplacian(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), cv2.CV_32F)[mm].var())
            self.leaf_sharp = lapm(anchor, leaf0 & m)
            self.sat0 = float(hsv0[..., 1][leaf0 & m].mean())
            # the still's sky level near every pixel (normalised blur over sky pixels only): rendered sky seen in the gaps
            # is never allowed to be brighter than this (viewer check, preview 8: pale halo round leaf clumps, cyan specks)
            g0 = cv2.cvtColor(anchor, cv2.COLOR_BGR2GRAY).astype(np.float32); sky0 = ((af[..., 0] - af[..., 2]) > 30).astype(np.float32)
            self.skyL = cv2.GaussianBlur(g0 * sky0, (0, 0), 14) / np.maximum(cv2.GaussianBlur(sky0, (0, 0), 14), 1e-3)
            self.skyC = np.stack([cv2.GaussianBlur(af[..., c] * sky0, (0, 0), 14) / np.maximum(cv2.GaussianBlur(sky0, (0, 0), 14), 1e-3) for c in range(3)], -1)
            for clip in self.st.base:                       # hold leaf saturation at the picture's level on every frame
                for i in range(len(clip)):
                    h_ = cv2.cvtColor(clip[i], cv2.COLOR_BGR2HSV).astype(np.float32)
                    lf = (h_[..., 0] > 15) & (h_[..., 0] < 95) & (h_[..., 1] > 50) & m
                    if lf.sum() > 50:
                        h_[..., 1] = np.clip(h_[..., 1] * self.sat0 / max(float(h_[..., 1][lf].mean()), 1.), 0, 255)
                        im = cv2.cvtColor(h_.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
                        r_ = np.sqrt(self.leaf_sharp / max(lapm(im.astype(np.uint8), lf), 1.))        # leaves as crisp as the still's leaves
                        if r_ > 1.03: im += min(r_ - 1, .6) * 1.35 * (im - cv2.GaussianBlur(im, (0, 0), 1.0))
                        clip[i] = np.clip(im + .5, 0, 255).astype(np.uint8)
        if matte == 'coat':
            fig = cv2.imread(S + 'mask_figure.png', 0).astype(np.float32)[self.sl] / 255
            below = (yy[self.sl] > 536) & ((yy[self.sl] < 650) | (xx[self.sl] < 268))
            # the still coat (with its rim light) must be fully covered by the clip, or its outline shows as a thin
            # pale line when the rendered coat swings away from it
            self.matte = cv2.dilate(((fig > .08) & below).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32) * (yy[self.sl] > 532)
            self.dark = float(np.percentile((af @ np.array([.114, .587, .299], np.float32))[(fig > .5) & below], 97)) + 6
        self.mask = np.zeros((H, W), bool); self.mask[self.sl] = paste[self.sl] > .01
        self.name = name; self.a_full = paste
    def apply(self, out, j):
        f = self.st.frame(j).astype(np.float32)
        a = self.a
        if self.kind == 'leaf':
            h_ = cv2.cvtColor(self.st.frame(j), cv2.COLOR_BGR2HSV)
            lf = ((h_[..., 0] > 15) & (h_[..., 0] < 95) & (h_[..., 1] > 55) & (f[..., 1] >= f[..., 0] - 5)).astype(np.float32)
            lf *= 1 - self.bark * (h_[..., 0] < 30)                                                       # brownish 'leaf' over still bark is bark
            lf = cv2.GaussianBlur(cv2.erode(lf, np.ones((2, 2), np.uint8)), (0, 0), .8)[..., None]        # rendered leaves, 1 px in, feathered
            g = f @ np.array([.114, .587, .299], np.float32)
            over = np.clip((g - self.skyL - 2) / 6., 0, 1)[..., None]                                    # sky-like pixels brighter than the still's sky
            gap = f * (1 - over) + self.skyC * over                                                      # -> the still's local sky colour
            f = f * lf + gap * (1 - lf)
            a = a * cv2.GaussianBlur(np.maximum(lf[..., 0], self.matte), (0, 0), 1.0)[..., None]
            a = a * (1 - self.bark)[..., None]      # the still's bark always wins (preview 10: greenish rendered bark still passed as leaf)
        elif self.matte is not None:
            # cloth only: where the frame shows coat (dark olive, like the still coat) or where the still coat is.
            # Everything else in the paste area (lake, hills, rock, boots) stays the picture's own pixels, so the
            # background cannot shimmer and model specks beside the coat are dropped.
            g = f @ np.array([.114, .587, .299], np.float32)
            cloth = cv2.GaussianBlur(((g < self.dark) & (f[..., 0] < f[..., 1] + 14)).astype(np.float32), (0, 0), 1.2)
            cloth = np.maximum(cv2.morphologyEx((cloth > .5).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)).astype(np.float32), self.matte) 
            a = a * cv2.GaussianBlur(cloth, (0, 0), 1.0)[..., None]
        out[self.sl] = out[self.sl] * (1 - a) + f * a

def coat_paste():   # outer limit only; the per-frame cloth matte is made in ClipLayer(matte=True)
    """Where the rendered coat may replace the picture: around the coat below the belt, wide enough for the hem's
    travel; never the body above the belt."""
    fig = cv2.imread(S + 'mask_figure.png', 0).astype(np.float32) / 255
    m = cv2.dilate(((fig > .2) & (yy > 540) & (yy < 662)).astype(np.uint8), np.ones((41, 41), np.uint8)).astype(np.float32)
    m *= smooth((yy - 528) / 14.) * (1 - smooth((yy - 676) / 14.))
    return cv2.GaussianBlur(m, (0, 0), 5)

def tree_paste(box):
    """Leaves and twig ends of the big tree inside one crop: the dilated leaf area, fading at the crop's edges,
    never the trunk polygon, never near the moon. Limbs, sky and clouds outside it stay the picture's own."""
    x0, y0, x1, y1 = box
    hsv = cv2.cvtColor(PLATE, cv2.COLOR_BGR2HSV).astype(np.float32); b_, g_ = Pf[..., 0], Pf[..., 1]
    leafy = (hsv[..., 0] > 15) & (hsv[..., 0] < 95) & (hsv[..., 1] > 70) & (g_ >= b_ - 5) & M('tree_guard')
    m = cv2.GaussianBlur(cv2.dilate(leafy.astype(np.uint8), np.ones((17, 17), np.uint8)).astype(np.float32), (0, 0), 4)
    trunk = np.zeros((H, W), np.uint8)
    cv2.fillPoly(trunk, [np.array([(0,330),(40,290),(95,235),(150,215),(190,250),(160,330),(125,430),(105,560),(115,680),(0,700)], np.int32)], 255)
    m *= 1 - cv2.GaussianBlur((trunk > 0).astype(np.float32), (0, 0), 4)
    m *= smooth((np.hypot(xx - 557, yy - 186) - 34) / 16.)
    m *= (smooth((xx - x0) / 14.) if x0 > 0 else 1.) * smooth((x1 - xx) / 14.) * smooth((y1 - yy) / 14.) * ((xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1))
    return m.astype(np.float32)

def water_paste(box, only=None):
    x0, y0, x1, y1 = box
    d = cv2.distanceTransform(lake.astype(np.uint8), cv2.DIST_L2, 5)
    a = smooth(d / 8.) * (smooth((xx - x0) / 60.) if x0 > 340 else 1.) * (smooth((x1 - xx) / 60.) if x1 < W else 1.) * smooth((y1 - yy) / 12.)
    a = a * ((xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1))
    if only is not None:                                   # use only [lo, hi) of a wide crop, feathered 60 px into its neighbour
        lo, hi = only; a = a * (smooth((xx - lo) / 60.) if lo > 340 else 1.) * (smooth((hi - xx) / 60.) if hi < W else 1.)
    return a.astype(np.float32)

def build(T, force=None):
    cr = json.load(open(INP + 'crops.json'))['crops']; bx = lambda n: cr[n]['box']
    # lake ends: full-width crops rendered at 1.0, so their ripples are the same size as the centre's (the 2x and 1.5x
    # end crops gave ripples half the size once scaled back, and the ends looked calm)
    WL = ['c5_waterL_1', 'c5_waterL_2', 'c5_waterL_3']; WR = ['c5_waterR_1', 'c5_waterR_2', 'c5_waterR_3']; SL, SR = 8, 5
    # rendered layers, back to front; fixed, different join phases so no two layers join at the same moment
    clips = [ClipLayer('c5_waterL', WL, T, water_paste(bx('c5_waterL'), only=(336, 650)), seed=2, phase=29, lock_mean=True, settle=SL),
             ClipLayer('c5_waterR', WR, T, water_paste(bx('c5_waterR'), only=(1320, 1672)), seed=5, phase=87, lock_mean=True, settle=SR),
             ClipLayer('c5_pocket', ['c5_pocket_1', 'c5_pocket_2'], T, water_paste(bx('c5_pocket'), only=(1566, 1672)), seed=8, phase=101, lock_mean=True, settle=6),
             ClipLayer('c5_water', ['c5_water_1', 'c5_waterc_2', 'c5_waterc_3', 'c5_waterc_4', 'c5_waterc_5'], T, water_paste(bx('c5_water')), seed=3, phase=58, lock_mean=True, settle=9),
             ClipLayer('c5_crown', ['c5_crown_1', 'c5_crown_2', 'c5_crown_3', 'c5_crown_4', 'c5_crown_5'], T, tree_paste(bx('c5_crown')), seed=6, phase=43, settle=6, lock_mean=True, matte='leaf'),
             ClipLayer('c5_branch', ['c5_branchw_1', 'c5_branchw_2', 'c5_branchw_3', 'c5_branchw_4'], T, tree_paste(bx('c5_branch')), seed=7, phase=116, lock_mean=True, matte='leaf'),
             ClipLayer('c5_coat', ['c5_coat_1', 'c5_coat_2', 'c5_coatw_4', 'c5_coat_5', 'c5_coat_6'], T, coat_paste()   # c5_coatw_3 rushes back to its last frame (end steps 2.2x): banned
             , seed=4, phase=0, settle=6, matte='coat')]
    return Stars(T), clips, Meteors(T, force=force), None, None, Fog(T)

def true_joins(st):
    """living.FlfStream.join_steps() also counts the block wrap (frame N) as a join. With a phase offset the wrap
    falls mid-clip, so a normal fast step there was reported as a failed join. Count real joins only."""
    step = lambda t: float(np.abs(st.frame(t).astype(np.int16) - st.frame(t - 1).astype(np.int16)).mean())
    joins = [t for t in range(1, st.N + 1) if st.seq[t % st.N][1] == 0]
    others = [step(t) for t in range(1, st.N, max(1, st.N // 300)) if st.seq[t][1] != 0]
    return max(step(t) for t in joins), float(np.median(others)), float(np.percentile(others, 95))

def frame(j, layers):
    t = j / FPS; out = Pf.copy()
    st, wa, me, tr, co, fo = layers
    # Owner, 18 Nov: warping the tree and the coat is 'wobble', not video - rejected. Tree and Coat stay in this file
    # only as the record of what failed; both must come from true rendered clips joined on identical frames.
    for cl in wa[:4]: cl.apply(out, j)      # water: left, right, pocket, centre
    fo.apply(out, t)
    for cl in wa[4:]: cl.apply(out, j)      # crown, branch, coat
    st.apply(out, t); me.apply(out, t)
    return np.clip(out + .5, 0, 255).astype(np.uint8)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--seconds', type=int, default=24); ap.add_argument('--out'); ap.add_argument('--gate', action='store_true')
    ap.add_argument('--meteors', default='')
    a = ap.parse_args(); T = a.seconds; N = T * FPS
    layers = build(T, force=[float(x) for x in a.meteors.split(',')] if a.meteors else None)
    if a.gate:
        st, wa, me, tr, co, fo = layers
        allowed = cv2.dilate((cv2.dilate(st.mask.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool) | np.any([cl.mask for cl in wa], 0) | (me.region() & sky) | fo.mask).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        base = PLATE.astype(np.int16); moved = np.zeros((H, W), bool); mx = np.zeros((H, W), np.float32)
        f0 = frame(0, layers); step = []
        prev = f0
        for j in range(0, N, 3):
            f = frame(j, layers); d = np.abs(f.astype(np.int16) - base).max(-1)
            moved |= (d > 4) & (d > .05 * base.max(-1)); mx = np.maximum(mx, d)
            step.append(float(np.abs(f.astype(np.int16) - prev.astype(np.int16)).mean())); prev = f
        loop = float(np.abs(frame(N, layers).astype(np.int16) - f0.astype(np.int16)).max())
        res = dict(moving_outside_masks=int((moved & ~allowed).sum()), moving_px=int(moved.sum()),
                   stars=int(st.n - 1), stars_moving_frac=float((moved & st.mask).sum() / max(1, st.mask.sum())),
                   lake_moving_frac=float((moved & lake).sum() / lake.sum()), loop_point_max_diff=loop,
                   meteors=len(me.ev), max_step=max(step[1:]), median_step=float(np.median(step[1:])))
        # visibility: the owner saw "just a still image" in round 2. Motion must show at phone size (640 px wide)
        # within 2 seconds: share of each layer's pixels that change by 6+ levels.
        sm = lambda f: cv2.resize(f, (640, 360), interpolation=cv2.INTER_AREA).astype(np.int16)
        seq = [sm(frame(j, layers)) for j in range(0, 48, 4)]
        rng = (np.max(seq, 0) - np.min(seq, 0)).max(-1)
        small = lambda m: cv2.resize(m.astype(np.uint8), (640, 360), interpolation=cv2.INTER_AREA) > 0
        res['visible_lake_share_phone'] = float((rng[small(lake)] >= 6).mean())
        for cl in wa: res['visible_phone_' + cl.name] = float((rng[small(cl.a_full > .5)] >= 6).mean()); res['join_' + cl.name] = [round(v, 2) for v in true_joins(cl.st)]
        res['visible_star_points_phone'] = int((rng[small(sky)] >= 6).sum())
        print(json.dumps(res, indent=1))
        vis = PLATE // 3; vis[moved & allowed] = (255, 255, 255); vis[moved & ~allowed] = (0, 255, 0)
        cv2.imwrite('/tmp/c5/gate_motion_map.jpg', vis)
    if a.out:
        enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
            '-vf', 'scale=1920:1080:out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int', '-pix_fmt', 'yuv420p',
            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:v', 'libx264', '-crf', '12', '-preset', 'medium', '-tune', 'animation', '-x264-params', 'keyint=infinite:scenecut=0', a.out], stdin=subprocess.PIPE)
        for j in range(N): enc.stdin.write(frame(j, layers).tobytes())
        enc.stdin.close(); enc.wait(); print('wrote', a.out)
