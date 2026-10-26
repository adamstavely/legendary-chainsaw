/*
 * <tc-model-wheel> in real browsers – the illustration's contract and regression checks, ported: an equal models
 * array doesn't restart the drum, a hidden tab stops the auto-turn, it rests after `turns`, rows stay legible.
 */
import { html, render } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TcModelWheel, modelWheelDefaults } from "../../src/elements/model-wheel";
import { ModelWheel } from "../../src/elements/react/model-wheel";
import { cleanup, fixture, settle } from "./helpers";

/** Reports the wheel in view at once, so the auto-turn starts without waiting for a real observer */
class VisibleObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe() {
    this.callback([{ isIntersecting: true } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

/** Renders without the rAF-based settle(), which fake timers would hold up */
async function mount(template: ReturnType<typeof html>) {
  const host = document.body.appendChild(document.createElement("div"));
  render(template, host);
  const el = host.firstElementChild as TcModelWheel;
  await el.updateComplete;
  return el;
}
const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 16) vi.advanceTimersByTime(16);
};
const activeName = (el: Element) => el.querySelector(".ui-mw-row[data-active]")?.textContent;
const activeIndex = (el: Element) => [...el.querySelectorAll(".ui-mw-row")].findIndex((r) => r.hasAttribute("data-active"));

afterEach(cleanup);

describe("tc-model-wheel", () => {
  test("the host is the root; decorative without a label, an image with one", async () => {
    const el = await fixture<TcModelWheel>(html`<tc-model-wheel></tc-model-wheel>`);
    expect(el.dataset.ui).toBe("mw");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.querySelectorAll(".ui-mw-row")).toHaveLength(modelWheelDefaults.length);
    expect(activeName(el)).toBe("Claude");
    el.label = "Works with every major model";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Works with every major model");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
  });

  test("the fill follows the length of the selected name", async () => {
    const el = await fixture<TcModelWheel>(html`<tc-model-wheel></tc-model-wheel>`);
    const label = el.querySelector(".ui-mw-row[data-active] .ui-mw-label")!;
    expect(el.style.getPropertyValue("--tc-model-wheel-fill-w")).toBe(`${label.getBoundingClientRect().width + 28}px`);
  });

  describe("with fake timers", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
      vi.stubGlobal("IntersectionObserver", VisibleObserver);
    });
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      // @ts-expect-error – drop the own-property override, back to the browser's getter
      delete document.visibilityState;
    });

    test("an equal models array doesn't restart the drum", async () => {
      const el = await mount(html`<tc-model-wheel .models=${modelWheelDefaults}></tc-model-wheel>`);
      advance(4000); // one hold, then the spring settles on the next model
      const turned = activeName(el);
      expect(turned).not.toBe(modelWheelDefaults[0].name);
      el.models = [...modelWheelDefaults];
      await el.updateComplete;
      advance(16);
      expect(activeName(el)).toBe(turned);
    });

    test("a hidden tab stops the auto-turn, and it goes on when the tab is back", async () => {
      await mount(html`<tc-model-wheel></tc-model-wheel>`);
      advance(100);
      let hidden = true;
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
      document.dispatchEvent(new Event("visibilitychange"));
      expect(vi.getTimerCount()).toBe(0);
      hidden = false;
      document.dispatchEvent(new Event("visibilitychange"));
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    test("hover holds it", async () => {
      const el = await mount(html`<tc-model-wheel></tc-model-wheel>`);
      el.dispatchEvent(new PointerEvent("pointerenter"));
      expect(vi.getTimerCount()).toBe(0);
      el.dispatchEvent(new PointerEvent("pointerleave"));
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    test("it rests after the given number of automatic turns", async () => {
      const n = modelWheelDefaults.length;
      const el = await mount(html`<tc-model-wheel hold="200" turns="2"></tc-model-wheel>`);
      vi.advanceTimersByTime(20_000);
      // Each turn rolls the model above into the middle
      expect(activeIndex(el)).toBe(n - 2);
      vi.advanceTimersByTime(20_000);
      expect(activeIndex(el)).toBe(n - 2);
    });

    test("by default it goes once round the drum and stops on the first model", async () => {
      const el = await mount(html`<tc-model-wheel hold="200"></tc-model-wheel>`);
      vi.advanceTimersByTime(60_000);
      expect(activeIndex(el)).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    });

    test("rows up to three out keep full opacity; the fourth is gone", async () => {
      const el = await mount(html`<tc-model-wheel></tc-model-wheel>`);
      const rows = [...el.querySelectorAll<HTMLElement>(".ui-mw-row")];
      const n = rows.length;
      expect([1, 2, 3, n - 1, n - 2, n - 3].map((i) => rows[i].style.opacity)).toEqual(["1", "1", "1", "1", "1", "1"]);
      expect(rows[4].style.opacity).toBe("0");
    });

    test("leaving the page stops every timer and frame", async () => {
      const el = await mount(html`<tc-model-wheel hold="200"></tc-model-wheel>`);
      advance(300);
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  test("dark follows color-scheme alone (no theme-scoped rules below the root); reduced motion stills the fill", () => {
    const css = TcModelWheel.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.ui-mw-fill \{ transition: none; \}/);
  });

  test("React wrapper: className is merged, DOM props reach the host, and the ref gets the host", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcModelWheel>();
    await act(async () =>
      root.render(React.createElement(ModelWheel, { className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", hold: 900, ref } as React.ComponentProps<typeof ModelWheel>)),
    );
    await settle();
    const el = host.querySelector<TcModelWheel>("tc-model-wheel")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("mw");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(el.hold).toBe(900);
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div><tc-model-wheel></tc-model-wheel><tc-model-wheel label="Supported models"></tc-model-wheel></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
