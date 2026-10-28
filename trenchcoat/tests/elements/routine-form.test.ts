/*
 * <tc-routine-form> in real browsers: the structure in both looks, the next run in a time zone (clock changes, short
 * months, hourly and weekday routines), the start-time controls by frequency, validation, the events with
 * preventDefault, its own clock, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/routine-form";
import { emptyRoutine, nextRoutineRun, nextRoutineRuns, type RoutineDraft, type RoutineOpenRoutines, type RoutineSubmit, type RoutineValueChange, type TcRoutineForm } from "../../src/elements/routine-form";
import { RoutineForm } from "../../src/elements/react/routine-form";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const LA = "America/Los_Angeles";
// Wed 28 Oct 2026, 12:00 in Los Angeles (UTC−7)
const NOW = Date.UTC(2026, 9, 28, 19, 0);
const DRAFT: RoutineDraft = {
  name: "Coral bleaching study updates",
  frequency: "weekly",
  weekday: 4,
  dayOfMonth: 1,
  time: "13:45",
  firstRun: "scheduled",
  notify: "updates",
  instructions: "Look for new peer-reviewed studies since the last run.",
};
/** The wall clock in a zone, for checking answers: "2026-10-29 13:45 Thu" */
const wall = (t: number | null, tz = LA) =>
  t === null
    ? "none"
    : new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short" })
        .formatToParts(t)
        .reduce((o, p) => ({ ...o, [p.type]: p.value }), {} as Record<string, string>);
const fmt = (t: number | null, tz = LA) => {
  const w = wall(t, tz);
  return typeof w === "string" ? w : `${w.year}-${w.month}-${w.day} ${w.hour}:${w.minute} ${w.weekday}`;
};
const make = (look: "standard" | "clean" = "standard", value: RoutineDraft = DRAFT) =>
  fixture<TcRoutineForm>(html`<tc-routine-form look=${look} time-zone=${LA} .now=${NOW} .value=${value}></tc-routine-form>`);

describe("nextRoutineRun", () => {
  test("weekly, daily, weekdays and monthly, in the routine's time zone", () => {
    expect(fmt(nextRoutineRun(DRAFT, NOW, LA))).toBe("2026-10-29 13:45 Thu");
    // Same day when the time hasn't come yet, the next day when it has
    expect(fmt(nextRoutineRun({ frequency: "daily", time: "12:30" }, NOW, LA))).toBe("2026-10-28 12:30 Wed");
    expect(fmt(nextRoutineRun({ frequency: "daily", time: "11:30" }, NOW, LA))).toBe("2026-10-29 11:30 Thu");
    // Friday evening: the next weekday is Monday
    const friday = Date.UTC(2026, 9, 31, 3, 0); // Fri 30 Oct, 20:00 in LA
    expect(fmt(nextRoutineRun({ frequency: "weekdays", time: "09:00" }, friday, LA))).toBe("2026-11-02 09:00 Mon");
    expect(fmt(nextRoutineRun({ frequency: "monthly", time: "08:00", dayOfMonth: 15 }, NOW, LA))).toBe("2026-11-15 08:00 Sun");
    // The same instant in another zone gives another answer
    // (noon in Los Angeles is 4:00 the next morning in Tokyo)
    expect(fmt(nextRoutineRun({ frequency: "daily", time: "09:00" }, NOW, "Asia/Tokyo"), "Asia/Tokyo")).toBe("2026-10-29 09:00 Thu");
  });

  test("a short month runs on its last day; the 29th of February only in a leap year", () => {
    const jan = Date.UTC(2027, 0, 31, 20, 0); // after the January run
    expect(fmt(nextRoutineRuns({ frequency: "monthly", time: "08:00", dayOfMonth: 31 }, jan, 3, LA).at(0) ?? null)).toBe("2027-02-28 08:00 Sun");
    expect(nextRoutineRuns({ frequency: "monthly", time: "08:00", dayOfMonth: 31 }, jan, 3, LA).map((t) => fmt(t).slice(0, 10))).toEqual(["2027-02-28", "2027-03-31", "2027-04-30"]);
    expect(fmt(nextRoutineRun({ frequency: "monthly", time: "08:00", dayOfMonth: 29 }, Date.UTC(2028, 1, 1), LA))).toBe("2028-02-29 08:00 Tue");
  });

  test("clock changes: a skipped time runs an hour later, a repeated one runs once, and the wall time holds across the change", () => {
    // 2027-03-14 02:30 doesn't exist in Los Angeles (02:00 → 03:00)
    const sat = Date.UTC(2027, 2, 13, 20, 0);
    expect(fmt(nextRoutineRun({ frequency: "daily", time: "02:30" }, sat, LA))).toBe("2027-03-14 03:30 Sun");
    // 2026-11-01 01:30 happens twice; the first is taken, and the next day's is a day later
    const sat2 = Date.UTC(2026, 9, 31, 20, 0);
    const runs = nextRoutineRuns({ frequency: "daily", time: "01:30" }, sat2, 2, LA);
    expect(runs.map((t) => fmt(t))).toEqual(["2026-11-01 01:30 Sun", "2026-11-02 01:30 Mon"]);
    expect(new Date(runs[0]).toISOString()).toBe("2026-11-01T08:30:00.000Z"); // still UTC−7: the first 1:30
    // A weekly 9:00 keeps 9:00 on both sides of the change
    expect(nextRoutineRuns({ frequency: "weekly", weekday: 0, time: "09:00" }, sat2, 2, LA).map((t) => fmt(t))).toEqual(["2026-11-01 09:00 Sun", "2026-11-08 09:00 Sun"]);
    // Europe: 2027-03-28 02:30 is skipped in Berlin
    expect(fmt(nextRoutineRun({ frequency: "daily", time: "02:30" }, Date.UTC(2027, 2, 27, 12), "Europe/Berlin"), "Europe/Berlin")).toBe("2027-03-28 03:30 Sun");
  });

  test("hourly uses the minutes; a time that can't be read gives no run; an unknown zone falls back to the browser's", () => {
    expect(nextRoutineRuns({ frequency: "hourly", time: "00:15" }, NOW, 3, LA).map((t) => fmt(t).slice(11, 16))).toEqual(["12:15", "13:15", "14:15"]);
    expect(nextRoutineRun({ frequency: "daily", time: "25:00" }, NOW, LA)).toBeNull();
    expect(nextRoutineRun({ frequency: "daily", time: "" }, NOW, LA)).toBeNull();
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(nextRoutineRun({ frequency: "daily", time: "09:00" }, NOW, "Not/AZone")).toBe(nextRoutineRun({ frequency: "daily", time: "09:00" }, NOW, browser));
  });
});

describe("tc-routine-form", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: header with the Routines link, labelled rows, next run, and the foot`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rtn");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Create a routine");
      expect(el.querySelector(".tc-head__sub")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Each run uses credits. Turn routines off anytime from Routines");
      // Without an href, Routines is a button
      expect(el.querySelector("button.ui-rtn__link")!.textContent).toBe("Routines");
      expect([...el.querySelectorAll(".ui-rtn__label")].map((l) => l.textContent!.trim())).toEqual(["Name", "Frequency", "Start time", "First run", "Email notification", "Instructions"]);
      const form = el.querySelector("form")!;
      expect(form.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      const name = el.querySelector<HTMLInputElement>('input[type="text"]')!;
      expect(name.value).toBe("Coral bleaching study updates");
      expect(el.querySelector<HTMLLabelElement>(`label[for="${name.id}"]`)!.textContent!.trim()).toBe("Name");
      expect(el.querySelector(".ui-rtn__hint")!.textContent).toBe("Time zone: America/Los_Angeles");
      expect(el.querySelector(".ui-rtn__next")!.textContent!.replace(/\s+/g, " ").trim()).toBe(
        `Next run: ${new Intl.DateTimeFormat(undefined, { timeZone: LA, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(Date.UTC(2026, 9, 29, 20, 45))}`,
      );
      expect(el.nextRun).toBe(Date.UTC(2026, 9, 29, 20, 45));
      // Weekly: the day and the time
      expect(el.querySelector<HTMLSelectElement>('[aria-label="Start time: day of the week"]')!.value).toBe("4");
      expect(el.querySelector<HTMLInputElement>('input[type="time"]')!.value).toBe("13:45");
      expect(el.querySelector(".ui-rtn__start")!.getAttribute("aria-labelledby")).toBe(el.querySelector('[data-row="start"] .ui-rtn__label')!.id);
      expect(el.querySelector("tc-segmented-control")!.getAttribute("look")).toBe(look);
      expect([...el.querySelectorAll(".ui-rtn__foot button")].map((b) => b.textContent!.trim())).toEqual(["Dismiss", "Create routine"]);
    });
  }

  test("the start-time controls follow the frequency", async () => {
    const el = await make();
    const frequency = el.querySelector<HTMLSelectElement>('[data-row="frequency"] select')!;
    const choose = async (f: string) => {
      frequency.value = f;
      frequency.dispatchEvent(new Event("change", { bubbles: true }));
      await settle();
    };
    await choose("monthly");
    const dom = el.querySelector<HTMLSelectElement>('[aria-label="Start time: day of the month"]')!;
    expect(dom.options).toHaveLength(31);
    expect(dom.options[30].textContent).toBe("Day 31");
    dom.value = "31";
    dom.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.dayOfMonth).toBe(31);
    // Oct 28 → Oct 31, 13:45
    expect(el.nextRun).toBe(Date.UTC(2026, 9, 31, 20, 45));
    await choose("daily");
    expect(el.querySelector(".ui-rtn__start select")).toBeNull();
    expect(el.querySelector<HTMLInputElement>('input[type="time"]')).not.toBeNull();
    await choose("hourly");
    expect(el.querySelector('input[type="time"]')).toBeNull();
    const minute = el.querySelector<HTMLSelectElement>('[aria-label="Start time: minutes past the hour"]')!;
    expect(minute.selectedOptions[0].textContent).toBe(":45 past the hour");
    minute.value = "0";
    minute.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.time).toBe("13:00");
    // 12:00 now → 13:00
    expect(el.nextRun).toBe(Date.UTC(2026, 9, 28, 20, 0));
    // A time typed in
    await choose("weekdays");
    const time = el.querySelector<HTMLInputElement>('input[type="time"]')!;
    time.value = "07:05";
    time.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.time).toBe("07:05");
  });

  test("first run right away says so with the next scheduled run", async () => {
    const el = await make();
    const seg = el.querySelector("tc-segmented-control")!;
    await (seg as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const changes: RoutineValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => changes.push((e as CustomEvent<RoutineValueChange>).detail));
    [...seg.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent!.includes("Right away"))!.click();
    await settle();
    expect(el.value.firstRun).toBe("now");
    // The inner control's change is this element's only
    expect(changes).toHaveLength(1);
    expect(changes[0].value.firstRun).toBe("now");
    expect(el.querySelector(".ui-rtn__next")!.textContent).toContain("First run right away, then");
  });

  test("validation: Create with fields missing shows each error, announces them and focuses the first; no tc-submit", async () => {
    const el = await make("standard", { ...emptyRoutine() });
    const submits: RoutineSubmit[] = [];
    el.addEventListener("tc-submit", (e) => submits.push((e as CustomEvent<RoutineSubmit>).detail));
    // Nothing shows before a try
    expect(el.querySelector(".ui-rtn__error")).toBeNull();
    el.querySelector<HTMLButtonElement>(".ui-rtn__submit")!.click();
    await settle();
    expect(submits).toHaveLength(0);
    expect([...el.querySelectorAll(".ui-rtn__error")].map((e) => e.textContent)).toEqual(["Give the routine a name", "Say what each run should do"]);
    const name = el.querySelector<HTMLInputElement>('input[type="text"]')!;
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(name.getAttribute("aria-describedby")).toBe(el.querySelector(".ui-rtn__error")!.id);
    await expect.poll(() => document.activeElement).toBe(name);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("2 fields need filling in: Give the routine a name; Say what each run should do");
    // Filling the name clears its error
    name.value = "Weekly update";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect([...el.querySelectorAll(".ui-rtn__error")].map((e) => e.textContent)).toEqual(["Say what each run should do"]);
    // Leaving an empty field shows its error before any try
    const fresh = await make("clean", { ...emptyRoutine() });
    fresh.querySelector<HTMLTextAreaElement>("textarea")!.dispatchEvent(new Event("blur"));
    await settle();
    expect([...fresh.querySelectorAll(".ui-rtn__error")].map((e) => e.textContent)).toEqual(["Say what each run should do"]);
  });

  test("events: tc-submit with the next run (cancelable), Enter submits, tc-dismiss, and the Routines link", async () => {
    const el = await make();
    const log: string[] = [];
    el.addEventListener("tc-submit", (e) => log.push(`submit:${(e as CustomEvent<RoutineSubmit>).detail.value.name}:${(e as CustomEvent<RoutineSubmit>).detail.nextRun}`));
    el.addEventListener("tc-dismiss", () => log.push("dismiss"));
    el.querySelector<HTMLButtonElement>(".ui-rtn__submit")!.click();
    await settle();
    expect(log).toEqual([`submit:Coral bleaching study updates:${Date.UTC(2026, 9, 29, 20, 45)}`]);
    expect(el.querySelector('[role="status"]')!.textContent).toContain("Routine created");
    // Enter in the name field submits the form
    el.querySelector<HTMLFormElement>("form")!.requestSubmit();
    await settle();
    expect(log).toHaveLength(2);
    // Prevented: no announcement
    const quiet = await make("clean");
    quiet.addEventListener("tc-submit", (e) => e.preventDefault());
    quiet.querySelector<HTMLButtonElement>(".ui-rtn__submit")!.click();
    await settle();
    expect(quiet.querySelector('[role="status"]')!.textContent).toBe("");
    el.querySelector<HTMLButtonElement>(".ui-rtn__dismiss")!.click();
    expect(log.at(-1)).toBe("dismiss");
    // Edit mode names the heading and the button; busy waits
    el.mode = "edit";
    el.busy = true;
    await settle();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Edit routine");
    expect(el.querySelector(".ui-rtn__submit")!.textContent!.trim()).toBe("Saving…");
    const before = log.length;
    el.querySelector<HTMLButtonElement>(".ui-rtn__submit")!.click();
    await settle();
    expect(log).toHaveLength(before);
    expect(el.querySelector<HTMLButtonElement>(".ui-rtn__dismiss")!.disabled).toBe(true);
    // The Routines link: an href through safeUrl, cancelable
    el.routinesHref = "/routines";
    await settle();
    const link = el.querySelector<HTMLAnchorElement>("a.ui-rtn__link")!;
    expect(link.getAttribute("href")).toBe("/routines");
    const opened: RoutineOpenRoutines[] = [];
    el.addEventListener("tc-open-routines", (e) => {
      opened.push((e as CustomEvent<RoutineOpenRoutines>).detail);
      e.preventDefault();
    });
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(opened).toEqual([{ href: "/routines" }]);
    expect(click.defaultPrevented).toBe(true);
    el.routinesHref = "javascript:alert(1)";
    await settle();
    expect(el.querySelector("a.ui-rtn__link")).toBeNull();
    expect(el.querySelector("button.ui-rtn__link")).not.toBeNull();
  });

  test("controlled: a prevented change leaves the value and the field as they were", async () => {
    const el = await make();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    const name = el.querySelector<HTMLInputElement>('input[type="text"]')!;
    name.value = "Something else";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.value).toBe(DRAFT);
    expect(name.value).toBe("Coral bleaching study updates");
    const notify = el.querySelector<HTMLSelectElement>('[data-row="notify"] select')!;
    notify.value = "never";
    notify.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(notify.value).toBe("updates");
  });

  test("renamed labels and another locale", async () => {
    const el = await fixture<TcRoutineForm>(html`<tc-routine-form
      time-zone=${LA}
      locale="de-DE"
      .now=${NOW}
      .value=${DRAFT}
      .labels=${{ heading: "Neue Routine", nextRun: "Nächster Lauf", frequencies: { weekly: "Wöchentlich" } }}
    ></tc-routine-form>`);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Neue Routine");
    expect(el.querySelector('[data-row="frequency"] select')!.querySelector('option[value="weekly"]')!.textContent).toBe("Wöchentlich");
    // The others keep their defaults
    expect(el.querySelector('[data-row="frequency"] select')!.querySelector('option[value="daily"]')!.textContent).toBe("Daily");
    expect(el.querySelector(".ui-rtn__next")!.textContent).toContain("Nächster Lauf");
    expect(el.querySelector('[aria-label="Start time: day of the week"] option[value="4"]')!.textContent).toBe("Donnerstag");
  });

  test("its own clock when `now` isn't given; a bad time zone falls back to the browser's", async () => {
    const el = await fixture<TcRoutineForm>(html`<tc-routine-form time-zone="Not/AZone" .value=${{ ...DRAFT, frequency: "daily" }}></tc-routine-form>`);
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(el.querySelector(".ui-rtn__hint")!.textContent).toBe(`Time zone: ${browser}`);
    const next = el.nextRun!;
    expect(next).toBeGreaterThan(Date.now());
    expect(next - Date.now()).toBeLessThanOrEqual(25 * 3_600_000);
  });

  test("React wrapper: uncontrolled edits survive parent re-renders; onCreate gets the draft and next run", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const created: [RoutineDraft, number | null][] = [];
    const changes: RoutineDraft[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RoutineForm, {
        title: "New routine",
        timeZone: LA,
        now: NOW,
        defaultValue: DRAFT,
        onValueChange: (v) => void changes.push(v),
        onCreate: (v, next) => void created.push([v, next]),
        "data-n": n,
      } as React.ComponentProps<typeof RoutineForm>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-routine-form")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("New routine");
    const name = el.querySelector<HTMLInputElement>('input[type="text"]')!;
    name.value = "Reef updates";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.querySelector<HTMLInputElement>('input[type="text"]')!.value).toBe("Reef updates");
    expect(changes.at(-1)!.name).toBe("Reef updates");
    el.querySelector<HTMLButtonElement>(".ui-rtn__submit")!.click();
    await settle();
    expect(created).toHaveLength(1);
    expect(created[0][0].name).toBe("Reef updates");
    expect(created[0][1]).toBe(Date.UTC(2026, 9, 29, 20, 45));
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled value stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: RoutineDraft[] = [];
    await act(async () => root.render(React.createElement(RoutineForm, { timeZone: LA, now: NOW, value: DRAFT, onValueChange: (v) => void asked.push(v) })));
    await settle();
    const el = host.querySelector("tc-routine-form")!;
    const notify = el.querySelector<HTMLSelectElement>('[data-row="notify"] select')!;
    notify.value = "failures";
    notify.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(asked.map((v) => v.notify)).toEqual(["failures"]);
    expect(el.querySelector<HTMLSelectElement>('[data-row="notify"] select')!.value).toBe("updates");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with errors showing`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-routine-form time-zone=${LA} routines-href="/routines" .now=${NOW} .value=${DRAFT}></tc-routine-form>
        <tc-routine-form look="clean" time-zone=${LA} mode="edit" .now=${NOW} .value=${{ ...emptyRoutine(), frequency: "monthly" }}></tc-routine-form>
      </div>`);
      wrap.querySelectorAll<HTMLElement>(".ui-rtn__submit")[1].click();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
