import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcAssigneePicker, type AssigneePickerValueChange, type AssigneeValue } from "../assignee-picker";
import { h, useControlled } from "./internal";

export type { AssigneePerson, AssigneePickerLabels, AssigneePickerValueChange, AssigneeTeam, AssigneeValue } from "../assignee-picker";
export { assigneeInitials, defaultAssigneePickerLabels } from "../assignee-picker";

const RawAssigneePicker = createComponent({
  tagName: "tc-assignee-picker",
  elementClass: TcAssigneePicker,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<AssigneePickerValueChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawAssigneePicker>;
type Owned = "value" | "defaultValue" | "onTcValueChange" | "children";
export type AssigneePickerProps = Omit<RawProps, Owned> & {
  /** Who has it – controlled when given (null for unassigned) */
  value?: AssigneeValue | null;
  /** The assignee on mount when `value` isn't controlled */
  defaultValue?: AssigneeValue | null;
  /** An assignee was picked, or Unassign */
  onValueChange?: (value: AssigneeValue | null) => void;
};

export function AssigneePicker({ value, defaultValue = null, onValueChange, ...props }: AssigneePickerProps) {
  const v = useControlled<AssigneeValue | null>(value, defaultValue, onValueChange);
  return h(RawAssigneePicker, {
    ...props,
    value: v.value,
    onTcValueChange: (e: CustomEvent<AssigneePickerValueChange>) => v.handler(e.detail.value, e),
  });
}
