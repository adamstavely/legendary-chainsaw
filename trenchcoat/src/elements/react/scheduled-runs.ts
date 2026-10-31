import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcScheduledRuns, type ScheduledPlacement, type ScheduledPlacementsChange } from "../scheduled-runs";
import { h, useControlled } from "./internal";

export type { ScheduledPlacement, ScheduledPlacementsChange, ScheduledRunsLabels, ScheduledSession, ScheduledTask } from "../scheduled-runs";
export { defaultScheduledRunsLabels, movePlacement, planRuns } from "../scheduled-runs";

const RawScheduledRuns = createComponent({
  tagName: "tc-scheduled-runs",
  elementClass: TcScheduledRuns,
  react: React,
  events: { onTcPlacementsChange: "tc-placements-change" as EventName<CustomEvent<ScheduledPlacementsChange>> },
});
type RawProps = React.ComponentProps<typeof RawScheduledRuns>;
type Owned = "heading" | "placements" | "onTcPlacementsChange" | "children";
export type ScheduledRunsProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Scheduled runs" */
  title?: string;
  /** Where each task goes – controlled when given */
  placements?: ScheduledPlacement[];
  /** Where each task goes on mount when `placements` isn't controlled; by default `planRuns` decides */
  defaultPlacements?: ScheduledPlacement[];
  /** A task was moved */
  onPlacementsChange?: (placements: ScheduledPlacement[], detail: ScheduledPlacementsChange) => void;
};

export function ScheduledRuns({ title, placements, defaultPlacements, onPlacementsChange, ...props }: ScheduledRunsProps) {
  const p = useControlled<ScheduledPlacement[] | undefined>(placements, defaultPlacements, undefined);
  return h(RawScheduledRuns, {
    ...props,
    heading: title ?? "Scheduled runs",
    placements: p.value,
    onTcPlacementsChange: (e: CustomEvent<ScheduledPlacementsChange>) => {
      p.handler(e.detail.placements, e);
      onPlacementsChange?.(e.detail.placements, e.detail);
    },
  });
}
