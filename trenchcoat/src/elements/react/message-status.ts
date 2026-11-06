import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMessageStatus, type MessageStatusCopy, type MessageStatusRetry } from "../message-status";
import { h } from "./internal";

export type { MessageReceipt, MessageStatusAction, MessageStatusCopy, MessageStatusLabels, MessageStatusRetry } from "../message-status";
export { defaultMessageStatusLabels, relativeMessageTime } from "../message-status";

const RawMessageStatus = createComponent({
  tagName: "tc-message-status",
  elementClass: TcMessageStatus,
  react: React,
  events: {
    onTcCopy: "tc-copy" as EventName<CustomEvent<MessageStatusCopy>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<MessageStatusRetry>>,
    onTcBranch: "tc-branch" as EventName<CustomEvent<Record<string, never>>>,
    onTcEdit: "tc-edit" as EventName<CustomEvent<Record<string, never>>>,
  },
});
type RawMessageStatusProps = React.ComponentProps<typeof RawMessageStatus>;
export type MessageStatusProps = Omit<RawMessageStatusProps, "onTcCopy" | "onTcBranch" | "onTcEdit" | "children"> & {
  /** Called once `text` is on the clipboard (or right away when there's no `text`) */
  onCopyText?: (text?: string) => void;
  /** Called when Branch into a new chat is pressed */
  onBranch?: () => void;
  /** Called when Edit is pressed */
  onEdit?: () => void;
};

/** The row under a sent message: read receipt, relative time, and Copy, Send again, Branch and Edit */
export function MessageStatus({ onCopyText, onBranch, onEdit, ...props }: MessageStatusProps) {
  return h(RawMessageStatus, {
    ...props,
    onTcCopy: (e: CustomEvent<MessageStatusCopy>) => onCopyText?.(e.detail.text),
    onTcBranch: () => onBranch?.(),
    onTcEdit: () => onEdit?.(),
  });
}
