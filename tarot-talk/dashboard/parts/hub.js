/* ---------- icons, sheets, small parts ---------- */
const ICON = {
  film: '<path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 8l1.5-4 3 .8L7.5 8m4 0 1-3.6 3 .8L14.5 8m4 0 .8-2.8"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  people: '<circle cx="9" cy="9" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 5.8a3.300 3.300 0 0 1 0 6.400M18.500 14.900c1.700.8 2.700 2.400 3 5.100"/>',
  bolt: '<path d="M13 2 5 13.500h6L10 22l8-11.500h-6z"/>',
  pen: '<path d="m4 20 1-5L16.500 3.500l4 4L9 19zM14 6l4 4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 21V5M8.500 7.500h7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.800 0 18M12 3c-3 3.2-3 14.800 0 18"/>',
  home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'
};
const icon = (k, size) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", size || 22); s.setAttribute("height", size || 22); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.8"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true"); s.innerHTML = ICON[k] || ICON.bolt; return s; };
function sheet(label, ...kids) {
  const opener = document.activeElement;
  const close = () => { $("#sheetroot").replaceChildren(); removeEventListener("keydown", esc); if (opener && opener.isConnected) opener.focus(); };
  const esc = e => { if (e.key === "Escape") close(); };
  const closeBtn = h("button", { class: "close", onclick: close }, "Close");
  $("#sheetroot").replaceChildren(h("div", { class: "scrim", onclick: e => { if (e.target.classList.contains("scrim")) close(); } }, h("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-label": label }, closeBtn, h("div", { class: "bar" }), ...kids.flat().filter(Boolean))));
  addEventListener("keydown", esc); closeBtn.focus();
  $("#sheetroot .sheet").addEventListener("keydown", e => { if (e.key !== "Tab") return; const f = [...e.currentTarget.querySelectorAll("a[href],button,summary,input,select,textarea,iframe")].filter(x => !x.disabled); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } });
  return close;
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
      const body = ["link: " + (p.url || p.target), "profile: " + (profile ? "yes" : "no"), "by: " + by, note ? "note: " + note : ""].filter(Boolean).join("\n");
      const url = "https://github.com/" + D.repo + "/issues/new?title=" + encodeURIComponent("scout: " + (p.url || p.target)) + "&body=" + encodeURIComponent(body);
      if (p.kind === "topic") { msg.textContent = "Topic search is not built yet. Paste a reel or page link."; return; }
      if (LOCAL) { const r = await api("add", { text: p.url || p.target, by, note, profile }); msg.textContent = r.msg + (r.ok ? " Watch it on the Desk tab." : ""); if (r.ok) $("#target").value = ""; return; }
      $("#gobox").hidden = false; $("#golink").href = url; msg.textContent = "One more tap: the button below opens GitHub with the request filled in. Press \"Submit new issue\" there. It is picked up within a few minutes if the PC is on with the Tarot Talk Desk app open, and only when sent from a GitHub account on the app's allowed list.";
    } },
    h("label", { for: "target" }, "Reel link, page link, @handle or topic", h("input", { id: "target", placeholder: "https://www.instagram.com/reel/...", autocomplete: "off", inputmode: "url" })),
    h("label", { class: "check", for: "alsoprofile" }, h("input", { id: "alsoprofile", type: "checkbox", checked: true }), h("span", {}, "If it is a reel, scout its whole profile too")),
    h("div", { class: "two" }, h("label", { for: "by" }, "Sent by", h("select", { id: "by" }, h("option", {}, "Ashish"), h("option", {}, "Sakshi"))), h("label", { for: "note" }, "What you want to know (optional)", h("input", { id: "note", placeholder: "why did this one work?", autocomplete: "off" }))),
    h("button", { class: "go", type: "submit" }, "Prepare the request"), msg,
    h("div", { id: "gobox", hidden: true }, h("a", { id: "golink", class: "go", href: "#", target: "_blank", rel: "noopener", style: "display:inline-block;text-decoration:none" }, "Open GitHub to submit")));
  return [h("div", { class: "path", style: "margin:10px 0 4px" }, ["You paste a link", "Desktop app reads it", "Agent studies it", "Shown here"].map((t, i) => h("span", { style: "--k:" + i }, t))),
    h("p", { class: "sub" }, "The queue lives on GitHub. For a reel, the desktop app fetches the sound, transcript and numbers by itself. A whole-page look still needs the agent's browser. The agent starts when you ask a Claude session to work the queue; nothing triggers it by itself yet."), card("", form),
    h("div", { class: "stack", style: "margin-top:12px" }, queue().map(r => card("", h("div", { class: "qrow" }, h("div", { style: "min-width:0" }, h("h3", { style: "overflow-wrap:anywhere" }, (r.kind === "page" || r.kind === "competitor" ? "@" : (KIND[r.kind] || r.kind) + ": ") + r.target), h("div", { class: "sub" }, (KIND[r.kind] || r.kind) + (r.scoutProfile ? " + its profile" : "") + (r.purpose && r.purpose !== "auto" ? " · " + r.purpose : "") + (r.by ? " · from " + r.by : "") + " · " + r.asked), r.result ? h("div", { style: "font-size:14px;margin-top:4px" }, r.result) : null, r.transcript ? reading(r.transcript + (r.transcript.length >= 700 ? " ..." : ""), "Transcript, as heard by the desktop app") : null, r.kind === "reel" || r.kind === "post" ? player(r.target, r.kind) : null, r.url ? h("a", { class: "out", href: r.url, target: "_blank", rel: "noopener", style: "font-size:13px" }, "Open on Instagram") : null), pill((QSTATE[r.state] || [r.state, "wait"])[0], (QSTATE[r.state] || [r.state, "wait"])[1])))))];
}
function shapeSheet(s) { sheet(s.name, h("h3", {}, s.name), h("div", { class: "qrow", style: "justify-content:flex-start" }, pill(s.ok ? "usable" : "do not use", s.ok ? "good" : "bad"), h("a", { class: "pill plain", href: "#p-" + s.handle }, "@" + s.handle)), h("div", { class: "sub" }, "Seen in: " + s.from), h("div", {}, s.structure), reading(s.ours, s.ok ? "Ours could be" : "Why not", true)); }
function vResearch() {
  const pots = potentials(), q = waitingDesk() + waitingAgent(), P2 = D.platform, A = D.agents || [];
  const head = seg([["content", "Pages", allProfiles().length], ["agents", "Agents", A.length], ["trends", "Trends"], ["rules", "Instagram rules", P2 ? P2.notes.length : 0], ["process", "Methods", W.process.length], ...(D.abroad ? [["abroad", "Abroad"]] : []), ["forward", "Send a link", q || undefined]], state.rtab, k => { state.rtab = k; render(); });
  if (state.rtab === "abroad" && D.abroad) return [head, ...vAbroad()];
  if (state.rtab === "process") return [head, h("p", { class: "sub" }, "How to do it: funnels, script technique, ranking, film method. Tap a card for what we kept, changed and rejected."), h("div", { class: "posters" }, W.process.map(processCard))];
  if (state.rtab === "forward") return window.TT_LOCAL ? [head, ...inbox().slice(0, 3)] : [head, ...inbox()];
  if (state.rtab === "agents") return [head, h("p", { class: "sub" }, "The helpers that do the research. Tap one to see everything it found."), ...agentsBlock().slice(1),
    ...(D.plan ? [h("h2", {}, "Research plan"), card("", h("div", { class: "qrow" }, h("div", { class: "sub" }, D.plan.note), pill(D.plan.agent, D.plan.agent === "working" ? "acc" : D.plan.agent === "not started" ? "wait" : "good")),
      ...D.plan.doing.map(t => h("div", { class: "planrow now" }, h("b", {}, "Now: " + t.what), h("span", { class: "sub" }, t.why))), ...D.plan.next.map((t, n) => h("div", { class: "planrow" }, h("b", {}, (n + 1) + ". " + t.what), h("span", { class: "sub" }, t.why))),
      D.plan.done.length ? fold("Done (" + D.plan.done.length + ")", D.plan.done.slice(0, 20).map(t => h("div", { class: "planrow" }, h("b", {}, t.what), h("span", { class: "sub" }, t.result || "")))) : null, h("div", { class: "sub", style: "margin-top:8px" }, "Updated " + D.plan.updated))] : [])];
  if (state.rtab === "trends") return [head, h("p", { class: "sub" }, "What India searches for. Raw readings; the ideas made from them are on the Ideas tab."), ...trendsEvidence()];
  if (state.rtab === "rules") return [head, P2 ? h("p", { class: "sub" }, P2.note) : null,
    P2 ? h("div", { class: "stack" }, P2.notes.map(n => card("", h("div", { class: "qrow" }, h("b", {}, n.rule), pill(n.kind === "official" ? "said by Instagram" : "claim, not confirmed", n.kind === "official" ? "good" : "warn")), h("div", { style: "font-size:14.5px;margin-top:6px" }, "For us: " + n.for_us), h("div", { class: "sub", style: "margin-top:4px" }, n.said_by + " · read at " + n.read_at + " · " + n.date)))) : h("p", { class: "sub" }, "Nothing recorded yet.")];
  return [head,
    h("p", { class: "sub" }, "Pages we have looked at. Tap one for its numbers and reels."),
    h("div", { class: "pgrid" }, allProfiles().map(profileCard), h("a", { class: "pcard card add", href: "#research", onclick: e => { e.preventDefault(); state.rtab = "forward"; render(); } }, h("b", {}, "+"), h("span", {}, "Forward a page or reel"))),
    h("h2", {}, "Formats seen on these pages"),
    h("div", { class: "tgrid" }, pots.sort((a, b) => b.ok - a.ok).map(s => h("button", { class: "tcard" + (s.ok ? "" : " no"), onclick: () => shapeSheet(s) }, h("b", {}, s.name), h("span", { class: "sub" }, "@" + s.handle), pill(s.ok ? "usable" : "do not use", s.ok ? "good" : "bad"))))
  ];
}

/* ---------- abroad: which countries and states to aim a new English channel at ---------- */
const TIER = { start: ["Start here", "good", "var(--good)"], same: ["Same reels reach it", "acc", "var(--g1)"], small: ["Small but keen", "acc", "var(--g4)"], later: ["Later, other languages", "wait", "var(--wait)"], avoid: ["Do not target", "bad", "var(--bad)"] };
const TWORD = [["tarot", "Tarot"], ["akashic", "Akashic"], ["healing", "Healing"]];
const abar = (label, v, col, shown) => h("div", { class: "abar" }, h("span", {}, label), h("div", { class: "atrack" }, v == null ? null : h("i", { style: "width:" + v + "%;background:" + (col || "var(--grad)") })), h("b", {}, v == null ? "n/a" : (shown || String(v))));
const srcRows = rows => rows.map(([t, s]) => h("div", { class: "planrow" }, h("span", {}, t), h("span", { class: "sub" }, s)));
function countrySheet(c) {
  const T = TIER[c.tier];
  sheet(c.name, h("div", { class: "area" }, "Abroad"), h("h3", {}, c.name), h("div", { class: "qrow", style: "justify-content:flex-start" }, pill(T[0], T[1]), h("span", { class: "tag2" }, c.people)),
    h("div", { style: "font-size:16px" }, c.line),
    h("div", { class: "flabel" }, "Interest per person (Google, 0 to 100)"), ...TWORD.map(([k, t]) => abar(t, c.trends[k])),
    h("div", { class: "flabel" }, "Cost to advertise, per 1,000 views"), h("div", {}, "$" + c.ad[0] + " to $" + c.ad[1] + " (India: $0.8 to $2.4)"),
    c.facts.length ? h("div", { class: "flabel" }, "What the surveys and reports say") : null, ...srcRows(c.facts),
    c.care ? reading(c.care, "Take care", true) : null);
}

function vAbroadPlan() {
  const P = D.abroad.plan, R = P.review, rev = R.state === "reviewed";
  const ev = (rows, col) => rows.map(([x, s]) => h("div", { class: "evrow", style: "--c:" + col }, h("span", {}, x), h("span", { class: "sub" }, s)));
  const lane = L => h("div", { class: "card lanecard t-" + L.tone }, h("div", { class: "qrow" }, h("h3", { style: "font-size:19px" }, L.name), pill(L.call, L.tone)), h("div", { style: "font-size:15px;margin:4px 0 8px" }, L.line),
    h("div", { class: "flabel" }, "For"), ...ev(L.for, "var(--good)"), h("div", { class: "flabel" }, "Against"), ...ev(L.against, "var(--bad)"));
  const max = g => Math.max(...g.rows.map(r => r[1]), 1);
  return [
    h("div", { class: "card hero2" }, h("div", { class: "qrow" }, h("div", { class: "area" }, "Plan · looked " + P.looked), pill(rev ? "Reviewed once, fixes not re-checked" : "First pass, not yet reviewed", rev ? "acc" : "warn")), h("h3", { style: "font-size:20px;margin:8px 0 6px" }, P.verdict),
      R.verdict ? reading(R.verdict, "Reviewer", true) : null, R.notes.length ? fold("What the reviewer said (" + R.notes.length + ")", R.notes.map(n => h("div", { class: "planrow" }, h("span", {}, n)))) : null),
    h("h2", {}, "Which lane first"), h("div", { class: "two2" }, P.lanes.map(lane)), P.both ? card("", h("div", { class: "flabel", style: "margin-top:0" }, P.both.title), ...ev(P.both.rows, "var(--warn)")) : null, h("div", { class: "card", style: "margin-top:12px" }, h("div", { class: "flabel", style: "margin-top:0" }, "Should the second lane be done at all?"), h("div", { style: "font-size:14.5px" }, P.second)),
    h("h2", {}, P.reach.title), h("div", { class: "card", style: "border-left:4px solid var(--good)" }, h("h3", {}, P.reach.answer)),
    h("div", { class: "stack", style: "margin-top:12px" }, P.reach.why.map(([t, x, s]) => card("", h("b", {}, t), h("div", { style: "font-size:14.5px;margin-top:4px" }, x), h("div", { class: "sub", style: "margin-top:4px" }, s)))),
    h("div", { class: "flabel" }, "What does steer who sees it"), h("div", { class: "tgrid" }, P.reach.levers.map(([t, x]) => h("div", { class: "tcard" }, h("b", {}, t), h("span", { class: "sub" }, x)))), h("p", { class: "sub" }, P.reach.note),
    h("h2", {}, "Where they live"), h("p", { class: "sub" }, P.where.note),
    h("div", { class: "two2" }, P.where.groups.map(g => card("", h("div", { class: "qrow" }, h("b", {}, g.name), g.unit ? h("span", { class: "sub" }, g.unit) : null), g.rows.length ? h("div", { class: "abars wide", style: "margin-top:8px" }, g.rows.map(([n, v]) => abar(n, Math.round(100 * v / max(g)), "var(--grad)", String(v)))) : null, h("div", { style: "font-size:14px;margin-top:8px" }, g.extra), h("div", { class: "sub", style: "margin-top:4px" }, g.source)))),
    h("h2", {}, "The order to start in"), h("div", { class: "stepsv" }, P.steps.map(s => h("div", { class: "stepv" }, h("b", { class: "gt" }, String(s.n)), h("div", {}, h("h3", {}, s.what), h("div", { style: "font-size:14.5px" }, s.how), h("div", { class: "gate" }, h("span", {}, "Go on when"), s.gate))))),
    h("h2", {}, "Not checked yet"), card("", ...P.open.map((x, i) => h("div", { class: "planrow" }, h("span", {}, (i + 1) + ". " + x)))),
    fold("Sources for the plan (" + P.sources.length + ")", P.sources.map(([x, u]) => h("div", { class: "planrow" }, h("a", { class: "out", href: u, target: "_blank", rel: "noopener" }, x))))
  ];
}
function vAbroad() {
  const A = D.abroad, S = A.states, R = A.review, rev = R.state === "reviewed";
  const cc = c => { const T = TIER[c.tier]; return h("button", { class: "ccard t-" + c.tier, style: "--c:" + T[2], onclick: () => countrySheet(c) }, h("span", { class: "cflag" }, c.code), h("b", {}, c.name), h("span", { class: "sub" }, c.people), pill(T[0], T[1]), h("span", { class: "kl" }, c.line),
    c.tier === "later" ? null : h("div", { class: "abars" }, ...TWORD.map(([k, t]) => abar(t, c.trends[k], T[2]))), h("span", { class: "sub" }, "Cost to advertise $" + c.ad[0] + " to $" + c.ad[1])); };
  const sbars = (rows, col) => h("div", { class: "abars wide" }, rows.map(([n, v]) => abar(n, v, col)));
  const sub = A.plan ? seg([["plan", "Plan"], ["market", "Countries and states"]], state.atab || "plan", k => { state.atab = k; render(); }) : null;
  if (A.plan && (state.atab || "plan") === "plan") return [sub, ...vAbroadPlan()];
  return [sub,
    h("div", { class: "card hero2" }, h("div", { class: "qrow" }, h("div", { class: "area" }, "Looked " + A.looked), pill(rev ? "Reviewed once, fixes not re-checked" : "First pass, not yet reviewed", rev ? "acc" : "warn")), h("h3", { style: "font-size:20px;margin:8px 0 6px" }, A.verdict), h("div", { class: "sub" }, A.how), R.verdict ? reading(R.verdict, "Reviewer, " + R.at, true) : null,
      R.notes.length ? fold("What the reviewer said (" + R.notes.length + ")", R.notes.map(n => h("div", { class: "planrow" }, h("span", {}, n)))) : null),
    h("h2", {}, "Countries"), h("p", { class: "sub" }, "Bars: interest per person in tarot, Akashic and healing. Tap a card for the surveys behind it."),
    h("div", { class: "cgrid" }, A.countries.map(cc)), h("p", { class: "sub" }, A.ad_note),
    A.volume ? card("", h("div", { class: "flabel", style: "margin-top:0" }, "How big each word is"), h("div", { class: "two2", style: "margin:6px 0" }, A.volume.cols.map((cn, ci) => h("div", {}, h("div", { class: "sub" }, cn), sbars(A.volume.rows.map(r => [r[0], r[ci + 1]]))))), h("div", { class: "sub" }, A.volume.note)) : null,
    h("h2", {}, "Who is serious about it (US)"), h("p", { class: "sub" }, A.who_pays.note),
    h("div", { class: "tiles" }, A.who_pays.tiles.map(([n, t]) => card("tile", h("div", { class: "big num gt" }, n), h("div", { class: "sub" }, t)))),
    h("div", { class: "card", style: "margin-top:12px" }, h("div", { class: "flabel", style: "margin-top:0" }, "Groups that lean in most"), ...srcRows(A.who_pays.groups.map(([g, t]) => [g, t])), h("div", { class: "sub", style: "margin-top:8px" }, A.who_pays.source)),
    h("h2", {}, "US states"), h("p", { class: "sub" }, S.note),
    h("div", { class: "tgrid" }, S.clusters.map(([t, st, why]) => h("div", { class: "tcard" }, h("b", {}, t), h("span", {}, st), h("span", { class: "sub" }, why)))),
    h("div", { class: "two2" }, card("", h("div", { class: "flabel", style: "margin-top:0" }, "Tarot reading: interest per person"), sbars(S.tarot), h("div", { class: "flabel" }, "Big states, further down the list"), sbars(S.tarot_big), fold("Least interested", [sbars(S.tarot_low, "var(--wait)")])),
      card("", h("div", { class: "flabel", style: "margin-top:0" }, "Akashic records: interest per person"), S.akashic_warn ? pill(S.akashic_warn, "warn") : null, sbars(S.akashic, "var(--g4)"), h("div", { class: "flabel" }, "Big states, further down the list"), sbars(S.akashic_big, "var(--g4)"))),
    card("", h("div", { class: "flabel", style: "margin-top:0" }, S.big.title), chipsRow(S.big.items), h("div", { class: "sub", style: "margin-top:6px" }, S.big.source), h("div", { class: "flabel" }, "Other studies that agree"), ...srcRows(S.agree), reading(S.glitch, "Left out: Wyoming", true)),
    h("h2", {}, "What a reading costs abroad"), h("p", { class: "sub" }, A.price.note),
    card("", ...A.price.rows.map(([w, p, n]) => h("div", { class: "qrow", style: "padding:9px 0;border-top:1px solid var(--line)" }, h("div", {}, h("div", {}, w), h("div", { class: "sub" }, n)), h("b", { class: "gt", style: "font-size:18px" }, p)))),
    h("h2", {}, "Their evening, in India time"), h("p", { class: "sub" }, A.clock.note),
    h("div", { class: "upcoming" }, A.clock.rows.map(([w, t]) => h("div", { class: "upc" }, h("b", {}, t), h("span", {}, w)))),
    h("h2", {}, A.choice.title),
    h("div", { class: "two2" }, [A.choice.a, A.choice.b].map(([t, x], i) => card("", h("div", { class: "area" }, "Option " + "AB"[i]), h("h3", {}, t), h("div", { style: "font-size:14.5px" }, x)))), h("p", { class: "sub" }, A.choice.note),
    h("h2", {}, "Take care"),
    h("div", { class: "tgrid" }, A.care.map(([t, x, tone]) => h("div", { class: "tcard", style: "border-left:4px solid var(--" + tone + ")" }, h("b", {}, t), h("span", { class: "sub" }, x)))),
    h("h2", {}, "Not checked yet"), card("", ...A.open.map((t, i) => h("div", { class: "planrow" }, h("span", {}, (i + 1) + ". " + t)))),
    fold("Sources (" + A.sources.length + ")", A.sources.map(([t, u]) => h("div", { class: "planrow" }, h("a", { class: "out", href: u, target: "_blank", rel: "noopener" }, t))))
  ];
}

/* ---------- playbook ---------- */
function itemSheet(x) { sheet(x.name, h("h3", {}, x.name), h("div", { class: "qrow", style: "justify-content:flex-start" }, pill(STAT[x.status][0], STAT[x.status][1]), h("span", { class: "tag2" }, x.type === "skill" ? "Skill" : "Strategy"), h("span", { class: "tag2" }, AREA[x.area])), h("div", { style: "font-size:16px" }, x.line), h("div", {}, x.detail), h("div", { class: "sub" }, "Learned from: " + x.source)); }
function vPlaybook() {
  const all = W.playbook, f = all.filter(x => (state.ptype === "all" || x.type === state.ptype) && (state.parea === "all" || x.area === state.parea));
  const order = ["applied", "trial", "review", "parked", "rejected"], n = k => f.filter(x => x.status === k).length;
  return [
    h("p", { class: "sub" }, "Working skills learned so far, and where each one stands. Strategies have their own tab."),
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
  const C = (D.calendar || []).slice(0, 3), picks = D.ideas.ideas.concat((D.agents || []).flatMap(a => a.ideas || [])).filter(x => x.pick && x.status !== "dropped").sort((a, b) => a.pick - b.pick).slice(0, 3);
  return [
    h("h2", { style: "margin-top:16px" }, "Post next"),
    h("div", { class: "sgrid" }, picks.map((x, i) => h("a", { class: "scard", href: "#ideas", style: "text-decoration:none;--i:" + i }, h("span", { class: "sbody", style: "grid-column:1/-1" }, h("b", {}, x.title), h("span", { class: "kl" }, "\u201C" + x.hook + "\u201D"), x.post_by ? h("span", { class: "sub" }, "Post by: " + x.post_by) : null)))),
    h("h2", {}, "Dates coming up"),
    h("a", { class: "upcoming", href: "#calendar", style: "text-decoration:none;color:inherit" }, C.map(c => h("div", { class: "upc" }, h("b", {}, c.in_days === 0 ? "today" : c.in_days === 1 ? "tomorrow" : "in " + c.in_days + " days"), h("span", {}, c.what), h("span", { class: "sub" }, c.date)))),
    h("h2", {}, "Waiting on you"),
    h("div", { class: "wgrid" }, W.waiting.map((t, i) => h("div", { class: "wcard" }, h("b", { class: "gt" }, String(i + 1)), h("span", {}, t)))),
    fold("Projects in hand", [
    h("div", { class: "carousel" }, W.now.map((n, i) => h("button", { class: "poster now t-" + n.tone, style: "--k:" + i, onclick: () => sheet(n.title, h("div", { class: "area" }, n.area), h("h3", {}, n.title), pill(n.stage, n.tone), h("div", {}, n.text), reading(n.next, "Next", true), h("a", { class: "out", href: "#" + n.link }, "Open " + n.area)) },
      h("span", { class: "pico" }, icon(n.icon, 26)), h("div", { class: "area" }, n.area), h("div", { class: "pt" }, n.title), h("div", { class: "ps" }, n.short),
      n.progress ? h("div", { class: "steps", role: "img", "aria-label": n.progress[0] + " of " + n.progress[1] + " gates done" }, Array.from({ length: n.progress[1] }, (_, k) => h("i", { class: k < n.progress[0] ? "d" : k === n.progress[0] ? "n" : "" }))) : null, pill(n.stage, n.tone))))]),
    fold("Numbers so far", [
    h("div", { class: "goals" }, [["Pages scouted", D.progress.pages, 0, "research"], ["Reels listed", D.progress.reels, 0, "research"], ["Reels heard (transcript)", D.progress.heard, 0, "research"], ["Strategies ready, testing or adopted", D.progress.reviewed, D.progress.ideas, "strategy"]].map(([t, n, of, to]) => { const goal = of || [10, 100, 1000, 10000, 100000].find(g => g > n) || n; return h("a", { class: "goal", href: "#" + to }, h("b", {}, String(n)), h("span", {}, t), h("div", { class: "meter" }, h("i", { style: "width:" + Math.max(3, Math.round(100 * n / goal)) + "%;background:var(--grad)" })), h("span", { class: "sub" }, of ? "of " + of + " in the funnel" : "next mark: " + goal)); })),
    h("a", { class: "ministrip", href: "#strategy", "aria-label": "Strategies by stage" }, D.strategies.stages.map(([k, t]) => h("span", {}, h("b", {}, String(D.strategies.strategies.filter(x => x.stage === k).length)), t)))]),
    fold("Recent work", [
    card("", h("ol", { class: "acts" }, acts.slice(0, 8).map(a => h("li", {}, h("span", { class: "num sub" }, a.at), h("span", {}, a.text)))))])
  ];
}

/* ---------- strategy ---------- */
/* ---------- strategies: one funnel, one card per strategy ---------- */
const SSTAGE = { discovered: "wait", "early-review": "warn", optimising: "acc", ready: "good", testing: "good", adopted: "good", parked: "wait", rejected: "bad" };
const stageName = k => (D.strategies.stages.find(s => s[0] === k) || [k, k === "parked" ? "Parked" : k === "rejected" ? "Rejected" : k])[1];
const ring = n => n == null ? h("span", { class: "ring2", style: "--p:0", role: "img", "aria-label": "No score" }, h("b", {}, "\u2013")) : h("span", { class: "ring2", style: "--p:" + n, role: "img", "aria-label": "Score " + n + " of 100" }, h("b", {}, String(n)));
const fold = (title, kids, open) => { const k = "f:" + title; if (state[k] === undefined) state[k] = !!open; const d = h("details", { class: "fold" }, h("summary", {}, title), ...kids); d.open = state[k]; d.addEventListener("toggle", () => { state[k] = d.open; }); return d; };
function stratSheet(x) {
  const TS = { planned: "acc", running: "warn", done: "good", "not planned": "wait" };
  sheet(x.name, h("div", { class: "qrow" }, h("h3", {}, x.name), ring(x.score)), h("div", { class: "qrow", style: "justify-content:flex-start" }, pill(stageName(x.stage), SSTAGE[x.stage]), pill("from " + x.source, "plain")), h("div", {}, x.line),
    reading(x.next, "Next step", true),
    h("div", { class: "flabel" }, "How the score is counted"), h("div", { class: "stack", style: "gap:6px" }, x.score_parts.map(([t, got, of]) => h("div", { class: "qrow", style: "font-size:14px" }, h("span", {}, t), h("span", { class: "num sub" }, got + " of " + of)))), h("div", { class: "sub" }, "Evidence: " + x.evidence_note),
    h("div", { class: "flabel" }, "Checks"), h("div", { class: "checks" }, x.checks.map(c => h("span", { class: "chk " + (c.done ? "y" : "") }, c.name + ": " + c.result))),
    x.research.length ? h("div", { class: "flabel" }, "Research data") : null, ...x.research.map(r => h("div", { class: "qrow", style: "font-size:14px" }, h("span", {}, r.what), h("span", { class: "sub", style: "text-align:right" }, r.result + " · " + r.source))),
    x.tests.length ? h("div", { class: "flabel" }, "Production tests") : null, ...x.tests.map(t => h("div", { class: "qrow", style: "font-size:14px" }, h("span", {}, h("b", {}, t.direction + ": "), t.plan + (t.result ? " Result: " + t.result : "")), pill(t.status, TS[t.status] || "wait"))),
    h("div", { class: "flabel" }, "History (" + x.cycles + " review cycle" + (x.cycles === 1 ? "" : "s") + ")"), h("ol", { class: "acts" }, x.history.map(e => h("li", {}, h("span", { class: "num sub" }, e.date), h("span", {}, e.event + " ", e.file ? h("a", { class: "out", target: "_blank", rel: "noopener", href: "https://github.com/" + D.repo + "/blob/main/" + e.file }, "read the review") : null)))),
    x.why_rejected ? h("div", { class: "sub" }, "Rejected because: " + x.why_rejected) : null);
}
const stratCard = (x, i) => h("button", { class: "scard", style: "--i:" + i, onclick: () => stratSheet(x) }, ring(x.score), h("span", { class: "sbody" }, h("b", {}, x.name), h("span", { class: "kl" }, x.line), h("span", { class: "sub" }, "Next: " + x.next)), pill(stageName(x.stage), SSTAGE[x.stage]));
function vStrategy() {
  const S = D.strategies, all = S.strategies, live = all.filter(x => !["parked", "rejected"].includes(x.stage)), n = k => all.filter(x => x.stage === k).length;
  const shown = live.filter(x => state.sstage === "all" || x.stage === state.sstage).sort((a, b) => b.score - a.score);
  return [
    h("div", { class: "funnel", style: "margin-top:16px" }, S.stages.map(([k, t, d], i) => h("button", { class: "fstep", style: "--w:" + (100 - i * 9) + "%;--k:" + i, "aria-pressed": String(state.sstage === k), title: d, onclick: () => { state.sstage = state.sstage === k ? "all" : k; render(); const b = document.querySelectorAll(".fstep")[i]; if (b) b.focus(); } }, h("span", {}, t), h("b", {}, String(n(k)))))),
    h("p", { class: "sub" }, state.sstage === "all" ? "Tap a step to see only that stage. Tap a card for its research, reviews, score and history." : stageName(state.sstage) + ": " + S.stages.find(s => s[0] === state.sstage)[2]),
    shown.length ? h("div", { class: "sgrid" }, shown.map(stratCard)) : h("p", { class: "sub" }, "Nothing at this stage yet."),
    fold("Parked and rejected (" + (n("parked") + n("rejected")) + ")", [h("div", { class: "sgrid" }, all.filter(x => ["parked", "rejected"].includes(x.stage)).map(stratCard))]),
    fold("How the score works", [h("p", { class: "sub" }, S.note)]),
    fold("Series ideas", [h("div", { class: "tgrid" }, W.strategy.series.map(s => h("div", { class: "tcard" + (s.state === "active" ? " on" : "") }, h("b", {}, s.name), pill(s.state, s.state === "active" ? "good" : s.state.startsWith("held") ? "acc" : "wait"))))])
  ];
}

/* ---------- ideas: content suggestions, each tied to a strategy and to what Instagram rewards ---------- */
/* trends: written by the desktop app on a timer (no AI). Matching is by word only; what a trend is worth is the agent's call. */
/* research agents: each writes its own file; this page only shows what they wrote */
const AST = { working: ["working", "acc"], done: ["finished", "good"], stopped: ["stopped", "bad"] };
function agentSheet(a) {
  const rows = (t, list, f) => list && list.length ? [h("div", { class: "flabel" }, t + " (" + list.length + ")"), ...list.map(f)] : [];
  sheet(a.name, h("div", { class: "qrow" }, h("h3", {}, a.name), pill((AST[a.status] || [a.status, "wait"])[0], (AST[a.status] || [0, "wait"])[1])), h("div", { class: "sub" }, a.job), reading(a.step, a.status === "working" ? "Doing now" : "Last step", true),
    ...rows("What it did", a.did, d => h("div", { class: "planrow" }, h("b", {}, d.what), h("span", { class: "sub" }, d.result))),
    ...rows("Findings", a.findings, f => h("div", { class: "planrow" }, h("b", {}, f.title), h("span", {}, f.detail), f.correction ? h("span", { class: "rnote" }, "Reviewer's correction: " + f.correction) : null, h("span", { class: "sub" }, (f.kind === "claim" ? "claim, not confirmed · " : "") + (f.source || "") + (f.date ? " · " + f.date : "")))),
    ...rows("Pages found", a.pages, p => h("div", { class: "planrow" }, h("b", {}, "@" + p.handle + (p.followers ? " · " + p.followers : "")), h("span", {}, p.why), h("span", { class: "sub" }, p.source || ""))),
    ...rows("Strategies it proposes (not in the funnel until reviewed)", a.strategies, s => h("div", { class: "planrow" }, h("b", {}, s.name), h("span", {}, s.line), h("span", { class: "sub" }, (s.in_funnel ? (s.in_funnel.startsWith("no") ? "Not added: " + s.in_funnel.slice(4) : "In the funnel now") + ". " : "") + (s.evidence_note || "")))),
    ...rows("Problems", a.problems, p => h("div", { class: "planrow" }, h("span", {}, typeof p === "string" ? p : p.what))),
    ...rows("Wants to do next", a.next, n => h("div", { class: "planrow" }, h("b", {}, n.what), h("span", { class: "sub" }, n.why || ""))),
    h("div", { class: "sub" }, "Started " + a.started + " · last wrote " + a.updated));
}
function agentsBlock() {
  const A = D.agents || []; if (!A.length) return [];
  return [h("h2", {}, "Research agents"), h("div", { class: "sgrid" }, A.map((a, i) => h("button", { class: "scard", style: "--i:" + i, onclick: () => agentSheet(a) }, h("span", { class: "sbody", style: "grid-column:1/-1" }, h("b", {}, a.name), h("span", { class: "kl" }, a.step), h("span", { class: "checks" }, [["findings", a.findings], ["ideas", a.ideas], ["pages", a.pages], ["strategies", a.strategies]].filter(x => x[1] && x[1].length).map(([t, l]) => h("span", { class: "chk y" }, l.length + " " + t))), h("span", { class: "sub" }, "last wrote " + a.updated)), pill((AST[a.status] || [a.status, "wait"])[0], (AST[a.status] || [0, "wait"])[1]))))];
}
function trendBlock() {
  const T = D.trends;
  if (!T) return [h("h2", { style: "margin-top:16px" }, "Trends"), h("p", { class: "sub" }, "The trend catcher has not run yet. It runs inside Tarot Talk Desk on the PC, a few times a day.")];
  return [h("h2", { style: "margin-top:16px" }, "Coming up"),
    h("div", { class: "upcoming" }, T.calendar.map(c => h("div", { class: "upc", title: c.source }, h("b", {}, c.in_days === 0 ? "today" : c.in_days === 1 ? "tomorrow" : "in " + c.in_days + " days"), h("span", {}, c.what), h("span", { class: "sub" }, c.date)))),
    h("h2", {}, "Trending in India that touches our field"),
    T.feed_error ? h("p", { class: "sub" }, "Google's trending feed could not be read at the last try (" + T.checked + "). The dates above are still right.") :
      T.matches.length ? h("div", { class: "stack" }, T.matches.map(m => card("", h("div", { class: "qrow" }, h("b", {}, m.title), pill(m.traffic ? m.traffic + " searches" : "trending", "acc")), m.news[0] ? h("div", { class: "sub" }, m.news[0]) : null, h("div", { class: "sub" }, "matched our word: " + m.matched)))) :
      h("p", { class: "sub" }, "Nothing in India's " + T.feed_count + " trending searches matches our " + T.words + " words right now. That is normal on most days."),
    ...(() => { const ta = (D.agents || []).find(a => a.id === "trends"); return ta && ta.findings.length ? [h("h2", {}, "What India searches for in our field"), h("div", { class: "stack" }, ta.findings.map(f => card("", h("b", {}, f.title), h("div", { style: "font-size:14.5px;margin-top:4px" }, f.detail), f.correction ? h("div", { class: "rnote" }, "Reviewer's correction: " + f.correction) : null, h("div", { class: "sub", style: "margin-top:4px" }, (f.source || "") + (f.date ? " · read " + f.date : ""))))) ] : []; })(),
    T.matches_log && T.matches_log.length ? fold("Caught earlier (" + T.matches_log.length + ")", T.matches_log.map(m => h("div", { class: "planrow" }, h("b", {}, m.title), h("span", { class: "sub" }, "first seen " + (m.first_seen || "") + " · " + (m.traffic || ""))))) : null,
    T.top && T.top.length ? fold("Everything trending in India now", [h("div", { class: "checks" }, T.top.map(t => h("span", { class: "chk" }, t.title + (t.traffic ? " · " + t.traffic : ""))))]) : null,
    h("p", { class: "sub" }, "Checked " + T.checked + " by the desktop app, from Google's own Trending now feed and a calendar it works out itself. Moon dates are right to within about a day.")];
}
function trendsEvidence() { return D.trends ? trendBlock().slice(2) : trendBlock().slice(0, 2); }
function vIdeas() {
  const I = D.ideas, IS = { new: "acc", picked: "good", made: "good", dropped: "wait" };
  const sname = id => (D.strategies.strategies.find(x => x.id === id) || { name: id }).name, sobj = id => D.strategies.strategies.find(x => x.id === id);
  const SRC = { trends: "search", instagram: "page", similar: "page", methods: "method", outside: "page" };
  const all = I.ideas.map(x => ({ src: /@|page/i.test(x.borrowed_from || "") ? "page" : "method", ...x })).concat((D.agents || []).flatMap(a => (a.ideas || []).map(x => ({ src: SRC[a.id] || "method", added: (a.started || "").slice(0, 10), ...x })))).filter(x => x.status !== "dropped"), top = all.filter(x => x.pick).length;
  return [
    h("p", { class: "sub", style: "margin-top:14px" }, "What to post. Each card has the opening line, how to make it, and when to post it. All are untested until made."),
    seg([["top", "Best " + top], ["all", "All " + all.length], ["page", "From other pages", all.filter(x => x.src === "page").length], ["search", "From searches", all.filter(x => x.src === "search").length], ["method", "From methods", all.filter(x => x.src === "method").length]], state.ifilter, k => { state.ifilter = k; render(); }),
    h("div", { class: "sgrid" }, all.filter(x => state.ifilter === "all" || (state.ifilter === "top" ? x.pick : x.src === state.ifilter)).sort((a, b) => (a.pick || 99) - (b.pick || 99)).map((x, i) => h("div", { class: "scard idea", style: "--i:" + i }, h("span", { class: "sbody", style: "grid-column:1/-1" }, x.pick ? h("span", { class: "pill good", style: "align-self:flex-start" }, "Reviewer's pick " + x.pick) : newPill(x.added), h("b", {}, x.title), reading(x.hook, "Hook", true), h("span", { class: "kl" }, x.format), h("span", { class: "sub" }, x.why), x.post_by ? h("span", { class: "sub" }, "Post by: " + x.post_by) : null, x.review_note ? h("span", { class: "rnote" }, "Reviewer: " + x.review_note) : null,
      h("span", { class: "checks" }, h("span", { class: "chk y" }, "Earns: " + x.serves), sobj(x.strategy) ? h("button", { class: "chk", style: "cursor:pointer;background:none;font:inherit;font-size:12.5px", onclick: () => stratSheet(sobj(x.strategy)) }, "Strategy: " + sname(x.strategy)) : null, h("span", { class: "chk" }, "From: " + x.borrowed_from))), pill(x.status, IS[x.status] || "wait")))),
    (() => { const dr = (D.agents || []).flatMap(a => (a.ideas || []).filter(x => x.status === "dropped").map(x => [x.title, x.review_note || "", a.name])); return dr.length ? fold("Dropped by the reviewer (" + dr.length + ")", dr.map(([t, w, n]) => h("div", { class: "planrow" }, h("b", {}, t), h("span", { class: "sub" }, w + " · " + n)))) : null; })()
  ];
}

/* ---------- calendar: dates coming up, posting windows, and what runs by itself ---------- */
function jobsBlock() {
  const T = D.trends, dk = D.desk, A = D.agents || [], last = A.map(a => a.updated).sort().pop();
  const row = (name, when, state, cls, line) => card("", h("div", { class: "qrow" }, h("div", { style: "min-width:0" }, h("b", {}, name), h("div", { class: "sub" }, when), line ? h("div", { style: "font-size:14px;margin-top:4px" }, line) : null), pill(state, cls)));
  return [h("div", { class: "stack" },
    row("Dates coming up", "Worked out every time this page is built", "automatic", "good"),
    row("Trend catcher", "Every 6 hours, while the PC is on", T ? "last ran " + T.checked.slice(5, 16) : "not run yet", T && !T.feed_error ? "good" : "warn", T ? (T.feed_error ? "Google's feed could not be read at the last try." : T.feed_count + " trending searches read, " + T.matches.length + " in our field.") : "Starts when Tarot Talk Desk runs on the PC."),
    row("Reel fetch and sync", "Every 3 minutes, while the PC is on", dk ? "last seen " + String(dk.seen || "").slice(5, 16) : "not seen", dk ? "good" : "wait"),
    W.schedule && W.schedule.research ? row("Research helpers", W.schedule.research, last ? "last ran " + last.slice(5, 16) : "not run yet", "good", "Research, new ideas and Instagram notes. The parts that look at Instagram and Google Trends need the laptop on with the Claude app open.") : row("Research helpers", "Only when started from a Claude chat", last ? "last ran " + last.slice(5, 16) : "never", "warn", "Not automatic yet. A daily scheduled task in Claude has to be created once."))];
}
function vCalendar() {
  const C = D.calendar || [], withDate = (D.ideas.ideas.concat((D.agents || []).flatMap(a => a.ideas || []))).filter(x => x.status !== "dropped" && x.post_by);
  const groups = {}; withDate.forEach(x => { (groups[x.post_by] = groups[x.post_by] || []).push(x); });
  return [
    h("p", { class: "sub", style: "margin-top:14px" }, "Dates worth posting around, and which ideas belong to which window. Moon dates are right to within about a day."),
    h("div", { class: "upcoming" }, C.map(c => h("div", { class: "upc", title: c.source }, h("b", {}, c.in_days === 0 ? "today" : c.in_days === 1 ? "tomorrow" : "in " + c.in_days + " days"), h("span", {}, c.what), h("span", { class: "sub" }, c.date)))),
    h("h2", {}, "Posting windows"),
    Object.keys(groups).length ? h("div", { class: "stack" }, Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([w, list]) => card("", h("b", {}, w), h("div", { class: "checks" }, list.map(x => h("span", { class: "chk" + (x.pick ? " y" : "") }, x.title)))))) : h("p", { class: "sub" }, "No idea has a posting date yet."),
    h("h2", {}, "What runs by itself"), ...jobsBlock()
  ];
}

/* ---------- the four screens the owner asked for: Ideas, Searches, Instagram, Timeline ---------- */
const isNew = d => { if (!d) return false; const t = Date.parse(String(d).slice(0, 10)); return !isNaN(t) && (Date.now() - t) < 3 * 864e5; };
const newPill = d => isNew(d) ? h("span", { class: "pill acc", style: "align-self:flex-start" }, "new") : null;
function vSearches() {
  const T = D.trends, ta = (D.agents || []).find(a => a.id === "trends"), fs = ta ? ta.findings : [];
  return [
    h("p", { class: "sub", style: "margin-top:14px" }, "What India is searching for in our field. The live part is read by the desktop app every 6 hours; the deeper readings come from Google Trends."),
    h("h2", {}, "Trending right now"),
    !T ? h("p", { class: "sub" }, "The desktop app has not read the feed yet.") : T.feed_error ? h("p", { class: "sub" }, "Google's trending feed could not be read at the last try (" + T.checked + ").") :
      T.matches.length ? h("div", { class: "sgrid" }, T.matches.map((m, i) => h("div", { class: "scard", style: "--i:" + i + ";cursor:default" }, h("span", { class: "sbody", style: "grid-column:1/-1" }, h("span", { class: "pill acc", style: "align-self:flex-start" }, m.traffic ? m.traffic + " searches" : "trending"), h("b", {}, m.title), m.news[0] ? h("span", { class: "sub" }, m.news[0]) : null)))) : h("p", { class: "sub" }, "Nothing in our field among India's " + T.feed_count + " trending searches right now."),
    T && T.matches_log && T.matches_log.length ? fold("Caught in the last days (" + T.matches_log.length + ")", T.matches_log.map(m => h("div", { class: "planrow" }, h("b", {}, m.title), h("span", { class: "sub" }, "first seen " + (m.first_seen || "") + " · " + (m.traffic || ""))))) : null,
    h("h2", {}, "What people search through the year"),
    fs.length ? h("div", { class: "sgrid" }, fs.map((f, i) => h("div", { class: "scard", style: "--i:" + i + ";cursor:default" }, h("span", { class: "sbody", style: "grid-column:1/-1" }, newPill(f.date), h("b", {}, f.title), h("span", { class: "kl" }, f.detail), f.correction ? h("span", { class: "rnote" }, "Corrected: " + f.correction) : null, f.source ? h("a", { class: "out", href: f.source, target: "_blank", rel: "noopener", style: "font-size:12.5px" }, "Open in Google Trends") : null)))) : h("p", { class: "sub" }, "No readings yet."),
    T ? h("p", { class: "sub" }, "Live feed last read " + T.checked + ". Trends numbers are relative, not search counts.") : null
  ];
}
function vInsta() {
  const F = D.formats; if (!F) return [h("p", { class: "sub" }, "Nothing recorded yet.")];
  const V = { use: ["Use", "good"], "try": ["Try once", "acc"], later: ["Later", "wait"], "not for us": ["Not for us", "bad"] }, K = { format: "Format", hook: "Hook", selling: "Selling" };
  const list = F.items.filter(x => state.fkind === "all" || x.kind === state.fkind), order = ["use", "try", "later", "not for us"];
  return [
    h("p", { class: "sub", style: "margin-top:14px" }, F.note),
    seg([["all", "All", F.items.length], ["format", "Formats", F.items.filter(x => x.kind === "format").length], ["hook", "Hooks", F.items.filter(x => x.kind === "hook").length], ["selling", "Selling", F.items.filter(x => x.kind === "selling").length]], state.fkind, k => { state.fkind = k; render(); }),
    h("div", { class: "sgrid" }, list.slice().sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict)).map((x, i) => h("div", { class: "scard", style: "--i:" + i + ";cursor:default" }, h("span", { class: "sbody", style: "grid-column:1/-1" },
      h("span", { class: "qrow" }, h("span", { style: "display:flex;gap:6px;flex-wrap:wrap" }, h("span", { class: "tag2" }, K[x.kind] || x.kind), x.abroad ? h("span", { class: "tag2" }, "abroad") : null, isNew(x.added) ? h("span", { class: "pill acc" }, "new") : null), pill((V[x.verdict] || [x.verdict, "wait"])[0], (V[x.verdict] || [0, "wait"])[1])), h("b", {}, x.name), h("span", { class: "kl" }, x.what), h("span", { class: "chk y", style: "align-self:flex-start" }, x.numbers),
      reading(x.for_us, "For us", true), x.review_note ? h("span", { class: "rnote" }, "Reviewer: " + x.review_note) : null, h("span", { class: "checks" }, x.seen_on.map(p => D.pages[p] ? h("a", { class: "chk", href: "#p-" + p, style: "text-decoration:none" }, "@" + p) : h("a", { class: "chk", href: "https://www.instagram.com/" + p + "/", target: "_blank", rel: "noopener", style: "text-decoration:none" }, "@" + p))), h("span", { class: "sub" }, x.by)))))
  ];
}
function vMore() {
  const items = [["home", "Overview", vHome], ["strategy", "Strategies", vStrategy], ["research", "Research", vResearch], ["make", "Make", vMake]];
  const cur = items.find(x => x[0] === state.more) || items[0];
  return [seg(items.map(([k, t]) => [k, t]), cur[0], k => { state.more = k; render(); }), ...cur[2]()];
}

/* ---------- make: production, scripts and skills in one place ---------- */
function vMake() {
  const sub = { production: vProduction, scripts: vScripts, playbook: vPlaybook }[state.mtab] || vProduction;
  return [seg([["production", "Production"], ["scripts", "Scripts"], ["playbook", "Skills"]], state.mtab, k => { state.mtab = k; render(); }), ...sub()];
}

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
    h("h2", { style: "margin-top:16px" }, "Planned tests"),
    h("p", { class: "sub" }, "Each strategy will be tried along four directions. These are plans; no test is running yet. Grey means nothing is planned."),
    h("div", { class: "stack" }, D.strategies.strategies.filter(x => x.tests.length).sort((a, b) => b.score - a.score).map(x => card("", h("div", { class: "qrow" }, h("button", { class: "linkbtn", onclick: () => stratSheet(x) }, x.name), pill(stageName(x.stage), SSTAGE[x.stage])),
      h("div", { class: "dirs" }, D.strategies.directions.map(dn => { const t = x.tests.find(y => y.direction === dn); return h("div", { class: "dir " + (t ? t.status.replace(" ", "-") : "none") }, h("b", {}, dn), h("span", {}, t ? t.plan + (t.result ? " Result: " + t.result : "") : "Nothing planned"), t ? h("i", {}, t.status) : null); }))))),
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
  const wait = (title, line) => card("", h("div", { class: "waitbox", role: "status" }, h("div", { class: "orb", "aria-hidden": "true" }), h("div", {}, h("h3", {}, title), h("div", { class: "sub" }, line))));
  if (state.deskQuit) return [card("", h("h3", {}, "The app is closed"), h("p", { class: "sub" }, "Nothing is running now. Close this window. To start again, double-click Tarot Talk Desk on the Desktop."))];
  if (state.deskDown) return [card("", h("h3", {}, "This window lost touch with the app"), h("p", { class: "sub" }, "If the app was restarted, reload this window. If it was closed, start it again from the Tarot Talk Desk shortcut on the Desktop."), h("button", { type: "button", class: "dbtn hot", onclick: () => location.reload() }, "Reload"))];
  if (!s) return [wait("Connecting to the desktop app", "This takes a second or two.")];
  const say = h("div", { class: "msg", role: "status" }, state.deskMsg || "");
  const run = (name, body, waitMsg) => async e => { const b = e.currentTarget; b.disabled = true; b.classList.add("busy"); say.textContent = waitMsg || "Working on it ..."; const r = await api(name, body); if (name === "quit" && r.ok) { state.deskQuit = true; render(); return; } state.deskMsg = r.msg; say.textContent = r.msg; b.disabled = false; b.classList.remove("busy"); };
  const btn = (t, fn, cls) => h("button", { type: "button", class: "dbtn " + (cls || ""), onclick: fn }, t);
  const waiting = s.queue.filter(x => x.state === "queued" || x.state === "working").length, forAgent = s.queue.filter(x => x.state === "ready-for-agent" || x.state === "needs-agent").length;
  const light = s.paused ? ["Paused", "wait"] : s.busy ? ["Working", "acc"] : ["Watching the queue", "good"];
  const gh = s.sync_failed ? ["Not in sync", "bad"] : s.last_ok ? ["In sync " + s.last_ok.slice(11), "good"] : ["Not checked yet", "wait"];
  const node = (title, st, line) => h("div", { class: "dnode" }, h("b", {}, title), pill(st[0], st[1]), h("span", {}, line));
  const addBox = h("form", { class: "req", onsubmit: async e => { e.preventDefault(); const r = await api("add", { text: $("#dlink").value }); state.deskMsg = r.msg; say.textContent = r.msg; if (r.ok) $("#dlink").value = ""; } },
    h("label", { for: "dlink" }, "Reel link, page link or @handle", h("input", { id: "dlink", placeholder: "https://www.instagram.com/reel/...", autocomplete: "off", inputmode: "url" })),
    h("button", { class: "go", type: "submit" }, "Add to the queue"), h("div", { class: "sub" }, "Reel or page, content or method: the agent works that out itself."));
  return [
    s.restart ? card("", h("h3", {}, "An update was downloaded"), h("p", { class: "sub" }, "Quit the app below and start it again from the Desktop shortcut to use the new version.")) : null,
    s.rev !== LOCAL.rev ? card("", h("div", { class: "qrow" }, h("div", {}, h("h3", {}, "New results are in"), h("div", { class: "sub" }, "Reload to see them on the other tabs.")), btn("Reload", () => location.reload(), "hot"))) : null,
    s.broken ? card("", h("h3", {}, "The queue file is damaged"), h("p", { class: "sub" }, s.broken)) : null,
    h("div", { class: "dflow" }, node("Web dashboard", gh, s.sync_failed ? (s.sync_note || "The last round did not sync. See the work log.") : "Sakshi's view. Requests sent there arrive here."), h("i", { "aria-hidden": "true" }, "⇄"),
      node("This desktop app", light, waiting + " waiting here · " + s.reels_today + (s.max_reels ? " of " + s.max_reels : "") + " reels read today"), h("i", { "aria-hidden": "true" }, "⇄"),
      node("Claude agent", forAgent ? [forAgent + " waiting", "warn"] : ["Nothing waiting", "wait"], "Starts only when a Claude session is asked. No schedule is set.")),
    s.busy ? wait("The app is working", (s.logs[s.logs.length - 1] || "").replace(/^\d\d:\d\d\s+/, "") || "Syncing with GitHub and checking the queue.") : null,
    h("div", { class: "dbar" }, btn("Check now", run("check"), "hot"), btn(s.paused ? "Resume" : "Pause", run("pause")), btn("Read trends now", run("trends")), btn("Open project folder", run("folder")), s.public ? h("a", { class: "dbtn", href: s.public, target: "_blank", rel: "noopener" }, "Open web dashboard") : null, btn("Quit the app", run("quit"))), say,
    h("p", { class: "sub" }, "The app keeps working in the background after this window is closed, and checks GitHub every " + s.poll_min + " minutes. Quit stops it. " + (s.ident || "")),
    fold("Claude sessions", sessionCards().slice(1), (D.sessions ? D.sessions.sessions : []).some(x => (x.compactions || 0) >= 1)),
    h("h3", { style: "margin-top:18px" }, "Add work"), card("", addBox),
    fold("Tools on this computer (" + s.tools.filter(t => t.ok).length + " of " + s.tools.length + " ready)", [
    h("div", { class: "tiles" }, s.tools.map(t => card("", h("div", { class: "qrow" }, h("h3", {}, t.name), pill(t.ok ? "ready" : "missing", t.ok ? "good" : "bad")), h("div", { class: "sub" }, t.used_for), t.ok ? null : t.fixable ? btn("Install it", run("fix", { key: t.key }, "Installing. This can take a few minutes ..."), "hot") : h("div", { class: "sub", style: "margin-top:6px" }, "Install by hand: ", h("code", {}, t.install)))))], s.tools.some(t => !t.ok)),
    h("h3", { style: "margin-top:18px" }, "Queue"),
    s.queue.length ? h("div", { class: "stack" }, s.queue.map(x => card("", h("div", { class: "qrow" }, h("div", { style: "min-width:0" }, h("h3", { style: "overflow-wrap:anywhere" }, (x.kind === "page" ? "@" : (KIND[x.kind] || x.kind) + ": ") + x.target), h("div", { class: "sub" }, (x.purpose && x.purpose !== "auto" ? x.purpose + " · " : "") + "from " + (x.by || "?") + " · " + (x.updated || x.asked || "")), x.result ? h("div", { style: "font-size:14px;margin-top:4px" }, x.result) : null,
      x.state === "failed" ? btn("Try again", run("retry", { n: x.n })) : x.state === "refused" ? btn("Try again now (skips the 24 hour wait)", run("retry", { n: x.n, force: true })) : null), pill((QSTATE[x.state] || [x.state, "wait"])[0], (QSTATE[x.state] || [x.state, "wait"])[1]))))) : h("p", { class: "sub" }, "Nothing in the queue."),
    fold("Work log", [h("pre", { class: "dlog" }, s.logs.length ? s.logs.slice().reverse().join("\n") : "Nothing yet.")])
  ];
}
if (LOCAL) { ICON.desk = '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'; setInterval(poll, 3000); poll(); }

/* ---------- shell ---------- */
const TABS = [["ideas", "Ideas", vIdeas, "bolt", ""], ["searches", "Searches", vSearches, "search", ""], ["insta", "Instagram trends", vInsta, "film", ""], ["calendar", "Timeline", vCalendar, "compass", ""], ["more", "More", vMore, "book", ""]];
if (LOCAL) TABS.push(["desk", "Desk", vDesk, "desk", ""]);
function route() { let k = (location.hash || "").slice(1); if (["production", "scripts", "playbook"].includes(k)) { state.mtab = k; k = "make"; } if (k === "abroad" && D.abroad) { state.rtab = "abroad"; k = "research"; } if (k.startsWith("p-") && D.pages[k.slice(2)]) return { tab: "more", profile: k.slice(2) }; if (["home", "strategy", "research", "make"].includes(k)) { state.more = k; k = "more"; } return { tab: TABS.some(t => t[0] === k) ? k : "ideas" }; }
function render() {
  const r = route();
  if (r.profile) { handle = r.profile; P = D.pages[handle]; }
  $("#tabs").replaceChildren(...TABS.map(([k, t, , ic]) => h("a", { href: "#" + k, "aria-current": String(k === r.tab) }, icon(ic, 16), t)));
  const t = TABS.find(x => x[0] === r.tab), noHead = ["more"].includes(r.tab);
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
