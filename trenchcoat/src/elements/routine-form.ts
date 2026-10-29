import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-routine-form> – the form that sets up a routine: a saved search or prompt that runs on a schedule and reports
 * back. A name; how often (hourly, daily, on weekdays, weekly on a day, monthly on a date) and at what time, in the
 * page's time zone, with the next run worked out below it; whether the first run waits for the schedule or goes right
 * away; when to send an email; and the instructions each run follows. Dismiss and Create routine (Save routine when
 * editing) at the foot.
 *   · `value` is one object (RoutineDraft); every edit fires a cancelable tc-value-change ({ value }) – call
 *     preventDefault() to control it
 *   · Create fires tc-submit ({ value, nextRun }) only when the name and the instructions are filled in; otherwise the
 *     missing ones say so under their fields, the first takes focus and the count is announced
 *   · the next run is worked out in `timeZone` (the browser's by default), from `now` or the element's own clock –
 *     nextRoutineRun() is exported for a page or a server that needs the same answer
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-routine-form time-zone="America/Los_Angeles" .value=${{ ...emptyRoutine(), name: "Weekly update" }}></tc-routine-form>
 */

export type RoutineFrequency = "hourly" | "daily" | "weekdays" | "weekly" | "monthly";
export type RoutineNotify = "never" | "every-run" | "updates" | "failures";
export type RoutineFirstRun = "scheduled" | "now";
/** When a routine runs */
export type RoutineSchedule = {
  frequency: RoutineFrequency;
  /** "13:45", 24-hour, in the routine's time zone; hourly runs use only its minutes */
  time: string;
  /** Weekly: the day, 0 = Sunday … 6 = Saturday */
  weekday?: number;
  /** Monthly: the day of the month, 1–31 (a shorter month runs on its last day) */
  dayOfMonth?: number;
};
/** Everything the form holds */
export type RoutineDraft = RoutineSchedule & {
  name: string;
  /** Whether the first run waits for the schedule or goes as soon as the routine is created */
  firstRun: RoutineFirstRun;
  /** When to send an email about a run */
  notify: RoutineNotify;
  /** What each run does, in words */
  instructions: string;
};

/** Details of the events */
export type RoutineValueChange = { value: RoutineDraft };
/** `nextRun` is the first scheduled run (epoch ms) – after the immediate one when `firstRun` is "now" */
export type RoutineSubmit = { value: RoutineDraft; nextRun: number | null };
export type RoutineDismiss = { value: RoutineDraft };
export type RoutineOpenRoutines = { href: string | null };

/** The form's words, every one renameable through `labels` */
export type RoutineLabels = {
  heading: string;
  editHeading: string;
  description: string;
  routines: string;
  name: string;
  namePlaceholder: string;
  frequency: string;
  startTime: string;
  timeZone: string;
  nextRun: string;
  firstRunThen: string;
  firstRun: string;
  atScheduledTime: string;
  rightAway: string;
  email: string;
  instructions: string;
  instructionsPlaceholder: string;
  dismiss: string;
  create: string;
  save: string;
  creating: string;
  saving: string;
  nameRequired: string;
  instructionsRequired: string;
  /** "Day {n}" – a day of the month */
  dayOfMonth: string;
  /** ":{mm} past the hour" – an hourly routine's minute */
  pastHour: string;
  frequencies: Record<RoutineFrequency, string>;
  notify: Record<RoutineNotify, string>;
};

export const defaultRoutineLabels: RoutineLabels = {
  heading: "Create a routine",
  editHeading: "Edit routine",
  description: "Each run uses credits. Turn routines off anytime from",
  routines: "Routines",
  name: "Name",
  namePlaceholder: "What this routine keeps an eye on",
  frequency: "Frequency",
  startTime: "Start time",
  timeZone: "Time zone",
  nextRun: "Next run",
  firstRunThen: "First run right away, then",
  firstRun: "First run",
  atScheduledTime: "At scheduled time",
  rightAway: "Right away",
  email: "Email notification",
  instructions: "Instructions",
  instructionsPlaceholder: "What to look for on each run, and how to report it",
  dismiss: "Dismiss",
  create: "Create routine",
  save: "Save routine",
  creating: "Creating…",
  saving: "Saving…",
  nameRequired: "Give the routine a name",
  instructionsRequired: "Say what each run should do",
  dayOfMonth: "Day {n}",
  pastHour: ":{mm} past the hour",
  frequencies: { hourly: "Hourly", daily: "Daily", weekdays: "Weekdays", weekly: "Weekly", monthly: "Monthly" },
  notify: { never: "Never", "every-run": "After every run", updates: "When a run finds an update", failures: "When a run fails" },
};

/** A new routine: weekly on Monday at 9:00, the first run on schedule, an email when a run finds something */
export const emptyRoutine = (): RoutineDraft => ({
  name: "",
  frequency: "weekly",
  weekday: 1,
  dayOfMonth: 1,
  time: "09:00",
  firstRun: "scheduled",
  notify: "updates",
  instructions: "",
});

/* ---------- Schedules in a time zone (no library) ---------- */

const FREQUENCIES: RoutineFrequency[] = ["hourly", "daily", "weekdays", "weekly", "monthly"];
const NOTIFY: RoutineNotify[] = ["never", "every-run", "updates", "failures"];
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

/** The browser's time zone, read when asked (never while rendering a value that's given) */
const browserZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};
/** `timeZone` when the browser knows it, else the browser's own */
function zoneOr(timeZone: string | undefined) {
  if (timeZone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone });
      return timeZone;
    } catch {
      // not a zone this browser knows – fall back
    }
  }
  return browserZone();
}

const partsFormat = new Map<string, Intl.DateTimeFormat>();
/** The wall clock in `tz` at instant `t` */
function wallIn(t: number, tz: string) {
  let f = partsFormat.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", weekday: "short", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    partsFormat.set(tz, f);
  }
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(t)) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second, wd: WEEK.indexOf(p.weekday) };
}
/** How far `tz`'s wall clock is ahead of UTC at instant `t`, in ms */
function offsetAt(t: number, tz: string) {
  const w = wallIn(t, tz);
  return Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s) - Math.floor(t / 1000) * 1000;
}
/**
 * The instant a wall-clock time happens in `tz`. Around a clock change: a time that happens twice is the first of
 * them; a time the change skips is read with the offset from before it, so it lands that much later ("2:30" on the
 * spring-forward night runs at 3:30)
 */
function instantOf(y: number, m: number, d: number, h: number, mi: number, tz: string) {
  const local = Date.UTC(y, m - 1, d, h, mi);
  const before = offsetAt(local - DAY_MS, tz);
  const after = offsetAt(local + DAY_MS, tz);
  const fits = (t: number) => {
    const w = wallIn(t, tz);
    return w.y === y && w.m === m && w.d === d && w.h === h && w.mi === mi;
  };
  const found = [...new Set([local - before, local - after])].filter(fits);
  return found.length ? Math.min(...found) : local - Math.min(before, after);
}
/** [hours, minutes] from "HH:MM", or null when it can't be read */
function parseTime(t: string | undefined): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? "");
  if (!m || +m[1] > 23 || +m[2] > 59) return null;
  return [+m[1], +m[2]];
}

/**
 * The next `count` runs (epoch ms) of a schedule after `now`, with the time read in `timeZone` (an IANA name, e.g.
 * "America/Los_Angeles"; the browser's by default). Empty when the time can't be read.
 */
export function nextRoutineRuns(schedule: RoutineSchedule, now: number, count = 3, timeZone?: string): number[] {
  const hm = parseTime(schedule.time);
  if (!hm || !Number.isFinite(now) || count < 1) return [];
  const [hh, mm] = hm;
  const tz = zoneOr(timeZone);
  const today = wallIn(now, tz);
  const out: number[] = [];
  const push = (t: number) => {
    if (t > now && (!out.length || t > out[out.length - 1])) out.push(t);
  };
  if (schedule.frequency === "hourly") {
    for (let i = 0; out.length < count && i < 24 * 3; i++) {
      const at = new Date(Date.UTC(today.y, today.m - 1, today.d, today.h + i));
      push(instantOf(at.getUTCFullYear(), at.getUTCMonth() + 1, at.getUTCDate(), at.getUTCHours(), mm, tz));
    }
    return out;
  }
  const weekday = Math.round(schedule.weekday ?? 1);
  const dom = Math.min(31, Math.max(1, Math.round(schedule.dayOfMonth ?? 1)));
  for (let i = 0; out.length < count && i < 366 * 3; i++) {
    const day = new Date(Date.UTC(today.y, today.m - 1, today.d + i));
    const [y, m, d, wd] = [day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), day.getUTCDay()];
    const runs =
      schedule.frequency === "daily" ||
      (schedule.frequency === "weekdays" && wd >= 1 && wd <= 5) ||
      (schedule.frequency === "weekly" && wd === weekday) ||
      (schedule.frequency === "monthly" && d === Math.min(dom, new Date(Date.UTC(y, m, 0)).getUTCDate()));
    if (runs) push(instantOf(y, m, d, hh, mm, tz));
  }
  return out;
}

/** The next run (epoch ms) of a schedule after `now`, in `timeZone`; null when it can't be worked out */
export function nextRoutineRun(schedule: RoutineSchedule, now: number, timeZone?: string): number | null {
  return nextRoutineRuns(schedule, now, 1, timeZone)[0] ?? null;
}

/* After Lucide (ISC, lucide.dev): clock – the header; chevron-down – the selects */
const clockIcon = svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`;
const chevron = () => html`<svg class="ui-rtn__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>`;

/** The browser's clock – read when the element connects and once a minute after, never while rendering */
const wallClock = (): number => Date.now();
const MINUTE = 60_000;
let uidCount = 0;

/**
 * A form that creates or edits a routine – name, frequency and start time in a time zone with the next run worked out,
 * first run now or on schedule, email notifications and instructions, with Dismiss and Create routine.
 * @tag tc-routine-form
 * @fires tc-value-change - A field changed ({ value }: RoutineValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-submit - Create routine (Save routine when editing) was pressed with the name and instructions filled in ({ value, nextRun }: RoutineSubmit); cancelable – prevented, nothing is announced
 * @fires tc-dismiss - Dismiss was pressed ({ value }: RoutineDismiss)
 * @fires tc-open-routines - The Routines link in the description was used ({ href }: RoutineOpenRoutines); cancelable – prevented, the link doesn't open
 */
export class TcRoutineForm extends TcElement {
  static override ui = "rtn";

  /** The heading; by default "Create a routine", or "Edit routine" in edit mode */
  @property() accessor heading = "";
  /** The line under the heading, before the Routines link; by default the labels' description */
  @property() accessor description: string | undefined = undefined;
  /** The form's contents. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: RoutineDraft = emptyRoutine();
  /** "create" for a new routine, "edit" for one that exists – it names the heading and the main button */
  @property() accessor mode: "create" | "edit" = "create";
  /** Where the Routines link in the description goes; without it, the link is a button that fires tc-open-routines */
  @property({ attribute: "routines-href" }) accessor routinesHref: string | undefined = undefined;
  /** The routine's time zone, an IANA name such as "America/Los_Angeles"; by default the browser's */
  @property({ attribute: "time-zone" }) accessor timeZone = "";
  /** The time now, epoch ms, for the next run; by default the element's own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** While the page saves the routine: the buttons wait and the main one says "Creating…" */
  @property({ type: Boolean, reflect: true }) accessor busy = false;
  /** The language for days and times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The form's words, merged over defaultRoutineLabels */
  @property({ attribute: false }) accessor labels: Partial<RoutineLabels> = {};

  @state() private accessor clock = 0;
  @state() private accessor touched = new Set<"name" | "instructions">();
  @state() private accessor attempted = false;
  @state() private accessor announce = "";

  private uid = `tc-rtn-${++uidCount}`;
  private timer = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.tick();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.timer);
    this.timer = 0;
  }
  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("now") && this.isConnected) this.tick();
  }
  private tick() {
    clearInterval(this.timer);
    this.timer = 0;
    if (this.now !== undefined) return;
    this.readClock();
    this.timer = window.setInterval(this.readClock, MINUTE);
  }
  private readClock = () => (this.clock = wallClock());

  /* ---------- The model ---------- */

  private get l(): RoutineLabels {
    const l = this.labels;
    return { ...defaultRoutineLabels, ...l, frequencies: { ...defaultRoutineLabels.frequencies, ...l.frequencies }, notify: { ...defaultRoutineLabels.notify, ...l.notify } };
  }
  private get zone() {
    return zoneOr(this.timeZone);
  }
  /** The next scheduled run, epoch ms */
  get nextRun(): number | null {
    return nextRoutineRun(this.value, this.now ?? this.clock, this.timeZone || undefined);
  }
  /** What's missing, in the order the fields come */
  private get problems() {
    const v = this.value;
    const out: { field: "name" | "instructions"; message: string }[] = [];
    if (!v.name.trim()) out.push({ field: "name", message: this.l.nameRequired });
    if (!v.instructions.trim()) out.push({ field: "instructions", message: this.l.instructionsRequired });
    return out;
  }
  private errorFor(field: "name" | "instructions") {
    if (!this.attempted && !this.touched.has(field)) return undefined;
    return this.problems.find((p) => p.field === field)?.message;
  }
  private when(t: number | null) {
    if (t === null) return "–";
    const opts: Intl.DateTimeFormatOptions = { timeZone: this.zone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
    try {
      return new Intl.DateTimeFormat(this.locale, opts).format(t);
    } catch {
      return new Intl.DateTimeFormat(undefined, opts).format(t);
    }
  }
  private weekdayNames() {
    // 4 Jan 2026 was a Sunday
    let f: Intl.DateTimeFormat;
    try {
      f = new Intl.DateTimeFormat(this.locale, { weekday: "long", timeZone: "UTC" });
    } catch {
      f = new Intl.DateTimeFormat(undefined, { weekday: "long", timeZone: "UTC" });
    }
    return Array.from({ length: 7 }, (_, i) => f.format(Date.UTC(2026, 0, 4 + i)));
  }

  /* ---------- Changes ---------- */

  private commit(patch: Partial<RoutineDraft>) {
    const value = { ...this.value, ...patch };
    if (!this.emit<RoutineValueChange>("tc-value-change", { value }, { cancelable: true })) {
      // Controlled: the native controls show what they were given again
      this.requestUpdate();
      return;
    }
    this.value = value;
  }
  private touch(field: "name" | "instructions") {
    if (this.touched.has(field)) return;
    this.touched = new Set([...this.touched, field]);
  }
  private submit = (e: Event) => {
    e.preventDefault();
    if (this.busy) return;
    const problems = this.problems;
    if (problems.length) {
      this.attempted = true;
      this.announce = `${problems.length === 1 ? "1 field needs" : `${problems.length} fields need`} filling in: ${problems.map((p) => p.message).join("; ")}`;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-${problems[0].field}`)?.focus());
      return;
    }
    const nextRun = this.nextRun;
    if (!this.emit<RoutineSubmit>("tc-submit", { value: this.value, nextRun }, { cancelable: true })) return;
    this.announce = this.mode === "edit" ? "Routine saved" : `Routine created. Next run ${this.when(nextRun)}`;
  };
  private openRoutines = (e: Event) => {
    const href = safeUrl(this.routinesHref) ?? null;
    if (!this.emit<RoutineOpenRoutines>("tc-open-routines", { href }, { cancelable: true })) e.preventDefault();
  };

  /* ---------- Rendering ---------- */

  /** A labelled row: the label on the left, the control on the right (stacked when narrow) */
  private row(id: string, label: string, control: unknown, forControl = true) {
    return html`<div class="ui-rtn__row" data-row=${id}>
      ${forControl ? html`<label class="ui-rtn__label" for=${`${this.uid}-${id}`}>${label}</label>` : html`<span class="ui-rtn__label" id=${`${this.uid}-${id}-label`}>${label}</span>`}
      <div class="ui-rtn__control">${control}</div>
    </div>`;
  }
  private select(id: string, value: string, options: [string, string][], onChange: (v: string) => void, extra: { label?: string; cls?: string } = {}) {
    return html`<span class="ui-rtn__select ${extra.cls ?? ""}"
      ><select
        class="ui-rtn__input"
        id=${ifDefined(extra.label ? undefined : `${this.uid}-${id}`)}
        aria-label=${ifDefined(extra.label)}
        .value=${live(value)}
        ?disabled=${this.busy}
        @change=${(e: Event) => onChange((e.target as HTMLSelectElement).value)}
      >
        ${options.map(([v, text]) => html`<option value=${v} ?selected=${v === value}>${text}</option>`)}
      </select
      >${chevron()}</span
    >`;
  }

  private renderStart() {
    const l = this.l;
    const v = this.value;
    const hm = parseTime(v.time) ?? [9, 0];
    const startLabel = `${this.uid}-start-label`;
    let lead: unknown = nothing;
    if (v.frequency === "weekly") {
      const names = this.weekdayNames();
      lead = this.select("weekday", String(v.weekday ?? 1), names.map((n, i) => [String(i), n]), (x) => this.commit({ weekday: Number(x) }), { label: `${l.startTime}: day of the week` });
    } else if (v.frequency === "monthly") {
      lead = this.select(
        "dom",
        String(v.dayOfMonth ?? 1),
        Array.from({ length: 31 }, (_, i) => [String(i + 1), l.dayOfMonth.replace("{n}", String(i + 1))]),
        (x) => this.commit({ dayOfMonth: Number(x) }),
        { label: `${l.startTime}: day of the month` },
      );
    }
    const time =
      v.frequency === "hourly"
        ? this.select(
            "minute",
            String(hm[1]),
            [...new Set([...Array.from({ length: 12 }, (_, i) => i * 5), hm[1]])].sort((a, b) => a - b).map((m) => [String(m), l.pastHour.replace("{mm}", pad(m))]),
            (x) => this.commit({ time: `${pad(hm[0])}:${pad(Number(x))}` }),
            { label: `${l.startTime}: minutes past the hour`, cls: "ui-rtn__select--wide" },
          )
        : html`<span class="ui-rtn__time"
            ><input
              class="ui-rtn__input"
              type="time"
              aria-label=${`${l.startTime}: time`}
              .value=${live(`${pad(hm[0])}:${pad(hm[1])}`)}
              ?disabled=${this.busy}
              @change=${(e: Event) => {
                const t = (e.target as HTMLInputElement).value;
                if (parseTime(t)) this.commit({ time: t });
                else this.requestUpdate();
              }}
          /></span>`;
    const next = this.nextRun;
    return html`<div class="ui-rtn__start" role="group" aria-labelledby=${startLabel} ?data-pair=${lead !== nothing}>${lead}${time}</div>
      <p class="ui-rtn__hint">${l.timeZone}: ${this.zone}</p>
      <p class="ui-rtn__next" aria-live="polite">${v.firstRun === "now" ? html`${l.firstRunThen} <strong>${this.when(next)}</strong>` : html`${l.nextRun}: <strong>${this.when(next)}</strong>`}</p>`;
  }

  protected override render() {
    const l = this.l;
    const v = this.value;
    const id = this.uid;
    const editing = this.mode === "edit";
    const title = this.heading || (editing ? l.editHeading : l.heading);
    const href = safeUrl(this.routinesHref);
    const link = l.routines
      ? href
        ? html`<a class="ui-rtn__link" href=${href} @click=${this.openRoutines}>${l.routines}</a>`
        : html`<button type="button" class="ui-rtn__link" @click=${this.openRoutines}>${l.routines}</button>`
      : nothing;
    const description = this.description ?? l.description;
    const nameError = this.errorFor("name");
    const instructionsError = this.errorFor("instructions");
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: clockIcon, title, subtitle: description || link !== nothing ? html`${description}${description && link !== nothing ? " " : ""}${link}` : undefined, id: `${id}-title` })}
      <form class="ui-rtn__card" novalidate aria-labelledby=${`${id}-title`} @submit=${this.submit}>
        <div class="ui-rtn__rows">
          ${this.row(
            "name",
            l.name,
            html`<input
                class="ui-rtn__input"
                id=${`${id}-name`}
                type="text"
                autocomplete="off"
                required
                placeholder=${l.namePlaceholder}
                aria-invalid=${nameError ? "true" : "false"}
                aria-describedby=${ifDefined(nameError ? `${id}-name-error` : undefined)}
                .value=${live(v.name)}
                ?disabled=${this.busy}
                @input=${(e: Event) => this.commit({ name: (e.target as HTMLInputElement).value })}
                @blur=${() => this.touch("name")}
              />${nameError ? html`<p class="ui-rtn__error" id=${`${id}-name-error`}>${nameError}</p>` : nothing}`,
          )}
          ${this.row(
            "frequency",
            l.frequency,
            this.select(
              "frequency",
              v.frequency,
              FREQUENCIES.map((f) => [f, l.frequencies[f]]),
              (x) => this.commit({ frequency: x as RoutineFrequency }),
            ),
          )}
          ${this.row("start", l.startTime, this.renderStart(), false)}
          ${this.row(
            "first",
            l.firstRun,
            html`<tc-segmented-control
              class="ui-rtn__seg"
              look=${this.resolvedLook}
              full-width
              aria-labelledby=${`${id}-first-label`}
              .options=${[
                { value: "scheduled", label: l.atScheduledTime },
                { value: "now", label: l.rightAway },
              ] as SegmentOption[]}
              .value=${v.firstRun}
              ?disabled=${this.busy}
              @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
                // The inner control's event stops here: the page hears this element's tc-value-change only
                e.stopPropagation();
                e.preventDefault();
                this.commit({ firstRun: e.detail.value as RoutineFirstRun });
              }}
            ></tc-segmented-control>`,
            false,
          )}
          ${this.row(
            "notify",
            l.email,
            this.select(
              "notify",
              v.notify,
              NOTIFY.map((n) => [n, l.notify[n]]),
              (x) => this.commit({ notify: x as RoutineNotify }),
            ),
          )}
          ${this.row(
            "instructions",
            l.instructions,
            html`<textarea
                class="ui-rtn__input ui-rtn__instructions"
                id=${`${id}-instructions`}
                rows="5"
                required
                placeholder=${l.instructionsPlaceholder}
                aria-invalid=${instructionsError ? "true" : "false"}
                aria-describedby=${ifDefined(instructionsError ? `${id}-instructions-error` : undefined)}
                .value=${live(v.instructions)}
                ?disabled=${this.busy}
                @input=${(e: Event) => this.commit({ instructions: (e.target as HTMLTextAreaElement).value })}
                @blur=${() => this.touch("instructions")}
              ></textarea>${instructionsError ? html`<p class="ui-rtn__error" id=${`${id}-instructions-error`}>${instructionsError}</p>` : nothing}`,
          )}
        </div>
        <div class="ui-rtn__foot">
          <button type="button" class="ui-rtn__dismiss" ?disabled=${this.busy} @click=${() => this.emit<RoutineDismiss>("tc-dismiss", { value: this.value })}>${l.dismiss}</button>
          <button type="submit" class="ui-rtn__submit" aria-disabled=${this.busy ? "true" : "false"}>${this.busy ? (editing ? l.saving : l.creating) : editing ? l.save : l.create}</button>
        </div>
      </form>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rtn"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  --tc-rtn-label-w: 148px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rtn"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  --tc-rtn-label-w: 148px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rtn"] *, [data-ui="rtn"] *::before, [data-ui="rtn"] *::after { box-sizing: border-box; }
:where([data-ui="rtn"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rtn"] button:focus-visible, [data-ui="rtn"] a:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rtn"] p { margin: 0; }
[data-ui="rtn"] form { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rtn__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rtn__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
/* The Routines link in the description */
.ui-rtn__link { color: var(--tc-accent-text); text-decoration: underline; text-decoration-color: color-mix(in srgb, currentColor 40%, transparent); text-underline-offset: var(--tc-space-0-5); }
.ui-rtn__link:hover { text-decoration-color: currentColor; }
/* ----- Labelled rows: label left, control right ----- */
.ui-rtn__rows { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-5) var(--tc-space-5) var(--tc-space-5); }
.ui-rtn__row { display: grid; grid-template-columns: var(--tc-rtn-label-w) minmax(0, 1fr); align-items: start; gap: var(--tc-space-3); }
.ui-rtn__label { display: flex; align-items: center; min-height: var(--tc-field-h); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-rtn__control { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-rtn__input { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rtn__input:hover:not(:disabled) { box-shadow: var(--tc-field-shadow-hover); }
.ui-rtn__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-rtn__input[aria-invalid="true"]:not(:focus-visible) { box-shadow: var(--tc-field-shadow-invalid); }
.ui-rtn__input::placeholder { color: var(--tc-text-placeholder); }
.ui-rtn__input:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-rtn__instructions { height: auto; min-height: calc(5 * var(--tc-line-height-normal) + 2 * var(--tc-space-2-5)); max-height: calc(14 * var(--tc-line-height-normal)); padding: var(--tc-space-2-5) var(--tc-field-px); line-height: var(--tc-line-height-normal); resize: vertical; field-sizing: content; }
/* Selects drawn as fields: no native arrow, a chevron at the end */
.ui-rtn__select { position: relative; display: block; min-width: 0; }
.ui-rtn__select > select { padding-right: var(--tc-space-8); appearance: none; text-overflow: ellipsis; cursor: pointer; }
.ui-rtn__chevron { position: absolute; top: 50%; right: var(--tc-space-3); width: var(--tc-space-4); height: var(--tc-space-4); fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
.ui-rtn__time { display: block; min-width: 0; }
.ui-rtn__time input::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
.ui-rtn__time input::-webkit-calendar-picker-indicator:hover { opacity: 0.8; }
/* Start time: a day and a time side by side, or the time alone */
.ui-rtn__start { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-3); }
.ui-rtn__start[data-pair] { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.ui-rtn__hint { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rtn__next { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-rtn__next strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-rtn__seg { display: block; max-width: 100%; }
.ui-rtn__error { font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
/* ----- The foot: Dismiss and the main button ----- */
.ui-rtn__foot { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rtn__dismiss, .ui-rtn__submit { display: inline-flex; align-items: center; justify-content: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-rtn__dismiss { color: var(--tc-text-primary); }
.ui-rtn__dismiss:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); }
.ui-rtn__dismiss:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-rtn__submit { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-rtn__submit:hover { background: var(--tc-action-primary-bg-hover); }
.ui-rtn__submit:active { background: var(--tc-action-primary-bg-active); transform: scale(0.98); }
.ui-rtn__submit[aria-disabled="true"] { cursor: progress; }
@container (max-width: 520px) {
  .ui-rtn__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1-5); }
  .ui-rtn__label { min-height: 0; }
  .ui-rtn__rows { padding: var(--tc-space-4); }
  .ui-rtn__foot { padding: var(--tc-space-3) var(--tc-space-4); }
}
@container (max-width: 340px) {
  .ui-rtn__start[data-pair] { grid-template-columns: minmax(0, 1fr); }
  .ui-rtn__foot > * { flex: 1; }
}
@media (forced-colors: active) {
  .ui-rtn__chevron { stroke: ButtonText; }
  .ui-rtn__input[aria-invalid="true"] { outline: 2px solid Mark; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rtn"] *, [data-ui="rtn"] *::before, [data-ui="rtn"] *::after { animation: none; transition: none; }
}
`;
}

if (!customElements.get("tc-routine-form")) customElements.define("tc-routine-form", TcRoutineForm);

declare global {
  interface HTMLElementTagNameMap {
    "tc-routine-form": TcRoutineForm;
  }
}
