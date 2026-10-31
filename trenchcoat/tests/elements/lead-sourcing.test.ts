/*
 * <tc-lead-sourcing> in real browsers – the illustration's contract and regression checks, ported
 * (contract/illustrations/lead-sourcing, regressions illustrations-loops-pause and -themes-and-loops).
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/lead-sourcing";
import { TcLeadSourcing } from "../../src/elements/lead-sourcing";
import { LeadSourcing } from "../../src/elements/react/lead-sourcing";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** An IntersectionObserver the test reports through */
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

describe("tc-lead-sourcing", () => {
  test("the host is the root: data-ui, the 3 : 2 frame and the art", async () => {
    const el = await fixture<TcLeadSourcing>(html`<tc-lead-sourcing style="width: 300px"></tc-lead-sourcing>`);
    expect(el.dataset.ui).toBe("ls");
    expect(el.getBoundingClientRect().height).toBeCloseTo(200, 0);
    expect(el.querySelector(":scope > svg.ui-ls-art")).toBeTruthy();
  });

  test("decorative by default; a label makes it an image, and dropping it makes it decorative again", async () => {
    const el = await fixture<TcLeadSourcing>(html`<tc-lead-sourcing></tc-lead-sourcing>`);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
    el.label = "Sourcing";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Sourcing");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    el.label = undefined;
    await settle();
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
    expect(el.getAttribute("aria-label")).toBeNull();
  });

  test("ids are unique per instance", async () => {
    const wrap = await fixture(html`<div><tc-lead-sourcing></tc-lead-sourcing><tc-lead-sourcing></tc-lead-sourcing></div>`);
    const ids = [...wrap.querySelectorAll("[id]")].map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Every url(#…) points at an id in its own instance
    for (const el of wrap.querySelectorAll("tc-lead-sourcing")) {
      const own = new Set([...el.querySelectorAll("[id]")].map((n) => n.id));
      for (const n of el.querySelectorAll("[fill^='url('], [stroke^='url('], [filter], [mask]"))
        for (const a of ["fill", "stroke", "filter", "mask"]) {
          const ref = n.getAttribute(a)?.match(/^url\(#(.+)\)$/)?.[1];
          if (ref) expect(own.has(ref), ref).toBe(true);
        }
    }
  });

  test("the SMIL shine runs three times and freezes", async () => {
    const el = await fixture<TcLeadSourcing>(html`<tc-lead-sourcing></tc-lead-sourcing>`);
    const animates = [...el.querySelectorAll("animate")];
    expect(animates.length).toBe(2);
    for (const a of animates) {
      expect(a.getAttribute("repeatCount")).toBe("3");
      expect(a.getAttribute("fill")).toBe("freeze");
    }
  });

  test("reduced motion leaves the shine out", async () => {
    const real = window.matchMedia.bind(window);
    vi.stubGlobal("matchMedia", (q: string) => (q.includes("reduced-motion") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : real(q)));
    const el = await fixture<TcLeadSourcing>(html`<tc-lead-sourcing></tc-lead-sourcing>`);
    expect(el.querySelectorAll("animate").length).toBe(0);
  });

  test("pauses its SMIL shine with the SVG's own clock while off screen", async () => {
    ManualObserver.all = [];
    vi.stubGlobal("IntersectionObserver", ManualObserver);
    const pause = vi.spyOn(SVGSVGElement.prototype, "pauseAnimations");
    const unpause = vi.spyOn(SVGSVGElement.prototype, "unpauseAnimations");
    try {
      const el = await fixture<TcLeadSourcing>(html`<tc-lead-sourcing></tc-lead-sourcing>`);
      const observer = ManualObserver.all.find((o) => o.target === el)!;
      expect(observer, "the host is observed").toBeTruthy();
      unpause.mockClear();
      observer.report(false);
      await settle();
      expect(pause).toHaveBeenCalledTimes(1);
      observer.report(true);
      await settle();
      expect(unpause).toHaveBeenCalled();
    } finally {
      pause.mockRestore();
      unpause.mockRestore();
    }
  });

  test("dark mode follows light-dark() and data-tc-theme; no endless CSS loop", async () => {
    const css = TcLeadSourcing.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g))
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    expect(css).not.toMatch(/\binfinite\b/);
    // And it really switches: a tile is dark under data-tc-theme="dark"
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-lead-sourcing></tc-lead-sourcing></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-ls-tile")!).fill).toBe("rgb(35, 35, 38)");
  });

  test("React wrapper: className, DOM props and ref reach the host", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcLeadSourcing>();
    flushSync(() => root.render(React.createElement(LeadSourcing, { className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", label: "Sourcing", ref } as never)));
    await settle();
    const el = host.querySelector<TcLeadSourcing>("tc-lead-sourcing")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.consumer).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(el.getAttribute("role")).toBe("img");
    root.unmount();
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div><tc-lead-sourcing></tc-lead-sourcing><tc-lead-sourcing label="Leads from Gmail and Grok"></tc-lead-sourcing></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

describe("tc-lead-sourcing neutral", () => {
  test("draws plain marks instead of logos", async () => {
    const plain = await fixture(html`<tc-lead-sourcing neutral></tc-lead-sourcing>`);
    expect(plain.querySelector(".ui-ls-neutral")).toBeTruthy();
    const branded = await fixture(html`<tc-lead-sourcing></tc-lead-sourcing>`);
    expect(branded.querySelector(".ui-ls-neutral")).toBeNull();
  });
});
