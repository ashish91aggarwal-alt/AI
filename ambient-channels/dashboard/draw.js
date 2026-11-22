const kp = () => { const k = dash.data('kpis'); return k.status === 'ok' && k.data && k.data[0] ? k.data[0] : null; };
const kdraw = (name, f) => dash.draw(name, (el) => { const k = kp(); el.textContent = k ? f(k) : '—'; el.classList.toggle('dash-skeleton', !k && dash.data('kpis').status === 'loading'); });
const nice = (d) => (d ? AC.day(new Date(d + 'T00:00:00Z')) : '—');
kdraw('k-passed', (k) => String(k.gates_passed));
kdraw('k-passed2', (k) => k.gates_passed + ' / ' + k.gates_total);
kdraw('k-total', (k) => String(k.gates_total));
kdraw('k-next', (k) => k.next_card || 'none scheduled');
kdraw('k-next2', (k) => k.next_card || '—');
kdraw('k-nextd', (k) => nice(k.next_target));
kdraw('k-nextd2', (k) => nice(k.next_target));
kdraw('k-toptitle', (k) => (k.top_title ? '“' + k.top_title.replace(/\s*\|.*$/, '').trim() + '”' : '—'));
kdraw('k-topvpd', (k) => AC.fmt(k.top_vpd));
kdraw('k-cards', (k) => String(k.cards));
kdraw('k-review', (k) => String(k.in_review));
kdraw('k-tracked', (k) => String(k.tracked));
kdraw('k-snap', (k) => k.snapshot || '—');
kdraw('k-spend', (k) => d3.format('$,.2f')(k.spent_usd));
kdraw('k-budget', (k) => d3.format('$,.0f')(k.budget_usd));
dash.draw('k-gatebar', (el) => { const k = kp(); el.style.width = k && k.gates_total ? Math.max(2, 100 * k.gates_passed / k.gates_total) + '%' : '0'; });
dash.draw('k-spendbar', (el) => { const k = kp(); el.style.width = k && k.budget_usd ? Math.max(2, Math.min(100, 100 * k.spent_usd / k.budget_usd)) + '%' : '0'; });

dash.draw('momentum-chart', (el) => {
  const d = dash.data('momentum');
  if (d.status !== 'ok' || !d.data) { el.textContent = d.status === 'error' ? 'Failed to load' : '—'; return; }
  const series = ['fantasy', 'worship', 'pets', 'watch'].map((l) => ({name: l[0].toUpperCase() + l.slice(1), color: AC.color(l),
    pts: d.data.filter((r) => r.lane === l).map((r) => ({x: new Date(r.week + 'T00:00:00Z'), y: r.median_views_per_day}))})).filter((s) => s.pts.length);
  AC.lines(el, series, {h: 280, label: 'Weekly median views per day of competitor uploads by lane', xFmt: (t) => 'wk ' + AC.day(t)});
});

dash.draw('lane-chart', (el) => {
  const d = dash.data('lanes');
  if (d.status !== 'ok' || !d.data) { el.textContent = d.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const rows = d.data.filter((r) => r.median_like_rate !== null);
  const W = el.clientWidth || 360, rowH = 46, m = {t: 6, r: 70, b: 24, l: 76};
  const H = m.t + m.b + rows.length * rowH;
  const x = d3.scaleLinear().domain([0, Math.max(0.03, d3.max(rows, (r) => r.median_like_rate) * 1.15)]).range([m.l, W - m.r]);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Median like-rate per lane compared with the 1% gate');
  const defs = svg.append('defs');
  svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(W / 110))).tickFormat(d3.format('.0%'))).call((g) => { g.select('.domain').remove(); g.selectAll('line').remove(); });
  rows.forEach((r, i) => {
    const id = AC.uid(), gr = defs.append('linearGradient').attr('id', id);
    gr.append('stop').attr('offset', '0%').style('stop-color', AC.color(r.lane)).style('stop-opacity', 0.55);
    gr.append('stop').attr('offset', '100%').style('stop-color', AC.color(r.lane));
    const g = svg.append('g').attr('transform', `translate(0,${m.t + i * rowH})`);
    g.append('rect').attr('x', m.l).attr('y', 8).attr('height', rowH - 18).attr('width', W - m.r - m.l).attr('rx', (rowH - 18) / 2).style('fill', 'var(--cds-chart-grid)').style('opacity', 0.5);
    g.append('rect').attr('x', m.l).attr('y', 8).attr('height', rowH - 18).attr('rx', (rowH - 18) / 2).attr('width', Math.max(rowH - 18, x(r.median_like_rate) - m.l)).style('fill', `url(#${id})`);
    g.append('text').attr('x', m.l - 10).attr('y', rowH / 2 + 1).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').style('fill', 'var(--color-fg)').text(r.lane[0].toUpperCase() + r.lane.slice(1));
    g.append('text').attr('x', x(r.median_like_rate) + 8).attr('y', rowH / 2 + 1).attr('dominant-baseline', 'middle').style('fill', 'var(--color-fg)').style('font-weight', 600).text(AC.pct(r.median_like_rate));
  });
  svg.append('line').attr('x1', x(AC.GATE_LINE)).attr('x2', x(AC.GATE_LINE)).attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--color-fg)').style('opacity', 0.45).style('stroke-dasharray', '4 3');
});

dash.draw('hot-cards', (el) => {
  const d = dash.data('videos');
  el.replaceChildren();
  if (d.status !== 'ok') return;
  d.data.filter((v) => v.own !== '1').sort((a, b) => +b.views_per_day - +a.views_per_day).slice(0, 6).forEach((v) => {
    const c = d3.select(el).append('article').attr('class', 'ac-vcard ' + AC.cls(v.lane)).attr('id', 'hot-' + v.video_id);
    c.append('div').attr('class', 'ac-big').attr('data-source', 'videos').attr('data-field', 'views_per_day').attr('data-where', 'video_id=' + encodeURIComponent(v.video_id)).text(AC.fmt(+v.views_per_day)).append('small').text('views/day');
    c.append('a').attr('href', v.url).attr('target', '_blank').attr('rel', 'noopener').text(v.title.replace(/\s*\|.*$/, ''));
    const ch = c.append('div').attr('class', 'ac-chips');
    AC.chip(ch, v.channel, AC.cls(v.lane));
    AC.chip(ch, '♥ ' + AC.pct(AC.num(v.like_rate)), AC.likeCls(AC.num(v.like_rate)));
    if (+v.outlier_x >= 3) AC.chip(ch, '🔥 ' + d3.format('.1f')(+v.outlier_x) + '×', 'c-ember');
  });
});

dash.draw('cc', (el) => { const d = dash.data('board'); el.textContent = d.status === 'ok' ? String(d.data.filter((c) => c.stage === el.dataset.stage).length) : '—'; });
dash.draw('col', (el) => {
  const d = dash.data('board');
  el.replaceChildren();
  if (d.status !== 'ok') return;
  const G = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];
  d.data.filter((c) => c.stage === el.dataset.stage).sort((a, b) => +a.priority - +b.priority).forEach((c) => {
    const job = d3.select(el).append('article').attr('class', 'ac-job ' + AC.cls(c.channel)).attr('id', 'card-' + c.card);
    const top = job.append('div').attr('class', 'ac-chips');
    AC.chip(top, c.card, AC.cls(c.channel));
    AC.chip(top, 'P' + c.priority, +c.priority === 1 ? 'c-rose' : 'c-gold');
    if (c.in_review) AC.chip(top, '🖋 needs sign-off', 'c-gold');
    job.append('div').attr('class', 'ac-jt').attr('data-source', 'board').attr('data-field', 'title').attr('data-where', 'card=' + encodeURIComponent(c.card)).text(c.title);
    const dots = job.append('div').attr('class', 'ac-dots').attr('aria-label', c.gates_passed + ' of 8 gates passed');
    const passed = +c.gates_passed, review = (c.in_review || '').split(',');
    G.forEach((g, i) => dots.append('i').attr('class', i < passed ? 'p' : review.includes(g) ? 'r' : ''));
    const meta = job.append('div').attr('class', 'ac-chips');
    meta.append('span').attr('class', 'ac-chip sm c-violet').attr('data-source', 'board').attr('data-field', 'next_gate_name').attr('data-where', 'card=' + encodeURIComponent(c.card)).text(c.next_gate ? c.next_gate + ' ' + c.next_gate_name : 'all gates passed');
    if (c.publish_target) meta.append('span').attr('class', 'ac-chip sm c-rose').attr('data-source', 'board').attr('data-field', 'publish_target').attr('data-where', 'card=' + encodeURIComponent(c.card)).text('🗓 ' + AC.day(new Date(c.publish_target + 'T00:00:00Z')));
    meta.append('span').attr('class', 'ac-chip sm c-teal').attr('data-source', 'board').attr('data-field', 'budget_usd').attr('data-where', 'card=' + encodeURIComponent(c.card)).text('$' + c.budget_usd + ' cap');
    AC.chip(meta, c.owner ? '🤖 ' + c.owner : 'unclaimed', c.owner ? AC.roleCls(c.owner) : '');
    if (c.youtube_id) meta.append('a').attr('class', 'ac-chip sm c-tide').attr('href', 'https://youtu.be/' + c.youtube_id).attr('target', '_blank').attr('rel', 'noopener')
      .attr('data-source', 'board').attr('data-field', 'youtube_id').attr('data-where', 'card=' + encodeURIComponent(c.card)).text('▶ youtu.be/' + c.youtube_id);
  });
});

const compRows = () => { const d = dash.data('channels'); return d.status === 'ok' ? d.data.filter((c) => c.own !== '1' && (!AC.lane || c.lane === AC.lane)) : null; };

dash.draw('comp-cards', (el) => {
  const rows = compRows(), vd = dash.data('videos');
  el.replaceChildren();
  if (!rows || vd.status !== 'ok') return;
  rows.slice().sort((a, b) => +b.median_views_per_day - +a.median_views_per_day).forEach((c) => {
    const card = d3.select(el).append('article').attr('class', 'ac-ccard ' + AC.cls(c.lane)).attr('id', 'ch-' + c.channel_id);
    const head = card.append('div').attr('class', 'ac-cn');
    head.append('a').attr('href', c.url).attr('target', '_blank').attr('rel', 'noopener').text(c.channel);
    AC.chip(head, c.lane, AC.cls(c.lane));
    const st = card.append('div').attr('class', 'ac-stats');
    const stat = (label, field, txt) => { const s = st.append('div'); s.append('b').attr('data-source', 'channels').attr('data-field', field).attr('data-where', 'channel_id=' + encodeURIComponent(c.channel_id)).text(txt); s.append('span').text(label); };
    stat('subs', 'subs', AC.fmt(AC.num(c.subs)));
    stat('views/day', 'median_views_per_day', AC.fmt(AC.num(c.median_views_per_day)));
    stat('uploads/wk', 'uploads_per_week', c.uploads_per_week ? d3.format('.1f')(+c.uploads_per_week) : '—');
    const pts = vd.data.filter((v) => v.channel === c.channel && v.published).sort((a, b) => a.published.localeCompare(b.published)).map((v) => +v.views_per_day);
    AC.spark(card.append('div').attr('class', 'ac-spark').node(), pts, AC.color(c.lane));
    const chips = card.append('div').attr('class', 'ac-chips');
    const lr = AC.num(c.median_like_rate);
    AC.chip(chips, '♥ ' + AC.pct(lr), AC.likeCls(lr));
    if (+c.subs < 50000 && +c.median_views_per_day >= 500) AC.chip(chips, '🚀 small & fast', 'c-teal');
    if (c.paid_views_suspect === '1') AC.chip(chips, '⚠ paid views?', 'c-rose');
    if (c.last_upload) AC.chip(chips, 'last ' + AC.day(new Date(c.last_upload + 'T00:00:00Z')), '');
  });
});

dash.draw('scatter', (el) => {
  const rows = compRows();
  if (!rows) { el.textContent = dash.data('channels').status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const pts = rows.filter((c) => +c.subs > 0 && +c.median_views_per_day > 0);
  if (!pts.length) return;
  const W = el.clientWidth || 600, H = 300, m = {t: 14, r: 18, b: 34, l: 48};
  const x = d3.scaleLog().domain(d3.extent(pts, (c) => +c.subs)).nice().range([m.l, W - m.r]);
  const y = d3.scaleLog().domain(d3.extent(pts, (c) => +c.median_views_per_day)).nice().range([H - m.b, m.t]);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Scatter of channel subscribers against median views per day');
  const ax = (g) => { g.select('.domain').remove(); g.selectAll('line').style('stroke', 'var(--cds-chart-grid)'); };
  svg.append('g').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.max(2, Math.floor(W / 120)), '~s').tickSize(-(H - m.t - m.b))).call(ax);
  svg.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5, '~s').tickSize(-(W - m.l - m.r))).call(ax);
  svg.append('text').attr('x', W - m.r).attr('y', H - 4).attr('text-anchor', 'end').text('subscribers →');
  svg.append('text').attr('x', m.l + 4).attr('y', m.t + 10).text('↑ views/day');
  const tip = d3.select(el).append('div').attr('class', 'ac-tip');
  svg.selectAll('circle.glow').data(pts).join('circle').attr('class', 'glow').attr('cx', (c) => x(+c.subs)).attr('cy', (c) => y(+c.median_views_per_day)).attr('r', 15).style('fill', (c) => AC.color(c.lane)).style('opacity', 0.15);
  svg.selectAll('circle.pt').data(pts).join('circle').attr('class', 'pt').attr('cx', (c) => x(+c.subs)).attr('cy', (c) => y(+c.median_views_per_day)).attr('r', 7)
    .style('fill', (c) => AC.color(c.lane)).style('stroke', 'var(--color-panel)').style('stroke-width', 2).style('cursor', 'pointer')
    .on('pointerenter pointermove', (ev, c) => { tip.replaceChildren(); tip.append('strong').text(c.channel); tip.append('span').text(`${AC.fmt(+c.subs)} subs · ${AC.fmt(+c.median_views_per_day)} views/day`); tip.append('span').text('like-rate ' + AC.pct(AC.num(c.median_like_rate))); AC.tipAt(tip, el, ev); })
    .on('pointerleave', () => tip.style('opacity', 0));
  const label = pts.slice().sort((a, b) => +b.median_views_per_day / +b.subs - +a.median_views_per_day / +a.subs).slice(0, W > 520 ? 4 : 2);
  svg.selectAll('text.lb').data(label).join('text').attr('class', 'lb').attr('x', (c) => x(+c.subs) + 11).attr('y', (c) => y(+c.median_views_per_day) + 4).style('fill', 'var(--color-fg)').text((c) => c.channel);
});

dash.draw('growth-chart', (el) => {
  const d = dash.data('growth');
  if (d.status !== 'ok') { el.textContent = d.status === 'error' ? 'Failed to load' : '—'; return; }
  const rows = d.data.filter((r) => (!AC.lane || r.lane === AC.lane) && +r.subs > 0);
  const series = Array.from(d3.group(rows, (r) => r.channel), ([name, rs]) => ({name, color: AC.color(rs[0].lane), w: 1.75, pts: rs.map((r) => ({x: new Date(r.date + 'T00:00:00Z'), y: +r.subs}))}));
  AC.lines(el, series, {h: 300, log: true, area: false, label: 'Subscribers over time per tracked channel'});
});

dash.draw('comp-rows', (tb) => {
  const rows = compRows();
  tb.replaceChildren();
  if (!rows) return;
  rows.slice().sort((a, b) => +b.median_views_per_day - +a.median_views_per_day).forEach((c) => {
    const tr = d3.select(tb).append('tr').attr('data-key', c.channel_id);
    tr.append('td').append('a').attr('href', c.url).attr('target', '_blank').attr('rel', 'noopener').text(c.channel);
    AC.chip(tr.append('td'), c.lane, AC.cls(c.lane));
    tr.append('td').attr('class', 'n').text(AC.fmt(AC.num(c.subs)));
    tr.append('td').attr('class', 'n').text(AC.fmt(AC.num(c.videos)));
    AC.chip(tr.append('td').attr('class', 'n'), AC.pct(AC.num(c.median_like_rate)), AC.likeCls(AC.num(c.median_like_rate)));
    tr.append('td').attr('class', 'n').text(AC.fmt(AC.num(c.median_views_per_day)));
    tr.append('td').attr('class', 'n').text(c.uploads_per_week ? d3.format('.1f')(+c.uploads_per_week) : '—');
    tr.append('td').text(c.last_upload || '—');
  });
});

dash.draw('vh-chart', (el) => {
  const d = dash.data('video_history'), vd = dash.data('videos');
  if (d.status !== 'ok' || vd.status !== 'ok') { el.textContent = d.status === 'error' ? 'Failed to load' : '—'; return; }
  const top = new Set(vd.data.filter((v) => v.own !== '1' && (!AC.lane || v.lane === AC.lane)).sort((a, b) => +b.views_per_day - +a.views_per_day).slice(0, 8).map((v) => v.video_id));
  const pal = ['var(--ac-ember)', 'var(--ac-tide)', 'var(--ac-violet)', 'var(--ac-gold)', 'var(--ac-teal)', 'var(--ac-rose)', 'var(--ac-moss)', 'var(--color-fg-muted)'];
  const series = Array.from(d3.group(d.data.filter((r) => top.has(r.video_id)), (r) => r.video_id), ([id, rs], i) => ({
    name: rs[0].title.replace(/\s*\|.*$/, '').slice(0, 40), color: pal[i % pal.length],
    pts: rs.map((r) => ({x: new Date(r.ts.replace(' ', 'T') + ':00Z'), y: +r.views}))}));
  AC.lines(el, series, {h: 280, area: false, label: 'Views over time of the hottest competitor uploads', xFmt: d3.utcFormat('%-d %b %H:%M')});
});

dash.draw('video-rows', (tb) => {
  const d = dash.data('videos');
  tb.replaceChildren();
  if (d.status !== 'ok') return;
  d.data.filter((v) => !AC.lane || v.lane === AC.lane).sort((a, b) => +b.views_per_day - +a.views_per_day).slice(0, 80).forEach((v) => {
    const tr = d3.select(tb).append('tr').attr('data-key', v.video_id);
    tr.append('td').append('a').attr('href', v.url).attr('target', '_blank').attr('rel', 'noopener').text(v.title);
    AC.chip(tr.append('td'), v.channel + (v.own === '1' ? ' (ours)' : ''), AC.cls(v.lane));
    tr.append('td').text(v.published);
    tr.append('td').attr('class', 'n').text(AC.fmt(+v.views));
    tr.append('td').attr('class', 'n').text(AC.fmt(+v.views_per_day));
    AC.chip(tr.append('td').attr('class', 'n'), AC.pct(AC.num(v.like_rate)), AC.likeCls(AC.num(v.like_rate)));
    const o = +v.outlier_x;
    AC.chip(tr.append('td').attr('class', 'n'), v.outlier_x ? (o >= 3 ? '🔥 ' : '') + d3.format('.1f')(o) + '×' : '—', o >= 3 ? 'c-ember' : '');
  });
});

dash.onData(() => {
  const o = dash.data('own_daily');
  document.querySelectorAll('#own-empty').forEach((el) => { el.hidden = o.status === 'ok' && o.data.length > 0; });
  const g = dash.data('growth');
  const days = g.status === 'ok' ? new Set(g.data.map((r) => r.date)).size : 0;
  document.querySelectorAll('#g-one').forEach((el) => { el.hidden = !(g.status === 'ok' && days < 2); });
  document.querySelectorAll('#g-many').forEach((el) => { el.hidden = !(g.status === 'ok' && days >= 2); });
  const vh = dash.data('video_history');
  const runs = vh.status === 'ok' ? new Set(vh.data.map((r) => r.ts)).size : 0;
  document.querySelectorAll('#vh-one').forEach((el) => { el.hidden = !(vh.status === 'ok' && runs < 2); });
  document.querySelectorAll('#vh-many').forEach((el) => { el.hidden = !(vh.status === 'ok' && runs >= 2); });
});
dash.draw('g-date', (el) => { const g = dash.data('growth'); el.textContent = g.status === 'ok' && g.data[0] ? g.data[0].date : '—'; });
dash.draw('g-days', (el) => { const g = dash.data('growth'); el.textContent = g.status === 'ok' ? String(new Set(g.data.map((r) => r.date)).size) : '—'; });

dash.draw('own-line', (el) => {
  const d = dash.data('own_daily'), metric = el.dataset.metric;
  if (d.status !== 'ok') { el.textContent = d.status === 'error' ? 'Failed to load' : '—'; return; }
  const conv = metric === 'estimatedMinutesWatched' ? (v) => v / 60 : metric === 'averageViewDuration' ? (v) => v / 60 : (v) => v;
  const series = Array.from(d3.group(d.data, (r) => r.channel), ([ch, rs]) => ({name: AC.name(ch), color: AC.color(ch),
    pts: rs.map((r) => ({x: new Date(r.day + 'T00:00:00Z'), y: conv(+r[metric])}))}));
  AC.lines(el, series, {h: 220, label: 'Our channels daily ' + metric, empty: 'Waiting for our first uploads', yFmt: metric === 'averageViewDuration' ? d3.format('.1f') : (v) => AC.fmt(v)});
});

dash.draw('sess', (el) => {
  const d = dash.data('sessions');
  el.replaceChildren();
  if (d.status !== 'ok') return;
  const icon = {orchestrator: '🧭', 'channel-fantasy': '🔥', 'channel-worship': '🕊️'};
  d.data.forEach((s) => {
    const card = d3.select(el).append('div').attr('class', 'ac-card tint edge ' + AC.roleCls(s.role)).attr('id', 'role-' + s.role);
    const head = card.append('div').attr('class', 'ac-head');
    head.append('h3').text((icon[s.role] || '🤖') + ' ' + s.role);
    if (s.blocked) AC.chip(head, 'blocked', 'c-rose'); else AC.chip(head, 'clear', 'c-teal');
    const dl = card.append('dl');
    const row = (k, f) => { dl.append('dt').text(k); dl.append('dd').attr('data-source', 'sessions').attr('data-field', f).attr('data-where', 'role=' + encodeURIComponent(s.role)).text(s[f] || '—'); };
    row('Updated (UTC)', 'updated_utc'); row('Doing', 'doing'); row('Next', 'next'); row('Blocked', 'blocked');
  });
});

// Insights tab: content links and research findings per channel (data/insights/*.json)
const INSIGHT_KIND = {content: ['📺 Content', 'c-tide'], live: ['🔄 Live', 'c-teal'], length: ['⏱ Length', 'c-gold'], niche: ['🔎 Niche', 'c-violet'], keywords: ['🏷 Keywords', 'c-teal'],
  packaging: ['🖼 Packaging', 'c-moss'], timing: ['🕖 Timing', 'c-ember'], next: ['➡️ Next', 'c-rose']};
dash.draw('insight-cards', (el) => {
  const d = dash.data('insights');
  el.replaceChildren();
  if (d.status !== 'ok') { el.textContent = d.status === 'error' ? 'Failed to load' : '—'; return; }
  const want = el.dataset.kinds ? el.dataset.kinds.split(' ') : null;
  d.data.forEach((r, i) => {
    const isContent = r.kind === 'content';
    if (want ? !want.includes(r.kind) : isContent) return;
    const k = INSIGHT_KIND[r.kind] || [r.kind, ''];
    const card = d3.select(el).append('article').attr('class', 'ac-vcard ' + AC.cls(r.channel)).attr('id', 'ins-' + i);
    const top = card.append('div').attr('class', 'ac-chips');
    AC.chip(top, AC.icon(r.channel) + ' ' + AC.name(r.channel), AC.cls(r.channel));
    AC.chip(top, k[0], k[1]);
    if (r.metric) top.append('span').attr('class', 'ac-chip sm c-gold').attr('data-source', 'insights').attr('data-field', 'metric').attr('data-row', i).text(r.metric);
    const t = card.append(r.link ? 'a' : 'div').attr('class', 'ac-it').attr('data-source', 'insights').attr('data-field', 'title').attr('data-row', i).text(r.title);
    if (r.link) t.attr('href', r.link).attr('target', '_blank').attr('rel', 'noopener');
    card.append('div').attr('class', 'ac-id').attr('data-source', 'insights').attr('data-field', 'detail').attr('data-row', i).text((r.detail || '').replace(/\\n/g, '\n'));
    card.append('div').attr('class', 'ac-note').text('Source: ' + (r.source || '—') + (r.date ? ' · ' + r.date : ''));
  });
});
