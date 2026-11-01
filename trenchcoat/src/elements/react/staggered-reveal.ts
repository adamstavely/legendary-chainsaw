import { createComponent } from "@lit/react";
import * as React from "react";
import { TcStaggeredReveal } from "../staggered-reveal";


/** Children arrive one after another, once. The ref receives the element */
export const StaggeredReveal = createComponent({ tagName: "tc-staggered-reveal", elementClass: TcStaggeredReveal, react: React });
export type StaggeredRevealProps = React.ComponentProps<typeof StaggeredReveal>;
