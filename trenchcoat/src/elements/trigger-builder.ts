import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";
import "./combobox";
import type { ComboboxOption, ComboboxValueChange } from "./combobox";
import "./date-range-picker";
import { formatDateRange, type DateRangeValueChange, type RangePreset } from "./date-range-picker";
import "./segmented-control";
import type { SegmentOption } from "./segmented-control";

/*
 * <tc-trigger-builder> – when an automation runs: "when a deal changes stage", or "every Monday at 9". Pick an event
 * (a searchable combobox) or a schedule (hourly, daily, on some weekdays, monthly; a time; optionally only between two
 * dates, with the date-range picker), add conditions ("only if Amount is more than 10,000", all or any), and read it
 * back as one plain sentence with the next five run times below. Standard has the gray tray around a white card and
 * the time zone under it; Clean is one white card.
 *
 *   <tc-trigger-builder name="trigger" .events=${events} .value=${{ kind: "schedule", schedule: { frequency: "weekly", days: [1], time: "09:00" }, conditions: [], match: "all" }}></tc-trigger-builder>
 *
 * It edits one value, the trigger definition: every change fires a cancelable `tc-value-change` ({ value }) – call
 * preventDefault() to control `value` yourself. It's a form-associated element: with `name`, the form gets the
 * definition as JSON; an event trigger without an event, or a weekly one without a day, is invalid; a form reset
 * brings back the first value. Next run times are counted from `now` (ms), which defaults to when the element
 * connects – the clock is never read while rendering. Times are in the browser's time zone.
 */

export type TriggerFrequency = "hourly" | "daily" | "weekly" | "monthly";
export type TriggerOperator = "is" | "is-not" | "contains" | "gt" | "lt";
export type TriggerSchedule = {
  frequency: TriggerFrequency;
  /** "09:00", 24-hour; hourly runs use its minutes */
  time: string;
  /** Weekly: the days, 0 = Sunday … 6 = Saturday */
  days?: number[];
  /** Monthly: the day of the month, 1–31 (a short month runs on its last day) */
  dayOfMonth?: number;
};
/** Only between these days, "YYYY-MM-DD", both included */
export type TriggerActive = { start: string; end: string };
export type TriggerCondition = { field: string; operator: TriggerOperator; value: string };
export type TriggerValue = {
  kind: "event" | "schedule";
  /** The id of the event, for kind "event" */
  event?: string;
  schedule?: TriggerSchedule;
  active?: TriggerActive | null;
  conditions: TriggerCondition[];
  /** Whether all conditions must hold, or any one */
  match: "all" | "any";
};
export type TriggerField = {
  id: string;
  label: string;
  /** "text" (the default), "number", or "select" with `options` */
  type?: "text" | "number" | "select";
  options?: string[];
};
export type TriggerEvent = {
  id: string;
  /** In the list – "Deal changes stage" */
  label: string;
  /** In the sentence after "when" – "a deal changes stage"; defaults to the label */
  phrase?: string;
  /** Lighter text in the list, e.g. the app it comes from */
  hint?: string;
  /** Events with the same group are listed under one title */
  group?: string;
  /** An icon element (cloned) */
  icon?: Element;
  /** What its conditions can test */
  fields?: TriggerField[];
};
export type TriggerValueChange = { value: TriggerValue };

/* ---------- Dates and times (local time, no library) ---------- */

/** The wall clock – read once, when the element connects (the default `now`), never while rendering. Looked up on
 *  every call, so a page (or a test) that replaces Date is followed */
const wallClock = (): number => Date.now();

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
};
const dayOf = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
/** [hours, minutes] from "HH:MM" – 9:00 when it can't be read */
function parseTime(t: string | undefined): [number, number] {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? "");
  return m ? [clamp(+m[1], 0, 23), clamp(+m[2], 0, 59)] : [9, 0];
}

/** The next `count` run times (ms) of a schedule after `now`, inside `active` when given */
export function nextTriggerRuns(schedule: TriggerSchedule, now: number, count = 5, active?: TriggerActive | null): number[] {
  const out: number[] = [];
  const startDay = active ? fromIso(active.start) : null;
  const endDay = active ? fromIso(active.end) : null;
  const from = Math.max(now, startDay?.getTime() ?? -Infinity);
  const until = endDay ? addDays(endDay, 1).getTime() - 1 : Infinity;
  const [hh, mm] = parseTime(schedule.time);
  const push = (d: Date) => {
    const t = d.getTime();
    if (t > now && t >= from && t <= until && out.length < count) out.push(t);
  };
  const base = new Date(from);
  if (schedule.frequency === "hourly") {
    let d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), mm);
    for (let i = 0; out.length < count && i < 24 * 366 && d.getTime() <= until; i++) {
      push(d);
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1, mm);
    }
    return out;
  }
  const days = new Set(schedule.days ?? []);
  const dom = clamp(Math.round(schedule.dayOfMonth ?? 1), 1, 31);
  for (let i = 0; out.length < count && i < 366 * 6; i++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    if (day.getTime() > until) break;
    const runs =
      schedule.frequency === "daily" ||
      (schedule.frequency === "weekly" && days.has(day.getDay())) ||
      (schedule.frequency === "monthly" && day.getDate() === Math.min(dom, daysIn(day.getFullYear(), day.getMonth())));
    if (runs) push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm));
  }
  return out;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fmtTime = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const fmtRunDay = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const timeText = (time: string) => {
  const [h, m] = parseTime(time);
  return fmtTime.format(new Date(2000, 0, 1, h, m));
};
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
const list = (items: string[], last = "and") => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`);
const OPERATORS: Record<TriggerOperator, string> = { is: "is", "is-not": "is not", contains: "contains", gt: "is more than", lt: "is less than" };
const operatorsFor = (type: TriggerField["type"]): TriggerOperator[] => (type === "number" ? ["is", "gt", "lt"] : type === "select" ? ["is", "is-not"] : ["is", "is-not", "contains"]);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "every Monday and Thursday at 9:00 AM" */
function scheduleText(s: TriggerSchedule) {
  const at = `at ${timeText(s.time)}`;
  if (s.frequency === "hourly") return `every hour at :${pad(parseTime(s.time)[1])}`;
  if (s.frequency === "daily") return `every day ${at}`;
  if (s.frequency === "monthly") {
    const d = clamp(Math.round(s.dayOfMonth ?? 1), 1, 31);
    return `on the ${ordinal(d)} of every month${d > 28 ? " (or its last day)" : ""} ${at}`;
  }
  const days = [...new Set(s.days ?? [])].filter((d) => d >= 0 && d <= 6).sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (!days.length) return "on no day yet – pick one";
  if (days.length === 7) return `every day ${at}`;
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return `every weekday ${at}`;
  if (days.length === 2 && days.includes(0) && days.includes(6)) return `every Saturday and Sunday ${at}`;
  return `every ${list(days.map((d) => DAY_NAMES[d]))} ${at}`;
}

/** The trigger as one sentence: "Runs every Monday at 9:00 AM, only if Stage is Won." */
export function describeTrigger(value: TriggerValue, events: TriggerEvent[] = [], fields?: TriggerField[]): string {
  const ev = value.kind === "event" ? events.find((e) => e.id === value.event) : undefined;
  if (value.kind === "event" && !ev) return "Pick the event that starts this automation.";
  const fieldList = fields ?? ev?.fields ?? [];
  let text = value.kind === "event" ? `Runs when ${ev!.phrase ?? lower(ev!.label)}` : `Runs ${scheduleText(value.schedule ?? DEFAULT_SCHEDULE)}`;
  const start = value.active ? fromIso(value.active.start) : null;
  const end = value.active ? fromIso(value.active.end) : null;
  if (start && end) text += `, ${start.getTime() === end.getTime() ? "on" : "from"} ${formatDateRange({ start, end }).replace(" – ", " to ")}`;
  const conds = value.conditions
    .map((c) => {
      const f = fieldList.find((x) => x.id === c.field);
      if (!f || c.value.trim() === "") return null;
      const v = f.type === "number" && Number.isFinite(+c.value) ? (+c.value).toLocaleString("en-US") : c.value.trim();
      return `${f.label} ${OPERATORS[c.operator] ?? "is"} ${f.type === "number" ? v : `“${v}”`}`;
    })
    .filter((c): c is string => !!c);
  if (conds.length) text += `, only if ${list(conds, value.match === "any" ? "or" : "and")}`;
  return `${text}.`;
}

/* ---------- Icons (elements, cloned by the segmented control) ---------- */

const NS = "http://www.w3.org/2000/svg";
function iconEl(d: string) {
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", "0 0 16 16");
  s.setAttribute("aria-hidden", "true");
  s.setAttribute("fill", "none");
  s.setAttribute("stroke", "currentColor");
  s.setAttribute("stroke-width", "1.4");
  s.setAttribute("stroke-linecap", "round");
  s.setAttribute("stroke-linejoin", "round");
  const p = document.createElementNS(NS, "path");
  p.setAttribute("d", d);
  s.append(p);
  return s;
}
let kindIcons: { event: Element; schedule: Element } | null = null;
const getKindIcons = () =>
  (kindIcons ??= {
    event: iconEl("M8.9 1.75 3.5 9h4l-.4 5.25L12.5 7h-4l.4-5.25Z"),
    schedule: iconEl("M8 2.25a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5ZM8 4.75V8l2.25 1.5"),
  });

const summaryIcon = (look: Look) =>
  html`<svg class="ui-tgb__summary-icon" viewBox="0 0 16 16" aria-hidden="true">${look === "clean"
    ? svg`<path d="M8 2 9.5 6.5 14 8l-4.5 1.5L8 14 6.5 9.5 2 8l4.5-1.5Z"></path>`
    : svg`<path d="M8 2.5 9.3 6.7 13.5 8l-4.2 1.3L8 13.5 6.7 9.3 2.5 8l4.2-1.3Z"></path>`}</svg>`;
const plusIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 3.5v9M3.5 8h9"></path>`}</svg>`;
const removeIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="m4.75 4.75 6.5 6.5M11.25 4.75l-6.5 6.5"></path>`}</svg>`;
const chevronDown = html`<svg class="ui-tgb__select-chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;

/* ---------- The element ---------- */

const DEFAULT_SCHEDULE: TriggerSchedule = { frequency: "weekly", days: [1], time: "09:00" };
const DEFAULT_VALUE: TriggerValue = { kind: "schedule", schedule: DEFAULT_SCHEDULE, active: null, conditions: [], match: "all" };
const FREQUENCIES: { value: TriggerFrequency; label: string }[] = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];
/** Monday first */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** Future windows for "only between" – the date-range picker's presets look back */
const ACTIVE_PRESETS: RangePreset[] = [
  { id: "7d", label: "Next 7 days", range: (t) => ({ start: t, end: addDays(t, 6) }) },
  { id: "30d", label: "Next 30 days", range: (t) => ({ start: t, end: addDays(t, 29) }) },
  { id: "90d", label: "Next 90 days", range: (t) => ({ start: t, end: addDays(t, 89) }) },
  { id: "month", label: "Rest of this month", range: (t) => ({ start: t, end: new Date(t.getFullYear(), t.getMonth() + 1, 0) }) },
  { id: "next-month", label: "Next month", range: (t) => ({ start: new Date(t.getFullYear(), t.getMonth() + 1, 1), end: new Date(t.getFullYear(), t.getMonth() + 2, 0) }) },
  { id: "year", label: "Rest of the year", range: (t) => ({ start: t, end: new Date(t.getFullYear(), 11, 31) }) },
];

let instances = 0;

/**
 * When an automation runs: an event or a schedule, conditions, a plain-language summary and the next run times.
 * @tag tc-trigger-builder
 * @fires tc-value-change - The trigger changed ({ value: TriggerValue }); cancelable – prevent it to control `value`
 */
export class TcTriggerBuilder extends TcElement {
  static override ui = "tgb";
  static formAssociated = true;

  /** The trigger definition. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: TriggerValue = DEFAULT_VALUE;
  /** The events a trigger can listen for */
  @property({ attribute: false }) accessor events: TriggerEvent[] = [];
  /** What a schedule's conditions can test (none: schedules have no conditions) */
  @property({ attribute: false }) accessor scheduleFields: TriggerField[] = [];
  /** Names the group, shown at the top */
  @property() accessor heading = "Trigger";
  /** Counts the next runs from here (ms since epoch); unset: when the element connected */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** How many next runs to list */
  @property({ type: Number, attribute: "run-count" }) accessor runCount = 5;
  /** Shown under the card – unset: the browser's time zone */
  @property({ attribute: "time-zone" }) accessor timeZone = "";
  /** Submitted with the form: the definition as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the definition out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  @state() private accessor formDisabled = false;
  @state() private accessor connectedAt = 0;
  @state() private accessor announcement = "";

  private readonly internals: ElementInternals;
  private readonly uid = `tc-tgb${++instances}`;
  private initialValue: TriggerValue | null = null;
  private ownName = false;
  /** Set by the next render: a control to focus once it exists (a new condition's field) */
  private focusNext: string | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
    // A removed condition takes focus with it: it moves to the next row's remove button, else "Add condition"
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-tgb__add"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.connectedAt) this.connectedAt = wallClock();
    this.initialValue ??= this.value;
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  formResetCallback() {
    this.value = this.initialValue ?? DEFAULT_VALUE;
  }
  formDisabledCallback(disabled: boolean) {
    // Also called while `disabled` is reflected during an update, where a property change would be dropped – so after it
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  /** The time the next runs count from */
  private get nowMs() {
    return this.now ?? this.connectedAt;
  }
  private get schedule(): TriggerSchedule {
    return { ...DEFAULT_SCHEDULE, ...this.value.schedule };
  }
  private get event() {
    return this.value.kind === "event" ? this.events.find((e) => e.id === this.value.event) : undefined;
  }
  /** What the conditions can test now */
  private get fields(): TriggerField[] {
    return this.value.kind === "event" ? (this.event?.fields ?? []) : this.scheduleFields;
  }

  /** The upcoming runs of a schedule (empty for an event trigger) */
  get nextRuns(): number[] {
    return this.value.kind === "schedule" ? nextTriggerRuns(this.schedule, this.nowMs, this.runCount, this.value.active) : [];
  }
  /** The trigger in one sentence */
  get summary(): string {
    return describeTrigger(this.value, this.events, this.value.kind === "schedule" ? this.scheduleFields : undefined);
  }

  private commit(patch: Partial<TriggerValue>) {
    const next: TriggerValue = { ...this.value, ...patch };
    if (this.emit<TriggerValueChange>("tc-value-change", { value: next }, { cancelable: true })) this.value = next;
    else this.requestUpdate();
  }
  private setSchedule(patch: Partial<TriggerSchedule>) {
    this.commit({ schedule: { ...this.schedule, ...patch } });
  }
  private setCondition(i: number, patch: Partial<TriggerCondition>) {
    const conditions = this.value.conditions.map((c, k) => (k === i ? { ...c, ...patch } : c));
    this.commit({ conditions });
  }
  private addCondition() {
    const f = this.fields[0];
    if (!f) return;
    this.focusNext = `cond:${this.value.conditions.length}`;
    this.commit({ conditions: [...this.value.conditions, { field: f.id, operator: "is", value: f.type === "select" ? (f.options?.[0] ?? "") : "" }] });
  }
  private removeCondition(i: number) {
    // Rows are keyed by position: removing one that isn't last keeps its row (now the next condition), focus included.
    // Removing the last moves focus to the row above, else to "Add condition"
    const rows = [...this.querySelectorAll<HTMLElement>(".ui-tgb__cond")];
    if (i === rows.length - 1) rescueFocus(rows[i], [rows[i - 1]?.querySelector(".ui-tgb__remove"), this.querySelector(".ui-tgb__add")]);
    this.commit({ conditions: this.value.conditions.filter((_, k) => k !== i) });
  }

  /** Inner controls' own events stop here: the page hears this element's tc-value-change only */
  private stop = (e: Event) => e.stopPropagation();

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-disabled", this.isDisabled);
    this.dataset.kind = this.value.kind;
    if (changed.has("value") && changed.get("value") !== undefined) this.announcement = this.summary;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    this.syncForm();
    if (this.focusNext) {
      const row = this.querySelector<HTMLElement>(`[data-focus-key="${this.focusNext}"]`);
      this.focusNext = null;
      row?.focus();
    }
  }

  /** The form gets the definition as JSON; a trigger that can't run is invalid */
  private syncForm() {
    // Environments without form-associated custom elements (jsdom) skip it; every supported browser has it
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? JSON.stringify(this.value) : null);
    const v = this.value;
    if (!disabled && v.kind === "event" && !this.event) this.internals.setValidity({ valueMissing: true }, "Pick an event.", this.querySelector<HTMLElement>(".ui-tgb__event input") ?? undefined);
    else if (!disabled && v.kind === "schedule" && this.schedule.frequency === "weekly" && !this.schedule.days?.length)
      this.internals.setValidity({ valueMissing: true }, "Pick at least one day.", this.querySelector<HTMLElement>(".ui-tgb__day") ?? undefined);
    else this.internals.setValidity({});
  }

  /** A labelled row: the label on the left, the control on the right (stacked when narrow) */
  private row(id: string, label: string, control: unknown) {
    return html`<div class="ui-tgb__row"><span class="ui-tgb__label" id=${`${this.uid}-${id}`}>${label}</span><div class="ui-tgb__control">${control}</div></div>`;
  }

  private scheduleRows(look: Look) {
    const s = this.schedule;
    const disabled = this.isDisabled;
    const [hh, mm] = parseTime(s.time);
    const days = new Set(s.days ?? []);
    const freq = html`<tc-segmented-control
      look=${look}
      class="ui-tgb__seg"
      size="sm"
      aria-labelledby=${`${this.uid}-repeat`}
      .options=${FREQUENCIES as SegmentOption[]}
      .value=${s.frequency}
      ?disabled=${disabled}
      @tc-value-change=${(e: CustomEvent<{ value: string }>) => {
        e.stopPropagation();
        e.preventDefault();
        const frequency = e.detail.value as TriggerFrequency;
        this.setSchedule({ frequency, ...(frequency === "weekly" && !s.days?.length ? { days: [1] } : {}), ...(frequency === "monthly" && !s.dayOfMonth ? { dayOfMonth: 1 } : {}) });
      }}
    ></tc-segmented-control>`;
    const dayToggles = html`<div class="ui-tgb__days" role="group" aria-labelledby=${`${this.uid}-on`}>
      ${WEEK.map(
        (d) =>
          html`<button
            type="button"
            class="ui-tgb__day"
            aria-pressed=${days.has(d) ? "true" : "false"}
            data-day=${d}
            ?disabled=${disabled}
            @click=${() => this.setSchedule({ days: days.has(d) ? [...days].filter((x) => x !== d) : [...days, d].sort((a, b) => a - b) })}
          >${DAY_NAMES[d].slice(0, 3)}<span class="ui-tgb__sr">${DAY_NAMES[d].slice(3)}</span></button>`,
      )}
    </div>`;
    const timeInput = html`<input
      class="ui-tgb__input ui-tgb__time"
      type="time"
      aria-labelledby=${`${this.uid}-at`}
      .value=${live(`${pad(hh)}:${pad(mm)}`)}
      ?disabled=${disabled}
      @change=${(e: Event) => {
        const v = (e.target as HTMLInputElement).value;
        if (/^\d{2}:\d{2}/.test(v)) this.setSchedule({ time: v.slice(0, 5) });
        else this.requestUpdate();
      }}
    />`;
    const minuteInput = html`<span class="ui-tgb__inline">
      <input
        class="ui-tgb__input ui-tgb__num"
        type="number"
        min="0"
        max="59"
        inputmode="numeric"
        aria-labelledby=${`${this.uid}-at ${this.uid}-at-unit`}
        .value=${live(String(mm))}
        ?disabled=${disabled}
        @change=${(e: Event) => {
          const n = Number((e.target as HTMLInputElement).value);
          if (Number.isFinite(n)) this.setSchedule({ time: `${pad(hh)}:${pad(clamp(Math.round(n), 0, 59))}` });
          else this.requestUpdate();
        }}
      /><span class="ui-tgb__unit" id=${`${this.uid}-at-unit`}>minutes past the hour</span>
    </span>`;
    const dom = clamp(Math.round(s.dayOfMonth ?? 1), 1, 31);
    const domInput = html`<span class="ui-tgb__inline">
      <input
        class="ui-tgb__input ui-tgb__num"
        type="number"
        min="1"
        max="31"
        inputmode="numeric"
        aria-labelledby=${`${this.uid}-on ${this.uid}-on-unit`}
        .value=${live(String(dom))}
        ?disabled=${disabled}
        @change=${(e: Event) => {
          const n = Number((e.target as HTMLInputElement).value);
          if (Number.isFinite(n) && n > 0) this.setSchedule({ dayOfMonth: clamp(Math.round(n), 1, 31) });
          else this.requestUpdate();
        }}
      /><span class="ui-tgb__unit" id=${`${this.uid}-on-unit`}>day of the month</span>
    </span>`;

    const active = this.value.active;
    const start = active ? fromIso(active.start) : null;
    const end = active ? fromIso(active.end) : null;
    const today = dayOf(this.nowMs);
    const activeSeg = html`<tc-segmented-control
      look=${look}
      class="ui-tgb__seg"
      size="sm"
      aria-labelledby=${`${this.uid}-active`}
      .options=${[
        { value: "always", label: "Always" },
        { value: "between", label: "Between dates" },
      ] as SegmentOption[]}
      .value=${active ? "between" : "always"}
      ?disabled=${disabled}
      @tc-value-change=${(e: CustomEvent<{ value: string }>) => {
        e.stopPropagation();
        e.preventDefault();
        this.commit({ active: e.detail.value === "between" ? { start: isoDay(today), end: isoDay(addDays(today, 29)) } : null });
      }}
    ></tc-segmented-control>`;
    const picker =
      start && end
        ? html`<tc-date-range-picker
            class="ui-tgb__dates"
            look=${look}
            .value=${{ start, end }}
            .presets=${ACTIVE_PRESETS}
            .compare=${false}
            .today=${today}
            .min=${today}
            .max=${addDays(today, 5 * 366)}
            ?disabled=${disabled}
            @tc-open-change=${this.stop}
            @tc-compare-change=${this.stop}
            @tc-value-change=${(e: CustomEvent<DateRangeValueChange>) => {
              e.stopPropagation();
              e.preventDefault();
              this.commit({ active: { start: isoDay(e.detail.value.start), end: isoDay(e.detail.value.end) } });
            }}
          ></tc-date-range-picker>`
        : nothing;

    return html`
      ${this.row("repeat", "Repeats", freq)}
      ${s.frequency === "weekly" ? this.row("on", "On", dayToggles) : nothing}
      ${s.frequency === "monthly" ? this.row("on", "On the", domInput) : nothing}
      ${this.row("at", "At", s.frequency === "hourly" ? minuteInput : timeInput)}
      ${this.row("active", "Active", html`<div class="ui-tgb__active">${activeSeg}${picker}</div>`)}
    `;
  }

  private conditionRows(look: Look) {
    const fields = this.fields;
    if (!fields.length) return nothing;
    const disabled = this.isDisabled;
    const conds = this.value.conditions;
    const select = (label: string, value: string, options: { value: string; label: string }[], onChange: (v: string) => void, key?: string) =>
      html`<span class=${`ui-tgb__select ui-tgb__select--${label.split(" ").pop()}`}>
        <select class="ui-tgb__input" aria-label=${label} data-focus-key=${ifDefined(key)} ?disabled=${disabled} @change=${(e: Event) => onChange((e.target as HTMLSelectElement).value)}>
          ${options.map((o) => html`<option value=${o.value} ?selected=${o.value === value}>${o.label}</option>`)}
        </select>${chevronDown}
      </span>`;
    const rows = repeat(
      conds,
      (_, i) => i,
      (c, i) => {
        const f = fields.find((x) => x.id === c.field) ?? fields[0];
        const ops = operatorsFor(f.type);
        const n = i + 1;
        const valueControl =
          f.type === "select"
            ? select(`Condition ${n} value`, c.value, (f.options ?? []).map((o) => ({ value: o, label: o })), (v) => this.setCondition(i, { value: v }))
            : html`<input
                class="ui-tgb__input ui-tgb__value"
                type=${f.type === "number" ? "number" : "text"}
                inputmode=${ifDefined(f.type === "number" ? "decimal" : undefined)}
                placeholder=${f.type === "number" ? "0" : "Value"}
                aria-label=${`Condition ${n} value`}
                .value=${live(c.value)}
                ?disabled=${disabled}
                @change=${(e: Event) => this.setCondition(i, { value: (e.target as HTMLInputElement).value })}
              />`;
        return html`<li class="ui-tgb__cond">
          <span class="ui-tgb__cond-word" aria-hidden="true">${i === 0 ? "If" : this.value.match === "any" ? "or" : "and"}</span>
          ${select(
            `Condition ${n} field`,
            f.id,
            fields.map((x) => ({ value: x.id, label: x.label })),
            (v) => {
              const nf = fields.find((x) => x.id === v)!;
              const op = operatorsFor(nf.type).includes(c.operator) ? c.operator : "is";
              this.setCondition(i, { field: v, operator: op, value: nf.type === "select" ? (nf.options?.[0] ?? "") : nf.type === (f.type ?? "text") ? c.value : "" });
            },
            `cond:${i}`,
          )}
          ${select(
            `Condition ${n} test`,
            ops.includes(c.operator) ? c.operator : "is",
            ops.map((o) => ({ value: o, label: OPERATORS[o] })),
            (v) => this.setCondition(i, { operator: v as TriggerOperator }),
          )}
          ${valueControl}
          <button type="button" class="ui-tgb__remove" aria-label=${`Remove condition ${n}`} ?disabled=${disabled} @click=${() => this.removeCondition(i)}>${removeIcon}</button>
        </li>`;
      },
    );
    const match =
      conds.length > 1
        ? html`<div class="ui-tgb__match">
            <tc-segmented-control
      look=${look}
              class="ui-tgb__seg"
              size="sm"
              aria-label="Conditions that must hold"
              .options=${[
                { value: "all", label: "All" },
                { value: "any", label: "Any" },
              ] as SegmentOption[]}
              .value=${this.value.match}
              ?disabled=${disabled}
              @tc-value-change=${(e: CustomEvent<{ value: string }>) => {
                e.stopPropagation();
                e.preventDefault();
                this.commit({ match: e.detail.value as "all" | "any" });
              }}
            ></tc-segmented-control>
            <span class="ui-tgb__unit">of these are true</span>
          </div>`
        : nothing;
    return this.row(
      "if",
      "Only if",
      html`<div class="ui-tgb__conds">
        ${match}
        ${conds.length ? html`<ul class="ui-tgb__cond-list" aria-labelledby=${`${this.uid}-if`}>${rows}</ul>` : nothing}
        <button type="button" class="ui-tgb__add" ?disabled=${disabled} @click=${() => this.addCondition()}>${plusIcon}${conds.length ? "Add condition" : "Add a condition"}</button>
      </div>`,
    );
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const v = this.value;
    const disabled = this.isDisabled;
    const icons = getKindIcons();
    const kindSeg = html`<tc-segmented-control
      look=${look}
      class="ui-tgb__seg ui-tgb__kind"
      size="sm"
      aria-labelledby=${`${this.uid}-when`}
      .options=${[
        { value: "event", label: "An event happens", icon: icons.event },
        { value: "schedule", label: "On a schedule", icon: icons.schedule },
      ] as SegmentOption[]}
      .value=${v.kind}
      ?disabled=${disabled}
      @tc-value-change=${(e: CustomEvent<{ value: string }>) => {
        e.stopPropagation();
        e.preventDefault();
        const kind = e.detail.value as TriggerValue["kind"];
        // Conditions test the other kind's fields: they don't carry over
        this.commit({ kind, conditions: [], ...(kind === "schedule" ? { schedule: this.schedule } : {}) });
      }}
    ></tc-segmented-control>`;
    const eventOptions: ComboboxOption[] = this.events.map((e) => ({ value: e.id, label: e.label, hint: e.hint, group: e.group, icon: e.icon }));
    const eventPicker = html`<tc-combobox
      class="ui-tgb__event"
      look=${look}
      single
      placeholder="Search events…"
      aria-labelledby=${`${this.uid}-event`}
      .options=${eventOptions}
      .value=${live(v.event ? [v.event] : [])}
      ?disabled=${disabled}
      @tc-open-change=${this.stop}
      @tc-value-change=${(e: CustomEvent<ComboboxValueChange>) => {
        e.stopPropagation();
        e.preventDefault();
        const id = e.detail.value[0];
        const fields = this.events.find((x) => x.id === id)?.fields ?? [];
        // Conditions on fields the new event doesn't have are dropped
        this.commit({ event: id, conditions: v.conditions.filter((c) => fields.some((f) => f.id === c.field)) });
      }}
    ></tc-combobox>`;

    const runs = this.nextRuns;
    const todayStart = dayOf(this.nowMs).getTime();
    const relative = (t: number) => {
      const d = Math.round((dayOf(t).getTime() - todayStart) / 864e5);
      return d <= 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`;
    };
    const tz = this.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "your time zone";

    const body = html`
      <div class="ui-tgb__head">
        <span class="ui-tgb__title">${this.heading}</span>
      </div>
      <div class="ui-tgb__rows">
        ${this.row("when", "When", kindSeg)}
        ${v.kind === "event" ? this.row("event", "Event", eventPicker) : this.scheduleRows(look)}
        ${this.conditionRows(look)}
      </div>
      <div class="ui-tgb__summary">${summaryIcon(look)}<p class="ui-tgb__sentence">${this.summary}</p></div>
      ${v.kind === "schedule"
        ? html`<div class="ui-tgb__runs">
            <span class="ui-tgb__runs-title" id=${`${this.uid}-runs`}>Next runs</span>
            ${runs.length
              ? html`<ol class="ui-tgb__run-list" aria-labelledby=${`${this.uid}-runs`}>
                  ${runs.map(
                    (t, i) =>
                      html`<li class="ui-tgb__run" ?data-next=${i === 0}>
                        <span class="ui-tgb__run-day">${fmtRunDay.format(t)}</span>
                        <span class="ui-tgb__run-time">${fmtTime.format(t)}</span>
                        <span class="ui-tgb__run-rel">${relative(t)}</span>
                      </li>`,
                  )}
                </ol>`
              : html`<p class="ui-tgb__no-runs">${this.schedule.frequency === "weekly" && !this.schedule.days?.length ? "Pick a day to see when it runs." : "No runs in the active dates."}</p>`}
          </div>`
        : nothing}
    `;

    return html`
      <span class="ui-tgb__sr" role="status">${this.announcement}</span>
      ${clean ? body : html`<div class="ui-tgb__card">${body}</div>`}
      <div class="ui-tgb__foot">${v.kind === "schedule" ? `Times in ${tz}` : "Runs each time the event happens"}</div>
    `;
  }

  static override css = /* css */ `
[data-ui="tgb"] {
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  -webkit-font-smoothing: antialiased;
}
.ui-tgb__card, .ui-tgb__card *, [data-ui="tgb"] > *, :where([data-ui="tgb"]) [class^="ui-tgb__"] { box-sizing: border-box; }
/* Standard: a gray tray around a white card, the time zone in the tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tgb"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
.ui-tgb__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
/* Clean: one white card with hairline shadows (no overflow clip – the pickers' popovers leave the card) */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tgb"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-tgb__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.ui-tgb__day, .ui-tgb__remove, .ui-tgb__add { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-tgb__day:focus-visible, .ui-tgb__remove:focus-visible, .ui-tgb__add:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tgb__day:disabled, .ui-tgb__remove:disabled, .ui-tgb__add:disabled, .ui-tgb__input:disabled { cursor: not-allowed; opacity: 0.55; }

/* ---------- Header ---------- */
.ui-tgb__head { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-1); }
.ui-tgb__title { color: var(--tc-text-strong); font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-relaxed); }
:where([data-look="standard"], [data-look="standard"] *).ui-tgb__title { font-weight: var(--tc-font-weight-semibold); letter-spacing: -0.01em; }
:where([data-look="clean"], [data-look="clean"] *).ui-tgb__title { font-weight: var(--tc-font-weight-medium); }

/* ---------- Rows: a label column and the controls ---------- */
.ui-tgb__rows { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); }
.ui-tgb__row { display: grid; grid-template-columns: 76px minmax(0, 1fr); align-items: start; gap: var(--tc-space-3); }
.ui-tgb__label { display: flex; align-items: center; min-height: var(--tc-control-h-sm); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-tgb__label { color: var(--tc-text-muted); }
.ui-tgb__control { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: var(--tc-control-h-sm); }
.ui-tgb__event { flex: 1; min-width: 0; }
.ui-tgb__active { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-tgb__inline { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
.ui-tgb__unit { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

/* Fields: the field recipe at control height */
.ui-tgb__input {
  height: var(--tc-control-h-sm);
  min-width: 0;
  margin: 0;
  padding: 0 var(--tc-space-2-5);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
  font-variant-numeric: tabular-nums;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tgb__input:hover:not(:disabled) { box-shadow: var(--tc-field-shadow-hover); }
.ui-tgb__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-tgb__input::placeholder { color: var(--tc-text-placeholder); }
.ui-tgb__time { width: 120px; }
.ui-tgb__num { width: 64px; }
.ui-tgb__select { position: relative; display: inline-flex; flex: 0 1 auto; min-width: 0; }
.ui-tgb__select > select { width: 100%; padding-right: var(--tc-space-7); appearance: none; cursor: pointer; text-overflow: ellipsis; }
.ui-tgb__select-chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }

/* Day toggles: quiet pills, the picked ones filled */
.ui-tgb__days { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-tgb__day {
  min-width: 40px;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tgb__day:not(:disabled):hover { box-shadow: var(--tc-action-secondary-shadow-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-tgb__day[aria-pressed="true"] { background: var(--tc-surface-inverse); box-shadow: none; color: var(--tc-text-on-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-tgb__day[aria-pressed="true"] { background: var(--tc-accent); box-shadow: none; color: var(--tc-text-on-accent); }

/* ---------- Conditions (filter-menu's quiet rows) ---------- */
.ui-tgb__conds { display: grid; gap: var(--tc-space-2); width: 100%; min-width: 0; }
.ui-tgb__match { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-tgb__cond-list { display: grid; gap: var(--tc-space-1-5); margin: 0; padding: 0; list-style: none; }
.ui-tgb__cond {
  display: grid;
  /* Two lines – the field and the test, then the value – one line once there's room */
  grid-template-columns: 28px minmax(0, 1fr) minmax(0, 1fr) var(--tc-control-h-sm);
  grid-template-areas: "word field op remove" ". value value .";
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  animation: ui-tgb-in var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-tgb__cond-word { grid-area: word; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-tgb__select--field { grid-area: field; }
.ui-tgb__select--test { grid-area: op; }
.ui-tgb__cond > .ui-tgb__value, .ui-tgb__select--value { grid-area: value; }
.ui-tgb__cond > .ui-tgb__remove { grid-area: remove; }
.ui-tgb__cond .ui-tgb__select, .ui-tgb__cond .ui-tgb__value { width: 100%; }
.ui-tgb__remove {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tgb__remove svg, .ui-tgb__add svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-tgb__remove svg, :where([data-look="clean"], [data-look="clean"] *).ui-tgb__add svg { stroke-width: 1.3; }
.ui-tgb__remove:not(:disabled):hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
/* Add: the ghost button recipe */
.ui-tgb__add {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  margin-left: calc(-1 * var(--tc-control-px-sm));
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-action-ghost-fg);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tgb__add:not(:disabled):hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }

/* ---------- The sentence ---------- */
.ui-tgb__summary {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-2-5);
  margin: 0 var(--tc-space-4);
  padding: var(--tc-space-3) var(--tc-space-3-5);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-fill-subtle);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tgb__summary { border-radius: var(--tc-radius-md); background: var(--tc-accent-subtle); }
.ui-tgb__summary-icon { flex: none; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); fill: none; stroke: var(--tc-text-secondary); stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-tgb__summary-icon { stroke: var(--tc-accent-text); stroke-width: 1.3; }
.ui-tgb__sentence { margin: 0; min-width: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); overflow-wrap: anywhere; animation: ui-tgb-fade var(--tc-duration-moderate) var(--tc-ease-standard); }

/* ---------- Next runs ---------- */
.ui-tgb__runs { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-4); }
.ui-tgb__runs-title { color: var(--tc-text-muted); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); font-weight: var(--tc-font-weight-medium); letter-spacing: 0.5px; text-transform: uppercase; }
.ui-tgb__run-list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-tgb__run {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 88px;
  align-items: center;
  gap: var(--tc-space-3);
  min-height: 32px;
  border-top: var(--tc-hairline) solid var(--tc-divider);
  color: var(--tc-text-secondary);
  font-variant-numeric: tabular-nums;
}
.ui-tgb__run:first-child { border-top: 0; }
.ui-tgb__run[data-next] { color: var(--tc-text-strong); }
.ui-tgb__run[data-next] .ui-tgb__run-day { font-weight: var(--tc-font-weight-medium); }
.ui-tgb__run-time { text-align: right; }
.ui-tgb__run-rel { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: right; }
.ui-tgb__no-runs { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
[data-ui="tgb"][data-kind="event"] .ui-tgb__summary { margin-bottom: var(--tc-space-4); }

/* ---------- Foot: in the tray (Standard), the card's last row (Clean) ---------- */
.ui-tgb__foot { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-tgb__foot { padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-tgb__foot { padding: var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); }

@container (min-width: 540px) {
  .ui-tgb__cond { grid-template-columns: 28px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.1fr) var(--tc-control-h-sm); grid-template-areas: "word field op value remove"; }
}
@keyframes ui-tgb-in { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ui-tgb-fade { from { opacity: 0.4; } }
/* Narrow: labels above their controls */
@container (max-width: 420px) {
  .ui-tgb__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1); }
  .ui-tgb__label { min-height: 0; }
  .ui-tgb__head, .ui-tgb__rows, .ui-tgb__runs { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-tgb__summary { margin-left: var(--tc-space-3); margin-right: var(--tc-space-3); }
  .ui-tgb__run { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-tgb__run-rel { display: none; }
  .ui-tgb__day { min-width: 36px; }
  /* A condition on two lines: the field and the test, then the value */
  .ui-tgb__cond { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) var(--tc-control-h-sm); grid-template-areas: "field op remove" "value value ."; }
  .ui-tgb__cond + .ui-tgb__cond { padding-top: var(--tc-space-1-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
  .ui-tgb__cond-word { display: none; }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
  .ui-tgb__input, .ui-tgb__day, .ui-tgb__add { height: 40px; }
  .ui-tgb__remove { width: 40px; height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-tgb__cond, .ui-tgb__sentence { animation: none; }
  .ui-tgb__input, .ui-tgb__day, .ui-tgb__remove, .ui-tgb__add { transition: none; }
}
[data-ui="tgb"][data-disabled] .ui-tgb__sentence { color: var(--tc-text-muted); }
`;
}

if (!customElements.get("tc-trigger-builder")) customElements.define("tc-trigger-builder", TcTriggerBuilder);

declare global {
  interface HTMLElementTagNameMap {
    "tc-trigger-builder": TcTriggerBuilder;
  }
}
