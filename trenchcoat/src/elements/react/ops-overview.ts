import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcOpsOverview, type OpsAction, type OpsTile } from "../ops-overview";
import { h } from "./internal";

export type { OpsAction, OpsHealth, OpsTile, OpsTone } from "../ops-overview";
export { defaultOpsHealthLabels } from "../ops-overview";

const RawOpsOverview = createComponent({
  tagName: "tc-ops-overview",
  elementClass: TcOpsOverview,
  react: React,
  events: {
    onTcAction: "tc-action" as EventName<CustomEvent<OpsAction>>,
  },
});
type RawProps = React.ComponentProps<typeof RawOpsOverview>;
type Owned = "heading" | "onTcAction" | "children";
export type OpsOverviewProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** An actionable tile was pressed */
  onAction?: (id: string, tile: OpsTile) => void;
};

export function OpsOverview({ title, onAction, ...props }: OpsOverviewProps) {
  return h(RawOpsOverview, {
    ...props,
    heading: title ?? "Overview",
    onTcAction: (e: CustomEvent<OpsAction>) => onAction?.(e.detail.id, e.detail.tile),
  });
}
