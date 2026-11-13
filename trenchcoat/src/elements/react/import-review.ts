import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcImportReview,
  type ImportReviewChangeKind,
  type ImportReviewFilter,
  type ImportReviewFilterChange,
  type ImportReviewImport,
  type ImportReviewRow,
  type ImportReviewRowsChange,
  type ImportReviewSkipProblemsChange,
} from "../import-review";
import { h, useControlled } from "./internal";

export type {
  ImportReviewChangeKind,
  ImportReviewColumn,
  ImportReviewColumnType,
  ImportReviewFilter,
  ImportReviewImport,
  ImportReviewLabels,
  ImportReviewRow,
  ImportReviewRowsChange,
  ImportReviewValidator,
} from "../import-review";

const RawImportReview = createComponent({
  tagName: "tc-import-review",
  elementClass: TcImportReview,
  react: React,
  events: {
    onTcRowsChange: "tc-rows-change" as EventName<CustomEvent<ImportReviewRowsChange>>,
    onTcFilterChange: "tc-filter-change" as EventName<CustomEvent<ImportReviewFilterChange>>,
    onTcSkipProblemsChange: "tc-skip-problems-change" as EventName<CustomEvent<ImportReviewSkipProblemsChange>>,
    onTcImport: "tc-import" as EventName<CustomEvent<ImportReviewImport>>,
  },
});
type RawImportReviewProps = React.ComponentProps<typeof RawImportReview>;

export type ImportReviewOwnProps = {
  /** The heading */
  title?: string;
  /** The rows. Controlled when defined – pass back what onRowsChange reports */
  rows?: ImportReviewRow[];
  /** The starting rows when uncontrolled */
  defaultRows?: ImportReviewRow[];
  /** A cell was edited, or a row skipped, restored, kept or merged: every row, what was done and to which row */
  onRowsChange?: (rows: ImportReviewRow[], change: ImportReviewChangeKind, id: string) => void;
  /** Which rows the table shows. Controlled when defined */
  filter?: ImportReviewFilter;
  /** The starting tab when uncontrolled */
  defaultFilter?: ImportReviewFilter;
  /** A filter tab was chosen */
  onFilterChange?: (filter: ImportReviewFilter) => void;
  /** Whether Import leaves out rows with problems and extra duplicates. Controlled when defined */
  skipProblems?: boolean;
  /** The starting choice when uncontrolled */
  defaultSkipProblems?: boolean;
  /** "Skip rows with problems" was switched */
  onSkipProblemsChange?: (skipProblems: boolean) => void;
  /** Import was pressed: the rows to import and the rows left out. Return false to say it didn't happen */
  onImport?: (rows: ImportReviewRow[], skipped: ImportReviewRow[]) => boolean | void;
};
export type ImportReviewProps = Omit<RawImportReviewProps, keyof ImportReviewOwnProps | "heading" | "onTcRowsChange" | "onTcFilterChange" | "onTcSkipProblemsChange" | "onTcImport"> &
  ImportReviewOwnProps;

const EMPTY: ImportReviewRow[] = [];

export function ImportReview({
  title = "Review rows",
  rows,
  defaultRows = EMPTY,
  onRowsChange,
  filter,
  defaultFilter = "all",
  onFilterChange,
  skipProblems,
  defaultSkipProblems = false,
  onSkipProblemsChange,
  onImport,
  ...props
}: ImportReviewProps) {
  const last = React.useRef<{ change: ImportReviewChangeKind; id: string }>({ change: "edit", id: "" });
  const report = React.useCallback((next: ImportReviewRow[]) => onRowsChange?.(next, last.current.change, last.current.id), [onRowsChange]);
  const r = useControlled(rows, defaultRows, report);
  const f = useControlled(filter, defaultFilter, onFilterChange);
  const sp = useControlled(skipProblems, defaultSkipProblems, onSkipProblemsChange);
  return h(RawImportReview, {
    ...props,
    heading: title,
    rows: r.value,
    filter: f.value,
    skipProblems: sp.value,
    onTcRowsChange: (e: CustomEvent<ImportReviewRowsChange>) => {
      last.current = { change: e.detail.change, id: e.detail.id };
      r.handler(e.detail.rows, e);
    },
    onTcFilterChange: (e: CustomEvent<ImportReviewFilterChange>) => f.handler(e.detail.filter, e),
    onTcSkipProblemsChange: (e: CustomEvent<ImportReviewSkipProblemsChange>) => sp.handler(e.detail.skipProblems, e),
    onTcImport: (e: CustomEvent<ImportReviewImport>) => {
      if (onImport?.(e.detail.rows, e.detail.skipped) === false) e.preventDefault();
    },
  });
}
