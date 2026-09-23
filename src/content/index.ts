import type { Advisor, Arc, Card, Content, Ending, Epilogue, Modifier } from "../engine/types";
import { buildLibrary } from "../engine/library";

import era1Any from "./cards/era1/any.json";
import era1Gated from "./cards/era1/gated.json";
import era1Any2 from "./cards/era1/any2.json";
import era1Left from "./cards/era1/left.json";
import era1Left2 from "./cards/era1/left2.json";
import era1Right from "./cards/era1/right.json";
import era1Right2 from "./cards/era1/right2.json";
import era1Queued from "./cards/era1/queued.json";
import electionsShared from "./cards/elections/shared.json";
import electionsLeft from "./cards/elections/left.json";
import electionsRight from "./cards/elections/right.json";
import era2Any from "./cards/era2/any.json";
import era2Any2 from "./cards/era2/any2.json";
import era2Sides from "./cards/era2/sides.json";
import era2Left2 from "./cards/era2/left2.json";
import era2Right2 from "./cards/era2/right2.json";
import era2Queued from "./cards/era2/queued.json";
import era3Any from "./cards/era3/any.json";
import era3Any2 from "./cards/era3/any2.json";
import era3Sides from "./cards/era3/sides.json";
import era3Left2 from "./cards/era3/left2.json";
import era3Right2 from "./cards/era3/right2.json";
import era3Legacy from "./cards/era3/legacy.json";
import arcTermLimits from "./cards/arcs/term_limits.json";
import arcCabinetPlot from "./cards/arcs/cabinet_plot.json";
import arcMoonshot from "./cards/arcs/moonshot.json";
import arcPurge from "./cards/arcs/purge.json";
import arcStrongman from "./cards/arcs/strongman.json";
import arcImpeachment from "./cards/arcs/impeachment.json";
import arcSuccession from "./cards/arcs/succession.json";
import arcSecession from "./cards/arcs/secession.json";
import arcPress from "./cards/arcs/press.json";
import arcPlague from "./cards/arcs/plague.json";
import arcOracle from "./cards/arcs/oracle.json";
import arcWater from "./cards/arcs/water.json";
import arcReferendum from "./cards/arcs/referendum.json";
import arcTruth from "./cards/arcs/truth.json";
import arcSplit from "./cards/arcs/split.json";
import arcGeneralStrike from "./cards/arcs/general_strike.json";
import arcCommune from "./cards/arcs/commune.json";
import arcDynasty from "./cards/arcs/dynasty.json";
import arcConcordat from "./cards/arcs/concordat.json";
import arcEstates from "./cards/arcs/estates.json";
import arcRival from "./cards/arcs/rival.json";
import consequences from "./cards/consequences.json";
import chains from "./cards/chains.json";
import promises from "./cards/promises.json";
import rivalCards from "./cards/rival.json";
import bandCards from "./cards/bands.json";
import flawCards from "./cards/flaws.json";
import blocCards from "./cards/blocs.json";
import wantCards from "./cards/wants.json";
import keptCards from "./cards/kept.json";
import tenureCards from "./cards/tenure.json";
import voiceCards from "./cards/voices.json";
import edgeCards from "./cards/edges.json";
import billCards from "./cards/bills.json";
import habitCards from "./cards/habits.json";
import mandateCards from "./cards/mandates.json";
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
    ...asCards(era1Any2, "era1/any2.json"),
    ...asCards(era1Left, "era1/left.json"),
    ...asCards(era1Left2, "era1/left2.json"),
    ...asCards(era1Right, "era1/right.json"),
    ...asCards(era1Right2, "era1/right2.json"),
    ...asCards(era1Queued, "era1/queued.json"),
    ...asCards(electionsShared, "elections/shared.json"),
    ...asCards(electionsLeft, "elections/left.json"),
    ...asCards(electionsRight, "elections/right.json"),
    ...asCards(era2Any, "era2/any.json"),
    ...asCards(era2Any2, "era2/any2.json"),
    ...asCards(era2Sides, "era2/sides.json"),
    ...asCards(era2Left2, "era2/left2.json"),
    ...asCards(era2Right2, "era2/right2.json"),
    ...asCards(era2Queued, "era2/queued.json"),
    ...asCards(era3Any, "era3/any.json"),
    ...asCards(era3Any2, "era3/any2.json"),
    ...asCards(era3Sides, "era3/sides.json"),
    ...asCards(era3Left2, "era3/left2.json"),
    ...asCards(era3Right2, "era3/right2.json"),
    ...asCards(era3Legacy, "era3/legacy.json"),
    ...asCards(arcTermLimits, "arcs/term_limits.json"),
    ...asCards(arcCabinetPlot, "arcs/cabinet_plot.json"),
    ...asCards(arcMoonshot, "arcs/moonshot.json"),
    ...asCards(arcPurge, "arcs/purge.json"),
    ...asCards(arcStrongman, "arcs/strongman.json"),
    ...asCards(arcImpeachment, "arcs/impeachment.json"),
    ...asCards(arcSuccession, "arcs/succession.json"),
    ...asCards(arcSecession, "arcs/secession.json"),
    ...asCards(arcPress, "arcs/press.json"),
    ...asCards(arcPlague, "arcs/plague.json"),
    ...asCards(arcOracle, "arcs/oracle.json"),
    ...asCards(arcWater, "arcs/water.json"),
    ...asCards(arcReferendum, "arcs/referendum.json"),
    ...asCards(arcTruth, "arcs/truth.json"),
    ...asCards(arcSplit, "arcs/split.json"),
    ...asCards(arcGeneralStrike, "arcs/general_strike.json"),
    ...asCards(arcCommune, "arcs/commune.json"),
    ...asCards(arcDynasty, "arcs/dynasty.json"),
    ...asCards(arcConcordat, "arcs/concordat.json"),
    ...asCards(arcEstates, "arcs/estates.json"),
    ...asCards(arcRival, "arcs/rival.json"),
    ...asCards(consequences, "consequences.json"),
    ...asCards(chains, "chains.json"),
    ...asCards(promises, "promises.json"),
    ...asCards(rivalCards, "rival.json"),
    ...asCards(bandCards, "bands.json"),
    ...asCards(flawCards, "flaws.json"),
    ...asCards(blocCards, "blocs.json"),
    ...asCards(wantCards, "wants.json"),
    ...asCards(keptCards, "kept.json"),
    ...asCards(tenureCards, "tenure.json"),
    ...asCards(voiceCards, "voices.json"),
    ...asCards(edgeCards, "edges.json"),
    ...asCards(billCards, "bills.json"),
    ...asCards(habitCards, "habits.json"),
    ...asCards(mandateCards, "mandates.json"),
  ],
  arcs: arcs as unknown as Arc[],
  advisors: advisors as Advisor[],
  modifiers: modifiers as unknown as Modifier[],
  endings: endings as Ending[],
  epilogues: epilogues as unknown as Epilogue[],
};

/** The default library: real content, default config. */
export const library = buildLibrary(content);
