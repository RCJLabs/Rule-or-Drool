# Backlog, round three

**Round three is done.** All ten shipped, at v0.37.0. Round four is in BACKLOG-4.md. What is left across all three rounds is
the two parked items: **phase 11 (share a run)** and **phase 17 (get it onto Play)**.

Rounds one (BACKLOG.md) and two (BACKLOG-2.md) are done bar those two. These were the next
ten, numbered as phases 18–27.

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

## Phase 21. A look that can be read — *done*

**Shipped.** Every text style in the app clears WCAG AA at its own size, and one setting
gives a player the plain version of the game without taking the game away.

**The entry's evidence was stale and the measurement had to be redone.** It names Comic
Sans, a `-2.4deg` tilt and three specific colours; phase 18 replaced both palettes and
`--tilt` has been `0deg` ever since, so none of the three survives. What replaced guessing
is a browser audit that walks every element with its own text, composites the ancestor
backgrounds down to an opaque colour, applies element opacity, and applies the real
large-text rule (24px, or 18.66px at weight 700) rather than one threshold for everything.

**60 failing text styles across twelve screens, and four causes.**

| | | |
|---|---|---|
| **bare `<button>` kept the user agent's `#efefef` face** | 2.00–3.61:1 | worst: "Got it" on Ascent |
| **the overlay panels had no background at all** | 3.60:1 | settings, cabinet, how-it-works |
| muddle `--muted` too light | 3.50:1 on `--bg`, 4.05:1 on `--paper` | most of the count |
| two dims done with `opacity` | 2.67:1 and 2.86:1 | speaker trait, locked codex entry |

The audit is worth more than the fixes. **The overlay panels rendering with no background
is a shipping bug nobody had noticed**: settings, the cabinet and how-it-works are siblings
of `.frame` in the tree, not children, so `var(--paper)` resolved to nothing — the panels
were body text over a blurred screenshot, in the browser's default serif, over a scrim
covering part of the viewport. Compositing the ancestor chain is what found it; a
screenshot confirmed it. The theme tokens now have a `:root` base as well as the `.frame`
one. **After: 0 failing text styles on all twelve screens.**

**`opacity` is the wrong tool for dimming text** and was used twice. It dims the text
against whatever is behind it, so a 0.75 on a muted colour lands at 2.67:1 while reading in
the source like a small adjustment. Both are `color: var(--muted)` now, which is a colour
you can measure.

**The setting is one tap, and what it removes is the noise.** "Plain screen" turns off
everything the two paths draw — the stream badges, chat, emotes and alerts; the projection's
panes, plinth and scanline overlay — plus the text glow, the decay saturation push and the
card glow, and it implies `plainText` so the words stop being mangled too. Measured in the
browser across all seven themes:

| | plain screen off | on |
|---|---|---|
| chrome elements on screen, full Decay | 7 | **0** |
| card width, full Decay | 220px | **372px** |
| card width, Decay stage 2 | 277px | **372px** |
| failing text styles, any theme | — | **0** |

**What it does not take is the palette or the writing.** Both looks clear AA on their own,
and the gold projection and the purple stream *are* the game — a player who needs plainer
text is not asking for a different game. The dumbed-down meter labels stay for the same
reason, and so does the sponsor bar: it is one legible strip that overlaps nothing, and
dropping it would take the joke away from the one player who cannot opt back in.

**A setting that another setting is already doing should say so.** With the plain screen on,
"Keep the text clean" shows on and locked with "Already on: the plain screen does this."
rather than sitting unchecked while the text is clean anyway.

<details>
<summary>Original entry</summary>

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

</details>

## Phase 22. Sound that knows which way it is going — *done*

**Shipped.** The same swipe sounds different at drift -60 and +60 — and, separately, the
cue you hear on every card is now audible on a phone at all, which it was not.

**"Audible on a phone speaker" had to become a number before anything could be built
against it.** The cues are rendered offline by the shipped module itself — `sound.ts` is
bundled and its `AudioContext` swapped for an `OfflineAudioContext`, so this measures the
real synth rather than a copy — and put through two cascaded 2nd-order highpasses, the
~24 dB/octave rolloff a phone's micro-speaker has below its enclosure resonance. 500 Hz is
the conservative corner for a phone and 300 Hz the generous one. It is a model and it is
named as one; the finding below holds at both corners.

**The card landing was inaudible on the device the game is for.** It was a 150 Hz sine, and
a sine has no harmonics to leak through:

| cue | through the phone, before | after |
|---|---|---|
| **commit** (every card) | **-24.7 dB** | **-0.3 dB** |
| era | **-26.8 dB** | -4.4 dB |
| arc | -20.7 dB | -3.5 dB |
| danger | -8.7 dB | unchanged |
| endBadly | -4.1 dB | unchanged |
| endWell | +1.8 dB | unchanged |
| election | +2.9 dB | unchanged |

Peak level on a phone went from 0.0105 to 0.0836 for `commit`, about 18 dB. The set used to
span 21 dB between its quietest and loudest cue on a phone and now spans 5. The low notes
all stayed — on anything with a woofer they are the body of the sound — and what is new is a
partial high enough to survive: the voice sits at four times the root, 600 Hz one way and
740 the other.

**Two sides that were supposed to be distinguishable were not.** Left and right differed
only as 150 Hz against 185, both under the rolloff, and through the phone they were 91% the
same sound. They are 600 Hz against 740 now.

**The path ladder is one number, the same one the frame uses.** `soundLevel` is
`ascent - decay`: -1 in deep Decay, +1 in deep Ascent, continuous, so nothing lurches at a
stage boundary the way the looks do. Measured through the phone model:

| | centroid | length | level on a phone |
|---|---|---|---|
| **drift -60** | 1015 Hz | 41 ms | 0.096 |
| drift 0 | 780 Hz | 48 ms | 0.084 |
| **drift +60** | 932 Hz | 150 ms | 0.092 |

Going down, the whole cue sags 13% in pitch over its own length and a sawtooth 30 cents
sharp beats against it: harsher and clipped. Going up, the pitch holds and the note is
answered a fifth above: longer and resolved. **Loudness is held flat within 2 dB across the
whole range on purpose** — this fires on every card, and "going badly" meaning "louder"
would be exhausting by card 40. The first attempt was 6.3 dB louder at the bottom, and the
sawtooth's gain was cut until it was not.

**A measure that was measuring the wrong thing.** I added a roughness metric — amplitude
modulation in the 4-25 Hz band, which is where two detuned copies beat — and it returned
1.89 for a single clean tone. On a 100 ms one-shot there is no steady state: it was reading
the note's own envelope. Dropped for cue length, which is a number that means what it says.

**The plumbing is verified in the real app, not just the cue table.** Every oscillator the
page creates is recorded during an actual run: at drift -36 a swipe is a sagging triangle
pair plus a detuned sawtooth, and at +42 the same swipe is a rising pair plus a clean 900 Hz
fifth. Worst case — every cue one card can fire, stacked — peaks at 0.276, so nothing clips.

**Two things beyond what the entry asked for, and one thing it asked for that was gone.**
`arc` and `era` were as inaudible as `commit` and got the same treatment, which the Do
clause did not call for; and the evidence says the Decay look "changes the palette, the
font, the tilt" — phase 18 removed the font and phase 21 confirmed `--tilt` has been `0deg`
since. The palette and the meter wording are what is actually left.

<details>
<summary>Original entry</summary>

**Evidence.** Seven synthesized cues — `commit`, `danger`, `arc`, `election`, `era`,
`endWell`, `endBadly` — and **none of them changes with the path**. The Decay look changes
the palette, the font, the tilt and the words on the meters. It does not change what the
game sounds like, so a run sliding into Drool sounds exactly like one climbing.

**Do.** Make `commit` in particular follow drift the way the frame does: the same gesture,
detuned and cheapened on the way down, cleaner and more resolved on the way up. It is one
oscillator and a filter, not a sample pack.

**Done when** the same swipe sounds different at drift -60 and +60, and the difference is
audible on a phone speaker.

</details>

## Phase 23. The two sides should not look the same — *done*

**Shipped.** A screenshot with every word hidden now says which party is in office, and
each path still reads as itself under both.

**The evidence was exactly right and worth pinning down before building against it.** The
computed style of every element inside the frame, compared between a left run and a right
one at the same drift:

| | styled things in the frame | differ between the parties | pixels differing, every word hidden |
|---|---|---|---|
| **before**, drift 0 | 35 | **0** | **0.07%** |
| before, full Decay | 47 | 1 (a meter icon's own shape) | 0.05% |
| before, full Ascent | 40 | **0** | 0.05% |
| **after**, drift 0 | 36 | **5** | **2.90%** |
| after, full Decay | 46 | 4 | 1.99% |
| after, full Ascent | 40 | 4 | 2.44% |

0.05% is the noise floor — a portrait and a meter icon that happen to be drawn differently —
so before this the parties were identical in everything but the words, and the one style
that differed was not a party signal at all.

**Shape, because the path owns colour.** A second theme would have to fight phase 18 for the
palette and phase 21 for the contrast. A second axis does not: `--corner` and `--card-edge`
are geometry, and the edge mark takes whichever accent the current path is using, so the
signature is the same idea in brown at drift 0, magenta in full Decay and gold in full
Ascent.

- **The Commons** is a poster: round corners (`--radius` x 1.7) and a printed stripe down the
  spine.
- **The Ledger** is a book of accounts: square corners (x 0.16), a rule across the head of
  the entry, and another under the row of figures.

The teaching note is marked the same way as the card it sits under, because a square card
beneath a round note with the stripe on the other edge reads as a bug rather than a party.
The setup screen carries the signature of whichever side is selected, so picking one shows
what it looks like before you commit to it.

**Neither axis diluted the other**, which is the half of the done-when that is easy to lose:

| under | muddle vs full Decay | muddle vs full Ascent | full Decay vs full Ascent |
|---|---|---|---|
| the Commons | 46 of 47 styles, 100% of pixels | 40 of 41, 100% | 50 of 51, 100% |
| the Ledger | 45 of 46 styles, 100% of pixels | 39 of 40, 100% | 50 of 51, 100% |

Those numbers are the same before and after. The party moves 2-3% of the screen; the path
moves all of it. That is the right ratio: the path is what the game is about and the party
is who is holding the pen.

**Shape alone is not enough and the footer says it outright.** Geometry is invisible to a
screen reader and easy to miss at this size, so the party is also named in words, in a chip
that takes the party's own corner — the Commons is a pill, the Ledger is a box. It costs no
height: the two controls already had a centred row to themselves with empty space either
side, and the chip fills it. Measured at 21 viewport-and-look combinations with a promise
badge and a teaching note both showing, nothing scrolls. The chip's radius is its own token
rather than `--radius x --corner`, because scaling a 12 px radius gives a pill that is not
quite a pill and a box that is not quite a box at 19 px tall.

**Checked across all 28 combinations** — two parties, seven looks, plain screen on and off:
the signature survives every one of them, and the contrast audit from phase 21 still reports
0 failing text styles in each. With the chip in, the party moves 5-6 styled things and
2.1-3.0% of the pixels, and the paths still move 100% of them under both.

<details>
<summary>Original entry</summary>

**Evidence.** The frame theme reads drift and nothing else. A left run and a right run share
22% of their cards, have different party names, different bloc names, different traits,
different flaws and different arcs — and **are pixel-identical at the same drift**.

**Do.** Give each side a signature that survives the path: a type choice, an accent, a
texture, the shape of the card corners. It has to be a second axis rather than a second
theme, because it multiplies with phase 18's work rather than replacing it.

**Done when** a screenshot at drift 0 says which party is in office, and the path look still
reads as itself under both.

</details>

## Phase 24. The rival you cannot see coming — *done*

**Shipped.** The cabinet says how the rival is doing, in four states rather than a seventh
bar, and the button that opens it carries a mark once they could actually take the office.

**The entry asked whether 0.3% is correct or a bug. It is correct, and the reason is not the
rival.** Pressure is derived, not stored — `standing + |drift| x 0.35` — so it can be read at
any state. Over 12,000 runs per sweep:

| bot | mean pressure | over 30 (costs you votes) | over 60 (could win) | `rival_wins` |
|---|---|---|---|---|
| random | 37.9 | 77.2% of cards | 5.6% | **2.07%** of runs |
| greedy | 44.3 | 84.4% | 16.4% | 0.20% |
| saint | 39.1 | 92.8% | 0.03% | 0.13% |
| **mixed** (competent) | 42.4 | 89.2% | 9.5% | **0.10%** |

**The rival gets strong and then has nowhere to collect.** They are at or over the winning
threshold at **9.1% of a competent player's elections** — but that threshold only does
anything if you lose a vote, and a competent coalition clears the bar by a **median of 13
mood points**. Over 3,145 honest votes the mixed bot lost two, and **neither because of the
rival**.

**What the standing is actually worth, measured against the counterfactual of a rival with
no electoral pull at all:**

| bot | mean bar lift | max | honest votes | lost ONLY because of the rival |
|---|---|---|---|---|
| random | 0.51 pts | 4.20 | 2,062 | **31 (1.50%)** |
| greedy | 0.89 | 4.20 | 3,496 | 0 |
| mixed | 0.76 | 4.20 | 3,145 | **0** |

**So the mechanism works and it punishes bad play, which is a defensible design and not a
number to tune.** The rival decided 1.5% of the random bot's elections and none of the
competent bot's. Raising `rivalElectionPull` until it bites competent play would be changing
the design because a bot found it convenient — the mistake this project has caught twice
already. The engine is untouched: this phase is entirely presentation, so balance is
unchanged by construction rather than by a harness run.

**Not a seventh bar, because the game's rule is that a number you are meant to feel is never
printed.** Four rungs, on the engine's own thresholds rather than new ones — below where
they start costing you anything, above it, halfway to winning, and able to win:

> *Ready to take the office off you.*
> Taking 2.7 points of the vote you would otherwise have. Lose a ballot now and it is theirs
> by name.

The cost line is the real number the engine is charging (`electionBar` minus its floor), not
an invented one, and it adds a clause when the coalition is already under the bar.

**The unprompted half is a dot on the cabinet button**, and only at the top rung. The run
never mentions the rival on its own; this is the one place it points, it costs no layout, and
the button's label says why for anyone who cannot see a 6px dot.

**One thing the measurement said that nothing in the game does.** Pressure counts `|drift|`,
so a run deep into Ascent feeds the rival exactly as much as one deep into Decay — 16-26% of
their standing is simply how far from the middle you have gone, in either direction. That is
now visible, because the state moves whichever way you run.

**Checked at rung 3 under all three looks**, including the light palette, which needs a
banked standing over 60 at zero drift and cannot be reached with the debug drift keys:
0 failing text styles on the cabinet screen in each.

One correction to the entry's own numbers: it says the rival speaks 8.8 cards a run, 8.5% of
all cards. Measured now it is 6.8-8.0% depending on the bot.

<details>
<summary>Original entry</summary>

**Evidence.** The rival speaks **8.8 cards a run** (8.5% of all cards), holds a standing from
0 to 100 that rises when you cheat and falls when you are honest, pulls drift and the
election bar, and decides whether a coup becomes `rival_wins`. **The number is never shown.**
`rival_wins` ends 0.3% of runs, which is either correct or a bug and there is no way for a
player to tell which.

**Do.** Surface the standing the way the meters are surfaced — not a seventh bar, but
something that says whether the person on the other side is gaining. The cabinet screen knows
who they are; it does not know how they are doing.

**Done when** a player can answer "is my rival winning?" before the run ends.

</details>

## Phase 25. An era should feel like a jump — *done*

**Shipped.** The boundary takes the whole frame, in the era it is arriving into, and says
what the country is carrying into it.

**There was always something to say, which is the first thing worth knowing.** Measured over
11,762 crossings:

| into | legacies carried | decisions still owed | band changed | meters moved |
|---|---|---|---|---|
| era 2 | **3.9** | 3.4 | 25% | 3.6 pts |
| era 3 | **5.5** | 2.2 | 27% | 3.8 pts |

**Not one crossing in 11,762 arrived carrying no legacy at all.** The transition had a
heading and two lines of text while four to six specific things the country would be living
with went unmentioned.

**The band changes at a quarter of boundaries and nothing said so.** `muddle -> decay`,
`muddle -> ascent` and both of them back again. That is the single largest hidden fact at the
boundary, and it is not fixed by printing the word "Decay" — the game's rule is that the
direction is never named. It is fixed by the transition *being* the look: the panel takes the
frame and renders in the era it is arriving into, so the change happens there rather than
behind a dialog.

**The cabinet was dropped on the evidence.** The entry suggested showing its tenure; measured,
**8.3 of the 9 are there from the first day**, so at a boundary it would say "everyone, since
the start" nearly every time. Legacies and the queue carry the weight instead.

**Three beats rather than one page** — the years, then what they were left with, then the
rule that is different now — at 450, 1000 and 1550 ms, all instant under reduce motion. Every
beat is in the DOM from the start and only its opacity waits, so the height never jumps
under someone who is reading. Checked at 360x640, 412x732 and 390x844: the panel does not
scroll and the button stays on screen.

**A config value that can never fire.** The entry repeats the rule that the band locks past
era 3. It does not: `advanceEra` ends the run in a finale when `era >= eraCount`, so era
never exceeds 3 and `era > bandLockAfterEra` is never true — 0 times in 11,762 crossings. The
value is kept, because it is the rule for a longer game, and now says so where it is defined.

**And the phase turned up a shipped contrast bug that phase 21 missed.** The primary button
was `#fff` on `var(--accent)`: **4.23:1 on the Decay accent and 1.76:1 on the Ascent one**.
Phase 21 audited twelve screens and none of them put a primary button on a deep palette — the
button lives in overlay panels, which sit outside the frame and take the light tokens. The
era jump and **the ending screen** are inside the frame and take the path's. An `--on-accent`
token fixes both, and the sponsor bar's hardcoded ink now reads from the same token. The
ending screen is where this was worst: it is the last thing every run shows.

Re-audited after the fix: 0 failing text styles on the era jump under all three looks, on the
ending screen under both deep looks, and across all twelve of phase 21's screens.

<details>
<summary>Original entry</summary>

**Evidence.** An era boundary is the largest structural event in a run: a successor takes
office, the band is recomputed and past era 3 it locks, the era passive changes, the deck's
era filter moves. It is presented as **a dialog with a kicker, a heading and two lines of
text**, and it is the only place the game stops.

**Do.** Make the jump a jump. The frame already has a look; the transition should be where it
changes rather than a modal in front of it. What the country was left carrying at the
boundary is known (`legacies`, the queue, the cabinet's tenure) and none of it is shown.

**Done when** the boundary reads as time passing rather than as a dialog, and it says what
carried over.

</details>

## Phase 26. Forty runs, four endings — *done, with the done-when rewritten*

**Shipped.** A bug that made a third of the arc catalogue effectively unreachable. **Not**
the done-when, which the measurement showed to be unreachable for a reason the entry did not
know about, and which is restated below.

### The done-when could not be met, and the reason is the design rather than a number

**97.2% of a competent player's runs end in a finale**, and the three finales are the only
endings that are not failures. Over 200 simulated players of 40 runs each, carrying meta
forward the way a real profile does:

| bot | endings seen after 20 runs | after 40 | reached 10 by run 20 | finale rate |
|---|---|---|---|---|
| **mixed** (competent) | **median 3** | 4 | **0.0%** | 96.8% |
| greedy | 2 | 2 | 0.0% | ~99% |
| random | **10** | 13 | 65.5% | ~9% |

The random bot sees ten endings because it fails constantly — bankruptcy 24%, paralysis 15%,
police state 9%. **"Ten endings in twenty runs" is a request to fail ten different ways in
twenty runs.** That is a different game, not a tuning target.

**A competent player has already seen everything winning can show them.** The epilogue is
keyed `band:align:era`, and a run that survives all three eras has era 3, so competent play
can reach 3 of 23 endings and 6 of 18 epilogues. It reaches a median of 3 and 6 after twenty
runs. The other 12 epilogues are behind ending early.

**The Do clause's premise was also empty.** It proposes building on what the codex knows you
came close to. Measured: for a competent player, seen-or-nearly-reached is a **median of 4
against 3 seen** — the near-miss list knows about one extra ending in twenty runs, because
`nearMisses` measures how close a finished run came to an ouster and a competent run never
goes near one.

### What the phase did turn up, and what shipped

**Five of the endings a competent player never reaches are not failures at all** —
`stepped_down`, `leader_for_life`, `exile`, `purge_consumed`, `blackmailed` are arc endings.
So the question became whether ordinary play reaches the arcs that carry them, and it does
not, for a reason that is a plain bug.

**The arc budget counted arcs ever started, not arcs still running.** A finished arc keeps
its entry in `activeArcs` with a null pointer, and `drawArcEntry` counted it against the
budget for the rest of the run. A run enters about five arcs against a budget of 4-6, so
**the budget was saturated on 98.4% of runs**, and an arc that can only start in era 2
arrived to find every slot held by an era-1 arc that had already ended.

The evidence is in the entry rates at equal weight. `arc_water` (weight 2, eras 1-3) was
entered in 39.0% of runs; `arc_succession` (weight 2, eras 2-3) in **3.3%**.

| arc | before | after | carries |
|---|---|---|---|
| `arc_truth` | 5.8% | **34.9%** | — |
| `arc_oracle` | 3.2% | **26.2%** | — |
| `arc_succession` | 3.3% | **25.9%** | `stepped_down` |
| `arc_secession` | 3.0% | **18.0%** | `exile` |
| `arc_split` | 1.5% | **14.9%** | — |
| `arc_dynasty` | 1.1% | **12.2%** | — |
| `arc_commune` | 1.1% | **7.5%** | — |
| `arc_referendum` (was hogging a slot) | 50.8% | 48.8% | — |

**Counting only running arcs took a run from 5.0 arcs to 14.0**, which is a different game
and cost six points of Ascent, so `arcEntryProb` came down from 0.2 to 0.075. A run enters
6.3 arcs now. **Every section 8 target passes at 20,000 runs**, but Ascent passes narrowly:
**15.1% against a 15% floor, down from 15.8%**, which is about one standard error of
headroom. That is the price of the fix and it is worth saying out loud.

**A measure of mine that was measuring the wrong thing.** I first read "1.7 of 3 cards seen"
as arcs being abandoned. Measured properly — an arc concluded when the run left it with no
pointer onward — **98.3% of entered arcs conclude**. Branches are legitimately shorter than
the arc's card list. `arcContinueProb` needed no change.

**And the fix does not move "endings seen", which is the last thing worth knowing.** After it,
the mixed bot still sees a median of 3 endings in 20 runs. `arc_succession` is entered in
25.9% of runs and reaches its ending card in 43.4% of those — and the bot does not take the
branch, because handing over power costs meters. **The final step is a choice a player makes
and a meter-maximising bot never will**, so no amount of content reachability moves this
metric. A bot measures the bot.

### The done-when, restated

The old one asked for an outcome only a worse player can produce. What is actually checkable:

> **Done when** the arcs that carry endings are entered at a rate comparable to the arcs that
> do not, so that reaching one is a choice the player is offered rather than a draw they
> almost never get.

Met: the spread across the catalogue is 7.5-48.8%, against 1.1-50.8% before, and every arc
gated to era 2 or later moved from under 6% to between 7.5% and 26%.

<details>
<summary>Original entry</summary>

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

</details>

## Phase 27. The ending two runs in three get — *done*

**Shipped.** The endings you reach by surviving now carry a record of what the run did, and
two muddle finales from different runs read the same **0.07%** of the time instead of 50%.

**It drew two texts, not the six the entry assumed.** The epilogue is keyed
`band:align:era`, and a run that survives all three eras always has era 3 — so a player who
finishes ten runs as the Commons reads `muddle:left:3` ten times. Measured over 1,925 muddle
finales: `muddle:left:3` 51%, `muddle:right:3` 49%, and nothing else.

**The material to tell them apart was already in the state and unused.** Over the same runs:

| | spread |
|---|---|
| legacies carried | 3 to 9 (2%, 11%, 24%, 29%, 20%, 11%, 3%) |
| advisors let go | 0 in 40%, 1 in 44%, 2 in 14% |
| people still in the room from day one | 7 in 14%, 8 in 43%, 9 in 42% |
| elections won honestly | 0 in 24%, 1 in 48%, 2 in 25% |
| elections counted twice | 1 in 26%, 2 in 48%, 3 in 24% |

**67.9% of muddle finales already had a combination of facts no other run in the sweep had.**
The screen just never read them.

**So the record is assembled, not written.** Three lines and a list, between the ending and
the epilogue — the ending says how it stopped, the record says what you did with it, the
epilogue says where it went without you:

> **What you did with it**
> You won one vote honestly and counted 2 others twice.
> You let one of the cabinet go; 8 of the people who started with you were still in the room.
> The country is still carrying 6 things you did to it.

| ending | runs | distinct readings, before → after | two runs read the same |
|---|---|---|---|
| **`finale_muddle`** | 1,925 | **2 → 1,419** | **50.0% → 0.07%** |
| `finale_decay` | 492 | 2 → 444 | 50.3% → 0.05% |
| `finale_ascent` | 478 | 2 → 411 | 51.4% → 0.10% |

**All three finales, not just the muddle one.** The entry scoped it to the majority ending
because that is the one a player reads most, but it is the same code and the same
justification, and it takes 97% of a competent player's endings from two readings to
hundreds rather than 64%. An ouster gets no record: "The Streets Decide" does not want a
tally of your elections underneath it.

**Every count is in the string rather than concatenated onto it**, because "You won 1 votes
honestly and counted 1 others twice" is how this goes wrong — and the first draft did exactly
that, saying "counted 2 of them twice" when only three votes had been held at all.

**The record caught a lie the game had been telling.** `obj_honest_election` is titled "Won
without counting twice" and checks `electionsHonest >= 1` — nothing about cheating. A run
that cheated twice and won once honestly earned it, and now the record sits on the same
screen saying it counted two others twice. Retitled "A clean win", which is what the check
tests.

**And a stale selector from phase 25 that only failed now.** The era boundary stopped being
an `.overlay` in phase 25; a test loop that dismisses blockers still looked for one, and kept
passing because that run never reached a boundary. Phase 26's arc change made it reach one,
and the test hung. Fixed to dismiss either — and worth remembering that a test passing after
a refactor is not evidence that it still tests what it says.

<details>
<summary>Original entry</summary>

**Evidence.** **`finale_muddle` is 64.5% of a competent player's endings.** It draws from six
epilogues (band × side × era), so a player who finishes ten runs reads the same ending card
six or seven times and one of six epilogues under it. The Decay and Ascent finales are 15.9%
and 15.6%.

**Do.** The muddle finale is the honest majority outcome and should stay the majority
outcome; it should not be the same card every time. It is the one ending that can afford to
be written from what the run actually did — how many promises were kept, what the country is
still carrying, who was still in the room — because it is the one the player will read most.

**Done when** two muddle finales from different runs do not read as the same ending.

</details>
