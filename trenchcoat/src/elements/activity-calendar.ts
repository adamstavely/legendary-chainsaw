import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { activityLevel, activityMix, activitySteps } from "./internal/activity-scale";
import { cardHead } from "./internal/card-head";
import { isMac } from "./internal/util";

/*
 * <tc-activity-calendar> – a year of activity at a glance: a column per week and a row per weekday, each day a small
 * square shaded by how much happened on it. Month names run along the top and weekday names down the side; the
 * newest week is on the right and scrolled into view. The shading is a few steps from empty to full (`levels`),
 * scaled to the busiest day shown (or `max`). Days missing from `days` count as nothing happened; a day given as
 * null has no data and is outlined, not shaded. The footer reads out the day under the pointer or focus; Enter or
 * click selects a day.
 *   · the calendar is a WAI-ARIA grid, a row per weekday: ↑ / ↓ move a day, ← / → a week, Page Up / Down four weeks,
 *     Home / End to the row's first and last week, ⌘/Ctrl+Home / End to the first and last day; Enter or Space
 *     selects the day, Escape clears it; Tab leaves the grid
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-activity-calendar .days=${[{ date: Date.parse("2026-10-27T12:00"), value: 4 }, …]}></tc-activity-calendar>
 */

/** A calendar: Lucide (ISC, lucide.dev) */
const calendarIcon = svg`<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>`;

export type ActivityCalendarDay = {
  /** The day, as epoch ms of any moment in it (local time) */
  date: number;
  /** How much happened; null means no data for the day */
  value: number | null;
};

/** Details of the events */
export type ActivityCalendarSelectedChange = {
  /** The selected day, as epoch ms of its local midnight; null when cleared */
  selected: number | null;
  value?: number | null;
};

let uidCount = 0;

/** Local midnight of the day `ms` falls in */
const dayStart = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
/** `n` calendar days after `ms` (local midnight), safe across daylight-saving changes */
const addDays = (ms: number, n: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime();
};

/**
 * A year of activity, a square per day in a column per week, shaded by how much happened – with month and weekday
 * names, a total, and the day's value on hover or focus.
 * @tag tc-activity-calendar
 * @fires tc-selected-change - A day was selected or cleared ({ selected, value }: ActivityCalendarSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcActivityCalendar extends TcElement {
  static override ui = "acal";

  /** The heading, and the grid's name */
  @property() accessor heading = "Activity";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The days with activity, in any order; a day not listed counts as 0 */
  @property({ attribute: false }) accessor days: ActivityCalendarDay[] = [];
  /** The last day shown, as epoch ms of any moment in it; by default the latest day in `days` */
  @property({ type: Number }) accessor end: number | undefined = undefined;
  /** How many weeks to show, ending with the week of `end` */
  @property({ type: Number }) accessor weeks = 53;
  /** The first day of the week, as the first row: 0 Sunday, 1 Monday … 6 Saturday */
  @property({ type: Number, attribute: "week-start" }) accessor weekStart = 0;
  /** The value that shades a day fully; by default the busiest day shown */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** How many shades, counting empty: 5 is empty and four steps of activity */
  @property({ type: Number }) accessor levels = 5;
  /** What the values count, after the number: "12 events" */
  @property() accessor unit = "events";
  /** Writes a value in full, e.g. (v) => `${v} reviews`; replaces the number and `unit` */
  @property({ attribute: false }) accessor format: ((value: number) => string) | undefined = undefined;
  /** The selected day, as epoch ms of its local midnight. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: number | null = null;
  /** The language for month, weekday and number names, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The focusable day, as its column and row */
  @state() private accessor active: { c: number; r: number } | null = null;
  @state() private accessor hover: number | null = null;
  @state() private accessor announce = "";

  private uid = `tc-acal-${++uidCount}`;
  private scrolledFor = "";

  /* ---------- The model ---------- */

  /** Each day's value by its local midnight */
  private get byDay() {
    const map = new Map<number, number | null>();
    for (const d of this.days) {
      const v = typeof d.value === "number" && Number.isFinite(d.value) ? d.value : null;
      const k = dayStart(d.date);
      // Two entries for one day add up; null only when every entry is null
      const was = map.get(k);
      map.set(k, was === undefined ? v : v === null ? was : (was ?? 0) + v);
    }
    return map;
  }
  /** The last day shown, the first column's first day, and how many columns */
  private get range() {
    const last = this.end !== undefined ? dayStart(this.end) : this.days.length ? Math.max(...this.days.map((d) => dayStart(d.date))) : null;
    if (last === null) return null;
    const ws = ((Math.round(this.weekStart) % 7) + 7) % 7;
    const cols = Math.max(1, Math.round(this.weeks) || 53);
    const lastCol = addDays(last, -((new Date(last).getDay() - ws + 7) % 7));
    return { last, first: addDays(lastCol, -(cols - 1) * 7), cols, ws };
  }
  private dayAt(c: number, r: number) {
    const rg = this.range!;
    return addDays(rg.first, c * 7 + r);
  }
  private valueOf(day: number, map = this.byDay) {
    const v = map.get(day);
    return v === undefined ? 0 : v;
  }
  private get steps() {
    return activitySteps(this.levels);
  }
  private top(map: Map<number, number | null>, rg: { first: number; last: number }) {
    if (this.max !== undefined && this.max > 0) return this.max;
    let top = 0;
    for (const [k, v] of map) if (k >= rg.first && k <= rg.last && v !== null) top = Math.max(top, v);
    return top || 1;
  }
  private say(v: number | null) {
    if (v === null) return "No data";
    return this.format ? this.format(v) : `${new Intl.NumberFormat(this.locale).format(v)} ${this.unit}`;
  }
  private dayName(day: number) {
    return new Intl.DateTimeFormat(this.locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(day);
  }
  private inRange(c: number, r: number) {
    const rg = this.range;
    if (!rg || c < 0 || c >= rg.cols || r < 0 || r > 6) return false;
    return this.dayAt(c, r) <= rg.last;
  }

  private setSelected(next: number | null) {
    if (next === this.selected) return;
    const value = next === null ? undefined : this.valueOf(next);
    if (!this.emit<ActivityCalendarSelectedChange>("tc-selected-change", { selected: next, value }, { cancelable: true })) return;
    this.selected = next;
    this.announce = next === null ? "Selection cleared" : `Selected ${this.dayName(next)}: ${this.say(value ?? null)}`;
  }

  /* ---------- Keyboard: the grid ---------- */

  /** The tab stop: the active day, else the selected one, else the last day */
  private get stop() {
    const rg = this.range;
    if (!rg) return null;
    if (this.active && this.inRange(this.active.c, this.active.r)) return this.active;
    const at = (day: number) => {
      const i = Math.round((day - rg.first) / 86_400_000);
      // Whole days between local midnights; the rounding absorbs a daylight-saving hour
      const c = Math.floor(i / 7);
      return { c, r: i - c * 7 };
    };
    if (this.selected !== null && this.selected >= rg.first && this.selected <= rg.last) return at(this.selected);
    return at(rg.last);
  }

  private focusDay(c: number, r: number) {
    const rg = this.range;
    if (!rg) return;
    c = Math.max(0, Math.min(rg.cols - 1, c));
    r = Math.max(0, Math.min(6, r));
    // Past the last day, the last column ends early: stop on the last day
    if (!this.inRange(c, r)) {
      c = rg.cols - 1;
      r = Math.round((rg.last - addDays(rg.first, c * 7)) / 86_400_000);
    }
    this.active = { c, r };
    void this.updateComplete.then(() => {
      const cell = this.querySelector<HTMLElement>(`[data-cell="${c}:${r}"]`);
      cell?.focus({ preventScroll: true });
      cell?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }

  private onKey = (e: KeyboardEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!cell || e.isComposing || e.altKey) return;
    const [c, r] = cell.dataset.cell!.split(":").map(Number);
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    const rg = this.range!;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [c, r - 1],
      ArrowDown: [c, r + 1],
      ArrowLeft: [c - 1, r],
      ArrowRight: [c + 1, r],
      PageUp: [c - 4, r],
      PageDown: [c + 4, r],
      Home: mod ? [0, 0] : [0, r],
      End: mod ? [rg.cols - 1, 6] : [rg.cols - 1, r],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.focusDay(move[0], move[1]);
      return;
    }
    if (e.metaKey || e.ctrlKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const day = this.dayAt(c, r);
      this.setSelected(this.selected === day ? null : day);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const rg = this.range;
    if (this.active && !this.inRange(this.active.c, this.active.r)) this.active = null;
    if (this.selected !== null && (!rg || this.selected < rg.first || this.selected > rg.last)) this.selected = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // The newest week starts in view, and again whenever the range moves
    const rg = this.range;
    const key = rg ? `${rg.first}:${rg.cols}` : "";
    if (key && key !== this.scrolledFor) {
      this.scrolledFor = key;
      const scroll = this.querySelector<HTMLElement>(".ui-acal__scroll");
      if (scroll) scroll.scrollLeft = scroll.scrollWidth;
    }
  }

  /* ---------- Rendering ---------- */

  private renderGrid(rg: NonNullable<TcActivityCalendar["range"]>) {
    const id = this.uid;
    const map = this.byDay;
    const top = this.top(map, rg);
    const steps = this.steps;
    const stop = this.stop;
    const month = new Intl.DateTimeFormat(this.locale, { month: "short" });
    const weekday = new Intl.DateTimeFormat(this.locale, { weekday: "short" });
    // A month's name goes over the column holding its 1st (the first column takes the month it starts in), unless
    // the next name is too close for it to fit
    const starts: { c: number; day: number }[] = [{ c: 0, day: rg.first }];
    for (let c = 0; c < rg.cols; c++)
      for (let r = 0; r < 7; r++) {
        const day = this.dayAt(c, r);
        if (new Date(day).getDate() === 1 && day <= rg.last && (c > 0 || r === 0)) {
          if (c === 0) starts[0].day = day;
          else starts.push({ c, day });
        }
      }
    const names = new Map<number, string>();
    starts.forEach((s, i) => {
      if (starts[i + 1] === undefined || starts[i + 1].c - s.c >= 3) names.set(s.c, month.format(s.day));
    });
    return html`<div class="ui-acal__scroll">
      <table class="ui-acal__grid" role="grid" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey} @pointerleave=${() => (this.hover = null)}>
        <thead>
          <tr role="row">
            <td class="ui-acal__corner" role="presentation"></td>
            ${Array.from({ length: rg.cols }, (_, c) => html`<th class="ui-acal__month" role="columnheader" scope="col"><span aria-hidden=${names.has(c) ? "false" : "true"}>${names.get(c) ?? ""}</span><span class="ui-acal__sr">${names.has(c) ? "" : `Week of ${month.format(this.dayAt(c, 0))} ${new Date(this.dayAt(c, 0)).getDate()}`}</span></th>`)}
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 7 }, (_, r) => {
            const name = weekday.format(this.dayAt(0, r));
            return html`<tr role="row">
              <th class="ui-acal__weekday" role="rowheader" scope="row"><span aria-hidden="true" ?data-show=${r % 2 === 1}>${name}</span><span class="ui-acal__sr">${name}</span></th>
              ${Array.from({ length: rg.cols }, (_, c) => {
                const day = this.dayAt(c, r);
                if (day > rg.last) return html`<td class="ui-acal__cell" role="gridcell" data-out></td>`;
                const v = this.valueOf(day, map);
                const level = activityLevel(v, top, steps);
                const isStop = stop?.c === c && stop.r === r;
                const isSel = this.selected === day;
                return html`<td
                  class="ui-acal__cell"
                  role="gridcell"
                  data-cell=${`${c}:${r}`}
                  data-date=${day}
                  data-level=${level < 0 ? "none" : level}
                  style=${ifDefined(level > 0 ? `--tc-acal-mix: ${activityMix(level, steps)}%` : undefined)}
                  tabindex=${isStop ? 0 : -1}
                  aria-label=${`${this.say(v)}, ${this.dayName(day)}`}
                  aria-selected=${isSel ? "true" : "false"}
                  ?data-selected=${isSel}
                  @focus=${() => {
                    if (!isStop) this.active = { c, r };
                    this.hover = day;
                  }}
                  @blur=${() => {
                    if (this.hover === day) this.hover = null;
                  }}
                  @pointerenter=${() => (this.hover = day)}
                  @pointerdown=${(e: PointerEvent) => {
                    this.active = { c, r };
                    if (e.pointerType === "mouse") e.preventDefault();
                    (e.currentTarget as HTMLElement).focus({ preventScroll: true });
                  }}
                  @click=${() => {
                    this.active = { c, r };
                    this.setSelected(isSel ? null : day);
                  }}
                ><span class="ui-acal__sq" aria-hidden="true"></span></td>`;
              })}
            </tr>`;
          })}
        </tbody>
      </table>
    </div>`;
  }

  private renderFooter(rg: NonNullable<TcActivityCalendar["range"]>) {
    const steps = this.steps;
    const map = this.byDay;
    let missing = false;
    for (const [k, v] of map) if (v === null && k >= rg.first && k <= rg.last) missing = true;
    const shown = this.hover ?? this.selected;
    const short = new Intl.DateTimeFormat(this.locale, { weekday: "short", month: "short", day: "numeric" });
    return html`<div class="ui-acal__foot">
      <span class="ui-acal__readout" aria-hidden="true"
        >${shown === null
          ? html`<span class="ui-acal__readout-hint">Point at a day to see its activity</span>`
          : html`<span class="ui-acal__readout-value">${this.say(this.valueOf(shown, map))}</span> on ${short.format(shown)}`}</span
      >
      <span class="ui-acal__legend">
        ${missing ? html`<span class="ui-acal__key"><span class="ui-acal__swatch" data-level="none" aria-hidden="true"></span>No data</span>` : nothing}
        <span class="ui-acal__key">
          <span>Less</span>
          <span class="ui-acal__swatches" aria-hidden="true">
            ${Array.from({ length: steps + 1 }, (_, l) => html`<span class="ui-acal__swatch" data-level=${l} style=${ifDefined(l > 0 ? `--tc-acal-mix: ${activityMix(l, steps)}%` : undefined)}></span>`)}
          </span>
          <span>More</span>
        </span>
      </span>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const rg = this.range;
    let total = 0;
    if (rg) for (const [k, v] of this.byDay) if (k >= rg.first && k <= rg.last && v !== null) total += v;
    return html`
      <span class="ui-acal__sr" role="status">${this.announce}</span>
      <span class="ui-acal__sr" id=${`${id}-keys`}>Up and down arrows move a day, left and right a week; Enter selects the day</span>
      ${cardHead({
        icon: calendarIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: rg
          ? html`<span class="ui-acal__total"><span class="ui-acal__total-label">Total</span><span class="ui-acal__total-value">${this.say(total)}</span></span>`
          : nothing,
      })}
      <div class="ui-acal__card">${rg ? html`${this.renderGrid(rg)}${this.renderFooter(rg)}` : html`<p class="ui-acal__empty">No activity to show yet.</p>`}</div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="acal"] {
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
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="acal"] {
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
/* The ink the days are shaded with, the empty track, the size of a day and the gap between days – override any of them on the element */
[data-ui="acal"] { --tc-acal-ink: var(--tc-chart-1); --tc-acal-track: var(--tc-fill-default); --tc-acal-cell: 11px; --tc-acal-gap: 3px; }
[data-ui="acal"] *, [data-ui="acal"] *::before, [data-ui="acal"] *::after { box-sizing: border-box; }
[data-ui="acal"] p { margin: 0; }
[data-ui="acal"] svg { display: block; flex: none; }
.ui-acal__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-acal__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's total ----- */
.ui-acal__total { display: grid; flex: none; justify-items: end; }
.ui-acal__total-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-acal__total-value { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* ----- The calendar: weeks scroll sideways, the newest in view ----- */
/* No padding on the left: the sticky weekday column holds the inset, so weeks never show beside it */
.ui-acal__scroll { overflow-x: auto; padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-2) 0; scrollbar-width: thin; }
:where([data-look="clean"], [data-look="clean"] *).ui-acal__scroll { padding-top: var(--tc-space-2); }
.ui-acal__grid { border-collapse: separate; border-spacing: var(--tc-acal-gap); margin: calc(-1 * var(--tc-acal-gap)) calc(-1 * var(--tc-acal-gap)) calc(-1 * var(--tc-acal-gap)) 0; }
.ui-acal__grid th, .ui-acal__grid td { padding: 0; font-weight: inherit; }
.ui-acal__month { position: relative; height: 15px; text-align: left; vertical-align: bottom; }
.ui-acal__month > span[aria-hidden="false"] { position: absolute; left: 0; bottom: 0; font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-acal__weekday { padding-right: var(--tc-space-1-5) !important; font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-none); color: var(--tc-text-muted); text-align: left; white-space: nowrap; }
/* The weekday names stay put while the weeks scroll under them */
.ui-acal__weekday, .ui-acal__corner { position: sticky; left: 0; z-index: 1; padding-left: var(--tc-space-4) !important; box-shadow: 0 0 0 var(--tc-acal-gap) var(--tc-acal-bg); background: var(--tc-acal-bg); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="acal"] { --tc-acal-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="acal"] { --tc-acal-bg: var(--tc-surface-raised); }
.ui-acal__weekday > span[aria-hidden] { visibility: hidden; }
.ui-acal__weekday > span[data-show] { visibility: visible; }
/* A day: a small square, the track when nothing happened, the ink mixed in by level, outlined when there's no data */
.ui-acal__cell { width: var(--tc-acal-cell); height: var(--tc-acal-cell); cursor: pointer; outline: none; }
.ui-acal__cell[data-out] { cursor: default; }
.ui-acal__sq { display: block; width: var(--tc-acal-cell); height: var(--tc-acal-cell); border-radius: var(--tc-radius-2xs); background: var(--tc-acal-track); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-acal__cell:not([data-level="0"], [data-level="none"]) > .ui-acal__sq { background: color-mix(in oklab, var(--tc-acal-ink) var(--tc-acal-mix), var(--tc-acal-track)); }
.ui-acal__cell[data-level="none"] > .ui-acal__sq { background: none; box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-acal__cell:hover > .ui-acal__sq { box-shadow: inset 0 0 0 1px var(--tc-border-strong); }
.ui-acal__cell[data-selected] > .ui-acal__sq { box-shadow: 0 0 0 1.5px var(--tc-text-primary); }
.ui-acal__cell:focus-visible > .ui-acal__sq { outline: var(--tc-focus-outline); outline-offset: 1px; }
/* ----- The footer: the day under the pointer or focus, and the legend ----- */
.ui-acal__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1-5) var(--tc-space-4); padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-acal__readout { min-width: 0; color: var(--tc-text-secondary); }
.ui-acal__readout-value { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-acal__readout-hint { color: var(--tc-text-muted); }
.ui-acal__legend, .ui-acal__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-acal__legend { gap: var(--tc-space-4); }
.ui-acal__swatches { display: inline-flex; gap: var(--tc-acal-gap); }
.ui-acal__swatch { display: inline-block; width: var(--tc-acal-cell); height: var(--tc-acal-cell); border-radius: var(--tc-radius-2xs); background: var(--tc-acal-track); }
.ui-acal__swatch:not([data-level="0"], [data-level="none"]) { background: color-mix(in oklab, var(--tc-acal-ink) var(--tc-acal-mix), var(--tc-acal-track)); }
.ui-acal__swatch[data-level="none"] { background: none; box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-acal__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@media (pointer: coarse) {
  [data-ui="acal"] { --tc-acal-cell: 14px; }
}
@media (forced-colors: active) {
  .ui-acal__sq { border: 1px solid CanvasText; }
  .ui-acal__cell[data-selected] > .ui-acal__sq { box-shadow: 0 0 0 2px Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="acal"] *, [data-ui="acal"] *::before, [data-ui="acal"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-activity-calendar")) customElements.define("tc-activity-calendar", TcActivityCalendar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-activity-calendar": TcActivityCalendar;
  }
}
