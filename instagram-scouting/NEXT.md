# Next batch: research power for the desktop app (asked by the owner on 20 Nov 2026, not built yet)

Start with an independent review of the 20 Nov web-app batch (playable reels, research buttons, progress marks, India-fit board). It was tested but not reviewed.

Owner's decisions, 20 Nov 2026 (these replace the earlier list):

## Who does what

Script (the desktop app, no tokens): fetch a reel's sound, transcript, audio numbers and public counters; fetch trend numbers once a free, allowed source is confirmed; keep the queue; sync with GitHub; count progress; build the dashboard.

Agent (a Claude session, inference only): look at pages in the built-in browser; decide which reels are worth reading and whether another batch is needed; name concepts; write findings; run the India-fit checks; ask for the independent review. An agent never does by hand what the script can do: it puts reels in the queue and reads the script's output.

The desktop app does NOT get its own Instagram browser. Looking at pages needs judgement, so it stays with the agent.

## Batches, not a cap

No fixed limit on how many reels or pages are studied. Work goes in batches (about 10 reels). After each batch the agent reads the results and decides from the data whether another batch is needed and which reels go in it. The pace inside a batch stays slow, and everything stops at the first refusal from Instagram, with the 24 hour wait. Those two rules protect the account and are not a research limit.

## To build

1. Trends check as a script step. Verify by search what is free and allowed today before building (Google Trends has no open public API as far as known; unofficial libraries get blocked; Wikipedia pageviews and YouTube search suggestions are possible extra signals). It feeds the "Trends India" check on the India-fit board.
2. Scheduler: a scheduled Claude task that works "ready for agent" items in batches as above and writes what it did. Frequency not yet given by the owner.
3. Every finding on the dashboard carries its checks (trends, seen on Indian pages, independent reviewer). Nothing shows as verified until they are done.

## Numbers first (owner, 20 Nov 2026)

Before watching anything, the agent reads the page's own code with the snippets in `snippets/` to get the numbers for every reel on the grid (views, pinned, and where shown likes and comments), with no reading of comments and almost no tokens. From that table it decides: which reels stand out, whether the page is worth more batches at all, and which reels go in the next batch. Watching and reading are spent only on the reels the numbers point to. The decision and its reason are written into the page's findings.
