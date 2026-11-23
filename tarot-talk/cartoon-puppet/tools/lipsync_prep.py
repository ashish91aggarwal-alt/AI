"""Acting drive data: 100 Hz loudness per line, brightness (ee shapes), syllable onsets, speaker windows -> work/<slug>/lipsync.json"""
import os, csv, json, numpy as np
from common import video, load, mapper
slug, vdir, work, cfg = video(); new_t = mapper(work)
x = load(os.path.join(work, 'voice.wav'), sr=16000); H = 160; n = len(x) // H
fr = x[:n * H].reshape(n, H); r = np.sqrt((fr ** 2).mean(1)); zc = (np.abs(np.diff(np.sign(fr), axis=1)) > 0).mean(1)
spk, ov = [], cfg.get('line_end_override', {})
for row in csv.DictReader(open(os.path.join(vdir, cfg['cue_sheet']))):
    a, b = new_t(float(row['start_s'])), new_t(float(ov.get(row['id'], row['end_s'])))
    spk.append([round(a, 3), round(b, 3), row['who'], row['id']])
amp = np.zeros(n)
for a, b, who, _ in spk:
    i, j = int(a * 100), min(n, int(b * 100) + 5); s = r[i:j]
    if len(s): amp[i:j] = np.clip(s / (np.percentile(s, 92) + 1e-6), 0, 1.2)
amp = np.convolve(amp, np.ones(3) / 3, 'same'); d = np.diff(amp, prepend=0); on = ((d > 0.18) & (amp > 0.35)).astype(int)
json.dump({'fps': 100, 'amp': [round(v, 3) for v in amp], 'zcr': [round(v, 3) for v in zc], 'onset': on.tolist(), 'spk': spk, 'speakers': cfg.get('speakers', {})}, open(os.path.join(work, 'lipsync.json'), 'w'))
print('lipsync frames', n, 'lines', len(spk))
