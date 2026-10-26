import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcProgressTracker, type ProgressDoneChange, type ProgressStep as ProgressStepData } from "../progress-tracker";
import { h, isNode, useStaged } from "./internal";

/** A step: the icon may be a React node */
export type ProgressStep = Omit<ProgressStepData, "icon"> & {
  /** Small icon on the right, e.g. the app the step belongs to */
  icon?: React.ReactNode;
};

const RawProgressTracker = createComponent({
  tagName: "tc-progress-tracker",
  elementClass: TcProgressTracker,
  react: React,
  events: { onTcDoneChange: "tc-done-change" as EventName<CustomEvent<ProgressDoneChange>> },
});
type RawProgressTrackerProps = React.ComponentProps<typeof RawProgressTracker>;
export type ProgressTrackerProps = Omit<RawProgressTrackerProps, "heading" | "steps" | "done" | "defaultDone" | "onChange" | "onTcDoneChange"> & {
  title?: string;
  /** The checklist. Each step's `done` flag is where it starts; when the flags change, the tracker follows them */
  steps: ProgressStep[];
  /** Ids of the ticked steps. Controlled when defined – pair it with `onDoneChange` */
  done?: string[];
  /** Ids ticked on mount when `done` isn't controlled – defaults to the steps marked `done` */
  defaultDone?: string[];
  /** Called with the ticked ids whenever a step is ticked or cleared */
  onDoneChange?: (done: string[]) => void;
  /** Called with every step and its new `done` flag whenever a step is ticked or cleared */
  onChange?: (steps: ProgressStep[]) => void;
};

export function ProgressTracker({ title = "Getting started", steps, done, defaultDone, onDoneChange, onChange, ...props }: ProgressTrackerProps) {
  const { stage, els } = useStaged(steps.filter((s) => isNode(s.icon)).map((s) => [s.id, s.icon]));
  const data = React.useMemo(() => steps.map((s) => (isNode(s.icon) ? { ...s, icon: els[s.id] } : s)) as ProgressStepData[], [steps, els]);
  const [initial] = React.useState(defaultDone);
  return h(React.Fragment, null, stage, h(RawProgressTracker, {
    ...props,
    heading: title,
    steps: data,
    done,
    defaultDone: initial,
    onTcDoneChange: (e: CustomEvent<ProgressDoneChange>) => {
      if (done !== undefined) e.preventDefault();
      const next = new Set(e.detail.done);
      onDoneChange?.(e.detail.done);
      onChange?.(steps.map((s) => ({ ...s, done: next.has(s.id) })));
    },
  }));
}
