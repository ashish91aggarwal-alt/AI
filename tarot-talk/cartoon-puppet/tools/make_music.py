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
for c in cfg.get('music', []):   # music plan from video.json, script clock
    k = c['kind']
    if k == 'groove': groove(c['a'], c['b'], c['bpm'], c.get('root', 220), tuple(c.get('motif', (0, 2, 4, 2, 5, 4, 2, 0))), c.get('level', 1.0), c.get('ticks', False))
    elif k == 'pad': pad(c['a'], c['b'], c['root'], c['g'])
    elif k == 'swell': swell(c['a'], c['b'], c['g'])
# duck under speech (envelope of the voice track, fast attack, slow release)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(work, 'voice.wav'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
v = np.frombuffer(raw, np.float32); H = 480; n = len(v) // H; e = np.sqrt((v[:n * H].reshape(n, H) ** 2).mean(1)) > 0.012
g = np.ones(n); cur = 1.0
for i in range(n): tgt = 10 ** (cfg.get('duck_db', -8) / 20) if e[i] else 1.0; cur += (tgt - cur) * (0.5 if tgt < cur else 0.04); g[i] = cur
gain = np.repeat(g, H); m = track[: len(gain)] * gain
m = m[: int(DUR * SR)]; m = m / (np.abs(m).max() + 1e-9) * 0.9
wavfile.write(os.path.join(work, 'music.wav'), SR, (m * 32767).astype(np.int16)); print('music', round(len(m) / SR, 2), 's')
