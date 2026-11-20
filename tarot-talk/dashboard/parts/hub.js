/* ---------- icons, sheets, small parts ---------- */
const ICON = {
  film: '<path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 8l1.5-4 3 .8L7.5 8m4 0 1-3.6 3 .8L14.5 8m4 0 .8-2.8"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  people: '<circle cx="9" cy="9" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 5.8a3.300 3.300 0 0 1 0 6.400M18.500 14.900c1.700.8 2.700 2.400 3 5.100"/>',
  bolt: '<path d="M13 2 5 13.500h6L10 22l8-11.500h-6z"/>',
  pen: '<path d="m4 20 1-5L16.500 3.500l4 4L9 19zM14 6l4 4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 21V5M8.500 7.500h7"/>',
  home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'
};
const icon = (k, size) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", size || 22); s.setAttribute("height", size || 22); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.8"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true"); s.innerHTML = ICON[k] || ICON.bolt; return s; };
function sheet(label, ...kids) {
  const opener = document.activeElement;
  const close = () => { $("#sheetroot").replaceChildren(); removeEventListener("keydown", esc); if (opener && opener.isConnected) opener.focus(); };
  const esc = e => { if (e.key === "Escape") close(); };
  const closeBtn = h("button", { class: "close", onclick: close }, "Close");
  $("#sheetroot").replaceChildren(h("div", { class: "scrim", onclick: e => { if (e.target.classList.contains("scrim")) close(); } }, h("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": label }, closeBtn, h("div", { class: "bar" }), ...kids.flat().filter(Boolean))));
  addEventListener("keydown", esc); closeBtn.focus(); return close;
}
const chipsRow = (items, cls) => h("div", { class: "tags" }, items.map(t => h("span", { class: "tag2 " + (cls || "") }, t)));
const seg = (opts, cur, on) => h("div", { class: "seg", role: "tablist" }, opts.map(([k, t, n]) => h("button", { type: "button", role: "tab", "data-k": k, "aria-selected": String(k === cur), onclick: () => on(k) }, t, n != null ? h("span", { class: "cnt" }, String(n)) : null)));
const STAT = { applied: ["Applied", "good"], trial: ["In trial", "acc"], review: ["Under review", "warn"], parked: ["Parked", "wait"], rejected: ["Rejected", "bad"] };
const SCOL = { applied: "var(--good)", trial: "var(--g1)", review: "var(--g2)", parked: "var(--wait)", rejected: "var(--bad)" };
const AREA = { content: "Content", process: "Process", production: "Production" };

/* ---------- research ---------- */
let db = null;
const allProfiles = () => Object.entries(D.pages);
function profileCard([hd, p], i) {
  const hits = p.reels.filter(r => !r.pinned && r.multiple >= 3).length, top = p.reels.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3), total = p.reels.length;
  return h("a", { class: "pcard card", href: "#p-" + hd, style: "--i:" + i },
    h("div", { class: "phead" }, h("div", { class: "ring sm", "aria-hidden": "true" }, h("b", {}, hd.slice(0, 2).toUpperCase())), h("div", {}, h("div", { class: "ph" }, "@" + hd), h("div", { class: "sub" }, p.profile.followers + " followers · " + p.profile.niche))),
    h("div", { class: "pstats" }, h("div", {}, h("b", { class: "num gt" }, fmt(p.median)), h("span", {}, "typical reel")), h("div", {}, h("b", { class: "num gt" }, String(hits)), h("span", {}, "recent hits")), h("div", {}, h("b", { class: "num gt" }, total), h("span", {}, "reels listed"))),
    h("div", { class: "fan" }, top.map((r, k) => h("div", { class: "fcard", style: "--c:" + hue(r.concept) + ";--k:" + k }, h("span", {}, r.cover || "cover not read"), h("b", { class: "num" }, fmt(r.views))))),
    h("div", { class: "qrow" }, h("span", { class: "sub" }, "Looked at " + p.profile.scouted_on), h("span", { class: "openl" }, "Open profile")));
}
function potentials() { const out = []; for (const [hd, p] of allProfiles()) for (const s of p.findings.shapes) out.push({ ...s, handle: hd }); return out; }
function diagram(k) {
  if (k === "funnel") return h("div", { class: "dg funnel" }, ["Stop", "Follow", "Choose"].map((t, i) => h("i", { style: "--w:" + (100 - i * 24) + "%;--k:" + i }, t)));
  if (k === "hvfo") return h("div", { class: "dg hvfo" }, [["H", "ok"], ["V", "ok"], ["F", "chg"], ["O", "ok"]].map(([l, c]) => h("i", { class: c }, l)));
  if (k === "signals") return h("div", { class: "dg bars" }, [["Watch", 100], ["Likes", 70], ["Sends", 86]].map(([t, v]) => h("i", { style: "--v:" + v + "%" }, h("span", {}, t))));
  return h("div", { class: "dg clap" }, icon("film", 54));
}
function processCard(p, i) {
  return h("button", { class: "poster proc", style: "--k:" + i, onclick: () => sheet(p.title, h("h3", {}, p.title), h("div", { class: "sub" }, p.kind), pill(p.verdict, p.tone), p.kept.length ? h("div", {}, h("div", { class: "lab2 good" }, "Kept"), chipsRow(p.kept, "good")) : null, p.changed.length ? h("div", {}, h("div", { class: "lab2 warn" }, "Changed for us"), chipsRow(p.changed, "warn")) : null, p.rejected.length ? h("div", {}, h("div", { class: "lab2 bad" }, "Rejected"), chipsRow(p.rejected, "bad")) : null, h("div", { class: "sub" }, p.note)) },
    diagram(p.diagram), h("div", { class: "pt" }, p.title), h("div", { class: "sub" }, p.kind),
    h("div", { class: "counts" }, h("span", { class: "c good" }, p.kept.length + " kept"), p.changed.length ? h("span", { class: "c warn" }, p.changed.length + " changed") : null, p.rejected.length ? h("span", { class: "c bad" }, p.rejected.length + " rejected") : null), pill(p.verdict, p.tone));
}
function parseLink(v) {
  v = v.trim(); let m;
  if ((m = v.match(/instagram\.com\/(?:[^/]+\/)?(reel|reels|p)\/([A-Za-z0-9_-]+)/))) return { kind: m[1] === "p" ? "post" : "reel", target: m[2], url: "https://www.instagram.com/" + (m[1] === "p" ? "p" : "reel") + "/" + m[2] + "/" };
  if ((m = v.match(/instagram\.com\/([A-Za-z0-9_.]+)\/?(?:\?|$)/))) return { kind: "page", target: m[1], url: "https://www.instagram.com/" + m[1] + "/" };
  if ((m = v.match(/^@?([A-Za-z0-9_.]{2,30})$/))) return { kind: "page", target: m[1], url: "https://www.instagram.com/" + m[1] + "/" };
  return v ? { kind: "topic", target: v, url: null } : null;
}
const KIND = { page: "Page", reel: "Reel", post: "Post", topic: "Topic", competitor: "Competitor", similar: "More like", verify: "Verify" };
const QSTATE = { queued: ["queued", "wait"], working: ["desktop working", "acc"], "ready-for-agent": ["ready for agent", "warn"], "needs-agent": ["needs agent", "warn"], refused: ["refused by Instagram", "bad"], failed: ["failed", "bad"], done: ["done", "good"], scouted: ["scouted", "good"] };
function queue() { return [...(D.queue || []).slice().reverse(), ...D.requests]; }
const waitingDesk = () => queue().filter(r => r.state === "queued" || r.state === "working").length, waitingAgent = () => queue().filter(r => r.state === "ready-for-agent" || r.state === "needs-agent").length;
function inbox() {
  const msg = h("div", { class: "msg", id: "reqmsg", role: "status" });
  const form = h("form", { class: "req", onsubmit: async e => {
      e.preventDefault(); const p = parseLink($("#target").value);
      if (!p) { msg.textContent = "Paste a reel link, a page link, an @handle or a topic first."; return; }
      const profile = (p.kind === "reel" || p.kind === "post") && $("#alsoprofile").checked, by = $("#by").value, note = $("#note").value.trim();
      const body = ["link: " + (p.url || p.target), "purpose: " + state.purpose, "profile: " + (profile ? "yes" : "no"), "by: " + by, note ? "note: " + note : ""].filter(Boolean).join("\n");
      const url = "https://github.com/" + D.repo + "/issues/new?title=" + encodeURIComponent("scout: " + (p.url || p.target)) + "&body=" + encodeURIComponent(body);
      if (p.kind === "topic") { msg.textContent = "Topic search is not built yet. Paste a reel or page link."; return; }
      if (LOCAL) { const r = await api("add", { text: p.url || p.target, purpose: state.purpose, by, note, profile }); msg.textContent = r.msg + (r.ok ? " Watch it on the Desk tab." : ""); if (r.ok) $("#target").value = ""; return; }
      $("#gobox").hidden = false; $("#golink").href = url; msg.textContent = "One more tap: the button below opens GitHub with the request filled in. Press \"Submit new issue\" there. It is picked up within a few minutes if the PC is on with the Tarot Talk Desk app open, and only when sent from a GitHub account on the app's allowed list.";
    } },
    h("label", { for: "target" }, "Reel link, page link, @handle or topic", h("input", { id: "target", placeholder: "https://www.instagram.com/reel/...", autocomplete: "off", inputmode: "url" })),
    h("div", {}, h("div", { class: "flabel" }, "What is it for?"), seg([["content", "Content: what they post"], ["process", "Process: how to do it"]], state.purpose, k => { state.purpose = k; const v = $("#target").value, n = $("#note").value; render(); $("#target").value = v; $("#note").value = n; })),
    h("label", { class: "check", for: "alsoprofile" }, h("input", { id: "alsoprofile", type: "checkbox", checked: state.purpose === "content" }), h("span", {}, "If it is a reel, scout its whole profile too")),
    h("div", { class: "two" }, h("label", { for: "by" }, "Sent by", h("select", { id: "by" }, h("option", {}, "Ashish"), h("option", {}, "Sakshi"))), h("label", { for: "note" }, "What you want to know (optional)", h("input", { id: "note", placeholder: "why did this one work?", autocomplete: "off" }))),
    h("button", { class: "go", type: "submit" }, "Prepare the request"), msg,
    h("div", { id: "gobox", hidden: true }, h("a", { id: "golink", class: "go", href: "#", target: "_blank", rel: "noopener", style: "display:inline-block;text-decoration:none" }, "Open GitHub to submit")));
  return [h("div", { class: "path", style: "margin:10px 0 4px" }, ["You paste a link", "Desktop app reads it", "Agent studies it", "Shown here"].map((t, i) => h("span", { style: "--k:" + i }, t))),
    h("p", { class: "sub" }, "The queue lives on GitHub. For a reel, the desktop app fetches the sound, transcript and numbers by itself. A whole-page look still needs the agent's browser. The agent starts when you ask a Claude session to work the queue; nothing triggers it by itself yet."), card("", form),
    h("div", { class: "stack", style: "margin-top:12px" }, queue().map(r => card("", h("div", { class: "qrow" }, h("div", { style: "min-width:0" }, h("h3", { style: "overflow-wrap:anywhere" }, (r.kind === "page" || r.kind === "competitor" ? "@" : (KIND[r.kind] || r.kind) + ": ") + r.target), h("div", { class: "sub" }, (KIND[r.kind] || r.kind) + (r.scoutProfile ? " + its profile" : "") + (r.purpose ? " · " + r.purpose : "") + (r.by ? " · from " + r.by : "") + " · " + r.asked), r.result ? h("div", { style: "font-size:14px;margin-top:4px" }, r.result) : null, r.transcript ? reading(r.transcript + (r.transcript.length >= 700 ? " ..." : ""), "Transcript, as heard by the desktop app") : null, r.kind === "reel" || r.kind === "post" ? player(r.target, r.kind) : null, r.url ? h("a", { class: "out", href: r.url, target: "_blank", rel: "noopener", style: "font-size:13px" }, "Open on Instagram") : null), pill((QSTATE[r.state] || [r.state, "wait"])[0], (QSTATE[r.state] || [r.state, "wait"])[1])))))];
}
function shapeSheet(s) { sheet(s.name, h("h3", {}, s.name), h("div", { class: "qrow", style: "justify-content:flex-start" }, pill(s.ok ? "usable" : "do not use", s.ok ? "good" : "bad"), h("a", { class: "pill plain", href: "#p-" + s.handle }, "@" + s.handle)), h("div", { class: "sub" }, "Seen in: " + s.from), h("div", {}, s.structure), reading(s.ours, s.ok ? "Ours could be" : "Why not", true)); }
function vResearch() {
  const pots = potentials(), q = waitingDesk() + waitingAgent();
  const head = seg([["content", "Content", allProfiles().length], ["process", "Process", W.process.length], ["forward", "Forward a link", q || null]], state.rtab, k => { state.rtab = k; render(); });
  if (state.rtab === "process") return [head, h("p", { class: "sub" }, "How to do it: funnels, script technique, ranking, film method. Tap a card for what we kept, changed and rejected."), h("div", { class: "posters" }, W.process.map(processCard))];
  if (state.rtab === "forward") return window.TT_LOCAL ? [head, ...inbox().slice(0, 3)] : [head, ...inbox()];
  return [head,
    h("p", { class: "sub" }, "What other pages post, and what works for them."),
    h("h2", {}, "Profiles scouted"),
    h("div", { class: "pgrid" }, allProfiles().map(profileCard), h("a", { class: "pcard card add", href: "#research", onclick: e => { e.preventDefault(); state.rtab = "forward"; render(); } }, h("b", {}, "+"), h("span", {}, "Forward a page or reel"))),
    h("h2", {}, "Most promising"),
    h("div", { class: "podium" }, W.promising.map(m => h("button", { class: "poster pod", style: "--k:" + m.rank, onclick: () => sheet(m.title, h("h3", {}, m.title), h("a", { class: "pill plain", href: "#p-" + m.from }, "@" + m.from + " · " + m.evidence), h("div", {}, m.why), reading(m.ours, "For Tarot Talk", true), h("div", { class: "sub" }, W.promising_note)) }, h("span", { class: "rank gt" }, "0" + m.rank), h("div", { class: "pt" }, m.title), h("div", { class: "ours" }, m.ours), h("span", { class: "tag2" }, m.evidence)))),
    h("h2", {}, "Potentials"),
    h("div", { class: "tgrid" }, pots.sort((a, b) => b.ok - a.ok).map(s => h("button", { class: "tcard" + (s.ok ? "" : " no"), onclick: () => shapeSheet(s) }, h("b", {}, s.name), h("span", { class: "sub" }, "@" + s.handle), pill(s.ok ? "usable" : "do not use", s.ok ? "good" : "bad"))))
  ];
}

/* ---------- playbook ---------- */
function itemSheet(x) { sheet(x.name, h("h3", {}, x.name), h("div", { class: "qrow", style: "justify-content:flex-start" }, pill(STAT[x.status][0], STAT[x.status][1]), h("span", { class: "tag2" }, x.type === "skill" ? "Skill" : "Strategy"), h("span", { class: "tag2" }, AREA[x.area])), h("div", { style: "font-size:16px" }, x.line), h("div", {}, x.detail), h("div", { class: "sub" }, "Learned from: " + x.source)); }
function vPlaybook() {
  const all = W.playbook, f = all.filter(x => (state.ptype === "all" || x.type === state.ptype) && (state.parea === "all" || x.area === state.parea));
  const order = ["applied", "trial", "review", "parked", "rejected"], n = k => f.filter(x => x.status === k).length;
  return [
    h("p", { class: "sub" }, "Everything learned so far, named, and where each one stands. Tap a card for the detail."),
    seg([["all", "All", all.length], ["skill", "Skills", all.filter(x => x.type === "skill").length], ["strategy", "Strategies", all.filter(x => x.type === "strategy").length]], state.ptype, k => { state.ptype = k; render(); }),
    h("div", { class: "chips", style: "margin-top:10px" }, [["all", "All areas"], ["content", "Content"], ["process", "Process"], ["production", "Production"]].map(([k, t]) => h("button", { class: "chip", "aria-pressed": String(state.parea === k), onclick: () => { state.parea = k; render(); } }, t))),
    h("div", { class: "dist", role: "img", "aria-label": order.map(k => STAT[k][0] + " " + n(k)).join(", ") }, order.filter(n).map(k => h("i", { style: "flex:" + n(k) + ";background:" + SCOL[k] }, h("span", {}, String(n(k)))))),
    h("div", { class: "legend" }, order.map(k => h("span", {}, h("i", { class: "s", style: "background:" + SCOL[k] }), STAT[k][0]))),
    ...order.filter(n).map(k => h("div", { class: "lanewrap", style: "--c:" + SCOL[k] }, h("div", { class: "lhead" }, h("h2", {}, STAT[k][0]), h("span", { class: "cnt" }, String(n(k)))),
      h("div", { class: "lanerow" }, f.filter(x => x.status === k).map((x, i) => h("button", { class: "kcard", style: "--i:" + i, onclick: () => itemSheet(x) }, h("span", { class: "kico" }, icon(x.type === "skill" ? "bolt" : "compass", 18)), h("b", {}, x.name), h("span", { class: "kl" }, x.line), h("span", { class: "tag2" }, AREA[x.area]))))))
  ];
}

/* ---------- home ---------- */
function vHome() {
  const profs = allProfiles(), reels = profs.reduce((a, [, p]) => a + p.reels.length, 0), q = waitingDesk(), qa = waitingAgent(), pb = W.playbook, dk = D.desk, tok = dk ? dk.tools.filter(t => t.ok).length : 0;
  const tile = (lab, val, sub, href) => h("a", { class: "card tile", href: "#" + href, style: "text-decoration:none;color:inherit" }, h("div", { class: "lab" }, lab), h("div", { class: "big num gt" }, String(val)), h("div", { class: "sub" }, sub));
  const acts = [...(state.dbActs || []), ...W.activity];
  return [
    h("h2", { style: "margin-top:16px" }, "What we are working on"),
    h("div", { class: "carousel" }, W.now.map((n, i) => h("button", { class: "poster now t-" + n.tone, style: "--k:" + i, onclick: () => sheet(n.title, h("div", { class: "area" }, n.area), h("h3", {}, n.title), pill(n.stage, n.tone), h("div", {}, n.text), reading(n.next, "Next", true), h("a", { class: "out", href: "#" + n.link }, "Open " + n.area)) },
      h("span", { class: "pico" }, icon(n.icon, 26)), h("div", { class: "area" }, n.area), h("div", { class: "pt" }, n.title), h("div", { class: "ps" }, n.short),
      n.progress ? h("div", { class: "steps", role: "img", "aria-label": n.progress[0] + " of " + n.progress[1] + " gates done" }, Array.from({ length: n.progress[1] }, (_, k) => h("i", { class: k < n.progress[0] ? "d" : k === n.progress[0] ? "n" : "" }))) : null, pill(n.stage, n.tone)))),
    h("h2", {}, "Waiting on you"),
    h("div", { class: "wgrid" }, W.waiting.map((t, i) => h("div", { class: "wcard" }, h("b", { class: "gt" }, String(i + 1)), h("span", {}, t)))),
    h("h2", {}, "At a glance"),
    h("div", { class: "goals" }, [["Pages scouted", D.progress.pages], ["Reels listed", D.progress.reels], ["Reels heard (transcript)", D.progress.heard], ["Borrowed ideas cleared for India", D.progress.reviewed]].map(([t, n]) => { const goal = [10, 100, 1000, 10000].find(g => g > n); return h("a", { class: "goal", href: "#research" }, h("b", {}, String(n)), h("span", {}, t), h("div", { class: "meter" }, h("i", { style: "width:" + Math.max(3, Math.round(100 * n / goal)) + "%;background:var(--grad)" })), h("span", { class: "sub" }, "next mark: " + goal)); })),
    h("div", { class: "tiles" }, tile("Skills applied", pb.filter(x => x.status === "applied").length, pb.filter(x => x.status === "trial").length + " in trial, " + pb.filter(x => x.status === "review").length + " under review", "playbook"), tile("Rejected", pb.filter(x => x.status === "rejected").length, "kept so nobody proposes them again", "playbook"), tile("Scout queue", q + qa, q + qa ? q + " for the desktop, " + qa + " for the agent" : "nothing waiting", "research")),
    ...(window.TT_LOCAL ? [] : [
    h("h2", {}, "Who is doing what"),
    h("div", { class: "posters g3" },
      h("div", { class: "poster", style: "cursor:default" }, h("span", { class: "pico" }, icon("search", 24)), h("div", { class: "pt" }, "Dashboard"), h("div", { class: "ps" }, "Links are pasted here and sent as GitHub issues. This page is rebuilt on GitHub after every change."), pill("live", "good")),
      h("div", { class: "poster", style: "cursor:default" }, h("span", { class: "pico" }, icon("bolt", 24)), h("div", { class: "pt" }, "Desktop app"), h("div", { class: "ps" }, dk ? "Last seen " + dk.seen + ". " + tok + " of " + dk.tools.length + " tools ready. " + (dk.reels_today || 0) + " reels read today." : "Not installed on the PC yet. With its window open it fetches a reel's sound, transcript and numbers with no agent."), pill(dk ? (q ? q + " waiting" : "queue clear") : "not installed", dk ? (tok === dk.tools.length ? "good" : "warn") : "wait")),
      h("div", { class: "poster", style: "cursor:default" }, h("span", { class: "pico" }, icon("compass", 24)), h("div", { class: "pt" }, "Agent"), h("div", { class: "ps" }, D.agent.text), pill(qa ? qa + " waiting for the agent" : D.agent.state, qa ? "warn" : D.agent.tone)))]),
    h("h2", {}, "Recent work"),
    card("", h("ol", { class: "acts" }, acts.slice(0, 8).map(a => h("li", {}, h("span", { class: "num sub" }, a.at), h("span", {}, a.text)))))
  ];
}

/* ---------- strategy ---------- */
function vStrategy() {
  const S = W.strategy, np = allProfiles().length;
  return [
    h("h2", { style: "margin-top:16px" }, "The path"),
    h("div", { class: "path" }, ["Reel", "Comment a keyword", "Auto-DM", "Paid report"].map((t, i) => h("span", { style: "--k:" + i }, t))),
    h("div", { class: "sub", style: "margin-top:8px" }, "Proven once: the New Year 2026 series sold a Rs 555 report, about Rs 1.5 lakh."),
    h("h2", {}, "Every episode: TAROT"),
    card("", h("div", { class: "tbar" }, W.tarot.map(([l, n, t, d, w], i) => h("button", { style: "flex:" + w + ";--k:" + i, "aria-pressed": String(state.tsel === i), "aria-label": n + ", " + t, onclick: () => { state.tsel = i; render(); } }, l))),
      h("div", { class: "tinfo" }, h("b", { class: "gt" }, W.tarot[state.tsel][1]), h("span", { class: "num sub" }, W.tarot[state.tsel][2]), h("div", {}, W.tarot[state.tsel][3])), h("div", { class: "sub" }, "A 45-second reel. Tap a part.")),
    h("h2", {}, "Three gates"),
    h("div", { class: "posters g3" }, Object.entries(W.gates).map(([k, list], i) => h("div", { class: "poster gate", style: "--k:" + i }, h("span", { class: "rank gt" }, k), h("ul", {}, list.map(x => h("li", {}, x)))))),
    h("h2", {}, "How we speak"),
    h("div", { class: "dd" }, h("div", {}, h("div", { class: "lab2 good" }, "We say"), chipsRow(W.speak.do, "good")), h("div", {}, h("div", { class: "lab2 bad" }, "We never say"), chipsRow(W.speak.dont, "bad"))),
    h("h2", {}, "Series plan"),
    h("div", { class: "tgrid" }, S.series.map(s => h("div", { class: "tcard" + (s.state === "active" ? " on" : "") }, h("b", {}, s.name), pill(s.state, s.state === "active" ? "good" : s.state.startsWith("held") ? "acc" : "wait")))),
    h("h2", {}, "Borrowed from abroad: will it work in India?"),
    h("p", { class: "sub" }, S.transfer.note),
    h("div", { class: "stack" }, S.transfer.items.map(t => card("", h("div", { class: "qrow" }, h("div", { style: "min-width:0" }, h("h3", {}, t.name), h("div", { class: "sub" }, "Seen on " + t.from + " · " + t.proof)), pill((STAT[t.status] || [t.status])[0], (STAT[t.status] || [0, "wait"])[1])),
      h("div", { class: "checks" }, t.checks.map(c => h("span", { class: "chk " + (c.done ? "y" : "") }, c.name + ": " + c.result))), h("div", { class: "dbar" }, ask("verify", "India fit of: " + t.name, "Run the India checks"), h("a", { class: "dbtn", target: "_blank", rel: "noopener", href: "https://trends.google.com/trends/explore?geo=IN&q=" + encodeURIComponent(t.trend_term) }, "Open Google Trends India: " + t.trend_term)))))
  ];
}

/* ---------- scripts ---------- */
function vScripts() {
  return [h("p", { class: "sub" }, "Drafts only. Nothing is used until it passes the three gates with a reviewer and you approve it."),
    h("div", { class: "stack" }, W.scripts.map(s => card("", h("div", { class: "qrow" }, h("div", {}, h("span", { class: "area" }, s.kind), h("h3", { style: "font-size:17px;margin-top:4px" }, s.title)), pill(s.state, "warn")), h("div", { class: "beats" }, s.beats.map(([k, v]) => h("div", { class: "beat" }, h("b", {}, k), h("span", {}, v)))))))];
}

/* ---------- production ---------- */
function picks() { return state.picks || []; }
async function togglePick(slug) {
  const cur = picks(), next = cur.includes(slug) ? cur.filter(x => x !== slug) : [...cur, slug];
  state.picks = next; try { localStorage.setItem("tt-style-picks", JSON.stringify(next)); } catch (e) {}
  if (db) { try { await db.doc("choices/styles").set({ picked: next, at: new Date().toISOString() }); } catch (e) {} }
  render();
}
function styleSheet(s) { const on = picks().includes(s.slug); const close = sheet(s.name, h("img", { class: "simg", src: D.images["styles/" + s.slug], alt: s.name + " demo poster", width: s.w, height: s.h }), h("h3", {}, s.name), h("div", { class: "qrow", style: "justify-content:flex-start" }, s.tried ? pill("tried in our style frames", "acc") : null, s.suits ? pill("suggested for Tarot Talk", "good") : null), h("div", {}, s.blurb), s.suits ? reading(s.suits, "Why it may suit us", true) : null, h("button", { class: "go", onclick: () => { close(); togglePick(s.slug); } }, on ? "Remove from shortlist" : "Add to shortlist"), h("a", { class: "out", href: "https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/" + s.slug, target: "_blank", rel: "noopener" }, "See this style in the library")); }
function vProduction() {
  const Pn = W.production, L = D.styles, pk = picks();
  const list = L.items.filter(s => state.sfilter === "all" || (state.sfilter === "suits" && s.suits) || (state.sfilter === "picked" && pk.includes(s.slug)));
  return [
    h("h2", { style: "margin-top:16px" }, Pn.series),
    card("", h("ol", { class: "gates" }, Pn.gates.map(([n, st, t]) => h("li", { class: st }, h("div", { class: "qrow" }, h("b", {}, n), pill(st === "done" ? "done" : st === "now" ? "in progress" : "not started", st === "done" ? "good" : st === "now" ? "warn" : "wait")), h("div", { class: "sub" }, t))))),
    h("h2", {}, "Our style frames"),
    h("div", { class: "gallery" }, Pn.frames.map(([k, name, note]) => h("figure", { class: "card" }, h("img", { src: D.images["frame-" + k], alt: name + " style frame: the 2027 engine and two coaches", loading: "lazy" }), h("figcaption", {}, h("b", {}, name), h("span", { class: "sub" }, note))))),
    h("h2", {}, "Style library"),
    h("p", { class: "sub" }, "Looks we can draw in code. Tap one to read about it and add it to your shortlist; the next style frames are drawn from the shortlist."),
    seg([["suits", "Suggested", L.items.filter(s => s.suits).length], ["all", "All", L.items.length], ["picked", "Shortlist", pk.length]], state.sfilter, k => { state.sfilter = k; render(); }),
    list.length ? h("div", { class: "sgal" }, list.map((s, i) => h("button", { class: "scard" + (pk.includes(s.slug) ? " on" : ""), style: "--i:" + Math.min(i, 20), onclick: () => styleSheet(s) }, h("img", { src: D.images["styles/" + s.slug], alt: "", loading: "lazy", width: s.w, height: s.h }), h("span", {}, s.name), pk.includes(s.slug) ? h("i", { class: "tick" }, "shortlisted") : s.tried ? h("i", { class: "tick tr" }, "tried") : null)))
      : card("", h("span", { class: "sub" }, "Nothing shortlisted yet. Open Suggested or All and add a few.")),
    h("div", { class: "sub", style: "margin-top:8px" }, L.credit + " Also available: p5.brush (watercolour, tested once, flickers in motion) and Remotion (video in React, not tried).")
  ];
}

/* ---------- profile page ---------- */
const PTABS = [["overview", "Overview", vOverview], ["concepts", "Concepts", vConcepts], ["reels", "Reels", vReels], ["shapes", "Usable shapes", vShapes], ["growth", "Growth", vGrowth], ["pipeline", "Pipeline", vPipeline]];
function vProfile() {
  const pr = P.profile, tab = PTABS.find(t => t[0] === state.ptab) || PTABS[0];
  return [
    h("a", { class: "back", href: "#research" }, "Back to Research"),
    h("div", { class: "hero" }, h("div", { class: "ring", "aria-hidden": "true" }, h("b", {}, pr.handle.slice(0, 2).toUpperCase())), h("div", { class: "who" }, h("div", { class: "h" }, "@" + pr.handle), h("div", { class: "facts" }, h("span", {}, h("b", {}, pr.followers), " followers"), h("span", {}, h("b", {}, pr.posts.toLocaleString()), " posts"), h("span", { class: "sub" }, pr.niche)), h("div", { class: "sub", style: "margin-top:4px" }, "Looked at " + pr.scouted_on + " · ", h("a", { class: "out", href: "https://www.instagram.com/" + pr.handle + "/", target: "_blank", rel: "noopener" }, "open on Instagram")))),
    h("div", { class: "dbar" }, ask("similar", "@" + pr.handle), ask("topic", pr.niche, "Search more in this field"), ask("verify", "findings on @" + pr.handle, "Get these findings verified")),
    seg(PTABS.map(([k, t]) => [k, t]), tab[0], k => { state.ptab = k; render(); }),
    h("h2", { style: "margin-top:18px" }, tab[1]),
    ...tab[2]().filter(Boolean)
  ];
}

/* ---------- desk: only inside the desktop app. Every command the computer can do, as buttons. ---------- */
const LOCAL = window.TT_LOCAL || null;
async function api(name, body) {
  try { const r = await fetch("/api/" + name, { method: "POST", headers: { "Content-Type": "application/json", "X-TT-Token": LOCAL.token }, body: JSON.stringify(body || {}) }); if (!r.ok) return { ok: false, msg: "The app was restarted. Reload this window (Ctrl+R) and try again." }; const j = await r.json(); poll(); return j; }
  catch (e) { return { ok: false, msg: "The desktop app is not answering. Start it again from the Desktop shortcut." }; }
}
let deskSig = "";
async function poll() {
  if (!LOCAL) return;
  try { const r = await fetch("/api/state", { headers: { "X-TT-Token": LOCAL.token } }); if (!r.ok) throw new Error("stale"); state.desk = await r.json(); state.deskDown = false; } catch (e) { state.deskDown = true; }
  const sig = JSON.stringify(state.desk || {}) + state.deskDown, a = document.activeElement;
  if (sig !== deskSig && route().tab === "desk" && !(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) { deskSig = sig; const y = scrollY; render(); scrollTo(0, y); }
}
/* Claude sessions: each one writes its own card to sessions.json. The light is a rule of thumb, not a token meter. */
function sessionCards() {
  const S = D.sessions; if (!S) return [];
  const health = n => n >= 2 ? ["Move to a new chat now", "bad", 100] : n === 1 ? ["Finish this piece, then start a new chat", "warn", 66] : ["Fresh", "good", 20];
  const copy = h("button", { type: "button", class: "dbtn", onclick: async e => { try { await navigator.clipboard.writeText(S.handoff); e.currentTarget.textContent = "Copied. Paste it into a new chat"; } catch (x) { e.currentTarget.textContent = "Select the text above and copy it"; } } }, "Copy the start-up message for a new chat");
  return [h("h3", { style: "margin-top:18px" }, "Claude sessions"),
    h("div", { class: "stack" }, S.sessions.map(x => { const [t, cls, pct] = health(x.compactions || 0); return card("", h("div", { class: "qrow" }, h("div", { style: "min-width:0" }, h("h3", {}, x.name), h("div", { class: "sub" }, x.where + " · started " + x.started + " · last wrote here " + x.last_seen), h("div", { style: "font-size:14px;margin-top:4px" }, x.doing),
      h("div", { class: "meter", role: "img", "aria-label": "Session load: " + t }, h("i", { style: "width:" + pct + "%;background:var(--" + cls + ")" })), h("div", { class: "sub" }, "History squeezed " + (x.compactions || 0) + " time(s)"), x.link ? h("a", { class: "out", href: x.link, target: "_blank", rel: "noopener", style: "font-size:13px" }, "Open this chat") : null), pill(t, cls))); })),
    h("p", { class: "sub" }, S.rule), h("pre", { class: "dlog", style: "max-height:none" }, S.handoff), copy];
}
function vDesk() {
  const s = state.desk;
  if (state.deskDown) return [card("", h("h3", {}, "This window lost touch with the app"), h("p", { class: "sub" }, "If the app was restarted, reload this window. If it was closed, start it again from the Tarot Talk Desk shortcut on the Desktop."), h("button", { type: "button", class: "dbtn hot", onclick: () => location.reload() }, "Reload"))];
  if (!s) return [h("p", { class: "sub" }, "Connecting to the desktop app ...")];
  const say = h("div", { class: "msg", role: "status" }, state.deskMsg || "");
  const run = (name, body, wait) => async e => { const b = e.currentTarget; b.disabled = true; if (wait) say.textContent = wait; const r = await api(name, body); state.deskMsg = r.msg; say.textContent = r.msg; b.disabled = false; };
  const btn = (t, fn, cls) => h("button", { type: "button", class: "dbtn " + (cls || ""), onclick: fn }, t);
  const waiting = s.queue.filter(x => x.state === "queued" || x.state === "working").length, forAgent = s.queue.filter(x => x.state === "ready-for-agent" || x.state === "needs-agent").length;
  const light = s.paused ? ["Paused", "wait"] : s.busy ? ["Working", "acc"] : ["Watching the queue", "good"];
  const gh = s.sync_failed ? ["Not in sync", "bad"] : s.last_ok ? ["In sync " + s.last_ok.slice(11), "good"] : ["Not checked yet", "wait"];
  const node = (title, st, line) => h("div", { class: "dnode" }, h("b", {}, title), pill(st[0], st[1]), h("span", {}, line));
  const addBox = h("form", { class: "req", onsubmit: async e => { e.preventDefault(); const r = await api("add", { text: $("#dlink").value, purpose: $("#dpurpose").value }); state.deskMsg = r.msg; say.textContent = r.msg; if (r.ok) $("#dlink").value = ""; } },
    h("label", { for: "dlink" }, "Reel link, page link or @handle", h("input", { id: "dlink", placeholder: "https://www.instagram.com/reel/...", autocomplete: "off", inputmode: "url" })),
    h("div", { class: "two" }, h("label", { for: "dpurpose" }, "What is it for?", h("select", { id: "dpurpose" }, h("option", { value: "content" }, "Content: what they post"), h("option", { value: "process" }, "Process: how to do it"))), h("div", { style: "align-self:end" }, h("button", { class: "go", type: "submit" }, "Add to the queue"))));
  return [
    s.restart ? card("", h("h3", {}, "An update was downloaded"), h("p", { class: "sub" }, "Quit the app below and start it again from the Desktop shortcut to use the new version.")) : null,
    s.rev !== LOCAL.rev ? card("", h("div", { class: "qrow" }, h("div", {}, h("h3", {}, "New results are in"), h("div", { class: "sub" }, "Reload to see them on the other tabs.")), btn("Reload", () => location.reload(), "hot"))) : null,
    s.broken ? card("", h("h3", {}, "The queue file is damaged"), h("p", { class: "sub" }, s.broken)) : null,
    h("div", { class: "dflow" }, node("Web dashboard", gh, s.sync_failed ? (s.sync_note || "The last round did not sync. See the work log.") : "Sakshi's view. Requests sent there arrive here."), h("i", { "aria-hidden": "true" }, "⇄"),
      node("This desktop app", light, waiting + " waiting here · " + s.reels_today + (s.max_reels ? " of " + s.max_reels : "") + " reels read today"), h("i", { "aria-hidden": "true" }, "⇄"),
      node("Claude agent", forAgent ? [forAgent + " waiting", "warn"] : ["Nothing waiting", "wait"], "Starts only when a Claude session is asked. No schedule is set.")),
    h("div", { class: "dbar" }, btn("Check now", run("check"), "hot"), btn(s.paused ? "Resume" : "Pause", run("pause")), btn("Open project folder", run("folder")), s.public ? h("a", { class: "dbtn", href: s.public, target: "_blank", rel: "noopener" }, "Open web dashboard") : null, btn("Quit the app", run("quit"))), say,
    h("p", { class: "sub" }, "The app keeps working in the background after this window is closed, and checks GitHub every " + s.poll_min + " minutes. Quit stops it. " + (s.ident || "")),
    ...sessionCards(),
    h("h3", { style: "margin-top:18px" }, "Add work"), card("", addBox),
    h("div", { class: "tags", style: "margin:10px 0" }, allProfiles().map(([hd]) => btn("Read the top reels of @" + hd, run("hits", { handle: hd })))),
    h("h3", { style: "margin-top:18px" }, "Tools on this computer"),
    h("div", { class: "tiles" }, s.tools.map(t => card("", h("div", { class: "qrow" }, h("h3", {}, t.name), pill(t.ok ? "ready" : "missing", t.ok ? "good" : "bad")), h("div", { class: "sub" }, t.used_for), t.ok ? null : t.fixable ? btn("Install it", run("fix", { key: t.key }, "Installing. This can take a few minutes ..."), "hot") : h("div", { class: "sub", style: "margin-top:6px" }, "Install by hand: ", h("code", {}, t.install))))),
    h("h3", { style: "margin-top:18px" }, "Queue"),
    s.queue.length ? h("div", { class: "stack" }, s.queue.map(x => card("", h("div", { class: "qrow" }, h("div", { style: "min-width:0" }, h("h3", { style: "overflow-wrap:anywhere" }, (x.kind === "page" ? "@" : (KIND[x.kind] || x.kind) + ": ") + x.target), h("div", { class: "sub" }, (x.purpose || "") + " · from " + (x.by || "?") + " · " + (x.updated || x.asked || "")), x.result ? h("div", { style: "font-size:14px;margin-top:4px" }, x.result) : null,
      x.state === "failed" ? btn("Try again", run("retry", { n: x.n })) : x.state === "refused" ? btn("Try again now (skips the 24 hour wait)", run("retry", { n: x.n, force: true })) : null), pill((QSTATE[x.state] || [x.state, "wait"])[0], (QSTATE[x.state] || [x.state, "wait"])[1]))))) : h("p", { class: "sub" }, "Nothing in the queue."),
    h("h3", { style: "margin-top:18px" }, "Work log"), h("pre", { class: "dlog" }, s.logs.length ? s.logs.slice().reverse().join("\n") : "Nothing yet.")
  ];
}
if (LOCAL) { ICON.desk = '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'; setInterval(poll, 3000); poll(); }

/* ---------- shell ---------- */
const TABS = [["home", "Home", vHome, "home"], ["research", "Research", vResearch, "search"], ["playbook", "Playbook", vPlaybook, "book"], ["strategy", "Strategy", vStrategy, "compass"], ["scripts", "Scripts", vScripts, "pen"], ["production", "Production", vProduction, "film"]];
if (LOCAL) TABS.splice(1, 0, ["desk", "Desk", vDesk, "desk"]);
function route() { const k = (location.hash || "").slice(1); if (k.startsWith("p-") && D.pages[k.slice(2)]) return { tab: "research", profile: k.slice(2) }; return { tab: TABS.some(t => t[0] === k) ? k : "home" }; }
function render() {
  const r = route();
  if (r.profile) { handle = r.profile; P = D.pages[handle]; }
  $("#tabs").replaceChildren(...TABS.map(([k, t, , ic]) => h("a", { href: "#" + k, "aria-current": String(k === r.tab) }, icon(ic, 16), t)));
  const t = TABS.find(x => x[0] === r.tab), noHead = ["home", "strategy", "production"].includes(r.tab);
  const kids = r.profile ? vProfile() : [noHead ? null : h("h2", { style: "margin-top:16px" }, t[1]), ...t[2]()];
  $("#main").replaceChildren(h("section", { class: "view" }, ...kids.filter(Boolean)));
}
try { state.picks = JSON.parse(localStorage.getItem("tt-style-picks") || "[]"); } catch (e) { state.picks = []; }
$("#built").textContent = "Updated " + D.built;
addEventListener("hashchange", () => { $("#sheetroot").replaceChildren(); const r = route(); if (!r.profile) state.ptab = "overview"; render(); scrollTo(0, 0); });
render();

/* queue, activity and the style shortlist: live only where the page runs as a Claude artifact with the db capability */
(async () => {
  try {
    if (!window.claude || !window.claude.use) return;
    const d = await window.claude.use("db");
    if (!d) return;
    db = d;
    const rerender = () => { const a = document.activeElement; if (!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) && !$("#sheetroot").firstChild) render(); };
    d.collection("activity").orderBy("at", "desc").limit(10).onSnapshot(snap => { state.dbActs = snap.docs.map(x => x.data()).map(a => ({ at: a.day || a.at, text: a.text })); rerender(); }, () => {});
    d.doc("choices/styles").onSnapshot(s => { if (s.exists && Array.isArray(s.data().picked)) { state.picks = s.data().picked.slice(); rerender(); } }, () => {});
  } catch (e) {}
})();
</script>
</body>
</html>
