import { createComponent } from "@lit/react";
import * as React from "react";
import { TcBadgePop } from "../badge-pop";

export type { BadgePopPosition } from "../badge-pop";

/** A count badge that pops when the count rises and rolls its digits. The ref receives the element */
export const BadgePop = createComponent({ tagName: "tc-badge-pop", elementClass: TcBadgePop, react: React });
export type BadgePopProps = React.ComponentProps<typeof BadgePop>;
