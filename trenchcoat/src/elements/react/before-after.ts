import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBeforeAfter, type BeforeAfterMode, type BeforeAfterModeChange, type BeforeAfterPositionChange } from "../before-after";
import { h, useControlled } from "./internal";

export type { BeforeAfterImage, BeforeAfterMode, BeforeAfterOrientation } from "../before-after";

const RawBeforeAfter = createComponent({
  tagName: "tc-before-after",
  elementClass: TcBeforeAfter,
  react: React,
  events: {
    onTcPositionChange: "tc-position-change" as EventName<CustomEvent<BeforeAfterPositionChange>>,
    onTcModeChange: "tc-mode-change" as EventName<CustomEvent<BeforeAfterModeChange>>,
  },
});
type RawBeforeAfterProps = React.ComponentProps<typeof RawBeforeAfter>;

export type BeforeAfterOwnProps = {
  /** The heading */
  title?: string;
  /** How much of the original shows, 0–100. Controlled when defined – pass back what onPositionChange reports */
  position?: number;
  /** The starting position when uncontrolled */
  defaultPosition?: number;
  /** The divider moved */
  onPositionChange?: (position: number) => void;
  /** "slider" or "side-by-side". Controlled when defined */
  mode?: BeforeAfterMode;
  /** The starting mode when uncontrolled */
  defaultMode?: BeforeAfterMode;
  /** Switched between the slider and side by side */
  onModeChange?: (mode: BeforeAfterMode) => void;
};
export type BeforeAfterProps = Omit<RawBeforeAfterProps, keyof BeforeAfterOwnProps | "heading" | "onTcPositionChange" | "onTcModeChange"> & BeforeAfterOwnProps;

export function BeforeAfter({ title = "Before and after", position, defaultPosition = 50, onPositionChange, mode, defaultMode = "slider", onModeChange, ...props }: BeforeAfterProps) {
  const pos = useControlled(position, defaultPosition, onPositionChange);
  const m = useControlled(mode, defaultMode, onModeChange);
  return h(RawBeforeAfter, {
    ...props,
    heading: title,
    position: pos.value,
    mode: m.value,
    onTcPositionChange: (e: CustomEvent<BeforeAfterPositionChange>) => pos.handler(e.detail.position, e),
    onTcModeChange: (e: CustomEvent<BeforeAfterModeChange>) => m.handler(e.detail.mode, e),
  });
}
