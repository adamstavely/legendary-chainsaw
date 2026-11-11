/*
 * <tc-active-days> in real browsers: a block per month from the first with data, each day a ring towards the goal –
 * met, part, no data, still to come – the month's days at goal, best streak and busiest weekday following the focused
 * month, the readout, selecting a day, the grid keyboard with month jumps, week-start, `month`, controlled use, the
 * React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/active-days";
import type { ActiveDaysDateChange, ActiveDaysDay, TcActiveDays } from "../../src/elements/active-days";
import { ActiveDays } from "../../src/elements/react/active-days";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** Today is Tuesday 27 October 2026 */
const NOW = new Date(2026, 9, 27, 15).getTime();
/** October: the 20th–22nd and the 26th meet the goal of 40 (a streak of three), Tuesdays are busiest; the 23rd has no
 *  data; September has one quiet Tuesday */
const DAYS: ActiveDaysDay[] = [
  { date: "2026-09-15", value: 10 },
  { date: "2026-10-20", value: 50 },
  { date: "2026-10-21", value: 45 },
  { date: "2026-10-22", value: 40 },
  { date: "2026-10-23", value: null },
  { date: "2026-10-26", value: 44 },
  { date: "2026-10-27", value: 20 },
  { date: "2026-10-27", value: 11 },
  { date: "not a date", value: 99 },
];

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcActiveDays>(html`<tc-active-days look=${look} unit="reviews" goal="40" .now=${NOW} .days=${DAYS}></tc-active-days>`);
const cell = (el: Element, iso: string) => el.querySelector<HTMLElement>(`[data-date="${iso}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const long = (y: number, m: number, d: number) => new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(y, m - 1, d, 12));
const facts = (el: Element) => [...el.querySelectorAll(".ui-acd__stat dd")].map((d) => d.textContent!.trim());

describe("tc-active-days", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid with a block per month and the weekdays, one tab stop on today`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("acd");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Active days");
      const monthName = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
      expect([...grid.querySelectorAll(".ui-acd__month-name")].map((m) => m.textContent)).toEqual([monthName.format(new Date(2026, 8, 1)), monthName.format(new Date(2026, 9, 1))]);
      // Sunday first
      expect([...grid.querySelectorAll('[role="columnheader"] .ui-acd__sr')].map((h) => h.textContent)).toEqual(
        [4, 5, 6, 7, 8, 9, 10].map((d) => new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date(1970, 0, d, 12))),
      );
      // October 2026 starts on a Thursday: four blanks, then 31 days over five weeks
      const oct = grid.querySelector('[data-month="2026-10"]')!;
      expect(oct.querySelectorAll("tr")).toHaveLength(6);
      expect(oct.querySelectorAll("[data-out]")).toHaveLength(4);
      expect(oct.querySelectorAll("[data-date]")).toHaveLength(31);
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(cell(el, "2026-10-27").tabIndex).toBe(0);
      expect(cell(el, "2026-10-27").hasAttribute("data-today")).toBe(true);
    });
  }

  test("each day: met, part of the goal, no data or still to come – with its ring, check and name", async () => {
    const el = await make();
    const state = (iso: string) => cell(el, iso).dataset.state;
    expect(["2026-10-20", "2026-10-22", "2026-10-27", "2026-10-23", "2026-10-05", "2026-10-28"].map(state)).toEqual(["met", "met", "part", "none", "none", "future"]);
    expect(cell(el, "2026-10-20").querySelector(".ui-acd__check")).toBeTruthy();
    expect(cell(el, "2026-10-27").querySelector(".ui-acd__check")).toBeNull();
    expect(cell(el, "2026-10-28").querySelector(".ui-acd__ring")).toBeNull();
    // Two entries on the 27th add up: 31 of 40 – the ring is 77.5% filled
    const fill = cell(el, "2026-10-27").querySelector(".ui-acd__fill")!;
    const c = +fill.getAttribute("stroke-dasharray")!;
    expect(1 - +fill.getAttribute("stroke-dashoffset")! / c).toBeCloseTo(0.775, 2);
    expect(cell(el, "2026-10-26").getAttribute("aria-label")).toBe(`Goal met: 44 reviews, 110% of the goal, ${long(2026, 10, 26)}`);
    expect(cell(el, "2026-10-27").getAttribute("aria-label")).toBe(`31 reviews, 78% of the goal, ${long(2026, 10, 27)}`);
    expect(cell(el, "2026-10-23").getAttribute("aria-label")).toBe(`No data, ${long(2026, 10, 23)}`);
    expect(cell(el, "2026-10-29").getAttribute("aria-label")).toBe(`${long(2026, 10, 29)}, upcoming`);
  });

  test("the header counts the month's days at goal; the facts give the goal, best streak and busiest weekday – for the focused month", async () => {
    const el = await make();
    const count = () => el.querySelector(".ui-acd__total-value")!.textContent;
    expect(count()).toBe("4 days at goal");
    expect(el.querySelector(".ui-acd__total-label")!.textContent).toBe(new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(2026, 9, 1)));
    const tuesday = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date(2026, 9, 27, 12));
    expect(facts(el)).toEqual(["40 reviews a day", "3 days", tuesday]);
    cell(el, "2026-09-15").focus();
    await settle();
    expect(count()).toBe("0 days at goal");
    expect(facts(el)).toEqual(["40 reviews a day", "0 days", tuesday]);
    el.goal = 10;
    await settle();
    expect(count()).toBe("1 day at goal");
    expect(facts(el)[1]).toBe("1 day");
  });

  test("the readout shows the day under the pointer or focus, else the selected day", async () => {
    const el = await make();
    const readout = () => el.querySelector(".ui-acd__readout")!.textContent!.replace(/\s+/g, " ").trim();
    const short = (m: number, d: number) => new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(2026, m - 1, d, 12));
    expect(readout()).toBe("Point at a day to see how close it came to the goal");
    cell(el, "2026-10-21").dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(readout()).toBe(`45 reviews · 113% of the goal on ${short(10, 21)}`);
    el.querySelector(".ui-acd__scroll")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(readout()).toBe("Point at a day to see how close it came to the goal");
    cell(el, "2026-10-30").focus();
    await settle();
    expect(readout()).toBe(`${short(10, 30)} is still to come`);
    cell(el, "2026-10-23").focus();
    await settle();
    expect(readout()).toBe(`No data on ${short(10, 23)}`);
  });

  test("click or Enter selects a day; again or Escape clears it; tc-date-change fires with the value", async () => {
    const el = await make();
    const seen: ActiveDaysDateChange[] = [];
    el.addEventListener("tc-date-change", (e) => seen.push((e as CustomEvent<ActiveDaysDateChange>).detail));
    cell(el, "2026-10-26").click();
    await settle();
    expect(el.date).toBe("2026-10-26");
    expect(cell(el, "2026-10-26").getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe(`Selected ${long(2026, 10, 26)}: 44 reviews`);
    key(cell(el, "2026-10-26"), "Enter");
    await settle();
    expect(el.date).toBeNull();
    key(cell(el, "2026-10-23"), " ");
    await settle();
    key(cell(el, "2026-10-23"), "Escape");
    await settle();
    expect(el.date).toBeNull();
    expect(seen).toEqual([
      { date: "2026-10-26", value: 44 },
      { date: null, value: undefined },
      { date: "2026-10-23", value: null },
      { date: null, value: undefined },
    ]);
  });

  test("keyboard: ← → a day, ↑ ↓ a week, Home / End the week's ends, Page keys a month, kept within the months shown", async () => {
    const el = await make();
    const at = () => (document.activeElement as HTMLElement | null)?.dataset.date;
    cell(el, "2026-10-27").focus();
    const press = async (k: string, want: string) => {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    };
    await press("ArrowLeft", "2026-10-26");
    await press("ArrowRight", "2026-10-27");
    await press("ArrowUp", "2026-10-20");
    await press("ArrowDown", "2026-10-27");
    await press("Home", "2026-10-25");
    await press("End", "2026-10-31");
    // Past the last day shown: stays on it
    await press("ArrowDown", "2026-10-31");
    // October 31 → September 30, the shorter month's last day
    await press("PageUp", "2026-09-30");
    await press("PageUp", "2026-09-01");
    await press("ArrowLeft", "2026-09-01");
    await press("PageDown", "2026-10-01");
    expect(el.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
  });

  test("`month` adds later months and is scrolled into view; week-start moves the columns", async () => {
    const el = await fixture<TcActiveDays>(html`<tc-active-days goal="40" month="2026-12" week-start="1" .now=${NOW} .days=${DAYS}></tc-active-days>`);
    await settle();
    expect([...el.querySelectorAll("[data-month]")].map((m) => m.getAttribute("data-month"))).toEqual(["2026-09", "2026-10", "2026-11", "2026-12"]);
    const scroll = el.querySelector<HTMLElement>(".ui-acd__scroll")!;
    expect(scroll.scrollTop).toBeGreaterThan(0);
    // Monday first: December 1 2026 is a Tuesday, one blank before it
    expect(el.querySelector('[data-month="2026-12"] tr:nth-child(2)')!.querySelectorAll("[data-out]")).toHaveLength(1);
    // Today isn't in December: the tab stop is its 1st
    expect(cell(el, "2026-12-01").tabIndex).toBe(0);
    expect(el.querySelector(".ui-acd__total-value")!.textContent).toBe("0 days at goal");
  });

  test("controlled: preventDefault() keeps the selection; a day outside the months shown clears", async () => {
    const el = await fixture<TcActiveDays>(html`<tc-active-days goal="40" .now=${NOW} .days=${DAYS} date="2026-10-05"></tc-active-days>`);
    el.addEventListener("tc-date-change", (e) => e.preventDefault());
    expect(cell(el, "2026-10-05").tabIndex).toBe(0);
    cell(el, "2026-10-26").click();
    await settle();
    expect(el.date).toBe("2026-10-05");
    el.days = DAYS.filter((d) => d.date.startsWith("2026-09"));
    await settle();
    expect(el.date).toBeNull();
  });

  test("an empty element renders without errors; the heading can be renamed", async () => {
    const el = await fixture<TcActiveDays>(html`<tc-active-days heading="Check-ins"></tc-active-days>`);
    expect(el.querySelector(".ui-acd__empty")).toBeTruthy();
    expect(el.querySelector('[role="grid"]')).toBeNull();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Check-ins");
    el.month = "2026-10";
    el.now = NOW;
    await settle();
    expect(el.querySelectorAll("[data-date]")).toHaveLength(31);
  });

  test("React wrapper: an uncontrolled selection survives parent re-renders; onDateChange gets the value", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ActiveDays, {
        title: "Daily reviews",
        days: DAYS,
        goal: 40,
        now: NOW,
        onDateChange: (d, v) => void seen.push([d, v]),
        "data-n": n,
      } as React.ComponentProps<typeof ActiveDays>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-active-days")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Daily reviews");
    cell(el, "2026-10-21").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.date).toBe("2026-10-21");
    expect(seen).toEqual([["2026-10-21", 45]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(ActiveDays, { days: DAYS, goal: 40, now: NOW, date: null, onDateChange: (d) => void asked.push(d) })));
    await settle();
    const el = host.querySelector("tc-active-days")!;
    cell(el, "2026-10-26").click();
    await settle();
    expect(asked).toEqual(["2026-10-26"]);
    expect(el.date).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-active-days description="Records reviewed." unit="reviews" goal="40" .now=${NOW} .days=${DAYS} date="2026-10-26"></tc-active-days>
        <tc-active-days look="clean" goal="40" .now=${NOW} .days=${DAYS}></tc-active-days>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
