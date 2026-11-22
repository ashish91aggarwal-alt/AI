"""Original meme-style sound effects for Tarot Talk cartoon reels, synthesised from scratch (no samples, no copyrighted clips).
Each one copies the *function* of a well-known reel sound (vine-boom thud, record scratch, dun-dun-dun, sad trombone...)
so it lands the same way without using anyone's recording. Run:  python3 make_sfx.py  -> sfx/*.wav (48 kHz mono)."""
import numpy as np, os
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR = 48000
OUT = os.path.join(os.path.dirname(__file__), 'sfx')
rng = np.random.default_rng(8)
t_ = lambda d: np.arange(int(SR * d)) / SR
def env(n, a=0.005, r=0.3, d=None):
    e = np.ones(n); A = max(1, int(a * SR)); e[:A] = np.linspace(0, 1, A)
    R = int(r * SR); e[-R:] *= np.linspace(1, 0, R) ** 2
    return e
def lp(x, f): return sosfilt(butter(4, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(4, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(4, [lo, hi], 'band', fs=SR, output='sos'), x)
def verb(x, room=0.35, decay=1.2):
    ir = rng.standard_normal(int(SR * decay)) * np.exp(-np.linspace(0, 7, int(SR * decay))); ir = lp(ir, 6000)
    w = np.convolve(x, ir)[: len(x) + int(SR * decay * 0.6)] * 0.02
    y = np.zeros(len(w)); y[: len(x)] += x; return y + w * room
def save(name, x, peak=0.89):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(os.path.join(OUT, name + '.wav'), SR, (x * 32767).astype(np.int16)); print(name, round(len(x) / SR, 2), 's')
def sweep(f0, f1, d, shape='sine', curve=2.0):
    t = t_(d); f = f1 + (f0 - f1) * (1 - t / d) ** curve; ph = 2 * np.pi * np.cumsum(f) / SR
    if shape == 'saw': return 2 * ((ph / (2 * np.pi)) % 1) - 1
    if shape == 'square': return np.sign(np.sin(ph))
    return np.sin(ph)
def tone(f, d, shape='saw', vib=0, vibf=5.5):
    t = t_(d); ph = 2 * np.pi * np.cumsum(f * (1 + vib * np.sin(2 * np.pi * vibf * t))) / SR
    return (2 * ((ph / (2 * np.pi)) % 1) - 1) if shape == 'saw' else np.sin(ph)

def boom():            # deep "vine boom"-style thud: sub drop + saturated body + short room
    d = 1.6; x = sweep(95, 38, d, curve=3) * np.exp(-t_(d) * 2.6)
    x = np.tanh(x * 3.5) * 0.8 + lp(rng.standard_normal(len(x)), 400) * np.exp(-t_(d) * 30) * 0.5
    return verb(x, 0.4, 1.4)
def record_scratch():  # vinyl scratch: two fast back-and-forth pitch sweeps of filtered noise + tone
    d = 0.45; t = t_(d); n = rng.standard_normal(len(t))
    pos = np.abs(np.sin(2 * np.pi * 2.2 * t)) ; f = 300 + 2600 * pos
    x = bp(n, 400, 4000) * pos + 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return x * env(len(t), 0.003, 0.08)
def dun_dun_dun():     # three dramatic brass stabs, last one long, minor descent (C -> Bb -> Gb)
    out = []
    for f, d in [(130.8, 0.32), (116.5, 0.32), (92.5, 1.5)]:
        s = sum(tone(f * m, d) * a for m, a in [(1, 1), (1.5, 0.5), (2, 0.6)]) + tone(f / 2, d) * 0.7
        s = lp(s, 1800) * env(len(s), 0.012, d * 0.5); out.append(s); out.append(np.zeros(int(SR * 0.06)))
    return verb(np.concatenate(out), 0.5, 1.8)
def sad_trombone():    # "wah wah wah waaah": four falling slides with a wobble on the last
    out = []
    for f, d, v in [(293.7, 0.42, 0), (277.2, 0.42, 0), (261.6, 0.42, 0), (246.9, 1.3, 0.025)]:
        s = tone(f, d, vib=v, vibf=6) ; s = lp(s, 1400) * env(len(s), 0.04, 0.15)
        s *= (1 - 0.15 * np.linspace(0, 1, len(s))); out.append(s); out.append(np.zeros(int(SR * 0.05)))
    return verb(np.concatenate(out), 0.3, 1.0)
def ding():            # bright reveal bell
    d = 1.4; t = t_(d); x = sum(np.sin(2 * np.pi * 1568 * m * t) * a * np.exp(-t * k) for m, a, k in [(1, 1, 3), (2.76, 0.4, 5), (5.4, 0.2, 9)])
    return verb(x * env(len(t), 0.001, 0.2), 0.3, 1.2)
def boing():           # cartoon spring
    d = 0.7; t = t_(d); f = 220 + 160 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 4) + 120 * t
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
def tick():            # card pop tick
    d = 0.08; n = hp(rng.standard_normal(int(SR * d)), 2500); return n * np.exp(-t_(d) * 90)
def whoosh():          # portal / swipe
    d = 0.9; t = t_(d); n = rng.standard_normal(len(t)); c = np.sin(np.pi * t / d) ** 2
    f = 300 + 3000 * c; y = np.zeros_like(n)
    for i in range(0, len(n), 960): y[i:i + 960] = bp(n[i:i + 960 + 0], max(80, f[i] * 0.5), min(20000, f[i] * 1.5))[:len(y[i:i + 960])]
    return lp(y, 9000) * c
def magic_swirl():     # chakra / portal shimmer: rising arpeggio of bells + whoosh
    out = np.zeros(int(SR * 1.4))
    for i, f in enumerate([523, 659, 784, 1047, 1319, 1568]):
        st = int(SR * i * 0.11); d = 0.6; t = t_(d); s = np.sin(2 * np.pi * f * t) * np.exp(-t * 6); out[st:st + len(s)] += s[: len(out) - st] * 0.6
    return verb(out + whoosh()[: len(out)] * 0.0 if False else out, 0.5, 1.2)
def bonk():            # head bonk / slip landing
    d = 0.35; t = t_(d); x = np.sin(2 * np.pi * (180 * np.exp(-t * 6) + 90) * t) * np.exp(-t * 14) + lp(rng.standard_normal(len(t)), 1200) * np.exp(-t * 60) * 0.6
    return x
def heartbeat():       # court tension: two-beat thump, twice
    out = np.zeros(int(SR * 1.7))
    for st in [0, 0.22, 0.85, 1.07]:
        d = 0.25; t = t_(d); s = np.sin(2 * np.pi * (60 + 30 * np.exp(-t * 20)) * t) * np.exp(-t * 18); i = int(SR * st); out[i:i + len(s)] += s
    return lp(out, 300)
def sparkle():         # topper entry twinkle
    out = np.zeros(int(SR * 0.9))
    for i in range(14):
        st = int(rng.uniform(0, 0.6) * SR); d = 0.25; t = t_(d); f = rng.uniform(2500, 6000)
        s = np.sin(2 * np.pi * f * t) * np.exp(-t * 18) * 0.4; out[st:st + len(s)] += s[: len(out) - st]
    return verb(out, 0.4, 0.8)
def explosion():       # cartoon BOOM: noise burst + sub, debris crackle
    d = 2.2; t = t_(d); n = rng.standard_normal(len(t))
    x = lp(n, 900) * np.exp(-t * 3) * 1.2 + sweep(70, 30, d, curve=2) * np.exp(-t * 2.5) * 1.4 + hp(n, 3000) * (rng.random(len(t)) > 0.995) * np.exp(-t * 2)
    return np.tanh(x * 2) * env(len(t), 0.002, 0.8)
def fuse_hiss():       # sutli fuse sparks
    d = 2.0; t = t_(d); n = bp(rng.standard_normal(len(t)), 2500, 9000); crack = (rng.random(len(t)) > 0.998) * rng.standard_normal(len(t)) * 3
    return (n * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)) + crack) * env(len(t), 0.05, 0.3)
def typing():          # comment box typing, 6 keys
    out = np.zeros(int(SR * 0.9))
    for i in range(6):
        d = 0.05; s = hp(rng.standard_normal(int(SR * d)), 1800) * np.exp(-t_(d) * 120); st = int(SR * i * 0.12); out[st:st + len(s)] += s
    return out
def rain():            # small rain cloud
    d = 3.0; t = t_(d); drops = (rng.random(len(t)) > 0.992) * rng.standard_normal(len(t)); x = bp(drops, 1500, 7000) + lp(rng.standard_normal(len(t)), 2500) * 0.08
    return x * env(len(t), 0.3, 0.6)
def thump():           # trishul haazri floor thump
    d = 1.2; t = t_(d); x = np.sin(2 * np.pi * (55 + 60 * np.exp(-t * 25)) * t) * np.exp(-t * 4) + lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 25) * 0.8
    return verb(np.tanh(x * 2), 0.6, 1.8)
if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [('boom', boom), ('record_scratch', record_scratch), ('dun_dun_dun', dun_dun_dun), ('sad_trombone', sad_trombone), ('ding', ding), ('boing', boing),
                     ('tick', tick), ('whoosh', whoosh), ('magic_swirl', magic_swirl), ('bonk', bonk), ('heartbeat', heartbeat), ('sparkle', sparkle),
                     ('explosion', explosion), ('fuse_hiss', fuse_hiss), ('typing', typing), ('rain', rain), ('thump', thump)]:
        save(name, fn())
