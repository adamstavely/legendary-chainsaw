import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import {
  TcMultimodalInput,
  type MultimodalAttachment,
  type MultimodalChange,
  type MultimodalReject,
  type MultimodalRejection,
  type MultimodalRetry,
  type MultimodalSend,
  type MultimodalTextChange,
  type MultimodalValueChange,
} from "../multimodal-input";
import { h, useControlled } from "./internal";

export type { MultimodalAttachment, MultimodalChange, MultimodalFile, MultimodalKind, MultimodalRejection, MultimodalStatus } from "../multimodal-input";
export { formatBytes, multimodalKind } from "../multimodal-input";

const RawMultimodalInput = createComponent({
  tagName: "tc-multimodal-input",
  elementClass: TcMultimodalInput,
  react: React,
  events: {
    onTcValueChange: "tc-value-change" as EventName<CustomEvent<MultimodalValueChange>>,
    onTcTextChange: "tc-text-change" as EventName<CustomEvent<MultimodalTextChange>>,
    onTcSend: "tc-send" as EventName<CustomEvent<MultimodalSend>>,
    onTcRetry: "tc-retry" as EventName<CustomEvent<MultimodalRetry>>,
    onTcReject: "tc-reject" as EventName<CustomEvent<MultimodalReject>>,
  },
});

type RawProps = React.ComponentProps<typeof RawMultimodalInput>;
type Owned = "value" | "defaultValue" | "text" | "onChange" | "onTcValueChange" | "onTcTextChange" | "onTcSend" | "onTcRetry" | "onTcReject" | "addFiles" | "children";
export type MultimodalInputProps = Omit<RawProps, Owned> & {
  /** The attachments – controlled when given */
  value?: MultimodalAttachment[];
  /** The attachments on mount when `value` isn't controlled */
  defaultValue?: MultimodalAttachment[];
  /** The attachments changed; `change.files` holds the new File objects to upload */
  onChange?: (value: MultimodalAttachment[], change: MultimodalChange) => void;
  /** The message – controlled when given */
  text?: string;
  /** The message on mount when `text` isn't controlled */
  defaultText?: string;
  /** The message was edited */
  onTextChange?: (text: string) => void;
  /** Send was pressed, or Enter in the message; the box then clears unless it's controlled */
  onSend?: (text: string, attachments: MultimodalAttachment[]) => void;
  /** Retry was pressed on an attachment that failed; `file` when it was added in this box */
  onRetry?: (attachment: MultimodalAttachment, file?: File) => void;
  /** Files were turned away, with the reasons */
  onReject?: (rejections: MultimodalRejection[]) => void;
};
const NONE: MultimodalAttachment[] = [];

export function MultimodalInput({ value, defaultValue = NONE, onChange, text, defaultText = "", onTextChange, onSend, onRetry, onReject, ...props }: MultimodalInputProps) {
  const lastChange = React.useRef<MultimodalChange>({ type: "clear" });
  const changed = React.useCallback((next: MultimodalAttachment[]) => onChange?.(next, lastChange.current), [onChange]);
  const v = useControlled(value, defaultValue, changed);
  const t = useControlled(text, defaultText, onTextChange);
  return h(RawMultimodalInput, {
    ...props,
    value: v.value,
    text: t.value,
    onTcValueChange: (e: CustomEvent<MultimodalValueChange>) => {
      lastChange.current = e.detail.change;
      v.handler(e.detail.value, e);
    },
    onTcTextChange: (e: CustomEvent<MultimodalTextChange>) => t.handler(e.detail.text, e),
    onTcSend: (e: CustomEvent<MultimodalSend>) => onSend?.(e.detail.text, e.detail.attachments),
    onTcRetry: (e: CustomEvent<MultimodalRetry>) => onRetry?.(e.detail.attachment, e.detail.file),
    onTcReject: (e: CustomEvent<MultimodalReject>) => onReject?.(e.detail.rejections),
  });
}
