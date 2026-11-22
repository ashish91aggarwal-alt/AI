"""Temp mix v5 on the v3 clock: voice_track_v3 (with 5 original meme lines) + our SFX + trending meme sounds.
All cue times are written on the ORIGINAL script clock and mapped through audio/timeline_v3.json."""
import json, subprocess, numpy as np
from scipy.io import wavfile
SR = 48000; HK = '../viral-hooks/'
TL = json.load(open('audio/timeline_v3.json'))['pieces']
def new_t(to):
    for p in TL:
        if p['a'] <= to <= p['b'] and p['b'] > p['a']: return p['A'] + (to - p['a']) * (p['B'] - p['A']) / (p['b'] - p['a'])
    return to
def load(p, a=0, b=None):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    x = np.frombuffer(r, np.float32).copy(); x = x[int(a * SR): None if b is None else int(b * SR)]
    n = min(len(x) // 4, int(0.02 * SR)); x[:n] *= np.linspace(0, 1, n); f = min(len(x) // 3, int(0.25 * SR)); x[-f:] *= np.linspace(1, 0, f); return x
voice = load('audio/voice_track_v3.wav'); mix = np.zeros(len(voice) + SR * 4, np.float32); mix[:len(voice)] += voice
pk = lambda x: x / (np.abs(x).max() + 1e-9)
def put(to, x, db): i = int(new_t(to) * SR); x = pk(x) * 10 ** (db / 20) * 0.7; mix[i:i + len(x)] += x[: len(mix) - i]
VB = load('audio/memes/vine-boom.mp3')
for c in json.load(open(HK + 'mulank8_sfx_cues.json'))['cues']:
    t, name, g = c[0], c[1], c[2]
    if name == 'sad_trombone': continue
    if t == 16.07 and name == 'record_scratch': t, g = 15.98, -12
    if t == 0.95 and name == 'boom': put(1.52, VB, g + 1); continue          # after the original "Ab tu gaya beta"
    if t == 45.30 and name == 'boom': put(45.84, VB, g + 1); continue        # after Rakesh Bedi's line
    if name == 'boom' and t in (14.52, 69.82): put(t, VB, g + 1); continue
    if name == 'CROW': put(t, load('../videos/2027-warmup-mulank8/voices/sfx/crow_one_caw.wav'), g); continue
    put(t, load(HK + 'sfx/' + name + '.wav'), g)
put(26.66, load('audio/memes/faaah.mp3', 0, 1.9), -4)
put(56.54, load('audio/memes/moye-moye.mp3', 0, 3.1), -15)
put(59.47, load('audio/memes/anime-wow-sound-effect.mp3', 0.15, 1.9), -6)
put(78.79, load('audio/memes/faaah.mp3', 0, 1.9), -5)
put(83.12, load('audio/memes/oh-no-no-no-no-laugh.mp3', 0, 2.55), -7)
mix = np.tanh(mix[:len(voice)] * 1.1) / 1.1
wavfile.write('out/mix_raw.wav', SR, (mix / np.abs(mix).max() * 0.95 * 32767).astype(np.int16)); print('ok')
