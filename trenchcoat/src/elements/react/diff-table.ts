import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDiffTable, type DiffTableDecisions, type DiffTableDecisionsChange, type DiffTableEditChange } from "../diff-table";
import { h, useControlled } from "./internal";

export type {
  DiffTableColumn,
  DiffTableDecisions,
  DiffTableDecisionsChange,
  DiffTableEdit,
  DiffTableEditChange,
  DiffTableLabels,
  DiffTableRow,
  DiffTableVerdict,
} from "../diff-table";
export { defaultDiffTableLabels } from "../diff-table";

const NO_DECISIONS: DiffTableDecisions = {};

const RawDiffTable = createComponent({
  tagName: "tc-diff-table",
  elementClass: TcDiffTable,
  react: React,
  events: {
    onTcEditChange: "tc-edit-change" as EventName<CustomEvent<DiffTableEditChange>>,
    onTcDecisionsChange: "tc-decisions-change" as EventName<CustomEvent<DiffTableDecisionsChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDiffTable>;
export type DiffTableProps = Omit<RawProps, "heading" | "decisions" | "onTcDecisionsChange" | "children"> & {
  /** The heading; an empty one draws no header */
  title?: string;
  /** The verdicts so far – controlled when given */
  decisions?: DiffTableDecisions;
  /** The verdicts to start with when uncontrolled */
  defaultDecisions?: DiffTableDecisions;
  /** Every decision, row, all or undo, with all verdicts so far */
  onDecisionsChange?: (decisions: DiffTableDecisions) => void;
};

export function DiffTable({ title, decisions, defaultDecisions = NO_DECISIONS, onDecisionsChange, ...props }: DiffTableProps) {
  const d = useControlled(decisions, defaultDecisions, onDecisionsChange);
  return h(RawDiffTable, {
    ...props,
    heading: title ?? "Proposed changes",
    decisions: d.value,
    onTcDecisionsChange: (e: CustomEvent<DiffTableDecisionsChange>) => d.handler(e.detail.decisions, e),
  });
}
