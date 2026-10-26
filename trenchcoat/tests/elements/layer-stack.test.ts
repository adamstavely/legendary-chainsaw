/*
 * <tc-layer-stack> in real browsers – the illustration's contract and regression checks, ported
 * (contract/illustrations/layer-stack, regressions illustrations-layer-stack and -themes-and-loops).
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/layer-stack";
import { TcLayerStack, type LayerStackIndexChange } from "../../src/elements/layer-stack";
import { LayerStack } from "../../src/elements/react/layer-stack";
import { cleanup, fixture, settle } from "./helpers";

class ManualObserver {
  static last: ManualObserver | null = null;
  target: Element | null = null;
  constructor(private callback: IntersectionObserverCallback) {
    ManualObserver.last = this;
  }
  observe(target: Element) {
    this.target = target;
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  report(isIntersecting: boolean) {
    this.callback([{ target: this.target, isIntersecting } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", ManualObserver);
});
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.unstubAllGlobals();
});

const timers = () => vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
const selected = (root: Element) => [...root.querySelectorAll('[role="tab"]')].findIndex((t) => t.getAttribute("aria-selected") === "true");
/** Advances the fake clock and lets the element render */
async function tick(el: TcLayerStack, ms: number) {
  vi.advanceTimersByTime(ms);
  await el.updateComplete;
}

describe("tc-layer-stack", () => {
  test("the host is the root: data-ui, the 3 : 2 frame, five layers and a vertical tab list", async () => {
    const el = await fixture<TcLayerStack>(html`<tc-layer-stack style="width: 600px"></tc-layer-stack>`);
    expect(el.dataset.ui).toBe("lyr");
    expect(el.getBoundingClientRect().height).toBeCloseTo(400, 0);
    expect(el.querySelectorAll(".ui-lyr-layer").length).toBe(5);
    const tablist = el.querySelector('[role="tablist"]')!;
    expect(tablist.getAttribute("aria-orientation")).toBe("vertical");
    expect(tablist.getAttribute("aria-label")).toBe("Layers");
    expect(selected(el)).toBe(0);
    expect([...el.querySelectorAll<HTMLButtonElement>('[role="tab"]')].map((t) => t.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    expect(el.querySelectorAll(".ui-lyr-layer[data-active]").length).toBe(1);
  });

  test("the autoplay holds while off screen", async () => {
    timers();
    const el = await fixture<TcLayerStack>(html`<tc-layer-stack interval="1000"></tc-layer-stack>`);
    await tick(el, 1000);
    expect(selected(el)).toBe(1);
    ManualObserver.last!.report(false);
    await el.updateComplete;
    await tick(el, 5000);
    expect(selected(el)).toBe(1);
    ManualObserver.last!.report(true);
    await el.updateComplete;
    await tick(el, 1000);
    expect(selected(el)).toBe(2);
  });

  test("hovering or focusing pauses it", async () => {
    timers();
    const el = await fixture<TcLayerStack>(html`<tc-layer-stack interval="1000"></tc-layer-stack>`);
    el.dispatchEvent(new MouseEvent("mouseenter"));
    await el.updateComplete;
    await tick(el, 3000);
    expect(selected(el)).toBe(0);
    el.dispatchEvent(new MouseEvent("mouseleave"));
    await el.updateComplete;
    await tick(el, 1000);
    expect(selected(el)).toBe(1);
  });

  test("controlled: preventDefault keeps the index; rounds = 0 doesn't step; picks are reported, not applied", async () => {
    timers();
    const changes: LayerStackIndexChange[] = [];
    const el = await fixture<TcLayerStack>(html`<tc-layer-stack index="2" rounds="0" interval="1000" @tc-index-change=${(e: CustomEvent<LayerStackIndexChange>) => (e.preventDefault(), changes.push(e.detail))}></tc-layer-stack>`);
    await tick(el, 5000);
    expect(selected(el)).toBe(2);
    el.querySelectorAll<HTMLElement>('[role="tab"]')[4].click();
    await el.updateComplete;
    expect(changes).toEqual([{ index: 4, user: true }]);
    expect(selected(el)).toBe(2);
    el.index = 4;
    await el.updateComplete;
    expect(selected(el)).toBe(4);
  });

  test("tc-index-change also reports the automatic steps, with user: false", async () => {
    timers();
    const changes: LayerStackIndexChange[] = [];
    const el = await fixture<TcLayerStack>(html`<tc-layer-stack interval="1000" @tc-index-change=${(e: CustomEvent<LayerStackIndexChange>) => changes.push(e.detail)}></tc-layer-stack>`);
    await tick(el, 1000);
    expect(changes).toEqual([{ index: 1, user: false }]);
  });

  test("arrow keys, Home and End move through the list and focus the entry", async () => {
    const el = await fixture<TcLayerStack>(html`<tc-layer-stack index="2"></tc-layer-stack>`);
    const tabs = el.querySelectorAll<HTMLElement>('[role="tab"]');
    const key = async (from: number, k: string) => {
      tabs[from].focus();
      tabs[from].dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
      await settle();
    };
    await key(2, "End");
    expect(selected(el)).toBe(4);
    expect(document.activeElement).toBe(tabs[4]);
    await key(4, "Home");
    expect(selected(el)).toBe(0);
    expect(document.activeElement).toBe(tabs[0]);
    await key(0, "ArrowUp");
    expect(selected(el)).toBe(4);
    await key(4, "ArrowDown");
    expect(selected(el)).toBe(0);
    expect(tabs[0].tabIndex).toBe(0);
  });

  test("the autoplay rests after two rounds by default; Infinity keeps it going", async () => {
    timers();
    const a: number[] = [];
    const el = await fixture<TcLayerStack>(html`<tc-layer-stack interval="1000" @tc-index-change=${(e: CustomEvent<LayerStackIndexChange>) => a.push(e.detail.index)}></tc-layer-stack>`);
    for (let i = 0; i < 30; i++) await tick(el, 1000);
    expect(a.length).toBe(10);
    expect(a.at(-1)).toBe(0); // back on the first entry
    cleanup();
    const b: number[] = [];
    const inf = await fixture<TcLayerStack>(html`<tc-layer-stack interval="1000" .rounds=${Infinity} @tc-index-change=${(e: CustomEvent<LayerStackIndexChange>) => b.push(e.detail.index)}></tc-layer-stack>`);
    for (let i = 0; i < 30; i++) await tick(inf, 1000);
    expect(b.length).toBe(30);
  });

  test("fewer items than the index shows the last; at most five", async () => {
    const items = Array.from({ length: 7 }, (_, i) => ({ title: `Item ${i}` }));
    const el = await fixture<TcLayerStack>(html`<tc-layer-stack index="6" .items=${items}></tc-layer-stack>`);
    expect(el.querySelectorAll('[role="tab"]').length).toBe(5);
    expect(selected(el)).toBe(4);
  });

  test("the chosen title uses the accent text colour; dark follows data-tc-theme; no endless loop", () => {
    const css = TcLayerStack.css;
    expect(css).toMatch(/\.ui-lyr-row\[aria-selected="true"\] \.ui-lyr-title \{ color: var\(--tc-accent-text/);
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g))
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    expect(css).not.toMatch(/\binfinite\b/);
  });

  test("React wrapper: controlled index, onIndexChange and the deprecated onChange; className and ref reach the host", async () => {
    vi.unstubAllGlobals();
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcLayerStack>();
    const onIndexChange = vi.fn();
    const onChange = vi.fn();
    flushSync(() => root.render(React.createElement(LayerStack, { index: 2, onIndexChange, onChange, className: "consumer-class", "data-consumer": "yes", ref } as never)));
    await settle();
    const el = host.querySelector<TcLayerStack>("tc-layer-stack")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.consumer).toBe("yes");
    expect(el.rounds).toBe(0);
    el.querySelectorAll<HTMLElement>('[role="tab"]')[4].click();
    await settle();
    expect(onIndexChange).toHaveBeenCalledWith(4);
    expect(onChange).toHaveBeenCalledWith(4);
    expect(selected(el)).toBe(2);
    flushSync(() => root.render(React.createElement(LayerStack, { index: 4, onIndexChange } as never)));
    await settle();
    expect(selected(el)).toBe(4);
    // Uncontrolled: a pick sticks through a parent re-render
    flushSync(() => root.render(React.createElement(LayerStack, { defaultIndex: 1, key: "u" } as never)));
    await settle();
    const u = host.querySelector<TcLayerStack>("tc-layer-stack")!;
    expect(selected(u)).toBe(1);
    u.querySelectorAll<HTMLElement>('[role="tab"]')[3].click();
    await settle();
    flushSync(() => root.render(React.createElement(LayerStack, { defaultIndex: 1, key: "u", className: "again" } as never)));
    await settle();
    expect(selected(u)).toBe(3);
    root.unmount();
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div style="width: 600px"><tc-layer-stack index="1"></tc-layer-stack></div>`);
    for (const a of wrap.getAnimations({ subtree: true })) a.finish();
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
