"""Final mix: out/mix_raw.wav (voice + SFX + memes) + out/music.wav at -13 dB, then two-pass loudnorm to -14 LUFS, -1.5 dBTP."""
import subprocess, json, numpy as np
from scipy.io import wavfile
SR = 48000
def load(p):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout; return np.frombuffer(r, np.float32).copy()
a, m = load('out/mix_raw.wav'), load('out/music.wav'); out = np.zeros(max(len(a), len(m)), np.float32)
out[:len(a)] += a; out[:len(m)] += m * 10 ** (-13 / 20); out = np.tanh(out * 1.05) / 1.05
wavfile.write('out/final_raw.wav', SR, (out / np.abs(out).max() * 0.95 * 32767).astype(np.int16))
r = subprocess.run(['ffmpeg', '-i', 'out/final_raw.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
d = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
f = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', 'out/final_raw.wav', '-af', f, '-ar', str(SR), 'out/mix.wav'], check=True); print('final mix ok')
