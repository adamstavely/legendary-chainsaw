import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBreakpointOverlay, type BreakpointOverlayBreakpointChange, type BreakpointOverlayOpenChange } from "../breakpoint-overlay";
import { h, useControlled } from "./internal";

export type { BreakpointOverlayBreakpoint, BreakpointOverlayBreakpointChange, BreakpointOverlayCorner } from "../breakpoint-overlay";

const RawBreakpointOverlay = createComponent({
  tagName: "tc-breakpoint-overlay",
  elementClass: TcBreakpointOverlay,
  react: React,
  events: {
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<BreakpointOverlayOpenChange>>,
    onTcBreakpointChange: "tc-breakpoint-change" as EventName<CustomEvent<BreakpointOverlayBreakpointChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawBreakpointOverlay>;
type Owned = "heading" | "open" | "onTcOpenChange" | "onTcBreakpointChange" | "children";
export type BreakpointOverlayProps = Omit<RawProps, Owned> & {
  /** The panel's heading */
  title?: string;
  /** Whether the panel is open – controlled when given */
  open?: boolean;
  /** Whether an uncontrolled overlay starts open */
  defaultOpen?: boolean;
  /** Opened or closed (the badge, the hotkey, Escape, Close) */
  onOpenChange?: (open: boolean) => void;
  /** The breakpoint in force changed as the width changed */
  onBreakpointChange?: (detail: BreakpointOverlayBreakpointChange) => void;
};

export function BreakpointOverlay({ title, open, defaultOpen = false, onOpenChange, onBreakpointChange, ...props }: BreakpointOverlayProps) {
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  return h(RawBreakpointOverlay, {
    ...props,
    heading: title ?? "Breakpoints",
    open: o.value,
    onTcOpenChange: (e: CustomEvent<BreakpointOverlayOpenChange>) => o.handler(e.detail.open, e),
    onTcBreakpointChange: (e: CustomEvent<BreakpointOverlayBreakpointChange>) => onBreakpointChange?.(e.detail),
  });
}
