/*
 * <tc-world-map> in real browsers – the illustration's contract and regression checks, ported
 * (contract/illustrations/world-map, regressions illustrations-world-map, -map-menus, -loops-pause, -themes-and-loops).
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/world-map";
import { TcWorldMap, type WorldMapContinentChange } from "../../src/elements/world-map";
import { WorldMap } from "../../src/elements/react/world-map";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

class ManualObserver {
  static all: ManualObserver[] = [];
  target: Element | null = null;
  constructor(private callback: IntersectionObserverCallback) {
    ManualObserver.all.push(this);
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

const trigger = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-wm-trigger")!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-world-map", () => {
  test("the host is the root: data-ui, the frame, the map as a named image and the menu", async () => {
    const el = await fixture<TcWorldMap>(html`<tc-world-map style="width: 540px"></tc-world-map>`);
    expect(el.dataset.ui).toBe("wm");
    expect(el.getBoundingClientRect().height).toBeCloseTo(242, 0);
    const map = el.querySelector(".ui-wm-map")!;
    expect(map.getAttribute("role")).toBe("img");
    expect(map.getAttribute("aria-label")).toBe("World map with Europe highlighted");
    expect(trigger(el).getAttribute("aria-label")).toBe("Continent: Europe");
    expect(el.querySelectorAll('[role="option"]').length).toBe(6);
    // The menu scales with the map: 242 of the 260 px the open list needs
    expect(Number(el.style.getPropertyValue("--tc-world-map-s"))).toBeCloseTo(242 / 260, 2);
  });

  test("label: a string or a function of the continent; no menu without showSwitcher", async () => {
    const el = await fixture<TcWorldMap>(html`<tc-world-map continent="asia" show-switcher="false" .label=${(c: string) => `Offices in ${c}`}></tc-world-map>`);
    expect(el.querySelector(".ui-wm-map")!.getAttribute("aria-label")).toBe("Offices in asia");
    expect(el.querySelector(".ui-wm-switch")).toBeNull();
  });

  test("switching the continent shows the new layer at once while the old one fades out", async () => {
    const el = await fixture<TcWorldMap>(html`<tc-world-map></tc-world-map>`);
    el.continent = "asia";
    await el.updateComplete;
    expect([...el.querySelectorAll(".ui-wm-layer")].map((l) => l.getAttribute("data-phase"))).toEqual(["exit", "enter"]);
    await expect.poll(() => [...el.querySelectorAll(".ui-wm-layer")].map((l) => l.getAttribute("data-phase")), { timeout: 3000 }).toEqual(["enter"]);
  });

  test("picking a continent fires a cancelable tc-continent-change; preventDefault keeps the value", async () => {
    const changes: string[] = [];
    let prevent = true;
    const el = await fixture<TcWorldMap>(html`<tc-world-map @tc-continent-change=${(e: CustomEvent<WorldMapContinentChange>) => (changes.push(e.detail.continent), prevent && e.preventDefault())}></tc-world-map>`);
    trigger(el).click();
    await settle();
    el.querySelectorAll<HTMLElement>('[role="option"]')[4].click();
    await settle();
    expect(changes).toEqual(["asia"]);
    expect(el.continent).toBe("europe");
    expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger(el));
    prevent = false;
    trigger(el).click();
    await settle();
    el.querySelectorAll<HTMLElement>('[role="option"]')[4].click();
    await settle();
    expect(trigger(el).querySelector("span")!.textContent).toBe("Asia");
  });

  test("opened with Enter, the active row shows at once; opened with a click it waits for the pointer", async () => {
    const el = await fixture<TcWorldMap>(html`<tc-world-map></tc-world-map>`);
    const fill = el.querySelector<HTMLElement>(".ui-wm-fill")!;
    trigger(el).dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
    await settle();
    expect(trigger(el).getAttribute("aria-expanded")).toBe("true");
    expect(fill.style.opacity).toBe("1");
    const panel = el.querySelector<HTMLElement>('[role="listbox"]')!;
    expect(document.activeElement).toBe(panel);
    key(panel, "Escape");
    await settle();
    expect(document.activeElement, "Escape returns to the trigger").toBe(trigger(el));
    trigger(el).dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await settle();
    expect(fill.style.opacity).toBe("0");
  });

  test("the listbox keyboard: arrows, Home, End move the active descendant; Enter picks; a click outside closes", async () => {
    const el = await fixture<TcWorldMap>(html`<tc-world-map></tc-world-map>`);
    trigger(el).focus();
    key(trigger(el), "ArrowDown");
    await settle();
    const panel = el.querySelector<HTMLElement>('[role="listbox"]')!;
    const activeName = () => document.getElementById(panel.getAttribute("aria-activedescendant")!)!.textContent!.trim();
    expect(activeName()).toBe("Europe");
    key(panel, "ArrowDown");
    await settle();
    expect(activeName()).toBe("Africa");
    key(panel, "End");
    await settle();
    expect(activeName()).toBe("Oceania");
    key(panel, "Home");
    await settle();
    expect(activeName()).toBe("North America");
    key(panel, "Enter");
    await settle();
    expect(el.continent).toBe("north-america");
    expect(el.querySelector('[aria-selected="true"]')!.textContent!.trim()).toBe("North America");
    trigger(el).click();
    await settle();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
  });

  test("the band is paused while off screen or in a hidden tab", async () => {
    ManualObserver.all = [];
    vi.stubGlobal("IntersectionObserver", ManualObserver);
    const el = await fixture<TcWorldMap>(html`<tc-world-map></tc-world-map>`);
    const observer = ManualObserver.all.find((o) => o.target === el)!;
    expect(observer, "the host is observed").toBeTruthy();
    expect(el.hasAttribute("data-paused")).toBe(false);
    observer.report(false);
    await settle();
    expect(el.hasAttribute("data-paused")).toBe(true);
    observer.report(true);
    await settle();
    expect(el.hasAttribute("data-paused")).toBe(false);
    const hidden = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(el.hasAttribute("data-paused")).toBe(true);
    hidden.mockRestore();
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(el.hasAttribute("data-paused")).toBe(false);
  });

  test("styles: finite band loops, the keyboard ring, menu tokens, dark through data-tc-theme", () => {
    const css = TcWorldMap.css;
    expect(css).toContain("--tc-world-map-loops: 2;");
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toContain(".ui-wm-panel:focus-visible .ui-wm-fill");
    expect(css).toMatch(/border-radius: var\(--tc-menu-radius/);
    expect(css).toMatch(/border-radius: var\(--tc-menu-item-radius/);
    expect(css).toContain('[data-ui="wm"][data-paused] .ui-wm-band { animation-play-state: paused; }');
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g))
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
  });

  test("ids are unique per instance", async () => {
    const wrap = await fixture(html`<div><tc-world-map></tc-world-map><tc-world-map></tc-world-map></div>`);
    const ids = [...wrap.querySelectorAll("[id]")].map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("React wrapper: controlled continent follows its prop; className, DOM props and ref reach the host; a handler-less controlled value warns", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcWorldMap>();
    const onContinentChange = vi.fn();
    const props = { onContinentChange, className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", ref };
    flushSync(() => root.render(React.createElement(WorldMap, { ...props, continent: "europe" } as never)));
    await settle();
    const el = host.querySelector<TcWorldMap>("tc-world-map")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.consumer).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    trigger(el).click();
    await settle();
    el.querySelectorAll<HTMLElement>('[role="option"]')[5].click();
    await settle();
    expect(onContinentChange).toHaveBeenCalledWith("oceania");
    expect(trigger(el).querySelector("span")!.textContent).toBe("Europe");
    flushSync(() => root.render(React.createElement(WorldMap, { ...props, continent: "oceania" } as never)));
    await settle();
    expect(trigger(el).querySelector("span")!.textContent).toBe("Oceania");
    root.unmount();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r2 = createRoot(document.body.appendChild(document.createElement("div")));
    flushSync(() => r2.render(React.createElement(WorldMap, { continent: "asia" })));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`continent` is set without its change handler"));
    warn.mockClear();
    flushSync(() => r2.render(React.createElement(WorldMap, { continent: "asia", showSwitcher: false, key: 2 })));
    expect(warn).not.toHaveBeenCalled();
    r2.unmount();
  });

  test("axe: no violations, closed and open", async () => {
    const wrap = await fixture(html`<div style="width: 540px"><tc-world-map></tc-world-map></div>`);
    const run = async () => {
      for (const a of wrap.getAnimations({ subtree: true })) if (a.effect?.getComputedTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    };
    expect(await run()).toEqual([]);
    trigger(wrap.firstElementChild!).click();
    await settle();
    await new Promise((r) => setTimeout(r, 500));
    expect(await run()).toEqual([]);
  });
});
