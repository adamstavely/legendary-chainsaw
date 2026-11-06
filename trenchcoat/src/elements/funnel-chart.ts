import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { r2, roundRectPath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-funnel-chart> – how many are left at each step of a process, as centred bars narrowing down the page, joined by
 * curved necks, with each step's conversion rate at the right. Ported from ztd-charts' FunnelChart (MIT, © 2026
 * Junhan2). The step with the lowest rate – the biggest drop – takes the accent and the rest stay quiet (`highlight`
 * picks others). Names and counts sit at the left, rates against the step before (or the first, `rate-base="first"`)
 * at the right. The bars widen out step after step when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move step to step, each read with its count and rate
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-funnel-chart heading="Grant pipeline" .data=${[{ label: "Submitted", value: 240 }, …]}></tc-funnel-chart>
 */

/** A funnel: Lucide (ISC, lucide.dev) */
const funnelIcon = svg`<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"></path>`;

/** What each step's rate is measured against: the step before, or the first */
export type FunnelRateBase = "previous" | "first";

type Stage<T> = { i: number; label: string; value: number; rate: number | null; w: number; hi: boolean; ink: string; datum: T };

/**
 * Steps of a process as centred bars narrowing down the page, with each step's conversion rate and the biggest drop
 * emphasised, and a table view.
 * @tag tc-funnel-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a step, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A step was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcFunnelChart<T = Row> extends TcChartElement<Stage<T>, T> {
  static override ui = "fnl";

  /** The step's name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The count field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** Leaves out the rates at the right */
  @property({ type: Boolean, attribute: "hide-rates" }) accessor hideRates = false;
  /** What each rate is measured against: "previous" (the step before) or "first" */
  @property({ attribute: "rate-base" }) accessor rateBase: FunnelRateBase = "previous";
  /** The rates' column heading; by default "vs. previous" or "vs. first" */
  @property({ attribute: "rate-label" }) accessor rateLabel: string | undefined = undefined;

  protected override readonly kind = "Funnel chart";
  protected override readonly icon = funnelIcon;
  protected override defaultDuration = 800;
  protected override stagger = 110;
  protected override modelKeys = ["label", "value", "hideRates", "rateBase", "rateLabel"];

  private stages: Stage<T>[] = [];
  private geo = { labelW: 0, top: 0, band: 0, barH: 0, cxm: 0, showRates: true, rateTitle: "" };

  protected override defaultHeight(w: number) {
    return Math.max(180, Math.min(260, w * 0.56));
  }

  private get first() {
    return this.rateBase === "first";
  }

  protected override buildModel(f: ChartFrame): ChartModel<Stage<T>, T> {
    const { width: W, height: H } = f;
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    const rows = this.data.map((d, i) => ({ d, label: gl(d, i), value: Math.max(0, gv(d, i) || 0) }));
    const first = this.first;
    const rates = rows.map((r, i) => (i === 0 ? null : first ? (rows[0].value ? (r.value / rows[0].value) * 100 : 0) : rows[i - 1].value ? (r.value / rows[i - 1].value) * 100 : 0));
    // By default the step with the lowest rate: where most are lost
    let hi: Set<number>;
    if (this.highlight !== undefined) hi = resolveHighlight(this.highlight, rows.map((r) => r.d), rows.map((r) => r.label), rows.map((r) => r.value));
    else {
      let best = -1;
      let bv = Infinity;
      rates.forEach((r, i) => {
        if (r !== null && r < bv) {
          bv = r;
          best = i;
        }
      });
      hi = new Set(best >= 0 ? [best] : []);
    }

    const showRates = !this.hideRates;
    const rateTitle = this.rateLabel ?? (first ? "vs. first" : "vs. previous");
    const labelW = Math.min(120, Math.max(54, ...rows.map((r) => Math.max(textWidth(r.label, AXIS_FONT, 700), textWidth(f.fv(r.value), AXIS_FONT))))) + 8;
    const rateW = showRates ? Math.max(44, textWidth(rateTitle, AXIS_FONT) * 0.6) : 0;
    const top = showRates ? 18 : 4;
    const plotX = labelW + 6;
    const plotW = Math.max(40, W - plotX - rateW - 10);
    const cxm = plotX + plotW / 2;
    const band = (H - top - 4) / Math.max(1, rows.length);
    const barH = Math.max(8, Math.min(34, band * 0.52));
    // Widths are scaled to the largest step, so a later step above the first (or a first of 0) stays inside
    const widest = Math.max(0, ...rows.map((r) => r.value)) || 1;
    this.geo = { labelW, top, band, barH, cxm, showRates, rateTitle };

    this.stages = rows.map((r, i) => ({ i, label: r.label, value: r.value, rate: rates[i], w: Math.max(10, (r.value / widest) * plotW), hi: hi.has(i), ink: emphasisInk(hi.has(i)), datum: r.d }));
    const marks = this.stages.map((s, i) => ({ key: `f:${s.label}`, to: [s.w, 1], from: [s.w * 0.15, 0], enter: [0, 0], delay: i * this.stagger, data: s }));
    const rateText = (s: Stage<T>) => `${f.pct(s.rate ?? 0)} of ${first ? "first" : "previous"} step`;
    const events = this.stages.map((s) => ({
      datum: s.datum,
      index: s.i,
      key: s.label,
      label: s.label,
      value: s.value,
      formatted: `${f.fv(s.value)}${s.rate !== null ? ` · ${rateText(s)}` : ""}`,
    }));
    const n = this.stages.length;
    const summary = `${n} ${n === 1 ? "step" : "steps"}: ${this.stages.map((s) => `${s.label} ${f.fv(s.value)}${s.rate !== null ? ` (${f.pct(s.rate)})` : ""}`).join(", ")}`;
    return { marks, events, summary };
  }

  private yMid(i: number) {
    const { top, band } = this.geo;
    return top + band * i + band / 2;
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const s = this.stages[i];
    if (!s) return null;
    return {
      x: this.geo.cxm,
      y: this.yMid(i) - this.geo.barH / 2,
      title: s.label,
      rows: [
        { label: "Count", value: f.fv(s.value), color: s.ink },
        ...(s.rate !== null ? [{ label: this.first ? "vs. first step" : "vs. previous step", value: f.pct(s.rate) }] : []),
        ...(i > 0 ? [{ label: "Drop-off", value: f.fv(this.stages[i - 1].value - s.value) }] : []),
      ],
    };
  }

  protected override draw(f: ChartFrame) {
    const { width: W } = f;
    const { labelW, top, band, barH, cxm, showRates, rateTitle } = this.geo;
    const m = this.motion;
    // By step index: the motion renames repeated labels (f:Step#2), so a label lookup would find the first one
    const cur = new Map(m.items.filter((it) => !it.exiting).map((it) => [it.data.i, it]));
    return svg`
      ${showRates ? txt(W - 2, 8, rateTitle, { anchor: "end", opacity: m.fade(0, 300) }) : nothing}
      ${this.stages.map((s, i) => {
        const it = cur.get(i);
        if (!it) return nothing;
        const [w, o] = it.v;
        const y = this.yMid(i);
        const next = this.stages[i + 1] ? cur.get(i + 1) : undefined;
        const nw = next ? next.v[0] : 0;
        const no = next ? next.v[1] : 0;
        const yb = y + barH / 2;
        const yt = y + band - barH / 2;
        const ym = r2((yb + yt) / 2);
        const neck =
          next && no > 0.01
            ? `M${r2(cxm - w / 2)},${r2(yb - 1)}C${r2(cxm - w / 2)},${ym} ${r2(cxm - nw / 2)},${ym} ${r2(cxm - nw / 2)},${r2(yt + 1)}L${r2(cxm + nw / 2)},${r2(yt + 1)}C${r2(cxm + nw / 2)},${ym} ${r2(cxm + w / 2)},${ym} ${r2(cxm + w / 2)},${r2(yb - 1)}Z`
            : "";
        const lo = m.fade(i * this.stagger + 120, 260);
        const h = this.hover(i);
        return svg`<g class="tc-chart__mark" opacity=${this.dim(i)} @pointerenter=${h.enter} @click=${h.click}>
          <rect class="tc-chart__hit" x=${0} y=${y - band / 2} width=${W} height=${band}></rect>
          ${neck ? svg`<path class="ui-fnl__neck" d=${neck} opacity=${0.55 * Math.min(o, no)}></path>` : nothing}
          <path class="ui-fnl__bar" d=${roundRectPath(cxm - w / 2, y - barH / 2, w, barH, Math.min(7, barH / 3))} style=${`fill: ${s.ink}`} opacity=${o}></path>
          ${this.active === i && this.via === "keyboard" ? svg`<path class="tc-chart__focus" d=${roundRectPath(cxm - w / 2 - 3, y - barH / 2 - 3, w + 6, barH + 6, 8)}></path>` : nothing}
          ${txt(labelW, y - 6, truncate(s.label, labelW - 4, AXIS_FONT, 700), { cls: "value", anchor: "end", strong: s.hi, opacity: lo })}
          ${txt(labelW, y + 8, f.fv(s.value), { anchor: "end", opacity: lo })}
          ${showRates && s.rate !== null ? txt(W - 2, top + band * i, f.pct(s.rate), { cls: "value", anchor: "end", strong: s.hi, opacity: lo }) : nothing}
        </g>`;
      })}`;
  }

  protected override tableHeader() {
    return "Step";
  }

  static override css = /* css */ `
.ui-fnl__neck { fill: var(--tc-plot-rest); }
@media (forced-colors: active) {
  .ui-fnl__bar, .ui-fnl__neck { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-funnel-chart")) customElements.define("tc-funnel-chart", TcFunnelChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-funnel-chart": TcFunnelChart;
  }
}
