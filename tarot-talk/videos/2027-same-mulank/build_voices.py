"""python3 build_voices.py  —  builds videos/2027-same-mulank voice package from the picked ElevenLabs takes + original meme clips."""
import json, os, csv, subprocess, numpy as np
from scipy.io import wavfile
SR=48000; V=os.path.dirname(os.path.abspath(__file__))
MEM=os.path.join(V,'..','..','assets','audio','memes')
os.makedirs(os.path.join(V,'voices','lines'),exist_ok=True)
def load(p,a=0,b=None,tempo=1.0):
    af=f'atempo={tempo}' if abs(tempo-1)>1e-3 else 'anull'
    x=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-af',af,'-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout,np.float32).copy()
    x=x[int(a*SR/tempo):None if b is None else int(b*SR/tempo)]
    e=np.sqrt(np.convolve(x**2,np.ones(480)/480,'same')); on=np.where(e>0.015)[0]
    x=x[max(0,on[0]-960):on[-1]+2400] if len(on) else x
    n=480; x[:n]*=np.linspace(0,1,n); x[-n*4:]*=np.linspace(1,0,n*4); return x
def squeeze(x,maxp=0.22):
    """shorten internal pauses longer than maxp s (keeps maxp of silence, short crossfade)"""
    e=np.sqrt(np.convolve(x**2,np.ones(480)/480,'same')); quiet=e<0.012; out=[]; i=0; N=len(x); keep=int(maxp*SR)
    while i<N:
        if quiet[i]:
            j=i
            while j<N and quiet[j]: j+=1
            seg=x[i:j]
            if len(seg)>keep: seg=np.concatenate([seg[:keep//2],seg[-keep//2:]])
            out.append(seg); i=j
        else:
            j=i
            while j<N and not quiet[j]: j+=1
            out.append(x[i:j]); i=j
    return np.concatenate(out)
def rms(x): return float(np.sqrt(np.mean(x[np.abs(x)>0.01]**2)+1e-12))
T=lambda n:os.path.join(V,'voices','takes',n+'.mp3')
B=[ # id, who, file/source, tempo, line (Hinglish for captions), picture, camera, sound
('M01','Monty',T('M01_b'),1.12,'Same Mulank… phir uska sab sahi kaise, mera nahi?!',"Rooftop night. Monty's phone shows a friend's story (face not shown): new car, '2026 ✓'. Frame 0: Monty's jaw half dropped, thin smoke from his head; then his arm drops. Hook text 'SAME MULANK, ALAG KISMAT?' from frame 0, 'Tumhare saath bhi hua?' at 1.5 s.",'Starts on the phone, pulls back to Monty.','Phone ding.'),
('MEME1','Monty',('emotional-damage-meme.mp3',0,3.3),1.0,'Emotional damage!',"MEME (original Steven He audio), Monty lip-syncs: clutches chest, knees wobble, crack runs across his phone. Vishnu ji NOT on screen.",'Punch-in on Monty.','Vine boom at the end.'),
('V03','Vishnu ji',T('V03_b'),1.30,'Arre, mulank same hai… saal nahi.',"First time we see Vishnu ji on his cloud: popcorn flies into his mouth, eyebrow up.",'Push in on Vishnu ji.','Chime, munch.'),
('M04','Monty',T('M04_b'),1.12,'Saal ka kya lena-dena?!','Monty shock pose (spikes).','Close on Monty.','Boing.'),
('K05','Sakshi',T('K05_a'),1.15,'Maan lo, do log. Dono ka mulank 3.',"Sakshi walks in (two side-steps), cards float by her hand. Two big cards pop with silhouette faces: 'WOH · 12 APRIL' and 'TUM · 3 MARCH', both stamped 'MULANK 3'. Small tag 'Example'.",'Two-shot Sakshi + Monty, cards on top.','Anime wow on entry, card pops.'),
('K06','Sakshi',T('K06_a'),1.15,'Personal year: date + month + saal… single digit tak jodo.',"On screen: 'DATE + MONTH + SAAL', then '2026 = 2+0+2+6 = 10 → 1' and '15 → 1+5 = 6'.",'Sakshi close.','Ticks.'),
('K07','Sakshi',T('K07_b'),1.15,'Uska: 1, 2, 4, 1… 8. Tumhara: 3, 3, 1… 7.',"Cards build: '12 APR → 1+2+4+1 = 8' (gold 8 pops on WOH), '3 MAR → 3+3+1 = 7' (quiet 7 on TUM).",'Cards full width.','Abacus ticks, ding.'),
('K08','Sakshi',T('K08_a'),1.15,'Numerology mein 8 matlab result ka saal. 7 matlab ruk ke, andar kaam karne ka saal.',"Label 'In numerology'. Trophy on 8; lamp and book on 7. Monty slumps, tiny rain cloud over only him.",'Two-shot.','Our sad trombone at the slump.'),
('MEME2','Monty',('climax-abhi-baaki-hai-carryminati.mp3',0,3.4),1.0,'Aur bhai ruko… climax abhi baaki hai!',"MEME (original CarryMinati audio), Monty lip-syncs: palm up on 'ruko', grin on 'climax'. Behind him the wall calendar's 2026 page tears off by itself, 2027 underneath, fireworks.",'Wide rooftop, calendar on the wall.','Paper rip, whoosh, firework pops.'),
('K10','Sakshi',T('K10_b'),1.15,'2027 mein plus 2. Ab tumhara 8, uska 9.',"Cards flip: TUM → 8 (gold), WOH → 9.",'Cards full width.','Flip whooshes.'),
('MEME3','Monty',('ab-tu-gaya-beta-puneet.mp3',2.48,3.88),1.0,'Ab tu gaya beta!',"MEME (original Puneet Superstar audio), Monty lip-syncs with an evil grin, chin toward the WOH card (no finger pointing).",'Crash zoom on Monty.','Vine boom.'),
('K12','Sakshi',T('K12_a'),1.15,'Arre, 9 bura nahi. Purana samet ke, saaf karne ka saal.',"On the WOH card old boxes pack themselves and a broom sweeps (calm).",'Sakshi + card.','Soft swish.'),
('K13','Sakshi',T('K13_b'),1.15,'Aur 8 matlab mehnat ka result… lottery nahi.',"Bricks stack beside Monty; a lottery ticket floats away. Label 'In numerology'.",'Two-shot.','Brick thumps.'),
('V14','Vishnu ji',T('V14_b'),1.10,'Mulank batata hai tum kaun ho… personal year, mausam kaisa hai.',"Vishnu ji serene, chakra spins slowly behind him; sun and rain icons swap over a small Monty. Label 'In numerology'.",'Slow push-in.','Warm swell.'),
('K15','Sakshi',T('K15_a'),1.15,'Jiska mulank same par haal alag, usse bhejo. Poori 2027 guide ke liye, link pe click karo.',"Sakshi winks; big send arrow, then link chip. No deity. On screen 'SEND IT TO SOMEONE WHO NEEDS IT' then 'COMPLETE GUIDE → LINK'.",'Sakshi close → two-shot.','Send whoosh.'),
]
GAP=0.15; t=0.0; beats=[]; cue=[]; track=[]; ref=None
for i,(bid,who,src,tempo,line,pic,camr,snd) in enumerate(B):
    if isinstance(src,tuple): x=load(os.path.join(MEM,src[0]),src[1],src[2])
    else: x=squeeze(load(src,tempo=tempo))
    if ref is None: ref=rms(x)
    x=x*(ref/rms(x)) if bid.startswith('MEME') else x
    s=round(t,2); e=round(t+len(x)/SR,2)
    wavfile.write(os.path.join(V,'voices','lines',bid+'.wav'),SR,(np.clip(x,-1,1)*32767).astype(np.int16))
    track.append((int(s*SR),x))
    # caption chunks split at sentence-ish breaks, timed by characters
    parts=[p.strip() for p in line.replace('… ','…|').replace('. ','.|').replace('? ','?|').replace(': ',':|').split('|') if p.strip()]
    merged=[]
    for p in parts:
        if merged and len(merged[-1])+len(p)<22: merged[-1]+=' '+p
        else: merged.append(p)
    tot=sum(len(p) for p in merged); c=s; ch=[]
    for p in merged:
        d=(e-s)*len(p)/tot; ch.append({'text':p,'from':round(c,2),'to':round(c+d,2)}); c+=d
    beats.append({'id':bid,'type':'line','start':s,'end':e,'who':who,'line':line,'caption_chunks':ch,'picture':pic,'camera':camr,'sound':snd,'voice_file':f'voices/lines/{bid}.wav','meme':bid.startswith('MEME'),'n':i+1})
    cue.append([bid,who,s,e,f'voices/lines/{bid}.wav',line])
    t=e+GAP
end=round(t+2.0,2)
beats.append({'id':'endcard','type':'event','start':round(t,2),'end':end,'who':None,'line':None,'picture':"Monty taps send and grins; Vishnu ji munches popcorn. Card: 'Send to someone who needs it · Complete guide: link'. Loops to frame 0.",'camera':'Wide.','sound':'Send whoosh.','voice_file':None,'n':len(B)+1})
y=np.zeros(int(end*SR)+SR,np.float32)
for a,x in track: y[a:a+len(x)]+=x
y=y[:int(end*SR)]
wavfile.write(os.path.join(V,'voices','voice_track_timed.wav'),SR,(np.clip(y,-1,1)*32767).astype(np.int16))
with open(os.path.join(V,'voices','cue_sheet.csv'),'w',newline='') as f:
    w=csv.writer(f); w.writerow(['id','who','start_s','end_s','file','line']); w.writerows(cue)
meta={'title':'Same Mulank, alag saal — 2026 → 2027','channel':'Tarot Talk By Sakshi (Instagram Reels)','version':'v6 voice cut','runtime_s':end,'format':'1080x1920, 24 fps, 9:16','language':'Hindi/Hinglish voice, Hinglish on-screen text','cta':'send to someone who needs it + link to the complete 2027 guide','safe_zones_px':{'top':250,'bottom':400,'right':150},'text_rules':'min 48 px, max 2 text items on screen, captions count'}
json.dump({'meta':meta,'beats':beats},open(os.path.join(V,'script.json'),'w'),indent=1,ensure_ascii=False)
print('runtime',end,'beats',len(beats))
for b in beats: print(f"{b['id']:7s} {b['start']:6.2f}-{b['end']:6.2f} {b['who'] or ''}")
