// "Our channels" — a YouTube-style mirror of our own channels, built from the API snapshot the
// tracker job takes every 6 hours (scripts/mirror.py). Nothing here plays a video, so looking at
// this page never adds a view.
window.YT = {
  ch: '',          // selected channel slug
  tab: 'videos',   // videos | comments
  vid: '',         // selected video id ('' = grid)
  open: {},        // comment id -> replies expanded
  more: false      // channel description expanded
};

(function () {
  const S = window.YT;
  const n = (v) => (v === '' || v === null || v === undefined ? null : +v);
  const unflat = (s) => (s || '').replace(/\\n/g, '\n');
  const compact = (v) => {
    v = n(v); if (v === null) return '—';
    if (v < 1000) return String(v);
    const f = v < 1e6 ? [v / 1e3, 'K'] : v < 1e9 ? [v / 1e6, 'M'] : [v / 1e9, 'B'];
    return (f[0] < 10 ? Math.floor(f[0] * 10) / 10 : Math.floor(f[0])) + f[1];
  };
  const plural = (v, w) => `${compact(v)} ${w}${n(v) === 1 ? '' : 's'}`;
  const ago = (ts) => {
    if (!ts) return '';
    const s = (Date.now() - new Date(ts.replace(' ', 'T') + (ts.length <= 16 ? ':00Z' : ''))) / 1000;
    if (s < -60) return 'scheduled ' + longDate(ts);
    const u = [[31536000, 'year'], [2592000, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
    for (const [sec, w] of u) if (s >= sec) { const k = Math.floor(s / sec); return `${k} ${w}${k > 1 ? 's' : ''} ago`; }
    return 'just now';
  };
  const dur = (s) => {
    s = n(s); if (!s) return '';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  };
  const longDate = (ts) => (ts ? new Date(ts.replace(' ', 'T') + ':00Z').toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : '');
  const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const img = (src, cls, fallbackText, laneCls) => {
    const box = h('div', cls + ' ' + (laneCls || ''));
    const fb = h('span', 'yt-fb', fallbackText || '');
    box.append(fb);
    if (src) {
      const i = new Image(); i.loading = 'lazy'; i.referrerPolicy = 'no-referrer'; i.alt = '';
      i.onload = () => { fb.remove(); }; i.onerror = () => i.remove();
      i.src = src; box.append(i);
    }
    return box;
  };
  const laneCls = (slug) => AC.cls(slug);
  const redraw = () => dash.draw('yt-mirror');

  function data() {
    const get = (k) => { const d = dash.data(k); return d.status === 'ok' ? d.data : null; };
    return {ch: get('own_channel'), v: get('own_videos'), c: get('own_comments'), hist: get('own_video_history'),
            loading: ['own_channel', 'own_videos', 'own_comments'].some((k) => dash.data(k).status === 'loading')};
  }

  function header(root, ch, vids) {
    const lc = laneCls(ch.channel);
    root.append(img(ch.banner, 'yt-banner', '', lc));
    const top = h('div', 'yt-top');
    top.append(img(ch.avatar, 'yt-avatar', (ch.title || '?')[0], lc));
    const info = h('div', 'yt-info');
    info.append(h('h1', 'yt-title', ch.title));
    const meta = h('div', 'yt-meta');
    meta.append(h('b', '', ch.handle || ''));
    meta.append(document.createTextNode(` • ${ch.subs === '' ? 'subscribers hidden' : plural(ch.subs, 'subscriber')} • ${plural(ch.video_count || vids.length, 'video')}`));
    info.append(meta);
    const desc = unflat(ch.description);
    if (desc) {
      const d = h('div', 'yt-desc' + (S.more ? ' open' : ''), S.more ? desc : desc.split('\n')[0]);
      const m = h('button', 'yt-more', S.more ? 'Show less' : '…more');
      m.onclick = () => { S.more = !S.more; redraw(); };
      info.append(d, m);
    }
    const chips = h('div', 'ac-chips');
    chips.append(h('span', 'ac-chip sm c-teal', '🔄 mirrored ' + (ch.fetched_utc ? ch.fetched_utc + ' UTC' : '—')));
    chips.append(h('span', 'ac-chip sm ' + (/^youtube-data-api/.test(ch.source) ? 'c-violet' : 'c-gold'), ch.source || ''));
    if (ch.views !== '') chips.append(h('span', 'ac-chip sm', plural(ch.views, 'total view')));
    const studio = h('a', 'ac-chip sm c-ember', '✎ Open in YouTube Studio');
    studio.href = 'https://studio.youtube.com/channel/' + ch.channel_id; studio.target = '_blank'; studio.rel = 'noopener';
    chips.append(studio);
    info.append(chips);
    top.append(info);
    root.append(top);
  }

  function tabs(root, nComments) {
    const t = h('div', 'yt-tabs');
    [['videos', 'Videos'], ['comments', `Comments${nComments ? ' (' + nComments + ')' : ''}`]].forEach(([k, label]) => {
      const b = h('button', 'yt-tab', label); b.setAttribute('aria-selected', String(S.tab === k && !S.vid));
      b.onclick = () => { S.tab = k; S.vid = ''; redraw(); }; t.append(b);
    });
    root.append(t);
  }

  function card(v, lc, small) {
    const a = h('button', small ? 'yt-next' : 'yt-card');
    a.onclick = () => { S.vid = v.video_id; S.open = {}; redraw(); document.getElementById('own').scrollIntoView({block: 'start'}); };
    const th = img(v.thumb, 'yt-thumb', '▶', lc);
    if (v.duration_s) th.append(h('span', 'yt-dur', dur(v.duration_s)));
    if (v.privacy && v.privacy !== 'public') th.append(h('span', 'yt-priv', v.privacy));
    a.append(th);
    const body = h('div', 'yt-cbody');
    body.append(h('div', 'yt-ctitle', v.title));
    body.append(h('div', 'yt-cmeta', `${plural(v.views, 'view')} • ${ago(v.published_utc)}`));
    if (!small) body.append(h('div', 'yt-cmeta', `👍 ${compact(v.likes)}   💬 ${v.comments === '' ? '—' : compact(v.comments)}`));
    a.append(body);
    return a;
  }

  function grid(root, ch, vids) {
    if (!vids.length) {
      const e = h('div', 'yt-empty');
      e.append(h('div', 'yt-empty-ico', '🎬'));
      e.append(h('h3', '', "This channel doesn't have any content"));
      e.append(h('p', 'ac-note', 'Our first upload appears here within 6 hours of going live (next tracker run).'));
      root.append(e); return;
    }
    const g = h('div', 'yt-grid');
    vids.forEach((v) => g.append(card(v, laneCls(ch.channel))));
    root.append(g);
  }

  function comment(c, threads, small) {
    const row = h('div', 'yt-com' + (small ? ' reply' : ''));
    row.id = 'c-' + c.comment_id;
    row.append(img(c.author_avatar, small ? 'yt-cav sm' : 'yt-cav', (c.author || '?').replace('@', '')[0]));
    const b = h('div', 'yt-cb');
    const who = h('div', 'yt-who');
    const name = h('span', c.is_owner === '1' ? 'yt-owner' : 'yt-author', c.author);
    who.append(name, h('span', 'yt-when', ago(c.published_utc) + (c.edited === '1' ? ' (edited)' : '')));
    b.append(who);
    b.append(h('div', 'yt-text', unflat(c.text)));
    const act = h('div', 'yt-act', '👍 ' + (n(c.likes) ? compact(c.likes) : ''));
    b.append(act);
    const reps = threads.filter((r) => r.parent_id === c.comment_id);
    if (!small && reps.length) {
      const t = h('button', 'yt-replies', `${S.open[c.comment_id] ? '▴' : '▾'} ${reps.length} repl${reps.length === 1 ? 'y' : 'ies'}`);
      t.onclick = () => { S.open[c.comment_id] = !S.open[c.comment_id]; redraw(); };
      b.append(t);
      if (S.open[c.comment_id]) reps.forEach((r) => b.append(comment(r, threads, true)));
    }
    row.append(b);
    return row;
  }

  function commentList(root, rows, withVideo, vmap) {
    const tops = rows.filter((c) => !c.parent_id).sort((a, b) => b.published_utc.localeCompare(a.published_utc));
    if (!tops.length) { root.append(h('p', 'ac-note', 'No comments yet.')); return; }
    tops.forEach((c) => {
      if (withVideo && vmap[c.video_id]) {
        const l = h('button', 'yt-onvid', 'on: ' + vmap[c.video_id].title);
        l.onclick = () => { S.vid = c.video_id; S.open = {[c.comment_id]: true}; redraw(); };
        root.append(l);
      }
      root.append(comment(c, rows));
    });
  }

  function watch(root, ch, vids, coms, hist) {
    const v = vids.find((x) => x.video_id === S.vid);
    if (!v) { S.vid = ''; return grid(root, ch, vids); }
    const lc = laneCls(ch.channel);
    const back = h('button', 'yt-back', '← All videos'); back.onclick = () => { S.vid = ''; redraw(); };
    root.append(back);
    const wrap = h('div', 'yt-watch');
    const main = h('div', 'yt-main');
    const player = img(v.thumb, 'yt-player', '▶', lc);
    const ov = h('div', 'yt-ov');
    ov.append(h('span', '', 'Mirror only — nothing plays here, so no view is counted'));
    const st = h('a', '', '✎ Open this video in YouTube Studio');
    st.href = `https://studio.youtube.com/video/${v.video_id}/edit`; st.target = '_blank'; st.rel = 'noopener';
    ov.append(st);
    player.append(ov);
    if (v.duration_s) player.append(h('span', 'yt-dur', dur(v.duration_s)));
    main.append(player);
    main.append(h('h2', 'yt-wtitle', v.title));
    const own = h('div', 'yt-ownrow');
    own.append(img(ch.avatar, 'yt-cav', (ch.title || '?')[0], lc));
    const oi = h('div', '');
    oi.append(h('b', '', ch.title), h('div', 'yt-cmeta', ch.subs === '' ? '' : plural(ch.subs, 'subscriber')));
    own.append(oi);
    const pills = h('div', 'yt-pills');
    pills.append(h('span', 'yt-pill', '👍 ' + compact(v.likes)), h('span', 'yt-pill', '💬 ' + (v.comments === '' ? '—' : compact(v.comments))));
    if (v.privacy && v.privacy !== 'public') pills.append(h('span', 'yt-pill warn', v.privacy));
    own.append(pills);
    main.append(own);
    const box = h('div', 'yt-dbox');
    box.append(h('b', '', `${(+v.views).toLocaleString('en-US')} views  ${longDate(v.published_utc)}`));
    box.append(h('div', 'yt-text', unflat(v.description) || '(no description)'));
    if (v.tags) box.append(h('div', 'yt-tags', '🏷 ' + v.tags));
    main.append(box);
    const vc = coms.filter((c) => c.video_id === v.video_id);
    main.append(h('h3', 'yt-chead', plural(v.comments === '' ? vc.filter((c) => !c.parent_id).length : v.comments, 'Comment')));
    commentList(main, vc, false);
    wrap.append(main);
    const side = h('div', 'yt-side');
    const pts = (hist || []).filter((r) => r.video_id === v.video_id).map((r) => +r.views);
    if (pts.length > 1) {
      const sc = h('div', 'yt-spark');
      sc.append(h('div', 'yt-cmeta', `Views at each 6-hour reading (${pts.length})`));
      const sp = h('div', 'ac-spark'); sc.append(sp); side.append(sc);
      requestAnimationFrame(() => AC.spark(sp, pts, AC.color(ch.channel)));
    }
    side.append(h('div', 'yt-cmeta', 'Up next'));
    vids.filter((x) => x.video_id !== v.video_id).forEach((x) => side.append(card(x, lc, true)));
    wrap.append(side);
    root.append(wrap);
  }

  dash.onData(() => {           // hide the empty analytics charts until YouTube Analytics has data
    const o = dash.data('own_daily');
    document.querySelectorAll('#own-analytics').forEach((el) => { el.style.display = o.status === 'ok' && o.data.length > 0 ? '' : 'none'; });
  });

  dash.draw('yt-mirror', (root) => {
    root.replaceChildren();
    const d = data();
    if (!d.ch) { root.append(h('p', 'ac-note', d.loading ? 'Loading…' : 'Mirror data not loaded yet.')); return; }
    if (!S.ch || !d.ch.some((c) => c.channel === S.ch)) S.ch = d.ch[0].channel;
    const sw = h('div', 'yt-switch');
    d.ch.forEach((c) => {
      const b = h('button', 'ac-chip ' + laneCls(c.channel), AC.icon(c.channel) + ' ' + c.title);
      b.setAttribute('aria-pressed', String(S.ch === c.channel));
      b.onclick = () => { S.ch = c.channel; S.vid = ''; S.tab = 'videos'; S.more = false; redraw(); };
      sw.append(b);
    });
    root.append(sw);
    const ch = d.ch.find((c) => c.channel === S.ch);
    const page = h('div', 'yt-page');
    root.append(page);
    if (!ch.channel_id || !ch.fetched_utc) {
      const e = h('div', 'yt-empty');
      e.append(h('div', 'yt-empty-ico', ch.channel_id ? '⏳' : '🌱'));
      e.append(h('h3', '', ch.title + (ch.channel_id ? ' — waiting for the first mirror run' : ' — channel not created yet')));
      e.append(h('p', 'ac-note', ch.channel_id ? 'The tracker job copies the channel here every 6 hours once it runs.' : 'Create the channel and add its id to config/channels.json.'));
      page.append(e); return;
    }
    const vids = (d.v || []).filter((v) => v.channel === S.ch).sort((a, b) => b.published_utc.localeCompare(a.published_utc));
    const coms = (d.c || []).filter((c) => c.channel === S.ch);
    header(page, ch, vids);
    tabs(page, coms.length);
    const body = h('div', 'yt-body'); page.append(body);
    if (S.vid) watch(body, ch, vids, coms, (d.hist || []).filter((r) => r.channel === S.ch));
    else if (S.tab === 'comments') {
      const vmap = Object.fromEntries(vids.map((v) => [v.video_id, v]));
      commentList(body, coms, true, vmap);
    } else grid(body, ch, vids);
  });
})();
