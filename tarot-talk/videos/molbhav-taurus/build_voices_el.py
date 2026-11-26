"""ElevenLabs voices for the Taurus mol-bhaav reel v4 (owner, 26 Nov 2026 14:45 IST: "Use elevenlabs voice. But make it a little
faster 90seconds max"; cap 2,000 credits). One eleven_v4 take per speaker, 1,583 credits:
  voices/takes/v4_vishnu.mp3  Samar  (KWuQEGxZQtpWhRutt6g6)  flow 00P52nkN5E18zeXXqTtF gen enxA18HEBVzDr0gNS6Gg  (862)
  voices/takes/v4_sakshi.mp3  Lalita (hHyd5z9VxRT4YKoDwPRl)  flow 00P52nkN5E18zeXXqTtF gen CpO88vP5UM5H4a12Mhxr  (721)
Prompts: voices/takes/{vishnu,sakshi}_v4.txt. Cuts from faster-whisper word times, snapped to the quietest 20 ms.
Then python3 build_voices_el.py; rm captions.json; python3 ../../cartoon-puppet/tools/new_video.py molbhav-taurus"""
import os, json, csv, re, subprocess, numpy as np, soundfile as sf
import build_voices as BV
HERE = BV.HERE; SR = BV.SR; TK = os.path.join(HERE, 'voices', 'takes')
TEMPO = {'Vishnu ji': 1.19, 'Sakshi': 1.17}   # owner: faster, 90 s max
LINE_TEMPO = {}
INSERT = {}
BEAT = {'V02': 0.3, 'V14': 0.3, 'K17': 0.3}
CUTS = {
 'Sakshi':    ('v4_sakshi.mp3', ['K01', 'K03', 'K07', 'K09', 'K13', 'K17', 'K18', 'K19'], [5.4, 9.14, 12.27, 14.88, (18.75, 0.25), (26.15, 0.3), (35.38, 0.06)]),
 'Vishnu ji': ('v4_vishnu.mp3', ['V02', 'V04', 'V06', 'V08', 'V10', 'V14', 'V15', 'V16'], [(5.3, 0.4), (11.48, 0.15), (16.4, 0.3), (24.68, 0.2), (36.18, 0.18), (49.6, 0.08), (54.2, 0.25)]),
}
def load(f):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(TK, f), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout, np.float32).copy()
def snap(x, t, r=0.35):
    w = int(0.02 * SR); a, b = int((t - r) * SR), int((t + r) * SR); best, bt = 9, t
    for i in range(max(0, a), min(len(x) - w, b), w // 2):
        e = float(np.sqrt((x[i:i + w] ** 2).mean()))
        if e < best: best, bt = e, (i + w / 2) / SR
    return bt
PIECES = {}
for who, (f, ids, bounds) in CUTS.items():
    x = load(f); bb = [0.0] + [snap(x, *t) if isinstance(t, tuple) else snap(x, t) for t in bounds] + [len(x) / SR]
    for k, lid in enumerate(ids):
        y = x[int(bb[k] * SR):int(bb[k + 1] * SR)]
        for at_s, d in sorted(INSERT.get(lid, []), reverse=True): i = int(at_s * SR); y = np.concatenate([y[:i], np.zeros(int(d * SR), np.float32), y[i:]])
        p = os.path.join(TK, f'_{lid}.wav'); sf.write(p, y, SR)
        q = os.path.join(HERE, 'voices', 'lines', lid + '.wav')
        BV.ff(p, f'atempo={LINE_TEMPO.get(lid, TEMPO[who])},highpass=f=70,loudnorm=I=-18:TP=-2', q)
        z, _ = sf.read(q); z = BV.squeeze_pauses(BV.trim(z.astype(np.float32)), BEAT.get(lid, 0.2)); sf.write(q, z, SR); PIECES[lid] = z
    print(who, [round(b, 2) for b in bb])

track, t, rows, beats = [], 0.0, [], []
tmp = os.path.join(HERE, 'voices', 'tmp'); os.makedirs(tmp, exist_ok=True)
for item in BV.SCRIPT:
    if item[0] == 'MEME':
        _, name, f, a, b, gap = item; p = os.path.join(tmp, name + '.wav')
        BV.ff(os.path.join(BV.MEMES, f), f'atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={b - a - 0.05}:d=0.05,loudnorm=I=-18:TP=-2', p)
        x, _ = sf.read(p); x = x.astype(np.float32); d = len(x) / SR
        rows.append([name, 'Meme', round(t, 3), round(t + d, 3), 'meme:' + f, BV.MEME_TEXT[name]])   # memes are her thoughts (thought cloud), not lip-synced (owner voice note 24 Nov)
        beats.append({'id': name, 'type': 'meme', 'start': round(t, 3), 'end': round(t + d, 3), 'who': 'Sakshi', 'line': BV.MEME_TEXT[name],
                      'caption_chunks': [{'text': BV.MEME_TEXT[name], 'from': round(t, 2), 'to': round(t + d, 2)}], 'meme_file': f, 'meme_in': a, 'meme_out': b})
    else:
        lid, who, roman, deva, gap = item; x = PIECES[lid]; d = len(x) / SR
        rows.append([lid, who, round(t, 3), round(t + d, 3), f'voices/lines/{lid}.wav', roman])
        beats.append({'id': lid, 'type': 'line', 'start': round(t, 3), 'end': round(t + d, 3), 'who': who, 'line': roman, 'caption_chunks': BV.chunks(roman, t, t + d)})
    track += [x, np.zeros(int(gap * SR), np.float32)]; t += d + gap
y = np.concatenate(track); sf.write(os.path.join(HERE, 'voices', 'voice_track_timed.wav'), y, SR, subtype='PCM_16')
with open(os.path.join(HERE, 'voices', 'cue_sheet.csv'), 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['id', 'who', 'start_s', 'end_s', 'file', 'line']); w.writerows(rows)
S = {'meta': {'title': 'Rashi ki file: Vrishabh 2026 → 2027 mol-bhaav', 'channel': 'Tarot Talk By Sakshi (Instagram Reels)',
              'version': 'v4 script (90 s), ElevenLabs eleven_v4 one take per speaker (Samar / Lalita), 1,583 credits', 'runtime_s': round(len(y) / SR, 2), 'format': '1080x1920, 24 fps, 9:16'}, 'beats': beats}
json.dump(S, open(os.path.join(HERE, 'script.json'), 'w'), ensure_ascii=False, indent=1)
by = {b['id']: b for b in beats}
cues = [[round(by['V04']['end'] + 0.02, 2), 'meme:vine-boom.mp3', -10]]
json.dump({'note': '[script time s, sound, gain dB, (in s), (out s)]: our sfx name, meme:<file>, or voice:<path>', 'cues': cues}, open(os.path.join(HERE, 'sfx_cues.json'), 'w'), indent=0)
json.dump([[c['text'], c['from'], c['to']] for b in beats for c in b['caption_chunks']], open(os.path.join(HERE, 'captions.json'), 'w'), ensure_ascii=False, indent=0)
words = sum(len(re.findall(r"[A-Za-z']+|\d+", b['line'])) for b in beats if b['type'] == 'line'); sp = sum(b['end'] - b['start'] for b in beats if b['type'] == 'line')
print(f'voice track {len(y) / SR:.2f} s, {len(beats)} beats, speech pace {words / sp:.2f} words/s')
