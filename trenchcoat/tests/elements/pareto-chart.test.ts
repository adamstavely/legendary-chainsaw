/*
 * <tc-pareto-chart> in real browsers: the shared chart behaviour (chart-kit), sorting and the running share, the
 * threshold emphasis, options (threshold, keep-order, rank-labels), a data change, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/pareto-chart";
import type { TcParetoChart } from "../../src/elements/pareto-chart";
import { ParetoChart } from "../../src/elements/react/pareto-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

// 100 findings: sorted 40, 30, 15, 10, 5 – the running share 40, 70, 85, 95, 100. Toward 80%, the emphasis stops
// at 70%: the next bar would overshoot by more than half a point
const FINDINGS = [
  { label: "Calibration", value: 15 },
  { label: "Labelling", value: 40 },
  { label: "Access logs", value: 5 },
  { label: "Storage", value: 30 },
  { label: "Training", value: 10 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcParetoChart>(
    html`<div style="width: 600px"><tc-pareto-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Audit findings" .data=${o.data ?? FINDINGS}></tc-pareto-chart></div>`,
  ).then((w) => w.querySelector("tc-pareto-chart")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-prt__bar")];
const rows = (el: Element) => [...el.querySelectorAll(".tc-sr-only tbody th")].map((t) => t.textContent);
const ticks = (el: Element) => [...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent);

describe("tc-pareto-chart", () => {
  chartBasics({ tag: "tc-pareto-chart", ui: "prt", kind: "Pareto chart", make: make as never, marks: 5, firstRead: /^Labelling: 40 · share 40% · cumulative 40%/ });

  test("sorted from the largest, the line through the running share; the bars up to 80% take the accent", async () => {
    const el = await drawn(await make({ still: true }));
    expect(rows(el)).toEqual(["Labelling", "Storage", "Calibration", "Training", "Access logs"]);
    expect(bars(el).map((b) => b.style.fill)).toEqual(["var(--tc-plot-accent)", "var(--tc-plot-accent)", "var(--tc-plot-rest)", "var(--tc-plot-rest)", "var(--tc-plot-rest)"]);
    const heights = bars(el).map((b) => b.getBBox().height);
    expect(heights[0]).toBeGreaterThan(heights[1]);
    // The dots climb: each higher (smaller y) than the one before, the last at the plot's top
    const dots = [...el.querySelectorAll<SVGCircleElement>(".ui-prt__dot")].map((c) => Number(c.getAttribute("cy")));
    expect(dots).toHaveLength(5);
    expect(dots.every((y, i) => !i || y < dots[i - 1])).toBe(true);
    expect(el.querySelector(".ui-prt__dot[data-end]")).toBe(el.querySelectorAll(".ui-prt__dot")[1]);
    expect(el.querySelector(".tc-chart__value")!.textContent).toBe("70%");
    expect(ticks(el)).toContain("80%");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("5 items; the top 2 add up to 70%.");
  });

  test("threshold moves the line and the emphasis; highlight overrides it", async () => {
    const el = await drawn(await make({ still: true }));
    el.threshold = 90;
    await settle();
    expect(bars(el).map((b) => b.style.fill === "var(--tc-plot-accent)")).toEqual([true, true, true, false, false]);
    expect(ticks(el)).toContain("90%");
    el.highlight = "Training";
    await settle();
    expect(bars(el).map((b) => b.style.fill === "var(--tc-plot-accent)")).toEqual([false, false, false, true, false]);
  });

  test("keep-order keeps the rows' order; rank-labels writes ranks; the tooltip has value, share and running share", async () => {
    const el = await drawn(await make({ still: true }));
    el.keepOrder = true;
    el.rankLabels = true;
    el.unit = " findings";
    await settle();
    expect(rows(el)).toEqual(["Calibration", "Labelling", "Access logs", "Storage", "Training"]);
    expect(ticks(el)).toEqual(expect.arrayContaining(["#1", "#5"]));
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("#2 · Labelling");
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((v) => v.textContent)).toEqual(["40 findings", "40%", "55%"]);
  });

  test("the bars grow and the line draws once on screen, then a data change re-sorts and glides", async () => {
    const el = await drawn(await make());
    await expect.poll(() => bars(el)[0].getBBox().height, { timeout: 4000 }).toBeGreaterThan(40);
    await expect.poll(() => el.querySelector(".ui-prt__line")?.hasAttribute("stroke-dasharray"), { timeout: 4000 }).toBe(false);
    el.data = FINDINGS.map((d) => (d.label === "Training" ? { ...d, value: 60 } : d));
    await settle();
    expect(rows(el)[0]).toBe("Training");
    await expect.poll(() => bars(el).length, { timeout: 4000 }).toBe(5);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(ParetoChart, { title: "Findings", data: FINDINGS, still: true, threshold: 90, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcParetoChart>("tc-pareto-chart")!;
    expect(el.heading).toBe("Findings");
    expect(el.threshold).toBe(90);
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(ParetoChart, { title: "Findings", data: FINDINGS, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Labelling"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
