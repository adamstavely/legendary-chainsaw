import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcBillingSchedule,
  type BillingCatalogItem,
  type BillingDuration,
  type BillingRepeat,
  type BillingScheduleLine,
  type BillingScheduleValue,
  type BillingTiming,
} from "../billing-schedule";
import { h, useControlled } from "./internal";

/* The React module's names */
export type Repeat = BillingRepeat;
export type Timing = BillingTiming;
export type ScheduleLine = BillingScheduleLine;
export type CatalogItem = BillingCatalogItem;
export type Schedule = BillingScheduleValue;
export type Duration = BillingDuration;

const defaultSeedLines: ScheduleLine[] = [{ id: "seed-1", kind: "product", name: "Set-up fee", repeat: "once", price: 4999, timing: "advance" }];

const RawBillingSchedule = createComponent({
  tagName: "tc-billing-schedule",
  elementClass: TcBillingSchedule,
  react: React,
  events: {
    onTcPhaseChange: "tc-phase-change" as EventName<CustomEvent<{ phase: string }>>,
    onTcStartChange: "tc-start-change" as EventName<CustomEvent<{ start: string }>>,
    onTcDurationChange: "tc-duration-change" as EventName<CustomEvent<{ duration: Duration }>>,
    onTcLinesChange: "tc-lines-change" as EventName<CustomEvent<{ lines: ScheduleLine[] }>>,
    onTcScheduleChange: "tc-schedule-change" as EventName<CustomEvent<Schedule>>,
  },
});
type RawBillingScheduleProps = React.ComponentProps<typeof RawBillingSchedule>;
type OwnProps = {
  title?: string;
  /** Phase name (controlled). Leave undefined and use `defaultPhase` to let the component keep it */
  phase?: string;
  defaultPhase?: string;
  onPhaseChange?: (phase: string) => void;
  /** Schedule lines (controlled) */
  lines?: ScheduleLine[];
  defaultLines?: ScheduleLine[];
  onLinesChange?: (lines: ScheduleLine[]) => void;
  /** Start date, yyyy-mm-dd (controlled) */
  start?: string;
  defaultStart?: string;
  onStartChange?: (start: string) => void;
  /** Phase length (controlled) */
  duration?: Duration;
  defaultDuration?: Duration;
  onDurationChange?: (duration: Duration) => void;
  /** Called with the full schedule after every change the user makes (not on mount) */
  onChange?: (schedule: Schedule) => void;
};
export type BillingScheduleProps = Omit<RawBillingScheduleProps, keyof OwnProps | "heading" | "onTcPhaseChange" | "onTcStartChange" | "onTcDurationChange" | "onTcLinesChange" | "onTcScheduleChange"> & OwnProps;

export function BillingSchedule({
  title = "Create a billing schedule",
  phase,
  defaultPhase = "Build-out phase",
  onPhaseChange,
  lines,
  defaultLines = defaultSeedLines,
  onLinesChange,
  start,
  defaultStart = "2026-01-01",
  onStartChange,
  duration,
  defaultDuration = "milestone",
  onDurationChange,
  onChange,
  ...props
}: BillingScheduleProps) {
  const p = useControlled(phase, defaultPhase, onPhaseChange);
  const l = useControlled(lines, defaultLines, onLinesChange);
  const s = useControlled(start, defaultStart, onStartChange);
  const d = useControlled(duration, defaultDuration, onDurationChange);
  // A new onChange identity on every render is not a change
  const report = React.useRef(onChange);
  React.useEffect(() => {
    report.current = onChange;
  });
  return h(RawBillingSchedule, {
    ...props,
    heading: title,
    phase: p.value,
    lines: l.value,
    start: s.value,
    duration: d.value,
    onTcPhaseChange: (e: CustomEvent<{ phase: string }>) => p.handler(e.detail.phase, e),
    onTcLinesChange: (e: CustomEvent<{ lines: ScheduleLine[] }>) => l.handler(e.detail.lines, e),
    onTcStartChange: (e: CustomEvent<{ start: string }>) => s.handler(e.detail.start, e),
    onTcDurationChange: (e: CustomEvent<{ duration: Duration }>) => d.handler(e.detail.duration, e),
    onTcScheduleChange: (e: CustomEvent<Schedule>) => report.current?.(e.detail),
  });
}
