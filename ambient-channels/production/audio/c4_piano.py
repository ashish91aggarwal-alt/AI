"""c4 'Sleepy Cat Cabin' — original soft piano piece (composed here, rendered locally with Salamander).

D-flat major, 58 bpm, soft touch. Form: intro (2) A (8) A' (8, octave up, fills) B (8) A'' (8, softer, ends home) outro (4).
The main melody starts at bar 3 (about 8 s in) so the tune is heard inside the first 30 s.
Usage: python3 c4_piano.py out.wav [--seed 1]
"""
import sys, argparse
import numpy as np
import render as R

BPM = 58
BEAT = 60 / BPM
BAR = 4 * BEAT

CH = {  # left-hand chord tones (MIDI), low to high
    "Db9": [37, 44, 53, 60], "Ab/C": [48, 51, 56, 63], "Bbm7": [46, 53, 56, 61], "Gbmaj7": [42, 49, 53, 58],
    "Db/F": [41, 49, 56, 60], "Ebm7": [39, 46, 49, 54], "Absus": [44, 51, 56, 61], "Ab": [44, 51, 56, 60],
    "Fm7": [41, 48, 51, 56], "Gb/Ab": [44, 49, 54, 58], "Db": [37, 44, 49, 56],
}
A_CHORDS = ["Db9", "Ab/C", "Bbm7", "Gbmaj7", "Db/F", "Gbmaj7", "Ebm7", "Absus"]
B_CHORDS = ["Gbmaj7", "Ab", "Fm7", "Bbm7", "Gbmaj7", "Absus", "Db/F", "Gb/Ab"]
# melody: per bar, list of (midi or None, beats)
A_MEL = [[(77, 2), (75, 1), (73, 1)], [(72, 1.5), (73, .5), (75, 2)], [(73, 2), (72, 1), (70, 1)], [(68, 3), (None, 1)],
         [(68, 1), (73, 1), (77, 2)], [(78, 1.5), (77, .5), (75, 1), (73, 1)], [(75, 2), (73, 1), (70, 1)], [(72, 3), (None, 1)]]
B_MEL = [[(70, 2), (68, 1), (66, 1)], [(68, 3), (None, 1)], [(68, 1), (70, 1), (72, 2)], [(73, 3), (None, 1)],
         [(75, 2), (73, 1), (70, 1)], [(72, 3), (None, 1)], [(68, 1), (65, 1), (68, 1), (73, 1)], [(72, 2), (70, 1), (68, 1)]]


def lh(chord, t0, vel, pattern=(0, 1, 2, 3, 2, 1, 2, 1)):
    c = CH[chord]; n = []
    for j, idx in enumerate(pattern):
        s = t0 + j * BEAT / 2
        n.append((s, s + BEAT * 1.6, c[idx], vel + (4 if j == 0 else 0) - (2 if j % 2 else 0), 0))
    return n


def mel(bar_notes, t0, vel, shift=0):
    n, t = [], t0
    for k, d in bar_notes:
        if k is not None:
            n.append((t, t + d * BEAT * 0.95, k + shift, vel, 1))
        t += d * BEAT
    return n


def compose():
    notes, pedal, t = [], [], 0.0
    def bar_pedal(t):
        pedal.extend([(t + 0.02, True), (t + BAR - 0.06, False)])
    for ch in ["Db9", "Gbmaj7"]:                                # intro
        notes += lh(ch, t, 30); bar_pedal(t); t += BAR
    for i, ch in enumerate(A_CHORDS):                           # A
        notes += lh(ch, t, 30) + mel(A_MEL[i], t, 58 + (4 if i in (1, 5) else 0)); bar_pedal(t); t += BAR
    for i, ch in enumerate(A_CHORDS):                           # A' an octave up, a little fuller
        notes += lh(ch, t, 32) + mel(A_MEL[i], t, 52, shift=12 if i < 6 else 0)
        if i in (3, 7):                                          # soft fill in the rests
            notes += [(t + 3 * BEAT, t + 3.8 * BEAT, CH[ch][3] + 12, 36, 1), (t + 3.5 * BEAT, t + 4.2 * BEAT, CH[ch][2] + 12, 34, 1)]
        bar_pedal(t); t += BAR
    for i, ch in enumerate(B_CHORDS):                           # B
        notes += lh(ch, t, 29, pattern=(0, 2, 3, 2, 1, 2, 3, 2)) + mel(B_MEL[i], t, 56); bar_pedal(t); t += BAR
    a2 = A_CHORDS[:7] + ["Db"]
    a2_mel = A_MEL[:7] + [[(73, 4)]]                            # ends home on D-flat
    for i, ch in enumerate(a2):                                 # A'' softer
        notes += lh(ch, t, 27) + mel(a2_mel[i], t, 50 - (3 if i > 5 else 0)); bar_pedal(t); t += BAR
    for i, ch in enumerate(["Gbmaj7", "Db9", "Gbmaj7", "Db"]):  # outro, thinning out
        notes += lh(ch, t, 26 - 2 * i, pattern=(0, 1, 2, 3) + (None,) * 0)[: 4]
        if i == 3:
            notes += [(t + BEAT, t + 4 * BEAT, 80, 30, 1), (t + 1.5 * BEAT, t + 4 * BEAT, 77, 28, 1)]
        bar_pedal(t); t += BAR
    return notes, pedal, t


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("out"); ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    notes, pedal, T = compose()
    rng = np.random.default_rng(a.seed)
    notes = R.humanise(R.apply_pedal(notes, pedal), rng, vel_sd=4, time_ms=14)
    inst = R.instrument("salamander")
    x = R.render(notes, inst, tail=7.0, seed=a.seed)
    # Salamander is a spaced (AB) pair: some notes are out of phase between L and R (C5: -0.83) and
    # would cancel on phone speakers. Use one mic for the dry piano; the stereo room gives the width.
    x = np.repeat(x[:, :1], 2, axis=1)
    ir = R.make_ir({125: 2.4, 250: 2.3, 500: 2.1, 1000: 1.9, 2000: 1.5, 4000: 1.1, 8000: 0.7})
    x = R.reverb(x, ir, wet=0.28)
    # darker, softer: gentle high shelf down (felt-piano feel)
    from scipy.signal import butter, sosfilt
    sos = butter(2, 6500, btype="low", fs=R.SR, output="sos")
    x = (0.8 * x + 0.2 * np.stack([sosfilt(sos, x[:, c]) for c in range(2)], 1)).astype(np.float32)
    hp = butter(2, 140, btype="high", fs=R.SR, output="sos")         # trim the heavy low end by about 3 dB
    x = (0.3 * x + 0.7 * np.stack([sosfilt(hp, x[:, c]) for c in range(2)], 1)).astype(np.float32)
    bp = butter(2, [200, 420], btype="band", fs=R.SR, output="sos")  # about -3 dB dip in the boxy low-mids
    x = (x - 0.3 * np.stack([sosfilt(bp, x[:, c]) for c in range(2)], 1)).astype(np.float32)
    y, L = R.master(x, lufs=-21.0, peak_dbtp=-2.0)
    import soundfile as sf
    sf.write(a.out, y, R.SR, subtype="PCM_24")
    print(f"{len(y) / R.SR:.1f} s, source loudness {L:.1f} LUFS -> -21, notes {len(notes)}, form length {T:.1f} s")
