import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { axisXBand, txt } from "./internal/chart/axis";
import { AXIS_FONT, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { evenIndex, monotonePath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { prepSeries, type SeriesModel } from "./internal/chart/series";
import { ranks } from "./internal/chart/stats";
import { textWidth, truncate, truncateBeside } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-bump-chart> – how a set of items' ranks change from one step to the next: one line per item, first place at the
 * top. Ported from ztd-charts' Bump chart (MIT, © 2026 Junhan2). Ranks come from a `rank` field (1 is first), or are
 * worked out from a `value` field (the largest first). The item that climbed furthest takes the accent and the rest
 * stay quiet (`highlight` picks others); names sit at the left by their first rank and at the right with their last.
 * The lines draw in from the left when the chart comes on screen and glide to new ranks when the data changes.
 *   · one tab stop: arrows move step to step, each read with its ranking
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-bump-chart heading="Grant ranking" .data=${[{ x: "2024", series: "Genomics", rank: 2 }, …]}></tc-bump-chart>
 */

/** A bump chart: Lucide's chart-spline (ISC, lucide.dev) */
const bumpIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7"></path>`;

type BumpLine = { s: number; name: string; ranks: number[]; hi: boolean };

const rankText = (r: number | string) => `#${r}`;
const lastOf = (xs: number[]) => [...xs].reverse().find(Number.isFinite);

/**
 * Ranks changing over steps – one line per item, first place at the top – with the biggest climber emphasised, names
 * at both ends and a table view.
 * @tag tc-bump-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a step, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A step was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcBumpChart<T = Row> extends TcChartElement<BumpLine, T> {
  static override ui = "bmp";

  /** The step field – a period, a round, a date; by default "x" */
  @property({ attribute: false }) accessor x: Accessor<T, unknown> | undefined = undefined;
  /** The item field, one line per item; by default "series" */
  @property({ attribute: false }) accessor series: Accessor<T, string> | undefined = undefined;
  /** The rank field (1 is first); by default "rank" unless `value` is given */
  @property({ attribute: false }) accessor rank: Accessor<T, number> | undefined = undefined;
  /** A value field to rank by instead, the largest first */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;

  protected override readonly kind = "Bump chart";
  protected override readonly icon = bumpIcon;
  protected override defaultDuration = 1100;
  protected override stagger = 90;
  protected override modelKeys = ["x", "series", "rank", "value"];

  private sm: SeriesModel<T> = {
    type: "band",
    keys: [],
    xnum: [],
    labels: [],
    series: [],
    values: [],
    rows: [],
  };
  private lines: BumpLine[] = [];
  private g = { top: 12, bottom: 24, x0: 0, x1: 0, lw: 0, rw: 0, rowH: 0 };

  protected override defaultHeight(w: number) {
    return Math.max(200, Math.min(300, w * 0.55));
  }

  protected override tableHeader() {
    return "Step";
  }

  private xs(k: number) {
    const { x0, x1 } = this.g;
    const n = this.sm.keys.length;
    return n > 1 ? x0 + (k * (x1 - x0)) / (n - 1) : (x0 + x1) / 2;
  }
  private yr(r: number) {
    return this.g.top + (r - 1) * this.g.rowH;
  }
  /** The lines with a rank at step k, first place first */
  private standing(k: number) {
    return this.lines.filter((l) => Number.isFinite(l.ranks[k])).sort((a, b) => a.ranks[k] - b.ranks[k]);
  }
  private ink(l: BumpLine) {
    return l.hi ? emphasisInk(true) : "var(--tc-plot-line-rest)";
  }

  protected override buildModel(f: ChartFrame): ChartModel<BumpLine, T> {
    const { width: W, height: H } = f;
    const byRank = this.rank !== undefined || this.value === undefined;
    const model = prepSeries(this.data, this.x, (byRank ? (this.rank ?? "rank") : this.value) as never, this.series ?? "series", { xType: "band", locale: f.locale, sum: false });
    this.sm = model;
    const nK = model.keys.length;
    const nS = model.series.length;
    const rk: number[][] = model.series.map(() => new Array<number>(nK).fill(NaN));
    for (let k = 0; k < nK; k++) {
      if (byRank) model.series.forEach((_, s) => (rk[s][k] = model.values[s][k]));
      else {
        const col = model.series.map((_, s) => (Number.isFinite(model.values[s][k]) ? model.values[s][k] : -Infinity));
        const r = ranks(col, true);
        model.series.forEach((_, s) => (rk[s][k] = Number.isFinite(model.values[s][k]) ? r[s] : NaN));
      }
    }
    // The biggest climb from the first rank to the last is emphasised by default
    const improve = rk.map((r) => (r.find(Number.isFinite) ?? 0) - (lastOf(r) ?? 0));
    const hi = resolveHighlight(this.highlight as never, model.series as never[], model.series, improve, "max");
    this.lines = model.series.map((name, s) => ({
      s,
      name,
      ranks: rk[s],
      hi: hi.has(s),
    }));

    const maxRank = Math.max(nS, ...this.lines.flatMap((l) => l.ranks.filter(Number.isFinite)));
    const showLabels = !this.hideLabels;
    const lw = showLabels ? Math.min(W * 0.24, Math.max(...this.lines.map((l) => textWidth(l.name, AXIS_FONT, 700)), 20) + 16) : 12;
    const rw = showLabels ? Math.min(W * 0.26, Math.max(...this.lines.map((l) => textWidth(`${rankText(lastOf(l.ranks) ?? "")} ${l.name}`, AXIS_FONT, 700)), 20) + 16) : 12;
    const top = 12;
    const bottom = 24;
    this.g = {
      top,
      bottom,
      x0: lw,
      x1: W - rw,
      lw,
      rw,
      rowH: (H - top - bottom) / Math.max(1, maxRank - 1 || 1),
    };

    // The emphasised lines last, so they're drawn on top
    const order = [...this.lines].sort((a, b) => Number(a.hi) - Number(b.hi));
    const ys = (l: BumpLine) => l.ranks.map((r) => (Number.isFinite(r) ? this.yr(r) : NaN));
    const marks = order.map((l, k) => ({
      key: `b:${l.name}`,
      to: [1, ...ys(l)],
      from: [0, ...ys(l)],
      enter: [0, ...ys(l)],
      delay: k * this.stagger * 0.6,
      parts: [1, l.ranks.length],
      data: l,
    }));
    const events = model.keys.map((key, k) => ({
      datum: null,
      index: k,
      key,
      label: model.labels[k],
      value: null,
      formatted: this.standing(k)
        .map((l) => `${rankText(l.ranks[k])} ${l.name}`)
        .join(", "),
    }));
    const summary = `Rank changes of ${nS} ${nS === 1 ? "item" : "items"}, from ${model.labels[0] ?? ""} to ${model.labels[nK - 1] ?? ""}`;
    return { marks, events, summary };
  }

  protected override plotMove(x: number, _y: number, e: PointerEvent) {
    const n = this.sm.keys.length;
    // Steps are evenly spaced, so the nearest is worked out rather than searched for
    if (n) this.setActive(evenIndex(x, this.g.x0, this.g.x1, n), e.pointerType === "touch" ? "touch" : "pointer");
  }

  protected override tip(k: number): TooltipData | null {
    if (this.sm.keys[k] === undefined) return null;
    const rows = this.standing(k)
      .slice(0, 8)
      .map((l) => ({
        label: l.name,
        value: rankText(l.ranks[k]),
        color: this.ink(l),
        strong: l.hi,
      }));
    return { x: this.xs(k), y: this.g.top, title: this.sm.labels[k], rows };
  }

  protected override draw(f: ChartFrame) {
    const { height: H } = f;
    const { top, bottom, x0, x1, lw, rw } = this.g;
    const nK = this.sm.keys.length;
    const m = this.motion;
    const k = this.active;
    const fade = m.fade((this.duration ?? this.defaultDuration) * 0.55, 300);
    return svg`
      <rect class="tc-chart__hit" x=${x0} y="0" width=${Math.max(0, x1 - x0)} height=${Math.max(0, H - bottom)} @click=${() => k !== null && this.clickMark(k)}></rect>
      ${
        k !== null && k < nK
          ? svg`<line class="ui-bmp__cursor" x1=${this.xs(k)} x2=${this.xs(k)} y1=${top - 8} y2=${H - bottom + 2} stroke-width=${Math.max(8, ((x1 - x0) / Math.max(1, nK - 1)) * 0.6)}></line>`
          : null
      }
      ${[...m.items]
        // The emphasised lines on top, whichever they became since the marks were first seen
        .sort((a, b) => Number(a.data.hi) - Number(b.data.hi))
        .map((it) => {
          const l = it.data;
          const drawn = it.v[0];
          const pts = it.v
            .slice(1)
            .map((yy, j) => [this.xs(j), yy] as [number, number])
            .filter((q) => Number.isFinite(q[1]));
          const dash = drawn < 0.999;
          return svg`<g class="ui-bmp__item" opacity=${it.exiting ? 0.4 : 1} style=${`--tc-bmp-ink: ${this.ink(l)}`} ?data-hi=${l.hi}>
          <path class="ui-bmp__line" ?data-hi=${l.hi} d=${monotonePath(pts)}
            pathLength=${dash ? 1 : nothing} stroke-dasharray=${dash ? "1 1" : nothing} stroke-dashoffset=${dash ? 1 - drawn : nothing}></path>
          ${pts.map(([xx, yy], j) => {
            const at = pts.length > 1 ? j / (pts.length - 1) : 1;
            const o = Math.min(1, Math.max(0, (drawn - at) * 8 + (drawn >= 0.999 ? 1 : 0)));
            return svg`<circle class="ui-bmp__dot" ?data-hi=${l.hi} cx=${xx} cy=${yy} r=${l.hi ? 4.6 : 3.4} opacity=${o}></circle>`;
          })}
        </g>`;
        })}
      ${
        this.hideLabels
          ? null
          : this.lines.map((l) => {
              const r0 = l.ranks.find(Number.isFinite);
              const r1 = lastOf(l.ranks);
              const weight = l.hi ? 700 : 500;
              return svg`<g>
              ${r0 !== undefined ? txt(x0 - 10, this.yr(r0), truncate(l.name, lw - 10, AXIS_FONT, weight), { anchor: "end", strong: l.hi, opacity: fade }) : null}
              ${r1 !== undefined ? txt(x1 + 10, this.yr(r1), `${rankText(r1)} ${truncateBeside(l.name, rankText(r1), rw - 10, AXIS_FONT, weight)}`, { strong: l.hi, opacity: fade }) : null}
            </g>`;
            })
      }
      ${axisXBand({ labels: this.sm.labels, centers: this.sm.keys.map((_, j) => this.xs(j)), y: H - bottom + 14 })}`;
  }

  static override css = /* css */ `
/* The column under the pointer or keyboard: a soft band behind the lines */
.ui-bmp__cursor { stroke: var(--tc-plot-grid); stroke-linecap: round; pointer-events: none; }
.ui-bmp__item { pointer-events: none; }
.ui-bmp__line { fill: none; stroke: var(--tc-bmp-ink); stroke-opacity: 0.6; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-bmp__line[data-hi] { stroke-opacity: 1; stroke-width: 3.4; }
.ui-bmp__dot { fill: var(--tc-plot-bg); stroke: var(--tc-bmp-ink); stroke-width: 1.6; }
.ui-bmp__dot[data-hi] { fill: var(--tc-bmp-ink); stroke-width: 0; }
@media (forced-colors: active) {
  .ui-bmp__line, .ui-bmp__dot { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-bump-chart")) customElements.define("tc-bump-chart", TcBumpChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-bump-chart": TcBumpChart;
  }
}
