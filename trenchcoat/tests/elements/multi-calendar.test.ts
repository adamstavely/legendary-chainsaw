/*
 * <tc-multi-calendar> in real browsers: the layout maths on its own (wall time in a zone, overlaps, clipping, daylight
 * saving, conflicts), then the element – structure per look, the views, showing and hiding calendars, conflicts and
 * read-only marks, creating, editing, moving, resizing and deleting (and each refused by preventDefault or a read-only
 * calendar), the keyboard, narrow widths, a time zone, the React wrapper, and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/multi-calendar";
import type {
  CalendarEvent,
  CalendarSource,
  MultiCalendarDateChange,
  MultiCalendarEventCreate,
  MultiCalendarEventDelete,
  MultiCalendarEventUpdate,
  MultiCalendarViewChange,
  MultiCalendarVisibleChange,
  TcMultiCalendar,
} from "../../src/elements/multi-calendar";
import { addDays, dayStart, findConflicts, layoutDay, monthWeeks, wall, wallMinutes, zoned } from "../../src/elements/internal/calendar-layout";
import { MultiCalendar } from "../../src/elements/react/multi-calendar";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** A moment in late October 2026, local time */
const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
/** Wednesday 28 October 2026, 10:20 */
const NOW = at(28, 10, 20);

const maya = { id: "maya", name: "Maya Chen" };
const theo = { id: "theo", name: "Theo Okafor" };
const priya = { id: "priya", name: "Priya Raman" };
const CALENDARS: CalendarSource[] = [
  { id: "maya-work", name: "Work", owner: maya, provider: "Google", color: 1 },
  { id: "maya-home", name: "Personal", owner: maya, provider: "Google" },
  { id: "theo-work", name: "Work", owner: theo, provider: "Outlook" },
  { id: "priya-client", name: "Client meetings", owner: priya, provider: "Exchange" },
  { id: "priya-home", name: "Personal", owner: priya, provider: "Google" },
  { id: "summit", name: "Audit Summit", owner: theo, provider: "iCal feed", readOnly: true },
];
const EVENTS: CalendarEvent[] = [
  { id: "standup", calendarId: "maya-work", title: "Stand-up", start: at(28, 9, 30), end: at(28, 9, 45) },
  { id: "review", calendarId: "maya-work", title: "Sampling review", start: at(28, 11), end: at(28, 12, 30), location: "Room 4B", attendees: ["Theo Okafor"] },
  { id: "ledger", calendarId: "theo-work", title: "Ledger walkthrough", start: at(27, 13), end: at(27, 15) },
  { id: "client", calendarId: "priya-client", title: "Client review", start: at(28, 14), end: at(28, 15, 30) },
  { id: "dentist", calendarId: "priya-home", title: "Dentist", start: at(28, 15), end: at(28, 16) },
  { id: "keynote", calendarId: "summit", title: "Keynote", start: at(29, 9), end: at(29, 10) },
  { id: "summit-days", calendarId: "summit", title: "Audit Summit", start: at(29, 0), end: at(31, 0), allDay: true },
  { id: "one-on-one", calendarId: "theo-work", title: "1:1", start: at(29, 15), end: at(29, 15, 30), status: "tentative" },
  { id: "close", calendarId: "theo-work", title: "Quarter close", start: at(30, 10), end: at(30, 11), status: "cancelled" },
];

const make = (opts: { look?: "standard" | "clean"; view?: string; width?: number; events?: CalendarEvent[]; extra?: Record<string, unknown> } = {}) =>
  fixture<HTMLDivElement>(
    html`<div style=${`width: ${opts.width ?? 1100}px`}>
      <tc-multi-calendar look=${opts.look ?? "standard"} view=${opts.view ?? "week"} .now=${NOW} .date=${NOW} .calendars=${CALENDARS} .events=${opts.events ?? EVENTS}></tc-multi-calendar>
    </div>`,
  ).then(async (wrap) => {
    const el = wrap.querySelector<TcMultiCalendar>("tc-multi-calendar")!;
    Object.assign(el, opts.extra ?? {});
    await expect.poll(() => (el as unknown as { width: number }).width).toBeGreaterThan(0);
    await settle();
    return el;
  });

const ev = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-event="${id}"]`);
const cell = (el: Element, c: number, s: number) => el.querySelector<HTMLElement>(`[data-cell="${c}:${s}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-mcal__pop");
/** The column of a day in Week (Monday first): Mon 26 = 0 … Wed 28 = 2 */
const colOf = (d: number) => d - 26;

/** Fires a synthetic pointer gesture on the grid: down at one wall minute in a column, moves, up */
async function drag(el: TcMultiCalendar, target: Element, from: { c: number; minute: number }, to: { c: number; minute: number }) {
  const body = el.querySelector<HTMLElement>(".ui-mcal__gbody")!;
  const box = body.getBoundingClientRect();
  const first = cell(el, 0, 0).getBoundingClientRect();
  const point = (p: { c: number; minute: number }) => ({ clientX: first.left + first.width * (p.c + 0.5), clientY: box.top + (box.height * p.minute) / 1440 + 2 });
  const fire = (type: string, target: Element, p: { c: number; minute: number }) =>
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: "mouse", button: 0, buttons: type === "pointerup" ? 0 : 1, ...point(p) }));
  fire("pointerdown", target, from);
  await settle();
  const mid = { c: to.c, minute: (from.minute + to.minute) / 2 };
  fire("pointermove", body, mid);
  fire("pointermove", body, to);
  await settle();
  fire("pointerup", body, to);
  // A browser clicks straight after the pointer comes up, in the same task
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...point(to) }));
  await settle();
}

describe("calendar layout maths", () => {
  test("overlapping events share columns, as few as the group needs; a later event starts a new group", () => {
    const day = at(28, 0);
    const items = [
      { id: "a", start: at(28, 9), end: at(28, 11) },
      { id: "b", start: at(28, 10), end: at(28, 12) },
      { id: "c", start: at(28, 11), end: at(28, 12) },
      { id: "d", start: at(28, 14), end: at(28, 15) },
      { id: "e", start: at(27, 22), end: at(28, 1) },
      { id: "f", start: at(28, 23, 50), end: at(29, 2) },
      { id: "g", start: at(28, 16), end: at(28, 16) },
      { id: "out", start: at(29, 9), end: at(29, 10) },
    ];
    const placed = Object.fromEntries(layoutDay(items, day).map((p) => [p.item.id, p]));
    expect(Object.keys(placed).sort()).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
    expect([placed.a.col, placed.b.col, placed.c.col]).toEqual([0, 1, 0]);
    expect([placed.a.cols, placed.b.cols, placed.c.cols, placed.d.cols]).toEqual([2, 2, 2, 1]);
    expect([placed.a.top, placed.a.bottom]).toEqual([540, 660]);
    // Clipped at midnight on both sides, marked as running over
    expect([placed.e.top, placed.e.bottom, placed.e.startsBefore, placed.e.endsAfter]).toEqual([0, 60, true, false]);
    expect([placed.f.top, placed.f.bottom, placed.f.endsAfter]).toEqual([1430, 1440, true]);
    // A zero-length event is drawn 15 minutes long
    expect(placed.g.bottom - placed.g.top).toBe(15);
  });

  test("an event widens into the free columns to its right", () => {
    // a 9–12 takes column 0; b 9–10 column 1; c 9–10 column 2; d 10:30–11 fits column 1 and has column 2 free
    const items = [
      { id: "a", start: at(28, 9), end: at(28, 12) },
      { id: "b", start: at(28, 9), end: at(28, 10) },
      { id: "c", start: at(28, 9), end: at(28, 10) },
      { id: "d", start: at(28, 10, 30), end: at(28, 11) },
    ];
    const placed = Object.fromEntries(layoutDay(items, at(28, 0)).map((p) => [p.item.id, p]));
    expect([placed.a.col, placed.b.col, placed.c.col, placed.d.col]).toEqual([0, 1, 2, 1]);
    expect([placed.a.span, placed.b.span, placed.c.span, placed.d.span]).toEqual([1, 1, 1, 2]);
  });

  test("wall time in a zone round-trips, and daylight-saving days are still one wall day", () => {
    const tz = "America/New_York";
    // 1 November 2026: clocks go back at 2:00 – a 25-hour day
    const noon = zoned(2026, 11, 1, 12, 0, tz);
    expect(wall(noon, tz)).toMatchObject({ y: 2026, m: 11, d: 1, h: 12, min: 0, wd: 0 });
    expect(new Date(noon).toISOString()).toBe("2026-11-01T17:00:00.000Z");
    const start = dayStart(noon, tz);
    expect(addDays(start, 1, tz) - start).toBe(25 * 3_600_000);
    // 8 March 2026: clocks go forward – a 23-hour day
    const spring = zoned(2026, 3, 8, 0, 0, tz);
    expect(addDays(spring, 1, tz) - spring).toBe(23 * 3_600_000);
    expect(wallMinutes(zoned(2026, 3, 8, 3, 30, tz), tz)).toBe(210);
    // An event from midnight to noon on the long day is placed by wall minutes, not elapsed ones
    const [p] = layoutDay([{ start, end: noon }], start, tz);
    expect([p.top, p.bottom]).toEqual([0, 720]);
    // Weeks and months by wall days
    const weeks = monthWeeks(noon, 1, tz);
    expect(weeks).toHaveLength(42);
    expect(wall(weeks[0], tz)).toMatchObject({ m: 10, d: 26, wd: 1 });
    expect(new Set(weeks.map((d) => wall(d, tz).h))).toEqual(new Set([0]));
  });

  test("conflicts: one person's events that overlap across their different calendars", () => {
    const ownerOf = (id: string) => CALENDARS.find((c) => c.id === id)?.owner.id;
    const list = [
      ...EVENTS,
      { id: "same-cal", calendarId: "priya-client", title: "Prep", start: at(28, 14), end: at(28, 14, 30) },
      { id: "other-person", calendarId: "maya-work", title: "Overlaps Priya", start: at(28, 14), end: at(28, 16) },
      { id: "cancelled", calendarId: "priya-home", title: "Cancelled", start: at(28, 14), end: at(28, 15), status: "cancelled" as const },
    ];
    const found = findConflicts(list, ownerOf);
    expect([...found.keys()].sort()).toEqual(["client", "dentist"]);
    expect(found.get("client")!.map((e) => e.id)).toEqual(["dentist"]);
    // Theo's read-only summit keynote doesn't clash with anything of his; the all-day summit never conflicts
    expect(found.has("keynote")).toBe(false);
  });
});

describe("tc-multi-calendar", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a toolbar, the sidebar and a week grid with one tab stop`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("mcal");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Calendars");
      const views = el.querySelector('[role="radiogroup"][aria-label="View"]')!;
      expect([...views.querySelectorAll('[role="radio"]')].map((r) => r.textContent!.trim())).toEqual(["Day", "Week", "Month", "Agenda", "People"]);
      expect(views.querySelector('[aria-checked="true"]')!.textContent!.trim()).toBe("Week");
      const grid = el.querySelector('.ui-mcal__grid[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toMatch(/Oct 26 – Nov 1, 2026/);
      expect(grid.querySelectorAll('[role="columnheader"]')).toHaveLength(8);
      expect(grid.querySelectorAll('.ui-mcal__gbody [role="row"]')).toHaveLength(48);
      expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      // Today's column is marked; the slot tab stop is today at the start of the working day
      expect(grid.querySelector(".ui-mcal__colhead[data-today]")!.textContent).toContain("28");
      expect(grid.querySelector('[tabindex="0"]')!.getAttribute("data-cell")).toBe(`${colOf(28)}:18`);
      // The sidebar: people and their calendars, a box each
      const groups = [...el.querySelectorAll(".ui-mcal__group-head")].map((g) => g.textContent!.trim());
      expect(groups).toEqual(["MCMaya Chen", "TOTheo Okafor", "PRPriya Raman"]);
      expect(el.querySelectorAll(".ui-mcal__check")).toHaveLength(6);
      expect(el.querySelector(".ui-mcal__count-value")!.textContent).toBe("6/6");
      expect(el.querySelector(".ui-mcal__now")).not.toBeNull();
    });
  }

  test("events: placed by time and overlap, with the person, marks and words a screen reader needs", async () => {
    const el = await make();
    const client = ev(el, "client")!;
    const dentist = ev(el, "dentist")!;
    // Both in Wednesday's column, starting in their own slots
    expect(client.closest("[data-cell]")!.getAttribute("data-cell")).toBe(`${colOf(28)}:28`);
    expect(dentist.closest("[data-cell]")!.getAttribute("data-cell")).toBe(`${colOf(28)}:30`);
    expect([client.style.getPropertyValue("--col"), dentist.style.getPropertyValue("--col"), client.style.getPropertyValue("--cols")]).toEqual(["0", "1", "2"]);
    // Side by side, not on top of each other
    const a = client.getBoundingClientRect();
    const b = dentist.getBoundingClientRect();
    expect(b.left).toBeGreaterThanOrEqual(a.right - 1);
    expect(b.top).toBeGreaterThan(a.top);
    // A conflict across Priya's calendars, with a visible mark and words
    expect(client.hasAttribute("data-conflict")).toBe(true);
    expect(client.querySelector(".ui-mcal__mark--conflict")).not.toBeNull();
    expect(client.textContent).toContain("Conflicts with Dentist (Google)");
    expect(client.textContent).toContain("Priya Raman · Client meetings · Exchange");
    expect(client.querySelector(".ui-mcal__who")!.textContent).toBe("PR");
    // Read-only and tentative are marked; cancelled is struck through
    expect(ev(el, "keynote")!.hasAttribute("data-readonly")).toBe(true);
    expect(ev(el, "keynote")!.textContent).toContain("Read-only");
    expect(ev(el, "one-on-one")!.dataset.status).toBe("tentative");
    expect(getComputedStyle(ev(el, "one-on-one")!).outlineStyle).toBe("dashed");
    expect(getComputedStyle(ev(el, "close")!.querySelector(".ui-mcal__ev-title")!).textDecorationLine).toBe("line-through");
    // All-day events sit under their days' names
    expect(el.querySelectorAll('.ui-mcal__allday [data-event="summit-days"]')).toHaveLength(2);
    // A slot says what's in it
    expect(cell(el, colOf(28), 28).querySelector(":scope > .tc-sr-only")!.textContent).toMatch(/Wednesday, October 28, 2026, 2:00\s?PM, 1 event: Client review/);
    expect(cell(el, colOf(28), 34).textContent).toMatch(/free$/);
  });

  test("views: switching, Month and Agenda and People, Today and stepping – each a cancelable change", async () => {
    const el = await make();
    const asked: string[] = [];
    el.addEventListener("tc-view-change", (e) => asked.push((e as CustomEvent<MultiCalendarViewChange>).detail.view));
    const dates: number[] = [];
    el.addEventListener("tc-date-change", (e) => dates.push((e as CustomEvent<MultiCalendarDateChange>).detail.date));
    el.querySelector<HTMLElement>('[data-view="month"]')!.click();
    await settle();
    expect(el.view).toBe("month");
    expect(el.querySelectorAll(".ui-mcal__mday")).toHaveLength(42);
    expect(el.querySelector(`[data-day="${at(28, 0)}"]`)!.getAttribute("tabindex")).toBe("0");
    expect(el.querySelector(`[data-day="${at(28, 0)}"] > .tc-sr-only`)!.textContent).toMatch(/4 events$/);
    // Agenda: days from the focused one, each event once
    el.querySelector<HTMLElement>('[data-view="agenda"]')!.click();
    await settle();
    expect([...el.querySelectorAll(".ui-mcal__agenda [data-event]")].map((e) => e.getAttribute("data-event"))).toEqual(["standup", "review", "client", "dentist", "summit-days", "keynote", "one-on-one", "close"]);
    // People: one column per person on the day in focus
    el.querySelector<HTMLElement>('[data-view="people"]')!.click();
    await settle();
    expect([...el.querySelectorAll(".ui-mcal__person")].map((p) => p.textContent)).toEqual(["Maya Chen", "Theo Okafor", "Priya Raman"]);
    expect(ev(el, "client")!.closest("[data-cell]")!.getAttribute("data-cell")).toBe("2:28");
    expect(asked).toEqual(["month", "agenda", "people"]);
    // Prevented, the view stays
    el.addEventListener("tc-view-change", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLElement>('[data-view="day"]')!.click();
    await settle();
    expect(el.view).toBe("people");
    // Stepping a week, then back to today
    el.view = "week";
    await settle();
    el.querySelector<HTMLElement>(".ui-mcal__nav .ui-mcal__step:last-of-type")!.click();
    await settle();
    expect(dates).toEqual([at(4 + 31, 0)]);
    expect(el.querySelector(".ui-mcal__range")!.textContent).toMatch(/Nov 2 – Nov 8, 2026/);
    el.querySelector<HTMLElement>(".ui-mcal__today")!.click();
    await settle();
    expect(dates.at(-1)).toBe(at(28, 0));
    // Arrow keys in the view switcher
    const radio = el.querySelector<HTMLElement>('[data-view="week"]')!;
    radio.focus();
    key(radio, "ArrowRight");
    await settle();
    expect(el.view).toBe("month");
    await expect.poll(() => document.activeElement?.getAttribute("data-view")).toBe("month");
  });

  test("showing and hiding calendars: the box, Only this and Show all – cancelable", async () => {
    const el = await make();
    const seen: string[][] = [];
    el.addEventListener("tc-visible-change", (e) => seen.push((e as CustomEvent<MultiCalendarVisibleChange>).detail.visible));
    const box = el.querySelector<HTMLInputElement>(`#${CSS.escape(el.querySelector(".ui-mcal__check")!.id)}`)!;
    expect(box.closest(".ui-mcal__cal")!.textContent).toContain("Work");
    box.click();
    await settle();
    expect(seen[0]).toEqual(["maya-home", "theo-work", "priya-client", "priya-home", "summit"]);
    expect(ev(el, "review")).toBeNull();
    expect(el.querySelector(".ui-mcal__count-value")!.textContent).toBe("5/6");
    // Only this
    const only = [...el.querySelectorAll<HTMLElement>(".ui-mcal__only")].find((b) => b.textContent!.includes("Client meetings"))!;
    only.click();
    await settle();
    expect(el.visible).toEqual(["priya-client"]);
    expect([...el.querySelectorAll("[data-event]")].map((e) => e.getAttribute("data-event"))).toEqual(["client"]);
    // Conflicts still show though the other calendar is hidden – the person is still double-booked
    expect(ev(el, "client")!.hasAttribute("data-conflict")).toBe(true);
    el.querySelector<HTMLElement>(".ui-mcal__show-all")!.click();
    await settle();
    expect(el.visible).toHaveLength(6);
    // Prevented, nothing changes
    el.addEventListener("tc-visible-change", (e) => e.preventDefault());
    box.click();
    await settle();
    expect(el.visible).toHaveLength(6);
    expect(ev(el, "review")).not.toBeNull();
    // A calendar can start hidden
    const hidden = await make({ events: EVENTS });
    hidden.calendars = CALENDARS.map((c) => (c.id === "summit" ? { ...c, visible: false } : c));
    await settle();
    expect(ev(hidden, "keynote")).toBeNull();
  });

  test("create from a slot with the keyboard: the editor, then tc-event-create – or nothing when prevented", async () => {
    const el = await make();
    const created: MultiCalendarEventCreate[] = [];
    el.addEventListener("tc-event-create", (e) => created.push((e as CustomEvent<MultiCalendarEventCreate>).detail));
    const slot = cell(el, colOf(30), 28);
    slot.focus();
    key(slot, "Enter");
    await settle();
    await expect.poll(() => pop(el)?.matches("form")).toBe(true);
    const form = pop(el)!;
    expect(document.activeElement).toBe(form.querySelector("[data-first]"));
    expect(el.querySelector(".ui-mcal__ghost")).not.toBeNull();
    // Only writable calendars, by person; the first one picked
    const options = [...form.querySelectorAll("option")].map((o) => o.value);
    expect(options).toEqual(["maya-work", "maya-home", "theo-work", "priya-client", "priya-home"]);
    const [date, time] = [form.querySelectorAll<HTMLInputElement>('input[type="date"]')[0], form.querySelectorAll<HTMLInputElement>('input[type="time"]')];
    expect([date.value, time[0].value, time[1].value]).toEqual(["2026-10-30", "14:00", "15:00"]);
    // A title is required
    form.querySelector<HTMLElement>(".ui-mcal__save")!.click();
    await settle();
    expect(form.querySelector('[role="alert"]')!.textContent).toContain("Add a title");
    expect(created).toHaveLength(0);
    const title = form.querySelector<HTMLInputElement>("[data-first]")!;
    title.value = "Design review";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    const select = form.querySelector<HTMLSelectElement>("select")!;
    select.value = "theo-work";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    form.querySelector<HTMLElement>(".ui-mcal__save")!.click();
    await settle();
    expect(created).toHaveLength(1);
    expect(created[0].event).toMatchObject({ title: "Design review", calendarId: "theo-work", start: at(30, 14), end: at(30, 15) });
    expect(created[0].calendar.id).toBe("theo-work");
    expect(pop(el)).toBeNull();
    expect(ev(el, created[0].event.id)).not.toBeNull();
    await expect.poll(() => document.activeElement?.getAttribute("data-event")).toBe(created[0].event.id);
    expect(el.querySelector('[role="status"]')!.textContent).toContain("Created Design review");
    // Prevented: not added, the editor stays open
    el.addEventListener("tc-event-create", (e) => e.preventDefault());
    const before = el.events.length;
    const other = cell(el, colOf(30), 34);
    other.focus();
    key(other, "Enter");
    await settle();
    await expect.poll(() => pop(el)?.matches("form")).toBe(true);
    const t2 = pop(el)!.querySelector<HTMLInputElement>("[data-first]")!;
    t2.value = "Refused";
    t2.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    pop(el)!.querySelector<HTMLElement>(".ui-mcal__save")!.click();
    await settle();
    expect(el.events).toHaveLength(before);
    expect(pop(el)).not.toBeNull();
  });

  test("details, Edit and Delete: tc-event-update with the previous event, tc-event-delete, both cancelable", async () => {
    const el = await make();
    const updates: MultiCalendarEventUpdate[] = [];
    const deletes: MultiCalendarEventDelete[] = [];
    el.addEventListener("tc-event-update", (e) => updates.push((e as CustomEvent<MultiCalendarEventUpdate>).detail));
    el.addEventListener("tc-event-delete", (e) => deletes.push((e as CustomEvent<MultiCalendarEventDelete>).detail));
    ev(el, "review")!.click();
    await settle();
    await expect.poll(() => pop(el)?.getAttribute("role")).toBe("dialog");
    const detail = pop(el)!;
    expect(detail.textContent).toContain("Sampling review");
    expect(detail.textContent).toContain("Room 4B");
    expect(detail.textContent).toContain("Theo Okafor");
    expect(detail.textContent).toContain("Google");
    expect(document.activeElement).toBe(detail.querySelector(".ui-mcal__edit"));
    detail.querySelector<HTMLElement>(".ui-mcal__edit")!.click();
    await settle();
    const form = pop(el)!;
    expect(form.matches("form")).toBe(true);
    const title = form.querySelector<HTMLInputElement>("[data-first]")!;
    expect(title.value).toBe("Sampling review");
    title.value = "Sampling plan review";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    const end = form.querySelectorAll<HTMLInputElement>('input[type="time"]')[1];
    end.value = "13:00";
    end.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    form.querySelector<HTMLElement>(".ui-mcal__save")!.click();
    await settle();
    expect(updates).toHaveLength(1);
    expect(updates[0].event).toMatchObject({ id: "review", title: "Sampling plan review", start: at(28, 11), end: at(28, 13), location: "Room 4B", attendees: ["Theo Okafor"] });
    expect(updates[0].previous.title).toBe("Sampling review");
    expect(el.events.find((e) => e.id === "review")!.title).toBe("Sampling plan review");
    // An end before the start is refused
    ev(el, "review")!.click();
    await settle();
    pop(el)!.querySelector<HTMLElement>(".ui-mcal__edit")!.click();
    await settle();
    const bad = pop(el)!.querySelectorAll<HTMLInputElement>('input[type="time"]')[1];
    bad.value = "10:00";
    bad.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    pop(el)!.querySelector<HTMLElement>(".ui-mcal__save")!.click();
    await settle();
    expect(pop(el)!.querySelector('[role="alert"]')!.textContent).toContain("ends before it starts");
    expect(updates).toHaveLength(1);
    key(pop(el)!, "Escape");
    await settle();
    expect(pop(el)).toBeNull();
    await expect.poll(() => document.activeElement?.getAttribute("data-event")).toBe("review");
    // Delete: prevented, it stays; allowed, it goes
    el.addEventListener("tc-event-delete", (e) => e.preventDefault(), { once: true });
    ev(el, "review")!.click();
    await settle();
    pop(el)!.querySelector<HTMLElement>(".ui-mcal__delete")!.click();
    await settle();
    expect(ev(el, "review")).not.toBeNull();
    pop(el)!.querySelector<HTMLElement>(".ui-mcal__delete")!.click();
    await settle();
    expect(deletes.map((d) => d.event.id)).toEqual(["review", "review"]);
    expect(ev(el, "review")).toBeNull();
    expect(pop(el)).toBeNull();
    // Prevented update: unchanged
    el.addEventListener("tc-event-update", (e) => e.preventDefault(), { once: true });
    ev(el, "ledger")!.click();
    await settle();
    pop(el)!.querySelector<HTMLElement>(".ui-mcal__edit")!.click();
    await settle();
    const t = pop(el)!.querySelector<HTMLInputElement>("[data-first]")!;
    t.value = "Changed";
    t.dispatchEvent(new Event("input", { bubbles: true }));
    pop(el)!.querySelector<HTMLElement>(".ui-mcal__save")!.click();
    await settle();
    expect(el.events.find((e) => e.id === "ledger")!.title).toBe("Ledger walkthrough");
  });

  test("read-only calendars, `readonly` and pending saves refuse changes, and say why", async () => {
    const el = await make();
    let asked = 0;
    for (const name of ["tc-event-update", "tc-event-delete", "tc-event-create"]) el.addEventListener(name, () => asked++);
    ev(el, "keynote")!.click();
    await settle();
    const detail = pop(el)!;
    expect(detail.querySelector<HTMLButtonElement>(".ui-mcal__edit")!.disabled).toBe(true);
    expect(detail.querySelector<HTMLButtonElement>(".ui-mcal__delete")!.disabled).toBe(true);
    expect(detail.querySelector(".ui-mcal__reason")!.textContent).toContain("This calendar is read-only: Audit Summit (iCal feed)");
    expect(document.activeElement!.closest(".ui-mcal__pop")).toBe(detail);
    key(detail, "Escape");
    await settle();
    // The Delete key on a read-only event
    const keynote = ev(el, "keynote")!;
    keynote.focus();
    key(keynote, "Delete");
    await settle();
    expect(ev(el, "keynote")).not.toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toContain("Can't delete Keynote");
    // Not draggable
    expect(keynote.hasAttribute("data-movable")).toBe(false);
    // Read-only calendars aren't offered in the editor
    el.querySelector<HTMLElement>(".ui-mcal__new")!.click();
    await settle();
    expect([...pop(el)!.querySelectorAll("option")].map((o) => o.value)).not.toContain("summit");
    key(pop(el)!, "Escape");
    await settle();
    // Pending: saving, not editable
    el.pending = ["ledger"];
    await settle();
    expect(ev(el, "ledger")!.textContent).toContain("Saving…");
    expect(ev(el, "ledger")!.getAttribute("aria-busy")).toBe("true");
    ev(el, "ledger")!.click();
    await settle();
    expect(pop(el)!.querySelector<HTMLButtonElement>(".ui-mcal__edit")!.disabled).toBe(true);
    key(pop(el)!, "Escape");
    await settle();
    // The whole element view-only
    el.readonly = true;
    await settle();
    expect(el.querySelector<HTMLButtonElement>(".ui-mcal__new")!.disabled).toBe(true);
    const slot = cell(el, colOf(30), 28);
    slot.focus();
    key(slot, "Enter");
    await settle();
    expect(pop(el)).toBeNull();
    expect(asked).toBe(0);
  });

  test("drag: move an event to another day and time, resize its end, drag out a new one", async () => {
    const el = await make();
    const updates: MultiCalendarEventUpdate[] = [];
    el.addEventListener("tc-event-update", (e) => updates.push((e as CustomEvent<MultiCalendarEventUpdate>).detail));
    // Ledger walkthrough, Tue 13:00–15:00 → Thu 14:00–16:00
    await drag(el, ev(el, "ledger")!.querySelector(".ui-mcal__ev-title")!, { c: colOf(27), minute: 13 * 60 + 30 }, { c: colOf(29), minute: 14 * 60 + 30 });
    expect(updates.map((u) => [u.event.id, u.event.start, u.event.end])).toEqual([["ledger", at(29, 14), at(29, 16)]]);
    expect(ev(el, "ledger")!.closest("[data-cell]")!.getAttribute("data-cell")).toBe(`${colOf(29)}:28`);
    // The click that ends a drag doesn't open the details
    expect(pop(el)).toBeNull();
    await new Promise((r) => setTimeout(r));
    // Resize: Thu 16:00 → 17:00
    await drag(el, ev(el, "ledger")!.querySelector(".ui-mcal__resize")!, { c: colOf(29), minute: 16 * 60 - 2 }, { c: colOf(29), minute: 17 * 60 - 2 });
    expect(updates.at(-1)!.event).toMatchObject({ start: at(29, 14), end: at(29, 17) });
    // A prevented move stays put
    el.addEventListener("tc-event-update", (e) => e.preventDefault(), { once: true });
    await drag(el, ev(el, "standup")!, { c: colOf(28), minute: 9 * 60 + 35 }, { c: colOf(28), minute: 12 * 60 + 35 });
    expect(el.events.find((e) => e.id === "standup")!.start).toBe(at(28, 9, 30));
    // Read-only events don't move
    const count = updates.length;
    await drag(el, ev(el, "keynote")!, { c: colOf(29), minute: 9 * 60 + 10 }, { c: colOf(29), minute: 11 * 60 });
    expect(updates).toHaveLength(count);
    // Drag out a new event on Friday 13:00–14:30
    await drag(el, cell(el, colOf(30), 26), { c: colOf(30), minute: 13 * 60 + 2 }, { c: colOf(30), minute: 14 * 60 + 25 });
    await expect.poll(() => pop(el)?.matches("form")).toBe(true);
    const times = pop(el)!.querySelectorAll<HTMLInputElement>('input[type="time"]');
    expect([times[0].value, times[1].value]).toEqual(["13:00", "14:30"]);
  });

  test("keyboard: slots, into a slot's events and between them, Delete, Escape back", async () => {
    const el = await make();
    const deleted: string[] = [];
    el.addEventListener("tc-event-delete", (e) => deleted.push((e as CustomEvent<MultiCalendarEventDelete>).detail.event.id));
    const start = el.querySelector<HTMLElement>('.ui-mcal__grid [tabindex="0"]')!;
    start.focus();
    key(start, "ArrowDown");
    await expect.poll(() => document.activeElement?.getAttribute("data-cell")).toBe(`${colOf(28)}:19`);
    key(document.activeElement!, "ArrowLeft");
    await expect.poll(() => document.activeElement?.getAttribute("data-cell")).toBe(`${colOf(27)}:19`);
    key(document.activeElement!, "PageDown");
    await expect.poll(() => document.activeElement?.getAttribute("data-cell")).toBe(`${colOf(27)}:23`);
    key(document.activeElement!, "End");
    await expect.poll(() => document.activeElement?.getAttribute("data-cell")).toBe("6:23");
    key(document.activeElement!, "Home");
    await expect.poll(() => document.activeElement?.getAttribute("data-cell")).toBe("0:23");
    expect(el.querySelectorAll('.ui-mcal__grid [tabindex="0"]')).toHaveLength(1);
    // Into Wednesday 2 PM: the client review; ↓ to the dentist in the same column; Escape back to its slot
    const busy = cell(el, colOf(28), 28);
    busy.focus();
    key(busy, "Enter");
    expect(document.activeElement?.getAttribute("data-event")).toBe("client");
    key(document.activeElement!, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-event")).toBe("dentist");
    key(document.activeElement!, "Escape");
    expect(document.activeElement?.getAttribute("data-cell")).toBe(`${colOf(28)}:30`);
    // Enter on an event opens its details; Delete deletes it and focus stays in the grid
    key(document.activeElement!, "Enter");
    const dentist = ev(el, "dentist")!;
    dentist.focus();
    key(dentist, "Delete");
    await settle();
    expect(deleted).toEqual(["dentist"]);
    await expect.poll(() => document.activeElement?.closest(".ui-mcal__grid")).toBe(el.querySelector(".ui-mcal__grid"));
    // Month: arrows move a day and a week
    el.view = "month";
    await settle();
    const day = el.querySelector<HTMLElement>('.ui-mcal__month [tabindex="0"]')!;
    day.focus();
    key(day, "ArrowDown");
    await expect.poll(() => document.activeElement?.getAttribute("data-day")).toBe(String(at(4 + 31, 0)));
    key(document.activeElement!, "ArrowLeft");
    await expect.poll(() => document.activeElement?.getAttribute("data-day")).toBe(String(at(3 + 31, 0)));
    // Agenda: ↑ / ↓ between events
    el.view = "agenda";
    await settle();
    const first = el.querySelector<HTMLElement>('.ui-mcal__agenda [tabindex="0"]')!;
    expect(first.dataset.event).toBe("standup");
    first.focus();
    key(first, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-event")).toBe("review");
    key(document.activeElement!, "End");
    expect(document.activeElement?.getAttribute("data-event")).toBe("close");
  });

  test("narrow: the sidebar folds behind Calendars, Week shows three days and then one", async () => {
    const el = await make({ width: 620 });
    await expect.poll(() => el.querySelectorAll(".ui-mcal__colhead").length).toBe(3);
    expect(el.querySelector(".ui-mcal__colhead")!.textContent).toContain("28");
    const toggle = el.querySelector<HTMLElement>(".ui-mcal__side-toggle")!;
    const side = el.querySelector<HTMLElement>(".ui-mcal__side")!;
    expect(side.hidden).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    toggle.click();
    await settle();
    expect(side.hidden).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    key(side.querySelector(".ui-mcal__check")!, "Escape");
    await settle();
    expect(side.hidden).toBe(true);
    await expect.poll(() => document.activeElement).toBe(toggle);
    (el.parentElement as HTMLElement).style.width = "360px";
    await expect.poll(() => el.querySelectorAll(".ui-mcal__colhead").length).toBe(1);
    // Stepping moves a day at a time when one is shown
    el.querySelector<HTMLElement>(".ui-mcal__nav .ui-mcal__step:last-of-type")!.click();
    await settle();
    expect(el.date).toBe(at(29, 0));
    // Nothing wider than the element
    expect(el.querySelector(".ui-mcal__card")!.scrollWidth).toBeLessThanOrEqual(el.querySelector(".ui-mcal__card")!.clientWidth + 1);
    el.view = "agenda";
    await settle();
    expect(el.querySelector(".ui-mcal__agenda")!.scrollWidth).toBeLessThanOrEqual(el.querySelector(".ui-mcal__agenda")!.clientWidth + 1);
  });

  test("a time zone: events are placed by that zone's wall clock", async () => {
    const utc = Date.UTC(2026, 9, 28, 0, 0);
    const el = await make({ events: [{ id: "tokyo", calendarId: "maya-work", title: "Tokyo sync", start: utc, end: utc + 3_600_000 }] });
    el.timeZone = "Asia/Tokyo";
    el.date = utc;
    await settle();
    const tokyo = ev(el, "tokyo")!;
    // 00:00 UTC is 09:00 in Tokyo, on Wednesday the 28th there
    expect(tokyo.style.getPropertyValue("--top")).toBe("540");
    expect(tokyo.closest("[data-cell]")!.getAttribute("data-cell")).toBe(`${colOf(28)}:18`);
    // An unknown zone falls back to the browser's instead of throwing
    el.timeZone = "Mars/Olympus";
    await settle();
    expect(ev(el, "tokyo")).not.toBeNull();
  });

  test("bad data doesn't break it: unknown calendars, invalid times, a reversed event", async () => {
    const el = await make({
      events: [
        { id: "ghost", calendarId: "nope", title: "Nobody's", start: at(28, 9), end: at(28, 10) },
        { id: "nan", calendarId: "maya-work", title: "Broken", start: NaN, end: NaN },
        { id: "rev", calendarId: "maya-work", title: "Reversed", start: at(28, 16), end: at(28, 15) },
      ],
    });
    expect(ev(el, "ghost")).toBeNull();
    expect(ev(el, "nan")).toBeNull();
    // A reversed event is shown half an hour long
    expect(ev(el, "rev")!.style.getPropertyValue("--len")).toBe("30");
    el.calendars = [];
    await settle();
    expect(el.querySelector(".ui-mcal__quiet")!.textContent).toContain("No calendars");
    el.view = "people";
    await settle();
    expect(el.querySelector(".ui-mcal__empty")!.textContent).toContain("No calendars");
  });

  test("many calendars: 600 events across 12 calendars render every view without a stall", async () => {
    const people = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `Person ${i + 1}` }));
    const calendars: CalendarSource[] = people.flatMap((p, i) => [
      { id: `${p.id}-a`, name: "Work", owner: p, provider: i % 2 ? "Outlook" : "Google" },
      { id: `${p.id}-b`, name: "Personal", owner: p, provider: "Google" },
    ]);
    const events: CalendarEvent[] = Array.from({ length: 600 }, (_, i) => {
      const start = at(26 + (i % 7), 7 + ((i * 7) % 11), (i % 4) * 15);
      return { id: `m${i}`, calendarId: calendars[i % 12].id, title: `Meeting ${i}`, start, end: start + (30 + (i % 3) * 30) * 60_000 };
    });
    const t0 = performance.now();
    const el = await make({ events });
    el.calendars = calendars;
    await settle();
    expect(el.querySelectorAll(".ui-mcal__ev").length).toBe(600);
    for (const view of ["month", "agenda", "people", "day"] as const) {
      el.view = view;
      await settle();
      if (view === "people") expect(el.querySelectorAll(".ui-mcal__person")).toHaveLength(6);
    }
    // Generous – a regression to quadratic layout or a layout read per event blows well past it
    expect(performance.now() - t0).toBeLessThan(4000);
  });

  test("React wrapper: an uncontrolled view survives parent re-renders; a controlled view stays until the parent changes it; return false refuses a create", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "1100px";
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(MultiCalendar, {
        title: "Team",
        calendars: CALENDARS,
        events: EVENTS,
        now: NOW,
        defaultDate: NOW,
        onViewChange: (v) => void seen.push(v),
        onEventCreate: () => false,
        "data-n": n,
      } as React.ComponentProps<typeof MultiCalendar>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcMultiCalendar>("tc-multi-calendar")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Team");
    el.querySelector<HTMLElement>('[data-view="month"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.view).toBe("month");
    expect(seen).toEqual(["month"]);
    // Return false from onEventCreate: not added
    const before = el.events.length;
    el.querySelector<HTMLElement>(".ui-mcal__new")!.click();
    await settle();
    const t = pop(el)!.querySelector<HTMLInputElement>("[data-first]")!;
    t.value = "Nope";
    t.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    pop(el)!.querySelector<HTMLElement>(".ui-mcal__save")!.click();
    await settle();
    expect(el.events).toHaveLength(before);
    await act(async () => root.unmount());

    // Controlled
    const asked: string[] = [];
    const root2 = createRoot(host);
    await act(async () => root2.render(React.createElement(MultiCalendar, { calendars: CALENDARS, events: EVENTS, now: NOW, date: NOW, view: "week", onViewChange: (v) => void asked.push(v) })));
    await settle();
    const el2 = host.querySelector<TcMultiCalendar>("tc-multi-calendar")!;
    el2.querySelector<HTMLElement>('[data-view="day"]')!.click();
    await settle();
    expect(asked).toEqual(["day"]);
    expect(el2.view).toBe("week");
    await act(async () => root2.render(React.createElement(MultiCalendar, { calendars: CALENDARS, events: EVENTS, now: NOW, date: NOW, view: "day" })));
    await settle();
    expect(el2.view).toBe("day");
    expect(el2.querySelectorAll(".ui-mcal__colhead")).toHaveLength(1);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with an event's details open`, async () => {
      const wrap = await fixture<HTMLDivElement>(html`<div data-tc-theme=${theme} style="width: 1100px; padding: 16px; background: var(--tc-surface-base)">
        <tc-multi-calendar description="Every calendar." .now=${NOW} .date=${NOW} .calendars=${CALENDARS} .events=${EVENTS}></tc-multi-calendar>
        <tc-multi-calendar look="clean" view="month" .now=${NOW} .date=${NOW} .calendars=${CALENDARS} .events=${EVENTS}></tc-multi-calendar>
        <tc-multi-calendar look="clean" view="agenda" .now=${NOW} .date=${NOW} .calendars=${CALENDARS} .events=${EVENTS}></tc-multi-calendar>
      </div>`);
      const el = wrap.querySelector<TcMultiCalendar>("tc-multi-calendar")!;
      await settle();
      ev(el, "client")!.click();
      await settle();
      await finish(wrap);
      await finish(document.body);
      const result = await axe.run(document.body, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
