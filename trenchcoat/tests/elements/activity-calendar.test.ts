/*
 * <tc-activity-calendar> in real browsers: a column per week and a row per weekday ending on `end`, month and weekday
 * names, shading by level, missing days as 0 and null as no data, the total and readout, selecting a day, the grid
 * keyboard, week-start, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/activity-calendar";
import type { ActivityCalendarDay, ActivityCalendarSelectedChange, TcActivityCalendar } from "../../src/elements/activity-calendar";
import { ActivityCalendar } from "../../src/elements/react/activity-calendar";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** Local midnight of a date in 2026 (month from 1) */
const day = (m: number, d: number) => new Date(2026, m - 1, d).getTime();
/** Tuesday 27 October 2026 is the last day */
const END = new Date(2026, 9, 27, 15).getTime();
/** Tue 27: 8 (the busiest) · Mon 26: 4 · Sun 25: 2 · Fri 23: null · Thu 22: listed twice, 1 + 1 · everything else 0 */
const DAYS: ActivityCalendarDay[] = [
  { date: day(10, 27) + 3_600_000, value: 8 },
  { date: day(10, 26), value: 4 },
  { date: day(10, 25) + 72_000_000, value: 2 },
  { date: day(10, 23), value: null },
  { date: day(10, 22), value: 1 },
  { date: day(10, 22) + 1000, value: 1 },
];

const cellOn = (el: Element, at: number) => el.querySelector<HTMLElement>(`[data-date="${at}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (look: "standard" | "clean" = "standard", weeks = 6) =>
  fixture<TcActivityCalendar>(html`<tc-activity-calendar look=${look} unit="reviews" .weeks=${weeks} .end=${END} .days=${DAYS}></tc-activity-calendar>`);

describe("tc-activity-calendar", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid of weekday rows and week columns ending on \`end\`, one tab stop on the last day`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("acal");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Activity");
      const rows = grid.querySelectorAll('tbody [role="row"]');
      expect(rows).toHaveLength(7);
      // Sunday first: the rows' headers are the weekdays from Sunday
      const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" });
      expect([...grid.querySelectorAll('[role="rowheader"] .ui-acal__sr')].map((h) => h.textContent)).toEqual([4, 5, 6, 7, 8, 9, 10].map((d) => weekday.format(day(10, d))));
      expect(rows[0].querySelectorAll('[role="gridcell"]')).toHaveLength(6);
      // The last column runs Sun 25 – Sat 31; days after Tue 27 are blank
      expect(cellOn(el, day(10, 27)).dataset.cell).toBe("5:2");
      expect(rows[3].querySelectorAll('[role="gridcell"]')[5].hasAttribute("data-out")).toBe(true);
      // The first column starts on Sunday 20 September
      expect(cellOn(el, day(9, 20)).dataset.cell).toBe("0:0");
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(cellOn(el, day(10, 27)).getAttribute("tabindex")).toBe("0");
      // Month names over the week holding the 1st (Oct 1 is in column 1, too close to the first column's "Sep")
      const months = [...grid.querySelectorAll(".ui-acal__month > span[aria-hidden='false']")].map((m) => m.textContent);
      expect(months).toEqual([new Intl.DateTimeFormat(undefined, { month: "short" }).format(day(10, 1))]);
    });
  }

  test("levels: scaled to the busiest day; missing days are 0; null is outlined; two entries on one day add up", async () => {
    const el = await make();
    const level = (at: number) => cellOn(el, at).dataset.level;
    expect([level(day(10, 27)), level(day(10, 26)), level(day(10, 25)), level(day(10, 22)), level(day(10, 24))]).toEqual(["4", "2", "1", "1", "0"]);
    expect(level(day(10, 23))).toBe("none");
    expect(cellOn(el, day(10, 22)).getAttribute("aria-label")).toBe(`2 reviews, ${new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(day(10, 22))}`);
    expect(cellOn(el, day(10, 23)).getAttribute("aria-label")).toMatch(/^No data, /);
    expect(getComputedStyle(cellOn(el, day(10, 27)).firstElementChild!).backgroundColor).not.toBe(getComputedStyle(cellOn(el, day(10, 24)).firstElementChild!).backgroundColor);
    // The total counts every day shown
    expect(el.querySelector(".ui-acal__total-value")!.textContent).toBe("16 reviews");
    expect(el.querySelector(".ui-acal__legend")!.textContent).toContain("No data");
    el.max = 16;
    el.levels = 3;
    await settle();
    expect([level(day(10, 27)), level(day(10, 26))]).toEqual(["1", "1"]);
    expect(el.querySelectorAll(".ui-acal__swatches .ui-acal__swatch")).toHaveLength(3);
  });

  test("`end` defaults to the latest day given; week-start moves the rows; the range is scrolled to its newest week", async () => {
    const el = await fixture<TcActivityCalendar>(html`<div style="width: 320px"><tc-activity-calendar .days=${DAYS}></tc-activity-calendar></div>`);
    const cal = el.querySelector("tc-activity-calendar")!;
    await settle();
    expect(cal.querySelectorAll("tbody tr")[0].querySelectorAll('[role="gridcell"]')).toHaveLength(53);
    expect(cellOn(cal, day(10, 27)).dataset.cell).toBe("52:2");
    const scroll = cal.querySelector<HTMLElement>(".ui-acal__scroll")!;
    expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    expect(scroll.scrollLeft + scroll.clientWidth).toBeGreaterThanOrEqual(scroll.scrollWidth - 1);
    cal.weekStart = 1;
    await settle();
    expect(cellOn(cal, day(10, 27)).dataset.cell).toBe("52:1");
    expect(cal.querySelector('[role="rowheader"] .ui-acal__sr')!.textContent).toBe(new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day(10, 26)));
  });

  test("the readout shows the day under the pointer or focus, else the selected day", async () => {
    const el = await make();
    const readout = () => el.querySelector(".ui-acal__readout")!.textContent!.replace(/\s+/g, " ").trim();
    expect(readout()).toBe("Point at a day to see its activity");
    cellOn(el, day(10, 26)).dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(readout()).toBe(`4 reviews on ${new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(day(10, 26))}`);
    el.querySelector(".ui-acal__grid")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(readout()).toBe("Point at a day to see its activity");
    cellOn(el, day(10, 23)).focus();
    await settle();
    expect(readout()).toMatch(/^No data on /);
  });

  test("click or Enter selects a day; again or Escape clears it; tc-selected-change fires with the value", async () => {
    const el = await make();
    const seen: ActivityCalendarSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<ActivityCalendarSelectedChange>).detail));
    cellOn(el, day(10, 26)).click();
    await settle();
    expect(el.selected).toBe(day(10, 26));
    expect(cellOn(el, day(10, 26)).getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Selected .+: 4 reviews$/);
    key(cellOn(el, day(10, 26)), "Enter");
    await settle();
    expect(el.selected).toBeNull();
    key(cellOn(el, day(10, 23)), " ");
    await settle();
    key(cellOn(el, day(10, 23)), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(seen).toEqual([
      { selected: day(10, 26), value: 4 },
      { selected: null, value: undefined },
      { selected: day(10, 23), value: null },
      { selected: null, value: undefined },
    ]);
  });

  test("keyboard: ↑ ↓ a day, ← → a week, Page keys four weeks, Home/End along the row, ⌘/Ctrl+Home/End to the ends", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-cell");
    cellOn(el, day(10, 27)).focus();
    const press = async (k: string, init: KeyboardEventInit = {}) => {
      key(document.activeElement!, k, init);
      await expect.poll(() => el.querySelectorAll('[role="gridcell"][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowUp");
    expect(at()).toBe("5:1");
    await press("ArrowLeft");
    expect(at()).toBe("4:1");
    await press("ArrowRight");
    await press("ArrowDown");
    await press("ArrowDown");
    // Wed 28 is after `end`: the move stops on the last day
    expect(at()).toBe("5:2");
    await press("PageUp");
    expect(at()).toBe("1:2");
    await press("PageUp");
    expect(at()).toBe("0:2");
    await press("PageDown");
    expect(at()).toBe("4:2");
    await press("Home");
    expect(at()).toBe("0:2");
    await press("End");
    expect(at()).toBe("5:2");
    await press("Home", { ctrlKey: true, metaKey: true });
    expect(at()).toBe("0:0");
    await press("End", { ctrlKey: true, metaKey: true });
    expect(at()).toBe("5:2");
  });

  test("controlled: preventDefault() keeps the selection; the tab stop sits on the selected day; a day out of range clears", async () => {
    const el = await fixture<TcActivityCalendar>(html`<tc-activity-calendar .weeks=${6} .end=${END} .days=${DAYS} .selected=${day(10, 5)}></tc-activity-calendar>`);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    expect(cellOn(el, day(10, 5)).getAttribute("tabindex")).toBe("0");
    cellOn(el, day(10, 26)).click();
    await settle();
    expect(el.selected).toBe(day(10, 5));
    el.weeks = 2;
    await settle();
    expect(el.selected).toBeNull();
  });

  test("an empty element renders without errors; the heading can be renamed", async () => {
    const el = await fixture<TcActivityCalendar>(html`<tc-activity-calendar heading="Commits"></tc-activity-calendar>`);
    expect(el.querySelector(".ui-acal__empty")).toBeTruthy();
    expect(el.querySelector('[role="grid"]')).toBeNull();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Commits");
    el.end = END;
    await settle();
    expect(el.querySelector('[role="grid"]')).toBeTruthy();
    expect(el.querySelector(".ui-acal__total-value")!.textContent).toBe("0 events");
  });

  test("React wrapper: an uncontrolled selection survives parent re-renders; onSelectedChange gets the value", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ActivityCalendar, {
        title: "Code reviews",
        days: DAYS,
        end: END,
        weeks: 6,
        onSelectedChange: (s, v) => void seen.push([s, v]),
        "data-n": n,
      } as React.ComponentProps<typeof ActivityCalendar>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-activity-calendar")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Code reviews");
    cellOn(el, day(10, 27)).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe(day(10, 27));
    expect(seen).toEqual([[day(10, 27), 8]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (number | null)[] = [];
    await act(async () => root.render(React.createElement(ActivityCalendar, { days: DAYS, end: END, weeks: 6, selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-activity-calendar")!;
    cellOn(el, day(10, 26)).click();
    await settle();
    expect(asked).toEqual([day(10, 26)]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-activity-calendar description="Every review." .weeks=${8} .end=${END} .days=${DAYS} .selected=${day(10, 26)}></tc-activity-calendar>
        <tc-activity-calendar look="clean" .weeks=${8} .end=${END} .days=${DAYS}></tc-activity-calendar>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
