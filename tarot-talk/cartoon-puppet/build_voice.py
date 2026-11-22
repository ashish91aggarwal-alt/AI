"""Voice track v3: original meme clips spliced into voice_track_timed.wav through an edit list.
Each piece maps an ORIGINAL-clock window [a, b] to a stretch of the new track: either the original audio copied, or an
original clip that replaces our take. audio/timeline_v3.json holds the piece list so video, captions and SFX can map clocks."""
import numpy as np, json, subprocess
from scipy.io import wavfile
SR = 48000; V = '../videos/2027-warmup-mulank8/voices/voice_track_timed.wav'
def load(p, a=0, b=None):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).copy(); return x[int(a * SR): None if b is None else int(b * SR)]
rms = lambda x: np.sqrt(np.mean(x[np.abs(x) > 0.01] ** 2) + 1e-12)
def fade(x, ms=12): n = int(SR * ms / 1000); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n); return x
vt = load(V); seg = lambda a, b: vt[int(a * SR):int(b * SR)]
CLIPS = {  # name: (file, in, out, original window it replaces, pad after (s))
  'abtugaya1': ('audio/memes/ab-tu-gaya-beta-puneet.mp3', 2.48, 3.88, (0.55, 1.57), 0.04),   # Vishnu V01 first half -> Puneet Superstar original
  'aayein':    ('audio/memes/aayein-meme.mp3', 0.0, None, (3.36, 3.98), 0.0),               # Monty M02 -> original meme
  'ruko':      ('audio/memes/ruko-zara-sabar-karo-bhau.mp3', 0.04, 1.84, (16.07, 17.47), 0.06),             # Monty M07 first half -> Hindustani Bhau
  'bachcha':   ('audio/memes/bachcha-hai-tu-mera-rakesh-bedi.mp3', 0.30, 1.56, (44.30, 45.84), 0.0),    # Shani S15 -> Rakesh Bedi
  'abtugaya2': ('audio/memes/ab-tu-gaya-beta-puneet.mp3', 2.48, 3.88, (81.68, 83.07), 0.0),  # Vishnu V27 -> Puneet Superstar original
}
pieces, out, t0 = [], [], 0.0
for name, (f, a, b, (wa, wb), pad) in sorted(CLIPS.items(), key=lambda kv: kv[1][3][0]):
    keep = seg(t0, wa); out.append(keep); pieces.append({'kind': 'copy', 'a': t0, 'b': wa})
    c = fade(load(f, a, b), 8); c *= rms(seg(wa, wb)) / rms(c)
    c = np.concatenate([c, np.zeros(int(pad * SR), np.float32)]); out.append(c); pieces.append({'kind': 'clip', 'name': name, 'a': wa, 'b': wb, 'len': len(c) / SR})
    t0 = wb
out.append(seg(t0, len(vt) / SR)); pieces.append({'kind': 'copy', 'a': t0, 'b': len(vt) / SR})
T = 0.0
for p in pieces: p['A'] = round(T, 4); T += (p['b'] - p['a']) if p['kind'] == 'copy' else p['len']; p['B'] = round(T, 4)
y = np.concatenate(out)
wavfile.write('audio/voice_track_v3.wav', SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
json.dump({'pieces': pieces, 'duration': len(y) / SR}, open('audio/timeline_v3.json', 'w'), indent=1)
for p in pieces: print(p)
print('duration', round(len(y) / SR, 2))
