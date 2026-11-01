import { createComponent } from "@lit/react";
import * as React from "react";
import { TcNumberChange } from "../number-change";

export type { NumberChangeDirection, NumberChangeLabels } from "../number-change";
export { defaultNumberChangeLabels } from "../number-change";

/** A number that briefly highlights when it changes. The ref receives the element */
export const NumberChange = createComponent({ tagName: "tc-number-change", elementClass: TcNumberChange, react: React });
export type NumberChangeProps = React.ComponentProps<typeof NumberChange>;
