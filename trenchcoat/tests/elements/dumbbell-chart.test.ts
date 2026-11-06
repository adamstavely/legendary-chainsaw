/*
 * <tc-dumbbell-chart> in real browsers: the shared chart behaviour (chart-kit), the rows' order, emphasis and values,
 * the tooltip's difference, the legend in the header or the plot, sort and zero, the entrance and a data change, and
 * the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/dumbbell-chart";
import type { TcDumbbellChart } from "../../src/elements/dumbbell-chart";
import { DumbbellChart } from "../../src/elements/react/dumbbell-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const LABS = [
  { label: "Genomics", start: 62, end: 81 },
  { label: "Imaging", start: 74, end: 79 },
  { label: "Neuro", start: 69, end: 84 },
  { label: "Field ecology", start: 81, end: 78 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcDumbbellChart>(
    html`<div style="width: 600px"><tc-dumbbell-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Audit score" .data=${o.data ?? LABS}></tc-dumbbell-chart></div>`,
  ).then((w) => w.querySelector("tc-dumbbell-chart")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGLineElement>(".ui-dmb__bar")];
const values = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);
const rowsRead = (el: Element) => [...el.querySelectorAll(".tc-sr-only tbody th")].map((t) => t.textContent);

describe("tc-dumbbell-chart", () => {
  chartBasics({ tag: "tc-dumbbell-chart", ui: "dmb", kind: "Dumbbell chart", make: make as never, marks: 4, firstRead: /^Neuro: Before 69 → After 84/ });

  test("rows by the second value; the biggest move takes the accent; bars from start to end", async () => {
    const el = await drawn(await make({ still: true }));
    expect(rowsRead(el)).toEqual(["Neuro", "Genomics", "Imaging", "Field ecology"]);
    expect(values(el)).toEqual(["84", "81", "79", "78"]);
    // Genomics moved most (+19)
    expect(bars(el).map((b) => b.hasAttribute("data-hi"))).toEqual([false, true, false, false]);
    expect(bars(el)[1].style.stroke).toBe("var(--tc-plot-accent)");
    const b = bars(el)[3];
    // A fall: the bar runs leftwards and its value sits left of the end dot
    expect(Number(b.getAttribute("x2"))).toBeLessThan(Number(b.getAttribute("x1")));
    expect(el.querySelectorAll(".tc-chart__value")[3].getAttribute("text-anchor")).toBe("end");
  });

  test("the tooltip has both values and the difference; names and unit come from the page", async () => {
    const el = await drawn(await make({ still: true }));
    el.startLabel = "Spring";
    el.endLabel = "Autumn";
    el.unit = " pts";
    await settle();
    key(plot(el), "End");
    await settle();
    const tip = [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());
    expect(tip).toEqual(["Spring 81 pts", "Autumn 78 pts", "Difference −3 pts"]);
    expect([...el.querySelectorAll(".tc-head .tc-chart__key")].map((k) => k.textContent!.trim())).toEqual(["Spring", "Autumn"]);
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/Field ecology: Spring 81 pts → Autumn 78 pts, 4 of 4/);
  });

  test("bare draws the legend above the rows; sort=false keeps the order; zero starts the axis at 0", async () => {
    const el = await drawn(await make({ still: true, bare: true }));
    expect(el.querySelector(".tc-chart__legend")).toBeNull();
    expect([...el.querySelectorAll(".tc-chart__svg .tc-chart__tick")].map((t) => t.textContent)).toEqual(expect.arrayContaining(["Before", "After"]));
    el.setAttribute("sort", "false");
    el.zero = true;
    await settle();
    expect(rowsRead(el)).toEqual(["Genomics", "Imaging", "Neuro", "Field ecology"]);
    expect([...el.querySelectorAll(".tc-chart__svg .tc-chart__tick")].map((t) => t.textContent)).toContain("0");
  });

  test("the entrance stretches the bars once on screen; a data change glides", async () => {
    const el = await drawn(await make());
    const len = (k: number) => Math.abs(Number(bars(el)[k].getAttribute("x2")) - Number(bars(el)[k].getAttribute("x1")));
    await expect.poll(() => len(1), { timeout: 4000 }).toBeGreaterThan(100);
    const before = len(1);
    el.data = LABS.map((d) => (d.label === "Genomics" ? { ...d, end: 64 } : d));
    await settle();
    expect(rowsRead(el).at(-1)).toBe("Genomics");
    await expect.poll(() => len(3), { timeout: 4000 }).toBeLessThan(before / 3);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(DumbbellChart, { title: "Labs", data: LABS, still: true, startLabel: "Target", view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcDumbbellChart>("tc-dumbbell-chart")!;
    expect(el.heading).toBe("Labs");
    expect(el.startLabel).toBe("Target");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(DumbbellChart, { title: "Labs", data: LABS, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Neuro"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
