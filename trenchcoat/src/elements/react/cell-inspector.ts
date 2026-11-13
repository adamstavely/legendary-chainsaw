import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcCellInspector, type CellAccept, type CellFlag, type CellRerun, type CellStatus, type CellStatusChange, type CellValueChange } from "../cell-inspector";
import { h, useControlled } from "./internal";

export type { CellHistoryEntry, CellSource, CellStatus } from "../cell-inspector";
export { cellConfidenceWord, defaultCellStatusLabels } from "../cell-inspector";

const RawCellInspector = createComponent({
  tagName: "tc-cell-inspector",
  elementClass: TcCellInspector,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<CellValueChange>>,
    onTcStatusChange: "tc-status-change" as EventName<CustomEvent<CellStatusChange>>,
    onTcAccept: "tc-accept" as EventName<CustomEvent<CellAccept>>,
    onTcRerun: "tc-rerun" as EventName<CustomEvent<CellRerun>>,
    onTcFlag: "tc-flag" as EventName<CustomEvent<CellFlag>>,
    onTcClose: "tc-close" as EventName<CustomEvent<Record<string, never>>>,
  },
});
type RawCellInspectorProps = React.ComponentProps<typeof RawCellInspector>;
type Wrapped = "heading" | "value" | "status" | "onTcValueChange" | "onTcStatusChange" | "onTcAccept" | "onTcRerun" | "onTcFlag" | "onTcClose" | "children";
export type CellInspectorProps = Omit<RawCellInspectorProps, Wrapped> & {
  /** The heading – the column's name – and the region's name */
  title?: string;
  /** The cell's value – controlled when given */
  value?: string;
  /** Initial value when uncontrolled */
  defaultValue?: string;
  /** The value was edited and saved */
  onValueChange?: (value: string) => void;
  /** Where the cell stands – controlled when given */
  status?: CellStatus;
  /** Initial status when uncontrolled */
  defaultStatus?: CellStatus;
  /** Called with the next `status` */
  onStatusChange?: (status: CellStatus) => void;
  /** Accept was pressed. Return false to stop it */
  onAccept?: (value: string) => void | boolean;
  /** Re-run this cell was pressed – run it, then pass the new value and status back. Return false to stop it */
  onRerun?: (value: string) => void | boolean;
  /** Marked as wrong, with the reason. Return false to stop it */
  onFlag?: (reason: string, value: string) => void | boolean;
  /** Escape, or the close button – close the panel */
  onClose?: () => void;
};

export function CellInspector({ title, value, defaultValue = "", onValueChange, status, defaultStatus = "new", onStatusChange, onAccept, onRerun, onFlag, onClose, ...props }: CellInspectorProps) {
  const v = useControlled<string>(value, defaultValue, onValueChange);
  const s = useControlled<CellStatus>(status, defaultStatus, onStatusChange);
  return h(RawCellInspector, {
    ...props,
    heading: title ?? "Cell",
    value: v.value,
    status: s.value,
    onTcValueChange: (e: CustomEvent<CellValueChange>) => v.handler(e.detail.value, e),
    onTcStatusChange: (e: CustomEvent<CellStatusChange>) => s.handler(e.detail.status, e),
    onTcAccept: (e: CustomEvent<CellAccept>) => {
      if (onAccept?.(e.detail.value) === false) e.preventDefault();
    },
    onTcRerun: (e: CustomEvent<CellRerun>) => {
      if (onRerun?.(e.detail.value) === false) e.preventDefault();
    },
    onTcFlag: (e: CustomEvent<CellFlag>) => {
      if (onFlag?.(e.detail.reason, e.detail.value) === false) e.preventDefault();
    },
    onTcClose: () => onClose?.(),
  });
}
