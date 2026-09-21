import type { Advisor, Arc, Card, Content, Ending, Epilogue, Modifier } from "../engine/types";
import { buildLibrary } from "../engine/library";

import era1Any from "./cards/era1/any.json";
import era1Gated from "./cards/era1/gated.json";
import era1Left from "./cards/era1/left.json";
import era1Right from "./cards/era1/right.json";
import era1Queued from "./cards/era1/queued.json";
import era1Elections from "./cards/era1/elections.json";
import era2Any from "./cards/era2/any.json";
import era2Sides from "./cards/era2/sides.json";
import era2Queued from "./cards/era2/queued.json";
import era3Any from "./cards/era3/any.json";
import era3Sides from "./cards/era3/sides.json";
import era3Legacy from "./cards/era3/legacy.json";
import arcTermLimits from "./cards/arcs/term_limits.json";
import arcCabinetPlot from "./cards/arcs/cabinet_plot.json";
import arcMoonshot from "./cards/arcs/moonshot.json";
import consequences from "./cards/consequences.json";
import arcs from "./arcs/arcs.json";
import advisors from "./advisors.json";
import modifiers from "./modifiers.json";
import endings from "./endings.json";
import epilogues from "./epilogues.json";

/**
 * Cheap shape check at load time. `scripts/validate-content.ts` does the real work in CI;
 * this only turns a malformed batch into a loud error instead of a confusing one.
 *
 * The casts go through `unknown` because TypeScript infers each JSON literal's optional
 * fields as `undefined`-valued unions, which no longer match the engine's types.
 */
function asCards(json: unknown, file: string): Card[] {
  if (!Array.isArray(json)) throw new Error(`${file}: expected an array of cards`);
  for (const c of json) {
    if (typeof c?.id !== "string" || !c.left || !c.right || typeof c.text !== "string") {
      throw new Error(`${file}: malformed card ${JSON.stringify(c).slice(0, 80)}`);
    }
  }
  return json as unknown as Card[];
}

export const content: Content = {
  cards: [
    ...asCards(era1Any, "era1/any.json"),
    ...asCards(era1Gated, "era1/gated.json"),
    ...asCards(era1Left, "era1/left.json"),
    ...asCards(era1Right, "era1/right.json"),
    ...asCards(era1Queued, "era1/queued.json"),
    ...asCards(era1Elections, "era1/elections.json"),
    ...asCards(era2Any, "era2/any.json"),
    ...asCards(era2Sides, "era2/sides.json"),
    ...asCards(era2Queued, "era2/queued.json"),
    ...asCards(era3Any, "era3/any.json"),
    ...asCards(era3Sides, "era3/sides.json"),
    ...asCards(era3Legacy, "era3/legacy.json"),
    ...asCards(arcTermLimits, "arcs/term_limits.json"),
    ...asCards(arcCabinetPlot, "arcs/cabinet_plot.json"),
    ...asCards(arcMoonshot, "arcs/moonshot.json"),
    ...asCards(consequences, "consequences.json"),
  ],
  arcs: arcs as unknown as Arc[],
  advisors: advisors as Advisor[],
  modifiers: modifiers as unknown as Modifier[],
  endings: endings as Ending[],
  epilogues: epilogues as unknown as Epilogue[],
};

/** The default library: real content, default config. */
export const library = buildLibrary(content);
