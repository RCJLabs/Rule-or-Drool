import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { MeterKey, PlayerAlign } from "../engine/types";
import { BLOC_KEYS, METER_KEYS } from "../engine/types";
import type { Moment } from "./record";
import { eraEnds, inDangerAt, levelAt, readoutAt, type ShapePoint } from "./shape";
import { DANGER_BELOW } from "./signals";
import { meterName } from "./speech";

interface Props {
  lib: Library;
  align: PlayerAlign;
  points: readonly ShapePoint[];
  moments: readonly Moment[];
}

/** How far the direction strip reaches either way: drift past it is drawn at its edge. */
const DRIFT_REACH = 60;
/** A moment this many cards from the one being read is read with it: a finger is wider than a card. */
const MOMENT_NEAR = 2;

const isBloc = (k: MeterKey) => (BLOC_KEYS as readonly string[]).includes(k);

/** The stretches in office, as [from, to] along the chart: only there are the state meters ever in danger. */
function inOffice(points: readonly ShapePoint[]): [number, number][] {
  const n = points.length - 1;
  const spans: [number, number][] = [];
  points.forEach((p, i) => {
    if (p.out) return;
    const last = spans[spans.length - 1];
    if (last && last[1] === Math.min(n, i - 0.5)) last[1] = Math.min(n, i + 0.5);
    else spans.push([Math.max(0, i - 0.5), Math.min(n, i + 0.5)]);
  });
  return spans;
}

/**
 * The cards a meter spent in danger, each stretch from the card before it, so the way in shows
 * and a single card is not a line of no length.
 */
function dangerRuns(points: readonly ShapePoint[], k: MeterKey): ShapePoint[][] {
  const runs: ShapePoint[][] = [];
  let run: ShapePoint[] = [];
  points.forEach((p, i) => {
    if (!inDangerAt(k, p)) {
      if (run.length) runs.push(run);
      run = [];
      return;
    }
    if (!run.length && i > 0) run.push(points[i - 1]!);
    run.push(p);
  });
  if (run.length) runs.push(run);
  return runs;
}

/**
 * The shape of a run (BACKLOG-12 phase 74): small multiples, a thin line for each meter against
 * the bands the meters bar draws in danger, and a strip for the direction the country went
 * against its middle, the Ascent's side and Decay's washed and named. A meter's line turns the
 * danger colour while it was in danger, as the meters bar fills it. Eras are hairlines, the
 * run's decisions dots under them. No number anywhere: it is a slider along the run, read by
 * touching or dragging along it or with the arrow keys, in the words the meters are read in,
 * and the table says where each era left them. One line colour, since each row is named: the
 * rows are the legend.
 */
export function ShapeChart({ lib, align, points, moments }: Props) {
  const [at, setAt] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const plot = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  // Whether the table goes on past the right edge, as five eras do on a small phone: measured
  // before the table is first painted, so its edge never shows unfaded.
  const [more, setMore] = useState(false);
  const captionId = useId();
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!asTable || !el) return;
    const check = () => setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [asTable]);
  const w = STRINGS.shape;
  const n = points.length - 1;
  const width = Math.max(1, n);
  const eraLength = lib.config.eraLength;
  const eras = points[n]!.era;
  const marks = moments.filter((m) => m.kind === "decision" || m.kind === "promise");
  const office = inOffice(points);

  const line = (run: readonly ShapePoint[], y: (p: ShapePoint) => number) => run.map((p) => `${p.card},${y(p).toFixed(1)}`).join(" ");
  const dividers = Array.from({ length: Math.max(0, eras - 1) }, (_, i) => (i + 1) * eraLength).filter((c) => c < n);
  const pct = (card: number) => `${(n === 0 ? 0 : (card / n) * 100).toFixed(2)}%`;

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const box = plot.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const f = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setAt(Math.round(f * n));
  };
  // The keys a slider answers to; Shift takes five cards at a time.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = at ?? 0;
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, number> = {
      ArrowRight: from + step,
      ArrowUp: from + step,
      ArrowLeft: from - step,
      ArrowDown: from - step,
      PageUp: from + 10,
      PageDown: from - 10,
      Home: 0,
      End: n,
    };
    const to = moves[e.key];
    if (to === undefined) return;
    e.preventDefault();
    setAt(Math.min(n, Math.max(0, to)));
  };

  const near =
    at === null ? [] : marks.filter((m) => Math.abs(m.at - at) <= MOMENT_NEAR).map((m) => w.moment.replace("{n}", String(m.at)).replace("{text}", m.text));
  const readout = at === null ? w.hint : [readoutAt(points[at]!, align), ...near].join(" ");
  const ends = eraEnds(lib, points);

  return (
    <figure className="shape">
      <figcaption className="shape-caption">{w.label}</figcaption>
      {asTable ? (
        // Five eras are wider than a small phone: the table scrolls across under the names, and
        // what it is stays put above it.
        <>
          <p className="shape-table-caption" id={captionId}>
            {w.caption}
          </p>
          <div className="shape-table-wrap" ref={wrap} tabIndex={0} role="region" aria-labelledby={captionId} data-more={more || undefined}>
            <table className="shape-table" aria-labelledby={captionId}>
              <thead>
                <tr>
                  <td />
                  {ends.map((p) => (
                    <th key={p.card} scope="col">
                      {(p.card % eraLength === 0 ? w.era : w.end).replace("{n}", String(p.era))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METER_KEYS.map((k) => (
                  <tr key={k}>
                    <th scope="row">{meterName(k, align)}</th>
                    {ends.map((p) => (
                      <td key={p.card} data-danger={inDangerAt(k, p) || undefined}>
                        {levelAt(k, p)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">{w.direction}</th>
                  {ends.map((p) => (
                    <td key={p.card}>{STRINGS.bands[p.band]}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div
          className="shape-chart"
          tabIndex={0}
          role="slider"
          aria-label={w.label}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={n}
          aria-valuenow={at ?? 0}
          aria-valuetext={readout}
          onKeyDown={onKey}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            pick(e);
          }}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" || e.buttons > 0) pick(e);
          }}
        >
          {METER_KEYS.map((k) => (
            <div className="shape-row" key={k} data-meter={k}>
              <span className="shape-label">{meterName(k, align)}</span>
              <svg className="shape-plot" viewBox={`0 0 ${width} 100`} preserveAspectRatio="none" aria-hidden="true">
                {isBloc(k) ? (
                  <rect className="shape-danger" x={0} y={100 - DANGER_BELOW} width={width} height={DANGER_BELOW} />
                ) : (
                  office.map(([from, to]) => (
                    <g key={from}>
                      <rect className="shape-danger" x={from} y={0} width={to - from} height={DANGER_BELOW} />
                      <rect className="shape-danger" x={from} y={100 - DANGER_BELOW} width={to - from} height={DANGER_BELOW} />
                    </g>
                  ))
                )}
                {dividers.map((c) => (
                  <line key={c} className="shape-era" x1={c} x2={c} y1={0} y2={100} />
                ))}
                <polyline className="shape-line" points={line(points, (p) => 100 - p.meters[k])} />
                {dangerRuns(points, k).map((run) => (
                  <polyline key={run[0]!.card} className="shape-line shape-line-danger" points={line(run, (p) => 100 - p.meters[k])} />
                ))}
              </svg>
            </div>
          ))}
          <div className="shape-row shape-direction">
            <span className="shape-label">
              <span>{STRINGS.bands.ascent}</span>
              <span>{w.direction}</span>
              <span>{STRINGS.bands.decay}</span>
            </span>
            <svg className="shape-plot" viewBox={`0 0 ${width} ${DRIFT_REACH * 2}`} preserveAspectRatio="none" aria-hidden="true">
              <rect className="shape-up" x={0} y={0} width={width} height={DRIFT_REACH - lib.config.bandAscentAt} />
              <rect className="shape-down" x={0} y={DRIFT_REACH - lib.config.bandDecayAt} width={width} height={DRIFT_REACH + lib.config.bandDecayAt} />
              <line className="shape-middle" x1={0} x2={width} y1={DRIFT_REACH} y2={DRIFT_REACH} />
              {dividers.map((c) => (
                <line key={c} className="shape-era" x1={c} x2={c} y1={0} y2={DRIFT_REACH * 2} />
              ))}
              <polyline className="shape-line" points={line(points, (p) => DRIFT_REACH - Math.max(-DRIFT_REACH, Math.min(DRIFT_REACH, p.drift)))} />
            </svg>
          </div>
          <div className="shape-axis" aria-hidden="true">
            {Array.from({ length: eras }, (_, i) => {
              const middle = (i * eraLength + Math.min(n, (i + 1) * eraLength)) / 2;
              return (
                <span
                  key={i}
                  className="shape-era-name"
                  style={{
                    left: `clamp(1.4em, ${pct(middle)}, calc(100% - 1.4em))`,
                  }}
                >
                  {w.era.replace("{n}", String(i + 1))}
                </span>
              );
            })}
            {marks.map((m, i) => (
              <span key={`${m.at}-${i}`} className="shape-moment" style={{ left: pct(m.at) }} />
            ))}
          </div>
          <div className="shape-over" ref={plot} aria-hidden="true">
            {at !== null && <span className="shape-cursor" style={{ left: pct(at) }} />}
          </div>
        </div>
      )}
      {/* The slider says the same in its value; read aloud once, not twice. */}
      {!asTable && (
        <p className="shape-readout" aria-hidden="true">
          {readout}
        </p>
      )}
      <button type="button" className="shape-toggle" onClick={() => setAsTable((t) => !t)}>
        {asTable ? w.chart : w.table}
      </button>
    </figure>
  );
}
