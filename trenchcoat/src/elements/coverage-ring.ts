import { html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";

/*
 * <tc-coverage-ring> – one share at a glance: a large ring filled to the value, the percentage in its middle over a
 * caption ("covered"), a title and a line saying what it measures. Beneath, an optional bar splits the items from the
 * healthiest to those that need attention – segments the page names, each in a tone – with its two ends labelled. A
 * segment under the pointer or focus is read out below the bar; Enter or a click fires tc-select. The ring fills to
 * a new value smoothly (at once with reduced motion).
 *   · the segments are one tab stop: ← / → move between them, Home / End to the ends
 * Standard: a white card on a gray tray. Clean: one white card.
 *
 *   <tc-coverage-ring value="0.61" heading="Gap coverage" description="Share of open gaps with active work assigned."></tc-coverage-ring>
 */

export type CoverageTone = "success" | "info" | "neutral" | "warning" | "danger";
export type CoverageSegment = {
  id: string;
  label: string;
  /** How many items fall here */
  count: number;
  tone: CoverageTone;
};

/** Details of the events */
export type CoverageSelect = { id: string; segment: CoverageSegment };

const R = 42;
const C = 2 * Math.PI * R;
let uidCount = 0;

/**
 * One share as a large ring – the percentage and a caption in the middle, a title and a line – with an optional bar of
 * segments from the healthiest to those that need attention, each read out on hover or focus.
 * @tag tc-coverage-ring
 * @fires tc-select - A segment of the bar was chosen with Enter or a click ({ id, segment }: CoverageSelect)
 */
export class TcCoverageRing extends TcElement {
  static override ui = "covr";

  /** The title beside the ring */
  @property() accessor heading = "Coverage";
  /** One line saying what the share measures */
  @property() accessor description: string | undefined = undefined;
  /** The share, from 0 to 1 */
  @property({ type: Number }) accessor value = 0;
  /** The word under the percentage */
  @property() accessor caption = "covered";
  /** The ring's colour */
  @property() accessor tone: CoverageTone = "success";
  /** The bar beneath, from the healthiest segment to the one that needs most attention; none when empty */
  @property({ attribute: false }) accessor segments: CoverageSegment[] = [];
  /** The label at the bar's start */
  @property({ attribute: "start-label" }) accessor startLabel = "Healthiest";
  /** The label at the bar's end */
  @property({ attribute: "end-label" }) accessor endLabel = "Needs attention";
  /** What the segments count, after the number: "12 topics" */
  @property() accessor unit = "items";
  /** The unit for a count of one, e.g. "topic"; by default `unit` */
  @property({ attribute: "unit-one" }) accessor unitOne: string | undefined = undefined;
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor shown: string | null = null;
  @state() private accessor activeId = "";

  private uid = `tc-covr-${++uidCount}`;

  private unitFor(n: number) {
    return n === 1 ? (this.unitOne ?? this.unit) : this.unit;
  }
  private pct(n: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
  }
  private get total() {
    return this.segments.reduce((n, s) => n + Math.max(0, s.count), 0);
  }
  private say(s: CoverageSegment) {
    const t = this.total;
    return `${s.label}: ${new Intl.NumberFormat(this.locale).format(s.count)} ${this.unitFor(s.count)}${t ? `, ${this.pct(s.count / t)}` : ""}`;
  }

  private onKey = (e: KeyboardEvent) => {
    const seg = (e.target as HTMLElement).closest<HTMLElement>("[data-segment]");
    if (!seg || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const list = this.segments.filter((s) => s.count > 0);
    const i = list.findIndex((s) => s.id === seg.dataset.segment);
    const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = list[Math.max(0, Math.min(list.length - 1, to))];
    this.activeId = next.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-segment="${CSS.escape(next.id)}"]`)?.focus());
  };

  private renderBar() {
    const list = this.segments.filter((s) => s.count > 0);
    const t = this.total;
    if (!list.length || !t) return nothing;
    const stop = list.some((s) => s.id === this.activeId) ? this.activeId : list[0].id;
    const shown = list.find((s) => s.id === this.shown);
    const id = this.uid;
    return html`<div class="ui-covr__split">
      <div class="ui-covr__bar" role="group" aria-labelledby=${`${id}-title`} @keydown=${this.onKey} @pointerleave=${() => (this.shown = null)}>
        ${list.map(
          (s) => html`<button
            type="button"
            class="ui-covr__seg"
            data-segment=${s.id}
            data-tone=${s.tone}
            style=${`flex-grow: ${s.count}`}
            aria-label=${this.say(s)}
            tabindex=${s.id === stop ? 0 : -1}
            @pointerenter=${() => (this.shown = s.id)}
            @focus=${() => {
              this.activeId = s.id;
              this.shown = s.id;
            }}
            @blur=${() => {
              if (this.shown === s.id) this.shown = null;
            }}
            @click=${() => this.emit<CoverageSelect>("tc-select", { id: s.id, segment: s })}
          ></button>`,
        )}
      </div>
      <div class="ui-covr__ends" aria-hidden="true">
        ${shown
          ? html`<span class="ui-covr__readout"><span class="ui-covr__dot" data-tone=${shown.tone}></span>${shown.label} · ${new Intl.NumberFormat(this.locale).format(shown.count)} ${this.unitFor(shown.count)} · ${this.pct(shown.count / t)}</span>`
          : html`<span>${this.startLabel}</span><span>${this.endLabel}</span>`}
      </div>
    </div>`;
  }

  protected override render() {
    const v = Math.max(0, Math.min(1, Number.isFinite(this.value) ? this.value : 0));
    const id = this.uid;
    return html`<div class="ui-covr__card">
      <div class="ui-covr__top">
        <div class="ui-covr__ring" role="img" aria-label=${`${this.pct(v)} ${this.caption}`}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle class="ui-covr__track" cx="50" cy="50" r=${R}></circle>
            <circle class="ui-covr__fill" data-tone=${this.tone} cx="50" cy="50" r=${R} stroke-dasharray=${C.toFixed(2)} style=${`stroke-dashoffset: ${(C * (1 - v)).toFixed(2)}`}></circle>
          </svg>
          <span class="ui-covr__mid" aria-hidden="true"><span class="ui-covr__num">${this.pct(v)}</span><span class="ui-covr__caption">${this.caption}</span></span>
        </div>
        <div class="ui-covr__text">
          <h3 class="ui-covr__title" id=${`${id}-title`}>${this.heading}</h3>
          ${this.description ? html`<p class="ui-covr__desc">${this.description}</p>` : nothing}
        </div>
      </div>
      ${this.renderBar()}
    </div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="covr"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="covr"] {
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
[data-ui="covr"] *, [data-ui="covr"] *::before, [data-ui="covr"] *::after { box-sizing: border-box; }
[data-ui="covr"] p, [data-ui="covr"] h3 { margin: 0; }
[data-ui="covr"] svg { display: block; }
:where([data-ui="covr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="covr"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-covr__card { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-covr__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-covr__top { display: flex; align-items: center; gap: var(--tc-space-4); }
/* ----- The ring ----- */
.ui-covr__ring { position: relative; flex: none; width: 112px; height: 112px; }
.ui-covr__ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ui-covr__track, .ui-covr__fill { fill: none; stroke-width: 9; }
.ui-covr__track { stroke: var(--tc-meter-track); }
.ui-covr__fill { stroke: var(--tc-status-success-fg); stroke-linecap: round; transition: stroke-dashoffset var(--tc-duration-slowest) var(--tc-ease-move); }
.ui-covr__fill[data-tone="info"] { stroke: var(--tc-status-info-fg); }
.ui-covr__fill[data-tone="neutral"] { stroke: var(--tc-text-secondary); }
.ui-covr__fill[data-tone="warning"] { stroke: var(--tc-status-warning-fg); }
.ui-covr__fill[data-tone="danger"] { stroke: var(--tc-status-danger-fg); }
.ui-covr__mid { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; }
.ui-covr__num { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-covr__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-covr__text { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-covr__title { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-covr__desc { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* ----- The bar of segments, healthiest first ----- */
.ui-covr__split { display: grid; gap: var(--tc-space-1-5); }
.ui-covr__bar { display: flex; gap: var(--tc-space-0-5); height: 8px; }
.ui-covr__seg { flex: 1 1 0; min-width: 6px; height: 100%; border-radius: var(--tc-radius-2xs); background: var(--tc-text-secondary) !important; transition: transform var(--tc-duration-fast) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-covr__seg:hover, .ui-covr__seg:focus-visible { transform: scaleY(1.5); }
.ui-covr__seg[data-tone="success"], .ui-covr__dot[data-tone="success"] { background: var(--tc-status-success-fg) !important; }
.ui-covr__seg[data-tone="info"], .ui-covr__dot[data-tone="info"] { background: var(--tc-status-info-fg) !important; }
.ui-covr__seg[data-tone="neutral"], .ui-covr__dot[data-tone="neutral"] { background: var(--tc-text-secondary) !important; }
.ui-covr__seg[data-tone="warning"], .ui-covr__dot[data-tone="warning"] { background: var(--tc-status-warning-fg) !important; }
.ui-covr__seg[data-tone="danger"], .ui-covr__dot[data-tone="danger"] { background: var(--tc-status-danger-fg) !important; }
.ui-covr__ends { display: flex; justify-content: space-between; gap: var(--tc-space-2); min-height: 16px; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-covr__readout { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-covr__dot { width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
@container (max-width: 300px) {
  .ui-covr__top { flex-direction: column; align-items: flex-start; }
}
@media (forced-colors: active) {
  .ui-covr__fill { stroke: Highlight; }
  .ui-covr__seg { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="covr"] *, [data-ui="covr"] *::before, [data-ui="covr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-coverage-ring")) customElements.define("tc-coverage-ring", TcCoverageRing);

declare global {
  interface HTMLElementTagNameMap {
    "tc-coverage-ring": TcCoverageRing;
  }
}
