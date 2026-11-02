import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcChangeList, type ChangeAction, type ChangeExpandedChange, type ChangeOpen } from "../change-list";
import { h, useControlled } from "./internal";

export type { ChangeAction, ChangeExpandedChange, ChangeItem, ChangeListLabels, ChangeOpen, ChangeRowAction, ChangeState } from "../change-list";
export { defaultChangeListLabels } from "../change-list";

const RawChangeList = createComponent({
  tagName: "tc-change-list",
  elementClass: TcChangeList,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<ChangeOpen>>,
    onTcAction: "tc-action" as EventName<CustomEvent<ChangeAction>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<ChangeExpandedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawChangeList>;
type Owned = "heading" | "expanded" | "onTcExpandedChange" | "children";
export type ChangeListProps = Omit<RawProps, Owned> & {
  /** The heading; an empty one draws no header */
  title?: string;
  /** Every row is showing – controlled when given */
  expanded?: boolean;
  /** On mount, when `expanded` isn't controlled */
  defaultExpanded?: boolean;
  /** Show more or Show less was pressed */
  onExpandedChange?: (expanded: boolean) => void;
};

export function ChangeList({ title, expanded, defaultExpanded = false, onExpandedChange, ...props }: ChangeListProps) {
  const x = useControlled<boolean>(expanded, defaultExpanded, onExpandedChange);
  return h(RawChangeList, {
    ...props,
    heading: title ?? "Changes",
    expanded: x.value,
    onTcExpandedChange: (e: CustomEvent<ChangeExpandedChange>) => x.handler(e.detail.expanded, e),
  });
}
