import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSlaStatus, type SlaPeriodChange } from "../sla-status";
import { h, useControlled } from "./internal";

export type { SlaOutcome, SlaPeriodChange, SlaRow, SlaSplit } from "../sla-status";
export { defaultSlaLabels } from "../sla-status";

const RawSlaStatus = createComponent({
  tagName: "tc-sla-status",
  elementClass: TcSlaStatus,
  react: React,
  events: {
    onTcPeriodChange: "tc-period-change" as EventName<CustomEvent<SlaPeriodChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSlaStatus>;
type Owned = "heading" | "period" | "onTcPeriodChange" | "children";
export type SlaStatusProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The period shown – controlled when given */
  period?: string;
  /** The period on mount when `period` isn't controlled */
  defaultPeriod?: string;
  /** A period was picked */
  onPeriodChange?: (period: string) => void;
};

export function SlaStatus({ title, period, defaultPeriod = "30d", onPeriodChange, ...props }: SlaStatusProps) {
  const p = useControlled<string>(period, defaultPeriod, onPeriodChange);
  return h(RawSlaStatus, {
    ...props,
    heading: title ?? "SLA performance",
    period: p.value,
    onTcPeriodChange: (e: CustomEvent<SlaPeriodChange>) => p.handler(e.detail.period, e),
  });
}
