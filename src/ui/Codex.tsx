import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { STRINGS } from "../content/strings";
import { arcOutcomes, epilogueKey } from "../engine/endings";
import type { Library } from "../engine/library";
import { MANDATES } from "../engine/mandates";
import { CLUES, HISTORY_ORDER, LEGACIES, NO_LEGACY, OBJECTIVES, answeredQuestions, codexProgress, historyTitle, rumours, todayKey, type MetaState } from "../meta";
import { DailyMonth } from "./DailyMonth";
import { Frame } from "./Frame";
import { themeFor } from "./theme";

/** The codex's sections, each opened on its own. */
export type CodexSection =
  | "runs"
  | "dailies"
  | "objectives"
  | "endings"
  | "futures"
  | "stories"
  | "questions"
  | "promises"
  | "histories"
  | "legacies"
  | "people";

interface Props {
  lib: Library;
  meta: MetaState;
  onBack: () => void;
  onSettings: () => void;
  /** Today's UTC day, for the dailies; the clock's by default. */
  today?: string;
  /** The section open, when the caller keeps it, so leaving the codex and coming back finds it open. */
  open?: CodexSection | null;
  onOpen?: (section: CodexSection | null) => void;
}

interface Section {
  key: CodexSection;
  title: string;
  /** How much of it is found, as the row says it: "3/77", or a plain count. */
  count: string;
  body: () => ReactNode;
}

/** The rows not found yet, as one line rather than a row of dots each. */
function rest(n: number, anyFound: boolean): ReactNode {
  if (n === 0) return null;
  return <p className="codex-foot">{(anyFound ? STRINGS.codex.moreNotFound : STRINGS.codex.notFound).replace("{n}", String(n))}</p>;
}

/**
 * Collected endings, futures and objectives (5.10), and everything the codex has gathered
 * since. It was one screen of eleven sections, thirty phone screens long for a player forty
 * runs in, most of it rows of dots. Now it is an index: four groups of sections, each a row
 * saying how much of it is found, opened one at a time where it stands. Entries not found yet
 * are counted rather than listed, as the histories already were: the count says how much is
 * left, which is all a blank row said.
 */
export function Codex({ lib, meta, onBack, onSettings, today = todayKey(), open: kept, onOpen }: Props) {
  const [own, setOwn] = useState<CodexSection | null>(null);
  const open = kept !== undefined ? kept : own;
  const setOpen = onOpen ?? setOwn;
  const rows = useRef(new Map<CodexSection, HTMLElement>());
  const ids = useId();

  // The section opened comes to the top of the screen, since the one it closed may have been
  // above it and taken the screen with it.
  useEffect(() => {
    if (!open) return;
    const smooth = !document.documentElement.hasAttribute("data-reduce-motion");
    rows.current.get(open)?.scrollIntoView?.({ block: "start", behavior: smooth ? "smooth" : "auto" });
  }, [open]);

  const p = codexProgress(lib, meta);
  // Found histories in the order that ranks them, so the list reads from the biggest things
  // a run can do down to the habits every run has.
  const rank = (key: string) => {
    const i = HISTORY_ORDER.indexOf(key.split(":")[0]!);
    return i < 0 ? HISTORY_ORDER.length : i;
  };
  const found = Object.entries(meta.histories ?? {})
    .map(([key, n]) => {
      const sig = key.split(":")[0]!;
      return { key, n, title: historyTitle(key) ?? key, label: sig === NO_LEGACY ? "" : (LEGACIES[sig] ?? sig) };
    })
    .sort((a, b) => rank(a.key) - rank(b.key) || a.title.localeCompare(b.title));
  const questions = answeredQuestions(lib, meta);
  const endings = [...lib.endings.values()];
  const epilogues = [...new Map(lib.epilogues.map((e) => [epilogueKey(e), e])).values()];
  const met = [...lib.advisorsById.values()].filter((a) => (meta.advisorsKept[a.id] ?? 0) + (meta.advisorsFired[a.id] ?? 0) > 0);
  const promised = MANDATES.filter((m) => (meta.mandatesKept[m.id] ?? 0) + (meta.mandatesBroken[m.id] ?? 0) > 0).length;
  const c = STRINGS.codex;

  const groups: { title: string; sections: Section[] }[] = [
    {
      title: c.groups.record,
      sections: [
        {
          key: "runs",
          title: c.history,
          count: String(meta.runs),
          body: () =>
            meta.history.length === 0 ? (
              <p className="codex-empty">{c.noHistory}</p>
            ) : (
              <>
                <p className="codex-foot">
                  Runs finished {meta.runs} · longest {meta.bestCards} cards
                </p>
                <ol className="codex-history">
                  {meta.history.map((r, i) => (
                    <li key={`${r.endingId}-${i}`}>
                      {r.history && historyTitle(r.history) && <b className="codex-run-history">{historyTitle(r.history)}</b>}
                      {r.road && <em className="codex-road">{STRINGS.road.mark}</em>}
                      <b>
                        {STRINGS.parties[r.align]} · {r.cards} cards · {STRINGS.bands[r.band]}
                      </b>
                      <span>
                        {lib.endings.get(r.endingId)?.title ?? r.endingId}
                        {r.rival && `, against ${lib.advisorsById.get(r.rival)?.name ?? "a rival"}`}
                      </span>
                      {r.mandate && (
                        <em className={r.mandateKept ? "kept" : "broken"}>
                          {MANDATES.find((m) => m.id === r.mandate)?.title ?? r.mandate} —{" "}
                          {r.mandateKept ? STRINGS.ui.mandateKept : STRINGS.ui.mandateBroken}
                        </em>
                      )}
                      {r.legacies.length > 0 && <em>{r.legacies.map((f) => LEGACIES[f] ?? f).join(" · ")}</em>}
                    </li>
                  ))}
                </ol>
              </>
            ),
        },
        {
          key: "dailies",
          title: STRINGS.daily.title,
          count: String(meta.dailies.length),
          body: () => <DailyMonth lib={lib} dailies={meta.dailies} today={today} browse />,
        },
        {
          key: "objectives",
          title: c.objectives,
          count: `${p.objectivesDone}/${p.objectivesTotal}`,
          body: () => (
            <ul className="codex-list">
              {OBJECTIVES.map((o) => {
                const done = o.id in meta.objectives;
                return (
                  <li key={o.id} className={done ? "found" : ""}>
                    <b>
                      {done ? "✓ " : ""}
                      {o.title}
                    </b>
                    <span>{o.hint}</span>
                    {o.unlocks && <em>{done ? `${STRINGS.ui.unlocked}: ` : "Unlocks "}{STRINGS.unlockNames[o.unlocks]}</em>}
                    {o.opens && <em>{done ? `${STRINGS.ui.unlocked}: ${STRINGS.reign.opened}` : STRINGS.reign.opens}</em>}
                  </li>
                );
              })}
            </ul>
          ),
        },
      ],
    },
    {
      title: c.groups.ending,
      sections: [
        {
          key: "endings",
          title: c.endings,
          count: `${p.endingsSeen}/${p.endingsTotal}`,
          body: () => {
            // An ending you have been within reach of is named rather than hidden, so it
            // becomes something to aim at (phase 13). One more is rumoured, by its clue and not its
            // name, a different one each run (BACKLOG-10 phase 58); the rest are counted.
            const shown = endings.filter((e) => (meta.endings[e.id] ?? 0) > 0 || meta.nearMissed.includes(e.id));
            const rumoured = rumours(lib, meta);
            return (
              <>
                {shown.length > 0 && (
                  <ul className="codex-list">
                    {shown.map((e) => {
                      const count = meta.endings[e.id] ?? 0;
                      return (
                        <li key={e.id} className={count ? "found" : "nearly"}>
                          <b>{e.title}</b>
                          <span>{count ? e.text : `${STRINGS.ui.cameClose} ${CLUES[e.id] ?? ""}`.trim()}</span>
                          {count > 1 && <em>seen {count} times</em>}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {rumoured.length > 0 && (
                  <>
                    <p className="codex-foot">{c.rumours}</p>
                    <ul className="codex-list">
                      {rumoured.map((id) => (
                        <li key={id} className="locked rumour">
                          <span>{CLUES[id]}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {rest(endings.length - shown.length - rumoured.length, shown.length + rumoured.length > 0)}
              </>
            );
          },
        },
        {
          key: "futures",
          title: c.epilogues,
          count: `${p.epiloguesSeen}/${p.epiloguesTotal}`,
          body: () => {
            const seen = epilogues.filter((e) => meta.epilogues.includes(epilogueKey(e)));
            return (
              <>
                {seen.length > 0 && (
                  <ul className="codex-list">
                    {seen.map((e) => (
                      <li key={epilogueKey(e)} className="found">
                        <b>
                          {STRINGS.bands[e.band]} · era {e.era}
                          {e.align !== "any" && ` · ${STRINGS.parties[e.align]}`}
                        </b>
                        <span>{e.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {rest(epilogues.length - seen.length, seen.length > 0)}
              </>
            );
          },
        },
      ],
    },
    {
      title: c.groups.along,
      sections: [
        {
          key: "stories",
          title: c.stories,
          count: `${p.storiesSeen}/${p.storiesTotal}`,
          body: () => (
            <ul className="codex-list">
              {[...lib.arcs.values()].map(({ id: arcId, question }) => {
                if (question !== undefined) return null;
                const outcomes = arcOutcomes(lib, arcId);
                const seen = outcomes.filter((o) => meta.arcOutcomes.includes(o.key));
                if (seen.length === 0) return null;
                return (
                  <li key={arcId} className="found">
                    <b>
                      {seen.length}/{outcomes.length} endings
                    </b>
                    <span>{seen.map((o) => o.label).join(" · ")}</span>
                  </li>
                );
              })}
              {p.storiesSeen === 0 && <li className="locked">{c.empty}</li>}
            </ul>
          ),
        },
        {
          // Each question, and how you have answered it across your runs (BACKLOG-6 phase 42).
          // One you have not been asked stays blank: sixteen rows say what there is to be asked.
          key: "questions",
          title: c.questions,
          count: `${p.questionsAsked}/${p.questionsTotal}`,
          body: () => (
            <ul className="codex-list">
              {questions.map(({ id, answers, asked }) => (
                <li key={id} className={asked ? "found" : "locked"}>
                  <b>{asked ? (STRINGS.questions.titles[id] ?? id) : "· · ·"}</b>
                  <span>{asked ? answers.map((a) => `${a.label} ${a.times}`).join(" · ") : c.notAsked}</span>
                </li>
              ))}
            </ul>
          ),
        },
        {
          key: "promises",
          title: c.mandates,
          count: `${promised}/${MANDATES.length}`,
          body: () => (
            <ul className="codex-list">
              {MANDATES.map((m) => {
                const kept = meta.mandatesKept[m.id] ?? 0;
                const broken = meta.mandatesBroken[m.id] ?? 0;
                return (
                  <li key={m.id} className={kept ? "found" : broken ? "attempted" : "locked"}>
                    <b>{m.title}</b>
                    <span>{kept || broken ? `kept ${kept}, broken ${broken}` : c.noMandates}</span>
                  </li>
                );
              })}
            </ul>
          ),
        },
      ],
    },
    {
      title: c.groups.remembered,
      sections: [
        {
          // The collection a run is named into (post-run histories). Only the found ones are
          // listed: 657 rows of dots is noise, and the count says how much is left.
          key: "histories",
          title: c.histories,
          count: `${p.historiesSeen}/${p.historiesTotal}`,
          body: () => (
            <>
              {found.length === 0 ? (
                <p className="codex-empty">{c.noHistories}</p>
              ) : (
                <ul className="codex-list">
                  {found.map(({ key, title, label, n }) => (
                    <li key={key} className="found">
                      <b>{title}</b>
                      <span>
                        {label}
                        {n > 1 ? ` · ${n} times` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="codex-foot">{c.unwritten.replace("{n}", String(p.historiesTotal - p.historiesSeen))}</p>
            </>
          ),
        },
        {
          key: "legacies",
          title: c.legacies,
          count: `${p.legaciesSeen}/${p.legaciesTotal}`,
          body: () => {
            const left = Object.entries(LEGACIES).filter(([flag]) => (meta.legacies[flag] ?? 0) > 0);
            return (
              <>
                {left.length > 0 && (
                  <ul className="codex-list">
                    {left.map(([flag, label]) => {
                      const n = meta.legacies[flag] ?? 0;
                      return (
                        <li key={flag} className="found">
                          <b>{label}</b>
                          <span>{`left behind ${n} time${n === 1 ? "" : "s"}`}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {rest(Object.keys(LEGACIES).length - left.length, left.length > 0)}
              </>
            );
          },
        },
        {
          key: "people",
          title: c.cabinet,
          count: `${met.length}/${lib.advisorsById.size}`,
          body: () => (
            <ul className="codex-list">
              {met.map((a) => {
                const kept = meta.advisorsKept[a.id] ?? 0;
                const fired = meta.advisorsFired[a.id] ?? 0;
                return (
                  <li key={a.id} className="found">
                    <b>{a.name}</b>
                    <span>
                      {STRINGS.roles[a.role] ?? a.role} · {c.kept} {kept} · {c.fired} {fired}
                    </span>
                  </li>
                );
              })}
              {met.length === 0 && <li className="locked">{c.empty}</li>}
            </ul>
          ),
        },
      ],
    },
  ];

  return (
    <Frame theme={themeFor(0)} seed={0} n={0}>
      <div className="codex">
        <header className="codex-head">
          <button type="button" onClick={onBack}>
            {STRINGS.ui.back}
          </button>
          <h1>{STRINGS.ui.codex}</h1>
          <button type="button" className="gear" onClick={onSettings} aria-label={STRINGS.ui.settings}>
            ⚙
          </button>
        </header>

        {groups.map((g) => (
          <section key={g.title} className="codex-group">
            <h2>{g.title}</h2>
            {g.sections.map((s) => {
              const isOpen = open === s.key;
              const panel = `${ids}-${s.key}`;
              return (
                <div key={s.key} className="codex-section" data-section={s.key}>
                  <h3
                    className="codex-row-h"
                    ref={(el) => {
                      if (el) rows.current.set(s.key, el);
                      else rows.current.delete(s.key);
                    }}
                  >
                    <button type="button" className="codex-row" aria-expanded={isOpen} aria-controls={isOpen ? panel : undefined} onClick={() => setOpen(isOpen ? null : s.key)}>
                      <span className="codex-row-title">{s.title}</span>
                      <span className="codex-row-count">{s.count}</span>
                      <svg className="codex-chevron" viewBox="0 0 12 8" aria-hidden="true">
                        <path d="M1 1.5l5 5 5-5" />
                      </svg>
                    </button>
                  </h3>
                  {isOpen && (
                    <div id={panel} className="codex-panel">
                      {s.body()}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </Frame>
  );
}
