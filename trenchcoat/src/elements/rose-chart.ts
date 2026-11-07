import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, categoricalInk, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { numGetter, strGetter, uniq } from "./internal/chart/accessor";
import { makeTickFormatter } from "./internal/chart/format";
import { arcPath, polar, TAU } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { fitDomain, scaleLinear } from "./internal/chart/scale";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-rose-chart> – a polar area chart (a Nightingale rose): one wedge per item, all the same angle, each reaching out
 * as far as its value. The area grows with the value, not the radius (r ∝ √value), so a wedge twice the value covers
 * twice the area. With `series` each wedge is split into rings, one per series in its own ink, stacked out from the
 * centre, with a legend in the header. Rings at round values sit under the wedges, their numbers on chips along the
 * line where the first wedge starts. A single series emphasises its largest wedge (`highlight` picks others). Wedges
 * grow out from the centre when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move wedge to wedge, each read with its value (and each series' part)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-rose-chart heading="Applications by month" .data=${[{ label: "Jan", value: 42 }, …]}></tc-rose-chart>
 */

/** A rose: wedges of different lengths round a centre, in the Lucide style (24 × 24, 2px strokes) */
const roseIcon = svg`<path d="M12 12V3a9 9 0 0 1 7.8 4.5Z"></path><path d="M12 12l5.2 3a6 6 0 0 1-5.2 3Z"></path><path d="M12 12H7a5 5 0 0 1 1.5-3.5Z"></path>`;

/** The words a rose chart adds to the shared ones */
export type RoseLabels = {
  /** The tooltip's and table's word for a stacked wedge's sum */
  total: string;
  /** "{count} wedges" – the summary's start */
  wedges: string;
  /** "largest {label} ({value})" – the summary's end */
  largest: string;
};
export const defaultRoseLabels: RoseLabels = {
  total: "Total",
  wedges: "{count} wedges",
  largest: "largest {label} ({value})",
};

type Wedge = { k: number; label: string; parts: number[]; total: number; hi: boolean; a0: number; a1: number };
type WedgeLabel = { k: number; x: number; y: number; anchor: "start" | "middle" | "end"; text: string; strong: boolean };

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/**
 * Equal-angle wedges whose area shows each item's value – a polar area chart – stacked by series if wanted, with the
 * largest emphasised, round-value rings and a table view.
 * @tag tc-rose-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a wedge, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A wedge was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcRoseChart<T = Row> extends TcChartElement<Wedge, T> {
  static override ui = "rse";

  /** The wedge's name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The series field: each wedge is split into a ring per series, stacked out from the centre */
  @property({ attribute: false }) accessor series: Accessor<T, string> | undefined = undefined;
  /** Where the first wedge starts, in degrees clockwise from 12 o'clock */
  @property({ type: Number, attribute: "start-angle" }) accessor startAngle = 0;
  /** A hole in the middle, as a share of the radius (0–0.6) */
  @property({ type: Number, attribute: "inner-radius" }) accessor innerRadius = 0;
  /** The rose chart's own words, merged over defaultRoseLabels */
  @property({ attribute: false }) accessor roseLabels: Partial<RoseLabels> = {};

  protected override readonly kind = "Rose chart";
  protected override readonly icon = roseIcon;
  protected override defaultDuration = 900;
  protected override stagger = 45;
  protected override modelKeys = ["label", "value", "series", "startAngle", "innerRadius", "roseLabels"];

  private wedges: Wedge[] = [];
  private seriesNames: string[] = [];
  private geo = {
    cx: 0,
    cy: 0,
    R: 0,
    inner: 0,
    vmax: 1,
    rings: [] as { v: number; r: number; text: string }[],
    labels: [] as WedgeLabel[],
  };

  private get roseWords(): RoseLabels {
    return { ...defaultRoseLabels, ...this.roseLabels };
  }

  protected override defaultHeight(w: number) {
    return Math.max(220, Math.min(340, w * 0.7));
  }

  protected override tableHeader() {
    return "Wedge";
  }

  /** The radius for a value: area-true between the hole and the rim */
  private rOf(v: number) {
    const { inner, R, vmax } = this.geo;
    const t = Math.max(0, Math.min(1, v / vmax));
    return Math.sqrt(inner * inner + (R * R - inner * inner) * t);
  }

  protected override buildModel(f: ChartFrame): ChartModel<Wedge, T> {
    const { width: W, height: H } = f;
    const rw = this.roseWords;
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    const stacked = this.series !== undefined;
    const gs = stacked ? strGetter(this.series, "series") : null;
    const labels = uniq(this.data.map((d, i) => gl(d, i)));
    const series = gs ? uniq(this.data.map((d, i) => gs(d, i))) : [""];
    this.seriesNames = stacked ? series : [];
    const parts = labels.map(() => series.map(() => 0));
    const firstRow = new Map<string, T>();
    this.data.forEach((d, i) => {
      const k = labels.indexOf(gl(d, i));
      const s = gs ? series.indexOf(gs(d, i)) : 0;
      const v = gv(d, i);
      if (k >= 0 && s >= 0 && Number.isFinite(v)) parts[k][s] += Math.max(0, v);
      if (!firstRow.has(gl(d, i))) firstRow.set(gl(d, i), d);
    });
    const totals = parts.map((p) => p.reduce((a, b) => a + b, 0));
    const hi = resolveHighlight(this.highlight as never, labels.map((l) => firstRow.get(l)) as never[], labels, totals, stacked ? "none" : "max");

    // Room round the rose for the wedges' names
    const n = Math.max(1, labels.length);
    const nameW = this.hideLabels ? 0 : Math.min(W * 0.18, Math.max(0, ...labels.map((l) => textWidth(l, AXIS_FONT, 600))));
    const R = Math.max(30, Math.min(H / 2 - (this.hideLabels ? 6 : 20), W / 2 - nameW - 12));
    const inner = R * Math.max(0, Math.min(0.6, this.innerRadius || 0));
    const dom = fitDomain(0, Math.max(1e-9, ...totals), 3, { zero: true, pad: 0 });
    const vmax = dom[1] > 0 ? dom[1] : 1;
    const cx = W / 2;
    const cy = H / 2;
    const start = ((this.startAngle || 0) * Math.PI) / 180;
    const step = TAU / n;
    this.geo = { cx, cy, R, inner, vmax, rings: [], labels: [] };

    const tickFmt = makeTickFormatter(this.format, f.locale, vmax);
    const ringVals = scaleLinear([0, vmax], [0, 1])
      .ticks(3)
      .filter((v) => v > 0 && v <= vmax);
    this.geo.rings = ringVals.map((v) => ({ v, r: this.rOf(v), text: `${tickFmt(v)}${this.unit}` }));

    const wedges: Wedge[] = labels.map((label, k) => ({ k, label, parts: parts[k], total: totals[k], hi: hi.has(k), a0: start + k * step, a1: start + (k + 1) * step }));
    this.wedges = wedges;

    // Names just outside the rim, beside or above and below as the angle turns; thinned when wedges are too narrow
    const arc = R * step;
    const every = Math.max(1, Math.ceil((AXIS_FONT + 4) / Math.max(1, arc)));
    const room = Math.max(24, W / 2 - R - 14);
    this.geo.labels = this.hideLabels
      ? []
      : wedges
          .filter((w) => w.k % every === 0 || w.hi)
          .map((w) => {
            const mid = (w.a0 + w.a1) / 2;
            const s = Math.sin(mid);
            const [x, y] = polar(cx, cy, R + 9, mid);
            const anchor: WedgeLabel["anchor"] = s > 0.25 ? "start" : s < -0.25 ? "end" : "middle";
            return { k: w.k, x, y, anchor, text: truncate(w.label, room, AXIS_FONT, w.hi ? 700 : 500), strong: w.hi };
          });

    const marks = wedges.map((w) => {
      const to: number[] = [];
      let run = 0;
      for (const p of w.parts) {
        run += p;
        to.push(this.rOf(run));
      }
      const from = to.map(() => inner);
      return { key: `w:${w.label}`, to, from, enter: from, delay: w.k * this.stagger, data: w };
    });
    const events = wedges.map((w) => ({
      datum: firstRow.get(w.label) ?? null,
      index: w.k,
      key: w.label,
      label: w.label,
      value: w.total,
      formatted: stacked ? `${series.map((s, i) => `${s} ${f.fv(w.parts[i])}`).join(", ")} (${rw.total.toLowerCase()} ${f.fv(w.total)})` : f.fv(w.total),
    }));
    const best = wedges.length ? wedges.reduce((a, c) => (c.total > a.total ? c : a)) : null;
    const summary = [fill(rw.wedges, { count: wedges.length }), ...(stacked ? [series.join(", ")] : []), ...(best ? [fill(rw.largest, { label: best.label, value: f.fv(best.total) })] : [])].join("; ");
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const w = this.wedges[i];
    if (!w) return null;
    const { cx, cy } = this.geo;
    const [x, y] = polar(cx, cy, this.rOf(w.total), (w.a0 + w.a1) / 2);
    const stacked = this.seriesNames.length > 0;
    const rows = stacked
      ? [
          ...this.seriesNames.map((s, k) => ({ label: s, value: f.fv(w.parts[k]), color: categoricalInk(k) })),
          { label: this.roseWords.total, value: f.fv(w.total), strong: true },
        ]
      : [{ label: this.words.value, value: f.fv(w.total), color: emphasisInk(w.hi) }];
    return { x, y, title: w.label, rows };
  }

  protected override headerLegend() {
    if (!this.seriesNames.length) return nothing;
    return html`<ul class="tc-chart__legend" aria-label="Series">
      ${this.seriesNames.map((s, k) => html`<li class="tc-chart__key"><span class="tc-chart__swatch" aria-hidden="true" style=${`background: ${categoricalInk(k)}`}></span>${s}</li>`)}
    </ul>`;
  }

  protected override draw(_f: ChartFrame) {
    const { cx, cy, R, inner, rings, labels } = this.geo;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const stacked = this.seriesNames.length > 0;
    const fade = m.fade(D * 0.5, 300);
    const start = this.wedges[0]?.a0 ?? 0;
    const wedges = m.items.map((it) => {
      if (it.exiting) return nothing;
      const w = it.data;
      const radii = it.v;
      const focus = this.active === w.k && this.via === "keyboard";
      const h = this.hover(w.k);
      const outer = radii[radii.length - 1] ?? inner;
      return svg`<g class="tc-chart__mark" opacity=${this.dim(w.k)} @pointerenter=${h.enter} @click=${h.click}>
        <path class="tc-chart__hit" d=${arcPath(cx, cy, inner, R, w.a0, w.a1)}></path>
        ${radii.map((r, s) => {
          const r0 = s === 0 ? inner : radii[s - 1];
          if (r - r0 < 0.3) return nothing;
          const ink = stacked ? categoricalInk(s) : emphasisInk(w.hi);
          return svg`<path class="ui-rse__wedge" ?data-hi=${w.hi && !stacked} d=${arcPath(cx, cy, r0, r, w.a0, w.a1)} style=${`fill: ${ink}`}></path>`;
        })}
        ${focus ? svg`<path class="tc-chart__focus" d=${arcPath(cx, cy, Math.max(0, inner - 2), outer + 3, w.a0 - 0.02, w.a1 + 0.02)}></path>` : nothing}
      </g>`;
    });
    return svg`
      <g class="ui-rse__grid">${rings.map((g) => svg`<circle class="tc-chart__grid" cx=${cx} cy=${cy} r=${g.r}></circle>`)}
        ${inner > 0 ? svg`<circle class="tc-chart__grid" cx=${cx} cy=${cy} r=${inner}></circle>` : nothing}</g>
      ${wedges}
      <g class="ui-rse__ticks" pointer-events="none" opacity=${fade}>${rings.map((g) => {
        // On a chip of the card's colour where the first wedge starts, so a wedge under it never shows through
        const [x, y] = polar(cx, cy, g.r, start);
        const w = textWidth(g.text, AXIS_FONT) + 8;
        return svg`<rect class="ui-rse__chip" x=${x - w / 2} y=${y - 8} width=${w} height="16" rx="5"></rect>${txt(x, y, g.text, { anchor: "middle" })}`;
      })}</g>
      <g pointer-events="none">${labels.map((l) => txt(l.x, l.y, l.text, { anchor: l.anchor, cls: "value", strong: l.strong, opacity: fade }))}</g>`;
  }

  static override css = /* css */ `
/* Wedges parted by a line of the card's colour; the round-value rings under them */
.ui-rse__wedge { stroke: var(--tc-plot-bg); stroke-width: 1; stroke-linejoin: round; }
.ui-rse__grid circle { fill: none; }
.ui-rse__chip { fill: var(--tc-plot-bg); opacity: 0.94; }
@media (forced-colors: active) {
  .ui-rse__wedge { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-rose-chart")) customElements.define("tc-rose-chart", TcRoseChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-rose-chart": TcRoseChart;
  }
}
