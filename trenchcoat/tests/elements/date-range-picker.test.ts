/*
 * <tc-date-range-picker> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/date-range-picker";
import { compareDateRange, type DateRangeValueChange, type TcDateRangePicker } from "../../src/elements/date-range-picker";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const today = new Date(2026, 9, 8);
const value = { start: new Date(2026, 9, 2), end: new Date(2026, 9, 8) };
const cell = (el: Element, d: Date) => el.querySelector<HTMLButtonElement>(`[data-day="${new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()}"]`)!;
const button = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name)!;
const radios = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const formValue = (el: Element) => el.querySelector<HTMLInputElement>('input[type="hidden"]')!.value;

describe("tc-date-range-picker", () => {
  test("the host is the root; Previous year maps Feb 29 to Feb 28, not Mar 1", async () => {
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .today=${today}></tc-date-range-picker>`);
    expect(el.dataset.ui).toBe("drp");
    expect(el.dataset.look).toBe("standard");
    const r = compareDateRange({ start: new Date(2028, 1, 1), end: new Date(2028, 1, 29) }, "year")!;
    expect(r.start).toEqual(new Date(2027, 1, 1));
    expect(r.end).toEqual(new Date(2027, 1, 28));
  });

  test("a value with a time of day highlights its start day and matches presets", async () => {
    const v = { start: new Date(2026, 9, 2, 15, 30), end: new Date(2026, 9, 8, 15, 30) };
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .value=${v} .today=${today} open></tc-date-range-picker>`);
    expect(cell(el, v.start).parentElement!.hasAttribute("data-start")).toBe(true);
    expect(cell(el, v.end).parentElement!.hasAttribute("data-end")).toBe(true);
    expect(button(el, "Last 7 days").getAttribute("aria-pressed")).toBe("true");
  });

  test("PageUp/PageDown keep the day, clamped to the target month's length", async () => {
    const max = new Date(2027, 0, 1);
    const cases: [from: Date, key: string, to: Date][] = [
      [new Date(2026, 2, 31), "PageDown", new Date(2026, 3, 30)],
      [new Date(2026, 4, 31), "PageUp", new Date(2026, 3, 30)],
      [new Date(2026, 0, 31), "PageDown", new Date(2026, 1, 28)],
    ];
    for (const [from, key, to] of cases) {
      const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .value=${{ start: new Date(from.getFullYear(), from.getMonth(), 1), end: from }} .max=${max} open></tc-date-range-picker>`);
      cell(el, from).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
      await settle();
      expect(cell(el, to).tabIndex).toBe(0);
      cleanup();
    }
  });

  test("keyboard: arrows move the focus day by day, Enter picks, Escape closes back to the trigger", async () => {
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .value=${value} .today=${today}></tc-date-range-picker>`);
    const trigger = el.querySelector<HTMLButtonElement>(".ui-drp__trigger")!;
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(document.activeElement).toBe(cell(el, value.end));
    await userEvent.keyboard("{ArrowLeft}");
    await settle();
    expect(document.activeElement).toBe(cell(el, new Date(2026, 9, 7)));
    await userEvent.keyboard("{ArrowUp}");
    await settle();
    expect(document.activeElement).toBe(cell(el, new Date(2026, 8, 30)));
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(el.querySelector('.ui-drp__foot [role="status"]')!.textContent).toBe("Start Sep 30, 2026 – pick an end");
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test("today defaults to the real day, read on connect: the last 30 days", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 8, 15));
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker name="p"></tc-date-range-picker>`);
    expect(formValue(el)).toBe("2026-09-09/2026-10-08");
    expect(el.textContent).toContain("Sep 9 – Oct 8, 2026");
    el.open = true;
    await settle();
    expect(cell(el, new Date(2026, 9, 8)).getAttribute("aria-current")).toBe("date");
  });

  test("name submits the applied range; disabled blocks the trigger and leaves the form", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><tc-date-range-picker .value=${{ start: new Date(2026, 9, 1), end: today }} name="period" .today=${today}></tc-date-range-picker></form>`);
    const el = form.querySelector("tc-date-range-picker")!;
    expect(new FormData(form).get("period")).toBe("2026-10-01/2026-10-08");
    el.disabled = true;
    el.open = true;
    await settle();
    expect(new FormData(form).get("period")).toBeNull();
    expect(el.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!.disabled).toBe(true);
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  test("controlled: preventDefault keeps value, open and compare-mode; Apply reports the range and the compare mode", async () => {
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .today=${today} open compare-mode="off"></tc-date-range-picker>`);
    const changes: DateRangeValueChange[] = [];
    const opens: boolean[] = [];
    el.addEventListener("tc-value-change", (e) => {
      e.preventDefault();
      changes.push((e as unknown as CustomEvent<DateRangeValueChange>).detail);
    });
    el.addEventListener("tc-open-change", (e) => {
      e.preventDefault();
      opens.push((e as CustomEvent).detail.open);
    });
    el.addEventListener("tc-compare-change", (e) => e.preventDefault());
    button(el, "Last 7 days").click();
    await settle();
    radios(el).find((r) => r.textContent === "Previous year")!.click();
    await settle();
    button(el, "Apply").click();
    await settle();
    expect(changes).toEqual([{ value: { start: new Date(2026, 9, 2), end: today }, compare: { start: new Date(2025, 9, 2), end: new Date(2025, 9, 8) }, mode: "year" }]);
    expect(opens).toEqual([false]);
    expect(el.querySelector('[role="dialog"]')).toBeTruthy();
    expect(el.querySelector(".ui-drp__trigger-compare")).toBeNull();
    expect(el.querySelector(".ui-drp__trigger-range")!.textContent).toBe("Sep 9 – Oct 8, 2026");
    // Then the page passes the values back
    for (const v of [value, { start: new Date(2026, 8, 1), end: new Date(2026, 8, 30) }]) {
      el.value = v;
      await settle();
      expect(el.querySelector(".ui-drp__trigger-range")!.textContent).toMatch(v === value ? "Oct 2 – Oct 8, 2026" : "Sep 1 – Sep 30, 2026");
    }
    el.compareMode = "year";
    el.open = false;
    await settle();
    expect(el.querySelector(".ui-drp__trigger-compare")).toBeTruthy();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  test("uncontrolled: Apply applies the range and the mode, and closes", async () => {
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .today=${today} name="p" open></tc-date-range-picker>`);
    button(el, "Last 7 days").click();
    await settle();
    button(el, "Apply").click();
    await settle();
    expect(formValue(el)).toBe("2026-10-02/2026-10-08");
    expect(el.querySelector('[role="dialog"]')).toBeNull();
    expect(el.querySelector(".ui-drp__trigger-compare")!.textContent).toBe("vs. Sep 25 – Oct 1, 2026");
  });

  test("a click outside closes the panel", async () => {
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .today=${today} open></tc-date-range-picker>`);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(el.open).toBe(false);
  });

  test("presets are toggle buttons in a group – no listbox", async () => {
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .today=${today} .value=${value} open></tc-date-range-picker>`);
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(el.querySelector('[role="group"][aria-label="Presets"]')).toBeTruthy();
    expect(button(el, "Last 7 days").getAttribute("aria-pressed")).toBe("true");
  });

  test("Compare: one tab stop, arrow keys move and select", async () => {
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .today=${today} .value=${value} open compare-mode="off"></tc-date-range-picker>`);
    expect(radios(el).map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    radios(el)[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await settle();
    expect(radios(el)[1].getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(radios(el)[1]);
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{ArrowLeft}");
    await settle();
    expect(radios(el)[2].getAttribute("aria-checked")).toBe("true");
  });

  test("opening from the trigger moves focus onto the focused day; picks are announced", async () => {
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .today=${today} .value=${value}></tc-date-range-picker>`);
    el.querySelector<HTMLButtonElement>('[aria-expanded="false"]')!.click();
    await settle();
    expect(document.activeElement).toBe(cell(el, value.end));
    const said = () => [...el.querySelectorAll('[role="status"]')].map((r) => r.textContent);
    cell(el, new Date(2026, 9, 5)).click();
    await settle();
    expect(said()).toContain("Start Oct 5, 2026 – pick an end");
    cell(el, new Date(2026, 9, 7)).click();
    await settle();
    expect(said()).toContain("Oct 5 – Oct 7, 2026, 3 days");
  });

  test("months: next and previous move both calendars", async () => {
    const el = await fixture<TcDateRangePicker>(html`<tc-date-range-picker .today=${today} .value=${value} open></tc-date-range-picker>`);
    const names = () => [...el.querySelectorAll(".ui-drp__month-name")].map((n) => n.textContent);
    expect(names()).toEqual(["September 2026", "October 2026"]);
    button(el, "Previous month").click();
    await settle();
    expect(names()).toEqual(["August 2026", "September 2026"]);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-date-range-picker .today=${today} .value=${value} open></tc-date-range-picker>
      <div style="height: 560px"></div>
      <tc-date-range-picker look="clean" .today=${today} .value=${value} open></tc-date-range-picker>
    </div>`);
    for (const a of wrap.getAnimations({ subtree: true })) a.finish();
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
