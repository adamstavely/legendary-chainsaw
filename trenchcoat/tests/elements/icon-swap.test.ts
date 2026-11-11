/* <tc-icon-swap> in real browsers: the icon showing, the swap, turning back after a while, announcing, reduced motion,
 * the React wrapper and axe in both themes. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/icon-swap";
import type { IconSwapStateChange, TcIconSwap } from "../../src/elements/icon-swap";
import { IconSwap } from "../../src/elements/react/icon-swap";
import { cleanup, finish, fixture, settle, pageStyles } from "./helpers";

afterEach(cleanup);

const icons = html`<svg data-state="copy" data-label="Copy" viewBox="0 0 24 24" width="16" height="16"><rect x="8" y="8" width="14" height="14"></rect></svg
  ><svg data-state="done" data-label="Link copied" viewBox="0 0 24 24" width="16" height="16"><path d="M20 6 9 17l-5-5"></path></svg>`;
const swap = (attrs = html``) => fixture<TcIconSwap>(html`<tc-icon-swap ${attrs}>${icons}</tc-icon-swap>`);
const icon = (el: Element, s: string) => el.querySelector<SVGElement>(`[data-state="${s}"]`)!;
const showing = (el: TcIconSwap) => [...el.querySelectorAll<SVGElement>("[data-active]")].map((i) => i.dataset.state);

describe("tc-icon-swap", () => {
  test("shows the first icon when no state is set, without moving, and hides the icons from screen readers", async () => {
    const el = await fixture<TcIconSwap>(html`<tc-icon-swap>${icons}</tc-icon-swap>`);
    expect(el.dataset.ui).toBe("iswp");
    expect(el.dataset.look).toBeUndefined();
    expect(showing(el)).toEqual(["copy"]);
    expect(el.current).toBe("copy");
    expect(el.querySelector("[data-enter], [data-leaving]")).toBeNull();
    expect(getComputedStyle(icon(el, "done")).visibility).toBe("hidden");
    for (const i of el.icons) expect(i.getAttribute("aria-hidden")).toBe("true");
  });

  test("a change turns the old icon out as the new one turns in, and the old one goes", async () => {
    const el = await fixture<TcIconSwap>(html`<tc-icon-swap state="copy">${icons}</tc-icon-swap>`);
    el.state = "done";
    await el.updateComplete;
    expect(showing(el)).toEqual(["done"]);
    expect(icon(el, "copy").hasAttribute("data-leaving")).toBe(true);
    expect(icon(el, "done").hasAttribute("data-enter")).toBe(true);
    expect(icon(el, "done").getAnimations().length).toBeGreaterThan(0);
    await finish(el);
    await expect.poll(() => el.querySelector("[data-leaving], [data-enter]")).toBeNull();
    expect(getComputedStyle(icon(el, "copy")).visibility).toBe("hidden");
  });

  test("setting the first state after a render with none still moves; an unknown state shows the first icon", async () => {
    const el = await fixture<TcIconSwap>(html`<tc-icon-swap>${icons}</tc-icon-swap>`);
    el.state = "done";
    await el.updateComplete;
    expect(icon(el, "done").hasAttribute("data-enter")).toBe(true);
    el.state = "nope";
    await el.updateComplete;
    expect(showing(el)).toEqual(["copy"]);
  });

  test("icons a framework adds later are marked as they arrive", async () => {
    const el = await fixture<TcIconSwap>(html`<tc-icon-swap state="b"></tc-icon-swap>`);
    const a = document.createElement("span");
    a.dataset.state = "a";
    const b = document.createElement("span");
    b.dataset.state = "b";
    el.append(a, b);
    await expect.poll(() => b.hasAttribute("data-active")).toBe(true);
    expect(a.hasAttribute("data-active")).toBe(false);
  });

  test("revert-after goes back to the resting state, announcing it with tc-state-change; prevented, it stays", async () => {
    const el = await fixture<TcIconSwap>(html`<tc-icon-swap revert-after="40">${icons}</tc-icon-swap>`);
    const seen: string[] = [];
    el.addEventListener("tc-state-change", (e) => seen.push((e as CustomEvent<IconSwapStateChange>).detail.state));
    el.state = "done";
    await expect.poll(() => el.state).toBe("copy");
    expect(seen).toEqual(["copy"]);
    // At rest it doesn't schedule anything
    await settle();
    expect(seen).toEqual(["copy"]);

    const kept = await fixture<TcIconSwap>(html`<tc-icon-swap revert-after="40" rest="copy">${icons}</tc-icon-swap>`);
    let asked = 0;
    kept.addEventListener("tc-state-change", (e) => {
      asked++;
      e.preventDefault();
    });
    kept.state = "done";
    await expect.poll(() => asked).toBe(1);
    expect(kept.state).toBe("done");
    expect(showing(kept)).toEqual(["done"]);
  });

  test("announces each change's word only when asked", async () => {
    const quiet = await swap();
    expect(quiet.querySelector('[role="status"]')).toBeNull();
    const el = await fixture<TcIconSwap>(html`<tc-icon-swap announce>${icons}</tc-icon-swap>`);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("");
    el.state = "done";
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Link copied");
  });

  test("nothing loops, and reduced motion swaps by fading alone", async () => {
    const css = (customElements.get("tc-icon-swap") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^@]*ui-iswp-fade-in[^@]*ui-iswp-fade-out/);
    expect(css).toMatch(/@keyframes ui-iswp-fade-in \{ from \{ opacity: 0; \} to \{ opacity: 1; \} \}/);
  });

  test("React wrapper: uncontrolled turns back on its own; controlled reports the turn back and waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const kids = [
      React.createElement("span", { key: "a", "data-state": "copy" }, "c"),
      React.createElement("span", { key: "b", "data-state": "done" }, "d"),
    ];
    await act(async () => root.render(React.createElement(IconSwap, { defaultState: "done", revertAfter: 30 }, kids)));
    await settle();
    const el = host.querySelector("tc-icon-swap")!;
    await expect.poll(() => el.state).toBe("copy");

    const asked: string[] = [];
    await act(async () => root.render(React.createElement("div", null, React.createElement(IconSwap, { state: "done", revertAfter: 30, onStateChange: (s: string) => void asked.push(s) }, kids))));
    await settle();
    const controlled = host.querySelector("tc-icon-swap")!;
    await expect.poll(() => asked).toEqual(["copy"]);
    expect(controlled.state).toBe("done");
    await act(async () => root.render(React.createElement("div", null, React.createElement(IconSwap, { state: "copy", revertAfter: 30 }, kids))));
    await settle();
    expect(controlled.state).toBe("copy");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations inside a button (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-page data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); color: var(--tc-text-primary)">${pageStyles}
        <button type="button"><tc-icon-swap state="done" announce>${icons}</tc-icon-swap> Copy link</button>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => v.id)).toEqual([]);
    });
  }
});
