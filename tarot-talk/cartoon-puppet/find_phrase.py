import sys, subprocess, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[2] if len(sys.argv) > 2 else 'small', device='cpu', compute_type='int8')
# decode with ffmpeg (the installed PyAV rejects faster-whisper's open() args)
audio = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ar','16000','-ac','1','-f','f32le','-'],capture_output=True,check=True).stdout, np.float32)
segs, info = m.transcribe(audio, language='hi', word_timestamps=True, vad_filter=False, initial_prompt='Ruko zara sabar karo. Bachcha hai tu mera. Hindi meme.')
for s in segs:
    print(f'{s.start:6.2f}-{s.end:6.2f} {s.text}')
    for w in s.words: print(f'    {w.start:6.2f}-{w.end:6.2f} {w.word}')
