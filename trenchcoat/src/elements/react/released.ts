import { createComponent } from "@lit/react";
import * as React from "react";
import { TcReleased } from "../released";

/** Released illustration, with its words as real text. The ref receives the element */
export const Released = createComponent({ tagName: "tc-released", elementClass: TcReleased, react: React });
export type ReleasedProps = React.ComponentProps<typeof Released>;
