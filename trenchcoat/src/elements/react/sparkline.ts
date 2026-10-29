import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSparkline, type SparklinePointFocus } from "../sparkline";
import { h } from "./internal";

export type { SparklinePointFocus, SparklineTone, SparklineType } from "../sparkline";

const RawSparkline = createComponent({
  tagName: "tc-sparkline",
  elementClass: TcSparkline,
  react: React,
  events: {
    onTcPointFocus: "tc-point-focus" as EventName<CustomEvent<SparklinePointFocus>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSparkline>;
type Owned = "onTcPointFocus" | "children";
export type SparklineProps = Omit<RawProps, Owned> & {
  /** A point was stepped to or pointed at, in interactive mode */
  onPointFocus?: (index: number, value: number | null, label?: string) => void;
};

export function Sparkline({ onPointFocus, ...props }: SparklineProps) {
  return h(RawSparkline, {
    ...props,
    onTcPointFocus: (e: CustomEvent<SparklinePointFocus>) => onPointFocus?.(e.detail.index, e.detail.value, e.detail.label),
  });
}
