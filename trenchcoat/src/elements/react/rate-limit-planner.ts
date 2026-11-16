import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRateLimitPlanner, type PlannedRun, type RateLimitRunsChange } from "../rate-limit-planner";
import { h, useControlled } from "./internal";

export type { PlannedRun, RateLimitRunsChange } from "../rate-limit-planner";
export { rateLoad, spreadRuns } from "../rate-limit-planner";

const RawRateLimitPlanner = createComponent({
  tagName: "tc-rate-limit-planner",
  elementClass: TcRateLimitPlanner,
  react: React,
  events: {
    onTcRunsChange: "tc-runs-change" as EventName<CustomEvent<RateLimitRunsChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRateLimitPlanner>;
type Owned = "heading" | "runs" | "onTcRunsChange" | "children";
export type RateLimitPlannerProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The runs – controlled when given */
  runs?: PlannedRun[];
  /** The runs on mount when `runs` isn't controlled */
  defaultRuns?: PlannedRun[];
  /** A run was moved, or Spread out proposed new start times */
  onRunsChange?: (runs: PlannedRun[], change: RateLimitRunsChange["change"], id: string | null) => void;
};

const NONE: PlannedRun[] = [];

export function RateLimitPlanner({ title, runs, defaultRuns = NONE, onRunsChange, ...props }: RateLimitPlannerProps) {
  const last = React.useRef<RateLimitRunsChange | null>(null);
  const r = useControlled<PlannedRun[]>(runs, defaultRuns, onRunsChange ? (next) => onRunsChange(next, last.current!.change, last.current!.id) : undefined);
  return h(RawRateLimitPlanner, {
    ...props,
    heading: title ?? "Rate limit plan",
    runs: r.value,
    onTcRunsChange: (e: CustomEvent<RateLimitRunsChange>) => {
      last.current = e.detail;
      r.handler(e.detail.runs, e);
    },
  });
}
