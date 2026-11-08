import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSubagentList, type Subagent, type SubagentSelectedChange } from "../subagent-list";
import { h, useControlled } from "./internal";

export type { Subagent, SubagentListLabels, SubagentSelectedChange, SubagentShape, SubagentStatus, SubagentTone } from "../subagent-list";
export { defaultSubagentListLabels, subagentClock, subagentMark, subagentShapes, subagentTones } from "../subagent-list";

const RawSubagentList = createComponent({
  tagName: "tc-subagent-list",
  elementClass: TcSubagentList,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<SubagentSelectedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawSubagentList>;
export type SubagentListProps = Omit<RawProps, "heading" | "selected" | "onTcSelectedChange" | "children"> & {
  /** The heading; "" leaves the header out (default "Subagents") */
  title?: string;
  /** The chosen agent's id – controlled when given */
  selected?: string | null;
  /** The chosen agent at first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** An agent was chosen */
  onSelectedChange?: (selected: string | null, agent: Subagent | null) => void;
};

/** The sub-agents a session started, grouped Active and Done, each with its mark, what it's doing and a live clock */
export function SubagentList({ title, selected, defaultSelected = null, onSelectedChange, ...props }: SubagentListProps) {
  const agent = React.useRef<Subagent | null>(null);
  const v = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, agent.current) : undefined);
  return h(RawSubagentList, {
    ...props,
    heading: title ?? "Subagents",
    selected: v.value,
    onTcSelectedChange: (e: CustomEvent<SubagentSelectedChange>) => {
      agent.current = e.detail.agent;
      v.handler(e.detail.selected, e);
    },
  });
}
