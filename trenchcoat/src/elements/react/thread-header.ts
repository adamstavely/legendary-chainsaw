import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcThreadHeader, type ThreadHeaderActionEvent, type ThreadHeaderPanelsChange, type ThreadHeaderTitleChange } from "../thread-header";
import { h, useControlled } from "./internal";

export type { ThreadHeaderAction, ThreadHeaderActionEvent, ThreadHeaderLabels, ThreadHeaderPanelsChange, ThreadHeaderTitleChange, ThreadHeaderToggle } from "../thread-header";
export { defaultThreadHeaderActions, defaultThreadHeaderLabels } from "../thread-header";

const RawThreadHeader = createComponent({
  tagName: "tc-thread-header",
  elementClass: TcThreadHeader,
  react: React,
  events: {
    onTcTitleChange: "tc-title-change" as EventName<CustomEvent<ThreadHeaderTitleChange>>,
    onTcPanelsChange: "tc-panels-change" as EventName<CustomEvent<ThreadHeaderPanelsChange>>,
    onTcShare: "tc-share" as EventName<CustomEvent<Record<string, never>>>,
    onTcAction: "tc-action" as EventName<CustomEvent<ThreadHeaderActionEvent>>,
  },
});
type RawProps = React.ComponentProps<typeof RawThreadHeader>;
type Owned = "heading" | "panels" | "onTcTitleChange" | "onTcPanelsChange" | "children";
export type ThreadHeaderProps = Omit<RawProps, Owned> & {
  /** The thread's title – controlled when given */
  title?: string;
  /** At first, when `title` isn't controlled */
  defaultTitle?: string;
  /** The title was renamed */
  onTitleChange?: (title: string) => void;
  /** The ids of the open panels – controlled when given */
  panels?: string[];
  /** At first, when `panels` isn't controlled */
  defaultPanels?: string[];
  /** A panel toggle was pressed */
  onPanelsChange?: (panels: string[]) => void;
};

const NONE: string[] = [];

export function ThreadHeader({ title, defaultTitle = "", onTitleChange, panels, defaultPanels = NONE, onPanelsChange, ...props }: ThreadHeaderProps) {
  const t = useControlled<string>(title, defaultTitle, onTitleChange);
  const p = useControlled<string[]>(panels, defaultPanels, onPanelsChange);
  return h(RawThreadHeader, {
    ...props,
    heading: t.value,
    panels: p.value,
    onTcTitleChange: (e: CustomEvent<ThreadHeaderTitleChange>) => t.handler(e.detail.title, e),
    onTcPanelsChange: (e: CustomEvent<ThreadHeaderPanelsChange>) => p.handler(e.detail.panels, e),
  });
}
