"""One long soundtrack from several music sets, with a title for every piece (owner 19 Nov:
"the video shall mention the new music; each new music opens slowly; the video fades in and out").

- Each set's music-only file is cut into its pieces (the silences between pieces), each piece gets a slow
  opening (8 s raised-cosine fade-in) and a soft close (6 s), and the pieces follow each other with 3 s of quiet.
- One continuous fire + wind bed runs under the whole programme (its own seed, so it never lines up with a set).
- The whole mix is set to -21 LUFS (linear gain) with a 10 s fade-in at the start and a 12 s fade-out at the end.
- A cue sheet (JSON) lists every piece with its start time, title and composer; the video draws the titles from it.

python3 playlist.py out_dir --sets nocturnes hymns original [--seconds 4200] [--seed 21]
Writes out_dir/playlist_mix.flac and out_dir/playlist_cues.json.
"""
import argparse, json, math, os, subprocess, sys
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
SETS_DIR = "/tmp/sets"

# titles in the order the pieces sit in each set (pd_sets.py / c4_music.py)
TITLES = {
    "original": [("Sleepy Cat Cabin", "original piano"), ("Warm Mug", "original piano"),
                 ("Snow on the Pane", "original piano"), ("Sleepy Cat Cabin, reprise", "original piano")],
    "nocturnes": [("Prelude in C major, BWV 846", "J. S. Bach, 1722"),
                  ("Aus meinen Tränen spriessen", "Robert Schumann, 1840"),
                  ("Prayer of a Tired Child", "Amy Beach"),
                  ("Lascia ch'io pianga", "G. F. Handel, 1711"),
                  ("Grave, Trio Sonata Op. 3 No. 1", "Arcangelo Corelli, 1689"),
                  ("Andantino grazioso, Op. 74 No. 1", "Joseph Haydn, 1793"),
                  ("Adagio, K. 156", "W. A. Mozart, 1772")],
    "hymns": [("Chorale, BWV 269", "J. S. Bach"), ("Christ lag in Todesbanden, BWV 277", "J. S. Bach"),
              ("Chorale, BWV 367", "J. S. Bach"), ("Chorale, BWV 311", "J. S. Bach"), ("Chorale, BWV 26.6", "J. S. Bach"),
              ("Chorale, BWV 354", "J. S. Bach"), ("Chorale, BWV 414", "J. S. Bach"),
              ("Christus, der ist mein Leben, BWV 281", "J. S. Bach"), ("Chorale, BWV 355", "J. S. Bach"),
              ("Chorale, BWV 433", "J. S. Bach")],
    "record": [("Grave, Trio Sonata Op. 3 No. 1", "Arcangelo Corelli, 1689"), ("Lascia ch'io pianga", "G. F. Handel, 1711"),
               ("Aus meinen Tränen spriessen", "Robert Schumann, 1840"), ("Prayer of a Tired Child", "Amy Beach"),
               ("Adagio, K. 156", "W. A. Mozart, 1772")],
}
MUSIC = {"original": "/tmp/c4music/piano.wav"}


def music_file(name):
    if name in MUSIC:
        return MUSIC[name]
    for f in (f"{name}_music_m.flac", f"{name}_music.flac", f"{name}_music_m.wav"):
        p = os.path.join(SETS_DIR, f)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(name)


def pd_segments(name, sr, target=720):
    """Exact piece times of a pd_sets.py set, from the same score timing the renderer used (no silence guessing:
    fermatas and the gramophone hiss fooled the gap finder)."""
    import pd_sets as S
    from music21 import corpus
    lists = {"hymns": [(p, 46, [("salamander", 40, 0)] * 4, 1.8) for p in S.HYMNS],
             "nocturnes": [(p, q, parts, 1.5) for p, q, parts in S.NOCTURNES],
             "record": [(p, q, parts, 1.5) for p, q, parts in S.RECORD]}[name]
    t, segs = 2.0, []
    for path, q, parts, hold in lists:
        try:
            sc = corpus.parse(path)
        except Exception:
            continue
        if name == "hymns" and len(sc.parts) < 4:
            continue
        _, end = S.score_notes(sc, q, parts, t0=t, hold_beats=hold)
        segs.append((int(t * sr), int((end + 3.0) * sr)))        # + reverb tail
        t = end + 4.0
        if t > target:
            break
    return segs


def pieces(x, sr, min_gap=1.6, floor_db=-50):
    """Split a set at its quiet gaps -> [(start, end)] in samples."""
    hop = int(0.1 * sr); m = x.mean(1)
    rms = np.sqrt(np.convolve(m[: len(m) // hop * hop].reshape(-1, hop).__pow__(2).mean(1), np.ones(5) / 5, "same"))
    db = 20 * np.log10(rms + 1e-9); peak = np.percentile(db, 95)
    quiet = db < max(floor_db, peak - 45)
    out, s, run = [], None, 0
    for i, q in enumerate(quiet):
        if not q and s is None:
            s = i
        if q:
            run += 1
            if s is not None and run * 0.1 >= min_gap:
                out.append((s * hop, (i - run + 1) * hop)); s = None
        else:
            run = 0
    if s is not None:
        out.append((s * hop, len(m)))
    return [(a, b) for a, b in out if (b - a) / sr > 20]          # ignore crumbs


def beds(tmp, seconds, seed, R, wind, SR, chunk=300.0, xf=10.0):
    """Fire + wind under the whole programme, made in ~4-6 min chunks (each its own seed) joined by 10 s crossfades:
    a 30+ min bed in one go ran the box out of memory. Different seeds per chunk -> no repeating loop."""
    # chunk lengths are uneven (230-370 s, owner 20 Nov: no timing may sit on a regular grid); chunk=None -> fixed
    rng_c = np.random.default_rng(seed + 77); lens = []
    while sum(lens) < seconds + chunk:
        lens.append(float(rng_c.uniform(230, 370)))
    n_chunks = len(lens)
    for kind in ("wind", "fire"):
        with sf.SoundFile(tmp + kind + ".wav", "w", SR, 2, subtype="PCM_24") as fw:
            tail = None; written = 0; total = int(seconds * SR); X = int(xf * SR)
            for k in range(n_chunks):
                L = lens[k] + xf + 1
                if kind == "wind":
                    y, _ = R.master(wind(L, seed=seed * 100 + k), lufs=-38.0, peak_dbtp=-12.0)
                else:
                    subprocess.run([sys.executable, os.path.join(HERE, "fire_ambience.py"), tmp + "chunk.wav", str(int(L)),
                                    str(seed * 100 + k)], check=True)
                    y = sf.read(tmp + "chunk.wav", dtype="float32", always_2d=True)[0]
                y = y.astype(np.float32)
                if y.shape[1] == 1:
                    y = np.repeat(y, 2, 1)
                if tail is not None:
                    w_ = np.linspace(0, 1, X, dtype=np.float32)[:, None]
                    y[:X] = y[:X] * w_ + tail * (1 - w_)
                body, tail = y[:-X], y[-X:]
                body = body[: max(0, total - written)]; fw.write(body); written += len(body)
                if written >= total:
                    break
            if written < total:
                fw.write(np.zeros((total - written, 2), np.float32))
    if os.path.exists(tmp + "chunk.wav"):
        os.remove(tmp + "chunk.wav")


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("out_dir"); ap.add_argument("--sets", nargs="+", required=True)
    ap.add_argument("--seconds", type=float, default=0); ap.add_argument("--seed", type=int, default=21)
    a = ap.parse_args(); os.makedirs(a.out_dir, exist_ok=True)
    import render as R
    from c4_music import wind
    from pd_sets import match_loudness
    SR = 48000
    prog, cues, t = [], [], 4.0                                  # 4 s of fire and wind before the first note
    gap = np.zeros((int(3.0 * SR), 2), np.float32)
    prog.append(np.zeros((int(t * SR), 2), np.float32))
    for name in a.sets:
        x, sr = sf.read(music_file(name), dtype="float32", always_2d=True)
        if sr != SR:
            raise SystemExit(f"{name}: sample rate {sr}, expected {SR}")
        segs = pd_segments(name, sr) if name in ("hymns", "nocturnes", "record") else pieces(x, sr, min_gap=1.2, floor_db=-60)
        titles = TITLES.get(name, [])
        print(name, len(segs), "pieces", [round((b - a_) / sr) for a_, b in segs])
        for k, (s0, s1) in enumerate(segs):
            y = x[s0:s1].copy(); n = len(y)
            fi, fo = min(int(8 * SR), n // 3), min(int(6 * SR), n // 3)
            y[:fi] *= (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fi)))[:, None] ** 1.5   # slow opening
            y[-fo:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fo)))[:, None]
            title, by = titles[k] if k < len(titles) else (f"{name} {k + 1}", "")
            cues.append(dict(start=round(t, 2), end=round(t + n / SR, 2), title=title, by=by, set=name))
            prog += [y, gap]; t += n / SR + 3.0
            if a.seconds and t >= a.seconds:
                break
        if a.seconds and t >= a.seconds:
            break
    # memory (8 GB box): write the programme and the beds to disk piece by piece / in 5-minute chunks
    tmp = os.path.join(a.out_dir, "pl_")
    n_music = sum(len(p) for p in prog)
    total = int(a.seconds * SR) if a.seconds else n_music + int(6 * SR)
    seconds = total / SR
    with sf.SoundFile(tmp + "music.wav", "w", SR, 2, subtype="PCM_24") as fw:
        done = 0
        for p in prog:
            p = p[: max(0, total - done)]; fw.write(p); done += len(p)
        if done < total:
            fw.write(np.zeros((total - done, 2), np.float32))
    del prog
    beds(tmp, seconds, a.seed, R, wind, SR)
    fade_out = max(0.0, seconds - 12)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp + "music.wav", "-i", tmp + "fire.wav", "-i", tmp + "wind.wav",
                    "-filter_complex", "[1:a]volume=-8dB[f];[2:a]volume=-3dB[w];[0:a][f][w]amix=inputs=3:normalize=0,"
                    f"afade=t=in:st=0:d=10,afade=t=out:st={fade_out:.2f}:d=12",
                    "-ar", "48000", "-t", f"{seconds:.2f}", tmp + "raw.wav"], check=True)
    out = os.path.join(a.out_dir, "playlist_mix.flac")
    match_loudness(tmp + "raw.wav", out)
    for f in ("music.wav", "wind.wav", "fire.wav", "raw.wav"):
        os.remove(tmp + f)
    json.dump(dict(seconds=round(seconds, 2), cues=cues), open(os.path.join(a.out_dir, "playlist_cues.json"), "w"), indent=1)
    print("->", out, round(seconds / 60, 1), "min,", len(cues), "pieces")

# ---------------------------------------------------------------- programme mode (owner 19 Nov night)
# Titles never hint at the sources (competitors): every piece gets a made-up gentle name, no composer, no year.
NAMES = ["Ember Glow", "Velvet Hush", "Snowfall on the Sill", "Warm Whiskers", "Quiet Hearth", "Moonlit Blanket",
         "Slow Purr", "Candle Drift", "Pine and Snow", "Soft Paws", "Sleepy Lantern", "Hush of the Woods",
         "Woolen Dreams", "Fireside Hum", "Starlit Window", "Drowsy Cocoa", "Gentle Embers", "Cozy Quilt",
         "Night Cabin", "Featherlight", "Dozing Tail", "Still Winter", "Amber Lamp", "Kettle Steam"]
ORIGINAL_NAMES = ["Sleepy Cat Cabin", "Warm Mug", "Snow on the Pane"]


def lullaby_segments(sr, cues_path=None, count=20, seed=100):
    """Lullaby piece positions in lullabies_music.wav: from its cue sheet, or predicted from the score
    (render length = last pedalled note end + 7 s tail + 1 s; pieces 4 s apart) so the video can start first."""
    if cues_path and os.path.exists(cues_path):
        return [(int(c["start"] * sr), int(c["end"] * sr)) for c in json.load(open(cues_path))]
    import lullabies as LB
    t, segs = 0.0, []
    for k in range(count):
        n, p, _, _ = LB.compose(seed + k)
        L = max(e for _, e, *_ in R_.apply_pedal(n, p)) + 7.0 + 1.0
        segs.append((int(t * sr), int((t + L) * sr))); t += L + 4.0
    return segs


def programme(target, n_lull=20):
    """Order: lullabies with the three original pieces spread between them, until the target length."""
    order, li, oi = [], 0, 0
    while li < n_lull:
        order += [("lullabies", li + j) for j in range(min(6, n_lull - li))]; li += 6
        if oi < 3:
            order.append(("original", oi)); oi += 1
    return order


def main_programme(a):
    import render as R
    global R_; R_ = R
    from c4_music import wind
    from pd_sets import match_loudness
    SR = 48000
    lseg = lullaby_segments(SR, os.path.join(SETS_DIR, "lullabies_cues.json") if not a.predict else None, a.lullabies)
    ox = None if a.predict else sf.read(MUSIC["original"], dtype="float32", always_2d=True)[0]
    oseg = pieces(sf.read(MUSIC["original"], dtype="float32", always_2d=True)[0], SR, min_gap=1.2, floor_db=-60)
    lx = None if a.predict else sf.read(os.path.join(SETS_DIR, "lullabies_music.wav"), dtype="float32", always_2d=True)[0]
    t, cues, prog = 4.0, [], [np.zeros((int(4.0 * SR), 2), np.float32)]
    gap = np.zeros((int(3.0 * SR), 2), np.float32); names = iter(NAMES)
    for kind, i in programme(a.seconds, a.lullabies):
        s0, s1 = (lseg if kind == "lullabies" else oseg)[i]
        n = s1 - s0
        title = next(names) if kind == "lullabies" else ORIGINAL_NAMES[i]
        cues.append(dict(start=round(t, 2), end=round(t + n / SR, 2), title=title, by="", set=kind))
        if not a.predict:
            y = (lx if kind == "lullabies" else ox)[s0:s1].copy()
            fi, fo = min(int(8 * SR), n // 3), min(int(6 * SR), n // 3)
            y[:fi] *= (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fi)))[:, None] ** 1.5
            y[-fo:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fo)))[:, None]
            prog += [y, gap]
        t += n / SR + 3.0
    seconds = t + 6.0
    json.dump(dict(seconds=round(seconds, 2), cues=cues), open(os.path.join(a.out_dir, "programme_cues.json"), "w"), indent=1)
    print(f"programme {seconds / 60:.1f} min, {len(cues)} pieces" + (" (predicted)" if a.predict else ""))
    if a.predict:
        return
    tmp = os.path.join(a.out_dir, "pl_"); total = int(seconds * SR)
    with sf.SoundFile(tmp + "music.wav", "w", SR, 2, subtype="PCM_24") as fw:
        done = 0
        for p in prog:
            p = p[: max(0, total - done)]; fw.write(p); done += len(p)
        if done < total:
            fw.write(np.zeros((total - done, 2), np.float32))
    del prog, lx, ox
    beds(tmp, seconds, a.seed, R, wind, SR)
    fade_out = max(0.0, seconds - 12)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp + "music.wav", "-i", tmp + "fire.wav", "-i", tmp + "wind.wav",
                    "-filter_complex", "[1:a]volume=-8dB[f];[2:a]volume=-3dB[w];[0:a][f][w]amix=inputs=3:normalize=0,"
                    f"afade=t=in:st=0:d=10,afade=t=out:st={fade_out:.2f}:d=12",
                    "-ar", "48000", "-t", f"{seconds:.2f}", tmp + "raw.wav"], check=True)
    out = os.path.join(a.out_dir, "programme_mix.flac")
    match_loudness(tmp + "raw.wav", out)
    for f in ("music.wav", "wind.wav", "fire.wav", "raw.wav"):
        os.remove(tmp + f)
    print("->", out)


# ---------------------------------------------------------------- suites mode (owner 20 Nov 00:02 IST)
# "We need multiple compositions. Uneven timings from 10-15 minutes each. Not syncing to any visual loop."
# Programme = the long compositions from sleep_suites.py, one title card each (made-up names, no composer, no year).
SUITE_NAMES = ["Ember Glow", "Velvet Hush", "Snowfall on the Sill", "Warm Whiskers", "Moonlit Blanket", "Slow Purr",
               "Sleepy Lantern", "Woolen Dreams", "Quiet Hearth", "Featherlight"]


def main_suites(a):
    import render as R
    from c4_music import wind
    from pd_sets import match_loudness
    import sleep_suites as SS
    SR = 48000; D = a.suites_dir
    t, cues, lens = 4.0, [], []
    for k in range(a.count):
        js = os.path.join(D, f"suite_{k}.json")
        L = json.load(open(js))["seconds"] if os.path.exists(js) and not a.predict else SS.predicted_seconds(k, a.count, a.suite_seed, a.total)
        cues.append(dict(start=round(t, 2), end=round(t + L, 2), title=SUITE_NAMES[k], by="", set="suite"))
        lens.append(L); t += L + 3.0
    seconds = t - 3.0 + 16.0                      # closing notes sit over the last fade and the fire
    json.dump(dict(seconds=round(seconds, 2), cues=cues), open(os.path.join(a.out_dir, "programme_cues.json"), "w"), indent=1)
    print(f"programme {seconds / 60:.2f} min, {len(cues)} compositions: " + ", ".join(f"{x / 60:.2f}" for x in lens)
          + (" (predicted)" if a.predict else ""))
    if a.predict:
        return
    tmp = os.path.join(a.out_dir, "pl_"); total = int(seconds * SR)
    with sf.SoundFile(tmp + "music.wav", "w", SR, 2, subtype="PCM_24") as fw:
        done = 0
        fw.write(np.zeros((int(4.0 * SR), 2), np.float32)); done += int(4.0 * SR)
        for k in range(a.count):
            y = sf.read(os.path.join(D, f"suite_{k}.wav"), dtype="float32", always_2d=True)[0]
            n = len(y); fi, fo = int(8 * SR), int(6 * SR)
            y[:fi] *= (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fi)))[:, None] ** 1.5      # slow opening
            y[-fo:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fo)))[:, None]
            y = y[: max(0, total - done)]; fw.write(y); done += len(y)
            g = np.zeros((min(int(3.0 * SR), max(0, total - done)), 2), np.float32); fw.write(g); done += len(g)
            del y
        if done < total:
            fw.write(np.zeros((total - done, 2), np.float32))
    beds(tmp, seconds, a.seed, R, wind, SR)
    fade_out = max(0.0, seconds - 12)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp + "music.wav", "-i", tmp + "fire.wav", "-i", tmp + "wind.wav",
                    "-filter_complex", "[1:a]volume=-8dB[f];[2:a]volume=-3dB[w];[0:a][f][w]amix=inputs=3:normalize=0,"
                    f"afade=t=in:st=0:d=10,afade=t=out:st={fade_out:.2f}:d=12",
                    "-ar", "48000", "-t", f"{seconds:.2f}", tmp + "raw.wav"], check=True)
    out = os.path.join(a.out_dir, "programme_mix.flac")
    match_loudness(tmp + "raw.wav", out)
    for f in ("music.wav", "wind.wav", "fire.wav", "raw.wav"):
        os.remove(tmp + f)
    print("->", out)


if __name__ == "__main__":
    if "--suites" in sys.argv:
        ap = argparse.ArgumentParser(); ap.add_argument("out_dir"); ap.add_argument("--suites", dest="suites_dir", required=True)
        ap.add_argument("--predict", action="store_true"); ap.add_argument("--count", type=int, default=8)
        ap.add_argument("--suite-seed", type=int, default=300); ap.add_argument("--total", type=float, default=95.0)
        ap.add_argument("--seed", type=int, default=23)
        a = ap.parse_args(); os.makedirs(a.out_dir, exist_ok=True); main_suites(a)
    elif "--programme" in sys.argv:
        ap = argparse.ArgumentParser(); ap.add_argument("out_dir"); ap.add_argument("--programme", action="store_true")
        ap.add_argument("--predict", action="store_true"); ap.add_argument("--seconds", type=float, default=4200)
        ap.add_argument("--lullabies", type=int, default=20); ap.add_argument("--seed", type=int, default=21)
        a = ap.parse_args(); os.makedirs(a.out_dir, exist_ok=True); main_programme(a)
    else:
        main()
