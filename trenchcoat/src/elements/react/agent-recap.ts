import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentRecap, type RecapClearDone, type RecapItem, type RecapItemAction } from "../agent-recap";
import { h } from "./internal";

export type { AgentRecapLabels, RecapClearDone, RecapEvent, RecapItem, RecapItemAction, RecapKind } from "../agent-recap";
export { defaultAgentRecapLabels, recapBins } from "../agent-recap";

const RawAgentRecap = createComponent({
  tagName: "tc-agent-recap",
  elementClass: TcAgentRecap,
  react: React,
  events: {
    onTcItemAction: "tc-item-action" as EventName<CustomEvent<RecapItemAction>>,
    onTcClearDone: "tc-clear-done" as EventName<CustomEvent<RecapClearDone>>,
  },
});
type RawAgentRecapProps = React.ComponentProps<typeof RawAgentRecap>;

export type AgentRecapOwnProps = {
  /** The heading */
  title?: string;
  /** Approve, Retry or Open on an item. Call event.preventDefault() to keep it on the board (and a link from being followed) */
  onItemAction?: (action: RecapItemAction["action"], item: RecapItem, event: Event) => void;
  /** Clear done, with the ids it clears. Call event.preventDefault() to keep them */
  onClearDone?: (ids: string[], event: Event) => void;
};
export type AgentRecapProps = Omit<RawAgentRecapProps, keyof AgentRecapOwnProps | "heading" | "onTcItemAction" | "onTcClearDone"> & AgentRecapOwnProps;

export function AgentRecap({ title = "Agent recap", onItemAction, onClearDone, ...props }: AgentRecapProps) {
  return h(RawAgentRecap, {
    ...props,
    heading: title,
    onTcItemAction: (e: CustomEvent<RecapItemAction>) => onItemAction?.(e.detail.action, e.detail.item, e),
    onTcClearDone: (e: CustomEvent<RecapClearDone>) => onClearDone?.(e.detail.ids, e),
  });
}
