"""Long original sleep compositions, 10-15 min each, uneven lengths (owner 20 Nov 00:02 IST: "We need multiple
compositions. Uneven timings from 10-15 minutes each. Not syncing to any visual loop to avoid catching").

Same calm rules as lullabies.py (major keys, gentle chords I / IV / vi with add9 / maj7 colours, soft Vsus only,
pentatonic melody never a half step against the chord, nothing above C6, 44-52 bpm, plagal endings), but each
composition is a long journey of 8-bar sections so it holds 10-15 minutes without a short repeat:
  - a theme (A) that comes back, each return in a new texture or with a new second half
  - second and third ideas (B, C), octave-up verses, "rest" sections (left hand alone with a few melody notes)
  - a soft viola-section pad under some sections (texture change without any alerting sound)
  - left-hand figure changes per section; dynamics drift softer through the piece
Length targets are drawn per composition (10.2-14.8 min, all at least 18 s apart, never a whole number of minutes),
so piece changes never fall on a regular grid and never line up with any picture loop.

python3 sleep_suites.py out_dir [--count 8] [--seed 300] [--total 95] [--only K]
Writes out_dir/suite_K.wav + suite_K.json per composition, each mastered alone to -21 LUFS (a 95-min master in one
go would need ~9 GB). One composition takes ~0.8x its length on one core: run two --only processes side by side.
python3 sleep_suites.py out_dir --plan    only prints the planned lengths (fast, no audio)
"""
import argparse, json, os, sys
import numpy as np
import soundfile as sf

os.environ.setdefault("SAMPLES", "/home/claude/samples")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render as R
from c4_music import render_notes
from lullabies import PENTA, CHORDS, PROGS, B_PROGS, RHYTHMS_3, RHYTHMS_4

KEYS = [61, 66, 63, 68, 65, 70, 62, 67, 64, 60]          # Db Gb Eb Ab F Bb D G E C
PATTERNS_4 = [(0, 1, 2, 3, 2, 1, 2, 1), (0, 2, 1, 3, 2, 1, 3, 2), (0, 1, 2, 1, 3, 1, 2, 1), (0, 2, 3, 2, 1, 2, 3, 2)]
PATTERNS_3 = [(0, 1, 2, 3, 2, 1), (0, 2, 1, 3, 1, 2), (0, 1, 3, 2, 3, 1), (0, 2, 3, 1, 3, 2)]


def plan_lengths(count, total_min, seed):
    """Uneven target lengths (minutes): 10.2-14.8, pairwise >= 0.3 min apart, not near a whole minute, sum ~ total."""
    rng = np.random.default_rng(seed)
    for _ in range(400000):
        L = rng.uniform(10.2, 14.8, count)
        if abs(L.sum() - total_min) > 1.5:
            continue
        d = np.abs(L[:, None] - L[None, :]) + np.eye(count) * 9
        if d.min() < 0.3 or np.any(np.abs(L - np.round(L)) < 0.12):
            continue
        return [float(x) for x in L]
    raise RuntimeError("no plan")


def compose_long(seed, target_s, key_index):
    rng = np.random.default_rng(seed)
    tonic = int(KEYS[key_index % len(KEYS)]); bpm = float(rng.uniform(44, 52)); meter = 3 if rng.random() < 0.4 else 4
    beat = 60 / bpm; bar = meter * beat
    pa = rng.permutation(len(PROGS)); pb = rng.permutation(len(B_PROGS))
    A, C = PROGS[pa[0]], PROGS[pa[1]]; B, B2 = B_PROGS[pb[0]], B_PROGS[pb[1 % len(pb)]]
    pats = PATTERNS_3 if meter == 3 else PATTERNS_4
    scale = sorted({tonic + o + d for o in (-12, 0, 12) for d in PENTA if 55 <= tonic + o + d <= 84})
    notes, pedal, pad = [], [], []

    def chord_notes(name):
        r, iv = CHORDS[name]; root = tonic - 24 + r
        while root < 36: root += 12
        return [root + i for i in iv]

    def lh(name, t0, vel, pat, sparse=False):
        c = chord_notes(name); out = []
        steps = pat[::2] if sparse else pat
        step = beat if sparse else beat / 2
        for j, idx in enumerate(steps):
            s = t0 + j * step
            out.append((s, s + beat * 1.7, c[idx], vel + (3 if j == 0 else 0) - (2 if j % 2 else 0), 0))
        return out

    def melody(prog, rseed, vel):
        r2 = np.random.default_rng(rseed); out = []; t = 0.0; cur = tonic + 7
        RH = RHYTHMS_3 if meter == 3 else RHYTHMS_4
        for bi, name in enumerate(prog):
            rh = RH[r2.integers(len(RH))]
            if bi % 4 == 3:
                rh = [meter - 1, 1] if r2.random() < 0.5 else [meter]
            ctones = {(n % 12) for n in chord_notes(name)}
            for k, d in enumerate(rh):
                if bi % 4 == 3 and k == len(rh) - 1 and len(rh) > 1:
                    t += d * beat; continue
                strong = (k == 0)
                cand = [n for n in scale if abs(n - cur) <= (5 if strong else 4)
                        and not any((n - c) % 12 in (1, 11) for c in ctones)]
                cand = cand or [n for n in scale if n % 12 in ctones and abs(n - cur) <= 7]
                if strong:
                    cand = [n for n in cand if n % 12 in ctones] or cand
                w = np.array([1.0 / (1 + abs(n - cur)) ** 1.3 for n in cand])
                cur = int(r2.choice(cand, p=w / w.sum()))
                out.append((t, d * beat * 0.96, cur, vel + (4 if strong else 0)))
                t += d * beat
        return out

    def add_pad(prog, t0, vel):
        for i, name in enumerate(prog):
            r, iv = CHORDS[name]; root = tonic - 12 + r
            while root < 50: root += 12
            while root > 61: root -= 12
            for k in (root, root + 7, root + iv[1] + 12 if root + iv[1] + 12 <= 72 else root + iv[1]):
                pad.append((t0 + i * bar, t0 + (i + 1) * bar + 0.6, k, vel, 2))

    # section kinds: (prog, melody seed, octave shift, melody mode, pad?)
    sA = seed * 11 + 1
    template = [("A", sA, 0, "full", False), ("A", sA, 12, "full", False), ("B", None, 0, "full", False),
                ("A", "var", 0, "full", True), ("rest", None, 0, "sparse", False), ("C", None, 0, "full", False),
                ("C", None, 12, "full", True), ("B2", None, 0, "full", False), ("A", "var", 12, "full", True),
                ("rest", None, 0, "sparse", True), ("B", None, 0, "full", False), ("A", sA, 0, "full", False)]
    progs = {"A": A, "B": B, "B2": B2, "C": C, "rest": A}
    t = 0.0
    ped = lambda tt, L=bar: pedal.extend([(tt + 0.02, True), (tt + L - 0.06, False)])
    for name in ("I9", "IVmaj7"):                                                     # intro
        notes.extend(lh(name, t, 26, pats[0])); ped(t); t += bar
    final_len = sum(bar * (1 + 0.15 * i) for i in range(4)) + 2.0
    k = 0; n_sec = 0
    while t + 8 * bar + final_len <= target_s + 4 * bar:
        kind, ms, shift, mode, use_pad = template[k % len(template)]
        cycle = k // len(template)
        prog = progs["rest" if kind == "rest" else kind]
        if kind == "rest":
            prog = [A, C, B][(k // 5) % 3]
        vel = int(50 - 6 * min(1.0, t / max(target_s, 1)) - 2 * cycle)                  # drifts softer
        pat = pats[(k + cycle) % len(pats)]
        if ms is None:
            ms = seed * 11 + 100 + k
        if ms == "var":                                                                # theme, new second half
            mel = melody(prog[:4], sA, vel) + [(s + 4 * bar, d, n, v) for s, d, n, v in melody(prog[4:], seed * 11 + 200 + k, vel)]
        else:
            mel = melody(prog, ms if cycle == 0 or ms != sA else ms + 1000 * cycle, vel)
        if mode == "sparse":
            mel = [m for i, m in enumerate(mel) if i % 3 == 0]
        for s, d, n, v in mel:
            n = n + shift
            while n > 84: n -= 12
            notes.append((t + s, t + s + d, n, v - (6 if shift else 0) - (8 if mode == "sparse" else 0), 1))
        if use_pad:
            add_pad(prog, t, 34 if mode == "sparse" else 38)
        for name in prog:
            notes.extend(lh(name, t, 27 - (2 if mode == "sparse" else 0), pat, sparse=(mode == "sparse" and k % 2 == 0)))
            ped(t); t += bar
        k += 1; n_sec += 1
    final = ["IV9", "I9", "IVmaj7", "I"]                                              # plagal, slowing, softer
    for i, name in enumerate(final):
        L = bar * (1 + 0.15 * i)
        notes.extend(lh(name, t, 25 - 2 * i, pats[0])[: (4 if i < 3 else 1)]); ped(t, L); t += L
    notes.append((t - bar, t + 2.0, tonic + 12, 28, 1))
    return notes, pedal, pad, t, dict(bpm=round(bpm, 1), meter=meter, key=tonic, sections=n_sec)


def render_pad(pad, seed, length):
    from scipy.signal import butter, sosfilt
    if not pad:
        return np.zeros((length, 2), np.float32)
    rng = np.random.default_rng(seed + 5)
    x = R.render(R.humanise(pad, rng, vel_sd=3, time_ms=40), R.instrument("vsco_viola"), tail=4.0, seed=seed + 5)
    x = R.reverb(x, R.make_ir({125: 3.0, 250: 2.8, 500: 2.6, 1000: 2.3, 2000: 1.8, 4000: 1.2, 8000: 0.7}), wet=0.45)
    sos = butter(2, 2400, btype="low", fs=R.SR, output="sos")
    x = np.stack([sosfilt(sos, x[:, c]) for c in range(2)], 1).astype(np.float32)
    out = np.zeros((length, 2), np.float32); m = min(length, len(x)); out[:m] = x[:m]
    return out


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("out_dir"); ap.add_argument("--count", type=int, default=8)
    ap.add_argument("--seed", type=int, default=300); ap.add_argument("--total", type=float, default=95.0)
    ap.add_argument("--plan", action="store_true"); ap.add_argument("--only", type=int, default=-1)
    a = ap.parse_args(); os.makedirs(a.out_dir, exist_ok=True)
    lengths = plan_lengths(a.count, a.total, a.seed)
    keys = np.random.default_rng(a.seed + 1).permutation(len(KEYS))
    if a.plan:
        for k, L in enumerate(lengths):
            n, p, pad, dur, info = compose_long(a.seed + k, L * 60, int(keys[k]))
            print(f"composition {k + 1}: target {L:.2f} min, score {dur / 60:.2f} min, {info}")
        return
    SR = R.SR
    for k, L in enumerate(lengths):
        if a.only >= 0 and k != a.only:
            continue
        out = os.path.join(a.out_dir, f"suite_{k}.wav")
        if os.path.exists(out):
            continue
        n, p, pad, dur, info = compose_long(a.seed + k, L * 60, int(keys[k]))
        x = render_notes(n, p, seed=a.seed + k)
        x = x + 0.22 * render_pad(pad, a.seed + k, len(x))
        x, _ = R.master(x, lufs=-21.0, peak_dbtp=-2.0)                          # every composition equally loud
        sf.write(out + ".tmp.wav", x.astype(np.float32), SR, subtype="PCM_24"); os.replace(out + ".tmp.wav", out)
        json.dump(dict(seconds=round(len(x) / SR, 2), **info), open(out[:-4] + ".json", "w"))
        print(f"composition {k + 1}: {info} {len(x) / SR / 60:.2f} min", flush=True)
        del x


def predicted_seconds(k, count=8, seed=300, total=95.0):
    """Length of composition k as rendered (score end + 7 s piano tail, trailing silence trimmed) - for cue
    prediction before the audio exists. Real cues come from the suite_k.json files."""
    lengths = plan_lengths(count, total, seed); keys = np.random.default_rng(seed + 1).permutation(len(KEYS))
    n, p, pad, dur, info = compose_long(seed + k, lengths[k] * 60, int(keys[k]))
    return max(e for _, e, *_ in R.apply_pedal(n, p)) + 7.0


if __name__ == "__main__":
    main()
