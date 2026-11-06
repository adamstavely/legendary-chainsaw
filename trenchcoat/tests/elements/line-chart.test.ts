/*
 * <tc-line-chart> in real browsers: the shared chart behaviour (chart-kit), dates on x, the emphasised series and the
 * quiet rest, categorical inks, end labels, reference lines, dots, the pointer reading the nearest x, thinning long
 * series, the draw-in, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/line-chart";
import type { TcLineChart } from "../../src/elements/line-chart";
import { LineChart } from "../../src/elements/react/line-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05"];
const QUEUE = MONTHS.flatMap((x, k) => [
  { x, y: [42, 48, 61, 55, 70][k], series: "GPU" },
  { x, y: [12, 14, 13, 16, 18][k], series: "CPU" },
]);
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcLineChart>(
    html`<div style="width: 640px"><tc-line-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Median queue time" unit=" min" .series=${"series"} .data=${o.data ?? QUEUE}></tc-line-chart></div>`,
  ).then((w) => w.querySelector("tc-line-chart")!);
const lines = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".tc-xy__line")];

describe("tc-line-chart", () => {
  chartBasics({ tag: "tc-line-chart", ui: "lnc", kind: "Line chart", make: make as never, marks: 5, firstRead: /^Jan.*: GPU 42 min, CPU 12 min/ });

  test("the first series takes the accent and is drawn on top; the rest stay quiet; names at their ends", async () => {
    const el = await drawn(await make({ still: true }));
    // Drawn quiet first, emphasised last
    expect(lines(el).map((l) => l.style.stroke)).toEqual(["var(--tc-plot-line-rest)", "var(--tc-plot-accent)"]);
    expect(lines(el)[1].hasAttribute("data-hi")).toBe(true);
    expect([...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent)).toEqual(["GPU", "CPU"]);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toMatch(/^2 series \(GPU, CPU\), from Jan.* to May.*, 5 points$/);
  });

  test("highlight and categorical inks; dots when few points; reference lines", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "CPU";
    await settle();
    expect(lines(el)[1].style.stroke).toBe("var(--tc-plot-accent)");
    el.colorMode = "categorical";
    el.referenceLines = [{ y: 45, label: "Target 45 min" }];
    await settle();
    expect(lines(el).map((l) => l.style.stroke).sort()).toEqual(["var(--tc-plot-ink-1)", "var(--tc-plot-ink-2)"]);
    expect(el.querySelectorAll(".tc-xy__dot")).toHaveLength(10);
    expect(el.querySelectorAll(".tc-xy__ref")).toHaveLength(1);
    expect([...el.querySelectorAll(".tc-chart__tick")].some((t) => t.textContent === "Target 45 min")).toBe(true);
    el.dots = false;
    await settle();
    expect(el.querySelectorAll(".tc-xy__dot")).toHaveLength(0);
  });

  test("the pointer reads the nearest x across every series", async () => {
    const el = await drawn(await make({ still: true }));
    const svg = el.querySelector(".tc-chart__svg")!.getBoundingClientRect();
    plot(el).dispatchEvent(new PointerEvent("pointermove", { clientX: svg.right - 60, clientY: svg.top + 40, bubbles: true, pointerType: "mouse" }));
    await settle();
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((t) => t.textContent)).toEqual(["70 min", "18 min"]);
    expect(el.querySelectorAll(".tc-xy__point")).toHaveLength(2);
  });

  test("a long series is thinned to about two points per pixel", async () => {
    const data = Array.from({ length: 5000 }, (_, i) => ({ x: i, y: Math.sin(i / 50) * 10 + (i % 7) }));
    const el = await drawn(await make({ still: true, data }));
    el.series = undefined;
    el.maxPoints = 200;
    await settle();
    const d = lines(el)[0].getAttribute("d")!;
    expect((d.match(/[LC]/g) ?? []).length).toBeLessThanOrEqual(200);
    // The keyboard still reaches every x
    key(plot(el), "End");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toContain("5000 of 5000");
  });

  const shiftKey = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey: true, bubbles: true, cancelable: true }));

  test("brush select: Shift+arrows pick a range, Enter settles it with its change, high and low; Escape clears", async () => {
    const el = await drawn(await make({ still: true }));
    el.brush = "select";
    await settle();
    const ranges: unknown[] = [];
    el.addEventListener("tc-brush", (e) => ranges.push((e as CustomEvent).detail.range));
    const p = plot(el);
    key(p, "Home");
    shiftKey(p, "ArrowRight");
    shiftKey(p, "ArrowRight");
    await settle();
    expect(el.querySelector(".tc-brush__band")).not.toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/to Mar.*: \+45\.2%, high 61 min, low 42 min\. Press Enter to select\./);
    key(p, "Enter");
    await settle();
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toMatchObject({ from: 0, to: 2 });
    expect((ranges[0] as { toLabel: string }).toLabel).toMatch(/^Mar/);
    expect([...el.querySelectorAll(".tc-brush__tag-text")].map((t) => t.textContent)).toEqual(["High 61 min", "Low 42 min"]);
    key(p, "Escape");
    await settle();
    expect(el.querySelector(".tc-brush__band")).toBeNull();
    expect(ranges.at(-1)).toBeNull();
  });

  test("brush zoom: dragging narrows the chart to the range; Show all and Escape undo it", async () => {
    const el = await drawn(await make({ still: true }));
    el.brush = "zoom";
    await settle();
    const svg = el.querySelector(".tc-chart__svg")!.getBoundingClientRect();
    const p = plot(el);
    const at = (type: string, fx: number) =>
      p.dispatchEvent(new PointerEvent(type, { clientX: svg.left + svg.width * fx, clientY: svg.top + svg.height / 2, bubbles: true, pointerType: "mouse", button: 0, pointerId: 1 }));
    at("pointerdown", 0.15);
    at("pointermove", 0.4);
    at("pointermove", 0.6);
    at("pointerup", 0.6);
    await settle();
    const rows = () => el.querySelectorAll(".tc-sr-only tbody tr").length;
    expect(rows()).toBeLessThan(5);
    expect(rows()).toBeGreaterThan(1);
    el.querySelector<HTMLButtonElement>(".tc-chart__reset")!.click();
    await settle();
    expect(rows()).toBe(5);
    expect(el.querySelector(".tc-chart__reset")).toBeNull();
    // From the keyboard: pick, Enter zooms, Escape shows everything again
    key(p, "Home");
    shiftKey(p, "ArrowRight");
    key(p, "Enter");
    await settle();
    expect(rows()).toBe(2);
    key(p, "Escape");
    await settle();
    expect(rows()).toBe(5);
  });

  test("lower and upper shade a band round each series, inside the y range, and read with its values", async () => {
    const data = QUEUE.map((r) => ({ ...r, lo: r.y * 0.8, hi: r.y * 1.25 }));
    const el = await drawn(await make({ still: true, data }));
    expect(el.querySelector(".tc-xy__band")).toBeNull();
    el.lower = "lo";
    el.upper = "hi";
    await settle();
    const bands = [...el.querySelectorAll<SVGPathElement>(".tc-xy__band")];
    expect(bands).toHaveLength(2);
    expect(bands.filter((b) => b.hasAttribute("data-hi"))).toHaveLength(1);
    // Each in its series' ink, drawn under its line
    expect(bands.map((b) => b.style.fill).sort()).toEqual(["var(--tc-plot-accent)", "var(--tc-plot-line-rest)"]);
    expect(bands[0].nextElementSibling?.classList.contains("tc-xy__line")).toBe(true);
    // The axis grows to hold the band (GPU's top is 70 × 1.25): no edge goes above the plot's top
    const ys = bands.flatMap((b) => b.getAttribute("d")!.match(/-?\d+(\.\d+)?/g)!.map(Number).filter((_, i) => i % 2 === 1));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(9);
    expect(el.querySelector(".tc-sr-only table tbody tr")!.textContent).toMatch(/GPU 42 min \(33\.6 min–52\.5 min\)/);
  });

  test("a wide table's band belongs to the emphasised series; stacked areas have none", async () => {
    const wide = MONTHS.map((x, k) => ({ x, gpu: [42, 48, 61, 55, 70][k], cpu: [12, 14, 13, 16, 18][k], lo: 30, hi: 80 }));
    const el = await drawn(await make({ still: true, data: wide }));
    el.series = undefined;
    el.y = ["gpu", "cpu"];
    el.lower = "lo";
    el.upper = "hi";
    await settle();
    const bands = [...el.querySelectorAll(".tc-xy__band")];
    expect(bands).toHaveLength(1);
    expect(bands[0].hasAttribute("data-hi")).toBe(true);
  });

  test("React wrapper: props reach the element", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(LineChart, { title: "Queue", data: QUEUE, series: "series", still: true, curve: "linear" })));
    const el = await drawn(host.querySelector<TcLineChart>("tc-line-chart")!);
    expect(el.heading).toBe("Queue");
    expect(el.curve).toBe("linear");
    expect(lines(el)).toHaveLength(2);
    await act(async () => root.unmount());
    host.remove();
  });
});
