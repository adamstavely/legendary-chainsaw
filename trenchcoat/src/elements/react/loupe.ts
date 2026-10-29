import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcLoupe, type LoupeActiveChange, type LoupeFeatureChange, type LoupeSelect } from "../loupe";
import { h, useControlled } from "./internal";

export type { LoupeBreakpoint, LoupeComponentInfo, LoupeComponentMeta, LoupeFeature, LoupeLink, LoupeSelect } from "../loupe";

const RawLoupe = createComponent({
  tagName: "tc-loupe",
  elementClass: TcLoupe,
  react: React,
  events: {
    onTcActiveChange: "tc-active-change" as EventName<CustomEvent<LoupeActiveChange>>,
    onTcFeatureChange: "tc-feature-change" as EventName<CustomEvent<LoupeFeatureChange>>,
    onTcSelect: "tc-select" as EventName<CustomEvent<LoupeSelect>>,
  },
});
type RawProps = React.ComponentProps<typeof RawLoupe>;
type Owned = "heading" | "active" | "onTcActiveChange" | "onTcFeatureChange" | "onTcSelect" | "children";
export type LoupeProps = Omit<RawProps, Owned> & {
  /** The panel's heading */
  title?: string;
  /** Whether it's on – controlled when given */
  active?: boolean;
  /** Whether an uncontrolled Loupe starts on */
  defaultActive?: boolean;
  /** Turned on or off (the hotkey, Escape, Close, the start button) */
  onActiveChange?: (active: boolean) => void;
  /** Components, the ruler or layouts were switched; `event.preventDefault()` keeps the switch as it was */
  onFeatureChange?: (detail: LoupeFeatureChange, event: CustomEvent<LoupeFeatureChange>) => void;
  /** A component was picked in the panel */
  onComponentSelect?: (detail: LoupeSelect) => void;
};

export function Loupe({ title, active, defaultActive = false, onActiveChange, onFeatureChange, onComponentSelect, ...props }: LoupeProps) {
  const a = useControlled<boolean>(active, defaultActive, onActiveChange);
  return h(RawLoupe, {
    ...props,
    heading: title ?? "Loupe",
    active: a.value,
    onTcActiveChange: (e: CustomEvent<LoupeActiveChange>) => a.handler(e.detail.active, e),
    onTcFeatureChange: (e: CustomEvent<LoupeFeatureChange>) => onFeatureChange?.(e.detail, e),
    onTcSelect: (e: CustomEvent<LoupeSelect>) => onComponentSelect?.(e.detail),
  });
}
