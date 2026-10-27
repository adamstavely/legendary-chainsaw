import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcStructuredOutput, type StructuredOutputCollapsedChange, type StructuredOutputCopy, type StructuredOutputValidate } from "../structured-output";
import { h, useControlled } from "./internal";

export type {
  StructuredOutputCopy,
  StructuredOutputIssue,
  StructuredOutputIssueKind,
  StructuredOutputSchema,
  StructuredOutputSyntaxError,
  StructuredOutputType,
  StructuredOutputValidate,
} from "../structured-output";

const RawStructuredOutput = createComponent({
  tagName: "tc-structured-output",
  elementClass: TcStructuredOutput,
  react: React,
  events: {
    onTcCollapsedChange: "tc-collapsed-change" as EventName<CustomEvent<StructuredOutputCollapsedChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<StructuredOutputCopy>>,
    onTcValidate: "tc-validate" as EventName<CustomEvent<StructuredOutputValidate>>,
  },
});
type RawStructuredOutputProps = React.ComponentProps<typeof RawStructuredOutput>;
export type StructuredOutputProps = Omit<RawStructuredOutputProps, "heading" | "collapsed" | "onTcCollapsedChange" | "onTcCopy" | "onTcValidate" | "onCopy"> & {
  /** The heading, and the tree's accessible name */
  title?: string;
  /** JSON Pointer paths of folded branches, e.g. "/items/0" (controlled) */
  collapsed?: string[];
  /** Folded branches to start with when uncontrolled */
  defaultCollapsed?: string[];
  /** Called with the folded paths each time a branch is folded or opened */
  onCollapsedChange?: (collapsed: string[]) => void;
  /** Called after a copy, with the format ("json" or "ts") and the text that went to the clipboard */
  onCopy?: (format: "json" | "ts", text: string) => void;
  /** Called once the text settles (not streaming) with the check's result: valid, value, issues, syntax error */
  onValidate?: (result: StructuredOutputValidate) => void;
};

const NONE: string[] = [];

export function StructuredOutput({ title = "Output", collapsed, defaultCollapsed = NONE, onCollapsedChange, onCopy, onValidate, ...props }: StructuredOutputProps) {
  const c = useControlled(collapsed, defaultCollapsed, onCollapsedChange);
  return h(RawStructuredOutput, {
    ...props,
    heading: title,
    collapsed: c.value,
    onTcCollapsedChange: (e: CustomEvent<StructuredOutputCollapsedChange>) => c.handler(e.detail.collapsed, e),
    onTcCopy: (e: CustomEvent<StructuredOutputCopy>) => onCopy?.(e.detail.format, e.detail.text),
    onTcValidate: (e: CustomEvent<StructuredOutputValidate>) => onValidate?.(e.detail),
  });
}
