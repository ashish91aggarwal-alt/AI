"""S3 gate: is a clip's motion visible at phone size?  python3 clip_motion.py <clips dir> [--scale 2] [--min 1.5]
Prints, per clip, the largest local motion in phone pixels (640 px wide frame), after removing brightness pumps
(histogram equalised optical flow vs frame 8). Below --min the motion can't be seen on a phone (c4: 0.5-1.0 = invisible)."""
import cv2, numpy as np, glob, os, sys, argparse
ap = argparse.ArgumentParser(); ap.add_argument("root"); ap.add_argument("--scale", type=float, default=2.0)
ap.add_argument("--min", type=float, default=1.5); ap.add_argument("--match", default="")
ap.add_argument("--box", default="", help="x0,y0,x1,y1 in crop px (e.g. the cat face 60,100,330,340)")
a = ap.parse_args()
for c in sorted(glob.glob(os.path.join(a.root, "*" + a.match + "*"))):
    fs = sorted(glob.glob(c + "/*.png"))
    if len(fs) < 20: continue
    g = lambda f: cv2.equalizeHist(cv2.resize(cv2.imread(f, 0), None, fx=.5, fy=.5))
    ref = g(fs[8]); m = 0; at = (0, 0)
    for f in fs[8::6]:
        fl = cv2.calcOpticalFlowFarneback(ref, g(f), None, .5, 3, 15, 3, 5, 1.2, 0)
        mag = cv2.GaussianBlur(np.linalg.norm(fl, axis=2), (9, 9), 0)
        if a.box:
            x0, y0, x1, y1 = [int(v) // 2 for v in a.box.split(",")]; z = np.zeros_like(mag); z[y0:y1, x0:x1] = mag[y0:y1, x0:x1]; mag = z
        if mag.max() > m: m = float(mag.max()); at = np.unravel_index(mag.argmax(), mag.shape)
    phone = m * 2 / a.scale / 3          # half-res crop px -> crop px -> picture px -> phone px (1920 -> 640)
    print(f"{os.path.basename(c):24s} {phone:4.1f} phone-px at crop {(int(at[1]*2), int(at[0]*2))}  {'VISIBLE' if phone >= a.min else 'too small'}")
