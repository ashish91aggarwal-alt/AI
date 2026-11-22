import re, glob, json, difflib, warnings, sys
warnings.filterwarnings("ignore")
from music21 import converter, note as m21note
PAT={"coventry":r"coventry|lully,? lullay","wexford":r"wexford","dulci":r"dulci","emmanuel":r"emmanuel|veni,? veni","holynight":r"holy night|cantique de no|minuit","silent":r"silent night|stille nacht","bethlehem":r"little town|st\.? ?louis"}
tunes={k:[] for k in PAT}
for line in open("raw/index.tsv"):
    q,repo,path,fn=line.rstrip("\n").split("\t")
    txt=open(fn,errors="replace").read()
    blocks=re.split(r"\n(?=X:)", "\n"+txt)
    for b in blocks:
        if "K:" not in b: continue
        titles=" ".join(re.findall(r"^T:(.*)$",b,re.M)).lower()
        for k,p in PAT.items():
            if re.search(p,titles):
                tunes[k].append((repo,path,b.strip()))
def melody(abc):
    try:
        s=converter.parse(abc,format="abc")
    except Exception as e:
        return None
    parts=s.parts if s.parts else [s]
    ns=[n for n in parts[0].flatten().notes]
    seq=[]
    for n in ns:
        p=n.pitches[-1] if n.isChord else n.pitch   # top note if chord
        if n.tie is not None and n.tie.type in ("stop","continue") and seq: 
            seq[-1][1]+=float(n.quarterLength); continue
        seq.append([p.midi,float(n.quarterLength)])
    return seq
out={}
for k,lst in tunes.items():
    mels=[]
    for repo,path,b in lst:
        m=melody(b)
        if m and len(m)>12: mels.append((repo,path,m))
    out[k]=mels
    print(k,len(lst),"parsed",len(mels))
json.dump({k:[(r,p,m) for r,p,m in v] for k,v in out.items()},open("mels.json","w"))
