"""Shared helpers for the audio pipeline. Every script takes the video slug: python3 tools/<x>.py <slug>"""
import json, os, sys, subprocess, numpy as np
SR = 48000
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def video(slug=None):
    slug = slug or (sys.argv[1] if len(sys.argv) > 1 else os.environ.get('VIDEO', '2027-warmup-mulank8'))
    vdir = os.path.join(HERE, '..', 'videos', slug); work = os.path.join(HERE, 'work', slug); os.makedirs(work, exist_ok=True)
    return slug, vdir, work, json.load(open(os.path.join(vdir, 'video.json')))
def load(p, a=0, b=None, sr=SR):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).copy(); return x[int(a * sr): None if b is None else int(b * sr)]
def fade(x, ms=12, out_ms=None):
    n = min(len(x) // 4, int(SR * ms / 1000)); f = min(len(x) // 3, int(SR * (out_ms or ms) / 1000))
    if n: x[:n] *= np.linspace(0, 1, n)
    if f: x[-f:] *= np.linspace(1, 0, f)
    return x
def rms(x): return float(np.sqrt(np.mean(x[np.abs(x) > 0.01] ** 2) + 1e-12))
def mapper(work):
    TL = json.load(open(os.path.join(work, 'timeline.json')))['pieces']
    def new_t(to):
        for p in TL:
            if p['a'] <= to <= p['b'] and p['b'] > p['a']: return p['A'] + (to - p['a']) * (p['B'] - p['A']) / (p['b'] - p['a'])
        return to
    return new_t
def memes_dir(): d = os.path.join(HERE, '..', 'assets', 'audio', 'memes'); os.makedirs(d, exist_ok=True); return d   # shared, committed assets
