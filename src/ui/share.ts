import { STRINGS } from "../content/strings";
import { DEFAULT_CONFIG } from "../engine/config";
import type { GameState } from "../engine/types";
import { dailyNumber, encodeRunCode, encodeRunResult, runCodeOf, type History, type RunResult } from "../meta";
import { DRIFT_REACH, type ShapePoint } from "./shape";

/**
 * Taking a run out of the game (BACKLOG-2 phase 11). "Look what happened to me" is how this
 * genre travels, and until now a run could not leave the device.
 *
 * Three things go out together: a few lines of text written for a group chat, a picture made
 * from the run's own world-after scene with its history on it, and a link that starts the
 * same run for whoever opens it — the same run, from the same setup, not the same seed read
 * through somebody else's unlocks.
 */

/**
 * The link that starts this run, on whatever host the game is being served from. With the
 * run's result, it says how it went as well, so the end of theirs can put the two side by side
 * (BACKLOG-5 phase 37). The run code is left as it was, so a version of the game from before
 * that still opens the link. The deck the run was dealt from rides beside it the same way
 * (BACKLOG-8 phase 49), and is left out for a run no one deck dealt.
 */
export function shareLink(state: GameState, base = typeof location === "undefined" ? "" : `${location.origin}${location.pathname}`, result: RunResult | null = null): string {
  const deck = state.deck ? `&deck=${state.deck}` : "";
  return `${base}?run=${encodeRunCode(runCodeOf(state))}${deck}${result ? `&vs=${encodeRunResult(result)}` : ""}`;
}

/**
 * Short enough to read in a chat preview: what history called it, the facts of the run, the
 * biggest things left behind, and the way in.
 */
export function shareText(state: GameState, history: History, endingTitle: string, link: string, dailyDay?: string): string {
  const { daily, left, play } = STRINGS.share;
  // A daily leads with its number, *Rule or Drool #412*, so a group can line their days up
  // without opening anyone's link (BACKLOG-5 phase 38).
  const n = dailyDay ? dailyNumber(dailyDay) : null;
  const title = n ? `${STRINGS.title} ${daily.replace("{n}", String(n))}` : STRINGS.title;
  const head = `${title} — “${history.title}”`;
  const facts = runFacts(state, endingTitle);
  const things = history.consequences.filter((c) => c.label).slice(0, 3).map((c, i) => (i === 0 ? c.label : lowerFirst(c.label)));
  const lines = [head, facts];
  if (things.length) lines.push(`${left} ${things.join("; ")}.`);
  lines.push(`${play} ${link}`);
  return lines.join("\n");
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * "The Commons · 105 cards · Orbit": a party name starts a line here, so it is capitalised. A
 * long reign says so, since its card count is not the ordinary game's (BACKLOG-5 phase 39), and
 * so does a first or short term (BACKLOG-10 phase 59, BACKLOG-12 phase 77).
 */
export function runFacts(state: GameState, endingTitle: string): string {
  const eras = state.eraCount ?? DEFAULT_CONFIG.eraCount;
  const reign = eras > DEFAULT_CONFIG.eraCount ? ` · ${STRINGS.reign.short}` : eras < DEFAULT_CONFIG.eraCount ? ` · ${STRINGS.reign.firstShort}` : "";
  return `${upperFirst(STRINGS.parties[state.align])}${reign} · ${STRINGS.share.cards.replace("{n}", String(state.cardCount))} · ${endingTitle}`;
}

export interface CardText {
  when: string;
  kicker: string;
  title: string;
  facts: string;
  /** A daily's number, beside the game's name. */
  number?: number;
}

export const CARD_W = 1200;
export const CARD_H = 720;
const CARD_PAD = 56;
/** The strip under the picture that carries the run's direction (BACKLOG-12 phase 75). */
export const STRIP_H = 132;
/** The ground the card's words and strip stand on, the fade's darkest. */
const GROUND = "#08060a";

/** What the card's strip is drawn from: the run's shape, and where its eras and bands fall. */
export interface CardShape {
  points: readonly ShapePoint[];
  eraLength: number;
  bandAscentAt: number;
  bandDecayAt: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The card's strip in the card's own pixels: the direction, card by card, against its middle;
 * the Ascent's side and Decay's, from their band lines to the strip's edges; and a hairline
 * where each era after the first began. The end screen's direction row, as a picture can carry it.
 */
export interface Strip {
  box: Box;
  line: [number, number][];
  up: { top: number; bottom: number };
  down: { top: number; bottom: number };
  middle: number;
  eras: number[];
}

export function stripOf(shape: CardShape, box: Box): Strip {
  const n = Math.max(1, shape.points.length - 1);
  const x = (card: number) => box.x + (card / n) * box.w;
  const y = (drift: number) => box.y + ((DRIFT_REACH - Math.max(-DRIFT_REACH, Math.min(DRIFT_REACH, drift))) / (2 * DRIFT_REACH)) * box.h;
  const eras: number[] = [];
  for (let card = shape.eraLength; card < n; card += shape.eraLength) eras.push(x(card));
  return {
    box,
    line: shape.points.map((p) => [x(p.card), y(p.drift)]),
    up: { top: y(DRIFT_REACH), bottom: y(shape.bandAscentAt) },
    down: { top: y(shape.bandDecayAt), bottom: y(-DRIFT_REACH) },
    middle: y(0),
    eras,
  };
}

/** Where the strip is plotted on a card: right of the names of its sides, in the band under the picture. */
export const STRIP_BOX: Box = { x: CARD_PAD + 96, y: CARD_H + 20, w: CARD_W - CARD_PAD * 2 - 96, h: STRIP_H - 40 };

/**
 * The picture: the run's own scene at 3x, with its history across the bottom, and under it the
 * way the country went, card by card, for a run that can be dealt again (BACKLOG-12 phase 75).
 * Drawn on a canvas from the scene already on screen, so the card is exactly what the player
 * saw, and the text is drawn by the canvas rather than inside the SVG so it can be measured and
 * fitted.
 */
export async function renderCard(scene: SVGSVGElement, text: CardText, shape: CardShape | null = null): Promise<Blob> {
  const clone = scene.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(CARD_W));
  clone.setAttribute("height", String(CARD_H));
  const svg = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H + (shape ? STRIP_H : 0);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d canvas");
  ctx.drawImage(img, 0, 0, CARD_W, CARD_H);

  // The words need a dark ground whatever the sky was: gold dawn and red smoke alike. Over a
  // strip, it ends in the strip's own ground, so the picture runs into it without a seam.
  const fade = ctx.createLinearGradient(0, CARD_H * 0.42, 0, CARD_H);
  fade.addColorStop(0, "rgba(8, 6, 10, 0)");
  fade.addColorStop(0.55, "rgba(8, 6, 10, 0.78)");
  fade.addColorStop(1, shape ? GROUND : "rgba(8, 6, 10, 0.94)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const family = `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  const pad = CARD_PAD;
  pill(ctx, `${STRINGS.title.toUpperCase()}${text.number ? ` ${STRINGS.share.daily.replace("{n}", String(text.number))}` : ""}`, pad, 40, family);
  pill(ctx, text.when.toUpperCase(), CARD_W - pad, 40, family, "right");

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  const lines = fitTitle(ctx, text.title, CARD_W - pad * 2, family);
  const size = lines.size;
  let y = CARD_H - pad - 44 - (lines.lines.length - 1) * size * 1.06;
  ctx.font = `600 22px ${family}`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.fillText(text.kicker.toUpperCase(), pad, y - size - 10);
  ctx.font = `800 ${size}px ${family}`;
  ctx.fillStyle = "#fff";
  for (const line of lines.lines) {
    ctx.fillText(line, pad, y);
    y += size * 1.06;
  }
  ctx.font = `500 26px ${family}`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.fillText(text.facts, pad, CARD_H - pad + 4, CARD_W - pad * 2);
  if (shape) drawStrip(ctx, stripOf(shape, STRIP_BOX), family);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

/**
 * The strip on the fade's own ground. One line in white, the sides washed in the chart's gold
 * and violet for dark paper and named, the middle dashed, the eras as hairlines. No numbers.
 */
function drawStrip(ctx: CanvasRenderingContext2D, strip: Strip, family: string): void {
  const { box } = strip;
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, CARD_H, CARD_W, STRIP_H);
  ctx.fillStyle = "rgba(201, 133, 0, 0.32)";
  ctx.fillRect(box.x, strip.up.top, box.w, strip.up.bottom - strip.up.top);
  ctx.fillStyle = "rgba(144, 133, 233, 0.32)";
  ctx.fillRect(box.x, strip.down.top, box.w, strip.down.bottom - strip.down.top);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  for (const x of strip.eras) {
    ctx.beginPath();
    ctx.moveTo(x, box.y);
    ctx.lineTo(x, box.y + box.h);
    ctx.stroke();
  }
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
  ctx.beginPath();
  ctx.moveTo(box.x, strip.middle);
  ctx.lineTo(box.x + box.w, strip.middle);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#fff";
  ctx.beginPath();
  strip.line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  // Where it ended, ringed in the ground so it stands off the line.
  const [endX, endY] = strip.line[strip.line.length - 1]!;
  ctx.beginPath();
  ctx.arc(endX, endY, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = GROUND;
  ctx.stroke();
  ctx.font = `700 16px ${family}`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
  ctx.textBaseline = "top";
  ctx.fillText(STRINGS.bands.ascent.toUpperCase(), CARD_PAD, box.y);
  ctx.textBaseline = "bottom";
  ctx.fillText(STRINGS.bands.decay.toUpperCase(), CARD_PAD, box.y + box.h);
}

/** The biggest title that fits in two lines, and the lines it breaks into. */
function fitTitle(ctx: CanvasRenderingContext2D, title: string, width: number, family: string): { size: number; lines: string[] } {
  for (let size = 80; size >= 40; size -= 4) {
    ctx.font = `800 ${size}px ${family}`;
    if (ctx.measureText(title).width <= width) return { size, lines: [title] };
    const words = title.split(" ");
    for (let cut = words.length - 1; cut > 0; cut--) {
      const a = words.slice(0, cut).join(" ");
      const b = words.slice(cut).join(" ");
      if (ctx.measureText(a).width <= width && ctx.measureText(b).width <= width) return { size, lines: [a, b] };
    }
  }
  return { size: 40, lines: [title] };
}

function pill(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, family: string, align: "left" | "right" = "left"): void {
  ctx.font = `700 18px ${family}`;
  const w = ctx.measureText(label).width + 28;
  const left = align === "left" ? x : x - w;
  ctx.fillStyle = "rgba(8, 6, 10, 0.72)";
  ctx.beginPath();
  // roundRect is recent; a square pill is better than no card on an older browser.
  if (typeof ctx.roundRect === "function") ctx.roundRect(left, y, w, 34, 17);
  else ctx.rect(left, y, w, 34);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(label, left + 14, y + 18);
}

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/**
 * Hand the run to the platform's share sheet where there is one (phones, and the Play build),
 * with the picture attached where the platform takes files. Everywhere else, the text goes to
 * the clipboard and the picture is saved, which is the same thing done by hand.
 */
export async function shareRun(text: string, card: Blob | null, fileName: string): Promise<ShareOutcome> {
  const file = card ? new File([card], fileName, { type: "image/png" }) : null;
  try {
    if (typeof navigator.share === "function") {
      const data: ShareData = file && navigator.canShare?.({ files: [file] }) ? { files: [file], text } : { text };
      await navigator.share(data);
      return "shared";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "cancelled";
    // A share sheet that refused the file still leaves the fallback below.
  }
  try {
    await navigator.clipboard?.writeText(text);
    if (file) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
    return "copied";
  } catch {
    return "failed";
  }
}

export type SendOutcome = "shared" | "saved" | "cancelled" | "failed";

/**
 * Hand a file to the share sheet, where the player picks where it goes; where there is no
 * share sheet, or it will not take the file, save it as a download. The game sends nothing
 * itself. Used for the playtest record and for moving progress (BACKLOG-5 phases 31, 33).
 */
export async function handFile(file: File, words: { title: string; text: string }): Promise<SendOutcome> {
  try {
    if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], ...words });
      return "shared";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "cancelled";
    // A share sheet that refused the file still leaves the download below.
  }
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "saved";
  } catch {
    return "failed";
  }
}
