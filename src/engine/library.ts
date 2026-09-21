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
  roles: readonly string[];
  /** Event cards with weight > 0 keyed by `${era}:${band}:${align}`; align is "left" | "right" | "any". */
  eventPool: ReadonlyMap<string, Card[]>;
  electionCards: readonly Card[];
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
  for (const a of content.advisors) {
    const list = advisorsByRole.get(a.role) ?? [];
    list.push(a);
    advisorsByRole.set(a.role, list);
  }
  const roles = [...advisorsByRole.keys()].sort();

  const eventPool = new Map<string, Card[]>();
  const electionCards: Card[] = [];
  const eraSet = new Set<number>();
  for (const c of content.cards) {
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
        list.push(c);
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
    roles,
    eventPool,
    electionCards,
    epilogues: content.epilogues,
    eras: [...eraSet].sort((a, b) => a - b),
  };
}

export function getCard(lib: Library, id: string): Card {
  const card = lib.cards.get(id);
  if (!card) throw new Error(`unknown card id: ${id}`);
  return card;
}
