import { createComponent } from "@lit/react";
import * as React from "react";
import { TcStatusMorph } from "../status-morph";

export type { StatusMorphLabels, StatusMorphStatus } from "../status-morph";
export { defaultStatusMorphLabels } from "../status-morph";

/** One state's mark changing into the next, with its word. The ref receives the element */
export const StatusMorph = createComponent({ tagName: "tc-status-morph", elementClass: TcStatusMorph, react: React });
export type StatusMorphProps = React.ComponentProps<typeof StatusMorph>;
