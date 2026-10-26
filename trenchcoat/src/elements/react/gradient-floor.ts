import { createComponent } from "@lit/react";
import * as React from "react";
import { TcGradientFloor } from "../gradient-floor";
import { h } from "./internal";

const RawGradientFloor = createComponent({ tagName: "tc-gradient-floor", elementClass: TcGradientFloor, react: React });
type RawGradientFloorProps = React.ComponentProps<typeof RawGradientFloor>;

export type GradientFloorOwnProps = {
  /** Content rendered above the floor */
  children?: React.ReactNode;
  /** Gradient from the crest down: [top, middle, bottom] */
  colors?: [string, string, string];
  /** Seconds per morph loop; 0 keeps the shape still (the sideways drift keeps going) */
  speed?: number;
  /** Seconds of motion before the floor slows down and rests (rounded to whole drift loops of 2.5 s); Infinity never
   * stops – then give users a way to pause it (WCAG 2.2.2) */
  playFor?: number;
  /** Classes on the element */
  className?: string;
  /** The root element */
  ref?: React.Ref<TcGradientFloor>;
};
/** Other DOM props go to the root */
export type GradientFloorProps = Omit<RawGradientFloorProps, keyof GradientFloorOwnProps> & GradientFloorOwnProps;

/** The children go in one div above the floor, as the React component's content div held them */
export function GradientFloor({ children, ...props }: GradientFloorProps) {
  return h(RawGradientFloor, props as RawGradientFloorProps, children != null ? h("div", { className: "ui-gf-content" }, children) : null);
}
