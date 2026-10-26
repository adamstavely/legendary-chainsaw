/*
 * <tc-enrichment-orbit> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/enrichment-orbit";
import { TcEnrichmentOrbit } from "../../src/elements/enrichment-orbit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  delete (document as { visibilityState?: unknown }).visibilityState;
});

describe("tc-enrichment-orbit", () => {
  test("the host is the root (no data-look: one look); classes and attributes stay on it", async () => {
    const el = await fixture<TcEnrichmentOrbit>(html`<tc-enrichment-orbit class="mine" data-x="1" style="width: 300px"></tc-enrichment-orbit>`);
    expect(el.dataset.ui).toBe("eo");
    expect(el.hasAttribute("data-look")).toBe(false);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.dataset.x).toBe("1");
    expect(el.getBoundingClientRect().height).toBe(200);
  });

  test("decorative by default and with label=\"\", an image when labelled", async () => {
    const el = await fixture<TcEnrichmentOrbit>(html`<tc-enrichment-orbit label=""></tc-enrichment-orbit>`);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
    el.label = "Enriching leads";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Enriching leads");
    expect(el.getAttribute("aria-hidden")).toBeNull();
  });

  test("pauses while the tab is hidden", async () => {
    let hidden = false;
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
    const el = await fixture<TcEnrichmentOrbit>(html`<tc-enrichment-orbit></tc-enrichment-orbit>`);
    expect(el.hasAttribute("data-paused")).toBe(false);
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-eo-spin")!).animationPlayState).toBe("paused");
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    await settle();
    expect(el.hasAttribute("data-paused")).toBe(false);
  });

  test("the nodes orbit once and come to rest on their staggered spots (WCAG 2.2.2)", async () => {
    const el = await fixture<TcEnrichmentOrbit>(html`<tc-enrichment-orbit></tc-enrichment-orbit>`);
    const nodes = [...el.querySelectorAll<SVGGElement>(".ui-eo-orbit")];
    expect(nodes.map((n) => [n.style.animationDelay, Number(n.style.animationIterationCount).toFixed(4)])).toEqual([
      ["0s", (1).toFixed(4)],
      ["-7.33s", (1 + 7.33 / 22).toFixed(4)],
      ["-14.66s", (1 + 14.66 / 22).toFixed(4)],
    ]);
  });

  test("two scenes don't share SVG ids", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div><tc-enrichment-orbit></tc-enrichment-orbit><tc-enrichment-orbit></tc-enrichment-orbit></div>`);
    const ids = [...wrap.querySelectorAll("[id]")].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("dark follows .dark, data-theme, data-tc-theme and system alike; loops are finite", () => {
    const css = TcEnrichmentOrbit.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect(css).not.toMatch(/\binfinite\b/);
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div><tc-enrichment-orbit></tc-enrichment-orbit><tc-enrichment-orbit label="Enriching leads"></tc-enrichment-orbit></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
