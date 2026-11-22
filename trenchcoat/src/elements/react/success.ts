import { createComponent } from "@lit/react";
import * as React from "react";
import { TcSuccess } from "../success";

/** Success illustration, with its words as real text. The ref receives the element */
export const Success = createComponent({ tagName: "tc-success", elementClass: TcSuccess, react: React });
export type SuccessProps = React.ComponentProps<typeof Success>;
