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
type Owned = "heading" | "active" | "showComponents" | "showRuler" | "showLayouts" | "onTcActiveChange" | "onTcFeatureChange" | "onTcSelect" | "children";
export type LoupeProps = Omit<RawProps, Owned> & {
  /** The panel's heading */
  title?: string;
  /** Whether it's on – controlled when given */
  active?: boolean;
  /** Whether an uncontrolled Loupe starts on */
  defaultActive?: boolean;
  /** Turned on or off (the hotkey, Escape, Close, the start button) */
  onActiveChange?: (active: boolean) => void;
  /** Outline components – controlled when given */
  showComponents?: boolean;
  /** Whether an uncontrolled Loupe starts outlining components (default true) */
  defaultShowComponents?: boolean;
  /** Show the breakpoint ruler – controlled when given */
  showRuler?: boolean;
  /** Whether an uncontrolled Loupe starts with the ruler (default true) */
  defaultShowRuler?: boolean;
  /** Outline and list flex and grid containers – controlled when given */
  showLayouts?: boolean;
  /** Whether an uncontrolled Loupe starts with layouts (default false) */
  defaultShowLayouts?: boolean;
  /** Components, the ruler or layouts were switched; `event.preventDefault()` keeps the switch as it was */
  onFeatureChange?: (detail: LoupeFeatureChange, event: CustomEvent<LoupeFeatureChange>) => void;
  /** A component was picked in the panel */
  onComponentSelect?: (detail: LoupeSelect) => void;
};

export function Loupe({
  title,
  active,
  defaultActive = false,
  onActiveChange,
  showComponents,
  defaultShowComponents = true,
  showRuler,
  defaultShowRuler = true,
  showLayouts,
  defaultShowLayouts = false,
  onFeatureChange,
  onComponentSelect,
  ...props
}: LoupeProps) {
  const a = useControlled<boolean>(active, defaultActive, onActiveChange);
  // The switches are kept here too, so a parent's re-render doesn't put the element's own switching back
  const comps = useControlled<boolean>(showComponents, defaultShowComponents, undefined);
  const ruler = useControlled<boolean>(showRuler, defaultShowRuler, undefined);
  const layouts = useControlled<boolean>(showLayouts, defaultShowLayouts, undefined);
  const switches = { components: comps, ruler, layouts };
  return h(RawLoupe, {
    ...props,
    heading: title ?? "Loupe",
    active: a.value,
    showComponents: comps.value,
    showRuler: ruler.value,
    showLayouts: layouts.value,
    onTcActiveChange: (e: CustomEvent<LoupeActiveChange>) => a.handler(e.detail.active, e),
    onTcFeatureChange: (e: CustomEvent<LoupeFeatureChange>) => {
      onFeatureChange?.(e.detail, e);
      if (!e.defaultPrevented) switches[e.detail.feature].handler(e.detail.on, e);
    },
    onTcSelect: (e: CustomEvent<LoupeSelect>) => onComponentSelect?.(e.detail),
  });
}
