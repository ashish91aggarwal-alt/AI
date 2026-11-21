"""Compact sky notes (IST, Lahiri sidereal) for writing the readings. No web search needed.
usage: python3 sky.py 2026-11-23 [2026-11-29]     (with an end date: weekly notes, Moon by day, good/care/stop days per rashi)
Also imported by make.py (day_marks)."""
import sys, datetime as dt
import swisseph as swe
swe.set_sid_mode(swe.SIDM_LAHIRI); F = swe.FLG_SIDEREAL | swe.FLG_SPEED | swe.FLG_MOSEPH
R = "Mesh Vrishabh Mithun Kark Simha Kanya Tula Vrishchik Dhanu Makar Kumbh Meen".split()
P = [("Su", 0), ("Mo", 1), ("Me", 2), ("Ve", 3), ("Ma", 4), ("Ju", 5), ("Sa", 6), ("Ra", 10)]
LORD = ["Ma", "Ve", "Me", "Mo", "Su", "Me", "Ve", "Ma", "Ju", "Sa", "Sa", "Ju"]
GOOD, STOP = {1, 3, 6, 7, 10, 11}, {4, 8, 12}       # Moon transit (gochar) from the Moon sign: others = care

def pos(day, h=12.0):
    jd = swe.julday(day.year, day.month, day.day, h - 5.5); out = {}
    for n, i in P:
        x = swe.calc_ut(jd, i, F)[0]; out[n] = (int(x[0] // 30), x[0] % 30, x[3] < 0)
    out["Ke"] = ((out["Ra"][0] + 6) % 12, out["Ra"][1], True); return out

def day_marks(ri, d0, d1):
    """good/care/stop per day for rashi index ri, from the Moon's house at noon IST."""
    out, d = [], d0
    while d <= d1:
        h = (pos(d)["Mo"][0] - ri) % 12 + 1; out.append((d, "good" if h in GOOD else "stop" if h in STOP else "care", h)); d += dt.timedelta(days=1)
    return out

def fmt(p): return " ".join(f"{n}:{R[s]}{dg:.0f}{'R' if r and n not in ('Ra', 'Ke') else ''}" for n, (s, dg, r) in p.items())

if __name__ == "__main__":
    d0 = dt.date.fromisoformat(sys.argv[1]); d1 = dt.date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 else d0
    a = pos(d0, 6); print(f"{d0} 6:00 IST:", fmt(a))
    d = d0      # sign changes and stations from the start to 3 days after the end
    while d <= d1 + dt.timedelta(days=3):
        p0, p1 = pos(d, 0), pos(d + dt.timedelta(days=1), 0)
        for n in ("Su", "Me", "Ve", "Ma", "Ju", "Sa"):
            if p1[n][0] != p0[n][0]: print(f"{d + dt.timedelta(days=1)}: {n} -> {R[p1[n][0]]}")
            if p1[n][2] != p0[n][2]: print(f"{d + dt.timedelta(days=1)}: {n} turns {'retro' if p1[n][2] else 'direct'}")
        d += dt.timedelta(days=1)
    if d1 > d0:
        print("Moon:", " ".join(f"{x.strftime('%a')}:{R[pos(x)['Mo'][0]]}" for x in (d0 + dt.timedelta(days=k) for k in range((d1 - d0).days + 1))))
    for i, r in enumerate(R):
        hs = " ".join(f"{n}{(s - i) % 12 + 1}" for n, (s, _, _) in a.items())
        days = " ".join(f"{x.strftime('%a')}{m[0].upper()}" for x, m, _ in day_marks(i, d0, d1)) if d1 > d0 else ""
        print(f"{r:9s} lord {LORD[i]} H{(a[LORD[i]][0] - i) % 12 + 1} | {hs} | {days}")
    print("houses: 1 self 2 money/speech/family 3 effort/short trips 4 home/mother 5 kids/love/ideas 6 work load/rivals/health 7 partner 8 sudden 9 luck/long trips 10 career 11 gains/friends 12 spending/rest. Days: G good C care S stop (from Moon).")
