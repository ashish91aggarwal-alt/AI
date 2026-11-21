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
pick = (good + rest)[:4]
hook2 = [c for c in TL["shots"][0]["cues"] if c["k"] == "L"][1]["a"]
cover = (f'<div id="cover"><div class="cdate">{TL["date_label"]}</div><div class="cgl">{GLYPH[TL["sign"].lower()]}︎</div>'
         f'<div class="cname">{TL.get("rashi", TL["sign"])} राशिफल</div><div class="chook">{hook2}</div><div class="cscores">'
         + "".join(f'<div class="cs"><img src="file://{FE}/{ic}.png"><b style="color:{MC["good"] if c["b"] >= 4 else (MC["care"] if c["b"] == 3 else MC["stop"])}">{c["b"]}/5</b></div>'
                   for c, ic in zip(sc_, ["red_heart", "money_bag", "briefcase", "fire"]))
         + '</div><div class="clist">' + "".join(f'<div class="ci"><img src="file://{FE}/{AREA_IC[s["id"]]}.png"><span class="ct">{cue(s, "T")["a"]}</span>'
         f'<span class="cv" style="color:{MC[st["b"]]}"><img src="file://{FE}/{MI[st["b"]]}.png">{st["a"]}</span></div>' for s, st in pick)
         + '</div>' + (f'<div class="cmore">+ ' + ", ".join([cue(s, "T")["a"] for s, _ in (good + rest)[4:]] + ["उपाय"]) + ' → वीडियो में</div>')
         + '<div class="cbrand">TAROT TALK BY SAKSHI</div></div>')
areas = "".join(f'<div class="ar"><img src="file://{FE}/{a}.png"><div class="tick">✓</div></div>' for a in AREAS)
TL.update(glyph=GLYPH[TL["sign"].lower()] + "︎", sc={k: dict(bg=v[0], ac=v[1], items=v[2]) for k, v in SC.items()},
          icons=dict(M=["red_heart", "money_bag", "briefcase", "fire"], K=["", "glowing_star", "alarm_clock"]), sw={"सफेद": "#ffffff", "गुलाबी": "#ff8fb8", "लाल": "#e63946", "पीला": "#ffd23f", "हरा": "#2a9a57", "नीला": "#2a76e0"},
          fe=FE, stampic=dict(good="check_mark_button", care="warning", stop="stop_sign"), stampc=dict(good="#1f9d6b", care="#e09400", stop="#e63946"))

JS = r"""
const TL=__TL__, W=1080, H=1920, DUR=TL.total, INK='#2b2140';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);}, ramp=(t,a,b)=>ease((t-a)/(b-a));
const back=x=>{x=clamp(x,0,1);const c=2.2;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);};
const bounce=x=>{x=clamp(x,0,1);const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375;};
const $=id=>document.getElementById(id), q=s=>[...document.querySelectorAll(s)];
const Ls=q('.ln'), rows=q('.row'), chips=q('.chip'), ars=q('.ar');
function fitEl(el,px){el.style.fontSize=px+'px';el.style.transform='none';const sw=el.scrollWidth;if(sw>960){el.style.fontSize=Math.floor(px*960/sw)+'px';}}
function line(i,txt,y,px,color,t,at){const el=Ls[i];el.textContent=txt;fitEl(el,px);const f=parseFloat(el.style.fontSize);el.style.color=color;el.style.top=(y-f*0.62)+'px';
  el.classList.toggle('dark',color=='#fff'||color=='#ffe066');const on=t>=at;el.style.opacity=on?1:0;if(on)el.style.transform=`scale(${(1.6-0.6*back((t-at)/0.16)).toFixed(3)})`;}
const pop=(el,t,at,d)=>{const on=t>=at;el.style.opacity=on?1:0;if(on)el.style.transform=`scale(${back((t-at)/(d||0.22)).toFixed(3)})`;};
const LAY={hook:[[330,190,'#fff'],[1500,130,'#fff'],[1690,140,'#ffe066']], meters:[[330,170,INK]], remedy:[[1330,118,INK],[1520,118,'AC']], cta:[[330,150,INK],[560,190,'AC'],[1600,110,INK]]};
// bokeh blobs
const blobs=q('.blob').map((el,i)=>({el,x:(i*317)%1080,y:(i*523)%1920,r:260+((i*97)%220),p:i*1.7}));
window.render=function(t){
  $('cover').style.opacity=t<0.35?1:1-ramp(t,0.35,0.6);
  const s=TL.shots.find(s=>t<s.end)||TL.shots[TL.shots.length-1], lt=t-s.start, si=TL.shots.indexOf(s), sc=TL.sc[s.scene], AC=sc.ac, hook=s.scene=='hook';
  const S=(s.cues.find(c=>c.k=='S')||{}).at, S2=(s.cues[2]||s.cues[s.cues.length-1]).at-s.start;
  $('bg').style.background=`linear-gradient(${(165+15*Math.sin(t*0.5)).toFixed(1)}deg,${sc.bg[0]},${sc.bg[1]})`;
  blobs.forEach(b=>{b.el.style.transform=`translate(${(b.x+60*Math.sin(t*0.35+b.p)-b.r).toFixed(1)}px,${(b.y+80*Math.cos(t*0.28+b.p)-b.r).toFixed(1)}px)`;b.el.style.width=b.el.style.height=(2*b.r)+'px';b.el.style.opacity=hook?0.10:0.45;});
  $('flash').style.opacity=si>0?0.75*(1-ramp(lt,0,0.14)):0;
  let hit=0; s.cues.forEach(c=>{if(c.k=='L'||c.k=='T'||c.k=='S')hit=Math.max(hit,(t>=c.at?Math.exp(-(t-c.at)/0.09):0)*(c.k=='S'?1.6:1));});
  const amp=(hook?20:10)*hit, zoom=(1+0.06*(1-ramp(lt,0,0.25)))*(1+0.035*lt/(s.end-s.start));
  $('shake').style.transform=`translate(${(amp*Math.sin(t*97)).toFixed(1)}px,${(amp*Math.cos(t*131)).toFixed(1)}px) scale(${zoom.toFixed(4)})`;
  $('prog').style.width=(100*t/(DUR-0.5)).toFixed(2)+'%'; $('prog').style.background=hook?'#fff':AC;
  q('.it,.sh').forEach(el=>el.style.opacity=0);
  [...Ls,...rows,...chips].forEach(el=>el.style.opacity=0); ['title','stamp','date','brand','badge','areas'].forEach(id=>$(id).style.opacity=0);
  // scene items
  sc.items.forEach((it,k)=>{const el=$(s.scene+'_'+k), sh=$('sh_'+s.scene+'_'+k), an=it[4];
    let d=it[5]=='S'?(S!==undefined?S-s.start:1):(it[5]=='S2'?S2:it[5]), a=lt-d; if(a<0)return;
    let o=1, tr='', so=1;
    if(an=='fade'){o=ramp(a,0,0.3)*(it[6]||1);}
    else if(an=='pop'){tr=`scale(${back(a/0.28).toFixed(3)})`;so=clamp(a/0.28,0,1);}
    else if(an=='popout'){const e=S!==undefined?S-s.start:99;o=1-ramp(lt,e-0.05,e+0.08);tr=`scale(${back(a/0.28).toFixed(3)})`;}
    else if(an=='pulse'){tr=`scale(${(back(a/0.35)*(1+0.04*Math.sin(t*4))).toFixed(3)})`;$('glow').style.opacity=0.85;}
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
  // area progress icons
  if(s.area!==null&&s.area!==undefined){$('areas').style.opacity=1; ars.forEach((el,i)=>{const cur=i==s.area, done=i<s.area;
    el.style.transform=`scale(${cur?(1.35*back(lt/0.25)).toFixed(3):1})`; el.style.background=cur?'#fff':'rgba(255,255,255,.45)'; el.style.borderColor=cur?AC:'transparent';
    el.querySelector('img').style.opacity=cur||done?1:0.45; el.querySelector('.tick').style.opacity=done?1:0;});}
  // text
  const L=s.cues.filter(c=>c.k=='L'); const lay=LAY[s.scene]||[[1330,140,INK]];
  lay.forEach((a,i)=>{if(L[i])line(i,L[i].a,a[0],a[1],a[2]=='AC'?AC:a[2],t,L[i].at);});
  const T=s.cues.find(c=>c.k=='T'); if(T){const el=$('title');el.textContent=T.a;el.style.background=AC;pop(el,t,T.at,0.2);}
  if(s.scene=='lucky'){const el=$('title');el.textContent='आज का लकी';el.style.background=AC;pop(el,t,s.start,0.2);}
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
      else{sw.style.display='none';ic.style.display='block';ic.src='file://'+TL.fe+'/'+TL.icons.K[i]+'.png';}});}
  if(s.scene=='cta'){const c=s.cues[2]; $('brand').style.opacity=ramp(t,c.at,c.at+0.3); $('badge').style.opacity=1; $('badge').style.transform=`scale(${(back(lt/0.3)*(1+0.05*Math.sin(t*6))).toFixed(3)})`;}
};
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
#progw{{position:absolute;left:60px;right:60px;top:56px;height:12px;border-radius:8px;background:rgba(43,33,64,.15)}} #prog{{height:100%;border-radius:8px;width:0}}
#areas{{position:absolute;left:0;width:{W}px;top:100px;display:flex;justify-content:center;gap:22px;opacity:0}}
.ar{{position:relative;width:104px;height:104px;border-radius:50%;border:6px solid transparent;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(43,33,64,.15)}}
.ar img{{width:78px;height:78px}} .ar .tick{{position:absolute;right:-8px;bottom:-8px;width:44px;height:44px;border-radius:50%;background:#1f9d6b;color:#fff;font:800 30px/44px Poppins;text-align:center}}
.ln{{position:absolute;left:50px;width:980px;text-align:center;font-family:"Baloo 2";font-weight:800;line-height:1.25;opacity:0;transform-origin:50% 55%;white-space:nowrap;text-shadow:{OUT}}}
.ln.dark{{text-shadow:{OUTD}}}
#title{{position:absolute;left:50%;top:250px;translate:-50% 0;padding:0 70px;border-radius:90px;font:800 130px/1.35 "Baloo 2";color:#fff;opacity:0;white-space:nowrap;box-shadow:0 14px 0 rgba(43,33,64,.18)}}
#stamp{{position:absolute;left:50%;top:1500px;translate:-50% 0;display:flex;align-items:center;gap:26px;padding:18px 54px 10px 34px;border:14px solid;border-radius:46px;background:rgba(255,255,255,.95);
  font:800 112px/1.2 "Baloo 2";white-space:nowrap;opacity:0;box-shadow:0 16px 30px rgba(43,33,64,.2)}} #stamp img{{width:130px;height:130px;margin-top:-8px}}
#date{{position:absolute;left:50%;top:130px;translate:-50% 0;padding:6px 44px;border-radius:50px;background:rgba(255,255,255,.2);font:800 60px "Mukta";color:#fff;white-space:nowrap;opacity:0}}
#brand{{position:absolute;left:0;width:{W}px;top:1760px;text-align:center;font:800 48px Poppins;letter-spacing:8px;color:{INK};opacity:0}}
#badge{{position:absolute;left:390px;top:780px;width:300px;height:300px;border-radius:50%;background:#fff;border:14px solid {INK};font:200px/300px "DejaVu Sans";text-align:center;color:{INK};opacity:0;display:none}}
#cover{{position:absolute;inset:0;background:linear-gradient(170deg,#3a1c71,#b24592 60%,#f15f79);display:flex;flex-direction:column;align-items:center;font-family:"Baloo 2";color:#fff}}
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
#cover .cmore{{margin-top:22px;font:800 58px/1.3 "Baloo 2";color:#ffe066}}
#cover .cbrand{{position:absolute;bottom:120px;font:800 46px Poppins;letter-spacing:8px}}
.row{{position:absolute;left:70px;width:940px;height:230px;opacity:0;transform-origin:50% 50%}}
.row .ri{{position:absolute;left:0;top:0;width:150px;height:150px}}
.row .lab{{position:absolute;left:175px;top:0;font:800 110px/1.25 "Baloo 2";color:{INK}}} .row .num{{position:absolute;right:0;top:4px;font:400 118px Anton;color:{INK}}}
.row .track{{position:absolute;left:175px;right:0;top:160px;height:56px;border-radius:30px;background:#fff;border:8px solid {INK};overflow:hidden}} .row .fill{{height:100%;width:0;border-radius:22px}}
.chip{{position:absolute;left:70px;width:940px;height:300px;opacity:0;display:flex;align-items:center;gap:40px;background:rgba(255,255,255,.85);border-radius:60px;padding:0 40px;box-sizing:border-box;box-shadow:0 14px 0 rgba(43,33,64,.12)}}
.chip .sw{{width:170px;height:170px;border-radius:50%;border:12px solid {INK};flex:none;box-sizing:border-box}} .chip .ic{{width:180px;height:180px;flex:none}}
.chip .kt{{min-width:0;flex:1}} .chip .kl{{font:800 66px/1.2 Mukta;color:#c27c00}} .chip .kv{{font:800 150px/1.1 "Baloo 2";color:{INK};white-space:nowrap}}
</style></head><body><div id="stage"><div id="bg">{'<div class="blob"></div>' * 7}</div><div id="shake"><div id="glow"></div>
{''.join(shadows)}{''.join(imgs)}
{'<div class="ln"></div>' * 3}{row * 4}{chip * 3}<div id="title"></div><div id="stamp"><img><span></span></div>
<div id="date">{TL['date_label']}</div><div id="brand">TAROT TALK BY SAKSHI</div><div id="badge">{TL['glyph']}</div><div id="areas">{areas}</div></div>
{cover}<div id="progw"><div id="prog"></div></div><div id="flash"></div></div>
<script>{JS.replace('__TL__', json.dumps(TL, ensure_ascii=False))}</script></body></html>"""
open(f"{DIR}/sign.html", "w").write(html)
print("ok", TL["total"])
