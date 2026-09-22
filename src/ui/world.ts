import { STRINGS } from "../content/strings";
import { makeRng } from "../engine/rng";
import type { Band, PlayerAlign } from "../engine/types";
import { HISTORY_ORDER } from "../meta/histories";

/**
 * The world after a run, as a picture (post-run histories). What it shows is decided here
 * and drawn in WorldAfter.tsx, so the decisions can be tested without rendering an SVG.
 *
 * Three things decide the picture, and every one of them is something the player did:
 * - where the country went (the exit band) and how far (|drift|): the sky, the weather and
 *   whether the skyline is climbing or falling down;
 * - the decisions that left a legacy: each one puts a landmark in the world — the seawall on
 *   the coast, the ring across the sky, the statue where the ballot boxes were;
 * - who held the office: the pennants the Commons fly, or the square flags of the Ledger,
 *   the same shape distinction the card makes during the run.
 *
 * The skyline behind the landmarks is drawn from the run's seed, so two runs that did the
 * same things in the same direction still do not produce the same city.
 */
export type Motif =
  | "ring" | "station" | "ship"
  | "statue" | "palace" | "forum"
  | "watchtower" | "tanks" | "barricade"
  | "housing" | "school" | "shuttered" | "emptyLot"
  | "broadcast"
  | "goldTower" | "bunker" | "mansion"
  | "rocket" | "oracle" | "commission"
  | "seawall" | "bridge" | "dryBay"
  | "posters" | "banner";

/**
 * Where a landmark stands. One per slot, and when two decisions want the same place the
 * more history-making one gets it; the rest are still in the words under the picture.
 */
export type Slot = "ring" | "station" | "ship" | "monument" | "security" | "civic" | "media" | "money" | "pad" | "wall" | "bridge" | "bay";

/**
 * Each landmark's preferred place, then anywhere else it fits. Civic is the one wide slot,
 * so the narrow things prefer the narrow slots and leave it for the housing, the school and
 * the empty lot, which fit nowhere else.
 */
const NARROW: Slot[] = ["security", "media", "money", "monument", "pad"];
export const MOTIFS: Record<string, { motif: Motif; slots: Slot[] }> = {
  long_ship: { motif: "ship", slots: ["ship"] },
  orbit_reached: { motif: "station", slots: ["station"] },
  ring_started: { motif: "ring", slots: ["ring"] },
  moonshot_funded: { motif: "rocket", slots: ["pad", "money", "media", "security"] },
  oracle_running: { motif: "oracle", slots: ["pad", "media", "money", "security"] },
  commission_open: { motif: "commission", slots: ["pad", "monument", "civic"] },
  elections_abolished: { motif: "statue", slots: ["monument", "pad", "money", "media", "security"] },
  heir_named: { motif: "palace", slots: ["monument", "pad", "civic"] },
  referendum_called: { motif: "forum", slots: ["monument", "pad", "civic"] },
  purge_begun: { motif: "watchtower", slots: ["security", "media", "money", "pad", "monument"] },
  general_unleashed: { motif: "tanks", slots: ["security", "monument", "media", "money", "pad"] },
  habit_clamp: { motif: "barricade", slots: ["security", "monument", "media", "money", "pad"] },
  housing_built: { motif: "housing", slots: ["civic"] },
  schools_starved: { motif: "school", slots: ["civic"] },
  pension_raided: { motif: "shuttered", slots: ["money", "security", "media", "pad", "monument", "civic"] },
  broke_homes: { motif: "emptyLot", slots: ["civic"] },
  media_captured: { motif: "broadcast", slots: ["media", "money", "security", "pad"] },
  feed_captured: { motif: "broadcast", slots: ["media", "money", "security", "pad"] },
  took_the_skim: { motif: "goldTower", slots: ["money", "media", "security", "pad"] },
  habit_skim: { motif: "goldTower", slots: ["money", "media", "security", "pad"] },
  buried_the_audit: { motif: "bunker", slots: ["money", "security", "media", "pad"] },
  habit_bend: { motif: "mansion", slots: ["money", "monument", "pad", "civic"] },
  seawall: { motif: "seawall", slots: ["wall"] },
  bridge_ignored: { motif: "bridge", slots: ["bridge"] },
  water_rationed: { motif: "dryBay", slots: ["bay"] },
  // The small things take whatever narrow ground is left. The first draft put them at fixed
  // spots in front of the other landmarks and they were drawn over the school and the screen.
  cheated_election: { motif: "posters", slots: [...NARROW, "civic"] },
  counted_late_boxes: { motif: "posters", slots: [...NARROW, "civic"] },
  dirty_politics: { motif: "posters", slots: [...NARROW, "civic"] },
  broke_mandate: { motif: "banner", slots: [...NARROW, "civic"] },
  broke_balance: { motif: "banner", slots: [...NARROW, "civic"] },
  broke_taxes: { motif: "banner", slots: [...NARROW, "civic"] },
  broke_inquiry: { motif: "banner", slots: [...NARROW, "civic"] },
};

/**
 * How many landmarks one picture carries. Three legacies are carried by 95-99% of runs, and
 * drawing everything put the same gold tower, gated house and posters in nearly every
 * picture, which is the opposite of what the picture is for. Taking the most history-making
 * few means the habits only appear in a run that did little else, which is when they are the
 * story.
 */
export const LANDMARKS_SHOWN = 6;

/**
 * The four legacies carried by 80-99.5% of runs. Capping the picture was not enough: most
 * runs have room for them after their big decisions, so a heroic Ascent still got a gold
 * tower and a gated house. They only fill a picture that would otherwise have too little in
 * it — which is exactly the run whose story they are.
 */
const FILLER = new Set(["habit_skim", "habit_bend", "habit_clamp", "cheated_election"]);
/** Below this many landmarks, the habits are allowed in to fill the picture. */
const SPARSE = 3;

export interface Building {
  x: number;
  w: number;
  h: number;
  /** A top with bites out of it. Decay only, and more of them the further it went. */
  broken: boolean;
  /** A spire and a light. Ascent only. */
  spire: boolean;
  /** Which windows are lit, as indices into the building's own grid. */
  lit: number[];
  cols: number;
  rows: number;
}

export interface World {
  band: Band;
  /** 0..1, how far the country went in that direction. */
  level: number;
  align: PlayerAlign;
  /** Landmarks in the order they are drawn, each with where it stands. */
  placed: { motif: Motif; slot: Slot; flag: string }[];
  buildings: Building[];
  /** The skyline buildings that fly the party's flag. */
  flagged: number[];
  /** A sentence for anyone who cannot see the picture. */
  description: string;
}

/** Where the skyline stands. Everything in front of it is placed against this line. */
export const GROUND = 205;
export const WIDTH = 400;
export const HEIGHT = 240;

/**
 * Left edge of each ground slot, and its width. Everything stands on GROUND, and six units
 * apart, so a landmark that keeps within two of its own slot never touches a neighbour; the
 * browser audit holds every landmark to that in every slot it may take.
 */
export const SLOT_X: Partial<Record<Slot, [number, number]>> = {
  monument: [14, 60],
  security: [80, 50],
  civic: [136, 78],
  media: [220, 48],
  money: [274, 50],
  pad: [330, 60],
};

export function composeWorld(input: { band: Band; drift: number; align: PlayerAlign; flags: readonly string[]; seed: number; era: number }): World {
  const { band, align, seed } = input;
  const level = Math.min(1, Math.abs(input.drift) / 60);

  // Most history-making first, so the defining decision always gets its place.
  const taken = new Set<Slot>();
  const drawn = new Set<Motif>();
  const placed: World["placed"] = [];
  const place = (flag: string) => {
    const m = MOTIFS[flag];
    if (!m || drawn.has(m.motif)) return;
    const slot = m.slots.find((s) => !taken.has(s));
    if (!slot) return;
    taken.add(slot);
    drawn.add(m.motif);
    placed.push({ motif: m.motif, slot, flag });
  };
  const carried = HISTORY_ORDER.filter((f) => input.flags.includes(f));
  for (const flag of carried) {
    if (placed.length >= LANDMARKS_SHOWN) break;
    if (!FILLER.has(flag)) place(flag);
  }
  for (const flag of carried) {
    if (placed.length >= SPARSE) break;
    if (FILLER.has(flag)) place(flag);
  }

  const rng = makeRng((Math.imul(seed, 2654435761) ^ 0x9e3779b9) | 0);
  const buildings: Building[] = [];
  const tall = band === "ascent" ? 60 + 60 * level : band === "decay" ? 34 - 8 * level : 48;
  const litOdds = band === "ascent" ? 0.55 + 0.3 * level : band === "decay" ? 0.14 - 0.08 * level : 0.32;
  for (let x = -6; x < WIDTH; ) {
    const w = 14 + Math.floor(rng() * 16);
    const h = Math.round(tall * (0.45 + rng() * 0.75) + (band === "ascent" ? rng() * 30 : 0));
    const cols = Math.max(1, Math.floor((w - 4) / 5));
    const rows = Math.max(1, Math.floor((h - 8) / 7));
    const lit: number[] = [];
    for (let i = 0; i < cols * rows; i++) if (rng() < litOdds) lit.push(i);
    buildings.push({
      x,
      w,
      h,
      broken: band === "decay" && rng() < 0.3 + 0.4 * level,
      spire: band === "ascent" && rng() < 0.2 + 0.35 * level,
      lit,
      cols,
      rows,
    });
    x += w + 1 + Math.floor(rng() * 4);
  }
  const flagged = [...buildings.keys()].sort((a, b) => buildings[b]!.h - buildings[a]!.h).slice(0, 3);

  return { band, level, align, placed, buildings, flagged, description: describe(band, level, input.era, placed) };
}

function describe(band: Band, level: number, era: number, placed: World["placed"]): string {
  const { when, sky, landmarks } = STRINGS.world;
  const intensity = level > 0.66 ? 2 : level > 0.33 ? 1 : 0;
  const things = placed.map((p) => landmarks[p.motif]).filter(Boolean);
  const list = things.length ? `: ${things.join(", ")}` : "";
  return `${when[Math.min(era, when.length) - 1] ?? when[0]}, ${sky[band][intensity]}${list}.`;
}
