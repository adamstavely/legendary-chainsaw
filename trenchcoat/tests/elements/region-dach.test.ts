/*
 * <tc-region-dach> in real browsers – the illustration's contract and regression checks, ported
 * (contract/illustrations/region-dach, regressions illustrations-region-dach, -map-menus, -loops-pause, -themes-and-loops).
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/region-dach";
import { TcRegionDach, type RegionDachRegionChange } from "../../src/elements/region-dach";
import { RegionDach } from "../../src/elements/react/region-dach";
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

const trigger = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-rd-trigger")!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-region-dach", () => {
  test("the host is the root: data-ui, the frame, the map as a named image and the menu", async () => {
    const el = await fixture<TcRegionDach>(html`<tc-region-dach style="width: 540px"></tc-region-dach>`);
    expect(el.dataset.ui).toBe("rd");
    expect(el.getBoundingClientRect().height).toBeCloseTo(440, 0);
    const map = el.querySelector(".ui-rd-map")!;
    expect(map.getAttribute("role")).toBe("img");
    expect(map.getAttribute("aria-label")).toBe("Map of the DACH region: Germany, Austria and Switzerland");
    expect(trigger(el).getAttribute("aria-label")).toBe("Region: DACH");
    expect(el.querySelectorAll('[role="option"]').length).toBe(6);
    expect(el.style.getPropertyValue("--tc-region-dach-s")).toBe("1");
  });

  test("label: a string or a function of the region; no menu without showSwitcher", async () => {
    const el = await fixture<TcRegionDach>(html`<tc-region-dach region="jp" show-switcher="false" .label=${(c: string) => `Offices in ${c}`}></tc-region-dach>`);
    expect(el.querySelector(".ui-rd-map")!.getAttribute("aria-label")).toBe("Offices in jp");
    expect(el.querySelector(".ui-rd-switch")).toBeNull();
  });

  test("switching the region shows the new layer at once while the old one fades out", async () => {
    const el = await fixture<TcRegionDach>(html`<tc-region-dach></tc-region-dach>`);
    el.region = "jp";
    await el.updateComplete;
    expect([...el.querySelectorAll(".ui-rd-layer")].map((l) => l.getAttribute("data-phase"))).toEqual(["exit", "enter"]);
    await expect.poll(() => [...el.querySelectorAll(".ui-rd-layer")].map((l) => l.getAttribute("data-phase")), { timeout: 3000 }).toEqual(["enter"]);
  });

  test("picking a region fires a cancelable tc-region-change; preventDefault keeps the value", async () => {
    const changes: string[] = [];
    let prevent = true;
    const el = await fixture<TcRegionDach>(html`<tc-region-dach @tc-region-change=${(e: CustomEvent<RegionDachRegionChange>) => (changes.push(e.detail.region), prevent && e.preventDefault())}></tc-region-dach>`);
    trigger(el).click();
    await settle();
    el.querySelectorAll<HTMLElement>('[role="option"]')[4].click();
    await settle();
    expect(changes).toEqual(["br"]);
    expect(el.region).toBe("dach");
    expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger(el));
    prevent = false;
    trigger(el).click();
    await settle();
    el.querySelectorAll<HTMLElement>('[role="option"]')[4].click();
    await settle();
    expect(trigger(el).querySelector("span")!.textContent).toBe("Brazil");
  });

  test("opened with Enter, the active row shows at once; opened with a click it waits for the pointer", async () => {
    const el = await fixture<TcRegionDach>(html`<tc-region-dach></tc-region-dach>`);
    const fill = el.querySelector<HTMLElement>(".ui-rd-fill")!;
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
    const el = await fixture<TcRegionDach>(html`<tc-region-dach></tc-region-dach>`);
    trigger(el).focus();
    key(trigger(el), "ArrowDown");
    await settle();
    const panel = el.querySelector<HTMLElement>('[role="listbox"]')!;
    const activeName = () => document.getElementById(panel.getAttribute("aria-activedescendant")!)!.textContent!.trim();
    expect(activeName()).toBe("DACH");
    key(panel, "ArrowDown");
    await settle();
    expect(activeName()).toBe("United States");
    key(panel, "End");
    await settle();
    expect(activeName()).toBe("Japan");
    key(panel, "Home");
    await settle();
    expect(activeName()).toBe("DACH");
    key(panel, "End");
    await settle();
    key(panel, "Enter");
    await settle();
    expect(el.region).toBe("jp");
    expect(el.querySelector('[aria-selected="true"]')!.textContent!.trim()).toBe("Japan");
    trigger(el).click();
    await settle();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
  });

  test("the band is paused while off screen or in a hidden tab", async () => {
    ManualObserver.all = [];
    vi.stubGlobal("IntersectionObserver", ManualObserver);
    const el = await fixture<TcRegionDach>(html`<tc-region-dach></tc-region-dach>`);
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
    const css = TcRegionDach.css;
    expect(css).toContain("--tc-region-dach-loops: 2;");
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toContain(".ui-rd-panel:focus-visible .ui-rd-fill");
    expect(css).toMatch(/border-radius: var\(--tc-menu-radius/);
    expect(css).toMatch(/border-radius: var\(--tc-menu-item-radius/);
    expect(css).toContain('[data-ui="rd"][data-paused] .ui-rd-band { animation-play-state: paused; }');
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g))
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
  });

  test("ids are unique per instance", async () => {
    const wrap = await fixture(html`<div><tc-region-dach></tc-region-dach><tc-region-dach></tc-region-dach></div>`);
    const ids = [...wrap.querySelectorAll("[id]")].map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("React wrapper: controlled region follows its prop; className, DOM props and ref reach the host; a handler-less controlled value warns", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcRegionDach>();
    const onRegionChange = vi.fn();
    const props = { onRegionChange, className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", ref };
    flushSync(() => root.render(React.createElement(RegionDach, { ...props, region: "dach" } as never)));
    await settle();
    const el = host.querySelector<TcRegionDach>("tc-region-dach")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.consumer).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    trigger(el).click();
    await settle();
    el.querySelectorAll<HTMLElement>('[role="option"]')[5].click();
    await settle();
    expect(onRegionChange).toHaveBeenCalledWith("jp");
    expect(trigger(el).querySelector("span")!.textContent).toBe("DACH");
    flushSync(() => root.render(React.createElement(RegionDach, { ...props, region: "jp" } as never)));
    await settle();
    expect(trigger(el).querySelector("span")!.textContent).toBe("Japan");
    root.unmount();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r2 = createRoot(document.body.appendChild(document.createElement("div")));
    flushSync(() => r2.render(React.createElement(RegionDach, { region: "jp" })));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`region` is set without its change handler"));
    warn.mockClear();
    flushSync(() => r2.render(React.createElement(RegionDach, { region: "jp", showSwitcher: false, key: 2 })));
    expect(warn).not.toHaveBeenCalled();
    r2.unmount();
  });

  test("axe: no violations, closed and open", async () => {
    const wrap = await fixture(html`<div style="width: 540px"><tc-region-dach></tc-region-dach></div>`);
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
