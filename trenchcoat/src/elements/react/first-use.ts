import { createComponent } from "@lit/react";
import * as React from "react";
import { TcFirstUse } from "../first-use";

/** First Use illustration, with its words as real text. The ref receives the element */
export const FirstUse = createComponent({ tagName: "tc-first-use", elementClass: TcFirstUse, react: React });
export type FirstUseProps = React.ComponentProps<typeof FirstUse>;
