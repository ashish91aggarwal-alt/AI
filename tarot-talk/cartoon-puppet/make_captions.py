"""Captions (text, in, out) from SCRIPT.md '**Captions:**' lines -> captions.json. usage: python3 make_captions.py ../videos/<slug>/SCRIPT.md"""
import re, json, sys
s = open(sys.argv[1]).read(); caps = []
for line in re.findall(r'\*\*Captions:\*\* (.*)', s):
    for m in re.finditer(r'(.+?) \((\d+\.\d+)–(\d+\.\d+)\)(?: / |$)', line): caps.append([m.group(1).strip(), float(m.group(2)), float(m.group(3))])
json.dump(caps, open('captions.json', 'w'), ensure_ascii=False, indent=0); print(len(caps), 'captions')
