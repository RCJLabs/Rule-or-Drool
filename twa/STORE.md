# Rule or Drool on Google Play: the listing

Everything here was made from the shipped game and can be pasted or uploaded as it is. What
this repository cannot settle is at the end, under **Yours to decide**, each with the steps
that follow from it.

## Store listing

| Field | Text | Length |
|---|---|---|
| App name | Rule or Drool | 13 / 30 |
| Short description | Swipe to govern. The easy choice now is the ruinous choice later. | 65 / 80 |

**Full description** (1,845 / 4,000 characters). Every number in it was checked
against the content when written: 526 cards, 22 arcs, 22 advisors, 23 endings, 198 history
names. Re-check them if the content changes.

```
You have taken office. Your advisors bring you one decision at a time: swipe left or right, and try to keep the country, your coalition and yourself in one piece for three eras.

The catch: the easy choice now is the ruinous choice later. The bridge you did not fix, the audit you buried, the election you counted twice all come back, twenty cards on, when you have forgotten them and the country has not.

HOW IT PLAYS
• Six meters: the three blocs of your coalition, and the money, order and institutions of the state. Lose a bloc, or let the state run to either extreme, and your rule ends.
• The country is heading somewhere, and nothing tells you where. The screen does: it frays into a livestream on the way down and polishes itself on the way up.
• 526 cards, 22 stories that play out over several cards, and 22 advisors whose traits change what their advice costs you.
• Elections you can win honestly, or not, and a record of which.

EVERY RUN IS ITS OWN
• 23 ways for a rule to end, and 198 names history can give it, from what you did and where it took the country.
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
font Android draws the game in. The script fetches Roboto and points Chromium at it, since
this machine's default is a fifth wider. The profile in `07` and `08` was played, not
written: thirty runs of the mixed bot folded in by the game's own code.

**Known flaw in these shots.** In `02` and `03` some meter names are cut short ("THE MON…",
"Institutio…"). That is the game as a 360px phone shows it today (BACKLOG-4 phase 29). If
the names are shortened, run the script again before uploading.

## Data safety form

Measured, not assumed: the game makes no network request except the service worker
fetching the game's own files from its own origin. There is no analytics, no advertising
SDK and no third-party URL anywhere in the source. Everything it stores is in four
`localStorage` keys on the phone (`rod.run`, `rod.meta`, `rod.settings`, `rod.hintSeen`).

- **Does the app collect or share any of the required user data types?** No.
- **Is all user data encrypted in transit?** No user data is transmitted.
- **Can users request that data be deleted?** Nothing is held off the device. In the game,
  Settings › Erase all progress clears it, as does clearing the app's storage.
- **"Share this run"** sends a picture and a link through the system share sheet, only when
  the player presses it, to whoever they choose. Check the console's wording when you fill
  in the form; my understanding is that a transfer the user starts, and expects, is not
  "sharing" in its terms.

## Content rating questionnaire (IARC)

These are notes to answer from, not answers. The 526 cards were searched for each theme the
questionnaire asks about:

- **Violence:** reported, not shown. Deaths are told in text ("forty thousand people
  died"), and there are riots, a coup, purges and a general "unleashed". The pictures are
  flat silhouettes (tanks, a searchlight), with no blood and no injury.
- **Language:** no profanity found.
- **Sexual content:** none found.
- **Drugs, alcohol, tobacco:** two mentions, both medicine: a drug-pricing card, and a drug
  made in orbit.
- **Gambling:** a national lottery appears as policy satire. There is no simulated
  gambling and nothing to buy.
- **User interaction:** none. The chat in the Decay look is scripted decoration.
- **Politics:** throughout, and all fictional. The country, the parties (the Commons and the
  Ledger) and every person are invented.

## Yours to decide

### 1. Where the asset links file lives

Android checks `https://<host>/.well-known/assetlinks.json` at the root of the host, and
this project publishes under `/Rule-or-Drool/`, so its host's root is not ours to write to.
Without the check passing, the app runs with a browser address bar across the top.

- **Custom domain (recommended).** Point a domain at this Pages site, add
  `public/.well-known/assetlinks.json` here (Vite copies `public/` into the build as it
  is), set `host` and `startUrl` in `twa/twa-manifest.json` to the new origin, and check
  that GitHub Pages serves the dot-folder: it serves Actions-deployed artifacts as they
  are, but confirm it with `curl` after the first deploy.
- **The user site.** Add the file to the `RCJLabs/rcjlabs.github.io` repository at
  `.well-known/assetlinks.json`. It works, but this game's release then depends on another
  repository.

Either way the file is `twa/assetlinks.template.json`, with the SHA-256 fingerprint of the
**app signing key**. With Play App Signing, which new apps use, that is on the console's App integrity page,
under App signing, not your local keystore's.

### 2. The policy check

The sandbox that built this cannot reach Google's policy pages, so none of this is
confirmed. Read the current pages and settle:

- how political content and elections are treated for a game that is plainly satire with
  invented parties. The listing says so in its last paragraph;
- whether famine, pandemic and war cards could read as exploiting a current real event;
- the target API level. `twa/twa-manifest.json` was checked against Bubblewrap 1.25.0
  (16 September 2026), which targets API 36. Use that version or later.

### 3. Your developer account

If the account is a personal one created in or after November 2023, Play has required a
closed test with at least 12 testers opted in for 14 days in a row before production
access. That was the rule as I know it; check the console. It is the longest step here if it
applies, so it is worth starting first.

### 4. Build and upload

On a machine with a JDK and the Android SDK:

```
npm install -g @bubblewrap/cli
cp twa/twa-manifest.json ./twa-manifest.json   # after setting the host, per decision 1
bubblewrap build                                 # creates the signing key on first run
```

Upload `app-release-bundle.aab`. Set `appVersion` and `appVersionCode` in the manifest for
the build, not for the web: the app is a shell around the live site, so every web deploy
reaches Play players without a store release. Rebuild and bump only when the shell changes
(the host, the icons, the signing key, or the target API).
