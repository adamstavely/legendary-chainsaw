import { svg } from "lit";
import { property } from "lit/decorators.js";
import { XYChart } from "./internal/chart/xy";
import type { Row } from "./internal/chart/types";

/*
 * <tc-area-chart> – totals and their make-up over time, as filled areas: several series stacked (or stacked to 100%),
 * or overlapping. Ported from ztd-charts' AreaChart (MIT, © 2026 Junhan2). Several series take the chart inks in order
 * (`color-mode="highlight"` paints one and leaves the rest quiet); one series takes the accent. Areas rise from the
 * floor when the chart comes on screen and glide when the data changes.
 *   · one tab stop: arrows move along x, each step read with every series' value there
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-area-chart heading="Storage by tier" .data=${rows} x="month" .y=${["hot", "warm", "cold"]}></tc-area-chart>
 */

/** An area chart: Lucide (ISC, lucide.dev) */
const areaIcon = svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"></path>`;

export type AreaStack = "none" | "stacked" | "percent";

/**
 * Totals and their make-up over time as filled areas – stacked, stacked to 100% or overlapping – with names at their
 * ends, the nearest point read across series, and a table view.
 * @tag tc-area-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to an x, or off the chart ({ event }: ChartMarkHover)
 * @fires tc-mark-click - An x was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcAreaChart<T = Row> extends XYChart<T> {
  static override ui = "arc";

  /** "none" overlaps the areas, "stacked" piles them up, "percent" stacks them to 100%; by default stacked when there are several */
  @property() accessor stack: AreaStack | undefined = undefined;

  protected override readonly kind = "Area chart";
  protected override readonly icon = areaIcon;
  protected override readonly isArea = true;
  protected override extraKeys() {
    return ["stack"];
  }
  protected override stackMode(): AreaStack {
    if (this.stack) return this.stack;
    const y = this.y;
    // Several series: a list of fields, or a series field
    return Array.isArray(y) ? (y.length > 1 ? "stacked" : "none") : this.series !== undefined ? "stacked" : "none";
  }
  protected override tableHeader() {
    return "x";
  }

  static override css = "";
}

if (!customElements.get("tc-area-chart")) customElements.define("tc-area-chart", TcAreaChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-area-chart": TcAreaChart;
  }
}
