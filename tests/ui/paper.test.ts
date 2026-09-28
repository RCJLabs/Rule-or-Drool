import { describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { draw } from "../../src/engine/draw";
import { getCard } from "../../src/engine/library";
import { resolve } from "../../src/engine/resolve";
import { makeRng } from "../../src/engine/rng";
import { newRun, rollSetup } from "../../src/engine/state";
import type { Band, GameState } from "../../src/engine/types";
import { HISTORIES, HISTORY_ORDER, historyOf } from "../../src/meta/histories";
import { LEGACIES } from "../../src/meta/legacies";
import { BOTS, makeContext } from "../../src/sim";
import { eraCards, eraDecisions, eraOutcomes, eraVote, frontPage, HEADLINE_LEGACIES, PAPERS, VOTE_LEGACIES } from "../../src/ui/paper";
import { rivalReport } from "../../src/ui/rival";

/**
 * The papers at each era's door (BACKLOG-13 phase 82): the era's front page, in the voice of the
 * direction's paper, with its biggest decision, its vote, the rival and the reign's name so far.
 */

const BANDS: readonly Band[] = ["decay", "muddle", "ascent"];
/** Two lines at the headline's size on a 360px phone, in each paper (measured in a browser). */
const HEADLINE_MAX = 42;

describe("the papers' words", () => {
  it("give every decision that makes history a headline in each paper, short enough for two lines", () => {
    expect(new Set(Object.keys(PAPERS.headlines))).toEqual(new Set(HEADLINE_LEGACIES));
    expect(HEADLINE_LEGACIES.length).toBe(HISTORY_ORDER.filter((f) => HISTORIES[f]).length - VOTE_LEGACIES.length);
    for (const [f, lines] of Object.entries(PAPERS.headlines)) {
      for (const band of BANDS) {
        const line = lines[band];
        expect(line, `${f} in ${band}`).toBeTruthy();
        expect(line.length, `${f} in ${band}: "${line}"`).toBeLessThanOrEqual(HEADLINE_MAX);
        // A headline is not the country's own label for the decision, set in bigger type.
        expect(line.toLowerCase(), f).not.toBe(LEGACIES[f]?.toLowerCase());
      }
      // Three papers, three voices: no two alike.
      expect(new Set(BANDS.map((b) => lines[b])).size, f).toBe(3);
    }
  });

  it("leave a vote's outcome to the strap, so no vote is told twice", () => {
    for (const f of VOTE_LEGACIES) {
      expect(HISTORIES[f], f).toBeDefined();
      expect(HEADLINE_LEGACIES).not.toContain(f);
    }
  });

  it("put the name, the rival and the era's other decisions where the page says them", () => {
    for (const band of BANDS) {
      expect(PAPERS.called[band]).toContain("{name}");
      expect(PAPERS.inside[band]).toContain("{list}");
      for (const line of [...PAPERS.rival[band].rungs, PAPERS.rival[band].abolished]) expect(line, band).toContain("{rival}");
      expect(PAPERS.quiet[band].length, band).toBeGreaterThanOrEqual(2);
      for (const line of PAPERS.quiet[band]) expect(line.length, line).toBeLessThanOrEqual(HEADLINE_MAX);
      for (const vote of Object.keys(PAPERS.votes) as (keyof typeof PAPERS.votes)[]) expect(PAPERS.votes[vote][band], `${vote} in ${band}`).toBeTruthy();
    }
    expect(new Set(BANDS.map((b) => PAPERS.papers[b].name)).size).toBe(3);
  });
});

describe("the era's decisions", () => {
  const base = () => newRun(library, 3, rollSetup(library, 3, "left", []));
  const [first, last] = eraCards(library, 1);

  it("are the legacies set on the era's own cards, most history-making first", () => {
    const s: GameState = {
      ...base(),
      flags: ["schools_starved", "seawall", "cheated_election", "took_the_skim", "east_talks", "housing_built"],
      flagSince: { schools_starved: 10, seawall: 30, cheated_election: 25, took_the_skim: first, housing_built: last + 1 },
    };
    const made = eraDecisions(library, s, 1);
    // The seawall comes first in history's order; a vote is the strap's; the housing is era 2's.
    expect(made).toEqual(HISTORY_ORDER.filter((f) => ["schools_starved", "seawall", "took_the_skim"].includes(f)));
    expect(made[0]).toBe("seawall");
    expect(eraDecisions(library, s, 2)).toEqual(["housing_built"]);
  });

  it("leave out what the reign took over from the last one", () => {
    const s: GameState = {
      ...base(),
      flags: ["seawall"],
      flagSince: { seawall: 0 },
      inherited: { ...base().inherited!, legacies: ["seawall"] } as GameState["inherited"],
    };
    expect(eraDecisions(library, s, 1)).toEqual([]);
  });
});

describe("the era's vote, as the page tells it", () => {
  it("is the biggest news of the era's votes", () => {
    const s = newRun(library, 3, rollSetup(library, 3, "left", []));
    expect(eraVote(library, s, ["won"])).toBe("won");
    expect(eraVote(library, s, ["won", "cheated"])).toBe("cheated");
    expect(eraVote(library, s, ["lost", "backHonest"])).toBe("lostBackHonest");
    expect(eraVote(library, s, ["lost", "backCheat"])).toBe("lostBackCheat");
    expect(eraVote(library, s, ["lost"])).toBe("lostOut");
    expect(eraVote(library, s, [])).toBeNull();
    expect(eraVote(library, s, null)).toBeNull();
    expect(eraVote(library, { ...s, flags: [...s.flags, library.config.electionsAbolishedFlag] }, [])).toBe("abolished");
  });
});

describe("a door's front page, in the game's own runs", () => {
  type Outcome = NonNullable<ReturnType<typeof eraOutcomes>>[number];
  type Door = { state: GameState; era: number; votes: Outcome[] };
  /** The doors of the k-th careful run, with the votes of the era before each as they went. */
  function doorsOf(k: number): Door[] {
    const doors: Door[] = [];
    const seed = 820_000 + k;
    const bot = k % 2 ? BOTS.eyes : BOTS.informed;
    const rng = makeRng(seed ^ 0x5bd1e995);
    let s: GameState = draw(library, newRun(library, seed, rollSetup(library, seed, k % 4 < 2 ? "left" : "right", [])));
    let votes: Outcome[] = [];
    while (!s.over) {
      const card = getCard(library, s.current!);
      const side = bot(makeContext(library, s, card, rng, { danger: 25 }));
      const next = resolve(library, s, card.id, side);
      if (card.type === "election") {
        const honest = !!card[side].honest;
        votes.push(
          s.opposition
            ? next.opposition
              ? "stillOut"
              : honest
                ? "backHonest"
                : "backCheat"
            : !honest
              ? "cheated"
              : next.opposition || next.over
                ? "lost"
                : "won",
        );
      }
      const crossed = !next.over && next.era > s.era;
      s = draw(library, next);
      if (crossed) {
        doors.push({ state: s, era: s.era, votes });
        votes = [];
      }
    }
    return doors;
  }
  /** Each door of 60 careful runs. */
  const doors = Array.from({ length: 60 }, (_, k) => doorsOf(k)).flat();

  it("come at every door of a careful run", () => {
    expect(doors.length).toBeGreaterThan(100);
  });

  it("lead with the era's biggest decision, in the paper of the direction the country is going", () => {
    let led = 0;
    for (const { state, era } of doors) {
      const page = frontPage(library, state, era);
      const made = eraDecisions(library, state, era - 1);
      expect(page.band).toBe(state.band);
      expect(page.paper).toBe(PAPERS.papers[state.band].name);
      if (made.length) {
        led++;
        expect(page.lead).toBe(made[0]);
        expect(page.headline).toBe(PAPERS.headlines[made[0]!]![state.band]);
      } else {
        expect(page.lead).toBeNull();
        expect(PAPERS.quiet[state.band]).toContain(page.headline);
      }
      expect(page.inside === null, `${state.seed} era ${era}`).toBe(made.length < 2);
    }
    expect(led / doors.length).toBeGreaterThan(0.8);
  });

  it("say how the era's votes went, as they went", () => {
    const told = new Set<string>();
    for (const { state, era, votes } of doors) {
      expect(eraOutcomes(library, state, era - 1), `${state.seed} era ${era}`).toEqual(votes);
      const page = frontPage(library, state, era);
      const vote = eraVote(library, state, votes);
      expect(page.strap).toBe(vote ? PAPERS.votes[vote][state.band] : null);
      if (vote) told.add(vote);
    }
    // The careful bots win honestly, cheat, and lose and come back in these runs.
    expect(told.size).toBeGreaterThanOrEqual(3);
  });

  it("call the reign what history would call it at the door, and quote the rival by name", () => {
    for (const { state, era } of doors) {
      const page = frontPage(library, state, era);
      const name = historyOf(state, state.band).title;
      expect(page.name).toBe(name);
      expect(page.called).toBe(PAPERS.called[state.band].replace("{name}", name));
      const rival = library.advisorsById.get(state.cabinet[library.config.rivalRole]!)!.name;
      expect(page.rival).toBe(PAPERS.rival[state.band].rungs[rivalReport(library, state).rung].replace("{rival}", rival));
    }
  });

  it("lead an era that decided nothing with the paper's own line, the same for every run on the seed at that door", () => {
    // Since a question comes each era (BACKLOG-13 phase 91), an era that decides nothing is rare:
    // about one careful run in a hundred has one, so the search goes past the 60.
    let found: Door | undefined;
    for (let k = 0; k < 600 && !found; k++) found = doorsOf(k).find((d) => !eraDecisions(library, d.state, d.era - 1).length);
    expect(found).toBeDefined();
    const quiet = found!;
    const again = frontPage(library, { ...quiet.state, flags: [...quiet.state.flags] }, quiet.era);
    expect(again.headline).toBe(frontPage(library, quiet.state, quiet.era).headline);
  });
});
