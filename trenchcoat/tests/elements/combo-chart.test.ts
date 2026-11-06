/*
 * <tc-combo-chart> in real browsers: the shared chart behaviour (chart-kit), the bar–line pair's inks, the right axis
 * picked from the ranges or fixed by line-axis, stacked bars, the legend that tells bars from lines and names their
 * axis, the keyboard reading every series, the table, the entrance, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/combo-chart";
import type { TcComboChart } from "../../src/elements/combo-chart";
import { ComboChart } from "../../src/elements/react/combo-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const MONTHS = [
  { month: "Jan", genomics: 182, proteomics: 96, hours: 41 },
  { month: "Feb", genomics: 196, proteomics: 104, hours: 44 },
  { month: "Mar", genomics: 210, proteomics: 118, hours: 47 },
  { month: "Apr", genomics: 188, proteomics: 122, hours: 43 },
];
const LABELS = { genomics: "Genomics", proteomics: "Proteomics", hours: "Turnaround" };
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[]; bars?: string[] } = {}) =>
  fixture<TcComboChart>(
    html`<div style="width: 640px"><tc-combo-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Samples and turnaround"
      .data=${o.data ?? MONTHS} .x=${"month"} .bars=${o.bars ?? ["genomics"]} .lines=${["hours"]} .seriesLabels=${LABELS} line-unit=" h"></tc-combo-chart></div>`,
  ).then((w) => w.querySelector("tc-combo-chart")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-cmb__bar")];
const legend = (el: Element) => [...el.querySelectorAll(".tc-chart__key")].map((k) => k.textContent!.replace(/\s+/g, " ").trim());
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();
/** The right axis's values: ticks written from their left edge, past the plot */
const rightTicks = (el: Element) => [...el.querySelectorAll(".tc-chart__tick[text-anchor='start']")].map((t) => Number(t.getAttribute("x")));

describe("tc-combo-chart", () => {
  chartBasics({ tag: "tc-combo-chart", ui: "cmb", kind: "Combo chart", make: make as never, marks: 4, firstRead: /^Jan: Genomics 182, Turnaround 41 h/ });

  test("one bar series and one line: bars quiet, the line in the accent, a dot at each category", async () => {
    const el = await drawn(await make({ still: true }));
    expect(bars(el).map((b) => b.style.fill)).toEqual(Array(4).fill("var(--tc-plot-rest)"));
    const line = el.querySelector<SVGPathElement>(".ui-cmb__line")!;
    expect(line.parentElement!.getAttribute("style")).toContain("--tc-plot-accent");
    expect(line.hasAttribute("data-hi")).toBe(true);
    expect(el.querySelectorAll(".ui-cmb__dot").length).toBe(4);
  });

  test("far-apart ranges put the line on a right axis, named in the legend; line-axis fixes it", async () => {
    const el = await drawn(await make({ still: true }));
    // Samples near 200 and hours near 40 are under 5× apart – but over 3×: a second axis
    expect(legend(el)).toEqual(["Genomics (left axis)", "Turnaround (right axis)"]);
    const w = Number(el.querySelector(".tc-chart__svg")!.getAttribute("viewBox")!.split(" ")[2]);
    expect(rightTicks(el).length).toBeGreaterThan(2);
    expect(rightTicks(el).every((x) => x > w * 0.85)).toBe(true);
    el.lineAxis = "left";
    await settle();
    expect(legend(el)).toEqual(["Genomics", "Turnaround"]);
    expect(rightTicks(el)).toEqual([]);
    // Close ranges share the left axis on their own
    el.lineAxis = undefined;
    el.data = MONTHS.map((d) => ({ ...d, hours: d.genomics * 0.8 }));
    await settle();
    expect(legend(el)).toEqual(["Genomics", "Turnaround"]);
  });

  test("several bar series: grouped side by side in the inks, or stacked; bars first in the legend", async () => {
    const el = await drawn(await make({ still: true, bars: ["genomics", "proteomics"] }));
    expect(bars(el).slice(0, 2).map((b) => b.style.fill)).toEqual(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)"]);
    expect(el.querySelector<HTMLElement>(".ui-cmb__stroke")!.style.background).toBe("var(--tc-plot-ink-3)");
    expect(legend(el).map((l) => l.replace(/ \(.*\)$/, ""))).toEqual(["Genomics", "Proteomics", "Turnaround"]);
    const side = bars(el).slice(0, 2).map((b) => b.getBBox());
    expect(side[1].x).toBeGreaterThan(side[0].x + side[0].width - 1);
    el.stacked = true;
    await settle();
    const stack = bars(el).slice(0, 2).map((b) => b.getBBox());
    expect(bars(el).every((b) => b.hasAttribute("data-stacked"))).toBe(true);
    expect(Math.round(stack[1].x)).toBe(Math.round(stack[0].x));
    expect(stack[1].y + stack[1].height).toBeLessThanOrEqual(stack[0].y + 1.5);
  });

  test("the keyboard reads every series at an x, each in its own format; the tooltip lists them", async () => {
    const el = await drawn(await make({ still: true, bars: ["genomics", "proteomics"] }));
    el.unit = " samples";
    await settle();
    plot(el).focus();
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    await settle();
    expect(status(el)).toBe("Feb: Genomics 196 samples, Proteomics 104 samples, Turnaround 44 h, 2 of 4");
    expect([...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Genomics 196 samples", "Proteomics 104 samples", "Turnaround 44 h"]);
    expect(el.querySelector(".tc-chart__focus")).not.toBeNull();
  });

  test("the table: one row per category with every series", async () => {
    const el = await drawn(await make({ still: true }));
    el.view = "table";
    await settle();
    const rows = [...el.querySelectorAll(".tc-chart__scroll tbody tr")].map((r) => [...r.children].map((c) => c.textContent!.trim()));
    expect(rows[0]).toEqual(["Jan", "Genomics 182, Turnaround 41 h"]);
    expect(rows).toHaveLength(4);
  });

  test("the entrance: bars grow from the baseline, then the line draws in", async () => {
    const el = await drawn(await make());
    const h = () => bars(el)[2].getBBox().height;
    const lineDrawn = () => !el.querySelector(".ui-cmb__line")!.hasAttribute("stroke-dasharray");
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(180);
    await expect.poll(lineDrawn, { timeout: 4000 }).toBe(true);
    el.data = MONTHS.map((d, i) => ({ ...d, genomics: i === 2 ? 60 : d.genomics }));
    await settle();
    await expect.poll(h, { timeout: 4000 }).toBeLessThan(100);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "640px";
    const root = createRoot(host);
    const clicks: string[] = [];
    const props = { title: "Labs", data: MONTHS, x: "month", bars: ["genomics"], lines: ["hours"], still: true, onMarkClick: (e: { label: string }) => clicks.push(e.label) };
    await act(async () => root.render(React.createElement(ComboChart, { ...props, view: "table" })));
    await settle();
    const el = host.querySelector<TcComboChart>("tc-combo-chart")!;
    expect(el.heading).toBe("Labs");
    expect(el.bars).toEqual(["genomics"]);
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(ComboChart, props)));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Jan"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
