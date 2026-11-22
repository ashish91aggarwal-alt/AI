"""listen - "ears by measurement" for a music file.
Usage:  python3 listen.py track.mp3 [report.png]"""
import subprocess, sys, json, re, os
import numpy as np

SR = 44100
FF = "/usr/local/bin/ffmpeg" if os.path.exists("/usr/local/bin/ffmpeg") else "ffmpeg"


def load(path):
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2).astype(np.float64)


def ebur128(path):
    out = subprocess.run([FF, "-nostats", "-i", path, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    tail = out[out.rfind("Summary:"):]
    g = lambda pat: float(re.search(pat, tail).group(1)) if re.search(pat, tail) else None
    return {"lufs": g(r"I:\s+(-?[\d.]+) LUFS"), "range_lu": g(r"LRA:\s+(-?[\d.]+) LU"), "true_peak_db": g(r"Peak:\s+(-?[\d.]+) dBFS")}


BANDS = [("sub <60", 0, 60, (0, 8)), ("bass 60-250", 60, 250, (15, 40)), ("low-mid 250-500", 250, 500, (10, 28)),
         ("mid 500-2k", 500, 2000, (18, 42)), ("presence 2-6k", 2000, 6000, (4, 18)), ("air >6k", 6000, 22050, (0.5, 6))]


def stft(x, n=2048, hop=512):
    w = np.hanning(n)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (n // 2, n // 2)), n)[::hop]
    return np.abs(np.fft.rfft(frames * w, axis=1)), np.fft.rfftfreq(n, 1 / SR), hop


def tempo(mag, hop):
    flux = np.maximum(0, np.diff(np.log1p(mag * 50), axis=0)).sum(axis=1)
    flux = np.maximum(flux - np.convolve(flux, np.ones(43) / 43, "same"), 0)
    ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
    fps = SR / hop
    lags = np.arange(len(ac))
    bpm = np.where(lags > 0, 60 * fps / np.maximum(lags, 1), 0)
    ok = (bpm >= 70) & (bpm <= 180)
    best = lags[ok][np.argmax(ac[ok])]
    score = max(flux[ph::best].sum() + flux[ph + 1::best].sum() for ph in range(best - 1)) / max(flux.sum(), 1e-9) * best / 2
    return float(60 * fps / best), float(score), flux, fps


KRUM_MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KRUM_MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
NOTE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def chroma(mag, freqs):
    c = np.zeros((mag.shape[0], 12))
    sel = (freqs > 60) & (freqs < 4000)
    pc = (np.round(12 * np.log2(freqs[sel] / 261.626)) % 12).astype(int)
    for k in range(12):
        c[:, k] = (mag[:, sel][:, pc == k] ** 2).sum(axis=1)
    return c


def key_of(ch):
    v = ch.sum(axis=0); best = None
    for k in range(12):
        for name, prof in (("major", KRUM_MAJ), ("minor", KRUM_MIN)):
            r = np.corrcoef(np.roll(prof, k), v)[0, 1]
            if best is None or r > best[0]:
                best = (r, f"{NOTE[k]} {name}")
    return best[1], float(best[0])


def analyse(path, png=None, sections=None, quiet=False):
    x = load(path); mono = x.mean(axis=1)
    rep = {"file": os.path.basename(path), "seconds": round(len(x) / SR, 2)}
    rep.update(ebur128(path))
    rep["clipped_samples"] = int((np.abs(x) > 0.995).sum())
    rms = np.sqrt((mono ** 2).mean()); rep["crest_db"] = round(float(20 * np.log10(np.abs(mono).max() / max(rms, 1e-9))), 1)
    P = np.abs(np.fft.rfft(mono)) ** 2; f = np.fft.rfftfreq(len(mono), 1 / SR)
    tot = P.sum(); rep["balance_%"] = {}; warn = []
    for name, lo, hi, (a, b) in BANDS:
        pct = 100 * P[(f >= lo) & (f < hi)].sum() / tot
        rep["balance_%"][name] = round(float(pct), 1)
        if pct < a: warn.append(f"{name} is thin ({pct:.1f}%, usual {a}-{b}%)")
        if pct > b: warn.append(f"{name} is heavy ({pct:.1f}%, usual {a}-{b}%)")
    harsh = 100 * P[(f >= 2500) & (f < 5000)].sum() / tot
    mud = 100 * P[(f >= 200) & (f < 400)].sum() / tot
    if harsh > 12: warn.append(f"may sound harsh: {harsh:.1f}% of energy at 2.5-5 kHz")
    if mud > 30: warn.append(f"may sound muddy: {mud:.1f}% of energy at 200-400 Hz")
    mag, freqs, hop = stft(mono)
    bpm, tight, flux, fps = tempo(mag, hop)
    rep["tempo_bpm"] = round(bpm, 1); rep["beat_tightness"] = round(tight, 2)
    mag8, freqs8, _ = stft(mono, 8192, 2048)
    ch = chroma(mag8, freqs8); rep["key"], kc = key_of(ch); rep["key_confidence"] = round(kc, 2)
    rep["key_note"] = "rough estimate: overtones pull it towards the fifth"
    L, R = x[:, 0], x[:, 1]
    rep["stereo_correlation"] = round(float(np.corrcoef(L, R)[0, 1]), 2)
    rep["side_to_mid_db"] = round(float(10 * np.log10(((L - R) ** 2).mean() / max(((L + R) ** 2).mean(), 1e-12))), 1)
    if rep["stereo_correlation"] > 0.97: warn.append("almost mono: little stereo width")
    if rep["true_peak_db"] is not None and rep["true_peak_db"] > -0.5: warn.append(f"true peak {rep['true_peak_db']} dBFS: leave about 1 dB of headroom")
    if rep["lufs"] is not None and not (-17 <= rep["lufs"] <= -12): warn.append(f"loudness {rep['lufs']} LUFS: streaming targets sit around -14")
    if rep["clipped_samples"] > 20: warn.append(f"{rep['clipped_samples']} clipped samples")
    sec = int(len(mono) / SR)
    curve = [float(20 * np.log10(max(np.sqrt((mono[i * SR:(i + 1) * SR] ** 2).mean()), 1e-6))) for i in range(sec)]
    rep["loudness_curve_db"] = [round(v, 1) for v in curve]
    gaps = [i for i, v in enumerate(curve) if v < -45]
    if gaps: warn.append(f"near-silence at seconds {gaps[:8]}")
    if sections:
        rep["sections_db"] = {n: round(float(np.mean(curve[int(a):max(int(a) + 1, int(b))])), 1) for n, a, b in sections}
    rep["warnings"] = warn
    if png:
        import matplotlib; matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(4, 1, figsize=(15, 11), gridspec_kw={"height_ratios": [1, 2.4, 1.1, 1]})
        t = np.arange(len(mono)) / SR
        ax[0].plot(t[::200], mono[::200], lw=0.4, color="#3478d0"); ax[0].plot(np.arange(sec) + .5, 10 ** (np.array(curve) / 20), color="#e04b3a", lw=1.6)
        ax[0].set_xlim(0, t[-1]); ax[0].set_title(f"{rep['file']}  -  {rep['lufs']} LUFS, {rep['tempo_bpm']} bpm, {rep['key']}  (blue: waveform, red: loudness)")
        fb = np.geomspace(50, 16000, 160); idx = np.searchsorted(freqs, fb)
        spec = np.stack([mag[:, idx[i]:max(idx[i] + 1, idx[i + 1])].mean(axis=1) for i in range(len(fb) - 1)], axis=1)
        ax[1].imshow(20 * np.log10(spec.T + 1e-4), origin="lower", aspect="auto", cmap="magma", extent=[0, t[-1], 0, len(fb) - 1], vmin=-55, vmax=5)
        ticks = [50, 100, 200, 500, 1000, 2000, 5000, 10000]
        ax[1].set_yticks([np.searchsorted(fb, v) for v in ticks]); ax[1].set_yticklabels([str(v) for v in ticks]); ax[1].set_ylabel("Hz")
        ax[2].imshow(np.log1p(ch.T / ch.max() * 100), origin="lower", aspect="auto", cmap="viridis", extent=[0, t[-1], 0, 12])
        ax[2].set_yticks(np.arange(12) + .5); ax[2].set_yticklabels(NOTE); ax[2].set_ylabel("pitch class")
        ax[3].plot(np.arange(len(flux)) / fps, flux, lw=0.6, color="#3f9a63"); ax[3].set_xlim(0, t[-1]); ax[3].set_ylabel("note onsets"); ax[3].set_xlabel("seconds")
        if sections:
            for a_ in ax:
                for n, s0, s1 in sections:
                    a_.axvline(s0, color="white" if a_ in (ax[1], ax[2]) else "#888", lw=0.8, ls="--")
            for n, s0, s1 in sections:
                ax[0].text(s0 + 0.2, ax[0].get_ylim()[1] * 0.8, n, fontsize=9)
        plt.tight_layout(); plt.savefig(png, dpi=90); plt.close()
    if not quiet:
        print(json.dumps(rep, indent=1))
    return rep


if __name__ == "__main__":
    analyse(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
