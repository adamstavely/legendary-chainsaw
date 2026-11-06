import { svg } from "lit";
import { property } from "lit/decorators.js";
import { PieBase, type PieLabelMode } from "./internal/chart/pie";
import type { Row } from "./internal/chart/types";

/*
 * <tc-pie-chart> – a few shares of a whole, as slices. Ported from ztd-charts' PieChart (MIT, © 2026 Junhan2). Each
 * slice takes the next chart ink (`color-mode="emphasis"` paints the largest, or `highlight`, and leaves the rest
 * quiet), with its share written beside it outside the circle. The slices sweep round from twelve o'clock when the
 * chart comes on screen; the pointed-at one lifts out.
 *   · one tab stop: arrows move slice to slice, each read with its value and share
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-pie-chart heading="Where reviews come from" .data=${[{ label: "Audit", value: 42 }, …]}></tc-pie-chart>
 */

/** A pie chart: Lucide (ISC, lucide.dev) */
const pieIcon = svg`<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"></path><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>`;

/**
 * A few shares of a whole as slices, each in its own ink or one emphasised, with the shares beside them and a table
 * view.
 * @tag tc-pie-chart
 * @fires tc-view-change - The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was
 * @fires tc-mark-hover - The pointer or keyboard moved to a slice, or off them ({ event }: ChartMarkHover)
 * @fires tc-mark-click - A slice was clicked, or picked with Enter or Space ({ event }: ChartMarkClick)
 */
export class TcPieChart<T = Row> extends PieBase<T> {
  static override ui = "pie";

  /** What each slice's label says: "percent", "value", "label" or "none" */
  @property({ attribute: "label-mode" }) accessor labelMode: PieLabelMode = "percent";

  protected override readonly kind = "Pie chart";
  protected override readonly icon = pieIcon;
  protected override extraKeys() {
    return ["labelMode"];
  }
  protected override inner() {
    return 0;
  }
  protected override sliceLabels() {
    return this.labelMode;
  }

  static override css = "";
}

if (!customElements.get("tc-pie-chart")) customElements.define("tc-pie-chart", TcPieChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-pie-chart": TcPieChart;
  }
}
