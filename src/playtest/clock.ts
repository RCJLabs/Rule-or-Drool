import type { Side } from "../engine/types";
import type { Measure } from "./record";

/**
 * How long a card is in front of the player, and how long each side's preview is up
 * (BACKLOG-5 phase 31). Stopped while the page is hidden or a menu is over the card, so a
 * phone put down mid-card, or a trip to the settings, is not read as a hard decision. The
 * cabinet does not stop it: looking up the rival before an election is part of deciding.
 *
 * A preview counts from the first frame it shows, which for a drag is 8px of travel, so a
 * decisive swipe still shows a few hundred milliseconds of looking at the side it went.
 * The report decides how long a look has to be to count; the clock only measures.
 */
export class CardClock {
  private total = 0;
  private readonly looked: [number, number] = [0, 0];
  private since: number;
  private side: Side | null = null;

  constructor(
    private readonly now: () => number,
    private running = true,
  ) {
    this.since = now();
  }

  private tick(): void {
    const t = this.now();
    if (this.running) {
      const d = Math.max(0, t - this.since);
      this.total += d;
      if (this.side) this.looked[this.side === "left" ? 0 : 1] += d;
    }
    this.since = t;
  }

  setRunning(on: boolean): void {
    this.tick();
    this.running = on;
  }

  setPreview(side: Side | null): void {
    this.tick();
    this.side = side;
  }

  read(): Measure {
    this.tick();
    return { ms: Math.round(this.total), looked: [Math.round(this.looked[0]), Math.round(this.looked[1])] };
  }
}
