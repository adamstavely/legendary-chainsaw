/* <tc-stack-spread> in real browsers: the overlapping row, fanning apart on hover and focus, the "+N" count, the group's
 * own tab stop, Escape, reduced motion, the React wrapper and axe in both themes. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/stack-spread";
import type { TcStackSpread } from "../../src/elements/stack-spread";
import { StackSpread } from "../../src/elements/react/stack-spread";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PEOPLE = [
  ["Ama Owusu", "AO"],
  ["Tomás Reyes", "TR"],
  ["Mei Lin", "ML"],
  ["Jonas Berg", "JB"],
  ["Priya Nair", "PN"],
  ["Sam Okafor", "SO"],
] as const;
const dot = "display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 999px; background: var(--tc-surface-well); color: var(--tc-text-primary); font-size: 12px";
const avatars = (n: number = PEOPLE.length) => PEOPLE.slice(0, n).map(([name, initials]) => html`<span role="img" aria-label=${name} style=${dot}>${initials}</span>`);
const buttons = () => PEOPLE.slice(0, 3).map(([name, initials]) => html`<button type="button" style=${dot + "; border: 0"}><span aria-hidden="true">${initials}</span><span class="tc-sr-only">${name}</span></button>`);
const items = (el: TcStackSpread) => el.items.filter((i) => !i.hasAttribute("data-sspr-over"));
const boxes = (el: TcStackSpread) => items(el).map((i) => i.getBoundingClientRect());
const enter = (el: Element) => el.dispatchEvent(new PointerEvent("pointerenter"));
const leave = (el: Element) => el.dispatchEvent(new PointerEvent("pointerleave"));
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-stack-spread", () => {
  test("a labelled group of overlapping items, the first on top", async () => {
    const el = await fixture<TcStackSpread>(html`<tc-stack-spread label="Reviewers">${avatars(4)}</tc-stack-spread>`);
    expect(el.dataset.ui).toBe("sspr");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("Reviewers");
    const b = boxes(el);
    // Each overlaps the one before it by --tc-space-2-5 (10px)
    for (let i = 1; i < b.length; i++) expect(b[i - 1]!.right - b[i]!.left).toBeCloseTo(10, 0);
    const z = items(el).map((i) => Number(getComputedStyle(i).zIndex));
    expect(z).toEqual([...z].sort((a, b) => b - a));
    expect(el.querySelector(".ui-sspr__more")).toBeNull();
  });

  test("hover fans them apart so none overlaps, and leaving gathers them", async () => {
    const el = await fixture<TcStackSpread>(html`<tc-stack-spread>${avatars(4)}</tc-stack-spread>`);
    enter(el);
    await settle();
    await finish(el);
    expect(el.hasAttribute("data-active")).toBe(true);
    const b = boxes(el);
    // Side by side with a --tc-space-1 (4px) gap
    for (let i = 1; i < b.length; i++) expect(b[i]!.left - b[i - 1]!.right).toBeCloseTo(4, 0);
    leave(el);
    await settle();
    await finish(el);
    expect(el.hasAttribute("data-active")).toBe(false);
    const g = boxes(el);
    expect(g[0]!.right - g[1]!.left).toBeCloseTo(10, 0);
  });

  test("past max the rest become a +N count, which spreads as a count only", async () => {
    const el = await fixture<TcStackSpread>(html`<tc-stack-spread max="4">${avatars()}</tc-stack-spread>`);
    const more = el.querySelector<HTMLElement>(".ui-sspr__more")!;
    expect(more.textContent).toBe("+2 more");
    expect(more.querySelector(".tc-sr-only")!.textContent).toBe(" more");
    expect(items(el)).toHaveLength(4);
    expect(el.items.filter((i) => getComputedStyle(i).display === "none")).toHaveLength(2);
    // The count sits after the last item shown, overlapping it like the rest
    expect(more.getBoundingClientRect().left).toBeLessThan(boxes(el)[3]!.right);
    enter(el);
    await settle();
    await finish(el);
    expect(more.getBoundingClientRect().left - boxes(el)[3]!.right).toBeCloseTo(4, 0);
    el.max = 10;
    await settle();
    expect(el.querySelector(".ui-sspr__more")).toBeNull();
  });

  test("items that take no focus give the group one tab stop: focus fans it, Escape gathers it until focus leaves", async () => {
    const el = await fixture<TcStackSpread>(html`<tc-stack-spread label="Reviewers">${avatars(3)}</tc-stack-spread>`);
    expect(el.getAttribute("tabindex")).toBe("0");
    el.focus();
    await settle();
    expect(el.hasAttribute("data-active")).toBe(true);
    key(el, "Escape");
    await settle();
    expect(el.hasAttribute("data-active")).toBe(false);
    el.blur();
    await settle();
    el.focus();
    await settle();
    expect(el.hasAttribute("data-active")).toBe(true);
  });

  test("items that take focus keep their own tab stops, and focusing one fans the stack", async () => {
    const el = await fixture<TcStackSpread>(html`<tc-stack-spread label="Reviewers">${buttons()}</tc-stack-spread>`);
    expect(el.hasAttribute("tabindex")).toBe(false);
    el.querySelector("button")!.focus();
    await settle();
    expect(el.hasAttribute("data-active")).toBe(true);
  });

  test("spread keeps it fanned without hover; an item added later joins the row", async () => {
    const el = await fixture<TcStackSpread>(html`<tc-stack-spread spread>${avatars(2)}</tc-stack-spread>`);
    await finish(el);
    let b = boxes(el);
    expect(b[1]!.left - b[0]!.right).toBeCloseTo(4, 0);
    const extra = document.createElement("span");
    extra.setAttribute("style", dot);
    extra.textContent = "XY";
    el.append(extra);
    await settle();
    await finish(el);
    b = boxes(el);
    expect(b).toHaveLength(3);
    expect(b[2]!.left - b[1]!.right).toBeCloseTo(4, 0);
  });

  test("nothing loops, and reduced motion sets them apart without fanning", async () => {
    const css = (customElements.get("tc-stack-spread") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^@]*translate: none; transition: none;[^@]*margin-inline-start: var\(--tc-sspr-gap\)/);
  });

  test("React wrapper renders the items it's given", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const kids = (n: number) => PEOPLE.slice(0, n).map(([name, i]) => React.createElement("span", { key: name, role: "img", "aria-label": name }, i));
    await act(async () => root.render(React.createElement(StackSpread, { label: "Reviewers", max: 3 }, kids(5))));
    await settle();
    const el = host.querySelector("tc-stack-spread")!;
    expect(el.querySelector(".ui-sspr__more")!.textContent).toBe("+2 more");
    await act(async () => root.render(React.createElement(StackSpread, { label: "Reviewers", max: 3 }, kids(2))));
    await settle();
    expect(el.querySelector(".ui-sspr__more")).toBeNull();
    expect(el.items).toHaveLength(2);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations, gathered and fanned (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-stack-spread label="Reviewers" max="4">${avatars()}</tc-stack-spread>
        <tc-stack-spread label="Reviewers' buttons">${buttons()}</tc-stack-spread>
      </div>`);
      const run = () => axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect((await run()).violations.map((v) => v.id)).toEqual([]);
      for (const s of wrap.querySelectorAll("tc-stack-spread")) enter(s);
      await settle();
      await finish(wrap);
      expect((await run()).violations.map((v) => v.id)).toEqual([]);
    });
  }
});
