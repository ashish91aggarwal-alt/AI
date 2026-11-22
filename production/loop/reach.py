"""S1 'hand-cover' test as a picture: where each light source's flicker lands, and how strong (p95-p5 swing).
python3 reach.py [out.jpg]   (c4). Compare with the light map (reference/c4/02): every painted lit area must be
covered by its own source's colour; nothing far from a source may swing."""
import sys, os, cv2, numpy as np
sys.argv += [] ; import compose_c4 as C
class S: pass
sc = S(); sc.plate = cv2.imread(os.path.join(C.SC, "c4_plate_1080.png")).astype(np.float32) / 255
sc.H, sc.W = sc.plate.shape[:2]; sc.N = 480; sc.live = True; sc.layers = []
L = C.Lights3.__new__(C.Lights3); C.Lights3.__init__(L, sc)
STD = {"fire_L": 0.11, "fire_C": 0.11, "fire_R": 0.11, "candle": C.Lights.SRC["candle"][3],
       "lantern": C.Lights.SRC["lantern"][3], "shelf": C.Lights.SRC["shelf"][3], "lamp": 0.042}
COL = {"fire_L": (0, 90, 255), "fire_C": (0, 140, 255), "fire_R": (0, 190, 255), "candle": (0, 255, 255),
       "lantern": (0, 255, 0), "shelf": (255, 120, 0), "lamp": (255, 0, 255)}
base = cv2.resize(sc.plate, (sc.W // 2, sc.H // 2)) * 0.45
over = np.zeros_like(base); best = np.zeros(base.shape[:2], np.float32)
for k, F in L.F.items():
    sw = 3.3 * STD.get(k, 0) * F                     # p95-p5 swing of a gaussian-ish driver
    win = sw > best; best = np.maximum(best, sw)
    over[win] = np.array(COL.get(k, (255, 255, 255)), np.float32) / 255
vis = base + over * np.clip(best / 0.15, 0, 1)[..., None] * 0.9
for k, (cx, cy, *_ ) in L.SRC3.items():
    if k in COL: cv2.circle(vis, (cx // 2, cy // 2), 4, (1, 1, 1), -1)
out = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].endswith(".jpg") else "scenes/c4_reach.jpg"
cv2.imwrite(out, np.clip(vis * 255, 0, 255).astype(np.uint8))
for k in L.F:
    print(f"{k:8s} max swing {3.3 * STD.get(k, 0) * L.F[k].max() * 100:5.1f}%  area >5%: {(3.3 * STD.get(k,0) * L.F[k] > 0.05).mean() * 100:4.1f}% of frame")
