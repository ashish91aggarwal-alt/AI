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
VOICE = {'Vishnu ji': dict(voice='hm_psi', speed=1.0, tempo=1.14, semis=-0.6),
         'Sakshi': dict(voice='hf_beta', speed=1.0, tempo=1.18, semis=0.0)}
GAP, LAUGH = 0.08, 0.35

# (id, who, roman line for captions, devanagari text for the voice, gap_after)  -- or ('MEME', name, file, in, out, gap_after)
SCRIPT = [
 ('K01', 'Sakshi', "Prabhu, main Aries walon ki wakeel hun aur unka 2026 ka poora hisaab lekar aayi hun.", "प्रभु, मैं एरीज़ वालों की वकील हूँ और उनका दो हज़ार छब्बीस का पूरा हिसाब लेकर आई हूँ।", GAP),
 ('V02', 'Vishnu ji', "Itni lambi list hai, ye shikayat hai ya kisi shaadi ka menu hai?", "इतनी लंबी लिस्ट है, ये शिकायत है या किसी शादी का मेन्यू है?", LAUGH),
 ('K03', 'Sakshi', "Poore saal kharcha zyada hua, raat ko neend nahi aayi, aur jo share kharida wo turant gir gaya.", "पूरे साल खर्चा ज़्यादा हुआ, रात को नींद नहीं आई, और जो शेयर खरीदा वो तुरंत गिर गया।", 1.55),
 ('V04', 'Vishnu ji', "Shani dev abhi tumhare kharchon wale ghar mein baithe hain, isliye 2026 mein paisa aur neend dono hil gaye.", "शनि देव अभी तुम्हारे खर्चों वाले घर में बैठे हैं, इसलिए दो हज़ार छब्बीस में पैसा और नींद दोनों हिल गए।", 0.12),
 ('MEME', 'arey_baap_re', 'arey-baap-re.mp3', 0.0, 1.21, 0.06),
 ('K05', 'Sakshi', "Toh kya 2027 bhi aisa hi jayega?", "तो क्या दो हज़ार सत्ताईस भी ऐसा ही जाएगा?", GAP),
 ('V06', 'Vishnu ji', "Ghabrao mat, isiliye toh mol-bhaav ho raha hai, bolo kya chahiye?", "घबराओ मत, इसीलिए तो मोल भाव हो रहा है, बोलो क्या चाहिए?", 0.12),
 ('MEME', 'abhi_maza', 'abhi-maza-aayega-na-bhidu.mp3', 1.95, 4.36, 0.08),
 ('K07', 'Sakshi', "Pehli demand ye hai ki January se hi naya kaam shuru ho jaye.", "पहली डिमांड ये है कि जनवरी से ही नया काम शुरू हो जाए।", GAP),
 ('V08', 'Vishnu ji', "Aries ke swami Mangal khud dus January se ek April tak vakri rahenge, isliye bade faisle April tak rok ke rakho.", "एरीज़ के स्वामी मंगल ख़ुद दस जनवरी से एक अप्रैल तक वक्री रहेंगे, इसलिए बड़े फ़ैसले अप्रैल तक रोक के रखो।", 0.12),
 ('MEME', 'lekin_ek_second', 'lekin-ek-second.mp3', 0.0, 1.23, 0.06),
 ('K09', 'Sakshi', "Aries wale teen mahine rukenge, aapko sach mein aisa lagta hai?", "एरीज़ वाले तीन महीने रुकेंगे, आपको सच में ऐसा लगता है?", GAP),
 ('V10', 'Vishnu ji', "Yahi toh is saal ki asli pariksha hai, jo ruk gaya wahi jeetega.", "यही तो इस साल की असली परीक्षा है, जो रुक गया वही जीतेगा।", LAUGH),
 ('K11', 'Sakshi', "Theek hai, toh 2027 mein Aries walon ko ghar mein poora sukoon dila dijiye.", "ठीक है, तो दो हज़ार सत्ताईस में एरीज़ वालों को घर में पूरा सुकून दिला दीजिए।", GAP),
 ('V12', 'Vishnu ji', "June tak Guru ghar ke bhaav mein hain, par Ketu bhi wahin baithe hain, toh family ke liye waqt khud nikaalna padega.", "जून तक गुरु घर के भाव में हैं, पर केतु भी वहीं बैठे हैं, तो फ़ैमिली के लिए वक़्त ख़ुद निकालना पड़ेगा।", GAP),
 ('K13', 'Sakshi', "Aur har function mein maasi poochti hain ki shaadi kab hogi, aur shaadi ho gayi toh good news kab aayegi.", "और हर फ़ंक्शन में मासी पूछती हैं कि शादी कब होगी, और शादी हो गई तो गुड न्यूज़ कब आएगी।", 0.1),
 ('MEME', 'hey_bhagwan', 'hey-bhagwan-kya-karun-main.mp3', 0.0, 1.53, 0.12),
 ('V14', 'Vishnu ji', "Haan, sun raha hun.", "हाँ, सुन रहा हूँ।", LAUGH),
 ('V15', 'Vishnu ji', "2026 mein Ketu ne pyaar aur bachchon ke maamle mein jo ulajhan di thi, June ke baad wahan Guru aa rahe hain, toh rishte ki baat aage badh sakti hai.", "दो हज़ार छब्बीस में केतु ने प्यार और बच्चों के मामले में जो उलझन दी थी, जून के बाद वहाँ गुरु आ रहे हैं, तो रिश्ते की बात आगे बढ़ सकती है।", GAP),
 ('K16', 'Sakshi', "Aur last demand Prabhu, Sade Sati hi cancel kar dijiye na.", "और लास्ट डिमांड प्रभु, साढ़े साती ही कैंसल कर दीजिए ना।", GAP),
 ('V17', 'Vishnu ji', "Wo Shani dev ka vibhag hai, wahan sifaarish nahi chalti, par 2027 mein June se October tak bas unki pehli dastak hai, aur Shani dev mehnat ka phal dete hain, darr ka nahi.", "वो शनि देव का विभाग है, वहाँ सिफ़ारिश नहीं चलती, पर दो हज़ार सत्ताईस में जून से अक्टूबर तक बस उनकी पहली दस्तक है, और शनि देव मेहनत का फल देते हैं, डर का नहीं।", 0.15),
 ('V18', 'Vishnu ji', "Tab tak neend aur sehat ka dhyaan rakho, aur ghabrao mat, Guru saath hain.", "तब तक नींद और सेहत का ध्यान रखो, और घबराओ मत, गुरु साथ हैं।", 0.6),
 ('K19', 'Sakshi', "Matlab ek haan, ek aadha haan, ek mein intezaar aur ek pehli dastak, Aries ke liye toh ye bhi record hai!", "मतलब एक हाँ, एक आधा हाँ, एक में इंतज़ार और एक पहली दस्तक, एरीज़ के लिए तो ये भी रिकॉर्ड है!", 0.35),
 ('K20', 'Sakshi', "Apne Aries dost ko ye bhejo, poori 2027 guide bio ke link mein hai, aur agli file Taurus ki hogi.", "अपने एरीज़ दोस्त को ये भेजो, पूरी दो हज़ार सत्ताईस गाइड बायो के लिंक में है, और अगली फ़ाइल टॉरस की होगी।", 0.9),
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
                  'version': 'v12.1 script, free Kokoro voices (no credits)', 'runtime_s': round(len(y) / SR, 2), 'format': '1080x1920, 24 fps, 9:16'},
         'beats': beats}
    json.dump(S, open(os.path.join(HERE, 'script.json'), 'w'), ensure_ascii=False, indent=1)
    by = {b['id']: b for b in beats}
    cues = [[round(by['K03']['end'] - 0.15, 2), 'meme:faaah.mp3', -6, 0, 1.9], [round(by['V10']['end'] + 0.02, 2), 'meme:vine-boom.mp3', -10]]
    json.dump({'note': '[script time s, sound, gain dB, (in s), (out s)]: our sfx name, meme:<file>, or voice:<path>', 'cues': cues},
              open(os.path.join(HERE, 'sfx_cues.json'), 'w'), indent=0)
    words = sum(len(re.findall(r"[A-Za-z']+|\d+", b['line'])) for b in beats if b['type'] == 'line')
    sp = sum(b['end'] - b['start'] for b in beats if b['type'] == 'line')
    print(f'voice track {len(y) / SR:.2f} s, {len(beats)} beats, speech pace {words / sp:.2f} words/s')

if __name__ == '__main__':
    main(*sys.argv[1:3])
