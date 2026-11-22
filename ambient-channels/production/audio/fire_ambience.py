"""Fireplace ambience made in code (no samples): low roar + soft crackles + rare pops.
Usage: python3 fire_ambience.py out.wav seconds [seed]"""
import sys, numpy as np, wave

SR = 48000


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = a * s + (1 - a) * x[i]; y[i] = s
    return y


def fft_filter(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: g *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(x))


def crackle_bank(rng, n=64):
    bank = []
    for _ in range(n):
        L = int(SR * rng.uniform(0.004, 0.03))
        t = np.arange(L) / SR
        burst = rng.normal(size=L) * np.exp(-t / rng.uniform(0.001, 0.008))
        burst = fft_filter(np.pad(burst, (0, 256)), rng.uniform(800, 2500), rng.uniform(5000, 11000))[:L]
        bank.append(burst / (np.abs(burst).max() + 1e-9))
    return bank


def make(seconds, seed=1):
    rng = np.random.default_rng(seed)
    N = int(seconds * SR)
    out = np.zeros((N, 2))
    # roar: brown-ish noise, slowly breathing in level
    for ch in range(2):
        w = rng.normal(size=N)
        roar = fft_filter(w, 40, 380)
        e = fft_filter(rng.normal(size=N), None, 0.4)
        env = 0.8 + 0.2 * e / (e.std() + 1e-12)
        out[:, ch] += 0.06 * roar / roar.std() * np.clip(env, 0.4, 1.3)
    bank = crackle_bank(rng)
    # crackles: clustered Poisson (wood crackles come in little bursts)
    t = 0.0
    while t < seconds:
        t += rng.exponential(0.35)
        k = rng.integers(1, 6)
        for j in range(k):
            tt = t + j * rng.uniform(0.01, 0.06)
            i0 = int(tt * SR)
            b = bank[rng.integers(len(bank))]
            if i0 + len(b) >= N: continue
            amp = rng.uniform(0.02, 0.12) * (1.0 if rng.random() > 0.04 else 3.0)  # rare pop
            pan = rng.uniform(0.25, 0.75)
            out[i0:i0 + len(b), 0] += amp * b * (1 - pan)
            out[i0:i0 + len(b), 1] += amp * b * pan
    # gentle room: short smear
    k = np.exp(-np.arange(int(0.08 * SR)) / (0.02 * SR)); k /= k.sum()
    for ch in range(2):
        out[:, ch] = 0.8 * out[:, ch] + 0.2 * np.convolve(out[:, ch], k, "same")
    # fade edges
    f = int(0.5 * SR); r = np.linspace(0, 1, f)[:, None]
    out[:f] *= r; out[-f:] *= r[::-1]
    return out / max(1e-9, np.abs(out).max()) * 0.5


if __name__ == "__main__":
    o, s = sys.argv[1], float(sys.argv[2]); seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    x = make(s, seed)
    with wave.open(o, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
