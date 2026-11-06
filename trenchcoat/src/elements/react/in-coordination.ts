import { createComponent } from "@lit/react";
import * as React from "react";
import { TcInCoordination } from "../in-coordination";

/** In Coordination illustration, with its words as real text. The ref receives the element */
export const InCoordination = createComponent({ tagName: "tc-in-coordination", elementClass: TcInCoordination, react: React });
export type InCoordinationProps = React.ComponentProps<typeof InCoordination>;
