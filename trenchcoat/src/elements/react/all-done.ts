import { createComponent } from "@lit/react";
import * as React from "react";
import { TcAllDone } from "../all-done";

/** All Done illustration, with its words as real text. The ref receives the element */
export const AllDone = createComponent({ tagName: "tc-all-done", elementClass: TcAllDone, react: React });
export type AllDoneProps = React.ComponentProps<typeof AllDone>;
