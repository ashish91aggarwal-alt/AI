"""Make sure every meme clip the video needs is in tarot-talk/assets/audio/memes/ (shared, committed).
Uses the saved copy; downloads only what is missing, and saves it there for every later session."""
import os, subprocess
from common import video, memes_dir
slug, vdir, work, cfg = video(); d = memes_dir()
urls = {m['file']: m['url'] for m in cfg.get('meme_lines', [])}; urls.update(cfg.get('sound_files', {}))
for f, u in urls.items():
    p = os.path.join(d, f)
    if not os.path.exists(p) or os.path.getsize(p) == 0:
        subprocess.run(['curl', '-sL', '--max-time', '30', '-o', p, u], check=True)
        print('downloaded and saved to assets:', f, '(add it to catalog.json and commit)')
    else: print('from assets:', f)
