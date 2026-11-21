"""Look v4 "deck" (kinetic type + tarot cards). usage: python3 sign3_video.py <folder>   -> <folder>/sign.html
Reads timeline.json from sign_audio.py. Clips sit inside a tarot card (face-centred crop), text lives below the card,
so text never covers a face. Every section has its own transition and text motion, matched to what is said."""
import json, os, sys, glob, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); DIR = sys.argv[1]
TL = json.load(open(f"{DIR}/timeline.json"))
NM = os.environ.get("HS_NODE_MODULES", os.path.abspath(f"{HERE}/../node_modules")); FD = f"{NM}/@fontsource"
STOCK = os.environ.get("HS_STOCK", os.path.abspath(f"{HERE}/../stock"))
GRADE = "eq=contrast=1.06:saturation=1.08:gamma=0.98,colorbalance=rs=0.03:bs=-0.03:rh=0.02:bh=-0.02"
CW, CH = 728, 900                                     # card window (clip area inside the card)
GLYPH = dict(aries="♈", taurus="♉", gemini="♊", cancer="♋", leo="♌", virgo="♍", libra="♎", scorpio="♏", sagittarius="♐", capricorn="♑", aquarius="♒", pisces="♓")
SIGN_CARD = dict(aries=("IV", "THE EMPEROR"), taurus=("V", "THE HIEROPHANT"), gemini=("VI", "THE LOVERS"), cancer=("VII", "THE CHARIOT"), leo=("VIII", "STRENGTH"),
                 virgo=("IX", "THE HERMIT"), libra=("XI", "JUSTICE"), scorpio=("XIII", "REBIRTH"), sagittarius=("XIV", "TEMPERANCE"), capricorn=("XV", "THE DEVIL"),
                 aquarius=("XVII", "THE STAR"), pisces=("XVIII", "THE MOON"))
CARD = dict(meters=("X", "WHEEL OF FORTUNE"), money=("X", "WHEEL OF FORTUNE"), work=("I", "THE MAGICIAN"), friends=("XVII", "THE STAR"), family=("III", "THE EMPRESS"),
            kids=("XIX", "THE SUN"), decide=("II", "HIGH PRIESTESS"), love=("VI", "THE LOVERS"), travel=("VII", "THE CHARIOT"), health=("IX", "THE HERMIT"),
            remedy=("XIV", "TEMPERANCE"), tone_happy=("XXI", "THE WORLD"), tone_sad=("XVIII", "THE MOON"), tone_serious=("IV", "THE EMPEROR"),
            tone_fun=("0", "THE FOOL"), tone_encouraging=("VIII", "STRENGTH"))
# transition into each section (matches what the voice says) and the text motion for its lines
TR = dict(hook="flip", meters="wheel", tone_happy="burst", days="deal", tone_serious="drop", work="whip", friends="meet", family="doors", tone_sad="sink",
          kids="bounce", decide="coin", tone_fun="jelly", love="heart", travel="flight", tone_encouraging="rise", remedy="diya", lucky="fan", cta="stack",
          money="coin", health="rise")
TX = dict(hook="rise", meters="slam", tone_happy="bounce", days="rise", tone_serious="slam", work="slam", friends="rise", family="rise", tone_sad="drift",
          kids="bounce", decide="type", tone_fun="bounce", love="glow", travel="rise", tone_encouraging="glow", remedy="type", lucky="rise", cta="slam", money="slam", health="glow")
# rough constellation lines (0..1 of the frame), drawn faintly behind the card
CONST = dict(libra=[[[.12, .30], [.42, .10], [.86, .26], [.66, .52], [.30, .48], [.12, .30]], [[.66, .52], [.78, .86]], [[.30, .48], [.18, .84]]],
             aries=[[[.10, .70], [.40, .40], [.62, .30], [.90, .36]]], taurus=[[[.08, .12], [.36, .40], [.50, .52], [.92, .20]], [[.50, .52], [.56, .88]]],
             gemini=[[[.20, .08], [.26, .90]], [[.70, .10], [.76, .88]], [[.20, .08], [.70, .10]]], cancer=[[[.50, .10], [.48, .50], [.14, .86]], [[.48, .50], [.86, .80]]],
             leo=[[[.80, .12], [.62, .10], [.56, .30], [.70, .44], [.40, .62], [.14, .86]], [[.40, .62], [.46, .88]]], virgo=[[[.10, .10], [.30, .34], [.50, .44], [.70, .70], [.90, .90]], [[.50, .44], [.30, .80]]],
             scorpio=[[[.10, .10], [.30, .30], [.46, .52], [.56, .76], [.76, .88], [.90, .74]]], sagittarius=[[[.16, .84], [.86, .12]], [[.60, .18], [.86, .12], [.80, .40]]],
             capricorn=[[[.10, .20], [.50, .86], [.90, .24], [.10, .20]]], aquarius=[[[.08, .40], [.26, .30], [.44, .40], [.62, .30], [.80, .40], [.94, .30]], [[.08, .66], [.26, .56], [.44, .66], [.62, .56], [.80, .66]]],
             pisces=[[[.14, .14], [.40, .50], [.86, .86]], [[.40, .50], [.90, .30]]])

SGN = TL["sign"].lower()
def card_frames(key):
    """728x900 frames for the card window. The crop is centred on the faces found in the clip; if the faces
    are wider than the window the clip is flagged 'cut' (reject it at review)."""
    src = sorted(glob.glob(f"{STOCK}/signs/{SGN}/hs_stock_{key}_*.mp4")); out = f"{STOCK}/frames3/{SGN}/{key}"
    if not src and os.environ.get("HS_ALLOW_SHARED") == "1": src = sorted(glob.glob(f"{STOCK}/hs_stock_{key}_*.mp4")); out = f"{STOCK}/frames3/{key}"
    if not src: raise SystemExit(f"missing picture for {SGN}/{key}: every sign needs its own (put it in {STOCK}/signs/{SGN}/)")
    if not os.path.exists(f"{out}/meta.json"):
        import cv2
        os.makedirs(out, exist_ok=True)
        pj = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", src[0]], capture_output=True, text=True).stdout)
        w, h = pj["streams"][0]["width"], pj["streams"][0]["height"]; dur = float(pj["format"]["duration"]); ss = min(max(dur * 0.12, 0), max(dur - 6, 0))
        cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml"); cap2 = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml"); cap = cv2.VideoCapture(src[0]); xs, ys = [], []
        for k in range(8):
            cap.set(cv2.CAP_PROP_POS_MSEC, (ss + k * 1.2) * 1000); ok, fr = cap.read()
            if not ok: continue
            g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY); m = int(min(w, h) * 0.07)
            gf = cv2.flip(g, 1); W0 = g.shape[1]
            hits = [tuple(r) for c in (cas, cap2) for r in c.detectMultiScale(g, 1.1, 6, minSize=(m, m))] + [(W0 - x - fw, y, fw, fh) for (x, y, fw, fh) in cap2.detectMultiScale(gf, 1.1, 6, minSize=(m, m))]
            for (x, y, fw, fh) in hits:
                xs += [x - fw * 0.15, x + fw * 1.15]; ys += [y - fh * 0.8, y + fh * 1.3]
        A = CW / CH
        cx, cy = ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2) if xs else (w / 2, h * 0.42)
        if w / h > A: ch = h; cw = int(h * A) // 2 * 2; x = int(min(max(cx - cw / 2, 0), w - cw)); y = 0
        else: cw = w; ch = int(w / A) // 2 * 2; y = int(min(max(cy - ch * 0.42, 0), h - ch)); x = 0
        cut = bool(xs) and bool(min(xs) < x - 4 or max(xs) > x + cw + 4 or min(ys) < y - 4 or max(ys) > y + ch + 4)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{ss:.2f}", "-i", src[0], "-t", "10", "-vf", f"fps=30,crop={cw}:{ch}:{x}:{y},scale={CW}:{CH},{GRADE}", "-q:v", "3", f"{out}/c_%04d.jpg"], check=True)
        json.dump(dict(n=len(glob.glob(f"{out}/c_*.jpg")), faces=len(xs) // 2, cut=cut), open(f"{out}/meta.json", "w"))
    m = json.load(open(f"{out}/meta.json"))
    if m.get("cut"): print("WARN face wider than card window:", key)
    return dict(dir=out, n=m["n"])

sign = TL["sign"].lower(); CLIPS = {}
for sh in TL["shots"]:
    k = sh["scene"].replace("tone_", "")
    if k in ("meters", "days", "lucky", "cta"): continue
    if k not in CLIPS: CLIPS[k] = card_frames(k)
    if CLIPS[k]: sh["clip"] = CLIPS[k]
card = {**CARD, "hook": (SIGN_CARD[sign][0], TL["ui"]["name"] if TL.get("ui") else TL["sign"].upper())}
stack = [CLIPS[k] for k in ("love", "travel", "hook") if CLIPS.get(k)]
TL.update(card=card, tr=TR, tx=TX, glyph=GLYPH[sign] + "︎", const=CONST.get(sign, CONST["libra"]), stack=[f"file://{c['dir']}/c_0030.jpg" for c in stack],
          swatch={"PINK": "#ff9ec4", "WHITE": "#ffffff", "RED": "#d7263d", "YELLOW": "#ffd23f", "GREEN": "#2a9a57", "BLUE": "#2a76e0", "GOLD": "#d4af37", "ORANGE": "#ff8a3d",
                  "PURPLE": "#8a5cd6", "SILVER": "#c0c0c8", "BLACK": "#111111", "CREAM": "#f3e5c0", "BROWN": "#7a4a22", "SKY BLUE": "#7ec8f0", "MAROON": "#7a1f2b"})

# ---------- cover (first frame) ----------
def cue(s, k): return next((c for c in s["cues"] if c["k"] == k), None)
MC = dict(good="#e2b84a", care="#f0a020", stop="#d22f37")
msh = next((s for s in TL["shots"] if s["id"] == "meters"), None); dsh = next((s for s in TL["shots"] if s["id"] == "days"), None)
ar = [(s, cue(s, "S")) for s in TL["shots"] if s.get("area") is not None and cue(s, "S")]
pick = ([x for x in ar if x[1]["b"] == "good"] + [x for x in ar if x[1]["b"] != "good"])[:3]
hook_l = [c for c in TL["shots"][0]["cues"] if c["k"] == "L"]
# cover "H" (owner's choice, 22 Nov 2026): WEEKLY HOROSCOPE + dates, the sign's gold zodiac medallion, English sign + rashi name equally big.
EMB = sorted(glob.glob(f"{STOCK}/signs/{SGN}/emblem.*"))
rname = (TL["ui"]["sub"].split(" ·")[0] if TL.get("ui") else TL.get("rashi", "")).upper()
d0 = TL["date_label"].replace("WEEKLY · ", "").replace("WEEKLY", "").strip()
emb = (f'<img src="file://{EMB[0]}" style="position:absolute;left:170px;top:620px;width:740px;height:700px;object-fit:contain;mix-blend-mode:lighten;'
       f'-webkit-mask-image:radial-gradient(ellipse 48% 48% at 50% 50%,#000 75%,transparent 100%)">' if EMB else
       f'<div style="position:absolute;left:290px;top:670px;width:500px;height:500px;border-radius:50%;border:4px solid #d8b65c;color:#f0cf74;font:330px/500px \'DejaVu Sans\';text-align:center">{TL["glyph"]}</div>')
nm = TL["ui"]["name"] if TL.get("ui") else TL["sign"].upper()
cov = (f'<div id="cover" style="background:#040404">{emb}'
       f'<div class="cv" style="top:285px;font-size:150px;line-height:.9;letter-spacing:6px;color:#f3e3b8">WEEKLY</div>'
       f'<div class="cv" style="top:413px;font-size:150px;line-height:.9;letter-spacing:6px;color:#f3e3b8">HOROSCOPE</div>'
       f'<div class="cv" style="top:560px;font:600 44px Cinzel;letter-spacing:10px;color:#e2c06a">{d0}</div>'
       f'<div class="cv fitw" style="top:1335px;font-size:170px;line-height:.9;letter-spacing:4px">{nm}</div>'
       f'<div class="cv fitw" style="top:1495px;font-size:170px;line-height:.9;letter-spacing:4px;color:#e2c06a">{rname}</div>'
       f'<div class="cv" style="top:1820px;font:700 34px Cinzel;letter-spacing:8px;color:#d8b65c">TAROT TALK BY SAKSHI</div></div>')
FONTS = "".join(f'@font-face{{font-family:"{n}";font-weight:{w};src:url("file://{FD}/{d}/files/{d}-latin-{w}-normal.woff2")}}'
                for n, d, w in [("Bebas", "bebas-neue", 400), ("Cinzel", "cinzel", 600), ("Cinzel", "cinzel", 700), ("Inter", "inter", 500)])
CSS = FONTS + """html,body{margin:0;background:#000}#st{position:relative;width:1080px;height:1920px;overflow:hidden;background:#000;font-family:Bebas}
canvas.full{position:absolute;left:0;top:0;width:1080px;height:1920px}.ab{position:absolute}
#grain{position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;opacity:.13}
#cw{position:absolute;left:140px;top:230px;width:800px;height:1160px;perspective:2600px}
#card{position:absolute;inset:0;transform-style:preserve-3d}
.face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:28px;overflow:hidden}
.front{background:#0b0906}.frame{position:absolute;inset:0;border:3px solid #d8b65c;border-radius:28px;box-shadow:inset 0 0 0 14px #0b0906,inset 0 0 0 16px #8a6f2e;pointer-events:none}
.back{transform:rotateY(180deg);background:repeating-linear-gradient(45deg,#14100a 0 18px,#1d160c 18px 36px);border:3px solid #d8b65c;box-sizing:border-box;display:flex;align-items:center;justify-content:center}
.gl{border-radius:50%;border:4px solid #d8b65c;color:#d8b65c;font-family:'DejaVu Sans';text-align:center}
#cin{position:absolute;left:36px;top:110px;width:728px;height:900px;overflow:hidden;border-radius:6px;background:#0b0906;-webkit-mask-repeat:no-repeat}
#clip{position:absolute;inset:0;width:728px;height:900px;object-fit:cover}
#num{position:absolute;left:0;width:800px;top:22px;text-align:center;font:700 64px Cinzel;color:#d8b65c}
#name{position:absolute;left:30px;width:740px;top:1028px;height:110px;text-align:center;font:700 66px/110px Cinzel;letter-spacing:5px;-webkit-background-clip:text;background-clip:text;color:transparent;white-space:nowrap}
.door{position:absolute;top:0;width:364px;height:900px;background:linear-gradient(90deg,#24190a,#6e5222 50%,#24190a);box-shadow:inset 0 0 0 3px #d8b65c}
#dL{left:0;transform-origin:0 50%}#dR{left:364px;transform-origin:100% 50%}
#mtr{position:absolute;inset:0}.mr{position:absolute;left:50px;width:628px;height:170px}
.mr b{position:absolute;left:0;top:10px;font:400 118px/1 Bebas;color:#fff;letter-spacing:2px}.mr span{position:absolute;right:0;top:40px;display:flex;gap:16px}
.mr i{width:46px;height:46px;border-radius:50%;border:4px solid #d8b65c;box-sizing:border-box}
#ghost{position:absolute;left:140px;top:230px;width:800px;height:1160px;border:4px solid #d8b65c;border-radius:28px;box-sizing:border-box;opacity:0;background:rgba(216,182,92,.08)}
#hd{position:absolute;left:0;width:1080px;top:118px;text-align:center;font:600 50px Cinzel;letter-spacing:12px;color:#e2c06a;white-space:nowrap}
#tz{position:absolute;left:70px;width:940px;top:1432px;height:470px;display:flex;flex-direction:column;gap:6px}
.tl{position:relative;width:fit-content;font-family:Bebas;font-weight:400;white-space:nowrap;line-height:.95;color:#fff;padding:0 12px}
.tl .w{display:inline-block;position:relative}.bar{position:absolute;left:0;top:6%;height:86%;width:100%;transform-origin:left;z-index:0}
.tl .tx{position:relative;z-index:1}
#meas{position:absolute;left:-5000px;top:0;white-space:nowrap;font-family:Bebas;padding:0 12px}
.mc,.lc{position:absolute;perspective:1600px;opacity:0}.mci{position:absolute;inset:0;transform-style:preserve-3d}
.mc .face,.lc .face{border-radius:18px}.mf{background:#0b0906;border:3px solid #d8b65c;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center}
.mf u{position:absolute;left:0;top:0;width:100%;height:26px}.mf b{font:400 110px/1 Bebas;color:#fff;margin-top:20px}.mf i{font:700 30px Cinzel;letter-spacing:4px;font-style:normal;margin-top:6px}
.lc .mf b{font-size:120px;white-space:nowrap}.lc .mf i{font-size:30px;color:#e2c06a}.sw{width:150px;height:150px;border-radius:50%;border:8px solid #d8b65c;box-sizing:border-box;margin-bottom:16px}
.sk{position:absolute;left:330px;top:420px;width:420px;height:560px;border-radius:20px;border:4px solid #d8b65c;box-sizing:border-box;object-fit:cover;opacity:0;box-shadow:0 20px 50px rgba(0,0,0,.6)}
#prog{position:absolute;left:0;top:1912px;height:8px;background:#d8b65c}
#cover{position:absolute;inset:0;display:block;color:#fff}#cover .cv{position:absolute;left:0;width:1080px;text-align:center;white-space:nowrap;font-family:Bebas}
#cover .cdate{margin-top:120px;padding:10px 40px;border:3px solid #d8b65c;border-radius:60px;font:600 46px Cinzel;letter-spacing:6px;color:#e2c06a}
#cover .cname{margin-top:20px;font:400 330px/0.9 Bebas;letter-spacing:8px}#cover .csub{font:600 44px Cinzel;letter-spacing:10px;color:#e2c06a}
#cover .chook{margin-top:22px;font:400 108px/1 Bebas}#cover .chook span{background:#e2b84a;color:#0b0906;padding:2px 18px}
#cover .chook+.chook span{background:#d22f37;color:#fff}
#cover .cscores{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:14px 40px}#cover .cs{display:flex;align-items:center;gap:20px}
#cover .cs b{font:400 80px Bebas;width:185px}#cover .cs span{display:flex;gap:10px}#cover .cs i{width:40px;height:40px;border-radius:50%;border:4px solid #d8b65c;box-sizing:border-box}#cover .cs i.on{background:#e2b84a}
#cover .cdays{margin-top:38px;display:flex;gap:10px}#cover .cd{width:132px;height:118px;border-radius:16px;font:400 72px/118px Bebas;text-align:center;box-sizing:border-box}
.cd.good{background:#e2b84a;color:#0b0906}.cd.care{border:4px solid #f0a020;color:#f0a020;line-height:110px}.cd.stop{background:#d22f37;color:#fff}
#cover .clist{margin-top:38px;width:940px;display:flex;flex-direction:column;gap:10px}#cover .ci{display:flex;justify-content:space-between;border-bottom:2px solid rgba(216,182,92,.5);padding-bottom:6px}
#cover .ci b{font:400 72px Bebas;color:#fff}#cover .ci span{font:400 72px Bebas}
#cover .cmore{margin-top:22px;font:600 38px Cinzel;letter-spacing:6px;color:#e2c06a}#cover .cbrand{position:absolute;bottom:70px;font:700 52px Cinzel;letter-spacing:8px;color:#d8b65c}"""

HTML = f"""<div id="st"><canvas id="sky" class="full" width="1080" height="1920"></canvas><canvas id="fxb" class="full" width="1080" height="1920"></canvas>
<div id="ghost"></div>
<div id="cw"><div id="card"><div class="face front"><div id="cin"><img id="clip"><canvas id="wheel" width="728" height="900" style="position:absolute;inset:0"></canvas>
<div id="mtr">{('<div class="mr"><b></b><span>' + '<i></i>' * 5 + '</span></div>') * 4}</div><div class="door" id="dL"></div><div class="door" id="dR"></div></div>
<div class="frame"></div><div id="num"></div><div id="name"></div></div>
<div class="face back"><div class="gl" style="width:320px;height:320px;font-size:210px;line-height:320px">{TL['glyph']}</div></div></div></div>
{('<div class="mc"><div class="mci"><div class="face mf"><u></u><b></b><i></i></div><div class="face back"><div class="gl" style="width:110px;height:110px;font-size:70px;line-height:110px">' + TL['glyph'] + '</div></div></div></div>') * 7}
{('<div class="lc"><div class="mci"><div class="face mf"><div class="sw"></div><b></b><i></i></div><div class="face back"><div class="gl" style="width:160px;height:160px;font-size:100px;line-height:160px">' + TL['glyph'] + '</div></div></div></div>') * 3}
{''.join(f'<img class="sk" src="{u}">' for u in TL['stack'])}
<canvas id="fxf" class="full" width="1080" height="1920"></canvas>
<div id="hd"></div><div id="tz"></div><div id="meas"></div><div id="grain"></div><div id="prog"></div>{cov}</div>"""

JS = r"""
const TL=__TL__, DUR=TL.total, $=id=>document.getElementById(id), Q=s=>[...document.querySelectorAll(s)];
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)), out=x=>1-Math.pow(1-cl(x,0,1),3), io=x=>{x=cl(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2},
 back=x=>{x=cl(x,0,1);const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}, bnc=x=>{x=cl(x,0,1);const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375};
let sd=11; const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
const STARS=[...Array(380)].map(()=>({x:rn()*1080,y:rn()*1920,r:rn()*2.1+.4,p:rn()*6.3,f:.8+rn()*2}));
const CONF=[...Array(70)].map(()=>({a:rn()*6.3,v:500+rn()*900,s:8+rn()*14,r:rn()*6.3,c:['#e2b84a','#fff3c4','#f0a020','#ffffff'][Math.floor(rn()*4)]}));
const RAIN=[...Array(140)].map(()=>({x:rn()*1200,o:rn()*2100,v:1300+rn()*700}));
const SPARK=[...Array(40)].map(()=>({x:100+rn()*880,y:180+rn()*1260,p:rn()*6.3}));
const SKY=$('sky').getContext('2d'), FB=$('fxb').getContext('2d'), FF=$('fxf').getContext('2d'), WH=$('wheel').getContext('2d');
const gc=document.createElement('canvas'); gc.width=gc.height=256; {const g=gc.getContext('2d'), d=g.createImageData(256,256); for(let i=0;i<d.data.length;i+=4){const v=Math.floor(rn()*256); d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=255;} g.putImageData(d,0,0);} $('grain').style.backgroundImage=`url(${gc.toDataURL()})`;
const HEART="data:image/svg+xml;utf8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 90 C20 68 3 50 3 30 C3 15 15 5 28 5 C38 5 46 11 50 19 C54 11 62 5 72 5 C85 5 97 15 97 30 C97 50 80 68 50 90Z" fill="black"/></svg>');
function sky(t){SKY.fillStyle='#020203';SKY.fillRect(0,0,1080,1920);
  const g=SKY.createRadialGradient(540,800,0,540,800,1100); g.addColorStop(0,'rgba(60,44,16,.35)'); g.addColorStop(1,'rgba(0,0,0,0)'); SKY.fillStyle=g; SKY.fillRect(0,0,1080,1920);
  STARS.forEach(s=>{const a=.25+.75*Math.pow(.5+.5*Math.sin(t*s.f+s.p),3); SKY.fillStyle=`rgba(255,244,220,${a.toFixed(3)})`; SKY.beginPath(); SKY.arc(s.x,s.y,s.r,0,6.3); SKY.fill();});
  const p=cl(t/3,0,1); SKY.strokeStyle='rgba(216,182,92,.45)'; SKY.lineWidth=2.5;
  TL.const.forEach(pl=>{const n=pl.length-1, upto=p*n; SKY.beginPath(); SKY.moveTo(pl[0][0]*1080,pl[0][1]*1920);
    for(let i=1;i<=n;i++){if(upto>=i)SKY.lineTo(pl[i][0]*1080,pl[i][1]*1920); else if(upto>i-1){const f=upto-i+1;SKY.lineTo((pl[i-1][0]+(pl[i][0]-pl[i-1][0])*f)*1080,(pl[i-1][1]+(pl[i][1]-pl[i-1][1])*f)*1920);break}} SKY.stroke();
    pl.forEach((q,i)=>{if(upto>=i-.01){SKY.fillStyle='#f6dc94';SKY.beginPath();SKY.arc(q[0]*1080,q[1]*1920,6,0,6.3);SKY.fill()}});});}
function wheel(t){WH.clearRect(0,0,728,900); WH.save(); WH.translate(364,450); WH.rotate(t*.12); WH.strokeStyle='rgba(216,182,92,.28)'; WH.lineWidth=4;
  [330,250,120].forEach(r=>{WH.beginPath();WH.arc(0,0,r,0,6.3);WH.stroke()}); for(let i=0;i<8;i++){WH.rotate(Math.PI/4);WH.beginPath();WH.moveTo(0,0);WH.lineTo(0,-330);WH.stroke();WH.beginPath();WH.arc(0,-290,10,0,6.3);WH.fillStyle='rgba(216,182,92,.4)';WH.fill()} WH.restore();}
function rays(t,a,cx,cy){if(a<=0)return; FB.save(); FB.translate(cx,cy); FB.rotate(t*.25); for(let i=0;i<18;i++){FB.rotate(Math.PI*2/18); const g=FB.createLinearGradient(0,0,0,-1400); g.addColorStop(0,`rgba(255,220,140,${(.32*a).toFixed(3)})`); g.addColorStop(1,'rgba(255,220,140,0)');
  FB.fillStyle=g; FB.beginPath(); FB.moveTo(0,0); FB.lineTo(-70,-1400); FB.lineTo(70,-1400); FB.closePath(); FB.fill();} FB.restore();}
function textMeasure(txt,px){const m=$('meas'); m.style.fontSize=px+'px'; m.textContent=txt; return m.offsetWidth;}
function wordStyle(st,t,at,j){const wat=at+j*0.07;
  if(t<wat)return 'opacity:0';
  if(st=='slam'){const p=out((t-wat)/0.2);return `transform:scale(${(2.1-1.1*p).toFixed(3)});opacity:${cl(p*2,0,1)}`}
  if(st=='bounce'){return `transform:translateY(${(-(1-bnc((t-wat)/0.55))*170).toFixed(1)}px)`}
  if(st=='drift'){const p=out((t-wat)/0.8);return `opacity:${p.toFixed(3)};transform:translateY(${((1-p)*-36).toFixed(1)}px);filter:blur(${((1-p)*6).toFixed(1)}px)`}
  if(st=='glow'){const p=out((t-wat)/0.6);return `opacity:${p.toFixed(3)};transform:scale(${(1.12-.12*p).toFixed(3)});text-shadow:0 0 ${(10+(1-p)*40).toFixed(0)}px rgba(240,200,110,.85)`}
  const p=out((t-wat)/0.3); return `transform:translateY(${((1-p)*70).toFixed(1)}px) skewX(${((1-p)*-10).toFixed(1)}deg);filter:blur(${((1-p)*8).toFixed(1)}px)`;}
const BARC={good:['#e2b84a','#0b0906'],care:['#f0a020','#0b0906'],stop:['#d22f37','#ffffff'],gold:['#e2b84a','#0b0906']};
function textZone(s,t){const st=TL.tx[s.scene]||'rise'; let L=[];
  if(s.scene=='meters') L=s.cues.filter(c=>c.k=='M').map(c=>({a:c.a+'  '+c.b+'/5',at:c.at,bar:'gold',kw:1}));
  else if(s.scene=='lucky') L=[];
  else {const cs=s.cues.filter(c=>(c.k=='L'||c.k=='S')&&!(s.scene=='days'&&c.k=='T')); let li=0; L=cs.map(c=>{const o={a:c.a,at:c.at}; if(c.k=='S'){o.bar=c.b;o.kw=0} else {if(/CAREFUL|AVOID|STOP|DON'T|^NO /.test(c.a)&&li>0){o.bar='stop';o.kw=1} else if(li==1){o.bar='gold';o.kw=1} li++} return o;});}
  L=L.filter(o=>t>=o.at-0.01).slice(-3); const n=L.length;
  $('tz').innerHTML=L.map((o,i)=>{let px=(i==0&&n<3)?178:(n==3?120:140); const w=textMeasure(o.a,px); if(w>940)px=Math.floor(px*940/w);
    const words=o.a.split(' '), bc=BARC[o.bar]||null, bp=bc?out((t-o.at-0.18)/0.3):0, dark=bp>0.5;
    const shake=(o.bar=='stop'&&t-o.at<0.6)?Math.sin((t-o.at)*70)*8*(1-(t-o.at)/0.6):0;
    if(st=='type'){const chars=[...o.a], k=Math.floor((t-o.at)/0.035)+1, vis=chars.slice(0,k).join(''); const cur=(k<chars.length||Math.sin(t*12)>0)?'<span style="color:#e2b84a">|</span>':'';
      return `<div class="tl" style="font-size:${px}px">${bc?`<div class="bar" style="background:${bc[0]};transform:scaleX(${bp.toFixed(3)})"></div>`:''}<span class="tx" style="color:${dark?bc[1]:'#fff'}">${vis}${k<chars.length?cur:''}</span></div>`;}
    const html=words.map((wd,j)=>{const key=bc&&o.kw&&j==words.length-1; const col=key?(bp>.5?bc[1]:'#fff'):((bc&&!o.kw&&dark)?bc[1]:'#fff');
      return `<span class="w" style="${wordStyle(st,t,o.at,j)}">${key?`<span class="bar" style="background:${bc[0]};transform:scaleX(${bp.toFixed(3)});left:-10px;width:calc(100% + 20px)"></span>`:''}<span class="tx" style="color:${col}">${wd}</span></span>`}).join(' ');
    return `<div class="tl" style="font-size:${px}px;transform:translateX(${shake.toFixed(1)}px)">${bc&&!o.kw?`<div class="bar" style="background:${bc[0]};transform:scaleX(${bp.toFixed(3)})"></div>`:''}<span class="tx">${html}</span></div>`;}).join('');}
const MC=Q('.mc'), LC=Q('.lc'), SK=Q('.sk'), MR=Q('.mr');
const DCOL={good:['#e2b84a','GOOD'],care:['#f0a020','CAREFUL'],stop:['#d22f37','STOP']};
let RID=0;
window.render=async function(t){const rid=++RID; try{await document.fonts.ready}catch(e){}
  let si=TL.shots.findIndex(s=>t<s.end); if(si<0)si=TL.shots.length-1; const s=TL.shots[si], lt=t-s.start, sc=s.scene;
  const clip=$('clip'); if(s.clip){clip.style.display='block'; clip.src='file://'+s.clip.dir+'/c_'+String(1+Math.floor(lt*30)%s.clip.n).padStart(4,'0')+'.jpg'; try{await clip.decode()}catch(e){}} else clip.style.display='none';
  if(rid!==RID)return;
  sky(t); FB.clearRect(0,0,1080,1920); FF.clearRect(0,0,1080,1920);
  $('grain').style.backgroundPosition=`${(t*977)%256}px ${(t*613)%256}px`; $('prog').style.width=(1080*t/DUR).toFixed(1)+'px';
  $('cover').style.opacity=t<0.35?1:1-io((t-0.35)/0.25); $('cover').style.display=t>0.62?'none':'block'; if(t<0.62)Q('#cover .fitw').forEach(e=>{e.style.fontSize='170px'; const w=e.scrollWidth; if(w>1000)e.style.fontSize=Math.floor(170*1000/w)+'px';});
  const big=!['days','lucky','cta'].includes(sc); $('cw').style.display=big?'block':'none';
  // header
  const T=s.cues.find(c=>c.k=='T'); let hd=''; if(sc=='hook')hd=TL.date_label; else if(T)hd=T.a; else if(sc=='meters')(s.cues.find(c=>c.k=='L')||{a:''}).a&&(hd=s.cues.find(c=>c.k=='L').a); else if(sc=='lucky')hd=(TL.ui&&TL.ui.lucky)||'LUCKY'; else if(sc=='cta')hd='TAROT TALK BY SAKSHI';
  const he=$('hd'); he.textContent=hd; he.style.opacity=out((lt-0.1)/0.4); he.style.letterSpacing=(26-14*out((lt-0.1)/0.6)).toFixed(1)+'px';
  // card
  const cd=TL.card[sc]||['','']; $('num').textContent=cd[0]; $('name').textContent=cd[1]; const sh=((t*.45)%1.6)*100-30;
  $('name').style.backgroundImage=`linear-gradient(100deg,#a8873a ${sh-25}%,#fff3c4 ${sh}%,#a8873a ${sh+25}%)`;
  const nmE=$('name'); nmE.style.fontSize='66px'; const nmW=nmE.scrollWidth; nmE.style.fontSize=(nmW>700?Math.floor(66*700/nmW):66)+'px';
  const tr=TL.tr[sc]; let tf='', op=1, cfil='none', wfil='none', mask='none', msize='', shake=0, door=0;
  $('ghost').style.opacity=0; $('wheel').style.display=sc=='meters'?'block':'none'; $('mtr').style.display=sc=='meters'?'block':'none';
  switch(tr){
    case 'flip': tf=`translateY(${((1-out(lt/0.5))*600).toFixed(1)}px) rotateY(${((1-io((lt-0.2)/0.8))*180).toFixed(2)}deg)`; break;
    case 'wheel': tf=`rotate(${((1-out(lt/0.8))*-220).toFixed(2)}deg) scale(${(0.3+0.7*out(lt/0.8)).toFixed(3)})`; op=cl(lt/0.15,0,1); break;
    case 'burst': tf=`scale(${back(lt/0.55).toFixed(3)})`; op=cl(lt/0.08,0,1); rays(t,1-cl((lt-0.4)/1.2,0,.6),540,810); break;
    case 'drop': {const q=cl(lt/0.42,0,1); tf=`translateY(${(-(1-q*q)*1500).toFixed(1)}px)`; if(lt>0.42&&lt<0.8)shake=(1-(lt-0.42)/0.38)*24; cfil='grayscale(.55) contrast(1.12)'; break;}
    case 'whip': {const q=out(lt/0.38); tf=`translateX(${((1-q)*1300).toFixed(1)}px) skewX(${((1-q)*-16).toFixed(2)}deg)`; wfil=`blur(${((1-q)*20).toFixed(1)}px)`; break;}
    case 'meet': {const q=out(lt/0.65); tf=`translateX(${((1-q)*-800).toFixed(1)}px) rotate(${((1-q)*-12).toFixed(2)}deg)`; const g=$('ghost'); g.style.opacity=(q<1?.9:0)*(1-q*q); g.style.transform=`translateX(${((1-q)*800).toFixed(1)}px) rotate(${((1-q)*12).toFixed(2)}deg)`; break;}
    case 'doors': op=cl(lt/0.15,0,1); door=1-io((lt-0.25)/0.85); break;
    case 'sink': {const q=out(lt/1.1); op=out(lt/0.9); tf=`translateY(${((1-q)*-90).toFixed(1)}px) rotate(${((1-q)*4).toFixed(2)}deg)`; cfil='saturate(.55) brightness(.9)';
      FF.strokeStyle='rgba(190,210,255,.22)'; FF.lineWidth=2; RAIN.forEach(r=>{const y=((r.o+t*r.v)%2100)-100, x=r.x-y*0.12; FF.beginPath(); FF.moveTo(x,y); FF.lineTo(x-6,y+46); FF.stroke();}); break;}
    case 'bounce': {tf=`translateY(${(-(1-bnc(lt/0.9))*1500).toFixed(1)}px)`; const b0=0.33, dt=lt-b0; if(dt>0&&dt<1.6)CONF.forEach(c=>{const x=540+Math.cos(c.a)*c.v*dt, y=1390+Math.sin(c.a)*c.v*dt*0.8-700*dt+900*dt*dt;
      FF.save(); FF.translate(x,y); FF.rotate(c.r+dt*8); FF.globalAlpha=cl(1.6-dt,0,1); FF.fillStyle=c.c; FF.beginPath(); for(let k=0;k<5;k++){const a=k*1.2566, b=a+.628; FF.lineTo(Math.cos(a)*c.s,Math.sin(a)*c.s); FF.lineTo(Math.cos(b)*c.s*.45,Math.sin(b)*c.s*.45);} FF.fill(); FF.restore();}); break;}
    case 'coin': {const q=out(lt/1.15); tf=`rotateY(${((1-q)*1260).toFixed(1)}deg) scale(${(0.6+0.4*q).toFixed(3)})`; break;}
    case 'jelly': {const a=Math.exp(-3.2*lt)*0.26*Math.sin(lt*17), b=back(lt/0.3); tf=`scale(${(b*(1+a)).toFixed(3)},${(b*(1-a)).toFixed(3)})`; op=cl(lt/0.06,0,1); break;}
    case 'heart': {const q=io(lt/0.95); if(q<1){mask=`url("${HEART}")`; msize=(q*430).toFixed(1)+'%';} op=cl(lt/0.1,0,1);
      SPARK.forEach(p=>{const a=Math.pow(.5+.5*Math.sin(t*3+p.p),4)*cl(lt/0.5,0,1); FF.fillStyle=`rgba(255,226,150,${a.toFixed(3)})`; FF.beginPath(); FF.arc(p.x,p.y,3.5,0,6.3); FF.fill(); FF.fillRect(p.x-10*a,p.y-1,20*a,2); FF.fillRect(p.x-1,p.y-10*a,2,20*a);}); break;}
    case 'flight': {const q=out(lt/0.85), P=(u)=>{const a=[-1000,900],b=[-200,-700],c=[0,0];return [(1-u)*(1-u)*a[0]+2*(1-u)*u*b[0]+u*u*c[0],(1-u)*(1-u)*a[1]+2*(1-u)*u*b[1]+u*u*c[1]]}; const p=P(q);
      tf=`translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px) rotate(${((1-q)*-28).toFixed(2)}deg) scale(${(0.45+0.55*q).toFixed(3)})`;
      const fp=cl(lt/1.3,0,1), A=[40,1700],B=[300,-150],C=[1060,330], pt=u=>[(1-u)*(1-u)*A[0]+2*(1-u)*u*B[0]+u*u*C[0],(1-u)*(1-u)*A[1]+2*(1-u)*u*B[1]+u*u*C[1]];
      FB.strokeStyle=`rgba(226,184,74,${(.8*(1-cl((lt-1.6)/1,0,1))).toFixed(3)})`; FB.lineWidth=5; FB.setLineDash([22,16]); FB.beginPath(); for(let u=0;u<=fp;u+=0.01){const q2=pt(u); u==0?FB.moveTo(...q2):FB.lineTo(...q2)} FB.stroke(); FB.setLineDash([]);
      if(fp<1){const h=pt(fp), h2=pt(Math.min(1,fp+0.01)); FF.save(); FF.translate(...h); FF.rotate(Math.atan2(h2[1]-h[1],h2[0]-h[0])); FF.fillStyle='#f6dc94'; FF.font="110px 'DejaVu Sans'"; FF.textAlign='center'; FF.textBaseline='middle'; FF.fillText('✈',0,0); FF.restore();} break;}
    case 'rise': {const q=out(lt/0.8); tf=`translateY(${((1-q)*1150).toFixed(1)}px)`; rays(t,cl(lt/0.6,0,1)*.8,540,820); break;}
    case 'diya': {const r=io(lt/1.05)*1200; if(lt<1.05){mask=`radial-gradient(circle at 50% 88%, #000 ${r.toFixed(0)}px, transparent ${(r+140).toFixed(0)}px)`; msize='100% 100%';}
      const g=FF.createRadialGradient(540,1240,0,540,1240,520), a=.28+.08*Math.sin(t*9)+.05*Math.sin(t*23); g.addColorStop(0,`rgba(255,176,70,${a.toFixed(3)})`); g.addColorStop(1,'rgba(255,176,70,0)'); FF.fillStyle=g; FF.fillRect(0,600,1080,1300); break;}
  }
  if(big){const fl=0; $('cw').style.transform=`translate(${(shake?Math.sin(t*90)*shake:0).toFixed(1)}px,${(fl+(shake?Math.cos(t*77)*shake:0)).toFixed(1)}px)`; $('cw').style.filter=wfil;
    $('card').style.transform=tf+' translateZ(0)'; $('cw').style.opacity=op; clip.style.filter=cfil; clip.style.transform=`scale(${(1.07-0.06*io(lt/(s.end-s.start))).toFixed(4)})`;
    const ci=$('cin'); ci.style.webkitMaskImage=mask; ci.style.webkitMaskSize=msize; ci.style.webkitMaskPosition=tr=='heart'?'50% 46%':'0 0';
    $('dL').style.transform=`scaleX(${door.toFixed(3)})`; $('dR').style.transform=`scaleX(${door.toFixed(3)})`;
    if(sc=='meters'){wheel(t); s.cues.filter(c=>c.k=='M').forEach((c,i)=>{const r=MR[i]; if(!r)return; r.style.top=(70+i*200)+'px'; r.querySelector('b').textContent=c.a; const pp=out((t-c.at)/0.3);
      r.style.opacity=pp; r.style.transform=`translateX(${((1-pp)*-60).toFixed(1)}px)`; [...r.querySelectorAll('i')].forEach((e,j)=>{const on=j<c.b&&t>=c.at+0.2+j*0.09; e.style.background=on?'#e2b84a':'transparent'; e.style.transform=`scale(${on?back((t-c.at-0.2-j*0.09)/0.2).toFixed(3):1})`;});});}}
  // days: 7 mini cards dealt, then flipped
  MC.forEach(e=>e.style.opacity=0); if(sc=='days'){const D=s.cues.find(c=>c.k=='D'); D.a.forEach(([dn,m],i)=>{const e=MC[i], row=i<4?0:1, col=row?i-4:i, n=row?3:4, w=220, h=320, gap=26, x0=(1080-(n*w+(n-1)*gap))/2, x=x0+col*(w+gap), y=360+row*(h+40);
    const dt=lt-0.15-i*0.12, q=out(dt/0.45); e.style.left=x+'px'; e.style.top=y+'px'; e.style.width=w+'px'; e.style.height=h+'px'; e.style.opacity=dt>0?1:0;
    e.style.transform=`translate(${((1-q)*(540-x-w/2)).toFixed(1)}px,${((1-q)*(1800-y)).toFixed(1)}px) rotate(${((1-q)*(i%2?24:-24)).toFixed(1)}deg)`;
    const f=io((lt-1.0-i*0.12)/0.4); e.querySelector('.mci').style.transform=`rotateY(${(180-180*f).toFixed(1)}deg)`;
    const c=DCOL[m]; e.querySelector('u').style.background=c[0]; e.querySelector('b').textContent=dn; const it=e.querySelector('i'); it.textContent=c[1]; it.style.color=c[0];});}
  // lucky: 3 cards fan, each flips on its cue
  LC.forEach(e=>e.style.opacity=0); if(sc=='lucky'){s.cues.filter(c=>c.k=='K').forEach((c,i)=>{const e=LC[i], w=310, h=620, x=[70,385,700][i], y=560+(i==1?-40:0), rot=[-8,0,8][i], q=out((lt-i*0.12)/0.5);
    e.style.left=x+'px'; e.style.top=y+'px'; e.style.width=w+'px'; e.style.height=h+'px'; e.style.opacity=lt-i*0.12>0?1:0; e.style.transform=`translateY(${((1-q)*900).toFixed(1)}px) rotate(${(rot*q).toFixed(2)}deg)`;
    const f=io((t-c.at)/0.45); e.querySelector('.mci').style.transform=`rotateY(${(180-180*f).toFixed(1)}deg)`; const b=e.querySelector('b'); b.textContent=c.b; b.style.fontSize='120px';
    const bw=textMeasure(c.b,120)-24; if(bw>270)b.style.fontSize=Math.floor(120*270/bw)+'px'; e.querySelector('i').textContent=c.a; const swc=TL.swatch[String(c.b).toUpperCase()]; const sw=e.querySelector('.sw'); sw.style.display=swc?'block':'none'; if(swc)sw.style.background=swc;});}
  // cta: cards stack into a pile
  SK.forEach((e,i)=>{if(sc!='cta'){e.style.opacity=0;return} const dt=lt-i*0.25, q=out(dt/0.4); e.style.opacity=dt>0?1:0; e.style.transform=`translateY(${((1-q)*-1400).toFixed(1)}px) rotate(${([-12,9,-3][i]*q+(1-q)*40).toFixed(1)}deg)`;});
  textZone(s,t); $('tz').style.opacity=t<0.55?0:1; $('hd').style.visibility=t<0.55?'hidden':'visible';
};
window.DUR=DUR; render(0);"""

page = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{HTML}
<script>{JS.replace('__TL__', json.dumps(TL, ensure_ascii=False))}</script></body></html>"""
open(f"{DIR}/sign.html", "w").write(page)
print("ok", TL["total"])
