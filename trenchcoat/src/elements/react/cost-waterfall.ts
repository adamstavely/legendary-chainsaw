import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCostWaterfall, type CostStep, type CostWaterfallMeasure, type CostWaterfallMeasureChange, type CostWaterfallOpenChange, type CostWaterfallOrder, type CostWaterfallOrderChange } from "../cost-waterfall";
import { h, useControlled } from "./internal";

export type { CostStep, CostStepKind, CostWaterfallLabels, CostWaterfallMeasure, CostWaterfallMeasureChange, CostWaterfallOpenChange, CostWaterfallOrder, CostWaterfallOrderChange } from "../cost-waterfall";
export { costWaterfall, defaultCostWaterfallLabels, stepTokens, stepValue } from "../cost-waterfall";

const RawCostWaterfall = createComponent({
  tagName: "tc-cost-waterfall",
  elementClass: TcCostWaterfall,
  react: React,
  events: {
    onTcMeasureChange: "tc-measure-change" as EventName<CustomEvent<CostWaterfallMeasureChange>>,
    onTcOrderChange: "tc-order-change" as EventName<CustomEvent<CostWaterfallOrderChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<CostWaterfallOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCostWaterfall>;
type Owned = "heading" | "measure" | "order" | "openId" | "onTcMeasureChange" | "onTcOrderChange" | "onTcOpenChange" | "children";
export type CostWaterfallProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** Controlled measure: "cost" or "tokens" */
  measure?: CostWaterfallMeasure;
  /** The measure on mount when `measure` isn't controlled */
  defaultMeasure?: CostWaterfallMeasure;
  /** Called when Cost or Tokens is picked */
  onMeasureChange?: (measure: CostWaterfallMeasure) => void;
  /** Controlled order: "cost" (most expensive first) or "run" */
  order?: CostWaterfallOrder;
  /** The order on mount when `order` isn't controlled */
  defaultOrder?: CostWaterfallOrder;
  /** Called when By cost or In order is picked */
  onOrderChange?: (order: CostWaterfallOrder) => void;
  /** Controlled id of the step whose details are open */
  openId?: string | null;
  /** The open step on mount when `openId` isn't controlled */
  defaultOpenId?: string | null;
  /** Called when a step's details open (with the step) or close (null) */
  onOpenChange?: (openId: string | null, step?: CostStep) => void;
};

export function CostWaterfall({ title = "Cost waterfall", measure, defaultMeasure = "cost", onMeasureChange, order, defaultOrder = "cost", onOrderChange, openId, defaultOpenId = null, onOpenChange, ...props }: CostWaterfallProps) {
  const m = useControlled(measure, defaultMeasure, onMeasureChange);
  const o = useControlled(order, defaultOrder, onOrderChange);
  const steps = props.steps;
  const d = useControlled<string | null>(openId, defaultOpenId, onOpenChange && ((id) => onOpenChange(id, id ? steps?.find((s) => s.id === id) : undefined)));
  return h(RawCostWaterfall, {
    ...props,
    heading: title,
    measure: m.value,
    order: o.value,
    openId: d.value,
    onTcMeasureChange: (e: CustomEvent<CostWaterfallMeasureChange>) => m.handler(e.detail.measure, e),
    onTcOrderChange: (e: CustomEvent<CostWaterfallOrderChange>) => o.handler(e.detail.order, e),
    onTcOpenChange: (e: CustomEvent<CostWaterfallOpenChange>) => d.handler(e.detail.openId, e),
  });
}
