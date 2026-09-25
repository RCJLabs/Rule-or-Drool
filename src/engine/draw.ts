import { getCard, poolKey, questionOfArc, type Library } from "./library";
import { pickWeighted } from "./rng";
import { candidatesFor, condMet, hasFlag, roll } from "./state";
import { returnDue } from "./opposition";
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

/**
 * Whether the card about to be dealt is a seat's appointment (BACKLOG-10 phase 61): the first
 * card of every era after the first. An era is a generation, and a new one brings a new face to
 * the table, of the player's choosing.
 */
export function appointmentDue(lib: Library, state: GameState): boolean {
  return state.era > 1 && !state.opposition && state.cardCount === (state.era - 1) * lib.config.eraLength && lib.appointmentCards.size > 0;
}

/**
 * The seat an era's appointment fills, by the run's own dice: one held since the first day while
 * there is one, so a long reign does not fill the same seat twice before the others.
 */
function drawAppointment(lib: Library, state: GameState): [Card | null, GameState] {
  const seats = [...lib.appointmentCards.keys()].sort().filter((role) => role !== lib.config.rivalRole && !!state.cabinet[role] && !!candidatesFor(lib, state, role));
  const fresh = seats.filter((role) => (state.cabinetSince[role] ?? 0) === 0);
  const from = fresh.length ? fresh : seats;
  if (from.length === 0) return [null, state];
  const [p, s] = roll(state);
  return [lib.appointmentCards.get(from[Math.floor(p * from.length)]!)!, s];
}

export function electionDue(lib: Library, state: GameState): boolean {
  return !hasFlag(state, lib.config.electionsAbolishedFlag) && state.cardCount >= state.nextElectionAt;
}

/**
 * Whether the card about to be dealt is one of the campaign's (BACKLOG-10 phase 56): one of the
 * `campaignLead` cards before a vote in office. Out of office the opposition's own cards are its
 * campaign, and once elections are abolished there is no vote to campaign for.
 */
export function campaignDue(lib: Library, state: GameState): boolean {
  if (state.opposition || hasFlag(state, lib.config.electionsAbolishedFlag)) return false;
  const until = state.nextElectionAt - state.cardCount;
  return until >= 1 && until <= lib.config.campaignLead;
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

/**
 * What every card in a pool is checked against, gathered once a draw. A draw checks every
 * card in its pool, and scanning the run's history once per card made a draw's cost grow
 * with the deck times the history (BACKLOG-5 phase 36).
 */
interface Past {
  cooldown: ReadonlySet<string>;
  seen: ReadonlySet<string>;
  flags: ReadonlySet<string>;
}

const pastOf = (state: GameState): Past => ({ cooldown: new Set(state.cooldown), seen: new Set(state.seen), flags: new Set(state.flags) });

function eligible(lib: Library, card: Card, state: GameState, relax: Relax, past: Past): boolean {
  if (!relax.cooldown && past.cooldown.has(card.id)) return false;
  if (card.oneShot && past.seen.has(card.id)) return false;
  return condMet(lib, card.cond, state, card.speaker, past.flags);
}

/**
 * The eras a draw may widen to when it relaxes the era filter: those of the ordinary game, and
 * a long reign's later ones once the run has reached them (BACKLOG-5 phase 39). A long reign
 * therefore deals exactly what an ordinary run on its setup deals until its fourth era, and
 * an ordinary run never meets a card written for two centuries on.
 */
function widenedEras(lib: Library, state: GameState): number {
  return Math.max(lib.config.eraCount, state.era);
}

function poolCandidates(lib: Library, state: GameState, relax: Relax, past: Past): Card[] {
  const upTo = widenedEras(lib, state);
  const eras = relax.era ? lib.eras.filter((e) => e <= upTo) : [state.era];
  const bands: readonly Band[] = relax.band ? BANDS : [state.band];
  const out: Card[] = [];
  // One cell holds a card once, and the two sides' cells hold different cards, so only a
  // draw that has widened to other eras or bands can meet a card twice.
  const met = relax.era || relax.band ? new Set<string>() : null;
  for (const era of eras) {
    for (const band of bands) {
      for (const align of [state.align, "any"] as const) {
        const list = lib.eventPool.get(poolKey(era, band, align));
        if (!list) continue;
        for (const c of list) {
          if (met) {
            if (met.has(c.id)) continue;
            met.add(c.id);
          }
          if (eligible(lib, c, state, relax, past)) out.push(c);
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

/**
 * The return vote, on the era's last card of an opposition (BACKLOG-10 phase 55). Relaxed like
 * any draw rather than skipped: an opposition always ends in a vote.
 */
function drawReturnVote(lib: Library, state: GameState): [Card | null, GameState] {
  const past = pastOf(state);
  for (const relax of LADDER) {
    const cands = lib.returnVotes.filter((c) => alignOk(c, state) && eligible(lib, c, state, { ...relax, cooldown: true }, past));
    if (cands.length > 0) return pickFrom(lib, state, cands);
  }
  return [null, state];
}

/**
 * A card from the campaign deck: any era and band, this side's and either side's. A side with
 * none left to deal falls through to the ordinary deal.
 */
function drawCampaign(lib: Library, state: GameState): [Card | null, GameState] {
  const past = pastOf(state);
  for (const relax of LADDER) {
    const cands = lib.campaignCards.filter((c) => alignOk(c, state) && eligible(lib, c, state, relax, past));
    if (cands.length > 0) return pickFrom(lib, state, cands);
  }
  return [null, state];
}

/** A card from the opposition's own deck: any era and band, this side's and either side's. */
function drawOpposition(lib: Library, state: GameState): [Card | null, GameState] {
  const past = pastOf(state);
  for (const relax of LADDER) {
    const cands = lib.oppositionCards.filter((c) => alignOk(c, state) && eligible(lib, c, state, relax, past));
    if (cands.length > 0) return pickFrom(lib, state, cands);
  }
  return [null, state];
}

function drawElection(lib: Library, state: GameState): [Card | null, GameState] {
  const past = pastOf(state);
  const upTo = widenedEras(lib, state);
  for (const relax of LADDER) {
    const cands = lib.electionCards.filter(
      (c) =>
        alignOk(c, state) &&
        (relax.era ? c.eras.some((e) => e <= upTo) : c.eras.includes(state.era)) &&
        (relax.band || c.bands.includes(state.band)) &&
        eligible(lib, c, state, { ...relax, cooldown: true }, past),
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
  // A question running does not hold a story's slot: it has a budget of its own.
  if (state.activeArcs.filter((a) => a.nextCard && questionOfArc(lib, a.id) === undefined).length >= state.arcBudget) return [null, state];
  const cands = startable(lib, state, false);
  if (cands.length === 0) return [null, state];
  const [p, s1] = roll(state);
  if (p >= lib.config.arcEntryProb) return [null, s1];
  const [arc, s2] = pickArc(lib, s1, cands);
  if (!arc) return [null, s2];
  return [
    getCard(lib, arc.cards[0]!),
    {
      ...s2,
      activeArcs: [...s2.activeArcs, { id: arc.id, nextCard: arc.cards[0]! }],
      stats: { ...s2.stats, arcsEntered: s2.stats.arcsEntered + 1 },
    },
  ];
}

/**
 * Ask a question (BACKLOG-6 phase 40): a policy the country argues about, one at a time, each
 * once, up to the run's budget. It is not a story, so it neither takes a story's slot nor
 * counts as one entered; its later steps are drawn like any arc's.
 */
function drawQuestionEntry(lib: Library, state: GameState): [Card | null, GameState] {
  const asked = state.activeArcs.filter((a) => questionOfArc(lib, a.id) !== undefined);
  if (asked.length >= lib.config.questionBudget || asked.some((a) => a.nextCard)) return [null, state];
  const answered = new Set(asked.map((a) => questionOfArc(lib, a.id)));
  const cands = startable(lib, state, true).filter((a) => !answered.has(a.question));
  if (cands.length === 0) return [null, state];
  const [p, s1] = roll(state);
  if (p >= lib.config.questionEntryProb) return [null, s1];
  const [arc, s2] = pickArc(lib, s1, cands);
  if (!arc) return [null, s2];
  return [getCard(lib, arc.cards[0]!), { ...s2, activeArcs: [...s2.activeArcs, { id: arc.id, nextCard: arc.cards[0]! }] }];
}

/** The stories, or the questions, this run could start now. */
function startable(lib: Library, state: GameState, questions: boolean): Arc[] {
  // Still every arc ever entered, so a finished story cannot start again.
  const started = new Set(state.activeArcs.map((a) => a.id));
  const cands: Arc[] = [];
  for (const arc of lib.arcs.values()) {
    if ((arc.question !== undefined) !== questions) continue;
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
  return cands;
}

function pickArc(lib: Library, state: GameState, cands: Arc[]): [Arc | undefined, GameState] {
  const r = pickWeighted(
    state.rngState,
    cands.map((a) => arcWeight(lib, state, a)),
  );
  return [cands[r.index], { ...state, rngState: r.state }];
}

function drawEvent(lib: Library, state: GameState): [Card | null, GameState] {
  const past = pastOf(state);
  for (const relax of LADDER) {
    const cands = poolCandidates(lib, state, relax, past);
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
  // Out of office the opposition deals from its own deck and nothing else: the bills wait,
  // the stories pause, and the era ends in the return vote (BACKLOG-10 phase 55).
  const sources: Source[] = state.opposition
    ? [...(returnDue(state) ? [["election", drawReturnVote] as Source] : []), ["opposition", drawOpposition]]
    : [
        // An era's first card fills a seat at the table (BACKLOG-10 phase 61).
        ...(appointmentDue(lib, state) ? [["appointment", drawAppointment] as Source] : []),
        ...(electionDue(lib, state) ? [["election", drawElection] as Source] : []),
        // The cards before a vote are the campaign's; bills and stories wait for them
        // (BACKLOG-10 phase 56).
        ...(campaignDue(lib, state) ? [["campaign", drawCampaign] as Source] : []),
        ["queue", tickQueue],
        ["arc", drawArcContinue],
        ["arc", drawQuestionEntry],
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
