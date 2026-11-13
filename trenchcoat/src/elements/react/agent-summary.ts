import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentSummary, type AgentSummaryAction, type AgentSummaryActionDetail } from "../agent-summary";
import { h } from "./internal";

export type { AgentSummaryAction, AgentSummaryActionDetail, AgentSummaryDay, AgentSummaryFailure, AgentSummaryLabels, AgentSummaryStatus } from "../agent-summary";
export { agentSummaryTotals, defaultAgentSummaryLabels } from "../agent-summary";

const RawAgentSummary = createComponent({
  tagName: "tc-agent-summary",
  elementClass: TcAgentSummary,
  react: React,
  events: {
    onTcAction: "tc-action" as EventName<CustomEvent<AgentSummaryActionDetail>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentSummary>;
export type AgentSummaryProps = Omit<RawProps, "onTcAction" | "children"> & {
  /** Edit, Run test, Pause or Resume was pressed; return false to stop Pause and Resume changing the status */
  onAction?: (action: AgentSummaryAction) => boolean | void;
};

export function AgentSummary({ onAction, ...props }: AgentSummaryProps) {
  return h(RawAgentSummary, {
    ...props,
    onTcAction: (e: CustomEvent<AgentSummaryActionDetail>) => {
      if (onAction?.(e.detail.action) === false) e.preventDefault();
    },
  });
}
