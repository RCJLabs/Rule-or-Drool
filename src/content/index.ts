import type { Advisor, Card, Content, Ending, Epilogue, Modifier } from "../engine/types";
import { buildLibrary } from "../engine/library";

import era1Any from "./cards/era1/any.json";
import era1Left from "./cards/era1/left.json";
import era1Right from "./cards/era1/right.json";
import era1Queued from "./cards/era1/queued.json";
import era1Elections from "./cards/era1/elections.json";
import advisors from "./advisors.json";
import modifiers from "./modifiers.json";
import endings from "./endings.json";
import epilogues from "./epilogues.json";

/**
 * Cheap shape check at load time. The phase 2 validator does the real work; this just
 * turns a malformed batch into a loud error instead of a confusing one.
 */
function asCards(json: unknown, file: string): Card[] {
  if (!Array.isArray(json)) throw new Error(`${file}: expected an array of cards`);
  for (const c of json) {
    if (typeof c?.id !== "string" || !c.left || !c.right || typeof c.text !== "string") {
      throw new Error(`${file}: malformed card ${JSON.stringify(c).slice(0, 80)}`);
    }
  }
  return json as Card[];
}

export const content: Content = {
  cards: [
    ...asCards(era1Any, "era1/any.json"),
    ...asCards(era1Left, "era1/left.json"),
    ...asCards(era1Right, "era1/right.json"),
    ...asCards(era1Queued, "era1/queued.json"),
    ...asCards(era1Elections, "era1/elections.json"),
  ],
  // Arcs land in phase 4 (three complete arcs including term_limits).
  arcs: [],
  advisors: advisors as Advisor[],
  modifiers: modifiers as Modifier[],
  endings: endings as Ending[],
  epilogues: epilogues as Epilogue[],
};

/** The default library: real content, default config. */
export const library = buildLibrary(content);
