import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcChart, type ChartSpecCheck } from "../chart";

export type { ChartSpecCheck } from "../chart";
export type { ChartSpec, SpecData, SpecIssue } from "../internal/chart/spec";

const RawChart = createComponent({
  tagName: "tc-chart",
  elementClass: TcChart,
  react: React,
  events: {
    onTcSpecCheck: "tc-spec-check" as EventName<CustomEvent<ChartSpecCheck>>,
  },
});
type RawProps = React.ComponentProps<typeof RawChart>;
export type ChartProps = Omit<RawProps, "onTcSpecCheck" | "children"> & {
  /** The spec was checked: valid, with its errors and warnings */
  onSpecCheck?: (check: ChartSpecCheck) => void;
};

export function Chart({ onSpecCheck, ...props }: ChartProps) {
  return React.createElement(RawChart, { ...props, onTcSpecCheck: onSpecCheck ? (e: CustomEvent<ChartSpecCheck>) => onSpecCheck(e.detail) : undefined });
}
