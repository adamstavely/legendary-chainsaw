import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRunReceipt, type RunReceiptCopy, type RunReceiptDownload, type RunReceiptTraceOpen } from "../run-receipt";
import { h } from "./internal";

export type { RunReceiptCopy, RunReceiptCount, RunReceiptDownload, RunReceiptLabels, RunReceiptModel, RunReceiptStatus, RunReceiptStep, RunReceiptTool, RunReceiptTotals, RunReceiptTraceOpen } from "../run-receipt";
export { defaultRunReceiptLabels, receiptCsv, receiptTotals } from "../run-receipt";

const RawRunReceipt = createComponent({
  tagName: "tc-run-receipt",
  elementClass: TcRunReceipt,
  react: React,
  events: {
    onTcCopy: "tc-copy" as EventName<CustomEvent<RunReceiptCopy>>,
    onTcTraceOpen: "tc-trace-open" as EventName<CustomEvent<RunReceiptTraceOpen>>,
    onTcDownload: "tc-download" as EventName<CustomEvent<RunReceiptDownload>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRunReceipt>;
type Owned = "heading" | "onTcCopy" | "onTcTraceOpen" | "onTcDownload" | "children";
export type RunReceiptProps = Omit<RawProps, Owned> & {
  /** The heading; "" leaves the header out */
  title?: string;
  /** The run ID's copy button was pressed; return false to write the clipboard yourself */
  onCopyRunId?: (text: string) => void | boolean;
  /** Open trace was pressed */
  onTraceOpen?: (runId: string) => void;
  /** Download CSV was pressed; return false to save the file yourself */
  onDownload?: (csv: string, filename: string) => void | boolean;
};

export function RunReceipt({ title = "Run receipt", onCopyRunId, onTraceOpen, onDownload, ...props }: RunReceiptProps) {
  return h(RawRunReceipt, {
    ...props,
    heading: title,
    onTcCopy: (e: CustomEvent<RunReceiptCopy>) => {
      if (onCopyRunId?.(e.detail.text) === false) e.preventDefault();
    },
    onTcTraceOpen: (e: CustomEvent<RunReceiptTraceOpen>) => onTraceOpen?.(e.detail.runId),
    onTcDownload: (e: CustomEvent<RunReceiptDownload>) => {
      if (onDownload?.(e.detail.csv, e.detail.filename) === false) e.preventDefault();
    },
  });
}
