/**
 * Display strings. Data keys are `left` / `right`; every player-facing name lives here.
 * Title, country and party names are OPEN in TRANSFER.md, so these are placeholders.
 */
export const STRINGS = {
  title: "Rule or Drool",
  country: "the Republic",
  parties: { left: "the Commons", right: "the Ledger" },
  meters: { mood: "Mood", money: "Money", order: "Order", inst: "Institutions" },
  bands: { decay: "Decay", muddle: "Muddle", ascent: "Ascent" },
  roles: {
    treasurer: "Treasurer",
    general: "General",
    spin: "Press Secretary",
    chief: "Chief of Staff",
    judge: "Chief Justice",
    scientist: "Chief Scientist",
    tycoon: "Donor",
    organizer: "Organizer",
    rival: "Rival",
  },
} as const;
