import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-radar-chart> – a few measures of one thing on axes round a centre, the values joined into a shape: how someone's
 * work splits across commits, reviews, issues and pull requests, or how three teams score on the same five skills. The
 * axes run from the centre (nothing) to the edge (`max`, by default the largest value); with `grid="web"` rings mark
 * each quarter. One series shows its value over each axis's name (“90% Commits”); up to three compare, each in its own
 * colour, named in a legend under the chart. The Table button swaps the drawing for the same numbers as a table.
 *   · the drawing is an image named by the heading and read as its numbers (“Commits 90%, Code review 0%, …”); the
 *     names and values on it repeat that and are hidden
 *   · narrow, the drawing shrinks to fit, up to `--tc-rdr-width` wide
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-radar-chart heading="Activity overview" unit="%" .axes=${["Code review", "Issues", "Pull requests", "Commits"]}
 *     .series=${[{ name: "Contributions", values: [0, 0, 10, 90] }]}></tc-radar-chart>
 */

/** A radar: Lucide (ISC, lucide.dev) */
const radarIcon = svg`<path d="M12 2 21.5 9 18 20H6L2.5 9Z"></path><path d="M12 7 16.5 10.5 15 15H9.5L7.5 10.5Z"></path>`;

export type RadarSeries = {
  /** Its name, in the legend and the table */
  name: string;
  /** One value per axis, in the axes' order; null (or missing) is no data */
  values: (number | null)[];
};
export type RadarGrid = "axes" | "web";
export type RadarView = "chart" | "table";

/** Details of the events */
export type RadarViewChange = { view: RadarView };

let uidCount = 0;

/* The drawing's box: wider than tall, so the names at the sides have room */
const W = 150;
const H = 100;
const CX = W / 2;
const CY = H / 2;
const R = 31;
/** The most series it draws */
const MAX_SERIES = 3;

/**
 * Values on three or more axes round a centre, joined into a shape – one series with its values on the axes, or up to
 * three compared – as a cross of axes or a web of rings, with a table view.
 * @tag tc-radar-chart
 * @fires tc-view-change - The chart / table switch was pressed ({ view }: RadarViewChange); cancelable – prevented, `view` stays as it was
 */
export class TcRadarChart extends TcElement {
  static override ui = "rdr";

  /** The heading, and the drawing's name */
  @property() accessor heading = "Radar chart";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The axes' names, clockwise from the top */
  @property({ attribute: false }) accessor axes: string[] = [];
  /** The series to draw – the first three; each has a value per axis */
  @property({ attribute: false }) accessor series: RadarSeries[] = [];
  /** The value at the edge; by default the largest value (100 when the unit is "%") */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** Bare axes from the centre ("axes"), or rings at each quarter as well ("web") */
  @property() accessor grid: RadarGrid = "axes";
  /** The unit after each number: "%", "pts" */
  @property() accessor unit: string | undefined = undefined;
  /** Writes a value, e.g. (v) => `${v} of 5`; replaces the number and `unit` */
  @property({ attribute: false }) accessor format: ((value: number) => string) | undefined = undefined;
  /** Leaves the values off the axes' names, for one series */
  @property({ type: Boolean, attribute: "hide-values" }) accessor hideValues = false;
  /** The table's corner: what the axes are */
  @property({ attribute: "axis-header" }) accessor axisHeader = "Measure";
  /** The chart or the same numbers as a table. Changed by the Table button unless a tc-view-change listener calls preventDefault() */
  @property() accessor view: RadarView = "chart";
  /** The language for numbers, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  private uid = `tc-rdr-${++uidCount}`;

  /* ---------- The model ---------- */

  private get drawn() {
    return this.series.slice(0, MAX_SERIES);
  }
  private valueAt(s: RadarSeries, axis: number) {
    const v = s.values?.[axis];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  private get top() {
    if (this.max !== undefined && Number.isFinite(this.max) && this.max > 0) return this.max;
    if (this.unit === "%" && !this.format) return 100;
    let hi = 0;
    for (const s of this.drawn) for (let i = 0; i < this.axes.length; i++) hi = Math.max(hi, this.valueAt(s, i) ?? 0);
    return hi > 0 ? hi : 1;
  }
  private say(v: number | null) {
    if (v === null) return "No data";
    if (this.format) return this.format(v);
    const n = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(v);
    if (!this.unit) return n;
    return /^[%°]/.test(this.unit) ? `${n}${this.unit}` : `${n} ${this.unit}`;
  }
  /** The angle of an axis, in radians: the first straight up, then clockwise */
  private angle(i: number) {
    return -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, this.axes.length);
  }
  private point(i: number, f: number) {
    const a = this.angle(i);
    return [CX + R * f * Math.cos(a), CY + R * f * Math.sin(a)] as const;
  }
  private frac(v: number | null) {
    return v === null ? 0 : Math.max(0, Math.min(1, v / this.top));
  }
  /** How the drawing is read: each axis with its value, or each series' values in turn */
  private get summary() {
    const drawn = this.drawn;
    if (drawn.length === 1) return this.axes.map((a, i) => `${a} ${this.say(this.valueAt(drawn[0], i))}`).join(", ");
    return drawn.map((s) => `${s.name}: ${this.axes.map((a, i) => `${a} ${this.say(this.valueAt(s, i))}`).join(", ")}`).join(". ");
  }

  private setView(view: RadarView) {
    if (view === this.view) return;
    if (!this.emit<RadarViewChange>("tc-view-change", { view }, { cancelable: true })) return;
    this.view = view;
  }

  /* ---------- Rendering ---------- */

  private renderDrawing() {
    const n = this.axes.length;
    const drawn = this.drawn;
    const ring = (f: number) =>
      Array.from({ length: n }, (_, i) => this.point(i, f).map((c) => c.toFixed(2)).join(",")).join(" ");
    return svg`<svg class="ui-rdr__svg" viewBox=${`0 0 ${W} ${H}`} aria-hidden="true">
      ${this.grid === "web" && n >= 3 ? [0.25, 0.5, 0.75, 1].map((f) => svg`<polygon class="ui-rdr__ring" points=${ring(f)}></polygon>`) : nothing}
      ${this.axes.map((_, i) => {
        const [x, y] = this.point(i, 1);
        return svg`<line class="ui-rdr__axis" x1=${CX} y1=${CY} x2=${x.toFixed(2)} y2=${y.toFixed(2)}></line>`;
      })}
      ${drawn.map((s, k) => {
        const pts = this.axes.map((_, i) => this.point(i, this.frac(this.valueAt(s, i))));
        return svg`<g class="ui-rdr__series" data-series=${k + 1}>
          <polygon class="ui-rdr__shape" points=${pts.map((p) => p.map((c) => c.toFixed(2)).join(",")).join(" ")}></polygon>
          ${pts.map(([x, y], i) => (!this.valueAt(s, i) ? nothing : svg`<circle class="ui-rdr__dot" cx=${x.toFixed(2)} cy=${y.toFixed(2)} r="2"></circle>`))}
        </g>`;
      })}
    </svg>`;
  }

  private renderLabels() {
    const one = this.drawn.length === 1 && !this.hideValues ? this.drawn[0] : null;
    return html`<div class="ui-rdr__labels" aria-hidden="true">
      ${this.axes.map((name, i) => {
        const a = this.angle(i);
        const [x, y] = this.point(i, 1.12);
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        // Which side of its point the name sits on: beside it at the sides, above or below it at the top and bottom
        const side = Math.abs(cos) < 0.3 ? (sin < 0 ? "top" : "bottom") : cos < 0 ? "left" : "right";
        const v = one ? this.valueAt(one, i) : null;
        return html`<span class="ui-rdr__label" data-side=${side} style=${`left: ${((x / W) * 100).toFixed(2)}%; top: ${((y / H) * 100).toFixed(2)}%`}>
          ${one && v !== null ? html`<span class="ui-rdr__value">${this.say(v)}</span>` : nothing}<span class="ui-rdr__name">${name}</span>
        </span>`;
      })}
    </div>`;
  }

  private renderTable() {
    const drawn = this.drawn;
    return html`<div class="ui-rdr__scroll">
      <table class="ui-rdr__table">
        <caption class="tc-sr-only">${this.heading}</caption>
        <thead>
          <tr>
            <th scope="col">${this.axisHeader}</th>
            ${drawn.map((s) => html`<th scope="col">${s.name}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.axes.map(
            (name, i) => html`<tr>
              <th scope="row">${name}</th>
              ${drawn.map((s) => {
                const v = this.valueAt(s, i);
                return html`<td ?data-none=${v === null}>${this.say(v)}</td>`;
              })}
            </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const has = this.axes.length > 0 && this.drawn.length > 0;
    const table = this.view === "table";
    const legend = this.drawn.length > 1;
    return html`
      ${cardHead({
        icon: radarIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: has
          ? html`<button type="button" class="tc-btn-sm ui-rdr__toggle" aria-pressed=${table ? "true" : "false"} @click=${() => this.setView(table ? "chart" : "table")}>Table</button>`
          : nothing,
      })}
      <div class="ui-rdr__card">
        ${!has
          ? html`<p class="ui-rdr__empty">No data to show.</p>`
          : table
            ? this.renderTable()
            : html`<div class="ui-rdr__body">
                  <div class="ui-rdr__plot" role="img" aria-labelledby=${`${id}-title ${id}-read`} data-grid=${this.grid}>
                    ${this.renderDrawing()} ${this.renderLabels()}
                  </div>
                  <span class="tc-sr-only" id=${`${id}-read`}>${this.summary}</span>
                </div>
                ${legend
                  ? html`<ul class="ui-rdr__legend" aria-label="Series">
                      ${this.drawn.map((s, k) => html`<li class="ui-rdr__key" data-series=${k + 1}><span class="ui-rdr__swatch" aria-hidden="true"></span>${s.name}</li>`)}
                    </ul>`
                  : nothing}`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rdr"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rdr"] {
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
/* The drawing's width, the axes' colour and each series' ink – override any of them on the element */
[data-ui="rdr"] { --tc-rdr-width: 420px; --tc-rdr-axis: var(--tc-border-strong); --tc-rdr-ink-1: var(--tc-chart-1); --tc-rdr-ink-2: var(--tc-chart-2); --tc-rdr-ink-3: var(--tc-chart-3); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rdr"] { --tc-rdr-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rdr"] { --tc-rdr-bg: var(--tc-surface-raised); }
[data-ui="rdr"] *, [data-ui="rdr"] *::before, [data-ui="rdr"] *::after { box-sizing: border-box; }
[data-ui="rdr"] p { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rdr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-rdr__toggle[aria-pressed="true"] { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); box-shadow: none; }
/* ----- The drawing: up to its width, shrinking to fit ----- */
.ui-rdr__body { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-6); }
:where([data-look="clean"], [data-look="clean"] *).ui-rdr__body { padding-top: var(--tc-space-2); }
.ui-rdr__plot { position: relative; width: 100%; max-width: var(--tc-rdr-width); margin: 0 auto; aspect-ratio: 3 / 2; }
/* The table scrolls when it's wider than the card */
.ui-rdr__scroll { overflow-x: auto; padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-4); scrollbar-width: thin; }
.ui-rdr__svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; overflow: visible; }
.ui-rdr__axis { stroke: var(--tc-rdr-axis); stroke-width: 0.6; stroke-linecap: round; }
.ui-rdr__ring { fill: none; stroke: var(--tc-border-subtle); stroke-width: 0.4; }
.ui-rdr__series[data-series="1"] { --tc-rdr-ink: var(--tc-rdr-ink-1); }
.ui-rdr__series[data-series="2"] { --tc-rdr-ink: var(--tc-rdr-ink-2); }
.ui-rdr__series[data-series="3"] { --tc-rdr-ink: var(--tc-rdr-ink-3); }
.ui-rdr__shape { fill: color-mix(in srgb, var(--tc-rdr-ink) 32%, transparent); stroke: var(--tc-rdr-ink); stroke-width: 1; stroke-linejoin: round; }
.ui-rdr__dot { fill: var(--tc-rdr-bg); stroke: var(--tc-rdr-ink); stroke-width: 1; }
/* The axes' names, at their ends; one series' value over each */
.ui-rdr__labels { position: absolute; inset: 0; pointer-events: none; }
.ui-rdr__label { position: absolute; display: grid; justify-items: center; gap: var(--tc-space-0-5); max-width: 29%; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); text-align: center; }
.ui-rdr__label[data-side="top"] { transform: translate(-50%, -100%); }
.ui-rdr__label[data-side="bottom"] { transform: translate(-50%, 0); }
.ui-rdr__label[data-side="left"] { transform: translate(-100%, -50%); justify-items: end; text-align: right; }
.ui-rdr__label[data-side="right"] { transform: translate(0, -50%); justify-items: start; text-align: left; }
@container (max-width: 400px) { .ui-rdr__label { font-size: var(--tc-font-size-xs); } }
.ui-rdr__name { overflow-wrap: break-word; }
.ui-rdr__value { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* The legend */
.ui-rdr__legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--tc-space-1) var(--tc-space-4); margin: 0; padding: 0 var(--tc-space-4) var(--tc-space-4); list-style: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-rdr__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-rdr__key[data-series="1"] { --tc-rdr-ink: var(--tc-rdr-ink-1); }
.ui-rdr__key[data-series="2"] { --tc-rdr-ink: var(--tc-rdr-ink-2); }
.ui-rdr__key[data-series="3"] { --tc-rdr-ink: var(--tc-rdr-ink-3); }
.ui-rdr__swatch { width: 10px; height: 10px; border: 1.5px solid var(--tc-rdr-ink); border-radius: var(--tc-radius-xs); background: color-mix(in srgb, var(--tc-rdr-ink) 32%, transparent); }
/* ----- The table view ----- */
.ui-rdr__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-rdr__table th, .ui-rdr__table td { padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: 1px solid var(--tc-border-subtle); text-align: right; white-space: nowrap; }
.ui-rdr__table th { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-rdr__table th[scope="row"], .ui-rdr__table thead th:first-child { text-align: left; color: var(--tc-text-secondary); }
.ui-rdr__table td { color: var(--tc-text-primary); }
.ui-rdr__table td[data-none] { color: var(--tc-text-muted); }
.ui-rdr__empty { padding: var(--tc-space-6) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
@media (forced-colors: active) {
  .ui-rdr__axis, .ui-rdr__ring { stroke: GrayText; }
  .ui-rdr__shape { fill: none; stroke: Highlight; }
  .ui-rdr__dot { fill: Canvas; stroke: Highlight; }
  .ui-rdr__swatch { border-color: Highlight; background: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rdr"] *, [data-ui="rdr"] *::before, [data-ui="rdr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-radar-chart")) customElements.define("tc-radar-chart", TcRadarChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-radar-chart": TcRadarChart;
  }
}
