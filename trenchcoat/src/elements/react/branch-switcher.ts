import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBranchSwitcher, type BranchCreate, type BranchCurrentChange, type BranchItem, type BranchOpenChange, type BranchQueryChange, type BranchSync } from "../branch-switcher";
import { h, useControlled } from "./internal";

export type { BranchCreate, BranchCurrentChange, BranchItem, BranchKind, BranchOpenChange, BranchQueryChange, BranchSwitcherLabels, BranchSync } from "../branch-switcher";
export { defaultBranchSwitcherLabels, toBranchName } from "../branch-switcher";

const RawBranchSwitcher = createComponent({
  tagName: "tc-branch-switcher",
  elementClass: TcBranchSwitcher,
  react: React,
  events: {
    onTcCurrentChange: "tc-current-change" as EventName<CustomEvent<BranchCurrentChange>>,
    onTcQueryChange: "tc-query-change" as EventName<CustomEvent<BranchQueryChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<BranchOpenChange>>,
    onTcCreate: "tc-create" as EventName<CustomEvent<BranchCreate>>,
    onTcSync: "tc-sync" as EventName<CustomEvent<BranchSync>>,
  },
});
type RawProps = React.ComponentProps<typeof RawBranchSwitcher>;
type Owned = "heading" | "current" | "query" | "open" | "onTcCurrentChange" | "onTcQueryChange" | "onTcOpenChange" | "children";
export type BranchSwitcherProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The branch in use – controlled when given */
  current?: string;
  /** At first, when `current` isn't controlled */
  defaultCurrent?: string;
  /** Another branch was picked */
  onCurrentChange?: (current: string, branch?: BranchItem) => void;
  /** The filter's text – controlled when given */
  query?: string;
  /** At first, when `query` isn't controlled */
  defaultQuery?: string;
  /** The filter's text changed */
  onQueryChange?: (query: string) => void;
  /** The list is open – controlled when given */
  open?: boolean;
  /** At first, when `open` isn't controlled */
  defaultOpen?: boolean;
  /** The list opened or closed */
  onOpenChange?: (open: boolean) => void;
};

export function BranchSwitcher({ title = "Branch", current, defaultCurrent = "", onCurrentChange, query, defaultQuery = "", onQueryChange, open, defaultOpen = false, onOpenChange, ...props }: BranchSwitcherProps) {
  const c = useControlled<string>(current, defaultCurrent, undefined);
  const q = useControlled<string>(query, defaultQuery, onQueryChange);
  const o = useControlled<boolean>(open, defaultOpen, onOpenChange);
  return h(RawBranchSwitcher, {
    ...props,
    heading: title,
    current: c.value,
    query: q.value,
    open: o.value,
    onTcCurrentChange: (e: CustomEvent<BranchCurrentChange>) => {
      c.handler(e.detail.current, e);
      onCurrentChange?.(e.detail.current, e.detail.branch);
    },
    onTcQueryChange: (e: CustomEvent<BranchQueryChange>) => q.handler(e.detail.query, e),
    onTcOpenChange: (e: CustomEvent<BranchOpenChange>) => o.handler(e.detail.open, e),
  });
}
