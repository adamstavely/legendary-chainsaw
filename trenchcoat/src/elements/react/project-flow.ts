import { createComponent } from "@lit/react";
import * as React from "react";
import { TcProjectFlow } from "../project-flow";

const RawProjectFlow = createComponent({ tagName: "tc-project-flow", elementClass: TcProjectFlow, react: React });
export type ProjectFlowProps = Omit<React.ComponentProps<typeof RawProjectFlow>, "children" | "look" | "pageScheme" | "settled">;
/** Cards for a task, its subtasks, roles and tech stack build up one after another */
export function ProjectFlow(props: ProjectFlowProps) {
  return React.createElement(RawProjectFlow, props);
}
