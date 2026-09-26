import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { PlayerAlign } from "../engine/types";
import { edgesLine, startsLine } from "./setup";

interface Props {
  lib: Library;
  modifiers: readonly string[];
  /** Compact drops the blurbs, for the ending screen. */
  compact?: boolean;
  /** Whose run, for the names of its groups in what the setup starts (BACKLOG-11 phase 73). */
  align?: PlayerAlign;
}

/** The drawn run setup: opening crisis, leader trait and flaw (5.9). */
export function SetupSummary({ lib, modifiers, compact, align = "left" }: Props) {
  const rows = modifiers
    .map((id) => ({ id, kind: lib.modifiers.get(id)?.kind, text: STRINGS.modifiers[id] }))
    .filter((r): r is { id: string; kind: "crisis" | "trait" | "flaw"; text: { name: string; blurb: string } } => !!r.kind && !!r.text);
  if (rows.length === 0) return null;
  if (compact) {
    return <p className="setup-compact">{rows.map((r) => r.text.name).join(" · ")}</p>;
  }
  const edges = edgesLine(lib, modifiers, align);
  return (
    <>
      <dl className="setup-summary">
        {rows.map((r) => {
          const starts = startsLine(lib, r.id, align);
          return (
            <div key={r.id} className="setup-row">
              <dt>{STRINGS.setupLabels[r.kind]}</dt>
              <dd>
                <b>{r.text.name}</b>
                <span>{r.text.blurb}</span>
                {starts && <span className="setup-starts">{starts}</span>}
              </dd>
            </div>
          );
        })}
      </dl>
      {edges && <p className="setup-edges">{edges}</p>}
    </>
  );
}
