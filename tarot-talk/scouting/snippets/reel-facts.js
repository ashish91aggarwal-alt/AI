await (async () => {
  const vs = [...document.querySelectorAll('video')];
  const v = vs.find(x => { const r = x.getBoundingClientRect(); return r.top >= -50 && r.top < innerHeight / 2; }) || vs[0];
  window.__v = v; if (v) v.pause();
  const more = [...document.querySelectorAll('span,div[role=button]')].find(e => e.innerText && /^…\s*more$/.test(e.innerText.trim()));
  if (more) more.click();
  await new Promise(r => setTimeout(r, 700));
  const lines = (document.querySelector('main') || document.body).innerText.split('\n').map(s => s.trim()).filter(Boolean);
  const isNum = s => /^[\d.,]+[KMB]?$/i.test(s);
  let i = lines.findIndex((s, k) => isNum(s) && isNum(lines[k + 1] || ''));
  const counters = []; if (i >= 0) for (let k = i; k < lines.length && isNum(lines[k]); k++) counters.push(lines[k]);
  const cap = (i >= 0 ? lines.slice(0, i) : lines.slice(0, 12)).filter(s => !/^(Follow|See translation)$/.test(s)).join(' / ');
  const tm = document.querySelector('time');
  return { seconds: v && isFinite(v.duration) ? Math.round(v.duration * 10) / 10 : null, size: v ? v.videoWidth + 'x' + v.videoHeight : null, posted: tm ? (tm.dateTime || tm.innerText) : null, counters, caption: cap.slice(0, 600) };
})()
