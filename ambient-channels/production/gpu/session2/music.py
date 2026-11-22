#!/usr/bin/env python3
"""GPU session 2a, after the images: F1 music candidates with ACE-Step 1.5 turbo (MIT).
Session 1's music phase never started: ACE-Step's own downloader fetched ~8 GB at 1.5-5 MB/s.
Here start.sh downloads the weights first with huggingface-cli + hf_transfer into
/opt/ACE-Step-1.5/checkpoints, so the handler finds them locally.
Outputs: out/music/<id>_s<seed>.mp3 (192k review copy, in git); FLAC master in
/workspace/masters/music (uploaded by start.sh as GitHub release assets); out/music_manifest.json.
Resumable: tracks already done are skipped. Each track is wrapped so one failure never stops the run.
"""
import json, os, subprocess, sys, time, traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
MASTERS = Path("/workspace/masters")
for d in (OUT / "music", MASTERS / "music"):
    d.mkdir(parents=True, exist_ok=True)
P = json.loads((HERE / "prompts.json").read_text())
MAN = OUT / "music_manifest.json"
manifest = json.loads(MAN.read_text()) if MAN.exists() else {"music": [], "log": []}


def save():
    MAN.write_text(json.dumps(manifest, indent=1))


def log(msg):
    print(msg, flush=True)
    manifest["log"].append(f"{time.strftime('%H:%M:%S')} {msg}")
    save()
    pf = os.environ.get("PROGRESS")
    if pf:
        with open(pf, "a") as f:
            f.write(time.strftime("%H:%M:%S ", time.gmtime()) + msg + "\n")


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
        llm.initialize(checkpoint_dir=f"{root}/checkpoints", lm_model_path=os.environ.get("ACE_LM", "acestep-5Hz-lm-1.7B"), backend="pt", device="cuda")
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
    music()
