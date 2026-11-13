import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-spend-breakdown> – AI spend split by model, feature, user or team. A switch picks the dimension and a select
 * the period; the spend is drawn as a ranked list of bars (each slice's cost, its share and its change on the period
 * before, in words) or as a stacked bar per day, with a table view of the same numbers. Picking a slice filters the
 * page (tc-slice-select) and fades the others in the daily view. The total sits in the header in the page's currency.
 *   · the ranked slices are one tab stop: ↑ / ↓ / Home / End move, Enter or Space picks or clears a slice
 *   · the page owns the data per period: it listens for tc-period-change and passes that period's `entries`
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-spend-breakdown currency="USD" .entries=${[{ date: "2026-11-02", cost: 412, by: { model: "large-1", team: "Audit" } }]}></tc-spend-breakdown>
 */

/** A pie chart: Lucide (ISC, lucide.dev) */
const pieIcon = svg`<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"></path><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>`;

export type SpendDimension = "model" | "feature" | "user" | "team";
export type SpendView = "ranked" | "daily" | "table";

export type SpendEntry = {
  /** The day, as YYYY-MM-DD */
  date: string;
  /** What it cost, in `currency` */
  cost: number;
  /** Which model, feature, user and team it belongs to; a missing one counts as "Unassigned" */
  by: Partial<Record<SpendDimension, string>>;
};
export type SpendPeriod = { id: string; label: string };
export type SpendSlice = { id: string; cost: number; share: number; previous: number | null };

/** Details of the events */
export type SpendDimensionChange = { dimension: SpendDimension };
export type SpendPeriodChange = { period: string };
export type SpendViewChange = { view: SpendView };
export type SpendSliceSelect = { dimension: SpendDimension; id: string | null; selected: string | null };

export const defaultSpendDimensionLabels: Record<SpendDimension, string> = { model: "Model", feature: "Feature", user: "User", team: "Team" };
export const defaultSpendPeriods: SpendPeriod[] = [
  { id: "month", label: "This month" },
  { id: "30d", label: "Last 30 days" },
  { id: "quarter", label: "This quarter" },
];
const UNASSIGNED = "Unassigned";
/** The daily view stacks this many slices; the rest are Other */
const STACKED = 5;
const OTHER = "Other";

/** Each slice's cost and share in `entries`, biggest first, with its cost in `previous` (null when it had none) */
export function spendSlices(entries: SpendEntry[], dimension: SpendDimension, previous: SpendEntry[] | null = null): SpendSlice[] {
  const sum = (list: SpendEntry[]) => {
    const m = new Map<string, number>();
    for (const e of list) {
      const id = e.by[dimension] || UNASSIGNED;
      m.set(id, (m.get(id) ?? 0) + Math.max(0, e.cost || 0));
    }
    return m;
  };
  const now = sum(entries);
  const before = previous ? sum(previous) : null;
  const total = [...now.values()].reduce((a, b) => a + b, 0);
  return [...now]
    .map(([id, cost]) => ({ id, cost, share: total > 0 ? cost / total : 0, previous: before ? (before.get(id) ?? 0) : null }))
    .sort((a, b) => b.cost - a.cost || a.id.localeCompare(b.id));
}

let uidCount = 0;

/**
 * Spend breakdown: AI spend by model, feature, user or team for a period – a ranked list with shares and the change on
 * the period before, a stacked bar per day, or a table – with picking a slice to filter.
 * @tag tc-spend-breakdown
 * @fires tc-dimension-change - The dimension was switched ({ dimension }: SpendDimensionChange); cancelable – prevented, `dimension` stays as it was
 * @fires tc-period-change - Another period was picked ({ period }: SpendPeriodChange); cancelable – prevented, `period` stays as it was
 * @fires tc-view-change - The view was switched ({ view }: SpendViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-slice-select - A slice was picked or cleared ({ dimension, id, selected }: SpendSliceSelect); cancelable – prevented, `selected` stays as it was
 */
export class TcSpendBreakdown extends TcElement {
  static override ui = "spb";

  /** The heading */
  @property() accessor heading = "AI spend";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The period's spend, one entry per day and slice */
  @property({ attribute: false }) accessor entries: SpendEntry[] = [];
  /** The period before's spend, for the change in words; null leaves the change out */
  @property({ attribute: false }) accessor previous: SpendEntry[] | null = null;
  /** What to split by. Changed by the switch unless a tc-dimension-change listener calls preventDefault() */
  @property() accessor dimension: SpendDimension = "model";
  /** The dimensions the switch offers, in order */
  @property({ attribute: false }) accessor dimensions: SpendDimension[] = ["model", "feature", "user", "team"];
  /** The switch's words for each dimension */
  @property({ attribute: false }) accessor dimensionLabels: Partial<Record<SpendDimension, string>> = {};
  /** The period shown. Changed by the select unless a tc-period-change listener calls preventDefault() */
  @property() accessor period = "month";
  /** The periods the select offers */
  @property({ attribute: false }) accessor periods: SpendPeriod[] = defaultSpendPeriods;
  /** Ranked bars, a stacked bar per day, or a table. Changed by the switch unless a tc-view-change listener calls preventDefault() */
  @property() accessor view: SpendView = "ranked";
  /** The picked slice's id, or null for all. Changed by picking unless a tc-slice-select listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** The currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The language for numbers and dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The ranked slice holding the tab stop */
  @state() private accessor active: string | null = null;
  /** A polite message for screen readers */
  @state() private accessor announce = "";

  private uid = `tc-spb-${++uidCount}`;

  /* ---------- The model ---------- */

  private get slices() {
    return spendSlices(this.entries, this.dimension, this.previous);
  }
  private get total() {
    return this.entries.reduce((n, e) => n + Math.max(0, e.cost || 0), 0);
  }
  private get previousTotal() {
    return this.previous ? this.previous.reduce((n, e) => n + Math.max(0, e.cost || 0), 0) : null;
  }
  private label(d: SpendDimension) {
    return this.dimensionLabels[d] ?? defaultSpendDimensionLabels[d];
  }
  private money(v: number, compact = false) {
    const opts: Intl.NumberFormatOptions = compact ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: v >= 100 ? 0 : 2 };
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, ...opts }).format(v);
    } catch {
      return new Intl.NumberFormat(this.locale, opts).format(v);
    }
  }
  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: v > 0 && v < 0.01 ? 1 : 0 }).format(v);
  }
  /** The change on the period before, in words: "Up 12%", "Down 8%", "About the same", "New" */
  private changeWords(now: number, before: number | null) {
    if (before === null) return "";
    if (before <= 0) return now > 0 ? "New" : "";
    const d = (now - before) / before;
    if (Math.abs(d) < 0.01) return "About the same";
    return `${d > 0 ? "Up" : "Down"} ${this.pct(Math.abs(d))}`;
  }
  private dayLabel(date: string) {
    const [y, m, d] = date.split("-").map(Number);
    const t = Date.UTC(y, (m || 1) - 1, d || 1);
    return new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(t);
  }

  /* ---------- Changes ---------- */

  private setDimension(next: SpendDimension) {
    if (next === this.dimension) return;
    if (!this.emit<SpendDimensionChange>("tc-dimension-change", { dimension: next }, { cancelable: true })) return;
    this.dimension = next;
    this.selected = null;
    this.active = null;
    this.announce = `Split by ${this.label(next).toLowerCase()}`;
  }
  private setPeriod(next: string, select: HTMLSelectElement) {
    if (next === this.period) return;
    if (!this.emit<SpendPeriodChange>("tc-period-change", { period: next }, { cancelable: true })) {
      select.value = this.period;
      return;
    }
    this.period = next;
  }
  private setView(next: SpendView) {
    if (next === this.view) return;
    if (!this.emit<SpendViewChange>("tc-view-change", { view: next }, { cancelable: true })) return;
    this.view = next;
  }
  private pick(id: string) {
    const next = this.selected === id ? null : id;
    if (!this.emit<SpendSliceSelect>("tc-slice-select", { dimension: this.dimension, id: next, selected: next }, { cancelable: true })) return;
    this.selected = next;
    this.announce = next ? `Filtered to ${next}` : "Showing all";
  }

  /* ---------- Keyboard ---------- */

  private get stop() {
    const ids = this.slices.map((s) => s.id);
    return this.active && ids.includes(this.active) ? this.active : (this.selected && ids.includes(this.selected) ? this.selected : ids[0]) ?? null;
  }
  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as Element).closest<HTMLElement>("[data-slice]");
    if (!row || e.altKey || e.ctrlKey || e.metaKey) return;
    const ids = this.slices.map((s) => s.id);
    const at = ids.indexOf(row.dataset.slice!);
    const last = ids.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to < 0) return;
    e.preventDefault();
    this.active = ids[to];
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-slice="${CSS.escape(ids[to])}"]`)?.focus());
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const ids = new Set(this.slices.map((s) => s.id));
    if (this.active !== null && !ids.has(this.active)) this.active = null;
  }

  /* ---------- Rendering ---------- */

  private renderRanked(slices: SpendSlice[]) {
    const max = slices[0]?.cost ?? 0;
    return html`<ul class="ui-spb__list" role="listbox" aria-labelledby=${`${this.uid}-title`} @keydown=${this.onKey}>
      ${repeat(
        slices,
        (s) => s.id,
        (s, i) => {
          const change = this.changeWords(s.cost, s.previous);
          return html`<li
            class="ui-spb__slice"
            role="option"
            data-slice=${s.id}
            aria-selected=${this.selected === s.id ? "true" : "false"}
            tabindex=${this.stop === s.id ? 0 : -1}
            ?data-dim=${this.selected !== null && this.selected !== s.id}
            @focus=${() => {
              if (this.active !== s.id) this.active = s.id;
            }}
            @click=${() => this.pick(s.id)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                this.pick(s.id);
              }
            }}
          >
            <span class="ui-spb__name"><span class="ui-spb__swatch" data-i=${Math.min(i, STACKED)} aria-hidden="true"></span>${s.id}</span>
            <span class="ui-spb__cost">${this.money(s.cost)}<span class="tc-sr-only">,</span></span>
            <span class="ui-spb__share">${this.pct(s.share)}<span class="tc-sr-only"> of the total</span></span>
            <span class="ui-spb__change" data-dir=${change.startsWith("Up") ? "up" : change.startsWith("Down") ? "down" : "flat"}>${change ? html`<span class="tc-sr-only">, </span>${change}` : nothing}</span>
            <span class="ui-spb__track" aria-hidden="true"><span class="ui-spb__fill" data-i=${Math.min(i, STACKED)} style=${`inline-size: ${max > 0 ? (s.cost / max) * 100 : 0}%`}></span></span>
          </li>`;
        },
      )}
    </ul>`;
  }

  private renderDaily(slices: SpendSlice[]) {
    const top = slices.slice(0, STACKED).map((s) => s.id);
    const keyOf = (id: string) => (top.includes(id) ? id : OTHER);
    const keys = slices.length > STACKED ? [...top, OTHER] : top;
    const days = [...new Set(this.entries.map((e) => e.date))].sort();
    const byDay = days.map((date) => {
      const parts = new Map<string, number>();
      for (const e of this.entries) if (e.date === date) parts.set(keyOf(e.by[this.dimension] || UNASSIGNED), (parts.get(keyOf(e.by[this.dimension] || UNASSIGNED)) ?? 0) + Math.max(0, e.cost || 0));
      return { date, parts, total: [...parts.values()].reduce((a, b) => a + b, 0) };
    });
    const peak = Math.max(0, ...byDay.map((d) => d.total));
    const W = 100;
    const H = 40;
    const gap = days.length > 1 ? Math.min(0.6, (W / days.length) * 0.25) : 0;
    const bw = days.length ? W / days.length - gap : 0;
    const top1 = byDay.reduce<(typeof byDay)[number] | null>((a, d) => (!a || d.total > a.total ? d : a), null);
    const summary = top1 ? `Spend each day, stacked by ${this.label(this.dimension).toLowerCase()}. The highest day was ${this.dayLabel(top1.date)}, ${this.money(top1.total)}. The table view lists every slice.` : "";
    return html`<figure class="ui-spb__daily">
      <svg class="ui-spb__chart" viewBox=${`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        ${byDay.map((d, i) => {
          let y = H;
          return keys.map((k, ki) => {
            const v = d.parts.get(k) ?? 0;
            const h = peak > 0 ? (v / peak) * (H - 1) : 0;
            y -= h;
            return v > 0
              ? svg`<rect class="ui-spb__bar" data-i=${k === OTHER ? STACKED : ki} ?data-dim=${this.selected !== null && this.selected !== k} x=${i * (bw + gap) + gap / 2} y=${y} width=${bw} height=${h}></rect>`
              : nothing;
          });
        })}
      </svg>
      <div class="ui-spb__axis" aria-hidden="true"><span>${days[0] ? this.dayLabel(days[0]) : ""}</span><span>${days.length > 1 ? this.dayLabel(days[days.length - 1]) : ""}</span></div>
      <ul class="ui-spb__legend" aria-hidden="true">
        ${keys.map((k, ki) => html`<li class="ui-spb__key"><span class="ui-spb__swatch" data-i=${k === OTHER ? STACKED : ki}></span>${k}</li>`)}
      </ul>
      <figcaption class="tc-sr-only">${summary}</figcaption>
    </figure>`;
  }

  private renderTable(slices: SpendSlice[]) {
    const label = this.label(this.dimension);
    return html`<div class="ui-spb__table-wrap">
      <table class="ui-spb__table">
        <caption class="tc-sr-only">${`${this.heading} by ${label.toLowerCase()}`}</caption>
        <thead>
          <tr><th scope="col">${label}</th><th scope="col">Cost</th><th scope="col">Share</th>${this.previous ? html`<th scope="col">Change</th>` : nothing}</tr>
        </thead>
        <tbody>
          ${slices.map(
            (s) =>
              html`<tr ?data-picked=${this.selected === s.id}>
                <th scope="row">${s.id}</th><td>${this.money(s.cost)}</td><td>${this.pct(s.share)}</td>${this.previous ? html`<td>${this.changeWords(s.cost, s.previous) || "–"}</td>` : nothing}
              </tr>`,
          )}
        </tbody>
        <tfoot>
          <tr><th scope="row">Total</th><td>${this.money(this.total)}</td><td>${this.pct(this.total > 0 ? 1 : 0)}</td>${this.previous ? html`<td>${this.changeWords(this.total, this.previousTotal) || "–"}</td>` : nothing}</tr>
        </tfoot>
      </table>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const slices = this.slices;
    const totalChange = this.changeWords(this.total, this.previousTotal);
    const periodLabel = this.periods.find((p) => p.id === this.period)?.label ?? "";
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: pieIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: html`<span class="ui-spb__total"
          ><span class="ui-spb__total-num">${this.money(this.total)}</span>${totalChange
            ? html`<span class="ui-spb__total-change">${totalChange} on the period before</span>`
            : html`<span class="ui-spb__total-change">${periodLabel}</span>`}</span
        >`,
      })}
      <div class="ui-spb__card">
        <div class="ui-spb__bar-row">
          <div class="ui-spb__seg" role="group" aria-label="Split by">
            ${this.dimensions.map(
              (d) => html`<button type="button" class="ui-spb__seg-btn" data-dimension=${d} aria-pressed=${this.dimension === d ? "true" : "false"} @click=${() => this.setDimension(d)}>${this.label(d)}</button>`,
            )}
          </div>
          <div class="ui-spb__controls">
            <label class="ui-spb__period"
              ><span class="tc-sr-only">Period</span
              ><select class="ui-spb__select" @change=${(e: Event) => this.setPeriod((e.target as HTMLSelectElement).value, e.target as HTMLSelectElement)}>
                ${this.periods.map((p) => html`<option value=${p.id} ?selected=${p.id === this.period}>${p.label}</option>`)}
              </select></label
            >
            <div class="ui-spb__seg" role="group" aria-label="View">
              ${(["ranked", "daily", "table"] as const).map(
                (v) =>
                  html`<button type="button" class="ui-spb__seg-btn" data-view=${v} aria-pressed=${this.view === v ? "true" : "false"} @click=${() => this.setView(v)}>
                    ${v === "ranked" ? "Ranked" : v === "daily" ? "Daily" : "Table"}
                  </button>`,
              )}
            </div>
          </div>
        </div>
        ${this.selected
          ? html`<p class="ui-spb__filter">Filtered to <strong>${this.selected}</strong> <button type="button" class="ui-spb__clear" @click=${() => this.pick(this.selected!)}>Clear<span class="tc-sr-only"> the filter</span></button></p>`
          : nothing}
        ${!slices.length
          ? html`<p class="ui-spb__empty">No spend in this period.</p>`
          : this.view === "daily"
            ? this.renderDaily(slices)
            : this.view === "table"
              ? this.renderTable(slices)
              : this.renderRanked(slices)}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="spb"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="spb"] {
  position: relative; display: block; box-sizing: border-box; width: 100%; overflow: hidden;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="spb"] *, [data-ui="spb"] *::before, [data-ui="spb"] *::after { box-sizing: border-box; }
:where([data-ui="spb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="spb"] button:focus-visible, [data-ui="spb"] select:focus-visible, .ui-spb__slice:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="spb"] ul, [data-ui="spb"] p, [data-ui="spb"] figure { margin: 0; padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-spb__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-spb__total { display: grid; justify-items: end; line-height: var(--tc-line-height-snug); }
.ui-spb__total-num { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-spb__total-change { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-spb__bar-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-spb__bar-row { padding-top: var(--tc-space-1); }
.ui-spb__controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-spb__seg { display: inline-flex; flex-wrap: wrap; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-spb__seg-btn { height: calc(var(--tc-control-h-sm) - var(--tc-seg-pad) * 2); padding: 0 var(--tc-space-2-5) !important; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-none); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-spb__seg-btn[aria-pressed="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-spb__select { height: var(--tc-field-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-spb__filter { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-4) !important; border-bottom: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); }
.ui-spb__filter strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-spb__clear { color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-spb__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* Ranked */
.ui-spb__list { padding: var(--tc-space-1-5) !important; }
.ui-spb__slice { display: grid; grid-template-columns: minmax(0, 1fr) auto auto minmax(76px, auto); grid-template-areas: "name cost share change" "track track track track"; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-spb__slice:hover { background: var(--tc-fill-subtle); }
.ui-spb__slice[aria-selected="true"] { background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-spb__slice:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-spb__slice[data-dim] .ui-spb__fill { opacity: 0.35; }
.ui-spb__name { grid-area: name; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.ui-spb__cost { grid-area: cost; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-spb__share { grid-area: share; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-spb__change { grid-area: change; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); text-align: right; white-space: nowrap; }
.ui-spb__change[data-dir="up"] { color: var(--tc-status-warning-fg); }
.ui-spb__change[data-dir="down"] { color: var(--tc-status-success-fg); }
.ui-spb__track { grid-area: track; display: block; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-spb__fill { display: block; height: 100%; border-radius: inherit; transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-spb__swatch { flex: none; width: var(--tc-space-2-5); height: var(--tc-space-2-5); border-radius: var(--tc-radius-2xs); }
[data-ui="spb"] [data-i="0"] { background: var(--tc-chart-1); fill: var(--tc-chart-1); }
[data-ui="spb"] [data-i="1"] { background: var(--tc-chart-2); fill: var(--tc-chart-2); }
[data-ui="spb"] [data-i="2"] { background: var(--tc-chart-3); fill: var(--tc-chart-3); }
[data-ui="spb"] [data-i="3"] { background: var(--tc-chart-4); fill: var(--tc-chart-4); }
[data-ui="spb"] [data-i="4"] { background: var(--tc-chart-5); fill: var(--tc-chart-5); }
[data-ui="spb"] [data-i="5"] { background: var(--tc-chart-neutral); fill: var(--tc-chart-neutral); }
/* Daily */
.ui-spb__daily { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4) !important; }
.ui-spb__chart { display: block; width: 100%; height: var(--tc-spb-chart-h); }
.ui-spb__bar { transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-spb__bar[data-dim] { opacity: 0.25; }
.ui-spb__axis { display: flex; justify-content: space-between; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-spb__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-spb__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
/* Table */
.ui-spb__table-wrap { overflow-x: auto; padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-3); }
.ui-spb__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-spb__table th, .ui-spb__table td { padding: var(--tc-space-2) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); text-align: right; }
.ui-spb__table th:first-child { text-align: left; }
.ui-spb__table thead th { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-spb__table tbody th, .ui-spb__table tfoot th { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-spb__table tfoot th, .ui-spb__table tfoot td { border-bottom: 0; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
.ui-spb__table tr[data-picked] { background: var(--tc-fill-subtle); }
[data-ui="spb"] { --tc-spb-chart-h: 140px; }
@container (max-width: 520px) {
  .ui-spb__slice { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "name cost" "share change" "track track"; }
  .ui-spb__share { text-align: left; }
}
@media (forced-colors: active) {
  .ui-spb__fill, .ui-spb__swatch, .ui-spb__bar { forced-color-adjust: none; }
  .ui-spb__seg-btn[aria-pressed="true"], .ui-spb__slice[aria-selected="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="spb"] *, [data-ui="spb"] *::before, [data-ui="spb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-spend-breakdown")) customElements.define("tc-spend-breakdown", TcSpendBreakdown);

declare global {
  interface HTMLElementTagNameMap {
    "tc-spend-breakdown": TcSpendBreakdown;
  }
}
