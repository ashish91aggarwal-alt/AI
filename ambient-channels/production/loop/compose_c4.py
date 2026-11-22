"""c4 (owner's cat cabin) compositor: AI-animated crops pasted back ONLY inside reviewed masks.

Layers (see scenes/c4_inventory_reviewer.md for the inventory they come from):
  fire (+coals)       I2V crop c4_fire      mask scenes/c4_mask_fire.png
  lantern             I2V crop c4_mantel    mask = lantern blob of scenes/c4_mask_mantel.png
  mantel candle       the picture's own teardrop flame, flickered in code (the model stretched it into a needle)
  shelf candle        I2V crop c4_shelf     mask scenes/c4_mask_shelf.png
  snow in the panes   I2V crop c4_window    mask scenes/c4_mask_window_v2.png (pane polygons minus things in front)
  cocoa steam         I2V crop c4_mug       mask scenes/c4_mask_steam.png (stops before the lampshade)
  firelight on room   driven by the fire layer's own brightness, falloff from the hearth, never on the glass
  candle/lantern spill driven by their own layers' brightness, small radius
  table lamp          electric: 1.5 % slow breath only
  cat                 breathing on the flank only (head excluded), 5 s per breath

AI clips are 16 fps; they are taken to 24 fps with motion-compensated in-betweens (optical flow),
never by cross-fading neighbouring drawings (that made the flames look doubled, G2 review D1).

Every layer loops exactly within LOOP seconds (several AI clips chained with crossfades), so the
LOOP-second master repeats with no jump.

Usage:
  python3 compose_c4.py --clips DIR --render out.mp4          # one LOOP master
  python3 compose_c4.py --clips DIR --gate gate_dir           # motion map, liveness, seam, strips
"""
import argparse, glob, json, math, os, subprocess, sys
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
SC = os.path.join(HERE, "scenes")
CROPS = json.load(open(os.path.join(HERE, "../gpu/session2/inputs_c4/crops.json")))["crops"]
FPS, SRC_FPS, LOOP = 24, 16, 20.0
SKIP = 8
# clips rejected on review (camera drift): c4_mantel_2 (1.9 px), c4_mug_1 (0.75 px)
CHOOSE = {"c4_cat": ["c4_cat_breathe_1", "c4_cat_squeeze_1", "c4_cat_lick_1"],
          "c4_fire": ["c4_fire_1", "c4_fire_2", "c4_fire_3", "c4_fire_4", "c4_fire_flf_1"], "c4_window": ["c4_window_1", "c4_window_2"],
          "c4_mug": ["c4_mug_2", "c4_mug_3"], "c4_mantel": ["c4_mantel_1"], "c4_shelf": ["c4_shelf_1", "c4_shelf_2"]}
# cat clips that pass the S3 phone-size gate (clip_motion.py, face box 60,100,330,340; >= 1.5 phone px, 19 Nov).
# Older ear/whisker/squeeze clips moved < 1 px at phone size (invisible); whiskers are too thin in this art to show.
CAT_USE = {"c4_cat_deepbreath_3", "c4_cat_deepbreath_4", "c4_cat_breathe_2",   # deepbreath_1: 5 head twitches per clip
           "c4_cat_earflick_1", "c4_cat_face_2", "c4_cat_lick_2",
           "c4_cat_earquick_2", "c4_cat_earquick_3", "c4_cat_earquick_6"}   # owner 19 Nov: quicker flicks too
# breathe_1: a blue-grey smudge on the sofa above the back (review v11, blue-red blob test 58 vs <20 others).
# earquick_1 ear back drawn see-through, earquick_4 a white curl above the ear (blooper), earquick_5 too small
# review v8: earflick_3 flaps 4x in 2 s; earflick_2 draws the turned ear's back with the head stripes running through
# it (reads as see-through). earflick_1 folds the ear back solid.
BANNED = {"c4_cat_knead_1",     # owner: paw movement = AI blooper
          "c4_shelf_flf_2", "c4_shelf_flf_4",   # flame barely moves (clip_motion < 1 phone px)
          "c4_cat_earonly_1"}   # G2 final: face stripes fade, face goes pale (AI redraw)
PHASE = {"c4_fire": 0, "c4_window": 29, "c4_mug": 58, "c4_cat": 87, "c4_window_b": 116}   # joins never coincide
FLAMES = {  # small flames animated in code from the picture's own flame (the model distorted / repeated them)
    "candle": dict(cx=396, base=174, box=(376, 128, 418, 178), h=22, half=9, seeds=(1, 2, 3)),
    "shelf": dict(cx=971, base=408, box=(956, 376, 988, 410), h=16, half=6, seeds=(4, 5, 6)),
}
LANTERN = dict(box=(438, 176, 528, 240), split=482)   # lantern glow behind the lattice: brightness only, two halves
MASK = {"cat": "c4_mask_cat.png", "fire": "c4_mask_fire.png", "mantel": "c4_mask_mantel.png", "shelf": "c4_mask_shelf.png",
        "window": "c4_mask_window_v2.png", "steam": "c4_mask_steam.png"}
TAU = 2 * math.pi


def load_clip(d, box, scale):
    fs = sorted(glob.glob(os.path.join(d, "*.png")))
    x0, y0, x1, y1 = box
    out = [cv2.resize(cv2.imread(f), (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA) for f in fs]
    return np.stack(out).astype(np.float32) / 255


def chain_loop(clips, n_out):
    """Chain clips c1..ck (each starts on the same still) into a loop of exactly n_out source frames.
    Crossfade length C is chosen so that sum(len) - k*C == n_out."""
    if len(clips) == 1:                      # one usable clip: play it forward then backward (flicker reads the same)
        clips = [clips[0], clips[0][::-1].copy()]
    k = len(clips); tot = sum(len(c) for c in clips)
    C = (tot - n_out) / k
    if C < 8:
        raise ValueError(f"clips too short for {n_out} frames (crossfade {C:.1f})")
    C = int(round(C))
    seq = []
    for i, c in enumerate(clips):
        nxt = clips[(i + 1) % k]
        body = c[C:len(c) - C] if i else c[C:len(c) - C]
        seq.append(body)
        w = ((np.arange(C) + 0.5) / C)[:, None, None, None]
        seq.append(c[len(c) - C:] * (1 - w) + nxt[:C] * w)
    out = np.concatenate(seq)
    # exact length: trim/pad by at most a few frames inside the first body (invisible)
    d = len(out) - n_out
    if d > 0:
        out = np.concatenate([out[:1], out[1 + d:]])
    elif d < 0:
        out = np.concatenate([out[:1].repeat(-d + 1, 0), out[1:]])
    return out


def to24(seq):
    """16 fps loop -> 24 fps loop with optical-flow in-betweens. seq: (n,h,w,3) float32 0..1, n even. Returns uint8."""
    n = len(seq); n24 = n * 3 // 2
    out = np.empty((n24,) + seq.shape[1:], np.uint8)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    h, w = seq.shape[1:3]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    u8 = lambda a: np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8)
    for j in range(n24):
        a, r = divmod(2 * j, 3)
        A = seq[a]
        if r == 0:
            out[j] = u8(A); continue
        t = r / 3; B = seq[(a + 1) % n]
        ga, gb = cv2.cvtColor(u8(A), cv2.COLOR_BGR2GRAY), cv2.cvtColor(u8(B), cv2.COLOR_BGR2GRAY)
        fab = dis.calc(ga, gb, None); fba = dis.calc(gb, ga, None)
        Aw = cv2.remap(A, gx - t * fab[..., 0], gy - t * fab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        Bw = cv2.remap(B, gx - (1 - t) * fba[..., 0], gy - (1 - t) * fba[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        out[j] = u8(Aw * (1 - t) + Bw * t)
    return out


def loop_noise(n_frames, cycles, seed):
    """Smooth noise that repeats exactly every n_frames: sum of sines with whole cycles per loop, std 1."""
    rng = np.random.default_rng(seed); t = np.arange(n_frames) / n_frames
    v = sum(np.sin(TAU * c * t + rng.uniform(0, TAU)) / (1 + 0.04 * c) for c in cycles)
    return (v - v.mean()) / v.std()


def soft(m, sigma):
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), sigma)


def color_match(clip, plate_crop, mask):
    """Remove the AI clip's small colour/brightness shift, measured on the still parts."""
    still = (mask < 0.05)
    if still.sum() < 200:
        return clip
    ref = plate_crop[still].mean(0)
    for i in range(len(clip)):
        cur = clip[i][still].mean(0)
        clip[i] = clip[i] * (ref / np.maximum(cur, 1e-3))
    return clip


SHELF_FLAME = (slice(380 - 336, 410 - 336), slice(958 - 904, 986 - 904))   # flame box inside the shelf crop
STEAM_X_MAX, STEAM_Y_MAX = 1550, 568          # steam stays left of the lampshade corner and above the marshmallows
CANDLE = dict(cx=396, base=174, box=(376, 128, 418, 178))   # mantel candle flame (tip y~152, base y~174)
CANDLE_FLAME = (slice(120 - 88, 177 - 88), slice(378 - 332, 416 - 332))   # flame box inside the c4_candle crop


def blob_mask(path, x, y):
    m = cv2.imread(os.path.join(SC, path), 0)
    n, lab = cv2.connectedComponents((m > 2).astype(np.uint8))
    return (m.astype(np.float32) / 255) * (lab == lab[y, x])


def make_steam(seq, P, box, bg=None):
    """Steam on the UNTOUCHED picture: only the moving wisps are added (G2 review D2/D4).
    The picture's own painted wisp is swapped for the clip's background, inside a soft organic shape."""
    x0, y0, x1, y1 = box; h, w = P.shape[:2]
    X = np.arange(w, dtype=np.float32)[None, :] + x0; Y = np.arange(h, dtype=np.float32)[:, None] + y0
    lum = lambda a: a.mean(-1)
    if bg is None:
        bg = np.percentile(seq, 20, axis=0).astype(np.float32)
    area = ((X >= 1455) & (X <= 1570) & (Y >= 430) & (Y <= 570)).astype(np.float32)
    ps = np.clip((lum(P) - lum(bg) - 0.03) / 0.05, 0, 1) * area
    ps = np.clip(soft(cv2.dilate(ps, np.ones((7, 7), np.uint8)), 3), 0, 1)
    ring = (ps < 0.02) & (area > 0)
    bgm = bg * (P[ring].mean(0) / np.maximum(bg[ring].mean(0), 1e-3))
    base = P * (1 - ps[..., None]) + bgm * ps[..., None]
    R = soft(((X <= STEAM_X_MAX - 6) & (Y <= STEAM_Y_MAX - 6)).astype(np.float32), 4)
    R *= cv2.imread(os.path.join(SC, "c4_mask_steam.png"), 0)[y0:y1, x0:x1].astype(np.float32) / 255
    out = np.empty_like(seq)
    for i in range(len(seq)):
        lift = np.maximum(seq[i] - bg, 0)
        g = cv2.GaussianBlur(lum(lift), (0, 0), 1.5)
        wv = np.clip((g - 0.02) / 0.05, 0, 1)
        n, lab, st, _ = cv2.connectedComponentsWithStats((wv > 0.2).astype(np.uint8))
        small = np.isin(lab, [k for k in range(1, n) if st[k, cv2.CC_STAT_AREA] < 320])
        wv[cv2.dilate(small.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0] = 0      # floating specks
        out[i] = base + lift * (wv * R)[..., None]
    return out


_CYC_RNG = np.random.default_rng(20261118)


def cycles(hz_list, seconds):
    """Whole cycles per block for loop_noise. Spread each frequency randomly by +-15 % so the components share
    no common rhythm (G2 r3: primes next to multiples of 30 still near-repeated every 20 s)."""
    out = []
    for h in hz_list:
        c = max(2, int(round(h * seconds * _CYC_RNG.uniform(0.85, 1.15))))
        while c in out:
            c += 1
        out.append(c)
    return tuple(out)


def prime_near(n):
    """Cycle counts for loop_noise must share no common factor, or the sum repeats early
    (G2 round 2: all multiples of 30 -> lamp and flames repeated every 20 s)."""
    n = max(2, int(round(n)))
    def isp(k):
        return k > 1 and all(k % d for d in range(2, int(k ** 0.5) + 1))
    for d in range(0, 1000):
        for k in (n + d, n - d):
            if isp(k):
                return k
    return n


def fix_tail(cc, m, land=12):
    """FLF clips often freeze for the last 3-5 frames, then the model redraws logs/grate in one frame
    (G2 round 2: 66 of 99 fire joins). Cut the frozen tail, land on the clip's own last frame along the
    optical flow over `land` frames (smoothstep), then retime to the original length."""
    import living
    n = len(cc); mm = m > 0.5
    st = np.array([np.abs(cc[i + 1] - cc[i])[mm].mean() for i in range(n - 1)])
    med = np.median(st)
    k = n - 2
    while k > n // 2 and st[k] < 0.35 * med:
        k -= 1
    if n - 2 - k < 2 and st[-1] < 3 * med:
        return cc
    fl = living.Flow()
    u8 = lambda a: np.clip(a * 255 + .5, 0, 255).astype(np.uint8)
    end = u8(cc[-1]); kept = [u8(f) for f in cc[:k]]
    for j in range(1, land + 1):
        w = j / land; w = w * w * (3 - 2 * w)
        kept.append(fl.blend(kept[k - 1] if j == 1 else kept[-1], end, w) if j < land else end)
    pos = np.linspace(0, len(kept) - 1, n)
    out = []
    for p in pos:
        a = int(p); t = p - a
        out.append(kept[a] if t < 1e-3 or a + 1 >= len(kept) else fl.blend(kept[a], kept[a + 1], t))
    return np.stack(out).astype(np.float32) / 255


def local_colour_lock(cc, P, mask, sigma=10):
    return local_stats_lock(cc, P, mask, sigma)


def local_stats_lock(cc, P, mask, sigma=10):
    """Local mean AND local contrast per channel inside `mask` locked to the picture (blurred statistics).
    G2 r3: a mean-only lock let the white fur highlights go grey inside each clip."""
    mb = mask.astype(np.float32); m3 = mb[..., None]
    B = lambda x: cv2.GaussianBlur(x, (0, 0), sigma)
    w = B(mb)[..., None] + 1e-4
    muP = B(P * m3) / w; sdP = np.sqrt(np.maximum(B(P * P * m3) / w - muP ** 2, 1e-6))
    for i in range(len(cc)):
        f = cc[i]
        muF = B(f * m3) / w; sdF = np.sqrt(np.maximum(B(f * f * m3) / w - muF ** 2, 1e-6))
        r = np.clip(sdP / sdF, 0.7, 1.4)
        g = (f - muF) * r + muP
        cc[i] = f * (1 - m3) + g * m3
    return cc


def _old_local_colour_lock(cc, P, mask, sigma=10):
    """Lock low-frequency colour inside `mask` to the picture (blurred gain map); detail and motion stay.
    G2 round 2: a single body-mean gain could not hold the white face, which drifted grey."""
    mb = mask.astype(np.float32)
    num = cv2.GaussianBlur(P * mb[..., None], (0, 0), sigma)
    wts = cv2.GaussianBlur(mb, (0, 0), sigma)[..., None] + 1e-4
    Pm = num / wts
    for i in range(len(cc)):
        Fm = cv2.GaussianBlur(cc[i] * mb[..., None], (0, 0), sigma) / wts
        g = np.clip(Pm / np.maximum(Fm, 1e-3), 0.75, 1.33)
        cc[i] = cc[i] * (1 + (g - 1) * mb[..., None])
    return cc


def glass_colour_lock(cc, P, glass, smooth=9):
    """Per channel: mean and 97th percentile of the glass match the picture; the gains are smoothed over time
    (G2 r2: snow went teal then snapped back; G2 r3: unsmoothed per-frame gains made one one-frame jump)."""
    n = len(cc); A = np.zeros((n, 3)); FM = np.zeros((n, 3))
    pm = np.array([P[..., ch][glass].mean() for ch in range(3)]); p97 = np.array([np.percentile(P[..., ch][glass], 97) for ch in range(3)])
    for i in range(n):
        for ch in range(3):
            f = cc[i][..., ch][glass]
            fm, f97 = f.mean(), np.percentile(f, 97)
            A[i, ch] = np.clip((p97[ch] - pm[ch]) / max(f97 - fm, 1e-3), 0.7, 1.4); FM[i, ch] = fm
    k = np.ones(smooth) / smooth
    sm = lambda x: np.stack([np.convolve(np.pad(x[:, ch], smooth // 2, mode="edge"), k, "valid") for ch in range(3)], 1)
    A, FM = sm(A), sm(FM)
    for i in range(n):
        cc[i] = (cc[i] - FM[i]) * A[i] + pm
    return cc


def steady_sky(seq, P, sigma=25):
    """The snow clips brighten and dim the whole sky/moon every few seconds (G2-lights point 4).
    Remove slow, large-scale brightness changes; keep the flakes."""
    out = np.empty_like(seq)
    h, w = P.shape[:2]
    if not hasattr(steady_sky, "glass") or steady_sky.glass.shape != (h, w):
        g = cv2.imread(os.path.join(SC, "c4_mask_window_v2.png"), 0)
        x0, y0, x1, y1 = CROPS["c4_window"]["box"]
        steady_sky.glass = g[y0:y1, x0:x1] > 200
    gl = steady_sky.glass
    ref = np.median(P.mean(2)[gl])
    for i, f in enumerate(seq):
        d = cv2.GaussianBlur(f - P, (0, 0), sigma)
        f2 = f - d
        out[i] = f2 * (ref / max(float(np.median(f2.mean(2)[gl])), 1e-4))   # every frame: the picture's sky level
    return out


def tint_sparks(seq, P, box):
    """Pale cream sparks above the flames -> ember orange, so they can't read as snow or ash (D1)."""
    x0, y0, x1, y1 = box
    sx0, sy0, sx1, sy1 = 320 - x0, 438 - y0, 430 - x0, 510 - y0
    sub = seq[:, sy0:sy1, sx0:sx1]
    v = sub.max(-1); sat = (v - sub.min(-1)) / np.maximum(v, 1e-3)
    moved = np.abs(sub - P[sy0:sy1, sx0:sx1]).mean(-1)
    wgt = np.clip((v - 0.55) / 0.15, 0, 1) * np.clip((0.45 - sat) / 0.15, 0, 1) * np.clip((moved - 0.06) / 0.06, 0, 1)
    ember = v[..., None] * np.array([0.25, 0.6, 1.0], np.float32)
    seq[:, sy0:sy1, sx0:sx1] = sub * (1 - wgt[..., None]) + ember * wgt[..., None]
    return seq


def glass_v3(c, gg, lamp_box=(497, 295, 630, 425)):
    """Per-pixel glass for the window box. c: BGR uint8 crop, gg: rough pane mask (0-1).
    glass = window-scene pixels (blue night scene, its dark trees and the moon) inside the panes' neighbourhood,
    minus everything in front of the glass (frames, lamp, finial, their dark outlines) and minus the snow piled
    on the bars. Returns (glass 0-1 soft, pile bool, fg bool)."""
    hsv = cv2.cvtColor(c, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, sa, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    H, W = v.shape
    # where to look for glass: inside the hand-drawn pane polygons (they leave out the moonlit bevels on the frames'
    # inner edges, which are blue-grey like the sky), and freely around the lamp, whose polygon was rough
    lb = np.zeros((H, W), bool); lx0, ly0, lx1, ly1 = lamp_box; lb[ly0:ly1, lx0:lx1] = True
    near = (gg > 0.5) | (lb & (cv2.dilate(
        (gg > 0.5).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))) > 0))
    blue = (h >= 92) & (h <= 135) & (sa >= 35)
    inner = cv2.erode((gg > 0.5).astype(np.uint8), np.ones((7, 7), np.uint8), borderType=cv2.BORDER_CONSTANT, borderValue=0) > 0   # well inside a pane
    # warm = wood, brass, shade, throw. Inside a pane only clearly lit warm pixels count (a pane in deep shade is
    # dim and brownish); near pane edges and outside panes even dark wood counts.
    woodish = ((h <= 12) | (h >= 170)) & (sa >= 120) & (v >= 15)      # dark red-brown wood (saturated)
    deep = cv2.erode((gg > 0.5).astype(np.uint8), np.ones((13, 13), np.uint8), borderType=cv2.BORDER_CONSTANT, borderValue=0) > 0   # > 6 px inside a pane
    warm = (~blue) & (sa >= 35) & ((v >= 45) | ((v >= 8) & ~inner & ~lb) | ((lb | ~deep) & woodish))
    # (dark red-brown wood the polygons took in at pane edges; deep inside a shaded pane it is glass)
    pale_scene = (sa < 35) & (v >= 45) & (h >= 85) & (h <= 140)       # moon, pale snow highlights
    dark = v < 30
    rim = np.where(lb, cv2.dilate(warm.astype(np.uint8), np.ones((3, 3), np.uint8)),
                   cv2.dilate(warm.astype(np.uint8), np.ones((5, 5), np.uint8))) > 0
    outline = dark & rim                                                 # dark rim on objects (1 px at the lamp)
    shade_pane = inner & (sa >= 35) & (v < 45)                          # dim brownish pane in shade: still glass
    scene = blue | pale_scene | (dark & ~outline) | shade_pane | (lb & ~warm & ~outline)  # near the lamp: all unlit
    scene &= ~((~deep) & (v < 12) & ~lb)        # near-black at a pane's edge is the frame's shadow line, not sky
    fg = ~scene
    # tiny warm specks inside the night scene (orange-ish compression noise) are not objects
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg.astype(np.uint8), 8)
    fg = np.isin(lab, [k for k in range(1, n) if st[k, cv2.CC_STAT_AREA] >= 25])
    # piles: per column above every bar, up to the pile's sharp top edge (see LESSONS)
    lampobj = (~blue) & (v >= 120) & lb                                    # the lit shade and finial
    lampobj = cv2.dilate(lampobj.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    wood = (fg & ~lampobj).astype(np.uint8)                               # piles sit on window bars, not on the lamp
    cand = np.zeros((H, W), np.uint8); base = np.full((H, W), -1, np.int32)
    for x in range(W):
        cw = wood[:, x] > 0
        for yb in [y for y in range(27, H) if cw[y] and not cw[y - 1] and cw[y:y + 3].all()]:
            s0 = yb - 1
            while s0 > yb - 5 and v[s0, x] < 60:
                s0 -= 1
            for y in range(s0, max(3, s0 - 16), -1):
                if blue[y, x] and v[y, x] > 120 and v[y, x] - v[y - 3, x] > 20:
                    cand[y, x] = 1; base[y, x] = yb
    n, lab, st, _ = cv2.connectedComponentsWithStats(cand, 8)
    keep = np.isin(lab, [k for k in range(1, n) if st[k, cv2.CC_STAT_WIDTH] >= 8])
    # per column and bar: only the LOWEST run of top-edge pixels is the pile's top; snow on a tree standing behind
    # the pile (a second edge higher up) must not be cut (owner 14:26: "some trees still interfere")
    pile = np.zeros((H, W), bool)
    for x in np.unique(np.nonzero(keep)[1]):
        col = np.nonzero(keep[:, x])[0][::-1]                  # bottom to top
        done = set()
        for y in col:
            b = base[y, x]
            if b in done:
                continue
            top = y
            while top - 1 >= 0 and keep[top - 1, x] and base[top - 1, x] == b:
                top -= 1
            pile[top:b, x] = True; done.add(b)
    pile = cv2.morphologyEx(pile.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 5), np.uint8)) > 0
    # the lowest panes behind the sofa: the polygon stopped short there; extend it only over clearly night-blue
    # pixels (the knit throw and the frames are grey or warm)
    low = np.zeros((H, W), bool); low[380:, :] = True
    strict_blue = (h >= 98) & (h <= 125) & (sa >= 70) & (v >= 25)
    near = near | (low & strict_blue & (cv2.dilate((gg > 0.5).astype(np.uint8), np.ones((31, 31), np.uint8)) > 0))
    hard = near & ~fg & ~pile
    # keep only big connected glass regions (drop 1-2 px slivers between objects)
    n, lab, st, _ = cv2.connectedComponentsWithStats(hard.astype(np.uint8), 4)
    hard = np.isin(lab, [k for k in range(1, n) if st[k, cv2.CC_STAT_AREA] >= 40])
    soft = cv2.GaussianBlur(hard.astype(np.float32), (0, 0), 0.5) * hard + 0 * hard
    soft = np.where(hard, np.clip(soft * 1.6, 0, 1), 0)        # edge pixels half-strength, never spill outside
    return soft.astype(np.float32), pile, fg


def near_trees(c, glass, far_cols=(290, 470), moon=(428, 91, 70)):
    """Silhouettes of the near snowy pines behind the glass (left windows and the right window; the moon window
    shows only the far forest). Snow on the branches (big bright blue areas) plus the dark needles between snow
    layers. Far flakes (small) pass behind these; near flakes (big) fall in front."""
    hsv = cv2.cvtColor(c, cv2.COLOR_BGR2HSV).astype(np.float32)
    h, sa, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    H, W = v.shape
    yy, xx = np.mgrid[0:H, 0:W]
    ok = (glass > 0.5) & ~((xx >= far_cols[0]) & (xx < far_cols[1])) & \
        (np.hypot(xx - moon[0], yy - moon[1]) > moon[2])
    snow = (h >= 92) & (h <= 125) & (v >= 105) & (sa >= 60) & ok
    n, lab, st, _ = cv2.connectedComponentsWithStats(snow.astype(np.uint8), 8)
    snow = np.isin(lab, [k for k in range(1, n) if st[k, cv2.CC_STAT_AREA] >= 120])   # not flakes or stars
    tree = cv2.morphologyEx(snow.astype(np.uint8), cv2.MORPH_CLOSE,
                            cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) > 0
    vert = cv2.morphologyEx(tree.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((19, 1), np.uint8)) > 0
    tree = (tree | (vert & (v < 90))) & ok                     # needles between snow layers
    tree = cv2.morphologyEx(tree.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    return cv2.GaussianBlur(tree.astype(np.float32), (0, 0), 0.8) * (glass > 0)


class SnowFall:
    """Falling snow as code particles on the glass only (owner rule allows particles; the FLF snow clips barely
    fell - 14x less motion at phone size). Three depths; every flake wraps a whole number of times per block, so
    the block loops exactly with no joins. The picture's painted flakes on the panes are removed first."""
    LAYERS = [  # (count, radius px, speed px/s, alpha, sway px)
        (320, 1.0, 22, 0.5, 3), (230, 1.6, 38, 0.7, 5), (110, 2.4, 60, 0.9, 8), (30, 3.3, 85, 0.95, 11)]   # phone-size visible

    def __init__(self, plate, seconds, seed=3):
        self.T = seconds
        g = cv2.imread(os.path.join(SC, "c4_mask_window_v2.png"), 0).astype(np.float32) / 255
        ys, xs = np.nonzero(g > 0.5)
        self.box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        x0, y0, x1, y1 = self.box
        yy_, xx_ = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        moon = np.clip((np.sqrt((xx_ - 1534) ** 2 + (yy_ - 91) ** 2) - 24) / 6, 0, 1)
        # owner 20 Nov: "snow is seen crossing the snow collected at the window, and a little over the vertical
        # frames". The pane mask held the painted snow piles on the bars and touched the frame edges: cut both out.
        # owner 20 Nov 14:06: "the lamp tip is a square ... trace the cutout to the thinnest level", and "the far
        # (small) flakes must pass behind the trees, the big near ones in front". Glass is now traced per pixel
        # (glass_v3); small flakes also stay behind the near pines (near_trees).
        c8 = np.clip(plate[y0:y1, x0:x1] * 255, 0, 255).astype(np.uint8)
        gfix = glass_v3(c8, g[y0:y1, x0:x1])[0]
        # flakes now fall in front of the moon too (they are between us and it; white on the white disc just
        # blends) - the old moon cut made flakes pop out at its rim
        self.glass = gfix[..., None]
        self.glass_far = (gfix * (1 - near_trees(c8, gfix)))[..., None]
        # remove the painted flakes on the panes (small bright specks), keep painted snow on branches
        crop = plate[y0:y1, x0:x1]
        lum = crop.mean(2)
        med = cv2.medianBlur((crop * 255).astype(np.uint8), 7).astype(np.float32) / 255
        speck = ((lum - med.mean(2)) > 0.07).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(speck)
        small = np.isin(lab, [k for k in range(1, n) if st[k, cv2.CC_STAT_AREA] <= 30])
        sm = cv2.GaussianBlur(cv2.dilate(small.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 1)[..., None]
        sm = np.clip(sm * 1.5, 0, 1) * (self.glass > 0.5)
        plate[y0:y1, x0:x1] = crop * (1 - sm) + med * sm
        self.H, self.W = y1 - y0, x1 - x0
        rng = np.random.default_rng(seed)
        self.parts = []
        for cnt, r, v, a, sw in self.LAYERS:
            span = self.H + 20
            n_wrap = np.maximum(1, np.round(v * rng.uniform(0.8, 1.2, cnt) * seconds / span))   # whole wraps per block
            self.parts.append(dict(r=r, a=a, x=rng.uniform(-10, self.W + 10, cnt), y=rng.uniform(0, span, cnt),
                                   nw=n_wrap, id=np.arange(cnt) + 1000.0 * len(self.parts),
                                   vy=n_wrap * span / seconds, span=span, sw=sw * rng.uniform(0.5, 1, cnt),
                                   sc=rng.integers(1, 4, cnt) * max(1, int(seconds / 20)), ph=rng.uniform(0, TAU, cnt),
                                   drift=np.round(rng.uniform(-1, 0, cnt) * seconds / 60) * (self.W + 20) / seconds))
        self.sprites = {}
        self.colour = np.array([1.0, 0.97, 0.93], np.float32)     # BGR: white with a cool tint

    def sprite(self, r):
        if r not in self.sprites:
            k = int(np.ceil(r * 3)); yy, xx = np.mgrid[-k:k + 1, -k:k + 1].astype(np.float32)
            self.sprites[r] = np.exp(-(xx ** 2 + yy ** 2) / (2 * (r * 0.75) ** 2)).astype(np.float32)
        return self.sprites[r]

    def alpha(self, t, which=None):
        """which: None = all layers, "far" = the two small (far) layers, "near" = the two big (near) layers."""
        A = np.zeros((self.H, self.W), np.float32)
        for li, p in enumerate(self.parts):
            if which == "far" and li >= 2 or which == "near" and li < 2:
                continue
            s = self.sprite(p["r"]); k = s.shape[0] // 2
            yy = p["y"] + p["vy"] * t
            y = yy % p["span"] - 10
            # owner 19 Nov: "same repeated shadow on the sofa": every flake came back at the same x on each wrap, so the
            # snow (and its shadow) repeated every few seconds. A new x per wrap; wraps per block are whole -> still loops.
            w = np.floor(yy / p["span"]) % p["nw"]
            jump = np.modf(np.sin(p["id"] * 12.9898 + w * 78.233) * 43758.5453)[0] % 1.0 * (self.W + 20)
            x = (p["x"] + jump + p["drift"] * t + p["sw"] * np.sin(TAU * p["sc"] * t / self.T + p["ph"])) % (self.W + 20) - 10
            for xi, yi in zip(x.astype(int), y.astype(int)):
                ya, yb, xa, xb = yi - k, yi + k + 1, xi - k, xi + k + 1
                if ya < 0 or xa < 0 or yb > self.H or xb > self.W:
                    continue
                np.maximum(A[ya:yb, xa:xb], s * p["a"], out=A[ya:yb, xa:xb])
        return A

    def apply(self, out, i):
        x0, y0, x1, y1 = self.box
        t = i / FPS
        a = np.maximum(self.alpha(t, "far")[..., None] * self.glass_far, self.alpha(t, "near")[..., None] * self.glass)
        out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - a) + self.colour * a
        return a


class Lights:
    """Light from each source on the room, with moving shadows (owner: 'check every lit area, where the light
    comes from, and follow the flicker, darkness, shadow pattern').
    The picture is split into smooth shading (log-luminance, blurred) and detail. Per frame and per source:
      - intensity: shading x (1 + gain * k(t) * W_s), k = the source's own brightness (darker moments too);
      - shadows: the shading map is warped about the source - a taller flame throws light further (map scaled
        outward), a flame leaning left moves shadow edges right - so shadow edges move with the flicker;
      - W_s: falloff from the source x warm-lit factor, never on glass, never inside the source's own layer.
    The lamp is electric: no shadow motion, a slow uneven breath (+-3 %) and a faint fast shimmer."""
    SRC = {  # name: (cx, cy, radius, flicker std target at W=1, shadow warp px at 300 px)
        "fire": (380, 620, 380, 0.04, 5.0),        # G2 r3: hearth 7.4 % -> ~8.5 %       # G2 final: bookshelf middle got 7.9 % from the fire
        "candle": (396, 160, 75, 0.09, 2.0),       # owner 19 Nov: "candles barely move and make no difference around;
        "lantern": (470, 195, 95, 0.06, 1.5),      #  candles make the biggest difference in shadows" (was 0.018/0.015/0.016)
        "shelf": (968, 400, 60, 0.15, 1.5),    # books by the shelf candle were 4.4 % at 0.09
        "lamp": (1655, 440, 260, 0.0, 0.0),
    }
    # owner 19 Nov: "most lit areas are not consistent with any light source". The light now lives only where the
    # picture has PAINTED light (brightness above the local shadow floor, warm), shared between sources by distance;
    # painted shadows never change. No shading warp.
    POS = {"fire": (380, 600, 330), "candle": (396, 160, 70), "lantern": (482, 205, 90), "shelf": (971, 395, 60),
           "lamp": (1655, 400, 250)}

    def __init__(self, sc):
        P = sc.plate; H, W = sc.H, sc.W
        self.sc = sc
        lum = P.mean(2)
        warm = np.clip((P[..., 2] - P[..., 0]) / 0.35, 0, 1)
        glass = cv2.imread(os.path.join(SC, "c4_mask_window_v2.png"), 0).astype(np.float32) / 255
        own = np.zeros((H, W), np.float32)
        for f in ("c4_mask_mantel.png", "c4_mask_shelf.png"):    # fire area IS lit now: logs/grate come from the picture
            mm = cv2.imread(os.path.join(SC, f), 0).astype(np.float32) / 255
            if f == "c4_mask_shelf.png":       # the shelf candle's wax is lit by its flame, not part of the layer
                mm *= np.clip((409 - np.arange(H, dtype=np.float32)[:, None]) / 5, 0, 1)
            own = np.maximum(own, mm)
        self.logS = cv2.GaussianBlur(np.log(lum + 0.03), (0, 0), 5).astype(np.float32)
        # light varies smoothly: everything is computed at half resolution and scaled up (4x fewer pixels)
        self.logS2 = cv2.resize(self.logS, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        warm = cv2.resize(warm, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        glass = cv2.resize(glass, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        own = cv2.resize(own, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        lum2 = cv2.resize(lum, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        floor = cv2.GaussianBlur(cv2.erode(lum2, np.ones((21, 21), np.uint8)), (0, 0), 8)
        litw = np.clip((lum2 - floor - 0.04) * 4, 0, 1) * np.clip(warm * 1.17, 0, 1)
        hy, hx = np.mgrid[0:H // 2, 0:W // 2].astype(np.float32) * 2
        shares = {k: np.exp(-((hx - cx) ** 2 + (hy - cy) ** 2) / (2 * r * r)) for k, (cx, cy, r) in self.POS.items()}
        tot = sum(shares.values()) + 0.02
        self.src = {}
        for name, (cx, cy, r, tgt, warp) in self.SRC.items():
            warp = 0.0
            x0, y0 = max(0, int(cx - 2.6 * r)) // 2 * 2, max(0, int(cy - 2.6 * r)) // 2 * 2
            x1, y1 = min(W, int(cx + 2.6 * r)) // 2 * 2, min(H, int(cy + 2.6 * r)) // 2 * 2
            yy, xx = np.mgrid[y0:y1:2, x0:x1:2].astype(np.float32)
            fo = np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r))
            h0, h1, w0, w1 = y0 // 2, y1 // 2, x0 // 2, x1 // 2
            w = (litw * shares[name] / tot)[h0:h1, w0:w1] * (1 - glass[h0:h1, w0:w1]) * (1 - own[h0:h1, w0:w1]) * 1.6
            near = np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * (0.7 * r) ** 2)).astype(np.float32)
            self.src[name] = dict(c=(cx, cy), box=(x0, y0, x1, y1), w=w.astype(np.float32), xx=xx, yy=yy, near=near,
                                  tgt=tgt, warp=warp, logS=self.logS2[y0 // 2:y1 // 2, x0 // 2:x1 // 2])
        N = sc.N
        # the render is one loop, so frequencies are whole cycles per render; scale them to real time
        sec = N / FPS
        cyc = lambda hz_list: cycles(hz_list, sec)
        # owner 19 Nov: "no lamp flickers" (2 % was invisible): warm uneven glow with a soft quick flicker on top
        # owner 19 Nov: the lamp table/stand must visibly flicker with its lamp (was 3 %): an oil-lamp-like flicker,
        # slow breathing + a quick flutter + rare short dips, all whole cycles per block
        self.lamp_k = (0.07 * loop_noise(N, cyc((0.06, 0.11, 0.19, 0.3, 0.45)), 11)).astype(np.float32)
        self.lamp_q = (0.055 * loop_noise(N, cyc((1.3, 2.1, 3.4, 4.7, 6.1)), 12)).astype(np.float32)
        # review v14: noise-made dims came ~17 a minute, evenly spaced (read as a faulty bulb) -> rare random dims,
        # 2-4 a minute, each 0.3-0.9 s, different depths; inside the block, so the block still loops exactly
        rng_ = np.random.default_rng(14); t_ = 2.0 * FPS
        while True:
            t_ += rng_.uniform(12, 32) * FPS
            if t_ > N - 2 * FPS:
                break
            dur = rng_.uniform(0.3, 0.9) * FPS; x_ = np.arange(N) - t_
            self.lamp_k += (-rng_.uniform(0.05, 0.11) * np.exp(-0.5 * (x_ / (dur / 2.5)) ** 2)).astype(np.float32)
        self.lamp_sw = (5.0 * loop_noise(N, cyc((0.15, 0.31, 0.6, 1.1)), 15)).astype(np.float32)   # flame wander, px
        self.lamp_k = np.clip(self.lamp_k, -0.16, 0.12)
        # lantern: an enclosed flame, slow uneven breathing, no steady beat (G2-lights: 1.35 Hz pulse read as an effect)
        self.lantern_k = loop_noise(N, cyc((0.13, 0.21, 0.37, 0.55, 0.9, 1.7, 2.6)), 13).astype(np.float32)
        # fire: slow variation of depth so the flare/dip rhythm never repeats the same way
        self.fire_slow = loop_noise(N, cyc((0.03, 0.07, 0.11, 0.19)), 14).astype(np.float32)

    def apply(self, out, drive):
        """drive[name] = (k, height_rel, sway_px). k: relative brightness; height_rel: relative flame height change;
        sway_px: flame centre offset in px (1080p)."""
        if not hasattr(self, "m2"):
            self.m2 = np.ones(self.logS2.shape, np.float32)
        self.m2[:] = 1
        for name, s in self.src.items():
            if name not in drive:
                continue
            k, hr, sw = drive[name]
            x0, y0, x1, y1 = s["box"]; cx, cy = s["c"]
            ratio = 1.0
            if s["warp"] > 0 and (abs(hr) > 1e-4 or abs(sw) > 1e-3):
                e = s["warp"] / 300.0 * hr                     # outward scale of the shading about the source
                # shadow edges move most near the source and fade out with its light; never more than 3 px
                near = s["near"]
                dx = np.clip(-(s["xx"] - cx) * e + sw * 0.35, -3, 3) * near
                dy = np.clip(-(s["yy"] - cy) * e, -3, 3) * near
                mx = s["xx"] + dx                                        # light moves left -> shadows move right
                my = s["yy"] + dy
                ls = cv2.remap(self.logS2, mx * 0.5, my * 0.5, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
                ratio = np.exp(np.clip(ls - s["logS"], -0.15, 0.15))
                ratio = 1 + (ratio - 1) * np.clip(s["w"] * 2.2, 0, 1)
            gain = 1 + k * s["w"]
            self.m2[y0 // 2:y1 // 2, x0 // 2:x1 // 2] *= ratio * gain
        # one half-size light map for all sources, scaled up once and applied once
        out *= cv2.resize(self.m2, (out.shape[1], out.shape[0]), interpolation=cv2.INTER_LINEAR)[..., None]


class Lights3(Lights):
    """Firelight done the way real firelight behaves (research 19 Nov; owner: "room looks artificial, more lit
    than its light sources", "cat flickers with the pillow"):
      - steep falloff: light ~ 1/(1+(d/r0)^2) from each source; areas far from every source go darker (night),
        so the room is no brighter than its lights allow (static exposure map, never brightens the picture);
      - two parts: steady coal glow (in the exposure map) + flame flicker on top;
      - the fire is three sub-sources (left/centre/right of the opening) driven by the brightness of the REAL
        flames in those thirds, so the light shifts side to side and the painted shadows seem to move with it;
      - flicker lands most on painted highlights, less on painted shadows; never on glass;
      - electric lamp: slow, gentle; its quick flicker is only on the shade itself."""
    SRC3 = {  # name: (cx, cy, r0, strength in the exposure map, flicker gain)
        "fire_L": (318, 610, 230, 0.40, 1.0), "fire_C": (380, 600, 260, 0.45, 1.0), "fire_R": (442, 610, 230, 0.40, 1.0),
        "candle": (396, 160, 110, 0.22, 1.0), "lantern": (482, 205, 100, 0.30, 1.0), "shelf": (971, 395, 95, 0.22, 1.0),
        "lamp": (1655, 400, 280, 0.85, 1.4), "moon": (1430, 230, 330, 0.22, 0.0)}
    AMBIENT = 0.62
    OCC = {"candle": 226, "shelf": 424, "lantern": 246}   # lantern: review v11 saw its light leak below the mantel
    SHADOW_DEPTH = 0.45   # y of the mantel top / shelf board under each candle (picture px)

    def __init__(self, sc):
        super().__init__(sc)
        P = sc.plate; H, W = sc.H, sc.W; h2, w2 = H // 2, W // 2
        lum2 = cv2.resize(P.mean(2), (w2, h2), interpolation=cv2.INTER_AREA)
        warm2 = cv2.resize(np.clip((P[..., 2] - P[..., 0]) / 0.3, 0, 1), (w2, h2), interpolation=cv2.INTER_AREA)
        floor = cv2.GaussianBlur(cv2.erode(lum2, np.ones((21, 21), np.uint8)), (0, 0), 8)
        lit = np.clip((lum2 - floor - 0.04) * 4, 0, 1)
        glass = cv2.resize(cv2.imread(os.path.join(SC, "c4_mask_window_v2.png"), 0).astype(np.float32) / 255, (w2, h2))
        keep = np.zeros((h2, w2), np.float32)       # light sources themselves keep their exposure
        for f in ("c4_mask_fire.png", "c4_mask_mantel.png", "c4_mask_shelf.png"):
            keep = np.maximum(keep, cv2.resize(cv2.imread(os.path.join(SC, f), 0).astype(np.float32) / 255, (w2, h2)))
        keep[160:235, 775:895] = np.maximum(keep[160:235, 775:895], 0.9)      # lamp shade
        keep = cv2.GaussianBlur(keep, (0, 0), 3)
        hy, hx = np.mgrid[0:h2, 0:w2].astype(np.float32) * 2
        self.gx, self.gy = hx / 2, hy / 2; self.wd = {}
        self.F = {}; tot = np.zeros((h2, w2), np.float32)
        for k, (cx, cy, r0, s, g) in self.SRC3.items():
            f = 1 / (1 + ((hx - cx) ** 2 + (hy - cy) ** 2) / (r0 * r0))
            self.wd[k] = np.clip(np.sqrt((hx - cx) ** 2 + (hy - cy) ** 2) / r0, 0, 2.5).astype(np.float32)
            tot += s * f
            if k == "lamp":        # the shade sends the lamp's light down onto the table, little up to the ceiling
                f = f * (0.35 + 0.65 / (1 + np.exp(np.clip((330 - hy) / 25, -30, 30))))
            if k in self.OCC:      # the board a small flame stands on blocks its light below it: a hard shadow line
                f = f * (0.12 + 0.88 / (1 + np.exp(np.clip((hy - self.OCC[k]) / 4, -30, 30))))
            if g > 0:
                self.F[k] = (g * f * (0.35 + 0.65 * lit * np.clip(warm2 * 1.2, 0, 1)) * (1 - glass) * (1 - keep)).astype(np.float32)
        # review v11: the light pulsed but shadow EDGES never moved. Moving cast shadows: the picture's broad painted
        # shadows near each flame (darker than their surroundings, blurred so line art never doubles) are shifted with
        # the flame's sway; the light map then darkens where the shadow moves in and brightens where it leaves.
        lb = cv2.GaussianBlur(lum2, (0, 0), 2); ref = cv2.GaussianBlur(lum2, (0, 0), 14)
        sh = cv2.GaussianBlur(np.clip((ref - lb) / 0.12, 0, 1), (0, 0), 2.5) * (1 - glass) * (1 - keep)
        self.S = {}
        for k in ("fire_C",):        # candles: their measured sway jitters frame to frame -> light shift only for now
            cx, cy, r0, s_, g_ = self.SRC3[k]
            near = 1 / (1 + ((hx - cx) ** 2 + (hy - cy) ** 2) / (1.0 * r0) ** 2) ** 2
            if k in self.OCC:
                near = near / (1 + np.exp(np.clip((hy - self.OCC[k]) / 4, -30, 30)))
            self.S[k] = (sh * near).astype(np.float32)
        E = self.AMBIENT + (1 - self.AMBIENT) * np.clip(tot, 0, 1)
        self.E2 = (E * (1 - glass) * (1 - keep) + (glass + keep - glass * keep)).astype(np.float32)
        self.E2 = np.minimum(self.E2, 1.0)

    def apply(self, out, drive, extra=None):
        m = self.E2.copy()
        fl = np.zeros_like(m)
        for k, F in self.F.items():
            key = k if k in drive else ("fire" if k.startswith("fire") and "fire" in drive else None)
            if key is None:
                continue
            F_ = F
            sw = float(drive[key][2]) if len(drive[key]) > 2 else 0.0
            if abs(sw) > 0.05:      # owner 19 Nov: shadows must follow the flame. A flame swaying right throws its
                # light pattern (and so the painted shadow edges) to the left, more the further from the source.
                F_ = cv2.remap(F, self.gx + (0.5 * sw) * self.wd[k], self.gy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            fl += float(drive[key][0]) * F_
        m *= 1 + fl
        for k, S in self.S.items():          # moving cast shadows (see __init__)
            key = k if k in drive else ("fire_C" if k == "fire_C" else None)
            if key is None or key not in drive or len(drive[key]) < 3:
                continue
            sw = float(drive[key][2])
            if abs(sw) < 0.05:
                continue
            S2 = cv2.remap(S, self.gx + (0.5 * 1.3 * sw) * np.minimum(self.wd[k], 1.3), self.gy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            m *= 1 + self.SHADOW_DEPTH * (S - S2)
        if extra is not None:          # speed: the cast-shadow multiplier joins the light map at half size (one upscale)
            m *= extra
        out *= cv2.resize(m, (out.shape[1], out.shape[0]), interpolation=cv2.INTER_LINEAR)[..., None]


class CastShadows:
    """Owner 19 Nov: "all furniture, stool and sofa shadows shall flicker with their light, visible on mobile".
    Each object (scenes/c4_casters/*.png, GrabCut) throws a shadow away from its light: the silhouette moved along the
    line from the source through the object. The source moves with the flame's sway (fire: left/right balance of the
    real flames; candles: the real flame's smoothed centroid), so the shadow swings; a brighter (taller) flame makes it
    shorter and darker. Light only: object pixels never move; the shadow never falls on the object itself."""
    SRC = {"fire_C": (380, 600), "lamp": (1655, 430), "candle": (396, 152), "shelf": (971, 390)}
    SWAY = {"fire_C": 1.6, "lamp": 1.0, "candle": 2.5, "shelf": 5.0}       # source x shift per unit of drive sway
    LEN_K = {"fire_C": 0.8, "lamp": 0.0, "candle": 2.0, "shelf": 2.0}       # shadow shortening per unit of brightness

    def __init__(self, H, W):
        cfg = json.load(open(os.path.join(SC, "c4_casters.json")))
        self.items = []
        for k, c in cfg.items():
            if k.startswith("_"):
                continue
            m = cv2.imread(os.path.join(SC, "c4_casters", k + ".png"), 0)
            if m is None:
                continue
            m = cv2.resize(m, (W // 2, H // 2), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
            ys, xs = np.nonzero(m > 0.5)
            if len(xs) < 10:
                continue
            rx0, ry0, rx1, ry1 = [v // 2 for v in c["receiver"]]
            bx0, by0 = min(rx0, xs.min()), min(ry0, ys.min()); bx1, by1 = max(rx1, xs.max() + 1), max(ry1, ys.max() + 1)
            pad = 40; bx0, by0, bx1, by1 = max(0, bx0 - pad), max(0, by0 - pad), min(W // 2, bx1 + pad), min(H // 2, by1 + pad)
            rec = np.zeros((H // 2, W // 2), np.float32); rec[ry0:ry1, rx0:rx1] = 1
            rec = cv2.GaussianBlur(rec, (0, 0), 6)[by0:by1, bx0:bx1]
            mm = m[by0:by1, bx0:bx1]
            self_ = cv2.dilate((mm > 0.3).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
            self.items.append(dict(k=k, src=c["source"], m=mm, keep=(1 - self_) * rec, box=(bx0, by0, bx1, by1),
                                   c=(xs.mean() * 2, ys.mean() * 2), L=c["length"] / 2, soft=c["soft"] / 2, depth=c["depth"]))

    def objects_out(self):
        """review v14: fire shadows landed on the armchair, the sofa arm and seat (objects nearer the camera) and made
        them pulse 31%. A shadow lands only on background: every other caster's own area is cut from its receiver."""
        if getattr(self, "_cut", False):
            return
        H2, W2 = self.shape
        allm = np.zeros((H2, W2), np.float32)
        for it in self.items:
            bx0, by0, bx1, by1 = it["box"]; allm[by0:by1, bx0:bx1] = np.maximum(allm[by0:by1, bx0:bx1], it["m"])
        for it in self.items:
            bx0, by0, bx1, by1 = it["box"]
            own = np.zeros((H2, W2), np.float32); own[by0:by1, bx0:bx1] = it["m"]
            other = cv2.GaussianBlur(np.clip(allm - own, 0, 1), (0, 0), 2)[by0:by1, bx0:bx1]
            it["keep"] = it["keep"] * (1 - np.clip(other * 1.5, 0, 1))
        self._cut = True

    def apply(self, out, drive):
        """returns the half-size multiplier (or None); the light model applies it with its own map"""
        H2, W2 = out.shape[0] // 2, out.shape[1] // 2
        self.shape = (H2, W2); self.objects_out()
        mult = None
        for it in self.items:
            src = it["src"]; key = src if src in drive else ("fire" if src.startswith("fire") and "fire" in drive else None)
            if key is None:
                continue
            k = float(drive[key][3]) if len(drive[key]) > 3 else float(drive[key][0])   # smoothed k when given
            sw = float(drive[key][4]) if len(drive[key]) > 4 else (float(drive[key][2]) if len(drive[key]) > 2 else 0.0)
            sx, sy = self.SRC[src]; sx = sx + self.SWAY[src] * sw
            dx, dy = it["c"][0] - sx, it["c"][1] - sy; n = max(math.hypot(dx, dy), 1.0)
            # brighter / taller flame -> shorter shadow (flames only; the lamp's shadows keep their length)
            Lt = it["L"] * float(np.clip(1 - self.LEN_K.get(src, 1.0) * k, 0.7, 1.3))
            bx0, by0, bx1, by1 = it["box"]
            sh = None      # the shadow is anchored at the object and stretches away (sweep, not a moved copy:
            for f_ in (0.25, 0.5, 0.75, 1.0):   # v13 review: a moved copy pulled in when shorter -> lit area darkened)
                M_ = np.float32([[1, 0, f_ * Lt * dx / n], [0, 1, f_ * Lt * dy / n]])
                w_ = cv2.warpAffine(it["m"], M_, (bx1 - bx0, by1 - by0))
                sh = w_ if sh is None else np.maximum(sh, w_)
            if it["soft"] > 0.5:
                sh = cv2.GaussianBlur(sh, (0, 0), it["soft"])
            if mult is None:
                mult = np.ones((H2, W2), np.float32)
            # the shadow receives none of this source's flicker: remove the static share (depth) and the flicker the
            # light model added there (k x F); so the lit side pulses and the shadow side stays -> contrast flickers
            S_ = sh * it["keep"]
            Fs = self.F[src][by0:by1, bx0:bx1] if src in self.F else 0.0
            # target in shadow: base x (1 - depth x S) x (1 + k F (1 - S)); the light model already gave (1 + k F)
            mult[by0:by1, bx0:bx1] *= np.clip((1 - it["depth"] * S_) * (1 + k * Fs * (1 - S_)) / (1 + k * Fs + 1e-6), 0.2, 1.2)
        return mult


class C4:
    def __init__(self, clips_dir, choose=None, seconds=None, seed=7):
        """seconds=None: old 20 s loop.  seconds=S: non-repeating render of S seconds (living.py banks),
        which itself loops exactly, so a unique block can be repeated for long videos."""
        import living
        self.plate = cv2.imread(os.path.join(SC, "c4_plate_1080.png")).astype(np.float32) / 255
        H, W = self.plate.shape[:2]; self.H, self.W = H, W
        self.snowfall = SnowFall(self.plate, seconds) if seconds is not None else None
        self.live = seconds is not None
        self.N = int((seconds if self.live else LOOP) * FPS)
        n_src = int(LOOP * SRC_FPS)
        self.layers = []
        for name, c in CROPS.items():
            if c["mask"] not in MASK:
                continue                      # e.g. the cat: not composited until its clips pass review
            if self.live and name == "c4_window":
                continue                      # snow is code particles now (SnowFall)
            if self.live and name == "c4_mantel":
                continue                      # lantern: brightness only in code (a warp bends the lattice bars)
            # owner 19 Nov: candles barely moved (code warp, rule breach) -> true FLF flame clips for both candles
            box = c["box"]; x0, y0, x1, y1 = box
            if name == "c4_mantel":
                m = blob_mask(MASK["mantel"], 470, 195)          # lantern only; the candle is done in code
            else:
                m = cv2.imread(os.path.join(SC, MASK[c["mask"]]), 0).astype(np.float32) / 255
            m = m[y0:y1, x0:x1]
            dirs = sorted(glob.glob(os.path.join(clips_dir, f"{name}_*")))
            dirs = [d for d in dirs if os.path.basename(d) not in BANNED]
            if name == "c4_cat":
                dirs = [d for d in dirs if os.path.basename(d) in CAT_USE]
            if choose and name in choose:     # exact-join (first-and-last-frame) clips are always taken
                dirs = [d for d in dirs if os.path.basename(d) in choose[name] or "_flf_" in os.path.basename(d) or name == "c4_cat"]
            dirs = [d for d in dirs if os.path.isdir(d)]
            if not dirs:
                print("no clips for", name, file=sys.stderr); continue
            P = self.plate[y0:y1, x0:x1]
            # skip the first frames: frame 0 is the sharp still, later frames are the model's own rendering
            if name == "c4_candle":      # the flame only; wax, jar and lantern stay the picture's, lit by the flame
                yy_, xx_ = np.mgrid[y0:y1, x0:x1].astype(np.float32)
                m = np.clip((175 - yy_) / 4, 0, 1) * np.clip((yy_ - 104) / 6, 0, 1) * np.clip(1 - (np.abs(xx_ - 397) - 18) / 8, 0, 1)
            if name == "c4_shelf":       # flame + glow only; the wax stays the picture's, lit by the flame (G2-lights)
                yy_ = np.arange(y0, y1, dtype=np.float32)[:, None]
                m = m * np.clip((409 - yy_) / 5, 0, 1)
            flf = [d for d in dirs if "_flf_" in os.path.basename(d) or name == "c4_cat"]
            if self.live and flf and (len(flf) >= 2 or name == "c4_cat"):
                L = self.flf_layer(name, c, flf, P, m, box, seed)
                self.layers.append(L)
                continue
            dirs = [d for d in dirs if "_flf_" not in os.path.basename(d)]
            clips = [color_match(load_clip(d, box, c["scale"])[SKIP:], P, m) for d in dirs]
            if c["mask"] == "window":
                clips = [steady_sky(cc, P) for cc in clips]
            if self.live:
                if c["mask"] == "steam":
                    bg = np.percentile(np.concatenate(clips), 20, axis=0).astype(np.float32)
                    clips = [make_steam(cc, P, box, bg) for cc in clips]
                    m = np.ones_like(m)
                if name == "c4_fire":
                    clips = [tint_sparks(cc, P, box) for cc in clips]
                clips = [np.clip(cc * 255 + 0.5, 0, 255).astype(np.uint8) for cc in clips]
                bank = living.Bank(name, clips, mask=m, reversible=name in ("c4_mantel", "c4_shelf"),
                                   seed=seed * 31 + len(self.layers))
                st = living.Stream(bank, self.N / FPS)
                br = np.array([(f.astype(np.float32) / 255 * m[..., None]).mean() for cc in bank.clips for f in cc[::3]])
                self.layers.append(dict(name=name, box=box, m=m[..., None], stream=st, n=st.N, base=float(br.mean()),
                                        kstd=float(np.std(br / br.mean() - 1))))
                print(f"layer {name}: bank of {len(bank.clips)} clips, longest repeat {st.longest_repeat_s():.1f}s", file=sys.stderr)
                continue
            tot = sum(len(cc) for cc in clips)
            k_eff = max(2, len(clips))
            n = n_src if tot * (2 if len(clips) == 1 else 1) - k_eff * 8 >= n_src else n_src // 2
            seq = chain_loop(clips, n).astype(np.float32); del clips
            if c["mask"] == "steam":
                seq = make_steam(seq, P, box)
                m = np.ones_like(m)          # layer equals the picture wherever there is no steam
            if name == "c4_fire":
                seq = tint_sparks(seq, P, box)
            seq24 = to24(seq); del seq
            n24 = len(seq24)
            br = np.array([(seq24[j].astype(np.float32) / 255 * m[..., None]).mean() for j in range(n24)])
            self.layers.append(dict(name=name, box=box, m=m[..., None], seq=seq24, n=n24, k=br / br.mean() - 1))
            print(f"layer {name}: {len(dirs)} clips -> loop {n24 / FPS:.1f}s", file=sys.stderr)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        glass = cv2.imread(os.path.join(SC, "c4_mask_window_v2.png"), 0).astype(np.float32) / 255
        def falloff(cx, cy, r):
            return np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)).astype(np.float32) * (1 - glass)
        warm = np.array([0.55, 0.8, 1.0], np.float32)
        # candle flicker (loops exactly in LOOP)
        sec_ = self.N / FPS
        cyc_ = lambda hz: cycles(hz, sec_)
        self.fl_state = {}
        for fname, spec in FLAMES.items():
            s1, s2, s3 = spec["seeds"]
            n1 = loop_noise(self.N, cyc_((0.45, 0.7, 1.15, 1.55, 2.35)), s1)
            n2 = loop_noise(self.N, cyc_((0.35, 0.6, 0.95, 1.45)), s2)
            n3 = loop_noise(self.N, cyc_((0.85, 1.85, 2.65)), s3)
            self.fl_state[fname] = dict(scale=1 + np.clip(0.07 * n1, -0.12, 0.12), sway=0.9 * n2 * spec["h"] / 22,
                                        bright=0.07 * n1 + 0.03 * n3)
        st_ = self.fl_state["candle"]
        self.c_scale, self.c_sway, self.c_bright = st_["scale"], st_["sway"], st_["bright"]
        self.lan_k = (loop_noise(self.N, cyc_((0.3, 0.55, 0.9, 1.6, 2.4)), 21), loop_noise(self.N, cyc_((0.25, 0.65, 1.1, 1.8, 2.9)), 22))
        # spill: (falloff, driver series, gain). Small lights are normalised to a target swing (D6: 3-5 % on nearby surfaces)
        if self.live:     # live mode: brightness driver is measured per frame (see frame()); std from the bank
            K = {L["name"]: np.full(2, L["kstd"]) * np.array([1, -1]) for L in self.layers}
        else:
            K = {L["name"]: L["k"] for L in self.layers}
        def norm(k, target):
            return target / max(float(np.std(k)), 1e-6)
        self.spills = []
        if "c4_fire" in K:
            self.spills.append(((falloff(380, 600, 330) * 0.55)[..., None] * warm, "c4_fire"))
        if "c4_mantel" in K:
            self.spills.append(((falloff(470, 190, 80) * norm(K["c4_mantel"], LIGHT_STD["lantern"]))[..., None] * warm, "c4_mantel"))
        if "c4_shelf" in K:
            self.spills.append(((falloff(968, 400, 50) * norm(K["c4_shelf"], LIGHT_STD["shelf"]))[..., None] * warm, "c4_shelf"))
        self.spills.append(((falloff(396, 165, 60) * norm(self.c_bright, LIGHT_STD["candle"]))[..., None] * warm, "candle"))
        self.K = K
        if self.live:
            self.L = Lights3(self)
            self.fire_series = None
            # flicker gains so each source's light swings by its target on fully lit surfaces
            self.lgain = {}
            for nm, key in (("fire", "c4_fire"), ("lantern", "c4_mantel"), ("shelf", "c4_shelf")):
                ks = np.std(K[key]) if key in K else 1.0
                self.lgain[nm] = Lights.SRC[nm][3] / max(float(ks), 1e-4)
            self.lgain["candle"] = Lights.SRC["candle"][3] / max(float(np.std(self.c_bright)), 1e-4)
            for L in self.layers:
                if L["name"] in ("c4_shelf", "c4_candle"):
                    st_ = L["stream"]
                    L["fbox"] = SHELF_FLAME if L["name"] == "c4_shelf" else CANDLE_FLAME
                    fr_ = [f[L["fbox"]].astype(np.float32) / 255 for cc in
                           (st_.b.clips if hasattr(st_, "b") else st_.base + st_.events) for f in cc[::2]]
                    fv = np.array([f.mean() for f in fr_])
                    L["fbase"] = float(fv.mean())
                    L["fx"] = np.arange(fr_[0].shape[1], dtype=np.float32)[None, :]
                    cxs = [float((np.clip((f.mean(2) - 0.75) / 0.2, 0, 1) * L["fx"]).sum() / max(np.clip((f.mean(2) - 0.75) / 0.2, 0, 1).sum(), 1e-3)) for f in fr_]
                    L["fxref"] = float(np.median(cxs))
                    key_ = "shelf" if L["name"] == "c4_shelf" else "candle"
                    self.lgain[key_] = Lights.SRC[key_][3] / max(float(np.std(fv / fv.mean() - 1)), 1e-4)
                    print(f"{L['name']}: flame std {np.std(fv / fv.mean() - 1) * 100:.1f}%, sway std {np.std(cxs):.2f} px", file=sys.stderr)
                    # owner 19 Nov: shadows must follow the flame. Per-frame centroid jitter made shadows twitch, so the
                    # block's brightness and sway series are measured once and smoothed (loop-aware, both directions).
                    bs, ss = np.zeros(self.N, np.float32), np.zeros(self.N, np.float32)
                    idx_ = np.arange(0, self.N, 2)        # every 2nd frame, then interpolated (speed: owner 19 Nov)
                    for i_ in idx_:
                        f = self.fire_alpha(st_.frame(i_).astype(np.float32) / 255, L)[L["fbox"]]   # what the viewer sees
                        hot = np.clip((f.mean(2) - 0.75) / 0.2, 0, 1)
                        bs[i_] = f.mean() / L["fbase"] - 1
                        ss[i_] = (hot * L["fx"]).sum() / max(hot.sum(), 1e-3) - L["fxref"]
                    bs = np.interp(np.arange(self.N), idx_, bs[idx_], period=self.N).astype(np.float32)
                    ss = np.interp(np.arange(self.N), idx_, ss[idx_], period=self.N).astype(np.float32)
                    def sm_(v, a):
                        v = np.concatenate([v[-48:], v, v[:48]])
                        for _ in range(2):
                            for j in range(1, len(v)): v[j] = v[j - 1] + a * (v[j] - v[j - 1])
                            for j in range(len(v) - 2, -1, -1): v[j] = v[j + 1] + a * (v[j] - v[j + 1])
                        return v[48:-48]
                    L["bser"], L["sser"] = sm_(bs, 0.6), sm_(ss, 0.25)
            for L in self.layers:
                if L["name"] == "c4_fire":
                    m = L["m"][..., 0]; tops, cxs = [], []
                    st_ = L["stream"]
                    for cc in (st_.b.clips if hasattr(st_, "b") else st_.base + st_.events):
                        for f in cc[::4]:
                            lum = f.astype(np.float32).mean(2) / 255
                            hot = (lum > 0.78) & (m > 0.5)
                            if hot.sum() >= 30:
                                ys, xs = np.nonzero(hot); tops.append(np.percentile(ys, 8)); cxs.append(xs.mean())
                    bot = float(np.nonzero(m.max(1) > 0.5)[0].max())
                    L["fstats"] = dict(top=float(np.mean(tops)), cx=float(np.mean(cxs)), h=bot - float(np.mean(tops)))
                    if L.get("flf"):     # exact-join clips are cached: precompute the whole block's fire drive once
                        def ff(j):
                            f = L["stream"].frame(j).astype(np.float32) / 255
                            if "pos_gain" in L:
                                g = L["pos_gain"][L["stream"].seq[j % L["stream"].N][1]]
                                f = f * (1 + (g - 1) * L["m"])
                            return f
                        met = np.array([self.flame_metrics(ff(j), L) for j in range(self.N)])
                        kk = met[:, 0] * self.lgain["fire"] * (1 + 0.35 * self.L.fire_slow[:self.N])
                        sm = kk.copy(); prev = kk[-1]
                        for _ in range(2):                       # loop-aware smoothing (twice round the circle)
                            for j in range(self.N):
                                prev = prev + (kk[j] - prev) * (0.55 if kk[j] < prev else 0.8); sm[j] = prev
                        self.fire_series = np.stack([sm, met[:, 1], met[:, 2]], 1).astype(np.float32)
                        # left / centre / right thirds of the real flames -> three fire sub-sources
                        mk = L["m"][..., 0] > 0.5; xs = np.nonzero(mk.any(0))[0]; cuts = np.linspace(xs.min(), xs.max() + 1, 4).astype(int)
                        thirds = []
                        for j in range(self.N):
                            f = ff(j).mean(2)
                            thirds.append([f[:, cuts[q]:cuts[q + 1]][mk[:, cuts[q]:cuts[q + 1]]].mean() for q in range(3)])
                        th = np.array(thirds); th = th / th.mean(0) - 1
                        # review v7: the thirds rose and fall together (corr 0.98) -> keep the real flames' own
                        # side-to-side balance, amplified, on top of half the common flicker
                        com = th.mean(1, keepdims=True); th = 0.5 * com + 1.8 * (th - com)
                        sm3 = th.copy(); prev = th[-1].copy()
                        for _ in range(2):
                            for j in range(self.N):
                                a_ = np.where(th[j] < prev, 0.45, 0.65); prev = prev + (th[j] - prev) * a_; sm3[j] = prev
                        sm3 *= 0.11 / np.maximum(sm3.std(0), 1e-4)         # each sub-source: std 11 % (owner 19 Nov: shadows must visibly follow)
                        self.fire3 = sm3.astype(np.float32)
                        # owner 19 Nov: "stool shadow sways too much and too fast" -> the shadows follow a slow version of
                        # the fire's lean (about 0.4 Hz and below) and of its brightness, not every flicker
                        def slow_(v, a=0.05):
                            v = np.concatenate([v[-240:], v, v[:240]]).astype(np.float64)
                            for _ in range(2):
                                for j in range(1, len(v)): v[j] = v[j - 1] + a * (v[j] - v[j - 1])
                                for j in range(len(v) - 2, -1, -1): v[j] = v[j + 1] + a * (v[j] - v[j + 1])
                            return v[240:-240].astype(np.float32)
                        self.fire_sw_slow = slow_(60.0 * (self.fire3[:, 2] - self.fire3[:, 0]))
                        self.fire_k_slow = slow_(self.fire3.mean(1), 0.12)
        self.lamp = (falloff(1640, 430, 160) * 0.015)[..., None] * np.array([0.7, 0.9, 1.0], np.float32)
        b = cv2.imread(os.path.join(SC, "c4_mask_breath.png"), 0).astype(np.float32) / 255
        ys, xs = np.nonzero(b > 0.01)
        self.bbox = (xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5)
        self.bw = b; self.bc = (float((xs * b[ys, xs]).sum() / b[ys, xs].sum()), float((ys * b[ys, xs]).sum() / b[ys, xs].sum()))
        self.X, self.Y = xx, yy
        cx0, cy0, cx1, cy1 = CANDLE["box"]
        cy = np.arange(cy0, cy1, dtype=np.float32)[:, None]; cxs = np.arange(cx0, cx1, dtype=np.float32)[None, :]
        self.c_grid = (np.broadcast_to(cxs, (cy1 - cy0, cx1 - cx0)).copy(), np.broadcast_to(cy, (cy1 - cy0, cx1 - cx0)).copy())
        wv = np.clip((CANDLE["base"] + 1 - cy) / 3, 0, 1) * np.clip(1 - (np.abs(cxs - CANDLE["cx"]) - 9) / 6, 0, 1)
        self.c_w = np.broadcast_to(wv, (cy1 - cy0, cx1 - cx0))[..., None].astype(np.float32)

    def flf_layer(self, name, c, dirs, P, m, box, seed):
        """First-and-last-frame clips -> exact joins (living.FlfStream). Ends pinned to the picture."""
        import living
        clips = []
        for d in dirs:
            cc = load_clip(d, box, c["scale"])                       # all frames: both ends are the picture
            if name == "c4_cat":      # colour lock on the cat itself (G2 final: face drifted grey-blue, then snapped back)
                body = cv2.imread(os.path.join(SC, "c4_mask_cat_body.png"), 0)[box[1]:box[3], box[0]:box[2]] > 127
                for i in range(len(cc)):
                    cc[i] = cc[i] * (P[body].mean(0) / np.maximum(cc[i][body].mean(0), 1e-3))
            else:
                cc = color_match(cc, P, m)
            if c["mask"] == "window":
                cc = steady_sky(cc, P)
                cc = glass_colour_lock(cc, P, steady_sky.glass)
            if name == "c4_cat":
                # review v7: the local lock pulled a flattened ear back toward the painted upright ear (see-through
                # ghost ears). Parts the clip really moves (ear flicks, lick) get only the global gain above.
                g0 = cc[min(8, len(cc) - 1)].mean(2)
                big = np.max([np.abs(f.mean(2) - g0) for f in cc[8::3]], axis=0) > 0.12
                zone = cv2.dilate(big.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
                hb = np.zeros_like(zone); hb[max(465 - box[1], 0):565 - box[1], max(990 - box[0], 0):1150 - box[0]] = True   # ears only
                zone &= hb    # review v10: deep breaths moved the body into the zone -> unlocked body pumped 3% per frame
                cc = local_colour_lock(cc, P, body & ~zone)
                cat_zone = zone if "cat_zone" not in locals() else (cat_zone | zone)
            if name in ("c4_fire", "c4_mug", "c4_window"):
                cc = fix_tail(cc, m)
            clips.append(cc)
        if c["mask"] == "steam":
            bg = np.percentile(np.concatenate(clips), 20, axis=0).astype(np.float32)
            clips = [make_steam(cc, P, box, bg) for cc in clips]
            m = np.ones_like(m)
        if name == "c4_fire":
            clips = [tint_sparks(cc, P, box) for cc in clips]
            # hue lock per clip (constant over the clip, so the flicker stays): G2 final found the flames lemon-yellow
            mk = (m > 0.5)
            for cc in clips:
                g = P[mk].mean(0) / np.maximum(cc[:, mk].mean((0, 1)), 1e-3)
                cc *= (1 + (g - 1) * m[..., None])[None]
        if c["mask"] == "window":     # keep the picture's own moon (G2 final: moon blurred and dimmed, snapped back)
            yy_, xx_ = np.mgrid[box[1]:box[3], box[0]:box[2]].astype(np.float32)
            moon = np.clip((np.sqrt((xx_ - 1534) ** 2 + (yy_ - 91) ** 2) - 24) / 6, 0, 1)   # G2 r2: was too big, off-centre
            m = cv2.erode(m * moon, np.ones((5, 5), np.uint8))        # and 2 px off the jambs (1-px line flickered)
        u8 = [np.clip(cc * 255 + 0.5, 0, 255).astype(np.uint8) for cc in clips]
        anchor = np.clip(P * 255 + 0.5, 0, 255).astype(np.uint8)
        if c["mask"] != "steam":     # steam is soft; per-frame sharpening of its whole crop made the table/mug/lamp base flicker
            u8 = living.match_sharpness(u8, anchor, m)
        # the shared join frame: every clip's first and last frame are the model's own rendering of the picture;
        # their median is the frame all joins pass through (exact joins, and no snap to the sharper picture)
        ends = np.stack([cc[0] for cc in u8] + [cc[-1] for cc in u8])
        anchor = np.median(ends, axis=0).astype(np.uint8)
        if c["mask"] == "steam":   # review v11: the median of different curls is a ghost of two curls -> use the real
            ef = np.asarray(ends, np.float32)   # end frame closest to the median (a medoid: one real steam shape)
            anchor = np.asarray(ends[int(np.argmin([np.abs(e - anchor).mean() for e in ef]))], np.uint8)
        names = [os.path.basename(d) for d in dirs]
        if name == "c4_cat":
            base = [u for u, n in zip(u8, names) if "breath" in n] or u8[:1]
            events = [u for u, n in zip(u8, names) if "breath" not in n]
        else:
            base, events = u8, []
        st = living.FlfStream(base, anchor, self.N / FPS, events=events, event_every=(18, 45) if name == "c4_cat" else (25, 70), seed=seed * 17 + len(self.layers),
                              interp="events_nearest" if name == "c4_cat" else True, settle=6 if c["mask"] == "window" else 3,   # fire freeze at joins was fire_alpha, not settle (see fire_alpha)
                               phase=PHASE.get(name, 0))   # G2 r4: fire settle 6 paused the flames
        br = np.array([(f.astype(np.float32) / 255 * m[..., None]).mean() for cc in u8 for f in cc[::3]])
        js = st.join_steps()
        print(f"layer {name}: FLF {len(base)} base + {len(events)} events, joins max {js[0]:.2f} vs normal p95 {js[2]:.2f}, slowest near a join {js[3]:.2f} vs median {js[1]:.2f}", file=sys.stderr)
        L = dict(name=name, box=box, m=m[..., None], stream=st, n=st.N, base=float(br.mean()),
                 kstd=float(np.std(br / br.mean() - 1)), flf=True, joins=js)
        if name == "c4_cat" and "cat_zone" in locals():   # review v8: where any cat clip moves (ear folds), the clip is
            # review v11: but only on and next to the cat; the union also caught model glints on the pillow and a
            # smudge on the sofa (2 frames per quick flick) -> keep within the cat silhouette grown by 12 px
            sil = cv2.dilate((m > 0.5).astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
            L["move_zone"] = cv2.GaussianBlur((cat_zone & sil).astype(np.float32), (0, 0), 2)   # used whole: no see-through ears
        if name == "c4_fire":         # G2 r2: every clip flares right after its join -> even out the per-position mean
            mm = m[..., None]
            pm = np.array([np.mean([(cc[j].astype(np.float32) / 255 * mm).mean() for cc in st.base]) for j in range(len(st.base[0]))])
            L["pos_gain"] = np.clip(pm.mean() / pm, 0.85, 1.15).astype(np.float32)
        if c["mask"] == "window":     # G2 r4: one-frame bright-glass steps where clips land on the join frame
            gl = steady_sky.glass
            for arr in st.base:
                lv = np.array([np.percentile(f.mean(2)[gl], 92) for f in arr]).astype(np.float32)
                pad = np.concatenate([lv[:1].repeat(12), lv, lv[-1:].repeat(12)])
                k = np.exp(-0.5 * (np.arange(-12, 13) / 4.0) ** 2); k /= k.sum()
                sm = np.convolve(pad, k, "valid")
                for j in range(len(arr)):
                    g = sm[j] / max(lv[j], 1e-3)
                    if abs(g - 1) > 0.002:
                        arr[j] = np.clip(arr[j].astype(np.float32) * g + 0.5, 0, 255).astype(np.uint8)
        if c["mask"] == "window":     # two independent walks over the same clips: left panes / right panes
            L["stream2"] = living.FlfStream(base, anchor, self.N / FPS, seed=seed * 17 + 99, settle=6,
                                            phase=PHASE["c4_window_b"], share=st)
            xs = np.arange(box[0], box[2], dtype=np.float32)
            L["split"] = np.clip((xs - 1395) / 20, 0, 1)[None, :, None]
        return L

    def fire_alpha(self, fr, L):
        """Logs, grate and back wall always come from the picture (lit by the light model); the clip is used only
        where it really differs: flames, coal glow, sparks. G2 r3: the model redrew logs/grate in one frame
        at every join (landing on the shared join frame)."""
        x0, y0, x1, y1 = L["box"]
        P = self.plate[y0:y1, x0:x1]
        d = cv2.GaussianBlur(np.abs(fr - P).mean(2), (0, 0), 2)
        a = np.clip((d - 0.05) / 0.10, 0, 1)
        if "flame_zone" not in L:  # review v7: near a join the clip is close to the picture, so the per-frame alpha
            st_ = L["stream"]      # fell to 0 and the fire froze for 2-3 frames -> where the bank moves, always the clip
            fs_ = np.stack([c[j] for c in st_.base for j in range(0, len(c), 6)]).astype(np.float32).mean(3) / 255
            z = np.clip((fs_.std(0) - 0.03) / 0.04, 0, 1)
            L["flame_zone"] = cv2.GaussianBlur(z, (0, 0), 3)
        a = np.maximum(a, L["flame_zone"])
        a = cv2.GaussianBlur(a, (0, 0), 1.5)[..., None]
        return P * (1 - a) + fr * a

    def flame_metrics(self, fr, L):
        """(k, height_rel, sway_px) of the fire from its own layer frame, normalised by bank statistics."""
        m = L["m"][..., 0]
        lum = fr.mean(2)
        k = float((fr * L["m"]).mean()) / L["base"] - 1
        hot = (lum > 0.78) & (m > 0.5)
        if hot.sum() < 30:
            return k, 0.0, 0.0
        ys, xs = np.nonzero(hot)
        top = float(np.percentile(ys, 8)); cxm = float(xs.mean())
        st = L["fstats"]
        return k, (st["top"] - top) / max(st["h"], 1.0), cxm - st["cx"]

    def snow_shadow(self, out, layer, alpha=False):
        """Moonlight comes in from the upper right; falling flakes throw soft dark specks onto the moonlit
        sofa rim and window-frame edges ONLY (scenes/c4_mask_moonlit.png). Darkening, never white."""
        fr, (x0, y0, x1, y1) = layer
        if not hasattr(self, "moon"):
            self.moon = cv2.imread(os.path.join(SC, "c4_mask_moonlit.png"), 0).astype(np.float32) / 255
            ys, xs = np.nonzero(self.moon > 0.01)
            self.mb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
            self.Pw = self.plate[y0:y1, x0:x1]
        flakes = fr[..., 0] if alpha else np.clip((np.maximum(fr - self.Pw, 0).mean(2) - 0.04) * 6, 0, 1)
        flakes = cv2.resize(flakes, ((x1 - x0) // 2, (y1 - y0) // 2), interpolation=cv2.INTER_AREA)   # half resolution
        bx0, by0, bx1, by1 = self.mb
        # speed: work only in the box that holds the window flakes and the moonlit surfaces (not the whole frame)
        ux0, uy0 = min(x0 // 2, bx0 // 2) - 16, min(y0 // 2, by0 // 2) - 40
        ux1, uy1 = max(x0 // 2 + flakes.shape[1], (bx1 + 1) // 2) + 16, max(y0 // 2 + flakes.shape[0], (by1 + 1) // 2) + 8
        ux0, uy0 = max(ux0, 0), max(uy0, 0); ux1, uy1 = min(ux1, self.W // 2), min(uy1, self.H // 2)
        canvas = np.zeros((uy1 - uy0, ux1 - ux0), np.float32)
        canvas[y0 // 2 - uy0:y0 // 2 - uy0 + flakes.shape[0], x0 // 2 - ux0:x0 // 2 - ux0 + flakes.shape[1]] = flakes
        M_ = np.float32([[1, 0, -11], [0, 1, 29]])             # light from upper right: shadow lands down-left
        sh = cv2.GaussianBlur(cv2.warpAffine(canvas, M_, (ux1 - ux0, uy1 - uy0)), (0, 0), 1.25)
        sh = cv2.resize(sh[by0 // 2 - uy0:(by1 + 1) // 2 - uy0, bx0 // 2 - ux0:(bx1 + 1) // 2 - ux0], None, fx=2, fy=2,
                        interpolation=cv2.INTER_LINEAR)[:by1 - by0, :bx1 - bx0]
        k = np.clip(sh * 2.0, 0, 1) * self.moon[by0:by1, bx0:bx1] * 0.35
        out[by0:by1, bx0:bx1] *= (1 - k)[..., None]

    def flame(self, out, i, fname):
        """A small flame animated from the picture's own drawing: height, sway at the tip, brightness."""
        spec, st = FLAMES[fname], self.fl_state[fname]
        x0, y0, x1, y1 = spec["box"]; yb, cx = spec["base"], spec["cx"]
        if "grid" not in st:
            gy, gx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
            wv = np.clip((yb + 1 - gy) / 3, 0, 1) * np.clip(1 - (np.abs(gx - cx) - spec["half"]) / (spec["half"] * 0.66), 0, 1)
            st["grid"] = (gx, gy); st["w"] = wv[..., None].astype(np.float32)
        gx, gy = st["grid"]
        s, sw, br = st["scale"][i % self.N], st["sway"][i % self.N], st["bright"][i % self.N]
        up = np.clip((yb - gy) / spec["h"], 0, 1.4)
        patch = cv2.remap(self.plate, (gx - sw * up ** 1.5).astype(np.float32), (yb - (yb - gy) / s).astype(np.float32), cv2.INTER_LINEAR)
        fl = np.clip((patch.mean(2, keepdims=True) - 0.55) / 0.3, 0, 1)
        tint = np.array([0.6, 1.0, 1.2] if br > 0 else [1.6, 1.1, 0.6], np.float32)   # dimmer = warmer, never grey
        patch = patch * (1 + br * fl * tint)
        if "fw" not in st:      # only the flame itself, never the boards behind it
            pc = self.plate[y0:y1, x0:x1].mean(2)
            st["fw"] = (st["w"][..., 0] * np.clip((cv2.dilate(pc, np.ones((3, 3), np.uint8)) - 0.55) / 0.2, 0, 1))[..., None]
        out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - st["fw"]) + patch * st["fw"]

    def candle(self, out, i):
        self.flame(out, i, "candle")

    def lamp_glow(self, out, i):
        """The lampshade itself glows with the lamp's flicker (the lit-map misses it: the whole shade is bright)."""
        x0, y0, x1, y1 = 1550, 320, 1790, 470
        if not hasattr(self, "_shade_w"):
            pc = self.plate[y0:y1, x0:x1]
            self._shade_w = (np.clip((pc.mean(2) - 0.55) / 0.2, 0, 1) * np.clip((pc[..., 2] - pc[..., 0]) / 0.25, 0, 1))[..., None].astype(np.float32)
        k = float(self.L.lamp_k[i % self.N]) + float(self.L.lamp_q[i % self.N])
        out[y0:y1, x0:x1] *= 1 + 1.1 * k * self._shade_w * np.array([0.75, 0.95, 1.1], np.float32)

    def lantern(self, out, i):
        """Lantern glow behind the lattice: brightness only (warping would bend the bars), left and right halves
        flicker independently so it reads as a flame moving inside."""
        x0, y0, x1, y1 = LANTERN["box"]
        if not hasattr(self, "_lan_w"):
            pc = self.plate[y0:y1, x0:x1]
            glow = np.clip((pc.mean(2) - 0.5) / 0.3, 0, 1) * blob_mask(MASK["mantel"], 470, 195)[y0:y1, x0:x1]
            xs = np.arange(x0, x1, dtype=np.float32)[None, :]
            right = np.clip((xs - LANTERN["split"] + 12) / 24, 0, 1)
            self._lan_w = ((glow * (1 - right))[..., None].astype(np.float32), (glow * right)[..., None].astype(np.float32))
        kl, kr = float(self.lan_k[0][i % self.N]), float(self.lan_k[1][i % self.N])
        wl, wr = self._lan_w
        tint = np.array([0.7, 1.0, 1.15], np.float32)
        out[y0:y1, x0:x1] *= 1 + 0.10 * (kl * wl + kr * wr) * tint

    def frame(self, i, parts=None):
        out = self.plate.copy()
        if (parts is None or "breath" in parts) and not any(L["name"] == "c4_cat" for L in self.layers):
            x0, y0, x1, y1 = self.bbox
            u = (i / (LOOP * FPS) * 4) % 1
            amp = (0.5 - 0.5 * math.cos(TAU * min(u / 0.8, 1.0))) * 1.4
            w_ = self.bw[y0:y1, x0:x1]
            mx = self.X[y0:y1, x0:x1]; my = self.Y[y0:y1, x0:x1]
            cx, cy = self.bc
            out[y0:y1, x0:x1] = cv2.remap(out, mx - (mx - cx) / 60 * amp * 0.5 * w_, my - (my - cy) / 45 * amp * w_ + amp * 0.4 * w_,
                                          cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        kn = {"candle": float(self.c_bright[i % self.N])}
        snow = {}; fires = {}
        for L in self.layers:
            if parts is not None and L["name"] not in parts:
                continue
            x0, y0, x1, y1 = L["box"]
            fr = (L["stream"].frame(i) if self.live else L["seq"][i % L["n"]]).astype(np.float32) / 255
            if "stream2" in L:
                fr = fr * (1 - L["split"]) + L["stream2"].frame(i).astype(np.float32) / 255 * L["split"]
            if "pos_gain" in L:     # flames only (G2 r3: evening the whole mask dipped the coals)
                g = L["pos_gain"][L["stream"].seq[i % L["stream"].N][1]]
                hot = np.clip((fr.mean(2, keepdims=True) - 0.7) / 0.15, 0, 1)
                fr = fr * (1 + (g - 1) * hot * L["m"])
            if L["name"] in ("c4_fire", "c4_candle", "c4_shelf") and self.live:
                fr = self.fire_alpha(fr, L)
            m = L["m"]
            if L["name"] == "c4_window" and self.live and not L.get("flf"):   # old blended clips only
                gl = steady_sky.glass
                if not hasattr(self, "_sky_ref"):
                    self._sky_ref = float(np.median(self.plate[y0:y1, x0:x1].mean(2)[gl]))
                fr *= self._sky_ref / max(float(np.median(fr.mean(2)[gl])), 1e-4)
            if L["name"] == "c4_cat" and self.live and "move_zone" in L:
                m = np.maximum(m, L["move_zone"][..., None])   # (a per-frame difference alpha let the head show through)
            out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - m) + fr * m
            if L["name"] == "c4_window":
                snow[L["name"]] = (fr, L["box"])
            if L["name"] == "c4_fire" and self.live:
                fires["c4_fire"] = self.flame_metrics(fr, L)
            if L["name"] in ("c4_shelf", "c4_candle") and self.live:
                fb = fr[L["fbox"]]; hot = np.clip((fb.mean(2) - 0.75) / 0.2, 0, 1)
                kn[L["name"] + "_flame"] = float(fb.mean()) / L["fbase"] - 1     # brightness: the flame the viewer sees
                if "bser" in L:
                    kn[L["name"] + "_ks"] = float(L["bser"][i % self.N])          # smoothed, for shadow length/contrast
                kn[L["name"] + "_sway"] = float(L["sser"][i % self.N]) if "sser" in L else \
                    float((hot * L["fx"]).sum() / max(hot.sum(), 1e-3)) - L["fxref"]
            kn[L["name"]] = (float((fr * m).mean()) / L["base"] - 1) if self.live else float(L["k"][i % L["n"]])
        if parts is None or "candle" in parts:
            names_ = {L["name"] for L in self.layers}
            if "c4_candle" not in names_:
                self.candle(out, i)
            if self.live:
                if "c4_shelf" not in names_:
                    self.flame(out, i, "shelf")
                self.lantern(out, i)
                self.lamp_glow(out, i)
        if self.snowfall is not None and (parts is None or "snow" in parts):
            a = self.snowfall.apply(out, i)
            if parts is None or "snowshadow" in parts:
                self.snow_shadow(out, (a, self.snowfall.box), alpha=True)
        elif (parts is None or "snowshadow" in parts) and "c4_window" in snow:
            self.snow_shadow(out, snow["c4_window"])
        if self.live and (parts is None or "light" in parts):
            drive = {}
            if self.fire_series is not None:
                drive["fire"] = tuple(float(v) for v in self.fire_series[i % self.N])
                if getattr(self, "fire3", None) is not None:
                    f3 = self.fire3[i % self.N]
                    fsw = 60.0 * float(f3[2] - f3[0])        # flames leaning right -> shadows swing left (full-res px at r0)
                    for q, nm in enumerate(("fire_L", "fire_C", "fire_R")):
                        drive[nm] = (float(f3[q]), 0.0, fsw, float(self.fire_k_slow[i % self.N]),
                                     float(self.fire_sw_slow[i % self.N]))
            elif "c4_fire" in fires:
                k, hr, sw = fires["c4_fire"]
                kk = k * self.lgain["fire"] * (1 + 0.35 * float(self.L.fire_slow[i % self.N]))
                prev = getattr(self, "_fk", kk)
                kk = prev + (kk - prev) * (0.55 if kk < prev else 0.8)    # soften the sharpest drops
                self._fk = kk
                drive["fire"] = (kk, hr, sw)
            if "c4_mantel" in kn:
                drive["lantern"] = (float(self.L.lantern_k[i % self.N]) * Lights.SRC["lantern"][3], 0.0, 0.0)
            if "c4_shelf" in kn:
                drive["shelf"] = (kn.get("c4_shelf_flame", 0.0) * self.lgain["shelf"], 0.0, 10.0 * kn.get("c4_shelf_sway", 0.0),
                                  kn.get("c4_shelf_ks", 0.0) * self.lgain["shelf"])
            if "c4_shelf" not in kn:        # code-animated shelf candle
                drive["shelf"] = (float(self.fl_state["shelf"]["bright"][i % self.N]) / max(float(np.std(self.fl_state["shelf"]["bright"])), 1e-4)
                                  * Lights.SRC["shelf"][3], float(self.fl_state["shelf"]["scale"][i % self.N] - 1) * 2.5,
                                  6.0 * float(self.fl_state["shelf"]["sway"][i % self.N]))
            if "c4_mantel" not in kn:       # code-animated lantern: its light follows its glow
                drive["lantern"] = (0.5 * (float(self.lan_k[0][i % self.N]) + float(self.lan_k[1][i % self.N])) / 0.71
                                    * Lights.SRC["lantern"][3], 0.0, 0.0)
            if "c4_candle_flame" in kn:     # light and shadow sway from the real flame clip
                drive["candle"] = (kn["c4_candle_flame"] * self.lgain["candle"], 0.0, 10.0 * kn["c4_candle_sway"],
                                   kn.get("c4_candle_ks", kn["c4_candle_flame"]) * self.lgain["candle"])
            else:
                drive["candle"] = (float(self.c_bright[i % self.N]) * self.lgain["candle"], float(self.c_scale[i % self.N] - 1) * 2.5,
                                   6.0 * float(self.c_sway[i % self.N]))   # shadow parallax: objects near a candle throw long shadows
            drive["lamp"] = (float(self.L.lamp_k[i % self.N]) + 0.9 * float(self.L.lamp_q[i % self.N]), 0.0,
                             float(self.L.lamp_sw[i % self.N]))   # room follows the shade; its shadows wander a little
            if getattr(self, "casters", None) is None:
                self.casters = CastShadows(self.H, self.W)
                F_ = dict(self.L.F); F_["fire_C"] = F_.get("fire_L", 0) + F_.get("fire_C", 0) + F_.get("fire_R", 0)
                self.casters.F = F_
            self.L.apply(out, drive, extra=self.casters.apply(out, drive))
        elif parts is None or "light" in parts:
            light = self.lamp * math.sin(TAU * i / (LOOP * FPS))
            for f, key in self.spills:
                if key in kn:
                    light = light + f * kn[key]
            out *= 1 + light
        return np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)


LIGHT_STD = {"lantern": 0.03, "shelf": 0.028, "candle": 0.024}
ENC = ["-vf", "scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p",
       "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
       "-c:v", "libx264", "-preset", "slow", "-tune", "animation",
       "-x264-params", "keyint=infinite:scenecut=0"]   # G2 final: an I-frame every 10 s made textures twinkle


def render(sc, path, crf=14, loops=1, audio=None):
    """loops > 1: ONE continuous encode of the loop repeated (no joins between copies of a file, D3)."""
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{sc.W}x{sc.H}", "-r", str(FPS), "-i", "-"]
    if audio:
        cmd += ["-i", audio, "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += ENC + ["-crf", str(crf), "-movflags", "+faststart", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    cache = []
    for i in range(sc.N):
        f = sc.frame(i); cache.append(f) if loops > 1 else None
        p.stdin.write(f.tobytes())
    for _ in range(loops - 1):
        for f in cache:
            p.stdin.write(f.tobytes())
    p.stdin.close(); p.wait()


_W = {}


def _init_worker(clips, choose, seconds, seed):
    _W["sc"] = C4(clips, choose, seconds=seconds, seed=seed)


class Finish:
    """Owner 19 Nov: the video mentions each new piece of music, and fades in from black and out to black.
    Title cards (Lora, soft shadow) come from the playlist cue sheet: shown 4 s after a piece starts, 1.5 s fade in,
    8 s hold, 2 s fade out, lower left. Applied to finished 8-bit frames, so it costs almost nothing."""
    FONT = "/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf"
    FONT_I = "/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf"

    def __init__(self, cues=None, total_s=0, fade_in=6.0, fade_out=8.0, W=1920, H=1080, credits=None):
        from PIL import Image, ImageDraw, ImageFont, ImageFilter
        self.total, self.fi, self.fo, self.cards = total_s, fade_in, fade_out, []
        cl = json.load(open(cues))["cues"] if cues else []
        f1, f2 = ImageFont.truetype(self.FONT_I, 54), ImageFont.truetype(self.FONT, 32)   # readable on a phone
        for c in cl:
            img = Image.new("RGBA", (1300, 150), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
            d.text((24, 14), c["title"], font=f1, fill=(255, 246, 230, 255))
            if c.get("by"):
                d.text((27, 86), c["by"], font=f2, fill=(235, 222, 200, 230))
            a = np.asarray(img).astype(np.float32) / 255
            sh = np.asarray(img.split()[3].filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255 * 0.65
            rgb = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2BGR); al = a[..., 3:4]
            t_card = c["start"] + 4.0
            if credits and t_card < credits.get("open_end", 0) + 3.0:
                t_card = credits["open_end"] + 3.0          # the first piece title waits for the opening credits
            self.cards.append(dict(t=t_card, rgb=rgb, al=al, sh=sh[..., None], pos=(64, H - 210)))
        # opening credits while the picture fades up, closing notes while it dims (owner 20 Nov): centred, drawn
        # AFTER the dim so they stay readable on the dark picture and on black
        self.blocks = []
        if credits:
            self.blocks.append(dict(card=self._centred(credits["open"], W, H), t0=credits.get("open_start", 1.0),
                                    t1=credits["open_end"], fin=2.0, fout=2.0))
            self.blocks.append(dict(card=self._centred(credits["close"], W, H), t0=total_s - credits.get("close_len", 22.0),
                                    t1=total_s - 0.5, fin=2.5, fout=3.0))

    def _centred(self, lines, W, H):
        """lines: [(text, size, italic)] -> centred card over the whole frame."""
        from PIL import Image, ImageDraw, ImageFont, ImageFilter
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
        fonts = [ImageFont.truetype(self.FONT_I if it else self.FONT, sz) for _, sz, it in lines]
        hs = [f.getbbox(tx)[3] - f.getbbox(tx)[1] for (tx, _, _), f in zip(lines, fonts)]
        gap = 28; y = int(H * 0.35) - (sum(hs) + gap * (len(lines) - 1)) // 2       # above the cat, not over it
        top = y
        for (tx, sz, it), f, h in zip(lines, fonts, hs):
            bb = f.getbbox(tx); x = (W - (bb[2] - bb[0])) // 2 - bb[0]
            d.text((x, y - bb[1]), tx, font=f, fill=(255, 246, 230, 255) if sz >= 50 else (238, 226, 206, 235)); y += h + gap
        a = np.asarray(img).astype(np.float32) / 255
        sh = np.asarray(img.split()[3].filter(ImageFilter.GaussianBlur(9))).astype(np.float32) / 255 * 0.7
        # soft dark scrim behind the block, so the small lines read on the bright quilt / shelves on a phone
        al_ = np.asarray(img.split()[3]); ys, xs = np.nonzero(al_ > 0)
        sc = Image.new("L", (W, H), 0); ImageDraw.Draw(sc).rounded_rectangle(
            (int(xs.min()) - 70, int(ys.min()) - 45, int(xs.max()) + 70, int(ys.max()) + 45), radius=60, fill=255)
        scrim = np.asarray(sc.filter(ImageFilter.GaussianBlur(45))).astype(np.float32) / 255 * 0.5
        sh = np.maximum(sh, scrim)
        ys, xs = np.nonzero(sh > 0.003); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgb = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2BGR)
        return dict(rgb=rgb[y0:y1, x0:x1], al=a[y0:y1, x0:x1, 3:4], sh=sh[y0:y1, x0:x1, None], pos=(x0, y0))

    def alpha_at(self, t, t0):
        if t < t0 or t > t0 + 11.5:
            return 0.0
        x = t - t0
        return min(1.0, x / 1.5) if x < 1.5 else (1.0 if x < 9.5 else max(0.0, (11.5 - x) / 2.0))

    def __call__(self, f, i):
        t = i / FPS
        for c in self.cards:
            a = self.alpha_at(t, c["t"])
            if a > 0:
                x0, y0 = c["pos"]; h, w = c["al"].shape[:2]
                reg = f[y0:y0 + h, x0:x0 + w].astype(np.float32) / 255
                reg = reg * (1 - a * c["sh"]) * 1.0
                reg = reg * (1 - a * c["al"]) + c["rgb"] * (a * c["al"])
                f[y0:y0 + h, x0:x0 + w] = np.clip(reg * 255 + 0.5, 0, 255).astype(np.uint8)
        g = 1.0
        if self.fi and t < self.fi:
            g = 0.5 - 0.5 * math.cos(math.pi * t / self.fi)
        if self.fo and self.total and t > self.total - self.fo:
            g = min(g, 0.5 - 0.5 * math.cos(math.pi * max(0.0, self.total - t) / self.fo))
        if g < 1.0:
            f = (f.astype(np.float32) * g + 0.5).astype(np.uint8)
        for b in self.blocks:
            if b["t0"] <= t <= b["t1"]:
                a = min(1.0, (t - b["t0"]) / b["fin"], (b["t1"] - t) / b["fout"])
                a = 0.5 - 0.5 * math.cos(math.pi * max(0.0, a))
                c = b["card"]; x0, y0 = c["pos"]; h, w = c["al"].shape[:2]
                reg = f[y0:y0 + h, x0:x0 + w].astype(np.float32) / 255
                reg = reg * (1 - a * c["sh"])
                reg = reg * (1 - a * c["al"]) + c["rgb"] * (a * c["al"])
                f[y0:y0 + h, x0:x0 + w] = np.clip(reg * 255 + 0.5, 0, 255).astype(np.uint8)
        return f


def _frames(rng):
    sc = _W["sc"]; a, b = rng; post = _W.get("post")
    if sc.fire_series is None:                   # old-style fire layer: warm the light smoothing first
        for i in range(a - 12, a):
            sc.frame(i % sc.N)
    if post is None:
        return b"".join(sc.frame(i).tobytes() for i in range(a, b))
    return b"".join(post(sc.frame(i), i).tobytes() for i in range(a, b))


def render_block(clips, choose, seconds, out, workers=2, crf=11, preset="veryfast", seed=7, repeat=1, audio=None, chunk=24,
                 cues=None, fade_in=0.0, fade_out=0.0, credits=None, uhd=False):
    """Fast path for long videos. Worker processes make frames in parallel; ONE encoder takes them in order
    (no part joins). The block loops exactly, so a long video is the block repeated by stream copy
    (a 2-hour video = a 10-minute block x 12, which takes seconds). Audio of the final length is muxed last."""
    import multiprocessing as mp, tempfile
    N = int(seconds * FPS)
    tmp = tempfile.mkdtemp(prefix="c4block_")
    block = os.path.join(tmp, "block.mp4")
    enc = list(ENC); enc[enc.index("slow")] = preset
    if uhd:   # 4K upload (owner 19 Nov: "uploaded in 4k to mobile"): YouTube gives 4K uploads its VP9/AV1 ladder, so
        # phones get a sharper 1080p too. Frames are made at 1080p and lanczos-upscaled inside the encoder.
        enc[1] = "scale=3840:2160:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=yuv420p"
    direct = repeat == 1 and audio            # one pass straight to the final file: a 95-min 4K file is ~8 GB, and the
    # old block -> concat -> mux path kept three copies on disk (no faststart either: it rewrites the whole file,
    # and YouTube does not need it)
    a_in = ["-i", audio] if direct else []
    a_out = ["-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "256k", "-shortest"] if direct else []
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "1920x1080", "-r", str(FPS), "-i", "-"]
                         + a_in + enc + ["-crf", str(crf)] + a_out + [out if direct else block], stdin=subprocess.PIPE)
    ranges = [(a, min(a + chunk, N)) for a in range(0, N, chunk)]
    if cues or fade_in or fade_out or credits:               # titles + fades belong to ONE whole programme, not a repeated block
        if repeat > 1:
            raise SystemExit("titles/fades need repeat=1 (render the whole programme)")
        _W["post"] = Finish(cues, N / FPS, fade_in, fade_out, credits=credits)
    if workers > 1 and "fork" in mp.get_all_start_methods():
        # prepare the clips ONCE here; forked workers share these read-only arrays (no copy per worker:
        # spawned workers each rebuilt ~3.3 GB and two did not fit in 8 GB)
        t_ = __import__("time").time()
        _W["sc"] = C4(clips, choose, seconds=seconds, seed=seed)
        print(f"setup {(__import__('time').time() - t_) / 60:.1f} min", file=sys.stderr)
        ctx, init, args = mp.get_context("fork"), None, ()
    else:
        ctx, init, args = mp.get_context("spawn"), _init_worker, (clips, choose, seconds, seed)
    with ctx.Pool(workers, initializer=init, initargs=args) as pool:
        # bounded: at most 2 batches per worker in flight (finished frames are 6 MB each; an unbounded queue ran
        # the 8 GB sandbox out of memory)
        from collections import deque
        q, it = deque(), iter(ranges)
        for r in it:
            q.append(pool.apply_async(_frames, (r,)))
            if len(q) >= 2 * workers:
                p.stdin.write(q.popleft().get())
        while q:
            p.stdin.write(q.popleft().get())
    p.stdin.close(); p.wait()
    if direct:
        os.rmdir(tmp)
        return out
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as f:
        f.write(f"file '{block}'\n" * repeat)
    video = out if not audio else os.path.join(tmp, "video.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", video], check=True)
    if audio:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", video, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], check=True)
    return out


def gate(sc, d):
    """Motion map + liveness of every inventoried light + seam. Writes images and gate.json."""
    os.makedirs(d, exist_ok=True)
    K = 1920 / 1672
    step = 2
    idx = list(range(0, min(sc.N, int(60 * FPS)), step)); keep = set(np.linspace(0, len(idx) - 1, 6).astype(int).tolist())
    s1 = np.zeros((sc.H, sc.W), np.float64); s2 = np.zeros((sc.H, sc.W), np.float64); fr = []
    geo = None
    if getattr(sc, "live", False):   # geometry check with the light model off (lights are checked by swing + review)
        geo = [L["name"] for L in sc.layers] + ["breath", "candle", "snowshadow", "snow"]
    for j, i in enumerate(idx):
        f = sc.frame(i, parts=geo)
        g = f.astype(np.float32).mean(2)
        s1 += g; s2 += g * g
        if j in keep:
            fr.append(f)
    n = len(idx)
    st = np.sqrt(np.maximum(s2 / n - (s1 / n) ** 2, 0)).astype(np.float32)
    allowed = np.zeros(st.shape, np.float32)
    for f in MASK.values():
        allowed = np.maximum(allowed, cv2.imread(os.path.join(SC, f), 0).astype(np.float32) / 255)
    allowed = np.maximum(allowed, cv2.imread(os.path.join(SC, "c4_mask_breath.png"), 0).astype(np.float32) / 255)
    allowed = np.maximum(allowed, cv2.imread(os.path.join(SC, "c4_mask_moonlit.png"), 0).astype(np.float32) / 255)
    allowed_d = cv2.dilate((allowed > 0.02).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    mean = s1 / n
    # clearly moving: big AND relatively big. Light spill only scales brightness by a few % (a lit wax body can
    # swing > 4 levels yet only ~3 %); a moving edge swings far more than 5 % of its mean.
    strong = (st > 4.0) & (st > 0.05 * np.maximum(mean, 1))
    outside = strong & ~allowed_d
    res = {"moving_px_outside_masks": int(outside.sum())}
    glass = cv2.imread(os.path.join(SC, "c4_mask_window_v2.png"), 0) > 127
    # snow: anything in the window region that moves but is not glass
    reg = np.zeros(st.shape, bool); reg[0:500, 1060:1800] = True
    others = cv2.imread(os.path.join(SC, "c4_mask_moonlit.png"), 0) > 5   # snow SHADOWS (darkening only)
    for k, f in MASK.items():
        if k != "window":
            others |= cv2.imread(os.path.join(SC, f), 0) > 5
    res["window_region_moving_not_glass_px"] = int((strong & reg & ~others & ~cv2.dilate(glass.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)).sum())
    # liveness of each inventoried light (boxes from the reviewer, 1672 px -> 1080p)
    inv = json.load(open(os.path.join(SC, "c4_lights_for_gate.json")))
    live = {}
    for name, (x0, y0, x1, y1, need) in inv.items():
        b = st[int(y0 * K):int(y1 * K), int(x0 * K):int(x1 * K)]
        live[name] = {"p95_std": round(float(np.percentile(b, 95)), 2), "need": need, "ok": float(np.percentile(b, 95)) >= need}
    res["lights"] = live
    a, b = sc.frame(0).astype(np.int16), sc.frame(sc.N).astype(np.int16)
    res["seam_equal"] = float(np.abs(a - b).mean())
    steps = [float(np.abs(sc.frame(i).astype(np.int16) - sc.frame(i + 1).astype(np.int16)).mean()) for i in range(0, sc.N, max(1, sc.N // 8))]
    res["seam_step"] = float(np.abs(sc.frame(sc.N - 1).astype(np.int16) - a).mean()); res["normal_step_max"] = max(steps)
    res["pass"] = (res["moving_px_outside_masks"] == 0 and res["window_region_moving_not_glass_px"] == 0
                   and all(v["ok"] for v in live.values()) and res["seam_equal"] < 0.01 and res["seam_step"] <= 1.2 * res["normal_step_max"])
    json.dump(res, open(os.path.join(d, "gate.json"), "w"), indent=1)
    # pictures for the reviewer
    hm = cv2.applyColorMap(np.clip(st * 12, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
    base = (sc.plate * 255).astype(np.uint8)
    over = cv2.addWeighted(base, 0.45, hm, 0.75, 0)
    over[outside] = (0, 255, 0)
    cv2.imwrite(os.path.join(d, "motion_map.jpg"), over)
    for name, (x0, y0, x1, y1, need) in inv.items():
        X0, Y0, X1, Y1 = [int(v * K) for v in (x0, y0, x1, y1)]
        pad = max(20, (X1 - X0) // 2)
        X0, Y0, X1, Y1 = max(0, X0 - pad), max(0, Y0 - pad), min(sc.W, X1 + pad), min(sc.H, Y1 + pad)
        z = max(1, 160 // max(1, Y1 - Y0))
        strip = np.hstack([cv2.resize(f[Y0:Y1, X0:X1], None, fx=z, fy=z, interpolation=cv2.INTER_NEAREST) for f in fr])
        cv2.imwrite(os.path.join(d, f"strip_{name}.jpg"), strip)
    print(json.dumps(res, indent=1))
    return res


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips", required=True); ap.add_argument("--render"); ap.add_argument("--gate")
    ap.add_argument("--choose", help="json {crop: [clip ids]}")
    ap.add_argument("--loops", type=int, default=1); ap.add_argument("--audio")
    ap.add_argument("--seconds", type=float, help="non-repeating render of this length (exact loop)")
    ap.add_argument("--block", help="fast path: render --seconds as one exact-loop block with --workers processes into this file")
    ap.add_argument("--workers", type=int, default=2); ap.add_argument("--repeat", type=int, default=1)
    ap.add_argument("--cues", default=None, help="playlist_cues.json: a title card for every piece")
    ap.add_argument("--fade-in", type=float, default=0.0); ap.add_argument("--fade-out", type=float, default=0.0)
    ap.add_argument("--crf", type=int, default=11)
    ap.add_argument("--credits", default=None, help="json: open/close lines [(text, size, italic)], open_end, close_len")
    ap.add_argument("--uhd", action="store_true", help="encode 3840x2160 (lanczos upscale in the encoder)")
    ap.add_argument("--preset", default="veryfast")   # medium was 18 fps, veryfast 59 fps; PSNR vs source 49-52 dB
    a = ap.parse_args()
    if a.block:
        t0 = __import__("time").time()
        render_block(a.clips, json.loads(a.choose) if a.choose else CHOOSE, a.seconds, a.block, a.workers,
                     preset=a.preset, crf=a.crf, repeat=a.repeat, audio=a.audio, cues=a.cues, fade_in=a.fade_in, fade_out=a.fade_out,
                     credits=json.load(open(a.credits)) if a.credits else None, uhd=a.uhd)
        print(f"block done in {(__import__('time').time() - t0) / 60:.1f} min -> {a.block}")
        sys.exit(0)
    sc = C4(a.clips, json.loads(a.choose) if a.choose else CHOOSE, seconds=a.seconds)
    if a.gate: gate(sc, a.gate)
    if a.render: render(sc, a.render, loops=a.loops, audio=a.audio)
