import type { Card, Side } from "./types";

/**
 * Carried once a run has won a campaign the easy way (BACKLOG-11 phase 66): taken the side of a
 * campaign card that drifts toward Decay. A clean fight is a promise never to, and until this
 * flag it could be kept through every easy campaign a run was dealt.
 */
export const EASY_CAMPAIGN_FLAG = "easy_campaign";

/**
 * The easy side of a campaign card: the one that drifts toward Decay, below zero and below the
 * other side. The validator asks every campaign card for one (BACKLOG-10 phase 56 asked the
 * easy side to lift the coalition at least as far as the honest one).
 */
export function easySide(card: Card): Side | null {
  if (!card.campaign) return null;
  const left = card.left.drift ?? 0;
  const right = card.right.drift ?? 0;
  if (left === right) return null;
  const side: Side = left < right ? "left" : "right";
  return Math.min(left, right) < 0 ? side : null;
}
