// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { MANDATES } from "../../src/engine/mandates";
import { HISTORY_ORDER, LEGACIES, LEGACY_FLAGS, emptyMeta, historyTitle, type ChronicleEntry, type MetaState } from "../../src/meta";
import { CHRONICLE_PAGE, LEFT_SHOWN } from "../../src/ui/Chronicle";
import { Codex } from "../../src/ui/Codex";
import { lineName } from "../../src/ui/dynasty";

/**
 * The chronicle in the codex (BACKLOG-12 phase 76): how the player has ruled, counted, and every
 * reign the profile holds, the latest first, a page at a time.
 */

afterEach(cleanup);
const noop = () => {};
const w = STRINGS.chronicle;
const cfg = library.config;

const entry = (n: number, patch: Partial<ChronicleEntry> = {}): ChronicleEntry => ({
  n,
  align: "left",
  cards: 105,
  endingId: "finale_muddle",
  band: "muddle",
  history: null,
  rival: null,
  left: [],
  mandates: [],
  votes: { honest: 1, lost: 0, cheated: 1 },
  ...patch,
});
const profile = (chronicle: ChronicleEntry[], runs = chronicle.at(-1)?.n ?? 0): MetaState => ({ ...emptyMeta(), runs, chronicle });
const open = (meta: MetaState) => render(<Codex lib={library} meta={meta} onBack={noop} onSettings={noop} open="runs" />);
const habit = (label: string) => [...document.querySelectorAll(".chronicle-habits div")].find((d) => d.querySelector("dt")!.textContent === label)?.querySelector("dd")?.textContent;
const reigns = () => [...document.querySelectorAll(".codex-history li")];

describe("the chronicle in the codex", () => {
  it("says there is nothing yet, and when it begins for a profile that had runs before it", () => {
    open(profile([]));
    expect(document.querySelector(".codex-empty")!.textContent).toBe(STRINGS.codex.noHistory);
    cleanup();
    open(profile([], 12));
    expect(document.querySelector(".codex-empty")!.textContent).toBe(w.next);
  });

  it("counts how the player has ruled, as a label and a number, and never grades it", () => {
    open(
      profile([
        entry(1, { band: "ascent", endingId: "finale_ascent", cards: 175, mandates: [{ id: "m_fair", kept: true }] }),
        entry(2, { band: "decay", endingId: cfg.coupEnding, cards: 60, votes: { honest: 3, lost: 1, cheated: 2 } }),
        entry(3, { mandates: [{ id: "m_loyal", kept: false }] }),
      ]),
    );
    expect(habit(w.reigns)).toBe(w.reignsOf.replace("{n}", "3").replace("{k}", "175"));
    expect(habit(w.went)).toBe(`${STRINGS.bands.ascent} 1 · ${STRINGS.bands.muddle} 1 · ${STRINGS.bands.decay} 1`);
    expect(habit(w.ended)).toBe(`${STRINGS.codex.kinds.finished} 2 · ${STRINGS.codex.kinds.chosen} 0 · ${STRINGS.codex.kinds.fallen} 1`);
    // Five left to the count of nine held: one and one, three and two, one and one.
    expect(habit(w.votes)).toBe(w.votesLost.replace("{h}", "5").replace("{t}", "9").replace("{l}", "1"));
    expect(habit(w.promises)).toBe(w.promisesOf.replace("{k}", "1").replace("{n}", "2"));
  });

  it("counts votes over the reigns that kept them, and says which those are", () => {
    open(profile([entry(1, { votes: undefined }), entry(2, { votes: undefined }), entry(3, { votes: { honest: 2, lost: 0, cheated: 0 } })], 3));
    expect(habit(w.votes)).toBe(`${w.votesOf.replace("{h}", "2").replace("{t}", "2")}${w.inLastOne}`);
    cleanup();
    open(profile([entry(1, { votes: undefined }), entry(2, { votes: { honest: 0, lost: 0, cheated: 0 } }), entry(3, { votes: { honest: 0, lost: 0, cheated: 0 } })], 3));
    expect(habit(w.votes)).toBe(`${w.noneHeld}${w.inLast.replace("{n}", "2")}`);
    expect(habit(w.promises)).toBe(w.noneMade);
  });

  it("lists the reigns the latest first, a page at a time, and says where the chronicle begins", () => {
    const n = CHRONICLE_PAGE * 2 + 5;
    open(profile(Array.from({ length: n }, (_, i) => entry(i + 11)), n + 10));
    const numbers = () => reigns().map((li) => li.querySelector(".codex-run-n")!.textContent);
    expect(numbers()).toHaveLength(CHRONICLE_PAGE);
    expect(numbers()[0]).toBe(w.reign.replace("{n}", String(n + 10)));
    expect(numbers()[1]).toBe(w.reign.replace("{n}", String(n + 9)));
    expect(document.querySelector(".codex-foot")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: w.earlier.replace("{m}", String(n - CHRONICLE_PAGE)) }));
    expect(numbers()).toHaveLength(CHRONICLE_PAGE * 2);
    fireEvent.click(screen.getByRole("button", { name: w.earlier.replace("{m}", "5") }));
    expect(numbers()).toHaveLength(n);
    expect(numbers().at(-1)).toBe(w.reign.replace("{n}", "11"));
    expect(screen.queryByRole("button", { name: /earlier/i })).toBeNull();
    // Ten runs ended before it was kept.
    expect(document.querySelector(".codex-foot")!.textContent).toBe(w.begins.replace("{n}", "11"));
  });

  it("names each reign, what marks it, how it ended, what it promised and what it left", () => {
    const rival = [...library.advisorsById.values()][0]!;
    const history = "seawall:ascent:left";
    open(
      profile([
        entry(1, { history, rival: rival.id, band: "ascent", endingId: "finale_ascent", cards: 175, eras: cfg.longEraCount, left: ["seawall"], mandates: [{ id: "m_fair", kept: true }] }),
        entry(2, { line: 3, road: true, eras: 1, cards: 35, endingId: `${cfg.firstTermPrefix}muddle`, mandates: [{ id: "m_loyal", kept: false }] }),
      ]),
    );
    const [second, first] = reigns();
    expect(first!.querySelector(".codex-run-history")!.textContent).toBe(historyTitle(history));
    expect(first!.textContent).toContain(`${STRINGS.parties.left} · 175 cards · ${STRINGS.bands.ascent}`);
    expect(first!.textContent).toContain(`${library.endings.get("finale_ascent")!.title}, against ${rival.name}`);
    expect(first!.querySelector(".codex-eras")!.textContent).toBe(STRINGS.reign.short);
    expect(first!.querySelector("em.kept")!.textContent).toContain(MANDATES.find((m) => m.id === "m_fair")!.title);
    expect(first!.querySelector(".codex-left")!.textContent).toBe(`${w.left} ${LEGACIES.seawall}`);
    expect(second!.querySelector(".codex-road")!.textContent).toBe(STRINGS.road.mark);
    expect(second!.querySelector(".codex-line")!.textContent).toBe(lineName(3));
    expect(second!.querySelector(".codex-eras")!.textContent).toBe(STRINGS.reign.firstShort);
    expect(second!.querySelector("em.broken")).not.toBeNull();
    expect(second!.querySelector(".codex-left")).toBeNull();
  });

  it("names the biggest few things a reign left, as history ranks them, and counts the rest", () => {
    // History ranks every legacy, the biggest decisions first and the habits every run has last.
    const named = [HISTORY_ORDER[5]!, HISTORY_ORDER[0]!, HISTORY_ORDER[2]!];
    const habits = HISTORY_ORDER.slice(-2);
    expect([...named, ...habits].every((f) => LEGACY_FLAGS.has(f))).toBe(true);
    open(profile([entry(1, { left: [habits[0]!, ...named, habits[1]!] })]));
    const expected = [named[1]!, named[2]!, named[0]!].map((f) => LEGACIES[f]).join(" · ");
    expect(document.querySelector(".codex-left")!.textContent).toBe(`${w.left} ${expected}${w.andMore.replace("{n}", "2")}`);
    expect(LEFT_SHOWN).toBe(3);
  });

  it("is the codex's record of runs, counted by every run the profile finished", () => {
    render(<Codex lib={library} meta={profile([entry(40)], 40)} onBack={noop} onSettings={noop} />);
    const row = [...document.querySelectorAll(".codex-row")].find((r) => r.querySelector(".codex-row-title")!.textContent === STRINGS.codex.history)!;
    expect(row.querySelector(".codex-row-count")!.textContent).toBe("40");
  });
});
