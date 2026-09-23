import { getCard, poolKey, type Library } from "./library";
import { pickWeighted } from "./rng";
import { condMet, hasFlag, roll } from "./state";
import type { Arc, Band, Card, CardSource, GameState } from "./types";
import { BANDS } from "./types";

/** Put a card on the table and do the bookkeeping (seen, cooldown, and why it is here). */
export function select(lib: Library, state: GameState, cardId: string, from: CardSource = "deck"): GameState {
  const seen = state.seen.includes(cardId) ? state.seen : [...state.seen, cardId];
  const cooldown = [...state.cooldown, cardId].slice(-lib.config.cooldownSize);
  return { ...state, current: cardId, currentFrom: from, seen, cooldown };
}

/**
 * A pool draw gated entirely on counting marks is not an ordinary card: it is the deck
 * noticing a pattern. Gated on marks *and* something else, it is an ordinary card with a
 * condition, so the stricter reading is the honest one (BACKLOG-3 phase 19).
 */
export function isHabitCard(lib: Library, card: Card): boolean {
  const flags = card.cond?.flags;
  if (!flags || flags.length === 0) return false;
  return flags.every((f) => f.startsWith(lib.config.habitMarkPrefix));
}

export function electionDue(lib: Library, state: GameState): boolean {
  return !hasFlag(state, lib.config.electionsAbolishedFlag) && state.cardCount >= state.nextElectionAt;
}

function alignOk(card: { align: Card["align"] }, state: GameState): boolean {
  return card.align === "any" || card.align === state.align;
}

/**
 * Eligibility for pool draws. `relax` switches off filters one at a time so a thin
 * content cell degrades to a wider one instead of a stuck run (validator enforces
 * minimum cell sizes in phase 2).
 */
interface Relax {
  cooldown: boolean;
  band: boolean;
  era: boolean;
}

const LADDER: readonly Relax[] = [
  { cooldown: false, band: false, era: false },
  { cooldown: true, band: false, era: false },
  { cooldown: true, band: true, era: false },
  { cooldown: true, band: false, era: true },
  { cooldown: true, band: true, era: true },
];

function eligible(lib: Library, card: Card, state: GameState, relax: Relax): boolean {
  if (!relax.cooldown && state.cooldown.includes(card.id)) return false;
  if (card.oneShot && state.seen.includes(card.id)) return false;
  return condMet(lib, card.cond, state, card.speaker);
}

function poolCandidates(lib: Library, state: GameState, relax: Relax): Card[] {
  const eras = relax.era ? lib.eras : [state.era];
  const bands: readonly Band[] = relax.band ? BANDS : [state.band];
  const out: Card[] = [];
  const seenIds = new Set<string>();
  for (const era of eras) {
    for (const band of bands) {
      for (const align of [state.align, "any"] as const) {
        const list = lib.eventPool.get(poolKey(era, band, align));
        if (!list) continue;
        for (const c of list) {
          if (seenIds.has(c.id)) continue;
          seenIds.add(c.id);
          if (eligible(lib, c, state, relax)) out.push(c);
        }
      }
    }
  }
  return out;
}

function pickFrom(lib: Library, state: GameState, cards: Card[]): [Card | null, GameState] {
  if (cards.length === 0) return [null, state];
  const { alignAffinity, bandAffinity } = lib.config;
  const r = pickWeighted(
    state.rngState,
    cards.map(
      (c) =>
        (c.weight ?? 1) *
        (c.align === state.align ? alignAffinity : 1) *
        // Eligibility already matched the band, so a narrow list means it was written for here.
        (c.bands.length < BANDS.length ? bandAffinity : 1),
    ),
  );
  const next = { ...state, rngState: r.state };
  if (r.index < 0) return [null, next];
  return [cards[r.index] ?? null, next];
}

function drawElection(lib: Library, state: GameState): [Card | null, GameState] {
  for (const relax of LADDER) {
    const cands = lib.electionCards.filter(
      (c) =>
        alignOk(c, state) &&
        (relax.era || c.eras.includes(state.era)) &&
        (relax.band || c.bands.includes(state.band)) &&
        eligible(lib, c, state, { ...relax, cooldown: true }),
    );
    if (cands.length > 0) return pickFrom(lib, state, cands);
  }
  return [null, state];
}

/** Pop the oldest due queued card whose condition still holds; drop stale ones. */
export function tickQueue(lib: Library, state: GameState): [Card | null, GameState] {
  const due = state.queue
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.dueAt <= state.cardCount)
    .sort((a, b) => a.q.dueAt - b.q.dueAt || a.i - b.i);
  if (due.length === 0) return [null, state];
  const dropped = new Set<number>();
  let found: Card | null = null;
  for (const { q, i } of due) {
    const card = getCard(lib, q.id);
    dropped.add(i);
    if (condMet(lib, card.cond, state, card.speaker)) {
      found = card;
      break;
    }
  }
  const queue = state.queue.filter((_, i) => !dropped.has(i));
  return [found, { ...state, queue }];
}

function drawArcContinue(lib: Library, state: GameState): [Card | null, GameState] {
  const cands: Card[] = [];
  for (const a of state.activeArcs) {
    if (!a.nextCard) continue;
    const card = getCard(lib, a.nextCard);
    if (condMet(lib, card.cond, state, card.speaker)) cands.push(card);
  }
  if (cands.length === 0) return [null, state];
  const [p, s1] = roll(state);
  if (p >= lib.config.arcContinueProb) return [null, s1];
  const [i, s2] = roll(s1);
  return [cands[Math.floor(i * cands.length)] ?? null, s2];
}

function arcWeight(lib: Library, state: GameState, arc: Arc): number {
  let w = arc.weight;
  for (const id of state.modifiers) {
    const m = lib.modifiers.get(id);
    const k = m?.arcWeights?.[arc.id];
    if (k !== undefined) w *= k;
  }
  return w;
}

function drawArcEntry(lib: Library, state: GameState): [Card | null, GameState] {
  /**
   * The budget is how many stories can be running at once, not how many have ever been
   * started: a finished arc keeps its entry in `activeArcs` with a null pointer, and
   * counting those held a slot for the rest of the run (BACKLOG-3 phase 26).
   *
   * A run enters about five arcs against a budget of 4-6, so the budget was saturated on
   * 98.4% of runs, and an arc that can only start in era 2 arrived to find every slot taken
   * by an era-1 arc that had already ended. Measured: at the same weight of 2, arcs eligible
   * from era 1 were entered in 36-44% of runs and arcs gated to eras 2-3 in 3.0-3.3%.
   */
  if (state.activeArcs.filter((a) => a.nextCard).length >= state.arcBudget) return [null, state];
  // Still every arc ever entered, so a finished story cannot start again.
  const started = new Set(state.activeArcs.map((a) => a.id));
  const cands: Arc[] = [];
  for (const arc of lib.arcs.values()) {
    if (started.has(arc.id)) continue;
    if (arc.requires && !state.unlocked.includes(arc.requires)) continue;
    if (!alignOk(arc, state)) continue;
    if (!arc.entry.eras.includes(state.era)) continue;
    if (!arc.entry.bands.includes(state.band)) continue;
    // An entry is read as the arc's first card would be: a trait or a tenure it asks for is
    // that speaker's (BACKLOG-5 phase 35).
    if (!condMet(lib, arc.entry, state, lib.cards.get(arc.cards[0] ?? "")?.speaker)) continue;
    if (arc.cards.length === 0) continue;
    cands.push(arc);
  }
  if (cands.length === 0) return [null, state];
  const [p, s1] = roll(state);
  if (p >= lib.config.arcEntryProb) return [null, s1];
  const r = pickWeighted(
    s1.rngState,
    cands.map((a) => arcWeight(lib, s1, a)),
  );
  const s2 = { ...s1, rngState: r.state };
  const arc = cands[r.index];
  if (!arc) return [null, s2];
  const entry = arc.cards[0]!;
  const card = getCard(lib, entry);
  return [
    card,
    {
      ...s2,
      activeArcs: [...s2.activeArcs, { id: arc.id, nextCard: entry }],
      stats: { ...s2.stats, arcsEntered: s2.stats.arcsEntered + 1 },
    },
  ];
}

function drawEvent(lib: Library, state: GameState): [Card | null, GameState] {
  for (const relax of LADDER) {
    const cands = poolCandidates(lib, state, relax);
    if (cands.length > 0) return pickFrom(lib, state, cands);
  }
  return [null, state];
}

/**
 * Draw the next card onto the table (section 7 draw order). No-op if the run is over
 * or a card is already on the table.
 */
export function draw(lib: Library, state: GameState): GameState {
  if (state.over || state.current) return state;

  // Each source in draw order, with the name it answers to. The first one that produces a
  // card wins, and its name is why that card is on the table.
  type Source = [CardSource, (lib: Library, state: GameState) => [Card | null, GameState]];
  const sources: Source[] = [
    ...(electionDue(lib, state) ? [["election", drawElection] as Source] : []),
    ["queue", tickQueue],
    ["arc", drawArcContinue],
    ["arc", drawArcEntry],
    ["deck", drawEvent],
  ];

  let s = state;
  for (const [name, pick] of sources) {
    const [card, next] = pick(lib, s);
    s = next;
    if (!card) continue;
    return select(lib, s, card.id, name === "deck" && isHabitCard(lib, card) ? "habit" : name);
  }
  throw new Error(`no eligible card (era ${s.era}, band ${s.band}, align ${s.align})`);
}
