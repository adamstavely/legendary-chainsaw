import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAttentionPulse } from "../attention-pulse";

/** Draws the eye once with a soft ring. The ref receives the element */
export const AttentionPulse = createComponent({ tagName: "tc-attention-pulse", elementClass: TcAttentionPulse, react: React });
export type AttentionPulseProps = React.ComponentProps<typeof AttentionPulse>;
