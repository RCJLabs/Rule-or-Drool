# Rule or Drool on Google Play: the listing

Everything here was made from the shipped game and can be pasted or uploaded as it is. What
this repository cannot settle is at the end, under **Yours to decide**, each with the steps
that follow from it.

## Store listing

| Field | Text | Length |
|---|---|---|
| App name | Rule or Drool | 13 / 30 |
| Short description | Swipe to govern. The easy choice now is the ruinous choice later. | 65 / 80 |

**Full description** (2,237 / 4,000 characters). Every number in it was checked
against the content when written: 1,577 cards, 44 stories and 16 questions, 30 advisors, 77
endings, 657 history names. Re-check them if the content changes.

```
You have taken office. Your advisors bring you one decision at a time: swipe left or right, and try to keep the country, your coalition and yourself in one piece for three eras.

The catch: the easy choice now is the ruinous choice later. The bridge you did not fix, the audit you buried, the election you counted twice all come back, twenty cards on, when you have forgotten them and the country has not.

HOW IT PLAYS
• Six meters: the three blocs of your coalition, and the money, order and institutions of the state. Lose a bloc, or let the state run to either extreme, and your rule ends.
• The country is heading somewhere, and nothing tells you where. The screen does: it frays into a livestream on the way down and polishes itself on the way up.
• Sixteen questions every country argues about, asked plainly: go to war for an ally, deport everyone without papers, cut the top rate, raise the minimum wage, control the rents, price carbon, bail out the banks. Your answer decides who is pleased and who pays. How you carry it out decides where the country goes, and the answer comes back in the eras after.
• 1,577 cards, 44 stories that play out over several cards, and 30 advisors whose traits change what their advice costs you.
• Elections you can win honestly, or not, and a record of which.

EVERY RUN IS ITS OWN
• 55 ways for a rule to end, many of them yours to choose, and 585 names history can give it, from what you did and where it took the country.
• At the end, a picture of the world you left: spires and a ring in the sky, or tanks in the square and a drained bay.
• Two parties to lead, the Commons and the Ledger, each with a coalition of its own.
• Mandates: promises you make at the start, at a price.
• A daily run that is the same run for everyone.
• Share a run: send the link, and a friend starts the very run you played.

PLAYS THE WAY YOU NEED IT TO
• Works offline. No account, no ads, no tracking: your progress stays on your phone.
• A plain-screen setting that keeps every look easy to read, reduced motion, and sound and vibration you can turn off.

A work of satire. The country, its parties and its people are invented, and the game is not affiliated with any real party, politician or government.
```

**Category:** Games › Card or Games › Simulation. I have not checked where comparable
games sit, so look at the ones you want it listed beside. **Tags:** satire, politics, card
game, strategy, choices matter.

## Graphics

`npm run build && npm run store:assets` makes all of these from the built game into
`twa/store/`, in about ten seconds. Run it again whenever the screens change.

| File | Size | What it shows |
|---|---|---|
| `icon-512.png` | 512×512, 32-bit PNG | The site icon, re-encoded with the alpha channel the console asks for |
| `feature-graphic.jpg` | 1024×500, JPEG | The same city both ways, Ascent and Decay, drawn by the end screen's own renderer |
| `01-card.jpg` | 1080×1920, JPEG | A card, in the neutral look |
| `02-decay.jpg` | 1080×1920 | The same card in deep Decay: the screen has become a livestream |
| `03-ascent.jpg` | 1080×1920 | The Ledger in deep Ascent |
| `04-twenty-years-on.jpg` | 1080×1920 | An era boundary: what the country was left with, and what is still owed |
| `05-end-ascent.jpg` | 1080×1920 | The end of a run that went up: the world left behind, and its name |
| `06-end-decay.jpg` | 1080×1920 | The end of a run that went down |
| `07-codex.jpg` | 1080×1920 | The codex of a profile thirty runs in |
| `08-menu.jpg` | 1080×1920 | The start of a run: a side, a setup, a promise |

The screenshots are a 360×640 phone at three device pixels per CSS pixel, in Roboto, the
font Android draws the game in. It is the copy the browser audits measure in
(`tests/browser/fonts/`), since this machine's default is a fifth wider. The profile in `07`
and `08` was played, not written: thirty runs of the mixed bot folded in by the game's own
code.

Every meter name is whole in these, as of v0.44.0 (BACKLOG-5 phase 32). The earlier shots
cut "THE MON…" and "Institutio…" short. The audit now fails any name cut short at 360px.

## Data safety form

Measured, not assumed: the game makes no network request except the service worker
fetching the game's own files from its own origin. There is no analytics, no advertising
SDK and no third-party URL anywhere in the source. Everything it stores is in `localStorage`
on the phone: `rod.run`, `rod.meta`, `rod.settings` and `rod.hintSeen`, plus `rod.playtest`
and `rod.playtest.open` once a player turns on the playtest record (v0.43.0). Since v0.61.0,
`rod.meta.aside` holds a profile the game could not read, kept on the phone rather than
written over (BACKLOG-8 phase 50). The game also asks the browser to keep its storage when
a run ends (`navigator.storage.persist()`), which sends nothing anywhere.

- **Does the app collect or share any of the required user data types?** No.
- **Is all user data encrypted in transit?** No user data is transmitted.
- **Can users request that data be deleted?** Nothing is held off the device. In the game,
  Settings › Erase all progress clears it, the playtest record and any profile set aside
  included, as does clearing the app's storage. Settings › Delete my record clears the
  record alone.
- **"Share this run"** sends a picture and a link through the system share sheet, only when
  the player presses it, to whoever they choose. Check the console's wording when you fill
  in the form; my understanding is that a transfer the user starts, and expects, is not
  "sharing" in its terms.
- **"Move my progress"** (v0.45.0) hands the player's own codex and settings to the share
  sheet as a file, or puts them on the clipboard as a code, only when pressed. It is the
  same kind of transfer as sharing a run: the player starts it and chooses where it goes.
- **"Send my record"** (BACKLOG-5 phase 31) is the one that needs a decision. It exists
  only once a player turns on *Keep a record of my runs*, which is off by default. Pressing
  it hands a plain-text file to the system share sheet, and the player picks where it
  goes. The file holds each recorded run's code and, for every card, the side taken, how
  long the card was up, how long each side's preview was up, and the meters either side of
  the choice. It holds no identifier, no date, no device detail and no setting. The format
  is `src/playtest/record.ts`. The game makes no request to send it anywhere.

  **Your call, and I could not settle it.** Google's guidance says an app *collects* data
  when it transmits it off the device. The exemption for transfers a user starts is
  written for *sharing* data with a third party. The game never transmits the record
  itself: an app the player picks from the share sheet does. But the feature exists so
  that the file reaches you. So there are two readings:
  - **No data collected.** This follows the letter: nothing leaves through the app, and
    the player starts and directs every transfer.
  - **App activity › App interactions: collected, optional, for analytics, not shared.**
    This is the cautious reading, because you are the intended recipient. It is optional
    because it is off unless turned on. The cost is one line on the listing.

  The Play Console help pages were blocked from the sandbox this was written in. The
  definitions above come from search results that quote them:
  [Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)
  and [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311).
  Read them before choosing.

## Content rating questionnaire (IARC)

These are notes to answer from, not answers. The 1,577 cards were searched for each theme the
questionnaire asks about:

- **Violence:** reported, not shown. Deaths are told in text ("forty thousand people
  died"), and there are riots, a coup, purges and a general "unleashed". Later cards add water
  cannon, a curfew, a law letting citizens defend their homes "with any force at all", armed
  militias (one with tanks), youth camps that teach shooting, and old munitions that children
  collect. The long reign's cards (v0.51.0) add two wars, one forgotten and one over a dry
  river, militias that run the ministries, and a neighbour with a missile. The questions
  (v0.52.0) add a war fought for an ally, told in text: a draft, a third year of fighting,
  towns that "have buried their dead", and our shells photographed on both sides of a trench.
  They also add deportation raids that take citizens by mistake, a patient who dies on a
  waiting list and a child who dies waiting for a transfer, all told in a sentence and none
  shown. The twelve questions of v0.53.0 add a police officer who breaks a boy's arm over a
  bus fare, a prison breakout, police sent to break strikes and clear a square of pensioners,
  and a building that collapses, empty. All are told in a sentence and none shown. The
  ordinary cards of v0.56.0 add a protection racket, debt bondage in company towns, police
  software that predicts crime by street, and an heir who cannot be tried after driving "at
  speed", told the same way. The stories of v0.59.0 add a train crash in which eleven people
  die, an earthquake that flattens three schools, a foreign agent in the leader's office, a
  flood the valley is moved out of, and an army paid in bread that takes the bakeries, told
  the same way. The pictures are flat silhouettes (tanks, a searchlight), with no blood and no
  injury.
- **Language:** no profanity found.
- **Sexual content:** none found.
- **Drugs, alcohol, tobacco:** medicine, several times: drug pricing, a drug made in orbit,
  a drug that adds ten years, antibiotics that stop working, a flu vaccine in short supply,
  and a treatment that keeps one official alive for centuries. One tobacco mention: cigarettes
  are one of three currencies in a lawless south. One card says the warmer north has become a
  vineyard. **Alcohol is referred to** since v0.56.0, never shown being drunk: a duty on plum
  brandy, a state vineyard whose wine is served at official dinners, and night buses that
  carry "cleaners, nurses and drunks". A card of the same batch has medicine sold at a market
  behind the station that is "sometimes, medicine". **Illegal drugs are referred to** since v0.53.0, as policy: a question
  asks whether to legalise and tax drugs or crack down on them, and its cards mention dealers,
  seized drugs resold by police, a cartel, and tobacco firms' packets turning up in school
  playgrounds. No drug is named and no one is shown or described taking one. The cards that
  follow each answer later in a run (v0.54.0) add more of the same kind: the drug squads
  turned into a dynasty that sells what it seized, and legal drug firms sponsoring the
  schools. The questionnaire asks about references to illegal drugs; answer it from this.
- **Gambling:** a national lottery appears as policy satire (its surplus, an evening draw,
  its results read out on a loyalty broadcast), and a casino asks for a licence. Since v0.56.0
  a party lottery's treasurer keeps winning it, and bookmakers go untaxed on a state race day.
  Since v0.59.0 a story has the national lottery rigged, its jackpot drawn before the tickets
  went on sale. There is no simulated gambling and nothing to buy.
- **User interaction:** none. The chat in the Decay look is scripted decoration.
- **Religion** is not a questionnaire theme, but in case a reviewer asks: a church appears
  as a landowner, a lobby and a school provider (tax exemptions, congregations turned out for
  a manifesto, a blasphemy law a town wants enforced, commandments for courtrooms). The long
  reign adds a religion that worships the power grid, a party turned church, and a cult of the
  room where votes were once counted. The jokes are at institutions and the politicians
  courting them, not at belief.
- **Politics:** throughout, and all fictional. The country, the parties (the Commons and the
  Ledger) and every person are invented. Since v0.52.0 some cards name real policies plainly:
  going to war for an ally, deporting everyone without papers, the top tax rate, universal
  health care, and since v0.53.0 the minimum wage, rent control, a carbon price, tariffs, the
  pension age, student debt, the drug laws, police and prisons, face recognition, a law against
  misinformation, adding seats to the highest court, and bailing out banks. Since v0.54.0
  each answer comes back in the eras after it, whichever party gave it. Each is asked of
  both parties, and the game does not score the answer, only
  how it is carried out. No real country, party, person, faith or slogan appears; a test
  (`tests/guardrails.test.ts`) searches everything the game can show for them.

## Yours to decide

### 1. Where the asset links file lives

Android checks `https://<host>/.well-known/assetlinks.json` at the root of the host, and
this project publishes under `/Rule-or-Drool/`, so its host's root is not ours to write to.
Without the check passing, the app runs with a browser address bar across the top.

- **Custom domain (recommended).** Point a domain at this Pages site. The site then
  moves to the domain's root, so:
  - change `base` in `vite.config.ts` from `/Rule-or-Drool/` to `/`, or every asset 404s;
  - add `public/.well-known/assetlinks.json` (Vite copies `public/` into the build as it
    is, dot-folders included);
  - set `host`, `startUrl`, `webManifestUrl` and both icon URLs in
    `twa/twa-manifest.json` to the new origin;
  - after the first deploy, check with `curl` that Pages serves the dot-folder.

  **The cost:** saves are stored per origin, so a web player's codex does not follow the
  game to a new domain by itself. Since v0.45.0 a player can take it with Settings › *Move
  my progress*, as a file, a code, or a link with the code in it. That only works while the
  old address still serves the game. Once Pages redirects the old address to the domain,
  whatever was stored there can no longer be reached. So before switching, ship a release
  that tells web players to move their progress, or keep the old address serving the game
  for a while. A link to the new domain with `#progress=` and the code opens there as an
  offer to bring the progress in, and it asks before replacing anything.
- **The user site.** Add the file to the `RCJLabs/rcjlabs.github.io` repository at
  `.well-known/assetlinks.json`. It works, but this game's release then depends on another
  repository.

Either way the file is `twa/assetlinks.template.json`, with the SHA-256 fingerprint of the
**app signing key**. With Play App Signing, which new apps use, that fingerprint is on the
console's App integrity page, under App signing, not the one in your local keystore.

### 2. The policy check

The sandbox that built this cannot reach Google's policy pages, so none of this is
confirmed. Read the current pages and settle:

- how political content and elections are treated for a game that is plainly satire with
  invented parties. The listing says so in its last paragraph;
- whether famine, pandemic and war cards could read as exploiting a current real event;
- the target API level. `twa/twa-manifest.json` was checked against Bubblewrap 1.25.0
  (released 31 July 2026), which targets API 36. Use that version or later.

### 3. Your developer account

If the account is a personal one created in or after November 2023, Play has required a
closed test with at least 12 testers opted in for 14 days in a row before production
access. That was the rule as I know it; check the console. It is the longest step here if it
applies, so it is worth starting first.

If the test is needed, it can also be the game's first measurement of people rather than
bots (BACKLOG-5 phase 31):
- Ask testers to turn on Settings › *Keep a record of my runs* before their first run.
  It is off by default, and it starts with the next run.
- At the end of the test, ask them to press *Send my record* and send you the file. It
  is plain text, so a tester can open it and see what it holds first.
- Put the files in `playtests/` and run `npm run playtests`. Git ignores that folder.
- The report sets people beside each bot playing the same runs. It also shows where the
  country ended up, how people voted, and the look each card was read in (BACKLOG-7 phase
  46). For votes it gives how many an honest count would have won, how many of those were
  cheated anyway, and whether a meter was near its edge at the time. That is the question
  BACKLOG-7's third decision waits on.
- Since v0.63.0 the election card says whether an honest count wins (BACKLOG-9 phase 53).
  Of the votes an honest count would win, the mixed bot cheats 55% and a player who takes
  the card at its word cheats none, so that column says which kind of player people are.
  Runs played before v0.63.0 are set beside runs played after it when a report has both.
- Since v0.64.0 the Ascent is balanced for that player, the informed bot in the report
  (BACKLOG-9 phase 54). Every table has a row for it, beside the mixed bot's.
- Since v0.65.0 the first honest vote a run loses sends it into opposition until the era
  ends, and a return vote decides whether it comes back (BACKLOG-10 phase 55). The report
  counts return votes with the others. The deck moved with it, so records from v0.64.0 and
  before are kept apart.
- Since v0.66.0 the two cards before each vote are a campaign, which says where the count
  stands and can move it (BACKLOG-10 phase 56). The bar an honest count must clear rose from
  44 to 46 with it. The deck moved again, so records from v0.65.0 and before are kept apart.
- Since v0.66.1 the report also sets people beside the eyes bot, which plays only from what
  the screen shows (BACKLOG-10 phase 57). It reaches the Ascent far more often than the
  informed bot, because it stays honest until the screen draws a meter in danger. Which of
  the two people play like is the question the test can answer, in the report's table of
  turns from the honest side: how often people take the other side with nothing drawn in
  danger, and how near an edge their nearest meter is when they do.
- Since v0.66.3 the codex gives a clue to one ending not yet found, a different one each run
  (BACKLOG-10 phase 58; v0.66.2 gave three). The records do not say whether anyone read it, so
  ask testers at the end whether a clue sent them after an ending. The deck did not move.
- Since v0.67.0 a new profile starts with a first term: the first era alone, ending at card 35
  (BACKLOG-10 phase 59). Testers' first runs will be first terms unless they choose three eras.
  The report sets them beside bots playing first terms on the same setups. The deck moved, so
  records from v0.66.x and before are kept apart.
- Since v0.68.0 there are three contracts a week (BACKLOG-10 phase 60), kept by full reigns. The
  records do not say whether a tester aimed at one, so ask them at the end. Their profile saves as
  v7, which v0.67.0 and before set aside rather than read.
- Do not tell testers how elections work beyond what the game tells them. The report is
  measuring how people vote on their own.
- The votes and looks are rebuilt from each run's code and sides, which works only on a
  version that deals the same cards. Every record since v0.60.0 names the deck it was dealt
  from, and the report uses only the runs dealt from its own deck, saying how many it left
  out and from which decks (BACKLOG-8 phase 49). If the deck changes during the test, run the
  report once on each version the testers played.
- Better: hold the deck still for the 14 days (BACKLOG-8's second decision). A deploy that
  changes the deck changes `src/content/deck.json`, so it shows in the diff before it ships.
- The menu's footer shows the version and the deck, as in "v0.60.0 · deck nqne4r3b". A tester
  reporting a problem can quote it.
- If the game shows "Something went wrong", its last line is the version and the error, the
  thing to quote. "Not saved" means the phone's storage refused a save: Move my progress,
  which the notice offers, keeps the tester's profile safe (BACKLOG-8 phase 50).

### 4. Build and upload

On a machine with a JDK and the Android SDK:

```
npm install -g @bubblewrap/cli
cp twa/twa-manifest.json ./twa-manifest.json   # after setting the host, per decision 1
bubblewrap build
```

The signing key goes where `signingKey.path` in the manifest says. If you have none yet,
make one with `keytool` or let `bubblewrap init` make it. Upload `app-release-bundle.aab`. Set `appVersion` and `appVersionCode` in the manifest for
the build, not for the web: the app is a shell around the live site, so every web deploy
reaches Play players without a store release. Rebuild and bump only when the shell changes
(the host, the icons, the signing key, or the target API).
