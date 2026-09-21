/**
 * Semantic checks on typed content (TRANSFER.md section 8, validator). Pure: takes a
 * Content bundle and options, returns issues. Runs on fixtures in tests and on the real
 * content from the CLI.
 */
import { DEFAULT_CONFIG, type EngineConfig } from "../engine/config";
import { findEpilogue } from "../engine/endings";
import type { Arc, Card, Choice, Cond, Content } from "../engine/types";
import { BANDS, METER_KEYS, PLAYER_ALIGNS } from "../engine/types";
import { Issues, type Issue, type Where } from "./issues";

export interface RuleOptions {
  config: EngineConfig;
  /** Minimum eligible event cards per era × band × align cell. */
  minCell: number;
  /** Eras to check: a list, "all" (1..eraCount) or "auto" (eras that have any pool card). */
  eras: number[] | "all" | "auto";
  /** Soft limits from the content plan (section 10); warnings. */
  maxText: number;
  maxLabel: number;
  /** Advisor traits the engine knows about (5.8); unknown ones warn. */
  knownTraits: readonly string[];
}

export const DEFAULT_RULE_OPTIONS: RuleOptions = {
  config: DEFAULT_CONFIG,
  // cooldownSize + 1: a full cell never needs a cooldown relaxation. MVP should gate higher.
  minCell: DEFAULT_CONFIG.cooldownSize + 1,
  eras: "auto",
  maxText: 160,
  maxLabel: 24,
  knownTraits: ["loyal", "corrupt", "competent", "zealot"],
};

/** Ending ids the engine can reach without any card naming them. */
export function engineEndings(config: EngineConfig): string[] {
  return [
    ...METER_KEYS.flatMap((k) => [config.meterEndings[k].low, config.meterEndings[k].high]),
    config.electionLossEnding,
    config.coupEnding,
    ...BANDS.map((b) => `${config.finalePrefix}${b}`),
  ];
}

export function resolveEras(content: Content, opts: Pick<RuleOptions, "eras" | "config">): { eras: number[]; empty: number[] } {
  const all = Array.from({ length: opts.config.eraCount }, (_, i) => i + 1);
  const present = new Set<number>();
  for (const c of content.cards) if (c.type === "event" && (c.weight ?? 1) > 0) for (const e of c.eras) present.add(e);
  const empty = all.filter((e) => !present.has(e));
  if (opts.eras === "all") return { eras: all, empty };
  if (opts.eras === "auto") return { eras: all.filter((e) => present.has(e)), empty };
  return { eras: [...opts.eras].sort((a, b) => a - b), empty };
}

const SIDES = ["left", "right"] as const;

function signVector(choice: Choice): string {
  const signs = METER_KEYS.map((k) => Math.sign(choice.fx?.[k] ?? 0));
  signs.push(Math.sign(choice.drift ?? 0));
  return signs.join(",");
}

export function checkRules(content: Content, options: Partial<RuleOptions> = {}): Issue[] {
  const opts: RuleOptions = { ...DEFAULT_RULE_OPTIONS, ...options };
  const cfg = opts.config;
  const issues = new Issues();

  // ---- indexes and duplicate ids ----------------------------------------------------
  const cards = new Map<string, Card>();
  for (const c of content.cards) {
    if (cards.has(c.id)) issues.error("duplicate-id", `card id "${c.id}" is defined more than once`, { kind: "card", id: c.id });
    else cards.set(c.id, c);
  }
  const arcs = new Map<string, Arc>();
  for (const a of content.arcs) {
    if (arcs.has(a.id)) issues.error("duplicate-id", `arc id "${a.id}" is defined more than once`, { kind: "arc", id: a.id });
    else arcs.set(a.id, a);
  }
  const endings = new Set<string>();
  for (const e of content.endings) {
    if (endings.has(e.id)) issues.error("duplicate-id", `ending id "${e.id}" is defined more than once`, { kind: "ending", id: e.id });
    endings.add(e.id);
  }
  const advisorIds = new Set<string>();
  const roles = new Set<string>();
  for (const a of content.advisors) {
    if (advisorIds.has(a.id)) issues.error("duplicate-id", `advisor id "${a.id}" is defined more than once`, { kind: "advisor", id: a.id });
    advisorIds.add(a.id);
    roles.add(a.role);
    for (const t of a.traits) {
      if (!opts.knownTraits.includes(t)) issues.warn("trait-unknown", `trait "${t}" is not one of ${opts.knownTraits.join(", ")}`, { kind: "advisor", id: a.id, path: "traits" });
    }
  }
  const modifierIds = new Set<string>();
  for (const m of content.modifiers) {
    if (modifierIds.has(m.id)) issues.error("duplicate-id", `modifier id "${m.id}" is defined more than once`, { kind: "modifier", id: m.id });
    modifierIds.add(m.id);
    for (const arcId of Object.keys(m.arcWeights ?? {})) {
      if (!arcs.has(arcId)) issues.error("unknown-ref", `arcWeights names unknown arc "${arcId}"`, { kind: "modifier", id: m.id, path: `arcWeights.${arcId}` });
    }
  }
  const epilogueKeys = new Set<string>();
  for (const e of content.epilogues) {
    const key = `${e.band}:${e.align}:${e.era}`;
    if (epilogueKeys.has(key)) issues.error("duplicate-id", `epilogue ${key} is defined more than once`, { kind: "epilogue", id: key });
    epilogueKeys.add(key);
    if (e.era > cfg.eraCount) issues.warn("era-out-of-range", `era ${e.era} is beyond eraCount ${cfg.eraCount}`, { kind: "epilogue", id: key, path: "era" });
  }

  const { eras, empty } = resolveEras(content, opts);
  if (opts.eras === "auto") {
    for (const e of empty) issues.warn("era-empty", `era ${e} has no event cards yet, so its cells were not checked (pass eras "all" to require them)`);
  }

  // ---- flags bookkeeping ------------------------------------------------------------
  const flagSets = new Map<string, Where>();
  const flagReads = new Map<string, Where>();
  const flagClears = new Map<string, Where>();
  const note = (map: Map<string, Where>, flag: string, where: Where) => {
    if (!map.has(flag)) map.set(flag, where);
  };
  const checkCond = (cond: Cond | undefined, where: Where, path: string) => {
    if (!cond) return;
    for (const f of cond.flags ?? []) note(flagReads, f, { ...where, path: `${path}.flags` });
    for (const f of cond.notFlags ?? []) note(flagReads, f, { ...where, path: `${path}.notFlags` });
    const both = (cond.flags ?? []).filter((f) => (cond.notFlags ?? []).includes(f));
    for (const f of both) issues.error("cond-unsatisfiable", `flag "${f}" is required and forbidden at once`, { ...where, path });
    for (const k of METER_KEYS) {
      const m = cond.meters?.[k];
      if (!m) continue;
      const p = `${path}.meters.${k}`;
      if (m.lt !== undefined && m.lt <= 0) issues.error("cond-unsatisfiable", `${k} < ${m.lt} can never hold (meters are 0..100)`, { ...where, path: p });
      if (m.gt !== undefined && m.gt >= 100) issues.error("cond-unsatisfiable", `${k} > ${m.gt} can never hold (meters are 0..100)`, { ...where, path: p });
      if (m.lt !== undefined && m.gt !== undefined && m.lt - m.gt < 2) {
        issues.error("cond-unsatisfiable", `${k} > ${m.gt} and < ${m.lt} leaves no integer value`, { ...where, path: p });
      }
    }
  };

  // ---- per-card checks ---------------------------------------------------------------
  for (const card of content.cards) {
    const where: Where = { kind: "card", id: card.id };

    for (const e of card.eras) {
      if (e > cfg.eraCount) issues.warn("era-out-of-range", `era ${e} is beyond eraCount ${cfg.eraCount}; the card is unreachable until more eras ship`, { ...where, path: "eras" });
    }
    if (!roles.has(card.speaker)) issues.error("speaker-unknown", `no advisor has the role "${card.speaker}"`, { ...where, path: "speaker" });
    if (card.text.length > opts.maxText) issues.warn("text-length", `text is ${card.text.length} characters; the plan says under ${opts.maxText}`, { ...where, path: "text" });
    checkCond(card.cond, where, "cond");

    if (card.arc) {
      const arc = arcs.get(card.arc);
      if (!arc) issues.error("unknown-ref", `arc "${card.arc}" does not exist`, { ...where, path: "arc" });
      else if (!arc.cards.includes(card.id)) issues.error("arc-membership", `tagged arc "${card.arc}" but that arc's card list does not include it`, { ...where, path: "arc" });
      if (card.type !== "arc") issues.error("arc-membership", `cards that belong to an arc must have type "arc", got "${card.type}"`, { ...where, path: "type" });
    } else if (card.type === "arc") {
      issues.error("arc-membership", `type "arc" requires an arc id`, { ...where, path: "arc" });
    }

    let honest = 0;
    for (const side of SIDES) {
      const ch = card[side];
      if (ch.honest) honest++;
      if (ch.label.length > opts.maxLabel) issues.warn("label-length", `label is ${ch.label.length} characters; the plan says under ${opts.maxLabel}`, { ...where, path: `${side}.label` });
      for (const k of METER_KEYS) {
        if (ch.fx && ch.fx[k] === 0) issues.warn("fx-zero", `${k}: 0 does nothing; drop it`, { ...where, path: `${side}.fx.${k}` });
      }
      if (card.type !== "election" && (ch.honest !== undefined || ch.electionDelay !== undefined)) {
        issues.error("honest-misplaced", `honest / electionDelay only mean something on election cards`, { ...where, path: side });
      }
      if (ch.fireSpeaker && (content.advisors.filter((a) => a.role === card.speaker).length < 2)) {
        issues.warn("fire-no-replacement", `role "${card.speaker}" has no second advisor, so firing does nothing`, { ...where, path: `${side}.fireSpeaker` });
      }

      (ch.enqueue ?? []).forEach((e, i) => {
        const target = cards.get(e.id);
        const path = `${side}.enqueue[${i}].id`;
        if (!target) issues.error("unknown-ref", `enqueues unknown card "${e.id}"`, { ...where, path });
        else if (target.arc) issues.warn("next-into-arc", `enqueues "${e.id}" which belongs to arc "${target.arc}"; arcs normally start through their entry card`, { ...where, path });
      });
      if (ch.next) {
        const target = cards.get(ch.next);
        const path = `${side}.next`;
        if (!target) issues.error("unknown-ref", `next points at unknown card "${ch.next}"`, { ...where, path });
        else if (card.arc && target.arc !== card.arc) issues.error("arc-next-outside", `next "${ch.next}" is not part of arc "${card.arc}"`, { ...where, path });
        else if (!card.arc && target.arc) issues.warn("next-into-arc", `next jumps into arc "${target.arc}" without entering it through the arc`, { ...where, path });
      }
      if (ch.ending && !endings.has(ch.ending)) issues.error("unknown-ref", `ending "${ch.ending}" does not exist`, { ...where, path: `${side}.ending` });

      for (const f of ch.setFlags ?? []) note(flagSets, f, { ...where, path: `${side}.setFlags` });
      for (const f of ch.clearFlags ?? []) note(flagClears, f, { ...where, path: `${side}.clearFlags` });
      for (const f of (ch.setFlags ?? []).filter((x) => (ch.clearFlags ?? []).includes(x))) {
        issues.error("flag-set-and-cleared", `flag "${f}" is set and cleared by the same choice`, { ...where, path: side });
      }
    }

    if (card.type === "election" && honest !== 1) {
      issues.error("election-honest", `election cards need exactly one side marked honest, found ${honest}`, where);
    }
    if (card.type === "ending" && (!card.left.ending || !card.right.ending)) {
      issues.warn("ending-card", `type "ending" cards usually end the run on both sides`, where);
    }
    if (card.type !== "ending" && signVector(card.left) === signVector(card.right)) {
      issues.warn("no-tradeoff", `both choices move every meter and drift in the same direction (no real tradeoff)`, where);
    }
  }

  // ---- arcs ---------------------------------------------------------------------------
  for (const arc of content.arcs) {
    const where: Where = { kind: "arc", id: arc.id };
    for (const e of arc.entry.eras) {
      if (e > cfg.eraCount) issues.warn("era-out-of-range", `entry era ${e} is beyond eraCount ${cfg.eraCount}`, { ...where, path: "entry.eras" });
    }
    checkCond(arc.entry, where, "entry");
    if (arc.weight <= 0) issues.error("arc-dead", `weight 0 means the arc can never start`, { ...where, path: "weight" });

    const members = new Set(arc.cards);
    arc.cards.forEach((id, i) => {
      const c = cards.get(id);
      if (!c) issues.error("unknown-ref", `lists unknown card "${id}"`, { ...where, path: `cards[${i}]` });
      else if (c.arc !== arc.id) issues.error("arc-membership", `lists card "${id}" which is tagged arc "${c.arc ?? "none"}"`, { ...where, path: `cards[${i}]` });
    });

    const entry = arc.cards[0];
    if (entry === undefined) continue;
    const reached = new Set<string>();
    const stack = [entry];
    let hasExit = false;
    while (stack.length) {
      const id = stack.pop()!;
      if (reached.has(id)) continue;
      reached.add(id);
      const c = cards.get(id);
      if (!c) continue;
      for (const side of SIDES) {
        const ch = c[side];
        if (ch.ending || !ch.next) hasExit = true;
        else if (members.has(ch.next)) stack.push(ch.next);
      }
    }
    for (const id of arc.cards) {
      if (!reached.has(id)) issues.error("arc-unreachable", `card "${id}" cannot be reached from the entry card "${entry}"`, { ...where, path: "cards" });
    }
    if (!hasExit) issues.error("arc-no-exit", `no reachable choice leaves the arc (every side has a next and no ending)`, where);

    // Cycle detection over reachable members.
    const color = new Map<string, 1 | 2>();
    const visit = (id: string): boolean => {
      color.set(id, 1);
      const c = cards.get(id);
      for (const side of SIDES) {
        const n = c?.[side].next;
        if (!n || !members.has(n) || !reached.has(n)) continue;
        const col = color.get(n);
        if (col === 1) return true;
        if (col === undefined && visit(n)) return true;
      }
      color.set(id, 2);
      return false;
    };
    if (visit(entry)) issues.warn("arc-cycle", `next pointers form a loop; make sure a refusal can always end it`, where);
  }

  // ---- reachability: cards, then endings ----------------------------------------------
  const reachable = new Set<string>();
  const queue: string[] = [];
  const seed = (id: string) => {
    if (!reachable.has(id)) {
      reachable.add(id);
      queue.push(id);
    }
  };
  for (const c of content.cards) {
    if ((c.type === "event" || c.type === "election") && (c.weight ?? 1) > 0) seed(c.id);
  }
  for (const a of content.arcs) {
    const entry = a.cards[0];
    if (a.weight > 0 && a.entry.eras.length > 0 && a.entry.bands.length > 0 && entry !== undefined) seed(entry);
  }
  while (queue.length) {
    const c = cards.get(queue.pop()!);
    if (!c) continue;
    for (const side of SIDES) {
      for (const e of c[side].enqueue ?? []) if (cards.has(e.id)) seed(e.id);
      const n = c[side].next;
      if (n && cards.has(n)) seed(n);
    }
  }
  for (const c of content.cards) {
    if (reachable.has(c.id) || c.arc) continue;
    const why = c.type === "event" || c.type === "election" ? "weight is 0" : `type "${c.type}" is never drawn from the pool`;
    issues.error("card-unreachable", `can never be drawn: ${why} and nothing enqueues or points at it`, { kind: "card", id: c.id });
  }

  const reachableEndings = new Set(engineEndings(cfg));
  for (const id of reachable) {
    const c = cards.get(id);
    for (const side of SIDES) if (c?.[side].ending) reachableEndings.add(c[side].ending);
  }
  for (const id of engineEndings(cfg)) {
    if (!endings.has(id)) issues.error("ending-missing", `the engine can end a run with "${id}" but no ending defines it`, { kind: "ending", id });
  }
  for (const e of content.endings) {
    if (!reachableEndings.has(e.id)) issues.error("ending-unreachable", `no reachable card and no engine rule can end the run with it`, { kind: "ending", id: e.id });
  }

  // ---- flags ----------------------------------------------------------------------------
  for (const a of content.arcs) checkCond(a.entry, { kind: "arc", id: a.id }, "entry");
  for (const m of content.modifiers) for (const f of m.flags ?? []) note(flagSets, f, { kind: "modifier", id: m.id, path: "flags" });
  const engineReads = new Set([cfg.electionsAbolishedFlag]);
  // The engine sets one flag per advisor trait sitting in the cabinet (5.8), so content
  // may read `advisor_<trait>` without any card setting it.
  const traitsInPlay = new Set(content.advisors.flatMap((a) => a.traits));
  const engineSets = (f: string) => f.startsWith(cfg.advisorFlagPrefix);
  for (const [f, where] of flagSets) {
    if (!flagReads.has(f) && !engineReads.has(f)) issues.error("flag-unread", `flag "${f}" is set but nothing reads it`, where);
  }
  for (const [f, where] of flagReads) {
    if (engineSets(f)) {
      const trait = f.slice(cfg.advisorFlagPrefix.length);
      if (!traitsInPlay.has(trait)) {
        issues.error("flag-unset", `no advisor has the trait "${trait}", so "${f}" is never set`, where);
      }
      continue;
    }
    if (!flagSets.has(f)) issues.error("flag-unset", `flag "${f}" is read but nothing sets it`, where);
  }
  for (const f of engineReads) {
    if (!flagSets.has(f)) issues.warn("flag-unset", `the engine reads flag "${f}" but no content sets it`);
  }
  for (const [f, where] of flagClears) {
    if (!flagSets.has(f)) issues.error("flag-cleared-unset", `flag "${f}" is cleared but nothing sets it`, where);
  }

  // ---- coverage: cells, elections, epilogues ----------------------------------------------
  const pool = content.cards.filter((c) => c.type === "event" && (c.weight ?? 1) > 0);
  const electionCards = content.cards.filter((c) => c.type === "election" && (c.weight ?? 1) > 0);
  for (const era of eras) {
    for (const band of BANDS) {
      for (const align of PLAYER_ALIGNS) {
        const fits = (c: Card) => c.eras.includes(era) && c.bands.includes(band) && (c.align === align || c.align === "any");
        const n = pool.filter(fits).length;
        if (n < opts.minCell) issues.error("cell-thin", `era ${era} × ${band} × ${align}: ${n} eligible event cards, minimum ${opts.minCell}`);
        const unconditional = electionCards.filter((c) => fits(c) && !c.cond?.flags?.length && !c.cond?.meters);
        if (unconditional.length === 0) issues.error("election-missing", `era ${era} × ${band} × ${align}: no unconditional election card, so a due election could be skipped`);
        if (!findEpilogue({ epilogues: content.epilogues }, band, align, era)) {
          issues.error("epilogue-missing", `no epilogue resolves for band ${band}, align ${align}, era ${era}`);
        }
      }
    }
  }

  return issues.items;
}
