# Backlog, round three

Rounds one (BACKLOG.md) and two (BACKLOG-2.md) are done bar two parked items:
**phase 11 (share a run)** and **phase 17 (get it onto Play)** are still queued and come after
this round. These are the next ten, numbered as phases 18–27.

Same rule as the first two rounds: every "evidence" line is measured against the shipped
content at v0.26.0, not estimated. Where a number comes from a bot, the bot is named, because
a bot measures the bot.

Status: **doing** · **queued** · **done**

The audit these were drawn from, at v0.26.0 (526 cards, 22 arcs, 23 endings, 4 mandates):

| | |
|---|---|
| A run shows | 102 cards, 93 distinct, 18% of the deck |
| Two runs on the same side share | 38% of cards |
| A left run and a right run share | 22% |
| Cards a competent run spends in a Decay look | **10.3%** (full Decay: **0.1%**) |
| Cards a competent run spends in an Ascent look | 64.2% (full Ascent: 1.9%) |
| Cards where the same card comes up twice in one run | 9.0 per run |
| Cards never drawn in 400 runs | 40 of 526 |
| Cards that come back as a consequence | 11.9 per run, none marked as one |
| Worst colour contrast in the Decay look | 2.76:1, below AA even for large text |
| Sound cues, and how many change with the path | 7, and 0 |
| Endings a player has seen after 40 runs | median 4 of 23 |

---

## Phase 18. The two paths, and how little of them you see — *done*

**Shipped.** Decay is a livestream and Ascent is a projection in gold, and both are now
things a run reaches rather than decoration nobody sees. The looks were half the job; the
other half was that the deepest stage needed `|drift| >= 55`, which is where drift sits on
1.6% of cards drawn, so redrawing it without re-scaling would have fixed nothing.

**What a run sees now, 3,000 runs per bot, counting the look each card was drawn under:**

| | before | after |
|---|---|---|
| full Ascent, competent run | 1.9% of cards, 15.7% of runs | **15.4% of cards, 66.3% of runs** |
| full Decay, cynical run | 5.3% of cards, 36.3% of runs | **21.6% of cards, 73.8% of runs** |
| any Ascent look, competent run | 64.4% | 67.9% |
| any Decay look, cynical run | 65.0% | 68.6% |

`STAGE_AT` went from `[10, 30, 55]` to `[8, 20, 36]`, chosen by sweeping five candidates
against the measured drift distribution rather than by eye. `[7, 17, 30]` put a cynical run
at maximum intensity for 30% of its cards, which is exhausting; `[8, 20, 36]` keeps the
pyramid — most of a run at stages one and two, the deep look as a destination.

**Four rounds of mockups, thirty treatments, two survivors.** Round one offered five per
path; Channel and Feed came through for Drool and Record for Rule. Round two put five more
in each of those spaces. Round three narrowed Drool to the stream with the money showing and
changed Rule's register entirely, from the official document to a country that got to the
future. Round four was three iterations of each, and **Loud Stream** and **Warm Holo** won.
The pages are `public/mockups/paths*.html`, shipped self-contained so they can be opened on
the phone they were designed for.

**Both looks arrive in three stages rather than all at once.** The stream is a LIVE badge and
a viewer count that climbs with how bad things are; then the chat and one alert; then the
emote spam, a second alert and a subscriber goal that never quite gets there. The projection
is a plinth of light; then one dimmer pane behind the card; then two, so the card becomes the
one pane in focus.

**Overlaying the card's prose with the chat was wrong and the browser said so.** The first
version put the chat over the card the way the mockup did, and at phone size it rendered the
text unreadable — *"Rents doubled. The movement wants a [emote]reeze tnight"*. The chat gets
gutters now and the card narrows to make room, which is the same crowded feeling and costs
nothing you have to read. Three other collisions came out of the same check: the badges were
sitting on the meter row, the alerts were covering the teaching note's button, and the card
had a fixed width so the first gutter pushed it off the right-hand edge of the screen. The
check that found them is part of the browser pass now: nothing the path draws may overlap
anything you read or tap, and it reports which two elements collided rather than a boolean.

**It also settles half of phase 21's evidence.** The old Decay palette had two pairs failing
WCAG AA outright at 2.76:1 and 2.94:1. Every pair in both new looks clears the 3:1 floor, and
only one — the Decay accent at stage three, 4.21:1 — is large-text-only, which is what it is
used for. The typo transform came down from 0.6/0.3 to 0.4/0.2 at the same time: it used to
carry the dumbing-down alone and was seen on almost nothing, and it now runs on a fifth of a
cynical run's cards with the stream shouting over it. Two things saying the same thing is one
thing too many.

**The ticker and the AD badge are gone.** They were the old Decay chrome and the stream
replaces both. The sponsor line survives, because a stream has to be paid for by somebody.

**And then it did not fit on the phone it was reported from.** The frame was `min-height:
100dvh`, so it grew past the viewport and the page scrolled: you could see the meters or the
footer but not both. Three things were wrong at once. The frame is the viewport exactly now
for a run (the codex, the setup and the ending are documents and still grow), the stage
stretches the card instead of centring it — a percentage `max-height` on a centred grid item
does not clamp, which is how a 327px card ended up in a 210px stage — and the alerts moved
out of a floating overlay into the frame's own column, because floating them cost 118px of
reserved footer that a 640px phone cannot afford. Below 700px tall the deepest stage drops
its emote column and its second alert rather than squeezing the card past reading. Measured
at seven viewport sizes from 360x640 to 768x1024, in all three looks, with the tallest
footer the game can produce: **nothing scrolls and nothing is clipped.**

<details>
<summary>Original entry</summary>

**Evidence.** The game is called Rule or Drool and a competent player never sees Drool.
Measured over 3,000 runs per bot, counting the look each card was drawn under:

| look | competent (mixed) | careless (random) | cynical (greedy) |
|---|---|---|---|
| full Decay (`decay3`) | **0.1% of cards**, 2.1% of runs | 2.9%, 14.6% | 5.3%, 36.3% |
| `decay2` | 2.0%, 17.6% | 11.8%, 39.9% | 25.0%, 82.8% |
| `decay1` | 8.2%, 50.4% | 23.6%, 74.1% | 34.7%, 97.2% |
| muddle | 25.4% | 42.3% | 30.6% |
| `ascent1` | 39.8%, 99.9% | 16.0%, 58.3% | 4.3%, 38.4% |
| `ascent2` | 22.5%, 82.0% | 3.0%, 15.9% | 0.1%, 1.1% |
| full Ascent (`ascent3`) | **1.9% of cards**, 15.7% of runs | 0.3%, 1.7% | 0.0%, 0.0% |

Two things fall out of that. The third stage either way is decoration: it needs
`|drift| >= 55` and drift is that far out on **1.6% of cards drawn**, median +14, p90 +37.
And the looks are not symmetrical — a competent run lives on the Ascent side (64.2% of its
cards) and a cynical one on the Decay side (64.0%), so each player mostly sees one of the
two things the game is named after and never the other.

**Do.** Two jobs, and the second is the one worth doing properly.

*Re-scale when a look arrives.* The stage thresholds (`STAGE_AT = [10, 30, 55]`) were set
before the drift distribution was what it is. Stage 3 should be something a run that commits
reaches, not an outlier.

*Redraw both looks.* The Decay look is currently a 2005 web page — yellow, Comic Sans, hot
pink, a tilt — and the Ascent look is an annual report. Neither is wrong, but neither has
been looked at since it was written, and the Decay one in particular is "ugly" rather than
*designed to be ugly*, which is a different thing.

*Round one* (`public/mockups/paths.html`) mocked five treatments per path. Three came
through: **Channel** and **Feed** for Drool — both versions of the same claim, that the state
reaches you through a screen that is selling you something — and **Record** for Rule, a
document that will outlast whoever signed it. *Round two* (`paths-2.html`) put five more in
each of those spaces.

*Round three* (`paths-3.html`) narrows Drool to **Stream with the money showing**: five
versions of a government that is a livestream running on advertising, differing in who is
paying for it — an advertiser, a shopping channel, the viewers, three things at once, or
nobody, so the country buffers while the advertisement plays in full quality.

**Rule changed register at round three and it is worth recording why.** The document looks
were all one claim: that a working country leaves good paperwork. The brief that replaced it
is that a working country *builds the thing* — an advanced technology society, bright and
slightly absurd rather than solemn. That is a larger swing than a palette, because it moves
the Ascent look from "this will be legible in fifty years" to "look what we made", and the
two say different things about what winning this game means. Five in that space: a pneumatic
capsule, a 31st-century machine with physical buttons, a public service that is simply
pleasant, a world's fair that got built, and a projection. One Drool and one Rule get built.

**Both paths are chosen.** Drool is **Stream** — the government as a livestream with the
room talking over it — and Rule is **Holo**, a projection rather than a surface. *Round four*
(`paths-4.html`) is three iterations of each rather than three more alternatives: Stream at
three volumes, which is the question the stage ladder actually has to answer, and Holo as two
palettes and a structure.

Two costs the mockups surfaced that a palette decision would have hidden: three of the thirty
(Clip, Push, Multi) replace the layout rather than restyling it, and every Rule treatment in
round three wants a webfont the app does not currently ship. A third only appeared in round
four: **the accessible version of Holo is cheaper than the inaccessible one**, so building
`Cool` first makes the readable setting the default rather than a downgrade.

**Done when** a run that steers one way spends at least a quarter of its cards in that
path's look with the deepest stage reachable by playing that way rather than by an outlier,
and the two looks are distinguishable on a phone at arm's length with the text unread.

</details>

## Phase 19. The bill you cannot see coming — *done*

**Shipped.** A card that came back has a folded corner. A card that is here because of a
pattern has a tally in the opposite corner. Everything else is dealt and looks it.

**What a run is made of, now that the draw records why each card is there:**

| | competent run | cynical run |
|---|---|---|
| dealt from the deck | 77.4 per run | 75.9 |
| **a bill, sent by an earlier choice** | **11.9** | **15.2** |
| **a habit, earned by a pattern** | **2.4** | **2.3** |
| an arc continuing | 8.3 | 7.8 |
| an election | 2.9 | 3.0 |

**14.3 cards a run carry a mark, 17.4 for a player who defers more** — which is the right
shape, because deferring more is what sends more bills. A bill turns up in 98.5% of runs and
a habit in 93.1%.

**The engine now records why a card is on the table** rather than leaving everything
downstream to infer it. `GameState.currentFrom` is set by the draw, which always knew and
threw the answer away.

**The inference it replaces was never once wrong, and replacing it was still right.**
Measured over 309,076 cards, guessing "queued" from `weight === 0` was correct every single
time — because all 69 arc cards happen to be weight 1 and all 59 weight-0 cards happen to be
queued. That is a convention the content follows, not a rule the engine enforces: one arc
card written at weight 0 would have broken it silently. More to the point it cannot express
the distinction this phase is about at all. **A habit card is weight 4 and drawn from the
pool like any other**, and the only thing that separates it is that every flag it is gated on
is a counting mark. So the claim in the code comment is the measured one: this makes a
coincidence into a guarantee, and adds the reading the guess could not make.

**The first habit mark was a stack of sheets behind the card**, which is the better metaphor
and the wrong game: phase 18 had just put dimmer panes behind the card on the Ascent path,
and two things behind the card meaning two different things is one too many. The tally sits
on the card, in the corner opposite the fold, so the two marks never fight and a card could
carry both.

**Neither mark is a word**, so the card carries a visually-hidden line saying what the mark
says. The two teaching notes point at their own marks now — the folded corner, the stack —
rather than describing something invisible, and the one that fires for a delayed card keys on
the recorded source instead of the weight, so it can no longer fire on the wrong card.

<details>
<summary>Original entry</summary>

**Evidence.** Phase 14 put a consequence on 40% of the ordinary deck, and **11.9 cards a run
now arrive because of something you did earlier**. Nothing on the card says so. The only
thing in the shipped build that knows a card came from the queue is the debug panel and one
teaching note that fires once ever.

**Do.** Mark a card that is your own doing, at the moment it lands rather than in a
retrospective. It does not need words: the card that comes back should look like it has been
somewhere. Same for a card that a habit produced, which is a different claim — not "you did
this once" but "this is how you do it".

**Done when** a player can tell, without reading, whether the card in front of them is new
or a bill, and the 11.9 that come back stop being indistinguishable from the 90 that do not.

</details>

## Phase 20. Cards nobody draws, and cards you draw twice — *done*

**Shipped.** Nothing in the deck is unreachable any more, and a card that comes back comes
back a third of a run later instead of a sixth.

**Which filter was starving them, measured rather than guessed.** Counting draws says a card
is never seen; counting *eligibility* says whether it was ever even a candidate, which
separates a condition nobody satisfies from a weight that never wins. Over 1,200 runs across
three bots, of 35 never-drawn cards:

| | | |
|---|---|---|
| **27** | **never in a cell the draw visits** | the defect |
| 8 | gated on a promise no run in the sweep made | correct |
| 0 | eligible but losing the weighted pick | — |

**The 27 were unreachable by construction and it was one mistake made 27 times.** A run opens
in muddle and the band only recomputes at an era boundary, so **for the whole of era 1 the
band is always muddle** — and all 27 had era 1 as their only era with bands that excluded it.
Twenty-four came from three files written as one batch. None of them is a first-term card;
they are generic "the country is going badly / going well" cards, so the band is the intent
worth keeping and the era was the mistake. They run in all three eras now, matching the seven
cards already shipping in that shape.

`startBand` is a config value rather than a literal in `newRun`, and **the validator rejects
the shape**: only era 1, bands excluding the band a run starts in, is an error rather than a
thin cell. The shipped deck is pinned against it, against a mandate gate naming a promise
that does not exist, and against a cooldown longer than the smallest cell.

**The eight that look unreachable are not.** They wait on a mandate, and a sweep that never
takes one never sees them. Run with each promise taken, all eight turn up: the cards that
arrive when a promise breaks in 74–97% of that promise's runs, the temptations in 15–56%.

**Repeats were never the deck running out.** At the moment a pool draw repeated, the median
number of other eligible cards was 61, and in 105,110 cards there was **not one** repeat where
the deck had nothing else to offer. It is a memory length, not a shortage: `cooldownSize` was
15 in a run of about 87 cards, so a card could return after a sixth of the run. It is 30 now —
about a third — and **deck repeats fell from 5.5 a run to 2.9**, with the relax ladder never
once triggered and the smallest cell (123 cards) still four times the window.

| | before | after |
|---|---|---|
| repeats per run, all sources | 6.9 | **4.3** |
| of those, from the draw pool | 5.5 | **2.9** |
| from the queue (a consequence sent twice) | 1.1 | 1.1 |
| from an election (which ignores cooldown by design) | 0.3 | 0.3 |
| median gap between a card and its repeat | 26 cards | **44 cards** |

**The done-when asked for "repeats under 4 a run" and the answer is 4.3, which misses.** I
wrote that target before measuring and it counts three different things as one. A queued
consequence firing twice is the consequence system working, and an election repeating is the
election draw deliberately ignoring the cooldown; neither is a draw-pool problem and neither
should be tuned away. The half that *is* a draw-pool problem is 2.9 and was 5.5. I also
reached for "no repeat within 25 cards" as a better measure and it is circular — any cooldown
of 25 or more satisfies it by construction. The measure that survives is the median gap.

**A longer memory is not free and the cost was measured.** At `cooldownSize` 38 the unlocked
mixed bot reached the Ascent 15.7% of the time against 16.5% at 15, over 20,000 runs each —
real at about three standard errors, and too close to the 15% floor. At 30 it is 16.1%, which
is the pre-phase value, and the extra repeats it buys over 38 are 0.8 a run. Going further
would have paid a point of Ascent for a number I invented before I had the data.

<details>
<summary>Original entry</summary>

**Evidence.** **40 of 526 cards were never drawn in 400 unlocked runs.** Eight of those are
mandate cards, which only appear under a promise, so 32 are ordinary cards nobody will ever
see. They cluster: seven in `l2*`, seven in `r2*`, five in `a4*`. At the same time the same
card comes up **9.0 times per run** — roughly one card in eleven is a repeat.

**Do.** Find out which filter is starving them (era, band, cooldown, align, a `cond` nothing
satisfies) rather than guessing, and fix the cause. The validator already reports thin cells;
it does not report a card that is technically reachable and practically never reached.

**Done when** no card is unreachable in 400 runs, repeats are under 4 a run, and the
validator warns about practical unreachability so this cannot come back quietly.

</details>

## Phase 21. A look that can be read — *queued*

**Evidence.** Contrast, measured against WCAG AA:

| | ratio | |
|---|---|---|
| Decay accent on background | **2.76:1** | fails even the 3:1 large-text floor |
| Full-Decay accent on background | **2.94:1** | fails |
| Muted text on background (muddle, Ascent) | 3.50:1 | large text only |
| Full-Ascent muted on background | 3.69:1 | large text only |

Everything else clears it comfortably, so this is three colours rather than a rebuild. On top
of that the Decay look sets Comic Sans and a `-2.4deg` tilt and runs the text through a typo
transform. There are seven settings; `plainText` turns off the typos and `portraits` turns
off the faces, and nothing turns off the rest.

**Do.** Fix the three colours. Add one setting that means what a player actually wants —
keep the palette, drop the tilt, the display font and the degradation — and make sure it
survives whatever phase 18 draws.

**Done when** every text pair clears AA at its own size, and a player who needs the plain
version can get it in one tap without losing the game's voice.

## Phase 22. Sound that knows which way it is going — *queued*

**Evidence.** Seven synthesized cues — `commit`, `danger`, `arc`, `election`, `era`,
`endWell`, `endBadly` — and **none of them changes with the path**. The Decay look changes
the palette, the font, the tilt and the words on the meters. It does not change what the
game sounds like, so a run sliding into Drool sounds exactly like one climbing.

**Do.** Make `commit` in particular follow drift the way the frame does: the same gesture,
detuned and cheapened on the way down, cleaner and more resolved on the way up. It is one
oscillator and a filter, not a sample pack.

**Done when** the same swipe sounds different at drift -60 and +60, and the difference is
audible on a phone speaker.

## Phase 23. The two sides should not look the same — *queued*

**Evidence.** The frame theme reads drift and nothing else. A left run and a right run share
22% of their cards, have different party names, different bloc names, different traits,
different flaws and different arcs — and **are pixel-identical at the same drift**.

**Do.** Give each side a signature that survives the path: a type choice, an accent, a
texture, the shape of the card corners. It has to be a second axis rather than a second
theme, because it multiplies with phase 18's work rather than replacing it.

**Done when** a screenshot at drift 0 says which party is in office, and the path look still
reads as itself under both.

## Phase 24. The rival you cannot see coming — *queued*

**Evidence.** The rival speaks **8.8 cards a run** (8.5% of all cards), holds a standing from
0 to 100 that rises when you cheat and falls when you are honest, pulls drift and the
election bar, and decides whether a coup becomes `rival_wins`. **The number is never shown.**
`rival_wins` ends 0.3% of runs, which is either correct or a bug and there is no way for a
player to tell which.

**Do.** Surface the standing the way the meters are surfaced — not a seventh bar, but
something that says whether the person on the other side is gaining. The cabinet screen knows
who they are; it does not know how they are doing.

**Done when** a player can answer "is my rival winning?" before the run ends.

## Phase 25. An era should feel like a jump — *queued*

**Evidence.** An era boundary is the largest structural event in a run: a successor takes
office, the band is recomputed and past era 3 it locks, the era passive changes, the deck's
era filter moves. It is presented as **a dialog with a kicker, a heading and two lines of
text**, and it is the only place the game stops.

**Do.** Make the jump a jump. The frame already has a look; the transition should be where it
changes rather than a modal in front of it. What the country was left carrying at the
boundary is known (`legacies`, the queue, the cabinet's tenure) and none of it is shown.

**Done when** the boundary reads as time passing rather than as a dialog, and it says what
carried over.

## Phase 26. Forty runs, four endings — *queued*

**Evidence.** Measured over 60 players of 40 runs each, **the median player has seen 4 of the
23 endings**, and `obj_ten_endings` completes 0% of the time. Phase 13 made every ending
reachable by a player who *aims* at it (bankruptcy 78%, paralysis 79%, anarchy 8%) and named
near-misses in the codex, which is a different problem from the one measured here: ordinary
play still converges.

**Do.** Not more endings. Give ordinary play more reason to end somewhere new — the codex
knows what you have not seen and what you came close to, and it currently only says so after
the fact.

**Done when** a competent player finishing twenty runs has seen ten endings without setting
out to farm them.

## Phase 27. The ending two runs in three get — *queued*

**Evidence.** **`finale_muddle` is 64.5% of a competent player's endings.** It draws from six
epilogues (band × side × era), so a player who finishes ten runs reads the same ending card
six or seven times and one of six epilogues under it. The Decay and Ascent finales are 15.9%
and 15.6%.

**Do.** The muddle finale is the honest majority outcome and should stay the majority
outcome; it should not be the same card every time. It is the one ending that can afford to
be written from what the run actually did — how many promises were kept, what the country is
still carrying, who was still in the room — because it is the one the player will read most.

**Done when** two muddle finales from different runs do not read as the same ending.
