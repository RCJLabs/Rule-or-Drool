// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Frame } from "../../src/ui/Frame";
import { STRINGS } from "../../src/content/strings";
import { PathChrome, StreamAlerts, StreamGutters } from "../../src/ui/PathChrome";
import { CardView } from "../../src/ui/CardView";
import { library } from "../../src/content";
import { getCard } from "../../src/engine/library";
import { STAGE_AT, themeFor } from "../../src/ui/theme";

/**
 * The two paths (BACKLOG-3 phase 18). These guard the shape of the ladder and the rule that
 * makes the look survivable — everything the path draws is decoration, and decoration never
 * covers anything you read or tap. Where it actually lands on screen is geometry and is
 * checked in the browser against the built bundle, not here.
 */
afterEach(() => cleanup());

const at = (drift: number) => themeFor(drift);

describe("the stream, on the way down", () => {
  it("arrives in three stages rather than all at once", () => {
    const show = (drift: number) => {
      const { container } = render(<PathChrome theme={at(drift)} seed={3} n={7} />);
      const gut = render(<StreamGutters theme={at(drift)} seed={3} n={7} />);
      const al = render(<StreamAlerts theme={at(drift)} seed={3} n={7} />);
      return {
        live: !!container.querySelector(".stream-live"),
        alerts: al.container.querySelectorAll(".stream-alert").length,
        goal: !!container.querySelector(".stream-goal"),
        chat: gut.container.querySelectorAll(".stream-chat p").length,
        emotes: gut.container.querySelectorAll(".stream-emotes span").length,
      };
    };
    expect(show(-STAGE_AT[0] + 1)).toMatchObject({ live: false, chat: 0, alerts: 0 });
    expect(show(-STAGE_AT[0])).toMatchObject({ live: true, chat: 0, alerts: 0, goal: false });
    const two = show(-STAGE_AT[1]);
    expect(two).toMatchObject({ live: true, alerts: 1, goal: false, emotes: 0 });
    expect(two.chat).toBeGreaterThan(0);
    const three = show(-STAGE_AT[2]);
    expect(three).toMatchObject({ live: true, alerts: 2, goal: true });
    expect(three.emotes).toBeGreaterThan(0);
    expect(three.chat).toBeGreaterThan(two.chat);
  });

  it("says the same thing twice for the same card, and something else for the next", () => {
    const text = (n: number) => render(<StreamGutters theme={at(-40)} seed={11} n={n} />).container.textContent;
    expect(text(4)).toBe(text(4));
    expect(text(4)).not.toBe(text(5));
  });

  it("is decoration: hidden from a screen reader and never a target", () => {
    const { container } = render(<PathChrome theme={at(-40)} seed={1} n={1} />);
    const gut = render(<StreamGutters theme={at(-40)} seed={1} n={1} />);
    expect(container.querySelector(".stream")?.getAttribute("aria-hidden")).toBe("true");
    for (const el of gut.container.children) expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("button")).toBeNull();
    expect(gut.container.querySelector("button")).toBeNull();
  });
});

describe("the run screen fits the phone it is on", () => {
  // The geometry itself is checked in a browser against the built bundle at seven viewport
  // sizes; what belongs here is the rule that decides which screens may grow. A run has to
  // show the meters and the footer at once — it was scrolling on a 640px phone — and the
  // codex, the setup and the ending are documents and scroll like documents.
  it("fills the viewport for a run and lets the documents grow", () => {
    const run = render(
      <Frame theme={at(0)} seed={1} n={1} fill>
        <p>run</p>
      </Frame>,
    );
    expect(run.container.querySelector(".frame")!.hasAttribute("data-fill")).toBe(true);
    cleanup();
    const doc = render(
      <Frame theme={at(0)} seed={1} n={1}>
        <p>codex</p>
      </Frame>,
    );
    expect(doc.container.querySelector(".frame")!.hasAttribute("data-fill")).toBe(false);
  });

  it("puts the alerts in the column rather than floating them over the footer", () => {
    // Floating cost a reserved strip of the footer, which a short phone cannot afford.
    const { container } = render(
      <Frame theme={at(-40)} seed={1} n={1} fill>
        <p>run</p>
      </Frame>,
    );
    const frame = container.querySelector(".frame")!;
    const alerts = container.querySelector(".stream-alerts")!;
    expect(alerts.parentElement).toBe(frame);
    expect(container.querySelector(".stream")!.contains(alerts)).toBe(false);
  });
});

describe("the projection, on the way up", () => {
  it("deepens rather than getting louder, and brings no stream with it", () => {
    const panes = (drift: number) => {
      const { container } = render(<PathChrome theme={at(drift)} seed={3} n={7} />);
      return {
        panes: container.querySelectorAll(".holo-pane").length,
        plinth: !!container.querySelector(".holo-plinth"),
        stream: !!container.querySelector(".stream-live"),
      };
    };
    expect(panes(STAGE_AT[0] - 1)).toMatchObject({ panes: 0, plinth: false });
    expect(panes(STAGE_AT[0])).toMatchObject({ panes: 0, plinth: true, stream: false });
    expect(panes(STAGE_AT[1])).toMatchObject({ panes: 1, plinth: true });
    expect(panes(STAGE_AT[2])).toMatchObject({ panes: 2, plinth: true });
  });

  it("has no gutters, because nothing is shouting", () => {
    expect(render(<StreamGutters theme={at(60)} seed={1} n={1} />).container.childElementCount).toBe(0);
  });
});

describe("a card says why it is here", () => {
  // 11.9 cards a run arrive because of an earlier choice and 2.4 because of a pattern of
  // them; neither used to be distinguishable from the 77 that were simply dealt.
  const view = (from: "deck" | "queue" | "habit" | null) =>
    render(
      <CardView
        card={getCard(library, "a01_surplus")}
        text="text"
        speakerName="Someone"
        roleLabel="Treasurer"
        advisorId="adv_vole"
        seed={1}
        from={from}
        peek={null}
        leaving={null}
        onDrag={() => {}}
        onCommit={() => {}}
      />,
    ).container.querySelector(".card")!;

  it("marks a bill and a habit differently, and marks a dealt card not at all", () => {
    expect(view("queue").className).toContain("card-bill");
    expect(view("habit").className).toContain("card-habit");
    const plain = view("deck").className;
    expect(plain).not.toContain("card-bill");
    expect(plain).not.toContain("card-habit");
    expect(view(null).className).not.toContain("card-bill");
  });

  it("says out loud what the mark says silently", () => {
    // The mark is drawn, so the claim has to reach a screen reader some other way.
    expect(view("queue").querySelector(".sr-only")?.textContent).toBe(STRINGS.ui.cameBack);
    expect(view("habit").querySelector(".sr-only")?.textContent).toBe(STRINGS.ui.aHabit);
    expect(view("deck").querySelector(".sr-only")).toBeNull();
  });
});
