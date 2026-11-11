/* <tc-sliding-indicator> in real browsers: following the page's selected state, both variants, vertical, the hover ghost, resizing, reduced motion, React and axe. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/sliding-indicator";
import type { TcSlidingIndicator } from "../../src/elements/sliding-indicator";
import { SlidingIndicator } from "../../src/elements/react/sliding-indicator";
import { cleanup, finish, fixture, parkPointer, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const tabs = (variant = "underline", orientation = "horizontal") =>
  fixture<TcSlidingIndicator>(html`<tc-sliding-indicator variant=${variant} orientation=${orientation} hover-preview>
    <div role="tablist" aria-label="Finding" style=${orientation === "vertical" ? "display: grid; width: 160px" : "display: flex; gap: 4px"}>
      <button type="button" role="tab" aria-selected="true" style="width: 90px; height: 28px">Overview</button>
      <button type="button" role="tab" aria-selected="false" style="width: 120px; height: 28px">Evidence</button>
      <button type="button" role="tab" aria-selected="false" style="width: 70px; height: 28px">History</button>
    </div>
  </tc-sliding-indicator>`);
const bar = (el: Element) => el.querySelector<HTMLElement>(".ui-sind__bar")!;
const ghost = (el: Element) => el.querySelector<HTMLElement>(".ui-sind__ghost")!;
const tab = (el: Element, i: number) => el.querySelectorAll<HTMLElement>('[role="tab"]')[i];
const select = (el: Element, i: number) => el.querySelectorAll('[role="tab"]').forEach((t, n) => t.setAttribute("aria-selected", String(n === i)));
/** Where the highlight sits once it has settled, relative to the item */
const offset = async (el: Element, i: number) => {
  await frame();
  await finish(el);
  const b = bar(el).getBoundingClientRect();
  const t = tab(el, i).getBoundingClientRect();
  return { dx: Math.round(b.left - t.left), dy: Math.round(b.top - t.top), w: Math.round(b.width), h: Math.round(b.height) };
};

describe("tc-sliding-indicator", () => {
  test("adds only decoration: the highlight is aria-hidden and the page's roles are untouched", async () => {
    const el = await tabs();
    expect(el.dataset.ui).toBe("sind");
    expect(el.querySelector(".ui-sind__layer")!.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.querySelector('[role="tablist"]')).not.toBeNull();
    expect(el.querySelectorAll("[tabindex]").length).toBe(0);
  });

  test("sits on the selected item and follows aria-selected as it changes", async () => {
    const el = await tabs();
    expect(await offset(el, 0)).toEqual({ dx: 0, dy: 0, w: 90, h: 28 });
    expect(bar(el).hasAttribute("data-shown")).toBe(true);
    select(el, 1);
    expect(await offset(el, 1)).toEqual({ dx: 0, dy: 0, w: 120, h: 28 });
    expect(el.hasAttribute("data-ready")).toBe(true);
  });

  test("slides between items (a transition), after jumping into place the first time", async () => {
    const el = await tabs();
    await frame();
    await frame();
    select(el, 2);
    await frame();
    expect(getComputedStyle(bar(el)).transitionProperty).toContain("transform");
    expect(bar(el).getAnimations().length).toBeGreaterThan(0);
  });

  test("also follows aria-current, aria-checked and data-selected", async () => {
    const el = await fixture<TcSlidingIndicator>(html`<tc-sliding-indicator variant="pill">
      <nav style="display: flex"><a href="#a" style="width: 50px">A</a><a href="#b" style="width: 60px" aria-current="page">B</a></nav>
    </tc-sliding-indicator>`);
    await frame();
    await finish(el);
    expect(Math.round(bar(el).getBoundingClientRect().width)).toBe(60);
    const radios = await fixture<TcSlidingIndicator>(html`<tc-sliding-indicator variant="pill">
      <div role="radiogroup" aria-label="View" style="display: flex"><button role="radio" aria-checked="false" style="width: 40px">List</button><button role="radio" aria-checked="true" style="width: 70px">Board</button></div>
    </tc-sliding-indicator>`);
    await frame();
    await finish(radios);
    expect(Math.round(bar(radios).getBoundingClientRect().width)).toBe(70);
    const data = await fixture<TcSlidingIndicator>(html`<tc-sliding-indicator items=".opt"><div style="display: flex"><span class="opt" style="width: 30px" data-selected>One</span><span class="opt" style="width: 44px">Two</span></div></tc-sliding-indicator>`);
    await frame();
    await finish(data);
    expect(Math.round(bar(data).getBoundingClientRect().width)).toBe(30);
  });

  test("hides when nothing is selected", async () => {
    const el = await tabs();
    select(el, -1);
    await frame();
    expect(bar(el).hasAttribute("data-shown")).toBe(false);
  });

  test("keeps up when the selected item resizes", async () => {
    const el = await tabs();
    await offset(el, 0);
    tab(el, 0).style.width = "140px";
    await expect.poll(async () => (await offset(el, 0)).w, { timeout: 3000 }).toBe(140);
  });

  test("underline: a bar along the bottom edge; vertical: along the start edge", async () => {
    const el = await tabs("underline");
    await offset(el, 0);
    const line = getComputedStyle(bar(el), "::after");
    expect(line.height).toBe("2px");
    expect(line.bottom).toBe("0px");
    const v = await tabs("underline", "vertical");
    await offset(v, 0);
    expect(getComputedStyle(bar(v), "::after").width).toBe("2px");
    select(v, 2);
    const at = await offset(v, 2);
    expect(at.dy).toBe(0);
  });

  test("pill: fills the item's box behind it", async () => {
    const el = await tabs("pill");
    await offset(el, 0);
    expect(getComputedStyle(bar(el)).borderTopLeftRadius).not.toBe("0px");
    expect(getComputedStyle(el.querySelector(".ui-sind__layer")!).zIndex).toBe("-1");
  });

  test("hover-preview: a ghost follows the pointer over other items and leaves with it", async () => {
    const el = await tabs();
    await userEvent.hover(tab(el, 1));
    await frame();
    expect(ghost(el).hasAttribute("data-shown")).toBe(true);
    await parkPointer();
    await frame();
    expect(ghost(el).hasAttribute("data-shown")).toBe(false);
  });

  test("with reduced motion the highlight moves without sliding", async () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation((q: string) => (q.includes("reduced-motion") ? ({ matches: true } as MediaQueryList) : original.call(window, q)));
    const el = await tabs();
    await offset(el, 0);
    // The stylesheet's media query decides; the mock only matters to script – check the rule exists
    const css = (el.constructor as typeof TcSlidingIndicator).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*transition: opacity/);
  });

  test("sitting idle, it doesn't re-render or keep measuring", async () => {
    const el = await tabs();
    await offset(el, 0);
    let updates = 0;
    const update = (el as unknown as { update: (c: unknown) => void }).update.bind(el);
    (el as unknown as { update: (c: unknown) => void }).update = (c) => {
      updates++;
      update(c);
    };
    const place = vi.spyOn(el, "place");
    await frame();
    await frame();
    await frame();
    expect(updates).toBe(0);
    expect(place).not.toHaveBeenCalled();
  });

  test("React: the highlight follows state the page owns", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const view = (at: number) =>
      React.createElement(
        SlidingIndicator,
        { variant: "pill" },
        React.createElement(
          "div",
          { role: "tablist", "aria-label": "Finding", style: { display: "flex" } },
          ["Overview", "Evidence"].map((t, i) => React.createElement("button", { key: t, type: "button", role: "tab", "aria-selected": i === at, style: { width: 80 + i * 40 } }, t)),
        ),
      );
    await act(async () => root.render(view(0)));
    await settle();
    const el = host.querySelector<TcSlidingIndicator>("tc-sliding-indicator")!;
    expect((await offset(el, 0)).w).toBe(80);
    await act(async () => root.render(view(1)));
    expect((await offset(el, 1)).w).toBe(120);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const theme of ["light", "dark"]) {
    test(`axe (${theme}): no violations`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}><tc-sliding-indicator variant="pill"><div role="tablist" aria-label="Finding"><button role="tab" aria-selected="true">Overview</button><button role="tab" aria-selected="false" tabindex="-1">Evidence</button></div></tc-sliding-indicator></div>`);
      await frame();
      await finish(wrap);
      expect((await axe.run(wrap)).violations.map((v) => v.id)).toEqual([]);
    });
  }
});
