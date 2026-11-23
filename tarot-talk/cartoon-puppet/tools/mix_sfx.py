"""Voice + SFX + meme sounds (video 'sfx_cues', script clock) -> work/<slug>/mix_raw.wav"""
import os, json, numpy as np
from scipy.io import wavfile
from common import video, load, fade, mapper, memes_dir, HERE, SR
slug, vdir, work, cfg = video(); new_t = mapper(work)
voice = load(os.path.join(work, 'voice.wav')); mix = np.zeros(len(voice) + SR * 4, np.float32); mix[:len(voice)] += voice
cues = json.load(open(os.path.join(vdir, cfg['sfx_cues'])))['cues'] if cfg.get('sfx_cues') else []
for c in cues:
    t, name, g = c[0], c[1], c[2]; a = c[3] if len(c) > 3 else 0; b = c[4] if len(c) > 4 else None
    p = os.path.join(memes_dir(), name[5:]) if name.startswith('meme:') else os.path.join(vdir, name[6:]) if name.startswith('voice:') else os.path.join(HERE, '..', 'viral-hooks', 'sfx', name + '.wav')
    x = fade(load(p, a, b), 20, 250); x = x / (np.abs(x).max() + 1e-9) * 10 ** (g / 20) * 0.7
    i = int(new_t(t) * SR); mix[i:i + len(x)] += x[: len(mix) - i]
mix = np.tanh(mix[:len(voice)] * 1.1) / 1.1
wavfile.write(os.path.join(work, 'mix_raw.wav'), SR, (mix / np.abs(mix).max() * 0.95 * 32767).astype(np.int16)); print('sfx cues', len(cues))
