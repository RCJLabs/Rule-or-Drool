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
  | "posters" | "banner"
  // The answers to the questions and the stories' biggest outcomes (BACKLOG-10 phase 64).
  | "warships" | "freighters" | "yachts"
  | "fence" | "doorway" | "limousines" | "hospital" | "clinic" | "cafes" | "gateQueue"
  | "cranes" | "tenements" | "turbines" | "flare" | "factory" | "containers"
  | "clocktower" | "park" | "university" | "tollgate" | "policeVans" | "leafShop"
  | "prison" | "openPrison" | "cameras" | "camerasDown" | "loudspeakers" | "billboard"
  | "packedCourt" | "court" | "proppedBank" | "failedBank"
  | "crown" | "levee" | "stadium" | "portCranes";

/**
 * Where a landmark stands. One per slot, and when two decisions want the same place the
 * more history-making one gets it; the rest are still in the words under the picture.
 */
export type Slot = "ring" | "station" | "ship" | "monument" | "security" | "civic" | "media" | "money" | "pad" | "wall" | "bridge" | "bay" | "ridge";

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
  // The answers to the sixteen questions, about three a run and the biggest decisions in it, and
  // the stories' biggest outcomes. None was drawn until BACKLOG-10 phase 64. The ships have the
  // water to themselves, the wind and the gas the hills behind the city.
  went_to_war: { motif: "warships", slots: ["bay"] },
  stayed_out: { motif: "freighters", slots: ["bay"] },
  top_rate_cut: { motif: "yachts", slots: ["bay"] },
  carbon_priced: { motif: "turbines", slots: ["ridge"] },
  gas_drilled: { motif: "flare", slots: ["ridge"] },
  levee_built: { motif: "levee", slots: ["wall"] },
  mass_deportation: { motif: "fence", slots: ["security", "civic", "pad", "monument", "money"] },
  papers_granted: { motif: "doorway", slots: ["civic", ...NARROW] },
  top_rate_raised: { motif: "limousines", slots: ["money", ...NARROW, "civic"] },
  universal_care: { motif: "hospital", slots: ["civic", ...NARROW] },
  care_market: { motif: "clinic", slots: ["civic", "money", ...NARROW] },
  wage_raised: { motif: "cafes", slots: ["civic", ...NARROW] },
  wage_left: { motif: "gateQueue", slots: ["civic", ...NARROW] },
  zoning_cleared: { motif: "cranes", slots: ["pad", "civic", "monument"] },
  rents_controlled: { motif: "tenements", slots: ["civic", "pad", "monument", "security", "money"] },
  tariffs_raised: { motif: "factory", slots: ["civic", "pad", "monument", "money", "security"] },
  trade_opened: { motif: "containers", slots: ["pad", "money", ...NARROW, "civic"] },
  pension_age_raised: { motif: "clocktower", slots: [...NARROW, "civic"] },
  pension_age_kept: { motif: "park", slots: ["civic", ...NARROW] },
  debt_cancelled: { motif: "university", slots: ["civic", "monument", "pad"] },
  debt_kept: { motif: "tollgate", slots: ["civic", "monument", "pad"] },
  drugs_crackdown: { motif: "policeVans", slots: ["security", ...NARROW, "civic"] },
  drugs_legalised: { motif: "leafShop", slots: ["money", ...NARROW, "civic"] },
  tough_sentences: { motif: "prison", slots: ["security", "civic", ...NARROW] },
  justice_reformed: { motif: "openPrison", slots: ["security", "civic", ...NARROW] },
  cameras_everywhere: { motif: "cameras", slots: [...NARROW, "civic"] },
  cameras_banned: { motif: "camerasDown", slots: [...NARROW, "civic"] },
  truth_law: { motif: "loudspeakers", slots: ["media", ...NARROW, "civic"] },
  no_truth_law: { motif: "billboard", slots: ["media", ...NARROW, "civic"] },
  court_packed: { motif: "packedCourt", slots: ["monument", "civic", "pad"] },
  court_left: { motif: "court", slots: ["monument", "civic", "pad"] },
  banks_bailed: { motif: "proppedBank", slots: ["money", "civic", "pad", "monument", "security"] },
  banks_failed: { motif: "failedBank", slots: ["money", "civic", "pad", "monument", "security"] },
  crown_restored: { motif: "crown", slots: ["monument", "pad", "civic"] },
  stadium_built: { motif: "stadium", slots: ["civic", "pad", "monument"] },
  port_leased: { motif: "portCranes", slots: ["pad", "money", "civic", "monument", "security"] },
  count_adjusted: { motif: "posters", slots: [...NARROW, "civic"] },
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

/** A landmark and the place it stands in. */
export type Placed = World["placed"][number];

/**
 * The landmarks a run's flags put in the world, most history-making first, so the defining
 * decision always gets its place. The picture at the end and the country on the play screen
 * both take them from here, so the two never disagree about what a run built (BACKLOG-10
 * phase 64).
 */
export function placeLandmarks(flags: readonly string[]): Placed[] {
  const taken = new Set<Slot>();
  const drawn = new Set<Motif>();
  const placed: Placed[] = [];
  const place = (flag: string) => {
    const m = MOTIFS[flag];
    if (!m || drawn.has(m.motif)) return;
    const slot = m.slots.find((s) => !taken.has(s));
    if (!slot) return;
    taken.add(slot);
    drawn.add(m.motif);
    placed.push({ motif: m.motif, slot, flag });
  };
  const carried = HISTORY_ORDER.filter((f) => flags.includes(f));
  for (const flag of carried) {
    if (placed.length >= LANDMARKS_SHOWN) break;
    if (!FILLER.has(flag)) place(flag);
  }
  for (const flag of carried) {
    if (placed.length >= SPARSE) break;
    if (FILLER.has(flag)) place(flag);
  }
  return placed;
}

export function composeWorld(input: { band: Band; drift: number; align: PlayerAlign; flags: readonly string[]; seed: number; era: number }): World {
  const { band, align, seed } = input;
  const level = Math.min(1, Math.abs(input.drift) / 60);
  const placed = placeLandmarks(input.flags);

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

/**
 * The country on the play screen (BACKLOG-10 phase 64): the landmarks the picture at the end
 * will show, in a strip under the card, standing as soon as the run builds them.
 *
 * Its city is not the end picture's. That one is drawn once, and deals a new skyline for each
 * direction and depth; this one is drawn every card, and a city that reshuffled whenever drift
 * moved would be noise. So each building's place, width and share of the height are fixed by
 * the seed, and the look decides only how tall the city stands, what state it is in, and
 * whose flags fly over it.
 */
export interface Tower {
  x: number;
  w: number;
  h: number;
  broken: boolean;
  spire: boolean;
}

export interface Country {
  /** The look's direction: the city the run is heading for, not the band it is in. */
  band: Band;
  /** 0..1, how far the look has gone. */
  level: number;
  /** Whose flags fly over the city: the party in office, which out of office is the rival's. */
  office: PlayerAlign;
  placed: Placed[];
  towers: Tower[];
  /** The towers that fly the flags, the three tallest where the strip is always seen. */
  flagged: number[];
  /** A sentence for anyone who cannot see the strip. */
  description: string;
}

/**
 * The strip is a wide slice of the picture's world, drawn at the picture's scale: 1100 wide,
 * from 80 above the top down to the water. The screen fixes its height and crops its sides,
 * so the landmarks stand in the middle 840, which a 336px strip at 64px tall still shows.
 */
export const STRIP = { width: 1100, top: 80, safe: [130, 970] as const };

/** Where a ground slot stands in the strip: spread across the part always seen. */
export function stripSlotX(slot: Slot): [number, number] | undefined {
  const at = SLOT_X[slot];
  if (!at) return undefined;
  const [from, to] = STRIP.safe;
  return [from + (at[0] / WIDTH) * (to - from), at[1]];
}

const TOWER_ROLLS = 4;
/** The strip's buildings, each with the same rolls on every card: place, width, height, fate. */
function stripRolls(seed: number): { x: number; w: number; r: number[] }[] {
  const rng = makeRng((Math.imul(seed, 2246822519) ^ 0x5bd1e995) | 0);
  const out: { x: number; w: number; r: number[] }[] = [];
  for (let x = -6; x < STRIP.width; ) {
    const w = 14 + Math.floor(rng() * 16);
    out.push({ x, w, r: Array.from({ length: TOWER_ROLLS }, () => rng()) });
    x += w + 1 + Math.floor(rng() * 4);
  }
  return out;
}

export function composeCountry(input: { stage: number; drift: number; align: PlayerAlign; opposition: boolean; flags: readonly string[]; seed: number }): Country {
  const band: Band = input.stage < 0 ? "decay" : input.stage > 0 ? "ascent" : "muddle";
  const level = Math.min(1, Math.abs(input.drift) / 60);
  // The end picture's heights, from rolls that do not move with the look, except the Ascent's:
  // at the picture's height its towers stood past the top of the strip and hid every landmark
  // in front of them, so here they stop short of it, still half as tall again as the Muddle's.
  const tall = band === "ascent" ? 36 + 28 * level : band === "decay" ? 34 - 8 * level : 48;
  const towers = stripRolls(input.seed).map(({ x, w, r }) => ({
    x,
    w,
    h: Math.round(tall * (0.45 + r[0]! * 0.75) + (band === "ascent" ? r[1]! * 12 : 0)),
    broken: band === "decay" && r[2]! < 0.3 + 0.4 * level,
    spire: band === "ascent" && r[3]! < 0.2 + 0.35 * level,
  }));
  const [from, to] = STRIP.safe;
  const flagged = [...towers.keys()]
    .filter((i) => towers[i]!.x >= from && towers[i]!.x + towers[i]!.w <= to)
    .sort((a, b) => towers[b]!.h - towers[a]!.h)
    .slice(0, 3);
  const office: PlayerAlign = input.opposition ? (input.align === "left" ? "right" : "left") : input.align;
  const placed = placeLandmarks(input.flags);
  return { band, level, office, placed, towers, flagged, description: describeCountry(placed) };
}

function describeCountry(placed: readonly Placed[]): string {
  const { landmarks } = STRINGS.world;
  const things = placed.map((p) => landmarks[p.motif]).filter(Boolean);
  return things.length ? STRINGS.countryNow.now.replace("{list}", things.join(", ")) : STRINGS.countryNow.empty;
}

function describe(band: Band, level: number, era: number, placed: World["placed"]): string {
  const { when, sky, landmarks } = STRINGS.world;
  const intensity = level > 0.66 ? 2 : level > 0.33 ? 1 : 0;
  const things = placed.map((p) => landmarks[p.motif]).filter(Boolean);
  const list = things.length ? `: ${things.join(", ")}` : "";
  return `${when[Math.min(era, when.length) - 1] ?? when[0]}, ${sky[band][intensity]}${list}.`;
}
