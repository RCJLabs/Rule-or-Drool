# Backlog, round eight

Round seven (BACKLOG-7.md) is phases 45–48, all done, with follow-ups in v0.59.1. BACKLOG-2's
phase 17, getting the game onto Play, is still prepared and waiting on decisions only the
owner can make.

This round comes from a fresh audit of the shipped game, which you asked for before the closed
test. Tuning on bots alone risks tuning for the wrong player, so the audit looked first for
what holds whichever player the game is for: what breaks, what is lost without a word, and
what a screen says that is not true.
- **It found no crash.**
- **The game cannot tell which deck anything was made on.** An update changes almost every
  run a shared code deals, and the screens still promise the same run.
- **Progress is lost silently when storage fails.**

These are phases 49–51.

Same rule as every round: each evidence line is measured against the shipped game, at v0.59.1,
not estimated. Where a number comes from a bot, the bot is named. Where it comes from reading
the code, the file and line are named.

Status: **doing** · **queued** · **done**

The audit, at v0.59.1 (1,577 cards, 44 stories, 16 questions, 77 endings, 657 history names).
"Curious" is round seven's curious player: the mixed bot, taking an ending it has not found a
quarter of the times one is offered.

| | |
|---|---|
| 40,000 runs: every bot, with nothing and with everything unlocked, three eras and five | **No crash.** No meter or drift out of range, no unknown ending. 5,788 of them were saved mid-run as the game saves them, then resumed; every one ended identically |
| The same 2,000 seeds, dealt on consecutive versions (mixed bot) | text only (v0.57.0 to v0.58.0): **100%** of runs identical. 22 stories (v0.58.0 to v0.59.0): **0.3%**, the rest parting at card 13 (median). 16 drift values (v0.59.0 to v0.59.1): 86.2% |
| What says which deck a thing was made on | **nothing a player carries.** Run saves, run codes, challenge links and the daily log carry no stamp. Playtest records carry the version, which the report lists and never checks |
| What the offer of a shared run says | "their promise, and the same deck", whatever the deck (`src/content/strings.ts:266`) |
| Storage writes that fail | **all fail silently.** The profile changes on screen first, so the session looks right and the next load has lost the run |
| The service worker's clean-up | deletes **every** cache on its origin but its own (`public/sw.js:29`). The origin, rcjlabs.github.io, is shared by every Pages site on the account |
| What the game keeps | profile 10.8 KB at 50 runs, 18.0 KB at 500. The run in progress: 7.9 KB, at most 12.1 KB in a long reign. A playtest record: up to 100 runs of about 15 KB |
| Checked for fit on a 360×640 phone | each side's 4 longest event cards and longest question. No story card (up to 148 characters), election card (133) or filled-in name card (150) is ever placed. All are shorter than the 160 checked |
| A 6×-slowed CPU, v0.56.1 against v0.59.1 on the same machine | first screen 657–673 ms against 703–715 ms. A card to the next: 431–445 ms against 419–432 ms |
| The download | 310 KB gzipped, 187 KB of it the content (175 KB at v0.56.1, built on the same machine) |
| Found by run 10 / 20 / 50: mixed bot (curious) | endings 5 / 6 / 7 (7 / 12 / 22) of 77. Story outcomes 46 / 72.5 / 108 (38 / 64 / 109) of 179. History names 10 / 19 / 43 of 657 |
| Cards you have edited, as git sees it | **none.** All 52 commits that touch the content are mine |
| Human play recorded | **none** |

## Three things this round has to get right

### 1. Only what holds for any player

The bots still disagree about the choice that moves drift most. In BACKLOG-7's audit the mixed
bot reached the Ascent in 19.2% of runs, and the same bot 39.4% when it never cheated a vote
it could win. Nobody knows yet which habit people have.
- So nothing here retunes the game, adds content or moves a target.
- Every phase is about what the game keeps, what it says and what it checks.

### 2. A deploy is a release

The Play app is a shell around the live site (BACKLOG-2 phase 17). Every push to main reaches
Play players, and testers, at their next reload, with no store release. The audit shows what
that means for anything shared. The 22 stories changed 99.7% of the runs a code deals, and 16
drift values changed 13.8%, and nothing told the player.

### 3. The rules hold

- No card scores a policy. The country stays fictional, with no real slogans.
- The game stays a binary swiper, and drift stays hidden.
- The four topics you left off stay off.
- **Nothing in this round changes what a seed deals.** A code made today deals the same run
  after every phase here.

## Decisions for you

The defaults below are in force unless you change them.

1. **The closed test, as the first human playtest** (from BACKLOG-7).
   - **Only you can** open the account, find 12 testers for 14 days, and make the calls
     `twa/STORE.md` lists.
   - **Default:** as soon as you can.
2. **Hold the deck still during the closed test.**
   - **Why it matters.** A content push in the middle of the test changes the runs the
     testers play from then on: 99.7% of them when the 22 stories arrived. Their dailies and
     challenges stop matching one another. Their records split across decks the report cannot
     rebuild together.
   - **The choice:** (a) for the 14 days, ship only what keeps the deck: text, screens and
     fixes; (b) ship as usual.
   - **Default:** (a). Phase 49's stamp makes it checkable: a deploy that moves the stamp is
     a deck change.
3. **The game's own origin.**
   - **Today** the game lives at rcjlabs.github.io/Rule-or-Drool/. Its storage, the storage
     quota and the offline caches belong to rcjlabs.github.io, which it shares with any other
     Pages site on the account.
     - Another site there that calls `localStorage.clear()` clears the game's progress too.
       Speculation: whether any of your sites does.
     - Digital Asset Links must be served from that origin's root, which belongs to another
       repository. That is phase 17's open blocker.
   - **The choice:**
     - (a) A custom domain for the game, before launch. It gets its own origin, and the asset
       links live in this repository.
     - (b) Stay, with phase 50's cache fix, and put the asset links in the rcjlabs.github.io
       repository.
   - **The cost of (a).** Progress kept by today's web players stays on the old origin, unless
     they carry it over with Move my progress (BACKLOG-5 phase 33). So (a) is cheapest before
     launch, while there is least progress to move.
   - **Default:** (b), until you choose. Only you can buy a domain.
4. **Which player the balance is for** (BACKLOG-7's decision 3). Still the mixed bot, until
   the closed test shows how people vote.

## Recommended order

- **50's cache fix first, on its own.** It is one condition in the service worker, and it
  stops the game deleting other sites' caches.
- **49 before the closed test starts,** so every tester's link, daily and record carries its
  deck.
- **The rest of 50, and 51,** in either order.

Taken together: no new cards, no balance change, and no change to what any seed deals. Each
phase stands on its own, so the round can stop after any of them.

---

## Phase 49. A run knows its deck — *queued*

**Why.**
- **An update changes almost every run, and nothing says so.** The same 2,000 seeds were dealt
  by the mixed bot on consecutive versions:

| Update | Runs identical | Where the rest part (quartiles) | Same ending |
|---|---|---|---|
| v0.57.0 to v0.58.0, text only | 100% | – | 100% |
| v0.58.0 to v0.59.0, 22 stories | 0.3% | card 5 / 13 / 27 | 46.7% |
| v0.59.0 to v0.59.1, 16 drift values | 86.2% | card 62 / 75 / 92 | 95.3% |

- **Nothing records the deck:**
  - **Run codes** carry a format digit (`src/meta/runcode.ts:42-43`). A code is refused only
    when it names a modifier, unlock or promise this build lacks (`:70-80`).
  - **Challenge links** carry the sender's result, in format "1" (`src/meta/challenge.ts:34`).
  - **The run save's version** tracks its layout, not the deck (`src/version.ts:6-7`).
  - **A daily log entry** is a day, a history, an ending and a card count (`DailyEntry` in
    `src/meta/types.ts`).
  - **Playtest records** carry the version (`src/playtest/record.ts:57`). The report prints
    the versions and never compares them (`src/playtest/report.ts:347`, `:399`).
- **So after an update the game says things that are not true:**
  - **A shared run.** The offer says "the same deck" (`src/content/strings.ts:266`), then deals
    another run.
  - **A run continued across an update** plays on under the new deck, silently
    (`src/ui/useGame.ts:248`). At its end "Choose … instead" is not offered, with no reason
    given, because the run no longer replays (`src/ui/Ending.tsx:68`).
  - **A challenge across versions** still shows its verdict and comparison. The only sign is a
    note that the sender's run "was played on another version of the game"
    (`src/ui/Ending.tsx:358`). The note appears whenever the replay fails, for any reason.
  - **The daily.** On update day, players on the two versions get different runs under the
    same number.
  - **The playtest report** rebuilds a record on whatever deck it runs on. Outside votes and
    looks it mixes decks, and relies on whoever runs it to check out the version the records
    name (`twa/STORE.md:251`).
- **A save that names a card this build lacks blanks the page.** `getCard` throws
  (`src/engine/library.ts:105`), and nothing in the app catches it: there is no error boundary
  in `src/`. The save is kept, so every Continue does it again. Card ids have changed before:
  v0.54.0 renamed a question card.
- **It was planned.** BACKLOG-2 wrote that a code reproduces a run only on the same build, and
  that "a later format can add a build stamp to warn with" (BACKLOG-2.md:265-267). It was
  never added.

**What.**
- **A deck stamp.** A short hash of everything that decides what is dealt and how a choice
  lands:
  - the cards' conditions, weights, effects, drift and links;
  - the stories and the questions;
  - the modifiers and the advisors;
  - the engine's config.

  Text is left out, so a voice pass keeps every code, as v0.58.0 kept every run.
- **Everything shared or kept carries it:** new run codes and challenge links (a new format
  digit, while old codes still decode), the run save, daily log entries and playtest records.
- **What the player is told:**
  - **The offer** says "the same deck" only when the stamps match. Otherwise it says, before
    the run starts, that this version deals a different run. A link with no stamp says it may.
  - **A challenge from another deck** shows the two results side by side, with no verdict
    built from two decks.
  - **Continuing a run saved on another deck** says that the game was updated during it. The
    end screen says why the other road is not offered.
  - **A save or link naming a card, story or modifier this build lacks** is refused with a
    sentence and a way to start fresh, never a blank page.
- **The playtest report** groups records by stamp and rebuilds each only on a matching deck.
  The records it cannot rebuild are counted, and left out of every table, not only votes and
  looks.

**Targets.**
- A text-only change keeps the stamp. A change to anything dealt or scored moves it. Both are
  tested.
- No screen says "the same deck" unless the stamps match.
- Every code made before this phase still decodes, and deals exactly what it dealt before.
- No save or link, however old, leaves a blank page.

**The limit.** A link made before this phase carries no stamp, so it cannot be told apart. It
gets the careful wording, not the certain one.

**Cost.** Medium: a hash, new formats for four things with their migrations, four sentences,
and tests. About the size of phase 37.

---

## Phase 50. Nothing lost without a word — *queued*

**Why.**
- **Every storage write fails silently.** Each save is a `try` with an empty `catch`: the
  profile (`src/meta/save.ts:92-95`), the run (`src/ui/save.ts:38-42`), the settings
  (`src/ui/settings.ts:96`) and the playtest record (`src/ui/playtest.ts:45`). Nothing checks
  for a full store, and no test makes a write fail.
- **The profile changes on screen first.** A finished run is folded into the profile the
  screen shows, then saved (`src/ui/useGame.ts:256-263`). If the save fails, the session shows
  the new ending, unlock and objective. The next load has lost them, and that day's daily
  with its streak.
- **An unreadable profile is written over.** A profile that fails to parse, or comes from a
  newer version, loads as empty (`src/meta/save.ts:16`, `:80-88`). The next finished run then
  saves a fresh profile over it.
- **The storage is best-effort.** The game never asks the browser to keep it: there is no
  `navigator.storage.persist()` in `src/`. So the browser may clear it under storage pressure.
- **The service worker deletes other sites' caches.** On activating, it deletes every cache
  but its own (`public/sw.js:29`).
  - The origin, rcjlabs.github.io, belongs to every Pages site on the account. So each new
    version of this game deletes their offline copies.
  - Any of them that cleans up the same way deletes this game's.
- **Nothing catches a screen that throws.** There is no error boundary in `src/`, so an
  exception while drawing leaves a blank page.
- **Size is not the problem.** A profile is 18.0 KB after 500 runs, and a run save at most
  12.1 KB. Only a full playtest record is large: about 1.5 MB at its cap of 100 runs, more if
  many are long reigns.

**What.**
- **The service worker deletes only its own old caches,** the ones named `rod-v…`.
- **The game asks to be kept** (`navigator.storage.persist()`) once there is progress to
  lose: after the first finished run. Whether a browser grants it is the browser's call.
- **A failed save says so, once.** It offers the way out that already exists: Move my
  progress (BACKLOG-5 phase 33), which gives the profile as a code, a file or a link.
- **An unreadable profile is set aside, not written over.** It is kept under a key of its
  own, and Move my progress can still hand it on.
- **An error boundary.** A screen that throws shows a sentence and a way back to the menu,
  and a run that cannot be drawn can be put aside.
- **Tests with a storage that throws,** for every write.

**Targets.**
- No write fails without the player being told, once.
- No stored profile is written over by an empty one.
- The service worker never deletes a cache it did not make.
- No exception leaves a blank page.

**Cost.** Small to medium. The service-worker condition can ship on its own, today.

---

## Phase 51. The fit check sees every kind of card — *queued*

**Why.**
- **The small-phone fit check places event cards only.** It places each side's 4 longest
  event cards and its longest question, at 360×640 with the buttons drawn, in all seven looks
  (`tests/browser/screens.test.ts:525-531`). Everywhere else, fit is checked only on the cards
  the fixed seed deals.
- **Never placed:**
  - the 135 story cards, the longest 148 characters;
  - the 14 election cards, the longest 133;
  - the 69 cards that carry a name, the longest 150 once filled with the longest adviser's
    name, "Perpetua Mordaunt".
- **Nothing is broken today.** All of them are shorter than the 160-character cards the check
  places, and only a question draws a title line. The gap is for the next story written long.

**What.**
- Place each side's longest story card and election card too, and the longest name card
  filled with the longest name.
- A unit check that no filled-in card runs past the longest card the browser check places.

**Targets.** Every kind of card has its longest on the table at 360×640, in all seven looks.

**Cost.** Small: two selections in one test, and a unit check.

---

## Considered, and not proposed

- **The codex's long tail** (bot measures). By run 50 a curious player has found 22 of 77
  endings and 43 of 657 history names. The mixed bot has found 7 endings, because it never
  takes one by choice. Whether people collect, and read the codex, is for the closed test.
- **The seven objectives most players have not done by run 50.** They are the same seven as
  in round seven, each asking for something done on purpose.
- **Delayed consequences in the long reign.** In eras 4 and 5, 4.7 cards a long run arrive
  off the queue, written for eras 1–3. They are the generic bills that come due ("There is a
  second set of figures", "The auditor has written a note"), and they read true two centuries
  on.
- **Keeping old decks,** so that an old code deals the run it dealt. Every deploy would ship
  every deck it ever had. Phase 49's stamp tells the player instead.
- **Speed.** On the same machine, the first screen is 7% slower than at v0.56.1, and the
  content file grew 12 KB gzipped. A card to the next is unchanged.
- **More cards, retuning, and the election card saying how the vote stands.** All still wait
  on the closed test, as in BACKLOG-7.
- **The four topics you left off.** They are still off.
