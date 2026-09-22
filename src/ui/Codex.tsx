import { STRINGS } from "../content/strings";
import { arcOutcomes, epilogueKey } from "../engine/endings";
import type { Library } from "../engine/library";
import { LEGACIES, OBJECTIVES, codexProgress, type MetaState } from "../meta";
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
                  <b>
                    {STRINGS.parties[r.align]} · {r.cards} cards · {STRINGS.bands[r.band]}
                  </b>
                  <span>
                    {lib.endings.get(r.endingId)?.title ?? r.endingId}
                    {r.rival && `, against ${lib.advisorsById.get(r.rival)?.name ?? "a rival"}`}
                  </span>
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
