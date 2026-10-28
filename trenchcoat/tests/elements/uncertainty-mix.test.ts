/*
 * <tc-uncertainty-mix> in real browsers: the shares, the bar and the reading, the chart's records and hidden kinds,
 * tc-hidden-change (and preventDefault), colours from data, empty states, narrow layout, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/uncertainty-mix";
import type { TcUncertaintyMix, UncertaintyHiddenChange, UncertaintySource } from "../../src/elements/uncertainty-mix";
import type { TcBreakdownChart } from "../../src/elements/breakdown-chart";
import { UncertaintyMix } from "../../src/elements/react/uncertainty-mix";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

// gap 50 (25+25), chance 30, model 20 → 50%, 30%, 20%; Forecast carries 60
const SOURCES: UncertaintySource[] = [
  { part: "Baseline", kind: "gap", amount: 25 },
  { part: "Baseline", kind: "chance", amount: 10 },
  { part: "Forecast", kind: "gap", amount: 25 },
  { part: "Forecast", kind: "chance", amount: 20 },
  { part: "Forecast", kind: "model", amount: 20 },
  { part: "Forecast", kind: "unknown-kind", amount: 99 },
];

const make = (look: "standard" | "clean" = "standard", width = 1000) =>
  fixture<TcUncertaintyMix>(html`<tc-uncertainty-mix look=${look} style=${`width: ${width}px`} subtitle="Will it lift conversion?" .sources=${SOURCES}></tc-uncertainty-mix>`);
const chart = (el: Element) => el.querySelector<TcBreakdownChart>("tc-breakdown-chart")!;
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const shares = (el: Element) => [...el.querySelectorAll(".ui-umix__kind")].map((k) => `${text(k.querySelector(".ui-umix__share"))} ${text(k.querySelector(".ui-umix__kind-label"))}`);
/** The chart's legend hiding labels, the way a chip press does: through its cancelable event */
const hideInChart = (el: Element, labels: string[]) =>
  chart(el).dispatchEvent(new CustomEvent("tc-hidden-change", { detail: { hidden: labels }, bubbles: true, composed: true, cancelable: true }));

describe("tc-uncertainty-mix", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the card's heading, the bar named by its mix, the kinds' shares and the reading`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("umix");
      expect(el.dataset.look).toBe(look);
      expect(chart(el).dataset.look).toBe(look);
      expect(text(el.querySelector(".ui-umix__card h3"))).toBe("Uncertainty mix");
      expect(el.querySelector(".ui-umix__card")!.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-umix__card h3")!.id);
      expect(text(el.querySelector(".tc-head__sub"))).toBe("Will it lift conversion?");
      expect(el.querySelector(".ui-umix__bar")!.getAttribute("aria-label")).toBe("Missing information 50%, Inherent uncertainty 30%, Model limits 20%");
      expect(el.querySelectorAll(".ui-umix__seg")).toHaveLength(3);
      expect(shares(el)).toEqual(["50% Missing information", "30% Inherent uncertainty", "20% Model limits"]);
      const reading = text(el.querySelector(".ui-umix__reading"));
      expect(reading).toContain("Most of the uncertainty – 50% – is missing information.");
      expect(reading).toContain("Find or request what's missing before relying on it.");
      expect(reading).toContain("Forecast carries the most (65%) – start there.");
    });
  }

  test("the chart gets the records in labels, the parts and kinds as dimensions, its title, and the kinds' colours", async () => {
    const el = await make();
    const c = chart(el);
    expect(c.heading).toBe("By part of the answer");
    expect(c.records).toHaveLength(5);
    expect(c.records[0]).toEqual({ part: "Baseline", kind: "Missing information", amount: 25 });
    expect(c.dimensions.map((d) => d.values)).toEqual([["Baseline", "Forecast"], ["Missing information", "Inherent uncertainty", "Model limits"]]);
    expect(c.dimensions[0].label).toBe("Part of the answer");
    expect(c.dimensions[1].colors!["Model limits"]).toBe("var(--tc-tone-amber-solid)");
    el.partLabel = "Claim";
    el.chartTitle = "By claim";
    el.parts = ["Forecast", "Baseline"];
    await settle();
    expect(c.dimensions[0]).toMatchObject({ label: "Claim", values: ["Forecast", "Baseline"] });
    expect(c.heading).toBe("By claim");
  });

  test("hiding a kind in the chart: tc-hidden-change with the keys, the reading and the chart follow", async () => {
    const el = await make();
    const seen: UncertaintyHiddenChange[] = [];
    el.addEventListener("tc-hidden-change", (e) => seen.push((e as CustomEvent<UncertaintyHiddenChange>).detail));
    hideInChart(el, ["Missing information"]);
    await settle();
    expect(seen).toEqual([{ hidden: ["gap"], hiddenKinds: ["gap"] }]);
    expect(el.hiddenKinds).toEqual(["gap"]);
    expect(chart(el).hiddenSegments).toEqual(["Missing information"]);
    expect(shares(el)).toEqual(["60% Inherent uncertainty", "40% Model limits"]);
    expect(text(el.querySelector(".ui-umix__reading"))).toContain("Most of the uncertainty – 60% – is inherent uncertainty.");
    // Everything hidden: the card says how to bring it back
    hideInChart(el, ["Missing information", "Inherent uncertainty", "Model limits"]);
    await settle();
    expect(text(el.querySelector(".ui-umix__empty"))).toBe("Every kind is hidden – show one in the chart's legend.");
  });

  test("preventDefault on tc-hidden-change keeps the kinds (controlled use); setting hiddenKinds hides them", async () => {
    const el = await make();
    el.addEventListener("tc-hidden-change", (e) => e.preventDefault());
    hideInChart(el, ["Model limits"]);
    await settle();
    expect(el.hiddenKinds).toEqual([]);
    expect(shares(el)).toHaveLength(3);
    el.hiddenKinds = ["model"];
    await settle();
    expect(shares(el)).toEqual(["63% Missing information", "38% Inherent uncertainty"]);
    expect(chart(el).hiddenSegments).toEqual(["Model limits"]);
  });

  test("lead below half reads “The largest share”; one part has no “start there”; no sources says so", async () => {
    const el = await make();
    el.sources = [
      { part: "Only", kind: "gap", amount: 4 },
      { part: "Only", kind: "chance", amount: 3 },
      { part: "Only", kind: "model", amount: 3 },
    ];
    await settle();
    const reading = text(el.querySelector(".ui-umix__reading"))!;
    expect(reading).toContain("The largest share of the uncertainty – 40% – is missing information.");
    expect(reading).not.toContain("start there");
    el.sources = [];
    await settle();
    expect(text(el.querySelector(".ui-umix__empty"))).toBe("No uncertainty recorded for this answer.");
  });

  test("colours from data: a colour is used, anything else (url(…)) falls back to the neutral token; bad amounts count as 0", async () => {
    const el = await make();
    el.kinds = [
      { key: "a", label: "A", meaning: "a", advice: "Do a.", color: "rgb(1, 2, 3)" },
      { key: "b", label: "B", meaning: "b", advice: "Do b.", color: "url(https://example.com/x.png)" },
    ];
    el.sources = [
      { part: "P", kind: "a", amount: 1 },
      { part: "P", kind: "b", amount: 1 },
      { part: "P", kind: "a", amount: Number.NaN },
      { part: "P", kind: "b", amount: -5 },
    ];
    await settle();
    const segs = [...el.querySelectorAll<HTMLElement>(".ui-umix__seg")];
    expect(segs[0].style.background).toContain("rgb(1, 2, 3)");
    expect(segs[1].getAttribute("style")).toContain("var(--tc-chart-neutral)");
    expect(segs[1].getAttribute("style")).not.toContain("url(");
    expect(shares(el)).toEqual(["50% A", "50% B"]);
  });

  test("narrow: the chart goes under the card", async () => {
    const el = await make("standard", 360);
    const card = el.querySelector(".ui-umix__card")!.getBoundingClientRect();
    const c = chart(el).getBoundingClientRect();
    expect(c.top).toBeGreaterThanOrEqual(card.bottom - 1);
    expect(card.width).toBeLessThanOrEqual(360);
  });

  test("React wrapper: title, controlled hidden and onHiddenChange; uncontrolled survives re-renders", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[][] = [];
    await act(async () => root.render(React.createElement(UncertaintyMix, { title: "Where it's unsure", sources: SOURCES, hidden: [], onHiddenChange: (k) => void seen.push(k) })));
    await settle();
    let el = host.querySelector("tc-uncertainty-mix")!;
    expect(text(el.querySelector(".ui-umix__card h3"))).toBe("Where it's unsure");
    await act(async () => void hideInChart(el, ["Model limits"]));
    await settle();
    expect(seen).toEqual([["model"]]);
    expect(el.hiddenKinds).toEqual([]);
    await act(async () => root.unmount());
    // Uncontrolled: starts from defaultHidden, and a change survives parent re-renders
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => void root2.render(React.createElement(UncertaintyMix, { sources: SOURCES, defaultHidden: ["chance"] })));
    el = host2.querySelector("tc-uncertainty-mix")!;
    expect(el.hiddenKinds).toEqual(["chance"]);
    await act(async () => void hideInChart(el, ["Inherent uncertainty", "Model limits"]));
    await act(async () => void root2.render(React.createElement(UncertaintyMix, { sources: SOURCES, defaultHidden: ["chance"], subtitle: "again" })));
    await settle();
    expect(el.hiddenKinds).toEqual(["chance", "model"]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 1000px; background: var(--tc-surface-base)">
        <tc-uncertainty-mix subtitle="Standard" .sources=${SOURCES}></tc-uncertainty-mix>
        <tc-uncertainty-mix look="clean" heading="Clean mix" .sources=${SOURCES}></tc-uncertainty-mix>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
