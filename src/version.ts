/**
 * Bump with every deploy (TRANSFER.md section 12). From phase 7 on, bump CACHE_NAME in
 * public/sw.js in the same commit.
 */
export const APP_VERSION = "0.35.0";
/** Gates run-state save migrations. Change only with a migration function. */
export const RUN_SAVE_VERSION = 8;
/** Player settings are versioned separately again: they outlive both a run and a profile. */
export const SETTINGS_VERSION = 2;
/** Meta progression is versioned separately from run state (section 12). */
export const META_SAVE_VERSION = 4;
