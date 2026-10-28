import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-sla-status> – how well service levels are being met: a headline on-time share ("94% on time"), a bar splitting
 * the work into Met, At risk and Breached – counts and shares, in words and marks as well as colour – an optional
 * weekly trend of the on-time share, and optional rows per type of request (Review, Approval, Clearance …), each with
 * its own split. A period chooser (7d / 30d / 90d) fires a cancelable tc-period-change; the page supplies the numbers
 * for the period it shows.
 *   · the bars are a WAI-ARIA grid, a row per bar: ← / → move between a bar's segments, ↑ / ↓ between bars, Home /
 *     End to a bar's ends; the segment under the pointer or focus is read out beneath
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-sla-status .split=${{ met: 188, atRisk: 8, breached: 4 }} .rows=${[{ id: "review", label: "Review", met: 90,
 *     atRisk: 3, breached: 1 }]}></tc-sla-status>
 */

/** A timer: Lucide (ISC, lucide.dev) */
const timerIcon = svg`<path d="M10 2h4"></path><path d="M12 14v-4"></path><path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-8 7z"></path>`;

export type SlaOutcome = "met" | "atRisk" | "breached";
/** Counts by outcome */
export type SlaSplit = { met: number; atRisk: number; breached: number };
/** A type of request with its own split */
export type SlaRow = SlaSplit & { id: string; label: string };

/** Details of the events */
export type SlaPeriodChange = { period: string };

const OUTCOMES: SlaOutcome[] = ["met", "atRisk", "breached"];
/** The outcomes' names used when the page gives none */
export const defaultSlaLabels: Record<SlaOutcome, string> = { met: "Met", atRisk: "At risk", breached: "Breached" };
const TONE: Record<SlaOutcome, string> = { met: "success", atRisk: "warning", breached: "danger" };

let uidCount = 0;

/* Outcome marks: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK: Record<SlaOutcome, () => ReturnType<typeof lucide>> = {
  met: () => lucide(11, svg`<path d="M20 6 9 17l-5-5"></path>`),
  atRisk: () => lucide(11, svg`<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path>`),
  breached: () => lucide(11, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`),
};

const total = (s: SlaSplit) => Math.max(0, s.met) + Math.max(0, s.atRisk) + Math.max(0, s.breached);

/**
 * Service-level performance – the on-time share, a Met / At risk / Breached split in words and marks, a weekly trend,
 * per-type rows and a period chooser.
 * @tag tc-sla-status
 * @fires tc-period-change - A period was picked ({ period }: SlaPeriodChange); cancelable – prevented, `period` stays as it was
 */
export class TcSlaStatus extends TcElement {
  static override ui = "sla";

  /** The heading */
  @property() accessor heading = "SLA performance";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The counts for the whole period */
  @property({ attribute: false }) accessor split: SlaSplit = { met: 0, atRisk: 0, breached: 0 };
  /** Counts per type of request, each drawn as its own bar */
  @property({ attribute: false }) accessor rows: SlaRow[] = [];
  /** The on-time share per week, oldest first, from 0 to 1 */
  @property({ attribute: false }) accessor trend: number[] = [];
  /** The outcomes' names, merged over the defaults (Met, At risk, Breached) */
  @property({ attribute: false }) accessor labels: Partial<Record<SlaOutcome, string>> = {};
  /** The periods to choose from; empty hides the chooser */
  @property({ attribute: false }) accessor periods: string[] = ["7d", "30d", "90d"];
  /** The period shown. Changed by the user unless a tc-period-change listener calls preventDefault() */
  @property() accessor period = "30d";
  /** What the counts are, after the number: "12 requests" */
  @property() accessor unit = "requests";
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The tab stop: a bar and a segment in it */
  @state() private accessor active: { r: number; o: SlaOutcome } = { r: 0, o: "met" };
  @state() private accessor shown: { r: number; o: SlaOutcome } | null = null;

  private uid = `tc-sla-${++uidCount}`;

  private label(o: SlaOutcome) {
    return this.labels[o] ?? defaultSlaLabels[o];
  }
  private pct(n: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
  }
  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  /** The bars: the whole period first, then each row */
  private get bars(): { id: string; label: string; s: SlaSplit }[] {
    return [{ id: "all", label: "All", s: this.split }, ...this.rows.map((r) => ({ id: r.id, label: r.label, s: r }))];
  }
  /** A bar's segments with something in them */
  private outcomesOf(s: SlaSplit) {
    return OUTCOMES.filter((o) => s[o] > 0);
  }

  private setPeriod(period: string) {
    if (period === this.period) return;
    if (!this.emit<SlaPeriodChange>("tc-period-change", { period }, { cancelable: true })) return;
    this.period = period;
  }

  /* ---------- Keyboard: the grid ---------- */

  private focusAt(r: number, o: SlaOutcome) {
    const bars = this.bars;
    r = Math.max(0, Math.min(bars.length - 1, r));
    const os = this.outcomesOf(bars[r].s);
    if (!os.length) return;
    if (!os.includes(o)) o = os[0];
    this.active = { r, o };
    this.shown = { r, o };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-seg="${r}:${o}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const seg = (e.target as HTMLElement).closest<HTMLElement>("[data-seg]");
    if (!seg || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const [rs, o] = seg.dataset.seg!.split(":") as [string, SlaOutcome];
    const r = Number(rs);
    const os = this.outcomesOf(this.bars[r].s);
    const i = os.indexOf(o);
    // Up and down keep to the same outcome where the next bar has it, else its nearest segment
    const vertical = (to: number) => {
      const target = this.bars[to];
      if (!target) return null;
      const tos = this.outcomesOf(target.s);
      if (!tos.length) return null;
      return tos.includes(o) ? o : tos[Math.min(i, tos.length - 1)];
    };
    let move: [number, SlaOutcome] | null = null;
    if (e.key === "ArrowLeft") move = [r, os[Math.max(0, i - 1)]];
    else if (e.key === "ArrowRight") move = [r, os[Math.min(os.length - 1, i + 1)]];
    else if (e.key === "Home") move = [r, os[0]];
    else if (e.key === "End") move = [r, os[os.length - 1]];
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      let to = r + (e.key === "ArrowUp" ? -1 : 1);
      // Skip bars with nothing in them
      while (to >= 0 && to < this.bars.length && !vertical(to)) to += e.key === "ArrowUp" ? -1 : 1;
      const v = vertical(to);
      if (v) move = [to, v];
      else {
        e.preventDefault();
        return;
      }
    }
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The tab stop stays on a segment that exists
    const bars = this.bars;
    const firstWith = bars.findIndex((b) => this.outcomesOf(b.s).length);
    if (firstWith < 0) return;
    const cur = bars[this.active.r];
    if (!cur || !this.outcomesOf(cur.s).includes(this.active.o)) this.active = { r: firstWith, o: this.outcomesOf(bars[firstWith].s)[0] };
    if (this.shown && (!bars[this.shown.r] || !this.outcomesOf(bars[this.shown.r].s).includes(this.shown.o))) this.shown = null;
  }

  /* ---------- Rendering ---------- */

  private segWords(s: SlaSplit, o: SlaOutcome) {
    const t = total(s);
    return `${this.label(o)}: ${this.num(s[o])} ${this.unit}, ${this.pct(t ? s[o] / t : 0)}`;
  }

  private renderBar(bar: { id: string; label: string; s: SlaSplit }, r: number) {
    const t = total(bar.s);
    const os = this.outcomesOf(bar.s);
    return html`<div class="ui-sla__row" role="row" data-bar=${bar.id} ?data-overall=${r === 0}>
      <span class="ui-sla__row-label" role="rowheader">${bar.label}<span class="ui-sla__row-pct">${t ? this.pct(bar.s.met / t) : "–"}</span></span>
      <span class="ui-sla__bar" role="presentation">
        ${os.length
          ? os.map(
              (o) => html`<span
                class="ui-sla__seg"
                role="gridcell"
                data-seg=${`${r}:${o}`}
                data-tone=${TONE[o]}
                style=${`flex-grow: ${bar.s[o]}`}
                tabindex=${this.active.r === r && this.active.o === o ? 0 : -1}
                aria-label=${this.segWords(bar.s, o)}
                @focus=${() => {
                  this.active = { r, o };
                  this.shown = { r, o };
                }}
                @blur=${() => {
                  if (this.shown?.r === r && this.shown.o === o) this.shown = null;
                }}
                @pointerenter=${() => (this.shown = { r, o })}
              ></span>`,
            )
          : html`<span class="ui-sla__seg" role="gridcell" data-tone="none" aria-label="No ${this.unit}"></span>`}
      </span>
    </div>`;
  }

  private renderTrend() {
    const tr = this.trend.filter((v) => Number.isFinite(v));
    if (tr.length < 2) return nothing;
    const lo = Math.min(...tr, 0.8);
    const hi = 1;
    const span = hi - lo || 1;
    const d = tr.map((v, i) => `${i ? "L" : "M"}${((i / (tr.length - 1)) * 118 + 1).toFixed(1)} ${(31 - ((Math.min(1, v) - lo) / span) * 30).toFixed(1)}`).join("");
    const first = tr[0];
    const last = tr[tr.length - 1];
    const words = `On time over ${tr.length} weeks, from ${this.pct(first)} to ${this.pct(last)}`;
    return html`<span class="ui-sla__trend" role="img" aria-label=${words} title=${words}>
      <svg viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true"><path d=${d}></path></svg>
    </span>`;
  }

  protected override render() {
    const id = this.uid;
    const t = total(this.split);
    const onTime = t ? this.split.met / t : null;
    const shown = this.shown && this.bars[this.shown.r] ? this.shown : null;
    const options: SegmentOption[] = this.periods.map((p) => ({ value: p, label: p }));
    return html`
      ${cardHead({
        icon: timerIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: this.periods.length
          ? html`<tc-segmented-control
              look=${this.resolvedLook}
              class="ui-sla__periods"
              size="sm"
              aria-label="Period"
              .options=${options}
              .value=${this.period}
              @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
                // The inner control's event stops here: the page hears this element's tc-period-change only
                e.stopPropagation();
                e.preventDefault();
                this.setPeriod(e.detail.value);
              }}
            ></tc-segmented-control>`
          : nothing,
      })}
      <div class="ui-sla__card">
        <div class="ui-sla__summary">
          <p class="ui-sla__headline"><span class="ui-sla__big">${onTime === null ? "–" : this.pct(onTime)}</span> <span class="ui-sla__big-label">on time</span></p>
          <ul class="ui-sla__legend" aria-label="Outcomes">
            ${OUTCOMES.map(
              (o) => html`<li class="ui-sla__key" data-tone=${TONE[o]}>
                <span class="ui-sla__mark" aria-hidden="true">${MARK[o]()}</span>${this.label(o)}
                <span class="ui-sla__key-n">${this.num(this.split[o])}</span><span class="ui-sla__key-pct">${t ? this.pct(this.split[o] / t) : "–"}</span>
              </li>`,
            )}
          </ul>
          ${this.renderTrend()}
        </div>
        <div class="ui-sla__grid" role="grid" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey} @pointerleave=${() => (this.shown = null)}>
          ${repeat(this.bars, (b) => b.id, (b, r) => this.renderBar(b, r))}
        </div>
        <p class="ui-sla__readout" aria-hidden="true">
          ${shown
            ? html`<span class="ui-sla__dot" data-tone=${TONE[shown.o]}></span><span class="ui-sla__readout-bar">${this.bars[shown.r].label}</span> · ${this.segWords(this.bars[shown.r].s, shown.o).replace(":", " ·").replace(",", " ·")}`
            : html`<span class="ui-sla__hint">Point at a segment to read it</span>`}
        </p>
        <span class="ui-sla__sr" id=${`${id}-keys`}>Left and right arrows move between a bar's segments, up and down between bars</span>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sla"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sla"] {
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
[data-ui="sla"] *, [data-ui="sla"] *::before, [data-ui="sla"] *::after { box-sizing: border-box; }
[data-ui="sla"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="sla"] p { margin: 0; }
[data-ui="sla"] svg { display: block; flex: none; }
.ui-sla__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sla__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-sla__periods { flex: none; }
/* ----- The headline, the legend with counts and the trend ----- */
.ui-sla__summary { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-3) var(--tc-space-5); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-sla__summary { padding-top: var(--tc-space-1); }
.ui-sla__headline { display: flex; align-items: baseline; gap: var(--tc-space-1-5); }
.ui-sla__big { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-sla__big-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-sla__legend { display: grid; gap: var(--tc-space-1); flex: 1 1 12rem; min-width: 0; }
.ui-sla__key { display: grid; grid-template-columns: auto minmax(0, 1fr) auto 3.2em; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-sla__mark { display: grid; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs); }
.ui-sla__key[data-tone="success"] .ui-sla__mark { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-sla__key[data-tone="warning"] .ui-sla__mark { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-sla__key[data-tone="danger"] .ui-sla__mark { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-sla__key-n { color: var(--tc-text-primary); font-variant-numeric: tabular-nums; text-align: right; }
.ui-sla__key-pct { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; text-align: right; }
.ui-sla__trend { flex: 0 1 140px; min-width: 96px; height: 36px; }
.ui-sla__trend svg { width: 100%; height: 100%; overflow: visible; }
.ui-sla__trend path { fill: none; stroke: var(--tc-chart-1); stroke-width: 1.75px; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
/* ----- The bars: the whole period, then one per type ----- */
.ui-sla__grid { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-sla__row { display: grid; grid-template-columns: minmax(6rem, 9rem) minmax(0, 1fr); align-items: center; gap: var(--tc-space-3); }
.ui-sla__row[data-overall] { padding-bottom: var(--tc-space-1); }
.ui-sla__row-label { display: flex; justify-content: space-between; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sla__row[data-overall] .ui-sla__row-label { font-weight: var(--tc-font-weight-medium); }
.ui-sla__row-pct { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-sla__bar { display: flex; gap: var(--tc-hairline); height: 10px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-sla__row[data-overall] .ui-sla__bar { height: 14px; }
.ui-sla__seg { flex: 1 1 0; min-width: 3px; outline: none; cursor: default; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sla__seg[data-tone="success"] { background: var(--tc-status-success-fg); }
.ui-sla__seg[data-tone="warning"] { background: var(--tc-status-warning-fg); }
.ui-sla__seg[data-tone="danger"] { background: var(--tc-status-danger-fg); }
.ui-sla__seg[data-tone="none"] { background: none; }
.ui-sla__seg:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-sla__grid:has(.ui-sla__seg:hover) .ui-sla__seg:not(:hover) { opacity: 0.55; }
.ui-sla__readout { display: flex; align-items: center; gap: var(--tc-space-1-5); min-height: 1.6em; padding: 0 var(--tc-space-4) var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-sla__readout-bar { color: var(--tc-text-primary); }
.ui-sla__hint { color: var(--tc-text-muted); }
.ui-sla__dot { width: 8px; height: 8px; border-radius: var(--tc-radius-full); }
.ui-sla__dot[data-tone="success"] { background: var(--tc-status-success-fg); }
.ui-sla__dot[data-tone="warning"] { background: var(--tc-status-warning-fg); }
.ui-sla__dot[data-tone="danger"] { background: var(--tc-status-danger-fg); }
@container (max-width: 440px) {
  .ui-sla__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1); }
  .ui-sla__trend { flex-basis: 100%; }
}
@media (forced-colors: active) {
  .ui-sla__bar { border: 1px solid CanvasText; }
  .ui-sla__seg { border-right: 1px solid Canvas; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="sla"] *, [data-ui="sla"] *::before, [data-ui="sla"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-sla-status")) customElements.define("tc-sla-status", TcSlaStatus);

declare global {
  interface HTMLElementTagNameMap {
    "tc-sla-status": TcSlaStatus;
  }
}
