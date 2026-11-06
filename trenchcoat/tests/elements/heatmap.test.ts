/*
 * <tc-heatmap> in real browsers: the grid of rows and columns, shading on a sequential or diverging scale in bins or
 * continuously, no-data cells, the legend and the highest and lowest cells, the tooltip, the grid keyboard, selecting
 * a cell, the crosshair, the table view, words at the legend's ends, the canvas for big matrices, data that changes under a selection, controlled use, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/heatmap";
import type { HeatmapSelectedChange, HeatmapViewChange, TcHeatmap } from "../../src/elements/heatmap";
import { Heatmap } from "../../src/elements/react/heatmap";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ROWS = ["Mon", "Tue", "Wed"];
const COLUMNS = ["08:00", "10:00", "12:00", "14:00"];
/** 0 … 100: Wed 14:00 is the highest, Mon 08:00 the lowest, Tue 12:00 has no data */
const VALUES: (number | null)[][] = [
  [0, 20, 40, 60],
  [10, 30, null, 70],
  [50, 80, 90, 100],
];

const cell = (el: Element, r: number, c: number) => el.querySelector<HTMLElement>(`[data-cell="${r}:${c}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
/** A cell's name: the words read for it */
const said = (c: Element) => c.querySelector(".tc-sr-only")!.textContent;
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcHeatmap>(html`<tc-heatmap look=${look} heading="Instrument use" unit="%" .rows=${ROWS} .columns=${COLUMNS} .values=${VALUES}></tc-heatmap>`);

describe("tc-heatmap", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid named by the heading, a row per label, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("heat");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Instrument use");
      expect([...grid.querySelectorAll('[role="rowheader"]')].map(text)).toEqual(ROWS);
      expect([...grid.querySelectorAll('[role="columnheader"]')].map(text)).toEqual(COLUMNS);
      expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(12);
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(cell(el, 0, 0).tabIndex).toBe(0);
      expect(said(cell(el, 2, 3))).toBe("Wed · 14:00: 100%");
      expect(said(cell(el, 1, 2))).toBe("Tue · 12:00: No data");
      const described = grid.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)!.textContent!.replace(/\s+/g, " ").trim());
      expect(described).toEqual(["Arrow keys move between cells; Enter selects the cell", "Highest Wed · 14:00 100% Lowest Mon · 08:00 0%"]);
    });
  }

  test("sequential, in five bins: the shade steps with the value; no data is hatched", async () => {
    const el = await make();
    const mix = (r: number, c: number) => cell(el, r, c).style.getPropertyValue("--m");
    // 0–19 → the lightest, 80–100 → the darkest
    expect([mix(0, 0), mix(0, 1), mix(0, 2), mix(0, 3), mix(2, 3)]).toEqual(["12%", "33%", "53%", "74%", "94%"]);
    expect(cell(el, 1, 2).dataset.side).toBe("none");
    expect(getComputedStyle(cell(el, 1, 2)).backgroundImage).toContain("repeating-linear-gradient");
    // The legend: no data, then the five bins between the ends
    expect(text(el.querySelector(".ui-heat__legend"))).toBe("No data 0% 100%");
    expect(el.querySelectorAll(".ui-heat__swatch:not([data-side='none'])")).toHaveLength(5);
    // Continuous: a ramp, and shades by value
    el.steps = 0;
    await settle();
    expect(el.querySelector(".ui-heat__ramp")).not.toBeNull();
    expect(mix(0, 2)).toBe("45%");
    // max fixes the top
    el.max = 200;
    await settle();
    expect(mix(2, 3)).toBe("53%");
  });

  test("legendLabels: words at the legend's ends in place of the values, which screen readers still hear", async () => {
    const el = await make();
    el.legendLabels = ["Fewer", "More"];
    await settle();
    const ends = [...el.querySelectorAll<HTMLElement>(".ui-heat__end")];
    expect(ends.map(text)).toEqual(["Fewer (0%)", "More (100%)"]);
    expect(ends.map((e) => text(e.querySelector(".tc-sr-only")))).toEqual(["(0%)", "(100%)"]);
    expect(text(el.querySelector(".ui-heat__legend"))).toBe("No data Fewer (0%) More (100%)");
    // Diverging and continuous keep them at the ends
    el.scale = "diverging";
    el.midpoint = 50;
    el.steps = 0;
    await settle();
    expect(text(el.querySelector(".ui-heat__legend"))).toBe("No data Fewer (0%) , 50% in the middle, More (100%)");
    el.legendLabels = undefined;
    await settle();
    expect(text(el.querySelector(".ui-heat__legend"))).toBe("No data 0% , 50% in the middle, 100%");
  });

  test("diverging: either side of the midpoint, each in its own ink", async () => {
    const el = await fixture<TcHeatmap>(html`<tc-heatmap scale="diverging" .midpoint=${0} .rows=${["A"]} .columns=${["1", "2", "3", "4", "5"]} .values=${[[-10, -4, 0, 4, 10]]}></tc-heatmap>`);
    expect([0, 1, 2, 3, 4].map((c) => cell(el, 0, c).dataset.side)).toEqual(["low", "low", "high", "high", "high"]);
    expect([0, 1, 2, 3, 4].map((c) => cell(el, 0, c).style.getPropertyValue("--m"))).toEqual(["88%", "44%", "0%", "44%", "88%"]);
    expect(text(el.querySelector(".ui-heat__legend"))).toBe("-10 , 0 in the middle, 10");
    expect([...el.querySelectorAll<HTMLElement>(".ui-heat__swatch")].map((s) => s.dataset.side)).toEqual(["low", "low", "high", "high", "high"]);
  });

  test("the tooltip on hover or focus – below the first row, kept inside at the ends", async () => {
    const el = await make();
    cell(el, 1, 1).dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    const tip = () => el.querySelector<HTMLElement>(".ui-heat__tip");
    expect(text(tip())).toBe("Tue · 10:00: 30%");
    expect(tip()!.hasAttribute("data-below")).toBe(false);
    el.querySelector('[role="grid"]')!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(tip()).toBeNull();
    cell(el, 0, 3).focus();
    await settle();
    expect(text(tip())).toBe("Mon · 14:00: 60%");
    expect(tip()!.hasAttribute("data-below")).toBe(true);
    expect(tip()!.dataset.side).toBe("end");
    // Escape hides it when nothing is selected
    key(cell(el, 0, 3), "Escape");
    await settle();
    expect(tip()).toBeNull();
  });

  test("keyboard: arrows, Home / End, Page Up / Down, ⌘/Ctrl+Home / End; Enter selects, Escape clears", async () => {
    const el = await make();
    const seen: HeatmapSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<HeatmapSelectedChange>).detail));
    cell(el, 0, 0).focus();
    const at = () => (document.activeElement as HTMLElement).dataset.cell;
    const press = async (k: string, init: KeyboardEventInit = {}) => {
      key(document.activeElement!, k, init);
      await settle();
    };
    await press("ArrowRight");
    expect(at()).toBe("0:1");
    await press("ArrowDown");
    expect(at()).toBe("1:1");
    await press("End");
    expect(at()).toBe("1:3");
    await press("Home");
    expect(at()).toBe("1:0");
    await press("PageDown");
    expect(at()).toBe("2:0");
    await press("PageUp");
    expect(at()).toBe("0:0");
    await press("End", { ctrlKey: true, metaKey: true });
    expect(at()).toBe("2:3");
    await press("ArrowRight");
    expect(at()).toBe("2:3");
    expect(el.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
    await press("Enter");
    expect(el.selected).toEqual({ row: 2, column: 3 });
    expect(cell(el, 2, 3).getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Selected Wed · 14:00: 100%");
    await press("Escape");
    expect(el.selected).toBeNull();
    expect(seen).toEqual([
      { selected: { row: 2, column: 3 }, value: 100 },
      { selected: null, value: undefined },
    ]);
    // A click selects; prevented, it stays
    el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
    cell(el, 1, 2).click();
    await settle();
    expect(el.selected).toBeNull();
    cell(el, 1, 2).click();
    await settle();
    expect(el.selected).toEqual({ row: 1, column: 2 });
    expect(seen.at(-1)).toEqual({ selected: { row: 1, column: 2 }, value: null });
  });

  test("crosshair: the cell's row and column light up, with their labels", async () => {
    const el = await make();
    el.crosshair = true;
    await settle();
    cell(el, 1, 2).dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect([...el.querySelectorAll<HTMLElement>("[data-cross]")].map((c) => c.dataset.cell).sort()).toEqual(["0:2", "1:0", "1:1", "1:3", "2:2"]);
    expect(text(el.querySelector('.ui-heat__rowhead[data-hot]'))).toBe("Tue");
    expect(text(el.querySelector('.ui-heat__colhead[data-hot]'))).toBe("12:00");
  });

  test("show-values writes each value in its cell", async () => {
    const el = await make();
    el.showValues = true;
    await settle();
    expect(text(cell(el, 2, 2).querySelector(".ui-heat__num"))).toBe("90%");
    expect(cell(el, 1, 2).querySelector(".ui-heat__num")).toBeNull();
  });

  test("the Table button swaps in a plain table; tc-view-change, preventable", async () => {
    const el = await make();
    const btn = el.querySelector<HTMLButtonElement>(".ui-heat__toggle")!;
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    const seen: string[] = [];
    el.addEventListener("tc-view-change", (e) => seen.push((e as CustomEvent<HeatmapViewChange>).detail.view));
    btn.click();
    await settle();
    expect(el.view).toBe("table");
    expect(el.querySelector('[role="grid"]')).toBeNull();
    const table = el.querySelector(".ui-heat__table")!;
    expect(text(table.querySelector("caption"))).toBe("Instrument use");
    el.rowHeader = "Day";
    await settle();
    expect([...table.querySelectorAll("thead th")].map(text)).toEqual(["Day", ...COLUMNS]);
    expect([...table.querySelectorAll("tbody tr")[1].querySelectorAll("th, td")].map(text)).toEqual(["Tue", "10%", "30%", "No data", "70%"]);
    expect(el.querySelector(".ui-heat__legend")).toBeNull();
    expect(el.querySelector<HTMLButtonElement>(".ui-heat__toggle")!.getAttribute("aria-pressed")).toBe("true");
    el.addEventListener("tc-view-change", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>(".ui-heat__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    expect(seen).toEqual(["table", "chart"]);
  });

  test("data that shrinks drops a selection outside it; no rows or columns says so", async () => {
    const el = await make();
    el.selected = { row: 2, column: 3 };
    await settle();
    el.rows = ["Mon", "Tue"];
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
    // Values missing for a row read as no data
    el.values = [[1, 2, 3, 4]];
    await settle();
    expect(said(cell(el, 1, 0))).toBe("Tue · 08:00: No data");
    el.columns = [];
    await settle();
    expect(text(el.querySelector(".ui-heat__empty"))).toBe("No data to show.");
    expect(el.querySelector(".ui-heat__toggle")).toBeNull();
  });

  test("narrow: the cells keep their size and the grid scrolls under sticky row labels", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 260px"><tc-heatmap .rows=${ROWS} .columns=${Array.from({ length: 12 }, (_, i) => `${i}`)} .values=${[Array.from({ length: 12 }, (_, i) => i)]}></tc-heatmap></div>`);
    const el = wrap.querySelector("tc-heatmap")!;
    const scroll = el.querySelector<HTMLElement>(".ui-heat__scroll")!;
    expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    expect(cell(el, 0, 0).getBoundingClientRect().width).toBeGreaterThanOrEqual(31);
    expect(getComputedStyle(el.querySelector(".ui-heat__rowhead")!).position).toBe("sticky");
  });

  describe("canvas: above canvas-threshold cells", () => {
    /** 60 × 60 = 3,600 cells, above the default 2,500: the value rises left to right, row 59 column 59 is the highest */
    const N = 60;
    const BIG_ROWS = Array.from({ length: N }, (_, i) => `R${i}`);
    const BIG_COLS = Array.from({ length: N }, (_, i) => `C${i}`);
    const BIG = BIG_ROWS.map((_, r) => BIG_COLS.map((_, c) => (r === 3 && c === 3 ? null : c * 10 + r / 100)));
    const big = async (attrs = html``) => {
      const wrap = await fixture<HTMLElement>(html`<div style="width: 720px"><tc-heatmap heading="Detector" unit="counts" .rows=${BIG_ROWS} .columns=${BIG_COLS} .values=${BIG}></tc-heatmap>${attrs}</div>`);
      const el = wrap.querySelector("tc-heatmap")!;
      const cv = () => el.querySelector<HTMLCanvasElement>(".tc-chart__canvas")!;
      await expect.poll(() => cv()?.width ?? 0).toBeGreaterThan(300);
      return { el, cv };
    };
    const geo = (el: TcHeatmap) => (el as unknown as { geo: { cw: number; ch: number } }).geo;
    /** The canvas pixel at the middle of a cell */
    const px = (el: TcHeatmap, cv: HTMLCanvasElement, r: number, c: number) => {
      const { cw, ch } = geo(el);
      const k = cv.width / cv.getBoundingClientRect().width;
      return [...cv.getContext("2d")!.getImageData(Math.floor((c + 0.5) * cw * k), Math.floor((r + 0.5) * ch * k), 1, 1).data];
    };
    const vcell = (el: Element) => el.querySelector<HTMLElement>('[role="gridcell"]')!;
    /** Points at the middle of a cell on the plot */
    const point = (el: TcHeatmap, type: string, r: number, c: number) => {
      const plot = el.querySelector<HTMLElement>(".ui-heat__plot")!;
      const box = plot.getBoundingClientRect();
      const { cw, ch } = geo(el);
      plot.dispatchEvent(new PointerEvent(type, { clientX: box.left + (c + 0.5) * cw, clientY: box.top + (r + 0.5) * ch, bubbles: true, pointerType: "mouse" }));
    };

    test("the cells are painted on a canvas that fills the width, not drawn as DOM cells; below the threshold they are", async () => {
      const { el, cv } = await big();
      expect(el.querySelectorAll(".ui-heat__cell")).toHaveLength(0);
      expect(el.querySelectorAll("td, th")).toHaveLength(0);
      expect(cv().getAttribute("aria-hidden")).toBe("true");
      const plot = el.querySelector<HTMLElement>(".ui-heat__plot")!;
      expect(Math.abs(cv().getBoundingClientRect().width - plot.getBoundingClientRect().width)).toBeLessThan(1);
      expect(geo(el).cw * N).toBeCloseTo(plot.getBoundingClientRect().width, 0);
      // Painted pixels (the track is translucent), darker to the right; the no-data cell isn't a shade
      const low = px(el, cv(), 10, 0);
      const high = px(el, cv(), 10, N - 1);
      expect(low[3]).toBeGreaterThan(0);
      expect(high[3]).toBeGreaterThan(low[3] - 1);
      expect(high).not.toEqual(low);
      expect(px(el, cv(), 3, 3)).not.toEqual(px(el, cv(), 4, 3));
      // The labels thin out, and the canvas has no values written on it
      expect(el.querySelectorAll(".ui-heat__ylabel").length).toBeLessThan(N);
      expect(el.querySelectorAll(".ui-heat__xlabel").length).toBeLessThan(N);
      el.showValues = true;
      await settle();
      expect(el.querySelector(".ui-heat__num")).toBeNull();
      // A higher threshold: back to DOM cells
      el.canvasThreshold = 5000;
      await settle();
      expect(el.querySelector(".tc-chart__canvas")).toBeNull();
      expect(el.querySelectorAll(".ui-heat__cell")).toHaveLength(N * N);
    });

    test("the grid keeps its keyboard: one cell element, placed by aria-rowindex / aria-colindex", async () => {
      const { el } = await big();
      const grid = el.querySelector('[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Detector");
      expect(grid.getAttribute("aria-rowcount")).toBe(String(N + 1));
      expect(grid.getAttribute("aria-colcount")).toBe(String(N + 1));
      expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(1);
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      const seen: HeatmapSelectedChange[] = [];
      el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<HeatmapSelectedChange>).detail));
      vcell(el).focus();
      await settle();
      expect(said(vcell(el))).toBe("R0 · C0: 0 counts");
      const press = async (k: string, init: KeyboardEventInit = {}) => {
        key(document.activeElement!, k, init);
        await settle();
      };
      await press("ArrowRight");
      await press("ArrowDown");
      expect(document.activeElement).toBe(vcell(el));
      expect(vcell(el).dataset.cell).toBe("1:1");
      expect(vcell(el).getAttribute("aria-colindex")).toBe("3");
      expect(vcell(el).closest('[role="row"]')!.getAttribute("aria-rowindex")).toBe("3");
      expect(text(grid.querySelector('[role="rowheader"]'))).toBe("R1");
      expect(text(grid.querySelector('[role="columnheader"]'))).toBe("C1");
      expect(said(vcell(el))).toBe("R1 · C1: 10.01 counts");
      // The tooltip follows the keyboard
      expect(text(el.querySelector(".ui-heat__tip"))).toBe("R1 · C1: 10.01 counts");
      await press("End", { ctrlKey: true, metaKey: true });
      expect(vcell(el).dataset.cell).toBe(`${N - 1}:${N - 1}`);
      await press("PageUp");
      await press("Home");
      expect(vcell(el).dataset.cell).toBe("0:0");
      await press("Enter");
      expect(el.selected).toEqual({ row: 0, column: 0 });
      expect(vcell(el).getAttribute("aria-selected")).toBe("true");
      expect(el.querySelector('[role="status"]')!.textContent).toBe("Selected R0 · C0: 0 counts");
      await press("Escape");
      expect(el.selected).toBeNull();
      expect(seen).toEqual([
        { selected: { row: 0, column: 0 }, value: 0 },
        { selected: null, value: undefined },
      ]);
    });

    test("pointing shows the tooltip and the crosshair; a click selects and moves the focus there; the Table view has every value", async () => {
      const { el } = await big();
      el.crosshair = true;
      await settle();
      point(el, "pointermove", 20, 30);
      await settle();
      expect(text(el.querySelector(".ui-heat__mark[data-hot] .ui-heat__tip"))).toBe("R20 · C30: 300.2 counts");
      expect(el.querySelectorAll(".ui-heat__band")).toHaveLength(2);
      expect(text(el.querySelector(".ui-heat__ylabel[data-hot]"))).toBe("R20");
      expect(text(el.querySelector(".ui-heat__xlabel[data-hot]"))).toBe("C30");
      el.querySelector(".ui-heat__plot")!.dispatchEvent(new PointerEvent("pointerleave"));
      await settle();
      expect(el.querySelector(".ui-heat__tip")).toBeNull();
      point(el, "pointerdown", 5, 7);
      point(el, "click", 5, 7);
      await settle();
      expect(el.selected).toEqual({ row: 5, column: 7 });
      expect(document.activeElement).toBe(vcell(el));
      expect(vcell(el).dataset.cell).toBe("5:7");
      expect(vcell(el).hasAttribute("data-selected")).toBe(true);
      // Moving off the selected cell leaves a mark on it
      key(vcell(el), "ArrowRight");
      await settle();
      expect(el.querySelector(".ui-heat__mark[data-selected]")).not.toBeNull();
      // Prevented, the selection stays
      el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
      point(el, "click", 9, 9);
      await settle();
      expect(el.selected).toEqual({ row: 5, column: 7 });
      el.querySelector<HTMLButtonElement>(".ui-heat__toggle")!.click();
      await settle();
      expect(el.querySelector(".tc-chart__canvas")).toBeNull();
      expect(el.querySelectorAll(".ui-heat__table tbody tr")).toHaveLength(N);
      el.view = "chart";
      await settle();
      // Back to the chart: a new canvas, painted again
      await expect.poll(() => el.querySelector<HTMLCanvasElement>(".tc-chart__canvas")!.width).toBeGreaterThan(300);
      const cv = el.querySelector<HTMLCanvasElement>(".tc-chart__canvas")!;
      await expect.poll(() => px(el, cv, 10, N - 1)[3]).toBeGreaterThan(0);
    });

    test("a data change repaints", async () => {
      const { el, cv } = await big();
      const before = px(el, cv(), 10, N - 1);
      // Reversed: the right side is now the lowest
      el.values = BIG.map((row) => [...row].reverse());
      await settle();
      expect(px(el, cv(), 10, N - 1)).not.toEqual(before);
      expect(px(el, cv(), 10, 0)).toEqual(before);
    });
  });

  test("React wrapper: an uncontrolled selection survives re-renders; controlled ones wait for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Heatmap, {
        title: "Instrument use",
        rows: ROWS,
        columns: COLUMNS,
        values: VALUES,
        onSelectedChange: (s, v) => void seen.push([s, v]),
        "data-n": n,
      } as React.ComponentProps<typeof Heatmap>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    let el = host.querySelector("tc-heatmap")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Instrument use");
    cell(el, 0, 1).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toEqual({ row: 0, column: 1 });
    expect(seen).toEqual([[{ row: 0, column: 1 }, 20]]);
    const views: string[] = [];
    await act(async () => root.render(React.createElement(Heatmap, { rows: ROWS, columns: COLUMNS, values: VALUES, selected: null, view: "chart", onViewChange: (v) => void views.push(v) })));
    await settle();
    el = host.querySelector("tc-heatmap")!;
    cell(el, 1, 1).click();
    el.querySelector<HTMLButtonElement>(".ui-heat__toggle")!.click();
    await settle();
    expect(el.selected).toBeNull();
    expect(el.view).toBe("chart");
    expect(views).toEqual(["table"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: grid; gap: 16px; padding: 16px; background: var(--tc-surface-base)">
        <tc-heatmap heading="Instrument use" description="Share of hours booked" unit="%" show-values crosshair .rows=${ROWS} .columns=${COLUMNS} .values=${VALUES} .selected=${{ row: 2, column: 1 }}></tc-heatmap>
        <tc-heatmap look="clean" scale="diverging" .steps=${0} show-values .rows=${["A"]} .columns=${["1", "2", "3"]} .values=${[[-5, 0, 5]]}></tc-heatmap>
        <tc-heatmap view="table" unit="%" .rows=${ROWS} .columns=${COLUMNS} .values=${VALUES}></tc-heatmap>
        <tc-heatmap heading="Detector" unit="counts" crosshair .legendLabels=${["Fewer", "More"]} .canvasThreshold=${10} .rows=${ROWS} .columns=${COLUMNS} .values=${VALUES} .selected=${{ row: 0, column: 1 }}></tc-heatmap>
      </div>`);
      const painted = wrap.querySelectorAll("tc-heatmap")[3];
      painted.querySelector<HTMLElement>('[role="gridcell"]')!.focus();
      const first = wrap.querySelector("tc-heatmap")!;
      cell(first, 1, 1).focus();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => `${n.target.join(" ")} ${n.failureSummary?.slice(0, 160)}`).join(", ")}`)).toEqual([]);
    });
  }
});
