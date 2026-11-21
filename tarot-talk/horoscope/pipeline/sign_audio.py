"""One-sign horoscope audio. usage: python3 sign_audio.py <folder with reading.json> <piper model .onnx>
Reuses the voice and sound functions from daily_audio.py (same folder as this file)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(f"{HERE}/daily_audio.py").read().split("# ---- shots")[0])   # tts, word_times, synth helpers, R, DIR, SR, BEAT

t, shots, vos = 0.0, [], []
for i, s in enumerate(R["shots"]):
    x = tts(s["vo"], f"{DIR}/vo_{i:02d}.wav"); dur = len(x) / SR
    length = max(3.0, math.ceil((dur + 0.4) / BEAT) * BEAT)
    ws, wt = word_times(s["vo"], t + 0.1, dur)
    cues = [dict(k=c[0], a=c[1], b=c[2], at=round(wt[min(c[3], len(wt) - 1)], 3)) for c in s["cues"]]
    shots.append(dict(id=s["id"], scene=s.get("scene", s["id"]), area=s.get("area"), start=round(t, 3), end=round(t + length, 3), cues=cues)); vos.append((t + 0.1, x)); t += length
total = t + 0.5
n = int(total * SR); vo, mus, sfx = np.zeros(n), np.zeros(n), np.zeros(n)
for st, x in vos: add(vo, x, st)
vo /= max(np.abs(vo).max(), 1e-6) / 0.9
for b in range(int(total / BEAT)):
    bt = b * BEAT; prog = PROG[(b // 16) % 3]; root, notes = CH[prog[(b // 4) % 4]]
    hook = bt < shots[0]["end"]
    add(mus, kick(), bt, 0.9)
    if not hook: add(mus, hat(), bt + BEAT / 2, 0.35)
    if b % 2 == 1 and not hook: add(mus, clap(), bt, 0.3)
    for k in range(2):
        add(mus, lp(pluck(root, 0.22), 600), bt + k * BEAT / 2, 0.5)
        add(mus, pluck(notes[(b * 2 + k) % 3] * (1 if hook else 2), 0.3), bt + k * BEAT / 2, 0.24)
for s in shots:
    if s["start"] > 0: add(sfx, whoosh(), s["start"] - 0.2, 0.5)
    m = 0
    for j, c in enumerate(s["cues"]):
        if c["k"] in ("L", "T"): add(sfx, impact(), c["at"], 0.8 if j == 0 or s["id"] == "hook" else 0.55)
        elif c["k"] == "S" and c["b"] == "good":
            add(sfx, impact(), c["at"], 0.5)
            for q, f in enumerate([1046.5, 1318.5, 1568]): add(sfx, bell(f, 0.8), c["at"] + q * 0.07, 0.25)
        elif c["k"] == "S" and c["b"] == "care": add(sfx, impact(), c["at"], 0.6); add(sfx, bell(880, 0.6), c["at"] + 0.05, 0.22)
        elif c["k"] == "S": add(sfx, impact(), c["at"], 0.75); add(sfx, buzz(), c["at"] + 0.05, 0.4)
        elif c["k"] == "M": add(sfx, pop(), c["at"], 0.5); add(sfx, bell(660 * 2 ** (m / 6), 0.5), c["at"] + 0.3, 0.2 + 0.03 * c["b"]); m += 1
        elif c["k"] == "K": add(sfx, pop(), c["at"], 0.5); add(sfx, bell(1568, 0.5), c["at"] + 0.05, 0.18)
        elif c["a"] == "DO":
            for q, f in enumerate([1046.5, 1318.5, 1568]): add(sfx, bell(f, 0.8), c["at"] + q * 0.07, 0.25)
        else: add(sfx, impact(), c["at"], 0.7); add(sfx, buzz(), c["at"] + 0.05, 0.4)
add(sfx, riser(0.8), shots[0]["end"] - 0.8, 0.3)
for s in shots:
    if s["scene"] == "remedy":
        for q, f in enumerate([784, 988, 1175, 1568]): add(sfx, bell(f, 1.2), s["start"] + 0.15 + q * 0.12, 0.2)
k = int(0.25 * SR); act = np.convolve((np.abs(vo) > 0.03).astype(float), np.ones(k) / k, "same")
mus = lp(mus, 9000); mus /= np.abs(mus).max(); sfx /= max(np.abs(sfx).max(), 1e-6)
def save(name, mix):
    fade = int(0.4 * SR); mix = mix.copy(); mix[-fade:] *= np.linspace(1, 0, fade); mix = np.tanh(mix * 1.1) * 0.95
    w = wave.open(f"{DIR}/{name}", "w"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes()); w.close()
save("audio.wav", vo + mus * 0.34 * (1 - 0.5 * np.clip(act * 3, 0, 1)) + sfx * 0.4)
save("audio_nomusic.wav", vo + sfx * 0.4)      # for adding an Instagram library track when posting
json.dump(dict(total=round(total, 3), sign=R["sign"], element=R["element"], language=R.get("language", "english"), rashi=R.get("rashi", R["sign"]), date_label=R["date_label"], shots=shots), open(f"{DIR}/timeline.json", "w"), indent=1)
print("total", round(total, 2)); [print(s["id"], s["start"], s["end"], [round(c["at"] - s["start"], 2) for c in s["cues"]]) for s in shots]
