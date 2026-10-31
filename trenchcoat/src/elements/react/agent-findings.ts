import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentFindings, type AgentFinding, type AgentFindingsAgentFilterChange, type AgentFindingsSelectedChange, type AgentFindingsSeverityFilterChange } from "../agent-findings";
import { h, useControlled } from "./internal";

export type { AgentFinding, AgentFindingSeverity, AgentFindingsAgent, AgentFindingsAgentFilterChange, AgentFindingsLabels, AgentFindingsSelectedChange, AgentFindingsSeverityFilter, AgentFindingsSeverityFilterChange, AgentFindingsStatus } from "../agent-findings";
export { defaultAgentFindingsLabels } from "../agent-findings";

const RawAgentFindings = createComponent({
  tagName: "tc-agent-findings",
  elementClass: TcAgentFindings,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<AgentFindingsSelectedChange>>,
    onTcAgentFilterChange: "tc-agent-filter-change" as EventName<CustomEvent<AgentFindingsAgentFilterChange>>,
    onTcSeverityFilterChange: "tc-severity-filter-change" as EventName<CustomEvent<AgentFindingsSeverityFilterChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAgentFindings>;
type Owned = "heading" | "selected" | "onTcSelectedChange" | "children";
export type AgentFindingsProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Agent findings" */
  title?: string;
  /** The open finding's id – controlled when given */
  selected?: string | null;
  /** The open finding on mount when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A finding was opened or closed */
  onSelectedChange?: (selected: string | null, finding: AgentFinding | null) => void;
};

export function AgentFindings({ title, selected, defaultSelected = null, onSelectedChange, ...props }: AgentFindingsProps) {
  const s = useControlled<string | null>(selected, defaultSelected, undefined);
  return h(RawAgentFindings, {
    ...props,
    heading: title ?? "Agent findings",
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<AgentFindingsSelectedChange>) => {
      s.handler(e.detail.selected, e);
      onSelectedChange?.(e.detail.selected, e.detail.finding);
    },
  });
}
