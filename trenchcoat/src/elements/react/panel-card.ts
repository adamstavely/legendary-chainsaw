import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcPanelCard, type PanelCardExpandedChange } from "../panel-card";
import { h, useControlled } from "./internal";

export type { PanelCardExpandedChange, PanelCardMode } from "../panel-card";

const RawPanelCard = createComponent({
  tagName: "tc-panel-card",
  elementClass: TcPanelCard,
  react: React,
  events: {
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<PanelCardExpandedChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawPanelCard>;
export type PanelCardProps = Omit<RawProps, "heading" | "expanded" | "onTcExpandedChange"> & {
  /** The section's name */
  title?: string;
  /** Whether the content shows – controlled when given */
  expanded?: boolean;
  /** Whether the content shows at first, when `expanded` isn't controlled */
  defaultExpanded?: boolean;
  /** The section was opened or shut */
  onExpandedChange?: (expanded: boolean) => void;
};

/** A compact card for one section of a side panel. A child with slot="aside" sits beside the value */
export function PanelCard({ title, expanded, defaultExpanded = false, onExpandedChange, ...props }: PanelCardProps) {
  const v = useControlled<boolean>(expanded, defaultExpanded, onExpandedChange);
  return h(RawPanelCard, {
    ...props,
    heading: title ?? "",
    expanded: v.value,
    onTcExpandedChange: (e: CustomEvent<PanelCardExpandedChange>) => v.handler(e.detail.expanded, e),
  });
}
