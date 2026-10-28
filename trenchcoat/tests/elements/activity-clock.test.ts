/*
 * <tc-activity-clock> in real browsers: a clock per day with AM and PM rings, shading by level, no data vs nothing,
 * the middle's total and hour, selecting an hour, the grid keyboard, controlled use, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/activity-clock";
import type { ActivityDay, ActivityHourRef, ActivitySelectedChange, TcActivityClock } from "../../src/elements/activity-clock";
import { ActivityClock } from "../../src/elements/react/activity-clock";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const MON = new Date(2026, 9, 26, 12).getTime();
const TUE = new Date(2026, 9, 27, 12).getTime();
/** Mon: 0 at night, 10 at 9 AM, 40 at 3 PM (the busiest), 20 at 3 AM · Tue: no data from 10 PM, 5 at noon */
const monday = Array.from({ length: 24 }, (_, h) => (h === 9 ? 10 : h === 15 ? 40 : h === 3 ? 20 : 0));
const tuesday: (number | null)[] = Array.from({ length: 24 }, (_, h) => (h >= 22 ? null : h === 12 ? 5 : 1));
const DAYS: ActivityDay[] = [
  { date: MON, values: monday },
  { date: TUE, label: "Today", values: tuesday },
];

const seg = (el: Element, d: number, h: number) => el.querySelector<SVGElement>(`[data-hour="${d}:${h}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const click = (target: Element) => target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
const centre = (el: Element, d: number) => [...el.querySelectorAll(".ui-aclk__centre")[d].children].map((s) => s.textContent).join(" ");
const make = (look: "standard" | "clean" = "standard", selected: ActivityHourRef | null = null) =>
  fixture<TcActivityClock>(html`<tc-activity-clock look=${look} unit="runs" description="Every run." .days=${DAYS} .selected=${selected}></tc-activity-clock>`);

describe("tc-activity-clock", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid with a row per day, 24 hour cells on two rings and one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("aclk");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Activity");
      const rows = grid.querySelectorAll('[role="row"]');
      expect(rows).toHaveLength(2);
      expect(rows[0].getAttribute("aria-label")).toBe(new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(MON));
      expect(rows[1].getAttribute("aria-label")).toBe("Today");
      expect(rows[0].querySelectorAll('[role="gridcell"]')).toHaveLength(24);
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(seg(el, 0, 0).getAttribute("tabindex")).toBe("0");
      expect([0, 11, 12, 23].map((h) => seg(el, 0, h).dataset.ring)).toEqual(["am", "am", "pm", "pm"]);
      // Each ring is labelled: AM inside the inner ring, PM above the outer one
      const labels = rows[0].querySelectorAll<HTMLElement>(".ui-aclk__ring-label");
      expect([...labels].map((l) => [l.dataset.ring, l.textContent])).toEqual([["pm", "PM"], ["am", "AM"]]);
      const face = rows[0].querySelector(".ui-aclk__face")!.getBoundingClientRect();
      expect(labels[0].getBoundingClientRect().bottom).toBeLessThanOrEqual(face.top + 1);
      const am = labels[1].getBoundingClientRect();
      const noonInner = seg(el, 0, 0).getBoundingClientRect();
      expect(am.top).toBeGreaterThanOrEqual(noonInner.top);
      // The middle of each clock: the weekday and date, or the label and date
      expect([centre(el, 0), centre(el, 1)]).toEqual([`${new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(MON)} 26`, "Today 27"]);
    });
  }

  test("segments sit where their hour is on a clock face: 3 PM on the outer ring at 3 o'clock, 9 AM inner at 9", async () => {
    const el = await make();
    const face = el.querySelector(".ui-aclk__face")!.getBoundingClientRect();
    const middle = (d: number, h: number) => {
      const r = seg(el, d, h).getBoundingClientRect();
      return { x: (r.left + r.right) / 2 - (face.left + face.width / 2), y: (r.top + r.bottom) / 2 - (face.top + face.height / 2) };
    };
    const threePm = middle(0, 15);
    expect(threePm.x).toBeGreaterThan(0);
    expect(Math.abs(threePm.y)).toBeLessThan(face.height * 0.2);
    const nineAm = middle(0, 9);
    expect(nineAm.x).toBeLessThan(0);
    // The inner ring is nearer the middle than the outer one
    expect(Math.abs(nineAm.x)).toBeLessThan(Math.abs(middle(0, 21).x));
    const noon = middle(0, 12);
    expect(noon.y).toBeLessThan(0);
  });

  test("levels: scaled to the busiest hour shown; 0 is empty; no data is outlined, not shaded; `max` and `levels` change the scale", async () => {
    const el = await make();
    const level = (d: number, h: number) => seg(el, d, h).dataset.level;
    // 40 is the top: 40 → 4, 20 → 2, 10 → 1, 5 → 1, 0 → 0
    expect([level(0, 15), level(0, 3), level(0, 9), level(1, 12), level(0, 0)]).toEqual(["4", "2", "1", "1", "0"]);
    expect(level(1, 22)).toBe("none");
    expect(getComputedStyle(seg(el, 1, 22)).strokeDasharray).not.toBe("none");
    // Shaded segments mix in more ink as they get busier
    const mix = (d: number, h: number) => parseFloat(seg(el, d, h).style.getPropertyValue("--tc-aclk-mix"));
    expect(mix(0, 15)).toBe(100);
    expect(mix(0, 9)).toBeLessThan(mix(0, 3));
    expect(getComputedStyle(seg(el, 0, 15)).fill).not.toBe(getComputedStyle(seg(el, 0, 0)).fill);
    el.max = 80;
    await settle();
    expect([level(0, 15), level(0, 3)]).toEqual(["2", "1"]);
    el.max = undefined;
    el.levels = 3;
    await settle();
    expect([level(0, 15), level(0, 3), level(0, 9)]).toEqual(["2", "1", "1"]);
    // The legend shows one swatch per level, and "No data" because some hours have none
    expect(el.querySelectorAll(".ui-aclk__swatches .ui-aclk__swatch")).toHaveLength(3);
    expect(el.querySelector(".ui-aclk__legend")!.textContent).toContain("No data");
    el.days = [DAYS[0]];
    await settle();
    expect(el.querySelector(".ui-aclk__legend")!.textContent).not.toContain("No data");
  });

  test("cells read their hour range and value; the middle shows the day, then the hour on hover or focus; the header names the busiest hour", async () => {
    const el = await make();
    const WEEKDAY = `${new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(MON)} 26`;
    expect(seg(el, 0, 15).getAttribute("aria-label")).toBe("3 PM to 4 PM, 40 runs");
    expect(seg(el, 0, 11).getAttribute("aria-label")).toBe("11 AM to 12 PM, 0 runs");
    expect(seg(el, 1, 23).getAttribute("aria-label")).toBe("11 PM to 12 AM, no data");
    expect(centre(el, 0)).toBe(WEEKDAY);
    expect(centre(el, 1)).toBe("Today 27");
    seg(el, 0, 15).dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(centre(el, 0)).toBe("3 PM 40");
    expect(centre(el, 1)).toBe("Today 27");
    el.querySelector(".ui-aclk__face")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(centre(el, 0)).toBe(WEEKDAY);
    seg(el, 1, 23).focus();
    await settle();
    expect(centre(el, 1)).toBe("11 PM –");
    expect(el.querySelector(".ui-aclk__peak")!.textContent).toContain("3 PM");
    // `format` writes values in full
    el.format = (v) => `${v} min`;
    await settle();
    expect(seg(el, 0, 15).getAttribute("aria-label")).toBe("3 PM to 4 PM, 40 min");
  });

  test("click or Enter selects an hour; again or Escape clears it; tc-selected-change fires with the value", async () => {
    const el = await make();
    const seen: ActivitySelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<ActivitySelectedChange>).detail));
    click(seg(el, 0, 15));
    await settle();
    expect(el.selected).toEqual({ date: MON, hour: 15 });
    expect(seg(el, 0, 15).getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toContain("3 PM to 4 PM: 40 runs");
    // The middle keeps showing the selected hour once the pointer leaves
    el.querySelector(".ui-aclk__face")!.dispatchEvent(new PointerEvent("pointerleave"));
    seg(el, 0, 15).blur();
    await settle();
    expect(centre(el, 0)).toBe("3 PM 40");
    key(seg(el, 0, 15), "Enter");
    await settle();
    expect(el.selected).toBeNull();
    key(seg(el, 1, 22), " ");
    await settle();
    expect(el.selected).toEqual({ date: TUE, hour: 22 });
    key(seg(el, 1, 22), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Selection cleared");
    expect(seen).toEqual([
      { selected: { date: MON, hour: 15 }, value: 40 },
      { selected: null, value: undefined },
      { selected: { date: TUE, hour: 22 }, value: null },
      { selected: null, value: undefined },
    ]);
  });

  test("keyboard: ← → move an hour, ↑ ↓ a day, Page keys between AM and PM, Home/End and ⌘/Ctrl+Home/End to the ends", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-hour");
    seg(el, 0, 0).focus();
    const press = async (k: string, init: KeyboardEventInit = {}) => {
      key(document.activeElement!, k, init);
      await expect.poll(() => el.querySelectorAll('[role="gridcell"][tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowRight");
    expect(at()).toBe("0:1");
    await press("ArrowLeft");
    await press("ArrowLeft");
    expect(at()).toBe("0:0");
    await press("PageDown");
    expect(at()).toBe("0:12");
    await press("PageUp");
    expect(at()).toBe("0:0");
    await press("ArrowDown");
    expect(at()).toBe("1:0");
    await press("ArrowDown");
    expect(at()).toBe("1:0");
    await press("End");
    expect(at()).toBe("1:23");
    await press("Home");
    expect(at()).toBe("1:0");
    await press("ArrowUp");
    expect(at()).toBe("0:0");
    await press("End", { ctrlKey: true, metaKey: true });
    expect(at()).toBe("1:23");
    await press("Home", { ctrlKey: true, metaKey: true });
    expect(at()).toBe("0:0");
    expect(seg(el, 0, 0).getAttribute("tabindex")).toBe("0");
  });

  test("controlled: preventDefault() keeps the selection; a selected day going away clears it", async () => {
    const el = await make("standard", { date: TUE, hour: 12 });
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    click(seg(el, 0, 3));
    await settle();
    expect(el.selected).toEqual({ date: TUE, hour: 12 });
    expect(centre(el, 1)).toBe("12 PM 5");
    el.days = [DAYS[0]];
    await settle();
    expect(el.selected).toBeNull();
  });

  test("an empty element renders without errors; the heading can be renamed", async () => {
    const el = await fixture<TcActivityClock>(html`<tc-activity-clock heading="Sign-ins"></tc-activity-clock>`);
    expect(el.querySelector(".ui-aclk__empty")).toBeTruthy();
    expect(el.querySelector('[role="grid"]')).toBeNull();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Sign-ins");
    expect(el.querySelector(".ui-aclk__peak")).toBeNull();
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
      return React.createElement(ActivityClock, {
        title: "Agent runs",
        days: DAYS,
        onSelectedChange: (s, v) => void seen.push([s?.hour ?? null, v]),
        "data-n": n,
      } as React.ComponentProps<typeof ActivityClock>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-activity-clock")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Agent runs");
    seg(el, 0, 3).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toEqual({ date: MON, hour: 3 });
    expect(seen).toEqual([[3, 20]]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (ActivityHourRef | null)[] = [];
    await act(async () => root.render(React.createElement(ActivityClock, { days: DAYS, selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-activity-clock")!;
    seg(el, 0, 9).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();
    expect(asked).toEqual([{ date: MON, hour: 9 }]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-activity-clock description="Every run." .days=${DAYS} .selected=${{ date: MON, hour: 15 }}></tc-activity-clock>
        <tc-activity-clock look="clean" .days=${DAYS}></tc-activity-clock>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
