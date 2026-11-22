"""Original soothing piano lullabies, composed by rule (owner 19 Nov: "your music sounds suspicious sometimes, which
alerts the mind - choose soothing, calming, snoozing melodies, and keep the tempo accordingly").

What makes music calm here (and what alerted before: minor keys, chromatic and suspended dissonances, lament basses,
dominant tension in old chorales and arias):
  - major keys only, warm low-middle register, nothing above C6
  - only gentle chords: I, IV, vi, iii and their add9 / maj7 colours; V only as a soft V(sus4) that resolves at once;
    endings are plagal (IV -> I) - no strong dominant pull
  - melody on the major pentatonic (no 4th or 7th degree, so no half-step tension), mostly stepwise, small range,
    long notes, phrase ends on a chord tone and rests
  - slow: 46-54 bpm, 3/4 or 4/4; soft touch; left hand flowing broken chords under a sustain pedal
  - form: intro, A, A (octave up), B (around IV), A, outro - about 3.5-4.5 minutes, every piece different

python3 lullabies.py out_dir --count 14 [--seed 100]
Writes out_dir/lullabies_music.wav (pieces 4 s apart, -21 LUFS) and out_dir/lullabies_cues.json (piece times).
"""
import argparse, json, os, sys
import numpy as np
import soundfile as sf

os.environ.setdefault("SAMPLES", "/home/claude/samples")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render as R
from c4_music import render_notes

PENTA = [0, 2, 4, 7, 9]                          # major pentatonic degrees (semitones above the tonic)
# chord = (root degree in semitones, chord tones above the root)
CHORDS = {
    "I": (0, [0, 4, 7, 14]), "Imaj7": (0, [0, 4, 7, 11]), "I9": (0, [0, 7, 14, 16]),
    "IV": (5, [0, 4, 7, 14]), "IVmaj7": (5, [0, 4, 7, 11]), "IV9": (5, [0, 7, 14, 16]),
    "vi": (9, [0, 3, 7, 14]), "vi7": (9, [0, 3, 7, 10]), "iii": (4, [0, 3, 7, 10]),
    "ii7": (2, [0, 3, 7, 10]), "Vsus": (7, [0, 5, 7, 14]), "I/3": (4, [0, 3, 8, 15]),
}
PROGS = [  # 8-bar phrases, all soft
    ["I", "IVmaj7", "vi7", "IV9", "I", "vi", "IVmaj7", "I9"],
    ["Imaj7", "vi7", "IVmaj7", "I", "IV9", "I/3", "IV", "I"],
    ["I9", "IV", "I", "vi7", "IVmaj7", "I", "IV9", "I"],
    ["Imaj7", "vi7", "IVmaj7", "I", "vi7", "IV", "Vsus", "I9"],
    ["I", "IV9", "vi", "I/3", "IVmaj7", "I/3", "IV", "I"],
]
B_PROGS = [
    ["IVmaj7", "I", "vi7", "IV9", "IVmaj7", "I/3", "IV", "Vsus"],
    ["IV9", "I/3", "vi7", "IVmaj7", "IV", "I", "IV", "Vsus"],
    ["vi7", "IVmaj7", "I", "IV9", "vi", "I/3", "IVmaj7", "Vsus"],
]
RHYTHMS_4 = [[2, 2], [3, 1], [2, 1, 1], [1, 1, 2], [4], [1.5, 0.5, 2], [2, 2], [3, 1]]
RHYTHMS_3 = [[2, 1], [3], [1, 1, 1], [1.5, 0.5, 1], [2, 1], [3]]
KEYS = [61, 66, 63, 68, 65, 70, 60, 67, 62, 64]   # Db Gb Eb Ab F Bb C G D E (tonic, MIDI around middle C)


def compose(seed):
    rng = np.random.default_rng(seed)
    tonic = int(KEYS[seed % len(KEYS)]); bpm = float(rng.uniform(46, 54)); meter = 3 if rng.random() < 0.35 else 4
    beat = 60 / bpm; bar = meter * beat
    A = PROGS[rng.integers(len(PROGS))]; B = B_PROGS[rng.integers(len(B_PROGS))]
    pattern = [(0, 1, 2, 3, 2, 1), (0, 2, 1, 3, 1, 2), (0, 1, 3, 2, 3, 1)][rng.integers(3)] if meter == 3 else \
              [(0, 1, 2, 3, 2, 1, 2, 1), (0, 2, 1, 3, 2, 1, 3, 2), (0, 1, 2, 1, 3, 1, 2, 1)][rng.integers(3)]
    scale = sorted({tonic + o + d for o in (-12, 0, 12) for d in PENTA if 55 <= tonic + o + d <= 84})
    notes, pedal = [], []

    def chord_notes(name):
        r, iv = CHORDS[name]; root = tonic - 24 + r
        while root < 36: root += 12
        return [root + i for i in iv]

    def lh(name, t0, vel):
        c = chord_notes(name); out = []
        for j, idx in enumerate(pattern):
            s = t0 + j * beat / 2
            out.append((s, s + beat * 1.7, c[idx], vel + (3 if j == 0 else 0) - (2 if j % 2 else 0), 0))
        return out

    def phrase_melody(prog, rseed, shift=0, vel=50):
        r2 = np.random.default_rng(rseed); out = []; t = 0.0; cur = tonic + 7
        for bi, name in enumerate(prog):
            rh = (RHYTHMS_3 if meter == 3 else RHYTHMS_4)[r2.integers(len(RHYTHMS_3 if meter == 3 else RHYTHMS_4))]
            if bi % 4 == 3:
                rh = [meter - 1, 1] if r2.random() < 0.5 else [meter]       # phrase end: long note (then rest)
            ctones = {(n % 12) for n in chord_notes(name)}   # (pitch classes)
            for k, d in enumerate(rh):
                if bi % 4 == 3 and k == len(rh) - 1 and len(rh) > 1:
                    t += d * beat; continue                               # breathe
                strong = (k == 0)
                cand = [n for n in scale if abs(n - cur) <= (5 if strong else 4)
                        and not any((n - c) % 12 in (1, 11) for c in ctones)]     # never a half step against the chord
                cand = cand or [n for n in scale if n % 12 in ctones and abs(n - cur) <= 7]
                if strong:
                    cand = [n for n in cand if n % 12 in ctones] or cand
                w = np.array([1.0 / (1 + abs(n - cur)) ** 1.3 for n in cand])
                cur = int(r2.choice(cand, p=w / w.sum()))
                out.append((t, d * beat * 0.96, cur + shift, vel + (4 if strong else 0)))
                t += d * beat
        return out

    t = 0.0; ped = lambda tt: pedal.extend([(tt + 0.02, True), (tt + bar - 0.06, False)])
    for name in ("I9", "IVmaj7"):                                         # intro
        notes.extend(lh(name, t, 27)); ped(t); t += bar
    sections = [(A, seed * 7 + 1, 0, 52), (A, seed * 7 + 1, 12, 44), (B, seed * 7 + 2, 0, 48), (A, seed * 7 + 3, 0, 46)]
    if rng.random() < 0.5:
        sections.insert(3, (B, seed * 7 + 4, 12, 42))
    for prog, ms, shift, vel in sections:
        mel = phrase_melody(prog, ms, shift, vel)
        for s, d, k, v in mel:
            if k <= 84:
                notes.append((t + s, t + s + d, k, v, 1))
        for name in prog:
            notes.extend(lh(name, t, 28)); ped(t); t += bar
    final = ["IV9", "I9", "IVmaj7", "I"]                                  # plagal, slowing, softer
    for i, name in enumerate(final):
        notes.extend(lh(name, t, 26 - 2 * i)[: (4 if i < 3 else 1)]); ped(t); t += bar * (1 + 0.15 * i)
    notes.append((t - bar, t + 2.0, tonic + 12, 30, 1))
    return notes, pedal, t, dict(bpm=round(bpm, 1), meter=meter, key=tonic)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("out_dir"); ap.add_argument("--count", type=int, default=14)
    ap.add_argument("--seed", type=int, default=100)
    a = ap.parse_args(); os.makedirs(a.out_dir, exist_ok=True)
    out = os.path.join(a.out_dir, "lullabies_music.wav"); cues = []
    SR = R.SR; gap = np.zeros((int(4.0 * SR), 2), np.float32); t = 0.0
    with sf.SoundFile(out + ".tmp.wav", "w", SR, 2, subtype="PCM_24") as fw:
        for k in range(a.count):
            n, p, dur, info = compose(a.seed + k)
            x = render_notes(n, p, seed=a.seed + k)
            fw.write(x); fw.write(gap)
            cues.append(dict(start=round(t, 2), end=round(t + len(x) / SR, 2), **info))
            t += (len(x) + len(gap)) / SR
            print(f"piece {k + 1}: {info} {len(x) / SR:.0f} s", flush=True)
    y = sf.read(out + ".tmp.wav", dtype="float32")[0]
    p, L = R.master(y, lufs=-21.0, peak_dbtp=-2.0)
    sf.write(out, p, SR, subtype="PCM_24"); os.remove(out + ".tmp.wav")
    json.dump(cues, open(os.path.join(a.out_dir, "lullabies_cues.json"), "w"), indent=1)
    print("->", out, round(t / 60, 1), "min")


if __name__ == "__main__":
    main()
