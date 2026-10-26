import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcContextWindow, type ContextPart } from "../context-window";
import { h, isNode, useStaged } from "./internal";

export type { ContextItem, ContextPart } from "../context-window";

const RawContextWindow = createComponent({
  tagName: "tc-context-window",
  elementClass: TcContextWindow,
  react: React,
  events: {
    onTcRemoveItem: "tc-remove-item" as EventName<CustomEvent<{ partId: string; itemId: string }>>,
    onTcAction: "tc-action" as EventName<CustomEvent<{ label: string }>>,
  },
});
type RawContextWindowProps = React.ComponentProps<typeof RawContextWindow>;
export type ContextWindowProps = Omit<RawContextWindowProps, "heading" | "modelIcon" | "actionLabel" | "onTcRemoveItem" | "onTcAction" | "limit" | "parts"> & {
  parts: ContextPart[];
  /** Size of the context window in tokens */
  limit: number;
  title?: string;
  /** Logo in front of the model name – any node, sized to 12px */
  modelIcon?: React.ReactNode;
  /**
   * Called when an item is removed. The card hides the item at once and keeps it hidden until `parts` brings a
   * different list of items for that part – so `parts` stays the source of truth, whether you handle the removal or
   * only listen to it
   */
  onRemoveItem?: (partId: string, itemId: string) => void;
  /** A button on the tray (Clean: in the card's last row), e.g. { label: "New chat", onClick } */
  action?: { label: string; onClick: () => void };
};

export function ContextWindow({ title = "Context window", modelIcon, onRemoveItem, action, ...props }: ContextWindowProps) {
  const { stage, els } = useStaged(isNode(modelIcon) ? [["icon", modelIcon]] : []);
  return h(React.Fragment, null, stage, h(RawContextWindow, {
    ...props,
    heading: title,
    modelIcon: isNode(modelIcon) ? els.icon : (modelIcon as Element | undefined),
    actionLabel: action?.label ?? "",
    onTcRemoveItem: (e: CustomEvent<{ partId: string; itemId: string }>) => onRemoveItem?.(e.detail.partId, e.detail.itemId),
    onTcAction: () => action?.onClick(),
  }));
}
