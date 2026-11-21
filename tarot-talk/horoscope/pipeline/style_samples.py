"""Three style directions on the same 8.5 s (Tula hook -> love). usage: python3 style_samples.py <out_dir>
Writes A.html (editorial luxe), B.html (kinetic type), C.html (tarot deck) with window.render(t) / window.DUR."""
import json, os, sys
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
W = "/home/claude/work"; FD = f"{W}/node_modules/@fontsource"; ST = f"{W}/stock2/frames2"
def nf(k): return len([f for f in os.listdir(f"{ST}/{k}") if f.startswith("c_")])
DATA = dict(hook=dict(dir=f"{ST}/hook", n=nf("hook"), t0=0, t1=5.0), love=dict(dir=f"{ST}/love", n=nf("love"), t0=5.0, t1=8.5), dur=8.5)
FONTS = "".join(f'@font-face{{font-family:"{n}";font-style:{st};font-weight:{w};src:url("file://{FD}/{d}/files/{d}-latin-{w}-{st}.woff2")}}'
                for n, d, w, st in [("Cormorant", "cormorant-garamond", 500, "italic"), ("Cormorant", "cormorant-garamond", 500, "normal"), ("Bebas", "bebas-neue", 400, "normal"),
                                    ("Cinzel", "cinzel", 600, "normal"), ("Cinzel", "cinzel", 700, "normal"), ("Inter", "inter", 500, "normal"), ("Playfair", "playfair-display", 500, "italic")])
BASE_CSS = FONTS + """html,body{margin:0;background:#000}#st{position:relative;width:1080px;height:1920px;overflow:hidden;background:#000}
.ab{position:absolute}.full{position:absolute;inset:0}img.clip{width:100%;height:100%;object-fit:cover}
#grain{position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;opacity:.16}"""
COMMON_JS = r"""
const D=__DATA__, DUR=D.dur, $=id=>document.getElementById(id);
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)), ease=x=>{x=cl(x,0,1);return x*x*(3-2*x)}, out=x=>{x=cl(x,0,1);return 1-Math.pow(1-x,3)}, inout=x=>{x=cl(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const R=(t,a,b)=>out((t-a)/(b-a));
async function frame(img,k,lt){const c=D[k]; const fi=1+Math.floor(lt*30)%c.n; img.src='file://'+c.dir+'/c_'+String(fi).padStart(4,'0')+'.jpg'; try{await img.decode()}catch(e){}}
// film grain: seeded noise tile, shifted every frame
const gc=document.createElement('canvas'); gc.width=gc.height=256; const gx=gc.getContext('2d'), id=gx.createImageData(256,256); let sd=9;
for(let i=0;i<id.data.length;i+=4){sd=(sd*16807)%2147483647; const v=sd%256; id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=255;} gx.putImageData(id,0,0);
function grain(t){const g=$('grain'); if(!g)return; g.style.backgroundImage=`url(${gc.toDataURL()})`; g.style.backgroundPosition=`${(t*977)%256}px ${(t*613)%256}px`;}
let RID=0;
"""

# ---------- A: editorial luxe ----------
A_HTML = """<div id="st"><div class="full" id="cw"><img class="clip" id="clip"></div>
<div class="full" style="background:radial-gradient(ellipse at 50% 40%,rgba(0,0,0,0) 40%,rgba(0,0,0,.65) 100%),linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 50%,rgba(0,0,0,.85))"></div>
<div id="grain"></div>
<div class="ab" id="lab" style="left:0;width:1080px;top:150px;text-align:center;font:500 34px Inter;letter-spacing:14px;color:#e9d9b0"><span id="labt"></span></div>
<div class="ab" id="ruleL" style="top:172px;height:2px;background:#c9a64a"></div><div class="ab" id="ruleR" style="top:172px;height:2px;background:#c9a64a"></div>
<div class="ab" id="big" style="left:0;width:1080px;text-align:center;font:italic 500 250px/1 Cormorant;color:#f6efe2"></div>
<div class="ab" id="sub" style="left:90px;width:900px;text-align:center;font:italic 500 92px/1.12 Cormorant;color:#f6efe2"></div>
<div class="ab" id="note" style="left:0;width:1080px;text-align:center;font:500 46px Inter;letter-spacing:10px;color:#f0cf74;text-shadow:0 2px 12px #000"></div>
<div class="ab" id="ul" style="height:3px;background:#c9a64a"></div>
<div class="ab" id="dots" style="left:0;width:1080px;top:86px;display:flex;justify-content:center;gap:22px"></div></div>"""
A_JS = r"""
const dots=$('dots'); for(let i=0;i<7;i++){const d=document.createElement('div'); d.style.cssText='width:12px;height:12px;border-radius:50%;border:2px solid #c9a64a'; dots.appendChild(d);}
function words(el,txt,t,t0,step){el.innerHTML=txt.split(' ').map((w,i)=>{const a=R(t,t0+i*step,t0+i*step+.55); return `<span style="display:inline-block;opacity:${a};filter:blur(${(1-a)*6}px);transform:translateY(${(1-a)*24}px)">${w}</span>`}).join(' ');}
window.render=async function(t){const rid=++RID; const k=t<D.love.t0?'hook':'love', lt=t-D[k].t0; await frame($('clip'),k,lt); if(rid!==RID)return;
  $('clip').style.transform=`scale(${((k=='hook'?1.6:1.04)-0.04*ease(lt/(D[k].t1-D[k].t0))).toFixed(4)})`; $('cw').style.opacity=k=='love'?R(lt,0,.5):R(lt,0,.8); grain(t);
  [...dots.children].forEach((d,i)=>d.style.background=(k=='love'&&i<=5)?'#c9a64a':'transparent');
  const lab=k=='hook'?'WEEKLY  ·  23 – 29 NOV':'VI  ·  LOVE'; $('labt').textContent=lab; $('lab').style.opacity=R(lt,.1,.7);
  const rw=260*R(lt,.2,1.0); $('ruleL').style.left=(110+260-rw)+'px'; $('ruleL').style.width=rw+'px'; $('ruleR').style.left=(710)+'px'; $('ruleR').style.width=rw+'px';
  const big=$('big'), sub=$('sub'), note=$('note'), ul=$('ul');
  if(k=='hook'){big.textContent='Libra'; big.style.top='1060px'; const m=R(lt,.35,1.25); big.style.clipPath=`inset(${(1-m)*100}% 0 0 0)`; big.style.letterSpacing=(18-14*m)+'px';
    sub.style.top='1330px'; words(sub,'Charm & luck, together.',t,D.hook.t0+1.2,.22); note.style.top='1610px'; note.textContent='CAREFUL ON TUE & WED'; note.style.opacity=R(lt,2.9,3.6);
    ul.style.top='1590px'; ul.style.left='390px'; ul.style.width=(300*R(lt,2.9,3.8))+'px';}
  else{big.textContent=''; sub.style.top='1500px'; words(sub,'Your charm grows.',t,D.love.t0+.35,.2); note.style.top='1720px'; note.textContent='SPEAK YOUR HEART'; note.style.opacity=R(lt,1.6,2.2);
    ul.style.top='1772px'; ul.style.left='300px'; ul.style.width=(480*R(lt,1.8,2.7))+'px';}
};"""

# ---------- B: kinetic type ----------
B_HTML = """<div id="st"><div class="full" id="cw"><img class="clip" id="clip"></div>
<div class="full" style="background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,0) 35%,rgba(0,0,0,.25) 55%,rgba(0,0,0,.8))"></div>
<div class="full" id="leak" style="mix-blend-mode:screen"></div><div id="grain"></div><div class="full" id="flash" style="background:#fff;opacity:0"></div>
<div class="ab" id="stack" style="left:70px;width:940px;bottom:120px"></div>
<div class="ab" id="tag" style="left:70px;top:120px;font:500 34px Inter;letter-spacing:8px;color:#000;background:#f2c14e;padding:10px 18px"></div></div>"""
B_JS = r"""
// each line: [text, appear time (s from scene start), size, gold-bar?]
const LINES={hook:[['LIBRA',.15,300,0],['CHARM +',.9,200,0],['LUCK',1.35,240,1],['THIS WEEK',1.9,150,0]],love:[['SPEAK',.3,170,0],['YOUR',.7,170,0],['HEART',1.1,200,1]]};
window.render=async function(t){const rid=++RID; const k=t<D.love.t0?'hook':'love', lt=t-D[k].t0; await frame($('clip'),k,lt); if(rid!==RID)return;
  const wz=k=='love'?1-R(lt,0,.28):0; $('clip').style.transform=`scale(${(1.06+0.35*wz).toFixed(3)}) rotate(${(-3*wz).toFixed(2)}deg)`; $('clip').style.filter=`blur(${(10*wz).toFixed(1)}px)`;
  $('flash').style.opacity=k=='love'?0.55*(1-R(lt,0,.18)):0; grain(t);
  const lx=-300+1700*((t*0.18)%1.4); $('leak').style.background=`radial-gradient(circle at ${lx}px 500px, rgba(255,150,60,.45), rgba(255,90,40,0) 420px)`;
  $('tag').textContent=k=='hook'?'WEEKLY · 23–29 NOV':'LOVE · 4/5'; $('tag').style.opacity=R(lt,.05,.3); $('tag').style.transform=`translateX(${(1-R(lt,.05,.35))*-60}px)`;
  $('stack').innerHTML=LINES[k].map(([w,a,sz,gold])=>{const p=R(lt,a,a+.22), b=R(lt,a+.15,a+.45);
    return `<div style="position:relative;font:400 ${sz}px/0.9 Bebas;letter-spacing:2px;color:${gold&&b>.5?'#0b0b0b':'#fff'};opacity:${p>0?1:0};transform:translateY(${(1-p)*80}px) skewX(${(1-p)*-10}deg);filter:blur(${(1-p)*10}px);margin-top:6px;width:fit-content;padding:0 14px">
      ${gold?`<div style="position:absolute;left:0;top:8%;height:84%;width:100%;background:#f2c14e;transform-origin:left;transform:scaleX(${b});z-index:-1"></div>`:''}<span style="position:relative">${w}</span></div>`}).join('');
};"""

# ---------- C: tarot deck ----------
C_HTML = """<div id="st"><canvas id="sky" width="1080" height="1920" class="full"></canvas><div id="grain"></div>
<div class="ab" id="head" style="left:0;width:1080px;top:110px;text-align:center;font:600 46px Cinzel;letter-spacing:12px;color:#d8b65c"></div>
<div class="ab" id="scene" style="left:160px;top:250px;width:760px;height:1250px;perspective:2600px">
 <div id="card" style="position:absolute;inset:0;transform-style:preserve-3d">
  <div id="front" class="full" style="backface-visibility:hidden;border-radius:30px;overflow:hidden;background:#0b0906">
    <img class="clip" id="clip" style="position:absolute;left:34px;top:120px;width:692px;height:960px;object-fit:cover;border-radius:6px">
    <div class="full" style="border:3px solid #d8b65c;border-radius:30px;box-shadow:inset 0 0 0 14px #0b0906,inset 0 0 0 16px #8a6f2e"></div>
    <div class="ab" id="num" style="left:0;width:760px;top:34px;text-align:center;font:700 64px Cinzel;color:#d8b65c"></div>
    <div class="ab" id="name" style="left:60px;width:640px;top:1110px;text-align:center;font:700 70px Cinzel;letter-spacing:6px;-webkit-background-clip:text;background-clip:text;color:transparent"></div></div>
  <div class="full" style="backface-visibility:hidden;transform:rotateY(180deg);border-radius:30px;background:repeating-linear-gradient(45deg,#14100a 0 18px,#1d160c 18px 36px);border:3px solid #d8b65c;display:flex;align-items:center;justify-content:center">
    <div style="width:300px;height:300px;border-radius:50%;border:4px solid #d8b65c;color:#d8b65c;font:200px/300px 'DejaVu Sans';text-align:center">&#9806;&#xFE0E;</div></div></div></div>
<div class="ab" id="line" style="left:60px;width:960px;top:1560px;text-align:center;font:italic 500 92px/1.1 Cormorant;color:#f4ead6"></div>
<div class="ab" id="line2" style="left:0;width:1080px;top:1720px;text-align:center;font:600 46px Cinzel;letter-spacing:8px;color:#e8c66a"></div></div>"""
C_JS = r"""
const S=$('sky').getContext('2d'); let s2=5; const rn=()=>{s2=(s2*16807)%2147483647;return s2/2147483647}; const ST=[...Array(300)].map(()=>({x:rn()*1080,y:rn()*1920,r:rn()*2+.4,p:rn()*6.3}));
const CON=[[60,1500],[90,900],[140,420],[300,190],[430,230],[560,150],[760,200],[960,420],[1010,900],[1030,1480]];
function sky(t,k){S.fillStyle='#030305';S.fillRect(0,0,1080,1920); ST.forEach(s=>{const a=.3+.7*Math.pow(.5+.5*Math.sin(t*1.7+s.p),3); S.fillStyle=`rgba(255,244,220,${a})`; S.beginPath(); S.arc(s.x,s.y,s.r,0,6.3); S.fill();});
  const p=cl((t-.2)/2.5,0,1)*(CON.length-1); S.strokeStyle='rgba(216,182,92,.55)'; S.lineWidth=2; S.beginPath(); S.moveTo(...CON[0]);
  for(let i=1;i<CON.length;i++){if(p>=i)S.lineTo(...CON[i]); else if(p>i-1){const f=p-i+1;S.lineTo(CON[i-1][0]+(CON[i][0]-CON[i-1][0])*f,CON[i-1][1]+(CON[i][1]-CON[i-1][1])*f);break}} S.stroke();
  CON.forEach((c,i)=>{if(p>=i-0.01){S.fillStyle='#f2d58a';S.beginPath();S.arc(c[0],c[1],5,0,6.3);S.fill()}});}
window.render=async function(t){const rid=++RID; const k=t<D.love.t0?'hook':'love', lt=t-D[k].t0; await frame($('clip'),k,lt); if(rid!==RID)return;
  sky(t,k); grain(t);
  const flip=inout((lt-.15)/.9); $('card').style.transform=`rotateY(${(180-180*flip).toFixed(2)}deg) translateZ(0)`; $('scene').style.transform=`translateY(${(1-out(lt/.6))*60}px) scale(${(0.96+0.04*out(lt/.8)).toFixed(3)})`;
  $('clip').style.transform=`scale(${((k=='hook'?1.95:1.0)-0.03*ease(lt/3.5)).toFixed(4)}) translateY(${k=='hook'?60:0}px)`;
  $('num').textContent=k=='hook'?'VII':'VI'; const nm=k=='hook'?'LIBRA':'THE LOVERS'; $('name').textContent=nm;
  const sh=((t*0.45)%1.6)*100-30; $('name').style.backgroundImage=`linear-gradient(100deg,#a8873a ${sh-25}%,#fff3c4 ${sh}%,#a8873a ${sh+25}%)`;
  $('head').textContent=k=='hook'?'WEEKLY READING · 23–29 NOV':'LOVE'; $('head').style.opacity=R(lt,.1,.6);
  const L=$('line'), L2=$('line2'); L.textContent=k=='hook'?'Charm & luck, together.':'Speak your heart.'; L.style.opacity=R(lt,1.0,1.6); L.style.transform=`translateY(${(1-R(lt,1.0,1.7))*30}px)`;
  L2.textContent=k=='hook'?'CAREFUL ON TUE & WED':'YOUR CHARM GROWS'; L2.style.opacity=R(lt,1.8,2.4);
};"""

for name, html, js in (("A", A_HTML, A_JS), ("B", B_HTML, B_JS), ("C", C_HTML, C_JS)):
    page = f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}</style></head><body>{html}
<script>{COMMON_JS.replace('__DATA__', json.dumps(DATA))}{js}window.DUR=DUR; render(0);</script></body></html>"""
    open(f"{OUT}/{name}.html", "w").write(page)
print("ok")
