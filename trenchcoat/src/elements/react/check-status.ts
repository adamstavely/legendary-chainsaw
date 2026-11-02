import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCheckStatus, type CheckOpen, type CheckRetry } from "../check-status";
import { h } from "./internal";

export type { CheckCounts, CheckItem, CheckOpen, CheckRetry, CheckState, CheckStatusLabels } from "../check-status";
export { countChecks, defaultCheckStatusLabels, overallCheckState } from "../check-status";

const RawCheckStatus = createComponent({
  tagName: "tc-check-status",
  elementClass: TcCheckStatus,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<CheckOpen>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<CheckRetry>>,
  },
});
type RawProps = React.ComponentProps<typeof RawCheckStatus>;
export type CheckStatusProps = Omit<RawProps, "heading" | "children"> & {
  /** The heading */
  title?: string;
};

export function CheckStatus({ title, ...props }: CheckStatusProps) {
  return h(RawCheckStatus, { ...props, heading: title ?? "Checks" });
}
