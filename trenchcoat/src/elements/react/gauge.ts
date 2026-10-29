import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcGauge, type GaugeValueChange } from "../gauge";
import { h, useControlled } from "./internal";

export type { GaugeBand, GaugeTone, GaugeValueChange, GaugeVariant } from "../gauge";

const RawGauge = createComponent({
  tagName: "tc-gauge",
  elementClass: TcGauge,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<GaugeValueChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawGauge>;
type Owned = "value" | "onTcValueChange" | "children";
export type GaugeProps = Omit<RawProps, Owned> & {
  /** The value – controlled when given */
  value?: number;
  /** The value on mount when `value` isn't controlled */
  defaultValue?: number;
  /** The value was moved, when editable */
  onValueChange?: (value: number) => void;
};

export function Gauge({ value, defaultValue = 0, onValueChange, ...props }: GaugeProps) {
  const s = useControlled<number>(value, defaultValue, onValueChange);
  return h(RawGauge, {
    ...props,
    value: s.value,
    onTcValueChange: (e: CustomEvent<GaugeValueChange>) => s.handler(e.detail.value, e),
  });
}
