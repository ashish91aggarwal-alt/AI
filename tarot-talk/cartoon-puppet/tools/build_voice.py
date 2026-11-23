"""Splice original meme lines into the voice track through an edit list (video.json 'meme_lines').
Writes work/<slug>/voice.wav and timeline.json (pieces mapping script clock [a,b] -> video clock [A,B])."""
import os, json, numpy as np
from scipy.io import wavfile
from common import video, load, fade, rms, memes_dir, SR
slug, vdir, work, cfg = video()
vt = load(os.path.join(vdir, cfg['voice_track'])); seg = lambda a, b: vt[int(a * SR):int(b * SR)]
pieces, out, t0 = [], [], 0.0
for m in sorted(cfg.get('meme_lines', []), key=lambda m: m['window'][0]):
    wa, wb = m['window']
    out.append(seg(t0, wa)); pieces.append({'kind': 'copy', 'a': t0, 'b': wa})
    c = fade(load(os.path.join(memes_dir(), m['file']), m.get('in', 0), m.get('out')), 8); c *= rms(seg(wa, wb)) / rms(c)
    c = np.concatenate([c, np.zeros(int(m.get('pad', 0) * SR), np.float32)]); out.append(c)
    pieces.append({'kind': 'clip', 'name': m['name'], 'a': wa, 'b': wb, 'len': len(c) / SR}); t0 = wb
out.append(seg(t0, len(vt) / SR)); pieces.append({'kind': 'copy', 'a': t0, 'b': len(vt) / SR})
T = 0.0
for p in pieces: p['A'] = round(T, 4); T += (p['b'] - p['a']) if p['kind'] == 'copy' else p['len']; p['B'] = round(T, 4)
y = np.concatenate(out); wavfile.write(os.path.join(work, 'voice.wav'), SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
json.dump({'pieces': pieces, 'duration': len(y) / SR}, open(os.path.join(work, 'timeline.json'), 'w'), indent=1)
print('voice', round(len(y) / SR, 2), 's,', sum(p['kind'] == 'clip' for p in pieces), 'original clips')
