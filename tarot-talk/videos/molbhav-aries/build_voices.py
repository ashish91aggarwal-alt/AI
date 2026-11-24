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
SCRIPT = [   # v13.2 (owner edits 24 Nov 18:17 IST)
 ('K01', 'Sakshi', "Prabhu, main Aries walon ki wakeel hun, aur poore 2026 ka hisaab laayi hun.", "प्रभु, मैं एरीज़ वालों की वकील हूँ, और पूरे दो हज़ार छब्बीस का हिसाब लाई हूँ।", GAP),
 ('V02', 'Vishnu ji', "Itni moti file? Wakeel saahiba, ye shikayat hai ya kisi shaadi ka menu hai?", "इतनी मोटी फ़ाइल? वकील साहिबा, ये शिकायत है या किसी शादी का मेन्यू है?", LAUGH),
 ('K03', 'Sakshi', "Poore saal kharcha zyada hua, neend nahi aayi, aur jo share kharida wo turant gir gaya.", "पूरे साल खर्चा ज़्यादा हुआ, नींद नहीं आई, और जो शेयर खरीदा वो तुरंत गिर गया।", 1.55),
 ('V04', 'Vishnu ji', "Aries wale share bhi Mangal ki speed se kharidte hain. Khair, 2026 mein Shani dev baarahve, kharchon wale ghar mein hain, isliye paisa aur neend dono hile.", "एरीज़ वाले शेयर भी मंगल की स्पीड से खरीदते हैं। ख़ैर, दो हज़ार छब्बीस में शनि देव बारहवें, खर्चों वाले घर में हैं, इसलिए पैसा और नींद दोनों हिले।", 0.12),
 ('MEME', 'arey_baap_re', 'arey-baap-re.mp3', 0.0, 1.21, 0.06),
 ('K05', 'Sakshi', "Ye toh gadbad hai re baba, kahin 2027 bhi aisa hi na jaye!", "ये तो गड़बड़ है रे बाबा, कहीं दो हज़ार सत्ताईस भी ऐसा ही ना जाए!", GAP),
 ('V06', 'Vishnu ji', "Tension lene ka nahi, wakeel saahiba. Isiliye toh mol-bhaav ho raha hai, bolo kya chahiye?", "टेंशन लेने का नहीं, वकील साहिबा। इसीलिए तो मोल भाव हो रहा है, बोलो क्या चाहिए?", 0.12),
 ('MEME', 'abhi_maza', 'abhi-maza-aayega-na-bhidu.mp3', 1.95, 4.36, 0.08),
 ('K07', 'Sakshi', "Pehli demand ye hai ki January se hi naya kaam shuru ho jaye.", "पहली डिमांड ये है कि जनवरी से ही नया काम शुरू हो जाए।", GAP),
 ('V08', 'Vishnu ji', "Aries ke swami Mangal das January se ek April tak vakri rahenge, toh bade faisle April tak roko.", "एरीज़ के स्वामी मंगल दस जनवरी से एक अप्रैल तक वक्री रहेंगे, तो बड़े फ़ैसले अप्रैल तक रोको।", 0.12),
 ('MEME', 'lekin_ek_second', 'lekin-ek-second.mp3', 0.0, 1.23, 0.06),
 ('K09', 'Sakshi', "Matlab mere client ko January, February, March, bas tareekh pe tareekh milti rahegi?", "मतलब मेरे क्लाइंट को जनवरी, फ़रवरी, मार्च, बस तारीख़ पे तारीख़ मिलती रहेगी?", GAP),
 ('V10', 'Vishnu ji', "Tareekh nahi, taiyaari ka time milega, aur jo ruk gaya wahi jeetega.", "तारीख़ नहीं, तैयारी का टाइम मिलेगा, और जो रुक गया वही जीतेगा।", LAUGH),
 ('K11', 'Sakshi', "Theek hai, toh ghar mein sukoon dila dijiye.", "ठीक है, तो घर में सुकून दिला दीजिए।", GAP),
 ('V12', 'Vishnu ji', "January ke aakhir se June tak Guru chauthe ghar mein hain, par Ketu bhi wahin hain, toh family ko waqt dena padega.", "जनवरी के आख़िर से जून तक गुरु चौथे घर में हैं, पर केतु भी वहीं हैं, तो फ़ैमिली को वक़्त देना पड़ेगा।", GAP),
 ('K13', 'Sakshi', "Aur maasi poochti hain shaadi kab hogi, aur shaadi ho gayi toh good news kab?", "और मासी पूछती हैं शादी कब होगी, और शादी हो गई तो गुड न्यूज़ कब?", 0.1),
 ('MEME', 'hey_bhagwan', 'hey-bhagwan-kya-karun-main.mp3', 0.0, 1.53, 0.12),
 ('V14', 'Vishnu ji', "Maasi ka jawab toh mere paas bhi nahi hai. Par 2026 mein Ketu ne pyaar aur bachchon ke ghar mein jo ulajhan di, June 2027 ke aakhir se wahan Guru aa rahe hain.", "मासी का जवाब तो मेरे पास भी नहीं है। पर दो हज़ार छब्बीस में केतु ने प्यार और बच्चों के घर में जो उलझन दी, जून दो हज़ार सत्ताईस के आख़िर से वहाँ गुरु आ रहे हैं।", GAP),
 ('K15', 'Sakshi', "Aur last demand, Aries walon ko Shani dev se darr nahi lagta, Sade Sati se lagta hai, use cancel kar dijiye.", "और लास्ट डिमांड, एरीज़ वालों को शनि देव से डर नहीं लगता, साढ़े साती से लगता है, उसे कैंसल कर दीजिए।", GAP),
 ('V16', 'Vishnu ji', "Wo Shani dev ka vibhag hai, wahan sifaarish nahi chalti. Sade Sati ka bhaari beech ka daur June 2027 mein pehli dastak dega, aur Shani dev mehnat ka phal dete hain, darr ka nahi.", "वो शनि देव का विभाग है, वहाँ सिफ़ारिश नहीं चलती। साढ़े साती का भारी बीच का दौर जून दो हज़ार सत्ताईस में पहली दस्तक देगा, और शनि देव मेहनत का फल देते हैं, डर का नहीं।", 0.6),
 ('K17', 'Sakshi', "Toh faisla aa gaya: kaam ko April ki tareekh, ghar ko aadha sukoon, rishte ko Guru ka saath, aur Sade Sati ke liye mehnat ka raasta. Wakeel haari nahi, Aries jeet gaye!", "तो फ़ैसला आ गया, काम को अप्रैल की तारीख़, घर को आधा सुकून, रिश्ते को गुरु का साथ, और साढ़े साती के लिए मेहनत का रास्ता। वकील हारी नहीं, एरीज़ जीत गए!", 0.35),
 ('K18', 'Sakshi', "2027 ko manifest karna hai toh link pe click karo, aur ye video us dost ko bhejo jo isse relate karega.", "दो हज़ार सत्ताईस को मैनिफ़ेस्ट करना है तो लिंक पे क्लिक करो, और ये वीडियो उस दोस्त को भेजो जो इससे रिलेट करेगा।", 0.9),
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
            ff(os.path.join(MEMES, f), f'atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={b - a - 0.05}:d=0.05,loudnorm=I=-18:TP=-2', p)
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
                  'version': 'v13.2 script, free Kokoro voices (no credits)', 'runtime_s': round(len(y) / SR, 2), 'format': '1080x1920, 24 fps, 9:16'},
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
