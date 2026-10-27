import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";

/*
 * <tc-date-range-picker> – the Lit port of src/components/date-range-picker.tsx: pick a period from presets or two
 * calendars. Presets on the left ("Last 7 days", "This month" …), two months on the right: click a start, hover to
 * preview, click an end. Optionally compare with the previous period or the previous year – shown as a second band.
 * Arrow keys move day by day, PageUp/PageDown month by month, Enter picks, Esc closes. On narrow screens the presets
 * become a row of chips and one month is shown. Clean has no tray – a white one-line field opens one white popover.
 *
 *   <tc-date-range-picker name="period" .value=${{ start, end }}></tc-date-range-picker>
 *
 * `name` adds a hidden input with the applied range as "YYYY-MM-DD/YYYY-MM-DD", so the range submits with the form.
 * Unset, `value` is the last 30 days; `today` defaults to the real day, read when the element connects.
 */

export type DateRange = { start: Date; end: Date };
export type CompareMode = "off" | "previous" | "year";
export type RangePreset = {
  id: string;
  label: string;
  /** Builds the range from today */
  range: (today: Date) => DateRange;
};
export type DateRangeValueChange = { value: DateRange; compare: DateRange | null; mode: CompareMode };

/* ---------- Dates (local days, no library) ---------- */

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const same = (a?: Date | null, b?: Date | null) => !!a && !!b && a.getTime() === b.getTime();
const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
/** Days from a to b, counting both */
const span = (a: Date, b: Date) => Math.round((utc(b) - utc(a)) / 864e5) + 1;
const clamp = (d: Date, min?: Date, max?: Date) => (min && d < min ? min : max && d > max ? max : d);
const order = (a: Date, b: Date): DateRange => (a <= b ? { start: a, end: b } : { start: b, end: a });
/** The same day n months later, clamped to that month's length: Mar 31 − 1 → Feb 28, Feb 29 − 12 → Feb 28 */
const shiftMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), endOfMonth(addMonths(d, n)).getDate()));
/** Drops the time of day, so a range built from the current time matches calendar days and presets */
const dayRange = (r: DateRange): DateRange => ({ start: day(r.start), end: day(r.end) });
const sameRange = (a: DateRange | null, b: DateRange | null) => !!a && !!b && same(a.start, b.start) && same(a.end, b.end);
/** "2026-10-08" in local time – the form value */
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fmtDayYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const fmtLong = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const fmtWeekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });

/** "Sep 9 – Oct 8, 2026", "Dec 20, 2025 – Jan 5, 2026", "Oct 8, 2026" */
export function formatDateRange({ start, end }: DateRange) {
  if (same(start, end)) return fmtDayYear.format(start);
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${(sameYear ? fmtDay : fmtDayYear).format(start)} – ${fmtDayYear.format(end)}`;
}

/** The comparison range for a mode: the period before, or the same days a year back */
export function compareDateRange(range: DateRange, mode: CompareMode): DateRange | null {
  if (mode === "previous") {
    const length = span(range.start, range.end);
    return { start: addDays(range.start, -length), end: addDays(range.start, -1) };
  }
  if (mode === "year") {
    const back = (d: Date) => shiftMonths(d, -12);
    return { start: back(range.start), end: back(range.end) };
  }
  return null;
}

const quarterStart = (d: Date) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);

export const defaultRangePresets: RangePreset[] = [
  { id: "today", label: "Today", range: (t) => ({ start: t, end: t }) },
  { id: "yesterday", label: "Yesterday", range: (t) => ({ start: addDays(t, -1), end: addDays(t, -1) }) },
  { id: "7d", label: "Last 7 days", range: (t) => ({ start: addDays(t, -6), end: t }) },
  { id: "30d", label: "Last 30 days", range: (t) => ({ start: addDays(t, -29), end: t }) },
  { id: "90d", label: "Last 90 days", range: (t) => ({ start: addDays(t, -89), end: t }) },
  { id: "month", label: "This month", range: (t) => ({ start: startOfMonth(t), end: t }) },
  { id: "last-month", label: "Last month", range: (t) => ({ start: addMonths(t, -1), end: endOfMonth(addMonths(t, -1)) }) },
  { id: "quarter", label: "This quarter", range: (t) => ({ start: quarterStart(t), end: t }) },
  { id: "ytd", label: "Year to date", range: (t) => ({ start: new Date(t.getFullYear(), 0, 1), end: t }) },
];

const COMPARE: { id: CompareMode; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "previous", label: "Previous period" },
  { id: "year", label: "Previous year" },
];

/* ---------- Icons ---------- */

const glyph = (d: string, extra = "") => html`<svg viewBox="0 0 24 24" class=${extra ? `ui-drp__glyph ${extra}` : "ui-drp__glyph"} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const icons = {
  calendar: "M7 3v3M17 3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  chevron: "M8 10l4 4 4-4",
  left: "M14.5 6l-6 6 6 6",
  right: "M9.5 6l6 6-6 6",
};

/** Moves a pill under the active child of a list – no transition on the first placement, so it doesn't fly in */
function glidePill(list: HTMLElement | null, pill: HTMLElement | null, selector: string) {
  if (!list || !pill) return;
  const active = list.querySelector<HTMLElement>(selector);
  if (!active || !active.offsetWidth) {
    pill.style.opacity = "0";
    return;
  }
  const first = !pill.dataset.ready;
  if (first) pill.style.transition = "none";
  pill.style.opacity = "1";
  pill.style.width = `${active.offsetWidth}px`;
  pill.style.height = `${active.offsetHeight}px`;
  pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
  if (first) {
    pill.dataset.ready = "1";
    void pill.offsetWidth;
    pill.style.transition = "";
  }
}

/* ---------- Month grid ---------- */

type Cell = { date: Date; time: number; label: string; rowStart: boolean; rowEnd: boolean };
type MonthData = { time: number; name: string; weeks: (Cell | null)[][] };

function weeks(month: Date, weekStartsOn: number) {
  const first = startOfMonth(month);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const days = endOfMonth(month).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7) cells.push(null);
  const out: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
  return out;
}

function monthData(month: Date, weekStartsOn: number): MonthData {
  const last = endOfMonth(month).getDate();
  return {
    time: month.getTime(),
    name: fmtMonth.format(month),
    weeks: weeks(month, weekStartsOn).map((week) =>
      week.map((d, di) => d && { date: d, time: d.getTime(), label: fmtLong.format(d), rowStart: di === 0 || d.getDate() === 1, rowEnd: di === 6 || d.getDate() === last }),
    ),
  };
}

const weekdayNames = (weekStartsOn: number) => Array.from({ length: 7 }, (_, i) => fmtWeekday.format(new Date(2026, 0, 4 + weekStartsOn + i)).slice(0, 2));
const inRange = (d: Date, r: DateRange | null) => !!r && d >= r.start && d <= r.end;

/** The day a key moves the focus to: arrows by day and week, PageUp/PageDown by month, Home/End to the week's ends */
function keyTarget(key: string, focus: Date, weekStartsOn: number): Date | null {
  const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (key in moves) return addDays(focus, moves[key]);
  if (key === "PageUp") return shiftMonths(focus, -1);
  if (key === "PageDown") return shiftMonths(focus, 1);
  if (key === "Home") return addDays(focus, -((focus.getDay() - weekStartsOn + 7) % 7));
  if (key === "End") return addDays(focus, 6 - ((focus.getDay() - weekStartsOn + 7) % 7));
  return null;
}

let uidSeq = 0;

/**
 * Pick a date range from presets or two calendars, optionally compared with the period before or a year back.
 * @tag tc-date-range-picker
 * @fires tc-value-change - Apply; detail `{ value, compare, mode }` – the range, the comparison range (or null) and the compare mode. Cancelable: preventDefault() keeps `value` as it is (controlled use)
 * @fires tc-compare-change - Apply with another compare mode; detail `{ mode }`. Cancelable: preventDefault() keeps `compareMode` as it is
 * @fires tc-open-change - The panel opens or closes; detail `{ open: boolean }`. Cancelable: preventDefault() keeps `open` as it is
 */
export class TcDateRangePicker extends TcElement {
  static override ui = "drp";

  /** The applied range; unset, the last 30 days */
  @property({ attribute: false }) accessor value: DateRange | undefined = undefined;
  /** The quick picks on the left, each building its range from today – defaults to Today through Year to date */
  @property({ attribute: false }) accessor presets: RangePreset[] = defaultRangePresets;
  /** Show the "Compare to" control */
  @property({ attribute: false }) accessor compare = true;
  /** The applied comparison */
  @property({ attribute: "compare-mode" }) accessor compareMode: CompareMode = "previous";
  /** Whether the panel is open */
  @property({ type: Boolean }) accessor open = false;
  /** Name for native form submission: a hidden input with the applied range as "YYYY-MM-DD/YYYY-MM-DD" */
  @property() accessor name = "";
  /** The trigger can't be used and the hidden input is left out of the form */
  @property({ type: Boolean }) accessor disabled = false;
  /** 0 = Sunday, 1 = Monday */
  @property({ type: Number, attribute: "week-starts-on" }) accessor weekStartsOn: 0 | 1 = 1;
  /** Days after this can't be picked – defaults to today */
  @property({ attribute: false }) accessor max: Date | undefined = undefined;
  /** Days before this can't be picked – unset, there is no lower limit */
  @property({ attribute: false }) accessor min: Date | undefined = undefined;
  /** "Today" for the presets – defaults to the real day, read when the element connects */
  @property({ attribute: false }) accessor today: Date | undefined = undefined;

  /** @internal The draft while the panel is open: end is null between the first and second click */
  @state() accessor draft: { start: Date; end: Date | null } = { start: new Date(2000, 0, 1), end: new Date(2000, 0, 1) };
  /** @internal */
  @state() accessor hover: Date | null = null;
  /** @internal The draft's compare mode */
  @state() accessor mode: CompareMode = "previous";
  /** @internal The left month */
  @state() accessor month = new Date(2000, 0, 1);
  /** @internal */
  @state() accessor slideDir: 1 | -1 = 1;
  /** @internal The day with the tab stop */
  @state() accessor focusDay = new Date(2000, 0, 1);

  private uid = `tc-drp-${++uidSeq}`;
  private clock = day(new Date(2000, 0, 1));
  private keyboard = false;
  private focusIn = false;
  private opening = false;
  private lastCompare: DateRange | null = null;
  private scrolled = false;
  private observers = new Map<string, { ro: ResizeObserver; el: Element }>();
  private glideKeys = { presets: "", segments: "" };

  override connectedCallback() {
    super.connectedCallback();
    // Today: read when the element connects – never while rendering
    this.clock = day(new Date());
    document.addEventListener("pointerdown", this.onDocDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.onDocDown);
    for (const { ro } of this.observers.values()) ro.disconnect();
    this.observers.clear();
  }

  /* ---------- Derived ---------- */

  private get todayDay() {
    return this.today ? day(this.today) : this.clock;
  }
  private get maxDay() {
    return this.max ? day(this.max) : this.todayDay;
  }
  private get minDay() {
    return this.min ? day(this.min) : undefined;
  }
  private get applied(): DateRange {
    const t = this.todayDay;
    return this.value ? dayRange(this.value) : { start: addDays(t, -29), end: t };
  }
  private get appliedMode(): CompareMode {
    return this.compare ? this.compareMode : "off";
  }
  private get isOpen() {
    return this.open && !this.disabled;
  }

  private resetDraft() {
    const applied = this.applied;
    this.draft = applied;
    this.mode = this.appliedMode;
    this.month = addMonths(applied.end, -1);
    this.focusDay = applied.end;
    this.hover = null;
  }

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit("tc-open-change", { open: next }, { cancelable: true })) {
      this.opening = true;
      this.open = next;
    }
  }

  private openPanel() {
    this.resetDraft();
    this.focusIn = true;
    this.setOpen(true);
  }

  private close(restoreFocus = true) {
    this.setOpen(false);
    if (restoreFocus) this.querySelector<HTMLButtonElement>(".ui-drp__trigger")?.focus();
  }

  private onDocDown = (e: PointerEvent) => {
    if (this.isOpen && !this.contains(e.target as Node)) this.setOpen(false);
  };

  /* ---------- Actions ---------- */

  private pick(d: Date) {
    this.draft = this.draft.end ? { start: d, end: null } : order(this.draft.start, d);
    this.hover = null;
    this.focusDay = d;
  }

  private choosePreset(p: RangePreset) {
    const r = p.range(this.todayDay);
    const next = { start: clamp(day(r.start), this.minDay, this.maxDay), end: clamp(day(r.end), this.minDay, this.maxDay) };
    this.draft = next;
    this.hover = null;
    this.focusDay = next.end;
    const left = addMonths(next.end, -1);
    if (left.getTime() !== this.month.getTime()) {
      this.slideDir = left > this.month ? 1 : -1;
      this.month = left;
    }
  }

  private shift(n: number) {
    this.slideDir = n > 0 ? 1 : -1;
    this.month = addMonths(this.month, n);
  }

  private apply() {
    const draft = this.draft;
    const r = draft.end ? order(draft.start, draft.end) : { start: draft.start, end: draft.start };
    const mode = this.mode;
    if (this.compare && mode !== this.compareMode && this.emit("tc-compare-change", { mode }, { cancelable: true })) this.compareMode = mode;
    if (this.emit<DateRangeValueChange>("tc-value-change", { value: r, compare: this.compare ? compareDateRange(r, mode) : null, mode }, { cancelable: true })) this.value = r;
    this.close();
  }

  private onGridKey(e: KeyboardEvent) {
    let next = keyTarget(e.key, this.focusDay, this.weekStartsOn);
    if (!next) return;
    e.preventDefault();
    this.keyboard = true;
    next = clamp(next, this.minDay, this.maxDay);
    this.focusDay = next;
    if (!this.draft.end) this.hover = next;
    // Keep the focused day on screen – narrow panels show only the second month
    const firstShown = this.querySelector<HTMLElement>(".ui-drp__months .ui-drp__month:not([data-second])");
    const left = firstShown && getComputedStyle(firstShown).display === "none" ? addMonths(this.month, 1) : this.month;
    const right = endOfMonth(addMonths(this.month, 1));
    if (next < left) this.shift(-1);
    else if (next > right) this.shift(1);
  }

  private onRadioKey(e: KeyboardEvent) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const at = COMPARE.findIndex((c) => c.id === this.mode);
    const next = COMPARE[(at + step + COMPARE.length) % COMPARE.length];
    this.mode = next.id;
    (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-mode="${next.id}"]`)?.focus();
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The first draft, and a panel opened from outside (the `open` property) starts from the applied range
    if (!this.hasUpdated) this.resetDraft();
    else if (changed.has("open") && this.open && !this.opening) this.resetDraft();
    this.opening = false;
    this.toggleAttribute("data-open", this.isOpen);
    this.toggleAttribute("data-disabled", this.disabled);
  }

  /** Keeps `box` as tall (or as wide) as `inner` plus `pad`, following it with a ResizeObserver */
  private fit(key: string, box: HTMLElement | null, inner: HTMLElement | null, side: "height" | "width", pad: number) {
    const was = this.observers.get(key);
    if (was && was.el === inner && inner?.isConnected) return;
    was?.ro.disconnect();
    this.observers.delete(key);
    if (!box || !inner) return;
    const set = () => (box.style[side] = `${(side === "height" ? inner.offsetHeight : inner.offsetWidth) + pad}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(inner);
    this.observers.set(key, { ro, el: inner });
  }

  /** Standard: the gray highlight glides to the active option – when it changes and when the list resizes */
  private glide(key: "presets" | "segments", listSel: string, selector: string, active: string) {
    const list = this.querySelector<HTMLElement>(listSel);
    const pill = list?.querySelector<HTMLElement>(":scope > .ui-drp__pill") ?? null;
    const was = this.observers.get(key);
    if (!list || !pill) {
      was?.ro.disconnect();
      this.observers.delete(key);
      return;
    }
    if (!was || was.el !== list) {
      was?.ro.disconnect();
      const ro = new ResizeObserver(() => glidePill(list, pill, selector));
      ro.observe(list);
      this.observers.set(key, { ro, el: list });
      glidePill(list, pill, selector);
    } else if (this.glideKeys[key] !== active) glidePill(list, pill, selector);
    this.glideKeys[key] = active;
  }

  protected override updated(changed: PropertyValues<this>) {
    const open = this.isOpen;
    const clean = this.resolvedLook === "clean";
    const dayButton = () => this.querySelector<HTMLButtonElement>(`.ui-drp__months [data-day="${this.focusDay.getTime()}"]`);
    // Opened from the trigger: focus moves into the dialog, onto the focused day
    if (open && this.focusIn) {
      this.focusIn = false;
      dayButton()?.focus();
    }
    // Keyboard focus follows the focused day
    if (open && this.keyboard && (changed.has("focusDay") || changed.has("month"))) dayButton()?.focus();
    if (!open) this.keyboard = false;

    const preset = this.activePreset();
    this.glide("presets", ".ui-drp__presets", '[aria-pressed="true"], [data-active]', `${open}-${clean}-${preset?.id}`);
    this.glide("segments", ".ui-drp__segments", '[aria-checked="true"]', `${open}-${clean}-${this.mode}`);

    // Phones: the row of preset chips scrolls the active one into view (at once when opening, smoothly afterwards)
    if (!open) this.scrolled = false;
    else {
      const list = this.querySelector<HTMLElement>(".ui-drp__presets");
      const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (list && active && list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: Math.max(0, active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2), behavior: this.scrolled ? "smooth" : "auto" });
        this.scrolled = true;
      }
    }

    // The panel glides to its new height; Clean clips only the calendars. The trigger glides to its text's width
    const panelBox = this.querySelector<HTMLElement>(clean ? ".ui-drp__clip" : ".ui-drp__panel");
    const panelInner = this.querySelector<HTMLElement>(clean ? ".ui-drp__body" : ".ui-drp__panel-inner");
    this.fit("panel", open ? panelBox : null, open ? panelInner : null, "height", clean ? 0 : 8);
    this.fit("trigger", this.querySelector(".ui-drp__trigger"), this.querySelector(".ui-drp__trigger-inner"), "width", clean ? 16 : 20);
    if (changed.has("look") || changed.has("contextLook")) {
      // The pad differs per look: measure again
      this.observers.get("trigger")?.ro.disconnect();
      this.observers.delete("trigger");
      this.fit("trigger", this.querySelector(".ui-drp__trigger"), this.querySelector(".ui-drp__trigger-inner"), "width", clean ? 16 : 20);
    }
  }

  private range(): DateRange | null {
    const { draft, hover } = this;
    return draft.end ? order(draft.start, draft.end) : hover ? order(draft.start, hover) : null;
  }

  private activePreset() {
    const draft = this.draft;
    if (!draft.end) return undefined;
    const shown = this.range() ?? { start: draft.start, end: draft.start };
    const today = this.todayDay;
    return this.presets.find((p) => {
      const r = p.range(today);
      return same(day(r.start), shown.start) && same(day(r.end), shown.end);
    });
  }

  /* ---------- Render ---------- */

  private renderMonths(range: DateRange | null, shown: DateRange, cmp: DateRange | null) {
    const month = this.month;
    const weekdays = weekdayNames(this.weekStartsOn);
    const months = [monthData(month, this.weekStartsOn), monthData(addMonths(month, 1), this.weekStartsOn)];
    const rows = Math.max(...months.map((m) => m.weeks.length));
    const previewing = !this.draft.end;
    const today = this.todayDay;
    const { minDay, maxDay } = this;
    return keyed(
      month.getTime(),
      html`<div
        class="ui-drp__months"
        data-dir=${this.slideDir}
        @keydown=${(e: KeyboardEvent) => this.onGridKey(e)}
        @pointerleave=${() => !this.draft.end && (this.hover = null)}
        @pointerdown=${() => (this.keyboard = false)}
      >
        ${months.map(
          (m, mi) => html`<div class="ui-drp__month" ?data-second=${mi === 1}>
            <div class="ui-drp__month-name" aria-hidden="true">${m.name}</div>
            <div role="grid" aria-label=${m.name} class="ui-drp__grid">
              <div role="row" class="ui-drp__weekdays">${weekdays.map((w) => html`<span role="columnheader" class="ui-drp__weekday">${w}</span>`)}</div>
              ${Array.from({ length: rows }, (_, ri) => m.weeks[ri] ?? Array<null>(7).fill(null)).map(
                (week) => html`<div role="row" class="ui-drp__week">
                  ${week.map((c) => {
                    if (!c) return html`<span class="ui-drp__day ui-drp__day-empty" role="gridcell"></span>`;
                    const d = c.date;
                    const isStart = same(d, shown.start);
                    const isEnd = same(d, shown.end);
                    const inMain = inRange(d, range);
                    const inCmp = !inMain && inRange(d, cmp);
                    const off = d > maxDay || (!!minDay && d < minDay);
                    return html`<span
                      role="gridcell"
                      aria-selected=${ifDefined(inMain || isStart ? "true" : undefined)}
                      class="ui-drp__day"
                      ?data-range=${inMain}
                      ?data-start=${isStart}
                      ?data-end=${isEnd}
                      ?data-preview=${previewing && inMain}
                      ?data-compare=${inCmp}
                      ?data-compare-start=${!!cmp && same(d, cmp.start)}
                      ?data-compare-end=${!!cmp && same(d, cmp.end)}
                      ?data-row-start=${c.rowStart}
                      ?data-row-end=${c.rowEnd}
                      ><button
                        type="button"
                        data-day=${c.time}
                        tabindex=${same(d, this.focusDay) ? 0 : -1}
                        ?disabled=${off}
                        aria-label=${c.label}
                        aria-current=${ifDefined(same(d, today) ? "date" : undefined)}
                        @click=${() => this.pick(d)}
                        @pointerenter=${() => previewing && (this.hover = d)}
                        @focus=${() => (this.focusDay = d)}
                      >${d.getDate()}</button></span
                    >`;
                  })}
                </div>`,
              )}
            </div>
          </div>`,
        )}
      </div>`,
    );
  }

  private renderFoot(shown: DateRange, cmp: DateRange | null, clean: boolean) {
    const draft = this.draft;
    const length = span(shown.start, shown.end);
    const mode = this.mode;
    // The compare line keeps its last text while it folds away
    if (cmp && !sameRange(cmp, this.lastCompare)) this.lastCompare = cmp;
    const last = this.lastCompare;
    const shownText = draft.end || this.hover ? formatDateRange(shown) : `${fmtDayYear.format(draft.start)} – pick an end`;
    return html`<div class="ui-drp__foot">
      <span class="ui-drp__sr" role="status">${draft.end
        ? `${formatDateRange(order(draft.start, draft.end))}, ${span(draft.start, draft.end)} ${span(draft.start, draft.end) === 1 ? "day" : "days"}`
        : `Start ${fmtDayYear.format(draft.start)} – pick an end`}</span>
      <div class="ui-drp__summary">
        <div class="ui-drp__summary-range">
          ${keyed(`${shown.start.getTime()}-${shown.end.getTime()}`, html`<span>${shownText}</span>`)}
          ${keyed(length, html`<span class="ui-drp__count">${length} ${length === 1 ? "day" : "days"}</span>`)}
        </div>
        ${this.compare
          ? html`<div class="ui-drp__compare">
              <span class="ui-drp__compare-label">Compare</span>
              <div class="ui-drp__segments" role="radiogroup" aria-label="Compare to" @keydown=${(e: KeyboardEvent) => this.onRadioKey(e)}>
                ${!clean ? html`<span class="ui-drp__pill" aria-hidden="true"></span>` : nothing}
                ${COMPARE.map(
                  (c) => html`<button
                    type="button"
                    role="radio"
                    aria-checked=${mode === c.id ? "true" : "false"}
                    tabindex=${mode === c.id ? 0 : -1}
                    data-mode=${c.id}
                    class="ui-drp__segment"
                    @click=${() => (this.mode = c.id)}
                  >${c.label}</button>`,
                )}
              </div>
            </div>
            <div class="ui-drp__fold" ?data-open=${!!cmp}>
              <div>${last ? keyed(`${last.start.getTime()}-${last.end.getTime()}`, html`<div class="ui-drp__compare-range">vs. ${formatDateRange(last)}</div>`) : nothing}</div>
            </div>`
          : nothing}
      </div>
      <div class="ui-drp__buttons">
        <button type="button" class="ui-drp__btn" @click=${() => this.close()}>Cancel</button>
        <button type="button" class="ui-drp__btn ui-drp__btn-primary" ?disabled=${!draft.end} @click=${() => this.apply()}>Apply</button>
      </div>
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const open = this.isOpen;
    const applied = this.applied;
    const appliedMode = this.appliedMode;
    const draft = this.draft;
    const range = this.range();
    const shown = range ?? { start: draft.start, end: draft.start };
    const cmp = this.compare && range ? compareDateRange(range, this.mode) : null;
    const preset = this.activePreset();
    const panelId = `${this.uid}-panel`;
    const appliedText = formatDateRange(applied);

    const body = html`<div class="ui-drp__body">
      <div class="ui-drp__presets" role="group" aria-label="Presets">
        ${!clean ? html`<span class="ui-drp__pill" aria-hidden="true"></span>` : nothing}
        ${this.presets.map(
          (p) => html`<button type="button" aria-pressed=${preset?.id === p.id ? "true" : "false"} class="ui-drp__preset" @click=${() => this.choosePreset(p)}>${p.label}</button>`,
        )}
        <span class="ui-drp__preset ui-drp__preset-custom" aria-hidden=${preset ? "true" : "false"} ?data-active=${!preset}>Custom</span>
      </div>
      <div class="ui-drp__cal">
        <div class="ui-drp__nav">
          <button type="button" class="ui-drp__icon-btn" aria-label="Previous month" @click=${() => this.shift(-1)}>${glyph(icons.left)}</button>
          <button type="button" class="ui-drp__icon-btn" aria-label="Next month" @click=${() => this.shift(1)}>${glyph(icons.right)}</button>
        </div>
        <span class="ui-drp__sr" role="status">${open ? `${fmtMonth.format(this.month)} – ${fmtMonth.format(addMonths(this.month, 1))}` : ""}</span>
        ${this.renderMonths(range, shown, cmp)}
      </div>
    </div>`;
    const foot = this.renderFoot(shown, cmp, clean);

    return html`
      <button
        type="button"
        class="ui-drp__trigger"
        aria-haspopup="dialog"
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${panelId}
        ?disabled=${this.disabled}
        @click=${() => (this.isOpen ? this.close() : this.openPanel())}
      >
        <span class="ui-drp__trigger-inner">
          ${glyph(icons.calendar)}
          ${keyed(
            `${appliedText}-${appliedMode}`,
            html`<span class="ui-drp__trigger-text"
              ><span class="ui-drp__trigger-range">${appliedText}</span>${appliedMode !== "off"
                ? html`<span class="ui-drp__trigger-compare">vs. ${formatDateRange(compareDateRange(applied, appliedMode)!)}</span>`
                : nothing}</span
            >`,
          )}
          ${glyph(icons.chevron, "ui-drp__chevron")}
        </span>
      </button>
      ${this.name ? html`<input type="hidden" name=${this.name} .value=${`${isoDay(applied.start)}/${isoDay(applied.end)}`} ?disabled=${this.disabled} />` : nothing}
      ${open
        ? html`<div
            id=${panelId}
            role="dialog"
            aria-label="Choose a date range"
            class="ui-drp__panel"
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                this.close();
              }
            }}
          >
            ${clean ? html`<div class="ui-drp__clip">${body}</div>${foot}` : html`<div class="ui-drp__panel-inner">${body}${foot}</div>`}
          </div>`
        : nothing}
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="drp"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="drp"] {
  /* The picked range: at least 3:1 against the calendar (WCAG 1.4.11), with the day numbers still at 4.5:1 */
  --tc-date-range-picker-band: light-dark(#658fff, #4a63a4);
  --tc-date-range-picker-compare-bg: light-dark(#ececee, #26262a);
  --tc-date-range-picker-compare-border: light-dark(#b9b9be, #4a4a50);
  position: relative;
  display: inline-block;
  max-width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: 1.4;
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="drp"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="drp"] {
  /* The comparison period: a grey band with hairline ends – the accent is for the range itself */
  --tc-date-range-picker-compare-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.1));
  /* The picked range: at least 3:1 against the calendar (WCAG 1.4.11), with the day numbers still at 4.5:1 */
  --tc-date-range-picker-band: light-dark(#5796ec, #3364bf);
  --tc-date-range-picker-compare-border: light-dark(rgba(0, 0, 0, 0.32), rgba(255, 255, 255, 0.36));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  display: inline-block;
  max-width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="drp"] *, [data-ui="drp"] *::before, [data-ui="drp"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *):where([data-ui="drp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="drp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="drp"]) svg { display: block; flex: none; }
[data-ui="drp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
/* The trigger */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  max-width: 100%;
  min-height: var(--tc-field-h);
  padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1) var(--tc-space-3);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  text-align: left;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger-inner { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2-5); max-width: calc(100vw - 56px); }
.ui-drp__trigger:hover { box-shadow: var(--tc-field-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger > .ui-drp__glyph { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger-text { display: grid; min-width: 0; animation: ui-drp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger-range { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger-compare { overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__chevron { color: var(--tc-text-muted); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-drp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* 16px icons with thin ~1.1px lines */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
/* The trigger: a white one-line field with the hairline shadow; its width glides to the new text */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  max-width: 100%;
  height: var(--tc-field-h);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  text-align: left;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), width var(--tc-duration-slow) var(--tc-ease-move);
}
.ui-drp__trigger:disabled { opacity: 0.55; cursor: not-allowed; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger-inner { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); max-width: calc(100vw - 56px); color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger-text { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; white-space: nowrap; animation: ui-drp-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger-range { flex: 0 0 auto; max-width: 100%; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; }
/* The comparison stays on the same line and gives way first when space runs out */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger-compare { flex: 0 1 auto; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__chevron { transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
[data-ui="drp"][data-open] .ui-drp__chevron { transform: rotate(180deg); }
/* The panel: a gray tray around a white card, like the other Trenchcoat menus */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__panel {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + 8px);
  left: 0;
  container-type: inline-size;
  /* A fixed width (not max-content), so the container queries below can measure it; override --tc-date-range-picker-panel-width to fit your layout */
  width: var(--tc-date-range-picker-panel-width, min(652px, calc(100vw - 32px)));
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  box-shadow: var(--tc-shadow-overlay);
  overflow: hidden;
  transform-origin: top left;
  transition: height var(--tc-duration-slow) var(--tc-ease-move);
  animation: ui-drp-open var(--tc-duration-moderate) var(--tc-ease-move) both;
}
/* The pill behind the active preset and compare option */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__pill {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  border-radius: var(--tc-radius-md);
  background: var(--tc-fill-default);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move), width var(--tc-duration-slow) var(--tc-ease-move), height var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-drp__body {
  display: grid;
  grid-template-columns: 136px 1fr;
  border-radius: var(--tc-radius-2xl);
  background: var(--tc-surface-raised);
  box-shadow: 0 0 0 1px var(--tc-border-default);
}
/* Presets */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__presets { position: relative; display: flex; flex-direction: column; gap: 1px; padding: var(--tc-space-1-5); border-right: 1px solid var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 var(--tc-space-2-5);
  border-radius: var(--tc-radius-md);
  text-align: left;
  white-space: nowrap;
  color: var(--tc-text-secondary);
  position: relative;
  z-index: 1;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard);
}
button:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset:hover:not([aria-pressed="true"]) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset[aria-pressed="true"],
:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset-custom[data-active] { color: var(--tc-text-primary); }
/* The panel: one white popover; the calendars glide to their height, the last row sits below them */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__panel {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + 6px);
  left: 0;
  container-type: inline-size;
  /* A fixed width (not max-content), so the container queries below can measure it; override --tc-date-range-picker-panel-width to fit your layout */
  width: var(--tc-date-range-picker-panel-width, min(652px, calc(100vw - 32px)));
  overflow: hidden;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-overlay);
  transform-origin: top left;
  animation: ui-drp-open var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-drp__clip { overflow: hidden; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__body { display: grid; grid-template-columns: 140px 1fr; }
/* Presets: tab-style rows – gray text, the active one gets the gray fill (no gliding highlight) */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__presets { position: relative; display: flex; flex-direction: column; gap: var(--tc-space-0-5); padding: var(--tc-space-1); border-right: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset {
  display: flex;
  align-items: center;
  flex: none;
  height: 28px;
  padding: 0 var(--tc-space-2-5);
  border-radius: var(--tc-radius-sm);
  text-align: left;
  white-space: nowrap;
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-quick) var(--tc-ease-standard), color var(--tc-duration-quick) var(--tc-ease-standard);
}
button:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset:hover:not([aria-pressed="true"]) { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset[aria-pressed="true"],
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset-custom[data-active] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-drp__preset-custom { margin-top: auto; color: var(--tc-text-muted); cursor: default; }
/* Chosen preset / compare option: a ring in the selected colour (>= 3:1), on the gliding pill in Standard */
.ui-drp__pill { box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset[aria-pressed="true"], :where([data-look="clean"], [data-look="clean"] *).ui-drp__segment[aria-checked="true"] { box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
/* Calendars */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__cal { position: relative; padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-2-5); overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__nav { position: absolute; top: 8px; left: 10px; right: 10px; z-index: 1; display: flex; justify-content: space-between; pointer-events: none; }
/* Calendars */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__cal { position: relative; padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2-5); overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__nav { position: absolute; top: 10px; left: 12px; right: 12px; z-index: 1; display: flex; justify-content: space-between; pointer-events: none; }
.ui-drp__nav > * { pointer-events: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__icon-btn { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-md); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__icon-btn:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__icon-btn { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-quick) var(--tc-ease-standard), color var(--tc-duration-quick) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__icon-btn:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-drp__months { display: grid; grid-template-columns: repeat(2, auto); justify-content: center; gap: var(--tc-space-6); animation: ui-drp-slide var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-drp__months[data-dir="-1"] { animation-name: ui-drp-slide-back; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__month-name { height: 22px; margin-bottom: var(--tc-space-1-5); font-weight: var(--tc-font-weight-semibold); text-align: center; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__month-name { height: 28px; margin-bottom: var(--tc-space-1); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-display-sm); text-align: center; color: var(--tc-text-strong); }
.ui-drp__grid { display: grid; gap: var(--tc-space-0-5); }
.ui-drp__weekdays, .ui-drp__week { display: grid; grid-template-columns: repeat(7, 32px); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__weekday { height: 26px; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: 26px; text-align: center; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__weekday { height: 24px; font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; text-align: center; color: var(--tc-text-muted); }
/* A day: the band sits behind the number and runs on into its neighbours */
.ui-drp__day { position: relative; display: grid; height: 32px; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day::before { content: ""; position: absolute; inset: 2px 0; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), border-radius var(--tc-duration-base) var(--tc-ease-move), left var(--tc-duration-base) var(--tc-ease-move), right var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-range]::before { background: var(--tc-date-range-picker-band); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-preview]::before { background: var(--tc-accent-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day::before { content: ""; position: absolute; inset: 2px 0; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), border-radius var(--tc-duration-base) var(--tc-ease-move), left var(--tc-duration-base) var(--tc-ease-move), right var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-range]::before { background: var(--tc-date-range-picker-band); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-preview]::before { background: var(--tc-accent-subtle); }
.ui-drp__day[data-compare]::before { background: var(--tc-date-range-picker-compare-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-start]::before,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-compare-start]::before,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-row-start]::before { left: 2px; border-top-left-radius: var(--tc-radius-md); border-bottom-left-radius: var(--tc-radius-md); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-end]::before,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-compare-end]::before,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-row-end]::before { right: 2px; border-top-right-radius: var(--tc-radius-md); border-bottom-right-radius: var(--tc-radius-md); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day button {
  position: relative;
  border-radius: var(--tc-radius-md);
  font-size: var(--tc-font-size-sm);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day button:hover:not(:disabled) { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-range] button:hover:not(:disabled) { background: transparent; box-shadow: inset 0 0 0 1px var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-start]::before,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-compare-start]::before,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-row-start]::before { left: 2px; border-top-left-radius: var(--tc-radius-sm); border-bottom-left-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-end]::before,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-compare-end]::before,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-row-end]::before { right: 2px; border-top-right-radius: var(--tc-radius-sm); border-bottom-right-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day button {
  position: relative;
  margin: var(--tc-space-0-5);
  border-radius: var(--tc-radius-sm);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-quick) var(--tc-ease-standard), color var(--tc-duration-quick) var(--tc-ease-standard), box-shadow var(--tc-duration-quick) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day button:hover:not(:disabled) { background: var(--tc-fill-default); }
.ui-drp__day button:active:not(:disabled) { transform: scale(0.94); }
.ui-drp__day button:disabled { color: var(--tc-text-disabled); cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day button[aria-current="date"]::after { content: ""; position: absolute; left: 50%; bottom: 4px; width: 3px; height: 3px; margin-left: -1.5px; border-radius: 50%; background: currentColor; opacity: 0.55; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-start] button,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-end] button { background: var(--tc-accent) !important; color: var(--tc-text-on-accent); font-weight: var(--tc-font-weight-semibold); box-shadow: none !important; animation: ui-drp-pick var(--tc-duration-slower) var(--tc-ease-spring); }
/* Today: a small blue dot under the number */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day button[aria-current="date"] { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day button[aria-current="date"]::after { content: ""; position: absolute; left: 50%; bottom: 3px; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: var(--tc-accent-text); }
/* The ends of the range: accent chips */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-start] button,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-end] button { background: var(--tc-accent) !important; color: var(--tc-text-on-accent); font-weight: var(--tc-font-weight-medium); box-shadow: none !important; animation: ui-drp-pick var(--tc-duration-slower) var(--tc-ease-spring); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-start] button[aria-current="date"]::after,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-end] button[aria-current="date"]::after { background: var(--tc-text-on-accent); }
/* While previewing, the end follows the pointer – no pop on every move */
.ui-drp__day[data-preview][data-end] button { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-compare-start] button,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-compare-end] button { box-shadow: inset 0 0 0 1px var(--tc-date-range-picker-compare-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-compare-start] button,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-compare-end] button { box-shadow: inset 0 0 0 0.5px var(--tc-date-range-picker-compare-border); }
.ui-drp__day-empty::before { display: none; }
/* Footer */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--tc-space-3-5); padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-1-5) var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__summary { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__summary-range { display: flex; align-items: baseline; gap: var(--tc-space-2); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__summary-range > span:first-child { animation: ui-drp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__count { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); animation: ui-drp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* The last row, under a hairline: summary and compare on the left, Cancel / Apply on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3-5); border-top: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__summary { display: grid; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__summary-range { display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; white-space: nowrap; color: var(--tc-text-strong); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__summary-range > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-drp-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__count { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); animation: ui-drp-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-drp__compare { display: flex; align-items: center; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__compare-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segments { position: relative; display: inline-flex; padding: var(--tc-space-0-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: 0 0 0 1px var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segment { position: relative; z-index: 1; height: 24px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); white-space: nowrap; color: var(--tc-text-muted); transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segment:hover { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segment[aria-checked="true"] { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segments .ui-drp__pill { border-radius: var(--tc-radius-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__fold { display: grid; grid-template-rows: 0fr; opacity: 0; margin-top: -6px; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard), margin-top var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__compare-label { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* Compare: tab-style buttons with a hairline, the active one filled */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segments { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segment { padding: var(--tc-space-1) var(--tc-space-2-5); border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); font-weight: var(--tc-font-weight-medium); white-space: nowrap; color: var(--tc-text-secondary); transition: background-color var(--tc-duration-quick) var(--tc-ease-standard), color var(--tc-duration-quick) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segment:hover:not([aria-checked="true"]) { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segment[aria-checked="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__fold { display: grid; grid-template-rows: 0fr; opacity: 0; margin-top: -8px; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard), margin-top var(--tc-duration-slow) var(--tc-ease-move); }
.ui-drp__fold[data-open] { grid-template-rows: 1fr; opacity: 1; margin-top: 0; }
.ui-drp__fold > div { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__compare-range { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); animation: ui-drp-in var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__compare-range::before { content: ""; width: 14px; height: 8px; border-radius: var(--tc-radius-2xs); background: var(--tc-date-range-picker-compare-bg); box-shadow: inset 0 0 0 1px var(--tc-date-range-picker-compare-border); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__buttons { display: flex; flex: none; gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__btn { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__btn:not(.ui-drp__btn-primary):hover { background: var(--tc-action-ghost-bg-hover); }
.ui-drp__btn-primary { background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow) !important; color: var(--tc-action-primary-fg) !important; }
.ui-drp__btn-primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover) !important; }
.ui-drp__btn-primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__btn-primary:active { transform: scale(0.97); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__compare-range { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); animation: ui-drp-in-clean var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__compare-range::before { content: ""; flex: none; width: 14px; height: 8px; border-radius: var(--tc-radius-2xs); background: var(--tc-date-range-picker-compare-bg); box-shadow: inset 0 0 0 0.5px var(--tc-date-range-picker-compare-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__buttons { display: flex; flex: none; gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__btn {
  display: inline-flex;
  align-items: center;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-drp__btn:not(.ui-drp__btn-primary):hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__btn:active:not(:disabled) { transform: scale(0.97); }
.ui-drp__btn-primary:disabled { opacity: 0.35; cursor: default; }
@keyframes ui-drp-open { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes ui-drp-slide { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
@keyframes ui-drp-slide-back { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@keyframes ui-drp-in { from { opacity: 0; transform: translateY(4px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-drp-in-clean { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-drp-pick { 0% { transform: scale(0.82); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
/* Narrow panel (phones): presets as a scrolling row of chips, one month, stacked footer */
@container (max-width: 600px) {
:where([data-look="standard"], [data-look="standard"] *).ui-drp__body { grid-template-columns: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__presets {
    flex-direction: row;
    gap: var(--tc-space-1-5);
    padding: var(--tc-space-2-5);
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid var(--tc-border-default);
    scrollbar-width: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-drp__presets::-webkit-scrollbar { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset { flex: none; height: 32px; padding: 0 var(--tc-space-3); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__presets .ui-drp__pill { border-radius: var(--tc-radius-full); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset-custom { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__months { grid-template-columns: 1fr; justify-items: center; }
  /* One month: the one the range ends in */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__month:not([data-second]) { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__foot { flex-direction: column; align-items: stretch; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__buttons { justify-content: flex-end; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__compare { flex-wrap: wrap; }
}
@container (max-width: 340px) {
:where([data-look="standard"], [data-look="standard"] *).ui-drp__weekdays,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__week { grid-template-columns: repeat(7, 1fr); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__cal { padding: var(--tc-space-3-5) var(--tc-space-2) var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__months { justify-items: stretch; }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day { height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__weekdays,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__week { grid-template-columns: repeat(7, minmax(0, 38px)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__icon-btn { width: 38px; height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__btn { height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segment { height: 30px; }
}
/* Narrow panel (phones): presets as a scrolling row of tab chips, one month, stacked last row */
@container (max-width: 600px) {
:where([data-look="clean"], [data-look="clean"] *).ui-drp__body { grid-template-columns: 1fr; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__presets {
    flex-direction: row;
    gap: var(--tc-space-1);
    padding: var(--tc-space-2);
    overflow-x: auto;
    border-right: 0;
    border-bottom: 0.5px solid var(--tc-border-default);
    scrollbar-width: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-drp__presets::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset { height: auto; padding: var(--tc-space-1) var(--tc-space-2-5); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset-custom { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__months { grid-template-columns: 1fr; justify-items: center; }
  /* One month: the one the range ends in */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__month:not([data-second]) { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__foot { flex-direction: column; align-items: stretch; padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__buttons { justify-content: flex-end; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__compare { flex-wrap: wrap; }
}
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-drp__weekdays,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__week { grid-template-columns: repeat(7, 1fr); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__cal { padding: var(--tc-space-2-5) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__nav { left: 8px; right: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__months { justify-items: stretch; }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__weekdays,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__week { grid-template-columns: repeat(7, minmax(0, 40px)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__icon-btn { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__month-name { height: 36px; line-height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__btn { height: 36px; padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segment { padding: var(--tc-space-2) var(--tc-space-3); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="drp"] *, [data-ui="drp"] *::before, [data-ui="drp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-date-range-picker")) customElements.define("tc-date-range-picker", TcDateRangePicker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-date-range-picker": TcDateRangePicker;
  }
}
