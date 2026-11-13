import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcQualityDrop,
  type QualityDropChatOpen,
  type QualityDropEvidence,
  type QualityDropInvestigate,
  type QualityDropRollback,
  type QualityDropStatus,
  type QualityDropStatusChange,
} from "../quality-drop";
import { h, useControlled } from "./internal";

export type {
  QualityDropCause,
  QualityDropChange,
  QualityDropConfidence,
  QualityDropEvidence,
  QualityDropPoint,
  QualityDropSegment,
  QualityDropStatus,
} from "../quality-drop";

const RawQualityDrop = createComponent({
  tagName: "tc-quality-drop",
  elementClass: TcQualityDrop,
  react: React,
  events: {
    onTcRollback: "tc-rollback" as EventName<CustomEvent<QualityDropRollback>>,
    onTcStatusChange: "tc-status-change" as EventName<CustomEvent<QualityDropStatusChange>>,
    onTcInvestigate: "tc-investigate" as EventName<CustomEvent<QualityDropInvestigate>>,
    onTcChatOpen: "tc-chat-open" as EventName<CustomEvent<QualityDropChatOpen>>,
  },
});
type RawQualityDropProps = React.ComponentProps<typeof RawQualityDrop>;

export type QualityDropProps = Omit<
  RawQualityDropProps,
  "heading" | "status" | "onTcRollback" | "onTcStatusChange" | "onTcInvestigate" | "onTcChatOpen" | "children"
> & {
  /** The heading */
  title?: string;
  /** "open", "rolled-back" or "dismissed". Controlled when defined */
  status?: QualityDropStatus;
  /** The status at first when `status` isn't controlled */
  defaultStatus?: QualityDropStatus;
  /** Called after a rollback, a dismissal or Undo, controlled or not */
  onStatusChange?: (status: QualityDropStatus) => void;
  /** Called when the rollback is confirmed, with the version to return to; return false to keep the card open */
  onRollback?: (version: string) => boolean | void;
  /** Called when Investigate is pressed */
  onInvestigate?: (criterion: string) => void;
  /** Called when a failing chat's quote is opened */
  onChatOpen?: (id: string, evidence: QualityDropEvidence) => void;
};

export function QualityDrop({ title = "Quality drop", status, defaultStatus = "open", onStatusChange, onRollback, onInvestigate, onChatOpen, ...props }: QualityDropProps) {
  const s = useControlled<QualityDropStatus>(status, defaultStatus, onStatusChange);
  return h(RawQualityDrop, {
    ...props,
    heading: title,
    status: s.value,
    onTcStatusChange: (e: CustomEvent<QualityDropStatusChange>) => s.handler(e.detail.status, e),
    onTcRollback: onRollback
      ? (e: CustomEvent<QualityDropRollback>) => {
          if (onRollback(e.detail.version) === false) e.preventDefault();
        }
      : undefined,
    onTcInvestigate: onInvestigate ? (e: CustomEvent<QualityDropInvestigate>) => onInvestigate(e.detail.criterion) : undefined,
    onTcChatOpen: onChatOpen ? (e: CustomEvent<QualityDropChatOpen>) => onChatOpen(e.detail.id, e.detail.evidence) : undefined,
  });
}
