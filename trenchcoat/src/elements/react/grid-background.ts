import { createComponent } from "@lit/react";
import * as React from "react";
import { TcGridBackground, type GridDirection } from "../grid-background";
import { h } from "./internal";

export type { GridDirection } from "../grid-background";

const RawGridBackground = createComponent({ tagName: "tc-grid-background", elementClass: TcGridBackground, react: React });
type RawGridBackgroundProps = React.ComponentProps<typeof RawGridBackground>;

export type GridBackgroundOwnProps = {
  /** Content rendered above the grid */
  children?: React.ReactNode;
  /** Cell size in px */
  size?: number;
  /** Line color – defaults to a faint black, or a faint white in dark mode */
  color?: string;
  /** Seconds per cell; 0 keeps the grid still */
  speed?: number;
  /** Seconds the grid drifts before it rests; Infinity never stops – then give users a way to pause it (WCAG 2.2.2) */
  playFor?: number;
  /** Drift direction; "diagonal" runs from top right to bottom left */
  direction?: GridDirection;
  /** Uncover the grid with a growing circle when it first comes into view */
  reveal?: boolean;
  /** Radius of the edge fade, in % of the distance to the corners */
  fade?: number;
  className?: string;
  /** The root element */
  ref?: React.Ref<TcGridBackground>;
};
/** Other DOM props go to the root */
export type GridBackgroundProps = Omit<RawGridBackgroundProps, keyof GridBackgroundOwnProps> & GridBackgroundOwnProps;

/** The children go in one div above the grid, as the React component's content div held them */
export function GridBackground({ children, ...props }: GridBackgroundProps) {
  return h(RawGridBackground, props as RawGridBackgroundProps, h("div", { className: "ui-gb-content" }, children));
}
