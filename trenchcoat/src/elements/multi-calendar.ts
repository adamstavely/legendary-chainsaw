import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { PopoverController, popoverCss } from "./internal/popover";
import { safeMediaUrl } from "./internal/safe-media";
import { adoptStyles } from "./internal/styles";
import { initials, isMac } from "./internal/util";
import {
  DAY_MINUTES,
  MINUTE,
  addDays,
  addMonths,
  dayStart,
  daysFrom,
  findConflicts,
  knownZone,
  layoutDay,
  monthWeeks,
  snapMinutes,
  wall,
  wallMinutes,
  weekStartOf,
  zoned,
  type Placed,
} from "./internal/calendar-layout";

/*
 * <tc-multi-calendar> – a calendar of calendars: many people's events from many accounts (Google, Outlook, Exchange,
 * an iCal feed) in one place, to see, create, edit and delete them without visiting each calendar. The sidebar lists
 * the calendars by person (or by account) with a box to show or hide each, "Only this" and a mini month; the main
 * area shows a Day, Week, Month or Agenda view, or People – one column per person for a day, to see who is free.
 *   · overlapping events sit side by side; all-day events sit under the column's name; the current time is a line;
 *     hours outside `workingHours` are shaded
 *   · every event says whose calendar it's on (initials, and the person and calendar in its name and its details),
 *     read-only calendars have a lock, tentative events a dashed edge, and one person's events that overlap across
 *     their calendars are marked as a conflict
 *   · drag on an empty slot (or click it, or "New event") to create; click an event for its details, Edit and
 *     Delete; drag an event to move it, or its bottom edge to change its end. Read-only calendars refuse all three
 *   · the page owns the data: tc-event-create / tc-event-update / tc-event-delete are cancelable, and the element
 *     applies the change to `events` unless prevented – save it to the calendar's account in the listener, and
 *     put the event's id in `pending` while it saves
 *   · keyboard: the time grid is a grid of half-hour slots – arrows move a slot or a column, Page Up / Down two hours,
 *     Home / End the first and last column; Enter on an empty slot creates an event there, on a busy one moves into
 *     its events (↑ / ↓ between them, Enter for details, Delete to delete, Escape back to the slot). Month is a grid
 *     of days the same way; Agenda a list. Escape closes a popover and returns focus
 *   · narrow: the sidebar folds behind a Calendars button, Week shows three days and then one
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-multi-calendar .calendars=${[…]} .events=${[…]} @tc-event-create=${save}></tc-multi-calendar>
 */

/* Icons: Lucide (ISC, lucide.dev) */
const calendarIcon = svg`<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>`;
const icon = (paths: TemplateResult, cls = "") => html`<svg class=${`ui-mcal__icon ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICONS = {
  left: svg`<path d="m15 18-6-6 6-6"></path>`,
  right: svg`<path d="m9 18 6-6-6-6"></path>`,
  plus: svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`,
  lock: svg`<rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`,
  alert: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
  x: svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
  pin: svg`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>`,
  people: svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`,
  repeat: svg`<path d="m17 2 4 4-4 4"></path><path d="M3 11v-1a4 4 0 0 1 4-4h14"></path><path d="m7 22-4-4 4-4"></path><path d="M21 13v1a4 4 0 0 1-4 4H3"></path>`,
  sidebar: svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path>`,
  clock: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`,
};

/* ---------- The data ---------- */

/** The person a calendar belongs to */
export type CalendarOwner = {
  id: string;
  name: string;
  /** A picture URL; initials are drawn without one */
  avatar?: string;
};

/** One calendar from one account */
export type CalendarSource = {
  id: string;
  /** The calendar's name, e.g. "Work" or "Team holidays" */
  name: string;
  owner: CalendarOwner;
  /** The account or service it comes from: "Google", "Outlook", "Exchange", "iCal feed" */
  provider?: string;
  /** Its colour, 1–6 – the library's chart colours; by default the next one in turn */
  color?: number;
  /** Shown but can't be changed (a shared or subscribed calendar): no create, edit, move or delete */
  readOnly?: boolean;
  /** Shown at first; false starts it hidden (ignored when the element's `visible` is set) */
  visible?: boolean;
};

/** One event */
export type CalendarEvent = {
  id: string;
  /** The calendar it's on */
  calendarId: string;
  title: string;
  /** Epoch ms */
  start: number;
  /** Epoch ms; for an all-day event the midnight after its last day */
  end: number;
  allDay?: boolean;
  location?: string;
  /** Who else is invited, as names */
  attendees?: string[];
  /** How it repeats, in words – "Every weekday" (shown, not expanded: pass each occurrence as an event) */
  recurring?: string;
  /** Tentative events have a dashed edge; cancelled ones are struck through. Default "confirmed" */
  status?: "confirmed" | "tentative" | "cancelled";
};

export type MultiCalendarView = "day" | "week" | "month" | "agenda" | "people";

/** Working hours, shaded outside: hours 0–24, and the weekdays they apply to (0 Sunday … 6 Saturday) */
export type MultiCalendarHours = { start: number; end: number; days?: number[] };

/* ---------- The events ---------- */

/** Details of tc-event-create */
export type MultiCalendarEventCreate = { event: CalendarEvent; calendar: CalendarSource };
/** Details of tc-event-update: the event as it will be, as it was, and the calendar it will be on */
export type MultiCalendarEventUpdate = { event: CalendarEvent; previous: CalendarEvent; calendar: CalendarSource };
/** Details of tc-event-delete */
export type MultiCalendarEventDelete = { event: CalendarEvent; calendar: CalendarSource };
/** Details of tc-view-change */
export type MultiCalendarViewChange = { view: MultiCalendarView };
/** Details of tc-date-change: the day in focus, as epoch ms of its midnight */
export type MultiCalendarDateChange = { date: number };
/** Details of tc-visible-change: the ids of the calendars shown */
export type MultiCalendarVisibleChange = { visible: string[] };

/** Every word the element shows; pass `labels` with any of them to change them */
export const defaultMultiCalendarLabels = {
  today: "Today",
  previous: "Previous",
  next: "Next",
  newEvent: "New event",
  calendars: "Calendars",
  groupBy: "Group by",
  byPerson: "People",
  byProvider: "Accounts",
  onlyThis: "Only this",
  showAll: "Show all",
  view: "View",
  day: "Day",
  week: "Week",
  month: "Month",
  agenda: "Agenda",
  people: "People",
  allDay: "All day",
  time: "Time",
  readOnly: "Read-only",
  readOnlyReason: "This calendar is read-only",
  tentative: "Tentative",
  cancelled: "Cancelled",
  conflict: "Conflict",
  conflictWith: "Conflicts with",
  saving: "Saving…",
  more: "more",
  noEvents: "Nothing scheduled",
  noCalendars: "No calendars to show",
  edit: "Edit",
  delete: "Delete",
  close: "Close",
  save: "Save",
  cancel: "Cancel",
  create: "Create",
  title: "Title",
  untitled: "(No title)",
  calendar: "Calendar",
  starts: "Starts",
  ends: "Ends",
  location: "Location",
  attendees: "Attendees",
  repeats: "Repeats",
  needTitle: "Add a title",
  endBeforeStart: "The event ends before it starts",
  noWritable: "None of the calendars shown can be changed",
  free: "free",
  events: "events",
  event: "event",
};
export type MultiCalendarLabels = typeof defaultMultiCalendarLabels;

const VIEWS: MultiCalendarView[] = ["day", "week", "month", "agenda", "people"];
const SLOT = 30;
const SLOTS = DAY_MINUTES / SLOT;
const SNAP = 15;
/** Below these widths (px) the sidebar folds away, and Week shows three days, then one */
const FOLD = 760;
const THREE = 480;

/** An event as the element works with it: tidied times, and its calendar */
type Item = {
  ev: CalendarEvent;
  cal: CalendarSource;
  id: string;
  calendarId: string;
  start: number;
  end: number;
  allDay: boolean;
  status: "confirmed" | "tentative" | "cancelled";
};

/** A column of a time grid: a day, or a person on the day in focus */
type Column = {
  key: string;
  day: number;
  owner?: CalendarOwner;
  placed: Placed<Item>[];
  allDay: Item[];
  /** Slot index → the events that start in it */
  starts: Map<number, Placed<Item>[]>;
  today: boolean;
};

/** What the editor holds while it's open */
type Draft = {
  id: string | null;
  title: string;
  calendarId: string;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  error: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateField = (ms: number, tz?: string) => {
  const w = wall(ms, tz);
  return `${w.y}-${pad(w.m)}-${pad(w.d)}`;
};
const timeField = (ms: number, tz?: string) => {
  const w = wall(ms, tz);
  return `${pad(w.h)}:${pad(w.min)}`;
};
/** "2026-10-28" and "09:30" back to epoch ms in the zone; NaN when either isn't a valid value */
const fromFields = (date: string, time: string, tz?: string) => {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})/.exec(time || "00:00");
  if (!d || !t) return NaN;
  return zoned(+d[1], +d[2], +d[3], +t[1], +t[2], tz);
};

let uidCount = 0;
let newCount = 0;

/**
 * A calendar of calendars – many people's events from many accounts in one Day, Week, Month, Agenda or People view,
 * with show/hide per calendar, conflicts across a person's calendars, and create, edit, move and delete.
 * @tag tc-multi-calendar
 * @fires tc-event-create - An event was created ({ event, calendar }: MultiCalendarEventCreate); cancelable – prevented, it isn't added
 * @fires tc-event-update - An event was edited, moved or resized ({ event, previous, calendar }: MultiCalendarEventUpdate); cancelable – prevented, it stays as it was
 * @fires tc-event-delete - An event was deleted ({ event, calendar }: MultiCalendarEventDelete); cancelable – prevented, it stays
 * @fires tc-view-change - The view was switched ({ view }: MultiCalendarViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-date-change - The day in focus moved ({ date }: MultiCalendarDateChange); cancelable – prevented, `date` stays as it was
 * @fires tc-visible-change - Calendars were shown or hidden ({ visible }: MultiCalendarVisibleChange); cancelable – prevented, `visible` stays as it was
 */
export class TcMultiCalendar extends TcElement {
  static override ui = "mcal";

  /** The heading */
  @property() accessor heading = "Calendars";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The calendars, from every account and person, in the order the sidebar lists them */
  @property({ attribute: false }) accessor calendars: CalendarSource[] = [];
  /** The events of every calendar, in any order. Changed by the user (create, edit, move, delete) unless the event's listener calls preventDefault() */
  @property({ attribute: false }) accessor events: CalendarEvent[] = [];
  /** The view: "day", "week", "month", "agenda" or "people". Changed by the user unless a tc-view-change listener calls preventDefault() */
  @property({ reflect: true }) accessor view: MultiCalendarView = "week";
  /** The day in focus, as epoch ms of any moment in it; by default today. Changed by the user unless a tc-date-change listener calls preventDefault() */
  @property({ type: Number }) accessor date: number | undefined = undefined;
  /** The ids of the calendars shown; by default each calendar's own `visible`. Changed by the user unless a tc-visible-change listener calls preventDefault() */
  @property({ attribute: false }) accessor visible: string[] | undefined = undefined;
  /** Ids of events being saved: drawn as saving, and not editable until they leave the list */
  @property({ attribute: false }) accessor pending: string[] = [];
  /** How the sidebar groups calendars: "person" or "provider" (the account) */
  @property({ attribute: "group-by" }) accessor groupBy: "person" | "provider" = "person";
  /** The IANA time zone the calendar shows, e.g. "America/Los_Angeles"; by default the browser's */
  @property({ attribute: "time-zone" }) accessor timeZone: string | undefined = undefined;
  /** The language for dates and times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The first day of the week: 0 Sunday, 1 Monday … 6 Saturday */
  @property({ type: Number, attribute: "week-start" }) accessor weekStart = 1;
  /** Working hours; time outside them is shaded */
  @property({ attribute: false }) accessor workingHours: MultiCalendarHours = { start: 9, end: 17, days: [1, 2, 3, 4, 5] };
  /** How many days Agenda lists from the day in focus */
  @property({ type: Number, attribute: "agenda-days" }) accessor agendaDays = 14;
  /** View only: no creating, editing, moving or deleting anywhere */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** The current time, epoch ms – for a fixed clock (tests, screenshots); by default the element keeps its own */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Any of the words it shows (see defaultMultiCalendarLabels) */
  @property({ attribute: false }) accessor labels: Partial<MultiCalendarLabels> = {};

  @state() private accessor clock = 0;
  @state() private accessor width = 0;
  @state() private accessor sideOpen = false;
  @state() private accessor announce = "";
  /** The focusable slot of a time grid (column, slot), the focusable day of Month (0–41), the focusable row of Agenda */
  @state() private accessor slotStop: { c: number; s: number } | null = null;
  @state() private accessor dayStop: number | null = null;
  @state() private accessor agendaStop: string | null = null;
  /** The month the mini calendar shows */
  @state() private accessor mini: number | null = null;
  @state() private accessor miniStop: number | null = null;
  /** A slot range being dragged out, wall minutes in a column */
  @state() private accessor selecting: { c: number; a: number; b: number } | null = null;
  /** An event being moved or resized: its preview */
  @state() private accessor dragging: { id: string; c: number; top: number; bottom: number } | null = null;
  /** The popover: an event's details, or the editor */
  @state() private accessor mode: "detail" | "edit" | null = null;
  @state() private accessor openId: string | null = null;
  @state() private accessor draft: Draft | null = null;

  private uid = `tc-mcal-${++uidCount}`;
  private observer?: ResizeObserver;
  private timer = 0;
  private anchor: Element | null = null;
  private suppressClick = false;
  private scrolledFor = "";
  private gesture: {
    kind: "create" | "move" | "resize";
    pointer: number;
    c: number;
    minute: number;
    moved: boolean;
    item?: Item;
    placed?: Placed<Item>;
  } | null = null;

  /* The model, worked out in willUpdate – render only reads it */
  private items: Item[] = [];
  private shown = new Set<string>();
  private calById = new Map<string, CalendarSource>();
  private colourOf = new Map<string, number>();
  private conflicts = new Map<string, Item[]>();
  private columns: Column[] = [];
  private focusDay = 0;
  private fmt!: {
    time: Intl.DateTimeFormat;
    hour: Intl.DateTimeFormat;
    weekday: Intl.DateTimeFormat;
    dayNum: Intl.DateTimeFormat;
    long: Intl.DateTimeFormat;
    short: Intl.DateTimeFormat;
    month: Intl.DateTimeFormat;
    monthShort: Intl.DateTimeFormat;
    narrowDay: Intl.DateTimeFormat;
  };

  private pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-mcal__pop"),
    anchor: () => (this.anchor?.isConnected ? this.anchor : this.querySelector(".ui-mcal__ghost") ?? this.querySelector(".ui-mcal__new")),
    kind: "dialog",
    side: "bottom",
    align: "start",
    initialFocus: () => this.querySelector<HTMLElement>(".ui-mcal__pop [data-first]"),
    returnFocus: () => this.returnTarget(),
    onClose: () => {
      this.mode = null;
      this.openId = null;
      this.draft = null;
      this.selecting = null;
      this.anchor = null;
    },
  });

  /* ---------- Lifecycle ---------- */

  override connectedCallback() {
    super.connectedCallback();
    adoptStyles("tc-popover", popoverCss, this.ownerDocument);
    this.tick();
    this.timer = window.setInterval(() => this.tick(), MINUTE);
    this.observer = new ResizeObserver(() => {
      const w = this.clientWidth;
      if (w > 0 && w !== this.width) this.width = w;
    });
    this.observer.observe(this);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    this.observer?.disconnect();
    this.observer = undefined;
    this.endGesture();
  }
  private tick() {
    // The element's own clock, when `now` isn't given – the one clock read
    if (this.now === undefined) this.clock = Date.now();
  }
  private get current() {
    return this.now ?? this.clock;
  }

  /* ---------- The model ---------- */

  private get L(): MultiCalendarLabels {
    return { ...defaultMultiCalendarLabels, ...this.labels };
  }
  private get tz() {
    return this.timeZone && knownZone(this.timeZone) ? this.timeZone : undefined;
  }
  private get weekDays() {
    return this.width && this.width < THREE ? 1 : this.width && this.width < FOLD ? 3 : 7;
  }
  private get folded() {
    return this.width > 0 && this.width < FOLD;
  }
  private get editable() {
    return !this.readonly;
  }
  private canWrite(cal: CalendarSource | undefined) {
    return !!cal && !cal.readOnly && this.editable;
  }
  private isPending(id: string) {
    return this.pending.includes(id);
  }
  private get writableShown() {
    return this.calendars.filter((c) => this.shown.has(c.id) && this.canWrite(c));
  }

  private formats() {
    const make = (o: Intl.DateTimeFormatOptions) => {
      try {
        return new Intl.DateTimeFormat(this.locale, { timeZone: this.tz, ...o });
      } catch {
        return new Intl.DateTimeFormat(undefined, { timeZone: this.tz, ...o });
      }
    };
    return {
      time: make({ hour: "numeric", minute: "2-digit" }),
      hour: make({ hour: "numeric" }),
      weekday: make({ weekday: "short" }),
      dayNum: make({ day: "numeric" }),
      long: make({ weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      short: make({ weekday: "short", month: "short", day: "numeric" }),
      month: make({ month: "long", year: "numeric" }),
      monthShort: make({ month: "short", day: "numeric" }),
      narrowDay: make({ weekday: "narrow" }),
    };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!VIEWS.includes(this.view)) this.view = "week";
    if (!this.fmt || changed.has("locale") || changed.has("timeZone")) this.fmt = this.formats();
    const tz = this.tz;

    this.calById = new Map();
    this.colourOf = new Map();
    this.calendars.forEach((c, i) => {
      if (!c || typeof c.id !== "string" || this.calById.has(c.id)) return;
      this.calById.set(c.id, c);
      const n = Math.round(Number(c.color));
      this.colourOf.set(c.id, n >= 1 && n <= 6 ? n : (i % 6) + 1);
    });
    this.shown = new Set(this.visible ? this.visible.filter((id) => this.calById.has(id)) : [...this.calById.values()].filter((c) => c.visible !== false).map((c) => c.id));

    // Tidy the events: a known calendar, real times, an end after the start
    const all: Item[] = [];
    for (const ev of this.events) {
      const cal = ev && this.calById.get(ev.calendarId);
      if (!cal || !Number.isFinite(ev.start)) continue;
      const allDay = !!ev.allDay;
      const start = allDay ? dayStart(ev.start, tz) : ev.start;
      let end = Number.isFinite(ev.end) && ev.end > ev.start ? ev.end : allDay ? addDays(start, 1, tz) : ev.start + SLOT * MINUTE;
      if (allDay && end <= start) end = addDays(start, 1, tz);
      const status = ev.status === "tentative" || ev.status === "cancelled" ? ev.status : "confirmed";
      all.push({ ev, cal, id: ev.id, calendarId: cal.id, start, end, allDay, status });
    }
    this.conflicts = findConflicts(all, (id) => this.calById.get(id)?.owner?.id);
    this.items = all.filter((it) => this.shown.has(it.calendarId)).sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start - b.start || a.end - b.end);

    const base = Number.isFinite(this.date) ? this.date! : this.current;
    this.focusDay = dayStart(base, tz);
    if (this.mini === null || changed.has("date")) this.mini = this.focusDay;

    // The time grid's columns
    const today = dayStart(this.current, tz);
    const column = (key: string, day: number, list: Item[], owner?: CalendarOwner): Column => {
      const next = addDays(day, 1, tz);
      const timed = list.filter((it) => !it.allDay);
      const placed = layoutDay(timed, day, tz);
      const starts = new Map<number, Placed<Item>[]>();
      for (const p of placed) {
        const s = Math.min(SLOTS - 1, Math.floor(p.top / SLOT));
        if (!starts.has(s)) starts.set(s, []);
        starts.get(s)!.push(p);
      }
      return { key, day, owner, placed, starts, allDay: list.filter((it) => it.allDay && it.start < next && it.end > day), today: day === today };
    };
    if (this.view === "people") {
      const owners = new Map<string, CalendarOwner>();
      for (const c of this.calendars) if (this.shown.has(c.id) && c.owner && !owners.has(c.owner.id)) owners.set(c.owner.id, c.owner);
      this.columns = [...owners.values()].map((o) =>
        column(
          o.id,
          this.focusDay,
          this.items.filter((it) => it.cal.owner?.id === o.id),
          o,
        ),
      );
    } else if (this.view === "day" || this.view === "week") {
      const n = this.view === "day" ? 1 : this.weekDays;
      const first = this.view === "week" && n === 7 ? weekStartOf(this.focusDay, this.weekStart, tz) : this.focusDay;
      this.columns = daysFrom(first, n, tz).map((d) => column(String(d), d, this.items));
    } else this.columns = [];

    // Keep the tab stops on something that exists
    if (this.slotStop && (this.slotStop.c >= this.columns.length || changed.has("view") || changed.has("date"))) this.slotStop = null;
    if (changed.has("view") || changed.has("date")) {
      this.dayStop = null;
      this.agendaStop = null;
    }
    if (this.openId && !all.some((it) => it.id === this.openId) && this.mode === "detail") this.pop.close();
    if (!this.folded) this.sideOpen = false;
  }

  /** The events on a day (all-day first), for Month and Agenda */
  private itemsOn(day: number) {
    const next = addDays(day, 1, this.tz);
    return this.items.filter((it) => it.start < next && it.end > day);
  }
  private find(id: string | null) {
    return id === null ? undefined : this.items.find((it) => it.id === id);
  }
  private colour(calendarId: string) {
    return `--tc-mcal-ink: var(--tc-chart-${this.colourOf.get(calendarId) ?? 1})`;
  }

  /* ---------- Words ---------- */

  private timeRange(it: Item) {
    const L = this.L;
    if (it.allDay) {
      const last = addDays(it.end, -1, this.tz);
      return last > it.start ? `${L.allDay}, ${this.fmt.monthShort.format(it.start)} – ${this.fmt.monthShort.format(last)}` : L.allDay;
    }
    const tz = this.tz;
    const sameDay = dayStart(it.start, tz) === dayStart(it.end - 1, tz);
    return sameDay
      ? `${this.fmt.time.format(it.start)} – ${this.fmt.time.format(it.end)}`
      : `${this.fmt.short.format(it.start)} ${this.fmt.time.format(it.start)} – ${this.fmt.short.format(it.end)} ${this.fmt.time.format(it.end)}`;
  }
  private calendarWords(cal: CalendarSource) {
    return [cal.owner?.name, cal.name, cal.provider].filter(Boolean).join(" · ");
  }
  /** The events this one clashes with, in words: "Dentist (Google)" */
  private conflictList(it: Item) {
    return (this.conflicts.get(it.id) ?? []).map((o) => `${o.ev.title || this.L.untitled} (${o.cal.provider ?? o.cal.name})`).join(", ");
  }
  private conflictWords(it: Item) {
    const list = this.conflictList(it);
    return list ? `${this.L.conflictWith} ${list}` : "";
  }
  /** The extra words a screen reader hears for an event after its visible title and time */
  private srWords(it: Item) {
    const L = this.L;
    return [
      this.calendarWords(it.cal),
      it.cal.readOnly ? L.readOnly : "",
      it.status === "tentative" ? L.tentative : "",
      it.status === "cancelled" ? L.cancelled : "",
      this.conflictWords(it),
      this.isPending(it.id) ? L.saving : "",
    ]
      .filter(Boolean)
      .join(", ");
  }
  private rangeLabel() {
    const f = this.fmt;
    const tz = this.tz;
    switch (this.view) {
      case "day":
      case "people":
        return f.long.format(this.focusDay);
      case "month":
        return f.month.format(this.focusDay);
      case "agenda":
        return `${f.monthShort.format(this.focusDay)} – ${f.monthShort.format(addDays(this.focusDay, Math.max(1, this.agendaDays) - 1, tz))}`;
      default: {
        const first = this.columns[0]?.day ?? this.focusDay;
        const last = this.columns[this.columns.length - 1]?.day ?? this.focusDay;
        return first === last ? f.long.format(first) : `${f.monthShort.format(first)} – ${f.monthShort.format(last)}, ${wall(last, tz).y}`;
      }
    }
  }
  private columnName(col: Column) {
    return col.owner ? col.owner.name : this.fmt.long.format(col.day);
  }
  /** A time of day in words, for wall minutes – read on a fixed winter day in the zone, so a clock change can't shift it */
  private slotName(m: number) {
    return this.fmt.time.format(zoned(2026, 1, 5, 0, m, this.tz));
  }

  /* ---------- Changing things ---------- */

  private say(text: string) {
    // The same words twice still need announcing
    this.announce = this.announce === text ? `${text} ` : text;
  }

  private setView(next: MultiCalendarView) {
    if (next === this.view) return;
    if (!this.emit<MultiCalendarViewChange>("tc-view-change", { view: next }, { cancelable: true })) return;
    this.view = next;
    this.pop.close();
  }
  private setDate(next: number) {
    const day = dayStart(next, this.tz);
    if (day === this.focusDay && this.date !== undefined) return;
    if (!this.emit<MultiCalendarDateChange>("tc-date-change", { date: day }, { cancelable: true })) return;
    this.date = day;
    this.say(this.fmt.long.format(day));
  }
  private setVisible(next: string[]) {
    if (!this.emit<MultiCalendarVisibleChange>("tc-visible-change", { visible: next }, { cancelable: true })) return;
    this.visible = next;
  }
  private toggleCalendar(cal: CalendarSource, on: boolean) {
    const ids = this.calendars.map((c) => c.id).filter((id) => (id === cal.id ? on : this.shown.has(id)));
    this.setVisible(ids);
    this.say(`${cal.name} ${on ? "shown" : "hidden"}`);
  }
  private step(dir: -1 | 1) {
    const tz = this.tz;
    const at =
      this.view === "month"
        ? addMonths(this.focusDay, dir, tz)
        : this.view === "week"
          ? addDays(this.focusDay, dir * this.weekDays, tz)
          : this.view === "agenda"
            ? addDays(this.focusDay, dir * Math.max(1, this.agendaDays), tz)
            : addDays(this.focusDay, dir, tz);
    this.setDate(at);
  }

  private createEvent(ev: CalendarEvent) {
    const cal = this.calById.get(ev.calendarId);
    if (!cal || !this.canWrite(cal)) return false;
    if (!this.emit<MultiCalendarEventCreate>("tc-event-create", { event: ev, calendar: cal }, { cancelable: true })) return false;
    this.events = [...this.events, ev];
    this.say(`Created ${ev.title} on ${cal.name}`);
    return true;
  }
  private updateEvent(next: CalendarEvent, previous: CalendarEvent) {
    const cal = this.calById.get(next.calendarId);
    const was = this.calById.get(previous.calendarId);
    if (!cal || !this.canWrite(cal) || !this.canWrite(was) || this.isPending(previous.id)) {
      this.say(`${this.L.readOnlyReason}: ${was?.name ?? ""}`);
      return false;
    }
    if (!this.emit<MultiCalendarEventUpdate>("tc-event-update", { event: next, previous, calendar: cal }, { cancelable: true })) return false;
    this.events = this.events.map((e) => (e === previous || e.id === previous.id ? next : e));
    this.say(`Changed ${next.title}: ${this.timeRange({ ...this.find(previous.id)!, start: next.start, end: next.end, allDay: !!next.allDay })}`);
    return true;
  }
  private deleteEvent(it: Item) {
    if (!this.canWrite(it.cal) || this.isPending(it.id)) {
      this.say(`Can't delete ${it.ev.title}: ${this.L.readOnlyReason.toLowerCase()}`);
      return false;
    }
    if (!this.emit<MultiCalendarEventDelete>("tc-event-delete", { event: it.ev, calendar: it.cal }, { cancelable: true })) return false;
    this.events = this.events.filter((e) => e !== it.ev && e.id !== it.id);
    this.say(`Deleted ${it.ev.title}`);
    return true;
  }

  /* ---------- The popover ---------- */

  private openDetail(it: Item, from: Element) {
    this.anchor = from;
    this.mode = "detail";
    this.openId = it.id;
    this.draft = null;
    this.pop.show({ focus: true });
  }
  private blankDraft(start: number, end: number, calendarId?: string): Draft {
    const tz = this.tz;
    const writable = this.writableShown;
    return {
      id: null,
      title: "",
      calendarId: calendarId && writable.some((c) => c.id === calendarId) ? calendarId : (writable[0]?.id ?? ""),
      allDay: false,
      startDate: dateField(start, tz),
      startTime: timeField(start, tz),
      endDate: dateField(end, tz),
      endTime: timeField(end, tz),
      location: "",
      error: "",
    };
  }
  private openCreate(start: number, end: number, from: Element | null, calendarId?: string) {
    if (!this.editable || !this.writableShown.length) {
      this.say(this.L.noWritable);
      return;
    }
    this.anchor = from;
    this.mode = "edit";
    this.openId = null;
    this.draft = this.blankDraft(start, end, calendarId);
    this.pop.show({ focus: true });
  }
  private openEdit(it: Item) {
    if (!this.canWrite(it.cal) || this.isPending(it.id)) return;
    const tz = this.tz;
    const endShown = it.allDay ? addDays(it.end, -1, tz) : it.end;
    this.mode = "edit";
    this.draft = {
      id: it.id,
      title: it.ev.title,
      calendarId: it.calendarId,
      allDay: it.allDay,
      startDate: dateField(it.start, tz),
      startTime: timeField(it.start, tz),
      endDate: dateField(endShown, tz),
      endTime: timeField(it.end, tz),
      location: it.ev.location ?? "",
      error: "",
    };
    this.pop.show({ focus: true });
  }
  private saveDraft() {
    const d = this.draft;
    if (!d) return;
    const L = this.L;
    const tz = this.tz;
    const title = d.title.trim();
    let start = fromFields(d.startDate, d.allDay ? "00:00" : d.startTime, tz);
    let end = fromFields(d.endDate, d.allDay ? "00:00" : d.endTime, tz);
    if (d.allDay && Number.isFinite(end)) end = addDays(end, 1, tz);
    if (!d.allDay && Number.isFinite(start) && Number.isFinite(end) && end <= start && d.endDate === d.startDate) end = NaN;
    let error = "";
    if (!title) error = L.needTitle;
    else if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) error = L.endBeforeStart;
    else if (!this.canWrite(this.calById.get(d.calendarId))) error = L.readOnlyReason;
    if (error) {
      this.draft = { ...d, error };
      this.say(error);
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(d.title.trim() ? ".ui-mcal__pop [data-when]" : ".ui-mcal__pop [data-first]")?.focus());
      return;
    }
    if (d.allDay) start = dayStart(start, tz);
    const location = d.location.trim();
    let done: boolean;
    let id: string;
    if (d.id) {
      const it = this.find(d.id);
      if (!it) return this.pop.close();
      id = it.id;
      const next: CalendarEvent = { ...it.ev, title, calendarId: d.calendarId, start, end, allDay: d.allDay || undefined, location: location || undefined };
      if (!next.allDay) delete next.allDay;
      if (!next.location) delete next.location;
      done = this.updateEvent(next, it.ev);
    } else {
      id = `${this.uid}-new-${++newCount}`;
      const ev: CalendarEvent = { id, calendarId: d.calendarId, title, start, end };
      if (d.allDay) ev.allDay = true;
      if (location) ev.location = location;
      done = this.createEvent(ev);
    }
    if (done) {
      this.returnId = id;
      this.pop.close();
      // The event renders after the popover closes: send focus to it once it's there
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-event="${CSS.escape(id)}"]`)?.focus());
    }
  }
  private returnId: string | null = null;
  /** Where focus goes when the popover closes from inside: the event, else the slot or day it was on, else the toolbar */
  private returnTarget(): HTMLElement | null {
    const id = this.returnId ?? this.openId;
    this.returnId = null;
    if (id) {
      const el = this.querySelector<HTMLElement>(`[data-event="${CSS.escape(id)}"]`);
      if (el) return el;
    }
    if (this.anchor instanceof HTMLElement && this.anchor.isConnected && !this.anchor.classList.contains("ui-mcal__ghost")) return this.anchor;
    return this.querySelector<HTMLElement>('.ui-mcal__main [tabindex="0"]') ?? this.querySelector<HTMLElement>(".ui-mcal__today");
  }
  private requestDelete(it: Item) {
    const nextFocus = this.neighbourOf(it.id);
    if (!this.deleteEvent(it)) return;
    this.pop.close();
    void this.updateComplete.then(() => (nextFocus && this.querySelector<HTMLElement>(nextFocus)?.isConnected ? this.querySelector<HTMLElement>(nextFocus) : this.querySelector<HTMLElement>('.ui-mcal__main [tabindex="0"]'))?.focus());
  }
  /** A selector for what should take focus once an event is gone: the slot or day holding it */
  private neighbourOf(id: string) {
    const el = this.querySelector(`[data-event="${CSS.escape(id)}"]`);
    const cell = el?.closest<HTMLElement>("[data-cell], [data-day]");
    if (cell?.dataset.cell) return `[data-cell="${cell.dataset.cell}"]`;
    if (cell?.dataset.day) return `[data-day="${cell.dataset.day}"]`;
    return null;
  }

  /* ---------- Pointer: create, move and resize in a time grid ---------- */

  /** The column and wall minute under the pointer */
  private hit(e: PointerEvent) {
    const body = this.querySelector<HTMLElement>(".ui-mcal__gbody");
    const first = this.querySelector<HTMLElement>('[data-cell="0:0"]');
    if (!body || !first) return null;
    const box = body.getBoundingClientRect();
    const cell = first.getBoundingClientRect();
    if (!cell.width || !box.height) return null;
    const c = Math.max(0, Math.min(this.columns.length - 1, Math.floor((e.clientX - cell.left) / cell.width)));
    const minute = Math.max(0, Math.min(DAY_MINUTES, ((e.clientY - box.top) / box.height) * DAY_MINUTES));
    return { c, minute };
  }
  private onGridDown = (e: PointerEvent) => {
    if (e.button !== 0 || e.pointerType === "touch") return;
    const target = e.target as HTMLElement;
    if (target.closest(".ui-mcal__allday, .ui-mcal__more")) return;
    const evEl = target.closest<HTMLElement>("[data-event]");
    const at = this.hit(e);
    if (!at) return;
    const body = e.currentTarget as HTMLElement;
    if (evEl) {
      const col = this.columns[at.c];
      const it = this.find(evEl.dataset.event!);
      const c = Number(evEl.dataset.col);
      const placed = this.columns[c]?.placed.find((p) => p.item.id === it?.id);
      if (!it || !placed || !col || !this.canWrite(it.cal) || this.isPending(it.id)) return;
      const resize = !!target.closest(".ui-mcal__resize");
      if (resize && placed.endsAfter) return;
      if (!resize && (placed.startsBefore || placed.endsAfter)) return;
      this.gesture = { kind: resize ? "resize" : "move", pointer: e.pointerId, c, minute: at.minute, moved: false, item: it, placed };
    } else {
      if (!target.closest("[data-cell]") || !this.editable || !this.writableShown.length) return;
      if (this.view === "people" && !this.writableFor(this.columns[at.c]?.owner).length) return;
      this.gesture = { kind: "create", pointer: e.pointerId, c: at.c, minute: at.minute, moved: false };
      // Keep focus off the slot's click, so the editor gets it
      e.preventDefault();
    }
    try {
      body.setPointerCapture(e.pointerId);
    } catch {
      // A synthetic pointer (tests, automation) has no capture to take; moves still reach the grid while over it
    }
  };
  private onGridMove = (e: PointerEvent) => {
    const g = this.gesture;
    if (!g || e.pointerId !== g.pointer) return;
    const at = this.hit(e);
    if (!at) return;
    if (!g.moved && Math.abs(at.minute - g.minute) < 5 && at.c === g.c) return;
    g.moved = true;
    if (g.kind === "create") {
      const a = snapMinutes(Math.min(g.minute, at.minute), SNAP);
      const b = Math.max(a + SNAP, Math.ceil(Math.max(g.minute, at.minute) / SNAP) * SNAP);
      this.selecting = { c: g.c, a, b: Math.min(DAY_MINUTES, b) };
      return;
    }
    const p = g.placed!;
    const d = Math.round((at.minute - g.minute) / SNAP) * SNAP;
    if (g.kind === "resize") {
      this.dragging = { id: p.item.id, c: g.c, top: p.top, bottom: Math.max(p.top + SNAP, Math.min(DAY_MINUTES, p.bottom + d)) };
    } else {
      const len = p.bottom - p.top;
      const top = Math.max(0, Math.min(DAY_MINUTES - len, p.top + d));
      // People: an event stays with its person; days: it can move to another day
      const c = this.view === "people" ? g.c : at.c;
      this.dragging = { id: p.item.id, c, top, bottom: top + len };
    }
  };
  private onGridUp = (e: PointerEvent) => {
    const g = this.gesture;
    if (!g || e.pointerId !== g.pointer) return;
    this.gesture = null;
    if (g.kind === "create") {
      const col = this.columns[g.c];
      if (!col) return;
      const sel = g.moved && this.selecting ? this.selecting : { c: g.c, a: snapMinutes(g.minute, SLOT), b: Math.min(DAY_MINUTES, snapMinutes(g.minute, SLOT) + 60) };
      this.selecting = sel;
      const w = wall(col.day, this.tz);
      const start = zoned(w.y, w.m, w.d, 0, sel.a, this.tz);
      const end = zoned(w.y, w.m, w.d, 0, sel.b, this.tz);
      void this.updateComplete.then(() => this.openCreate(start, end, this.querySelector(".ui-mcal__ghost"), this.writableFor(col.owner)[0]?.id));
      return;
    }
    const drag = this.dragging;
    this.dragging = null;
    if (!g.moved || !drag) return;
    this.suppressClick = true;
    window.setTimeout(() => (this.suppressClick = false));
    const it = g.item!;
    const p = g.placed!;
    const tz = this.tz;
    if (g.kind === "resize") {
      const w = wall(it.end, tz);
      const end = zoned(w.y, w.m, w.d, w.h, w.min + (drag.bottom - p.bottom), tz);
      if (end !== it.end) this.updateEvent({ ...it.ev, end }, it.ev);
      return;
    }
    const fromDay = this.columns[g.c].day;
    const toDay = this.columns[drag.c].day;
    const days = Math.round((toDay - fromDay) / 86_400_000);
    const w = wall(it.start, tz);
    const start = zoned(w.y, w.m, w.d + days, w.h, w.min + (drag.top - p.top), tz);
    if (start !== it.start) this.updateEvent({ ...it.ev, start, end: start + (it.end - it.start) }, it.ev);
  };
  private endGesture() {
    this.gesture = null;
    this.dragging = null;
  }
  private writableFor(owner?: CalendarOwner) {
    return this.writableShown.filter((c) => !owner || c.owner?.id === owner.id);
  }

  /* ---------- Keyboard ---------- */

  private focusSlot(c: number, s: number) {
    c = Math.max(0, Math.min(this.columns.length - 1, c));
    s = Math.max(0, Math.min(SLOTS - 1, s));
    this.slotStop = { c, s };
    void this.updateComplete.then(() => {
      const cell = this.querySelector<HTMLElement>(`[data-cell="${c}:${s}"]`);
      cell?.focus({ preventScroll: true });
      cell?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }
  private onGridKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (e.isComposing || e.altKey) return;
    if (target.dataset.event !== undefined) return this.onEventKey(e);
    if (!target.matches("[data-cell]")) return;
    const [c, s] = target.dataset.cell!.split(":").map(Number);
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [c, s - 1],
      ArrowDown: [c, s + 1],
      ArrowLeft: [c - 1, s],
      ArrowRight: [c + 1, s],
      PageUp: [c, s - 4],
      PageDown: [c, s + 4],
      Home: mod ? [c, 0] : [0, s],
      End: mod ? [c, SLOTS - 1] : [this.columns.length - 1, s],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.focusSlot(move[0], move[1]);
      return;
    }
    if (e.metaKey || e.ctrlKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const first = target.querySelector<HTMLElement>("[data-event]");
      if (first) return first.focus();
      const col = this.columns[c];
      if (!col) return;
      const w = wall(col.day, this.tz);
      this.selecting = { c, a: s * SLOT, b: Math.min(DAY_MINUTES, s * SLOT + 60) };
      const start = zoned(w.y, w.m, w.d, 0, s * SLOT, this.tz);
      void this.updateComplete.then(() => this.openCreate(start, zoned(w.y, w.m, w.d, 0, s * SLOT + 60, this.tz), this.querySelector(".ui-mcal__ghost"), this.writableFor(col.owner)[0]?.id));
    }
  };
  /** Keys on an event: ↑ / ↓ to the previous and next in its column or day, Delete, Escape back to its slot */
  private onEventKey(e: KeyboardEvent) {
    const el = e.target as HTMLElement;
    const it = this.find(el.dataset.event!);
    const scope = el.closest<HTMLElement>("[data-scope]");
    if (!it) return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      // Every event in the same column (or day), in order – a time grid's column spans many slots
      const list = scope ? [...this.querySelectorAll<HTMLElement>(`[data-scope="${scope.dataset.scope}"] [data-event]`)] : [el];
      const i = list.indexOf(el);
      list[Math.max(0, Math.min(list.length - 1, i + (e.key === "ArrowUp" ? -1 : 1)))]?.focus();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this.requestDelete(it);
    } else if (e.key === "Escape") {
      const cell = el.closest<HTMLElement>("[data-cell], [data-day]");
      if (cell) {
        e.preventDefault();
        cell.focus();
      }
    }
  }
  private onMonthKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (e.isComposing || e.altKey) return;
    if (target.dataset.event !== undefined) return this.onEventKey(e);
    if (!target.matches("[data-day]")) return;
    const i = Number(target.dataset.index);
    const moves: Record<string, number> = { ArrowUp: i - 7, ArrowDown: i + 7, ArrowLeft: i - 1, ArrowRight: i + 1, Home: i - (i % 7), End: i - (i % 7) + 6, PageUp: i - 35, PageDown: i + 35 };
    if (e.key in moves) {
      e.preventDefault();
      const to = Math.max(0, Math.min(41, moves[e.key]));
      this.dayStop = to;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-index="${to}"]`)?.focus());
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const first = target.querySelector<HTMLElement>("[data-event]");
      if (first) return first.focus();
      const day = Number(target.dataset.day);
      const w = wall(day, this.tz);
      this.openCreate(zoned(w.y, w.m, w.d, 9, 0, this.tz), zoned(w.y, w.m, w.d, 10, 0, this.tz), target);
    }
  };
  private onAgendaKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (el.dataset.event === undefined || e.isComposing || e.altKey) return;
    const list = [...this.querySelectorAll<HTMLElement>(".ui-mcal__agenda [data-event]")];
    const i = list.indexOf(el);
    const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : null;
    if (to !== null) {
      e.preventDefault();
      const next = list[Math.max(0, Math.min(list.length - 1, to))];
      this.agendaStop = next?.dataset.event ?? null;
      next?.focus();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      const it = this.find(el.dataset.event);
      if (it) {
        e.preventDefault();
        this.requestDelete(it);
      }
    }
  };
  private onRadioKey(e: KeyboardEvent, values: string[], current: string, pick: (v: string) => void) {
    const i = values.indexOf(current);
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? values.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const group = e.currentTarget as HTMLElement;
    pick(values[(to + values.length) % values.length]);
    void this.updateComplete.then(() => group.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  }
  private onMiniKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (!t.matches("[data-mini]") || e.isComposing) return;
    const day = Number(t.dataset.mini);
    const tz = this.tz;
    const moves: Record<string, number> = { ArrowUp: -7, ArrowDown: 7, ArrowLeft: -1, ArrowRight: 1 };
    let to: number | null = e.key in moves ? addDays(day, moves[e.key], tz) : null;
    if (e.key === "PageUp") to = addMonths(day, -1, tz);
    if (e.key === "PageDown") to = addMonths(day, 1, tz);
    if (to === null) return;
    e.preventDefault();
    this.miniStop = to;
    if (wall(to, tz).m !== wall(this.mini ?? to, tz).m) this.mini = to;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-mini="${to}"]`)?.focus());
  };

  /* ---------- Updates ---------- */

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // A time grid opens scrolled to the start of the working day (or the current time, if it's later)
    const scroll = this.querySelector<HTMLElement>(".ui-mcal__scroll[data-time]");
    const key = scroll ? `${this.view}:${this.columns[0]?.day}:${this.columns.length}` : "";
    if (scroll && key !== this.scrolledFor) {
      this.scrolledFor = key;
      const today = this.columns.some((c) => c.today);
      const hour = Math.max(0, Math.min(23, Math.floor(today ? Math.min(wallMinutes(this.current, this.tz) / 60 - 1, this.workingHours?.start ?? 8) : (this.workingHours?.start ?? 8))));
      const row = this.querySelector<HTMLElement>(`[data-cell="0:${hour * 2}"]`);
      const head = this.querySelector<HTMLElement>(".ui-mcal__ghead");
      if (row) scroll.scrollTop = Math.max(0, row.offsetTop - (head?.offsetHeight ?? 0));
    }
  }

  /* ---------- Rendering: pieces ---------- */

  private avatar(owner: CalendarOwner | undefined, cls = "ui-mcal__avatar") {
    if (!owner) return nothing;
    const src = safeMediaUrl(owner.avatar);
    return html`<span class=${cls} aria-hidden="true">${src ? html`<img src=${src} alt="" />` : initials(owner.name || "?")}</span>`;
  }
  private marks(it: Item) {
    const conflict = this.conflicts.has(it.id);
    return html`${it.cal.readOnly ? html`<span class="ui-mcal__mark" title=${this.L.readOnly}>${icon(ICONS.lock)}</span>` : nothing}${conflict
      ? html`<span class="ui-mcal__mark ui-mcal__mark--conflict" title=${this.conflictWords(it)}>${icon(ICONS.alert)}</span>`
      : nothing}`;
  }
  /** An event in a time grid */
  private timedEvent(p: Placed<Item>, c: number, n: number) {
    const it = p.item;
    const drag = this.dragging?.id === it.id ? this.dragging : null;
    const top = drag ? drag.top : p.top;
    const bottom = drag ? drag.bottom : p.bottom;
    const col = drag ? 0 : p.col;
    const cols = drag ? 1 : p.cols;
    const span = drag ? 1 : p.span;
    const cc = drag ? drag.c : c;
    const short = bottom - top < 45;
    const movable = this.canWrite(it.cal) && !this.isPending(it.id) && !p.startsBefore && !p.endsAfter;
    return html`<button
      type="button"
      class="ui-mcal__ev"
      data-event=${it.id}
      data-col=${c}
      data-status=${it.status}
      ?data-short=${short}
      ?data-dragging=${!!drag}
      ?data-pending=${this.isPending(it.id)}
      ?data-conflict=${this.conflicts.has(it.id)}
      ?data-readonly=${!this.canWrite(it.cal)}
      ?data-movable=${movable}
      aria-busy=${this.isPending(it.id) ? "true" : "false"}
      tabindex="-1"
      style=${`${this.colour(it.calendarId)}; --c: ${cc}; --n: ${n}; --col: ${col}; --cols: ${cols}; --span: ${span}; --top: ${top}; --len: ${bottom - top}`}
      @click=${(e: Event) => {
        if (this.suppressClick) return;
        this.openDetail(it, e.currentTarget as Element);
      }}
    >
      <span class="ui-mcal__ev-title">${it.ev.title || this.L.untitled}</span>
      <span class="ui-mcal__ev-meta">${this.avatar(it.cal.owner, "ui-mcal__who")}<span class="ui-mcal__ev-time">${this.fmt.time.format(it.start)}</span></span>
      ${it.cal.readOnly || this.conflicts.has(it.id) ? html`<span class="ui-mcal__ev-marks">${this.marks(it)}</span>` : nothing}
      ${this.isPending(it.id) ? html`<span class="ui-mcal__saving">${this.L.saving}</span>` : nothing}
      <span class="tc-sr-only">, ${this.timeRange(it)}, ${this.srWords(it)}</span>
      ${movable ? html`<span class="ui-mcal__resize" aria-hidden="true"></span>` : nothing}
    </button>`;
  }
  /** An event as a one-line chip: all-day rows, Month and Agenda */
  private chip(it: Item, opts: { time?: boolean; scope?: string } = {}) {
    return html`<button
      type="button"
      class="ui-mcal__chip"
      data-event=${it.id}
      data-status=${it.status}
      ?data-allday=${it.allDay}
      ?data-pending=${this.isPending(it.id)}
      ?data-conflict=${this.conflicts.has(it.id)}
      aria-busy=${this.isPending(it.id) ? "true" : "false"}
      tabindex=${opts.scope === "agenda" ? (this.agendaStopId === it.id ? 0 : -1) : -1}
      style=${this.colour(it.calendarId)}
      @click=${(e: Event) => this.openDetail(it, e.currentTarget as Element)}
      @focus=${() => {
        if (opts.scope === "agenda") this.agendaStop = it.id;
      }}
    >
      <span class="ui-mcal__swatch" aria-hidden="true"></span>
      ${opts.time && !it.allDay ? html`<span class="ui-mcal__chip-time">${this.fmt.time.format(it.start)}</span>` : nothing}
      <span class="ui-mcal__chip-title">${it.ev.title || this.L.untitled}</span>
      ${this.avatar(it.cal.owner, "ui-mcal__who")}${this.marks(it)}
      <span class="tc-sr-only">, ${this.timeRange(it)}, ${this.srWords(it)}</span>
    </button>`;
  }
  private get agendaStopId() {
    if (this.agendaStop && this.agendaItems().some((it) => it.id === this.agendaStop)) return this.agendaStop;
    return this.agendaItems()[0]?.id ?? null;
  }

  private renderToolbar(rangeId: string) {
    const L = this.L;
    const canCreate = this.editable && this.writableShown.length > 0;
    return html`<div class="ui-mcal__bar">
      ${this.folded
        ? html`<button type="button" class="tc-btn-sm ui-mcal__side-toggle" aria-expanded=${this.sideOpen ? "true" : "false"} aria-controls=${`${this.uid}-side`} @click=${() => (this.sideOpen = !this.sideOpen)}>
            ${icon(ICONS.sidebar)}<span>${L.calendars}</span>
          </button>`
        : nothing}
      <div class="ui-mcal__nav">
        <button type="button" class="tc-btn-sm ui-mcal__today" @click=${() => this.setDate(this.current)}>${L.today}</button>
        <button type="button" class="ui-mcal__step" @click=${() => this.step(-1)}>${icon(ICONS.left)}<span class="tc-sr-only">${L.previous}</span></button>
        <button type="button" class="ui-mcal__step" @click=${() => this.step(1)}>${icon(ICONS.right)}<span class="tc-sr-only">${L.next}</span></button>
        <h4 class="ui-mcal__range" id=${rangeId} aria-live="polite">${this.rangeLabel()}</h4>
      </div>
      <div class="ui-mcal__views" role="radiogroup" aria-label=${L.view} @keydown=${(e: KeyboardEvent) => this.onRadioKey(e, VIEWS, this.view, (v) => this.setView(v as MultiCalendarView))}>
        ${VIEWS.map(
          (v) => html`<button type="button" role="radio" class="ui-mcal__view" aria-checked=${this.view === v ? "true" : "false"} tabindex=${this.view === v ? 0 : -1} data-view=${v} @click=${() => this.setView(v)}>
            ${v === "people" ? icon(ICONS.people) : nothing}${L[v]}
          </button>`,
        )}
      </div>
      <button type="button" class="ui-mcal__new" ?disabled=${!canCreate} aria-describedby=${ifDefined(canCreate ? undefined : `${this.uid}-nowrite`)} @click=${(e: Event) => this.newFromButton(e.currentTarget as Element)}>
        ${icon(ICONS.plus)}<span>${L.newEvent}</span>
      </button>
      ${canCreate ? nothing : html`<span class="tc-sr-only" id=${`${this.uid}-nowrite`}>${this.readonly ? L.readOnly : L.noWritable}</span>`}
    </div>`;
  }
  private newFromButton(from: Element) {
    const tz = this.tz;
    const w = wall(this.focusDay, tz);
    const nowW = wall(this.current, tz);
    const hour = this.focusDay === dayStart(this.current, tz) ? Math.min(23, nowW.h + 1) : (this.workingHours?.start ?? 9);
    this.openCreate(zoned(w.y, w.m, w.d, hour, 0, tz), zoned(w.y, w.m, w.d, hour + 1, 0, tz), from);
  }

  private renderMini() {
    const tz = this.tz;
    const month = this.mini ?? this.focusDay;
    const days = monthWeeks(month, this.weekStart, tz);
    const m = wall(month, tz).m;
    const busy = new Set<number>();
    const first = days[0];
    const after = addDays(days[41], 1, tz);
    for (const it of this.items) {
      if (it.end <= first || it.start >= after) continue;
      for (let d = dayStart(Math.max(it.start, first), tz); d < Math.min(it.end, after); d = addDays(d, 1, tz)) busy.add(d);
    }
    const stop = this.miniStop !== null && days.includes(this.miniStop) ? this.miniStop : days.includes(this.focusDay) ? this.focusDay : days.find((d) => wall(d, tz).m === m)!;
    const today = dayStart(this.current, tz);
    return html`<div class="ui-mcal__mini">
      <div class="ui-mcal__mini-head">
        <span class="ui-mcal__mini-month">${this.fmt.month.format(month)}</span>
        <button type="button" class="ui-mcal__step" @click=${() => (this.mini = addMonths(month, -1, tz))}>${icon(ICONS.left)}<span class="tc-sr-only">${this.L.previous} ${this.L.month.toLowerCase()}</span></button>
        <button type="button" class="ui-mcal__step" @click=${() => (this.mini = addMonths(month, 1, tz))}>${icon(ICONS.right)}<span class="tc-sr-only">${this.L.next} ${this.L.month.toLowerCase()}</span></button>
      </div>
      <table class="ui-mcal__mini-grid" role="grid" aria-label=${this.fmt.month.format(month)} @keydown=${this.onMiniKey}>
        <thead>
          <tr role="row">
            ${days.slice(0, 7).map((d) => html`<th role="columnheader" scope="col" abbr=${this.fmt.weekday.format(d)}><span aria-hidden="true">${this.fmt.narrowDay.format(d)}</span></th>`)}
          </tr>
        </thead>
        <tbody>
          ${[0, 1, 2, 3, 4, 5].map(
            (r) => html`<tr role="row">
              ${days.slice(r * 7, r * 7 + 7).map(
                (d) => html`<td role="gridcell" aria-selected=${d === this.focusDay ? "true" : "false"}>
                  <button
                    type="button"
                    class="ui-mcal__mini-day"
                    data-mini=${d}
                    tabindex=${d === stop ? 0 : -1}
                    ?data-out=${wall(d, tz).m !== m}
                    ?data-today=${d === today}
                    ?data-focus=${d === this.focusDay}
                    ?data-busy=${busy.has(d)}
                    @click=${() => {
                      this.miniStop = d;
                      this.setDate(d);
                    }}
                  >
                    ${this.fmt.dayNum.format(d)}<span class="tc-sr-only">, ${this.fmt.long.format(d)}${busy.has(d) ? `, ${this.L.events}` : ""}</span>
                  </button>
                </td>`,
              )}
            </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }

  private renderSide() {
    const L = this.L;
    const groups = new Map<string, { label: string; owner?: CalendarOwner; cals: CalendarSource[] }>();
    for (const cal of this.calById.values()) {
      const key = this.groupBy === "provider" ? (cal.provider ?? "—") : (cal.owner?.id ?? "—");
      if (!groups.has(key)) groups.set(key, { label: this.groupBy === "provider" ? (cal.provider ?? L.calendars) : (cal.owner?.name ?? L.calendars), owner: this.groupBy === "provider" ? undefined : cal.owner, cals: [] });
      groups.get(key)!.cals.push(cal);
    }
    const allShown = this.shown.size === this.calById.size;
    const hiddenCount = this.calById.size - this.shown.size;
    return html`<section class="ui-mcal__side" id=${`${this.uid}-side`} aria-label=${L.calendars} ?data-overlay=${this.folded} ?hidden=${this.folded && !this.sideOpen} @keydown=${(e: KeyboardEvent) => {
      if (e.key === "Escape" && this.folded && this.sideOpen) {
        e.preventDefault();
        this.sideOpen = false;
        void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-mcal__side-toggle")?.focus());
      }
    }}>
      ${this.folded
        ? html`<div class="ui-mcal__side-head"><span class="ui-mcal__side-title">${L.calendars}</span><button type="button" class="ui-mcal__step" @click=${() => {
            this.sideOpen = false;
            void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-mcal__side-toggle")?.focus());
          }}>${icon(ICONS.x)}<span class="tc-sr-only">${L.close}</span></button></div>`
        : nothing}
      ${this.renderMini()}
      <div class="ui-mcal__group-by" role="radiogroup" aria-label=${L.groupBy} @keydown=${(e: KeyboardEvent) => this.onRadioKey(e, ["person", "provider"], this.groupBy, (v) => (this.groupBy = v as "person" | "provider"))}>
        ${(["person", "provider"] as const).map(
          (g) => html`<button type="button" role="radio" class="ui-mcal__seg" aria-checked=${this.groupBy === g ? "true" : "false"} tabindex=${this.groupBy === g ? 0 : -1} @click=${() => (this.groupBy = g)}>
            ${g === "person" ? L.byPerson : L.byProvider}
          </button>`,
        )}
      </div>
      ${groups.size
        ? repeat(
            [...groups.entries()],
            ([key]) => key,
            ([key, g]) => html`<div class="ui-mcal__group" role="group" aria-labelledby=${`${this.uid}-g-${key}`}>
              <div class="ui-mcal__group-head">${g.owner ? this.avatar(g.owner) : nothing}<span id=${`${this.uid}-g-${key}`}>${g.label}</span></div>
              <ul class="ui-mcal__cals">
                ${repeat(
                  g.cals,
                  (c) => c.id,
                  (cal) => {
                    const on = this.shown.has(cal.id);
                    const id = `${this.uid}-cal-${cal.id}`;
                    const other = this.groupBy === "provider" ? cal.owner?.name : cal.provider;
                    return html`<li class="ui-mcal__cal" style=${this.colour(cal.id)}>
                      <input type="checkbox" class="ui-mcal__check" id=${id} .checked=${on} @change=${(e: Event) => this.toggleCalendar(cal, (e.target as HTMLInputElement).checked)} />
                      <label for=${id} class="ui-mcal__cal-label">
                        <span class="ui-mcal__cal-name">${cal.name}</span>
                        ${other ? html`<span class="ui-mcal__cal-sub">${other}</span>` : nothing}
                        ${cal.readOnly ? html`<span class="ui-mcal__lock" title=${L.readOnly}>${icon(ICONS.lock)}<span class="tc-sr-only">, ${L.readOnly}</span></span>` : nothing}
                      </label>
                      <button type="button" class="ui-mcal__only" @click=${() => this.setVisible([cal.id])}>${L.onlyThis}<span class="tc-sr-only">: ${cal.name}${this.groupBy === "provider" ? "" : `, ${cal.owner?.name ?? ""}`}</span></button>
                    </li>`;
                  },
                )}
              </ul>
            </div>`,
          )
        : html`<p class="ui-mcal__quiet">${L.noCalendars}</p>`}
      ${allShown ? nothing : html`<button type="button" class="tc-btn-sm ui-mcal__show-all" @click=${() => this.setVisible([...this.calById.keys()])}>${L.showAll} (${hiddenCount})</button>`}
    </section>`;
  }

  /* ---------- Rendering: the views ---------- */

  private renderTimeGrid(rangeId: string) {
    const L = this.L;
    const tz = this.tz;
    const cols = this.columns;
    const n = cols.length;
    if (!n) return html`<p class="ui-mcal__empty">${L.noCalendars}</p>`;
    const stop = this.slotStop && this.slotStop.c < n ? this.slotStop : { c: Math.max(0, cols.findIndex((c) => c.today)), s: (this.workingHours?.start ?? 9) * 2 };
    const wh = this.workingHours ?? { start: 0, end: 24 };
    const workDays = wh.days ?? [0, 1, 2, 3, 4, 5, 6];
    const nowMin = wallMinutes(this.current, tz);
    const busyWords = (col: Column, s: number) => {
      const a = s * SLOT;
      const b = a + SLOT;
      const at = col.placed.filter((p) => p.top < b && p.bottom > a);
      return at.length ? `${at.length} ${at.length === 1 ? L.event : L.events}: ${at.map((p) => p.item.ev.title || L.untitled).join(", ")}` : L.free;
    };
    return html`<div class="ui-mcal__scroll" data-time>
      <div class="ui-mcal__grid" role="grid" aria-labelledby=${rangeId} aria-describedby=${`${this.uid}-keys`} aria-rowcount=${SLOTS + 1} style=${`--n: ${n}`} @keydown=${this.onGridKey}>
        <div class="ui-mcal__ghead" role="rowgroup">
          <div class="ui-mcal__row" role="row">
            <div class="ui-mcal__corner" role="columnheader"><span class="tc-sr-only">${L.time}</span><span aria-hidden="true">${L.allDay}</span></div>
            ${cols.map((col, c) => {
              const w = wall(col.day, tz);
              return html`<div class="ui-mcal__colhead" role="columnheader" ?data-today=${col.today} data-scope=${`h${c}`}>
                <div class="ui-mcal__colname">
                  ${col.owner
                    ? html`${this.avatar(col.owner)}<span class="ui-mcal__person">${col.owner.name}</span>`
                    : html`<span class="ui-mcal__wd">${this.fmt.weekday.format(col.day)}</span><span class="ui-mcal__dn" aria-hidden="true">${w.d}</span><span class="tc-sr-only">${this.fmt.long.format(col.day)}</span>`}
                </div>
                ${col.allDay.length ? html`<div class="ui-mcal__allday" data-scope=${`a${c}`}>${col.allDay.map((it) => this.chip(it))}</div>` : nothing}
              </div>`;
            })}
          </div>
        </div>
        <div class="ui-mcal__gbody" role="rowgroup" @pointerdown=${this.onGridDown} @pointermove=${this.onGridMove} @pointerup=${this.onGridUp} @pointercancel=${() => this.endGesture()}>
          ${Array.from({ length: SLOTS }, (_, s) => {
            const m = s * SLOT;
            return html`<div class="ui-mcal__row" role="row">
              <div class="ui-mcal__time" role="rowheader" ?data-hour=${s % 2 === 0}><span aria-hidden="true">${s % 2 === 0 && s > 0 ? this.fmt.hour.format(zoned(2026, 1, 5, s / 2, 0, this.tz)) : ""}</span><span class="tc-sr-only">${this.slotName(m)}</span></div>
              ${cols.map((col, c) => {
                const off = !workDays.includes(wall(col.day, tz).wd) || m < wh.start * 60 || m >= wh.end * 60;
                const starts = col.starts.get(s);
                const isStop = stop.c === c && stop.s === s;
                return html`<div
                  class="ui-mcal__slot"
                  role="gridcell"
                  data-cell=${`${c}:${s}`}
                  data-scope=${`c${c}`}
                  tabindex=${isStop ? 0 : -1}
                  ?data-hour=${s % 2 === 0}
                  ?data-off=${off}
                  @focus=${(e: FocusEvent) => {
                    if (e.target === e.currentTarget && !isStop) this.slotStop = { c, s };
                  }}
                ><span class="tc-sr-only">${this.columnName(col)}, ${this.slotName(m)}, ${busyWords(col, s)}</span>${starts ? starts.map((p) => this.timedEvent(p, c, n)) : nothing}</div>`;
              })}
            </div>`;
          })}
          ${cols.map((col, c) => (col.today ? html`<div class="ui-mcal__now" aria-hidden="true" style=${`--c: ${c}; --n: ${n}; --top: ${nowMin}`}></div>` : nothing))}
          ${this.selecting && this.mode !== "detail"
            ? html`<div class="ui-mcal__ghost" aria-hidden="true" style=${`--c: ${this.selecting.c}; --n: ${n}; --col: 0; --cols: 1; --top: ${this.selecting.a}; --len: ${this.selecting.b - this.selecting.a}`}>
                <span>${this.slotName(this.selecting.a)} – ${this.slotName(this.selecting.b % DAY_MINUTES)}</span>
              </div>`
            : nothing}
        </div>
      </div>
    </div>`;
  }

  private renderMonth(rangeId: string) {
    const L = this.L;
    const tz = this.tz;
    const days = monthWeeks(this.focusDay, this.weekStart, tz);
    const m = wall(this.focusDay, tz).m;
    const today = dayStart(this.current, tz);
    const stop = this.dayStop ?? Math.max(0, days.indexOf(this.focusDay));
    const MAX = 3;
    return html`<div class="ui-mcal__month-wrap">
      <div class="ui-mcal__month" role="grid" aria-labelledby=${rangeId} aria-describedby=${`${this.uid}-keys`} @keydown=${this.onMonthKey}>
        <div class="ui-mcal__mrow ui-mcal__mhead" role="row">${days.slice(0, 7).map((d) => html`<div class="ui-mcal__mwd" role="columnheader">${this.fmt.weekday.format(d)}</div>`)}</div>
        ${[0, 1, 2, 3, 4, 5].map(
          (r) => html`<div class="ui-mcal__mrow" role="row">
            ${days.slice(r * 7, r * 7 + 7).map((d, k) => {
              const i = r * 7 + k;
              const list = this.itemsOn(d);
              const shown = list.slice(0, list.length > MAX ? MAX - 1 : MAX);
              const rest = list.length - shown.length;
              return html`<div
                class="ui-mcal__mday"
                role="gridcell"
                data-day=${d}
                data-index=${i}
                data-scope=${`d${i}`}
                tabindex=${i === stop ? 0 : -1}
                ?data-out=${wall(d, tz).m !== m}
                ?data-today=${d === today}
                @focus=${(e: FocusEvent) => {
                  if (e.target === e.currentTarget) this.dayStop = i;
                }}
                @click=${(e: MouseEvent) => {
                  if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains("ui-mcal__mnum")) return;
                  this.dayStop = i;
                  if (!this.editable || !this.writableShown.length) return;
                  const w = wall(d, tz);
                  this.openCreate(zoned(w.y, w.m, w.d, 9, 0, tz), zoned(w.y, w.m, w.d, 10, 0, tz), e.currentTarget as Element);
                }}
              >
                <span class="ui-mcal__mnum" aria-hidden="true">${wall(d, tz).d}</span><span class="tc-sr-only">${this.fmt.long.format(d)}, ${list.length ? `${list.length} ${list.length === 1 ? L.event : L.events}` : L.noEvents}</span>
                ${shown.map((it) => this.chip(it, { time: true }))}
                ${rest > 0
                  ? html`<button type="button" class="ui-mcal__more" tabindex="-1" data-event-more @click=${() => {
                      this.setView("day");
                      this.setDate(d);
                    }}>+${rest} ${L.more}</button>`
                  : nothing}
              </div>`;
            })}
          </div>`,
        )}
      </div>
    </div>`;
  }

  private agendaItems() {
    const tz = this.tz;
    const end = addDays(this.focusDay, Math.max(1, Math.round(this.agendaDays) || 14), tz);
    return this.items.filter((it) => it.end > this.focusDay && it.start < end).sort((a, b) => Math.max(a.start, this.focusDay) - Math.max(b.start, this.focusDay) || Number(b.allDay) - Number(a.allDay));
  }
  private renderAgenda(rangeId: string) {
    const L = this.L;
    const tz = this.tz;
    const list = this.agendaItems();
    if (!list.length)
      return html`<div class="ui-mcal__agenda-empty">
        <p>${L.noEvents}</p>
      </div>`;
    const days = new Map<number, Item[]>();
    for (const it of list) {
      const d = dayStart(Math.max(it.start, this.focusDay), tz);
      if (!days.has(d)) days.set(d, []);
      days.get(d)!.push(it);
    }
    const today = dayStart(this.current, tz);
    return html`<div class="ui-mcal__agenda" role="list" aria-labelledby=${rangeId} @keydown=${this.onAgendaKey}>
      ${repeat(
        [...days.entries()],
        ([d]) => d,
        ([d, items]) => html`<div class="ui-mcal__aday" role="listitem" ?data-today=${d === today}>
          <div class="ui-mcal__adate"><span class="ui-mcal__adn">${wall(d, tz).d}</span><span class="ui-mcal__awd">${this.fmt.short.format(d)}</span></div>
          <div class="ui-mcal__aitems" data-scope="agenda">
            ${repeat(
              items,
              (it) => it.id,
              (it) => html`<div class="ui-mcal__arow">
                <span class="ui-mcal__atime" aria-hidden="true">${it.allDay ? L.allDay : `${this.fmt.time.format(it.start)} – ${this.fmt.time.format(it.end)}`}</span>
                ${this.chip(it, { scope: "agenda" })}
                <span class="ui-mcal__acal" aria-hidden="true">${this.calendarWords(it.cal)}</span>
              </div>`,
            )}
          </div>
        </div>`,
      )}
    </div>`;
  }

  /* ---------- Rendering: the popover ---------- */

  private renderDetail(it: Item) {
    const L = this.L;
    const id = `${this.uid}-pop-title`;
    const writable = this.canWrite(it.cal);
    const pending = this.isPending(it.id);
    const reason = !writable ? (this.readonly ? L.readOnly : `${L.readOnlyReason}: ${it.cal.name}${it.cal.provider ? ` (${it.cal.provider})` : ""}`) : pending ? L.saving : "";
    const conflict = this.conflictWords(it);
    return html`<div class="tc-pop ui-mcal__pop" aria-labelledby=${id} style=${this.colour(it.calendarId)}>
      <div class="ui-mcal__pop-head">
        <span class="ui-mcal__swatch ui-mcal__swatch--lg" aria-hidden="true"></span>
        <h4 class="ui-mcal__pop-title" id=${id} ?data-cancelled=${it.status === "cancelled"}>${it.ev.title || L.untitled}</h4>
        <button type="button" class="ui-mcal__step" ?data-first=${!!reason} @click=${() => this.pop.close()}>${icon(ICONS.x)}<span class="tc-sr-only">${L.close}</span></button>
      </div>
      <dl class="ui-mcal__facts">
        <div class="ui-mcal__fact">${icon(ICONS.clock)}<dt class="tc-sr-only">${L.starts}</dt><dd>${this.fmt.long.format(it.start)}<br />${this.timeRange(it)}</dd></div>
        ${it.ev.recurring ? html`<div class="ui-mcal__fact">${icon(ICONS.repeat)}<dt class="tc-sr-only">${L.repeats}</dt><dd>${it.ev.recurring}</dd></div>` : nothing}
        <div class="ui-mcal__fact">${this.avatar(it.cal.owner)}<dt class="tc-sr-only">${L.calendar}</dt><dd><strong>${it.cal.owner?.name}</strong> · ${it.cal.name}${it.cal.provider ? html` <span class="ui-mcal__provider">${it.cal.provider}</span>` : nothing}</dd></div>
        ${it.ev.location ? html`<div class="ui-mcal__fact">${icon(ICONS.pin)}<dt class="tc-sr-only">${L.location}</dt><dd>${it.ev.location}</dd></div>` : nothing}
        ${it.ev.attendees?.length ? html`<div class="ui-mcal__fact">${icon(ICONS.people)}<dt class="tc-sr-only">${L.attendees}</dt><dd>${it.ev.attendees.join(", ")}</dd></div>` : nothing}
      </dl>
      ${it.status !== "confirmed" || conflict || pending
        ? html`<div class="ui-mcal__notes">
            ${it.status === "tentative" ? html`<span class="ui-mcal__note">${L.tentative}</span>` : nothing}
            ${it.status === "cancelled" ? html`<span class="ui-mcal__note">${L.cancelled}</span>` : nothing}
            ${pending ? html`<span class="ui-mcal__note">${L.saving}</span>` : nothing}
            ${conflict ? html`<p class="ui-mcal__conflict">${icon(ICONS.alert)}<span><strong>${L.conflictWith}</strong> ${this.conflictList(it)}</span></p>` : nothing}
          </div>`
        : nothing}
      ${reason ? html`<p class="ui-mcal__reason" id=${`${this.uid}-reason`}>${icon(ICONS.lock)}<span>${reason}</span></p>` : nothing}
      <div class="ui-mcal__pop-actions">
        <button type="button" class="tc-btn-sm ui-mcal__delete" ?disabled=${!!reason} aria-describedby=${ifDefined(reason ? `${this.uid}-reason` : undefined)} @click=${() => this.requestDelete(it)}>${L.delete}</button>
        <button type="button" class="tc-btn-sm ui-mcal__edit" ?data-first=${!reason} ?disabled=${!!reason} aria-describedby=${ifDefined(reason ? `${this.uid}-reason` : undefined)} @click=${() => this.openEdit(it)}>${L.edit}</button>
      </div>
    </div>`;
  }

  private renderEditor(d: Draft) {
    const L = this.L;
    const id = `${this.uid}-pop-title`;
    const err = `${this.uid}-err`;
    const set = (patch: Partial<Draft>) => (this.draft = { ...this.draft!, ...patch, error: "" });
    const owners = new Map<string, CalendarSource[]>();
    for (const c of this.calendars) {
      if (!this.canWrite(c) || !(this.shown.has(c.id) || c.id === d.calendarId)) continue;
      const k = c.owner?.name ?? "";
      if (!owners.has(k)) owners.set(k, []);
      owners.get(k)!.push(c);
    }
    const f = (name: string) => `${this.uid}-f-${name}`;
    const titleErr = d.error === L.needTitle;
    const whenErr = !!d.error && !titleErr;
    return html`<form
      class="tc-pop ui-mcal__pop ui-mcal__editor"
      aria-labelledby=${id}
      style=${this.colour(d.calendarId)}
      novalidate
      @submit=${(e: Event) => {
        e.preventDefault();
        this.saveDraft();
      }}
    >
      <div class="ui-mcal__pop-head">
        <span class="ui-mcal__swatch ui-mcal__swatch--lg" aria-hidden="true"></span>
        <h4 class="ui-mcal__pop-title" id=${id}>${d.id ? L.edit : L.newEvent}</h4>
        <button type="button" class="ui-mcal__step" @click=${() => this.pop.close()}>${icon(ICONS.x)}<span class="tc-sr-only">${L.close}</span></button>
      </div>
      <div class="ui-mcal__fields">
        <label class="ui-mcal__field ui-mcal__field--wide"><span class="ui-mcal__flabel">${L.title}</span>
          <input class="ui-mcal__input" data-first id=${f("title")} .value=${d.title} aria-invalid=${titleErr ? "true" : "false"} aria-describedby=${ifDefined(titleErr ? err : undefined)} @input=${(e: Event) => set({ title: (e.target as HTMLInputElement).value })} />
        </label>
        <label class="ui-mcal__field ui-mcal__field--wide"><span class="ui-mcal__flabel">${L.calendar}</span>
          <select class="ui-mcal__input" .value=${d.calendarId} @change=${(e: Event) => set({ calendarId: (e.target as HTMLSelectElement).value })}>
            ${[...owners.entries()].map(
              ([owner, cals]) => html`<optgroup label=${owner}>
                ${cals.map((c) => html`<option value=${c.id} ?selected=${c.id === d.calendarId}>${c.name}${c.provider ? ` (${c.provider})` : ""}</option>`)}
              </optgroup>`,
            )}
          </select>
        </label>
        <label class="ui-mcal__allday-check"><input type="checkbox" .checked=${d.allDay} @change=${(e: Event) => set({ allDay: (e.target as HTMLInputElement).checked })} />${L.allDay}</label>
        <fieldset class="ui-mcal__when" data-when tabindex="-1" aria-invalid=${whenErr ? "true" : "false"} aria-describedby=${ifDefined(whenErr ? err : undefined)}>
          <legend class="tc-sr-only">${L.starts} – ${L.ends}</legend>
          <label class="ui-mcal__field"><span class="ui-mcal__flabel">${L.starts}</span>
            <span class="ui-mcal__pair">
              <input class="ui-mcal__input" type="date" aria-label=${`${L.starts}, date`} .value=${d.startDate} @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                // Moving the start date takes the end date with it
                const shift = (Date.parse(v) - Date.parse(d.startDate)) / 86_400_000;
                const endDate = Number.isFinite(shift) && Number.isFinite(Date.parse(d.endDate)) ? new Date(Date.parse(d.endDate) + shift * 86_400_000).toISOString().slice(0, 10) : d.endDate;
                set({ startDate: v, endDate });
              }} />
              ${d.allDay ? nothing : html`<input class="ui-mcal__input" type="time" step="900" aria-label=${`${L.starts}, time`} .value=${d.startTime} @change=${(e: Event) => set({ startTime: (e.target as HTMLInputElement).value })} />`}
            </span>
          </label>
          <label class="ui-mcal__field"><span class="ui-mcal__flabel">${L.ends}</span>
            <span class="ui-mcal__pair">
              <input class="ui-mcal__input" type="date" aria-label=${`${L.ends}, date`} .value=${d.endDate} @change=${(e: Event) => set({ endDate: (e.target as HTMLInputElement).value })} />
              ${d.allDay ? nothing : html`<input class="ui-mcal__input" type="time" step="900" aria-label=${`${L.ends}, time`} .value=${d.endTime} @change=${(e: Event) => set({ endTime: (e.target as HTMLInputElement).value })} />`}
            </span>
          </label>
        </fieldset>
        <label class="ui-mcal__field ui-mcal__field--wide"><span class="ui-mcal__flabel">${L.location}</span>
          <input class="ui-mcal__input" .value=${d.location} @input=${(e: Event) => set({ location: (e.target as HTMLInputElement).value })} />
        </label>
      </div>
      ${d.error ? html`<p class="ui-mcal__error" id=${err} role="alert">${icon(ICONS.alert)}<span>${d.error}</span></p>` : nothing}
      <div class="ui-mcal__pop-actions">
        <button type="button" class="tc-btn-sm" @click=${() => this.pop.close()}>${L.cancel}</button>
        <button type="submit" class="ui-mcal__save">${d.id ? L.save : L.create}</button>
      </div>
    </form>`;
  }

  protected override render() {
    const id = this.uid;
    const L = this.L;
    const rangeId = `${id}-range`;
    const people = new Set([...this.calById.values()].map((c) => c.owner?.id)).size;
    const open = this.mode === "detail" ? this.find(this.openId) : undefined;
    const keys =
      this.view === "agenda"
        ? "Up and down arrows move between events; Enter opens one; Delete deletes it"
        : this.view === "month"
          ? "Arrows move a day; Enter moves into the day's events or creates one; in events, up and down arrows move, Enter opens, Delete deletes, Escape goes back"
          : "Arrows move half an hour or a column; Enter moves into the slot's events or creates one; in events, up and down arrows move, Enter opens, Delete deletes, Escape goes back";
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <span class="tc-sr-only" id=${`${id}-keys`}>${keys}</span>
      ${cardHead({
        icon: calendarIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.calById.size
          ? html`<span class="ui-mcal__count"><span class="ui-mcal__count-value">${this.shown.size}/${this.calById.size}</span><span class="ui-mcal__count-label">${L.calendars.toLowerCase()} · ${people} ${L.people.toLowerCase()}</span></span>`
          : nothing,
      })}
      <div class="ui-mcal__card">
        ${this.renderToolbar(rangeId)}
        <div class="ui-mcal__body" ?data-folded=${this.folded}>
          ${this.renderSide()}
          <div class="ui-mcal__main" data-view=${this.view}>
            ${this.view === "month" ? this.renderMonth(rangeId) : this.view === "agenda" ? this.renderAgenda(rangeId) : this.renderTimeGrid(rangeId)}
          </div>
        </div>
      </div>
      ${this.pop.open ? (this.mode === "edit" && this.draft ? this.renderEditor(this.draft) : open ? this.renderDetail(open) : nothing) : nothing}
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mcal"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mcal"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* An hour's height, the time column, the sidebar's width, the grid's height and a column's least width – override any of them on the element */
[data-ui="mcal"] { --tc-mcal-hour: 48px; --tc-mcal-gutter: 56px; --tc-mcal-side: 240px; --tc-mcal-height: 600px; --tc-mcal-col-min: 112px; --tc-mcal-hairline: 1px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mcal"] { --tc-mcal-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mcal"] { --tc-mcal-bg: var(--tc-surface-raised); }
[data-ui="mcal"] *, [data-ui="mcal"] *::before, [data-ui="mcal"] *::after { box-sizing: border-box; }
[data-ui="mcal"] p, [data-ui="mcal"] h4, [data-ui="mcal"] dl, [data-ui="mcal"] dd, [data-ui="mcal"] ul, [data-ui="mcal"] fieldset { margin: 0; padding: 0; }
[data-ui="mcal"] ul { list-style: none; }
[data-ui="mcal"] fieldset { border: 0; min-width: 0; }
[data-ui="mcal"] button { font: inherit; color: inherit; }
.ui-mcal__icon { display: block; flex: none; width: 16px; height: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mcal__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-mcal__card { border-top: var(--tc-mcal-hairline) solid var(--tc-border-subtle); }
/* ----- The header's count ----- */
.ui-mcal__count { display: grid; flex: none; justify-items: end; }
.ui-mcal__count-value { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-mcal__count-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
/* ----- The toolbar ----- */
.ui-mcal__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-mcal-hairline) solid var(--tc-border-subtle); }
.ui-mcal__nav { display: flex; flex: 1 1 auto; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-mcal__range { margin-left: var(--tc-space-2) !important; overflow: hidden; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-mcal__step { display: inline-grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: 0; padding: 0; border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-muted); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mcal__step:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-mcal__views, .ui-mcal__group-by { display: flex; flex: none; gap: var(--tc-space-0-5); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-mcal__view, .ui-mcal__seg { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); margin: 0; padding: 0 var(--tc-space-2-5); border: 0; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: none; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); cursor: pointer; white-space: nowrap; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mcal__view .ui-mcal__icon { width: 14px; height: 14px; }
.ui-mcal__view:hover, .ui-mcal__seg:hover { color: var(--tc-text-primary); }
.ui-mcal__view[aria-checked="true"], .ui-mcal__seg[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-mcal__new, .ui-mcal__save { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg) !important; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mcal__new:hover, .ui-mcal__save:hover { background: var(--tc-action-primary-bg-hover); }
.ui-mcal__new:disabled { opacity: 0.4; cursor: not-allowed; }
.ui-mcal__new .ui-mcal__icon { width: 14px; height: 14px; }
[data-ui="mcal"] button:focus-visible, .ui-mcal__check:focus-visible, .ui-mcal__input:focus-visible, .ui-mcal__allday-check input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ----- The body: the sidebar beside the view ----- */
.ui-mcal__body { position: relative; display: grid; grid-template-columns: var(--tc-mcal-side) minmax(0, 1fr); min-height: 0; }
.ui-mcal__body[data-folded] { grid-template-columns: minmax(0, 1fr); }
.ui-mcal__side { display: flex; flex-direction: column; gap: var(--tc-space-4); max-height: var(--tc-mcal-height); overflow-y: auto; padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-4); border-right: var(--tc-mcal-hairline) solid var(--tc-border-subtle); scrollbar-width: thin; }
.ui-mcal__side[data-overlay] { position: absolute; inset: 0 auto 0 0; z-index: 3; width: min(var(--tc-mcal-side) + var(--tc-space-6), 100%); max-height: none; background: var(--tc-mcal-bg); box-shadow: var(--tc-menu-shadow); }
.ui-mcal__side[hidden] { display: none; }
.ui-mcal__side-head { display: flex; align-items: center; justify-content: space-between; }
.ui-mcal__side-title { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-mcal__side-toggle .ui-mcal__icon { width: 14px; height: 14px; }
/* The mini month */
.ui-mcal__mini-head { display: flex; align-items: center; gap: var(--tc-space-0-5); padding: 0 0 var(--tc-space-1) var(--tc-space-1); }
.ui-mcal__mini-month { flex: 1; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-mcal__mini-grid { width: 100%; border-collapse: collapse; table-layout: fixed; }
.ui-mcal__mini-grid th { padding: 0 0 var(--tc-space-1); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: center; }
.ui-mcal__mini-grid td { padding: 0; text-align: center; }
.ui-mcal__mini-day { position: relative; display: inline-grid; place-items: center; width: 100%; max-width: 30px; aspect-ratio: 1; margin: 0; padding: 0; border: 0; border-radius: var(--tc-radius-full); background: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); cursor: pointer; font-variant-numeric: tabular-nums; }
.ui-mcal__mini-day:hover { background: var(--tc-fill-hover); }
.ui-mcal__mini-day[data-out] { color: var(--tc-text-muted); }
.ui-mcal__mini-day[data-today] { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-strong); }
.ui-mcal__mini-day[data-focus] { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); }
.ui-mcal__mini-day[data-busy]::after { content: ""; position: absolute; bottom: 3px; left: 50%; width: 3px; height: 3px; transform: translateX(-50%); border-radius: var(--tc-radius-full); background: currentColor; opacity: 0.6; }
/* Calendars */
.ui-mcal__group-by { align-self: stretch; }
.ui-mcal__seg { flex: 1; justify-content: center; }
.ui-mcal__group { display: grid; gap: var(--tc-space-1); }
.ui-mcal__group-head { display: flex; align-items: center; gap: var(--tc-space-2); padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); }
.ui-mcal__cals { display: grid; gap: var(--tc-space-0-5); }
.ui-mcal__cal { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); }
.ui-mcal__cal:hover { background: var(--tc-fill-subtle); }
.ui-mcal__check { flex: none; width: 16px; height: 16px; margin: 0; accent-color: var(--tc-mcal-ink); cursor: pointer; }
.ui-mcal__cal-label { display: flex; flex: 1; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); cursor: pointer; }
.ui-mcal__cal-name { overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-mcal__cal-sub { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mcal__lock { align-self: center; flex: none; color: var(--tc-text-muted); }
.ui-mcal__lock .ui-mcal__icon { width: 12px; height: 12px; }
.ui-mcal__only { flex: none; height: 22px; margin: 0; padding: 0 var(--tc-space-1-5); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs) !important; color: var(--tc-text-secondary) !important; cursor: pointer; opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mcal__cal:hover .ui-mcal__only, .ui-mcal__only:focus-visible { opacity: 1; }
@media (hover: none) { .ui-mcal__only { opacity: 1; } }
.ui-mcal__show-all { justify-self: start; align-self: flex-start; }
.ui-mcal__quiet, .ui-mcal__empty { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-mcal__empty { padding: var(--tc-space-8) var(--tc-space-4) !important; text-align: center; }
/* People: avatars */
.ui-mcal__avatar, .ui-mcal__who { display: inline-grid; flex: none; place-items: center; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-mcal__avatar { width: 22px; height: 22px; font-size: var(--tc-font-size-2xs); }
.ui-mcal__who { width: 16px; height: 16px; font-size: var(--tc-font-size-2xs); background: color-mix(in oklab, var(--tc-mcal-ink) 30%, var(--tc-mcal-bg)); }
.ui-mcal__avatar img, .ui-mcal__who img { width: 100%; height: 100%; object-fit: cover; }
/* ----- The main area ----- */
.ui-mcal__main { min-width: 0; }
/* ----- Time grids: Day, Week, People ----- */
.ui-mcal__scroll { max-height: var(--tc-mcal-height); overflow: auto; scrollbar-width: thin; overscroll-behavior: contain; }
.ui-mcal__grid { min-width: calc(var(--tc-mcal-gutter) + var(--n) * var(--tc-mcal-col-min)); }
.ui-mcal__ghead, .ui-mcal__gbody { display: grid; grid-template-columns: var(--tc-mcal-gutter) repeat(var(--n), minmax(0, 1fr)); }
.ui-mcal__row { display: contents; }
.ui-mcal__ghead { position: sticky; top: 0; z-index: 2; background: var(--tc-mcal-bg); border-bottom: var(--tc-mcal-hairline) solid var(--tc-border-default); }
.ui-mcal__corner { display: flex; align-items: flex-end; justify-content: flex-end; padding: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-mcal__colhead { display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-2) var(--tc-space-1) var(--tc-space-1-5); border-left: var(--tc-mcal-hairline) solid var(--tc-border-subtle); }
.ui-mcal__colname { display: flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); min-width: 0; line-height: var(--tc-line-height-tight); }
.ui-mcal__wd { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-transform: uppercase; letter-spacing: var(--tc-tracking-caps); }
.ui-mcal__dn { display: inline-grid; place-items: center; min-width: 26px; height: 26px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-full); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-mcal__colhead[data-today] .ui-mcal__dn { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); }
.ui-mcal__colhead[data-today] .ui-mcal__wd { color: var(--tc-accent-text); }
.ui-mcal__person { overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-mcal__allday { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-mcal__gbody { position: relative; grid-auto-rows: calc(var(--tc-mcal-hour) / 2); }
.ui-mcal__time { position: relative; padding-right: var(--tc-space-2); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-none); color: var(--tc-text-muted); text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-mcal__time > span[aria-hidden] { position: relative; top: -0.5em; }
.ui-mcal__slot { min-width: 0; border-left: var(--tc-mcal-hairline) solid var(--tc-border-subtle); border-top: var(--tc-mcal-hairline) dashed color-mix(in oklab, var(--tc-border-subtle) 60%, transparent); outline: none; cursor: cell; }
.ui-mcal__slot[data-hour] { border-top: var(--tc-mcal-hairline) solid var(--tc-border-subtle); }
.ui-mcal__slot[data-off] { background: var(--tc-fill-subtle); }
.ui-mcal__slot:focus-visible { box-shadow: inset 0 0 0 2px var(--tc-focus-ring); }
.ui-mcal__ghead, .ui-mcal__gbody { --tc-mcal-colw: calc((100% - var(--tc-mcal-gutter)) / var(--n)); }
/* An event: placed by its minutes and its column within the overlap; the calendar's colour as a bar and a tint */
.ui-mcal__ev { position: absolute; top: calc(var(--top) / 1440 * 100%); left: calc(var(--tc-mcal-gutter) + var(--tc-mcal-colw) * var(--c) + var(--tc-mcal-colw) / var(--cols) * var(--col) + 1px); z-index: 1; display: flex; flex-direction: column; gap: var(--tc-space-0-5); width: calc(var(--tc-mcal-colw) / var(--cols) * var(--span, 1) - 3px); height: max(calc(var(--len) / 1440 * 100% - 2px), 18px); margin: var(--tc-mcal-hairline) 0 0; padding: var(--tc-space-0-5) var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-2); overflow: hidden; border: 0; border-radius: var(--tc-radius-sm); background: color-mix(in oklab, var(--tc-mcal-ink) 16%, var(--tc-mcal-bg)); box-shadow: inset 3px 0 0 var(--tc-mcal-ink); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-align: left; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mcal__ev:hover { z-index: 2; background: color-mix(in oklab, var(--tc-mcal-ink) 24%, var(--tc-mcal-bg)); }
.ui-mcal__ev[data-movable] { cursor: grab; }
.ui-mcal__ev[data-dragging] { z-index: 3; box-shadow: inset 3px 0 0 var(--tc-mcal-ink), var(--tc-menu-shadow); cursor: grabbing; opacity: 0.92; }
.ui-mcal__ev[data-short] { flex-direction: row; align-items: center; gap: var(--tc-space-1); }
.ui-mcal__ev[data-short] .ui-mcal__ev-meta { order: -1; }
.ui-mcal__ev-title { overflow: hidden; font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; min-width: 0; }
.ui-mcal__ev:not([data-short]) .ui-mcal__ev-title { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.ui-mcal__ev-meta { display: flex; flex: none; align-items: center; gap: var(--tc-space-1); min-width: 0; color: var(--tc-text-secondary); }
.ui-mcal__ev-time { font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-mcal__ev[data-short] .ui-mcal__ev-time { display: none; }
.ui-mcal__ev-marks { position: absolute; top: var(--tc-space-0-5); right: var(--tc-space-0-5); display: flex; gap: var(--tc-space-0-5); padding: var(--tc-mcal-hairline); border-radius: var(--tc-radius-xs); background: var(--tc-mcal-bg); }
.ui-mcal__mark { display: inline-flex; flex: none; color: var(--tc-text-muted); }
.ui-mcal__mark .ui-mcal__icon { width: 12px; height: 12px; }
.ui-mcal__mark--conflict { color: var(--tc-status-warning-fg); }
.ui-mcal__saving { font-size: var(--tc-font-size-2xs); color: var(--tc-text-muted); }
.ui-mcal__ev[data-pending], .ui-mcal__chip[data-pending] { opacity: 0.7; }
/* Tentative: a dashed edge and a hatch, not just a paler tint; cancelled: struck through */
.ui-mcal__ev[data-status="tentative"], .ui-mcal__chip[data-status="tentative"] { background: repeating-linear-gradient(135deg, color-mix(in oklab, var(--tc-mcal-ink) 10%, var(--tc-mcal-bg)) 0 5px, var(--tc-mcal-bg) 5px 10px); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--tc-mcal-ink) 60%, transparent); outline: 1px dashed var(--tc-mcal-ink); outline-offset: -1px; }
.ui-mcal__ev[data-status="cancelled"] .ui-mcal__ev-title, .ui-mcal__chip[data-status="cancelled"] .ui-mcal__chip-title, .ui-mcal__pop-title[data-cancelled] { text-decoration: line-through; color: var(--tc-text-secondary); }
.ui-mcal__ev[data-conflict] { box-shadow: inset 3px 0 0 var(--tc-mcal-ink), inset 0 0 0 1px var(--tc-status-warning-border); }
.ui-mcal__ev:focus-visible { z-index: 3; outline: var(--tc-focus-outline); outline-offset: 1px; }
.ui-mcal__resize { position: absolute; right: 0; bottom: 0; left: 0; height: 6px; cursor: ns-resize; }
.ui-mcal__now { position: absolute; top: calc(var(--top) / 1440 * 100%); left: calc(var(--tc-mcal-gutter) + var(--tc-mcal-colw) * var(--c)); z-index: 2; width: var(--tc-mcal-colw); height: 2px; margin-top: calc(-1 * var(--tc-mcal-hairline)); background: var(--tc-status-danger-solid); pointer-events: none; }
.ui-mcal__now::before { content: ""; position: absolute; top: -3px; left: -4px; width: 8px; height: 8px; border-radius: var(--tc-radius-full); background: var(--tc-status-danger-solid); }
.ui-mcal__ghost { position: absolute; top: calc(var(--top) / 1440 * 100%); left: calc(var(--tc-mcal-gutter) + var(--tc-mcal-colw) * var(--c) + 1px); z-index: 2; width: calc(var(--tc-mcal-colw) - 3px); height: calc(var(--len) / 1440 * 100%); padding: var(--tc-space-0-5) var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: color-mix(in oklab, var(--tc-accent) 18%, var(--tc-mcal-bg)); box-shadow: inset 0 0 0 1.5px var(--tc-accent); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); pointer-events: none; font-variant-numeric: tabular-nums; }
/* A one-line event: all-day rows, Month, Agenda */
.ui-mcal__chip { display: flex; align-items: center; gap: var(--tc-space-1); width: 100%; min-width: 0; height: 22px; margin: 0; padding: 0 var(--tc-space-1-5); border: 0; border-radius: var(--tc-radius-sm); background: none; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-align: left; cursor: pointer; }
.ui-mcal__chip:hover { background: var(--tc-fill-hover); }
.ui-mcal__chip[data-allday] { background: color-mix(in oklab, var(--tc-mcal-ink) 18%, var(--tc-mcal-bg)); box-shadow: inset 3px 0 0 var(--tc-mcal-ink); }
.ui-mcal__chip[data-conflict] { box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
.ui-mcal__chip[data-allday][data-conflict] { box-shadow: inset 3px 0 0 var(--tc-mcal-ink), inset 0 0 0 1px var(--tc-status-warning-border); }
.ui-mcal__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-full); background: var(--tc-mcal-ink); }
.ui-mcal__chip[data-allday] .ui-mcal__swatch { display: none; }
.ui-mcal__swatch--lg { width: 12px; height: 12px; border-radius: var(--tc-radius-xs); }
.ui-mcal__chip-time { flex: none; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-mcal__chip-title { flex: 1; min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
.ui-mcal__chip:focus-visible { outline: var(--tc-focus-outline); outline-offset: 0; }
/* ----- Month ----- */
.ui-mcal__month-wrap { overflow-x: auto; container-type: inline-size; scrollbar-width: thin; }
@container (max-width: 900px) { .ui-mcal__month .ui-mcal__chip-time { display: none; } }
.ui-mcal__month { display: grid; grid-template-rows: auto repeat(6, minmax(96px, 1fr)); min-width: 560px; }
.ui-mcal__mrow { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.ui-mcal__mwd { padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-transform: uppercase; letter-spacing: var(--tc-tracking-caps); }
.ui-mcal__mday { display: flex; flex-direction: column; gap: var(--tc-mcal-hairline); min-width: 0; padding: var(--tc-space-1); border-top: var(--tc-mcal-hairline) solid var(--tc-border-subtle); border-left: var(--tc-mcal-hairline) solid var(--tc-border-subtle); outline: none; cursor: cell; }
.ui-mcal__mrow > .ui-mcal__mday:first-child { border-left: 0; }
.ui-mcal__mday[data-out] { background: var(--tc-fill-subtle); }
.ui-mcal__mday[data-out] .ui-mcal__mnum { color: var(--tc-text-muted); }
.ui-mcal__mday:focus-visible { box-shadow: inset 0 0 0 2px var(--tc-focus-ring); }
.ui-mcal__mnum { display: inline-grid; place-items: center; align-self: flex-start; min-width: 24px; height: 24px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-full); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-mcal__mday[data-today] .ui-mcal__mnum { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); }
.ui-mcal__more { align-self: flex-start; height: 20px; margin: 0; padding: 0 var(--tc-space-1-5); border: 0; border-radius: var(--tc-radius-sm); background: none; font-size: var(--tc-font-size-2xs) !important; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary) !important; cursor: pointer; }
.ui-mcal__more:hover { background: var(--tc-fill-hover); }
/* ----- Agenda ----- */
.ui-mcal__agenda { max-height: var(--tc-mcal-height); overflow-y: auto; padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-4); scrollbar-width: thin; }
.ui-mcal__aday { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: var(--tc-space-3); padding: var(--tc-space-3) 0; border-bottom: var(--tc-mcal-hairline) solid var(--tc-border-subtle); }
.ui-mcal__aday:last-child { border-bottom: 0; }
.ui-mcal__adate { display: flex; align-items: baseline; gap: var(--tc-space-1-5); }
.ui-mcal__adn { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-mcal__awd { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-mcal__aday[data-today] .ui-mcal__adn { color: var(--tc-accent-text); }
.ui-mcal__aitems { display: grid; gap: var(--tc-space-1); }
.ui-mcal__arow { display: grid; grid-template-columns: 116px minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-2); }
.ui-mcal__atime { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-mcal__acal { overflow: hidden; max-width: 220px; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-mcal__agenda .ui-mcal__chip { height: var(--tc-control-h-sm); }
.ui-mcal__agenda-empty { padding: var(--tc-space-8) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- The popover: details and the editor ----- */
.ui-mcal__pop { width: min(360px, calc(100vw - var(--tc-space-4))); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4) !important; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-mcal__pop-head { display: flex; align-items: center; gap: var(--tc-space-2); margin-bottom: var(--tc-space-2); }
.ui-mcal__pop-title { flex: 1; min-width: 0; margin: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-mcal__facts { display: grid; gap: var(--tc-space-2); margin: 0 0 var(--tc-space-3); }
.ui-mcal__fact { display: grid; grid-template-columns: 22px minmax(0, 1fr); align-items: start; gap: var(--tc-space-2); }
.ui-mcal__fact > .ui-mcal__icon { justify-self: center; margin-top: var(--tc-space-0-5); color: var(--tc-text-muted); }
.ui-mcal__fact dd { grid-column: 2; grid-row: 1; margin: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-mcal__fact strong { font-weight: var(--tc-font-weight-medium); }
.ui-mcal__provider { display: inline-block; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); color: var(--tc-text-secondary); }
.ui-mcal__notes { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); margin-bottom: var(--tc-space-3); }
.ui-mcal__note { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-mcal__conflict, .ui-mcal__error, .ui-mcal__reason { display: flex; flex-basis: 100%; align-items: flex-start; gap: var(--tc-space-1-5); padding: var(--tc-space-2); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-mcal__conflict, .ui-mcal__error { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-mcal__error { margin-top: var(--tc-space-2); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-mcal__reason { margin-bottom: var(--tc-space-3); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); }
.ui-mcal__conflict .ui-mcal__icon, .ui-mcal__error .ui-mcal__icon, .ui-mcal__reason .ui-mcal__icon { width: 14px; height: 14px; margin-top: var(--tc-mcal-hairline); }
.ui-mcal__pop-actions { display: flex; justify-content: flex-end; gap: var(--tc-space-2); margin-top: var(--tc-space-3); }
.ui-mcal__delete:not(:disabled) { color: var(--tc-status-danger-fg); }
.ui-mcal__fields { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2-5); }
.ui-mcal__field { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-mcal__flabel { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-mcal__when { display: grid; gap: var(--tc-space-2-5); border-radius: var(--tc-radius-md); outline: none; }
.ui-mcal__when[aria-invalid="true"] .ui-mcal__input { box-shadow: var(--tc-field-shadow-invalid); }
.ui-mcal__pair { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: var(--tc-space-1-5); }
.ui-mcal__pair > :only-child { grid-column: 1 / -1; }
.ui-mcal__input { width: 100%; min-width: 0; height: var(--tc-field-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mcal__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-mcal__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); outline: none !important; }
.ui-mcal__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
select.ui-mcal__input { cursor: pointer; }
.ui-mcal__allday-check { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-mcal__allday-check input { margin: 0; width: 16px; height: 16px; accent-color: var(--tc-accent-solid); }
/* ----- Narrow ----- */
@container (max-width: 560px) {
  .ui-mcal__bar { padding: var(--tc-space-2) var(--tc-space-3); }
  .ui-mcal__side-toggle { order: 0; }
  .ui-mcal__new { order: 1; margin-left: auto; }
  .ui-mcal__nav { order: 2; flex-basis: 100%; }
  .ui-mcal__range { margin-left: auto !important; }
  .ui-mcal__views { order: 3; width: 100%; overflow-x: auto; }
  .ui-mcal__view { flex: 1; justify-content: center; padding: 0 var(--tc-space-1-5); }
  .ui-mcal__view .ui-mcal__icon { display: none; }
  .ui-mcal__range { font-size: var(--tc-font-size-md); }
  .ui-mcal__new span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-mcal__new { padding: 0; width: var(--tc-control-h-sm); justify-content: center; }
  .ui-mcal__aday { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1-5); }
  .ui-mcal__arow { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .ui-mcal__acal { max-width: none; padding-left: var(--tc-space-1-5); }
  .ui-mcal__agenda { padding: var(--tc-space-1) var(--tc-space-3) var(--tc-space-3); }
  [data-ui="mcal"] { --tc-mcal-gutter: 44px; }
}
@media (pointer: coarse) {
  .ui-mcal__chip { height: var(--tc-control-h-sm); }
}
@media (forced-colors: active) {
  .ui-mcal__ev, .ui-mcal__chip, .ui-mcal__ghost { border: 1px solid CanvasText; }
  .ui-mcal__swatch, .ui-mcal__now, .ui-mcal__now::before { background: CanvasText; }
  .ui-mcal__mini-day[data-focus], .ui-mcal__dn { border: 1px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mcal"] *, [data-ui="mcal"] *::before, [data-ui="mcal"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-multi-calendar")) customElements.define("tc-multi-calendar", TcMultiCalendar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-multi-calendar": TcMultiCalendar;
  }
}
