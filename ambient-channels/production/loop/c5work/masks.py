"""c5 masks. Hand-traced polygons (colour-only masks leaked onto mountains and missed reflections).
Review every overlay by eye."""
import cv2, numpy as np, json
P = cv2.imread('scenes/c5/picture.png'); H, W = P.shape[:2]
g = cv2.cvtColor(P, cv2.COLOR_BGR2GRAY).astype(np.float32)
b, gr, r = [P[..., i].astype(np.float32) for i in range(3)]
def poly(pts):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 255); return m > 0
RIDGE = [(0,500),(60,490),(190,458),(260,478),(380,488),(470,445),(495,432),(560,440),(615,402),(660,400),(700,425),(760,418),
         (820,398),(905,355),(960,368),(1000,338),(1050,348),(1100,328),(1170,288),(1250,252),(1300,268),(1340,298),(1400,328),
         (1440,322),(1480,343),(1560,372),(1625,355),(1672,372)]
above = poly([(0,0)] + RIDGE + [(W,0)])
TREE = [(0,0),(770,0),(745,60),(700,150),(560,175),(480,205),(410,330),(300,345),(205,405),(135,485),(0,520)]
tree = poly(TREE)
# open night sky = dark at large scale once stars are removed (thin cirrus is lum >= 45, open sky <= 40),
# plus the violet Milky Way glow (b-g ~48; cloud is ~30). Review round 1: an area mask kept cirrus -> cloud flickered.
k9 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
op = np.stack([cv2.morphologyEx(P[..., c].astype(np.float32), cv2.MORPH_OPEN, k9) for c in range(3)], -1)
bl = cv2.GaussianBlur(op, (0, 0), 4); lum = bl @ np.array([.114, .587, .299], np.float32)
MW = poly([(1040,0),(1672,0),(1672,150),(1500,200),(1300,190),(1120,120)])
dark = (lum < 41) | (MW & (bl[..., 0] - bl[..., 1] > 42) & (lum < 85))
notblue = cv2.dilate(((b - r) < 30).astype(np.uint8), np.ones((9, 9), np.uint8)) > 0     # branches, leaves, cloud cream, snow
sky = above & dark & ~notblue
moon = np.zeros((H, W), np.uint8); cv2.circle(moon, (557, 185), 60, 255, -1)
sky &= moon == 0
sky &= ~poly([(240,410),(375,410),(385,560),(240,560)])      # the figure
sky = cv2.erode(sky.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
th = g - cv2.morphologyEx(g, cv2.MORPH_OPEN, k9)
cand = (th > 12) & sky
n, lab, st, cen = cv2.connectedComponentsWithStats(cand.astype(np.uint8))
ok = [i for i in range(1, n) if st[i][2] <= 5 and st[i][3] <= 5 and max(st[i][2], st[i][3]) <= 2 * min(st[i][2], st[i][3]) + 1]
stars = [(float(cen[i][0]), float(cen[i][1]), int(st[i][4]), float(th[lab == i].max())) for i in ok]
starmask = np.isin(lab, ok)
cv2.imwrite('scenes/c5/mask_stars.png', starmask.astype(np.uint8) * 255)
# painted shooting star (frozen mid-flight): line mask for inpainting
shoot = np.zeros((H, W), np.uint8); cv2.line(shoot, (786, 31), (932, 100), 255, 9)
# lake: fully hand-traced on gridded zooms (round 1 colour rules punched holes in reflections and leaked onto rock
# and firs). The outline stays inside the water; the compositor fades amplitude to zero over 10 px from this edge.
LAKE = [(356,646),(772,644),(790,628),(1108,628),(1130,646),(1528,646),(1506,698),(1490,722),(1464,722),(1450,740),(1436,795),
        (1420,805),(1400,805),(1380,800),(1368,775),(1345,750),(1322,775),(1310,800),(1296,838),(1256,838),(1240,820),(1215,798),
        (1192,825),(1180,860),(1150,872),(905,872),(870,845),(776,830),(728,832),(724,820),(676,802),(650,790),(628,776),(612,742),
        (588,726),(562,736),(532,736),(528,712),(506,680),(458,661),(356,661)]
POCKET = [(1570,646),(1672,646),(1672,674),(1652,678),(1634,715),(1626,728),(1604,728),(1596,700),(1576,668)]
lake = poly(LAKE) | poly(POCKET)
yy, xx = np.mgrid[0:H, 0:W]
for name, m in (('sky', sky), ('lake', lake), ('tree_guard', tree), ('shooting_star', shoot > 0)):
    cv2.imwrite(f'scenes/c5/mask_{name}.png', m.astype(np.uint8) * 255)
json.dump(stars, open('scenes/c5/stars.json', 'w'))
ov = P.copy()
ov[sky] = (ov[sky] * .6 + np.array([200, 0, 200]) * .4).astype(np.uint8)
ov[lake] = (ov[lake] * .6 + np.array([0, 220, 220]) * .4).astype(np.uint8)
ov[shoot > 0] = (0, 0, 255)
ov[starmask] = (0, 255, 0)
cv2.imwrite('/tmp/c5/ov_top.jpg', cv2.resize(ov[0:400, 380:1672], None, fx=1.3, fy=1.3), [cv2.IMWRITE_JPEG_QUALITY, 82])
cv2.imwrite('/tmp/c5/ov_lake.jpg', ov[600:900, 330:1672], [cv2.IMWRITE_JPEG_QUALITY, 82])
print('stars', len(stars), 'sky px', int(sky.sum()), 'lake px', int(lake.sum()))
