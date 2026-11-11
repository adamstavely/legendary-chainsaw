import { createComponent } from "@lit/react";
import * as React from "react";
import { TcPixelLoader } from "../pixel-loader";

export type { PixelLoaderLabels, PixelLoaderPattern, PixelLoaderState } from "../pixel-loader";
export { defaultPixelLoaderLabels, formatElapsed } from "../pixel-loader";

/** A pixel-grid working indicator with a shimmering label and the elapsed time. The ref receives the element */
export const PixelLoader = createComponent({
  tagName: "tc-pixel-loader",
  elementClass: TcPixelLoader,
  react: React,
});
export type PixelLoaderProps = React.ComponentProps<typeof PixelLoader>;
