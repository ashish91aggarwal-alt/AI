"""living.py - non-repeating playback of AI-animated layers (a "video texture" engine).

Problem it solves: a 20 s loop is easy to spot; a viewer remembers one flame shape or steam curl.
Each layer has a BANK of short clips (all made from the same still). Playback is a random walk:
play a random stretch of a clip (SEG_MIN..SEG_MAX s), then jump to a frame in ANOTHER clip that
looks most like the current one, joining them with a short optical-flow morph. Layers walk
independently with their own seeds, so the whole picture never repeats in a render.

Exact loop closure: the stream for a render of T source frames is planned for T+M frames and the
first M frames are morphed from stream[T..T+M) into stream[0..M), so frame T == frame 0 and a
render can itself be repeated (e.g. a unique 10-minute block x6 for an hour) with no visible join.

16 fps clips -> 24 fps output with motion-compensated in-betweens (never cross-fades of drawings).
"""
import numpy as np, cv2, random

SRC_FPS, OUT_FPS = 16, 24
M = 10                      # join morph length, source frames (0.6 s)
SEG_MIN, SEG_MAX = 1.6, 4.0  # seconds played from a clip before the next jump


def _u8(a):
    return np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8) if a.dtype != np.uint8 else a


class Flow:
    def __init__(self):
        self.dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
        self.grid = {}

    def _g(self, h, w):
        if (h, w) not in self.grid:
            gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
            self.grid[(h, w)] = (gx, gy)
        return self.grid[(h, w)]

    def blend(self, A, B, t):
        """Frame between A and B at fraction t, by warping both along the optical flow. A, B uint8."""
        if t <= 1e-3:
            return A
        if t >= 1 - 1e-3:
            return B
        h, w = A.shape[:2]; gx, gy = self._g(h, w)
        ga, gb = cv2.cvtColor(A, cv2.COLOR_BGR2GRAY), cv2.cvtColor(B, cv2.COLOR_BGR2GRAY)
        fab = self.dis.calc(ga, gb, None); fba = self.dis.calc(gb, ga, None)
        Af, Bf = A.astype(np.float32), B.astype(np.float32)
        Aw = cv2.remap(Af, gx - t * fab[..., 0], gy - t * fab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        Bw = cv2.remap(Bf, gx - (1 - t) * fba[..., 0], gy - (1 - t) * fba[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        return np.clip(Aw * (1 - t) + Bw * t + 0.5, 0, 255).astype(np.uint8)


class Bank:
    """clips: list of uint8 arrays (n,h,w,3) at SRC_FPS, already colour-matched and cleaned.
    reversible: also play clips backwards (only for things that look the same reversed: glows, flicker)."""
    def __init__(self, name, clips, mask=None, reversible=False, seed=1):
        self.name = name
        self.clips = list(clips) + ([c[::-1].copy() for c in clips] if reversible else [])
        self.src = list(range(len(clips))) + (list(range(len(clips))) if reversible else [])  # same source = no jump
        self.seed = seed
        h, w = self.clips[0].shape[1:3]
        sm = mask if mask is not None else np.ones((h, w), np.float32)
        s = 48 / max(h, w)
        self.feat = []
        for c in self.clips:
            f = np.stack([cv2.resize(cv2.cvtColor(x, cv2.COLOR_BGR2GRAY), None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
                          for x in c]).astype(np.float32)
            mm = cv2.resize(sm, (f.shape[2], f.shape[1]), interpolation=cv2.INTER_AREA)
            self.feat.append(f * mm)

    def dist(self, ca, ia, cb, ib):
        return float(np.abs(self.feat[ca][ia] - self.feat[cb][ib]).mean())

    def plan(self, T, seed=None):
        """Return a list of T+M entries; each entry is (c, i) or (c, i, c2, i2, w) for a morph frame."""
        rnd = random.Random(self.seed if seed is None else seed)
        need = T + M
        out = []
        c = rnd.randrange(len(self.clips)); i = rnd.randrange(0, max(1, len(self.clips[c]) // 3))
        recent = [c]
        while len(out) < need:
            n = len(self.clips[c])
            seg = int(rnd.uniform(SEG_MIN, SEG_MAX) * SRC_FPS)
            seg = max(4, min(seg, n - M - i - 1))
            out += [(c, i + k) for k in range(seg)]
            i += seg
            # jump: compare the frame where the morph starts with candidate frames elsewhere
            best = []
            for c2 in range(len(self.clips)):
                if self.src[c2] == self.src[c] and len(set(self.src)) > 1:
                    continue
                n2 = len(self.clips[c2])
                for i2 in range(0, n2 - M - int(SEG_MIN * SRC_FPS) - 1, 2):
                    d = self.dist(c, i, c2, i2) + (2.0 if c2 in recent[-2:] else 0.0)
                    best.append((d, c2, i2))
            if not best:            # single clip that can't jump: restart it with a morph
                best = [(0, c, 0)]
            best.sort(); d, c2, i2 = rnd.choice(best[:4])
            for k in range(M):
                w = (k + 0.5) / M; w = w * w * (3 - 2 * w)
                out.append((c, i + k, c2, i2 + k, w))
            c, i = c2, i2 + M
            recent.append(c)
        return out[:need]


class Stream:
    """24 fps frames of one layer for a render of `seconds`, exactly looping."""
    def __init__(self, bank, seconds, seed=None):
        self.b = bank; self.fl = Flow()
        self.T = int(round(seconds * SRC_FPS)); self.T -= self.T % 2
        self.N = self.T * OUT_FPS // SRC_FPS
        self.p = bank.plan(self.T, seed)
        self.cache = {}
        self.uses = [(e[0], e[1]) for e in self.p]

    def _entry(self, e):
        if len(e) == 2:
            c, i = e; return self.b.clips[c][i]
        c, i, c2, i2, w = e
        return self.fl.blend(self.b.clips[c][i], self.b.clips[c2][i2], w)

    def src(self, t):
        t %= self.T
        if t in self.cache:
            return self.cache[t]
        if t < M:                                    # loop closure: stream[T+t] -> stream[t]
            w = (t + 0.5) / M; w = w * w * (3 - 2 * w)
            f = self.fl.blend(self._entry(self.p[self.T + t]), self._entry(self.p[t]), w)
        else:
            f = self._entry(self.p[t])
        if len(self.cache) > 6:
            self.cache.pop(next(iter(self.cache)))
        self.cache[t] = f
        return f

    def frame(self, j):
        """Output frame j (24 fps), uint8 crop."""
        j %= self.N
        a, r = divmod(j * SRC_FPS, OUT_FPS)
        A = self.src(a)
        if r == 0:
            return A
        return self.fl.blend(A, self.src(a + 1), r / OUT_FPS)

    def longest_repeat_s(self):
        """Longest stretch of source frames that plays twice in this render (seconds)."""
        seq = [(e[0], e[1]) if len(e) == 2 else None for e in self.p[:self.T]]
        pos = {}
        for t, k in enumerate(seq):
            if k is not None:
                pos.setdefault(k, []).append(t)
        best = 0
        for k, ts in pos.items():
            for a_ in ts:
                for b_ in ts:
                    if b_ > a_:
                        L = 0
                        while b_ + L < self.T and seq[a_ + L] is not None and seq[a_ + L] == seq[b_ + L]:
                            L += 1
                        best = max(best, L)
        return best / SRC_FPS


class FlfStream:
    """Exact joins (owner rule: the last frame of a clip IS the first frame of the next; no blends at joins).
    Every clip was made with first frame = last frame = the picture, so whole clips are chained in random
    order and each join passes through the picture's own frame, once. Small character events are dropped in
    at random intervals between base clips (e.g. cat: base = breathing, events = ear twitch, lick).
    The render length is a whole number of clips, so frame N == frame 0 (exact loop of the block)."""
    def __init__(self, base, anchor, seconds, events=None, event_every=(40, 120), seed=1, settle=3, phase=0, share=None, interp=True):
        rnd = random.Random(seed)
        self.anchor = anchor                       # uint8 crop of the picture
        self.fl = Flow()
        def clean(c):
            """Ends pinned to the picture. The last/first `settle` frames land on it along the optical flow
            (motion-compensated), never by cross-fading two drawings (that doubled the flame tongues)."""
            c = c.copy(); n = len(c)
            if settle < 0:                         # raw: the clips' own ends already are the picture (fire FLF keeps
                return c[:-1]                      # full motion to the last frame; any pinning froze or jumped)
            for k in range(settle):
                w = 1 - (k + 1) / (settle + 1)
                for idx in (k, n - 1 - k):
                    c[idx] = self.fl.blend(c[idx], anchor, w) if w > 0 else c[idx]
            c[0] = anchor; c[-1] = anchor
            return c[:-1]                          # drop the duplicate anchor at the end
        def to24(c, interp=interp):      # 96 source frames + the anchor (next clip's first frame) -> exactly 144 output frames
            out = []
            nxt = list(c) + [anchor]
            for j in range(len(c) * OUT_FPS // SRC_FPS):
                a, r = divmod(j * SRC_FPS, OUT_FPS)
                if not interp:            # review v8: flow in-betweens of a fast ear fold showed the head through the
                    out.append(nxt[a] if r * 2 < OUT_FPS else nxt[a + 1]); continue   # ear; nearest frame instead
                out.append(nxt[a] if r == 0 else self.fl.blend(nxt[a], nxt[a + 1], r / OUT_FPS))
            return np.stack(out)
        if share is not None:                  # a second walk over the same prepared clips (no extra memory)
            self.base, self.events = share.base, share.events
        else:
            # interp='events_nearest': smooth flow in-betweens for the slow base clips (review v11: nearest frames
            # juddered every third frame), nearest frames only for fast events (flow doubled the ear fold)
            self.base = [to24(clean(c), interp=bool(interp)) for c in base]           # cached 24 fps clips
            self.events = [to24(clean(c), interp=(interp is True)) for c in (events or [])]
        target = int(round(seconds * OUT_FPS))
        seq, last, t, next_ev = [], None, 0, rnd.uniform(*event_every) * OUT_FPS
        while t < target:
            if self.events and t >= next_ev:
                choice = ("e", rnd.randrange(len(self.events))); next_ev = t + rnd.uniform(*event_every) * OUT_FPS
            else:
                opts = [b for b in range(len(self.base)) if ("b", b) != last] or [0]
                choice = ("b", rnd.choice(opts))
            clip = (self.base if choice[0] == "b" else self.events)[choice[1]]
            seq += [(choice, i) for i in range(len(clip))]
            t += len(clip); last = choice
        # rotate the circular plan so this layer's joins never line up with other layers' joins at the block start
        # (the 10-min check found every layer passing through the picture at once at the loop point)
        off = phase % len(seq)                 # fixed per-layer phase: joins of different layers never coincide
        self.seq = seq[off:] + seq[:off]    # output-frame plan: (clip, index) -> no per-frame flow at render time
        self.N = len(seq)
        self.T = self.N * SRC_FPS // OUT_FPS

    def frame(self, j):
        (kind, c), i = self.seq[j % self.N]
        return (self.base if kind == "b" else self.events)[c][i]

    def src(self, t):                       # source-rate view (for checks)
        return self.frame(t * OUT_FPS // SRC_FPS)

    def join_steps(self):
        """Frame-to-frame change at every join vs normal steps (gate: joins must look like any other step)."""
        joins = [t for t in range(1, self.N) if self.seq[t][1] == 0] + [self.N]
        step = lambda t: float(np.abs(self.frame(t).astype(np.int16) - self.frame(t - 1).astype(np.int16)).mean())
        js = [step(t) for t in joins]
        others = [step(t) for t in range(1, self.N, max(1, self.N // 300)) if self.seq[t][1] != 0]
        near = [step(t + k) for t in joins[:-1] for k in (-2, -1, 1, 2) if 0 < t + k < self.N]
        # 4th value: the slowest step next to a join (review v7: the fire froze for 2-3 frames at every join)
        return max(js), float(np.median(others)), float(np.percentile(others, 95)), float(np.percentile(near, 10))


def match_sharpness(clips, anchor, mask, sigma=1.0):
    """Model frames are softer than the picture; passing through the picture at every join would flash crisp.
    Sharpen each frame (unsharp mask) so its detail energy inside `mask` equals the picture's."""
    m = mask > 0.5
    def var(f):
        return float(cv2.Laplacian(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), cv2.CV_32F)[m].var())
    target = var(anchor)
    out = []
    for c in clips:
        cc = np.empty_like(c)
        for i, f in enumerate(c):
            r = np.sqrt(target / max(var(f), 1.0))
            ff = f.astype(np.float32)
            cc[i] = np.clip(ff + (r - 1) * 1.35 * (ff - cv2.GaussianBlur(ff, (0, 0), sigma)) + .5, 0, 255).astype(np.uint8)
        out.append(cc)
    return out
