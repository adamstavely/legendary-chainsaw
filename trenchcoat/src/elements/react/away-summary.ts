import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAwaySummary, type AwayExpandedChange, type AwayItem, type AwayItemAction, type AwaySeen } from "../away-summary";
import { h, useControlled } from "./internal";

export type { AwayExpandedChange, AwayItem, AwayItemAction, AwayItemStatus, AwaySeen, AwaySummaryLabels } from "../away-summary";
export { awayFor, defaultAwaySummaryLabels } from "../away-summary";

const RawAwaySummary = createComponent({
  tagName: "tc-away-summary",
  elementClass: TcAwaySummary,
  react: React,
  events: {
    onTcItemAction: "tc-item-action" as EventName<CustomEvent<AwayItemAction>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<AwayExpandedChange>>,
    onTcSeen: "tc-seen" as EventName<CustomEvent<AwaySeen>>,
  },
});
type RawAwaySummaryProps = React.ComponentProps<typeof RawAwaySummary>;

export type AwaySummaryOwnProps = {
  /** The heading */
  title?: string;
  /** Whether the Done group is open. Controlled when defined */
  expanded?: boolean;
  /** Whether it starts open when uncontrolled */
  defaultExpanded?: boolean;
  /** The Done group opened or closed */
  onExpandedChange?: (expanded: boolean) => void;
  /** Whether it shows as seen. Controlled when defined – set it after onSeen */
  seen?: boolean;
  /** Whether it starts seen when uncontrolled */
  defaultSeen?: boolean;
  /** Mark all seen, with the ids it showed. Call event.preventDefault() to keep the card */
  onSeen?: (ids: string[], event: Event) => void;
  /** An item's button: "review" (or its own action), "retry" or "open". Call event.preventDefault() to keep a link from being followed */
  onItemAction?: (action: string, item: AwayItem, event: Event) => void;
};
export type AwaySummaryProps = Omit<RawAwaySummaryProps, keyof AwaySummaryOwnProps | "heading" | "onTcItemAction" | "onTcExpandedChange" | "onTcSeen"> & AwaySummaryOwnProps;

export function AwaySummary({ title = "While you were away", expanded, defaultExpanded = false, onExpandedChange, seen, defaultSeen = false, onSeen, onItemAction, ...props }: AwaySummaryProps) {
  const x = useControlled(expanded, defaultExpanded, onExpandedChange);
  const s = useControlled(seen, defaultSeen, undefined);
  return h(RawAwaySummary, {
    ...props,
    heading: title,
    expanded: x.value,
    seen: s.value,
    onTcExpandedChange: (e: CustomEvent<AwayExpandedChange>) => x.handler(e.detail.expanded, e),
    onTcSeen: (e: CustomEvent<AwaySeen>) => {
      onSeen?.(e.detail.ids, e);
      if (e.defaultPrevented) return;
      s.handler(true, e);
    },
    onTcItemAction: (e: CustomEvent<AwayItemAction>) => onItemAction?.(e.detail.action, e.detail.item, e),
  });
}
