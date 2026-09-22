// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { library } from "../../src/content";
import { newRun, replaceAdvisor } from "../../src/engine/state";
import { STRINGS } from "../../src/content/strings";
import { Cabinet } from "../../src/ui/Cabinet";

describe("Cabinet", () => {
  afterEach(() => cleanup());

  it("names everyone in the room and says what their trait does", () => {
    const s = newRun(library, 21, { align: "left" });
    render(<Cabinet lib={library} state={s} onClose={() => {}} />);
    for (const role of library.roles) {
      if (role === library.config.rivalRole) continue;
      const advisor = library.advisorsById.get(s.cabinet[role]!)!;
      expect(screen.getAllByText(advisor.name).length, advisor.name).toBeGreaterThan(0);
      // The trait is the mechanic this screen exists to expose, so it must be in words.
      for (const t of advisor.traits) {
        const blurb = STRINGS.traits[t]?.blurb;
        if (blurb) expect(screen.getAllByText(blurb).length, `${advisor.name}: ${t}`).toBeGreaterThan(0);
      }
    }
  });

  it("shows the rival as somebody you do not employ", () => {
    const s = newRun(library, 21, { align: "left" });
    const rival = library.advisorsById.get(s.cabinet[library.config.rivalRole]!)!;
    render(<Cabinet lib={library} state={s} onClose={() => {}} />);
    expect(screen.getByText(new RegExp(STRINGS.cabinet.rival))).toBeTruthy();
    expect(rival.align).not.toBe(s.align);
  });

  it("separates the people you kept from the one you just appointed", () => {
    const base = { ...newRun(library, 21, { align: "left" }), cardCount: 60 };
    const after = replaceAdvisor(library, base, "chief");
    render(<Cabinet lib={library} state={after} onClose={() => {}} />);
    // The survivors read as original; the replacement reads as new.
    expect(screen.getAllByText(new RegExp(STRINGS.cabinet.sinceStart)).length).toBeGreaterThan(0);
    expect(screen.getByText(new RegExp(STRINGS.cabinet.newToday))).toBeTruthy();
  });

  it("remembers who was let go to make room", () => {
    const s = newRun(library, 21, { align: "left" });
    const gone = library.advisorsById.get(s.cabinet.chief!)!;
    const after = { ...s, stats: { ...s.stats, firedAdvisors: [gone.id] } };
    render(<Cabinet lib={library} state={after} onClose={() => {}} />);
    expect(screen.getByText(new RegExp(`${STRINGS.cabinet.letGo} ${gone.name}`))).toBeTruthy();
  });

  it("says where you left it when they asked you for something", () => {
    const s = newRun(library, 21, { align: "left" });
    render(<Cabinet lib={library} state={{ ...s, flags: [...s.flags, "owed_chief", "snubbed_judge"] }} onClose={() => {}} />);
    expect(screen.getByText(STRINGS.cabinet.owed)).toBeTruthy();
    expect(screen.getByText(STRINGS.cabinet.snubbed)).toBeTruthy();
  });

  it("says nothing about people who have not asked yet", () => {
    const s = newRun(library, 21, { align: "left" });
    render(<Cabinet lib={library} state={s} onClose={() => {}} />);
    expect(screen.queryByText(STRINGS.cabinet.owed)).toBeNull();
    expect(screen.queryByText(STRINGS.cabinet.snubbed)).toBeNull();
  });
});
