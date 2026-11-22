window.__cov = async (page) => {
  const items = [...document.querySelectorAll('a[href*="/reel/"]')].map(a => {
    const el = a.querySelector('[style*="background-image"]'), m = el && el.style.backgroundImage.match(/url\("?(.*?)"?\)/);
    return { id: (a.getAttribute('href').match(/\/reel\/([^/]+)/) || [])[1], url: m && m[1], t: a.innerText.trim() };
  }).filter(o => o.url);
  const dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight, cols = 4, rows = 3;
  let c = document.getElementById('__sheet'); if (c) c.remove();
  c = document.createElement('canvas'); c.id = '__sheet'; c.width = W * dpr; c.height = H * dpr;
  c.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:2147483647;background:#111`;
  document.body.appendChild(c); setTimeout(() => c.remove(), 30000);
  const g = c.getContext('2d'); g.scale(dpr, dpr); g.imageSmoothingQuality = 'high';
  const cw = W / cols, ch = H / rows, sl = items.slice(page * 12, page * 12 + 12);
  await Promise.all(sl.map((o, i) => new Promise(r => {
    const im = new Image();
    im.onload = () => { const fh = ch - 14, fw = Math.min(cw - 2, fh * im.naturalWidth / im.naturalHeight), x = (i % cols) * cw + (cw - fw) / 2, y = Math.floor(i / cols) * ch;
      g.drawImage(im, x, y, fw, fh); g.fillStyle = '#fff'; g.font = '11px sans-serif'; g.fillText(o.id + '  ' + o.t, x + 2, y + fh + 11); r(); };
    im.onerror = () => r(); im.src = o.url; setTimeout(r, 4000);
  })));
  return { total: items.length, shown: sl.length };
}; await window.__cov(0)
