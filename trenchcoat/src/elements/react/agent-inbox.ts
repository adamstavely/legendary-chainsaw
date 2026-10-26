import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentInbox, type AgentInboxExpandedChange, type AgentInboxView, type AgentInboxViewChange, type AgentTask } from "../agent-inbox";
import { h, useControlled } from "./internal";

export type { AgentInboxView, AgentTask, AgentTaskHandler, AgentTaskStatus, AgentTaskStep } from "../agent-inbox";

const RawAgentInbox = createComponent({
  tagName: "tc-agent-inbox",
  elementClass: TcAgentInbox,
  react: React,
  events: {
    onTcViewChange: "tc-view-change" as EventName<CustomEvent<AgentInboxViewChange>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<AgentInboxExpandedChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<AgentTask>>,
  },
});
type RawAgentInboxProps = React.ComponentProps<typeof RawAgentInbox>;
export type AgentInboxProps = Omit<RawAgentInboxProps, "heading" | "view" | "expanded" | "openable" | "onTcViewChange" | "onTcExpandedChange" | "onTcOpen" | "tasks"> & {
  tasks: AgentTask[];
  /** Heading on the left of the bar */
  title?: string;
  /** Shows an Open button on running and done tasks */
  onOpen?: (task: AgentTask) => void;
  /** The layout. Controlled when defined; otherwise the component keeps it, starting from `defaultView` */
  view?: AgentInboxView;
  defaultView?: AgentInboxView;
  onViewChange?: (view: AgentInboxView) => void;
  /** The id of the unfolded card. Controlled when defined (null = none); otherwise the component keeps it */
  expanded?: string | null;
  defaultExpanded?: string | null;
  onExpandedChange?: (id: string | null) => void;
};
export function AgentInbox({ title = "Agent inbox", onOpen, view, defaultView = "board", onViewChange, expanded, defaultExpanded = null, onExpandedChange, ...props }: AgentInboxProps) {
  const v = useControlled(view, defaultView, onViewChange);
  const x = useControlled<string | null>(expanded, defaultExpanded, onExpandedChange);
  return h(RawAgentInbox, {
    ...props,
    heading: title,
    view: v.value,
    expanded: x.value,
    openable: !!onOpen,
    onTcViewChange: (e: CustomEvent<AgentInboxViewChange>) => v.handler(e.detail.view, e),
    onTcExpandedChange: (e: CustomEvent<AgentInboxExpandedChange>) => x.handler(e.detail.expanded, e),
    onTcOpen: (e: CustomEvent<AgentTask>) => onOpen?.(e.detail),
  });
}
