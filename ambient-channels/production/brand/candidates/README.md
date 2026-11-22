# Brand candidates (17 Nov 2026), for the brand gate

Source art: GPU session 1 (Qwen-Image, Apache-2.0), branch gpu/session1, production/gpu/session1/out/img
(review JPEGs; full-size PNG masters are on the pod volume /workspace/masters).
Composed with production/brand/compose.py (OFL fonts, headless Chrome; no AI-drawn text):
- Avatars: `compose.py avatar <art> <out> --zoom 1.15` → 800×800 + `.sizes.png` (98/48/32 px circles).
- Page & Lantern banners: `--zoom 1.15 --focus 62`, tagline "Fantasy music & ambience for reading, rest and sleep".
- Prayer Pastures banners: `--zoom 1.3 --focus 72` (brings the sheep into the band), tagline "Quiet instrumental worship for prayer and rest".
Each banner has `.desktop.jpg` (2560×423 band) and `.phone.jpg` (1546×423) previews.
Known: painter-signature scribbles appear in some source corners; avatars crop them out, banners must be checked.
Final upload uses the PNG master of the chosen seed, re-composed at full quality.
