import type { Advisor, Arc, Card, Content, Ending, Epilogue, Modifier } from "../engine/types";
import { rememberStamp } from "../engine/deck";
import deck from "./deck.json";
import { buildLibrary } from "../engine/library";

import era1Any from "./cards/era1/any.json";
import era1Gated from "./cards/era1/gated.json";
import era1Any2 from "./cards/era1/any2.json";
import era1Left from "./cards/era1/left.json";
import era1Left2 from "./cards/era1/left2.json";
import era1Right from "./cards/era1/right.json";
import era1Right2 from "./cards/era1/right2.json";
import era1Queued from "./cards/era1/queued.json";
import era1Any3 from "./cards/era1/any3.json";
import era1Left3 from "./cards/era1/left3.json";
import era1Right3 from "./cards/era1/right3.json";
import era1Any4 from "./cards/era1/any4.json";
import era1Left4 from "./cards/era1/left4.json";
import era1Right4 from "./cards/era1/right4.json";
import electionsShared from "./cards/elections/shared.json";
import electionsLeft from "./cards/elections/left.json";
import electionsRight from "./cards/elections/right.json";
import era2Any from "./cards/era2/any.json";
import era2Any2 from "./cards/era2/any2.json";
import era2Sides from "./cards/era2/sides.json";
import era2Left2 from "./cards/era2/left2.json";
import era2Right2 from "./cards/era2/right2.json";
import era2Queued from "./cards/era2/queued.json";
import era2Any3 from "./cards/era2/any3.json";
import era2Left3 from "./cards/era2/left3.json";
import era2Right3 from "./cards/era2/right3.json";
import era2Any4 from "./cards/era2/any4.json";
import era2Left4 from "./cards/era2/left4.json";
import era2Right4 from "./cards/era2/right4.json";
import era3Any from "./cards/era3/any.json";
import era3Any2 from "./cards/era3/any2.json";
import era3Sides from "./cards/era3/sides.json";
import era3Left2 from "./cards/era3/left2.json";
import era3Right2 from "./cards/era3/right2.json";
import era3Legacy from "./cards/era3/legacy.json";
import era3Any3 from "./cards/era3/any3.json";
import era3Left3 from "./cards/era3/left3.json";
import era3Right3 from "./cards/era3/right3.json";
import era3Any4 from "./cards/era3/any4.json";
import era3Left4 from "./cards/era3/left4.json";
import era3Right4 from "./cards/era3/right4.json";
import era3Any5 from "./cards/era3/any5.json";
import era3Left5 from "./cards/era3/left5.json";
import era3Right5 from "./cards/era3/right5.json";
import era4Any from "./cards/era4/any.json";
import era4Bands from "./cards/era4/bands.json";
import era4Sides from "./cards/era4/sides.json";
import era4Legacy from "./cards/era4/legacy.json";
import era5Any from "./cards/era5/any.json";
import era5Bands from "./cards/era5/bands.json";
import era5Sides from "./cards/era5/sides.json";
import era5Legacy from "./cards/era5/legacy.json";
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
import arcCensus from "./cards/arcs/census.json";
import arcFlood from "./cards/arcs/flood.json";
import arcAgent from "./cards/arcs/agent.json";
import arcGames from "./cards/arcs/games.json";
import arcCurrency from "./cards/arcs/currency.json";
import arcHarvest from "./cards/arcs/harvest.json";
import arcQuake from "./cards/arcs/quake.json";
import arcLottery from "./cards/arcs/lottery.json";
import arcCrown from "./cards/arcs/crown.json";
import arcLender from "./cards/arcs/lender.json";
import arcCaptain from "./cards/arcs/captain.json";
import arcDebate from "./cards/arcs/debate.json";
import arcBlackout from "./cards/arcs/blackout.json";
import arcJubilee from "./cards/arcs/jubilee.json";
import arcCoop from "./cards/arcs/coop.json";
import arcYouth from "./cards/arcs/youth.json";
import arcPlay from "./cards/arcs/play.json";
import arcRailway from "./cards/arcs/railway.json";
import arcFoundation from "./cards/arcs/foundation.json";
import arcHonours from "./cards/arcs/honours.json";
import arcPort from "./cards/arcs/port.json";
import arcVeterans from "./cards/arcs/veterans.json";
import questionTreaty from "./cards/questions/treaty.json";
import questionPapers from "./cards/questions/papers.json";
import questionTopRate from "./cards/questions/top_rate.json";
import questionCare from "./cards/questions/care.json";
import questionWage from "./cards/questions/wage.json";
import questionHousing from "./cards/questions/housing.json";
import questionCarbon from "./cards/questions/carbon.json";
import questionTrade from "./cards/questions/trade.json";
import questionPensions from "./cards/questions/pensions.json";
import questionDebt from "./cards/questions/debt.json";
import questionDrugs from "./cards/questions/drugs.json";
import questionCrime from "./cards/questions/crime.json";
import questionCameras from "./cards/questions/cameras.json";
import questionSpeech from "./cards/questions/speech.json";
import questionCourts from "./cards/questions/courts.json";
import questionBanks from "./cards/questions/banks.json";
import comebacks from "./cards/comebacks.json";
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
    ...asCards(era1Any3, "era1/any3.json"),
    ...asCards(era1Left3, "era1/left3.json"),
    ...asCards(era1Right3, "era1/right3.json"),
    ...asCards(era1Any4, "era1/any4.json"),
    ...asCards(era1Left4, "era1/left4.json"),
    ...asCards(era1Right4, "era1/right4.json"),
    ...asCards(electionsShared, "elections/shared.json"),
    ...asCards(electionsLeft, "elections/left.json"),
    ...asCards(electionsRight, "elections/right.json"),
    ...asCards(era2Any, "era2/any.json"),
    ...asCards(era2Any2, "era2/any2.json"),
    ...asCards(era2Sides, "era2/sides.json"),
    ...asCards(era2Left2, "era2/left2.json"),
    ...asCards(era2Right2, "era2/right2.json"),
    ...asCards(era2Queued, "era2/queued.json"),
    ...asCards(era2Any3, "era2/any3.json"),
    ...asCards(era2Left3, "era2/left3.json"),
    ...asCards(era2Right3, "era2/right3.json"),
    ...asCards(era2Any4, "era2/any4.json"),
    ...asCards(era2Left4, "era2/left4.json"),
    ...asCards(era2Right4, "era2/right4.json"),
    ...asCards(era3Any, "era3/any.json"),
    ...asCards(era3Any2, "era3/any2.json"),
    ...asCards(era3Sides, "era3/sides.json"),
    ...asCards(era3Left2, "era3/left2.json"),
    ...asCards(era3Right2, "era3/right2.json"),
    ...asCards(era3Legacy, "era3/legacy.json"),
    ...asCards(era3Any3, "era3/any3.json"),
    ...asCards(era3Left3, "era3/left3.json"),
    ...asCards(era3Right3, "era3/right3.json"),
    ...asCards(era3Any4, "era3/any4.json"),
    ...asCards(era3Left4, "era3/left4.json"),
    ...asCards(era3Right4, "era3/right4.json"),
    ...asCards(era3Any5, "era3/any5.json"),
    ...asCards(era3Left5, "era3/left5.json"),
    ...asCards(era3Right5, "era3/right5.json"),
    // The long reign's two eras (BACKLOG-5 phase 39): drawn only in a run that reaches them.
    ...asCards(era4Any, "era4/any.json"),
    ...asCards(era4Bands, "era4/bands.json"),
    ...asCards(era4Sides, "era4/sides.json"),
    ...asCards(era4Legacy, "era4/legacy.json"),
    ...asCards(era5Any, "era5/any.json"),
    ...asCards(era5Bands, "era5/bands.json"),
    ...asCards(era5Sides, "era5/sides.json"),
    ...asCards(era5Legacy, "era5/legacy.json"),
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
    ...asCards(arcCensus, "arcs/census.json"),
    ...asCards(arcFlood, "arcs/flood.json"),
    ...asCards(arcAgent, "arcs/agent.json"),
    ...asCards(arcGames, "arcs/games.json"),
    ...asCards(arcCurrency, "arcs/currency.json"),
    ...asCards(arcHarvest, "arcs/harvest.json"),
    ...asCards(arcQuake, "arcs/quake.json"),
    ...asCards(arcLottery, "arcs/lottery.json"),
    ...asCards(arcCrown, "arcs/crown.json"),
    ...asCards(arcLender, "arcs/lender.json"),
    ...asCards(arcCaptain, "arcs/captain.json"),
    ...asCards(arcDebate, "arcs/debate.json"),
    ...asCards(arcBlackout, "arcs/blackout.json"),
    ...asCards(arcJubilee, "arcs/jubilee.json"),
    ...asCards(arcCoop, "arcs/coop.json"),
    ...asCards(arcYouth, "arcs/youth.json"),
    ...asCards(arcPlay, "arcs/play.json"),
    ...asCards(arcRailway, "arcs/railway.json"),
    ...asCards(arcFoundation, "arcs/foundation.json"),
    ...asCards(arcHonours, "arcs/honours.json"),
    ...asCards(arcPort, "arcs/port.json"),
    ...asCards(arcVeterans, "arcs/veterans.json"),
    // The questions (BACKLOG-6 phase 40): policies asked plainly, one arc per side each.
    ...asCards(questionTreaty, "questions/treaty.json"),
    ...asCards(questionPapers, "questions/papers.json"),
    ...asCards(questionTopRate, "questions/top_rate.json"),
    ...asCards(questionCare, "questions/care.json"),
    // Twelve more (phase 41), in the same shape.
    ...asCards(questionWage, "questions/wage.json"),
    ...asCards(questionHousing, "questions/housing.json"),
    ...asCards(questionCarbon, "questions/carbon.json"),
    ...asCards(questionTrade, "questions/trade.json"),
    ...asCards(questionPensions, "questions/pensions.json"),
    ...asCards(questionDebt, "questions/debt.json"),
    ...asCards(questionDrugs, "questions/drugs.json"),
    ...asCards(questionCrime, "questions/crime.json"),
    ...asCards(questionCameras, "questions/cameras.json"),
    ...asCards(questionSpeech, "questions/speech.json"),
    ...asCards(questionCourts, "questions/courts.json"),
    ...asCards(questionBanks, "questions/banks.json"),
    // What comes of each answer, in the eras after it (BACKLOG-6 phase 42).
    ...asCards(comebacks, "comebacks.json"),
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

// The deck's stamp, worked out ahead by `npm run deck` (BACKLOG-8 phase 49).
rememberStamp(library, deck.stamp);
