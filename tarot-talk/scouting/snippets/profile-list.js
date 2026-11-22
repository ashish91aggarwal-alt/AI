await (async (rounds = 3) => {
  const seen = new Map();
  const grab = () => document.querySelectorAll('a[href*="/reel/"]').forEach(a => {
    const id = (a.getAttribute('href').match(/\/reel\/([^/]+)/) || [])[1];
    if (id && !seen.has(id)) seen.set(id, { t: a.innerText.replace(/\s+/g, ' ').trim(), pin: !!a.querySelector('svg[aria-label*="Pinned"]') });
  });
  grab();
  for (let i = 0; i < rounds; i++) { scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 1800)); grab(); }
  scrollTo(0, 0);
  const num = s => { const m = s.toLowerCase().replace(/,/g, '').match(/([\d.]+)\s*([kmb]?)/); return m ? Math.round(parseFloat(m[1]) * ({ k: 1e3, m: 1e6, b: 1e9 }[m[2]] || 1)) : null; };
  const rows = [...seen].map(([id, o]) => ({ id, v: num(o.t), pin: o.pin }));
  const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y), k = s.length; return k ? (k % 2 ? s[(k - 1) / 2] : Math.round((s[k / 2 - 1] + s[k / 2]) / 2)) : null; };
  const about = (document.querySelector('meta[name="description"]') || {}).content || '';
  return { about: about.slice(0, 120), n: rows.length, pinned: rows.filter(r => r.pin).length, medianNotPinned: med(rows.filter(r => !r.pin).map(r => r.v)), rows: rows.map(r => (r.pin ? '*' : '') + r.id + ':' + r.v).join(' ') };
})(3)
