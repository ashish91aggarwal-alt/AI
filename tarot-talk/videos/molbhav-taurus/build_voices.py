"""Free voices for the mol-bhaav Taurus reel (owner, 24 Nov 2026: "Voices: free first").
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
SCRIPT = [   # Taurus script v4 (90 s, ElevenLabs; owner 26 Nov 2026 14:45 IST)
 ('K01', 'Sakshi', 'Prabhu, main Vrishabh walon ki wakeel hun, aur mera client 2026 se naraaz hai.', 'प्रभु, मैं वृषभ वालों की वकील हूँ, और मेरा क्लाइंट दो हज़ार छब्बीस से नाराज़ है।', GAP),
 ('V02', 'Vishnu ji', 'Naraaz hai ya bhookha? Vrishabh ka gussa toh khaane se hi utarta hai.', 'नाराज़ है या भूखा? वृषभ का गुस्सा तो खाने से ही उतरता है।', LAUGH),
 ('K03', 'Sakshi', 'Office mein roz drama hota tha, aur ghar pe neend nahi aati thi.', 'ऑफ़िस में रोज़ ड्रामा होता था, और घर पे नींद नहीं आती थी।', GAP),
 ('V04', 'Vishnu ji', 'Shani dev toh labh ke ghar mein the, par office Rahu ne hilaya aur sukoon Ketu ne liya.', 'शनि देव तो लाभ के घर में थे, पर ऑफ़िस राहु ने हिलाया और सुकून केतु ने लिया।', GAP),
 ('V06', 'Vishnu ji', 'Isiliye toh mol-bhaav ho raha hai. Bolo, 2027 mein kya chahiye?', 'इसीलिए तो मोल भाव हो रहा है। बोलो, दो हज़ार सत्ताईस में क्या चाहिए?', 0.1),
 ('MEME', 'abhi_maza', 'abhi-maza-aayega-na-bhidu.mp3', 1.95, 4.36, 0.08),
 ('K07', 'Sakshi', 'Pehli demand ye hai ki office ka drama band ho.', 'पहली डिमांड ये है कि ऑफ़िस का ड्रामा बंद हो।', GAP),
 ('V08', 'Vishnu ji', 'Paanch December ko Rahu nauve ghar mein jaayenge, toh shor kam hone ki ummeed hai, par galat salah aur shortcut se bachna hoga.', 'पाँच दिसंबर को राहु नौवें घर में जाएँगे, तो शोर कम होने की उम्मीद है, पर ग़लत सलाह और शॉर्टकट से बचना होगा।', GAP),
 ('K09', 'Sakshi', 'Doosri demand, ghar mein sukoon chahiye.', 'दूसरी डिमांड, घर में सुकून चाहिए।', GAP),
 ('V10', 'Vishnu ji', 'Usi din Ketu chauthe ghar se niklenge, aur Guru abhi wahin hain. January ke aakhir se June tak wo teesre ghar mein mehnat badhayenge, phir June mein wapas chauthe ghar mein aayenge.', 'उसी दिन केतु चौथे घर से निकलेंगे, और गुरु अभी वहीं हैं। जनवरी के आख़िर से जून तक वो तीसरे घर में मेहनत बढ़ाएँगे, फिर जून में वापस चौथे घर में आएँगे।', GAP),
 ('K13', 'Sakshi', 'Aur last demand, Sade Sati ko ek saal aage khiska dijiye.', 'और लास्ट डिमांड, साढ़े साती को एक साल आगे खिसका दीजिए।', GAP),
 ('V14', 'Vishnu ji', 'Wo Shani dev ka vibhag hai. Teen June 2027 se Sade Sati ka pehla charan shuru hoga, aur maanyata hai ki baarahve ghar ke Shani kharche, neend aur mann ki shaanti pe asar daal sakte hain.', 'वो शनि देव का विभाग है। तीन जून दो हज़ार सत्ताईस से साढ़े साती का पहला चरण शुरू होगा, और मान्यता है कि बारहवें घर के शनि खर्चे, नींद और मन की शांति पे असर डाल सकते हैं।', 0.1),
 ('MEME', 'hey_bhagwan', 'hey-bhagwan-kya-karun-main.mp3', 0.0, 1.53, 0.08),
 ('V15', 'Vishnu ji', 'Par darna nahi hai. June se pehle mehnat aur bachat ka commitment karo.', 'पर डरना नहीं है। जून से पहले मेहनत और बचत का कमिटमेंट करो।', GAP),
 ('V16', 'Vishnu ji', 'Aur tohfa lo, Shukra dev 2027 mein ek baar bhi vakri nahi honge.', 'और तोहफ़ा लो, शुक्र देव दो हज़ार सत्ताईस में एक बार भी वक्री नहीं होंगे।', 0.5),
 ('K17', 'Sakshi', 'Toh faisla aa gaya: office ko kam shor, Guru ko sabar, Sade Sati ko bachat aur mehnat. Touchwood to Vrishabh!', 'तो फ़ैसला आ गया, ऑफ़िस को कम शोर, गुरु को सब्र, साढ़े साती को बचत और मेहनत। टचवुड टू वृषभ!', 0.3),
 ('K18', 'Sakshi', 'Par ye rashi ka general hisaab hai. Aapki kundli par asar personal 2027 report batayegi, aur healing se June ki taiyari aaj hi shuru karo.', 'पर ये राशि का जनरल हिसाब है। आपकी कुंडली पर असर पर्सनल दो हज़ार सत्ताईस रिपोर्ट बताएगी, और हीलिंग से जून की तैयारी आज ही शुरू करो।', 0.3),
 ('K19', 'Sakshi', '2027 ko manifest karna hai toh link pe click karo, aur ye video usko bhejo jisse apna 2027 jaanna hai.', 'दो हज़ार सत्ताईस को मैनिफ़ेस्ट करना है तो लिंक पे क्लिक करो, और ये वीडियो उसको भेजो जिसे अपना दो हज़ार सत्ताईस जानना है।', 0.6),
]
MEME_TEXT = {'ruko_zara': 'Ruko zara, sabar karo!', 'gadbad': 'Arey Deva, ye gadbad hai baba!', 'arey_baap_re': 'Arey baap re!', 'abhi_maza': 'Abhi maza aayega na bhidu!', 'lekin_ek_second': 'Lekin ek second!', 'hey_bhagwan': 'Hey Bhagwan, kya karun main!'}

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
    S = {'meta': {'title': 'Rashi ki file: Vrishabh 2026 → 2027 mol-bhaav', 'channel': 'Tarot Talk By Sakshi (Instagram Reels)',
                  'version': 'v4 script (90 s), ElevenLabs voices', 'runtime_s': round(len(y) / SR, 2), 'format': '1080x1920, 24 fps, 9:16'},
         'beats': beats}
    json.dump(S, open(os.path.join(HERE, 'script.json'), 'w'), ensure_ascii=False, indent=1)
    by = {b['id']: b for b in beats}
    cues = [[round(by['V12']['end'] + 0.02, 2), 'meme:vine-boom.mp3', -10]]
    json.dump({'note': '[script time s, sound, gain dB, (in s), (out s)]: our sfx name, meme:<file>, or voice:<path>', 'cues': cues},
              open(os.path.join(HERE, 'sfx_cues.json'), 'w'), indent=0)
    words = sum(len(re.findall(r"[A-Za-z']+|\d+", b['line'])) for b in beats if b['type'] == 'line')
    sp = sum(b['end'] - b['start'] for b in beats if b['type'] == 'line')
    print(f'voice track {len(y) / SR:.2f} s, {len(beats)} beats, speech pace {words / sp:.2f} words/s')

if __name__ == '__main__':
    main(*sys.argv[1:3])
