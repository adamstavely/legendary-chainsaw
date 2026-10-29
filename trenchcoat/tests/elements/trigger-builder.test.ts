/*
 * <tc-trigger-builder> in real browsers: the schedule maths, the sentence, every control, controlled use, the form,
 * focus, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/trigger-builder";
import { describeTrigger, nextTriggerRuns, type TcTriggerBuilder, type TriggerEvent, type TriggerField, type TriggerValue } from "../../src/elements/trigger-builder";
import type { TcCombobox } from "../../src/elements/combobox";
import { TriggerBuilder, type TriggerBuilderProps } from "../../src/elements/react/trigger-builder";
import { cleanup, fixture, settle } from "./helpers";
import { expectReactFormReset } from "./form-reset";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const EVENTS: TriggerEvent[] = [
  {
    id: "deal.stage",
    label: "Deal changes stage",
    phrase: "a deal changes stage",
    group: "Deals",
    fields: [
      { id: "stage", label: "Stage", type: "select", options: ["Lead", "Won", "Lost"] },
      { id: "amount", label: "Amount", type: "number" },
      { id: "owner", label: "Owner" },
    ],
  },
  { id: "form.submitted", label: "Form is submitted", group: "Website", fields: [{ id: "country", label: "Country" }] },
];
/** The wrapper takes React nodes as icons; these events have none */
const WRAPPER_EVENTS = EVENTS as unknown as NonNullable<TriggerBuilderProps["events"]>;
const SCHEDULE_FIELDS: TriggerField[] = [{ id: "open", label: "Open deals", type: "number" }];
/** Monday 26 October 2026, 10:00 local time */
const NOW = new Date(2026, 9, 26, 10, 0).getTime();
const at = (y: number, m: number, d: number, h = 9, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const WEEKLY: TriggerValue = { kind: "schedule", schedule: { frequency: "weekly", days: [1], time: "09:00" }, active: null, conditions: [], match: "all" };
const EVENT: TriggerValue = { kind: "event", event: "deal.stage", conditions: [{ field: "stage", operator: "is", value: "Won" }, { field: "amount", operator: "gt", value: "10000" }], match: "all" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (value: TriggerValue = WEEKLY, extra: { look?: "standard" | "clean"; now?: number } = {}) =>
  fixture<TcTriggerBuilder>(html`<tc-trigger-builder look=${extra.look ?? "standard"} .events=${EVENTS} .scheduleFields=${SCHEDULE_FIELDS} .value=${value} .now=${extra.now ?? NOW}></tc-trigger-builder>`);
const sentence = (el: Element) => el.querySelector(".ui-tgb__sentence")!.textContent;
const runs = (el: Element) => [...el.querySelectorAll(".ui-tgb__run")].map((r) => [...r.children].map((c) => c.textContent).join(" | "));
/** The option of the n-th segmented control with this label */
const segOption = (el: Element, label: string) =>
  [...el.querySelectorAll<HTMLButtonElement>("tc-segmented-control .ui-seg__opt")].find((b) => {
    // Standard draws the label twice (regular and an aria-hidden bold copy that keeps the width)
    const text = b.querySelector(".ui-seg__label")!.textContent!.trim();
    return text === label || text === label + label;
  })!;
const change = async (input: HTMLInputElement | HTMLSelectElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
};

describe("schedule maths", () => {
  test("weekly, daily, hourly and monthly runs after now", () => {
    expect(nextTriggerRuns({ frequency: "weekly", days: [1, 4], time: "09:00" }, NOW, 4)).toEqual([at(2026, 10, 29), at(2026, 11, 2), at(2026, 11, 5), at(2026, 11, 9)]);
    // 9:00 today has passed at 10:00 – the first daily run is tomorrow
    expect(nextTriggerRuns({ frequency: "daily", time: "09:00" }, NOW, 2)).toEqual([at(2026, 10, 27), at(2026, 10, 28)]);
    expect(nextTriggerRuns({ frequency: "daily", time: "18:30" }, NOW, 1)).toEqual([at(2026, 10, 26, 18, 30)]);
    expect(nextTriggerRuns({ frequency: "hourly", time: "00:15" }, NOW, 3)).toEqual([at(2026, 10, 26, 10, 15), at(2026, 10, 26, 11, 15), at(2026, 10, 26, 12, 15)]);
    // The 31st runs on the last day of shorter months
    expect(nextTriggerRuns({ frequency: "monthly", dayOfMonth: 31, time: "17:00" }, NOW, 5)).toEqual([at(2026, 10, 31, 17), at(2026, 11, 30, 17), at(2026, 12, 31, 17), at(2027, 1, 31, 17), at(2027, 2, 28, 17)]);
    // No day picked: no runs
    expect(nextTriggerRuns({ frequency: "weekly", days: [], time: "09:00" }, NOW)).toEqual([]);
  });

  test("an active window starts and stops the runs", () => {
    const active = { start: "2026-11-04", end: "2026-11-12" };
    expect(nextTriggerRuns({ frequency: "weekly", days: [1, 3], time: "09:00" }, NOW, 5, active)).toEqual([at(2026, 11, 4), at(2026, 11, 9), at(2026, 11, 11)]);
    expect(nextTriggerRuns({ frequency: "daily", time: "09:00" }, NOW, 5, { start: "2026-01-01", end: "2026-02-01" })).toEqual([]);
  });

  test("the sentence", () => {
    const s = (schedule: TriggerValue["schedule"], rest: Partial<TriggerValue> = {}) => describeTrigger({ ...WEEKLY, schedule, ...rest }, EVENTS, SCHEDULE_FIELDS);
    expect(s({ frequency: "weekly", days: [1], time: "09:00" })).toBe("Runs every Monday at 9:00 AM.");
    expect(s({ frequency: "weekly", days: [4, 1], time: "13:05" })).toBe("Runs every Monday and Thursday at 1:05 PM.");
    expect(s({ frequency: "weekly", days: [5, 1, 2, 3, 4], time: "08:00" })).toBe("Runs every weekday at 8:00 AM.");
    expect(s({ frequency: "weekly", days: [0, 6], time: "08:00" })).toBe("Runs every Saturday and Sunday at 8:00 AM.");
    expect(s({ frequency: "weekly", days: [0, 1, 2, 3, 4, 5, 6], time: "08:00" })).toBe("Runs every day at 8:00 AM.");
    expect(s({ frequency: "hourly", time: "00:05" })).toBe("Runs every hour at :05.");
    expect(s({ frequency: "monthly", dayOfMonth: 31, time: "17:30" }, { active: { start: "2026-10-01", end: "2026-12-31" } })).toBe(
      "Runs on the 31st of every month (or its last day) at 5:30 PM, from Oct 1 to Dec 31, 2026.",
    );
    expect(s({ frequency: "daily", time: "09:00" }, { conditions: [{ field: "open", operator: "gt", value: "1200" }] })).toBe("Runs every day at 9:00 AM, only if Open deals is more than 1,200.");
    expect(describeTrigger(EVENT, EVENTS)).toBe("Runs when a deal changes stage, only if Stage is “Won” and Amount is more than 10,000.");
    expect(describeTrigger({ ...EVENT, match: "any" }, EVENTS)).toBe("Runs when a deal changes stage, only if Stage is “Won” or Amount is more than 10,000.");
    expect(describeTrigger({ kind: "event", conditions: [], match: "all" }, EVENTS)).toBe("Pick the event that starts this automation.");
    // The label stands in for a missing phrase; empty conditions are left out
    expect(describeTrigger({ kind: "event", event: "form.submitted", conditions: [{ field: "country", operator: "is", value: " " }], match: "all" }, EVENTS)).toBe("Runs when form is submitted.");
  });
});

describe("tc-trigger-builder", () => {
  test("the host is the root and a group named by the heading, in either look", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("tgb");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.kind).toBe("schedule");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("Trigger");
    expect(el.querySelector(".ui-tgb__card")).toBeTruthy();
    el.look = "clean";
    el.heading = "Run this automation";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-tgb__card")).toBeNull();
    expect(el.getAttribute("aria-label")).toBe("Run this automation");
    // Inner controls follow the look
    expect(el.querySelector<HTMLElement>("tc-segmented-control")!.dataset.look).toBe("clean");
  });

  test("the sentence and the next runs, counted from `now`", async () => {
    const el = await mount();
    expect(sentence(el)).toBe("Runs every Monday at 9:00 AM.");
    expect(runs(el)).toEqual(["Mon, Nov 2 | 9:00 AM | In 7 days", "Mon, Nov 9 | 9:00 AM | In 14 days", "Mon, Nov 16 | 9:00 AM | In 21 days", "Mon, Nov 23 | 9:00 AM | In 28 days", "Mon, Nov 30 | 9:00 AM | In 35 days"]);
    expect(el.querySelector(".ui-tgb__run")!.hasAttribute("data-next")).toBe(true);
    el.now = at(2026, 11, 1, 20);
    el.runCount = 2;
    await settle();
    expect(runs(el)).toEqual(["Mon, Nov 2 | 9:00 AM | Tomorrow", "Mon, Nov 9 | 9:00 AM | In 8 days"]);
    expect(el.nextRuns).toEqual([at(2026, 11, 2), at(2026, 11, 9)]);
  });

  test("unset, `now` is when the element connected – rendering never reads the clock", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 24, 12, 0) });
    const el = await fixture<TcTriggerBuilder>(html`<tc-trigger-builder .value=${WEEKLY}></tc-trigger-builder>`);
    expect(runs(el)[0]).toBe("Mon, Oct 26 | 9:00 AM | In 2 days");
    vi.setSystemTime(new Date(2026, 9, 27, 12, 0));
    el.runCount = 3;
    await settle();
    expect(runs(el)[0]).toBe("Mon, Oct 26 | 9:00 AM | In 2 days");
  });

  test("days, frequency, time and day of month: each edit fires one cancelable tc-value-change", async () => {
    const el = await mount();
    const seen: TriggerValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value as TriggerValue));
    const day = (name: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-tgb__day")].find((b) => b.textContent === name)!;
    expect(day("Monday").getAttribute("aria-pressed")).toBe("true");
    day("Thursday").click();
    await settle();
    expect(seen.at(-1)!.schedule!.days).toEqual([1, 4]);
    expect(day("Thursday").getAttribute("aria-pressed")).toBe("true");
    expect(sentence(el)).toBe("Runs every Monday and Thursday at 9:00 AM.");
    await change(el.querySelector<HTMLInputElement>(".ui-tgb__time")!, "07:45");
    expect(el.value.schedule!.time).toBe("07:45");
    segOption(el, "Monthly").click();
    await settle();
    expect(el.value.schedule).toMatchObject({ frequency: "monthly", dayOfMonth: 1 });
    expect(el.querySelector(".ui-tgb__day")).toBeNull();
    await change(el.querySelector<HTMLInputElement>(".ui-tgb__num")!, "31");
    expect(el.value.schedule!.dayOfMonth).toBe(31);
    segOption(el, "Hourly").click();
    await settle();
    await change(el.querySelector<HTMLInputElement>(".ui-tgb__num")!, "20");
    expect(el.value.schedule!.time).toBe("07:20");
    expect(sentence(el)).toBe("Runs every hour at :20.");
    // Only this element's own events reach the page – one per edit, never the inner controls'
    expect(seen).toHaveLength(6);
    expect(seen.every((v) => v.kind === "schedule")).toBe(true);
  });

  test("keyboard: When and Repeats are radiogroups (arrow keys pick), named by their labels; days are toggle buttons", async () => {
    const el = await mount();
    const groups = [...el.querySelectorAll<HTMLElement>('tc-segmented-control [role="radiogroup"]')];
    const name = (g: HTMLElement) =>
      g
        .getAttribute("aria-labelledby")!
        .split(" ")
        .map((id) => document.getElementById(id)!.textContent)
        .join(" ");
    expect(groups.map(name)).toEqual(["When", "Repeats", "Active"]);
    const weekly = segOption(el, "Weekly");
    weekly.focus();
    weekly.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    await settle();
    expect(el.value.schedule!.frequency).toBe("monthly");
    const kind = segOption(el, "On a schedule");
    kind.focus();
    kind.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
    await settle();
    expect(el.value.kind).toBe("event");
    el.value = WEEKLY;
    await settle();
    const days = [...el.querySelectorAll<HTMLButtonElement>(".ui-tgb__day")];
    expect(days.map((d) => d.localName)).toEqual(Array(7).fill("button"));
    expect(days.map((d) => d.textContent)).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
    expect(document.getElementById(el.querySelector('[role="group"].ui-tgb__days')!.getAttribute("aria-labelledby")!)!.textContent).toBe("On");
  });

  test("controlled: preventDefault() keeps the value and the controls", async () => {
    const el = await mount();
    on(el, "tc-value-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>('.ui-tgb__day[data-day="5"]')!.click();
    await settle();
    expect(el.value).toBe(WEEKLY);
    expect(el.querySelector('.ui-tgb__day[data-day="5"]')!.getAttribute("aria-pressed")).toBe("false");
    const time = el.querySelector<HTMLInputElement>(".ui-tgb__time")!;
    await change(time, "11:00");
    expect(time.value).toBe("09:00");
    segOption(el, "Daily").click();
    await settle();
    expect(segOption(el, "Weekly").getAttribute("aria-checked")).toBe("true");
  });

  test("an event: pick it from the combobox; conditions on its fields; the other kind's conditions don't carry over", async () => {
    const el = await mount({ ...WEEKLY, conditions: [{ field: "open", operator: "gt", value: "3" }] });
    segOption(el, "An event happens").click();
    await settle();
    expect(el.value.kind).toBe("event");
    expect(el.value.conditions).toEqual([]);
    expect(sentence(el)).toBe("Pick the event that starts this automation.");
    expect(el.querySelector(".ui-tgb__runs")).toBeNull();
    expect(el.querySelector(".ui-tgb__foot")!.textContent).toBe("Runs each time the event happens");
    // No event yet: no conditions to add
    expect(el.querySelector(".ui-tgb__add")).toBeNull();
    const cbx = el.querySelector<TcCombobox>("tc-combobox")!;
    const leaked: string[] = [];
    on(el, "tc-open-change", () => leaked.push("open"));
    cbx.open = true;
    await settle();
    [...cbx.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent!.includes("Deal changes stage"))!.click();
    await settle();
    expect(el.value.event).toBe("deal.stage");
    expect(cbx.value).toEqual(["deal.stage"]);
    expect(leaked).toEqual([]);
    expect(sentence(el)).toBe("Runs when a deal changes stage.");
    expect(el.querySelector(".ui-tgb__add")).toBeTruthy();
  });

  test("conditions: add (focus moves to it), edit field / test / value, all or any, remove (focus stays in the list)", async () => {
    const el = await mount({ kind: "event", event: "deal.stage", conditions: [], match: "all" });
    el.querySelector<HTMLButtonElement>(".ui-tgb__add")!.click();
    await settle();
    expect(el.value.conditions).toEqual([{ field: "stage", operator: "is", value: "Lead" }]);
    expect(document.activeElement).toBe(el.querySelector('[aria-label="Condition 1 field"]'));
    await change(el.querySelector<HTMLSelectElement>('[aria-label="Condition 1 value"]')!, "Won");
    el.querySelector<HTMLButtonElement>(".ui-tgb__add")!.click();
    await settle();
    await change(el.querySelector<HTMLSelectElement>('[aria-label="Condition 2 field"]')!, "amount");
    // A number field: is / is more than / is less than, and a number input
    expect([...el.querySelectorAll<HTMLOptionElement>('[aria-label="Condition 2 test"] option')].map((o) => o.textContent)).toEqual(["is", "is more than", "is less than"]);
    await change(el.querySelector<HTMLSelectElement>('[aria-label="Condition 2 test"]')!, "gt");
    const amount = el.querySelector<HTMLInputElement>('[aria-label="Condition 2 value"]')!;
    expect(amount.type).toBe("number");
    await change(amount, "10000");
    expect(sentence(el)).toBe("Runs when a deal changes stage, only if Stage is “Won” and Amount is more than 10,000.");
    // Two conditions: all or any
    segOption(el, "Any").click();
    await settle();
    expect(el.value.match).toBe("any");
    expect([...el.querySelectorAll(".ui-tgb__cond-word")].map((w) => w.textContent)).toEqual(["If", "or"]);
    // Remove the first: focus moves to the remove button of the row that takes its place
    const remove = el.querySelector<HTMLButtonElement>('[aria-label="Remove condition 1"]')!;
    remove.focus();
    remove.click();
    await settle();
    expect(el.value.conditions).toEqual([{ field: "amount", operator: "gt", value: "10000" }]);
    expect(document.activeElement).toBe(el.querySelector('[aria-label="Remove condition 1"]'));
    el.querySelector<HTMLButtonElement>('[aria-label="Remove condition 1"]')!.click();
    await settle();
    expect(document.activeElement).toBe(el.querySelector(".ui-tgb__add"));
    // Picking another event drops conditions on fields it doesn't have
    el.value = EVENT;
    await settle();
    const cbx = el.querySelector<TcCombobox>("tc-combobox")!;
    cbx.open = true;
    await settle();
    [...cbx.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent!.includes("Form is submitted"))!.click();
    await settle();
    expect(el.value).toMatchObject({ event: "form.submitted", conditions: [] });
  });

  test("active dates: Between dates adds a range from today, shown with the date-range picker", async () => {
    const el = await mount();
    segOption(el, "Between dates").click();
    await settle();
    expect(el.value.active).toEqual({ start: "2026-10-26", end: "2026-11-24" });
    expect(el.querySelector("tc-date-range-picker")).toBeTruthy();
    expect(sentence(el)).toBe("Runs every Monday at 9:00 AM, from Oct 26 to Nov 24, 2026.");
    expect(runs(el)).toHaveLength(4);
    segOption(el, "Always").click();
    await settle();
    expect(el.value.active).toBeNull();
    expect(el.querySelector("tc-date-range-picker")).toBeNull();
  });

  test("forms: the definition as JSON under `name`, validity, reset and a disabled fieldset", async () => {
    const form = await fixture<HTMLFormElement>(html`<form>
      <fieldset>
        <tc-trigger-builder name="trigger" .events=${EVENTS} .value=${WEEKLY} .now=${NOW}></tc-trigger-builder>
      </fieldset>
    </form>`);
    const el = form.querySelector<TcTriggerBuilder>("tc-trigger-builder")!;
    expect(JSON.parse(new FormData(form).get("trigger") as string)).toEqual(WEEKLY);
    expect(form.checkValidity()).toBe(true);
    // A weekly trigger without a day can't run
    el.querySelector<HTMLButtonElement>('.ui-tgb__day[data-day="1"]')!.click();
    await settle();
    expect(form.checkValidity()).toBe(false);
    expect(el.querySelector(".ui-tgb__no-runs")!.textContent).toBe("Pick a day to see when it runs.");
    // Nor an event trigger without an event
    el.value = { kind: "event", conditions: [], match: "all" };
    await settle();
    expect(form.checkValidity()).toBe(false);
    form.reset();
    await settle();
    expect(el.value).toEqual(WEEKLY);
    expect(form.checkValidity()).toBe(true);
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    await settle();
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(new FormData(form).get("trigger")).toBeNull();
    expect(el.querySelector<HTMLButtonElement>(".ui-tgb__day")!.disabled).toBe(true);
  });

  test("the sentence is announced after a change, not on first render", async () => {
    const el = await mount();
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent).toBe("");
    el.querySelector<HTMLButtonElement>('.ui-tgb__day[data-day="5"]')!.click();
    await settle();
    expect(status.textContent).toBe("Runs every Monday and Friday at 9:00 AM.");
  });

  test("form reset through React: the baseline is the value React passed; reset goes through onChange", async () => {
    await expectReactFormReset(TriggerBuilder, "tc-trigger-builder", WEEKLY, EVENT, { events: WRAPPER_EVENTS });
  });

  test("React wrapper: uncontrolled value survives a parent re-render; controlled stays with the app; title and onChange", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(TriggerBuilder, { title: "Automation", events: WRAPPER_EVENTS, defaultValue: WEEKLY, now: NOW, onChange });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcTriggerBuilder>("tc-trigger-builder")!;
    expect(el.heading).toBe("Automation");
    await act(async () => el.querySelector<HTMLButtonElement>('.ui-tgb__day[data-day="3"]')!.click());
    await settle();
    expect(onChange).toHaveBeenCalledWith({ ...WEEKLY, schedule: { ...WEEKLY.schedule, days: [1, 3] } });
    await act(async () => rerender());
    await settle();
    expect(el.value.schedule!.days).toEqual([1, 3]);
    // Controlled (a new element: the root's component type changed)
    await act(async () => root.render(React.createElement(TriggerBuilder, { events: WRAPPER_EVENTS, value: WEEKLY, now: NOW, onChange })));
    await settle();
    const ctl = host.querySelector<TcTriggerBuilder>("tc-trigger-builder")!;
    await act(async () => ctl.querySelector<HTMLButtonElement>('.ui-tgb__day[data-day="5"]')!.click());
    await settle();
    expect(onChange).toHaveBeenLastCalledWith({ ...WEEKLY, schedule: { ...WEEKLY.schedule, days: [1, 5] } });
    expect(ctl.value).toEqual(WEEKLY);
    expect(ctl.querySelector('.ui-tgb__day[data-day="5"]')!.getAttribute("aria-pressed")).toBe("false");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme}) – a schedule with dates, and an event with conditions`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-trigger-builder .events=${EVENTS} .scheduleFields=${SCHEDULE_FIELDS} .now=${NOW} .value=${{ ...WEEKLY, active: { start: "2026-11-01", end: "2026-12-15" }, conditions: [{ field: "open", operator: "gt", value: "2" }] }}></tc-trigger-builder>
        <tc-trigger-builder look="clean" heading="Clean" .events=${EVENTS} .now=${NOW} .value=${EVENT}></tc-trigger-builder>
        <tc-trigger-builder look="clean" heading="Clean schedule" .now=${NOW} .value=${WEEKLY}></tc-trigger-builder>
        <tc-trigger-builder heading="Standard event" .events=${EVENTS} .now=${NOW} .value=${EVENT}></tc-trigger-builder>
      </div>`);
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns the row and sentence animations off", () => {
    const css = (customElements.get("tc-trigger-builder") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{[^}]*\.ui-tgb__cond, \.ui-tgb__sentence \{ animation: none; \}/);
  });
});
