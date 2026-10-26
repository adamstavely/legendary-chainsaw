import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAgentLanes, type LaneAgent as ElementAgent, type LaneTask as ElementTask, type LanesExpandedChange, type LanesOpen, type LanesPausedChange } from "../agent-lanes";
import { h, isNode, useControlled, useStaged } from "./internal";

/** React nodes in place of elements: avatars and tool logos */
export type LaneAgent = Omit<ElementAgent, "avatar"> & { avatar?: React.ReactNode };
export type LaneTask = Omit<ElementTask, "tools"> & { tools?: React.ReactNode[] };
export type { LaneTaskStatus } from "../agent-lanes";
/** A decision's handler. It may return a promise: the decision waits while it runs, and if it rejects the block stays
 *  as it was and the decision says so, so you can try again */
export type LaneTaskHandler = (task: LaneTask) => void | Promise<unknown>;

const RawAgentLanes = createComponent({
  tagName: "tc-agent-lanes",
  elementClass: TcAgentLanes,
  react: React,
  events: {
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<LanesExpandedChange>>,
    onTcPausedChange: "tc-paused-change" as EventName<CustomEvent<LanesPausedChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<LanesOpen>>,
  },
});
type RawAgentLanesProps = React.ComponentProps<typeof RawAgentLanes>;
export type AgentLanesProps = Omit<
  RawAgentLanesProps,
  "agents" | "tasks" | "heading" | "openable" | "paused" | "expanded" | "onApprove" | "onReject" | "onTcExpandedChange" | "onTcPausedChange" | "onTcOpen"
> & {
  agents: LaneAgent[];
  /** The tasks – always the source of truth. After Approve or Reject the block shows the result right away; as soon
   *  as you pass that task with a new status, start or end, your version wins */
  tasks: LaneTask[];
  onApprove?: LaneTaskHandler;
  onReject?: LaneTaskHandler;
  /** Shows "Open" in a block's tooltip */
  onOpen?: (task: LaneTask) => void;
  /** Whether the timeline is held still (controlled) */
  paused?: boolean;
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  /** The id of the block whose decision or tooltip is open. Controlled when defined (null = none) */
  expanded?: string | null;
  defaultExpanded?: string | null;
  onExpandedChange?: (id: string | null) => void;
  title?: string;
};
export function AgentLanes({ agents, tasks, onApprove, onReject, onOpen, paused, defaultPaused = false, onPausedChange, expanded, defaultExpanded = null, onExpandedChange, title = "Agents", ...props }: AgentLanesProps) {
  // Avatars and tool logos given as React nodes render in the staging box; the element gets their DOM nodes
  const nodes: [string, React.ReactNode][] = [];
  for (const a of agents) if (isNode(a.avatar)) nodes.push([`avatar:${a.id}`, a.avatar]);
  for (const t of tasks) t.tools?.slice(0, 3).forEach((tool, k) => isNode(tool) && nodes.push([`tool:${t.id}:${k}`, tool]));
  const { stage, els } = useStaged(nodes);
  const elAgents = React.useMemo(() => agents.map((a) => (isNode(a.avatar) ? { ...a, avatar: els[`avatar:${a.id}`] } : a)) as ElementAgent[], [agents, els]);
  const elTasks = React.useMemo(
    () =>
      tasks.map((t) => (t.tools ? { ...t, tools: t.tools.slice(0, 3).map((tool, k) => (isNode(tool) ? els[`tool:${t.id}:${k}`] : tool)).filter((x): x is Element => x instanceof Element) } : t)) as ElementTask[],
    [tasks, els],
  );
  // Handlers get the task back as the app gave it (with its React nodes), carrying the status the element shows
  const back = (t: ElementTask): LaneTask => {
    const mine = tasks.find((x) => x.id === t.id);
    return mine ? { ...t, tools: mine.tools } : (t as LaneTask);
  };
  const p = useControlled(paused, defaultPaused, onPausedChange);
  const x = useControlled(expanded, defaultExpanded, onExpandedChange);
  return h(React.Fragment, null, stage, h(RawAgentLanes, {
    ...props,
    heading: title,
    agents: elAgents,
    tasks: elTasks,
    onApprove: onApprove ? (t: ElementTask) => onApprove(back(t)) : undefined,
    onReject: onReject ? (t: ElementTask) => onReject(back(t)) : undefined,
    openable: !!onOpen,
    paused: p.value,
    expanded: x.value,
    onTcPausedChange: (e: CustomEvent<LanesPausedChange>) => p.handler(e.detail.paused, e),
    onTcExpandedChange: (e: CustomEvent<LanesExpandedChange>) => x.handler(e.detail.expanded, e),
    onTcOpen: (e: CustomEvent<LanesOpen>) => onOpen?.(back(e.detail.task)),
  }));
}
