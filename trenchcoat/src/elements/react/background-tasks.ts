import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBackgroundTasks, type BackgroundTasksNotify, type BackgroundTasksNotifyChange, type BackgroundTask, type BackgroundTaskActionDetail, type BackgroundTasksClearDetail, type BackgroundTasksOpenChange } from "../background-tasks";
import { h, useControlled } from "./internal";

export type { BackgroundTask, BackgroundTaskKind, BackgroundTaskStatus, BackgroundTasksLayout, BackgroundTasksNotify, BackgroundTasksNotifyChange } from "../background-tasks";

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
    onTcNotifyChange: "tc-notify-change" as EventName<CustomEvent<BackgroundTasksNotifyChange>>,
    onTcNotify: "tc-notify" as EventName<CustomEvent<BackgroundTasksNotify>>,
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
  /** The watched tasks (with `notifiable`). Controlled when defined */
  notify?: string[];
  /** The watched tasks when uncontrolled */
  defaultNotify?: string[];
  /** The channels chosen per watched task (with `notifyChannels`). Controlled when defined */
  notifyVia?: Record<string, string[]>;
  /** The channels per task when uncontrolled */
  defaultNotifyVia?: Record<string, string[]>;
  /** The bell or a channel was switched – the watched tasks as they are now, and the change */
  onNotifyChange?: (notify: string[], change: BackgroundTasksNotifyChange) => void;
  /** A watched task finished */
  onNotify?: (task: BackgroundTask, status: "done" | "failed", channels?: string[]) => void;
};
type Wrapped = keyof BackgroundTasksOwnProps | "heading" | "onTcTaskCancel" | "onTcTaskRetry" | "onTcTaskOpen" | "onTcClearFinished" | "onTcOpenChange" | "onTcNotifyChange" | "onTcNotify" | "children";
export type BackgroundTasksProps = Omit<RawProps, Wrapped> & BackgroundTasksOwnProps;

const NONE: BackgroundTask[] = [];

const NO_IDS: string[] = [];
const NO_VIA: Record<string, string[]> = {};

export function BackgroundTasks({ title, tasks, defaultTasks = NONE, onTasksChange, onCancel, onRetry, onOpen, onClearFinished, open, defaultOpen = false, onOpenChange, notify, defaultNotify = NO_IDS, notifyVia, defaultNotifyVia = NO_VIA, onNotifyChange, onNotify, ...props }: BackgroundTasksProps) {
  const last = React.useRef<BackgroundTasksChange>({ action: "clear" });
  const report = React.useCallback((next: BackgroundTask[]) => onTasksChange?.(next, last.current), [onTasksChange]);
  const t = useControlled<BackgroundTask[]>(tasks, defaultTasks, report);
  const o = useControlled(open, defaultOpen, onOpenChange);
  const change = React.useRef<BackgroundTasksNotifyChange | null>(null);
  const n = useControlled<string[]>(notify, defaultNotify, onNotifyChange ? (next) => change.current && onNotifyChange(next, change.current) : undefined);
  const via = useControlled<Record<string, string[]>>(notifyVia, defaultNotifyVia, undefined);
  return h(RawBackgroundTasks, {
    ...props,
    heading: title ?? "Background tasks",
    tasks: t.value,
    open: o.value,
    notify: n.value,
    notifyVia: via.value,
    onTcNotifyChange: (e: CustomEvent<BackgroundTasksNotifyChange>) => {
      change.current = e.detail;
      via.handler(e.detail.notifyVia, e);
      n.handler(e.detail.notify, e);
    },
    onTcNotify: (e: CustomEvent<BackgroundTasksNotify>) => onNotify?.(e.detail.task, e.detail.status, e.detail.channels),
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
