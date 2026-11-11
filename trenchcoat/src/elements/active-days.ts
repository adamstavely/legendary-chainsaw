import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-active-days> – how many days met their goal, month by month. A calendar that runs on down the page, a block per
 * month under a name that sticks while it scrolls, each day its date inside a small ring filled to how much of the
 * daily goal it reached – a full ring and a check when it met it, an empty track when there's no data, nothing on days
 * still to come. Above it, for the month in view: how many days met the goal, the best streak and the busiest weekday.
 * The day under the pointer or focus is read out below with its share of the goal; Enter or a click selects it.
 *   · the calendar is a WAI-ARIA grid: ← / → move a day, ↑ / ↓ a week, Home / End to the week's ends, Page Up /
 *     Down a month; Enter or Space selects the day (again clears it), Escape clears it; Tab leaves the grid
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row. When
 * narrow, the rings shrink and the numbers stay the same size.
 *
 *   <tc-active-days goal="40" .days=${[{ date: "2026-10-27", value: 44 }, …]}></tc-active-days>
 */

/** A calendar with a check: Lucide (ISC, lucide.dev) */
const calendarCheckIcon = svg`<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path><path d="m9 16 2 2 4-4"></path>`;

export type ActiveDaysDay = {
  /** The day, "YYYY-MM-DD" */
  date: string;
  /** How much happened; null means no data for the day */
  value: number | null;
};

/** Details of the events */
export type ActiveDaysDateChange = {
  /** The selected day, "YYYY-MM-DD"; null when cleared */
  date: string | null;
  value?: number | null;
};

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n: number) => String(n).padStart(2, "0");
/** "YYYY-MM-DD" for a local date */
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** A local date at noon (safe across daylight-saving changes) from "YYYY-MM-DD", or null */
const parse = (s: string | null | undefined) => {
  const m = typeof s === "string" ? ISO.exec(s) : null;
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], 12);
  return d.getMonth() === +m[2] - 1 ? d : null;
};
const addDays = (s: string, n: number) => {
  const d = parse(s)!;
  return isoOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12));
};
/** The same day `n` months on, kept within the shorter month */
const addMonths = (s: string, n: number) => {
  const d = parse(s)!;
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return isoOf(new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last), 12));
};
const monthKey = (s: string) => s.slice(0, 7);

/** The mini ring's geometry, in viewBox units */
const RING_R = 15;
const RING_C = 2 * Math.PI * RING_R;

let uidCount = 0;

type Month = { key: string; first: string; days: number; weeks: (string | null)[][] };

/**
 * A month calendar of rings, each day filled to how much of its goal it met – with the month's goal days, best
 * streak and busiest weekday, and the day's value on hover or focus.
 * @tag tc-active-days
 * @fires tc-date-change - A day was selected or cleared ({ date, value }: ActiveDaysDateChange); cancelable – prevented, `date` stays as it was
 */
export class TcActiveDays extends TcElement {
  static override ui = "acd";

  /** The heading, and the grid's name */
  @property() accessor heading = "Active days";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The days with activity, "YYYY-MM-DD", in any order; a day not listed has no data */
  @property({ attribute: false }) accessor days: ActiveDaysDay[] = [];
  /** The daily goal: a day at or over it is a full ring */
  @property({ type: Number }) accessor goal = 1;
  /** The month in view first, "YYYY-MM"; by default the latest month in `days` */
  @property() accessor month: string | undefined = undefined;
  /** Today, as epoch ms – days after it are blank; by default the clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The first day of the week: 0 Sunday, 1 Monday … 6 Saturday */
  @property({ type: Number, attribute: "week-start" }) accessor weekStart = 0;
  /** What the values count, after the number: "12 reviews" */
  @property() accessor unit = "events";
  /** The selected day, "YYYY-MM-DD". Changed by the user unless a tc-date-change listener calls preventDefault() */
  @property() accessor date: string | null = null;
  /** The language for month, weekday and number names, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The focusable day */
  @state() private accessor active: string | null = null;
  @state() private accessor hover: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-acd-${++uidCount}`;
  private today = isoOf(new Date(0));
  private scrolledFor = "";

  /* ---------- The model ---------- */

  private get byDay() {
    const map = new Map<string, number | null>();
    for (const d of this.days) {
      const at = parse(d?.date);
      if (!at) continue;
      const k = isoOf(at);
      const v = typeof d.value === "number" && Number.isFinite(d.value) ? d.value : null;
      const was = map.get(k);
      map.set(k, was === undefined ? v : v === null ? was : (was ?? 0) + v);
    }
    return map;
  }

  /** Every month from the first with data to the last (or `month`, if later) */
  private get months(): Month[] {
    const keys = [...this.byDay.keys()].sort();
    const asked = this.month && parse(`${this.month}-01`) ? this.month : null;
    const lo = [keys[0] ? monthKey(keys[0]) : null, asked].filter(Boolean).sort()[0];
    const hi = [keys[keys.length - 1] ? monthKey(keys[keys.length - 1]) : null, asked].filter(Boolean).sort().pop();
    if (!lo || !hi) return [];
    const ws = ((Math.round(this.weekStart) % 7) + 7) % 7;
    const out: Month[] = [];
    for (let first = `${lo}-01`; monthKey(first) <= hi && out.length < 240; first = addMonths(first, 1)) {
      const d = parse(first)!;
      const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const lead = (d.getDay() - ws + 7) % 7;
      const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => addDays(first, i))];
      while (cells.length % 7) cells.push(null);
      const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
      out.push({ key: monthKey(first), first, days, weeks });
    }
    return out;
  }

  private get goalValue() {
    return Number.isFinite(this.goal) && this.goal > 0 ? this.goal : 1;
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(n);
  }
  private pct(n: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
  }
  private say(v: number | null | undefined) {
    return v === null || v === undefined ? "No data" : `${this.num(v)} ${this.unit}`;
  }
  private dayName(iso: string) {
    return formatDate(parse(iso), this.locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  private future(iso: string) {
    return iso > this.today;
  }
  private describe(iso: string, map = this.byDay) {
    if (this.future(iso)) return `${this.dayName(iso)}, upcoming`;
    const v = map.get(iso);
    if (v === null || v === undefined) return `No data, ${this.dayName(iso)}`;
    const met = v >= this.goalValue;
    return `${met ? "Goal met: " : ""}${this.say(v)}, ${this.pct(v / this.goalValue)} of the goal, ${this.dayName(iso)}`;
  }

  /** The month the header describes: the focused day's, else the selected day's, else `month`, else the latest */
  private focusMonth(months: Month[]) {
    const keys = new Set(months.map((m) => m.key));
    for (const k of [this.active, this.date].map((d) => (d ? monthKey(d) : null))) if (k && keys.has(k)) return k;
    if (this.month && keys.has(this.month)) return this.month;
    return months[months.length - 1]?.key ?? null;
  }

  private stats(key: string, map: Map<string, number | null>) {
    const goal = this.goalValue;
    const first = parse(`${key}-01`)!;
    const n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    let met = 0;
    let run = 0;
    let streak = 0;
    const byWeekday = Array<number>(7).fill(0);
    for (let i = 0; i < n; i++) {
      const iso = addDays(`${key}-01`, i);
      const v = map.get(iso);
      const ok = typeof v === "number" && v >= goal && !this.future(iso);
      if (ok) met++;
      run = ok ? run + 1 : 0;
      streak = Math.max(streak, run);
      if (typeof v === "number") byWeekday[parse(iso)!.getDay()] += v;
    }
    const top = Math.max(...byWeekday);
    const busiest = top > 0 ? byWeekday.indexOf(top) : -1;
    return { met, streak, busiest };
  }

  private setDate(next: string | null) {
    if (next === this.date) return;
    const value = next === null ? undefined : (this.byDay.get(next) ?? null);
    if (!this.emit<ActiveDaysDateChange>("tc-date-change", { date: next, value }, { cancelable: true })) return;
    this.date = next;
    this.announce = next === null ? "Selection cleared" : `Selected ${this.dayName(next)}: ${this.say(value)}`;
  }

  /* ---------- Keyboard: the grid ---------- */

  private get bounds() {
    const ms = this.months;
    if (!ms.length) return null;
    const last = ms[ms.length - 1];
    return { first: ms[0].first, last: addDays(last.first, last.days - 1) };
  }

  /** The tab stop: the active day, else the selected one, else today – or the 1st of `month` when today isn't in it –
   *  kept within the days shown */
  private stop(b: { first: string; last: string }) {
    const inside = (d: string | null) => d !== null && d >= b.first && d <= b.last;
    if (inside(this.active)) return this.active!;
    if (inside(this.date)) return this.date!;
    const pick = this.month && monthKey(this.today) !== this.month ? `${this.month}-01` : this.today;
    return pick < b.first ? b.first : pick > b.last ? b.last : pick;
  }

  private focusDay(iso: string) {
    const b = this.bounds;
    if (!b) return;
    const to = iso < b.first ? b.first : iso > b.last ? b.last : iso;
    this.active = to;
    void this.updateComplete.then(() => {
      const cell = this.querySelector<HTMLElement>(`[data-date="${to}"]`);
      cell?.focus({ preventScroll: true });
      cell?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }

  private onKey = (e: KeyboardEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-date]");
    if (!cell || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const at = cell.dataset.date!;
    const ws = ((Math.round(this.weekStart) % 7) + 7) % 7;
    const col = (parse(at)!.getDay() - ws + 7) % 7;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(at, -1),
      ArrowRight: () => addDays(at, 1),
      ArrowUp: () => addDays(at, -7),
      ArrowDown: () => addDays(at, 7),
      Home: () => addDays(at, -col),
      End: () => addDays(at, 6 - col),
      PageUp: () => addMonths(at, -1),
      PageDown: () => addMonths(at, 1),
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.focusDay(move());
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setDate(this.date === at ? null : at);
    } else if (e.key === "Escape" && this.date !== null) {
      e.preventDefault();
      this.setDate(null);
    }
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The one clock read: today, when the page doesn't say
    if (!this.hasUpdated || changed.has("now")) this.today = isoOf(new Date(this.now !== undefined && Number.isFinite(this.now) ? this.now : Date.now()));
    const b = this.bounds;
    const inside = (d: string | null) => !!b && d !== null && d >= b.first && d <= b.last;
    if (this.active !== null && !inside(this.active)) this.active = null;
    if (this.date !== null && !inside(this.date)) this.date = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // The month asked for (else the latest) starts in view, and again when it or the range changes
    const ms = this.months;
    const key = ms.length ? `${ms[0].key}:${ms.length}:${this.month ?? ""}:${this.weekStart}` : "";
    if (key && key !== this.scrolledFor) {
      this.scrolledFor = key;
      const scroll = this.querySelector<HTMLElement>(".ui-acd__scroll");
      const target = this.month && ms.some((m) => m.key === this.month) ? this.month : ms[ms.length - 1].key;
      const block = this.querySelector<HTMLElement>(`[data-month="${target}"]`);
      if (scroll && block) scroll.scrollTop = block.offsetTop - (this.querySelector<HTMLElement>(".ui-acd__weekdays")?.offsetHeight ?? 0);
    }
  }

  /* ---------- Rendering ---------- */

  private renderDay(iso: string, map: Map<string, number | null>, stop: string) {
    const v = map.get(iso);
    const future = this.future(iso);
    const has = typeof v === "number";
    const frac = has ? Math.max(0, Math.min(1, v / this.goalValue)) : 0;
    const met = has && v >= this.goalValue && !future;
    const sel = this.date === iso;
    const state = future ? "future" : !has ? "none" : met ? "met" : "part";
    return html`<td
      class="ui-acd__cell"
      role="gridcell"
      data-date=${iso}
      data-state=${state}
      tabindex=${iso === stop ? 0 : -1}
      aria-label=${this.describe(iso, map)}
      aria-selected=${sel ? "true" : "false"}
      ?data-selected=${sel}
      ?data-today=${iso === this.today}
      @focus=${() => {
        this.active = iso;
        this.hover = iso;
      }}
      @blur=${() => {
        if (this.hover === iso) this.hover = null;
      }}
      @pointerenter=${() => (this.hover = iso)}
      @pointerdown=${(e: PointerEvent) => {
        this.active = iso;
        if (e.pointerType === "mouse") e.preventDefault();
        (e.currentTarget as HTMLElement).focus({ preventScroll: true });
      }}
      @click=${() => {
        this.active = iso;
        this.setDate(sel ? null : iso);
      }}
      ><span class="ui-acd__day" aria-hidden="true"
        >${future
          ? nothing
          : svg`<svg class="ui-acd__ring" viewBox="0 0 36 36"><circle class="ui-acd__track" cx="18" cy="18" r=${RING_R}></circle>${has && frac > 0 ? svg`<circle class="ui-acd__fill" cx="18" cy="18" r=${RING_R} stroke-dasharray=${RING_C.toFixed(2)} stroke-dashoffset=${(RING_C * (1 - frac)).toFixed(2)}></circle>` : nothing}</svg>`}<span
          class="ui-acd__num"
          >${parse(iso)!.getDate()}</span
        >${met ? html`<span class="ui-acd__check"><svg viewBox="0 0 12 12"><path d="m3 6.2 2 2 4-4.4"></path></svg></span>` : nothing}</span
      ></td
    >`;
  }

  private renderGrid(months: Month[], map: Map<string, number | null>, stop: string) {
    const id = this.uid;
    const ws = ((Math.round(this.weekStart) % 7) + 7) % 7;
    const weekdayShort = new Intl.DateTimeFormat(this.locale, { weekday: "narrow" });
    const weekdayLong = new Intl.DateTimeFormat(this.locale, { weekday: "long" });
    // 4 January 1970 was a Sunday
    const weekday = (i: number) => new Date(1970, 0, 4 + ((ws + i) % 7), 12);
    const monthName = new Intl.DateTimeFormat(this.locale, { month: "long", year: "numeric" });
    return html`<div class="ui-acd__scroll" @pointerleave=${() => (this.hover = null)}>
      <table class="ui-acd__grid" role="grid" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey}>
        <thead class="ui-acd__weekdays">
          <tr role="row">
            ${Array.from({ length: 7 }, (_, i) => html`<th class="ui-acd__weekday" role="columnheader" scope="col"><span aria-hidden="true">${weekdayShort.format(weekday(i))}</span><span class="ui-acd__sr">${weekdayLong.format(weekday(i))}</span></th>`)}
          </tr>
        </thead>
        ${months.map(
          (m) => html`<tbody class="ui-acd__month" data-month=${m.key}>
            <tr class="ui-acd__month-row" role="row">
              <th class="ui-acd__month-name" role="rowheader" scope="rowgroup" colspan="7">${monthName.format(parse(m.first)!)}</th>
            </tr>
            ${m.weeks.map(
              (w) => html`<tr role="row">
                ${w.map((iso) => (iso === null ? html`<td class="ui-acd__cell" role="gridcell" data-out></td>` : this.renderDay(iso, map, stop)))}
              </tr>`,
            )}
          </tbody>`,
        )}
      </table>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const months = this.months;
    const map = this.byDay;
    const b = this.bounds;
    const key = this.focusMonth(months);
    const st = key ? this.stats(key, map) : null;
    const shown = this.hover ?? this.date;
    const weekdayLong = new Intl.DateTimeFormat(this.locale, { weekday: "long" });
    const monthName = new Intl.DateTimeFormat(this.locale, { month: "long" });
    return html`
      <span class="ui-acd__sr" role="status">${this.announce}</span>
      <span class="ui-acd__sr" id=${`${id}-keys`}>Left and right arrows move a day, up and down a week, Page Up and Page Down a month; Enter selects the day</span>
      ${cardHead({
        icon: calendarCheckIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside:
          st && key
            ? html`<span class="ui-acd__total"><span class="ui-acd__total-label">${monthName.format(parse(`${key}-01`)!)}</span><span class="ui-acd__total-value">${this.num(st.met)} ${st.met === 1 ? "day" : "days"} at goal</span></span>`
            : nothing,
      })}
      <div class="ui-acd__card">
        ${b && st
          ? html`<dl class="ui-acd__stats" aria-live="off">
                <div class="ui-acd__stat"><dt>Goal</dt><dd>${this.say(this.goalValue)} a day</dd></div>
                <div class="ui-acd__stat"><dt>Best streak</dt><dd>${this.num(st.streak)} ${st.streak === 1 ? "day" : "days"}</dd></div>
                <div class="ui-acd__stat"><dt>Most active</dt><dd>${st.busiest < 0 ? "–" : weekdayLong.format(new Date(1970, 0, 4 + st.busiest, 12))}</dd></div>
              </dl>
              ${this.renderGrid(months, map, this.stop(b))}
              <div class="ui-acd__foot">
                <span class="ui-acd__readout" aria-hidden="true"
                  >${shown === null
                    ? html`<span class="ui-acd__readout-hint">Point at a day to see how close it came to the goal</span>`
                    : this.future(shown)
                      ? html`${formatDate(parse(shown), this.locale, { weekday: "short", month: "short", day: "numeric" })} is still to come`
                      : html`<span class="ui-acd__readout-value">${this.say(map.get(shown))}</span>${typeof map.get(shown) === "number" ? html` · ${this.pct(map.get(shown)! / this.goalValue)} of the goal` : nothing} on
                          ${formatDate(parse(shown), this.locale, { weekday: "short", month: "short", day: "numeric" })}`}</span
                >
              </div>`
          : html`<p class="ui-acd__empty">No activity to show yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="acd"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="acd"] {
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
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The ring's ink and track, the size of a day and the calendar's height – override any of them on the element */
[data-ui="acd"] { --tc-acd-ink: var(--tc-chart-1); --tc-acd-met: var(--tc-status-success-fg); --tc-acd-track: var(--tc-meter-track); --tc-acd-cell: 40px; --tc-acd-height: 360px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="acd"] { --tc-acd-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="acd"] { --tc-acd-bg: var(--tc-surface-raised); }
[data-ui="acd"] *, [data-ui="acd"] *::before, [data-ui="acd"] *::after { box-sizing: border-box; }
[data-ui="acd"] p, [data-ui="acd"] dl, [data-ui="acd"] dd { margin: 0; }
[data-ui="acd"] svg { display: block; flex: none; }
.ui-acd__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-acd__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's count and the month's facts ----- */
.ui-acd__total { display: grid; flex: none; justify-items: end; }
.ui-acd__total-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-acd__total-value { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-acd__stats { display: flex; flex-wrap: wrap; gap: var(--tc-space-2) var(--tc-space-6); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-acd__stats { padding-top: var(--tc-space-1); }
.ui-acd__stat { display: grid; gap: var(--tc-space-0-5); }
.ui-acd__stat dt { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-acd__stat dd { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* ----- The calendar: months run on down, each name sticking under the weekdays ----- */
.ui-acd__scroll { max-height: var(--tc-acd-height); overflow-y: auto; padding: 0 var(--tc-space-4); scrollbar-width: thin; overscroll-behavior: contain; }
.ui-acd__grid { width: 100%; border-collapse: collapse; table-layout: fixed; }
.ui-acd__grid th, .ui-acd__grid td { padding: 0; font-weight: inherit; }
.ui-acd__weekdays th { position: sticky; top: 0; z-index: 2; height: 24px; background: var(--tc-acd-bg); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-none); color: var(--tc-text-muted); text-align: center; }
.ui-acd__month-name { position: sticky; top: 24px; z-index: 1; height: 28px; padding: var(--tc-space-1) var(--tc-space-1) 0 !important; background: var(--tc-acd-bg); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong) !important; line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-align: left; vertical-align: middle; }
/* A day: its number in the middle of a ring filled towards the goal */
.ui-acd__cell { height: calc(var(--tc-acd-cell) + 4px); text-align: center; vertical-align: middle; cursor: pointer; outline: none; }
.ui-acd__cell[data-out] { cursor: default; }
.ui-acd__day { position: relative; display: inline-grid; place-items: center; width: var(--tc-acd-cell); height: var(--tc-acd-cell); border-radius: 50%; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-acd__ring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.ui-acd__track, .ui-acd__fill { fill: none; stroke-width: 3; }
.ui-acd__track { stroke: var(--tc-acd-track); }
.ui-acd__fill { stroke: var(--tc-acd-ink); stroke-linecap: round; }
.ui-acd__cell[data-state="met"] .ui-acd__fill { stroke: var(--tc-acd-met); }
.ui-acd__cell[data-state="none"] .ui-acd__track { stroke: none; }
.ui-acd__cell[data-state="none"] .ui-acd__ring { border-radius: 50%; box-shadow: inset 0 0 0 1px var(--tc-border-default); transform: none; }
.ui-acd__num { position: relative; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-acd__cell[data-state="future"] .ui-acd__num, .ui-acd__cell[data-state="none"] .ui-acd__num { color: var(--tc-text-muted); }
.ui-acd__cell[data-today] .ui-acd__num { font-weight: var(--tc-font-weight-strong); text-decoration: underline; text-underline-offset: 2px; }
.ui-acd__check { position: absolute; right: -2px; bottom: -2px; display: grid; place-items: center; width: 14px; height: 14px; border-radius: 50%; background: var(--tc-acd-met); box-shadow: 0 0 0 2px var(--tc-acd-bg); }
.ui-acd__check svg { width: 10px; height: 10px; fill: none; stroke: var(--tc-text-on); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ui-acd__cell:hover .ui-acd__day { background: var(--tc-fill-hover); }
.ui-acd__cell[data-selected] .ui-acd__day { background: var(--tc-fill-selected); box-shadow: 0 0 0 1.5px var(--tc-text-primary); }
.ui-acd__cell:focus-visible .ui-acd__day { outline: var(--tc-focus-outline); outline-offset: 1px; }
/* ----- The footer: the day under the pointer or focus ----- */
.ui-acd__foot { display: flex; align-items: center; min-height: 36px; padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-border-subtle); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-acd__readout-value { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-acd__readout-hint { color: var(--tc-text-muted); }
.ui-acd__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 360px) {
  [data-ui="acd"] { --tc-acd-cell: 30px; }
  .ui-acd__scroll { padding: 0 var(--tc-space-2); }
  .ui-acd__check { width: 11px; height: 11px; }
  .ui-acd__check svg { width: 8px; height: 8px; }
}
@media (forced-colors: active) {
  .ui-acd__fill { stroke: CanvasText; }
  .ui-acd__cell[data-state="met"] .ui-acd__fill { stroke: Highlight; }
  .ui-acd__track { stroke: GrayText; }
  .ui-acd__check { forced-color-adjust: none; }
  .ui-acd__cell[data-selected] .ui-acd__day { box-shadow: 0 0 0 2px Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="acd"] *, [data-ui="acd"] *::before, [data-ui="acd"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-active-days")) customElements.define("tc-active-days", TcActiveDays);

declare global {
  interface HTMLElementTagNameMap {
    "tc-active-days": TcActiveDays;
  }
}
