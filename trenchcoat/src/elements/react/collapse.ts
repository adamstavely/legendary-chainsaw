import { createComponent } from "@lit/react";
import * as React from "react";
import { TcCollapse } from "../collapse";

/** Content that glides open and shut to its real height. The ref receives the element */
export const Collapse = createComponent({ tagName: "tc-collapse", elementClass: TcCollapse, react: React });
export type CollapseProps = React.ComponentProps<typeof Collapse>;
