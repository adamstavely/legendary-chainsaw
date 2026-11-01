import { createComponent } from "@lit/react";
import * as React from "react";
import { TcProgressBar } from "../progress-bar";


/** A thin bar for a wait, of known or unknown length. The ref receives the element */
export const ProgressBar = createComponent({ tagName: "tc-progress-bar", elementClass: TcProgressBar, react: React });
export type ProgressBarProps = React.ComponentProps<typeof ProgressBar>;
