/*
 * <tc-calendar-heatmap> in real browsers: the shared chart behaviour (chart-kit), the grid of weeks and its shades,
 * the busiest day outlined and the legend, ← → by the week, the pointer, a year per row and the week start, the
 * canvas above the threshold, the entrance, data changes and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/calendar-heatmap";
import type { TcCalendarHeatmap } from "../../src/elements/calendar-heatmap";
import { CalendarHeatmap } from "../../src/elements/react/calendar-heatmap";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

// Two weeks of samples logged, from Monday 1 June 2026; the 11th is the busiest
const VALUES = [3, 5, 0, 8, 12, 2, 0, 6, 9, 4, 15, 7, 1, 0];
const DAYS = VALUES.map((value, i) => ({ date: `2026-06-${String(i + 1).padStart(2, "0")}`, value }));
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcCalendarHeatmap>(
    html`<div style="width: 600px"><tc-calendar-heatmap look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Samples logged" .data=${o.data ?? DAYS}></tc-calendar-heatmap></div>`,
  ).then((w) => w.querySelector("tc-calendar-heatmap")!);
const cells = (el: Element) => [...el.querySelectorAll<SVGRectElement>(".ui-clh__day")];
const fillOf = (r: Element) => r.getAttribute("style")!.replace(/^fill: /, "");
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();
const mix = (pct: number) => `color-mix(in srgb, var(--tc-clh-ink) ${pct}%, var(--tc-plot-bg))`;

describe("tc-calendar-heatmap", () => {
  chartBasics({ tag: "tc-calendar-heatmap", ui: "clh", kind: "Calendar heatmap", make: make as never, marks: 14, firstRead: /^Mon, June 1: 3/ });

  test("a day per cell in columns of weeks, shaded by value; empty days quiet; the busiest outlined; a legend", async () => {
    const el = await drawn(await make({ still: true }));
    const c = cells(el);
    expect(c).toHaveLength(14);
    // Weeks start on Sunday: Monday 1 June is in the first column, Sunday 7 June starts the second, 14 June the third
    const xs = [...new Set(c.map((r) => Number(r.getAttribute("x"))))];
    expect(xs).toHaveLength(3);
    expect(Number(c[6].getAttribute("x"))).toBe(xs[1]);
    expect(Number(c[0].getAttribute("y"))).toBeGreaterThan(Number(c[6].getAttribute("y")));
    // 3 of a top of 15 is a fifth of the way up from the lightest shade; the top is the full accent
    expect(fillOf(c[0])).toBe(mix(34));
    expect(fillOf(c[10])).toBe(mix(100));
    expect(fillOf(c[2])).toBe("var(--tc-clh-empty)");
    expect(c.filter((r) => r.hasAttribute("data-hi")).map((r) => c.indexOf(r))).toEqual([10]);
    expect(el.querySelector(".ui-clh__legend")!.getAttribute("aria-label")).toBe("Shading from 0 to 15 or more");
    expect(el.querySelectorAll(".ui-clh__ramp .tc-chart__swatch")).toHaveLength(6);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("14 days, max 15");
    // Month over the first week, and every other weekday down the side
    const ticks = [...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent);
    expect(ticks).toEqual(["Jun", "Mon", "Wed", "Fri"]);
  });

  test("← and → move a week, ↑ and ↓ a day; highlight picks the outlined day", async () => {
    const el = await drawn(await make({ still: true }));
    const p = plot(el);
    key(p, "ArrowRight");
    await settle();
    expect(status(el)).toMatch(/^Mon, June 1: 3, 1 of 14/);
    key(p, "ArrowRight");
    await settle();
    expect(status(el)).toMatch(/^Mon, June 8: 6, 8 of 14/);
    key(p, "ArrowDown");
    await settle();
    expect(status(el)).toMatch(/^Tue, June 9: 9/);
    key(p, "ArrowLeft");
    await settle();
    expect(status(el)).toMatch(/^Tue, June 2: 5/);
    el.highlight = "2026-06-05";
    await settle();
    expect(cells(el).findIndex((r) => r.hasAttribute("data-hi"))).toBe(4);
  });

  test("the pointer picks the day under it and a click reports it", async () => {
    const el = await drawn(await make({ still: true }));
    const clicks: string[] = [];
    el.addEventListener("tc-mark-click", (e) => clicks.push((e as CustomEvent).detail.event.label));
    const r = cells(el)[10].getBoundingClientRect();
    const at = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, pointerType: "mouse" };
    plot(el).dispatchEvent(new PointerEvent("pointermove", at));
    await settle();
    expect(el.querySelector(".tc-chart__tip-title")!.textContent).toBe("Thu, June 11");
    expect(el.querySelector(".tc-chart__tip-value")!.textContent).toBe("15");
    expect(el.querySelector(".ui-clh__ring")).not.toBeNull();
    cells(el)[10].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clicks).toEqual(["Thu, June 11"]);
  });

  test("several years: a row each, January to December, named; Monday starts the week; values add up per day", async () => {
    const data = [
      { date: "2025-03-04", value: 2 },
      { date: "2025-03-04", value: 3 },
      { date: "2026-07-01", value: 4 },
    ];
    const el = await drawn(await make({ still: true, data }));
    el.weekStart = 1;
    await settle();
    expect(cells(el)).toHaveLength(365 + 365);
    const strong = [...el.querySelectorAll(".tc-chart__tick[data-strong]")].map((t) => t.textContent);
    expect(strong).toEqual(["2025", "2026"]);
    const ticks = [...el.querySelectorAll(".tc-chart__tick:not([data-strong])")].map((t) => t.textContent);
    expect(ticks).toContain("Tue");
    expect(ticks).not.toContain("Mon");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("730 days, max 5");
    // The screen-reader table stops at 60 rows and says how many more
    expect(el.querySelector(".tc-sr-only tbody tr:last-child")!.textContent).toContain("and 670 more");
  });

  test("above canvas-threshold the days are painted on a canvas; the ring stays in the SVG; data changes repaint", async () => {
    const el = await drawn(await make({ still: true }));
    el.canvasThreshold = 10;
    await settle();
    expect(cells(el)).toHaveLength(0);
    const cv = el.querySelector<HTMLCanvasElement>(".tc-chart__canvas")!;
    expect(cv.getAttribute("aria-hidden")).toBe("true");
    const k = cv.width / plot(el).getBoundingClientRect().width;
    const geo = (el as unknown as { geo: { x0: number; topH: number; step: number; cell: number } }).geo;
    // 11 June: the second week's Thursday; 1 June: the first week's Monday
    const at = (week: number, wd: number) => cv.getContext("2d")!.getImageData(Math.round((geo.x0 + week * geo.step + geo.cell / 2) * k), Math.round((geo.topH + wd * geo.step + geo.cell / 2) * k), 1, 1).data;
    const top = at(1, 4);
    expect(top[3]).toBe(255);
    expect([...at(0, 1)]).not.toEqual([...top]);
    // Nothing painted in the weekday gutter
    expect(cv.getContext("2d")!.getImageData(1, Math.round(geo.topH * k), 1, 1).data[3]).toBe(0);
    key(plot(el), "ArrowRight");
    await settle();
    expect(el.querySelector(".ui-clh__ring")).not.toBeNull();
    // 1 June becomes the busiest: it takes the full accent, and 11 June lightens
    el.data = DAYS.map((d) => ({ ...d, value: d.date === "2026-06-01" ? 30 : d.value }));
    await settle();
    expect([...at(0, 1)]).toEqual([...top]);
    expect([...at(1, 4)]).not.toEqual([...top]);
  });

  test("the entrance fades the weeks in once on screen; a data change re-shades the days", async () => {
    const el = await drawn(await make());
    const weeks = () => [...el.querySelectorAll(".ui-clh__week")];
    await expect.poll(() => weeks().length).toBe(3);
    await expect.poll(() => el.querySelector("[data-enter], [data-wait]") === null, { timeout: 5000 }).toBe(true);
    expect(weeks().every((w) => getComputedStyle(w).opacity === "1")).toBe(true);
    el.data = DAYS.map((d) => ({ ...d, value: d.date === "2026-06-03" ? 20 : d.value }));
    await settle();
    expect(fillOf(cells(el)[2])).toBe(mix(100));
    expect(cells(el).findIndex((r) => r.hasAttribute("data-hi"))).toBe(2);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(CalendarHeatmap, { title: "Samples", data: DAYS, still: true, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcCalendarHeatmap>("tc-calendar-heatmap")!;
    expect(el.heading).toBe("Samples");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(CalendarHeatmap, { title: "Samples", data: DAYS, still: true, weekStart: 1, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    expect(el.weekStart).toBe(1);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Mon, June 1"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
