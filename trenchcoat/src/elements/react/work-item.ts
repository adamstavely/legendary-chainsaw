import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcWorkItem, type WorkOpen } from "../work-item";
import { h } from "./internal";

export type { WorkPerson, WorkStatus } from "../work-item";
export { defaultWorkStatusLabels } from "../work-item";

const RawWorkItem = createComponent({
  tagName: "tc-work-item",
  elementClass: TcWorkItem,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<WorkOpen>>,
  },
});
type RawProps = React.ComponentProps<typeof RawWorkItem>;
type Owned = "heading" | "onTcOpen" | "children";
export type WorkItemProps = Omit<RawProps, Owned> & {
  /** The work's title, and the card's control */
  title: string;
  /** The card was opened; return false to stop a link following */
  onOpen?: (href?: string) => boolean | void;
};

export function WorkItem({ title, onOpen, ...props }: WorkItemProps) {
  return h(RawWorkItem, {
    ...props,
    heading: title,
    onTcOpen: (e: CustomEvent<WorkOpen>) => {
      if (onOpen?.(e.detail.href) === false) e.preventDefault();
    },
  });
}
