"""Original music bed for the Mulank 8 reel, synthesised here (no samples, no paid credits).
Instruments: plucked santoor (Karplus-Strong), tanpura drone, tabla-style dayan/bayan hits, shaker, bass.
Cues follow the script's music notes on the ORIGINAL clock, mapped to the v3 voice clock; the bed ducks 8 dB under speech.
Usage: python3 tools/make_music.py <slug>  -> work/<slug>/music.wav. The plan is video.json "music" (groove / pad / swell on the script clock)."""
import os, json, subprocess, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
from common import video, mapper, SR
rng = np.random.default_rng(27)
slug, vdir, work, cfg = video(); new_t = mapper(work)
DUR = new_t(cfg['script_dur']) + 0.3
lp = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def pluck(f, d=0.9, bright=0.6):            # santoor-ish: Karplus-Strong string with a metallic double strike
    N = int(SR / f); buf = rng.uniform(-1, 1, N) * bright; out = np.zeros(int(SR * d))
    for i in range(len(out)): out[i] = buf[i % N]; buf[i % N] = 0.996 * 0.5 * (buf[i % N] + buf[(i + 1) % N])
    return out * np.exp(-np.arange(len(out)) / SR * 2.2)
def tabla(kind):                            # dayan 'na' (ringing), bayan 'ge' (bending bass), 'ka' (dry slap)
    t = np.arange(int(SR * 0.6)) / SR
    if kind == 'na': return np.sin(2 * np.pi * 420 * t) * np.exp(-t * 9) * 0.8 + np.sin(2 * np.pi * 840 * t) * np.exp(-t * 14) * 0.3
    if kind == 'ge': return np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 12)) * t) * np.exp(-t * 5)
    return hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 60) * 0.5
def shaker(): t = np.arange(int(SR * 0.08)) / SR; return hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 50) * 0.25
def drone(d, root=110):                     # tanpura: Pa-Sa-Sa-Sa' with slow beating
    t = np.arange(int(SR * d)) / SR; x = np.zeros_like(t)
    for f, a in [(root * 1.5, 0.5), (root * 2, 0.7), (root * 2.003, 0.5), (root, 0.8)]:
        x += a * sum(np.sin(2 * np.pi * f * h * t + h) / h ** 1.3 for h in range(1, 7)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.23 * t + f))
    return lp(x, 2500) / 6
track = np.zeros(int(SR * (DUR + 2)), np.float32)
def put(t, x, g): i = int(t * SR); x = x[: len(track) - i]; track[i:i + len(x)] += (x * g).astype(np.float32)
SCALE = [0, 2, 4, 7, 9, 12, 14, 16]          # bright major-pentatonic feel
def groove(a, b, bpm, root=220, motif=(0, 2, 4, 2, 5, 4, 2, 0), level=1.0, ticks=False):
    beat = 60 / bpm; t = a; i = 0
    while t < b - 0.05:
        T = new_t(t)
        put(T, tabla('ge' if i % 4 == 0 else 'na' if i % 2 else 'ka'), 0.5 * level)
        put(T + beat / 2, tabla('na'), 0.25 * level); put(T + beat / 4, shaker(), level); put(T + 3 * beat / 4, shaker(), level)
        if i % 2 == 0: put(T, pluck(root * 2 ** (SCALE[motif[(i // 2) % len(motif)]] / 12), 0.8), 0.35 * level)
        if i % 4 == 0: put(T, lp(pluck(root / 2, 1.2, 0.9), 400), 0.5 * level)
        if ticks: put(T, tabla('ka') * 0.6, 0.3)
        t += beat; i += 1
def pad(a, b, root, g):                     # drone stretched across the mapped window
    A, B = new_t(a), new_t(b); x = drone(B - A, root); n = min(len(x), int(0.4 * SR)); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n); put(A, x, g)
def swell(a, b, g):
    A, B = new_t(a), new_t(b); t = np.arange(int(SR * (B - A))) / SR; f = 200 + 1400 * (t / t[-1]) ** 2
    put(A, np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / t[-1]) ** 2 * 0.4 + lp(rng.standard_normal(len(t)), 3000) * (t / t[-1]) ** 3 * 0.3, g)
# ---- punchier kit (added 23 Nov 2026, owner: "music is weak"): kick, clap, hats, bass line, chord stabs, riser + impact, sad pad
def kick(): t = np.arange(int(SR * 0.35)) / SR; return np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-t * 28)) / SR) * np.exp(-t * 9) * 1.2
def clap(): t = np.arange(int(SR * 0.25)) / SR; n = hp(rng.standard_normal(len(t)), 900); env = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012); return lp(n, 7000) * env * 0.5
def hat(o=False): t = np.arange(int(SR * (0.18 if o else 0.05))) / SR; return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (14 if o else 70)) * 0.22
def bassnote(f, d): t = np.arange(int(SR * d)) / SR; x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.15 * np.sign(np.sin(2 * np.pi * f * t)); return lp(x, 600) * np.minimum(1, t / 0.01) * np.exp(-t * 2.5) * 0.7
def stab(fs, d=0.25): t = np.arange(int(SR * d)) / SR; x = sum(np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * 2 * t) * 0.3 for f in fs); return lp(x, 2600) * np.exp(-t * 9) * 0.22
PROG = {'major': [(0, [0, 4, 7]), (5, [5, 9, 12]), (7, [7, 11, 14]), (5, [5, 9, 12])], 'minor': [(0, [0, 3, 7]), (8, [8, 12, 15]), (5, [5, 8, 12]), (7, [7, 10, 14])]}
def beat(a, b, bpm, root=196, level=1.0, mode='major', light=False):
    bt = 60 / bpm; t = a; i = 0; pr = PROG[mode]
    while t < b - 0.05:
        T = new_t(t); bar = (i // 4) % len(pr); r, ch = pr[bar]; f0 = root * 2 ** (r / 12)
        if not light or i % 4 == 0: put(T, kick(), 0.55 * level)
        if i % 2 == 1: put(T, clap(), (0.3 if light else 0.42) * level)
        put(T, hat(), 0.5 * level); put(T + bt / 2, hat(i % 4 == 3), 0.45 * level)
        if i % 4 in (0, 3) or (not light and i % 2 == 0): put(T, bassnote(f0 / 2, bt * 0.9), 0.6 * level)
        if i % 4 in (1, 3): put(T + bt / 2, stab([root * 2 ** (c / 12) for c in ch]), level * (0.5 if light else 0.7))
        if i % 2 == 0: put(T, pluck(root * 2 * 2 ** (SCALE[(i // 2 * 3) % len(SCALE)] / 12), 0.6), 0.22 * level)
        t += bt; i += 1
def sadpad(a, b, root=196, g=1.0):
    A, B = new_t(a), new_t(b); t = np.arange(int(SR * (B - A))) / SR; x = np.zeros_like(t)
    for c in [0, 3, 7, 12]: f = root * 2 ** (c / 12); x += np.sin(2 * np.pi * f * t) * 0.25 + np.sin(2 * np.pi * f * 1.003 * t) * 0.2
    n = min(len(x) // 3, int(0.3 * SR)); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n); put(A, lp(x, 1800) * 0.6, g)
    for k, c in enumerate([12, 10, 7, 3, 0]): put(A + k * (B - A) / 5, pluck(root * 2 ** (c / 12), 1.2, 0.4), 0.3 * g)
def drop(a, b, g=1.0):   # riser across [a,b], impact at b
    swell(a, b, g); B = new_t(b); put(B, kick() * 1.4, g); put(B, clap() * 1.5, g); put(B, lp(rng.standard_normal(int(SR * 1.2)), 4000) * np.exp(-np.arange(int(SR * 1.2)) / SR * 4) * 0.4, g)
for c in cfg.get('music', []):   # music plan from video.json, script clock
    k = c['kind']
    if k == 'groove': groove(c['a'], c['b'], c['bpm'], c.get('root', 220), tuple(c.get('motif', (0, 2, 4, 2, 5, 4, 2, 0))), c.get('level', 1.0), c.get('ticks', False))
    elif k == 'pad': pad(c['a'], c['b'], c['root'], c['g'])
    elif k == 'swell': swell(c['a'], c['b'], c['g'])
    elif k == 'beat': beat(c['a'], c['b'], c['bpm'], c.get('root', 196), c.get('level', 1.0), c.get('mode', 'major'), c.get('light', False))
    elif k == 'sadpad': sadpad(c['a'], c['b'], c.get('root', 196), c.get('g', 1.0))
    elif k == 'drop': drop(c['a'], c['b'], c.get('g', 1.0))
# duck under speech (envelope of the voice track, fast attack, slow release)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(work, 'voice.wav'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
v = np.frombuffer(raw, np.float32); H = 480; n = len(v) // H; e = np.sqrt((v[:n * H].reshape(n, H) ** 2).mean(1)) > 0.012
g = np.ones(n); cur = 1.0
for i in range(n): tgt = 10 ** (cfg.get('duck_db', -8) / 20) if e[i] else 1.0; cur += (tgt - cur) * (0.5 if tgt < cur else 0.04); g[i] = cur
gain = np.repeat(g, H); m = track[: len(gain)] * gain
m = m[: int(DUR * SR)]
if cfg.get('music_rms_db') is not None:   # opt-in: level by loudness (RMS) with a soft limiter, so kick peaks don't make the bed quiet
    r = np.sqrt(np.mean(m[np.abs(m) > 1e-4] ** 2)) + 1e-9; m = m / r * 10 ** (cfg['music_rms_db'] / 20); m = np.tanh(m * 1.6) / 1.6
else: m = m / (np.abs(m).max() + 1e-9) * 0.9
wavfile.write(os.path.join(work, 'music.wav'), SR, (m * 32767).astype(np.int16)); print('music', round(len(m) / SR, 2), 's')
