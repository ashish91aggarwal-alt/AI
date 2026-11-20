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
const KIND = { page: "Page", reel: "Reel", post: "Post", topic: "Topic", competitor: "Competitor" };
function queue() { const dbr = state.dbReqs || []; return [...dbr, ...D.requests.filter(r => !dbr.some(x => x.target === r.target && x.kind === r.kind))]; }
function inbox() {
  const msg = h("div", { class: "msg", id: "reqmsg", role: "status" });
  const form = h("form", { class: "req", onsubmit: async e => {
      e.preventDefault(); const p = parseLink($("#target").value);
      if (!p) { msg.textContent = "Paste a reel link, a page link, an @handle or a topic first."; return; }
      const r = { ...p, purpose: state.purpose, scoutProfile: (p.kind === "reel" || p.kind === "post") && $("#alsoprofile").checked, by: $("#by").value, note: $("#note").value.trim(), asked: new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 16).replace("T", " ") + " IST", state: "queued" };
      const line = "Scout request from " + r.by + " (" + r.purpose + " research): " + KIND[r.kind].toLowerCase() + " " + (r.url || "\"" + r.target + "\"") + (r.scoutProfile ? " (also scout its profile)" : "") + (r.note ? ". Note: " + r.note : "");
      if (db) { try { await db.collection("requests").add(r); msg.textContent = "Saved. It waits in the queue until an agent session picks it up; its status will show here."; e.target.reset(); return; } catch (err) { msg.textContent = "Could not save it here (" + (err && err.code || "error") + "). Copy the line below and send it to Claude."; } }
      else msg.textContent = "This copy of the page cannot save requests. Copy the line below and send it to Claude.";
      $("#copybox").hidden = false; $("#copytext").value = line;
    } },
    h("label", { for: "target" }, "Reel link, page link, @handle or topic", h("input", { id: "target", placeholder: "https://www.instagram.com/reel/...", autocomplete: "off", inputmode: "url" })),
    h("div", {}, h("div", { class: "flabel" }, "What is it for?"), seg([["content", "Content: what they post"], ["process", "Process: how to do it"]], state.purpose, k => { state.purpose = k; const v = $("#target").value, n = $("#note").value; render(); $("#target").value = v; $("#note").value = n; })),
    h("label", { class: "check", for: "alsoprofile" }, h("input", { id: "alsoprofile", type: "checkbox", checked: state.purpose === "content" }), h("span", {}, "If it is a reel, scout its whole profile too")),
    h("div", { class: "two" }, h("label", { for: "by" }, "Sent by", h("select", { id: "by" }, h("option", {}, "Ashish"), h("option", {}, "Sakshi"))), h("label", { for: "note" }, "What you want to know (optional)", h("input", { id: "note", placeholder: "why did this one work?", autocomplete: "off" }))),
    h("button", { class: "go", type: "submit" }, "Send to the scout queue"), msg,
    h("div", { id: "copybox", hidden: true, class: "stack" }, h("textarea", { id: "copytext", rows: "3", readonly: true, "aria-label": "Request text" }), h("button", { class: "ghost", type: "button", onclick: async () => { try { await navigator.clipboard.writeText($("#copytext").value); msg.textContent = "Copied."; } catch (e) { $("#copytext").select(); msg.textContent = "Select the text and copy it."; } } }, "Copy")));
  return [h("p", { class: "sub" }, "A connected agent picks requests up when a session runs on the PC with the Claude desktop app open, follows the scouting skill, records what it found and updates the status here."), card("", form),
    h("div", { class: "stack", style: "margin-top:12px" }, queue().map(r => card("", h("div", { class: "qrow" }, h("div", { style: "min-width:0" }, h("h3", { style: "overflow-wrap:anywhere" }, (r.kind === "topic" ? "" : r.kind === "page" || r.kind === "competitor" ? "@" : KIND[r.kind] + " ") + r.target), h("div", { class: "sub" }, (KIND[r.kind] || r.kind) + (r.scoutProfile ? " + its profile" : "") + (r.purpose ? " · " + r.purpose : "") + (r.by ? " · from " + r.by : "") + " · " + r.asked), r.result ? h("div", { style: "font-size:14px;margin-top:4px" }, r.result) : null, r.url ? h("a", { class: "out", href: r.url, target: "_blank", rel: "noopener", style: "font-size:13px" }, "Open on Instagram") : null), pill(r.state, { scouted: "good", done: "good", queued: "wait", running: "acc", refused: "bad", "not built": "warn" }[r.state] || "wait")))))];
}
function shapeSheet(s) { sheet(s.name, h("h3", {}, s.name), h("div", { class: "qrow", style: "justify-content:flex-start" }, pill(s.ok ? "usable" : "do not use", s.ok ? "good" : "bad"), h("a", { class: "pill plain", href: "#p-" + s.handle }, "@" + s.handle)), h("div", { class: "sub" }, "Seen in: " + s.from), h("div", {}, s.structure), reading(s.ours, s.ok ? "Ours could be" : "Why not", true)); }
function vResearch() {
  const pots = potentials(), q = queue().filter(r => r.state === "queued").length;
  const head = seg([["content", "Content", allProfiles().length], ["process", "Process", W.process.length], ["forward", "Forward a link", q || null]], state.rtab, k => { state.rtab = k; render(); });
  if (state.rtab === "process") return [head, h("p", { class: "sub" }, "How to do it: funnels, script technique, ranking, film method. Tap a card for what we kept, changed and rejected."), h("div", { class: "posters" }, W.process.map(processCard))];
  if (state.rtab === "forward") return [head, ...inbox()];
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
  const profs = allProfiles(), reels = profs.reduce((a, [, p]) => a + p.reels.length, 0), q = queue().filter(r => r.state === "queued").length, pb = W.playbook;
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
    h("div", { class: "tiles" }, tile("Profiles scouted", profs.length, reels + " reels listed", "research"), tile("Skills applied", pb.filter(x => x.status === "applied").length, pb.filter(x => x.status === "trial").length + " in trial, " + pb.filter(x => x.status === "review").length + " under review", "playbook"), tile("Rejected", pb.filter(x => x.status === "rejected").length, "kept so nobody proposes them again", "playbook"), tile("Scout queue", q, q ? "waiting for an agent session" : "nothing waiting", "research")),
    h("h2", {}, "Agent"),
    card("", h("div", { class: "qrow" }, h("h3", {}, h("span", { class: "led " + (q ? "ready" : "working") }), q ? q + " request" + (q > 1 ? "s" : "") + " waiting" : "Queue is clear"), pill(D.agent.state, D.agent.tone)), h("div", { class: "sub" }, D.agent.text)),
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
    h("h2", {}, "Common strategy"),
    h("p", { class: "sub" }, S.common.note),
    h("div", { class: "tgrid" }, S.common.items.map(c => h("div", { class: "tcard" }, h("span", {}, c.text), h("div", { class: "meter", role: "img", "aria-label": "seen on " + c.seen + " of " + np + " pages" }, Array.from({ length: Math.max(np, 3) }, (_, k) => h("i", { class: k < c.seen ? "d" : "" })), h("span", { class: "sub" }, c.seen + " of " + np + " page" + (np > 1 ? "s" : ""))))))
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
    h("div", { class: "sub", style: "margin-top:8px" }, L.credit + " Also available: p5.brush (watercolour, tested once, flickers in motion) and Remotion (video in React, not tried)."),
    h("h2", {}, "Command-line package"),
    card("", h("div", { class: "qrow" }, h("h3", {}, h("span", { class: "led" }), W.cli.name), pill(D.status.cli ? "checked on the PC" : W.cli.state, D.status.cli ? "acc" : "wait")), h("div", { class: "sub" }, "Transcripts and audio numbers for queued reels. Install once on the PC:"), h("pre", { class: "cmd" }, W.cli.install), h("div", { class: "sub", style: "margin-top:10px" }, "Then, inside your clone of the AI repo:"), h("pre", { class: "cmd" }, W.cli.run), h("div", { class: "sub", style: "margin-top:8px" }, "Fetching reels with a script is against Instagram's terms. It never logs in, stops at the first refusal, and is yours to run or not."))
  ];
}

/* ---------- profile page ---------- */
const PTABS = [["overview", "Overview", vOverview], ["concepts", "Concepts", vConcepts], ["reels", "Reels", vReels], ["shapes", "Usable shapes", vShapes], ["growth", "Growth", vGrowth], ["pipeline", "Pipeline", vPipeline]];
function vProfile() {
  const pr = P.profile, tab = PTABS.find(t => t[0] === state.ptab) || PTABS[0];
  return [
    h("a", { class: "back", href: "#research" }, "Back to Research"),
    h("div", { class: "hero" }, h("div", { class: "ring", "aria-hidden": "true" }, h("b", {}, pr.handle.slice(0, 2).toUpperCase())), h("div", { class: "who" }, h("div", { class: "h" }, "@" + pr.handle), h("div", { class: "facts" }, h("span", {}, h("b", {}, pr.followers), " followers"), h("span", {}, h("b", {}, pr.posts.toLocaleString()), " posts"), h("span", { class: "sub" }, pr.niche)), h("div", { class: "sub", style: "margin-top:4px" }, "Looked at " + pr.scouted_on + " · ", h("a", { class: "out", href: "https://www.instagram.com/" + pr.handle + "/", target: "_blank", rel: "noopener" }, "open on Instagram")))),
    seg(PTABS.map(([k, t]) => [k, t]), tab[0], k => { state.ptab = k; render(); }),
    h("h2", { style: "margin-top:18px" }, tab[1]),
    ...tab[2]().filter(Boolean)
  ];
}

/* ---------- shell ---------- */
const TABS = [["home", "Home", vHome, "home"], ["research", "Research", vResearch, "search"], ["playbook", "Playbook", vPlaybook, "book"], ["strategy", "Strategy", vStrategy, "compass"], ["scripts", "Scripts", vScripts, "pen"], ["production", "Production", vProduction, "film"]];
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
    d.collection("requests").onSnapshot(snap => { state.dbReqs = snap.docs.map(x => ({ id: x.id, ...x.data() })).sort((a, b) => String(b.asked).localeCompare(String(a.asked))); rerender(); }, () => { db = null; });
    d.collection("activity").orderBy("at", "desc").limit(10).onSnapshot(snap => { state.dbActs = snap.docs.map(x => x.data()).map(a => ({ at: a.day || a.at, text: a.text })); rerender(); }, () => {});
    d.doc("choices/styles").onSnapshot(s => { if (s.exists && Array.isArray(s.data().picked)) { state.picks = s.data().picked.slice(); rerender(); } }, () => {});
  } catch (e) {}
})();
</script>
</body>
</html>
