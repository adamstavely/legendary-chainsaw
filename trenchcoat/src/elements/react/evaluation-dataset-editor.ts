import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcEvaluationDatasetEditor, type EvaluationDatasetCompareChange, type EvaluationDatasetExport, type EvaluationDatasetOpenChange, type EvaluationDatasetValue, type EvaluationDatasetValueChange } from "../evaluation-dataset-editor";
import { h, useControlled } from "./internal";

export type { EvaluationAssertion, EvaluationAssertionType, EvaluationCase, EvaluationComparison, EvaluationDatasetValue, EvaluationDatasetVersion, EvaluationIssue, EvaluationSplit } from "../evaluation-dataset-editor";
export { compareEvaluationDatasets, EVALUATION_ASSERTION_TYPES, EVALUATION_SPLITS, evaluationDatasetFromJsonl, evaluationDatasetIssues, evaluationDatasetToJsonl } from "../evaluation-dataset-editor";

const RawEvaluationDatasetEditor = createComponent({
  tagName: "tc-evaluation-dataset-editor",
  elementClass: TcEvaluationDatasetEditor,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<EvaluationDatasetValueChange>>,
    onTcOpenChange: "tc-open-change" as EventName<CustomEvent<EvaluationDatasetOpenChange>>,
    onTcCompareChange: "tc-compare-change" as EventName<CustomEvent<EvaluationDatasetCompareChange>>,
    onTcImport: "tc-import" as EventName<CustomEvent<null>>,
    onTcExport: "tc-export" as EventName<CustomEvent<EvaluationDatasetExport>>,
  },
});

type RawProps = React.ComponentProps<typeof RawEvaluationDatasetEditor>;
type Owned = "value" | "defaultValue" | "heading" | "open" | "compare" | "onChange" | "onTcValueChange" | "onTcOpenChange" | "onTcCompareChange" | "onTcImport" | "onTcExport" | "children";
export type EvaluationDatasetEditorProps = Omit<RawProps, Owned> & {
  /** The heading – the set's name */
  title?: string;
  /** The set (controlled) */
  value?: EvaluationDatasetValue;
  /** The set to start with when uncontrolled */
  defaultValue?: EvaluationDatasetValue;
  /** Called with the whole set after every edit */
  onChange?: (value: EvaluationDatasetValue) => void;
  /** The id of the version to compare with, "" for none (controlled) */
  compare?: string;
  /** The version to compare with on mount when `compare` isn't controlled */
  defaultCompare?: string;
  /** A version to compare with was picked ("" for none) */
  onCompareChange?: (compare: string) => void;
  /** The id of the open case, or null (controlled when given) */
  open?: string | null;
  /** A case was opened or closed (its id, or null) */
  onOpenChange?: (open: string | null) => void;
  /** Import was pressed – read a file and pass the cases back through `value` */
  onImport?: () => void;
  /** Export was pressed, with the set and the same set as JSON Lines */
  onExport?: (value: EvaluationDatasetValue, jsonl: string) => void;
};

const DEFAULT: EvaluationDatasetValue = { cases: [] };

export function EvaluationDatasetEditor({ title, value, defaultValue = DEFAULT, onChange, compare, defaultCompare = "", onCompareChange, open, onOpenChange, onImport, onExport, ...props }: EvaluationDatasetEditorProps) {
  const v = useControlled(value, defaultValue, onChange);
  const c = useControlled(compare, defaultCompare, onCompareChange);
  const o = useControlled<string | null>(open, null, onOpenChange);
  return h(RawEvaluationDatasetEditor, {
    ...props,
    ...(title !== undefined ? { heading: title } : {}),
    value: v.value,
    compare: c.value,
    open: o.value,
    onTcValueChange: (e: CustomEvent<EvaluationDatasetValueChange>) => v.handler(e.detail.value, e),
    onTcCompareChange: (e: CustomEvent<EvaluationDatasetCompareChange>) => c.handler(e.detail.compare, e),
    onTcOpenChange: (e: CustomEvent<EvaluationDatasetOpenChange>) => o.handler(e.detail.open, e),
    onTcImport: () => onImport?.(),
    onTcExport: (e: CustomEvent<EvaluationDatasetExport>) => onExport?.(e.detail.value, e.detail.jsonl),
  });
}
