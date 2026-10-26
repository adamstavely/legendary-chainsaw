import { createComponent } from "@lit/react";
import * as React from "react";
import { TcBlurCrossfade } from "../blur-crossfade";
import { h } from "./internal";

const RawBlurCrossfade = createComponent({ tagName: "tc-blur-crossfade", elementClass: TcBlurCrossfade, react: React });
type RawBlurCrossfadeProps = React.ComponentProps<typeof RawBlurCrossfade>;

export type BlurCrossfadeOwnProps = {
  /** Change this to swap – the children of the old id fade out, the new ones fade in */
  id: string | number;
  /** The content on show – it swaps whenever `id` changes */
  children?: React.ReactNode;
  /** Length of the swap in ms */
  duration?: number;
  /** Blur in px at the start and end of the fade */
  blur?: number;
  /** Which sides glide to the new size; "both" sizes the box to its content */
  morph?: "height" | "both" | "none";
  /** The layer element – use span inside buttons and other inline content */
  as?: "div" | "span";
  /** Classes on the root element */
  className?: string;
  /** Inline styles on the root element */
  style?: React.CSSProperties;
  /** The root element */
  ref?: React.Ref<TcBlurCrossfade>;
};
/** Other DOM props go to the root; `id` is the swap key, so it never reaches the DOM */
export type BlurCrossfadeProps = Omit<RawBlurCrossfadeProps, keyof BlurCrossfadeOwnProps | "swapKey" | "blurAmount"> & BlurCrossfadeOwnProps;

/** The children render in one layer keyed by `id`, as in the React component: a new id is a new layer, the old one leaves */
export function BlurCrossfade({ id, children, as = "div", blur = 10, ...props }: BlurCrossfadeProps) {
  return h(RawBlurCrossfade, { ...(props as RawBlurCrossfadeProps), swapKey: id, blurAmount: blur }, h(as, { key: `c-${id}`, className: "ui-bx__layer" }, children));
}
