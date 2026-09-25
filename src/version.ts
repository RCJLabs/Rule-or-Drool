/**
 * Bump with every deploy (TRANSFER.md section 12). From phase 7 on, bump CACHE_NAME in
 * public/sw.js in the same commit.
 */
export const APP_VERSION = "0.68.0";
/** Gates run-state save migrations. Change only with a migration function. */
export const RUN_SAVE_VERSION = 13;
/** Player settings are versioned separately again: they outlive both a run and a profile. */
export const SETTINGS_VERSION = 4;
/** Meta progression is versioned separately from run state (section 12). */
export const META_SAVE_VERSION = 7;
/**
 * Part of the deck stamp (BACKLOG-8 phase 49), for what the content cannot say: bump it when
 * the engine's own code deals or scores differently. `tests/engine/deck.test.ts` fails when
 * the deal moves and the stamp does not.
 */
export const DEAL_VERSION = 3;
