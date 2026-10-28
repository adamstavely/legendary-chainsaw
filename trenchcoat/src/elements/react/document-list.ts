import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcDocumentList, type DocumentOpen, type DocumentRecord, type DocumentRevealedChange } from "../document-list";
import { h, useControlled } from "./internal";

export type { DocumentOpen, DocumentRecord, DocumentRevealedChange, DocumentTone } from "../document-list";
export { defaultDocumentStatuses } from "../document-list";

const RawDocumentList = createComponent({
  tagName: "tc-document-list",
  elementClass: TcDocumentList,
  react: React,
  events: {
    onTcOpen: "tc-open" as EventName<CustomEvent<DocumentOpen>>,
    onTcRevealedChange: "tc-revealed-change" as EventName<CustomEvent<DocumentRevealedChange>>,
  },
});
type RawProps = React.ComponentProps<typeof RawDocumentList>;
type Owned = "heading" | "revealed" | "onTcOpen" | "onTcRevealedChange" | "children";
export type DocumentListProps = Omit<RawProps, Owned> & {
  /** The heading */
  title?: string;
  /** The ids whose numbers are shown – controlled when given */
  revealed?: string[];
  /** The ids shown on mount when `revealed` isn't controlled */
  defaultRevealed?: string[];
  /** A number was shown or masked again; `revealed` is the new list */
  onRevealedChange?: (revealed: string[]) => void;
  /** View was pressed on a row */
  onOpen?: (document: DocumentRecord) => void;
};

const NONE: string[] = [];

export function DocumentList({ title, revealed, defaultRevealed = NONE, onRevealedChange, onOpen, ...props }: DocumentListProps) {
  const r = useControlled<string[]>(revealed, defaultRevealed, onRevealedChange);
  return h(RawDocumentList, {
    ...props,
    heading: title ?? "Documents",
    revealed: r.value,
    onTcRevealedChange: (e: CustomEvent<DocumentRevealedChange>) => r.handler(e.detail.revealed, e),
    onTcOpen: (e: CustomEvent<DocumentOpen>) => onOpen?.(e.detail.document),
  });
}
