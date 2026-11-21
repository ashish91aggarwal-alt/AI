"""Daily horoscope video page (1080x1920). Reads timeline.json, writes daily.html exposing window.render(t).
Frames are captured by frames.js, so no model draws frames. usage: python3 daily_video.py <folder>"""
import json, sys
DIR = sys.argv[1]
TL = json.load(open(f"{DIR}/timeline.json"))
W, H = 1080, 1920
INK, CORAL, RED, CREAM, GOLD = "#2b2140", "#ff5a4d", "#e63946", "#fff3df", "#f5a700"
ELEM = {"fire": ("#ffe9dc", "#ff5a3c"), "earth": ("#e9f6e2", "#2e9e5b"), "air": ("#fff7d1", "#e39a00"), "water": ("#e3f1ff", "#2f7de1")}
GLYPH = dict(zip("aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces".split(), "♈♉♊♋♌♍♎♏♐♑♒♓"))
for s in TL["shots"]:
    if s["kind"] == "sign":
        s["bg"], s["accent"] = ELEM[s["element"]]; s["glyph"] = GLYPH[s["id"]] + "︎"
        if s["tag"] == "STAY QUIET": s["bg"], s["accent"] = RED, "#fff"

ICONS = f"""
<g id="ic_star"><path d="M0,-150 L42,-48 L152,-46 L66,22 L96,130 L0,68 L-96,130 L-66,22 L-152,-46 L-42,-48Z" fill="{GOLD}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/></g>
<g id="ic_moon"><path d="M60,-130 A140,140 0 1 0 130,60 A105,105 0 0 1 60,-130Z" fill="#ffd66b" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/><circle cx="110" cy="-110" r="12" fill="{INK}"/><circle cx="150" cy="-40" r="8" fill="{INK}"/></g>
<g id="ic_chat"><path d="M-150,-110 h220 a40,40 0 0 1 40,40 v90 a40,40 0 0 1 -40,40 h-120 l-70,60 v-60 h-30 a40,40 0 0 1 -40,-40 v-90 a40,40 0 0 1 40,-40Z" fill="#fff" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>
  <circle cx="-90" cy="-25" r="17" fill="{INK}"/><circle cx="-30" cy="-25" r="17" fill="{INK}"/><circle cx="30" cy="-25" r="17" fill="{INK}"/></g>
<g id="ic_case"><rect x="-150" y="-80" width="300" height="200" rx="28" fill="#c98a4b" stroke="{INK}" stroke-width="12"/><path d="M-55,-80 v-40 h110 v40" fill="none" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/><rect x="-150" y="-5" width="300" height="14" fill="{INK}"/><rect x="-24" y="-22" width="48" height="48" rx="10" fill="{GOLD}" stroke="{INK}" stroke-width="10"/></g>
<g id="ic_coin"><circle r="140" fill="{GOLD}" stroke="{INK}" stroke-width="12"/><circle r="100" fill="none" stroke="{INK}" stroke-width="8"/><text y="52" font-family="Anton" font-size="150" fill="{INK}" text-anchor="middle">$</text></g>
<g id="ic_heart"><path d="M0,130 C-190,10 -150,-150 -60,-130 C-20,-122 0,-90 0,-70 C0,-90 20,-122 60,-130 C150,-150 190,10 0,130Z" fill="#ff4d6d" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/></g>
<g id="ic_house"><path d="M-160,-10 L0,-150 L160,-10" fill="none" stroke="{INK}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><rect x="-115" y="-20" width="230" height="160" fill="#fff" stroke="{INK}" stroke-width="12"/><rect x="-32" y="40" width="64" height="100" fill="{CORAL}" stroke="{INK}" stroke-width="10"/></g>
<g id="ic_mute"><path d="M-150,-110 h260 a40,40 0 0 1 40,40 v90 a40,40 0 0 1 -40,40 h-120 l-70,60 v-60 h-70 a40,40 0 0 1 -40,-40 v-90 a40,40 0 0 1 40,-40Z" fill="#fff" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>
  <path d="M-60,-80 L60,30 M60,-80 L-60,30" stroke="{RED}" stroke-width="34" stroke-linecap="round"/></g>
"""
rays = "".join(f'<path d="M0,0 L{-26},{-330} L{26},{-330}Z" fill="{GOLD}" opacity="0.5" transform="rotate({k*30})"/>' for k in range(12))
svg = f"""<svg id="gfx" xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<g id="rays" transform="translate(540,380)"><g id="raysr">{rays}</g></g>
<g id="conf"></g>
<g id="glyph"><circle id="gc" r="150" fill="#fff" stroke="{INK}" stroke-width="12"/><text id="gt" y="62" font-family="DejaVu Sans" font-size="180" text-anchor="middle" fill="{INK}"></text></g>
<g id="dots"></g>
<g id="icon">{ICONS}</g>
</svg>"""

JS = r"""
const TL=__TL__, W=1080, H=1920, DUR=TL.total, INK='#2b2140';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);}, ramp=(t,a,b)=>ease((t-a)/(b-a));
const back=x=>{x=clamp(x,0,1);const c=2.2;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);};
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg';
const signs=TL.shots.filter(s=>s.kind=='sign');
// progress dots: one per sign
signs.forEach((s,i)=>{const c=document.createElementNS(NS,'circle');c.id='dot'+i;c.setAttribute('cx',540+(i-5.5)*70);c.setAttribute('cy',130);$('dots').appendChild(c);});
// confetti pieces for good-news cards
for(let i=0;i<36;i++){const r=document.createElementNS(NS,'rect');r.id='cf'+i;r.setAttribute('width',22);r.setAttribute('height',34);r.setAttribute('rx',6);
  r.setAttribute('fill',['#f5a700','#ff5a4d','#2f7de1','#2e9e5b'][i%4]);$('conf').appendChild(r);}
const fit=(txt,px,maxw)=>Math.min(px,Math.floor(maxw/(Math.max(txt.length,1)*0.56)));
function line(el,txt,y,px,color,t,at,opts){opts=opts||{};el.textContent=txt;const f=opts.wrap?px:fit(txt,px,980);el.style.fontSize=f+'px';el.style.color=color;
  el.style.top=(y-f*0.62)+'px';const on=t>=at;el.style.opacity=on?1:0;el.style.whiteSpace=opts.wrap?'normal':'nowrap';
  if(on){const k=back((t-at)/0.16);el.style.transform=`scale(${(1.7-0.7*k).toFixed(3)})`;}}
const L=[0,1,2,3].map(i=>$('L'+i));
window.render=function(t){
  const s=TL.shots.find(s=>t<s.end)||TL.shots[TL.shots.length-1], lt=t-s.start, si=TL.shots.indexOf(s);
  const quiet=s.tag=='STAY QUIET', good=s.tag=='GOOD NEWS';
  $('bg').style.background=s.kind=='hook'?'#ff5a4d':(s.kind=='cta'?'#fff3df':s.bg);
  $('flash').style.opacity=si>0?0.8*(1-ramp(lt,0,0.14)):0;
  let hit=0; s.lines.forEach((l,i)=>{if(i<2||s.kind!='sign')hit=Math.max(hit,(t>=l.at?Math.exp(-(t-l.at)/0.09):0));});
  const amp=(s.kind=='hook'||quiet?24:10)*hit, zoom=1+0.07*(1-ramp(lt,0,0.22));
  $('shake').style.transform=`translate(${(amp*Math.sin(t*97)).toFixed(1)}px,${(amp*Math.cos(t*131)).toFixed(1)}px) scale(${zoom.toFixed(4)})`;
  L.forEach(el=>el.style.opacity=0); $('tag').style.opacity=0; $('date').style.opacity=0; $('brand').style.opacity=0;
  ['glyph','dots','icon','rays','conf'].forEach(id=>$(id).setAttribute('opacity',0));
  if(s.kind=='hook'){
    const ys=[470,760,1130,1420], px=[330,230,330,230], cs=['#fff',INK,'#fff',INK];
    s.lines.forEach((l,i)=>line(L[i],l.text,ys[i],px[i],cs[i],t,l.at));
    $('date').style.opacity=1; $('date').textContent='TODAY · '+TL.date_label; $('date').style.color='#fff';
  } else if(s.kind=='cta'){
    line(L[0],s.lines[0].text,560,330,'#ff5a4d',t,s.lines[0].at); line(L[1],s.lines[1].text,860,280,INK,t,s.lines[1].at);
    line(L[2],s.lines[2].text,1250,150,INK,t,s.lines[2].at); $('brand').style.opacity=ramp(t,s.lines[2].at,s.lines[2].at+0.3);
  } else {
    const fg=quiet?'#fff':INK, ac=s.accent, idx=signs.indexOf(s);
    // progress dots
    $('dots').setAttribute('opacity',1);
    signs.forEach((q,i)=>{const d=$('dot'+i);d.setAttribute('r',i==idx?20:11);d.setAttribute('fill',i<idx?fg:(i==idx?ac:'none'));d.setAttribute('stroke',fg);d.setAttribute('stroke-width',4);});
    // glyph badge pops in; good news gets turning rays and confetti
    $('glyph').setAttribute('opacity',1); $('gt').textContent=s.glyph; $('gc').setAttribute('stroke',quiet?'#fff':INK);
    $('glyph').setAttribute('transform',`translate(540,380) scale(${back(lt/0.22).toFixed(3)})`);
    if(good){$('rays').setAttribute('opacity',ramp(lt,0.1,0.4)); $('raysr').setAttribute('transform',`rotate(${(lt*40).toFixed(1)}) scale(${(0.9+0.1*Math.sin(lt*6)).toFixed(3)})`);
      $('conf').setAttribute('opacity',1);
      for(let i=0;i<36;i++){const a=lt-0.3-(i%6)*0.05, el=$('cf'+i); if(a<0){el.setAttribute('opacity',0);continue;}
        const ang=-Math.PI/2+(i/36-0.5)*2.6, v=900+((i*37)%7)*90, x=540+Math.cos(ang)*v*a*0.55, y=380+Math.sin(ang)*v*a*0.9+900*a*a;
        el.setAttribute('opacity',y<H?1:0); el.setAttribute('transform',`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(a*500+i*40)%360})`);}}
    line(L[0],s.lines[0].text,690,240,ac,t,s.lines[0].at);
    const tg=$('tag'); tg.textContent=s.tag; const ta=s.start+0.32; tg.style.opacity=t>=ta?1:0; tg.style.background=good?'#f5a700':(quiet?'#fff':fg); tg.style.color=quiet?'#e63946':(good?INK:'#fff');
    tg.style.transform=`translate(-50%,0) scale(${t>=ta?back((t-ta)/0.18).toFixed(3):0})`;
    line(L[1],s.lines[1].text,1010,150,fg,t,s.lines[1].at);
    line(L[2],s.lines[2].text,1180,90,fg,t,s.lines[2].at,{wrap:true});
    // icon pops with the headline, then keeps a small beat pulse
    const ia=s.lines[1].at+0.12; $('icon').setAttribute('opacity',t>=ia?1:0);
    document.querySelectorAll('#icon>g').forEach(g=>g.setAttribute('opacity',g.id=='ic_'+s.icon?1:0));
    const beat=1+0.07*Math.pow(Math.abs(Math.sin(Math.PI*t/0.5)),6), bob=10*Math.sin(t*3);
    $('icon').setAttribute('transform',`translate(540,${(1490+bob).toFixed(1)}) scale(${(0.85*back((t-ia)/0.2)*beat).toFixed(3)})`);
  }
};
window.DUR=DUR; render(0);
"""
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
html,body{{margin:0;background:#000}} #stage{{position:relative;width:{W}px;height:{H}px;overflow:hidden}}
#bg,#shake,#flash{{position:absolute;inset:0}} #flash{{background:#fff;opacity:0}} #shake>svg{{position:absolute;left:0;top:0}}
.ln{{position:absolute;left:50px;width:980px;text-align:center;font-family:Anton;line-height:1.22;letter-spacing:3px;opacity:0;transform-origin:50% 55%}}
#tag{{position:absolute;left:50%;top:795px;font:800 62px Poppins;letter-spacing:6px;padding:10px 44px;border-radius:60px;opacity:0;white-space:nowrap;transform-origin:50% 50%}}
#date{{position:absolute;left:0;width:{W}px;top:170px;text-align:center;font:800 58px Poppins;letter-spacing:8px;opacity:0}}
#brand{{position:absolute;left:0;width:{W}px;top:1480px;text-align:center;font:800 50px Poppins;letter-spacing:8px;color:{INK};opacity:0}}
</style></head><body><div id="stage"><div id="bg"></div><div id="shake">{svg}
<div class="ln" id="L0"></div><div class="ln" id="L1"></div><div class="ln" id="L2"></div><div class="ln" id="L3"></div>
<div id="tag"></div><div id="date"></div><div id="brand">TAROT TALK BY SAKSHI</div></div><div id="flash"></div></div>
<script>{JS.replace('__TL__', json.dumps(TL))}</script></body></html>"""
open(f"{DIR}/daily.html", "w").write(html)
print("ok", TL["total"])
