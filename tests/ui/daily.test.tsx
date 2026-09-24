// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { library } from "../../src/content";
import { STRINGS } from "../../src/content/strings";
import { ALL_HISTORY_KEYS, dailySeed, emptyMeta, historyTitle, type DailyEntry, type MetaState } from "../../src/meta";
import type { Measure } from "../../src/playtest/record";
import { Codex } from "../../src/ui/Codex";
import { Ending } from "../../src/ui/Ending";
import { Setup } from "../../src/ui/Setup";
import { useGame } from "../../src/ui/useGame";

/**
 * The daily, day by day (BACKLOG-5 phase 38): the log in the codex as a month, the streak on
 * the menu and at the end of a daily, and a daily left for later still counted as one.
 */

const T: Measure = { ms: 1000, looked: [0, 0] };
const TODAY = "2026-09-23";
const KEY = ALL_HISTORY_KEYS.find((k) => historyTitle(k))!;
const entry = (day: string, history: string | null = null, ending = "riots", cards = 40): DailyEntry => ({ day, history, ending, cards });
const withDailies = (...dailies: DailyEntry[]): MetaState => ({ ...emptyMeta(), dailies });
const noop = () => {};
type Game = { current: ReturnType<typeof useGame> };

function finish(g: Game) {
  for (let i = 0; i < 400 && g.current.state && !g.current.state.over; i++) {
    if (g.current.transition !== null) act(() => g.current.dismissTransition());
    act(() => g.current.choose(i % 3 ? "right" : "left", T));
  }
  expect(g.current.state?.over).toBeTruthy();
}

function codex(meta: MetaState) {
  render(<Codex lib={library} meta={meta} onBack={noop} onSettings={noop} today={TODAY} open="dailies" />);
  return screen.getByRole("region", { name: STRINGS.daily.title });
}

const states = (month: HTMLElement) =>
  Object.fromEntries([...month.querySelectorAll("td[data-day]")].map((td) => [Number(td.querySelector("[aria-hidden]")!.textContent), td.getAttribute("data-day")]));

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("the month of dailies", () => {
  it("names each day played, newest first, and marks the days missed since the first", () => {
    const month = codex(withDailies(entry("2026-09-20", KEY), entry("2026-09-22"), entry("2026-09-23", KEY, "coup", 88)));
    expect(within(month).getByRole("heading", { name: "September 2026" })).toBeTruthy();
    const names = within(month).getAllByRole("listitem").map((li) => li.querySelector("b")!.textContent);
    // The history's name where the day has one; the ending's where it was kept before names were.
    expect(names).toEqual([historyTitle(KEY), library.endings.get("riots")!.title, historyTitle(KEY)]);
    expect(within(month).getAllByRole("listitem")[0]!.textContent).toContain(`#3 · 23 September · ${library.endings.get("coup")!.title} · 88 cards`);
    const s = states(month);
    // Before the first daily the player was not playing yet, which is not missing a day.
    expect([s[19], s[20], s[21], s[22], s[23], s[24]]).toEqual(["before", "played", "missed", "played", "played", "future"]);
    // A screen reader hears the day, not a bare number.
    const played = [...month.querySelectorAll("td[data-day='played'] .sr-only")].map((e) => e.textContent);
    expect(played).toContain(`23 September: ${STRINGS.daily.played}, #3: ${historyTitle(KEY)}`);
    expect(month.querySelector("td[data-day='missed'] .sr-only")!.textContent).toBe(`21 September: ${STRINGS.daily.missed}`);
  });

  it("says the streak and the best one, and how to keep a streak going", () => {
    expect(within(codex(withDailies(entry("2026-09-22"), entry("2026-09-23")))).getByText(STRINGS.daily.streakToday.replace("{n}", "2"))).toBeTruthy();
    cleanup();
    // Today's still to play: yesterday's streak stands, and the line says what keeps it.
    expect(within(codex(withDailies(entry("2026-09-21"), entry("2026-09-22")))).getByText(STRINGS.daily.streakOpen.replace("{n}", "2"))).toBeTruthy();
    cleanup();
    const broken = codex(withDailies(entry("2026-09-17"), entry("2026-09-18"), entry("2026-09-19"), entry("2026-09-21")));
    expect(within(broken).getByText(STRINGS.daily.streakNone)).toBeTruthy();
    expect(within(broken).getByText(STRINGS.daily.best.replace("{n}", "3"))).toBeTruthy();
  });

  it("pages back to the first month played and no further, nor past this one", () => {
    const month = codex(withDailies(entry("2026-08-30", KEY), entry("2026-09-02")));
    const earlier = within(month).getByRole("button", { name: STRINGS.daily.earlier }) as HTMLButtonElement;
    const later = within(month).getByRole("button", { name: STRINGS.daily.later }) as HTMLButtonElement;
    expect(later.disabled).toBe(true);
    fireEvent.click(earlier);
    expect(within(month).getByRole("heading", { name: "August 2026" })).toBeTruthy();
    expect(within(month).getAllByRole("listitem").map((li) => li.querySelector("b")!.textContent)).toEqual([historyTitle(KEY)]);
    expect(earlier.disabled).toBe(true);
    fireEvent.click(later);
    expect(within(month).getByRole("heading", { name: "September 2026" })).toBeTruthy();
  });

  it("invites a first daily rather than showing an empty record as a failure", () => {
    const month = codex(emptyMeta());
    expect(within(month).getByText(STRINGS.daily.streakNone)).toBeTruthy();
    expect(within(month).getByText(STRINGS.daily.none)).toBeTruthy();
    expect(Object.values(states(month))).not.toContain("missed");
  });
});

describe("the daily on the menu", () => {
  const menu = (meta: MetaState, today = TODAY) =>
    render(<Setup lib={library} saved={null} meta={meta} onStart={noop} onDaily={noop} onContinue={noop} onCodex={noop} onSettings={noop} today={today} />);

  it("offers today's by its number, and the streak it would carry on", () => {
    menu(withDailies(entry("2026-09-21"), entry("2026-09-22")));
    expect((screen.getByRole("button", { name: "Daily #3" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(STRINGS.daily.menuStreak.replace("{n}", "2"))).toBeTruthy();
  });

  it("says when today's is played, and has no streak to show after a missed day", () => {
    menu(withDailies(entry("2026-09-20"), entry("2026-09-23")));
    expect((screen.getByRole("button", { name: "Daily #3 played" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(STRINGS.daily.menuStreak.replace("{n}", "1"))).toBeTruthy();
    cleanup();
    menu(withDailies(entry("2026-09-20")));
    expect(screen.queryByText(/Daily streak/)).toBeNull();
  });

  it("calls a day with no number the daily run, as a phone that has lost its clock would see it", () => {
    menu(emptyMeta(), "1970-01-01");
    expect(screen.getByRole("button", { name: STRINGS.ui.dailyPlain })).toBeTruthy();
    cleanup();
    const month = codex(withDailies(entry("2026-09-19", KEY), entry(TODAY, KEY)));
    // A day logged before the first daily keeps its name and its date, without a number.
    expect(within(month).getAllByRole("listitem").map((li) => li.querySelector("span")!.textContent)).toEqual([
      `#3 · 23 September · ${library.endings.get("riots")!.title} · 40 cards`,
      `19 September · ${library.endings.get("riots")!.title} · 40 cards`,
    ]);
  });
});

describe("a daily played to its end", () => {
  const today = () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  };

  it("goes into the log and ends on its number, the streak and its month", () => {
    today();
    const g = renderHook(() => useGame(library)).result;
    act(() => g.current.startDaily("left"));
    finish(g);
    const fold = g.current.lastFold!;
    expect(fold.daily).toMatchObject({ day: TODAY, ending: g.current.state!.over!.endingId, cards: g.current.state!.cardCount });
    expect(g.current.meta.dailies).toEqual([fold.daily]);
    render(<Ending lib={library} state={g.current.state!} fold={fold} onPlayAgain={noop} onCodex={noop} onSettings={noop} today={TODAY} />);
    expect(screen.getByText(`Daily #3 · ${STRINGS.daily.streakFirst}`)).toBeTruthy();
    const month = screen.getByRole("region", { name: STRINGS.daily.title });
    expect(within(month).getByRole("heading", { name: "September 2026" })).toBeTruthy();
    expect(within(month).getAllByRole("listitem")).toHaveLength(1);
    // Said once, near the top, not again under the month.
    expect(within(month).queryByText(STRINGS.daily.streakFirst)).toBeNull();
  });

  it("is still the daily when it was left in one tab and finished in another", () => {
    today();
    const first = renderHook(() => useGame(library));
    act(() => first.result.current.startDaily("left"));
    for (let i = 0; i < 5; i++) act(() => first.result.current.choose("left", T));
    // The tab closes. The run was saved on every choice, the day it is the daily of with it.
    first.unmount();
    const g = renderHook(() => useGame(library)).result;
    expect(g.current.savedDaily).toEqual({ day: TODAY, seed: dailySeed(TODAY) });
    act(() => g.current.continueSaved());
    finish(g);
    expect(g.current.meta.dailies.map((d) => d.day)).toEqual([TODAY]);
    expect(g.current.lastFold?.daily?.day).toBe(TODAY);
  });

  it("is not the daily when an ordinary run is left and finished later", () => {
    today();
    const first = renderHook(() => useGame(library));
    act(() => first.result.current.start(2024, "left"));
    act(() => first.result.current.choose("left", T));
    first.unmount();
    const g = renderHook(() => useGame(library)).result;
    expect(g.current.savedDaily).toBeNull();
    act(() => g.current.continueSaved());
    finish(g);
    expect(g.current.meta.dailies).toEqual([]);
  });

  it("says on the menu that the run waiting to be continued is a daily", () => {
    today();
    const first = renderHook(() => useGame(library));
    act(() => first.result.current.startDaily("right"));
    act(() => first.result.current.choose("left", T));
    act(() => first.result.current.exitToMenu());
    const g = first.result.current;
    render(<Setup lib={library} saved={g.saved} savedDaily={g.savedDaily} meta={g.meta} onStart={noop} onDaily={noop} onContinue={noop} onCodex={noop} onSettings={noop} today={TODAY} />);
    expect(screen.getByRole("button", { name: /Continue saved run.*Daily #3/ })).toBeTruthy();
  });
});
