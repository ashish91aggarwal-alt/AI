"""c4 10-minute music programme: three original soft piano pieces + a short reprise, rendered locally
(Salamander, one mic, room reverb), then fire crackle and soft wind under it. Nothing repeats inside 10 min.

  piece 1  'Sleepy Cat Cabin'   D-flat major, 58 bpm (c4_piano.py)
  piece 2  'Warm Mug'           A-flat major, 56 bpm, new melody and progression
  piece 3  'Snow on the Pane'   G-flat major, 54 bpm, slower broken-chord pattern
  reprise  piece 1's A section an octave up, 52 bpm, ends home

Usage: python3 c4_music.py out_dir [--seconds 600]
"""
import os, sys, argparse, subprocess
import numpy as np
import render as R
import c4_piano as P1

CH = dict(P1.CH)
CH.update({
    "Abmaj9": [44, 51, 55, 58], "Fm9": [41, 48, 51, 55], "Dbmaj7": [37, 44, 48, 53], "Eb/G": [43, 51, 55, 58],
    "Cm7": [36, 43, 46, 51], "Eb": [39, 46, 51, 55], "AbH": [44, 51, 56, 60],
    "Gbmaj9": [42, 49, 53, 56], "Ebm9": [39, 46, 49, 53], "Cbmaj7": [35, 42, 46, 51], "Abm7": [44, 51, 54, 59],
    "DbH": [37, 44, 49, 53],
})

PIECES = {
    "warm_mug": dict(bpm=56, intro=["Abmaj9", "Dbmaj7"],
        A=["Abmaj9", "Eb/G", "Fm9", "Cm7", "Dbmaj7", "Abmaj9", "Bbm7", "Eb"],
        A_mel=[[(72, 2), (70, 1), (68, 1)], [(67, 3), (None, 1)], [(68, 1), (72, 1), (75, 2)], [(70, 3), (None, 1)],
               [(72, 1.5), (73, .5), (72, 1), (68, 1)], [(75, 2), (72, 2)], [(73, 2), (72, 1), (70, 1)], [(70, 3), (None, 1)]],
        B=["Dbmaj7", "Eb", "Cm7", "Fm9", "Bbm7", "Eb/G", "Abmaj9", "Eb"],
        B_mel=[[(77, 2), (75, 1), (72, 1)], [(75, 3), (None, 1)], [(72, 1), (75, 1), (77, 1), (75, 1)], [(72, 3), (None, 1)],
               [(73, 2), (72, 1), (70, 1)], [(70, 2), (67, 2)], [(68, 1), (72, 1), (75, 2)], [(70, 3), (None, 1)]],
        home="AbH", home_note=68, pattern=(0, 1, 2, 3, 2, 1, 2, 1), outro=["Dbmaj7", "Abmaj9", "Dbmaj7", "AbH"]),
    "snow_pane": dict(bpm=54, intro=["Gbmaj9", "Cbmaj7"],
        A=["Gbmaj9", "Db/F", "Ebm9", "Bbm7", "Cbmaj7", "Gbmaj9", "Abm7", "DbH"],
        A_mel=[[(73, 2), (70, 2)], [(68, 1), (70, 1), (73, 2)], [(75, 2), (73, 1), (70, 1)], [(70, 3), (None, 1)],
               [(71, 2), (70, 1), (68, 1)], [(66, 2), (70, 2)], [(68, 1.5), (70, .5), (68, 1), (65, 1)], [(68, 3), (None, 1)]],
        B=["Cbmaj7", "DbH", "Bbm7", "Ebm9", "Abm7", "Db/F", "Gbmaj9", "DbH"],
        B_mel=[[(78, 2), (77, 1), (75, 1)], [(73, 3), (None, 1)], [(73, 1), (75, 1), (77, 2)], [(78, 3), (None, 1)],
               [(77, 2), (75, 1), (73, 1)], [(73, 2), (70, 2)], [(71, 1), (70, 1), (68, 1), (66, 1)], [(68, 3), (None, 1)]],
        home="Gbmaj9", home_note=66, pattern=(0, 2, 1, 3, 2, 1, 3, 2), outro=["Cbmaj7", "Gbmaj9", "Cbmaj7", "Gbmaj9"]),
}


def lh(chord, t0, vel, beat, pattern):
    c = CH[chord]; n = []
    for j, idx in enumerate(pattern):
        s = t0 + j * beat / 2
        n.append((s, s + beat * 1.6, c[idx], vel + (4 if j == 0 else 0) - (2 if j % 2 else 0), 0))
    return n


def mel(bar, t0, vel, beat, shift=0):
    n, t = [], t0
    for k, d in bar:
        if k is not None:
            n.append((t, t + d * beat * 0.95, k + shift, vel, 1))
        t += d * beat
    return n


def compose_piece(p):
    beat = 60 / p["bpm"]; bar = 4 * beat
    notes, pedal, t = [], [], 0.0
    def ped(t): pedal.extend([(t + 0.02, True), (t + bar - 0.06, False)])
    pat = p["pattern"]
    for ch in p["intro"]:
        notes += lh(ch, t, 29, beat, pat); ped(t); t += bar
    for i, ch in enumerate(p["A"]):
        notes += lh(ch, t, 30, beat, pat) + mel(p["A_mel"][i], t, 56 + (4 if i in (2, 5) else 0), beat); ped(t); t += bar
    for i, ch in enumerate(p["B"]):
        notes += lh(ch, t, 29, beat, pat) + mel(p["B_mel"][i], t, 54, beat); ped(t); t += bar
    for i, ch in enumerate(p["A"]):                         # A' an octave up, softer, with small fills
        notes += lh(ch, t, 28, beat, pat) + mel(p["A_mel"][i], t, 48, beat, shift=12 if i < 6 else 0)
        if i in (3, 7):
            notes += [(t + 3 * beat, t + 3.8 * beat, CH[ch][3] + 12, 34, 1)]
        ped(t); t += bar
    for i, ch in enumerate(p["B"]):                         # B again, thinner
        notes += lh(ch, t, 27, beat, pat) + mel(p["B_mel"][i], t, 50, beat); ped(t); t += bar
    a2 = p["A"][:7] + [p["home"]]; a2m = p["A_mel"][:7] + [[(p["home_note"], 4)]]
    for i, ch in enumerate(a2):                              # A'' ends home
        notes += lh(ch, t, 26, beat, pat) + mel(a2m[i], t, 47 - (3 if i > 5 else 0), beat); ped(t); t += bar
    for i, ch in enumerate(p["outro"]):
        notes += lh(ch, t, 25 - 2 * i, beat, pat)[:4]; ped(t); t += bar
    return notes, pedal, t


def compose_reprise():
    beat = 60 / 52; bar = 4 * beat
    notes, pedal, t = [], [], 0.0
    def ped(t): pedal.extend([(t + 0.02, True), (t + bar - 0.06, False)])
    for ch in ["Gbmaj7", "Db9"]:
        notes += lh(ch, t, 26, beat, (0, 1, 2, 3, 2, 1, 2, 1)); ped(t); t += bar
    a = P1.A_CHORDS[:7] + ["Db"]; am = P1.A_MEL[:7] + [[(73, 4)]]
    for i, ch in enumerate(a):
        notes += lh(ch, t, 26, beat, (0, 1, 2, 3, 2, 1, 2, 1)) + mel(am[i], t, 44, beat, shift=12 if i < 7 else 0); ped(t); t += bar
    for i, ch in enumerate(["Gbmaj7", "Db"]):
        notes += lh(ch, t, 23 - 2 * i, beat, (0, 1, 2, 3)); ped(t); t += bar
    return notes, pedal, t


def render_notes(notes, pedal, seed):
    from scipy.signal import butter, sosfilt
    rng = np.random.default_rng(seed)
    notes = R.humanise(R.apply_pedal(notes, pedal), rng, vel_sd=4, time_ms=14)
    x = R.render(notes, R.instrument("salamander"), tail=7.0, seed=seed)
    x = np.repeat(x[:, :1], 2, axis=1)                      # one mic of the spaced pair (phase), room gives width
    x = R.reverb(x, R.make_ir({125: 2.4, 250: 2.3, 500: 2.1, 1000: 1.9, 2000: 1.5, 4000: 1.1, 8000: 0.7}), wet=0.28)
    sos = butter(2, 6500, btype="low", fs=R.SR, output="sos")
    x = (0.8 * x + 0.2 * np.stack([sosfilt(sos, x[:, c]) for c in range(2)], 1)).astype(np.float32)
    hp = butter(2, 140, btype="high", fs=R.SR, output="sos")
    x = (0.3 * x + 0.7 * np.stack([sosfilt(hp, x[:, c]) for c in range(2)], 1)).astype(np.float32)
    bp = butter(2, [200, 420], btype="band", fs=R.SR, output="sos")
    x = (x - 0.3 * np.stack([sosfilt(bp, x[:, c]) for c in range(2)], 1)).astype(np.float32)
    return x


def wind(seconds, seed=5):
    """Soft wind outside: filtered noise with slow gusts."""
    from scipy.signal import butter, sosfilt
    rng = np.random.default_rng(seed); n = int(seconds * R.SR)
    w = rng.normal(size=(n, 2)).astype(np.float32)
    w = np.stack([sosfilt(butter(2, [120, 900], btype="band", fs=R.SR, output="sos"), w[:, c]) for c in range(2)], 1)
    t = np.arange(n) / R.SR
    g = 0.55 + 0.25 * np.sin(2 * np.pi * t / 23 + 1) + 0.15 * np.sin(2 * np.pi * t / 9.7) + 0.05 * np.sin(2 * np.pi * t / 4.1)
    return (w * g[:, None]).astype(np.float32)


if __name__ == "__main__":
    import soundfile as sf
    ap = argparse.ArgumentParser(); ap.add_argument("out_dir"); ap.add_argument("--seconds", type=float, default=600)
    a = ap.parse_args(); os.makedirs(a.out_dir, exist_ok=True)
    parts = [render_notes(*P1.compose()[:2], seed=1)]
    for k, name in enumerate(("warm_mug", "snow_pane")):
        n, p, _ = compose_piece(PIECES[name]); parts.append(render_notes(n, p, seed=2 + k))
    n, p, _ = compose_reprise(); parts.append(render_notes(n, p, seed=9))
    gap = np.zeros((int(3.0 * R.SR), 2), np.float32)
    piano = np.concatenate(sum([[x, gap] for x in parts], [])[:-1])
    total = int(a.seconds * R.SR)
    print("piano programme", round(len(piano) / R.SR, 1), "s for", a.seconds, "s")
    if len(piano) < total:
        piano = np.concatenate([piano, np.zeros((total - len(piano), 2), np.float32)])
    piano = piano[:total]
    fade = int(6 * R.SR); piano[-fade:] *= np.linspace(1, 0, fade)[:, None]
    p, L = R.master(piano, lufs=-21.0, peak_dbtp=-2.0)
    sf.write(os.path.join(a.out_dir, "piano.wav"), p, R.SR, subtype="PCM_24")
    w, _ = R.master(wind(a.seconds), lufs=-38.0, peak_dbtp=-12.0)
    sf.write(os.path.join(a.out_dir, "wind.wav"), w, R.SR, subtype="PCM_24")
    subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "fire_ambience.py"),
                    os.path.join(a.out_dir, "fire.wav"), str(int(a.seconds)), "4"], check=True)
    out = os.path.join(a.out_dir, "mix.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(a.out_dir, "piano.wav"), "-i", os.path.join(a.out_dir, "fire.wav"),
                    "-i", os.path.join(a.out_dir, "wind.wav"), "-filter_complex",
                    "[1:a]volume=-8dB[f];[2:a]volume=-3dB[w];[0:a][f][w]amix=inputs=3:normalize=0,loudnorm=I=-20:TP=-2:LRA=11",
                    "-ar", "48000", "-t", str(a.seconds), out], check=True)
    print("mix ->", out)
