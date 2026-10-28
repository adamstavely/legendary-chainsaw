import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRoutineForm, emptyRoutine, type RoutineDismiss, type RoutineDraft, type RoutineOpenRoutines, type RoutineSubmit, type RoutineValueChange } from "../routine-form";
import { h, useControlled } from "./internal";

export type { RoutineDraft, RoutineFirstRun, RoutineFrequency, RoutineLabels, RoutineNotify, RoutineSchedule, RoutineSubmit } from "../routine-form";
export { defaultRoutineLabels, emptyRoutine, nextRoutineRun, nextRoutineRuns } from "../routine-form";

const RawRoutineForm = createComponent({
  tagName: "tc-routine-form",
  elementClass: TcRoutineForm,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<RoutineValueChange>>,
    onTcSubmit: "tc-submit" as EventName<CustomEvent<RoutineSubmit>>,
    onTcDismiss: "tc-dismiss" as EventName<CustomEvent<RoutineDismiss>>,
    onTcOpenRoutines: "tc-open-routines" as EventName<CustomEvent<RoutineOpenRoutines>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRoutineForm>;
type Owned = "heading" | "value" | "defaultValue" | "onTcValueChange" | "onTcSubmit" | "onTcDismiss" | "onTcOpenRoutines" | "children";
export type RoutineFormProps = Omit<RawProps, Owned> & {
  /** The heading; by default "Create a routine", or "Edit routine" in edit mode */
  title?: string;
  /** The form's contents – controlled when given */
  value?: RoutineDraft;
  /** The contents on mount when `value` isn't controlled; by default an empty weekly routine */
  defaultValue?: RoutineDraft;
  /** A field changed; `next` is the whole draft */
  onValueChange?: (next: RoutineDraft) => void;
  /** Create routine (or Save routine) was pressed with the form filled in; return false to skip the announcement */
  onCreate?: (value: RoutineDraft, nextRun: number | null) => void | false;
  /** Dismiss was pressed */
  onDismiss?: (value: RoutineDraft) => void;
  /** The Routines link was used; return false to keep its link from opening */
  onOpenRoutines?: (href: string | null) => void | false;
};

export function RoutineForm({ title, value, defaultValue, onValueChange, onCreate, onDismiss, onOpenRoutines, ...props }: RoutineFormProps) {
  const [start] = React.useState(() => defaultValue ?? emptyRoutine());
  const v = useControlled<RoutineDraft>(value, start, onValueChange);
  return h(RawRoutineForm, {
    ...props,
    heading: title ?? "",
    value: v.value,
    onTcValueChange: (e: CustomEvent<RoutineValueChange>) => v.handler(e.detail.value, e),
    onTcSubmit: (e: CustomEvent<RoutineSubmit>) => {
      if (onCreate?.(e.detail.value, e.detail.nextRun) === false) e.preventDefault();
    },
    onTcDismiss: (e: CustomEvent<RoutineDismiss>) => onDismiss?.(e.detail.value),
    onTcOpenRoutines: (e: CustomEvent<RoutineOpenRoutines>) => {
      if (onOpenRoutines?.(e.detail.href) === false) e.preventDefault();
    },
  });
}
