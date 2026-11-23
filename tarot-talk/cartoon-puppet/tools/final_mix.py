"""Final mix: mix_raw + music (video.json music_db), two-pass loudnorm to video.json lufs (-14) at -1.5 dBTP -> work/<slug>/mix.wav"""
import os, json, subprocess, numpy as np
from scipy.io import wavfile
from common import video, load, SR
slug, vdir, work, cfg = video(); W = lambda f: os.path.join(work, f)
a, m = load(W('mix_raw.wav')), load(W('music.wav')); out = np.zeros(max(len(a), len(m)), np.float32)
out[:len(a)] += a; out[:len(m)] += m * 10 ** (cfg.get('music_db', -13) / 20); out = np.tanh(out * 1.05) / 1.05
wavfile.write(W('final_raw.wav'), SR, (out / np.abs(out).max() * 0.95 * 32767).astype(np.int16))
L = cfg.get('lufs', -14)
r = subprocess.run(['ffmpeg', '-i', W('final_raw.wav'), '-af', f'loudnorm=I={L}:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
d = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
f = f"loudnorm=I={L}:TP=-1.5:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', W('final_raw.wav'), '-af', f, '-ar', str(SR), W('mix.wav')], check=True); print('final mix ok')
