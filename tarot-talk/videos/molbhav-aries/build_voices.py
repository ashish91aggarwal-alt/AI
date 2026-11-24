"""Free voices for the mol-bhaav Aries reel (owner, 24 Nov 2026: "Dont spend any credit... use default/free voices").
Kokoro-82M (Apache-2.0, runs on CPU, no account, no credits): Vishnu ji = hm_psi, Sakshi = hf_beta.
Original meme clips are baked into the voice track at their beats (Sakshi lip-syncs them); FAAAH and the vine boom
are sounds and go into sfx_cues.json instead.

    python3 build_voices.py <kokoro-v1.0.onnx> <voices-v1.0.bin>

Writes voices/lines/*.wav, voices/voice_track_timed.wav, voices/cue_sheet.csv, script.json (beats with times and
caption chunks) and sfx_cues.json. Model files: github.com/thewh1teagle/kokoro-onnx releases (model-files-v1.0)."""
import os, sys, csv, json, re, subprocess, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__)); SR = 44100
MEMES = os.path.join(HERE, '..', '..', 'assets', 'audio', 'memes')
VOICE = {'Vishnu ji': dict(voice='hm_psi', speed=1.0, tempo=1.06, semis=-0.6),
         'Sakshi': dict(voice='hf_beta', speed=1.0, tempo=1.10, semis=0.0)}
GAP, LAUGH = 0.08, 0.35

# (id, who, roman line for captions, devanagari text for the voice, gap_after)  -- or ('MEME', name, file, in, out, gap_after)
SCRIPT = [
 ('K01', 'Sakshi', "Prabhu, main Aries walon ki wakeel hun, aur ye raha unka 2026 ka hisaab!", "प्रभु, मैं एरीज़ वालों की वकील हूँ, और ये रहा उनका दो हज़ार छब्बीस का हिसाब!", GAP),
 ('V02', 'Vishnu ji', "Arre, itni lambi list? Ye shikayat hai ya shaadi ka menu?", "अरे, इतनी लंबी लिस्ट? ये शिकायत है, या शादी का मेन्यू?", LAUGH),
 ('K03', 'Sakshi', "Suniye na, salary paanch tarikh tak gayab, neend reels mein gayi, aur jo share kharida, wo kharidte hi gir gaya!", "सुनिए ना, सैलरी पाँच तारीख तक गायब, नींद रील्स में गई, और जो शेयर खरीदा, वो खरीदते ही गिर गया!", 1.55),
 ('V04', 'Vishnu ji', "Sade Sati chal rahi hai, toh thoda hilna-dulna toh banta hai.", "साढ़े साती चल रही है, तो थोड़ा हिलना डुलना तो बनता है।", 0.12),
 ('MEME', 'arey_baap_re', 'arey-baap-re.mp3', 0.0, 1.21, 0.06),
 ('K05', 'Sakshi', "Toh gadbad hai re baba!", "तो गड़बड़ है रे बाबा!", GAP),
 ('V06', 'Vishnu ji', "Arre ghabrao mat, isiliye toh mol-bhaav ho raha hai. Bolo, kya chahiye?", "अरे घबराओ मत, इसीलिए तो मोल भाव हो रहा है। बोलो, क्या चाहिए?", 0.12),
 ('MEME', 'abhi_maza', 'abhi-maza-aayega-na-bhidu.mp3', 1.95, 4.36, 0.08),
 ('K07', 'Sakshi', "Toh Prabhu, 2027 mein salary double!", "तो प्रभु, दो हज़ार सत्ताईस में सैलरी डबल!", GAP),
 ('V08', 'Vishnu ji', "Double nahi, par March-April aur June mein paisa achha aa sakta hai, bas pehle bachat.", "डबल नहीं, पर मार्च अप्रैल और जून में पैसा अच्छा आ सकता है, बस पहले बचत।", 0.12),
 ('MEME', 'lekin_ek_second', 'lekin-ek-second.mp3', 0.0, 1.23, 0.06),
 ('K09', 'Sakshi', "Dedh guna? Chaliye sawa guna, final!", "डेढ़ गुना? चलिए सवा गुना, फ़ाइनल!", GAP),
 ('V10', 'Vishnu ji', "Wakeel sahiba, ye sabzi mandi nahi hai.", "वकील साहिबा, ये सब्ज़ी मंडी नहीं है।", GAP),
 ('K11', 'Sakshi', "Toh kam se kam dhaniya toh free kar dijiye!", "तो कम से कम धनिया तो फ़्री कर दीजिए!", 0.75),
 ('K12', 'Sakshi', "Accha dhaniya chhodiye, naukri ki suniye na, appraisal teen percent aur upar se boss ke Sunday wale WhatsApp, promotion toh pakka kijiye!", "अच्छा धनिया छोड़िए, नौकरी की सुनिए ना, अप्रेज़ल तीन परसेंट और ऊपर से बॉस के संडे वाले व्हाट्सऐप, प्रमोशन तो पक्का कीजिए!", GAP),
 ('V13', 'Vishnu ji', "Naye mauke aa sakte hain, bas April-May aur September-October mein gusse mein resign mat karna.", "नए मौके आ सकते हैं, बस अप्रैल मई और सितंबर अक्टूबर में गुस्से में रिज़ाइन मत करना।", GAP),
 ('K14', 'Sakshi', "Toh boss ko block kar dein? Sirf Sunday ko?", "तो बॉस को ब्लॉक कर दें? सिर्फ़ संडे को?", GAP),
 ('V15', 'Vishnu ji', "Block nahi, mute.", "ब्लॉक नहीं, म्यूट।", LAUGH),
 ('K16', 'Sakshi', "Aur har function mein maasi ka sawaal, shaadi kab, aur shaadi ho gayi toh good news kab.", "और हर फ़ंक्शन में मासी का सवाल, शादी कब, और शादी हो गई तो गुड न्यूज़ कब।", 0.1),
 ('MEME', 'hey_bhagwan', 'hey-bhagwan-kya-karun-main.mp3', 0.0, 1.53, 0.12),
 ('V18', 'Vishnu ji', "Haan, sun raha hun.", "हाँ, सुन रहा हूँ।", LAUGH),
 ('V19', 'Vishnu ji', "Par June ke aakhir se November tak Guru saath hain, rishton mein mithas aa sakti hai.", "पर जून के आख़िर से नवंबर तक गुरु साथ हैं, रिश्तों में मिठास आ सकती है।", GAP),
 ('K20', 'Sakshi', "Aur last demand Prabhu, Sade Sati cancel kar dijiye na.", "और लास्ट डिमांड प्रभु, साढ़े साती कैंसल कर दीजिए ना।", GAP),
 ('V21', 'Vishnu ji', "Wo Shani dev ka vibhag hai, wahan sifaarish nahi, sirf mehnat ka hisaab chalta hai.", "वो शनि देव का विभाग है, वहाँ सिफ़ारिश नहीं, सिर्फ़ मेहनत का हिसाब चलता है।", 0.2),
 ('V22', 'Vishnu ji', "Ghabrana mat, Guru bhi saath hain.", "घबराना मत, गुरु भी साथ हैं।", 1.3),
 ('K23', 'Sakshi', "Aries dost ko ye bhejo, mahine-wise guide bio ke link mein hai. Agli file, Taurus!", "एरीज़ दोस्त को ये भेजो, महीने वार गाइड बायो के लिंक में है। अगली फ़ाइल, टॉरस!", 0.9),
]
MEME_TEXT = {'arey_baap_re': 'Arey baap re!', 'abhi_maza': 'Abhi maza aayega na bhidu!', 'lekin_ek_second': 'Lekin ek second!', 'hey_bhagwan': 'Hey Bhagwan, kya karun main!'}

def ff(inp, af, out):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', inp, '-af', af, '-ar', str(SR), '-ac', '1', out], check=True)

def trim(x, th=0.012):
    i = np.where(np.abs(x) > th)[0]
    return x[max(0, i[0] - 200):i[-1] + 800] if len(i) else x

def squeeze_pauses(x, max_gap=0.16):
    w = int(0.01 * SR); n = len(x) // w; e = np.sqrt((x[:n * w].reshape(n, w) ** 2).mean(1)); quiet = e < 0.01
    out, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            keep = min(j - i, int(max_gap / 0.01)); out.append(x[i * w:(i + keep) * w]); i = j
        else: out.append(x[i * w:(i + 1) * w]); i += 1
    return np.concatenate(out + [x[n * w:]])

def chunks(text, a, b, n=4):
    words = text.split(); groups = [' '.join(words[i:i + n]) for i in range(0, len(words), n)]
    L = sum(len(g) for g in groups); out, t = [], a
    for g in groups:
        d = (b - a) * len(g) / L; out.append({'text': g, 'from': round(t, 2), 'to': round(t + d, 2)}); t += d
    return out

def main(model, voices):
    k = Kokoro(model, voices); os.makedirs(os.path.join(HERE, 'voices', 'lines'), exist_ok=True)
    tmp = os.path.join(HERE, 'voices', 'tmp'); os.makedirs(tmp, exist_ok=True)
    track, t, rows, beats = [], 0.0, [], []
    for item in SCRIPT:
        if item[0] == 'MEME':
            _, name, f, a, b, gap = item; p = os.path.join(tmp, name + '.wav')
            ff(os.path.join(MEMES, f), f'atrim={a}:{b},afade=t=in:d=0.01,afade=t=out:st={b - a - 0.05}:d=0.05,loudnorm=I=-18:TP=-2', p)
            x, _ = sf.read(p); x = x.astype(np.float32); d = len(x) / SR
            rows.append([name, 'Sakshi', round(t, 3), round(t + d, 3), 'meme:' + f, MEME_TEXT[name]])
            beats.append({'id': name, 'type': 'meme', 'start': round(t, 3), 'end': round(t + d, 3), 'who': 'Sakshi', 'line': MEME_TEXT[name],
                          'caption_chunks': [{'text': MEME_TEXT[name], 'from': round(t, 2), 'to': round(t + d, 2)}], 'meme_file': f, 'meme_in': a, 'meme_out': b})
        else:
            lid, who, roman, deva, gap = item; v = VOICE[who]
            a, sr = k.create(deva, voice=v['voice'], speed=v['speed'], lang='hi'); raw = os.path.join(tmp, lid + '_raw.wav'); sf.write(raw, a, sr)
            p = os.path.join(HERE, 'voices', 'lines', lid + '.wav'); rate = 24000 * 2 ** (v['semis'] / 12)
            ff(raw, f'asetrate={rate:.1f},aresample={SR},atempo={v["tempo"] / 2 ** (v["semis"] / 12):.4f},highpass=f=70,loudnorm=I=-18:TP=-2', p)
            x, _ = sf.read(p); x = squeeze_pauses(trim(x.astype(np.float32))); sf.write(p, x, SR); d = len(x) / SR
            rows.append([lid, who, round(t, 3), round(t + d, 3), f'voices/lines/{lid}.wav', roman])
            beats.append({'id': lid, 'type': 'line', 'start': round(t, 3), 'end': round(t + d, 3), 'who': who, 'line': roman, 'caption_chunks': chunks(roman, t, t + d)})
        track += [x, np.zeros(int(gap * SR), np.float32)]; t += d + gap
    y = np.concatenate(track); sf.write(os.path.join(HERE, 'voices', 'voice_track_timed.wav'), y, SR, subtype='PCM_16')
    with open(os.path.join(HERE, 'voices', 'cue_sheet.csv'), 'w', newline='') as fh:
        w = csv.writer(fh); w.writerow(['id', 'who', 'start_s', 'end_s', 'file', 'line']); w.writerows(rows)
    S = {'meta': {'title': 'Rashi ki file: Aries 2026 ka dard, 2027 ka mol-bhaav', 'channel': 'Tarot Talk By Sakshi (Instagram Reels)',
                  'version': 'v11 script, free Kokoro voices (no credits)', 'runtime_s': round(len(y) / SR, 2), 'format': '1080x1920, 24 fps, 9:16'},
         'beats': beats}
    json.dump(S, open(os.path.join(HERE, 'script.json'), 'w'), ensure_ascii=False, indent=1)
    by = {b['id']: b for b in beats}
    cues = [[round(by['K03']['end'] - 0.15, 2), 'meme:faaah.mp3', -6, 0, 1.9], [round(by['K11']['end'] + 0.02, 2), 'meme:vine-boom.mp3', -8]]
    json.dump({'note': '[script time s, sound, gain dB, (in s), (out s)]: our sfx name, meme:<file>, or voice:<path>', 'cues': cues},
              open(os.path.join(HERE, 'sfx_cues.json'), 'w'), indent=0)
    words = sum(len(re.findall(r"[A-Za-z']+|\d+", b['line'])) for b in beats if b['type'] == 'line')
    sp = sum(b['end'] - b['start'] for b in beats if b['type'] == 'line')
    print(f'voice track {len(y) / SR:.2f} s, {len(beats)} beats, speech pace {words / sp:.2f} words/s')

if __name__ == '__main__':
    main(*sys.argv[1:3])
