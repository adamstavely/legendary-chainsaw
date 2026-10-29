import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-roadmap-timeline> – workstreams on a calendar, Gantt style: a lane per workstream (its name and owner stay put
 * on the left while the chart scrolls), each piece of work a bar from its start to its end, filled as far as it has
 * got, coloured and marked by its status (Planned, Active, Done, At risk, Blocked – the mark and the word as well as
 * the colour), milestones as diamonds, a Today line, and elbow arrows from each piece of work to the ones that depend
 * on it – red and dashed when the follower is planned to start before what it waits for ends.
 *   · `scale` is Weeks, Months or Quarters (the switch in the header; tc-scale-change); the drawing keeps its size and
 *     scrolls sideways inside the card
 *   · dates are calendar days, "YYYY-MM-DD"; `range` sets the window, else it's the work's own span, padded to whole
 *     months; `today` sets the Today line, else the element's own clock
 *   · the chart is a grid: a row per lane, its header the lane, a cell per piece of work in date order. One tab stop;
 *     ← → move along a lane, ↑ ↓ to the nearest piece of work in the lane above or below, Home / End to a lane's ends;
 *     Enter or Space selects (tc-selected-change) and opens the details under the chart – dates, days, status,
 *     progress, what it waits for and what waits for it; Escape closes them
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-roadmap-timeline .lanes=${[{ id: "data", label: "Data platform" }]} .items=${[{ id: "a", lane: "data", label: "Ingest", start: "2027-01-11", end: "2027-03-05" }]}></tc-roadmap-timeline>
 */

export type RoadmapStatus = "planned" | "active" | "done" | "at-risk" | "blocked";
export type RoadmapScale = "week" | "month" | "quarter";
export type RoadmapLane = { id: string; label: string; owner?: string };
export type RoadmapItem = {
  id: string;
  /** The lane's id */
  lane: string;
  label: string;
  /** First day, "YYYY-MM-DD" */
  start: string;
  /** Last day, "YYYY-MM-DD" (a milestone's day; defaults to `start`) */
  end?: string;
  status?: RoadmapStatus;
  /** How far it has got, 0–1 */
  progress?: number;
  /** A single day that matters, drawn as a diamond */
  milestone?: boolean;
  /** The ids of the work this waits for */
  dependsOn?: string[];
};
export type RoadmapRange = { start: string; end: string };
export type RoadmapStatusLabels = Record<RoadmapStatus, string>;

/** Details of the events */
export type RoadmapSelectedChange = { selected: string | null; item: RoadmapItem | null };
export type RoadmapScaleChange = { scale: RoadmapScale };

export const defaultRoadmapStatusLabels: RoadmapStatusLabels = { planned: "Planned", active: "Active", done: "Done", "at-risk": "At risk", blocked: "Blocked" };

const DAY = 86_400_000;
/** Pixels per day at each scale */
const PX: Record<RoadmapScale, number> = { week: 16, month: 5, quarter: 1.6 };
const ROW = 48;
let uidCount = 0;

/** A calendar day as a day number (UTC days since 1970), or NaN */
export function dayNumber(iso: string | undefined): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY) : NaN;
}
const monthStart = (day: number) => {
  const d = new Date(day * DAY);
  return Math.round(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / DAY);
};
const nextMonth = (day: number) => {
  const d = new Date(day * DAY);
  return Math.round(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / DAY);
};

/* calendar-range, circle, circle-play, circle-check, triangle-alert, octagon-x: Lucide (ISC, lucide.dev) */
const roadmapIcon = svg`<rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M16 2v4"></path><path d="M3 10h18"></path><path d="M8 2v4"></path><path d="M17 14h-6"></path><path d="M13 18H7"></path><path d="M7 14h.01"></path><path d="M17 18h.01"></path>`;
const STATUS_GLYPH: Record<RoadmapStatus, ReturnType<typeof svg>> = {
  planned: svg`<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"></circle>`,
  active: svg`<circle cx="12" cy="12" r="9"></circle><path d="m10 8 6 4-6 4z" fill="currentColor"></path>`,
  done: svg`<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>`,
  "at-risk": svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
  blocked: svg`<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"></path><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`,
};
const glyph = (s: RoadmapStatus) =>
  html`<svg class="ui-rdm__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${STATUS_GLYPH[s]}</svg>`;
const closeIcon = () =>
  html`<svg class="ui-rdm__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;

/**
 * Workstreams on a calendar, Gantt style – lanes, bars with progress and status, milestones, a Today line and
 * dependency arrows, at a week, month or quarter scale, with details for the piece of work selected.
 * @tag tc-roadmap-timeline
 * @fires tc-selected-change - A piece of work was selected, or the selection cleared ({ selected, item }: RoadmapSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-scale-change - The scale was switched ({ scale }: RoadmapScaleChange); cancelable – prevented, `scale` stays as it was
 */
export class TcRoadmapTimeline extends TcElement {
  static override ui = "rdm";

  /** The heading, and the chart's name */
  @property() accessor heading = "Roadmap";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The workstreams, top to bottom */
  @property({ attribute: false }) accessor lanes: RoadmapLane[] = [];
  /** The pieces of work */
  @property({ attribute: false }) accessor items: RoadmapItem[] = [];
  /** The window shown; by default the work's own span, padded to whole months */
  @property({ attribute: false }) accessor range: RoadmapRange | undefined = undefined;
  /** Weeks, months or quarters. Changed by the user unless a tc-scale-change listener calls preventDefault() */
  @property({ reflect: true }) accessor scale: RoadmapScale = "month";
  /** Today, "YYYY-MM-DD"; by default the element's own clock */
  @property() accessor today: string | undefined = undefined;
  /** The selected piece of work's id. Changed by the user unless tc-selected-change is prevented */
  @property() accessor selected: string | null = null;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** Words for the statuses */
  @property({ attribute: false }) accessor statusLabels: Partial<RoadmapStatusLabels> = {};

  @state() private accessor active: string | null = null;
  @state() private accessor clockDay = NaN;
  @state() private accessor announce = "";

  private uid = `tc-rdm-${++uidCount}`;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]'));
  }

  override connectedCallback() {
    super.connectedCallback();
    // The element's own clock, read once when it joins the page, for a Today line without `today` – the reader's own
    // calendar day, not UTC's, which is a day out for part of every day away from Greenwich
    if (this.today === undefined) {
      const n = new Date();
      this.clockDay = Math.round(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / DAY);
    }
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if ((changed.has("items") || changed.has("lanes")) && this.active && !this.rows.some((r) => r.items.some((i) => i.id === this.active))) this.active = null;
  }

  /* ---------- The model ---------- */

  private statusWord(s: RoadmapStatus) {
    return this.statusLabels[s] ?? defaultRoadmapStatusLabels[s];
  }

  /** Each lane with its work in date order; work in a lane that isn't listed goes in an "Other" lane at the end */
  private get rows() {
    const known = new Set(this.lanes.map((l) => l.id));
    const lanes = [...this.lanes];
    if (this.items.some((i) => !known.has(i.lane))) lanes.push({ id: "\u0000other", label: "Other" });
    return lanes.map((lane) => ({
      lane,
      items: this.items
        .filter((i) => (lane.id === "\u0000other" ? !known.has(i.lane) : i.lane === lane.id) && !Number.isNaN(dayNumber(i.start)))
        .sort((a, b) => dayNumber(a.start) - dayNumber(b.start) || a.label.localeCompare(b.label)),
    }));
  }

  private span(i: RoadmapItem) {
    const s = dayNumber(i.start);
    const e = i.milestone ? s : Math.max(s, Number.isNaN(dayNumber(i.end)) ? s : dayNumber(i.end));
    return { s, e };
  }

  /** The first and last day drawn */
  private get window() {
    const rs = dayNumber(this.range?.start);
    const re = dayNumber(this.range?.end);
    if (!Number.isNaN(rs) && !Number.isNaN(re) && re > rs) return { from: rs, to: re };
    const spans = this.items.map((i) => this.span(i)).filter((x) => !Number.isNaN(x.s));
    const today = this.todayDay;
    if (!spans.length) {
      const base = Number.isNaN(today) ? 0 : today;
      return { from: monthStart(base), to: nextMonth(nextMonth(nextMonth(base))) - 1 };
    }
    const from = Math.min(...spans.map((x) => x.s)) - 7;
    const to = Math.max(...spans.map((x) => x.e)) + 7;
    return { from: monthStart(from), to: nextMonth(to) - 1 };
  }

  private get todayDay() {
    const t = dayNumber(this.today);
    return Number.isNaN(t) ? this.clockDay : t;
  }

  private x(day: number) {
    return (day - this.window.from) * PX[this.scale];
  }

  private fmt(day: number, opts: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat(this.locale, { timeZone: "UTC", ...opts }).format(new Date(day * DAY));
  }

  /** The header's two rows: the big divisions (months or quarters) and the small ticks under them */
  private get ticks() {
    const { from, to } = this.window;
    const majors: { day: number; label: string }[] = [];
    const minors: { day: number; label: string }[] = [];
    for (let d = monthStart(from); d <= to; d = nextMonth(d)) {
      const date = new Date(d * DAY);
      const month = date.getUTCMonth();
      if (this.scale === "quarter") {
        if (month % 3 === 0 || d === monthStart(from)) majors.push({ day: Math.max(d, from), label: `Q${Math.floor(month / 3) + 1} ${date.getUTCFullYear()}` });
        minors.push({ day: Math.max(d, from), label: this.fmt(d, { month: "short" }) });
      } else {
        majors.push({ day: Math.max(d, from), label: this.fmt(d, { month: "long", year: "numeric" }) });
      }
    }
    if (this.scale !== "quarter") {
      // Mondays
      let d = from + ((8 - new Date(from * DAY).getUTCDay()) % 7);
      for (; d <= to; d += 7) minors.push({ day: d, label: this.scale === "week" ? this.fmt(d, { day: "numeric", month: "short" }) : this.fmt(d, { day: "numeric" }) });
    }
    return { majors, minors };
  }

  private itemById(id: string | null) {
    return id ? this.items.find((i) => i.id === id) : undefined;
  }

  /* ---------- Actions ---------- */

  private setScale(scale: RoadmapScale) {
    if (scale === this.scale) return;
    if (!this.emit<RoadmapScaleChange>("tc-scale-change", { scale }, { cancelable: true })) return;
    this.scale = scale;
    this.announce = `Scale: ${scale === "week" ? "weeks" : scale === "month" ? "months" : "quarters"}`;
    void this.updateComplete.then(() => this.reveal(this.active ?? this.selected));
  }

  private select(id: string | null) {
    const next = id === this.selected ? null : id;
    const item = this.itemById(next) ?? null;
    if (!this.emit<RoadmapSelectedChange>("tc-selected-change", { selected: next, item }, { cancelable: true })) return;
    this.selected = next;
    this.announce = item ? `${item.label} selected; details below the chart` : "Selection cleared";
  }

  private reveal(id: string | null) {
    if (!id) return;
    this.querySelector<HTMLElement>(`[data-item="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  private moveTo(id: string) {
    this.active = id;
    void this.updateComplete.then(() => {
      const el = this.querySelector<HTMLElement>(`[data-item="${CSS.escape(id)}"]`);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  private onKey = (e: KeyboardEvent) => {
    const rows = this.rows.filter((r) => r.items.length);
    const id = this.currentActive;
    if (!id || !rows.length) return;
    const r = rows.findIndex((x) => x.items.some((i) => i.id === id));
    const c = rows[r].items.findIndex((i) => i.id === id);
    const near = (row: (typeof rows)[number]) => {
      const s = dayNumber(rows[r].items[c].start);
      return row.items.reduce((best, i) => (Math.abs(dayNumber(i.start) - s) < Math.abs(dayNumber(best.start) - s) ? i : best), row.items[0]);
    };
    let next: string | undefined;
    switch (e.key) {
      case "ArrowRight":
        next = rows[r].items[c + 1]?.id;
        break;
      case "ArrowLeft":
        next = rows[r].items[c - 1]?.id;
        break;
      case "ArrowDown":
        next = rows[r + 1] && near(rows[r + 1]).id;
        break;
      case "ArrowUp":
        next = rows[r - 1] && near(rows[r - 1]).id;
        break;
      case "Home":
        next = (e.ctrlKey ? rows[0] : rows[r]).items[0].id;
        break;
      case "End": {
        const row = e.ctrlKey ? rows[rows.length - 1] : rows[r];
        next = row.items[row.items.length - 1].id;
        break;
      }
      case "Enter":
      case " ":
        e.preventDefault();
        this.select(id);
        return;
      case "Escape":
        if (this.selected) {
          e.preventDefault();
          this.select(null);
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next) this.moveTo(next);
  };

  /** The piece of work holding the tab stop: the one moved to, else the selected one, else the first */
  private get currentActive() {
    const all = this.rows.flatMap((r) => r.items);
    if (this.active && all.some((i) => i.id === this.active)) return this.active;
    if (this.selected && all.some((i) => i.id === this.selected)) return this.selected;
    return all[0]?.id ?? null;
  }

  /* ---------- Rendering ---------- */

  private describeItem(i: RoadmapItem) {
    const { s, e } = this.span(i);
    const status = this.statusWord(i.status ?? "planned");
    const dates = i.milestone || s === e ? this.fmt(s, { day: "numeric", month: "short", year: "numeric" }) : `${this.fmt(s, { day: "numeric", month: "short" })} to ${this.fmt(e, { day: "numeric", month: "short", year: "numeric" })}`;
    const progress = i.progress !== undefined && !i.milestone ? `, ${Math.round(Math.max(0, Math.min(1, i.progress)) * 100)}% done` : "";
    return `${i.label}${i.milestone ? ", milestone" : ""}, ${dates}, ${status}${progress}`;
  }

  private renderScale() {
    const opts: [RoadmapScale, string][] = [
      ["week", "Weeks"],
      ["month", "Months"],
      ["quarter", "Quarters"],
    ];
    return html`<div class="ui-rdm__scale" role="group" aria-label="Scale">
      ${opts.map(([s, label]) => html`<button type="button" class="ui-rdm__scale-opt" aria-pressed=${this.scale === s ? "true" : "false"} @click=${() => this.setScale(s)}>${label}</button>`)}
    </div>`;
  }

  private renderArrows(rows: { lane: RoadmapLane; items: RoadmapItem[] }[], width: number) {
    const pos = new Map<string, { s: number; e: number; y: number; milestone: boolean }>();
    rows.forEach((r, ri) =>
      r.items.forEach((i) => {
        const { s, e } = this.span(i);
        pos.set(i.id, { s, e, y: ri * ROW + ROW / 2, milestone: !!i.milestone });
      }),
    );
    const px = PX[this.scale];
    const paths: ReturnType<typeof svg>[] = [];
    for (const r of rows)
      for (const i of r.items)
        for (const dep of i.dependsOn ?? []) {
          const a = pos.get(dep);
          const b = pos.get(i.id);
          if (!a || !b) continue;
          const late = b.s <= a.e;
          const x1 = this.x(a.e + 1) - (a.milestone ? px / 2 : 0);
          const x2 = this.x(b.s) + (b.milestone ? px / 2 - 6 : 0);
          const mid = Math.max(x1 + 6, Math.min(x2 - 6, x1 + 10));
          const d = late ? `M${x1} ${a.y}H${x1 + 8}V${(a.y + b.y) / 2}H${x2 - 8}V${b.y}H${x2}` : `M${x1} ${a.y}H${mid}V${b.y}H${x2}`;
          paths.push(svg`<path class="ui-rdm__dep" ?data-late=${late} d=${d} marker-end=${`url(#${this.uid}-${late ? "late" : "arrow"})`}><title>${late ? "Starts before what it waits for ends" : ""}</title></path>`);
        }
    return svg`<svg class="ui-rdm__deps" width=${width} height=${rows.length * ROW} aria-hidden="true">
      <defs>
        <marker id=${`${this.uid}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path class="ui-rdm__head" d="M0 0 8 4 0 8z"></path></marker>
        <marker id=${`${this.uid}-late`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path class="ui-rdm__head" data-late d="M0 0 8 4 0 8z"></path></marker>
      </defs>
      ${paths}
    </svg>`;
  }

  private renderDetail() {
    const item = this.itemById(this.selected);
    if (!item) return nothing;
    const { s, e } = this.span(item);
    const lane = this.lanes.find((l) => l.id === item.lane);
    const waits = (item.dependsOn ?? []).map((id) => this.itemById(id)).filter((x): x is RoadmapItem => !!x);
    const blocks = this.items.filter((i) => i.dependsOn?.includes(item.id));
    const status = item.status ?? "planned";
    const late = waits.filter((w) => this.span(w).e >= s);
    const pct = item.progress !== undefined ? Math.round(Math.max(0, Math.min(1, item.progress)) * 100) : undefined;
    const dateFmt: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
    const link = (i: RoadmapItem) => html`<li><button type="button" class="ui-rdm__link" @click=${() => (this.select(i.id), this.moveTo(i.id))}>${i.label}</button></li>`;
    return html`<section class="ui-rdm__detail" aria-labelledby=${`${this.uid}-detail`}>
      <div class="ui-rdm__detail-head">
        <h4 class="ui-rdm__detail-title" id=${`${this.uid}-detail`}>${item.label}</h4>
        <span class="ui-rdm__status" data-status=${status}>${glyph(status)}${this.statusWord(status)}</span>
        <button type="button" class="ui-rdm__close" @click=${() => {
          this.select(null);
          void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-item="${CSS.escape(item.id)}"]`)?.focus());
        }}>${closeIcon()}<span class="tc-sr-only">Close details</span></button>
      </div>
      <dl class="ui-rdm__facts">
        <div><dt>Workstream</dt><dd>${lane?.label ?? "Other"}${lane?.owner ? html` · ${lane.owner}` : nothing}</dd></div>
        ${item.milestone
          ? html`<div><dt>Date</dt><dd>${this.fmt(s, dateFmt)}</dd></div>`
          : html`<div><dt>Dates</dt><dd>${this.fmt(s, dateFmt)} – ${this.fmt(e, dateFmt)}</dd></div>
              <div><dt>Length</dt><dd>${e - s + 1} ${e - s + 1 === 1 ? "day" : "days"}</dd></div>`}
        ${pct !== undefined && !item.milestone
          ? html`<div><dt>Progress</dt><dd><span class="ui-rdm__meter" aria-hidden="true"><span class="ui-rdm__meter-fill" style=${`width:${pct}%`}></span></span>${pct}%</dd></div>`
          : nothing}
        <div><dt>Waits for</dt><dd>${waits.length ? html`<ul class="ui-rdm__links">${waits.map(link)}</ul>` : "Nothing"}</dd></div>
        <div><dt>Blocks</dt><dd>${blocks.length ? html`<ul class="ui-rdm__links">${blocks.map(link)}</ul>` : "Nothing"}</dd></div>
      </dl>
      ${late.length ? html`<p class="ui-rdm__warn">${glyph("at-risk")}Starts before ${late.map((l) => l.label).join(" and ")} ${late.length === 1 ? "ends" : "end"}.</p>` : nothing}
    </section>`;
  }

  protected override render() {
    const id = this.uid;
    const rows = this.rows;
    const { from, to } = this.window;
    const width = Math.ceil((to - from + 1) * PX[this.scale]);
    const { majors, minors } = this.ticks;
    const today = this.todayDay;
    const showToday = !Number.isNaN(today) && today >= from && today <= to;
    const active = this.currentActive;
    const px = PX[this.scale];
    const used = new Set(this.items.map((i) => i.status ?? "planned"));
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: roadmapIcon, title: this.heading, subtitle: this.description, id: `${id}-title`, aside: this.renderScale() })}
      <div class="ui-rdm__card">
        ${rows.length && this.items.length
          ? html`<div class="ui-rdm__scroll" style=${`--rdm-w:${width}px;--rdm-day:${px}px`}>
              <div class="ui-rdm__grid" role="grid" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} aria-rowcount=${rows.length + 1} @keydown=${this.onKey}>
                <div class="ui-rdm__row ui-rdm__row--head" role="row" aria-rowindex="1">
                  <span class="ui-rdm__lane ui-rdm__lane--head" role="columnheader">Workstream</span>
                  <span class="ui-rdm__axis" role="columnheader" aria-label=${`${this.fmt(from, { month: "long", year: "numeric" })} to ${this.fmt(to, { month: "long", year: "numeric" })}`}>
                    <span class="ui-rdm__majors" aria-hidden="true">${majors.map((m) => html`<span class="ui-rdm__major" style=${`left:${this.x(m.day)}px`}>${m.label}</span>`)}</span>
                    <span class="ui-rdm__minors" aria-hidden="true">${minors.map((m) => html`<span class="ui-rdm__minor" style=${`left:${this.x(m.day)}px`}>${m.label}</span>`)}</span>
                    ${showToday ? html`<span class="ui-rdm__today-label" aria-hidden="true" style=${`left:${this.x(today) + px / 2}px`}>Today</span>` : nothing}
                  </span>
                </div>
                <div class="ui-rdm__body">
                  <span class="ui-rdm__lines" aria-hidden="true">${minors.map((m) => html`<span class="ui-rdm__line" style=${`left:${this.x(m.day)}px`}></span>`)}${majors.map((m) => html`<span class="ui-rdm__line" data-major style=${`left:${this.x(m.day)}px`}></span>`)}</span>
                  ${this.renderArrows(rows, width)}
                  ${showToday ? html`<span class="ui-rdm__today" aria-hidden="true" style=${`left:${this.x(today) + px / 2}px`}></span>` : nothing}
                  ${rows.map(
                    (r, ri) => html`<div class="ui-rdm__row" role="row" aria-rowindex=${ri + 2}>
                      <span class="ui-rdm__lane" role="rowheader"
                        ><span class="ui-rdm__lane-name">${r.lane.label}</span>${r.lane.owner ? html` <span class="ui-rdm__lane-owner">${r.lane.owner}</span>` : nothing}</span
                      >
                      <span class="ui-rdm__track">
                        ${r.items.length
                          ? repeat(
                              r.items,
                              (i) => i.id,
                              (i) => {
                                const { s, e } = this.span(i);
                                const status = i.status ?? "planned";
                                const pct = i.progress !== undefined ? Math.max(0, Math.min(1, i.progress)) : status === "done" ? 1 : 0;
                                const left = this.x(s);
                                const w = Math.max(px, (e - s + 1) * px);
                                return html`<span
                                  class="ui-rdm__item"
                                  role="gridcell"
                                  data-item=${i.id}
                                  data-status=${status}
                                  ?data-milestone=${!!i.milestone}
                                  ?data-narrow=${w < 72}
                                  aria-selected=${i.id === this.selected ? "true" : "false"}
                                  aria-label=${this.describeItem(i)}
                                  tabindex=${i.id === active ? 0 : -1}
                                  style=${i.milestone ? `left:${left + px / 2}px` : `left:${left}px;width:${w}px`}
                                  @click=${() => {
                                    this.active = i.id;
                                    this.select(i.id);
                                  }}
                                  @focus=${() => (this.active = i.id)}
                                >
                                  ${i.milestone
                                    ? html`<span class="ui-rdm__diamond" aria-hidden="true"></span><span class="ui-rdm__milestone-label" aria-hidden="true">${i.label}</span>`
                                    : html`<span class="ui-rdm__fill" aria-hidden="true" style=${`width:${pct * 100}%`}></span
                                        ><span class="ui-rdm__bar-text" aria-hidden="true">${glyph(status)}<span class="ui-rdm__bar-label">${i.label}</span></span>`}
                                </span>`;
                              },
                            )
                          : html`<span class="ui-rdm__none" role="gridcell">No work planned</span>`}
                      </span>
                    </div>`,
                  )}
                </div>
              </div>
            </div>
            <p class="tc-sr-only" id=${`${id}-keys`}>Arrow keys move between pieces of work; Enter selects one and shows its details below the chart.</p>
            ${this.renderDetail()}
            <ul class="ui-rdm__legend" aria-label="Statuses">
              ${(["planned", "active", "done", "at-risk", "blocked"] as RoadmapStatus[])
                .filter((s) => used.has(s))
                .map((s) => html`<li class="ui-rdm__key" data-status=${s}>${glyph(s)}${this.statusWord(s)}</li>`)}
              ${this.items.some((i) => i.milestone) ? html`<li class="ui-rdm__key"><span class="ui-rdm__diamond ui-rdm__diamond--key" aria-hidden="true"></span>Milestone</li>` : nothing}
            </ul>`
          : html`<p class="ui-rdm__empty">Nothing on the roadmap yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="rdm"] {
  --tc-rdm-row: ${ROW}px;
  --tc-rdm-lane-w: 168px;
  --tc-rdm-bar-h: 26px;
  --tc-rdm-head-h: 48px;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rdm"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-rdm__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rdm"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rdm__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="rdm"] *, [data-ui="rdm"] *::before, [data-ui="rdm"] *::after { box-sizing: border-box; }
:where([data-ui="rdm"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rdm"] :is(button, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="rdm"]) :is(h4, p, ul, dl, dd) { margin: 0; padding: 0; }
[data-ui="rdm"] ul { list-style: none; }
.ui-rdm__glyph { display: block; flex: none; width: var(--tc-space-3-5); height: var(--tc-space-3-5); }
/* ----- Scale switch ----- */
.ui-rdm__scale { display: inline-flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-rdm__scale-opt { height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rdm__scale-opt[aria-pressed="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-rdm__scale-opt[aria-pressed="true"] { font-weight: var(--tc-font-weight-strong); }
/* ----- The chart: a sticky lane column and a track that scrolls ----- */
.ui-rdm__scroll { overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: thin; }
.ui-rdm__grid { position: relative; display: grid; width: calc(var(--tc-rdm-lane-w) + var(--rdm-w)); }
.ui-rdm__body { position: relative; display: grid; }
.ui-rdm__row { display: grid; grid-template-columns: var(--tc-rdm-lane-w) var(--rdm-w); height: var(--tc-rdm-row); }
.ui-rdm__row--head { height: var(--tc-rdm-head-h); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rdm__body > .ui-rdm__row + .ui-rdm__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rdm__lane { position: sticky; z-index: 3; left: 0; display: flex; flex-direction: column; justify-content: center; min-width: 0; padding: 0 var(--tc-space-3) 0 var(--tc-space-4); background: inherit; box-shadow: var(--tc-hairline) 0 0 var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *) .ui-rdm__lane { background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *) .ui-rdm__lane { background: var(--tc-surface-raised); }
.ui-rdm__lane--head { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rdm__lane-name { overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-rdm__lane-owner { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-rdm__axis { position: relative; display: block; overflow: hidden; }
.ui-rdm__majors, .ui-rdm__minors { position: absolute; left: 0; right: 0; height: 50%; }
.ui-rdm__majors { top: 0; }
.ui-rdm__minors { bottom: 0; }
.ui-rdm__major, .ui-rdm__minor { position: absolute; top: 0; bottom: 0; display: flex; align-items: center; padding-left: var(--tc-space-1-5); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-rdm__major { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); border-left: var(--tc-hairline) solid var(--tc-border-default); }
.ui-rdm__minor { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-rdm__lines { position: absolute; top: 0; bottom: 0; left: var(--tc-rdm-lane-w); width: var(--rdm-w); pointer-events: none; }
.ui-rdm__line { position: absolute; top: 0; bottom: 0; border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-rdm__line[data-major] { border-left-color: var(--tc-border-default); }
.ui-rdm__deps { position: absolute; z-index: 1; top: 0; left: var(--tc-rdm-lane-w); overflow: visible; pointer-events: none; }
.ui-rdm__dep { fill: none; stroke: var(--tc-text-muted); stroke-width: 1.25; }
.ui-rdm__dep[data-late] { stroke: var(--tc-status-danger-solid); stroke-dasharray: 4 3; }
.ui-rdm__head { fill: var(--tc-text-muted); }
.ui-rdm__head[data-late] { fill: var(--tc-status-danger-solid); }
.ui-rdm__today { position: absolute; z-index: 2; top: 0; bottom: 0; left: 0; margin-left: var(--tc-rdm-lane-w); border-left: 2px solid var(--tc-status-danger-solid); pointer-events: none; }
.ui-rdm__today-label { position: absolute; z-index: 2; bottom: 0; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs) var(--tc-radius-xs) 0 0; background: var(--tc-status-danger-solid); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-on-accent); transform: translateX(-50%); }
.ui-rdm__track { position: relative; z-index: 2; display: block; }
/* A piece of work: a bar with its progress fill, its status mark and words */
.ui-rdm__item { position: absolute; top: calc((var(--tc-rdm-row) - var(--tc-rdm-bar-h)) / 2); height: var(--tc-rdm-bar-h); display: flex; align-items: center; overflow: hidden; border-radius: var(--tc-radius-md); background: var(--rdm-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--rdm-line); color: var(--rdm-fg); cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rdm__item:hover { box-shadow: inset 0 0 0 1.5px var(--rdm-solid); }
.ui-rdm__item[aria-selected="true"] { box-shadow: inset 0 0 0 2px var(--rdm-solid), var(--tc-shadow-control); }
.ui-rdm__item[data-status="planned"] { --rdm-bg: var(--tc-fill-subtle); --rdm-line: var(--tc-border-default); --rdm-fg: var(--tc-text-secondary); --rdm-solid: var(--tc-text-muted); --rdm-fill: var(--tc-fill-strong); }
.ui-rdm__item[data-status="active"] { --rdm-bg: var(--tc-status-info-bg); --rdm-line: var(--tc-status-info-border); --rdm-fg: var(--tc-status-info-fg); --rdm-solid: var(--tc-status-info-solid); --rdm-fill: color-mix(in srgb, var(--tc-status-info-solid) 14%, transparent); }
.ui-rdm__item[data-status="done"] { --rdm-bg: var(--tc-status-success-bg); --rdm-line: var(--tc-status-success-border); --rdm-fg: var(--tc-status-success-fg); --rdm-solid: var(--tc-status-success-solid); --rdm-fill: transparent; }
.ui-rdm__item[data-status="at-risk"] { --rdm-bg: var(--tc-status-warning-bg); --rdm-line: var(--tc-status-warning-border); --rdm-fg: var(--tc-status-warning-fg); --rdm-solid: var(--tc-status-warning-solid); --rdm-fill: color-mix(in srgb, var(--tc-status-warning-solid) 14%, transparent); }
.ui-rdm__item[data-status="blocked"] { --rdm-bg: var(--tc-status-danger-bg); --rdm-line: var(--tc-status-danger-border); --rdm-fg: var(--tc-status-danger-fg); --rdm-solid: var(--tc-status-danger-solid); --rdm-fill: color-mix(in srgb, var(--tc-status-danger-solid) 14%, transparent); }
.ui-rdm__fill { position: absolute; inset: 0 auto 0 0; background: var(--rdm-fill); pointer-events: none; }
.ui-rdm__bar-text { position: relative; display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-rdm__bar-label { overflow: hidden; text-overflow: ellipsis; }
.ui-rdm__item[data-narrow] .ui-rdm__bar-label { display: none; }
.ui-rdm__item[data-narrow] .ui-rdm__bar-text { padding: 0 var(--tc-space-1); }
/* A milestone: a diamond on its day, its name beside it */
.ui-rdm__item[data-milestone] { overflow: visible; width: auto; background: none; box-shadow: none; transform: translateX(calc(-1 * var(--tc-rdm-bar-h) / 2)); gap: var(--tc-space-1-5); }
.ui-rdm__item[data-milestone]:hover .ui-rdm__diamond, .ui-rdm__item[data-milestone][aria-selected="true"] .ui-rdm__diamond { box-shadow: 0 0 0 2px var(--tc-surface-raised), 0 0 0 4px var(--rdm-solid); }
.ui-rdm__diamond { display: block; flex: none; width: calc(var(--tc-rdm-bar-h) * 0.6); height: calc(var(--tc-rdm-bar-h) * 0.6); margin: 0 calc(var(--tc-rdm-bar-h) * 0.2); border-radius: var(--tc-radius-2xs); background: var(--rdm-solid, var(--tc-text-primary)); transform: rotate(45deg); }
.ui-rdm__diamond--key { --rdm-solid: var(--tc-text-secondary); width: var(--tc-space-2-5); height: var(--tc-space-2-5); margin: 0 var(--tc-space-0-5); }
.ui-rdm__milestone-label { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; }
.ui-rdm__none { position: absolute; inset: 0; display: flex; align-items: center; padding-left: var(--tc-space-3); font-size: var(--tc-font-size-xs); font-style: italic; color: var(--tc-text-muted); }
.ui-rdm__empty { padding: var(--tc-space-8) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- Details ----- */
.ui-rdm__detail { display: grid; gap: var(--tc-space-2); margin: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); animation: ui-rdm-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-rdm__detail-head { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-rdm__detail-title { flex: 1; min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-rdm__status { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); }
.ui-rdm__status[data-status="planned"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-rdm__status[data-status="active"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-rdm__status[data-status="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rdm__status[data-status="at-risk"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-rdm__status[data-status="blocked"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rdm__close { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-rdm__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rdm__facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: var(--tc-space-2) var(--tc-space-4); font-size: var(--tc-font-size-sm); }
.ui-rdm__facts dt { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-rdm__facts dd { display: flex; align-items: center; gap: var(--tc-space-2); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-rdm__meter { position: relative; flex: 0 1 6rem; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-rdm__meter-fill { position: absolute; inset: 0 auto 0 0; background: var(--tc-meter-fill); }
.ui-rdm__links { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-rdm__link { color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-rdm__warn { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
/* ----- Legend ----- */
.ui-rdm__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); padding: var(--tc-space-2-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-rdm__key { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-rdm__key[data-status="active"] svg { color: var(--tc-status-info-solid); }
.ui-rdm__key[data-status="done"] svg { color: var(--tc-status-success-solid); }
.ui-rdm__key[data-status="at-risk"] svg { color: var(--tc-status-warning-solid); }
.ui-rdm__key[data-status="blocked"] svg { color: var(--tc-status-danger-solid); }
.ui-rdm__key[data-status="planned"] svg { color: var(--tc-text-muted); }
@keyframes ui-rdm-in { from { opacity: 0; transform: translateY(-2px); } }
@container (max-width: 520px) {
  [data-ui="rdm"] { --tc-rdm-lane-w: 112px; }
  .ui-rdm__lane-owner { display: none; }
}
@media (forced-colors: active) {
  .ui-rdm__item { border: 1px solid CanvasText; }
  .ui-rdm__item[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-rdm__diamond, .ui-rdm__fill { background: CanvasText; }
  .ui-rdm__today { border-color: Highlight; }
  .ui-rdm__scale-opt[aria-pressed="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rdm"] *, [data-ui="rdm"] *::before, [data-ui="rdm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-roadmap-timeline")) customElements.define("tc-roadmap-timeline", TcRoadmapTimeline);

declare global {
  interface HTMLElementTagNameMap {
    "tc-roadmap-timeline": TcRoadmapTimeline;
  }
}
