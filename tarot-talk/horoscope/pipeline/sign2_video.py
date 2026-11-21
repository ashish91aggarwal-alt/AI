"""One-sign horoscope video, v2 (life areas with 3D scenes). Reads <folder>/timeline.json, writes <folder>/sign.html.
Pictures: Microsoft Fluent Emoji 3D (MIT), upscaled to 512 px, in ../assets/fe/<slug>.png.
People only fade in (no hopping/sliding/stretching of a character); objects move (files fall, phone rings, plane flies).
usage: python3 sign2_video.py <folder>"""
import json, os, sys
DIR = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
FE = os.path.abspath(f"{HERE}/../assets/fe"); FD = os.path.abspath(f"{HERE}/../node_modules/@fontsource")
TL = json.load(open(f"{DIR}/timeline.json"))
W, H, INK = 1080, 1920, "#2b2140"
GLYPH = dict(zip("aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces".split(), "♈♉♊♋♌♍♎♏♐♑♒♓"))
AREAS = ["briefcase", "handshake", "house_with_garden", "child", "balance_scale", "red_heart", "airplane"]
# scene: background (a, b), accent, items [img, x, y, size, anim, delay ('S' = at the stamp), extra]
SC = {
 "hook":   (("#3a1c71", "#d76d77"), "#ffe066", [["crystal_ball", 540, 1010, 520, "pulse", 0], ["sparkles", 300, 800, 210, "burst", 0.3], ["sparkles", 790, 1240, 230, "burst", 0.9],
            ["glowing_star", 820, 790, 150, "float", 0.5], ["glowing_star", 270, 1240, 120, "float", 0.7]]),
 "meters": (("#fff7e6", "#ffe1bd"), "#ff7a2f", []),
 "work":   (("#eaf2ff", "#c4dafc"), "#2a76e0", [["office_building", 250, 760, 360, "fade", 0, 0.55], ["man_office_worker", 520, 930, 470, "fade", 0.05],
            ["alarm_clock", 210, 1110, 190, "ring", 0.4], ["page_facing_up", 830, 1120, 200, "rain", 0.3, -10], ["file_folder", 840, 1030, 200, "rain", 0.55, 6],
            ["clipboard", 815, 940, 190, "rain", 0.8, -5], ["page_facing_up", 845, 850, 190, "rain", 1.05, 12], ["thumbs_up", 260, 760, 170, "pop", "S"]]),
 "friends":(("#eafbef", "#bfeccf"), "#1f9d6b", [["mobile_phone", 540, 800, 320, "ring", 0.1], ["people_hugging", 300, 1130, 330, "fade", 0.5],
            ["handshake", 790, 1130, 270, "pop", 0.8], ["money_with_wings", 800, 690, 210, "float", "S"], ["sparkles", 540, 800, 300, "burst", "S"]]),
 "family": (("#fff5e2", "#ffd9a6"), "#e07b00", [["house_with_garden", 540, 790, 440, "fade", 0], ["old_man", 270, 1120, 300, "fade", 0.3], ["old_woman", 810, 1120, 300, "fade", 0.45],
            ["speaking_head", 540, 1150, 220, "popout", 0.8], ["shushing_face", 540, 1150, 220, "pop", "S"]]),
 "kids":   (("#f3edff", "#d6c8ff"), "#7b4bd6", [["boy", 320, 1020, 360, "fade", 0.05], ["girl", 770, 1020, 360, "fade", 0.2],
            ["mobile_phone", 320, 720, 180, "float", 0.5], ["video_game", 770, 720, 180, "float", 0.65], ["red_heart", 545, 1190, 190, "pop", "S"]]),
 "decide": (("#fff0f0", "#ffcccc"), "#e63946", [["balance_scale", 540, 860, 450, "tilt", 0.1], ["hourglass_not_done", 210, 1160, 200, "pop", 0.5],
            ["spiral_calendar", 870, 1160, 210, "pop", "S"]]),
 "love":   (("#ffeef4", "#ffc4d8"), "#e63977", [["woman", 300, 1020, 370, "fade", 0.05], ["man", 790, 1020, 370, "fade", 0.2],
            ["red_heart", 545, 790, 250, "popout", 0.4], ["broken_heart", 545, 790, 250, "pop", "S"]]),
 "travel": (("#e4f7ff", "#b5e5ff"), "#1287c9", [["world_map", 540, 860, 600, "fade", 0, 0.9], ["airplane", 860, 640, 230, "fly", 0.3, [-200, 1080]],
            ["luggage", 290, 1170, 240, "pop", 0.7], ["bus", 790, 1170, 260, "pop", 1.0]]),
 "remedy": (("#f7f1ff", "#e0d0ff"), "#7b4bd6", [["bowl_with_spoon", 540, 900, 440, "pop", 0.2], ["sparkles", 540, 860, 330, "burst", 0.7], ["sparkles", 540, 860, 330, "burst", 2.4],
            ["folded_hands", 860, 620, 170, "float", 0.8], ["glowing_star", 220, 640, 150, "float", 1.0]]),
 "lucky":  (("#fffbe6", "#fff0b0"), "#e09400", [["four_leaf_clover", 870, 330, 150, "float", 0.1]]),
 "days":   (("#f0f7ff", "#cfe3ff"), "#2a76e0", []),
 "tone_serious":     (("#1d1b3a", "#43305f"), "#ffe066", [["face_with_monocle", 540, 880, 430, "pop", 0.05], ["exclamation_question_mark", 840, 600, 190, "float", 0.4]]),
 "tone_fun":         (("#fff1c1", "#ffb3d9"), "#ff4fa0", [["grinning_squinting_face", 540, 880, 430, "tilt", 0.05], ["face_with_tears_of_joy", 230, 620, 190, "float", 0.3],
                      ["smiling_face_with_sunglasses", 850, 620, 200, "float", 0.5]]),
 "tone_encouraging": (("#ffd194", "#ff7e5f"), "#c2410c", [["sunrise", 540, 820, 600, "fade", 0], ["flexed_biceps", 540, 1060, 300, "pop", 0.25],
                      ["rocket", 860, 560, 200, "fly", 0.4, [200, 1300]], ["hundred_points", 230, 620, 170, "pop", 0.7]]),
 "tone_happy":       (("#fff6b7", "#ff9a8b"), "#e63977", [["partying_face", 540, 880, 430, "pop", 0.05], ["party_popper", 220, 640, 220, "pop", 0.25],
                      ["confetti_ball", 860, 640, 220, "pop", 0.4], ["sparkles", 540, 880, 420, "burst", 0.2]]),
 "tone_sad":         (("#5b74b8", "#1c2a4a"), "#bcd4ff", [["cloud_with_rain", 540, 560, 320, "float", 0.1], ["face_holding_back_tears", 540, 960, 400, "fade", 0.2]]),
 "cta":    (("#fff3ea", "#ffd3bf"), "#ff5a36", [["mobile_phone_with_arrow", 540, 1120, 380, "float", 0.3], ["sparkles", 540, 1100, 360, "burst", "S2"]]),
}
GROUND = {"fade", "rain", "pop", "ring", "tilt", "popout"}
imgs, shadows = [], []
for name, (_, _, items) in SC.items():
    for k, it in enumerate(items):
        img, x, y, sz = it[:4]; iid = f"{name}_{k}"
        imgs.append(f'<img id="{iid}" class="it" src="file://{FE}/{img}.png" style="left:{x - sz / 2}px;top:{y - sz / 2}px;width:{sz}px;height:{sz}px">')
        if it[4] in GROUND and img not in ("office_building", "house_with_garden", "world_map", "money_with_wings"):
            shadows.append(f'<div id="sh_{iid}" class="sh" style="left:{x - sz * 0.38}px;top:{y + sz * 0.36}px;width:{sz * 0.76}px;height:{sz * 0.16}px"></div>')
AREA_IC = dict(zip(["work", "friends", "family", "kids", "decide", "love", "travel"], AREAS))
MC = dict(good="#1f9d6b", care="#e09400", stop="#e63946"); MI = dict(good="check_mark_button", care="warning", stop="stop_sign")
def cue(s, k): return next((c for c in s["cues"] if c["k"] == k), None)
sc_ = cue(next(s for s in TL["shots"] if s["id"] == "meters"), "M") and [c for c in next(s for s in TL["shots"] if s["id"] == "meters")["cues"] if c["k"] == "M"]
ar = [(s, cue(s, "S")) for s in TL["shots"] if s.get("area") is not None]
good = [x for x in ar if x[1]["b"] == "good"]; rest = [x for x in ar if x[1]["b"] != "good"]
WK = TL.get("period") == "weekly"; pick = (good + rest)[:3 if WK else 4]
dsh = next((s for s in TL["shots"] if s["id"] == "days"), None)
dstrip = ('<div class="cdays">' + "".join(f'<div class="cd" style="background:{MC[m]}">{n}</div>' for n, m in cue(dsh, "D")["a"]) + '</div>') if dsh else ""
hook2 = [c for c in TL["shots"][0]["cues"] if c["k"] == "L"][1]["a"]
cover = (f'<div id="cover"><div class="cdate">{TL["date_label"]}</div><div class="cgl">{GLYPH[TL["sign"].lower()]}︎</div>'
         f'<div class="cname">{TL.get("rashi", TL["sign"])} राशिफल</div><div class="chook">{hook2}</div><div class="cscores">'
         + "".join(f'<div class="cs"><img src="file://{FE}/{ic}.png"><b style="color:{MC["good"] if c["b"] >= 4 else (MC["care"] if c["b"] == 3 else MC["stop"])}">{c["b"]}/5</b></div>'
                   for c, ic in zip(sc_, ["red_heart", "money_bag", "briefcase", "fire"]))
         + '</div>' + dstrip + '<div class="clist">' + "".join(f'<div class="ci"><img src="file://{FE}/{AREA_IC[s["id"]]}.png"><span class="ct">{cue(s, "T")["a"]}</span>'
         f'<span class="cv" style="color:{MC[st["b"]]}"><img src="file://{FE}/{MI[st["b"]]}.png">{st["a"]}</span></div>' for s, st in pick)
         + '</div>' + (f'<div class="cmore">+ ' + ", ".join([cue(s, "T")["a"] for s, _ in (good + rest)[len(pick):]][:3]) + ' और भी → वीडियो में</div>')
         + '<div class="cbrand">TAROT TALK BY SAKSHI</div></div>')
STOCK = os.environ.get("HS_STOCK", os.path.abspath(f"{HERE}/../stock"))
def clip_frames(key):
    import glob, subprocess
    src = sorted(glob.glob(f"{STOCK}/hs_stock_{key}_*.mp4"))
    if not src: return None
    out = f"{STOCK}/frames/{key}"
    if not os.path.exists(f"{out}/done"):
        os.makedirs(out, exist_ok=True)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src[0], "-t", "10", "-vf", "fps=30,scale=900:960:force_original_aspect_ratio=increase,crop=900:960,eq=saturation=1.08:contrast=1.04",
                        "-q:v", "3", f"{out}/c_%04d.jpg"], check=True); open(f"{out}/done", "w").write("1")
    return dict(dir=out, n=len(glob.glob(f"{out}/c_*.jpg")))
CLIPS = {}
for sh in TL["shots"]:
    k = sh["scene"].replace("tone_", "")
    if k not in CLIPS: CLIPS[k] = clip_frames(k)
    if CLIPS[k]: sh["clip"] = CLIPS[k]
areas = "".join(f'<div class="ar"><img src="file://{FE}/{a}.png"><div class="tick">✓</div></div>' for a in AREAS)
TL.update(glyph=GLYPH[TL["sign"].lower()] + "︎", sc={k: dict(bg=v[0], ac=v[1], items=v[2]) for k, v in SC.items()},
          icons=dict(M=["red_heart", "money_bag", "briefcase", "fire"], K=["", "glowing_star", "alarm_clock"], KD=["", "glowing_star", "tear-off_calendar"]), sw={"सफेद": "#ffffff", "गुलाबी": "#ff8fb8", "लाल": "#e63946", "पीला": "#ffd23f", "हरा": "#2a9a57", "नीला": "#2a76e0"},
          fe=FE, stampic=dict(good="check_mark_button", care="warning", stop="stop_sign"), stampc=dict(good="#1f9d6b", care="#e09400", stop="#e63946"))

JS = r"""
const TL=__TL__, W=1080, H=1920, DUR=TL.total, INK='#2b2140';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);}, ramp=(t,a,b)=>ease((t-a)/(b-a));
const back=x=>{x=clamp(x,0,1);const c=2.2;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);};
const bounce=x=>{x=clamp(x,0,1);const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375;};
const $=id=>document.getElementById(id), q=s=>[...document.querySelectorAll(s)];
const Ls=q('.ln'), rows=q('.row'), chips=q('.chip'), ars=q('.ar');
function fitEl(el,px){el.style.fontSize=px+'px';el.style.transform='none';const sw=el.scrollWidth;if(sw>960){el.style.fontSize=Math.floor(px*960/sw)+'px';}}
function line(i,txt,y,px,color,t,at){const el=Ls[i];el.textContent=txt;fitEl(el,px);const f=parseFloat(el.style.fontSize);if(color==INK)color='#fff'; el.style.color=color;el.style.top=(y-f*0.62)+'px';
  el.classList.toggle('dark',true);const on=t>=at;el.style.opacity=on?1:0;if(on)el.style.transform=`scale(${(1.6-0.6*back((t-at)/0.16)).toFixed(3)})`;}
const pop=(el,t,at,d)=>{const on=t>=at;el.style.opacity=on?1:0;if(on)el.style.transform=`scale(${back((t-at)/(d||0.22)).toFixed(3)})`;};
const DARK={}; const LAY={tone_serious:[[1400,130,'#fff'],[1575,110,'#ffe066']],tone_sad:[[1400,130,'#fff'],[1575,110,'#bcd4ff']],tone_fun:[[1400,130,INK],[1575,110,'AC']],tone_happy:[[1400,130,INK],[1575,110,'AC']],tone_encouraging:[[1400,130,INK],[1575,110,'#ffe066']],days:[[1340,110,INK],[1500,100,'#e63946']],hook:[[330,190,'#fff'],[1500,130,'#fff'],[1690,140,'#ffe066']], meters:[[330,170,INK]], remedy:[[1400,118,INK],[1575,118,'#ffe066']], cta:[[330,150,INK],[560,190,'AC'],[1600,110,INK]]};
// bokeh blobs
// galaxy: seeded stars on log-spiral arms that turn slowly, drifting nebulae, twinkling field stars (all drawn in code)
const G=document.getElementById('gal').getContext('2d'); let sd=7; const rnd=()=>{sd=(sd*16807)%2147483647; return sd/2147483647;};
const ARM=[...Array(2600)].map((_,i)=>{const arm=i%3, r=40+Math.pow(rnd(),0.9)*640, th=arm*2.094+r*0.012+(rnd()-0.5)*0.32*(1-r/1000); return {r,th,s:rnd()*2.6+0.9,b:0.55+rnd()*0.45,h:[260,300,200,330][i%4],p:rnd()*6.28};});
const FIELD=[...Array(260)].map(()=>({x:rnd()*1080,y:rnd()*1920,s:rnd()*2.4+0.5,p:rnd()*6.28,f:1+rnd()*2}));
const NEB=[[300,600,520,'rgba(150,70,255,'],[820,1250,600,'rgba(255,70,170,'],[520,1650,480,'rgba(60,140,255,'],[700,400,420,'rgba(255,140,90,']];
function galaxy(t){G.globalCompositeOperation='source-over'; const g=G.createLinearGradient(0,0,0,1920); g.addColorStop(0,'#070418'); g.addColorStop(0.5,'#140a33'); g.addColorStop(1,'#0a0620'); G.fillStyle=g; G.fillRect(0,0,1080,1920);
  G.globalCompositeOperation='lighter';
  NEB.forEach((n,i)=>{const x=n[0]+60*Math.sin(t*0.07+i), y=n[1]+50*Math.cos(t*0.05+i*2), rg=G.createRadialGradient(x,y,0,x,y,n[2]); rg.addColorStop(0,n[3]+'0.30)'); rg.addColorStop(1,n[3]+'0)'); G.fillStyle=rg; G.fillRect(0,0,1080,1920);});
  const cx=540, cy=960, rot=t*0.05, tilt=0.55;
  const core=G.createRadialGradient(cx,cy,0,cx,cy,230); core.addColorStop(0,'rgba(255,240,220,0.75)'); core.addColorStop(0.35,'rgba(255,170,230,0.25)'); core.addColorStop(1,'rgba(120,80,255,0)'); G.fillStyle=core; G.beginPath(); G.ellipse(cx,cy,230,230*0.75,0,0,6.283); G.fill();
  ARM.forEach(a=>{const th=a.th+rot*(1.2-a.r/1500), x=cx+a.r*Math.cos(th), y=cy+a.r*Math.sin(th)*tilt+a.r*0.25*Math.cos(th)*0.3;
    const tw=0.6+0.4*Math.sin(t*2+a.p); G.fillStyle=`hsla(${a.h},90%,${72+20*(1-a.r/660)}%,${Math.min(1,a.b*tw*1.25*(1-a.r/820)).toFixed(3)})`; G.fillRect(x,y,a.s,a.s);});
  FIELD.forEach(f=>{const tw=0.35+0.65*Math.pow(0.5+0.5*Math.sin(t*f.f+f.p),3); G.fillStyle=`rgba(255,255,255,${tw.toFixed(3)})`; G.beginPath(); G.arc(f.x,f.y,f.s*(0.6+0.4*tw),0,6.283); G.fill();
    if(f.s>2.3){G.fillStyle=`rgba(255,255,255,${(tw*0.35).toFixed(3)})`; G.fillRect(f.x-9*tw,f.y-0.6,18*tw,1.2); G.fillRect(f.x-0.6,f.y-9*tw,1.2,18*tw);}});
  G.globalCompositeOperation='source-over';}
const blobs=q('.blob').map((el,i)=>({el,x:(i*317)%1080,y:(i*523)%1920,r:260+((i*97)%220),p:i*1.7}));
window.render=function(t){
  $('cover').style.opacity=t<0.35?1:1-ramp(t,0.35,0.6);
  const coverOn=t<0.45;
  const s=TL.shots.find(s=>t<s.end)||TL.shots[TL.shots.length-1], lt=t-s.start, si=TL.shots.indexOf(s), sc=TL.sc[s.scene], AC=sc.ac, hook=s.scene=='hook';
  const S=(s.cues.find(c=>c.k=='S')||{}).at, S2=(s.cues[2]||s.cues[s.cues.length-1]).at-s.start;
  galaxy(t); $('tint').style.background=`radial-gradient(circle at 50% 45%, ${sc.bg[1]}40, transparent 70%)`;
  $('bg').style.background=`linear-gradient(${(165+15*Math.sin(t*0.5)).toFixed(1)}deg,${sc.bg[0]},${sc.bg[1]})`;
  blobs.forEach(b=>{b.el.style.transform=`translate(${(b.x+60*Math.sin(t*0.35+b.p)-b.r).toFixed(1)}px,${(b.y+80*Math.cos(t*0.28+b.p)-b.r).toFixed(1)}px)`;b.el.style.width=b.el.style.height=(2*b.r)+'px';b.el.style.opacity=hook?0.10:0.45;});
  $('flash').style.opacity=si>0?0.75*(1-ramp(lt,0,0.14)):0;
  let hit=0; s.cues.forEach(c=>{if(c.k=='L'||c.k=='T'||c.k=='S')hit=Math.max(hit,(t>=c.at?Math.exp(-(t-c.at)/0.09):0)*(c.k=='S'?1.6:1));});
  const amp=(hook?20:10)*hit, zoom=(1+0.06*(1-ramp(lt,0,0.25)))*(1+0.035*lt/(s.end-s.start));
  $('shake').style.transform=`translate(${(amp*Math.sin(t*97)).toFixed(1)}px,${(amp*Math.cos(t*131)).toFixed(1)}px) scale(${zoom.toFixed(4)})`;
  $('prog').style.width=(100*t/(DUR-0.5)).toFixed(2)+'%'; $('prog').style.background=hook?'#fff':AC;
  q('.it,.sh').forEach(el=>el.style.opacity=0);
  [...Ls,...rows,...chips,...q('.dc'),...q('.pt')].forEach(el=>el.style.opacity=0); ['title','stamp','date','brand','badge','areas'].forEach(id=>$(id).style.opacity=0);
  // scene items
  sc.items.forEach((it,k)=>{const el=$(s.scene+'_'+k), sh=$('sh_'+s.scene+'_'+k); let an=it[4];
    const md=(s.cues.find(c=>c.k=='S')||{}).b; if(it[0]=='broken_heart'&&md!='stop')return; if(an=='popout'&&it[0]=='red_heart'&&md!='stop'){an='pulse';}
    let d=it[5]=='S'?(S!==undefined?S-s.start:1):(it[5]=='S2'?S2:it[5]), a=lt-d; if(a<0)return;
    let o=1, tr='', so=1;
    if(an=='fade'){o=ramp(a,0,0.3)*(it[6]||1);}
    else if(an=='pop'){tr=`scale(${back(a/0.28).toFixed(3)})`;so=clamp(a/0.28,0,1);}
    else if(an=='popout'){const e=S!==undefined?S-s.start:99;o=1-ramp(lt,e-0.05,e+0.08);tr=`scale(${back(a/0.28).toFixed(3)})`;}
    else if(an=='pulse'){tr=`scale(${(back(a/0.35)*(1+0.04*Math.sin(t*4))).toFixed(3)})`;if(hook)$('glow').style.opacity=0.85;}
    else if(an=='float'){tr=`translateY(${(18*Math.sin(t*3+k)).toFixed(1)}px) scale(${back(a/0.28).toFixed(3)})`;}
    else if(an=='ring'){const r=(Math.floor(a/0.9)%2==0)?Math.sin(a*48)*9*Math.min(1,a*4):0;tr=`rotate(${r.toFixed(1)}deg) scale(${back(a/0.25).toFixed(3)})`;}
    else if(an=='tilt'){tr=`rotate(${(9*Math.sin(a*2.6)).toFixed(1)}deg) scale(${back(a/0.3).toFixed(3)})`;}
    else if(an=='rain'){const f=bounce(a/0.55);tr=`translateY(${(-1000*(1-f)).toFixed(1)}px) rotate(${it[6]||0}deg)`;so=f;}
    else if(an=='burst'){const f=clamp(a/0.9,0,1);o=1-f*f;tr=`scale(${(0.4+1.1*ease(f)).toFixed(3)}) rotate(${(40*f).toFixed(1)}deg)`;}
    else if(an=='fly'){const f=ease(a/1.7),x0=it[6][0]-it[1],y0=it[6][1]-it[2],x=x0*(1-f),y=y0*(1-f)-180*Math.sin(Math.PI*f);
      tr=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(-14*Math.cos(Math.PI*f)).toFixed(1)}deg)`;}
    el.style.opacity=o.toFixed(3); el.style.transform=tr; if(sh)sh.style.opacity=(o*so).toFixed(3);
  });
  if(!hook)$('glow').style.opacity=0;
  const xp=$('xpic'); xp.style.opacity=0; if(s.pic){xp.src='file://'+TL.fe+'/'+s.pic+'.png'; const a=lt-0.35; if(a>0){xp.style.opacity=1; xp.style.transform=`translateY(${(14*Math.sin(t*3)).toFixed(1)}px) scale(${back(a/0.28).toFixed(3)})`;}}
  // area progress icons
  if(s.area!==null&&s.area!==undefined){$('areas').style.opacity=1; ars.forEach((el,i)=>{const cur=i==s.area, done=i<s.area;
    el.style.transform=`scale(${cur?(1.35*back(lt/0.25)).toFixed(3):1})`; el.style.background=cur?'#fff':'rgba(255,255,255,.45)'; el.style.borderColor=cur?AC:'transparent';
    el.querySelector('img').style.opacity=cur||done?1:0.45; el.querySelector('.tick').style.opacity=done?1:0;});}
  // text
  const L=s.cues.filter(c=>c.k=='L'); const lay=s.clip&&!LAY[s.scene]?[[1400,140,INK]]:(LAY[s.scene]||[[1330,140,INK]]);
  lay.forEach((a,i)=>{if(L[i])line(i,L[i].a,a[0],a[1],a[2]=='AC'?AC:a[2],t,L[i].at);});
  const T=s.cues.find(c=>c.k=='T'); if(T){const el=$('title');el.textContent=T.a;el.style.background=AC;pop(el,t,T.at,0.2);}
  if(s.scene=='lucky'){const el=$('title');el.textContent=TL.period=='weekly'?'इस हफ्ते का लकी':'आज का लकी';el.style.background=AC;pop(el,t,s.start,0.2);}
  const St=s.cues.find(c=>c.k=='S'); if(St){const el=$('stamp'),on=t>=St.at; el.querySelector('span').textContent=St.a; el.style.borderColor=el.style.color=TL.stampc[St.b];
    el.querySelector('img').src='file://'+TL.fe+'/'+TL.stampic[St.b]+'.png'; const sp=el.querySelector('span'); sp.style.fontSize='112px'; if(sp.scrollWidth>720)sp.style.fontSize=Math.floor(112*720/sp.scrollWidth)+'px'; el.style.opacity=on?1:0; if(on)el.style.transform=`rotate(-6deg) scale(${(2.2-1.2*ease((t-St.at)/0.16)).toFixed(3)})`;}
  if(hook){$('date').style.opacity=1;}
  if(s.scene=='meters'){s.cues.filter(c=>c.k=='M').forEach((c,i)=>{const el=rows[i]; pop(el,t,c.at); el.style.top=(560+i*270)+'px';
      el.querySelector('img').src='file://'+TL.fe+'/'+TL.icons.M[i]+'.png'; el.querySelector('.lab').textContent=c.a; const f=ease((t-c.at-0.1)/0.55)*c.b/5;
      el.querySelector('.fill').style.width=(100*f).toFixed(1)+'%'; el.querySelector('.num').textContent=Math.round(f*5)+'/5';
      el.querySelector('.fill').style.background=c.b>=4?'#1f9d6b':(c.b==3?'#f5a700':'#e63946');});}
  if(s.scene=='lucky'){s.cues.filter(c=>c.k=='K').forEach((c,i)=>{const el=chips[i]; pop(el,t,c.at); el.style.top=(600+i*360)+'px';
      el.querySelector('.kl').textContent=c.a; const v=el.querySelector('.kv'); v.textContent=c.b; v.style.fontSize='150px'; const mw=640; if(v.scrollWidth>mw)v.style.fontSize=Math.floor(150*mw/v.scrollWidth)+'px';
      const sw=el.querySelector('.sw'), ic=el.querySelector('.ic'); if(i==0){sw.style.display='block';ic.style.display='none';sw.style.background=TL.sw[c.b]||c.b;}
      else{sw.style.display='none';ic.style.display='block';ic.src='file://'+TL.fe+'/'+(c.a=='बेस्ट डे'?TL.icons.KD:TL.icons.K)[i]+'.png';}});}
  if(s.scene=='days'){const D=s.cues.find(c=>c.k=='D'), col={good:'#1f9d6b',care:'#e09400',stop:'#e63946'}, ic={good:'check_mark_button',care:'warning',stop:'stop_sign'};
    q('.dc').forEach((el,i)=>{const d=D.a[i]; if(!d)return; const r=i<4?0:1, k=i<4?i:i-4, n=r?3:4; el.style.left=(540-(n*220+(n-1)*24)/2+k*244)+'px'; el.style.top=(520+r*270)+'px';
      el.style.background=col[d[1]]; el.querySelector('b').textContent=d[0]; el.querySelector('img').src='file://'+TL.fe+'/'+ic[d[1]]+'.png'; pop(el,t,D.at+0.3+i*0.14,0.22);});}
  if(s.scene=='tone_happy'||s.scene=='tone_sad'){const sad=s.scene=='tone_sad', C=['#ff4f6d','#ffd23f','#2ec4b6','#7b4bd6','#ff8a3d','#3a86ff'];
    q('.pt').forEach((el,i)=>{const sp=sad?1300:420+(i*37)%300, x=(i*173)%1080+(sad?0:60*Math.sin(t*2+i)), y=((lt*sp+(i*263)%1920)%2100)-120;
      el.style.opacity=sad?0.45:0.95; el.style.width=(sad?5:22)+'px'; el.style.height=(sad?70:14)+'px'; el.style.background=sad?'#cfe0ff':C[i%6];
      el.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${sad?12:(lt*300+i*40)%360}deg)`;});}
  if(s.scene=='cta'){const c=s.cues[2]; $('brand').style.opacity=ramp(t,c.at,c.at+0.3); $('badge').style.opacity=1; $('badge').style.transform=`scale(${(back(lt/0.3)*(1+0.05*Math.sin(t*6))).toFixed(3)})`;}
};
const _r=window.render; window.render=async function(t){_r(t);
  const s=TL.shots.find(s=>t<s.end)||TL.shots[TL.shots.length-1], lt=t-s.start, cw=$('clipw'), ci=$('clip');
  if(s.clip){q('.it,.sh').forEach(e=>{e.style.opacity=0;}); const fi=1+Math.floor(lt*30)%s.clip.n;
    ci.src='file://'+s.clip.dir+'/c_'+String(fi).padStart(4,'0')+'.jpg'; try{await ci.decode();}catch(e){}
    cw.style.opacity=ramp(lt,0,0.18); ci.style.transform=`scale(${(1.12-0.08*ease(lt/(s.end-s.start))).toFixed(4)})`;}
  else cw.style.opacity=0;
  if(t<0.45){q('.ln,.it,#date,#title,#stamp').forEach(e=>e.style.opacity=0); cw.style.opacity=0;}};
window.DUR=DUR; render(0);
"""
row = '<div class="row"><img class="ri"><div class="lab"></div><div class="num"></div><div class="track"><div class="fill"></div></div></div>'
chip = '<div class="chip"><div class="sw"></div><img class="ic"><div class="kt"><div class="kl"></div><div class="kv"></div></div></div>'
OUT = "-6px -6px 0 #fff,6px -6px 0 #fff,-6px 6px 0 #fff,6px 6px 0 #fff,0 -7px 0 #fff,0 7px 0 #fff,-7px 0 0 #fff,7px 0 0 #fff,0 14px 24px rgba(43,33,64,.25)"
OUTD = "-6px -6px 0 #2b2140,6px -6px 0 #2b2140,-6px 6px 0 #2b2140,6px 6px 0 #2b2140,0 -7px 0 #2b2140,0 7px 0 #2b2140,-7px 0 0 #2b2140,7px 0 0 #2b2140,0 14px 24px rgba(0,0,0,.3)"
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:"Baloo 2";font-weight:800;src:url("file://{FD}/baloo-2/files/baloo-2-devanagari-800-normal.woff2")}}
@font-face{{font-family:"Mukta";font-weight:800;src:url("file://{FD}/mukta/files/mukta-devanagari-800-normal.woff2")}}
html,body{{margin:0;background:#000}} #stage{{position:relative;width:{W}px;height:{H}px;overflow:hidden}}
#bg,#shake,#flash{{position:absolute;inset:0}} #flash{{background:#fff;opacity:0;pointer-events:none}}
.blob{{position:absolute;left:0;top:0;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.9),rgba(255,255,255,0) 70%)}}
.it{{position:absolute;opacity:0;transform-origin:50% 60%;filter:drop-shadow(0 18px 22px rgba(43,33,64,.22))}}
.sh{{position:absolute;opacity:0;border-radius:50%;background:radial-gradient(ellipse,rgba(43,33,64,.28),rgba(43,33,64,0) 70%)}}
#glow{{position:absolute;left:140px;top:610px;width:800px;height:800px;border-radius:50%;background:radial-gradient(circle,rgba(255,240,180,.75),rgba(255,240,180,0) 65%);opacity:0}}
#progw{{position:absolute;left:60px;right:60px;top:56px;height:12px;border-radius:8px;background:rgba(255,255,255,.18)}} #prog{{height:100%;border-radius:8px;width:0}}
#areas{{position:absolute;left:0;width:{W}px;top:100px;display:flex;justify-content:center;gap:22px;opacity:0}}
.ar{{position:relative;width:104px;height:104px;border-radius:50%;border:6px solid transparent;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(43,33,64,.15)}}
.ar img{{width:78px;height:78px}} .ar .tick{{position:absolute;right:-8px;bottom:-8px;width:44px;height:44px;border-radius:50%;background:#1f9d6b;color:#fff;font:800 30px/44px Poppins;text-align:center}}
.ln{{position:absolute;left:50px;width:980px;text-align:center;font-family:"Baloo 2";font-weight:800;line-height:1.25;opacity:0;transform-origin:50% 55%;white-space:nowrap;text-shadow:{OUT}}}
.ln.dark{{text-shadow:{OUTD}}}
#title{{position:absolute;left:50%;top:250px;translate:-50% 0;padding:0 70px;border-radius:90px;font:800 130px/1.35 "Baloo 2";color:#fff;opacity:0;white-space:nowrap;box-shadow:0 14px 0 rgba(43,33,64,.18)}}
#stamp{{position:absolute;left:50%;top:1540px;translate:-50% 0;display:flex;align-items:center;gap:26px;padding:18px 54px 10px 34px;border:14px solid;border-radius:46px;background:rgba(255,255,255,.95);
  font:800 112px/1.2 "Baloo 2";white-space:nowrap;opacity:0;box-shadow:0 16px 30px rgba(43,33,64,.2)}} #stamp img{{width:130px;height:130px;margin-top:-8px}}
#date{{position:absolute;left:50%;top:130px;translate:-50% 0;padding:6px 44px;border-radius:50px;background:rgba(255,255,255,.2);font:800 60px "Mukta";color:#fff;white-space:nowrap;opacity:0}}
#brand{{position:absolute;left:0;width:{W}px;top:1760px;text-align:center;font:800 48px Poppins;letter-spacing:8px;color:#fff;opacity:0}}
#badge{{position:absolute;left:390px;top:780px;width:300px;height:300px;border-radius:50%;background:#fff;border:14px solid {INK};font:200px/300px "DejaVu Sans";text-align:center;color:{INK};opacity:0;display:none}}
#cover{{position:absolute;inset:0;background:linear-gradient(170deg,rgba(40,15,90,.55),rgba(120,30,110,.45) 60%,rgba(200,60,110,.35));display:flex;flex-direction:column;align-items:center;font-family:"Baloo 2";color:#fff}}
#cover .cdate{{margin-top:150px;padding:8px 50px;border-radius:60px;background:rgba(255,255,255,.18);font:800 66px Mukta}}
#cover .cgl{{margin-top:34px;width:230px;height:230px;border-radius:50%;background:#fff;color:#2b2140;font:150px/230px "DejaVu Sans";text-align:center;box-shadow:0 0 0 16px rgba(255,255,255,.25)}}
#cover .cname{{margin-top:22px;font:800 150px/1.2 "Baloo 2";text-shadow:0 10px 24px rgba(0,0,0,.3)}}
#cover .chook{{margin-top:4px;padding:6px 44px;border-radius:50px;background:#ffe066;color:#2b2140;font:800 72px/1.3 "Baloo 2"}}
#cover .cscores{{margin-top:44px;display:flex;gap:22px}} #cover .cs{{display:flex;align-items:center;gap:8px;background:#fff;border-radius:40px;padding:10px 26px 4px 14px}}
#cover .cs img{{width:76px;height:76px}} #cover .cs b{{font:400 72px Anton}}
#cover .clist{{margin-top:40px;width:940px;display:flex;flex-direction:column;gap:20px}}
#cover .ci{{display:flex;align-items:center;gap:20px;background:rgba(255,255,255,.95);border-radius:36px;padding:10px 26px;color:#2b2140}}
#cover .ci>img{{width:96px;height:96px}} #cover .ct{{font:800 68px/1.3 "Baloo 2";flex:1;white-space:nowrap}}
#cover .cv{{display:flex;align-items:center;gap:10px;font:800 60px/1.3 "Baloo 2";white-space:nowrap}} #cover .cv img{{width:64px;height:64px}}
#cover .cdays{{margin-top:30px;display:flex;gap:12px}} #cover .cd{{width:128px;height:118px;border-radius:28px;color:#fff;font:800 60px/118px "Baloo 2";text-align:center}}
#cover .cmore{{margin-top:22px;white-space:nowrap;font:800 62px/1.3 "Baloo 2";color:#ffe066}}
#cover .cbrand{{position:absolute;bottom:120px;font:800 46px Poppins;letter-spacing:8px}}
.dc{{position:absolute;width:220px;height:230px;border-radius:44px;opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:0 12px 0 rgba(43,33,64,.15)}}
.dc b{{font:800 78px/1.2 "Baloo 2";color:#fff}} .dc img{{width:80px;height:80px}}
.pt{{position:absolute;left:0;top:0;opacity:0;border-radius:3px}}
#clipw{{position:absolute;left:90px;top:300px;width:900px;height:960px;border-radius:56px;overflow:hidden;opacity:0;border:8px solid rgba(255,255,255,.9);box-shadow:0 0 60px rgba(190,140,255,.55),0 30px 60px rgba(0,0,0,.5)}}
#clip{{width:100%;height:100%;object-fit:cover;transform-origin:50% 50%}}
.row{{position:absolute;left:80px;width:900px;height:230px;opacity:0;transform-origin:50% 50%}}
.row .ri{{position:absolute;left:0;top:0;width:150px;height:150px}}
.row .lab{{position:absolute;left:175px;top:0;font:800 110px/1.25 "Baloo 2";color:#fff}} .row .num{{position:absolute;right:0;top:4px;font:400 118px Anton;color:#fff}}
.row .track{{position:absolute;left:175px;right:0;top:160px;height:56px;border-radius:30px;background:#fff;border:8px solid {INK};overflow:hidden}} .row .fill{{height:100%;width:0;border-radius:22px}}
.chip{{position:absolute;left:70px;width:940px;height:300px;opacity:0;display:flex;align-items:center;gap:40px;background:rgba(255,255,255,.85);border-radius:60px;padding:0 40px;box-sizing:border-box;box-shadow:0 14px 0 rgba(43,33,64,.12)}}
.chip .sw{{width:170px;height:170px;border-radius:50%;border:12px solid {INK};flex:none;box-sizing:border-box}} .chip .ic{{width:180px;height:180px;flex:none}}
.chip .kt{{min-width:0;flex:1}} .chip .kl{{font:800 66px/1.2 Mukta;color:#c27c00}} .chip .kv{{font:800 150px/1.1 "Baloo 2";color:{INK};white-space:nowrap}}
</style></head><body><div id="stage"><canvas id="gal" width="1080" height="1920" style="position:absolute;inset:0"></canvas><div id="tint" style="position:absolute;inset:0"></div><div id="bg" style="display:none">{'<div class="blob"></div>' * 7}</div><div id="shake"><div id="glow"></div><div id="clipw"><img id="clip"></div><img id="xpic" class="it" style="left:690px;top:1010px;width:300px;height:300px">
{''.join(shadows)}{''.join(imgs)}
{'<div class="ln"></div>' * 3}{'<div class="dc"><b></b><img></div>' * 7}{'<div class="pt"></div>' * 60}{row * 4}{chip * 3}<div id="title"></div><div id="stamp"><img><span></span></div>
<div id="date">{TL['date_label']}</div><div id="brand">TAROT TALK BY SAKSHI</div><div id="badge">{TL['glyph']}</div><div id="areas">{areas}</div></div>
{cover}<div id="progw"><div id="prog"></div></div><div id="flash"></div></div>
<script>{JS.replace('__TL__', json.dumps(TL, ensure_ascii=False))}</script></body></html>"""
open(f"{DIR}/sign.html", "w").write(html)
print("ok", TL["total"])
