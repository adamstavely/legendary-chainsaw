import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBackgroundTasks, type BackgroundTask, type BackgroundTaskActionDetail, type BackgroundTasksClearDetail, type BackgroundTasksOpenChange } from "../background-tasks";
import { h, useControlled } from "./internal";

export type { BackgroundTask, BackgroundTaskKind, BackgroundTaskStatus, BackgroundTasksLayout } from "../background-tasks";

const RawBackgroundTasks = createComponent({
  tagName: "tc-background-tasks",
  elementClass: TcBackgroundTasks,
  react: React,
  events: {
    onTcTaskCancel: "tc-task-cancel" as EventName<CustomEvent<BackgroundTaskActionDetail>>,
    onTcTaskRetry: "tc-task-retry" as EventName<CustomEvent<BackgroundTaskActionDetail>>,
    onTcTaskOpen: "tc-task-open" as EventName<CustomEvent<BackgroundTaskActionDetail>>,
    onTcClearFinished: "tc-clear-finished" as EventName<CustomEvent<BackgroundTasksClearDetail>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<BackgroundTasksOpenChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawBackgroundTasks>;

/** What changed the list: an action and the task it touched (none for clear) */
export type BackgroundTasksChange = { action: "cancel" | "retry" | "clear"; task?: BackgroundTask; cleared?: BackgroundTask[] };

export type BackgroundTasksOwnProps = {
  /** The panel's title, and the start of the indicator's name – "Background tasks" by default */
  title?: string;
  /** The tasks. Controlled when defined: Cancel, Retry and Clear finished only report, and you update the list */
  tasks?: BackgroundTask[];
  /** The tasks when uncontrolled – the component applies Cancel, Retry and Clear finished itself */
  defaultTasks?: BackgroundTask[];
  /** Called with the list as it is after Cancel, Retry or Clear finished, and what happened */
  onTasksChange?: (tasks: BackgroundTask[], change: BackgroundTasksChange) => void;
  /** Cancel was chosen on a running or queued task */
  onCancel?: (task: BackgroundTask) => void;
  /** Retry was chosen on a failed task */
  onRetry?: (task: BackgroundTask) => void;
  /** Open was chosen on a done task; return false to stop a `result.href` link being followed */
  onOpen?: (task: BackgroundTask) => boolean | void;
  /** Clear finished was chosen, with the done and failed tasks it removes */
  onClearFinished?: (cleared: BackgroundTask[]) => void;
  /** Whether the indicator's panel is open. Controlled when defined */
  open?: boolean;
  /** Whether the panel starts open when uncontrolled */
  defaultOpen?: boolean;
  /** The panel opened or closed */
  onOpenChange?: (open: boolean) => void;
};
type Wrapped = keyof BackgroundTasksOwnProps | "heading" | "onTcTaskCancel" | "onTcTaskRetry" | "onTcTaskOpen" | "onTcClearFinished" | "onTcOpenChange" | "children";
export type BackgroundTasksProps = Omit<RawProps, Wrapped> & BackgroundTasksOwnProps;

const NONE: BackgroundTask[] = [];

export function BackgroundTasks({ title, tasks, defaultTasks = NONE, onTasksChange, onCancel, onRetry, onOpen, onClearFinished, open, defaultOpen = false, onOpenChange, ...props }: BackgroundTasksProps) {
  const last = React.useRef<BackgroundTasksChange>({ action: "clear" });
  const report = React.useCallback((next: BackgroundTask[]) => onTasksChange?.(next, last.current), [onTasksChange]);
  const t = useControlled<BackgroundTask[]>(tasks, defaultTasks, report);
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawBackgroundTasks, {
    ...props,
    heading: title ?? "Background tasks",
    tasks: t.value,
    open: o.value,
    onTcOpenChange: (e: CustomEvent<BackgroundTasksOpenChange>) => o.handler(e.detail.open, e),
    onTcTaskCancel: (e: CustomEvent<BackgroundTaskActionDetail>) => {
      onCancel?.(e.detail.task);
      last.current = { action: "cancel", task: e.detail.task };
      t.handler(e.detail.tasks, e);
    },
    onTcTaskRetry: (e: CustomEvent<BackgroundTaskActionDetail>) => {
      onRetry?.(e.detail.task);
      last.current = { action: "retry", task: e.detail.task };
      t.handler(e.detail.tasks, e);
    },
    onTcClearFinished: (e: CustomEvent<BackgroundTasksClearDetail>) => {
      onClearFinished?.(e.detail.cleared);
      last.current = { action: "clear", cleared: e.detail.cleared };
      t.handler(e.detail.tasks, e);
    },
    onTcTaskOpen: (e: CustomEvent<BackgroundTaskActionDetail>) => {
      if (onOpen?.(e.detail.task) === false) e.preventDefault();
    },
  });
}
