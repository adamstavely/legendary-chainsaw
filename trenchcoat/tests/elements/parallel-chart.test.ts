/*
 * <tc-parallel-chart> in real browsers: the shared chart behaviour (chart-kit), the axes found from the data and
 * their ranges, the emphasised row and its name, invert, a missing value's gap, renamed axes and formats, the
 * pointer's nearest line, the canvas above the threshold, the entrance, data changes and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/parallel-chart";
import type { TcParallelChart } from "../../src/elements/parallel-chart";
import { ParallelChart } from "../../src/elements/react/parallel-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const INSTRUMENTS = [
  { label: "Cryo-EM", uptime: 97, cost: 41, queue: 6 },
  { label: "Mass spec", uptime: 88, cost: 18, queue: 14 },
  { label: "Sequencer", uptime: 92, cost: 26, queue: 9 },
  { label: "Confocal", uptime: 79, cost: 12, queue: 3 },
  { label: "NMR", uptime: 84, cost: 33, queue: 11 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcParallelChart>(
    html`<div style="width: 600px"><tc-parallel-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Instruments" .data=${o.data ?? INSTRUMENTS}></tc-parallel-chart></div>`,
  ).then((w) => w.querySelector("tc-parallel-chart")!);
const lines = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-pcc__line")];
const ticks = (el: Element) => [...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent);
type Inside = { lines: { i: number; ys: number[] }[]; axX: (j: number) => number };

describe("tc-parallel-chart", () => {
  chartBasics({ tag: "tc-parallel-chart", ui: "pcc", kind: "Parallel coordinates", make: make as never, marks: 5, firstRead: /^Cryo-EM: uptime 97, cost 41, queue 6/ });

  test("an axis per numeric field with its range at the ends; the first row emphasised, on top and named", async () => {
    const el = await drawn(await make({ still: true }));
    expect(el.querySelectorAll(".ui-pcc__axis")).toHaveLength(3);
    // Each axis: its name, then the top and bottom of its range
    const t = ticks(el);
    expect([t[0], t[3], t[6]]).toEqual(["uptime", "cost", "queue"]);
    expect(Number(t[1])).toBeGreaterThanOrEqual(97);
    expect(Number(t[2])).toBeLessThanOrEqual(79);
    const ls = lines(el);
    expect(ls).toHaveLength(5);
    expect(ls.at(-1)!.hasAttribute("data-hi")).toBe(true);
    expect(ls.filter((l) => l.hasAttribute("data-hi"))).toHaveLength(1);
    expect([...el.querySelectorAll(".tc-chart__value[data-strong]")].map((v) => v.textContent)).toEqual(["Cryo-EM"]);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("5 rows, 3 axes (uptime, cost, queue)");
  });

  test("invert turns an axis upside down; a missing value breaks the line there", async () => {
    const el = await drawn(await make({ still: true }));
    const ends = () => ticks(el).slice(7, 9).map(Number);
    const [top, bottom] = ends();
    expect(top).toBeGreaterThan(bottom);
    el.invert = ["queue"];
    await settle();
    expect(ends()).toEqual([bottom, top]);
    el.data = INSTRUMENTS.map((d, i) => (i === 2 ? { ...d, cost: null } : d));
    el.dimensions = ["uptime", "cost", "queue"];
    await settle();
    const gapped = lines(el).find((l) => (l.getAttribute("d")!.match(/M/g) ?? []).length === 2);
    expect(gapped).toBeDefined();
    expect(gapped!.getAttribute("d")).not.toContain("L");
  });

  test("dimensions, dimensionLabels, formats and highlight", async () => {
    const el = await drawn(await make({ still: true }));
    el.dimensions = ["cost", "uptime"];
    el.dimensionLabels = { cost: "Cost per hour", uptime: "Uptime" };
    el.formats = { cost: (v: number) => `$${v}` };
    el.unit = "";
    el.highlight = "Mass spec";
    await settle();
    expect([ticks(el)[0], ticks(el)[3]]).toEqual(["Cost per hour", "Uptime"]);
    expect([...el.querySelectorAll(".tc-chart__value[data-strong]")].map((v) => v.textContent)).toEqual(["Mass spec"]);
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Mass spec: Cost per hour \$18, Uptime 88, 2 of 5/);
    expect([...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Cost per hour $18", "Uptime 88"]);
  });

  test("the pointer picks the nearest line within 10px, and a click reports it", async () => {
    const el = await drawn(await make({ still: true }));
    const clicks: string[] = [];
    el.addEventListener("tc-mark-click", (e) => clicks.push((e as CustomEvent).detail.event.label));
    const inside = el as unknown as Inside;
    const svgBox = el.querySelector(".tc-chart__svg")!.getBoundingClientRect();
    // Halfway between the first two axes, on Confocal's line
    const l = inside.lines[3];
    const x = (inside.axX(0) + inside.axX(1)) / 2;
    const y = (l.ys[0] + l.ys[1]) / 2;
    plot(el).dispatchEvent(new PointerEvent("pointermove", { clientX: svgBox.left + x, clientY: svgBox.top + y + 3, bubbles: true }));
    await settle();
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Confocal");
    expect(el.querySelector(".ui-pcc__line[data-active]")).not.toBeNull();
    el.querySelector(".tc-chart__hit")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clicks).toEqual(["Confocal"]);
    plot(el).dispatchEvent(new PointerEvent("pointermove", { clientX: svgBox.left + x, clientY: svgBox.top + 2, bubbles: true }));
    await settle();
    expect(el.querySelector(".tc-chart__tip")).toBeNull();
  });

  test("above canvas-threshold the lines are painted on a canvas; the active one stays in the SVG", async () => {
    const el = await drawn(await make({ still: true }));
    el.canvasThreshold = 3;
    await settle();
    expect(lines(el)).toHaveLength(0);
    const cv = el.querySelector<HTMLCanvasElement>(".tc-chart__canvas")!;
    const k = cv.width / plot(el).getBoundingClientRect().width;
    const inside = el as unknown as Inside;
    const ctx = cv.getContext("2d")!;
    // On the emphasised line where it meets the first axis, and in the empty corner
    const hi = inside.lines[0];
    expect(ctx.getImageData(Math.round(inside.axX(0) * k), Math.round(hi.ys[0] * k), 1, 1).data[3]).toBeGreaterThan(200);
    expect(ctx.getImageData(1, 1, 1, 1).data[3]).toBe(0);
    key(plot(el), "End");
    await settle();
    expect(lines(el)).toHaveLength(1);
    expect(lines(el)[0].hasAttribute("data-active")).toBe(true);
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("NMR");
  });

  test("the entrance draws the lines across once on screen; a data change glides them", async () => {
    const el = await drawn(await make());
    await expect.poll(() => lines(el).length).toBe(5);
    await expect.poll(() => lines(el).every((l) => !l.hasAttribute("stroke-dasharray")), { timeout: 5000 }).toBe(true);
    const hiLine = () => el.querySelector(".ui-pcc__line[data-hi]")!.getAttribute("d")!;
    const before = hiLine();
    el.data = INSTRUMENTS.map((d, i) => (i === 0 ? { ...d, cost: 14 } : d));
    await settle();
    await expect.poll(() => hiLine() !== before, { timeout: 4000 }).toBe(true);
    await expect.poll(() => el.querySelector("[stroke-dasharray]") === null, { timeout: 4000 }).toBe(true);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(ParallelChart, { title: "Instruments", data: INSTRUMENTS, still: true, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcParallelChart>("tc-parallel-chart")!;
    expect(el.heading).toBe("Instruments");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(ParallelChart, { title: "Instruments", data: INSTRUMENTS, still: true, invert: ["queue"], onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    expect(el.invert).toEqual(["queue"]);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Cryo-EM"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
