import { svg } from "lit";
import { property } from "lit/decorators.js";
import { XYChart } from "./internal/chart/xy";
import type { Row } from "./internal/chart/types";

/*
 * <tc-line-chart> – how values change over time or along x, as lines. Ported from ztd-charts' LineChart (MIT, © 2026
 * Junhan2). One series takes the accent and the rest stay quiet (`highlight` picks which; `color-mode="categorical"`
 * gives each its own ink), named at their ends when there are several. The pointer reads the nearest x across every
 * series; lines draw themselves in when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move along x, each step read with every series' value there
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-line-chart heading="Median latency" unit=" ms" .data=${[{ x: "2026-03", y: 182 }, …]}></tc-line-chart>
 */

/** A line chart: Lucide (ISC, lucide.dev) */
const lineIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="m19 9-5 5-4-4-3 3"></path>`;

/**
 * Values over time or along x as lines – one emphasised or each in its own ink – with names at their ends, reference
 * lines, the nearest point read across series, and a table view.
 * @tag tc-line-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to an x, or off the chart ({ event }: ChartMarkHover)
 * @fires tc-mark-click - An x was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcLineChart<T = Row> extends XYChart<T> {
  static override ui = "lnc";

  /** Marks the points: always, never, or "auto" – when there are 16 or fewer */
  @property({ attribute: false }) accessor dots: boolean | "auto" = "auto";
  /** A soft fill under the emphasised line */
  @property({ type: Boolean }) accessor area = false;

  protected override readonly kind = "Line chart";
  protected override readonly icon = lineIcon;
  protected override readonly isArea = false;
  protected override extraKeys() {
    return ["dots", "area"];
  }
  protected override showDots(count: number) {
    return this.dots === true || (this.dots === "auto" && count <= 16);
  }
  protected override underFill() {
    return this.area;
  }
  protected override tableHeader() {
    return "x";
  }

  static override css = "";
}

if (!customElements.get("tc-line-chart")) customElements.define("tc-line-chart", TcLineChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-line-chart": TcLineChart;
  }
}
