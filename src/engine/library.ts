import type { Advisor, Align, Arc, Band, Card, Content, Ending, Epilogue, Modifier } from "./types";
import { BANDS } from "./types";
import { DEFAULT_CONFIG, type EngineConfig } from "./config";

/**
 * Indexed, read-only view of a Content bundle plus the engine config. Every engine
 * function takes a Library so tests can run on fixtures and the harness can sweep
 * config values without touching the real content.
 */
export interface Library {
  config: EngineConfig;
  content: Content;
  cards: ReadonlyMap<string, Card>;
  arcs: ReadonlyMap<string, Arc>;
  endings: ReadonlyMap<string, Ending>;
  modifiers: ReadonlyMap<string, Modifier>;
  advisorsByRole: ReadonlyMap<string, Advisor[]>;
  advisorsById: ReadonlyMap<string, Advisor>;
  roles: readonly string[];
  /** Event cards with weight > 0 keyed by `${era}:${band}:${align}`; align is "left" | "right" | "any". */
  eventPool: ReadonlyMap<string, Card[]>;
  electionCards: readonly Card[];
  /** The opposition deck: events dealt only while the run is out of office (BACKLOG-10 phase 55). */
  oppositionCards: readonly Card[];
  /** The votes that end an opposition, one dealt on the era's last card. */
  returnVotes: readonly Card[];
  /** The campaign deck: events dealt only in the cards before a vote in office (BACKLOG-10 phase 56). */
  campaignCards: readonly Card[];
  /** Each cabinet seat's appointment card, dealt only at an era's start (BACKLOG-10 phase 61). */
  appointmentCards: ReadonlyMap<string, Card>;
  epilogues: readonly Epilogue[];
  /** Every era number that at least one event card lists, ascending. */
  eras: readonly number[];
}

export function poolKey(era: number, band: Band, align: Align): string {
  return `${era}:${band}:${align}`;
}

export function buildLibrary(content: Content, overrides: Partial<EngineConfig> = {}): Library {
  const config: EngineConfig = { ...DEFAULT_CONFIG, ...overrides };
  const cards = new Map<string, Card>();
  for (const c of content.cards) {
    if (cards.has(c.id)) throw new Error(`duplicate card id: ${c.id}`);
    cards.set(c.id, c);
  }
  const arcs = new Map<string, Arc>();
  for (const a of content.arcs) {
    if (arcs.has(a.id)) throw new Error(`duplicate arc id: ${a.id}`);
    arcs.set(a.id, a);
  }
  const endings = new Map<string, Ending>();
  for (const e of content.endings) {
    if (endings.has(e.id)) throw new Error(`duplicate ending id: ${e.id}`);
    endings.set(e.id, e);
  }
  const modifiers = new Map<string, Modifier>();
  for (const m of content.modifiers) modifiers.set(m.id, m);

  const advisorsByRole = new Map<string, Advisor[]>();
  const advisorsById = new Map<string, Advisor>();
  for (const a of content.advisors) {
    if (advisorsById.has(a.id)) throw new Error(`duplicate advisor id: ${a.id}`);
    advisorsById.set(a.id, a);
    const list = advisorsByRole.get(a.role) ?? [];
    list.push(a);
    advisorsByRole.set(a.role, list);
  }
  const roles = [...advisorsByRole.keys()].sort();

  const eventPool = new Map<string, Card[]>();
  const electionCards: Card[] = [];
  const oppositionCards: Card[] = [];
  const returnVotes: Card[] = [];
  const campaignCards: Card[] = [];
  const appointmentCards = new Map<string, Card>();
  const eraSet = new Set<number>();
  for (const c of content.cards) {
    // A seat's appointment, dealt only as an era's first card (BACKLOG-10 phase 61).
    if (c.appoints) {
      appointmentCards.set(c.appoints, c);
      continue;
    }
    // The opposition's own deck and its return votes, dealt only while the run is out of
    // office and never from the ordinary pools (BACKLOG-10 phase 55).
    if (c.opposition) {
      if (c.type === "election") returnVotes.push(c);
      else if (c.type === "event" && (c.weight ?? 1) > 0) oppositionCards.push(c);
      continue;
    }
    // The campaign's own deck, dealt only before a vote (BACKLOG-10 phase 56).
    if (c.campaign) {
      if (c.type === "event" && (c.weight ?? 1) > 0) campaignCards.push(c);
      continue;
    }
    if (c.type === "election") {
      electionCards.push(c);
      continue;
    }
    if (c.type !== "event") continue;
    if ((c.weight ?? 1) <= 0) continue;
    for (const era of c.eras) {
      eraSet.add(era);
      for (const band of c.bands) {
        if (!BANDS.includes(band)) throw new Error(`card ${c.id}: unknown band ${band}`);
        const key = poolKey(era, band, c.align);
        const list = eventPool.get(key) ?? [];
        // Once per list, so a draw from one cell never needs to look for a card twice.
        if (!list.includes(c)) list.push(c);
        eventPool.set(key, list);
      }
    }
  }

  return {
    config,
    content,
    cards,
    arcs,
    endings,
    modifiers,
    advisorsByRole,
    advisorsById,
    roles,
    eventPool,
    electionCards,
    oppositionCards,
    returnVotes,
    campaignCards,
    appointmentCards,
    epilogues: content.epilogues,
    eras: [...eraSet].sort((a, b) => a - b),
  };
}

export function getCard(lib: Library, id: string): Card {
  const card = lib.cards.get(id);
  if (!card) throw new Error(`unknown card id: ${id}`);
  return card;
}

/** The question an arc asks, or undefined for a story (BACKLOG-6 phase 40). */
export function questionOfArc(lib: Library, arcId: string): string | undefined {
  return lib.arcs.get(arcId)?.question;
}

/** The question a card belongs to, whichever of its steps it is, or undefined. */
export function questionOf(lib: Library, card: Pick<Card, "arc">): string | undefined {
  return card.arc === undefined ? undefined : questionOfArc(lib, card.arc);
}
