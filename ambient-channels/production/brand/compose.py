#!/usr/bin/env python3
"""Compose YouTube brand assets from gated artwork, with real typography (OFL fonts, rendered
by headless Chrome so kerning and anti-aliasing are proper). No text is ever drawn by an AI model.

  banner  2560x1440 JPG: artwork cover-fit, name + tagline centred inside the 1235x338 safe area
  avatar  800x800 JPG: square crop of the artwork (subject centred, circle-safe)
  previews: banner as seen on desktop (2560x423 band) and phone (1546x423), avatar at 98/48/32 px

Usage: compose.py banner <art.jpg> <out.jpg> --name "Page & Lantern" --tagline "..." --style fantasy|worship
       compose.py avatar <art.jpg> <out.jpg> [--zoom 1.0] [--dy 0]
Fonts: Cinzel (fantasy), Cormorant Garamond (worship), both SIL OFL 1.1, from @fontsource on npm.
"""
import argparse, asyncio, base64, sys
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
FONTS = HERE / "fonts"
STYLES = {
    "fantasy": dict(font="cinzel-latin-600-normal.woff2", sub="eb-garamond-latin-400-normal.woff2",
                    color="#F6E7C8", glow="rgba(255,170,80,.45)", shade="rgba(8,12,30,.55)", track="0.08em"),
    "worship": dict(font="cormorant-garamond-latin-600-normal.woff2", sub="cormorant-garamond-latin-500-normal.woff2",
                    color="#FFF8EA", glow="rgba(255,226,160,.45)", shade="rgba(60,45,20,.35)", track="0.04em"),
}


def b64(p):
    return base64.b64encode(Path(p).read_bytes()).decode()


async def render_html(html, w, h, out):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg = await b.new_page(viewport={"width": w, "height": h})
        await pg.set_content(html)
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=str(out), type="jpeg", quality=93)
        await b.close()


def banner(art, out, name, tagline, style, zoom=1.0, focus=50, fx=50, scrim=None, name_px=128, tag_px=48):
    """zoom > 1 enlarges the artwork; focus = vertical position (0 top .. 100 bottom) of the part kept in view."""
    s = dict(STYLES[style])
    if scrim is not None:
        s['shade'] = s['shade'].rsplit(',', 1)[0] + f',{scrim})'
    html = f"""<html><head><style>
@font-face{{font-family:T;src:url(data:font/woff2;base64,{b64(FONTS / s['font'])})}}
@font-face{{font-family:S;src:url(data:font/woff2;base64,{b64(FONTS / s['sub'])})}}
body{{margin:0;width:2560px;height:1440px;background:#000 url(data:image/jpeg;base64,{b64(art)}) {'center/cover' if zoom == 1.0 else f'{fx}% {focus}%/{int(2560*zoom)}px auto'} no-repeat}}
.band{{position:absolute;left:0;right:0;top:508px;height:424px;
  background:radial-gradient(60% 70% at 50% 50%,{s['shade']},transparent 75%)}}
.safe{{position:absolute;left:662px;top:551px;width:1235px;height:338px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center}}
h1{{font-family:T;font-weight:600;font-size:{name_px}px;line-height:1;margin:0;color:{s['color']};letter-spacing:{s['track']};
  text-shadow:0 0 28px {s['glow']},0 3px 10px rgba(0,0,0,.55)}}
p{{font-family:S;font-size:{tag_px}px;margin:22px 0 0;color:{s['color']};opacity:.92;letter-spacing:.03em;
  text-shadow:0 2px 8px rgba(0,0,0,.6)}}
</style></head><body><div class=band></div><div class=safe><h1>{name}</h1><p>{tagline}</p></div></body></html>"""
    asyncio.run(render_html(html, 2560, 1440, out))
    im = Image.open(out)
    im.crop((0, 508, 2560, 931)).save(Path(out).with_suffix(".desktop.jpg"), quality=90)
    im.crop((507, 508, 2053, 931)).save(Path(out).with_suffix(".phone.jpg"), quality=90)


def avatar(art, out, zoom=1.0, dy=0):
    im = Image.open(art).convert("RGB")
    w, h = im.size
    side = int(min(w, h) / zoom)
    cx, cy = w // 2, h // 2 + dy
    im = im.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)).resize((800, 800), Image.LANCZOS)
    im.save(out, quality=95)
    # circle previews at the sizes YouTube actually shows
    from PIL import ImageDraw
    sheet = Image.new("RGB", (98 + 48 + 32 + 40, 98), "#181818")
    x = 0
    for s in (98, 48, 32):
        a = im.resize((s, s), Image.LANCZOS)
        m = Image.new("L", (s, s), 0)
        ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255)
        sheet.paste(a, (x, (98 - s) // 2), m)
        x += s + 20
    sheet.save(Path(out).with_suffix(".sizes.png"))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("kind", choices=["banner", "avatar"])
    ap.add_argument("art"); ap.add_argument("out")
    ap.add_argument("--name"); ap.add_argument("--tagline", default=""); ap.add_argument("--style", default="fantasy")
    ap.add_argument("--zoom", type=float, default=1.0); ap.add_argument("--dy", type=int, default=0)
    ap.add_argument("--focus", type=float, default=50)
    ap.add_argument("--fx", type=float, default=50)
    ap.add_argument("--scrim", type=float, default=None)
    ap.add_argument("--name-px", type=int, default=128)
    ap.add_argument("--tag-px", type=int, default=48)
    a = ap.parse_args()
    if a.kind == "banner":
        banner(a.art, a.out, a.name, a.tagline, a.style, a.zoom, a.focus, a.fx, a.scrim, a.name_px, a.tag_px)
    else:
        avatar(a.art, a.out, a.zoom, a.dy)
    print("wrote", a.out)
