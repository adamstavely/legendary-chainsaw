import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentHandoff, type AgentHandoffItemSelectedChange, type AgentHandoffLink, type AgentHandoffQueueItem, type AgentHandoffSelectedChange } from "../agent-handoff";
import { h, useControlled } from "./internal";

export type { AgentHandoffItemSelectedChange, AgentHandoffLabels, AgentHandoffLink, AgentHandoffQueue, AgentHandoffQueueItem, AgentHandoffSelectedChange, AgentHandoffStatus, AgentHandoffStep, AgentHandoffView } from "../agent-handoff";
export { agentHandoffId, defaultAgentHandoffLabels } from "../agent-handoff";

const RawAgentHandoff = createComponent({
  tagName: "tc-agent-handoff",
  elementClass: TcAgentHandoff,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<AgentHandoffSelectedChange>>,
    onTcItemSelectedChange: "tc-item-selected-change" as EventName<CustomEvent<AgentHandoffItemSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentHandoff>;
type Owned = "heading" | "selected" | "itemSelected" | "onTcSelectedChange" | "onTcItemSelectedChange" | "children";
export type AgentHandoffProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Agent handoffs" */
  title?: string;
  /** The open handoff's id – controlled when given */
  selected?: string | null;
  /** The open handoff on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A handoff was opened or closed */
  onSelectedChange?: (selected: string | null, handoff: AgentHandoffLink | null) => void;
  /** The picked queue item's id – controlled when given */
  itemSelected?: string | null;
  /** The picked queue item on mount when `itemSelected` isn't controlled */
  defaultItemSelected?: string | null;
  /** A queue's item was picked or cleared */
  onItemSelectedChange?: (itemSelected: string | null, item: AgentHandoffQueueItem | null) => void;
};

export function AgentHandoff({ title, selected, defaultSelected = null, onSelectedChange, itemSelected, defaultItemSelected = null, onItemSelectedChange, ...props }: AgentHandoffProps) {
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  const i = useControlled<string | null>(itemSelected, defaultItemSelected, undefined);
  return h(RawAgentHandoff, {
    ...props,
    heading: title ?? "Agent handoffs",
    selected: s.value,
    itemSelected: i.value,
    onTcItemSelectedChange: (e: CustomEvent<AgentHandoffItemSelectedChange>) => {
      i.handler(e.detail.itemSelected, e);
      onItemSelectedChange?.(e.detail.itemSelected, e.detail.item);
    },
    onTcSelectedChange: (e: CustomEvent<AgentHandoffSelectedChange>) => {
      s.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.handoff);
    },
  });
}
