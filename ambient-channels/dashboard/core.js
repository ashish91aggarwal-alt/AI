window.AC = {
  num: (v) => (v === null || v === undefined || v === '' ? null : +v),
  fmt: (v) => (v === null || isNaN(v) ? '—' : v >= 1000 ? d3.format('.3~s')(v).replace('G', 'B') : d3.format(',.0f')(v)),
  pct: (v) => (v === null || isNaN(v) ? '—' : d3.format('.1%')(v)),
  color: (l) => ({fantasy: 'var(--ac-ember)', worship: 'var(--ac-tide)', pets: 'var(--ac-rose)', watch: 'var(--ac-violet)'}[l] || 'var(--ac-gold)'),
  cls: (l) => ({fantasy: 'c-ember', worship: 'c-tide', pets: 'c-rose', watch: 'c-violet'}[l] || 'c-gold'),
  roleCls: (r) => ({orchestrator: 'c-violet', 'channel-fantasy': 'c-ember', 'channel-worship': 'c-tide'}[r] || 'c-gold'),
  likeCls: (v) => (v === null ? '' : v >= 0.015 ? 'c-teal' : v >= 0.01 ? 'c-gold' : 'c-rose'),
  lane: '',
  name: (l) => ({fantasy: 'Page & Lantern', worship: 'Prayer Pastures', pets: 'Paws & Nooks'}[l] || l),
  icon: (l) => ({fantasy: '🏮', worship: '🕊️', pets: '🐾'}[l] || '📺'),
  GATE_LINE: 0.01,
  day: d3.utcFormat('%-d %b'),
  uid: () => 'g' + Math.random().toString(36).slice(2, 9),
  chip: (sel, text, cls) => sel.append('span').attr('class', 'ac-chip sm ' + (cls || '')).text(text),
  tipAt: (tip, el, ev) => { const [px, py] = d3.pointer(ev, el); tip.style('left', Math.max(0, Math.min(px + 14, el.clientWidth - 262)) + 'px').style('top', Math.max(0, py - 12) + 'px').style('opacity', 1); },
  // multi-series line chart with gradient areas, crosshair tooltip
  lines(el, series, o) {
    o = Object.assign({h: 260, log: false, yFmt: (v) => AC.fmt(v), xFmt: AC.day, area: true, label: 'Line chart'}, o);
    el.replaceChildren();
    const all = series.flatMap((s) => s.pts);
    if (!all.length) { el.textContent = o.empty || 'No data yet'; return; }
    const W = el.clientWidth || 600, H = o.h, m = {t: 12, r: 14, b: 28, l: 48};
    let ext = d3.extent(all, (p) => p.x);
    if (+ext[0] === +ext[1]) ext = [d3.utcDay.offset(ext[0], -1), d3.utcDay.offset(ext[1], 1)];
    const x = d3.scaleUtc().domain(ext).range([m.l, W - m.r]);
    const yr = d3.extent(all, (p) => p.y);
    const y = (o.log ? d3.scaleLog().domain([Math.max(1, yr[0] * 0.8), yr[1] * 1.2]) : d3.scaleLinear().domain([0, (yr[1] || 1) * 1.1])).nice().range([H - m.b, m.t]);
    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', o.label);
    const defs = svg.append('defs');
    svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5, o.log ? '~s' : undefined).tickFormat(o.log ? null : o.yFmt).tickSize(-(W - m.l - m.r)))
      .call((g) => { g.select('.domain').remove(); g.selectAll('line').style('stroke', 'var(--cds-chart-grid)'); });
    svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(W / 120))).tickFormat(o.xFmt))
      .call((g) => { g.select('.domain').style('stroke', 'var(--cds-chart-axis)'); g.selectAll('line').remove(); });
    series.forEach((s) => {
      s.pts.sort((a, b) => a.x - b.x);
      if (o.area && !o.log) {
        const id = AC.uid(), gr = defs.append('linearGradient').attr('id', id).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
        gr.append('stop').attr('offset', '0%').style('stop-color', s.color).style('stop-opacity', 0.35);
        gr.append('stop').attr('offset', '100%').style('stop-color', s.color).style('stop-opacity', 0);
        svg.append('path').datum(s.pts).attr('d', d3.area().x((p) => x(p.x)).y0(H - m.b).y1((p) => y(p.y))).style('fill', `url(#${id})`);
      }
      svg.append('path').datum(s.pts).attr('d', d3.line().x((p) => x(p.x)).y((p) => y(p.y))).style('fill', 'none').style('stroke', s.color).style('stroke-width', s.w || 2.25).style('stroke-linejoin', 'round').style('stroke-linecap', 'round');
      svg.append('g').selectAll('circle').data(s.pts).join('circle').attr('cx', (p) => x(p.x)).attr('cy', (p) => y(p.y)).attr('r', s.pts.length > 30 ? 0 : 3.2).style('fill', 'var(--color-panel)').style('stroke', s.color).style('stroke-width', 2);
    });
    const tip = d3.select(el).append('div').attr('class', 'ac-tip');
    const guide = svg.append('line').attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').style('stroke-dasharray', '3 3').style('opacity', 0);
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).style('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px] = d3.pointer(ev); const t = x.invert(px);
        let best = null;
        series.forEach((s) => s.pts.forEach((p) => { const d = Math.abs(p.x - t); if (!best || d < best.d) best = {d, p}; }));
        if (!best) return;
        const at = +best.p.x, hits = series.map((s) => ({s, p: s.pts.find((q) => +q.x === at)})).filter((h) => h.p);
        guide.attr('x1', x(best.p.x)).attr('x2', x(best.p.x)).style('opacity', 1);
        tip.replaceChildren(); tip.append('strong').text(o.xFmt(best.p.x));
        hits.sort((a, b) => b.p.y - a.p.y).slice(0, 8).forEach((h) => tip.append('span').text(`${h.s.name}: ${o.yFmt(h.p.y)}`).style('color', h.s.color));
        AC.tipAt(tip, el, ev);
      })
      .on('pointerleave', () => { tip.style('opacity', 0); guide.style('opacity', 0); });
  },
  spark(el, pts, color) {
    el.replaceChildren();
    if (pts.length < 2) return;
    const W = el.clientWidth || 200, H = 46, id = AC.uid();
    const x = d3.scaleLinear().domain([0, pts.length - 1]).range([2, W - 2]);
    const y = d3.scaleLog().domain([Math.max(1, d3.min(pts) * 0.8), d3.max(pts) * 1.1]).range([H - 3, 3]);
    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Views per day of recent uploads');
    const gr = svg.append('defs').append('linearGradient').attr('id', id).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    gr.append('stop').attr('offset', '0%').style('stop-color', color).style('stop-opacity', 0.35);
    gr.append('stop').attr('offset', '100%').style('stop-color', color).style('stop-opacity', 0);
    svg.append('path').datum(pts).attr('d', d3.area().x((v, i) => x(i)).y0(H).y1((v) => y(Math.max(1, v)))).style('fill', `url(#${id})`);
    svg.append('path').datum(pts).attr('d', d3.line().x((v, i) => x(i)).y((v) => y(Math.max(1, v)))).style('fill', 'none').style('stroke', color).style('stroke-width', 2);
    svg.append('circle').attr('cx', x(pts.length - 1)).attr('cy', y(Math.max(1, pts[pts.length - 1]))).attr('r', 3).style('fill', color);
  }
};

dash.calc('kpis', {
  title: 'Headline numbers',
  description: 'Counts and leaders worked out from the production board, tracked channels and recent videos.',
  inputs: ['board', 'channels', 'videos'],
  fn: (board, channels, videos) => {
    const n = (v) => (v === null || v === '' ? 0 : +v);
    const open = board.filter((c) => !['published', 'measured'].includes(c.stage) && c.publish_target).sort((a, b) => a.publish_target.localeCompare(b.publish_target));
    const top = videos.filter((v) => v.own !== '1').sort((a, b) => n(b.views_per_day) - n(a.views_per_day))[0] || {};
    return [{
      cards: board.length,
      gates_passed: board.reduce((s, c) => s + n(c.gates_passed), 0),
      gates_total: board.length * 8,
      in_review: board.filter((c) => c.in_review).length,
      next_card: open[0] ? open[0].card : '',
      next_target: open[0] ? open[0].publish_target : '',
      tracked: channels.filter((c) => c.own !== '1').length,
      snapshot: channels[0] ? channels[0].snapshot_utc : '',
      top_title: top.title || '',
      top_vpd: n(top.views_per_day),
      spent_usd: board.reduce((s, c) => s + n(c.spent_usd), 0),
      budget_usd: board.reduce((s, c) => s + n(c.budget_usd), 0)
    }];
  }
});

dash.calc('lanes', {
  title: 'Lane medians',
  description: 'Per lane: number of channels and the median of each channel’s median like-rate and views per day.',
  inputs: ['channels'],
  fn: (channels) => {
    const med = (a) => { const s = a.filter((x) => x !== null && !isNaN(x)).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
    return ['fantasy', 'worship', 'pets', 'watch'].map((lane) => {
      const cs = channels.filter((c) => c.lane === lane && c.own !== '1');
      return {lane, channels: cs.length,
        median_like_rate: med(cs.map((c) => (c.median_like_rate === null || c.median_like_rate === '' ? null : +c.median_like_rate))),
        median_views_per_day: med(cs.map((c) => (c.median_views_per_day === null || c.median_views_per_day === '' ? null : +c.median_views_per_day)))};
    }).filter((r) => r.channels > 0);
  }
});

dash.calc('momentum', {
  title: 'Weekly upload momentum',
  description: 'Per lane and upload week (Monday start): number of competitor uploads and the median of their views per day.',
  inputs: ['videos'],
  fn: (videos) => {
    const out = [];
    const groups = d3.group(videos.filter((v) => v.own !== '1' && v.published), (v) => v.lane, (v) => d3.utcFormat('%Y-%m-%d')(d3.utcMonday.floor(new Date(v.published + 'T00:00:00Z'))));
    for (const [lane, weeks] of groups) for (const [week, vs] of weeks) out.push({lane, week, uploads: vs.length, median_views_per_day: d3.median(vs, (v) => +v.views_per_day)});
    return out.sort((a, b) => a.week.localeCompare(b.week));
  }
});

(function () {
  const show = (id) => {
    document.querySelectorAll('.ac-tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== id; });
    dash.setLink(id);
  };
  document.querySelectorAll('.ac-tab').forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
  const h = (location.hash || '').replace('#', '');
  if (h && document.querySelector('[data-panel="' + h + '"]')) show(h);
  const sync = (val) => {
    AC.lane = val;
    document.querySelectorAll('#lane-filter, #lane-filter-2').forEach((s) => { s.value = val; });
    ['scatter', 'comp-rows', 'comp-cards', 'video-rows', 'growth-chart', 'vh-chart'].forEach((n) => dash.draw(n));
  };
  document.querySelectorAll('#lane-filter, #lane-filter-2').forEach((s) => s.addEventListener('change', () => sync(s.value)));
})();
