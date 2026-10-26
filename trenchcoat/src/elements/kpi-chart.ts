import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";

/*
 * <tc-kpi-chart> – the Lit port of src/components/kpi-chart.tsx: a metric card with a multi-line chart and a hover
 * tooltip. Clean is one white card with hairline shadows; the title, value and chart sit in its body and the footer
 * in the card's last row.
 *
 *   <tc-kpi-chart heading="Revenue" value="$96.4k" .labels=${["Mar 3", "Mar 4"]} .series=${series}></tc-kpi-chart>
 *
 * The plot is a focusable group: ← → Home End move the highlighted point and a status region reads it out; Esc
 * closes the tooltip. Each highlighted-point change fires a cancelable `tc-index-change` ({ index }): call
 * preventDefault() to control `index` yourself.
 */

export type KpiSeries = {
  label: string;
  /** Line color, any CSS color */
  color: string;
  /** One value per label, same length as `labels` */
  values: number[];
};

export type KpiIndexChange = { index: number | null };

/** Each line also differs by its stroke pattern, so the series don't rely on colour alone (1.4.1) */
const DASHES = ["", "5 3", "1.5 3", "7 3 1.5 3"];
const dashOf = (k: number) => DASHES[k % DASHES.length] || undefined;

/** A short sample of a line: its colour and its stroke pattern */
const swatch = (color: string, k: number) =>
  html`<svg class="ui-kpi__swatch" viewBox="0 0 14 4" aria-hidden="true">${svg`<line x1="1" y1="2" x2="13" y2="2" stroke=${color} stroke-dasharray=${ifDefined(dashOf(k))}></line>`}</svg>`;

const compact = (n: number) => (Math.abs(n) >= 1000 ? `${+(n / 1000).toFixed(Math.abs(n) >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`);

/**
 * Picks an axis range that halves cleanly and always includes 0: 30 → 15 → 0, $8k → $4k → $0, 10 → 0 → −10.
 * Empty or non-finite data falls back to 0–2 instead of NaN.
 */
export function niceRange(values: number[]): [min: number, max: number] {
  let lo = 0;
  let hi = 0;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const half = (hi - lo) / 2 || 1;
  let pow = 10 ** Math.floor(Math.log10(half));
  // Smallest nice step whose two bands, starting on a multiple of the step, cover lo…hi
  for (;;) {
    for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]) {
      const step = s * pow;
      if (step < half) continue;
      const bottom = Math.floor(lo / step) * step || 0;
      if (hi <= bottom + 2 * step) return [bottom, bottom + 2 * step];
    }
    pow *= 10;
  }
}

/**
 * A metric card with a multi-line chart, a legend and a hover tooltip.
 * @tag tc-kpi-chart
 * @fires tc-index-change - The highlighted point changes by pointer or keyboard; detail `{ index: number | null }`. Cancelable: prevent it to control `index`
 */
export class TcKpiChart extends TcElement {
  static override ui = "kpi";

  /** The card's title */
  @property() accessor heading = "";
  /** Headline value, already formatted, e.g. "$96.4k" */
  @property() accessor value = "";
  /** Change against the previous period – positive is green, negative red */
  @property({ type: Number }) accessor delta: number | undefined = undefined;
  /** Short labels along the x-axis, e.g. "Mar 4" */
  @property({ attribute: false }) accessor labels: string[] = [];
  /** Longer labels for the tooltip header, e.g. "Tue, Mar 4" – falls back to `labels` */
  @property({ attribute: false }) accessor tooltipLabels: string[] | undefined = undefined;
  @property({ attribute: false }) accessor series: KpiSeries[] = [];
  /** Formats the axis, tooltip and delta values */
  @property({ attribute: false }) accessor format: (n: number) => string = compact;
  /** Line under the chart */
  @property() accessor footer = "";
  /** A legend naming each line – unset shows it when there are two or more lines; legend="false" hides it */
  @property({ converter: { fromAttribute: (v: string | null) => (v === null ? undefined : v !== "false") } })
  accessor legend: boolean | undefined = undefined;
  /** Point that stays highlighted while nobody hovers – unset hides the tooltip at rest */
  @property({ type: Number, attribute: "default-index" }) accessor defaultIndex: number | undefined = undefined;
  /** The highlighted point, or null for none (then `defaultIndex` shows) */
  @property({ type: Number }) accessor index: number | null = null;
  /** Fill the container: no max-width, the card stretches and the plot grows with its height */
  @property({ type: Boolean }) accessor fill = false;

  /** @internal What a screen reader hears while reading the chart with the arrow keys */
  @state() private accessor spoken = "";
  /** @internal The tooltip keeps its last content while it fades out */
  private shown = 0;
  /** @internal The element set `index` itself (pointer or keys), so Esc anywhere clears it */
  private own = false;

  /** @internal */
  private get active() {
    return this.index ?? this.defaultIndex ?? null;
  }

  private onWindowKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") this.setIndex(null);
  };

  /** @internal Reports a change and applies it unless prevented */
  private setIndex(next: number | null) {
    if (Object.is(next, this.index)) return;
    if (!this.emit<KpiIndexChange>("tc-index-change", { index: next }, { cancelable: true })) return;
    this.index = next;
    this.own = next !== null;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.onWindowKey);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const active = this.active;
    if (active !== null) this.shown = active;
    this.toggleAttribute("data-fill", this.fill);
    if (changed.has("index") && this.index === null) this.own = false;
  }

  protected override updated() {
    // Hover content closes with Esc wherever focus is, without moving focus (1.4.13)
    if (this.own && this.index !== null) window.addEventListener("keydown", this.onWindowKey);
    else window.removeEventListener("keydown", this.onWindowKey);
  }

  /** @internal */
  private indexAt(e: PointerEvent) {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // A plot with no width (not laid out yet) has no point under the pointer – NaN would never settle
    if (!box.width) return null;
    const count = this.labels.length;
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    return count ? Math.round(ratio * (count - 1)) : null;
  }

  private onPointer = (e: PointerEvent) => {
    // Over the tooltip the point stays put, so the tooltip can be hovered and read
    if ((e.target as Element).closest(".ui-kpi__tooltip")) return;
    this.setIndex(this.indexAt(e));
  };
  private onLeave = () => this.setIndex(null);

  /** @internal One point read out: its date, then each line's value */
  private describe(i: number) {
    return `${(this.tooltipLabels ?? this.labels)[i]}: ${this.series.map((s) => `${s.label} ${this.format(s.values[i] ?? 0)}`).join(", ")}`;
  }

  private onKey = (e: KeyboardEvent) => {
    const count = this.labels.length;
    if (!count) return;
    const active = this.active;
    const from = active ?? (e.key === "ArrowLeft" || e.key === "End" ? count : -1);
    let next: number | null;
    if (e.key === "ArrowRight") next = Math.min(count - 1, from + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, from - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else if (e.key === "Escape") next = null;
    else return;
    e.preventDefault();
    e.stopPropagation();
    this.setIndex(next);
    this.spoken = next === null ? "" : this.describe(next);
  };

  protected override render() {
    const { labels, series, format } = this;
    const clean = this.resolvedLook === "clean";
    const count = labels.length;
    const x = (i: number) => (count > 1 ? (i / (count - 1)) * 100 : 50);
    const [min, max] = niceRange(series.flatMap((s) => s.values));
    const y = (v: number) => ((max - v) / (max - min)) * 100;
    const open = this.active !== null;
    const shown = this.shown;
    const delta = this.delta;
    const showLegend = this.legend ?? series.length > 1;
    const rows = series.map((s, k) => ({ ...s, k, value: s.values[shown] ?? 0 })).sort((a, b) => b.value - a.value);
    const flip = x(shown) > 50;
    const axis = [0, Math.round(count / 2 - 0.5), count - 1].filter((v, i, a) => a.indexOf(v) === i);

    const body = html`
      <h3 class="ui-kpi__title">${this.heading}</h3>
      <p class="ui-kpi__value">${this.value}${delta !== undefined && delta !== 0 && !Number.isNaN(delta)
          ? html`<span class="ui-kpi__delta" data-trend=${delta > 0 ? "up" : "down"}>${delta > 0 ? "+" : "−"}${format(Math.abs(delta))}</span>`
          : nothing}</p>

      <div class="ui-kpi__chart">
        <div class="ui-kpi__yaxis" aria-hidden="true">
          <span>${format(max)}</span>
          <span>${format((max + min) / 2)}</span>
          <span>${format(min)}</span>
        </div>

        <div
          class="ui-kpi__plot"
          tabindex="0"
          role="group"
          aria-label=${`${this.heading} chart – use the arrow keys to read the values per day`}
          @pointermove=${this.onPointer}
          @pointerdown=${this.onPointer}
          @pointerleave=${this.onLeave}
          @blur=${this.onLeave}
          @keydown=${this.onKey}
        >
          <span class="ui-kpi__grid" style="top: 0%"></span>
          <span class="ui-kpi__grid" style="top: 50%"></span>
          <span class="ui-kpi__grid" style="top: 100%"></span>

          <svg class="ui-kpi__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${repeat(
              series,
              (s) => s.label,
              (s, k) =>
                svg`<polyline points=${s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} stroke=${s.color} stroke-dasharray=${ifDefined(dashOf(k))} vector-effect="non-scaling-stroke"></polyline>`,
            )}
          </svg>

          <div class="ui-kpi__marker" ?data-open=${open} aria-hidden="true">
            <span class="ui-kpi__guide" style=${styleMap({ left: `${x(shown)}%` })}></span>
            ${repeat(
              series,
              (s) => s.label,
              (s) => html`<span class="ui-kpi__dot" style=${styleMap({ left: `${x(shown)}%`, top: `${y(s.values[shown] ?? 0)}%`, background: s.color })}></span>`,
            )}
          </div>

          <div class="ui-kpi__tooltip" ?data-open=${open} data-side=${flip ? "left" : "right"} style=${styleMap({ left: `${x(shown)}%` })} aria-hidden="true">
            <p class="ui-kpi__date">${(this.tooltipLabels ?? labels)[shown]}</p>
            <ul>
              ${repeat(
                rows,
                (r) => r.label,
                (r) => html`<li>${swatch(r.color, r.k)}<span class="ui-kpi__label">${r.label}</span><span class="ui-kpi__num">${format(r.value)}</span></li>`,
              )}
            </ul>
          </div>
        </div>

        <div class="ui-kpi__xaxis" aria-hidden="true">
          ${axis.map(
            (i) => html`<span style=${styleMap({ left: `${x(i)}%` })} data-edge=${ifDefined(i === 0 ? "start" : i === count - 1 ? "end" : undefined)}>${labels[i]}</span>`,
          )}
        </div>
      </div>

      ${showLegend
        ? html`<ul class="ui-kpi__legend" aria-label="Lines">
            ${series.map((s, k) => html`<li>${swatch(s.color, k)}${s.label}</li>`)}
          </ul>`
        : nothing}
      <span class="ui-kpi__sr" role="status">${this.spoken}</span>
    `;

    return html`${clean ? html`<div class="ui-kpi__body">${body}</div>` : body}${this.footer ? html`<p class="ui-kpi__footer">${this.footer}</p>` : nothing}`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="kpi"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  padding: var(--tc-space-5) var(--tc-space-5) var(--tc-space-4-5);
  /* The card pattern – its ring is the shadow, no border */
  background: var(--tc-surface-raised);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}
/* Colors and motion as variables – override them on [data-ui="kpi"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="kpi"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 460px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}
[data-ui="kpi"] *, [data-ui="kpi"] *::before, [data-ui="kpi"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__title {
  margin: 0;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__value {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-2-5);
  margin: var(--tc-space-2) 0 0;
  font-size: var(--tc-font-size-4xl);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-display);
  letter-spacing: -0.02em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__delta {
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__delta[data-trend="up"] { color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__delta[data-trend="down"] { color: var(--tc-status-danger-fg); }
/* Chart: y labels on the left, plot on the right, x labels below */
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__chart {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 116px 20px;
  column-gap: var(--tc-space-3);
  row-gap: var(--tc-space-2);
  margin-top: var(--tc-space-6);
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__yaxis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: -9px 0;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  text-align: right;
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__body { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-3); }
/* Title, the big number and the change as a tinted badge */
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__title {
  margin: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-lg-plus);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-loose);
  color: var(--tc-text-strong);
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__value {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  margin: var(--tc-space-1-5) 0 0;
  font-size: var(--tc-font-size-3xl);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-display);
  letter-spacing: -0.02em;
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__delta {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px-lg);
  border-radius: var(--tc-pill-radius);
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  letter-spacing: 0;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__delta[data-trend="up"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__delta[data-trend="down"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* Chart: y labels on the left, plot on the right, x labels below */
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__chart {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 124px 16px;
  column-gap: var(--tc-space-2-5);
  row-gap: var(--tc-space-2);
  margin-top: var(--tc-space-5);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__yaxis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: -8px 0;
  font-size: var(--tc-font-size-xs);
  line-height: var(--tc-line-height-tight);
  text-align: right;
  color: var(--tc-text-muted);
}
.ui-kpi__plot {
  position: relative;
  touch-action: pan-y;
  outline: none;
  cursor: crosshair;
}
/* A real outline (it shows in forced colours too), clear of the lines */
.ui-kpi__plot:focus-visible {
  border-radius: var(--tc-radius-xs);
  outline: var(--tc-focus-outline);
  outline-offset: 4px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__grid {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--tc-border-subtle);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__grid {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
.ui-kpi__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  animation: ui-kpi-draw var(--tc-duration-reveal-slow) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__lines polyline {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Hover marker: thin guide and one dot per line */
.ui-kpi__marker {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__lines polyline {
  fill: none;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Hover marker: a hairline guide and one dot per line – short, crisp moves between points */
.ui-kpi__marker[data-open] { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__guide,
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__dot {
  position: absolute;
  transition: left var(--tc-duration-base) var(--tc-ease-move), top var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__guide {
  top: -4px;
  bottom: 0;
  width: 1px;
  margin-left: -0.5px;
  background: var(--tc-border-strong);
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__dot {
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--tc-surface-raised);
}
/* Tooltip: sits beside the guide, flips to the left on the right half */
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__tooltip {
  position: absolute;
  top: -12px;
  z-index: 2;
  min-width: 176px;
  padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3);
  /* A popover: the menu surface */
  background: var(--tc-menu-bg);
  border-radius: var(--tc-menu-radius);
  box-shadow: var(--tc-menu-shadow);
  opacity: 0;
  transform: translateX(var(--tc-kpi-chart-shift)) scale(0.97);
  transition:
    left var(--tc-duration-base) var(--tc-ease-move),
    opacity var(--tc-duration-fast) var(--tc-ease-standard),
    transform var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__guide,
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__dot {
  position: absolute;
  transition: left var(--tc-duration-instant) var(--tc-ease-decelerate), top var(--tc-duration-instant) var(--tc-ease-decelerate);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__guide {
  top: -4px;
  bottom: 0;
  width: 0;
  border-left: 1px solid var(--tc-border-strong);
  margin-left: -0.5px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__dot {
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--tc-surface-raised);
}
/* Tooltip: a small white popover beside the guide, flips to the left on the right half */
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__tooltip {
  position: absolute;
  top: -8px;
  z-index: 2;
  min-width: 160px;
  padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-2);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  opacity: 0;
  transform: translateX(var(--tc-kpi-chart-shift)) scale(0.98);
  transition:
    left var(--tc-duration-instant) var(--tc-ease-decelerate),
    opacity var(--tc-duration-quick) var(--tc-ease-standard),
    transform var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-kpi__tooltip[data-side="right"] { --tc-kpi-chart-shift: 14px; transform-origin: left top; }
.ui-kpi__tooltip[data-side="left"] { --tc-kpi-chart-shift: calc(-100% - 14px); transform-origin: right top; }
/* Closed, it lets the pointer through; open, it can be hovered (1.4.13) */
.ui-kpi__tooltip:not([data-open]) { pointer-events: none; }
.ui-kpi__tooltip[data-open] {
  opacity: 1;
  transform: translateX(var(--tc-kpi-chart-shift));
  cursor: default;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__date {
  margin: 0 0 var(--tc-space-1-5);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__tooltip ul {
  display: grid;
  gap: var(--tc-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__tooltip li {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__swatch {
  flex: none;
  width: 14px;
  height: 4px;
  overflow: visible;
  stroke-width: 2;
  stroke-linecap: round;
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__label {
  flex: 1;
  white-space: nowrap;
  color: var(--tc-text-secondary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__num {
  padding-left: var(--tc-space-4);
  font-weight: var(--tc-font-weight-medium);
}
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__xaxis {
  position: relative;
  grid-column: 2;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__date {
  margin: 0;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-strong);
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__tooltip ul {
  display: grid;
  gap: 0;
  margin: var(--tc-space-1) 0 0;
  padding: var(--tc-space-1) 0 0;
  border-top: var(--tc-hairline) solid var(--tc-divider);
  list-style: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__tooltip li {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__swatch {
  flex: none;
  width: 14px;
  height: 4px;
  overflow: visible;
  stroke-width: 1.5;
  stroke-linecap: round;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__label {
  flex: 1;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__num {
  padding-left: var(--tc-space-4);
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__xaxis {
  position: relative;
  grid-column: 2;
  font-size: var(--tc-font-size-xs);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
}
.ui-kpi__xaxis span {
  position: absolute;
  top: 0;
  white-space: nowrap;
  transform: translateX(-50%);
}
.ui-kpi__xaxis span[data-edge="start"] { transform: none; }
.ui-kpi__xaxis span[data-edge="end"] { transform: translateX(-100%); }
:where([data-look="standard"], [data-look="standard"] *).ui-kpi__footer {
  margin: var(--tc-space-4) 0 0;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-muted);
}
/* The last row of the card */
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__footer {
  margin: 0;
  padding: var(--tc-space-2-5) var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
}
/* Legend: each line's name with its colour and stroke pattern */
.ui-kpi__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tc-space-1) var(--tc-space-3-5);
  margin: var(--tc-space-3) 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-secondary);
}
.ui-kpi__legend li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-kpi__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* fill: the card takes its container's width and stretched height, and the plot row grows to use it */
[data-ui="kpi"][data-fill] {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  max-width: none;
}
[data-ui="kpi"][data-fill] > .ui-kpi__body { display: flex; flex: 1 0 auto; flex-direction: column; }
[data-ui="kpi"][data-fill] .ui-kpi__chart { flex: 1 0 auto; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="kpi"][data-fill] .ui-kpi__chart { grid-template-rows: minmax(116px, 1fr) 20px; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="kpi"][data-fill] .ui-kpi__chart { grid-template-rows: minmax(124px, 1fr) 16px; }
@keyframes ui-kpi-draw {
  from { clip-path: inset(-10% 100% -10% 0); }
  to { clip-path: inset(-10% -2% -10% 0); }
}
/* Narrow (phones): tighter padding, a slightly shorter plot */
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__body { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__chart { grid-template-rows: 112px 16px; column-gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="kpi"][data-fill] .ui-kpi__chart { grid-template-rows: minmax(112px, 1fr) 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__footer { padding: var(--tc-space-2-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__tooltip { min-width: 144px; }
:where([data-look="clean"], [data-look="clean"] *).ui-kpi__num { padding-left: var(--tc-space-3); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-kpi__lines { animation: none; }
  .ui-kpi__marker, .ui-kpi__guide, .ui-kpi__dot, .ui-kpi__tooltip { transition: none; }
}
`;
}

if (!customElements.get("tc-kpi-chart")) customElements.define("tc-kpi-chart", TcKpiChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-kpi-chart": TcKpiChart;
  }
}
