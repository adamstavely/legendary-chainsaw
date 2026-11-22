import { createComponent } from "@lit/react";
import * as React from "react";
import { TcInProgress } from "../in-progress";

/** In progress illustration, with its words as real text. The ref receives the element */
export const InProgress = createComponent({ tagName: "tc-in-progress", elementClass: TcInProgress, react: React });
export type InProgressProps = React.ComponentProps<typeof InProgress>;
