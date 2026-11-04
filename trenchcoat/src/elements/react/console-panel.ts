import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcConsolePanel, type ConsoleExpandedChange, type ConsoleFilterChange, type ConsoleLevel, type ConsoleLevelsChange } from "../console-panel";
import { h, useControlled } from "./internal";

export type { ConsoleEntry, ConsoleExpandedChange, ConsoleFilterChange, ConsoleLevel, ConsoleLevelsChange, ConsolePanelLabels } from "../console-panel";
export { consoleLevels, defaultConsolePanelLabels } from "../console-panel";

const RawConsolePanel = createComponent({
  tagName: "tc-console-panel",
  elementClass: TcConsolePanel,
  react: React,
  events: {
    onTcLevelsChange: "tc-levels-change" as EventName<CustomEvent<ConsoleLevelsChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<ConsoleFilterChange>>,
    onTcExpandedChange: "tc-expanded-change" as EventName<CustomEvent<ConsoleExpandedChange>>,
    onTcClear: "tc-clear" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawConsolePanel>;
type Owned = "heading" | "levels" | "filter" | "expanded" | "onTcLevelsChange" | "onTcFilterChange" | "onTcExpandedChange" | "children";
export type ConsolePanelProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The levels that show – controlled when given */
  levels?: ConsoleLevel[];
  /** The levels that show at first, when `levels` isn't controlled */
  defaultLevels?: ConsoleLevel[];
  /** A level chip was toggled */
  onLevelsChange?: (levels: ConsoleLevel[]) => void;
  /** The text filter – controlled when given */
  filter?: string;
  /** The text filter at first, when `filter` isn't controlled */
  defaultFilter?: string;
  /** The text filter changed */
  onFilterChange?: (filter: string) => void;
  /** The ids of the entries whose stack is open – controlled when given */
  expanded?: string[];
  /** The open stacks at first, when `expanded` isn't controlled */
  defaultExpanded?: string[];
  /** A stack was opened or closed */
  onExpandedChange?: (expanded: string[]) => void;
};

const ALL: ConsoleLevel[] = ["error", "warn", "info", "log", "debug"];
const NONE: string[] = [];

export function ConsolePanel({ title = "Console", levels, defaultLevels = ALL, onLevelsChange, filter, defaultFilter = "", onFilterChange, expanded, defaultExpanded = NONE, onExpandedChange, ...props }: ConsolePanelProps) {
  const l = useControlled<ConsoleLevel[]>(levels, defaultLevels, onLevelsChange);
  const f = useControlled<string>(filter, defaultFilter, onFilterChange);
  const e = useControlled<string[]>(expanded, defaultExpanded, onExpandedChange);
  return h(RawConsolePanel, {
    ...props,
    heading: title,
    levels: l.value,
    filter: f.value,
    expanded: e.value,
    onTcLevelsChange: (ev: CustomEvent<ConsoleLevelsChange>) => l.handler(ev.detail.levels, ev),
    onTcFilterChange: (ev: CustomEvent<ConsoleFilterChange>) => f.handler(ev.detail.filter, ev),
    onTcExpandedChange: (ev: CustomEvent<ConsoleExpandedChange>) => e.handler(ev.detail.expanded, ev),
  });
}
