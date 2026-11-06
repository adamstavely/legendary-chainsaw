import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { arcLine, polar, TAU } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-radial-bar-chart> – a few ratios as rings round a centre: how far each item has got towards a target, its ring
 * filled that far round a track. Ported from ztd-charts' RadialBarChart (MIT, © 2026 Junhan2). The largest takes the
 * accent and the rest stay quiet (`highlight` picks others). On an open sweep (270° by default) each ring is named
 * with its value in the empty corner where the rings start; a full circle writes the emphasised value in the middle.
 * Rings sweep round one after another when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move ring to ring, each read with its value
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-radial-bar-chart heading="Grant milestones" .data=${[{ label: "Genomics", value: 82 }, …]}></tc-radial-bar-chart>
 */

/** A radial bar chart: three open rings, drawn in the Lucide style */
const radialIcon = svg`<path d="M12 3a9 9 0 1 1-9 9"></path><path d="M12 7a5 5 0 1 1-5 5"></path><path d="M12 11a1 1 0 1 1-1 1"></path>`;

type Ring = { i: number; label: string; value: number; frac: number; hi: boolean };

/**
 * A few ratios as rings round a centre – progress towards a target – the largest emphasised, each named with its
 * value beside where it starts, and a table view.
 * @tag tc-radial-bar-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a ring, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A ring was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcRadialBarChart<T = Row> extends TcChartElement<Ring, T> {
  static override ui = "rbr";

  /** The label field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** The value of a full ring – the target; by default 100 */
  @property({ type: Number }) accessor max = 100;
  /** How far round a ring goes, in degrees (30–360); by default 270 */
  @property({ type: Number }) accessor sweep = 270;

  protected override readonly kind = "Radial bar chart";
  protected override readonly icon = radialIcon;
  protected override defaultDuration = 1000;
  protected override stagger = 120;
  protected override defaultFormat = "percent" as const;
  protected override modelKeys = ["label", "value", "max", "sweep"];

  private rings: Ring[] = [];
  private g = { cx: 0, cy: 0, R: 0, inner: 0, step: 0, thick: 0, span: 0, deg: 270 };

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(270, w * 0.6));
  }

  private radius(k: number) {
    return this.g.R - this.g.step * k - this.g.step / 2;
  }

  protected override buildModel(f: ChartFrame): ChartModel<Ring, T> {
    const { width: W, height: H } = f;
    const max = this.max > 0 ? this.max : 100;
    const deg = Math.max(30, Math.min(360, this.sweep || 270));
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    const rows = this.data.map((d, i) => ({ d, i, label: gl(d, i), value: gv(d, i) || 0 }));
    const hi = resolveHighlight(this.highlight, rows.map((r) => r.d), rows.map((r) => r.label), rows.map((r) => r.value), "max");
    this.rings = rows.map((r) => ({ i: r.i, label: r.label, value: r.value, frac: Math.max(0, Math.min(1, r.value / max)), hi: hi.has(r.i) }));

    const n = Math.max(1, this.rings.length);
    const R = Math.max(30, Math.min(H / 2 - 6, W / 2 - 8));
    // An open sweep leaves the top-left corner empty for the names: the rings move right to make room
    const cx = W / 2 + (deg < 360 ? R * 0.18 : 0);
    const inner = R * 0.26;
    const step = (R - inner) / n;
    this.g = { cx, cy: H / 2, R, inner, step, thick: Math.max(4, Math.min(18, step * 0.64)), span: (deg / 360) * TAU, deg };

    const marks = this.rings.map((r, k) => ({ key: `r:${r.label}`, to: [r.frac], from: [0], enter: [0], delay: k * this.stagger, data: r }));
    const events = this.rings.map((r) => ({ datum: this.data[r.i] ?? null, index: r.i, key: r.label, label: r.label, value: r.value, formatted: f.fv(r.value) }));
    const summary = this.rings.map((r) => `${r.label} ${f.fv(r.value)}`).join(", ");
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const r = this.rings[i];
    if (!r) return null;
    const { cx, cy, span } = this.g;
    const [x, y] = polar(cx, cy, this.radius(i), span * r.frac);
    const max = this.max > 0 ? this.max : 100;
    return {
      x,
      y,
      title: r.label,
      rows: [
        { label: this.words.value, value: f.fv(r.value), color: emphasisInk(r.hi) },
        { label: "Of target", value: f.pct((r.value / max) * 100) },
      ],
    };
  }

  protected override tableHeader() {
    return "Item";
  }

  protected override draw(f: ChartFrame) {
    const { cx, cy, inner, step, thick, span, deg } = this.g;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    const rings = m.items.map((it) => {
      // A ring's place comes from the data order; a leaving ring would push the inner ones out until it left
      if (it.exiting) return nothing;
      const r = it.data;
      const rad = this.radius(r.i);
      const t = it.v[0];
      const focus = this.active === r.i && this.via === "keyboard";
      const h = this.hover(r.i);
      return svg`<g class="tc-chart__mark" opacity=${this.dim(r.i)} @pointerenter=${h.enter} @click=${h.click}>
        <path class="ui-rbr__track" d=${arcLine(cx, cy, rad, 0, span)} stroke-width=${thick}></path>
        ${t > 0.002 ? svg`<path class="ui-rbr__bar" d=${arcLine(cx, cy, rad, 0, span * t)} stroke-width=${thick} style=${`stroke: ${emphasisInk(r.hi)}`}></path>` : nothing}
        ${focus ? svg`<path class="ui-rbr__focus" d=${arcLine(cx, cy, rad + thick / 2 + 2, 0, span)}></path>` : nothing}
      </g>`;
    });
    let words: unknown = nothing;
    if (!this.hideLabels && this.rings.length) {
      if (deg < 360) {
        // Each ring named with its value just left of where it starts, when the rings are far enough apart
        if (step >= AXIS_FONT) {
          const labelMax = Math.max(40, cx - 12);
          words = this.rings.map((r, k) => {
            const [lx, ly] = polar(cx, cy, this.radius(k), 0);
            const text = truncate(`${r.label} ${f.fv(r.value)}`, labelMax, AXIS_FONT, r.hi ? 700 : 500);
            return txt(lx - 8, ly, text, { anchor: "end", cls: "value", strong: r.hi, opacity: m.fade(k * this.stagger + D * 0.3, 280) });
          });
        }
      } else if (inner >= 18) {
        const r = this.rings.find((q) => q.hi) ?? this.rings[0];
        words = svg`<g class="ui-rbr__centre">${txt(cx, cy, f.fv(r.value), { anchor: "middle", cls: "value", strong: true, opacity: m.fade(D * 0.4, 300) })}</g>`;
      }
    }
    return svg`${rings}${words}`;
  }

  static override css = /* css */ `
[data-ui="rbr"] { --tc-rbr-track: var(--tc-plot-grid); }
.ui-rbr__track { fill: none; stroke: var(--tc-rbr-track); stroke-linecap: round; }
.ui-rbr__bar { fill: none; stroke-linecap: round; }
.ui-rbr__focus { fill: none; stroke: var(--tc-plot-focus); stroke-width: 1.5; stroke-dasharray: 2 3; }
.ui-rbr__centre .tc-chart__value { font-size: var(--tc-font-size-xl); }
@media (forced-colors: active) {
  .ui-rbr__bar { forced-color-adjust: none; }
  .ui-rbr__track { stroke: GrayText; }
  .ui-rbr__focus { stroke: Highlight; }
}
`;
}

if (!customElements.get("tc-radial-bar-chart")) customElements.define("tc-radial-bar-chart", TcRadialBarChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-radial-bar-chart": TcRadialBarChart;
  }
}
