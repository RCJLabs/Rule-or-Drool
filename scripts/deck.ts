/**
 * Write the deck's stamp and what it deals to src/content/deck.json (BACKLOG-8 phase 49).
 *
 *   npm run deck
 *
 * Run it after any change to what the game deals or how a choice lands: a card's effects,
 * drift, weight or links, a story, a crisis, an advisor, an ending, a promise, or the engine's
 * config. The file's diff is the change of deck, so a deploy that moves it is plain to see.
 * The game reads the stamp from the file rather than work it out on a slow phone at startup,
 * and tests/engine/deck.test.ts fails while the file is out of date.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { content } from "../src/content";
import { buildLibrary, dealtBy, stampOf } from "../src/engine";
import { dealOf } from "../src/sim/deal";

const PATH = "src/content/deck.json";
// A fresh library, so the stamp is worked out here rather than read back from the file.
const lib = buildLibrary(content);
const next = { stamp: stampOf(dealtBy(lib)), deal: dealOf(lib) };
const before = JSON.parse(readFileSync(PATH, "utf8")) as typeof next;
// The same stamp over a different deal would tell players two decks are one.
if (next.stamp === before.stamp && next.deal !== before.deal) {
  console.error(`The deal moved (${before.deal} to ${next.deal}) and the stamp did not: the engine's own code deals differently. Bump DEAL_VERSION in src/version.ts, then run this again.`);
  process.exit(1);
}
writeFileSync(PATH, `${JSON.stringify(next, null, 2)}\n`);
console.log(before.stamp === next.stamp && before.deal === next.deal ? `The deck is unchanged: ${next.stamp}.` : `The deck is now ${next.stamp} (was ${before.stamp}); it deals ${next.deal} (was ${before.deal}).`);
