"""python3 build_voices.py — Aries 2027 voice package from the two one-take speaker blocks (natural flow, no speed-up).
Segments come from silence splits of voices/takes/{vishnu,sakshi}_block.mp3 (checked by transcription)."""
import json, os, csv, subprocess, re, numpy as np
from scipy.io import wavfile
SR=48000; V=os.path.dirname(os.path.abspath(__file__)); TK=os.path.join(V,'voices','takes')
os.makedirs(os.path.join(V,'voices','lines'),exist_ok=True)
TEMPO={'vishnu_block.mp3':1.15,'sakshi_block.mp3':1.12}   # pitch-kept tempo, so the pace sits near natural talk (~3 words/s)
def load(f):
    return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',os.path.join(TK,f),'-af',f'atempo={TEMPO[f]}','-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout,np.float32).copy()
def squeeze(x,maxp=0.16):
    e=np.sqrt(np.convolve(x**2,np.ones(480)/480,'same')); q=e<0.012; out=[]; i=0; N=len(x); keep=int(maxp*SR)
    while i<N:
        j=i
        while j<N and q[j]==q[i]: j+=1
        seg=x[i:j]
        if q[i] and len(seg)>keep: seg=np.concatenate([seg[:keep//2],seg[-keep//2:]])
        out.append(seg); i=j
    return np.concatenate(out)
def segs(f):
    out=subprocess.run(['ffmpeg','-v','info','-i',os.path.join(TK,f),'-af','silencedetect=noise=-38dB:d=0.3','-f','null','-'],capture_output=True,text=True).stderr
    st=[float(x) for x in re.findall(r'silence_start: ([0-9.]+)',out)]; en=[float(x) for x in re.findall(r'silence_end: ([0-9.]+)',out)]
    dur=len(load(f))/SR*TEMPO[f]; r=[]; a=0.0
    for s,e in zip(st,en):
        if s-a>0.15: r.append((a,s))
        a=e
    if dur-a>0.15: r.append((a,dur))
    return [(a/TEMPO[f],b/TEMPO[f]) for a,b in r]
TEMPO.update({'v8_vishnu.mp3':1.15,'v8_sakshi.mp3':1.12})
AUD={'V':load('vishnu_block.mp3'),'K':load('sakshi_block.mp3'),'V8':load('v8_vishnu.mp3'),'K8':load('v8_sakshi.mp3')}; SEG={'V':segs('vishnu_block.mp3'),'K':segs('sakshi_block.mp3'),'V8':segs('v8_vishnu.mp3'),'K8':segs('v8_sakshi.mp3')}
SRC={'K04':[('K8',0),('K8',1)],'V05':[('V8',0),('V8',1),('V8',2)],'K24':[('K8',2),('K',13)]}   # v8 (owner 24 Nov): new takes only where the line changed
MAP={'K01':[0,1],'V02':[0],'V03':[1],'K04':[2,3,4],'V05':[2,3,4,5],'V06':[6,7],'K07':[5],'V08':[8,9],'V09':[10,11],'K10':[6],'V11':[12],
     'V12':[13,14],'K13':[7],'V14':[15],'V15':[16],'K16':[8],'V17':[17],'V19':[20],'K20':[11],'V21':[21,22],'V22':[23,24,25],'V23':[26],'K24':[12,13]}
INNER={'K04':0.14,'V05':0.12,'K24':0.2}   # pause kept between pieces inside one line (s)
BEAT_AFTER={'V02':0.3,'K04':0.25,'V08':0.35,'V14':0.4,'K16':0.1,'V21':0.35}  # laugh beat after a punchline
GAP=0.08
def piece(x,a,b,pad=0.04):
    y=x[max(0,int((a-pad)*SR)):int((b+pad)*SR)].copy(); n=int(0.01*SR); y[:n]*=np.linspace(0,1,n); y[-n:]*=np.linspace(1,0,n); return y
S=json.load(open(os.path.join(V,'script.json'))); t=0.0; cue=[]; track=np.zeros(int(200*SR),np.float32)
for b in S['beats']:
    if b['type']!='line':
        b['start']=round(t,2); b['end']=round(t+1.0,2); t+=1.0; continue
    k=b['id'][0]; parts=[piece(AUD[a],*SEG[a][i]) for a,i in SRC[b['id']]] if b['id'] in SRC else [piece(AUD[k],*SEG[k][i]) for i in MAP[b['id']]]
    gap=np.zeros(int(INNER.get(b['id'],0.2)*SR),np.float32)
    x=parts[0]
    for p in parts[1:]: x=np.concatenate([x,gap,p])
    x=squeeze(x,max(0.16,INNER.get(b['id'],0.2)))
    wavfile.write(os.path.join(V,'voices','lines',b['id']+'.wav'),SR,(np.clip(x,-1,1)*32767).astype(np.int16))
    s=t; e=t+len(x)/SR; track[int(s*SR):int(s*SR)+len(x)]+=x
    # caption chunks re-timed proportionally to the new length
    old0,old1=b['start'],b['end']
    for c in b.get('caption_chunks',[]):
        c['from']=round(s+(c['from']-old0)/(old1-old0)*(e-s),2); c['to']=round(s+(c['to']-old0)/(old1-old0)*(e-s),2)
    b['start'],b['end']=round(s,2),round(e,2); b['voice_file']=f"voices/lines/{b['id']}.wav"
    cue.append([b['id'],b['who'],b['start'],b['end'],b['voice_file'],b['line']])
    t=e+GAP+BEAT_AFTER.get(b['id'],0)
S['meta']['runtime_s']=round(t,2); S['meta']['version']='v7 voice cut (one take per speaker, natural pace)'
json.dump(S,open(os.path.join(V,'script.json'),'w'),indent=1,ensure_ascii=False)
track=track[:int(t*SR)]; wavfile.write(os.path.join(V,'voices','voice_track_timed.wav'),SR,(np.clip(track,-1,1)*32767).astype(np.int16))
with open(os.path.join(V,'voices','cue_sheet.csv'),'w',newline='') as f:
    w=csv.writer(f); w.writerow(['id','who','start_s','end_s','file','line']); w.writerows(cue)
print('runtime',round(t,2))
for c in cue: print(c[0],c[2],c[3])
