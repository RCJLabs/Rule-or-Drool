import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";

interface Props {
  lib: Library;
  modifiers: readonly string[];
  /** Compact drops the blurbs, for the ending screen. */
  compact?: boolean;
}

/** The drawn run setup: opening crisis, leader trait and flaw (5.9). */
export function SetupSummary({ lib, modifiers, compact }: Props) {
  const rows = modifiers
    .map((id) => ({ id, kind: lib.modifiers.get(id)?.kind, text: STRINGS.modifiers[id] }))
    .filter((r): r is { id: string; kind: "crisis" | "trait" | "flaw"; text: { name: string; blurb: string } } => !!r.kind && !!r.text);
  if (rows.length === 0) return null;
  if (compact) {
    return <p className="setup-compact">{rows.map((r) => r.text.name).join(" · ")}</p>;
  }
  return (
    <dl className="setup-summary">
      {rows.map((r) => (
        <div key={r.id} className="setup-row">
          <dt>{STRINGS.setupLabels[r.kind]}</dt>
          <dd>
            <b>{r.text.name}</b>
            <span>{r.text.blurb}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
