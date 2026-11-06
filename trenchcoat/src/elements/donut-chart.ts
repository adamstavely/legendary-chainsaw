import { svg } from "lit";
import { property } from "lit/decorators.js";
import { PieBase, type DonutLegend, type PieLabelMode } from "./internal/chart/pie";
import type { Row } from "./internal/chart/types";

/*
 * <tc-donut-chart> – shares of a whole round a hole that holds the total, with a legend of every slice and its share.
 * Ported from ztd-charts' DonutChart (MIT, © 2026 Junhan2). Each slice takes the next chart ink (`color-mode="emphasis"`
 * paints one and leaves the rest quiet). The legend sits beside the donut when there's room and under it when narrow;
 * the total counts up as the slices sweep round when the chart comes on screen.
 *   · one tab stop: arrows move slice to slice, each read with its value and share
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-donut-chart heading="Open findings" center-label="Findings" .data=${[{ label: "High", value: 4 }, …]}></tc-donut-chart>
 */

/** A donut chart: Lucide (ISC, lucide.dev) */
const donutIcon = svg`<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><path d="M12 2v6"></path>`;

/** What the middle shows: the total, the highlighted slice's value, a number of the page's, or nothing (null) */
export type DonutCenter = "total" | "highlight" | number | null;

/**
 * Shares of a whole round a hole holding the total, each slice in its own ink or one emphasised, with a legend of
 * every slice and its share and a table view.
 * @tag tc-donut-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a slice, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A slice was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcDonutChart<T = Row> extends PieBase<T> {
  static override ui = "dnt";

  /** The hole's share of the radius, 0.2 to 0.9 */
  @property({ type: Number, attribute: "inner-radius" }) accessor innerRadius = 0.62;
  /** What the middle shows: "total", "highlight", a number, or null for nothing */
  @property({ attribute: false }) accessor centerValue: DonutCenter = "total";
  /** The words under the middle number: "Findings" */
  @property({ attribute: "center-label" }) accessor centerLabel: string | undefined = undefined;
  /** Where the legend goes: "auto" (beside when there's room, else under), "right", "bottom" or "none" */
  @property() accessor legend: DonutLegend = "auto";
  /** What each slice's label says, outside the ring: "none" (the legend has the shares), "percent", "value" or "label" */
  @property({ attribute: "label-mode" }) accessor labelMode: PieLabelMode = "none";

  protected override readonly kind = "Donut chart";
  protected override readonly icon = donutIcon;
  protected override extraKeys() {
    return ["innerRadius", "centerValue", "centerLabel", "legend", "labelMode"];
  }
  protected override inner() {
    return Math.max(0.2, Math.min(0.9, this.innerRadius));
  }
  protected override sliceLabels() {
    return this.labelMode;
  }
  protected override legendAt(w: number) {
    const l = this.legend;
    return l === "auto" ? (w >= 300 ? "right" : "bottom") : l;
  }
  protected override centerNumber(slices: { value: number; hi: boolean }[], total: number) {
    const v = this.centerValue;
    if (v === null) return null;
    if (typeof v === "number") return v;
    if (v === "highlight") return slices.find((s) => s.hi)?.value ?? total;
    return total;
  }
  protected override centerCaption() {
    return this.centerLabel;
  }

  static override css = "";
}

if (!customElements.get("tc-donut-chart")) customElements.define("tc-donut-chart", TcDonutChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-donut-chart": TcDonutChart;
  }
}
