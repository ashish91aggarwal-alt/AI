"""Compact sky notes for a date (IST, Lahiri sidereal), per rashi, for writing the readings.
usage: python3 sky.py 2026-11-21     (prints about 20 lines; no web search needed)"""
import sys, datetime as dt
import swisseph as swe
swe.set_sid_mode(swe.SIDM_LAHIRI); F = swe.FLG_SIDEREAL | swe.FLG_SPEED | swe.FLG_MOSEPH
R = "Mesh Vrishabh Mithun Kark Simha Kanya Tula Vrishchik Dhanu Makar Kumbh Meen".split()
P = [("Su", 0), ("Mo", 1), ("Me", 2), ("Ve", 3), ("Ma", 4), ("Ju", 5), ("Sa", 6), ("Ra", 10)]
d = dt.date.fromisoformat(sys.argv[1])
def pos(h, day=d):
    jd = swe.julday(day.year, day.month, day.day, h - 5.5); out = {}
    for n, i in P:
        x = swe.calc_ut(jd, i, F)[0]; out[n] = (int(x[0] // 30), x[0] % 30, x[3] < 0)
    out["Ke"] = ((out["Ra"][0] + 6) % 12, out["Ra"][1], True); return out
a, b = pos(6), pos(23.99)
print(f"{d} sunrise 6:00 IST:", " ".join(f"{n}:{R[s]}{dg:.0f}{'R' if r and n not in ('Ra','Ke') else ''}" for n, (s, dg, r) in a.items()))
if a["Mo"][0] != b["Mo"][0]:
    for m in range(6 * 60, 24 * 60, 5):
        if pos(m / 60)["Mo"][0] != a["Mo"][0]: print(f"Moon enters {R[b['Mo'][0]]} ~{m // 60:02d}:{m % 60:02d} IST"); break
seen = set()
for k in (1, 2, 3):   # sign changes coming soon (hooks like "your planet comes home tomorrow")
    n2 = pos(12, d + dt.timedelta(days=k))
    for n in ("Su", "Me", "Ve", "Ma", "Ju", "Sa"):
        if n2[n][0] != a[n][0] and n not in seen: seen.add(n); print(f"in {k} day(s): {n} -> {R[n2[n][0]]}")
LORD = ["Ma", "Ve", "Me", "Mo", "Su", "Me", "Ve", "Ma", "Ju", "Sa", "Sa", "Ju"]
for i, r in enumerate(R):   # house of each planet counted from the rashi (1 = the rashi itself)
    hs = " ".join(f"{n}{(s - i) % 12 + 1}" for n, (s, _, _) in a.items())
    print(f"{r:9s} lord {LORD[i]} in H{(a[LORD[i]][0] - i) % 12 + 1} | {hs}")
print("houses: 1 self 2 money/speech/family 3 effort/short trips 4 home/mother 5 kids/love/ideas 6 work load/rivals/health 7 partner 8 sudden 9 luck/long trips 10 career 11 gains/friends 12 spending/rest")
