import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcProjectCard, type ProjectOption as ElementOption, type ProjectTask } from "../project-card";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { ProjectMember, ProjectTask, ProjectTone } from "../project-card";
/** The status icon may be a React node */
export type ProjectOption = Omit<ElementOption, "icon"> & { icon?: React.ReactNode };

const RawProjectCard = createComponent({
  tagName: "tc-project-card",
  elementClass: TcProjectCard,
  react: React,
  events: {
    onTcTasksChange: "tc-tasks-change" as EventName<CustomEvent<{ tasks: ProjectTask[] }>>,
    onTcStatusChange: "tc-status-change" as EventName<CustomEvent<{ status: string }>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<{ open: boolean }>>,
    onTcAction: "tc-action" as EventName<CustomEvent<null>>,
  },
});
type RawProjectCardProps = React.ComponentProps<typeof RawProjectCard>;
export type ProjectCardProps = Omit<
  RawProjectCardProps,
  "heading" | "tasks" | "statuses" | "status" | "open" | "hint" | "actionLabel" | "onTcTasksChange" | "onTcStatusChange" | "onTcOpenChange" | "onTcAction"
> & {
  /** The project's name */
  title: string;
  /**
   * Subtasks – one ring segment and one row each (controlled): ticks are only reported through `onTasksChange`, so
   * pass the new list back. Use `defaultTasks` to let the card keep the ticks itself
   */
  tasks?: ProjectTask[];
  /** Starting subtasks when `tasks` isn't controlled */
  defaultTasks?: ProjectTask[];
  /** Called with the full list after a subtask was ticked or unticked */
  onTasksChange?: (tasks: ProjectTask[]) => void;
  /** Options of the status picker */
  statuses?: ProjectOption[];
  /** The chosen status id (controlled) */
  status?: string;
  /** Starting status id when `status` isn't controlled – defaults to the first option */
  defaultStatus?: string;
  /** Called with the id of the status picked */
  onStatusChange?: (id: string) => void;
  /** A button on the tray of the open card (Clean: in its last row), e.g. { label: "Open", onClick } */
  action?: { label: string; onClick: () => void };
  /** Replaces the line on the tray (Clean: in the last row) while nothing is hovered */
  hint?: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Whether the card starts unfolded when `open` isn't controlled */
  defaultOpen?: boolean;
  /** Called when the card opens or closes */
  onOpenChange?: (open: boolean) => void;
};

const NO_TASKS: ProjectTask[] = [];

export function ProjectCard({ title, tasks, defaultTasks = NO_TASKS, onTasksChange, statuses, status, defaultStatus, onStatusChange, action, hint, open, defaultOpen = false, onOpenChange, ...props }: ProjectCardProps) {
  const nodes: [string, React.ReactNode][] = [];
  if (isNode(hint)) nodes.push(["hint", hint]);
  for (const o of statuses ?? []) if (isNode(o.icon)) nodes.push([`status:${o.id}`, o.icon]);
  const { stage, els } = useStaged(nodes);
  const opts = React.useMemo(() => statuses?.map((o) => (isNode(o.icon) ? { ...o, icon: els[`status:${o.id}`] } : o)) as ElementOption[] | undefined, [statuses, els]);
  const t = useControlled(tasks, defaultTasks, onTasksChange);
  const s = useControlled<string | undefined>(status, defaultStatus, (id) => id !== undefined && onStatusChange?.(id));
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(React.Fragment, null, stage, h(RawProjectCard, {
    ...props,
    heading: title,
    tasks: t.value,
    ...(opts ? { statuses: opts } : {}),
    status: s.value,
    open: o.value,
    actionLabel: action?.label ?? "",
    hint: isNode(hint) ? els.hint : hint == null || hint === false || hint === true ? undefined : String(hint),
    onTcTasksChange: (e: CustomEvent<{ tasks: ProjectTask[] }>) => t.handler(e.detail.tasks, e),
    onTcStatusChange: (e: CustomEvent<{ status: string }>) => s.handler(e.detail.status, e),
    onTcOpenChange: (e: CustomEvent<{ open: boolean }>) => o.handler(e.detail.open, e),
    onTcAction: () => action?.onClick(),
  }));
}
