"""c5 night-ambient piece 1 "Stillwater" - slow pads, sparse glass notes, low drone. Original, made in code.
  python3 c5_pads.py /tmp/c5/stillwater.wav [seconds=720] [seed=1]
Lane reference (measured, not copied): calm night ambient, 2 h videos built from 10-15 min pieces."""
import numpy as np, sys, subprocess, re
from scipy.signal import oaconvolve, butter, sosfiltfilt
SR = 44100
out_path = sys.argv[1]; DUR = int(sys.argv[2]) if len(sys.argv) > 2 else 720; rnd = np.random.RandomState(int(sys.argv[3]) if len(sys.argv) > 3 else 1)
N = DUR * SR; mix = np.zeros((N, 2), np.float32)
mid = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def env(n, a, r):
    e = np.ones(n, np.float32); na, nr = min(int(a * SR), n // 2), min(int(r * SR), n // 2)
    e[:na] = .5 - .5 * np.cos(np.pi * np.arange(na) / na); e[-nr:] = .5 + .5 * np.cos(np.pi * np.arange(nr) / nr); return e
def add(sig, t0):
    i = int(t0 * SR)
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), N - i)
    if n > 0: mix[i:i + n] += sig[:n]
def pad(m, dur, gain, bright=1.2):
    n = int(dur * SR); t = np.arange(n) / SR; f = mid(m); s = np.zeros((n, 2), np.float32)
    for det in (-5, -2, 0, 3, 6):                                   # cents: slow beating gives the pad its life
        fd = f * 2 ** (det / 1200); pan = rnd.uniform(.35, .65); ph = rnd.uniform(0, 6.28, 6)
        lfo = 1 + .25 * np.sin(2 * np.pi * rnd.uniform(.03, .09) * t + rnd.uniform(0, 6.28))
        v = sum(np.sin(2 * np.pi * fd * h * t + ph[h - 1]) / h ** bright for h in range(1, 7) if fd * h < 5000) * lfo
        s[:, 0] += (v * np.cos(pan * np.pi / 2)).astype(np.float32); s[:, 1] += (v * np.sin(pan * np.pi / 2)).astype(np.float32)
    return s * (env(n, min(9, dur * .35), min(11, dur * .4)) * gain / 5)[:, None]
def glass(m, gain):
    n = int(9 * SR); t = np.arange(n) / SR; f = mid(m)
    v = (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 1.5) + .12 * np.sin(2 * np.pi * f * 3.02 * t) * np.exp(-t * 3)) * np.exp(-t / 2.2)
    v *= np.minimum(1, t / .04); pan = rnd.uniform(.2, .8)
    return np.stack([v * np.cos(pan * np.pi / 2), v * np.sin(pan * np.pi / 2)], 1).astype(np.float32) * gain
# D major, add-note chords, bass moves by step or third; never a strong cadence, so it floats
CH = [(38, [57, 62, 64, 66, 69]), (35, [54, 59, 62, 64, 69]), (31, [55, 59, 62, 66, 69]), (33, [57, 59, 64, 66, 71]),
      (30, [54, 57, 61, 64, 69]), (31, [55, 59, 61, 66, 71]), (28, [55, 59, 62, 66, 71]), (33, [57, 62, 64, 69, 71])]
import os
MOOD = os.environ.get('MOOD', 'serene')
if MOOD == 'solitude':      # B minor: lonelier and deeper; slow single notes like a far voice instead of bright glass
    CH = [(35, [54, 59, 61, 62, 66]), (31, [55, 59, 62, 66, 69]), (28, [52, 55, 59, 62, 66]), (30, [54, 57, 61, 64, 66]),
          (35, [54, 59, 62, 66, 69]), (31, [55, 57, 62, 66, 71]), (33, [52, 57, 61, 64, 69]), (30, [54, 57, 61, 64, 69])]
t, k = 0.0, 0
while t < DUR:
    L = rnd.uniform(24, 32); bass, notes = CH[k % len(CH)]
    if k % 8 >= 4 and rnd.rand() < .5: notes = [n + 12 if i == len(notes) - 1 else n for i, n in enumerate(notes)]
    add(pad(bass + 12, L + 12, .26, 2.0), t - 2); add(pad(bass, L + 12, .16, 2.6), t - 2)
    for n_ in notes: add(pad(n_, L + rnd.uniform(8, 14), .22 * rnd.uniform(.7, 1.1)), max(0, t + rnd.uniform(-3, 3)))
    t += L; k += 1
PENT = [74, 76, 78, 81, 83, 86, 88]
def voice(m, dur, gain):
    n = int(dur * SR); tt_ = np.arange(n) / SR; f = mid(m)
    vib = 1 + .0035 * np.sin(2 * np.pi * 4.6 * tt_) * np.minimum(1, tt_ / 2.5)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    v = (np.sin(ph) + .22 * np.sin(2 * ph) + .07 * np.sin(3 * ph)) * env(n, min(2.5, dur * .4), min(4, dur * .5))
    return np.stack([v * .72, v * .69], 1).astype(np.float32) * gain
if MOOD == 'solitude':
    SC = [59, 62, 64, 66, 69, 71, 74, 76]; i = 3; t = 20.0
    while t < DUR - 20:
        for _ in range(rnd.randint(2, 5)):                       # a short phrase of 2-4 long notes, then silence
            i = int(np.clip(i + rnd.choice([-2, -1, -1, 1, 1, 2]), 0, len(SC) - 1)); L = rnd.uniform(5, 9)
            add(voice(SC[i] + 12, L + 3, .075), t); t += L
        t += rnd.uniform(14, 30)
    PENT = [83, 86, 88, 90]
# night air over the lake: very soft band-limited wind that swells and fades
wn = rnd.randn(N).astype(np.float32)
wn = sosfiltfilt(butter(2, [180, 900], 'band', fs=SR, output='sos'), wn).astype(np.float32)
sw = np.interp(np.arange(N), np.linspace(0, N, max(2, DUR // 9)), rnd.uniform(.15, 1., max(2, DUR // 9))).astype(np.float32)
mix += (wn * sw * .012)[:, None]
t = 28.0
while t < DUR - 12:
    n_ = PENT[rnd.randint(len(PENT))]; add(glass(n_, .1 * rnd.uniform(.5, 1)), t)
    if rnd.rand() < .35: add(glass(PENT[rnd.randint(len(PENT))], .06), t + rnd.uniform(1.2, 2.5))
    t += rnd.uniform(7, 17) * (2.2 if MOOD == 'solitude' else 1)
# long dark hall
n_ir = int(6.5 * SR); tt = np.arange(n_ir) / SR
common = rnd.randn(n_ir, 1); ir = (.85 * common + .5 * rnd.randn(n_ir, 2)).astype(np.float32) * np.exp(-tt / 1.6)[:, None]   # mostly shared: mono-safe width
ir = sosfiltfilt(butter(2, 5000, 'low', fs=SR, output='sos'), ir, axis=0).astype(np.float32); ir /= np.sqrt((ir ** 2).sum(0))
wet = np.stack([oaconvolve(mix[:, c], ir[:, c])[:N] for c in range(2)], 1).astype(np.float32)
y = .45 * mix + .75 * wet
y = sosfiltfilt(butter(1, 7000, 'low', fs=SR, output='sos'), y, axis=0)
y = sosfiltfilt(butter(2, 28, 'high', fs=SR, output='sos'), y, axis=0)
fade = int(10 * SR); y[:fade] *= np.linspace(0, 1, fade)[:, None] ** 2; y[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
y = (y / np.abs(y).max() * .5).astype(np.float32)
def enc(a, path):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', path], input=a.tobytes(), check=True)
enc(y, out_path)
o = subprocess.run(['ffmpeg', '-nostats', '-i', out_path, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
o = o[o.rfind('Summary:'):]; I = float(re.search(r'I:\s+(-?[\d.]+)', o).group(1)); pk = float(re.search(r'Peak:\s+(-?[\d.]+)', o).group(1))
g = min(-20.5 - I, -2.0 - pk); enc(y * 10 ** (g / 20), out_path); print('gain dB', round(g, 2), 'from', I, 'LUFS, peak', pk)
