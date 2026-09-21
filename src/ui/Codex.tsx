import { STRINGS } from "../content/strings";
import { epilogueKey } from "../engine/endings";
import type { Library } from "../engine/library";
import { OBJECTIVES, codexProgress, type MetaState } from "../meta";
import { Frame } from "./Frame";
import { themeFor } from "./theme";

interface Props {
  lib: Library;
  meta: MetaState;
  onBack: () => void;
}

/** Collected endings, futures and objectives (5.10). Unseen entries stay blank on purpose. */
export function Codex({ lib, meta, onBack }: Props) {
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
        </header>

        <p className="codex-progress">
          {STRINGS.codex.endings} {p.endingsSeen}/{p.endingsTotal} · {STRINGS.codex.epilogues} {p.epiloguesSeen}/{p.epiloguesTotal} ·{" "}
          {STRINGS.codex.objectives} {p.objectivesDone}/{p.objectivesTotal}
        </p>

        <section>
          <h2>{STRINGS.codex.endings}</h2>
          <ul className="codex-list">
            {endings.map((e) => {
              const count = meta.endings[e.id] ?? 0;
              return (
                <li key={e.id} className={count ? "found" : "locked"}>
                  <b>{count ? e.title : "· · ·"}</b>
                  <span>{count ? e.text : STRINGS.ui.locked}</span>
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
