import { createComponent } from "@lit/react";
import * as React from "react";
import { TcPendingRelease } from "../pending-release";

/** Pending Release illustration, with its words as real text. The ref receives the element */
export const PendingRelease = createComponent({ tagName: "tc-pending-release", elementClass: TcPendingRelease, react: React });
export type PendingReleaseProps = React.ComponentProps<typeof PendingRelease>;
