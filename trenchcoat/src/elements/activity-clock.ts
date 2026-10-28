import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { activityLevel, activityMix, activitySteps } from "./internal/activity-scale";
import { cardHead } from "./internal/card-head";
import { formatDate, isMac } from "./internal/util";

/*
 * <tc-activity-clock> – when activity happens, one clock per day: two rings of twelve hour segments, the inner ring
 * AM and the outer ring PM, each segment shaded by how much happened in that hour. 12 is at the top, so the 3 PM
 * segment sits where 3 is on a clock face, and each ring is labelled there: AM just inside the inner ring, PM just
 * outside the outer one. The shading is a few steps from empty to full (`levels`), scaled to the
 * busiest hour across every day shown (or `max`), so days compare at a glance; an hour with no data is outlined, not
 * shaded, so it never reads as quiet. The middle of a clock shows its day – the weekday and the date – or the hour
 * under the pointer or focus and its value; Enter or click selects an hour.
 *   · the clocks are a WAI-ARIA grid, a row per day: ← / → move an hour, ↑ / ↓ a day, Page Up / Down between AM and
 *     PM, Home / End to the day's first and last hour, ⌘/Ctrl+Home / End to the first and last hour shown; Enter or
 *     Space selects the hour, Escape clears it; Tab leaves the grid
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-activity-clock .days=${[{ date: Date.parse("2026-10-27"), values: [0, 0, 1, …24 values] }]}></tc-activity-clock>
 */

/** A clock face: Lucide (ISC, lucide.dev) */
const clockIcon = svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`;

export type ActivityDay = {
  /** The day, as epoch ms of any moment in it; it also identifies the day in `selected` */
  date: number;
  /** Shown under the clock; by default the weekday and the day of the month, e.g. "Tue 27" */
  label?: string;
  /** One value per hour from midnight – 24 of them; null (or missing) means no data for that hour */
  values: (number | null)[];
};
/** An hour of a day: the day's `date` and the hour from 0 (midnight) to 23 */
export type ActivityHourRef = { date: number; hour: number };

/** Details of the events */
export type ActivitySelectedChange = { selected: ActivityHourRef | null; value?: number | null };

const HOURS = 24;
/** The rings in viewBox units (0–100): inner AM, outer PM, and the gap between segments in degrees */
const RINGS = { am: [27, 37], pm: [38.5, 48.5] } as const;
const GAP = 1.4;
let uidCount = 0;

const hourName = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
const point = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(50 + r * Math.cos(a)).toFixed(3)} ${(50 + r * Math.sin(a)).toFixed(3)}`;
};
/** A ring segment from `a0` to `a1` degrees clockwise from 12 o'clock */
const arc = (r0: number, r1: number, a0: number, a1: number) =>
  `M${point(r1, a0)}A${r1} ${r1} 0 0 1 ${point(r1, a1)}L${point(r0, a1)}A${r0} ${r0} 0 0 0 ${point(r0, a0)}Z`;
/** Each hour's segment, worked out once */
const SEGMENTS = Array.from({ length: HOURS }, (_, h) => {
  const [r0, r1] = h < 12 ? RINGS.am : RINGS.pm;
  const a0 = (h % 12) * 30;
  return arc(r0, r1, a0 + GAP / 2, a0 + 30 - GAP / 2);
});

/**
 * Activity by hour, a clock per day: an AM ring and a PM ring of hour segments shaded by how busy each hour was, with
 * the day in the middle and an hour's value there on hover or focus.
 * @tag tc-activity-clock
 * @fires tc-selected-change - An hour was selected or cleared ({ selected, value }: ActivitySelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcActivityClock extends TcElement {
  static override ui = "aclk";

  /** The heading, and the grid's name */
  @property() accessor heading = "Activity";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The days, a clock each, in the order given */
  @property({ attribute: false }) accessor days: ActivityDay[] = [];
  /** The value that shades a segment fully; by default the busiest hour across every day shown */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** How many shades, counting empty: 5 is empty and four steps of activity */
  @property({ type: Number }) accessor levels = 5;
  /** What the values count, after the number: "12 events" */
  @property() accessor unit = "events";
  /** Writes a value in full, e.g. (v) => `${v} min active`; replaces the number and `unit` */
  @property({ attribute: false }) accessor format: ((value: number) => string) | undefined = undefined;
  /** The selected hour. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: ActivityHourRef | null = null;
  /** The language for day names and numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active = { d: 0, h: 0 };
  @state() private accessor hover: { d: number; h: number } | null = null;
  @state() private accessor announce = "";

  private uid = `tc-aclk-${++uidCount}`;

  /* ---------- The model ---------- */

  private valueOf(d: number, h: number) {
    const v = this.days[d]?.values[h];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  /** The value a full segment stands for */
  private get top() {
    if (this.max !== undefined && this.max > 0) return this.max;
    let top = 0;
    for (let d = 0; d < this.days.length; d++) for (let h = 0; h < HOURS; h++) top = Math.max(top, this.valueOf(d, h) ?? 0);
    return top || 1;
  }
  private get steps() {
    return activitySteps(this.levels);
  }
  private levelOf(v: number | null) {
    return activityLevel(v, this.top, this.steps);
  }
  private mix(level: number) {
    return activityMix(level, this.steps);
  }
  private say(v: number | null) {
    if (v === null) return "no data";
    return this.format ? this.format(v) : `${new Intl.NumberFormat(this.locale).format(v)} ${this.unit}`;
  }
  /** The middle of a clock: the weekday (or the day's label) over the day of the month */
  private dayFace(day: ActivityDay) {
    const at = new Date(day.date);
    return { top: day.label ?? formatDate(at, this.locale, { weekday: "short" }), date: formatDate(at, this.locale, { day: "numeric" }) };
  }
  private dayLabel(day: ActivityDay) {
    if (day.label) return day.label;
    const at = new Date(day.date);
    return `${formatDate(at, this.locale, { weekday: "short" })} ${at.getDate()}`;
  }
  private dayName(day: ActivityDay) {
    return day.label ?? formatDate(new Date(day.date), this.locale, { weekday: "long", month: "long", day: "numeric" });
  }
  /** The busiest hour shown, for the header */
  private get peak() {
    let best: { d: number; h: number; v: number } | null = null;
    for (let d = 0; d < this.days.length; d++)
      for (let h = 0; h < HOURS; h++) {
        const v = this.valueOf(d, h);
        if (v !== null && v > 0 && (!best || v > best.v)) best = { d, h, v };
      }
    return best;
  }
  private isSelected(d: number, h: number) {
    return !!this.selected && this.selected.hour === h && this.days[d]?.date === this.selected.date;
  }

  private setSelected(next: ActivityHourRef | null) {
    const same = (a: ActivityHourRef | null, b: ActivityHourRef | null) => a?.date === b?.date && a?.hour === b?.hour;
    if (same(next, this.selected)) return;
    const d = next ? this.days.findIndex((x) => x.date === next.date) : -1;
    const value = next ? this.valueOf(d, next.hour) : undefined;
    if (!this.emit<ActivitySelectedChange>("tc-selected-change", { selected: next, value }, { cancelable: true })) return;
    this.selected = next;
    this.announce = next && d >= 0 ? `Selected ${this.dayName(this.days[d])}, ${this.hourRange(next.hour)}: ${this.say(value ?? null)}` : "Selection cleared";
  }
  private hourRange(h: number) {
    return `${hourName(h)} to ${hourName((h + 1) % HOURS)}`;
  }

  /* ---------- Keyboard: the grid ---------- */

  private focusHour(d: number, h: number) {
    if (!this.days.length) return;
    this.active = { d: Math.max(0, Math.min(this.days.length - 1, d)), h: Math.max(0, Math.min(HOURS - 1, h)) };
    void this.updateComplete.then(() => this.querySelector<SVGElement>(`[data-hour="${this.active.d}:${this.active.h}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const seg = (e.target as Element).closest?.<SVGElement>("[data-hour]");
    if (!seg || e.isComposing || e.altKey) return;
    const [d, h] = seg.dataset.hour!.split(":").map(Number);
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [d, h - 1],
      ArrowRight: [d, h + 1],
      ArrowUp: [d - 1, h],
      ArrowDown: [d + 1, h],
      PageUp: [d, h < 12 ? h + 12 : h - 12],
      PageDown: [d, h < 12 ? h + 12 : h - 12],
      Home: mod ? [0, 0] : [d, 0],
      End: mod ? [this.days.length - 1, HOURS - 1] : [d, HOURS - 1],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.focusHour(move[0], move[1]);
      return;
    }
    if (e.metaKey || e.ctrlKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.toggle(d, h);
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  private toggle(d: number, h: number) {
    const day = this.days[d];
    if (!day) return;
    this.setSelected(this.isSelected(d, h) ? null : { date: day.date, hour: h });
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The tab stop stays on a day that's still shown
    if (this.active.d >= this.days.length) this.active = { d: Math.max(0, this.days.length - 1), h: this.active.h };
    if (this.hover && this.hover.d >= this.days.length) this.hover = null;
    // A selected hour whose day went away clears
    if (this.selected && !this.days.some((x) => x.date === this.selected!.date)) this.selected = null;
  }

  /* ---------- Rendering ---------- */

  private renderClock(day: ActivityDay, d: number) {
    // The middle shows the hour under the pointer or focus, else the selected hour of this day, else the day
    const sel = this.selected && this.selected.date === day.date ? this.selected.hour : null;
    const shown = this.hover?.d === d ? this.hover.h : sel;
    const value = shown === null ? null : this.valueOf(d, shown);
    const face = this.dayFace(day);
    return html`<div class="ui-aclk__day" role="row" aria-label=${this.dayName(day)}>
      <div class="ui-aclk__clock">
        <svg class="ui-aclk__face" viewBox="0 0 100 100" role="none" @pointerleave=${() => (this.hover = null)}>
          <g aria-hidden="true">
            ${[90, 180, 270].map((a) => svg`<path class="ui-aclk__tick" d=${`M${point(49.25, a)}L${point(50.5, a)}`}></path>`)}
          </g>
          ${SEGMENTS.map((path, h) => {
            const v = this.valueOf(d, h);
            const level = this.levelOf(v);
            const isActive = this.active.d === d && this.active.h === h;
            const isSel = this.isSelected(d, h);
            return svg`<path
              class="ui-aclk__seg"
              role="gridcell"
              d=${path}
              data-hour=${`${d}:${h}`}
              data-ring=${h < 12 ? "am" : "pm"}
              data-level=${level < 0 ? "none" : level}
              style=${ifDefined(level > 0 ? `--tc-aclk-mix: ${this.mix(level)}%` : undefined)}
              tabindex=${isActive ? 0 : -1}
              aria-label=${`${this.hourRange(h)}, ${this.say(v)}`}
              aria-selected=${isSel ? "true" : "false"}
              ?data-selected=${isSel}
              @focus=${() => {
                if (!isActive) this.active = { d, h };
                this.hover = { d, h };
              }}
              @blur=${() => {
                if (this.hover?.d === d && this.hover.h === h) this.hover = null;
              }}
              @pointerenter=${() => (this.hover = { d, h })}
              @pointerdown=${(e: PointerEvent) => {
                this.active = { d, h };
                if (e.pointerType === "mouse") e.preventDefault();
                (e.currentTarget as SVGElement).focus({ preventScroll: true });
              }}
              @click=${() => {
                this.active = { d, h };
                this.toggle(d, h);
              }}
            ></path>`;
          })}
        </svg>
        <span class="ui-aclk__ring-label" data-ring="pm" aria-hidden="true">PM</span>
        <span class="ui-aclk__ring-label" data-ring="am" aria-hidden="true">AM</span>
        <div class="ui-aclk__centre" aria-hidden="true">
          ${shown === null
            ? html`<span class="ui-aclk__centre-label ui-aclk__weekday">${face.top}</span><span class="ui-aclk__centre-value ui-aclk__date">${face.date}</span>`
            : html`<span class="ui-aclk__centre-label">${hourName(shown)}</span><span class="ui-aclk__centre-value">${value === null ? "–" : new Intl.NumberFormat(this.locale, { notation: "compact" }).format(value)}</span>`}
        </div>
      </div>
    </div>`;
  }

  private renderLegend() {
    const s = this.steps;
    const anyMissing = this.days.some((_, d) => Array.from({ length: HOURS }, (_, h) => this.valueOf(d, h)).includes(null));
    return html`<div class="ui-aclk__legend">
      <span class="ui-aclk__scale">
        <span>Less</span>
        <span class="ui-aclk__swatches" aria-hidden="true">
          ${Array.from({ length: s + 1 }, (_, l) => html`<span class="ui-aclk__swatch" data-level=${l} style=${ifDefined(l > 0 ? `--tc-aclk-mix: ${this.mix(l)}%` : undefined)}></span>`)}
        </span>
        <span>More</span>
      </span>
      ${anyMissing ? html`<span class="ui-aclk__key"><span class="ui-aclk__swatch" data-level="none" aria-hidden="true"></span>No data</span>` : nothing}
      <span class="ui-aclk__key">
        <svg class="ui-aclk__rings" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.25"></circle><circle cx="8" cy="8" r="6.5"></circle></svg>
        Inner ring AM, outer ring PM
      </span>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const empty = !this.days.length;
    const peak = this.peak;
    return html`
      <span class="ui-aclk__sr" role="status">${this.announce}</span>
      <span class="ui-aclk__sr" id=${`${id}-keys`}>Left and right arrows move an hour, up and down a day; Enter selects the hour</span>
      ${cardHead({
        icon: clockIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: peak
          ? html`<span class="ui-aclk__peak"><span class="ui-aclk__peak-label">Busiest</span><span class="ui-aclk__peak-value">${this.dayLabel(this.days[peak.d])}, ${hourName(peak.h)}</span></span>`
          : nothing,
      })}
      <div class="ui-aclk__card">
        ${empty
          ? html`<p class="ui-aclk__empty">No activity to show yet.</p>`
          : html`<div class="ui-aclk__grid" role="grid" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey}>
                ${repeat(this.days, (day) => day.date, (day, d) => this.renderClock(day, d))}
              </div>
              ${this.renderLegend()}`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="aclk"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="aclk"] {
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
/* The ink the segments are shaded with, and the empty track – override either on the element */
[data-ui="aclk"] { --tc-aclk-ink: var(--tc-chart-1); --tc-aclk-track: var(--tc-fill-default); }
[data-ui="aclk"] *, [data-ui="aclk"] *::before, [data-ui="aclk"] *::after { box-sizing: border-box; }
[data-ui="aclk"] p { margin: 0; }
[data-ui="aclk"] svg { display: block; flex: none; }
.ui-aclk__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-aclk__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's busiest hour ----- */
.ui-aclk__peak { display: grid; flex: none; justify-items: end; }
.ui-aclk__peak-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-aclk__peak-value { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; }
/* ----- The clocks ----- */
.ui-aclk__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: var(--tc-space-4) var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-aclk__grid { padding-top: var(--tc-space-2); }
.ui-aclk__day { display: grid; justify-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-aclk__clock { position: relative; width: 100%; max-width: 160px; aspect-ratio: 1; margin-top: var(--tc-space-3-5); }
.ui-aclk__face { width: 100%; height: 100%; overflow: visible; }
.ui-aclk__tick { fill: none; stroke: var(--tc-border-strong); stroke-width: 1px; stroke-linecap: round; vector-effect: non-scaling-stroke; }
/* A segment: the track when nothing happened, the ink mixed in by level, outlined when there's no data */
.ui-aclk__seg { fill: var(--tc-aclk-track); stroke: transparent; stroke-width: 1px; vector-effect: non-scaling-stroke; cursor: pointer; outline: none; transition: fill var(--tc-duration-moderate) var(--tc-ease-standard), stroke var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aclk__seg:not([data-level="0"], [data-level="none"]) { fill: color-mix(in oklab, var(--tc-aclk-ink) var(--tc-aclk-mix), var(--tc-aclk-track)); }
.ui-aclk__seg[data-level="none"] { fill: transparent; stroke: var(--tc-border-default); stroke-dasharray: 2 2; }
.ui-aclk__seg:hover { stroke: var(--tc-border-strong); stroke-dasharray: none; }
.ui-aclk__seg[data-selected] { stroke: var(--tc-text-primary); stroke-width: 1.5px; stroke-dasharray: none; }
.ui-aclk__seg:focus-visible { stroke: var(--tc-focus-ring); stroke-width: var(--tc-focus-ring-width); stroke-dasharray: none; }
/* Which ring is which, at 12 o'clock: AM inside the inner ring, PM outside the outer one */
.ui-aclk__ring-label { position: absolute; left: 50%; font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); letter-spacing: var(--tc-tracking-caps); color: var(--tc-text-muted); pointer-events: none; transform: translateX(-50%); }
.ui-aclk__ring-label[data-ring="pm"] { bottom: calc(100% + var(--tc-space-1)); }
.ui-aclk__ring-label[data-ring="am"] { top: 25.5%; }
/* The middle: the weekday and date, or the hour under the pointer or focus and its value */
.ui-aclk__centre { position: absolute; inset: 30%; display: grid; place-content: center; justify-items: center; pointer-events: none; text-align: center; }
.ui-aclk__centre-label { font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; }
.ui-aclk__centre-value { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-aclk__weekday { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-aclk__weekday { font-weight: var(--tc-font-weight-medium); }
.ui-aclk__date { font-size: var(--tc-font-size-xl); letter-spacing: var(--tc-tracking-tight); }
/* ----- The legend: the shades, no data, and which ring is which ----- */
.ui-aclk__legend { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-4); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-aclk__scale, .ui-aclk__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-aclk__swatches { display: inline-flex; gap: var(--tc-space-0-5); }
.ui-aclk__swatch { display: inline-block; width: 12px; height: 12px; border-radius: var(--tc-radius-2xs); background: var(--tc-aclk-track); }
.ui-aclk__swatch:not([data-level="0"], [data-level="none"]) { background: color-mix(in oklab, var(--tc-aclk-ink) var(--tc-aclk-mix), var(--tc-aclk-track)); }
.ui-aclk__swatch[data-level="none"] { background: none; box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-aclk__rings { width: 14px; height: 14px; }
.ui-aclk__rings circle { fill: none; stroke: var(--tc-icon-muted); stroke-width: 2.5; }
.ui-aclk__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 420px) {
  .ui-aclk__grid { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); padding: var(--tc-space-3); }
  .ui-aclk__centre-value { font-size: var(--tc-font-size-sm); }
  .ui-aclk__date { font-size: var(--tc-font-size-lg); }
}
@media (forced-colors: active) {
  .ui-aclk__seg { stroke: CanvasText; }
  .ui-aclk__seg[data-selected], .ui-aclk__seg:focus-visible { stroke: Highlight; stroke-width: 2px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="aclk"] *, [data-ui="aclk"] *::before, [data-ui="aclk"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-activity-clock")) customElements.define("tc-activity-clock", TcActivityClock);

declare global {
  interface HTMLElementTagNameMap {
    "tc-activity-clock": TcActivityClock;
  }
}
