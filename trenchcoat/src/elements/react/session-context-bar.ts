import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcSessionContextBar, type SessionTermChange, type SessionTerm, type SessionTermEditDetail } from "../session-context-bar";
import { h } from "./internal";

export type { SessionTerm, SessionTermChange, SessionTermEditDetail, SessionTermTone } from "../session-context-bar";
export { SESSION_TERM_LABELS } from "../session-context-bar";

const RawSessionContextBar = createComponent({
  tagName: "tc-session-context-bar",
  elementClass: TcSessionContextBar,
  react: React,
  events: {
    onTcTermEdit: "tc-term-edit" as EventName<CustomEvent<SessionTermEditDetail>>,
    onTcTermsChanged: "tc-terms-changed" as EventName<CustomEvent<{ changes: SessionTermChange[] }>>,
  },
});
type RawSessionContextBarProps = React.ComponentProps<typeof RawSessionContextBar>;
export type SessionContextBarProps = Omit<RawSessionContextBarProps, "terms" | "onTcTermEdit" | "onTcTermsChanged"> & {
  /** The terms, in the order they show; the ones that don't fit go behind "+N more" */
  terms: SessionTerm[];
  /** Called when an editable term's chip is pressed, with the chip to anchor your editor to */
  onEdit?: (term: SessionTerm, anchor: HTMLElement) => void;
  /** Called after `terms` changes one or more values – the chips have flashed and the change is announced */
  onTermsChanged?: (changes: SessionTermChange[]) => void;
};

export function SessionContextBar({ terms, onEdit, onTermsChanged, ...props }: SessionContextBarProps) {
  return h(RawSessionContextBar, {
    ...props,
    terms,
    onTcTermEdit: (e: CustomEvent<SessionTermEditDetail>) => onEdit?.(e.detail.term, e.detail.anchor),
    onTcTermsChanged: (e: CustomEvent<{ changes: SessionTermChange[] }>) => onTermsChanged?.(e.detail.changes),
  });
}
