import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { axisXBand, gridX, gridY, txt, yAxisWidth } from "./internal/chart/axis";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { makeTickFormatter } from "./internal/chart/format";
import { resolveHighlight } from "./internal/chart/highlight";
import { extent, fitDomain, scaleBand, scaleLinear } from "./internal/chart/scale";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-lollipop-chart> – one value per item as a thin stem with a dot at its end: lighter than bars when there are
 * many items. Ported from ztd-charts' LollipopChart (MIT, © 2026 Junhan2). Items are ordered from the largest unless
 * sort="false"; the largest takes the accent and the rest stay quiet (`highlight` picks others). Lying down by
 * default with the names on the left, or upright with `orientation="vertical"`. Values sit past the dots; a missing
 * value is drawn at zero and written "–" so it never reads as 0. Stems grow from the baseline when the chart comes on
 * screen and glide when the data changes.
 *   · one tab stop: arrows move item to item, each read with its value
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-lollipop-chart heading="Grant hours" .data=${[{ label: "Genomics", value: 412 }]}></tc-lollipop-chart>
 */

/** A lollipop: a stem and a dot – drawn in the Lucide style (ISC, lucide.dev) */
const lollipopIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M7 8h7"></path><circle cx="16" cy="8" r="2"></circle><path d="M7 14h3"></path><circle cx="12" cy="14" r="2"></circle>`;

export type LollipopOrientation = "horizontal" | "vertical";

type Pop = { i: number; key: string; label: string; value: number; hi: boolean; datum: unknown };

/**
 * One value per item as a stem and a dot, ordered from the largest, the largest emphasised, with values past the dots
 * and a table view.
 * @tag tc-lollipop-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to an item, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - An item was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcLollipopChart<T = Row> extends TcChartElement<Pop, T> {
  static override ui = "lpp";

  /** The item's name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** Stems lying down with the names on the left ("horizontal") or upright with the names below ("vertical") */
  @property() accessor orientation: LollipopOrientation = "horizontal";
  /** Orders the items from the largest; sort="false" keeps the data's order */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor sort = true;

  protected override readonly kind = "Lollipop chart";
  protected override readonly icon = lollipopIcon;
  protected override defaultDuration = 800;
  protected override stagger = 60;
  protected override modelKeys = ["label", "value", "orientation", "sort"];

  private rows: Pop[] = [];
  private geo = {
    left: 0,
    top: 0,
    bottom: 0,
    labelW: 0,
    base: 0,
    ticks: [] as number[],
    tickFmt: ((v: number) => String(v)) as (v: number) => string,
    band: scaleBand([], [0, 1]),
    v: scaleLinear([0, 1], [0, 1]),
  };

  private get vertical() {
    return this.orientation === "vertical";
  }

  protected override defaultHeight(w: number) {
    return this.vertical ? Math.max(200, Math.min(280, w * 0.52)) : Math.max(150, Math.min(380, this.data.length * 28 + 30));
  }

  /** The value as written: "–" when missing */
  private fx(v: number, f: ChartFrame) {
    return Number.isFinite(v) ? f.fmt(v) : "–";
  }
  private fvx(v: number, f: ChartFrame) {
    return Number.isFinite(v) ? f.fv(v) : "–";
  }

  protected override buildModel(f: ChartFrame): ChartModel<Pop, T> {
    const { width: W, height: H } = f;
    const vertical = this.vertical;
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    // A missing value stays NaN: drawn at zero, written "–"
    let out: Pop[] = this.data.map((d, i) => ({ i, key: "", label: gl(d, i), value: gv(d, i), hi: false, datum: d }));
    if (this.sort) out = [...out].sort((a, b) => (b.value || 0) - (a.value || 0));
    out.forEach((r, k) => (r.i = k));
    const hi = resolveHighlight(this.highlight, out.map((r) => r.datum as T), out.map((r) => r.label), out.map((r) => r.value), "max");
    // Items with the same name get their own key, so each keeps its own track
    const seen = new Map<string, number>();
    const rows = out.map((r) => {
      const n = (seen.get(r.label) ?? 0) + 1;
      seen.set(r.label, n);
      return { ...r, key: n > 1 ? `l:${r.label}#${n}` : `l:${r.label}`, hi: hi.has(r.i) };
    });
    this.rows = rows;

    const [mn, mx] = extent(rows.map((r) => r.value).filter(Number.isFinite));
    const dom = fitDomain(mn, mx, 4);
    const tickFmt = makeTickFormatter(this.format, f.locale, Math.max(Math.abs(dom[0]), Math.abs(dom[1])));
    const labelW = vertical ? 0 : Math.min(W * 0.32, Math.max(...rows.map((r) => textWidth(r.label, AXIS_FONT, 700)), 24) + 10);
    const valPad = vertical || this.hideLabels ? 8 : Math.max(...rows.map((r) => textWidth(this.fx(r.value, f), AXIS_FONT, 700)), 10) + 16;
    // Negative values are written past the stem's end (left lying down, below upright): room for them
    const negPad = mn < 0 ? (vertical ? 16 : Math.max(...rows.map((r) => (r.value < 0 ? textWidth(this.fx(r.value, f), AXIS_FONT, 700) : 0))) + 16) : 0;
    const yTicks = scaleLinear(dom, [0, 1]).ticks(4);
    const left = vertical ? yAxisWidth(yTicks, tickFmt, f.locale) : labelW + 6;
    const top = vertical ? 16 : 4;
    const bottom = vertical ? 22 : 18;
    // Slots by position: items with the same name still get a slot each
    const keys = rows.map((_, k) => `${k}`);
    const band = vertical ? scaleBand(keys, [left + 4, W - 4], 0.4, 0.1) : scaleBand(keys, [top, H - bottom], 0.4, 0.1);
    const v = vertical ? scaleLinear(dom, [H - bottom - negPad, top]) : scaleLinear(dom, [left + negPad, W - valPad]);
    const base = v(Math.max(dom[0], 0));
    const ticks = vertical ? yTicks : v.ticks(Math.max(2, Math.round(W / 120)));
    this.geo = { left, top, bottom, labelW, base, ticks, tickFmt, band, v };

    // The second value is the dot's opacity: a zero value's dot appears though its stem doesn't grow
    const marks = rows.map((r, k) => ({ key: r.key, to: [v(r.value || 0), 1], from: [base, 0], enter: [base, 0], delay: k * this.stagger, data: r }));
    const events = rows.map((r) => ({ datum: r.datum as T, index: r.i, key: r.key, label: r.label, value: Number.isFinite(r.value) ? r.value : null, formatted: this.fvx(r.value, f) }));
    const summary = rows.map((r) => `${r.label} ${this.fvx(r.value, f)}`).join(", ");
    return { marks, events, summary };
  }

  private ink(r: Pop) {
    return r.hi ? emphasisInk(true) : "var(--tc-plot-line-rest)";
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const r = this.rows[i];
    if (!r) return null;
    const { band, v } = this.geo;
    const pos = band(`${r.i}`) + band.bandwidth / 2;
    const e = v(r.value || 0);
    const rows = [{ label: this.words.value, value: this.fvx(r.value, f), color: this.ink(r) }];
    return this.vertical ? { x: pos, y: e - 6, title: r.label, rows } : { x: e, y: pos - 6, title: r.label, rows };
  }

  protected override draw(f: ChartFrame) {
    const { width: W, height: H } = f;
    const { left, top, bottom, labelW, base, ticks, tickFmt, band, v } = this.geo;
    const vertical = this.vertical;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const rows = this.rows;
    return svg`
      ${vertical ? gridY({ ticks, y: v, x0: left, x1: W, fmt: tickFmt, locale: f.locale }) : gridX({ ticks, x: v, y0: top, y1: H - bottom, fmt: tickFmt, locale: f.locale })}
      ${m.items.map((it) => {
        // A leaving item would sit in an old slot over a new one: it isn't drawn
        if (it.exiting) return nothing;
        const r = it.data;
        const [end, o] = it.v;
        const pos = band(`${r.i}`) + band.bandwidth / 2;
        const neg = r.value < 0;
        const focus = this.active === r.i && this.via === "keyboard";
        const rad = r.hi ? 6.5 : 5.5;
        const cx = vertical ? pos : end;
        const cy = vertical ? end : pos;
        const h = this.hover(r.i);
        const lo = m.fade(r.i * this.stagger + D * 0.45, 260);
        const text = this.fx(r.value, f);
        return svg`<g class="tc-chart__mark" opacity=${this.dim(r.i)} @pointerenter=${h.enter} @click=${h.click}>
          ${vertical
            ? svg`<rect class="tc-chart__hit" x=${pos - band.step / 2} y=${top} width=${band.step} height=${Math.max(0, H - bottom - top)}></rect>`
            : svg`<rect class="tc-chart__hit" x="0" y=${pos - band.step / 2} width=${W} height=${band.step}></rect>`}
          ${vertical
            ? svg`<line class="ui-lpp__stem" x1=${pos} x2=${pos} y1=${base} y2=${end} style=${`stroke: ${emphasisInk(r.hi)}`}></line>`
            : svg`<line class="ui-lpp__stem" x1=${base} x2=${end} y1=${pos} y2=${pos} style=${`stroke: ${emphasisInk(r.hi)}`}></line>`}
          <circle class="ui-lpp__dot" cx=${cx} cy=${cy} r=${rad} style=${`fill: ${this.ink(r)}`} opacity=${Math.min(1, o * 1.5)}></circle>
          ${focus ? svg`<circle class="tc-chart__focus" cx=${cx} cy=${cy} r=${rad + 3}></circle>` : nothing}
          ${vertical ? nothing : txt(labelW, pos, truncate(r.label, labelW - 4, AXIS_FONT, 700), { anchor: "end", strong: r.hi })}
          ${this.hideLabels
            ? nothing
            : vertical
              ? txt(pos, neg ? end + 14 : end - 14, text, { cls: "value", anchor: "middle", strong: r.hi, opacity: lo })
              : txt(neg ? end - 12 : end + 12, pos, text, { cls: "value", anchor: neg ? "end" : "start", strong: r.hi, opacity: lo })}
        </g>`;
      })}
      ${vertical
        ? axisXBand({ labels: rows.map((r) => r.label), centers: rows.map((r) => band(`${r.i}`) + band.bandwidth / 2), y: H - bottom + 13, strong: new Set(rows.filter((r) => r.hi).map((r) => r.i)) })
        : nothing}`;
  }

  static override css = /* css */ `
[data-ui="lpp"] { --tc-lpp-stem: 2.2; }
.ui-lpp__stem { stroke-width: var(--tc-lpp-stem); }
/* The dot is ringed in the card's colour, so it stands off its stem and the grid */
.ui-lpp__dot { stroke: var(--tc-plot-bg); stroke-width: 2; }
@media (forced-colors: active) {
  .ui-lpp__stem, .ui-lpp__dot { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-lollipop-chart")) customElements.define("tc-lollipop-chart", TcLollipopChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-lollipop-chart": TcLollipopChart;
  }
}
