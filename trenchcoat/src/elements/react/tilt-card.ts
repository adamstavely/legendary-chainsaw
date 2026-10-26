import { createComponent } from "@lit/react";
import * as React from "react";
import { TcTiltCard } from "../tilt-card";
import { h } from "./internal";

const RawTiltCard = createComponent({ tagName: "tc-tilt-card", elementClass: TcTiltCard, react: React });
type RawTiltCardProps = React.ComponentProps<typeof RawTiltCard>;

export type TiltCardOwnProps = {
  /** The card's content – it fills the tilting surface */
  children?: React.ReactNode;
  /** Maximum tilt in degrees */
  maxTilt?: number;
  /** Show a soft glare that follows the pointer */
  glare?: boolean;
  /** Scale while the pointer is over the card */
  scale?: number;
  /** Perspective distance in px – smaller is more dramatic */
  perspective?: number;
  className?: string;
  /** The root (the untransformed wrapper) */
  ref?: React.Ref<TcTiltCard>;
};
/** Other DOM props go to the root; your pointer handlers run alongside the card's own */
export type TiltCardProps = Omit<RawTiltCardProps, keyof TiltCardOwnProps> & TiltCardOwnProps;

/** The children go in one div – the layer that tilts, as the React component's card div held them */
export function TiltCard({ children, ...props }: TiltCardProps) {
  return h(RawTiltCard, props as RawTiltCardProps, h("div", { className: "ui-tlt-content" }, children));
}
