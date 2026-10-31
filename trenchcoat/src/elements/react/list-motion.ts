import { createComponent } from "@lit/react";
import * as React from "react";
import { TcListMotion } from "../list-motion";

/** Rows that glide when reordered, added or removed. The ref receives the element */
export const ListMotion = createComponent({ tagName: "tc-list-motion", elementClass: TcListMotion, react: React });
export type ListMotionProps = React.ComponentProps<typeof ListMotion>;
