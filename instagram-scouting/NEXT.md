# Next batch: research power for the desktop app (asked by the owner on 20 Nov 2026, not built yet)

Start with an independent review of the 20 Nov web-app batch (playable reels, research buttons, progress marks, India-fit board). It was tested but not reviewed.

1. Browser inside the desktop app. The app opens its own browser window (Playwright driving the Edge already on the PC, with its own saved profile). The owner signs in to Instagram there himself, once; the app never sees or stores a password. With it the app lists a page's reels (views, pinned, median, multiples) using the snippets in `snippets/`, view-only, at the pace limits in the skill. Output is raw numbers marked "ready for agent". This is automated viewing on his account, against Instagram's terms; it is his choice and must stop on the first challenge.
2. Trends check. Find what is free and allowed today before building (Google Trends has no open public API; unofficial libraries get blocked often; Wikipedia pageviews and YouTube search suggestions are possible extra signals). Verify by search first. Result feeds the "Trends India" check on the India-fit board.
3. Scheduler. A scheduled Claude task that works the queue and the India-fit checks in small bounded runs, and writes progress (pages scouted, reels listed, reels heard, ideas cleared) that the Home tab already shows. The owner has not yet said how often.
4. Every finding shown on the dashboard carries its checks: trends, seen on Indian pages, independent reviewer. Nothing is shown as verified until those are done.
