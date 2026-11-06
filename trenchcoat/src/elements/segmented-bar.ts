import { nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { numGetter, strGetter } from "./internal/chart/accessor";
import { txt } from "./internal/chart/axis";
import { AXIS_FONT, categoricalInk, emphasisInk, TcChartElement, type ChartFrame, type ChartModel } from "./internal/chart/element";
import { roundRectPath } from "./internal/chart/geometry";
import { resolveHighlight } from "./internal/chart/highlight";
import { textWidth, truncate } from "./internal/chart/text";
import type { Accessor, Row, TooltipData } from "./internal/chart/types";

/*
 * <tc-segmented-bar> – shares of one whole as a single bar cut into parts, with a list of each part's name, value
 * and share underneath. Ported from ztd-charts' Segmented bar (MIT, © 2026 Junhan2). Parts are ordered from the
 * largest (`sort="false"` keeps the data's order); the largest takes the accent and the rest step down through quiet
 * shades (`highlight` picks others, `color-mode="categorical"` gives each part a chart ink). `variant="thin"` draws a
 * slim bar for a card or a row. Parts grow in from the left when the chart comes on screen and glide when the data
 * changes. Not Segmented Control, which is a set of buttons.
 *   · one tab stop: arrows move part to part, each read with its value and share
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-segmented-bar heading="Compute by lab" .data=${[{ label: "Genomics", value: 420 }, …]}></tc-segmented-bar>
 */

/** A segmented bar: Lucide's rectangle-horizontal with two cuts (ISC, lucide.dev) */
const segmentedIcon = svg`<rect x="2" y="7" width="20" height="10" rx="2"></rect><path d="M10 7v10"></path><path d="M16 7v10"></path>`;

export type SegmentedBarVariant = "tall" | "thin";
export type SegmentedBarColorMode = "emphasis" | "categorical";

type Part<T> = { i: number; label: string; value: number; share: number; pct: string; ink: string; hi: boolean; datum: T };

/** The gap between parts and the height of a list row, in px */
const GAP = 2;
const ROW_H = 26;
const TOP = 2;
const onByDefault = { fromAttribute: (v: string | null) => v !== "false" };
const listColumns = (width: number, n: number) => (width >= 420 && n >= 4 ? 2 : 1);

/**
 * Shares of one whole as a single bar cut into parts, the largest emphasised, with a list of names, values and shares
 * and a table view.
 * @tag tc-segmented-bar
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a part, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A part was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcSegmentedBar<T = Row> extends TcChartElement<number, T> {
  static override ui = "sgb";

  /** The part-name field; by default "label" */
  @property({ attribute: false }) accessor label: Accessor<T, string> | undefined = undefined;
  /** The value field; by default "value" */
  @property({ attribute: false }) accessor value: Accessor<T, number> | undefined = undefined;
  /** A 28px bar ("tall") or an 8px one ("thin") */
  @property() accessor variant: SegmentedBarVariant = "tall";
  /** Orders the parts from the largest; sort="false" keeps the data's order */
  @property({ converter: onByDefault }) accessor sort = true;
  /** The list of names, values and shares under the bar; list="false" leaves it out */
  @property({ converter: onByDefault }) accessor list = true;
  /** "emphasis" paints the highlighted parts and steps the rest through quiet shades; "categorical" gives each its own ink */
  @property({ attribute: "color-mode" }) accessor colorMode: SegmentedBarColorMode = "emphasis";

  protected override readonly kind = "Segmented bar";
  protected override readonly icon = segmentedIcon;
  protected override defaultDuration = 800;
  protected override stagger = 70;
  protected override defaultFormat = "number" as const;
  protected override modelKeys = ["label", "value", "variant", "sort", "list", "colorMode"];

  private parts: Part<T>[] = [];
  private layout = new Map<number, { x: number; w: number }>();

  private get barH() {
    return this.variant === "thin" ? 8 : 28;
  }

  protected override defaultHeight(w: number) {
    const n = this.data.length;
    return this.barH + 4 + (this.list ? 18 + Math.ceil(n / listColumns(w, n)) * ROW_H : 0);
  }

  protected override tableHeader() {
    return "Part";
  }

  /** The quiet shades: the first rest part the strongest, the last the plain rest ink */
  private restInk(j: number, k: number) {
    if (k === 1 || j === k - 1) return emphasisInk(false);
    const strength = Math.round((1 - j / (k - 1)) * 100);
    return `color-mix(in oklab, var(--tc-plot-line-rest) ${strength}%, var(--tc-plot-rest))`;
  }

  protected override buildModel(f: ChartFrame): ChartModel<number, T> {
    const W = f.width;
    const gl = strGetter(this.label, "label");
    const gv = numGetter(this.value, "value");
    const rows = this.data.map((d, i) => ({ d, i, label: gl(d, i), value: Math.max(0, gv(d, i) || 0) }));
    const ordered = this.sort ? [...rows].sort((a, b) => b.value - a.value) : rows;
    const total = ordered.reduce((s, r) => s + r.value, 0);
    const hi = resolveHighlight(this.highlight, ordered.map((r) => r.d), ordered.map((r) => r.label), ordered.map((r) => r.value), "max");
    const restCount = ordered.length - [...hi].length;
    let j = 0;
    this.parts = ordered.map((r, k) => {
      const share = total > 0 ? r.value / total : 0;
      const isHi = hi.has(k);
      const ink = this.colorMode === "categorical" ? categoricalInk(k) : isHi ? emphasisInk(true) : this.restInk(j++, restCount);
      return { i: r.i, label: r.label, value: r.value, share, pct: f.pct(share * 100), ink, hi: isHi, datum: r.d };
    });

    // A part worth nothing isn't drawn in the bar (it stays in the list); parts are parted by a 2px gap
    const drawn = this.parts.filter((q) => q.share > 0);
    const room = Math.max(0, W - GAP * Math.max(0, drawn.length - 1));
    let cursor = 0;
    this.layout = new Map();
    const marks = drawn.map((q, k) => {
      const w = room * q.share;
      this.layout.set(q.i, { x: cursor, w });
      const mark = { key: `s:${q.label}`, to: [cursor, w], from: [cursor, 0], enter: [cursor, 0], delay: k * this.stagger, data: q.i };
      cursor += w + GAP;
      return mark;
    });
    const events = this.parts.map((q, k) => ({ datum: q.datum, index: k, key: q.label, label: q.label, value: q.value, formatted: `${f.fv(q.value)} (${q.pct})` }));
    const summary = `Total ${f.fv(total)}. ${this.parts.map((q) => `${q.label} ${q.pct}`).join(", ")}`;
    return { marks, events, summary };
  }

  protected override tip(k: number, f: ChartFrame): TooltipData | null {
    const q = this.parts[k];
    const g = q && this.layout.get(q.i);
    if (!q || !g) return null;
    return { x: g.x + g.w / 2, y: TOP, title: q.label, rows: [{ label: this.words.value, value: f.fv(q.value), color: q.ink }, { label: "Share", value: q.pct }] };
  }

  protected override draw(f: ChartFrame) {
    const W = f.width;
    const barH = this.barH;
    const r = this.variant === "thin" ? barH / 2 : 4;
    const index = new Map(this.parts.map((q, k) => [q.i, k]));
    const cols = listColumns(W, this.parts.length);
    const colW = W / cols;
    const listTop = TOP + barH + 18;
    return svg`
      ${this.layout.size ? nothing : svg`<rect class="ui-sgb__track" x="0" y=${TOP} width=${W} height=${barH} rx=${r}></rect>`}
      ${this.motion.items.map((it) => {
        const k = index.get(it.data);
        const q = k === undefined ? undefined : this.parts[k];
        if (k === undefined || !q) return nothing;
        const [x, w] = it.v;
        if (w < 0.5) return nothing;
        const h = this.hover(k);
        const focus = this.active === k && this.via === "keyboard";
        return svg`<g class="tc-chart__mark" opacity=${it.exiting ? 0.4 : this.dim(k)} @pointerenter=${h.enter} @click=${h.click}>
          <path class="ui-sgb__part" ?data-hi=${q.hi} d=${roundRectPath(x, TOP, w, barH, Math.min(r, w / 2))} style=${`fill: ${q.ink}`}></path>
          ${focus ? svg`<path class="tc-chart__focus" d=${roundRectPath(x - 2, TOP - 2, w + 4, barH + 4, Math.min(r + 2, w / 2 + 2))}></path>` : nothing}
        </g>`;
      })}
      ${this.list
        ? this.parts.map((q, k) => {
            const col = k % cols;
            const row = Math.floor(k / cols);
            const x = col * colW;
            const y = listTop + row * ROW_H;
            const right = x + colW - (cols > 1 && col === 0 ? 16 : 0);
            const valueText = f.fv(q.value);
            const shareW = textWidth(q.pct, AXIS_FONT, 400);
            const valueW = textWidth(valueText, AXIS_FONT, q.hi ? 700 : 500);
            const labelMax = right - x - 18 - shareW - valueW - 18;
            const h = this.hover(k);
            return svg`<g class="tc-chart__mark" opacity=${this.dim(k)} @pointerenter=${h.enter} @click=${h.click}>
              <rect class="tc-chart__hit" x=${x} y=${y - ROW_H / 2 + 2} width=${Math.max(0, right - x)} height=${ROW_H - 4}></rect>
              <rect class="ui-sgb__swatch" x=${x} y=${y - 5} width="10" height="10" rx="3" style=${`fill: ${q.ink}`}></rect>
              ${txt(x + 18, y, truncate(q.label, Math.max(24, labelMax), AXIS_FONT, q.hi ? 700 : 500), { strong: q.hi })}
              ${txt(right - shareW - 10, y, valueText, { anchor: "end", cls: "value", strong: q.hi })}
              ${txt(right, y, q.pct, { anchor: "end" })}
            </g>`;
          })
        : nothing}`;
  }

  static override css = /* css */ `
.ui-sgb__track { fill: var(--tc-plot-grid); }
@media (forced-colors: active) {
  .ui-sgb__part, .ui-sgb__swatch { forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-segmented-bar")) customElements.define("tc-segmented-bar", TcSegmentedBar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-segmented-bar": TcSegmentedBar;
  }
}
