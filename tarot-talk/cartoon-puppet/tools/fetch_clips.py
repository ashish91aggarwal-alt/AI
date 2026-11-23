"""Download the video's original meme lines and meme sounds (urls in video.json) into audio/memes/. Never committed."""
import os, subprocess
from common import video, memes_dir
slug, vdir, work, cfg = video(); d = memes_dir()
urls = {m['file']: m['url'] for m in cfg.get('meme_lines', [])}; urls.update(cfg.get('sound_files', {}))
for f, u in urls.items():
    p = os.path.join(d, f)
    if not os.path.exists(p) or os.path.getsize(p) == 0: subprocess.run(['curl', '-sL', '--max-time', '30', '-o', p, u], check=True)
    print(f, os.path.getsize(p), 'bytes')
