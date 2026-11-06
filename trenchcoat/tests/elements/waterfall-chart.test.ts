/*
 * <tc-waterfall-chart> in real browsers: the shared chart behaviour (chart-kit), the steps' levels and inks, the
 * emphasis, the end total and connectors, a data change, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/waterfall-chart";
import type { TcWaterfallChart } from "../../src/elements/waterfall-chart";
import { WaterfallChart } from "../../src/elements/react/waterfall-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const BUDGET = [
  { label: "Awarded", value: 480 },
  { label: "Staff", value: -190 },
  { label: "Supplement", value: 60 },
  { label: "Equipment", value: -120 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcWaterfallChart>(
    html`<div style="width: 600px"><tc-waterfall-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Grant budget" .data=${o.data ?? BUDGET}></tc-waterfall-chart></div>`,
  ).then((w) => w.querySelector("tc-waterfall-chart")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-wfl__bar")];
const values = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);

describe("tc-waterfall-chart", () => {
  chartBasics({ tag: "tc-waterfall-chart", ui: "wfl", kind: "Waterfall chart", make: make as never, marks: 4, firstRead: /^Awarded: 480/ });

  test("each step starts where the last ended: the first a total, then rises and falls, each in its ink", async () => {
    const el = await drawn(await make({ still: true }));
    expect(bars(el).map((b) => b.dataset.kind)).toEqual(["total", "down", "up", "down"]);
    const box = bars(el).map((b) => b.getBBox());
    // Staff hangs from Awarded's top; Supplement rises from Staff's bottom; Equipment falls from Supplement's top
    expect(box[1].y).toBeCloseTo(box[0].y, 0);
    expect(box[2].y + box[2].height).toBeCloseTo(box[1].y + box[1].height, 0);
    expect(box[3].y).toBeCloseTo(box[2].y, 0);
    expect(getComputedStyle(bars(el)[1]).fill).toBe(getComputedStyle(bars(el)[3]).fill);
    expect(getComputedStyle(bars(el)[1]).fill).not.toBe(getComputedStyle(bars(el)[0]).fill);
    expect(values(el)).toEqual(["480", "−190", "+60", "−120"]);
    expect(el.querySelectorAll(".ui-wfl__link")).toHaveLength(3);
    expect([...el.querySelectorAll(".tc-chart__key")].map((k) => k.textContent!.trim())).toEqual(["Increase", "Decrease", "Total"]);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Awarded 480, Staff −190, Supplement +60, Equipment −120");
  });

  test("nothing emphasised by default; highlight gives steps the accent; the tooltip shows the change and the level", async () => {
    const el = await drawn(await make({ still: true }));
    expect(bars(el).some((b) => b.hasAttribute("data-hi"))).toBe(false);
    el.highlight = "max";
    await settle();
    expect(bars(el).map((b) => b.hasAttribute("data-hi"))).toEqual([false, false, true, false]);
    el.highlight = "Staff";
    el.unit = "k";
    await settle();
    expect(bars(el).map((b) => b.hasAttribute("data-hi"))).toEqual([false, true, false, false]);
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    await settle();
    expect([...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Decrease −190k", "Cumulative 290k"]);
  });

  test("end-total adds the running level; delta-start, a total row and hide-connectors", async () => {
    const el = await drawn(await make({ still: true }));
    el.endTotal = "Remaining";
    await settle();
    expect(bars(el).at(-1)!.dataset.kind).toBe("total");
    expect(values(el).at(-1)).toBe("230");
    expect(el.querySelector(".tc-sr-only tbody tr:last-child th")!.textContent).toBe("Remaining");
    el.setAttribute("end-total", "");
    await settle();
    expect(el.querySelector(".tc-sr-only tbody tr:last-child th")!.textContent).toBe("Total");
    el.deltaStart = true;
    el.hideConnectors = true;
    el.data = [...BUDGET, { label: "Audit", type: "total" }];
    await settle();
    expect(bars(el).map((b) => b.dataset.kind)).toEqual(["up", "down", "up", "down", "total", "total"]);
    expect(values(el).slice(-2)).toEqual(["230", "230"]);
    expect(el.querySelectorAll(".ui-wfl__link")).toHaveLength(0);
  });

  test("the entrance drops the steps in once on screen, then a data change glides", async () => {
    const el = await drawn(await make());
    const h = () => bars(el)[1].getBBox().height;
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(40);
    const before = h();
    el.data = BUDGET.map((d, i) => (i === 1 ? { ...d, value: -40 } : d));
    await settle();
    await expect.poll(h, { timeout: 4000 }).toBeLessThan(before / 2);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(WaterfallChart, { title: "Budget", data: BUDGET, still: true, endTotal: true, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcWaterfallChart>("tc-waterfall-chart")!;
    expect(el.heading).toBe("Budget");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(WaterfallChart, { title: "Budget", data: BUDGET, still: true, endTotal: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "End");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Total"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
