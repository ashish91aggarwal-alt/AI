"""Mouth/acting drive data from the final voice track: 100 Hz loudness (0..1 per line) + brightness (for ee/oo shapes),
syllable onsets, and who speaks when (cue sheet windows mapped to the v3 clock)."""
import json, csv, subprocess, numpy as np
TL = json.load(open('audio/timeline_v3.json'))['pieces']
def new_t(to):
    for p in TL:
        if p['a'] <= to <= p['b'] and p['b'] > p['a']: return p['A'] + (to - p['a']) * (p['B'] - p['A']) / (p['b'] - p['a'])
    return to
SR = 16000
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'audio/voice_track_v3.wav', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32); H = SR // 100; n = len(x) // H
fr = x[:n * H].reshape(n, H); rms = np.sqrt((fr ** 2).mean(1)); zc = (np.abs(np.diff(np.sign(fr), axis=1)) > 0).mean(1)
spk = []
for r in csv.DictReader(open('../videos/2027-warmup-mulank8/voices/cue_sheet.csv')):
    a, b = new_t(float(r['start_s'])), new_t(float(r['end_s']))
    if r['id'] == 'M07': b = new_t(18.55)
    spk.append([round(a, 3), round(b, 3), r['who'], r['id']])
amp = np.zeros(n)
for a, b, who, _ in spk:   # normalise loudness inside each line so quiet and loud voices both open the mouth fully
    i, j = int(a * 100), min(n, int(b * 100) + 5); seg = rms[i:j]
    if len(seg): amp[i:j] = np.clip(seg / (np.percentile(seg, 92) + 1e-6), 0, 1.2)
amp = np.convolve(amp, np.ones(3) / 3, 'same')
on = np.zeros(n); d = np.diff(amp, prepend=0); on[(d > 0.18) & (amp > 0.35)] = 1   # syllable onsets for brow/head accents
json.dump({'fps': 100, 'amp': [round(v, 3) for v in amp], 'zcr': [round(v, 3) for v in zc], 'onset': [int(v) for v in on], 'spk': spk, 'timeline': TL}, open('audio/lipsync.json', 'w'))
print('frames', n, 'lines', len(spk), 'onsets', int(on.sum()))
