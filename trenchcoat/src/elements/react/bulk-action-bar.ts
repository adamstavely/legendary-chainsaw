import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcBulkActionBar, type BulkActionDetail, type BulkUndoDetail } from "../bulk-action-bar";

export type { BulkAction, BulkActionBarLabels, BulkActionDetail, BulkUndoDetail } from "../bulk-action-bar";
export { defaultBulkActionBarLabels } from "../bulk-action-bar";

/** What can be done to everything selected. The ref receives the element */
export const BulkActionBar = createComponent({
  tagName: "tc-bulk-action-bar",
  elementClass: TcBulkActionBar,
  react: React,
  events: {
    onTcAction: "tc-action" as EventName<CustomEvent<BulkActionDetail>>,
    onTcSelectAll: "tc-select-all" as EventName<CustomEvent<null>>,
    onTcClear: "tc-clear" as EventName<CustomEvent<null>>,
    onTcUndo: "tc-undo" as EventName<CustomEvent<BulkUndoDetail>>,
  },
});
export type BulkActionBarProps = React.ComponentProps<typeof BulkActionBar>;
