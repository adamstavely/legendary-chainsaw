import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTaskBoard, type Task, type TaskBoardTasksChange, type TaskStatus as ElementStatus } from "../task-board";
import { h, isNode, useControlled, useStaged } from "./internal";

export type { Task, TaskBoardTasksChange, TaskChangeKind, TaskLabel, TaskPerson } from "../task-board";
export { taskPriorityNames } from "../task-board";

/** A column: its icon may be a React node */
export type TaskStatus = Omit<ElementStatus, "icon"> & { icon?: React.ReactNode };

const RawTaskBoard = createComponent({
  tagName: "tc-task-board",
  elementClass: TcTaskBoard,
  react: React,
  events: { onTcTasksChange: "tc-tasks-change" as EventName<CustomEvent<TaskBoardTasksChange>> },
});
type RawTaskBoardProps = React.ComponentProps<typeof RawTaskBoard>;
export type TaskBoardProps = Omit<RawTaskBoardProps, "tasks" | "statuses" | "onTcTasksChange" | "onChange"> & {
  /** The tasks (controlled) – pass `onTasksChange` with it. Leave undefined to start from `defaultTasks` */
  tasks?: Task[];
  /** The tasks to start from when uncontrolled */
  defaultTasks?: Task[];
  /** Called with all tasks after every change */
  onTasksChange?: (tasks: Task[]) => void;
  /** The columns, in order – an icon may be any React node */
  statuses: TaskStatus[];
  /** @deprecated Use `onTasksChange` (same arguments) */
  /** Any change to the tasks (added, edited, moved or deleted) – the same as `onTasksChange`, kept from the block */
  onChange?: (tasks: Task[]) => void;
};

const NO_TASKS: Task[] = [];

export function TaskBoard({ tasks, defaultTasks = NO_TASKS, onTasksChange, onChange, statuses, ...props }: TaskBoardProps) {
  const t = useControlled(tasks, defaultTasks, onTasksChange ?? onChange);
  const { stage, els } = useStaged(statuses.filter((s) => isNode(s.icon)).map((s) => [s.id, s.icon] as [string, React.ReactNode]));
  const columns = React.useMemo(
    () => statuses.map((s) => ({ ...s, icon: isNode(s.icon) ? els[s.id] : (s.icon as Element | undefined) })) as ElementStatus[],
    [statuses, els],
  );
  return h(
    React.Fragment,
    null,
    stage,
    h(RawTaskBoard, {
      ...props,
      tasks: t.value,
      statuses: columns,
      onTcTasksChange: (e: CustomEvent<TaskBoardTasksChange>) => t.handler(e.detail.tasks, e),
    }),
  );
}
