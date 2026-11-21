"""Cover (first frame) samples for the weekly horoscope. usage: python3 cover_samples.py <out_dir> <hero.jpg>
Writes A..D.html (1080x1920, window.render no-op). Key text stays inside the centre 1080x1440 (Instagram grid crop)."""
import os, sys
OUT, HERO = sys.argv[1], os.path.abspath(sys.argv[2]); os.makedirs(OUT, exist_ok=True)
FD = "/home/claude/work/node_modules/@fontsource"
D = dict(sign="SAGITTARIUS", rashi="DHANU", glyph="♐︎", date="23 – 29 NOV 2026", hook="LUCK KNOCKS", warn="GUARD YOUR WALLET SAT–SUN",
         best="TUE · WED · THU · FRI", stop="SAT · SUN", lines=[("LOVE", "DATE NIGHT"), ("WORK", "A MENTOR HELPS"), ("FRIENDS", "A NEW OPENING")])
FONTS = "".join(f'@font-face{{font-family:"{n}";font-weight:{w};src:url("file://{FD}/{d}/files/{d}-latin-{w}-normal.woff2")}}'
                for n, d, w in [("Bebas", "bebas-neue", 400), ("Cinzel", "cinzel", 600), ("Cinzel", "cinzel", 700), ("Inter", "inter", 500)])
BASE = FONTS + """html,body{margin:0;background:#000}#st{position:relative;width:1080px;height:1920px;overflow:hidden;background:#050403;color:#fff;font-family:Bebas}
.ab{position:absolute}.c{left:0;width:1080px;text-align:center}.gold{color:#e2c06a}.cin{font-family:Cinzel;font-weight:700}
.safe{position:absolute;left:0;top:240px;width:1080px;height:1440px;outline:0}"""
stars = "".join(f'<i class="ab" style="left:{(i*397)%1080}px;top:{(i*733)%1920}px;width:{2+i%3}px;height:{2+i%3}px;border-radius:50%;background:rgba(255,240,210,{.3+(i%5)/8})"></i>' for i in range(140))
P = {}
# A: photo poster
P["A"] = f"""<div id="st"><img class="ab" src="file://{HERO}" style="inset:0;width:1080px;height:1920px;object-fit:cover">
<div class="ab" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,.85) 0%,rgba(0,0,0,.2) 30%,rgba(0,0,0,.1) 52%,rgba(0,0,0,.92) 78%)"></div>
<div class="ab c cin gold" style="top:262px;font-size:44px;letter-spacing:14px">WEEKLY HOROSCOPE</div>
<div class="ab c" style="top:322px;font:500 40px Inter;letter-spacing:6px">{D['date']}</div>
<div class="ab c" style="top:1180px;font-size:250px;line-height:.9;letter-spacing:4px">{D['sign']}</div>
<div class="ab c cin gold" style="top:1400px;font-size:46px;letter-spacing:12px">{D['glyph']} {D['rashi']} RASHI</div>
<div class="ab c" style="top:1480px"><span style="background:#e2b84a;color:#0b0906;font-size:110px;padding:0 24px">{D['hook']}</span></div>
<div class="ab c cin" style="top:1820px;font-size:34px;letter-spacing:8px;color:#d8b65c">TAROT TALK BY SAKSHI</div></div>"""
# B: zodiac wheel
signs = "♈♉♊♋♌♍♎♏♐♑♒♓"
wheel = "".join(f'<div class="ab" style="left:{540+330*__import__("math").sin(i*0.5236)-45:.0f}px;top:{960-330*__import__("math").cos(i*0.5236)-45:.0f}px;width:90px;height:90px;border-radius:50%;'
                f'{"background:#e2b84a;color:#0b0906;box-shadow:0 0 50px #e2b84a" if s=="♐" else "color:#8a6f2e"};font:60px/90px \'DejaVu Sans\';text-align:center">{s}︎</div>' for i, s in enumerate(signs))
P["B"] = f"""<div id="st">{stars}<div class="ab" style="left:150px;top:570px;width:780px;height:780px;border-radius:50%;border:3px solid #8a6f2e"></div>
<div class="ab" style="left:250px;top:670px;width:580px;height:580px;border-radius:50%;border:2px solid #3d3014"></div>{wheel}
<div class="ab c cin gold" style="top:262px;font-size:52px;letter-spacing:14px">WEEKLY HOROSCOPE</div>
<div class="ab c" style="top:340px;font:500 40px Inter;letter-spacing:6px">{D['date']}</div>
<div class="ab c" style="top:820px;font-size:150px;line-height:.9">{D['sign']}</div><div class="ab c cin gold" style="top:960px;font-size:40px;letter-spacing:10px">{D['rashi']} RASHI</div>
<div class="ab c" style="top:1440px"><span style="background:#e2b84a;color:#0b0906;font-size:104px;padding:0 22px">{D['hook']}</span></div>
<div class="ab c" style="top:1570px"><span style="background:#d22f37;font-size:66px;padding:0 18px">{D['warn']}</span></div>
<div class="ab c cin" style="top:1820px;font-size:34px;letter-spacing:8px;color:#d8b65c">TAROT TALK BY SAKSHI</div></div>"""
# C: tarot card
P["C"] = f"""<div id="st">{stars}<div class="ab c cin gold" style="top:150px;font-size:56px;letter-spacing:14px">WEEKLY</div><div class="ab c cin gold" style="top:220px;font-size:56px;letter-spacing:14px">HOROSCOPE</div>
<div class="ab" style="left:190px;top:330px;width:700px;height:1120px;border:4px solid #d8b65c;border-radius:30px;background:#0b0906;box-shadow:0 0 0 14px #050403,0 0 0 17px #8a6f2e,0 30px 80px rgba(0,0,0,.8)">
 <div class="ab c cin gold" style="left:0;width:700px;top:20px;font-size:60px">{D['glyph']}</div>
 <img class="ab" src="file://{HERO}" style="left:34px;top:110px;width:632px;height:820px;object-fit:cover;border-radius:6px">
 <div class="ab cin" style="left:0;width:700px;text-align:center;top:950px;font-size:72px;letter-spacing:6px;background:linear-gradient(100deg,#a8873a,#fff3c4 50%,#a8873a);-webkit-background-clip:text;color:transparent">{D['sign']}</div>
 <div class="ab" style="left:0;width:700px;text-align:center;top:1040px;font:500 34px Inter;letter-spacing:6px;color:#e9dcc0">{D['date']}</div></div>
<div class="ab c" style="top:1500px"><span style="background:#e2b84a;color:#0b0906;font-size:110px;padding:0 24px">{D['hook']}</span></div>
<div class="ab c cin" style="top:1820px;font-size:34px;letter-spacing:8px;color:#d8b65c">TAROT TALK BY SAKSHI</div></div>"""
# D: calendar week
days = [("MON", "c"), ("TUE", "g"), ("WED", "g"), ("THU", "g"), ("FRI", "g"), ("SAT", "s"), ("SUN", "s")]
cal = "".join(f'<div style="width:132px;height:170px;border-radius:18px;{"background:#e2b84a;color:#0b0906" if m=="g" else ("background:#d22f37" if m=="s" else "border:4px solid #f0a020;color:#f0a020;box-sizing:border-box")};text-align:center">'
              f'<div style="font-size:64px;line-height:96px">{d}</div><div style="font:700 30px Cinzel">{23+i}</div></div>' for i, (d, m) in enumerate(days))
P["D"] = f"""<div id="st"><img class="ab" src="file://{HERO}" style="left:0;top:440px;width:1080px;height:560px;object-fit:cover;object-position:50% 22%">
<div class="ab" style="left:0;top:430px;width:1080px;height:580px;background:linear-gradient(180deg,#050403,rgba(0,0,0,0) 15%,rgba(0,0,0,0) 85%,#050403)"></div>
<div class="ab c" style="top:250px;font-size:130px;line-height:.9;letter-spacing:4px">YOUR WEEK</div><div class="ab c cin gold" style="top:380px;font-size:44px;letter-spacing:10px">WEEKLY HOROSCOPE</div>
<div class="ab c" style="top:1015px;font-size:160px;line-height:.9">{D["glyph"]} {D["sign"]}</div>
<div class="ab" style="left:24px;top:1190px;width:1032px;display:flex;gap:16px;justify-content:center">{cal}</div>
<div class="ab c" style="top:1400px;font-size:64px"><span class="gold">BEST</span> {D['best']}</div><div class="ab c" style="top:1480px;font-size:64px"><span style="color:#ff6b6b">CAREFUL</span> {D['stop']}</div>
<div class="ab c" style="top:1600px"><span style="background:#e2b84a;color:#0b0906;font-size:90px;padding:0 20px">{D['hook']}</span></div>
<div class="ab c cin" style="top:1820px;font-size:34px;letter-spacing:8px;color:#d8b65c">TAROT TALK BY SAKSHI</div></div>"""
# A2: A with reviewer fixes (bold weekly band, glyph by name, day strip inside the grid crop)
strip = "".join(f'<div style="width:118px;height:78px;border-radius:12px;font-size:50px;line-height:78px;text-align:center;{"background:#e2b84a;color:#0b0906" if m=="g" else ("background:#d22f37" if m=="s" else "border:3px solid #f0a020;color:#f0a020;box-sizing:border-box;line-height:72px")}">{d}</div>' for d, m in days)
P["A2"] = f"""<div id="st"><img class="ab" src="file://{HERO}" style="inset:0;width:1080px;height:1920px;object-fit:cover">
<div class="ab" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,.9) 0%,rgba(0,0,0,.25) 28%,rgba(0,0,0,.1) 48%,rgba(0,0,0,.94) 74%)"></div>
<div class="ab c" style="top:258px"><span style="display:inline-block;background:rgba(20,14,4,.85);border:3px solid #d8b65c;padding:14px 36px;font:700 50px Cinzel;letter-spacing:10px;color:#f0d48a">WEEKLY HOROSCOPE</span></div>
<div class="ab c" style="top:372px;font-size:76px;letter-spacing:6px">23 – 29 NOV</div>
<div class="ab c" style="top:1100px;font-size:200px;line-height:.9;letter-spacing:3px;white-space:nowrap"><span style="font:130px 'DejaVu Sans';color:#e2b84a;vertical-align:14px">♐︎</span>{D['sign']}</div>
<div class="ab c cin gold" style="top:1300px;font-size:44px;letter-spacing:12px">{D['rashi']} RASHI</div>
<div class="ab c" style="top:1370px"><span style="background:#e2b84a;color:#0b0906;font-size:110px;padding:0 24px">{D['hook']}</span></div>
<div class="ab" style="left:40px;top:1530px;width:1000px;display:flex;gap:12px;justify-content:center">{strip}</div>
<div class="ab c cin" style="top:1820px;font-size:34px;letter-spacing:8px;color:#d8b65c">TAROT TALK BY SAKSHI</div></div>"""
for k, body in P.items():
    open(f"{OUT}/{k}.html", "w").write(f'<!doctype html><html><head><meta charset="utf-8"><style>{BASE}</style></head><body>{body}<script>window.DUR=1;window.render=async t=>{{await document.fonts.ready}};</script></body></html>')
print("ok")

# ---- horoscope-first samples (no big person photo) ----
import math
CON = [[.16, .84], [.86, .12]], [[.60, .18], [.86, .12], [.80, .40]], [[.30, .70], [.20, .55], [.42, .48], [.58, .62], [.30, .70]]
def con_svg(w, h, op=.8):
    pts = "".join(f'<polyline points="{" ".join(f"{x*w:.0f},{y*h:.0f}" for x, y in pl)}" fill="none" stroke="rgba(226,192,106,{op})" stroke-width="3"/>' +
                  "".join(f'<circle cx="{x*w:.0f}" cy="{y*h:.0f}" r="9" fill="#fff3c4"/><circle cx="{x*w:.0f}" cy="{y*h:.0f}" r="22" fill="rgba(255,230,160,.18)"/>' for x, y in pl) for pl in CON)
    return f'<svg width="{w}" height="{h}" style="position:absolute;left:0;top:0">{pts}</svg>'
strip = "".join(f'<div style="width:118px;height:78px;border-radius:12px;font-size:50px;line-height:78px;text-align:center;{"background:#e2b84a;color:#0b0906" if m=="g" else ("background:#d22f37" if m=="s" else "border:3px solid #f0a020;color:#f0a020;box-sizing:border-box;line-height:72px")}">{d}</div>' for d, m in days)
TOP = lambda y=250: f'<div class="ab c" style="top:{y}px;font-size:150px;line-height:.9;letter-spacing:6px;color:#f3e3b8">WEEKLY</div><div class="ab c" style="top:{y+128}px;font-size:150px;line-height:.9;letter-spacing:6px;color:#f3e3b8">HOROSCOPE</div>'
BR = '<div class="ab c cin" style="top:1820px;font-size:34px;letter-spacing:8px;color:#d8b65c">TAROT TALK BY SAKSHI</div>'
# E: giant glowing glyph
P2 = {}
P2["E"] = f"""<div id="st">{stars}{TOP()}<div class="ab c gold cin" style="top:530px;font-size:44px;letter-spacing:10px">23 – 29 NOV 2026</div>
<div class="ab" style="left:240px;top:620px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(226,184,74,.35),rgba(226,184,74,0) 65%)"></div>
<div class="ab" style="left:290px;top:670px;width:500px;height:500px;border-radius:50%;border:4px solid #d8b65c;box-shadow:0 0 0 14px rgba(216,182,92,.15)"></div>
<div class="ab c" style="top:700px;font:400px/440px 'DejaVu Sans';color:#f0cf74;text-shadow:0 0 40px rgba(240,200,110,.8)">♐︎</div>
<div class="ab c" style="top:1215px;font-size:170px;line-height:.9;letter-spacing:4px">{D['sign']}</div>
<div class="ab c cin gold" style="top:1375px;font-size:40px;letter-spacing:12px">DHANU RASHI</div>
<div class="ab" style="left:40px;top:1450px;width:1000px;display:flex;gap:12px;justify-content:center">{strip}</div>
<div class="ab c" style="top:1560px"><span style="background:#e2b84a;color:#0b0906;font-size:92px;padding:0 22px">{D['hook']}</span></div>{BR}</div>"""
# F: constellation map
P2["F"] = f"""<div id="st">{stars}<div class="ab" style="left:90px;top:560px;width:900px;height:760px">{con_svg(900, 760)}</div>{TOP()}
<div class="ab c gold cin" style="top:530px;font-size:44px;letter-spacing:10px">23 – 29 NOV 2026</div>
<div class="ab c" style="top:1240px;font-size:190px;line-height:.9;letter-spacing:4px"><span style="font:130px 'DejaVu Sans';color:#e2b84a;vertical-align:14px">♐︎</span>{D['sign']}</div>
<div class="ab c cin gold" style="top:1420px;font-size:40px;letter-spacing:12px">DHANU RASHI</div>
<div class="ab c" style="top:1500px"><span style="background:#e2b84a;color:#0b0906;font-size:100px;padding:0 22px">{D['hook']}</span></div>{BR}</div>"""
# G: big zodiac wheel, text outside it
wheel2 = "".join(f'<div class="ab" style="left:{540+390*math.sin(i*0.5236)-60:.0f}px;top:{1010-390*math.cos(i*0.5236)-60:.0f}px;width:120px;height:120px;border-radius:50%;'
                 f'{"background:#e2b84a;color:#0b0906;box-shadow:0 0 60px #e2b84a" if s=="♐" else "color:#a8873a;border:2px solid #3d3014"};font:76px/120px \'DejaVu Sans\';text-align:center">{s}︎</div>' for i, s in enumerate(signs))
P2["G"] = f"""<div id="st">{stars}<div class="ab" style="left:80px;top:550px;width:920px;height:920px;border-radius:50%;border:3px solid #8a6f2e"></div>{wheel2}
<div class="ab c" style="top:250px;font-size:120px;line-height:.9;letter-spacing:6px;color:#f3e3b8">WEEKLY HOROSCOPE</div><div class="ab c gold cin" style="top:370px;font-size:44px;letter-spacing:10px">23 – 29 NOV 2026</div>
<div class="ab c" style="top:900px;font-size:150px;line-height:.9">{D['sign']}</div><div class="ab c cin gold" style="top:1040px;font-size:40px;letter-spacing:10px">DHANU RASHI</div>
<div class="ab c" style="top:1520px"><span style="background:#e2b84a;color:#0b0906;font-size:100px;padding:0 22px">{D['hook']}</span></div>{BR}</div>"""
EMB = os.environ.get("EMBLEM")
if EMB:
    P2["H"] = f"""<div id="st"><img class="ab" src="file://{os.path.abspath(EMB)}" style="left:170px;top:620px;width:740px;height:700px;object-fit:contain;mix-blend-mode:lighten;-webkit-mask-image:radial-gradient(ellipse 48% 48% at 50% 50%,#000 75%,transparent 100%)">{TOP(285)}
<div class="ab c gold cin" style="top:560px;font-size:44px;letter-spacing:10px">23 – 29 NOV 2026</div>
<div class="ab c" style="top:1340px;font-size:170px;line-height:.9;letter-spacing:4px;text-shadow:0 6px 30px #000">{D['sign']}</div>
<div class="ab c cin gold" style="top:1495px;font-size:42px;letter-spacing:12px">DHANU RASHI</div>
<div class="ab c" style="top:1560px"><span style="background:#e2b84a;color:#0b0906;font-size:100px;padding:0 26px">{D['hook']}</span></div>{BR}</div>"""
for k, body in P2.items():
    open(f"{OUT}/{k}.html", "w").write(f'<!doctype html><html><head><meta charset="utf-8"><style>{BASE}</style></head><body>{body}<script>window.DUR=1;window.render=async t=>{{await document.fonts.ready}};</script></body></html>')
