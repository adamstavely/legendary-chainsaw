import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcTeamFlagPicker, type TeamFlag, type TeamFlagValueChange } from "../team-flag-picker";
import { h, useControlled } from "./internal";

export type { TeamFlag, TeamFlagPickerLabels, TeamFlagValueChange } from "../team-flag-picker";
export { defaultTeamFlagPickerLabels } from "../team-flag-picker";

const RawTeamFlagPicker = createComponent({
  tagName: "tc-team-flag-picker",
  elementClass: TcTeamFlagPicker,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<TeamFlagValueChange>>,
    onTcManage: "tc-manage" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawTeamFlagPicker>;
type Owned = "value" | "defaultValue" | "onTcValueChange" | "children";
export type TeamFlagPickerProps = Omit<RawProps, Owned> & {
  /** The id of the file's flag, or null for none – controlled when given */
  value?: string | null;
  /** The flag on mount when `value` isn't controlled */
  defaultValue?: string | null;
  /** A flag was picked or cleared */
  onValueChange?: (value: string | null, flag: TeamFlag | null) => void;
};

export function TeamFlagPicker({ value, defaultValue = null, onValueChange, ...props }: TeamFlagPickerProps) {
  const v = useControlled<string | null>(value, defaultValue, undefined);
  return h(RawTeamFlagPicker, {
    ...props,
    value: v.value,
    onTcValueChange: (e: CustomEvent<TeamFlagValueChange>) => {
      v.handler(e.detail.value, e);
      onValueChange?.(e.detail.value, e.detail.flag);
    },
  });
}
