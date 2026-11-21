"""One-sign horoscope video page (1080x1920). Reads <folder>/timeline.json, writes <folder>/sign.html with window.render(t).
usage: python3 sign_video.py <folder>"""
import json, sys, random
DIR = sys.argv[1]
TL = json.load(open(f"{DIR}/timeline.json"))
W, H = 1080, 1920
INK = "#2b2140"
ELEM = {"fire": ("#fff3e8", "#ffd2bd", "#ff4f33"), "earth": ("#f3fbec", "#cfeac0", "#2a9a57"), "air": ("#fffbe3", "#ffe9a6", "#e09400"), "water": ("#eef7ff", "#c6e2ff", "#2a76e0")}
SIGNS = "aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces".split()
GLYPH = dict(zip(SIGNS, "♈♉♊♋♌♍♎♏♐♑♒♓"))
CONST = {"aries": [(-310, 90), (-70, -40), (120, -20), (240, 70)], "libra": [(-300, 110), (-90, 40), (60, -120), (250, -20), (200, 120)]}
HI = {"DO": "करें", "DON'T": "न करें", "COLOUR": "शुभ रंग", "NUMBER": "शुभ अंक", "BEST TIME": "सबसे अच्छा समय"}
SW = {"सफेद": "#ffffff", "गुलाबी": "#ff8fb8", "लाल": "#e63946", "पीला": "#ffd23f", "हरा": "#2a9a57", "नीला": "#2a76e0", "नारंगी": "#ff8a3d", "बैंगनी": "#7b4bd6"}
FD = __import__("os").path.abspath(f"{__import__("os").path.dirname(__file__)}/../node_modules/@fontsource")
sign = TL["sign"].lower()
bg0, bg1, AC = ELEM[TL["element"]]
random.seed(sum(map(ord, sign)))
pts = CONST.get(sign) or [(random.randint(-320, 320), random.randint(-120, 120)) for _ in range(5)]
TL.update(glyph=GLYPH[sign] + "︎", ac=AC, const=pts, lbl=HI if TL.get("language") == "hindi" else {}, sw=SW)
random.seed(4)
stars = "".join(f'<path class="tw" data-p="{random.random()*6.28:.2f}" transform="translate({random.randint(30, W-30)},{random.randint(40, H-60)}) scale({random.choice([0.5, 0.7, 1, 1.3])})" d="M0,-16 L4,-4 L16,0 L4,4 L0,16 L-4,4 L-16,0 L-4,-4Z" fill="{AC}"/>' for _ in range(46))

svg = f"""<svg id="gfx" xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs><radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<text id="wm" x="540" y="1250" font-family="DejaVu Sans" font-size="1500" text-anchor="middle" fill="{AC}" opacity="0.07"></text>
<g id="stars">{stars}</g>
<g id="cons" transform="translate(540,1620)"><path id="cline" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><g id="cst"></g></g>
<g id="badge"><circle r="170" fill="#fff" stroke="{INK}" stroke-width="14"/><text id="bt" y="68" font-family="DejaVu Sans" font-size="200" text-anchor="middle" fill="{INK}"></text></g>
<g id="orbit" transform="translate(540,600)"><circle r="420" fill="url(#glow)"/><circle r="300" fill="none" stroke="{INK}" stroke-width="6" stroke-dasharray="4 22" stroke-linecap="round"/>
  <circle r="150" fill="#fff" stroke="{INK}" stroke-width="12"/><text id="ot" y="62" font-family="DejaVu Sans" font-size="180" text-anchor="middle" fill="{INK}"></text>
  <g id="moon"><circle r="84" fill="#ffe9a8" stroke="{INK}" stroke-width="10"/><circle cx="26" cy="-18" r="64" fill="#fff7dc"/><circle cx="-30" cy="24" r="12" fill="#e9c877"/><circle cx="14" cy="40" r="8" fill="#e9c877"/></g></g>
</svg>"""

JS = r"""
const TL=__TL__, W=1080, H=1920, DUR=TL.total, INK='#2b2140', AC=TL.ac;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);}, ramp=(t,a,b)=>ease((t-a)/(b-a));
const back=x=>{x=clamp(x,0,1);const c=2.2;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2);};
const $=id=>document.getElementById(id), NS='http://www.w3.org/2000/svg', q=s=>document.querySelectorAll(s);
['wm','bt','ot'].forEach(id=>$(id).textContent=TL.glyph);
TL.const.forEach((p,i)=>{const c=document.createElementNS(NS,'path');c.id='cs'+i;c.setAttribute('d','M0,-30 L8,-8 L30,0 L8,8 L0,30 L-8,8 L-30,0 L-8,-8Z');c.setAttribute('fill','#fff');$('cst').appendChild(c);});
const fit=(txt,px,maxw)=>Math.min(px,Math.floor(maxw/(Math.max(txt.replace(/[\u0900-\u0903\u093A-\u094F\u0962\u0963]/g,'').length,1)*0.6)));
const Ls=[...q('.ln')], rows=[...q('.row')], cards=[...q('.card')], chips=[...q('.chip')];
function line(i,txt,y,px,color,t,at){const el=Ls[i];let f=fit(txt,px,980);el.textContent=txt;el.style.fontSize=f+'px';el.style.transform='none';const sw=el.scrollWidth;if(sw>960){f=Math.floor(f*960/sw);el.style.fontSize=f+'px';}el.style.color=color;el.style.top=(y-f*0.62)+'px';
  const on=t>=at;el.style.opacity=on?1:0;if(on)el.style.transform=`scale(${(1.7-0.7*back((t-at)/0.16)).toFixed(3)})`;}
const pop=(el,t,at,d)=>{const on=t>=at;el.style.opacity=on?1:0;if(on)el.style.transform=`scale(${back((t-at)/(d||0.2)).toFixed(3)})`;};
const LAY={hook:[[660,320,'#fff'],[1000,200,INK],[1270,240,'#fff']], why:[[1090,170,INK],[1290,160,AC],[1470,130,INK]], meters:[[330,190,INK]], lucky:[[330,180,INK]], cta:[[520,170,INK],[830,330,AC],[1260,125,INK]]};
window.render=function(t){
  const s=TL.shots.find(s=>t<s.end)||TL.shots[TL.shots.length-1], lt=t-s.start, si=TL.shots.indexOf(s), hook=s.id=='hook';
  $('bg').style.background=hook?`linear-gradient(160deg,${AC},#ff8a5c)`:`linear-gradient(${(170+20*Math.sin(t*0.4)).toFixed(1)}deg,__BG0__,__BG1__)`;
  $('flash').style.opacity=si>0?0.8*(1-ramp(lt,0,0.14)):0;
  let hit=0; s.cues.forEach(c=>{if(c.k=='L'||c.a=="DON'T")hit=Math.max(hit,(t>=c.at?Math.exp(-(t-c.at)/0.09):0));});
  const amp=(hook?24:11)*hit, zoom=1+0.07*(1-ramp(lt,0,0.22));
  $('shake').style.transform=`translate(${(amp*Math.sin(t*97)).toFixed(1)}px,${(amp*Math.cos(t*131)).toFixed(1)}px) scale(${zoom.toFixed(4)})`;
  $('prog').style.width=(100*t/(DUR-0.5)).toFixed(2)+'%'; $('prog').style.background=hook?'#fff':AC;
  // living background: twinkling stars and a slowly turning watermark glyph
  q('.tw').forEach(el=>{el.setAttribute('opacity',(0.25+0.55*Math.pow(0.5+0.5*Math.sin(t*2.2+ +el.dataset.p),2)).toFixed(2)); el.setAttribute('fill',hook?'#fff':AC);});
  $('wm').setAttribute('transform',`rotate(${(Math.sin(t*0.25)*6).toFixed(2)} 540 900)`); $('wm').setAttribute('fill',hook?'#fff':AC);
  Ls.forEach(el=>el.style.opacity=0); rows.forEach(el=>el.style.opacity=0); cards.forEach(el=>el.style.opacity=0); chips.forEach(el=>el.style.opacity=0);
  ['cons','badge','orbit'].forEach(id=>$(id).setAttribute('opacity',0)); $('brand').style.opacity=0; $('date').style.opacity=0;
  const L=s.cues.filter(c=>c.k=='L'); (LAY[s.id]||[]).forEach((a,i)=>{if(L[i])line(i,L[i].a,a[0],a[1],a[2],t,L[i].at);});
  if(hook){
    $('date').style.opacity=1;
    $('badge').setAttribute('opacity',1); $('badge').setAttribute('transform',`translate(540,330) scale(${(0.9*back(lt/0.25)).toFixed(3)})`);
    // the sign's constellation draws itself star by star
    $('cons').setAttribute('opacity',1); const P=TL.const, k=ramp(lt,0.3,2.2)*(P.length-1); let d='';
    P.forEach((p,i)=>{const st=$('cs'+i), on=k>=i-0.05; st.setAttribute('opacity',on?1:0); const tw=1+0.25*Math.sin(t*6+i);
      st.setAttribute('transform',`translate(${p[0]},${p[1]}) scale(${(on?back((k-i+0.05)/0.5)*tw:0).toFixed(3)})`);
      if(i==0)d=`M${p[0]},${p[1]}`; else if(k>=i)d+=` L${p[0]},${p[1]}`; else if(k>i-1){const f=k-(i-1),o=P[i-1];d+=` L${(o[0]+(p[0]-o[0])*f).toFixed(1)},${(o[1]+(p[1]-o[1])*f).toFixed(1)}`;}});
    $('cline').setAttribute('d',d);
  }
  if(s.id=='why'){
    $('orbit').setAttribute('opacity',1); const k=ease(lt/1.3), ang=(-200+150*k)*Math.PI/180, r=300-150*ramp(lt,1.0,1.5);
    $('moon').setAttribute('transform',`translate(${(r*Math.cos(ang)).toFixed(1)},${(r*Math.sin(ang)).toFixed(1)}) scale(${(1+0.12*Math.sin(t*7)*ramp(lt,1.4,1.6)).toFixed(3)})`);
    $('orbit').setAttribute('transform',`translate(540,600) scale(${(0.95+0.05*back(lt/0.3)).toFixed(3)})`);
  }
  if(s.id=='meters'){
    s.cues.filter(c=>c.k=='M').forEach((c,i)=>{const el=rows[i]; pop(el,t,c.at); el.style.top=(560+i*265)+'px';
      el.querySelector('.lab').textContent=c.a; const f=ease((t-c.at-0.1)/0.55)*c.b/5;
      el.querySelector('.fill').style.width=(100*f).toFixed(1)+'%'; el.querySelector('.num').textContent=Math.round(f*5)+'/5';
      el.querySelector('.fill').style.background=c.b>=4?'#1f9d6b':(c.b==3?'#f5a700':'#e63946');});
  }
  if(s.id=='do'){
    s.cues.forEach((c,i)=>{const el=cards[i], good=c.a=='DO'; pop(el,t,c.at,0.22); el.style.top=(380+i*590)+'px'; el.style.borderColor=good?'#1f9d6b':'#e63946';
      el.querySelector('.hd').textContent=(good?'✓ ':'✗ ')+(TL.lbl[c.a]||c.a); el.querySelector('.hd').style.background=good?'#1f9d6b':'#e63946'; el.querySelector('.tx').textContent=c.b;});
  }
  if(s.id=='lucky'){
    s.cues.filter(c=>c.k=='K').forEach((c,i)=>{const el=chips[i]; pop(el,t,c.at); el.style.top=(560+i*320)+'px'; el.querySelector('.kl').textContent=TL.lbl[c.a]||c.a;
      const v=el.querySelector('.kv'); v.textContent=c.b; v.style.fontSize=fit(c.b,190,620)+'px';
      const sw=el.querySelector('.sw'); sw.style.display=c.a=='COLOUR'?'block':'none'; sw.style.background=TL.sw[c.b]||c.b.toLowerCase();});
  }
  if(s.id=='cta'){ $('brand').style.opacity=ramp(t,s.cues[2].at,s.cues[2].at+0.3);
    $('badge').setAttribute('opacity',1); $('badge').setAttribute('transform',`translate(540,1560) scale(${(0.6*back(lt/0.25)*(1+0.06*Math.sin(t*8))).toFixed(3)})`); }
};
window.DUR=DUR; render(0);
"""
row = '<div class="row"><div class="lab"></div><div class="num"></div><div class="track"><div class="fill"></div></div></div>'
card = '<div class="card"><div class="hd"></div><div class="tx"></div></div>'
chip = '<div class="chip"><div class="kl"></div><div class="kvw"><div class="sw"></div><div class="kv"></div></div></div>'
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:"Baloo 2";font-weight:800;src:url("file://{FD}/baloo-2/files/baloo-2-devanagari-800-normal.woff2")}}
@font-face{{font-family:"Mukta";font-weight:700 800;src:url("file://{FD}/mukta/files/mukta-devanagari-800-normal.woff2")}}
html,body{{margin:0;background:#000}} #stage{{position:relative;width:{W}px;height:{H}px;overflow:hidden}}
#bg,#shake,#flash{{position:absolute;inset:0}} #flash{{background:#fff;opacity:0}} #shake>svg{{position:absolute;left:0;top:0}}
#progw{{position:absolute;left:60px;right:60px;top:70px;height:14px;border-radius:8px;background:rgba(43,33,64,.18)}} #prog{{height:100%;border-radius:8px;width:0}}
.ln{{position:absolute;left:50px;width:980px;text-align:center;font-family:Anton,"Baloo 2";font-weight:800;line-height:1.22;letter-spacing:3px;opacity:0;transform-origin:50% 55%;white-space:nowrap}}
#date{{position:absolute;left:0;width:{W}px;top:120px;text-align:center;font:800 50px Poppins,Mukta;letter-spacing:8px;color:#fff;opacity:0}}
#brand{{position:absolute;left:0;width:{W}px;top:1380px;text-align:center;font:800 46px Poppins;letter-spacing:8px;color:{INK};opacity:0}}
.row{{position:absolute;left:80px;width:920px;height:220px;opacity:0;transform-origin:50% 50%}}
.row .lab{{position:absolute;left:0;top:0;font:800 120px Anton,"Baloo 2";color:{INK};letter-spacing:3px}} .row .num{{position:absolute;right:0;top:0;font:400 120px Anton;color:{INK}}}
.row .track{{position:absolute;left:0;right:0;top:150px;height:60px;border-radius:30px;background:#fff;border:8px solid {INK};overflow:hidden}} .row .fill{{height:100%;width:0;border-radius:22px}}
.card{{position:absolute;left:70px;width:900px;height:500px;border:14px solid;border-radius:60px;background:#fff;opacity:0;transform-origin:50% 50%;box-shadow:0 18px 0 rgba(43,33,64,.18)}}
.card .hd{{position:absolute;left:40px;top:-60px;font:800 110px Anton,"Baloo 2";color:#fff;padding:6px 44px;border-radius:50px;letter-spacing:4px}}
.card .tx{{position:absolute;left:50px;right:50px;top:160px;font:800 104px/1.15 Poppins,Mukta;color:{INK}}}
.chip{{position:absolute;left:80px;width:920px;height:280px;opacity:0;transform-origin:50% 50%}}
.chip .kl{{font:800 78px Poppins,Mukta;letter-spacing:3px;color:{AC}}} .chip .kvw{{display:flex;align-items:center;gap:36px}} .chip .kv{{font-family:Anton,"Baloo 2";font-weight:800;color:{INK};letter-spacing:3px;line-height:1.1;white-space:nowrap}}
.chip .sw{{width:150px;height:150px;border-radius:50%;border:12px solid {INK};flex:none}}
</style></head><body><div id="stage"><div id="bg"></div><div id="shake">{svg}
{'<div class="ln"></div>' * 4}{row * 4}{card * 2}{chip * 3}
<div id="date">{TL['date_label']}</div><div id="brand">TAROT TALK BY SAKSHI</div><div id="progw"><div id="prog"></div></div></div><div id="flash"></div></div>
<script>{JS.replace('__TL__', json.dumps(TL)).replace('__BG0__', bg0).replace('__BG1__', bg1)}</script></body></html>"""
open(f"{DIR}/sign.html", "w").write(html)
print("ok", TL["total"])
