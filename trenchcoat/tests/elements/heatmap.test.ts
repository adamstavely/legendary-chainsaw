/*
 * <tc-heatmap> in real browsers: the grid of rows and columns, shading on a sequential or diverging scale in bins or
 * continuously, no-data cells, the legend and the highest and lowest cells, the tooltip, the grid keyboard, selecting
 * a cell, the crosshair, the table view, data that changes under a selection, controlled use, the React wrapper and
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
      </div>`);
      const first = wrap.querySelector("tc-heatmap")!;
      cell(first, 1, 1).focus();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => `${n.target.join(" ")} ${n.failureSummary?.slice(0, 160)}`).join(", ")}`)).toEqual([]);
    });
  }
});
