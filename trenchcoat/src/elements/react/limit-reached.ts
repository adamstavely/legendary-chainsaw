import { createComponent } from "@lit/react";
import * as React from "react";
import { TcLimitReached } from "../limit-reached";

/** Limit Reached illustration, with its words as real text. The ref receives the element */
export const LimitReached = createComponent({ tagName: "tc-limit-reached", elementClass: TcLimitReached, react: React });
export type LimitReachedProps = React.ComponentProps<typeof LimitReached>;
