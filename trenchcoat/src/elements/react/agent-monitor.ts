import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentMonitor, type AgentMonitorActionDetail, type AgentMonitorSelectedChange, type AgentMonitorStep } from "../agent-monitor";
import { h, useControlled } from "./internal";

export type { AgentMonitorAction, AgentMonitorActionDetail, AgentMonitorLabels, AgentMonitorSelectedChange, AgentMonitorStatus, AgentMonitorStep, AgentMonitorStepStatus } from "../agent-monitor";
export { agentMonitorClock, defaultAgentMonitorLabels } from "../agent-monitor";

const RawAgentMonitor = createComponent({
  tagName: "tc-agent-monitor",
  elementClass: TcAgentMonitor,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<AgentMonitorSelectedChange>>,
    onTcAction: "tc-action" as EventName<CustomEvent<AgentMonitorActionDetail>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentMonitor>;
type Owned = "selected" | "onTcSelectedChange" | "children";
export type AgentMonitorProps = Omit<RawProps, Owned> & {
  /** The picked step's id – controlled when given */
  selected?: string | null;
  /** The picked step on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A step was picked or closed */
  onSelectedChange?: (selected: string | null, step: AgentMonitorStep | null) => void;
};

export function AgentMonitor({ selected, defaultSelected = null, onSelectedChange, ...props }: AgentMonitorProps) {
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  return h(RawAgentMonitor, {
    ...props,
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<AgentMonitorSelectedChange>) => {
      s.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.step);
    },
  });
}
