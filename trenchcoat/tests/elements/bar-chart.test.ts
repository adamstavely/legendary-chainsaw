/*
 * <tc-bar-chart> in real browsers: the shared chart behaviour (chart-kit), one series' emphasis and values, the
 * highlight, several series grouped, stacked and to 100% with their legend, lying-down bars, sort, the entrance,
 * data changes, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/bar-chart";
import type { TcBarChart } from "../../src/elements/bar-chart";
import { BarChart } from "../../src/elements/react/bar-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const LABS = [
  { x: "Genomics", y: 182 },
  { x: "Imaging", y: 96 },
  { x: "Proteomics", y: 124 },
  { x: "Neuro", y: 141 },
];
const RUNS = [
  { day: "Mon", instrument: "NovaSeq", runs: 14 },
  { day: "Mon", instrument: "MiSeq", runs: 6 },
  { day: "Tue", instrument: "NovaSeq", runs: 10 },
  { day: "Tue", instrument: "MiSeq", runs: 10 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcBarChart>(
    html`<div style="width: 600px"><tc-bar-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Samples processed" .data=${o.data ?? LABS}></tc-bar-chart></div>`,
  ).then((w) => w.querySelector("tc-bar-chart")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-brc__bar")];
const values = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);

describe("tc-bar-chart", () => {
  chartBasics({ tag: "tc-bar-chart", ui: "brc", kind: "Bar chart", make: make as never, marks: 4, firstRead: /^Genomics: 182/ });

  test("one series: the highest bar takes the accent, the rest the quiet ink; values at their ends", async () => {
    const el = await drawn(await make({ still: true }));
    expect(bars(el).map((b) => b.style.fill)).toEqual(["var(--tc-plot-accent)", "var(--tc-plot-rest)", "var(--tc-plot-rest)", "var(--tc-plot-rest)"]);
    expect(values(el)).toEqual(["182", "96", "124", "141"]);
    expect(el.querySelector('.tc-chart__value[data-strong]')!.textContent).toBe("182");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Genomics 182, Imaging 96, Proteomics 124, Neuro 141");
  });

  test("highlight picks another; unit and format write the values", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Imaging";
    el.unit = " samples";
    el.format = "compact";
    await settle();
    expect(bars(el)[1].style.fill).toBe("var(--tc-plot-accent)");
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelector(".tc-chart__tip-value")!.textContent).toBe("182 samples");
  });

  test("several series: grouped, stacked and to 100%, each in its ink, named in the legend", async () => {
    const el = await drawn(await make({ still: true, data: RUNS }));
    el.x = "day";
    el.y = "runs";
    el.series = "instrument";
    await settle();
    expect(bars(el).map((b) => b.style.fill)).toEqual(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)", "var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)"]);
    expect([...el.querySelectorAll(".tc-chart__key")].map((k) => k.textContent!.trim())).toEqual(["NovaSeq", "MiSeq"]);
    el.layout = "stacked";
    await settle();
    expect(bars(el).every((b) => b.hasAttribute("data-stacked"))).toBe(true);
    el.layout = "percent";
    await settle();
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/Mon NovaSeq: 14 \(70%\)/);
  });

  test("horizontal bars and sort", async () => {
    const el = await drawn(await make({ still: true }));
    el.orientation = "horizontal";
    el.sort = true;
    await settle();
    // Lying down, sorted from the largest: the first bar is the widest and at the top
    const boxes = bars(el).map((b) => b.getBBox());
    expect(boxes[0].width).toBeGreaterThan(boxes[1].width);
    expect(boxes[0].y).toBeLessThan(boxes[1].y);
    expect([...el.querySelectorAll(".tc-sr-only tbody th")].map((t) => t.textContent)).toEqual(["Genomics", "Neuro", "Proteomics", "Imaging"]);
  });

  test("the entrance: bars grow from the baseline once on screen, then a data change glides", async () => {
    const el = await drawn(await make());
    const h = () => bars(el)[0].getBBox().height;
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(100);
    // Genomics falls below the rest, which keep the axis where it was
    el.data = LABS.map((d, i) => ({ ...d, y: i === 0 ? 40 : d.y }));
    await settle();
    await expect.poll(h, { timeout: 4000 }).toBeLessThan(80);
  });

  test("replay() plays the entrance again from the baseline", async () => {
    const el = await drawn(await make());
    const h = () => bars(el)[0].getBBox().height;
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(100);
    el.replay();
    await settle();
    expect(h()).toBeLessThan(100);
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(100);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(BarChart, { title: "Labs", data: LABS, still: true, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcBarChart>("tc-bar-chart")!;
    expect(el.heading).toBe("Labs");
    expect(el.view).toBe("table");
    // Controlled: the Table button asks, the parent keeps "table"
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(BarChart, { title: "Labs", data: LABS, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
