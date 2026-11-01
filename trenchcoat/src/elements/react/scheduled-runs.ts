import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcScheduledRuns, type ScheduledModeChange, type ScheduledPlacement, type ScheduledPlacementsChange, type ScheduledRunsMode } from "../scheduled-runs";
import { h, useControlled } from "./internal";

export type { ScheduledModeChange, ScheduledPlacement, ScheduledPlacementsChange, ScheduledRunsLabels, ScheduledRunsLayout, ScheduledRunsMode, ScheduledSession, ScheduledTask } from "../scheduled-runs";
export { defaultScheduledRunsLabels, movePlacement, planRuns } from "../scheduled-runs";

const RawScheduledRuns = createComponent({
  tagName: "tc-scheduled-runs",
  elementClass: TcScheduledRuns,
  react: React,
  events: {
    onTcPlacementsChange: "tc-placements-change" as EventName<CustomEvent<ScheduledPlacementsChange>>,
    onTcModeChange: "tc-mode-change" as EventName<CustomEvent<ScheduledModeChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawScheduledRuns>;
type Owned = "heading" | "placements" | "mode" | "onTcPlacementsChange" | "onTcModeChange" | "children";
export type ScheduledRunsProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Scheduled runs" */
  title?: string;
  /** Where each task goes – controlled when given */
  placements?: ScheduledPlacement[];
  /** Where each task goes on mount when `placements` isn't controlled; by default `planRuns` decides */
  defaultPlacements?: ScheduledPlacement[];
  /** A task was moved */
  onPlacementsChange?: (placements: ScheduledPlacement[], detail: ScheduledPlacementsChange) => void;
  /** "auto" or "manual" – controlled when given */
  mode?: ScheduledRunsMode;
  /** The mode on mount when `mode` isn't controlled; by default "manual" */
  defaultMode?: ScheduledRunsMode;
  /** Auto or Manual was picked */
  onModeChange?: (mode: ScheduledRunsMode) => void;
};

export function ScheduledRuns({ title, placements, defaultPlacements, onPlacementsChange, mode, defaultMode = "manual", onModeChange, ...props }: ScheduledRunsProps) {
  const p = useControlled<ScheduledPlacement[] | undefined>(placements, defaultPlacements, undefined);
  const m = useControlled<ScheduledRunsMode>(mode, defaultMode, onModeChange);
  return h(RawScheduledRuns, {
    ...props,
    heading: title ?? "Scheduled runs",
    placements: p.value,
    mode: m.value,
    onTcModeChange: (e: CustomEvent<ScheduledModeChange>) => m.handler(e.detail.mode, e),
    onTcPlacementsChange: (e: CustomEvent<ScheduledPlacementsChange>) => {
      p.handler(e.detail.placements, e);
      onPlacementsChange?.(e.detail.placements, e.detail);
    },
  });
}
