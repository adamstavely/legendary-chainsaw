import { createComponent } from "@lit/react";
import * as React from "react";
import { TcSuccessCheck } from "../success-check";

/** A small tick that draws itself once. The ref receives the element */
export const SuccessCheck = createComponent({ tagName: "tc-success-check", elementClass: TcSuccessCheck, react: React });
export type SuccessCheckProps = React.ComponentProps<typeof SuccessCheck>;
