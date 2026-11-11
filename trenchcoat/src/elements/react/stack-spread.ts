import { createComponent } from "@lit/react";
import * as React from "react";
import { TcStackSpread } from "../stack-spread";

/** An overlapping stack that fans apart on hover or focus, with "+N" past `max`. The items are the children. The ref receives the element */
export const StackSpread = createComponent({ tagName: "tc-stack-spread", elementClass: TcStackSpread, react: React });
export type StackSpreadProps = React.ComponentProps<typeof StackSpread>;
