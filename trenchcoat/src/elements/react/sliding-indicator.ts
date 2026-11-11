import { createComponent } from "@lit/react";
import * as React from "react";
import { TcSlidingIndicator } from "../sliding-indicator";

export type { SlidingIndicatorVariant, SlidingIndicatorOrientation } from "../sliding-indicator";
export { defaultSlidingIndicatorItems } from "../sliding-indicator";

/** A highlight that slides to the selected item of the buttons or links inside it. The ref receives the element */
export const SlidingIndicator = createComponent({ tagName: "tc-sliding-indicator", elementClass: TcSlidingIndicator, react: React });
export type SlidingIndicatorProps = React.ComponentProps<typeof SlidingIndicator>;
