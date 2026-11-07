import { createComponent } from "@lit/react";
import * as React from "react";
import { TcInspectFrame } from "../inspect-frame";
import { h } from "./internal";

const RawInspectFrame = createComponent({ tagName: "tc-inspect-frame", elementClass: TcInspectFrame, react: React });
type RawInspectFrameProps = React.ComponentProps<typeof RawInspectFrame>;

export type InspectFrameOwnProps = {
  /** The component to show – it's measured and walked through, row by row */
  children?: React.ReactNode;
  /** Accessible name; without it the illustration is decorative */
  label?: string;
  /** CSS selector for the rows, inside the content; unset picks the root's block children */
  targets?: string;
  /** Walks the selection through the rows; false holds it on the first row */
  playing?: boolean;
  /** How long the selection stays on a row, in ms */
  hold?: number;
  /** Wait before the first selection, in ms */
  delay?: number;
  /** How many times it walks through the rows before it rests on the first one */
  rounds?: number;
  /** Tilted the other way and fading out to the left */
  mirror?: boolean;
  /** No tilt and no fade */
  flat?: boolean;
  /** The content's width in px, before it's scaled to fit */
  contentWidth?: number;
  /** Classes on the root */
  className?: string;
  /** The root element */
  ref?: React.Ref<TcInspectFrame>;
};
export type InspectFrameProps = Omit<RawInspectFrameProps, keyof InspectFrameOwnProps> & InspectFrameOwnProps;

/** Inspect Frame illustration – a component seen like a selection in a design tool. The children go in one div, the content */
export function InspectFrame({ children, ...props }: InspectFrameProps) {
  return h(RawInspectFrame, props as RawInspectFrameProps, h("div", { className: "ui-isp-content" }, children));
}
