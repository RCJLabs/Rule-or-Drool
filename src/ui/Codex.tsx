import { STRINGS } from "../content/strings";
import { arcOutcomes, epilogueKey } from "../engine/endings";
import type { Library } from "../engine/library";
import { MANDATES } from "../engine/mandates";
import { HISTORY_ORDER, LEGACIES, NO_LEGACY, OBJECTIVES, codexProgress, historyTitle, type MetaState } from "../meta";
import { Frame } from "./Frame";
import { themeFor } from "./theme";

interface Props {
  lib: Library;
  meta: MetaState;
  onBack: () => void;
  onSettings: () => void;
}

/** Collected endings, futures and objectives (5.10). Unseen entries stay blank on purpose. */
export function Codex({ lib, meta, onBack, onSettings }: Props) {
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
  const endings = [...lib.endings.values()];
  const epilogues = [...new Map(lib.epilogues.map((e) => [epilogueKey(e), e])).values()];

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

        <p className="codex-progress">
          {STRINGS.codex.stories} {p.storiesSeen}/{p.storiesTotal} · {STRINGS.codex.endings} {p.endingsSeen}/{p.endingsTotal} ·{" "}
          {STRINGS.codex.epilogues} {p.epiloguesSeen}/{p.epiloguesTotal} · {STRINGS.codex.legacies} {p.legaciesSeen}/{p.legaciesTotal} ·{" "}
          {STRINGS.codex.historiesShort} {p.historiesSeen}/{p.historiesTotal} ·{" "}
          {STRINGS.codex.objectives} {p.objectivesDone}/{p.objectivesTotal}
        </p>

        <section>
          <h2>{STRINGS.codex.history}</h2>
          {meta.history.length === 0 ? (
            <p className="codex-empty">{STRINGS.codex.noHistory}</p>
          ) : (
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
          )}
        </section>

        <section>
          <h2>{STRINGS.codex.stories}</h2>
          <ul className="codex-list">
            {[...lib.arcs.keys()].map((arcId) => {
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
            {meta.arcOutcomes.length === 0 && <li className="locked">{STRINGS.codex.empty}</li>}
          </ul>
        </section>

        <section>
          <h2>{STRINGS.codex.mandates}</h2>
          <ul className="codex-list">
            {MANDATES.map((m) => {
              const kept = meta.mandatesKept[m.id] ?? 0;
              const broken = meta.mandatesBroken[m.id] ?? 0;
              return (
                <li key={m.id} className={kept ? "found" : broken ? "attempted" : "locked"}>
                  <b>{m.title}</b>
                  <span>
                    {kept || broken
                      ? `kept ${kept}, broken ${broken}`
                      : STRINGS.codex.noMandates}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* The collection a run is named into (post-run histories). Only the found ones are
            listed: 198 rows of dots is noise, and the count says how much is left. */}
        <section>
          <h2>{STRINGS.codex.histories}</h2>
          {found.length === 0 ? (
            <p className="codex-empty">{STRINGS.codex.noHistories}</p>
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
          <p className="codex-foot">{STRINGS.codex.unwritten.replace("{n}", String(p.historiesTotal - p.historiesSeen))}</p>
        </section>

        <section>
          <h2>{STRINGS.codex.legacies}</h2>
          <ul className="codex-list">
            {Object.entries(LEGACIES).map(([flag, label]) => {
              const n = meta.legacies[flag] ?? 0;
              return (
                <li key={flag} className={n ? "found" : "locked"}>
                  <b>{n ? label : "· · ·"}</b>
                  <span>{n ? `left behind ${n} time${n === 1 ? "" : "s"}` : STRINGS.ui.locked}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2>{STRINGS.codex.cabinet}</h2>
          <ul className="codex-list">
            {[...lib.advisorsById.values()]
              .filter((a) => (meta.advisorsKept[a.id] ?? 0) + (meta.advisorsFired[a.id] ?? 0) > 0)
              .map((a) => {
                const kept = meta.advisorsKept[a.id] ?? 0;
                const fired = meta.advisorsFired[a.id] ?? 0;
                return (
                  <li key={a.id} className="found">
                    <b>{a.name}</b>
                    <span>
                      {STRINGS.roles[a.role] ?? a.role} · {STRINGS.codex.kept} {kept} · {STRINGS.codex.fired} {fired}
                    </span>
                  </li>
                );
              })}
            {meta.runs === 0 && <li className="locked">{STRINGS.codex.empty}</li>}
          </ul>
        </section>

        <section>
          <h2>{STRINGS.codex.endings}</h2>
          <ul className="codex-list">
            {endings.map((e) => {
              const count = meta.endings[e.id] ?? 0;
              // An ending you have been within reach of is named rather than hidden, so it
              // becomes something to aim at instead of a blank row (phase 13).
              const nearly = !count && meta.nearMissed.includes(e.id);
              return (
                <li key={e.id} className={count ? "found" : nearly ? "nearly" : "locked"}>
                  <b>{count || nearly ? e.title : "· · ·"}</b>
                  <span>{count ? e.text : nearly ? STRINGS.ui.cameClose : STRINGS.ui.locked}</span>
                  {count > 1 && <em>seen {count} times</em>}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2>{STRINGS.codex.epilogues}</h2>
          <ul className="codex-list">
            {epilogues.map((e) => {
              const key = epilogueKey(e);
              const found = meta.epilogues.includes(key);
              return (
                <li key={key} className={found ? "found" : "locked"}>
                  <b>
                    {STRINGS.bands[e.band]} · era {e.era}
                    {e.align !== "any" && ` · ${STRINGS.parties[e.align]}`}
                  </b>
                  <span>{found ? e.text : STRINGS.ui.locked}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2>{STRINGS.codex.objectives}</h2>
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
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="codex-foot">
          Runs finished {meta.runs} · longest {meta.bestCards} cards
          {meta.daily && ` · daily ${meta.daily.day}: ${meta.daily.cards} cards`}
        </footer>
      </div>
    </Frame>
  );
}
