/**
 * The flags that name something the country is left carrying, as opposed to the bookkeeping
 * an arc uses while it runs. Only these are recorded and shown, because a codex full of
 * `east_talks` and `rival_smeared` is a debug view, not a history (BACKLOG item 10).
 *
 * The label is written from the country's side, not yours: it is what was done to it.
 */
export const LEGACIES: Record<string, string> = {
  elections_abolished: "The vote was abolished",
  cheated_election: "An election was counted twice",
  media_captured: "The press answers to the office",
  purge_begun: "A purge was begun",
  general_unleashed: "The general was unleashed",
  buried_the_audit: "An audit was buried",
  took_the_skim: "The skim was taken",
  pension_raided: "The pensions were spent",
  schools_starved: "The schools were starved",
  water_rationed: "The water was rationed",
  bridge_ignored: "The bridge was left to fall",
  feed_captured: "The feed is run from here",
  dirty_politics: "The habit of the cheap win",
  housing_built: "The housing was built",
  seawall: "The seawall stands",
  moonshot_funded: "The moonshot was funded",
  orbit_reached: "Orbit was reached",
  long_ship: "The long ship left",
  ring_started: "The ring was begun",
  oracle_running: "The oracle is still running",
  commission_open: "The commission is still sitting",
  referendum_called: "The country was asked directly",
  heir_named: "An heir was named",
  broke_balance: "The deficit promise was broken",
  broke_inquiry: "The inquiry promise was broken",
  broke_homes: "The housing promise was broken",
  broke_taxes: "The tax promise was broken",
  habit_skim: "Money was taken by habit",
  habit_bend: "The rule bent for the same people",
  habit_clamp: "The answer was always the same one",
  counted_late_boxes: "A district was counted after the close",
  broke_mandate: "The promise it was taken on was broken",
  // The questions (BACKLOG-6 phase 40): each answer is something the country carries, and how
  // it was carried out is what the history's direction says about it.
  went_to_war: "The country went to war for its ally",
  stayed_out: "The country stayed out of its ally's war",
  mass_deportation: "Everyone without papers was ordered out",
  papers_granted: "A way to papers was opened",
  top_rate_cut: "The top rate was cut",
  top_rate_raised: "The very rich were taxed",
  universal_care: "Care was made universal",
  care_market: "Care was left to the market",
};

export const LEGACY_FLAGS: ReadonlySet<string> = new Set(Object.keys(LEGACIES));
