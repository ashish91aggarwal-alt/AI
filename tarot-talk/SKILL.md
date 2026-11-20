---
name: tarot-motion-series
description: Use when planning or making a motion-graphic reel series (10-20 episodes) for the tarot / healing / Akashic Instagram channel that ends in a comment-to-DM pitch for a paid PDF, healing or guidance.
---

# Tarot motion series

Plans and makes reel series for the owner's wife's Instagram channel (tarot, healing, Akashic reading). Each series is 10-20 episodes, connects with the viewer in the first seconds, and ends in a call to action: comment a word, the auto-DM (SuperProfile) pitches a paid PDF report, healing or guidance.

Proof this works: the New Year 2026 mulank series sold a yearly report at Rs 555 and made about Rs 1.5 lakh.

## Where the work lives

Folder `tarot-talk/` in the owner's shared GitHub repo `AI` (ashish91aggarwal-alt/AI), which holds every project in its own folder. Tarot Talk is the channel's handle. Attach the repo at the start of every session and work only inside `tarot-talk/`. If it cannot be attached, tell the owner and stop before saving anywhere else.

- `SKILL.md` — a copy of this skill. When the skill changes, update the copy in the same commit.
- `ideas/series-ideas.md` — the one running list of series ideas. Read it first. Add to it; never start a second list.
- `reviews/` — every independent review, dated.
- `references/` — notes on benchmark reels (see "References").
- `series/<slug>/` — one folder per series: `BIBLE.md`, `cta.md`, `episodes/`, `results.md`.

Commit and push after every gate.

## The rule above all others: never approve your own work

Every decision goes to an independent reviewer before it is shown as ready or built on. A decision is: an idea list, the pick order, a series bible, a script, a look, a pilot film, a batch, the DM and sales copy.

- The reviewer is a separate agent started fresh, with web search. Give it the files and the context, not your opinion of the work. It checks facts and dates by looking them up. Ask for a verdict first, then required changes.
- Save its report in `reviews/`. Under it write an author's note: each required change, done or not done, with the reason. Never write "all applied", "approved" or "final".
- Any edit made after a review goes to a fresh reviewer, who also verifies the author's note of the last review. There is no "small change" exception for scripts, copy or films.
- Every message to the owner that shows work names the review file and says in one line what the reviewer found and what is still open or not yet re-checked.
- Only the owner approves. If the owner disagrees with a reviewer, the owner wins; record it.
- If no reviewer can be started in the session, say the work is unreviewed and stop at that gate.

## Gates, in order

1. **Idea list.** Each idea is two attractive viewer-facing lines, then episode count, the viewer connection, what it sells. Review, then the owner picks.
2. **Calendar.** Work back from any date the series depends on (festival, year end, launch). List each later gate with a date in IST. If it does not fit, say so before starting.
3. **Series bible**: the viewer's self-check (how they find "their" episode in 3 seconds), every episode title and hook line, the finale's content, the one comment keyword, posting schedule. Review, then owner.
4. **Product and CTA.** The PDF or service must exist or have a delivery date; ask the owner, do not assume. Then write the end card, caption, keyword, DM message and sales lines. Review, then owner.
5. **Look.** Draw the same key shot as still frames in three or four styles and judge them at phone size. A style frame shows one idea, not the whole story. Review, then the owner picks one.
6. **Pilot.** One episode, made in full, with the real end card. The script passes the stop, follow and choose gates before any drawing; the finished film passes them again, along with the pilot checks. Review, then owner. No batch before the pilot passes.
7. **Batches.** Three to five episodes at a time, each batch reviewed before the next starts. Every episode passes the three gates.
8. **After posting.** At 24 hours and at 7 days, log per episode in `results.md`: reach split by followers and non-followers, 3-second hold rate, average watch time, completion rate, likes per reach, sends per reach, saves per reach, follows per reach, keyword comments, DMs opened, sales. Use it to choose the next series and to see which gate is weakest.

## Stop, follow, choose gates

Every script and every finished reel is checked by the reviewer against these, pass or fail. They come from the owner's reference post on why people stop, follow and buy (`references/2026-11-20-instagram-funnel-post.jpg`). The post's percentages have no source and are not used; its three stages are kept, with what Instagram itself says matters added: watch time, likes and sends, sound-off viewing, original content.

Stop (will a stranger stay):
- The first 2 seconds show motion and the question, and are understood with the sound off.
- A stranger can say what the hook is after one viewing at phone size.
- One open question is held until the last 5 seconds.
- No shot carries more than one idea or two text items.

Follow (will they come back):
- The viewer leaves with one usable thing, complete in itself.
- Same characters, palette and title card as the other episodes.
- The ending names the next episode.
- There is a real reason to send it to someone.

Choose (will they buy):
- What the report or service gives is stated in one plain sentence.
- The free value is complete without buying.
- One comment keyword, shown on screen and spoken.
- No fear and no guaranteed outcome; any proof or client story is real.

A fail on any line sends the script or film back before the owner sees it as ready.

## What makes a series idea good

- A self-check the viewer can do at once: birth date, name, phone number, month, a number they keep seeing.
- A counted set that truly gives 10-20 episodes under the method it names. Check the method's own arithmetic. If the set has 7, it is not a series.
- A finale with defined content, not a tease.
- A product that follows naturally: the reel gives the general reading, the PDF gives the personal one.
- Variety: never two "number 1-9" series back to back.
- One comment keyword per reel, a word and not a digit.

## Honesty rules

- Speak of patterns and tendencies. Never promise that money will come, an illness will go, or a person will return.
- No fear selling: no curses, doshas or "do this or else". No guilt or debt framing. Nothing that could keep someone in a harmful relationship.
- Healing and chakra content makes no medical claim.
- Say in the reel when it simplifies the method (for example, only the total of a phone number).
- Deities and scripture: tell known stories from named sources, state no home-made mapping as tradition, and get a separate sensitivity review before scripting.
- Dates (festival, planetary event) are looked up for an Indian city, not remembered.

## References

Indian mythology and spiritual motion reels are the benchmark for look and pace. Before choosing a look for a series, find two or three current ones (web search, vidIQ Instagram tools if present, or links the owner sends), and save a note in `references/<date>-<topic>.md`: the link, what to learn (pace, colour, type, hook), and what not to take (their characters, designs, music, shots). The reviewer checks the pilot against this note.

## Making the films

Motion graphics drawn in code with Lemo-Opuscar (github.com/lemomo-ai/lemo-opuscar).

- Clone the library at the time of use and record its commit in the series `BIBLE.md` (first checked at 00a7f9e). Follow its `DIRECTOR.md`, `TECHNIQUE.md` and the chosen `styles/<slug>/STYLE.md` for how to direct and build. Where its `AGENTS.md` workflow differs from the gates above (it asks once and then does not stop), the gates above win.
- Do not copy its guides into the repo or this skill. Its code is MIT and films made with it are ours; its guides are licensed for making our films, not for republishing.
- Size: vertical. Pass `--size 1080x1920` to every render tool; the library's default is 1920x1080.
- Text: Hindi and Hinglish. The library ships no Devanagari font: add an openly licensed one (Noto Sans / Noto Serif Devanagari) and check a still of every Devanagari line enlarged for broken conjuncts and matras.
- Voice: decide in the bible — the reader's own recorded voice (preferred; the library can time to a recording), text only with music, or a Hindi TTS voice. Any paid voice test needs the owner's cap first.
- Styles that suit the channel: gilded-illumination, stained-glass, shadow-puppet, paper-lantern, vintage-collage, engraving, ink-wash, papercut-red. One style per series so it is recognisable in the feed. Read the style's own limits (for example, its stained-glass style is written as secular).
- Each episode is 30-60 seconds: hook in the first 3 seconds, the self-check on screen, one idea, the call to action at the end. A series shares one template built in the pilot: opening beat, type, palette, end card.
- Frame rules: one idea per shot; no text under about 48 px; keep text and action out of the top 250 px, bottom 400 px and right 150 px, where Instagram's own caption and buttons sit; the subject of the shot fills at least a third of the frame.
- Characters are full-body, dressed for this audience, and built as separate jointed parts from the first style frame.

Owner's standing production rules:

- Characters move through their own joints the way the real person or animal moves. No picture sliding, hopping, rotating or stretching as a whole, and no warping part of a picture and calling it motion.
- Every movement must be clearly visible on a phone screen.
- Claude writes the code; frames are rendered by running that code, not produced through chat tokens.
- Render locally. Rented GPU only where a heavy open model is truly needed, always with a budget cap and an idle kill switch.
- Paid credits: ask the owner how many voices, how many versions and what cap before any test.

## Pilot and batch checks for the reviewer

- Do the first 3 seconds make a viewer stop, and can they find themselves in it?
- Is every line of text readable on a phone, held long enough, not covering the subject, with correct Devanagari?
- Does the motion follow the production rules?
- Does the call to action name one keyword and one clear benefit?
- Do the honesty rules hold in script, on-screen text and DM copy?
- Is anything taken from the benchmark reels or the library's demo films that should not be?

## Talking to the owner

Simple, short text. Status first, then what the reviewer said, then the one decision needed. Times in IST.
