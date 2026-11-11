/*
 * <tc-week-bars> in real browsers: the looks and the plot's one tab stop, the total and average, goal colours and the
 * goal line, the keys and the announcements, the week switcher (and preventing it), the table view, empty and narrow,
 * the entrance and the glide, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/week-bars";
import type { TcWeekBars, WeekBarsWeek } from "../../src/elements/week-bars";
import { WeekBars } from "../../src/elements/react/week-bars";
import { cleanup, finish, fixture, parkPointer, settle } from "./helpers";

afterEach(cleanup);

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const week = (label: string, values: number[]): WeekBarsWeek => ({ label, days: DAYS.map((d, i) => ({ label: d, value: values[i] })) });
const WEEKS = [week("Mar 10–16", [300, 300, 300, 300, 300, 100, 50]), week("Mar 17–23", [450, 500, 350, 400, 0, 0, 0])];

const make = (o: { look?: "standard" | "clean"; width?: number; weeks?: WeekBarsWeek[]; still?: boolean; goal?: number } = {}) =>
  fixture<HTMLElement>(
    html`<div style=${`width: ${o.width ?? 520}px`}><tc-week-bars look=${o.look ?? "standard"} heading="Documents reviewed" .goal=${o.goal ?? 400} today="3" ?still=${o.still ?? true} .weeks=${o.weeks ?? WEEKS}></tc-week-bars></div>`,
  ).then((w) => w.querySelector<TcWeekBars>("tc-week-bars")!);
const plot = (el: Element) => el.querySelector<HTMLElement>(".ui-wkb__plot")!;
const days = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-wkb__day")];
const barH = (el: Element, i: number) => days(el)[i].querySelector<HTMLElement>(".ui-wkb__bar")!.getBoundingClientRect().height;
const big = (el: Element) => el.querySelector(".ui-wkb__big")!.textContent!.trim();
const caption = (el: Element) => el.querySelector(".ui-wkb__caption")!.textContent!.replace(/\s+/g, " ").trim();
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-week-bars", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the plot group named by the heading, one tab stop`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("wkb");
      expect(el.dataset.look).toBe(look);
      const p = plot(el);
      expect(p.getAttribute("role")).toBe("group");
      expect(p.tabIndex).toBe(0);
      expect(document.getElementById(p.getAttribute("aria-labelledby")!)!.textContent).toBe("Documents reviewed");
      expect(el.querySelector(".ui-wkb__bars")!.getAttribute("aria-hidden")).toBe("true");
      expect([...el.querySelectorAll(".ui-wkb__step")].map((b) => b.textContent!.trim())).toEqual(["Previous week", "Next week"]);
    });
  }

  test("the last week by default: total, average, goal colours, today, and the words", async () => {
    const el = await make();
    expect(el.shownWeek).toBe(1);
    expect(el.querySelector(".ui-wkb__week")!.textContent).toBe("Mar 17–23");
    expect(big(el)).toBe("1,700");
    expect(caption(el)).toBe("Total · 243 a day");
    expect(days(el).map((d) => d.hasAttribute("data-met"))).toEqual([true, true, false, true, false, false, false]);
    expect(days(el).map((d) => d.hasAttribute("data-today"))).toEqual([false, false, false, true, false, false, false]);
    expect(el.querySelector(".ui-wkb__goal-label")!.textContent).toBe("Goal 400");
    // One scale for every week: 500 is the tallest of them, the bars in proportion
    expect(barH(el, 0) / barH(el, 1)).toBeCloseTo(0.9, 1);
    const read = document.getElementById(plot(el).getAttribute("aria-describedby")!.split(" ")[0])!.textContent!;
    expect(read).toContain("Tue: 500, goal met");
    expect(read).toContain("Thu: 400, goal met, today");
    expect(read).toContain("Wed: 350, under goal");
    expect(read).toContain("Total 1,700.");
  });

  test("the goal line sits at the goal's height on the bars' scale", async () => {
    const el = await make();
    const goal = el.querySelector<HTMLElement>(".ui-wkb__goal")!.getBoundingClientRect();
    const col = days(el)[3].querySelector<HTMLElement>(".ui-wkb__col")!.getBoundingClientRect();
    const bar = days(el)[3].querySelector<HTMLElement>(".ui-wkb__bar")!.getBoundingClientRect();
    expect(goal.top).toBeGreaterThan(col.top);
    // Thursday's 400 reaches the line
    expect(Math.abs(goal.top - bar.top)).toBeLessThan(2);
  });

  test("keys move day to day and announce it; the headline follows; Escape lets go", async () => {
    const el = await make();
    const p = plot(el);
    p.focus();
    key(p, "ArrowRight");
    await settle();
    expect(status(el)).toBe("Mon: 450, goal met, 1 of 7");
    expect(big(el)).toBe("450");
    expect(caption(el)).toBe("Mon");
    expect(days(el)[0].querySelector(".ui-wkb__value")!.textContent).toBe("450");
    key(p, "End");
    await settle();
    expect(status(el)).toBe("Sun: 0, under goal, 7 of 7");
    key(p, "ArrowLeft");
    key(p, "ArrowLeft");
    key(p, "ArrowLeft");
    await settle();
    expect(status(el)).toBe("Thu: 400, goal met, today, 4 of 7");
    key(p, "Escape");
    await settle();
    expect(status(el)).toBe("");
    expect(big(el)).toBe("1,700");
  });

  test("pointing at a day outlines it and shows its value; leaving goes back", async () => {
    const el = await make();
    await userEvent.hover(days(el)[1]);
    await expect.poll(() => big(el)).toBe("500");
    expect(days(el)[1].hasAttribute("data-on")).toBe(true);
    expect(plot(el).hasAttribute("data-active")).toBe(true);
    await parkPointer();
    await expect.poll(() => big(el)).toBe("1,700");
  });

  test("the switcher and PageUp/PageDown change the week; the ends disable; prevented, the week stays", async () => {
    const el = await make();
    const [prev, next] = [...el.querySelectorAll<HTMLButtonElement>(".ui-wkb__step")];
    expect(next.disabled).toBe(true);
    const seen: number[] = [];
    el.addEventListener("tc-week-change", (e) => seen.push((e as CustomEvent).detail.week));
    prev.click();
    await settle();
    expect(el.week).toBe(0);
    expect(el.querySelector(".ui-wkb__week")!.textContent).toBe("Mar 10–16");
    expect(big(el)).toBe("1,650");
    expect(prev.disabled).toBe(true);
    // Today belongs to the last week only
    expect(days(el).some((d) => d.hasAttribute("data-today"))).toBe(false);
    key(plot(el), "PageDown");
    await settle();
    expect(el.week).toBe(1);
    expect(seen).toEqual([0, 1]);
    el.addEventListener("tc-week-change", (e) => e.preventDefault());
    key(plot(el), "PageUp");
    await settle();
    expect(el.week).toBe(1);
  });

  test("the Table button shows the days with the goal column; prevented, the view stays", async () => {
    const el = await make();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-wkb__toggle")!;
    toggle.click();
    await settle();
    expect(el.view).toBe("table");
    expect([...el.querySelectorAll(".ui-wkb__table thead th")].map((t) => t.textContent)).toEqual(["Day", "Total", "Goal 400"]);
    expect([...el.querySelectorAll(".ui-wkb__table tbody tr")][3].textContent!.replace(/\s+/g, " ").trim()).toBe("Thu today 400 goal met");
    expect(el.querySelector(".ui-wkb__plot")).toBeNull();
    el.addEventListener("tc-view-change", (e) => e.preventDefault());
    toggle.click();
    await settle();
    expect(el.view).toBe("table");
  });

  test("no goal: every bar in the accent; empty data; the narrow day names", async () => {
    const el = await make();
    el.goal = undefined;
    await settle();
    expect(days(el).every((d) => d.hasAttribute("data-met"))).toBe(true);
    expect(el.querySelector(".ui-wkb__goal")).toBeNull();
    el.weeks = [];
    await settle();
    expect(el.querySelector(".ui-wkb__empty")!.textContent).toBe("No days yet");
    expect(el.querySelector(".ui-wkb__switch")).toBeNull();
    const narrow = await make({ width: 300 });
    expect(getComputedStyle(narrow.querySelector(".ui-wkb__long")!).display).toBe("none");
    expect(narrow.querySelector(".ui-wkb__short")!.textContent).toBe("M");
    expect(getComputedStyle(narrow.querySelector(".ui-wkb__short")!).display).not.toBe("none");
  });

  test("the bars grow in once on screen and glide to another week", async () => {
    const el = await make({ still: false });
    await expect.poll(() => barH(el, 1), { timeout: 4000 }).toBeGreaterThan(130);
    const before = barH(el, 0);
    el.week = 0;
    await settle();
    await expect.poll(() => barH(el, 0), { timeout: 4000 }).toBeLessThan(before * 0.75);
    await expect.poll(() => big(el), { timeout: 4000 }).toBe("1,650");
  });

  test("React: an uncontrolled week survives re-renders; a controlled one stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "520px";
    const root = createRoot(host);
    const render = (extra: Record<string, unknown> = {}) => act(async () => root.render(React.createElement(WeekBars, { title: "Reviewed", weeks: WEEKS, goal: 400, still: true, ...extra })));
    await render();
    const el = host.querySelector<TcWeekBars>("tc-week-bars")!;
    await settle();
    expect(el.heading).toBe("Reviewed");
    expect(el.shownWeek).toBe(1);
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-wkb__step")!.click());
    expect(el.shownWeek).toBe(0);
    await render({ description: "re-rendered" });
    expect(el.shownWeek).toBe(0);
    const asked: number[] = [];
    await render({ week: 1, onWeekChange: (w: number) => asked.push(w) });
    expect(el.shownWeek).toBe(1);
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-wkb__step")!.click());
    expect(asked).toEqual([0]);
    expect(el.shownWeek).toBe(1);
    await render({ week: 0 });
    expect(el.shownWeek).toBe(0);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const look of ["standard", "clean"] as const) {
    for (const scheme of ["light", "dark"] as const) {
      test(`axe: ${look}, ${scheme}`, async () => {
        document.documentElement.style.colorScheme = scheme;
        const wrap = await fixture<HTMLElement>(html`<div style="width: 520px; background: var(--tc-surface-raised)">
          <tc-week-bars look=${look} heading="Documents reviewed" goal="400" today="3" .weeks=${WEEKS}></tc-week-bars>
        </div>`);
        await finish(wrap);
        const el = wrap.querySelector<TcWeekBars>("tc-week-bars")!;
        key(plot(el), "ArrowRight");
        await settle();
        const { violations } = await axe.run(wrap);
        document.documentElement.style.colorScheme = "";
        expect(violations.map((v) => v.id)).toEqual([]);
      });
    }
  }
});
