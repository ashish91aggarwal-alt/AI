"""Daily horoscope audio: reads reading.json, makes the voice (Piper), a beat-timed timeline.json,
synthesized music and sound effects, and mixes audio.wav. No GPU, no paid service.
usage: python3 daily_audio.py <folder with reading.json> <piper model .onnx>"""
import os, hashlib, json, math, subprocess, sys, wave
import numpy as np
from scipy.signal import butter, lfilter

DIR, MODEL = sys.argv[1], sys.argv[2]
SR, BEAT = 44100, 0.5
R = json.load(open(f"{DIR}/reading.json"))
rng = np.random.default_rng(3)


ALIGN = {}   # text -> list of word start times (s, relative to trimmed clip), from ElevenLabs timestamps

def eleven(text, path):
    """MODEL = 'eleven:<voice_id>'; key in env XI_API_KEY. Cached: a clip already made is never paid for twice."""
    import base64, os, urllib.request
    import hashlib   # shared cache: the same sentence in the same voice is never paid for twice (CTA, meters, across signs and days)
    cdir = os.environ.get("XI_CACHE", os.path.expanduser("~/.cache/horoscope-voice")); os.makedirs(cdir, exist_ok=True)
    cache = f"{cdir}/{hashlib.sha1((MODEL + '|' + text).encode()).hexdigest()[:16]}.json"
    if not os.path.exists(cache):
        body = json.dumps(dict(text=text, model_id=os.environ.get("XI_MODEL", "eleven_multilingual_v2"),
                               voice_settings=dict(stability=0.45, similarity_boost=0.8, style=0.35, use_speaker_boost=True))).encode()
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{MODEL.split(':', 1)[1]}/with-timestamps?output_format=mp3_44100_128",
                                     data=body, headers={"xi-api-key": os.environ["XI_API_KEY"], "Content-Type": "application/json"})
        open(cache, "w").write(urllib.request.urlopen(req, timeout=120).read().decode())
    d = json.load(open(cache)); mp3 = path.replace(".wav", ".mp3")
    open(mp3, "wb").write(base64.b64decode(d["audio_base64"]))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", str(SR), path], check=True)
    a = d.get("alignment") or {}; ch, st = a.get("characters", []), a.get("character_start_times_seconds", [])
    starts, prev = [], " "
    for c, s in zip(ch, st):
        if not c.isspace() and prev.isspace(): starts.append(s)
        prev = c
    return starts

def tts(text, path):
    starts = None
    if MODEL.startswith("eleven:"): starts = eleven(text, path)
    elif MODEL.startswith("chatterbox:"):   # free voice: lines are pre-made by cb_tts.py into the shared cache
        c = os.path.expanduser(f"~/.cache/horoscope-voice/{hashlib.sha1((MODEL + '|' + text).encode()).hexdigest()[:16]}.wav")
        if not os.path.exists(c): raise SystemExit("voice line not made yet (run cb_tts.py): " + text[:40])
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", c, "-ac", "1", "-ar", "24000", "-sample_fmt", "s16", path], check=True)
    else:
        subprocess.run(["python3", "-m", "piper", "--model", MODEL, "--output_file", path, "--length-scale", "0.9"],
                       input=text.encode(), check=True, capture_output=True)
    w = wave.open(path); sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if sr != SR: x = np.interp(np.arange(0, len(x), sr / SR), np.arange(len(x)), x)
    nz = np.where(np.abs(x) > 0.02)[0]; a = max(nz[0] - 400, 0)
    if starts and len(starts) == len(text.split()): ALIGN[text] = [max(s - a / SR, 0) for s in starts]
    return x[a: nz[-1] + 2000]

def word_times(text, t0, dur):
    ws = text.split()
    if text in ALIGN: return ws, [t0 + s for s in ALIGN[text]]
    tot = sum(len(w) + 1 for w in ws); out, acc = [], 0
    for w in ws: out.append(t0 + dur * 0.95 * acc / tot); acc += len(w) + 1
    return ws, out

env = lambda n, tau: np.exp(-np.arange(n) / (tau * SR))
tone = lambda f, d: np.sin(2 * np.pi * f * np.arange(int(d * SR)) / SR)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], btype="band"); return lfilter(b, a, x)
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def kick():
    n = int(0.28 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (45 * t + 65 * 0.04 * (1 - np.exp(-t / 0.04)))) * env(n, 0.09)
def hat(): n = int(0.05 * SR); return np.diff(rng.standard_normal(n + 1)) * env(n, 0.012) * 0.5
def clap(): n = int(0.12 * SR); return bp(rng.standard_normal(n), 900, 4000) * env(n, 0.03)
def whoosh(d=0.38): n = int(d * SR); return bp(rng.standard_normal(n), 500, 5000) * np.hanning(n) ** 1.5
def impact():
    n = int(0.5 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (38 * t + 60 * 0.05 * (1 - np.exp(-t / 0.05)))) * env(n, 0.16) + 0.4 * lp(rng.standard_normal(n), 900) * env(n, 0.03)
def bell(f, d=0.7): n = int(d * SR); return (tone(f, d) + 0.4 * tone(f * 2.76, d) + 0.2 * tone(f * 5.4, d)) * env(n, 0.18)
def pop(): n = int(0.07 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (500 * t + 2500 * t * t)) * env(n, 0.025)
def buzz(): n = int(0.32 * SR); return lp(np.sign(tone(98, 0.32)), 1400) * np.hanning(n) ** 0.4
def riser(d):
    n = int(d * SR); t = np.arange(n) / n
    return bp(rng.standard_normal(n), 800, 7000) * t ** 2
def pluck(f, d=0.3): n = int(d * SR); x = 2 * np.abs(2 * ((f * np.arange(n) / SR) % 1) - 1) - 1; return lp(x, 3500) * env(n, 0.08)
def add(buf, x, t, g=1.0):
    i = int(max(t, 0) * SR)
    if i < len(buf): x = x[: len(buf) - i]; buf[i:i + len(x)] += x * g

CH = {"C": (130.81, [261.63, 329.63, 392]), "G": (98, [196, 246.94, 293.66]), "Am": (110, [220, 261.63, 329.63]),
      "F": (87.31, [174.61, 220, 261.63]), "Dm": (73.42, [146.83, 174.61, 220]), "E": (82.41, [164.81, 207.65, 246.94])}
PROG = [["C", "G", "Am", "F"], ["Am", "F", "C", "G"], ["F", "G", "Am", "C"]]

# ---- shots
spec = [dict(id="hook", kind="hook", vo=R["hook"]["vo"], lines=R["hook"]["lines"])]
for s in R["signs"]:
    sent = [x.strip() for x in s["vo"].replace("?", ".").split(".") if x.strip()]
    i1 = len(sent[0].split()); i2 = i1 + sum(len(x.split()) for x in sent[1:-1])
    spec.append(dict(id=s["sign"].lower(), kind="sign", vo=s["vo"], lines=[[s["sign"].upper(), 0], [s["l1"], i1], [s["l2"], i2]], data=s))
spec.append(dict(id="cta", kind="cta", vo=R["cta"]["vo"], lines=R["cta"]["lines"]))

t, shots, vos = 0.0, [], []
for i, s in enumerate(spec):
    x = tts(s["vo"], f"{DIR}/vo_{i:02d}.wav"); dur = len(x) / SR
    lead = 0.1
    length = max(3.0, math.ceil((dur + lead + 0.3) / BEAT) * BEAT)
    ws, wt = word_times(s["vo"], t + lead, dur)
    sh = dict(id=s["id"], kind=s["kind"], start=round(t, 3), end=round(t + length, 3),
              lines=[dict(text=txt, at=round(wt[min(w, len(wt) - 1)], 3)) for txt, w in s["lines"]])
    if "data" in s: sh.update({k: s["data"][k] for k in ("sign", "element", "tag", "icon")})
    shots.append(sh); vos.append((t + lead, x)); t += length
total = t + 0.5
n = int(total * SR); vo, mus, sfx = np.zeros(n), np.zeros(n), np.zeros(n)
for st, x in vos: add(vo, x, st)
vo /= max(np.abs(vo).max(), 1e-6) / 0.9

def shot_at(tt): return next((s for s in shots if s["start"] <= tt < s["end"]), shots[-1])
# ---- music: 120 bpm, changes with the card (good news = bright lift, stay quiet = drums drop)
for b in range(int(total / BEAT)):
    bt = b * BEAT; s = shot_at(bt); tag = s.get("tag", "")
    prog = PROG[(b // 16) % 3]; root, notes = CH[prog[(b // 4) % 4]]
    if tag == "STAY QUIET": root, notes = CH["Dm" if (b // 2) % 2 == 0 else "E"]
    quiet, good = tag == "STAY QUIET", tag == "GOOD NEWS"
    if not quiet or b % 4 == 0: add(mus, kick(), bt, 0.9)
    if not quiet: add(mus, hat(), bt + BEAT / 2, 0.35)
    if b % 2 == 1 and not quiet and s["kind"] != "hook": add(mus, clap(), bt, 0.3)
    for k in range(2):
        add(mus, lp(pluck(root, 0.22), 600), bt + k * BEAT / 2, 0.5)
        if not quiet: add(mus, pluck(notes[(b * 2 + k) % 3] * (2 if good else 1), 0.3), bt + k * BEAT / 2, 0.3 if good else 0.22)
    if good and b % 2 == 0: add(mus, bell(notes[2] * 4, 0.9), bt, 0.08)
# ---- sound effects
for s in shots:
    tag = s.get("tag", "")
    if s["start"] > 0: add(sfx, whoosh(), s["start"] - 0.2, 0.5)
    add(sfx, impact(), s["lines"][0]["at"], 0.8)
    for j, l in enumerate(s["lines"][1:]): add(sfx, impact() if (s["kind"] != "sign" or j == 0) else pop(), l["at"], 0.6 if j == 0 else 0.45)
    if tag == "GOOD NEWS":
        for k, f in enumerate([1046.5, 1318.5, 1568, 2093]): add(sfx, bell(f, 0.9), s["start"] + 0.3 + k * 0.08, 0.25)
    if tag == "STAY QUIET":
        add(sfx, riser(0.9), s["start"] - 0.9, 0.35); add(sfx, buzz(), s["lines"][1]["at"] + 0.05, 0.45)
# ---- mix (music ducks under the voice)
k = int(0.25 * SR)
act = np.convolve((np.abs(vo) > 0.03).astype(float), np.ones(k) / k, "same")
mus = lp(mus, 9000); mus /= np.abs(mus).max(); sfx /= max(np.abs(sfx).max(), 1e-6)
mix = vo + mus * 0.34 * (1 - 0.5 * np.clip(act * 3, 0, 1)) + sfx * 0.4
fade = int(0.4 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh(mix * 1.1) * 0.95
w = wave.open(f"{DIR}/audio.wav", "w"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close()
json.dump(dict(total=round(total, 3), date_label=R["date_label"], shots=shots), open(f"{DIR}/timeline.json", "w"), indent=1)
print("total", round(total, 2), "s,", len(shots), "shots; longest shot", max(s["end"] - s["start"] for s in shots))
