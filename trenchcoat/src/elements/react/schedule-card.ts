import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcScheduleCard, type ScheduleRun, type ScheduleRunOpen, type SchedulePausedChange } from "../schedule-card";
import { h, useControlled } from "./internal";

export type { ScheduleCardLabels, ScheduleCardLabelsInput, SchedulePausedChange, ScheduleRun, ScheduleRunOpen, ScheduleRunStatus } from "../schedule-card";
export { defaultScheduleCardLabels, scheduleCountdown } from "../schedule-card";

const RawScheduleCard = createComponent({
  tagName: "tc-schedule-card",
  elementClass: TcScheduleCard,
  react: React,
  events: {
    onTcRunNow: "tc-run-now" as EventName<CustomEvent<Record<string, never>>>,
    onTcPausedChange: "tc-paused-change" as EventName<CustomEvent<SchedulePausedChange>>,
    onTcEdit: "tc-edit" as EventName<CustomEvent<Record<string, never>>>,
    onTcRunOpen: "tc-run-open" as EventName<CustomEvent<ScheduleRunOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawScheduleCard>;
type Owned = "heading" | "paused" | "onTcRunNow" | "onTcPausedChange" | "onTcEdit" | "onTcRunOpen" | "children";
export type ScheduleCardProps = Omit<RawProps, Owned> & {
  /** The task's name, and the card's heading */
  title?: string;
  /** Paused – controlled when given */
  paused?: boolean;
  /** Paused on mount when `paused` isn't controlled */
  defaultPaused?: boolean;
  /** Pause or Resume was pressed */
  onPausedChange?: (paused: boolean) => void;
  /** Run now was pressed */
  onRunNow?: () => void;
  /** Edit was pressed */
  onEdit?: () => void;
  /** A run in the strip was opened */
  onRunOpen?: (id: string, run: ScheduleRun) => void;
};

export function ScheduleCard({ title, paused, defaultPaused = false, onPausedChange, onRunNow, onEdit, onRunOpen, ...props }: ScheduleCardProps) {
  const p = useControlled<boolean>(paused, defaultPaused, onPausedChange);
  return h(RawScheduleCard, {
    ...props,
    heading: title ?? "Scheduled task",
    paused: p.value,
    onTcPausedChange: (e: CustomEvent<SchedulePausedChange>) => p.handler(e.detail.paused, e),
    onTcRunNow: () => onRunNow?.(),
    onTcEdit: () => onEdit?.(),
    onTcRunOpen: (e: CustomEvent<ScheduleRunOpen>) => onRunOpen?.(e.detail.id, e.detail.run),
  });
}
