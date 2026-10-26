import { createComponent } from "@lit/react";
import * as React from "react";
import { TcChangeSummary } from "../change-summary";
import { h, isNode, useStaged } from "./internal";

export type { MetricChange } from "../change-summary";

const RawChangeSummary = createComponent({ tagName: "tc-change-summary", elementClass: TcChangeSummary, react: React });
type RawChangeSummaryProps = React.ComponentProps<typeof RawChangeSummary>;
export type ChangeSummaryProps = Omit<RawChangeSummaryProps, "heading" | "icon"> & {
  /** The heading, and the region's name */
  title?: string;
  /** Icon in front of the title */
  icon?: React.ReactNode;
};
export function ChangeSummary({ title = "What's changed", icon, ...props }: ChangeSummaryProps) {
  const { stage, els } = useStaged(isNode(icon) ? [["icon", icon]] : []);
  return h(React.Fragment, null, stage, h(RawChangeSummary, { ...props, heading: title, icon: isNode(icon) ? els.icon : (icon as Element | undefined) }));
}
