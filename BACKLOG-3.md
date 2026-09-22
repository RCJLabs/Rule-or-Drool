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

## Phase 18. The two paths, and how little of them you see — *doing*

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
*designed to be ugly*, which is a different thing. **Five treatments are mocked up for each
path** (`docs/mockups/paths.html`); one of each gets built.

**Done when** a run that steers one way spends at least a quarter of its cards in that
path's look with the deepest stage reachable by playing that way rather than by an outlier,
and the two looks are distinguishable on a phone at arm's length with the text unread.

## Phase 19. The bill you cannot see coming — *queued*

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

## Phase 20. Cards nobody draws, and cards you draw twice — *queued*

**Evidence.** **40 of 526 cards were never drawn in 400 unlocked runs.** Eight of those are
mandate cards, which only appear under a promise, so 32 are ordinary cards nobody will ever
see. They cluster: seven in `l2*`, seven in `r2*`, five in `a4*`. At the same time the same
card comes up **9.0 times per run** — roughly one card in eleven is a repeat.

**Do.** Find out which filter is starving them (era, band, cooldown, align, a `cond` nothing
satisfies) rather than guessing, and fix the cause. The validator already reports thin cells;
it does not report a card that is technically reachable and practically never reached.

**Done when** no card is unreachable in 400 runs, repeats are under 4 a run, and the
validator warns about practical unreachability so this cannot come back quietly.

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
