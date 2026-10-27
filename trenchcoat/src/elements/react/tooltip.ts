import { createComponent } from "@lit/react";
import * as React from "react";
import { TcTooltip } from "../tooltip";
export const Tooltip = createComponent({
  tagName: "tc-tooltip",
  elementClass: TcTooltip,
  react: React,
});
export type TooltipProps = React.ComponentProps<typeof Tooltip>;
