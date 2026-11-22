"""Public-domain music sets for the sleepy-cat videos (owner 19 Nov: "make multiple sets of different music,
10-15 minutes each; music from 1500s-1900s has no copyright, you can change it, keep it for a sleeping cat").

Only the COMPOSITIONS are old (all composers died long before 1955, works published before 1929); every
performance is rendered here from the score with CC0 / CC-BY samples, so no recording rights are involved.
Scores come from the music21 corpus (pip install music21). Old-record sound is our own processing.

Sets (each about 12 min, all slow and soft):
  hymns   Fireside Hymns: Bach chorales (1700s) on a soft felt piano, very slow, long fermatas
  airs    Irish & Scottish slow airs (O'Neill 1903 / Aird 1780s) on folk harp with a soft cello root
  record  Old Gramophone: Corelli, Handel, Mozart, Schubert, Schumann, Beach slow pieces on strings and
          piano, then made to sound like an old 78 record (narrow band, warm, gentle crackle, slight wow)

python3 pd_sets.py <out_dir> hymns|airs|record|all  [--seconds 720]
Writes <set>_music.wav (mastered -21 LUFS) and <set>_mix.wav (with the fire and wind beds, -20 LUFS).
"""
import argparse, os, sys, subprocess, warnings
import numpy as np
warnings.filterwarnings("ignore")
os.environ.setdefault("SAMPLES", "/home/claude/samples")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render as R
from music21 import corpus, expressions, key as m21key, harmony, roman

SR = R.SR
HERE = os.path.dirname(os.path.abspath(__file__))


# ------------------------------------------------------------------ score -> timed notes
def timemap(fermatas, qbpm, end_q, hold_beats=1.5, rit_q=4.0, rit=1.6):
    """quarter offset -> seconds: steady tempo, a hold after each fermata, a slow-down over the last bar."""
    fer = sorted(set(round(f, 3) for f in fermatas))
    def t(q):
        base = q * 60 / qbpm
        base += hold_beats * 60 / qbpm * sum(1 for f in fer if f <= q - 1e-6)
        if q > end_q - rit_q:                      # ritardando: integrate a growing beat length
            x = min(q, end_q) - (end_q - rit_q)
            base += (rit - 1) * 60 / qbpm * x * x / (2 * rit_q)
        return base
    return t


def score_notes(score, qbpm, parts, t0=0.0, hold_beats=1.5, transpose=0):
    """parts: list (per score part index) of (instrument, velocity, octave shift) or None to skip.
    -> {instrument: [(start, end, key, vel, ch)]}, end time"""
    fermatas, end_q = [], float(score.highestTime)
    sp = list(score.parts)
    for p in sp:
        for n in p.recurse().notes:
            if any(isinstance(e, expressions.Fermata) for e in n.expressions):
                fermatas.append(float(n.getOffsetInHierarchy(score)) + float(n.quarterLength))
    tm = timemap(fermatas, qbpm, end_q, hold_beats)
    out = {}
    for pi, p in enumerate(sp):
        if pi >= len(parts) or parts[pi] is None:
            continue
        inst, vel, octv = parts[pi]
        for n in p.stripTies().recurse().notes:
            if n.quarterLength <= 0:
                continue                                       # grace notes
            q0 = float(n.getOffsetInHierarchy(score)); q1 = q0 + float(n.quarterLength)
            s, e = t0 + tm(q0), t0 + tm(q1)
            for pt in n.pitches:
                k = int(pt.midi) + 12 * octv + transpose
                out.setdefault(inst, []).append((s, s + (e - s) * 0.97, k, vel, pi))
    return out, t0 + tm(end_q)


def merge(a, b):
    for k, v in b.items():
        a.setdefault(k, []).extend(v)
    return a


def render_groups(groups, gains, seed=1, tail=8.0):
    mix = None
    for inst, notes in groups.items():
        rng = np.random.default_rng(seed)
        I_ = R.instrument(inst)
        lo, hi = min(r.key_lo for r in I_.regions), max(r.key_hi for r in I_.regions)
        fixed = []
        for s_, e_, k_, v_, c_ in notes:      # fold notes outside the sampled range by octaves (violins stop at B5)
            while k_ > hi: k_ -= 12
            while k_ < lo: k_ += 12
            fixed.append((s_, e_, k_, v_, c_))
        notes = fixed
        notes = R.humanise(sorted(notes), rng, vel_sd=3, time_ms=10)
        x = R.render(notes, I_, tail=tail, seed=seed)
        x = np.repeat(x[:, :1], 2, axis=1)    # one channel: stereo samples (harp) were anti-phase (corr -0.01); the room gives width
        x = x * 10 ** (gains.get(inst, 0) / 20)
        if mix is None:
            mix = x
        else:
            n = max(len(mix), len(x))
            mix = np.pad(mix, ((0, n - len(mix)), (0, 0))); mix[:len(x)] += x
    return mix


def room(x, big=False):
    from scipy.signal import butter, sosfilt
    rt = {125: 2.6, 250: 2.4, 500: 2.2, 1000: 2.0, 2000: 1.6, 4000: 1.2, 8000: 0.8} if big else \
         {125: 2.0, 250: 1.9, 500: 1.7, 1000: 1.5, 2000: 1.2, 4000: 0.9, 8000: 0.6}
    x = R.reverb(x, R.make_ir(rt), wet=0.30 if big else 0.24)
    lp = butter(2, 6000, btype="low", fs=SR, output="sos")
    x = 0.75 * x + 0.25 * np.stack([sosfilt(lp, x[:, c]) for c in range(2)], 1)
    bp = butter(2, [200, 420], btype="band", fs=SR, output="sos")
    return (x - 0.25 * np.stack([sosfilt(bp, x[:, c]) for c in range(2)], 1)).astype(np.float32)


# ------------------------------------------------------------------ set 1: hymns
HYMNS = ["bach/bwv269", "bach/bwv277", "bach/bwv367", "bach/bwv311", "bach/bwv26.6", "bach/bwv354",
         "bach/bwv414", "bach/bwv281", "bach/bwv355", "bach/bwv433", "bach/bwv38.6", "bach/bwv295"]


def set_hymns(target):
    groups, t = {}, 2.0
    used = []
    for nm in HYMNS:
        try:
            sc = corpus.parse(nm)
        except Exception:
            continue
        if len(sc.parts) < 4:
            continue
        # soprano carries the tune; inner voices and bass soft; a little lower in the keyboard = warmer
        g, end = score_notes(sc, qbpm=46, parts=[("salamander", 40, 0), ("salamander", 28, 0), ("salamander", 27, 0),
                                                   ("salamander", 30, 0)], t0=t, hold_beats=1.8)   # an octave down was 70% bass
        merge(groups, g); used.append(nm); t = end + 4.0
        if t > target:
            break
    print("hymns:", used, round(t / 60, 1), "min")
    return room(render_groups(groups, {"salamander": 0}, seed=3), big=True)


# ------------------------------------------------------------------ set 2: slow airs on harp
AIRS = [("oneills1850/0051-0100.abc", "SLEEP ON MY KATHLEEN DEAR"), ("oneills1850/0301-0350.abc", "AN IRISH LULLABY"),
        ("oneills1850/0501-0550.abc", "Rocking the Cradle"), ("oneills1850/0101-0200.abc", "Londonderry Love Song"),
        ("oneills1850/0201-0300.abc", "Summer Evening"), ("oneills1850/0550-0625.abc", "Night Was Calm., The"),
        ("oneills1850/0626-0700.abc", "O'Carolan's Farewell to Music"), ("oneills1850/0900-0950.abc", "My Darling Asleep."),
        ("oneills1850/0201-0300.abc", "Of in the Stilly Night"), ("essenFolksong/folkHaydn.abc", "Sleepie Bodie"),
        ("oneills1850/0301-0350.abc", "THE FOX'S SLEEP"), ("oneills1850/0501-0550.abc", "The Flowers of the Forest")]


def chord_per_bar(mel_notes, k):
    """Pick I, IV, V or vi per bar from the melody's pitch classes (simple, consonant harp accompaniment)."""
    tonic = k.tonic.pitchClass; minor = k.mode == "minor"
    cands = {"i": (0, 3, 7), "iv": (5, 8, 0), "v": (7, 11, 2), "VI": (8, 0, 3)} if minor else \
            {"I": (0, 4, 7), "IV": (5, 9, 0), "V": (7, 11, 2), "vi": (9, 0, 4)}
    best, bs = None, -1
    for nm, pcs in cands.items():
        pcs = [(tonic + p) % 12 for p in pcs]
        sc = sum(d * (2 if (m % 12) == pcs[0] else 1) for m, d in mel_notes if m % 12 in pcs)
        sc += 0.3 if nm.lower() == "i" else 0
        if sc > bs:
            best, bs = pcs, sc
    return best


def set_airs(target):
    groups, t, used = {}, 2.0, []
    for path, title in AIRS:
        try:
            op = corpus.parse(path)
        except Exception as e:
            print("skip", path, e); continue
        scs = [s for s in (op.scores if hasattr(op, "scores") else [op]) if (s.metadata.title or "").strip() == title.strip()]
        if not scs:
            print("not found", title); continue
        sc = scs[0]
        ts = sc.recurse().getElementsByClass("TimeSignature")
        num, den = (ts[0].numerator, ts[0].denominator) if ts else (3, 4)
        qbpm = 40 * 1.5 if (den == 8 and num % 3 == 0) else 56        # dotted quarter 40 in compound time, else quarter 56
        k = sc.analyze("key")
        for rep in range(2):                                            # each air twice: plain, then an octave lower
            octv = 0                                                # (an octave down made it muddy)
            g, end = score_notes(sc, qbpm, [("vcsl_folk_harp", 46, octv)], t0=t, hold_beats=1.0)
            merge(groups, g)
            # accompaniment: per bar a low harp chord (root, fifth, third above) and a soft cello root
            for m in sc.parts[0].getElementsByClass("Measure") if sc.parts else sc.getElementsByClass("Measure"):
                mq = float(m.getOffsetInHierarchy(sc)); mel = [(int(n.pitch.midi), float(n.quarterLength)) for n in m.notes if hasattr(n, "pitch")]
                if not mel:
                    continue
                pcs = chord_per_bar(mel, k)
                root = 43 + (pcs[0] - 7) % 12                             # G2..F#3 (C2 roots were boomy)
                s0 = t + mq * 60 / qbpm; bar = float(m.barDuration.quarterLength) * 60 / qbpm
                for j, iv in enumerate((0, 7, 12 + ((pcs[1] - pcs[0]) % 12))):
                    groups.setdefault("vcsl_folk_harp", []).append((s0 + j * 0.18, s0 + bar * 0.95, root + 12 + iv, 30 - 3 * j, 9))
                groups.setdefault("vsco_cello", []).append((s0, s0 + bar * 1.02, root, 22, 8))
            t = end + 2.5
        used.append(title); t += 2.0
        if t > target:
            break
    print("airs:", used, round(t / 60, 1), "min")
    return room(render_groups(groups, {"vcsl_folk_harp": 0, "vsco_cello": -9}, seed=5))


# ------------------------------------------------------------------ set 2b: piano nocturnes (replaces the harp airs)
# owner 19 Nov: the harp-airs set "is not nice" (sampled harp + guessed chords). The Salamander piano is our most
# natural instrument, so the slow old pieces are played as soft solo piano arrangements of their full scores.
P_ = lambda v, o=0: ("salamander", v, o)
NOCTURNES = [
    ("bach/bwv846.mxl", 50, [P_(32), P_(30)]),
    ("schumann_robert/dichterliebe_no2.xml", 40, [P_(38), P_(28), P_(28)]),
    ("beach/prayer_of_a_tired_child.musicxml", 44, [P_(36), None, P_(26), None, P_(27), P_(27)]),
    ("handel/rinaldo/Lascia_chio_pianga.mxl", 50, [P_(38), P_(27), P_(28)]),
    ("corelli/opus3no1/1grave.xml", 40, [P_(36), P_(29), P_(30)]),
    ("haydn/opus74no1/movement2.mxl", 50, [P_(36), P_(27), P_(26), P_(29)]),
    ("mozart/k156/movement2.mxl", 44, [P_(36), P_(27), P_(26), P_(29)]),
]


def set_nocturnes(target):
    groups, t, used = {}, 2.0, []
    for path, q, parts in NOCTURNES:
        try:
            sc = corpus.parse(path)
        except Exception as e:
            print("skip", path, e); continue
        g, end = score_notes(sc, q, parts, t0=t, hold_beats=1.5)
        merge(groups, g); used.append(path.split("/")[0]); t = end + 4.0
        if t > target:
            break
    print("nocturnes:", used, round(t / 60, 1), "min")
    return room(render_groups(groups, {"salamander": 0}, seed=9), big=True)


# ------------------------------------------------------------------ set 3: old gramophone
RECORD = [  # (corpus path, quarter bpm, parts)
    ("corelli/opus3no1/1grave.xml", 40, [("vsco_violins", 44, 0), ("vsco_viola", 40, 0), ("vsco_cello", 44, 0)]),
    ("handel/rinaldo/Lascia_chio_pianga.mxl", 52, [("vsco_violins", 48, 0), ("salamander", 32, 0), ("salamander", 32, 0)]),
    ("schumann_robert/dichterliebe_no2.xml", 40, [("vsco_cello", 46, 0), ("salamander", 30, 0), ("salamander", 30, 0)]),
    ("beach/prayer_of_a_tired_child.musicxml", 46, [("vsco_violins", 44, 0), None, ("vsco_viola", 36, 0), None,
                                                     ("salamander", 30, 0), ("salamander", 30, 0)]),
    ("mozart/k156/movement2.mxl", 46, [("vsco_violins", 42, 0), ("vsco_violins", 36, -1), ("vsco_viola", 36, 0),
                                       ("vsco_cello", 40, 0)]),
]


def gramophone(x, seed=11):
    """Our own 'old 78 record' sound: narrow band, warm saturation, slight wow, gentle hiss and crackle."""
    from scipy.signal import butter, sosfilt
    rng = np.random.default_rng(seed)
    m = x.mean(1)
    m = sosfilt(butter(1, [110, 7500], btype="band", fs=SR, output="sos"), m)   # gentle: was 170-5200 Hz, 2nd order
    m = np.tanh(m * 1.3) / 1.3                                                   # (owner: that set sounded louder)
    n = len(m); t = np.arange(n) / SR
    wow = 1 + 0.0012 * np.sin(2 * np.pi * 0.55 * t) + 0.0004 * np.sin(2 * np.pi * 6.3 * t)   # 78 rpm wobble
    idx = np.clip(np.cumsum(wow) - wow[0], 0, n - 1)
    m = np.interp(idx, np.arange(n), m)
    hiss = sosfilt(butter(2, [2000, 7000], btype="band", fs=SR, output="sos"), rng.normal(size=n)) * 0.0025
    cr = np.zeros(n); pos = rng.integers(0, n, int(n / SR * 7))
    cr[pos] = rng.normal(size=len(pos)) * rng.uniform(0.02, 0.10, len(pos))
    cr = sosfilt(butter(2, [800, 6000], btype="band", fs=SR, output="sos"), cr)
    y = m + hiss + cr
    return np.stack([y, y], 1).astype(np.float32) * 0.75 + 0.25 * x[:len(y)]


def set_record(target):
    groups, t, used = {}, 2.0, []
    for path, q, parts in RECORD:
        try:
            sc = corpus.parse(path)
        except Exception as e:
            print("skip", path, e); continue
        g, end = score_notes(sc, q, parts, t0=t, hold_beats=1.5)
        merge(groups, g); used.append(path.split("/")[0]); t = end + 4.0
        if t > target:
            break
    print("record:", used, round(t / 60, 1), "min")
    x = room(render_groups(groups, {"vsco_violins": -2, "vsco_viola": -3, "vsco_cello": -2, "salamander": 0}, seed=7))
    return gramophone(x)


# ------------------------------------------------------------------ beds and master
SEEDS = {"hymns": 11, "airs": 12, "record": 13, "original": 4, "nocturnes": 16}   # own fire/wind bed per set: no shared audible loop
TARGET_LUFS = -21.0                                               # owner 19 Nov: every set equally loud


def match_loudness(path_in, path_out, target=TARGET_LUFS):
    """Linear gain to exactly the target integrated loudness (no dynamic loudnorm, so every set keeps the same feel)."""
    import re
    r = subprocess.run(["ffmpeg", "-nostats", "-i", path_in, "-filter_complex", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path_in, "-af", f"volume={target - I:.2f}dB,alimiter=limit=0.79:level=false",
                    path_out], check=True)
    return I


def finish(x, out_dir, name, seconds):
    import soundfile as sf
    from c4_music import wind
    total = int(seconds * SR)
    x = np.concatenate([x, np.zeros((max(0, total - len(x)), 2), np.float32)])[:total] if seconds else x
    seconds = len(x) / SR
    f = int(6 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    p, L = R.master(x, lufs=-21.0, peak_dbtp=-2.0)
    music = os.path.join(out_dir, f"{name}_music_m.wav"); sf.write(music, p, SR, subtype="PCM_24")
    w, _ = R.master(wind(seconds, seed=SEEDS.get(name, 5)), lufs=-38.0, peak_dbtp=-12.0)
    sf.write(os.path.join(out_dir, "wind_tmp.wav"), w, SR, subtype="PCM_24")
    subprocess.run([sys.executable, os.path.join(HERE, "fire_ambience.py"), os.path.join(out_dir, "fire_tmp.wav"),
                    str(int(seconds) + 1), str(SEEDS.get(name, 4))], check=True)
    out = os.path.join(out_dir, f"{name}_mix.flac"); raw = os.path.join(out_dir, f"{name}_raw.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", music, "-i", os.path.join(out_dir, "fire_tmp.wav"),
                    "-i", os.path.join(out_dir, "wind_tmp.wav"), "-filter_complex",
                    "[1:a]volume=-8dB[f];[2:a]volume=-3dB[w];[0:a][f][w]amix=inputs=3:normalize=0",
                    "-ar", "48000", "-t", str(seconds), raw], check=True)
    if name == "record":     # the record set's loudness range was 9.1 LU vs 6.4-7.6 for the others: gentle squeeze
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af",
                        "acompressor=threshold=0.06:ratio=1.35:attack=80:release=900:makeup=1", raw + ".c.wav"], check=True)
        os.replace(raw + ".c.wav", raw)
    match_loudness(raw, out); os.remove(raw)
    for f in ("fire_tmp.wav", "wind_tmp.wav"):
        os.remove(os.path.join(out_dir, f))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", music, music.replace(".wav", ".flac")], check=True); os.remove(music)
    print(name, "->", out, round(seconds / 60, 1), "min")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("out_dir"); ap.add_argument("which")
    ap.add_argument("--seconds", type=float, default=0, help="pad/cut to this length (0 = natural length)")
    ap.add_argument("--target", type=float, default=720, help="stop adding pieces after this many seconds")
    ap.add_argument("--music", default="", help="use this already-rendered music file (e.g. the original piano set)")
    a = ap.parse_args(); os.makedirs(a.out_dir, exist_ok=True)
    for w in (["hymns", "airs", "record"] if a.which == "all" else [a.which]):    # 'original' needs --music
        done = a.music or os.path.join(a.out_dir, f"{w}_music.wav")
        if not os.path.exists(done):
            done = done.replace(".wav", ".flac")
        if os.path.exists(done):                     # music already rendered: only redo the beds and the mix
            import soundfile as sf
            x = sf.read(done, dtype="float32")[0]
        else:
            x = {"hymns": set_hymns, "airs": set_airs, "record": set_record, "nocturnes": set_nocturnes}[w](a.target)
        finish(x, a.out_dir, w, a.seconds)
