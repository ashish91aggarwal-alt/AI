#!/usr/bin/env python3
"""GPU session 1: brand art + F1/W3 scene plates + animal elements (Qwen-Image),
then F1 music candidates (ACE-Step 1.5 turbo). Runs on the pod; started by start.sh.

Outputs (pushed to branch gpu/session1 by start.sh):
  out/img/<id>_s<seed>.jpg          review copy (q95); full PNG master kept on /workspace/masters
  out/music/<id>_s<seed>.mp3        review copy (192k); FLAC master kept on /workspace/masters
  out/manifest.json                 every item: prompt, seed, size, seconds, status/error
Each item is wrapped so one failure never stops the run.
"""
import json, os, subprocess, sys, time, traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
MASTERS = Path("/workspace/masters")
for d in (OUT / "img", OUT / "music", MASTERS / "img", MASTERS / "music"):
    d.mkdir(parents=True, exist_ok=True)
P = json.loads((HERE / "prompts.json").read_text())
MAN = OUT / "manifest.json"
manifest = json.loads(MAN.read_text()) if MAN.exists() else {"images": [], "music": [], "log": []}


def save():
    MAN.write_text(json.dumps(manifest, indent=1))


def log(msg):
    print(msg, flush=True)
    manifest["log"].append(f"{time.strftime('%H:%M:%S')} {msg}")
    save()


def images():
    import torch
    from diffusers import DiffusionPipeline
    t0 = time.time()
    pipe = DiffusionPipeline.from_pretrained("Qwen/Qwen-Image", torch_dtype=torch.bfloat16).to("cuda")
    log(f"qwen-image loaded in {time.time() - t0:.0f}s, vram {torch.cuda.memory_allocated() / 1e9:.1f} GB")
    done = {(m["id"], m["seed"]) for m in manifest["images"] if m.get("status") == "ok"}
    for item in P["images"]:
        for seed in range(1, item["seeds"] + 1):
            if (item["id"], seed) in done:
                continue
            rec = {"id": item["id"], "seed": seed, "w": item["w"], "h": item["h"], "prompt": item["prompt"]}
            t = time.time()
            try:
                img = pipe(prompt=item["prompt"] + ", ultra detailed, high quality",
                           negative_prompt=P["neg"], width=item["w"], height=item["h"],
                           num_inference_steps=40, true_cfg_scale=4.0,
                           generator=torch.Generator("cuda").manual_seed(seed)).images[0]
                name = f"{item['id']}_s{seed}"
                img.save(MASTERS / "img" / f"{name}.png")
                img.convert("RGB").save(OUT / "img" / f"{name}.jpg", quality=95)
                rec.update(status="ok", seconds=round(time.time() - t, 1))
            except Exception as e:
                rec.update(status="error", error=f"{type(e).__name__}: {e}")
                traceback.print_exc()
            manifest["images"].append(rec)
            save()
            log(f"img {item['id']} s{seed}: {rec['status']} {rec.get('seconds', '')}")
    del pipe
    torch.cuda.empty_cache()


def music():
    sys.path.insert(0, "/opt/ACE-Step-1.5")
    from acestep.handler import AceStepHandler
    from acestep.llm_inference import LLMHandler
    from acestep.inference import GenerationParams, GenerationConfig, generate_music
    root = "/opt/ACE-Step-1.5"
    dit = AceStepHandler()
    dit.initialize_service(project_root=root, config_path=os.environ.get("ACE_CONFIG", "acestep-v15-turbo"), device="cuda")
    llm = LLMHandler()
    try:
        llm.initialize(checkpoint_dir=f"{root}/checkpoints", lm_model_path="acestep-5Hz-lm-0.6B", backend="pt", device="cuda")
    except Exception as e:  # the 5 Hz LM is optional for plain text2music
        log(f"LLM handler not initialised ({e}); continuing without it")
        llm = None
    log("ace-step loaded")
    M = P["music"]
    done = {(m["id"], m["seed"]) for m in manifest["music"] if m.get("status") == "ok"}
    for tr in M["tracks"]:
        for seed in range(1, M["seeds"] + 1):
            if (tr["id"], seed) in done:
                continue
            rec = {"id": tr["id"], "seed": seed, "caption": f"{M['base']}, {tr['tags']}", "bpm": tr["bpm"], "key": tr["key"]}
            t = time.time()
            try:
                params = GenerationParams(caption=rec["caption"], lyrics="[Instrumental]", instrumental=True,
                                          bpm=tr["bpm"], keyscale=tr["key"], duration=M["duration"], seed=1000 + seed)
                cfg = GenerationConfig(batch_size=1, audio_format="flac")
                res = generate_music(dit, llm, params, cfg, save_dir=str(MASTERS / "music" / f"{tr['id']}_s{seed}"))
                if not res.success:
                    raise RuntimeError(res.error)
                src = res.audios[0]["path"]
                dst = MASTERS / "music" / f"{tr['id']}_s{seed}.flac"
                os.replace(src, dst)
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(dst), "-b:a", "192k",
                                str(OUT / "music" / f"{tr['id']}_s{seed}.mp3")], check=True)
                rec.update(status="ok", seconds=round(time.time() - t, 1))
            except Exception as e:
                rec.update(status="error", error=f"{type(e).__name__}: {e}")
                traceback.print_exc()
            manifest["music"].append(rec)
            save()
            log(f"music {tr['id']} s{seed}: {rec['status']} {rec.get('seconds', '')}")


if __name__ == "__main__":
    phase = sys.argv[1] if len(sys.argv) > 1 else "all"
    if phase in ("all", "images"):
        try:
            images()
        except Exception as e:
            log(f"IMAGES PHASE FAILED: {e}")
            traceback.print_exc()
    if phase in ("all", "music"):
        try:
            music()
        except Exception as e:
            log(f"MUSIC PHASE FAILED: {e}")
            traceback.print_exc()
    log("GEN DONE")
