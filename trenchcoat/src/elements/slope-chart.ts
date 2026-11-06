import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { txt } from "./internal/chart/axis";
import { numGetter, strGetter, uniq } from "./internal/chart/accessor";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { resolveHighlight } from "./internal/chart/highlight";
import { extent, fitDomain, scaleLinear } from "./internal/chart/scale";
import { dodgeVertical, textWidth, truncateBeside } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-slope-chart> – how each item changed between two moments: a line from its first value on the left to its last
 * on the right, so rises, falls and crossings read at a glance. Ported from ztd-charts' SlopeChart (MIT, © 2026
 * Junhan2). Takes a long table (one row per item and period – the first and last periods are used) or a wide one
 * (`start` and `end` fields). The item that rose most takes the accent and the rest stay quiet (`highlight` picks
 * others). Each side writes the item's name and value, nudged apart so none overlap. Lines draw themselves from left
 * to right when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move item to item, each read with both values
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-slope-chart heading="Grant success" start="2024" end="2025" .data=${[{ label: "Genomics", 2024: 31, 2025: 38 }]}></tc-slope-chart>
 */

/** Two posts and the lines between – drawn in the Lucide style (ISC, lucide.dev) */
const slopeIcon = svg`<path d="M4 3v18"></path><path d="M20 3v18"></path><path d="m4 16 16-9"></path><path d="m4 9 16 6"></path>`;

type SlopeItem = { i: number; key: string; label: string; a: number; b: number; hi: boolean; datum: unknown };

/**
 * How each item changed between two moments, as lines from the first value to the last, the biggest rise
 * emphasised, names and values on both sides and a table view.
 * @tag tc-slope-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a line, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A line was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcSlopeChart<T = Row> extends TcChartElement<SlopeItem, T> {
  static override ui = "slc";

  /** The item's name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** A long table's period field – the first and last periods are drawn; by default "x" */
  @property({ attribute: false }) accessor x: Accessor<T, string> | undefined = undefined;
  /** A long table's value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** A wide table's first value field – with `end`, used instead of `x` and `value` */
  @property() accessor start: string | undefined = undefined;
  /** A wide table's last value field */
  @property() accessor end: string | undefined = undefined;
  /** The left side's heading; by default the first period or the `start` field */
  @property({ attribute: "start-label" }) accessor startLabel: string | undefined = undefined;
  /** The right side's heading; by default the last period or the `end` field */
  @property({ attribute: "end-label" }) accessor endLabel: string | undefined = undefined;
  /** The name of the change in the tooltip */
  @property({ attribute: "change-label" }) accessor changeLabel = "Change";

  protected override readonly kind = "Slope chart";
  protected override readonly icon = slopeIcon;
  protected override defaultDuration = 900;
  protected override stagger = 90;
  protected override modelKeys = ["label", "x", "value", "start", "end", "startLabel", "endLabel", "changeLabel"];

  private items: SlopeItem[] = [];
  private periods: [string, string] = ["", ""];
  private geo = {
    xa: 0,
    xb: 0,
    lw: 0,
    rw: 0,
    top: 0,
    bottom: 0,
    ysL: [] as number[],
    ysR: [] as number[],
    y: scaleLinear([0, 1], [0, 1]),
  };

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(300, w * 0.6));
  }

  protected override tableHeader() {
    return "Item";
  }

  private parse(): { items: SlopeItem[]; periods: [string, string] } {
    const gl = strGetter(this.label, "label");
    let items: SlopeItem[];
    let periods: [string, string];
    if (this.start && this.end) {
      const ga = numGetter<T>(this.start, this.start);
      const gb = numGetter<T>(this.end, this.end);
      items = this.data.map((d, i) => ({ i, key: "", label: gl(d, i), a: ga(d, i), b: gb(d, i), hi: false, datum: d }));
      periods = [this.start, this.end];
    } else {
      const gx = strGetter(this.x, "x");
      const gv = numGetter(this.value, "value");
      const xs = uniq(this.data.map((d, i) => gx(d, i)));
      const first = xs[0];
      const last = xs[xs.length - 1];
      periods = [first ?? "", last ?? ""];
      const map = new Map<string, SlopeItem>();
      this.data.forEach((d, i) => {
        const l = gl(d, i);
        const xv = gx(d, i);
        let it = map.get(l);
        if (!it) {
          it = { i: map.size, key: "", label: l, a: NaN, b: NaN, hi: false, datum: d };
          map.set(l, it);
        }
        if (xv === first) it.a = gv(d, i);
        if (xv === last) it.b = gv(d, i);
      });
      items = [...map.values()];
    }
    return { items, periods: [this.startLabel ?? periods[0], this.endLabel ?? periods[1]] };
  }

  protected override buildModel(f: ChartFrame): ChartModel<SlopeItem, T> {
    const { width: W, height: H } = f;
    const parsed = this.parse();
    const seen = new Map<string, number>();
    const items = parsed.items
      .filter((it) => Number.isFinite(it.a) && Number.isFinite(it.b))
      .map((it, k) => {
        const n = (seen.get(it.label) ?? 0) + 1;
        seen.set(it.label, n);
        return { ...it, i: k, key: n > 1 ? `s:${it.label}#${n}` : `s:${it.label}` };
      });
    const hi = resolveHighlight(this.highlight, items.map((it) => it.datum as T), items.map((it) => it.label), items.map((it) => it.b - it.a), "max");
    items.forEach((it) => (it.hi = hi.has(it.i)));
    this.items = items;
    this.periods = parsed.periods;

    const [mn, mx] = extent(items.flatMap((it) => [it.a, it.b]));
    const dom = fitDomain(mn, mx, 4, { zero: false, pad: 0.04 });
    const side = (s: (it: SlopeItem) => string) => (this.hideLabels ? 16 : Math.min(W * 0.34, Math.max(...items.map((it) => textWidth(s(it), AXIS_FONT, 700)), 30) + 16));
    const lw = side((it) => `${it.label} ${f.fv(it.a)}`);
    const rw = side((it) => `${f.fv(it.b)} ${it.label}`);
    const xa = lw;
    const xb = W - rw;
    const top = 26;
    const bottom = 10;
    const y = scaleLinear(dom, [H - bottom, top]);
    const ysL = dodgeVertical(items.map((it) => y(it.a)), 15, top, H - bottom);
    const ysR = dodgeVertical(items.map((it) => y(it.b)), 15, top, H - bottom);
    this.geo = { xa, xb, lw, rw, top, bottom, ysL, ysR, y };

    // The emphasised lines last, so they're drawn on top. [how much of the line is drawn, left y, right y]
    const order = [...items].sort((a, b) => Number(a.hi) - Number(b.hi));
    const marks = order.map((it, k) => ({ key: it.key, to: [1, y(it.a), y(it.b)], from: [0, y(it.a), y(it.b)], enter: [0, y(it.a), y(it.b)], delay: k * this.stagger, data: it }));
    const [p0, p1] = this.periods;
    const events = items.map((it) => ({ datum: it.datum as T, index: it.i, key: it.key, label: it.label, value: it.b, formatted: `${p0} ${f.fv(it.a)} → ${p1} ${f.fv(it.b)}` }));
    const summary = `${p0} to ${p1}: ${items.map((it) => `${it.label} ${f.fv(it.a)} to ${f.fv(it.b)}`).join(", ")}`;
    return { marks, events, summary };
  }

  protected override tip(i: number, f: ChartFrame): TooltipData | null {
    const it = this.items[i];
    if (!it) return null;
    const { xa, xb, y } = this.geo;
    const d = it.b - it.a;
    return {
      x: (xa + xb) / 2,
      y: (y(it.a) + y(it.b)) / 2,
      title: it.label,
      rows: [
        { label: this.periods[0], value: f.fv(it.a), strong: false },
        { label: this.periods[1], value: f.fv(it.b), color: emphasisInk(it.hi) },
        { label: this.changeLabel, value: `${d >= 0 ? "+" : "−"}${f.fmt(Math.abs(d))}${this.unit}`, strong: false },
      ],
    };
  }

  protected override draw(f: ChartFrame) {
    const { height: H } = f;
    const { xa, xb, lw, rw, top, bottom, ysL, ysR } = this.geo;
    const m = this.motion;
    const D = this.duration ?? this.defaultDuration;
    return svg`
      <g>
        <line class="tc-chart__grid" x1=${xa} x2=${xa} y1=${top - 4} y2=${H - bottom}></line>
        <line class="tc-chart__grid" x1=${xb} x2=${xb} y1=${top - 4} y2=${H - bottom}></line>
        <text class="tc-chart__tick ui-slc__period" x=${xa} y="9" dy="0.35em" text-anchor="middle">${this.periods[0]}</text>
        <text class="tc-chart__tick ui-slc__period" x=${xb} y="9" dy="0.35em" text-anchor="middle">${this.periods[1]}</text>
      </g>
      ${m.items.map((it) => {
        const s = it.data;
        const [drawn, ya, yb] = it.v;
        const active = this.active === s.i;
        const ink = active && !s.hi ? "var(--tc-plot-line-rest)" : emphasisInk(s.hi);
        const dash = drawn < 0.999;
        const focus = active && this.via === "keyboard" && !it.exiting;
        const h = this.hover(s.i);
        return svg`<g class="tc-chart__mark" opacity=${it.exiting ? 0.4 : this.dim(s.i)} @pointerenter=${h.enter} @click=${h.click}>
          <line class="ui-slc__hit" x1=${xa} y1=${ya} x2=${xb} y2=${yb}></line>
          <line class="ui-slc__line" ?data-hi=${s.hi} x1=${xa} y1=${ya} x2=${xb} y2=${yb} style=${`stroke: ${ink}`}
            pathLength=${dash ? 1 : nothing} stroke-dasharray=${dash ? "1 1" : nothing} stroke-dashoffset=${dash ? 1 - drawn : nothing}></line>
          <circle class="ui-slc__dot" cx=${xa} cy=${ya} r=${s.hi ? 4 : 3} style=${`fill: ${ink}`}></circle>
          <circle class="ui-slc__dot" cx=${xb} cy=${yb} r=${s.hi ? 4 : 3} style=${`fill: ${ink}`} opacity=${drawn >= 0.98 ? 1 : 0}></circle>
          ${focus ? svg`<circle class="tc-chart__focus" cx=${xa} cy=${ya} r="7"></circle><circle class="tc-chart__focus" cx=${xb} cy=${yb} r="7"></circle>` : nothing}
        </g>`;
      })}
      ${this.hideLabels
        ? nothing
        : this.items.map((it, k) => {
            const strong = it.hi || this.active === it.i;
            const o = m.fade(D * 0.5, 300) * this.dim(it.i);
            const va = f.fv(it.a);
            const vb = f.fv(it.b);
            // Only the name is shortened; the value stays whole
            const name = (v: string, room: number) => truncateBeside(it.label, v, room, AXIS_FONT, 700);
            return svg`<g>
              ${txt(xa - 9, ysL[k], [name(va, lw - 10), va].filter(Boolean).join(" "), { anchor: "end", strong, opacity: o })}
              ${txt(xb + 9, ysR[k], [vb, name(vb, rw - 10)].filter(Boolean).join(" "), { anchor: "start", strong, opacity: o })}
            </g>`;
          })}`;
  }

  static override css = /* css */ `
[data-ui="slc"] { --tc-slc-line: 1.6; --tc-slc-line-hi: 2.8; --tc-slc-hit: 12; }
.ui-slc__line { stroke-width: var(--tc-slc-line); stroke-linecap: round; fill: none; }
.ui-slc__line[data-hi] { stroke-width: var(--tc-slc-line-hi); }
/* A wider invisible line under each, so a thin one is easy to point at */
.ui-slc__hit { stroke: transparent; stroke-width: var(--tc-slc-hit); }
.ui-slc__period { font-weight: var(--tc-font-weight-strong); }
@media (forced-colors: active) {
  .ui-slc__line, .ui-slc__dot { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-slope-chart")) customElements.define("tc-slope-chart", TcSlopeChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-slope-chart": TcSlopeChart;
  }
}
