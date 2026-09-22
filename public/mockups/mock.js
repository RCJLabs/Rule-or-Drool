/**
 * The mock-phone renderer, shared by both rounds of path mockups (BACKLOG-3 phase 18).
 *
 * The default frame is the game's own layout — a meter row, a card centred in a stage, a
 * status footer — because a treatment that only works with its own layout is not really a
 * treatment. A round-two idea that genuinely needs a different structure (a notification
 * stack, a full-bleed clip) supplies `render` and takes the whole frame instead.
 */

/** Meter values as a Decay run and an Ascent run actually carry them, with the game's labels. */
export const DOWN = [["Fans", 34], ["Money", 41], ["Everyone", 28], ["CA$H", 22], ["Cops", 63], ["The System", 19]];
export const UP = [["Movement", 61], ["Unions", 58], ["Cities", 66], ["Money", 54], ["Order", 57], ["Institutions", 71]];
export const FOOT = "<b>The Long Afternoon</b> · Year 14";

export function meters(rows, numeric) {
  return rows
    .map(
      ([label, v]) => `
    <div class="mk-m"${numeric ? ` data-v="${v}"` : ""} style="--v:${v}%">
      <div class="mk-bar"><i style="width:${v}%"></i></div><b>${label}</b>
    </div>`,
    )
    .join("");
}

export const esc = (s) => String(s).replace(/"/g, "&quot;");

/** The default frame. `m.head`, `m.body`, `m.overlay` and `m.footer` are optional hooks. */
export function frame(m, rows, foot = FOOT) {
  return `
      <div class="mk ${m.cls}">
        ${m.overlay ?? ""}
        <div class="mk-meters">${meters(rows, m.numeric)}</div>
        <div class="mk-stage">
          <div class="mk-card">
            <p class="mk-who">${m.head ?? ""}${m.who}</p>
            <p class="mk-text" data-echo="${esc(m.text)}">${m.text}</p>
            ${m.body ?? ""}
            <div class="mk-choices"><span>${m.l}</span><span>${m.r}</span></div>
          </div>
        </div>
        <div class="mk-foot">
          ${m.footer ?? foot}
          ${m.bars ? `<span class="mk-bars"></span>` : `<span class="mk-prog"><i></i></span>`}
        </div>
      </div>`;
}

/** One labelled slot: the name, the idea, what it would cost to build, then the frame. */
export function mock(m, rows, foot = FOOT) {
  const path = /^d\d*-/.test(m.cls) ? "Drool" : "Rule";
  return `
    <div class="slot">
      <h3><span>${m.kicker ?? path}</span>${m.name}</h3>
      <p>${m.idea}</p>
      ${m.cost ? `<p class="cost"><b>To build:</b> ${m.cost}</p>` : ""}
      ${(m.render ?? frame)(m, rows, foot)}
    </div>`;
}

export function render(el, list, rows, foot) {
  document.getElementById(el).innerHTML = list.map((m) => mock(m, rows, foot)).join("");
}
