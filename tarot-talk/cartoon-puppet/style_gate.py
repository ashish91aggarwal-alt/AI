# Style gate: compares a rendered frame with the reference on the numbers that make the look.
# Usage: python3 style_gate.py frame.png   (reference numbers measured from the reel screenshot)
import sys, cv2, numpy as np
from skimage.morphology import skeletonize
REF = dict(line_p10=1.9, line_med=3.8, line_p90=11.5,  # reference, measured with the same hair filter
           ink_lum_max=40, shadow_ratio=(0.70, 0.85))
im = cv2.imread(sys.argv[1]); g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
line = (g < 70).astype(np.uint8); line = cv2.morphologyEx(line, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
blobs = cv2.dilate(cv2.morphologyEx(line, cv2.MORPH_OPEN, np.ones((21, 21), np.uint8)), np.ones((5, 5), np.uint8)); line = line & (1 - blobs)  # drop hair masses, keep ink
dt = cv2.distanceTransform(line, cv2.DIST_L2, 3); w = 2 * dt[skeletonize(line > 0)]; w = w[(w > 1) & (w < 30)]
p10, med, p90 = np.percentile(w, [10, 50, 90])
ok = lambda c: 'PASS' if c else 'FAIL'
print(f"line width p10 {p10:.1f} (ref {REF['line_p10']})  median {med:.1f} (ref {REF['line_med']})  p90 {p90:.1f} (ref {REF['line_p90']})")
print('thin inner lines:', ok(med <= REF['line_med'] * 1.3), '| silhouette weight:', ok(abs(p90 / REF['line_p90'] - 1) <= 0.3), '| thin-to-thick range:', ok(p90 / max(p10, 1) >= 3))
inkpx = im[g < 40]; print('ink is warm near-black:', ok(len(inkpx) and inkpx[:, 2].mean() >= inkpx[:, 0].mean() - 8))
