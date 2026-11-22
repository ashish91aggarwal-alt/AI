import cv2, numpy as np, glob, sys, subprocess
sys.path.insert(0, '/home/claude/ambient-channels/production/loop')
import living
SC = '/home/claude/ambient-channels/production/loop/scenes/'
P = cv2.imread(SC + 'c4_plate_1080.png')
x0, y0, x1, y1 = 976, 448, 1296, 656; w, h = x1 - x0, y1 - y0
cat = cv2.imread(SC + 'c4_mask_cat_body.png', 0)[y0:y1, x0:x1]
def load(n):
    return np.stack([cv2.resize(cv2.imread(f), (w, h), interpolation=cv2.INTER_AREA) for f in sorted(glob.glob('/home/claude/c4cat/' + n + '/*.png'))]).astype(np.float32)
clips = {n: load(n) for n in ('c4_cat_breathe_1', 'c4_cat_knead_1')}
Pc = P[y0:y1, x0:x1].astype(np.float32)
ring = (cv2.dilate(cat, np.ones((41, 41), np.uint8)) > 0) & ~(cv2.dilate(cat, np.ones((13, 13), np.uint8)) > 0)
def fix(c):
    out = np.empty_like(c)
    for i, f in enumerate(c):
        out[i] = f * (Pc[ring].mean(0) / np.maximum(f[ring].mean(0), 1))
    return out
clips = {k: fix(v) for k, v in clips.items()}
mv = np.zeros((h, w), np.float32)
for v in clips.values():
    mv = np.maximum(mv, v.mean(3).std(0))
moving = (mv > 5).astype(np.uint8) * 255
moving[: int(h * 0.25), :] = 0
allowm = cv2.dilate(cat, np.ones((7, 7), np.uint8))
n_, lab = cv2.connectedComponents(cv2.bitwise_and(moving, cv2.dilate(cat, np.ones((61, 61), np.uint8))))
keep = np.isin(lab, np.unique(lab[allowm > 0])[1:])
keep[:100, :] = False                    # pillow under the chin only; never the sofa above the back
m = np.maximum(allowm > 0, keep).astype(np.float32)
m = np.clip(cv2.GaussianBlur(m, (0, 0), 2) * 1.3, 0, 1)
cv2.imwrite(SC + 'c4_mask_cat.png', np.pad((m * 255).astype(np.uint8), ((y0, 1080 - y1), (x0, 1920 - x1))))
seqs = [np.clip(clips[k], 0, 255).astype(np.uint8) for k in ('c4_cat_breathe_1', 'c4_cat_knead_1')]
fl = living.Flow()
src = list(seqs[0][4:90]) + [fl.blend(seqs[0][90 + k], seqs[1][4 + k], (k + .5) / 6) for k in range(6)] + list(seqs[1][10:90]) + \
      [fl.blend(seqs[1][90 + k], seqs[0][4 + k], (k + .5) / 6) for k in range(6)] + list(seqs[0][10:90])
out = []
for j in range((len(src) - 1) * 3 // 2):
    a, r = divmod(j * 16, 24)
    out.append(src[a] if r == 0 else fl.blend(src[a], src[a + 1], r / 24))
mm = m[..., None]
pp = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '1280x832', '-r', '24', '-i', '-',
                       '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p',
                       '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:v', 'libx264', '-crf', '14', '-preset', 'medium',
                       '/home/claude/ambient-channels/production/loop/out/c4_cat_test_closeup.mp4'], stdin=subprocess.PIPE)
for f in out:
    comp = Pc * (1 - mm) + f.astype(np.float32) * mm
    pp.stdin.write(cv2.resize(np.clip(comp + .5, 0, 255).astype(np.uint8), (1280, 832), interpolation=cv2.INTER_LANCZOS4).tobytes())
pp.stdin.close(); pp.wait()
print('frames', len(out), 'seconds', round(len(out) / 24, 1))
viz = Pc.astype(np.uint8).copy(); viz[m > 0.5] = (viz[m > 0.5] * 0.5 + np.array([0, 120, 0])).astype(np.uint8)
cv2.imwrite('/tmp/catmask_viz.jpg', cv2.resize(viz, None, fx=2.5, fy=2.5))
