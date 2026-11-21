"""Free voice (Chatterbox multilingual, MIT, CPU). usage: cb/bin/python cb_tts.py <ref.wav> <reading.json>...
Makes every missing voice line into the shared cache (~/.cache/horoscope-voice/<sha1(MODEL|text)[:16]>.wav), one model load."""
import sys, os, json, hashlib, time
ref = os.path.abspath(sys.argv[1]); MODEL = "chatterbox:" + ref
cdir = os.path.expanduser("~/.cache/horoscope-voice"); os.makedirs(cdir, exist_ok=True)
todo = []
for rp in sys.argv[2:]:
    for s in json.load(open(rp))["shots"]:
        p = f"{cdir}/{hashlib.sha1((MODEL + '|' + s['vo']).encode()).hexdigest()[:16]}.wav"
        if not os.path.exists(p) and (s["vo"], p) not in todo: todo.append((s["vo"], p))
print("lines to make:", len(todo), flush=True)
if todo:
    import torch, torchaudio as ta
    torch.set_num_threads(os.cpu_count() or 2); torch.manual_seed(7)
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    m = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    for i, (txt, p) in enumerate(todo):
        t0 = time.time(); w = m.generate(txt, language_id="hi", audio_prompt_path=ref, exaggeration=float(os.environ.get("CB_EXAG", 0.6)), cfg_weight=0.5)
        ta.save(p + ".tmp.wav", w, m.sr); os.replace(p + ".tmp.wav", p); print(i, f"{time.time() - t0:.0f}s", txt[:40], flush=True)
