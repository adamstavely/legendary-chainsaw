import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcProcessList, type ProcessEvent, type ProcessItem, type ProcessListActionEvent, type ProcessOpen, type ProcessSelectedChange } from "../process-list";
import { h, useControlled } from "./internal";

export type { ProcessEvent, ProcessItem, ProcessListAction, ProcessListActionEvent, ProcessListLabels, ProcessOpen, ProcessSelectedChange, ProcessStatus } from "../process-list";
export { defaultProcessListLabels, formatUptime } from "../process-list";

const RawProcessList = createComponent({
  tagName: "tc-process-list",
  elementClass: TcProcessList,
  react: React,
  events: {
    onTcSelectedChange: "tc-selected-change" as EventName<CustomEvent<ProcessSelectedChange>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<ProcessOpen>>,
    onTcStop: "tc-stop" as EventName<CustomEvent<ProcessEvent>>,
    onTcStart: "tc-start" as EventName<CustomEvent<ProcessEvent>>,
    onTcRestart: "tc-restart" as EventName<CustomEvent<ProcessEvent>>,
    onTcLogs: "tc-logs" as EventName<CustomEvent<ProcessEvent>>,
    onTcStopAll: "tc-stop-all" as EventName<CustomEvent<null>>,
    onTcCreate: "tc-create" as EventName<CustomEvent<null>>,
    onTcAction: "tc-action" as EventName<CustomEvent<ProcessListActionEvent>>,
  },
});
type RawProps = React.ComponentProps<typeof RawProcessList>;
export type ProcessListProps = Omit<RawProps, "heading" | "selected" | "onTcSelectedChange" | "children"> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The selected row's id – controlled when given */
  selected?: string | null;
  /** The selected row at first, when `selected` isn't controlled */
  defaultSelected?: string | null;
  /** A row was pressed */
  onSelectedChange?: (selected: string | null, process: ProcessItem | null) => void;
};

export function ProcessList({ title = "Processes", selected, defaultSelected = null, onSelectedChange, ...props }: ProcessListProps) {
  const last = React.useRef<ProcessItem | null>(null);
  const s = useControlled<string | null>(selected, defaultSelected, onSelectedChange ? (next) => onSelectedChange(next, last.current) : undefined);
  return h(RawProcessList, {
    ...props,
    heading: title,
    selected: s.value,
    onTcSelectedChange: (e: CustomEvent<ProcessSelectedChange>) => {
      last.current = e.detail.process;
      s.handler(e.detail.selected, e);
    },
  });
}
