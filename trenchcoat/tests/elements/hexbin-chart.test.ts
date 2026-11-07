/*
 * <tc-hexbin-chart> in real browsers: the hex binning itself (every point counted once, each in its nearest hexagon,
 * reading order), the shared chart behaviour (chart-kit), counts that add up to the points, the shade following the
 * count, the densest ringed, sum and mean, the keyboard in reading order, the pointer finding its hexagon, thousands
 * of points with the hexagons kept under 3,000, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/hexbin-chart";
import type { TcHexbinChart } from "../../src/elements/hexbin-chart";
import { hexbin, hexIndex, hexPath } from "../../src/elements/internal/chart/hexbin";
import type { ChartEvent } from "../../src/elements/internal/chart/types";
import { HexbinChart } from "../../src/elements/react/hexbin-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

/** A deterministic sequence in [0, 1) */
function seq(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Three tight clusters of 20, 8 and 3 points: three hexagons
const CLUSTERS = [
  ...Array.from({ length: 20 }, (_, i) => ({ x: 10 + (i % 3) * 0.01, y: 10 + (i % 2) * 0.01, value: 2 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: 50 + (i % 2) * 0.01, y: 30, value: 4 })),
  ...Array.from({ length: 3 }, () => ({ x: 90, y: 50, value: 6 })),
];

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcHexbinChart>(
    html`<div style="width: 600px"><tc-hexbin-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Calibration readings" x-label="Temperature" y-label="Drift" .data=${o.data ?? CLUSTERS}></tc-hexbin-chart></div>`,
  ).then((w) => w.querySelector("tc-hexbin-chart")!);
const hexes = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-hxb__hex")];
const events = (el: TcHexbinChart) => (el as unknown as { model: { events: ChartEvent[] } }).model.events;
const tipRows = (el: Element) => [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());
/** A hexagon path's centre: halfway between its top corner (the first point) and its bottom one (the fourth) */
const centre = (p: SVGPathElement) => {
  const pts = p.getAttribute("d")!.slice(1, -1).split("L").map((q) => q.split(",").map(Number));
  return [pts[0][0], (pts[0][1] + pts[3][1]) / 2];
};

describe("hexbin", () => {
  test("every point is counted once, in the hexagon whose centre is nearest; cells in reading order", () => {
    const rnd = seq(7);
    const n = 5000;
    const xs = Array.from({ length: n }, () => rnd() * 300);
    const ys = Array.from({ length: n }, () => rnd() * 200);
    const r = 9;
    const cells = hexbin(xs, ys, r);
    expect(cells.reduce((a, c) => a + c.count, 0)).toBe(n);
    // Reading order: by row, then column
    for (let k = 1; k < cells.length; k++) expect(cells[k].j > cells[k - 1].j || (cells[k].j === cells[k - 1].j && cells[k].i > cells[k - 1].i)).toBe(true);
    // The chosen centre is the nearest of all centres
    const centres = cells.map((c) => [c.x, c.y]);
    for (let p = 0; p < 300; p++) {
      const [i, j] = hexIndex(xs[p], ys[p], r);
      const own = cells.find((c) => c.i === i && c.j === j)!;
      const d = Math.hypot(own.x - xs[p], own.y - ys[p]);
      const best = Math.min(...centres.map(([cx, cy]) => Math.hypot(cx - xs[p], cy - ys[p])));
      expect(d).toBeCloseTo(best, 6);
    }
  });

  test("a hexagon's centre lands in itself; values are summed with how many had one; non-finite points are skipped", () => {
    const cells = hexbin([0, 0, 7.8, NaN], [0, 0.5, 13.5, 4], 9, [2, 3, NaN, 1]);
    expect(cells.map((c) => [c.i, c.j, c.count, c.sum, c.valued])).toEqual([
      [0, 0, 2, 5, 2],
      [0, 1, 1, 0, 0],
    ]);
    expect(hexPath(10, 0, 0)).toBe("M0,-10L8.66,-5L8.66,5L0,10L-8.66,5L-8.66,-5Z");
  });
});

describe("tc-hexbin-chart", () => {
  chartBasics({ tag: "tc-hexbin-chart", ui: "hxb", kind: "Hexbin chart", make: make as never, marks: 3, firstRead: /^x .+, y .+: 3,/ });

  test("the counts add up to the points; the shade follows the count; the densest is ringed; a ramp names the ends", async () => {
    const el = await drawn(await make({ still: true }));
    expect(hexes(el)).toHaveLength(3);
    expect(events(el).reduce((a, e) => a + (e.value ?? 0), 0)).toBe(31);
    const mix = (p: SVGPathElement) => Number(p.style.fill.match(/(\d+)%/)![1]);
    // Reading order is by row: top first, so the cluster at y 50 (3 points) comes first
    expect(events(el).map((e) => e.value)).toEqual([3, 8, 20]);
    expect(hexes(el).map(mix)).toEqual([18, 42, 100]);
    const [px, py] = centre(el.querySelector<SVGPathElement>(".ui-hxb__peak")!);
    const [hx, hy] = centre(hexes(el)[2]);
    expect(px).toBeCloseTo(hx, 1);
    expect(py).toBeCloseTo(hy, 1);
    expect(el.querySelector(".ui-hxb__legend")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Count 3 20");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toMatch(/^31 points in 3 hexagons; densest at x .+, y .+ \(20\)$/);
  });

  test("aggregate: the sum or the mean of the values sets the shade, and is read with the count", async () => {
    const el = await drawn(await make({ still: true }));
    el.aggregate = "sum";
    await settle();
    expect(events(el).map((e) => e.value)).toEqual([18, 32, 40]);
    expect(el.querySelector(".ui-hxb__legend")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Sum 18 40");
    el.aggregate = "mean";
    await settle();
    expect(events(el).map((e) => e.value)).toEqual([6, 4, 2]);
    // The highest mean is now the darkest, though it has the fewest points
    expect(hexes(el)[0].style.fill).toMatch(/ 100%/);
    plot(el).focus();
    key(plot(el), "ArrowRight");
    await settle();
    expect(tipRows(el)).toEqual([expect.stringMatching(/^Drift /), "Count 3", "Mean 6"]);
    el.view = "table";
    await settle();
    expect([...el.querySelectorAll(".tc-chart__scroll thead th")].map((t) => t.textContent)).toEqual(["Hexagon", "Mean"]);
  });

  test("the keyboard goes in reading order; the pointer finds the hexagon under it", async () => {
    const el = await drawn(await make({ still: true }));
    const p = plot(el);
    p.focus();
    key(p, "ArrowRight");
    key(p, "ArrowRight");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/: 8, 2 of 3/);
    key(p, "Escape");
    await settle();
    // Pointing at the densest hexagon's centre picks it
    const svgEl = el.querySelector<SVGSVGElement>(".tc-chart__svg")!;
    const box = svgEl.getBoundingClientRect();
    const [cx, cy] = centre(hexes(el)[2]);
    p.dispatchEvent(new PointerEvent("pointermove", { clientX: box.left + cx, clientY: box.top + cy, bubbles: true, pointerType: "mouse" }));
    await settle();
    expect(tipRows(el)).toContain("Count 20");
  });

  test("thousands of points: binned in one pass, the hexagons kept under 3,000 however small the radius", async () => {
    const rnd = seq(3);
    const data = Array.from({ length: 50000 }, () => ({ x: rnd() * 100, y: rnd() * 100 }));
    const el = await drawn(await make({ still: true, data }));
    expect(events(el).reduce((a, e) => a + (e.value ?? 0), 0)).toBe(50000);
    el.radius = 2;
    await settle();
    expect(hexes(el).length).toBeLessThanOrEqual(3000);
    expect(events(el).reduce((a, e) => a + (e.value ?? 0), 0)).toBe(50000);
    // The table shows the first 60 and says how many more
    expect(el.querySelector(".tc-sr-only table tbody tr:last-child")!.textContent).toMatch(/more/);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(HexbinChart, { title: "Readings", data: CLUSTERS, still: true, aggregate: "mean", radius: 14, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcHexbinChart>("tc-hexbin-chart")!;
    expect(el.heading).toBe("Readings");
    expect(el.aggregate).toBe("mean");
    expect(el.radius).toBe(14);
    expect(el.view).toBe("table");
    expect([...el.querySelectorAll(".tc-chart__scroll thead th")].map((t) => t.textContent)).toEqual(["Hexagon", "Mean"]);
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(HexbinChart, { title: "Readings", data: CLUSTERS, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toHaveLength(1);
    expect(clicks[0]).toMatch(/^x .+, y .+$/);
    await act(async () => root.unmount());
    host.remove();
  });
});
