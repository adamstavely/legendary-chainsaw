import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRunningNow, type RunningNowNotify, type RunningNowNotifyChange, type RunningNowAction, type RunningNowOpenChange, type RunningTask, type RunningTaskAction } from "../running-now";
import { h, useControlled } from "./internal";

export type { RunningNowAction, RunningNowLabels, RunningNowNotify, RunningNowNotifyChange, RunningTask, RunningTaskStatus } from "../running-now";

const RawRunningNow = createComponent({
  tagName: "tc-running-now",
  elementClass: TcRunningNow,
  react: React,
  events: {
    onTcTaskAction: "tc-task-action" as EventName<CustomEvent<RunningTaskAction>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<RunningNowOpenChange>>,
    onTcNotifyChange: "tc-notify-change" as EventName<CustomEvent<RunningNowNotifyChange>>,
    onTcNotify: "tc-notify" as EventName<CustomEvent<RunningNowNotify>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRunningNow>;

export type RunningNowOwnProps = {
  /** The panel's title – "Running now" by default */
  title?: string;
  /** Whether the panel is open. Controlled when defined */
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
  onNotifyChange?: (notify: string[], change: RunningNowNotifyChange) => void;
  /** A watched task finished */
  onNotify?: (task: RunningTask, status: "done" | "failed", channels?: string[]) => void;
  /** Review, Stop or Open was chosen on a task; return false to keep the panel open */
  onTaskAction?: (action: RunningNowAction, task: RunningTask) => boolean | void;
};
type Wrapped = keyof RunningNowOwnProps | "heading" | "onTcTaskAction" | "onTcOpenChange" | "onTcNotifyChange" | "onTcNotify" | "children";
export type RunningNowProps = Omit<RawProps, Wrapped> & RunningNowOwnProps;

const NO_IDS: string[] = [];
const NO_VIA: Record<string, string[]> = {};

export function RunningNow({ title, open, defaultOpen = false, onOpenChange, notify, defaultNotify = NO_IDS, notifyVia, defaultNotifyVia = NO_VIA, onNotifyChange, onNotify, onTaskAction, ...props }: RunningNowProps) {
  const o = useControlled(open, defaultOpen, onOpenChange);
  const change = React.useRef<RunningNowNotifyChange | null>(null);
  const n = useControlled<string[]>(notify, defaultNotify, onNotifyChange ? (next) => change.current && onNotifyChange(next, change.current) : undefined);
  const via = useControlled<Record<string, string[]>>(notifyVia, defaultNotifyVia, undefined);
  return h(RawRunningNow, {
    ...props,
    heading: title ?? "Running now",
    open: o.value,
    notify: n.value,
    notifyVia: via.value,
    onTcNotifyChange: (e: CustomEvent<RunningNowNotifyChange>) => {
      change.current = e.detail;
      via.handler(e.detail.notifyVia, e);
      n.handler(e.detail.notify, e);
    },
    onTcNotify: (e: CustomEvent<RunningNowNotify>) => onNotify?.(e.detail.task, e.detail.status, e.detail.channels),
    onTcOpenChange: (e: CustomEvent<RunningNowOpenChange>) => o.handler(e.detail.open, e),
    onTcTaskAction: (e: CustomEvent<RunningTaskAction>) => {
      if (onTaskAction?.(e.detail.action, e.detail.task) === false) e.preventDefault();
    },
  });
}
