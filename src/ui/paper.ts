import data from "../content/papers.json";
import { withNames } from "../engine/endings";
import { draw } from "../engine/draw";
import { getCard, type Library } from "../engine/library";
import { setupOfRun } from "../engine/replay";
import { resolve } from "../engine/resolve";
import { diceAt } from "../engine/rng";
import { hasFlag, newRun } from "../engine/state";
import type { Band, GameState } from "../engine/types";
import { HISTORIES, HISTORY_ORDER, historyOf } from "../meta/histories";
import { LEGACIES } from "../meta/legacies";
import { rivalReport } from "./rival";

/**
 * The papers at each era's door (BACKLOG-13 phase 82). The era's decisions were told only at
 * the run's end, and the run's name only there too, though it is settled early. So the door
 * shows the era's front page: a paper in the direction's voice, the era's biggest decision as
 * its headline, the vote under it, a line from the rival, and what the reign is being called.
 *
 * Three papers, one to a direction: a broadsheet in the Ascent, a tabloid in the Muddle and the
 * state's own in Decay. The satire is in the paper, not the policy: every decision has a
 * headline in each, and none of them says whether it was the right thing to do.
 */

/** How an era's votes went, as its page says it: the most newsworthy of them. */
export type EraVote = "won" | "cheated" | "lostBackHonest" | "lostBackCheat" | "lostOut" | "abolished";

interface PaperFile {
  papers: Record<Band, { name: string; motto: string }>;
  /** What the reign is being called, with the name as `{name}`. */
  called: Record<Band, string>;
  /** The other decisions of the era, with them as `{list}`. */
  inside: Record<Band, string>;
  votes: Record<EraVote, Record<Band, string>>;
  /** A headline for an era that decided nothing that lasts: the bills came, and the vote. */
  quiet: Record<Band, string[]>;
  /** The rival by how they stand (the cabinet's four rungs), and with the vote abolished; `{rival}` is their name. */
  rival: Record<Band, { rungs: [string, string, string, string]; abolished: string }>;
  headlines: Record<string, Record<Band, string>>;
}

export const PAPERS = data as unknown as PaperFile;

/**
 * Legacies that are a vote's outcome: the page tells them in its strap, so they are not its
 * headline too.
 */
export const VOTE_LEGACIES: readonly string[] = ["lost_office", "won_it_back", "cheated_election", "counted_late_boxes"];

/** The decisions a page can lead with: every history-making legacy but a vote's. */
export const HEADLINE_LEGACIES: readonly string[] = HISTORY_ORDER.filter((f) => HISTORIES[f] && !VOTE_LEGACIES.includes(f));

export interface FrontPage {
  band: Band;
  paper: string;
  motto: string;
  headline: string;
  /** The decision the headline is about, or null for an era that made none. */
  lead: string | null;
  /** The era's other decisions, or null when it made one or none. */
  inside: string | null;
  strap: string | null;
  rival: string | null;
  /** The reign's name so far. */
  name: string;
  called: string;
}

/** The cards an era spans: the first and last card numbers (1-based) of era `era`. */
export function eraCards(lib: Library, era: number): [number, number] {
  const L = lib.config.eraLength;
  return [(era - 1) * L + 1, era * L];
}

/**
 * The decisions an era made, most history-making first: legacies set on its cards, not taken
 * over from the last reign, and not a vote's.
 */
export function eraDecisions(lib: Library, state: GameState, era: number): string[] {
  const [first, last] = eraCards(lib, era);
  const inherited = state.inherited?.legacies ?? [];
  return HEADLINE_LEGACIES.filter((f) => {
    const at = state.flagSince?.[f];
    return state.flags.includes(f) && !inherited.includes(f) && at !== undefined && at >= first && at <= last;
  });
}

type Outcome = "won" | "lost" | "cheated" | "backHonest" | "backCheat" | "stillOut";

/**
 * How each vote of an era went, read by dealing the run again from its record: whether a vote
 * was lost is the count as that card found it, which the run does not keep. Null when the run
 * cannot be dealt again that far.
 */
export function eraOutcomes(lib: Library, state: GameState, era: number): Outcome[] | null {
  const record = state.choices;
  const [first, last] = eraCards(lib, era);
  if (!record || record.length < Math.min(last, state.cardCount)) return null;
  let s = draw(lib, newRun(lib, state.seed, setupOfRun(state)));
  const out: Outcome[] = [];
  for (let i = 0; i < Math.min(last, record.length); i++) {
    const [id, side] = record[i]!;
    if (s.current !== id) return null;
    const card = getCard(lib, id);
    const next = resolve(lib, s, id, side);
    if (i + 1 >= first && card.type === "election") {
      const honest = !!card[side].honest;
      if (s.opposition) out.push(next.opposition ? "stillOut" : honest ? "backHonest" : "backCheat");
      else out.push(!honest ? "cheated" : next.opposition || next.over ? "lost" : "won");
    }
    s = draw(lib, next);
  }
  return out;
}

/** The one thing a page says of an era's votes: its biggest news. */
export function eraVote(lib: Library, state: GameState, outcomes: readonly Outcome[] | null): EraVote | null {
  if (outcomes && outcomes.length) {
    if (outcomes.includes("lost")) {
      const back =
        outcomes.lastIndexOf("backHonest") > outcomes.lastIndexOf("backCheat") ? "lostBackHonest" : outcomes.includes("backCheat") ? "lostBackCheat" : null;
      return back ?? "lostOut";
    }
    if (outcomes.includes("backCheat")) return "lostBackCheat";
    if (outcomes.includes("backHonest")) return "lostBackHonest";
    if (outcomes.includes("cheated")) return "cheated";
    if (outcomes.includes("won")) return "won";
  }
  return hasFlag(state, lib.config.electionsAbolishedFlag) ? "abolished" : null;
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * The front page for the door into `era`, about the era before it: what `state` holds on the
 * far side of the boundary.
 */
export function frontPage(lib: Library, state: GameState, era: number): FrontPage {
  const band = state.band;
  const ended = era - 1;
  const made = eraDecisions(lib, state, ended);
  const lead = made[0] ?? null;
  const quiet = PAPERS.quiet[band];
  // An era that made nothing lasting leads with a line of the paper's own, the same one for
  // every run on the seed at this door.
  const headline = lead ? (PAPERS.headlines[lead]?.[band] ?? LEGACIES[lead] ?? lead) : quiet[Math.floor(diceAt(state.seed, era, "front page") * quiet.length)]!;
  // The era's other decisions after the paper's own words: the first two, or the first and a count.
  const others = made.slice(1).map((f) => lowerFirst(LEGACIES[f] ?? f));
  const list = others.length > 2 ? `${others[0]!}, and ${others.length - 1} more` : others.join("; ");
  const vote = eraVote(lib, state, eraOutcomes(lib, state, ended));
  const lines = PAPERS.rival[band];
  const said = hasFlag(state, lib.config.electionsAbolishedFlag) ? lines.abolished : lines.rungs[rivalReport(lib, state).rung];
  const name = historyOf(state, band).title;
  return {
    band,
    paper: PAPERS.papers[band].name,
    motto: PAPERS.papers[band].motto,
    headline,
    lead,
    inside: others.length ? PAPERS.inside[band].replace("{list}", list) : null,
    strap: vote ? PAPERS.votes[vote][band] : null,
    rival: state.cabinet[lib.config.rivalRole] ? withNames(lib, state, said) : null,
    name,
    called: PAPERS.called[band].replace("{name}", name),
  };
}
