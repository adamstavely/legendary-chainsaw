import { createComponent } from "@lit/react";
import * as React from "react";
import { TcFailed } from "../failed";

/** Failed illustration, with its words as real text. The ref receives the element */
export const Failed = createComponent({ tagName: "tc-failed", elementClass: TcFailed, react: React });
export type FailedProps = React.ComponentProps<typeof Failed>;
