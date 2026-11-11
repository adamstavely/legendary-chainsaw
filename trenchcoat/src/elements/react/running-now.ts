import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRunningNow, type RunningNowAction, type RunningNowOpenChange, type RunningTask, type RunningTaskAction } from "../running-now";
import { h, useControlled } from "./internal";

export type { RunningNowAction, RunningNowLabels, RunningTask, RunningTaskStatus } from "../running-now";

const RawRunningNow = createComponent({
  tagName: "tc-running-now",
  elementClass: TcRunningNow,
  react: React,
  events: {
    onTcTaskAction: "tc-task-action" as EventName<CustomEvent<RunningTaskAction>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<RunningNowOpenChange>>,
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
  /** Review, Stop or Open was chosen on a task; return false to keep the panel open */
  onTaskAction?: (action: RunningNowAction, task: RunningTask) => boolean | void;
};
type Wrapped = keyof RunningNowOwnProps | "heading" | "onTcTaskAction" | "onTcOpenChange" | "children";
export type RunningNowProps = Omit<RawProps, Wrapped> & RunningNowOwnProps;

export function RunningNow({ title, open, defaultOpen = false, onOpenChange, onTaskAction, ...props }: RunningNowProps) {
  const o = useControlled(open, defaultOpen, onOpenChange);
  return h(RawRunningNow, {
    ...props,
    heading: title ?? "Running now",
    open: o.value,
    onTcOpenChange: (e: CustomEvent<RunningNowOpenChange>) => o.handler(e.detail.open, e),
    onTcTaskAction: (e: CustomEvent<RunningTaskAction>) => {
      if (onTaskAction?.(e.detail.action, e.detail.task) === false) e.preventDefault();
    },
  });
}
