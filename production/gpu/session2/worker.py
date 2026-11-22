"""GPU worker for session 2 (runs on the pod). Loads models once, then serves jobs.

Protocol: one JSON job per line on stdin, one JSON result per line on stdout.
  {"kind": "image", "id": "f1_plate_s1", "prompt": "...", "neg": "...", "w": 1664, "h": 928, "seed": 101, "out": "/path.png"}
  {"kind": "i2v", "id": "fox1", "image": "/crop.png", "prompt": "...", "frames": 129, "seed": 1, "out_dir": "/frames/fox1"}
  {"kind": "ping"}
The runner kills this process when an item passes its time allowance, and starts a new one
for the next item (the reload time is charged as setup).

Models (all Apache-2.0): Qwen/Qwen-Image; Wan-AI/Wan2.2-I2V-A14B-Diffusers with the
lightx2v/Wan2.2-Lightning I2V 4-step LoRAs (high-noise and low-noise experts).
4 sampling steps in total, guidance 1.0. Each pipeline is loaded on first use; loading one
frees the other.
"""
import json, os, sys, time
try:
    import torch
except ImportError:          # FAKE_WORKER tests run without torch
    torch = None

WAN = "Wan-AI/Wan2.2-I2V-A14B-Diffusers"
LIGHTNING = "lightx2v/Wan2.2-Lightning"
QWEN = "Qwen/Qwen-Image"
STATIC = "static locked-off camera, no camera movement, no zoom, no pan"
NEG_VIDEO = ("camera movement, zoom, pan, shaking, flicker, morphing, extra limbs, deformed, "
             "blurry, low quality, text, watermark")

_pipes = {}


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def lightning_files():
    from huggingface_hub import list_repo_files
    fs = [f for f in list_repo_files(LIGHTNING) if f.endswith(".safetensors") and "I2V" in f and "A14B" in f]
    hi = sorted(f for f in fs if "high" in f.lower())
    lo = sorted(f for f in fs if "low" in f.lower())
    if not hi or not lo:
        raise RuntimeError(f"Lightning I2V LoRAs not found in {LIGHTNING}: {fs}")
    return hi[-1], lo[-1]                   # newest version sorts last


def get(kind):
    if kind in _pipes:
        return _pipes[kind]
    _pipes.clear()
    torch.cuda.empty_cache()
    t = time.time()
    if kind == "image":
        from diffusers import DiffusionPipeline
        p = DiffusionPipeline.from_pretrained(QWEN, torch_dtype=torch.bfloat16).to("cuda")
    else:
        from diffusers import WanImageToVideoPipeline
        p = WanImageToVideoPipeline.from_pretrained(WAN, torch_dtype=torch.bfloat16)
        hi, lo = lightning_files()
        p.load_lora_weights(LIGHTNING, weight_name=hi, adapter_name="hi")
        p.load_lora_weights(LIGHTNING, weight_name=lo, adapter_name="lo", load_into_transformer_2=True)
        p.set_adapters(["hi", "lo"], adapter_weights=[1.0, 1.0])
        # session 2c lesson: both 14B experts + T5 kept on the GPU left no room for 97-frame clips
        p.enable_model_cpu_offload()
        try:
            p.vae.enable_tiling()
        except Exception as e:
            log("vae tiling not available:", repr(e)[:120])
        log("lightning:", hi, lo)
    log(f"loaded {kind} in {time.time() - t:.0f} s")
    _pipes[kind] = p
    return p


def do_image(j):
    p = get("image")
    g = torch.Generator("cuda").manual_seed(j["seed"])
    im = p(prompt=j["prompt"], negative_prompt=j.get("neg", " "), width=j["w"], height=j["h"],
           num_inference_steps=40, true_cfg_scale=4.0, generator=g).images[0]
    os.makedirs(os.path.dirname(j["out"]), exist_ok=True)
    im.save(j["out"])
    if j.get("review"):
        os.makedirs(os.path.dirname(j["review"]), exist_ok=True)
        im.convert("RGB").save(j["review"], quality=95)
    return {"out": j["out"]}


def do_i2v(j):
    from PIL import Image
    p = get("i2v")
    img = Image.open(j["image"]).convert("RGB")
    w, h = img.size
    assert w % 16 == 0 and h % 16 == 0 and w * h <= 832 * 480, (w, h)
    g = torch.Generator("cuda").manual_seed(j.get("seed", 1))
    kw = {"last_image": img} if j.get("last_same") else {}     # first-last-frame: clip returns to the still
    neg = NEG_VIDEO + (", " + j["neg_extra"] if j.get("neg_extra") else "")
    frames = p(image=img, prompt=j["prompt"] + ", " + STATIC, negative_prompt=neg, **kw,
               height=h, width=w, num_frames=j["frames"], num_inference_steps=4,
               guidance_scale=1.0, guidance_scale_2=1.0, generator=g, output_type="pil").frames[0]
    os.makedirs(j["out_dir"], exist_ok=True)
    for i, f in enumerate(frames):
        f.save(os.path.join(j["out_dir"], f"{i:04d}.png"))
    return {"out_dir": j["out_dir"], "frames": len(frames)}


def fake(j):
    """FAKE_WORKER=1: no GPU; synthetic outputs for plumbing tests."""
    from PIL import Image
    import numpy as np
    time.sleep(float(os.environ.get("FAKE_SECONDS", "0.2")))
    if j["kind"] == "image":
        os.makedirs(os.path.dirname(j["out"]), exist_ok=True)
        Image.new("RGB", (j["w"] // 8, j["h"] // 8), (90, 60, 40)).save(j["out"])
        if j.get("review"):
            os.makedirs(os.path.dirname(j["review"]), exist_ok=True)
            Image.new("RGB", (8, 8)).save(j["review"])
        return {"out": j["out"]}
    if j["kind"] == "i2v":
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import check_clip
        if j["id"].startswith("c4_"):     # same size as the real input, gentle brightness wobble
            base = np.asarray(Image.open(j["image"]).convert("RGB")).astype(np.float32)
            fr = [np.clip(base * (1 + 0.03 * np.sin(i / 3.0)), 0, 255).astype(np.uint8) for i in range(j["frames"])]
        else:
            fr, _, _ = check_clip.synth(T=j["frames"], period=3.0 if "fox" in j["id"] else 4.0, seed=j["seed"] % 7)
        os.makedirs(j["out_dir"], exist_ok=True)
        for i, f in enumerate(fr):
            Image.fromarray(f).save(os.path.join(j["out_dir"], f"{i:04d}.png"))
        return {"out_dir": j["out_dir"], "frames": len(fr)}
    return {}


def main():
    if os.environ.get("FAKE_WORKER"):
        global do_image, do_i2v, get
        do_image = do_i2v = fake
        get = lambda kind: None
    for line in sys.stdin:
        j = json.loads(line)
        t = time.time()
        try:
            if j["kind"] == "ping":
                r = {}
            elif j["kind"] == "load":
                get(j["model"])
                r = {}
            elif j["kind"] == "image":
                r = do_image(j)
            else:
                r = do_i2v(j)
            r.update(ok=True)
        except Exception as e:
            import traceback
            traceback.print_exc(file=sys.stderr)
            r = {"ok": False, "error": repr(e)[:500]}
            if torch is not None:
                torch.cuda.empty_cache()
        r.update(id=j.get("id"), seconds=round(time.time() - t, 1))
        print(json.dumps(r), flush=True)


if __name__ == "__main__":
    main()
