/*
 * <tc-candlestick-chart> in real browsers: the shared chart behaviour (chart-kit), candles in time order with rising
 * ones hollow and falling ones solid, the last close tagged on the axis, moving averages and their legend, volume,
 * merging too many periods, the entrance and data changes, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/candlestick-chart";
import type { TcCandlestickChart } from "../../src/elements/candlestick-chart";
import { CandlestickChart } from "../../src/elements/react/candlestick-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

// A lab freezer's daily temperature, °C – given out of order, so the chart sorts by date
const DAYS = [
  { date: "2026-10-02", open: -79.4, high: -78.8, low: -79.9, close: -79.1, door: 6 },
  { date: "2026-10-01", open: -80.1, high: -79.2, low: -80.4, close: -79.4, door: 4 },
  { date: "2026-10-03", open: -79.1, high: -78.9, low: -80.2, close: -80.0, door: 2 },
  { date: "2026-10-04", open: -80.0, high: -79.6, low: -80.6, close: -80.3, door: 3 },
  { date: "2026-10-05", open: -80.3, high: -79.1, low: -80.5, close: -79.3, door: 9 },
  { date: "2026-10-06", open: -79.3, high: -79.0, low: -79.9, close: -79.6, door: 5 },
];

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcCandlestickChart>(
    html`<div style="width: 600px"><tc-candlestick-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Freezer B" .data=${o.data ?? DAYS}></tc-candlestick-chart></div>`,
  ).then((w) => w.querySelector("tc-candlestick-chart")!);
const candles = (el: Element) => [...el.querySelectorAll<SVGGElement>(".ui-cdl__candle")];

describe("tc-candlestick-chart", () => {
  chartBasics({ tag: "tc-candlestick-chart", ui: "cdl", kind: "Candlestick chart", make: make as never, marks: 6, firstRead: /^Oct 1, 2026: open -80\.1, high -79\.2, low -80\.4, close -79\.4/ });

  test("candles in date order: rising ones hollow in the up ink, falling ones solid in the down ink", async () => {
    const el = await drawn(await make({ still: true }));
    expect(candles(el).map((c) => c.dataset.dir)).toEqual(["up", "up", "down", "down", "up", "down"]);
    expect(candles(el).map((c) => c.querySelector(".ui-cdl__body")!.hasAttribute("data-hollow"))).toEqual([true, true, false, false, true, false]);
    const body = (k: number) => getComputedStyle(candles(el)[k].querySelector(".ui-cdl__body")!);
    expect(body(0).stroke).not.toBe("none");
    // The inks are the status ones: success for up, danger for down
    const cs = getComputedStyle(el);
    expect(cs.getPropertyValue("--tc-cdl-up").trim()).toBe(cs.getPropertyValue("--tc-status-success-solid").trim());
    expect(cs.getPropertyValue("--tc-cdl-down").trim()).toBe(cs.getPropertyValue("--tc-status-danger-solid").trim());
    expect(cs.getPropertyValue("--tc-cdl-up").trim()).not.toBe("");
    expect(body(0).fill).not.toBe(body(2).fill);
    // The legend names both, with a hollow and a solid key
    expect([...el.querySelectorAll(".tc-chart__key")].map((k) => k.textContent!.trim())).toEqual(["Up", "Down"]);
    // Earlier dates to the left
    const xs = candles(el).map((c) => Number(c.querySelector(".ui-cdl__wick")!.getAttribute("x1")));
    expect(xs.every((x, i) => !i || x > xs[i - 1])).toBe(true);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toMatch(/^Oct 1, 2026 to Oct 6, 2026, 6 candles\. First open -80\.1, last close -79\.6/);
  });

  test("the last close is tagged on the axis, outlined; highlight moves it; the tooltip has the change", async () => {
    const el = await drawn(await make({ still: true }));
    const tag = () => el.querySelector(".ui-cdl__last")!;
    expect(tag().getAttribute("data-dir")).toBe("down");
    expect(tag().querySelector(".tc-chart__value")!.textContent).toBe("-79.6");
    el.highlight = "first";
    await settle();
    expect(tag().getAttribute("data-dir")).toBe("up");
    expect(tag().querySelector(".tc-chart__value")!.textContent).toBe("-79.4");
    key(plot(el), "End");
    await settle();
    const rows = [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());
    expect(rows).toContain("Close (Down) -79.6");
    expect(rows).toContain("Change -0.4%");
  });

  test("moving averages, volume and merging", async () => {
    const el = await drawn(await make({ still: true }));
    el.ma = [3];
    el.volume = "door";
    await settle();
    expect(el.querySelectorAll(".ui-cdl__ma").length).toBe(2); // the line and its legend sample
    expect(el.querySelector(".ui-cdl__ma-label")!.textContent).toBe("MA3 -79.7");
    expect([...el.querySelectorAll(".tc-chart__key")].map((k) => k.textContent!.trim())).toEqual(["Up", "Down", "3-period MA"]);
    expect(el.querySelectorAll(".ui-cdl__volume").length).toBe(6);
    // Twenty days merged to at most eight candles: three days each, the first open and the last close
    const many = Array.from({ length: 20 }, (_, k) => ({ date: `2026-09-${String(k + 1).padStart(2, "0")}`, open: -80 + k * 0.1, high: -79 + k * 0.1, low: -81 + k * 0.1, close: -79.5 + k * 0.1 }));
    el.data = many;
    el.maxCandles = 8;
    await settle();
    expect(candles(el)).toHaveLength(7);
    expect(el.querySelector(".tc-sr-only tbody th")!.textContent).toBe("Sep 1, 2026 – Sep 3, 2026");
  });

  test("the entrance sweeps the candles open, then a data change glides them", async () => {
    const el = await drawn(await make());
    const top = () => Number(candles(el)[0].querySelector(".ui-cdl__wick")!.getAttribute("y1"));
    const bottom = () => Number(candles(el)[0].querySelectorAll(".ui-cdl__wick")[1]?.getAttribute("y2") ?? 0);
    await expect.poll(() => bottom() - top(), { timeout: 4000 }).toBeGreaterThan(60);
    await expect.poll(() => (el as unknown as { motion: { animating: boolean } }).motion.animating, { timeout: 4000 }).toBe(false);
    const before = top();
    // The first day's high rises: its wick reaches further up
    el.data = DAYS.map((d) => (d.date === "2026-10-01" ? { ...d, high: -78.7 } : d));
    await settle();
    await expect.poll(top, { timeout: 4000 }).toBeLessThan(before - 5);
  });

  const shiftKey = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey: true, bubbles: true, cancelable: true }));

  test("brush: Shift+arrows pick candles, Enter settles them with the change, high and low; zoom narrows to them", async () => {
    const el = await drawn(await make({ still: true }));
    el.brush = "select";
    await settle();
    const ranges: unknown[] = [];
    el.addEventListener("tc-brush", (e) => ranges.push((e as CustomEvent).detail.range));
    const p = plot(el);
    key(p, "Home");
    shiftKey(p, "ArrowRight");
    shiftKey(p, "ArrowRight");
    key(p, "Enter");
    await settle();
    // From Oct 1's open (−80.1) to Oct 3's close (−80.0); the high is Oct 2's, the low Oct 1's
    expect(ranges[0]).toMatchObject({ from: 0, to: 2 });
    expect(el.querySelector(".tc-brush__band")).not.toBeNull();
    expect([...el.querySelectorAll(".tc-brush__tag-text")].map((t) => t.textContent)).toEqual(["High -78.8", "Low -80.4"]);
    key(p, "Escape");
    await settle();
    expect(el.querySelector(".tc-brush__band")).toBeNull();
    el.brush = "zoom";
    await settle();
    key(p, "Home");
    shiftKey(p, "ArrowRight");
    key(p, "Enter");
    await settle();
    expect(el.querySelectorAll(".ui-cdl__candle")).toHaveLength(2);
    el.querySelector<HTMLButtonElement>(".tc-chart__reset")!.click();
    await settle();
    expect(el.querySelectorAll(".ui-cdl__candle")).toHaveLength(6);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(CandlestickChart, { title: "Freezer", data: DAYS, still: true, ma: [3], view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcCandlestickChart>("tc-candlestick-chart")!;
    expect(el.heading).toBe("Freezer");
    expect(el.ma).toEqual([3]);
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(CandlestickChart, { title: "Freezer", data: DAYS, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Oct 1, 2026"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
