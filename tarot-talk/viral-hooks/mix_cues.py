"""Mix an SFX cue sheet onto a voice track.  python3 mix_cues.py cues.json voice.wav out.wav [crow.wav]"""
import json, sys, os, numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly
SR = 48000; HERE = os.path.dirname(os.path.abspath(__file__))
def load(p):
    sr, x = wavfile.read(p); x = x.astype(np.float32) / (32768 if x.dtype == np.int16 else 1)
    if x.ndim > 1: x = x.mean(1)
    return resample_poly(x, SR, sr) if sr != SR else x
cues = json.load(open(sys.argv[1]))['cues']; voice = load(sys.argv[2]); crow = load(sys.argv[4]) if len(sys.argv) > 4 else None
mix = np.zeros(len(voice) + SR * 3, np.float32); mix[:len(voice)] += voice
for c in cues:
    t, name, g = c[0], c[1], c[2]
    s = crow if name == 'CROW' else load(os.path.join(HERE, 'sfx', name + '.wav'))
    if s is None: continue
    i = int(t * SR); s = s * 10 ** (g / 20) * 0.7; mix[i:i + len(s)] += s[: len(mix) - i]
# duck nothing yet (final ducking + music in Batch 3); soft clip and trim to the voice length
mix = np.tanh(mix[:len(voice)] * 1.1) / 1.1
wavfile.write(sys.argv[3], SR, (mix / max(1e-9, np.abs(mix).max()) * 0.95 * 32767).astype(np.int16))
print('mixed', len(cues), 'cues ->', sys.argv[3])
