---
name: instagram-scouting
description: Use when asked to look at, scroll, watch or study public Instagram profiles and reels as references (outliers, hooks, structure, calls to action, numbers), through the built-in browser on the user's computer at low token cost.
---

# Instagram scouting

Studies public Instagram profiles and their reels as references: which reels are outliers, how they open, how they are built, what they ask the viewer to do.

Tested on 20 Nov 2026 on one profile and two reels (English-language counters). Instagram changes its pages often: if a snippet returns nothing, read the page once with `read_page`, fix the selector, and update this skill. The snippets in this file are the canonical copy; the files in the owner's `AI` repo (`instagram-scouting/snippets/`) are copies.

## What it does and does not do

Does: list a profile's reels with views and find outliers; read a reel's caption, counters and length; see a reel as a sheet of still moments; read burned-in captions from those stills; measure sound through the hear-video-sound skill.

Does not, yet: photo and carousel posts, reading comments, finding profiles in a niche, posting dates (not shown on the reel view), and a transcript of speech that has no burned-in captions. Say so when one of these is asked for; do not improvise them. The session's vidIQ Instagram tools may cover niche search, comments and transcripts when the owner's credits allow; they are not part of this skill.

"Watching" here means stills and measurements. A reel is never seen in motion or heard.

## How it reaches Instagram, and the rules

Through the built-in browser of the Claude desktop app on the owner's computer (`Claude_Browser` tools; load the built-in-browser skill first).

- Before the first scouting of a session, tell the owner the browser is signed in to an Instagram account and ask which one it is and whether to use it. Opening reels counts as views from that account and shifts its feed.
- Scripted scrolling and seeking is still automated use, which Instagram's terms do not allow. Low volume lowers the risk to the account; it does not remove it. The owner decides; say this once.
- If the built-in browser cannot be reached, say so and ask the owner to open the chat in the desktop app. Never fetch Instagram from the workspace shell, a fetch tool or a hosted job.
- Never type a password or accept one. If a login wall, a challenge, a warning or "try again later" appears: stop and tell the owner. Do not suggest throwaway accounts or exported cookies.
- View only. The single click allowed is expanding a caption ("... more"). Never like, follow, comment, save, share, message or change anything.
- Pace: one profile at a time; at most 5 scroll rounds; at least 20 seconds between reels; at most 10 reels in a sitting and 20 in a day.
- References teach structure. Never keep, copy or reuse anyone's footage, music, voice, characters or wording. Nothing is downloaded.

## Cost ladder: stop at the lowest step that answers the question

Each step costs the snippet sent plus what comes back. Rough totals:

1. **Profile list**, text, about 1,000 tokens for 25 reels. Finds the outliers.
2. **Reel facts**, text, about 800 tokens. Caption, counters, length.
3. **Contact sheet**, one screenshot plus about 800 tokens of snippet. Six moments: hook, middle, call to action.
4. **Burned-in captions**: a dense sheet of one stretch (12 frames across about 14 seconds), then `zoom` on a row to read the words. Only for the reel whose wording matters.
5. **Sound**: only when the voice or music is itself the question; hear-video-sound skill.

A full look at one reel (steps 2 and 3) is about 3,000 to 4,000 tokens. Never screenshot to read text a snippet returns. Never open a reel the list did not single out, unless the owner sent its link.

## Step 1: profile list

Open `https://www.instagram.com/<handle>/reels/`, wait 4 seconds, then run:

```js
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
```

Returns the profile line, how many reels are pinned, the median views of the reels that are not pinned, and `id:views` pairs, newest first, pinned ones marked `*`. Rule of thumb, not a law: an outlier is a reel that is not pinned at 3 times that median or more. Report it as views and as a multiple of the median. Views are not adjusted for age; the newest two or three reels are still growing.

## Step 2: reel facts

Open `https://www.instagram.com/reel/<id>/`, wait 4 seconds, then run:

```js
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
```

`counters` are usually likes, comments, reposts, shares, in that order. If there are not exactly four, say the labels are uncertain. Compare a reel's comments and shares with the same account's other reels, not with a fixed number.

## Step 3: contact sheet

After step 2, run the sheet snippet, take one screenshot, then run the remove snippet (the sheet also removes itself after 30 seconds).

```js
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
```

```js
(() => { const c = document.getElementById('__sheet'); if (c) c.remove(); return 'removed'; })()
```

With no arguments it samples the hook (0.3 s, 2.5 s), the middle and 2 seconds before the end. For captions call it as `(12, 0.3, 14)`: 12 frames between two times.

## What to write down

One note per profile in the project's repo folder, `references/scouting/<date>-<handle>.md`, under one page:

- **Numbers** (read from the page): handle, followers, median, date and time looked at; outliers with views and multiple; for each reel studied, length and counters.
- **Seen** (from the stills): on-screen text, who and what is in frame, how the shots change.
- **Opinion** (marked as such): the hook, the beats, the call to action, why it may have worked, what to learn, what not to take.
- **Not checked**: sound, speech not captioned, comments, anything guessed.

Do not put screenshots in the repo.

## Before findings are used

A note that will shape a series, a script or a look goes to an independent reviewer first: a fresh agent, given the note and the question, asked whether the conclusions follow from the numbers. Two reels do not make a rule.

## Talking to the owner

Simple, short text. Numbers first, then what the reel does, then what it may mean for the project. Times in IST.
