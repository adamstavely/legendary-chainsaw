import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDragLift, type DragLiftMove } from "../drag-lift";

export type { DragLiftMove } from "../drag-lift";

/** Lifts its child while it's dragged. The ref receives the element */
export const DragLift = createComponent({
  tagName: "tc-drag-lift",
  elementClass: TcDragLift,
  react: React,
  events: {
    onTcDragStart: "tc-drag-start" as EventName<CustomEvent<DragLiftMove>>,
    onTcDragEnd: "tc-drag-end" as EventName<CustomEvent<DragLiftMove>>,
    onTcDragCancel: "tc-drag-cancel" as EventName<CustomEvent<DragLiftMove>>,
  },
});
export type DragLiftProps = React.ComponentProps<typeof DragLift>;
