import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcMessageActions, TcMessageText, type MessageReportDetail, type MessageVersionChange } from "../message-actions";
import { h, useStaged } from "./internal";

export type { FeedbackKind, MessageActionKey, MessageReportDetail, ReportReason } from "../message-actions";
export { defaultReportLabels } from "../message-actions";

const RawMessageActions = createComponent({
  tagName: "tc-message-actions",
  elementClass: TcMessageActions,
  react: React,
  events: {
    onTcVersionChange: "tc-version-change" as EventName<CustomEvent<MessageVersionChange>>,
    onTcCopy: "tc-copy" as EventName<CustomEvent<{ text?: string }>>,
    onTcSpeak: "tc-speak" as EventName<CustomEvent<{ playing: boolean }>>,
    onTcReport: "tc-report" as EventName<CustomEvent<MessageReportDetail>>,
    onTcReportUndo: "tc-report-undo" as EventName<CustomEvent<MessageReportDetail>>,
  },
});
type RawMessageActionsProps = React.ComponentProps<typeof RawMessageActions>;
export type MessageActionsProps = Omit<RawMessageActionsProps, "onTcVersionChange" | "onTcCopy" | "onTcSpeak" | "onTcFeedback" | "ownSpeech" | "onTcReport" | "onTcReportUndo"> & {
  /** Called with the version index picked in the switcher */
  onVersionChange?: (index: number) => void;
  /** Called once `text` is on the clipboard (or right away when there's no `text`). "Copied" shows only after a successful write */
  onCopy?: (text?: string) => void;
  /**
   * Called with true when Read aloud starts and false when it stops – play your audio here. Without it (and without
   * `speaking`) the browser's speech synthesis reads `text`
   */
  onSpeak?: (playing: boolean) => void;
  /** Called when a report is sent (with `reportable`). Return false to keep the form open – nothing is confirmed */
  onReport?: (report: MessageReportDetail) => void | boolean;
  /** Called when Undo withdraws a report */
  onReportUndo?: (report: MessageReportDetail) => void;
};
export function MessageActions({ version, onVersionChange, onCopy, onSpeak, onReport, onReportUndo, ...props }: MessageActionsProps) {
  return h(RawMessageActions, {
    ...props,
    version,
    ownSpeech: !!onSpeak,
    onTcVersionChange: (e: CustomEvent<MessageVersionChange>) => {
      // A given version is the parent's: report the pick, don't apply it
      if (version !== undefined) e.preventDefault();
      onVersionChange?.(e.detail.version);
    },
    onTcCopy: (e: CustomEvent<{ text?: string }>) => onCopy?.(e.detail.text),
    onTcSpeak: (e: CustomEvent<{ playing: boolean }>) => onSpeak?.(e.detail.playing),
    onTcReport: (e: CustomEvent<MessageReportDetail>) => {
      if (onReport?.(e.detail) === false) e.preventDefault();
    },
    onTcReportUndo: (e: CustomEvent<MessageReportDetail>) => onReportUndo?.(e.detail),
  });
}

const RawMessageText = createComponent({ tagName: "tc-message-text", elementClass: TcMessageText, react: React });
type RawMessageTextProps = React.ComponentProps<typeof RawMessageText>;
export type MessageTextProps = Omit<RawMessageTextProps, "content" | "children" | "version"> & {
  /** Which version is shown – a change crossfades to the new children */
  version: string | number;
  /** The message: text or any React content */
  children: React.ReactNode;
};
/** The message itself, crossfading when `version` changes */
export function MessageText({ children, ...props }: MessageTextProps) {
  const text = typeof children === "string" || typeof children === "number" ? String(children) : undefined;
  // One element is staged as it is; anything else in a box that doesn't affect layout
  const node = text !== undefined ? null : React.isValidElement(children) && children.type !== React.Fragment ? children : h("div", { style: { display: "contents" } }, children);
  const { stage, els } = useStaged(node ? [["content", node]] : []);
  return h(React.Fragment, null, stage, h(RawMessageText, { ...props, content: text ?? els.content ?? "" }));
}
