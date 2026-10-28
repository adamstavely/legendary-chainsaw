import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcFileSummary, type FileSummaryCiteOpen, type FileSummaryEntity, type FileSummaryLength, type FileSummaryLengthChange, type FileSummaryRetry } from "../file-summary";
import { h, useControlled } from "./internal";

export type { FileSummaryEntity, FileSummaryEntityKind, FileSummaryFile, FileSummaryKind, FileSummaryLength, FileSummaryPoint, FileSummaryRef, FileSummaryStatus } from "../file-summary";
export { fileSummaryKind } from "../file-summary";

const RawFileSummary = createComponent({
  tagName: "tc-file-summary",
  elementClass: TcFileSummary,
  react: React,
  events: {
    onTcSummarise: "tc-summarise" as EventName<CustomEvent<null>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<FileSummaryRetry>>,
    onTcLengthChange: "tc-length-change" as EventName<CustomEvent<FileSummaryLengthChange>>,
    onTcCiteOpen: "tc-cite-open" as EventName<CustomEvent<FileSummaryCiteOpen>>,
    onTcEntitySelect: "tc-entity-select" as EventName<CustomEvent<{ entity: FileSummaryEntity }>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<{ text: string }>>,
    onTcOpen: "tc-open" as EventName<CustomEvent<null>>,
  },
});
type RawProps = React.ComponentProps<typeof RawFileSummary>;
type Owned = "length" | "onCopy" | "children" | "onTcSummarise" | "onTcRetry" | "onTcLengthChange" | "onTcCiteOpen" | "onTcEntitySelect" | "onTcCopy" | "onTcOpen";
export type FileSummaryProps = Omit<RawProps, Owned> & {
  /** Short or detailed – controlled when given */
  length?: FileSummaryLength;
  /** The length on mount when `length` isn't controlled */
  defaultLength?: FileSummaryLength;
  /** Short or Detailed was picked – summarise again */
  onLengthChange?: (length: FileSummaryLength) => void;
  /** Summarise was pressed – start summarising */
  onSummarise?: () => void;
  /** Regenerate, or Retry after an error */
  onRetry?: (reason: FileSummaryRetry["reason"]) => void;
  /** A citation chip was used; return false to keep a link to the file from opening (jump inside your own viewer) */
  onCiteOpen?: (cite: FileSummaryCiteOpen) => boolean | void;
  /** A person, organisation, date or amount was picked */
  onEntitySelect?: (entity: FileSummaryEntity) => void;
  /** Called with the copied text once the summary is on the clipboard */
  onCopy?: (text: string) => void;
  /** Open file was used; return false to keep the link from opening */
  onOpen?: () => boolean | void;
};

export function FileSummary({ length, defaultLength = "short", onLengthChange, onSummarise, onRetry, onCiteOpen, onEntitySelect, onCopy, onOpen, ...props }: FileSummaryProps) {
  const l = useControlled<FileSummaryLength>(length, defaultLength, onLengthChange);
  return h(RawFileSummary, {
    ...props,
    length: l.value,
    onTcLengthChange: (e: CustomEvent<FileSummaryLengthChange>) => l.handler(e.detail.length, e),
    onTcSummarise: () => onSummarise?.(),
    onTcRetry: (e: CustomEvent<FileSummaryRetry>) => onRetry?.(e.detail.reason),
    onTcCiteOpen: (e: CustomEvent<FileSummaryCiteOpen>) => {
      if (onCiteOpen?.(e.detail) === false) e.preventDefault();
    },
    onTcEntitySelect: (e: CustomEvent<{ entity: FileSummaryEntity }>) => onEntitySelect?.(e.detail.entity),
    onTcCopy: (e: CustomEvent<{ text: string }>) => onCopy?.(e.detail.text),
    onTcOpen: (e: CustomEvent<null>) => {
      if (onOpen?.() === false) e.preventDefault();
    },
  });
}
