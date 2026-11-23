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
B=[ # id, who, file/source (None = no voice, silent event of that length), tempo, line, picture, camera, sound
('M01','Monty',T('v7_M01'),1.12,'Dono ka mulank ek… phir uska sab sahi kaise, mera nahi?!',"Rooftop night. Monty's phone: friend's story (face not shown), new car, '2026 ✓'. Frame 0: jealous side-eye, smoke from his head. Hook text 'SAME MULANK, ALAG KISMAT?' from frame 0.",'Starts on the phone, pulls back to Monty.','Phone ding.'),
('MEME1','Monty',('emotional-damage-meme.mp3',0,3.3),1.0,'Emotional damage!',"MEME (original Steven He audio), Monty lip-syncs: hand on heart, knees buckle, then full wail. Vishnu ji not on screen.",'Punch-in on Monty.','Vine boom.'),
('V03','Vishnu ji',T('V03_b'),1.30,'Arre, mulank same hai… saal nahi.',"Vishnu ji on his cloud: popcorn, eyebrow up, quick wink.",'Push in.','Chime, munch.'),
('M04','Monty',T('v7_M04'),1.12,'Saal ka kya logic hai? Sab toh mulank-mulank karte rehte hain!',"Monty confused, arms out.",'Close on Monty.','Boing.'),
('V06','Vishnu ji',T('v7_V06'),1.25,'Personal year: date + month + saal… single digit tak jodo.',"Sakshi (assistant, no line) switches on the BIG SCREEN at the start. Big screen in large digits: 'DATE + MONTH + SAAL', then '2026 = 2+0+2+6 = 10 → 1'. Vishnu ji's chakra points like a teacher's pointer.",'Screen big in frame.','Ticks.'),
('V07','Vishnu ji',T('v7_V07'),1.25,'Uska: 1, 2, 4, 1… 8. Tera: 3, 3, 1… 7. Haan beta, 7. Rona mana hai.',"Big screen builds '12 APR → 1+2+4+1 = 8' (gold 8) and '3 MAR → 3+3+1 = 7'. Monty sulks at 8, lip trembles at 7; Vishnu ji teasing grin on 'rona mana hai'.",'Screen + Monty.','Abacus ticks, ding.'),
('V08','Vishnu ji',T('v7_V08'),1.25,'Numerology mein 8 matlab result ka saal. 7 matlab ruk ke, khud pe kaam karne ka saal.',"Label 'In numerology'. Screen: trophy on 8; lamp and book on 7. Sakshi gives Monty a sympathetic pout.",'Vishnu ji + screen.','Soft chime.'),
('M09','Monty',T('v7_M09'),1.12,'Matlab wo party kare, main meditation?!',"Monty cries under a tiny rain cloud.",'Close on Monty.','Our sad trombone.'),
('FLIP',None,None,1.6,None,"Year flip: Vishnu ji flicks his chakra; the big screen's '2026' tears away like a calendar page, '2027' shows, fireworks. Monty looks up, hopeful.",'Wide.','Paper rip, whoosh, firework pops.'),
('V11','Vishnu ji',('take','v7_V11',0,5.75),1.25,'2027 ka number 2. Tera 3, 3, 2… 8!',"Big screen recalculates: TUM → 3+3+2 = 8 (gold), WOH → 1+2+4+2 = 9. Monty cheers.",'Screen + Monty.','Flip whooshes, ding.'),
('V12','Vishnu ji',T('v7_V12'),1.25,'Uska 9: purana samet ke, safai ka saal. Aur tera 8? Result… mehnat ka. Lottery nahi.',"WOH profile packs old boxes, broom sweeps (calm). Bricks stack by Monty, a lottery ticket floats away. Label 'In numerology'.",'Vishnu ji + Monty.','Brick thumps.'),
('M13','Monty',T('v7_M13'),1.12,'Mehnat?!',"Monty's cheer drops into shock.",'Crash zoom on Monty.','Record scratch.'),
('MEME3','Vishnu ji',('ab-tu-gaya-beta-puneet.mp3',2.48,3.88),1.0,'Ab tu gaya beta!',"MEME (original Puneet Superstar audio), Vishnu ji lip-syncs to Monty with a playful grin; Sakshi giggles by the screen.",'Push in on Vishnu ji.','Vine boom.'),
('V14','Vishnu ji',T('V14_b'),1.10,'Mulank batata hai tum kaun ho… personal year, mausam kaisa hai.',"Vishnu ji serene, slow push-in. Label 'In numerology'.",'Slow push-in.','Warm swell.'),
('K15','Sakshi',('concat',[('v8_K15a',0,None),('K15_a',3.70,None)]),1.15,'Jisko mulank ka keeda hai, usko bhejo! Poori 2027 guide ke liye, link pe click karo.',"Sakshi winks; send arrow, then link chip. No deity.",'Sakshi close.','Send whoosh.'),
]
GAP=0.15; t=0.0; beats=[]; cue=[]; track=[]; ref=None
for i,(bid,who,src,tempo,line,pic,camr,snd) in enumerate(B):
    if src is None:
        s=round(t,2); e=round(t+tempo,2)
        beats.append({'id':bid,'type':'event','start':s,'end':e,'who':None,'line':None,'picture':pic,'camera':camr,'sound':snd,'voice_file':None,'n':i+1}); t=e+GAP; continue
    if isinstance(src,tuple) and src[0]=='take': x=squeeze(load(T(src[1]),src[2],src[3],tempo=tempo))
    elif isinstance(src,tuple) and src[0]=='concat': x=squeeze(np.concatenate([np.concatenate([load(T(n),a0,b0,tempo=tempo),np.zeros(int(0.18*SR),np.float32)]) for n,a0,b0 in src[1]]))
    elif isinstance(src,tuple): x=load(os.path.join(MEM,src[0]),src[1],src[2])
    else: x=squeeze(load(src,tempo=tempo))
    if ref is None: ref=rms(x)
    x=x*(ref/rms(x)) if bid.startswith('MEME') else x
    s=round(t,2); e=round(t+len(x)/SR,2)
    wavfile.write(os.path.join(V,'voices','lines',bid+'.wav'),SR,(np.clip(x,-1,1)*32767).astype(np.int16))
    track.append((int(s*SR),x))
    # caption chunks split at sentence-ish breaks, timed by characters
    parts=[p.strip() for p in line.replace('… ','…|').replace('! ','!|').replace(', ',',|').replace('. ','.|').replace('? ','?|').replace(': ',':|').split('|') if p.strip()]
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
meta={'title':'Same Mulank, alag saal — 2026 → 2027','channel':'Tarot Talk By Sakshi (Instagram Reels)','version':'v7.2 voice cut','runtime_s':end,'format':'1080x1920, 24 fps, 9:16','language':'Hindi/Hinglish voice, Hinglish on-screen text','cta':'send to someone who needs it + link to the complete 2027 guide','safe_zones_px':{'top':250,'bottom':400,'right':150},'text_rules':'min 48 px, max 2 text items on screen, captions count'}
json.dump({'meta':meta,'beats':beats},open(os.path.join(V,'script.json'),'w'),indent=1,ensure_ascii=False)
print('runtime',end,'beats',len(beats))
for b in beats: print(f"{b['id']:7s} {b['start']:6.2f}-{b['end']:6.2f} {b['who'] or ''}")
