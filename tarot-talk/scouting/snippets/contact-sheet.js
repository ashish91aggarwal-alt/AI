await (async (n, from, to) => {
  const v = window.__v; if (!v || !isFinite(v.duration)) return 'no video';
  v.pause();
  const d = v.duration, dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  const cols = n ? Math.ceil(Math.sqrt(n * 1.4)) : (W >= 700 ? 4 : 3), rows = n ? Math.ceil(n / cols) : 2; n = n || cols * rows;
  let ts = [];
  if (from != null) for (let i = 0; i < n; i++) ts.push(from + (to - from) * i / Math.max(1, n - 1));
  else { ts = [0.3, 2.5]; for (let i = 1; i <= n - 3; i++) ts.push(2.5 + (d - 5) * i / (n - 2)); ts.push(d - 2); }
  ts = [...new Set(ts.map(t => +Math.min(Math.max(t, 0), d - 0.2).toFixed(1)))].sort((a, b) => a - b);
  let c = document.getElementById('__sheet'); if (c) c.remove();
  c = document.createElement('canvas'); c.id = '__sheet'; c.width = W * dpr; c.height = H * dpr;
  c.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:2147483647;background:#111`;
  document.body.appendChild(c); setTimeout(() => c.remove(), 30000);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const ar = (v.videoWidth || 9) / (v.videoHeight || 16), cw = W / cols, ch = H / rows, fh = Math.min(ch - 16, cw / ar), fw = fh * ar;
  for (let i = 0; i < ts.length; i++) {
    v.currentTime = ts[i];
    await new Promise(r => { const h = () => { v.removeEventListener('seeked', h); r(); }; v.addEventListener('seeked', h); setTimeout(r, 2500); });
    await new Promise(r => setTimeout(r, 120));
    const x = (i % cols) * cw + (cw - fw) / 2, y = Math.floor(i / cols) * ch;
    g.drawImage(v, x, y, fw, fh);
    g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(ts[i] + 's', x + 2, y + fh + 12);
  }
  return ts.join(',');
})()
