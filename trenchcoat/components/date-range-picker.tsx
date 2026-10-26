"use client";

/*
 * Date Range Picker – pick a period from presets or two calendars, in a single self-contained file.
 * Presets on the left ("Last 7 days", "This month" …), two months on the right: click a start, hover to preview,
 * click an end. Optionally compare with the previous period or the previous year – shown as a second band.
 * Arrow keys move day by day, PageUp/PageDown month by month, Enter picks, Esc closes.
 * On narrow screens the presets become a row of chips and one month is shown.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: date-range-picker.tsx is Standard,
 * date-range-picker-clean.tsx is Clean). Clean has no tray – a white one-line field with a hairline shadow opens
 * one white popover; the picked ends are dark chips with a light gray band between them, today carries a small
 * blue dot, and Cancel / Apply sit in a last row under a hairline. Only the calendars clip while the popover
 * glides to its height, and the active preset and compare option are marked without a gliding highlight.
 */
// Generated from src/components/date-range-picker.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-drp";

export type DateRange = { start: Date; end: Date };
export type CompareMode = "off" | "previous" | "year";

export type RangePreset = {
  id: string;
  label: string;
  /** Builds the range from today */
  range: (today: Date) => DateRange;
};

export type DateRangePickerOwnProps = {
  /** The applied range. Controlled when defined; otherwise the picker keeps its own, starting at `defaultValue` */
  value?: DateRange;
  /** Starting range when uncontrolled – defaults to the last 30 days */
  defaultValue?: DateRange;
  /** Called on Apply with the range and the comparison range (if any) */
  onChange?: (range: DateRange, compare: DateRange | null, mode: CompareMode) => void;
  presets?: RangePreset[];
  /** Show the "Compare to" control */
  compare?: boolean;
  /** The applied comparison. Controlled when defined (changes come through onChange's third argument); otherwise
   *  starts at `defaultCompare` */
  compareMode?: CompareMode;
  defaultCompare?: CompareMode;
  /** Whether the panel is open. Controlled when defined; otherwise starts at `defaultOpen` */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Name for native form submission: a hidden input with the applied range as "YYYY-MM-DD/YYYY-MM-DD" */
  name?: string;
  /** The trigger can't be used and the hidden input is left out of the form */
  disabled?: boolean;
  /** 0 = Sunday, 1 = Monday */
  weekStartsOn?: 0 | 1;
  /** Days after this can't be picked – defaults to today */
  max?: Date;
  min?: Date;
  /** Open the panel right away – nice for previews */
  defaultOpen?: boolean;
  /** "Today" for the presets – defaults to the real today, read after mount (so server and client render alike) */
  today?: Date;
  /** Visual style. Defaults to the file's look: Standard in date-range-picker.tsx, Clean in date-range-picker-clean.tsx */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type DateRangePickerProps = Omit<ComponentPropsWithoutRef<"div">, keyof DateRangePickerOwnProps> & DateRangePickerOwnProps;

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
const shiftMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), endOfMonth(addMonths(d, n)).getDate()));
/** Drops the time of day, so a range built from the current time matches calendar days and presets */
const dayRange = (r: DateRange): DateRange => ({ start: day(r.start), end: day(r.end) });
const sameRange = (a: DateRange | null, b: DateRange | null) => !!a && !!b && same(a.start, b.start) && same(a.end, b.end);
/** "2026-10-08" in local time – the form value */
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const NOOP = () => {};
/** Stands in for today until the clock is read after mount; nothing that shows it renders before then */
const SOMEDAY = new Date(2000, 0, 1);

const fmtDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fmtDayYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const fmtLong = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const fmtWeekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });

/** "Sep 9 – Oct 8, 2026", "Dec 20, 2025 – Jan 5, 2026", "Oct 8, 2026" */
export function formatRange({ start, end }: DateRange) {
  if (same(start, end)) return fmtDayYear.format(start);
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${(sameYear ? fmtDay : fmtDayYear).format(start)} – ${fmtDayYear.format(end)}`;
}

export function compareRange(range: DateRange, mode: CompareMode): DateRange | null {
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

export const defaultPresets: RangePreset[] = [
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

const Glyph = ({ d, className }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={["ui-drp__glyph", className].filter(Boolean).join(" ")} aria-hidden="true">
    <path d={d} />
  </svg>
);
const icons = {
  calendar: "M7 3v3M17 3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  chevron: "M8 10l4 4 4-4",
  left: "M14.5 6l-6 6 6 6",
  right: "M9.5 6l6 6-6 6",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

/** Moves a pill under the active child of a list – no transition on the first placement, so it doesn't fly in */
function glide(list: HTMLElement | null, pill: HTMLElement | null, selector: string) {
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

/** One day of a month grid, with everything about it that doesn't depend on the selection */
type Cell = { date: Date; time: number; label: string; rowStart: boolean; rowEnd: boolean };
type MonthData = { time: number; name: string; weeks: (Cell | null)[][] };

/** The weeks of a month, each 7 days or null for days of the neighbouring months */
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

/** A month's grid, its name and every day's label – built when the month changes, not on every hover */
function monthData(month: Date, weekStartsOn: number): MonthData {
  const last = endOfMonth(month).getDate();
  return {
    time: month.getTime(),
    name: fmtMonth.format(month),
    weeks: weeks(month, weekStartsOn).map((week) =>
      week.map((d, di) =>
        d && { date: d, time: d.getTime(), label: fmtLong.format(d), rowStart: di === 0 || d.getDate() === 1, rowEnd: di === 6 || d.getDate() === last },
      ),
    ),
  };
}

/** "Mo", "Tu" … from the week's first day */
const weekdayNames = (weekStartsOn: number) =>
  Array.from({ length: 7 }, (_, i) => fmtWeekday.format(new Date(2026, 0, 4 + weekStartsOn + i)).slice(0, 2));

const inRange = (d: Date, r: DateRange | null) => !!r && d >= r.start && d <= r.end;

/** What every day of the grid needs to know about the selection */
type DayProps = {
  shown: DateRange;
  range: DateRange | null;
  cmp: DateRange | null;
  /** Between the first and the second click: hovering previews the range */
  previewing: boolean;
  focus: Date;
  today: Date;
  minDay?: Date;
  maxDay: Date;
  onPick: (d: Date) => void;
  onHover: (d: Date) => void;
  onFocusDay: (d: Date) => void;
};

/** The two months, side by side; they slide in from the side they came from (`dir`) */
function Months({
  gridRef,
  month,
  dir,
  weekStartsOn,
  onKeyDown,
  onPointerLeave,
  onPointerDown,
  days,
}: {
  gridRef: Ref<HTMLDivElement>;
  month: Date;
  dir: 1 | -1;
  weekStartsOn: number;
  onKeyDown: (e: KeyboardEvent) => void;
  onPointerLeave: () => void;
  onPointerDown: () => void;
  days: DayProps;
}) {
  // The grids, names and day labels only change with the month and the first weekday – not on hover
  const monthTime = month.getTime();
  const weekdays = useMemo(() => weekdayNames(weekStartsOn), [weekStartsOn]);
  const months = useMemo(() => {
    const left = new Date(monthTime);
    return [monthData(left, weekStartsOn), monthData(addMonths(left, 1), weekStartsOn)];
  }, [monthTime, weekStartsOn]);
  const rows = Math.max(...months.map((m) => m.weeks.length));
  return (
    <div ref={gridRef} className="ui-drp__months" key={monthTime} data-dir={dir} onKeyDown={onKeyDown} onPointerLeave={onPointerLeave} onPointerDown={onPointerDown}>
      {months.map((m, mi) => (
        <MonthGrid key={m.time} data={m} rows={rows} weekdays={weekdays} second={mi === 1} {...days} />
      ))}
    </div>
  );
}

/** One month: its name, the weekdays and the days, marked for the range, the comparison and the preview */
function MonthGrid({
  data,
  rows,
  weekdays,
  second,
  shown,
  range,
  cmp,
  previewing,
  focus,
  today,
  minDay,
  maxDay,
  onPick,
  onHover,
  onFocusDay,
}: DayProps & { data: MonthData; rows: number; weekdays: string[]; second: boolean }) {
  return (
    <div className="ui-drp__month" data-second={second || undefined}>
      <div className="ui-drp__month-name" aria-hidden="true">
        {data.name}
      </div>
      <div role="grid" aria-label={data.name} className="ui-drp__grid">
        <div role="row" className="ui-drp__weekdays">
          {weekdays.map((w) => (
            <span key={w} role="columnheader" className="ui-drp__weekday">
              {w}
            </span>
          ))}
        </div>
        {Array.from({ length: rows }, (_, ri) => data.weeks[ri] ?? Array<null>(7).fill(null)).map((week, wi) => (
          <div role="row" key={wi} className="ui-drp__week">
            {week.map((c, di) => {
              if (!c) return <span key={di} className="ui-drp__day ui-drp__day-empty" role="gridcell" />;
              const d = c.date;
              const isStart = same(d, shown.start);
              const isEnd = same(d, shown.end);
              const inMain = inRange(d, range);
              const inCmp = !inMain && inRange(d, cmp);
              const off = d > maxDay || (!!minDay && d < minDay);
              return (
                <span
                  key={di}
                  role="gridcell"
                  aria-selected={inMain || isStart || undefined}
                  className="ui-drp__day"
                  data-range={inMain || undefined}
                  data-start={isStart || undefined}
                  data-end={isEnd || undefined}
                  data-preview={(previewing && inMain) || undefined}
                  data-compare={inCmp || undefined}
                  data-compare-start={(cmp && same(d, cmp.start)) || undefined}
                  data-compare-end={(cmp && same(d, cmp.end)) || undefined}
                  data-row-start={c.rowStart || undefined}
                  data-row-end={c.rowEnd || undefined}
                >
                  <button
                    type="button"
                    data-day={c.time}
                    tabIndex={same(d, focus) ? 0 : -1}
                    disabled={off}
                    aria-label={c.label}
                    aria-current={same(d, today) ? "date" : undefined}
                    onClick={() => onPick(d)}
                    onPointerEnter={() => previewing && onHover(d)}
                    onFocus={() => onFocusDay(d)}
                  >
                    {d.getDate()}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Standard: the gray highlight glides to the active option of a list. Measured when the active option changes
 * and when the list resizes (narrow layouts, fonts) – not after every render.
 */
function useGlide(list: { current: HTMLElement | null }, pill: { current: HTMLElement | null }, selector: string, active: unknown) {
  useLayoutEffect(() => {
    const el = list.current;
    if (!el || !pill.current) return;
    glide(el, pill.current, selector);
    const ro = new ResizeObserver(() => glide(el, pill.current, selector));
    ro.observe(el);
    return () => ro.disconnect();
  }, [list, pill, selector, active]);
}

/** Keeps `box` as tall (or as wide) as `inner` plus `pad`, following it with a ResizeObserver – so it can glide */
function useFit(box: { current: HTMLElement | null }, inner: { current: HTMLElement | null }, side: "height" | "width", pad: number, on = true) {
  useLayoutEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!on || !b || !i) return;
    const set = () => (b.style[side] = `${(side === "height" ? i.offsetHeight : i.offsetWidth) + pad}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(i);
    return () => ro.disconnect();
  }, [box, inner, side, pad, on]);
}

/** The summary ("Sep 9 – Oct 8, 2026 · 30 days"), the compare options, the comparison and Cancel / Apply */
function Foot({
  shown,
  draft,
  hovering,
  compare,
  mode,
  onMode,
  cmp,
  lastCompare,
  clean,
  segmentList,
  segmentPill,
  onCancel,
  onApply,
}: {
  shown: DateRange;
  draft: { start: Date; end: Date | null };
  hovering: boolean;
  compare: boolean;
  mode: CompareMode;
  onMode: (mode: CompareMode) => void;
  cmp: DateRange | null;
  lastCompare: DateRange | null;
  clean: boolean;
  segmentList: Ref<HTMLDivElement>;
  segmentPill: Ref<HTMLSpanElement>;
  onCancel: () => void;
  onApply: () => void;
}) {
  const length = span(shown.start, shown.end);
  // Radio group: one tab stop, arrow keys move and select (APG radio group)
  const onRadioKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const at = COMPARE.findIndex((c) => c.id === mode);
    const next = COMPARE[(at + step + COMPARE.length) % COMPARE.length];
    onMode(next.id);
    e.currentTarget.querySelector<HTMLElement>(`[data-mode="${next.id}"]`)?.focus();
  };
  return (
    <div className="ui-drp__foot">
      {/* The picked range, said once per click – the start, then the whole range (not on hover) */}
      <span className="ui-drp__sr" role="status">
        {draft.end ? `${formatRange(order(draft.start, draft.end))}, ${span(draft.start, draft.end)} ${span(draft.start, draft.end) === 1 ? "day" : "days"}` : `Start ${fmtDayYear.format(draft.start)} – pick an end`}
      </span>
      <div className="ui-drp__summary">
        <div className="ui-drp__summary-range">
          <span key={`${shown.start.getTime()}-${shown.end.getTime()}`}>
            {draft.end || hovering ? formatRange(shown) : `${fmtDayYear.format(draft.start)} – pick an end`}
          </span>
          <span className="ui-drp__count" key={length}>
            {length} {length === 1 ? "day" : "days"}
          </span>
        </div>
        {compare && (
          <div className="ui-drp__compare">
            <span className="ui-drp__compare-label">Compare</span>
            <div ref={segmentList} className="ui-drp__segments" role="radiogroup" aria-label="Compare to" onKeyDown={onRadioKey}>
              {!clean && <span ref={segmentPill} className="ui-drp__pill" aria-hidden="true" />}
              {COMPARE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === c.id}
                  tabIndex={mode === c.id ? 0 : -1}
                  data-mode={c.id}
                  className="ui-drp__segment"
                  onClick={() => onMode(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Folds open and closed; keeps the last text while folding away */}
        {compare && (
          <div className="ui-drp__fold" data-open={!!cmp || undefined}>
            <div>
              {lastCompare && (
                <div className="ui-drp__compare-range" key={`${lastCompare.start.getTime()}-${lastCompare.end.getTime()}`}>
                  vs. {formatRange(lastCompare)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="ui-drp__buttons">
        <button type="button" className="ui-drp__btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="ui-drp__btn ui-drp__btn-primary" disabled={!draft.end} onClick={onApply}>
          Apply
        </button>
      </div>
    </div>
  );
}

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

/** The presets, plus "Custom" when the draft matches none – Standard's pill glides under the active one */
function Presets({
  presets,
  active,
  clean,
  listRef,
  pillRef,
  onChoose,
}: {
  presets: RangePreset[];
  active: RangePreset | undefined;
  clean: boolean;
  listRef: Ref<HTMLDivElement>;
  pillRef: Ref<HTMLSpanElement>;
  onChoose: (p: RangePreset) => void;
}) {
  return (
    <div ref={listRef} className="ui-drp__presets" role="group" aria-label="Presets">
      {!clean && <span ref={pillRef} className="ui-drp__pill" aria-hidden="true" />}
      {presets.map((p) => (
        <button key={p.id} type="button" aria-pressed={active?.id === p.id} className="ui-drp__preset" onClick={() => onChoose(p)}>
          {p.label}
        </button>
      ))}
      <span className="ui-drp__preset ui-drp__preset-custom" aria-hidden={!!active} data-active={!active || undefined}>
        Custom
      </span>
    </div>
  );
}

/** The trigger's content: the applied range and its comparison (`applied` is null until today is known) */
function TriggerText({ innerRef, applied, mode }: { innerRef: Ref<HTMLSpanElement>; applied: DateRange | null; mode: CompareMode }) {
  return (
    <span ref={innerRef} className="ui-drp__trigger-inner">
      <Glyph d={icons.calendar} />
      <span className="ui-drp__trigger-text" key={`${applied ? formatRange(applied) : ""}-${mode}`}>
        <span className="ui-drp__trigger-range">{applied ? formatRange(applied) : "Last 30 days"}</span>
        {mode !== "off" && applied && <span className="ui-drp__trigger-compare">vs. {formatRange(compareRange(applied, mode)!)}</span>}
      </span>
      <Glyph d={icons.chevron} className="ui-drp__chevron" />
    </span>
  );
}

export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  presets = defaultPresets,
  compare = true,
  compareMode,
  defaultCompare = "previous",
  weekStartsOn = 1,
  max,
  min,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  name,
  disabled: disabledProp = false,
  today: todayProp,
  look,
  className,
  ref,
  ...rest
}: DateRangePickerProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  // Today: the prop, else the clock – read after mount, before paint, never during render
  const [clock, setClock] = useState<Date | null>(null);
  useLayoutEffect(() => {
    if (!todayProp) setClock(day(new Date()));
  }, [todayProp]);
  const known = todayProp ? day(todayProp) : clock;
  const today = known ?? SOMEDAY;
  const maxDay = max ? day(max) : today;
  const minDay = min ? day(min) : undefined;

  // The applied range; without one, the last 30 days (shown once today is known)
  // Apply reports range, comparison and mode in one onChange call: the range goes through the hook, which reports
  // it with the mode being applied
  const applying = useRef<CompareMode>("off");
  const [own, setApplied] = useControllable<DateRange | undefined>(
    value && dayRange(value),
    defaultValue && dayRange(defaultValue),
    onChange && ((r) => r && onChange(r, compare ? compareRange(r, applying.current) : null, applying.current)),
    "value",
  );
  const applied = own ?? { start: addDays(today, -29), end: today };
  const pending = !own && !known;
  // The applied comparison; its changes are reported through onChange's third argument
  const [modeState, setAppliedMode] = useControllable<CompareMode>(compare ? compareMode : undefined, defaultCompare, onChange && NOOP, "compareMode");
  const appliedMode = compare ? modeState : "off";

  const [openState, setOpen] = useControllable(openProp, defaultOpen, onOpenChange, "open");
  const open = openState && !disabledProp && !pending;
  // The draft while the panel is open: end is null between the first and second click
  const [draft, setDraft] = useState<{ start: Date; end: Date | null }>(applied);
  const [hover, setHover] = useState<Date | null>(null);
  const [mode, setMode] = useState<CompareMode>(appliedMode);
  const [month, setMonth] = useState(() => addMonths(applied.end, -1)); // left month
  const [dir, setDir] = useState<1 | -1>(1);
  const [focus, setFocus] = useState<Date>(applied.end);

  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const keyboard = useRef(false);
  const uid = useId();
  const rootRef = useRootRef(root, ref);
  const panelInner = useRef<HTMLDivElement>(null);
  const triggerInner = useRef<HTMLSpanElement>(null);
  const presetList = useRef<HTMLDivElement>(null);
  const presetPill = useRef<HTMLSpanElement>(null);
  const segmentList = useRef<HTMLDivElement>(null);
  const segmentPill = useRef<HTMLSpanElement>(null);

  // Reset the draft whenever the panel opens
  const resetDraft = () => {
    setDraft(applied);
    setMode(appliedMode);
    setMonth(addMonths(applied.end, -1));
    setFocus(applied.end);
    setHover(null);
  };
  // Opened from the trigger: focus moves into the dialog, onto the focused day
  const focusIn = useRef(false);
  const openPanel = () => {
    resetDraft();
    focusIn.current = true;
    setOpen(true);
  };
  // The first draft was made before today was known (it stood in): start it again from the real day, while rendering
  const [draftKnown, setDraftKnown] = useState(!pending);
  if (!pending && !draftKnown) {
    setDraftKnown(true);
    resetDraft();
  }
  // Opened from outside (the `open` prop) – start from the applied range, as a click on the trigger does
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && openProp !== undefined) resetDraft();
  }
  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  };

  // Click outside and Esc close the panel
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, setOpen]);

  useLayoutEffect(() => {
    if (!open || !focusIn.current) return;
    focusIn.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focus.getTime()}"]`)?.focus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- only when it opens
  // Keyboard focus follows the focused day
  useLayoutEffect(() => {
    if (!open || !keyboard.current) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focus.getTime()}"]`)?.focus();
  }, [focus, month, open]);

  const range: DateRange | null = draft.end ? order(draft.start, draft.end) : hover ? order(draft.start, hover) : null;
  const shown = range ?? { start: draft.start, end: draft.start };
  const cmp = compare && range ? compareRange(range, mode) : null;
  const preset = draft.end ? presets.find((p) => {
    const r = p.range(today);
    return same(day(r.start), shown.start) && same(day(r.end), shown.end);
  }) : undefined;

  const pick = (d: Date) => {
    if (draft.end) setDraft({ start: d, end: null });
    else {
      const r = order(draft.start, d);
      setDraft(r);
    }
    setHover(null);
    setFocus(d);
  };
  const choosePreset = (p: RangePreset) => {
    const r = p.range(today);
    const next = { start: clamp(day(r.start), minDay, maxDay), end: clamp(day(r.end), minDay, maxDay) };
    setDraft(next);
    setHover(null);
    setFocus(next.end);
    const left = addMonths(next.end, -1);
    if (left.getTime() !== month.getTime()) {
      setDir(left > month ? 1 : -1);
      setMonth(left);
    }
  };
  const shift = (n: number) => {
    setDir(n > 0 ? 1 : -1);
    setMonth((m) => addMonths(m, n));
  };
  const apply = () => {
    const r = draft.end ? order(draft.start, draft.end) : { start: draft.start, end: draft.start };
    applying.current = mode;
    setAppliedMode(mode);
    setApplied(r);
    close();
  };

  const onGridKey = (e: KeyboardEvent) => {
    let next = keyTarget(e.key, focus, weekStartsOn);
    if (!next) return;
    e.preventDefault();
    keyboard.current = true;
    next = clamp(next, minDay, maxDay);
    setFocus(next);
    if (!draft.end) setHover(next);
    // Keep the focused day on screen – narrow panels show only the second month, so focus never lands in a hidden one
    const firstShown = grid.current?.querySelector<HTMLElement>(".ui-drp__month:not([data-second])");
    const left = firstShown && getComputedStyle(firstShown).display === "none" ? addMonths(month, 1) : month;
    const right = endOfMonth(addMonths(month, 1));
    if (next < left) shift(-1);
    else if (next > right) shift(1);
  };

  // The compare line keeps its last text while it folds away – remembered in state, adjusted while rendering
  const [lastCompare, setLastCompare] = useState<DateRange | null>(cmp);
  if (cmp && !sameRange(cmp, lastCompare)) setLastCompare(cmp);

  // Standard: the gray highlight glides to the active preset and the active compare option (Clean has no pills)
  useGlide(presetList, presetPill, '[aria-pressed="true"], [data-active]', `${open}-${clean}-${preset?.id}`);
  useGlide(segmentList, segmentPill, '[aria-checked="true"]', `${open}-${clean}-${mode}`);

  // Phones: the row of preset chips scrolls the active one into view (at once when opening, smoothly afterwards)
  const scrolled = useRef(false);
  useEffect(() => {
    if (!open) {
      scrolled.current = false;
      return;
    }
    const list = presetList.current;
    const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    const left = Math.max(0, active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2);
    list.scrollTo({ left, behavior: scrolled.current ? "smooth" : "auto" });
    scrolled.current = true;
  }, [open, preset?.id]);

  // The panel glides to its new height (5 or 6 weeks, the compare line) instead of jumping. Clean: only the
  // calendars clip while they glide, so the last row with Cancel / Apply is never cut off while it moves
  useFit(panel, panelInner, "height", clean ? 0 : 8, open);

  // The trigger glides to the width of its new text
  useFit(trigger, triggerInner, "width", clean ? 16 : 20);

  // The presets and the two months; Standard keeps them in one gliding box with the footer, Clean clips only these
  const body = (
    <div ref={clean ? panelInner : undefined} className="ui-drp__body">
      <Presets presets={presets} active={preset} clean={clean} listRef={presetList} pillRef={presetPill} onChoose={choosePreset} />

      <div className="ui-drp__cal">
        <div className="ui-drp__nav">
          <button type="button" className="ui-drp__icon-btn" aria-label="Previous month" onClick={() => shift(-1)}>
            <Glyph d={icons.left} />
          </button>
          <button type="button" className="ui-drp__icon-btn" aria-label="Next month" onClick={() => shift(1)}>
            <Glyph d={icons.right} />
          </button>
        </div>
        <span className="ui-drp__sr" role="status">
          {open ? `${fmtMonth.format(month)} – ${fmtMonth.format(addMonths(month, 1))}` : ""}
        </span>
        <Months
          gridRef={grid}
          month={month}
          dir={dir}
          weekStartsOn={weekStartsOn}
          onKeyDown={onGridKey}
          onPointerLeave={() => !draft.end && setHover(null)}
          onPointerDown={() => (keyboard.current = false)}
          days={{ shown, range, cmp, previewing: !draft.end, focus, today, minDay, maxDay, onPick: pick, onHover: setHover, onFocusDay: setFocus }}
        />
      </div>
    </div>
  );

  // The summary, the compare options and Cancel / Apply
  const foot = (
    <Foot
      shown={shown}
      draft={draft}
      hovering={!!hover}
      compare={compare}
      mode={mode}
      onMode={setMode}
      cmp={cmp}
      lastCompare={lastCompare}
      clean={clean}
      segmentList={segmentList}
      segmentPill={segmentPill}
      onCancel={() => close()}
      onApply={apply}
    />
  );

  return (
    <div
      {...rest}
      ref={rootRef}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-open={open || undefined}
      data-disabled={disabledProp || undefined}
    >
      {/* React 19 hoists this into <head> once, no matter how many pickers render */}
      <style href="ui-date-range-picker" precedence="default">
        {css}
      </style>

      <button
        ref={trigger}
        type="button"
        className="ui-drp__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${uid}-panel`}
        disabled={disabledProp}
        onClick={() => (open ? close() : openPanel())}
      >
        <TriggerText innerRef={triggerInner} applied={pending ? null : applied} mode={compare ? appliedMode : "off"} />
      </button>

      {name && <input type="hidden" name={name} value={pending ? "" : `${isoDay(applied.start)}/${isoDay(applied.end)}`} disabled={disabledProp} />}

      {open && (
        <div
          ref={clean ? undefined : panel}
          id={`${uid}-panel`}
          role="dialog"
          aria-label="Choose a date range"
          className="ui-drp__panel"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
        >
          {clean ? (
            <>
              <div ref={panel} className="ui-drp__clip">
                {body}
              </div>
              {foot}
            </>
          ) : (
            <div ref={panelInner} className="ui-drp__panel-inner">
              {body}
              {foot}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      if (Object.is(resolved, latest.current)) return;
      if (!controlled) setOwn(resolved);
      latest.current = resolved;
      report.current?.(resolved);
    },
    [controlled],
  );
  return [current, set] as const;
}

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-drp:where([data-look="standard"]),
.ui-drp__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #232326);
  --_tc-field-h: 36px;
  --_tc-field-radius: 10px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-display-sm: 28px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-overlay: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-6: 24px;
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-accent: #ffffff;
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-drp:where([data-look="clean"]),
.ui-drp__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #252527);
  --_tc-field-h: 32px;
  --_tc-field-radius: 8px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-display-sm: 28px;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-overlay: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-6: 24px;
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-accent: #ffffff;
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
@media (forced-colors: active) {
  :where([data-look], [data-look] *):not(#tc-fc):is(button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea):not([role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]) { border: 1px solid ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(input, select, textarea) { border-color: FieldText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([role="listbox"], [role="menu"], [role="dialog"], [role="tooltip"], [role="tablist"], [role="radiogroup"]) { outline: 1px solid CanvasText; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) { forced-color-adjust: none; background: Highlight !important; color: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) * { color: HighlightText !important; background: none !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"] span:empty { background: ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"][aria-checked="true"] span:empty { background: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(:disabled, [aria-disabled="true"]) { color: GrayText !important; border-color: GrayText !important; }
}

/* Colors and motion as variables – override them on .ui-drp */
:where([data-look="standard"], [data-look="standard"] *).ui-drp {
  /* The picked range: at least 3:1 against the calendar (WCAG 1.4.11), with the day numbers still at 4.5:1 */
  --tc-date-range-picker-band: light-dark(#658fff, #4a63a4);
  --tc-date-range-picker-compare-bg: light-dark(#ececee, #26262a);
  --tc-date-range-picker-compare-border: light-dark(#b9b9be, #4a4a50);
  position: relative;
  display: inline-block;
  max-width: 100%;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: 1.4;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-drp */
:where([data-look="clean"], [data-look="clean"] *).ui-drp {
  /* The comparison period: a grey band with hairline ends – the accent is for the range itself */
  --tc-date-range-picker-compare-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.1));
  /* The picked range: at least 3:1 against the calendar (WCAG 1.4.11), with the day numbers still at 4.5:1 */
  --tc-date-range-picker-band: light-dark(#5796ec, #3364bf);
  --tc-date-range-picker-compare-border: light-dark(rgba(0, 0, 0, 0.32), rgba(255, 255, 255, 0.36));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  display: inline-block;
  max-width: 100%;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-drp *, .ui-drp *::before, .ui-drp *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *):where(.ui-drp) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-drp) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where(.ui-drp) svg { display: block; flex: none; }
.ui-drp button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
/* The trigger */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  max-width: 100%;
  min-height: 38px;
  padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-3, var(--_tc-space-3));
  border-radius: var(--tc-field-radius, var(--_tc-field-radius));
  background: var(--tc-field-bg, var(--_tc-field-bg));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  text-align: left;
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), width var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger-inner { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); max-width: calc(100vw - 56px); }
.ui-drp__trigger:hover { box-shadow: var(--tc-field-shadow-hover, var(--_tc-field-shadow-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger > .ui-drp__glyph { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger-text { display: grid; min-width: 0; animation: ui-drp-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger-range { overflow: hidden; color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__trigger-compare { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__chevron { color: var(--tc-text-muted, var(--_tc-text-muted)); transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-drp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* 16px icons with thin ~1.1px lines */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
/* The trigger: a white one-line field with the hairline shadow; its width glides to the new text */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  max-width: 100%;
  height: var(--tc-field-h, var(--_tc-field-h));
  padding: 0 var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-field-radius, var(--_tc-field-radius));
  background: var(--tc-field-bg, var(--_tc-field-bg));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  text-align: left;
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), width var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-drp__trigger:disabled { opacity: 0.55; cursor: not-allowed; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger-inner { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); max-width: calc(100vw - 56px); color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger-text { display: flex; align-items: baseline; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; white-space: nowrap; animation: ui-drp-in-clean var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger-range { flex: 0 0 auto; max-width: 100%; overflow: hidden; color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); text-overflow: ellipsis; }
/* The comparison stays on the same line and gives way first when space runs out */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__trigger-compare { flex: 0 1 auto; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__chevron { transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-drp[data-open] .ui-drp__chevron { transform: rotate(180deg); }
/* The panel: a gray tray around a white card, like the other Trenchcoat menus */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__panel {
  position: absolute;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  top: calc(100% + 8px);
  left: 0;
  container-type: inline-size;
  /* A fixed width (not max-content), so the container queries below can measure it; override --tc-date-range-picker-panel-width to fit your layout */
  width: var(--tc-date-range-picker-panel-width, min(652px, calc(100vw - 32px)));
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay));
  overflow: hidden;
  transform-origin: top left;
  transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
  animation: ui-drp-open var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
/* The pill behind the active preset and compare option */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__pill {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), width var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-drp__body {
  display: grid;
  grid-template-columns: 136px 1fr;
  border-radius: var(--tc-radius-2xl, var(--_tc-radius-2xl));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default));
}
/* Presets */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__presets { position: relative; display: flex; flex-direction: column; gap: 1px; padding: var(--tc-space-1-5, var(--_tc-space-1-5)); border-right: 1px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  text-align: left;
  white-space: nowrap;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  position: relative;
  z-index: 1;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
button:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset:hover:not([aria-pressed="true"]) { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset[aria-pressed="true"],
:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset-custom[data-active] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The panel: one white popover; the calendars glide to their height, the last row sits below them */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__panel {
  position: absolute;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  top: calc(100% + 6px);
  left: 0;
  container-type: inline-size;
  /* A fixed width (not max-content), so the container queries below can measure it; override --tc-date-range-picker-panel-width to fit your layout */
  width: var(--tc-date-range-picker-panel-width, min(652px, calc(100vw - 32px)));
  overflow: hidden;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay));
  transform-origin: top left;
  animation: ui-drp-open var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-drp__clip { overflow: hidden; transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__body { display: grid; grid-template-columns: 140px 1fr; }
/* Presets: tab-style rows – gray text, the active one gets the gray fill (no gliding highlight) */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__presets { position: relative; display: flex; flex-direction: column; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); padding: var(--tc-space-1, var(--_tc-space-1)); border-right: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset {
  display: flex;
  align-items: center;
  flex: none;
  height: 28px;
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  text-align: left;
  white-space: nowrap;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
button:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset:hover:not([aria-pressed="true"]) { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset[aria-pressed="true"],
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset-custom[data-active] { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-drp__preset-custom { margin-top: auto; color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: default; }
/* Chosen preset / compare option: a ring in the selected colour (>= 3:1), on the gliding pill in Standard */
.ui-drp__pill { box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset[aria-pressed="true"], :where([data-look="clean"], [data-look="clean"] *).ui-drp__segment[aria-checked="true"] { box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); }
/* Calendars */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__cal { position: relative; padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__nav { position: absolute; top: 8px; left: 10px; right: 10px; z-index: 1; display: flex; justify-content: space-between; pointer-events: none; }
/* Calendars */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__cal { position: relative; padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2-5, var(--_tc-space-2-5)); overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__nav { position: absolute; top: 10px; left: 12px; right: 12px; z-index: 1; display: flex; justify-content: space-between; pointer-events: none; }
.ui-drp__nav > * { pointer-events: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__icon-btn { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__icon-btn:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__icon-btn { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__icon-btn:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-drp__months { display: grid; grid-template-columns: repeat(2, auto); justify-content: center; gap: var(--tc-space-6, var(--_tc-space-6)); animation: ui-drp-slide var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-drp__months[data-dir="-1"] { animation-name: ui-drp-slide-back; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__month-name { height: 22px; margin-bottom: var(--tc-space-1-5, var(--_tc-space-1-5)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); text-align: center; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__month-name { height: 28px; margin-bottom: var(--tc-space-1, var(--_tc-space-1)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-display-sm, var(--_tc-line-height-display-sm)); text-align: center; color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-drp__grid { display: grid; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-drp__weekdays, .ui-drp__week { display: grid; grid-template-columns: repeat(7, 32px); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__weekday { height: 26px; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: 26px; text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__weekday { height: 24px; font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); letter-spacing: 0.5px; text-transform: uppercase; text-align: center; color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* A day: the band sits behind the number and runs on into its neighbours */
.ui-drp__day { position: relative; display: grid; height: 32px; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day::before { content: ""; position: absolute; inset: 2px 0; transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), border-radius var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), left var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), right var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-range]::before { background: var(--tc-date-range-picker-band); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-preview]::before { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day::before { content: ""; position: absolute; inset: 2px 0; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), border-radius var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), left var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), right var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-range]::before { background: var(--tc-date-range-picker-band); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-preview]::before { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); }
.ui-drp__day[data-compare]::before { background: var(--tc-date-range-picker-compare-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-start]::before,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-compare-start]::before,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-row-start]::before { left: 2px; border-top-left-radius: var(--tc-radius-md, var(--_tc-radius-md)); border-bottom-left-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-end]::before,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-compare-end]::before,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-row-end]::before { right: 2px; border-top-right-radius: var(--tc-radius-md, var(--_tc-radius-md)); border-bottom-right-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day button {
  position: relative;
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day button:hover:not(:disabled) { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-range] button:hover:not(:disabled) { background: transparent; box-shadow: inset 0 0 0 1px var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-start]::before,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-compare-start]::before,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-row-start]::before { left: 2px; border-top-left-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); border-bottom-left-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-end]::before,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-compare-end]::before,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-row-end]::before { right: 2px; border-top-right-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); border-bottom-right-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day button {
  position: relative;
  margin: var(--tc-space-0-5, var(--_tc-space-0-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day button:hover:not(:disabled) { background: var(--tc-fill-default, var(--_tc-fill-default)); }
.ui-drp__day button:active:not(:disabled) { transform: scale(0.94); }
.ui-drp__day button:disabled { color: var(--tc-text-disabled, var(--_tc-text-disabled)); cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day button[aria-current="date"]::after { content: ""; position: absolute; left: 50%; bottom: 4px; width: 3px; height: 3px; margin-left: -1.5px; border-radius: 50%; background: currentColor; opacity: 0.55; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-start] button,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-end] button { background: var(--tc-accent, var(--_tc-accent)) !important; color: var(--tc-text-on-accent, var(--_tc-text-on-accent)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); box-shadow: none !important; animation: ui-drp-pick var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-spring, var(--_tc-ease-spring)); }
/* Today: a small blue dot under the number */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day button[aria-current="date"] { color: var(--tc-accent-text, var(--_tc-accent-text)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day button[aria-current="date"]::after { content: ""; position: absolute; left: 50%; bottom: 3px; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: var(--tc-accent-text, var(--_tc-accent-text)); }
/* The ends of the range: accent chips */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-start] button,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-end] button { background: var(--tc-accent, var(--_tc-accent)) !important; color: var(--tc-text-on-accent, var(--_tc-text-on-accent)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); box-shadow: none !important; animation: ui-drp-pick var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-spring, var(--_tc-ease-spring)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-start] button[aria-current="date"]::after,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-end] button[aria-current="date"]::after { background: var(--tc-text-on-accent, var(--_tc-text-on-accent)); }
/* While previewing, the end follows the pointer – no pop on every move */
.ui-drp__day[data-preview][data-end] button { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-compare-start] button,
:where([data-look="standard"], [data-look="standard"] *).ui-drp__day[data-compare-end] button { box-shadow: inset 0 0 0 1px var(--tc-date-range-picker-compare-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-compare-start] button,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__day[data-compare-end] button { box-shadow: inset 0 0 0 0.5px var(--tc-date-range-picker-compare-border); }
.ui-drp__day-empty::before { display: none; }
/* Footer */
:where([data-look="standard"], [data-look="standard"] *).ui-drp__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--tc-space-3-5, var(--_tc-space-3-5)); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__summary { display: grid; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__summary-range { display: flex; align-items: baseline; gap: var(--tc-space-2, var(--_tc-space-2)); color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__summary-range > span:first-child { animation: ui-drp-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__count { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-drp-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
/* The last row, under a hairline: summary and compare on the left, Cancel / Apply on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3-5, var(--_tc-space-3-5)); border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__summary { display: grid; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__summary-range { display: flex; align-items: baseline; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; white-space: nowrap; color: var(--tc-text-strong, var(--_tc-text-strong)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__summary-range > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-drp-in-clean var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__count { flex: none; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-drp-in-clean var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-drp__compare { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__compare-label { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segments { position: relative; display: inline-flex; padding: var(--tc-space-0-5, var(--_tc-space-0-5)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segment { position: relative; z-index: 1; height: 24px; padding: 0 var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); white-space: nowrap; color: var(--tc-text-muted, var(--_tc-text-muted)); transition: color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segment:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segment[aria-checked="true"] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__segments .ui-drp__pill { border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__fold { display: grid; grid-template-rows: 0fr; opacity: 0; margin-top: -6px; transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), margin-top var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__compare-label { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Compare: tab-style buttons with a hairline, the active one filled */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segments { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segment { padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5)); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); white-space: nowrap; color: var(--tc-text-secondary, var(--_tc-text-secondary)); transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segment:hover:not([aria-checked="true"]) { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segment[aria-checked="true"] { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__fold { display: grid; grid-template-rows: 0fr; opacity: 0; margin-top: -8px; transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), margin-top var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-drp__fold[data-open] { grid-template-rows: 1fr; opacity: 1; margin-top: 0; }
.ui-drp__fold > div { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__compare-range { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-drp-in var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__compare-range::before { content: ""; width: 14px; height: 8px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-date-range-picker-compare-bg); box-shadow: inset 0 0 0 1px var(--tc-date-range-picker-compare-border); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__buttons { display: flex; flex: none; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__btn { height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__btn:not(.ui-drp__btn-primary):hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); }
.ui-drp__btn-primary { background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)) !important; box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)) !important; color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)) !important; }
.ui-drp__btn-primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)) !important; }
.ui-drp__btn-primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__btn-primary:active { transform: scale(0.97); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__compare-range { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-drp-in-clean var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__compare-range::before { content: ""; flex: none; width: 14px; height: 8px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-date-range-picker-compare-bg); box-shadow: inset 0 0 0 0.5px var(--tc-date-range-picker-compare-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__buttons { display: flex; flex: none; gap: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__btn {
  display: inline-flex;
  align-items: center;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-drp__btn:not(.ui-drp__btn-primary):hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
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
    gap: var(--tc-space-1-5, var(--_tc-space-1-5));
    padding: var(--tc-space-2-5, var(--_tc-space-2-5));
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid var(--tc-border-default, var(--_tc-border-default));
    scrollbar-width: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-drp__presets::-webkit-scrollbar { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__preset { flex: none; height: 32px; padding: 0 var(--tc-space-3, var(--_tc-space-3)); border-radius: var(--tc-radius-full, var(--_tc-radius-full)); box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-drp__presets .ui-drp__pill { border-radius: var(--tc-radius-full, var(--_tc-radius-full)); }
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
:where([data-look="standard"], [data-look="standard"] *).ui-drp__cal { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
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
    gap: var(--tc-space-1, var(--_tc-space-1));
    padding: var(--tc-space-2, var(--_tc-space-2));
    overflow-x: auto;
    border-right: 0;
    border-bottom: 0.5px solid var(--tc-border-default, var(--_tc-border-default));
    scrollbar-width: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-drp__presets::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset { height: auto; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5)); box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__preset-custom { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__months { grid-template-columns: 1fr; justify-items: center; }
  /* One month: the one the range ends in */
:where([data-look="clean"], [data-look="clean"] *).ui-drp__month:not([data-second]) { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__foot { flex-direction: column; align-items: stretch; padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__buttons { justify-content: flex-end; }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__compare { flex-wrap: wrap; }
}
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-drp__weekdays,
:where([data-look="clean"], [data-look="clean"] *).ui-drp__week { grid-template-columns: repeat(7, 1fr); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__cal { padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)); }
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
:where([data-look="clean"], [data-look="clean"] *).ui-drp__btn { height: 36px; padding: 0 var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-drp__segment { padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3, var(--_tc-space-3)); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-drp *, .ui-drp *::before, .ui-drp *::after { animation: none !important; transition: none !important; }
}
`;
