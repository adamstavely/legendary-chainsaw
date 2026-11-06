import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { gridX, txt } from "./internal/chart/axis";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { resolveHighlight } from "./internal/chart/highlight";
import { extent, fitDomain, scaleLinear } from "./internal/chart/scale";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-dumbbell-chart> – two values per item joined by a bar: before and after, target and actual. Ported from
 * ztd-charts' DumbbellChart (MIT, © 2026 Junhan2). Each row is an item, its start a hollow dot and its end a solid
 * one, ordered by the end value unless sort="false"; the item that moved most takes the accent and the rest stay
 * quiet (`highlight` picks others). The end value is written past its dot. The bars stretch from the start to the end
 * when the chart comes on screen and glide when the data changes. The legend names the two dots in the header, or
 * above the plot when `bare`.
 *   · one tab stop: arrows move row to row, each read with both values
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-dumbbell-chart heading="Audit score" .data=${[{ label: "Genomics", start: 62, end: 81 }]}></tc-dumbbell-chart>
 */

/** A dumbbell: two dots and the bar between – drawn in the Lucide style (ISC, lucide.dev) */
const dumbbellIcon = svg`<path d="M7 6h10"></path><circle cx="5" cy="6" r="2"></circle><circle cx="19" cy="6" r="2"></circle><path d="M5 18h8"></path><circle cx="3" cy="18" r="2"></circle><circle cx="15" cy="18" r="2"></circle><path d="M9 12h10"></path><circle cx="7" cy="12" r="2"></circle><circle cx="21" cy="12" r="2"></circle>`;

type Bell = { i: number; key: string; label: string; a: number; b: number; hi: boolean; datum: unknown };

/**
 * Two values per item – before and after, target and actual – as dots joined by a bar, the item that moved most
 * emphasised, with the end values written beside and a table view.
 * @tag tc-dumbbell-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a row, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A row was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcDumbbellChart<T = Row> extends TcChartElement<Bell, T> {
  static override ui = "dmb";

  /** The item's name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The first value's field (before, target); by default "start" */
  @property({ attribute: false }) accessor start: Accessor<T, number> | undefined = undefined;
  /** The second value's field (after, actual); by default "end" */
  @property({ attribute: false }) accessor end: Accessor<T, number> | undefined = undefined;
  /** The first value's name in the legend and tooltip */
  @property({ attribute: "start-label" }) accessor startLabel = "Before";
  /** The second value's name in the legend and tooltip */
  @property({ attribute: "end-label" }) accessor endLabel = "After";
  /** The name of the difference in the tooltip */
  @property({ attribute: "change-label" }) accessor changeLabel = "Difference";
  /** Orders the rows by the second value, largest first; sort="false" keeps the data's order */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor sort = true;
  /** Starts the axis at zero */
  @property({ type: Boolean }) accessor zero = false;

  protected override readonly kind = "Dumbbell chart";
  protected override readonly icon = dumbbellIcon;
  protected override defaultDuration = 800;
  protected override stagger = 70;
  protected override modelKeys = ["label", "start", "end", "startLabel", "endLabel", "changeLabel", "sort", "zero", "bare"];

  private rows: Bell[] = [];
  private geo = {
    top: 0,
    bottom: 0,
    labelW: 0,
    band: 0,
    ticks: [] as number[],
    x: scaleLinear([0, 1], [0, 1]),
  };

  protected override defaultHeight() {
    return Math.max(150, Math.min(360, this.data.length * 30 + (this.bare ? 44 : 30)));
  }

  protected override tableHeader() {
    return "Item";
  }

  private yOf(k: number) {
    return this.geo.top + this.geo.band * k + this.geo.band / 2;
  }

  private diff(r: Bell, f: ChartFrame) {
    const d = r.b - r.a;
    return `${d >= 0 ? "+" : "−"}${f.fmt(Math.abs(d))}${this.unit}`;
  }

  protected override buildModel(f: ChartFrame): ChartModel<Bell, T> {
    const { width: W, height: H } = f;
    const gl = strGetter(this.label, "label");
    const ga = numGetter(this.start, "start");
    const gb = numGetter(this.end, "end");
    let out: Bell[] = this.data
      .map((d, i) => ({ i, key: "", label: gl(d, i), a: ga(d, i), b: gb(d, i), hi: false, datum: d as unknown }))
      .filter((r) => Number.isFinite(r.a) && Number.isFinite(r.b));
    if (this.sort) out = [...out].sort((x, y) => y.b - x.b);
    out.forEach((r, k) => (r.i = k));
    const hi = resolveHighlight(this.highlight, out.map((r) => r.datum as T), out.map((r) => r.label), out.map((r) => r.b - r.a), "max");
    const seen = new Map<string, number>();
    const rows = out.map((r) => {
      const n = (seen.get(r.label) ?? 0) + 1;
      seen.set(r.label, n);
      return { ...r, key: n > 1 ? `d:${r.label}#${n}` : `d:${r.label}`, hi: hi.has(r.i) };
    });
    this.rows = rows;

    const [mn, mx] = extent(rows.flatMap((r) => [r.a, r.b]));
    const dom = fitDomain(mn, mx, 4, { zero: this.zero, pad: 0.08 });
    const labelW = Math.min(W * 0.3, Math.max(...rows.map((r) => textWidth(r.label, AXIS_FONT, 700)), 24) + 10);
    // Bare: the legend is drawn above the rows, so they start lower
    const top = this.bare ? 22 : 8;
    const bottom = 18;
    const valPad = this.hideLabels ? 8 : Math.max(...rows.map((r) => textWidth(f.fmt(r.b), AXIS_FONT, 700)), 10) + 14;
    // A fall writes its value left of the end dot: room for it, so it never runs into the name
    const fallPad = this.hideLabels ? 0 : Math.max(0, ...rows.map((r) => (r.b < r.a ? textWidth(f.fmt(r.b), AXIS_FONT, 700) + 10 : 0)));
    const x = scaleLinear(dom, [labelW + 10 + fallPad, W - valPad]);
    const band = (H - top - bottom) / Math.max(1, rows.length);
    const ticks = x.ticks(Math.max(2, Math.round(W / 120)));
    this.geo = { top, bottom, labelW, band, ticks, x };

    // [start x, end x, the end dot's opacity]: the bar stretches from the start dot to the end
    const marks = rows.map((r, k) => ({ key: r.key, to: [x(r.a), x(r.b), 1], from: [x(r.a), x(r.a), 0], enter: [x(r.a), x(r.a), 0], delay: k * this.stagger, data: r }));
    const events = rows.map((r) => ({ datum: r.datum as T, index: r.i, key: r.key, label: r.label, value: r.b, formatted: `${this.startLabel} ${f.fv(r.a)} → ${this.endLabel} ${f.fv(r.b)}` }));
    const summary = rows.map((r) => `${r.label} ${f.fv(r.a)} to ${f.fv(r.b)}`).join(", ");
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const r = this.rows[i];
    if (!r) return null;
    return {
      x: this.geo.x(Math.max(r.a, r.b)),
      y: this.yOf(r.i) - 6,
      title: r.label,
      rows: [
        { label: this.startLabel, value: f.fv(r.a), color: "var(--tc-plot-rest)", strong: false },
        { label: this.endLabel, value: f.fv(r.b), color: r.hi ? emphasisInk(true) : "var(--tc-plot-line-rest)" },
        { label: this.changeLabel, value: this.diff(r, f), strong: false },
      ],
    };
  }

  /** A legend dot: hollow for the start, solid for the end */
  private keyDot(end: boolean) {
    return html`<svg class="ui-dmb__key" viewBox="0 0 12 12" aria-hidden="true">${end
      ? svg`<circle class="ui-dmb__end" cx="6" cy="6" r="5" style="fill: var(--tc-plot-line-rest)"></circle>`
      : svg`<circle class="ui-dmb__start" cx="6" cy="6" r="4"></circle>`}</svg>`;
  }

  protected override headerLegend() {
    if (this.bare || !this.rows.length) return nothing;
    return html`<ul class="tc-chart__legend" aria-label="Values">
      <li class="tc-chart__key">${this.keyDot(false)}${this.startLabel}</li>
      <li class="tc-chart__key">${this.keyDot(true)}${this.endLabel}</li>
    </ul>`;
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { top, bottom, labelW, band, ticks, x } = this.geo;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const lx = labelW + 14;
    const lx2 = labelW + 34 + textWidth(this.startLabel, AXIS_FONT);
    return svg`
      ${gridX({ ticks, x, y0: top - 4, y1: H - bottom, fmt: f.fmt, locale: f.locale })}
      ${this.bare
        ? svg`<g>
            <circle class="ui-dmb__start" cx=${lx} cy="8" r="3.5"></circle>${txt(lx + 8, 8, this.startLabel)}
            <circle class="ui-dmb__end" cx=${lx2} cy="8" r="4.5" style="fill: var(--tc-plot-line-rest)"></circle>${txt(lx2 + 8, 8, this.endLabel)}
          </g>`
        : nothing}
      ${m.items.map((it) => {
        // Rows go by their current order (r.i); a leaving row would sit over a new one, so it isn't drawn
        if (it.exiting) return nothing;
        const r = it.data;
        const k = r.i;
        const [xa, xb, o] = it.v;
        const cy = this.yOf(k);
        const right = xb >= xa;
        const focus = this.active === k && this.via === "keyboard";
        const h = this.hover(k);
        return svg`<g class="tc-chart__mark" opacity=${this.dim(k)} @pointerenter=${h.enter} @click=${h.click}>
          <rect class="tc-chart__hit" x="0" y=${cy - band / 2} width=${W} height=${band}></rect>
          <line class="ui-dmb__bar" ?data-hi=${r.hi} x1=${xa} x2=${xb} y1=${cy} y2=${cy} style=${`stroke: ${emphasisInk(r.hi)}`}></line>
          <circle class="ui-dmb__start" cx=${xa} cy=${cy} r="4" opacity=${Math.min(1, o * 2)}></circle>
          <circle class="ui-dmb__end" cx=${xb} cy=${cy} r="5.5" style=${`fill: ${r.hi ? emphasisInk(true) : "var(--tc-plot-line-rest)"}`} opacity=${o}></circle>
          ${focus ? svg`<circle class="tc-chart__focus" cx=${xb} cy=${cy} r="8.5"></circle>` : nothing}
          ${txt(labelW, cy, truncate(r.label, labelW - 4, AXIS_FONT, 700), { anchor: "end", strong: r.hi })}
          ${this.hideLabels ? nothing : txt(right ? xb + 10 : xb - 10, cy, f.fmt(r.b), { cls: "value", anchor: right ? "start" : "end", strong: r.hi, opacity: m.fade(k * this.stagger + D * 0.4, 260) })}
        </g>`;
      })}`;
  }

  static override css = /* css */ `
[data-ui="dmb"] { --tc-dmb-bar: 4; --tc-dmb-bar-hi-opacity: 0.55; --tc-dmb-key: 12px; }
.ui-dmb__bar { stroke-width: var(--tc-dmb-bar); stroke-linecap: round; }
.ui-dmb__bar[data-hi] { stroke-opacity: var(--tc-dmb-bar-hi-opacity); }
/* The start: a hollow dot in the quiet line ink, so it reads apart from the end by shape as well as shade */
.ui-dmb__start { fill: var(--tc-plot-bg); stroke: var(--tc-plot-line-rest); stroke-width: 2; }
.ui-dmb__key { width: var(--tc-dmb-key); height: var(--tc-dmb-key); flex: none; overflow: visible; }
@media (forced-colors: active) {
  .ui-dmb__bar, .ui-dmb__start, .ui-dmb__end { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-dumbbell-chart")) customElements.define("tc-dumbbell-chart", TcDumbbellChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-dumbbell-chart": TcDumbbellChart;
  }
}
