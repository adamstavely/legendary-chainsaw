import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentTrail, type AgentTrailCollapsedChange, type AgentTrailDecisionDetail } from "../agent-trail";
import { h, useControlled } from "./internal";

export type { AgentTrailCollapsedChange, AgentTrailDecision, AgentTrailDecisionDetail, AgentTrailLabels, AgentTrailStatus, AgentTrailStep, AgentTrailSubstep } from "../agent-trail";
export { agentTrailClock, defaultAgentTrailLabels } from "../agent-trail";

const RawAgentTrail = createComponent({
  tagName: "tc-agent-trail",
  elementClass: TcAgentTrail,
  react: React,
  events: {
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<AgentTrailCollapsedChange>>,
    onTcDecision: "tc-decision" as EventName<CustomEvent<AgentTrailDecisionDetail>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentTrail>;
type Owned = "heading" | "collapsed" | "onTcCollapsedChange" | "children";
export type AgentTrailProps = Omit<RawProps, Owned> & {
  /** The task, as the header's title */
  title?: string;
  /** Folded to the header – controlled when given */
  collapsed?: boolean;
  /** Folded on mount when `collapsed` isn't controlled */
  defaultCollapsed?: boolean;
  /** The trail was folded or opened */
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function AgentTrail({ title, collapsed, defaultCollapsed = false, onCollapsedChange, ...props }: AgentTrailProps) {
  const s = useControlled<boolean>(collapsed, defaultCollapsed, onCollapsedChange);
  return h(RawAgentTrail, {
    ...props,
    heading: title ?? "Task",
    collapsed: s.value,
    onTcCollapsedChange: (e: CustomEvent<AgentTrailCollapsedChange>) => s.handler(e.detail.collapsed, e),
  });
}
