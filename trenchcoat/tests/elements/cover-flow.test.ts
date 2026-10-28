/*
 * <tc-cover-flow> in real browsers – the illustration's contract and regression checks, ported
 * (contract/illustrations/cover-flow, regressions illustrations-cover-flow and its case in -i1-theme).
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/cover-flow";
import { TcCoverFlow, type CoverFlowIndexChange, type CoverFlowSelect } from "../../src/elements/cover-flow";
import { CoverFlow } from "../../src/elements/react/cover-flow";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const items = ["One", "Two", "Three", "Four", "Five"].map((title, i) => ({ id: i, title }));
const front = (c: Element) => c.querySelector("[data-active]")?.getAttribute("aria-label");
const viewport = (c: Element) => c.querySelector<HTMLElement>(".ui-cf__viewport")!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
/** Reduced motion: every move lands at once */
const instant = () => {
  const real = window.matchMedia.bind(window);
  vi.stubGlobal("matchMedia", (q: string) => (q.includes("reduced-motion") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : real(q)));
};
describe("tc-cover-flow", () => {
  test("the host is the root; the carousel region, slides and a status region from the start", async () => {
    const el = await fixture<TcCoverFlow>(html`<tc-cover-flow .items=${items} label="Albums"></tc-cover-flow>`);
    expect(el.dataset.ui).toBe("cf");
    expect(el.hasAttribute("data-reflection")).toBe(true);
    const region = viewport(el);
    expect(region.getAttribute("role")).toBe("region");
    expect(region.getAttribute("aria-roledescription")).toBe("carousel");
    expect(region.getAttribute("aria-label")).toBe("Albums");
    expect(front(el)).toBe("3 of 5: Three"); // the middle one
    expect(el.querySelectorAll('[aria-roledescription="slide"][aria-hidden="true"]').length).toBe(4);
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent).toBe("");
    expect(el.querySelector("[aria-live]")).toBeNull();
    expect(el.querySelector(".ui-cf__title")!.textContent).toBe("Three");
  });

  test("uncontrolled: moves on its own and reports each new front cover; the status names where it settles (WCAG 4.1.3)", async () => {
    const el = await fixture<TcCoverFlow>(html`<tc-cover-flow .items=${items} index="0"></tc-cover-flow>`);
    const fronts: number[] = [];
    el.addEventListener("tc-front-change", (e) => fronts.push((e as CustomEvent<CoverFlowIndexChange>).detail.index));
    key(viewport(el), "End");
    // The spring settles in its own time – slower on a busy WebKit runner – so wait for where it ends, not a while
    await expect.poll(() => el.querySelector('[role="status"]')!.textContent, { timeout: 10_000 }).toBe("5 of 5: Five");
    expect(front(el)).toBe("5 of 5: Five");
    expect(fronts).toEqual([1, 2, 3, 4]);
    expect(el.index).toBe(4);
  });

  test("controlled: a key press is asked for with a cancelable event, not applied; setting index moves", async () => {
    instant();
    const asked: number[] = [];
    const el = await fixture<TcCoverFlow>(html`<tc-cover-flow .items=${items} index="1" @tc-index-change=${(e: CustomEvent<CoverFlowIndexChange>) => (e.preventDefault(), asked.push(e.detail.index))}></tc-cover-flow>`);
    key(viewport(el), "ArrowRight");
    await settle();
    expect(asked).toEqual([2]);
    expect(front(el)).toBe("2 of 5: Two");
    el.index = 4;
    await settle();
    expect(front(el)).toBe("5 of 5: Five");
  });

  test("arrow keys, Home and End; a click on a side cover brings it to the front", async () => {
    instant();
    const el = await fixture<TcCoverFlow>(html`<tc-cover-flow .items=${items} index="2"></tc-cover-flow>`);
    key(viewport(el), "ArrowLeft");
    await settle();
    expect(front(el)).toBe("2 of 5: Two");
    key(viewport(el), "Home");
    await settle();
    expect(front(el)).toBe("1 of 5: One");
    key(viewport(el), "ArrowLeft");
    await settle();
    expect(front(el)).toBe("1 of 5: One");
    el.querySelectorAll<HTMLElement>(".ui-cf__tick")[3].click();
    await settle();
    expect(front(el)).toBe("4 of 5: Four");
    const card = el.querySelector<HTMLElement>('[data-cf-index="2"] .ui-cf__card')!;
    card.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, clientX: 10 }));
    card.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, pointerId: 1, clientX: 10 }));
    await settle();
    expect(front(el)).toBe("3 of 5: Three");
  });

  test("selectable: Enter or a click on the front cover fires tc-select", async () => {
    instant();
    const picked: CoverFlowSelect[] = [];
    const el = await fixture<TcCoverFlow>(html`<tc-cover-flow selectable .items=${items} index="1" @tc-select=${(e: CustomEvent<CoverFlowSelect>) => picked.push(e.detail)}></tc-cover-flow>`);
    expect(viewport(el).hasAttribute("data-selectable")).toBe(true);
    key(viewport(el), "Enter");
    const card = el.querySelector<HTMLElement>('[data-cf-index="1"] .ui-cf__card')!;
    card.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1 }));
    card.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, pointerId: 1 }));
    expect(picked.map((p) => [p.index, p.item.title])).toEqual([
      [1, "Two"],
      [1, "Two"],
    ]);
  });

  test("Next keeps focus when it reaches the last cover: aria-disabled, not disabled (WCAG 2.4.3)", async () => {
    instant();
    const el = await fixture<TcCoverFlow>(html`<tc-cover-flow .items=${items} index="3"></tc-cover-flow>`);
    const next = el.querySelector<HTMLButtonElement>('button[aria-label="Next"]')!;
    next.focus();
    next.click();
    await settle();
    expect(next.getAttribute("aria-disabled")).toBe("true");
    expect(next.disabled).toBe(false);
    expect(document.activeElement).toBe(next);
    next.click();
    await settle();
    expect(front(el)).toBe("5 of 5: Five");
  });

  test("custom covers are cloned (the reflection too); renderCaption replaces the caption; parts can be turned off", async () => {
    const art = document.createElement("div");
    art.className = "my-art";
    const el = await fixture<TcCoverFlow>(html`<tc-cover-flow .items=${[{ id: "a", title: "A", cover: art }]} .renderCaption=${(item: { title?: string }) => `Now: ${item.title}`}></tc-cover-flow>`);
    expect(el.querySelectorAll(".my-art").length).toBe(2);
    expect(art.isConnected).toBe(false);
    expect(el.querySelector(".ui-cf__caption-in")!.textContent).toBe("Now: A");
    const bare = await fixture<TcCoverFlow>(html`<tc-cover-flow .items=${items} reflection="false" caption="false" controls="false" ticks="false"></tc-cover-flow>`);
    expect(bare.hasAttribute("data-reflection")).toBe(false);
    expect(bare.querySelector(".ui-cf__reflection, .ui-cf__footer")).toBeNull();
  });

  test("covers scale down in a narrow container", async () => {
    const el = await fixture<TcCoverFlow>(html`<div style="width: 448px"><tc-cover-flow .items=${items}></tc-cover-flow></div>`);
    await settle();
    const cf = el.querySelector<TcCoverFlow>("tc-cover-flow")!;
    expect(cf.style.getPropertyValue("--tc-cover-flow-w")).toBe("140px");
  });

  test("dark follows .dark, data-theme, data-tc-theme and system alike; no endless CSS loop", () => {
    const css = TcCoverFlow.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g))
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    expect(css).not.toMatch(/\binfinite\b/);
  });

  test("React wrapper: the row follows the parent's index; onIndexChange; onSelect; className, DOM props and ref on the host; React covers", async () => {
    instant();
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcCoverFlow>();
    const onSelect = vi.fn();
    let setIndex: (n: number) => void = () => {};
    function Parent() {
      const [index, set] = React.useState(0);
      setIndex = set;
      return React.createElement(CoverFlow, {
        items: items.map((i) => ({ ...i, cover: React.createElement("span", { className: "react-art" }, i.title) })),
        index,
        onIndexChange: set,
        onSelect,
        className: "consumer-class",
        "data-consumer": "yes",
        "aria-label": "Albums",
        ref,
      } as never);
    }
    flushSync(() => root.render(React.createElement(Parent)));
    await settle();
    const el = host.querySelector<TcCoverFlow>("tc-cover-flow")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.consumer).toBe("yes");
    expect(viewport(el).getAttribute("aria-label")).toBe("Albums");
    expect(el.querySelectorAll(".ui-cf__card .react-art").length).toBe(10);
    key(viewport(el), "End");
    await settle();
    expect(front(el)).toBe("5 of 5: Five");
    key(viewport(el), "Enter");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ title: "Five" }), 4);
    flushSync(() => setIndex(1));
    await settle();
    expect(front(el)).toBe("2 of 5: Two");
    root.unmount();
  });

  test("React wrapper, controlled without accepting: a key press is reported once, not applied", async () => {
    instant();
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onIndexChange = vi.fn();
    flushSync(() => root.render(React.createElement(CoverFlow, { items, index: 1, onIndexChange })));
    await settle();
    const el = host.querySelector<TcCoverFlow>("tc-cover-flow")!;
    key(viewport(el), "ArrowRight");
    await settle();
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(front(el)).toBe("2 of 5: Two");
    root.unmount();
  });

  test("axe: no violations", async () => {
    instant();
    const wrap = await fixture(html`<div style="width: 900px"><tc-cover-flow .items=${items} label="Albums"></tc-cover-flow></div>`);
    for (const a of wrap.getAnimations({ subtree: true })) a.finish();
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
