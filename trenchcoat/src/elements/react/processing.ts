import { createComponent } from "@lit/react";
import * as React from "react";
import { TcProcessing } from "../processing";

/** Processing illustration, with its words as real text. The ref receives the element */
export const Processing = createComponent({ tagName: "tc-processing", elementClass: TcProcessing, react: React });
export type ProcessingProps = React.ComponentProps<typeof Processing>;
