# Backlog, round two

Round one (BACKLOG.md) is done: ten items, all shipped and measured. This is the next ten,
numbered as phases 8–17 so they continue ROADMAP.md's seven build phases rather than
restarting a count. Same rule as before: every "evidence" line is measured against the
shipped content, not estimated.

Status: **doing** · **queued** · **done**

The measurements these were drawn from, taken at v0.17.0 (440 cards, 22 arcs, 23 endings):

| | |
|---|---|
| A run shows | 103 cards, 92 distinct, 21% of the deck |
| Two runs on the same side share | 46% of cards |
| A left run and a right run share | 28% |
| Choices that move the coalition as one block | **414 of 628 (66%)** |
| Choices that do anything beyond meters and drift | 88 of 628 (14%) |
| Endings a competent player reaches in 200 runs | 8 of 23 |
| Audio, haptics, onboarding | none |

---

## Phase 8. Finish the coalition — *queued*

**The path-distinction one.** Item 5 split Mood into three blocs and item 2 pulled a left run
and a right run apart to sharing 28% of their cards. But the split only went as deep as the
cards that were rewritten for it: **414 of 628 choices (66%) still use the `mood` shorthand**,
which moves all three blocs together. Only 19 choices name a single bloc. Across the whole
deck `mood` is touched 1,242 times against `backers`' 18.

So within a side the coalition is still one object. The Commons' Unions and the Ledger's
Donors are named differently and behave identically, and a player has no reason to think of
them as three groups with different interests. Measured over 2,000 runs the coalition drifts
apart by a mean of 21.9 points, which is most of the way to "they move together".

**Do.** Convert the shorthand deck side by side, so an ordinary card pleases one bloc at
another's expense rather than moving the lot. Give each bloc its own failure warning: a bloc
under 25 enqueues a card in its own voice, so you learn *who* is leaving before they leave.
Then make the meter bar say which bloc is angry rather than only how low it is.

**Done when** under a quarter of choices use the shorthand, the mean coalition spread is
above 35 points, and a run can be lost to one bloc walking out while the other two are
content.

## Phase 9. Sound, haptics and feel — *queued*

**Evidence.** There is no audio in the project at all, and no haptics. A card swiper is a
physical toy; this one is silent and the card lands with no report.

**Do.** Synthesized audio through WebAudio rather than asset files, so the PWA stays small
and offline-first: a card thud, a meter tick, a different note for each of the six meters
crossing a danger line, a low tone when an arc opens. `navigator.vibrate` on commit, where it
exists. All of it behind the settings already built, and silent by default until the player
turns it on.

**Done when** a run has a sound signature for its own failure modes, the bundle grows by
under 10 KB, and the settings menu can mute it.

## Phase 10. Teach the game without a manual — *queued*

**Evidence.** The whole tutorial is one line: "Drag the card left or right." Nothing explains
that drift is hidden, that the coalition is three groups, that consequences arrive twenty
cards later, or that the frame's mood *is* the trajectory meter. A first-time player learns
the delayed-consequence premise by losing to it without knowing why.

**Do.** A first-run sequence that teaches by playing rather than by telling: the first
delayed consequence is pointed at when it lands ("this is the bridge you did not fix"), the
first bloc to drop below 40 is named, the first era jump says what changed. Seen-once flags
in the settings store, and a replayable "how this works" from the menu.

**Done when** a new player can say, unprompted, why they lost.

## Phase 11. Make a run worth showing someone — *queued*

**Evidence.** The codex now keeps twelve administrations (item 10), but a run cannot leave
the device. This genre lives on "look what happened to me", and there is no way to do that.

**Do.** An end-of-run share: a compact text summary (side, length, ending, what the country
was left with, the seed) and a rendered image card for the same. Seed sharing so two people
can play the same run and compare, which the daily seed already proves the engine supports.

**Done when** a finished run produces something you would actually paste into a group chat,
and pasting its seed reproduces the run exactly.

## Phase 12. The cabinet as a screen you can read — *queued*

**Evidence.** 22 advisors across 9 roles carry four traits that silently scale the effects of
their own cards — competent halves what a card costs you, zealot amplifies it both ways. The
player is never shown any of this. A mechanic that changes every number on a card is
invisible.

**Do.** A cabinet screen: who holds each role, what their trait does in plain words, how long
they have served, and who you fired to get them. Show the trait's effect on the card preview
so the scaling is legible at the moment it matters.

**Done when** firing someone is a decision with a visible reason rather than a coin flip.

## Phase 13. Endings you can aim at — *queued*

**Evidence.** A competent player reaches **8 of 23 endings in 200 runs**. Fifteen are never
seen, because most require losing in a particular way and nothing tells you you are close to
one. Item 9 took the unlock gates off ending-collection for exactly this reason; the endings
themselves are still mostly unreachable on purpose.

**Do.** Telegraph the near-miss. When a meter is inside ten points of an ending, let the deck
say so in its own voice — the cards that fire at the edge should name what is coming. Add a
codex hint per undiscovered ending once you have been close to it once, the way the near-miss
itself is the clue.

**Done when** a player who wants a specific ending can steer toward it, and a competent
player sees 15 of 23 in 200 runs without playing badly on purpose.

## Phase 14. Choices that do more than move meters — *queued*

**Evidence.** **88 of 628 choices (14%) do anything beyond changing meters and drift.** The
other 86% are a number and a mood. Every mechanism the engine has — flags, the delayed queue,
branches, firing someone, the rival — is concentrated in arcs and a handful of set pieces.

**Do.** Spread them through the ordinary deck. An ordinary card should sometimes remember
what you did, sometimes send you a bill later, sometimes cost you the person who suggested
it. Not all of them: the target is that a run's ordinary cards feel like they are keeping
score, which they currently do not.

**Done when** a third of choices do something durable, and a run's flag count at the end is
at least double what it is now.

## Phase 15. Advisors with something at stake — *queued*

**Evidence.** Two advisors per role, drawn at random, never replaced unless a card fires
them, and they have no story. The rival became a person in item 7; the eight people you
actually work with did not.

**Do.** Give each advisor a line of their own that fires once — what they want from the job —
and a reaction when you contradict them. Let a loyal advisor who survives three eras earn
something; let a corrupt one you kept become a card you did not want. Reuse the arc machinery
rather than adding a system.

**Done when** the cabinet is a set of relationships rather than a set of multipliers.

## Phase 16. Mandates: pick your own constraint — *queued*

**Evidence.** Run setup rolls a crisis, a trait and a flaw, and item 4 gave those a side. The
player chooses nothing except which party they lead. There is no way to set yourself a
challenge, and the objectives that reward restraint (`obj_saint`, `obj_stepped_down`) are the
three a competent player never completes.

**Do.** Optional mandates chosen at setup: never cheat a vote, keep every bloc above 40,
finish without firing anyone, govern with elections abolished from day one. Each visible in
the run, each recorded in the codex history, each a modifier on what the run is worth.

**Done when** a player can set themselves the run they want and the codex remembers they did
it.

## Phase 17. Get it onto Play — *queued*

**Evidence.** `twa/` holds a Bubblewrap config and a README listing two blockers written up
rather than guessed: Digital Asset Links must be served from the origin root, which belongs
to a different repository, and the Play policy check could not be run because the policy
pages are unreachable from the build sandbox. Both have been outstanding since phase 7.

**Do.** Resolve the asset-links origin, run the policy review against a satirical game with
fictional politics, produce the store listing, and ship a signed build. The web half has been
installable and offline-capable since phase 7; this is the half that is not code.

**Done when** the game is installable from Play and the TWA passes its own asset-links check.
