import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcDelegateBoard,
  type DelegateAgent as ElementAgent,
  type DelegateAssign,
  type DelegateMode,
  type DelegateModeChange,
  type DelegateTask as ElementTask,
} from "../delegate-board";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { DelegateMode } from "../delegate-board";
/** React nodes in place of elements: avatars and tool logos */
export type DelegateAgent = Omit<ElementAgent, "avatar"> & { avatar?: React.ReactNode };
export type DelegateTask = Omit<ElementTask, "tools"> & { tools?: React.ReactNode[] };

const RawDelegateBoard = createComponent({
  tagName: "tc-delegate-board",
  elementClass: TcDelegateBoard,
  react: React,
  events: {
    onTcAssign: "tc-assign" as EventName<CustomEvent<DelegateAssign>>,
    onTcModeChange: "tc-mode-change" as EventName<CustomEvent<DelegateModeChange>>,
  },
});
type RawDelegateBoardProps = React.ComponentProps<typeof RawDelegateBoard>;
export type DelegateBoardProps = Omit<RawDelegateBoardProps, "agents" | "tasks" | "mode" | "heading" | "onTcAssign" | "onTcModeChange"> & {
  agents: DelegateAgent[];
  tasks: DelegateTask[];
  /**
   * A drop, a keyboard pick or Auto. The board moves the task at once and keeps it there until `tasks` gives that task
   * another agent – so `tasks` stays the source of truth, whether you handle the move or only listen to it
   */
  onAssign?: (taskId: string, agentId: string | null) => void;
  /** Auto hands every unassigned task to the least busy agent on its own; Manual waits for a drag. Controlled when defined */
  mode?: DelegateMode;
  /** The mode on mount when `mode` isn't controlled */
  defaultMode?: DelegateMode;
  /** Called with the new mode, controlled or not */
  onModeChange?: (mode: DelegateMode) => void;
  title?: string;
};

export function DelegateBoard({ agents, tasks, onAssign, mode, defaultMode = "manual", onModeChange, title = "Delegate", ...props }: DelegateBoardProps) {
  const nodes: [string, React.ReactNode][] = [];
  for (const a of agents) if (isNode(a.avatar)) nodes.push([`avatar:${a.id}`, a.avatar]);
  for (const t of tasks) t.tools?.slice(0, 3).forEach((tool, k) => isNode(tool) && nodes.push([`tool:${t.id}:${k}`, tool]));
  const { stage, els } = useStaged(nodes);
  const agentEls = React.useMemo(
    () => agents.map((a) => ({ ...a, avatar: isNode(a.avatar) ? els[`avatar:${a.id}`] : a.avatar == null || a.avatar === false ? undefined : typeof a.avatar === "number" ? String(a.avatar) : a.avatar })) as ElementAgent[],
    [agents, els],
  );
  const taskEls = React.useMemo(
    () =>
      tasks.map((t) => (t.tools ? { ...t, tools: t.tools.slice(0, 3).map((tool, k) => (isNode(tool) ? els[`tool:${t.id}:${k}`] : tool)).filter((x): x is Element => x instanceof Element) } : t)) as ElementTask[],
    [tasks, els],
  );
  const m = useControlled(mode, defaultMode, onModeChange);
  return h(React.Fragment, null, stage, h(RawDelegateBoard, {
    ...props,
    agents: agentEls,
    tasks: taskEls,
    heading: title,
    mode: m.value,
    onTcAssign: (e: CustomEvent<DelegateAssign>) => onAssign?.(e.detail.taskId, e.detail.agentId),
    onTcModeChange: (e: CustomEvent<DelegateModeChange>) => m.handler(e.detail.mode, e),
  }));
}
