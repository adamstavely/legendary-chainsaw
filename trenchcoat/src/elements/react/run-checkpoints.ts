import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRunCheckpoints, type RunCheckpoint, type RunCheckpointsRestore, type RunCheckpointsSelectedChange } from "../run-checkpoints";
import { h, useControlled } from "./internal";

export type { RunCheckpoint, RunCheckpointCapture, RunCheckpointStatus, RunCheckpointsStatus } from "../run-checkpoints";

const RawRunCheckpoints = createComponent({
  tagName: "tc-run-checkpoints",
  elementClass: TcRunCheckpoints,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<RunCheckpointsSelectedChange>>,
    onTcRestore: "tc-restore" as EventName<CustomEvent<RunCheckpointsRestore>>,
  },
});
type RawRunCheckpointsProps = React.ComponentProps<typeof RawRunCheckpoints>;
type Wrapped = "checkpoints" | "heading" | "selected" | "restorer" | "onTcSelectedChange" | "onTcRestore";
export type RunCheckpointsProps = Omit<RawRunCheckpointsProps, Wrapped> & {
  /** The checkpoints, oldest first – one before each step of the run */
  checkpoints: RunCheckpoint[];
  /** The run's goal, shown as the heading */
  title?: string;
  /** The picked checkpoint's id. Controlled when defined (null = nothing picked); otherwise the component keeps it,
   *  starting at `defaultSelected` */
  selected?: string | null;
  /** First pick when uncontrolled */
  defaultSelected?: string | null;
  /** Called with the picked checkpoint's id, or null when the pick is cleared */
  onSelectedChange?: (id: string | null, checkpoint?: RunCheckpoint) => void;
  /** "Go back to step N" pressed: the checkpoint, the note for the agent ("" when none) and the ids of the steps it
   *  discards. May return a promise – the button waits, and says so if it rejects */
  onRestore?: (checkpointId: string, instruction: string, discarded: string[]) => void | Promise<unknown>;
};

export function RunCheckpoints({ title, selected, defaultSelected = null, onSelectedChange, onRestore, ...props }: RunCheckpointsProps) {
  const latest = React.useRef<RunCheckpoint | undefined>(undefined);
  const report = React.useCallback((id: string | null) => onSelectedChange?.(id, latest.current), [onSelectedChange]);
  const pick = useControlled<string | null>(selected, defaultSelected, report);
  // The discarded ids come with the event; the restorer is what may return a promise
  const discarded = React.useRef<string[]>([]);
  return h(RawRunCheckpoints, {
    ...props,
    heading: title ?? "",
    selected: pick.value,
    restorer: onRestore ? (id: string, instruction: string) => onRestore(id, instruction, discarded.current) : undefined,
    onTcSelectedChange: (e: CustomEvent<RunCheckpointsSelectedChange>) => {
      latest.current = e.detail.checkpoint;
      pick.handler(e.detail.selected, e);
    },
    onTcRestore: (e: CustomEvent<RunCheckpointsRestore>) => {
      discarded.current = e.detail.discarded;
    },
  });
}
