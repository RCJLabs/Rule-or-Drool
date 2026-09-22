/**
 * Runs inside the page, not in Node. Plain JavaScript on purpose: it is read from disk and
 * handed to the browser as written, so no test transform can add helpers the page does not
 * have. Everything here measures what the browser actually drew.
 */
(() => {
  const srgb = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const over = (fg, bg) => {
    const a = fg[3] ?? 1;
    return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  };
  const ratio = (a, b) => {
    const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
    return (hi + 0.05) / (lo + 0.05);
  };
  const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

  /** Composite every ancestor's background, nearest last, down to the first opaque one. */
  const backgroundOf = (el) => {
    const stack = [];
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c.length >= 3 && (c[3] ?? 1) > 0) stack.push(c);
      if (c.length >= 3 && (c[3] ?? 1) === 1) break;
    }
    let out = [255, 255, 255];
    for (const c of stack.reverse()) out = over(c, out);
    return out;
  };

  /**
   * Every element with its own visible text, against WCAG AA: 4.5:1, or 3:1 for large text
   * (24px, or 18.66px bold). Background images and gradients are not read, so text that sits
   * on one needs a solid ground of its own, which is the rule the game already follows.
   */
  function contrast() {
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const text = [...el.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent.trim())
        .map((n) => n.textContent.trim())
        .join(" ");
      if (!text) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const opacity = Number(cs.opacity);
      if (opacity < 0.05) continue;
      const size = parseFloat(cs.fontSize);
      const weight = Number(cs.fontWeight) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      const bg = backgroundOf(el);
      let fg = parse(cs.color);
      if (opacity < 1) fg = [...over([...fg.slice(0, 3), (fg[3] ?? 1) * opacity], bg), 1];
      const got = ratio(over(fg, bg), bg);
      if (got < need) {
        const cls = typeof el.className === "string" && el.className ? el.className : el.tagName.toLowerCase();
        out.push({ sel: cls, text: text.slice(0, 32), size: +size.toFixed(1), weight, got: +got.toFixed(2), need, fg: hex(over(fg, bg)), bg: hex(bg) });
      }
    }
    return out;
  }

  /** How far the page runs past the viewport, in CSS pixels. */
  function overflow() {
    const d = document.documentElement;
    return { x: d.scrollWidth - window.innerWidth, y: d.scrollHeight - window.innerHeight };
  }

  /** How much wider an element's text is laid out than the box it has to fit in. */
  function textOverflow(el, cs) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect().width;
    const box = el.getBoundingClientRect().width - ["paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"].reduce((sum, k) => sum + parseFloat(cs[k]), 0);
    return text - box;
  }

  /**
   * Boxes that hide part of what is in them. A flex column squeezes before it scrolls, so a
   * screen that no longer fits shows up here, as a card cutting off its own text, rather
   * than as a page that scrolls. Decoration is left out: the game marks it aria-hidden, and
   * a chat gutter that scrolls out of sight is doing its job. `ellipsis` says the box cuts
   * its text short on purpose and shows that it has.
   */
  function clipped() {
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.closest(".sr-only, svg, .debug, [aria-hidden='true']")) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const clipsY = /hidden|clip/.test(cs.overflowY);
      const clipsX = /hidden|clip/.test(cs.overflowX);
      if (!clipsY && !clipsX) continue;
      const ellipsis = cs.textOverflow === "ellipsis";
      const y = clipsY ? el.scrollHeight - el.clientHeight : 0;
      // scrollWidth is a whole number, and an ellipsis is drawn for any overflow at all: a
      // label a third of a pixel too long reads as fitting and shows as "EVERYON…". So a
      // box that ellipsizes is measured by its text's own width, to the fraction.
      const x = !clipsX ? 0 : ellipsis ? textOverflow(el, cs) : el.scrollWidth - el.clientWidth;
      if (y > 1 || (ellipsis ? x > 0.05 : x > 1)) {
        const cls = typeof el.className === "string" && el.className ? el.className : el.tagName.toLowerCase();
        out.push({ sel: cls, x: +x.toFixed(2), y, text: (el.textContent || "").trim().slice(0, 32), ellipsis });
      }
    }
    return out;
  }

  /**
   * The extent of what reads as solid in an SVG group, in the picture's own units. A
   * searchlight at 12% is light falling across the scene, not a thing standing in it, so
   * anything drawn at under half strength is left out.
   */
  function solidBox(group) {
    const svg = group.ownerSVGElement;
    const toPicture = svg.getCTM().inverse();
    const strength = (el) => {
      let o = 1;
      for (let a = el; a && a !== svg; a = a.parentElement) {
        const cs = getComputedStyle(a);
        o *= Number(cs.opacity);
        if (a === el) {
          const fill = cs.fill === "none" ? 0 : Number(cs.fillOpacity);
          const stroke = cs.stroke === "none" ? 0 : Number(cs.strokeOpacity);
          o *= Math.max(fill, stroke);
        }
      }
      return o;
    };
    let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
    for (const el of group.querySelectorAll("rect, path, polygon, polyline, circle, ellipse, line")) {
      if (strength(el) < 0.5) continue;
      const bb = el.getBBox();
      const m = toPicture.multiply(el.getCTM());
      for (const [x, y] of [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]) {
        const q = new DOMPoint(x, y).matrixTransform(m);
        l = Math.min(l, q.x); r = Math.max(r, q.x); t = Math.min(t, q.y); b = Math.max(b, q.y);
      }
    }
    return l < r ? { left: l, right: r, top: t, bottom: b } : null;
  }

  /** Every landmark in every picture on the page, keyed by the picture's data-case. */
  function landmarks() {
    return [...document.querySelectorAll("[data-case]")].map((c) => ({
      key: c.getAttribute("data-case"),
      boxes: [...c.querySelectorAll("[data-motif]")].map((g) => ({ motif: g.getAttribute("data-motif"), box: solidBox(g) })),
    }));
  }

  /** Transitions finish at once, so what is measured is where each one comes to rest. */
  function settle() {
    const style = document.createElement("style");
    style.textContent = "*, *::before, *::after { transition-duration: 0s !important; transition-delay: 0s !important; } .debug { display: none !important; }";
    document.head.append(style);
  }

  window.__audit = { contrast, overflow, clipped, landmarks };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", settle);
  else settle();
})();
