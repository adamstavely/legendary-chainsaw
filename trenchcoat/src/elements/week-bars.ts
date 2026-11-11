import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { MotionController } from "./internal/chart/motion-controller";
import { RollingController } from "./internal/controllers";

/*
 * <tc-week-bars> – a week of daily totals as rounded bars, against an optional daily goal drawn as a dashed line. Days
 * that reach the goal take the accent and the rest stay quiet (the line shows which reached it, so colour isn't the only
 * cue). The headline is the week's total, counting up when it changes, with the average per day; pointing at a day (or
 * moving to it with the keys) outlines its bar, writes its value above it and rolls the headline to it. A switcher in
 * the header steps between weeks (`week`), and the bars glide from one week to the next. Every week shares one scale.
 *   · the plot is one tab stop: ← → move day to day, Home/End go to the ends, PageUp/PageDown step a week
 *   · a Table button swaps the bars for a table of the week's days
 *   · `today` marks a day of the last week; narrow, the day names shorten to their first letter
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-week-bars heading="Documents reviewed" goal="400" .weeks=${[{ label: "Mar 3–9", days: […] }]}></tc-week-bars>
 */

export type WeekBarsDay = {
  /** The day's name: "Mon" */
  label: string;
  value: number;
  /** The narrow name – by default the first letter of `label` */
  short?: string;
};

export type WeekBarsWeek = {
  /** The switcher's word for the week: "Mar 3–9" */
  label: string;
  /** Its days, in order – usually seven */
  days: WeekBarsDay[];
};

export type WeekBarsView = "chart" | "table";

/** Details of the events */
export type WeekBarsWeekChange = { week: number };
export type WeekBarsViewChange = { view: WeekBarsView };

export type WeekBarsLabels = {
  total: string;
  /** After the average: "412 a day" */
  perDay: string;
  goal: string;
  /** Read for a day at or over the goal, and under it */
  met: string;
  missed: string;
  today: string;
  previous: string;
  next: string;
  table: string;
  day: string;
  value: string;
  /** The keys, read when the plot is reached */
  keys: string;
  empty: string;
};

export const defaultWeekBarsLabels: WeekBarsLabels = {
  total: "Total",
  perDay: "a day",
  goal: "Goal",
  met: "goal met",
  missed: "under goal",
  today: "today",
  previous: "Previous week",
  next: "Next week",
  table: "Table",
  day: "Day",
  value: "Total",
  keys: "Arrow keys move between days; Page Up and Page Down change the week.",
  empty: "No days yet",
};

/** A bar chart: Lucide's chart-column (ISC, lucide.dev) */
const barsIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>`;
/** Lucide's chevron-left and chevron-right */
const prevIcon = svg`<path d="m15 18-6-6 6-6"></path>`;
const nextIcon = svg`<path d="m9 18 6-6-6-6"></path>`;

const INTEGER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** A scale top above `max` that reads cleanly: 1, 2, 2.5 or 5 times a power of ten, with room above the tallest bar */
function niceTop(max: number) {
  if (!(max > 0)) return 1;
  const raw = max * 1.08;
  const pow = 10 ** Math.floor(Math.log10(raw));
  for (const s of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * pow >= raw) return s * pow;
  return 10 * pow;
}

let uid = 0;

/**
 * A week of daily totals as bars against a goal line, with the week's total and average, a week switcher and a table view.
 * @tag tc-week-bars
 * @fires tc-week-change - The switcher or PageUp/PageDown moved to another week ({ week }: WeekBarsWeekChange); cancelable – prevented, `week` stays as it was
 * @fires tc-view-change - The Table button was pressed ({ view }: WeekBarsViewChange); cancelable – prevented, `view` stays as it was
 */
export class TcWeekBars extends TcElement {
  static override ui = "wkb";

  /** The heading, and the plot's name */
  @property() accessor heading = "Daily totals";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The weeks, oldest first, each with its days */
  @property({ attribute: false }) accessor weeks: WeekBarsWeek[] = [];
  /** The shown week's index; unset is the last (latest) week */
  @property({ type: Number }) accessor week: number | undefined = undefined;
  /** The daily goal, drawn as a dashed line; days at or over it take the accent */
  @property({ type: Number }) accessor goal: number | undefined = undefined;
  /** The index of today in the last week, marked under its bar */
  @property({ type: Number }) accessor today: number | undefined = undefined;
  /** Formats every value */
  @property({ attribute: false }) accessor format: (value: number) => string = (n) => INTEGER.format(n);
  /** The bars or the table */
  @property() accessor view: WeekBarsView = "chart";
  /** Draws everything where it ends, with no entrance or glide */
  @property({ type: Boolean }) accessor still = false;
  /** Words the page can rename, merged over `defaultWeekBarsLabels` */
  @property({ attribute: false }) accessor labels: Partial<WeekBarsLabels> = {};

  /** @internal The day under the pointer or the keys */
  @state() accessor active: number | null = null;
  /** @internal The active day came from the keys: it's announced */
  @state() accessor byKeys = false;
  /** @internal The card has come on screen */
  @state() accessor onScreen = false;

  private readonly uid = `tc-wkb-${++uid}`;
  private top = 1;
  private readonly motion = new MotionController<number>(this);
  private readonly rolling = new RollingController(this, () => this.figures(), 560);
  private io?: IntersectionObserver;

  /** @internal The words, the page's over the defaults */
  get words(): WeekBarsLabels {
    return { ...defaultWeekBarsLabels, ...this.labels };
  }

  /** The shown week's index (the last when `week` is unset or out of range) */
  get shownWeek(): number {
    const n = this.weeks.length;
    if (!n) return 0;
    const w = this.week;
    return w !== undefined && Number.isInteger(w) && w >= 0 && w < n ? w : n - 1;
  }

  /** @internal The shown week's days */
  private get days(): WeekBarsDay[] {
    return this.weeks[this.shownWeek]?.days ?? [];
  }

  /** @internal The numbers the headline rolls: the total (or the active day) and the average */
  private figures() {
    const days = this.days;
    const total = days.reduce((a, d) => a + Math.max(0, d.value || 0), 0);
    const at = this.active !== null ? days[this.active] : undefined;
    return { figure: at ? Math.max(0, at.value || 0) : total, average: days.length ? total / days.length : 0 };
  }

  override connectedCallback() {
    super.connectedCallback();
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((entries) => {
        if (entries[entries.length - 1].isIntersecting) {
          this.onScreen = true;
          this.io?.disconnect();
        }
      });
      this.io.observe(this);
    } else this.onScreen = true;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const all = this.weeks.flatMap((w) => w.days.map((d) => d.value || 0));
    this.top = niceTop(Math.max(0, ...all, this.goal ?? 0));
    const days = this.days;
    if (this.active !== null && this.active >= days.length) this.active = null;
    const enabled = !this.still && !reducedMotion();
    this.motion.sync(
      days.map((d, i) => ({ key: `d:${i}`, to: [Math.max(0, d.value || 0) / this.top], from: [0], enter: [0], delay: i * 45, data: i })),
      { enabled, active: this.onScreen, dataKey: `${this.shownWeek}|${days.map((d) => d.value).join(",")}`, easing: "spring", duration: 760, stagger: 30 },
    );
  }

  /** Plays the entrance again */
  replay() {
    this.motion.replay();
  }

  private goTo(week: number) {
    const n = this.weeks.length;
    if (week < 0 || week >= n || week === this.shownWeek) return;
    if (!this.emit<WeekBarsWeekChange>("tc-week-change", { week }, { cancelable: true })) return;
    this.week = week;
  }

  private setView(view: WeekBarsView) {
    if (view === this.view) return;
    if (!this.emit<WeekBarsViewChange>("tc-view-change", { view }, { cancelable: true })) return;
    this.view = view;
  }

  private onKey = (e: KeyboardEvent) => {
    const n = this.days.length;
    if (!n) return;
    const cur = this.active;
    let next: number | null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = cur === null ? 0 : Math.min(n - 1, cur + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = cur === null ? n - 1 : Math.max(0, cur - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = n - 1;
        break;
      case "PageUp":
        e.preventDefault();
        this.goTo(this.shownWeek - 1);
        return;
      case "PageDown":
        e.preventDefault();
        this.goTo(this.shownWeek + 1);
        return;
      case "Escape":
        if (cur === null) return;
        next = null;
        break;
      default:
        return;
    }
    e.preventDefault();
    this.active = next;
    this.byKeys = next !== null;
  };

  /** @internal A day in words: "Tue: 412, goal met, today" */
  private dayText(d: WeekBarsDay, i: number) {
    const w = this.words;
    const goal = this.goal;
    const parts = [`${d.label}: ${this.format(d.value || 0)}`];
    if (goal !== undefined) parts.push((d.value || 0) >= goal ? w.met : w.missed);
    if (this.isToday(i)) parts.push(w.today);
    return parts.join(", ");
  }

  private isToday(i: number) {
    return this.today === i && this.shownWeek === this.weeks.length - 1;
  }

  private renderTable() {
    const w = this.words;
    const goal = this.goal;
    return html`<div class="ui-wkb__scroll">
      <table class="ui-wkb__table">
        <caption class="tc-sr-only">${this.heading} · ${this.weeks[this.shownWeek]?.label ?? ""}</caption>
        <thead><tr><th scope="col">${w.day}</th><th scope="col">${w.value}</th>${goal !== undefined ? html`<th scope="col">${w.goal} ${this.format(goal)}</th>` : nothing}</tr></thead>
        <tbody>
          ${this.days.map(
            (d, i) => html`<tr>
              <th scope="row">${d.label}${this.isToday(i) ? html` <span class="ui-wkb__tag">${w.today}</span>` : nothing}</th>
              <td>${this.format(d.value || 0)}</td>
              ${goal !== undefined ? html`<td data-text>${(d.value || 0) >= goal ? w.met : w.missed}</td>` : nothing}
            </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }

  private renderPlot() {
    const w = this.words;
    const days = this.days;
    const goal = this.goal;
    const id = this.uid;
    const total = days.reduce((a, d) => a + Math.max(0, d.value || 0), 0);
    const summary = `${this.weeks[this.shownWeek]?.label ?? ""}: ${days.map((d, i) => this.dayText(d, i)).join("; ")}. ${w.total} ${this.format(total)}.`;
    const activeDay = this.active !== null ? days[this.active] : undefined;
    return html`<div
        class="ui-wkb__plot"
        role="group"
        tabindex="0"
        aria-roledescription="bar chart"
        aria-labelledby=${`${id}-title`}
        aria-describedby=${`${id}-read ${id}-keys`}
        ?data-active=${this.active !== null}
        @keydown=${this.onKey}
        @pointerleave=${() => {
          if (!this.byKeys) this.active = null;
        }}
        @focusout=${() => {
          if (this.byKeys) {
            this.active = null;
            this.byKeys = false;
          }
        }}
      >
        ${goal !== undefined
          ? html`<div class="ui-wkb__goal" aria-hidden="true" style=${styleMap({ top: `calc(var(--tc-wkb-plot-h) * ${(1 - Math.min(1, goal / this.top)).toFixed(4)})` })}>
              <span class="ui-wkb__goal-label">${w.goal} ${this.format(goal)}</span>
            </div>`
          : nothing}
        <ol class="ui-wkb__bars" aria-hidden="true">
          ${days.map((d, i) => {
            const h = this.motion.get(`d:${i}`)?.[0] ?? (d.value || 0) / this.top;
            const met = goal === undefined || (d.value || 0) >= goal;
            const on = this.active === i;
            return html`<li class="ui-wkb__day" ?data-on=${on} ?data-met=${met} ?data-today=${this.isToday(i)} @pointerenter=${() => {
              this.active = i;
              this.byKeys = false;
            }}>
              <span class="ui-wkb__col">
                <span class="ui-wkb__bar" style=${styleMap({ height: `${Math.max(0, Math.min(1, h)) * 100}%` })}>
                  ${on ? html`<span class="ui-wkb__value">${this.format(d.value || 0)}</span>` : nothing}
                </span>
              </span>
              <span class="ui-wkb__label"><span class="ui-wkb__long">${d.label}</span><span class="ui-wkb__short">${d.short ?? d.label.slice(0, 1)}</span></span>
            </li>`;
          })}
        </ol>
      </div>
      <span class="tc-sr-only" id=${`${id}-read`}>${summary}</span>
      <span class="tc-sr-only" id=${`${id}-keys`}>${w.keys}</span>
      <span class="tc-sr-only" role="status">${this.byKeys && activeDay && this.active !== null ? `${this.dayText(activeDay, this.active)}, ${this.active + 1} of ${days.length}` : ""}</span>`;
  }

  protected override render() {
    const w = this.words;
    const id = this.uid;
    const n = this.weeks.length;
    const wk = this.shownWeek;
    const days = this.days;
    const has = days.length > 0;
    const table = this.view === "table" && has;
    const exact = this.figures();
    const rolled = this.still ? exact : { figure: this.rolling.shown.figure ?? exact.figure, average: this.rolling.shown.average ?? exact.average };
    const activeDay = this.active !== null ? days[this.active] : undefined;
    const aside = html`${n > 1
        ? html`<div class="ui-wkb__switch">
            <button type="button" class="ui-wkb__step" ?disabled=${wk <= 0} @click=${() => this.goTo(wk - 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">${prevIcon}</svg><span class="tc-sr-only">${w.previous}</span>
            </button>
            <span class="ui-wkb__week" aria-live="polite">${this.weeks[wk]?.label}</span>
            <button type="button" class="ui-wkb__step" ?disabled=${wk >= n - 1} @click=${() => this.goTo(wk + 1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">${nextIcon}</svg><span class="tc-sr-only">${w.next}</span>
            </button>
          </div>`
        : nothing}${has
        ? html`<button type="button" class="tc-btn-sm ui-wkb__toggle" aria-pressed=${table ? "true" : "false"} @click=${() => this.setView(table ? "chart" : "table")}>${w.table}</button>`
        : nothing}`;
    return html`${cardHead({ icon: barsIcon, title: this.heading, subtitle: this.description, id: `${id}-title`, aside })}
      <div class="ui-wkb__card">
        ${has
          ? html`<div class="ui-wkb__figure">
                <p class="ui-wkb__big">${this.format(Math.round(rolled.figure))}</p>
                <p class="ui-wkb__caption">
                  ${activeDay ? html`<span>${activeDay.label}</span>` : html`<span>${w.total}</span> <span class="ui-wkb__dot" aria-hidden="true">·</span> <span>${this.format(Math.round(rolled.average))} ${w.perDay}</span>`}
                </p>
              </div>
              ${table ? this.renderTable() : this.renderPlot()}`
          : html`<p class="ui-wkb__empty">${w.empty}</p>`}
      </div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wkb"] {
  position: relative;
  display: block;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="wkb"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The inks and the plot's height – override any of them on the element */
[data-ui="wkb"] {
  --tc-wkb-met: var(--tc-chart-1);
  --tc-wkb-rest: var(--tc-chart-neutral);
  --tc-wkb-goal: var(--tc-text-muted);
  --tc-wkb-plot-h: 168px;
}
[data-ui="wkb"] *, [data-ui="wkb"] *::before, [data-ui="wkb"] *::after { box-sizing: border-box; }
:where([data-ui="wkb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="wkb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="wkb"]) :is(p, ol) { margin: 0; padding: 0; }
:where([data-ui="wkb"]) ol { list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-wkb__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-wkb__card { padding: var(--tc-space-1) var(--tc-space-4) var(--tc-space-4); }
/* The week switcher: previous, the week, next */
.ui-wkb__switch { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); }
.ui-wkb__step { display: inline-grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-wkb__step:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-wkb__step:disabled { color: var(--tc-text-disabled); cursor: default; }
.ui-wkb__step svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-wkb__week { min-width: 8ch; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; text-align: center; white-space: nowrap; }
.ui-wkb__toggle[aria-pressed="true"] { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); box-shadow: none; }
/* The headline */
.ui-wkb__figure { display: grid; gap: var(--tc-space-0-5); margin-bottom: var(--tc-space-4); }
.ui-wkb__big { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-wkb__big { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
.ui-wkb__caption { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); min-height: 18px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* The plot: the bars over a goal line, each day's name under its bar */
.ui-wkb__plot { position: relative; border-radius: var(--tc-radius-sm); }
.ui-wkb__plot:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-wkb__bars { position: relative; display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: var(--tc-space-2); }
.ui-wkb__day { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-wkb__col { position: relative; display: flex; align-items: flex-end; justify-content: center; height: var(--tc-wkb-plot-h); }
.ui-wkb__bar { position: relative; display: block; width: min(100%, 40px); min-height: 2px; border-radius: var(--tc-radius-md) var(--tc-radius-md) var(--tc-radius-xs) var(--tc-radius-xs); background: var(--tc-wkb-rest); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-wkb__day[data-met] .ui-wkb__bar { background: var(--tc-wkb-met); }
/* The pointed-at day: an outline round its bar and its value above it; the others quieten (by colour) */
.ui-wkb__day[data-on] .ui-wkb__bar { box-shadow: 0 0 0 2px var(--tc-surface-raised), 0 0 0 4px var(--tc-text-primary); }
.ui-wkb__plot[data-active] .ui-wkb__day:not([data-on]) .ui-wkb__bar { background: color-mix(in oklab, var(--tc-wkb-rest) 70%, var(--tc-surface-raised)); }
.ui-wkb__plot[data-active] .ui-wkb__day[data-met]:not([data-on]) .ui-wkb__bar { background: color-mix(in oklab, var(--tc-wkb-met) 45%, var(--tc-surface-raised)); }
.ui-wkb__value { position: absolute; bottom: calc(100% + var(--tc-space-1-5)); left: 50%; padding: var(--tc-space-0-5) var(--tc-space-1-5); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; white-space: nowrap; transform: translateX(-50%); pointer-events: none; }
.ui-wkb__label { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); text-align: center; white-space: nowrap; text-overflow: ellipsis; }
.ui-wkb__short { display: none; }
.ui-wkb__day[data-on] .ui-wkb__label { color: var(--tc-text-primary); }
/* Today: its name in the strong weight, with a dot under it */
.ui-wkb__day[data-today] .ui-wkb__label { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
.ui-wkb__day[data-today] .ui-wkb__label::after { content: ""; display: block; width: 4px; height: 4px; margin: var(--tc-space-0-5) auto 0; border-radius: var(--tc-radius-full); background: currentColor; }
/* The goal: a dashed rule across the bars' area (measured from its top, where the bars' columns start), named at its right end */
.ui-wkb__goal { position: absolute; left: 0; right: 0; z-index: 1; height: 0; border-top: 1px dashed var(--tc-wkb-goal); pointer-events: none; }
.ui-wkb__goal-label { position: absolute; right: 0; bottom: var(--tc-space-0-5); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-wkb__goal-label { background: var(--tc-surface-on-tray); }
/* The table view */
.ui-wkb__scroll { overflow-x: auto; scrollbar-width: thin; }
.ui-wkb__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-wkb__table th, .ui-wkb__table td { padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: 1px solid var(--tc-border-subtle); text-align: right; white-space: nowrap; }
.ui-wkb__table th { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-wkb__table th[scope="row"], .ui-wkb__table thead th:first-child, .ui-wkb__table td[data-text] { text-align: left; color: var(--tc-text-secondary); }
.ui-wkb__table td { color: var(--tc-text-primary); }
.ui-wkb__tag { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-wkb__empty { padding: var(--tc-space-6) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
/* Narrow: the days go to their first letter, the bars sit closer */
@container (max-width: 360px) {
  .ui-wkb__long { display: none; }
  .ui-wkb__short { display: inline; }
  .ui-wkb__bars { gap: var(--tc-space-1-5); }
}
@media (forced-colors: active) {
  .ui-wkb__bar { forced-color-adjust: none; background: GrayText; }
  .ui-wkb__day[data-met] .ui-wkb__bar { background: CanvasText; }
  .ui-wkb__day[data-on] .ui-wkb__bar { outline: 2px solid Highlight; outline-offset: 2px; }
  .ui-wkb__goal { border-top-color: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="wkb"] *, [data-ui="wkb"] *::before, [data-ui="wkb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-week-bars")) customElements.define("tc-week-bars", TcWeekBars);

declare global {
  interface HTMLElementTagNameMap {
    "tc-week-bars": TcWeekBars;
  }
}
