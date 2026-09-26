import { useState } from "react";
import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { MANDATES } from "../engine/mandates";
import { BANDS } from "../engine/types";
import { beforeChronicle, habitsOf, HISTORY_ORDER, historyTitle, LEGACIES, type ChronicleEntry, type EndingKind, type MetaState } from "../meta";
import { lineName } from "./dynasty";

interface Props {
  lib: Library;
  meta: MetaState;
}

/** Reigns shown at a time: the latest first, and as many more each time the player asks. */
export const CHRONICLE_PAGE = 20;

const KINDS: readonly EndingKind[] = ["finished", "chosen", "fallen"];
/** What a reign left, named: the biggest few, as history ranks them, and a count of the rest. */
export const LEFT_SHOWN = 3;
const rank = (flag: string) => {
  const i = HISTORY_ORDER.indexOf(flag);
  return i < 0 ? HISTORY_ORDER.length : i;
};

/**
 * The chronicle in the codex (BACKLOG-12 phase 76): every run the profile has finished, as one
 * country's history, and a few lines on how the player has ruled. The lines count what the player
 * did and say nothing of whether it was well done. The reigns are the latest first, a page at a
 * time, each numbered as the run it was.
 */
export function Chronicle({ lib, meta }: Props) {
  const [shown, setShown] = useState(CHRONICLE_PAGE);
  const w = STRINGS.chronicle;
  const entries = meta.chronicle;
  if (entries.length === 0) return <p className="codex-empty">{meta.runs === 0 ? STRINGS.codex.noHistory : w.next}</p>;

  const h = habitsOf(lib, entries);
  const before = beforeChronicle(meta);
  const latest = [...entries].reverse();
  const more = Math.max(0, latest.length - shown);
  const partial = (text: string, reigns: number) => (reigns < h.reigns ? `${text}${(reigns === 1 ? w.inLastOne : w.inLast).replace("{n}", String(reigns))}` : text);
  const longest = Math.max(...entries.map((e) => e.cards));

  const votes =
    h.votes.held === 0
      ? partial(w.noneHeld, h.votes.reigns)
      : partial(
          (h.votes.lost ? w.votesLost : w.votesOf)
            .replace("{h}", String(h.votes.honest))
            .replace("{t}", String(h.votes.held))
            .replace("{l}", String(h.votes.lost)),
          h.votes.reigns,
        );
  const rows: [string, string][] = [
    [w.reigns, w.reignsOf.replace("{n}", String(h.reigns)).replace("{k}", String(longest))],
    [w.went, BANDS.slice().reverse().map((b) => `${STRINGS.bands[b]} ${h.bands[b]}`).join(" · ")],
    [w.ended, KINDS.map((k) => `${STRINGS.codex.kinds[k]} ${h.ended[k]}`).join(" · ")],
    [w.votes, votes],
    [w.promises, h.promises.made === 0 ? w.noneMade : w.promisesOf.replace("{k}", String(h.promises.kept)).replace("{n}", String(h.promises.made))],
  ];

  return (
    <>
      <h3 className="chronicle-head">{w.habits}</h3>
      <dl className="chronicle-habits">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <h3 className="chronicle-head">{w.reignsHead}</h3>
      <ol className="codex-history">
        {latest.slice(0, shown).map((r) => (
          <Reign key={r.n} lib={lib} r={r} />
        ))}
      </ol>
      {more > 0 ? (
        <button type="button" className="chronicle-more" onClick={() => setShown((n) => n + CHRONICLE_PAGE)}>
          {w.earlier.replace("{m}", String(more))}
        </button>
      ) : (
        before > 0 && <p className="codex-foot">{w.begins.replace("{n}", String(before + 1))}</p>
      )}
    </>
  );
}

function Reign({ lib, r }: { lib: Library; r: ChronicleEntry }) {
  const w = STRINGS.chronicle;
  const title = r.history ? historyTitle(r.history) : null;
  const eras = r.eras === undefined ? null : r.eras > lib.config.eraCount ? STRINGS.reign.short : STRINGS.reign.firstShort;
  // A chronicle says what a reign is remembered for: habits and one-off events come after the decisions history names.
  const left = [...r.left].sort((a, b) => rank(a) - rank(b));
  return (
    <li>
      <span className="codex-run-n">{w.reign.replace("{n}", String(r.n))}</span>
      {title && <b className="codex-run-history">{title}</b>}
      {r.road && <em className="codex-road">{STRINGS.road.mark}</em>}
      {(r.line ?? 1) > 1 && <em className="codex-line">{lineName(r.line!)}</em>}
      {eras && <em className="codex-eras">{eras}</em>}
      <b>
        {STRINGS.parties[r.align]} · {r.cards} cards · {STRINGS.bands[r.band]}
      </b>
      <span>
        {lib.endings.get(r.endingId)?.title ?? r.endingId}
        {r.rival && `, against ${lib.advisorsById.get(r.rival)?.name ?? "a rival"}`}
      </span>
      {r.mandates.map((p) => (
        <em key={p.id} className={p.kept ? "kept" : "broken"}>
          {MANDATES.find((m) => m.id === p.id)?.title ?? p.id} — {p.kept ? STRINGS.ui.mandateKept : STRINGS.ui.mandateBroken}
        </em>
      ))}
      {left.length > 0 && (
        <em className="codex-left">
          {w.left} {left.slice(0, LEFT_SHOWN).map((f) => LEGACIES[f] ?? f).join(" · ")}
          {left.length > LEFT_SHOWN && w.andMore.replace("{n}", String(left.length - LEFT_SHOWN))}
        </em>
      )}
    </li>
  );
}
