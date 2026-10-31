import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentHandoff, type AgentHandoffLink, type AgentHandoffSelectedChange } from "../agent-handoff";
import { h, useControlled } from "./internal";

export type { AgentHandoffLabels, AgentHandoffLink, AgentHandoffSelectedChange, AgentHandoffStatus, AgentHandoffStep } from "../agent-handoff";
export { agentHandoffId, defaultAgentHandoffLabels } from "../agent-handoff";

const RawAgentHandoff = createComponent({
  tagName: "tc-agent-handoff",
  elementClass: TcAgentHandoff,
  react: React,
  events: { onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<AgentHandoffSelectedChange>> },
});
type RawProps = React.ComponentProps<typeof RawAgentHandoff>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type AgentHandoffProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Agent handoffs" */
  title?: string;
  /** The open handoff's id – controlled when given */
  selected?: string | null;
  /** The open handoff on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A handoff was opened or closed */
  onSelectedChange?: (selected: string | null, handoff: AgentHandoffLink | null) => void;
};

export function AgentHandoff({ title, selected, defaultSelected = null, onSelectedChange, ...props }: AgentHandoffProps) {
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  return h(RawAgentHandoff, {
    ...props,
    heading: title ?? "Agent handoffs",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<AgentHandoffSelectedChange>) => {
      s.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.handoff);
    },
  });
}
