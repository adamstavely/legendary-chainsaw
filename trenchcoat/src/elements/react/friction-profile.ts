import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFrictionProfile, type FrictionModeChange } from "../friction-profile";
import { h, useControlled } from "./internal";

export type { FrictionChange, FrictionMode, FrictionModeChange, FrictionSafeguard, FrictionState, FrictionTone } from "../friction-profile";
export { FRICTION_MODES, frictionChanges, frictionStateOf } from "../friction-profile";

const RawFrictionProfile = createComponent({
  tagName: "tc-friction-profile",
  elementClass: TcFrictionProfile,
  react: React,
  events: {
    onTcModeChange: "tc-mode-change" as EventName<CustomEvent<FrictionModeChange>>,
  },
});
type RawFrictionProfileProps = React.ComponentProps<typeof RawFrictionProfile>;
type Wrapped = "heading" | "mode" | "onTcModeChange";
export type FrictionProfileProps = Omit<RawFrictionProfileProps, Wrapped> & {
  /** The heading, and the region's name */
  title?: string;
  /** The id of the mode in force. Controlled when defined: Apply only reports through onModeChange, and you pass the
   *  new mode (with `reason` and `until`) back. Otherwise the component applies it, starting from `defaultMode` */
  mode?: string;
  /** The mode in force at first, when uncontrolled (default "standard") */
  defaultMode?: string;
  /** Apply was pressed: the new mode, the one before, the reason and end time it asked for, and what changes */
  onModeChange?: (change: FrictionModeChange) => void;
};

export function FrictionProfile({ title, mode, defaultMode, onModeChange, ...props }: FrictionProfileProps) {
  const own = useControlled<string>(mode, defaultMode ?? "standard", undefined);
  return h(RawFrictionProfile, {
    ...props,
    heading: title ?? "Friction profile",
    mode: own.value,
    onTcModeChange: (e: CustomEvent<FrictionModeChange>) => {
      own.handler(e.detail.mode, e);
      onModeChange?.(e.detail);
    },
  });
}
