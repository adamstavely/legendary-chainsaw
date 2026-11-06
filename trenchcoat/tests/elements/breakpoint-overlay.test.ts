/*
 * <tc-breakpoint-overlay> in real browsers: the breakpoint in force (min-widths stacking, ranges, none), following an
 * element's width, opening and closing (the badge, the hotkey, Escape, Close), the ruler, the events, the helpers, the
 * React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/breakpoint-overlay";
import type { BreakpointOverlayBreakpointChange, BreakpointOverlayOpenChange, TcBreakpointOverlay } from "../../src/elements/breakpoint-overlay";
import { breakpointQuery, currentBreakpoint, defaultBreakpoints } from "../../src/elements/internal/breakpoints";
import { BreakpointOverlay } from "../../src/elements/react/breakpoint-overlay";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: EventTarget, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, composed: true, ...init }));

const RANGES = [
  { id: "compact", label: "Compact", max: 479 },
  { id: "medium", label: "Medium", min: 480, max: 719 },
  { id: "wide", label: "Wide", min: 720 },
];

/** A box of a given width and an overlay following it */
async function make(width: number, opts: { floating?: boolean; look?: string } = {}) {
  const wrap = await fixture<HTMLElement>(html`<div data-look=${opts.look ?? "standard"}>
    <div id="box" style=${`width: ${width}px; height: 120px`}></div>
    <tc-breakpoint-overlay ?floating=${opts.floating ?? true} .hotkey=${false}></tc-breakpoint-overlay>
  </div>`);
  const el = wrap.querySelector<TcBreakpointOverlay>("tc-breakpoint-overlay")!;
  const box = wrap.querySelector<HTMLElement>("#box")!;
  el.floating = opts.floating ?? true;
  el.breakpoints = RANGES;
  el.target = box;
  await frame();
  await settle();
  return { wrap, el, box };
}

describe("tc-breakpoint-overlay", () => {
  test("the badge says the breakpoint in force and the width", async () => {
    const { el } = await make(600);
    const badge = el.querySelector<HTMLButtonElement>(".ui-bpo__badge")!;
    expect(el.dataset.ui).toBe("bpo");
    expect(text(badge.querySelector(".ui-bpo__badge-name"))).toBe("Medium");
    expect(text(badge.querySelector(".ui-bpo__badge-w"))).toBe("600px");
    expect(badge.getAttribute("aria-expanded")).toBe("false");
    expect(el.querySelector(".ui-bpo__panel")).toBeNull();
  });

  test("min-widths stack: the largest that applies is current, not the first", async () => {
    expect(currentBreakpoint(defaultBreakpoints, 1300)?.id).toBe("xl");
    expect(currentBreakpoint(defaultBreakpoints, 500)).toBeNull();
    expect(currentBreakpoint(RANGES, 300)?.id).toBe("compact");
    expect(breakpointQuery({ id: "t", min: 768, max: 1023 })).toBe("(min-width: 768px) and (max-width: 1023px)");
    expect(breakpointQuery({ id: "m", max: 767 })).toBe("(max-width: 767px)");
    const { el } = await make(900);
    el.breakpoints = defaultBreakpoints;
    await settle();
    expect(text(el.querySelector(".ui-bpo__badge-name"))).toBe("Medium");
  });

  test("follows its target's width, and says when the breakpoint changes", async () => {
    const { el, box } = await make(600);
    const seen: BreakpointOverlayBreakpointChange[] = [];
    el.addEventListener("tc-breakpoint-change", (e) => seen.push((e as CustomEvent<BreakpointOverlayBreakpointChange>).detail));
    box.style.width = "800px";
    await expect.poll(() => text(el.querySelector(".ui-bpo__badge-name"))).toBe("Wide");
    expect(seen.at(-1)).toMatchObject({ breakpoint: { id: "wide" }, width: 800 });
    const count = seen.length;
    box.style.width = "760px";
    await expect.poll(() => text(el.querySelector(".ui-bpo__badge-w"))).toBe("760px");
    expect(seen.length).toBe(count);
  });

  test("the badge opens the panel: the scale, each breakpoint and its query, the current one marked", async () => {
    const { el } = await make(600);
    el.querySelector<HTMLButtonElement>(".ui-bpo__badge")!.click();
    await settle();
    expect(el.open).toBe(true);
    const badge = el.querySelector<HTMLButtonElement>(".ui-bpo__badge")!;
    expect(badge.getAttribute("aria-expanded")).toBe("true");
    const panel = el.querySelector(".ui-bpo__panel")!;
    expect(badge.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("role")).toBe("region");
    const rows = [...el.querySelectorAll(".ui-bpo__bp")];
    expect(rows.map((r) => text(r.querySelector(".ui-bpo__bp-state")))).toEqual(["Doesn't apply", "Current", "Doesn't apply"]);
    expect(text(rows[1].querySelector(".ui-bpo__query"))).toBe("(min-width: 480px) and (max-width: 719px)");
    expect(el.querySelectorAll(".ui-bpo__seg")).toHaveLength(3);
    expect(el.querySelector(".ui-bpo__seg[data-on]")).not.toBeNull();
    expect(text(el.querySelector(".ui-bpo__scale-now"))).toBe("600px");
  });

  test("Escape and Close shut it, and focus goes back to the badge", async () => {
    const { el } = await make(600);
    el.open = true;
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-bpo__close")!.focus();
    key(el.querySelector(".ui-bpo__close")!, "Escape");
    await expect.poll(() => el.open).toBe(false);
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-bpo__badge"));
    el.open = true;
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-bpo__close")!.click();
    await settle();
    expect(el.open).toBe(false);
  });

  test("tc-open-change is cancelable", async () => {
    const { el } = await make(600);
    const seen: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => {
      seen.push((e as CustomEvent<BreakpointOverlayOpenChange>).detail.open);
      e.preventDefault();
    });
    el.querySelector<HTMLButtonElement>(".ui-bpo__badge")!.click();
    await settle();
    expect(seen).toEqual([true]);
    expect(el.open).toBe(false);
  });

  test("the hotkey opens and closes it, even where Option changes the letter", async () => {
    const { el } = await make(600);
    el.hotkey = "alt+shift+o";
    await settle();
    key(document.body, "Ø", { code: "KeyO", altKey: true, shiftKey: true });
    await settle();
    expect(el.open).toBe(true);
    key(document.body, "O", { code: "KeyO", altKey: true, shiftKey: true });
    await settle();
    expect(el.open).toBe(false);
    el.hotkey = false;
    await settle();
    key(document.body, "O", { code: "KeyO", altKey: true, shiftKey: true });
    await settle();
    expect(el.open).toBe(false);
  });

  test("the ruler shows while open and following the window, not an element", async () => {
    const { el } = await make(600);
    el.open = true;
    await settle();
    expect(el.querySelector(".ui-bpo__ruler")).toBeNull();
    el.target = null;
    await frame();
    await settle();
    const ruler = el.querySelector(".ui-bpo__ruler")!;
    expect(ruler).not.toBeNull();
    expect(text(ruler.querySelector(".ui-bpo__now-label"))).toBe(`${window.innerWidth}px`);
    expect(ruler.getAttribute("aria-hidden")).toBe("true");
    el.showRuler = false;
    await settle();
    expect(el.querySelector(".ui-bpo__ruler")).toBeNull();
  });

  test("not floating: a card in the page, always open, with no badge or close", async () => {
    const { el } = await make(300, { floating: false });
    expect(el.querySelector(".ui-bpo__badge")).toBeNull();
    expect(el.querySelector(".ui-bpo__close")).toBeNull();
    expect(el.querySelector(".ui-bpo__panel")).not.toBeNull();
    expect(getComputedStyle(el).position).toBe("relative");
    expect(el.querySelector(".ui-bpo__bp[data-current]")?.textContent).toContain("Compact");
  });

  test("floats in the corner it's given", async () => {
    const { el } = await make(600);
    expect(getComputedStyle(el).position).toBe("fixed");
    el.corner = "top-right";
    await settle();
    expect(el.getAttribute("corner")).toBe("top-right");
    const r = el.getBoundingClientRect();
    expect(r.top).toBeLessThan(window.innerHeight / 2);
    expect(window.innerWidth - r.right).toBeLessThan(40);
  });

  test("React wrapper: controlled open, and the breakpoint callback", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const box = host.appendChild(document.createElement("div"));
    box.style.width = "600px";
    const root = createRoot(host.appendChild(document.createElement("div")));
    const opens: boolean[] = [];
    const changes: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(BreakpointOverlay, {
          open: false,
          hotkey: false,
          target: box,
          breakpoints: RANGES,
          title: "Sizes",
          onOpenChange: (o: boolean) => opens.push(o),
          onBreakpointChange: (d) => changes.push(d.breakpoint?.id ?? "none"),
        }),
      ),
    );
    await settle();
    const el = host.querySelector<TcBreakpointOverlay>("tc-breakpoint-overlay")!;
    expect(el.heading).toBe("Sizes");
    el.querySelector<HTMLButtonElement>(".ui-bpo__badge")!.click();
    await settle();
    expect(opens).toEqual([true]);
    expect(el.open).toBe(false);
    box.style.width = "300px";
    await expect.poll(() => changes).toEqual(["compact"]);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, open and as a card, in both looks and themes", async () => {
    for (const look of ["standard", "clean"]) {
      for (const scheme of ["light", "dark"]) {
        const { wrap, el } = await make(600, { look });
        wrap.style.background = "Canvas";
        wrap.style.colorScheme = scheme;
        el.open = true;
        await settle();
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => v.id)).toEqual([]);
        cleanup();
      }
    }
    const { wrap } = await make(600, { floating: false });
    const { violations } = await axe.run(wrap);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
