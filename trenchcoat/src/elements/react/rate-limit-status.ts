import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRateLimitStatus, type RateLimitSort, type RateLimitSortChange } from "../rate-limit-status";
import { h, useControlled } from "./internal";

export type {
  RateLimitHeadroom,
  RateLimitMetric,
  RateLimitRow,
  RateLimitSort,
  RateLimitSortChange,
  RateLimitStatusLabels,
  RateLimitStatusLabelsInput,
  RateLimitUsage,
} from "../rate-limit-status";
export { defaultRateLimitStatusLabels, rateLimitCountdown, rateLimitHeadroom, rateLimitShare } from "../rate-limit-status";

const RawRateLimitStatus = createComponent({
  tagName: "tc-rate-limit-status",
  elementClass: TcRateLimitStatus,
  react: React,
  events: { onTcSortChange: "tc-sort-change" as EventName<CustomEvent<RateLimitSortChange>> },
});
type RawProps = React.ComponentProps<typeof RawRateLimitStatus>;
export type RateLimitStatusProps = Omit<RawProps, "heading" | "sort" | "onTcSortChange" | "children"> & {
  /** The heading */
  title?: string;
  /** The order – controlled when given */
  sort?: RateLimitSort;
  /** The order on mount, when `sort` isn't controlled */
  defaultSort?: RateLimitSort;
  /** Called with the order the user picked */
  onSortChange?: (sort: RateLimitSort) => void;
};

export function RateLimitStatus({ title, sort, defaultSort = "tightest", onSortChange, ...props }: RateLimitStatusProps) {
  const s = useControlled<RateLimitSort>(sort, defaultSort, onSortChange);
  return h(RawRateLimitStatus, {
    ...props,
    heading: title ?? "Rate limits",
    sort: s.value,
    onTcSortChange: (e: CustomEvent<RateLimitSortChange>) => s.handler(e.detail.sort, e),
  });
}
