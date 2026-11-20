# Next batch: research power for the desktop app (asked by the owner on 20 Nov 2026, not built yet)

Start with an independent review of the 20 Nov web-app batch (playable reels, research buttons, progress marks, India-fit board). It was tested but not reviewed.

Owner's decisions, 20 Nov 2026 (these replace the earlier list):

## Who does what

Script (the desktop app, no tokens): fetch a reel's sound, transcript, audio numbers and public counters; fetch trend numbers once a free, allowed source is confirmed; keep the queue; sync with GitHub; count progress; build the dashboard.

Agent (a Claude session, inference only): look at pages in the built-in browser; decide which reels are worth reading and whether another batch is needed; name concepts; write findings; run the India-fit checks; ask for the independent review. An agent never does by hand what the script can do: it puts reels in the queue and reads the script's output.

The desktop app does NOT get its own Instagram browser. Looking at pages needs judgement, so it stays with the agent.

## Batches, not a cap

No fixed limit on how many reels or pages are studied. Work goes in batches (about 10 reels). After each batch the agent reads the results and decides from the data whether another batch is needed and which reels go in it. The pace inside a batch stays slow, and everything stops at the first refusal from Instagram, with the 24 hour wait. Those two rules protect the account and are not a research limit.

## Status, 20 Nov 2026 evening

Done: the rules above are in the scouting skill. Trends: checked, there is no free open API (official Google Trends API is an invite-only alpha; the unofficial library is archived and gets blocked), so the Trends India check is a look at the public Trends website by the agent. The owner can apply for the official alpha at developers.google.com/search/apis/trends. The daily scheduled agent run is NOT set up: creating it was not permitted from the build chat. Its full instructions are in `scheduled-agent-prompt.md`; the owner can create the task himself or ask a chat to create it and approve the prompt. Not done: no India check has actually been run yet; the first transcripts from the PC have not arrived.
