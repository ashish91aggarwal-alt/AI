"""Local sample renderer (no GPU): MIDI -> 48 kHz stereo WAV.

Instruments are lists of regions (sample file, key range, velocity range, key centre).
Loaders exist for Salamander Grand Piano (CC BY 3.0) and for note-named sample folders
(VCSL, VSCO-2 CE, both CC0). Samples live outside the repo (see SAMPLES env, default
~/samples); the repo keeps only code.

Usage:
  python3 render.py song.mid out.wav --inst salamander [--seed 1] [--humanise]
  python3 render.py --selftest
"""
import argparse, os, re, sys, glob
from dataclasses import dataclass, field
import numpy as np
import soundfile as sf

SR = 48000
SAMPLES = os.environ.get("SAMPLES", os.path.expanduser("~/samples"))
NOTE = {"C": 0, "C#": 1, "DB": 1, "D": 2, "D#": 3, "EB": 3, "E": 4, "F": 5, "F#": 6, "GB": 6,
        "G": 7, "G#": 8, "AB": 8, "A": 9, "A#": 10, "BB": 10, "B": 11}


def note_num(name):
    m = re.fullmatch(r"([A-Ga-g][#bB]?)(-?\d)", name)
    if not m:
        raise ValueError(name)
    return 12 * (int(m.group(2)) + 1) + NOTE[m.group(1).upper()]


@dataclass
class Region:
    path: str
    key_lo: int
    key_hi: int
    centre: int
    vel_lo: int = 1
    vel_hi: int = 127
    tune: float = 0.0          # cents
    gain_db: float = 0.0
    rr: int = 1                # round-robin index (1-based)


@dataclass
class Instrument:
    name: str
    regions: list
    release_regions: dict = field(default_factory=dict)   # key -> Region (release noise)
    release_db: float = -37.0
    release_time: float = 0.35          # damper fade, seconds (scaled by pitch)
    veltrack: float = 0.73              # how much velocity changes loudness inside a layer
    max_shift: float = 2.0              # semitones; refuse larger pitch shifts
    attack: float = 0.0                 # seconds (for pads/strings)

    def pick(self, key, vel, rr_counter):
        cands = [r for r in self.regions if r.key_lo <= key <= r.key_hi and r.vel_lo <= vel <= r.vel_hi]
        if not cands:   # nearest velocity layer for this key
            ks = [r for r in self.regions if r.key_lo <= key <= r.key_hi]
            if not ks:
                raise ValueError(f"{self.name}: no sample for key {key}")
            best = min(abs((r.vel_lo + r.vel_hi) / 2 - vel) for r in ks)
            cands = [r for r in ks if abs((r.vel_lo + r.vel_hi) / 2 - vel) == best]
        rrs = sorted({r.rr for r in cands})
        want = rrs[rr_counter % len(rrs)]
        return [r for r in cands if r.rr == want][0]


_cache = {}


def load(path):
    if path not in _cache:
        x, sr = sf.read(path, dtype="float32", always_2d=True)
        if x.shape[1] == 1:
            x = np.repeat(x, 2, axis=1)
        if sr != SR:
            x = resample(x, SR / sr)
        _cache[path] = x[:, :2]
    return _cache[path]


def resample(x, ratio):
    """ratio = out_rate / in_rate. High-quality sinc (libsamplerate)."""
    import samplerate
    if abs(ratio - 1) < 1e-9:
        return x
    return samplerate.resample(x, ratio, "sinc_best").astype(np.float32)


# ---------------------------------------------------------------- loaders
def salamander(root=None):
    root = root or os.path.join(SAMPLES, "SalamanderGrandPiano")
    notes = open(os.path.join(root, "Data/region.txt")).read()
    groups = open(os.path.join(root, "Data/notes.txt")).read()
    vel = [(int(a), int(b)) for a, b in re.findall(r"lovel=(\d+) hivel=(\d+)", groups)]
    assert len(vel) == 16, vel
    regs = []
    for lo, hi, c, s in re.findall(r"lokey=(\d+) hikey=(\d+) pitch_keycenter=(\d+) sample=(\S+?)\$VEL", notes):
        for i, (vl, vh) in enumerate(vel, 1):
            regs.append(Region(os.path.join(root, "Samples", f"{s}v{i}.flac"), int(lo), int(hi), int(c), vl, vh))
    rel = {k: Region(os.path.join(root, "Samples", f"rel{k - 20}.flac"), k, k, k) for k in range(21, 109)}
    return Instrument("salamander", regs, rel, release_db=-37.0, release_time=0.35, veltrack=0.73, max_shift=1.5)


def note_folder(name, pattern, vel_layers=None, root=None, attack=0.0, release_time=0.4, max_shift=2.0, label_shift=0):
    """Generic loader: files whose names contain a note name like C4 / F#3 (and optional v1/vl2, rr1).
    pattern: glob relative to SAMPLES."""
    """label_shift: semitones to add to the note named in the file (VCSL names middle C "C3": +12,
    measured with a YIN pitch check on 17 Nov)."""
    files = sorted(glob.glob(os.path.join(root or SAMPLES, pattern)))
    if not files:
        raise FileNotFoundError(pattern)
    parsed = []
    for f in files:
        b = os.path.basename(f)
        m = re.search(r"(?<![A-Za-z])([A-G][#b]?)(-?\d)(?!\d)", b)
        if not m:
            continue
        key = note_num(m.group(1) + m.group(2)) + label_shift
        v = re.search(r"(?:_v|vl|_vel)(\d+)", b, re.I)
        r = re.search(r"rr(\d+)|_(\d+)\.wav$", b, re.I)
        parsed.append((key, int(v.group(1)) if v else 1, int((r.group(1) or r.group(2))) if r else 1, f))
    layers = sorted({p[1] for p in parsed})
    n = len(layers)
    bounds = vel_layers or [(1 + i * 127 // n, (i + 1) * 127 // n) for i in range(n)]
    keys = sorted({p[0] for p in parsed})
    regs = []
    for key, v, rr, f in parsed:
        i = keys.index(key)
        lo = key if i == 0 else (keys[i - 1] + key) // 2 + 1
        hi = key if i == len(keys) - 1 else (key + keys[i + 1]) // 2
        if i == 0:
            lo = key - int(max_shift)
        if i == len(keys) - 1:
            hi = key + int(max_shift)
        vl, vh = bounds[layers.index(v)]
        regs.append(Region(f, lo, hi, key, vl, vh, rr=rr))
    return Instrument(name, regs, attack=attack, release_time=release_time, max_shift=max_shift)


def instrument(name):
    if name == "salamander":
        return salamander()
    if name == "vsco_cello":
        return note_folder(name, "VSCO-2-CE/Strings/Cello Section/susvib/*.wav", attack=0.25, release_time=0.8)
    if name == "vsco_viola":
        return note_folder(name, "VSCO-2-CE/Strings/Viola Section/susvib/*.wav", attack=0.25, release_time=0.8)
    if name == "vsco_violins":
        return note_folder(name, "VSCO-2-CE/Strings/Violin Section/susVib/*.wav", attack=0.25, release_time=0.8)
    if name == "vcsl_alto_recorder":
        return note_folder(name, "VCSL/Aerophones/Edge-blown Aerophones/Baroque Alto Recorder/SusVib/*.wav",
                           attack=0.04, release_time=0.12, label_shift=12)
    if name == "vcsl_tenor_recorder":
        return note_folder(name, "VCSL/Aerophones/Edge-blown Aerophones/Baroque Tenor Recorder/SusVib/*.wav",
                           attack=0.04, release_time=0.12, label_shift=12)
    if name == "vcsl_folk_harp":
        return note_folder(name, "VCSL/Chordophones/Composite Chordophones/Folk Harp/*.wav",
                           release_time=1.2, label_shift=12)
    raise ValueError(name)


# ---------------------------------------------------------------- MIDI
def read_midi(path):
    """-> notes [(start_s, end_s, key, vel, channel)], pedal [(t, down)]"""
    import mido
    mid = mido.MidiFile(path)
    t = 0.0
    on, notes, pedal = {}, [], []
    for msg in mid:              # iterating a MidiFile yields delta times in seconds
        t += msg.time
        if msg.type == "note_on" and msg.velocity > 0:
            on.setdefault((msg.channel, msg.note), []).append((t, msg.velocity))
        elif msg.type in ("note_off", "note_on"):
            st = on.get((msg.channel, msg.note))
            if st:
                s, v = st.pop(0)
                notes.append((s, t, msg.note, v, msg.channel))
        elif msg.type == "control_change" and msg.control == 64:
            pedal.append((t, msg.value >= 64))
    return sorted(notes), pedal


def apply_pedal(notes, pedal):
    """A note released while the pedal is down sounds until the pedal comes up."""
    if not pedal:
        return notes
    ups = [t for t, d in pedal if not d]
    out = []
    for s, e, k, v, c in notes:
        down = False
        for t, d in pedal:
            if t <= e:
                down = d
        if down:
            later = [u for u in ups if u > e]
            e = later[0] if later else e + 4.0
        out.append((s, e, k, v, c))
    return out


def humanise(notes, rng, vel_sd=8, time_ms=12):
    out = []
    for s, e, k, v, c in notes:
        dt = rng.uniform(-time_ms, time_ms) / 1000
        v2 = int(np.clip(v + rng.integers(-vel_sd, vel_sd + 1), 1, 127))
        out.append((max(0, s + dt), max(s + dt + 0.03, e + dt), k, v2, c))
    return out


# ---------------------------------------------------------------- render
def render(notes, inst, tail=6.0, drift_cents=3.0, seed=1):
    rng = np.random.default_rng(seed)
    end = max(e for _, e, *_ in notes) + tail
    out = np.zeros((int(end * SR) + SR, 2), np.float32)
    rr_counter = {}
    last_start = {}
    for s, e, k, v, c in notes:
        rr_counter[k] = rr_counter.get(k, 0) + 1
        reg = inst.pick(k, v, rr_counter[k])
        shift = k - reg.centre + reg.tune / 100
        # tiny drift between repeated notes so repeats never sound identical (renderer rule)
        if last_start.get(k) is not None:
            shift += rng.uniform(-drift_cents, drift_cents) / 100
        last_start[k] = s
        if abs(shift) > inst.max_shift + 0.1:
            raise ValueError(f"{inst.name}: shift {shift:.2f} st for key {k} exceeds limit")
        x = load(reg.path)
        if abs(shift) > 1e-4:
            x = resample(x, 2 ** (-shift / 12))
        # loudness inside the layer: (v / layer top) ^ (veltrack * 2)
        g = (v / max(reg.vel_hi, 1)) ** (inst.veltrack * 2) * 10 ** (reg.gain_db / 20)
        hold = int((e - s) * SR)
        rel_t = inst.release_time * (1.6 if k < 48 else 1.0 if k < 72 else 0.6)
        rel_n = int(rel_t * 5 * SR)          # fade to ~-43 dB
        n = min(len(x), hold + rel_n)
        env = np.ones(n, np.float32)
        if inst.attack > 0:
            a = min(n, int(inst.attack * SR))
            env[:a] = np.linspace(0, 1, a, dtype=np.float32) ** 2
        if hold < n:
            tt = np.arange(n - hold, dtype=np.float32) / SR
            env[hold:] *= np.exp(-tt / rel_t)
        # 2 ms fade at the very end to avoid a click
        f = min(n, 96)
        env[-f:] *= np.linspace(1, 0, f, dtype=np.float32)
        i0 = int(s * SR)
        seg = x[:n] * (env * g)[:, None]
        out[i0:i0 + n] += seg[: len(out) - i0]
        # release noise (damper) for pianos
        if k in inst.release_regions and hold < len(x):
            r = load(inst.release_regions[k].path)
            rg = g * 10 ** (inst.release_db / 20)
            j = i0 + hold
            m = min(len(r), len(out) - j)
            if m > 0:
                out[j:j + m] += r[:m] * rg
    nz = np.nonzero(np.abs(out).max(1) > 1e-5)[0]
    return out[: (nz[-1] + 1 if len(nz) else 1)]


# ---------------------------------------------------------------- room
def make_ir(rt60_bands, sr=SR, seed=7, predelay=0.012):
    """Stereo IR from decaying noise. rt60_bands: {centre_hz: rt60_s} (octave bands)."""
    from scipy.signal import butter, sosfilt
    rng = np.random.default_rng(seed)
    T = max(rt60_bands.values()) * 1.2
    n = int(T * sr)
    t = np.arange(n) / sr
    ir = np.zeros((n, 2))
    for fc, rt in rt60_bands.items():
        lo, hi = fc / np.sqrt(2), min(fc * np.sqrt(2), sr / 2 * 0.95)
        sos = butter(4, [lo, hi], btype="band", fs=sr, output="sos")
        for ch in range(2):
            ir[:, ch] += sosfilt(sos, rng.standard_normal(n)) * 10 ** (-3 * t / rt)
    ir /= np.sqrt((ir ** 2).sum(0)).max()
    pad = np.zeros((int(predelay * sr), 2))
    return np.vstack([pad, ir]).astype(np.float32)


def reverb(x, ir, wet=0.25):
    from scipy.signal import fftconvolve
    y = np.stack([fftconvolve(x[:, c], ir[:, c]) for c in range(2)], 1)[: len(x) + len(ir)]
    dry = np.vstack([x, np.zeros((len(y) - len(x), 2), np.float32)])
    return (dry * (1 - wet) + y * wet).astype(np.float32)


def master(x, lufs=-19.0, peak_dbtp=-1.0):
    import pyloudnorm as pyln
    m = pyln.Meter(SR)
    L = m.integrated_loudness(x)
    y = x * 10 ** ((lufs - L) / 20)
    # true-peak estimate with 4x oversampling; simple gain limit (no compressor colouring)
    tp = np.abs(resample(y, 4.0)).max()
    lim = 10 ** (peak_dbtp / 20)
    if tp > lim:
        y = y * (lim / tp)
    return y.astype(np.float32), L


# ---------------------------------------------------------------- checks
def clicks(x, thresh=0.2):
    """Count sample-to-sample jumps far above the local signal (click detector)."""
    d = np.abs(np.diff(x.mean(1)))
    from scipy.ndimage import uniform_filter1d
    local = uniform_filter1d(d, 480) + 1e-6
    return int(((d > thresh) & (d > 20 * local)).sum())


def selftest(out_dir="/tmp/render_selftest"):
    import mido
    os.makedirs(out_dir, exist_ok=True)
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(66)))
    seq = [(60, 40), (64, 50), (67, 60), (72, 70), (67, 45), (64, 35), (60, 30)]
    for k, v in seq:                           # soft melody, pp-mp
        tr.append(mido.Message("note_on", note=k, velocity=v, time=0))
        tr.append(mido.Message("note_off", note=k, velocity=0, time=480))
    tr.append(mido.Message("control_change", control=64, value=127, time=0))
    for k in (48, 55, 64, 67, 71):             # pedalled chord, Cmaj7
        tr.append(mido.Message("note_on", note=k, velocity=45, time=0))
    tr.append(mido.Message("note_off", note=48, velocity=0, time=960))
    for k in (55, 64, 67, 71):
        tr.append(mido.Message("note_off", note=k, velocity=0, time=0))
    tr.append(mido.Message("control_change", control=64, value=0, time=960))
    p = os.path.join(out_dir, "test.mid"); mid.save(p)
    notes, pedal = read_midi(p)
    notes = humanise(apply_pedal(notes, pedal), np.random.default_rng(1))
    x = render(notes, salamander())
    ir = make_ir({125: 2.2, 250: 2.0, 500: 1.8, 1000: 1.6, 2000: 1.3, 4000: 1.0, 8000: 0.7})
    y, L0 = master(reverb(x, ir, 0.22))
    sf.write(os.path.join(out_dir, "test.wav"), y, SR, subtype="PCM_24")
    c = clicks(x)
    print(f"selftest: {len(notes)} notes, {len(y)/SR:.1f} s, raw LUFS {L0:.1f}, clicks {c}, peak {20*np.log10(np.abs(y).max()):.2f} dBFS")
    return c == 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("midi", nargs="?")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--inst", default="salamander")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--humanise", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        sys.exit(0 if selftest() else 1)
    notes, pedal = read_midi(a.midi)
    notes = apply_pedal(notes, pedal)
    if a.humanise:
        notes = humanise(notes, np.random.default_rng(a.seed))
    x = render(notes, instrument(a.inst), seed=a.seed)
    sf.write(a.out, x, SR, subtype="FLOAT")
