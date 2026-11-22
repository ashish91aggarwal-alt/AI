# Rainy Cottage Reading Nook — checkpoint

Status: **FAIL / UNVALIDATED**, photorealism approved by owner (2026-11-22). Storybook-style gate explicitly waived.

V2 native: 1672×941, SHA256 `6d9384d148c114fdc21e3f7994ad04f399c11e67f3e967c05de2426766f5ea58`.
V3 native: 1672×941, SHA256 `14afedc37c9fc603632a799a9ff5367551105c625845cc71b5969d655ed8dfa5`.
V3 interpolated 2560×1440 Lanczos export SHA256 `f4329dbaccd9e566cedfc6e3bc55d487dde9ee5e2b790d9b04e80b215343b65b`.

V3 visual review: one sleeping blue-grey cat; two ears, paws and tail visually plausible; rainy windows, warm lamp and candles. Photorealism is now the intended medium. Native size below 1920×1080; source-bound edit provenance unverified (`parent_gen_id=null`). No full deterministic `gate_v2.py` pass has been established. Do not mark PASS.

Dashboard artwork and V3 metadata registered; image binary not uploaded. Next: create source-bound native 1920×1080+ candidate, inspect subject bounding boxes/head ratio and shadow/lighting closeups, run gate_v2.py with complete evidence, upload actual image binary and update dashboard status.


## 2026-11-22 follow-up
V3 manual fresh re-audit: lighting 7.5, shadows 7.3, colour 8, geometry 8, materials 7.5, fine detail 7, composition 8.3, photorealism 8. **FAIL** against v2 thresholds. V4 generated (`gen_id=c6367220-7a7f-4603-8cb8-fa20bbfd1eb6`) but rejected as final: source-bound edit provenance remains unverified and native 1672×941 still below required 1920×1080. Full canonical `gate_v2.py` not executed; no PASS claimed. V3 remains best retained candidate. Dashboard metadata updated; full image binary not uploaded. Next: use verified reference-bound high-resolution method and execute canonical gate. 
