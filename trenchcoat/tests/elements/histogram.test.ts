/*
 * <tc-histogram> in real browsers: the shared chart behaviour (chart-kit), the binning worked out (round edges, values
 * on an edge, a fixed domain, the automatic count), the tallest bin emphasised, the running total, the density curve
 * and the mean and median lines, a data change, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/histogram";
import type { TcHistogram } from "../../src/elements/histogram";
import { autoBinCount, binValues } from "../../src/elements/internal/chart/bins";
import { Histogram } from "../../src/elements/react/histogram";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

// Hours an assay took: with 2-hour bins, [0, 2) 1, [2, 4) 5, [4, 6) 3, [6, 8) 0, [8, 10] 1
const VALUES = [1, 2, 2, 3, 3, 3, 4, 4, 5, 10];
const DATA = VALUES.map((value) => ({ value }));

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcHistogram>(
    html`<div style="width: 600px"><tc-histogram look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Assay turnaround" bin-width="2" .data=${o.data ?? DATA}></tc-histogram></div>`,
  ).then((w) => w.querySelector("tc-histogram")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-hst__bar")];
const tipRows = (el: Element) => [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();

describe("binValues", () => {
  test("round edges; a value on an inner edge opens the next bin; the last edge is closed", () => {
    expect(binValues(VALUES, { binWidth: 2 })).toEqual({ edges: [0, 2, 4, 6, 8, 10], counts: [1, 5, 3, 0, 1], n: 10, outside: 0 });
    // 2.5 is a step of 2 widened to a round one; 0.1 + 0.2 must not drift off the edges
    const b = binValues([0.1, 0.2, 0.3, 0.4, 0.5, 0.6], { binWidth: 0.1 });
    expect(b.edges.every((e) => Number(e.toFixed(10)) === e)).toBe(true);
    expect(b.counts.reduce((a, c) => a + c, 0)).toBe(6);
  });

  test("a fixed domain keeps its ends and leaves out what lies outside", () => {
    const b = binValues([-3, 1, 2, 5, 9, 12], { domain: [0, 10], bins: 5 });
    expect(b.edges[0]).toBe(0);
    expect(b.edges.at(-1)).toBe(10);
    expect(b.n).toBe(4);
    expect(b.outside).toBe(2);
  });

  test("the automatic count stays within 5–40; equal values still make a bin; nothing makes none", () => {
    const many = Array.from({ length: 5000 }, (_, i) => Math.sin(i) * 100);
    const k = autoBinCount([...many].sort((a, b) => a - b), -100, 100);
    expect(k).toBeGreaterThanOrEqual(5);
    expect(k).toBeLessThanOrEqual(40);
    expect(autoBinCount([1, 1, 1, 1, 1, 1, 1, 1, 2], 1, 2)).toBeGreaterThanOrEqual(5);
    const same = binValues([7, 7, 7]);
    expect(same.counts.reduce((a, c) => a + c, 0)).toBe(3);
    expect(binValues([]).edges).toEqual([]);
  });
});

describe("tc-histogram", () => {
  chartBasics({ tag: "tc-histogram", ui: "hst", kind: "Histogram", make: make as never, marks: 5, firstRead: /^\[0, 2\): 1 \(10%\)/ });

  test("touching bars, the tallest in the accent; the tooltip has the range, count and share", async () => {
    const el = await drawn(await make({ still: true }));
    expect(bars(el).map((b) => b.style.fill)).toEqual(["var(--tc-plot-rest)", "var(--tc-plot-accent)", "var(--tc-plot-rest)", "var(--tc-plot-rest)", "var(--tc-plot-rest)"]);
    const [a, b] = bars(el).map((p) => p.getBBox());
    // Neighbours touch, but for the hairline between them
    expect(b.x - (a.x + a.width)).toBeLessThan(2);
    expect(b.height).toBeGreaterThan(a.height * 4);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("10 values in 5 bins, from 0 to 10; most in [2, 4) (5)");
    key(plot(el), "End");
    await settle();
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("[8, 10]");
    expect(tipRows(el)).toEqual(["Count 1", "Share 10%"]);
    expect(status(el)).toMatch(/^\[8, 10\]: 1 \(10%\), 5 of 5/);
  });

  test("bins and bin-width change the binning; unit follows the range; highlight picks a bin", async () => {
    const el = await drawn(await make({ still: true }));
    el.binWidth = undefined;
    el.bins = 2;
    el.unit = " h";
    el.highlight = 0;
    await settle();
    expect(bars(el).length).toBeLessThan(5);
    expect(bars(el)[0].style.fill).toBe("var(--tc-plot-accent)");
    key(plot(el), "ArrowRight");
    await settle();
    expect(status(el)).toMatch(/^\[0, \d+\) h:/);
  });

  test("cumulative: a running total that only grows, read with its share", async () => {
    const el = await drawn(await make({ still: true }));
    el.cumulative = true;
    await settle();
    const hs = bars(el).map((b) => b.getBBox().height);
    expect(hs.every((h, k) => !k || h >= hs[k - 1] - 0.5)).toBe(true);
    key(plot(el), "End");
    await settle();
    expect(tipRows(el)).toEqual(["Count 1", "Share 10%", "Running total 10 (100%)"]);
    expect(status(el)).toMatch(/^\[8, 10\]: 10 \(100%\)/);
  });

  test("markers draw the mean and median, named above the plot; density lays a curve over the bars, not with cumulative", async () => {
    const el = await drawn(await make({ still: true }));
    el.markers = "both";
    el.density = true;
    await settle();
    const names = [...el.querySelectorAll(".ui-hst__marker text")].map((t) => t.textContent);
    expect(names).toEqual(["Mean 3.7", "Median 3"]);
    // The names sit above the bars' tops
    const top = Math.min(...bars(el).flatMap((b) => (b.getBBox().height > 0 ? [b.getBBox().y] : [])));
    for (const t of el.querySelectorAll<SVGTextElement>(".ui-hst__marker text")) expect(t.getBBox().y + t.getBBox().height).toBeLessThanOrEqual(top + 1);
    expect(el.querySelector(".ui-hst__density")!.getAttribute("d")!.length).toBeGreaterThan(40);
    el.markers = "median";
    el.cumulative = true;
    await settle();
    expect(el.querySelectorAll(".ui-hst__marker").length).toBe(1);
    expect(el.querySelector(".ui-hst__density")).toBeNull();
  });

  test("the bars grow from the baseline, then a data change glides", async () => {
    const el = await drawn(await make());
    const h = () => bars(el)[1].getBBox().height;
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(40);
    await expect.poll(() => (el as unknown as { motion: { animating: boolean } }).motion.animating, { timeout: 4000 }).toBe(false);
    const before = h();
    el.data = VALUES.map((v) => ({ value: v === 3 ? 7 : v }));
    await settle();
    await expect.poll(h, { timeout: 4000 }).toBeLessThan(before * 0.7);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(Histogram, { title: "Turnaround", data: DATA, still: true, binWidth: 2, markers: "mean", view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcHistogram>("tc-histogram")!;
    expect(el.heading).toBe("Turnaround");
    expect(el.markers).toBe("mean");
    expect(el.view).toBe("table");
    expect([...el.querySelectorAll(".tc-chart__scroll thead th")].map((t) => t.textContent)).toEqual(["Range", "Count"]);
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(Histogram, { title: "Turnaround", data: DATA, still: true, binWidth: 2, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["[0, 2)"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
