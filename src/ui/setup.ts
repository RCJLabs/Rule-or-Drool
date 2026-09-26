import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import { fxDeltas } from "../engine/state";
import type { MeterKey, PlayerAlign } from "../engine/types";
import { BLOC_KEYS, METER_KEYS } from "../engine/types";
import { meterName } from "./speech";

/**
 * What a dealt setup does (BACKLOG-11 phase 73, idea 9's display half). The setup screen gave a
 * crisis, a trait and a flaw a name and a line of character, and the informed voter's Ascent ran
 * from 11% to 40% with the one dealt: the setups that start the State high, which read as
 * advantages, were the worst of them. It says which meters each starts higher or lower, in words,
 * and which edges that end a rule the whole setup starts nearer. It says nothing of why a high
 * State costs a careful run, which is idea 4's to decide and its closed test's to measure.
 */

/** A start moved less than this is not worth a word; up to the next, "a little"; from the last, "much". */
const SAID_FROM = 3;
const LITTLE_UP_TO = 4;
const MUCH_FROM = 10;
/**
 * A setup that moves a meter this far toward an edge says so. At 5 nearly every setup did (1,973
 * of 2,000), since most crises take something from the treasury. At 9 the academic's State says
 * so: of all the traits, it cut the informed voter's Ascent the most (13%).
 */
export const EDGE_FROM = 9;

const isBloc = (k: MeterKey) => (BLOC_KEYS as readonly string[]).includes(k);

/** The meters a modifier starts away from the middle, largest first, as `[meter, change]`. */
export function startsOf(lib: Library, id: string): [MeterKey, number][] {
  const deltas = fxDeltas(lib.modifiers.get(id)?.meterStart);
  return METER_KEYS.flatMap((k) => (deltas[k] ? [[k, deltas[k]!] as [MeterKey, number]] : [])).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
}

/** The starts worth a word. */
function said(lib: Library, id: string): [MeterKey, number][] {
  return startsOf(lib, id).filter(([, d]) => Math.abs(d) >= SAID_FROM);
}

/** "Money much lower · Cities a little lower": one modifier's starts, or null for none. */
export function startsLine(lib: Library, id: string, align: PlayerAlign): string | null {
  const w = STRINGS.setupStarts;
  const parts = said(lib, id).map(([k, d]) => {
    const dir = d > 0 ? w.higher : w.lower;
    const size = Math.abs(d) <= LITTLE_UP_TO ? w.little.replace("{dir}", dir) : Math.abs(d) >= MUCH_FROM ? w.much.replace("{dir}", dir) : dir;
    return `${meterName(k, align)} ${size}`;
  });
  return parts.length ? `${w.lead} ${parts.join(" · ")}` : null;
}

/**
 * The edges a whole setup starts nearer, from what its parts add up to: the state's meters end a
 * rule at either end, and a group only when it has gone. Null when none moves far enough to say.
 */
export function edgesLine(lib: Library, ids: readonly string[], align: PlayerAlign): string | null {
  const w = STRINGS.setupStarts;
  const net = new Map<MeterKey, number>();
  for (const id of ids) for (const [k, d] of startsOf(lib, id)) net.set(k, (net.get(k) ?? 0) + d);
  const near = METER_KEYS.flatMap((k) => {
    const d = net.get(k) ?? 0;
    if (d <= -EDGE_FROM) return [w.low.replace("{meter}", meterName(k, align))];
    if (d >= EDGE_FROM && !isBloc(k)) return [w.high.replace("{meter}", meterName(k, align))];
    return [];
  });
  return near.length ? w.edges.replace("{list}", near.join(" · ")) : null;
}
