"""Session-2 queue runner with HARD money limits (no person in the loop).

Hard limit, two layers:
 1. Every item runs with a timeout = the minutes still allowed by BOTH the session cap
    (minus the push margin) and the item's card budget. The generator runs each item in a
    subprocess and kills it at the timeout, so no item can spend past either limit.
 2. start.sh sets MAX_MIN = the session cap in minutes; at that point the pod pushes and
    stops whatever is running (backstop for a hung runner).
Estimates only decide ORDER and whether to start an item; they are scaled by the slowest
measured/estimated ratio seen so far (never optimistic).

Breathing clips: the first clip at each length is a length test; if it fails the stability
check, the length steps down 129 -> 113 -> 97 frames. If a subject ends with fewer usable
breaths than planned but at least 1, the floor is a one-breath ring (reported, judged at G2).
"""
import json, os, sys
from dataclasses import dataclass, field, asdict

RATE = float(os.environ.get("RATE_PER_H", "2.69"))
PUSH_MARGIN_MIN = 3.0

# minutes per clip at <= 832x480, 4 sampling steps in total (2 high-noise + 2 low-noise expert)
EST = {33: 0.6, 81: 1.5, 89: 1.7, 97: 1.95, 113: 2.5, 129: 3.0}
IMG_MIN = 0.68                     # Qwen-Image, 40 steps, measured in session 1 (36.8-40.9 s)
FALLBACK = {129: 113, 113: 97}
NEED = {"fox": 3, "sheep": 2}
TOPUP_MAX = {"fox": 1, "sheep": 2}


@dataclass
class Item:
    id: str
    card: str            # "F1", "W3" or "shared"
    kind: str            # "setup" | "load" | "image" | "fire" | "breath" | "ear"
    frames: int = 0
    est_min: float = 0.0
    must: bool = True
    subject: str = ""


@dataclass
class Ledger:
    cap_usd: float
    card_left: dict                       # card -> dollars this session may spend
    spent: dict = field(default_factory=lambda: {"F1": 0.0, "W3": 0.0})
    minutes: float = 0.0
    done: list = field(default_factory=list)
    skipped: list = field(default_factory=list)

    def usd(self, m):
        return m / 60 * RATE

    def mins(self, usd):
        return usd / RATE * 60

    def allowed_min(self, it):
        """Minutes this item may run before it would break a limit."""
        session = self.mins(self.cap_usd) - PUSH_MARGIN_MIN - self.minutes
        if it.card == "shared":
            card = len(self.spent) * min(self.mins(self.card_left[c] - self.spent[c]) for c in self.spent)
        else:
            card = self.mins(self.card_left[it.card] - self.spent[it.card])
        return max(0.0, min(session, card))

    def charge(self, it, minutes):
        self.minutes += minutes
        cost = self.usd(minutes)
        if it.card == "shared":
            for c in self.spent:
                self.spent[c] += cost / len(self.spent)
        else:
            self.spent[it.card] += cost


def run(queue, ledger, generate, check, log=print):
    """generate(item, timeout_min) -> (minutes_used <= timeout_min, clip or None, finished: bool)
    check(item, clip) -> {"drift_ok", "stable_ok", "breaths"}"""
    length, tested = 129, set()
    scale = 1.0
    usable = {"fox": [], "sheep": []}
    topups = {"fox": 0, "sheep": 0}
    q = list(queue)
    while q:
        it = q.pop(0)
        if it.kind == "breath":
            it.frames = length
        if it.frames:
            it.est_min = EST[it.frames] * scale
        elif it.kind == "image":
            it.est_min = IMG_MIN * scale
        allow = ledger.allowed_min(it)
        if it.est_min > allow:
            ledger.skipped.append({**asdict(it), "reason": f"needs {it.est_min:.1f} min, {allow:.1f} allowed"})
            log(f"skip {it.id}")
            continue
        minutes, clip, finished = generate(it, allow)
        # real wall-clock minutes are charged, even past the allowance (the worker is killed at
        # the allowance, so any overrun is only frame writing + checks; MAX_MIN in start.sh is the backstop)
        ledger.charge(it, minutes)
        if it.kind not in ("setup", "load") and finished:
            base = EST[it.frames] if it.frames else IMG_MIN
            scale = max(scale, minutes / base)            # never optimistic
        if not finished:
            ledger.skipped.append({**asdict(it), "reason": "timeout (limit reached)"})
            log(f"killed {it.id} at {minutes:.1f} min")
            continue
        res = check(it, clip) if clip is not None else {}
        ledger.done.append({"id": it.id, "card": it.card, "frames": it.frames, "min": round(minutes, 2),
                            **{k: res.get(k) for k in ("drift_ok", "stable_ok", "breaths")}})
        if it.kind == "breath":
            if length not in tested:                       # first clip at this length = length test
                tested.add(length)
                if not res.get("stable_ok", True) and length in FALLBACK:
                    length = FALLBACK[length]
                    log(f"length test failed -> {length} frames")
                    for subj, card in (("fox", "F1"), ("sheep", "W3")):   # lower yield: 2 extra each
                        q += [Item(f"{subj}_x{length}_{i}", card, "breath", subject=subj, must=False) for i in (1, 2)]
            if res.get("drift_ok") and res.get("stable_ok") and res.get("breaths"):
                usable[it.subject].append(it.id)
        for subj in usable:                                 # automatic top-up
            planned_left = any(x.kind == "breath" and x.subject == subj for x in q)
            started = any(d["id"].startswith(subj) or d["id"].startswith(f"topup_{subj}") for d in ledger.done)
            if started and not planned_left and len(usable[subj]) < NEED[subj] and topups[subj] < TOPUP_MAX[subj]:
                topups[subj] += 1
                q.insert(0, Item(f"topup_{subj}{topups[subj]}", "F1" if subj == "fox" else "W3", "breath", subject=subj))
    floor = {s: ("full" if len(u) >= NEED[s] else "one-breath ring" if u else "none")
             for s, u in usable.items() if any(d["id"].startswith(s) for d in ledger.done)}
    return dict(minutes=round(ledger.minutes, 1), usd=round(ledger.usd(ledger.minutes), 2),
                spent={k: round(v, 2) for k, v in ledger.spent.items()}, usable=usable, floor=floor,
                breath_frames=length, remaining_must=[s for s in ledger.skipped if s["must"]], done=ledger.done)


def queue_2a(regen=("f1_plate", "w3_plate", "f1_fox", "w3_sheep", "pl_banner2", "pp_banner2")):
    """Images only (the fire crops need the plate G1 picks from these regens, so all video is in 2b).
    Only Qwen-Image is downloaded, so setup is shorter."""
    q = [Item("setup", "shared", "setup", est_min=8), Item("qwen_load", "shared", "load", est_min=4)]
    seeds = {"f1_plate": ("F1", 8), "w3_plate": ("W3", 8), "f1_fox": ("F1", 6), "w3_sheep": ("W3", 6),
             "pl_banner2": ("F1", 6), "pp_banner2": ("W3", 6)}     # banners: brand line, booked to the channel's card
    jobs = [[Item(f"{r}_s{i}", seeds[r][0], "image") for i in range(1, seeds[r][1] + 1)] for r in regen]
    while any(jobs):                                       # interleave the cards
        for j in jobs:
            if j:
                q.append(j.pop(0))
    return q


def queue_2b():
    q = [Item("setup", "shared", "setup", est_min=12)]
    for i in (1, 2, 3):                                    # fire first, alternating F1 and W3
        q.append(Item(f"hearth{i}", "F1", "fire", 89, subject="hearth"))
        q.append(Item(f"campfire{i}", "W3", "fire", 89, subject="campfire"))
    q.append(Item("sheep_test", "W3", "breath", 129, subject="sheep"))
    for i in range(1, 5):
        q.append(Item(f"fox{i}", "F1", "breath", 129, subject="fox"))
        q.append(Item(f"sheep{i}", "W3", "breath", 129, subject="sheep"))
    q.append(Item("fox_ear1", "F1", "ear", 81, subject="fox_ear"))
    q += [Item("hearth4", "F1", "fire", 89, must=False, subject="hearth"),
          Item("campfire4", "W3", "fire", 89, must=False, subject="campfire"),
          Item("fox_ear2", "F1", "ear", 81, must=False, subject="fox_ear")]
    return q


def queue_2c(frames=97):
    """Owner's cat-cabin picture (c4): I2V on 5 crops, fire first. One card, C4."""
    q = [Item("setup", "shared", "setup", est_min=12),
         Item("c4_mantel_smoke", "C4", "fire", 33, subject="c4_mantel", must=False)]   # cheap pipeline test first
    order = [("c4_fire", 1), ("c4_window", 1), ("c4_mug", 1), ("c4_mantel", 1), ("c4_shelf", 1),
             ("c4_fire", 2), ("c4_mug", 2), ("c4_fire", 3), ("c4_window", 2), ("c4_mantel", 2),
             ("c4_shelf", 2), ("c4_fire", 4), ("c4_mug", 3)]
    for subj, i in order:
        q.append(Item(f"{subj}_{i}", "C4", "fire", frames, subject=subj, must=i == 1))
    return q


def queue_2d(frames=97):
    """Owner's cat (c4): first-last-frame clips of the sleeping cat; resting breaths first, then small events."""
    q = [Item("setup", "shared", "setup", est_min=8)]
    order = ["breathe_1", "ear_1", "knead_1", "nuzzle_1", "whisker_1", "tail_1", "breathe_2", "knead_2",
             "ear_2", "breathe_3", "nuzzle_2", "knead_3", "ear_3", "whisker_2", "tail_2", "breathe_4",
             "squeeze_1", "lick_1", "squeeze_2", "lick_2", "earonly_1", "earonly_2", "breathe_5", "whisker_3",
             "deepbreath_1", "earflick_1", "whiskers_1", "face_1", "deepbreath_2", "earflick_2", "whiskers_2",
             "face_2", "deepbreath_3", "earflick_3", "whiskers_3", "deepbreath_4",
             "earquick_1", "earquick_2", "earquick_3", "earquick_4", "earquick_5", "earquick_6"]
    for o in order:
        q.append(Item(f"c4_cat_{o}", "C4", "fire", frames, subject="c4_cat", must=o == "breathe_1"))
    # first-and-last-frame clips of the other layers (exact joins through the picture's own frame)
    for subj in ("c4_fire", "c4_mug", "c4_window", "c4_mantel", "c4_shelf", "c4_candle"):
        for k in range(1, 9):
            q.append(Item(f"{subj}_flf_{k}", "C4", "fire", frames, subject=subj, must=False))
    return q


def queue_2e(frames=97):
    """Owner's wanderer picture (c5): review batch of first-last-frame clips for the coat and the big tree
    (owner, 18 Nov: no warping, true render only). One card, C5."""
    q = [Item("setup", "shared", "setup", est_min=10)]
    for i, subj in (("c5_coat_1", "c5_coat"), ("c5_branch_1", "c5_branch"), ("c5_water_1", "c5_water"), ("c5_coat_2", "c5_coat"), ("c5_tree_1", "c5_tree")):
        q.append(Item(i, "C5", "fire", frames, subject=subj, must=i.endswith("_1")))
    return q


def queue_2f(frames=97):
    """c5 batch 3 (owner go 19 Nov, cap $2): stronger-wind tree clips, the two lake ends, more centre water and
    coat clips so nothing repeats every 6 s. Prompt comes from the id prefix, picture and masks from the subject."""
    q = [Item("setup", "shared", "setup", est_min=10)]
    for i, subj in (("c5_branchw_1", "c5_branch"), ("c5_waterl_1", "c5_waterl"), ("c5_waterr_1", "c5_waterr"), ("c5_coatw_3", "c5_coat"),
                    ("c5_waterc_2", "c5_water"), ("c5_crown_1", "c5_crown"), ("c5_waterc_3", "c5_water"), ("c5_coatw_4", "c5_coat"),
                    ("c5_branchw_2", "c5_branch")):
        q.append(Item(i, "C5", "fire", frames, subject=subj, must=i in ("c5_branchw_1", "c5_waterl_1", "c5_waterr_1")))
    return q


def queue_2g(frames=97):
    """c5 batch 4 (owner go 19 Nov 02:38 IST, cap $1): more crown clips and stronger-ripple clips for the two lake ends,
    so no layer repeats every 6 s and the ends match the centre."""
    q = [Item("setup", "shared", "setup", est_min=10)]
    for i, subj in (("c5_waterls_2", "c5_waterl"), ("c5_waterrs_2", "c5_waterr"), ("c5_crown_2", "c5_crown"),
                    ("c5_waterls_3", "c5_waterl"), ("c5_waterrs_3", "c5_waterr"), ("c5_crown_3", "c5_crown")):
        q.append(Item(i, "C5", "fire", frames, subject=subj, must=i.endswith("_2")))
    return q


def queue_2h(frames=97):
    """c5 batch 5 (owner 19 Nov 10:48 IST: fix every known fault; inside the $4 cap). The lake-end crops rendered at
    2x and 1.5x gave ripples half the size of the centre's once scaled back, so the ends looked calm: re-render the
    ends as full-width crops at 1.0 (same ripple scale as the centre). More branch and coat clips against 12 s repeats."""
    q = [Item("setup", "shared", "setup", est_min=10)]
    for i, subj in (("c5_waterL_1", "c5_waterL"), ("c5_waterR_1", "c5_waterR"), ("c5_branchw_3", "c5_branch"), ("c5_coat_5", "c5_coat"),
                    ("c5_waterL_2", "c5_waterL"), ("c5_waterR_2", "c5_waterR"), ("c5_branchw_4", "c5_branch"), ("c5_coat_6", "c5_coat"),
                    ("c5_waterL_3", "c5_waterL"), ("c5_waterR_3", "c5_waterR")):
        q.append(Item(i, "C5", "fire", frames, subject=subj, must=i in ("c5_waterL_1", "c5_waterR_1")))
    return q


def queue_2i(frames=97):
    """c5 batch 6 (inside the owner's $4 cap): crown and centre water had 3 clips each and cycled every 18 s (viewer
    check, preview 9): 2 more crown and 3 more centre-water clips; and the small water pocket at far right that the
    wide crop left still."""
    q = [Item("setup", "shared", "setup", est_min=10)]
    for i, subj in (("c5_waterc_4", "c5_water"), ("c5_crown_4", "c5_crown"), ("c5_pocket_1", "c5_pocket"), ("c5_waterc_5", "c5_water"),
                    ("c5_crown_5", "c5_crown"), ("c5_pocket_2", "c5_pocket"), ("c5_waterc_6", "c5_water")):
        q.append(Item(i, "C5", "fire", frames, subject=subj, must=i in ("c5_waterc_4", "c5_crown_4", "c5_pocket_1")))
    return q


def plan_minutes(q):
    cards = sorted({it.card for it in q if it.card != "shared"}) or ["F1", "W3"]
    t, per = 0.0, {c: 0.0 for c in cards}
    for it in q:
        m = it.est_min or (EST[it.frames] if it.frames else IMG_MIN)
        t += m
        if it.card == "shared":
            for c in cards:
                per[c] += m / len(cards)
        else:
            per[it.card] += m
    return round(t, 1), {k: round(v, 1) for k, v in per.items()}


# ------------------------------------------------------------------ tests
def _fake(slow=1.0, seed=1, p_breath=0.7, stable=lambda it: True):
    import random
    rnd = random.Random(seed)
    def gen(it, timeout):
        need = (it.est_min if it.kind in ("setup", "load") else
                (EST[it.frames] if it.frames else IMG_MIN) * slow * rnd.uniform(0.95, 1.05))
        return (min(need, timeout), "clip", need <= timeout)
    def chk(it, c):
        return {"drift_ok": True, "stable_ok": stable(it), "breaths": [[0, 64, 4.0]] if rnd.random() < p_breath else []}
    return gen, chk


def selftest():
    ok, quiet = True, (lambda *_: None)
    for name, q, cap in (("2a", queue_2a, 2.40), ("2b", queue_2b, 2.80)):
        left = {"F1": 2.2, "W3": 2.0}
        for slow in (1.0, 2.0, 3.0, 4.0):
            g, c = _fake(slow)
            r = run(q(), Ledger(cap, dict(left)), g, c, quiet)
            good = r["usd"] <= cap + 1e-9 and all(r["spent"][k] <= left[k] + 1e-9 for k in left)
            print(f"{name} x{slow}: ${r['usd']} {r['spent']} missing-must {len(r['remaining_must'])} {'OK' if good else 'OVER'}")
            ok &= good
    for slow in (1.0, 2.0, 3.0, 4.0):
        g, c = _fake(slow)
        r = run(queue_2c(), Ledger(2.78, {"C4": 2.78}, spent={"C4": 0.0}), g, c, quiet)
        good = r["usd"] <= 2.78 + 1e-9 and r["spent"]["C4"] <= 2.78 + 1e-9
        print(f"2c x{slow}: ${r['usd']} {r['spent']} done {len(r['done'])} missing-must {len(r['remaining_must'])} {'OK' if good else 'OVER'}")
        ok &= good
    for slow in (1.0, 2.0):
        g, c = _fake(slow)
        r = run(queue_2d(), Ledger(2.15, {"C4": 2.15}, spent={"C4": 0.0}), g, c, quiet)
        good = r["usd"] <= 2.15 + 1e-9
        print(f"2d x{slow}: ${r['usd']} done {len(r['done'])} missing-must {len(r['remaining_must'])} {'OK' if good else 'OVER'}")
        ok &= good
    g, c = _fake(1.0)
    r = run(queue_2b(), Ledger(2.40, {"F1": 2.2, "W3": 0.60}), g, c, quiet)
    print("W3 tight:", r["spent"]); ok &= r["spent"]["W3"] <= 0.60 + 1e-9 and r["spent"]["F1"] > 0.6
    g, c = _fake(1.0, stable=lambda it: it.frames == 97)
    r = run(queue_2b(), Ledger(3.40, {"F1": 3.0, "W3": 3.0}), g, c, quiet)
    print("129 and 113 fail ->", r["breath_frames"]); ok &= r["breath_frames"] == 97
    g, c = _fake(1.0, stable=lambda it: it.frames != 129)
    r = run(queue_2b(), Ledger(3.40, {"F1": 3.0, "W3": 3.0}), g, c, quiet)
    print("129 fails ->", r["breath_frames"]); ok &= r["breath_frames"] == 113
    g, c = _fake(1.0, p_breath=0.15, seed=3)
    r = run(queue_2b(), Ledger(2.40, {"F1": 2.2, "W3": 2.0}), g, c, quiet)
    print("poor yield floor:", r["floor"])
    print("plan 2a:", plan_minutes(queue_2a()), " plan 2b:", plan_minutes(queue_2b()), " plan 2c:", plan_minutes(queue_2c()))
    print("SELFTEST", "PASS" if ok else "FAIL")
    return ok


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(0 if selftest() else 1)
    if "--plan" in sys.argv:
        print(json.dumps({"2a": plan_minutes(queue_2a()), "2b": plan_minutes(queue_2b()), "2c": plan_minutes(queue_2c())}))
