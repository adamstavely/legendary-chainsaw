import { createComponent } from "@lit/react";
import * as React from "react";
import { TcErrorShake } from "../error-shake";

/** Wraps a field and shakes it once, with an error outline and message, when it turns invalid. The ref receives the element */
export const ErrorShake = createComponent({ tagName: "tc-error-shake", elementClass: TcErrorShake, react: React });
export type ErrorShakeProps = React.ComponentProps<typeof ErrorShake>;
