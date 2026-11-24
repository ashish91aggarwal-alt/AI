"""ElevenLabs voices for the mol-bhaav Aries reel (owner, 24 Nov 2026 19:48 IST: "use eleven labs for voices. Use right tempo,
emotion, emphasis, pun, expression"; cap 2,000 credits; same voices as the approved Aries 2027 track).

One take per speaker for all their lines (eleven_v4, one emotion tag where the delivery changes; 1,915 credits):
  voices/takes/v13_vishnu.mp3  Samar  (KWuQEGxZQtpWhRutt6g6)  flow TfkttGWBBPH6B5fUzmnc gen 745W0PPQXj4mwTIdyQuB
  voices/takes/v13_sakshi.mp3  Lalita (hHyd5z9VxRT4YKoDwPRl)  flow TfkttGWBBPH6B5fUzmnc gen gsNMvQxI5t1CM25Lcg4v
Prompts: voices/takes/{vishnu,sakshi}_v13.txt. Line cuts come from word timestamps (faster-whisper) and are snapped to the
quietest point near each boundary. Pitch-kept tempo, inner pauses squeezed, then the same track/beat/caption outputs as
build_voices.py (memes spliced from the originals).    python3 build_voices_el.py"""
import os, json, csv, re, subprocess, numpy as np, soundfile as sf
import build_voices as BV
HERE = BV.HERE; SR = BV.SR; TK = os.path.join(HERE, 'voices', 'takes')
TEMPO = {'Vishnu ji': 1.08, 'Sakshi': 1.08}
LINE_TEMPO = {'K07': 0.92, 'K13': 0.95, 'K15': 1.0}   # reviewer: these ran over 3.6 words/s
INSERT = {'V02': [(4.6, 0.55)], 'K17': [(8.42, 0.3)]}   # (raw s from the line start, s of silence): beat before 'shaadi ka menu' and 'Wakeel haari nahi'
BEAT = {'V02': 0.45, 'V14': 0.45, 'K17': 0.45, 'V04': 0.35, 'K09': 0.3}   # let the punchline pauses breathe (default cap 0.2 s)   # v4 Hindi reads a touch slow; this lands near 3 words/s without sounding rushed
# rough boundaries (s, in the raw take) from the transcript; each is snapped to the quietest 20 ms inside +-0.35 s
CUTS = {
 'Sakshi':    ('v13_sakshi.mp3', ['K01', 'K03', 'K05', 'K07', 'K09', 'K11', 'K13', 'K15', 'K17', 'K18'], [5.1, (10.45, 0.1), 13.9, 17.45, 22.8, 26.14, 30.55, 37.27, 48.6]),
 'Vishnu ji': ('v13_vishnu.mp3', ['V02', 'V04', 'V06', 'V08', 'V10', 'V12', 'V14', 'V16'], [7.0, 18.48, 24.45, 31.5, 36.55, 44.1, 56.05]),
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
        rows.append([name, 'Meme' if name == 'gadbad' else 'Sakshi', round(t, 3), round(t + d, 3), 'meme:' + f, BV.MEME_TEXT[name]])   # gadbad: Paresh Rawal's voice-over, Sakshi only reacts
        beats.append({'id': name, 'type': 'meme', 'start': round(t, 3), 'end': round(t + d, 3), 'who': 'Sakshi', 'line': BV.MEME_TEXT[name],
                      'caption_chunks': [{'text': BV.MEME_TEXT[name], 'from': round(t, 2), 'to': round(t + d, 2)}], 'meme_file': f, 'meme_in': a, 'meme_out': b})
    else:
        lid, who, roman, deva, gap = item; x = PIECES[lid]; d = len(x) / SR
        rows.append([lid, who, round(t, 3), round(t + d, 3), f'voices/lines/{lid}.wav', roman])
        beats.append({'id': lid, 'type': 'line', 'start': round(t, 3), 'end': round(t + d, 3), 'who': who, 'line': roman, 'caption_chunks': BV.chunks(roman.replace('Mangal das January', 'Mangal 10 January'), t, t + d)})
    track += [x, np.zeros(int(gap * SR), np.float32)]; t += d + gap
y = np.concatenate(track); sf.write(os.path.join(HERE, 'voices', 'voice_track_timed.wav'), y, SR, subtype='PCM_16')
with open(os.path.join(HERE, 'voices', 'cue_sheet.csv'), 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['id', 'who', 'start_s', 'end_s', 'file', 'line']); w.writerows(rows)
S = {'meta': {'title': 'Rashi ki file: Aries 2026 → 2027 mol-bhaav', 'channel': 'Tarot Talk By Sakshi (Instagram Reels)',
              'version': 'v13.2 script, ElevenLabs eleven_v4 one take per speaker (Samar / Lalita), 1,915 credits', 'runtime_s': round(len(y) / SR, 2), 'format': '1080x1920, 24 fps, 9:16'}, 'beats': beats}
json.dump(S, open(os.path.join(HERE, 'script.json'), 'w'), ensure_ascii=False, indent=1)
by = {b['id']: b for b in beats}
cues = [[round(by['K03']['end'] - 0.15, 2), 'meme:faaah.mp3', -6, 0, 1.9], [round(by['V10']['end'] + 0.02, 2), 'meme:vine-boom.mp3', -10]]
json.dump({'note': '[script time s, sound, gain dB, (in s), (out s)]: our sfx name, meme:<file>, or voice:<path>', 'cues': cues}, open(os.path.join(HERE, 'sfx_cues.json'), 'w'), indent=0)
json.dump([[c['text'], c['from'], c['to']] for b in beats for c in b['caption_chunks']], open(os.path.join(HERE, 'captions.json'), 'w'), ensure_ascii=False, indent=0)
words = sum(len(re.findall(r"[A-Za-z']+|\d+", b['line'])) for b in beats if b['type'] == 'line'); sp = sum(b['end'] - b['start'] for b in beats if b['type'] == 'line')
print(f'voice track {len(y) / SR:.2f} s, {len(beats)} beats, speech pace {words / sp:.2f} words/s')
