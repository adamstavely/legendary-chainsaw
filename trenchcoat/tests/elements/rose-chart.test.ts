/*
 * <tc-rose-chart> in real browsers: the shared chart behaviour (chart-kit), equal-angle wedges whose area (not radius)
 * follows the value, the largest emphasised, round-value rings with their numbers on chips, wedges stacked by series
 * with a legend and per-series tooltip rows, a hole in the middle, the start angle, names outside the rim, a data
 * change, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/rose-chart";
import type { TcRoseChart } from "../../src/elements/rose-chart";
import { RoseChart } from "../../src/elements/react/rose-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const MONTHS = [
  { label: "Jan", value: 16 },
  { label: "Feb", value: 4 },
  { label: "Mar", value: 36 },
  { label: "Apr", value: 9 },
  { label: "May", value: 25 },
  { label: "Jun", value: 1 },
];
const SPLIT = MONTHS.flatMap((m) => [
  { label: m.label, series: "Council", value: m.value },
  { label: m.label, series: "Industry", value: m.value / 2 },
]);

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcRoseChart>(
    html`<div style="width: 600px"><tc-rose-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Grant applications" .data=${o.data ?? MONTHS}></tc-rose-chart></div>`,
  ).then((w) => w.querySelector("tc-rose-chart")!);
const wedges = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-rse__wedge")];
/** A wedge path's outer radius: the first arc's rx */
const outer = (p: SVGPathElement) => Number(p.getAttribute("d")!.match(/A([\d.]+),/)![1]);
const tipRows = (el: Element) => [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());

describe("tc-rose-chart", () => {
  chartBasics({ tag: "tc-rose-chart", ui: "rse", kind: "Rose chart", make: make as never, marks: 6, firstRead: /^Jan: 16/ });

  test("equal-angle wedges whose area follows the value: the radius goes with its square root; the largest in the accent", async () => {
    const el = await drawn(await make({ still: true }));
    const ws = wedges(el);
    expect(ws).toHaveLength(6);
    const r = ws.map(outer);
    // Mar (36) against Jan (16): radii 6 : 4, so areas 36 : 16
    expect(r[2] / r[0]).toBeCloseTo(Math.sqrt(36 / 16), 2);
    expect(r[4] / r[1]).toBeCloseTo(Math.sqrt(25 / 4), 2);
    expect(ws.filter((w) => w.hasAttribute("data-hi")).map((w) => ws.indexOf(w))).toEqual([2]);
    expect(ws[2].style.fill).toBe("var(--tc-plot-accent)");
    expect(ws[0].style.fill).toBe("var(--tc-plot-rest)");
    // Every wedge starts at the centre (no hole) and spans a sixth of the circle
    const starts = new Set(ws.map((w) => w.getAttribute("d")!.match(/^M[\d.]+,[\d.]+L/)?.[0]));
    expect(starts.size).toBe(1);
    expect([...starts][0]).toBeTruthy();
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("6 wedges; largest Mar (36)");
  });

  test("rings at round values under the wedges, their numbers on chips where the first wedge starts; names outside the rim", async () => {
    const el = await drawn(await make({ still: true }));
    const rings = [...el.querySelectorAll(".ui-rse__grid circle")];
    expect(rings.length).toBeGreaterThanOrEqual(2);
    const ticks = [...el.querySelectorAll(".ui-rse__ticks .tc-chart__tick")].map((t) => t.textContent);
    expect(ticks.length).toBe(rings.length);
    expect(el.querySelectorAll(".ui-rse__chip")).toHaveLength(rings.length);
    // The rings come before the wedges, so they sit under them
    const order = [...el.querySelectorAll(".ui-rse__grid, .ui-rse__wedge")];
    expect(order[0].classList.contains("ui-rse__grid")).toBe(true);
    const names = [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);
    expect(names).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
    // The emphasised one in bold
    expect([...el.querySelectorAll(".tc-chart__value[data-strong]")].map((t) => t.textContent)).toEqual(["Mar"]);
  });

  test("series stack a ring per series in each wedge, in the chart inks, with a legend and every part in the tooltip", async () => {
    const el = await drawn(await make({ still: true, data: SPLIT }));
    el.series = "series";
    await settle();
    const ws = wedges(el);
    expect(ws).toHaveLength(12);
    expect(ws.slice(0, 2).map((w) => w.style.fill)).toEqual(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)"]);
    // Nothing emphasised when stacked
    expect(ws.some((w) => w.hasAttribute("data-hi"))).toBe(false);
    // The outer ring reaches the total's radius: Jan's total is 24 against Mar's 54
    const totals = [ws[1], ws[5]].map(outer);
    expect(totals[1] / totals[0]).toBeCloseTo(Math.sqrt(54 / 24), 2);
    expect([...el.querySelectorAll(".tc-chart__legend .tc-chart__key")].map((k) => k.textContent!.trim())).toEqual(["Council", "Industry"]);
    plot(el).focus();
    key(plot(el), "ArrowRight");
    await settle();
    expect(tipRows(el)).toEqual(["Council 16", "Industry 8", "Total 24"]);
    expect(el.querySelector(".tc-sr-only table tbody tr")!.textContent).toMatch(/Council 16, Industry 8 \(total 24\)/);
  });

  test("inner-radius leaves a hole; start-angle turns the first wedge", async () => {
    const el = await drawn(await make({ still: true }));
    const before = wedges(el)[0].getAttribute("d")!;
    el.innerRadius = 0.3;
    await settle();
    const holed = wedges(el)[0].getAttribute("d")!;
    // No longer from the centre: it starts on the rim
    expect(holed).not.toMatch(/^M[\d.]+,[\d.]+L/);
    // Two arcs: the rim and the hole
    expect(holed.match(/A/g)).toHaveLength(2);
    el.innerRadius = 0;
    el.startAngle = 90;
    await settle();
    expect(wedges(el)[0].getAttribute("d")).not.toBe(before);
  });

  test("the entrance grows the wedges from the centre, then a data change glides them", async () => {
    const el = await make();
    el.onScreen = true;
    await drawn(el);
    el.replay();
    await settle();
    await expect.poll(() => outer(wedges(el)[2])).toBeGreaterThan(20);
    el.still = true;
    el.data = MONTHS.map((m) => ({ ...m, value: m.label === "Jun" ? 49 : m.value }));
    await settle();
    expect(wedges(el).filter((w) => w.hasAttribute("data-hi")).map((w) => wedges(el).indexOf(w))).toEqual([5]);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(RoseChart, { title: "Applications", data: SPLIT, series: "series", still: true, innerRadius: 0.2, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcRoseChart>("tc-rose-chart")!;
    expect(el.heading).toBe("Applications");
    expect(el.innerRadius).toBe(0.2);
    expect(el.view).toBe("table");
    expect([...el.querySelectorAll(".tc-chart__scroll thead th")].map((t) => t.textContent)).toEqual(["Wedge", "Value"]);
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(RoseChart, { title: "Applications", data: MONTHS, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Jan"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
