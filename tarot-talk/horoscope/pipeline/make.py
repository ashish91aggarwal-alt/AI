"""One command for the daily horoscope videos. The agent writes only day.json (short, see samples/day.sample.json);
everything else is scripted: full reading.json, voice (shared cache), timeline, page, frames, two mp4s, cover.jpg, checks, result.json.
usage: XI_API_KEY=... [XI_MAX_CHARS=1500] python3 make.py day.json [outdir] [--only=tula,mesh] [--sheet] [--dry]
Prints one line per sign. Never prints the key."""
import json, os, re, subprocess, sys, time, datetime as dt
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
RASHI = {  # key: (English sign, Hindi name, element)
 "mesh": ("Aries", "मेष", "fire"), "vrishabh": ("Taurus", "वृषभ", "earth"), "mithun": ("Gemini", "मिथुन", "air"), "kark": ("Cancer", "कर्क", "water"),
 "simha": ("Leo", "सिंह", "fire"), "kanya": ("Virgo", "कन्या", "earth"), "tula": ("Libra", "तुला", "air"), "vrishchik": ("Scorpio", "वृश्चिक", "water"),
 "dhanu": ("Sagittarius", "धनु", "fire"), "makar": ("Capricorn", "मकर", "earth"), "kumbh": ("Aquarius", "कुंभ", "air"), "meen": ("Pisces", "मीन", "water")}
NUM = "शून्य एक दो तीन चार पाँच छे सात आठ नौ दस ग्यारह बारह".split()
DAYS = "सोमवार मंगलवार बुधवार गुरुवार शुक्रवार शनिवार रविवार".split(); SDAY = "सोम मंगल बुध गुरु शुक्र शनि रवि".split()
KEYS = list(RASHI)
MON = "जनवरी फरवरी मार्च अप्रैल मई जून जुलाई अगस्त सितंबर अक्टूबर नवंबर दिसंबर".split()
AREAS = [("work", "काम"), ("friends", "दोस्त"), ("family", "परिवार"), ("kids", "बच्चे"), ("decide", "बड़े फैसले"), ("love", "लव"), ("travel", "सफर")]
spoken = lambda s: re.sub(r"\d+", lambda m: NUM[int(m.group())] if int(m.group()) <= 12 else m.group(), s)
norm = lambda w: re.sub(r"[।,?!.\-]", "", w)

def at(vo, text, start, fallback):
    """Word index a line lands on: forced with 'text|3', else first word matched from `start`, else fallback."""
    if "|" in text: t, i = text.rsplit("|", 1); return t, int(i)
    ws = [norm(w) for w in vo.split()]; p = norm(text.split()[0])
    for i in range(start, len(ws)):
        if len(p) >= 2 and (ws[i].startswith(p) or (len(ws[i]) >= 2 and p.startswith(ws[i]))): return text, i
    return text, min(max(fallback, start), len(ws) - 1)

def joinh(xs): return xs[0] if len(xs) == 1 else ", ".join(xs[:-1]) + " और " + xs[-1]

def reading(key, e, date, voice, date_to=None):
    sign, rashi, elem = RASHI[key]; shots = []; wk = bool(date_to)
    hooks = {}
    for h in e.get("hooks", []): hooks.setdefault(h[0], []).append(h[1:])   # [after, tone, voice, line1, (line2)]
    def tone_shots(after):
        for tone, vo, *ls in hooks.get(after, []):
            pic = ls.pop() if len(ls) > 1 and re.fullmatch(r"[a-z_\-]+", ls[-1]) else None   # optional picture from assets/fe
            c = [["L", ls[0], "", 0]]
            if len(ls) > 1: t, i = at(vo, ls[1], 1, len(vo.split()) // 2); c.append(["L", t, "", i])
            shots.append(dict(id=f"tone_{tone}_{len(shots)}", scene=f"tone_{tone}", vo=vo, cues=c, **({"pic": pic} if pic else {})))
    vo, *ls = e["hook"]; n = len(vo.split()); c = [["L", ls[0], "", 0]]
    t, i = at(vo, ls[1], 1, n // 3); c.append(["L", t, "", i]); t, j = at(vo, ls[2], i + 1, 2 * n // 3); c.append(["L", t, "", j])
    shots.append(dict(id="hook", scene="hook", vo=vo, cues=c)); tone_shots("hook")
    sc = e["scores"]; lab = ["लव", "पैसा", "काम", "एनर्जी"]; head = "इस हफ्ते" if wk else "आपका दिन"
    shots.append(dict(id="meters", scene="meters", vo=f"{'इस हफ्ते' if wk else 'आपका दिन'}। लव, पाँच में {NUM[sc[0]]}। पैसा, {NUM[sc[1]]}। काम, {NUM[sc[2]]}। एनर्जी, {NUM[sc[3]]}।",
                      cues=[["L", head, "", 0]] + [["M", lab[k], sc[k], [2, 6, 8, 10][k]] for k in range(4)]))
    tone_shots("meters")
    if wk:   # days of the week, all from the Moon (no tokens): voice, chips and lines are generated
        import sky; d0, d1 = dt.date.fromisoformat(date), dt.date.fromisoformat(date_to)
        mk = sky.day_marks(KEYS.index(key), d0, d1); g = [DAYS[x.weekday()] for x, m, _ in mk if m == "good"]
        bad = [DAYS[x.weekday()] for x, m, _ in mk if m == "stop"] or [DAYS[x.weekday()] for x, m, _ in mk if m == "care"]
        vo = f"इस हफ्ते बढ़िया दिन, {joinh(g)}।" + (f" संभल के रहना, {joinh(bad)}।" if bad else "")
        n1 = len(f"इस हफ्ते बढ़िया दिन,".split())
        c = [["T", "हफ्ते के दिन", "", 0], ["D", [[SDAY[x.weekday()], m] for x, m, _ in mk], "", 0],
             ["L", "बढ़िया: " + " · ".join(x[:-3] if x.endswith("वार") else x for x in g), "", n1]]
        if bad: c.append(["L", "संभलें: " + " · ".join(x[:-3] if x.endswith("वार") else x for x in bad), "", n1 + len(joinh(g).split()) + 3])
        shots.append(dict(id="days", scene="days", vo=vo, cues=c)); tone_shots("days")
    for a, (ak, title) in enumerate(AREAS):
        if ak not in e: continue
        vo, line, stamp, mood = e[ak]; n = len(vo.split())
        t1, i = at(vo, line, 1, max(1, n // 4)); i = min(i, max(1, int(n * 0.6)))
        t2, j = at(vo, stamp, i + 1, max(i + 1, 2 * n // 3))
        shots.append(dict(id=ak, scene=ak, area=a, vo=vo, cues=[["T", title, "", 0], ["L", t1, "", i], ["S", t2, mood, min(j, n - 1)]]))
        tone_shots(ak)
    if "remedy" in e:
        vo, l1, l2 = e["remedy"]; n = len(vo.split()); t1, i = at(vo, l1, 1, 1); t2, j = at(vo, l2, i + 1, n // 2)
        shots.append(dict(id="remedy", scene="remedy", vo=vo, cues=[["T", "उपाय", "", 0], ["L", t1, "", i], ["L", t2, "", j]]))
        tone_shots("remedy")
    col, num, tm = e["lucky"]; bl = "बेस्ट डे" if wk else "बेस्ट टाइम"
    shots.append(dict(id="lucky", scene="lucky", vo=f"लकी कलर, {col}। लकी नंबर, {NUM[int(num)]}। {bl}, {spoken(tm)}।",
                      cues=[["K", "लकी कलर", col, 0], ["K", "लकी नंबर", str(num), 3], ["K", bl, tm, 6]]))
    shots.append(dict(id="cta", scene="cta", vo=f"ये वीडियो किसी {rashi} वाले को भेजो। {'अगले हफ्ते' if wk else 'कल'} के लिए फॉलो करो।",
                      cues=[["L", "ये वीडियो भेजो", "", 0], ["L", f"{rashi} वाले को", "", 3], ["L", "अगले हफ्ते के लिए फॉलो करो" if wk else "कल के लिए फॉलो करो", "", 7]]))
    d = dt.date.fromisoformat(date)
    if wk:
        d1 = dt.date.fromisoformat(date_to)
        label = f"साप्ताहिक · {d.day}–{d1.day} {MON[d1.month - 1]}" if d.month == d1.month else f"साप्ताहिक · {d.day} {MON[d.month - 1]} – {d1.day} {MON[d1.month - 1]}"
    else: label = f"{DAYS[d.weekday()]} · {d.day} {MON[d.month - 1]}"
    return dict(sign=sign, rashi=rashi, element=elem, language="hindi", target_country="India", date=date, period="weekly" if wk else "daily",
                date_label=label, sky=e.get("sky", ""), voice=voice, shots=shots)

def sh(cmd, **kw): return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)

def build(folder, sheet):
    t0 = time.time(); R = json.load(open(f"{folder}/reading.json")); voice = R["voice"]
    sh(["python3", f"{HERE}/sign_audio.py", folder, voice]); sh(["python3", f"{HERE}/sign2_video.py", folder])
    TL = json.load(open(f"{folder}/timeline.json")); n = round(TL["total"] * 30); page = os.path.abspath(f"{folder}/sign.html")
    parts = [(k * n // 3, (k + 1) * n // 3) for k in range(3)]
    ps = [subprocess.Popen(["node", f"{HERE}/frames.js", page, f"{folder}/frames", "30", "1080", "1920", str(a), str(b)], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE) for a, b in parts]
    for p in ps:
        if p.wait(): raise RuntimeError(p.stderr.read().decode()[-400:])
    base = f"{folder}/{R['date']}{'_week' if R.get('period') == 'weekly' else ''}_{R['sign'].lower()}"
    for wav, out in (("audio.wav", f"{base}.mp4"), ("audio_nomusic.wav", f"{base}_voice-only.mp4")):
        sh(["ffmpeg", "-loglevel", "error", "-y", "-framerate", "30", "-i", f"{folder}/frames/f_%05d.jpg", "-i", f"{folder}/{wav}", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-shortest", "-movflags", "+faststart", out])
    sh(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{folder}/frames/f_00000.jpg", "-q:v", "2", f"{base}_cover.jpg"])
    ln = sh(["ffmpeg", "-hide_banner", "-i", f"{base}.mp4", "-af", "loudnorm=print_format=json", "-f", "null", "-"]).stderr
    ln = json.loads(ln[ln.rfind("{"):]); dur = float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{base}.mp4"]).stdout)
    ok = abs(dur - TL["total"]) < 0.2 and -18 <= float(ln["input_i"]) <= -14 and float(ln["input_tp"]) <= -1 and all(s["cues"] for s in TL["shots"])
    if sheet:
        ts = [s["start"] + 0.8 * (s["end"] - s["start"]) for s in TL["shots"]]
        sh(["ffmpeg", "-loglevel", "error", "-y", *sum([["-i", f"{folder}/frames/f_{min(round(t * 30), n - 1):05d}.jpg"] for t in ts], []), "-filter_complex",
            "".join(f"[{i}]scale=180:320[s{i}];" for i in range(len(ts))) + "".join(f"[s{i}]" for i in range(len(ts))) + f"hstack={len(ts)}", f"{folder}/sheet.jpg"])
    sh(["rm", "-rf", f"{folder}/frames"])
    res = dict(status="done" if ok else "check", sign=R["sign"], rashi=R["rashi"], date=R["date"], files=[os.path.basename(x) for x in (f"{base}.mp4", f"{base}_voice-only.mp4", f"{base}_cover.jpg")],
               checks=dict(duration_s=round(dur, 1), lufs=float(ln["input_i"]), true_peak_db=float(ln["input_tp"])), seconds=round(time.time() - t0))
    json.dump(res, open(f"{folder}/result.json", "w"), ensure_ascii=False, indent=1)
    return res

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]; D = json.load(open(args[0])); out = args[1] if len(args) > 1 else "out"
    only = next((a.split("=", 1)[1].split(",") for a in sys.argv if a.startswith("--only=")), None)
    voice = D.get("voice", "eleven:RABOvaPec1ymXz02oDQi")
    for key, e in D["signs"].items():
        if only and key not in only: continue
        date = D.get("date") or D["date_from"]; f = f"{out}/{date}{'_week' if D.get('date_to') else ''}/{key}"; os.makedirs(f, exist_ok=True)
        json.dump(reading(key, e, date, voice, D.get("date_to")), open(f"{f}/reading.json", "w"), ensure_ascii=False, indent=1)
        import hashlib   # credit guard: count characters not yet in the shared voice cache
        cdir = os.environ.get("XI_CACHE", os.path.expanduser("~/.cache/horoscope-voice")); R = json.load(open(f"{f}/reading.json"))
        new = sum(len(x["vo"]) for x in R["shots"] if not os.path.exists(f"{cdir}/{hashlib.sha1((voice + '|' + x['vo']).encode()).hexdigest()[:16]}.json"))
        spent = globals().get("SPENT", 0)
        if spent + new > int(os.environ.get("XI_MAX_CHARS", "1500")): print(key, "SKIPPED: would need", new, "new voice characters; raise XI_MAX_CHARS"); continue
        globals()["SPENT"] = spent + new
        if "--dry" in sys.argv: print(key, "new voice characters:", new); continue
        try: r = build(f, "--sheet" in sys.argv); print(key, r["status"], r["checks"], f"{r['seconds']}s")
        except Exception as x: print(key, "FAILED", str(x)[-300:])
